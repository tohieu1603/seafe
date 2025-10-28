'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShoppingBag, Package, LogOut, Plus, Eye, Clock, CheckCircle, Phone, DollarSign, Filter, ChevronLeft, ChevronRight, Settings, Search, X, Calendar } from 'lucide-react';
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
    pending_sale_confirm: 'Chờ xác nhận',
    processing: 'Đang xử lý',
    weighed: 'Đã cân',
    ready: 'Sẵn sàng',
    shipped: 'Đã gửi',
    completed: 'Hoàn thành',
    cancelled: 'Đã hủy',
  };
  return labels[status] || status;
};

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700 border-amber-200',
    pending_sale_confirm: 'bg-blue-100 text-blue-700 border-blue-200',
    processing: 'bg-sky-100 text-sky-700 border-sky-200',
    weighed: 'bg-purple-100 text-purple-700 border-purple-200',
    ready: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    shipped: 'bg-cyan-100 text-cyan-700 border-cyan-200',
    completed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    cancelled: 'bg-rose-100 text-rose-700 border-rose-200',
  };
  return colors[status] || 'bg-gray-100 text-gray-700 border-gray-200';
};

const getPaymentStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    unpaid: 'Chưa thanh toán',
    pending_verification: 'Chờ xác minh',
    paid: 'Đã thanh toán',
  };
  return labels[status] || status;
};

const getPaymentStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    unpaid: 'text-amber-600',
    pending_verification: 'text-blue-600',
    paid: 'text-emerald-600',
  };
  return colors[status] || 'text-gray-600';
};

