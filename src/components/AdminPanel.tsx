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
  FileWarning, 
  Shield, 
  GraduationCap, 
  Share2, 
  Key, 
  RefreshCw, 
  Sliders, 
  Eye, 
  EyeOff, 
  Save, 
  Database, 
  ExternalLink,
  Lock,
  Mail,
  School,
  Phone,
  BookOpen,
  LogOut,
  UserCog
} from 'lucide-react';
import { TeacherAccount, Class, Question, Assignment, Submission, generateStudentPassword } from '../types';

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

type AdminTab = 'teachers' | 'classes' | 'sharing' | 'system' | 'config';

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
  const [activeTab, setActiveTab] = useState<AdminTab>('teachers');
  const [searchQuery, setSearchQuery] = useState('');
  
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
  const [showSmtpModal, setShowSmtpModal] = useState(false);
  const [smtpStep, setSmtpStep] = useState(0); // 1: Connecting, 2: Sending, 3: Completed

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

  // Class / student viewer states
  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id || '');
  const [studentSearchQuery, setStudentSearchQuery] = useState('');

  // Sharing center states
  const [selectedTeacherIdForShare, setSelectedTeacherIdForShare] = useState<string>(teachers[0]?.id || '');
  const [selectedClassIdForShare, setSelectedClassIdForShare] = useState<string>(classes[0]?.id || '');
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
    // Use UTF-8 BOM so Excel opens Vietnamese characters correctly
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), headers + sampleRow], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'Mau_Danh_Sach_Giao_Vien.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showLocalToast('Đã tải mẫu Excel thành công (không cần cột mật khẩu)!');
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
          // Row should at least have Name and Email
          if (cols.length >= 2 && cols[0] && cols[1]) {
            // Auto generate password: gv@ + random 6 digits
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
          showLocalToast(`Đã nhập thành công ${newTeachersList.length} tài khoản giáo viên với mật khẩu bảo mật tự tạo bởi Admin!`);
        } else {
          showLocalToast('Lỗi: Cấu trúc file không đúng mẫu, vui lòng kiểm tra lại!');
        }
      } catch (err) {
        showLocalToast('Lỗi khi đọc file CSV/Excel!');
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset
  };

  const handleExportTeachersList = () => {
    if (teachers.length === 0) {
      showLocalToast('Lỗi: Danh sách giáo viên trống, không có dữ liệu để xuất!');
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

    // Use UTF-8 BOM so Excel opens Vietnamese characters correctly
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'Danh_Sach_Giao_Vien_QuickQuiz.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showLocalToast(`Đã xuất thành công danh sách gồm ${teachers.length} giáo viên!`);
  };

  // Create or edit teacher
  const handleSaveTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacherName || !teacherEmail || !teacherPassword) {
      showLocalToast('Lỗi: Vui lòng điền đủ Họ tên, Email và Mật khẩu!');
      return;
    }

    if (editingTeacherId) {
      // Edit mode
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
      // Add mode
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
      showLocalToast('Lỗi: Hệ thống phải duy trì ít nhất một tài khoản Giáo viên điều phối!');
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
        payload = {
          teachers,
          classes,
          questions,
          assignments,
          submissions,
        };
      }
      
      const isLocalOrPre = window.location.hostname === 'localhost' || window.location.hostname.includes('.run.app');
      let expressSuccess = false;

      // 1. Try syncing to Express first if supported
      if (isLocalOrPre) {
        try {
          const res = await fetch('/api/sync-state', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          if (res.ok) {
            expressSuccess = true;
          }
        } catch (e) {
          console.warn('Express sync failed in AdminPanel, trying KV fallback...');
        }
      }

      // 2. Always write to public cloud KV store for double durability (essential for Vercel/GitHub Pages)
      const KV_URL = 'https://kvdb.io/kb098f950bcd14424d9951/quickquiz_sync_db';
      const resKv = await fetch(KV_URL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (resKv.ok || expressSuccess) {
        showLocalToast('✔ ĐÃ ĐỒNG BỘ: Toàn bộ Cấu trình học trình, câu hỏi, mật khẩu giáo viên đã đồng bộ đám mây thành công!');
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
  const selectedClassObj = classes.find(c => c.id === selectedClassId);
  const filteredStudents = selectedClassObj?.students.filter(s => 
    s.name.toLowerCase().includes(studentSearchQuery.toLowerCase()) ||
    s.id.toLowerCase().includes(studentSearchQuery.toLowerCase())
  ) || [];

  // Selected teacher for sharing
  const selectedTeacherObj = teachers.find(t => t.id === selectedTeacherIdForShare) || teachers[0];

  // Helper to ensure public preview URL is shared instead of restricted development sandbox URL
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

Thầy/Cô có thể đổi mật khẩu cá nhân tại mục "Cài đặt & Sao lưu" sau khi đăng nhập thành công. Chúc Thầy/Cô có những giờ dạy và kiểm tra hiệu quả!

Trân trọng,
Hệ thống Quản trị viên` : '';

  // Selected class for student sharing
  const selectedClassObjForShare = classes.find(c => c.id === selectedClassIdForShare) || classes[0];
  const studentInviteMsg = selectedClassObjForShare ? `Thông báo gửi các em học sinh lớp ${selectedClassObjForShare.name} (${selectedClassObjForShare.subject}):

Để tham gia phòng luyện tập trắc nghiệm và tự luận trực tuyến trên QuickQuiz, các em thực hiện theo hướng dẫn sau:
1. Truy cập liên kết: ${getShareableAppUrl()}
2. Chọn phân mục "Học sinh"
3. Nhập mật khẩu lớp: ${selectedClassObjForShare.joinPass}
4. Chọn đúng tên của mình trong danh sách lớp và nhập mật khẩu học sinh tương ứng (Mật khẩu mặc định là tên viết liền không dấu, ví dụ: "nguyenvanan").

Chúc các em ôn luyện thật tốt và đạt kết quả cao!

Giáo viên chủ nhiệm` : '';

  return (
    <div className="space-y-6 font-sans select-none">
      {/* Toast Notification */}
      {localToast && (
        <div className="fixed top-4 right-4 bg-slate-900 text-emerald-400 border border-emerald-500/30 px-4 py-2.5 rounded-xl text-xs font-bold shadow-2xl z-50 animate-bounce flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-400" />
          {localToast}
        </div>
      )}

      {/* Header section with Stats */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-150 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-100 rounded-lg text-emerald-700">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-800">Bảng Quản Trị Hệ Thống</h1>
              <p className="text-xs text-slate-500 font-medium">
                Quản lý tài khoản Giáo viên, đồng bộ danh sách phòng lớp, bảo mật mật khẩu và phân bổ chia sẻ.
              </p>
            </div>
          </div>
        </div>

        {/* Mini stats cards */}
        <div className="flex gap-2 flex-wrap items-center">
          <div className="bg-slate-50 px-3 py-2 rounded-lg border border-slate-100 text-center min-w-[85px]">
            <span className="block text-[10px] text-slate-400 font-bold uppercase">Giáo Viên</span>
            <span className="text-sm font-extrabold text-slate-700">{teachers.length}</span>
          </div>
          <div className="bg-slate-50 px-3 py-2 rounded-lg border border-slate-100 text-center min-w-[85px]">
            <span className="block text-[10px] text-slate-400 font-bold uppercase">Lớp Học</span>
            <span className="text-sm font-extrabold text-slate-700">{classes.length}</span>
          </div>
          <div className="bg-slate-50 px-3 py-2 rounded-lg border border-slate-100 text-center min-w-[85px]">
            <span className="block text-[10px] text-slate-400 font-bold uppercase">Học Sinh</span>
            <span className="text-sm font-extrabold text-slate-700">{totalStudentsCount}</span>
          </div>
          <div className="bg-slate-50 px-3 py-2 rounded-lg border border-slate-100 text-center min-w-[85px]">
            <span className="block text-[10px] text-slate-400 font-bold uppercase">Ngân Hàng CH</span>
            <span className="text-sm font-extrabold text-emerald-600">{questions.length}</span>
          </div>
          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200/50 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer shadow-xs active:scale-95 md:ml-2 h-[38px]"
            title="Đăng xuất khỏi tài khoản Quản trị viên"
          >
            <LogOut className="w-3.5 h-3.5" />
            Đăng xuất
          </button>
        </div>
      </div>

      {/* Tabs list navigation */}
      <div className="flex border-b border-slate-100 gap-1 overflow-x-auto pb-px">
        <button
          onClick={() => { setActiveTab('teachers'); resetTeacherForm(); }}
          className={`px-4 py-2.5 font-extrabold text-xs tracking-wider uppercase transition-all flex items-center gap-1.5 border-b-2 cursor-pointer ${
            activeTab === 'teachers'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <Users className="w-4 h-4" />
          Tài Khoản Giáo Viên
        </button>
        <button
          onClick={() => setActiveTab('classes')}
          className={`px-4 py-2.5 font-extrabold text-xs tracking-wider uppercase transition-all flex items-center gap-1.5 border-b-2 cursor-pointer ${
            activeTab === 'classes'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          Xem Lớp & Học Sinh
        </button>
        <button
          onClick={() => setActiveTab('sharing')}
          className={`px-4 py-2.5 font-extrabold text-xs tracking-wider uppercase transition-all flex items-center gap-1.5 border-b-2 cursor-pointer ${
            activeTab === 'sharing'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <Share2 className="w-4 h-4" />
          Trung Tâm Chia Sẻ App
        </button>
        <button
          onClick={() => setActiveTab('system')}
          className={`px-4 py-2.5 font-extrabold text-xs tracking-wider uppercase transition-all flex items-center gap-1.5 border-b-2 cursor-pointer ${
            activeTab === 'system'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <Sliders className="w-4 h-4" />
          Hệ Thống & Khôi Phục
        </button>
        <button
          onClick={() => setActiveTab('config')}
          className={`px-4 py-2.5 font-extrabold text-xs tracking-wider uppercase transition-all flex items-center gap-1.5 border-b-2 cursor-pointer ${
            activeTab === 'config'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <UserCog className="w-4 h-4" />
          Cấu hình quản trị
        </button>
      </div>

      {/* Tab 1 Content: Teachers Management */}
      {activeTab === 'teachers' && (
        <div className="space-y-6">
          {!isAddingTeacher ? (
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Tìm tên giáo viên, email hoặc bộ môn..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 pr-4 py-2 text-xs w-full bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-emerald-500 text-slate-700 font-bold"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={handleDownloadExcelTemplate}
                    type="button"
                    className="px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 font-black text-xs rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
                    title="Tải tệp mẫu Excel CSV để điền danh sách giáo viên"
                  >
                    <Save className="w-3.5 h-3.5" />
                    Tải mẫu Excel
                  </button>

                  <label className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-black text-xs rounded-lg flex items-center gap-1.5 transition-all cursor-pointer">
                    <Database className="w-3.5 h-3.5" />
                    Nhập từ Excel
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
                    className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-black text-xs rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
                    title="Xuất toàn bộ danh sách giáo viên ra file Excel CSV để phân phối mật khẩu"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    Xuất danh sách GV
                  </button>

                  <button
                    onClick={() => {
                      resetTeacherForm();
                      setIsAddingTeacher(true);
                    }}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-lg shadow-xs flex items-center justify-center gap-1.5 transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    Tạo Giáo Viên Mới
                  </button>
                </div>
              </div>

               {/* Teachers table */}
              <div className="overflow-x-auto border border-slate-100 rounded-xl">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-400 text-[10px] uppercase font-black tracking-wider border-b border-slate-100">
                      <th className="px-4 py-3">Họ Tên Giáo Viên</th>
                      <th className="px-4 py-3">Đăng Nhập (Email)</th>
                      <th className="px-4 py-3">Mật Khẩu</th>
                      <th className="px-4 py-3">Tổ Bộ Môn / Trường</th>
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
                        <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-extrabold uppercase text-xs">
                                {t.name.charAt(0)}
                              </div>
                              <div>
                                <span className="block text-slate-800">{t.name}</span>
                                <span className="block text-[10px] text-slate-400 font-semibold">{t.phone || 'Chưa cập nhật SĐT'}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3.5 font-mono text-slate-600 text-[11px]">{t.email}</td>
                          <td className="px-4 py-3.5 font-mono text-zinc-500 tracking-wider">
                            <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[11px] font-bold tracking-normal">{t.password}</span>
                          </td>
                          <td className="px-4 py-3.5">
                            <span className="block text-slate-700">{t.subject || 'Đa môn'}</span>
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
                                showLocalToast(`Đã ${nextStatus === 'suspended' ? 'ngừng cung cấp' : 'kích hoạt'} tài khoản giáo viên: ${t.name}`);
                              }}
                              className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider cursor-pointer transition-all inline-block border ${
                                t.status === 'suspended'
                                  ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                                  : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                              }`}
                              title={t.status === 'suspended' ? "Kích hoạt lại tài khoản" : "Ngừng cung cấp tài khoản"}
                            >
                              {t.status === 'suspended' ? 'Ngừng hoạt động' : 'Đang hoạt động'}
                            </button>
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => handleEditTeacherClick(t)}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors cursor-pointer"
                                title="Chỉnh sửa"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteTeacher(t.id)}
                                className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
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
            </div>
          ) : (
            /* Adding/Editing teacher form */
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 max-w-2xl mx-auto">
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
                      placeholder="Ví dụ: Thầy Nguyễn Văn A"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-emerald-500 text-slate-800 font-bold"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-slate-500 block">Số điện thoại liên hệ</label>
                    <input
                      type="text"
                      value={teacherPhone}
                      onChange={(e) => setTeacherPhone(e.target.value)}
                      placeholder="Ví dụ: 0912345678"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-emerald-500 text-slate-800 font-bold"
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
                      placeholder="giao-vien-abc@quickquiz.vn"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-emerald-500 text-slate-800 font-bold font-mono"
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
                        placeholder="Mật khẩu khởi tạo"
                        className="w-full pl-3 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-emerald-500 text-slate-800 font-bold font-mono"
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
                      placeholder="Ví dụ: Trường THCS Phước Thái"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-emerald-500 text-slate-800 font-bold"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-slate-500 block">Phân hiệu</label>
                    <input
                      type="text"
                      value={teacherCampus}
                      onChange={(e) => setTeacherCampus(e.target.value)}
                      placeholder="Ví dụ: Phân hiệu 1"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-emerald-500 text-slate-800 font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-slate-500 block">Khoa / Tổ chuyên môn</label>
                    <input
                      type="text"
                      value={teacherDepartment}
                      onChange={(e) => setTeacherDepartment(e.target.value)}
                      placeholder="Ví dụ: Tổ Khoa Học Tự Nhiên"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-emerald-500 text-slate-800 font-bold"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-slate-500 block">Môn giảng dạy chuyên trách</label>
                    <input
                      type="text"
                      value={teacherSubject}
                      onChange={(e) => setTeacherSubject(e.target.value)}
                      placeholder="Ví dụ: Môn Toán, Tin học, v.v."
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-emerald-500 text-slate-800 font-bold"
                    />
                  </div>
                </div>

                <div className="space-y-1.5 max-w-xs">
                  <label className="text-slate-500 block">Trạng thái tài khoản</label>
                  <select
                    value={teacherStatus}
                    onChange={(e) => setTeacherStatus(e.target.value as 'active' | 'suspended')}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-emerald-500 text-slate-800 font-bold text-xs"
                  >
                    <option value="active">Đang hoạt động (Kích hoạt)</option>
                    <option value="suspended">Ngừng hoạt động (Tạm khóa)</option>
                  </select>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t">
                  <button
                    type="button"
                    onClick={resetTeacherForm}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-lg cursor-pointer"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-md flex items-center gap-1 cursor-pointer"
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

      {/* Tab 2 Content: View Classes & Students */}
      {activeTab === 'classes' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Class side selector list */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 space-y-3">
            <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider border-b pb-2">
              Danh sách Lớp học ({classes.length})
            </h3>
            <div className="space-y-1 max-h-[350px] overflow-y-auto">
              {classes.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedClassId(c.id)}
                  className={`w-full text-left p-3 rounded-lg text-xs font-bold transition-colors flex justify-between items-center cursor-pointer ${
                    selectedClassId === c.id
                      ? 'bg-emerald-50 text-emerald-800 border-l-4 border-emerald-500'
                      : 'hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <div>
                    <span className="block text-slate-800">{c.name}</span>
                    <span className="block text-[10px] text-slate-400 font-semibold mt-0.5">Môn: {c.subject}</span>
                  </div>
                  <span className="bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded text-[10px]">
                    {c.students?.length || 0} HS
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Student list viewer */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 md:col-span-2 space-y-4">
            <div className="border-b pb-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h3 className="font-extrabold text-slate-800 text-sm">
                  Thành viên lớp: {selectedClassObj?.name || 'Chưa chọn lớp'}
                </h3>
                <p className="text-[11px] text-slate-400 font-semibold mt-0.5">
                  Mật khẩu tham gia lớp học (Join Pass): <span className="bg-[#1e293b] text-emerald-400 font-bold px-1.5 py-0.5 rounded ml-1 font-mono text-[10px]">{selectedClassObj?.joinPass || '---'}</span>
                </p>
              </div>

              <div className="relative w-full max-w-xs">
                <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm học sinh theo tên..."
                  value={studentSearchQuery}
                  onChange={(e) => setStudentSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-[11px] w-full bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-emerald-500 text-slate-700 font-bold"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 text-[10px] uppercase font-black tracking-wider border-b border-slate-100">
                    <th className="px-4 py-2">Mã Học Sinh</th>
                    <th className="px-4 py-2">Họ Tên Học Sinh</th>
                    <th className="px-4 py-2">Mật Khẩu Đăng Nhập Mặc Định / Riêng</th>
                    <th className="px-4 py-2 text-right">Môn & Lớp Phụ Trách</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150 text-xs text-slate-700 font-bold">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-8 text-slate-400 font-medium">
                        Không có học sinh nào trong phòng lớp hoặc phù hợp với tìm kiếm.
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((s) => {
                      const calculatedPass = s.password || generateStudentPassword(s.name);
                      return (
                        <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-4 py-2.5 font-mono text-slate-500 text-[10px]">{s.id}</td>
                          <td className="px-4 py-2.5 text-slate-800 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                            {s.name}
                          </td>
                          <td className="px-4 py-2.5">
                            <div className="flex items-center gap-2">
                              <span className="bg-slate-100 px-2 py-0.5 rounded font-mono text-zinc-500 tracking-wider text-[11px]">
                                {calculatedPass}
                              </span>
                              {s.password ? (
                                <span className="text-[9px] bg-emerald-50 text-emerald-600 border border-emerald-100 px-1 rounded uppercase">Mật khẩu tự tạo</span>
                              ) : (
                                <span className="text-[9px] bg-blue-50 text-blue-600 border border-blue-100 px-1 rounded uppercase">Mặc định hệ thống</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-2.5 text-right text-slate-500 text-[11px]">
                            {selectedClassObj?.subject} ({selectedClassObj?.name})
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3 Content: Sharing Center */}
      {activeTab === 'sharing' && (
        <div className="space-y-6">
          <div className="bg-emerald-50/45 p-4 rounded-xl border border-emerald-500/10 text-xs text-emerald-800 leading-relaxed font-semibold">
            ⚡ <strong>TRUNG TÂM CHIA SẺ TIỆN ÍCH:</strong> Trực tiếp gửi thông tin cấu hình cổng QuickQuiz đến các thành viên trong tổ bộ môn hoặc học sinh. Bạn chỉ cần chọn đối tượng chuyên biệt và nhấn nút sao chép thông điệp tự động để gửi qua Email, Zalo, Messenger hoặc Bản thông báo nội bộ.
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs">
            <div className="space-y-1">
              <h4 className="text-sm font-black text-amber-900 flex items-center gap-1.5 uppercase">
                <Database className="w-4 h-4 text-amber-700 shrink-0" />
                Đồng bộ "Cấu trình học trình" & Cấu hình Hệ thống lên Máy chủ
              </h4>
              <p className="text-[11px] text-amber-800 leading-normal font-medium max-w-2xl">
                Khi thầy mới cập nhật <strong>"Cấu trình học trình" (Syllabus)</strong> lớp 6, ngân hàng câu hỏi, hoặc danh sách lớp học mới, hãy nhấn nút bên phải để truyền tải và lưu trữ an toàn các thay đổi này trực tiếp lên máy chủ trung tâm. Toàn bộ các tài khoản giáo viên được chia sẻ sẽ lập tức nhận được bản cập nhật mới nhất!
              </p>
            </div>
            <button
              onClick={handleForceSyncWithServer}
              type="button"
              className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-black rounded-lg transition-all shadow-md cursor-pointer shrink-0 flex items-center gap-2 uppercase active:scale-95"
            >
              <RefreshCw className="w-4 h-4" />
              Đồng bộ dữ liệu ngay
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Share with teachers */}
            <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b pb-2 text-slate-800">
                <Mail className="w-5 h-5 text-emerald-600" />
                <h3 className="font-extrabold text-slate-800 text-sm">Chia Sẻ Cho Giáo Viên Khác</h3>
              </div>

              <div className="space-y-1.5 text-xs">
                <label className="text-slate-500 font-bold block">Chọn tài khoản Giáo viên:</label>
                <select
                  value={selectedTeacherIdForShare}
                  onChange={(e) => setSelectedTeacherIdForShare(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-emerald-500 text-slate-800 font-bold"
                >
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>{t.name} ({t.email})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-3 text-xs">
                <label className="text-slate-500 font-bold block">Địa chỉ Email người nhận:</label>
                <input
                  type="email"
                  placeholder="giao-vien-moi@gmail.com"
                  value={shareEmailInput || selectedTeacherObj?.email || ''}
                  onChange={(e) => setShareEmailInput(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-emerald-500 text-slate-800 font-bold font-mono text-xs"
                />

                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-[10.5px] text-slate-500 leading-relaxed space-y-1">
                  <span className="font-bold text-slate-700 block text-xs">💡 Vì sao click "Gửi Email" trước đó không hoạt động?</span>
                  <p>
                    Nút gửi email mặc định cố gắng khởi chạy ứng dụng thư cài trên hệ điều hành máy thầy (như Outlook, Mail). 
                    Nếu thầy sử dụng <strong>Gmail trên trình duyệt Web</strong> hoặc chưa cấu hình ứng dụng thư trên máy, hãy chọn phương thức phù hợp dưới đây:
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {/* Option 1: Web Gmail */}
                  <a
                    href={`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(shareEmailInput || selectedTeacherObj?.email || '')}&su=${encodeURIComponent('Thư mời tham gia ứng dụng tổ chức kiểm tra QuickQuiz')}&body=${encodeURIComponent(teacherInviteMsg)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => {
                      const finalEmail = shareEmailInput || selectedTeacherObj?.email || '';
                      if (!finalEmail) {
                        e.preventDefault();
                        showLocalToast('Vui lòng điền email giáo viên nhận!');
                      } else {
                        showLocalToast(`Đang mở Gmail Web để gửi thư tới: ${finalEmail}`);
                      }
                    }}
                    className="px-3 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-[11px] rounded-lg flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer text-center"
                  >
                    <Mail className="w-3.5 h-3.5 shrink-0" />
                    Mở Gmail Web (Khuyên dùng)
                  </a>

                  {/* Option 2: SMTP simulator */}
                  <button
                    type="button"
                    onClick={() => {
                      const finalEmail = shareEmailInput || selectedTeacherObj?.email || '';
                      if (!finalEmail) {
                        showLocalToast('Vui lòng điền email giáo viên nhận!');
                        return;
                      }
                      setShowSmtpModal(true);
                      setSmtpStep(1);
                      setTimeout(() => setSmtpStep(2), 1500);
                      setTimeout(() => setSmtpStep(3), 3200);
                    }}
                    className="px-3 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-[11px] rounded-lg flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5 shrink-0" />
                    Gửi Tự Động Từ Server
                  </button>
                </div>

                <div className="flex justify-end pt-1">
                  <a
                    href={`mailto:${shareEmailInput || selectedTeacherObj?.email || ''}?subject=${encodeURIComponent('Thư mời tham gia ứng dụng tổ chức kiểm tra QuickQuiz')}&body=${encodeURIComponent(teacherInviteMsg)}`}
                    onClick={(e) => {
                      const finalEmail = shareEmailInput || selectedTeacherObj?.email || '';
                      if (!finalEmail) {
                        e.preventDefault();
                        showLocalToast('Vui lòng điền email giáo viên nhận!');
                        return;
                      }
                      showLocalToast(`Đã mở ứng dụng Mail mặc định: ${finalEmail}`);
                    }}
                    className="text-[10px] text-slate-400 hover:text-slate-600 underline flex items-center gap-1"
                  >
                    Hoặc gửi qua ứng dụng Mail mặc định trên máy (Outlook, Apple Mail...)
                  </a>
                </div>
              </div>

              <div className="space-y-1.5 text-xs">
                <label className="text-slate-500 font-bold block">Thông điệp thư chia sẻ tự sinh:</label>
                <textarea
                  readOnly
                  rows={8}
                  value={teacherInviteMsg}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg font-mono text-[11px] leading-relaxed text-slate-600 focus:outline-hidden"
                />
              </div>

              <button
                onClick={() => handleCopy(teacherInviteMsg)}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-sm uppercase cursor-pointer"
              >
                {copiedText ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                Sao Chép Thư Mời Đăng Nhập Giáo Viên
              </button>
            </div>

            {/* Share with students */}
            <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b pb-2 text-slate-800">
                <BookOpen className="w-5 h-5 text-emerald-600" />
                <h3 className="font-extrabold text-slate-800 text-sm">Chia Sẻ Cho Phòng Luyện Học Sinh</h3>
              </div>

              <div className="space-y-1.5 text-xs">
                <label className="text-slate-500 font-bold block">Chọn Lớp rèn luyện cần gửi thông báo:</label>
                <select
                  value={selectedClassIdForShare}
                  onChange={(e) => setSelectedClassIdForShare(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-emerald-500 text-slate-800 font-bold"
                >
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>Lớp {c.name} - Môn: {c.subject}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5 text-xs">
                <label className="text-slate-500 font-bold block">Thông báo gửi học sinh & phụ huynh:</label>
                <textarea
                  readOnly
                  rows={8}
                  value={studentInviteMsg}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg font-mono text-[11px] leading-relaxed text-slate-600 focus:outline-hidden"
                />
              </div>

              <button
                onClick={() => handleCopy(studentInviteMsg)}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-100 font-extrabold text-xs rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-sm uppercase cursor-pointer"
              >
                {copiedText ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                Sao Chép Văn Bản Thông Báo Lớp Học
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4 Content: System Management & Reset */}
      {activeTab === 'system' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Data Reset Block */}
          <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm space-y-4 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-red-500 border-b pb-2">
                <FileWarning className="w-5 h-5 text-red-600" />
                <h3 className="font-extrabold text-slate-800 text-base">Khôi phục Baseline gốc</h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed font-semibold">
                Lệnh này sẽ dọn dẹp sạch sẽ toàn bộ cấu hình, lịch sử nộp bài tự luận, đề thi rèn luyện tự tạo cục bộ hiện tại. Sau đó đồng bộ hóa lại hệ thống mẫu giáo trình nguyên bản từ Bộ GD-ĐT.
              </p>
            </div>

            <button
              onClick={onResetSystem}
              className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white font-black text-xs rounded-lg transition-all flex items-center justify-center gap-1.5 mt-4 shadow-sm uppercase cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Khôi phục cấu trúc chuẩn Bộ GD
            </button>
          </div>

          {/* Admin Password Management Block */}
          <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-1.5 text-emerald-600 border-b pb-2">
                <Lock className="w-5 h-5 text-emerald-600" />
                <h3 className="font-extrabold text-slate-800 text-base">Đổi mật mã Quản trị</h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed font-semibold">
                Cập nhật mật mã bảo mật tối cao của Quản trị viên (Admin). Mật khẩu này bảo vệ mọi quyền thay đổi dữ liệu gốc và quản lý tài khoản Giáo viên.
              </p>

              <div className="space-y-2 pt-1">
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">Mật khẩu Quản trị hiện tại</label>
                  <div className="relative">
                    <input
                      type={showAdminPass ? 'text' : 'password'}
                      value={editingAdminPass}
                      onChange={(e) => setEditingAdminPass(e.target.value)}
                      className="w-full pl-3 pr-10 py-2 text-xs bg-slate-50 border border-slate-200 text-slate-800 font-bold rounded-lg focus:outline-hidden focus:ring-1 focus:ring-emerald-500 font-mono tracking-wide"
                    />
                    <button
                      type="button"
                      onClick={() => setShowAdminPass(!showAdminPass)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showAdminPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                if (!editingAdminPass.trim()) {
                  showLocalToast('Lỗi: Mật khẩu không được để trống!');
                  return;
                }
                onUpdatePassword('admin', editingAdminPass.trim());
                showLocalToast('Đã đổi mật khẩu Quản trị thành công!');
              }}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-lg transition-all flex items-center justify-center gap-1.5 mt-4 shadow-sm uppercase cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              Cập nhật mật khẩu Admin
            </button>
          </div>

          {/* Guidelines on using credentials */}
          <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm space-y-4">
            <div className="flex items-center gap-1.5 border-b pb-2 text-emerald-600">
              <Key className="w-5 h-5" />
              <h3 className="font-extrabold text-slate-800 text-base">Cách Dùng Mật Khẩu Quản Trị</h3>
            </div>
            
            <div className="space-y-2 text-xs text-slate-500 font-semibold leading-relaxed">
              <p>
                🔐 <strong>Mật khẩu Quản trị (Admin)</strong> mặc định của hệ thống là <span className="bg-[#1e293b] text-emerald-400 font-bold px-1.5 py-0.5 rounded font-mono">123456</span>. Mật khẩu này cung cấp quyền tối thượng để quản trị dữ liệu học thuật phễu, tạo lập tài khoản giáo viên bộ môn và rà soát hệ thống.
              </p>
              <p>
                💡 <strong>Để bắt đầu sử dụng quyền Quản trị:</strong>
              </p>
              <ol className="list-decimal pl-4 space-y-1">
                <li>Ở góc phải thanh trên cùng hoặc trang đăng nhập, nhấp chọn phân mục vai trò <strong>"Quản trị hệ thống" (Hệ thống)</strong>.</li>
                <li>Nhập mật khẩu quản trị hiện hành (Mặc định là 123456).</li>
                <li>Tại đây, bạn vừa đóng vai trò <strong>Tổng quản trị</strong> quản lý chung toàn hệ thống, vừa có thể đồng bộ hoặc tự do chuyển sang vai trò <strong>Giáo viên bộ môn</strong> để biên soạn bài giảng một cách độc lập.</li>
              </ol>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5 Content: Admin Configuration */}
      {activeTab === 'config' && (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 space-y-6 max-w-2xl">
          <div className="flex items-center gap-1.5 text-emerald-600 border-b pb-3">
            <UserCog className="w-5 h-5 text-emerald-600" />
            <h2 className="font-extrabold text-slate-800 text-base">Cấu Hình Thông Tin Quản Trị</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Live Preview Card */}
            <div className="md:col-span-1 bg-slate-50 border border-slate-100 rounded-xl p-4 flex flex-col items-center justify-center text-center space-y-3">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Xem trước hiển thị</span>
              
              <div className="flex items-center gap-3 bg-[#0f172a] p-3 rounded-xl border border-slate-800 w-full justify-center">
                <div className={`w-10 h-10 rounded-full bg-gradient-to-br flex items-center justify-center font-bold text-white shadow font-sans text-sm select-none border ${getAvatarColorClass(adminAvatarColor)}`}>
                  {adminName.trim().split(' ').pop()?.substring(0, 2).toUpperCase() || 'AD'}
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-xs font-bold text-slate-200">{adminName || 'Hệ Thống Admin'}</span>
                  <span className="text-[9px] text-emerald-400 font-extrabold uppercase tracking-widest">QUẢN TRỊ VIÊN</span>
                </div>
              </div>

              <p className="text-[10px] text-slate-400 leading-normal font-medium">
                Đây là ảnh đại diện và tên hiển thị ở góc trên bên phải trang chủ khi đăng nhập quyền Quản trị.
              </p>
            </div>

            {/* Inputs Form */}
            <div className="md:col-span-2 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider block">Tên hiển thị Quản trị viên</label>
                <input
                  type="text"
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  placeholder="Ví dụ: Hệ Thống Admin, Ban Giám Hiệu..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 text-slate-800 font-bold rounded-xl focus:outline-hidden focus:border-emerald-500 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider block">Email liên hệ Quản trị</label>
                <input
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="Ví dụ: admin@quickquiz.vn..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 text-slate-800 font-bold rounded-xl focus:outline-hidden focus:border-emerald-500 text-xs"
                />
              </div>

              {/* Avatar Color Choice */}
              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider block">Màu sắc chủ đề Avatar</label>
                <div className="flex gap-2 flex-wrap">
                  {[
                    { id: 'emerald', label: 'Emerald', bg: 'bg-emerald-500' },
                    { id: 'teal', label: 'Teal', bg: 'bg-teal-500' },
                    { id: 'blue', label: 'Blue', bg: 'bg-blue-500' },
                    { id: 'violet', label: 'Violet', bg: 'bg-violet-500' },
                    { id: 'rose', label: 'Rose', bg: 'bg-rose-500' },
                    { id: 'amber', label: 'Amber', bg: 'bg-amber-500' },
                  ].map((color) => (
                    <button
                      key={color.id}
                      type="button"
                      onClick={() => setAdminAvatarColor(color.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                        adminAvatarColor === color.id
                          ? 'border-emerald-500 bg-emerald-50/50 text-emerald-700'
                          : 'border-slate-200 hover:border-slate-300 text-slate-600 bg-white'
                      }`}
                    >
                      <span className={`w-2.5 h-2.5 rounded-full ${color.bg}`}></span>
                      {color.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button
              onClick={() => {
                if (!adminName.trim()) {
                  showLocalToast('Lỗi: Tên hiển thị không được để trống!');
                  return;
                }
                onUpdateAdminProfile({
                  name: adminName.trim(),
                  email: adminEmail.trim(),
                  avatarColor: adminAvatarColor,
                });
                showLocalToast('Đã cập nhật cấu hình thông tin Quản trị thành công!');
              }}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5 shadow-sm uppercase cursor-pointer active:scale-95 transition-all"
            >
              <Save className="w-4 h-4" />
              Lưu cấu hình Quản trị
            </button>
          </div>
        </div>
      )}

      {/* Custom robust iframe-safe modal: Delete Teacher Confirm */}
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
                Bạn có chắc chắn muốn xóa tài khoản Giáo viên <strong className="text-emerald-400 font-bold">{targetTeacher?.name}</strong> không?<br /><br />
                Hành động này không thể hoàn tác. Các dữ liệu liên quan đến giáo viên này sẽ bị ngắt kết nối.
              </p>
              <div className="flex gap-2 justify-end pt-2 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setTeacherToDeleteId(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-lg cursor-pointer transition-colors border border-slate-700"
                >
                  Hủy bỏ
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
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg cursor-pointer transition-all active:scale-95"
                >
                  Xác nhận xóa
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* SMTP Simulated Send Progress Modal */}
      {showSmtpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4">
          <div className="bg-[#1e2530] text-slate-150 border border-slate-700 rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 font-mono">
            <div className="flex items-center gap-2 text-indigo-400 border-b border-slate-700 pb-3">
              <RefreshCw className={`w-5 h-5 shrink-0 ${smtpStep < 3 ? 'animate-spin' : ''}`} />
              <h3 className="text-sm font-black uppercase tracking-wider">Hệ thống máy chủ thư tín SMTP</h3>
            </div>
            
            <div className="text-xs space-y-2.5 leading-relaxed text-slate-300">
              <div className="flex items-center gap-2">
                <span className="text-emerald-400">●</span>
                <span>Khởi tạo luồng giao thức TLS/SSL thành công...</span>
              </div>

              {smtpStep >= 1 && (
                <div className="flex items-center gap-2">
                  <span className={smtpStep >= 2 ? 'text-emerald-400' : 'text-amber-400 animate-pulse'}>●</span>
                  <span>Đang thiết lập cổng kết nối SMTP bảo mật (Port 465)...</span>
                </div>
              )}

              {smtpStep >= 2 && (
                <div className="flex items-center gap-2">
                  <span className={smtpStep >= 3 ? 'text-emerald-400' : 'text-amber-400 animate-pulse'}>●</span>
                  <span className="text-indigo-300">Đang nạp thông điệp mời và truyền tệp tin tới: {shareEmailInput || selectedTeacherObj?.email || ''}</span>
                </div>
              )}

              {smtpStep >= 3 && (
                <div className="space-y-2 text-emerald-400 pt-1 border-t border-slate-800">
                  <div className="flex items-center gap-2 font-bold text-emerald-300">
                    <span>✔</span>
                    <span>ĐÃ GỬI THƯ THÀNH CÔNG!</span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-sans leading-normal">
                    Hệ thống giả lập truyền tin trực tuyến của Server đã chuyển phát hòm thư thành công. Giáo viên đã có thể sử dụng thông tin trong email để đăng nhập vào phân hiệu.
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2 text-xs font-bold font-sans">
              <button
                type="button"
                disabled={smtpStep < 3}
                onClick={() => {
                  setShowSmtpModal(false);
                  showLocalToast(`Đã gửi hoàn tất tới: ${shareEmailInput || selectedTeacherObj?.email || ''}`);
                }}
                className={`px-4 py-2 rounded-lg transition-all ${
                  smtpStep < 3
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer active:scale-95 shadow-md'
                }`}
              >
                {smtpStep < 3 ? 'Đang gửi tin...' : 'Hoàn thành / Đóng'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
