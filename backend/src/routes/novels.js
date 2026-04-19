import { Router } from 'express';
import slugify from 'slugify';
import pool from '../db/pool.js';
import adminAuth from '../middleware/adminAuth.js';

const router = Router();

const makeSlug = (title) =>
  slugify(title, { lower: true, strict: true, trim: true });

// GET /api/novels — paginated list, filterable by genre/status
router.get('/', async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 20);
    const offset = (page - 1) * limit;
    const { genre, status, sort } = req.query;

    const conditions = [];
    const params = [];

    if (genre) {
      params.push(genre);
      conditions.push(`$${params.length} = ANY(genres)`);
    }
    if (status) {
      params.push(status);
      conditions.push(`status = $${params.length}`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const orderMap = {
      updated: 'updated_at DESC',
      views: 'views DESC',
      chapters: 'translated_chapters DESC',
      newest: 'created_at DESC',
    };
    const order = orderMap[sort] || 'updated_at DESC';

    params.push(limit, offset);
    const { rows } = await pool.query(
      `SELECT id, title, slug, author, cover_url, description, genres, status,
              total_chapters, translated_chapters, views, updated_at
       FROM novels ${where}
       ORDER BY ${order}
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    const countParams = params.slice(0, params.length - 2);
    const { rows: countRows } = await pool.query(
      `SELECT COUNT(*) FROM novels ${where}`,
      countParams
    );

    res.json({
      novels: rows,
      total: parseInt(countRows[0].count),
      page,
      limit,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/novels/:slug — single novel + recent chapters
router.get('/:slug', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM novels WHERE slug = $1`,
      [req.params.slug]
    );
    if (!rows.length) return res.status(404).json({ error: 'Novel not found' });

    const novel = rows[0];

    // Increment views and track daily
    await pool.query(
      `UPDATE novels SET views = views + 1 WHERE id = $1`,
      [novel.id]
    );
    await pool.query(
      `INSERT INTO novel_views_daily (novel_id, view_date, view_count)
       VALUES ($1, CURRENT_DATE, 1)
       ON CONFLICT (novel_id, view_date) DO UPDATE SET view_count = novel_views_daily.view_count + 1`,
      [novel.id]
    );

    const { rows: recentChapters } = await pool.query(
      `SELECT id, chapter_number, slug, title, word_count, is_translated, created_at
       FROM chapters WHERE novel_id = $1 AND is_translated = TRUE
       ORDER BY chapter_number DESC LIMIT 10`,
      [novel.id]
    );

    res.json({ ...novel, recent_chapters: recentChapters });
  } catch (err) {
    next(err);
  }
});

// POST /api/novels — create novel
router.post('/', adminAuth, async (req, res, next) => {
  try {
    const { title, title_cn, author, cover_url, description, genres, status, total_chapters } = req.body;
    if (!title) return res.status(400).json({ error: 'title is required' });

    const slug = makeSlug(title);

    const { rows } = await pool.query(
      `INSERT INTO novels (title, title_cn, slug, author, cover_url, description, genres, status, total_chapters)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING *`,
      [title, title_cn, slug, author, cover_url, description, genres || [], status || 'ongoing', total_chapters || 0]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Slug already exists' });
    next(err);
  }
});

// PATCH /api/novels/:id — update novel metadata
router.patch('/:id', adminAuth, async (req, res, next) => {
  try {
    const allowed = ['title', 'title_cn', 'author', 'cover_url', 'description', 'genres', 'status', 'total_chapters'];
    const updates = Object.entries(req.body).filter(([k]) => allowed.includes(k));
    if (!updates.length) return res.status(400).json({ error: 'No valid fields to update' });

    const setClauses = updates.map(([k], i) => `${k} = $${i + 2}`).join(', ');
    const values = [req.params.id, ...updates.map(([, v]) => v)];

    const { rows } = await pool.query(
      `UPDATE novels SET ${setClauses} WHERE id = $1 RETURNING *`,
      values
    );
    if (!rows.length) return res.status(404).json({ error: 'Novel not found' });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

export default router;
