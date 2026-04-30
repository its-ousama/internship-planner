import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import taskRoutes from "./routes/tasks";
import topicRoutes from "./routes/topics";
import pool from "./db";
import boardRoutes from "./routes/boards";
import scheduleRoutes from "./routes/schedule";
import journalRoutes from "./routes/journals";
import financeRoutes from "./routes/finance";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/tasks", taskRoutes);
app.use("/api/topics", topicRoutes);
app.use("/api/boards", boardRoutes);
app.use("/api/schedule", scheduleRoutes);
app.use("/api/journals", journalRoutes);
app.use("/api/finance", financeRoutes);

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
  await pool.query(`
    CREATE TABLE IF NOT EXISTS journals (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL DEFAULT 'Untitled',
      content JSONB DEFAULT '{}',
      theme JSONB DEFAULT '{}',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS journal_config (
      id SERIAL PRIMARY KEY,
      hash TEXT NOT NULL
    )
  `);

  // ── Finance tables ──────────────────────────────────────────────────────────
  await pool.query(`
    CREATE TABLE IF NOT EXISTS finance_config (
      id SERIAL PRIMARY KEY,
      pin_hash TEXT NOT NULL
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS finance_categories (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      icon TEXT DEFAULT '💰',
      color TEXT DEFAULT '#6366f1',
      monthly_budget NUMERIC(12,2) DEFAULT 0,
      type TEXT NOT NULL DEFAULT 'expense',
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS finance_transactions (
      id SERIAL PRIMARY KEY,
      amount NUMERIC(12,2) NOT NULL,
      type TEXT NOT NULL DEFAULT 'expense',
      category_id INTEGER REFERENCES finance_categories(id) ON DELETE SET NULL,
      date DATE NOT NULL DEFAULT NOW(),
      note TEXT DEFAULT '',
      is_recurring BOOLEAN DEFAULT false,
      recurring_id INTEGER,
      is_goal BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);
  await pool.query(`
    ALTER TABLE finance_transactions ADD COLUMN IF NOT EXISTS is_goal BOOLEAN DEFAULT false
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS finance_recurring (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      amount NUMERIC(12,2) NOT NULL,
      category_id INTEGER REFERENCES finance_categories(id) ON DELETE SET NULL,
      type TEXT NOT NULL DEFAULT 'expense',
      day_of_month INTEGER DEFAULT 1,
      active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS finance_recurring_skips (
      id SERIAL PRIMARY KEY,
      recurring_id INTEGER NOT NULL,
      month TEXT NOT NULL,
      UNIQUE(recurring_id, month)
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS finance_goals (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      icon TEXT DEFAULT '🎯',
      color TEXT DEFAULT '#6366f1',
      target_amount NUMERIC(12,2) NOT NULL,
      current_amount NUMERIC(12,2) DEFAULT 0,
      deadline DATE,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS finance_monthly_summary (
      id SERIAL PRIMARY KEY,
      month TEXT UNIQUE NOT NULL,
      opening_balance NUMERIC(12,2) DEFAULT 0,
      closing_balance NUMERIC(12,2) DEFAULT 0,
      total_income NUMERIC(12,2) DEFAULT 0,
      total_expenses NUMERIC(12,2) DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  console.log("Database ready");
};

initDb().then(() => {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});