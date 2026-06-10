import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { jsx as _jsx, jsxs as _jsxs } from 'react/jsx-runtime';

// Initialize localStorage schema if not present
const initLocalStorage = () => {
  if (typeof window === 'undefined') return;

  if (!localStorage.getItem('vins-tasks-sp')) {
    localStorage.setItem('vins-tasks-sp', '340');
  }
  if (!localStorage.getItem('vins-tasks-standup-submitted')) {
    localStorage.setItem('vins-tasks-standup-submitted', 'false');
  }
  if (!localStorage.getItem('vins-tasks-standup-data')) {
    localStorage.setItem('vins-tasks-standup-data', JSON.stringify({ yesterday: '', today: '', blockers: '' }));
  }
  if (!localStorage.getItem('vins-tasks-attendance')) {
    // 15 days pre-populated (12 present, 3 absent)
    const initialAttendance = [
      { date: '2026-05-23', status: 'present' },
      { date: '2026-05-24', status: 'present' },
      { date: '2026-05-25', status: 'present' },
      { date: '2026-05-26', status: 'present' },
      { date: '2026-05-27', status: 'absent' },
      { date: '2026-05-28', status: 'present' },
      { date: '2026-05-29', status: 'present' },
      { date: '2026-05-30', status: 'absent' },
      { date: '2026-05-31', status: 'present' },
      { date: '2026-06-01', status: 'absent' },
      { date: '2026-06-02', status: 'present' },
      { date: '2026-06-03', status: 'present' },
      { date: '2026-06-04', status: 'present' },
      { date: '2026-06-05', status: 'present' },
      { date: '2026-06-06', status: 'present' },
    ];
    localStorage.setItem('vins-tasks-attendance', JSON.stringify(initialAttendance));
  }
  if (!localStorage.getItem('vins-tasks-notes')) {
    const initialNotes = [
      {
        id: 'note-1',
        title: 'NOC Process Steps',
        tag: 'NOC',
        pinned: true,
        content: "1. Download NOC template from dashboard\n2. Get signed by HOD or Dean\n3. Upload via Upload NOC button\n4. Wait for offer letter automatically",
        lastEdited: new Date('2026-06-05T10:00:00Z').toISOString(),
      },
      {
        id: 'note-2',
        title: 'ViBe Tips',
        tag: 'ViBe',
        pinned: false,
        content: "- Face must be visible at all times\n- Do not read quiz questions aloud\n- Linear progression — cannot skip\n- Progress is server-side, safe to clear cache",
        lastEdited: new Date('2026-06-06T14:30:00Z').toISOString(),
      },
      {
        id: 'note-3',
        title: 'Phase 2 Project Ideas',
        tag: 'Project',
        pinned: false,
        content: "- Contribute to Annam.AI crop detection module\n- Fix open issues on ViBe GitHub\n- Add multilingual support to chatbot",
        lastEdited: new Date('2026-06-07T09:15:00Z').toISOString(),
      },
    ];
    localStorage.setItem('vins-tasks-notes', JSON.stringify(initialNotes));
  }
  if (!localStorage.getItem('vins-tasks-badges')) {
    const initialBadges = [
      { id: 'streak-starter', name: 'Streak Starter', icon: '🔥', requirement: '3 day standup streak', status: 'earned', date: '02 Jun 2026' },
      { id: 'quiz-beginner', name: 'Quiz Beginner', icon: '📚', requirement: 'Complete Easy quiz', status: 'earned', date: '03 Jun 2026' },
      { id: 'quiz-expert', name: 'Quiz Expert', icon: '🧠', requirement: 'Complete Hard quiz', status: 'locked' },
      { id: 'helpful-peer', name: 'Helpful Peer', icon: '🤝', requirement: '5 helpful answers in community', status: 'locked' },
      { id: 'rosetta-writer', name: 'Rosetta Writer', icon: '✍️', requirement: '7 journal entries', status: 'locked' },
      { id: 'quiz-master', name: 'Quiz Master', icon: '🏆', requirement: 'Perfect score on Hard quiz', status: 'locked' },
      { id: 'silver-star', name: 'Silver Star', icon: '🥈', requirement: 'Complete Silver phase', status: 'locked' },
      { id: 'top-contributor', name: 'Top Contributor', icon: '⭐', requirement: 'Rank #1 in community', status: 'locked' },
    ];
    localStorage.setItem('vins-tasks-badges', JSON.stringify(initialBadges));
  }
  if (!localStorage.getItem('vins-tasks-activities')) {
    const initialActivities = [
      { id: 'act-1', icon: '📚', text: 'Completed Easy Quiz Level', sp: '+10 SP', timeAgo: '4 days ago' },
      { id: 'act-2', icon: '🔥', text: 'Unlocked Streak Starter Badge', sp: '0 SP', timeAgo: '5 days ago' },
      { id: 'act-3', icon: '💬', text: 'Community Answer marked helpful', sp: '+3 SP', timeAgo: '5 days ago' },
      { id: 'act-4', icon: '✍️', text: 'Submitted standup log', sp: '+5 SP', timeAgo: '6 days ago' },
      { id: 'act-5', icon: '❓', text: 'Posted question in NOC category', sp: '+2 SP', timeAgo: '6 days ago' },
    ];
    localStorage.setItem('vins-tasks-activities', JSON.stringify(initialActivities));
  }
  if (!localStorage.getItem('vins-tasks-quiz-level')) {
    localStorage.setItem('vins-tasks-quiz-level', 'Easy');
  }
};

const quizQuestions = {
  Easy: [
    {
      id: 1,
      q: "What does VINS stand for?",
      options: ["Vicharanashala Internship", "Virtual Internship Network System", "Vibe Internship Node System", "None of these"],
      answer: "A",
      explanation: "VINS stands for Vicharanashala Internship."
    },
    {
      id: 2,
      q: "What colour is the result panel if you are selected for VINS?",
      options: ["Green", "Red", "Yellow", "Blue"],
      answer: "C",
      explanation: "The selected result panel on the Samagama dashboard is yellow."
    },
    {
      id: 3,
      q: "How long is the VINS internship?",
      options: ["1 month", "3 months", "2 months", "6 months"],
      answer: "C",
      explanation: "The standard duration of the VINS internship is 2 months."
    },
    {
      id: 4,
      q: "Is there a stipend for VINS?",
      options: ["Yes always", "No, never", "Only for toppers", "Depends on college"],
      answer: "B",
      explanation: "VINS is completely unpaid; however, stellar performers may be considered for a stipend at the end."
    },
    {
      id: 5,
      q: "What is ViBe?",
      options: ["A mobile app", "The LMS for Phase 1 coursework", "A GitHub repo", "A Zoom meeting tool"],
      answer: "B",
      explanation: "ViBe is the custom Learning Management System for Phase 1 coursework."
    }
  ],
  Medium: [
    {
      id: 6,
      q: "What must you upload before getting the offer letter?",
      options: ["Resume", "Aadhaar card", "Signed NOC", "Photo ID"],
      answer: "C",
      explanation: "A signed NOC from your college HOD/Dean is required before receiving the offer letter."
    },
    {
      id: 7,
      q: "Which phase involves real open-source contribution?",
      options: ["Bronze", "Silver", "Gold", "Platinum"],
      answer: "B",
      explanation: "Silver Phase is the core open-source contribution phase."
    },
    {
      id: 8,
      q: "What are Spurti Points used for?",
      options: ["Salary calculation", "Participation tracking only", "Certificate grading", "Team assignment"],
      answer: "B",
      explanation: "Spurti Points (SP) are purely for tracking candidate participation and activity."
    },
    {
      id: 9,
      q: "By what date must all VINS work be completed?",
      options: ["30 June 2026", "31 August 2026", "31 December 2026", "31 March 2027"],
      answer: "C",
      explanation: "All VINS internship work must be completed by 31 December 2026."
    },
    {
      id: 10,
      q: "Can candidates who have already graduated apply for VINS?",
      options: ["Yes", "No", "Only with NOC", "Only IIT students"],
      answer: "B",
      explanation: "No, you must be a currently enrolled student with college sign-off to apply."
    }
  ],
  Hard: [
    {
      id: 11,
      q: "What happens to your ViBe progress if you clear your browser cache?",
      options: ["Progress is lost", "Progress resets to 50%", "Progress is saved server-side, unaffected", "You get locked out"],
      answer: "C",
      explanation: "Progress is saved on the server-side database and remains unaffected."
    },
    {
      id: 12,
      q: "Who issues the VINS certificate?",
      options: ["IIT Ropar centrally", "VLED Lab (Vicharanashala Lab for Education Design)", "Prof. Sudarshan Iyengar personally", "AICTE"],
      answer: "B",
      explanation: "Certificates are issued by the Vicharanashala Lab for Education Design (VLED Lab) at IIT Ropar."
    },
    {
      id: 13,
      q: "What is the Platinum phase?",
      options: ["Final exam", "A visit invitation to IIT Ropar lab", "A paid project", "An online certification test"],
      answer: "B",
      explanation: "Platinum phase is a special invitation to visit the VLED Lab at IIT Ropar physically."
    },
    {
      id: 14,
      q: "What does linear progression on ViBe mean?",
      options: ["You can skip videos", "You must complete content in order", "Only live sessions count", "Progress is manual"],
      answer: "B",
      explanation: "Linear progression requires you to finish topics in strict chronological order."
    },
    {
      id: 15,
      q: "Can a team have all members from the same college?",
      options: ["Yes", "No", "Only 2 from same college", "Only if mentor approves"],
      answer: "B",
      explanation: "No, teams must consist of students from different colleges to encourage cross-learning."
    }
  ]
};

