const API_BASE = '/api';

async function request(endpoint, options = {}) {
  const config = {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  };

  const res = await fetch(`${API_BASE}${endpoint}`, config);
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || data.message || 'Request failed');
  }

  return data;
}

export const api = {
  // Auth
  login: (identifier, password, remember) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password, remember }),
    }),

  signup: (username, email, password) =>
    request('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ username, email, password }),
    }),

  logout: () => request('/auth/logout', { method: 'POST' }),

  me: () => request('/auth/me'),

  // Dashboard
  dashboard: () => request('/dashboard'),

  // Quiz
  generateQuiz: (payload) =>
    request('/generate-quiz', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  saveQuiz: (payload) =>
    request('/save-quiz', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // History
  history: (page = 1) => request(`/history?page=${page}`),
};
