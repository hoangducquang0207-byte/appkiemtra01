/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { GlobalState, Class, Syllabus, Chapter, Question, Exam, Assignment, Submission, AppSettings, generateStudentPassword, TeacherAccount } from './types';
import {
  DEFAULT_CLASSES,
  DEFAULT_SYLLABUS,
  DEFAULT_QUESTIONS,
  DEFAULT_EXAMS,
  DEFAULT_ASSIGNMENTS,
  DEFAULT_SUBMISSIONS,
} from './data';

// Components
import TeacherDashboard from './components/TeacherDashboard';
import ClassesConfig from './components/ClassesConfig';
import SyllabusConfig from './components/SyllabusConfig';
import CreateExamPanel from './components/CreateExamPanel';
import QuestionBank from './components/QuestionBank';
import ExamBank from './components/ExamBank';
import AssignPanel from './components/AssignPanel';
import EssayGrading from './components/EssayGrading';
import ReportsDashboard from './components/ReportsDashboard';
import AISupport from './components/AISupport';
import StudentTests from './components/StudentTests';
import StudentProgress from './components/StudentProgress';
import AdminPanel from './components/AdminPanel';
import SettingsPanel from './components/SettingsPanel';
import AppLoginPortal from './components/AppLoginPortal';
import TeacherConfig, { TeacherProfile } from './components/TeacherConfig';
import { soundManager } from './sound';
import GiftedMathExams from './components/GiftedMathExams';

// Icons
import {
  BookOpen,
  Users,
  User,
  Award,
  Layers,
  Settings,
  Database,
  Brain,
  LayoutDashboard,
  HelpCircle,
  CheckCircle,
  TrendingUp,
  LogOut,
  Plus,
  Trash,
  Eye,
  RefreshCw,
  FileText,
  Calendar,
  Clock,
  Edit,
  Play,
  Sparkles,
  Clipboard,
  Shield,
  Activity,
  Lock,
  EyeOff,
  Key,
  Volume2,
  VolumeX,
} from 'lucide-react';

const APP_ID = 'quickquiz-thcs-thpt-pro';

