const express = require("express");
const path = require("path");
const fs = require("fs");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();
const PORT = process.env.PORT || 10000;
const JWT_SECRET = process.env.JWT_SECRET || "change-this-secret-in-production";
const DB_FILE = path.join(__dirname, "db.json");

app.use(express.json());

const survey = [
  { id: 1, question: "In what year did Nigeria gain independence from Britain?", options: ["1957", "1960", "1963", "1970"], answer: 1 },
  { id: 2, question: "Who was Nigeria's first Prime Minister?", options: ["Nnamdi Azikiwe", "Obafemi Awolowo", "Abubakar Tafawa Balewa", "Ahmadu Bello"], answer: 2 },
  { id: 3, question: "Who became Nigeria's first President after independence?", options: ["Nnamdi Azikiwe", "Yakubu Gowon", "Abubakar Tafawa Balewa", "Shehu Shagari"], answer: 0 },
  { id: 4, question: "Which city served as Nigeria's capital before Abuja?", options: ["Kano", "Ibadan", "Lagos", "Kaduna"], answer: 2 },
  { id: 5, question: "In what year was Abuja officially made Nigeria's capital?", options: ["1976", "1980", "1985", "1991"], answer: 3 },
  { id: 6, question: "Which Nigerian region was historically associated with the Oyo Empire?", options: ["Southwestern Nigeria", "Southeastern Nigeria", "Niger Delta", "Northern Nigeria"], answer: 0 },
  { id: 7, question: "The ancient city of Benin was the centre of which famous kingdom?", options: ["Kanem-Bornu Empire", "Benin Kingdom", "Oyo Empire", "Sokoto Caliphate"], answer: 1 },
  { id: 8, question: "Who founded the Sokoto Caliphate?", options: ["Usman dan Fodio", "Ahmadu Bello", "Muhammadu Buhari", "Jaja of Opobo"], answer: 0 },
  { id: 9, question: "Which historic Nigerian city was a major centre of trans-Saharan trade?", options: ["Calabar", "Kano", "Port Harcourt", "Enugu"], answer: 1 },
  { id: 10, question: "The Aba Women's Riot took place in which year?", options: ["1914", "1929", "1945", "1953"], answer: 1 },
  { id: 11, question: "Which Nigerian nationalist is strongly associated with the newspaper West African Pilot?", options: ["Nnamdi Azikiwe", "Anthony Enahoro", "Herbert Macaulay", "Ahmadu Bello"], answer: 0 },
  { id: 12, question: "Who is widely regarded as the first Nigerian to establish a political party, the Nigerian National Democratic Party?", options: ["Herbert Macaulay", "Nnamdi Azikiwe", "Obafemi Awolowo", "Tafawa Balewa"], answer: 0 },
  { id: 13, question: "Nigeria became a republic in which year?", options: ["1960", "1961", "1963", "1966"], answer: 2 },
  { id: 14, question: "Who was Nigeria's first military Head of State?", options: ["Yakubu Gowon", "Aguiyi Ironsi", "Murtala Mohammed", "Olusegun Obasanjo"], answer: 1 },
  { id: 15, question: "The Nigerian Civil War began in which year?", options: ["1966", "1967", "1970", "1975"], answer: 1 },
  { id: 16, question: "What was the former name of the area now known as Nigeria's Niger Delta region in colonial administrative history?", options: ["Oil Rivers Protectorate", "Northern Protectorate", "Lagos Colony", "Sokoto Province"], answer: 0 },
  { id: 17, question: "Which Nigerian leader introduced the 'Operation Feed the Nation' programme?", options: ["Yakubu Gowon", "Olusegun Obasanjo", "Shehu Shagari", "Ibrahim Babangida"], answer: 1 },
  { id: 18, question: "Which Nigerian leader launched the 'Green Revolution' programme in the late 1970s?", options: ["Shehu Shagari", "Murtala Mohammed", "Sani Abacha", "Goodluck Jonathan"], answer: 0 },
  { id: 19, question: "Which Nigerian city is historically associated with the famous Nok culture discoveries?", options: ["Jos", "Kaduna", "Abuja", "Ife"], answer: 0 },
  { id: 20, question: "Which declaration is associated with Nigeria's transition to a republic in 1963?", options: ["Republic Declaration", "Independence Proclamation", "Lagos Declaration", "Kano Accord"], answer: 0 }
];

function readDb() {
  return JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
}
function writeDb(db) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}
function auth(req, res, next) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ message: "Authentication required" });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ message: "Session expired" });
  }
}

app.post("/api/auth/register", async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password || password.length < 6)
    return res.status(400).json({ message: "Enter a name, valid email and password of at least 6 characters." });

  const db = readDb();
  if (db.users.some(u => u.email.toLowerCase() === email.toLowerCase()))
    return res.status(409).json({ message: "An account with that email already exists." });

  const user = {
    id: crypto.randomUUID(),
    name: name.trim(),
    email: email.trim().toLowerCase(),
    passwordHash: await bcrypt.hash(password, 10),
    completed: false,
    score: null,
    createdAt: new Date().toISOString()
  };
  db.users.push(user);
  writeDb(db);

  const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: "7d" });
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, completed: false, score: null } });
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  const db = readDb();
  const user = db.users.find(u => u.email === String(email || "").toLowerCase());
  if (!user || !(await bcrypt.compare(password || "", user.passwordHash)))
    return res.status(401).json({ message: "Incorrect email or password." });

  const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: "7d" });
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, completed: user.completed, score: user.score } });
});

app.get("/api/me", auth, (req, res) => {
  const db = readDb();
  const user = db.users.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json({ id: user.id, name: user.name, email: user.email, completed: user.completed, score: user.score });
});

app.get("/api/survey", auth, (req, res) => {
  res.json({
    title: "Nigerian History Survey",
    description: "Test your knowledge of key moments, people and events in Nigerian history.",
    questions: survey.map(({ answer, ...q }) => q)
  });
});

app.post("/api/survey/submit", auth, (req, res) => {
  const { answers } = req.body;
  if (!Array.isArray(answers) || answers.length !== survey.length)
    return res.status(400).json({ message: "Please answer every question before submitting." });

  const db = readDb();
  const user = db.users.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ message: "User not found" });
  if (user.completed) return res.status(409).json({ message: "This survey has already been completed." });

  const score = survey.reduce((total, q, i) => total + (Number(answers[i]) === q.answer ? 1 : 0), 0);
  user.completed = true;
  user.score = score;
  user.completedAt = new Date().toISOString();

  db.responses.push({
    id: crypto.randomUUID(),
    userId: user.id,
    answers,
    score,
    submittedAt: user.completedAt
  });
  writeDb(db);

  res.json({
    message: "Survey completed successfully.",
    score,
    total: survey.length,
    rewardUnlocked: true,
    rewardAmount: 200000
  });
});

const dist = path.join(__dirname, "..", "dist");
if (fs.existsSync(dist)) {
  app.use(express.static(dist));
  app.get("*splat", (req, res) => res.sendFile(path.join(dist, "index.html")));
}

app.listen(PORT, () => console.log(`Survey app running on port ${PORT}`));