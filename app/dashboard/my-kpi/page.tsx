'use client';

import { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronDown, ChevronRight, Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8003';

interface OrderDetail {
  id: string;
  order_code: string;
  customer_name: string;
  customer_phone: string;
  total_amount: number;
  paid_amount: number;
  payment_status: string;
  created_at: string;
}

interface DailyStats {
  date: string;
  total_orders: number;
  total_revenue: number;
  total_paid: number;
  total_unpaid: number;
  orders: OrderDetail[];
  attendance_type: string;
  check_in_time: string | null;
  check_out_time: string | null;
  working_hours: number;
}

interface MonthlyData {
  year: number;
  month: number;
  month_start: string;
  month_end: string;
  days: DailyStats[];
  total_orders: number;
  total_revenue: number;
  total_paid: number;
  total_unpaid: number;
  full_days: number;
  half_days: number;
  off_days: number;
  total_working_days: number;
}

interface KPISummary {
  today_revenue: number;
  today_paid: number;
  week_revenue: number;
  month_revenue: number;
  service_efficiency: number;
}

interface AttendanceDay {
  date: string;
  attendance_type: string;
  check_in_time: string | null;
  check_out_time: string | null;
  working_hours: number;
  has_orders: boolean;
  orders_count: number;
}

export default function StaffKPIPage() {
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [summary, setSummary] = useState<KPISummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());
  const [userProfile, setUserProfile] = useState<any>(null);
  const [selectedMonth, setSelectedMonth] = useState<{ year: number; month: number } | null>(null);
  const [calendarData, setCalendarData] = useState<AttendanceDay[]>([]);
  const [showCalendar, setShowCalendar] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Get user profile
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        setUserProfile(user);

        // Load monthly stats for this user
        const monthlyResponse = await fetch(`${API_URL}/api/users/staff/monthly-details/${user.id}?months=6`);
        if (monthlyResponse.ok) {
          const data = await monthlyResponse.json();
          setMonthlyData(data);
        }

        // Load summary
        const summaryResponse = await fetch(`${API_URL}/api/users/staff/kpi-summary?user_id=${user.id}`);
        if (summaryResponse.ok) {
          const data = await summaryResponse.json();
          setSummary(data);
        }
      }
    } catch (error) {
      console.error('Failed to load KPI data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCalendar = async (year: number, month: number) => {
    if (!userProfile) return;

    try {
      const response = await fetch(`${API_URL}/api/users/attendance/calendar/${userProfile.id}?year=${year}&month=${month}`);
      if (response.ok) {
        const data = await response.json();
        setCalendarData(data);
        setSelectedMonth({ year, month });
        setShowCalendar(true);
      }
    } catch (error) {
      console.error('Failed to load calendar:', error);
    }
  };

  const toggleDay = (dateKey: string) => {
    const newExpanded = new Set(expandedDays);
    if (newExpanded.has(dateKey)) {
      newExpanded.delete(dateKey);
    } else {
      newExpanded.add(dateKey);
    }
    setExpandedDays(newExpanded);
  };

  const toggleMonth = (monthKey: string) => {
    const newExpanded = new Set(expandedMonths);
    if (newExpanded.has(monthKey)) {
      newExpanded.delete(monthKey);
    } else {
      newExpanded.add(monthKey);
    }
    setExpandedMonths(newExpanded);
  };

  const handleExportExcel = async () => {
    if (!selectedMonth || !userProfile) return;

    try {
      const response = await fetch(
        `${API_URL}/api/users/my-attendance/export-excel?year=${selectedMonth.year}&month=${selectedMonth.month}`
      );

      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cham_cong_${userProfile.full_name.replace(' ', '_')}_${selectedMonth.month}_${selectedMonth.year}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export error:', error);
      alert('❌ Lỗi khi xuất file Excel');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN').format(amount) + 'đ';
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()} - ${days[date.getDay()]}`;
  };

  const formatTime = (timeStr: string) => {
    if (!timeStr) return '';
    const time = new Date(`2000-01-01T${timeStr}`);
    return time.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  };

  const getPaymentStatusBadge = (status: string) => {
    const statusMap: { [key: string]: { label: string; className: string } } = {
      'paid': { label: 'Đã thanh toán', className: 'bg-green-100 text-green-800' },
      'pending': { label: 'Chờ xác minh', className: 'bg-yellow-100 text-yellow-800' },
      'unpaid': { label: 'Chưa thanh toán', className: 'bg-red-100 text-red-800' },
    };
    const config = statusMap[status] || statusMap['pending'];
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.className}`}>
        {config.label}
      </span>
    );
  };

  const getAttendanceIcon = (type: string) => {
    switch (type) {
      case 'full':
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case 'half':
        return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      case 'off':
        return <XCircle className="w-4 h-4 text-gray-400" />;
      default:
        return <XCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getAttendanceLabel = (type: string) => {
    switch (type) {
      case 'full':
        return 'Làm cả ngày';
      case 'half':
        return 'Làm nửa ngày';
      case 'off':
        return 'Nghỉ';
      default:
        return 'Nghỉ';
    }
  };

  const getAttendanceBadgeClass = (type: string) => {
    switch (type) {
      case 'full':
        return 'bg-green-100 text-green-800';
      case 'half':
        return 'bg-yellow-100 text-yellow-800';
      case 'off':
        return 'bg-gray-100 text-gray-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  // Calendar grid helper
  const renderCalendarGrid = () => {
    if (!selectedMonth || calendarData.length === 0) return null;

    const { year, month } = selectedMonth;
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    const startWeekday = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    // Create calendar grid
    const weeks = [];
    let currentWeek = [];

    // Fill empty days before month starts
    for (let i = 0; i < startWeekday; i++) {
      currentWeek.push(null);
    }

    // Fill days of month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayData = calendarData.find(d => d.date === dateStr);

      currentWeek.push({ day, data: dayData });

      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }

    // Fill remaining days
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push(null);
      }
      weeks.push(currentWeek);
    }

    return (
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
        <div className="mb-4 flex justify-between items-center">
          <h3 className="text-lg font-semibold">Lịch chấm công - Tháng {month}/{year}</h3>
          <div className="flex gap-2">
            <button
              onClick={handleExportExcel}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium"
            >
              Xuất Excel
            </button>
            <button
              onClick={() => setShowCalendar(false)}
              className="text-sm text-slate-600 hover:text-slate-800"
            >
              Đóng
            </button>
          </div>
        </div>

        {/* Calendar header */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map(day => (
            <div key={day} className="text-center font-semibold text-sm text-slate-600 py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="space-y-2">
          {weeks.map((week, weekIdx) => (
            <div key={weekIdx} className="grid grid-cols-7 gap-2">
              {week.map((cell, cellIdx) => {
                if (!cell) {
                  return <div key={cellIdx} className="aspect-square"></div>;
                }

                const { day, data } = cell;
                const isToday = data && new Date(data.date).toDateString() === new Date().toDateString();

                return (
                  <div
                    key={cellIdx}
                    className={`aspect-square border rounded-lg p-2 ${
                      isToday ? 'border-blue-500 bg-blue-50' : 'border-slate-200'
                    } ${data?.has_orders ? 'bg-green-50' : ''}`}
                  >
                    <div className="text-sm font-medium text-slate-700">{day}</div>
                    {data && (
                      <div className="mt-1 flex flex-col items-center gap-1">
                        {getAttendanceIcon(data.attendance_type)}
                        {data.has_orders && (
                          <div className="text-xs text-green-600 font-medium">
                            {data.orders_count} đơn
                          </div>
                        )}
                        {data.working_hours > 0 && (
                          <div className="text-xs text-slate-500">
                            {data.working_hours}h
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="mt-4 pt-4 border-t border-slate-200 flex gap-4 text-sm">
          <div className="flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <span>Làm cả ngày</span>
          </div>
          <div className="flex items-center gap-1">
            <AlertCircle className="w-4 h-4 text-yellow-600" />
            <span>Làm nửa ngày</span>
          </div>
          <div className="flex items-center gap-1">
            <XCircle className="w-4 h-4 text-gray-400" />
            <span>Nghỉ</span>
          </div>
        </div>
      </div>
    );
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
        <h1 className="text-3xl font-bold text-slate-800">KPI của tôi</h1>
        {userProfile && (
          <p className="text-slate-600 mt-1">
            {userProfile.first_name} {userProfile.last_name} - {userProfile.email}
          </p>
        )}
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-md p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Hiệu suất dịch vụ</p>
                <p className="text-3xl font-bold mt-1">{summary.service_efficiency.toFixed(1)}%</p>
              </div>
              <CalendarIcon className="w-12 h-12 opacity-80" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-md p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Doanh thu hôm nay</p>
                <p className="text-2xl font-bold mt-1">{formatCurrency(summary.today_revenue)}</p>
              </div>
              <CalendarIcon className="w-12 h-12 opacity-80" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-md p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">Doanh thu tuần này</p>
                <p className="text-2xl font-bold mt-1">{formatCurrency(summary.week_revenue)}</p>
              </div>
              <CalendarIcon className="w-12 h-12 opacity-80" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg shadow-md p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm">Doanh thu tháng này</p>
                <p className="text-2xl font-bold mt-1">{formatCurrency(summary.month_revenue)}</p>
              </div>
              <CalendarIcon className="w-12 h-12 opacity-80" />
            </div>
          </div>
        </div>
      )}

      {/* Calendar view */}
      {showCalendar && renderCalendarGrid()}

      {/* Monthly breakdown */}
      <div className="space-y-4 mt-6">
        <h2 className="text-xl font-semibold text-slate-800">Chi tiết theo tháng</h2>

        {monthlyData.map((monthData) => {
          const monthKey = `${monthData.year}-${monthData.month}`;
          const isExpanded = expandedMonths.has(monthKey);

          return (
            <div key={monthKey} className="bg-white rounded-lg shadow-sm border border-slate-200">
              {/* Month header */}
              <div
                className="p-4 bg-slate-50 border-b border-slate-200 cursor-pointer hover:bg-slate-100"
                onClick={() => toggleMonth(monthKey)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {isExpanded ? (
                      <ChevronDown className="w-5 h-5 text-slate-600" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-slate-600" />
                    )}
                    <h3 className="text-lg font-semibold text-slate-800">
                      Tháng {monthData.month}/{monthData.year}
                    </h3>
                  </div>

                  <div className="flex items-center gap-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        loadCalendar(monthData.year, monthData.month);
                      }}
                      className="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 text-sm"
                    >
                      <CalendarIcon className="w-4 h-4" />
                      Xem lịch
                    </button>

                    <div className="flex items-center gap-6 text-sm">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        <span className="text-slate-600">
                          {monthData.full_days} ngày
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-yellow-600" />
                        <span className="text-slate-600">
                          {monthData.half_days} nửa ngày
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <XCircle className="w-4 h-4 text-gray-400" />
                        <span className="text-slate-600">
                          {monthData.off_days} ngày nghỉ
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-sm text-slate-600">{monthData.total_orders} đơn hàng</p>
                      <p className="font-semibold text-slate-800">{formatCurrency(monthData.total_revenue)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Expanded month details */}
              {isExpanded && (
                <div className="p-4">
                  <div className="space-y-2">
                    {monthData.days.filter(day => day.total_orders > 0 || day.attendance_type !== 'off').map((day) => {
                      const dateKey = day.date;
                      const isDayExpanded = expandedDays.has(dateKey);
                      const hasOrders = day.orders.length > 0;

                      return (
                        <div
                          key={dateKey}
                          className="border border-slate-200 rounded-lg overflow-hidden"
                        >
                          {/* Day header */}
                          <div
                            className={`p-3 flex items-center justify-between cursor-pointer hover:bg-slate-50 ${
                              hasOrders ? 'bg-white' : 'bg-slate-50'
                            }`}
                            onClick={() => toggleDay(dateKey)}
                          >
                            <div className="flex items-center gap-3">
                              {hasOrders ? (
                                isDayExpanded ? (
                                  <ChevronDown className="w-4 h-4 text-slate-600" />
                                ) : (
                                  <ChevronRight className="w-4 h-4 text-slate-600" />
                                )
                              ) : (
                                <div className="w-4 h-4"></div>
                              )}

                              <div className="flex items-center gap-2">
                                {getAttendanceIcon(day.attendance_type)}
                                <span className="font-medium text-slate-700">{formatDate(day.date)}</span>
                              </div>

                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getAttendanceBadgeClass(day.attendance_type)}`}>
                                {getAttendanceLabel(day.attendance_type)}
                              </span>

                              {day.check_in_time && day.check_out_time && (
                                <span className="text-sm text-slate-600">
                                  {formatTime(day.check_in_time)} - {formatTime(day.check_out_time)} ({day.working_hours}h)
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-6">
                              <div className="text-sm">
                                <span className="text-slate-600">Nhận: </span>
                                <span className="font-semibold text-green-600">{formatCurrency(day.total_paid)}</span>
                              </div>
                              <div className="text-sm">
                                <span className="text-slate-600">Trả: </span>
                                <span className="font-semibold text-slate-800">0đ</span>
                              </div>
                              <div className="text-sm">
                                <span className="text-slate-600">Phải nộp: </span>
                                <span className="font-semibold text-blue-600">{formatCurrency(day.total_revenue)}</span>
                              </div>
                            </div>
                          </div>

                          {/* Expanded day orders */}
                          {isDayExpanded && hasOrders && (
                            <div className="px-4 pb-4 bg-slate-50">
                              <div className="space-y-2">
                                {day.orders.map((order) => (
                                  <div key={order.id} className="bg-white rounded-lg p-3 border border-slate-200">
                                    <div className="flex items-start justify-between">
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                          <span className="font-semibold text-slate-800">{order.order_code}</span>
                                          {getPaymentStatusBadge(order.payment_status)}
                                        </div>
                                        <div className="text-sm text-slate-600 space-y-1">
                                          <div>KH: {order.customer_name}</div>
                                          <div>SĐT: {order.customer_phone}</div>
                                          <div className="flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {new Date(order.created_at).toLocaleTimeString('vi-VN', {
                                              hour: '2-digit',
                                              minute: '2-digit',
                                            })}
                                          </div>
                                        </div>
                                      </div>
                                      <div className="text-right">
                                        <div className="font-semibold text-slate-800">{formatCurrency(order.total_amount)}</div>
                                        {order.paid_amount < order.total_amount && (
                                          <div className="text-sm text-red-600">
                                            Còn nợ: {formatCurrency(order.total_amount - order.paid_amount)}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
