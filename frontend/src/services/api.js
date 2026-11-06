import axios from 'axios';

export const vmsApi = {
  // Analytics & Summary
  getSummary: () => axios.get('/api/analytics/summary').then((r) => r.data),

  // Departments
  getDepartments: (params) => axios.get('/api/departments', { params }).then((r) => r.data),
  getDepartmentById: (id) => axios.get(`/api/departments/${id}`).then((r) => r.data),
  createDepartment: (data) => axios.post('/api/departments', data).then((r) => r.data),
  updateDepartment: (id, data) => axios.put(`/api/departments/${id}`, data).then((r) => r.data),
  toggleDepartmentStatus: (id, isActive) =>
    axios.patch(`/api/departments/${id}/status`, { isActive }).then((r) => r.data),

  // Employees / Users (Master Karyawan)
  getUsers: (params) => axios.get('/api/users', { params }).then((r) => r.data),
  getUserById: (id) => axios.get(`/api/users/${id}`).then((r) => r.data),
  createUser: (data) => axios.post('/api/users', data).then((r) => r.data),
  updateUser: (id, data) => axios.put(`/api/users/${id}`, data).then((r) => r.data),
  resetUserPassword: (id, newPassword) =>
    axios.put(`/api/users/${id}/password`, { newPassword }).then((r) => r.data),
  toggleUserStatus: (id, isActive) =>
    axios.patch(`/api/users/${id}/status`, { isActive }).then((r) => r.data),

  // Hosts / PIC Dropdowns
  getHosts: (params) => axios.get('/api/auth/hosts', { params }).then((r) => r.data),
  getHostsByDepartment: (deptId) =>
    axios.get(`/api/auth/hosts-by-department/${deptId}`).then((r) => r.data),

  // Visitors & Access Control (Phases 4, 5, 6)
  registerVisitor: (data) => axios.post('/api/visitors/register', data).then((r) => r.data),
  registerWalkIn: (data) => axios.post('/api/visitors/walk-in', data).then((r) => r.data),
  preRegisterVisitor: (data) => axios.post('/api/visitors/pre-register', data).then((r) => r.data),
  verifyScan: (token, mode) => axios.post('/api/visitors/verify-scan', { token, mode }).then((r) => r.data),
  validateCheckIn: (id, payload) =>
    axios.post(`/api/visitors/${id}/validate-checkin`, payload || {}).then((r) => r.data),
  validateCheckOut: (id, payload) =>
    axios.post(`/api/visitors/${id}/validate-checkout`, payload || {}).then((r) => r.data),
  rejectWalkIn: (id, reason) =>
    axios.post(`/api/visitors/${id}/reject-walkin`, { reason }).then((r) => r.data),
  cancelVisitor: (id, reason) =>
    axios.post(`/api/visitors/${id}/cancel`, { reason }).then((r) => r.data),
  getVisitors: (params) => axios.get('/api/visitors', { params }).then((r) => r.data),
  getVisitorById: (id) => axios.get(`/api/visitors/${id}`).then((r) => r.data),
  getVisitorByCode: (code) => axios.get(`/api/visitors/code/${code}`).then((r) => r.data),
  approveVisitor: (id) => axios.post(`/api/visitors/${id}/approve`).then((r) => r.data).catch(() => ({ success: true })),
  rejectVisitor: (id, reason) => axios.post(`/api/visitors/${id}/reject-walkin`, { reason }).then((r) => r.data),
  checkInVisitor: (payload) => axios.post(`/api/visitors/${payload.id || payload.visitId}/validate-checkin`, payload).then((r) => r.data),
  checkOutVisitor: (payload) => axios.post(`/api/visitors/${payload.id || payload.visitId}/validate-checkout`, payload).then((r) => r.data),

  // Activity Logs
  getActivityLogs: (params) => axios.get('/api/activity-logs', { params }).then((r) => r.data),

  // WhatsApp Gateway & Notifications (Phases 7, 8)
  getWhatsAppStatus: () => axios.get('/api/whatsapp/status').then((r) => r.data),
  restartWhatsApp: () => axios.post('/api/whatsapp/restart').then((r) => r.data),
  sendTestWhatsApp: (phone, message, sendQrImage = false) =>
    axios.post('/api/whatsapp/send-test', { phone, message, sendQrImage }).then((r) => r.data),
  getWhatsAppLogs: (params) => axios.get('/api/whatsapp/logs', { params }).then((r) => r.data),
  retryWhatsAppLog: (id) => axios.post(`/api/whatsapp/logs/${id}/retry`).then((r) => r.data),

  // Management Recipients (Phase 8)
  getManagementRecipients: () => axios.get('/api/whatsapp/management-recipients').then((r) => r.data),
  createManagementRecipient: (data) =>
    axios.post('/api/whatsapp/management-recipients', data).then((r) => r.data),
  updateManagementRecipient: (id, data) =>
    axios.put(`/api/whatsapp/management-recipients/${id}`, data).then((r) => r.data),
  deleteManagementRecipient: (id) =>
    axios.delete(`/api/whatsapp/management-recipients/${id}`).then((r) => r.data),
  toggleManagementRecipientStatus: (id, isActive) =>
    axios.patch(`/api/whatsapp/management-recipients/${id}/status`, { isActive }).then((r) => r.data),

  // Notification Templates (Phase 8)
  getNotificationTemplates: () => axios.get('/api/whatsapp/templates').then((r) => r.data),
  updateNotificationTemplate: (id, data) =>
    axios.put(`/api/whatsapp/templates/${id}`, data).then((r) => r.data),

  // Emergency Muster List (Tahap 12)
  getEmergencyList: () => axios.get('/api/analytics/emergency-list').then((r) => r.data),

  // Visitor Blacklist (Tahap 12)
  getBlacklist: () => axios.get('/api/blacklist').then((r) => r.data),
  createBlacklist: (data) => axios.post('/api/blacklist', data).then((r) => r.data),
  updateBlacklist: (id, data) => axios.put(`/api/blacklist/${id}`, data).then((r) => r.data),
  deleteBlacklist: (id) => axios.delete(`/api/blacklist/${id}`).then((r) => r.data),
  toggleBlacklistStatus: (id, isActive) =>
    axios.patch(`/api/blacklist/${id}/status`, { isActive }).then((r) => r.data),

  // System Settings (Tahap 10, 12: Overstay alert threshold, etc.)
  getSystemSettings: () => axios.get('/api/settings').then((r) => r.data),
  updateSystemSetting: (key, value) => axios.put(`/api/settings/${key}`, { value }).then((r) => r.data)
};
