'use client';

import { useState, useEffect } from 'react';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Plus,
  Search,
  Calendar,
  Edit,
  Trash2,
  X,
  PieChart
} from 'lucide-react';

interface Transaction {
  id: string;
  transaction_type: 'income' | 'expense';
  category: string;
  amount: number;
  date: string;
  description: string;
  order_id?: string | null;
  created_at: string;
}

interface TransactionSummary {
  date_from: string;
  date_to: string;
  income_total: number;
  income_count: number;
  expense_total: number;
  expense_count: number;
  profit: number;
  income_by_category: Array<{ category: string; total: number; count: number }>;
  expense_by_category: Array<{ category: string; total: number; count: number }>;
}

const TRANSACTION_CATEGORIES = {
  income: [
    { value: 'sales', label: 'Doanh thu bán hàng' },
    { value: 'service', label: 'Doanh thu dịch vụ' },
    { value: 'investment', label: 'Đầu tư' },
    { value: 'other_income', label: 'Thu nhập khác' },
  ],
  expense: [
    { value: 'salary', label: 'Lương nhân viên' },
    { value: 'rent', label: 'Thuê mặt bằng' },
    { value: 'utilities', label: 'Điện nước' },
    { value: 'supplies', label: 'Vật tư tiêu hao' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'maintenance', label: 'Bảo trì sửa chữa' },
    { value: 'transport', label: 'Vận chuyển' },
    { value: 'other_expense', label: 'Chi phí khác' },
  ],
};

