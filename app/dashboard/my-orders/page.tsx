'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Package, Clock, CheckCircle2, XCircle, Eye, Calendar, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

const API_URL = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8003'}/api`;

interface OrderItem {
  id: string;
  seafood: {
    id: string;
    name: string;
    code: string;
  };
  quantity: number;
  weight: number;
  unit_price: number;
  subtotal: number;
}

interface Order {
  id: string;
  order_code: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  total_amount: number;
  paid_amount: number;
  payment_method: string;
  payment_status: string;
  status: string;
  created_at: string;
  items: OrderItem[];
}

export default function MyOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      // Use 'access_token' to match other pages
      const token = localStorage.getItem('access_token');

      if (!token) {
        toast.error('Vui lòng đăng nhập');
        window.location.href = '/customer/login';
        return;
      }

      const url = statusFilter === 'all'
        ? `${API_URL}/users/customer/orders`
        : `${API_URL}/users/customer/orders?status=${statusFilter}`;

      console.log('Fetching orders from:', url);

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('Orders response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('Orders loaded:', data.length);
        setOrders(data);
      } else if (response.status === 401) {
        toast.error('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        window.location.href = '/customer/login';
      } else if (response.status === 404) {
        console.error('Endpoint not found');
        toast.error('Không tìm thấy API endpoint');
      } else {
        const errorData = await response.json().catch(() => null);
        console.error('Error response:', errorData);
        toast.error('Không thể tải danh sách đơn hàng');
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      toast.error('Lỗi khi tải danh sách đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string; icon: any }> = {
      pending: { label: 'Chờ xử lý', className: 'bg-yellow-100 text-yellow-800 border-yellow-300', icon: Clock },
      processing: { label: 'Đang xử lý', className: 'bg-blue-100 text-blue-800 border-blue-300', icon: Package },
      weighed: { label: 'Đã cân', className: 'bg-purple-100 text-purple-800 border-purple-300', icon: Package },
      ready: { label: 'Sẵn sàng giao', className: 'bg-indigo-100 text-indigo-800 border-indigo-300', icon: Package },
      shipped: { label: 'Đã gửi vận chuyển', className: 'bg-cyan-100 text-cyan-800 border-cyan-300', icon: Package },
      completed: { label: 'Hoàn thành', className: 'bg-green-100 text-green-800 border-green-300', icon: CheckCircle2 },
      cancelled: { label: 'Đã hủy', className: 'bg-red-100 text-red-800 border-red-300', icon: XCircle },
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium border ${config.className}`}>
        <Icon className="w-4 h-4" />
        {config.label}
      </span>
    );
  };

  const getPaymentStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      unpaid: { label: 'Chưa thanh toán', className: 'bg-red-100 text-red-800 border-red-300' },
      pending_verification: { label: 'Chờ xác minh', className: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
      paid: { label: 'Đã thanh toán', className: 'bg-green-100 text-green-800 border-green-300' },
    };

    const config = statusConfig[status] || statusConfig.unpaid;
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${config.className}`}>
        {config.label}
      </span>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 text-indigo-600 animate-pulse mx-auto mb-4" />
          <p className="text-slate-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Đơn hàng của tôi</h1>
          <p className="text-slate-600">Quản lý và theo dõi đơn hàng của bạn</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                statusFilter === 'all'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Tất cả
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                statusFilter === 'pending'
                  ? 'bg-yellow-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Chờ xử lý
            </button>
            <button
              onClick={() => setStatusFilter('processing')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                statusFilter === 'processing'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Đang xử lý
            </button>
            <button
              onClick={() => setStatusFilter('completed')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                statusFilter === 'completed'
                  ? 'bg-green-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Hoàn thành
            </button>
            <button
              onClick={() => setStatusFilter('cancelled')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                statusFilter === 'cancelled'
                  ? 'bg-red-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Đã hủy
            </button>
          </div>
        </div>

        {/* Orders List */}
        {orders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 text-lg mb-4">Chưa có đơn hàng nào</p>
            <Link
              href="/dashboard/pos"
              className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Package className="w-5 h-5" />
              Đặt hàng ngay
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                {/* Order Header */}
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div>
                        <div className="font-semibold text-slate-900 text-lg">{order.order_code}</div>
                        <div className="flex items-center gap-2 text-sm text-slate-600 mt-1">
                          <Calendar className="w-4 h-4" />
                          {formatDate(order.created_at)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {getStatusBadge(order.status)}
                      {getPaymentStatusBadge(order.payment_status)}
                    </div>
                  </div>
                </div>

                {/* Order Body */}
                <div className="px-6 py-4">
                  {/* Items */}
                  <div className="mb-4">
                    <h3 className="font-medium text-slate-700 mb-2">Sản phẩm:</h3>
                    <div className="space-y-2">
                      {order.items.map((item) => (
                        <div key={item.id} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <Package className="w-4 h-4 text-slate-400" />
                            <span className="text-slate-700">{item.seafood.name}</span>
                            <span className="text-slate-500">×{item.quantity}</span>
                            {item.weight > 0 && (
                              <span className="text-slate-500">({item.weight}kg)</span>
                            )}
                          </div>
                          <span className="font-medium text-slate-900">
                            {formatCurrency(item.subtotal)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Order Footer */}
                  <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <DollarSign className="w-4 h-4" />
                        <span>Thanh toán: {order.payment_method === 'bank_transfer' ? 'Chuyển khoản' : 'Tiền mặt'}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-sm text-slate-600">Tổng tiền:</div>
                        <div className="text-xl font-bold text-indigo-600">
                          {formatCurrency(order.total_amount)}
                        </div>
                      </div>
                      <Link
                        href={`/customer/orders/${order.id}`}
                        className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors inline-flex items-center gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        Xem chi tiết
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
