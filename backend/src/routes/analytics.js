import { Router } from 'express';
import pool from '../db/pool.js';

const router = Router();

// GET /api/analytics/overview — counts
router.get('/overview', async (req, res, next) => {
  try {
    const [novels, chapters, queue] = await Promise.all([
      pool.query(`SELECT COUNT(*) FROM novels`),
      pool.query(`SELECT COUNT(*) FROM chapters WHERE is_translated = TRUE`),
      pool.query(`SELECT status, COUNT(*) as count FROM translation_queue GROUP BY status`),
    ]);

    const queueCounts = { pending: 0, processing: 0, done: 0, failed: 0 };
    queue.rows.forEach((r) => { queueCounts[r.status] = parseInt(r.count); });

    res.json({
      novels: parseInt(novels.rows[0].count),
      translated_chapters: parseInt(chapters.rows[0].count),
      queue: queueCounts,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/analytics/top-novels — top novels by views (last 7 days + all time)
router.get('/top-novels', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT n.id, n.title, n.slug, n.cover_url, n.views, n.translated_chapters,
              COALESCE(SUM(vd.view_count), 0) AS views_7d
       FROM novels n
       LEFT JOIN novel_views_daily vd
         ON vd.novel_id = n.id AND vd.view_date >= CURRENT_DATE - INTERVAL '7 days'
       GROUP BY n.id
       ORDER BY views_7d DESC, n.views DESC
       LIMIT 10`
    );
    res.json({ novels: rows });
  } catch (err) {
    next(err);
  }
});

export default router;
