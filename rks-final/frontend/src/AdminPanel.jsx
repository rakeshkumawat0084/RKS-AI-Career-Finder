import { useState, useEffect, useCallback } from "react";

// ─── Backend API Base URL ─────────────────────────────────────────────────────
// Set REACT_APP_API_URL in frontend/.env
// NEVER put passwords or secrets here — all auth is handled by backend
const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

// ─── Token helpers — JWT stored in sessionStorage ─────────────────────────────
const TOKEN_KEY = "rks_admin_jwt";
const getToken  = () => sessionStorage.getItem(TOKEN_KEY);
const setToken  = (t) => sessionStorage.setItem(TOKEN_KEY, t);
const clearToken = () => sessionStorage.removeItem(TOKEN_KEY);

// ─── API HELPERS (auto-attach JWT to protected requests) ─────────────────────
const api = {
  get: (path) => fetch(`${API_URL}${path}`, {
    headers: { Authorization: `Bearer ${getToken()}` }
  }).then(r => r.json()),

  post: (path, body, auth = false) => fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(auth ? { Authorization: `Bearer ${getToken()}` } : {}),
    },
    body: JSON.stringify(body),
  }).then(r => r.json()),

  patch: (path) => fetch(`${API_URL}${path}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${getToken()}` },
  }).then(r => r.json()),

  delete: (path) => fetch(`${API_URL}${path}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${getToken()}` },
  }).then(r => r.json()),
};

// ─── EXPORTED: Save lead to MongoDB via API (public route — no auth) ──────────
export const saveLeadToStorage = async (leadData) => {
  try {
    await api.post("/api/leads", leadData, false);
  } catch (e) {
    // Fallback localStorage when backend offline
    const ex = JSON.parse(localStorage.getItem("rks_leads") || "[]");
    ex.push({ id: Date.now(), timestamp: new Date().toISOString(), date: new Date().toLocaleDateString("en-IN"), time: new Date().toLocaleTimeString("en-IN"), ...leadData });
    localStorage.setItem("rks_leads", JSON.stringify(ex));
  }
};

// ─── EXPORTED: Track visit (public route — no auth) ──────────────────────────
export const saveVisitToStorage = async () => {
  try {
    await api.post("/api/visitors/track", {}, false);
  } catch (e) {
    const today = new Date().toLocaleDateString("en-IN");
    const v = JSON.parse(localStorage.getItem("rks_visits") || "{}");
    v[today] = (v[today] || 0) + 1;
    localStorage.setItem("rks_visits", JSON.stringify(v));
  }
};

// ─── EXPORTED: Save contact message (public route — no auth) ─────────────────
export const saveContactToStorage = async (msg) => {
  try {
    await api.post("/api/messages", msg, false);
  } catch (e) {
    const ex = JSON.parse(localStorage.getItem("rks_contacts") || "[]");
    ex.push({ id: Date.now(), timestamp: new Date().toISOString(), date: new Date().toLocaleDateString("en-IN"), ...msg });
    localStorage.setItem("rks_contacts", JSON.stringify(ex));
  }
};

// ─── MINI CHARTS ─────────────────────────────────────────────────────────────
const BarChart = ({ data, color = "#3b82f6", height = 90 }) => {
  const max = Math.max(...data.map(d => d.v || d.count || 0), 1);
  return (
    <div style={{ display:"flex", alignItems:"flex-end", gap:5, height, padding:"0 2px" }}>
      {data.map((d, i) => {
        const v = d.v || d.count || 0;
        return (
          <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
            <div style={{ width:"100%", height:`${(v/max)*70}px`, minHeight:v>0?4:0, background:color, borderRadius:"4px 4px 0 0", transition:"height 0.8s ease", opacity:0.85 }}/>
            <div style={{ fontSize:9, color:"var(--text2)", whiteSpace:"nowrap", overflow:"hidden", maxWidth:"100%", textAlign:"center" }}>{d.l || d.label}</div>
          </div>
        );
      })}
    </div>
  );
};

const DonutChart = ({ segments, size=120 }) => {
  const total = segments.reduce((a,s) => a+s.v, 0) || 1;
  const r=45, cx=60, cy=60, circ=2*Math.PI*r;
  let offset = 0;
  return (
    <svg width={size} height={size} viewBox="0 0 120 120">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--border)" strokeWidth="14"/>
      {segments.map((s,i) => {
        const dash=(s.v/total)*circ, gap=circ-dash;
        const el = <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={s.color} strokeWidth="14" strokeDasharray={`${dash} ${gap}`} strokeDashoffset={-offset} style={{ transform:"rotate(-90deg)", transformOrigin:"60px 60px" }}/>;
        offset += dash; return el;
      })}
      <text x="60" y="55" textAnchor="middle" fill="var(--text)" fontSize="16" fontWeight="800">{total}</text>
      <text x="60" y="70" textAnchor="middle" fill="var(--text2)" fontSize="9">TOTAL</text>
    </svg>
  );
};

// ─── CONNECTION STATUS BADGE ──────────────────────────────────────────────────
const DBStatus = ({ status }) => (
  <div style={{ display:"flex", alignItems:"center", gap:6, padding:"4px 12px", borderRadius:20, background: status==="connected"?"rgba(16,185,129,0.1)":status==="checking"?"rgba(245,158,11,0.1)":"rgba(239,68,68,0.1)", border:`1px solid ${status==="connected"?"rgba(16,185,129,0.3)":status==="checking"?"rgba(245,158,11,0.3)":"rgba(239,68,68,0.3)"}`, fontSize:12, fontWeight:700, color:status==="connected"?"#10b981":status==="checking"?"#f59e0b":"#ef4444" }}>
    <div style={{ width:7, height:7, borderRadius:"50%", background:"currentColor", animation:status==="checking"?"pulse 1s infinite":"none" }}/>
    {status==="connected"?"MongoDB Connected":status==="checking"?"Connecting...":"Backend Offline"}
  </div>
);

