import { useState, useEffect } from 'react';
import { leetcodeAPI } from '../services/api';
import './Dashboard.css';

function Dashboard() {
  const [username, setUsername] = useState('');
  const [sessionCookie, setSessionCookie] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [userData, setUserData] = useState(null);
  const [roadmapData, setRoadmapData] = useState(null);

  // Try to load existing user on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('leetcode_username');
    if (savedUser) {
      setUsername(savedUser);
      fetchData(savedUser);
    }
  }, []);

  const fetchData = async (user) => {
    setLoading(true);
    setError(null);
    try {
      const userRes = await leetcodeAPI.getUser(user);
      setUserData(userRes);
      const roadmapRes = await leetcodeAPI.getRoadmap(user);
      setRoadmapData(roadmapRes);
      localStorage.setItem('leetcode_username', user);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch user data. Please sync first.');
      setUserData(null);
      setRoadmapData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async (e) => {
    e.preventDefault();
    if (!username.trim()) return;
    
    setLoading(true);
    setError(null);
    try {
      await leetcodeAPI.syncUser(username, sessionCookie);
      await fetchData(username);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to sync with LeetCode.');
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-page">
      <header className="page-header">
        <h1>Dashboard</h1>
        <p className="subtitle">Track your LeetCode progress against the NeetCode 150 roadmap.</p>
      </header>

      <section className="sync-section card">
        <form onSubmit={handleSync} className="sync-form-container">
          <div className="sync-form">
            <input
              type="text"
              className="input-field"
              placeholder="Enter LeetCode username..."
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
              required
            />
            <button type="submit" className="btn-primary" disabled={loading || !username.trim()}>
              {loading ? 'Syncing...' : 'Sync Data'}
            </button>
          </div>
          <div className="cookie-field">
            <input
              type="password"
              className="input-field cookie-input"
              placeholder="Optional: Enter LEETCODE_SESSION cookie for full sync..."
              value={sessionCookie}
              onChange={(e) => setSessionCookie(e.target.value)}
              disabled={loading}
            />
            <p className="cookie-help">
              To fetch <strong>all</strong> your solved problems, you must provide your LEETCODE_SESSION cookie. 
              (F12 &gt; Application &gt; Cookies &gt; leetcode.com &gt; LEETCODE_SESSION).
            </p>
          </div>
        </form>
        {error && <p className="error-message">{error}</p>}
        {userData?.lastSynced && (
          <p className="sync-time">
            Last synced: {new Date(userData.lastSynced).toLocaleString()}
          </p>
        )}
      </section>

      {roadmapData && (
        <section className="stats-grid">
          <div className="stat-card card">
            <h3>Overall Progress</h3>
            <div className="progress-large">
              <span className="progress-text">
                {roadmapData.overallPercentage}%
              </span>
              <span className="progress-fraction">
                {roadmapData.totalCompleted} / {roadmapData.totalProblems}
              </span>
            </div>
            <div className="progress-bar-container mt-2">
              <div 
                className="progress-bar-fill" 
                style={{ width: `${roadmapData.overallPercentage}%` }}
              ></div>
            </div>
          </div>

          <div className="stat-card card">
            <h3>LeetCode Stats</h3>
            <div className="difficulty-stats">
              <div className="diff-item">
                <span className="badge easy">Easy</span>
                <span className="count">{userData.totalSolved?.easy || 0}</span>
              </div>
              <div className="diff-item">
                <span className="badge medium">Medium</span>
                <span className="count">{userData.totalSolved?.medium || 0}</span>
              </div>
              <div className="diff-item">
                <span className="badge hard">Hard</span>
                <span className="count">{userData.totalSolved?.hard || 0}</span>
              </div>
            </div>
            <p className="total-solved">Total Solved: {userData.totalSolved?.all || 0}</p>
          </div>
        </section>
      )}
    </div>
  );
}

export default Dashboard;
