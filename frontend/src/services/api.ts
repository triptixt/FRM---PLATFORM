import axios from 'axios';
import type {
  ApiResponse,
  DashboardSummary,
  Rule,
  Transaction,
  PageResponse,
  FraudCase,
  CaseAuditLog,
  BlacklistEntry,
  BlacklistStat,
  ScreeningRequest,
  ScreeningResultData,
} from '@/types';

const api = axios.create({
  baseURL: '/',
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('frm_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (typeof window !== 'undefined' && error.response?.status === 401) {
      localStorage.removeItem('frm_token');
      localStorage.removeItem('frm_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (username: string, password: string) =>
    api.post<{ token: string; username: string; role: string }>('/auth/login', { username, password }),
};

export const dashboardAPI = {
  summary: () => api.get<ApiResponse<DashboardSummary>>('/admin/dashboard/summary'),
};

export const rulesAPI = {
  list: () => api.get<ApiResponse<Rule[]>>('/admin/rules'),
  get: (id: number | string) => api.get<ApiResponse<Rule>>(`/admin/rules/${id}`),
  update: (id: number | string, body: { conditionJson?: any; riskScore?: number }) =>
    api.put<ApiResponse<Rule>>(`/admin/rules/${id}`, body),
  toggle: (id: number | string, status: 'ACTIVE' | 'INACTIVE') =>
    api.patch<ApiResponse<Rule>>(`/admin/rules/${id}/status?status=${status}`),
  refreshCache: () => api.get<ApiResponse<any>>('/admin/rules/cache'),
};

export const transactionsAPI = {
  list: (params?: {
    page?: number;
    size?: number;
    txnId?: string;
    merchantId?: string;
    decision?: string;
    paymentMode?: string;
    dateFrom?: string;
    dateTo?: string;
  }) => api.get<ApiResponse<PageResponse<Transaction>>>('/admin/transactions', { params }),
  get: (id: string) => api.get<ApiResponse<Transaction>>(`/admin/transactions/${id}`),
};

export const casesAPI = {
  list: (params?: { page?: number; size?: number; status?: string }) =>
    api.get<ApiResponse<PageResponse<FraudCase>>>('/admin/cases', { params }),
  get: (id: number | string) => api.get<ApiResponse<FraudCase>>(`/admin/cases/${id}`),
  update: (
    id: number | string,
    body: { caseStatus?: string; remarks?: string; assignedTo?: string }
  ) => api.patch<ApiResponse<FraudCase>>(`/admin/cases/${id}`, body),
  audit: (id: number | string) =>
    api.get<ApiResponse<CaseAuditLog[]>>(`/admin/cases/${id}/audit`),
};

export const blacklistAPI = {
  list: (params?: { listType?: string; entityType?: string; page?: number; size?: number }) =>
    api.get<ApiResponse<BlacklistEntry[]>>('/admin/blacklist', { params }),
  stats: () => api.get<ApiResponse<BlacklistStat[]>>('/admin/blacklist/stats'),
  add: (body: {
    entityType: string;
    entityValue: string;
    listType: string;
    riskLevel: string;
    source?: string;
    caseRef?: string;
    remarks?: string;
    expiryDays?: number | null;
  }) => api.post<ApiResponse<any>>('/admin/blacklist', body),
  delete: (id: number | string) => api.delete<ApiResponse<any>>(`/admin/blacklist/${id}`),
};

export const screeningAPI = {
  screen: (body: ScreeningRequest) =>
    api.post<ApiResponse<ScreeningResultData>>('/frm/screen', body),
  health: () => api.get<ApiResponse<string>>('/frm/health'),
};

export default api;

