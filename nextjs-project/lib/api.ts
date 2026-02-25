const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

const AUTH_TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const USER_KEY = 'auth_user';

export interface Server {
  id: number;
  name: string;
  type: 'proxmox' | 'generic';
  ip_address: string;
  port: number;
  username?: string;
  password?: string;
  description?: string;
  status: 'active' | 'inactive' | 'error';
  node?: string;
  realm?: string;
  verify_ssl?: boolean;
  cluster_name?: string;
  last_sync?: string;
  created_at: string;
  updated_at: string;
}

export interface License {
  id: number;
  server_id: number;
  name: string;
  product: string;
  vendor: string;
  license_key: string;
  type: 'perpetual' | 'subscription' | 'trial' | 'open_source';
  status: 'active' | 'expired' | 'expiring_soon' | 'inactive';
  seats: number;
  seats_used: number;
  license_metric?: 'per_seat' | 'per_core' | 'per_cpu' | 'floating' | 'subscription';
  support_contact?: string;
  auto_renewal?: boolean;
  compliance_status?: 'compliant' | 'non_compliant' | 'warning' | 'under_review' | 'unknown';
  last_audit_date?: string;
  next_audit_date?: string;
  purchase_date: string;
  expiration_date?: string;
  renewal_date?: string;
  cost: number;
  currency: string;
  purchase_order_num?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  server_name?: string;
  server_ip?: string;
  server_status?: string;
}

export interface LicenseComplianceRequirement {
  id: number;
  license_id: number;
  requirement: string;
  description?: string;
  status: 'compliant' | 'non_compliant' | 'pending' | 'not_applicable';
  evidence?: string;
  due_date?: string;
  resolved_date?: string;
  assigned_to?: string;
  created_at: string;
  updated_at: string;
}

export interface RenewalHistory {
  id: number;
  license_id: number;
  renewal_date: string;
  previous_expiration?: string;
  new_expiration?: string;
  cost: number;
  currency: string;
  vendor_invoice?: string;
  notes?: string;
  renewed_by?: string;
  created_at: string;
}

export interface LicenseReport {
  total_licenses: number;
  active_licenses: number;
  expiring_licenses: number;
  expired_licenses: number;
  total_cost: number;
  cost_by_vendor: Record<string, number>;
  utilization_by_license: Record<string, number>;
  licenses_by_type: Record<string, number>;
  licenses_by_status: Record<string, number>;
}

export interface UtilizationReport {
  id: number;
  name: string;
  product: string;
  vendor: string;
  seats: number;
  seats_used: number;
  utilization_percentage: number;
  status: string;
}

export interface VendorSpendReport {
  vendor: string;
  total_cost: number;
  license_count: number;
}

export interface ExpiringLicenseReport {
  id: number;
  product: string;
  vendor: string;
  expiration_date: string;
  days_until_expire: number;
  cost: number;
  auto_renewal: boolean;
}

export interface User {
  id: number;
  username: string;
  email: string;
  full_name?: string;
  department?: string;
  role: 'admin' | 'manager' | 'user' | 'viewer';
  status: 'active' | 'inactive' | 'suspended';
  phone?: string;
  created_at: string;
  updated_at: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  user: User;
}

export interface CreateUserRequest {
  username: string;
  email: string;
  full_name?: string;
  department?: string;
  role: 'admin' | 'manager' | 'user' | 'viewer';
  status?: 'active' | 'inactive' | 'suspended';
  phone?: string;
  password: string;
}

export interface LicenseUser {
  id: number;
  license_id: number;
  user_id: number;
  assigned_at: string;
  assigned_by?: string;
  role: 'owner' | 'admin' | 'user' | 'viewer';
  notes?: string;
  username: string;
  full_name?: string;
  email: string;
  department?: string;
  status: string;
}

