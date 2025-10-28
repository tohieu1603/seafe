'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { productsAPI, categoriesAPI, formatCurrency, Seafood, Category, OrderItem } from '@/lib/seafood-api';
import { Search, Plus, Trash2, ShoppingBag, Check, X } from 'lucide-react';
import AddressSelector from '@/components/AddressSelector';

const getUnitLabel = (unitType: string) => {
  switch (unitType) {
    case 'piece': return 'con';
    case 'box': return 'thùng';
    default: return 'kg';
  }
};

export default function PublicOrderPage() {
  const [products, setProducts] = useState<Seafood[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  // Multi-select modal
  const [showProductSelect, setShowProductSelect] = useState(false);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);

  // Customer info
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerSource, setCustomerSource] = useState<string>('');
  const [orderNotes, setOrderNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<string>('');

  const [isProcessing, setIsProcessing] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderCode, setOrderCode] = useState('');
  const [orderAmount, setOrderAmount] = useState(0);
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrImageUrl, setQrImageUrl] = useState('');
  const [isCheckingPayment, setIsCheckingPayment] = useState(false);
  const [paymentChecked, setPaymentChecked] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    checkAuth();
    loadData();
  }, []);

  const checkAuth = () => {
    const token = localStorage.getItem('access_token');
    const userData = localStorage.getItem('user');

    if (token && userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      setIsLoggedIn(true);

      // Auto-fill customer info if logged in
      if (parsedUser.user_type === 'customer') {
        setCustomerName(parsedUser.full_name || '');
        setCustomerPhone(parsedUser.phone || '');
      }
    }
  };

  const loadData = async () => {
    try {
      const [productsData, categoriesData] = await Promise.all([
        productsAPI.list({ status: 'active' }),
        categoriesAPI.list(),
      ]);
      setProducts(productsData);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };

  const filteredProducts = products.filter(p => {
    const matchSearch = searchQuery === '' ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCategory = selectedCategory === '' || p.category_id === selectedCategory;
    return matchSearch && matchCategory;
  });

  const toggleProductSelection = (productId: string) => {
    if (selectedProductIds.includes(productId)) {
      setSelectedProductIds(selectedProductIds.filter(id => id !== productId));
    } else {
      setSelectedProductIds([...selectedProductIds, productId]);
    }
  };

  const addSelectedToCart = () => {
    if (selectedProductIds.length === 0) {
      alert('Vui lòng chọn ít nhất 1 sản phẩm!');
      return;
    }

    const newItems = selectedProductIds
      .map(id => {
        const product = products.find(p => p.id === id);
        if (!product) return null;

        const item: OrderItem = {
          seafood_id: product.id,
          seafood: product,
          quantity: 1,
          estimated_weight_range: '', // Customer sẽ chọn khoảng cân
          weight: null, // Chưa có weight thực tế (chưa cân)
          unit_price: Number(product.current_price),
          notes: '',
        };
        return item;
      })
      .filter((item): item is OrderItem => item !== null);

    setCart([...cart, ...newItems]);
    setShowProductSelect(false);
    setSelectedProductIds([]);
  };

  const removeFromCart = (index: number) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const updateCartItem = (index: number, field: 'quantity' | 'weight' | 'estimated_weight_range' | 'notes', value: any) => {
    const updated = [...cart];
    const item = updated[index];

    if (field === 'quantity') {
      item.quantity = Math.max(1, parseInt(value) || 1);
    } else if (field === 'estimated_weight_range') {
      item.estimated_weight_range = value;
    } else if (field === 'weight') {
      if (value === '' || value === null || value === undefined) {
        item.weight = null;
      } else {
        const weight = Math.max(0, parseFloat(value));
        item.weight = isNaN(weight) ? null : weight;
      }
    } else if (field === 'notes') {
      item.notes = value;
    }

    setCart(updated);
  };

  const sanitizeDecimalInput = (value: string) => value.replace(/,/g, '.');
  const isValidDecimalInput = (value: string) => value === '' || /^\d*\.?\d*$/.test(value);

  // Helper function to parse weight range (e.g., "2-5kg" -> {min: 2, max: 5})
  const parseWeightRange = (range: string): { min: number; max: number } | null => {
    if (!range) return null;
    const match = range.match(/(\d+\.?\d*)\s*-\s*(\d+\.?\d*)/);
    if (!match) return null;
    return { min: parseFloat(match[1]), max: parseFloat(match[2]) };
  };

  // Calculate estimated price range for an item
  const getEstimatedPriceRange = (item: OrderItem): { min: number; max: number } | null => {
    if (!item.estimated_weight_range) return null;
    const range = parseWeightRange(item.estimated_weight_range);
    if (!range) return null;
    return {
      min: range.min * item.unit_price,
      max: range.max * item.unit_price,
    };
  };

  // Calculate total estimated price range
  const totalEstimatedRange = cart.reduce((acc, item) => {
    const priceRange = getEstimatedPriceRange(item);
    if (!priceRange) return acc;
    return {
      min: acc.min + priceRange.min,
      max: acc.max + priceRange.max,
    };
  }, { min: 0, max: 0 });

  const subtotal = cart.reduce((sum, item) => {
    // Chỉ tính tổng cho item đã có weight (đã cân xong)
    const weight = item.weight || 0;
    return sum + (weight * item.unit_price);
  }, 0);

  const processOrder = async () => {
    if (!customerPhone) {
      alert('Vui lòng nhập số điện thoại!');
      return;
    }

    if (cart.length === 0) {
      alert('Vui lòng thêm sản phẩm vào giỏ hàng!');
      return;
    }

    // Kiểm tra xem đã chọn khoảng cân cho tất cả sản phẩm chưa
    const hasInvalidWeightRange = cart.some(item => !item.estimated_weight_range || item.estimated_weight_range === '');
    if (hasInvalidWeightRange) {
      alert('Vui lòng chọn khoảng cân cho tất cả sản phẩm!');
      return;
    }

    try {
      setIsProcessing(true);

      const orderData = {
        customer_phone: customerPhone,
        customer_name: customerName,
        customer_address: customerAddress,
        customer_source: customerSource,
        payment_method: paymentMethod,
        payment_status: 'unpaid',
        discount_amount: 0,
        notes: orderNotes,
        items: cart.map(item => ({
          seafood_id: item.seafood_id,
          quantity: item.quantity,
          estimated_weight_range: item.estimated_weight_range,
          weight: item.weight, // null khi customer tạo đơn
          unit_price: item.unit_price,
          notes: item.notes || '',
        })),
      };

      // Add authorization header if logged in
      const token = localStorage.getItem('access_token');
      const headers: any = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/seafood/orders`, {
        method: 'POST',
        headers,
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        throw new Error('Failed to create order');
      }

      const order = await response.json();

      setOrderCode(order.order_code);
      setOrderAmount(order.total_amount);

      // DO NOT show QR immediately - customer must wait for weighing first
      // Show success message instead
      setOrderSuccess(true);

      // Reset form
      setCart([]);
      setCustomerPhone('');
      setCustomerName('');
      setCustomerAddress('');
      setCustomerSource('');
      setOrderNotes('');
      setPaymentMethod('');

    } catch (error: any) {
      alert('❌ Lỗi tạo đơn hàng: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const resetForm = () => {
    setOrderSuccess(false);
    setShowQRModal(false);
    setOrderCode('');
    setOrderAmount(0);
    loadData();
  };

  const closeQRModal = () => {
    setShowQRModal(false);
    setPaymentChecked(false);
    setOrderSuccess(true);
  };

  const fetchQRCode = async (code: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/seafood/payment/generate-qr/${code}`, {
        method: 'POST'
      });

      if (!response.ok) {
        throw new Error('Failed to generate QR code');
      }

      const data = await response.json();

      if (data.success) {
        setQrImageUrl(data.qr_image_url);
        setShowQRModal(true);
      } else {
        throw new Error(data.error || 'Failed to generate QR');
      }
    } catch (error) {
      console.error('Failed to fetch QR code:', error);
      alert('Không thể tạo mã QR thanh toán');
      setOrderSuccess(true); // Show success anyway
    }
  };

  const checkPaymentStatus = async () => {
    if (!orderCode) return;

    try {
      setIsCheckingPayment(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/seafood/payment/check-order/${orderCode}`);

      if (!response.ok) {
        throw new Error('Failed to check payment status');
      }

      const data = await response.json();

      if (data.success && data.is_paid) {
        setPaymentChecked(true);
        setTimeout(() => {
          closeQRModal();
        }, 2000);
      } else {
        alert('Chưa nhận được thanh toán. Vui lòng thử lại sau vài giây.');
      }
    } catch (error) {
      console.error('Failed to check payment:', error);
      alert('Không thể kiểm tra trạng thái thanh toán');
    } finally {
      setIsCheckingPayment(false);
    }
  };

  if (orderSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-3">Đặt hàng thành công!</h1>
          <p className="text-gray-600 mb-4">
            Mã đơn hàng của bạn:
          </p>
          <div className="bg-green-50 border-2 border-green-500 rounded-lg p-4 mb-6">
            <p className="text-2xl font-bold text-green-700">{orderCode}</p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
            <p className="font-semibold text-blue-800 mb-2">📦 Quy trình xử lý:</p>
            <ol className="text-sm text-blue-700 space-y-1">
              <li>1. Nhân viên sẽ cân hàng và gửi ảnh cho bạn</li>
              <li>2. Bạn kiểm tra ảnh cân hàng</li>
              <li>3. Nhấn nút "Thanh toán" để hiện mã QR {paymentMethod === 'bank_transfer' && '(nếu chọn chuyển khoản)'}</li>
              <li>4. Hoàn tất đơn hàng</li>
            </ol>
          </div>

          <p className="text-sm text-gray-500 mb-6">
            {isLoggedIn ? (
              <>Vào <strong>Dashboard</strong> để xem chi tiết và trạng thái đơn hàng</>
            ) : (
              <>Đăng nhập để theo dõi trạng thái đơn hàng</>
            )}
          </p>
          <button
            onClick={resetForm}
            className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
          >
            Đặt đơn hàng mới
          </button>
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
            <div className="text-center flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-indigo-600 flex items-center justify-center gap-2">
                <ShoppingBag className="w-8 h-8" />
                Đặt Hàng Hải Sản
              </h1>
              <p className="text-sm text-gray-600 mt-1">Chọn sản phẩm và đặt hàng dễ dàng</p>
            </div>
            <div className="flex items-center gap-2">
              {isLoggedIn ? (
                <>
                  <span className="text-sm text-gray-600 hidden sm:inline">
                    {user?.full_name || user?.email}
                  </span>
                  <Link
                    href="/customer/dashboard"
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                  >
                    Dashboard
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/customer/login"
                    className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
                  >
                    Đăng nhập
                  </Link>
                  <Link
                    href="/customer/register"
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                  >
                    Đăng ký
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 sm:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT: Product Selection */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-xl shadow-md p-5 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-800">Sản phẩm</h2>
                <button
                  onClick={() => setShowProductSelect(true)}
                  className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                >
                  <Plus className="w-4 h-4" />
                  Thêm
                </button>
              </div>

              {cart.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <ShoppingBag className="w-16 h-16 mx-auto mb-3 opacity-50" />
                  <p>Chưa có sản phẩm nào</p>
                  <p className="text-sm">Nhấn nút "Thêm" để chọn sản phẩm</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {cart.map((item, idx) => (
                    <div key={idx} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-800">{item.seafood?.name}</h3>
                          <p className="text-sm text-gray-600">
                            {formatCurrency(item.unit_price)}/{getUnitLabel(item.seafood?.unit_type || 'kg')}
                          </p>
                        </div>
                        <button
                          onClick={() => removeFromCart(idx)}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-2">
                            Khoảng cân ước tính *
                          </label>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">Từ (kg)</label>
                              <input
                                type="number"
                                step={0.1}
                                inputMode="decimal"
                                value={(() => {
                                  const range = parseWeightRange(item.estimated_weight_range || '');
                                  return range ? range.min : '';
                                })()}
                                onChange={(e) => {
                                  const sanitized = sanitizeDecimalInput(e.target.value);
                                  if (isValidDecimalInput(sanitized)) {
                                    const range = parseWeightRange(item.estimated_weight_range || '');
                                    const maxVal = range?.max !== undefined ? range.max.toString() : '';

                                    if (sanitized && maxVal) {
                                      updateCartItem(idx, 'estimated_weight_range', `${sanitized}-${maxVal}kg`);
                                    } else if (sanitized) {
                                      // Only min value entered, set max same as min temporarily
                                      updateCartItem(idx, 'estimated_weight_range', `${sanitized}-${sanitized}kg`);
                                    } else {
                                      // Cleared input
                                      updateCartItem(idx, 'estimated_weight_range', '');
                                    }
                                  }
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                placeholder="2.5"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">Đến (kg)</label>
                              <input
                                type="number"
                                step={0.1}
                                inputMode="decimal"
                                value={(() => {
                                  const range = parseWeightRange(item.estimated_weight_range || '');
                                  return range ? range.max : '';
                                })()}
                                onChange={(e) => {
                                  const sanitized = sanitizeDecimalInput(e.target.value);
                                  if (isValidDecimalInput(sanitized)) {
                                    const range = parseWeightRange(item.estimated_weight_range || '');
                                    const minVal = range?.min !== undefined ? range.min.toString() : '';

                                    if (minVal && sanitized) {
                                      updateCartItem(idx, 'estimated_weight_range', `${minVal}-${sanitized}kg`);
                                    } else if (sanitized) {
                                      // Only max value entered, set min same as max temporarily
                                      updateCartItem(idx, 'estimated_weight_range', `${sanitized}-${sanitized}kg`);
                                    } else if (minVal) {
                                      // Cleared max, keep min
                                      updateCartItem(idx, 'estimated_weight_range', `${minVal}-${minVal}kg`);
                                    } else {
                                      // Both cleared
                                      updateCartItem(idx, 'estimated_weight_range', '');
                                    }
                                  }
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                placeholder="5"
                              />
                            </div>
                          </div>
                          {item.estimated_weight_range && (() => {
                            const priceRange = getEstimatedPriceRange(item);
                            const weightRange = parseWeightRange(item.estimated_weight_range);
                            return priceRange && weightRange ? (
                              <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="text-xs text-blue-700 font-medium">Khoảng cân:</p>
                                    <p className="text-sm font-semibold text-blue-900">{weightRange.min}kg - {weightRange.max}kg</p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-xs text-blue-700 font-medium">Giá ước tính:</p>
                                    <p className="text-sm font-semibold text-blue-900">
                                      {formatCurrency(priceRange.min)} - {formatCurrency(priceRange.max)}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ) : null;
                          })()}
                        </div>
                      </div>

                      <div className="mt-3">
                        <label className="block text-xs font-medium text-gray-700 mb-1">Ghi chú</label>
                        <input
                          type="text"
                          value={item.notes || ''}
                          onChange={(e) => updateCartItem(idx, 'notes', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                          placeholder="Ghi chú về sản phẩm..."
                        />
                      </div>
                    </div>
                  ))}

                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-5 border-2 border-blue-200">
                    <div className="text-center">
                      <p className="text-xs text-blue-600 font-medium mb-2">TỔNG GIÁ ƯỚC TÍNH</p>
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <span className="text-2xl font-bold text-blue-700">
                          {formatCurrency(totalEstimatedRange.min)}
                        </span>
                        <span className="text-xl text-blue-500">-</span>
                        <span className="text-2xl font-bold text-blue-700">
                          {formatCurrency(totalEstimatedRange.max)}
                        </span>
                      </div>
                      <p className="text-xs text-blue-600">
                        💡 Giá chính xác sẽ được cập nhật sau khi nhân viên cân hàng
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: Customer Info */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-md p-5 border border-gray-200 sticky top-24">
              <h3 className="font-bold text-gray-800 mb-4 text-lg">Thông tin khách hàng</h3>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại *</label>
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="0901234567"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tên của bạn</label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Nguyễn Văn A"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Địa chỉ giao hàng</label>
                  <AddressSelector
                    onAddressChange={(fullAddress) => setCustomerAddress(fullAddress)}
                    initialAddress={customerAddress}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phương thức thanh toán</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">-- Chọn phương thức --</option>
                    <option value="bank_transfer">Chuyển khoản (VietQR)</option>
                    <option value="cod">Tiền khi nhận hàng (COD)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bạn biết chúng tôi qua</label>
                  <select
                    value={customerSource}
                    onChange={(e) => setCustomerSource(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">-- Chọn nguồn --</option>
                    <option value="telephone">Điện thoại</option>
                    <option value="facebook">Facebook</option>
                    <option value="zalo">Zalo</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú đơn hàng</label>
                  <textarea
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    placeholder="Ghi chú thêm..."
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <button
                onClick={processOrder}
                disabled={isProcessing || cart.length === 0 || !customerPhone}
                className="w-full mt-5 py-3 rounded-lg font-bold text-white transition-all shadow-lg bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isProcessing ? 'Đang xử lý...' : 'Đặt hàng ngay'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Product Selection Modal */}
      {showProductSelect && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="p-5 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-800">Chọn sản phẩm</h2>
                <button
                  onClick={() => {
                    setShowProductSelect(false);
                    setSelectedProductIds([]);
                  }}
                  className="text-gray-500 hover:text-gray-700 p-2"
                >
                  <span className="text-2xl">&times;</span>
                </button>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Tìm kiếm sản phẩm..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Tất cả danh mục</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredProducts.map(product => (
                  <div
                    key={product.id}
                    onClick={() => toggleProductSelection(product.id)}
                    className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                      selectedProductIds.includes(product.id)
                        ? 'border-indigo-600 bg-indigo-50'
                        : 'border-gray-200 hover:border-indigo-300'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-gray-800 flex-1">{product.name}</h3>
                      {selectedProductIds.includes(product.id) && (
                        <Check className="w-5 h-5 text-indigo-600 flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-1">Mã: {product.code}</p>
                    <p className="text-lg font-bold text-indigo-600">
                      {formatCurrency(product.current_price)}/{getUnitLabel(product.unit_type)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Tồn kho: {product.stock_quantity} {getUnitLabel(product.unit_type)}</p>
                  </div>
                ))}
              </div>

              {filteredProducts.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                  <p>Không tìm thấy sản phẩm nào</p>
                </div>
              )}
            </div>

            <div className="p-5 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm text-gray-600">
                  Đã chọn: <span className="font-bold text-indigo-600">{selectedProductIds.length}</span> sản phẩm
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowProductSelect(false);
                      setSelectedProductIds([]);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={addSelectedToCart}
                    className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                  >
                    Thêm vào giỏ
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QR Payment Modal */}
      {showQRModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-800">Quét mã thanh toán</h2>
                <button
                  onClick={closeQRModal}
                  className="text-gray-500 hover:text-gray-700 p-2"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="text-center mb-4">
                <div className="bg-green-50 border-2 border-green-500 rounded-lg p-3 mb-3">
                  <p className="text-sm text-gray-600 mb-1">Mã đơn hàng:</p>
                  <p className="text-xl font-bold text-green-700">{orderCode}</p>
                </div>
                <p className="text-lg font-semibold text-gray-800 mb-1">Tổng tiền:</p>
                <p className="text-2xl font-bold text-indigo-600 mb-4">{formatCurrency(orderAmount)}</p>
              </div>

              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg p-4 mb-4">
                <div className="text-center">
                  <h4 className="font-semibold text-indigo-900 mb-3">Quét mã QR bằng app ngân hàng</h4>
                  {qrImageUrl ? (
                    <div className="bg-white p-3 rounded-lg inline-block shadow-sm">
                      <img
                        src={qrImageUrl}
                        alt="VietQR Code"
                        className="w-64 h-64 mx-auto"
                      />
                    </div>
                  ) : (
                    <div className="bg-white p-3 rounded-lg inline-block shadow-sm w-64 h-64 flex items-center justify-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                    </div>
                  )}
                  <p className="text-sm text-gray-600 mt-3">
                    Nội dung chuyển khoản: <span className="font-semibold">Thanh toan {orderCode}</span>
                  </p>
                </div>
              </div>

              {paymentChecked ? (
                <div className="bg-green-50 border border-green-300 rounded-lg p-3 mb-4">
                  <p className="text-sm text-green-800 text-center">
                    <strong>✓ Đã xác nhận thanh toán!</strong> Đơn hàng của bạn đang được xử lý.
                  </p>
                </div>
              ) : (
                <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-3 mb-4">
                  <p className="text-sm text-yellow-800">
                    <strong>Lưu ý:</strong> Sau khi chuyển khoản, nhấn "Kiểm tra thanh toán" để xác nhận.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={checkPaymentStatus}
                  disabled={isCheckingPayment || paymentChecked}
                  className="bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isCheckingPayment ? 'Đang kiểm tra...' : 'Kiểm tra thanh toán'}
                </button>
                <button
                  onClick={closeQRModal}
                  className="bg-gray-600 text-white py-3 rounded-lg font-semibold hover:bg-gray-700 transition-colors"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
