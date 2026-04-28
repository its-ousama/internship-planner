import { Router, Request, Response } from "express";
import pool from "../db";

const router = Router();

const DATE_FORMAT = "TO_CHAR(date, 'YYYY-MM-DD') as date";

// Get all tasks (optionally filter by date)
router.get("/", async (req: Request, res: Response) => {
  const { date } = req.query;
  const result = date
    ? await pool.query(
        `SELECT id, title, ${DATE_FORMAT}, status, priority, color, created_at FROM tasks WHERE date = $1 ORDER BY created_at ASC`,
        [date],
      )
    : await pool.query(
        `SELECT id, title, ${DATE_FORMAT}, status, priority, color, created_at FROM tasks ORDER BY date ASC, created_at ASC`,
      );
  res.json(result.rows);
});

// Create task
router.post("/", async (req: Request, res: Response) => {
  const { title, date, priority, color } = req.body;
  const result = await pool.query(
    `INSERT INTO tasks (title, date, priority, color) VALUES ($1, $2, $3, $4) RETURNING id, title, ${DATE_FORMAT}, status, priority, color, created_at`,
    [title, date, priority, color],
  );
  res.json(result.rows[0]);
});

// Update task status
router.patch("/:id/status", async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;
  const result = await pool.query(
    `UPDATE tasks SET status = $1 WHERE id = $2 RETURNING id, title, ${DATE_FORMAT}, status, priority, color, created_at`,
    [status, id],
  );
  res.json(result.rows[0]);
});

// Edit task
router.patch("/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  const { title, priority, color } = req.body;
  const result = await pool.query(
    `UPDATE tasks SET title = $1, priority = $2, color = $3 WHERE id = $4 RETURNING id, title, ${DATE_FORMAT}, status, priority, color, created_at`,
    [title, priority, color, id],
  );
  res.json(result.rows[0]);
});

// Delete task
router.delete("/:id", async (req: Request, res: Response) => {
  await pool.query("DELETE FROM tasks WHERE id = $1", [req.params.id]);
  res.json({ success: true });
});

export default router;
