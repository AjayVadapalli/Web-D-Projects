import fs from "fs";
import csvParser from "csv-parser";
import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Database Connection
const db = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // Required for Render
  },
});

// Create table if it doesn't exist
async function setupDatabase() {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS capitals (
        id SERIAL PRIMARY KEY,
        country VARCHAR(100) UNIQUE,
        capital VARCHAR(100)
      );
    `);
    console.log("✅ Table check complete");

    // Check if data exists
    const result = await db.query("SELECT COUNT(*) FROM capitals;");
    if (parseInt(result.rows[0].count) === 0) {
      console.log("📥 No data found, importing CSV...");
      await importCSVData();
    } else {
      console.log("✅ Data already exists, skipping import.");
    }
  } catch (err) {
    console.error("❌ Error setting up database:", err);
  }
}

// Import CSV Data into Database
async function importCSVData() {
  const records = [];
  fs.createReadStream("./capitals.csv")
    .pipe(csvParser())
    .on("data", (row) => {
      records.push(row);
    })
    .on("end", async () => {
      try {
        for (const record of records) {
          await db.query("INSERT INTO capitals (country, capital) VALUES ($1, $2) ON CONFLICT (country) DO NOTHING;", [
            record.country,
            record.capital,
          ]);
        }
        console.log("✅ CSV data imported successfully!");
      } catch (err) {
        console.error("❌ Error inserting CSV data:", err);
      }
    });
}

// Load questions from the database
async function loadQuiz() {
  try {
    const res = await db.query("SELECT * FROM capitals;");
    return res.rows;
  } catch (err) {
    console.error("❌ Error loading quiz data:", err);
    return [];
  }
}

let totalCorrect = 0;
let currentQuestion = {};

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// GET home page
app.get("/", async (req, res) => {
  totalCorrect = 0;
  const quiz = await loadQuiz();
  if (quiz.length === 0) {
    return res.send("⚠️ No quiz data found. Please check your database.");
  }
  await nextQuestion(quiz);
  res.render("index.ejs", { question: currentQuestion });
});

// POST answer
app.post("/submit", async (req, res) => {
  let answer = req.body.answer.trim();
  let isCorrect = false;

  if (currentQuestion.capital.toLowerCase() === answer.toLowerCase()) {
    totalCorrect++;
    isCorrect = true;
  }

  const quiz = await loadQuiz();
  await nextQuestion(quiz);

  res.render("index.ejs", {
    question: currentQuestion,
    wasCorrect: isCorrect,
    totalScore: totalCorrect,
  });
});

// Select next random question
async function nextQuestion(quiz) {
  currentQuestion = quiz[Math.floor(Math.random() * quiz.length)];
}

// Start server and setup database
app.listen(port, async () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
  await setupDatabase();
});
