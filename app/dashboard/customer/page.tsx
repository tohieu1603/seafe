'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShoppingCart, Package, Clock, CheckCircle2, User } from 'lucide-react';

const API_URL = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8003'}/api`;

interface OrderSummary {
  total: number;
  pending: number;
  processing: number;
  completed: number;
}

export default function CustomerDashboard() {
  const [user, setUser] = useState<any>(null);
  const [orderStats, setOrderStats] = useState<OrderSummary>({
    total: 0,
    pending: 0,
    processing: 0,
    completed: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    loadOrderStats();
  }, []);

  const loadOrderStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/users/customer/orders`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const orders = await response.json();

        const stats = {
          total: orders.length,
          pending: orders.filter((o: any) => o.status === 'pending').length,
          processing: orders.filter((o: any) => ['processing', 'weighed', 'shipped'].includes(o.status)).length,
          completed: orders.filter((o: any) => o.status === 'completed').length,
        };

        setOrderStats(stats);
      }
    } catch (error) {
      console.error('Failed to load order stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Package className="w-16 h-16 text-indigo-600 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Welcome Header */}
        <div className="bg-white rounded-2xl shadow-sm p-8 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <User className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                Xin chào, {user?.first_name || 'Khách hàng'}! 👋
              </h1>
              <p className="text-slate-600 mt-1">
                Chào mừng bạn đến với hệ thống đặt hàng hải sản
              </p>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-indigo-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Tổng đơn hàng</p>
                <p className="text-3xl font-bold text-slate-900">{orderStats.total}</p>
              </div>
              <Package className="w-10 h-10 text-indigo-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Chờ xử lý</p>
                <p className="text-3xl font-bold text-slate-900">{orderStats.pending}</p>
              </div>
              <Clock className="w-10 h-10 text-yellow-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Đang xử lý</p>
                <p className="text-3xl font-bold text-slate-900">{orderStats.processing}</p>
              </div>
              <ShoppingCart className="w-10 h-10 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Hoàn thành</p>
                <p className="text-3xl font-bold text-slate-900">{orderStats.completed}</p>
              </div>
              <CheckCircle2 className="w-10 h-10 text-green-500" />
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link
            href="/dashboard/pos"
            className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg p-8 text-white hover:shadow-xl transition-all transform hover:scale-105"
          >
            <ShoppingCart className="w-12 h-12 mb-4" />
            <h3 className="text-2xl font-bold mb-2">Đặt hàng mới</h3>
            <p className="text-indigo-100">
              Chọn sản phẩm và tạo đơn hàng mới
            </p>
          </Link>

          <Link
            href="/dashboard/my-orders"
            className="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl shadow-lg p-8 text-white hover:shadow-xl transition-all transform hover:scale-105"
          >
            <Package className="w-12 h-12 mb-4" />
            <h3 className="text-2xl font-bold mb-2">Đơn hàng của tôi</h3>
            <p className="text-blue-100">
              Xem và theo dõi trạng thái đơn hàng
            </p>
          </Link>
        </div>

        {/* Info Section */}
        <div className="mt-8 bg-white rounded-2xl shadow-sm p-8">
          <h2 className="text-xl font-bold text-slate-900 mb-4">
            💡 Hướng dẫn đặt hàng
          </h2>
          <div className="space-y-3 text-slate-700">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center flex-shrink-0 font-bold">
                1
              </div>
              <div>
                <p className="font-medium">Chọn sản phẩm</p>
                <p className="text-sm text-slate-600">Vào trang "Đặt hàng" và chọn sản phẩm bạn muốn mua</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center flex-shrink-0 font-bold">
                2
              </div>
              <div>
                <p className="font-medium">Chọn phương thức thanh toán</p>
                <p className="text-sm text-slate-600">
                  Tiền mặt, Chuyển khoản (VietQR), hoặc Tiền khi nhận hàng (COD)
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center flex-shrink-0 font-bold">
                3
              </div>
              <div>
                <p className="font-medium">Thanh toán (nếu chọn chuyển khoản)</p>
                <p className="text-sm text-slate-600">
                  Quét mã QR VietQR để thanh toán, sau đó đánh dấu "Đã thu tiền"
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center flex-shrink-0 font-bold">
                4
              </div>
              <div>
                <p className="font-medium">Theo dõi đơn hàng</p>
                <p className="text-sm text-slate-600">
                  Xem trạng thái real-time và ảnh cân hàng trong "Đơn hàng của tôi"
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
