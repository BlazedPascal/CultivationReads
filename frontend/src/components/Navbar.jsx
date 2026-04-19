import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import SearchBar from './SearchBar.jsx';
import { useTheme } from '../hooks/useTheme.js';

function getBookmarkCount() {
  try {
    return JSON.parse(localStorage.getItem('cr_bookmarks') || '[]').length;
  } catch { return 0; }
}

export default function Navbar() {
  const [bookmarkCount, setBookmarkCount] = useState(getBookmarkCount);
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const searchRef = useRef(null);
  const menuRef = useRef(null);
  const { theme, toggle } = useTheme();

  useEffect(() => {
    setMenuOpen(false);
    setSearchOpen(false);
  }, [location]);

  useEffect(() => {
    const handler = () => setBookmarkCount(getBookmarkCount());
    window.addEventListener('cr_bookmarks_changed', handler);
    return () => window.removeEventListener('cr_bookmarks_changed', handler);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setSearchOpen(false);
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-logo">
          <span className="navbar-logo-icon">⚔</span>
          CultivationReads
        </Link>

        <div className="navbar-center">
          <SearchBar />
        </div>

        <div className="navbar-links">
          <Link to="/novels" className="nav-link">Browse</Link>
          <Link to="/novels" className="nav-link bookmarks-link">
            Bookmarks
            {bookmarkCount > 0 && <span className="bookmark-badge">{bookmarkCount}</span>}
          </Link>
          <button className="theme-toggle" onClick={toggle} aria-label="Toggle theme">
            {theme === 'dark' ? '☀' : '☾'}
          </button>
        </div>

        <div className="navbar-mobile-actions">
          <button className="theme-toggle" onClick={toggle} aria-label="Toggle theme">
            {theme === 'dark' ? '☀' : '☾'}
          </button>

          <div className="mobile-action-wrap" ref={searchRef}>
            <button
              className={`mobile-icon-btn${searchOpen ? ' active' : ''}`}
              onClick={() => { setSearchOpen((o) => !o); setMenuOpen(false); }}
              aria-label="Search"
            >⌕</button>
            {searchOpen && (
              <div className="mobile-dropdown mobile-search-dropdown">
                <SearchBar autoFocus />
              </div>
            )}
          </div>

          <div className="mobile-action-wrap" ref={menuRef}>
            <button
              className={`mobile-icon-btn${menuOpen ? ' active' : ''}`}
              onClick={() => { setMenuOpen((o) => !o); setSearchOpen(false); }}
              aria-label="Menu"
            >{menuOpen ? '✕' : '☰'}</button>
            {menuOpen && (
              <div className="mobile-dropdown mobile-menu-dropdown">
                <Link to="/novels" className="mobile-menu-link">Browse</Link>
                <Link to="/novels" className="mobile-menu-link">
                  Bookmarks {bookmarkCount > 0 && <span className="bookmark-badge">{bookmarkCount}</span>}
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
