'use client';

import { useState, useEffect } from 'react';
import { productsAPI, ordersAPI, categoriesAPI, formatCurrency, Seafood, Category, OrderItem } from '@/lib/seafood-api';
import { Search, Plus, Trash2, ShoppingCart, User, Save, X } from 'lucide-react';

const getUnitLabel = (unitType: string) => {
  switch (unitType) {
    case 'piece': return 'con';
    case 'box': return 'thùng';
    default: return 'kg';
  }
};

export default function POSPage() {
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

  // Toggle product selection
  const toggleProductSelection = (productId: string) => {
    if (selectedProductIds.includes(productId)) {
      setSelectedProductIds(selectedProductIds.filter(id => id !== productId));
    } else {
      setSelectedProductIds([...selectedProductIds, productId]);
    }
  };

  // Add selected products to cart
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
          quantity: product.unit_type === 'kg' ? undefined : 1,
          weight: product.unit_type === 'kg' ? 0.5 : (product.avg_unit_weight || 0),
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

  // Remove from cart
  const removeFromCart = (index: number) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  // Update cart item
  const updateCartItem = (index: number, field: 'quantity' | 'weight' | 'notes', value: any) => {
    const updated = [...cart];
    const item = updated[index];

    if (field === 'quantity') {
      const qty = Math.max(0, parseFloat(value) || 0);
      item.quantity = qty;
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

    const hasInvalidWeight = cart.some(item => !item.weight || item.weight <= 0);
    if (hasInvalidWeight) {
      alert('Vui lòng nhập cân nặng cho tất cả sản phẩm!');
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
          quantity: item.quantity,
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
      loadData();

    } catch (error: any) {
      alert('❌ Lỗi tạo đơn hàng: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4 sticky top-0 z-10 shadow-sm">
        <div className="w-full max-w-[1800px] mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
              <ShoppingCart className="w-6 h-6 text-indigo-600" />
              Point of Sale
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">Hệ thống bán hải sản</p>
          </div>
          <button
            onClick={() => setShowProductSelect(true)}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg hover:bg-indigo-700 transition-colors font-medium shadow-sm"
          >
            <Plus className="w-5 h-5" />
            Thêm sản phẩm
          </button>
        </div>
      </div>

      <div className="w-full max-w-[1800px] mx-auto p-4 sm:p-6">
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 sm:gap-6">
          {/* LEFT: Cart Table - 75% width */}
          <div className="xl:col-span-3 order-2 xl:order-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              {/* Cart Header */}
              <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                  <h2 className="text-base sm:text-lg font-semibold text-gray-900">Giỏ hàng ({cart.length} sản phẩm)</h2>
                </div>
                {cart.length > 0 && (
                  <button
                    onClick={() => setCart([])}
                    className="text-xs sm:text-sm text-red-600 hover:text-red-700 font-medium flex items-center gap-1"
                  >
                    <Trash2 className="w-4 h-4" />
                    Xóa tất cả
                  </button>
                )}
              </div>

              {/* Cart Table */}
              {cart.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                  <ShoppingCart className="w-16 h-16 mx-auto mb-3 opacity-30" />
                  <p className="text-lg">Giỏ hàng trống</p>
                  <p className="text-sm mt-1">Nhấn "Thêm sản phẩm" để bắt đầu</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Sản phẩm</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Đơn vị</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase w-32">Số lượng</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase w-32">Cân nặng (kg)</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Đơn giá</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase w-48">Ghi chú</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Thành tiền</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase w-20">Xóa</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {cart.map((item, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-4 py-4">
                            <div>
                              <p className="font-semibold text-gray-800">{item.seafood?.name}</p>
                              <p className="text-xs text-gray-500 mt-0.5">{item.seafood?.code}</p>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <span className="inline-flex px-2.5 py-1 text-xs font-semibold bg-blue-100 text-blue-700 rounded-full">
                              {getUnitLabel(item.seafood?.unit_type || 'kg')}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            {item.seafood?.unit_type !== 'kg' ? (
                              <input
                                type="number"
                                step="1"
                                min="0"
                                value={item.quantity || 0}
                                onChange={(e) => updateCartItem(index, 'quantity', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-center font-semibold focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                              />
                            ) : (
                              <span className="text-gray-400 text-sm">-</span>
                            )}
                          </td>
                          <td className="px-4 py-4">
                            <input
                              type="number"
                              step="0.1"
                              min="0"
                              value={item.weight || 0}
                              onChange={(e) => updateCartItem(index, 'weight', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-center font-semibold focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            />
                          </td>
                          <td className="px-4 py-4 text-right">
                            <p className="font-semibold text-gray-700">{formatCurrency(item.unit_price)}</p>
                            <p className="text-xs text-gray-500">/kg</p>
                          </td>
                          <td className="px-4 py-4">
                            <input
                              type="text"
                              value={item.notes || ''}
                              onChange={(e) => updateCartItem(index, 'notes', e.target.value)}
                              placeholder="Ghi chú..."
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            />
                          </td>
                          <td className="px-4 py-4 text-right">
                            <span className="text-lg font-bold text-indigo-600">
                              {formatCurrency(item.weight * item.unit_price)}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <button
                              onClick={() => removeFromCart(index)}
                              className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Cart Summary */}
              {cart.length > 0 && (
                <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                  <div className="flex justify-end">
                    <div className="w-96 space-y-3">
                      <div className="flex justify-between text-base">
                        <span className="text-gray-700">Tạm tính:</span>
                        <span className="font-semibold text-gray-900">{formatCurrency(subtotal)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-base text-gray-700">Giảm giá:</span>
                        <input
                          type="number"
                          min="0"
                          value={discount}
                          onChange={(e) => setDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
                          className="w-40 px-4 py-2 border border-gray-300 rounded-lg text-right font-semibold focus:ring-2 focus:ring-indigo-500"
                          placeholder="0"
                        />
                      </div>
                      <div className="flex justify-between text-2xl font-bold pt-3 border-t border-gray-300">
                        <span className="text-gray-800">Tổng cộng:</span>
                        <span className="text-indigo-600">{formatCurrency(total)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: Customer Info - 25% width */}
          <div className="xl:col-span-1 order-1 xl:order-2">
            <div className="sticky top-24 space-y-4">
              <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-200">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-indigo-600" />
                  Thông Tin Khách Hàng
                </h3>

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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tên khách hàng</label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Nguyễn Văn A"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ</label>
                    <textarea
                      value={customerAddress}
                      onChange={(e) => setCustomerAddress(e.target.value)}
                      placeholder="Địa chỉ giao hàng..."
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Thanh toán</label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="cash">Tiền mặt</option>
                      <option value="transfer">Chuyển khoản</option>
                      <option value="momo">MoMo</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú đơn hàng</label>
                    <textarea
                      value={orderNotes}
                      onChange={(e) => setOrderNotes(e.target.value)}
                      placeholder="Ghi chú..."
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={processOrder}
                disabled={isProcessing || cart.length === 0 || !customerPhone}
                className="w-full py-4 rounded-xl font-bold text-white transition-all shadow-lg flex items-center justify-center gap-2 text-lg bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  'Đang Xử Lý...'
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Tạo Đơn Hàng
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Multi-Select Product Modal */}
      {showProductSelect && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[85vh] overflow-hidden shadow-2xl flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-indigo-600 text-white rounded-t-2xl">
              <h2 className="text-2xl font-bold">
                Chọn Sản Phẩm ({selectedProductIds.length} đã chọn)
              </h2>
              <button
                onClick={() => {
                  setShowProductSelect(false);
                  setSelectedProductIds([]);
                }}
                className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {/* Search & Filter */}
              <div className="mb-6">
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Tìm kiếm sản phẩm..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedCategory('')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
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
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
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

              {/* Product Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredProducts.map(product => {
                  const isSelected = selectedProductIds.includes(product.id);
                  return (
                    <div
                      key={product.id}
                      onClick={() => toggleProductSelection(product.id)}
                      className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                        isSelected
                          ? 'border-indigo-500 bg-indigo-50 shadow-lg'
                          : 'border-gray-200 hover:border-indigo-300 hover:shadow-sm'
                      }`}
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          className="w-5 h-5 mt-1 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 cursor-pointer"
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-800 truncate">{product.name}</h3>
                          <p className="text-xs text-gray-500 mt-1">{product.code}</p>
                        </div>
                        <span className="flex-shrink-0 text-xs bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full font-medium">
                          {getUnitLabel(product.unit_type)}
                        </span>
                      </div>

                      <div className="flex items-end justify-between">
                        <div>
                          <p className="text-xl font-bold text-indigo-600">
                            {formatCurrency(product.current_price)}
                          </p>
                          <p className="text-xs text-gray-500">/kg</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500">Kho:</p>
                          <p className="text-sm font-semibold text-gray-700">
                            {Number(product.stock_quantity || 0).toFixed(2)} kg
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {filteredProducts.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                  <ShoppingCart className="w-16 h-16 mx-auto mb-3 opacity-30" />
                  <p>Không tìm thấy sản phẩm</p>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-gray-50 rounded-b-2xl">
              <p className="text-sm text-gray-600">
                Đã chọn <span className="font-bold text-indigo-600 text-lg">{selectedProductIds.length}</span> sản phẩm
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowProductSelect(false);
                    setSelectedProductIds([]);
                  }}
                  className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-100 transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={addSelectedToCart}
                  disabled={selectedProductIds.length === 0}
                  className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-all disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Thêm Vào Giỏ ({selectedProductIds.length})
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
