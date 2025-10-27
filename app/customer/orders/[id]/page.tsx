'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Package, Clock, CheckCircle, Truck, Image as ImageIcon, User } from 'lucide-react';
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

export default function OrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
    if (orderId) {
      loadOrder();
    }
  }, [orderId]);

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
    }
  };

  const loadOrder = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;

      // Use customer-specific endpoint
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/customer/orders/${orderId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 403) {
          alert('Bạn không có quyền xem đơn hàng này');
          router.push('/customer/dashboard');
        } else if (response.status === 404) {
          alert('Không tìm thấy đơn hàng');
          router.push('/customer/dashboard');
        } else {
          throw new Error('Failed to load order');
        }
        return;
      }

      const data = await response.json();
      setOrder(data);
    } catch (error) {
      console.error('Failed to load order:', error);
      alert('Không thể tải thông tin đơn hàng');
      router.push('/customer/dashboard');
    } finally {
      setIsLoading(false);
    }
  };

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

  if (!order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Không tìm thấy đơn hàng</p>
          <Link href="/customer/dashboard" className="text-indigo-600 hover:text-indigo-700 mt-4 inline-block">
            ← Quay lại trang chủ
          </Link>
        </div>
      </div>
    );
  }

  const statusSteps = getStatusSteps(order.status);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/customer/dashboard"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-gray-600" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Chi tiết đơn hàng</h1>
              <p className="text-sm text-gray-600">{order.order_code}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 sm:p-6">
        {/* Status Timeline */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200 mb-6">
          <h2 className="text-lg font-bold text-gray-800 mb-6">Trạng thái đơn hàng</h2>
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Order Items & Images */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Items */}
            <div className="bg-white rounded-xl shadow-md border border-gray-200">
              <div className="p-5 border-b border-gray-200">
                <h2 className="text-lg font-bold text-gray-800">Sản phẩm</h2>
              </div>
              <div className="p-5 space-y-4">
                {order.items.map((item) => (
                  <div key={item.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-gray-800">{item.seafood.name}</h3>
                        <p className="text-sm text-gray-600">Mã: {item.seafood.code}</p>
                      </div>
                      <p className="text-lg font-bold text-indigo-600">{formatCurrency(item.subtotal)}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
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
                    {item.weight_image_url && (
                      <div className="mt-3">
                        <img
                          src={item.weight_image_url}
                          alt="Weight proof"
                          className="rounded-lg cursor-pointer hover:opacity-90 transition-opacity max-w-xs"
                          onClick={() => setSelectedImage(item.weight_image_url!)}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Weight Images */}
            {order.weight_images && order.weight_images.length > 0 && (
              <div className="bg-white rounded-xl shadow-md border border-gray-200">
                <div className="p-5 border-b border-gray-200">
                  <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <ImageIcon className="w-5 h-5" />
                    Ảnh cân hàng
                  </h2>
                </div>
                <div className="p-5">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {order.weight_images.map((imageUrl, index) => (
                      <img
                        key={index}
                        src={imageUrl}
                        alt={`Weight image ${index + 1}`}
                        className="rounded-lg cursor-pointer hover:opacity-90 transition-opacity w-full h-32 object-cover"
                        onClick={() => setSelectedImage(imageUrl)}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right: Order Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* Customer Info */}
            <div className="bg-white rounded-xl shadow-md border border-gray-200 p-5">
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <User className="w-5 h-5" />
                Thông tin khách hàng
              </h2>
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
                {order.customer_address && (
                  <div>
                    <span className="text-gray-600">Địa chỉ:</span>
                    <p className="font-semibold text-gray-800 whitespace-pre-wrap">{order.customer_address}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Payment Info */}
            <div className="bg-white rounded-xl shadow-md border border-gray-200 p-5">
              <h2 className="text-lg font-bold text-gray-800 mb-4">Thanh toán</h2>
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
                    <span className="font-semibold">{order.payment_method}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Timeline Info */}
            {(order.weighed_at || order.shipped_at) && (
              <div className="bg-white rounded-xl shadow-md border border-gray-200 p-5">
                <h2 className="text-lg font-bold text-gray-800 mb-4">Lịch sử xử lý</h2>
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

            {/* Notes */}
            {(order.notes || order.shipping_notes) && (
              <div className="bg-white rounded-xl shadow-md border border-gray-200 p-5">
                <h2 className="text-lg font-bold text-gray-800 mb-4">Ghi chú</h2>
                <div className="space-y-3 text-sm">
                  {order.notes && (
                    <div>
                      <span className="text-gray-600">Ghi chú đơn hàng:</span>
                      <p className="font-semibold text-gray-800">{order.notes}</p>
                    </div>
                  )}
                  {order.shipping_notes && (
                    <div>
                      <span className="text-gray-600">Ghi chú vận chuyển:</span>
                      <p className="font-semibold text-gray-800">{order.shipping_notes}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img
              src={selectedImage}
              alt="Full size"
              className="max-w-full max-h-[90vh] rounded-lg"
            />
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 bg-white text-gray-800 rounded-full p-2 hover:bg-gray-200 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
