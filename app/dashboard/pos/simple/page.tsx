'use client';

import { useState, useEffect } from 'react';
import { productsAPI, ordersAPI, categoriesAPI, formatCurrency, Seafood, Category, OrderItem } from '@/lib/seafood-api';
import { Search, Plus, Trash2, ShoppingCart, X } from 'lucide-react';

const getUnitLabel = (unitType: string) => {
  switch (unitType) {
    case 'piece': return 'con';
    case 'box': return 'thùng';
    default: return 'kg';
  }
};

export default function POSSimplePage() {
  const [products, setProducts] = useState<Seafood[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  // Multi-select modal state
  const [showModal, setShowModal] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]); // Dùng array thay vì Set để dễ debug

  // Customer info
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<string>('cash');
  const [discount, setDiscount] = useState<number>(0);

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

  // Toggle selection - QUAN TRỌNG: dùng array và includes
  const toggleSelection = (productId: string) => {
    if (selectedIds.includes(productId)) {
      setSelectedIds(selectedIds.filter(id => id !== productId));
    } else {
      setSelectedIds([...selectedIds, productId]);
    }
  };

  // Add to cart
  const addToCart = () => {
    if (selectedIds.length === 0) {
      alert('Vui lòng chọn ít nhất 1 sản phẩm!');
      return;
    }

    const newItems = selectedIds
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
    setShowModal(false);
    setSelectedIds([]);
  };

  // Update cart
  const updateCart = (index: number, field: 'quantity' | 'weight' | 'notes', value: any) => {
    const updated = [...cart];
    const item = updated[index];

    if (field === 'quantity') {
      item.quantity = Math.max(0, parseFloat(value) || 0);
      if (item.seafood?.avg_unit_weight) {
        item.weight = item.quantity * item.seafood.avg_unit_weight;
      }
    } else if (field === 'weight') {
      item.weight = Math.max(0, parseFloat(value) || 0);
    } else {
      item.notes = value;
    }

    setCart(updated);
  };

  const removeFromCart = (index: number) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.weight * item.unit_price), 0);
  const total = subtotal - discount;

  const submitOrder = async () => {
    if (!customerPhone) {
      alert('Vui lòng nhập số điện thoại!');
      return;
    }

    if (cart.length === 0) {
      alert('Giỏ hàng trống!');
      return;
    }

    const invalid = cart.some(item => !item.weight || item.weight <= 0);
    if (invalid) {
      alert('Vui lòng nhập cân nặng cho tất cả sản phẩm!');
      return;
    }

    setIsProcessing(true);

    try {
      await ordersAPI.create({
        customer_phone: customerPhone,
        customer_name: customerName,
        customer_address: '',
        payment_method: paymentMethod,
        payment_status: 'pending',
        discount_amount: discount,
        notes: '',
        items: cart,
      });

      alert('✅ Tạo đơn hàng thành công!');
      setCart([]);
      setCustomerPhone('');
      setCustomerName('');
      setDiscount(0);
      loadData();
    } catch (error) {
      alert('❌ Lỗi: ' + error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">POS - Chọn Nhiều Sản Phẩm</h1>
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Chọn Sản Phẩm
          </button>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Cart Table */}
          <div className="col-span-2 bg-white rounded-xl shadow p-6">
            <h2 className="text-xl font-bold mb-4">Giỏ Hàng ({cart.length})</h2>

            {cart.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <ShoppingCart className="w-16 h-16 mx-auto mb-3 opacity-30" />
                <p>Giỏ hàng trống</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50 border-b-2">
                  <tr>
                    <th className="px-4 py-3 text-left">Sản phẩm</th>
                    <th className="px-4 py-3 text-center w-24">Số lượng</th>
                    <th className="px-4 py-3 text-center w-32">Cân nặng (kg)</th>
                    <th className="px-4 py-3 text-right">Đơn giá</th>
                    <th className="px-4 py-3 text-right">Thành tiền</th>
                    <th className="px-4 py-3 text-center w-20">Xóa</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {cart.map((item, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <p className="font-semibold">{item.seafood?.name}</p>
                        <p className="text-xs text-gray-500">{item.seafood?.code}</p>
                      </td>
                      <td className="px-4 py-3">
                        {item.seafood?.unit_type !== 'kg' ? (
                          <input
                            type="number"
                            step="1"
                            value={item.quantity || 0}
                            onChange={(e) => updateCart(idx, 'quantity', e.target.value)}
                            className="w-full px-2 py-2 border rounded text-center font-semibold"
                          />
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          step="0.1"
                          value={item.weight || 0}
                          onChange={(e) => updateCart(idx, 'weight', e.target.value)}
                          className="w-full px-2 py-2 border rounded text-center font-semibold"
                        />
                      </td>
                      <td className="px-4 py-3 text-right">
                        {formatCurrency(item.unit_price)}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-blue-600">
                        {formatCurrency(item.weight * item.unit_price)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => removeFromCart(idx)}
                          className="text-red-500 hover:bg-red-50 p-2 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {cart.length > 0 && (
              <div className="mt-6 border-t pt-4">
                <div className="flex justify-end">
                  <div className="w-80 space-y-2">
                    <div className="flex justify-between">
                      <span>Tạm tính:</span>
                      <span className="font-semibold">{formatCurrency(subtotal)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Giảm giá:</span>
                      <input
                        type="number"
                        value={discount}
                        onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                        className="w-32 px-3 py-1 border rounded text-right"
                      />
                    </div>
                    <div className="flex justify-between text-xl font-bold pt-2 border-t">
                      <span>Tổng:</span>
                      <span className="text-blue-600">{formatCurrency(total)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Customer Info */}
          <div className="col-span-1 bg-white rounded-xl shadow p-6">
            <h3 className="font-bold text-lg mb-4">Thông Tin Khách Hàng</h3>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Số điện thoại *</label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full px-3 py-2 border rounded"
                  placeholder="0901234567"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Tên khách</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3 py-2 border rounded"
                  placeholder="Nguyễn Văn A"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Thanh toán</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 border rounded"
                >
                  <option value="cash">Tiền mặt</option>
                  <option value="transfer">Chuyển khoản</option>
                  <option value="momo">MoMo</option>
                </select>
              </div>

              <button
                onClick={submitOrder}
                disabled={isProcessing || cart.length === 0 || !customerPhone}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed mt-6"
              >
                {isProcessing ? 'Đang xử lý...' : 'Tạo Đơn Hàng'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal - QUAN TRỌNG: Chọn nhiều được */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[85vh] flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b bg-blue-600 text-white rounded-t-2xl flex justify-between items-center">
              <h2 className="text-2xl font-bold">
                Chọn Sản Phẩm (Đã chọn: {selectedIds.length})
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedIds([]);
                }}
                className="hover:bg-white/20 p-2 rounded"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Search */}
              <div className="mb-6">
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Tìm kiếm..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border rounded-xl"
                  />
                </div>

                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => setSelectedCategory('')}
                    className={`px-4 py-2 rounded-lg ${
                      selectedCategory === '' ? 'bg-blue-600 text-white' : 'bg-gray-200'
                    }`}
                  >
                    Tất cả
                  </button>
                  {categories.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`px-4 py-2 rounded-lg ${
                        selectedCategory === cat.id ? 'bg-blue-600 text-white' : 'bg-gray-200'
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Products Grid */}
              <div className="grid grid-cols-3 gap-4">
                {filteredProducts.map(product => {
                  const isSelected = selectedIds.includes(product.id);
                  return (
                    <div
                      key={product.id}
                      onClick={() => toggleSelection(product.id)}
                      className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50 shadow-lg'
                          : 'border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      <div className="flex items-start gap-3 mb-3">
                        {/* Checkbox */}
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}} // Controlled by parent div onClick
                          className="w-5 h-5 mt-1 cursor-pointer"
                        />
                        <div className="flex-1">
                          <h3 className="font-semibold">{product.name}</h3>
                          <p className="text-xs text-gray-500">{product.code}</p>
                        </div>
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                          {getUnitLabel(product.unit_type)}
                        </span>
                      </div>

                      <div className="flex justify-between items-end">
                        <div>
                          <p className="text-xl font-bold text-blue-600">
                            {formatCurrency(product.current_price)}
                          </p>
                          <p className="text-xs text-gray-500">/kg</p>
                        </div>
                        <p className="text-sm">
                          Kho: {product.stock_quantity.toFixed(2)} kg
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t bg-gray-50 rounded-b-2xl flex justify-between items-center">
              <p className="text-lg">
                Đã chọn: <span className="font-bold text-blue-600">{selectedIds.length}</span> sản phẩm
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowModal(false);
                    setSelectedIds([]);
                  }}
                  className="px-6 py-2 border rounded-lg hover:bg-gray-100"
                >
                  Hủy
                </button>
                <button
                  onClick={addToCart}
                  disabled={selectedIds.length === 0}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400"
                >
                  Thêm Vào Giỏ ({selectedIds.length})
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
