import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

const API = "/api";

function App() {
  const [token, setToken] = useState(localStorage.getItem("survey_token"));
  const [user, setUser] = useState(null);
  const [page, setPage] = useState("home");
  const [survey, setSurvey] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;
    fetch(`${API}/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(u => setUser(u))
      .catch(() => { localStorage.removeItem("survey_token"); setToken(null); });
  }, [token]);

  async function request(path, body) {
    const r = await fetch(`${API}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(body)
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data.message || "Something went wrong");
    return data;
  }

  async function auth(mode, values) {
    setError("");
    try {
      const data = await request(`/auth/${mode}`, values);
      localStorage.setItem("survey_token", data.token);
      setToken(data.token);
      setUser(data.user);
      setPage("home");
    } catch (e) { setError(e.message); }
  }

  async function openSurvey() {
    setError("");
    try {
      const r = await fetch(`${API}/survey`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await r.json();
      if (!r.ok) throw new Error(data.message);
      setSurvey(data);
      setAnswers(Array(data.questions.length).fill(null));
      setPage("survey");
    } catch (e) { setError(e.message); }
  }

  async function submitSurvey() {
    setError("");
    if (answers.some(a => a === null)) return setError("Please answer every question.");
    try {
      const data = await request("/survey/submit", { answers });
      setResult(data);
      setUser(u => ({ ...u, completed: true, score: data.score }));
      setPage("result");
    } catch (e) { setError(e.message); }
  }

  function logout() {
    localStorage.removeItem("survey_token");
    setToken(null); setUser(null); setPage("home");
  }

  if (!user) return <Auth onAuth={auth} error={error} />;

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand"><span className="brand-mark">B</span><span>Bolu Aderoju<span>Initiative</span></span></div>
        <button className="logout" onClick={logout}>Log out</button>
      </header>

      {page === "home" && <Dashboard user={user} openSurvey={openSurvey} error={error} />}
      {page === "survey" && <Survey survey={survey} answers={answers} setAnswers={setAnswers} onSubmit={submitSurvey} error={error} />}
      {page === "result" && <Result user={user} result={result} />}
    </div>
  );
}

function Auth({ onAuth, error }) {
  const [mode, setMode] = useState("login");
  const [values, setValues] = useState({ name: "", email: "", password: "" });
  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="auth-logo"><span className="brand-mark">N</span></div>
        <p className="eyebrow">RESEARCH PARTICIPANT PORTAL</p>
        <h1>{mode === "login" ? "Welcome back" : "Create your account"}</h1>
        <p className="muted">{mode === "login" ? "Sign in to continue your survey." : "Create an account to participate in the study."}</p>
        {error && <div className="error">{error}</div>}
        {mode === "register" && <input placeholder="Full name" value={values.name} onChange={e => setValues({...values, name:e.target.value})} />}
        <input type="email" placeholder="Email address" value={values.email} onChange={e => setValues({...values, email:e.target.value})} />
        <input type="password" placeholder="Password" value={values.password} onChange={e => setValues({...values, password:e.target.value})} />
        <button className="primary wide" onClick={() => onAuth(mode, values)}>{mode === "login" ? "Sign in" : "Create account"}</button>
        <button className="switch" onClick={() => { setMode(mode === "login" ? "register" : "login"); }}>{mode === "login" ? "Don't have an account? Create one" : "Already have an account? Sign in"}</button>
        <p className="legal">Your responses are used for research purposes. Do not enter sensitive information that the survey does not request.</p>
      </section>
    </main>
  );
}

function Dashboard({ user, openSurvey, error }) {
  const completed = user.completed;
  return (
    <main className="dashboard">
      <section className="hero">
        <div>
          <p className="eyebrow">GOOD DAY</p>
          <h1>{user.name.split(" ")[0]} 👋</h1>
          <p className="muted">Your research participant account</p>
        </div>
        <div className="avatar">{user.name.charAt(0).toUpperCase()}</div>
      </section>

      <section className="balance-card">
        <div className="balance-top"><span>RESEARCH REWARD</span><span className="status-dot">●</span></div>
        <div className="balance">₦{completed ? "200,000" : "0"}</div>
        <p>{completed ? "Reward unlocked after survey completion" : "Complete the survey to unlock the reward"}</p>
      </section>

      <section className="quick-actions">
        <button onClick={openSurvey} disabled={completed}><span>✓</span><b>{completed ? "Completed" : "Start survey"}</b><small>{completed ? "Survey submitted" : "20 questions · ~5 min"}</small></button>
        <div className="info-action"><span>▣</span><b>Research study</b><small>Nigerian history</small></div>
      </section>

      {error && <div className="error">{error}</div>}

      <section className="card">
        <div className="card-title"><h2>Account overview</h2><span>›</span></div>
        <div className="row"><span>Participant</span><b>{user.name}</b></div>
        <div className="row"><span>Email</span><b>{user.email}</b></div>
        <div className="row"><span>Survey status</span><b className={completed ? "green" : ""}>{completed ? "Completed" : "Not started"}</b></div>
        {completed && <div className="row"><span>Your score</span><b>{user.score}/20</b></div>}
      </section>

      <p className="notice">The ₦200,000 figure shown here represents the study reward configured by the research team. It is not a bank account balance or guaranteed cash withdrawal unless the study's approved payment process says so.</p>
    </main>
  );
}

function Survey({ survey, answers, setAnswers, onSubmit, error }) {
  const [index, setIndex] = useState(0);
  const q = survey.questions[index];
  const progress = ((index + 1) / survey.questions.length) * 100;
  return (
    <main className="survey-page">
      <div className="survey-head">
        <button className="back" onClick={() => index ? setIndex(index-1) : location.reload()}>‹</button>
        <div><b>{index + 1} of {survey.questions.length}</b><div className="progress"><i style={{width:`${progress}%`}} /></div></div>
      </div>
      <section className="question-card">
        <p className="eyebrow">NIGERIAN HISTORY</p>
        <h1>{q.question}</h1>
        <div className="options">
          {q.options.map((option, i) => (
            <button className={answers[index] === i ? "option selected" : "option"} key={option} onClick={() => setAnswers(a => { const x=[...a]; x[index]=i; return x; })}>
              <span>{String.fromCharCode(65+i)}</span>{option}<b>{answers[index] === i ? "✓" : ""}</b>
            </button>
          ))}
        </div>
      </section>
      {error && <div className="error">{error}</div>}
      <button className="primary wide bottom" onClick={() => index === survey.questions.length - 1 ? onSubmit() : setIndex(index+1)}>
        {index === survey.questions.length - 1 ? "Submit survey" : "Continue"}
      </button>
    </main>
  );
}

function Result({ user, result }) {
  return (
    <main className="result-page">
      <div className="success-icon">✓</div>
      <p className="eyebrow">SURVEY COMPLETE</p>
      <h1>You're all done.</h1>
      <p className="muted">Thank you for taking part in the Nigerian history research survey.</p>
      <section className="reward-card">
        <span>RESEARCH REWARD</span>
        <strong>₦200,000</strong>
        <small>Unlocked in your participant account</small>
      </section>
      <section className="score-card">
        <span>Your survey score</span><strong>{result?.score ?? user.score}/20</strong>
      </section>
      <p className="notice">This screen records eligibility for the configured study reward. Actual disbursement should be handled through the approved grant/payment process.</p>
    </main>
  );
}

createRoot(document.getElementById("root")).render(<App />);
