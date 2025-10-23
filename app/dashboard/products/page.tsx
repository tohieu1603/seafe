'use client';

import { useState, useEffect } from 'react';
import { productsAPI, categoriesAPI, formatCurrency, formatWeight, Seafood, Category } from '@/lib/seafood-api';
import { Package, Plus, Edit, Trash2, Search, Filter, X, ChevronDown, ChevronRight, Tag as TagIcon } from 'lucide-react';

export default function ProductsPage() {
  const [products, setProducts] = useState<Seafood[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Seafood | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    category_id: '',
    unit_type: 'kg',
    avg_unit_weight: 0,
    current_price: 0,
    stock_quantity: 0,
    description: '',
    origin: '',
    image_url: '',
    status: 'active',
  });
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [productsData, categoriesData] = await Promise.all([
        productsAPI.list(),
        categoriesAPI.list(),
      ]);
      setProducts(productsData);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter logic
  const filteredProducts = products.filter(product => {
    const matchSearch = searchQuery === '' ||
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCategory = categoryFilter === 'all' || product.category_id === categoryFilter;
    const matchStatus = statusFilter === 'all' || product.status === statusFilter;
    return matchSearch && matchCategory && matchStatus;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProducts = filteredProducts.slice(startIndex, startIndex + itemsPerPage);

  const toggleRow = (productId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(productId)) {
      newExpanded.delete(productId);
    } else {
      newExpanded.add(productId);
    }
    setExpandedRows(newExpanded);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setCategoryFilter('all');
    setStatusFilter('all');
    setCurrentPage(1);
  };

  const openCreateModal = () => {
    setEditingProduct(null);
    setFormData({
      code: '',
      name: '',
      category_id: '',
      unit_type: 'kg',
      avg_unit_weight: 0,
      current_price: 0,
      stock_quantity: 0,
      description: '',
      origin: '',
      image_url: '',
      status: 'active',
    });
    setTags([]);
    setShowModal(true);
  };

  const openEditModal = (product: Seafood) => {
    setEditingProduct(product);
    setFormData({
      code: product.code,
      name: product.name,
      category_id: product.category_id || '',
      unit_type: product.unit_type || 'kg',
      avg_unit_weight: Number(product.avg_unit_weight || 0),
      current_price: Number(product.current_price),
      stock_quantity: Number(product.stock_quantity),
      description: product.description || '',
      origin: product.origin || '',
      image_url: product.image_url || '',
      status: product.status,
    });
    setTags(product.tags || []);
    setShowModal(true);
  };

  const handleDelete = async (productId: string) => {
    if (!confirm('Bạn có chắc muốn xóa sản phẩm này?')) return;

    try {
      await productsAPI.delete(productId);
      alert('Xóa sản phẩm thành công!');
      loadData();
    } catch (error) {
      console.error('Failed to delete:', error);
      alert('Không thể xóa sản phẩm');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const data = {
        ...formData,
        tags,
        unit_type: formData.unit_type as 'kg' | 'piece' | 'box',
      };

      if (editingProduct) {
        await productsAPI.update(editingProduct.id, data);
        alert('Cập nhật sản phẩm thành công!');
      } else {
        await productsAPI.create(data);
        alert('Tạo sản phẩm thành công!');
      }

      setShowModal(false);
      loadData();
    } catch (error) {
      console.error('Failed to save product:', error);
      alert('Không thể lưu sản phẩm');
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  const hasActiveFilters = searchQuery || categoryFilter !== 'all' || statusFilter !== 'all';

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Package className="w-16 h-16 text-indigo-600 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 overflow-x-hidden">
      <div className="w-full max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 flex items-center gap-2 sm:gap-3">
              <Package className="w-6 h-6 sm:w-8 sm:h-8 text-indigo-600" />
              Quản lý Sản phẩm
            </h1>
            <p className="text-sm sm:text-base text-slate-600 mt-1">Quản lý danh mục hải sản</p>
          </div>
          <button
            onClick={openCreateModal}
            className="w-full sm:w-auto px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-lg"
          >
            <Plus className="w-5 h-5" />
            Thêm sản phẩm
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6 mb-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-slate-600" />
            <h3 className="font-semibold text-slate-900">Bộ lọc</h3>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="ml-auto text-xs sm:text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
              >
                <X className="w-4 h-4" />
                <span className="hidden sm:inline">Xóa bộ lọc</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Tìm kiếm
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tên hoặc mã sản phẩm..."
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Danh mục
              </label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="all">Tất cả</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Trạng thái
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="all">Tất cả</option>
                <option value="active">Đang bán</option>
                <option value="inactive">Ngừng bán</option>
              </select>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <p className="text-xs sm:text-sm text-slate-600">Tổng sản phẩm</p>
            <p className="text-xl sm:text-2xl font-bold text-slate-900">{products.length}</p>
          </div>
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <p className="text-xs sm:text-sm text-slate-600">Đang bán</p>
            <p className="text-xl sm:text-2xl font-bold text-emerald-600">
              {products.filter(p => p.status === 'active').length}
            </p>
          </div>
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <p className="text-xs sm:text-sm text-slate-600">Kết quả lọc</p>
            <p className="text-xl sm:text-2xl font-bold text-indigo-600">{filteredProducts.length}</p>
          </div>
        </div>

        {/* Table - Desktop only, Cards for mobile */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          {/* Mobile Cards View */}
          <div className="block lg:hidden divide-y divide-slate-200">
            {paginatedProducts.length === 0 ? (
              <div className="px-4 py-8 text-center text-slate-500">
                Không tìm thấy sản phẩm nào
              </div>
            ) : (
              paginatedProducts.map((product) => (
                <div key={product.id} className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 truncate">{product.name}</p>
                      <p className="text-xs text-slate-500 font-mono mt-1">{product.code}</p>
                    </div>
                    <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full flex-shrink-0 ${
                      product.status === 'active'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                      {product.status === 'active' ? 'Bán' : 'Ngừng'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
                    <div>
                      <p className="text-slate-600 text-xs">Danh mục</p>
                      <p className="font-medium text-slate-900">{product.category?.name || '-'}</p>
                    </div>
                    <div>
                      <p className="text-slate-600 text-xs">Tồn kho</p>
                      <p className={`font-medium ${
                        Number(product.stock_quantity) < 10 ? 'text-red-600' : 'text-slate-900'
                      }`}>
                        {formatWeight(Number(product.stock_quantity))}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-base font-semibold text-emerald-600">
                      {formatCurrency(Number(product.current_price))}/kg
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEditModal(product)}
                        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {product.tags && product.tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {product.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="inline-flex px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase w-10"></th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Mã</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Tên sản phẩm</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Danh mục</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Giá</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Tồn kho</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Trạng thái</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {paginatedProducts.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                      Không tìm thấy sản phẩm nào
                    </td>
                  </tr>
                ) : (
                  paginatedProducts.map((product) => {
                    const isExpanded = expandedRows.has(product.id);

                    return (
                      <>
                        {/* Main Row */}
                        <tr key={product.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3">
                            <button
                              onClick={() => toggleRow(product.id)}
                              className="text-slate-400 hover:text-slate-600 transition-colors"
                            >
                              {isExpanded ? (
                                <ChevronDown className="w-5 h-5" />
                              ) : (
                                <ChevronRight className="w-5 h-5" />
                              )}
                            </button>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm font-mono text-slate-600">{product.code}</span>
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-medium text-slate-900">{product.name}</p>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm text-slate-600">
                              {product.category?.name || '-'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="text-sm font-semibold text-emerald-600">
                              {formatCurrency(Number(product.current_price))}/kg
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className={`text-sm font-medium ${
                              Number(product.stock_quantity) < 10 ? 'text-red-600' : 'text-slate-900'
                            }`}>
                              {formatWeight(Number(product.stock_quantity))}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              product.status === 'active'
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-slate-100 text-slate-600'
                            }`}>
                              {product.status === 'active' ? 'Đang bán' : 'Ngừng bán'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => openEditModal(product)}
                                className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                                title="Sửa"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(product.id)}
                                className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                                title="Xóa"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* Expanded Detail Row */}
                        {isExpanded && (
                          <tr>
                            <td colSpan={8} className="px-4 py-4 bg-slate-50">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <h4 className="font-semibold text-slate-900 mb-2">Thông tin chi tiết</h4>
                                  <dl className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                      <dt className="text-slate-600">Xuất xứ:</dt>
                                      <dd className="font-medium text-slate-900">{product.origin || 'Chưa cập nhật'}</dd>
                                    </div>
                                    <div className="flex justify-between">
                                      <dt className="text-slate-600">Mô tả:</dt>
                                      <dd className="font-medium text-slate-900 text-right max-w-xs">
                                        {product.description || 'Chưa có mô tả'}
                                      </dd>
                                    </div>
                                  </dl>
                                </div>
                                <div>
                                  <h4 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                                    <TagIcon className="w-4 h-4" />
                                    Biến thể / Tags
                                  </h4>
                                  {product.tags && product.tags.length > 0 ? (
                                    <div className="flex flex-wrap gap-2">
                                      {product.tags.map((tag, idx) => (
                                        <span
                                          key={idx}
                                          className="inline-flex px-3 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full"
                                        >
                                          {tag}
                                        </span>
                                      ))}
                                    </div>
                                  ) : (
                                    <p className="text-sm text-slate-500">Chưa có tags</p>
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {filteredProducts.length > 0 && (
            <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-600">Hiển thị</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-3 py-1 border border-slate-300 rounded-lg text-sm"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span className="text-sm text-slate-600">
                  trên {filteredProducts.length} kết quả
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border border-slate-300 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
                >
                  Trước
                </button>
                <span className="text-sm text-slate-600">
                  Trang {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 border border-slate-300 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
                >
                  Sau
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white">
              <h2 className="text-xl font-bold text-slate-900">
                {editingProduct ? 'Sửa sản phẩm' : 'Thêm sản phẩm mới'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Mã sản phẩm *</label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="VD: TOM-HUM-001"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Tên sản phẩm *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="VD: Tôm hùm Alaska"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Danh mục</label>
                  <select
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Chọn danh mục</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Trạng thái</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="active">Đang bán</option>
                    <option value="inactive">Ngừng bán</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Đơn vị tính *</label>
                  <select
                    value={formData.unit_type}
                    onChange={(e) => setFormData({ ...formData, unit_type: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="kg">Kilogram (kg)</option>
                    <option value="piece">Con/Cái</option>
                    <option value="box">Thùng/Hộp</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Trọng lượng TB (kg/{formData.unit_type === 'piece' ? 'con' : formData.unit_type === 'box' ? 'thùng' : 'đơn vị'})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.avg_unit_weight || ''}
                    onChange={(e) => setFormData({ ...formData, avg_unit_weight: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder={formData.unit_type === 'kg' ? 'Không áp dụng' : 'VD: 0.05'}
                    disabled={formData.unit_type === 'kg'}
                  />
                  {formData.unit_type !== 'kg' && (
                    <p className="text-xs text-slate-500 mt-1">
                      Ví dụ: Mỗi con ốc = 0.05kg, Mỗi thùng tôm = 5kg
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Giá (đ/kg) *</label>
                  <input
                    type="number"
                    required
                    value={formData.current_price || ''}
                    onChange={(e) => setFormData({ ...formData, current_price: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Tồn kho (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.stock_quantity || ''}
                    onChange={(e) => setFormData({ ...formData, stock_quantity: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="0.0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Xuất xứ</label>
                <input
                  type="text"
                  value={formData.origin}
                  onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="VD: Biển Đông, Việt Nam"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Mô tả</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="Mô tả sản phẩm..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                  <TagIcon className="w-4 h-4" />
                  Biến thể / Tags (nhấn Enter để thêm)
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleTagKeyDown}
                    className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="VD: tươi sống, đông lạnh, phi lê..."
                  />
                  <button
                    type="button"
                    onClick={addTag}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                  >
                    + Thêm
                  </button>
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="hover:text-green-900"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-4 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2 border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
                >
                  {editingProduct ? 'Cập nhật' : 'Tạo mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
