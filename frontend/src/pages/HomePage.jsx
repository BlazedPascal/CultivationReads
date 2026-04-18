import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../utils/api.js';
import NovelCard from '../components/NovelCard.jsx';

export default function HomePage() {
  const [trending, setTrending] = useState([]);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getTopNovels(),
      api.getNovels({ sort: 'updated', limit: 12 }),
    ]).then(([top, rec]) => {
      setTrending(top.novels.slice(0, 6));
      setRecent(rec.novels);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  return (
    <main className="home-page">
      <section className="hero">
        <div className="hero-inner">
          <h1 className="hero-title">CultivationReads</h1>
          <p className="hero-subtitle">
            Machine-translated Chinese light novels — cultivation, xianxia, wuxia and beyond.
          </p>
          <Link to="/novels" className="btn-primary hero-cta">Browse Library</Link>
        </div>
      </section>

      {loading ? (
        <div className="loading-spinner" />
      ) : (
        <>
          {trending.length > 0 && (
            <section className="home-section">
              <h2 className="section-heading">Trending This Week</h2>
              <div className="novel-grid">
                {trending.map((n) => <NovelCard key={n.id} novel={n} />)}
              </div>
            </section>
          )}

          {recent.length > 0 && (
            <section className="home-section">
              <div className="section-heading-row">
                <h2 className="section-heading">Recently Updated</h2>
                <Link to="/novels" className="see-all-link">See all →</Link>
              </div>
              <div className="novel-grid">
                {recent.map((n) => <NovelCard key={n.id} novel={n} />)}
              </div>
            </section>
          )}

          {trending.length === 0 && recent.length === 0 && (
            <div className="empty-state">
              <p>No novels yet. Check back soon.</p>
            </div>
          )}
        </>
      )}
    </main>
  );
}
