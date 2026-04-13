import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip } from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip);

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadDashboard(); }, []);

  async function loadDashboard() {
    try {
      const res = await api.dashboard();
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function getGreeting() {
    const h = new Date().getHours();
    return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
  }

  if (loading) return <div className="page-loader"><div className="spinner-ring" /></div>;
  if (!data) return <div className="dashboard-page"><p>Failed to load dashboard.</p></div>;

  const { stats, recent, chart_data, recommendations } = data;

  const chartConfig = chart_data.length > 0 ? {
    labels: chart_data.map(q => q.topic.length > 12 ? q.topic.substring(0, 10) + '…' : q.topic),
    datasets: [{
      label: 'Score %',
      data: chart_data.map(q => q.percentage),
      borderColor: '#8b5cf6',
      backgroundColor: (ctx) => {
        const g = ctx.chart.ctx.createLinearGradient(0, 0, 0, 260);
        g.addColorStop(0, 'rgba(139,92,246,0.15)');
        g.addColorStop(1, 'rgba(139,92,246,0)');
        return g;
      },
      borderWidth: 3, tension: 0.4, fill: true,
      pointBackgroundColor: '#f59e0b', pointBorderColor: '#0a0a0f',
      pointBorderWidth: 2, pointRadius: 5, pointHoverRadius: 8,
    }],
  } : null;

  const chartOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(22,22,32,0.95)', titleColor: '#fff',
        bodyColor: 'rgba(255,255,255,0.8)', borderColor: 'rgba(139,92,246,0.3)',
        borderWidth: 1, cornerRadius: 12, padding: 14,
        callbacks: { label: (c) => ` Score: ${c.parsed.y}%` },
      },
    },
    scales: {
      y: { beginAtZero: true, max: 100, grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: 'rgba(255,255,255,0.3)', font: { size: 11 } } },
      x: { grid: { display: false }, ticks: { color: 'rgba(255,255,255,0.3)', font: { size: 11 } } },
    },
  };

  function startQuiz(topic) {
    sessionStorage.setItem('prefill_topic', topic);
    window.location.href = '/quiz';
  }

  return (
    <div className="dashboard-page">
      <div className="dash-header">
        <div className="dash-header-inner">
          <div>
            <p className="dash-greeting">{getGreeting()},</p>
            <h1 className="dash-name">{user.username} <span className="badge-pro">PRO</span> <span className="wave">👋</span></h1>
            <p className="dash-sub">Ready to challenge yourself today?</p>
          </div>
          <div className="dash-actions">
            <Link to="/quiz" className="btn-primary btn-lg">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
              Generate New Quiz
            </Link>
          </div>
        </div>
      </div>

      <div className="stats-grid">
        {[
          { icon: '📚', value: stats.total, unit: '', label: 'Quizzes Taken', bg: 'TOTAL' },
          { icon: '📊', value: stats.average, unit: '%', label: 'Average Score', bg: 'AVG' },
          { icon: '🏆', value: stats.best, unit: '%', label: 'Best Score', bg: 'BEST' },
          { icon: '🔥', value: Math.floor(stats.total / 5) + 1, unit: '', label: 'Daily Streak', bg: 'FIRE', extra: 'stat-streak' },
        ].map((s, i) => (
          <div key={i} className={`stat-card ${s.extra || ''}`}>
            <div className="stat-icon">{s.icon}</div>
            <div className="stat-body">
              <div className="stat-value"><CountUp target={s.value} />{s.unit && <span className="stat-unit">{s.unit}</span>}</div>
              <div className="stat-label">{s.label}</div>
            </div>
            <div className="stat-bg-text">{s.bg}</div>
          </div>
        ))}
      </div>

      {chartConfig && (
        <div className="chart-section">
          <div className="chart-card">
            <div className="chart-header">
              <h2 className="section-title">Performance Journey</h2>
              <div className="chart-legend"><span className="legend-item"><span className="dot" style={{ background: '#8b5cf6' }} /> Score %</span></div>
            </div>
            <div className="chart-wrap"><Line data={chartConfig} options={chartOptions} /></div>
          </div>
        </div>
      )}

      <div className="quick-start-section">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h2 className="section-title" style={{ marginBottom: 0 }}>{recommendations.length ? 'Focus on Mastery' : 'Quick Start'}</h2>
          {recommendations.length > 0 && <span className="badge-pro" style={{ marginLeft: 0, fontSize: 10 }}>Personalized for You</span>}
        </div>
        <div className="topic-pills">
          {recommendations.length > 0
            ? recommendations.map((t, i) => <div key={i} className="topic-pill recommend-pill" onClick={() => startQuiz(t)}>🔥 {t} (Review)</div>)
            : ['General Science', 'World History', 'JavaScript', 'Geography', 'Space Exploration'].map((t, i) =>
              <div key={i} className="topic-pill" onClick={() => startQuiz(t)}>{t}</div>
            )
          }
        </div>
      </div>

      <div className="recent-section">
        <div className="section-header">
          <h2 className="section-title">Recent Activity</h2>
          {recent.length > 0 && <Link to="/history" className="section-link">View all →</Link>}
        </div>
        {recent.length > 0 ? (
          <div className="recent-table-wrap">
            <table className="recent-table">
              <thead><tr><th>Topic</th><th>Difficulty</th><th>Score</th><th>Grade</th><th>Date</th></tr></thead>
              <tbody>
                {recent.map((q, i) => (
                  <tr key={i} className="table-row">
                    <td className="topic-cell"><span className="topic-dot" />{q.topic}</td>
                    <td><span className={`diff-badge diff-${q.difficulty}`}>{q.difficulty.charAt(0).toUpperCase() + q.difficulty.slice(1)}</span></td>
                    <td><span className="score-text">{q.score}/{q.total_questions}</span>
                      <div className="mini-bar"><div className="mini-bar-fill" style={{ width: `${q.percentage}%`, background: q.percentage >= 70 ? 'var(--success)' : q.percentage >= 50 ? 'var(--warning)' : 'var(--danger)' }} /></div>
                    </td>
                    <td><span className={`grade-badge grade-${q.grade.replace('+', 'plus')}`}>{q.grade}</span></td>
                    <td className="date-cell">{new Date(q.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">🎯</div>
            <h3>No quizzes yet</h3>
            <p>Generate your first quiz to start tracking your progress.</p>
            <Link to="/quiz" className="btn-primary">Start a Quiz</Link>
          </div>
        )}
      </div>
    </div>
  );
}

function CountUp({ target }) {
  const [val, setVal] = useState(0);
  const ref = useRef();

  useEffect(() => {
    if (!target) { setVal(0); return; }
    let start = null;
    const duration = 1500;
    function step(ts) {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setVal(Math.floor(eased * target));
      if (progress < 1) ref.current = requestAnimationFrame(step);
    }
    ref.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(ref.current);
  }, [target]);

  return <>{val}</>;
}