export default function FinancePage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<TransactionSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [dateFrom, setDateFrom] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split('T')[0]);

  // Form state
  const [formData, setFormData] = useState({
    transaction_type: 'income' as 'income' | 'expense',
    category: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
  });

  useEffect(() => {
    loadData();
  }, [filterType, dateFrom, dateTo]);

  const loadData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');

      // Build query params
      const params = new URLSearchParams();
      if (filterType !== 'all') params.append('transaction_type', filterType);
      if (dateFrom) params.append('date_from', dateFrom);
      if (dateTo) params.append('date_to', dateTo);

      // Fetch transactions
      const transactionsResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/users/transactions?${params.toString()}`,
        {
          headers: { Authorization: token ? `Bearer ${token}` : '' },
        }
      );

      if (transactionsResponse.ok) {
        const transactionsData = await transactionsResponse.json();
        setTransactions(transactionsData);
      }

      // Fetch summary
      const summaryParams = new URLSearchParams();
      if (dateFrom) summaryParams.append('date_from', dateFrom);
      if (dateTo) summaryParams.append('date_to', dateTo);

      const summaryResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/users/transactions/summary/stats?${summaryParams.toString()}`,
        {
          headers: { Authorization: token ? `Bearer ${token}` : '' },
        }
      );

      if (summaryResponse.ok) {
        const summaryData = await summaryResponse.json();
        setSummary(summaryData);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const token = localStorage.getItem('access_token');
    const url = editingTransaction
      ? `${process.env.NEXT_PUBLIC_API_URL}/api/users/transactions/${editingTransaction.id}`
      : `${process.env.NEXT_PUBLIC_API_URL}/api/users/transactions`;

    const method = editingTransaction ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount),
          date: new Date(formData.date).toISOString(),
        }),
      });

      if (response.ok) {
        setShowModal(false);
        setEditingTransaction(null);
        resetForm();
        loadData();
      } else {
        alert('Lỗi khi lưu giao dịch');
      }
    } catch (error) {
      console.error('Failed to save transaction:', error);
      alert('Lỗi khi lưu giao dịch');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa giao dịch này?')) return;

    const token = localStorage.getItem('access_token');

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/transactions/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
        },
      });

      if (response.ok) {
        loadData();
      } else {
        alert('Lỗi khi xóa giao dịch');
      }
    } catch (error) {
      console.error('Failed to delete transaction:', error);
      alert('Lỗi khi xóa giao dịch');
    }
  };

  const openEditModal = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setFormData({
      transaction_type: transaction.transaction_type,
      category: transaction.category,
      amount: transaction.amount.toString(),
      date: transaction.date.split('T')[0],
      description: transaction.description,
    });
    setShowModal(true);
  };

  const openCreateModal = () => {
    setEditingTransaction(null);
    resetForm();
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      transaction_type: 'income',
      category: '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      description: '',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN').format(amount) + 'đ';
  };

  const getCategoryLabel = (type: 'income' | 'expense', value: string) => {
    const categories = TRANSACTION_CATEGORIES[type];
    const category = categories.find((c) => c.value === value);
    return category?.label || value;
  };

  const filteredTransactions = transactions.filter((t) =>
    t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    getCategoryLabel(t.transaction_type, t.category).toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
          <DollarSign className="w-8 h-8" />
          Tài chính
        </h1>
        <p className="text-slate-600 mt-1">Quản lý thu chi và báo cáo tài chính</p>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-md p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Tổng thu</p>
                <p className="text-2xl font-bold mt-1">{formatCurrency(summary.income_total)}</p>
                <p className="text-xs text-green-100 mt-1">{summary.income_count} giao dịch</p>
              </div>
              <TrendingUp className="w-12 h-12 opacity-80" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-lg shadow-md p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 text-sm">Tổng chi</p>
                <p className="text-2xl font-bold mt-1">{formatCurrency(summary.expense_total)}</p>
                <p className="text-xs text-red-100 mt-1">{summary.expense_count} giao dịch</p>
              </div>
              <TrendingDown className="w-12 h-12 opacity-80" />
            </div>
          </div>

          <div className={`rounded-lg shadow-md p-6 text-white ${
            summary.profit >= 0
              ? 'bg-gradient-to-br from-blue-500 to-blue-600'
              : 'bg-gradient-to-br from-orange-500 to-orange-600'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80 text-sm">Lợi nhuận</p>
                <p className="text-2xl font-bold mt-1">{formatCurrency(summary.profit)}</p>
                <p className="text-xs text-white/80 mt-1">
                  {summary.profit >= 0 ? 'Thu > Chi' : 'Chi > Thu'}
                </p>
              </div>
              <PieChart className="w-12 h-12 opacity-80" />
            </div>
          </div>
        </div>
      )}

      {/* Filters and Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Tìm kiếm giao dịch..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Filter Type */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Tất cả</option>
            <option value="income">Thu</option>
            <option value="expense">Chi</option>
          </select>

          {/* Date From */}
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          {/* Date To */}
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="mt-4 flex justify-end">
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Thêm giao dịch
          </button>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">Ngày</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">Loại</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">Danh mục</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-600 uppercase">Số tiền</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">Mô tả</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-slate-600 uppercase">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredTransactions.length > 0 ? (
                filteredTransactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm text-slate-700">
                      {new Date(transaction.date).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${
                          transaction.transaction_type === 'income'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {transaction.transaction_type === 'income' ? (
                          <>
                            <TrendingUp className="w-3 h-3" />
                            Thu
                          </>
                        ) : (
                          <>
                            <TrendingDown className="w-3 h-3" />
                            Chi
                          </>
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700">
                      {getCategoryLabel(transaction.transaction_type, transaction.category)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-medium">
                      <span
                        className={
                          transaction.transaction_type === 'income' ? 'text-green-600' : 'text-red-600'
                        }
                      >
                        {transaction.transaction_type === 'income' ? '+' : '-'}
                        {formatCurrency(transaction.amount)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">{transaction.description}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openEditModal(transaction)}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                          title="Sửa"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(transaction.id)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                          title="Xóa"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                    Không có giao dịch nào
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <h2 className="text-lg font-bold text-slate-800">
                {editingTransaction ? 'Sửa giao dịch' : 'Thêm giao dịch'}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingTransaction(null);
                  resetForm();
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              {/* Transaction Type */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Loại giao dịch</label>
                <select
                  value={formData.transaction_type}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      transaction_type: e.target.value as 'income' | 'expense',
                      category: '',
                    })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="income">Thu</option>
                  <option value="expense">Chi</option>
                </select>
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Danh mục</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">-- Chọn danh mục --</option>
                  {TRANSACTION_CATEGORIES[formData.transaction_type].map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Số tiền</label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Ngày</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Mô tả</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingTransaction(null);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingTransaction ? 'Cập nhật' : 'Thêm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
