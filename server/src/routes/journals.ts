import { Router, Request, Response } from "express";
import pool from "../db";
import crypto from "crypto";

const router = Router();

function hashValue(val: string): string {
  return crypto
    .createHash("sha256")
    .update(val.trim().toLowerCase())
    .digest("hex");
}

// ── Config (setup / verify) ──────────────────────────────────────────────────

// Check if journal has been configured
router.get("/config/status", async (_req: Request, res: Response) => {
  const result = await pool.query("SELECT id FROM journal_config LIMIT 1");
  res.json({ configured: result.rows.length > 0 });
});

// First-time setup
router.post("/config/setup", async (req: Request, res: Response) => {
  const existing = await pool.query("SELECT id FROM journal_config LIMIT 1");
  if (existing.rows.length > 0) {
    return res.status(400).json({ error: "Already configured" });
  }
  const { password, answer, number } = req.body;
  if (!password || !answer || !number) {
    return res.status(400).json({ error: "Missing fields" });
  }
  const hash = hashValue(password + answer + String(number));
  await pool.query("INSERT INTO journal_config (hash) VALUES ($1)", [hash]);
  res.json({ success: true });
});

// Verify gate credentials
router.post("/config/verify", async (req: Request, res: Response) => {
  const { password, answer, number } = req.body;
  if (!password || !answer || !number) {
    return res.status(400).json({ error: "Missing fields" });
  }
  const result = await pool.query("SELECT hash FROM journal_config LIMIT 1");
  if (result.rows.length === 0) {
    return res.status(404).json({ error: "Not configured" });
  }
  const hash = hashValue(password + answer + String(number));
  const match = hash === result.rows[0].hash;
  res.json({ success: match });
});

// ── Journals CRUD ────────────────────────────────────────────────────────────

// Get all journals (no content, for list view)
router.get("/", async (_req: Request, res: Response) => {
  const result = await pool.query(
    `SELECT id, name, theme, created_at, updated_at FROM journals ORDER BY updated_at DESC`,
  );
  res.json(result.rows);
});

// Get single journal with full content
router.get("/:id", async (req: Request, res: Response) => {
  const result = await pool.query(
    `SELECT id, name, content, theme, created_at, updated_at FROM journals WHERE id = $1`,
    [req.params.id],
  );
  if (result.rows.length === 0)
    return res.status(404).json({ error: "Not found" });
  res.json(result.rows[0]);
});

// Create journal
router.post("/", async (req: Request, res: Response) => {
  const { name, theme } = req.body;
  const result = await pool.query(
    `INSERT INTO journals (name, content, theme)
     VALUES ($1, $2, $3)
     RETURNING id, name, content, theme, created_at, updated_at`,
    [
      name || "Untitled",
      JSON.stringify({ type: "doc", content: [] }),
      JSON.stringify(theme || defaultTheme()),
    ],
  );
  res.json(result.rows[0]);
});

// Save content (autosave)
router.put("/:id", async (req: Request, res: Response) => {
  const { content } = req.body;
  const result = await pool.query(
    `UPDATE journals SET content = $1, updated_at = NOW()
     WHERE id = $2
     RETURNING id, name, theme, updated_at`,
    [JSON.stringify(content), req.params.id],
  );
  res.json(result.rows[0]);
});

// Update theme
router.patch("/:id/theme", async (req: Request, res: Response) => {
  const { theme } = req.body;
  const result = await pool.query(
    `UPDATE journals SET theme = $1, updated_at = NOW()
     WHERE id = $2
     RETURNING id, name, theme, updated_at`,
    [JSON.stringify(theme), req.params.id],
  );
  res.json(result.rows[0]);
});

// Rename journal
router.patch("/:id", async (req: Request, res: Response) => {
  const { name } = req.body;
  const result = await pool.query(
    `UPDATE journals SET name = $1, updated_at = NOW()
     WHERE id = $2
     RETURNING id, name, theme, updated_at`,
    [name, req.params.id],
  );
  res.json(result.rows[0]);
});

// Delete journal
router.delete("/:id", async (req: Request, res: Response) => {
  await pool.query("DELETE FROM journals WHERE id = $1", [req.params.id]);
  res.json({ success: true });
});

function defaultTheme() {
  return {
    bg: "#ffffff",
    font: "Georgia, serif",
    textColor: "#1a1a1a",
  };
}

export default router;
