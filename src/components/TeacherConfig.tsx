/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import React, { useState } from 'react';
import {
  User,
  Mail,
  Phone,
  Book,
  GraduationCap,
  MapPin,
  MessageSquare,
  Palette,
  Save,
  CheckCircle,
  Briefcase,
  Award
} from 'lucide-react';

export interface TeacherProfile {
  name: string;
  email: string;
  phone: string;
  school: string;
  academicTitle: string;
  department: string;
  bio: string;
  greeting: string;
  avatarColor: string;
}

interface TeacherConfigProps {
  profile: TeacherProfile;
  onSave: (updated: TeacherProfile) => void;
}

export default function TeacherConfig({ profile, onSave }: TeacherConfigProps) {
  const [formData, setFormData] = useState<TeacherProfile>({
    name: profile.name || 'Nguyễn Văn A',
    email: profile.email || 'gv@quickquiz.vn',
    phone: profile.phone || '0912 345 678',
    school: profile.school || 'Trường THCS Nguyễn Du',
    academicTitle: profile.academicTitle || 'Thạc sĩ',
    department: profile.department || 'Khoa học tự nhiên',
    bio: profile.bio || 'Giáo viên bộ môn Khoa học tự nhiên có hơn 10 năm kinh nghiệm.',
    greeting: profile.greeting || 'Chúc các em rèn luyện hết mình, ôn thi thật tốt và đạt điểm cao!',
    avatarColor: profile.avatarColor || 'emerald'
  });

  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const colorPresets = [
    { id: 'emerald', name: 'Emerald Green', bgClass: 'from-emerald-500 to-green-600 border-emerald-400', preview: 'bg-emerald-500' },
    { id: 'blue', name: 'Ocean Blue', bgClass: 'from-blue-500 to-indigo-600 border-blue-400', preview: 'bg-blue-500' },
    { id: 'violet', name: 'Cosmic Violet', bgClass: 'from-violet-500 to-purple-600 border-violet-400', preview: 'bg-violet-500' },
    { id: 'rose', name: 'Cherry Rose', bgClass: 'from-rose-500 to-pink-600 border-rose-400', preview: 'bg-rose-500' },
    { id: 'amber', name: 'Golden Amber', bgClass: 'from-amber-500 to-orange-600 border-amber-400', preview: 'bg-amber-500' },
    { id: 'teal', name: 'Deep Teal', bgClass: 'from-teal-500 to-cyan-600 border-teal-400', preview: 'bg-teal-500' },
  ];

  const departmentPresets = [
    'Khoa học tự nhiên',
    'Toán học',
    'Vật lý',
    'Hóa học',
    'Sinh học',
    'Tin học & Công nghệ',
    'Ngữ văn',
    'Lịch sử và Địa lý',
    'Tiếng Anh'
  ];

  const academicTitlePresets = [
    'Cử nhân',
    'Thạc sĩ',
    'Tiến sĩ',
    'Phó giáo sư',
    'Giáo sư',
    'Nhà giáo Ưu tú',
    'Nhà giáo Nhân dân'
  ];

  const activeColorObj = colorPresets.find(c => c.id === formData.avatarColor) || colorPresets[0];

  return (
    <div className="space-y-6 select-none font-sans">
      <div>
        <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight">HỒ SƠ CẤU HÌNH GIÁO VIÊN</h1>
        <p className="text-sm text-slate-500 font-semibold">Tùy biến chữ ký, bộ môn giảng dạy và hiển thị thông tin danh tính của bạn trên hệ thống điện tử.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Avatar and Card preview */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm text-center relative overflow-hidden">
            <div className={`absolute top-0 left-0 right-0 h-2 bg-gradient-to-r ${activeColorObj.bgClass}`} />
            
            <div className="mt-4 flex justify-center">
              <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${activeColorObj.bgClass} flex items-center justify-center font-black text-white text-3xl shadow-md border-2 border-white`}>
                {formData.name.split(' ').pop()?.substring(0, 2).toUpperCase() || 'GV'}
              </div>
            </div>

            <div className="mt-4 space-y-1">
              <h3 className="text-lg font-extrabold text-slate-800">{formData.name}</h3>
              <p className="text-xs bg-emerald-50 text-emerald-700 font-bold px-2.5 py-1 rounded-full inline-block">
                {formData.academicTitle} • Bộ môn {formData.department}
              </p>
            </div>

            <div className="mt-5 pt-5 border-t border-slate-100 space-y-3.5 text-xs text-left font-medium text-slate-600">
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="truncate">{formData.email}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                <span>{formData.phone}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="truncate">{formData.school}</span>
              </div>
            </div>
          </div>

          {/* Student panel Greeting Card Preview */}
          <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-xl relative overflow-hidden border border-slate-800">
            <div className="absolute right-3 top-3 opacity-10">
              <Award className="w-16 h-16" />
            </div>
            <div className="flex gap-3 items-center">
              <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${activeColorObj.bgClass} flex items-center justify-center text-xs font-black shadow-inner`}>
                {formData.name.split(' ').pop()?.substring(0, 1).toUpperCase() || 'G'}
              </div>
              <div>
                <span className="text-[10px] text-emerald-400 font-bold block uppercase tracking-wider">Lời dặn giáo viên</span>
                <span className="text-xs font-bold text-slate-200">{formData.name}</span>
              </div>
            </div>
            <p className="mt-3.5 text-xs text-slate-300 italic font-semibold leading-relaxed">
              " {formData.greeting} "
            </p>
          </div>
        </div>

        {/* Right column: Config inputs form */}
        <div className="lg:col-span-2 bg-white p-6 md:p-8 rounded-2xl border border-slate-100 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Field 1: Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1">
                  <User className="w-4 h-4 text-slate-400" />
                  Họ và tên giáo viên
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ví dụ: Nguyễn Văn A"
                  className="w-full px-3 py-2.5 text-xs border border-slate-200 rounded-xl focus:ring-1 focus:ring-emerald-500 bg-slate-50 font-bold text-slate-800"
                />
              </div>

              {/* Field 2: Email */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1">
                  <Mail className="w-4 h-4 text-slate-400" />
                  Địa chỉ Email liên hệ
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Ví dụ: gv@quickquiz.vn"
                  className="w-full px-3 py-2.5 text-xs border border-slate-200 rounded-xl focus:ring-1 focus:ring-emerald-500 bg-slate-50 font-bold text-slate-800"
                />
              </div>

              {/* Field 3: Phone */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1">
                  <Phone className="w-4 h-4 text-slate-400" />
                  Số điện thoại
                </label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Ví dụ: 0912 345 678"
                  className="w-full px-3 py-2.5 text-xs border border-slate-200 rounded-xl focus:ring-1 focus:ring-emerald-500 bg-slate-50 font-bold text-slate-800"
                />
              </div>

              {/* Field 4: School */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  Trường / Cơ sở giảng dạy
                </label>
                <input
                  type="text"
                  value={formData.school}
                  onChange={(e) => setFormData({ ...formData, school: e.target.value })}
                  placeholder="Ví dụ: Trường THCS Nguyễn Du"
                  className="w-full px-3 py-2.5 text-xs border border-slate-200 rounded-xl focus:ring-1 focus:ring-emerald-500 bg-slate-50 font-bold text-slate-800"
                />
              </div>

              {/* Field 5: Academic Title Presets */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1">
                  <GraduationCap className="w-4 h-4 text-slate-400" />
                  Học hàm / Học vị
                </label>
                <select
                  value={formData.academicTitle}
                  onChange={(e) => setFormData({ ...formData, academicTitle: e.target.value })}
                  className="w-full px-3 py-2.5 text-xs border border-slate-200 rounded-xl focus:ring-1 focus:ring-emerald-500 bg-slate-50 font-bold text-slate-800 cursor-pointer"
                >
                  {academicTitlePresets.map((title) => (
                    <option key={title} value={title}>
                      {title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Field 6: Department / Subject */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1">
                  <Briefcase className="w-4 h-4 text-slate-400" />
                  Tổ chuyên môn nhiệm sở
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full pl-3 pr-24 py-2.5 text-xs border border-slate-200 rounded-xl focus:ring-1 focus:ring-emerald-500 bg-slate-50 font-bold text-slate-800"
                  />
                  <div className="absolute right-1 top-1">
                    <select
                      onChange={(e) => {
                        if (e.target.value) {
                          setFormData({ ...formData, department: e.target.value });
                        }
                      }}
                      className="text-[10px] bg-white border border-slate-250 py-1.5 px-2 rounded-lg font-black cursor-pointer text-slate-600"
                      defaultValue=""
                    >
                      <option value="">Gợi ý...</option>
                      {departmentPresets.map((dep) => (
                        <option key={dep} value={dep}>
                          {dep}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Color preview row */}
            <div className="space-y-2 border-t pt-4">
              <label className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1">
                <Palette className="w-4 h-4 text-slate-400" />
                Màu sắc nhận diện (Avatar Theme)
              </label>
              <div className="flex flex-wrap gap-2 pt-1">
                {colorPresets.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, avatarColor: preset.id })}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[10px] font-black uppercase transition-all cursor-pointer ${
                      formData.avatarColor === preset.id
                        ? 'border-emerald-500 bg-emerald-50/50 text-emerald-800 scale-102 ring-1 ring-emerald-400/30'
                        : 'border-slate-100 bg-slate-50 text-slate-550 hover:bg-slate-100'
                    }`}
                  >
                    <span className={`w-2.5 h-2.5 rounded-full ${preset.preview}`} />
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Field 7: Bio */}
            <div className="space-y-1.5 border-t pt-4">
              <label className="text-xs font-black text-slate-700 uppercase tracking-wider block">Giới thiệu ngắn gọn</label>
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                rows={2}
                placeholder="Nhập đôi nét giới thiệu về thâm niên, mục tiêu nghề nghiệp..."
                className="w-full px-3 py-2.5 text-xs border border-slate-200 bg-slate-50 rounded-xl focus:ring-1 focus:ring-emerald-500 font-medium text-slate-700"
              />
            </div>

            {/* Field 8: Greeting prompt */}
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1">
                <MessageSquare className="w-4 h-4 text-slate-400" />
                Dặn dò cho học sinh khi vào phòng rèn luyện
              </label>
              <input
                type="text"
                required
                value={formData.greeting}
                onChange={(e) => setFormData({ ...formData, greeting: e.target.value })}
                placeholder="Nhập lời dặn chúc học sinh ôn bài..."
                className="w-full px-3 py-2.5 text-xs border border-slate-200 bg-slate-50 rounded-xl focus:ring-1 focus:ring-emerald-500 font-bold text-slate-800"
              />
            </div>

            {/* Prompt response */}
            {savedSuccess && (
              <div className="flex items-center gap-2 text-emerald-800 bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-xs font-bold font-sans">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Chúc mừng! Hồ sơ cấu hình giáo viên đã được cập nhật thành công và lưu trữ cục bộ.</span>
              </div>
            )}

            {/* Submit & Reset actions */}
            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl shadow-md uppercase tracking-wider flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                Cập nhật cấu hình hồ sơ
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
