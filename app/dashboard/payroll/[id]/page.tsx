'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, DollarSign, Calendar, User, TrendingUp, FileText,
  CheckCircle, Clock, Download
} from 'lucide-react';

interface PayrollDetail {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  user_role: string;
  year: number;
  month: number;
  base_salary: number;
  working_days: number;
  standard_working_days: number;
  actual_base_salary: number;
  total_allowances: number;
  attendance_allowance: number;
  transportation_allowance: number;
  meal_allowance: number;
  phone_allowance: number;
  total_bonuses: number;
  sales_commission: number;
  sales_revenue: number;
  kpi_score: number;
  kpi_bonus: number;
  other_bonus: number;
  gross_salary: number;
  total_insurance: number;
  social_insurance: number;
  health_insurance: number;
  unemployment_insurance: number;
  taxable_income: number;
  personal_income_tax: number;
  personal_deduction: number;
  dependent_deduction: number;
  total_deductions: number;
  advance_payment: number;
  penalty: number;
  other_deduction: number;
  net_salary: number;
  status: string;
  notes: string;
  created_at: string;
  approved_at: string | null;
  paid_at: string | null;
}

export default function PayrollDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [payroll, setPayroll] = useState<PayrollDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPayroll();
  }, [params.id]);

  const loadPayroll = async () => {
    try {
      const response = await fetch(`http://localhost:8003/api/payroll/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setPayroll(data);
      }
    } catch (error) {
      console.error('Failed to load payroll:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN').format(amount) + 'đ';
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleString('vi-VN');
  };

  const getStatusConfig = (status: string) => {
    const configs: any = {
      'draft': { label: 'Nháp', color: 'bg-gray-100 text-gray-800', icon: Clock },
      'pending': { label: 'Chờ duyệt', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      'approved': { label: 'Đã duyệt', color: 'bg-green-100 text-green-800', icon: CheckCircle },
      'paid': { label: 'Đã chi trả', color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
    };
    return configs[status] || configs['draft'];
  };

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

  if (!payroll) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-slate-600">Không tìm thấy bảng lương</p>
        </div>
      </div>
    );
  }

  const statusConfig = getStatusConfig(payroll.status);
  const StatusIcon = statusConfig.icon;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Chi Tiết Bảng Lương</h1>
            <p className="text-slate-600 mt-1">
              Tháng {payroll.month}/{payroll.year} - {payroll.user_name}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium ${statusConfig.color}`}>
            <StatusIcon className="w-4 h-4" />
            {statusConfig.label}
          </span>
        </div>
      </div>

      {/* Employee Info */}
      <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg p-6 text-white mb-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <User className="w-6 h-6" />
              <h2 className="text-2xl font-bold">{payroll.user_name}</h2>
            </div>
            <p className="text-indigo-100 mb-1">{payroll.user_email}</p>
            <p className="text-indigo-100">{payroll.user_role}</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-indigo-200 mb-1">Lương thực lĩnh</div>
            <div className="text-3xl font-bold">{formatCurrency(payroll.net_salary)}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT COLUMN */}
        <div className="space-y-6">
          {/* Basic Info */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              Thông tin cơ bản
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-600">Lương cơ bản:</span>
                <span className="font-semibold">{formatCurrency(payroll.base_salary)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Ngày công:</span>
                <span className="font-semibold">{payroll.working_days}/{payroll.standard_working_days} ngày</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Lương theo ngày công:</span>
                <span className="font-semibold">{formatCurrency(payroll.actual_base_salary)}</span>
              </div>
            </div>
          </div>

          {/* Allowances */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">
              Phụ cấp
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-600">PC Chuyên cần:</span>
                <span className="font-semibold">{formatCurrency(payroll.attendance_allowance)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">PC Xăng xe:</span>
                <span className="font-semibold">{formatCurrency(payroll.transportation_allowance)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">PC Ăn trưa:</span>
                <span className="font-semibold">{formatCurrency(payroll.meal_allowance)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">PC Điện thoại:</span>
                <span className="font-semibold">{formatCurrency(payroll.phone_allowance)}</span>
              </div>
              <div className="pt-3 border-t border-slate-200 flex justify-between">
                <span className="font-semibold text-slate-800">Tổng phụ cấp:</span>
                <span className="font-bold text-green-600">{formatCurrency(payroll.total_allowances)}</span>
              </div>
            </div>
          </div>

          {/* Bonuses */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              Thưởng
            </h3>
            <div className="space-y-3">
              {payroll.sales_revenue > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-600">Doanh số:</span>
                  <span className="font-semibold">{formatCurrency(payroll.sales_revenue)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-600">Hoa hồng:</span>
                <span className="font-semibold">{formatCurrency(payroll.sales_commission)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">KPI ({Number(payroll.kpi_score).toFixed(1)}/100):</span>
                <span className="font-semibold">{formatCurrency(payroll.kpi_bonus)}</span>
              </div>
              {payroll.other_bonus > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-600">Thưởng khác:</span>
                  <span className="font-semibold">{formatCurrency(payroll.other_bonus)}</span>
                </div>
              )}
              <div className="pt-3 border-t border-slate-200 flex justify-between">
                <span className="font-semibold text-slate-800">Tổng thưởng:</span>
                <span className="font-bold text-green-600">{formatCurrency(payroll.total_bonuses)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-6">
          {/* Gross Salary */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200 p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-2">Tổng thu nhập</h3>
            <div className="text-3xl font-bold text-green-600">{formatCurrency(payroll.gross_salary)}</div>
            <p className="text-sm text-slate-600 mt-1">
              = Lương thực tế + Phụ cấp + Thưởng
            </p>
          </div>

          {/* Insurance */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">
              Bảo hiểm
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-600">BHXH (8%):</span>
                <span className="font-semibold text-red-600">-{formatCurrency(payroll.social_insurance)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">BHYT (1.5%):</span>
                <span className="font-semibold text-red-600">-{formatCurrency(payroll.health_insurance)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">BHTN (1%):</span>
                <span className="font-semibold text-red-600">-{formatCurrency(payroll.unemployment_insurance)}</span>
              </div>
              <div className="pt-3 border-t border-slate-200 flex justify-between">
                <span className="font-semibold text-slate-800">Tổng BH:</span>
                <span className="font-bold text-red-600">-{formatCurrency(payroll.total_insurance)}</span>
              </div>
            </div>
          </div>

          {/* Tax */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">
              Thuế TNCN
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-600">Thu nhập tính thuế:</span>
                <span className="font-semibold">{formatCurrency(payroll.taxable_income)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Giảm trừ bản thân:</span>
                <span className="font-semibold text-green-600">-{formatCurrency(payroll.personal_deduction)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Giảm trừ người phụ thuộc:</span>
                <span className="font-semibold text-green-600">-{formatCurrency(payroll.dependent_deduction)}</span>
              </div>
              <div className="pt-3 border-t border-slate-200 flex justify-between">
                <span className="font-semibold text-slate-800">Thuế phải nộp:</span>
                <span className="font-bold text-red-600">-{formatCurrency(payroll.personal_income_tax)}</span>
              </div>
            </div>
          </div>

          {/* Other Deductions */}
          {(payroll.advance_payment > 0 || payroll.penalty > 0 || payroll.other_deduction > 0) && (
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">
                Khấu trừ khác
              </h3>
              <div className="space-y-3">
                {payroll.advance_payment > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-600">Tạm ứng:</span>
                    <span className="font-semibold text-red-600">-{formatCurrency(payroll.advance_payment)}</span>
                  </div>
                )}
                {payroll.penalty > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-600">Phạt:</span>
                    <span className="font-semibold text-red-600">-{formatCurrency(payroll.penalty)}</span>
                  </div>
                )}
                {payroll.other_deduction > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-600">Khấu trừ khác:</span>
                    <span className="font-semibold text-red-600">-{formatCurrency(payroll.other_deduction)}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Net Salary */}
      <div className="mt-6 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold mb-1">Lương Thực Lĩnh</h3>
            <p className="text-blue-100 text-sm">
              = Thu nhập - Bảo hiểm - Thuế - Khấu trừ
            </p>
          </div>
          <div className="text-4xl font-bold">{formatCurrency(payroll.net_salary)}</div>
        </div>
      </div>

      {/* Notes & Timeline */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {payroll.notes && (
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-slate-600" />
              Ghi chú
            </h3>
            <p className="text-slate-700">{payroll.notes}</p>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Lịch sử</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-slate-600">Ngày tạo:</span>
              <span className="font-medium">{formatDate(payroll.created_at)}</span>
            </div>
            {payroll.approved_at && (
              <div className="flex justify-between">
                <span className="text-slate-600">Ngày duyệt:</span>
                <span className="font-medium">{formatDate(payroll.approved_at)}</span>
              </div>
            )}
            {payroll.paid_at && (
              <div className="flex justify-between">
                <span className="text-slate-600">Ngày chi trả:</span>
                <span className="font-medium">{formatDate(payroll.paid_at)}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
