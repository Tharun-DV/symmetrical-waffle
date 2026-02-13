const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

export interface Server {
  id: number;
  name: string;
  type: 'proxmox' | 'generic';
  ip_address: string;
  port: number;
  username?: string;
  password?: string; // For creation/update
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

async function fetchAPI(endpoint: string, options?: RequestInit) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }

  return response.json();
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

export const alertsAPI = {
  getRules: (): Promise<AlertRule[]> => fetchAPI('/alerts/rules'),
  createRule: (data:Partial<AlertRule>): Promise<{ id: number; message: string }> =>
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
