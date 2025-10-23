'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Fish, ShoppingCart, Package, Truck, Shield, Users, Sun, Moon, Scale, Image, FileText } from 'lucide-react'

export default function Home() {
  const router = useRouter()
  const [darkMode, setDarkMode] = useState(false)
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    // Check authentication first
    const token = localStorage.getItem('token')

    if (token) {
      // User is logged in, redirect to dashboard
      router.push('/dashboard/pos')
    } else {
      // User not logged in, redirect to login
      router.push('/auth/login')
    }

    setIsChecking(false)
  }, [router])

  useEffect(() => {
    // Load dark mode preference from localStorage
    const savedMode = localStorage.getItem('darkMode')
    if (savedMode) {
      setDarkMode(savedMode === 'true')
    }
  }, [])

  useEffect(() => {
    // Save dark mode preference to localStorage
    localStorage.setItem('darkMode', darkMode.toString())
  }, [darkMode])

  const toggleDarkMode = () => {
    setDarkMode(!darkMode)
  }

  // Show loading while checking auth
  if (isChecking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Fish className="w-16 h-16 text-cyan-600 animate-pulse mx-auto mb-4" />
          <p className="text-gray-600">Đang kiểm tra đăng nhập...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-sky-100 dark:from-slate-900 dark:via-slate-800 dark:to-cyan-950 transition-colors duration-300">
        {/* Dark Mode Toggle */}
        <div className="fixed top-6 right-6 z-50">
          <button
            onClick={toggleDarkMode}
            className="p-3 bg-white dark:bg-slate-800 rounded-full shadow-lg border border-slate-200 dark:border-slate-700 hover:scale-110 transition-transform"
            aria-label="Toggle dark mode"
          >
            {darkMode ? (
              <Sun className="w-6 h-6 text-yellow-500" />
            ) : (
              <Moon className="w-6 h-6 text-slate-700" />
            )}
          </button>
        </div>

        <div className="container mx-auto px-4 py-16">
          {/* Header */}
          <div className="text-center mb-16">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-gradient-to-br from-cyan-500 to-blue-600 dark:from-cyan-600 dark:to-blue-700 rounded-2xl shadow-xl">
                <Fish className="w-16 h-16 text-white" />
              </div>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-cyan-600 to-blue-600 dark:from-cyan-400 dark:to-blue-400 bg-clip-text text-transparent">
              Hùng Trường Sa
            </h1>
            <p className="text-2xl md:text-3xl font-semibold text-slate-800 dark:text-slate-200 mb-4">
              Hải Sản Tươi Sống
            </p>
            <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Hệ thống quản lý bán hải sản hiện đại với Next.js 14 + Django 4
            </p>
          </div>

          {/* Hero Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-16">
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-cyan-100 dark:border-slate-700 transform hover:scale-105 transition-transform">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-600 dark:text-slate-300 font-medium">Sản phẩm</span>
                <Package className="w-5 h-5 text-cyan-500" />
              </div>
              <p className="text-3xl font-bold text-slate-900 dark:text-white">17+</p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Loại hải sản</p>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-blue-100 dark:border-slate-700 transform hover:scale-105 transition-transform">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-600 dark:text-slate-300 font-medium">Đơn hàng</span>
                <ShoppingCart className="w-5 h-5 text-blue-500" />
              </div>
              <p className="text-3xl font-bold text-slate-900 dark:text-white">20+</p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Đơn mẫu</p>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-emerald-100 dark:border-slate-700 transform hover:scale-105 transition-transform">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-600 dark:text-slate-300 font-medium">Phân quyền</span>
                <Shield className="w-5 h-5 text-emerald-500" />
              </div>
              <p className="text-3xl font-bold text-slate-900 dark:text-white">43</p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Quyền hạn</p>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-purple-100 dark:border-slate-700 transform hover:scale-105 transition-transform">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-600 dark:text-slate-300 font-medium">Nhân viên</span>
                <Users className="w-5 h-5 text-purple-500" />
              </div>
              <p className="text-3xl font-bold text-slate-900 dark:text-white">6</p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Tài khoản mẫu</p>
            </div>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            <div className="bg-white dark:bg-slate-800 rounded-xl p-8 shadow-lg border border-slate-200 dark:border-slate-700 hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-cyan-100 dark:bg-cyan-900 rounded-lg flex items-center justify-center mb-4">
                <ShoppingCart className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-slate-900 dark:text-white">
                Bán hàng POS
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                Giao diện bán hàng nhanh chóng, dễ sử dụng cho nhân viên
              </p>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl p-8 shadow-lg border border-slate-200 dark:border-slate-700 hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-4">
                <Package className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-slate-900 dark:text-white">
                Quản lý sản phẩm
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                8 danh mục, 17 sản phẩm hải sản với quản lý tồn kho chi tiết
              </p>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl p-8 shadow-lg border border-slate-200 dark:border-slate-700 hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900 rounded-lg flex items-center justify-center mb-4">
                <Scale className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-slate-900 dark:text-white">
                Quy trình cân hàng
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                Cân sản phẩm, upload ảnh, điều chỉnh giá trọng lượng
              </p>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl p-8 shadow-lg border border-slate-200 dark:border-slate-700 hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center mb-4">
                <Truck className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-slate-900 dark:text-white">
                Giao hàng vận chuyển
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                Theo dõi trạng thái đơn hàng từ pending đến shipped
              </p>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl p-8 shadow-lg border border-slate-200 dark:border-slate-700 hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-slate-900 dark:text-white">
                Phân quyền RBAC
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                6 vai trò, 43 quyền hạn chi tiết cho từng module
              </p>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl p-8 shadow-lg border border-slate-200 dark:border-slate-700 hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-pink-100 dark:bg-pink-900 rounded-lg flex items-center justify-center mb-4">
                <FileText className="w-6 h-6 text-pink-600 dark:text-pink-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-slate-900 dark:text-white">
                Xuất hóa đơn PDF
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                Tự động xuất hóa đơn đẹp với ReportLab
              </p>
            </div>
          </div>

          {/* Tech Stack */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-xl border border-slate-200 dark:border-slate-700 mb-16">
            <h2 className="text-3xl font-bold text-center mb-8 text-slate-900 dark:text-white">
              Công nghệ hiện đại
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div>
                <div className="text-4xl mb-2">⚡</div>
                <p className="font-semibold text-slate-900 dark:text-white">Next.js 14</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">React Framework</p>
              </div>
              <div>
                <div className="text-4xl mb-2">🐍</div>
                <p className="font-semibold text-slate-900 dark:text-white">Django 4</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">Backend API</p>
              </div>
              <div>
                <div className="text-4xl mb-2">🗄️</div>
                <p className="font-semibold text-slate-900 dark:text-white">PostgreSQL</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">Database</p>
              </div>
              <div>
                <div className="text-4xl mb-2">🎨</div>
                <p className="font-semibold text-slate-900 dark:text-white">Tailwind CSS</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">Styling</p>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-6 text-slate-900 dark:text-white">
              Bắt đầu ngay hôm nay
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-8 max-w-2xl mx-auto">
              Đăng nhập với tài khoản demo hoặc đăng ký tài khoản mới để trải nghiệm hệ thống
            </p>
            <div className="inline-flex gap-4 flex-wrap justify-center">
              <Link
                href="/auth/login"
                className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-lg font-medium shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
              >
                Đăng nhập
              </Link>
              <Link
                href="/auth/register"
                className="px-8 py-4 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg font-medium border-2 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all transform hover:scale-105"
              >
                Đăng ký
              </Link>
            </div>

            {/* Demo Accounts */}
            <div className="mt-12 bg-cyan-50 dark:bg-slate-800 rounded-xl p-6 max-w-2xl mx-auto border border-cyan-100 dark:border-slate-700">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Tài khoản demo:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div className="text-left bg-white dark:bg-slate-700 p-3 rounded-lg">
                  <p className="font-medium text-slate-900 dark:text-white">Super Admin</p>
                  <p className="text-slate-600 dark:text-slate-400">admin@seafood.com / admin123</p>
                </div>
                <div className="text-left bg-white dark:bg-slate-700 p-3 rounded-lg">
                  <p className="font-medium text-slate-900 dark:text-white">Manager</p>
                  <p className="text-slate-600 dark:text-slate-400">manager@seafood.com / manager123</p>
                </div>
                <div className="text-left bg-white dark:bg-slate-700 p-3 rounded-lg">
                  <p className="font-medium text-slate-900 dark:text-white">Salesperson</p>
                  <p className="text-slate-600 dark:text-slate-400">sale1@seafood.com / sale123</p>
                </div>
                <div className="text-left bg-white dark:bg-slate-700 p-3 rounded-lg">
                  <p className="font-medium text-slate-900 dark:text-white">Warehouse</p>
                  <p className="text-slate-600 dark:text-slate-400">warehouse@seafood.com / warehouse123</p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <footer className="mt-16 pt-8 border-t border-slate-200 dark:border-slate-700 text-center text-slate-600 dark:text-slate-400">
            <p className="mb-2">© 2025 Hưng Trường Sa - Hải Sản Tươi Sống</p>
            <p className="text-sm">Hệ thống quản lý bán hải sản hiện đại</p>
          </footer>
        </div>
      </div>
    </div>
  )
}
