import axios from 'axios';

const BASE_PATH = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');

export const api = axios.create({ baseURL: `${BASE_PATH}/api`, timeout: 30000 });

api.interceptors.request.use((cfg) => {
  const token = localStorage.getItem('vms_token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && !window.location.pathname.endsWith('/login')) {
      localStorage.removeItem('vms_token');
      window.location.href = `${BASE_PATH}/login`;
    }
    return Promise.reject(err);
  }
);

export const errMsg = (err, fallback = 'Terjadi kesalahan') =>
  err?.response?.data?.error || err?.message || fallback;

export const endpoints = {
  login: (identifierOrEmail, password) =>
    api.post('/auth/login', { identifier: identifierOrEmail, password }).then((r) => r.data),
  forgotPassword: (identifier) =>
    api.post('/auth/forgot-password', { identifier }).then((r) => r.data),
  resetPassword: (payload) =>
    api.post('/auth/reset-password', payload).then((r) => r.data),
  updateProfile: (payload) =>
    api.put('/auth/profile', payload).then((r) => r.data),
  changePassword: (payload) =>
    api.put('/auth/change-password', payload).then((r) => r.data),
  me: () => api.get('/auth/me').then((r) => r.data),

  publicDepartments: () => api.get('/public/departments').then((r) => r.data),
  publicWalkInQr: (url) => api.get('/public/walkin-qr', { params: { url } }).then((r) => r.data),
  publicPics: (departmentId) =>
    api.get('/public/pics', { params: { departmentId } }).then((r) => r.data),
  publicRegister: (payload) => api.post('/public/register', payload).then((r) => r.data),
  publicPass: (token) => api.get(`/public/pass/${token}`).then((r) => r.data),
  ocrId: (image) => api.post('/public/ocr-id', { image }).then((r) => r.data),

  stats: () => api.get('/visits/stats/summary').then((r) => r.data),
  visits: (params) => api.get('/visits', { params }).then((r) => r.data),
  visit: (id) => api.get(`/visits/${id}`).then((r) => r.data),
  createVisit: (payload) => api.post('/visits', payload).then((r) => r.data),
  scan: (code) => api.post('/visits/scan', { code }).then((r) => r.data),
  checkIn: (id, payload) => api.post(`/visits/${id}/check-in`, payload).then((r) => r.data),
  checkOut: (id) => api.post(`/visits/${id}/check-out`).then((r) => r.data),
  reject: (id, reason) => api.post(`/visits/${id}/reject`, { reason }).then((r) => r.data),
  cancel: (id, reason) => api.post(`/visits/${id}/cancel`, { reason }).then((r) => r.data),
  updateVisit: (id, payload) => api.patch(`/visits/${id}`, payload).then((r) => r.data),
  deleteVisit: (id) => api.delete(`/visits/${id}`).then((r) => r.data),

  featureCatalog: () => api.get('/features').then((r) => r.data),
  featureUsers: () => api.get('/features/users').then((r) => r.data),
  saveUserFeatures: (userId, overrides) =>
    api.put(`/features/users/${userId}`, { overrides }).then((r) => r.data),

  departments: () => api.get('/master/departments').then((r) => r.data),
  createDepartment: (p) => api.post('/master/departments', p).then((r) => r.data),
  updateDepartment: (id, p) => api.put(`/master/departments/${id}`, p).then((r) => r.data),
  deleteDepartment: (id) => api.delete(`/master/departments/${id}`).then((r) => r.data),
  pics: (departmentId) =>
    api.get('/master/pics', { params: departmentId ? { departmentId } : {} }).then((r) => r.data),
  users: () => api.get('/master/users').then((r) => r.data),
  createUser: (p) => api.post('/master/users', p).then((r) => r.data),
  updateUser: (id, p) => api.put(`/master/users/${id}`, p).then((r) => r.data),
  deleteUser: (id) => api.delete(`/master/users/${id}`).then((r) => r.data),
  downloadUserTemplate: () => api.get('/master/users/template', { responseType: 'blob' }),
  importUsers: (p) => api.post('/master/users/import', p).then((r) => r.data),
  downloadDeptTemplate: () => api.get('/master/departments/template', { responseType: 'blob' }),
  importDepartments: (p) => api.post('/master/departments/import', p).then((r) => r.data),

  waStatus: () => api.get('/wa/status').then((r) => r.data),
  waReconnect: () => api.post('/wa/reconnect').then((r) => r.data),
  waRestart: () => api.post('/wa/restart').then((r) => r.data),
  waLogout: () => api.post('/wa/logout').then((r) => r.data),
  waTest: (phone, message) => api.post('/wa/test', { phone, message }).then((r) => r.data),
  waLogs: () => api.get('/wa/logs').then((r) => r.data),
  waResend: (id) => api.post(`/wa/logs/${id}/resend`).then((r) => r.data),
  recipients: () => api.get('/wa/recipients').then((r) => r.data),
  addRecipient: (p) => api.post('/wa/recipients', p).then((r) => r.data),
  updateRecipient: (id, p) => api.put(`/wa/recipients/${id}`, p).then((r) => r.data),
  deleteRecipient: (id) => api.delete(`/wa/recipients/${id}`).then((r) => r.data)
};

export const fmtDateTime = (v) =>
  v
    ? new Date(v).toLocaleString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : '-';

export const fmtTime = (v) =>
  v ? new Date(v).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-';

export const fmtDate = (v) =>
  v
    ? new Date(v).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
    : '-';

export const todayISO = () => new Date().toISOString().slice(0, 10);
