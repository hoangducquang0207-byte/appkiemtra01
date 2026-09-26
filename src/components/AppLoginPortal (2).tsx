/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Award, BookOpen, Users, Lock, Eye, EyeOff, Shield, LogIn } from 'lucide-react';
import { Class, generateStudentPassword, TeacherAccount } from '../types';

interface AppLoginPortalProps {
  passwords: { gv: string; hs: string; admin: string };
  classes: Class[];
  teachers: TeacherAccount[];
  onLogin: (role: 'gv' | 'hs' | 'admin', profile?: any) => void;
}

export default function AppLoginPortal({ passwords, classes, teachers, onLogin }: AppLoginPortalProps) {
  const [selectedRole, setSelectedRole] = useState<'gv' | 'hs' | 'admin'>('gv');
  const [passwordInput, setPasswordInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [classPassInput, setClassPassInput] = useState('');
  const [showClassPass, setShowClassPass] = useState(false);
  const [studentPassInput, setStudentPassInput] = useState('');
  const [showStudentPass, setShowStudentPass] = useState(false);
  const [errorText, setErrorText] = useState('');

  // Hidden admin entrance states (URL parameter admin=true or click logo 5 times)
  const [isAdminTabVisible, setIsAdminTabVisible] = useState(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      return params.has('admin') || params.get('admin') === 'true';
    } catch {
      return false;
    }
  });
  const [logoClicks, setLogoClicks] = useState(0);

  const handleLogoClick = () => {
    setLogoClicks((prev) => {
      const next = prev + 1;
      if (next >= 5) {
        setIsAdminTabVisible(true);
        setSelectedRole('admin'); // Auto focus admin tab for the owner
        return 0;
      }
      return next;
    });
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorText('');

    if (selectedRole === 'hs') {
      const classPass = classPassInput.trim();
      const studentPass = studentPassInput.trim();

      if (!classPass || !studentPass) {
        setErrorText('Vui lòng nhập đầy đủ cả hai mật khẩu!');
        return;
      }

      // Find classes matching class password
      const matchedClasses = classes.filter(c => c.joinPass.trim() === classPass);
      if (matchedClasses.length === 0) {
        setErrorText('Mật khẩu lớp chưa chính xác! Vui lòng kiểm tra lại.');
        return;
      }

      let foundClass: Class | null = null;
      let foundStudent: any = null;

      for (const c of matchedClasses) {
        const student = c.students.find(s => {
          const expectedPass = (s.password || generateStudentPassword(s.name)).trim();
          return expectedPass === studentPass;
        });
        if (student) {
          foundClass = c;
          foundStudent = student;
          break;
        }
      }

      if (!foundClass || !foundStudent) {
        setErrorText('Mật khẩu học sinh chưa chính xác! Vui lòng kiểm tra lại.');
        return;
      }

      // Found student! Create profile
      const studentProfile = {
        classId: foundClass.id,
        subject: foundClass.subject,
        studentName: foundStudent.name,
        studentId: foundStudent.id,
        isConfirmed: true
      };

      setErrorText('');
      onLogin('hs', studentProfile);
    } else if (selectedRole === 'gv') {
      const foundTeacher = teachers.find(
        (t) => t.email.toLowerCase() === emailInput.trim().toLowerCase() && t.password === passwordInput
      );

      if (foundTeacher) {
        const profile = {
          uid: foundTeacher.id,
          name: foundTeacher.name,
          email: foundTeacher.email,
          phone: foundTeacher.phone || '',
          school: foundTeacher.school || 'Trường THCS Nguyễn Du',
          academicTitle: 'Thạc sĩ',
          department: foundTeacher.department || foundTeacher.subject || 'Khoa học tự nhiên',
          bio: 'Giáo viên bộ môn Khoa học tự nhiên có hơn 10 năm kinh nghiệm.',
          greeting: 'Chúc các em rèn luyện hết mình, ôn thi thật tốt và đạt điểm cao!',
          avatarColor: 'emerald'
        };
        setErrorText('');
        onLogin('gv', profile);
      } else {
        setErrorText('Tài khoản Giáo viên hoặc Mật khẩu không chính xác!');
      }
    } else {
      const correctPassword = passwords.admin;
      if (passwordInput === correctPassword) {
        setErrorText('');
        onLogin('admin');
      } else {
        setErrorText('Mật mã truy cập quản trị chưa khớp! Vui lòng thử lại.');
      }
    }
  };

  const selectRole = (role: 'gv' | 'hs' | 'admin') => {
    setSelectedRole(role);
    setPasswordInput('');
    setEmailInput('');
    setClassPassInput('');
    setStudentPassInput('');
    setErrorText('');
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background visual graphics */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 right-10 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-green-500/5 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-md w-full bg-slate-850/90 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-800 p-8 z-10 transition-all duration-300 transform scale-100">
        {/* Core application title branding */}
        <div className="text-center space-y-3 mb-8">
          <div className="flex justify-center">
            <button
              type="button"
              onClick={handleLogoClick}
              title="QuickQuiz Award"
              className="p-3 bg-gradient-to-tr from-emerald-500 via-teal-500 to-green-500 rounded-2xl shadow-xl border border-emerald-400/20 animate-transform hover:rotate-12 duration-300 cursor-pointer focus:outline-hidden"
            >
              <Award className="w-8 h-8 text-white" />
            </button>
          </div>
          <h1 className="text-xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-green-300 uppercase leading-snug">
            KIỂM TRA TRẮC NGHIỆM & TỰ LUẬN
          </h1>
          <p className="text-xs text-slate-400 font-semibold tracking-wide uppercase">
            Hệ thống biên soạn đề thi & số hóa học vụ THCS/THPT
          </p>
        </div>

        {/* Roles select grid */}
        <div className="space-y-3 mb-6">
          <label className="text-xs font-black text-slate-400 uppercase tracking-wider block">
            Chọn phân mục vai trò truy cập:
          </label>
          <div className={`grid ${isAdminTabVisible ? 'grid-cols-3' : 'grid-cols-2'} gap-2`}>
            {/* Giáo viên */}
            <button
              type="button"
              onClick={() => selectRole('gv')}
              className={`p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 ${
                selectedRole === 'gv'
                  ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400 shadow-md shadow-emerald-500/5'
                  : 'border-slate-800 bg-slate-800/40 text-slate-400 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              <Users className="w-5 h-5" />
              <span className="text-[11px] font-black tracking-wide uppercase">Giáo viên</span>
            </button>

            {/* Học sinh */}
            <button
              type="button"
              onClick={() => selectRole('hs')}
              className={`p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 ${
                selectedRole === 'hs'
                  ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400 shadow-md shadow-emerald-500/5'
                  : 'border-slate-800 bg-slate-800/40 text-slate-400 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              <BookOpen className="w-5 h-5" />
              <span className="text-[11px] font-black tracking-wide uppercase">Học sinh</span>
            </button>

            {/* Admin */}
            {isAdminTabVisible && (
              <button
                type="button"
                onClick={() => selectRole('admin')}
                className={`p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 ${
                  selectedRole === 'admin'
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400 shadow-md shadow-emerald-500/5'
                    : 'border-slate-800 bg-slate-800/40 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <Shield className="w-5 h-5" />
                <span className="text-[11px] font-black tracking-wide uppercase">Hệ thống</span>
              </button>
            )}
          </div>
        </div>

        {/* Selected Role description panel */}
        <div className="bg-slate-800/30 rounded-xl p-3 border border-slate-800/50 mb-6 text-[11px] text-slate-400 font-semibold leading-relaxed">
          {selectedRole === 'gv' && '📌 QUYỀN GIÁO VIÊN: Truy cập hệ thống thiết lập tổ hợp kiểm tra, biên chế danh sách học sinh, ra đề thi tự luận/trắc nghiệm, kiểm soát khóa đề và chấm điểm.'}
          {selectedRole === 'hs' && '📌 PHÂN HỆ HỌC SINH: Rèn luyện bài tập kích hoạt, tự luyện tập bồi dưỡng kiến thức, nộp bài tự luận/trắc nghiệm và nhận thông tin phản khảo.'}
          {selectedRole === 'admin' && '📌 QUẢN TRỊ VIÊN: Quản lý hạ tầng dữ liệu học thuật phễu, cấu hình giáo án khung, nhập/xuất tệp bản lưu vật lý JSON.'}
        </div>

        {/* Input form */}
        <form onSubmit={handleLoginSubmit} className="space-y-4">
          {selectedRole === 'hs' ? (
            <>
              {/* MẬT KHẨU LỚP */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5 text-emerald-500" /> MẬT KHẨU LỚP
                </label>
                <div className="relative">
                  <input
                    type={showClassPass ? 'text' : 'password'}
                    value={classPassInput}
                    onChange={(e) => {
                      setClassPassInput(e.target.value);
                      setErrorText('');
                    }}
                    autoFocus
                    required
                    placeholder="Nhập mật khẩu lớp học..."
                    className="w-full pl-3 pr-10 py-3 bg-slate-800 border border-slate-700 text-white rounded-xl focus:outline-hidden focus:border-emerald-500 font-mono text-sm tracking-widest placeholder:text-slate-600 placeholder:tracking-normal placeholder:font-sans transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowClassPass(!showClassPass)}
                    className="absolute right-3.5 top-3.5 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showClassPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* MẬT KHẨU HỌC SINH */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5 text-emerald-500" /> MẬT KHẨU HỌC SINH
                </label>
                <div className="relative">
                  <input
                    type={showStudentPass ? 'text' : 'password'}
                    value={studentPassInput}
                    onChange={(e) => {
                      setStudentPassInput(e.target.value);
                      setErrorText('');
                    }}
                    required
                    placeholder="Nhập mật khẩu cá nhân học sinh..."
                    className="w-full pl-3 pr-10 py-3 bg-slate-800 border border-slate-700 text-white rounded-xl focus:outline-hidden focus:border-emerald-500 font-mono text-sm tracking-widest placeholder:text-slate-600 placeholder:tracking-normal placeholder:font-sans transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowStudentPass(!showStudentPass)}
                    className="absolute right-3.5 top-3.5 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showStudentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </>
          ) : selectedRole === 'gv' ? (
            /* EMAIL AND PASSWORD FOR GV */
            <>
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-400 uppercase tracking-wider block">EMAIL ĐĂNG NHẬP</label>
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => {
                    setEmailInput(e.target.value);
                    setErrorText('');
                  }}
                  autoFocus
                  required
                  placeholder="Nhập email giáo viên..."
                  className="w-full pl-3 pr-10 py-3 bg-slate-800 border border-slate-700 text-white rounded-xl focus:outline-hidden focus:border-emerald-500 text-xs font-semibold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-400 uppercase tracking-wider block">MẬT KHẨU GIÁO VIÊN</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={passwordInput}
                    onChange={(e) => {
                      setPasswordInput(e.target.value);
                      setErrorText('');
                    }}
                    required
                    placeholder="Nhập mật khẩu giáo viên..."
                    className="w-full pl-3 pr-10 py-3 bg-slate-800 border border-slate-700 text-white rounded-xl focus:outline-hidden focus:border-emerald-500 font-mono text-sm tracking-widest placeholder:text-slate-600 placeholder:tracking-normal placeholder:font-sans transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3.5 text-slate-500 hover:text-slate-300 transition-colors"
                    title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </>
          ) : (
            /* SINGLE PASSWORD FOR ADMIN */
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5 text-emerald-500" /> Nhập mật mã truy cập hệ thống
                </label>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={passwordInput}
                  onChange={(e) => {
                    setPasswordInput(e.target.value);
                    setErrorText('');
                  }}
                  autoFocus
                  required
                  placeholder="Nhập mật mã quản trị..."
                  className="w-full pl-3 pr-10 py-3 bg-slate-800 border border-slate-700 text-white rounded-xl focus:outline-hidden focus:border-emerald-500 font-mono text-sm tracking-widest placeholder:text-slate-600 placeholder:tracking-normal placeholder:font-sans transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-slate-500 hover:text-slate-300 transition-colors"
                  title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          {errorText && (
            <p className="text-xs text-red-400 font-bold bg-red-950/30 border border-red-900/30 px-3 py-2 rounded-lg animate-pulse">
              ⚠️ {errorText}
            </p>
          )}

          {/* Credentials helper banner */}
          <div className="p-3 bg-emerald-950/20 border border-emerald-900/20 text-emerald-400/90 rounded-xl text-[10px] font-semibold leading-relaxed space-y-1.5">
            {selectedRole === 'hs' ? (
              <>
                <div className="flex items-start gap-1">
                  <span>📌</span>
                  <span><strong>Mật khẩu lớp:</strong> Do Giáo viên cấp cho lớp học tương ứng.</span>
                </div>
                <div className="flex items-start gap-1">
                  <span>📌</span>
                  <span><strong>Mật khẩu học sinh:</strong> Mặc định là Họ và Tên viết liền nhau, không dấu (ví dụ: học sinh <span className="text-white font-mono bg-emerald-950 px-1 py-0.5 rounded">Đinh Thị Kim Nhi</span> thì mật khẩu là <span className="text-white font-mono bg-emerald-950 px-1 py-0.5 rounded">dinhthikimnhi</span>).</span>
                </div>
              </>
            ) : (
              <div>
                💡 <strong>Mật khẩu mặc định ban đầu:</strong> <span className="underline font-mono bg-emerald-950 px-1 py-0.5 rounded text-white">123456</span>. Giáo viên có thể tùy biến đổi mật khẩu này cho từng phân hệ bất kỳ lúc nào trong phần "Cấu hình hệ thống".
              </div>
            )}
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-650 hover:from-emerald-700 hover:to-teal-750 text-white text-xs font-black rounded-xl shadow-lg shadow-emerald-900/10 hover:shadow-emerald-900/20 transition-all flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider"
          >
            <LogIn className="w-4 h-4 text-emerald-100" />
            Xác nhận truy cập
          </button>
        </form>
      </div>
    </div>
  );
}
