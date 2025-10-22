'use client';

import { useState, useEffect } from 'react';
import { statsAPI, ordersAPI, formatCurrency, formatWeight, DashboardStats, Order } from '@/lib/seafood-api';
import Link from 'next/link';

export default function SeafoodDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    // Refresh every 30 seconds
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [statsData, ordersData] = await Promise.all([
        statsAPI.dashboard(),
        ordersAPI.list({ limit: 10 }),
      ]);
      setStats(statsData);
      setRecentOrders(ordersData);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-gray-500">Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">🐟 Dashboard Bán Hải Sản</h1>
          <p className="text-gray-600">Tổng quan hoạt động kinh doanh</p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Link
            href="/dashboard/pos"
            className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow"
          >
            <div className="text-3xl mb-2">🛒</div>
            <div className="text-xl font-bold">Bán hàng POS</div>
            <div className="text-blue-100 text-sm">Tạo đơn hàng mới</div>
          </Link>

          <Link
            href="/dashboard/products"
            className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow"
          >
            <div className="text-3xl mb-2">📦</div>
            <div className="text-xl font-bold">Quản lý sản phẩm</div>
            <div className="text-green-100 text-sm">Thêm/Sửa sản phẩm</div>
          </Link>

          <Link
            href="/dashboard/import"
            className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow"
          >
            <div className="text-3xl mb-2">📥</div>
            <div className="text-xl font-bold">Nhập hàng</div>
            <div className="text-purple-100 text-sm">Quản lý lô nhập</div>
          </Link>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-2">
                <div className="text-gray-500 text-sm font-medium">Sản phẩm đang bán</div>
                <div className="text-2xl">📦</div>
              </div>
              <div className="text-3xl font-bold text-gray-800">{stats.total_products}</div>
              <div className="text-sm text-gray-500 mt-1">sản phẩm</div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-2">
                <div className="text-gray-500 text-sm font-medium">Giá trị tồn kho</div>
                <div className="text-2xl">💰</div>
              </div>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(stats.total_stock_value)}
              </div>
              <div className="text-sm text-gray-500 mt-1">tổng giá trị</div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-2">
                <div className="text-gray-500 text-sm font-medium">Đơn hàng hôm nay</div>
                <div className="text-2xl">📋</div>
              </div>
              <div className="text-3xl font-bold text-blue-600">{stats.today_orders}</div>
              <div className="text-sm text-gray-500 mt-1">đơn hàng</div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-2">
                <div className="text-gray-500 text-sm font-medium">Doanh thu hôm nay</div>
                <div className="text-2xl">💵</div>
              </div>
              <div className="text-2xl font-bold text-orange-600">
                {formatCurrency(stats.today_revenue)}
              </div>
              <div className="text-sm text-gray-500 mt-1">doanh thu</div>
            </div>
          </div>
        )}

        {/* Alerts */}
        {stats && stats.low_stock_products > 0 && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-8 rounded-r-lg">
            <div className="flex items-center">
              <div className="text-2xl mr-3">⚠️</div>
              <div>
                <p className="font-medium text-yellow-800">
                  Cảnh báo tồn kho thấp!
                </p>
                <p className="text-sm text-yellow-700">
                  Có {stats.low_stock_products} sản phẩm sắp hết hàng (dưới 10kg)
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Recent Orders */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-800">📋 Đơn hàng gần đây</h2>
            <Link
              href="/dashboard/orders"
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              Xem tất cả →
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Mã đơn
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Khách hàng
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    SĐT
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Số món
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Tổng tiền
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Trạng thái
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Thời gian
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                      Chưa có đơn hàng nào
                    </td>
                  </tr>
                ) : (
                  recentOrders.map(order => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                        {order.order_code}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {order.customer_name || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {order.customer_phone}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {order.items?.length || 0} món
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                        {formatCurrency(order.total_amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          order.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : order.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {order.status === 'completed' ? '✓ Hoàn thành' : order.status === 'pending' ? '⏳ Chờ' : '✗ Hủy'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(order.created_at).toLocaleString('vi-VN')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
