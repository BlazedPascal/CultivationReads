import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api.js';

export default function SearchBar({ autoFocus = false }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [searched, setSearched] = useState(false);
  const timerRef = useRef(null);
  const wrapRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    clearTimeout(timerRef.current);
    if (!query.trim()) { setResults([]); setOpen(false); setSearched(false); return; }
    timerRef.current = setTimeout(async () => {
      try {
        const data = await api.search(query);
        setResults(data.novels || []);
        setSearched(true);
        setOpen(true);
      } catch {
        setResults([]);
        setSearched(true);
        setOpen(true);
      }
    }, 350);
    return () => clearTimeout(timerRef.current);
  }, [query]);

  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = (slug) => { setOpen(false); setQuery(''); navigate(`/novels/${slug}`); };
  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) navigate(`/novels?q=${encodeURIComponent(query.trim())}`);
    setOpen(false);
  };

  const showDropdown = open && query.trim();

  return (
    <div className="search-bar-wrap" ref={wrapRef}>
      <form onSubmit={handleSubmit} className="search-form">
        <input
          className="search-input"
          type="text"
          placeholder="Search novels…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.trim() && setOpen(true)}
          autoFocus={autoFocus}
        />
        <button type="submit" className="search-btn" aria-label="Search">⌕</button>
      </form>

      {showDropdown && (
        <ul className="search-dropdown">
          {results.length > 0 ? (
            results.map((n) => (
              <li key={n.id} className="search-dropdown-item" onMouseDown={() => handleSelect(n.slug)}>
                {n.cover_url && <img src={n.cover_url} alt="" className="search-cover" />}
                <div>
                  <div className="search-item-title">{n.title}</div>
                  <div className="search-item-meta">{n.translated_chapters} chapters · {n.status}</div>
                </div>
              </li>
            ))
          ) : searched ? (
            <li className="search-no-results">No results for "{query}"</li>
          ) : null}
        </ul>
      )}
    </div>
  );
}
