'use client';

import { useState, useEffect } from 'react';
import { productsAPI, ordersAPI, categoriesAPI, formatCurrency, formatWeight, Seafood, Category, OrderItem } from '@/lib/seafood-api';
import { Search, Plus, Minus, Trash2, ShoppingCart, Phone, User, MapPin, CreditCard, Tag, Save, X } from 'lucide-react';

export default function POSPage() {
  const [products, setProducts] = useState<Seafood[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  // Form state
  const [showProductSelect, setShowProductSelect] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Seafood | null>(null);
  const [quantity, setQuantity] = useState<number>(1); // Số lượng (con)
  const [weight, setWeight] = useState<number>(0); // Cân nặng (kg)
  const [itemNotes, setItemNotes] = useState('');

  // Customer info
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<string>('cash');
  const [discount, setDiscount] = useState<number>(0);
  const [orderNotes, setOrderNotes] = useState('');

  const [isProcessing, setIsProcessing] = useState(false);

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
    }
  };

  const filteredProducts = products.filter(p => {
    const matchSearch = searchQuery === '' ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCategory = selectedCategory === '' || p.category_id === selectedCategory;
    return matchSearch && matchCategory;
  });

  // Open product select modal
  const openProductSelect = () => {
    setSelectedProduct(null);
    setQuantity(1);
    setWeight(0);
    setItemNotes('');
    setShowProductSelect(true);
  };

  // Add to cart
  const addToCart = () => {
    if (!selectedProduct) return;
    if (weight <= 0) {
      alert('Vui lòng nhập cân nặng!');
      return;
    }

    const newItem: OrderItem = {
      seafood_id: selectedProduct.id,
      seafood: selectedProduct,
      weight: weight,
      unit_price: Number(selectedProduct.current_price),
      notes: `${quantity} con - ${itemNotes}`.trim(),
    };

    setCart([...cart, newItem]);
    setShowProductSelect(false);
    setSelectedProduct(null);
    setQuantity(1);
    setWeight(0);
    setItemNotes('');
  };

  // Remove from cart
  const removeFromCart = (index: number) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  // Update cart item
  const updateCartItem = (index: number, field: 'weight' | 'notes', value: any) => {
    const updated = [...cart];
    if (field === 'weight') {
      updated[index].weight = Math.max(0.1, parseFloat(value) || 0.1);
    } else {
      updated[index].notes = value;
    }
    setCart(updated);
  };

  // Calculate totals
  const subtotal = cart.reduce((sum, item) => sum + (item.weight * item.unit_price), 0);
  const total = subtotal - discount;

  // Process order
  const processOrder = async () => {
    if (!customerPhone) {
      alert('Vui lòng nhập số điện thoại khách hàng!');
      return;
    }

    if (cart.length === 0) {
      alert('Vui lòng thêm sản phẩm vào giỏ hàng!');
      return;
    }

    try {
      setIsProcessing(true);

      const orderData = {
        customer_phone: customerPhone,
        customer_name: customerName,
        customer_address: customerAddress,
        payment_method: paymentMethod,
        payment_status: 'paid',
        discount_amount: discount,
        notes: orderNotes,
        items: cart.map(item => ({
          seafood_id: item.seafood_id,
          weight: item.weight,
          unit_price: item.unit_price,
          notes: item.notes || '',
        })),
      };

      const order = await ordersAPI.create(orderData);

      alert(`✅ Đơn hàng ${order.order_code} đã được tạo thành công!\n\nTổng tiền: ${formatCurrency(order.total_amount)}`);

      // Reset
      setCart([]);
      setCustomerPhone('');
      setCustomerName('');
      setCustomerAddress('');
      setDiscount(0);
      setOrderNotes('');
      loadData(); // Reload to update stock

    } catch (error: any) {
      alert('❌ Lỗi tạo đơn hàng: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4">
        <div className="w-full max-w-[1600px] mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Point of Sale</h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">Hệ thống bán hải sản</p>
          </div>
          <button
            onClick={openProductSelect}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg hover:bg-indigo-700 transition-colors font-medium shadow-sm"
          >
            <Plus className="w-5 h-5" />
            Thêm sản phẩm
          </button>
        </div>
      </div>

      <div className="w-full max-w-[1600px] mx-auto p-4 sm:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* LEFT: Cart */}
          <div className="lg:col-span-2 order-2 lg:order-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              {/* Cart Header */}
              <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                  <h2 className="text-base sm:text-lg font-semibold text-gray-900">Giỏ hàng ({cart.length})</h2>
                </div>
                {cart.length > 0 && (
                  <button
                    onClick={() => setCart([])}
                    className="text-xs sm:text-sm text-red-600 hover:text-red-700 font-medium"
                  >
                    Xóa tất cả
                  </button>
                )}
              </div>

              {/* Cart Items */}
              <div className="p-4 sm:p-6">
                {cart.length === 0 ? (
                  <div className="text-center py-16">
                    <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 mb-6">Giỏ hàng trống</p>
                    <button
                      onClick={openProductSelect}
                      className="inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                    >
                      <Plus className="w-4 h-4" />
                      Thêm sản phẩm đầu tiên
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {cart.map((item, index) => (
                      <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900">{item.seafood?.name}</h3>
                            <p className="text-sm text-gray-500 mt-1">{item.seafood?.code}</p>
                          </div>
                          <button
                            onClick={() => removeFromCart(index)}
                            className="text-red-600 hover:text-red-700 p-1"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Cân nặng (kg)
                            </label>
                            <input
                              type="number"
                              step="0.1"
                              min="0.1"
                              value={item.weight || ''}
                              onChange={(e) => {
                                const val = e.target.value === '' ? 0.1 : parseFloat(e.target.value) || 0.1;
                                updateCartItem(index, 'weight', val);
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Đơn giá
                            </label>
                            <input
                              type="text"
                              value={formatCurrency(item.unit_price)}
                              disabled
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-100 text-sm font-semibold text-gray-700"
                            />
                          </div>
                        </div>

                        <input
                          type="text"
                          placeholder="Ghi chú (VD: 2 con, chọn con to...)"
                          value={item.notes}
                          onChange={(e) => updateCartItem(index, 'notes', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm mb-3"
                        />

                        <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                          <span className="text-sm text-gray-600">
                            {item.weight}kg × {formatCurrency(item.unit_price)}
                          </span>
                          <span className="text-lg font-bold text-indigo-600">
                            {formatCurrency(item.weight * item.unit_price)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT: Customer & Checkout */}
          <div className="lg:col-span-1 order-1 lg:order-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 lg:sticky lg:top-6">
              {/* Customer Info */}
              <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Thông tin khách hàng</h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Phone className="w-4 h-4 inline mr-1" />
                      Số điện thoại *
                    </label>
                    <input
                      type="tel"
                      required
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="0901234567"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <User className="w-4 h-4 inline mr-1" />
                      Tên khách hàng
                    </label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Nguyễn Văn A"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <MapPin className="w-4 h-4 inline mr-1" />
                      Địa chỉ
                    </label>
                    <textarea
                      value={customerAddress}
                      onChange={(e) => setCustomerAddress(e.target.value)}
                      placeholder="123 Nguyễn Huệ, Q1, TP.HCM"
                      rows={2}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <CreditCard className="w-4 h-4 inline mr-1" />
                      Phương thức thanh toán
                    </label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      <option value="cash">💵 Tiền mặt</option>
                      <option value="transfer">🏦 Chuyển khoản</option>
                      <option value="momo">📱 MoMo</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Totals */}
              <div className="px-6 py-4 border-b border-gray-200 space-y-3">
                <div className="flex justify-between text-gray-700">
                  <span className="font-medium">Tạm tính</span>
                  <span className="font-semibold">{formatCurrency(subtotal)}</span>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Tag className="w-4 h-4 inline mr-1" />
                    Giảm giá
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={discount}
                    onChange={(e) => setDiscount(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="0"
                  />
                </div>

                <div className="flex justify-between text-xl font-bold text-indigo-600 pt-3 border-t border-gray-200">
                  <span>Tổng cộng</span>
                  <span>{formatCurrency(total)}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="p-6 space-y-3">
                <button
                  onClick={processOrder}
                  disabled={isProcessing || cart.length === 0 || !customerPhone}
                  className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white py-3.5 rounded-lg font-semibold hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors shadow-sm"
                >
                  <Save className="w-5 h-5" />
                  {isProcessing ? 'Đang xử lý...' : 'Thanh toán'}
                </button>

                <button
                  onClick={() => setCart([])}
                  disabled={cart.length === 0}
                  className="w-full flex items-center justify-center gap-2 bg-white border-2 border-gray-300 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                  Xóa giỏ hàng
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Product Select Modal - Filament Style */}
      {showProductSelect && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Thêm sản phẩm vào giỏ</h2>
              <button
                onClick={() => setShowProductSelect(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              {/* Search & Filter */}
              <div className="mb-6">
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Tìm kiếm sản phẩm..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedCategory('')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      selectedCategory === ''
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Tất cả
                  </button>
                  {categories.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        selectedCategory === cat.id
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Product List */}
              <div className="space-y-2 mb-6 max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
                {filteredProducts.map(product => (
                  <button
                    key={product.id}
                    onClick={() => setSelectedProduct(product)}
                    className={`w-full text-left p-4 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0 ${
                      selectedProduct?.id === product.id ? 'bg-indigo-50 border-l-4 border-l-indigo-600' : ''
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{product.name}</h3>
                        <p className="text-sm text-gray-500 mt-1">{product.code} • {product.category?.name}</p>
                        {product.tags && product.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {product.tags.map((tag, idx) => (
                              <span key={idx} className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="text-right ml-4">
                        <div className="text-lg font-bold text-indigo-600">
                          {formatCurrency(Number(product.current_price))}/kg
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                          Kho: {formatWeight(Number(product.stock_quantity))}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Selected Product Form */}
              {selectedProduct && (
                <div className="bg-indigo-50 border-2 border-indigo-200 rounded-lg p-6">
                  <h3 className="font-bold text-gray-900 mb-4">Sản phẩm đã chọn: {selectedProduct.name}</h3>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Số lượng (con) *
                      </label>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setQuantity(Math.max(1, quantity - 1))}
                          className="w-10 h-10 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-center"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <input
                          type="number"
                          min="1"
                          value={quantity}
                          onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                          className="flex-1 px-4 py-2.5 border-2 border-gray-300 rounded-lg text-center font-semibold"
                        />
                        <button
                          onClick={() => setQuantity(quantity + 1)}
                          className="w-10 h-10 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-center"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Cân nặng (kg) *
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="0.1"
                        value={weight || ''}
                        onChange={(e) => {
                          const val = e.target.value === '' ? 0 : parseFloat(e.target.value);
                          setWeight(val);
                        }}
                        className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg font-semibold focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="VD: 3.5"
                      />
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ghi chú
                    </label>
                    <input
                      type="text"
                      value={itemNotes}
                      onChange={(e) => setItemNotes(e.target.value)}
                      placeholder="VD: chọn con to, tươi sống..."
                      className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>

                  <div className="bg-white rounded-lg p-4 mb-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700 font-medium">Tổng tiền:</span>
                      <span className="text-2xl font-bold text-indigo-600">
                        {weight > 0 ? formatCurrency(weight * Number(selectedProduct.current_price)) : '0₫'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-2">
                      {quantity} con × {weight}kg × {formatCurrency(Number(selectedProduct.current_price))}/kg
                    </p>
                  </div>

                  <button
                    onClick={addToCart}
                    disabled={weight <= 0}
                    className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white py-3.5 rounded-lg font-semibold hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                    Thêm vào giỏ hàng
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
