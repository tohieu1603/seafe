/**
 * API Client for BaseSystem
 * Uses environment variable for API URL
 */
console.log(`${process.env.NEXT_PUBLIC_API_URL}`)
const API_BASE_URL = typeof window !== 'undefined'
  ? (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8003')  // Client-side
  : (process.env.API_BACKEND_URL || 'http://localhost:8003')    // Server-side (for SSR)

interface RequestOptions extends RequestInit {
  token?: string
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { token, ...fetchOptions } = options

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(fetchOptions.headers as Record<string, string>),
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  // Call backend directly
  const url = `${API_BASE_URL}${endpoint}`
  const response = await fetch(url, {
    ...fetchOptions,
    headers,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Request failed' }))
    throw new Error(error.detail || `HTTP ${response.status}`)
  }

  return response.json()
}

// Auth APIs
export const authAPI = {
  login: (email: string, password: string) =>
    request('/api/users/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (data: any) =>
    request('/api/users/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  me: (token: string) =>
    request('/api/users/me', {
      token,
    }),

  getUsers: (token: string) =>
    request('/api/users/', {
      token,
    }),
}

// RBAC APIs
export const rbacAPI = {
  // Roles
  getRoles: (token?: string) =>
    request('/api/rbac/roles', token ? { token } : {}),

  getRole: (id: string, token?: string) =>
    request(`/api/rbac/roles/${id}`, token ? { token } : {}),

  createRole: (data: {
    name: string
    slug: string
    description?: string
    level: number
    color: string
    permission_ids?: string[]
  }, token: string) =>
    request('/api/rbac/roles', {
      method: 'POST',
      token,
      body: JSON.stringify(data),
    }),

  updateRole: (id: string, data: {
    name?: string
    slug?: string
    description?: string
    level?: number
    color?: string
  }, token: string) =>
    request(`/api/rbac/roles/${id}`, {
      method: 'PUT',
      token,
      body: JSON.stringify(data),
    }),

  deleteRole: (id: string, token: string, hardDelete = false) =>
    request(`/api/rbac/roles/${id}?hard_delete=${hardDelete}`, {
      method: 'DELETE',
      token,
    }),

  assignPermissionsToRole: (roleId: string, permissionIds: string[], token: string) =>
    request(`/api/rbac/roles/${roleId}/permissions`, {
      method: 'PUT',
      token,
      body: JSON.stringify({ permission_ids: permissionIds }),
    }),

  getRolePermissions: (roleId: string, token?: string) =>
    request(`/api/rbac/roles/${roleId}/permissions`, token ? { token } : {}),

  // Permissions
  getPermissions: (token?: string) =>
    request('/api/rbac/permissions', token ? { token } : {}),

  createPermission: (data: {
    name: string
    codename: string
    module: string
    action: string
    description?: string
  }, token: string) =>
    request('/api/rbac/permissions', {
      method: 'POST',
      token,
      body: JSON.stringify(data),
    }),

  updatePermission: (id: string, data: any, token: string) =>
    request(`/api/rbac/permissions/${id}`, {
      method: 'PUT',
      token,
      body: JSON.stringify(data),
    }),

  deletePermission: (id: string, token: string, hardDelete = false) =>
    request(`/api/rbac/permissions/${id}?hard_delete=${hardDelete}`, {
      method: 'DELETE',
      token,
    }),

  // User Roles
  assignRoleToUser: (userId: string, roleId: string, token: string) =>
    request('/api/rbac/user-roles', {
      method: 'POST',
      token,
      body: JSON.stringify({ user_id: userId, role_id: roleId }),
    }),

  bulkAssignRoleToUsers: (userIds: string[], roleId: string, token: string) =>
    request('/api/rbac/user-roles/bulk-assign-users', {
      method: 'POST',
      token,
      body: JSON.stringify({ user_ids: userIds, role_id: roleId }),
    }),

  // Stats
  getRoleStats: (token?: string) =>
    request('/api/rbac/stats/roles', token ? { token } : {}),
  getPermissionStats: (token?: string) =>
    request('/api/rbac/stats/permissions', token ? { token } : {}),
  getUserRoleStats: (token?: string) =>
    request('/api/rbac/stats/user-roles', token ? { token } : {}),
}

export default {
  auth: authAPI,
  rbac: rbacAPI,
}