export default function CustomerDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

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
        alert('Vui lòng đăng nhập lại');
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/customer/orders/${orderId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 403) {
          alert('Bạn không có quyền xem đơn hàng này');
        } else if (response.status === 404) {
          alert('Không tìm thấy đơn hàng');
        } else if (response.status === 401) {
          alert('Phiên đăng nhập đã hết hạn');
          router.push('/customer/login');
        }
        return;
      }

      const orderData = await response.json();
      setSelectedOrder(orderData);
      setIsModalOpen(true);
    } catch (error) {
      console.error('Failed to load order details:', error);
      alert('Không thể tải chi tiết đơn hàng');
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedOrder(null);
  };

  const filteredOrders = orders.filter(order => {
    const matchStatus = filterStatus ? order.status === filterStatus : true;
    const matchSearch = searchQuery ? (
      order.order_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer_phone.includes(searchQuery) ||
      (order.customer_name && order.customer_name.toLowerCase().includes(searchQuery.toLowerCase()))
    ) : true;
    return matchStatus && matchSearch;
  });

  // Pagination
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentOrders = filteredOrders.slice(startIndex, endIndex);

  // Reset to page 1 when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus, searchQuery]);

  const totalSpent = orders
    .filter(o => o.status === 'completed')
    .reduce((sum, o) => sum + o.total_amount, 0);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-primary"></div>
          <p className="mt-4 text-gray-600 font-medium">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Filament-style Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <ShoppingBag className="w-5 h-5 text-primary" />
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-lg font-bold text-gray-900">Dashboard</h1>
                  <p className="text-xs text-gray-500">Quản lý đơn hàng</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/order"
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Đặt hàng mới</span>
              </Link>

              <Link
                href="/customer/profile"
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                title="Cài đặt"
              >
                <Settings className="w-5 h-5" />
              </Link>

              <button
                onClick={handleLogout}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                title="Đăng xuất"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* User Info Card - Filament Style */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-white font-bold text-2xl shadow-md">
              {user?.full_name?.[0] || user?.email?.[0] || 'U'}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900">{user?.full_name || user?.email}</h2>
              <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                <Phone className="w-4 h-4" />
                <span>{user?.phone || 'Chưa cập nhật'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid - Filament Style */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
                <Package className="w-6 h-6 text-gray-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Tổng đơn hàng</p>
                <p className="text-2xl font-bold text-gray-900">{orders.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-amber-100 flex items-center justify-center">
                <Clock className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Đang xử lý</p>
                <p className="text-2xl font-bold text-amber-600">
                  {orders.filter(o => !['completed', 'cancelled'].includes(o.status)).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-emerald-100 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Hoàn thành</p>
                <p className="text-2xl font-bold text-emerald-600">
                  {orders.filter(o => o.status === 'completed').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Tổng chi tiêu</p>
                <p className="text-xl font-bold text-blue-600">{formatCurrency(totalSpent)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Table Card - Filament Style */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          {/* Table Header with Search and Filters */}
          <div className="border-b border-gray-200 p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h3 className="text-lg font-semibold text-gray-900">Đơn hàng</h3>

              <div className="flex flex-col sm:flex-row gap-2">
                {/* Search */}
                <div className="relative flex-1 sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Tìm kiếm..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-9 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded"
                    >
                      <X className="w-4 h-4 text-gray-400" />
                    </button>
                  )}
                </div>

                {/* Filter Toggle */}
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
                    filterStatus || showFilters
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Filter className="w-4 h-4" />
                  Lọc
                  {filterStatus && (
                    <span className="px-1.5 py-0.5 bg-primary text-white text-xs rounded">1</span>
                  )}
                </button>
              </div>
            </div>

            {/* Filter Pills */}
            {showFilters && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-xs font-medium text-gray-700 mb-2">Trạng thái</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setFilterStatus('')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                      filterStatus === ''
                        ? 'border-primary bg-primary text-white'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Tất cả ({orders.length})
                  </button>
                  {['pending', 'pending_sale_confirm', 'processing', 'weighed', 'ready', 'shipped', 'completed', 'cancelled'].map(status => {
                    const count = orders.filter(o => o.status === status).length;
                    if (count === 0) return null;
                    return (
                      <button
                        key={status}
                        onClick={() => setFilterStatus(status)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                          filterStatus === status
                            ? 'border-primary bg-primary text-white'
                            : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {getStatusLabel(status)} ({count})
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Table Content */}
          {filteredOrders.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                <Package className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Không có đơn hàng</h3>
              <p className="text-sm text-gray-600 mb-6">
                {searchQuery || filterStatus
                  ? 'Không tìm thấy đơn hàng phù hợp với bộ lọc'
                  : 'Bạn chưa có đơn hàng nào'}
              </p>
              {!searchQuery && !filterStatus && (
                <Link
                  href="/order"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
                >
                  <Plus className="w-4 h-4" />
                  Đặt hàng ngay
                </Link>
              )}
            </div>
          ) : (
            <>
              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-y border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Mã đơn hàng
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider hidden sm:table-cell">
                        Ngày tạo
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider hidden lg:table-cell">
                        Trạng thái
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider hidden lg:table-cell">
                        Thanh toán
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Tổng tiền
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                        Hành động
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {currentOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-4">
                          <div>
                            <p className="font-semibold text-gray-900 text-sm">{order.order_code}</p>
                            <p className="text-xs text-gray-600 mt-0.5 sm:hidden">
                              {new Date(order.created_at).toLocaleDateString('vi-VN')}
                            </p>
                            <div className="flex gap-2 mt-1 lg:hidden">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${getStatusColor(order.status)}`}>
                                {getStatusLabel(order.status)}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-600 hidden sm:table-cell">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span>{new Date(order.created_at).toLocaleDateString('vi-VN')}</span>
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {new Date(order.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </td>
                        <td className="px-4 py-4 hidden lg:table-cell">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border ${getStatusColor(order.status)}`}>
                            {getStatusLabel(order.status)}
                          </span>
                        </td>
                        <td className="px-4 py-4 hidden lg:table-cell">
                          <span className={`text-sm font-medium ${getPaymentStatusColor(order.payment_status)}`}>
                            {getPaymentStatusLabel(order.payment_status)}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <p className="font-semibold text-gray-900">{formatCurrency(order.total_amount)}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{order.items?.length || 0} sản phẩm</p>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <button
                            onClick={() => openOrderDetail(order.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary/5 rounded-lg transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                            <span className="hidden sm:inline">Xem</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination - Filament Style */}
              {totalPages > 1 && (
                <div className="border-t border-gray-200 px-4 py-3 bg-gray-50">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-sm text-gray-700">
                      Hiển thị <span className="font-medium">{startIndex + 1}</span> đến{' '}
                      <span className="font-medium">{Math.min(endIndex, filteredOrders.length)}</span> trong{' '}
                      <span className="font-medium">{filteredOrders.length}</span> kết quả
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Items per page */}
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-700">Hiển thị</span>
                        <select
                          value={itemsPerPage}
                          onChange={(e) => {
                            setItemsPerPage(Number(e.target.value));
                            setCurrentPage(1);
                          }}
                          className="px-2 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        >
                          <option value={5}>5</option>
                          <option value={10}>10</option>
                          <option value={20}>20</option>
                          <option value={50}>50</option>
                        </select>
                      </div>

                      {/* Pagination buttons */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                          disabled={currentPage === 1}
                          className="p-2 text-gray-700 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>

                        {/* Page numbers */}
                        <div className="flex gap-1">
                          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            let pageNum;
                            if (totalPages <= 5) {
                              pageNum = i + 1;
                            } else if (currentPage <= 3) {
                              pageNum = i + 1;
                            } else if (currentPage >= totalPages - 2) {
                              pageNum = totalPages - 4 + i;
                            } else {
                              pageNum = currentPage - 2 + i;
                            }

                            return (
                              <button
                                key={i}
                                onClick={() => setCurrentPage(pageNum)}
                                className={`min-w-[2rem] px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                                  currentPage === pageNum
                                    ? 'bg-primary text-white'
                                    : 'text-gray-700 hover:bg-gray-100'
                                }`}
                              >
                                {pageNum}
                              </button>
                            );
                          })}
                        </div>

                        <button
                          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                          disabled={currentPage === totalPages}
                          className="p-2 text-gray-700 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
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