// ─── ADMIN LOGIN — credentials verified by backend JWT ────────────────────────
// NO passwords stored in frontend code. All auth via /api/auth/login
const AdminLogin = ({ onLogin }) => {
  const [mode, setMode]       = useState("login");
  const [user, setUser]       = useState("");
  const [pass, setPass]       = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr]         = useState("");
  const [success, setOk]      = useState("");
  // Forgot password
  const [answer, setAnswer]   = useState("");
  const [newPass, setNewPass] = useState("");
  const [showNew, setShowNew] = useState(false);
  // UI lockout (mirrors backend rate-limit)
  const [attempts, setAttempts] = useState(0);
  const [locked, setLocked]     = useState(false);
  const [lockTimer, setLockTimer] = useState(0);

  useEffect(() => {
    if (!locked) return;
    const t = setInterval(() => setLockTimer(p => {
      if (p <= 1) { setLocked(false); setAttempts(0); clearInterval(t); return 0; }
      return p - 1;
    }), 1000);
    return () => clearInterval(t);
  }, [locked]);

  const showErr = m => { setErr(m);  setTimeout(() => setErr(""),  5000); };
  const showOk  = m => { setOk(m);   setTimeout(() => setOk(""),   5000); };

  // ── Login: call backend /api/auth/login → receive JWT ──────────────────────
  const handleLogin = async () => {
    if (locked || loading) return;
    if (!user.trim() || !pass.trim()) { showErr("Please fill both fields."); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: user.trim(), password: pass }),
      }).then(r => r.json());

      if (res.success && res.token) {
        setToken(res.token);
        onLogin(res.token);
      } else {
        const n = attempts + 1;
        setAttempts(n);
        if (n >= 5) { setLocked(true); setLockTimer(30); showErr("Too many attempts. Locked 30s."); }
        else showErr(res.message || `Invalid credentials. ${5 - n} attempts left.`);
      }
    } catch {
      showErr("Cannot reach server. Is the backend running?");
    }
    setLoading(false);
  };

  // ── Forgot: call backend /api/auth/forgot → verify answer ─────────────────
  const handleForgot = async () => {
    if (!answer.trim()) { showErr("Please answer the security question."); return; }
    if (!newPass || newPass.length < 6) { showErr("New password must be 6+ characters."); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/forgot`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answer: answer.trim() }),
      }).then(r => r.json());

      if (res.success) {
        showOk("Answer correct! Update ADMIN_PASSWORD in backend .env, then login.");
        setMode("login"); setAnswer(""); setNewPass("");
      } else {
        showErr(res.message || "Wrong answer.");
      }
    } catch {
      showErr("Cannot reach server.");
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight:"100vh", background:"var(--bg)", display:"flex", alignItems:"center", justifyContent:"center", padding:24, position:"relative", overflow:"hidden" }}>
      <div style={{ position:"absolute", inset:0, background:"radial-gradient(ellipse at 30% 50%,rgba(59,130,246,0.1),transparent 60%),radial-gradient(ellipse at 70% 30%,rgba(139,92,246,0.1),transparent 60%)" }}/>
      <div className="glass" style={{ width:"100%", maxWidth:420, padding:40, position:"relative", animation:"scaleIn 0.4s ease" }}>
        <div style={{ textAlign:"center", marginBottom:32 }}>
          <div style={{ width:60, height:60, borderRadius:16, background:"var(--grad)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:28, margin:"0 auto 16px" }}>🔐</div>
          <h2 style={{ fontWeight:900, fontSize:24, marginBottom:4 }}>{mode==="login"?"Admin Access":"Reset Password"}</h2>
          <p style={{ color:"var(--text2)", fontSize:13 }}>RKS CODE — Restricted Area</p>
        </div>

        {err     && <div style={{ background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.3)", borderRadius:10, padding:"11px 16px", marginBottom:18, color:"#ef4444", fontSize:13, fontWeight:600, display:"flex", gap:8 }}><span>⚠️</span>{err}</div>}
        {success && <div style={{ background:"rgba(16,185,129,0.1)", border:"1px solid rgba(16,185,129,0.3)", borderRadius:10, padding:"11px 16px", marginBottom:18, color:"#10b981", fontSize:13, fontWeight:600, display:"flex", gap:8 }}><span>✅</span>{success}</div>}
        {locked  && <div style={{ background:"rgba(245,158,11,0.1)", border:"1px solid rgba(245,158,11,0.3)", borderRadius:10, padding:"11px 16px", marginBottom:18, color:"#f59e0b", fontSize:13, fontWeight:600, textAlign:"center" }}>🔒 Locked — retry in {lockTimer}s</div>}

        {mode==="login" && <>
          <div style={{ marginBottom:18 }}>
            <label style={{ display:"block", marginBottom:7, fontWeight:600, fontSize:12, color:"var(--text2)", textTransform:"uppercase", letterSpacing:1 }}>Username</label>
            <input className="search-input" style={{ paddingLeft:16, borderRadius:10 }} placeholder="Enter username" value={user} autoComplete="username" onChange={e=>setUser(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleLogin()} disabled={locked||loading}/>
          </div>
          <div style={{ marginBottom:10 }}>
            <label style={{ display:"block", marginBottom:7, fontWeight:600, fontSize:12, color:"var(--text2)", textTransform:"uppercase", letterSpacing:1 }}>Password</label>
            <div style={{ position:"relative" }}>
              <input className="search-input" style={{ paddingLeft:16, paddingRight:44, borderRadius:10 }} placeholder="Enter password" type={showPass?"text":"password"} value={pass} autoComplete="current-password" onChange={e=>setPass(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleLogin()} disabled={locked||loading}/>
              <button onClick={()=>setShowPass(s=>!s)} style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:"var(--text2)", fontSize:17, padding:4 }} tabIndex={-1}>{showPass?"🙈":"👁️"}</button>
            </div>
          </div>
          <div style={{ textAlign:"right", marginBottom:24 }}>
            <button onClick={()=>{setMode("forgot");setErr("");setOk("");}} style={{ background:"none", border:"none", color:"var(--accent1)", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"'Sora',sans-serif" }}>Forgot Password?</button>
          </div>
          <button className="btn-primary" style={{ width:"100%", padding:"14px", fontSize:15, display:"flex", alignItems:"center", justifyContent:"center", gap:10 }} onClick={handleLogin} disabled={locked||loading}>
            {loading ? <><div style={{ width:16, height:16, border:"2px solid rgba(255,255,255,0.3)", borderTopColor:"#fff", borderRadius:"50%", animation:"spin 0.8s linear infinite" }}/> Verifying...</> : locked ? `🔒 Locked (${lockTimer}s)` : "Login →"}
          </button>
        </>}

        {mode==="forgot" && <>
          <div style={{ background:"rgba(59,130,246,0.06)", border:"1px solid rgba(59,130,246,0.2)", borderRadius:10, padding:"12px 16px", marginBottom:22, fontSize:13, color:"var(--text2)", lineHeight:1.5 }}>
            🔑 <strong style={{ color:"var(--text)" }}>Security Question:</strong><br/>What is the name of this platform? (lowercase)
          </div>
          <div style={{ marginBottom:18 }}>
            <label style={{ display:"block", marginBottom:7, fontWeight:600, fontSize:12, color:"var(--text2)", textTransform:"uppercase", letterSpacing:1 }}>Your Answer</label>
            <input className="search-input" style={{ paddingLeft:16, borderRadius:10 }} placeholder="Type answer..." value={answer} onChange={e=>setAnswer(e.target.value)} disabled={loading}/>
          </div>
          <div style={{ marginBottom:24 }}>
            <label style={{ display:"block", marginBottom:7, fontWeight:600, fontSize:12, color:"var(--text2)", textTransform:"uppercase", letterSpacing:1 }}>New Password (for reference)</label>
            <div style={{ position:"relative" }}>
              <input className="search-input" style={{ paddingLeft:16, paddingRight:44, borderRadius:10 }} placeholder="Min. 6 characters" type={showNew?"text":"password"} value={newPass} onChange={e=>setNewPass(e.target.value)} disabled={loading}/>
              <button onClick={()=>setShowNew(s=>!s)} style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:"var(--text2)", fontSize:17, padding:4 }} tabIndex={-1}>{showNew?"🙈":"👁️"}</button>
            </div>
          </div>
          <div style={{ display:"flex", gap:10 }}>
            <button className="btn-ghost" style={{ flex:1, padding:"13px" }} onClick={()=>{setMode("login");setErr("");setOk("");}} disabled={loading}>← Back</button>
            <button className="btn-primary" style={{ flex:2, padding:"13px", display:"flex", alignItems:"center", justifyContent:"center", gap:8 }} onClick={handleForgot} disabled={loading}>
              {loading ? <><div style={{ width:14, height:14, border:"2px solid rgba(255,255,255,0.3)", borderTopColor:"#fff", borderRadius:"50%", animation:"spin 0.8s linear infinite" }}/> Checking...</> : "Verify Answer"}
            </button>
          </div>
        </>}
      </div>
    </div>
  );
};

// ─── ADMIN DASHBOARD ──────────────────────────────────────────────────────────
const AdminDashboard = ({ onLogout }) => {
  const [tab, setTab]           = useState("dashboard");
  const [leads, setLeads]       = useState([]);
  const [messages, setMessages] = useState([]);
  const [visitorData, setVisitorData] = useState({ data:[], total:0, todayVisits:0, last14:[] });
  const [stats, setStats]       = useState(null);
  const [loading, setLoading]   = useState(false);
  const [dbStatus, setDbStatus] = useState("checking");
  const [search, setSearch]     = useState("");
  const [filterStream, setFilterStream] = useState("all");
  const [expandedLead, setExpandedLead] = useState(null);
  const [sidebarOpen, setSidebarOpen]   = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [toast, setToast] = useState(null);
  const [sortOrder, setSortOrder] = useState("newest");
  // Email compose modal
  const [emailModal, setEmailModal] = useState(null); // { to, name, subject, body, type }
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");

  const STREAM_LABELS = { "sci-math":"Science (Maths)", "sci-bio":"Science (Biology)", commerce:"Commerce", arts:"Arts", agriculture:"Agriculture", cs:"Computer Science", diploma:"Diploma/ITI" };
  const STREAM_COLORS = { "sci-math":"#3b82f6", "sci-bio":"#10b981", commerce:"#f59e0b", arts:"#ec4899", agriculture:"#84cc16", cs:"#8b5cf6", diploma:"#f97316" };
  const STREAM_SHORT  = { "sci-math":"Sci-Math", "sci-bio":"Sci-Bio", commerce:"Commerce", arts:"Arts", agriculture:"Agri", cs:"CS", diploma:"Diploma" };

  const notify = (msg, type="success") => { setToast({msg,type}); setTimeout(()=>setToast(null),3000); };

  // Open email compose modal
  const openEmail = (person, type = "lead") => {
    const subject = type === "reply"
      ? `Re: Your message to RKS CODE`
      : `Your Career Recommendation from RKS CODE — ${person.name||""}`;

    const body = type === "reply"
      ? `Hi ${person.name||"there"},\n\nThank you for reaching out to us!\n\nRegarding your message:\n"${person.msg||""}"\n\n[Write your reply here...]\n\nBest regards,\nRKS CODE Team\nrkscode.support@gmail.com\nrkscode.in`
      : `Hi ${person.name||"there"},\n\nThank you for using RKS CODE — AI Career Finder!\n\nBased on your profile:\n• Stream: ${person.stream ? ({"sci-math":"Science (Maths)","sci-bio":"Science (Biology)",commerce:"Commerce",arts:"Arts",agriculture:"Agriculture",cs:"Computer Science",diploma:"Diploma/ITI"}[person.stream]||person.stream) : "—"}\n• Education: ${person.edu||"—"}\n• Career Goal: ${person.goal||"—"}\n\nHere are your top career recommendations:\n1. [Career 1]\n2. [Career 2]\n3. [Career 3]\n\nVisit us again: http://localhost:3000\n\nBest regards,\nRKS CODE Team\nrkscode.support@gmail.com`;

    setEmailSubject(subject);
    setEmailBody(body);
    setEmailModal({ to: person.email, name: person.name, type, id: person._id||person.id, msgObj: person });
  };

  // Send email via backend (Nodemailer + Gmail)
  const [emailSending, setEmailSending] = useState(false);
  const [emailStatus, setEmailStatus]   = useState(null); // null | "success" | "error"

  const sendEmail = async () => {
    if (!emailModal || !emailSubject.trim() || !emailBody.trim()) {
      notify("Subject aur Message dono required hain","warn"); return;
    }
    setEmailSending(true);
    setEmailStatus(null);
    try {
      const res = await api.post("/api/email/send", {
        to:     emailModal.to,
        toName: emailModal.name,
        subject: emailSubject,
        body:   emailBody,
        type:   emailModal.type,
      }, true);

      if (res.success) {
        setEmailStatus("success");
        notify(`✅ Email successfully sent to ${emailModal.to}!`);
        // Mark message as read if it's a reply
        if (emailModal.type === "reply" && emailModal.id) markMsgRead(emailModal.id);
        setTimeout(() => { setEmailModal(null); setEmailStatus(null); }, 1800);
      } else {
        setEmailStatus("error");
        notify(res.message || "Email send failed", "error");
      }
    } catch (err) {
      setEmailStatus("error");
      notify("Backend se connect nahi ho paya. Server chal raha hai?", "error");
    }
    setEmailSending(false);
  };

  // ── Load all data ──────────────────────────────────────────────────────────
  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      // Check backend health first
      const health = await fetch(`${API_URL}/api/health`)
        .then(r => r.json())
        .catch(() => null);

      setDbStatus(health?.status === "ok" ? "connected" : "offline");

      if (!health || health.status !== "ok") {
        throw new Error("Backend offline");
      }

      // Fetch all data in parallel — all protected routes need JWT
      const [leadsRes, msgsRes, visRes, statsRes] = await Promise.all([
        api.get(`/api/leads?sort=${sortOrder}&search=${encodeURIComponent(search)}&stream=${filterStream}`),
        api.get("/api/messages"),
        api.get("/api/visitors"),
        api.get("/api/leads/stats"),
      ]);

      // Check for auth errors
      if (leadsRes.message === "No token. Please login." ||
          leadsRes.message === "Session expired. Please login again.") {
        clearToken();
        window.location.reload();
        return;
      }

      if (leadsRes.success)  setLeads(leadsRes.data || []);
      if (msgsRes.success)   setMessages(msgsRes.data || []);
      if (visRes.success)    setVisitorData(visRes);
      if (statsRes.success)  setStats(statsRes.data);

    } catch (e) {
      setDbStatus("offline");
      // Fallback to localStorage when backend is offline
      try {
        const localLeads = JSON.parse(localStorage.getItem("rks_leads") || "[]");
        const localMsgs  = JSON.parse(localStorage.getItem("rks_contacts") || "[]");
        setLeads([...localLeads].reverse());
        setMessages([...localMsgs].reverse());
      } catch (_) {}
    }
    setLoading(false);
  }, [search, filterStream, sortOrder]);

  useEffect(() => { loadAll(); }, [loadAll]);
  useEffect(() => { const t=setInterval(loadAll,15000); return ()=>clearInterval(t); }, [loadAll]);

  // ── Actions ────────────────────────────────────────────────────────────────
  const deleteLead = async (id) => {
    try {
      const res = await api.delete(`/api/leads/${id}`);
      if (res.success) { notify("Lead deleted"); setDeleteConfirm(null); loadAll(); }
      else notify(res.message||"Error","error");
    } catch(e) { notify("Backend offline — deleted locally","warn"); }
  };

  const deleteAllLeads = async () => {
    try {
      await api.delete("/api/leads");
      notify("All leads deleted"); setDeleteConfirm(null); loadAll();
    } catch(e) { notify("Error","error"); }
  };

  const deleteMessage = async (id) => {
    try {
      await api.delete(`/api/messages/${id}`);
      notify("Message deleted"); loadAll();
    } catch(e) { notify("Error","error"); }
  };

  const markLeadRead = async (id) => {
    try { await api.patch(`/api/leads/${id}/read`); loadAll(); } catch(e) {}
  };

  const markMsgRead = async (id) => {
    try { await api.patch(`/api/messages/${id}/read`); loadAll(); } catch(e) {}
  };

  const exportCSV = () => {
    if (leads.length===0) { notify("No leads to export","warn"); return; }
    const header = "Name,Email,Stream,Education,Work Type,Goal,Salary Exp,Skills,Date\n";
    const rows = leads.map(l =>
      `"${l.name||""}","${l.email||""}","${STREAM_LABELS[l.stream]||l.stream||""}","${l.edu||""}","${l.workType||""}","${l.goal||""}","₹${l.salary||""}L","${(l.skills||[]).join("|")}","${new Date(l.createdAt||l.timestamp).toLocaleDateString("en-IN")}"`
    ).join("\n");
    const blob = new Blob([header+rows],{type:"text/csv"});
    const a = document.createElement("a"); a.href=URL.createObjectURL(blob); a.download=`rks_leads_${Date.now()}.csv`; a.click();
    notify("CSV exported!");
  };

  // ── Computed ───────────────────────────────────────────────────────────────
  const today = new Date().toLocaleDateString("en-IN");
  const todayLeads = leads.filter(l => new Date(l.createdAt||l.timestamp).toLocaleDateString("en-IN")===today).length;
  const unread = messages.filter(m => !m.isRead).length;
  const conversion = visitorData.total>0 ? Math.round((leads.length/visitorData.total)*100) : 0;

  const streamBreakdown = stats?.streamBreakdown || [];
  const donutSegs = streamBreakdown.map(s => ({ label:STREAM_SHORT[s._id]||s._id, v:s.count, color:STREAM_COLORS[s._id]||"#666" }));
  const last7Leads = stats?.last7 || [];
  const last7Visits = visitorData.last14?.slice(-7) || [];

  const NAV = [
    { id:"dashboard", icon:"📊", label:"Dashboard" },
    { id:"leads",     icon:"👥", label:"Leads",    badge:leads.length },
    { id:"messages",  icon:"💬", label:"Messages", badge:unread },
    { id:"analytics", icon:"📈", label:"Analytics" },
    { id:"visitors",  icon:"🕐", label:"Visitors" },
  ];

  const StatCard = ({icon,label,value,sub,color}) => (
    <div className="glass card-hover" style={{ padding:22 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
        <div>
          <div style={{ color:"var(--text2)", fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:1, marginBottom:8 }}>{label}</div>
          <div style={{ fontSize:34, fontWeight:900, color, fontFamily:"'JetBrains Mono',monospace", lineHeight:1 }}>{value}</div>
          <div style={{ fontSize:12, color:"var(--text2)", marginTop:6 }}>{sub}</div>
        </div>
        <div style={{ fontSize:34, opacity:0.8 }}>{icon}</div>
      </div>
    </div>
  );

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-IN") : "—";
  const fmtTime = (d) => d ? new Date(d).toLocaleTimeString("en-IN") : "—";

  return (
    <div style={{ display:"flex", minHeight:"100vh", background:"var(--bg)", paddingTop:64 }}>

      {/* ── Toast ── */}
      {toast && (
        <div style={{ position:"fixed", top:80, right:20, zIndex:9999, background:"var(--surface)", border:`1px solid ${toast.type==="error"?"rgba(239,68,68,0.4)":toast.type==="warn"?"rgba(245,158,11,0.4)":"rgba(16,185,129,0.4)"}`, borderRadius:12, padding:"13px 18px", boxShadow:"0 8px 30px rgba(0,0,0,0.4)", display:"flex", alignItems:"center", gap:10, fontSize:14, fontWeight:600, animation:"slideRight 0.3s ease", maxWidth:320 }}>
          {toast.type==="error"?"❌":toast.type==="warn"?"⚠️":"✅"} {toast.msg}
        </div>
      )}

      {/* ── Delete Confirm Modal ── */}
      {deleteConfirm && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.7)", zIndex:9998, display:"flex", alignItems:"center", justifyContent:"center", padding:24 }}>
          <div className="glass" style={{ padding:32, maxWidth:360, width:"100%", textAlign:"center" }}>
            <div style={{ fontSize:48, marginBottom:16 }}>🗑️</div>
            <h3 style={{ fontWeight:800, fontSize:20, marginBottom:10 }}>{deleteConfirm==="all"?"Delete All Leads?":"Delete this Lead?"}</h3>
            <p style={{ color:"var(--text2)", fontSize:14, marginBottom:24, lineHeight:1.6 }}>This action cannot be undone.</p>
            <div style={{ display:"flex", gap:12 }}>
              <button className="btn-ghost" style={{ flex:1 }} onClick={()=>setDeleteConfirm(null)}>Cancel</button>
              <button className="btn-primary" style={{ flex:1, background:"linear-gradient(135deg,#ef4444,#dc2626)" }}
                onClick={()=>deleteConfirm==="all"?deleteAllLeads():deleteLead(deleteConfirm)}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Email Compose Modal ── */}
      {emailModal && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.75)", zIndex:9998, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
          <div className="glass" style={{ width:"100%", maxWidth:580, borderRadius:18, overflow:"hidden", boxShadow:"0 24px 80px rgba(0,0,0,0.6)", animation:"scaleIn 0.25s ease" }}>

            {/* Header */}
            <div style={{ padding:"18px 24px", background:"var(--grad)", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <span style={{ fontSize:22 }}>✉️</span>
                <div>
                  <div style={{ fontWeight:800, fontSize:16, color:"#fff" }}>
                    {emailModal.type==="reply" ? "Reply to Message" : "Send Career Email"}
                  </div>
                  <div style={{ fontSize:12, color:"rgba(255,255,255,0.8)" }}>
                    From: rkscode.support@gmail.com → To: {emailModal.to}
                  </div>
                </div>
              </div>
              <button onClick={()=>{ setEmailModal(null); setEmailStatus(null); }} style={{ background:"rgba(255,255,255,0.2)", border:"none", color:"#fff", width:32, height:32, borderRadius:"50%", cursor:"pointer", fontSize:18, display:"flex", alignItems:"center", justifyContent:"center" }} disabled={emailSending}>×</button>
            </div>

            {/* Success / Error Status Banner */}
            {emailStatus==="success" && (
              <div style={{ padding:"14px 24px", background:"rgba(16,185,129,0.15)", borderBottom:"1px solid rgba(16,185,129,0.3)", display:"flex", alignItems:"center", gap:10, color:"#10b981", fontWeight:700, fontSize:14 }}>
                <span style={{ fontSize:22 }}>✅</span>
                Email successfully sent to {emailModal.to}! Window closing...
              </div>
            )}
            {emailStatus==="error" && (
              <div style={{ padding:"14px 24px", background:"rgba(239,68,68,0.1)", borderBottom:"1px solid rgba(239,68,68,0.3)", display:"flex", alignItems:"center", gap:10, color:"#ef4444", fontWeight:600, fontSize:13 }}>
                <span style={{ fontSize:20 }}>❌</span>
                Email send failed. Check GMAIL_PASS in backend .env file.
              </div>
            )}

            {/* Body */}
            <div style={{ padding:24 }}>
              {/* From / To row */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:16 }}>
                <div style={{ padding:"10px 14px", background:"rgba(59,130,246,0.08)", borderRadius:10, border:"1px solid rgba(59,130,246,0.2)" }}>
                  <div style={{ fontSize:10, fontWeight:700, color:"var(--text2)", textTransform:"uppercase", letterSpacing:1, marginBottom:4 }}>FROM</div>
                  <div style={{ fontSize:13, fontWeight:700, color:"var(--accent1)" }}>rkscode.support@gmail.com</div>
                </div>
                <div style={{ display:"flex", gap:10, padding:"10px 14px", background:"var(--surface2)", borderRadius:10, alignItems:"center" }}>
                  <div style={{ width:30, height:30, borderRadius:"50%", background:"var(--grad)", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, color:"#fff", fontSize:13, flexShrink:0 }}>
                    {(emailModal.name||"U")[0].toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontSize:10, fontWeight:700, color:"var(--text2)", textTransform:"uppercase", letterSpacing:1 }}>TO</div>
                    <div style={{ fontSize:13, fontWeight:700 }}>{emailModal.name}</div>
                    <div style={{ color:"var(--accent1)", fontSize:11 }}>{emailModal.to}</div>
                  </div>
                </div>
              </div>

              {/* Subject */}
              <div style={{ marginBottom:14 }}>
                <label style={{ display:"block", marginBottom:6, fontWeight:700, fontSize:11, color:"var(--text2)", textTransform:"uppercase", letterSpacing:1 }}>Subject</label>
                <input
                  style={{ width:"100%", background:"var(--surface)", border:"1px solid var(--border)", borderRadius:10, padding:"10px 14px", color:"var(--text)", fontFamily:"'Sora',sans-serif", fontSize:14, outline:"none", transition:"border-color 0.2s", boxSizing:"border-box" }}
                  value={emailSubject}
                  onChange={e=>setEmailSubject(e.target.value)}
                  onFocus={e=>e.target.style.borderColor="var(--accent1)"}
                  onBlur={e=>e.target.style.borderColor="var(--border)"}
                  disabled={emailSending}
                  placeholder="Email subject..."/>
              </div>

              {/* Body */}
              <div style={{ marginBottom:16 }}>
                <label style={{ display:"block", marginBottom:6, fontWeight:700, fontSize:11, color:"var(--text2)", textTransform:"uppercase", letterSpacing:1 }}>Message</label>
                <textarea
                  style={{ width:"100%", background:"var(--surface)", border:"1px solid var(--border)", borderRadius:10, padding:"12px 14px", color:"var(--text)", fontFamily:"'Sora',sans-serif", fontSize:13, outline:"none", resize:"vertical", minHeight:160, lineHeight:1.7, transition:"border-color 0.2s", boxSizing:"border-box", opacity: emailSending ? 0.6 : 1 }}
                  value={emailBody}
                  onChange={e=>setEmailBody(e.target.value)}
                  onFocus={e=>e.target.style.borderColor="var(--accent1)"}
                  onBlur={e=>e.target.style.borderColor="var(--border)"}
                  disabled={emailSending}
                  placeholder="Write your message here..."/>
              </div>

              {/* Info note */}
              <div style={{ background:"rgba(16,185,129,0.06)", border:"1px solid rgba(16,185,129,0.2)", borderRadius:8, padding:"10px 14px", marginBottom:18, fontSize:12, color:"var(--text2)", lineHeight:1.5, display:"flex", gap:8, alignItems:"flex-start" }}>
                <span style={{ fontSize:16, flexShrink:0 }}>📬</span>
                <span>Email directly send hoga <strong style={{ color:"var(--accent4)" }}>rkscode.support@gmail.com</strong> se user ke inbox mein. User ko yeh professionally formatted HTML email milega.</span>
              </div>

              {/* Buttons */}
              <div style={{ display:"flex", gap:12 }}>
                <button className="btn-ghost" style={{ flex:1, padding:"13px" }}
                  onClick={()=>{ setEmailModal(null); setEmailStatus(null); }}
                  disabled={emailSending}>
                  Cancel
                </button>
                <button className="btn-primary" style={{ flex:2, padding:"13px", fontSize:14, display:"flex", alignItems:"center", justifyContent:"center", gap:10, opacity: emailSending ? 0.8 : 1 }}
                  onClick={sendEmail}
                  disabled={emailSending || emailStatus==="success"}>
                  {emailSending ? (
                    <>
                      <div style={{ width:16, height:16, border:"2px solid rgba(255,255,255,0.3)", borderTopColor:"#fff", borderRadius:"50%", animation:"spin 0.8s linear infinite" }}/>
                      Sending...
                    </>
                  ) : emailStatus==="success" ? (
                    <>✅ Sent!</>
                  ) : (
                    <>📤 Send Email Now</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Sidebar ── */}
      <aside style={{ width:sidebarOpen?240:64, background:"var(--surface)", borderRight:"1px solid var(--border)", transition:"width 0.3s ease", display:"flex", flexDirection:"column", position:"fixed", top:64, bottom:0, left:0, zIndex:100, overflow:"hidden" }}>
        <div style={{ padding:"14px 12px", borderBottom:"1px solid var(--border)", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          {sidebarOpen && <span style={{ fontWeight:800, fontSize:13, color:"var(--accent1)", letterSpacing:1 }}>ADMIN PANEL</span>}
          <button onClick={()=>setSidebarOpen(s=>!s)} style={{ background:"none", border:"none", cursor:"pointer", color:"var(--text2)", fontSize:18, marginLeft:"auto", padding:4, borderRadius:6 }}>
            {sidebarOpen?"◀":"▶"}
          </button>
        </div>
        {sidebarOpen && (
          <div style={{ padding:"10px 12px 0", borderBottom:"1px solid var(--border)" }}>
            <DBStatus status={dbStatus}/>
            <div style={{ fontSize:11, color:"var(--text2)", marginTop:6, marginBottom:10 }}>
              {dbStatus==="connected"?"Data synced with MongoDB":"Using local storage"}
            </div>
          </div>
        )}
        <div style={{ flex:1, padding:"10px 8px", display:"flex", flexDirection:"column", gap:3, overflowY:"auto" }}>
          {NAV.map(item => (
            <button key={item.id} onClick={()=>setTab(item.id)} style={{ display:"flex", alignItems:"center", gap:12, padding:"11px 12px", borderRadius:10, border:"none", cursor:"pointer", width:"100%", background:tab===item.id?"rgba(59,130,246,0.15)":"transparent", color:tab===item.id?"var(--accent1)":"var(--text2)", fontFamily:"'Sora',sans-serif", fontWeight:600, fontSize:14, transition:"all 0.2s", textAlign:"left", whiteSpace:"nowrap" }}>
              <span style={{ fontSize:18, flexShrink:0 }}>{item.icon}</span>
              {sidebarOpen && <>
                <span style={{ flex:1 }}>{item.label}</span>
                {item.badge>0 && <span style={{ background:"var(--accent1)", color:"#fff", borderRadius:10, padding:"2px 8px", fontSize:11, fontWeight:700 }}>{item.badge}</span>}
              </>}
            </button>
          ))}
        </div>
        <div style={{ padding:"10px 8px", borderTop:"1px solid var(--border)", display:"flex", flexDirection:"column", gap:6 }}>
          <button onClick={loadAll} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 12px", borderRadius:10, border:"none", cursor:"pointer", width:"100%", background:"rgba(59,130,246,0.08)", color:"var(--accent1)", fontFamily:"'Sora',sans-serif", fontWeight:600, fontSize:13, whiteSpace:"nowrap" }}>
            <span style={{ fontSize:16, flexShrink:0 }}>🔄</span>{sidebarOpen&&"Refresh Data"}
          </button>
          <button onClick={onLogout} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 12px", borderRadius:10, border:"none", cursor:"pointer", width:"100%", background:"rgba(239,68,68,0.08)", color:"#ef4444", fontFamily:"'Sora',sans-serif", fontWeight:600, fontSize:13, whiteSpace:"nowrap" }}>
            <span style={{ fontSize:16, flexShrink:0 }}>🚪</span>{sidebarOpen&&"Logout"}
          </button>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main style={{ flex:1, marginLeft:sidebarOpen?240:64, transition:"margin-left 0.3s ease", padding:28, overflowY:"auto", minHeight:"calc(100vh - 64px)" }}>

        {loading && <div style={{ position:"fixed", top:64, left:0, right:0, height:3, background:"linear-gradient(90deg,#3b82f6,#8b5cf6)", zIndex:999, animation:"shimmer 1s ease infinite" }}/>}

        {/* ══ DASHBOARD ══ */}
        {tab==="dashboard" && (
          <div className="page">
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:12, marginBottom:28 }}>
              <div>
                <h2 style={{ fontWeight:900, fontSize:28, marginBottom:4 }}>📊 Dashboard</h2>
                <p style={{ color:"var(--text2)", fontSize:14 }}>Welcome back, Admin!</p>
              </div>
              <div style={{ display:"flex", gap:10, alignItems:"center", flexWrap:"wrap" }}>
                <DBStatus status={dbStatus}/>
                <button className="btn-ghost" style={{ fontSize:13, padding:"9px 16px" }} onClick={loadAll}>🔄 Refresh</button>
              </div>
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))", gap:16, marginBottom:28 }}>
              <StatCard icon="👁️" label="Today's Visitors" value={visitorData.todayVisits||0} sub={`Total: ${visitorData.total||0}`} color="#3b82f6"/>
              <StatCard icon="🎯" label="Total Leads" value={leads.length} sub={`Today: ${todayLeads}`} color="#8b5cf6"/>
              <StatCard icon="💬" label="Messages" value={messages.length} sub={`Unread: ${unread}`} color="#f59e0b"/>
              <StatCard icon="📈" label="Conversion" value={`${conversion}%`} sub="Leads / Visitors" color="#10b981"/>
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))", gap:20, marginBottom:24 }}>
              <div className="glass" style={{ padding:24 }}>
                <div style={{ fontWeight:700, fontSize:15, marginBottom:16 }}>📅 Visitors — Last 7 Days</div>
                <BarChart data={last7Visits.map(d=>({...d,v:d.count}))} color="#3b82f6"/>
              </div>
              <div className="glass" style={{ padding:24 }}>
                <div style={{ fontWeight:700, fontSize:15, marginBottom:16 }}>🎯 Leads — Last 7 Days</div>
                <BarChart data={last7Leads.map(d=>({l:d.label,v:d.count}))} color="#8b5cf6"/>
              </div>
              <div className="glass" style={{ padding:24 }}>
                <div style={{ fontWeight:700, fontSize:15, marginBottom:16 }}>🎓 Leads by Stream</div>
                {donutSegs.length>0 ? (
                  <div style={{ display:"flex", gap:16, alignItems:"center" }}>
                    <DonutChart segments={donutSegs}/>
                    <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                      {donutSegs.map((s,i)=>(
                        <div key={i} style={{ display:"flex", alignItems:"center", gap:8, fontSize:12 }}>
                          <div style={{ width:10, height:10, borderRadius:"50%", background:s.color, flexShrink:0 }}/>
                          <span style={{ color:"var(--text2)" }}>{s.label}</span>
                          <span style={{ fontWeight:700, marginLeft:"auto", paddingLeft:8 }}>{s.v}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : <div style={{ color:"var(--text2)", textAlign:"center", padding:"30px 0", fontSize:13 }}>No data yet</div>}
              </div>
            </div>

            {/* Recent Leads */}
            <div className="glass" style={{ padding:24 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
                <div style={{ fontWeight:700, fontSize:16 }}>🕐 Recent Leads</div>
                <button className="btn-ghost" style={{ fontSize:12, padding:"7px 14px" }} onClick={()=>setTab("leads")}>View All →</button>
              </div>
              {leads.length===0 ? (
                <div style={{ textAlign:"center", color:"var(--text2)", padding:"32px 0", fontSize:14 }}>
                  <div style={{ fontSize:40, marginBottom:10 }}>📭</div>
                  No leads yet. They appear after users complete Career Finder.
                </div>
              ) : (
                <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                  {leads.slice(0,5).map(l=>(
                    <div key={l._id||l.id} style={{ display:"flex", alignItems:"center", gap:14, padding:"12px 16px", background:"var(--surface2)", borderRadius:10 }}>
                      <div style={{ width:38, height:38, borderRadius:"50%", background:`${STREAM_COLORS[l.stream]||"#666"}33`, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:15, color:STREAM_COLORS[l.stream]||"var(--accent1)", flexShrink:0 }}>
                        {(l.name||"U")[0].toUpperCase()}
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontWeight:700, fontSize:14 }}>{l.name||"Anonymous"}</div>
                        <div style={{ color:"var(--text2)", fontSize:12 }}>{l.email||"—"} • {fmtDate(l.createdAt||l.timestamp)}</div>
                      </div>
                      <span style={{ background:`${STREAM_COLORS[l.stream]||"#666"}22`, color:STREAM_COLORS[l.stream]||"#666", padding:"4px 10px", borderRadius:20, fontSize:11, fontWeight:700, whiteSpace:"nowrap" }}>
                        {STREAM_SHORT[l.stream]||l.stream||"—"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══ LEADS ══ */}
        {tab==="leads" && (
          <div className="page">
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:12, marginBottom:24 }}>
              <div>
                <h2 style={{ fontWeight:900, fontSize:28, marginBottom:4 }}>👥 All Leads</h2>
                <p style={{ color:"var(--text2)", fontSize:14 }}>{leads.length} leads in MongoDB</p>
              </div>
              <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
                <button className="btn-ghost" style={{ fontSize:13, padding:"9px 18px" }} onClick={loadAll}>🔄 Refresh</button>
                <button className="btn-ghost" style={{ fontSize:13, padding:"9px 18px" }} onClick={exportCSV}>📥 Export CSV</button>
                <button className="btn-ghost" style={{ fontSize:13, padding:"9px 18px", borderColor:"rgba(239,68,68,0.4)", color:"#ef4444" }} onClick={()=>setDeleteConfirm("all")}>🗑️ Clear All</button>
              </div>
            </div>

            <div className="glass" style={{ padding:16, marginBottom:20, display:"flex", gap:12, flexWrap:"wrap", alignItems:"center" }}>
              <div style={{ flex:1, minWidth:200, position:"relative" }}>
                <span style={{ position:"absolute", left:16, top:"50%", transform:"translateY(-50%)", color:"var(--text2)", pointerEvents:"none" }}>🔍</span>
                <input className="search-input" placeholder="Search name, email..." value={search} onChange={e=>setSearch(e.target.value)}/>
              </div>
              <select value={filterStream} onChange={e=>setFilterStream(e.target.value)} style={{ width:"auto", minWidth:160 }}>
                <option value="all">All Streams</option>
                {Object.entries(STREAM_LABELS).map(([k,v])=><option key={k} value={k}>{v}</option>)}
              </select>
              <select value={sortOrder} onChange={e=>setSortOrder(e.target.value)} style={{ width:"auto", minWidth:120 }}>
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
              </select>
              {(search||filterStream!=="all") && <button className="btn-ghost" style={{ fontSize:13, padding:"9px 14px" }} onClick={()=>{setSearch("");setFilterStream("all");}}>✕ Clear</button>}
            </div>

            {leads.length===0 ? (
              <div className="glass" style={{ padding:60, textAlign:"center" }}>
                <div style={{ fontSize:48, marginBottom:12 }}>📭</div>
                <div style={{ fontWeight:700, fontSize:18, marginBottom:8 }}>No Leads Yet</div>
                <div style={{ color:"var(--text2)", fontSize:14 }}>Leads appear here after users complete Career Finder.</div>
              </div>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                {leads.map(lead=>(
                  <div key={lead._id||lead.id} className="glass" style={{ borderRadius:14, overflow:"hidden", border:"1px solid var(--border)" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:14, padding:"16px 20px", cursor:"pointer" }}
                      onClick={()=>{ setExpandedLead(expandedLead===lead._id?null:lead._id); markLeadRead(lead._id); }}>
                      <div style={{ width:42, height:42, borderRadius:"50%", background:`${STREAM_COLORS[lead.stream]||"#666"}22`, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:16, color:STREAM_COLORS[lead.stream]||"var(--accent1)", flexShrink:0 }}>
                        {(lead.name||"U")[0].toUpperCase()}
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontWeight:700, fontSize:15, marginBottom:2, display:"flex", gap:8, alignItems:"center" }}>
                          {lead.name||"Anonymous"}
                          {!lead.isRead && <span style={{ background:"var(--accent1)", color:"#fff", fontSize:10, padding:"2px 7px", borderRadius:8, fontWeight:700 }}>NEW</span>}
                        </div>
                        <div style={{ color:"var(--text2)", fontSize:13 }}>{lead.email||"—"}</div>
                      </div>
                      <div style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"wrap", justifyContent:"flex-end" }}>
                        {lead.stream && <span style={{ background:`${STREAM_COLORS[lead.stream]||"#666"}22`, color:STREAM_COLORS[lead.stream]||"#666", padding:"4px 12px", borderRadius:20, fontSize:12, fontWeight:700 }}>{STREAM_LABELS[lead.stream]||lead.stream}</span>}
                        {lead.edu && <span style={{ background:"rgba(139,92,246,0.1)", color:"#a78bfa", padding:"4px 12px", borderRadius:20, fontSize:12, fontWeight:600 }}>{lead.edu}</span>}
                        <span style={{ background:"rgba(16,185,129,0.1)", color:"#10b981", padding:"4px 12px", borderRadius:20, fontSize:12, fontWeight:700 }}>₹{lead.salary||"—"}L</span>
                        <span style={{ color:"var(--text2)", fontSize:12 }}>{fmtDate(lead.createdAt)}</span>
                        <span style={{ color:"var(--text2)", fontSize:14 }}>{expandedLead===lead._id?"▲":"▼"}</span>
                      </div>
                    </div>
                    {expandedLead===lead._id && (
                      <div style={{ padding:"0 20px 20px", borderTop:"1px solid var(--border)", paddingTop:16 }}>
                        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))", gap:12, marginBottom:16 }}>
                          {[{l:"Phone",v:lead.phone||"—"},{l:"Work Type",v:lead.workType||"—"},{l:"Career Goal",v:lead.goal||"—"},{l:"Interests",v:lead.interests||"—"},{l:"Education",v:lead.edu||"—"},{l:"Salary Exp.",v:`₹${lead.salary||"—"}L/yr`},{l:"Submitted",v:`${fmtDate(lead.createdAt)} ${fmtTime(lead.createdAt)}`}].map((f,i)=>(
                            <div key={i} style={{ background:"var(--surface2)", borderRadius:10, padding:"10px 14px" }}>
                              <div style={{ fontSize:11, color:"var(--text2)", fontWeight:700, textTransform:"uppercase", marginBottom:4 }}>{f.l}</div>
                              <div style={{ fontWeight:600, fontSize:14 }}>{f.v}</div>
                            </div>
                          ))}
                        </div>
                        {lead.skills?.length>0 && (
                          <div style={{ marginBottom:16 }}>
                            <div style={{ fontSize:11, color:"var(--text2)", fontWeight:700, textTransform:"uppercase", marginBottom:8 }}>Skills ({lead.skills.length})</div>
                            <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>{lead.skills.map(s=><span key={s} className="skill-tag">{s}</span>)}</div>
                          </div>
                        )}
                        <div style={{ display:"flex", gap:10 }}>
                          {lead.email && (
                            <button className="btn-primary" style={{ fontSize:13, padding:"9px 20px", display:"flex", alignItems:"center", gap:8 }}
                              onClick={()=>openEmail(lead, "lead")}>
                              📧 Send Email
                            </button>
                          )}
                          <button className="btn-ghost" style={{ fontSize:13, padding:"9px 18px", borderColor:"rgba(239,68,68,0.4)", color:"#ef4444" }} onClick={()=>setDeleteConfirm(lead._id||lead.id)}>🗑️ Delete</button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══ MESSAGES ══ */}
        {tab==="messages" && (
          <div className="page">
            <div style={{ marginBottom:24 }}>
              <h2 style={{ fontWeight:900, fontSize:28, marginBottom:4 }}>💬 Contact Messages</h2>
              <p style={{ color:"var(--text2)", fontSize:14 }}>{messages.length} total • {unread} unread</p>
            </div>
            {messages.length===0 ? (
              <div className="glass" style={{ padding:60, textAlign:"center" }}>
                <div style={{ fontSize:48, marginBottom:12 }}>📭</div>
                <div style={{ fontWeight:700, fontSize:18, marginBottom:8 }}>No Messages Yet</div>
                <div style={{ color:"var(--text2)", fontSize:14 }}>Messages from Contact page appear here.</div>
              </div>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                {messages.map(c=>(
                  <div key={c._id||c.id} className="glass" style={{ padding:24, border:`1px solid ${!c.isRead?"rgba(59,130,246,0.3)":"var(--border)"}` }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:12, marginBottom:14 }}>
                      <div style={{ display:"flex", gap:12, alignItems:"center" }}>
                        <div style={{ width:42, height:42, borderRadius:"50%", background:"var(--grad)", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:16, color:"#fff", flexShrink:0 }}>
                          {(c.name||"U")[0].toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight:700, fontSize:15, display:"flex", alignItems:"center", gap:8 }}>
                            {c.name}
                            {!c.isRead && <span style={{ background:"var(--accent1)", color:"#fff", fontSize:10, padding:"2px 7px", borderRadius:8, fontWeight:700 }}>NEW</span>}
                          </div>
                          <div style={{ color:"var(--accent1)", fontSize:13 }}>{c.email}</div>
                        </div>
                      </div>
                      <div style={{ color:"var(--text2)", fontSize:12, fontFamily:"'JetBrains Mono',monospace" }}>{fmtDate(c.createdAt||c.timestamp)}</div>
                    </div>
                    <div style={{ background:"var(--surface2)", borderRadius:10, padding:"14px 16px", fontSize:14, lineHeight:1.7, marginBottom:14 }}>{c.msg||"(No message)"}</div>
                    <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
                      {c.email && (
                        <button className="btn-primary" style={{ fontSize:13, padding:"9px 20px", display:"flex", alignItems:"center", gap:8 }}
                          onClick={()=>openEmail({...c, msg: c.msg}, "reply")}>
                          📧 Reply
                        </button>
                      )}
                      {!c.isRead && <button className="btn-ghost" style={{ fontSize:13, padding:"9px 18px" }} onClick={()=>markMsgRead(c._id)}>✓ Mark Read</button>}
                      <button className="btn-ghost" style={{ fontSize:13, padding:"9px 18px", borderColor:"rgba(239,68,68,0.3)", color:"#ef4444" }} onClick={()=>deleteMessage(c._id||c.id)}>🗑️ Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══ ANALYTICS ══ */}
        {tab==="analytics" && (
          <div className="page">
            <h2 style={{ fontWeight:900, fontSize:28, marginBottom:6 }}>📈 Analytics</h2>
            <p style={{ color:"var(--text2)", fontSize:14, marginBottom:28 }}>Detailed breakdown of user behaviour</p>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))", gap:20 }}>
              <div className="glass" style={{ padding:24, gridColumn:"span 2" }}>
                <div style={{ fontWeight:700, fontSize:16, marginBottom:20 }}>🎓 Leads by Academic Stream</div>
                {streamBreakdown.length===0 ? <div style={{ color:"var(--text2)", textAlign:"center", padding:24 }}>No data yet</div> : (
                  <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                    {streamBreakdown.map(s=>{
                      const pct=Math.round((s.count/leads.length)*100);
                      return (
                        <div key={s._id} style={{ display:"flex", alignItems:"center", gap:14 }}>
                          <div style={{ width:130, fontSize:13, fontWeight:600, flexShrink:0 }}>{STREAM_LABELS[s._id]||s._id}</div>
                          <div style={{ flex:1, height:10, background:"var(--border)", borderRadius:5, overflow:"hidden" }}>
                            <div style={{ height:"100%", width:`${pct}%`, background:STREAM_COLORS[s._id]||"var(--grad)", borderRadius:5, transition:"width 0.8s" }}/>
                          </div>
                          <div style={{ width:32, fontWeight:800, fontSize:14, color:STREAM_COLORS[s._id], textAlign:"right" }}>{s.count}</div>
                          <div style={{ width:38, color:"var(--text2)", fontSize:12, textAlign:"right" }}>{pct}%</div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              {[
                { title:"💼 Work Type", key:"workType", data:stats?.workTypeBreakdown||[], color:"#3b82f6" },
                { title:"🎯 Career Goals", key:"goal", data:stats?.goalBreakdown||[], color:"#f59e0b" },
                { title:"🎓 Education Level", key:"edu", data:stats?.eduBreakdown||[], color:"#8b5cf6" },
              ].map(sec=>(
                <div key={sec.title} className="glass" style={{ padding:24 }}>
                  <div style={{ fontWeight:700, fontSize:16, marginBottom:18 }}>{sec.title}</div>
                  {sec.data.length===0 ? <div style={{ color:"var(--text2)", textAlign:"center", padding:16 }}>No data yet</div> : (
                    sec.data.map((s,i)=>(
                      <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"9px 0", borderBottom:"1px solid var(--border)", fontSize:13 }}>
                        <span style={{ color:"var(--text2)" }}>{s._id}</span>
                        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                          <div style={{ width:60, height:6, background:"var(--border)", borderRadius:3, overflow:"hidden" }}>
                            <div style={{ height:"100%", width:`${leads.length?Math.round((s.count/leads.length)*100):0}%`, background:sec.color, borderRadius:3 }}/>
                          </div>
                          <span style={{ fontWeight:700, color:sec.color, minWidth:20 }}>{s.count}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══ VISITORS ══ */}
        {tab==="visitors" && (
          <div className="page">
            <h2 style={{ fontWeight:900, fontSize:28, marginBottom:6 }}>🕐 Daily Visitors</h2>
            <p style={{ color:"var(--text2)", fontSize:14, marginBottom:28 }}>Track platform visits stored in MongoDB</p>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))", gap:16, marginBottom:28 }}>
              <StatCard icon="📅" label="Today" value={visitorData.todayVisits||0} sub="Visits today" color="#3b82f6"/>
              <StatCard icon="📊" label="Total" value={visitorData.total||0} sub="All time" color="#8b5cf6"/>
              <StatCard icon="🗓️" label="Active Days" value={visitorData.data?.length||0} sub="Days tracked" color="#10b981"/>
              <StatCard icon="📉" label="Avg/Day" value={visitorData.data?.length>0?Math.round((visitorData.total||0)/visitorData.data.length):"—"} sub="Per day" color="#f59e0b"/>
            </div>
            <div className="glass" style={{ padding:24, marginBottom:24 }}>
              <div style={{ fontWeight:700, fontSize:16, marginBottom:18 }}>📅 Last 14 Days</div>
              <BarChart height={110} data={(visitorData.last14||[]).map(d=>({l:d.label,v:d.count}))} color="#3b82f6"/>
            </div>
            <div className="glass" style={{ padding:24 }}>
              <div style={{ fontWeight:700, fontSize:16, marginBottom:18 }}>📋 Full History</div>
              {(!visitorData.data||visitorData.data.length===0) ? (
                <div style={{ textAlign:"center", color:"var(--text2)", padding:30 }}>No visit data yet.</div>
              ) : (
                <div style={{ display:"flex", flexDirection:"column", gap:8, maxHeight:420, overflowY:"auto" }}>
                  {[...visitorData.data].sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)).map(v=>{
                    const maxV=Math.max(...visitorData.data.map(x=>x.count),1);
                    return (
                      <div key={v._id||v.date} style={{ display:"flex", alignItems:"center", gap:14, padding:"10px 14px", background:"var(--surface2)", borderRadius:10 }}>
                        <span style={{ fontSize:13, color:"var(--text2)", minWidth:110 }}>📅 {v.date}</span>
                        <div style={{ flex:1, height:6, background:"var(--border)", borderRadius:3, overflow:"hidden" }}>
                          <div style={{ height:"100%", width:`${(v.count/maxV)*100}%`, background:"#3b82f6", borderRadius:3 }}/>
                        </div>
                        <span style={{ fontWeight:800, color:"#3b82f6", fontFamily:"'JetBrains Mono',monospace", minWidth:50, textAlign:"right" }}>{v.count} 👁️</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

      </main>
    </div>
  );
};

// ─── EXPORTED ADMIN ROOT ──────────────────────────────────────────────────────
// ─── ADMIN PAGE ROOT — JWT-based session ─────────────────────────────────────
export default function AdminPage({ onBack }) {
  // Check if a valid JWT exists in sessionStorage
  const checkAuth = () => !!getToken();

  const [authed, setAuthed] = useState(checkAuth);

  // Verify token with backend on mount (catches expired tokens)
  useEffect(() => {
    if (!getToken()) return;
    fetch(`${API_URL}/api/auth/verify`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then(r => r.json())
      .then(data => {
        if (!data.valid) { clearToken(); setAuthed(false); }
      })
      .catch(() => {}); // if backend offline, keep session
  }, []);

  const handleLogin = (token) => {
    setToken(token);
    setAuthed(true);
  };

  const handleLogout = () => {
    clearToken();
    setAuthed(false);
    onBack();
  };

  if (!authed) return <AdminLogin onLogin={handleLogin}/>;
  return <AdminDashboard onLogout={handleLogout}/>;
}
