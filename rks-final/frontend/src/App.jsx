import { useState, useEffect, useRef, useCallback } from "react";
import AdminPage, { saveLeadToStorage, saveVisitToStorage, saveContactToStorage } from "./AdminPanel";

// ─── DATA ───────────────────────────────────────────────────────────────────

const STREAMS = [
  { id: "sci-math", label: "Science (Maths)", icon: "📐", color: "#3b82f6", desc: "Physics, Chemistry, Mathematics" },
  { id: "sci-bio", label: "Science (Biology)", icon: "🧬", color: "#10b981", desc: "Biology, Chemistry, Zoology" },
  { id: "commerce", label: "Commerce", icon: "💹", color: "#f59e0b", desc: "Accounts, Business, Economics" },
  { id: "arts", label: "Arts & Humanities", icon: "🎨", color: "#ec4899", desc: "History, Literature, Fine Arts" },
  { id: "agriculture", label: "Agriculture", icon: "🌾", color: "#84cc16", desc: "Agronomy, Horticulture, Soil Science" },
  { id: "cs", label: "Computer Science", icon: "💻", color: "#8b5cf6", desc: "Programming, Algorithms, Networks" },
  { id: "diploma", label: "Diploma / ITI", icon: "🔧", color: "#f97316", desc: "Technical, Vocational, Trade Skills" },
];

const STREAM_SKILLS = {
  "sci-math": ["Mathematics","Physics","Chemistry","Calculus","Statistics","Trigonometry","Linear Algebra","Mechanics","Electromagnetism","Thermodynamics","Problem Solving","Analytical Thinking","CAD","MATLAB","Data Analysis"],
  "sci-bio": ["Biology","Chemistry","Zoology","Botany","Anatomy","Physiology","Genetics","Microbiology","Biochemistry","Ecology","Lab Techniques","Research Methods","Medical Terminology","Pharmacology","Immunology"],
  "commerce": ["Accounting","Economics","Business Studies","Finance","Taxation","Auditing","Statistics","Marketing","Management","Tally ERP","MS Excel","Financial Analysis","Business Law","Banking","Entrepreneurship"],
  "arts": ["History","Geography","Political Science","Literature","Sociology","Psychology","Philosophy","Fine Arts","Music","Journalism","Communication","Creative Writing","Cultural Studies","Media Studies","Linguistics"],
  "agriculture": ["Agronomy","Soil Science","Horticulture","Animal Husbandry","Agricultural Economics","Plant Pathology","Irrigation","Remote Sensing","GIS","Food Technology","Crop Science","Pest Management","Farm Management","Agricultural Engineering","Biotechnology"],
  "cs": ["Programming (Python/Java/C++)","Data Structures","Algorithms","Web Development","Database Management","Networking","Cloud Computing","AI/ML","Cybersecurity","DevOps","Mobile Development","UI/UX Design","System Design","Software Testing","Open Source"],
  "diploma": ["Electrical Wiring","Mechanical Fitting","Welding","CNC Operation","AutoCAD","HVAC","Plumbing","Civil Drafting","Electronics","IT Hardware","PLC Programming","Quality Control","Industrial Safety","Motor Rewinding","Refrigeration"],
};

