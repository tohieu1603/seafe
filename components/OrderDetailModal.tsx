'use client';

import { useState } from 'react';
import {
  X, Package, User, Phone, MapPin, CreditCard, Calendar,
  Camera, QrCode, DollarSign, FileText, AlertCircle, CheckCircle2,
  Clock, Truck, ZoomIn
} from 'lucide-react';
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

const getStatusConfig = (status: string) => {
  const configs: Record<string, { label: string; color: string; bg: string; icon: any }> = {
    pending: { label: 'Chờ xử lý', color: 'text-yellow-700', bg: 'bg-yellow-100 border-yellow-300', icon: Clock },
    processing: { label: 'Đang xử lý', color: 'text-blue-700', bg: 'bg-blue-100 border-blue-300', icon: Package },
    weighed: { label: 'Đã cân xong', color: 'text-purple-700', bg: 'bg-purple-100 border-purple-300', icon: Camera },
    ready: { label: 'Sẵn sàng giao', color: 'text-indigo-700', bg: 'bg-indigo-100 border-indigo-300', icon: CheckCircle2 },
    shipped: { label: 'Đã gửi', color: 'text-cyan-700', bg: 'bg-cyan-100 border-cyan-300', icon: Truck },
    completed: { label: 'Hoàn thành', color: 'text-green-700', bg: 'bg-green-100 border-green-300', icon: CheckCircle2 },
    cancelled: { label: 'Đã hủy', color: 'text-red-700', bg: 'bg-red-100 border-red-300', icon: X },
  };
  return configs[status] || { label: status, color: 'text-gray-700', bg: 'bg-gray-100', icon: Package };
};

