'use client';

import { useState, useEffect } from 'react';
import { User, Mail, Phone, Calendar, Briefcase, Shield, Building2, Save } from 'lucide-react';

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    setLoading(false);
  }, []);

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

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('vi-VN');
  };

  const userRoleName = user?.roles?.[0]?.name || 'User';
  const userRoleColor = user?.roles?.[0]?.color || '#6366f1';

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-800">Hồ sơ cá nhân</h1>
        <p className="text-slate-600 mt-1">Thông tin tài khoản và cài đặt của bạn</p>
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 h-32"></div>

        {/* Profile content */}
        <div className="px-6 pb-6">
          {/* Avatar and basic info */}
          <div className="flex items-start gap-6 -mt-16 mb-6">
            <div className="w-32 h-32 rounded-full bg-white border-4 border-white shadow-lg flex items-center justify-center">
              <div className="w-full h-full rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
                <span className="text-4xl font-bold text-indigo-600">
                  {user?.first_name?.[0]}{user?.last_name?.[0]}
                </span>
              </div>
            </div>

            <div className="flex-1 mt-16">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold text-slate-900">
                  {user?.first_name} {user?.last_name}
                </h2>
                <span
                  className="px-3 py-1 rounded-full text-sm font-medium text-white"
                  style={{ backgroundColor: userRoleColor }}
                >
                  {userRoleName}
                </span>
              </div>
              <p className="text-slate-600 mt-1">{user?.position || 'Nhân viên'}</p>
            </div>
          </div>

          {/* Information Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Email */}
            <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg">
              <div className="p-2 bg-white rounded-lg">
                <Mail className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Email</p>
                <p className="font-medium text-slate-900">{user?.email}</p>
              </div>
            </div>

            {/* Phone */}
            <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg">
              <div className="p-2 bg-white rounded-lg">
                <Phone className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Số điện thoại</p>
                <p className="font-medium text-slate-900">{user?.phone || 'Chưa cập nhật'}</p>
              </div>
            </div>

            {/* Employee ID */}
            <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg">
              <div className="p-2 bg-white rounded-lg">
                <User className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Mã nhân viên</p>
                <p className="font-medium text-slate-900">{user?.employee_id || 'Chưa có'}</p>
              </div>
            </div>

            {/* Join Date */}
            <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg">
              <div className="p-2 bg-white rounded-lg">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Ngày tham gia</p>
                <p className="font-medium text-slate-900">{formatDate(user?.date_joined)}</p>
              </div>
            </div>

            {/* Position */}
            <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg">
              <div className="p-2 bg-white rounded-lg">
                <Briefcase className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Chức vụ</p>
                <p className="font-medium text-slate-900">{user?.position || 'Chưa cập nhật'}</p>
              </div>
            </div>

            {/* Department */}
            <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg">
              <div className="p-2 bg-white rounded-lg">
                <Building2 className="w-5 h-5 text-cyan-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Phòng ban</p>
                <p className="font-medium text-slate-900">{user?.department?.name || 'Chưa phân công'}</p>
              </div>
            </div>
          </div>

          {/* Roles & Permissions */}
          <div className="mt-6 p-4 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg border border-indigo-100">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-5 h-5 text-indigo-600" />
              <h3 className="font-semibold text-slate-900">Vai trò và quyền hạn</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {user?.roles?.map((role: any) => (
                <span
                  key={role.id}
                  className="px-3 py-1 rounded-full text-sm font-medium text-white"
                  style={{ backgroundColor: role.color }}
                >
                  {role.name}
                </span>
              ))}
            </div>
          </div>

          {/* Account Status */}
          <div className="mt-6 flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
            <div>
              <p className="font-semibold text-green-900">Trạng thái tài khoản</p>
              <p className="text-sm text-green-700">
                {user?.is_active ? 'Đang hoạt động' : 'Ngừng hoạt động'}
              </p>
            </div>
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* Note */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-sm text-blue-900">
          <strong>Lưu ý:</strong> Để cập nhật thông tin cá nhân, vui lòng liên hệ quản trị viên hệ thống.
        </p>
      </div>
    </div>
  );
}
