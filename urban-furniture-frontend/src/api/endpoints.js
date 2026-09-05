import apiClient from './axios';

// ---------- Auth ----------
export const login = (email, password) =>
  apiClient.post('/api/auth/login', { email, password }).then((r) => r.data);
export const fetchMe = () => apiClient.get('/api/auth/me').then((r) => r.data);
export const createStaffUser = (payload) =>
  apiClient.post('/api/auth/users', payload).then((r) => r.data);
export const listStaffUsers = () => apiClient.get('/api/auth/users').then((r) => r.data);

// ---------- Contacts ----------
export const listContacts = (includeArchived = false) =>
  apiClient.get('/api/contacts/', { params: { include_archived: includeArchived } }).then((r) => r.data);
export const createContact = (payload) => apiClient.post('/api/contacts/', payload).then((r) => r.data);
export const updateContact = (id, payload) => apiClient.put(`/api/contacts/${id}`, payload).then((r) => r.data);
export const archiveContact = (id, restore = false) =>
  apiClient.post(`/api/contacts/${id}/archive`, null, { params: { restore } }).then((r) => r.data);
export const uploadContactImage = (id, file) => {
  const form = new FormData();
  form.append('file', file);
  return apiClient
    .post(`/api/contacts/${id}/profile-image`, form, { headers: { 'Content-Type': 'multipart/form-data' } })
    .then((r) => r.data);
};

// ---------- Products ----------
export const listProducts = (includeArchived = false) =>
  apiClient.get('/api/products/', { params: { include_archived: includeArchived } }).then((r) => r.data);
export const createProduct = (payload) => apiClient.post('/api/products/', payload).then((r) => r.data);
export const updateProduct = (id, payload) => apiClient.put(`/api/products/${id}`, payload).then((r) => r.data);
export const archiveProduct = (id, restore = false) =>
  apiClient.post(`/api/products/${id}/archive`, null, { params: { restore } }).then((r) => r.data);

// ---------- Chart of Accounts ----------
export const listAccounts = (includeArchived = false) =>
  apiClient.get('/api/chart-of-accounts/', { params: { include_archived: includeArchived } }).then((r) => r.data);
export const createAccount = (payload) => apiClient.post('/api/chart-of-accounts/', payload).then((r) => r.data);
export const updateAccount = (id, payload) =>
  apiClient.put(`/api/chart-of-accounts/${id}`, payload).then((r) => r.data);
export const archiveAccount = (id, restore = false) =>
  apiClient.post(`/api/chart-of-accounts/${id}/archive`, null, { params: { restore } }).then((r) => r.data);
export const listAccountBalances = (asOfDate) =>
  apiClient.get('/api/accounts/', { params: { as_of_date: asOfDate || undefined } }).then((r) => r.data);

// ---------- Journals ----------
export const listJournals = (includeArchived = false) =>
  apiClient.get('/api/journals/', { params: { include_archived: includeArchived } }).then((r) => r.data);
export const createJournal = (payload) => apiClient.post('/api/journals/', payload).then((r) => r.data);
export const updateJournal = (id, payload) => apiClient.put(`/api/journals/${id}`, payload).then((r) => r.data);
export const archiveJournal = (id, restore = false) =>
  apiClient.post(`/api/journals/${id}/archive`, null, { params: { restore } }).then((r) => r.data);

// ---------- Documents / Transactions ----------
export const listDocuments = () => apiClient.get('/api/documents/').then((r) => r.data);
export const createDocument = (payload) => apiClient.post('/api/documents/', payload).then((r) => r.data);
export const convertDocument = (id) => apiClient.post(`/api/documents/${id}/convert`).then((r) => r.data);
export const confirmDocument = (id) => apiClient.post(`/api/documents/${id}/confirm`).then((r) => r.data);
export const listDocumentPayments = (id) =>
  apiClient.get(`/api/documents/${id}/payments`).then((r) => r.data);

// ---------- Payments ----------
export const createPayment = (payload) => apiClient.post('/api/payments/', payload).then((r) => r.data);
export const listPayments = () => apiClient.get('/api/payments/').then((r) => r.data);

// ---------- Journal Entries ----------
export const listJournalEntries = () => apiClient.get('/api/journal-entries/').then((r) => r.data);

// ---------- Analytic Accounts ----------
export const listAnalytics = (includeArchived = false) =>
  apiClient.get('/api/analytics/', { params: { include_archived: includeArchived } }).then((r) => r.data);
export const createAnalytic = (payload) => apiClient.post('/api/analytics/', payload).then((r) => r.data);
export const updateAnalytic = (id, payload) => apiClient.put(`/api/analytics/${id}`, payload).then((r) => r.data);
export const archiveAnalytic = (id, restore = false) =>
  apiClient.post(`/api/analytics/${id}/archive`, null, { params: { restore } }).then((r) => r.data);

// ---------- Budgets ----------
export const listBudgets = (includeArchived = false) =>
  apiClient.get('/api/budgets/', { params: { include_archived: includeArchived } }).then((r) => r.data);
export const createBudget = (payload) => apiClient.post('/api/budgets/', payload).then((r) => r.data);
export const updateBudget = (id, payload) => apiClient.put(`/api/budgets/${id}`, payload).then((r) => r.data);
export const archiveBudget = (id, restore = false) =>
  apiClient.post(`/api/budgets/${id}/archive`, null, { params: { restore } }).then((r) => r.data);

// ---------- Reports ----------
export const getPnL = (startDate, endDate) =>
  apiClient
    .get('/api/reports/pnl', { params: { start_date: startDate || undefined, end_date: endDate || undefined } })
    .then((r) => r.data);
export const getBalanceSheet = (asOfDate) =>
  apiClient.get('/api/reports/balance-sheet', { params: { as_of_date: asOfDate || undefined } }).then((r) => r.data);
export const getBudgetReport = (asOfDate) =>
  apiClient.get('/api/reports/budget', { params: { as_of_date: asOfDate || undefined } }).then((r) => r.data);
export const getStockReport = (includeArchived = false) =>
  apiClient.get('/api/reports/stock', { params: { include_archived: includeArchived } }).then((r) => r.data);