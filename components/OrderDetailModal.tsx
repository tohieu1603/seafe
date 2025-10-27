'use client';

import { X, Package, Clock, CheckCircle, Truck, Image as ImageIcon, User, CreditCard } from 'lucide-react';
import { formatCurrency } from '@/lib/seafood-api';

interface OrderItem {
  id: string;
  seafood: {
    id: string;
    name: string;
    code: string;
  };
  weight: number;
  unit_price: number;
  subtotal: number;
  notes?: string;
  weight_image_url?: string;
}

interface Order {
  id: string;
  order_code: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  customer_source?: string;
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
  items: OrderItem[];
}

interface OrderDetailModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
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

const getPaymentMethodLabel = (method: string) => {
  const labels: Record<string, string> = {
    cash: 'Tiền mặt',
    bank_transfer: 'Chuyển khoản',
    cod: 'Tiền khi nhận hàng',
    momo: 'MoMo',
  };
  return labels[method] || method;
};

const getPaymentStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    unpaid: 'Chưa thanh toán',
    pending_verification: 'Chờ xác minh',
    paid: 'Đã thanh toán',
  };
  return labels[status] || status;
};

const getStatusSteps = (currentStatus: string) => {
  const steps = [
    { key: 'pending', label: 'Chờ xử lý', icon: Clock },
    { key: 'processing', label: 'Đang xử lý', icon: Package },
    { key: 'weighed', label: 'Đã cân', icon: CheckCircle },
    { key: 'shipped', label: 'Đã gửi', icon: Truck },
    { key: 'completed', label: 'Hoàn thành', icon: CheckCircle },
  ];

  const statusOrder = ['pending', 'processing', 'weighed', 'ready', 'shipped', 'completed'];
  const currentIndex = statusOrder.indexOf(currentStatus);

  return steps.map((step, index) => {
    const stepIndex = statusOrder.indexOf(step.key);
    return {
      ...step,
      completed: stepIndex <= currentIndex,
      active: step.key === currentStatus,
    };
  });
};

