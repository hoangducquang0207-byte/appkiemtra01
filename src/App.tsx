/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { GlobalState, Class, Student, Syllabus, Chapter, Question, Exam, Assignment, Submission, AppSettings, generateStudentPassword, generateSecureStudentPasscode, TeacherAccount, verifyStudentLogin } from './types';
import { auth, onAuthStateChanged } from './firebase';
import { saveStateToFirestore, loadStateFromFirestore, syncAndMergeSubmissions, subscribeToSubmissions, fetchRemoteSubmissionsOnly, getAuthHeaders } from './firebaseSync';
import {
  DEFAULT_CLASSES,
  DEFAULT_SYLLABUS,
  DEFAULT_QUESTIONS,
  DEFAULT_EXAMS,
  DEFAULT_ASSIGNMENTS,
  DEFAULT_SUBMISSIONS,
} from './data';
import { mergeWithStandardSyllabus } from './data/syllabusCatalog';

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
import ShareAppPanel from './components/ShareAppPanel';
import ErrorBoundary from './components/ErrorBoundary';

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
  Share2,
  Menu,
  X,
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

  // Synchronous reference to current master payload to prevent React closure stale state issues
  const stateRef = useRef<GlobalState>({
    classes: [],
    teachers: [],
    questions: [],
    exams: [],
    assignments: [],
    submissions: [],
    syllabus: [],
    settings: { soundEnabled: true, darkMode: false, primaryColor: '#10b981', geminiKey: '' },
  });

  useEffect(() => {
    stateRef.current = {
      classes,
      teachers,
      questions,
      exams,
      assignments,
      submissions,
      syllabus,
      settings,
    };
  }, [classes, teachers, questions, exams, assignments, submissions, syllabus, settings]);

  const [isDbLoading, setIsDbLoading] = useState(true);
  const [dbLoadError, setDbLoadError] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Helper to merge arrays by unique 'id' preserving newly added local and remote items
  const mergeById = <T extends { id: string }>(primary: T[] = [], secondary: T[] = []): T[] => {
    const map = new Map<string, T>();
    secondary.forEach((item) => { if (item && item.id) map.set(item.id, item); });
    primary.forEach((item) => { if (item && item.id) map.set(item.id, item); });
    return Array.from(map.values());
  };

  // Initial Load with Firestore Cloud DB integration and intelligent multi-tier storage sync
  const initAppData = async () => {
    setIsDbLoading(true);
    setDbLoadError(null);

    // 1. Check LocalStorage for fast instant offline recovery
    let localPayload: any = null;
    try {
      const data = localStorage.getItem(APP_ID);
      if (data) {
        localPayload = JSON.parse(data);
      }
    } catch (e) {
      console.warn('LocalStorage read error:', e);
    }

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
        name: 'Hoàng Đức Quang',
        email: 'hoangducquang0207@gmail.com',
        password: '123456',
        phone: '0987400704',
        department: 'Toán - Tin',
        subject: 'Toán',
        school: 'Trường THCS Tân Hiệp'
      },
      {
        id: 't-03',
        name: 'Nguyễn Hưng Hiếu',
        email: 'hieunguyenhung1967@gmail.com',
        password: '123456',
        phone: '0358206641',
        department: 'Văn Sử Địa',
        subject: 'Ngữ văn',
        school: 'Trường THCS Phước Thái'
      },
      {
        id: 't-04',
        name: 'Hoàng Gia Trí',
        email: 'hoangquangntq@gmail.com',
        password: '123456',
        phone: '0862007370',
        department: 'Toán - Tin',
        subject: 'Toán',
        school: 'Trường THCS Tân Hiệp'
      },
      {
        id: 't-05',
        name: 'Nguyễn Quang',
        email: 'quanghoangduc0227@gmail.com',
        password: '123456',
        phone: '0987400704',
        department: 'Toán',
        subject: 'Toán',
        school: 'Trường THCS Phước Thái'
      },
      {
        id: 't-06',
        name: 'Hoàng Quang',
        email: 'hoangquang1611@gmail.com',
        password: '123456',
        phone: '0987400704',
        department: 'Toán - Tin',
        subject: 'Tin học',
        school: 'Trường THCS Phước Thái'
      }
    ];

    try {
      // Fetch Firestore Cloud DB & Express Server DB concurrently
      const [cloudState, serverData] = await Promise.all([
        loadStateFromFirestore().catch(() => null),
        syncWithServerDb('read').catch(() => null)
      ]);

      const isPayloadEmpty = (data: any) => {
        if (!data) return true;
        const cLen = Array.isArray(data.classes) ? data.classes.length : 0;
        const tLen = Array.isArray(data.teachers) ? data.teachers.length : 0;
        const qLen = Array.isArray(data.questions) ? data.questions.length : 0;
        const eLen = Array.isArray(data.exams) ? data.exams.length : 0;
        const aLen = Array.isArray(data.assignments) ? data.assignments.length : 0;
        const sLen = Array.isArray(data.syllabus) ? data.syllabus.length : 0;
        return cLen + tLen + qLen + eLen + aLen + sLen === 0;
      };

      const validCloudState = !isPayloadEmpty(cloudState) ? cloudState : null;
      const validServerData = !isPayloadEmpty(serverData) ? serverData : null;
      const remoteData = validCloudState || validServerData;

      // Prioritize Remote Cloud data if populated; otherwise use LocalStorage or DEFAULT_*
      const rawClasses = remoteData?.classes !== undefined
        ? remoteData.classes
        : (localPayload?.classes !== undefined ? localPayload.classes : DEFAULT_CLASSES);

      const finalClasses: Class[] = Array.isArray(rawClasses)
        ? rawClasses.map((c: Class) => ({
            ...c,
            students: Array.isArray(c.students)
              ? c.students.map((st: Student) => ({
                  ...st,
                  password: st.password || generateStudentPassword(st.name),
                }))
              : [],
          }))
        : DEFAULT_CLASSES;

      const finalTeachers = remoteData?.teachers !== undefined
        ? remoteData.teachers
        : (localPayload?.teachers !== undefined ? localPayload.teachers : defaultTeachers);

      const finalQuestions = mergeById<Question>(
        DEFAULT_QUESTIONS,
        mergeById<Question>(
          serverData?.questions || [],
          mergeById<Question>(
            cloudState?.questions || [],
            localPayload?.questions || []
          )
        )
      );

      const finalExams = remoteData?.exams !== undefined
        ? remoteData.exams
        : (localPayload?.exams !== undefined ? localPayload.exams : DEFAULT_EXAMS);

      const finalAssignments = remoteData?.assignments !== undefined
        ? remoteData.assignments
        : (localPayload?.assignments !== undefined ? localPayload.assignments : DEFAULT_ASSIGNMENTS);

      const finalSubmissions = remoteData?.submissions !== undefined
        ? (localPayload?.submissions ? mergeById<Submission>(remoteData.submissions, localPayload.submissions) : remoteData.submissions)
        : (localPayload?.submissions !== undefined ? localPayload.submissions : DEFAULT_SUBMISSIONS);

      const rawSyllabus = remoteData?.syllabus !== undefined && Array.isArray(remoteData.syllabus) && remoteData.syllabus.length > 0
        ? remoteData.syllabus
        : (localPayload?.syllabus !== undefined && Array.isArray(localPayload.syllabus) && localPayload.syllabus.length > 0 ? localPayload.syllabus : DEFAULT_SYLLABUS);

      const finalSyllabus = mergeWithStandardSyllabus(rawSyllabus);

      setClasses(finalClasses);
      setTeachers(finalTeachers);
      setQuestions(finalQuestions);
      setExams(finalExams);
      setAssignments(finalAssignments);
      setSubmissions(finalSubmissions);
      setSyllabus(finalSyllabus);

      const mergedPayload: GlobalState = {
        currentRole,
        currentUser,
        currentModule,
        activeExamSession: null,
        classes: finalClasses,
        teachers: finalTeachers,
        questions: finalQuestions,
        exams: finalExams,
        assignments: finalAssignments,
        submissions: finalSubmissions,
        syllabus: finalSyllabus,
        settings: settings
      };

      stateRef.current = mergedPayload;

      setClasses(finalClasses);
      setTeachers(finalTeachers);
      setQuestions(finalQuestions);
      setExams(finalExams);
      setAssignments(finalAssignments);
      setSubmissions(finalSubmissions);
      setSyllabus(finalSyllabus);

      localStorage.setItem(APP_ID, JSON.stringify(mergedPayload));
      syncWithServerDb('write', mergedPayload).catch(() => {});
      if (!validCloudState) {
        saveStateToFirestore(mergedPayload).catch(() => {});
      }

      setIsDbLoading(false);
      setDbLoadError(null);
    } catch (err) {
      console.error('Failed to sync app data:', err);

      const finalClasses = localPayload?.classes && localPayload.classes.length > 0 ? localPayload.classes : DEFAULT_CLASSES;
      const finalTeachers = localPayload?.teachers && localPayload.teachers.length > 0 ? localPayload.teachers : defaultTeachers;
      const finalQuestions = localPayload?.questions && localPayload.questions.length > 0 ? localPayload.questions : DEFAULT_QUESTIONS;
      const finalExams = localPayload?.exams && localPayload.exams.length > 0 ? localPayload.exams : DEFAULT_EXAMS;
      const finalAssignments = localPayload?.assignments && localPayload.assignments.length > 0 ? localPayload.assignments : DEFAULT_ASSIGNMENTS;
      const finalSubmissions = localPayload?.submissions || DEFAULT_SUBMISSIONS;
      const finalSyllabus = localPayload?.syllabus && localPayload.syllabus.length > 0 ? localPayload.syllabus : DEFAULT_SYLLABUS;

      setClasses(finalClasses);
      setTeachers(finalTeachers);
      setQuestions(finalQuestions);
      setExams(finalExams);
      setAssignments(finalAssignments);
      setSubmissions(finalSubmissions);
      setSyllabus(finalSyllabus);
      setIsDbLoading(false);
      setDbLoadError(null);
    }
  };

  useEffect(() => {
    // Check for "db" parameter to register shared database instantly
    try {
      const params = new URLSearchParams(window.location.search);
      const urlDbId = params.get('db');
      if (urlDbId && urlDbId.trim().length > 5) {
        localStorage.setItem('quickquiz-shared-db-id', urlDbId.trim());
      }
    } catch (e) {
      console.warn('URLSearchParams error:', e);
    }

    const unsubAuth = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        // Automatically sync email & credentials if authenticated
        console.log('Firebase Auth session active:', firebaseUser.email);
      }
    });

    initAppData();

    return () => {
      unsubAuth();
    };
  }, []);

  // Background real-time listener & 10s auto-refresh to collect student submissions across devices
  useEffect(() => {
    // Real-time Firestore submission listener for instant updates
    const unsub = subscribeToSubmissions((remoteSubs) => {
      if (remoteSubs && remoteSubs.length > 0) {
        setSubmissions((prev) => {
          const merged = mergeById<Submission>(remoteSubs, prev);
          try {
            const existing = localStorage.getItem(APP_ID);
            if (existing) {
              const parsed = JSON.parse(existing);
              parsed.submissions = merged;
              localStorage.setItem(APP_ID, JSON.stringify(parsed));
            }
          } catch (e) {}
          return merged;
        });
      }
    });

    const syncInterval = setInterval(async () => {
      try {
        // Lightweight polling for submissions from Firestore and Server DB to prevent quota exhaustion while keeping cross-device sync instant
        const [cloudSubs, serverDb] = await Promise.all([
          fetchRemoteSubmissionsOnly().catch(() => []),
          syncWithServerDb('read').catch(() => null)
        ]);

        const incomingSubs: Submission[] = [];
        if (Array.isArray(cloudSubs) && cloudSubs.length > 0) incomingSubs.push(...cloudSubs);
        if (serverDb && Array.isArray(serverDb.submissions) && serverDb.submissions.length > 0) {
          incomingSubs.push(...serverDb.submissions);
        }

        if (incomingSubs.length > 0) {
          setSubmissions((prev) => {
            const merged = mergeById<Submission>(incomingSubs, prev);
            try {
              const existing = localStorage.getItem(APP_ID);
              if (existing) {
                const parsed = JSON.parse(existing);
                parsed.submissions = merged;
                localStorage.setItem(APP_ID, JSON.stringify(parsed));
              }
            } catch (e) {}
            return merged;
          });
        }
      } catch (e) {
        // Silently handle offline / transient errors
      }
    }, 12000);

    return () => {
      unsub();
      clearInterval(syncInterval);
    };
  }, []);

  // Manual cloud synchronization handler for teachers
  const handleSyncCloudData = async (silent = false) => {
    setIsSyncing(true);
    try {
      const cloudState = await loadStateFromFirestore();
      if (cloudState) {
        if (cloudState.submissions) setSubmissions((prev) => mergeById<Submission>(cloudState.submissions, prev));
        if (cloudState.classes) setClasses(cloudState.classes);
        if (cloudState.assignments) setAssignments(cloudState.assignments);
        if (cloudState.exams) setExams(cloudState.exams);
        if (cloudState.questions) setQuestions((prev) => mergeById<Question>(cloudState.questions, prev));
        if (cloudState.syllabus) setSyllabus(cloudState.syllabus);
        if (!silent) showToast('Đồng bộ dữ liệu nộp bài từ đám mây thành công!');
      } else {
        if (!silent) showToast('Dữ liệu trên đám mây đã ở trạng thái mới nhất.', 'info');
      }
    } catch (err) {
      if (!silent) showToast('Lỗi khi tải dữ liệu từ đám mây.', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  // Helper to sync state to/from Express server DB across all platforms (desktop, mobile, tablet)
  const syncWithServerDb = async (action: 'read' | 'write', payloadToSave?: any) => {
    try {
      const headers = await getAuthHeaders();
      if (action === 'write' && payloadToSave) {
        const res = await fetch('/api/sync-state', {
          method: 'POST',
          headers,
          body: JSON.stringify(payloadToSave)
        });
        return res.ok;
      } else if (action === 'read') {
        const res = await fetch('/api/sync-state', { headers });
        if (res.ok) {
          const data = await res.json();
          if (data && data.success && data.db) {
            return data.db;
          }
        }
      }
    } catch (err) {
      // Silently fall back to LocalStorage & Firestore if offline / unreachable
    }
    return null;
  };

  // Removed legacy central database fetching to prevent overwriting new live Firestore database states

  // Sync state to local storage helper and Firestore cloud database
  const syncToLocalStorage = (updatedState: Partial<GlobalState>) => {
    try {
      const nextState: GlobalState = {
        currentRole: stateRef.current.currentRole || currentRole,
        currentUser: stateRef.current.currentUser || currentUser,
        currentModule: stateRef.current.currentModule || currentModule,
        activeExamSession: stateRef.current.activeExamSession || null,
        classes: updatedState.classes !== undefined ? updatedState.classes : stateRef.current.classes,
        teachers: updatedState.teachers !== undefined ? updatedState.teachers : stateRef.current.teachers,
        questions: updatedState.questions !== undefined ? updatedState.questions : stateRef.current.questions,
        exams: updatedState.exams !== undefined ? updatedState.exams : stateRef.current.exams,
        assignments: updatedState.assignments !== undefined ? updatedState.assignments : stateRef.current.assignments,
        submissions: updatedState.submissions !== undefined ? updatedState.submissions : stateRef.current.submissions,
        syllabus: updatedState.syllabus !== undefined ? updatedState.syllabus : stateRef.current.syllabus,
        settings: updatedState.settings !== undefined ? updatedState.settings : stateRef.current.settings,
      };
      stateRef.current = nextState;

      localStorage.setItem(APP_ID, JSON.stringify(nextState));

      // Asynchronously synchronize with Firestore cloud database
      setIsSyncing(true);
      saveStateToFirestore({
        classes: nextState.classes,
        teachers: nextState.teachers,
        exams: nextState.exams,
        assignments: nextState.assignments,
        submissions: nextState.submissions,
        syllabus: nextState.syllabus,
        questions: nextState.questions,
      })
        .then(() => setIsSyncing(false))
        .catch(err => {
          console.error('Cloud Firestore background synchronization failed:', err);
          setIsSyncing(false);
        });

      // Asynchronously synchronize with secondary Express backup
      syncWithServerDb('write', nextState);

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
        name: 'Hoàng Đức Quang',
        email: 'hoangducquang0207@gmail.com',
        password: '123456',
        phone: '0987400704',
        department: 'Toán - Tin',
        subject: 'Toán',
        school: 'Trường THCS Tân Hiệp'
      },
      {
        id: 't-03',
        name: 'Nguyễn Hưng Hiếu',
        email: 'hieunguyenhung1967@gmail.com',
        password: '123456',
        phone: '0358206641',
        department: 'Văn Sử Địa',
        subject: 'Ngữ văn',
        school: 'Trường THCS Phước Thái'
      },
      {
        id: 't-04',
        name: 'Hoàng Gia Trí',
        email: 'hoangquangntq@gmail.com',
        password: '123456',
        phone: '0862007370',
        department: 'Toán - Tin',
        subject: 'Toán',
        school: 'Trường THCS Tân Hiệp'
      },
      {
        id: 't-05',
        name: 'Nguyễn Quang',
        email: 'quanghoangduc0227@gmail.com',
        password: '123456',
        phone: '0987400704',
        department: 'Toán',
        subject: 'Toán',
        school: 'Trường THCS Phước Thái'
      },
      {
        id: 't-06',
        name: 'Hoàng Quang',
        email: 'hoangquang1611@gmail.com',
        password: '123456',
        phone: '0987400704',
        department: 'Toán - Tin',
        subject: 'Tin học',
        school: 'Trường THCS Phước Thái'
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
    setIsMobileMenuOpen(false);
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
            { id: `s-new-${Math.floor(Math.random() * 100000)}`, name, password: generateStudentPassword(name), avgScore: 0.0, completed: 0 },
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
          password: generateStudentPassword(name),
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

  const handleAIAdvisorSuggest = async (
    subject: string,
    grade: string,
    req: string,
    book: string = 'Kết nối tri thức',
    semester: string = '1',
    periods: string = '4'
  ) => {
    showToast('Gemini AI đang phân tích và lập kế hoạch khung chương trình...', 'info');
    try {
      const res = await fetch('/api/generate-syllabus-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, grade, book, semester, periods, req }),
      });
      const data = await res.json();

      if (data.success && data.syllabus && data.syllabus.chapters && data.syllabus.chapters.length > 0) {
        const generatedChapters: Chapter[] = data.syllabus.chapters.map((ch: any, i: number) => ({
          id: `ch-ai-${Date.now()}-${i}`,
          title: ch.title,
          docxText: ch.docxText || `Tóm tắt chương: ${ch.title}`,
          lessons: (ch.lessons || []).map((le: any, j: number) => ({
            id: `le-ai-${Date.now()}-${i}-${j}`,
            title: le.title,
            topics: Array.isArray(le.topics) && le.topics.length > 0 ? le.topics : [subject, `Lớp ${grade}`],
            docxText: le.docxText || `Yêu cầu cần đạt và nội dung bài học: ${le.title}`,
          })),
        }));

        const aiAdded: Syllabus = {
          id: `sy-ai-${Date.now()}`,
          grade,
          subject,
          book: book || 'Kết nối tri thức',
          semester: semester || '1',
          periods: periods || '4',
          chapters: generatedChapters,
        };

        const updated = [...syllabus, aiAdded];
        setSyllabus(updated);
        syncToLocalStorage({ syllabus: updated });
        showToast(`Gemini AI đã tạo thành công khung chương trình ${subject} Lớp ${grade} với ${generatedChapters.length} Chương!`, 'success');
        return;
      }
    } catch (err) {
      console.warn('API /api/generate-syllabus-ai failed or offline, using fallback generator:', err);
    }

    // Fallback if AI API fails or returns empty
    const fallbackChapters: Chapter[] = [
      {
        id: `ch-ai-fb-1-${Date.now()}`,
        title: `Chương 1: Kiến thức cốt lõi và Nền tảng ${subject} Lớp ${grade}`,
        docxText: `Khái quát mục tiêu học tập môn ${subject} khối ${grade}.`,
        lessons: [
          { id: `le-ai-fb-1`, title: `Bài 1: Khái niệm cơ bản và Định lý trọng tâm`, topics: ['Nền tảng kiến thức', 'Định lý chuẩn'], docxText: 'Kiến thức bài 1.' },
          { id: `le-ai-fb-2`, title: `Bài 2: Phương pháp giải bài tập và Dạng toán điển hình`, topics: ['Phương pháp giải', 'Dạng toán mẫu'], docxText: 'Kiến thức bài 2.' },
        ],
      },
      {
        id: `ch-ai-fb-2-${Date.now()}`,
        title: `Chương 2: Mở rộng và Vận dụng Nâng cao ${subject} Lớp ${grade}`,
        docxText: `Rèn luyện năng lực tư duy độc lập và phân tích chuyên sâu.`,
        lessons: [
          { id: `le-ai-fb-3`, title: `Bài 3: Kỹ năng ứng dụng và Bài tập thực tế`, topics: ['Bài tập ứng dụng', 'Thực tiễn'], docxText: 'Kiến thức bài 3.' },
          { id: `le-ai-fb-4`, title: `Bài 4: Ôn tập tổng hợp và Luyện đề kiểm tra`, topics: ['Ôn tập tổng hợp', 'Mẫu đề thi'], docxText: 'Kiến thức bài 4.' },
        ],
      },
    ];

    const aiAdded: Syllabus = {
      id: `sy-ai-${Date.now()}`,
      grade,
      subject,
      book: book || 'Kết nối tri thức',
      semester: semester || '1',
      periods: periods || '4',
      chapters: fallbackChapters,
    };

    const updated = [...syllabus, aiAdded];
    setSyllabus(updated);
    syncToLocalStorage({ syllabus: updated });
    showToast(`Đã khởi tạo xong khung chương trình ${subject} Lớp ${grade}!`, 'success');
  };

  const handleCreateFullSyllabus = (newSy: Omit<Syllabus, 'id' | 'chapters'> & { chapters?: Chapter[] }) => {
    const createdId = `sy-cust-${Math.floor(Math.random() * 100000)}`;
    const createdSy: Syllabus = {
      ...newSy,
      id: createdId,
      chapters: newSy.chapters || [],
    };
    const updated = [...syllabus, createdSy];
    setSyllabus(updated);
    syncToLocalStorage({ syllabus: updated });
    showToast(`Đã thêm chương trình học môn ${newSy.subject} Khối lớp ${newSy.grade} thành công.`, 'success');
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

  const handleSaveGeneratedExam = (examTitle: string, subject: string, grade: string, generatedQuestions: Question[]) => {
    const newExam: Exam = {
      id: `exam-ai-${Date.now()}`,
      title: examTitle,
      grade: grade,
      subject: subject,
      book: 'Kết nối tri thức',
      type: '1 Tiết',
      duration: 45,
      totalScore: 10,
      questions: generatedQuestions.map(q => q.id),
      createdAt: new Date().toISOString().slice(0, 10),
      createdBy: currentUser.uid || 't-02',
      status: 'Đã duyệt'
    };

    const updatedQuestions = [...generatedQuestions, ...questions];
    const updatedExams = [newExam, ...exams];

    setQuestions(updatedQuestions);
    setExams(updatedExams);

    syncToLocalStorage({ questions: updatedQuestions, exams: updatedExams });
    showToast(`Đã khởi tạo & lưu bộ đề AI "${examTitle}" (${generatedQuestions.length} câu) vào Ngân hàng thành công!`);
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
        isDbLoading={isDbLoading}
        dbLoadError={dbLoadError}
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
        onRefreshDatabase={initAppData}
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

                  const matchResult = verifyStudentLogin(classes, classPass, studentPass);
                  if (!matchResult) {
                    showToast('Mật khẩu lớp hoặc mật khẩu học sinh chưa chính xác! Vui lòng kiểm tra lại.', 'error');
                    return;
                  }

                  const foundClass = matchResult.foundClass;
                  const foundStudent = matchResult.foundStudent;

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
      <div className="flex h-screen h-[100dvh] flex-col overflow-hidden touch-pan-y">
        
        {/* Main Application Header */}
        {!isSidebarInvisible && (
          <header className={`bg-[#0f172a] text-white h-16 flex items-center justify-between px-3 sm:px-6 shadow-md z-30 flex-shrink-0 border-b border-slate-800`}>
            <div className="flex items-center gap-2.5 sm:gap-6">
              {/* Mobile menu button for Teacher/Admin */}
              {currentRole !== 'hs' && currentModule !== 'student-tests' && (
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="lg:hidden p-2 text-slate-300 hover:text-white rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center cursor-pointer transition-colors"
                  title="Mở menu quản trị"
                >
                  {isMobileMenuOpen ? <X className="w-5 h-5 text-emerald-400" /> : <Menu className="w-5 h-5 text-emerald-400" />}
                </button>
              )}

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
                        initAppData();
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
          
          {/* Side navigation sidebar - Desktop (lg:flex) only for Teacher/Admin, completely hidden for Student */}
          {!isSidebarInvisible && currentRole !== 'hs' && currentModule !== 'student-tests' && (
            <aside className="hidden lg:flex w-60 bg-[#0f172a] border-r border-slate-800 flex-col flex-shrink-0 z-20 transition-all duration-300">
              <div className="flex-1 overflow-y-auto py-4 px-3 custom-scrollbar space-y-1">
                <div className="px-3 mb-2 text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-relaxed border-b pb-1 select-none border-slate-800">
                  Phân mục học vụ
                </div>

                {currentRole === 'admin' && (
                  <button
                    onClick={() => navigateTo('admin-panel')}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-bold text-xs transition-colors cursor-pointer mb-2 border border-emerald-500/30 bg-emerald-950/20 ${
                      currentModule === 'admin-panel' ? 'text-emerald-300 bg-emerald-900/40 border-emerald-500/60' : 'text-emerald-400 hover:bg-emerald-900/30'
                    }`}
                  >
                    <Shield className="w-4 h-4 text-emerald-400" />
                    <span>Quản trị hệ thống</span>
                  </button>
                )}

                {(currentRole === 'gv' || currentRole === 'admin') && (
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
                    <button
                      onClick={() => navigateTo('share-app')}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-bold text-xs transition-colors cursor-pointer ${
                        currentModule === 'share-app' ? 'text-emerald-400 bg-slate-800/80' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-850'
                      }`}
                    >
                      <Share2 className="w-4 h-4 text-emerald-500 animate-pulse" />
                      <span>Chia sẻ App cho HS</span>
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

              <div className="p-4 bg-slate-950 border-t border-slate-850 text-[10px] font-extrabold flex flex-col gap-1.5 select-none">
                <div className="flex justify-between items-center text-slate-500">
                  <span>HỆ THỐNG</span>
                  <span>V2.5 FIRESTORE</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">TRẠNG THÁI:</span>
                  {dbLoadError ? (
                    <span className="text-rose-500 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping"></span>Mất kết nối
                    </span>
                  ) : isDbLoading ? (
                    <span className="text-amber-500 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>Đang tải...
                    </span>
                  ) : isSyncing ? (
                    <span className="text-sky-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-spin"></span>Đang đồng bộ...
                    </span>
                  ) : (
                    <span className="text-emerald-500 flex items-center gap-1" title="Toàn bộ môn học, lớp học và tài khoản đã được đồng bộ lên đám mây thành công">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>Đã kết nối mây
                    </span>
                  )}
                </div>
              </div>
            </aside>
          )}

          {/* Mobile Overlay Drawer Sidebar for Teacher/Admin */}
          {!isSidebarInvisible && currentRole !== 'hs' && currentModule !== 'student-tests' && isMobileMenuOpen && (
            <div className="fixed inset-0 z-50 flex lg:hidden">
              <div
                className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs transition-opacity"
                onClick={() => setIsMobileMenuOpen(false)}
              />
              <aside className="relative w-72 max-w-[85vw] bg-[#0f172a] h-full shadow-2xl flex flex-col z-50 border-r border-slate-800 overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-slate-800 text-white shrink-0">
                  <div className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-emerald-400" />
                    <span className="font-extrabold text-xs uppercase tracking-wider text-emerald-400">DANH MỤC QUẢN TRỊ</span>
                  </div>
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-1.5 text-slate-400 hover:text-white rounded-lg bg-slate-800 border border-slate-700 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto py-4 px-3 custom-scrollbar space-y-1">
                  <div className="px-3 mb-2 text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-relaxed border-b pb-1 select-none border-slate-800">
                    Phân mục học vụ
                  </div>

                  {currentRole === 'admin' && (
                    <button
                      onClick={() => navigateTo('admin-panel')}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-bold text-xs transition-colors cursor-pointer mb-2 border border-emerald-500/30 bg-emerald-950/20 ${
                        currentModule === 'admin-panel' ? 'text-emerald-300 bg-emerald-900/40 border-emerald-500/60' : 'text-emerald-400 hover:bg-emerald-900/30'
                      }`}
                    >
                      <Shield className="w-4 h-4 text-emerald-400" />
                      <span>Quản trị hệ thống</span>
                    </button>
                  )}

                  {(currentRole === 'gv' || currentRole === 'admin') && (
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
                      <button
                        onClick={() => navigateTo('share-app')}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-bold text-xs transition-colors cursor-pointer ${
                          currentModule === 'share-app' ? 'text-emerald-400 bg-slate-800/80' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-850'
                        }`}
                      >
                        <Share2 className="w-4 h-4 text-emerald-500 animate-pulse" />
                        <span>Chia sẻ App cho HS</span>
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
              </aside>
            </div>
          )}

          {/* Core scrollable workspace content frame */}
          <main className="flex-1 overflow-y-auto p-3 sm:p-6 md:p-8 custom-scrollbar relative overscroll-y-contain">
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
                onSyncCloudData={handleSyncCloudData}
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
                showToast={showToast}
                onAddQuestions={(newQs) => {
                  setQuestions((prev) => [...prev, ...newQs]);
                  syncToLocalStorage({ questions: [...questions, ...newQs] });
                }}
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
              <ErrorBoundary fallbackTitle="Ngân hàng câu hỏi rèn luyện">
                <QuestionBank
                  questions={displayQuestions}
                  syllabus={syllabus}
                  onAddQuestion={handleAddQuestion}
                  onDeleteQuestion={handleDeleteQuestion}
                  onUpdateQuestion={handleUpdateQuestion}
                  showToast={showToast}
                />
              </ErrorBoundary>
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
                onSyncCloudData={handleSyncCloudData}
              />
            )}

            {currentModule === 'reports' && (
              <ReportsDashboard
                classes={displayClasses}
                submissions={displaySubmissions}
                assignments={displayAssignments}
                exams={displayExams}
                onSyncCloudData={handleSyncCloudData}
              />
            )}

            {currentModule === 'ai-support' && (
              <AISupport
                onAutoAssignRemedial={handleAutoAssignRemedial}
                onSaveGeneratedExam={handleSaveGeneratedExam}
              />
            )}

            {currentModule === 'teacher-config' && (
              <TeacherConfig
                profile={currentUser}
                onSave={(updatedProfile) => {
                  const merged = { ...currentUser, ...updatedProfile };
                  setCurrentUser(merged);
                  localStorage.setItem('quickquiz-teacher-profile-v1', JSON.stringify(merged));

                  // Update teacher account entry in stateRef and sync to Firestore
                  const currentTeachers = stateRef.current.teachers;
                  const updatedTeachers = currentTeachers.map((t) => {
                    if (t.id === merged.uid || t.email.toLowerCase() === merged.email.toLowerCase()) {
                      return {
                        ...t,
                        name: merged.name,
                        email: merged.email,
                        phone: merged.phone,
                        school: merged.school,
                        department: merged.department,
                        subject: merged.department || t.subject,
                      };
                    }
                    return t;
                  });
                  setTeachers(updatedTeachers);
                  syncToLocalStorage({ teachers: updatedTeachers });
                  showToast('Hồ sơ học vụ giáo viên đã lưu thành công!');
                }}
              />
            )}

            {currentModule === 'share-app' && (
              <ShareAppPanel onBack={() => navigateTo('home')} />
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
                onAddSubmission={async (newSub) => {
                  setIsSyncing(true);
                  const result = await syncAndMergeSubmissions(newSub);
                  setSubmissions(result.submissions);
                  syncToLocalStorage({ submissions: result.submissions });
                  setIsSyncing(false);
                  if (result.success) {
                    showToast(`🎉 Học sinh ${newSub.studentName} đã nộp bài thành công! Điểm: ${newSub.score}/10`);
                  } else {
                    showToast(`⚠️ ${result.error || 'Lỗi kết nối máy chủ.'}`, 'error');
                  }
                  return result;
                }}
                soundEnabled={settings.soundEnabled}
                onSetSidebarInvisible={setIsSidebarInvisible}
                onUpdatePassword={handleUpdatePassword}
                onUpdateStudentPassword={handleUpdateStudentPassword}
                onExitStudentRoom={() => {
                  localStorage.removeItem('quickquiz-student-setup-v1');
                  setAuthenticatedRoles((prev) => ({ ...prev, hs: false }));
                  showToast('Đã hoàn tất thoát phòng học sinh.');
                  initAppData();
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
