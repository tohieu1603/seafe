'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Users as UsersIcon, Shield, Plus, Mail, Building2, Search, Filter, X, Settings, UserCog } from 'lucide-react'
import { authAPI, rbacAPI } from '@/lib/api'

interface User {
  id: string
  email: string
  first_name: string
  last_name: string
  is_active: boolean
  user_type: string
  department?: {
    id: string
    name: string
    code: string
  }
  roles: Role[]
}

interface Role {
  id: string
  name: string
  slug: string
  color: string
  level: number
}

interface Permission {
  id: string
  name: string
  codename: string
  module: string
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [loading, setLoading] = useState(true)

  // Modal state
  const [showModal, setShowModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([])
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<string[]>([])
  const [savingAssignment, setSavingAssignment] = useState(false)

  // Filters - Filament3 style
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [userTypeFilter, setUserTypeFilter] = useState<string>('all')

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [users, searchQuery, statusFilter, roleFilter, userTypeFilter])

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        alert('Vui lòng đăng nhập')
        return
      }

      const [usersData, rolesData, permissionsData] = await Promise.all([
        authAPI.getUsers(token),
        rbacAPI.getRoles(),
        rbacAPI.getPermissions()
      ])

      setUsers(usersData)
      setRoles(rolesData)
      setPermissions(permissionsData)
    } catch (error) {
      console.error('Failed to fetch data:', error)
      alert('Không thể tải dữ liệu: ' + (error instanceof Error ? error.message : ''))
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let result = [...users]

    // Search filter
    if (searchQuery) {
      result = result.filter(user =>
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.last_name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter(user =>
        statusFilter === 'active' ? user.is_active : !user.is_active
      )
    }

    // Role filter
    if (roleFilter !== 'all') {
      if (roleFilter === 'no-role') {
        result = result.filter(user => user.roles.length === 0)
      } else {
        result = result.filter(user =>
          user.roles.some(role => role.id === roleFilter)
        )
      }
    }

    // User type filter
    if (userTypeFilter !== 'all') {
      result = result.filter(user => user.user_type === userTypeFilter)
    }

    setFilteredUsers(result)
  }

  const clearFilters = () => {
    setSearchQuery('')
    setStatusFilter('all')
    setRoleFilter('all')
    setUserTypeFilter('all')
  }

  const openAssignModal = (user: User) => {
    setSelectedUser(user)
    setSelectedRoleIds(user.roles.map(r => r.id))
    // TODO: Fetch user's current permissions
    setSelectedPermissionIds([])
    setShowModal(true)
  }

  const handleSaveAssignment = async () => {
    if (!selectedUser) return

    setSavingAssignment(true)
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        alert('Vui lòng đăng nhập lại')
        return
      }

      // Assign roles
      for (const roleId of selectedRoleIds) {
        if (!selectedUser.roles.some(r => r.id === roleId)) {
          await rbacAPI.assignRoleToUser(selectedUser.id, roleId, token)
        }
      }

      // TODO: Remove unselected roles
      // TODO: Assign direct permissions if needed

      alert('Đã lưu thành công!')
      setShowModal(false)
      await fetchData()
    } catch (error) {
      console.error('Failed to save assignment:', error)
      alert('Lưu thất bại: ' + (error instanceof Error ? error.message : 'Lỗi không xác định'))
    } finally {
      setSavingAssignment(false)
    }
  }

  const toggleRole = (roleId: string) => {
    if (selectedRoleIds.includes(roleId)) {
      setSelectedRoleIds(selectedRoleIds.filter(id => id !== roleId))
    } else {
      setSelectedRoleIds([...selectedRoleIds, roleId])
    }
  }

  const togglePermission = (permissionId: string) => {
    if (selectedPermissionIds.includes(permissionId)) {
      setSelectedPermissionIds(selectedPermissionIds.filter(id => id !== permissionId))
    } else {
      setSelectedPermissionIds([...selectedPermissionIds, permissionId])
    }
  }

  const getUserTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      customer: 'Khách hàng',
      employee: 'Nhân viên',
      manager: 'Quản lý'
    }
    return labels[type] || type
  }

  const getUserTypeBadgeColor = (type: string) => {
    const colors: Record<string, string> = {
      customer: 'bg-blue-100 text-blue-700',
      employee: 'bg-green-100 text-green-700',
      manager: 'bg-purple-100 text-purple-700'
    }
    return colors[type] || 'bg-slate-100 text-slate-700'
  }

  const hasActiveFilters = searchQuery || statusFilter !== 'all' || roleFilter !== 'all' || userTypeFilter !== 'all'

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-slate-600">Đang tải...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full max-w-7xl mx-auto overflow-x-hidden">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 flex items-center gap-2 sm:gap-3">
              <UsersIcon className="w-6 h-6 sm:w-8 sm:h-8 text-indigo-600" />
              Quản lý Người dùng
            </h1>
            <p className="text-sm sm:text-base text-slate-600 mt-1">
              Quản lý người dùng và gán vai trò
            </p>
          </div>
          <Link
            href="/dashboard/users/create"
            className="w-full sm:w-auto px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 hover:shadow-xl hover:shadow-indigo-600/40 hover:scale-105"
          >
            <Plus className="w-5 h-5" />
            <span>Thêm người dùng</span>
          </Link>
        </div>
      </div>

      {/* Filters - Filament3 Style */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6 mb-4 sm:mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-slate-600" />
          <h3 className="font-semibold text-slate-900">Bộ lọc</h3>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="ml-auto text-xs sm:text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
            >
              <X className="w-4 h-4" />
              <span className="hidden sm:inline">Xóa bộ lọc</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Tìm kiếm
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm theo tên, email..."
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* User Type Filter */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Loại người dùng
            </label>
            <select
              value={userTypeFilter}
              onChange={(e) => setUserTypeFilter(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="all">Tất cả</option>
              <option value="customer">Khách hàng</option>
              <option value="employee">Nhân viên</option>
              <option value="manager">Quản lý</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Trạng thái
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="all">Tất cả</option>
              <option value="active">Đang hoạt động</option>
              <option value="inactive">Không hoạt động</option>
            </select>
          </div>

          {/* Role Filter */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Vai trò
            </label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="all">Tất cả vai trò</option>
              <option value="no-role">Chưa có vai trò</option>
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Filter Summary */}
        {hasActiveFilters && (
          <div className="mt-4 pt-4 border-t border-slate-200">
            <div className="flex items-center gap-2 text-sm text-slate-600 flex-wrap">
              <span className="font-medium">Đang lọc:</span>
              {searchQuery && (
                <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded">
                  Tìm kiếm: "{searchQuery}"
                </span>
              )}
              {userTypeFilter !== 'all' && (
                <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded">
                  {getUserTypeLabel(userTypeFilter)}
                </span>
              )}
              {statusFilter !== 'all' && (
                <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded">
                  {statusFilter === 'active' ? 'Đang hoạt động' : 'Không hoạt động'}
                </span>
              )}
              {roleFilter !== 'all' && (
                <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded">
                  {roleFilter === 'no-role'
                    ? 'Chưa có vai trò'
                    : roles.find(r => r.id === roleFilter)?.name || 'Vai trò'}
                </span>
              )}
              <span className="ml-auto font-medium text-indigo-600">
                {filteredUsers.length} kết quả
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {filteredUsers.length === 0 ? (
          <div className="p-8 sm:p-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4">
              <UsersIcon className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              {hasActiveFilters ? 'Không tìm thấy người dùng' : 'Chưa có người dùng'}
            </h3>
            <p className="text-sm sm:text-base text-slate-600">
              {hasActiveFilters
                ? 'Thử thay đổi bộ lọc hoặc tìm kiếm với từ khóa khác'
                : 'Hãy đăng ký tài khoản mới để bắt đầu sử dụng hệ thống'}
            </p>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Xóa bộ lọc
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Mobile Card View */}
            <div className="block lg:hidden divide-y divide-slate-200">
              {filteredUsers.map((user) => (
                <div key={user.id} className="p-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-indigo-600 font-semibold text-lg">
                        {user.first_name[0]}{user.last_name[0]}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 truncate">
                        {user.first_name} {user.last_name}
                      </p>
                      <p className="text-sm text-slate-500 flex items-center gap-1 truncate">
                        <Mail className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{user.email}</span>
                      </p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${getUserTypeBadgeColor(user.user_type)}`}>
                          {getUserTypeLabel(user.user_type)}
                        </span>
                        {user.is_active ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-emerald-100 text-emerald-800">
                            Hoạt động
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-700">
                            Không hoạt động
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {user.department && (
                    <div className="flex items-center gap-2 mb-2 text-sm">
                      <Building2 className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-900">{user.department.name}</span>
                    </div>
                  )}

                  {user.roles.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {user.roles.map((role) => (
                        <span
                          key={role.id}
                          className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium"
                          style={{
                            backgroundColor: `${role.color}20`,
                            color: role.color,
                          }}
                        >
                          {role.name}
                        </span>
                      ))}
                    </div>
                  )}

                  <button
                    onClick={() => openAssignModal(user)}
                    className="w-full px-3 py-2 text-sm bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <UserCog className="w-4 h-4" />
                    Gán quyền
                  </button>
                </div>
              ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      Người dùng
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      Loại
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      Phòng ban
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      Vai trò
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      Trạng thái
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                            <span className="text-indigo-600 font-semibold">
                              {user.first_name[0]}{user.last_name[0]}
                            </span>
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">
                              {user.first_name} {user.last_name}
                            </p>
                            <p className="text-sm text-slate-500 flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium ${getUserTypeBadgeColor(user.user_type)}`}>
                          {getUserTypeLabel(user.user_type)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {user.department ? (
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-slate-400" />
                            <span className="text-sm text-slate-900">{user.department.name}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-slate-400">Chưa có</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {user.roles.length > 0 ? (
                            user.roles.map((role) => (
                              <span
                                key={role.id}
                                className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium"
                                style={{
                                  backgroundColor: `${role.color}20`,
                                  color: role.color,
                                }}
                              >
                                {role.name}
                              </span>
                            ))
                          ) : (
                            <span className="text-sm text-slate-400">Chưa có vai trò</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {user.is_active ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-emerald-100 text-emerald-800">
                            Hoạt động
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-700">
                            Không hoạt động
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end">
                          <button
                            onClick={() => openAssignModal(user)}
                            className="px-3 py-1.5 text-sm bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg transition-colors flex items-center gap-1.5"
                          >
                            <UserCog className="w-4 h-4" />
                            Gán quyền
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Results Summary */}
      {filteredUsers.length > 0 && (
        <div className="mt-4 text-sm text-slate-600 text-center">
          Hiển thị <span className="font-semibold text-slate-900">{filteredUsers.length}</span> trong tổng số{' '}
          <span className="font-semibold text-slate-900">{users.length}</span> người dùng
        </div>
      )}

      {/* Assignment Modal - Filament Shield Style */}
      {showModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="px-4 sm:px-6 py-4 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                    <UserCog className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-lg sm:text-xl font-bold text-slate-900 truncate">
                      Gán quyền cho người dùng
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-600 truncate">
                      {selectedUser.first_name} {selectedUser.last_name} ({selectedUser.email})
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-slate-200 rounded-lg transition-colors flex-shrink-0"
                >
                  <X className="w-5 h-5 text-slate-600" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              {/* Roles Section */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <Shield className="w-5 h-5 text-indigo-600" />
                  <h3 className="font-semibold text-slate-900">Vai trò</h3>
                  <span className="text-xs sm:text-sm text-slate-500">
                    ({selectedRoleIds.length} đã chọn)
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {roles.map((role) => (
                    <button
                      key={role.id}
                      onClick={() => toggleRole(role.id)}
                      className={`p-4 rounded-lg border-2 transition-all text-left ${
                        selectedRoleIds.includes(role.id)
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-slate-900">{role.name}</span>
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                          selectedRoleIds.includes(role.id)
                            ? 'border-indigo-600 bg-indigo-600'
                            : 'border-slate-300'
                        }`}>
                          {selectedRoleIds.includes(role.id) && (
                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className="px-2 py-0.5 rounded text-xs font-medium text-white"
                          style={{ backgroundColor: role.color }}
                        >
                          Level {role.level}
                        </span>
                        <span className="text-xs text-slate-500">{role.slug}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Permissions Section */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Settings className="w-5 h-5 text-amber-600" />
                  <h3 className="font-semibold text-slate-900">Quyền hạn trực tiếp</h3>
                  <span className="text-sm text-slate-500">
                    (Tùy chọn - ngoài quyền từ vai trò)
                  </span>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-amber-800">
                    Quyền hạn được kế thừa từ vai trò đã chọn. Bạn có thể gán thêm quyền trực tiếp nếu cần.
                  </p>
                </div>
                {/* Group permissions by module */}
                <div className="space-y-4 max-h-64 overflow-y-auto">
                  {Object.entries(
                    permissions.reduce((acc, perm) => {
                      if (!acc[perm.module]) acc[perm.module] = []
                      acc[perm.module].push(perm)
                      return acc
                    }, {} as Record<string, Permission[]>)
                  ).map(([module, modulePerms]) => (
                    <div key={module} className="border border-slate-200 rounded-lg p-4">
                      <h4 className="font-semibold text-slate-900 mb-3 capitalize">{module}</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {modulePerms.map((perm) => (
                          <label
                            key={perm.id}
                            className="flex items-center gap-2 p-2 rounded hover:bg-slate-50 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={selectedPermissionIds.includes(perm.id)}
                              onChange={() => togglePermission(perm.id)}
                              className="w-4 h-4 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500"
                            />
                            <span className="text-sm text-slate-700">{perm.name}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-4 sm:px-6 py-4 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-slate-700 hover:bg-slate-200 rounded-lg transition-colors order-2 sm:order-1"
              >
                Hủy
              </button>
              <button
                onClick={handleSaveAssignment}
                disabled={savingAssignment}
                className="px-6 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed order-1 sm:order-2"
              >
                {savingAssignment ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Đang lưu...
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4" />
                    Lưu thay đổi
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
