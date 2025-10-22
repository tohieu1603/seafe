'use client'

import { useEffect, useState } from 'react'
import { Key, Shield, Plus } from 'lucide-react'
import { rbacAPI } from '@/lib/api'

interface Permission {
  id: string
  name: string
  codename: string
  module: string
  action: string
  description: string
  is_active: boolean
}

const actionColors: Record<string, string> = {
  create: 'bg-green-100 text-green-700',
  read: 'bg-blue-100 text-blue-700',
  update: 'bg-yellow-100 text-yellow-700',
  delete: 'bg-red-100 text-red-700',
  list: 'bg-purple-100 text-purple-700',
  manage: 'bg-indigo-100 text-indigo-700',
}

export default function PermissionsPage() {
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedModule, setSelectedModule] = useState<string>('all')

  useEffect(() => {
    fetchPermissions()
  }, [])

  const fetchPermissions = async () => {
    try {
      const data = await rbacAPI.getPermissions()
      setPermissions(data)
    } catch (error) {
      console.error('Failed to fetch permissions:', error)
      alert('Không thể tải danh sách quyền hạn')
    } finally {
      setLoading(false)
    }
  }

  const groupedPermissions = permissions.reduce((acc, perm) => {
    if (!acc[perm.module]) {
      acc[perm.module] = []
    }
    acc[perm.module].push(perm)
    return acc
  }, {} as Record<string, Permission[]>)

  const modules = Object.keys(groupedPermissions).sort()
  const filteredPermissions = selectedModule === 'all'
    ? permissions
    : groupedPermissions[selectedModule] || []

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
              <Key className="w-8 h-8 text-indigo-600" />
              Quản lý Quyền hạn
            </h1>
            <p className="text-slate-600 mt-1">
              Danh sách tất cả quyền hạn trong hệ thống
            </p>
          </div>
          <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Thêm quyền hạn
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 border border-slate-200">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-100 rounded-lg">
              <Key className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Tổng quyền hạn</p>
              <p className="text-2xl font-bold text-slate-900">{permissions.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-slate-200">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Shield className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Modules</p>
              <p className="text-2xl font-bold text-slate-900">{modules.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-slate-200">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <Key className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Hoạt động</p>
              <p className="text-2xl font-bold text-slate-900">
                {permissions.filter(p => p.is_active).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-slate-200">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-slate-100 rounded-lg">
              <Key className="w-6 h-6 text-slate-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Không hoạt động</p>
              <p className="text-2xl font-bold text-slate-900">
                {permissions.filter(p => !p.is_active).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Module Filter */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 mb-6">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setSelectedModule('all')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              selectedModule === 'all'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Tất cả ({permissions.length})
          </button>
          {modules.map((module) => (
            <button
              key={module}
              onClick={() => setSelectedModule(module)}
              className={`px-4 py-2 rounded-lg transition-colors capitalize ${
                selectedModule === module
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {module} ({groupedPermissions[module].length})
            </button>
          ))}
        </div>
      </div>

      {/* Permissions by Module */}
      {selectedModule === 'all' ? (
        <div className="space-y-6">
          {modules.map((module) => (
            <div key={module} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-slate-900 capitalize flex items-center gap-2">
                    <Shield className="w-5 h-5 text-indigo-600" />
                    {module}
                  </h3>
                  <span className="text-sm text-slate-600">
                    {groupedPermissions[module].length} quyền hạn
                  </span>
                </div>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {groupedPermissions[module].map((permission) => (
                    <div
                      key={permission.id}
                      className="p-4 border border-slate-200 rounded-lg hover:border-indigo-300 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-slate-900 text-sm">
                          {permission.name}
                        </h4>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            actionColors[permission.action] || 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {permission.action}
                        </span>
                      </div>
                      <p className="text-xs font-mono text-slate-500 mb-2">
                        {permission.codename}
                      </p>
                      {permission.description && (
                        <p className="text-xs text-slate-600">
                          {permission.description}
                        </p>
                      )}
                      <div className="mt-3 flex items-center justify-between">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            permission.is_active
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {permission.is_active ? 'Hoạt động' : 'Không hoạt động'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPermissions.map((permission) => (
                <div
                  key={permission.id}
                  className="p-4 border border-slate-200 rounded-lg hover:border-indigo-300 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-slate-900 text-sm">
                      {permission.name}
                    </h4>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        actionColors[permission.action] || 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {permission.action}
                    </span>
                  </div>
                  <p className="text-xs font-mono text-slate-500 mb-2">
                    {permission.codename}
                  </p>
                  {permission.description && (
                    <p className="text-xs text-slate-600">
                      {permission.description}
                    </p>
                  )}
                  <div className="mt-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        permission.is_active
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {permission.is_active ? 'Hoạt động' : 'Không hoạt động'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
