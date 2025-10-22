'use client'

import { useEffect, useState } from 'react'
import { Users as UsersIcon, Shield, Plus, Mail, Building2 } from 'lucide-react'
import { authAPI, rbacAPI } from '@/lib/api'

interface User {
  id: string
  email: string
  first_name: string
  last_name: string
  is_active: boolean
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

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [assigningRole, setAssigningRole] = useState<string | null>(null)
  const [selectedRole, setSelectedRole] = useState<string>('')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        alert('Vui lòng đăng nhập')
        return
      }

      const [usersData, rolesData] = await Promise.all([
        authAPI.getUsers(token),
        rbacAPI.getRoles()
      ])

      setUsers(usersData)
      setRoles(rolesData)
    } catch (error) {
      console.error('Failed to fetch data:', error)
      alert('Không thể tải dữ liệu: ' + (error instanceof Error ? error.message : ''))
    } finally {
      setLoading(false)
    }
  }

  const handleAssignRole = async (userId: string) => {
    if (!selectedRole) {
      alert('Vui lòng chọn vai trò')
      return
    }

    setAssigningRole(userId)
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        alert('Vui lòng đăng nhập lại')
        return
      }

      await rbacAPI.assignRoleToUser(userId, selectedRole, token)
      alert('Đã gán vai trò thành công!')
      await fetchData()
      setSelectedRole('')
    } catch (error) {
      console.error('Failed to assign role:', error)
      alert('Gán vai trò thất bại: ' + (error instanceof Error ? error.message : 'Lỗi không xác định'))
    } finally {
      setAssigningRole(null)
    }
  }

  if (loading) {
    return <div className="p-8">Loading...</div>
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
              <UsersIcon className="w-8 h-8 text-indigo-600" />
              Quản lý Người dùng
            </h1>
            <p className="text-slate-600 mt-1">
              Quản lý người dùng và gán vai trò
            </p>
          </div>
          <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Thêm người dùng
          </button>
        </div>
      </div>

      {/* Quick Assign Role */}
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-200 mb-8">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-white rounded-lg shadow-sm">
            <Shield className="w-6 h-6 text-indigo-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-slate-900 mb-2">Gán vai trò nhanh</h3>
            <p className="text-sm text-slate-600 mb-4">
              Chọn vai trò để gán cho người dùng trong danh sách bên dưới
            </p>
            <div className="flex gap-2 flex-wrap">
              {roles.map((role) => (
                <button
                  key={role.id}
                  onClick={() => setSelectedRole(role.id)}
                  className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${
                    selectedRole === role.id
                      ? 'bg-white shadow-md ring-2 ring-indigo-500'
                      : 'bg-white/50 hover:bg-white hover:shadow'
                  }`}
                  style={{
                    borderLeft: `4px solid ${role.color}`,
                  }}
                >
                  <Shield className="w-4 h-4" style={{ color: role.color }} />
                  <span className="font-medium text-slate-900">{role.name}</span>
                  <span className="text-xs text-slate-500">Lv.{role.level}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {users.length === 0 ? (
          <div className="p-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4">
              <UsersIcon className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              Chưa có người dùng
            </h3>
            <p className="text-slate-600">
              Hãy đăng ký tài khoản mới để bắt đầu sử dụng hệ thống
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Người dùng
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Phòng ban
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Vai trò hiện tại
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
                {users.map((user) => (
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
                          onClick={() => handleAssignRole(user.id)}
                          disabled={!selectedRole || assigningRole === user.id}
                          className="px-3 py-1.5 text-sm bg-indigo-100 text-indigo-700 hover:bg-indigo-200 rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Shield className="w-4 h-4" />
                          {assigningRole === user.id ? 'Đang gán...' : 'Gán vai trò'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