const CAREERS_DB = {
  "sci-math": [
    { id: "software-engineer", name: "Software Engineer", icon: "💻", desc: "Design and develop software systems, applications, and platforms used globally.", skills: ["Algorithms","Data Structures","Python/Java","System Design","Cloud"], salary: "₹6L – ₹40L/yr", degree: "B.Tech / B.E. / MCA", roadmap: ["Learn C++/Python","DSA & Algorithms","Web/App Dev","System Design","Internship → Job"], match: 92, videos: [{title:"Complete DSA Course",level:"Beginner",thumb:"https://i.ytimg.com/vi/8hly31xKli0/hqdefault.jpg",url:"https://youtube.com/watch?v=8hly31xKli0"},{title:"System Design Interview",level:"Intermediate",thumb:"https://i.ytimg.com/vi/UzLMhqg3_Wc/hqdefault.jpg",url:"https://youtube.com/watch?v=UzLMhqg3_Wc"},{title:"Advanced Java Programming",level:"Advanced",thumb:"https://i.ytimg.com/vi/grEKMHGYyns/hqdefault.jpg",url:"https://youtube.com/watch?v=grEKMHGYyns"}] },
    { id: "data-scientist", name: "Data Scientist", icon: "📊", desc: "Extract insights from complex datasets using statistics, ML models, and visualization.", skills: ["Python","Statistics","Machine Learning","SQL","Data Visualization"], salary: "₹8L – ₹35L/yr", degree: "B.Tech/B.Sc (Stats/CS) + M.Tech/MBA", roadmap: ["Statistics & Probability","Python + NumPy/Pandas","ML Algorithms","Deep Learning","Industry Projects"], match: 88, videos: [{title:"Data Science Full Course",level:"Beginner",thumb:"https://i.ytimg.com/vi/ua-CiDNNj30/hqdefault.jpg",url:"https://youtube.com/watch?v=ua-CiDNNj30"},{title:"Machine Learning A-Z",level:"Intermediate",thumb:"https://i.ytimg.com/vi/GwIo3gDZCVQ/hqdefault.jpg",url:"https://youtube.com/watch?v=GwIo3gDZCVQ"},{title:"Deep Learning Specialization",level:"Advanced",thumb:"https://i.ytimg.com/vi/VyWAvY2CF9c/hqdefault.jpg",url:"https://youtube.com/watch?v=VyWAvY2CF9c"}] },
    { id: "aerospace-engineer", name: "Aerospace Engineer", icon: "🚀", desc: "Design aircraft, spacecraft and propulsion systems for aviation and space industries.", skills: ["Fluid Mechanics","Thermodynamics","CAD","MATLAB","Structural Analysis"], salary: "₹5L – ₹25L/yr", degree: "B.Tech Aerospace / Aeronautical Engineering", roadmap: ["Core Physics & Maths","Fluid Mechanics","CAD/CAM Tools","Aerodynamics","ISRO/DRDO Internship"], match: 81, videos: [{title:"Aerospace Engineering Basics",level:"Beginner",thumb:"https://i.ytimg.com/vi/1A8pbsLFQHc/hqdefault.jpg",url:"https://youtube.com/watch?v=1A8pbsLFQHc"},{title:"Fluid Dynamics Complete",level:"Intermediate",thumb:"https://i.ytimg.com/vi/7veCMsEoHgk/hqdefault.jpg",url:"https://youtube.com/watch?v=7veCMsEoHgk"},{title:"Advanced Aerodynamics",level:"Advanced",thumb:"https://i.ytimg.com/vi/58GiMmrjkPo/hqdefault.jpg",url:"https://youtube.com/watch?v=58GiMmrjkPo"}] },
  ],
  "sci-bio": [
    { id: "doctor", name: "Medical Doctor (MBBS)", icon: "🩺", desc: "Diagnose and treat medical conditions; one of the most respected and impactful careers.", skills: ["Anatomy","Physiology","Pharmacology","Clinical Skills","Medical Ethics"], salary: "₹8L – ₹50L+/yr", degree: "MBBS + MD/MS", roadmap: ["NEET Preparation","MBBS 5.5 years","Internship","PG (MD/MS)","Specialization"], match: 95, videos: [{title:"NEET Biology Full Course",level:"Beginner",thumb:"https://i.ytimg.com/vi/b0WD3YJrKWk/hqdefault.jpg",url:"https://youtube.com/watch?v=b0WD3YJrKWk"},{title:"MBBS First Year Guide",level:"Intermediate",thumb:"https://i.ytimg.com/vi/Sg5Cz1y6-jE/hqdefault.jpg",url:"https://youtube.com/watch?v=Sg5Cz1y6-jE"},{title:"Clinical Skills Training",level:"Advanced",thumb:"https://i.ytimg.com/vi/l4SiLLlNlfc/hqdefault.jpg",url:"https://youtube.com/watch?v=l4SiLLlNlfc"}] },
    { id: "biotechnologist", name: "Biotechnologist", icon: "🧪", desc: "Apply biological systems and living organisms to develop products and technologies.", skills: ["Genetic Engineering","Cell Biology","Bioinformatics","Lab Techniques","Research"], salary: "₹4L – ₹20L/yr", degree: "B.Tech Biotechnology / M.Sc Biochemistry", roadmap: ["Core Biology","Molecular Biology","Lab Skills","Research Projects","PhD/Industry"], match: 87, videos: [{title:"Biotechnology Introduction",level:"Beginner",thumb:"https://i.ytimg.com/vi/R-Gu3KVeF8E/hqdefault.jpg",url:"https://youtube.com/watch?v=R-Gu3KVeF8E"},{title:"Genetic Engineering Course",level:"Intermediate",thumb:"https://i.ytimg.com/vi/zA44LJWQF2E/hqdefault.jpg",url:"https://youtube.com/watch?v=zA44LJWQF2E"},{title:"Bioinformatics Advanced",level:"Advanced",thumb:"https://i.ytimg.com/vi/CDUblZJCXNE/hqdefault.jpg",url:"https://youtube.com/watch?v=CDUblZJCXNE"}] },
    { id: "pharmacist", name: "Pharmacist", icon: "💊", desc: "Prepare and dispense medicines, counsel patients, and ensure safe medication use.", skills: ["Pharmacology","Pharmaceutical Chemistry","Drug Interactions","Patient Counseling","Regulatory Affairs"], salary: "₹3L – ₹15L/yr", degree: "B.Pharm / Pharm.D", roadmap: ["B.Pharm Course","Internship","Drug License","Hospital/Retail Pharmacy","M.Pharm (optional)"], match: 79, videos: [{title:"B.Pharma Complete Guide",level:"Beginner",thumb:"https://i.ytimg.com/vi/q4Xu5r4OqcQ/hqdefault.jpg",url:"https://youtube.com/watch?v=q4Xu5r4OqcQ"},{title:"Pharmacology Deep Dive",level:"Intermediate",thumb:"https://i.ytimg.com/vi/LFKbkNknWlU/hqdefault.jpg",url:"https://youtube.com/watch?v=LFKbkNknWlU"},{title:"Clinical Pharmacy Practice",level:"Advanced",thumb:"https://i.ytimg.com/vi/3TNoEkFVrUU/hqdefault.jpg",url:"https://youtube.com/watch?v=3TNoEkFVrUU"}] },
  ],
  "commerce": [
    { id: "ca", name: "Chartered Accountant (CA)", icon: "📑", desc: "Financial expert handling audits, taxation, and strategic financial planning for businesses.", skills: ["Accounting","Taxation","Auditing","Financial Reporting","Company Law"], salary: "₹7L – ₹50L+/yr", degree: "CA (ICAI) – Foundation → Inter → Final", roadmap: ["CA Foundation","CA Intermediate","Articleship 3 years","CA Final","Practice/Job"], match: 94, videos: [{title:"CA Foundation Full Course",level:"Beginner",thumb:"https://i.ytimg.com/vi/P-Gx-M5CDBA/hqdefault.jpg",url:"https://youtube.com/watch?v=P-Gx-M5CDBA"},{title:"Taxation Mastery Course",level:"Intermediate",thumb:"https://i.ytimg.com/vi/jXFhCd2i8jQ/hqdefault.jpg",url:"https://youtube.com/watch?v=jXFhCd2i8jQ"},{title:"Advanced Auditing Standards",level:"Advanced",thumb:"https://i.ytimg.com/vi/N8aULw1_fmU/hqdefault.jpg",url:"https://youtube.com/watch?v=N8aULw1_fmU"}] },
    { id: "investment-banker", name: "Investment Banker", icon: "🏦", desc: "Help companies raise capital, execute mergers & acquisitions, and provide financial advisory.", skills: ["Financial Modeling","Valuation","M&A","Excel/Bloomberg","Capital Markets"], salary: "₹10L – ₹80L+/yr", degree: "BBA/B.Com + MBA (Finance) / CFA", roadmap: ["Strong Finance Base","Excel & Financial Modeling","MBA Finance","CFA Level 1-3","Internship at Banks"], match: 88, videos: [{title:"Investment Banking Basics",level:"Beginner",thumb:"https://i.ytimg.com/vi/p9-w-y7P5dg/hqdefault.jpg",url:"https://youtube.com/watch?v=p9-w-y7P5dg"},{title:"Financial Modeling Course",level:"Intermediate",thumb:"https://i.ytimg.com/vi/2jiRqbsFU6M/hqdefault.jpg",url:"https://youtube.com/watch?v=2jiRqbsFU6M"},{title:"Advanced Valuation Techniques",level:"Advanced",thumb:"https://i.ytimg.com/vi/5O4T9f9LnN4/hqdefault.jpg",url:"https://youtube.com/watch?v=5O4T9f9LnN4"}] },
    { id: "marketing-manager", name: "Marketing Manager", icon: "📢", desc: "Lead brand strategy, digital campaigns, and market research to grow businesses.", skills: ["Digital Marketing","Market Research","Branding","SEO/SEM","Analytics"], salary: "₹5L – ₹25L/yr", degree: "BBA/B.Com + MBA (Marketing)", roadmap: ["Marketing Fundamentals","Digital Marketing Cert","MBA Marketing","Brand Management","CMO Track"], match: 82, videos: [{title:"Digital Marketing Course",level:"Beginner",thumb:"https://i.ytimg.com/vi/bixR-KIJKYM/hqdefault.jpg",url:"https://youtube.com/watch?v=bixR-KIJKYM"},{title:"SEO Mastery 2024",level:"Intermediate",thumb:"https://i.ytimg.com/vi/xsVTqzratPs/hqdefault.jpg",url:"https://youtube.com/watch?v=xsVTqzratPs"},{title:"Brand Strategy Advanced",level:"Advanced",thumb:"https://i.ytimg.com/vi/OiGcx5LmRRg/hqdefault.jpg",url:"https://youtube.com/watch?v=OiGcx5LmRRg"}] },
  ],
  "arts": [
    { id: "ias", name: "IAS Officer (Civil Services)", icon: "🏛️", desc: "Administer government policies, lead districts, and shape public service at national level.", skills: ["Political Science","History","Current Affairs","Essay Writing","Leadership"], salary: "₹9L – ₹25L/yr (Grade Pay)", degree: "Any Bachelor's Degree + UPSC Exam", roadmap: ["Graduate in any stream","UPSC Preparation (1-3 yrs)","Prelims → Mains → Interview","IAS Training Lal Bahadur Academy","District Posting"], match: 90, videos: [{title:"UPSC Complete Strategy",level:"Beginner",thumb:"https://i.ytimg.com/vi/9_eaJLTjDrk/hqdefault.jpg",url:"https://youtube.com/watch?v=9_eaJLTjDrk"},{title:"UPSC GS Paper 2 Full",level:"Intermediate",thumb:"https://i.ytimg.com/vi/JkJuA4iAFDk/hqdefault.jpg",url:"https://youtube.com/watch?v=JkJuA4iAFDk"},{title:"IAS Interview Preparation",level:"Advanced",thumb:"https://i.ytimg.com/vi/Mfzqkr7v6p4/hqdefault.jpg",url:"https://youtube.com/watch?v=Mfzqkr7v6p4"}] },
    { id: "journalist", name: "Journalist / Media Professional", icon: "📰", desc: "Investigate, report, and broadcast news across print, digital, and broadcast media.", skills: ["Writing","Research","Communication","Videography","Social Media"], salary: "₹3L – ₹20L/yr", degree: "B.A. Journalism / Mass Communication", roadmap: ["B.A. Mass Comm","Internship at Media House","Beat Reporting","Senior Journalist → Editor","Digital Media / Vlogging"], match: 85, videos: [{title:"Journalism Basics Course",level:"Beginner",thumb:"https://i.ytimg.com/vi/XyvXPWVFMHg/hqdefault.jpg",url:"https://youtube.com/watch?v=XyvXPWVFMHg"},{title:"Investigative Journalism",level:"Intermediate",thumb:"https://i.ytimg.com/vi/Wg4u-Zm7V3w/hqdefault.jpg",url:"https://youtube.com/watch?v=Wg4u-Zm7V3w"},{title:"Digital Media Strategy",level:"Advanced",thumb:"https://i.ytimg.com/vi/2hzMYlc_oD4/hqdefault.jpg",url:"https://youtube.com/watch?v=2hzMYlc_oD4"}] },
    { id: "psychologist", name: "Psychologist / Counselor", icon: "🧠", desc: "Study human behavior, counsel individuals, and support mental health & well-being.", skills: ["Psychology","Counseling","Research Methods","Empathy","CBT/DBT"], salary: "₹3L – ₹18L/yr", degree: "B.A. / B.Sc Psychology + M.Sc / M.Phil", roadmap: ["B.A. Psychology","M.Sc Psychology","RCI Registration (if needed)","Internship at Clinic/Hospital","Independent Practice"], match: 78, videos: [{title:"Psychology Introduction",level:"Beginner",thumb:"https://i.ytimg.com/vi/vo4pMVb0R6M/hqdefault.jpg",url:"https://youtube.com/watch?v=vo4pMVb0R6M"},{title:"Counseling Techniques",level:"Intermediate",thumb:"https://i.ytimg.com/vi/BX-8i4FVZNM/hqdefault.jpg",url:"https://youtube.com/watch?v=BX-8i4FVZNM"},{title:"Clinical Psychology Advanced",level:"Advanced",thumb:"https://i.ytimg.com/vi/g3j6cKQruOo/hqdefault.jpg",url:"https://youtube.com/watch?v=g3j6cKQruOo"}] },
  ],
  "agriculture": [
    { id: "agronomist", name: "Agronomist / Agricultural Scientist", icon: "🌱", desc: "Research and develop methods to improve crop production and soil management.", skills: ["Crop Science","Soil Analysis","Irrigation","GIS","Farm Technology"], salary: "₹4L – ₹20L/yr", degree: "B.Sc Agriculture / M.Sc Agronomy", roadmap: ["B.Sc Agriculture","Crop Research Projects","ICAR JRF Exam","M.Sc/PhD Agronomy","Research Institutions / NABARD"], match: 91, videos: [{title:"Agriculture Science Full Course",level:"Beginner",thumb:"https://i.ytimg.com/vi/Bq1aBopA5cQ/hqdefault.jpg",url:"https://youtube.com/watch?v=Bq1aBopA5cQ"},{title:"Soil Science & Management",level:"Intermediate",thumb:"https://i.ytimg.com/vi/6ck2pHG-KfM/hqdefault.jpg",url:"https://youtube.com/watch?v=6ck2pHG-KfM"},{title:"Precision Farming Technology",level:"Advanced",thumb:"https://i.ytimg.com/vi/Xx4aVRUBm7k/hqdefault.jpg",url:"https://youtube.com/watch?v=Xx4aVRUBm7k"}] },
    { id: "food-technologist", name: "Food Technologist", icon: "🥗", desc: "Develop, test, and improve food products ensuring safety, quality, and nutrition.", skills: ["Food Chemistry","Microbiology","Quality Control","HACCP","Food Processing"], salary: "₹3.5L – ₹18L/yr", degree: "B.Tech Food Technology / B.Sc Food Science", roadmap: ["Food Tech Degree","Lab & Processing Skills","FSSAI Regulations","Industry Internship","R&D / Quality Assurance Roles"], match: 84, videos: [{title:"Food Technology Basics",level:"Beginner",thumb:"https://i.ytimg.com/vi/j94BkEBG5kA/hqdefault.jpg",url:"https://youtube.com/watch?v=j94BkEBG5kA"},{title:"Food Safety & HACCP",level:"Intermediate",thumb:"https://i.ytimg.com/vi/JxjkV9DPUUA/hqdefault.jpg",url:"https://youtube.com/watch?v=JxjkV9DPUUA"},{title:"Food Product Development",level:"Advanced",thumb:"https://i.ytimg.com/vi/Hxv5nqAuEOo/hqdefault.jpg",url:"https://youtube.com/watch?v=Hxv5nqAuEOo"}] },
    { id: "agri-entrepreneur", name: "Agri-Entrepreneur / Farm Business Owner", icon: "🚜", desc: "Build agri-businesses, implement modern farming techniques, and lead rural innovation.", skills: ["Business Management","Modern Farming","Market Linkages","Agri-Tech","Financial Planning"], salary: "₹3L – ₹30L+ (variable)", degree: "B.Sc Agriculture + MBA Agribusiness", roadmap: ["Learn Modern Farming","Government Schemes (PM-KISAN etc.)","Startup/Farm Setup","Market Linkage & Export","Scale with Agri-Tech"], match: 77, videos: [{title:"Agri Startup Ideas India",level:"Beginner",thumb:"https://i.ytimg.com/vi/gQOCwLJXejE/hqdefault.jpg",url:"https://youtube.com/watch?v=gQOCwLJXejE"},{title:"Modern Farming Techniques",level:"Intermediate",thumb:"https://i.ytimg.com/vi/k8cHy08lRo0/hqdefault.jpg",url:"https://youtube.com/watch?v=k8cHy08lRo0"},{title:"Agribusiness Management",level:"Advanced",thumb:"https://i.ytimg.com/vi/O3lT6yqM-lI/hqdefault.jpg",url:"https://youtube.com/watch?v=O3lT6yqM-lI"}] },
  ],
  "cs": [
    { id: "ai-ml-engineer", name: "AI / ML Engineer", icon: "🤖", desc: "Build intelligent systems, neural networks, and ML pipelines that power modern AI.", skills: ["Python","TensorFlow/PyTorch","ML Algorithms","NLP","MLOps"], salary: "₹10L – ₹60L+/yr", degree: "B.Tech CS / M.Tech AI / B.Sc + Certifications", roadmap: ["Python + Math (Lin Alg, Stats)","ML Fundamentals","Deep Learning & NLP","MLOps & Deployment","Research / Industry Projects"], match: 97, videos: [{title:"AI/ML Complete Roadmap 2024",level:"Beginner",thumb:"https://i.ytimg.com/vi/GwIo3gDZCVQ/hqdefault.jpg",url:"https://youtube.com/watch?v=GwIo3gDZCVQ"},{title:"PyTorch Deep Learning Course",level:"Intermediate",thumb:"https://i.ytimg.com/vi/V_xro1bcAuA/hqdefault.jpg",url:"https://youtube.com/watch?v=V_xro1bcAuA"},{title:"LLMs & Transformers Advanced",level:"Advanced",thumb:"https://i.ytimg.com/vi/kCc8FmEb1nY/hqdefault.jpg",url:"https://youtube.com/watch?v=kCc8FmEb1nY"}] },
    { id: "cybersecurity", name: "Cybersecurity Analyst", icon: "🔐", desc: "Protect digital systems, networks, and data from cyber threats and vulnerabilities.", skills: ["Ethical Hacking","Network Security","SIEM Tools","Penetration Testing","Cloud Security"], salary: "₹6L – ₹35L/yr", degree: "B.Tech CS/IT + CEH / CISSP / OSCP", roadmap: ["Networking Basics","Linux & Scripting","CEH Certification","Bug Bounty Programs","Security Operations Center (SOC)"], match: 92, videos: [{title:"Cybersecurity for Beginners",level:"Beginner",thumb:"https://i.ytimg.com/vi/U_P23SqJaDc/hqdefault.jpg",url:"https://youtube.com/watch?v=U_P23SqJaDc"},{title:"Ethical Hacking Full Course",level:"Intermediate",thumb:"https://i.ytimg.com/vi/3Kq1MIfTWCE/hqdefault.jpg",url:"https://youtube.com/watch?v=3Kq1MIfTWCE"},{title:"Advanced Penetration Testing",level:"Advanced",thumb:"https://i.ytimg.com/vi/2_lswM1S264/hqdefault.jpg",url:"https://youtube.com/watch?v=2_lswM1S264"}] },
    { id: "fullstack", name: "Full Stack Developer", icon: "🌐", desc: "Build end-to-end web applications handling both frontend UI and backend server logic.", skills: ["React/Next.js","Node.js","Databases","REST APIs","Docker/AWS"], salary: "₹5L – ₹30L/yr", degree: "B.Tech CS / Self-taught + Bootcamp", roadmap: ["HTML/CSS/JS Basics","React Frontend","Node.js Backend","Databases (SQL + NoSQL)","Cloud & DevOps"], match: 94, videos: [{title:"Full Stack Web Dev 2024",level:"Beginner",thumb:"https://i.ytimg.com/vi/nu_pCVPKzTk/hqdefault.jpg",url:"https://youtube.com/watch?v=nu_pCVPKzTk"},{title:"React + Node.js Complete",level:"Intermediate",thumb:"https://i.ytimg.com/vi/7CqJlxBYj-M/hqdefault.jpg",url:"https://youtube.com/watch?v=7CqJlxBYj-M"},{title:"System Design for Engineers",level:"Advanced",thumb:"https://i.ytimg.com/vi/lX4CrbXMsNQ/hqdefault.jpg",url:"https://youtube.com/watch?v=lX4CrbXMsNQ"}] },
  ],
  "diploma": [
    { id: "electrician", name: "Licensed Electrician / Electrical Technician", icon: "⚡", desc: "Install, maintain, and repair electrical systems in homes, industries, and infrastructure.", skills: ["Electrical Wiring","Motor Winding","PLC","Panel Board","Safety Standards"], salary: "₹2.5L – ₹12L/yr", degree: "ITI Electrician / Diploma Electrical Engg", roadmap: ["ITI Electrician Course","Apprenticeship Training","License from State Board","Contractor Setup / Industry Job","Advanced PLC/Automation Training"], match: 88, videos: [{title:"Electrical Basics Course",level:"Beginner",thumb:"https://i.ytimg.com/vi/GqoXc9GPm-M/hqdefault.jpg",url:"https://youtube.com/watch?v=GqoXc9GPm-M"},{title:"PLC Programming Tutorial",level:"Intermediate",thumb:"https://i.ytimg.com/vi/aEn5qfi1XWA/hqdefault.jpg",url:"https://youtube.com/watch?v=aEn5qfi1XWA"},{title:"Industrial Automation Advanced",level:"Advanced",thumb:"https://i.ytimg.com/vi/F2RCKpZl-aQ/hqdefault.jpg",url:"https://youtube.com/watch?v=F2RCKpZl-aQ"}] },
    { id: "cnc-operator", name: "CNC Machinist / Manufacturing Tech", icon: "🏭", desc: "Operate computer-controlled machinery to manufacture precision parts for industries.", skills: ["CNC Programming","AutoCAD","G-Code","Quality Inspection","Machine Maintenance"], salary: "₹2.5L – ₹10L/yr", degree: "ITI Machinist / Diploma Mechanical", roadmap: ["ITI / Diploma Mechanical","CNC Machine Training","AutoCAD + G-Code","Quality Tools (Vernier, Micrometer)","Senior Machinist / CNC Programmer"], match: 82, videos: [{title:"CNC Machining Basics",level:"Beginner",thumb:"https://i.ytimg.com/vi/I4H6pBLAZ3k/hqdefault.jpg",url:"https://youtube.com/watch?v=I4H6pBLAZ3k"},{title:"G-Code Programming",level:"Intermediate",thumb:"https://i.ytimg.com/vi/JsIwxSxBhg0/hqdefault.jpg",url:"https://youtube.com/watch?v=JsIwxSxBhg0"},{title:"CAD/CAM for Manufacturing",level:"Advanced",thumb:"https://i.ytimg.com/vi/QmdgnD-bBHw/hqdefault.jpg",url:"https://youtube.com/watch?v=QmdgnD-bBHw"}] },
    { id: "it-support", name: "IT Support / Hardware Technician", icon: "🖥️", desc: "Troubleshoot, repair, and maintain computer hardware, networks, and IT infrastructure.", skills: ["Hardware Repair","Networking","OS Installation","Troubleshooting","Cloud Support"], salary: "₹2L – ₹8L/yr", degree: "ITI COPA / Diploma CS/IT + CompTIA A+", roadmap: ["ITI COPA / Diploma IT","CompTIA A+ Certification","Networking Basics (N+)","Cloud Support (AWS Fundamental)","IT Manager / System Admin"], match: 85, videos: [{title:"Hardware & Networking Basics",level:"Beginner",thumb:"https://i.ytimg.com/vi/qiQR5rTSshw/hqdefault.jpg",url:"https://youtube.com/watch?v=qiQR5rTSshw"},{title:"CompTIA A+ Full Course",level:"Intermediate",thumb:"https://i.ytimg.com/vi/87t6P5ZHTP0/hqdefault.jpg",url:"https://youtube.com/watch?v=87t6P5ZHTP0"},{title:"Network Administration",level:"Advanced",thumb:"https://i.ytimg.com/vi/qAFI-2me7KM/hqdefault.jpg",url:"https://youtube.com/watch?v=qAFI-2me7KM"}] },
  ],
};

