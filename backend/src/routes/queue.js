import { Router } from 'express';
import pool from '../db/pool.js';
import adminAuth from '../middleware/adminAuth.js';

const router = Router();
router.use(adminAuth);

// POST /api/queue — add item(s) to translation queue
router.post('/', async (req, res, next) => {
  try {
    const { novel_id, novel_slug, chapter_number, raw_text, priority } = req.body;
    if (!novel_id || !novel_slug || !chapter_number || !raw_text) {
      return res.status(400).json({ error: 'novel_id, novel_slug, chapter_number, raw_text required' });
    }

    const { rows } = await pool.query(
      `INSERT INTO translation_queue (novel_id, novel_slug, chapter_number, raw_text, priority)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT DO NOTHING
       RETURNING *`,
      [novel_id, novel_slug, chapter_number, raw_text, priority ?? 5]
    );

    if (!rows.length) {
      return res.status(409).json({ error: 'Item already queued' });
    }
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// GET /api/queue/next — atomically pop next pending item (FOR UPDATE SKIP LOCKED)
router.get('/next', async (req, res, next) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows } = await client.query(
      `SELECT * FROM translation_queue
       WHERE status = 'pending'
       ORDER BY priority DESC, created_at ASC
       LIMIT 1
       FOR UPDATE SKIP LOCKED`
    );

    if (!rows.length) {
      await client.query('COMMIT');
      return res.json({ item: null });
    }

    const item = rows[0];
    await client.query(
      `UPDATE translation_queue SET status = 'processing', attempts = attempts + 1 WHERE id = $1`,
      [item.id]
    );

    await client.query('COMMIT');
    res.json({ item: { ...item, status: 'processing' } });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
});

// GET /api/queue/status — queue overview
router.get('/status', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT status, COUNT(*) as count FROM translation_queue GROUP BY status`
    );
    const counts = { pending: 0, processing: 0, done: 0, failed: 0 };
    rows.forEach((r) => { counts[r.status] = parseInt(r.count); });
    res.json(counts);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/queue/:id — mark done or failed
router.patch('/:id', async (req, res, next) => {
  try {
    const { status, error_message } = req.body;
    if (!['done', 'failed', 'pending'].includes(status)) {
      return res.status(400).json({ error: 'status must be done, failed, or pending' });
    }

    const { rows } = await pool.query(
      `UPDATE translation_queue
       SET status = $1, error_message = $2
       WHERE id = $3
       RETURNING *`,
      [status, error_message || null, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Queue item not found' });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

export default router;
