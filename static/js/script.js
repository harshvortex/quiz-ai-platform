/* ═══════════════════════════════════════════════════════════════
   QuizAI — Industry-Grade JavaScript v3.0
   Features: Particle Engine, 3D Tilt, Smooth Transitions,
   Scroll-aware Navbar, Advanced Quiz Interface
   ═══════════════════════════════════════════════════════════════ */

'use strict';

/* ── Globals ─────────────────────────────────────────────────── */
let quizData = {
  questions: [],
  topic: '',
  difficulty: '',
  currentIndex: 0,
  answers: {},
  startTime: null,
};

/* ── DOM Ready ───────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  initParticles();
  initNavbar();
  initNavToggle();
  initToastDismiss();
  initAnimateOnScroll();
  initQuizPage();
  initNumberInput();
  initTopicSuggestions();
  init3DTilt();
  initSmoothAppear();
});

/* ── Particle Engine ─────────────────────────────────────────── */
function initParticles() {
  const canvas = document.getElementById('particleCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let particles = [];
  let width, height;
  let animationId;
  const PARTICLE_COUNT = 50;

  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  }

  function createParticle() {
    return {
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2 + 0.5,
      speedX: (Math.random() - 0.5) * 0.3,
      speedY: (Math.random() - 0.5) * 0.3,
      opacity: Math.random() * 0.5 + 0.1,
      color: Math.random() > 0.6
        ? `rgba(139, 92, 246, ${Math.random() * 0.3 + 0.1})`
        : Math.random() > 0.3
          ? `rgba(6, 182, 212, ${Math.random() * 0.2 + 0.05})`
          : `rgba(245, 158, 11, ${Math.random() * 0.2 + 0.05})`,
    };
  }

  function init() {
    resize();
    particles = Array.from({ length: PARTICLE_COUNT }, createParticle);
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);

    particles.forEach(p => {
      p.x += p.speedX;
      p.y += p.speedY;

      // Wrap
      if (p.x < 0) p.x = width;
      if (p.x > width) p.x = 0;
      if (p.y < 0) p.y = height;
      if (p.y > height) p.y = 0;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();
    });

    // Draw connections
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 150) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(139, 92, 246, ${0.03 * (1 - dist / 150)})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }

    animationId = requestAnimationFrame(draw);
  }

  init();
  draw();

  // Debounced resize
  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      resize();
      // Re-position particles within new bounds
      particles.forEach(p => {
        if (p.x > width) p.x = Math.random() * width;
        if (p.y > height) p.y = Math.random() * height;
      });
    }, 200);
  });
}

/* ── Scroll-aware Navbar ─────────────────────────────────────── */
function initNavbar() {
  const nav = document.getElementById('mainNav');
  if (!nav) return;

  let lastScroll = 0;

  window.addEventListener('scroll', () => {
    const currentScroll = window.scrollY;

    if (currentScroll > 20) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }

    lastScroll = currentScroll;
  }, { passive: true });
}

/* ── Navbar Toggle ───────────────────────────────────────────── */
function initNavToggle() {
  const toggle = document.getElementById('navToggle');
  const menu   = document.getElementById('mobileMenu');
  if (!toggle || !menu) return;

  toggle.addEventListener('click', () => {
    const open = menu.classList.toggle('open');
    toggle.setAttribute('aria-expanded', open);
  });

  document.addEventListener('click', (e) => {
    if (!toggle.contains(e.target) && !menu.contains(e.target)) {
      menu.classList.remove('open');
    }
  });
}

/* ── Toast Dismiss ───────────────────────────────────────────── */
function initToastDismiss() {
  document.querySelectorAll('.toast').forEach((toast, i) => {
    // Stagger entrance
    toast.style.animationDelay = `${i * 100}ms`;

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(30px) scale(0.95)';
      toast.style.transition = 'opacity 0.3s, transform 0.3s';
      setTimeout(() => toast.remove(), 300);
    }, 5000 + i * 500);
  });
}

