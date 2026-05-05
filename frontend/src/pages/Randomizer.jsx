import { useState, useEffect } from 'react';
import { leetcodeAPI } from '../services/api';
import './Randomizer.css';

function Randomizer() {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [question, setQuestion] = useState(null);
  
  const [mode, setMode] = useState('all'); // 'all' or 'topic'
  const [selectedTopic, setSelectedTopic] = useState('');
  const [includeUnsolved, setIncludeUnsolved] = useState(false);

  useEffect(() => {
    const fetchTopics = async () => {
      try {
        const res = await leetcodeAPI.getTopics();
        setTopics(res);
        if (res.length > 0) setSelectedTopic(res[0]);
      } catch (err) {
        console.error("Failed to load topics", err);
      }
    };
    fetchTopics();
  }, []);

  const handleRandomize = async () => {
    const username = localStorage.getItem('leetcode_username');
    if (!username) {
      setError('Please set your LeetCode username in the Dashboard first.');
      return;
    }

    setLoading(true);
    setError(null);
    setQuestion(null);

    try {
      const res = await leetcodeAPI.getRandomQuestion({
        username,
        mode,
        topic: mode === 'topic' ? selectedTopic : undefined,
        includeUnsolved
      });
      setQuestion(res);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to get a random question.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="randomizer-page">
      <header className="page-header">
        <h1>Random Question Generator</h1>
        <p className="subtitle">Pick a random problem from the roadmap for revision.</p>
      </header>

      <div className="controls-card card">
        <div className="mode-selector">
          <button 
            className={mode === 'all' ? 'active' : ''}
            onClick={() => setMode('all')}
          >
            Randomize All
          </button>
          <button 
            className={mode === 'topic' ? 'active' : ''}
            onClick={() => setMode('topic')}
          >
            Randomize by Topic
          </button>
        </div>

        {mode === 'topic' && (
          <div className="topic-selector">
            <label htmlFor="topic-select">Select Topic:</label>
            <select 
              id="topic-select" 
              className="input-field"
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value)}
            >
              {topics.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        )}

        <div className="toggle-container">
          <label className="checkbox-label">
            <input 
              type="checkbox" 
              checked={includeUnsolved}
              onChange={(e) => setIncludeUnsolved(e.target.checked)}
            />
            Include unsolved problems
          </label>
        </div>

        <button 
          className="btn-primary generate-btn" 
          onClick={handleRandomize}
          disabled={loading}
        >
          {loading ? 'Picking...' : 'Generate Random Question'}
        </button>

        {error && <p className="error-message">{error}</p>}
      </div>

      {question && (
        <div className="result-card card">
          <div className="result-header">
            <span className="result-topic">{question.topic}</span>
            <span className={`badge ${question.difficulty.toLowerCase()}`}>
              {question.difficulty}
            </span>
          </div>
          
          <h2 className="result-title">{question.title}</h2>
          
          <div className="result-status">
            Status: {question.completed ? <span className="status-solved">✅ Solved</span> : <span className="status-unsolved">⬜ Unsolved</span>}
          </div>

          <a 
            href={question.leetcodeUrl} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="btn-primary solve-btn"
          >
            Solve on LeetCode
          </a>
        </div>
      )}
    </div>
  );
}

export default Randomizer;
