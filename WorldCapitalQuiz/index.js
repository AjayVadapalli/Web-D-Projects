import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

const db = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // Required for Render
  },
});

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

let quiz = [];

// Fetch questions from the database
async function fetchQuestions() {
  try {
    const result = await db.query("SELECT * FROM capitals");
    quiz = result.rows;
  } catch (err) {
    console.error("Error fetching data:", err);
  }
}

fetchQuestions();

let totalCorrect = 0;
let currentQuestion = {};

// GET home page
app.get("/", async (req, res) => {
  totalCorrect = 0;
  await nextQuestion();
  res.render("index.ejs", { question: currentQuestion });
});

// POST answer
app.post("/submit", (req, res) => {
  let answer = req.body.answer.trim();
  let isCorrect = currentQuestion.capital.toLowerCase() === answer.toLowerCase();

  if (isCorrect) {
    totalCorrect++;
  }

  nextQuestion();
  res.render("index.ejs", {
    question: currentQuestion,
    wasCorrect: isCorrect,
    totalScore: totalCorrect,
  });
});

async function nextQuestion() {
  if (quiz.length === 0) {
    await fetchQuestions();
  }
  currentQuestion = quiz[Math.floor(Math.random() * quiz.length)];
}

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
