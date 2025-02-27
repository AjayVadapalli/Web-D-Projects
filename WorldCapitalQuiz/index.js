import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const port = 3000;

const db = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // Required for Render
  },
  max: 10, // Limits connections to avoid overload
});

// Test connection
db.connect()
  .then(() => console.log("✅ Connected to the database"))
  .catch((err) => console.error("❌ Database connection error:", err.message));

let quiz = [];

// Fetch data from database
async function fetchQuestions() {
  try {
    const result = await db.query("SELECT country, capital FROM capitals");
    quiz = result.rows;
    console.log("✅ Data fetched successfully", quiz.length);
  } catch (error) {
    console.error("❌ Error fetching data:", error);
  }
}

fetchQuestions(); // Call it when server starts

let totalCorrect = 0;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

let currentQuestion = {};

// GET home page
app.get("/", async (req, res) => {
  totalCorrect = 0;
  await nextQuestion();

  if (!currentQuestion || !currentQuestion.country) {
    return res.status(500).send("Error: No questions available. Check database connection.");
  }

  res.render("index.ejs", { question: currentQuestion });
});

// POST submit answer
app.post("/submit", (req, res) => {
  let answer = req.body.answer.trim();
  let isCorrect = false;

  if (currentQuestion.capital.toLowerCase() === answer.toLowerCase()) {
    totalCorrect++;
    isCorrect = true;
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
    console.error("❌ No questions available. Check database connection.");
    return;
  }
  currentQuestion = quiz[Math.floor(Math.random() * quiz.length)];
}

app.listen(port, () => {
  console.log(`🚀 Server is running at http://localhost:${port}`);
});
