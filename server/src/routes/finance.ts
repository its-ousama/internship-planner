import { Router, Request, Response } from "express";
import pool from "../db";
import crypto from "crypto";

const router = Router();

function hashPin(pin: string): string {
  return crypto.createHash("sha256").update(pin.trim()).digest("hex");
}

// ── Helper: calculate and save a month's totals, returns closing_balance ─────

async function recalcMonth(month: string): Promise<number> {
  const [year, mon] = month.split("-").map(Number);
  const prevDate = new Date(year, mon - 2, 1);
  const prevMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, "0")}`;

  // Get previous month's closing balance (recursively fresh)
  const prevSummary = await pool.query(
    "SELECT closing_balance FROM finance_monthly_summary WHERE month = $1", [prevMonth]
  );
  const openingBalance = prevSummary.rows.length > 0
    ? parseFloat(prevSummary.rows[0].closing_balance)
    : 0;

  // All transactions for balance
  const allTx = await pool.query(
    `SELECT type, SUM(amount) as total FROM finance_transactions
     WHERE TO_CHAR(date, 'YYYY-MM') = $1 GROUP BY type`, [month]
  );
  let allIncome = 0, allExpenses = 0;
  allTx.rows.forEach((r: any) => {
    if (r.type === "income") allIncome = parseFloat(r.total);
    else allExpenses = parseFloat(r.total);
  });

  // Stats only (exclude is_goal)
  const statsTx = await pool.query(
    `SELECT type, SUM(amount) as total FROM finance_transactions
     WHERE TO_CHAR(date, 'YYYY-MM') = $1 AND is_goal = false GROUP BY type`, [month]
  );
  let statsIncome = 0, statsExpenses = 0;
  statsTx.rows.forEach((r: any) => {
    if (r.type === "income") statsIncome = parseFloat(r.total);
    else statsExpenses = parseFloat(r.total);
  });

  const closingBalance = openingBalance + allIncome - allExpenses;

  // Upsert summary
  await pool.query(
    `INSERT INTO finance_monthly_summary (month, opening_balance, closing_balance, total_income, total_expenses)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (month) DO UPDATE SET
       opening_balance = EXCLUDED.opening_balance,
       closing_balance = EXCLUDED.closing_balance,
       total_income = EXCLUDED.total_income,
       total_expenses = EXCLUDED.total_expenses`,
    [month, openingBalance, closingBalance, statsIncome, statsExpenses]
  );

  return closingBalance;
}

// ── PIN Gate ─────────────────────────────────────────────────────────────────

router.get("/config/status", async (_req: Request, res: Response) => {
  const result = await pool.query("SELECT id FROM finance_config LIMIT 1");
  res.json({ configured: result.rows.length > 0 });
});

router.post("/config/setup", async (req: Request, res: Response) => {
  const existing = await pool.query("SELECT id FROM finance_config LIMIT 1");
  if (existing.rows.length > 0) return res.status(400).json({ error: "Already configured" });
  const { pin } = req.body;
  if (!pin || pin.length < 4) return res.status(400).json({ error: "PIN must be at least 4 digits" });
  const hash = hashPin(pin);
  await pool.query("INSERT INTO finance_config (pin_hash) VALUES ($1)", [hash]);
  res.json({ success: true });
});

router.post("/config/verify", async (req: Request, res: Response) => {
  const { pin } = req.body;
  const result = await pool.query("SELECT pin_hash FROM finance_config LIMIT 1");
  if (result.rows.length === 0) return res.status(404).json({ error: "Not configured" });
  const match = hashPin(pin) === result.rows[0].pin_hash;
  res.json({ success: match });
});

// ── Categories ────────────────────────────────────────────────────────────────

router.get("/categories", async (_req: Request, res: Response) => {
  const result = await pool.query("SELECT * FROM finance_categories ORDER BY created_at ASC");
  res.json(result.rows);
});

router.post("/categories", async (req: Request, res: Response) => {
  const { name, icon, color, monthly_budget, type } = req.body;
  const result = await pool.query(
    `INSERT INTO finance_categories (name, icon, color, monthly_budget, type)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [name, icon || "💰", color || "#6366f1", monthly_budget || 0, type || "expense"]
  );
  res.json(result.rows[0]);
});

router.put("/categories/:id", async (req: Request, res: Response) => {
  const { name, icon, color, monthly_budget, type } = req.body;
  const result = await pool.query(
    `UPDATE finance_categories SET name=$1, icon=$2, color=$3, monthly_budget=$4, type=$5
     WHERE id=$6 RETURNING *`,
    [name, icon, color, monthly_budget, type, req.params.id]
  );
  res.json(result.rows[0]);
});

