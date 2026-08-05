import React, { useState, useEffect } from 'react';
import {
  adminLogin,
  getAllSessions,
  getSessionDetail,
  getHotelData,
  updateHotelData,
} from '../services/api';

// ─── Login form ───────────────────────────────────────────────────────────────

function LoginForm({ onLogin }) {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await adminLogin(credentials.username, credentials.password);
      localStorage.setItem('adminToken', data.token);
      onLogin();
    } catch (err) {
      setError(err.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="admin-login" onSubmit={handleSubmit} aria-label="Admin login">
      <h2>Admin Login</h2>
      {error && <p className="admin-error" role="alert">{error}</p>}
      <label htmlFor="admin-username">Username</label>
      <input
        id="admin-username"
        type="text"
        value={credentials.username}
        onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
        required
        autoComplete="username"
      />
      <label htmlFor="admin-password">Password</label>
      <input
        id="admin-password"
        type="password"
        value={credentials.password}
        onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
        required
        autoComplete="current-password"
      />
      <button type="submit" className="btn-primary" disabled={loading}>
        {loading ? 'Logging in…' : 'Login'}
      </button>
    </form>
  );
}

// ─── Sessions tab ─────────────────────────────────────────────────────────────

function SessionsTab() {
  const [sessions, setSessions] = useState([]);
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const data = await getAllSessions();
        setSessions(data.sessions);
        setTotal(data.sessions.length);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSelect = async (sessionId) => {
    setSelected(sessionId);
    try {
      const data = await getSessionDetail(sessionId);
      // backend returns { success, session: { sessionId, messages, userInfo, ... } }
      setDetail(data.session || data);
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <p className="admin-loading">Loading sessions…</p>;
  if (error) return <p className="admin-error">{error}</p>;

  return (
    <div className="admin-sessions">
      <h3>Chat Sessions ({total} total)</h3>
      <div className="sessions-layout">
        {/* Session list */}
        <ul className="session-list">
          {sessions.map((s) => (
            <li
              key={s.sessionId}
              className={`session-item ${selected === s.sessionId ? 'session-item--active' : ''}`}
              onClick={() => handleSelect(s.sessionId)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && handleSelect(s.sessionId)}
            >
              <strong>{s.userInfo?.name || 'Guest'}</strong>
              <span className="session-date">
                {new Date(s.updatedAt).toLocaleDateString()}
              </span>
              <span className="session-count">
                {s.metadata?.totalMessages ?? 0} msgs
              </span>
            </li>
          ))}
          {sessions.length === 0 && <li className="session-empty">No sessions yet.</li>}
        </ul>

        {/* Session detail */}
        {detail && (
          <div className="session-detail">
            <h4>Session: {detail.userInfo?.name || 'Guest'}</h4>
            <p className="session-meta">
              {new Date(detail.createdAt).toLocaleString()} · {detail.messages?.length ?? 0} messages
            </p>
            <div className="session-messages">
              {(detail.messages || []).map((m, i) => (
                <div key={i} className={`session-msg session-msg--${m.role}`}>
                  <strong>{m.role === 'user' ? '👤' : '🏨'}</strong> {m.content}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Hotel data tab ───────────────────────────────────────────────────────────

function HotelTab() {
  const [hotel, setHotel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const data = await getHotelData();
        setHotel(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await updateHotelData(hotel);
      setSuccess('Hotel data updated successfully.');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="admin-loading">Loading hotel data…</p>;
  if (!hotel) return <p className="admin-error">{error || 'No hotel data found.'}</p>;

  return (
    <div className="hotel-tab">
      <h3>Hotel Information</h3>
      {error && <p className="admin-error" role="alert">{error}</p>}
      {success && <p className="admin-success" role="status">{success}</p>}

      <div className="hotel-fields">
        {[
          { label: 'Hotel Name', key: 'name' },
          { label: 'Tagline', key: 'tagline' },
          { label: 'Check-in Time', key: 'checkIn' },
          { label: 'Check-out Time', key: 'checkOut' },
        ].map(({ label, key }) => (
          <div className="field-group" key={key}>
            <label htmlFor={`hotel-${key}`}>{label}</label>
            <input
              id={`hotel-${key}`}
              type="text"
              value={hotel[key] || ''}
              onChange={(e) => setHotel({ ...hotel, [key]: e.target.value })}
            />
          </div>
        ))}

        <div className="field-group">
          <label htmlFor="hotel-address">Address</label>
          <input
            id="hotel-address"
            type="text"
            value={hotel.location?.address || ''}
            onChange={(e) =>
              setHotel({ ...hotel, location: { ...hotel.location, address: e.target.value } })
            }
          />
        </div>
        <div className="field-group">
          <label htmlFor="hotel-phone">Phone</label>
          <input
            id="hotel-phone"
            type="text"
            value={hotel.contact?.phone || ''}
            onChange={(e) =>
              setHotel({ ...hotel, contact: { ...hotel.contact, phone: e.target.value } })
            }
          />
        </div>
        <div className="field-group">
          <label htmlFor="hotel-email">Email</label>
          <input
            id="hotel-email"
            type="email"
            value={hotel.contact?.email || ''}
            onChange={(e) =>
              setHotel({ ...hotel, contact: { ...hotel.contact, email: e.target.value } })
            }
          />
        </div>
      </div>

      <button className="btn-primary" onClick={handleSave} disabled={saving}>
        {saving ? 'Saving…' : 'Save Changes'}
      </button>
    </div>
  );
}

// ─── Main AdminPanel ──────────────────────────────────────────────────────────

function AdminPanel({ onClose }) {
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => !!localStorage.getItem('adminToken')
  );
  const [activeTab, setActiveTab] = useState('sessions');

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return (
      <div className="admin-panel">
        <LoginForm onLogin={() => setIsAuthenticated(true)} />
      </div>
    );
  }

  return (
    <div className="admin-panel" role="region" aria-label="Admin panel">
      <div className="admin-toolbar">
        <h2>Admin Dashboard</h2>
        <div>
          <button className="btn-secondary" onClick={handleLogout}>Logout</button>
          {onClose && (
            <button className="btn-secondary" onClick={onClose} aria-label="Close admin panel">
              ✕ Close
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="admin-tabs" role="tablist">
        {['sessions', 'hotel'].map((tab) => (
          <button
            key={tab}
            role="tab"
            aria-selected={activeTab === tab}
            className={`admin-tab ${activeTab === tab ? 'admin-tab--active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'sessions' ? '💬 Sessions' : '🏨 Hotel Data'}
          </button>
        ))}
      </div>

      <div className="admin-content" role="tabpanel">
        {activeTab === 'sessions' ? <SessionsTab /> : <HotelTab />}
      </div>
    </div>
  );
}

export default AdminPanel;
