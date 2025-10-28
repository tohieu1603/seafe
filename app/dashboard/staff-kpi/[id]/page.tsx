'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { ArrowLeft, Calendar, DollarSign, TrendingUp, Clock, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';

interface StaffDetail {
  user_id: string;
  user_email: string;
  user_name: string;
  user_type: string;
  today_revenue: number;
  today_paid: number;
  week_revenue: number;
  month_revenue: number;
  service_efficiency: number;
  total_orders: number;
  completed_orders: number;
  cancelled_orders: number;
}

interface CalendarDay {
  date: string;
  attendance_type: 'full' | 'half' | 'off';
  check_in_time?: string | null;
  check_out_time?: string | null;
  working_hours: number;
  has_orders: boolean;
  orders_count: number;
}

export default function StaffKPIDetailPage() {
  const params = useParams();
  const userId = params.id as string;

  const [staff, setStaff] = useState<StaffDetail | null>(null);
  const [calendarData, setCalendarData] = useState<CalendarDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);

  useEffect(() => {
    loadData();
  }, [userId, selectedYear, selectedMonth]);

  const loadData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');

      // Fetch staff KPI details
      const staffResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/staff/${userId}/kpi-detail`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
        },
      });

      if (staffResponse.ok) {
        const staffData = await staffResponse.json();
        setStaff(staffData);
      }

      // Fetch calendar data
      const calendarResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/users/attendance/calendar/${userId}?year=${selectedYear}&month=${selectedMonth}`,
        {
          headers: {
            'Authorization': token ? `Bearer ${token}` : '',
          },
        }
      );

      if (calendarResponse.ok) {
        const calendarDataResult = await calendarResponse.json();
        setCalendarData(calendarDataResult);
      } else {
        setCalendarData([]);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN').format(amount) + 'đ';
  };

  const calculateAttendanceStats = () => {
    const stats = {
      full: calendarData.filter(d => d.attendance_type === 'full').length,
      half: calendarData.filter(d => d.attendance_type === 'half').length,
      off: calendarData.filter(d => d.attendance_type === 'off').length,
      totalOrders: calendarData.reduce((sum, d) => sum + d.orders_count, 0),
      totalHours: calendarData.reduce((sum, d) => sum + d.working_hours, 0),
    };
    return stats;
  };

  // Generate calendar grid
  const getCalendarGrid = () => {
    if (calendarData.length === 0) return [];

    const firstDate = new Date(calendarData[0].date);
    const startDayOfWeek = firstDate.getDay(); // 0 = Sunday

    // Add empty slots before the first day
    const grid: (CalendarDay | null)[] = [];
    for (let i = 0; i < startDayOfWeek; i++) {
      grid.push(null);
    }

    // Add all calendar days
    grid.push(...calendarData);

    return grid;
  };

  const getDayCellStyle = (day: CalendarDay | null) => {
    if (!day) return 'bg-transparent border-transparent';

    // Base style
    let style = 'border-2 ';

    switch (day.attendance_type) {
      case 'full':
        style += 'bg-green-50 border-green-200';
        break;
      case 'half':
        style += 'bg-yellow-50 border-yellow-200';
        break;
      case 'off':
        style += 'bg-gray-50 border-gray-200';
        break;
      default:
        style += 'bg-gray-50 border-gray-200';
    }

    return style;
  };

  const getStatusIcon = (attendanceType: string) => {
    switch (attendanceType) {
      case 'full':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'half':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'off':
        return <XCircle className="w-4 h-4 text-gray-400" />;
      default:
        return null;
    }
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const [year, month] = e.target.value.split('-').map(Number);
    setSelectedYear(year);
    setSelectedMonth(month);
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

  if (!staff) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-slate-600">Không tìm thấy thông tin nhân viên</p>
          <Link href="/dashboard/staff-kpi" className="mt-4 inline-block text-blue-600 hover:underline">
            ← Quay lại danh sách
          </Link>
        </div>
      </div>
    );
  }

  const attendanceStats = calculateAttendanceStats();
  const calendarGrid = getCalendarGrid();
  const weekDays = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  const currentMonthStr = `${selectedYear}-${selectedMonth.toString().padStart(2, '0')}`;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/dashboard/staff-kpi"
          className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-800 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lại danh sách KPI
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">{staff.user_name}</h1>
            <p className="text-slate-600 mt-1">{staff.user_email}</p>
          </div>
          <div className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg font-medium">
            {staff.user_type === 'admin' ? '👑 Admin' :
             staff.user_type === 'manager' ? '👔 Manager' :
             staff.user_type === 'staff' ? '💼 Staff' :
             staff.user_type === 'accountant' ? '📊 Accountant' : '👤 User'}
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-md p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Doanh thu hôm nay</p>
              <p className="text-2xl font-bold mt-1">{formatCurrency(staff.today_revenue)}</p>
              <p className="text-xs text-green-100 mt-1">Đã nhận: {formatCurrency(staff.today_paid)}</p>
            </div>
            <DollarSign className="w-12 h-12 opacity-80" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-md p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Doanh thu tuần</p>
              <p className="text-2xl font-bold mt-1">{formatCurrency(staff.week_revenue)}</p>
            </div>
            <Calendar className="w-12 h-12 opacity-80" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg shadow-md p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm">Doanh thu tháng</p>
              <p className="text-2xl font-bold mt-1">{formatCurrency(staff.month_revenue)}</p>
            </div>
            <TrendingUp className="w-12 h-12 opacity-80" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-md p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Hiệu suất</p>
              <p className="text-3xl font-bold mt-1">{staff.service_efficiency.toFixed(1)}%</p>
            </div>
            <TrendingUp className="w-12 h-12 opacity-80" />
          </div>
        </div>
      </div>

      {/* Orders Stats */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 mb-6">
        <h2 className="text-xl font-bold text-slate-800 mb-4">Thống kê đơn hàng</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-slate-50 rounded-lg">
            <p className="text-3xl font-bold text-slate-800">{staff.total_orders || 0}</p>
            <p className="text-sm text-slate-600 mt-1">Tổng đơn hàng</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-3xl font-bold text-green-600">{staff.completed_orders || 0}</p>
            <p className="text-sm text-slate-600 mt-1">Hoàn thành</p>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <p className="text-3xl font-bold text-red-600">{staff.cancelled_orders || 0}</p>
            <p className="text-sm text-slate-600 mt-1">Đã hủy</p>
          </div>
        </div>
      </div>

      {/* Attendance Calendar Section */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Calendar className="w-6 h-6" />
            Lịch làm việc
          </h2>
          <input
            type="month"
            value={currentMonthStr}
            onChange={handleMonthChange}
            className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Attendance Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="text-center p-4 bg-green-50 rounded-lg border-2 border-green-200">
            <p className="text-2xl font-bold text-green-600">{attendanceStats.full}</p>
            <p className="text-xs text-slate-600 mt-1">Làm cả ngày</p>
          </div>
          <div className="text-center p-4 bg-yellow-50 rounded-lg border-2 border-yellow-200">
            <p className="text-2xl font-bold text-yellow-600">{attendanceStats.half}</p>
            <p className="text-xs text-slate-600 mt-1">Nửa ngày</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg border-2 border-gray-200">
            <p className="text-2xl font-bold text-gray-600">{attendanceStats.off}</p>
            <p className="text-xs text-slate-600 mt-1">Nghỉ</p>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
            <p className="text-2xl font-bold text-blue-600">{attendanceStats.totalOrders}</p>
            <p className="text-xs text-slate-600 mt-1">Tổng đơn</p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg border-2 border-purple-200">
            <p className="text-2xl font-bold text-purple-600">{attendanceStats.totalHours.toFixed(1)}h</p>
            <p className="text-xs text-slate-600 mt-1">Tổng giờ</p>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="bg-slate-50 rounded-lg p-4">
          {/* Week day headers */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {weekDays.map((day) => (
              <div key={day} className="text-center font-bold text-slate-600 text-sm py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar days */}
          <div className="grid grid-cols-7 gap-2">
            {calendarGrid.map((day, index) => {
              if (!day) {
                return <div key={`empty-${index}`} className="min-h-[100px]"></div>;
              }

              const dayDate = new Date(day.date);
              const dayNum = dayDate.getDate();
              const isToday = day.date === new Date().toISOString().split('T')[0];

              return (
                <div
                  key={day.date}
                  className={`
                    min-h-[100px] p-3 rounded-lg transition-all
                    ${getDayCellStyle(day)}
                    ${isToday ? 'ring-2 ring-blue-500 ring-offset-2' : ''}
                  `}
                >
                  <div className="flex flex-col h-full">
                    {/* Day number */}
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-lg font-semibold ${isToday ? 'text-blue-600' : 'text-slate-700'}`}>
                        {dayNum}
                      </span>
                      {getStatusIcon(day.attendance_type)}
                    </div>

                    {/* Orders and hours info */}
                    <div className="flex-1 flex flex-col gap-1 text-sm">
                      {day.orders_count > 0 && (
                        <div className="flex items-center gap-1">
                          <span className="text-green-600 font-medium">
                            {day.orders_count} đơn
                          </span>
                        </div>
                      )}

                      {day.working_hours > 0 && (
                        <div className="flex items-center gap-1">
                          <span className="text-orange-600 font-medium">
                            {day.working_hours}h
                          </span>
                        </div>
                      )}

                      {day.check_in_time && day.check_out_time && (
                        <div className="text-xs text-slate-500 mt-1">
                          {day.check_in_time.slice(0, 5)} - {day.check_out_time.slice(0, 5)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="mt-4 flex items-center justify-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-green-50 border-2 border-green-200"></div>
            <span>Làm cả ngày</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-yellow-50 border-2 border-yellow-200"></div>
            <span>Nửa ngày</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-gray-50 border-2 border-gray-200"></div>
            <span>Nghỉ</span>
          </div>
        </div>
      </div>
    </div>
  );
}
