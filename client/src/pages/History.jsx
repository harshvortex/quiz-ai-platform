import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../utils/api';

export default function History() {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadHistory();
  }, [page]);

  async function loadHistory() {
    try {
      const data = await api.history(page);
      if (page === 1) {
        setQuizzes(data.quizzes);
      } else {
        setQuizzes(prev => [...prev, ...data.quizzes]);
      }
      setHasMore(data.has_more);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const filteredQuizzes = quizzes.filter(q => {
    const matchesSearch = q.topic.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'all' || q.difficulty === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="history-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Quiz History</h1>
          <p className="page-sub">Your complete learning journey</p>
        </div>
        <Link to="/quiz" className="btn-primary">New Quiz</Link>
      </div>

      <div className="history-filters">
        <div className="filter-tabs">
          {['all', 'easy', 'medium', 'hard'].map(f => (
            <button key={f} className={`filter-tab ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <div className="history-search">
           <input 
            type="text" 
            placeholder="Search topics..." 
            className="search-input" 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="history-table-wrap">
        <table className="history-table">
          <thead>
            <tr>
              <th>Topic</th>
              <th>Difficulty</th>
              <th>Score</th>
              <th>Grade</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {filteredQuizzes.map((q, i) => (
              <tr key={i} className="history-row">
                <td className="h-topic">
                  <div className="topic-icon-wrap">
                    <span className="topic-initial">{q.topic[0].toUpperCase()}</span>
                  </div>
                  <div>
                    <span className="topic-name">{q.topic}</span>
                    <span className="question-count">{q.total_questions} questions</span>
                  </div>
                </td>
                <td><span className={`diff-badge diff-${q.difficulty}`}>{q.difficulty}</span></td>
                <td className="h-score">
                  <strong>{q.score}</strong>/{q.total_questions}
                  <span className="pct-text">({Math.round((q.score/q.total_questions)*100)}%)</span>
                </td>
                <td><span className={`grade-badge grade-${q.grade.replace('+', 'plus')}`}>{q.grade}</span></td>
                <td className="h-date">{new Date(q.date).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {loading && <div className="spinner-ring" />}
        {!loading && quizzes.length === 0 && <div className="empty-state">No history found.</div>}
        {hasMore && <button className="btn-ghost" onClick={() => setPage(p => p + 1)}>Load More</button>}
      </div>
    </div>
  );
}