function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer') || (() => {
    const div = document.createElement('div');
    div.className = 'toast-container';
    div.id = 'toastContainer';
    document.body.appendChild(div);
    return div;
  })();

  const icons = { success: '✓', error: '✗', info: 'ℹ' };
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${icons[type] || icons.info}</span>
    <span class="toast-message">${escapeHtml(message)}</span>
    <button class="toast-close" onclick="this.parentElement.remove()">×</button>
  `;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(30px) scale(0.95)';
    toast.style.transition = 'opacity 0.3s, transform 0.3s';
    setTimeout(() => toast.remove(), 300);
  }, 5000);
}

/* ── Scroll Animations (IntersectionObserver) ────────────────── */
function initAnimateOnScroll() {
  const items = document.querySelectorAll('[data-animate]');
  if (!items.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        setTimeout(() => {
          entry.target.classList.add('visible');
          entry.target.classList.add('reveal');
        }, i * 100);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  items.forEach(el => observer.observe(el));
}

/* ── 3D Tilt Effect ──────────────────────────────────────────── */
function init3DTilt() {
  document.querySelectorAll('.stat-card, .chart-card, .setup-card').forEach(card => {
    card.addEventListener('mousemove', e => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = ((y - centerY) / centerY) * -5;
      const rotateY = ((x - centerX) / centerX) * 5;

      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
      card.style.transition = 'transform 0.1s ease';
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0)';
      card.style.transition = 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)';
    });
  });
}

/* ── Smooth Appear on Load ───────────────────────────────────── */
function initSmoothAppear() {
  document.querySelectorAll('.stat-card, .dash-header, .chart-card, .recent-section, .quick-start-section').forEach((el, i) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    setTimeout(() => {
      el.style.transition = 'opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1), transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)';
      el.style.opacity = '1';
      el.style.transform = 'translateY(0)';
    }, 100 + i * 80);
  });
}

/* ── Number Input (±) ────────────────────────────────────────── */
function initNumberInput() {
  const numInput = document.getElementById('numQuestions');
  const minus    = document.getElementById('numMinus');
  const plus     = document.getElementById('numPlus');
  if (!numInput) return;

  minus?.addEventListener('click', () => {
    const v = parseInt(numInput.value);
    if (v > 3) numInput.value = v - 1;
  });
  plus?.addEventListener('click', () => {
    const v = parseInt(numInput.value);
    if (v < 15) numInput.value = v + 1;
  });
  numInput.addEventListener('change', () => {
    numInput.value = Math.max(3, Math.min(15, parseInt(numInput.value) || 5));
  });
}

/* ── Topic Suggestions ───────────────────────────────────────── */
const POPULAR_TOPICS = [
  'Python', 'JavaScript', 'Machine Learning', 'Biology', 'Chemistry',
  'Physics', 'History', 'Geography', 'Mathematics', 'Literature',
  'Astronomy', 'Economics', 'Psychology', 'Philosophy', 'Art History'
];

function initTopicSuggestions() {
  const input = document.getElementById('topicInput');
  const box   = document.getElementById('topicSuggestions');
  if (!input || !box) return;

  input.addEventListener('input', () => {
    const val = input.value.toLowerCase().trim();
    box.innerHTML = '';
    if (!val) return;

    const matches = POPULAR_TOPICS.filter(t => t.toLowerCase().includes(val)).slice(0, 5);
    matches.forEach(topic => {
      const chip = document.createElement('span');
      chip.className = 'suggestion-chip';
      chip.textContent = topic;
      chip.addEventListener('click', () => {
        input.value = topic;
        box.innerHTML = '';
        input.focus();
      });
      box.appendChild(chip);
    });
  });
}

/* ── Password Toggle ─────────────────────────────────────────── */
function togglePassword(inputId, btn) {
  const input = document.getElementById(inputId);
  if (!input) return;
  const isText = input.type === 'text';
  input.type = isText ? 'password' : 'text';
  btn.style.opacity = isText ? '0.5' : '1';
}

/* ── Quiz Page ───────────────────────────────────────────────── */
function initQuizPage() {
  const form = document.getElementById('setupForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    await generateQuiz();
  });
}

/* ── Mode Switching ─────────────────────────────────────────── */
let currentMode = 'topic';

function switchMode(mode) {
  currentMode = mode;
  document.getElementById('modeTopic').classList.toggle('active', mode === 'topic');
  document.getElementById('modeStudy').classList.toggle('active', mode === 'study');

  document.getElementById('topicGroup').classList.toggle('hidden', mode === 'study');
  document.getElementById('studyGroup').classList.toggle('hidden', mode === 'topic');

  // Update required attributes
  document.getElementById('topicInput').required = (mode === 'topic');
  document.getElementById('contextInput').required = (mode === 'study');
}

async function generateQuiz() {
  const topic       = document.getElementById('topicInput').value.trim();
  const context     = document.getElementById('contextInput').value.trim();
  const numQuestions = parseInt(document.getElementById('numQuestions').value);
  const difficulty  = document.querySelector('input[name="difficulty"]:checked')?.value || 'medium';
  const persona     = document.querySelector('input[name="persona"]:checked')?.value || 'professional';

  if (currentMode === 'topic' && !topic) {
    showToast('Please enter a topic for your quiz.', 'error');
    return;
  }

  if (currentMode === 'study' && !context) {
    showToast('Please paste some study material to generate the quiz.', 'error');
    return;
  }

  const btn = document.getElementById('generateBtn');
  btn.disabled = true;
  btn.querySelector('.btn-text').textContent = 'Generating…';

  showSection('quizLoading');
  document.getElementById('loadingTopic').textContent = currentMode === 'topic' ? topic : 'your study material';
  animateLoadingSteps();

  try {
    const payload = currentMode === 'topic'
      ? { topic, num_questions: numQuestions, difficulty, persona, mode: 'topic' }
      : { context, num_questions: numQuestions, difficulty, persona, mode: 'study' };

    const resp = await fetch('/api/generate-quiz', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await resp.json();

    if (!resp.ok) {
      throw new Error(data.error || 'Failed to generate quiz');
    }

    quizData = {
      questions:    data.questions,
      topic:        data.topic || (currentMode === 'study' ? 'Personal Study Material' : topic),
      difficulty:   data.difficulty,
      currentIndex: 0,
      answers:      {},
      startTime:    Date.now(),
    };

    startQuizInterface();

  } catch (err) {
    showSection('quizSetup');
    showToast(err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.querySelector('.btn-text').textContent = 'Generate Quiz';
  }
}

function animateLoadingSteps() {
  const steps = ['lstep1', 'lstep2', 'lstep3'];
  steps.forEach(id => {
    const el = document.getElementById(id);
    if (el) { el.className = 'lstep'; }
  });

  document.getElementById('lstep1')?.classList.add('active');

  setTimeout(() => {
    const s1 = document.getElementById('lstep1');
    const s2 = document.getElementById('lstep2');
    if (s1) s1.className = 'lstep done';
    if (s2) s2.classList.add('active');
  }, 900);

  setTimeout(() => {
    const s2 = document.getElementById('lstep2');
    const s3 = document.getElementById('lstep3');
    if (s2) s2.className = 'lstep done';
    if (s3) s3.classList.add('active');
  }, 1800);
}

/* ── Quiz Interface ──────────────────────────────────────────── */
let timerInterval = null;

function startQuizInterface() {
  const { questions, topic, difficulty } = quizData;

  document.getElementById('quizTopicTag').textContent = topic;
  document.getElementById('quizDiffTag').textContent  = difficulty.charAt(0).toUpperCase() + difficulty.slice(1);

  buildDots();
  renderQuestion(0);
  updateProgress();
  startTimer();
  showSection('quizInterface');
}

function startTimer() {
  let seconds = 0;
  clearInterval(timerInterval);
  const textEl = document.getElementById('timerText');

  timerInterval = setInterval(() => {
    seconds++;
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    if (textEl) textEl.textContent = `${m}:${s}`;
  }, 1000);
}

function stopTimer() {
  clearInterval(timerInterval);
}

function buildDots() {
  const container = document.getElementById('qDots');
  if (!container) return;
  container.innerHTML = '';
  quizData.questions.forEach((_, i) => {
    const dot = document.createElement('div');
    dot.className = 'q-dot';
    dot.title = `Question ${i + 1}`;
    dot.addEventListener('click', () => navigateToQuestion(i));
    container.appendChild(dot);
  });
}

function renderQuestion(index) {
  const { questions, answers } = quizData;
  const q = questions[index];
  const area = document.getElementById('questionArea');
  if (!area) return;

  area.innerHTML = `
    <div class="question-card">
      <div class="q-number">Question ${index + 1} of ${questions.length}</div>
      <div class="q-text">${escapeHtml(q.question)}</div>
      <div class="options-list" id="optionsList">
        ${q.options.map((opt, i) => `
          <label class="option-label ${answers[index] === opt ? 'selected' : ''}" id="opt-${i}">
            <input type="radio" name="q_${index}" value="${escapeHtml(opt)}"
              ${answers[index] === opt ? 'checked' : ''}
              onchange="selectOption(${index}, '${escapeHtml(opt).replace(/'/g, "\\'")}', ${i})" />
            <span class="option-letter">${String.fromCharCode(65 + i)}</span>
            <span class="option-text">${escapeHtml(opt)}</span>
          </label>
        `).join('')}
      </div>
    </div>
  `;

  quizData.currentIndex = index;
  updateProgress();
  updateDots();
  updateNavButtons();
  updateSubmitZone();
}

function selectOption(qIndex, value, optIndex) {
  quizData.answers[qIndex] = value;

  // Update UI selection styles with animation
  document.querySelectorAll(`#optionsList .option-label`).forEach((label, i) => {
    label.classList.toggle('selected', i === optIndex);

    // Pulse animation on select
    if (i === optIndex) {
      label.style.transform = 'scale(1.02)';
      setTimeout(() => { label.style.transform = ''; }, 200);
    }
  });

  updateDots();
  updateSubmitZone();

  // Auto-advance after brief delay if not on last question
  if (qIndex < quizData.questions.length - 1) {
    setTimeout(() => navigateQuestion(1), 500);
  }
}