const LEVEL_COLORS = { Beginner: "#10b981", Intermediate: "#f59e0b", Advanced: "#ef4444" };

// ─── LOGO SVG ────────────────────────────────────────────────────────────────
const RKSLogo = ({ size = 36 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="lg1" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#3b82f6"/>
        <stop offset="100%" stopColor="#8b5cf6"/>
      </linearGradient>
    </defs>
    <rect width="100" height="100" rx="22" fill="url(#lg1)"/>
    <text x="50" y="68" textAnchor="middle" fontFamily="'Segoe UI', sans-serif" fontWeight="900" fontSize="42" fill="white">R</text>
    <circle cx="78" cy="22" r="10" fill="#f59e0b"/>
    <circle cx="22" cy="78" r="6" fill="#10b981" opacity="0.8"/>
  </svg>
);

// ─── ANIMATIONS (CSS-in-JS) ──────────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}
  :root{
    --bg:#0a0a14;--surface:#12122a;--surface2:#1a1a35;--border:#2a2a50;
    --text:#f0f0ff;--text2:#9494b8;--accent1:#3b82f6;--accent2:#8b5cf6;
    --accent3:#f59e0b;--accent4:#10b981;--danger:#ef4444;
    --grad:linear-gradient(135deg,#3b82f6,#8b5cf6);
    --grad2:linear-gradient(135deg,#f59e0b,#ef4444);
    --shadow:0 8px 32px rgba(59,130,246,0.15);
    --shadow2:0 20px 60px rgba(0,0,0,0.5);
    --radius:16px;
    --nav-height: 64px;
    --container-pad: 24px;
  }
  body.light{
    --bg:#f0f2ff;--surface:#ffffff;--surface2:#eef0ff;--border:#dde0f5;
    --text:#0a0a14;--text2:#5555aa;--shadow:0 8px 32px rgba(59,130,246,0.1);
  }
  body{font-family:'Sora',sans-serif;background:var(--bg);color:var(--text);overflow-x:hidden;transition:background 0.4s,color 0.4s}
  ::-webkit-scrollbar{width:5px}
  ::-webkit-scrollbar-track{background:var(--surface)}
  ::-webkit-scrollbar-thumb{background:var(--accent2);border-radius:4px}

  @keyframes fadeUp{from{opacity:0;transform:translateY(30px)}to{opacity:1;transform:translateY(0)}}
  @keyframes fadeIn{from{opacity:0}to{opacity:1}}
  @keyframes scaleIn{from{opacity:0;transform:scale(0.9)}to{opacity:1;transform:scale(1)}}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}
  @keyframes spin{to{transform:rotate(360deg)}}
  @keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
  @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)}}
  @keyframes glow{0%,100%{box-shadow:0 0 20px rgba(59,130,246,0.3)}50%{box-shadow:0 0 40px rgba(139,92,246,0.5)}}
  @keyframes slideRight{from{transform:translateX(-20px);opacity:0}to{transform:translateX(0);opacity:1}}
  @keyframes borderFlow{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
  @keyframes countUp{from{opacity:0;transform:scale(0.5)}to{opacity:1;transform:scale(1)}}
  @keyframes orbitPulse{0%,100%{transform:scale(1);opacity:0.6}50%{transform:scale(1.15);opacity:1}}
  @keyframes gradShift{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}

  .page{animation:fadeIn 0.5s ease forwards}
  .fade-up{animation:fadeUp 0.6s ease forwards;opacity:0}
  .scale-in{animation:scaleIn 0.4s ease forwards;opacity:0}
  .slide-right{animation:slideRight 0.5s ease forwards;opacity:0}

  .glass{
    background:rgba(255,255,255,0.04);
    backdrop-filter:blur(16px);
    border:1px solid rgba(255,255,255,0.08);
    border-radius:var(--radius);
  }
  body.light .glass{background:rgba(255,255,255,0.7);border:1px solid rgba(59,130,246,0.15)}

  .btn-primary{
    background:var(--grad);
    color:#fff;border:none;
    padding:14px 32px;border-radius:50px;
    font-family:'Sora',sans-serif;font-weight:700;font-size:15px;
    cursor:pointer;transition:all 0.3s;position:relative;overflow:hidden;
    letter-spacing:0.5px;
    display:inline-flex;align-items:center;justify-content:center;
  }
  .btn-primary::before{content:'';position:absolute;inset:0;background:rgba(255,255,255,0);transition:0.3s}
  .btn-primary:hover::before{background:rgba(255,255,255,0.15)}
  .btn-primary:hover{transform:translateY(-2px);box-shadow:0 12px 30px rgba(59,130,246,0.4)}
  .btn-primary:active{transform:translateY(0)}

  .btn-ghost{
    background:transparent;color:var(--text);
    border:1px solid var(--border);
    padding:10px 24px;border-radius:50px;
    font-family:'Sora',sans-serif;font-weight:600;font-size:14px;
    cursor:pointer;transition:all 0.3s;
    display:inline-flex;align-items:center;justify-content:center;
  }
  .btn-ghost:hover{border-color:var(--accent1);color:var(--accent1);background:rgba(59,130,246,0.08)}

  .nav-link{
    color:var(--text2);font-weight:500;font-size:14px;
    cursor:pointer;padding:8px 4px;position:relative;
    transition:color 0.3s;background:none;border:none;font-family:'Sora',sans-serif;
  }
  .nav-link::after{
    content:'';position:absolute;bottom:0;left:0;width:0;height:2px;
    background:var(--grad);border-radius:2px;transition:width 0.3s;
  }
  .nav-link:hover,.nav-link.active{color:var(--text)}
  .nav-link:hover::after,.nav-link.active::after{width:100%}

  .card-hover{transition:transform 0.3s,box-shadow 0.3s,border-color 0.3s}
  .card-hover:hover{transform:translateY(-6px);box-shadow:0 20px 60px rgba(59,130,246,0.2);border-color:rgba(59,130,246,0.3)!important}

  .skill-tag{
    display:inline-block;
    background:rgba(59,130,246,0.1);
    color:var(--accent1);
    border:1px solid rgba(59,130,246,0.25);
    border-radius:20px;padding:4px 12px;
    font-size:12px;font-weight:600;
    margin:3px;transition:all 0.2s;cursor:default;
  }
  .skill-tag:hover{background:rgba(59,130,246,0.2);transform:scale(1.05)}
  .skill-tag.owned{background:rgba(16,185,129,0.1);color:var(--accent4);border-color:rgba(16,185,129,0.25)}
  .skill-tag.missing{background:rgba(239,68,68,0.1);color:var(--danger);border-color:rgba(239,68,68,0.25)}

  .match-ring{position:relative;display:inline-flex;align-items:center;justify-content:center}
  .match-ring svg{transform:rotate(-90deg)}

  .roadmap-step{
    display:flex;align-items:center;gap:12px;
    padding:10px 0;position:relative;
  }
  .roadmap-step:not(:last-child)::after{
    content:'';position:absolute;left:15px;top:38px;width:2px;height:calc(100% - 10px);
    background:var(--border);
  }
  .step-dot{
    width:32px;height:32px;border-radius:50%;
    background:var(--grad);
    display:flex;align-items:center;justify-content:center;
    font-size:12px;font-weight:700;color:#fff;flex-shrink:0;
    position:relative;z-index:1;
  }

  .hero-bg{
    position:absolute;inset:0;
    background:radial-gradient(ellipse at 20% 50%,rgba(59,130,246,0.15) 0%,transparent 60%),
               radial-gradient(ellipse at 80% 20%,rgba(139,92,246,0.15) 0%,transparent 60%),
               radial-gradient(ellipse at 60% 80%,rgba(245,158,11,0.08) 0%,transparent 50%);
  }
  .grid-bg{
    position:absolute;inset:0;opacity:0.03;
    background-image:linear-gradient(var(--accent1) 1px,transparent 1px),
                     linear-gradient(90deg,var(--accent1) 1px,transparent 1px);
    background-size:40px 40px;
  }

  .progress-bar{height:8px;border-radius:4px;background:var(--border);overflow:hidden}
  .progress-fill{height:100%;border-radius:4px;background:var(--grad);transition:width 1s ease}

  .salary-badge{
    background:linear-gradient(135deg,rgba(16,185,129,0.1),rgba(59,130,246,0.1));
    border:1px solid rgba(16,185,129,0.2);
    color:var(--accent4);
    padding:6px 14px;border-radius:20px;
    font-size:13px;font-weight:700;
    font-family:'JetBrains Mono',monospace;
  }

  .level-badge{
    padding:3px 10px;border-radius:10px;font-size:11px;font-weight:700;
    font-family:'JetBrains Mono',monospace;
  }

  .compare-bar{
    height:12px;border-radius:6px;
    background:var(--grad);
    transition:width 0.8s ease;
  }

  .search-input{
    width:100%;background:var(--surface);
    border:1px solid var(--border);border-radius:50px;
    padding:12px 20px 12px 48px;
    color:var(--text);font-family:'Sora',sans-serif;font-size:14px;
    transition:all 0.3s;outline:none;
  }
  .search-input:focus{border-color:var(--accent1);box-shadow:0 0 0 3px rgba(59,130,246,0.1)}

  .tab{
    padding:8px 20px;border-radius:50px;cursor:pointer;
    font-weight:600;font-size:13px;transition:all 0.3s;
    background:none;border:none;color:var(--text2);font-family:'Sora',sans-serif;
  }
  .tab.active{background:var(--grad);color:#fff}
  .tab:hover:not(.active){color:var(--text);background:var(--surface2)}

  input[type=range]{-webkit-appearance:none;height:6px;border-radius:3px;background:var(--border);outline:none}
  input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:18px;height:18px;border-radius:50%;background:var(--accent1);cursor:pointer}

  .floating-orb{
    position:absolute;border-radius:50%;filter:blur(60px);pointer-events:none;
    animation:orbitPulse 4s ease-in-out infinite;
  }

  .notification{
    position:fixed;top:80px;right:20px;z-index:9999;
    background:var(--surface);border:1px solid var(--border);
    border-radius:12px;padding:14px 20px;
    box-shadow:var(--shadow2);
    animation:slideRight 0.4s ease;
    display:flex;align-items:center;gap:10px;
    font-size:14px;font-weight:600;
    max-width:320px;
  }

  .video-card{
    border-radius:12px;overflow:hidden;
    border:1px solid var(--border);
    transition:all 0.3s;cursor:pointer;
    background:var(--surface);
  }
  .video-card:hover{transform:scale(1.03);border-color:rgba(59,130,246,0.4);box-shadow:0 12px 30px rgba(59,130,246,0.15)}

  .checkbox-custom{
    width:20px;height:20px;border-radius:6px;
    border:2px solid var(--border);
    cursor:pointer;transition:all 0.2s;
    display:flex;align-items:center;justify-content:center;flex-shrink:0;
  }
  .checkbox-custom.checked{background:var(--grad);border-color:transparent}

  select{
    background:var(--surface);color:var(--text);
    border:1px solid var(--border);border-radius:10px;
    padding:10px 14px;font-family:'Sora',sans-serif;font-size:14px;
    outline:none;cursor:pointer;transition:border-color 0.3s;
    width:100%;
  }
  select:focus{border-color:var(--accent1)}

  .shimmer-loading{
    background:linear-gradient(90deg,var(--surface) 25%,var(--surface2) 50%,var(--surface) 75%);
    background-size:200% 100%;
    animation:shimmer 1.5s infinite;
    border-radius:8px;
  }

  /* Responsive Utilities */
  .mobile-only { display: none; }
  .desktop-only { display: flex; }

  @media (max-width: 768px) {
    :root {
      --container-pad: 16px;
    }
    .mobile-only { display: flex; }
    .desktop-only { display: none !important; }
    
    .btn-primary, .btn-ghost {
      padding: 12px 24px;
      font-size: 14px;
    }
    
    .glass {
      padding: 20px !important;
    }
  }

  @media (max-width: 480px) {
    :root {
      --container-pad: 12px;
    }
    .btn-primary, .btn-ghost {
      padding: 10px 20px;
      font-size: 13px;
    }
    .hero-h1 { font-size: 32px !important; }
    .hero-p { font-size: 15px !important; }
  }

  /* Hamburger Menu Animation */
  .hamburger {
    width: 28px; height: 18px;
    display: flex; flex-direction: column; justify-content: space-between;
    cursor: pointer; background: none; border: none; padding: 0;
    z-index: 1001;
  }
  .hamburger span {
    width: 100%; height: 2px; background: var(--text);
    border-radius: 2px; transition: 0.3s;
  }
  .hamburger.active span:nth-child(1) { transform: translateY(8px) rotate(45deg); }
  .hamburger.active span:nth-child(2) { opacity: 0; }
  .hamburger.active span:nth-child(3) { transform: translateY(-8px) rotate(-45deg); }

  .mobile-menu {
    position: fixed; top: 0; left: 0; width: 100%; height: 100vh;
    background: var(--bg); z-index: 999;
    padding: 80px 24px 24px; display: flex; flex-direction: column; gap: 20px;
    transform: translateX(100%); transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .mobile-menu.active { transform: translateX(0); }
  .mobile-menu .nav-link { font-size: 20px; padding: 12px 0; width: 100%; text-align: left; opacity: 0; transform: translateX(20px); transition: 0.4s; }
  .mobile-menu.active .nav-link { opacity: 1; transform: translateX(0); }
  .mobile-menu.active .nav-link:nth-child(1) { transition-delay: 0.1s; }
  .mobile-menu.active .nav-link:nth-child(2) { transition-delay: 0.2s; }
  .mobile-menu.active .nav-link:nth-child(3) { transition-delay: 0.3s; }
  .mobile-menu.active .nav-link:nth-child(4) { transition-delay: 0.4s; }

  /* Admin Responsive Styles */
  .admin-sidebar {
    position: fixed; top: 64px; left: 0; bottom: 0;
    background: var(--surface); border-right: 1px solid var(--border);
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), width 0.3s ease;
    z-index: 1002;
  }
  .admin-main {
    transition: margin-left 0.3s ease;
    min-height: calc(100vh - 64px);
  }
  .admin-overlay {
    position: fixed; inset: 0; background: rgba(0,0,0,0.5);
    z-index: 1001; opacity: 0; pointer-events: none; transition: 0.3s;
  }
  .admin-overlay.active { opacity: 1; pointer-events: auto; }

  @media (max-width: 992px) {
    .admin-sidebar {
      transform: translateX(-100%);
      width: 280px !important;
    }
    .admin-sidebar.active { transform: translateX(0); }
    .admin-main { margin-left: 0 !important; }
  }

  /* Table responsiveness */
  .table-container {
    width: 100%; overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    border-radius: var(--radius);
  }
  table { width: 100%; border-collapse: collapse; min-width: 600px; }
`;


// ─── HELPER COMPONENTS ───────────────────────────────────────────────────────

const MatchRing = ({ pct, size = 80, color = "#3b82f6" }) => {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <div className="match-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle cx={size/2} cy={size/2} r={r} stroke="var(--border)" strokeWidth="6" fill="none"/>
        <circle cx={size/2} cy={size/2} r={r} stroke={color} strokeWidth="6" fill="none"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          style={{ transition: "stroke-dasharray 1s ease" }}/>
      </svg>
      <div style={{ position:"absolute", textAlign:"center" }}>
        <div style={{ fontSize: size*0.2, fontWeight:800, color, fontFamily:"'JetBrains Mono',monospace" }}>{pct}%</div>
        <div style={{ fontSize: 9, color:"var(--text2)", fontWeight:600 }}>MATCH</div>
      </div>
    </div>
  );
};

const Loader = () => (
  <div style={{ position:"fixed",inset:0,background:"var(--bg)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",zIndex:9999,animation:"fadeIn 0.3s ease" }}>
    <div style={{ animation:"float 2s ease-in-out infinite" }}>
      <RKSLogo size={72}/>
    </div>
    <div style={{ marginTop:24, fontWeight:800, fontSize:22, background:"linear-gradient(135deg,#3b82f6,#8b5cf6)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>
      RKS CODE
    </div>
    <div style={{ marginTop:8, color:"var(--text2)", fontSize:13 }}>Analyzing career paths with AI...</div>
    <div style={{ marginTop:32, display:"flex", gap:8 }}>
      {[0,1,2,3,4].map(i => (
        <div key={i} style={{ width:8,height:8,borderRadius:"50%",background:"var(--grad)",animation:`pulse 1.2s ${i*0.2}s ease-in-out infinite` }}/>
      ))}
    </div>
  </div>
);

const Notification = ({ msg, icon, onClose }) => (
  <div className="notification">
    <span style={{ fontSize:20 }}>{icon}</span>
    <span style={{ color:"var(--text)" }}>{msg}</span>
    <button onClick={onClose} style={{ marginLeft:"auto", background:"none", border:"none", cursor:"pointer", color:"var(--text2)", fontSize:16 }}>×</button>
  </div>
);

// ─── NAVBAR ──────────────────────────────────────────────────────────────────
const Navbar = ({ page, setPage, darkMode, toggleDark, savedCount }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const links = [
    { id: "home", label: "Home" },
    { id: "finder", label: "Career Finder" },
    { id: "about", label: "About" },
    { id: "contact", label: "Contact" },
  ];

  const handleNav = (id) => {
    setPage(id);
    setMenuOpen(false);
  };

  return (
    <>
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 1000,
        background: darkMode ? "rgba(10,10,20,0.85)" : "rgba(255,255,255,0.85)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid var(--border)",
        padding: "0 var(--container-pad)", height: "var(--nav-height)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        transition: "background 0.4s"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }} onClick={() => handleNav("home")}>
          <RKSLogo size={36} />
          <span style={{ fontWeight: 800, fontSize: 18, background: "linear-gradient(135deg,#3b82f6,#8b5cf6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", letterSpacing: "-0.5px" }}>
            RKS CODE
          </span>
        </div>

        {/* Desktop links */}
        <div className="desktop-only" style={{ gap: 28, alignItems: "center" }}>
          {links.map(l => (
            <button key={l.id} className={`nav-link ${page === l.id ? "active" : ""}`} onClick={() => handleNav(l.id)}>{l.label}</button>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div className="desktop-only" style={{ gap: 12, alignItems: "center" }}>
            {savedCount > 0 && (
              <button className="btn-ghost" style={{ padding: "7px 14px", fontSize: 13 }} onClick={() => handleNav("saved")}>
                🔖 {savedCount}
              </button>
            )}
            <button className="btn-primary" style={{ padding: "9px 20px", fontSize: 13 }} onClick={() => handleNav("finder")}>
              Find Career
            </button>
          </div>

          <button onClick={toggleDark} style={{
            background: "var(--surface2)", border: "1px solid var(--border)",
            borderRadius: "50%", width: 38, height: 38, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16,
            transition: "all 0.3s"
          }}>
            {darkMode ? "☀️" : "🌙"}
          </button>

          {/* Hamburger button (Mobile Only) */}
          <button className={`hamburger mobile-only ${menuOpen ? "active" : ""}`} onClick={() => setMenuOpen(!menuOpen)}>
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <div className={`mobile-menu ${menuOpen ? "active" : ""}`}>
        {links.map(l => (
          <button key={l.id} className={`nav-link ${page === l.id ? "active" : ""}`} onClick={() => handleNav(l.id)}>
            {l.label}
          </button>
        ))}
        {savedCount > 0 && (
          <button className="nav-link" onClick={() => handleNav("saved")}>
            🔖 Saved Careers ({savedCount})
          </button>
        )}
        <button className="btn-primary" style={{ marginTop: 10, width: "100%" }} onClick={() => handleNav("finder")}>
          🚀 Find Career
        </button>
      </div>
    </>
  );
};


// ─── HOME PAGE ────────────────────────────────────────────────────────────────
const HomePage = ({ setPage }) => {
  const stats = [
    { n: "50+", l: "Career Paths" },
    { n: "7", l: "Academic Streams" },
    { n: "AI", l: "Powered Engine" },
    { n: "Free", l: "Always" },
  ];
  return (
    <div className="page" style={{ paddingTop: "var(--nav-height)", minHeight: "100vh", position: "relative", overflow: "hidden" }}>
      <div className="hero-bg" />
      <div className="grid-bg" />
      {/* Floating orbs */}
      <div className="floating-orb" style={{ width: 400, height: 400, background: "rgba(59,130,246,0.1)", top: -100, right: -100, animationDelay: "0s" }} />
      <div className="floating-orb" style={{ width: 300, height: 300, background: "rgba(139,92,246,0.1)", bottom: 100, left: -80, animationDelay: "2s" }} />

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "60px var(--container-pad) 40px", textAlign: "center", position: "relative" }}>
        <div className="fade-up" style={{ animationDelay: "0.1s", marginBottom: 20 }}>
          <span style={{ background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.25)", color: "var(--accent1)", padding: "6px 18px", borderRadius: 20, fontSize: 13, fontWeight: 700, display: "inline-block" }}>
            🤖 AI-Powered Career Intelligence
          </span>
        </div>

        <h1 className="fade-up hero-h1" style={{ animationDelay: "0.2s", fontSize: "clamp(32px, 8vw, 72px)", fontWeight: 900, lineHeight: 1.1, letterSpacing: "-2px", marginBottom: 20 }}>
          AI Career Path<br />
          <span style={{ background: "linear-gradient(135deg,#3b82f6,#8b5cf6,#f59e0b)", backgroundSize: "200%", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", animation: "gradShift 4s ease infinite" }}>
            Recommendation
          </span>
        </h1>

        <p className="fade-up hero-p" style={{ animationDelay: "0.3s", fontSize: "clamp(15px, 2.5vw, 20px)", color: "var(--text2)", maxWidth: 600, margin: "0 auto 40px", lineHeight: 1.7 }}>
          Find your perfect career using AI — tailored to your stream, skills, interests, and goals. Get a complete roadmap, skill gap analysis, and curated learning resources.
        </p>

        <div className="fade-up" style={{ animationDelay: "0.4s", display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
          <button className="btn-primary" style={{ fontSize: 17, padding: "16px 40px", animation: "glow 3s infinite" }} onClick={() => setPage("finder")}>
            🚀 Start Career Finder
          </button>
          <button className="btn-ghost" style={{ fontSize: 15, padding: "16px 32px" }} onClick={() => setPage("about")}>
            Learn More
          </button>
        </div>

        {/* Stats */}
        <div className="fade-up" style={{ animationDelay: "0.6s", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 16, marginTop: 60, maxWidth: 800, margin: "60px auto 0" }}>
          {stats.map((s, i) => (
            <div key={i} className="glass" style={{ padding: "20px 10px", textAlign: "center" }}>
              <div style={{ fontSize: 28, fontWeight: 900, background: "var(--grad)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", fontFamily: "'JetBrains Mono',monospace" }}>{s.n}</div>
              <div style={{ fontSize: 12, color: "var(--text2)", fontWeight: 600, marginTop: 4 }}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Feature cards */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px var(--container-pad) 80px" }}>
        <h2 style={{ textAlign: "center", fontWeight: 800, fontSize: "clamp(24px, 5vw, 32px)", marginBottom: 40 }}>
          Everything You Need to Choose the Right Career
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 300px), 1fr))", gap: 20 }}>
          {[
            { icon: "🎯", t: "AI Matching", d: "Our engine analyzes your stream, skills, and interests to find your top 3 career matches with a compatibility score." },
            { icon: "📊", t: "Skill Gap Analysis", d: "See exactly which skills you have and which ones you need to develop to land your dream career." },
            { icon: "🗺️", t: "Roadmap Builder", d: "Get a step-by-step learning roadmap from beginner to professional with milestones and resources." },
            { icon: "📹", t: "YouTube Learning", d: "Curated beginner, intermediate, and advanced YouTube courses for each career path you explore." },
            { icon: "⚖️", t: "Career Comparison", d: "Compare two career paths side-by-side on salary, skills, time to learn, and job prospects." },
            { icon: "📄", t: "PDF Export", d: "Download your personalized career roadmap as a professional PDF to keep and share." },
          ].map((f, i) => (
            <div key={i} className="glass card-hover" style={{ padding: 28, animationDelay: `${i * 0.1}s`, cursor: "pointer" }}>
              <div style={{ fontSize: 36, marginBottom: 16 }}>{f.icon}</div>
              <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 8 }}>{f.t}</div>
              <div style={{ color: "var(--text2)", fontSize: 14, lineHeight: 1.6 }}>{f.d}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── STREAM SELECTION ─────────────────────────────────────────────────────────
const StreamPage = ({ onSelect }) => (
  <div className="page" style={{ paddingTop: "var(--nav-height)", minHeight: "100vh", maxWidth: 1100, margin: "0 auto", padding: "60px var(--container-pad)" }}>
    <div className="fade-up" style={{ textAlign: "center", marginBottom: 50 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--accent1)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>Step 1 of 4</div>
      <h2 style={{ fontSize: "clamp(24px, 6vw, 36px)", fontWeight: 900, marginBottom: 12 }}>Choose Your Academic Stream</h2>
      <p style={{ color: "var(--text2)", fontSize: 16 }}>This helps our AI understand your educational background</p>
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 300px), 1fr))", gap: 20 }}>
      {STREAMS.map((s, i) => (
        <div key={s.id} className="glass card-hover scale-in" style={{ padding: 30, cursor: "pointer", animationDelay: `${i * 0.08}s`, border: `1px solid rgba(${s.color.slice(1).match(/../g).map(x => parseInt(x, 16)).join(",")},0.25)` }}
          onClick={() => onSelect(s.id)}>
          <div style={{ fontSize: "clamp(32px, 8vw, 48px)", marginBottom: 16 }}>{s.icon}</div>
          <div style={{ fontWeight: 800, fontSize: 20, marginBottom: 8 }}>{s.label}</div>
          <div style={{ color: "var(--text2)", fontSize: 14, marginBottom: 16 }}>{s.desc}</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {STREAM_SKILLS[s.id].slice(0, 3).map(sk => (
              <span key={sk} className="skill-tag" style={{ fontSize: 11 }}>{sk}</span>
            ))}
            <span style={{ color: "var(--text2)", fontSize: 12, padding: "4px 10px" }}>+{STREAM_SKILLS[s.id].length - 3} more</span>
          </div>
          <div style={{ marginTop: 20, display: "flex", alignItems: "center", gap: 8, color: s.color, fontWeight: 700, fontSize: 14 }}>
            Select Stream <span>→</span>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// ─── SKILLS + ADDITIONAL INFO ─────────────────────────────────────────────────
const SkillsPage = ({ stream, onSubmit }) => {
  const skills = STREAM_SKILLS[stream] || [];
  const [sel, setSel] = useState([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [edu, setEdu] = useState("");
  const [interests, setInterests] = useState("");
  const [salary, setSalary] = useState(5);
  const [workType, setWorkType] = useState("");
  const [goal, setGoal] = useState("");
  const streamInfo = STREAMS.find(s => s.id === stream);

  const toggle = sk => setSel(prev => prev.includes(sk) ? prev.filter(x => x !== sk) : [...prev, sk]);

  return (
    <div className="page" style={{ paddingTop: "var(--nav-height)", maxWidth: 900, margin: "0 auto", padding: "60px var(--container-pad)" }}>
      <div className="fade-up" style={{ textAlign: "center", marginBottom: 40 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--accent1)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>Steps 2–3 of 4</div>
        <h2 style={{ fontSize: "clamp(22px, 5vw, 36px)", fontWeight: 900, marginBottom: 12 }}>
          {streamInfo?.icon} {streamInfo?.label} — Skills & Preferences
        </h2>
        <p style={{ color: "var(--text2)", fontSize: 16 }}>Select skills you already have, then fill in your preferences</p>
      </div>

      {/* Skills */}
      <div className="glass" style={{ padding: 28, marginBottom: 24 }}>
        <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 6 }}>✅ Select Your Existing Skills</div>
        <div style={{ color: "var(--text2)", fontSize: 13, marginBottom: 20 }}>
          {sel.length} of {skills.length} selected
        </div>
        <div className="progress-bar" style={{ marginBottom: 20 }}>
          <div className="progress-fill" style={{ width: `${(sel.length / skills.length) * 100}%` }} />
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {skills.map(sk => (
            <span key={sk} onClick={() => toggle(sk)} className="skill-tag"
              style={{
                cursor: "pointer",
                background: sel.includes(sk) ? "rgba(16,185,129,0.15)" : "",
                color: sel.includes(sk) ? "var(--accent4)" : "",
                borderColor: sel.includes(sk) ? "rgba(16,185,129,0.4)" : "",
                transform: sel.includes(sk) ? "scale(1.05)" : "scale(1)"
              }}>
              {sel.includes(sk) ? "✓ " : ""}{sk}
            </span>
          ))}
        </div>
      </div>

      {/* Additional info */}
      <div className="glass" style={{ padding: 28, marginBottom: 24 }}>
        <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 20 }}>📋 Additional Information</div>

        {/* Name & Email for lead capture */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 250px), 1fr))", gap: 20, marginBottom: 20, paddingBottom: 20, borderBottom: "1px solid var(--border)" }}>
          <div>
            <label style={{ display: "block", marginBottom: 8, fontWeight: 600, fontSize: 13, color: "var(--text2)" }}>YOUR NAME <span style={{ color: "var(--accent1)" }}>*</span></label>
            <input className="search-input" style={{ paddingLeft: 16, borderRadius: 10 }}
              placeholder="Enter your full name"
              value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div>
            <label style={{ display: "block", marginBottom: 8, fontWeight: 600, fontSize: 13, color: "var(--text2)" }}>EMAIL ADDRESS <span style={{ color: "var(--accent1)" }}>*</span></label>
            <input className="search-input" style={{ paddingLeft: 16, borderRadius: 10 }}
              placeholder="your@email.com" type="email"
              value={email} onChange={e => setEmail(e.target.value)} />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 250px), 1fr))", gap: 20 }}>
          <div>
            <label style={{ display: "block", marginBottom: 8, fontWeight: 600, fontSize: 13, color: "var(--text2)" }}>EDUCATION LEVEL</label>
            <select value={edu} onChange={e => setEdu(e.target.value)}>
              <option value="">Select education level</option>
              <option>10th Pass</option>
              <option>12th Pass</option>
              <option>Diploma / ITI</option>
              <option>Bachelor's Degree</option>
              <option>Master's Degree</option>
              <option>PhD</option>
            </select>
          </div>
          <div>
            <label style={{ display: "block", marginBottom: 8, fontWeight: 600, fontSize: 13, color: "var(--text2)" }}>WORK TYPE PREFERENCE</label>
            <select value={workType} onChange={e => setWorkType(e.target.value)}>
              <option value="">Select work type</option>
              <option>Government Job</option>
              <option>Private Sector</option>
              <option>Freelancing</option>
              <option>Entrepreneurship</option>
              <option>Research / Academia</option>
              <option>Remote Work</option>
            </select>
          </div>
          <div>
            <label style={{ display: "block", marginBottom: 8, fontWeight: 600, fontSize: 13, color: "var(--text2)" }}>CAREER GOAL</label>
            <select value={goal} onChange={e => setGoal(e.target.value)}>
              <option value="">Select career goal</option>
              <option>High Income</option>
              <option>Work-Life Balance</option>
              <option>Social Impact</option>
              <option>Innovation & Research</option>
              <option>Creative Expression</option>
              <option>Leadership & Management</option>
            </select>
          </div>
          <div>
            <label style={{ display: "block", marginBottom: 8, fontWeight: 600, fontSize: 13, color: "var(--text2)" }}>INTERESTS</label>
            <input className="search-input" style={{ paddingLeft: 16, borderRadius: 10 }}
              placeholder="e.g. technology, healthcare, finance..."
              value={interests} onChange={e => setInterests(e.target.value)} />
          </div>
        </div>

        {/* Salary slider */}
        <div style={{ marginTop: 24 }}>
          <label style={{ display: "block", marginBottom: 8, fontWeight: 600, fontSize: 13, color: "var(--text2)" }}>
            SALARY EXPECTATION: <span style={{ color: "var(--accent1)", fontFamily: "'JetBrains Mono',monospace" }}>₹{salary}L – ₹{salary + 10}L/yr</span>
          </label>
          <input type="range" min={2} max={50} value={salary} onChange={e => setSalary(Number(e.target.value))} style={{ width: "100%" }} />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--text2)", marginTop: 4 }}>
            <span>₹2L</span><span>₹25L</span><span>₹50L+</span>
          </div>
        </div>
      </div>

      <button className="btn-primary" style={{ width: "100%", fontSize: 16, padding: "16px" }}
        onClick={() => onSubmit({ stream, skills: sel, name, email, edu, interests, salary, workType, goal })}>
        🤖 Generate AI Recommendations →
      </button>
    </div>
  );
};

// ─── RESULTS DASHBOARD ────────────────────────────────────────────────────────
const ResultsPage = ({ data, saved, toggleSave, onDetail, onCompare, compareList, notify }) => {
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const [minSal, setMinSal] = useState(0);
  const careers = CAREERS_DB[data.stream] || [];
  const streamInfo = STREAMS.find(s => s.id === data.stream);

  const filtered = careers.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase());
    const salNum = parseInt(c.salary.replace(/[^0-9]/g,"").slice(0,4));
    const matchSal = salNum >= minSal;
    return matchSearch && matchSal;
  });

  return (
    <div className="page" style={{ paddingTop: "var(--nav-height)", maxWidth: 1100, margin: "0 auto", padding: "60px var(--container-pad)" }}>
      {/* Header */}
      <div className="fade-up" style={{ marginBottom:36 }}>
        <div style={{ fontSize:13,fontWeight:700,color:"var(--accent1)",letterSpacing:2,textTransform:"uppercase",marginBottom:8 }}>AI Results</div>
        <div style={{ display:"flex",alignItems:"flex-end",justifyContent:"space-between",flexWrap:"wrap",gap:12 }}>
          <h2 style={{ fontSize: "clamp(24px, 5vw, 32px)", fontWeight: 900 }}>
            {streamInfo?.icon} Top Careers for {streamInfo?.label}
          </h2>
          <div style={{ display:"flex",gap:8 }}>
            {compareList.length === 2 && (
              <button className="btn-primary" style={{ fontSize:13,padding:"9px 18px" }} onClick={onCompare}>
                ⚖️ Compare ({compareList.length})
              </button>
            )}
          </div>
        </div>
        <p style={{ color:"var(--text2)",marginTop:8,fontSize:15 }}>
          Based on your {data.skills.length} skills, {data.workType || "any work type"} preference, and ₹{data.salary}L+ salary expectation
        </p>
      </div>

      {/* Search & filter */}
      <div className="glass" style={{ padding:20,marginBottom:28,display:"flex",gap:16,flexWrap:"wrap",alignItems:"center" }}>
        <div style={{ flex:1,minWidth:200,position:"relative" }}>
          <span style={{ position:"absolute",left:16,top:"50%",transform:"translateY(-50%)",color:"var(--text2)" }}>🔍</span>
          <input className="search-input" placeholder="Search careers..." value={search} onChange={e => setSearch(e.target.value)}/>
        </div>
        <div style={{ display:"flex",gap:6 }}>
          {["all","top","saved"].map(t => (
            <button key={t} className={`tab ${tab===t?"active":""}`} onClick={() => setTab(t)}>
              {t === "all" ? "All" : t === "top" ? "🏆 Top Match" : "🔖 Saved"}
            </button>
          ))}
        </div>
        <div style={{ display:"flex",alignItems:"center",gap:10 }}>
          <span style={{ fontSize:12,color:"var(--text2)",whiteSpace:"nowrap" }}>Min: ₹{minSal}L</span>
          <input type="range" min={0} max={20} value={minSal} onChange={e => setMinSal(Number(e.target.value))} style={{ width:80 }}/>
        </div>
      </div>

      {/* Career cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))", gap: 24 }}>
        {filtered
          .filter(c => tab === "saved" ? saved.includes(c.id) : tab === "top" ? c.match >= 85 : true)
          .sort((a,b) => b.match - a.match)
          .map((c,i) => (
          <CareerCard key={c.id} career={c} index={i} saved={saved.includes(c.id)}
            onSave={() => toggleSave(c.id)} onDetail={() => onDetail(c)}
            inCompare={compareList.includes(c.id)}
            onCompareToggle={() => {
              if (compareList.includes(c.id)) {
                notify("Removed from comparison","🔄");
              } else if (compareList.length >= 2) {
                notify("Only 2 careers can be compared at once","⚠️");
                return;
              } else {
                notify("Added to comparison","⚖️");
              }
            }}
            userSkills={data.skills}
          />
        ))}
      </div>
    </div>
  );
};

const CareerCard = ({ career: c, index, saved, onSave, onDetail, userSkills, inCompare, onCompareToggle }) => {
  const ownedSkills = c.skills.filter(s => userSkills.includes(s));
  const gapSkills = c.skills.filter(s => !userSkills.includes(s));
  return (
    <div className="glass card-hover scale-in" style={{ padding:28, animationDelay:`${index*0.1}s`, position:"relative", border:"1px solid var(--border)", display:"flex", flexDirection:"column", gap:16 }}>
      {index === 0 && (
        <div style={{ position:"absolute",top:-12,left:20,background:"var(--grad2)",color:"#fff",padding:"4px 14px",borderRadius:20,fontSize:11,fontWeight:800 }}>
          🏆 TOP MATCH
        </div>
      )}
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start" }}>
        <div>
          <div style={{ fontSize:36,marginBottom:8 }}>{c.icon}</div>
          <div style={{ fontWeight:800,fontSize:20,lineHeight:1.2 }}>{c.name}</div>
        </div>
        <MatchRing pct={c.match} size={70}/>
      </div>

      <p style={{ color:"var(--text2)",fontSize:14,lineHeight:1.6 }}>{c.desc}</p>

      <div className="salary-badge" style={{ alignSelf:"flex-start" }}>💰 {c.salary}</div>

      {/* Skill gap */}
      <div>
        <div style={{ fontSize:12,fontWeight:700,color:"var(--text2)",marginBottom:8,textTransform:"uppercase",letterSpacing:1 }}>Skill Match</div>
        <div className="progress-bar" style={{ marginBottom:8 }}>
          <div className="progress-fill" style={{ width:`${(ownedSkills.length/c.skills.length)*100}%`, background: ownedSkills.length === c.skills.length ? "linear-gradient(135deg,#10b981,#059669)" : "var(--grad)" }}/>
        </div>
        <div style={{ display:"flex",flexWrap:"wrap",gap:4 }}>
          {ownedSkills.slice(0,2).map(s => <span key={s} className="skill-tag owned">✓ {s}</span>)}
          {gapSkills.slice(0,2).map(s => <span key={s} className="skill-tag missing">+ {s}</span>)}
          {c.skills.length > 4 && <span style={{ color:"var(--text2)",fontSize:12,padding:"4px" }}>+{c.skills.length-4}</span>}
        </div>
      </div>

      <div style={{ display:"flex",gap:8,flexWrap:"wrap",marginTop:"auto" }}>
        <button className="btn-primary" style={{ flex:1,padding:"10px",fontSize:13 }} onClick={onDetail}>View Details →</button>
        <button className="btn-ghost" style={{ padding: "10px 14px", fontSize: 16 }} onClick={onSave} title="Save">
          {saved ? "🔖" : "📌"}
        </button>
        <button className="btn-ghost" style={{ padding: "10px 14px", fontSize: 13, borderColor: inCompare ? "var(--accent1)" : "" }}
          onClick={onCompareToggle} title="Compare">⚖️</button>
      </div>
    </div>
  );
};

// ─── CAREER DETAIL PAGE ───────────────────────────────────────────────────────
const CareerDetailPage = ({ career: c, userSkills, onBack, saved, onSave, notify }) => {
  const [activeTab, setTab] = useState("overview");
  const ownedSkills = c.skills.filter(s => userSkills.includes(s));
  const gapSkills = c.skills.filter(s => !userSkills.includes(s));

  const downloadPDF = () => {
    notify("PDF download started! 📄", "✅");
    const content = `
RKS CODE - Career Roadmap
========================
Career: ${c.name}
${c.desc}

Salary Range: ${c.salary}
Degree Required: ${c.degree}
AI Match Score: ${c.match}%

Required Skills:
${c.skills.map(s => `• ${s}`).join('\n')}

Learning Roadmap:
${c.roadmap.map((r, i) => `${i + 1}. ${r}`).join('\n')}

Skill Gap Analysis:
You have: ${ownedSkills.join(', ') || 'None yet'}
You need: ${gapSkills.join(', ') || 'None - Full match!'}

Generated by RKS CODE AI Career System
    `;
    const blob = new Blob([content], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${c.name.replace(/\s+/g, "-")}-Roadmap.txt`;
    a.click();
  };

  return (
    <div className="page" style={{ paddingTop: "var(--nav-height)", maxWidth: 900, margin: "0 auto", padding: "60px var(--container-pad)" }}>
      {/* Back */}
      <button className="btn-ghost" style={{ marginBottom: 24, fontSize: 14 }} onClick={onBack}>← Back to Results</button>

      {/* Hero */}
      <div className="glass fade-up" style={{ padding: "clamp(24px, 5vw, 36px)", marginBottom: 24, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at top right,rgba(59,130,246,0.1),transparent 60%)" }} />
        <div style={{ position: "relative" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 24 }}>
            <div style={{ flex: "1 1 300px" }}>
              <div style={{ fontSize: "clamp(40px, 8vw, 56px)", marginBottom: 12 }}>{c.icon}</div>
              <h1 style={{ fontSize: "clamp(24px, 6vw, 36px)", fontWeight: 900, marginBottom: 8 }}>{c.name}</h1>
              <p style={{ color: "var(--text2)", fontSize: 16, maxWidth: 500, lineHeight: 1.6 }}>{c.desc}</p>
              <div style={{ display: "flex", gap: 12, marginTop: 16, flexWrap: "wrap" }}>
                <span className="salary-badge">💰 {c.salary}</span>
                <span style={{ background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.25)", color: "#a78bfa", padding: "6px 14px", borderRadius: 20, fontSize: 13, fontWeight: 700 }}>
                  🎓 {c.degree}
                </span>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, flexShrink: 0, width: "100%", maxWidth: "120px", margin: "0 auto" }}>
              <MatchRing pct={c.match} size={100} />
              <div style={{ display: "flex", gap: 8, width: "100%", justifyContent: "center" }}>
                <button className="btn-ghost" style={{ padding: "8px 14px", fontSize: 13, flex: 1 }} onClick={onSave}>
                  {saved ? "🔖 Saved" : "📌 Save"}
                </button>
                <button className="btn-ghost" style={{ padding: "8px 14px", fontSize: 13, flex: 1 }} onClick={downloadPDF}>
                  📄 PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="glass" style={{ padding:"8px",marginBottom:20,display:"flex",gap:4,flexWrap:"wrap" }}>
        {["overview","skills","roadmap","videos"].map(t => (
          <button key={t} className={`tab ${activeTab===t?"active":""}`} style={{ flex:1,minWidth:80 }} onClick={() => setTab(t)}>
            {t === "overview" ? "📋 Overview" : t === "skills" ? "🎯 Skills" : t === "roadmap" ? "🗺️ Roadmap" : "📹 Videos"}
          </button>
        ))}
      </div>

      {/* Overview */}
      {activeTab === "overview" && (
        <div className="fade-up glass" style={{ padding: 28 }}>
          <h3 style={{ fontWeight: 800, fontSize: 20, marginBottom: 20 }}>Career Overview</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 180px), 1fr))", gap: 16, marginBottom: 24 }}>
            {[
              { l:"Salary Range", v:c.salary, icon:"💰" },
              { l:"AI Match Score", v:`${c.match}%`, icon:"🎯" },
              { l:"Skills Required", v:`${c.skills.length} skills`, icon:"⚡" },
              { l:"You Own", v:`${ownedSkills.length}/${c.skills.length}`, icon:"✅" },
            ].map((s,i) => (
              <div key={i} className="glass" style={{ padding:18,textAlign:"center" }}>
                <div style={{ fontSize:28,marginBottom:8 }}>{s.icon}</div>
                <div style={{ fontWeight:800,fontSize:18,fontFamily:"'JetBrains Mono',monospace",color:"var(--accent1)" }}>{s.v}</div>
                <div style={{ fontSize:12,color:"var(--text2)",marginTop:4 }}>{s.l}</div>
              </div>
            ))}
          </div>
          <div style={{ background:"var(--surface2)",borderRadius:12,padding:20 }}>
            <div style={{ fontWeight:700,marginBottom:12 }}>Career Highlights</div>
            <ul style={{ listStyle:"none",display:"flex",flexDirection:"column",gap:10 }}>
              {["Strong job market demand", "Good work-life balance options", "Multiple specialization paths", "Global opportunities available", "Remote/freelance possible"].map((h,i) => (
                <li key={i} style={{ display:"flex",alignItems:"center",gap:10,fontSize:14,color:"var(--text2)" }}>
                  <span style={{ color:"var(--accent4)",fontWeight:700 }}>✓</span> {h}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Skills */}
      {activeTab === "skills" && (
        <div className="fade-up glass" style={{ padding:28 }}>
          <h3 style={{ fontWeight:800,fontSize:20,marginBottom:20 }}>Skill Gap Analysis</h3>
          <div style={{ marginBottom:24 }}>
            <div style={{ display:"flex",justifyContent:"space-between",marginBottom:8 }}>
              <span style={{ fontWeight:600,fontSize:14 }}>Overall Skill Match</span>
              <span style={{ fontWeight:800,color:"var(--accent1)",fontFamily:"'JetBrains Mono',monospace" }}>
                {Math.round((ownedSkills.length/c.skills.length)*100)}%
              </span>
            </div>
            <div className="progress-bar" style={{ height:12,marginBottom:20 }}>
              <div className="progress-fill" style={{ width:`${(ownedSkills.length/c.skills.length)*100}%` }}/>
            </div>
          </div>
          {ownedSkills.length > 0 && (
            <div style={{ marginBottom:24 }}>
              <div style={{ fontWeight:700,marginBottom:12,color:"var(--accent4)",display:"flex",alignItems:"center",gap:8 }}>
                <span>✅ Skills You Have ({ownedSkills.length})</span>
              </div>
              <div style={{ display:"flex",flexWrap:"wrap",gap:8 }}>
                {ownedSkills.map(s => <span key={s} className="skill-tag owned">✓ {s}</span>)}
              </div>
            </div>
          )}
          {gapSkills.length > 0 && (
            <div>
              <div style={{ fontWeight:700,marginBottom:12,color:"var(--danger)",display:"flex",alignItems:"center",gap:8 }}>
                <span>📚 Skills to Learn ({gapSkills.length})</span>
              </div>
              <div style={{ display:"flex",flexWrap:"wrap",gap:8 }}>
                {gapSkills.map(s => <span key={s} className="skill-tag missing">+ {s}</span>)}
              </div>
            </div>
          )}
          {gapSkills.length === 0 && (
            <div style={{ textAlign:"center",padding:40 }}>
              <div style={{ fontSize:48,marginBottom:12 }}>🎉</div>
              <div style={{ fontWeight:800,fontSize:20,color:"var(--accent4)" }}>Perfect Skill Match!</div>
              <div style={{ color:"var(--text2)",marginTop:8 }}>You already have all required skills for this career.</div>
            </div>
          )}
        </div>
      )}

      {/* Roadmap */}
      {activeTab === "roadmap" && (
        <div className="fade-up glass" style={{ padding:28 }}>
          <h3 style={{ fontWeight:800,fontSize:20,marginBottom:24 }}>🗺️ Learning Roadmap</h3>
          <div style={{ display:"flex",flexDirection:"column" }}>
            {c.roadmap.map((step,i) => (
              <div key={i} className="roadmap-step">
                <div className="step-dot">{i+1}</div>
                <div className="glass" style={{ flex:1,padding:"14px 18px" }}>
                  <div style={{ fontWeight:600,fontSize:15 }}>{step}</div>
                  <div style={{ fontSize:12,color:"var(--text2)",marginTop:4 }}>
                    {i === 0 ? "Start here →" : i === c.roadmap.length-1 ? "🏁 Final goal" : `Phase ${i+1}`}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button className="btn-primary" style={{ width:"100%",marginTop:24,fontSize:15 }} onClick={downloadPDF}>
            📄 Download Full PDF Roadmap
          </button>
        </div>
      )}

      {/* Videos */}
      {activeTab === "videos" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {c.videos.map((v, i) => (
              <div key={i} className="video-card responsive-card" style={{ display: "flex", gap: 16, padding: 0, overflow: "hidden", flexWrap: "wrap" }}>
                <div style={{ position: "relative", flexShrink: 0, width: "100%", maxWidth: "min(100%, 200px)" }}>
                  <img src={v.thumb} alt={v.title} style={{ width: "100%", height: 110, objectFit: "cover" }}
                    onError={e => { e.target.style.background = "#1a1a35"; e.target.src = ""; }} />
                  <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(239,68,68,0.9)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>▶</div>
                  </div>
                </div>
                <div style={{ padding: "14px", flex: "1 1 200px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
                    <span className="level-badge" style={{ background: `${LEVEL_COLORS[v.level]}22`, color: LEVEL_COLORS[v.level] }}>{v.level}</span>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 8, lineHeight: 1.3 }}>{v.title}</div>
                  <a href={v.url} target="_blank" rel="noopener noreferrer"
                    style={{ color: "var(--accent1)", fontSize: 13, fontWeight: 600, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6 }}>
                    ▶ Watch on YouTube
                  </a>
                </div>
              </div>
            ))}
          </div>
      )}
    </div>
  );
};

// ─── COMPARISON PAGE ──────────────────────────────────────────────────────────
const ComparePage = ({ careers, onBack, userSkills }) => {
  if (careers.length < 2) return null;
  const [a, b] = careers;
  const fields = [
    { l:"Salary Range", ka: a.salary, kb: b.salary },
    { l:"AI Match", ka: `${a.match}%`, kb: `${b.match}%` },
    { l:"Degree", ka: a.degree, kb: b.degree },
    { l:"Skills Needed", ka: a.skills.length, kb: b.skills.length },
    { l:"Skills You Have", ka: a.skills.filter(s => userSkills.includes(s)).length, kb: b.skills.filter(s => userSkills.includes(s)).length },
  ];
  return (
    <div className="page" style={{ paddingTop: "var(--nav-height)", maxWidth: 900, margin: "0 auto", padding: "60px var(--container-pad)" }}>
      <button className="btn-ghost" style={{ marginBottom: 24, fontSize: 14 }} onClick={onBack}>← Back to Results</button>
      <h2 style={{ fontSize: "clamp(24px, 6vw, 32px)", fontWeight: 900, marginBottom: 8 }}>⚖️ Career Comparison</h2>
      <p style={{ color: "var(--text2)", marginBottom: 36 }}>Side-by-side analysis of your selected careers</p>

      {/* Header cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))", gap: 20, marginBottom: 24 }}>
        {[a, b].map(c => (
          <div key={c.id} className="glass" style={{ padding: 24, textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
            <div style={{ fontSize: "clamp(32px, 8vw, 48px)" }}>{c.icon}</div>
            <div style={{ fontWeight: 800, fontSize: 18 }}>{c.name}</div>
            <MatchRing pct={c.match} size={70} />
          </div>
        ))}
      </div>

      {/* Comparison rows */}
      <div className="glass" style={{ padding:28 }}>
        {fields.map((f,i) => (
          <div key={i} style={{ marginBottom:24 }}>
            <div style={{ fontSize:12,fontWeight:700,color:"var(--text2)",textTransform:"uppercase",letterSpacing:1,marginBottom:10 }}>{f.l}</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 200px), 1fr))", gap: 16 }}>
              {[f.ka, f.kb].map((val, j) => (
                <div key={j} style={{ background: "var(--surface2)", borderRadius: 10, padding: "12px 16px", fontWeight: 700, fontSize: 15, color: "var(--accent1)", fontFamily: "'JetBrains Mono',monospace", textAlign: "center" }}>
                  {val}
                </div>
              ))}
            </div>
            {typeof f.ka === "number" && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 200px), 1fr))", gap: 16, marginTop: 10 }}>
                {[f.ka, f.kb].map((val, j) => {
                  const max = Math.max(f.ka, f.kb) || 1;
                  return (
                    <div key={j} style={{ height: 10, background: "var(--border)", borderRadius: 5, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${(val / max) * 100}%`, background: "var(--grad)", borderRadius: 5, transition: "width 0.8s" }} />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Verdict */}
      <div className="glass" style={{ padding:24,marginTop:20,textAlign:"center" }}>
        <div style={{ fontWeight:800,fontSize:20,marginBottom:8 }}>🏆 AI Verdict</div>
        <p style={{ color:"var(--text2)",fontSize:15 }}>
          {a.match >= b.match
            ? `${a.name} is a stronger match for your profile with ${a.match}% compatibility. However, ${b.name} offers ${b.salary} which may align better with your salary goals.`
            : `${b.name} is a stronger match for your profile with ${b.match}% compatibility. Consider your long-term goals when making the final decision.`}
        </p>
      </div>
    </div>
  );
};

// ─── ABOUT PAGE ───────────────────────────────────────────────────────────────
const AboutPage = () => (
  <div className="page" style={{ paddingTop: "var(--nav-height)", maxWidth: 900, margin: "0 auto", padding: "60px var(--container-pad)" }}>
    <div className="fade-up" style={{ textAlign: "center", marginBottom: 60 }}>
      <RKSLogo size={80} />
      <h2 style={{ fontSize: "clamp(32px, 8vw, 40px)", fontWeight: 900, marginTop: 20, marginBottom: 12 }}>About RKS CODE</h2>
      <p style={{ color: "var(--text2)", fontSize: 17, maxWidth: 600, margin: "0 auto", lineHeight: 1.7 }}>
        RKS CODE is an AI-powered career guidance platform designed to help students from all academic backgrounds discover their ideal career paths.
      </p>
    </div>
    <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",gap:20,marginBottom:48 }}>
      {[
        { icon:"🎯", t:"Our Mission", d:"To democratize career guidance by making AI-powered recommendations accessible to every student in India, regardless of their background or stream." },
        { icon:"🤖", t:"AI Technology", d:"Our recommendation engine analyzes your skills, stream, interests, salary expectations, and career goals to find the most compatible career paths." },
        { icon:"📚", t:"Curated Resources", d:"We curate the best YouTube learning resources for each career, organized by difficulty level so you always know where to start." },
        { icon:"🌍", t:"For India", d:"Built specifically for the Indian education system — covering all streams from Science to Agriculture to Diploma/ITI." },
      ].map((c,i) => (
        <div key={i} className="glass card-hover" style={{ padding:28 }}>
          <div style={{ fontSize:36,marginBottom:12 }}>{c.icon}</div>
          <div style={{ fontWeight:800,fontSize:17,marginBottom:8 }}>{c.t}</div>
          <div style={{ color:"var(--text2)",fontSize:14,lineHeight:1.6 }}>{c.d}</div>
        </div>
      ))}
    </div>
  </div>
);

// ─── CONTACT PAGE ─────────────────────────────────────────────────────────────
const ContactPage = ({ notify }) => {
  const [form, setForm] = useState({ name:"", email:"", msg:"" });
  const handleSend = () => {
    if (!form.name || !form.email) { notify("Please fill all fields","⚠️"); return; }
    saveContactToStorage({ name: form.name, email: form.email, msg: form.msg });
    notify("Message sent! We'll get back to you soon.","✅");
    setForm({ name:"", email:"", msg:"" });
  };
  return (
  <div className="page" style={{ paddingTop: "var(--nav-height)", maxWidth: 700, margin: "0 auto", padding: "60px var(--container-pad)" }}>
    <div className="fade-up" style={{ textAlign: "center", marginBottom: 48 }}>
      <h2 style={{ fontSize: "clamp(32px, 8vw, 40px)", fontWeight: 900, marginBottom: 12 }}>Get in Touch</h2>
      <p style={{ color: "var(--text2)", fontSize: 16 }}>Questions, feedback, or partnerships — we'd love to hear from you.</p>
    </div>
    <div className="glass" style={{ padding: "clamp(24px, 5vw, 36px)" }}>
        {[
          { l:"Your Name", k:"name", p:"Enter your full name" },
          { l:"Email Address", k:"email", p:"your@email.com" },
        ].map(f => (
          <div key={f.k} style={{ marginBottom:20 }}>
            <label style={{ display:"block",marginBottom:8,fontWeight:600,fontSize:13,color:"var(--text2)" }}>{f.l}</label>
            <input className="search-input" style={{ paddingLeft:16,borderRadius:10 }}
              placeholder={f.p} value={form[f.k]} onChange={e => setForm(prev => ({ ...prev, [f.k]: e.target.value }))}/>
          </div>
        ))}
        <div style={{ marginBottom:24 }}>
          <label style={{ display:"block",marginBottom:8,fontWeight:600,fontSize:13,color:"var(--text2)" }}>MESSAGE</label>
          <textarea style={{ width:"100%",background:"var(--surface)",border:"1px solid var(--border)",borderRadius:10,padding:"12px 16px",color:"var(--text)",fontFamily:"'Sora',sans-serif",fontSize:14,minHeight:140,outline:"none",resize:"vertical",transition:"border-color 0.3s" }}
            placeholder="How can we help you?"
            value={form.msg} onChange={e => setForm(prev => ({ ...prev, msg: e.target.value }))}/>
        </div>
        <button className="btn-primary" style={{ width:"100%",fontSize:15,padding:"15px" }} onClick={handleSend}>
          📨 Send Message
        </button>
        <div style={{ display:"flex",justifyContent:"center",gap:24,marginTop:24,color:"var(--text2)",fontSize:13 }}>
          <span>📧 contact@rkscode.in</span>
          <span>🌐 rkscode.in</span>
        </div>
      </div>
    </div>
  );
};

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  // ── URL hash routing: visiting /#/admin opens admin panel ──
  const getInitialPage = () => {
    const hash = window.location.hash;
    if (hash === "#/admin" || hash === "#/admin/") return "admin";
    return "home";
  };

  const [page, setPage] = useState(getInitialPage);
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [stream, setStream] = useState(null);
  const [formData, setFormData] = useState(null);
  const [selectedCareer, setSelectedCareer] = useState(null);
  const [saved, setSaved] = useState([]);
  const [compareList, setCompareList] = useState([]);
  const [notification, setNotification] = useState(null);
  const notifTimer = useRef(null);

  // Listen for hash changes (e.g. user types /#/admin in URL bar)
  useEffect(() => {
    const onHash = () => {
      if (window.location.hash === "#/admin" || window.location.hash === "#/admin/") {
        setPage("admin");
      }
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = css;
    document.head.appendChild(style);
    saveVisitToStorage();
    return () => document.head.removeChild(style);
  }, []);

  useEffect(() => {
    document.body.className = darkMode ? "" : "light";
  }, [darkMode]);

  const notify = (msg, icon = "ℹ️") => {
    setNotification({ msg, icon });
    clearTimeout(notifTimer.current);
    notifTimer.current = setTimeout(() => setNotification(null), 3000);
  };

  const navigate = (p) => {
    if (p === "finder") { setPage("stream"); window.location.hash = ""; return; }
    if (p === "admin")  { window.location.hash = "#/admin"; setPage("admin"); return; }
    window.location.hash = "";
    setPage(p);
  };

  const handleStreamSelect = (s) => {
    setStream(s);
    setPage("skills");
  };

  const handleSkillsSubmit = (data) => {
    setFormData(data);
    // Save lead to admin panel storage
    saveLeadToStorage({
      name: data.name || "",
      email: data.email || "",
      stream: data.stream,
      skills: data.skills,
      edu: data.edu,
      interests: data.interests,
      salary: data.salary,
      workType: data.workType,
      goal: data.goal,
    });
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setPage("results");
    }, 2400);
  };

  const handleSaveToggle = (id) => {
    setSaved(prev => {
      if (prev.includes(id)) { notify("Removed from saved careers","🗑️"); return prev.filter(x => x !== id); }
      notify("Career saved! 🔖","✅");
      return [...prev, id];
    });
  };

  const handleCompareToggle = (id) => {
    setCompareList(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id);
      if (prev.length >= 2) return prev;
      return [...prev, id];
    });
  };

  const handleDetail = (career) => {
    setSelectedCareer(career);
    setPage("detail");
  };

  const handleCompare = () => {
    if (compareList.length < 2) { notify("Select 2 careers to compare","⚠️"); return; }
    setPage("compare");
  };

  const getCareersForCompare = () => {
    const all = Object.values(CAREERS_DB).flat();
    return compareList.map(id => all.find(c => c.id === id)).filter(Boolean);
  };

  const renderPage = () => {
    switch(page) {
      case "home": return <HomePage setPage={navigate}/>;
      case "stream": return <StreamPage onSelect={handleStreamSelect}/>;
      case "skills": return <SkillsPage stream={stream} onSubmit={handleSkillsSubmit}/>;
      case "results": return formData ? (
        <ResultsPage data={formData} saved={saved} toggleSave={handleSaveToggle}
          onDetail={handleDetail} onCompare={handleCompare}
          compareList={compareList}
          onCompareToggle={(id) => { handleCompareToggle(id); }}
          notify={notify}/>
      ) : null;
      case "detail": return selectedCareer ? (
        <CareerDetailPage career={selectedCareer} userSkills={formData?.skills || []}
          onBack={() => setPage("results")} saved={saved.includes(selectedCareer.id)}
          onSave={() => handleSaveToggle(selectedCareer.id)} notify={notify}/>
      ) : null;
      case "compare": return (
        <ComparePage careers={getCareersForCompare()} onBack={() => setPage("results")} userSkills={formData?.skills || []}/>
      );
      case "about": return <AboutPage/>;
      case "contact": return <ContactPage notify={notify}/>;
      case "saved": return formData ? (
        <ResultsPage data={formData} saved={saved} toggleSave={handleSaveToggle}
          onDetail={handleDetail} onCompare={handleCompare} compareList={compareList}
          onCompareToggle={handleCompareToggle} notify={notify}/>
      ) : <AboutPage/>;
      case "admin": return <AdminPage onBack={() => { window.location.hash = ""; setPage("home"); }}/>;
      default: return <HomePage setPage={navigate}/>;
    }
  };

  const isAdmin = page === "admin";

  return (
    <div style={{ minHeight:"100vh" }}>
      {loading && <Loader/>}
      {notification && (
        <Notification msg={notification.msg} icon={notification.icon} onClose={() => setNotification(null)}/>
      )}
      {!isAdmin && (
        <Navbar page={page} setPage={navigate} darkMode={darkMode} toggleDark={() => setDarkMode(d => !d)} savedCount={saved.length}/>
      )}
      {renderPage()}
      {/* Footer — no admin link, no admin reference */}
      {!isAdmin && (
        <footer style={{ borderTop:"1px solid var(--border)",padding:"32px 24px",textAlign:"center",color:"var(--text2)",fontSize:13 }}>
          <div style={{ display:"flex",alignItems:"center",justifyContent:"center",gap:10,marginBottom:10 }}>
            <RKSLogo size={24}/>
            <span style={{ fontWeight:700,background:"var(--grad)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent" }}>RKS CODE</span>
          </div>
          <div>AI-Powered Career Guidance Platform • Built for Indian Students</div>
          <div style={{ marginTop:6 }}>© 2024 RKS CODE. All rights reserved.</div>
          <div style={{ display:"flex",justifyContent:"center",gap:24,marginTop:14,flexWrap:"wrap" }}>
            {["home","about","contact"].map(p => (
              <button key={p} onClick={() => navigate(p)} style={{ background:"none",border:"none",color:"var(--text2)",cursor:"pointer",fontSize:13,fontFamily:"'Sora',sans-serif",textTransform:"capitalize",transition:"color 0.2s" }}
                onMouseOver={e=>e.target.style.color="var(--accent1)"} onMouseOut={e=>e.target.style.color="var(--text2)"}>
                {p}
              </button>
            ))}
          </div>
        </footer>
      )}
    </div>
  );
}
