'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { productsAPI, categoriesAPI, formatCurrency, Seafood, Category, OrderItem } from '@/lib/seafood-api';
import { Search, Plus, Trash2, ShoppingBag, Check, X, ArrowLeft, User, Phone, MapPin, CreditCard, MessageSquare, Filter, Home, ShoppingCart, Package } from 'lucide-react';
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
          estimated_weight_range: '',
          weight: null,
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

  const sanitizeDecimalInput = (value: string) => {
    // Replace comma with dot for decimal
    return value.replace(/,/g, '.');
  };

  const isValidDecimalInput = (value: string) => {
    // Allow empty, digits, and single decimal point
    if (value === '') return true;
    // Allow digits and single dot/comma
    return /^[0-9]*[.,]?[0-9]*$/.test(value);
  };

  const parseWeightRange = (range: string): { min: number; max: number } | null => {
    if (!range) return null;
    // Try to match range format: "2.6-5kg"
    const rangeMatch = range.match(/(\d+\.?\d*)\s*-\s*(\d+\.?\d*)/);
    if (rangeMatch) {
      return { min: parseFloat(rangeMatch[1]), max: parseFloat(rangeMatch[2]) };
    }
    // Try to match single value format: "2.6kg"
    const singleMatch = range.match(/(\d+\.?\d*)/);
    if (singleMatch) {
      const value = parseFloat(singleMatch[1]);
      return { min: value, max: value };
    }
    return null;
  };

  const getEstimatedPriceRange = (item: OrderItem): { min: number; max: number } | null => {
    if (!item.estimated_weight_range) return null;
    const range = parseWeightRange(item.estimated_weight_range);
    if (!range) return null;
    return {
      min: range.min * item.unit_price,
      max: range.max * item.unit_price,
    };
  };

  const totalEstimatedRange = cart.reduce((acc, item) => {
    const priceRange = getEstimatedPriceRange(item);
    if (!priceRange) return acc;
    return {
      min: acc.min + priceRange.min,
      max: acc.max + priceRange.max,
    };
  }, { min: 0, max: 0 });

  const processOrder = async () => {
    if (!customerPhone) {
      alert('Vui lòng nhập số điện thoại!');
      return;
    }

    if (cart.length === 0) {
      alert('Vui lòng thêm sản phẩm vào giỏ hàng!');
      return;
    }

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
          weight: item.weight,
          unit_price: item.unit_price,
          notes: item.notes || '',
        })),
      };

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

  if (orderSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 max-w-lg w-full">
          <div className="text-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-10 h-10 text-emerald-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Đặt hàng thành công!</h1>
            <p className="text-sm text-gray-600 mb-4">Mã đơn hàng của bạn</p>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
              <p className="text-2xl font-bold text-gray-900">{orderCode}</p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
              <p className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                <Package className="w-4 h-4" />
                Quy trình xử lý
              </p>
              <ol className="text-sm text-blue-800 space-y-2">
                <li className="flex gap-2">
                  <span className="font-medium">1.</span>
                  <span>Nhân viên sẽ cân hàng và gửi ảnh cho bạn</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-medium">2.</span>
                  <span>Bạn kiểm tra ảnh cân hàng</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-medium">3.</span>
                  <span>Nhấn nút "Thanh toán" để hiện mã QR {paymentMethod === 'bank_transfer' && '(nếu chọn chuyển khoản)'}</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-medium">4.</span>
                  <span>Hoàn tất đơn hàng</span>
                </li>
              </ol>
            </div>

            <p className="text-sm text-gray-600 mb-6">
              {isLoggedIn ? (
                <>Vào <Link href="/customer/dashboard" className="text-primary font-medium hover:underline">Dashboard</Link> để xem chi tiết</>
              ) : (
                <>Đăng nhập để theo dõi trạng thái đơn hàng</>
              )}
            </p>

            <button
              onClick={resetForm}
              className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors"
            >
              Đặt đơn hàng mới
            </button>
          </div>
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
                  <ShoppingCart className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-gray-900">Đặt hàng hải sản</h1>
                  <p className="text-xs text-gray-500">Chọn sản phẩm và đặt hàng dễ dàng</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isLoggedIn ? (
                <>
                  <span className="text-sm text-gray-600 hidden sm:inline">
                    {user?.full_name || user?.email}
                  </span>
                  <Link
                    href="/customer/dashboard"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium shadow-sm"
                  >
                    <Home className="w-4 h-4" />
                    <span className="hidden sm:inline">Dashboard</span>
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/customer/login"
                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors text-sm font-medium"
                  >
                    Đăng nhập
                  </Link>
                  <Link
                    href="/customer/register"
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium shadow-sm"
                  >
                    Đăng ký
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT: Cart Items - 2 columns */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="border-b border-gray-200 p-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-primary" />
                  Giỏ hàng
                  {cart.length > 0 && (
                    <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs font-medium rounded-full">
                      {cart.length}
                    </span>
                  )}
                </h2>
                <button
                  onClick={() => setShowProductSelect(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
                >
                  <Plus className="w-4 h-4" />
                  Thêm sản phẩm
                </button>
              </div>

              <div className="p-4">
                {cart.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                      <ShoppingBag className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">Giỏ hàng trống</h3>
                    <p className="text-sm text-gray-600 mb-6">Nhấn "Thêm sản phẩm" để chọn hải sản</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {cart.map((item, idx) => (
                      <div key={idx} className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900">{item.seafood?.name}</h3>
                            <p className="text-sm text-gray-600">
                              {formatCurrency(item.unit_price)}/{getUnitLabel(item.seafood?.unit_type || 'kg')}
                            </p>
                          </div>
                          <button
                            onClick={() => removeFromCart(idx)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Xóa"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Weight Range Inputs */}
                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-2">
                              Khoảng cân ước tính *
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs text-gray-600 mb-1">Từ (kg)</label>
                                <input
                                  type="number"
                                  step="0.1"
                                  min="0"
                                  value={(() => {
                                    const range = parseWeightRange(item.estimated_weight_range || '');
                                    return range ? range.min : '';
                                  })()}
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    const range = parseWeightRange(item.estimated_weight_range || '');
                                    const maxVal = range?.max !== undefined ? range.max.toString() : '';

                                    if (value && maxVal) {
                                      updateCartItem(idx, 'estimated_weight_range', `${value}-${maxVal}kg`);
                                    } else if (value) {
                                      updateCartItem(idx, 'estimated_weight_range', `${value}-${value}kg`);
                                    } else {
                                      updateCartItem(idx, 'estimated_weight_range', '');
                                    }
                                  }}
                                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                  placeholder="2.5"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-gray-600 mb-1">Đến (kg)</label>
                                <input
                                  type="number"
                                  step="0.1"
                                  min="0"
                                  value={(() => {
                                    const range = parseWeightRange(item.estimated_weight_range || '');
                                    return range ? range.max : '';
                                  })()}
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    const range = parseWeightRange(item.estimated_weight_range || '');
                                    const minVal = range?.min !== undefined ? range.min.toString() : '';

                                    if (minVal && value) {
                                      updateCartItem(idx, 'estimated_weight_range', `${minVal}-${value}kg`);
                                    } else if (value) {
                                      updateCartItem(idx, 'estimated_weight_range', `${value}-${value}kg`);
                                    } else if (minVal) {
                                      // When only "From" has value but "To" is cleared, keep only the "From" value
                                      updateCartItem(idx, 'estimated_weight_range', `${minVal}kg`);
                                    } else {
                                      updateCartItem(idx, 'estimated_weight_range', '');
                                    }
                                  }}
                                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                  placeholder="5"
                                />
                              </div>
                            </div>

                            {/* Price Range Display */}
                            {item.estimated_weight_range && (() => {
                              const priceRange = getEstimatedPriceRange(item);
                              const weightRange = parseWeightRange(item.estimated_weight_range);
                              return priceRange && weightRange ? (
                                <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                  <div className="flex items-center justify-between text-sm">
                                    <div>
                                      <p className="text-xs text-blue-700 font-medium">Khoảng cân</p>
                                      <p className="font-semibold text-blue-900">{weightRange.min}kg - {weightRange.max}kg</p>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-xs text-blue-700 font-medium">Giá ước tính</p>
                                      <p className="font-semibold text-blue-900">
                                        {formatCurrency(priceRange.min)} - {formatCurrency(priceRange.max)}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              ) : null;
                            })()}
                          </div>

                          {/* Notes */}
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Ghi chú</label>
                            <input
                              type="text"
                              value={item.notes || ''}
                              onChange={(e) => updateCartItem(idx, 'notes', e.target.value)}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                              placeholder="Ghi chú về sản phẩm..."
                            />
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Total Estimated Price */}
                    {cart.length > 0 && totalEstimatedRange.max > 0 && (
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
                        <div className="text-center">
                          <p className="text-xs text-blue-700 font-medium mb-2">TỔNG GIÁ ƯỚC TÍNH</p>
                          <div className="flex items-center justify-center gap-2 mb-2">
                            <span className="text-xl font-bold text-blue-900">
                              {formatCurrency(totalEstimatedRange.min)}
                            </span>
                            <span className="text-lg text-blue-600">-</span>
                            <span className="text-xl font-bold text-blue-900">
                              {formatCurrency(totalEstimatedRange.max)}
                            </span>
                          </div>
                          <p className="text-xs text-blue-700">
                            💡 Giá chính xác sau khi cân hàng
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT: Customer Info - 1 column */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm sticky top-24">
              <div className="border-b border-gray-200 p-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <User className="w-5 h-5 text-primary" />
                  Thông tin khách hàng
                </h3>
              </div>

              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    <span className="flex items-center gap-1.5">
                      <Phone className="w-4 h-4" />
                      Số điện thoại *
                    </span>
                  </label>
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="0901234567"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    <span className="flex items-center gap-1.5">
                      <User className="w-4 h-4" />
                      Tên của bạn
                    </span>
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Nguyễn Văn A"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4" />
                      Địa chỉ giao hàng
                    </span>
                  </label>
                  <AddressSelector
                    onAddressChange={(fullAddress) => setCustomerAddress(fullAddress)}
                    initialAddress={customerAddress}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    <span className="flex items-center gap-1.5">
                      <CreditCard className="w-4 h-4" />
                      Phương thức thanh toán
                    </span>
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                  >
                    <option value="">-- Chọn phương thức --</option>
                    <option value="bank_transfer">Chuyển khoản (VietQR)</option>
                    <option value="cod">Tiền mặt khi nhận hàng (COD)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Bạn biết chúng tôi qua</label>
                  <select
                    value={customerSource}
                    onChange={(e) => setCustomerSource(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                  >
                    <option value="">-- Chọn nguồn --</option>
                    <option value="telephone">Điện thoại</option>
                    <option value="facebook">Facebook</option>
                    <option value="zalo">Zalo</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    <span className="flex items-center gap-1.5">
                      <MessageSquare className="w-4 h-4" />
                      Ghi chú đơn hàng
                    </span>
                  </label>
                  <textarea
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    placeholder="Ghi chú thêm..."
                    rows={3}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                  />
                </div>

                <button
                  onClick={processOrder}
                  disabled={isProcessing || cart.length === 0 || !customerPhone}
                  className="w-full py-3 rounded-lg font-semibold text-white transition-all shadow-sm bg-primary hover:bg-primary/90 disabled:bg-gray-300 disabled:cursor-not-allowed disabled:shadow-none"
                >
                  {isProcessing ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      Đang xử lý...
                    </span>
                  ) : (
                    'Đặt hàng ngay'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Product Selection Modal - Filament Style */}
      {showProductSelect && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="border-b border-gray-200 p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Chọn sản phẩm</h2>
                <button
                  onClick={() => {
                    setShowProductSelect(false);
                    setSelectedProductIds([]);
                  }}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Search & Filter */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Tìm kiếm sản phẩm..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-4 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  <option value="">Tất cả danh mục</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Modal Body - Products Grid */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredProducts.map(product => (
                  <div
                    key={product.id}
                    onClick={() => toggleProductSelection(product.id)}
                    className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                      selectedProductIds.includes(product.id)
                        ? 'border-primary bg-primary/5 shadow-md'
                        : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-gray-900 flex-1 text-sm">{product.name}</h3>
                      {selectedProductIds.includes(product.id) && (
                        <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 mb-2">Mã: {product.code}</p>
                    <p className="text-lg font-bold text-primary mb-1">
                      {formatCurrency(product.current_price)}/{getUnitLabel(product.unit_type)}
                    </p>
                    <p className="text-xs text-gray-500">Tồn: {product.stock_quantity} {getUnitLabel(product.unit_type)}</p>
                  </div>
                ))}
              </div>

              {filteredProducts.length === 0 && (
                <div className="text-center py-16">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                    <Search className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-600">Không tìm thấy sản phẩm</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="border-t border-gray-200 p-4 bg-gray-50">
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm text-gray-700">
                  Đã chọn: <span className="font-bold text-primary">{selectedProductIds.length}</span> sản phẩm
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowProductSelect(false);
                      setSelectedProductIds([]);
                    }}
                    className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={addSelectedToCart}
                    disabled={selectedProductIds.length === 0}
                    className="px-6 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    Thêm vào giỏ
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