export interface Compliance {
  id: number;
  server_id?: number;
  license_id?: number;
  title: string;
  description: string;
  status: 'compliant' | 'non_compliant' | 'warning' | 'under_review';
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  category: string;
  framework?: string;
  requirement?: string;
  evidence?: string;
  remediation?: string;
  assigned_to?: string;
  due_date?: string;
  resolved_date?: string;
  last_audit_date?: string;
  next_audit_date?: string;
  created_at: string;
  updated_at: string;
  server_name?: string;
  license_name?: string;
  product_name?: string;
}

export interface ComplianceReport {
  total_compliance: number;
  compliant_count: number;
  non_compliant_count: number;
  warning_count: number;
  under_review_count: number;
  compliance_percentage: number;
  by_severity: Record<string, number>;
  by_category: Record<string, number>;
  by_framework: Record<string, number>;
}

export interface Monitor {
  id: number;
  name: string;
  type: 'http' | 'ping';
  target: string;
  interval: number;
  status: 'up' | 'down' | 'pending';
  last_check?: string;
  latency: number;
  uptime: number;
  created_at: string;
  updated_at: string;
}

export interface MonitorLog {
  id: number;
  monitor_id: number;
  status: 'up' | 'down' | 'pending';
  latency: number;
  message: string;
  checked_at: string;
}

export interface InfrastructureNode {
  id: number;
  server_name: string;
  node_name: string;
  server_type: string;
  ip_address: string;
  server_status: string;
  last_sync: string;
  node_status: string;
  cpu: number;
  memory: number;
  max_memory: number;
  memory_percent: number;
  uptime: number;
  vm_count: number;
  lxc_count: number;
  running_vms: number;
  running_lxcs: number;
  total_instances: number;
  created_at: string;
  updated_at: string;
}

export interface ServerLogEntry {
  time: number;
  node: string;
  user: string;
  tag: string;
  pri: number;
  msg: string;
}

export interface LXC {
  vmid: number;
  name: string;
  status: 'running' | 'stopped';
  uptime: number;
  cpus: number;
  mem: number;
  maxmem: number;
}

export interface AlertRule {
  id: number;
  name: string;
  type: 'monitor' | 'infrastructure';
  target_id: number;
  condition_type: 'status_down' | 'cpu_high' | 'memory_high' | 'latency_high' | 'uptime_low';
  threshold: number;
  comparison: '>' | '>=' | '<' | '<=' | '=';
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface Alert {
  id: number;
  alert_rule_id: number;
  type: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  message: string;
  current_value: number;
  target_id: number;
  target_name: string;
  status: 'active' | 'acknowledged' | 'resolved';
  acknowledged_at?: string;
  acknowledged_by?: string;
  resolved_at?: string;
  created_at: string;
}

export interface AuditLog {
  id: number;
  user_id?: number;
  username?: string;
  action: string;
  resource: string;
  resource_id?: number;
  details?: string;
  ip_address?: string;
  timestamp: string;
}

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function getStoredUser(): User | null {
  if (typeof window === 'undefined') return null;
  const userStr = localStorage.getItem(USER_KEY);
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
}

export function isAuthenticated(): boolean {
  return !!getToken();
}

export function hasPermission(resource: string, action: 'create' | 'read' | 'update' | 'delete'): boolean {
  const user = getStoredUser();
  if (!user) return false;

  const permissions: Record<string, Record<string, string[]>> = {
    admin: {
      servers: ['create', 'read', 'update', 'delete'],
      licenses: ['create', 'read', 'update', 'delete'],
      compliance: ['create', 'read', 'update', 'delete'],
      users: ['create', 'read', 'update', 'delete'],
      alerts: ['create', 'read', 'update', 'delete'],
      monitors: ['create', 'read', 'update', 'delete'],
    },
    manager: {
      servers: ['create', 'read', 'update', 'delete'],
      licenses: ['create', 'read', 'update', 'delete'],
      compliance: ['create', 'read', 'update', 'delete'],
      users: ['read'],
      alerts: ['create', 'read', 'update', 'delete'],
      monitors: ['create', 'read', 'update', 'delete'],
    },
    user: {
      servers: ['read'],
      licenses: ['create', 'read', 'update'],
      compliance: ['read'],
      users: [],
      alerts: ['read'],
      monitors: ['read'],
    },
    viewer: {
      servers: ['read'],
      licenses: ['read'],
      compliance: ['read'],
      users: ['read'],
      alerts: ['read'],
      monitors: ['read'],
    },
  };

  const rolePermissions = permissions[user.role];
  if (!rolePermissions) return false;
  return rolePermissions[resource]?.includes(action) ?? false;
}

async function refreshAccessToken(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!response.ok) {
      clearAuth();
      return false;
    }

