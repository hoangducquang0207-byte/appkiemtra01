/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Award, BookOpen, Users, Lock, Eye, EyeOff, Shield, LogIn, RefreshCw, Key, Mail, Sparkles } from 'lucide-react';
import { Class, TeacherAccount, verifyStudentLogin } from '../types';
import { auth, googleProvider, signInWithEmailAndPassword, signInWithPopup, sendPasswordResetEmail } from '../firebase';

interface AppLoginPortalProps {
  passwords: { gv: string; hs: string; admin: string };
  classes: Class[];
  teachers: TeacherAccount[];
  isDbLoading?: boolean;
  dbLoadError?: string | null;
  onLogin: (role: 'gv' | 'hs' | 'admin', profile?: any) => void;
  onRefreshDatabase?: () => Promise<void>;
}

export default function AppLoginPortal({ passwords, classes, teachers, isDbLoading = false, dbLoadError = null, onLogin, onRefreshDatabase }: AppLoginPortalProps) {
  const [selectedRole, setSelectedRole] = useState<'gv' | 'hs' | 'admin'>('gv');

  useEffect(() => {
    if (onRefreshDatabase) {
      onRefreshDatabase().catch(err => console.error('Silent background database refresh failed:', err));
    }
  }, []);

  const [passwordInput, setPasswordInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [classPassInput, setClassPassInput] = useState('');
  const [showClassPass, setShowClassPass] = useState(false);
  const [studentPassInput, setStudentPassInput] = useState('');
  const [showStudentPass, setShowStudentPass] = useState(false);
  const [errorText, setErrorText] = useState('');
  const [infoText, setInfoText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Password reset modal state
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmailInput, setResetEmailInput] = useState('');
  const [resetMsg, setResetMsg] = useState('');

  // Admin entrance tab state
  const [isAdminTabVisible, setIsAdminTabVisible] = useState(true);
  const [logoClicks, setLogoClicks] = useState(0);

  const handleLogoClick = () => {
    setLogoClicks((prev) => {
      const next = prev + 1;
      if (next >= 5) {
        setIsAdminTabVisible(true);
        setSelectedRole('admin');
        return 0;
      }
      return next;
    });
  };

  const handleGoogleLogin = async () => {
    setErrorText('');
    setInfoText('');
    setIsSubmitting(true);
    try {
      const res = await signInWithPopup(auth, googleProvider);
      const user = res.user;
      const emailLower = (user.email || '').toLowerCase().trim();

      if (selectedRole === 'gv' || selectedRole === 'admin') {
        const foundTeacher = teachers.find((t) => t.email && t.email.trim().toLowerCase() === emailLower);
        const isAdminUser = emailLower === 'hoangducquang0207@gmail.com' || emailLower === 'admin@quickquiz.vn';

        if (selectedRole === 'admin' && !isAdminUser && (!foundTeacher || foundTeacher.department !== 'Admin')) {
          setErrorText(`Email Google "${emailLower}" không có quyền Quản trị viên hệ thống!`);
          setIsSubmitting(false);
          return;
        }

        if (!foundTeacher && !isAdminUser) {
          setErrorText(`Email Google "${emailLower}" chưa được đăng ký trong danh sách Quản trị! Vui lòng liên hệ Admin.`);
          setIsSubmitting(false);
          return;
        }

        if (foundTeacher && foundTeacher.status === 'suspended') {
          setErrorText(`Tài khoản giáo viên "${emailLower}" hiện đang tạm khóa!`);
          setIsSubmitting(false);
          return;
        }

        const profile = foundTeacher
          ? {
              uid: user.uid,
              name: foundTeacher.name || user.displayName || 'Giáo viên',
              email: emailLower,
              phone: foundTeacher.phone || '',
              school: foundTeacher.school || 'Trường THCS',
              academicTitle: 'Thạc sĩ',
              department: foundTeacher.department || foundTeacher.subject || 'Khoa học tự nhiên',
              greeting: 'Chúc các em rèn luyện hết mình!',
              avatarColor: 'emerald',
            }
          : {
              uid: user.uid,
              name: user.displayName || 'Hệ Thống Admin',
              email: emailLower,
              avatarColor: 'emerald',
            };

        onLogin(selectedRole, profile);
      }
    } catch (err: any) {
      console.warn('Google Sign-In Error:', err);
      setErrorText('Đăng nhập Google không thành công hoặc bị ngắt kết nối. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendResetEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetMsg('');
    if (!resetEmailInput || !resetEmailInput.includes('@')) {
      setResetMsg('Vui lòng nhập email hợp lệ.');
      return;
    }
    try {
      await sendPasswordResetEmail(auth, resetEmailInput.trim());
      setResetMsg('✅ Đã gửi liên kết khôi phục mật khẩu vào Email của bạn. Vui lòng kiểm tra hòm thư.');
    } catch (err: any) {
      setResetMsg('Lỗi gửi email khôi phục: ' + (err.message || 'Không tìm thấy tài khoản.'));
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorText('');
    setInfoText('');
    setIsSubmitting(true);

    try {
      if (selectedRole === 'hs') {
        const classPass = classPassInput.trim();
        const studentPass = studentPassInput.trim();

        if (!classPass || !studentPass) {
          setErrorText('Vui lòng nhập đầy đủ cả Mật khẩu lớp và Mật khẩu học sinh!');
          setIsSubmitting(false);
          return;
        }

        const matchResult = verifyStudentLogin(classes, classPass, studentPass);

        if (!matchResult) {
          setErrorText('Thông tin Mật khẩu lớp hoặc Mật khẩu học sinh chưa đúng! Vui lòng kiểm tra lại danh sách học sinh chính thức.');
          setIsSubmitting(false);
          return;
        }

        // Check if student is suspended
        if ((matchResult.foundStudent as any).status === 'suspended' || (matchResult.foundStudent as any).status === 'locked') {
          setErrorText('Tài khoản học sinh của bạn đang bị khóa! Vui lòng liên hệ Giáo viên bộ môn.');
          setIsSubmitting(false);
          return;
        }

        const studentProfile = {
          classId: matchResult.foundClass.id,
          subject: matchResult.foundClass.subject || 'Khoa học tự nhiên',
          studentName: matchResult.foundStudent.name,
          studentId: matchResult.foundStudent.id,
          isConfirmed: true,
        };

        setErrorText('');
        onLogin('hs', studentProfile);
      } else if (selectedRole === 'gv') {
        const emailLower = emailInput.trim().toLowerCase();
        const password = passwordInput.trim();

        if (!emailLower || !emailLower.includes('@')) {
          setErrorText('Vui lòng nhập địa chỉ Email giáo viên hợp lệ!');
          setIsSubmitting(false);
          return;
        }

        if (!password) {
          setErrorText('Vui lòng nhập Mật khẩu giáo viên!');
          setIsSubmitting(false);
          return;
        }

        const foundTeacher = teachers.find((t) => t.email && t.email.trim().toLowerCase() === emailLower);

        // Predefined registered teacher email list fallback
        const isPredefinedTeacher =
          emailLower === 'hoangducquang0207@gmail.com' ||
          emailLower === 'hieunguyenhung1967@gmail.com' ||
          emailLower === 'hoangquang1611@gmail.com' ||
          emailLower === 'hoangquangntq@gmail.com' ||
          emailLower === 'quanghoangduc0227@gmail.com' ||
          emailLower === 'hoangducquang0227@gmail.com' ||
          emailLower === 'gv@quickquiz.vn';

        if (!foundTeacher && !isPredefinedTeacher) {
          setErrorText(`Email "${emailLower}" chưa được cấp quyền trong danh sách Quản trị!`);
          setIsSubmitting(false);
          return;
        }

        if (foundTeacher && foundTeacher.status === 'suspended') {
          setErrorText(`Tài khoản giáo viên "${emailLower}" hiện đang tạm khóa! Vui lòng liên hệ Admin.`);
          setIsSubmitting(false);
          return;
        }

        // Attempt Firebase Auth sign in
        try {
          const userCredential = await signInWithEmailAndPassword(auth, emailLower, password);
          const user = userCredential.user;

          const profile = foundTeacher
            ? {
                uid: user.uid || foundTeacher.id,
                name: foundTeacher.name,
                email: foundTeacher.email,
                phone: foundTeacher.phone || '',
                school: foundTeacher.school || 'Trường THCS Nguyễn Du',
                academicTitle: 'Thạc sĩ',
                department: foundTeacher.department || foundTeacher.subject || 'Khoa học tự nhiên',
                greeting: 'Chúc các em rèn luyện hết mình, ôn thi thật tốt và đạt điểm cao!',
                avatarColor: 'emerald',
              }
            : {
                uid: user.uid,
                name: emailLower === 'hieunguyenhung1967@gmail.com' ? 'Nguyễn Hưng Hiếu' : 'Hoàng Đức Quang',
                email: emailLower,
                phone: '0987400704',
                school: 'Trường THCS Tân Hiệp',
                academicTitle: 'Thạc sĩ',
                department: 'Toán - Tin',
                greeting: 'Chúc các em học tốt!',
                avatarColor: 'emerald',
              };

          setErrorText('');
          onLogin('gv', profile);
          return;
        } catch (firebaseAuthErr: any) {
          console.warn('Firebase Auth Login Failed:', firebaseAuthErr);
          const msg = firebaseAuthErr?.code === 'auth/invalid-credential' || firebaseAuthErr?.code === 'auth/wrong-password' || firebaseAuthErr?.code === 'auth/user-not-found'
            ? 'Tài khoản hoặc Mật khẩu Firebase Auth không chính xác!'
            : `Đăng nhập Firebase Auth thất bại: ${firebaseAuthErr.message || 'Xác thực từ chối'}`;
          setErrorText(msg);
          setIsSubmitting(false);
          return;
        }
      } else {
        // ADMIN LOGIN - Requires Firebase Auth
        const emailLower = (emailInput || 'admin@quickquiz.vn').trim().toLowerCase();
        const password = passwordInput.trim();

        if (!password) {
          setErrorText('Vui lòng nhập Mật khẩu Quản trị viên!');
          setIsSubmitting(false);
          return;
        }

        try {
          const userCredential = await signInWithEmailAndPassword(auth, emailLower, password);
          const user = userCredential.user;
          const userEmail = (user.email || '').toLowerCase().trim();

          const isAdminUser = userEmail === 'hoangducquang0207@gmail.com' || userEmail === 'admin@quickquiz.vn';
          if (!isAdminUser) {
            setErrorText(`Tài khoản Firebase Auth "${userEmail}" không có quyền Quản trị viên!`);
            setIsSubmitting(false);
            return;
          }

          setErrorText('');
          onLogin('admin', {
            uid: user.uid,
            name: user.displayName || 'Hệ Thống Admin',
            email: userEmail,
            avatarColor: 'emerald'
          });
        } catch (firebaseAuthErr: any) {
          console.warn('Firebase Admin Auth Failed:', firebaseAuthErr);
          setErrorText('Đăng nhập Quản trị viên thất bại: Mật khẩu/Tài khoản Firebase Auth không hợp lệ.');
        }
      }
    } catch (err: any) {
      setErrorText('Lỗi đăng nhập: ' + (err.message || 'Xác thực thất bại'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectRole = (role: 'gv' | 'hs' | 'admin') => {
    setSelectedRole(role);
    setPasswordInput('');
    setEmailInput('');
    setClassPassInput('');
    setStudentPassInput('');
    setErrorText('');
    setInfoText('');
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 right-10 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-md w-full bg-slate-850/95 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-800 p-8 z-10">
        <div className="text-center space-y-3 mb-6">
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

          <div className="flex justify-center pt-1">
            {isDbLoading ? (
              <div className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 text-[9px] text-amber-400 font-black uppercase rounded-full animate-pulse">
                <RefreshCw className="w-2.5 h-3 animate-spin" />
                Đang nạp dữ liệu mây...
              </div>
            ) : dbLoadError ? (
              <div className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-500/10 border border-rose-500/20 text-[9px] text-rose-400 font-black uppercase rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping"></span>
                Lỗi nạp database mây
              </div>
            ) : (
              <button
                type="button"
                onClick={() => onRefreshDatabase?.()}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-[9px] text-emerald-400 font-black uppercase rounded-full cursor-pointer transition-colors"
                title="Đã tải cơ sở dữ liệu đám mây mới nhất. Click để tải lại thủ công."
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Bảo mật Firebase Auth
              </button>
            )}
          </div>
        </div>

        {/* Roles select grid */}
        <div className="space-y-3 mb-6">
          <label className="text-xs font-black text-slate-400 uppercase tracking-wider block">
            Chọn vai trò đăng nhập:
          </label>
          <div className={`grid ${isAdminTabVisible ? 'grid-cols-3' : 'grid-cols-2'} gap-2`}>
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

        {/* Input form */}
        <form onSubmit={handleLoginSubmit} className="space-y-4">
          {selectedRole === 'hs' ? (
            <>
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
                    placeholder="Nhập Mật khẩu lớp do Giáo viên cung cấp..."
                    className="w-full pl-3 pr-10 py-3 bg-slate-800 border border-slate-700 text-white rounded-xl focus:outline-hidden focus:border-emerald-500 font-mono text-sm tracking-widest transition-all"
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

              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5 text-emerald-500" /> MẬT KHẨU HỌC SINH (HỌ TÊN VIẾT LIỀN)
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
                    placeholder="Nhập họ tên viết liền không dấu (VD: nguyenvanan)..."
                    className="w-full pl-3 pr-10 py-3 bg-slate-800 border border-slate-700 text-white rounded-xl focus:outline-hidden focus:border-emerald-500 font-mono text-sm tracking-widest transition-all"
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
            <>
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-emerald-500" /> EMAIL GIÁO VIÊN
                </label>
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => {
                    setEmailInput(e.target.value);
                    setErrorText('');
                  }}
                  autoFocus
                  required
                  placeholder="Nhập email giáo viên chính thức..."
                  className="w-full pl-3 pr-10 py-3 bg-slate-800 border border-slate-700 text-white rounded-xl focus:outline-hidden focus:border-emerald-500 text-xs font-semibold"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5 text-emerald-500" /> MẬT KHẨU
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowResetModal(true)}
                    className="text-[10px] text-emerald-400 hover:underline font-bold cursor-pointer"
                  >
                    Quên mật khẩu?
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={passwordInput}
                    onChange={(e) => {
                      setPasswordInput(e.target.value);
                      setErrorText('');
                    }}
                    required
                    placeholder="Nhập mật khẩu..."
                    className="w-full pl-3 pr-10 py-3 bg-slate-800 border border-slate-700 text-white rounded-xl focus:outline-hidden focus:border-emerald-500 font-mono text-sm tracking-widest transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3.5 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Google Sign-in Option for Teachers */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                Đăng nhập bằng tài khoản Google
              </button>
            </>
          ) : (
            <>
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-emerald-500" /> EMAIL QUẢN TRỊ
                </label>
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => {
                    setEmailInput(e.target.value);
                    setErrorText('');
                  }}
                  autoFocus
                  placeholder="hoangducquang0207@gmail.com hoặc admin@quickquiz.vn"
                  className="w-full pl-3 pr-10 py-3 bg-slate-800 border border-slate-700 text-white rounded-xl focus:outline-hidden focus:border-emerald-500 text-xs font-semibold"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5 text-emerald-500" /> MẬT KHẨU QUẢN TRỊ
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowResetModal(true)}
                    className="text-[10px] text-emerald-400 hover:underline font-bold cursor-pointer"
                  >
                    Quên mật khẩu?
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={passwordInput}
                    onChange={(e) => {
                      setPasswordInput(e.target.value);
                      setErrorText('');
                    }}
                    placeholder="Nhập mật khẩu..."
                    className="w-full pl-3 pr-10 py-3 bg-slate-800 border border-slate-700 text-white rounded-xl focus:outline-hidden focus:border-emerald-500 font-mono text-sm tracking-widest transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3.5 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Google Sign-in Option for Admin */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                Đăng nhập Quản trị bằng Google
              </button>
            </>
          )}

          {errorText && (
            <p className="text-xs text-red-400 font-bold bg-red-950/40 border border-red-900/40 p-3 rounded-lg">
              ⚠️ {errorText}
            </p>
          )}

          <button
            type="submit"
            disabled={isDbLoading || isSubmitting}
            className={`w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-650 hover:from-emerald-700 hover:to-teal-750 text-white text-xs font-black rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 uppercase tracking-wider ${
              isDbLoading || isSubmitting ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
            }`}
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
                Đang xác thực bảo mật...
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4 text-emerald-100" />
                Xác nhận đăng nhập
              </>
            )}
          </button>
        </form>

        {/* Password reset modal */}
        {showResetModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-xs p-4">
            <div className="bg-slate-850 border border-slate-800 rounded-2xl max-w-sm w-full p-6 text-slate-100 space-y-4">
              <div className="flex items-center gap-2 text-emerald-400 font-extrabold uppercase text-xs">
                <Key className="w-4 h-4" /> Khôi phục mật khẩu
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Nhập địa chỉ Email giáo viên để nhận liên kết khôi phục mật khẩu qua Firebase Authentication:
              </p>
              <form onSubmit={handleSendResetEmail} className="space-y-3">
                <input
                  type="email"
                  value={resetEmailInput}
                  onChange={(e) => setResetEmailInput(e.target.value)}
                  placeholder="Nhập email giáo viên..."
                  className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                  required
                />
                {resetMsg && <p className="text-xs text-emerald-400 font-semibold">{resetMsg}</p>}
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowResetModal(false);
                      setResetMsg('');
                    }}
                    className="px-3 py-1.5 bg-slate-800 text-slate-300 text-xs rounded-xl hover:bg-slate-700 cursor-pointer"
                  >
                    Đóng
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl cursor-pointer"
                  >
                    Gửi email khôi phục
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
