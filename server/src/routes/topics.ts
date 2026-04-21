import { Router, Request, Response } from "express";
import pool from "../db";

const router = Router();

router.get("/", async (_req: Request, res: Response) => {
  const result = await pool.query("SELECT * FROM topics ORDER BY category, name");
  res.json(result.rows);
});

router.post("/", async (req: Request, res: Response) => {
  const { slug, name, abbr, icon, color, category, description, analogy, concepts, connects } = req.body;
  const result = await pool.query(
    `INSERT INTO topics (slug, name, abbr, icon, color, category, description, analogy, concepts, connects)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
    [slug, name, abbr, icon, color, category, description, analogy,
     JSON.stringify(concepts || []), JSON.stringify(connects || [])]
  );
  res.json(result.rows[0]);
});

router.put("/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, abbr, icon, color, category, description, analogy, concepts, connects } = req.body;
  const result = await pool.query(
    `UPDATE topics SET name=$1, abbr=$2, icon=$3, color=$4, category=$5,
     description=$6, analogy=$7, concepts=$8, connects=$9 WHERE id=$10 RETURNING *`,
    [name, abbr, icon, color, category, description, analogy,
     JSON.stringify(concepts || []), JSON.stringify(connects || []), id]
  );
  res.json(result.rows[0]);
});

router.delete("/:id", async (req: Request, res: Response) => {
  await pool.query("DELETE FROM topics WHERE id = $1", [req.params.id]);
  res.json({ success: true });
});

export default router;