const getPaymentStatusConfig = (status: string) => {
  const configs: Record<string, { label: string; color: string }> = {
    unpaid: { label: 'Chưa thanh toán', color: 'text-red-600' },
    pending_verification: { label: 'Chờ xác minh', color: 'text-yellow-600' },
    paid: { label: 'Đã thanh toán', color: 'text-green-600' },
  };
  return configs[status] || { label: status, color: 'text-gray-600' };
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

export default function OrderDetailModal({ order, isOpen, onClose }: OrderDetailModalProps) {
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrData, setQrData] = useState<any>(null);
  const [isLoadingQR, setIsLoadingQR] = useState(false);
  const [qrError, setQrError] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  if (!isOpen || !order) return null;

  const statusConfig = getStatusConfig(order.status);
  const paymentConfig = getPaymentStatusConfig(order.payment_status);
  const StatusIcon = statusConfig.icon;

  // Check if can pay
  const canShowPayButton =
    (order.status === 'weighed' || order.status === 'completed') &&
    order.payment_method === 'bank_transfer' &&
    order.payment_status !== 'paid';

  const handlePayment = async () => {
    setIsLoadingQR(true);
    setQrError('');

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/seafood/payment/generate-qr/${order.order_code}`,
        { method: 'POST' }
      );

      const data = await response.json();

      if (data.success && data.can_pay) {
        setQrData(data);
        setShowQRModal(true);
      } else {
        setQrError(data.error || 'Không thể tạo mã QR');
      }
    } catch (error) {
      setQrError('Lỗi kết nối. Vui lòng thử lại');
    } finally {
      setIsLoadingQR(false);
    }
  };

  // Collect all weight images
  const allWeightImages = [
    ...order.weight_images,
    ...order.items.filter(item => item.weight_image_url).map(item => item.weight_image_url!)
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[95vh] flex flex-col">

        {/* Header - Compact */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-4">
            <div className={`p-2 rounded-lg ${statusConfig.bg} border`}>
              <StatusIcon className={`w-5 h-5 ${statusConfig.color}`} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">#{order.order_code}</h2>
              <div className="flex items-center gap-3 mt-0.5">
                <span className={`text-sm font-medium ${statusConfig.color}`}>
                  {statusConfig.label}
                </span>
                <span className="text-gray-300">•</span>
                <span className={`text-sm font-medium ${paymentConfig.color}`}>
                  {paymentConfig.label}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content - Filament Style Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid lg:grid-cols-3 gap-6">

            {/* Left Column - Main Info */}
            <div className="lg:col-span-2 space-y-6">

              {/* Items Section */}
              <div className="bg-white border border-gray-200 rounded-lg">
                <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    Sản phẩm ({order.items.length})
                  </h3>
                </div>
                <div className="p-4 space-y-3">
                  {order.items.map((item, index) => (
                    <div key={item.id} className="flex items-start gap-3 pb-3 border-b border-gray-100 last:border-0 last:pb-0">
                      <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded flex items-center justify-center text-sm font-medium text-gray-600">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{item.seafood.name}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{item.seafood.code}</p>
                            <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                              <span>{item.weight} kg × {formatCurrency(item.unit_price)}/kg</span>
                            </div>
                            {item.notes && (
                              <p className="text-xs text-gray-500 mt-1 italic">{item.notes}</p>
                            )}
                          </div>

                          {/* Weight Image Thumbnail */}
                          {item.weight_image_url && (
                            <button
                              onClick={() => setSelectedImage(item.weight_image_url!)}
                              className="relative group flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border border-gray-200 hover:border-blue-400 transition-colors"
                            >
                              <img
                                src={item.weight_image_url}
                                alt={`Ảnh cân ${item.seafood.name}`}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                                <ZoomIn className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                            </button>
                          )}

                          <p className="font-semibold text-gray-900 whitespace-nowrap">
                            {formatCurrency(item.subtotal)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Weight Images */}
              {allWeightImages.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-lg">
                  <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                      <Camera className="w-4 h-4" />
                      Ảnh cân hàng ({allWeightImages.length})
                    </h3>
                  </div>
                  <div className="p-4">
                    <div className="grid grid-cols-3 gap-3">
                      {allWeightImages.map((imageUrl, index) => (
                        <button
                          key={index}
                          onClick={() => setSelectedImage(imageUrl)}
                          className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200 hover:border-blue-400 transition-colors"
                        >
                          <img
                            src={imageUrl}
                            alt={`Ảnh cân ${index + 1}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                            <ZoomIn className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Notes */}
              {order.notes && (
                <div className="bg-white border border-gray-200 rounded-lg">
                  <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Ghi chú
                    </h3>
                  </div>
                  <div className="p-4">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{order.notes}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Details */}
            <div className="space-y-6">

              {/* Summary */}
              <div className="bg-white border border-gray-200 rounded-lg">
                <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Tổng tiền
                  </h3>
                </div>
                <div className="p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tạm tính:</span>
                    <span className="font-medium text-gray-900">{formatCurrency(order.subtotal)}</span>
                  </div>
                  {order.discount_amount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Giảm giá:</span>
                      <span className="font-medium text-green-600">-{formatCurrency(order.discount_amount)}</span>
                    </div>
                  )}
                  <div className="pt-2 border-t border-gray-200 flex justify-between">
                    <span className="font-semibold text-gray-900">Tổng cộng:</span>
                    <span className="font-bold text-lg text-gray-900">{formatCurrency(order.total_amount)}</span>
                  </div>
                </div>
              </div>

              {/* Customer Info */}
              <div className="bg-white border border-gray-200 rounded-lg">
                <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Khách hàng
                  </h3>
                </div>
                <div className="p-4 space-y-3">
                  <div className="flex items-start gap-2">
                    <User className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs text-gray-500">Tên</p>
                      <p className="text-sm font-medium text-gray-900">{order.customer_name || 'Chưa cập nhật'}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Phone className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs text-gray-500">Số điện thoại</p>
                      <p className="text-sm font-medium text-gray-900">{order.customer_phone}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs text-gray-500">Địa chỉ giao hàng</p>
                      <p className="text-sm font-medium text-gray-900 whitespace-pre-wrap">{order.customer_address || 'Chưa cập nhật'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Info */}
              <div className="bg-white border border-gray-200 rounded-lg">
                <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    Thanh toán
                  </h3>
                </div>
                <div className="p-4 space-y-3">
                  <div>
                    <p className="text-xs text-gray-500">Phương thức</p>
                    <p className="text-sm font-medium text-gray-900">{getPaymentMethodLabel(order.payment_method)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Trạng thái</p>
                    <p className={`text-sm font-semibold ${paymentConfig.color}`}>{paymentConfig.label}</p>
                  </div>
                  {order.paid_amount > 0 && (
                    <div>
                      <p className="text-xs text-gray-500">Đã thanh toán</p>
                      <p className="text-sm font-semibold text-green-600">{formatCurrency(order.paid_amount)}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Timeline */}
              <div className="bg-white border border-gray-200 rounded-lg">
                <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Lịch sử
                  </h3>
                </div>
                <div className="p-4 space-y-3">
                  <div>
                    <p className="text-xs text-gray-500">Ngày tạo</p>
                    <p className="text-sm font-medium text-gray-900">{new Date(order.created_at).toLocaleString('vi-VN')}</p>
                  </div>
                  {order.weighed_at && (
                    <div>
                      <p className="text-xs text-gray-500">Cân hàng</p>
                      <p className="text-sm font-medium text-gray-900">{new Date(order.weighed_at).toLocaleString('vi-VN')}</p>
                      {order.weighed_by && (
                        <p className="text-xs text-gray-500 mt-0.5">Bởi: {order.weighed_by}</p>
                      )}
                    </div>
                  )}
                  {order.shipped_at && (
                    <div>
                      <p className="text-xs text-gray-500">Gửi vận chuyển</p>
                      <p className="text-sm font-medium text-gray-900">{new Date(order.shipped_at).toLocaleString('vi-VN')}</p>
                      {order.shipped_by && (
                        <p className="text-xs text-gray-500 mt-0.5">Bởi: {order.shipped_by}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
          <div className="flex-1">
            {qrError && (
              <div className="flex items-center gap-2 text-sm text-red-600">
                <AlertCircle className="w-4 h-4" />
                <span>{qrError}</span>
              </div>
            )}
          </div>
          <div className="flex gap-3">
            {canShowPayButton && (
              <button
                onClick={handlePayment}
                disabled={isLoadingQR}
                className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <QrCode className="w-4 h-4" />
                {isLoadingQR ? 'Đang tải...' : 'Thanh toán'}
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>

      {/* Image Lightbox */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-[60] p-4"
          onClick={() => setSelectedImage(null)}
        >
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>
          <img
            src={selectedImage}
            alt="Ảnh cân hàng"
            className="max-w-full max-h-[90vh] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* QR Payment Modal */}
      {showQRModal && qrData && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full">
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <QrCode className="w-6 h-6 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Quét mã thanh toán</h2>
              <p className="text-sm text-gray-600 mb-6">Sử dụng app ngân hàng để quét mã QR</p>

              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-4">
                <img src={qrData.qr_image_url} alt="QR Code" className="w-full max-w-xs mx-auto" />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 text-left space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Số tiền:</span>
                  <span className="font-bold text-blue-600">{formatCurrency(qrData.amount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Ngân hàng:</span>
                  <span className="font-medium text-gray-900">{qrData.bank_code}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">STK:</span>
                  <span className="font-medium text-gray-900">{qrData.account_number}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Chủ TK:</span>
                  <span className="font-medium text-gray-900">{qrData.account_name}</span>
                </div>
                <div className="pt-2 border-t border-blue-200 flex justify-between text-sm">
                  <span className="text-gray-600">Nội dung:</span>
                  <span className="font-bold text-blue-600">{qrData.content}</span>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-6">
                <p className="text-xs text-yellow-800 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>Vui lòng chuyển khoản <strong>đúng nội dung</strong> để tự động xác nhận</span>
                </p>
              </div>

              <button
                onClick={() => {
                  setShowQRModal(false);
                  setQrData(null);
                }}
                className="w-full bg-gray-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
