import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../utils/api.js';

export default function ChapterList({ novelSlug, lastReadSlug }) {
  const [chapters, setChapters] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const LIMIT = 100;

  useEffect(() => {
    setLoading(true);
    api.getChapters(novelSlug, { page, limit: LIMIT })
      .then((data) => { setChapters(data.chapters); setTotal(data.total); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [novelSlug, page]);

  const filtered = search
    ? chapters.filter(
        (c) =>
          String(c.chapter_number).includes(search) ||
          c.title?.toLowerCase().includes(search.toLowerCase())
      )
    : chapters;

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="chapter-list">
      <div className="chapter-list-header">
        <h2 className="chapter-list-title">Chapters <span className="chapter-count">({total})</span></h2>
        <input
          className="chapter-search"
          placeholder="Filter chapters…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="loading-spinner" />
      ) : (
        <ul className="chapter-items">
          {filtered.map((ch) => (
            <li key={ch.id} className={`chapter-item${ch.slug === lastReadSlug ? ' last-read' : ''}`}>
              <Link to={`/novels/${novelSlug}/${ch.slug}`} className="chapter-link">
                <span className="chapter-num">Ch. {ch.chapter_number}</span>
                <span className="chapter-title-text">{ch.title || `Chapter ${ch.chapter_number}`}</span>
                {ch.slug === lastReadSlug && <span className="last-read-badge">Last Read</span>}
              </Link>
            </li>
          ))}
        </ul>
      )}

      {totalPages > 1 && (
        <div className="pagination">
          <button disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="page-btn">← Prev</button>
          <span className="page-info">Page {page} / {totalPages}</span>
          <button disabled={page === totalPages} onClick={() => setPage((p) => p + 1)} className="page-btn">Next →</button>
        </div>
      )}
    </div>
  );
}