    const data = await response.json();
    localStorage.setItem(AUTH_TOKEN_KEY, data.access_token);
    localStorage.setItem(REFRESH_TOKEN_KEY, data.refresh_token);
    return true;
  } catch {
    clearAuth();
    return false;
  }
}

export function clearAuth(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

function subscribeTokenRefresh(callback: (token: string) => void) {
  refreshSubscribers.push(callback);
}

function onTokenRefreshed(token: string) {
  refreshSubscribers.forEach(callback => callback(token));
  refreshSubscribers = [];
}

async function fetchAPI(endpoint: string, options?: RequestInit): Promise<any> {
  const token = getToken();
  
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });

  if (response.status === 401 && !isRefreshing) {
    isRefreshing = true;
    const refreshed = await refreshAccessToken();
    isRefreshing = false;

    if (refreshed) {
      const newToken = getToken();
      if (newToken) {
        onTokenRefreshed(newToken);
        const retryResponse = await fetch(`${API_BASE_URL}${endpoint}`, {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${newToken}`,
            ...options?.headers,
          },
        });
        const data = await retryResponse.json();
        if (!retryResponse.ok) {
          throw new Error(data.error || 'Request failed');
        }
        return data;
      }
    }
    
    clearAuth();
    window.location.href = '/login';
    throw new Error('Session expired');
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }

  return response.json();
}

export const authAPI = {
  login: async (username: string, password: string): Promise<LoginResponse> => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Login failed' }));
      throw new Error(error.error || 'Login failed');
    }

    const data: LoginResponse = await response.json();
    localStorage.setItem(AUTH_TOKEN_KEY, data.access_token);
    localStorage.setItem(REFRESH_TOKEN_KEY, data.refresh_token);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    return data;
  },

  logout: async (): Promise<void> => {
    const refreshToken = getRefreshToken();
    if (refreshToken) {
      try {
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token: refreshToken }),
        });
      } catch {
        // Ignore logout errors
      }
    }
    clearAuth();
  },

  getCurrentUser: async (): Promise<User> => {
    return fetchAPI('/auth/me');
  },

  changePassword: async (oldPassword: string, newPassword: string): Promise<void> => {
    await fetchAPI('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ old_password: oldPassword, new_password: newPassword }),
    });
  },
};

export const alertsAPI = {
  getRules: (): Promise<AlertRule[]> => fetchAPI('/alerts/rules'),
  createRule: (data: Partial<AlertRule>): Promise<{ id: number; message: string }> =>
    fetchAPI('/alerts/rules', { method: 'POST', body: JSON.stringify(data) }),
  deleteRule: (id: number): Promise<{ message: string }> =>
    fetchAPI(`/alerts/rules/${id}`, { method: 'DELETE' }),
  getAlerts: (filters?: { status?: string; severity?: string }): Promise<Alert[]> => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.severity) params.append('severity', filters.severity);
    return fetchAPI(`/alerts${params.toString() ? `?${params}` : ''}`);
  },
  acknowledge: (id: number): Promise<{ message: string }> =>
    fetchAPI(`/alerts/${id}/acknowledge`, { method: 'POST' }),
  resolve: (id: number): Promise<{ message: string }> =>
    fetchAPI(`/alerts/${id}/resolve`, { method: 'POST' }),
};

export const serversAPI = {
  getAll: (): Promise<Server[]> => fetchAPI('/servers'),
  getById: (id: number): Promise<Server> => fetchAPI(`/servers/${id}`),
  create: (data: Partial<Server>): Promise<{ id: number; message: string }> =>
    fetchAPI('/servers', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: Partial<Server>): Promise<{ message: string }> =>
    fetchAPI(`/servers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number): Promise<{ message: string }> =>
    fetchAPI(`/servers/${id}`, { method: 'DELETE' }),
  testConnection: (id: number): Promise<{ connected: boolean; status?: string; error?: string }> =>
    fetchAPI(`/servers/${id}/test`, { method: 'POST' }),
  getLogs: (id: number): Promise<ServerLogEntry[]> =>
    fetchAPI(`/servers/${id}/logs`),
  getLXCs: (id: number): Promise<LXC[]> =>
    fetchAPI(`/servers/${id}/lxcs`),
  createLXC: (id: number, data: { vmid: number; ostemplate: string; storage: string; params?: Record<string, string> }): Promise<{ message: string }> =>
    fetchAPI(`/servers/${id}/lxcs`, { method: 'POST', body: JSON.stringify(data) }),
  manageLXC: (id: number, vmid: number, action: 'start' | 'stop' | 'remove'): Promise<{ message: string }> =>
    fetchAPI(`/servers/${id}/lxcs/${vmid}/${action}`, { method: 'POST' }),
};

export const licensesAPI = {
  getAll: (serverId?: number): Promise<License[]> =>
    fetchAPI(`/licenses${serverId ? `?server_id=${serverId}` : ''}`),
  getById: (id: number): Promise<License> => fetchAPI(`/licenses/${id}`),
  create: (data: Partial<License>): Promise<{ id: number; message: string }> =>
    fetchAPI('/licenses', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: Partial<License>): Promise<{ message: string }> =>
    fetchAPI(`/licenses/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number): Promise<{ message: string }> =>
    fetchAPI(`/licenses/${id}`, { method: 'DELETE' }),
  getExpiring: (days: number = 30): Promise<License[]> =>
    fetchAPI(`/licenses/expiring?days=${days}`),
  getComplianceRequirements: (licenseId: number): Promise<LicenseComplianceRequirement[]> =>
    fetchAPI(`/licenses/${licenseId}/compliance`),
  createComplianceRequirement: (licenseId: number, data: Partial<LicenseComplianceRequirement>): Promise<{ id: number; message: string }> =>
    fetchAPI(`/licenses/${licenseId}/compliance`, { method: 'POST', body: JSON.stringify(data) }),
  updateComplianceRequirement: (id: number, data: Partial<LicenseComplianceRequirement>): Promise<{ message: string }> =>
    fetchAPI(`/licenses/compliance/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteComplianceRequirement: (id: number): Promise<{ message: string }> =>
    fetchAPI(`/licenses/compliance/${id}`, { method: 'DELETE' }),
  getRenewalHistory: (licenseId: number): Promise<RenewalHistory[]> =>
    fetchAPI(`/licenses/${licenseId}/renewals`),
  createRenewalRecord: (licenseId: number, data: Partial<RenewalHistory>): Promise<{ id: number; message: string }> =>
    fetchAPI(`/licenses/${licenseId}/renewals`, { method: 'POST', body: JSON.stringify(data) }),
  getReport: (): Promise<LicenseReport> => fetchAPI('/licenses/report'),
  getUtilization: (): Promise<UtilizationReport[]> => fetchAPI('/licenses/utilization'),
  getVendorSpend: (year?: number): Promise<VendorSpendReport[]> => 
    fetchAPI(`/licenses/vendor-spend${year ? `?year=${year}` : ''}`),
  getExpiringReport: (days: number = 30): Promise<ExpiringLicenseReport[]> =>
    fetchAPI(`/licenses/expiring-report?days=${days}`),
};

export const complianceAPI = {
  getAll: (filters?: { server_id?: number; status?: string; severity?: string }): Promise<Compliance[]> => {
    const params = new URLSearchParams();
    if (filters?.server_id) params.append('server_id', filters.server_id.toString());
    if (filters?.status) params.append('status', filters.status);
    if (filters?.severity) params.append('severity', filters.severity);
    return fetchAPI(`/compliance${params.toString() ? `?${params}` : ''}`);
  },
  getById: (id: number): Promise<Compliance> => fetchAPI(`/compliance/${id}`),
  create: (data: Partial<Compliance>): Promise<{ id: number; message: string }> =>
    fetchAPI('/compliance', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: Partial<Compliance>): Promise<{ message: string }> =>
    fetchAPI(`/compliance/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number): Promise<{ message: string }> =>
    fetchAPI(`/compliance/${id}`, { method: 'DELETE' }),
  getReport: (): Promise<ComplianceReport> => fetchAPI('/compliance/report'),
};

export const monitorsAPI = {
  getAll: (): Promise<Monitor[]> => fetchAPI('/monitors'),
  create: (data: Partial<Monitor>): Promise<{ id: number; message: string }> =>
    fetchAPI('/monitors', { method: 'POST', body: JSON.stringify(data) }),
  delete: (id: number): Promise<{ message: string }> =>
    fetchAPI(`/monitors/${id}`, { method: 'DELETE' }),
  getStats: (id: number): Promise<MonitorLog[]> => fetchAPI(`/monitors/${id}/stats`),
};

export const infrastructureAPI = {
  getNodes: (): Promise<InfrastructureNode[]> => fetchAPI('/infrastructure/nodes'),
};

export const usersAPI = {
  getAll: (filters?: { status?: string; department?: string }): Promise<User[]> => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.department) params.append('department', filters.department);
    return fetchAPI(`/users${params.toString() ? `?${params}` : ''}`);
  },
  getById: (id: number): Promise<User> => fetchAPI(`/users/${id}`),
  create: (data: CreateUserRequest): Promise<{ id: number; message: string }> =>
    fetchAPI('/users', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: Partial<User>): Promise<{ message: string }> =>
    fetchAPI(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number): Promise<{ message: string }> =>
    fetchAPI(`/users/${id}`, { method: 'DELETE' }),
  getLicenses: (id: number): Promise<License[]> =>
    fetchAPI(`/users/${id}/licenses`),
  importUsers: async (file: File): Promise<{ imported: number; failed: string[]; total: number }> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/users/import`, {
      method: 'POST',
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Import failed' }));
      throw new Error(error.error || 'Import failed');
    }

    return response.json();
  },
  downloadTemplate: (): void => {
    const token = getToken();
    const url = `${API_BASE_URL}/users/template`;
    fetch(url, token ? { headers: { 'Authorization': `Bearer ${token}` } } : {})
      .then(res => res.blob())
      .then(blob => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'user_template.csv';
        a.click();
      });
  },
};

export const licenseUsersAPI = {
  getUsers: (licenseId: number): Promise<LicenseUser[]> =>
    fetchAPI(`/licenses/${licenseId}/users`),
  assignUser: (licenseId: number, data: { user_id: number; role?: string; assigned_by?: string; notes?: string }): Promise<{ message: string }> =>
    fetchAPI(`/licenses/${licenseId}/users`, { method: 'POST', body: JSON.stringify(data) }),
  removeUser: (licenseId: number, userId: number): Promise<{ message: string }> =>
    fetchAPI(`/licenses/${licenseId}/users/${userId}`, { method: 'DELETE' }),
};

export const auditLogsAPI = {
  getAll: (): Promise<AuditLog[]> => fetchAPI('/audit-logs'),
};
