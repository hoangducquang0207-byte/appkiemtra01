/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState } from 'react';
import { ToggleLeft, ToggleRight, Download, Upload, Settings, Sparkles, HelpCircle, Lock, Eye, EyeOff, Save, Share2, Copy, Check } from 'lucide-react';
import { TeacherAccount } from '../types';

interface SettingsPanelProps {
  soundEnabled: boolean;
  onToggleSound: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onExportJson: () => void;
  onImportJson: (json: any) => void;
  passwords: { gv: string; hs: string; admin: string };
  onUpdatePassword: (role: 'gv' | 'hs' | 'admin', newPass: string) => void;
  userRole?: 'gv' | 'hs' | 'admin';
  teachers?: TeacherAccount[];
}

export default function SettingsPanel({
  soundEnabled,
  onToggleSound,
  darkMode,
  onToggleDarkMode,
  onExportJson,
  onImportJson,
  passwords,
  onUpdatePassword,
  userRole = 'gv',
  teachers = [],
}: SettingsPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [editingGv, setEditingGv] = useState(passwords.gv);
  const [editingHs, setEditingHs] = useState(passwords.hs);
  const [editingAdmin, setEditingAdmin] = useState(passwords.admin);

  const [showGv, setShowGv] = useState(false);
  const [showHs, setShowHs] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);

  const [selectedTeacherId, setSelectedTeacherId] = useState(teachers[0]?.id || '');
  const [copiedTeacher, setCopiedTeacher] = useState(false);

  const selectedTeacher = teachers.find((t) => t.id === selectedTeacherId) || teachers[0];
  const shareMessage = selectedTeacher
    ? `Kính gửi Thầy/Cô ${selectedTeacher.name},\n\nTôi xin chia sẻ thông tin đăng nhập ứng dụng QuickQuiz dành riêng cho Thầy/Cô:\n- Liên kết: ${window.location.origin}\n- Email: ${selectedTeacher.email}\n- Mật khẩu: ${selectedTeacher.password}\n\nThầy/Cô có thể tự thay đổi mật khẩu sau khi đăng nhập thành công.\n\nTrân trọng!`
    : '';

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const parsed = JSON.parse(evt.target?.result as string);
        if (parsed.classes && parsed.questions) {
          onImportJson(parsed);
        } else {
          alert('Tệp sao lưu không đúng định dạng QUICKQUIZ!');
        }
      } catch (err) {
        alert('Có lỗi xảy ra khi khôi phục dữ liệu từ tệp!');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Cấu hình hệ thống & Sao lưu dự phòng</h1>
        <p className="text-sm text-slate-500">Thiết lập giao diện, quản lý xuất nhập dữ liệu cục bộ an toàn.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 font-semibold">
        {/* General Application settings */}
        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center gap-1.5 border-b pb-2 text-slate-800">
            <Settings className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-slate-800 text-base">Tùy biến ứng dụng</h3>
          </div>

          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-bold text-slate-700 block">Âm thanh phản hồi</label>
                <span className="text-[11px] text-slate-400 font-medium leading-relaxed block mt-0.5">
                  Phát chuông thông báo khi bấm nộp bài thành công.
                </span>
              </div>
              <button onClick={onToggleSound} className="text-emerald-605 text-emerald-600 cursor-pointer">
                {soundEnabled ? <ToggleRight className="w-10 h-10" /> : <ToggleLeft className="w-10 h-10 text-slate-400" />}
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-bold text-slate-700 block">Giao diện tối (Dark mode)</label>
                <span className="text-[11px] text-slate-400 font-medium leading-relaxed block mt-0.5">
                  Giảm nhức mắt và mệt mỏi khi rèn luyện bài thi vào ban đêm.
                </span>
              </div>
              <button onClick={onToggleDarkMode} className="text-emerald-605 text-emerald-600 cursor-pointer">
                {darkMode ? <ToggleRight className="w-10 h-10" /> : <ToggleLeft className="w-10 h-10 text-slate-400" />}
              </button>
            </div>
          </div>
        </div>

        {/* Database import export back up actions */}
        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 border-b pb-2 text-slate-800">
              <Download className="w-5 h-5 text-emerald-600" />
              <h3 className="font-bold text-slate-800 text-base">Sao lưu dữ liệu học vụ JSON</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed font-semibold">
              Xuất hoặc nhập toàn bộ mốc rèn luyện, lớp học sinh, câu hỏi trắc nghiệm tự dựng ra tệp lưu trữ dự phòng vật lý để lưu trữ ngoại tuyến hoặc di dời sang máy chủ khác.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 pt-4">
            <button
              onClick={onExportJson}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition-colors shadow-sm flex items-center gap-1 flex-shrink-0"
            >
              <Download className="w-4 h-4" />
              Xuất tệp JSON sao lưu
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg transition-colors flex items-center gap-1 flex-shrink-0"
            >
              <Upload className="w-4 h-4 animate-bounce" />
              Khôi phục từ JSON
            </button>
            <input ref={fileInputRef} type="file" onChange={handleFileChange} className="hidden" accept=".json" />
          </div>
        </div>
      </div>

      {/* Security and Password configuration */}
      <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm space-y-4">
        <div className="flex items-center gap-1.5 border-b pb-2 text-slate-800">
          <Lock className="w-5 h-5 text-emerald-600" />
          <h3 className="font-bold text-slate-800 text-base">Bảo mật & Quản lý mật khẩu</h3>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed font-semibold">
          {userRole === 'hs' ? (
            <span>
              Để bảo mật tài khoản cá nhân trong quá trình luyện tập, em nên thay đổi mật khẩu riêng của mình. Mật khẩu mặc định ban đầu là họ tên của em viết liền không dấu (Ví dụ: Nguyễn Văn An thì mật khẩu mặc định là <span className="text-emerald-400 font-bold bg-[#1e293b]/70 px-1.5 py-0.5 rounded">nguyenvanan</span>). Sau khi cập nhật, mật khẩu mới sẽ được bảo mật an toàn để bảo vệ kết quả học tập của em.
            </span>
          ) : (
            <span>
              Thay đổi mật khẩu đăng nhập ban đầu để tránh truy cập trái phép. Mật khẩu mặc định ban đầu là <span className="text-emerald-600 font-bold">123456</span>. Sau khi thay đổi, mật khẩu mới sẽ được mã hóa và duy trì cục bộ.
            </span>
          )}
        </p>

        {userRole === 'hs' ? (
          <div className="max-w-md pt-2 font-sans font-medium">
            {/* Học sinh - Only show this for student role */}
            <div className="space-y-3 p-5 bg-emerald-50/20 border border-emerald-500/10 rounded-xl">
              <label className="text-xs font-black text-emerald-800 uppercase tracking-wider block flex items-center gap-1">
                🔑 Mật khẩu Học sinh của bạn
              </label>
              <div className="relative">
                <input
                  type={showHs ? 'text' : 'password'}
                  value={editingHs}
                  onChange={(e) => setEditingHs(e.target.value)}
                  placeholder="Nhập mật khẩu học sinh mới..."
                  className="w-full pl-3 pr-10 py-2.5 text-xs bg-white text-slate-800 font-bold border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-emerald-500 font-mono tracking-wider"
                />
                <button
                  type="button"
                  onClick={() => setShowHs(!showHs)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                >
                  {showHs ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <button
                onClick={() => {
                  onUpdatePassword('hs', editingHs);
                }}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[11px] rounded-lg shadow-md flex items-center justify-center gap-1.5 cursor-pointer uppercase transition-all tracking-wider active:scale-98"
              >
                <Save className="w-4 h-4" />
                Xác nhận đổi mật khẩu
              </button>
            </div>
          </div>
        ) : (
          <div className={`${userRole === 'admin' ? 'grid grid-cols-1 md:grid-cols-2 gap-6' : 'max-w-md'} pt-2 font-sans font-medium`}>
            {/* Giáo viên */}
            {(userRole === 'gv' || userRole === 'admin') && (
              <div className="space-y-2 p-4 bg-slate-50/60 rounded-xl border border-slate-100">
                <label className="text-xs font-black text-slate-700 uppercase tracking-wider block">Mật khẩu Giáo viên</label>
                <div className="relative">
                  <input
                    type={showGv ? 'text' : 'password'}
                    value={editingGv}
                    onChange={(e) => setEditingGv(e.target.value)}
                    className="w-full pl-3 pr-10 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-emerald-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowGv(!showGv)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    {showGv ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <button
                  onClick={() => {
                    onUpdatePassword('gv', editingGv);
                  }}
                  className="mt-2 w-full py-2 bg-emerald-650 hover:bg-emerald-700 text-white font-extrabold text-[11px] rounded-lg shadow-xs flex items-center justify-center gap-1.5 cursor-pointer uppercase transition-all"
                >
                  <Save className="w-3.5 h-3.5" />
                  Lưu mật khẩu GV
                </button>
              </div>
            )}

            {/* Quản trị viên */}
            {userRole === 'admin' && (
              <div className="space-y-2 p-4 bg-slate-50/60 rounded-xl border border-slate-100">
                <label className="text-xs font-black text-slate-700 uppercase tracking-wider block">Mật khẩu Quản trị</label>
                <div className="relative">
                  <input
                    type={showAdmin ? 'text' : 'password'}
                    value={editingAdmin}
                    onChange={(e) => setEditingAdmin(e.target.value)}
                    className="w-full pl-3 pr-10 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-emerald-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAdmin(!showAdmin)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    {showAdmin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <button
                  onClick={() => {
                    onUpdatePassword('admin', editingAdmin);
                  }}
                  className="mt-2 w-full py-2 bg-emerald-650 hover:bg-emerald-700 text-white font-extrabold text-[11px] rounded-lg shadow-xs flex items-center justify-center gap-1.5 cursor-pointer uppercase transition-all"
                >
                  <Save className="w-3.5 h-3.5" />
                  Lưu mật khẩu Admin
                </button>
              </div>
            )}
          </div>
        )}

        {/* CHIA SẺ TÀI KHOẢN GIÁO VIÊN (DÀNH CHO ADMIN) */}
        {userRole === 'admin' && teachers && teachers.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 md:p-6 space-y-4">
            <h3 className="font-extrabold text-slate-800 text-xs tracking-wider uppercase flex items-center gap-2 border-b pb-2">
              <Share2 className="w-4 h-4 text-emerald-600" />
              Quản trị: Chia sẻ ứng dụng cho Giáo viên khác
            </h3>
            <p className="text-[11px] text-slate-500 font-semibold leading-relaxed">
              Dễ dàng chia sẻ tài khoản truy cập dành riêng cho từng giáo viên qua email và mật khẩu của họ. Chọn giáo viên dưới đây để sao chép thông điệp mẫu:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5 text-xs">
                <label className="text-slate-500 font-bold block">Chọn Giáo viên bộ môn:</label>
                <select
                  value={selectedTeacherId}
                  onChange={(e) => setSelectedTeacherId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-850 font-bold focus:outline-hidden"
                >
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.email})
                    </option>
                  ))}
                </select>

                {selectedTeacher && (
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1.5 mt-2 text-[11px]">
                    <div>
                      <span className="text-slate-400 font-bold block uppercase text-[9px]">Email của giáo viên</span>
                      <span className="font-mono text-slate-700 font-bold">{selectedTeacher.email}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold block uppercase text-[9px]">Mật khẩu giáo viên</span>
                      <span className="font-mono text-zinc-600 font-bold bg-slate-200 px-1.5 py-0.5 rounded text-[10px]">{selectedTeacher.password}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-1.5 text-xs flex flex-col justify-between">
                <div>
                  <label className="text-slate-500 font-bold block">Mẫu thông điệp chia sẻ:</label>
                  <textarea
                    readOnly
                    rows={4}
                    value={shareMessage}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-mono text-[10px] leading-relaxed text-slate-600 focus:outline-hidden resize-none"
                  />
                </div>

                <button
                  onClick={() => {
                    navigator.clipboard.writeText(shareMessage);
                    setCopiedTeacher(true);
                    setTimeout(() => setCopiedTeacher(false), 2000);
                  }}
                  className="mt-2 w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[11px] rounded-lg shadow-xs flex items-center justify-center gap-1.5 cursor-pointer uppercase transition-all"
                >
                  {copiedTeacher ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedTeacher ? 'Đã sao chép!' : 'Sao chép thông tin gửi Giáo viên'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
