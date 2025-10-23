'use client';

import { useState, useEffect } from 'react';
import { productsAPI, ordersAPI, categoriesAPI, formatCurrency, Seafood, Category, OrderItem } from '@/lib/seafood-api';
import { Search, Plus, X, ShoppingCart, Phone, User, MapPin, CreditCard, Tag, CheckCircle2, Package, Weight, Hash } from 'lucide-react';

// Helper để format đơn vị
const getUnitLabel = (unitType: string) => {
  switch (unitType) {
    case 'piece': return 'con';
    case 'box': return 'thùng';
    default: return 'kg';
  }
};

export default function NewOrderPage() {
  const [products, setProducts] = useState<Seafood[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  // Product selection modal
  const [showProductModal, setShowProductModal] = useState(false);

  // Customer info
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<string>('cash');
  const [paymentStatus, setPaymentStatus] = useState<string>('pending');
  const [discount, setDiscount] = useState<number>(0);
  const [orderNotes, setOrderNotes] = useState('');

  const [isProcessing, setIsProcessing] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

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
      alert('Không thể tải dữ liệu. Vui lòng thử lại!');
    }
  };

  const filteredProducts = products.filter(p => {
    const matchSearch = searchQuery === '' ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCategory = selectedCategory === '' || p.category_id === selectedCategory;
    return matchSearch && matchCategory;
  });

  // Add product to cart with smart quantity/weight input
  const addProductToCart = (product: Seafood) => {
    const existingIndex = cart.findIndex(item => item.seafood_id === product.id);

    if (existingIndex >= 0) {
      // Product already in cart, increment quantity/weight
      const updated = [...cart];
      if (product.unit_type === 'kg') {
        updated[existingIndex].weight = (updated[existingIndex].weight || 0) + 0.5; // Add 0.5kg
      } else {
        updated[existingIndex].quantity = (updated[existingIndex].quantity || 0) + 1;
        // Auto-calculate weight based on quantity
        if (product.avg_unit_weight) {
          updated[existingIndex].weight = updated[existingIndex].quantity! * product.avg_unit_weight;
        }
      }
      setCart(updated);
    } else {
      // New product in cart
      const newItem: OrderItem = {
        seafood_id: product.id,
        seafood: product,
        quantity: product.unit_type === 'kg' ? undefined : 1,
        weight: product.unit_type === 'kg' ? 0.5 : (product.avg_unit_weight || 0),
        unit_price: Number(product.current_price),
        notes: '',
      };
      setCart([...cart, newItem]);
    }
  };

  // Update cart item
  const updateCartItem = (index: number, field: 'quantity' | 'weight' | 'notes', value: any) => {
    const updated = [...cart];
    const item = updated[index];

    if (field === 'quantity') {
      const qty = Math.max(0, parseFloat(value) || 0);
      item.quantity = qty;
      // Auto-update weight if avg_unit_weight is available
      if (item.seafood?.avg_unit_weight) {
        item.weight = qty * item.seafood.avg_unit_weight;
      }
    } else if (field === 'weight') {
      item.weight = Math.max(0, parseFloat(value) || 0);
    } else if (field === 'notes') {
      item.notes = value;
    }

    setCart(updated);
  };

  // Remove from cart
  const removeFromCart = (index: number) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  // Calculate totals
  const subtotal = cart.reduce((sum, item) => {
    return sum + (item.weight * item.unit_price);
  }, 0);
  const total = subtotal - discount;

  // Submit order
  const submitOrder = async () => {
    if (!customerPhone) {
      alert('Vui lòng nhập số điện thoại khách hàng!');
      return;
    }

    if (cart.length === 0) {
      alert('Giỏ hàng trống!');
      return;
    }

    // Validate all items have weight
    const hasInvalidItems = cart.some(item => !item.weight || item.weight <= 0);
    if (hasInvalidItems) {
      alert('Vui lòng nhập cân nặng cho tất cả sản phẩm!');
      return;
    }

    setIsProcessing(true);

    try {
      await ordersAPI.create({
        customer_phone: customerPhone,
        customer_name: customerName,
        customer_address: customerAddress,
        payment_method: paymentMethod,
        payment_status: paymentStatus,
        discount_amount: discount,
        notes: orderNotes,
        items: cart,
      });

      setOrderSuccess(true);

      // Reset form after 2 seconds
      setTimeout(() => {
        setCart([]);
        setCustomerPhone('');
        setCustomerName('');
        setCustomerAddress('');
        setDiscount(0);
        setOrderNotes('');
        setPaymentStatus('pending');
        setOrderSuccess(false);
      }, 2000);
    } catch (error) {
      console.error('Failed to create order:', error);
      alert('Tạo đơn hàng thất bại! Vui lòng thử lại.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <ShoppingCart className="w-8 h-8 text-blue-600" />
            Tạo Đơn Hàng Mới
          </h1>
          <p className="text-gray-600 mt-1">Chọn nhiều sản phẩm và quản lý đơn hàng dễ dàng</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Product Selection */}
          <div className="lg:col-span-2 space-y-4">
            {/* Search & Filter */}
            <div className="bg-white rounded-2xl shadow-lg p-4 border border-gray-100">
              <div className="flex flex-col md:flex-row gap-3">
                {/* Search */}
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Tìm sản phẩm theo tên hoặc mã..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Category Filter */}
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">Tất cả danh mục</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Product Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {filteredProducts.map(product => (
                <button
                  key={product.id}
                  onClick={() => addProductToCart(product)}
                  className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all p-4 text-left border-2 border-transparent hover:border-blue-400 group"
                >
                  {/* Product Image Placeholder */}
                  <div className="w-full h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg mb-3 flex items-center justify-center">
                    <Package className="w-10 h-10 text-blue-600" />
                  </div>

                  {/* Product Info */}
                  <div className="space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-gray-800 text-sm line-clamp-2 group-hover:text-blue-600 transition-colors">
                        {product.name}
                      </h3>
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full whitespace-nowrap">
                        {getUnitLabel(product.unit_type)}
                      </span>
                    </div>

                    <p className="text-xs text-gray-500">{product.code}</p>

                    <div className="flex items-center justify-between pt-2">
                      <span className="text-lg font-bold text-blue-600">
                        {formatCurrency(product.current_price)}
                      </span>
                      {product.unit_type !== 'kg' && product.avg_unit_weight && (
                        <span className="text-xs text-gray-500">
                          ~{product.avg_unit_weight}kg/{getUnitLabel(product.unit_type)}
                        </span>
                      )}
                    </div>

                    {/* Stock */}
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Weight className="w-3 h-3" />
                      <span>Kho: {product.stock_quantity.toFixed(2)} kg</span>
                    </div>
                  </div>

                  {/* Add icon on hover */}
                  <div className="mt-3 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Plus className="w-5 h-5 text-blue-600" />
                    <span className="text-sm text-blue-600 font-medium ml-1">Thêm vào giỏ</span>
                  </div>
                </button>
              ))}
            </div>

            {filteredProducts.length === 0 && (
              <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Không tìm thấy sản phẩm nào</p>
              </div>
            )}
          </div>

          {/* Right: Cart & Checkout */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 space-y-4">
              {/* Cart */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4">
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <ShoppingCart className="w-6 h-6" />
                    Giỏ Hàng ({cart.length})
                  </h2>
                </div>

                <div className="p-4 max-h-96 overflow-y-auto space-y-3">
                  {cart.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      <ShoppingCart className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>Giỏ hàng trống</p>
                      <p className="text-sm">Chọn sản phẩm để thêm vào</p>
                    </div>
                  ) : (
                    cart.map((item, index) => (
                      <div key={index} className="bg-gray-50 rounded-xl p-3 space-y-2 border border-gray-200">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-sm text-gray-800">{item.seafood?.name}</h3>
                            <p className="text-xs text-gray-500">{formatCurrency(item.unit_price)}/kg</p>
                          </div>
                          <button
                            onClick={() => removeFromCart(index)}
                            className="text-red-500 hover:bg-red-50 p-1 rounded-lg transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Quantity input for piece/box */}
                        {item.seafood?.unit_type !== 'kg' && (
                          <div className="flex items-center gap-2">
                            <Hash className="w-4 h-4 text-gray-400" />
                            <input
                              type="number"
                              step="1"
                              min="0"
                              value={item.quantity || 0}
                              onChange={(e) => updateCartItem(index, 'quantity', e.target.value)}
                              className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder={`Số ${getUnitLabel(item.seafood.unit_type)}`}
                            />
                            <span className="text-xs text-gray-500">{getUnitLabel(item.seafood.unit_type)}</span>
                          </div>
                        )}

                        {/* Weight input */}
                        <div className="flex items-center gap-2">
                          <Weight className="w-4 h-4 text-gray-400" />
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            value={item.weight || 0}
                            onChange={(e) => updateCartItem(index, 'weight', e.target.value)}
                            className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Cân nặng (kg)"
                          />
                          <span className="text-xs text-gray-500">kg</span>
                        </div>

                        {/* Notes */}
                        <input
                          type="text"
                          value={item.notes || ''}
                          onChange={(e) => updateCartItem(index, 'notes', e.target.value)}
                          placeholder="Ghi chú (vd: chọn con to)"
                          className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />

                        {/* Subtotal */}
                        <div className="pt-2 border-t border-gray-200">
                          <span className="text-sm font-bold text-blue-600">
                            {formatCurrency(item.weight * item.unit_price)}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Totals */}
                {cart.length > 0 && (
                  <div className="p-4 border-t border-gray-200 space-y-2 bg-gray-50">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Tạm tính:</span>
                      <span className="font-semibold">{formatCurrency(subtotal)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Giảm giá:</span>
                      <input
                        type="number"
                        min="0"
                        value={discount}
                        onChange={(e) => setDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
                        className="w-32 px-3 py-1 border border-gray-300 rounded-lg text-sm text-right focus:ring-2 focus:ring-blue-500"
                        placeholder="0"
                      />
                    </div>
                    <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-300">
                      <span>Tổng cộng:</span>
                      <span className="text-blue-600">{formatCurrency(total)}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Customer Info */}
              <div className="bg-white rounded-2xl shadow-lg p-4 border border-gray-100 space-y-3">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-600" />
                  Thông Tin Khách Hàng
                </h3>

                <div className="space-y-3">
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="Số điện thoại *"
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Tên khách hàng"
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <textarea
                      value={customerAddress}
                      onChange={(e) => setCustomerAddress(e.target.value)}
                      placeholder="Địa chỉ giao hàng"
                      rows={2}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    />
                  </div>

                  <div className="relative">
                    <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white appearance-none"
                    >
                      <option value="cash">Tiền mặt</option>
                      <option value="transfer">Chuyển khoản</option>
                      <option value="momo">MoMo</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={paymentStatus === 'paid'}
                        onChange={(e) => setPaymentStatus(e.target.checked ? 'paid' : 'pending')}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">Đã thanh toán</span>
                    </label>
                  </div>

                  <div className="relative">
                    <Tag className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <textarea
                      value={orderNotes}
                      onChange={(e) => setOrderNotes(e.target.value)}
                      placeholder="Ghi chú đơn hàng"
                      rows={2}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                onClick={submitOrder}
                disabled={isProcessing || cart.length === 0 || !customerPhone || orderSuccess}
                className={`w-full py-4 rounded-xl font-bold text-white transition-all shadow-lg ${
                  orderSuccess
                    ? 'bg-green-500 hover:bg-green-600'
                    : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-400'
                } disabled:cursor-not-allowed flex items-center justify-center gap-2`}
              >
                {orderSuccess ? (
                  <>
                    <CheckCircle2 className="w-6 h-6" />
                    Đơn Hàng Đã Tạo!
                  </>
                ) : isProcessing ? (
                  'Đang Xử Lý...'
                ) : (
                  <>
                    <ShoppingCart className="w-5 h-5" />
                    Tạo Đơn Hàng
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
