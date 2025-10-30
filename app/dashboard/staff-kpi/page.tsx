'use client';

import { useState, useEffect } from 'react';
import { Search, TrendingUp, TrendingDown, Calendar as CalendarIcon, DollarSign, Users, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface StaffKPI {
  user_id: string;
  user_email: string;
  user_name: string;
  today_revenue: number;
  today_paid: number;
  week_revenue: number;
  month_revenue: number;
  service_efficiency: number;
  selected_year?: number;
  selected_month?: number;
}

export default function StaffKPIPage() {
  const [staffKPIs, setStaffKPIs] = useState<StaffKPI[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'month_revenue' | 'efficiency'>('month_revenue');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);

  useEffect(() => {
    loadData();
  }, [selectedYear, selectedMonth]);

  const loadData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');

      // Fetch all staff KPIs with year/month filter
      const params = new URLSearchParams({
        year: selectedYear.toString(),
        month: selectedMonth.toString(),
      });

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/users/staff/all-kpi-summary?${params}`,
        {
          headers: {
            'Authorization': token ? `Bearer ${token}` : '',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setStaffKPIs(data);
      }
    } catch (error) {
      console.error('Failed to load KPI data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN').format(amount) + 'đ';
  };

  // Filter and sort staff
  const filteredStaff = staffKPIs
    .filter(staff => {
      const searchLower = searchTerm.toLowerCase();
      return (
        staff.user_name.toLowerCase().includes(searchLower) ||
        staff.user_email.toLowerCase().includes(searchLower)
      );
    })
    .sort((a, b) => {
      let compareA = 0;
      let compareB = 0;

      switch (sortBy) {
        case 'name':
          compareA = a.user_name.localeCompare(b.user_name);
          compareB = b.user_name.localeCompare(a.user_name);
          break;
        case 'month_revenue':
          compareA = a.month_revenue;
          compareB = b.month_revenue;
          break;
        case 'efficiency':
          compareA = a.service_efficiency;
          compareB = b.service_efficiency;
          break;
      }

      return sortOrder === 'desc' ? compareB - compareA : compareA - compareB;
    });

  // Calculate totals
  const totals = filteredStaff.reduce(
    (acc, staff) => ({
      today_revenue: acc.today_revenue + staff.today_revenue,
      week_revenue: acc.week_revenue + staff.week_revenue,
      month_revenue: acc.month_revenue + staff.month_revenue,
      avg_efficiency: acc.avg_efficiency + staff.service_efficiency / filteredStaff.length,
    }),
    { today_revenue: 0, week_revenue: 0, month_revenue: 0, avg_efficiency: 0 }
  );

  const toggleSort = (field: 'name' | 'month_revenue' | 'efficiency') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const handlePreviousMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  const getMonthName = (month: number) => {
    const monthNames = [
      'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
      'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
    ];
    return monthNames[month - 1];
  };

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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">KPI Nhân viên</h1>
            <p className="text-slate-600 mt-1">Tổng quan hiệu suất làm việc của toàn bộ nhân viên</p>
          </div>

          {/* Month/Year Selector */}
          <div className="flex items-center gap-3 bg-white rounded-lg shadow-sm border border-slate-200 p-2">
            <button
              onClick={handlePreviousMonth}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              title="Tháng trước"
            >
              <ChevronLeft className="w-5 h-5 text-slate-600" />
            </button>
            <div className="px-4 py-2 bg-slate-50 rounded-lg min-w-[140px] text-center">
              <span className="font-semibold text-slate-900">{getMonthName(selectedMonth)} {selectedYear}</span>
            </div>
            <button
              onClick={handleNextMonth}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              title="Tháng sau"
            >
              <ChevronRight className="w-5 h-5 text-slate-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-md p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Tổng nhân viên</p>
              <p className="text-3xl font-bold mt-1">{filteredStaff.length}</p>
            </div>
            <Users className="w-12 h-12 opacity-80" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-md p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Doanh thu hôm nay</p>
              <p className="text-2xl font-bold mt-1">{formatCurrency(totals.today_revenue)}</p>
            </div>
            <DollarSign className="w-12 h-12 opacity-80" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-md p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Doanh thu tuần này</p>
              <p className="text-2xl font-bold mt-1">{formatCurrency(totals.week_revenue)}</p>
            </div>
            <CalendarIcon className="w-12 h-12 opacity-80" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg shadow-md p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm">Doanh thu tháng này</p>
              <p className="text-2xl font-bold mt-1">{formatCurrency(totals.month_revenue)}</p>
            </div>
            <TrendingUp className="w-12 h-12 opacity-80" />
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Tìm kiếm nhân viên theo tên hoặc email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => toggleSort('name')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                sortBy === 'name'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Tên {sortBy === 'name' && (sortOrder === 'desc' ? '↓' : '↑')}
            </button>
            <button
              onClick={() => toggleSort('month_revenue')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                sortBy === 'month_revenue'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Doanh thu {sortBy === 'month_revenue' && (sortOrder === 'desc' ? '↓' : '↑')}
            </button>
            <button
              onClick={() => toggleSort('efficiency')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                sortBy === 'efficiency'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Hiệu suất {sortBy === 'efficiency' && (sortOrder === 'desc' ? '↓' : '↑')}
            </button>
          </div>
        </div>
      </div>

      {/* Staff List */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                  Nhân viên
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-600 uppercase tracking-wider">
                  Hôm nay
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-600 uppercase tracking-wider">
                  Tuần này
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-600 uppercase tracking-wider">
                  Tháng này
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-slate-600 uppercase tracking-wider">
                  Hiệu suất
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-slate-600 uppercase tracking-wider">
                  Chi tiết
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    Không tìm thấy nhân viên nào
                  </td>
                </tr>
              ) : (
                filteredStaff.map((staff) => (
                  <tr key={staff.user_id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-slate-800">{staff.user_name}</div>
                        <div className="text-sm text-slate-500">{staff.user_email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="font-medium text-slate-800">{formatCurrency(staff.today_revenue)}</div>
                      <div className="text-xs text-slate-500">Đã nhận: {formatCurrency(staff.today_paid)}</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="font-medium text-slate-800">{formatCurrency(staff.week_revenue)}</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="font-semibold text-blue-600 text-lg">
                        {formatCurrency(staff.month_revenue)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <span className={`text-lg font-semibold ${
                          staff.service_efficiency >= 80 ? 'text-green-600' :
                          staff.service_efficiency >= 60 ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          {staff.service_efficiency.toFixed(1)}%
                        </span>
                        {staff.service_efficiency >= 80 ? (
                          <TrendingUp className="w-4 h-4 text-green-600" />
                        ) : staff.service_efficiency >= 60 ? (
                          <TrendingDown className="w-4 h-4 text-yellow-600" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-red-600" />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Link
                        href={`/dashboard/staff-kpi/${staff.user_id}`}
                        className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 text-sm font-medium transition-colors"
                      >
                        Xem chi tiết
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {filteredStaff.length > 0 && (
              <tfoot className="bg-slate-50 border-t-2 border-slate-300">
                <tr className="font-semibold">
                  <td className="px-6 py-4 text-slate-800">TỔNG CỘNG</td>
                  <td className="px-6 py-4 text-right text-slate-800">
                    {formatCurrency(totals.today_revenue)}
                  </td>
                  <td className="px-6 py-4 text-right text-slate-800">
                    {formatCurrency(totals.week_revenue)}
                  </td>
                  <td className="px-6 py-4 text-right text-blue-600 text-lg">
                    {formatCurrency(totals.month_revenue)}
                  </td>
                  <td className="px-6 py-4 text-center text-slate-800">
                    {totals.avg_efficiency.toFixed(1)}%
                  </td>
                  <td className="px-6 py-4"></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}