export default function App() {
  // Master Passwords & Authentication States
  const [passwords, setPasswords] = useState<{ gv: string; hs: string; admin: string }>(() => {
    const saved = localStorage.getItem('quickquiz-passwords-v1');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return { gv: '123456', hs: '123456', admin: '123456' };
  });

  const [authenticatedRoles, setAuthenticatedRoles] = useState<{ gv: boolean; hs: boolean; admin: boolean }>({
    gv: false,
    hs: false,
    admin: false,
  });

  const [loginModal, setLoginModal] = useState<{
    role: 'gv' | 'hs' | 'admin';
    onSuccess: () => void;
  } | null>(null);

  // Master States
  const [currentRole, setCurrentRole] = useState<'gv' | 'hs' | 'admin'>('gv');
  const [currentUser, setCurrentUser] = useState<any>(() => {
    try {
      const saved = localStorage.getItem('quickquiz-teacher-profile-v1');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {}
    return {
      uid: 'gv-demo',
      name: 'Nguyễn Văn A',
      email: 'gv@quickquiz.vn',
      phone: '0912 345 678',
      school: 'Trường THCS Nguyễn Du',
      academicTitle: 'Thạc sĩ',
      department: 'Khoa học tự nhiên',
      bio: 'Giáo viên bộ môn Khoa học tự nhiên có hơn 10 năm kinh nghiệm.',
      greeting: 'Chúc các em rèn luyện hết mình, ôn thi thật tốt và đạt điểm cao!',
      avatarColor: 'emerald'
    };
  });
  const [currentModule, setCurrentModule] = useState('home');

  const [teachers, setTeachers] = useState<TeacherAccount[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [syllabus, setSyllabus] = useState<Syllabus[]>([]);
  const [settings, setSettings] = useState<AppSettings>({
    soundEnabled: true,
    darkMode: false,
    primaryColor: '#10b981',
    geminiKey: '',
  });

  const [isMuted, setIsMuted] = useState(() => soundManager.isMuted());

  const handleToggleMute = () => {
    const nextMuted = soundManager.toggleMute();
    setIsMuted(nextMuted);
    
    // Sync with settings
    setSettings((prev) => {
      const updated = { ...prev, soundEnabled: !nextMuted };
      syncToLocalStorage({ settings: updated });
      return updated;
    });

    if (!nextMuted) {
      soundManager.playClick();
    }
  };

  // Keep soundManager and isMuted synchronized with settings
  useEffect(() => {
    const shouldMute = !settings.soundEnabled;
    soundManager.setMuted(shouldMute);
    setIsMuted(shouldMute);
  }, [settings.soundEnabled]);

  // UI States
  const [toasts, setToasts] = useState<Array<{ id: string; message: string; type: 'success' | 'error' | 'info' }>>([]);
  const [confirmModal, setConfirmModal] = useState<{
    title: string;
    message: string;
    onOk: () => void;
    isDanger: boolean;
  } | null>(null);

  const [selectedClassId, setSelectedClassId] = useState('');
  const [isSidebarInvisible, setIsSidebarInvisible] = useState(false);

  // Initial Load
  useEffect(() => {
    try {
      const data = localStorage.getItem(APP_ID);
      if (data) {
        const parsed = JSON.parse(data);
        
        // 1. Load syllabus and merge any missing "Tin học" syllabus for grades 6, 7, 8, 9
        let currentSyllabus = parsed.syllabus || [];
        const infGrades = ['6', '7', '8', '9'];
        let hasSyllabusUpdates = false;

        infGrades.forEach(g => {
          const hasInformatics = currentSyllabus.some((s: any) => s.grade === g && s.subject === 'Tin học');
          if (!hasInformatics) {
            const defaultInfSyllabus = DEFAULT_SYLLABUS.find(s => s.grade === g && s.subject === 'Tin học');
            if (defaultInfSyllabus) {
              currentSyllabus.push(defaultInfSyllabus);
              hasSyllabusUpdates = true;
            }
          }
        });

        // If grade 8 Informatics syllabus exists but is outdated, replace it with the new detailed one
        const grade8InfIndex = currentSyllabus.findIndex((s: any) => s.grade === '8' && s.subject === 'Tin học');
        if (grade8InfIndex !== -1) {
          const sy8 = currentSyllabus[grade8InfIndex];
          const isOutdated = sy8.chapters.some((ch: any) => ch.id === 'ch-03' || ch.id === 'ch-04');
          if (isOutdated) {
            const defaultInfSyllabus = DEFAULT_SYLLABUS.find(s => s.grade === '8' && s.subject === 'Tin học');
            if (defaultInfSyllabus) {
              currentSyllabus[grade8InfIndex] = defaultInfSyllabus;
              hasSyllabusUpdates = true;
            }
          }
        }

        // 2. Load questions and merge any missing default Informatics questions
        let currentQuestions = parsed.questions || [];
        let hasQuestionUpdates = false;
        
        DEFAULT_QUESTIONS.forEach(dq => {
          if (dq.subject === 'Tin học') {
            const exists = currentQuestions.some((q: any) => q.content.trim().toLowerCase() === dq.content.trim().toLowerCase());
            if (!exists) {
              currentQuestions.push(dq);
              hasQuestionUpdates = true;
            }
          }
        });

        // Map outdated q-05 and q-06 to the new syllabus chapters if they exist in user's bank
        currentQuestions = currentQuestions.map((q: any) => {
          if (q.id === 'q-05' && q.chapterId === 'ch-03') {
            hasQuestionUpdates = true;
            return { ...q, chapterId: 'inf-ch1-8', lessonId: 'inf-le1-8', topic: 'Chủ đề 1. Máy tính và cộng đồng - Bài 1. Lược sử công cụ tính toán' };
          }
          if (q.id === 'q-06' && q.chapterId === 'ch-03') {
            hasQuestionUpdates = true;
            return { ...q, chapterId: 'inf-ch2-8', lessonId: 'inf-le2-8', topic: 'Chủ đề 2. Tổ chức lưu trữ, tìm kiếm và trao đổi thông tin - Bài 2. Thông tin trong môi trường số' };
          }
          return q;
        });

        setClasses(parsed.classes || []);
        setQuestions(currentQuestions);
        setExams(parsed.exams || []);
        setAssignments(parsed.assignments || []);
        setSubmissions(parsed.submissions || []);
        setSyllabus(currentSyllabus);
        
        let loadedTeachers = parsed.teachers || [
          {
            id: 't-01',
            name: 'Nguyễn Văn A',
            email: 'gv@quickquiz.vn',
            password: '123456',
            phone: '0912 345 678',
            department: 'Khoa học tự nhiên',
            subject: 'Khoa học tự nhiên',
            school: 'Trường THCS Nguyễn Du'
          }
        ];
        
        // Ensure hoangducquang0207@gmail.com is present in teachers list
        const targetEmail = 'hoangducquang0207@gmail.com';
        const hasTarget = loadedTeachers.some((t: any) => t.email.toLowerCase() === targetEmail.toLowerCase());
        if (!hasTarget) {
          loadedTeachers.push({
            id: 't-02',
            name: 'Đức Quang',
            email: targetEmail,
            password: '123456',
            phone: '0988 888 888',
            department: 'Khoa học tự nhiên',
            subject: 'Khoa học tự nhiên',
            school: 'Trường THCS Nguyễn Du'
          });
          hasSyllabusUpdates = true;
        }

        if (hasSyllabusUpdates || hasQuestionUpdates) {
          const updatedPayload = {
            ...parsed,
            syllabus: currentSyllabus,
            questions: currentQuestions,
            teachers: loadedTeachers
          };
          localStorage.setItem(APP_ID, JSON.stringify(updatedPayload));
        }
        
        setTeachers(loadedTeachers);
        setSettings(parsed.settings || { soundEnabled: true, darkMode: false, primaryColor: '#10b981', geminiKey: '' });
      } else {
        handleResetToDefault();
      }
    } catch (err) {
      console.error('Error parsed data:', err);
      handleResetToDefault();
    }
  }, []);

  // Synchronize state with central Server database on startup
  useEffect(() => {
    const fetchCentralDatabase = async () => {
      try {
        const res = await fetch('/api/sync-state');
        if (!res.ok) return;
        const data = await res.json();
        if (data && data.success && data.db) {
          const db = data.db;
          
          // If the server database is empty, push our current data to populate it!
          if (!db.teachers || db.teachers.length === 0) {
            const existing = localStorage.getItem(APP_ID);
            const parsed = existing ? JSON.parse(existing) : null;
            if (parsed) {
              await fetch('/api/sync-state', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(parsed)
              });
            }
            return;
          }

          // Otherwise, overwrite local states with the centralized server database!
          if (db.teachers && db.teachers.length > 0) {
            setTeachers(db.teachers);
          }
          if (db.classes && db.classes.length > 0) {
            setClasses(db.classes);
          }
          if (db.questions && db.questions.length > 0) {
            setQuestions(db.questions);
          }
          if (db.exams && db.exams.length > 0) {
            setExams(db.exams);
          }
          if (db.assignments && db.assignments.length > 0) {
            setAssignments(db.assignments);
          }
          if (db.submissions && db.submissions.length > 0) {
            setSubmissions(db.submissions);
          }
          if (db.syllabus && db.syllabus.length > 0) {
            setSyllabus(db.syllabus);
          }

          // Sync back to local storage
          const existing = localStorage.getItem(APP_ID);
          const parsed = existing ? JSON.parse(existing) : {};
          const mergedPayload = {
            ...parsed,
            teachers: db.teachers || parsed.teachers || [],
            classes: db.classes || parsed.classes || [],
            questions: db.questions || parsed.questions || [],
            exams: db.exams || parsed.exams || [],
            assignments: db.assignments || parsed.assignments || [],
            submissions: db.submissions || parsed.submissions || [],
            syllabus: db.syllabus || parsed.syllabus || [],
          };
          localStorage.setItem(APP_ID, JSON.stringify(mergedPayload));
        }
      } catch (err) {
        console.warn('Could not sync with central database on startup:', err);
      }
    };

    // Run sync after a brief delay so state has initialized from localStorage
    const timer = setTimeout(() => {
      fetchCentralDatabase();
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  // Sync state to local storage helper and central backend
  const syncToLocalStorage = (updatedState: Partial<GlobalState>) => {
    try {
      const existing = localStorage.getItem(APP_ID);
      const parsed = existing ? JSON.parse(existing) : {};
      const payload = {
        classes: updatedState.classes !== undefined ? updatedState.classes : parsed.classes || classes,
        questions: updatedState.questions !== undefined ? updatedState.questions : parsed.questions || questions,
        exams: updatedState.exams !== undefined ? updatedState.exams : parsed.exams || exams,
        assignments: updatedState.assignments !== undefined ? updatedState.assignments : parsed.assignments || assignments,
        submissions: updatedState.submissions !== undefined ? updatedState.submissions : parsed.submissions || submissions,
        syllabus: updatedState.syllabus !== undefined ? updatedState.syllabus : parsed.syllabus || syllabus,
        teachers: updatedState.teachers !== undefined ? updatedState.teachers : parsed.teachers || teachers,
        settings: updatedState.settings !== undefined ? updatedState.settings : parsed.settings || settings,
      };
      localStorage.setItem(APP_ID, JSON.stringify(payload));

      // Also sync to central server database asynchronously
      fetch('/api/sync-state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).catch(err => console.warn('Server sync failed:', err));

    } catch (err) {
      console.error('Error saving state:', err);
    }
  };

  const handleResetToDefault = () => {
    const defaultTeachers: TeacherAccount[] = [
      {
        id: 't-01',
        name: 'Nguyễn Văn A',
        email: 'gv@quickquiz.vn',
        password: '123456',
        phone: '0912 345 678',
        department: 'Khoa học tự nhiên',
        subject: 'Khoa học tự nhiên',
        school: 'Trường THCS Nguyễn Du'
      },
      {
        id: 't-02',
        name: 'Đức Quang',
        email: 'hoangducquang0207@gmail.com',
        password: '123456',
        phone: '0988 888 888',
        department: 'Khoa học tự nhiên',
        subject: 'Khoa học tự nhiên',
        school: 'Trường THCS Nguyễn Du'
      }
    ];
    setClasses(DEFAULT_CLASSES);
    setQuestions(DEFAULT_QUESTIONS);
    setExams(DEFAULT_EXAMS);
    setAssignments(DEFAULT_ASSIGNMENTS);
    setSubmissions(DEFAULT_SUBMISSIONS);
    setSyllabus(DEFAULT_SYLLABUS);
    setTeachers(defaultTeachers);
    setSettings({
      soundEnabled: true,
      darkMode: false,
      primaryColor: '#10b981',
      geminiKey: '',
    });

    localStorage.setItem(
      APP_ID,
      JSON.stringify({
        classes: DEFAULT_CLASSES,
        questions: DEFAULT_QUESTIONS,
        exams: DEFAULT_EXAMS,
        assignments: DEFAULT_ASSIGNMENTS,
        submissions: DEFAULT_SUBMISSIONS,
        syllabus: DEFAULT_SYLLABUS,
        teachers: defaultTeachers,
        settings: { soundEnabled: true, darkMode: false, primaryColor: '#10b981', geminiKey: '' },
      })
    );
  };

  // Toast dispatch
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    setToasts((prev) => [...prev, { id, message, type }]);

    // Play sounds corresponding to toast actions
    if (type === 'success') {
      soundManager.playSuccess();
    } else if (type === 'error') {
      soundManager.playError();
    } else {
      soundManager.playClick();
    }

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  };

  // Confirm Modal dispatcher
  const triggerConfirm = (title: string, message: string, onOk: () => void, isDanger = true) => {
    setConfirmModal({ title, message, onOk, isDanger });
  };

  // Role switching
  const handleSwitchRole = (role: 'gv' | 'hs' | 'admin', skipAuthCheck = false) => {
    if (!skipAuthCheck && !authenticatedRoles[role]) {
      if (authenticatedRoles.admin) {
        // Admin has super privileges to access all modules
        setAuthenticatedRoles((prev) => ({ ...prev, [role]: true }));
        handleSwitchRole(role, true);
        return;
      }
      setLoginModal({
        role,
        onSuccess: () => {
          setAuthenticatedRoles((prev) => ({ ...prev, [role]: true }));
          handleSwitchRole(role, true);
        },
      });
      return;
    }

    setCurrentRole(role);
    if (role === 'gv') {
      try {
        const saved = localStorage.getItem('quickquiz-teacher-profile-v1');
        if (saved) {
          setCurrentUser(JSON.parse(saved));
        } else {
          setCurrentUser({
            uid: 'gv-demo',
            name: 'Nguyễn Văn A',
            email: 'gv@quickquiz.vn',
            phone: '0912 345 678',
            school: 'Trường THCS Nguyễn Du',
            academicTitle: 'Thạc sĩ',
            department: 'Khoa học tự nhiên',
            bio: 'Giáo viên bộ môn Khoa học tự nhiên có hơn 10 năm kinh nghiệm.',
            greeting: 'Chúc các em rèn luyện hết mình, ôn thi thật tốt và đạt điểm cao!',
            avatarColor: 'emerald'
          });
        }
      } catch (e) {
        setCurrentUser({ uid: 'gv-demo', name: 'Nguyễn Văn A', email: 'gv@quickquiz.vn' });
      }
      setCurrentModule('home');
    } else if (role === 'hs') {
      try {
        const savedStudent = localStorage.getItem('quickquiz-student-setup-v1');
        if (savedStudent) {
          const parsed = JSON.parse(savedStudent);
          setCurrentUser({
            uid: parsed.studentId || 's-01',
            name: parsed.studentName || 'Nguyễn Hoàng Long',
            email: `${parsed.studentId || 'student'}@quickquiz.vn`,
            classId: parsed.classId
          });
        } else {
          setCurrentUser({ uid: 's-01', name: 'Nguyễn Hoàng Long', email: 'longnh@quickquiz.vn' });
        }
      } catch (e) {
        setCurrentUser({ uid: 's-01', name: 'Nguyễn Hoàng Long', email: 'longnh@quickquiz.vn' });
      }
      setCurrentModule('student-tests');
    } else if (role === 'admin') {
      try {
        const savedAdmin = localStorage.getItem('quickquiz-admin-profile-v1');
        if (savedAdmin) {
          setCurrentUser(JSON.parse(savedAdmin));
        } else {
          setCurrentUser({ uid: 'admin-demo', name: 'Hệ Thống Admin', email: 'admin@quickquiz.vn', avatarColor: 'emerald' });
        }
      } catch (e) {
        setCurrentUser({ uid: 'admin-demo', name: 'Hệ Thống Admin', email: 'admin@quickquiz.vn', avatarColor: 'emerald' });
      }
      setCurrentModule('admin-panel');
    }
    showToast(`Đã chuyển sang vai trò: ${role === 'gv' ? 'Giáo viên' : role === 'hs' ? 'Học sinh' : 'Quản trị viên'}`);
  };

  // Navigation router
  const navigateTo = (moduleName: string) => {
    soundManager.playTab();
    setCurrentModule(moduleName);
  };

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

  // CLASS CONFIG HANDLERS
  const handleCreateClass = (newCls: Omit<Class, 'id' | 'students'>) => {
    if (classes.some((c) => c.joinCode === newCls.joinCode)) {
      showToast('Mã lớp rèn luyện này đã tồn tại!', 'error');
      return;
    }
    const updated = [
      ...classes,
      {
        ...newCls,
        id: `c-new-${Math.floor(Math.random() * 100000)}`,
        students: [],
        createdBy: currentUser.uid,
      },
    ];
    setClasses(updated);
    syncToLocalStorage({ classes: updated });
    showToast('Khởi tạo lớp học mới và biên soạn học liệu thành công.');
  };

  const handleDeleteClass = (id: string) => {
    const target = classes.find((c) => c.id === id);
    if (!target) return;
    triggerConfirm('Xóa lớp học', `Bạn có chắc muốn xóa lớp "${target.name}"? Mọi dữ liệu sẽ mất vĩnh viễn.`, () => {
      const updatedClasses = classes.filter((c) => c.id !== id);
      const deletedAssignIds = new Set(assignments.filter((a) => a.classId === id).map((a) => a.id));
      const updatedAssigns = assignments.filter((a) => a.classId !== id);
      const updatedSubmissions = submissions.filter((sub) => !deletedAssignIds.has(sub.assignmentId));
      
      setClasses(updatedClasses);
      setAssignments(updatedAssigns);
      setSubmissions(updatedSubmissions);
      syncToLocalStorage({ 
        classes: updatedClasses, 
        assignments: updatedAssigns, 
        submissions: updatedSubmissions 
      });
      showToast(`Đã xóa thành công lớp "${target.name}".`);
    });
  };

  const handleChangeJoinCode = (id: string, newCode: string) => {
    const target = classes.find((c) => c.id === id);
    if (!target) return;
    const finalCode = newCode.trim().toUpperCase().replace(/\s+/g, '');
    if (classes.some((c) => c.joinCode === finalCode && c.id !== id)) {
      showToast('Mã lớp này đã tồn tại!', 'error');
      return;
    }
    const updated = classes.map((c) => (c.id === id ? { ...c, joinCode: finalCode } : c));
    setClasses(updated);
    syncToLocalStorage({ classes: updated });
    showToast(`Đã đổi mã lớp thành: ${finalCode}`);
  };

  const handleChangePassword = (id: string, newPass: string) => {
    const target = classes.find((c) => c.id === id);
    if (!target) return;
    if (!newPass.trim()) return;
    const updated = classes.map((c) => (c.id === id ? { ...c, joinPass: newPass.trim() } : c));
    setClasses(updated);
    syncToLocalStorage({ classes: updated });
    showToast('Cập nhật mật khẩu lớp học thành công.');
  };

  const handleAddStudent = (classId: string, name: string) => {
    const updated = classes.map((c) => {
      if (c.id === classId) {
        return {
          ...c,
          students: [
            ...c.students,
            { id: `s-new-${Math.floor(Math.random() * 100000)}`, name, avgScore: 0.0, completed: 0 },
          ],
        };
      }
      return c;
    });
    setClasses(updated);
    syncToLocalStorage({ classes: updated });
    showToast(`Đã thêm học sinh: ${name}`);
  };

  const handleImportStudents = (classId: string, names: string[]) => {
    const updated = classes.map((c) => {
      if (c.id === classId) {
        const newStudents = names.map((name) => ({
          id: `s-new-${Math.floor(Math.random() * 100000)}`,
          name,
          avgScore: 0.0,
          completed: 0,
        }));
        return {
          ...c,
          students: [...c.students, ...newStudents],
        };
      }
      return c;
    });
    setClasses(updated);
    syncToLocalStorage({ classes: updated });
    showToast(`Đồng bộ thành công ${names.length} tài khoản rèn luyện.`);
  };

  const handleEditStudent = (classId: string, studentId: string, newName: string, newPassword?: string) => {
    if (!newName.trim()) return;
    const updated = classes.map((c) => {
      if (c.id === classId) {
        return {
          ...c,
          students: c.students.map((s) => {
            if (s.id === studentId) {
              const updatedS = { ...s, name: newName.trim() };
              if (newPassword !== undefined) {
                updatedS.password = newPassword.trim();
              }
              return updatedS;
            }
            return s;
          }),
        };
      }
      return c;
    });
    setClasses(updated);
    syncToLocalStorage({ classes: updated });
    showToast('Cập nhật thông tin học viên thành công.');
  };

  const handleDeleteStudent = (classId: string, studentId: string) => {
    triggerConfirm('Xóa học sinh', 'Bạn muốn gỡ tài khoản học viên này khỏi lớp rèn luyện?', () => {
      const updated = classes.map((c) => {
        if (c.id === classId) {
          return {
            ...c,
            students: c.students.filter((s) => s.id !== studentId),
          };
        }
        return c;
      });
      setClasses(updated);

      // Cascade delete submissions for this student in this class's assignments
      const classAssignments = assignments.filter((a) => a.classId === classId).map((a) => a.id);
      const updatedSubmissions = submissions.filter(
        (sub) => !(sub.studentId === studentId && classAssignments.includes(sub.assignmentId))
      );
      setSubmissions(updatedSubmissions);

      syncToLocalStorage({ classes: updated, submissions: updatedSubmissions });
      showToast('Đã loại bỏ học viên.');
    });
  };

  const handleClearAllStudents = (classId: string) => {
    triggerConfirm('Xóa toàn bộ học sinh', 'Bạn chắc chắn muốn xóa toàn bộ học sinh khỏi lớp rèn luyện này? Thao tác này không thể khôi phục.', () => {
      const updated = classes.map((c) => {
        if (c.id === classId) {
          return {
            ...c,
            students: [],
          };
        }
        return c;
      });
      setClasses(updated);

      // Cascade delete all submissions for assignments in this class
      const classAssignments = assignments.filter((a) => a.classId === classId).map((a) => a.id);
      const updatedSubmissions = submissions.filter(
        (sub) => !classAssignments.includes(sub.assignmentId)
      );
      setSubmissions(updatedSubmissions);

      syncToLocalStorage({ classes: updated, submissions: updatedSubmissions });
      showToast('Đã xóa sạch toàn bộ học sinh trong lớp.');
    });
  };

  const handleDeleteStudentsBulk = (classId: string, studentIds: string[]) => {
    triggerConfirm('Xóa hàng loạt học sinh', `Bạn có chắc chắn muốn loại bỏ ${studentIds.length} học sinh đang được chọn khỏi lớp?`, () => {
      const updated = classes.map((c) => {
        if (c.id === classId) {
          return {
            ...c,
            students: c.students.filter((s) => !studentIds.includes(s.id)),
          };
        }
        return c;
      });
      setClasses(updated);

      // Cascade delete submissions for deleted students in this class
      const classAssignments = assignments.filter((a) => a.classId === classId).map((a) => a.id);
      const updatedSubmissions = submissions.filter(
        (sub) => !(studentIds.includes(sub.studentId) && classAssignments.includes(sub.assignmentId))
      );
      setSubmissions(updatedSubmissions);

      syncToLocalStorage({ classes: updated, submissions: updatedSubmissions });
      showToast(`Đã xóa hàng loạt thành công ${studentIds.length} học sinh.`);
    });
  };

  // SYLLABUS HANDLERS
  const handleDeleteFullSyllabus = (id: string) => {
    const target = syllabus.find((s) => s.id === id);
    if (!target) return;
    triggerConfirm('Xóa phân phối', 'Bạn chắc chắn muốn xóa toàn bộ phân phối này?', () => {
      const updated = syllabus.filter((s) => s.id !== id);
      setSyllabus(updated);

      // Collect all chapter and lesson IDs
      const chapterIds = new Set(target.chapters.map((ch) => ch.id));
      const lessonIds = new Set(target.chapters.flatMap((ch) => ch.lessons.map((le) => le.id)));

      // Remove linkages in questions
      const updatedQuestions = questions.map((q) => {
        let changed = false;
        let newQ = { ...q };
        if (chapterIds.has(q.chapterId)) {
          newQ.chapterId = '';
          changed = true;
        }
        if (lessonIds.has(q.lessonId)) {
          newQ.lessonId = '';
          changed = true;
        }
        return changed ? newQ : q;
      });
      setQuestions(updatedQuestions);

      syncToLocalStorage({ syllabus: updated, questions: updatedQuestions });
      showToast('Đã xóa phân phối.');
    });
  };

  const handleAddNewChapter = (syllabusId: string, title: string) => {
    const updated = syllabus.map((sy) => {
      if (sy.id === syllabusId) {
        return {
          ...sy,
          chapters: [...sy.chapters, { id: `ch-new-${Math.floor(Math.random() * 100000)}`, title, lessons: [] }],
        };
      }
      return sy;
    });
    setSyllabus(updated);
    syncToLocalStorage({ syllabus: updated });
    showToast('Bổ sung chương thành công.');
  };

  const handleAddNewLesson = (syllabusId: string, chapterId: string, lessonTitle: string, topics: string[]) => {
    const updated = syllabus.map((sy) => {
      if (sy.id === syllabusId) {
        return {
          ...sy,
          chapters: sy.chapters.map((ch) => {
            if (ch.id === chapterId) {
              return {
                ...ch,
                lessons: [...ch.lessons, { id: `le-new-${Math.floor(Math.random() * 100000)}`, title: lessonTitle, topics }],
              };
            }
            return ch;
          }),
        };
      }
      return sy;
    });
    setSyllabus(updated);
    syncToLocalStorage({ syllabus: updated });
    showToast('Bổ sung bài rèn luyện thành công.');
  };

  const handleDeleteLesson = (syllabusId: string, chapterId: string, lessonId: string) => {
    const updated = syllabus.map((sy) => {
      if (sy.id === syllabusId) {
        return {
          ...sy,
          chapters: sy.chapters.map((ch) => {
            if (ch.id === chapterId) {
              return {
                ...ch,
                lessons: ch.lessons.filter((l) => l.id !== lessonId),
              };
            }
            return ch;
          }),
        };
      }
      return sy;
    });
    setSyllabus(updated);

    // Remove linkage from questions referencing this lessonId
    const updatedQuestions = questions.map((q) => {
      if (q.lessonId === lessonId) {
        return { ...q, lessonId: '' };
      }
      return q;
    });
    setQuestions(updatedQuestions);

    syncToLocalStorage({ syllabus: updated, questions: updatedQuestions });
    showToast('Đã xóa bài học.');
  };

  const handleAIAdvisorSuggest = (subject: string, grade: string, req: string) => {
    // Generate AI curriculum layout
    const aiAdded: Syllabus = {
      id: `sy-ai-${Math.floor(Math.random() * 100000)}`,
      grade,
      subject,
      book: 'Kết nối tri thức',
      semester: '1',
      periods: '4',
      chapters: [
        {
          id: `ch-ai-${Math.floor(Math.random() * 100000)}`,
          title: 'Chương đề xuất 1: Phát triển năng lực tư duy hóa chất (AI gợi ý)',
          lessons: [
            { id: `le-ai-1`, title: 'Bài rèn bổ trợ: Khái niệm về các phương pháp lập luận toán học', topics: ['AI lập luận', 'Số học'] },
          ],
        },
      ],
    };

    const updated = [...syllabus, aiAdded];
    setSyllabus(updated);
    syncToLocalStorage({ syllabus: updated });
    showToast('Đồng bộ thành công gợi ý cấu trúc phân phối chương trình của AI.');
  };

  const handleCreateFullSyllabus = (newSy: Omit<Syllabus, 'id' | 'chapters'>) => {
    const updated = [
      ...syllabus,
      {
        ...newSy,
        id: `sy-cust-${Math.floor(Math.random() * 100000)}`,
        chapters: [],
      },
    ];
    setSyllabus(updated);
    syncToLocalStorage({ syllabus: updated });
    showToast(`Đã thêm chương trình học môn ${newSy.subject} Khối lớp ${newSy.grade} thành công.`);
  };

  const handleUpdateFullSyllabus = (id: string, updatedChapters: Chapter[]) => {
    const updated = syllabus.map((sy) => (sy.id === id ? { ...sy, chapters: updatedChapters } : sy));
    setSyllabus(updated);
    syncToLocalStorage({ syllabus: updated });
  };

  // EXAMS & QUE BAN HANDLERS
  const handleAddQuestion = (q: Omit<Question, 'id' | 'source' | 'status'> | Omit<Question, 'id' | 'source' | 'status'>[]) => {
    const isArray = Array.isArray(q);
    const toAdd = isArray ? q : [q];

    setQuestions((prev) => {
      const newItems = toAdd.map((item) => ({
        ...item,
        id: `q-cust-${Math.floor(Math.random() * 1000000)}`,
        source: 'Giáo viên',
        status: 'Đã duyệt',
        createdBy: currentUser.uid,
      }));
      const updated = [...prev, ...newItems];
      syncToLocalStorage({ questions: updated });
      return updated;
    });

    if (isArray) {
      showToast(`Đã lưu trữ thành công cả ${q.length} câu hỏi vào ngân hàng.`);
    } else {
      showToast('Đã lưu trữ câu hỏi thành công vào ngân hàng rèn luyện.');
    }
  };

  const handleDeleteQuestion = (idOrIds: string | string[]) => {
    const isBulk = Array.isArray(idOrIds);
    const title = isBulk ? 'Xóa nhiều câu hỏi' : 'Xóa câu hỏi';
    const message = isBulk 
      ? `Xóa vĩnh viễn ${idOrIds.length} câu hỏi đang chọn lọc này?` 
      : 'Xóa vĩnh viễn câu hỏi rèn luyện này?';

    triggerConfirm(title, message, () => {
      const idsToDelete = isBulk ? new Set(idOrIds) : new Set([idOrIds]);
      const updated = questions.filter((q) => !idsToDelete.has(q.id));
      setQuestions(updated);

      // Remove deleted questions from exams that contain them
      const updatedExams = exams.map((ex) => {
        const remainingQs = ex.questions.filter((qId) => !idsToDelete.has(qId));
        return { ...ex, questions: remainingQs };
      });
      setExams(updatedExams);

      syncToLocalStorage({ questions: updated, exams: updatedExams });
      showToast(isBulk ? `Đã loại bỏ thành công ${idOrIds.length} câu hỏi.` : 'Đã loại bỏ thành công.');
    });
  };

  const handleUpdateQuestion = (id: string, updatedFields: Partial<Question>) => {
    const updated = questions.map((q) => (q.id === id ? { ...q, ...updatedFields } : q));
    setQuestions(updated);
    syncToLocalStorage({ questions: updated });
    showToast('Cập nhật thông tin câu hỏi thành công.');
  };

  const handleSaveExamToBank = (exam: Omit<Exam, 'id' | 'createdAt' | 'status'>) => {
    const updated = [
      ...exams,
      {
        ...exam,
        id: `ex-cust-${Math.floor(Math.random() * 100000)}`,
        status: 'Đang dùng',
        createdAt: new Date().toISOString().split('T')[0],
        createdBy: currentUser.uid,
      },
    ];
    setExams(updated);
    syncToLocalStorage({ exams: updated });
    showToast('AI đã hoàn thiện bản nháp đề thi và lưu vào kho thành công.');
  };

  const handleDeleteExam = (id: string) => {
    triggerConfirm('Xóa đề thi', 'Xóa bỏ đề thi này khỏi kho lưu trữ?', () => {
      const updatedExams = exams.filter((e) => e.id !== id);
      const deletedAssignIds = new Set(assignments.filter((a) => a.examId === id).map((a) => a.id));
      const updatedAssigns = assignments.filter((a) => a.examId !== id);
      const updatedSubmissions = submissions.filter((sub) => !deletedAssignIds.has(sub.assignmentId));

      setExams(updatedExams);
      setAssignments(updatedAssigns);
      setSubmissions(updatedSubmissions);

      syncToLocalStorage({ 
        exams: updatedExams, 
        assignments: updatedAssigns, 
        submissions: updatedSubmissions 
      });
      showToast('Đã loại bỏ đề kiểm tra.');
    });
  };

  const handleImportGiftedExam = (newExam: Exam, newQs: Question[]) => {
    if (exams.some((ex) => ex.id === newExam.id)) {
      showToast('Đề thi học sinh giỏi này đã được nạp vào kho của bạn trước đó!');
      return;
    }
    const updatedQs = [...questions];
    newQs.forEach((q) => {
      if (!updatedQs.some((existingQ) => existingQ.id === q.id)) {
        updatedQs.push(q);
      }
    });
    const updatedExams = [...exams, newExam];

    setQuestions(updatedQs);
    setExams(updatedExams);
    syncToLocalStorage({ questions: updatedQs, exams: updatedExams });
    showToast(`Đã nạp thành công đề "${newExam.title}" và ${newQs.length} câu hỏi chuyên sâu vào kho đề của bạn!`);
  };

  // ASSIGN MANUAL SUBMIT
  const handleAssignSubmit = (newAssign: Omit<Assignment, 'id' | 'status'>) => {
    const updated = [
      ...assignments,
      {
        ...newAssign,
        id: `as-cust-${Math.floor(Math.random() * 100000)}`,
        status: 'Đang làm' as const,
        createdBy: currentUser.uid,
      },
    ];
    setAssignments(updated);
    syncToLocalStorage({ assignments: updated });
    showToast('Giao bài rèn luyện thành công! Học sinh đã nhận được thông báo.');
  };

  const handleDeleteAssignment = (id: string) => {
    triggerConfirm('Xóa bài ôn tập', 'Xóa bài luyện tập này khỏi danh mục hoạt động?', () => {
      const updated = assignments.filter((a) => a.id !== id);
      const updatedSubmissions = submissions.filter((sub) => sub.assignmentId !== id);
      
      setAssignments(updated);
      setSubmissions(updatedSubmissions);
      
      syncToLocalStorage({ assignments: updated, submissions: updatedSubmissions });
      showToast('Đã hủy bỏ bài rèn luyện.');
    });
  };

  // ESSAY GRADING
  const handleApproveSub = (subId: string, score: number, comment: string) => {
    const updated = submissions.map((s) => (s.id === subId ? { ...s, score, comment, status: 'Đã nộp' as const } : s));
    setSubmissions(updated);
    syncToLocalStorage({ submissions: updated });
    showToast(`Phê duyệt chấm điểm thành công! Ghi chú: ${comment}`);
  };

  const handleAutoAssignRemedial = () => {
    handleAssignSubmit({
      examId: 'ex-01',
      classId: 'c-01',
      deadline: '2026-08-15T23:59',
      duration: 15,
      shuffleQuestions: true,
      shuffleOptions: true,
      showSolution: true,
      allowRetry: true,
      maxAttempts: 999,
      message: '[AI Phụ Đạo] Bài ôn tập được giao chuyên nâng cao bổ trợ lấp lỗ hổng kiến thức số học.',
    });
  };

  // SETTINGS HANDLERS
  const handleUpdatePassword = (role: 'gv' | 'hs' | 'admin', newPass: string) => {
    const trimmed = newPass.trim();
    if (!trimmed) {
      showToast('Mật khẩu không được để trống!', 'error');
      return;
    }
    const updated = { ...passwords, [role]: trimmed };
    setPasswords(updated);
    localStorage.setItem('quickquiz-passwords-v1', JSON.stringify(updated));
    showToast(`Đã thay đổi mật mã cho ${role === 'gv' ? 'Giáo viên' : role === 'hs' ? 'Học sinh' : 'Hệ thống'} thành công.`);
  };

  const handleUpdateStudentPassword = (classId: string, studentId: string, newPass: string) => {
    const trimmed = newPass.trim();
    if (!trimmed) {
      showToast('Mật khẩu không được để trống!', 'error');
      return;
    }
    const updated = classes.map((c) => {
      if (c.id === classId) {
        return {
          ...c,
          students: c.students.map((s) => (s.id === studentId ? { ...s, password: trimmed } : s)),
        };
      }
      return c;
    });
    setClasses(updated);
    syncToLocalStorage({ classes: updated });
    showToast('Cập nhật mật khẩu học sinh thành công.');
  };

  const handleToggleSound = () => {
    const updated = { ...settings, soundEnabled: !settings.soundEnabled };
    setSettings(updated);
    syncToLocalStorage({ settings: updated });
    showToast('Đã lưu thiết lập âm báo.');
  };

  const handleToggleDarkMode = () => {
    const updated = { ...settings, darkMode: !settings.darkMode };
    setSettings(updated);
    syncToLocalStorage({ settings: updated });
    showToast('Đã lưu thiết lập tùy chọn.');
  };

  const handleExportJson = () => {
    const payload = { classes, questions, exams, assignments, submissions, syllabus, settings };
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(payload));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `QuickQuiz_Backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Xuất bản sao lưu dữ liệu JSON thành công.');
  };

  const handleImportJson = (jsonPayload: any) => {
    setClasses(jsonPayload.classes || classes);
    setQuestions(jsonPayload.questions || questions);
    setExams(jsonPayload.exams || exams);
    setAssignments(jsonPayload.assignments || assignments);
    setSubmissions(jsonPayload.submissions || submissions);
    setSyllabus(jsonPayload.syllabus || syllabus);
    setTeachers(jsonPayload.teachers || teachers);
    setSettings(jsonPayload.settings || settings);

    localStorage.setItem(APP_ID, JSON.stringify(jsonPayload));
    showToast('Khôi phục toàn vẹn dữ liệu JSON thành công.');
    setCurrentModule('home');
  };

  const isAnyRoleAuthenticated = authenticatedRoles.gv || authenticatedRoles.hs || authenticatedRoles.admin;

  if (!isAnyRoleAuthenticated) {
    return (
      <AppLoginPortal
        passwords={passwords}
        classes={classes}
        teachers={teachers}
        onLogin={(role, profile) => {
          if (role === 'hs' && profile) {
            localStorage.setItem('quickquiz-student-setup-v1', JSON.stringify(profile));
          } else if (role === 'gv' && profile) {
            localStorage.setItem('quickquiz-teacher-profile-v1', JSON.stringify(profile));
            setCurrentUser(profile);
          }
          setAuthenticatedRoles((prev) => ({ ...prev, [role]: true }));
          handleSwitchRole(role, true);
        }}
      />
    );
  }

  // Filter datasets based on active user role and owner association
  const isAdminOrSuper = authenticatedRoles.admin;

  const displayClasses = classes;

  const displayExams = exams;

  const displayQuestions = questions;

  const displayAssignments = assignments;

  const displaySubmissions = submissions;

  return (
    <div className={`flex min-h-screen flex-col overflow-hidden text-slate-800 ${settings.darkMode ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-50'}`}>
      
      {/* Role Switcher Login Modal */}
      {loginModal && (
        <div className="fixed inset-0 z-55 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs">
          <div className="bg-slate-850 border border-slate-800 rounded-2xl shadow-2xl max-w-sm w-full p-6 m-4 text-slate-100 font-sans">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-wider">Xác minh vai trò truy cập</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">
                  Chuyển mục sang: {loginModal.role === 'gv' ? 'Giáo viên' : loginModal.role === 'hs' ? 'Học sinh' : 'Quản trị viên'}
                </p>
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.currentTarget;
                if (loginModal.role === 'hs') {
                  const classPass = (form.elements.namedItem('switchClassPassInput') as HTMLInputElement)?.value.trim();
                  const studentPass = (form.elements.namedItem('switchStudentPassInput') as HTMLInputElement)?.value.trim();

                  if (!classPass || !studentPass) {
                    showToast('Vui lòng nhập đầy đủ cả hai mật khẩu!', 'error');
                    return;
                  }

                  // Find classes matching class password
                  const matchedClasses = classes.filter(c => c.joinPass.trim() === classPass);
                  if (matchedClasses.length === 0) {
                    showToast('Mật khẩu lớp chưa chính xác! Vui lòng kiểm tra lại.', 'error');
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
                    showToast('Mật khẩu học sinh chưa chính xác! Vui lòng kiểm tra lại.', 'error');
                    return;
                  }

                  // Found student! Create profile and save it to localStorage
                  const studentProfile = {
                    classId: foundClass.id,
                    subject: foundClass.subject,
                    studentName: foundStudent.name,
                    studentId: foundStudent.id,
                    isConfirmed: true
                  };
                  localStorage.setItem('quickquiz-student-setup-v1', JSON.stringify(studentProfile));
                  loginModal.onSuccess();
                  setLoginModal(null);
                } else if (loginModal.role === 'gv') {
                  const emailInput = (form.elements.namedItem('switchEmailInput') as HTMLInputElement)?.value.trim();
                  const passwordInput = (form.elements.namedItem('switchPassInput') as HTMLInputElement)?.value;

                  const foundTeacher = teachers.find(
                    (t) => t.email.toLowerCase() === emailInput.toLowerCase() && t.password === passwordInput
                  );

                  if (foundTeacher) {
                    if (foundTeacher.status === 'suspended') {
                      showToast('Tài khoản Giáo viên này đã bị ngừng cung cấp dịch vụ! Vui lòng liên hệ Admin.', 'error');
                      return;
                    }
                    const profile = {
                      uid: foundTeacher.id,
                      name: foundTeacher.name,
                      email: foundTeacher.email,
                      phone: foundTeacher.phone || '',
                      school: foundTeacher.school || 'Trường THCS Nguyễn Du',
                      campus: foundTeacher.campus || '',
                      academicTitle: 'Thạc sĩ',
                      department: foundTeacher.department || foundTeacher.subject || 'Khoa học tự nhiên',
                      bio: 'Giáo viên bộ môn Khoa học tự nhiên có hơn 10 năm kinh nghiệm.',
                      greeting: 'Chúc các em rèn luyện hết mình, ôn thi thật tốt và đạt điểm cao!',
                      avatarColor: 'emerald'
                    };
                    localStorage.setItem('quickquiz-teacher-profile-v1', JSON.stringify(profile));
                    setCurrentUser(profile);
                    loginModal.onSuccess();
                    setLoginModal(null);
                  } else {
                    showToast('Tài khoản Giáo viên hoặc Mật khẩu không chính xác!', 'error');
                  }
                } else {
                  const passwordInput = (form.elements.namedItem('switchPassInput') as HTMLInputElement).value;
                  const correct = passwords[loginModal.role];
                  if (passwordInput === correct) {
                    loginModal.onSuccess();
                    setLoginModal(null);
                  } else {
                    showToast('Mật mã truy cập cho vai trò này không chính xác!', 'error');
                  }
                }
              }}
              className="space-y-4"
            >
              {loginModal.role === 'hs' ? (
                <>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider block">MẬT KHẨU LỚP</label>
                    <input
                      type="password"
                      name="switchClassPassInput"
                      placeholder="Nhập mật khẩu lớp học..."
                      autoFocus
                      required
                      className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 text-white rounded-xl focus:outline-hidden focus:border-emerald-500 font-mono text-xs tracking-wider font-bold"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider block">MẬT KHẨU HỌC SINH</label>
                    <input
                      type="password"
                      name="switchStudentPassInput"
                      placeholder="Nhập mật khẩu học sinh..."
                      required
                      className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 text-white rounded-xl focus:outline-hidden focus:border-emerald-500 font-mono text-xs tracking-wider font-bold"
                    />
                  </div>
                </>
              ) : loginModal.role === 'gv' ? (
                <>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider block">EMAIL ĐĂNG NHẬP</label>
                    <input
                      type="email"
                      name="switchEmailInput"
                      placeholder="Nhập email giáo viên..."
                      autoFocus
                      required
                      className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 text-white rounded-xl focus:outline-hidden focus:border-emerald-500 text-xs font-semibold"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider block">MẬT KHẨU GIÁO VIÊN</label>
                    <input
                      type="password"
                      name="switchPassInput"
                      placeholder="Nhập mật khẩu giáo viên..."
                      required
                      className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 text-white rounded-xl focus:outline-hidden focus:border-emerald-500 font-mono text-xs tracking-wider"
                    />
                  </div>
                </>
              ) : (
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider block">Mật mã truy cập</label>
                  <input
                    type="password"
                    name="switchPassInput"
                    placeholder="Nhập mật khẩu..."
                    autoFocus
                    required
                    className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 text-white rounded-xl focus:outline-hidden focus:border-emerald-500 font-mono text-xs tracking-wider"
                  />
                </div>
              )}

              <div className="p-2.5 bg-emerald-950/20 border border-emerald-900/15 text-emerald-400 rounded-xl text-[10px] leading-normal font-semibold space-y-1">
                {loginModal.role === 'hs' ? (
                  <>
                    <div className="flex items-start gap-1">
                      <span>📌</span>
                      <span><strong>Mật khẩu lớp:</strong> Do Giáo viên cấp cho lớp học.</span>
                    </div>
                    <div className="flex items-start gap-1">
                      <span>📌</span>
                      <span><strong>Mật khẩu học sinh:</strong> Họ và tên viết thường liền không dấu.</span>
                    </div>
                  </>
                ) : loginModal.role === 'gv' ? (
                  <div className="space-y-1">
                    <div className="flex items-start gap-1">
                      <span>📌</span>
                      <span>Đăng nhập bằng <strong>Email và Mật khẩu</strong> do Quản trị hệ thống cấp.</span>
                    </div>
                    <div className="flex items-start gap-1 text-[9px] text-slate-400">
                      <span>💡</span>
                      <span>Tài khoản mặc định: <strong className="font-mono text-emerald-300">gv@quickquiz.vn</strong> / mật khẩu <strong className="font-mono text-emerald-300">123456</strong>.</span>
                    </div>
                  </div>
                ) : (
                  <div>
                    📌 Mật khẩu mặc định là: <strong className="font-mono bg-emerald-950 px-1 py-0.5 rounded text-white">123456</strong>.
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 text-xs font-bold uppercase tracking-wider pt-2">
                <button
                  type="button"
                  onClick={() => setLoginModal(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-755 text-slate-400 rounded-lg cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg cursor-pointer"
                >
                  Xác nhận
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Render container */}
      <div className="fixed top-5 right-5 z-[110] flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`flex items-center gap-3 px-5 py-3 rounded-xl shadow-lg border text-sm transition-all duration-300 font-semibold bg-white pointer-events-auto transform translate-y-0 ${
              t.type === 'success'
                ? 'border-green-100 text-green-800'
                : t.type === 'error'
                ? 'border-red-100 text-red-800'
                : 'border-blue-100 text-blue-800'
            }`}
          >
            <Sparkles className={`w-5 h-5 flex-shrink-0 ${t.type === 'success' ? 'text-green-500' : t.type === 'error' ? 'text-red-500' : 'text-blue-500'}`} />
            <span>{t.message}</span>
          </div>
        ))}
      </div>

      {/* Confirmation modal */}
      {confirmModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 m-4 text-slate-800">
            <h3 className="text-lg font-bold text-slate-900">{confirmModal.title}</h3>
            <p className="text-sm text-slate-500 mt-2 font-medium">{confirmModal.message}</p>
            <div className="flex justify-end gap-3 mt-6 text-xs font-bold uppercase tracking-wider">
              <button
                onClick={() => setConfirmModal(null)}
                className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  confirmModal.onOk();
                  setConfirmModal(null);
                }}
                className={`px-4 py-2 text-white rounded-lg cursor-pointer ${
                  confirmModal.isDanger ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Frame Wrapper Layout */}
      <div className="flex h-screen flex-col overflow-hidden">
        
        {/* Main Application Header */}
        {!isSidebarInvisible && (
          <header className={`bg-[#0f172a] text-white h-16 flex items-center justify-between px-6 shadow-md z-30 flex-shrink-0 border-b border-slate-800`}>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2.5 cursor-pointer group" onClick={() => navigateTo('home')}>
                <div className="p-2 bg-gradient-to-tr from-emerald-500 via-teal-500 to-green-600 rounded-xl shadow-lg border border-emerald-400/20 transition-transform group-hover:scale-105 active:scale-95 duration-200">
                  <Award className="w-5 h-5 text-white animate-pulse" />
                </div>
                <span className="font-black text-[11px] sm:text-xs md:text-sm tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-green-300 uppercase leading-none font-sans select-none">
                  KIỂM TRA TRẮC NGHIỆM & TỰ LUẬN
                </span>
              </div>
              <div className="hidden lg:flex items-center gap-2 text-xs bg-slate-800 px-3 py-1.5 rounded-full border border-slate-700 font-bold select-none cursor-pointer">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-zinc-300">Học trực tuyến KaTeX</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={handleToggleMute}
                className={`p-1.5 sm:p-2 rounded-lg border cursor-pointer transition-all flex items-center justify-center ${
                  isMuted 
                    ? 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white hover:bg-slate-700/80' 
                    : 'bg-emerald-950/30 text-emerald-400 border-emerald-900/30 hover:bg-emerald-900/50'
                }`}
                title={isMuted ? "Bật âm thanh ứng dụng" : "Tắt âm thanh ứng dụng"}
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>

              {authenticatedRoles.admin ? (
                <div className="flex items-center bg-slate-800 rounded-lg p-1 border border-slate-700 font-extrabold text-[11px]">
                  <button
                    onClick={() => handleSwitchRole('gv')}
                    className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                      currentRole === 'gv' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Giáo viên
                  </button>
                  <button
                    onClick={() => handleSwitchRole('hs')}
                    className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                      currentRole === 'hs' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Học sinh
                  </button>
                  <button
                    onClick={() => handleSwitchRole('admin')}
                    className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                      currentRole === 'admin' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Quản trị
                  </button>
                </div>
              ) : authenticatedRoles.gv ? (
                <div className="flex items-center bg-slate-800 rounded-lg p-1 border border-slate-700 font-extrabold text-[11px]">
                  <button
                    onClick={() => handleSwitchRole('gv')}
                    className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                      currentRole === 'gv' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Giáo viên
                  </button>
                  <button
                    onClick={() => handleSwitchRole('hs')}
                    className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                      currentRole === 'hs' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Học sinh
                  </button>
                </div>
              ) : null}

              <div 
                className={`flex items-center gap-3 pl-3 border-l border-slate-700 ${currentRole === 'gv' ? 'cursor-pointer hover:opacity-90 group' : 'select-none'}`}
                onClick={() => {
                  if (currentRole === 'gv') {
                    navigateTo('teacher-config');
                  }
                }}
                title={currentRole === 'gv' ? 'Cấu hình hồ sơ giáo viên' : undefined}
              >
                <div className="hidden lg:flex flex-col text-right">
                  <span className="text-xs font-bold text-slate-200 group-hover:text-emerald-400 transition-colors">{currentUser.name}</span>
                  <span className="text-[10px] text-emerald-400 font-extrabold uppercase tracking-wider">
                    {currentRole === 'gv' 
                      ? `BỘ MÔN: ${currentUser.department || 'KHOA HỌC TỰ NHIÊN'}` 
                      : currentRole === 'admin'
                      ? 'QUẢN TRỊ VIÊN HỆ THỐNG'
                      : (() => {
                          const cls = classes.find((c) => c.id === currentUser.classId);
                          return cls ? `HỌC SINH LỚP ${cls.name}` : 'HỌC SINH LỚP 6A';
                        })()
                    }
                  </span>
                </div>
                <div className={`w-9 h-9 rounded-full bg-gradient-to-br transition-all group-hover:scale-105 ${
                  currentRole === 'gv' || currentRole === 'admin'
                    ? getAvatarColorClass(currentUser.avatarColor)
                    : 'from-emerald-500 to-green-600 border-emerald-400'
                } flex items-center justify-center font-bold text-white shadow font-sans text-sm select-none border`}>
                  {currentUser.name.split(' ').pop()?.substring(0, 2).toUpperCase() || 'US'}
                </div>
                <button
                  onClick={() =>
                    triggerConfirm(
                      'Đăng xuất',
                      'Bạn có chắc chắn muốn thoát phiên này? Mọi quyền truy cập sẽ bị khóa cho đến khi đăng nhập lại.',
                      () => {
                        setAuthenticatedRoles({ gv: false, hs: false, admin: false });
                        showToast('Đã đăng xuất thành công.');
                      },
                      false
                    )
                  }
                  className="p-1 text-slate-400 hover:text-white rounded transition-colors cursor-pointer"
                  title="Thoát phiên đăng nhập"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </header>
        )}

        <div className="flex flex-1 overflow-hidden">
          
          {/* Side navigation sidebar */}
          {!isSidebarInvisible && (
            <aside className="w-60 bg-[#0f172a] border-r border-slate-800 flex flex-col flex-shrink-0 z-20 transition-all duration-300">
              <div className="flex-1 overflow-y-auto py-4 px-3 custom-scrollbar space-y-1">
                <div className="px-3 mb-2 text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-relaxed border-b pb-1 select-none border-slate-800">
                  Phân mục học vụ
                </div>

                {currentRole === 'gv' && (
                  <>
                    <button
                      onClick={() => navigateTo('home')}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-bold text-xs transition-colors cursor-pointer ${
                        currentModule === 'home' ? 'text-emerald-400 bg-slate-800/80' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-850'
                      }`}
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      <span>Trang chủ học tập</span>
                    </button>
                    <button
                      onClick={() => navigateTo('classes')}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-bold text-xs transition-colors cursor-pointer ${
                        currentModule === 'classes' ? 'text-emerald-400 bg-slate-800/80' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-850'
                      }`}
                    >
                      <Users className="w-4 h-4" />
                      <span>Cấu hình lớp & Học sinh</span>
                    </button>
                    <button
                      onClick={() => navigateTo('syllabus')}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-bold text-xs transition-colors cursor-pointer ${
                        currentModule === 'syllabus' ? 'text-emerald-400 bg-slate-800/80' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-850'
                      }`}
                    >
                      <Database className="w-4 h-4" />
                      <span>Cấu hình học trình</span>
                    </button>
                    <button
                      onClick={() => navigateTo('create-exam')}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-bold text-xs transition-colors cursor-pointer ${
                        currentModule === 'create-exam' ? 'text-emerald-400 bg-slate-800/80' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-850'
                      }`}
                    >
                      <Brain className="w-4 h-4 animate-pulse text-emerald-500" />
                      <span>Ma trận, tạo đề</span>
                    </button>
                    <button
                      onClick={() => navigateTo('question-bank')}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-bold text-xs transition-colors cursor-pointer ${
                        currentModule === 'question-bank' ? 'text-emerald-400 bg-slate-800/80' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-850'
                      }`}
                    >
                      <Clipboard className="w-4 h-4" />
                      <span>Kho câu hỏi THCS</span>
                    </button>
                    <button
                      onClick={() => navigateTo('exam-bank')}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-bold text-xs transition-colors cursor-pointer ${
                        currentModule === 'exam-bank' ? 'text-emerald-400 bg-slate-800/80' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-850'
                      }`}
                    >
                      <FileText className="w-4 h-4" />
                      <span>Kho đề kiểm tra</span>
                    </button>
                    <button
                      onClick={() => navigateTo('gifted-math-exams')}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-bold text-xs transition-colors cursor-pointer ${
                        currentModule === 'gifted-math-exams' ? 'text-emerald-400 bg-slate-800/80' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-850'
                      }`}
                    >
                      <Award className="w-4 h-4 text-yellow-400" />
                      <span>Kho đề học sinh giỏi Toán</span>
                    </button>
                    <button
                      onClick={() => navigateTo('assign')}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-bold text-xs transition-colors cursor-pointer ${
                        currentModule === 'assign' ? 'text-emerald-400 bg-slate-800/80' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-850'
                      }`}
                    >
                      <Play className="w-4 h-4" />
                      <span>Giao đề ôn tập</span>
                    </button>
                    <button
                      onClick={() => navigateTo('essay-grading')}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-bold text-xs transition-colors cursor-pointer ${
                        currentModule === 'essay-grading' ? 'text-emerald-400 bg-slate-800/80' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-850'
                      }`}
                    >
                      <Activity className="w-4 h-4" />
                      <span>Chấm điểm tự luận</span>
                    </button>
                    <button
                      onClick={() => navigateTo('reports')}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-bold text-xs transition-colors cursor-pointer ${
                        currentModule === 'reports' ? 'text-emerald-400 bg-slate-800/80' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-850'
                      }`}
                    >
                      <TrendingUp className="w-4 h-4" />
                      <span>Báo cáo điểm số</span>
                    </button>
                    <button
                      onClick={() => navigateTo('ai-support')}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-bold text-xs transition-colors cursor-pointer ${
                        currentModule === 'ai-support' ? 'text-emerald-400 bg-slate-800/80' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-850'
                      }`}
                    >
                      <Sparkles className="w-4 h-4 text-emerald-500 animate-spin" />
                      <span>Bồi dưỡng AI</span>
                    </button>
                    <button
                      onClick={() => navigateTo('teacher-config')}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-bold text-xs transition-colors cursor-pointer ${
                        currentModule === 'teacher-config' ? 'text-emerald-400 bg-slate-800/80' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-850'
                      }`}
                    >
                      <User className="w-4 h-4 text-emerald-500 animate-pulse" />
                      <span>Cấu hình giáo viên</span>
                    </button>
                  </>
                )}

                {currentRole === 'hs' && (
                  <>
                    <button
                      onClick={() => navigateTo('student-tests')}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-bold text-xs transition-colors cursor-pointer ${
                        currentModule === 'student-tests' ? 'text-emerald-400 bg-slate-800/80' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-850'
                      }`}
                    >
                      <BookOpen className="w-4 h-4" />
                      <span>Phòng luyện đề của tôi</span>
                    </button>
                    <button
                      onClick={() => navigateTo('student-progress')}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-bold text-xs transition-colors cursor-pointer ${
                        currentModule === 'student-progress' ? 'text-emerald-400 bg-slate-800/80' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-850'
                      }`}
                    >
                      <Award className="w-4 h-4" />
                      <span>Tiến trình rèn luyện</span>
                    </button>
                  </>
                )}

                {currentRole === 'admin' && (
                  <>
                    <button
                      onClick={() => navigateTo('admin-panel')}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-bold text-xs transition-colors cursor-pointer ${
                        currentModule === 'admin-panel' ? 'text-emerald-400 bg-slate-800/80' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-850'
                      }`}
                    >
                      <Shield className="w-4 h-4" />
                      <span>Quản trị hệ thống</span>
                    </button>
                  </>
                )}

                <button
                  onClick={() => navigateTo('settings')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-bold text-xs transition-colors cursor-pointer ${
                    currentModule === 'settings' ? 'text-emerald-400 bg-slate-800/80' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-850'
                  }`}
                >
                  <Settings className="w-4 h-4" />
                  <span>Cài đặt & Sao lưu</span>
                </button>
              </div>

              <div className="p-4 bg-slate-950 border-t border-slate-850 text-[10px] text-slate-500 font-extrabold flex justify-between tracking-wide select-none">
                <span>V2.5 MVP React</span>
                <span className="text-emerald-500 animate-pulse flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>Trực tuyến
                </span>
              </div>
            </aside>
          )}

          {/* Core scrollable workspace content frame */}
          <main className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar relative">
            {currentModule === 'home' && (
              <TeacherDashboard
                classes={displayClasses}
                questions={displayQuestions}
                exams={displayExams}
                assignments={displayAssignments}
                submissions={displaySubmissions}
                onNavigate={navigateTo}
                onViewClass={(id) => {
                  setSelectedClassId(id);
                  navigateTo('classes');
                }}
              />
            )}

            {currentModule === 'classes' && (
              <ClassesConfig
                classes={displayClasses}
                selectedClassId={selectedClassId}
                onSelectClass={setSelectedClassId}
                onCreateClass={handleCreateClass}
                onDeleteClass={handleDeleteClass}
                onChangeJoinCode={handleChangeJoinCode}
                onChangePassword={handleChangePassword}
                onAddStudent={handleAddStudent}
                onImportStudents={handleImportStudents}
                onEditStudent={handleEditStudent}
                onDeleteStudent={handleDeleteStudent}
                onClearAllStudents={handleClearAllStudents}
                onDeleteStudentsBulk={handleDeleteStudentsBulk}
              />
            )}

            {currentModule === 'syllabus' && (
              <SyllabusConfig
                syllabus={syllabus}
                questions={displayQuestions}
                onDeleteFullSyllabus={handleDeleteFullSyllabus}
                onAddNewChapter={handleAddNewChapter}
                onAddNewLesson={handleAddNewLesson}
                onDeleteLesson={handleDeleteLesson}
                onAIAdvisorSuggest={handleAIAdvisorSuggest}
                onCreateFullSyllabus={handleCreateFullSyllabus}
                onUpdateFullSyllabus={handleUpdateFullSyllabus}
              />
            )}

            {currentModule === 'create-exam' && (
              <CreateExamPanel
                syllabus={syllabus}
                questions={displayQuestions}
                onSaveExamToBank={handleSaveExamToBank}
                onNavigate={navigateTo}
                onAIQuestionsCreated={(newQs) => {
                  setQuestions((prev) => [...prev, ...newQs]);
                  syncToLocalStorage({ questions: [...questions, ...newQs] });
                }}
                showToast={showToast}
              />
            )}

            {currentModule === 'question-bank' && (
              <QuestionBank
                questions={displayQuestions}
                syllabus={syllabus}
                onAddQuestion={handleAddQuestion}
                onDeleteQuestion={handleDeleteQuestion}
                onUpdateQuestion={handleUpdateQuestion}
                showToast={showToast}
              />
            )}

            {currentModule === 'exam-bank' && (
              <ExamBank
                exams={displayExams}
                questions={displayQuestions}
                onDeleteExam={handleDeleteExam}
                onAssignExam={(id) => {
                  navigateTo('assign');
                }}
              />
            )}

            {currentModule === 'gifted-math-exams' && (
              <GiftedMathExams onImportExam={handleImportGiftedExam} />
            )}

            {currentModule === 'assign' && (
              <AssignPanel
                exams={displayExams}
                classes={displayClasses}
                assignments={displayAssignments}
                onAssignSubmit={handleAssignSubmit}
                onDeleteAssignment={handleDeleteAssignment}
              />
            )}

            {currentModule === 'essay-grading' && (
              <EssayGrading
                submissions={displaySubmissions}
                exams={displayExams}
                assignments={displayAssignments}
                questions={displayQuestions}
                onApproveSub={handleApproveSub}
              />
            )}

            {currentModule === 'reports' && <ReportsDashboard classes={displayClasses} submissions={displaySubmissions} />}

            {currentModule === 'ai-support' && <AISupport onAutoAssignRemedial={handleAutoAssignRemedial} />}

            {currentModule === 'teacher-config' && (
              <TeacherConfig
                profile={currentUser}
                onSave={(updatedProfile) => {
                  const merged = { ...currentUser, ...updatedProfile };
                  setCurrentUser(merged);
                  localStorage.setItem('quickquiz-teacher-profile-v1', JSON.stringify(merged));
                  showToast('Hồ sơ học vụ giáo viên đã lưu thành công!');
                }}
              />
            )}

            {currentModule === 'student-tests' && (
              <StudentTests
                classes={classes}
                assignments={assignments}
                exams={exams}
                questions={questions}
                submissions={submissions}
                syllabus={syllabus}
                currentUser={currentUser}
                passwords={passwords}
                onAddSubmission={(newSub) => {
                  const updated = [newSub, ...submissions];
                  setSubmissions(updated);
                  syncToLocalStorage({ submissions: updated });
                  showToast('Đã ghi nhận kết quả bài thi rèn luyện thành công!');
                }}
                soundEnabled={settings.soundEnabled}
                onSetSidebarInvisible={setIsSidebarInvisible}
                onUpdatePassword={handleUpdatePassword}
                onUpdateStudentPassword={handleUpdateStudentPassword}
                onExitStudentRoom={() => {
                  localStorage.removeItem('quickquiz-student-setup-v1');
                  setAuthenticatedRoles((prev) => ({ ...prev, hs: false }));
                  showToast('Đã hoàn tất thoát phòng học sinh.');
                }}
                onStudentProfileChange={(profile) => {
                  if (profile) {
                    setCurrentUser({
                      uid: profile.studentId || 's-01',
                      name: profile.studentName || 'Nguyễn Hoàng Long',
                      email: `${profile.studentId || 'student'}@quickquiz.vn`,
                      classId: profile.classId
                    });
                  } else {
                    setCurrentUser({ uid: 's-01', name: 'Nguyễn Hoàng Long', email: 'longnh@quickquiz.vn' });
                  }
                }}
              />
            )}

            {currentModule === 'student-progress' && <StudentProgress />}

            {currentModule === 'admin-panel' && (
              <AdminPanel
                teachers={teachers}
                onUpdateTeachers={(newTeachers) => {
                  setTeachers(newTeachers);
                  syncToLocalStorage({ teachers: newTeachers });
                }}
                classes={classes}
                onUpdateClasses={(newClasses) => {
                  setClasses(newClasses);
                  syncToLocalStorage({ classes: newClasses });
                }}
                questions={questions}
                assignments={assignments}
                submissions={submissions}
                onResetSystem={() => {
                  triggerConfirm(
                    'Đặt lại dữ liệu',
                    'Bạn muốn xóa hết các cấu hình tự tạo và tải lại dữ liệu mẫu gốc từ Bộ Giáo dục?',
                    () => {
                      handleResetToDefault();
                      showToast('Khôi phục toàn vẹn dữ liệu gốc thành công!');
                      navigateTo('home');
                    }
                  );
                }}
                passwords={passwords}
                onUpdatePassword={handleUpdatePassword}
                onLogout={() => {
                  triggerConfirm(
                    'Đăng xuất Quản trị',
                    'Bạn có chắc chắn muốn thoát quyền Quản trị hệ thống?',
                    () => {
                      setAuthenticatedRoles((prev) => ({ ...prev, admin: false }));
                      handleSwitchRole('gv');
                      showToast('Đã đăng xuất quyền Quản trị viên.');
                    },
                    false
                  );
                }}
                currentUser={currentUser}
                onUpdateAdminProfile={(updatedProfile) => {
                  const merged = { ...currentUser, ...updatedProfile };
                  setCurrentUser(merged);
                  localStorage.setItem('quickquiz-admin-profile-v1', JSON.stringify(merged));
                  showToast('Cấu hình thông tin Quản trị đã được cập nhật thành công!');
                }}
              />
            )}

            {currentModule === 'settings' && (
              <SettingsPanel
                soundEnabled={settings.soundEnabled}
                onToggleSound={handleToggleSound}
                darkMode={settings.darkMode}
                onToggleDarkMode={handleToggleDarkMode}
                onExportJson={handleExportJson}
                onImportJson={handleImportJson}
                passwords={passwords}
                onUpdatePassword={handleUpdatePassword}
                userRole={currentRole}
                teachers={teachers}
              />
            )}
          </main>

        </div>
      </div>
    </div>
  );
}