export default function OrderDetailModal({ order, isOpen, onClose }: OrderDetailModalProps) {
  if (!isOpen || !order) return null;

  const statusSteps = getStatusSteps(order.status);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Chi tiết đơn hàng</h2>
            <p className="text-sm text-gray-600 mt-1">{order.order_code}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Status Timeline */}
          <div className="bg-gray-50 rounded-xl p-6 mb-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Trạng thái đơn hàng</h3>
            <div className="relative">
              <div className="flex items-center justify-between">
                {statusSteps.map((step, index) => {
                  const Icon = step.icon;
                  return (
                    <div key={step.key} className="flex flex-col items-center flex-1 relative">
                      {index > 0 && (
                        <div
                          className={`absolute top-6 right-1/2 w-full h-1 -z-10 ${
                            step.completed ? 'bg-green-500' : 'bg-gray-300'
                          }`}
                          style={{ transform: 'translateY(-50%)' }}
                        />
                      )}
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${
                          step.completed
                            ? 'bg-green-500 text-white'
                            : step.active
                            ? 'bg-indigo-500 text-white'
                            : 'bg-gray-300 text-gray-600'
                        }`}
                      >
                        <Icon className="w-6 h-6" />
                      </div>
                      <p
                        className={`text-xs font-medium text-center ${
                          step.completed || step.active ? 'text-gray-800' : 'text-gray-500'
                        }`}
                      >
                        {step.label}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column: Order Items */}
            <div className="space-y-6">
              {/* Order Items */}
              <div className="bg-white rounded-xl border border-gray-200">
                <div className="p-4 border-b border-gray-200">
                  <h3 className="text-lg font-bold text-gray-800">Sản phẩm</h3>
                </div>
                <div className="p-4 space-y-3">
                  {order.items.map((item) => (
                    <div key={item.id} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-semibold text-gray-800">{item.seafood.name}</h4>
                          <p className="text-xs text-gray-600">Mã: {item.seafood.code}</p>
                        </div>
                        <p className="text-lg font-bold text-indigo-600">{formatCurrency(item.subtotal)}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-gray-600">Cân nặng:</span>
                          <span className="ml-2 font-semibold">{item.weight} kg</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Đơn giá:</span>
                          <span className="ml-2 font-semibold">{formatCurrency(item.unit_price)}/kg</span>
                        </div>
                      </div>
                      {item.notes && (
                        <p className="text-sm text-gray-600 mt-2">
                          <span className="font-medium">Ghi chú:</span> {item.notes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Weight Images */}
              {order.weight_images && order.weight_images.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200">
                  <div className="p-4 border-b border-gray-200">
                    <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                      <ImageIcon className="w-5 h-5" />
                      Ảnh cân hàng
                    </h3>
                  </div>
                  <div className="p-4">
                    <div className="grid grid-cols-2 gap-3">
                      {order.weight_images.map((imageUrl, index) => (
                        <img
                          key={index}
                          src={imageUrl}
                          alt={`Weight image ${index + 1}`}
                          className="rounded-lg w-full h-24 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Customer Info & Payment */}
            <div className="space-y-6">
              {/* Customer Info */}
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Thông tin khách hàng
                </h3>
                <div className="space-y-3 text-sm">
                  {order.customer_name && (
                    <div>
                      <span className="text-gray-600">Tên:</span>
                      <p className="font-semibold text-gray-800">{order.customer_name}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-gray-600">Số điện thoại:</span>
                    <p className="font-semibold text-gray-800">{order.customer_phone}</p>
                  </div>
                  {order.customer_address && order.customer_address.trim() && (
                    <div>
                      <span className="text-gray-600">Địa chỉ:</span>
                      <p className="font-semibold text-gray-800 whitespace-pre-wrap">{order.customer_address}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Payment Info */}
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Thanh toán
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tạm tính:</span>
                    <span className="font-semibold">{formatCurrency(order.subtotal)}</span>
                  </div>
                  {order.discount_amount > 0 && (
                    <div className="flex justify-between text-sm text-red-600">
                      <span>Giảm giá:</span>
                      <span className="font-semibold">-{formatCurrency(order.discount_amount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold pt-3 border-t border-gray-300">
                    <span>Tổng cộng:</span>
                    <span className="text-indigo-600">{formatCurrency(order.total_amount)}</span>
                  </div>
                  {order.payment_method && (
                    <div className="text-sm pt-2">
                      <span className="text-gray-600">Phương thức: </span>
                      <span className="font-semibold">{getPaymentMethodLabel(order.payment_method)}</span>
                    </div>
                  )}
                  <div className="text-sm">
                    <span className="text-gray-600">Trạng thái: </span>
                    <span className={`font-semibold ${order.payment_status === 'paid' ? 'text-green-600' : 'text-orange-600'}`}>
                      {getPaymentStatusLabel(order.payment_status)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {(order.notes || order.shipping_notes) && (
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">Ghi chú</h3>
                  <div className="space-y-3 text-sm">
                    {order.notes && (
                      <div>
                        <span className="text-gray-600">Ghi chú đơn hàng:</span>
                        <p className="font-semibold text-gray-800 whitespace-pre-wrap">{order.notes}</p>
                      </div>
                    )}
                    {order.shipping_notes && (
                      <div>
                        <span className="text-gray-600">Ghi chú vận chuyển:</span>
                        <p className="font-semibold text-gray-800 whitespace-pre-wrap">{order.shipping_notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Timeline */}
              {(order.weighed_at || order.shipped_at) && (
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">Lịch sử xử lý</h3>
                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="text-gray-600">Tạo đơn:</span>
                      <p className="font-semibold">{new Date(order.created_at).toLocaleString('vi-VN')}</p>
                    </div>
                    {order.weighed_at && (
                      <div>
                        <span className="text-gray-600">Đã cân:</span>
                        <p className="font-semibold">{new Date(order.weighed_at).toLocaleString('vi-VN')}</p>
                        {order.weighed_by && <p className="text-xs text-gray-500">Bởi: {order.weighed_by}</p>}
                      </div>
                    )}
                    {order.shipped_at && (
                      <div>
                        <span className="text-gray-600">Gửi hàng:</span>
                        <p className="font-semibold">{new Date(order.shipped_at).toLocaleString('vi-VN')}</p>
                        {order.shipped_by && <p className="text-xs text-gray-500">Bởi: {order.shipped_by}</p>}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
