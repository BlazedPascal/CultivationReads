import { Link } from 'react-router-dom';

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const d = Math.floor(diff / 86400000);
  if (d === 0) return 'today';
  if (d === 1) return 'yesterday';
  if (d < 30) return `${d}d ago`;
  if (d < 365) return `${Math.floor(d / 30)}mo ago`;
  return `${Math.floor(d / 365)}y ago`;
}

export default function NovelCard({ novel }) {
  const { title, slug, cover_url, translated_chapters, genres, status, updated_at } = novel;

  return (
    <Link to={`/novels/${slug}`} className="novel-card">
      <div className="novel-card-cover">
        {cover_url
          ? <img src={cover_url} alt={title} loading="lazy" />
          : <div className="novel-card-cover-placeholder"><span>📖</span></div>
        }
        <span className={`status-badge status-${status}`}>{status}</span>
      </div>
      <div className="novel-card-body">
        <h3 className="novel-card-title">{title}</h3>
        <div className="novel-card-meta">
          <span>{translated_chapters} ch</span>
          <span className="novel-card-updated">{timeAgo(updated_at)}</span>
        </div>
        {genres?.length > 0 && (
          <div className="genre-badges">
            {genres.slice(0, 3).map((g) => <span key={g} className="genre-badge">{g}</span>)}
          </div>
        )}
      </div>
    </Link>
  );
}
