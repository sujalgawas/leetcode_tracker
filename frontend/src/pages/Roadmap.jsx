import { useState, useEffect } from 'react';
import { leetcodeAPI } from '../services/api';
import './Roadmap.css';

function Roadmap() {
  const [roadmap, setRoadmap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedTopics, setExpandedTopics] = useState({});

  useEffect(() => {
    const fetchRoadmap = async () => {
      const savedUser = localStorage.getItem('leetcode_username');
      if (!savedUser) {
        setError('Please enter your LeetCode username in the Dashboard first.');
        setLoading(false);
        return;
      }

      try {
        const res = await leetcodeAPI.getRoadmap(savedUser);
        setRoadmap(res);
        // Expand first topic by default
        if (res.roadmap?.length > 0) {
          setExpandedTopics({ [res.roadmap[0].topic]: true });
        }
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load roadmap.');
      } finally {
        setLoading(false);
      }
    };

    fetchRoadmap();
  }, []);

  const toggleTopic = (topic) => {
    setExpandedTopics(prev => ({
      ...prev,
      [topic]: !prev[topic]
    }));
  };

  if (loading) return <div className="loading">Loading roadmap...</div>;
  if (error) return <div className="error-state card">{error}</div>;
  if (!roadmap) return null;

  return (
    <div className="roadmap-page">
      <header className="page-header">
        <h1>NeetCode 150 Roadmap</h1>
        <div className="roadmap-summary card">
          <div className="summary-info">
            <span className="summary-title">Overall Progress</span>
            <span className="summary-fraction">{roadmap.totalCompleted} / {roadmap.totalProblems}</span>
          </div>
          <div className="progress-bar-container">
            <div 
              className="progress-bar-fill" 
              style={{ width: `${roadmap.overallPercentage}%` }}
            ></div>
          </div>
        </div>
      </header>

      <div className="roadmap-list">
        {roadmap.roadmap.map((section) => {
          const isExpanded = expandedTopics[section.topic];
          
          return (
            <div key={section.topic} className="topic-card card">
              <div 
                className="topic-header" 
                onClick={() => toggleTopic(section.topic)}
              >
                <div className="topic-title-group">
                  <span className="toggle-icon">{isExpanded ? '▼' : '▶'}</span>
                  <h2 className="topic-name">{section.topic}</h2>
                </div>
                
                <div className="topic-stats">
                  <span className="topic-fraction">{section.completed}/{section.total}</span>
                  <div className="mini-progress-container">
                    <div 
                      className="progress-bar-fill" 
                      style={{ width: `${section.percentage}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {isExpanded && (
                <div className="problem-list">
                  {section.problems.map((problem) => (
                    <a 
                      key={problem.slug}
                      href={problem.leetcodeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`problem-item ${problem.completed ? 'completed' : ''}`}
                    >
                      <div className="problem-status">
                        {problem.completed ? '✅' : '⬜'}
                      </div>
                      <div className="problem-title">{problem.title}</div>
                      <span className={`badge ${problem.difficulty.toLowerCase()}`}>
                        {problem.difficulty}
                      </span>
                    </a>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Roadmap;
