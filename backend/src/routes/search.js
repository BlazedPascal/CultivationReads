import { Router } from 'express';
import pool from '../db/pool.js';

const router = Router();

// GET /api/search?q=... — full-text search on novels
router.get('/', async (req, res, next) => {
  try {
    const q = (req.query.q || '').trim();
    if (!q) return res.json({ novels: [], total: 0 });

    const limit = Math.min(20, parseInt(req.query.limit) || 10);

    const { rows } = await pool.query(
      `SELECT id, title, slug, author, cover_url, description, genres, status,
              translated_chapters, updated_at,
              ts_rank(to_tsvector('english', coalesce(title,'') || ' ' || coalesce(description,'')),
                      plainto_tsquery('english', $1)) AS rank
       FROM novels
       WHERE to_tsvector('english', coalesce(title,'') || ' ' || coalesce(description,''))
             @@ plainto_tsquery('english', $1)
          OR title ILIKE $2
       ORDER BY rank DESC, updated_at DESC
       LIMIT $3`,
      [q, `%${q}%`, limit]
    );

    res.json({ novels: rows, total: rows.length });
  } catch (err) {
    next(err);
  }
});

export default router;
