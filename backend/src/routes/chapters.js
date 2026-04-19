import { Router } from 'express';
import slugify from 'slugify';
import pool from '../db/pool.js';
import adminAuth from '../middleware/adminAuth.js';

const router = Router();

const makeSlug = (num, title) => {
  const base = title ? `${num}-${title}` : `chapter-${num}`;
  return slugify(base, { lower: true, strict: true, trim: true });
};

// GET /api/chapters/:novelSlug — paginated chapter list
router.get('/:novelSlug', async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(200, parseInt(req.query.limit) || 50);
    const offset = (page - 1) * limit;

    const { rows: novelRows } = await pool.query(
      `SELECT id FROM novels WHERE slug = $1`,
      [req.params.novelSlug]
    );
    if (!novelRows.length) return res.status(404).json({ error: 'Novel not found' });
    const novelId = novelRows[0].id;

    const { rows } = await pool.query(
      `SELECT id, chapter_number, slug, title, word_count, is_translated, created_at
       FROM chapters
       WHERE novel_id = $1 AND is_translated = TRUE
       ORDER BY chapter_number ASC
       LIMIT $2 OFFSET $3`,
      [novelId, limit, offset]
    );

    const { rows: countRows } = await pool.query(
      `SELECT COUNT(*) FROM chapters WHERE novel_id = $1 AND is_translated = TRUE`,
      [novelId]
    );

    res.json({ chapters: rows, total: parseInt(countRows[0].count), page, limit });
  } catch (err) {
    next(err);
  }
});

// GET /api/chapters/:novelSlug/:chapterSlug — read chapter with prev/next
router.get('/:novelSlug/:chapterSlug', async (req, res, next) => {
  try {
    const { novelSlug, chapterSlug } = req.params;

    const { rows: novelRows } = await pool.query(
      `SELECT id, title, slug FROM novels WHERE slug = $1`,
      [novelSlug]
    );
    if (!novelRows.length) return res.status(404).json({ error: 'Novel not found' });
    const novel = novelRows[0];

    const { rows } = await pool.query(
      `SELECT id, chapter_number, slug, title, content_en, word_count, is_translated, created_at
       FROM chapters WHERE novel_id = $1 AND slug = $2`,
      [novel.id, chapterSlug]
    );
    if (!rows.length) return res.status(404).json({ error: 'Chapter not found' });
    const chapter = rows[0];

    const { rows: prevRows } = await pool.query(
      `SELECT slug, chapter_number, title FROM chapters
       WHERE novel_id = $1 AND chapter_number < $2 AND is_translated = TRUE
       ORDER BY chapter_number DESC LIMIT 1`,
      [novel.id, chapter.chapter_number]
    );

    const { rows: nextRows } = await pool.query(
      `SELECT slug, chapter_number, title FROM chapters
       WHERE novel_id = $1 AND chapter_number > $2 AND is_translated = TRUE
       ORDER BY chapter_number ASC LIMIT 1`,
      [novel.id, chapter.chapter_number]
    );

    res.json({
      novel: { id: novel.id, title: novel.title, slug: novel.slug },
      chapter,
      prev: prevRows[0] || null,
      next: nextRows[0] || null,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/chapters/:novelSlug — upsert chapter from pipeline
router.post('/:novelSlug', adminAuth, async (req, res, next) => {
  try {
    const { chapter_number, title, content_en, content_raw } = req.body;
    if (!chapter_number || !content_en) {
      return res.status(400).json({ error: 'chapter_number and content_en are required' });
    }

    const { rows: novelRows } = await pool.query(
      `SELECT id FROM novels WHERE slug = $1`,
      [req.params.novelSlug]
    );
    if (!novelRows.length) return res.status(404).json({ error: 'Novel not found' });
    const novelId = novelRows[0].id;

    const slug = makeSlug(chapter_number, title);
    const wordCount = content_en.trim().split(/\s+/).length;

    const { rows } = await pool.query(
      `INSERT INTO chapters (novel_id, chapter_number, slug, title, content_en, content_raw, word_count, is_translated)
       VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE)
       ON CONFLICT (novel_id, chapter_number) DO UPDATE SET
         slug = EXCLUDED.slug,
         title = EXCLUDED.title,
         content_en = EXCLUDED.content_en,
         content_raw = COALESCE(EXCLUDED.content_raw, chapters.content_raw),
         word_count = EXCLUDED.word_count,
         is_translated = TRUE,
         updated_at = NOW()
       RETURNING id, chapter_number, slug, title, word_count, is_translated`,
      [novelId, chapter_number, slug, title || null, content_en, content_raw || null, wordCount]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
});

export default router;
