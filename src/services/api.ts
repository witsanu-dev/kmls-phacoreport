import axios from 'axios';
import { Patient, Ward, DashboardData, User } from '../types';

// API client base URL
const API_BASE = './api';

export const api = {
  // Login endpoint
  login: async (username: string, password: string): Promise<{ success: boolean; message: string; user?: User }> => {
    const res = await axios.post(`${API_BASE}/auth.php?action=login`, { username, password });
    return res.data;
  },

  // Logout endpoint
  logout: async (): Promise<{ success: boolean; message: string }> => {
    const res = await axios.post(`${API_BASE}/auth.php?action=logout`);
    return res.data;
  },

  // Check current session
  checkAuth: async (): Promise<{ success: boolean; authenticated: boolean; user: User | null }> => {
    const res = await axios.get(`${API_BASE}/auth.php?action=me`);
    return res.data;
  },

  // List users (Admin only)
  listUsers: async (): Promise<{ success: boolean; users?: User[]; message?: string }> => {
    const res = await axios.get(`${API_BASE}/auth.php?action=list_users`);
    return res.data;
  },

  // Get active wards list
  getWards: async (): Promise<Ward[]> => {
    const res = await axios.get(`${API_BASE}/get_wards.php`);
    return res.data.success ? res.data.data : [];
  },

  // Get active providers/surgeons list from provider table
  getProviders: async (type?: string): Promise<{ id: number; name: string; provider_type: string; position?: string }[]> => {
    const res = await axios.get(`${API_BASE}/get_providers.php`, { params: { type } });
    return res.data.success ? res.data.data : [];
  },

  // Get patients with filter options
  getPatients: async (params?: {
    status?: string;
    ward?: string;
    surgeon?: string;
    surgery_date?: string;
    surgery_method?: string;
    keyword?: string;
    limit?: number;
  }): Promise<Patient[]> => {
    const res = await axios.get(`${API_BASE}/get_patients.php`, { params });
    return res.data.success ? res.data.data : [];
  },

  // Get single patient by ID
  getPatientById: async (id: number): Promise<Patient | null> => {
    const res = await axios.get(`${API_BASE}/get_patients.php`, { params: { id } });
    return res.data.success ? res.data.data : null;
  },

  // Search patients select combobox
  searchPatients: async (q: string) => {
    const res = await axios.get(`${API_BASE}/get_patients.php`, { params: { select2: 1, q } });
    return res.data.results || [];
  },

  // Get dashboard metrics and charts data
  getDashboard: async (date?: string, status?: string, method?: string): Promise<DashboardData | null> => {
    const res = await axios.get(`${API_BASE}/get_dashboard.php`, { params: { date, status, method } });
    return res.data.success ? res.data : null;
  },

  // Save/Update patient queue & status
  saveQueue: async (data: Partial<Patient>): Promise<{ success: boolean; message: string }> => {
    const res = await axios.post(`${API_BASE}/save_queue.php`, data);
    return res.data;
  },

  // Get current DB config (password masked)
  getDbConfig: async (): Promise<{ success: boolean; config?: Record<string, string>; connection?: { ok: boolean; version?: string; error?: string } }> => {
    const res = await axios.get(`${API_BASE}/get_db_config.php`);
    return res.data;
  },

  // Save new DB config (test connection first on server side)
  saveDbConfig: async (cfg: Record<string, string>): Promise<{ success: boolean; message: string; version?: string }> => {
    const res = await axios.post(`${API_BASE}/get_db_config.php`, cfg);
    return res.data;
  },
};
