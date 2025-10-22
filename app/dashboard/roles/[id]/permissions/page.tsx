'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Shield, Key, Check, ArrowLeft, Save } from 'lucide-react'
import { rbacAPI } from '@/lib/api'

interface Role {
  id: string
  name: string
  slug: string
  color: string
  permissions: Permission[]
}

interface Permission {
  id: string
  name: string
  codename: string
  module: string
  action: string
}

export default function RolePermissionsPage() {
  const params = useParams()
  const router = useRouter()
  const [role, setRole] = useState<Role | null>(null)
  const [allPermissions, setAllPermissions] = useState<Permission[]>([])
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchData()
  }, [params.id])

  const fetchData = async () => {
    try {
      const [roleData, permsData] = await Promise.all([
        rbacAPI.getRole(params.id as string),
        rbacAPI.getPermissions()
      ])

      setRole(roleData as Role)
      setAllPermissions(permsData as Permission[])
      setSelectedPermissions(
        new Set((roleData as Role).permissions.map((p: Permission) => p.id))
      )
    } catch (error) {
      console.error('Failed to fetch data:', error)
      alert('Không thể tải dữ liệu. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
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

  const handleSave = async () => {
    setSaving(true)
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        alert('Vui lòng đăng nhập lại')
        router.push('/auth/login')
        return
      }

      await rbacAPI.assignPermissionsToRole(
        params.id as string,
        Array.from(selectedPermissions),
        token
      )

      alert('Đã lưu thành công!')
      router.push('/dashboard/roles')
    } catch (error) {
      console.error('Failed to save permissions:', error)
      alert('Lưu thất bại: ' + (error instanceof Error ? error.message : 'Lỗi không xác định'))
    } finally {
      setSaving(false)
    }
  }

  const groupedPermissions = allPermissions.reduce((acc, perm) => {
    if (!acc[perm.module]) {
      acc[perm.module] = []
    }
    acc[perm.module].push(perm)
    return acc
  }, {} as Record<string, Permission[]>)

  if (loading || !role) {
    return <div className="p-8">Loading...</div>
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lại
        </button>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${role.color}20` }}
            >
              <Shield className="w-6 h-6" style={{ color: role.color }} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">{role.name}</h1>
              <p className="text-slate-600">Gán quyền hạn cho vai trò</p>
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <Save className="w-5 h-5" />
            {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 mb-8">
        <div className="flex items-center gap-8">
          <div>
            <p className="text-sm text-slate-600 mb-1">Đã chọn</p>
            <p className="text-2xl font-bold text-indigo-600">
              {selectedPermissions.size} / {allPermissions.length}
            </p>
          </div>
          <div className="h-12 w-px bg-slate-200" />
          <div>
            <p className="text-sm text-slate-600 mb-1">Modules</p>
            <p className="text-2xl font-bold text-slate-900">
              {Object.keys(groupedPermissions).length}
            </p>
          </div>
        </div>
      </div>

      {/* Permissions Grid */}
      <div className="space-y-6">
        {Object.entries(groupedPermissions).map(([module, permissions]) => (
          <div key={module} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-900 capitalize flex items-center gap-2">
                  <Key className="w-5 h-5 text-indigo-600" />
                  {module}
                </h3>
                <span className="text-sm text-slate-600">
                  {permissions.filter(p => selectedPermissions.has(p.id)).length} / {permissions.length}
                </span>
              </div>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {permissions.map((permission) => {
                const isSelected = selectedPermissions.has(permission.id)

                return (
                  <button
                    key={permission.id}
                    onClick={() => handleTogglePermission(permission.id)}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${
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
                        <p className="text-xs text-slate-500 font-mono truncate">
                          {permission.codename}
                        </p>
                        <span className="inline-block mt-2 px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded-md">
                          {permission.action}
                        </span>
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
          </div>
        ))}
      </div>
    </div>
  )
}