// Decompiler Helpers to resolve references
const A = React;
const r = { jsx: _jsx, jsxs: _jsxs, Fragment: React.Fragment };
const ki = useNavigate;
const sj = initLocalStorage;
const oc = quizQuestions;

function getSpLevel(sp) {
  if (sp <= 100) return { name: 'Beginner', badge: '🌱' };
  if (sp <= 300) return { name: 'Explorer', badge: '🧭' };
  if (sp <= 600) return { name: 'Contributor', badge: '🛠️' };
  return { name: 'Champion', badge: '🏆' };
}

const safeJsonParse = (key, fallback) => {
  if (typeof window === 'undefined') return fallback;
  try {
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : fallback;
  } catch (err) {
    console.warn(`Error parsing localStorage key "${key}":`, err);
    return fallback;
  }
};

function InternshipTasksPage(){var de;const t=ki();sj();const[e,n]=A.useState(()=>Number(localStorage.getItem("vins-tasks-sp")||340)),[i,s]=A.useState(()=>localStorage.getItem("vins-tasks-standup-submitted")==="true"),[a,o]=A.useState(()=>safeJsonParse("vins-tasks-standup-data",{"yesterday":"","today":"","blockers":""})),[l,c]=A.useState(()=>safeJsonParse("vins-tasks-attendance",[])),[d,f]=A.useState(()=>safeJsonParse("vins-tasks-notes",[])),[h,u]=A.useState(()=>safeJsonParse("vins-tasks-badges",[])),[x,b]=A.useState(()=>safeJsonParse("vins-tasks-activities",[])),[S,y]=A.useState(()=>localStorage.getItem("vins-tasks-quiz-level")||"Easy"),[p,m]=A.useState(null),g=F=>{m(F),setTimeout(()=>m(null),3e3)},v=(F,te)=>{const me=e+F;n(me),localStorage.setItem("vins-tasks-sp",String(me)),g(`${te}! +${F} SP earned 🎉`);const $=[{id:"act-"+Date.now(),icon:F>=20?"🏆":F>=10?"📚":"✍️",text:te,sp:`+${F} SP`,timeAgo:"Just now"},...x];b($),localStorage.setItem("vins-tasks-activities",JSON.stringify($))},[j,M]=A.useState("intro"),[C,_]=A.useState(0),[T,N]=A.useState(null),[I,H]=A.useState(30),[K,Z]=A.useState(!1),[L,q]=A.useState(0),[J,G]=A.useState(oc.Medium),ee=A.useMemo(()=>S==="Easy"?oc.Easy:S==="Medium"?J:oc.Hard,[S,J]);A.useEffect(()=>{if(j!=="active"||K)return;if(I<=0){N(null),Z(!0);return}const F=setInterval(()=>{H(te=>te-1)},1e3);return()=>clearInterval(F)},[I,j,K]);const ce=F=>{if(K)return;const te=["A","B","C","D"][F];N(te),Z(!0);const me=ee[C];te===me.answer&&q(k=>k+1)},Se=()=>{C<4?(_(F=>F+1),N(null),Z(!1),H(30)):M("level_complete")},B=()=>{const F=L;if(S==="Easy")F>=4?(y("Medium"),localStorage.setItem("vins-tasks-quiz-level","Medium"),v(10,"Completed Easy Quiz Level"),M("active"),_(0),N(null),Z(!1),H(30),q(0),g("Level Up! 🎉 Welcome to Medium Level.")):(M("active"),_(0),N(null),Z(!1),H(30),q(0),g("Keep practising! Starting Easy Level again."));else if(S==="Medium")if(F>=4)y("Hard"),localStorage.setItem("vins-tasks-quiz-level","Hard"),v(20,"Completed Medium Quiz Level"),M("active"),_(0),N(null),Z(!1),H(30),q(0),g("Level Up! 🎉 Welcome to Hard Level.");else if(F>=2){const te=[...oc.Medium].sort(()=>Math.random()-.5);G(te),M("active"),_(0),N(null),Z(!1),H(30),q(0),g("Keep practising! Shuffled questions loaded for Medium.")}else M("active"),_(0),N(null),Z(!1),H(30),q(0),g("Try again! Stand your ground.");else if(S==="Hard")if(F===5){v(30,"Completed Hard Quiz Level"),M("quiz_complete");const te=h.map(me=>me.id==="quiz-expert"?{...me,status:"earned",date:"Just now"}:me.id==="quiz-master"?{...me,status:"earned",date:"Just now"}:me);u(te),localStorage.setItem("vins-tasks-badges",JSON.stringify(te))}else M("active"),_(0),N(null),Z(!1),H(30),q(0),g("Retrying Hard level. Aim for a perfect 5/5!")},fe=()=>{M("active"),_(0),N(null),Z(!1),H(30),q(0)},[ge,Re]=A.useState({yesterday:"",today:"",blockers:""}),P=A.useMemo(()=>{const F=l.filter(Q=>Q.status==="present").length+(i?1:0),te=l.filter(Q=>Q.status==="absent").length,me=F+te,k=me===0?0:Math.round(F/me*100);return{presentCount:F,absentCount:te,percentage:k,currentStreak:i?6:5}},[l,i]),oe=F=>{if(F.preventDefault(),!ge.yesterday.trim()||!ge.today.trim())return;s(!0),o(ge),localStorage.setItem("vins-tasks-standup-submitted","true"),localStorage.setItem("vins-tasks-standup-data",JSON.stringify(ge));const te=[...l,{date:"2026-06-07",status:"present"}];c(te),localStorage.setItem("vins-tasks-attendance",JSON.stringify(te)),v(5,"Submitted standup log")},W=A.useMemo(()=>{const F=[];F.push({day:null,status:"empty"});for(let te=1;te<=30;te++){const me=`2026-06-${String(te).padStart(2,"0")}`;let k="none";if(te<7){const $=l.find(Q=>Q.date===me);k=$?$.status:"none"}else te===7&&(k=i?"present":"today");F.push({day:te,status:k,dateStr:me})}return F},[l,i]),[xe,Ae]=A.useState(((de=d[0])==null?void 0:de.id)||null),[ve,$e]=A.useState(""),[Ue,it]=A.useState("All"),[ct,_e]=A.useState(""),[rt,Je]=A.useState(""),[bt,U]=A.useState("ViBe"),[je,O]=A.useState("Saved ✓");A.useEffect(()=>{if(!xe){_e(""),Je(""),U("ViBe");return}const F=d.find(te=>te.id===xe);F&&(_e(F.title),Je(F.content),U(F.tag))},[xe]),A.useEffect(()=>{if(!xe)return;O("Typing...");const F=setTimeout(()=>{O("Saving..."),f(te=>{const me=te.map(k=>k.id===xe?{...k,title:ct,content:rt,tag:bt,lastEdited:new Date().toISOString()}:k);return localStorage.setItem("vins-tasks-notes",JSON.stringify(me)),me}),setTimeout(()=>O("Saved ✓"),400)},1500);return()=>clearTimeout(F)},[rt,ct,bt,xe]);const ye=(F,te="")=>{const me=document.getElementById("note-textarea");if(!me)return;const k=me.selectionStart,$=me.selectionEnd,Q=me.value,Me=Q.substring(k,$),Ne=F+Me+te,z=Q.substring(0,k)+Ne+Q.substring($);Je(z),setTimeout(()=>{me.focus(),me.setSelectionRange(k+F.length,k+F.length+Me.length)},0)},le=A.useMemo(()=>{const F=ve.toLowerCase().trim();return d.filter(te=>{const me=!F||te.title.toLowerCase().includes(F)||te.content.toLowerCase().includes(F),k=Ue==="All"||te.tag===Ue;return me&&k})},[d,ve,Ue]),Ie=A.useMemo(()=>[...le].sort((F,te)=>F.pinned&&!te.pinned?-1:!F.pinned&&te.pinned?1:new Date(te.lastEdited).getTime()-new Date(F.lastEdited).getTime()),[le]),D=()=>{const F={id:"note-"+Date.now(),title:"New Note",tag:"ViBe",pinned:!1,content:"",lastEdited:new Date().toISOString()},te=[F,...d];f(te),localStorage.setItem("vins-tasks-notes",JSON.stringify(te)),Ae(F.id)},w=(F,te)=>{te.stopPropagation();const me=d.map(k=>k.id===F?{...k,pinned:!k.pinned}:k);f(me),localStorage.setItem("vins-tasks-notes",JSON.stringify(me))},X=(F,te)=>{var k;if(te.stopPropagation(),!window.confirm("Are you sure you want to delete this note?"))return;const me=d.filter($=>$.id!==F);f(me),localStorage.setItem("vins-tasks-notes",JSON.stringify(me)),xe===F&&Ae(((k=me[0])==null?void 0:k.id)||null)},ue=()=>{window.confirm("Are you sure? This will delete all your saved notes.")&&(f([]),localStorage.setItem("vins-tasks-notes",JSON.stringify([])),Ae(null))},be=(F,te)=>{if(!te.trim())return F;const me=F.split(new RegExp(`(${te.replace(/[-\/\\^$*+?.()|[\]{}]/g,"\\$&")})`,"gi"));return r.jsx("span",{children:me.map((k,$)=>k.toLowerCase()===te.toLowerCase()?r.jsx("mark",{style:{background:"#7c6ff7",color:"#fff",borderRadius:2,padding:"0 2px"},children:k},$):k)})},Ce=A.useMemo(()=>{let F=0,te="Start Task";S==="Medium"?(te="Continue (Lvl 2)",F+=1):S==="Hard"?(te="Continue (Lvl 3)",F+=2):j==="quiz_complete"&&(te="Completed ✓",F+=3);const me=i?"Completed ✓":"Continue";i&&(F+=1);const k=(j!=="intro"?1:0)+(i?1:0)+(d.length>0?1:0)+1;return{completedCount:F,startedTasks:k,quizProgress:te,standupProgress:me}},[S,j,i,d]),we=F=>{const te=document.getElementById(F);te&&te.scrollIntoView({behavior:"smooth"})};return!ee||ee.length===0||!ee[C]?r.jsx("div",{style:{color:"white",padding:"2rem",background:"#0d0d14",minHeight:"100vh",display:"grid",placeItems:"center",fontSize:18},children:"Loading tasks..."}):r.jsxs("div",{style:aj,children:[r.jsx("style",{children:`
        @keyframes pulse-ring {
          0% { box-shadow: 0 0 0 0 rgba(124, 111, 247, 0.7); }
          70% { box-shadow: 0 0 0 10px rgba(124, 111, 247, 0); }
          100% { box-shadow: 0 0 0 0 rgba(124, 111, 247, 0); }
        }
        .pulsing-today {
          animation: pulse-ring 2s infinite;
          border: 2px solid #7c6ff7 !important;
          background: rgba(124, 111, 247, 0.15);
        }
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .toast-anim {
          animation: fade-in-up 0.35s ease forwards;
        }
        .option-btn {
          width: 100%;
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(255, 255, 255, 0.03);
          color: #cbd5e1;
          padding: 14px 16px;
          border-radius: 12px;
          font-weight: 700;
          text-align: left;
          cursor: pointer;
          font-size: 13.5px;
          transition: all 0.2s ease;
        }
        .option-btn:hover:not(:disabled) {
          border-color: rgba(124, 111, 247, 0.4);
          background: rgba(124, 111, 247, 0.06);
          color: #fff;
        }
        .option-btn.correct {
          background: rgba(34, 197, 94, 0.15) !important;
          border-color: #22c55e !important;
          color: #86efac !important;
        }
        .option-btn.wrong {
          background: rgba(239, 68, 68, 0.15) !important;
          border-color: #ef4444 !important;
          color: #fca5a5 !important;
        }
        .calendar-cell {
          aspect-ratio: 1;
          display: grid;
          place-items: center;
          font-size: 12px;
          font-weight: 800;
          border-radius: 50%;
          border: 1px solid rgba(255, 255, 255, 0.03);
          position: relative;
        }
        .calendar-cell.present {
          border-color: rgba(34, 197, 94, 0.4);
          background: rgba(34, 197, 94, 0.12);
          color: #86efac;
        }
        .calendar-cell.absent {
          border-color: rgba(239, 68, 68, 0.4);
          background: rgba(239, 68, 68, 0.1);
          color: #fca5a5;
        }
        .calendar-cell.today {
          border-color: #7c6ff7;
          color: #c4b5fd;
        }
        .note-card {
          padding: 14px;
          border-radius: 14px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.06);
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .note-card:hover {
          background: rgba(255, 255, 255, 0.04);
          border-color: rgba(255, 255, 255, 0.1);
        }
        .note-card.active {
          background: rgba(124, 111, 247, 0.06);
          border-color: rgba(124, 111, 247, 0.25);
        }
      `}),r.jsxs("aside",{style:oj,children:[r.jsxs("div",{style:lj,children:[r.jsx("div",{style:cj,children:"⚡ Samagama"}),r.jsx("span",{style:dj,children:"VINS Student"})]}),r.jsxs("nav",{style:uj,children:[r.jsx("button",{type:"button",onClick:()=>t("/dashboard"),style:fj,children:"← Portal Dashboard"}),r.jsxs("div",{style:pj,children:[r.jsx("div",{style:hj,children:"ViBe Tasks"}),r.jsxs("div",{style:mj,children:[r.jsx("button",{onClick:()=>we("task-quiz"),style:lc,children:"🧭 Adaptive Quiz"}),r.jsx("button",{onClick:()=>we("task-attendance"),style:lc,children:"📅 Standup & Attendance"}),r.jsx("button",{onClick:()=>we("task-dashboard"),style:lc,children:"📊 Progress Dashboard"}),r.jsx("button",{onClick:()=>we("task-notes"),style:lc,children:"📶 Local Notes Tool"})]})]})]}),r.jsxs("div",{style:gj,children:[r.jsx("div",{style:{fontSize:11,color:"#94a3b8",textTransform:"uppercase",letterSpacing:"0.08em",fontWeight:800},children:"Streak Status"}),r.jsxs("div",{style:{fontSize:15,fontWeight:900,marginTop:4,color:"#fff"},children:["🔥 ",P.currentStreak," Day Streak"]}),r.jsx("div",{style:{fontSize:11.5,color:"#cbd5e1",marginTop:2},children:"Checked in: June 2 - 7"})]})]}),r.jsxs("main",{style:xj,children:[r.jsxs("header",{style:vj,children:[r.jsx("h1",{style:yj,children:"ViBe Internship Tasks"}),r.jsx("p",{style:bj,children:"Complete tasks to earn SP points and unlock badges"}),r.jsxs("div",{style:Sj,children:[r.jsxs("div",{style:{display:"flex",justifyContent:"space-between",fontSize:13,fontWeight:700,color:"#cbd5e1",marginBottom:6},children:[r.jsx("span",{children:"Overall Tasks Completion"}),r.jsxs("span",{children:[Ce.startedTasks," of 4 tasks active • ",e," SP earned"]})]}),r.jsx("div",{style:cc,children:r.jsx("div",{style:{...dc,width:`${Ce.startedTasks/4*100}%`}})})]})]}),r.jsxs("section",{style:_j,children:[r.jsxs("button",{type:"button",onClick:()=>we("task-quiz"),style:uc,children:[r.jsxs("div",{style:fc,children:[r.jsx("span",{style:pc,children:"Adaptive Quiz"}),r.jsx("span",{style:hc,children:j==="quiz_complete"?"✓ Completed":"Lvl "+(S==="Easy"?"1":S==="Medium"?"2":"3")})]}),r.jsx("div",{style:mc,children:"+60 SP Max"}),r.jsx("div",{style:gc,children:Ce.quizProgress})]}),r.jsxs("button",{type:"button",onClick:()=>we("task-attendance"),style:uc,children:[r.jsxs("div",{style:fc,children:[r.jsx("span",{style:pc,children:"Daily Standup"}),r.jsx("span",{style:hc,children:i?"✓ Checked in":"Pending"})]}),r.jsx("div",{style:mc,children:"+5 SP Daily"}),r.jsx("div",{style:gc,children:Ce.standupProgress})]}),r.jsxs("button",{type:"button",onClick:()=>we("task-dashboard"),style:uc,children:[r.jsxs("div",{style:fc,children:[r.jsx("span",{style:pc,children:"Stats Dashboard"}),r.jsx("span",{style:hc,children:"Active"})]}),r.jsx("div",{style:mc,children:"Earned SP & Badges"}),r.jsx("div",{style:gc,children:"View Stats"})]}),r.jsxs("button",{type:"button",onClick:()=>we("task-notes"),style:uc,children:[r.jsxs("div",{style:fc,children:[r.jsx("span",{style:pc,children:"Offline Notes"}),r.jsxs("span",{style:hc,children:[d.length," notes"]})]}),r.jsx("div",{style:mc,children:"Autosave & Local"}),r.jsx("div",{style:gc,children:"Open Notes"})]})]}),r.jsxs("section",{id:"task-quiz",style:xc,children:[r.jsxs("div",{style:vc,children:[r.jsxs("div",{children:[r.jsxs("span",{style:wj(S),children:[S," Level"]}),r.jsx("h2",{style:yc,children:"Adaptive Quiz Generator"})]}),r.jsx("span",{style:{fontSize:13,color:"#94a3b8"},children:"SP Reward: +10/+20/+30 SP per tier"})]}),j==="intro"&&r.jsxs("div",{style:{textAlign:"center",padding:"32px 0"},children:[r.jsx("div",{style:{fontSize:48,marginBottom:16},children:"🧭"}),r.jsx("h3",{style:{margin:0,fontSize:18,color:"#fff"},children:"Test Your Samagama VINS Knowledge"}),r.jsx("p",{style:{color:"#cbd5e1",fontSize:14,maxWidth:480,margin:"8px auto 20px",lineHeight:1.5},children:"An adaptive assessment system designed to verify your VINS internship onboarding details. Tier up difficulty levels (Easy → Medium → Hard) based on score performance!"}),r.jsx("button",{type:"button",onClick:fe,style:bc,children:"Start Adaptive Quiz"})]}),j==="active"&&r.jsxs("div",{children:[r.jsxs("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14},children:[r.jsxs("span",{style:{fontSize:13,fontWeight:700,color:"#cbd5e1"},children:["Question ",C+1," of 5"]}),r.jsxs("div",{style:{display:"flex",alignItems:"center",gap:10},children:[r.jsxs("span",{style:{fontSize:12,color:I<=10?"#ef4444":"#cbd5e1",fontWeight:800},children:["⏱ ",I,"s"]}),r.jsx("div",{style:{width:100,height:6,background:"rgba(255,255,255,0.06)",borderRadius:999},children:r.jsx("div",{style:{height:"100%",background:I<=10?"#ef4444":"#7c6ff7",width:`${I/30*100}%`,transition:"width 1s linear",borderRadius:999}})})]})]}),r.jsx("div",{style:cc,children:r.jsx("div",{style:{...dc,width:`${C/5*100}%`,background:"#c4b5fd"}})}),r.jsx("h3",{style:{fontSize:16,margin:"20px 0 16px",color:"#fff",lineHeight:1.5},children:ee[C].q}),r.jsx("div",{style:{display:"flex",flexDirection:"column",gap:10},children:ee[C].options.map((F,te)=>{const me=["A","B","C","D"][te],k=me===ee[C].answer,$=me===T;let Q="option-btn";return K&&(k?Q+=" correct":$&&(Q+=" wrong")),r.jsxs("button",{type:"button",className:Q,onClick:()=>ce(te),disabled:K,children:[r.jsxs("span",{style:{marginRight:10,color:"#a78bfa"},children:[me,")"]}),F]},te)})}),K&&r.jsxs("div",{style:Aj(T===ee[C].answer),children:[r.jsx("div",{style:{fontWeight:800,fontSize:14,marginBottom:4},children:T===ee[C].answer?"✓ Correct!":`✗ The correct answer is ${ee[C].answer}.`}),r.jsx("div",{style:{fontSize:13,lineHeight:1.5},children:ee[C].explanation}),r.jsx("button",{type:"button",onClick:Se,style:Rj,children:C<4?"Next Question →":"Finish Level"})]})]}),j==="level_complete"&&r.jsxs("div",{style:{textAlign:"center",padding:"16px 0"},children:[r.jsx("div",{style:{fontSize:40},children:L>=4?"🎉":"📚"}),r.jsxs("h3",{style:{margin:"12px 0 6px",fontSize:18,color:"#fff"},children:[S," Tier Completed!"]}),r.jsxs("p",{style:{margin:0,fontSize:22,fontWeight:900,color:"#a78bfa"},children:["Score: ",L," / 5 Correct"]}),r.jsx("div",{style:{maxWidth:420,margin:"14px auto 20px",color:"#cbd5e1",fontSize:13.5,lineHeight:1.5},children:L>=4?r.jsxs(r.Fragment,{children:[r.jsx("strong",{children:"Awesome performance!"})," You qualify to proceed to the next difficulty level. Earning dynamic Spurti Points and level promotion badge updates!"]}):L>=2?r.jsxs(r.Fragment,{children:[r.jsx("strong",{children:"Keep practising!"})," You scored ",L,"/5. Retrying this level will load shuffled questions so you can test your knowledge."]}):r.jsxs(r.Fragment,{children:[r.jsx("strong",{children:"Review the basics first."})," It looks like you're missing some onboarding details. Take a quick look at the ",r.jsx("a",{href:"/faq",style:{color:"#c4b5fd",fontWeight:800},children:"VINS FAQs"})," to get updated."]})}),r.jsxs("div",{style:{display:"flex",gap:12,justifyContent:"center"},children:[r.jsx("button",{type:"button",onClick:B,style:bc,children:L>=4?"Advance / Level Up":"Try Again"}),r.jsx("button",{type:"button",onClick:()=>M("intro"),style:Cj,children:"Back to Intro"})]})]}),j==="quiz_complete"&&r.jsxs("div",{style:{textAlign:"center",padding:"32px 0"},children:[r.jsx("div",{style:{fontSize:52,marginBottom:12},children:"🏆"}),r.jsx("h3",{style:{margin:"0 0 6px",fontSize:20,color:"#ffd700"},children:"Quiz Master Accomplished!"}),r.jsx("p",{style:{color:"#86efac",fontWeight:800,fontSize:14,margin:"0 0 14px"},children:"Perfect Score on Hard Level! +30 SP Earned!"}),r.jsx("p",{style:{color:"#cbd5e1",fontSize:13.5,maxWidth:460,margin:"0 auto 20px",lineHeight:1.5},children:"Congratulations, you have mastered all onboarding and platform guidelines. The **Quiz Master 🏆** and **Quiz Expert 🧠** badges are now unlocked on your profile!"}),r.jsx("button",{type:"button",onClick:()=>{y("Easy"),M("intro")},style:bc,children:"Reset Quiz Tiers"})]})]}),r.jsxs("section",{id:"task-attendance",style:xc,children:[r.jsxs("div",{style:vc,children:[r.jsxs("div",{children:[r.jsxs("span",{style:Mj,children:["🔥 ",P.currentStreak," Day Streak"]}),r.jsx("h2",{style:yc,children:"Attendance Tracker & Daily Check-In"})]}),r.jsx("span",{style:{fontSize:13,color:"#94a3b8"},children:"SP Reward: +5 SP Daily"})]}),r.jsxs("div",{style:kj,children:[r.jsxs("div",{style:Pj,children:[r.jsxs("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12},children:[r.jsx("strong",{style:{fontSize:14,color:"#e2e8f0"},children:"June 2026"}),r.jsxs("span",{style:{fontSize:12,color:"#94a3b8"},children:["Present: ",P.presentCount,"d | Absent: ",P.absentCount,"d"]})]}),r.jsxs("div",{style:jj,children:[["Su","Mo","Tu","We","Th","Fr","Sa"].map(F=>r.jsx("div",{style:{textAlign:"center",fontSize:11,fontWeight:800,color:"#64748b",paddingBottom:6},children:F},F)),W.map((F,te)=>{if(F.status==="empty")return r.jsx("div",{},te);let me="calendar-cell";return F.status==="present"&&(me+=" present"),F.status==="absent"&&(me+=" absent"),F.status==="today"&&(me+=" pulsing-today"),r.jsxs("div",{className:me,children:[F.day,F.status==="today"&&r.jsx("span",{style:{position:"absolute",bottom:2,width:4,height:4,borderRadius:"50%",background:"#7c6ff7"}})]},te)})]}),r.jsxs("div",{style:Dj,children:[r.jsxs("div",{style:Sc,children:[r.jsx("span",{style:_c,children:"Total Present"}),r.jsx("strong",{style:wc,children:P.presentCount})]}),r.jsxs("div",{style:Sc,children:[r.jsx("span",{style:_c,children:"Total Absent"}),r.jsx("strong",{style:wc,children:P.absentCount})]}),r.jsxs("div",{style:Sc,children:[r.jsx("span",{style:_c,children:"Attendance %"}),r.jsxs("strong",{style:{...wc,color:P.percentage>=85?"#22c55e":"#f59e0b"},children:[P.percentage,"%"]})]}),r.jsxs("div",{style:Sc,children:[r.jsx("span",{style:_c,children:"Streak"}),r.jsxs("strong",{style:wc,children:["🔥 ",P.currentStreak,"d"]})]})]})]}),r.jsx("div",{style:Ij,children:i?r.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:14},children:[r.jsxs("div",{style:{display:"flex",alignItems:"center",gap:8,color:"#22c55e"},children:[r.jsx("span",{style:{fontSize:18},children:"✓"}),r.jsx("strong",{style:{fontSize:15},children:"Checked in for today (June 7)"})]}),r.jsxs("div",{style:Uf,children:[r.jsx("strong",{style:Ff,children:"Yesterday's progress:"}),r.jsx("div",{style:Of,children:a.yesterday})]}),r.jsxs("div",{style:Uf,children:[r.jsx("strong",{style:Ff,children:"Today's plan:"}),r.jsx("div",{style:Of,children:a.today})]}),a.blockers&&r.jsxs("div",{style:Uf,children:[r.jsx("strong",{style:Ff,children:"Blockers:"}),r.jsx("div",{style:Of,children:a.blockers})]}),r.jsx("div",{style:{padding:"8px 12px",background:"rgba(124, 111, 247, 0.1)",border:"1px solid rgba(124, 111, 247, 0.2)",borderRadius:10,fontSize:12,color:"#c4b5fd",textAlign:"center"},children:"You have successfully submitted your daily standup and marked attendance."})]}):r.jsxs("form",{onSubmit:oe,style:{display:"flex",flexDirection:"column",gap:12},children:[r.jsx("h3",{style:{margin:0,fontSize:15,fontWeight:800,color:"#fff"},children:"Submit Daily Standup"}),r.jsx("p",{style:{margin:"0 0 6px",fontSize:12.5,color:"#cbd5e1"},children:"Tell us what you're working on to mark today's attendance and earn Spurti Points!"}),r.jsxs("div",{style:If,children:[r.jsx("span",{style:Nf,children:"What did you work on yesterday? *"}),r.jsx("textarea",{required:!0,value:ge.yesterday,onChange:F=>Re(te=>({...te,yesterday:F.target.value})),placeholder:"e.g., Completed Bronze modules 2 & 3, solved Easy quiz",style:Lf})]}),r.jsxs("div",{style:If,children:[r.jsx("span",{style:Nf,children:"What will you work on today? *"}),r.jsx("textarea",{required:!0,value:ge.today,onChange:F=>Re(te=>({...te,today:F.target.value})),placeholder:"e.g., Start Silver task setup, research team members",style:Lf})]}),r.jsxs("div",{style:If,children:[r.jsx("span",{style:Nf,children:"Any blockers? (Optional)"}),r.jsx("textarea",{value:ge.blockers,onChange:F=>Re(te=>({...te,blockers:F.target.value})),placeholder:"e.g., Waiting on NOC signature verification from admin",style:Lf})]}),r.jsx("button",{type:"submit",style:bc,children:"Submit Standup +5 SP"})]})})]})]}),r.jsxs("section",{id:"task-dashboard",style:xc,children:[r.jsxs("div",{style:vc,children:[r.jsxs("div",{children:[r.jsx("span",{style:Tj,children:"📊 Stats Active"}),r.jsx("h2",{style:yc,children:"Progress Dashboard"})]}),r.jsx("span",{style:{fontSize:13,color:"#94a3b8"},children:"Real-time internship milestones tracker"})]}),r.jsxs("div",{style:Nj,children:[r.jsxs("div",{style:Mc(!0),children:[r.jsxs("div",{style:Tc,children:[r.jsx("span",{style:Ec,children:"🥉 Bronze"}),r.jsx("span",{style:Cc("graded"),children:"100% Done"})]}),r.jsx("p",{style:Ac,children:"Onboarding, profile verification, and linear coursework training on ViBe LMS."})]}),r.jsxs("div",{style:Mc(!0),children:[r.jsxs("div",{style:Tc,children:[r.jsx("span",{style:Ec,children:"🥈 Silver"}),r.jsx("span",{style:Cc("active"),children:"65% Active"})]}),r.jsx("div",{style:{...cc,margin:"8px 0"},children:r.jsx("div",{style:{...dc,width:"65%",background:"#7c6ff7"}})}),r.jsx("p",{style:Ac,children:"Project selection and live contributions to open source repos under mentors."})]}),r.jsxs("div",{style:Mc(!1),children:[r.jsxs("div",{style:Tc,children:[r.jsx("span",{style:Ec,children:"🥇 Gold"}),r.jsx("span",{style:Cc("locked"),children:"🔒 Locked"})]}),r.jsx("p",{style:Ac,children:"Stellar reviews, high-impact contributions, and leadership acknowledgements."})]}),r.jsxs("div",{style:Mc(!1),children:[r.jsxs("div",{style:Tc,children:[r.jsx("span",{style:Ec,children:"🏆 Platinum"}),r.jsx("span",{style:Cc("locked"),children:"🔒 Locked"})]}),r.jsx("p",{style:Ac,children:"Physical visit invitation to Vicharanashala Lab, IIT Ropar with travel support."})]})]}),r.jsxs("div",{style:Lj,children:[r.jsxs("div",{style:Uj,children:[r.jsxs("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12},children:[r.jsx("strong",{style:{fontSize:14,color:"#fff"},children:"Spurti Points (SP)"}),r.jsx("span",{style:{fontSize:11,background:"#7c6ff7",padding:"3px 8px",borderRadius:6,fontWeight:700},children:getSpLevel(e).name})]}),r.jsxs("div",{style:{fontSize:36,fontWeight:900,color:"#ffd700",letterSpacing:"-0.04em",margin:"8px 0"},children:["⚡ ",e," ",r.jsx("span",{style:{fontSize:14,color:"#94a3b8",fontWeight:600},children:"SP"})]}),r.jsxs("div",{style:{margin:"14px 0"},children:[r.jsxs("div",{style:{display:"flex",justifyContent:"space-between",fontSize:11,color:"#94a3b8",marginBottom:4},children:[r.jsx("span",{children:"Next: Champion"}),r.jsxs("span",{children:[e," / 601 SP"]})]}),r.jsx("div",{style:cc,children:r.jsx("div",{style:{...dc,width:`${Math.min(100,(e-301)/300*100)}%`,background:"linear-gradient(90deg, #7c6ff7, #fbbf24)"}})})]}),r.jsxs("div",{style:{marginTop:16},children:[r.jsx("div",{style:{fontSize:12,fontWeight:800,textTransform:"uppercase",color:"#64748b",letterSpacing:"0.06em",marginBottom:10},children:"Recent SP Log"}),r.jsx("div",{style:{display:"flex",flexDirection:"column",gap:8},children:x.slice(0,8).map((F,te)=>r.jsxs("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 10px",background:"rgba(255,255,255,0.01)",border:"1px solid rgba(255,255,255,0.03)",borderRadius:8},children:[r.jsxs("span",{style:{fontSize:12.5,color:"#e2e8f0"},children:[r.jsx("span",{style:{marginRight:6},children:F.icon}),F.text]}),r.jsx("strong",{style:{fontSize:12,color:F.sp.startsWith("+")?"#22c55e":"#cbd5e1"},children:F.sp})]},te))})]})]}),r.jsxs("div",{style:Fj,children:[r.jsx("strong",{style:{fontSize:14,color:"#fff",display:"block",marginBottom:12},children:"Internship Badges"}),r.jsx("div",{style:Oj,children:h.map(F=>{const te=F.status==="earned";return r.jsxs("div",{style:Bj(te),children:[r.jsx("span",{style:{fontSize:24,filter:te?"none":"grayscale(100%)"},children:F.icon}),r.jsx("strong",{style:{fontSize:13,color:te?"#fff":"#64748b",marginTop:4},children:F.name}),r.jsx("span",{style:{fontSize:10,color:"#94a3b8",textAlign:"center",marginTop:2,lineHeight:1.3},children:F.requirement}),r.jsx("span",{style:{fontSize:9.5,color:te?"#86efac":"#475569",marginTop:6,fontWeight:700},children:te?`Earned ${F.date||"04 Jun"}`:"Locked"})]},F.id)})})]})]}),r.jsxs("div",{style:{marginTop:24,borderTop:"1px solid rgba(255,255,255,0.06)",paddingTop:18},children:[r.jsx("strong",{style:{fontSize:14,color:"#fff",display:"block",marginBottom:14},children:"Activity Log & History"}),r.jsx("div",{style:{display:"flex",flexDirection:"column",gap:14,paddingLeft:12,borderLeft:"2px solid rgba(124,111,247,0.2)"},children:x.slice(0,10).map((F,te)=>r.jsxs("div",{style:{position:"relative"},children:[r.jsx("span",{style:{position:"absolute",left:-20,top:2,width:14,height:14,borderRadius:"50%",background:"#0d0d1a",border:"2px solid #7c6ff7",display:"grid",placeItems:"center",fontSize:8}}),r.jsxs("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12},children:[r.jsxs("div",{children:[r.jsx("strong",{style:{fontSize:13.5,color:"#fff"},children:F.text}),r.jsx("div",{style:{fontSize:11,color:"#94a3b8",marginTop:2},children:F.timeAgo})]}),F.sp!=="0 SP"&&r.jsx("span",{style:{fontSize:11,color:"#fbbf24",fontWeight:800,background:"rgba(251,191,36,0.1)",border:"1px solid rgba(251,191,36,0.2)",padding:"2px 6px",borderRadius:6},children:F.sp})]})]},F.id))})]})]}),r.jsxs("section",{id:"task-notes",style:xc,children:[r.jsxs("div",{style:vc,children:[r.jsxs("div",{children:[r.jsx("span",{style:Ej,children:"📶 Offline-First Persistent Notes"}),r.jsx("h2",{style:yc,children:"Study Notes & Guidelines"})]}),r.jsx("button",{onClick:ue,style:Wj,children:"Clear All Notes"})]}),r.jsxs("div",{style:zj,children:[r.jsxs("div",{style:Hj,children:[r.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:10,marginBottom:12},children:[r.jsx("input",{type:"text",placeholder:"Search note titles & contents...",value:ve,onChange:F=>$e(F.target.value),style:Vj}),r.jsxs("div",{style:{display:"flex",justifyBetween:"space-between",gap:8},children:[r.jsxs("select",{value:Ue,onChange:F=>it(F.target.value),style:Gj,children:[r.jsx("option",{value:"All",children:"All Tags"}),r.jsx("option",{value:"ViBe",children:"ViBe"}),r.jsx("option",{value:"NOC",children:"NOC"}),r.jsx("option",{value:"Project",children:"Project"}),r.jsx("option",{value:"Meeting",children:"Meeting"}),r.jsx("option",{value:"Personal",children:"Personal"})]}),r.jsx("button",{type:"button",onClick:D,style:qj,children:"＋ New Note"})]})]}),r.jsx("div",{style:$j,children:Ie.length===0?r.jsx("div",{style:{padding:"20px 10px",textAlign:"center",fontSize:13,color:"#64748b"},children:"No notes match the filters."}):Ie.map(F=>{const te=F.content.slice(0,70)+(F.content.length>70?"...":""),me=F.id===xe;return r.jsxs("div",{className:`note-card ${me?"active":""}`,onClick:()=>Ae(F.id),children:[r.jsxs("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:6},children:[r.jsx("strong",{style:{fontSize:14,color:"#fff",wordBreak:"break-all"},children:be(F.title,ve)}),r.jsx("button",{type:"button",onClick:k=>w(F.id,k),style:Yj(F.pinned),title:F.pinned?"Unpin Note":"Pin Note",children:"📌"})]}),r.jsx("p",{style:{margin:"6px 0",fontSize:12.5,color:"#cbd5e1",lineHeight:1.4,wordBreak:"break-all"},children:be(te||"(Empty note)",ve)}),r.jsxs("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:8},children:[r.jsx("span",{style:Xj,children:F.tag}),r.jsx("span",{style:{fontSize:10,color:"#64748b"},children:new Date(F.lastEdited).toLocaleDateString("en-IN",{day:"numeric",month:"short"})})]})]},F.id)})})]}),r.jsx("div",{style:Kj,children:xe?r.jsxs("div",{style:{display:"flex",flexDirection:"column",height:"100%",gap:12},children:[r.jsxs("div",{style:{display:"flex",gap:10,alignItems:"center",flexWrap:"wrap"},children:[r.jsx("input",{type:"text",value:ct,onChange:F=>_e(F.target.value),placeholder:"Title",style:Jj}),r.jsxs("select",{value:bt,onChange:F=>U(F.target.value),style:Zj,children:[r.jsx("option",{value:"ViBe",children:"ViBe"}),r.jsx("option",{value:"NOC",children:"NOC"}),r.jsx("option",{value:"Project",children:"Project"}),r.jsx("option",{value:"Meeting",children:"Meeting"}),r.jsx("option",{value:"Personal",children:"Personal"})]}),r.jsx("button",{type:"button",onClick:F=>X(xe,F),style:Qj,children:"🗑 Delete"})]}),r.jsxs("div",{style:eD,children:[r.jsx("button",{type:"button",onClick:()=>ye("**","**"),style:Bf,title:"Bold",children:r.jsx("strong",{children:"B"})}),r.jsx("button",{type:"button",onClick:()=>ye("*","*"),style:Bf,title:"Italic",children:r.jsx("em",{children:"I"})}),r.jsx("button",{type:"button",onClick:()=>ye(`
- `),style:Bf,title:"Bullet List",children:"• List"}),r.jsx("div",{style:{flex:1}}),r.jsx("span",{style:{fontSize:11.5,color:"#94a3b8",fontWeight:600},children:je})]}),r.jsx("textarea",{id:"note-textarea",value:rt,onChange:F=>Je(F.target.value),placeholder:"Start typing your study notes here...",style:tD})]}):r.jsxs("div",{style:{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"100%",color:"#64748b",gap:10},children:[r.jsx("span",{style:{fontSize:40},children:"📝"}),r.jsx("span",{children:"Select a note or create a new one to begin."})]})})]})]})]}),p&&r.jsxs("div",{className:"toast-anim",style:nD,children:["✨ ",p]})]})}
const aj={display:"grid",gridTemplateColumns:"280px 1fr",minHeight:"100vh",background:"radial-gradient(ellipse at 15% 40%, #12082a 0%, #0d0d1a 45%, #07090f 100%)",color:"#eef0f6",fontFamily:"system-ui, -apple-system, sans-serif"},oj={borderRight:"1px solid rgba(255,255,255,0.06)",background:"rgba(12,14,24,0.95)",padding:"24px 20px",display:"flex",flexDirection:"column",gap:24,position:"sticky",top:0,height:"100vh",boxSizing:"border-box",zIndex:10},lj={display:"flex",flexDirection:"column",gap:4},cj={fontSize:20,fontWeight:900,color:"#fff",letterSpacing:"-0.02em"},dj={fontSize:10,color:"#a78bfa",textTransform:"uppercase",letterSpacing:"0.18em",fontWeight:800},uj={display:"flex",flexDirection:"column",gap:20,flex:1},fj={border:"1px solid rgba(255,255,255,0.08)",background:"rgba(255,255,255,0.03)",color:"#eef0f6",borderRadius:14,padding:"12px 14px",fontWeight:700,fontSize:13,cursor:"pointer",width:"100%",textAlign:"left"},pj={display:"flex",flexDirection:"column",gap:10},hj={fontSize:11,fontWeight:800,color:"#64748b",textTransform:"uppercase",letterSpacing:"0.08em"},mj={display:"flex",flexDirection:"column",gap:6},lc={background:"transparent",border:"none",color:"#cbd5e1",padding:"10px 12px",borderRadius:10,fontSize:13.5,fontWeight:700,cursor:"pointer",textAlign:"left",transition:"all 0.15s ease",display:"flex",alignItems:"center",gap:8,":hover":{background:"rgba(255,255,255,0.04)",color:"#fff"}},gj={padding:16,borderRadius:16,background:"rgba(124, 111, 247, 0.08)",border:"1px solid rgba(124, 111, 247, 0.15)"},xj={padding:"32px 40px 64px",maxWidth:1200,display:"flex",flexDirection:"column",gap:24,boxSizing:"border-box",overflowY:"auto",height:"100vh"},vj={display:"flex",flexDirection:"column",gap:6,marginBottom:8},yj={margin:0,fontSize:32,fontWeight:900,letterSpacing:"-0.04em",color:"#fff"},bj={margin:0,color:"#cbd5e1",fontSize:15},Sj={marginTop:14,background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:16,padding:14},cc={height:8,background:"rgba(255,255,255,0.06)",borderRadius:999,overflow:"hidden"},dc={height:"100%",background:"linear-gradient(90deg, #7c6ff7, #38bdf8)",borderRadius:999,transition:"width 0.4s ease"},_j={display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(200px, 1fr))",gap:16},uc={background:"linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))",border:"1px solid rgba(255,255,255,0.08)",borderRadius:20,padding:"16px 18px",cursor:"pointer",textAlign:"left",display:"flex",flexDirection:"column",gap:6,transition:"all 0.2s ease",outline:"none",":hover":{borderColor:"rgba(124, 111, 247, 0.3)",background:"rgba(124, 111, 247, 0.04)"}},fc={display:"flex",justifyContent:"space-between",alignItems:"center",width:"100%",gap:8},pc={fontSize:14.5,fontWeight:900,color:"#fff"},hc={fontSize:10,background:"rgba(124, 111, 247, 0.15)",color:"#c4b5fd",padding:"2px 6px",borderRadius:6,fontWeight:800},mc={fontSize:12.5,color:"#94a3b8"},gc={marginTop:6,fontSize:11,color:"#a78bfa",fontWeight:800,textTransform:"uppercase",letterSpacing:"0.04em"},xc={background:"linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))",border:"1px solid rgba(255,255,255,0.08)",borderRadius:24,padding:24,backdropFilter:"blur(16px)",boxShadow:"0 12px 32px rgba(0,0,0,0.28)"},vc={display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12,flexWrap:"wrap",marginBottom:20},yc={margin:"6px 0 0",fontSize:20,fontWeight:900,color:"#fff",letterSpacing:"-0.02em"},wj=t=>{const e=t==="Easy"?"#22c55e":t==="Medium"?"#f59e0b":"#ef4444";return{fontSize:10,background:e+"18",color:e,border:`1px solid ${e}28`,padding:"3px 8px",borderRadius:999,fontWeight:800,textTransform:"uppercase",letterSpacing:"0.06em"}},Mj={fontSize:10.5,background:"rgba(239, 68, 68, 0.12)",color:"#fca5a5",border:"1px solid rgba(239, 68, 68, 0.2)",padding:"4px 9px",borderRadius:999,fontWeight:800,textTransform:"uppercase",letterSpacing:"0.04em"},Tj={fontSize:10.5,background:"rgba(56, 189, 248, 0.12)",color:"#7dd3fc",border:"1px solid rgba(56, 189, 248, 0.2)",padding:"4px 9px",borderRadius:999,fontWeight:800,textTransform:"uppercase",letterSpacing:"0.04em"},Ej={fontSize:10.5,background:"rgba(16, 185, 129, 0.12)",color:"#6ee7b7",border:"1px solid rgba(16, 185, 129, 0.2)",padding:"4px 9px",borderRadius:999,fontWeight:800,textTransform:"uppercase",letterSpacing:"0.04em"},bc={border:"none",borderRadius:12,padding:"11px 18px",background:"linear-gradient(135deg, #7c6ff7, #38bdf8)",color:"#fff",fontWeight:800,cursor:"pointer",fontSize:13,boxShadow:"0 10px 20px rgba(124, 111, 247, 0.2)"},Cj={border:"1px solid rgba(255,255,255,0.08)",borderRadius:12,padding:"11px 18px",background:"rgba(255,255,255,0.03)",color:"#cbd5e1",fontWeight:700,cursor:"pointer",fontSize:13},Aj=t=>({marginTop:18,padding:16,borderRadius:16,background:t?"rgba(34, 197, 94, 0.08)":"rgba(239, 68, 68, 0.08)",border:`1px solid ${t?"rgba(34, 197, 94, 0.18)":"rgba(239, 68, 68, 0.18)"}`,display:"flex",flexDirection:"column",gap:8}),Rj={alignSelf:"flex-start",marginTop:8,border:"none",borderRadius:10,padding:"8px 14px",background:"#fff",color:"#0d0d1a",fontWeight:800,cursor:"pointer",fontSize:12},kj={display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(280px, 1fr))",gap:24,alignItems:"start"},Pj={background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.05)",borderRadius:20,padding:16},jj={display:"grid",gridTemplateColumns:"repeat(7, 1fr)",gap:8,marginBottom:16},Dj={display:"grid",gridTemplateColumns:"repeat(2, 1fr)",gap:10},Sc={background:"rgba(255,255,255,0.01)",border:"1px solid rgba(255,255,255,0.04)",borderRadius:12,padding:"10px 12px",display:"flex",flexDirection:"column",gap:4},_c={fontSize:11,color:"#94a3b8"},wc={fontSize:15,fontWeight:900,color:"#fff"},Ij={background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.05)",borderRadius:20,padding:18},If={display:"flex",flexDirection:"column",gap:6},Nf={fontSize:12.5,color:"#cbd5e1",fontWeight:700},Lf={background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:10,padding:10,color:"#fff",fontSize:13,outline:"none",resize:"none",height:60,fontFamily:"inherit"},Uf={display:"flex",flexDirection:"column",gap:4},Ff={fontSize:12.5,color:"#94a3b8"},Of={fontSize:13.5,color:"#fff",lineHeight:1.45,background:"rgba(255,255,255,0.01)",border:"1px solid rgba(255,255,255,0.03)",borderRadius:8,padding:8},Nj={display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(200px, 1fr))",gap:16,marginBottom:20},Mc=t=>({background:t?"rgba(255,255,255,0.03)":"rgba(255,255,255,0.01)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:18,padding:14,opacity:t?1:.45,display:"flex",flexDirection:"column",gap:8}),Tc={display:"flex",justifyContent:"space-between",alignItems:"center",width:"100%"},Ec={fontSize:13,fontWeight:900,color:"#fff"},Cc=t=>({fontSize:10.5,color:t==="graded"?"#22c55e":t==="active"?"#a78bfa":"#64748b",fontWeight:800}),Ac={margin:0,fontSize:11.5,color:"#94a3b8",lineHeight:1.4},Lj={display:"grid",gridTemplateColumns:"minmax(0, 1fr) minmax(0, 1.35fr)",gap:20,alignItems:"start"},Uj={background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.05)",borderRadius:20,padding:16},Fj={background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.05)",borderRadius:20,padding:16},Oj={display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(110px, 1fr))",gap:10},Bj=t=>({background:t?"rgba(124, 111, 247, 0.05)":"rgba(255,255,255,0.01)",border:`1px solid ${t?"rgba(124, 111, 247, 0.2)":"rgba(255,255,255,0.04)"}`,borderRadius:14,padding:"12px 10px",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",transition:"all 0.2s ease",opacity:t?1:.5}),zj={display:"grid",gridTemplateColumns:"320px 1fr",gap:18,alignItems:"stretch",minHeight:460},Wj={border:"1px solid rgba(239, 68, 68, 0.3)",borderRadius:10,padding:"6px 12px",background:"rgba(239, 68, 68, 0.06)",color:"#fca5a5",fontWeight:700,fontSize:12,cursor:"pointer"},Hj={background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.05)",borderRadius:20,padding:14,display:"flex",flexDirection:"column"},Vj={width:"100%",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:10,padding:"8px 12px",color:"#fff",fontSize:12.5,outline:"none",boxSizing:"border-box"},Gj={flex:1,background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:10,padding:"6px 10px",color:"#cbd5e1",fontSize:12,outline:"none"},qj={border:"none",borderRadius:10,padding:"6px 12px",background:"linear-gradient(135deg, #7c6ff7, #38bdf8)",color:"#fff",fontWeight:800,fontSize:12,cursor:"pointer"},$j={display:"flex",flexDirection:"column",gap:10,overflowY:"auto",maxHeight:380,paddingRight:4},Xj={fontSize:10,background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:6,padding:"2px 6px",color:"#c4b5fd",fontWeight:700},Yj=t=>({background:"transparent",border:"none",cursor:"pointer",padding:0,fontSize:12,opacity:t?1:.25,filter:t?"none":"grayscale(100%)"}),Kj={background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.05)",borderRadius:20,padding:16,display:"flex",flexDirection:"column"},Jj={flex:1,minWidth:150,background:"transparent",border:"none",borderBottom:"1px solid rgba(255,255,255,0.08)",color:"#fff",fontSize:16,fontWeight:900,padding:"6px 0",outline:"none"},Zj={background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:10,padding:"6px 10px",color:"#cbd5e1",fontSize:12,outline:"none"},Qj={border:"1px solid rgba(239, 68, 68, 0.25)",background:"rgba(239, 68, 68, 0.05)",color:"#fca5a5",borderRadius:10,padding:"6px 12px",fontSize:12,fontWeight:700,cursor:"pointer"},eD={display:"flex",alignItems:"center",gap:6,background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)",padding:"6px 10px",borderRadius:10},Bf={background:"transparent",border:"none",color:"#cbd5e1",width:28,height:28,borderRadius:6,cursor:"pointer",display:"grid",placeItems:"center",fontSize:13,":hover":{background:"rgba(255,255,255,0.05)",color:"#fff"}},tD={flex:1,width:"100%",minHeight:280,background:"transparent",border:"none",color:"#e2e8f0",fontSize:14.5,lineHeight:1.6,padding:"10px 0 0",outline:"none",resize:"none",fontFamily:"inherit"},nD={position:"fixed",bottom:24,right:24,background:"linear-gradient(135deg, #8b5cf6, #3b82f6)",color:"#fff",padding:"12px 20px",borderRadius:12,fontWeight:800,boxShadow:"0 12px 28px rgba(124, 111, 247, 0.4)",zIndex:1e3};
export default InternshipTasksPage;
