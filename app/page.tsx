import Link from 'next/link'
import { Shield, Users, Key, Building2 } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-primary rounded-2xl">
              <Shield className="w-16 h-16 text-white" />
            </div>
          </div>
          <h1 className="text-5xl font-bold mb-4 text-slate-900">
            BaseSystem RBAC
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Hệ thống quản lý phân quyền hiện đại với Next.js 15 + Django Ninja
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-16">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-600 font-medium">Roles</span>
              <Shield className="w-5 h-5 text-indigo-500" />
            </div>
            <p className="text-3xl font-bold text-slate-900">12</p>
            <p className="text-sm text-slate-500 mt-1">Vai trò hệ thống</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-600 font-medium">Permissions</span>
              <Key className="w-5 h-5 text-emerald-500" />
            </div>
            <p className="text-3xl font-bold text-slate-900">73</p>
            <p className="text-sm text-slate-500 mt-1">Quyền hạn</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-600 font-medium">Departments</span>
              <Building2 className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-3xl font-bold text-slate-900">8</p>
            <p className="text-sm text-slate-500 mt-1">Phòng ban</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-600 font-medium">Users</span>
              <Users className="w-5 h-5 text-purple-500" />
            </div>
            <p className="text-3xl font-bold text-slate-900">0</p>
            <p className="text-sm text-slate-500 mt-1">Người dùng</p>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white rounded-xl p-8 shadow-sm border border-slate-200">
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
              <Shield className="w-6 h-6 text-indigo-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-slate-900">
              Quản lý vai trò
            </h3>
            <p className="text-slate-600">
              12 vai trò từ Super Admin đến Employee, có thể tùy chỉnh linh hoạt
            </p>
          </div>

          <div className="bg-white rounded-xl p-8 shadow-sm border border-slate-200">
            <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mb-4">
              <Key className="w-6 h-6 text-emerald-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-slate-900">
              Phân quyền chi tiết
            </h3>
            <p className="text-slate-600">
              73 quyền hạn được phân chia theo module: users, sales, marketing, finance, HR, dev
            </p>
          </div>

          <div className="bg-white rounded-xl p-8 shadow-sm border border-slate-200">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <Building2 className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-slate-900">
              Quản lý phòng ban
            </h3>
            <p className="text-slate-600">
              Cấu trúc phòng ban với vai trò mặc định và quản lý phân cấp
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <div className="inline-flex gap-4">
            <Link
              href="/auth/login"
              className="px-8 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors"
            >
              Đăng nhập
            </Link>
            <Link
              href="/auth/register"
              className="px-8 py-3 bg-white text-slate-900 rounded-lg font-medium border border-slate-200 hover:bg-slate-50 transition-colors"
            >
              Đăng ký
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
