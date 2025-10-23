'use client';

import { useState, useEffect } from 'react';
import { productsAPI, ordersAPI, categoriesAPI, formatCurrency, Seafood, Category, OrderItem } from '@/lib/seafood-api';
import { Search, Plus, Minus, Trash2, ShoppingCart, Phone, User, MapPin, CreditCard, Tag, Save, X, Check, Package, Weight, Hash } from 'lucide-react';

// Helper để format đơn vị
const getUnitLabel = (unitType: string) => {
  switch (unitType) {
    case 'piece': return 'con';
    case 'box': return 'thùng';
    default: return 'kg';
  }
};

interface SelectedProductItem {
  product: Seafood;
  quantity: number;
  weight: number;
  notes: string;
}

export default function POSMultiSelectPage() {
  const [products, setProducts] = useState<Seafood[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  // Multi-select modal
  const [showProductModal, setShowProductModal] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<Map<string, SelectedProductItem>>(new Map());

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

  // Toggle product selection
  const toggleProductSelection = (product: Seafood) => {
    const newSelected = new Map(selectedProducts);

    if (newSelected.has(product.id)) {
      newSelected.delete(product.id);
    } else {
      // Auto-calculate initial values
      const initialQuantity = product.unit_type === 'kg' ? 0 : 1;
      const initialWeight = product.unit_type === 'kg' ? 0.5 : (product.avg_unit_weight || 0) * initialQuantity;

      newSelected.set(product.id, {
        product,
        quantity: initialQuantity,
        weight: initialWeight,
        notes: '',
      });
    }

    setSelectedProducts(newSelected);
  };

  // Update selected product item
  const updateSelectedProduct = (productId: string, field: 'quantity' | 'weight' | 'notes', value: any) => {
    const newSelected = new Map(selectedProducts);
    const item = newSelected.get(productId);

    if (!item) return;

    if (field === 'quantity') {
      const qty = Math.max(0, parseFloat(value) || 0);
      item.quantity = qty;
      // Auto-update weight if avg_unit_weight is available
      if (item.product.avg_unit_weight) {
        item.weight = qty * item.product.avg_unit_weight;
      }
    } else if (field === 'weight') {
      item.weight = Math.max(0, parseFloat(value) || 0);
    } else if (field === 'notes') {
      item.notes = value;
    }

    newSelected.set(productId, item);
    setSelectedProducts(newSelected);
  };

  // Add selected products to cart
  const addSelectedToCart = () => {
    if (selectedProducts.size === 0) {
      alert('Vui lòng chọn ít nhất 1 sản phẩm!');
      return;
    }

    // Validate all items have weight
    const invalidItems = Array.from(selectedProducts.values()).filter(item => !item.weight || item.weight <= 0);
    if (invalidItems.length > 0) {
      alert(`Vui lòng nhập cân nặng cho: ${invalidItems.map(i => i.product.name).join(', ')}`);
      return;
    }

    // Add all to cart
    const newItems: OrderItem[] = Array.from(selectedProducts.values()).map(item => ({
      seafood_id: item.product.id,
      seafood: item.product,
      quantity: item.product.unit_type === 'kg' ? undefined : item.quantity,
      weight: item.weight,
      unit_price: Number(item.product.current_price),
      notes: item.notes,
    }));

    setCart([...cart, ...newItems]);
    setShowProductModal(false);
    setSelectedProducts(new Map());
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 flex items-center gap-3">
                <ShoppingCart className="w-7 h-7 text-blue-600" />
                Point of Sale
              </h1>
              <p className="text-gray-600 mt-1">Chọn nhiều sản phẩm cùng lúc</p>
            </div>
            <button
              onClick={() => setShowProductModal(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-5 py-3 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg font-semibold"
            >
              <Plus className="w-5 h-5" />
              Chọn Sản Phẩm
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT: Cart */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-t-2xl">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <ShoppingCart className="w-6 h-6" />
                  Giỏ Hàng ({cart.length})
                </h2>
              </div>

              <div className="p-4 max-h-[600px] overflow-y-auto">
                {cart.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <ShoppingCart className="w-16 h-16 mx-auto mb-3 opacity-50" />
                    <p>Giỏ hàng trống</p>
                    <p className="text-sm mt-1">Nhấn "Chọn Sản Phẩm" để thêm</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {cart.map((item, index) => (
                      <div key={index} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-800">{item.seafood?.name}</h3>
                            <p className="text-xs text-gray-500">{formatCurrency(item.unit_price)}/kg</p>
                          </div>
                          <button
                            onClick={() => removeFromCart(index)}
                            className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          {item.seafood?.unit_type !== 'kg' && (
                            <div>
                              <label className="text-xs text-gray-600 mb-1 block">
                                Số {getUnitLabel(item.seafood.unit_type)}
                              </label>
                              <input
                                type="number"
                                step="1"
                                min="0"
                                value={item.quantity || 0}
                                onChange={(e) => updateCartItem(index, 'quantity', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                              />
                            </div>
                          )}
                          <div className={item.seafood?.unit_type === 'kg' ? 'col-span-2' : ''}>
                            <label className="text-xs text-gray-600 mb-1 block">Cân nặng (kg)</label>
                            <input
                              type="number"
                              step="0.1"
                              min="0"
                              value={item.weight || 0}
                              onChange={(e) => updateCartItem(index, 'weight', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            />
                          </div>
                        </div>

                        <input
                          type="text"
                          value={item.notes || ''}
                          onChange={(e) => updateCartItem(index, 'notes', e.target.value)}
                          placeholder="Ghi chú..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mt-3"
                        />

                        <div className="pt-3 mt-3 border-t border-gray-200">
                          <span className="text-sm font-bold text-blue-600">
                            {formatCurrency(item.weight * item.unit_price)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {cart.length > 0 && (
                <div className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-2xl space-y-2">
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
                      className="w-32 px-3 py-1 border border-gray-300 rounded-lg text-sm text-right"
                    />
                  </div>
                  <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-300">
                    <span>Tổng cộng:</span>
                    <span className="text-blue-600">{formatCurrency(total)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: Customer Info */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 space-y-4">
              <div className="bg-white rounded-2xl shadow-lg p-4 border border-gray-100">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
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
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
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
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>

                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <textarea
                      value={customerAddress}
                      onChange={(e) => setCustomerAddress(e.target.value)}
                      placeholder="Địa chỉ giao hàng"
                      rows={2}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg resize-none"
                    />
                  </div>

                  <div className="relative">
                    <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-white"
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
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">Đã thanh toán</span>
                  </label>

                  <div className="relative">
                    <Tag className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <textarea
                      value={orderNotes}
                      onChange={(e) => setOrderNotes(e.target.value)}
                      placeholder="Ghi chú đơn hàng"
                      rows={2}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg resize-none"
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={submitOrder}
                disabled={isProcessing || cart.length === 0 || !customerPhone || orderSuccess}
                className={`w-full py-4 rounded-xl font-bold text-white transition-all shadow-lg flex items-center justify-center gap-2 ${
                  orderSuccess
                    ? 'bg-green-500'
                    : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-400'
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

      {/* Multi-Select Product Modal */}
      {showProductModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-blue-600 to-purple-600 text-white">
              <h2 className="text-2xl font-bold">Chọn Sản Phẩm ({selectedProducts.size} đã chọn)</h2>
              <button
                onClick={() => {
                  setShowProductModal(false);
                  setSelectedProducts(new Map());
                }}
                className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-hidden flex">
              {/* Left: Product List */}
              <div className="flex-1 overflow-y-auto p-6 border-r border-gray-200">
                {/* Search & Filter */}
                <div className="mb-4">
                  <div className="relative mb-3">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Tìm kiếm sản phẩm..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setSelectedCategory('')}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        selectedCategory === ''
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Tất cả
                    </button>
                    {categories.map(cat => (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                          selectedCategory === cat.id
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Product Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {filteredProducts.map(product => {
                    const isSelected = selectedProducts.has(product.id);
                    return (
                      <button
                        key={product.id}
                        onClick={() => toggleProductSelection(product)}
                        className={`text-left p-4 rounded-xl border-2 transition-all ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50 shadow-md'
                            : 'border-gray-200 hover:border-blue-300 hover:shadow-sm'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-800">{product.name}</h3>
                            <p className="text-xs text-gray-500 mt-1">{product.code}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                              {getUnitLabel(product.unit_type)}
                            </span>
                            {isSelected && (
                              <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                                <Check className="w-4 h-4 text-white" />
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-bold text-blue-600">
                            {formatCurrency(product.current_price)}
                          </span>
                          <span className="text-xs text-gray-500">
                            Kho: {product.stock_quantity.toFixed(2)} kg
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Right: Selected Products Details */}
              <div className="w-96 overflow-y-auto p-6 bg-gray-50">
                <h3 className="font-bold text-gray-800 mb-4">Chi Tiết Sản Phẩm Đã Chọn</h3>

                {selectedProducts.size === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Chưa chọn sản phẩm nào</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {Array.from(selectedProducts.values()).map(item => (
                      <div key={item.product.id} className="bg-white rounded-xl p-3 border border-gray-200">
                        <div className="flex items-start justify-between mb-3">
                          <h4 className="font-semibold text-sm text-gray-800">{item.product.name}</h4>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleProductSelection(item.product);
                            }}
                            className="text-red-500 hover:bg-red-50 p-1 rounded"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        {item.product.unit_type !== 'kg' && (
                          <div className="mb-2">
                            <label className="text-xs text-gray-600 mb-1 block">
                              Số {getUnitLabel(item.product.unit_type)}
                            </label>
                            <input
                              type="number"
                              step="1"
                              min="0"
                              value={item.quantity}
                              onChange={(e) => updateSelectedProduct(item.product.id, 'quantity', e.target.value)}
                              className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                        )}

                        <div className="mb-2">
                          <label className="text-xs text-gray-600 mb-1 block">Cân nặng (kg)</label>
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            value={item.weight}
                            onChange={(e) => updateSelectedProduct(item.product.id, 'weight', e.target.value)}
                            className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>

                        <input
                          type="text"
                          value={item.notes}
                          onChange={(e) => updateSelectedProduct(item.product.id, 'notes', e.target.value)}
                          placeholder="Ghi chú..."
                          className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm mb-2"
                          onClick={(e) => e.stopPropagation()}
                        />

                        <div className="pt-2 border-t border-gray-200">
                          <span className="text-sm font-bold text-blue-600">
                            {formatCurrency(item.weight * Number(item.product.current_price))}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-gray-50">
              <p className="text-sm text-gray-600">
                Đã chọn <span className="font-bold text-blue-600">{selectedProducts.size}</span> sản phẩm
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowProductModal(false);
                    setSelectedProducts(new Map());
                  }}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-100 transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={addSelectedToCart}
                  disabled={selectedProducts.size === 0}
                  className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Thêm Vào Giỏ ({selectedProducts.size})
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
