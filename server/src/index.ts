import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import taskRoutes from "./routes/tasks";
import topicRoutes from "./routes/topics";
import pool from "./db";
import boardRoutes from "./routes/boards";
import scheduleRoutes from "./routes/schedule";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/tasks", taskRoutes);
app.use("/api/topics", topicRoutes);
app.use("/api/boards", boardRoutes);
app.use("/api/schedule", scheduleRoutes);

const PORT = process.env.PORT || 3001;

const initDb = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS tasks (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      date DATE NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      priority TEXT NOT NULL DEFAULT 'medium',
      color TEXT NOT NULL DEFAULT '#6366f1',
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);
  await pool.query(`
  CREATE TABLE IF NOT EXISTS boards (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    data JSONB DEFAULT '{}',
    updated_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await pool.query(`
  CREATE TABLE IF NOT EXISTS schedule (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    date DATE NOT NULL,
    start_time TEXT,
    end_time TEXT,
    type TEXT NOT NULL DEFAULT 'personal',
    created_at TIMESTAMP DEFAULT NOW()
  )
`);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS topics (
      id SERIAL PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      abbr TEXT,
      icon TEXT DEFAULT '📄',
      color TEXT DEFAULT '#2563eb',
      category TEXT NOT NULL,
      description TEXT,
      analogy TEXT,
      concepts JSONB DEFAULT '[]',
      connects JSONB DEFAULT '[]',
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);
  console.log("Database ready");
};


initDb().then(() => {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});