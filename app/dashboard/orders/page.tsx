'use client';

import { useState, useEffect } from 'react';
import { ordersAPI, formatCurrency, formatWeight, Order } from '@/lib/seafood-api';
import { ShoppingCart, Search, Filter, X, ChevronDown, ChevronRight, Phone, User, MapPin } from 'lucide-react';

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>('all');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const ordersData = await ordersAPI.list({ limit: 1000 });
      setOrders(ordersData);
    } catch (error) {
      console.error('Failed to load orders:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter logic
  const filteredOrders = orders.filter(order => {
    const matchSearch = searchQuery === '' ||
      order.order_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer_phone.includes(searchQuery) ||
      (order.customer_name && order.customer_name.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchStatus = statusFilter === 'all' || order.status === statusFilter;
    const matchPaymentStatus = paymentStatusFilter === 'all' || order.payment_status === paymentStatusFilter;
    return matchSearch && matchStatus && matchPaymentStatus;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedOrders = filteredOrders.slice(startIndex, startIndex + itemsPerPage);

  const toggleRow = (orderId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(orderId)) {
      newExpanded.delete(orderId);
    } else {
      newExpanded.add(orderId);
    }
    setExpandedRows(newExpanded);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setPaymentStatusFilter('all');
    setCurrentPage(1);
  };

  const hasActiveFilters = searchQuery || statusFilter !== 'all' || paymentStatusFilter !== 'all';

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-700',
      processing: 'bg-blue-100 text-blue-700',
      completed: 'bg-emerald-100 text-emerald-700',
      cancelled: 'bg-red-100 text-red-700',
    };
    const labels: Record<string, string> = {
      pending: 'Chờ xử lý',
      processing: 'Đang xử lý',
      completed: 'Hoàn thành',
      cancelled: 'Đã hủy',
    };
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${styles[status] || 'bg-slate-100 text-slate-600'}`}>
        {labels[status] || status}
      </span>
    );
  };

  const getPaymentStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-700',
      paid: 'bg-emerald-100 text-emerald-700',
      refunded: 'bg-red-100 text-red-700',
    };
    const labels: Record<string, string> = {
      pending: 'Chưa thanh toán',
      paid: 'Đã thanh toán',
      refunded: 'Đã hoàn tiền',
    };
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${styles[status] || 'bg-slate-100 text-slate-600'}`}>
        {labels[status] || status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <ShoppingCart className="w-16 h-16 text-indigo-600 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 overflow-x-hidden">
      <div className="w-full max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 flex items-center gap-2 sm:gap-3">
            <ShoppingCart className="w-6 h-6 sm:w-8 sm:h-8 text-indigo-600" />
            Quản lý Đơn hàng
          </h1>
          <p className="text-sm sm:text-base text-slate-600 mt-1">Theo dõi và quản lý đơn hàng</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6 mb-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-slate-600" />
            <h3 className="font-semibold text-slate-900">Bộ lọc</h3>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="ml-auto text-xs sm:text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
              >
                <X className="w-4 h-4" />
                <span className="hidden sm:inline">Xóa bộ lọc</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Tìm kiếm
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Mã đơn, SĐT, tên khách..."
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Trạng thái đơn
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="all">Tất cả</option>
                <option value="pending">Chờ xử lý</option>
                <option value="processing">Đang xử lý</option>
                <option value="completed">Hoàn thành</option>
                <option value="cancelled">Đã hủy</option>
              </select>
            </div>

            {/* Payment Status */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Thanh toán
              </label>
              <select
                value={paymentStatusFilter}
                onChange={(e) => setPaymentStatusFilter(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="all">Tất cả</option>
                <option value="pending">Chưa thanh toán</option>
                <option value="paid">Đã thanh toán</option>
                <option value="refunded">Đã hoàn tiền</option>
              </select>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <div className="bg-white rounded-lg border border-slate-200 p-3 sm:p-4">
            <p className="text-xs sm:text-sm text-slate-600">Tổng đơn hàng</p>
            <p className="text-xl sm:text-2xl font-bold text-slate-900">{orders.length}</p>
          </div>
          <div className="bg-white rounded-lg border border-slate-200 p-3 sm:p-4">
            <p className="text-xs sm:text-sm text-slate-600">Hoàn thành</p>
            <p className="text-xl sm:text-2xl font-bold text-emerald-600">
              {orders.filter(o => o.status === 'completed').length}
            </p>
          </div>
          <div className="bg-white rounded-lg border border-slate-200 p-3 sm:p-4">
            <p className="text-xs sm:text-sm text-slate-600">Đang xử lý</p>
            <p className="text-xl sm:text-2xl font-bold text-blue-600">
              {orders.filter(o => o.status === 'processing' || o.status === 'pending').length}
            </p>
          </div>
          <div className="bg-white rounded-lg border border-slate-200 p-3 sm:p-4">
            <p className="text-xs sm:text-sm text-slate-600">Kết quả lọc</p>
            <p className="text-xl sm:text-2xl font-bold text-indigo-600">{filteredOrders.length}</p>
          </div>
        </div>

        {/* Table - Desktop only, Cards for mobile */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          {/* Mobile Cards View */}
          <div className="block lg:hidden divide-y divide-slate-200">
            {paginatedOrders.length === 0 ? (
              <div className="px-4 py-8 text-center text-slate-500">
                Không tìm thấy đơn hàng nào
              </div>
            ) : (
              paginatedOrders.map((order) => (
                <div key={order.id} className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-sm font-mono font-semibold text-indigo-600">{order.order_code}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        {new Date(order.created_at).toLocaleDateString('vi-VN', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <div className="flex flex-col gap-1 items-end">
                      {getStatusBadge(order.status)}
                      {getPaymentStatusBadge(order.payment_status)}
                    </div>
                  </div>

                  <div className="space-y-2 mb-3">
                    <div className="flex items-center gap-2 text-sm">
                      <User className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-900">{order.customer_name || 'Khách'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-600">{order.customer_phone}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                    <div>
                      <p className="text-xs text-slate-500">Số món</p>
                      <p className="text-sm font-semibold text-slate-900">{order.items?.length || 0} món</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-500">Tổng tiền</p>
                      <p className="text-base font-bold text-emerald-600">
                        {formatCurrency(Number(order.total_amount))}
                      </p>
                    </div>
                  </div>

                  {order.items && order.items.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-200">
                      <p className="text-xs font-semibold text-slate-700 mb-2">Chi tiết đơn hàng:</p>
                      <div className="space-y-1">
                        {order.items.map((item: any, idx: number) => (
                          <div key={idx} className="flex justify-between text-xs">
                            <span className="text-slate-600">
                              {item.seafood?.name || item.product_name || 'Sản phẩm'} × {formatWeight(Number(item.quantity))}
                            </span>
                            <span className="font-medium text-slate-900">
                              {formatCurrency(Number(item.subtotal))}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase w-10"></th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Mã đơn</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Khách hàng</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">SĐT</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-slate-500 uppercase">Số món</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Tổng tiền</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Trạng thái</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Thanh toán</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Thời gian</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {paginatedOrders.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-slate-500">
                      Không tìm thấy đơn hàng nào
                    </td>
                  </tr>
                ) : (
                  paginatedOrders.map((order) => {
                    const isExpanded = expandedRows.has(order.id);

                    return (
                      <>
                        {/* Main Row */}
                        <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3">
                            <button
                              onClick={() => toggleRow(order.id)}
                              className="text-slate-400 hover:text-slate-600 transition-colors"
                            >
                              {isExpanded ? (
                                <ChevronDown className="w-5 h-5" />
                              ) : (
                                <ChevronRight className="w-5 h-5" />
                              )}
                            </button>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm font-mono font-semibold text-indigo-600">
                              {order.order_code}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-sm text-slate-900">{order.customer_name || '-'}</p>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm text-slate-600">{order.customer_phone}</span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="inline-flex items-center justify-center w-8 h-8 bg-slate-100 text-slate-700 rounded-full text-sm font-semibold">
                              {order.items?.length || 0}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="text-sm font-bold text-emerald-600">
                              {formatCurrency(Number(order.total_amount))}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {getStatusBadge(order.status)}
                          </td>
                          <td className="px-4 py-3">
                            {getPaymentStatusBadge(order.payment_status)}
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm text-slate-600">
                              {new Date(order.created_at).toLocaleDateString('vi-VN', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </td>
                        </tr>

                        {/* Expanded Detail Row */}
                        {isExpanded && (
                          <tr>
                            <td colSpan={9} className="px-4 py-4 bg-slate-50">
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Customer Info */}
                                <div>
                                  <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                                    <User className="w-4 h-4" />
                                    Thông tin khách hàng
                                  </h4>
                                  <dl className="space-y-2 text-sm">
                                    <div className="flex items-start gap-2">
                                      <dt className="text-slate-600 flex items-center gap-1">
                                        <User className="w-3.5 h-3.5" />
                                        Tên:
                                      </dt>
                                      <dd className="font-medium text-slate-900">
                                        {order.customer_name || 'Không có'}
                                      </dd>
                                    </div>
                                    <div className="flex items-start gap-2">
                                      <dt className="text-slate-600 flex items-center gap-1">
                                        <Phone className="w-3.5 h-3.5" />
                                        SĐT:
                                      </dt>
                                      <dd className="font-medium text-slate-900">{order.customer_phone}</dd>
                                    </div>
                                    <div className="flex items-start gap-2">
                                      <dt className="text-slate-600 flex items-center gap-1">
                                        <MapPin className="w-3.5 h-3.5" />
                                        Địa chỉ:
                                      </dt>
                                      <dd className="font-medium text-slate-900">
                                        {order.customer_address || 'Không có'}
                                      </dd>
                                    </div>
                                    {order.notes && (
                                      <div className="flex items-start gap-2">
                                        <dt className="text-slate-600">Ghi chú:</dt>
                                        <dd className="font-medium text-slate-900">{order.notes}</dd>
                                      </div>
                                    )}
                                  </dl>
                                </div>

                                {/* Order Items */}
                                <div>
                                  <h4 className="font-semibold text-slate-900 mb-3">Chi tiết đơn hàng</h4>
                                  <div className="space-y-3">
                                    {order.items && order.items.length > 0 ? (
                                      order.items.map((item, idx) => (
                                        <div
                                          key={idx}
                                          className="bg-white rounded-lg p-3 border border-slate-200"
                                        >
                                          <div className="flex justify-between items-start mb-2">
                                            <p className="font-medium text-slate-900 text-sm">
                                              {item.seafood?.name}
                                            </p>
                                            <span className="text-sm font-bold text-emerald-600">
                                              {formatCurrency(Number(item.weight) * Number(item.unit_price))}
                                            </span>
                                          </div>
                                          <div className="flex justify-between text-xs text-slate-600">
                                            <span>
                                              {formatWeight(Number(item.weight))} × {formatCurrency(Number(item.unit_price))}/kg
                                            </span>
                                          </div>
                                          {item.notes && (
                                            <p className="text-xs text-slate-500 mt-1 italic">
                                              {item.notes}
                                            </p>
                                          )}
                                        </div>
                                      ))
                                    ) : (
                                      <p className="text-sm text-slate-500">Không có sản phẩm</p>
                                    )}
                                  </div>

                                  {/* Order Summary */}
                                  <div className="mt-4 pt-3 border-t border-slate-200 space-y-2">
                                    <div className="flex justify-between text-sm">
                                      <span className="text-slate-600">Tạm tính:</span>
                                      <span className="font-medium text-slate-900">
                                        {formatCurrency(Number(order.subtotal))}
                                      </span>
                                    </div>
                                    {Number(order.discount_amount) > 0 && (
                                      <div className="flex justify-between text-sm">
                                        <span className="text-slate-600">Giảm giá:</span>
                                        <span className="font-medium text-red-600">
                                          -{formatCurrency(Number(order.discount_amount))}
                                        </span>
                                      </div>
                                    )}
                                    <div className="flex justify-between text-base font-bold">
                                      <span className="text-slate-900">Tổng cộng:</span>
                                      <span className="text-emerald-600">
                                        {formatCurrency(Number(order.total_amount))}
                                      </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                      <span className="text-slate-600">Đã thanh toán:</span>
                                      <span className="font-medium text-slate-900">
                                        {formatCurrency(Number(order.paid_amount))}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {filteredOrders.length > 0 && (
            <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-600">Hiển thị</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-3 py-1 border border-slate-300 rounded-lg text-sm"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span className="text-sm text-slate-600">
                  trên {filteredOrders.length} kết quả
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border border-slate-300 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
                >
                  Trước
                </button>
                <span className="text-sm text-slate-600">
                  Trang {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 border border-slate-300 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
                >
                  Sau
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
