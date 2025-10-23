'use client';

import { useState, useEffect } from 'react';
import { productsAPI, ordersAPI, categoriesAPI, formatCurrency, Seafood, Category, OrderItem } from '@/lib/seafood-api';
import { Search, Plus, Trash2, ShoppingCart, User, Save, X, Check, Package, CheckSquare, Square } from 'lucide-react';

// Helper để format đơn vị
const getUnitLabel = (unitType: string) => {
  switch (unitType) {
    case 'piece': return 'con';
    case 'box': return 'thùng';
    default: return 'kg';
  }
};

export default function POSPageV2() {
  const [products, setProducts] = useState<Seafood[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  // Multi-select modal
  const [showProductModal, setShowProductModal] = useState(false);
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());

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

  // Toggle product selection in modal
  const toggleProductSelection = (productId: string) => {
    const newSelected = new Set(selectedProductIds);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
    } else {
      newSelected.add(productId);
    }
    setSelectedProductIds(newSelected);
  };

  // Add selected products to cart (without quantity/weight - will be filled in table)
  const addSelectedToCart = () => {
    if (selectedProductIds.size === 0) {
      alert('Vui lòng chọn ít nhất 1 sản phẩm!');
      return;
    }

    // Add selected products to cart with default values
    const newItems = Array.from(selectedProductIds)
      .map(productId => {
        const product = products.find(p => p.id === productId);
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
    setShowProductModal(false);
    setSelectedProductIds(new Set());
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

      setTimeout(() => {
        setCart([]);
        setCustomerPhone('');
        setCustomerName('');
        setCustomerAddress('');
        setDiscount(0);
        setOrderNotes('');
        setPaymentStatus('pending');
        setOrderSuccess(false);
        loadData();
      }, 2000);
    } catch (error) {
      console.error('Failed to create order:', error);
      alert('Tạo đơn hàng thất bại! Vui lòng thử lại.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 flex items-center gap-3">
                <ShoppingCart className="w-7 h-7 text-indigo-600" />
                Point of Sale
              </h1>
              <p className="text-gray-600 mt-1">Hệ thống bán hải sản</p>
            </div>
            <button
              onClick={() => setShowProductModal(true)}
              className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700 transition-all shadow-lg font-semibold"
            >
              <Plus className="w-5 h-5" />
              Thêm Sản Phẩm
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[1800px] mx-auto p-4 sm:p-6">
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* LEFT: Cart Table - Rộng ra */}
          <div className="xl:col-span-3">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <ShoppingCart className="w-6 h-6 text-indigo-600" />
                  Giỏ Hàng ({cart.length} sản phẩm)
                </h2>
                {cart.length > 0 && (
                  <button
                    onClick={() => setCart([])}
                    className="text-sm text-red-600 hover:text-red-700 font-medium flex items-center gap-1"
                  >
                    <Trash2 className="w-4 h-4" />
                    Xóa tất cả
                  </button>
                )}
              </div>

              {/* Cart Table */}
              {cart.length === 0 ? (
                <div className="text-center py-20 text-gray-400">
                  <ShoppingCart className="w-20 h-20 mx-auto mb-4 opacity-30" />
                  <p className="text-lg font-medium">Giỏ hàng trống</p>
                  <p className="text-sm mt-2">Nhấn "Thêm Sản Phẩm" để bắt đầu</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Sản phẩm
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Đơn vị
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider w-32">
                          Số lượng
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider w-32">
                          Cân nặng (kg)
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Đơn giá
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-48">
                          Ghi chú
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Thành tiền
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider w-20">
                          Xóa
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {cart.map((item, index) => (
                        <tr key={index} className="hover:bg-gray-50 transition-colors">
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

          {/* RIGHT: Customer Info & Submit */}
          <div className="xl:col-span-1">
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

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={paymentStatus === 'paid'}
                      onChange={(e) => setPaymentStatus(e.target.checked ? 'paid' : 'pending')}
                      className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-700 font-medium">Đã thanh toán</span>
                  </label>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
                    <textarea
                      value={orderNotes}
                      onChange={(e) => setOrderNotes(e.target.value)}
                      placeholder="Ghi chú đơn hàng..."
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={submitOrder}
                disabled={isProcessing || cart.length === 0 || !customerPhone || orderSuccess}
                className={`w-full py-4 rounded-xl font-bold text-white transition-all shadow-lg flex items-center justify-center gap-2 text-lg ${
                  orderSuccess
                    ? 'bg-green-500'
                    : 'bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400'
                } disabled:cursor-not-allowed`}
              >
                {orderSuccess ? (
                  <>
                    <Check className="w-6 h-6" />
                    Đơn Hàng Đã Tạo!
                  </>
                ) : isProcessing ? (
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

      {/* Multi-Select Product Modal - CHỈ CHỌN, KHÔNG NHẬP */}
      {showProductModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[85vh] overflow-hidden shadow-2xl flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-indigo-600 text-white">
              <h2 className="text-2xl font-bold">
                Chọn Sản Phẩm ({selectedProductIds.size} đã chọn)
              </h2>
              <button
                onClick={() => {
                  setShowProductModal(false);
                  setSelectedProductIds(new Set());
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

              {/* Product Grid with Checkboxes */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredProducts.map(product => {
                  const isSelected = selectedProductIds.has(product.id);
                  return (
                    <button
                      key={product.id}
                      onClick={() => toggleProductSelection(product.id)}
                      className={`text-left p-4 rounded-xl border-2 transition-all ${
                        isSelected
                          ? 'border-indigo-500 bg-indigo-50 shadow-md'
                          : 'border-gray-200 hover:border-indigo-300 hover:shadow-sm'
                      }`}
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <div className="flex-shrink-0 mt-1">
                          {isSelected ? (
                            <CheckSquare className="w-6 h-6 text-indigo-600" />
                          ) : (
                            <Square className="w-6 h-6 text-gray-400" />
                          )}
                        </div>
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
                            {product.stock_quantity.toFixed(2)} kg
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {filteredProducts.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                  <Package className="w-16 h-16 mx-auto mb-3 opacity-30" />
                  <p>Không tìm thấy sản phẩm</p>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-gray-50">
              <p className="text-sm text-gray-600">
                Đã chọn <span className="font-bold text-indigo-600 text-lg">{selectedProductIds.size}</span> sản phẩm
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowProductModal(false);
                    setSelectedProductIds(new Set());
                  }}
                  className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-100 transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={addSelectedToCart}
                  disabled={selectedProductIds.size === 0}
                  className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-all disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Thêm Vào Giỏ ({selectedProductIds.size})
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