function navigateQuestion(delta) {
  const newIndex = quizData.currentIndex + delta;
  if (newIndex >= 0 && newIndex < quizData.questions.length) {
    renderQuestion(newIndex);
  }
}

function navigateToQuestion(index) {
  renderQuestion(index);
}

function updateProgress() {
  const { questions, answers, currentIndex } = quizData;
  const pct = ((currentIndex + 1) / questions.length) * 100;
  const progressFill = document.getElementById('progressFill');
  const progressText = document.getElementById('progressText');
  if (progressFill) progressFill.style.width = `${pct}%`;
  if (progressText) progressText.textContent = `${currentIndex + 1} / ${questions.length}`;
}

function updateDots() {
  document.querySelectorAll('.q-dot').forEach((dot, i) => {
    dot.className = 'q-dot';
    if (i === quizData.currentIndex) dot.classList.add('current');
    else if (quizData.answers[i] !== undefined) dot.classList.add('answered');
  });
}

function updateNavButtons() {
  const { currentIndex, questions } = quizData;
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');

  if (prevBtn) prevBtn.disabled = currentIndex === 0;
  if (nextBtn) {
    nextBtn.style.display = currentIndex === questions.length - 1 ? 'none' : '';
  }
}

function updateSubmitZone() {
  const { questions, answers, currentIndex } = quizData;
  const answered = Object.keys(answers).length;
  const isLastQ  = currentIndex === questions.length - 1;

  const submitZone = document.getElementById('submitZone');
  const answeredCount = document.getElementById('answeredCount');
  const totalCount = document.getElementById('totalCount');

  if (submitZone) submitZone.style.display = isLastQ ? '' : 'none';
  if (answeredCount) answeredCount.textContent = answered;
  if (totalCount) totalCount.textContent = questions.length;
}

