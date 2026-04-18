import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api.js';

export default function SearchBar({ autoFocus = false }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState({});
  const timerRef = useRef(null);
  const wrapRef = useRef(null);
  const navigate = useNavigate();

  // Recalculate dropdown position whenever it opens or window resizes
  useEffect(() => {
    if (!open || !wrapRef.current) return;
    const update = () => {
      const rect = wrapRef.current.getBoundingClientRect();
      setDropdownStyle({
        position: 'fixed',
        top: rect.bottom + 6,
        left: rect.left,
        width: rect.width,
        zIndex: 9999,
      });
    };
    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [open]);

  useEffect(() => {
    clearTimeout(timerRef.current);
    if (!query.trim()) { setResults([]); setOpen(false); return; }
    timerRef.current = setTimeout(async () => {
      try {
        const data = await api.search(query);
        setResults(data.novels || []);
        setOpen(true);
      } catch {
        setResults([]);
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

  const handleSelect = (slug) => {
    setOpen(false);
    setQuery('');
    navigate(`/novels/${slug}`);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) navigate(`/novels?q=${encodeURIComponent(query.trim())}`);
    setOpen(false);
  };

  return (
    <div className="search-bar-wrap" ref={wrapRef}>
      <form onSubmit={handleSubmit} className="search-form">
        <input
          className="search-input"
          type="text"
          placeholder="Search novels…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length && setOpen(true)}
          autoFocus={autoFocus}
        />
        <button type="submit" className="search-btn" aria-label="Search">⌕</button>
      </form>

      {open && results.length > 0 && createPortal(
        <ul className="search-dropdown" style={dropdownStyle}>
          {results.map((n) => (
            <li key={n.id} className="search-dropdown-item" onMouseDown={() => handleSelect(n.slug)}>
              {n.cover_url && <img src={n.cover_url} alt="" className="search-cover" />}
              <div>
                <div className="search-item-title">{n.title}</div>
                <div className="search-item-meta">{n.translated_chapters} chapters · {n.status}</div>
              </div>
            </li>
          ))}
        </ul>,
        document.body
      )}
    </div>
  );
}
