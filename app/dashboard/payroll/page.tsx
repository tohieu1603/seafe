'use client';

import { useState, useEffect } from 'react';
import {
  DollarSign, Users, TrendingUp, Calendar, Download, Check, X, Clock,
  Search, Filter, ChevronDown, ChevronRight, Calculator, FileText, Eye
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8003';

interface PayrollSummary {
  total_employees: number;
  total_gross_salary: number;
  total_net_salary: number;
  total_insurance: number;
  total_tax: number;
  total_commission: number;
  total_kpi_bonus: number;
  draft_count: number;
  pending_count: number;
  approved_count: number;
  paid_count: number;
}

interface EmployeePayroll {
  user_id: string;
  user_name: string;
  user_email: string;
  role_name: string;
  base_salary: number;
  working_days: number;
  kpi_score: number;
  sales_revenue: number;
  net_salary: number;
  status: string;
  payroll_id: string | null;
}

export default function PayrollManagementPage() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [summary, setSummary] = useState<PayrollSummary | null>(null);
  const [employees, setEmployees] = useState<EmployeePayroll[]>([]);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [selectedEmployees, setSelectedEmployees] = useState<Set<string>>(new Set());
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedEmployee, setExpandedEmployee] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [year, month]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load summary
      const summaryRes = await fetch(`${API_URL}/api/payroll/summary?year=${year}&month=${month}`);
      if (summaryRes.ok) {
        const summaryData = await summaryRes.json();
        setSummary(summaryData);
      }

      // Load employees
      const employeesRes = await fetch(`${API_URL}/api/payroll/employees-summary?year=${year}&month=${month}`);
      if (employeesRes.ok) {
        const employeesData = await employeesRes.json();
        setEmployees(employeesData);
      }
    } catch (error) {
      console.error('Failed to load payroll data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateAllPayrolls = async () => {
    if (!confirm(`Tính lương cho tất cả nhân viên tháng ${month}/${year}?`)) return;

    try {
      setCalculating(true);
      const response = await fetch(`${API_URL}/api/payroll/calculate-bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ year, month })
      });

      if (response.ok) {
        const result = await response.json();
        alert(`Thành công: ${result.success.length}/${result.total}\nThất bại: ${result.failed.length}`);
        loadData();
      }
    } catch (error) {
      alert('Lỗi khi tính lương: ' + error);
    } finally {
      setCalculating(false);
    }
  };

  const approveSelected = async () => {
    const payrollIds = Array.from(selectedEmployees)
      .map(userId => employees.find(e => e.user_id === userId)?.payroll_id)
      .filter(id => id);

    if (payrollIds.length === 0) {
      alert('Vui lòng chọn nhân viên có bảng lương');
      return;
    }

    if (!confirm(`Duyệt lương cho ${payrollIds.length} nhân viên?`)) return;

    try {
      const response = await fetch(`${API_URL}/api/payroll/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payroll_ids: payrollIds })
      });

      if (response.ok) {
        alert('Đã duyệt lương thành công');
        setSelectedEmployees(new Set());
        loadData();
      }
    } catch (error) {
      alert('Lỗi khi duyệt lương: ' + error);
    }
  };

  const markPaidSelected = async () => {
    const payrollIds = Array.from(selectedEmployees)
      .map(userId => employees.find(e => e.user_id === userId)?.payroll_id)
      .filter(id => id);

    if (payrollIds.length === 0) {
      alert('Vui lòng chọn nhân viên có bảng lương');
      return;
    }

    if (!confirm(`Đánh dấu đã chi trả cho ${payrollIds.length} nhân viên?`)) return;

    try {
      const response = await fetch(`${API_URL}/api/payroll/mark-paid`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payroll_ids: payrollIds })
      });

      if (response.ok) {
        alert('Đã cập nhật trạng thái chi trả');
        setSelectedEmployees(new Set());
        loadData();
      }
    } catch (error) {
      alert('Lỗi: ' + error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN').format(amount) + 'đ';
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: any = {
      'draft': { label: 'Nháp', className: 'bg-gray-100 text-gray-800', icon: Clock },
      'pending': { label: 'Chờ duyệt', className: 'bg-yellow-100 text-yellow-800', icon: Clock },
      'approved': { label: 'Đã duyệt', className: 'bg-green-100 text-green-800', icon: Check },
      'paid': { label: 'Đã chi trả', className: 'bg-blue-100 text-blue-800', icon: Check },
      'not_calculated': { label: 'Chưa tính', className: 'bg-red-100 text-red-800', icon: X },
    };
    const config = statusConfig[status] || statusConfig['draft'];
    const Icon = config.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${config.className}`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </span>
    );
  };

  const toggleEmployee = (userId: string) => {
    const newSelected = new Set(selectedEmployees);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedEmployees(newSelected);
  };

  const toggleAll = () => {
    if (selectedEmployees.size === filteredEmployees.length) {
      setSelectedEmployees(new Set());
    } else {
      setSelectedEmployees(new Set(filteredEmployees.map(e => e.user_id)));
    }
  };

  // Filter employees
  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = emp.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         emp.user_email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || emp.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
          <DollarSign className="w-8 h-8 text-green-600" />
          Quản Lý Lương
        </h1>
        <p className="text-slate-600 mt-1">Tính lương, duyệt và chi trả lương cho nhân viên</p>
      </div>

      {/* Month/Year Selector */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Calendar className="w-5 h-5 text-slate-600" />
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                <option key={m} value={m}>Tháng {m}</option>
              ))}
            </select>
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {[2023, 2024, 2025, 2026].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={calculateAllPayrolls}
              disabled={calculating}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
            >
              <Calculator className="w-4 h-4" />
              {calculating ? 'Đang tính...' : 'Tính lương tất cả'}
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-8 h-8 opacity-80" />
              <span className="text-3xl font-bold">{summary.total_employees}</span>
            </div>
            <p className="text-blue-100 text-sm">Tổng nhân viên</p>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="w-8 h-8 opacity-80" />
              <span className="text-2xl font-bold">{formatCurrency(summary.total_net_salary)}</span>
            </div>
            <p className="text-green-100 text-sm">Tổng chi trả</p>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-8 h-8 opacity-80" />
              <span className="text-2xl font-bold">{formatCurrency(summary.total_commission + summary.total_kpi_bonus)}</span>
            </div>
            <p className="text-purple-100 text-sm">Tổng thưởng</p>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <FileText className="w-8 h-8 opacity-80" />
              <div className="text-right">
                <div className="text-sm text-orange-100">Đã duyệt: {summary.approved_count}</div>
                <div className="text-sm text-orange-100">Đã trả: {summary.paid_count}</div>
              </div>
            </div>
            <p className="text-orange-100 text-sm">Trạng thái</p>
          </div>
        </div>
      )}

      {/* Actions & Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Search */}
          <div className="flex-1 min-w-[300px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm kiếm nhân viên..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-slate-600" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="not_calculated">Chưa tính</option>
              <option value="draft">Nháp</option>
              <option value="pending">Chờ duyệt</option>
              <option value="approved">Đã duyệt</option>
              <option value="paid">Đã chi trả</option>
            </select>
          </div>

          {/* Bulk Actions */}
          {selectedEmployees.size > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-600">Đã chọn: {selectedEmployees.size}</span>
              <button
                onClick={approveSelected}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <Check className="w-4 h-4" />
                Duyệt
              </button>
              <button
                onClick={markPaidSelected}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <DollarSign className="w-4 h-4" />
                Đã chi trả
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Employee List */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200">
        {/* Table Header */}
        <div className="bg-slate-50 border-b border-slate-200 p-4">
          <div className="grid grid-cols-12 gap-4 items-center font-semibold text-sm text-slate-700">
            <div className="col-span-1">
              <input
                type="checkbox"
                checked={selectedEmployees.size === filteredEmployees.length && filteredEmployees.length > 0}
                onChange={toggleAll}
                className="w-4 h-4 rounded border-slate-300"
              />
            </div>
            <div className="col-span-3">Nhân viên</div>
            <div className="col-span-2">Chức vụ</div>
            <div className="col-span-1 text-center">Ngày công</div>
            <div className="col-span-1 text-center">KPI</div>
            <div className="col-span-2 text-right">Lương thực lĩnh</div>
            <div className="col-span-2 text-center">Trạng thái & Actions</div>
          </div>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-slate-200">
          {filteredEmployees.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              Không có nhân viên nào
            </div>
          ) : (
            filteredEmployees.map((emp) => (
              <div key={emp.user_id} className="p-4 hover:bg-slate-50 transition-colors">
                <div className="grid grid-cols-12 gap-4 items-center">
                  <div className="col-span-1">
                    <input
                      type="checkbox"
                      checked={selectedEmployees.has(emp.user_id)}
                      onChange={() => toggleEmployee(emp.user_id)}
                      className="w-4 h-4 rounded border-slate-300"
                    />
                  </div>

                  <div className="col-span-3">
                    <p className="font-medium text-slate-900">{emp.user_name}</p>
                    <p className="text-sm text-slate-500">{emp.user_email}</p>
                  </div>

                  <div className="col-span-2 text-slate-700">{emp.role_name}</div>

                  <div className="col-span-1 text-center">
                    <span className="font-medium">{emp.working_days}</span>
                    <span className="text-sm text-slate-500"> ngày</span>
                  </div>

                  <div className="col-span-1 text-center">
                    <span className="font-medium text-blue-600">{Number(emp.kpi_score).toFixed(1)}</span>
                    <span className="text-sm text-slate-500">/100</span>
                  </div>

                  <div className="col-span-2 text-right font-semibold text-slate-900">
                    {formatCurrency(emp.net_salary)}
                  </div>

                  <div className="col-span-2 flex items-center justify-center gap-2">
                    {getStatusBadge(emp.status)}
                    {emp.payroll_id && (
                      <button
                        onClick={() => window.open(`/dashboard/payroll/${emp.payroll_id}`, '_blank')}
                        className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
                        title="Xem chi tiết"
                      >
                        <Eye className="w-4 h-4 text-slate-600" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
