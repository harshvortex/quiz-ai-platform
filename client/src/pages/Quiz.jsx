import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../utils/api';

export default function Quiz() {
  const { user } = useAuth();
  const { addToast } = useToast();
  
  const [step, setStep] = useState('setup'); // setup, loading, quiz, result
  const [loadingStep, setLoadingStep] = useState(1);
  const [topic, setTopic] = useState(sessionStorage.getItem('prefill_topic') || '');
  const [numQuestions, setNumQuestions] = useState(5);
  const [difficulty, setDifficulty] = useState('medium');
  const [persona, setPersona] = useState('professional');
  const [mode, setMode] = useState('topic');
  const [studyContext, setStudyContext] = useState('');
  
  const [quizData, setQuizData] = useState({ questions: [], currentIndex: 0, answers: {}, startTime: null });
  const [results, setResults] = useState(null);
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    let interval;
    if (step === 'quiz') {
      interval = setInterval(() => setTimer(t => t + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [step]);

  const handleGenerate = async () => {
    if (mode === 'topic' && !topic.trim()) return addToast('Please enter a topic', 'error');
    if (mode === 'study' && !studyContext.trim()) return addToast('Please enter study material', 'error');

    setStep('loading');
    setLoadingStep(1);
    
    // Fake loading steps animation
    setTimeout(() => setLoadingStep(2), 1000);
    setTimeout(() => setLoadingStep(3), 2000);

    try {
      const payload = {
        topic,
        num_questions: numQuestions,
        difficulty,
        persona,
        mode,
        context: studyContext
      };
      const data = await api.generateQuiz(payload);
      
      setQuizData({
        questions: data.questions,
        currentIndex: 0,
        answers: {},
        startTime: Date.now()
      });
      setTimer(0);
      setStep('quiz');
    } catch (err) {
      addToast(err.message, 'error');
      setStep('setup');
    }
  };

  const handleAnswer = (qIndex, answer) => {
    setQuizData(prev => ({
      ...prev,
      answers: { ...prev.answers, [qIndex]: answer }
    }));
    
    if (qIndex < quizData.questions.length - 1) {
      setTimeout(() => {
        setQuizData(prev => ({ ...prev, currentIndex: qIndex + 1 }));
      }, 500);
    }
  };

  const handleSubmit = async () => {
    const { questions, answers } = quizData;
    let correct = 0;
    questions.forEach((q, i) => {
      if (answers[i] === q.answer) correct++;
    });

    const percentage = Math.round((correct / questions.length) * 100);
    
    try {
      await api.saveQuiz({
        topic: quizData.topic || topic || 'Study Session',
        difficulty,
        score: correct,
        total_questions: questions.length
      });
    } catch (err) {
      console.error("Failed to save results", err);
    }

    setResults({
      correct,
      wrong: questions.length - correct - (questions.length - Object.keys(answers).length),
      skipped: questions.length - Object.keys(answers).length,
      percentage
    });
    setStep('result');
  };

  const formatTime = (s) => {
    const mins = Math.floor(s / 60).toString().padStart(2, '0');
    const secs = (s % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  if (step === 'setup') {
    return (
      <div className="quiz-page">
        <div className="setup-card">
          <div className="setup-header">
            <div className="setup-icon">✦</div>
            <h1>Generate Your Quiz</h1>
            <p>Enter a topic and let AI craft the perfect quiz for you</p>
          </div>

          <div className="mode-toggle-wrap">
            <button className={`mode-btn ${mode === 'topic' ? 'active' : ''}`} onClick={() => setMode('topic')}>AI Topic</button>
            <button className={`mode-btn ${mode === 'study' ? 'active' : ''}`} onClick={() => setMode('study')}>Study Material</button>
          </div>

          <div className="setup-form">
            {mode === 'topic' ? (
              <div className="form-group">
                <label className="form-label">Topic</label>
                <input 
                  className="form-input form-input-lg" 
                  value={topic} 
                  onChange={e => setTopic(e.target.value)}
                  placeholder="e.g. Photosynthesis, JavaScript..."
                />
              </div>
            ) : (
              <div className="form-group">
                <label className="form-label">Study Material</label>
                <textarea 
                  className="form-input" 
                  rows="6" 
                  value={studyContext}
                  onChange={e => setStudyContext(e.target.value)}
                  placeholder="Paste your notes here..."
                />
              </div>
            )}

            <div className="setup-row">
              <div className="form-group">
                <label className="form-label">Questions</label>
                <div className="number-input-wrap">
                  <button className="num-btn" onClick={() => setNumQuestions(Math.max(3, numQuestions - 1))}>−</button>
                  <input className="num-input" value={numQuestions} readOnly />
                  <button className="num-btn" onClick={() => setNumQuestions(Math.min(15, numQuestions + 1))}>+</button>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Difficulty</label>
                <div className="difficulty-selector">
                  {['easy', 'medium', 'hard'].map(d => (
                    <label key={d} className="diff-option">
                      <input type="radio" name="difficulty" value={d} checked={difficulty === d} onChange={() => setDifficulty(d)} />
                      <span className="diff-label">{d.charAt(0).toUpperCase() + d.slice(1)}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <button className="btn-primary btn-generate btn-lg" onClick={handleGenerate}>
              Generate Quiz
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'loading') {
    return (
      <div className="quiz-page">
        <div className="loading-card">
          <div className="loading-spinner"><div className="spinner-ring" /><div className="spinner-dot">✦</div></div>
          <h2>Crafting your quiz...</h2>
          <div className="loading-steps">
            <div className={`lstep ${loadingStep >= 1 ? 'active' : ''} ${loadingStep > 1 ? 'done' : ''}`}>Analyzing topic</div>
            <div className={`lstep ${loadingStep >= 2 ? 'active' : ''} ${loadingStep > 2 ? 'done' : ''}`}>Generating questions</div>
            <div className={`lstep ${loadingStep >= 3 ? 'active' : ''} ${loadingStep > 3 ? 'done' : ''}`}>Validating answers</div>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'quiz') {
    const q = quizData.questions[quizData.currentIndex];
    return (
      <div className="quiz-page">
        <div className="quiz-header">
          <div className="quiz-meta">
            <span className="quiz-topic-tag">{topic || 'Study Session'}</span>
            <span className="quiz-diff-tag">{difficulty}</span>
          </div>
          <div className="quiz-timer">⏱ {formatTime(timer)}</div>
          <div className="quiz-progress-wrap">
            <div className="quiz-progress-bar">
              <div className="quiz-progress-fill" style={{ width: `${((quizData.currentIndex + 1) / quizData.questions.length) * 100}%` }} />
            </div>
            <span className="quiz-progress-text">{quizData.currentIndex + 1} / {quizData.questions.length}</span>
          </div>
        </div>

        <div className="question-card">
          <div className="q-number">Question {quizData.currentIndex + 1}</div>
          <div className="q-text">{q.question}</div>
          <div className="options-list">
            {q.options.map((opt, i) => (
              <label key={i} className={`option-label ${quizData.answers[quizData.currentIndex] === opt ? 'selected' : ''}`}>
                <input type="radio" name="option" value={opt} checked={quizData.answers[quizData.currentIndex] === opt} onChange={() => handleAnswer(quizData.currentIndex, opt)} />
                <span className="option-letter">{String.fromCharCode(65 + i)}</span>
                <span className="option-text">{opt}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="quiz-nav">
          <button className="btn-ghost" disabled={quizData.currentIndex === 0} onClick={() => setQuizData(p => ({ ...p, currentIndex: p.currentIndex - 1 }))}>Previous</button>
          <div className="q-dots">
            {quizData.questions.map((_, i) => (
              <div key={i} className={`q-dot ${i === quizData.currentIndex ? 'current' : quizData.answers[i] ? 'answered' : ''}`} onClick={() => setQuizData(p => ({ ...p, currentIndex: i }))} />
            ))}
          </div>
          {quizData.currentIndex < quizData.questions.length - 1 ? (
             <button className="btn-primary" onClick={() => setQuizData(p => ({ ...p, currentIndex: p.currentIndex + 1 }))}>Next</button>
          ) : (
            <button className="btn-submit" onClick={handleSubmit}>Submit Quiz</button>
          )}
        </div>
      </div>
    );
  }

  if (step === 'result') {
    return (
      <div className="quiz-page">
        <div className="result-card">
          <div className="result-header">
            <div className="result-emoji">{results.percentage >= 70 ? '🎉' : '📚'}</div>
            <h2>{results.percentage >= 70 ? 'Quiz Complete!' : 'Keep Practicing!'}</h2>
          </div>
          <div className="result-score-ring">
            <div className="score-num">{results.percentage}%</div>
          </div>
          <div className="result-breakdown">
            <div className="breakdown-item correct"><span>✓</span> <strong>{results.correct}</strong> Correct</div>
            <div className="breakdown-item wrong"><span>✗</span> <strong>{results.wrong}</strong> Wrong</div>
          </div>
          <div className="result-actions">
            <button className="btn-primary" onClick={() => setStep('setup')}>Try Another</button>
            <Link to="/dashboard" className="btn-ghost">Dashboard</Link>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