router.delete("/categories/:id", async (req: Request, res: Response) => {
  await pool.query("DELETE FROM finance_categories WHERE id=$1", [req.params.id]);
  res.json({ success: true });
});

// ── Transactions ──────────────────────────────────────────────────────────────

router.get("/transactions", async (req: Request, res: Response) => {
  const { month, category_id } = req.query;
  let query = `SELECT t.*, c.name as category_name, c.icon as category_icon, c.color as category_color,
               TO_CHAR(t.date, 'YYYY-MM-DD') as date
               FROM finance_transactions t
               LEFT JOIN finance_categories c ON t.category_id = c.id`;
  const params: any[] = [];
  const conditions: string[] = [];

  if (month) {
    params.push(month);
    conditions.push(`TO_CHAR(t.date, 'YYYY-MM') = $${params.length}`);
  }
  if (category_id) {
    params.push(category_id);
    conditions.push(`t.category_id = $${params.length}`);
  }
  if (conditions.length > 0) query += " WHERE " + conditions.join(" AND ");
  query += " ORDER BY t.date DESC, t.created_at DESC";

  const result = await pool.query(query, params);
  res.json(result.rows);
});

router.post("/transactions", async (req: Request, res: Response) => {
  const { amount, type, category_id, date, note, is_recurring, recurring_id, is_goal } = req.body;
  const result = await pool.query(
    `INSERT INTO finance_transactions (amount, type, category_id, date, note, is_recurring, recurring_id, is_goal)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *, TO_CHAR(date, 'YYYY-MM-DD') as date`,
    [amount, type, category_id || null, date, note || "", is_recurring || false, recurring_id || null, is_goal || false]
  );
  res.json(result.rows[0]);
});

router.put("/transactions/:id", async (req: Request, res: Response) => {
  const { amount, type, category_id, date, note } = req.body;
  const result = await pool.query(
    `UPDATE finance_transactions SET amount=$1, type=$2, category_id=$3, date=$4, note=$5
     WHERE id=$6 RETURNING *, TO_CHAR(date, 'YYYY-MM-DD') as date`,
    [amount, type, category_id || null, date, note || "", req.params.id]
  );
  res.json(result.rows[0]);
});

router.delete("/transactions/:id", async (req: Request, res: Response) => {
  await pool.query("DELETE FROM finance_transactions WHERE id=$1", [req.params.id]);
  res.json({ success: true });
});

// ── Recurring Templates ───────────────────────────────────────────────────────

router.get("/recurring", async (_req: Request, res: Response) => {
  const result = await pool.query(
    `SELECT r.*, c.name as category_name, c.icon as category_icon, c.color as category_color
     FROM finance_recurring r
     LEFT JOIN finance_categories c ON r.category_id = c.id
     WHERE r.active = true ORDER BY r.day_of_month ASC`
  );
  res.json(result.rows);
});

router.post("/recurring", async (req: Request, res: Response) => {
  const { title, amount, category_id, type, day_of_month } = req.body;
  const result = await pool.query(
    `INSERT INTO finance_recurring (title, amount, category_id, type, day_of_month)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [title, amount, category_id || null, type || "expense", day_of_month || 1]
  );
  res.json(result.rows[0]);
});

router.delete("/recurring/:id", async (req: Request, res: Response) => {
  await pool.query("UPDATE finance_recurring SET active=false WHERE id=$1", [req.params.id]);
  res.json({ success: true });
});

router.post("/recurring/skip", async (req: Request, res: Response) => {
  const { recurring_id, month } = req.body;
  await pool.query(
    `INSERT INTO finance_recurring_skips (recurring_id, month) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
    [recurring_id, month]
  );
  res.json({ success: true });
});

// ── Savings Goals ─────────────────────────────────────────────────────────────

router.get("/goals", async (_req: Request, res: Response) => {
  const result = await pool.query("SELECT * FROM finance_goals ORDER BY created_at DESC");
  res.json(result.rows);
});

