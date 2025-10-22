'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Users, Shield, ArrowLeft, Save, Check, X, Mail, Lock, User as UserIcon, Building2 } from 'lucide-react'
import { authAPI, rbacAPI } from '@/lib/api'
import Link from 'next/link'

interface Role {
  id: string
  name: string
  slug: string
  color: string
  level: number
  description: string
}

interface Department {
  id: string
  name: string
  code: string
}

interface UserFormData {
  email: string
  password: string
  first_name: string
  last_name: string
  user_type: string
  department_id?: string
}

export default function CreateUserPage() {
  const router = useRouter()
  const [roles, setRoles] = useState<Role[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [selectedRoles, setSelectedRoles] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState<UserFormData>({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    user_type: 'staff',
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const rolesData = await rbacAPI.getRoles()
      setRoles(rolesData as Role[])
      // TODO: Implement getDepartments API
      setDepartments([])
    } catch (error) {
      console.error('Failed to fetch data:', error)
      setError('Không thể tải dữ liệu')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleRole = (roleId: string) => {
    const newSelected = new Set(selectedRoles)
    if (newSelected.has(roleId)) {
      newSelected.delete(roleId)
    } else {
      newSelected.add(roleId)
    }
    setSelectedRoles(newSelected)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.email.trim() || !formData.password.trim()) {
      setError('Vui lòng nhập email và mật khẩu')
      return
    }

    if (!formData.first_name.trim() || !formData.last_name.trim()) {
      setError('Vui lòng nhập họ và tên')
      return
    }

    setSaving(true)
    setError('')

    try {
      // TODO: Implement createUser API in lib/api.ts
      alert('Chức năng tạo user chưa được implement. Vui lòng sử dụng trang Users để quản lý.')
      router.push('/dashboard/users')
    } catch (error: any) {
      setError(error.message || 'Không thể tạo người dùng')
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Users className="w-16 h-16 text-indigo-600 animate-pulse" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard/users"
              className="p-2 hover:bg-white rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Tạo người dùng mới</h1>
              <p className="text-slate-600 mt-1">Thêm người dùng và gán vai trò</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <X className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info Card */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
              <h2 className="font-semibold text-slate-900 flex items-center gap-2">
                <UserIcon className="w-5 h-5 text-indigo-600" />
                Thông tin cơ bản
              </h2>
            </div>
            <div className="p-6 space-y-4">
              {/* Name */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Họ *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    placeholder="Nguyễn Văn"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Tên *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    placeholder="A"
                  />
                </div>
              </div>

              {/* Email & Password */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    placeholder="user@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    Mật khẩu *
                  </label>
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {/* User Type & Department */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Loại người dùng
                  </label>
                  <select
                    value={formData.user_type}
                    onChange={(e) => setFormData({ ...formData, user_type: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  >
                    <option value="staff">Nhân viên</option>
                    <option value="manager">Quản lý</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    Phòng ban
                  </label>
                  <select
                    value={formData.department_id || ''}
                    onChange={(e) => setFormData({ ...formData, department_id: e.target.value || undefined })}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  >
                    <option value="">Không chọn</option>
                    {departments.map(dept => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name} ({dept.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Roles Card */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-slate-900 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-indigo-600" />
                  Vai trò ({selectedRoles.size} đã chọn)
                </h2>
              </div>
            </div>
            <div className="p-6">
              {roles.length === 0 ? (
                <p className="text-center text-slate-500 py-8">Chưa có vai trò nào</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {roles.map((role) => {
                    const isSelected = selectedRoles.has(role.id)

                    return (
                      <button
                        key={role.id}
                        type="button"
                        onClick={() => handleToggleRole(role.id)}
                        className={`p-4 rounded-lg border-2 transition-all text-left ${
                          isSelected
                            ? 'border-indigo-500 bg-indigo-50'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <div
                                className="w-3 h-3 rounded-full flex-shrink-0"
                                style={{ backgroundColor: role.color }}
                              />
                              <p className="font-semibold text-slate-900 truncate">
                                {role.name}
                              </p>
                            </div>
                            <p className="text-xs text-slate-500 font-mono mb-2 truncate">
                              {role.slug}
                            </p>
                            {role.description && (
                              <p className="text-xs text-slate-600 line-clamp-2">
                                {role.description}
                              </p>
                            )}
                            <div className="mt-2 flex items-center gap-2">
                              <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded-md">
                                Level {role.level}
                              </span>
                            </div>
                          </div>
                          {isSelected && (
                            <div className="flex-shrink-0">
                              <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center">
                                <Check className="w-4 h-4 text-white" />
                              </div>
                            </div>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-4 pb-6">
            <Link
              href="/dashboard/users"
              className="px-6 py-2.5 border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50 transition-colors"
            >
              Hủy
            </Link>
            <button
              type="submit"
              disabled={saving || !formData.email.trim() || !formData.password.trim()}
              className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Đang lưu...' : 'Tạo người dùng'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
