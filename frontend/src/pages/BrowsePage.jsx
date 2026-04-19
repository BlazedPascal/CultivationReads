import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../utils/api.js';
import NovelCard from '../components/NovelCard.jsx';
import GenreFilter from '../components/GenreFilter.jsx';
import Dropdown from '../components/Dropdown.jsx';

const SORT_OPTIONS = [
  { value: 'updated', label: 'Recently Updated' },
  { value: 'views',   label: 'Most Viewed' },
  { value: 'chapters',label: 'Most Chapters' },
  { value: 'newest',  label: 'Newest' },
];

const STATUS_OPTIONS = [
  { value: '',          label: 'All Statuses' },
  { value: 'ongoing',   label: 'Ongoing' },
  { value: 'completed', label: 'Completed' },
  { value: 'hiatus',    label: 'Hiatus' },
];

export default function BrowsePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [novels, setNovels] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const genre  = searchParams.get('genre') || '';
  const sort   = searchParams.get('sort')   || 'updated';
  const status = searchParams.get('status') || '';
  const page   = parseInt(searchParams.get('page') || '1');
  const LIMIT  = 20;

  const setParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value); else next.delete(key);
    if (key !== 'page') next.delete('page');
    setSearchParams(next);
  };

  useEffect(() => {
    setLoading(true);
    const params = { sort, limit: LIMIT, page };
    if (genre)  params.genre  = genre;
    if (status) params.status = status;
    api.getNovels(params)
      .then((d) => { setNovels(d.novels); setTotal(d.total); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [genre, sort, status, page]);

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <main className="browse-page">
      <div className="browse-header">
        <h1 className="browse-title">Browse Novels</h1>
        <span className="browse-count">{total} novels</span>
      </div>

      <div className="browse-filters">
        <GenreFilter selected={genre} onChange={(g) => setParam('genre', g)} />
        <div className="browse-controls">
          <Dropdown value={sort}   onChange={(v) => setParam('sort', v)}   options={SORT_OPTIONS} />
          <Dropdown value={status} onChange={(v) => setParam('status', v)} options={STATUS_OPTIONS} />
        </div>
      </div>

      {loading ? (
        <div className="loading-spinner" />
      ) : novels.length === 0 ? (
        <div className="empty-state"><p>No novels found.</p></div>
      ) : (
        <>
          <div className="novel-grid">
            {novels.map((n) => <NovelCard key={n.id} novel={n} />)}
          </div>
          {totalPages > 1 && (
            <div className="pagination">
              <button disabled={page === 1} onClick={() => setParam('page', String(page - 1))} className="page-btn">← Prev</button>
              <span className="page-info">Page {page} / {totalPages}</span>
              <button disabled={page === totalPages} onClick={() => setParam('page', String(page + 1))} className="page-btn">Next →</button>
            </div>
          )}
        </>
      )}
    </main>
  );
}
