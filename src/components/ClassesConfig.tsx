/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Class, Student, generateStudentPassword } from '../types';
import { Plus, Upload, Edit, Trash, HelpCircle, Lock, Book, ShieldAlert, Download, Trash2 } from 'lucide-react';

interface ClassesConfigProps {
  classes: Class[];
  selectedClassId: string;
  onSelectClass: (id: string) => void;
  onCreateClass: (newCls: Omit<Class, 'id' | 'students'>) => void;
  onDeleteClass: (id: string) => void;
  onChangeJoinCode: (id: string, newCode: string) => void;
  onChangePassword: (id: string, newPass: string) => void;
  onAddStudent: (classId: string, name: string) => void;
  onImportStudents: (classId: string, names: string[]) => void;
  onEditStudent: (classId: string, studentId: string, newName: string, newPassword?: string) => void;
  onDeleteStudent: (classId: string, studentId: string) => void;
  onClearAllStudents: (classId: string) => void;
  onDeleteStudentsBulk: (classId: string, studentIds: string[]) => void;
}

export default function ClassesConfig({
  classes,
  selectedClassId,
  onSelectClass,
  onCreateClass,
  onDeleteClass,
  onChangeJoinCode,
  onChangePassword,
  onAddStudent,
  onImportStudents,
  onEditStudent,
  onDeleteStudent,
  onClearAllStudents,
  onDeleteStudentsBulk,
}: ClassesConfigProps) {
  // Add Class fields
  const [level, setLevel] = useState('THCS');
  const [grade, setGrade] = useState('6');
  const [subject, setSubject] = useState('Toán');
  const [book, setBook] = useState('Kết nối tri thức');
  const [name, setName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [joinPass, setJoinPass] = useState('123456');

  // Add Manual Student fields
  const [manualName, setManualName] = useState('');

  // Bulk input fields
  const [showBulk, setShowBulk] = useState(false);
  const [bulkText, setBulkText] = useState('');

  // Selection states for bulk delete
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);

  // Modal State for custom iframe-safe prompts
  const [modalType, setModalType] = useState<'joinCode' | 'joinPass' | 'editStudent' | null>(null);
  const [modalTitle, setModalTitle] = useState('');
  const [modalDesc, setModalDesc] = useState('');
  const [modalValue, setModalValue] = useState('');
  const [modalValue2, setModalValue2] = useState('');
  const [targetStudentId, setTargetStudentId] = useState('');

  const activeClass = classes.find((c) => c.id === selectedClassId) || classes[0];

  const handleToggleSelectStudent = (id: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAll = () => {
    if (!activeClass) return;
    const allIds = activeClass.students.map((s) => s.id);
    const areAllSelected = allIds.length > 0 && allIds.every((id) => selectedStudentIds.includes(id));
    if (areAllSelected) {
      // Uncheck all of this class
      setSelectedStudentIds((prev) => prev.filter((id) => !allIds.includes(id)));
    } else {
      // Check all of this class
      setSelectedStudentIds((prev) => {
        const unique = new Set([...prev, ...allIds]);
        return Array.from(unique);
      });
    }
  };

  const handleDownloadStudentTemplate = () => {
    if (!activeClass) return;
    const templateContent = `Nguyễn Văn An
Phạm Minh Đức
Trần Thị Kim Chi
Lê Hoàng Hải
Nguyễn Thúy Quỳnh
Vũ Quốc Bảo
Đỗ Duy Mạnh
Phùng Ngọc Trinh`;
    const blob = new Blob([templateContent], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Mau_Danh_Sach_Hoc_Sinh_${activeClass.name.replace(/\s+/g, '_')}.txt`;
    link.click();
  };

  const handleDownloadCurrentStudentList = () => {
    if (!activeClass) return;
    let text = `DANH SÁCH HỌC SINH - LỚP: ${activeClass.name.toUpperCase()}\n`;
    text += `Mã rèn luyện lớp: ${activeClass.joinCode}\n`;
    text += `Mật khẩu lớp (Chung): ${activeClass.joinPass}\n`;
    text += `Tổng số học sinh: ${activeClass.students.length}\n`;
    text += `==================================================\n\n`;
    if (activeClass.students.length === 0) {
      text += `[LỚP CHƯA CÓ HỌC SINH ĐĂNG KÝ HOẶC NHẬP DANH SÁCH]\n\n`;
      text += `Hướng dẫn cách thêm học sinh:\n`;
      text += `- Cách 1: Gửi Mã rèn luyện lớp [${activeClass.joinCode}] và Mật khẩu chung [${activeClass.joinPass}] để học sinh tự tạo tài khoản.\n`;
      text += `- Cách 2: Sử dụng chức năng "Nhập nhanh từ TXT" trên trang cấu hình để khởi tạo tài khoản hàng loạt cho các em.\n`;
    } else {
      text += `STT | Họ và Tên | Mật khẩu cá nhân | Số bài đã làm | Điểm rèn luyện TB\n`;
      text += `----------------------------------------------------------------------\n`;
      activeClass.students.forEach((st, idx) => {
        const studentPass = st.password || generateStudentPassword(st.name);
        text += `${idx + 1} | ${st.name} | ${studentPass} | ${st.completed} | ${st.avgScore.toFixed(1)}\n`;
      });
    }
    text += `\nIn lúc: ${new Date().toLocaleString('vi-VN')}\n`;

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Danh_Sach_Hoc_Sinh_Lop_${activeClass.name.replace(/\s+/g, '_')}.txt`;
    link.click();
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content) {
        const lines = content.split(/\r?\n/)
          .map(line => line.trim())
          .filter(line => {
            if (!line) return false;
            if (line.startsWith('DANH SÁCH') || line.startsWith('Mã rèn luyện') || line.startsWith('Mật khẩu') || line.startsWith('Tổng số') || line.startsWith('===') || line.startsWith('STT |') || line.startsWith('---') || line.startsWith('In lúc:')) {
              return false;
            }
            return true;
          })
          .map(line => {
            if (line.includes('|')) {
              const parts = line.split('|').map(p => p.trim());
              // Format might be "STT | Họ và Tên | ..."
              // Let's filter out headers just in case
              if (parts[1] && parts[1] !== 'Họ và Tên' && isNaN(Number(parts[1]))) {
                return parts[1];
              }
              return parts[1] || line;
            }
            return line;
          })
          .filter(name => name && name !== 'Họ và Tên');

        setBulkText(lines.join('\n'));
      }
    };
    reader.readAsText(file, 'utf-8');
    event.target.value = '';
  };

  const handleFillTemplate = () => {
    setBulkText(`Nguyễn Văn An
Phạm Minh Đức
Trần Thị Kim Chi
Lê Hoàng Hải
Nguyễn Thúy Quỳnh
Vũ Quốc Bảo`);
  };

  const openJoinCodeModal = () => {
    if (!activeClass) return;
    setModalType('joinCode');
    setModalTitle('Đổi mã tham gia lớp');
    setModalDesc('Nhập mã lớp mới (Viết hoa không dấu, không cách):');
    setModalValue(activeClass.joinCode);
  };

  const openPasswordModal = () => {
    if (!activeClass) return;
    setModalType('joinPass');
    setModalTitle('Đổi mật khẩu lớp');
    setModalDesc('Nhập mật khẩu mới của phòng luyện:');
    setModalValue(activeClass.joinPass);
  };

  const openEditStudentModal = (studentId: string, currentName: string, currentPass: string) => {
    setModalType('editStudent');
    setModalTitle('Sửa thông tin học sinh');
    setModalDesc('Cập nhật họ tên và mật khẩu riêng biệt của học sinh:');
    setModalValue(currentName);
    setModalValue2(currentPass);
    setTargetStudentId(studentId);
  };

  const handleModalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalValue.trim() || !activeClass) return;
    
    if (modalType === 'joinCode') {
      const formattedCode = modalValue.trim().toUpperCase().replace(/\s+/g, '');
      if (!formattedCode) return;
      onChangeJoinCode(activeClass.id, formattedCode);
    } else if (modalType === 'joinPass') {
      onChangePassword(activeClass.id, modalValue.trim());
    } else if (modalType === 'editStudent') {
      onEditStudent(activeClass.id, targetStudentId, modalValue.trim(), modalValue2.trim());
    }
    
    // Close modal
    setModalType(null);
    setModalValue('');
    setModalValue2('');
    setTargetStudentId('');
  };

  const handleCreateClassSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !joinCode || !joinPass) return;
    onCreateClass({
      grade,
      subject,
      book,
      name,
      joinCode: joinCode.toUpperCase().replace(/\s+/g, ''),
      joinPass,
    });
    // Reset Form
    setName('');
    setJoinCode('');
  };

  const handleAddManualSubmit = (classId: string) => {
    if (!manualName.trim()) return;
    onAddStudent(classId, manualName.trim());
    setManualName('');
  };

  const handleBulkImportSubmit = (classId: string) => {
    if (!bulkText.trim()) return;
    const lines = bulkText
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
    if (lines.length > 0) {
      onImportStudents(classId, lines);
      setBulkText('');
      setShowBulk(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Cấu hình lớp học & danh sách học sinh</h1>
        <p className="text-sm text-slate-500">Quản lý định danh học sinh, tạo tài khoản phòng luyện trực tuyến.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Creation Form */}
        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm space-y-4 h-fit">
          <h3 className="font-bold text-slate-800 text-base border-b border-slate-100 pb-2 flex items-center gap-2">
            <Plus className="w-5 h-5 text-emerald-600" />
            Tạo lớp rèn luyện mới
          </h3>
          <form onSubmit={handleCreateClassSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Cấp học</label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 outline-none"
              >
                <option value="THCS">THCS (Cấp 2)</option>
                <option value="THPT">THPT (Cấp 3)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Lớp / Khối</label>
                <select
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  {level === 'THCS' ? (
                    <>
                      <option value="6">Lớp 6</option>
                      <option value="7">Lớp 7</option>
                      <option value="8">Lớp 8</option>
                      <option value="9">Lớp 9</option>
                    </>
                  ) : (
                    <>
                      <option value="10">Lớp 10</option>
                      <option value="11">Lớp 11</option>
                      <option value="12">Lớp 12</option>
                    </>
                  )}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Môn học</label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  <option value="Toán">Toán học</option>
                  <option value="Tin học">Tin học</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Bộ sách chuẩn</label>
              <select
                value={book}
                onChange={(e) => setBook(e.target.value)}
                className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 outline-none"
              >
                <option value="Kết nối tri thức">Kết nối tri thức với cuộc sống</option>
                <option value="Cánh diều">Cánh diều</option>
                <option value="Chân trời sáng tạo">Chân trời sáng tạo</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tên lớp học</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ví dụ: Lớp 6A3 ôn tập"
                className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Mã lớp</label>
                <input
                  type="text"
                  required
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  placeholder="TOAN6A3"
                  className="w-full text-sm font-semibold font-mono bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Mật khẩu</label>
                <input
                  type="text"
                  required
                  value={joinPass}
                  onChange={(e) => setJoinPass(e.target.value)}
                  placeholder="123456"
                  className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-lg transition-colors mt-2 shadow-sm"
            >
              Tạo lớp mới ngay
            </button>
          </form>
        </div>

        {/* Right Side: Active Class Students Manager */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-100 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <h3 className="font-bold text-slate-800 text-base">Quản lý danh sách học sinh</h3>
              {classes.length > 0 && (
                <select
                  value={selectedClassId || (activeClass ? activeClass.id : '')}
                  onChange={(e) => {
                    onSelectClass(e.target.value);
                    setSelectedStudentIds([]);
                  }}
                  className="text-sm bg-slate-100 border-none rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 font-bold outline-none text-slate-700"
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
 
            {activeClass && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownloadCurrentStudentList}
                  className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
                  title="Tải danh sách học sinh hiện tại kèm mật khẩu và kết quả học tập (.txt)"
                >
                  <Download className="w-3.5 h-3.5" />
                  Tải danh sách (.TXT)
                </button>
                <button
                  onClick={() => setShowBulk(!showBulk)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5" />
                  Nhập nhanh từ TXT
                </button>
              </div>
            )}
          </div>
 
          {activeClass ? (
            <>
              {/* Class Quick Management Action Strip */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Mã tham gia:</span>
                    <strong className="text-slate-700 font-mono bg-white px-2 py-1 rounded border shadow-sm select-all">
                      {activeClass.joinCode}
                    </strong>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Mật khẩu:</span>
                    <strong className="text-slate-700 bg-white px-2 py-1 rounded border shadow-sm select-all">
                      {activeClass.joinPass}
                    </strong>
                  </div>
                </div>
 
                <div className="flex gap-2 flex-wrap sm:flex-nowrap">
                  <button
                    onClick={openJoinCodeModal}
                    className="px-2.5 py-1.5 bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg font-bold text-xs transition-colors flex items-center gap-1 shadow-xs"
                  >
                    Đổi mã
                  </button>
                  <button
                    onClick={openPasswordModal}
                    className="px-2.5 py-1.5 bg-white hover:bg-blue-50 text-blue-700 border border-blue-200 rounded-lg font-bold text-xs transition-colors flex items-center gap-1 shadow-xs"
                  >
                    Đổi mật khẩu
                  </button>
                  <button
                    onClick={() => onClearAllStudents(activeClass.id)}
                    className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-lg font-bold text-xs transition-colors flex items-center gap-1 shadow-xs"
                    title="Xóa toàn bộ danh sách học sinh của lớp học này"
                  >
                    Xóa sạch HS
                  </button>
                  <button
                    onClick={() => onDeleteClass(activeClass.id)}
                    className="px-2.5 py-1.5 bg-red-55 hover:bg-red-100 text-red-650 border border-red-200 rounded-lg font-bold text-xs transition-colors flex items-center gap-1 shadow-xs"
                  >
                    Xóa lớp
                  </button>
                </div>
              </div>
 
              {/* Bulk Form text box section */}
              {showBulk && (
                <div className="p-4 bg-amber-50/50 border border-dashed border-amber-200 rounded-lg space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <h4 className="font-bold text-xs text-amber-800 uppercase flex items-center gap-1.5">
                      <Upload className="w-4 h-4" />
                      Nhập danh sách học sinh hàng loạt
                    </h4>
                    <div className="flex items-center gap-2">
                      <label className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white border border-amber-700 rounded text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-2xs">
                        <Upload className="w-3 h-3" />
                        Tải tệp TXT lên app
                        <input
                          type="file"
                          accept=".txt"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </label>
                      <button
                        onClick={handleDownloadStudentTemplate}
                        className="px-2.5 py-1 bg-white hover:bg-amber-100 text-amber-700 border border-amber-200 rounded text-[10px] font-bold flex items-center gap-1 transition-colors shadow-2xs"
                      >
                        <Download className="w-3 h-3" />
                        Tải bản mẫu TXT của lớp
                      </button>
                    </div>
                  </div>
                  <p className="text-[11px] text-zinc-600 font-medium">
                    Mỗi dòng ghi tên của 1 học sinh. Nhấn nút để khởi tạo lập tức. Bạn cũng có thể nhấn 
                    <button onClick={handleFillTemplate} className="mx-1 text-amber-700 hover:text-amber-800 underline font-bold bg-white px-1.5 py-0.5 rounded border border-amber-200 shadow-2xs">Sử dụng danh sách mẫu</button>
                    để điền nhanh dữ liệu mẫu kiểm thử.
                  </p>
                  <textarea
                    rows={4}
                    value={bulkText}
                    onChange={(e) => setBulkText(e.target.value)}
                    placeholder="Nguyễn Văn An&#10;Lê Văn Bình&#10;Trần Thị Chi"
                    className="w-full text-xs font-semibold p-2.5 border rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white outline-none shadow-inner"
                  />
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setShowBulk(false)} className="px-3 py-1 text-xs font-semibold text-slate-500">
                      Hủy
                    </button>
                    <button
                      onClick={() => handleBulkImportSubmit(activeClass.id)}
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-sm transition-colors"
                    >
                      Bắt đầu nhập
                    </button>
                  </div>
                </div>
              )}

              {/* Bulk select action banner */}
              {selectedStudentIds.length > 0 && (
                <div className="bg-rose-50 text-rose-900 border border-rose-150 rounded-xl p-3 flex items-center justify-between text-xs font-semibold animate-fade-in shadow-xs">
                  <div className="flex items-center gap-2 text-rose-750">
                    <Trash2 className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>Đang chọn <strong className="text-rose-700 bg-white px-2 py-0.5 rounded-full border shadow-2xs font-bold font-mono">{selectedStudentIds.length}</strong> học sinh trong lớp này</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedStudentIds([])}
                      className="px-2.5 py-1 text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-md transition-colors shadow-2xs font-bold"
                    >
                      Bỏ chọn
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onDeleteStudentsBulk(activeClass.id, selectedStudentIds);
                        setSelectedStudentIds([]);
                      }}
                      className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white font-bold rounded-md transition-colors shadow-2xs"
                    >
                      Xóa hàng loạt học sinh đã chọn
                    </button>
                  </div>
                </div>
              )}

              {/* Students grid or table */}
              {activeClass.students.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left text-slate-500 border rounded-xl overflow-hidden shadow-xs">
                    <thead className="text-xs text-slate-400 uppercase bg-slate-50">
                      <tr>
                        <th className="px-3 py-3 text-center w-10">
                          <input
                            type="checkbox"
                            checked={
                              activeClass.students.length > 0 &&
                              activeClass.students.every((s) => selectedStudentIds.includes(s.id))
                            }
                            onChange={handleToggleSelectAll}
                            className="w-4 h-4 text-emerald-600 bg-gray-100 border-gray-300 rounded focus:ring-emerald-500 cursor-pointer"
                          />
                        </th>
                        <th className="px-4 py-3">Họ và tên học viên</th>
                        <th className="px-4 py-3 text-center">Mật khẩu lớp</th>
                        <th className="px-4 py-3 text-center">Mật khẩu học sinh</th>
                        <th className="px-4 py-3 text-center">Số bài đã nộp</th>
                        <th className="px-4 py-3 text-center">Điểm TB rèn luyện</th>
                        <th className="px-4 py-3 text-right">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {activeClass.students.map((st) => {
                        const isChecked = selectedStudentIds.includes(st.id);
                        return (
                          <tr
                            key={st.id}
                            className={`transition-colors ${
                              isChecked ? 'bg-rose-50/20 hover:bg-rose-50/30' : 'hover:bg-slate-50/75'
                            }`}
                          >
                            <td className="px-3 py-3.5 text-center w-10">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleToggleSelectStudent(st.id)}
                                className="w-4 h-4 text-emerald-600 bg-gray-100 border-gray-300 rounded focus:ring-emerald-500 cursor-pointer"
                              />
                            </td>
                            <td className="px-4 py-3.5 font-semibold text-slate-800">{st.name}</td>
                            <td className="px-4 py-3.5 text-center font-mono text-xs font-bold text-slate-500 bg-slate-50/50">{activeClass.joinPass}</td>
                            <td className="px-4 py-3.5 text-center font-mono text-xs font-bold text-emerald-600 bg-emerald-50/10 rounded-md">{st.password || generateStudentPassword(st.name)}</td>
                            <td className="px-4 py-3.5 text-center font-semibold text-slate-600">{st.completed}</td>
                            <td className="px-4 py-3.5 text-center">
                              <span
                                className={`px-2.5 py-1 text-xs font-bold rounded-full ${
                                  st.avgScore >= 8.0
                                    ? 'bg-green-50 text-green-700'
                                    : st.avgScore >= 5.0
                                    ? 'bg-amber-50 text-amber-700'
                                    : 'bg-red-50 text-red-700'
                                }`}
                              >
                                {st.avgScore.toFixed(1)}
                              </span>
                            </td>
                            <td className="px-4 py-3.5 text-right flex justify-end gap-2">
                              <button
                                onClick={() => openEditStudentModal(st.id, st.name, st.password || generateStudentPassword(st.name))}
                                className="text-slate-400 hover:text-slate-600 p-1"
                                title="Sửa tên và mật khẩu học sinh"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => onDeleteStudent(activeClass.id, st.id)}
                                className="text-slate-400 hover:text-red-600 p-1"
                                title="Loại bỏ học sinh"
                              >
                                <Trash className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 bg-slate-50 rounded-lg">
                  <p className="text-sm text-slate-400 font-semibold">Chưa có học sinh nào tham gia lớp này.</p>
                </div>
              )}

              {/* Add manual student bar */}
              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                <input
                  type="text"
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                  placeholder="Nhập tên học sinh mới..."
                  className="text-xs border border-zinc-200 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-emerald-500 bg-slate-50 outline-none w-52"
                />
                <button
                  onClick={() => handleAddManualSubmit(activeClass.id)}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition-colors shadow-xs"
                >
                  Thêm thủ công
                </button>
              </div>
            </>
          ) : (
            <p className="text-slate-400 text-sm text-center py-10">Vui lòng tạo lớp học đầu tiên ở bảng mẫu bên trái.</p>
          )}
        </div>
      </div>

      {/* Custom Iframe-Safe Edit Modal */}
      {modalType && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-150 w-full max-w-sm overflow-hidden animate-scale-up">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-wide">
                {modalTitle}
              </h3>
              <button
                type="button"
                onClick={() => setModalType(null)}
                className="text-slate-400 hover:text-slate-600 font-black text-sm p-1 transition-colors"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleModalSubmit} className="p-5 space-y-4">
              <p className="text-[11px] text-slate-500 font-semibold leading-relaxed">
                {modalDesc}
              </p>
              
              {modalType === 'editStudent' ? (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Họ và tên học sinh</label>
                    <input
                      type="text"
                      required
                      autoFocus
                      value={modalValue}
                      onChange={(e) => setModalValue(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 text-slate-800 font-bold border border-slate-200 rounded-xl focus:ring-1 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Mật khẩu học sinh</label>
                    <input
                      type="text"
                      required
                      value={modalValue2}
                      onChange={(e) => setModalValue2(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 text-slate-800 font-bold font-mono border border-slate-200 rounded-xl focus:ring-1 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                </div>
              ) : (
                <input
                  type="text"
                  required
                  autoFocus
                  value={modalValue}
                  onChange={(e) => setModalValue(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 text-slate-800 font-bold border border-slate-200 rounded-xl focus:ring-1 focus:ring-emerald-500 outline-none"
                />
              )}
              
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 mt-4">
                <button
                  type="button"
                  onClick={() => setModalType(null)}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-black rounded-lg uppercase tracking-wider transition-all"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black rounded-lg uppercase tracking-wider transition-all flex items-center gap-1 shadow-sm"
                >
                  Xác nhận
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