/* ── Submit Quiz ─────────────────────────────────────────────── */
async function submitQuiz() {
  stopTimer();
  const { questions, answers, topic, difficulty } = quizData;

  let correct = 0;
  let wrong   = 0;
  let skipped = 0;

  questions.forEach((q, i) => {
    if (answers[i] === undefined) {
      skipped++;
    } else if (answers[i] === q.answer) {
      correct++;
    } else {
      wrong++;
    }
  });

  const total      = questions.length;
  const percentage = Math.round((correct / total) * 100);

  // Save to server
  try {
    await fetch('/api/save-quiz', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        topic, difficulty,
        score: correct,
        total_questions: total
      })
    });
  } catch (e) {
    console.warn('Could not save quiz result:', e);
  }

  showResults(correct, wrong, skipped, percentage);
}

/* ── Show Results ─────────────────────────────────────────────── */
function showResults(correct, wrong, skipped, percentage) {
  showSection('quizResult');

  // Emoji & message based on score
  const emoji    = percentage >= 90 ? '🏆' : percentage >= 70 ? '🎉' : percentage >= 50 ? '📚' : '💪';
  const subtitle = percentage >= 90 ? 'Outstanding performance!'
    : percentage >= 70 ? 'Great job! Keep it up.'
    : percentage >= 50 ? 'Good effort. Keep practicing!'
    : 'Don\'t give up — review and try again!';

  const resultEmoji = document.getElementById('resultEmoji');
  const resultSubtitle = document.getElementById('resultSubtitle');
  const correctCount = document.getElementById('correctCount');
  const wrongCount = document.getElementById('wrongCount');
  const skippedCount = document.getElementById('skippedCount');

  if (resultEmoji) resultEmoji.textContent = emoji;
  if (resultSubtitle) resultSubtitle.textContent = subtitle;
  if (correctCount) correctCount.textContent = correct;
  if (wrongCount) wrongCount.textContent = wrong;
  if (skippedCount) skippedCount.textContent = skipped;

  // Animate score ring
  animateScore(percentage);

  // Build review list
  buildReview();

  // Trigger confetti for high scores
  if (percentage >= 70) {
    launchConfetti();
  }
}

