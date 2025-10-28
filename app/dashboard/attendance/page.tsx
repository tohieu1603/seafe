'use client';

import { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Plus, Edit, Trash2, Users, CheckCircle, XCircle, Clock, Coffee, Search } from 'lucide-react';

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
}

interface AttendanceRecord {
  id: string;
  user_id: string;
  user?: User;
  date: string;
  status: 'present' | 'absent' | 'half_day' | 'leave';
  notes?: string;
}

export default function AttendanceManagementPage() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [searchQuery, setSearchQuery] = useState('');

  // Form state
  const [formData, setFormData] = useState<{
    user_id: string;
    date: string;
    status: 'present' | 'absent' | 'half_day' | 'leave';
    notes: string;
  }>({
    user_id: '',
    date: new Date().toISOString().slice(0, 10),
    status: 'present',
    notes: '',
  });

  useEffect(() => {
    loadData();
  }, [selectedMonth]);

  const loadData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');

      // Load users (staff only)
      const usersResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users`, {
        headers: { 'Authorization': token ? `Bearer ${token}` : '' },
      });

      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        // Filter staff/admin/manager
        const staffUsers = usersData.filter((u: User) => ['staff', 'admin', 'manager'].includes((u as any).user_type));
        setUsers(staffUsers);
      }

      // Load attendance records for selected month
      const [year, month] = selectedMonth.split('-');
      const startDate = `${year}-${month}-01`;
      const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
      const endDate = `${year}-${month}-${lastDay}`;

      const recordsResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/users/attendance?start_date=${startDate}&end_date=${endDate}`,
        {
          headers: { 'Authorization': token ? `Bearer ${token}` : '' },
        }
      );

      if (recordsResponse.ok) {
        const recordsData = await recordsResponse.json();
        setRecords(recordsData);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem('access_token');
      const url = editingRecord
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/users/attendance/${editingRecord.id}`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/users/attendance`;

      const method = editingRecord ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await loadData();
        setShowModal(false);
        resetForm();
      } else {
        const error = await response.json();
        alert(error.detail || 'Có lỗi xảy ra');
      }
    } catch (error) {
      console.error('Failed to save:', error);
      alert('Có lỗi xảy ra khi lưu dữ liệu');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa bản ghi này?')) return;

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/attendance/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': token ? `Bearer ${token}` : '' },
      });

      if (response.ok) {
        await loadData();
      }
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  };

  const openEditModal = (record: AttendanceRecord) => {
    setEditingRecord(record);
    setFormData({
      user_id: record.user_id,
      date: record.date,
      status: record.status,
      notes: record.notes || '',
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setEditingRecord(null);
    setFormData({
      user_id: '',
      date: new Date().toISOString().slice(0, 10),
      status: 'present',
      notes: '',
    });
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      present: { label: 'Có mặt', color: 'bg-green-100 text-green-700', icon: CheckCircle },
      absent: { label: 'Vắng', color: 'bg-red-100 text-red-700', icon: XCircle },
      half_day: { label: 'Nửa ngày', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
      leave: { label: 'Nghỉ phép', color: 'bg-blue-100 text-blue-700', icon: Coffee },
    };
    const badge = badges[status as keyof typeof badges] || badges.present;
    const Icon = badge.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        <Icon className="w-3 h-3" />
        {badge.label}
      </span>
    );
  };

  const filteredRecords = records.filter(record => {
    const userName = record.user?.full_name || record.user?.email || '';
    return userName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const stats = {
    present: records.filter(r => r.status === 'present').length,
    absent: records.filter(r => r.status === 'absent').length,
    half_day: records.filter(r => r.status === 'half_day').length,
    leave: records.filter(r => r.status === 'leave').length,
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
        <h1 className="text-3xl font-bold text-slate-800">Quản lý chấm công</h1>
        <p className="text-slate-600 mt-1">Theo dõi ngày làm việc, nghỉ phép, và nửa ngày của nhân viên</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-md p-5 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Có mặt</p>
              <p className="text-3xl font-bold mt-1">{stats.present}</p>
            </div>
            <CheckCircle className="w-10 h-10 opacity-80" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg shadow-md p-5 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-100 text-sm">Nửa ngày</p>
              <p className="text-3xl font-bold mt-1">{stats.half_day}</p>
            </div>
            <Clock className="w-10 h-10 opacity-80" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-md p-5 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Nghỉ phép</p>
              <p className="text-3xl font-bold mt-1">{stats.leave}</p>
            </div>
            <Coffee className="w-10 h-10 opacity-80" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-lg shadow-md p-5 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-sm">Vắng</p>
              <p className="text-3xl font-bold mt-1">{stats.absent}</p>
            </div>
            <XCircle className="w-10 h-10 opacity-80" />
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex-1 w-full md:w-auto relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Tìm theo tên nhân viên..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={() => {
                resetForm();
                setShowModal(true);
              }}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              Thêm chấm công
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">Nhân viên</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">Ngày</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-slate-600 uppercase">Trạng thái</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase">Ghi chú</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-slate-600 uppercase">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    <CalendarIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Không có dữ liệu chấm công</p>
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-slate-400" />
                        <span className="font-medium text-slate-800">
                          {record.user?.full_name || record.user?.email || 'N/A'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {new Date(record.date).toLocaleDateString('vi-VN', {
                        weekday: 'short',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {getStatusBadge(record.status)}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{record.notes || '-'}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openEditModal(record)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Sửa"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(record.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Xóa"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-xl font-bold text-slate-800">
                {editingRecord ? 'Sửa chấm công' : 'Thêm chấm công'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nhân viên *</label>
                <select
                  value={formData.user_id}
                  onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">-- Chọn nhân viên --</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.full_name || user.email}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Ngày *</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Trạng thái *</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="present">Có mặt</option>
                  <option value="half_day">Nửa ngày</option>
                  <option value="leave">Nghỉ phép</option>
                  <option value="absent">Vắng</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Ghi chú</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Ghi chú thêm (nếu có)"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  {editingRecord ? 'Cập nhật' : 'Thêm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
