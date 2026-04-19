import { useState } from 'react';
import AdminDashboard from '../components/AdminDashboard.jsx';
import { api, setAdminToken, clearAdminToken } from '../utils/api.js';

const TOKEN_KEY = 'cr_admin_token';

export default function AdminPage() {
  const [token, setToken] = useState(() => {
    const saved = sessionStorage.getItem(TOKEN_KEY) || '';
    if (saved) setAdminToken(saved);
    return saved;
  });
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      setAdminToken(input);
      await api.getAnalyticsOverview();
      sessionStorage.setItem(TOKEN_KEY, input);
      setToken(input);
    } catch (err) {
      clearAdminToken();
      setError(err.status === 401 ? 'Wrong password.' : 'Connection error.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem(TOKEN_KEY);
    clearAdminToken();
    setToken('');
    setInput('');
  };

  if (!token) {
    return (
      <main className="admin-page">
        <div className="admin-login">
          <div className="admin-login-icon">⚔</div>
          <h1 className="admin-login-title">Admin Access</h1>
          <form onSubmit={handleLogin} className="admin-login-form">
            <input
              type="password"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Password"
              autoFocus
              required
            />
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Checking…' : 'Enter'}
            </button>
          </form>
          {error && <p className="admin-msg error">{error}</p>}
        </div>
      </main>
    );
  }

  return (
    <main className="admin-page">
      <AdminDashboard onLogout={handleLogout} />
    </main>
  );
}
