import { Router, Request, Response } from "express";
import pool from "../db";

const router = Router();

console.log("Schedule route loaded");

router.get("/", async (req: Request, res: Response) => {
  const { start, end } = req.query;
  const result = await pool.query(
    `SELECT id, title, TO_CHAR(date, 'YYYY-MM-DD') as date, start_time, end_time, type, created_at
     FROM schedule
     WHERE date >= $1 AND date <= $2
     ORDER BY date ASC, start_time ASC`,
    [start, end],
  );
  res.json(result.rows);
});

router.post("/", async (req: Request, res: Response) => {
  const { title, date, start_time, end_time, type } = req.body;
  const result = await pool.query(
    `INSERT INTO schedule (title, date, start_time, end_time, type)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, title, TO_CHAR(date, 'YYYY-MM-DD') as date, start_time, end_time, type, created_at`,
    [title, date, start_time, end_time, type],
  );
  res.json(result.rows[0]);
});

router.put("/:id", async (req: Request, res: Response) => {
  const { title, date, start_time, end_time, type } = req.body;
  const result = await pool.query(
    `UPDATE schedule SET title=$1, date=$2, start_time=$3, end_time=$4, type=$5
     WHERE id=$6
     RETURNING id, title, TO_CHAR(date, 'YYYY-MM-DD') as date, start_time, end_time, type, created_at`,
    [title, date, start_time, end_time, type, req.params.id],
  );
  res.json(result.rows[0]);
});

router.delete("/:id", async (req: Request, res: Response) => {
  await pool.query("DELETE FROM schedule WHERE id = $1", [req.params.id]);
  res.json({ success: true });
});

router.post("/bulk", async (req: Request, res: Response) => {
  const { title, dates, start_time, end_time, type } = req.body;
  if (!dates || dates.length === 0)
    return res.status(400).json({ error: "No dates provided" });

  const results = [];
  for (const date of dates) {
    const result = await pool.query(
      `INSERT INTO schedule (title, date, start_time, end_time, type)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, title, TO_CHAR(date, 'YYYY-MM-DD') as date, start_time, end_time, type, created_at`,
      [title, date, start_time, end_time, type],
    );
    results.push(result.rows[0]);
  }
  res.json(results);
});

export default router;
