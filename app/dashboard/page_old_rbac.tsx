'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Shield, Users, Key, Building2, LogOut } from 'lucide-react'

interface Stats {
  roles: { total_roles: number; active_roles: number; system_roles: number; custom_roles: number }
  permissions: { total_permissions: number; active_permissions: number; permissions_by_module: Record<string, number> }
  user_roles: { total_assignments: number; active_assignments: number; users_with_roles: number }
}

export default function DashboardPage() {
  const router = useRouter()
  const [stats, setStats] = useState<Stats | null>(null)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')

    if (!token || !userData) {
      router.push('/auth/login')
      return
    }

    setUser(JSON.parse(userData))
    fetchStats()
  }, [router])

  const fetchStats = async () => {
    try {
      const [rolesRes, permsRes, userRolesRes] = await Promise.all([
        fetch('/api/rbac/stats/roles'),
        fetch('/api/rbac/stats/permissions'),
        fetch('/api/rbac/stats/user-roles'),
      ])

      const [roles, permissions, user_roles] = await Promise.all([
        rolesRes.json(),
        permsRes.json(),
        userRolesRes.json(),
      ])

      setStats({ roles, permissions, user_roles })
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    router.push('/auth/login')
  }

  if (loading || !stats) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-primary animate-pulse mx-auto mb-4" />
          <p className="text-slate-600">Đang tải...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary rounded-lg">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">BaseSystem</h1>
                <p className="text-sm text-slate-600">RBAC Dashboard</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-slate-900">
                  {user?.first_name} {user?.last_name}
                </p>
                <p className="text-xs text-slate-600">{user?.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                title="Đăng xuất"
              >
                <LogOut className="w-5 h-5 text-slate-600" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Welcome */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-slate-900 mb-2">
            Chào mừng, {user?.first_name}! 👋
          </h2>
          <p className="text-slate-600">
            Quản lý hệ thống phân quyền của bạn
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-indigo-100 rounded-lg">
                <Shield className="w-6 h-6 text-indigo-600" />
              </div>
              <span className="text-xs font-medium text-slate-500 uppercase">Roles</span>
            </div>
            <p className="text-3xl font-bold text-slate-900 mb-1">
              {stats.roles.active_roles}
            </p>
            <p className="text-sm text-slate-600">
              {stats.roles.system_roles} hệ thống, {stats.roles.custom_roles} tùy chỉnh
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-emerald-100 rounded-lg">
                <Key className="w-6 h-6 text-emerald-600" />
              </div>
              <span className="text-xs font-medium text-slate-500 uppercase">Permissions</span>
            </div>
            <p className="text-3xl font-bold text-slate-900 mb-1">
              {stats.permissions.active_permissions}
            </p>
            <p className="text-sm text-slate-600">
              {Object.keys(stats.permissions.permissions_by_module).length} modules
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-xs font-medium text-slate-500 uppercase">User Roles</span>
            </div>
            <p className="text-3xl font-bold text-slate-900 mb-1">
              {stats.user_roles.users_with_roles}
            </p>
            <p className="text-sm text-slate-600">
              {stats.user_roles.active_assignments} phân quyền
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Building2 className="w-6 h-6 text-purple-600" />
              </div>
              <span className="text-xs font-medium text-slate-500 uppercase">Departments</span>
            </div>
            <p className="text-3xl font-bold text-slate-900 mb-1">8</p>
            <p className="text-sm text-slate-600">Phòng ban</p>
          </div>
        </div>

        {/* Permissions by Module */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">
            Phân bổ quyền theo Module
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Object.entries(stats.permissions.permissions_by_module)
              .sort((a, b) => b[1] - a[1])
              .map(([module, count]) => (
                <div
                  key={module}
                  className="p-4 bg-slate-50 rounded-lg border border-slate-200"
                >
                  <p className="text-sm font-medium text-slate-600 capitalize mb-1">
                    {module}
                  </p>
                  <p className="text-2xl font-bold text-slate-900">{count}</p>
                </div>
              ))}
          </div>
        </div>
      </main>
    </div>
  )
}
