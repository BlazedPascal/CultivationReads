import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../utils/api.js';
import ChapterList from '../components/ChapterList.jsx';
import { useReadingProgress } from '../hooks/useReadingProgress.js';

function toggleBookmark(slug) {
  const bm = JSON.parse(localStorage.getItem('cr_bookmarks') || '[]');
  const idx = bm.indexOf(slug);
  if (idx === -1) bm.push(slug); else bm.splice(idx, 1);
  localStorage.setItem('cr_bookmarks', JSON.stringify(bm));
  window.dispatchEvent(new Event('cr_bookmarks_changed'));
  return idx === -1;
}

function isBookmarked(slug) {
  const bm = JSON.parse(localStorage.getItem('cr_bookmarks') || '[]');
  return bm.includes(slug);
}

export default function NovelPage() {
  const { slug } = useParams();
  const [novel, setNovel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookmarked, setBookmarked] = useState(() => isBookmarked(slug));
  const { get: getProgress } = useReadingProgress(slug);
  const lastRead = getProgress();

  useEffect(() => {
    api.getNovel(slug)
      .then(setNovel)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [slug]);

  const handleBookmark = () => {
    const now = toggleBookmark(slug);
    setBookmarked(now);
  };

  if (loading) return <div className="loading-spinner" />;
  if (!novel) return <div className="error-page"><h1>Novel not found</h1><Link to="/novels">← Browse</Link></div>;

  return (
    <main className="novel-page">
      <title>{novel.title} | CultivationReads</title>

      <div className="novel-header">
        <div className="novel-cover-wrap">
          {novel.cover_url
            ? <img src={novel.cover_url} alt={novel.title} className="novel-cover" />
            : <div className="novel-cover novel-cover-placeholder"><span>📖</span></div>
          }
        </div>
        <div className="novel-meta">
          <h1 className="novel-title">{novel.title}</h1>
          {novel.title_cn && <p className="novel-title-cn">{novel.title_cn}</p>}
          {novel.author && <p className="novel-author">by {novel.author}</p>}
          <div className="novel-stats">
            <span className={`status-badge status-${novel.status}`}>{novel.status}</span>
            <span>{novel.translated_chapters} / {novel.total_chapters || '?'} chapters</span>
            <span>{(novel.views || 0).toLocaleString()} views</span>
          </div>
          {novel.genres?.length > 0 && (
            <div className="genre-badges">
              {novel.genres.map((g) => <span key={g} className="genre-badge">{g}</span>)}
            </div>
          )}
          {novel.description && <p className="novel-description">{novel.description}</p>}
          <div className="novel-actions">
            {lastRead ? (
              <Link to={`/novels/${slug}/${lastRead}`} className="btn-primary">Continue Reading</Link>
            ) : novel.recent_chapters?.length > 0 ? (
              <Link to={`/novels/${slug}/${[...novel.recent_chapters].sort((a, b) => a.chapter_number - b.chapter_number)[0]?.slug}`} className="btn-primary">Start Reading</Link>
            ) : null}
            <button className={`btn-secondary${bookmarked ? ' bookmarked' : ''}`} onClick={handleBookmark}>
              {bookmarked ? '★ Bookmarked' : '☆ Bookmark'}
            </button>
          </div>
        </div>
      </div>

      <ChapterList novelSlug={slug} lastReadSlug={lastRead} />
    </main>
  );
}
