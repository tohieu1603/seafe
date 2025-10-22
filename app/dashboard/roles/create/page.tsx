'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Shield, Key, ArrowLeft, Save, Check, X } from 'lucide-react'
import { rbacAPI } from '@/lib/api'
import Link from 'next/link'

interface Permission {
  id: string
  name: string
  codename: string
  module: string
  action: string
  description: string
}

interface RoleFormData {
  name: string
  slug: string
  description: string
  level: number
  color: string
}

const actionColors: Record<string, string> = {
  create: 'bg-green-100 text-green-700',
  read: 'bg-blue-100 text-blue-700',
  update: 'bg-yellow-100 text-yellow-700',
  delete: 'bg-red-100 text-red-700',
  list: 'bg-purple-100 text-purple-700',
  manage: 'bg-indigo-100 text-indigo-700',
}

export default function CreateRolePage() {
  const router = useRouter()
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState<RoleFormData>({
    name: '',
    slug: '',
    description: '',
    level: 0,
    color: '#6366f1',
  })

  useEffect(() => {
    fetchPermissions()
  }, [])

  const fetchPermissions = async () => {
    try {
      const data = await rbacAPI.getPermissions()
      setPermissions(data)
    } catch (error) {
      console.error('Failed to fetch permissions:', error)
      setError('Không thể tải danh sách quyền')
    } finally {
      setLoading(false)
    }
  }

  const handleNameChange = (name: string) => {
    setFormData({
      ...formData,
      name,
      slug: name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim(),
    })
  }

  const handleTogglePermission = (permissionId: string) => {
    const newSelected = new Set(selectedPermissions)
    if (newSelected.has(permissionId)) {
      newSelected.delete(permissionId)
    } else {
      newSelected.add(permissionId)
    }
    setSelectedPermissions(newSelected)
  }

  const handleToggleModule = (module: string) => {
    const modulePermissions = permissions.filter(p => p.module === module)
    const allSelected = modulePermissions.every(p => selectedPermissions.has(p.id))

    const newSelected = new Set(selectedPermissions)
    if (allSelected) {
      modulePermissions.forEach(p => newSelected.delete(p.id))
    } else {
      modulePermissions.forEach(p => newSelected.add(p.id))
    }
    setSelectedPermissions(newSelected)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      setError('Vui lòng nhập tên vai trò')
      return
    }

    setSaving(true)
    setError('')

    try {
      const token = localStorage.getItem('token') || ''

      // Create role
      const newRole = await rbacAPI.createRole(formData, token)

      // Assign permissions if any selected
      if (selectedPermissions.size > 0) {
        await rbacAPI.assignPermissionsToRole(
          newRole.id,
          Array.from(selectedPermissions),
          token
        )
      }

      router.push('/dashboard/roles')
    } catch (error: any) {
      setError(error.message || 'Không thể tạo vai trò')
      setSaving(false)
    }
  }

  // Group permissions by module
  const groupedPermissions = permissions.reduce((acc, perm) => {
    if (!acc[perm.module]) {
      acc[perm.module] = []
    }
    acc[perm.module].push(perm)
    return acc
  }, {} as Record<string, Permission[]>)

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Shield className="w-16 h-16 text-indigo-600 animate-pulse" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard/roles"
              className="p-2 hover:bg-white rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Tạo vai trò mới</h1>
              <p className="text-slate-600 mt-1">Thiết lập vai trò và gán quyền</p>
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
                <Shield className="w-5 h-5 text-indigo-600" />
                Thông tin cơ bản
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Tên vai trò *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    placeholder="VD: Quản lý kho"
                  />
                </div>

                {/* Slug */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Slug
                  </label>
                  <input
                    type="text"
                    value={formData.slug}
                    readOnly
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg bg-slate-50 text-slate-600"
                    placeholder="Tự động tạo"
                  />
                  <p className="text-xs text-slate-500 mt-1">Tự động tạo từ tên vai trò</p>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Mô tả
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  placeholder="Mô tả vai trò này..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Level */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Cấp độ
                  </label>
                  <input
                    type="number"
                    value={formData.level}
                    onChange={(e) => setFormData({ ...formData, level: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    placeholder="0"
                  />
                  <p className="text-xs text-slate-500 mt-1">Số càng cao quyền càng lớn</p>
                </div>

                {/* Color */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Màu sắc
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="w-16 h-10 border border-slate-300 rounded-lg cursor-pointer"
                    />
                    <input
                      type="text"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="flex-1 px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all font-mono text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Permissions Card */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-slate-900 flex items-center gap-2">
                  <Key className="w-5 h-5 text-indigo-600" />
                  Quyền hạn ({selectedPermissions.size} đã chọn)
                </h2>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-6">
                {Object.entries(groupedPermissions).map(([module, modulePerms]) => {
                  const selectedCount = modulePerms.filter(p => selectedPermissions.has(p.id)).length
                  const allSelected = selectedCount === modulePerms.length

                  return (
                    <div key={module} className="border border-slate-200 rounded-lg overflow-hidden">
                      {/* Module Header */}
                      <div className="bg-slate-50 px-4 py-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => handleToggleModule(module)}
                            className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                              allSelected
                                ? 'bg-indigo-600 border-indigo-600'
                                : selectedCount > 0
                                ? 'bg-indigo-100 border-indigo-600'
                                : 'border-slate-300'
                            }`}
                          >
                            {allSelected && <Check className="w-3.5 h-3.5 text-white" />}
                            {selectedCount > 0 && !allSelected && (
                              <div className="w-2 h-2 bg-indigo-600 rounded-sm" />
                            )}
                          </button>
                          <h3 className="font-semibold text-slate-900 capitalize">{module}</h3>
                        </div>
                        <span className="text-sm text-slate-600">
                          {selectedCount} / {modulePerms.length}
                        </span>
                      </div>

                      {/* Module Permissions */}
                      <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {modulePerms.map((permission) => {
                          const isSelected = selectedPermissions.has(permission.id)

                          return (
                            <button
                              key={permission.id}
                              type="button"
                              onClick={() => handleTogglePermission(permission.id)}
                              className={`p-3 rounded-lg border-2 transition-all text-left ${
                                isSelected
                                  ? 'border-indigo-500 bg-indigo-50'
                                  : 'border-slate-200 hover:border-slate-300'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-slate-900 text-sm mb-1 truncate">
                                    {permission.name}
                                  </p>
                                  <p className="text-xs text-slate-500 font-mono truncate mb-2">
                                    {permission.codename}
                                  </p>
                                  <span
                                    className={`inline-block px-2 py-0.5 text-xs rounded-md ${
                                      actionColors[permission.action] || 'bg-slate-100 text-slate-600'
                                    }`}
                                  >
                                    {permission.action}
                                  </span>
                                </div>
                                {isSelected && (
                                  <div className="flex-shrink-0">
                                    <div className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center">
                                      <Check className="w-3.5 h-3.5 text-white" />
                                    </div>
                                  </div>
                                )}
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-4 pb-6">
            <Link
              href="/dashboard/roles"
              className="px-6 py-2.5 border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50 transition-colors"
            >
              Hủy
            </Link>
            <button
              type="submit"
              disabled={saving || !formData.name.trim()}
              className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Đang lưu...' : 'Tạo vai trò'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
