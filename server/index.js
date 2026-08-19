const express = require("express");
const path = require("path");
const fs = require("fs");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();
const PORT = process.env.PORT || 10000;
const JWT_SECRET = process.env.JWT_SECRET || "change-this-secret-in-production";
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) console.warn("MONGODB_URI is not set. Add it in Render Environment Variables.");

const mongoose = require("mongoose");
const crypto = require("crypto");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  completed: { type: Boolean, default: false },
  score: { type: Number, default: null },
  completedAt: Date,
  createdAt: { type: Date, default: Date.now }
});

const responseSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true, unique: true, ref: "User" },
  answers: { type: [Number], required: true },
  score: { type: Number, required: true },
  submittedAt: { type: Date, default: Date.now }
});

const User = mongoose.model("User", userSchema);
const SurveyResponse = mongoose.model("SurveyResponse", responseSchema);

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
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password || password.length < 6)
      return res.status(400).json({ message: "Enter a name, valid email and password of at least 6 characters." });

    const normalizedEmail = email.trim().toLowerCase();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) return res.status(409).json({ message: "An account with that email already exists." });

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash: await bcrypt.hash(password, 10)
    });

    const token = jwt.sign({ id: user._id.toString(), email: user.email, name: user.name }, JWT_SECRET, { expiresIn: "7d" });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, completed: false, score: null } });
  } catch (e) {
    if (e.code === 11000) return res.status(409).json({ message: "An account with that email already exists." });
    res.status(500).json({ message: "Could not create your account." });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: String(email || "").trim().toLowerCase() });
    if (!user || !(await bcrypt.compare(password || "", user.passwordHash)))
      return res.status(401).json({ message: "Incorrect email or password." });

    const token = jwt.sign({ id: user._id.toString(), email: user.email, name: user.name }, JWT_SECRET, { expiresIn: "7d" });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, completed: user.completed, score: user.score } });
  } catch {
    res.status(500).json({ message: "Could not sign you in." });
  }
});

app.get("/api/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ id: user._id, name: user.name, email: user.email, completed: user.completed, score: user.score });
  } catch {
    res.status(401).json({ message: "Session expired" });
  }
});

app.get("/api/survey", auth, (req, res) => {
  res.json({
    title: "Nigerian History Survey",
    description: "Test your knowledge of key moments, people and events in Nigerian history.",
    questions: survey.map(({ answer, ...q }) => q)
  });
});

app.post("/api/survey/submit", auth, async (req, res) => {
  try {
    const { answers } = req.body;
    if (!Array.isArray(answers) || answers.length !== survey.length)
      return res.status(400).json({ message: "Please answer every question before submitting." });

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "Your account could not be found. Please log out and sign in again." });
    if (user.completed) return res.status(409).json({ message: "This survey has already been completed." });

    const numericAnswers = answers.map(Number);
    const score = survey.reduce((total, q, i) => total + (numericAnswers[i] === q.answer ? 1 : 0), 0);
    const completedAt = new Date();

    // Save the response first. The unique userId index prevents duplicate submissions.
    await SurveyResponse.create({
      userId: user._id,
      answers: numericAnswers,
      score,
      submittedAt: completedAt
    });

    await User.updateOne(
      { _id: user._id, completed: false },
      { $set: { completed: true, score, completedAt } }
    );

    res.json({
      message: "Survey completed successfully.",
      score,
      total: survey.length,
      rewardUnlocked: true,
      rewardAmount: 200000
    });
  } catch (e) {
    if (e?.code === 11000)
      return res.status(409).json({ message: "This survey has already been submitted." });
    console.error("Survey submission error:", e);
    const message = e?.name === "ValidationError"
      ? "Some survey data was invalid. Please refresh the survey and try again."
      : e?.name === "MongoServerSelectionError"
        ? "The survey database is temporarily unavailable. Please try again in a moment."
        : "Could not submit the survey right now. Please try again.";
    res.status(500).json({ message });
  }
});

const dist = path.join(__dirname, "..", "dist");
if (fs.existsSync(dist)) {
  app.use(express.static(dist));
  app.get("*splat", (req, res) => res.sendFile(path.join(dist, "index.html")));
}

mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 10000 })
  .then(() => {
    console.log("Connected to MongoDB");
    app.listen(PORT, () => console.log(`Bolu Aderoju Initiative survey app running on port ${PORT}`));
  })
  .catch(err => {
    console.error("MongoDB connection failed:", err.message);
    process.exit(1);
  });