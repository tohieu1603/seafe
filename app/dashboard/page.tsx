'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  LayoutDashboard,
  TrendingUp,
  TrendingDown,
  Users,
  ShoppingCart,
  Package,
  DollarSign,
  ArrowRight,
  Calendar,
  Activity,
  Box
} from 'lucide-react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts'
import { statsAPI, ordersAPI, productsAPI, formatCurrency } from '@/lib/seafood-api'

interface DashboardStats {
  total_products: number
  total_stock_value: number
  today_orders: number
  today_revenue: number
  low_stock_products: number
}

interface RevenueData {
  date: string
  revenue: number
  orders: number
}

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [revenueData, setRevenueData] = useState<RevenueData[]>([])
  const [ordersData, setOrdersData] = useState<any[]>([])

  useEffect(() => {
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')

    if (!token || !userData) {
      router.push('/auth/login')
      return
    }

    setUser(JSON.parse(userData))
    fetchDashboardData()
  }, [router])

  const fetchDashboardData = async () => {
    try {
      // Fetch seafood stats
      const dashboardStats = await statsAPI.dashboard()
      setStats(dashboardStats)

      // Fetch recent orders for charts
      const orders = await ordersAPI.list({ limit: 100 })

      // Generate revenue data for last 7 days
      const last7Days = generateLast7Days()
      const revenueByDay = last7Days.map(date => {
        const dayOrders = orders.filter((o: any) => {
          const orderDate = new Date(o.created_at).toISOString().split('T')[0]
          return orderDate === date
        })

        return {
          date: formatDateShort(date),
          revenue: dayOrders.reduce((sum: number, o: any) => sum + Number(o.total_amount), 0),
          orders: dayOrders.length
        }
      })

      setRevenueData(revenueByDay)

      // Generate orders by status
      const ordersByStatus = [
        { status: 'Chờ xử lý', count: orders.filter((o: any) => o.status === 'pending').length, color: '#f59e0b' },
        { status: 'Đang xử lý', count: orders.filter((o: any) => o.status === 'processing').length, color: '#3b82f6' },
        { status: 'Hoàn thành', count: orders.filter((o: any) => o.status === 'completed').length, color: '#10b981' },
        { status: 'Đã hủy', count: orders.filter((o: any) => o.status === 'cancelled').length, color: '#ef4444' },
      ]

      setOrdersData(ordersByStatus)

    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateLast7Days = () => {
    const days = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      days.push(date.toISOString().split('T')[0])
    }
    return days
  }

  const formatDateShort = (dateStr: string) => {
    const date = new Date(dateStr)
    return `${date.getDate()}/${date.getMonth() + 1}`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <LayoutDashboard className="w-16 h-16 text-indigo-600 animate-pulse mx-auto mb-4" />
          <p className="text-slate-600 font-medium">Đang tải dashboard...</p>
        </div>
      </div>
    )
  }

  const totalRevenue = revenueData.reduce((sum, d) => sum + d.revenue, 0)
  const totalOrdersCount = revenueData.reduce((sum, d) => sum + d.orders, 0)
  const avgOrderValue = totalOrdersCount > 0 ? totalRevenue / totalOrdersCount : 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="p-4 sm:p-6 lg:p-8 w-full mx-auto" style={{ maxWidth: '1600px' }}>
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 flex items-center gap-3">
                <LayoutDashboard className="w-7 h-7 sm:w-8 sm:h-8 text-indigo-600" />
                Dashboard
              </h1>
              <p className="text-slate-600 mt-1 text-sm sm:text-base">
                Xin chào, <span className="font-semibold">{user?.first_name} {user?.last_name}</span> 👋
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600 bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm">
              <Calendar className="w-4 h-4" />
              {new Date().toLocaleDateString('vi-VN', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </div>
          </div>
        </div>

        {/* Stats Cards - Responsive Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {/* Total Revenue */}
          <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-white shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 transition-all hover:scale-105">
            <div className="flex items-start justify-between mb-3 sm:mb-4">
              <div className="p-2 sm:p-3 bg-white/20 rounded-lg sm:rounded-xl backdrop-blur-sm">
                <DollarSign className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="flex items-center gap-1 text-xs sm:text-sm bg-white/20 px-2 py-1 rounded-full">
                <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4" />
                <span>7 ngày</span>
              </div>
            </div>
            <h3 className="text-white/80 text-xs sm:text-sm font-medium mb-1">Doanh thu</h3>
            <p className="text-xl sm:text-2xl lg:text-3xl font-bold mb-1">{formatCurrency(totalRevenue)}</p>
            <p className="text-white/70 text-xs sm:text-sm">Tổng 7 ngày qua</p>
          </div>

          {/* Total Orders */}
          <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-white shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 transition-all hover:scale-105">
            <div className="flex items-start justify-between mb-3 sm:mb-4">
              <div className="p-2 sm:p-3 bg-white/20 rounded-lg sm:rounded-xl backdrop-blur-sm">
                <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="flex items-center gap-1 text-xs sm:text-sm bg-white/20 px-2 py-1 rounded-full">
                <Activity className="w-3 h-3 sm:w-4 sm:h-4" />
                <span>7 ngày</span>
              </div>
            </div>
            <h3 className="text-white/80 text-xs sm:text-sm font-medium mb-1">Đơn hàng</h3>
            <p className="text-xl sm:text-2xl lg:text-3xl font-bold mb-1">{totalOrdersCount}</p>
            <p className="text-white/70 text-xs sm:text-sm">Tổng đơn 7 ngày qua</p>
          </div>

          {/* Products */}
          <div className="bg-gradient-to-br from-violet-500 to-violet-600 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-white shadow-lg shadow-violet-500/30 hover:shadow-xl hover:shadow-violet-500/40 transition-all hover:scale-105">
            <div className="flex items-start justify-between mb-3 sm:mb-4">
              <div className="p-2 sm:p-3 bg-white/20 rounded-lg sm:rounded-xl backdrop-blur-sm">
                <Package className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <Link
                href="/dashboard/products"
                className="flex items-center gap-1 text-xs sm:text-sm bg-white/20 px-2 py-1 rounded-full hover:bg-white/30 transition-colors"
              >
                <span>Xem</span>
                <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
              </Link>
            </div>
            <h3 className="text-white/80 text-xs sm:text-sm font-medium mb-1">Sản phẩm</h3>
            <p className="text-xl sm:text-2xl lg:text-3xl font-bold mb-1">{stats?.total_products || 0}</p>
            <p className="text-white/70 text-xs sm:text-sm">Tổng trong kho</p>
          </div>

          {/* Avg Order Value */}
          <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-white shadow-lg shadow-amber-500/30 hover:shadow-xl hover:shadow-amber-500/40 transition-all hover:scale-105">
            <div className="flex items-start justify-between mb-3 sm:mb-4">
              <div className="p-2 sm:p-3 bg-white/20 rounded-lg sm:rounded-xl backdrop-blur-sm">
                <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="flex items-center gap-1 text-xs sm:text-sm bg-white/20 px-2 py-1 rounded-full">
                <Activity className="w-3 h-3 sm:w-4 sm:h-4" />
                <span>TB</span>
              </div>
            </div>
            <h3 className="text-white/80 text-xs sm:text-sm font-medium mb-1">Giá trị TB/đơn</h3>
            <p className="text-xl sm:text-2xl lg:text-3xl font-bold mb-1">{formatCurrency(avgOrderValue)}</p>
            <p className="text-white/70 text-xs sm:text-sm">Trung bình đơn hàng</p>
          </div>
        </div>

        {/* Charts Section - Responsive Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {/* Revenue Chart */}
          <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-slate-200 bg-gradient-to-r from-indigo-50 to-white">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-indigo-600" />
                    Doanh thu 7 ngày
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 mt-1">Theo dõi doanh thu hàng ngày</p>
                </div>
                <div className="text-right">
                  <p className="text-lg sm:text-2xl font-bold text-indigo-600">{formatCurrency(totalRevenue)}</p>
                  <p className="text-xs sm:text-sm text-slate-500">Tổng cộng</p>
                </div>
              </div>
            </div>
            <div className="p-4 sm:p-6">
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="date"
                    stroke="#64748b"
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis
                    stroke="#64748b"
                    style={{ fontSize: '12px' }}
                    tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                    formatter={(value: any) => [formatCurrency(value), 'Doanh thu']}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: '12px' }}
                    formatter={(value) => value === 'revenue' ? 'Doanh thu' : value}
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#6366f1"
                    strokeWidth={3}
                    dot={{ fill: '#6366f1', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Orders by Status Chart */}
          <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-slate-200 bg-gradient-to-r from-emerald-50 to-white">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5 text-emerald-600" />
                    Đơn hàng theo trạng thái
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 mt-1">Phân bổ trạng thái đơn hàng</p>
                </div>
                <div className="text-right">
                  <p className="text-lg sm:text-2xl font-bold text-emerald-600">{totalOrdersCount}</p>
                  <p className="text-xs sm:text-sm text-slate-500">Tổng đơn</p>
                </div>
              </div>
            </div>
            <div className="p-4 sm:p-6">
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={ordersData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="status"
                    stroke="#64748b"
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis
                    stroke="#64748b"
                    style={{ fontSize: '12px' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                    formatter={(value: any) => [value, 'Số đơn']}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: '12px' }}
                    formatter={() => 'Số lượng đơn hàng'}
                  />
                  <Bar
                    dataKey="count"
                    fill="#10b981"
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Quick Actions - Responsive Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <Link
            href="/dashboard/pos"
            className="group bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-slate-200 hover:border-indigo-300 shadow-sm hover:shadow-md transition-all hover:scale-105"
          >
            <div className="flex items-start justify-between mb-3 sm:mb-4">
              <div className="p-2 sm:p-3 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg sm:rounded-xl group-hover:from-indigo-100 group-hover:to-indigo-200 transition-colors">
                <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600" />
              </div>
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
            </div>
            <h3 className="font-semibold text-slate-900 mb-1 text-sm sm:text-base">Bán hàng POS</h3>
            <p className="text-xs sm:text-sm text-slate-600">Tạo đơn hàng mới</p>
          </Link>

          <Link
            href="/dashboard/products"
            className="group bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-slate-200 hover:border-emerald-300 shadow-sm hover:shadow-md transition-all hover:scale-105"
          >
            <div className="flex items-start justify-between mb-3 sm:mb-4">
              <div className="p-2 sm:p-3 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg sm:rounded-xl group-hover:from-emerald-100 group-hover:to-emerald-200 transition-colors">
                <Package className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" />
              </div>
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
            </div>
            <h3 className="font-semibold text-slate-900 mb-1 text-sm sm:text-base">Quản lý sản phẩm</h3>
            <p className="text-xs sm:text-sm text-slate-600">Thêm/Sửa sản phẩm</p>
          </Link>

          <Link
            href="/dashboard/orders"
            className="group bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-slate-200 hover:border-violet-300 shadow-sm hover:shadow-md transition-all hover:scale-105"
          >
            <div className="flex items-start justify-between mb-3 sm:mb-4">
              <div className="p-2 sm:p-3 bg-gradient-to-br from-violet-50 to-violet-100 rounded-lg sm:rounded-xl group-hover:from-violet-100 group-hover:to-violet-200 transition-colors">
                <Box className="w-5 h-5 sm:w-6 sm:h-6 text-violet-600" />
              </div>
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 group-hover:text-violet-600 group-hover:translate-x-1 transition-all" />
            </div>
            <h3 className="font-semibold text-slate-900 mb-1 text-sm sm:text-base">Đơn hàng</h3>
            <p className="text-xs sm:text-sm text-slate-600">Quản lý đơn hàng</p>
          </Link>

          <Link
            href="/dashboard/seafood"
            className="group bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-slate-200 hover:border-amber-300 shadow-sm hover:shadow-md transition-all hover:scale-105"
          >
            <div className="flex items-start justify-between mb-3 sm:mb-4">
              <div className="p-2 sm:p-3 bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg sm:rounded-xl group-hover:from-amber-100 group-hover:to-amber-200 transition-colors">
                <Activity className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600" />
              </div>
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 group-hover:text-amber-600 group-hover:translate-x-1 transition-all" />
            </div>
            <h3 className="font-semibold text-slate-900 mb-1 text-sm sm:text-base">Dashboard Hải sản</h3>
            <p className="text-xs sm:text-sm text-slate-600">Thống kê chi tiết</p>
          </Link>
        </div>

        {/* Low Stock Alert - Responsive */}
        {stats && stats.low_stock_products > 0 && (
          <div className="mt-6 sm:mt-8 bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-amber-500 p-4 sm:p-6 rounded-lg sm:rounded-xl shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-amber-100 rounded-full flex items-center justify-center">
                  <Package className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-base sm:text-lg font-semibold text-amber-900">
                  ⚠️ Cảnh báo tồn kho thấp
                </h3>
                <p className="text-sm sm:text-base text-amber-800 mt-1">
                  Có <span className="font-bold">{stats.low_stock_products}</span> sản phẩm sắp hết hàng (dưới 10kg)
                </p>
              </div>
              <Link
                href="/dashboard/products"
                className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium transition-colors text-sm whitespace-nowrap"
              >
                <span>Kiểm tra ngay</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
