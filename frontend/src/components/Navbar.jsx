import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import SearchBar from './SearchBar.jsx';

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

  useEffect(() => {
    setMenuOpen(false);
    setSearchOpen(false);
  }, [location]);

  useEffect(() => {
    const handler = () => setBookmarkCount(getBookmarkCount());
    window.addEventListener('cr_bookmarks_changed', handler);
    return () => window.removeEventListener('cr_bookmarks_changed', handler);
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
        </div>

        <div className="navbar-mobile-actions">
          <button className="mobile-icon-btn" onClick={() => setSearchOpen((o) => !o)} aria-label="Search">
            ⌕
          </button>
          <button className="mobile-icon-btn" onClick={() => setMenuOpen((o) => !o)} aria-label="Menu">
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {searchOpen && (
        <div className="navbar-mobile-search">
          <SearchBar autoFocus />
        </div>
      )}

      {menuOpen && (
        <div className="navbar-mobile-menu">
          <Link to="/novels" className="mobile-menu-link">Browse</Link>
          <Link to="/novels" className="mobile-menu-link">
            Bookmarks {bookmarkCount > 0 && <span className="bookmark-badge">{bookmarkCount}</span>}
          </Link>
        </div>
      )}
    </nav>
  );
}
