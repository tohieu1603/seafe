'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShoppingBag, Package, LogOut, Plus, Eye, Clock, CheckCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/seafood-api';
import OrderDetailModal from '@/components/OrderDetailModal';

interface Order {
  id: string;
  order_code: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  subtotal: number;
  discount_amount: number;
  total_amount: number;
  paid_amount: number;
  payment_method: string;
  payment_status: string;
  status: string;
  notes?: string;
  created_at: string;
  weighed_at?: string;
  weighed_by?: string;
  weight_images: string[];
  shipped_at?: string;
  shipped_by?: string;
  shipping_notes?: string;
  items: any[];
}

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  phone?: string;
  user_type: string;
}

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    pending: 'Chờ xử lý',
    processing: 'Đang xử lý',
    weighed: 'Đã cân',
    ready: 'Sẵn sàng giao',
    shipped: 'Đã gửi vận chuyển',
    completed: 'Hoàn thành',
    cancelled: 'Đã hủy',
  };
  return labels[status] || status;
};

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    processing: 'bg-blue-100 text-blue-800',
    weighed: 'bg-purple-100 text-purple-800',
    ready: 'bg-indigo-100 text-indigo-800',
    shipped: 'bg-cyan-100 text-cyan-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
};

const getPaymentStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    unpaid: 'Chưa thanh toán',
    pending_verification: 'Chờ xác minh',
    paid: 'Đã thanh toán',
  };
  return labels[status] || status;
};

export default function CustomerDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    checkAuth();
    loadOrders();
  }, []);

  const checkAuth = () => {
    const token = localStorage.getItem('access_token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      router.push('/customer/login');
      return;
    }

    const parsedUser = JSON.parse(userData);

    if (parsedUser.user_type !== 'customer') {
      router.push('/dashboard');
      return;
    }

    setUser(parsedUser);
  };

  const loadOrders = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/customer/orders`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load orders');
      }

      const data = await response.json();
      setOrders(data);
    } catch (error) {
      console.error('Failed to load orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    router.push('/customer/login');
  };

  const openOrderDetail = async (orderId: string) => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        console.error('No access token found');
        alert('Vui lòng đăng nhập lại');
        return;
      }

      console.log('Fetching order details for:', orderId);

      // Use customer-specific endpoint
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/customer/orders/${orderId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error('Error response:', errorData);

        if (response.status === 403) {
          alert('Bạn không có quyền xem đơn hàng này.\n\nCó thể:\n- Đơn hàng không thuộc về bạn\n- Số điện thoại trong tài khoản không khớp với đơn hàng');
        } else if (response.status === 404) {
          alert('Không tìm thấy đơn hàng này');
        } else if (response.status === 401) {
          alert('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
          router.push('/customer/login');
        } else {
          alert(`Lỗi: ${errorData?.detail || 'Không thể tải chi tiết đơn hàng'}`);
        }
        return;
      }

      const orderData = await response.json();
      console.log('Order loaded:', orderData.order_code);
      setSelectedOrder(orderData);
      setIsModalOpen(true);
    } catch (error) {
      console.error('Failed to load order details:', error);
      alert('Không thể tải chi tiết đơn hàng. Vui lòng thử lại.');
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedOrder(null);
  };

  const filteredOrders = filterStatus
    ? orders.filter(order => order.status === filterStatus)
    : orders;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Xin chào, {user?.full_name || user?.email}!</h1>
              <p className="text-sm text-gray-600">Quản lý đơn hàng của bạn</p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/order"
                className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Đặt hàng mới
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Đăng xuất
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 sm:p-6">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-md p-5 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Tổng đơn hàng</p>
                <p className="text-2xl font-bold text-gray-800">{orders.length}</p>
              </div>
              <Package className="w-10 h-10 text-indigo-600 opacity-50" />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-5 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Đang xử lý</p>
                <p className="text-2xl font-bold text-blue-600">
                  {orders.filter(o => !['completed', 'cancelled'].includes(o.status)).length}
                </p>
              </div>
              <Clock className="w-10 h-10 text-blue-600 opacity-50" />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-5 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Hoàn thành</p>
                <p className="text-2xl font-bold text-green-600">
                  {orders.filter(o => o.status === 'completed').length}
                </p>
              </div>
              <CheckCircle className="w-10 h-10 text-green-600 opacity-50" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-md p-5 border border-gray-200 mb-6">
          <h2 className="font-semibold text-gray-800 mb-3">Lọc theo trạng thái</h2>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilterStatus('')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filterStatus === ''
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Tất cả
            </button>
            {['pending', 'processing', 'weighed', 'ready', 'shipped', 'completed', 'cancelled'].map(status => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filterStatus === status
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {getStatusLabel(status)}
              </button>
            ))}
          </div>
        </div>

        {/* Orders List */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200">
          <div className="p-5 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <ShoppingBag className="w-6 h-6 text-indigo-600" />
              Đơn hàng của bạn
            </h2>
          </div>

          {filteredOrders.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Package className="w-16 h-16 mx-auto mb-3 opacity-50" />
              <p>Chưa có đơn hàng nào</p>
              <Link
                href="/order"
                className="inline-block mt-4 text-indigo-600 hover:text-indigo-700 font-semibold"
              >
                Đặt hàng ngay →
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredOrders.map((order) => (
                <div key={order.id} className="p-5 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-gray-800 text-lg">{order.order_code}</h3>
                      <p className="text-sm text-gray-500">
                        {new Date(order.created_at).toLocaleString('vi-VN')}
                      </p>
                    </div>
                    <button
                      onClick={() => openOrderDetail(order.id)}
                      className="flex items-center gap-1 text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      Chi tiết
                    </button>
                  </div>

                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}>
                      {getStatusLabel(order.status)}
                    </span>
                    <span className="text-xs text-gray-600">
                      • {getPaymentStatusLabel(order.payment_status)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600">
                      {order.items?.length || 0} sản phẩm
                    </p>
                    <p className="text-xl font-bold text-indigo-600">
                      {formatCurrency(order.total_amount)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Order Detail Modal */}
      <OrderDetailModal
        order={selectedOrder}
        isOpen={isModalOpen}
        onClose={closeModal}
      />
    </div>
  );
}
