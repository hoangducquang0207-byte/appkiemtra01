/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Copy, 
  Check, 
  Shield, 
  GraduationCap, 
  Share2, 
  Key, 
  RefreshCw, 
  Eye, 
  EyeOff, 
  Save, 
  Database, 
  Lock,
  Mail,
  BookOpen,
  LogOut,
  UserCog,
  Settings,
  FileWarning
} from 'lucide-react';
import { TeacherAccount, Class, Question, Assignment, Submission, generateStudentPassword } from '../types';
import firebaseConfig from '../../firebase-applet-config.json';

interface AdminPanelProps {
  teachers: TeacherAccount[];
  onUpdateTeachers: (newTeachers: TeacherAccount[]) => void;
  classes: Class[];
  onUpdateClasses: (newClasses: Class[]) => void;
  questions: Question[];
  assignments: Assignment[];
  submissions: Submission[];
  onResetSystem: () => void;
  passwords: { gv: string; hs: string; admin: string };
  onUpdatePassword: (role: 'gv' | 'hs' | 'admin', newPass: string) => void;
  onLogout: () => void;
  currentUser: any;
  onUpdateAdminProfile: (updatedProfile: { name: string; email: string; avatarColor: string }) => void;
}

type AdminTab = 'teachers' | 'students';

export default function AdminPanel({
  teachers,
  onUpdateTeachers,
  classes,
  onUpdateClasses,
  questions,
  assignments,
  submissions,
  onResetSystem,
  passwords,
  onUpdatePassword,
  onLogout,
  currentUser,
  onUpdateAdminProfile,
}: AdminPanelProps) {
  // Main Navigation Tabs: Focused strictly on Teacher Interface and Student Interface management
  const [activeTab, setActiveTab] = useState<AdminTab>('teachers');
  
  // Modals state
  const [showAdminSettingsModal, setShowAdminSettingsModal] = useState(false);
  const [showSmtpModal, setShowSmtpModal] = useState(false);
  const [smtpStep, setSmtpStep] = useState(0);

  // Search and share link
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const origin = window.location.origin;
  const sharedSyncLink = `${origin}/?db=${firebaseConfig.firestoreDatabaseId}`;

  const handleCopySharedLink = () => {
    if (!sharedSyncLink) return;
    navigator.clipboard.writeText(sharedSyncLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
    showLocalToast('✔ Đã sao chép liên kết đồng bộ thành công!');
  };
  
  // Teacher management states
  const [isAddingTeacher, setIsAddingTeacher] = useState(false);
  const [editingTeacherId, setEditingTeacherId] = useState<string | null>(null);
  const [teacherName, setTeacherName] = useState('');
  const [teacherEmail, setTeacherEmail] = useState('');
  const [teacherPassword, setTeacherPassword] = useState('');
  const [teacherPhone, setTeacherPhone] = useState('');
  const [teacherDepartment, setTeacherDepartment] = useState('');
  const [teacherSubject, setTeacherSubject] = useState('');
  const [teacherSchool, setTeacherSchool] = useState('');
  const [teacherCampus, setTeacherCampus] = useState('');
  const [teacherStatus, setTeacherStatus] = useState<'active' | 'suspended'>('active');
  const [showTeacherPass, setShowTeacherPass] = useState(false);
  const [teacherToDeleteId, setTeacherToDeleteId] = useState<string | null>(null);

  // Admin profile editing states
  const [adminName, setAdminName] = useState(currentUser?.name || 'Hệ Thống Admin');
  const [adminEmail, setAdminEmail] = useState(currentUser?.email || 'admin@quickquiz.vn');
  const [adminAvatarColor, setAdminAvatarColor] = useState(currentUser?.avatarColor || 'emerald');

  useEffect(() => {
    if (currentUser) {
      setAdminName(currentUser.name || 'Hệ Thống Admin');
      setAdminEmail(currentUser.email || 'admin@quickquiz.vn');
      setAdminAvatarColor(currentUser.avatarColor || 'emerald');
    }
  }, [currentUser]);

  const getAvatarColorClass = (colorId: string) => {
    switch (colorId) {
      case 'blue': return 'from-blue-500 to-indigo-600 border-blue-400';
      case 'violet': return 'from-violet-500 to-purple-600 border-violet-400';
      case 'rose': return 'from-rose-500 to-pink-600 border-rose-400';
      case 'amber': return 'from-amber-500 to-orange-600 border-amber-400';
      case 'teal': return 'from-teal-500 to-cyan-600 border-teal-400';
      case 'emerald':
      default:
        return 'from-emerald-500 to-green-600 border-emerald-400';
    }
  };

  // Admin password editing states
  const [editingAdminPass, setEditingAdminPass] = useState(passwords.admin);
  const [showAdminPass, setShowAdminPass] = useState(false);

  // Student interface management states
  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id || '');
  const [studentSearchQuery, setStudentSearchQuery] = useState('');

  // Sharing center states inside Teacher & Student views
  const [selectedTeacherIdForShare, setSelectedTeacherIdForShare] = useState<string>(teachers[0]?.id || '');
  const [copiedText, setCopiedText] = useState(false);
  const [shareEmailInput, setShareEmailInput] = useState('');

  // Toast notification local fallback helper
  const [localToast, setLocalToast] = useState('');
  const showLocalToast = (msg: string) => {
    setLocalToast(msg);
    setTimeout(() => setLocalToast(''), 3000);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    showLocalToast('Đã sao chép vào bộ nhớ tạm!');
    setTimeout(() => setCopiedText(false), 2000);
  };

  // Excel template download and parsing handlers
  const handleDownloadExcelTemplate = () => {
    const headers = 'Họ tên giáo viên,Email đăng nhập,Số điện thoại,Khoa tổ chuyên môn,Môn giảng dạy,Trường học,Phân hiệu\n';
    const sampleRow = 'Hoàng Đức Quang,hoangquang1611@gmail.com,0987400704,Môn Toán,Tin học,Trường THCS Phước Thái,Phân hiệu 1\n';
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), headers + sampleRow], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'Mau_Danh_Sach_Giao_Vien.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showLocalToast('Đã tải mẫu Excel thành công!');
  };

  const handleImportExcelFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        if (lines.length <= 1) {
          showLocalToast('Lỗi: File trống hoặc không có dữ liệu giáo viên!');
          return;
        }
        const newTeachersList: TeacherAccount[] = [];
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''));
          if (cols.length >= 2 && cols[0] && cols[1]) {
            const randomDigits = Math.floor(100000 + Math.random() * 900000);
            const autoPassword = `gv@${randomDigits}`;
            newTeachersList.push({
              id: `t-excel-${Date.now()}-${i}`,
              name: cols[0],
              email: cols[1],
              password: autoPassword,
              phone: cols[2] || '',
              department: cols[3] || '',
              subject: cols[4] || '',
              school: cols[5] || 'Trường THCS Phước Thái',
              campus: cols[6] || 'Phân hiệu 1',
              status: 'active'
            });
          }
        }
        if (newTeachersList.length > 0) {
          onUpdateTeachers([...teachers, ...newTeachersList]);
          showLocalToast(`Đã nhập thành công ${newTeachersList.length} tài khoản giáo viên!`);
        } else {
          showLocalToast('Lỗi: Cấu trúc file không đúng mẫu!');
        }
      } catch (err) {
        showLocalToast('Lỗi khi đọc file CSV/Excel!');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleExportTeachersList = () => {
    if (teachers.length === 0) {
      showLocalToast('Lỗi: Danh sách giáo viên trống!');
      return;
    }

    const headers = 'Họ tên giáo viên,Email đăng nhập,Mật khẩu,Số điện thoại,Khoa tổ chuyên môn,Môn giảng dạy,Trường học,Phân hiệu,Trạng thái\n';
    
    const rows = teachers.map(t => {
      const escapedName = `"${t.name.replace(/"/g, '""')}"`;
      const escapedEmail = `"${t.email.replace(/"/g, '""')}"`;
      const escapedPass = `"${t.password.replace(/"/g, '""')}"`;
      const escapedPhone = `"${(t.phone || '').replace(/"/g, '""')}"`;
      const escapedDept = `"${(t.department || '').replace(/"/g, '""')}"`;
      const escapedSub = `"${(t.subject || '').replace(/"/g, '""')}"`;
      const escapedSchool = `"${(t.school || '').replace(/"/g, '""')}"`;
      const escapedCampus = `"${(t.campus || '').replace(/"/g, '""')}"`;
      const escapedStatus = t.status === 'suspended' ? '"Ngừng hoạt động"' : '"Đang hoạt động"';

      return `${escapedName},${escapedEmail},${escapedPass},${escapedPhone},${escapedDept},${escapedSub},${escapedSchool},${escapedCampus},${escapedStatus}`;
    }).join('\n');

    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'Danh_Sach_Giao_Vien_QuickQuiz.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showLocalToast(`Đã xuất thành công ${teachers.length} giáo viên!`);
  };

  // Create or edit teacher
  const handleSaveTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacherName || !teacherEmail || !teacherPassword) {
      showLocalToast('Lỗi: Vui lòng điền đủ Họ tên, Email và Mật khẩu!');
      return;
    }

    if (editingTeacherId) {
      const updated = teachers.map(t => {
        if (t.id === editingTeacherId) {
          return {
            ...t,
            name: teacherName,
            email: teacherEmail,
            password: teacherPassword,
            phone: teacherPhone,
            department: teacherDepartment,
            subject: teacherSubject,
            school: teacherSchool,
            campus: teacherCampus,
            status: teacherStatus,
          };
        }
        return t;
      });
      onUpdateTeachers(updated);
      showLocalToast('Cập nhật tài khoản Giáo viên thành công!');
    } else {
      const newTeacher: TeacherAccount = {
        id: `t-${Date.now()}`,
        name: teacherName,
        email: teacherEmail,
        password: teacherPassword,
        phone: teacherPhone,
        department: teacherDepartment,
        subject: teacherSubject,
        school: teacherSchool,
        campus: teacherCampus,
        status: teacherStatus,
      };
      onUpdateTeachers([...teachers, newTeacher]);
      showLocalToast('Tạo tài khoản Giáo viên mới thành công!');
    }

    resetTeacherForm();
  };

  const resetTeacherForm = () => {
    setIsAddingTeacher(false);
    setEditingTeacherId(null);
    setTeacherName('');
    setTeacherEmail('');
    setTeacherPassword('');
    setTeacherPhone('');
    setTeacherDepartment('');
    setTeacherSubject('');
    setTeacherSchool('');
    setTeacherCampus('');
    setTeacherStatus('active');
  };

  const handleEditTeacherClick = (t: TeacherAccount) => {
    setEditingTeacherId(t.id);
    setTeacherName(t.name);
    setTeacherEmail(t.email);
    setTeacherPassword(t.password);
    setTeacherPhone(t.phone || '');
    setTeacherDepartment(t.department || '');
    setTeacherSubject(t.subject || '');
    setTeacherSchool(t.school || '');
    setTeacherCampus(t.campus || '');
    setTeacherStatus(t.status || 'active');
    setIsAddingTeacher(true);
  };

  const handleDeleteTeacher = (id: string) => {
    if (teachers.length <= 1) {
      showLocalToast('Lỗi: Hệ thống phải duy trì ít nhất một tài khoản Giáo viên!');
      return;
    }
    setTeacherToDeleteId(id);
  };

  const handleForceSyncWithServer = async () => {
    try {
      const existing = localStorage.getItem('quickquiz-thcs-thpt-pro');
      let payload: any = {};
      if (existing) {
        payload = JSON.parse(existing);
      } else {
        payload = { teachers, classes, questions, assignments, submissions };
      }
      
      const isLocalOrPre = window.location.hostname === 'localhost' || window.location.hostname.includes('.run.app');
      let success = false;

      if (isLocalOrPre) {
        try {
          const res = await fetch('/api/sync-state', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          if (res.ok) success = true;
        } catch (e) {
          console.error('Express sync failed:', e);
        }
      } else {
        try {
          const res = await fetch('https://ais-dev-ak6xjrfx2wya5gr4qa7guj-179141037005.asia-southeast1.run.app/api/sync-state', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          if (res.ok) success = true;
        } catch (e) {
          console.error('Direct backend sync failed:', e);
        }
      }

      if (success) {
        showLocalToast('✔ ĐÃ ĐỒNG BỘ THÀNH CÔNG DỮ LIỆU ĐÁM MÂY!');
        setTimeout(() => window.location.reload(), 1500);
      } else {
        showLocalToast('Lỗi khi truyền đồng bộ đám mây!');
      }
    } catch (err) {
      showLocalToast('Có lỗi kết nối khi lưu trữ đồng bộ!');
    }
  };

  // Get count of students
  const totalStudentsCount = classes.reduce((sum, c) => sum + (c.students?.length || 0), 0);

  // Filter teachers
  const filteredTeachers = teachers.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (t.subject && t.subject.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Selected class for student viewer
  const selectedClassObj = classes.find(c => c.id === selectedClassId) || classes[0];
  const filteredStudents = selectedClassObj?.students.filter(s => 
    s.name.toLowerCase().includes(studentSearchQuery.toLowerCase()) ||
    s.id.toLowerCase().includes(studentSearchQuery.toLowerCase())
  ) || [];

  // Selected teacher for sharing
  const selectedTeacherObj = teachers.find(t => t.id === selectedTeacherIdForShare) || teachers[0];

  const getShareableAppUrl = () => {
    const origin = window.location.origin;
    if (origin.includes('-dev-')) {
      return origin.replace('-dev-', '-pre-');
    }
    return origin;
  };

  const teacherInviteMsg = selectedTeacherObj ? `Kính gửi Thầy/Cô ${selectedTeacherObj.name},

Tôi xin phép chia sẻ ứng dụng tổ chức kiểm tra QuickQuiz kèm thông tin tài khoản đăng nhập dành riêng cho Thầy/Cô:
- Địa chỉ ứng dụng: ${getShareableAppUrl()}
- Vai trò truy cập: Giáo viên
- Email đăng nhập: ${selectedTeacherObj.email}
- Mật khẩu: ${selectedTeacherObj.password}

Thầy/Cô có thể đổi mật khẩu cá nhân tại mục "Cài đặt & Sao lưu" sau khi đăng nhập. Trân trọng!` : '';

  const studentInviteMsg = selectedClassObj ? `Thông báo gửi các em học sinh lớp ${selectedClassObj.name} (${selectedClassObj.subject}):

Để tham gia phòng luyện tập trắc nghiệm và tự luận trực tuyến trên QuickQuiz:
1. Truy cập: ${getShareableAppUrl()}
2. Chọn "Học sinh"
3. Nhập mật khẩu lớp: ${selectedClassObj.joinPass}
4. Chọn đúng tên trong danh sách lớp và nhập mật khẩu học sinh tương ứng.

Chúc các em học tập thật tốt!` : '';

  return (
    <div className="space-y-6 font-sans select-none">
      {/* Toast Notification */}
      {localToast && (
        <div className="fixed top-4 right-4 bg-slate-900 text-emerald-400 border border-emerald-500/30 px-4 py-2.5 rounded-xl text-xs font-bold shadow-2xl z-50 animate-bounce flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-400" />
          {localToast}
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-150 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-100 rounded-xl text-emerald-700">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-800">Quản Trị Hệ Thống</h1>
            <p className="text-xs text-slate-500 font-medium">
              Quản lý tập trung 2 giao diện chuyên biệt: **Giáo Viên** & **Học Sinh**
            </p>
          </div>
        </div>

        {/* Stats & Admin Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-center min-w-[80px]">
            <span className="block text-[9px] text-slate-400 font-black uppercase">Giáo Viên</span>
            <span className="text-xs font-black text-slate-800">{teachers.length}</span>
          </div>
          <div className="bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-center min-w-[80px]">
            <span className="block text-[9px] text-slate-400 font-black uppercase">Học Sinh</span>
            <span className="text-xs font-black text-slate-800">{totalStudentsCount}</span>
          </div>
          <div className="bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-center min-w-[80px]">
            <span className="block text-[9px] text-slate-400 font-black uppercase">Phòng Lớp</span>
            <span className="text-xs font-black text-slate-800">{classes.length}</span>
          </div>

          <button
            onClick={() => setShowAdminSettingsModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
            title="Cấu hình mật khẩu Admin, thông tin hiển thị & Reset hệ thống"
          >
            <Settings className="w-3.5 h-3.5 text-emerald-400" />
            Cài đặt Admin
          </button>

          <button
            onClick={handleForceSyncWithServer}
            className="flex items-center gap-1.5 px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
            title="Đồng bộ ngay dữ liệu lên server cloud"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Đồng bộ Cloud
          </button>

          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
            title="Đăng xuất khỏi quyền Quản trị"
          >
            <LogOut className="w-3.5 h-3.5" />
            Đăng xuất
          </button>
        </div>
      </div>

      {/* Main 2-Interface Management Tabs */}
      <div className="flex border-b border-slate-200 gap-2">
        <button
          onClick={() => { setActiveTab('teachers'); resetTeacherForm(); }}
          className={`px-5 py-3 font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 border-b-2 cursor-pointer ${
            activeTab === 'teachers'
              ? 'border-emerald-600 text-emerald-600 bg-emerald-50/40 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4 text-emerald-600" />
          1. Giao diện & Tài Khoản Giáo Viên ({teachers.length})
        </button>

        <button
          onClick={() => setActiveTab('students')}
          className={`px-5 py-3 font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 border-b-2 cursor-pointer ${
            activeTab === 'students'
              ? 'border-emerald-600 text-emerald-600 bg-emerald-50/40 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <GraduationCap className="w-4 h-4 text-indigo-600" />
          2. Giao diện & Phòng Lớp Học Sinh ({totalStudentsCount} HS)
        </button>
      </div>

      {/* TAB 1: TEACHER INTERFACE MANAGEMENT */}
      {activeTab === 'teachers' && (
        <div className="space-y-6">
          {!isAddingTeacher ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Tìm tên giáo viên, email hoặc bộ môn..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 pr-4 py-2 text-xs w-full bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-700 font-bold"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={handleDownloadExcelTemplate}
                    type="button"
                    className="px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 font-black text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    Mẫu Excel
                  </button>

                  <label className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-black text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer">
                    <Database className="w-3.5 h-3.5" />
                    Nhập Excel
                    <input
                      type="file"
                      accept=".csv,.txt"
                      onChange={handleImportExcelFile}
                      className="hidden"
                    />
                  </label>

                  <button
                    onClick={handleExportTeachersList}
                    type="button"
                    className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-black text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    Xuất danh sách GV
                  </button>

                  <button
                    onClick={() => {
                      resetTeacherForm();
                      setIsAddingTeacher(true);
                    }}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    Tạo Giáo Viên Mới
                  </button>
                </div>
              </div>

              {/* Teachers table */}
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-400 text-[10px] uppercase font-black tracking-wider border-b border-slate-200">
                      <th className="px-4 py-3">Họ Tên Giáo Viên</th>
                      <th className="px-4 py-3">Email Đăng Nhập</th>
                      <th className="px-4 py-3">Mật Khẩu</th>
                      <th className="px-4 py-3">Bộ Môn / Trường</th>
                      <th className="px-4 py-3 text-center">Trạng Thái</th>
                      <th className="px-4 py-3 text-center">Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs text-slate-700 font-bold">
                    {filteredTeachers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-8 text-slate-400 font-medium">
                          Không tìm thấy tài khoản Giáo viên nào phù hợp.
                        </td>
                      </tr>
                    ) : (
                      filteredTeachers.map((t) => (
                        <tr key={t.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-extrabold uppercase text-xs">
                                {t.name.charAt(0)}
                              </div>
                              <div>
                                <span className="block text-slate-800 font-black">{t.name}</span>
                                <span className="block text-[10px] text-slate-400 font-semibold">{t.phone || 'SĐT: Chưa có'}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3.5 font-mono text-slate-600 text-[11px]">{t.email}</td>
                          <td className="px-4 py-3.5 font-mono text-zinc-600">
                            <span className="bg-slate-100 px-2 py-0.5 rounded text-[11px] font-bold border">{t.password}</span>
                          </td>
                          <td className="px-4 py-3.5">
                            <span className="block text-slate-700 font-black">{t.subject || 'Đa môn'}</span>
                            <span className="block text-[10px] text-slate-400 font-semibold">
                              {t.school || 'Trường THCS'} {t.campus ? ` - ${t.campus}` : ''}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            <button
                              type="button"
                              onClick={() => {
                                const nextStatus: 'active' | 'suspended' = t.status === 'suspended' ? 'active' : 'suspended';
                                const updated = teachers.map(teacher => {
                                  if (teacher.id === t.id) {
                                    return { ...teacher, status: nextStatus };
                                  }
                                  return teacher;
                                });
                                onUpdateTeachers(updated);
                                showLocalToast(`Đã ${nextStatus === 'suspended' ? 'ngừng hoạt động' : 'kích hoạt'} giáo viên: ${t.name}`);
                              }}
                              className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider cursor-pointer transition-all border ${
                                t.status === 'suspended'
                                  ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                                  : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                              }`}
                            >
                              {t.status === 'suspended' ? 'Tạm khóa' : 'Đang hoạt động'}
                            </button>
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => handleEditTeacherClick(t)}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                title="Chỉnh sửa"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteTeacher(t.id)}
                                className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title="Xóa tài khoản"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Share & Invite card for Teachers */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <Mail className="w-4 h-4 text-emerald-600" />
                  Gửi Thông Tin Đăng Nhập Cho Giáo Viên
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block text-[10px] text-slate-400 font-extrabold uppercase mb-1">Chọn tài khoản GV</label>
                    <select
                      value={selectedTeacherIdForShare}
                      onChange={(e) => setSelectedTeacherIdForShare(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-200 rounded-xl text-slate-800 font-bold"
                    >
                      {teachers.map(t => (
                        <option key={t.id} value={t.id}>{t.name} ({t.email})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 font-extrabold uppercase mb-1">Email nhận thư</label>
                    <input
                      type="email"
                      value={shareEmailInput || selectedTeacherObj?.email || ''}
                      onChange={(e) => setShareEmailInput(e.target.value)}
                      placeholder="Email nhận thư..."
                      className="w-full p-2 bg-white border border-slate-200 rounded-xl text-slate-800 font-mono text-xs font-bold"
                    />
                  </div>

                  <div className="flex items-end gap-2">
                    <a
                      href={`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(shareEmailInput || selectedTeacherObj?.email || '')}&su=${encodeURIComponent('Thông tin đăng nhập QuickQuiz Giáo viên')}&body=${encodeURIComponent(teacherInviteMsg)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-[11px] rounded-xl flex items-center justify-center gap-1 transition-all shadow-xs text-center cursor-pointer"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      Gmail Web
                    </a>

                    <button
                      type="button"
                      onClick={() => handleCopy(teacherInviteMsg)}
                      className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[11px] rounded-xl flex items-center justify-center gap-1 transition-all cursor-pointer shadow-xs"
                    >
                      {copiedText ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      Sao Chép Thư
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Teacher Form Add/Edit */
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 max-w-2xl mx-auto">
              <h3 className="font-extrabold text-slate-800 text-sm border-b pb-3 mb-4 uppercase tracking-wider flex items-center gap-1.5">
                {editingTeacherId ? <Edit2 className="w-4 h-4 text-emerald-600" /> : <Plus className="w-4 h-4 text-emerald-600" />}
                {editingTeacherId ? 'Cập Nhật Tài Khoản Giáo Viên' : 'Tạo Tài Khoản Giáo Viên Mới'}
              </h3>

              <form onSubmit={handleSaveTeacher} className="space-y-4 text-xs font-semibold">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-slate-500 block">Họ và Tên giáo viên *</label>
                    <input
                      type="text"
                      required
                      value={teacherName}
                      onChange={(e) => setTeacherName(e.target.value)}
                      placeholder="Thầy/Cô Nguyễn Văn A"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-slate-500 block">Số điện thoại</label>
                    <input
                      type="text"
                      value={teacherPhone}
                      onChange={(e) => setTeacherPhone(e.target.value)}
                      placeholder="0912345678"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-slate-500 block">Email đăng nhập *</label>
                    <input
                      type="email"
                      required
                      value={teacherEmail}
                      onChange={(e) => setTeacherEmail(e.target.value)}
                      placeholder="teacher@quickquiz.vn"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-slate-500 block">Mật khẩu ban đầu *</label>
                    <div className="relative">
                      <input
                        type={showTeacherPass ? 'text' : 'password'}
                        required
                        value={teacherPassword}
                        onChange={(e) => setTeacherPassword(e.target.value)}
                        placeholder="Mật khẩu"
                        className="w-full pl-3 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowTeacherPass(!showTeacherPass)}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                      >
                        {showTeacherPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-slate-500 block">Trường học phụ trách</label>
                    <input
                      type="text"
                      value={teacherSchool}
                      onChange={(e) => setTeacherSchool(e.target.value)}
                      placeholder="Trường THCS Phước Thái"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-slate-500 block">Môn giảng dạy</label>
                    <input
                      type="text"
                      value={teacherSubject}
                      onChange={(e) => setTeacherSubject(e.target.value)}
                      placeholder="Toán, Tin học..."
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-bold"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t">
                  <button
                    type="button"
                    onClick={resetTeacherForm}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl cursor-pointer"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md flex items-center gap-1 cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    Lưu Tài Khoản
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: STUDENT INTERFACE MANAGEMENT */}
      {activeTab === 'students' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Class selection column */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 shadow-xs">
              <h3 className="font-black text-slate-800 text-xs uppercase tracking-wider border-b pb-2 flex items-center justify-between">
                <span>Phòng Lớp Học ({classes.length})</span>
                <span className="text-[10px] text-slate-400 font-bold">Tổng {totalStudentsCount} HS</span>
              </h3>
              <div className="space-y-1.5 max-h-[380px] overflow-y-auto pr-1">
                {classes.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedClassId(c.id)}
                    className={`w-full text-left p-3 rounded-xl text-xs font-bold transition-all flex justify-between items-center cursor-pointer border ${
                      selectedClassId === c.id
                        ? 'bg-indigo-50 border-indigo-200 text-indigo-900 shadow-2xs'
                        : 'bg-white border-slate-100 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <div>
                      <span className="block text-slate-800 font-black">{c.name}</span>
                      <span className="block text-[10px] text-slate-400 font-semibold">Môn: {c.subject}</span>
                    </div>
                    <div className="text-right">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-indigo-100 text-indigo-700">
                        {c.students?.length || 0} HS
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Student list viewer for selected class */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 md:col-span-2 space-y-4 shadow-xs">
              <div className="border-b pb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <h3 className="font-black text-slate-800 text-sm flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-indigo-600" />
                    Thành viên lớp: {selectedClassObj?.name || '---'} ({selectedClassObj?.subject})
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                    Mật khẩu tham gia lớp (Join Pass): <span className="bg-slate-800 text-emerald-400 font-bold px-2 py-0.5 rounded ml-1 font-mono text-[11px]">{selectedClassObj?.joinPass || '---'}</span>
                  </p>
                </div>

                <div className="relative w-full max-w-xs">
                  <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Tìm tên học sinh..."
                    value={studentSearchQuery}
                    onChange={(e) => setStudentSearchQuery(e.target.value)}
                    className="pl-8 pr-3 py-1.5 text-[11px] w-full bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-700 font-bold"
                  />
                </div>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-400 text-[10px] uppercase font-black tracking-wider border-b border-slate-200">
                      <th className="px-4 py-2.5">Mã HS</th>
                      <th className="px-4 py-2.5">Họ Tên Học Sinh</th>
                      <th className="px-4 py-2.5">Mật Khẩu Đăng Nhập</th>
                      <th className="px-4 py-2.5 text-right">Lớp Phụ Trách</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs text-slate-700 font-bold">
                    {filteredStudents.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="text-center py-8 text-slate-400 font-medium">
                          Không có học sinh nào trong phòng lớp này.
                        </td>
                      </tr>
                    ) : (
                      filteredStudents.map((s) => {
                        const calculatedPass = s.password || generateStudentPassword(s.name);
                        return (
                          <tr key={s.id} className="hover:bg-slate-50/60 transition-colors">
                            <td className="px-4 py-2.5 font-mono text-slate-400 text-[10px]">{s.id}</td>
                            <td className="px-4 py-2.5 text-slate-800 font-black flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                              {s.name}
                            </td>
                            <td className="px-4 py-2.5">
                              <div className="flex items-center gap-2">
                                <span className="bg-slate-100 border px-2 py-0.5 rounded font-mono text-zinc-600 tracking-wider text-[11px]">
                                  {calculatedPass}
                                </span>
                                {s.password ? (
                                  <span className="text-[9px] bg-emerald-50 text-emerald-600 border border-emerald-200 px-1.5 py-0.2 rounded font-black uppercase">Tự tạo</span>
                                ) : (
                                  <span className="text-[9px] bg-indigo-50 text-indigo-600 border border-indigo-200 px-1.5 py-0.2 rounded font-black uppercase">Mặc định</span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-2.5 text-right text-slate-500 text-[11px]">
                              {selectedClassObj?.name}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Share & Invite card for Student Room */}
              <div className="bg-indigo-50/60 p-4 rounded-2xl border border-indigo-150 space-y-3">
                <h4 className="text-xs font-black text-indigo-900 uppercase tracking-wider flex items-center justify-between">
                  <span>Thông Báo Hướng Dẫn Tham Gia Lớp Cho Học Sinh</span>
                  <button
                    onClick={() => handleCopy(studentInviteMsg)}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-[10px] rounded-lg transition-all cursor-pointer shadow-xs border-none flex items-center gap-1"
                  >
                    {copiedText ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    Sao Chép Thông Báo Lớp
                  </button>
                </h4>

                <textarea
                  readOnly
                  rows={4}
                  value={studentInviteMsg}
                  className="w-full p-2.5 bg-white border border-indigo-200 rounded-xl font-mono text-[11px] text-slate-700 leading-relaxed focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADMIN SETTINGS & SECURITY MODAL */}
      {showAdminSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-5 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2 text-slate-800">
                <UserCog className="w-5 h-5 text-emerald-600" />
                <h2 className="text-base font-black uppercase tracking-wider">Cấu Hình & Mật Mã Quản Trị</h2>
              </div>
              <button
                onClick={() => setShowAdminSettingsModal(false)}
                className="text-slate-400 hover:text-slate-700 font-extrabold text-sm border-none bg-transparent cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs font-semibold text-slate-700">
              {/* Admin Profile */}
              <div className="space-y-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider text-emerald-700">Tài khoản & Tên hiển thị</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-slate-400 uppercase font-black mb-1">Tên hiển thị Admin</label>
                    <input
                      type="text"
                      value={adminName}
                      onChange={(e) => setAdminName(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-200 rounded-xl font-bold text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 uppercase font-black mb-1">Email liên hệ</label>
                    <input
                      type="email"
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-200 rounded-xl font-bold text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Password change */}
              <div className="space-y-2 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider text-emerald-700">Đổi mật mã Admin</h3>
                <div>
                  <label className="block text-[10px] text-slate-400 uppercase font-black mb-1">Mật khẩu Admin mới</label>
                  <div className="relative">
                    <input
                      type={showAdminPass ? 'text' : 'password'}
                      value={editingAdminPass}
                      onChange={(e) => setEditingAdminPass(e.target.value)}
                      className="w-full pl-3 pr-10 py-2 bg-white border border-slate-200 rounded-xl font-bold font-mono text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowAdminPass(!showAdminPass)}
                      className="absolute right-3 top-2.5 text-slate-400"
                    >
                      {showAdminPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Reset baseline */}
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl space-y-2">
                <div className="flex items-center gap-1.5 text-rose-700 font-extrabold">
                  <FileWarning className="w-4 h-4 text-rose-600" />
                  <span>Khôi phục Baseline gốc Bộ GD</span>
                </div>
                <p className="text-[10.5px] text-rose-800/80 leading-relaxed font-medium">
                  Xóa các bài làm tự chọn cục bộ và cài lại dữ liệu mẫu chuẩn của Bộ GD-ĐT.
                </p>
                <button
                  onClick={() => {
                    setShowAdminSettingsModal(false);
                    onResetSystem();
                  }}
                  className="w-full py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs rounded-xl cursor-pointer border-none shadow-xs uppercase"
                >
                  Khôi phục dữ liệu gốc
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                onClick={() => {
                  if (adminName.trim()) {
                    onUpdateAdminProfile({
                      name: adminName.trim(),
                      email: adminEmail.trim(),
                      avatarColor: adminAvatarColor,
                    });
                  }
                  if (editingAdminPass.trim()) {
                    onUpdatePassword('admin', editingAdminPass.trim());
                  }
                  showLocalToast('Đã lưu cấu hình Quản trị thành công!');
                  setShowAdminSettingsModal(false);
                }}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md cursor-pointer border-none uppercase"
              >
                Lưu Thay Đổi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Teacher Delete Confirm Modal */}
      {teacherToDeleteId && (() => {
        const targetTeacher = teachers.find(t => t.id === teacherToDeleteId);
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4">
            <div className="bg-[#1e2530] text-slate-100 border border-slate-700 rounded-2xl shadow-2xl max-w-sm w-full p-6 space-y-4">
              <div className="flex items-center gap-2 text-rose-500">
                <Trash2 className="w-6 h-6 shrink-0" />
                <h3 className="text-sm font-black uppercase tracking-wider">Xác nhận xóa tài khoản</h3>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-semibold">
                Bạn có chắc chắn muốn xóa tài khoản Giáo viên <strong className="text-emerald-400 font-bold">{targetTeacher?.name}</strong> không?
              </p>
              <div className="flex gap-2 justify-end pt-2 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setTeacherToDeleteId(null)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg cursor-pointer border border-slate-700"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (teacherToDeleteId) {
                      const filtered = teachers.filter(t => t.id !== teacherToDeleteId);
                      onUpdateTeachers(filtered);
                      showLocalToast(`Đã xóa tài khoản giáo viên: ${targetTeacher?.name || ''}`);
                    }
                    setTeacherToDeleteId(null);
                  }}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg cursor-pointer border-none"
                >
                  Xác nhận xóa
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
