import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('kisan_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401 || err.response?.status === 403) {
      localStorage.removeItem('kisan_token');
      localStorage.removeItem('kisan_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  },
);

export default api;

// Auth
export const authApi = {
  login: (phone: string, password: string) =>
    api.post('/auth/login', { phone, password }),
  register: (name: string, phone: string, password: string) =>
    api.post('/auth/register', { name, phone, password }),
  me: () => api.get('/auth/me'),
};

// Farmer
export const farmerApi = {
  getProfile: () => api.get('/farmers/profile'),
  saveProfile: (data: Record<string, unknown>) => api.post('/farmers/profile', data),
  getMySchemes: () => api.get('/farmers/my-schemes'),
  getAll: () => api.get('/farmers/'),
  getById: (id: string) => api.get(`/farmers/${id}`),
  importSurvey: (farmers: Record<string, unknown>[]) =>
    api.post('/farmers/survey-import', { farmers }),
};

// Schemes
export const schemeApi = {
  getAll: (params?: { category?: string; search?: string }) =>
    api.get('/schemes', { params }),
  getById: (id: string) => api.get(`/schemes/${id}`),
  getCategories: () => api.get('/schemes/meta/categories'),
  create: (data: Record<string, unknown>) => api.post('/schemes', data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/schemes/${id}`, data),
};

// Applications
export const applicationApi = {
  getMyApplications: () => api.get('/applications'),
  addToTracker: (scheme_id: string) => api.post('/applications', { scheme_id }),
  updateApplication: (id: string, data: Record<string, unknown>) =>
    api.put(`/applications/${id}`, data),
  getAllAdmin: (params?: Record<string, string>) =>
    api.get('/applications/admin/all', { params }),
};

// Calls
export const callApi = {
  getPending: () => api.get('/calls/pending'),
  getHistory: () => api.get('/calls/history'),
  getOutboundQueue: () => api.get('/calls/outbound-queue'),
  getScript: (farmerId: string) => api.get(`/calls/script/${farmerId}`),
  initiateCall: (farmer_id: string, schemes_discussed: string[]) =>
    api.post('/calls/initiate', { farmer_id, schemes_discussed }),
  recordOutcome: (data: Record<string, unknown>) => api.post('/calls/outcome', data),
};

// Admin
export const adminApi = {
  getStats: () => api.get('/admin/stats'),
  setup: (data: Record<string, string>) => api.post('/admin/setup', data),
};
