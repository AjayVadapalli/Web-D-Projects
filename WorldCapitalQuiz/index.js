import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Configure PostgreSQL client
const db = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // Required for Render PostgreSQL
  },
});

// Connect to database
db.connect()
  .then(() => console.log("Connected to PostgreSQL"))
  .catch((err) => console.error("Database connection error:", err.stack));

let quiz = [];
let totalCorrect = 0;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// Fetch quiz data from database
async function loadQuizData() {
  try {
    const result = await db.query("SELECT * FROM capitals");
    quiz = result.rows;
    console.log("Quiz data loaded:", quiz);
  } catch (err) {
    console.error("Error fetching quiz data:", err.stack);
  }
}

// Initialize quiz data
await loadQuizData();

let currentQuestion = {};

// GET home page
app.get("/", async (req, res) => {
  totalCorrect = 0;
  await nextQuestion();
  res.render("index.ejs", { question: currentQuestion });
});

// POST submit answer
app.post("/submit", async (req, res) => {
  let answer = req.body.answer.trim();
  let isCorrect = false;

  if (currentQuestion.capital.toLowerCase() === answer.toLowerCase()) {
    totalCorrect++;
    isCorrect = true;
  }

  await nextQuestion();
  res.render("index.ejs", {
    question: currentQuestion,
    wasCorrect: isCorrect,
    totalScore: totalCorrect,
  });
});

// Function to get the next random question
async function nextQuestion() {
  if (quiz.length === 0) {
    await loadQuizData();
  }
  currentQuestion = quiz[Math.floor(Math.random() * quiz.length)];
}

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});