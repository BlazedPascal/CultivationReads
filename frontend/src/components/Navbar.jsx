import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import SearchBar from './SearchBar.jsx';

function getBookmarkCount() {
  try {
    const bm = JSON.parse(localStorage.getItem('cr_bookmarks') || '[]');
    return bm.length;
  } catch {
    return 0;
  }
}

export default function Navbar() {
  const [bookmarkCount, setBookmarkCount] = useState(getBookmarkCount);

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
          <Link to="/admin" className="nav-link nav-link-admin">Admin</Link>
        </div>
      </div>
    </nav>
  );
}