router.post("/goals", async (req: Request, res: Response) => {
  const { name, icon, color, target_amount, deadline } = req.body;
  const result = await pool.query(
    `INSERT INTO finance_goals (name, icon, color, target_amount, deadline)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [name, icon || "🎯", color || "#6366f1", target_amount, deadline || null]
  );
  res.json(result.rows[0]);
});

router.patch("/goals/:id/contribute", async (req: Request, res: Response) => {
  const { amount } = req.body;
  const result = await pool.query(
    `UPDATE finance_goals SET current_amount = GREATEST(0, current_amount + $1) WHERE id=$2 RETURNING *`,
    [amount, req.params.id]
  );
  res.json(result.rows[0]);
});

router.put("/goals/:id", async (req: Request, res: Response) => {
  const { name, icon, color, target_amount, deadline } = req.body;
  const result = await pool.query(
    `UPDATE finance_goals SET name=$1, icon=$2, color=$3, target_amount=$4, deadline=$5
     WHERE id=$6 RETURNING *`,
    [name, icon, color, target_amount, deadline || null, req.params.id]
  );
  res.json(result.rows[0]);
});

router.delete("/goals/:id", async (req: Request, res: Response) => {
  await pool.query("DELETE FROM finance_goals WHERE id=$1", [req.params.id]);
  res.json({ success: true });
});

// ── Monthly Summary ───────────────────────────────────────────────────────────
// Always recalculates previous month first so opening_balance is always fresh

router.get("/summary/:month", async (req: Request, res: Response) => {
  const month = String(req.params.month);

  // Step 1: recalculate previous month to get fresh closing_balance
  const [year, mon] = month.split("-").map(Number);
  const prevDate = new Date(year, mon - 2, 1);
  const prevMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, "0")}`;

  // Only recalc prev month if it has a summary (avoid infinite cascade on month 0)
  const prevExists = await pool.query(
    "SELECT id FROM finance_monthly_summary WHERE month = $1", [prevMonth]
  );
  let openingBalance = 0;
  if (prevExists.rows.length > 0) {
    openingBalance = await recalcMonth(prevMonth);
  }

  // Step 2: calculate current month totals
  const allTx = await pool.query(
    `SELECT type, SUM(amount) as total FROM finance_transactions
     WHERE TO_CHAR(date, 'YYYY-MM') = $1 GROUP BY type`, [month]
  );
  let allIncome = 0, allExpenses = 0;
  allTx.rows.forEach((r: any) => {
    if (r.type === "income") allIncome = parseFloat(r.total);
    else allExpenses = parseFloat(r.total);
  });

  const statsTx = await pool.query(
    `SELECT type, SUM(amount) as total FROM finance_transactions
     WHERE TO_CHAR(date, 'YYYY-MM') = $1 AND is_goal = false GROUP BY type`, [month]
  );
  let statsIncome = 0, statsExpenses = 0;
  statsTx.rows.forEach((r: any) => {
    if (r.type === "income") statsIncome = parseFloat(r.total);
    else statsExpenses = parseFloat(r.total);
  });

  const closingBalance = openingBalance + allIncome - allExpenses;

  // Step 3: upsert current month summary
  const result = await pool.query(
    `INSERT INTO finance_monthly_summary (month, opening_balance, closing_balance, total_income, total_expenses)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (month) DO UPDATE SET
       opening_balance = EXCLUDED.opening_balance,
       closing_balance = EXCLUDED.closing_balance,
       total_income = EXCLUDED.total_income,
       total_expenses = EXCLUDED.total_expenses
     RETURNING *`,
    [month, openingBalance, closingBalance, statsIncome, statsExpenses]
  );

  return res.json({
    ...result.rows[0],
    closing_balance: closingBalance,
    total_income: statsIncome,
    total_expenses: statsExpenses,
  });
});

// ── Category spending ─────────────────────────────────────────────────────────

router.get("/spending/:month", async (req: Request, res: Response) => {
  const result = await pool.query(
    `SELECT c.id, c.name, c.icon, c.color, c.monthly_budget, c.type,
            COALESCE(SUM(t.amount), 0) as spent
     FROM finance_categories c
     LEFT JOIN finance_transactions t
       ON t.category_id = c.id
       AND TO_CHAR(t.date, 'YYYY-MM') = $1
       AND t.type = 'expense'
       AND t.is_goal = false
     GROUP BY c.id ORDER BY c.created_at ASC`,
    [req.params.month]
  );
  res.json(result.rows);
});

// ── Pending recurring ─────────────────────────────────────────────────────────

router.get("/recurring/pending/:month", async (req: Request, res: Response) => {
  const { month } = req.params;
  const result = await pool.query(
    `SELECT r.*, c.name as category_name, c.icon as category_icon, c.color as category_color
     FROM finance_recurring r
     LEFT JOIN finance_categories c ON r.category_id = c.id
     WHERE r.active = true
     AND r.id NOT IN (
       SELECT DISTINCT recurring_id FROM finance_transactions
       WHERE TO_CHAR(date, 'YYYY-MM') = $1
       AND recurring_id IS NOT NULL
     )
     AND r.id NOT IN (
       SELECT recurring_id FROM finance_recurring_skips
       WHERE month = $1
     )
     AND TO_CHAR(r.created_at, 'YYYY-MM') != $1`,
    [month]
  );
  res.json(result.rows);
});

export default router;