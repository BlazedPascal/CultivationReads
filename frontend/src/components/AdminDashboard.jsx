import { useState, useEffect } from 'react';
import { api } from '../utils/api.js';

export default function AdminDashboard() {
  const [overview, setOverview] = useState(null);
  const [topNovels, setTopNovels] = useState([]);
  const [form, setForm] = useState({ title: '', title_cn: '', author: '', description: '', genres: '', status: 'ongoing', total_chapters: '' });
  const [msg, setMsg] = useState('');

  const load = () => {
    api.getAnalyticsOverview().then(setOverview).catch(console.error);
    api.getTopNovels().then((d) => setTopNovels(d.novels)).catch(console.error);
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        genres: form.genres.split(',').map((g) => g.trim()).filter(Boolean),
        total_chapters: parseInt(form.total_chapters) || 0,
      };
      await api.createNovel(payload);
      setMsg('Novel created successfully.');
      setForm({ title: '', title_cn: '', author: '', description: '', genres: '', status: 'ongoing', total_chapters: '' });
      load();
    } catch (err) {
      setMsg(`Error: ${err.message}`);
    }
  };

  return (
    <div className="admin-dashboard">
      <h1 className="admin-title">Admin Dashboard</h1>

      {overview && (
        <div className="stats-grid">
          <div className="stat-card"><div className="stat-value">{overview.novels}</div><div className="stat-label">Novels</div></div>
          <div className="stat-card"><div className="stat-value">{overview.translated_chapters}</div><div className="stat-label">Translated Chapters</div></div>
          <div className="stat-card"><div className="stat-value">{overview.queue.pending}</div><div className="stat-label">Queue: Pending</div></div>
          <div className="stat-card"><div className="stat-value">{overview.queue.processing}</div><div className="stat-label">Queue: Processing</div></div>
          <div className="stat-card"><div className="stat-value">{overview.queue.done}</div><div className="stat-label">Queue: Done</div></div>
          <div className="stat-card"><div className="stat-value">{overview.queue.failed}</div><div className="stat-label">Queue: Failed</div></div>
        </div>
      )}

      <section className="admin-section">
        <h2>Add Novel</h2>
        {msg && <p className={`admin-msg${msg.startsWith('Error') ? ' error' : ''}`}>{msg}</p>}
        <form onSubmit={handleCreate} className="admin-form">
          <div className="form-row">
            <label>Title (EN) *<input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></label>
            <label>Title (CN)<input value={form.title_cn} onChange={(e) => setForm({ ...form, title_cn: e.target.value })} /></label>
          </div>
          <div className="form-row">
            <label>Author<input value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} /></label>
            <label>Status
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="ongoing">Ongoing</option>
                <option value="completed">Completed</option>
                <option value="hiatus">Hiatus</option>
              </select>
            </label>
          </div>
          <label>Description<textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} /></label>
          <div className="form-row">
            <label>Genres (comma-separated)<input value={form.genres} onChange={(e) => setForm({ ...form, genres: e.target.value })} placeholder="Cultivation, Action, Fantasy" /></label>
            <label>Total Chapters<input type="number" value={form.total_chapters} onChange={(e) => setForm({ ...form, total_chapters: e.target.value })} /></label>
          </div>
          <button type="submit" className="btn-primary">Create Novel</button>
        </form>
      </section>

      <section className="admin-section">
        <h2>Top Novels (7-day views)</h2>
        <div className="admin-table-wrap"><table className="admin-table">
          <thead><tr><th>Title</th><th>Views (7d)</th><th>All-time</th><th>Chapters</th></tr></thead>
          <tbody>
            {topNovels.map((n) => (
              <tr key={n.id}>
                <td>{n.title}</td>
                <td>{n.views_7d}</td>
                <td>{n.views}</td>
                <td>{n.translated_chapters}</td>
              </tr>
            ))}
          </tbody>
        </table></div>
      </section>
    </div>
  );
}
