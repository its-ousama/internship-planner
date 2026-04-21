import { Router, Request, Response } from "express";
import pool from "../db";

const router = Router();

// Get all boards (list, no canvas data for performance)
router.get("/", async (_req: Request, res: Response) => {
  const result = await pool.query(
    "SELECT id, name, updated_at FROM boards ORDER BY updated_at DESC"
  );
  res.json(result.rows);
});

// Get single board with full data
router.get("/:id", async (req: Request, res: Response) => {
  const result = await pool.query(
    "SELECT * FROM boards WHERE id = $1",
    [req.params.id]
  );
  if (result.rows.length === 0) return res.status(404).json({ error: "Not found" });
  res.json(result.rows[0]);
});

// Create board
router.post("/", async (req: Request, res: Response) => {
  const { name } = req.body;
  const result = await pool.query(
    "INSERT INTO boards (name) VALUES ($1) RETURNING id, name, updated_at",
    [name]
  );
  res.json(result.rows[0]);
});

// Save board data (override)
router.put("/:id", async (req: Request, res: Response) => {
  const { data } = req.body;
  const result = await pool.query(
    "UPDATE boards SET data = $1, updated_at = NOW() WHERE id = $2 RETURNING id, name, updated_at",
    [JSON.stringify(data), req.params.id]
  );
  res.json(result.rows[0]);
});

// Rename board
router.patch("/:id", async (req: Request, res: Response) => {
  const { name } = req.body;
  const result = await pool.query(
    "UPDATE boards SET name = $1 WHERE id = $2 RETURNING id, name, updated_at",
    [name, req.params.id]
  );
  res.json(result.rows[0]);
});

// Delete board
router.delete("/:id", async (req: Request, res: Response) => {
  await pool.query("DELETE FROM boards WHERE id = $1", [req.params.id]);
  res.json({ success: true });
});

export default router;