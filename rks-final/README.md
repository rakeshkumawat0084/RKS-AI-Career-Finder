# 🚀 RKS CODE — AI Career Recommendation System

React + Node.js + MongoDB Atlas | Deploy: GitHub + Render + Vercel

---

## 📁 Project Structure

```
rks-code/
├── backend/          ← Node.js API → deploy on Render
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   ├── server.js
│   ├── package.json
│   └── .env          ← ⚠️ Fill this before running
├── frontend/         ← React App → deploy on Vercel
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── .env          ← backend URL goes here
├── render.yaml       ← Render auto-config
├── .gitignore
└── README.md
```

---

## ⚡ STEP 1: Run Locally

### A) Fix MongoDB first
1. Go to cloud.mongodb.com → Login
2. Click your cluster → Connect → Drivers → Node.js
3. Copy the connection string (looks like):
   mongodb+srv://myuser:mypass@cluster0.abc123.mongodb.net/...
4. Open backend/.env → Replace line:
   MONGO_URI=mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@...
   With your real connection string

   ⚠️  If password has @ or # character, replace it:
   @  →  %40
   #  →  %23
   !  →  %21

### B) Network Access in Atlas
1. Atlas → Network Access → ADD IP ADDRESS
2. Click "Allow Access from Anywhere" → 0.0.0.0/0
3. Confirm

### C) Start Backend
```
cd backend
npm install
npm run dev
```
Should see: ✅ MongoDB Atlas connected

### D) Start Frontend (new terminal)
```
cd frontend
npm install
npm start
```
Opens: http://localhost:3000

### E) Admin Panel
URL: http://localhost:3000/#/admin
Username: admin
Password: RksAdmin2024

---

## 🐙 STEP 2: Upload to GitHub

```
git init
git add .
git commit -m "RKS CODE initial commit"
git remote add origin https://github.com/YOUR_USERNAME/rks-code.git
git branch -M main
git push -u origin main
```

---

## ⚙️ STEP 3: Deploy Backend on Render (Free)

1. Go to render.com → Sign up (use GitHub)
2. Click "New +" → "Web Service"
3. Connect GitHub → Select rks-code repo
4. Settings:
   - Name: rks-backend
   - Root Directory: backend
   - Build Command: npm install
   - Start Command: npm start
5. Click "Advanced" → Add Environment Variables:

   NODE_ENV          = production
   PORT              = 5000
   MONGO_URI         = [your mongodb atlas string]
   JWT_SECRET        = [copy from backend/.env]
   ADMIN_USERNAME    = admin
   ADMIN_PASSWORD    = RksAdmin2024
   RECOVERY_ANSWER   = rkscode
   GMAIL_USER        = your@gmail.com
   GMAIL_PASS        = [gmail app password]
   RATE_LIMIT_MAX    = 100
   EMAIL_RATE_LIMIT_MAX = 10

6. Click "Create Web Service"
7. Wait 3-5 minutes for deploy
8. Your backend URL: https://rks-backend.onrender.com

   Test it: https://rks-backend.onrender.com/api/health
   Should show: {"status":"ok","db":"connected"}

---

## 🌐 STEP 4: Deploy Frontend on Vercel (Free)

1. Go to vercel.com → Sign up (use GitHub)
2. Click "Add New Project"
3. Import rks-code repo from GitHub
4. Settings:
   - Framework Preset: Create React App
   - Root Directory: frontend
   - Build Command: npm run build
   - Output Directory: build
5. Add Environment Variable:
   - Name:  REACT_APP_API_URL
   - Value: https://rks-backend.onrender.com
6. Click "Deploy"
7. Your frontend URL: https://rks-code.vercel.app

---

## 🔄 STEP 5: Update CORS (Important!)

After Vercel deploy, go to Render Dashboard:
1. rks-backend → Environment
2. Add new variable:
   FRONTEND_URL = https://rks-code.vercel.app
3. Click Save → auto redeploys

---

## ✅ All Done! Your Live URLs:

Website:     https://rks-code.vercel.app
Admin Panel: https://rks-code.vercel.app/#/admin
Backend API: https://rks-backend.onrender.com

---

## 🔄 Future Updates

```
git add .
git commit -m "update"
git push
```
Both Render + Vercel auto-redeploy!

---

## 🆘 Common Errors

bad auth authentication failed
→ Wrong MongoDB password. Reset it on Atlas (use simple password, no special chars)

Missing env vars: MONGO_URI
→ .env file not found or empty. Make sure .env is in backend/ folder

CORS error in browser
→ Add FRONTEND_URL in Render environment variables

npm error when installing
→ Delete node_modules folder and run npm install again