function animateScore(percentage) {
  const ring = document.getElementById('scoreRing');
  const numEl = document.getElementById('scoreNum');
  if (!ring || !numEl) return;

  const circumference = 314;

  // Color ring based on score
  const color = percentage >= 70 ? '#10b981' : percentage >= 50 ? '#f59e0b' : '#ef4444';
  ring.style.stroke = color;

  // Animate fill
  let start = null;
  const animate = (ts) => {
    if (!start) start = ts;
    const progress = Math.min((ts - start) / 1500, 1);
    const eased = 1 - Math.pow(1 - progress, 4); // quartic ease-out
    const offset = circumference - (eased * percentage / 100) * circumference;
    ring.style.strokeDashoffset = offset;
    numEl.textContent = Math.round(eased * percentage);
    if (progress < 1) requestAnimationFrame(animate);
  };
  requestAnimationFrame(animate);
}

/* ── Confetti Generator ──────────────────────────────────────── */
function launchConfetti() {
  const colors = ['#8b5cf6', '#a78bfa', '#f59e0b', '#10b981', '#06b6d4', '#ec4899'];
  const container = document.querySelector('.quiz-result') || document.body;

  for (let i = 0; i < 60; i++) {
    setTimeout(() => {
      const confetti = document.createElement('div');
      confetti.style.cssText = `
        position: fixed;
        top: -10px;
        left: ${Math.random() * 100}%;
        width: ${Math.random() * 8 + 4}px;
        height: ${Math.random() * 8 + 4}px;
        background: ${colors[Math.floor(Math.random() * colors.length)]};
        border-radius: ${Math.random() > 0.5 ? '50%' : '2px'};
        pointer-events: none;
        z-index: 9999;
        animation: confettiFall ${Math.random() * 2 + 2}s ease-in forwards;
        transform: rotate(${Math.random() * 360}deg);
      `;
      document.body.appendChild(confetti);
      setTimeout(() => confetti.remove(), 4000);
    }, i * 30);
  }

  // Add confetti animation
  if (!document.getElementById('confettiStyle')) {
    const style = document.createElement('style');
    style.id = 'confettiStyle';
    style.textContent = `
      @keyframes confettiFall {
        0% { transform: translateY(0) rotate(0deg) scale(1); opacity: 1; }
        100% { transform: translateY(100vh) rotate(720deg) scale(0.5); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  }
}

function buildReview() {
  const { questions, answers } = quizData;
  const list = document.getElementById('reviewList');
  if (!list) return;
  list.innerHTML = '';

  questions.forEach((q, i) => {
    const userAns    = answers[i];
    const isCorrect  = userAns === q.answer;
    const isSkipped  = userAns === undefined;
    const statusClass = isSkipped ? 'skipped' : isCorrect ? 'correct' : 'wrong';

    list.innerHTML += `
      <div class="review-item ${statusClass}">
        <div class="rv-q-num">Question ${i + 1}</div>
        <div class="rv-question">${escapeHtml(q.question)}</div>
        <div class="rv-answers">
          ${isSkipped ? `
            <div class="rv-answer"><span class="label">Your answer:</span> <em>Skipped</em></div>
          ` : `
            <div class="rv-answer ${isCorrect ? 'user-correct' : 'user-wrong'}">
              <span class="label">Your answer:</span> ${escapeHtml(userAns)}
              ${isCorrect ? ' ✓' : ' ✗'}
            </div>
          `}
          ${!isCorrect ? `
            <div class="rv-answer correct-ans">
              <span class="label">Correct answer:</span> ${escapeHtml(q.answer)}
            </div>
          ` : ''}
          ${q.explanation ? `
            <div class="rv-explanation">
              <span class="label">Why this is correct:</span>
              ${escapeHtml(q.explanation)}
              ${q.mnemonic ? `
                <div class="rv-mnemonic">
                  <span class="label">💡 Memory Anchor:</span>
                  <em>${escapeHtml(q.mnemonic)}</em>
                </div>
              ` : ''}
            </div>
          ` : ''}
        </div>
      </div>
    `;
  });
}

function toggleReview() {
  const section = document.getElementById('reviewSection');
  if (!section) return;
  section.classList.toggle('hidden');
  if (!section.classList.contains('hidden')) {
    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function retakeQuiz() {
  // Reset answers but keep the same questions
  quizData.answers = {};
  quizData.startTime = Date.now();
  startQuizInterface();
  showSection('quizInterface');
}

/* ── Section Manager ─────────────────────────────────────────── */
function showSection(sectionId) {
  // Support both quiz page sections and index page sections
  const sections = ['quizSetup', 'quizLoading', 'quizInterface', 'quizResult', 'resultsScreen'];
  sections.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;

    if (id === sectionId) {
      el.classList.remove('hidden');
      // Smooth entrance
      el.style.opacity = '0';
      el.style.transform = 'translateY(12px)';
      requestAnimationFrame(() => {
        el.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
        el.style.opacity = '1';
        el.style.transform = 'translateY(0)';
      });
    } else {
      el.classList.add('hidden');
    }
  });

  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ── Utilities ───────────────────────────────────────────────── */
function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}