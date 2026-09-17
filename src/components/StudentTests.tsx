/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Class, Assignment, Exam, Question, Submission, Syllabus, generateStudentPassword } from '../types';
import MathText from './MathText';
import { soundManager } from '../sound';
import { motion, AnimatePresence } from 'motion/react';
import {
  Award,
  Clock,
  FileText,
  CheckCircle,
  ShieldAlert,
  Sparkles,
  BookOpen,
  AlertCircle,
  ChevronLeft,
  LogOut,
  Lock,
  User,
  GraduationCap,
  Edit2,
  Eye,
  EyeOff,
  Save,
  ArrowRight,
  UserCheck,
  HelpCircle,
  Camera,
  X,
  ChevronRight,
  Search,
  Laptop,
  Calculator,
  Book,
  FileQuestion,
  TrendingUp,
  RotateCcw,
  Check,
} from 'lucide-react';

interface StudentTestsProps {
  classes: Class[];
  assignments: Assignment[];
  exams: Exam[];
  questions: Question[];
  submissions: Submission[];
  syllabus: Syllabus[];
  currentUser: { uid: string; name: string; email?: string; classId?: string };
  passwords?: { gv: string; hs: string; admin: string };
  onAddSubmission: (newSub: Submission) => void;
  soundEnabled: boolean;
  onSetSidebarInvisible: (hide: boolean) => void;
  onUpdatePassword?: (role: 'gv' | 'hs' | 'admin', newPass: string) => void;
  onUpdateStudentPassword?: (classId: string, studentId: string, newPass: string) => void;
  onExitStudentRoom?: () => void;
  onStudentProfileChange?: (profile: any) => void;
}

const getQuestionActiveType = (q: any): string => {
  if (q.type === 'MCQ' && /đúng\s*[\/\-]\s*sai|đúng\s+hoặc\s+sai|yes\s*[\/\-]\s*no|xác định tính đúng/i.test(q.content || '')) {
    return 'YESNO';
  }
  return q.type;
};

const getQuestionTruthAnswers = (q: any): string[] => {
  if (q.answer.includes(',') || q.answer.includes('true') || q.answer.includes('false')) {
    return q.answer.split(',');
  }
  const idx = parseInt(q.answer);
  if (!isNaN(idx) && idx >= 0 && idx <= 3) {
    const arr = ['false', 'false', 'false', 'false'];
    arr[idx] = 'true';
    return arr;
  }
  return ['true', 'true', 'true', 'true'];
};

export default function StudentTests({
  classes,
  assignments,
  exams,
  questions,
  submissions,
  syllabus,
  currentUser,
  passwords,
  onAddSubmission,
  soundEnabled,
  onSetSidebarInvisible,
  onUpdatePassword,
  onUpdateStudentPassword,
  onExitStudentRoom,
  onStudentProfileChange,
}: StudentTestsProps) {
  // Wizard authentication & profile setup states
  const [profile, setProfile] = useState<{
    classId: string;
    subject: string;
    studentName: string;
    studentId?: string;
    isConfirmed: boolean;
  }>(() => {
    const saved = localStorage.getItem('quickquiz-student-setup-v1');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.classId && parsed.studentName) {
          return { ...parsed, isConfirmed: true };
        }
      } catch (e) {}
    }
    return {
      classId: '',
      subject: 'Toán học',
      studentName: '',
      studentId: '',
      isConfirmed: false,
    };
  });

  // Sync profile when currentUser prop changes (e.g. from role switcher or direct login)
  useEffect(() => {
    const saved = localStorage.getItem('quickquiz-student-setup-v1');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.classId && parsed.studentName) {
          setProfile({ ...parsed, isConfirmed: true });
          return;
        }
      } catch (e) {}
    }
    // Fallback if currentUser is defined as student
    if (currentUser && currentUser.uid && currentUser.uid !== 'gv-demo' && currentUser.uid !== 'admin-demo' && currentUser.uid !== 's-01') {
      setProfile({
        classId: currentUser.classId || '',
        subject: 'Toán học',
        studentName: currentUser.name || '',
        studentId: currentUser.uid,
        isConfirmed: !!currentUser.classId,
      });
    } else {
      setProfile({
        classId: '',
        subject: 'Toán học',
        studentName: '',
        studentId: '',
        isConfirmed: false,
      });
    }
  }, [currentUser]);

  // Student Login flow states
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [classPassInput, setClassPassInput] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [studentPassInput, setStudentPassInput] = useState('');
  const [showStudentPass, setShowStudentPass] = useState(false);
  const [loginStep, setLoginStep] = useState<1 | 2>(1);
  const [loginError, setLoginError] = useState('');

  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);

  // States for Student self-service password changing
  const [isChangingPass, setIsChangingPass] = useState(false);
  const [changePassInput, setChangePassInput] = useState('');
  const [changePassError, setChangePassError] = useState('');
  const [showChangePass, setShowChangePass] = useState(false);

  // States for class security password checking
  const [classPasswordInput, setClassPasswordInput] = useState('');
  const [showClassPassword, setShowClassPassword] = useState(false);
  const [classPasswordError, setClassPasswordError] = useState('');

  const [activeSession, setActiveSession] = useState<{
    assignment: Assignment;
    exam: Exam;
    answers: Record<string, any>;
    timeLeft: number;
  } | null>(null);

  const [previewSubId, setPreviewSubId] = useState<string | null>(null);

  // Modals for robust iframe operations
  const [showExitExamModal, setShowExitExamModal] = useState(false);
  const [showChangeClassModal, setShowChangeClassModal] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Enhanced Student Interface States for Dual Subjects (Toán & Tin học)
  const [activeTab, setActiveTab] = useState<'assignments' | 'practice'>('assignments');
  const [activeSubjectTab, setActiveSubjectTab] = useState<'all' | 'toan' | 'tin'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'submitted'>('all');

  // Self-Practice States
  const [activePracticeSubject, setActivePracticeSubject] = useState<'Toán' | 'Tin học'>('Toán');
  const [selectedChapterId, setSelectedChapterId] = useState('');
  const [selectedLessonId, setSelectedLessonId] = useState('');
  const [practiceLength, setPracticeLength] = useState<5 | 10>(5);

  const handlePracticeSubjectChange = (subject: 'Toán' | 'Tin học') => {
    setActivePracticeSubject(subject);
    setSelectedChapterId('');
    setSelectedLessonId('');
  };

  // Locate current student class & assignment according to student-selected profile
  const studentClass = classes.find((c) => c.id === profile.classId) || classes[0];

  // Find all classes where this student is registered under their name
  const myClasses = classes.filter((c) =>
    c.students.some((s) => s.name.trim().toLowerCase() === profile.studentName.trim().toLowerCase())
  );
  
  // Combine assignments from all classes they belong to
  const activeClasses = myClasses.length > 0 ? myClasses : (studentClass ? [studentClass] : []);
  const activeClassIds = activeClasses.map((c) => c.id);
  const classAssignments = assignments.filter((as) => activeClassIds.includes(as.classId));

  const resolvedStudentId = studentClass?.students.find((s) => s.name === profile.studentName)?.id || `s-g-${Math.floor(Math.random() * 10000)}`;

  const handleStartExam = (as: Assignment, ex: Exam) => {
    setActiveSession({
      assignment: as,
      exam: ex,
      answers: {},
      timeLeft: ex.duration * 60,
    });
    // Hide App Frame Sidebar and Header for focused examination taking
    onSetSidebarInvisible(true);
  };

  const handleSetAnswer = (qId: string, val: any) => {
    if (!activeSession) return;
    soundManager.playClick();
    setActiveSession({
      ...activeSession,
      answers: {
        ...activeSession.answers,
        [qId]: val,
      },
    });
  };

  const handleSetEssayAnswer = (qId: string, text: string, image?: string) => {
    handleSetAnswer(qId, { text, image });
  };

  const handleSetYesNoAnswer = (qId: string, itemIdx: number, val: string) => {
    if (!activeSession) return;
    soundManager.playClick();
    const current = activeSession.answers[qId] || ['', '', '', ''];
    const updated = Array.isArray(current) ? [...current] : ['', '', '', ''];
    updated[itemIdx] = val;
    handleSetAnswer(qId, updated);
  };

  const handleSetYesNoTextAnswer = (qId: string, val: string) => {
    if (!activeSession) return;
    const current = activeSession.answers[qId] || ['', '', '', '', ''];
    const updated = Array.isArray(current) ? [...current] : ['', '', '', '', ''];
    while (updated.length < 5) updated.push('');
    updated[4] = val;
    handleSetAnswer(qId, updated);
  };

  const handleExecuteGradeSubmission = (forced = false) => {
    if (!activeSession) return;
    if (timerRef.current) clearInterval(timerRef.current);

    const { assignment, exam, answers } = activeSession;
    let totalScore = 0;
    const pointPerQ = 10 / exam.questions.length;

    exam.questions.forEach((qId) => {
      const q = questions.find((item) => item.id === qId);
      if (!q) return;

      const studentAns = answers[qId];
      const qType = getQuestionActiveType(q);

      if (qType === 'MCQ') {
        if (String(studentAns || '').trim() === q.answer.trim()) {
          totalScore += pointPerQ;
        }
      } else if (qType === 'YESNO') {
        const truthAnswers = getQuestionTruthAnswers(q);
        const ansArray = Array.isArray(studentAns) ? studentAns : ['', '', '', ''];

        let matchCount = 0;
        for (let i = 0; i < 4; i++) {
          if (truthAnswers[i] === ansArray[i]) {
            matchCount++;
          }
        }

        if (matchCount === 1) totalScore += 0.1 * pointPerQ;
        else if (matchCount === 2) totalScore += 0.25 * pointPerQ;
        else if (matchCount === 3) totalScore += 0.5 * pointPerQ;
        else if (matchCount === 4) totalScore += 1.0 * pointPerQ;
      } else if (qType === 'SHORT') {
        if (String(studentAns || '').trim().toLowerCase() === q.answer.trim().toLowerCase()) {
          totalScore += pointPerQ;
        }
      } else if (qType === 'ESSAY') {
        // Retrieve essay text content cleanly
        const textVal = typeof studentAns === 'object' && studentAns !== null ? studentAns.text : (studentAns || '');
        // Initial auto review draft grants partial score, awaiting manual essay grading portal
        if (textVal.trim()) {
          totalScore += pointPerQ * 0.8;
        }
      }
    });

    totalScore = Math.min(10.0, Math.max(0.0, Math.round(totalScore * 10) / 10));

    const newSub: Submission = {
      id: `sub-stud-${Math.floor(Math.random() * 100000)}`,
      assignmentId: assignment.id,
      studentId: resolvedStudentId,
      studentName: profile.studentName,
      answers,
      score: totalScore,
      submittedAt: new Date().toISOString(),
      gradedBy: 'Hệ thống tự động',
      comment: 'Bài làm lý thuyết cơ bản đã ghi nhận. Giáo viên đang trực tiếp chấm tự luận chi tiết.',
      status: 'Chưa chấm',
    };

    onAddSubmission(newSub);
    onSetSidebarInvisible(false);
    setActiveSession(null);

    soundManager.playComplete();
  };

  // Exit examination room without finishing (Counts as 1 attempt with 0 marks)
  const handleExitAndSubmitZero = () => {
    if (!activeSession) return;
    setShowExitExamModal(true);
  };

  // Timer runner
  useEffect(() => {
    if (!activeSession) return;

    timerRef.current = setInterval(() => {
      setActiveSession((prev) => {
        if (!prev) return null;
        if (prev.timeLeft <= 1) {
          clearInterval(timerRef.current!);
          setTimeout(() => {
            handleExecuteGradeSubmission(true);
          }, 10);
          return null;
        }
        return {
          ...prev,
          timeLeft: prev.timeLeft - 1,
        };
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [activeSession !== null]);

  // Handle viewing solution details
  const previewSub = submissions.find((s) => s.id === previewSubId);
  const previewAs = previewSub ? assignments.find((a) => a.id === previewSub.assignmentId) : null;
  const previewExam = previewAs ? exams.find((e) => e.id === previewAs.examId) : null;

  // Render Taking Exam active view
  if (activeSession) {
    const min = Math.floor(activeSession.timeLeft / 60);
    const sec = activeSession.timeLeft % 60;
    return (
      <div className="fixed inset-0 bg-[#0f172a] text-slate-100 z-50 flex flex-col overflow-hidden font-sans select-none">
        {/* Sticky top timer bar */}
        <header className="bg-slate-900 h-16 flex items-center justify-between px-6 border-b border-slate-800 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-600 rounded-lg">
              <Sparkles className="text-white w-4.5 h-4.5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-200 uppercase tracking-wider">{activeSession.exam.title}</h2>
              <p className="text-[10px] text-zinc-400 uppercase font-black tracking-wide">Trạng thái rèn luyện bảo mật</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Clock timer */}
            <div className="flex items-center gap-1.5 bg-red-950/80 border border-red-900 text-red-400 px-3 py-1 rounded-full font-bold font-mono text-xs sm:text-sm">
              <Clock className="w-3.5 h-3.5 animate-pulse" />
              <span>{`${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`}</span>
            </div>

            {/* EXIT EXAM ROOM BACK TO HOMEPAGE (Counts as 1 attempt with 0 marks) */}
            <button
              onClick={handleExitAndSubmitZero}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-[10px] sm:text-xs rounded-xl border border-slate-700 transition-all cursor-pointer uppercase tracking-wider"
              title="Thoát lập tức - Lượt tính 0 điểm"
            >
              Trở về trang chủ học sinh
            </button>

            {/* Submission button */}
            <button
              onClick={() => handleExecuteGradeSubmission(false)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[10px] sm:text-xs rounded-xl transition-all uppercase tracking-wider cursor-pointer"
            >
              NỘP BÀI THI
            </button>
          </div>
        </header>

        {/* Exam items cards */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-8 md:p-12 bg-slate-950/75">
          <div className="max-w-3xl mx-auto space-y-6">
            {activeSession.exam.questions.map((qId, idx) => {
              const q = questions.find((item) => item.id === qId);
              if (!q) return null;

              const answersStored = activeSession.answers[qId];
              const qActiveType = getQuestionActiveType(q);

              return (
                <div key={q.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-md">
                  <div className="flex justify-between items-center">
                    <span className="text-xs uppercase font-extrabold text-emerald-400 tracking-wider">
                      Câu hỏi {idx + 1}
                    </span>
                    <span className="text-[10px] font-bold text-slate-500 uppercase">
                      Dạng bài: {qActiveType === 'MCQ' ? 'Trắc nghiệm' : qActiveType === 'YESNO' ? 'Đúng/Sai' : qActiveType === 'SHORT' ? 'Điền khuyết' : 'Tự luận'}
                    </span>
                  </div>

                  <p className="text-sm sm:text-base text-slate-100 font-semibold leading-relaxed">
                    <MathText text={q.content} />
                  </p>

                  {/* Standard MCQ selection cards */}
                  {qActiveType === 'MCQ' && (
                    <div className="space-y-2 mt-4">
                      <p className="text-slate-400 font-bold text-xs">Hãy chọn 1 đáp án đúng duy nhất:</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {q.options.slice(0, 4).map((opt, oIdx) => {
                          const isSelected = answersStored === String(oIdx);
                          return (
                            <button
                              key={oIdx}
                              onClick={() => handleSetAnswer(q.id, String(oIdx))}
                              className={`p-4 rounded-xl border text-left text-xs font-semibold leading-relaxed transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-emerald-950/40 border-emerald-500 text-emerald-300 ring-2 ring-emerald-500/20'
                                  : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:bg-slate-850/50'
                              }`}
                            >
                              <span className="font-bold mr-1">{['A', 'B', 'C', 'D'][oIdx]}.</span> <MathText text={opt} />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* YesNo 4 items rows selectors */}
                  {qActiveType === 'YESNO' && (
                    <div className="space-y-4 mt-4 font-semibold text-xs">
                      {q.options && q.options.length > 0 ? (
                        <div className="space-y-3">
                          {q.options.slice(0, 4).map((opt, oIdx) => {
                            const currentVal = Array.isArray(answersStored) ? answersStored[oIdx] : '';
                            return (
                              <div
                                key={oIdx}
                                className="bg-slate-950/45 p-3 rounded-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4"
                              >
                                <span className="text-slate-400 max-w-lg leading-relaxed flex items-center gap-1.5">
                                  <span className="font-bold text-slate-300">{['a', 'b', 'c', 'd'][oIdx]})</span>{' '}
                                  <MathText text={opt} />
                                </span>

                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleSetYesNoAnswer(q.id, oIdx, 'true')}
                                    className={`px-4 py-1.5 rounded-lg border text-xs font-extrabold transition-all cursor-pointer ${
                                      currentVal === 'true'
                                        ? 'bg-emerald-950/50 border-emerald-500 text-emerald-400'
                                        : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-350'
                                    }`}
                                  >
                                    Đúng
                                  </button>
                                  <button
                                    onClick={() => handleSetYesNoAnswer(q.id, oIdx, 'false')}
                                    className={`px-4 py-1.5 rounded-lg border text-xs font-extrabold transition-all cursor-pointer ${
                                      currentVal === 'false'
                                        ? 'bg-rose-950/50 border-rose-500 text-rose-400'
                                        : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-350'
                                    }`}
                                  >
                                    Sai
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="bg-slate-950/45 p-4 rounded-xl border border-slate-800 space-y-3">
                          <p className="text-slate-400 font-bold text-xs">Chọn đáp án cho câu hỏi này:</p>
                          <div className="flex gap-3">
                            <button
                              onClick={() => handleSetAnswer(q.id, 'true')}
                              className={`px-6 py-2.5 rounded-xl border text-xs font-extrabold transition-all cursor-pointer ${
                                answersStored === 'true'
                                  ? 'bg-emerald-950/50 border-emerald-500 text-emerald-400'
                                  : 'bg-slate-900 border-slate-800 text-slate-500'
                              }`}
                            >
                              Đúng
                            </button>
                            <button
                              onClick={() => handleSetAnswer(q.id, 'false')}
                              className={`px-6 py-2.5 rounded-xl border text-xs font-extrabold transition-all cursor-pointer ${
                                answersStored === 'false'
                                  ? 'bg-rose-950/50 border-rose-500 text-rose-400'
                                  : 'bg-slate-900 border-slate-800 text-slate-500'
                              }`}
                            >
                              Sai
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Explicit text input box for YESNO student explanation / custom answer */}
                      <div className="space-y-1.5 mt-2 bg-slate-950/20 p-3.5 border border-slate-800/60 rounded-xl">
                        <label className="text-[10px] sm:text-xs uppercase font-extrabold text-slate-400 tracking-wider block">
                          Ô nhập giải thích / câu trả lời của học sinh:
                        </label>
                        <input
                          type="text"
                          value={Array.isArray(answersStored) && answersStored[4] ? answersStored[4] : (typeof answersStored === 'string' && answersStored !== 'true' && answersStored !== 'false' ? answersStored : '')}
                          onChange={(e) => handleSetYesNoTextAnswer(q.id, e.target.value)}
                          placeholder="Nhập thêm nội dung giải thích Đúng/Sai hoặc đáp số chi tiết của bạn tại đây..."
                          className="bg-slate-950/50 border border-slate-800 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-xl px-4 py-2.5 text-xs w-full focus:outline-none font-semibold placeholder:text-slate-650 text-white font-sans"
                        />
                      </div>
                    </div>
                  )}

                  {/* Short typed box */}
                  {qActiveType === 'SHORT' && (
                    <div className="mt-4 space-y-2">
                      <label className="text-[10px] sm:text-xs uppercase font-extrabold text-slate-400 tracking-wider block">
                        Ô nhập câu trả lời ngắn của học sinh:
                      </label>
                      <input
                        type="text"
                        value={answersStored || ''}
                        onChange={(e) => handleSetAnswer(q.id, e.target.value)}
                        placeholder="Nhập trị số / đáp án ngắn chính xác..."
                        className="bg-slate-950/50 border border-slate-800 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-white rounded-xl px-4 py-3 text-xs w-full focus:outline-none font-bold placeholder:text-slate-600 font-mono"
                      />
                    </div>
                  )}

                  {/* Essay textbox + File Uploading handy controls */}
                  {qActiveType === 'ESSAY' && (
                    <div className="mt-4 space-y-4">
                      <div className="space-y-2">
                        <label className="text-[10px] sm:text-xs uppercase font-extrabold text-slate-400 tracking-wider block">
                          Ô nhập bài giải tự luận của học sinh:
                        </label>
                        <textarea
                          rows={5}
                          value={
                            typeof answersStored === 'object' && answersStored !== null
                              ? answersStored.text
                              : (answersStored || '')
                          }
                          onChange={(e) => {
                            const currentText = e.target.value;
                            const currentImage =
                              typeof answersStored === 'object' && answersStored !== null
                                ? answersStored.image
                                : undefined;
                            handleSetEssayAnswer(q.id, currentText, currentImage);
                          }}
                          placeholder="Trình bày giải thích chi tiết đáp án tự luận tại đây..."
                          className="bg-slate-950/50 border border-slate-800 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-xl p-4 text-xs w-full focus:outline-none leading-relaxed placeholder:text-slate-600 text-white font-sans font-semibold"
                        />
                      </div>

                      {/* File upload mechanism for essay hand-written image */}
                      <div className="bg-slate-900/65 border border-slate-800 p-4 rounded-xl space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5 leading-none">
                            <Camera className="w-4 h-4 text-emerald-400" />
                            Đính kèm ảnh bài viết tay tự luận học sinh
                          </label>

                          <div className="relative">
                            <input
                              type="file"
                              accept="image/*"
                              id={`file-upload-${q.id}`}
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onload = () => {
                                    const text =
                                      typeof answersStored === 'object' && answersStored !== null
                                        ? answersStored.text
                                        : (answersStored || '');
                                    handleSetEssayAnswer(q.id, text, reader.result as string);
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                            />
                            <label
                              htmlFor={`file-upload-${q.id}`}
                              className="px-3.5 py-1.5 bg-emerald-600 text-white hover:bg-emerald-500 text-[11px] font-black rounded-lg border border-emerald-400/20 cursor-pointer transition-all inline-block uppercase tracking-wider"
                            >
                              Tải lên ảnh bài viết tay
                            </label>
                          </div>
                        </div>

                        {/* Rendering uploaded preview image */}
                        {typeof answersStored === 'object' && answersStored !== null && answersStored.image && (
                          <div className="relative w-40 h-40 border border-slate-700 bg-slate-950 rounded-xl overflow-hidden group mt-2">
                            <img
                              src={answersStored.image}
                              alt="Ảnh nháp bài giải viết tay"
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute inset-0 bg-slate-950/70 py-1.5 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                              <button
                                type="button"
                                onClick={() => {
                                  const text =
                                    typeof answersStored === 'object' && answersStored !== null
                                      ? answersStored.text
                                      : (answersStored || '');
                                  handleSetEssayAnswer(q.id, text, undefined);
                                }}
                                className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-[10px] uppercase font-black tracking-wide cursor-pointer flex items-center gap-1"
                              >
                                <X className="w-3.5 h-3.5" />
                                Gỡ bỏ ảnh
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </main>
      </div>
    );
  }

  // Solution review screen
  if (previewSub && previewExam) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setPreviewSubId(null)}
            className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            Trở lại phòng luyện
          </button>
        </div>

        <div className="bg-white border rounded-2xl p-6 space-y-4">
          <h2 className="font-extrabold text-slate-800 text-base">Xem kết quả chi tiết: {previewExam.title}</h2>
          <p className="text-xs text-rose-600 font-bold uppercase bg-rose-50 px-3 py-1.5 rounded-lg w-fit">
            Điểm số đạt được: {previewSub.score.toFixed(1)} / 10
          </p>

          <div className="space-y-6 pt-4">
            {previewExam.questions.map((qId, idx) => {
              const q = questions.find((item) => item.id === qId);
              if (!q) return null;

              const studAns = previewSub.answers[qId];
              const qActiveType = getQuestionActiveType(q);

              return (
                <div key={q.id} className="p-4 bg-slate-50 border rounded-xl space-y-2 text-xs">
                  <div className="font-bold text-slate-800 flex items-center gap-2">
                    <span className="text-emerald-600 uppercase">Câu {idx + 1}</span>
                    <span className="text-slate-400">({qActiveType === 'YESNO' ? 'Đúng/Sai' : qActiveType === 'MCQ' ? 'Trắc nghiệm' : qActiveType === 'SHORT' ? 'Trả lời ngắn' : 'Tự luận'})</span>
                  </div>
                  <p className="font-semibold text-slate-700">
                    <MathText text={q.content} />
                  </p>

                  <div className="bg-white p-3 rounded-lg border space-y-1 mt-2">
                    <div className="font-bold text-slate-500">Bài làm học sinh:</div>
                    <div className="font-extrabold text-emerald-700">
                      {qActiveType === 'YESNO' && Array.isArray(studAns) ? (
                        <div className="space-y-1">
                          {q.options && q.options.slice(0, 4).map((opt, oIdx) => (
                            <span key={oIdx} className="block font-sans">
                              {['a', 'b', 'c', 'd'][oIdx]}): {studAns[oIdx] === 'true' ? 'Đúng' : studAns[oIdx] === 'false' ? 'Sai' : 'Chưa chọn'}
                            </span>
                          ))}
                          {studAns[4] && (
                            <div className="mt-2 pt-2 border-t text-slate-650 text-[11px] font-semibold leading-relaxed">
                              <span className="text-slate-400 block uppercase text-[9px] font-black">Giải thích / Ý kiến kèm theo:</span>
                              <p className="bg-slate-50 p-2 rounded border mt-1 font-sans">{studAns[4]}</p>
                            </div>
                          )}
                        </div>
                      ) : typeof studAns === 'object' && studAns !== null ? (
                        <div className="space-y-2">
                          <div>{studAns.text ? studAns.text : <span className="text-slate-400 italic">Không có câu trả lời viết tay.</span>}</div>
                          {studAns.image && (
                            <div className="relative w-32 h-32 border bg-slate-100 rounded-lg overflow-hidden mt-1">
                              <img src={studAns.image} alt="Ảnh tự luận viết tay" className="w-full h-full object-cover" />
                            </div>
                          )}
                        </div>
                      ) : (
                        String(studAns || 'Chưa thực hiện trả lời')
                      )}
                    </div>

                    <div className="text-slate-400 mt-2 font-bold">Đáp án chuẩn:</div>
                    <div className="font-bold text-slate-800 font-mono text-[11px]">
                      {qActiveType === 'YESNO' ? (
                        getQuestionTruthAnswers(q).map((val, oIdx) => (
                          <span key={oIdx} className="block font-sans text-[11px]">
                            {['a', 'b', 'c', 'd'][oIdx]}): {val === 'true' ? 'Đúng' : 'Sai'}
                          </span>
                        ))
                      ) : (
                        qActiveType === 'MCQ' ? (['A', 'B', 'C', 'D'][parseInt(q.answer)] || q.answer) : q.answer
                      )}
                    </div>

                    {q.explain && (
                      <div className="bg-slate-50 p-2 rounded text-slate-500 text-[11px] border border-slate-150 mt-2 whitespace-pre-line font-medium leading-relaxed">
                        <strong>Lời giải chi tiết:</strong> {q.explain}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Handlers for student login
  const handleDualPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    const classPass = classPassInput.trim();
    const studentPass = studentPassInput.trim();

    if (!classPass || !studentPass) {
      setLoginError('Vui lòng nhập đầy đủ cả hai mật khẩu!');
      return;
    }

    // Find classes matching class password
    const matchedClasses = classes.filter(c => c.joinPass.trim() === classPass);
    if (matchedClasses.length === 0) {
      setLoginError('Mật khẩu lớp chưa chính xác! Vui lòng kiểm tra lại.');
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
      setLoginError('Mật khẩu học sinh chưa chính xác! Vui lòng kiểm tra lại.');
      return;
    }

    // Success! Log in!
    const confirmedProfile = {
      classId: foundClass.id,
      subject: foundClass.subject,
      studentName: foundStudent.name,
      studentId: foundStudent.id,
      isConfirmed: true
    };
    setProfile(confirmedProfile);
    localStorage.setItem('quickquiz-student-setup-v1', JSON.stringify(confirmedProfile));
    
    if (onStudentProfileChange) {
      onStudentProfileChange(confirmedProfile);
    }
    
    // Clear inputs
    setClassPassInput('');
    setStudentPassInput('');
    setLoginError('');
  };

  const handleStudentChangePass = (e: React.FormEvent) => {
    e.preventDefault();
    setChangePassError('');
    const newPass = changePassInput.trim();
    if (!newPass) {
      setChangePassError('Mật khẩu mới không được để trống.');
      return;
    }
    const matchedClass = classes.find(c => c.id === profile.classId);
    if (!matchedClass) {
      setChangePassError('Không tìm thấy thông tin lớp học.');
      return;
    }
    const student = matchedClass.students.find(s => s.name === profile.studentName);
    if (!student) {
      setChangePassError('Không tìm thấy thông tin tài khoản học sinh.');
      return;
    }

    if (onUpdateStudentPassword) {
      onUpdateStudentPassword(matchedClass.id, student.id, newPass);
      setIsChangingPass(false);
      setChangePassInput('');
      alert('Thay đổi mật khẩu cá nhân thành công!');
    } else {
      setChangePassError('Hệ thống chưa hỗ trợ đồng bộ mật khẩu mới.');
    }
  };

  // 1. CHƯA XÁC NHẬN HỒ SƠ - GIAO DIỆN LIÊN KẾT VỚI MÃ THAM GIA LỚP & MẬT KHẨU
  if (!profile.isConfirmed) {
    return (
      <div className="flex items-center justify-center min-h-[450px] p-4 font-sans select-none">
        <div className="w-full max-w-md bg-[#1e2530] text-slate-100 rounded-3xl border border-slate-700/60 shadow-2xl p-6 md:p-8 space-y-6">
          
          {/* Header style */}
          <div className="flex items-start gap-4 border-b border-slate-700/30 pb-4">
            <div className="p-3 bg-emerald-950/40 border border-emerald-500/20 text-[#10b981] rounded-2xl shrink-0">
              <Lock className="w-6 h-6" />
            </div>
            <div className="space-y-0.5">
              <h3 className="text-sm sm:text-base font-black text-slate-100 uppercase tracking-wider">
                XÁC MINH VAI TRÒ TRUY CẬP
              </h3>
              <p className="text-[10px] sm:text-xs font-bold text-emerald-400 uppercase tracking-widest leading-none">
                CHUYỂN MỤC SANG: HỌC SINH
              </p>
            </div>
          </div>

          <form onSubmit={handleDualPasswordSubmit} className="space-y-4">
            {/* MẬT KHẨU LỚP */}
            <div className="space-y-2">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider block">
                MẬT KHẨU LỚP
              </label>
              <div className="relative">
                <input
                  type={showClassPassword ? 'text' : 'password'}
                  value={classPassInput}
                  onChange={(e) => {
                    setClassPassInput(e.target.value);
                    setLoginError('');
                  }}
                  placeholder="Nhập mật khẩu lớp học..."
                  required
                  className="w-full pl-4 pr-11 py-3 text-sm bg-[#0f172a] text-white border border-slate-850 focus:border-emerald-500/80 rounded-2xl focus:ring-1 focus:ring-emerald-500 font-mono tracking-wide placeholder:text-slate-500 focus:outline-none transition-all h-12 font-bold"
                />
                <button
                  type="button"
                  onClick={() => setShowClassPassword(!showClassPassword)}
                  className="absolute right-3.5 top-3.5 text-slate-500 hover:text-slate-350 cursor-pointer"
                >
                  {showClassPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* MẬT KHẨU HỌC SINH */}
            <div className="space-y-2">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider block">
                MẬT KHẨU HỌC SINH
              </label>
              <div className="relative">
                <input
                  type={showStudentPass ? 'text' : 'password'}
                  value={studentPassInput}
                  onChange={(e) => {
                    setStudentPassInput(e.target.value);
                    setLoginError('');
                  }}
                  placeholder="Nhập mật khẩu cá nhân học sinh..."
                  required
                  className="w-full pl-4 pr-11 py-3 text-sm bg-[#0f172a] text-white border border-slate-850 focus:border-emerald-500/80 rounded-2xl focus:ring-1 focus:ring-emerald-500 font-mono tracking-wide placeholder:text-slate-500 focus:outline-none transition-all h-12 font-bold"
                />
                <button
                  type="button"
                  onClick={() => setShowStudentPass(!showStudentPass)}
                  className="absolute right-3.5 top-3.5 text-slate-500 hover:text-slate-350 cursor-pointer"
                >
                  {showStudentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {loginError && (
              <p className="text-[11px] text-rose-400 font-bold bg-rose-950/20 border border-rose-900/30 p-2.5 rounded-xl">
                ⚠️ {loginError}
              </p>
            )}

            {/* Pins and tips matching picture visual */}
            <div className="bg-[#242f3d] border border-slate-700/30 text-[#10b881] px-4 py-2.5 rounded-xl text-xs flex flex-col gap-1.5 font-bold">
              <div className="flex items-start gap-1 text-[11px] text-slate-300">
                <span>📌</span>
                <span><strong>Mật khẩu lớp:</strong> Do Giáo viên cấp cho lớp học tương ứng.</span>
              </div>
              <div className="flex items-start gap-1 text-[11px] text-slate-300">
                <span>📌</span>
                <span><strong>Mật khẩu học sinh:</strong> Mặc định là Họ và Tên viết thường, liền nhau, không dấu (ví dụ: học sinh <span className="text-emerald-400">Đinh Thị Kim Nhi</span> có mật khẩu là <span className="text-emerald-400 font-mono">dinhthikimnhi</span>).</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              {onExitStudentRoom && (
                <button
                  type="button"
                  onClick={onExitStudentRoom}
                  className="px-5 py-2.5 bg-[#202936] hover:bg-[#2d3a4f] text-slate-300 font-bold rounded-xl text-xs transition-colors border border-slate-700/45 uppercase tracking-widest cursor-pointer"
                >
                  Hủy bỏ
                </button>
              )}
              <button
                type="submit"
                className="px-6 py-2.5 bg-[#059669] hover:bg-[#05a676] text-white text-xs font-black rounded-xl transition-all uppercase tracking-widest cursor-pointer shadow-md active:scale-95"
              >
                Xác nhận
              </button>
            </div>
          </form>

        </div>
      </div>
    );
  }

  // 2. PHẦN TRỒNG THÔNG TIN TRANG CHỦ HỌC SINH ĐÃ XÁC THỰC
  
  // Dynamic statistics computation for Math & Informatics
  const getSubjectStats = (subjectName: 'Toán' | 'Tin học') => {
    const subjectAssignments = classAssignments.filter(as => {
      const exam = exams.find(e => e.id === as.examId);
      return exam && (exam.subject.toLowerCase().includes(subjectName.toLowerCase()) || subjectName.toLowerCase().includes(exam.subject.toLowerCase()));
    });

    const total = subjectAssignments.length;
    
    const completedSubmissions = submissions.filter(s => 
      subjectAssignments.some(as => as.id === s.assignmentId) &&
      (s.studentId === resolvedStudentId || s.studentName === profile.studentName)
    );
    
    const completed = completedSubmissions.length;
    const pending = total - completed;
    
    const avgScore = completed > 0 
      ? completedSubmissions.reduce((sum, s) => sum + s.score, 0) / completed 
      : 0;

    return { total, completed, pending, avgScore };
  };

  const toanStats = getSubjectStats('Toán');
  const tinStats = getSubjectStats('Tin học');

  // Filter assignments based on search, subject tab, and status filters
  const filteredAssignments = classAssignments.filter((as) => {
    const exam = exams.find((e) => e.id === as.examId);
    if (!exam) return false;

    // 1. Subject Tab Filter
    if (activeSubjectTab === 'toan') {
      const sub = exam.subject.toLowerCase();
      if (!sub.includes('toán')) return false;
    } else if (activeSubjectTab === 'tin') {
      const sub = exam.subject.toLowerCase();
      if (!sub.includes('tin')) return false;
    }

    // 2. Status Filter
    const hasSubmission = submissions.some(
      (s) => s.assignmentId === as.id && (s.studentId === resolvedStudentId || s.studentName === profile.studentName)
    );
    if (statusFilter === 'pending' && hasSubmission) return false;
    if (statusFilter === 'submitted' && !hasSubmission) return false;

    // 3. Search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      if (!exam.title.toLowerCase().includes(query) && !(as.message || '').toLowerCase().includes(query)) return false;
    }

    return true;
  });

  // Self-Practice Syllabus Browsing & Filtering
  const practiceChapters = syllabus.filter(sy => sy.subject.toLowerCase().includes(activePracticeSubject.toLowerCase()))[0]?.chapters || [];
  const selectedChapter = practiceChapters.find(ch => ch.id === selectedChapterId);
  const practiceLessons = selectedChapter?.lessons || [];
  const selectedLesson = practiceLessons.find(le => le.id === selectedLessonId);

  // Available Questions matching chosen practice criteria
  const availablePracticeQuestions = questions.filter(q => {
    const qSub = q.subject.toLowerCase();
    const activeSub = activePracticeSubject.toLowerCase();
    if (!qSub.includes(activeSub) && !activeSub.includes(qSub)) return false;
    
    if (selectedLessonId) {
      return q.lessonId === selectedLessonId;
    }
    if (selectedChapterId) {
      return q.chapterId === selectedChapterId;
    }
    return true;
  });

  // Action to start generated self-practice exam
  const handleStartSelfPractice = () => {
    if (availablePracticeQuestions.length === 0) return;
    soundManager.playSuccess();

    // Shuffle and slice questions for practice length
    const shuffled = [...availablePracticeQuestions].sort(() => 0.5 - Math.random());
    const selectedQuestions = shuffled.slice(0, Math.min(practiceLength, shuffled.length));
    
    const dummyExamId = `ex-practice-${Date.now()}`;
    const dummyAssignId = `as-practice-${Date.now()}`;
    
    const dummyExam: Exam = {
      id: dummyExamId,
      title: `Luyện tập tự học: Môn ${activePracticeSubject} ${selectedLesson ? `- ${selectedLesson.title}` : selectedChapter ? `- ${selectedChapter.title}` : ''}`,
      grade: studentClass?.grade || '8',
      subject: activePracticeSubject,
      book: studentClass?.book || 'Kết nối tri thức',
      type: 'kiểm tra thường xuyên',
      duration: practiceLength === 5 ? 10 : 20,
      totalScore: 10,
      questions: selectedQuestions.map(q => q.id),
      matrix: { knowledgeBlocks: [{ title: 'Tự luyện', questionsCount: selectedQuestions.length, score: 10 }] },
      createdAt: new Date().toISOString().split('T')[0],
      status: 'Đang dùng',
      createdBy: 'gv-demo',
    };
    
    const dummyAssignment: Assignment = {
      id: dummyAssignId,
      examId: dummyExamId,
      classId: profile.classId || 'practice',
      deadline: new Date(Date.now() + 86400000 * 365).toISOString(),
      duration: dummyExam.duration,
      shuffleQuestions: false,
      shuffleOptions: false,
      showSolution: true,
      allowRetry: true,
      message: 'Học tập tự do củng cố và lấp đầy lỗ hổng kiến thức.',
      status: 'Đang làm',
    };
    
    setActiveSession({
      assignment: dummyAssignment,
      exam: dummyExam,
      answers: {},
      timeLeft: dummyExam.duration * 60,
    });
    
    onSetSidebarInvisible(true);
  };

  return (
    <>
      <div className="space-y-6">
        {/* 1. Header Banner */}
      <div className="bg-gradient-to-tr from-emerald-600 via-teal-600 to-green-600 text-white p-6 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-emerald-200" />
            <h1 className="text-base md:text-xl font-extrabold tracking-tight">Xin chào học sinh: {profile.studentName}</h1>
          </div>
          <p className="text-xs text-emerald-100 flex flex-wrap items-center gap-2">
            <span>Lớp học: <strong className="text-white font-black">{activeClasses.map(c => c.name).join(', ')}</strong></span>
            <span className="opacity-40">|</span>
            <span>Môn rèn luyện: <strong className="text-white font-black">Toán & Tin học</strong></span>
            <span className="opacity-40">|</span>
            <span>Sách chuẩn: {studentClass?.book || 'Kết nối tri thức'}</span>
          </p>
        </div>

        <div className="flex flex-wrap gap-2 text-xs">
          <button
            onClick={() => {
              setIsChangingPass(true);
              setChangePassInput('');
              setChangePassError('');
            }}
            className="px-3 py-1.5 bg-emerald-750 hover:bg-emerald-800 text-white font-bold rounded-lg flex items-center gap-1 cursor-pointer transition-colors border border-emerald-500/20"
          >
            <Lock className="w-3.5 h-3.5" />
            Đổi mật khẩu cá nhân
          </button>

          <button
            onClick={() => setShowChangeClassModal(true)}
            className="px-3 py-1.5 bg-slate-900/40 hover:bg-slate-900/60 text-white font-bold rounded-lg flex items-center gap-1 cursor-pointer transition-colors border border-white/10"
          >
            <Edit2 className="w-3.5 h-3.5 text-emerald-250" />
            Đổi lớp học khác
          </button>

          {onExitStudentRoom && (
            <button
              onClick={onExitStudentRoom}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              Thoát phòng học sinh
            </button>
          )}
        </div>
      </div>

      {/* 2. Bento Statistics Cards for Dual Subjects (Toán và Tin học) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Môn Toán học Stats */}
        <motion.div
          whileHover={{ y: -3 }}
          className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                <Calculator className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-extrabold text-slate-800 text-sm">Chuyên mục: Môn Toán học</h4>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Cơ bản & Chuyên sâu</p>
              </div>
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
              {toanStats.completed}/{toanStats.total} Hoàn tất
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 border-t border-slate-50 pt-3 text-xs">
            <div>
              <span className="text-slate-400 font-bold block mb-0.5 text-[10px] uppercase tracking-wide">Điểm trung bình</span>
              <strong className="text-emerald-700 font-mono text-base font-black">
                {toanStats.completed > 0 ? toanStats.avgScore.toFixed(1) : '--'} / 10
              </strong>
            </div>
            <div>
              <span className="text-slate-400 font-bold block mb-0.5 text-[10px] uppercase tracking-wide">Đề đang mở</span>
              <strong className="text-amber-600 font-mono text-base font-black">
                {toanStats.pending} đề ôn tập
              </strong>
            </div>
          </div>

          <div className="relative pt-1">
            <div className="overflow-hidden h-2 text-xs flex rounded-full bg-slate-100">
              <div
                style={{ width: `${toanStats.total > 0 ? (toanStats.completed / toanStats.total) * 100 : 0}%` }}
                className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-emerald-500 rounded-full transition-all duration-500"
              />
            </div>
          </div>
        </motion.div>

        {/* Môn Tin học Stats */}
        <motion.div
          whileHover={{ y: -3 }}
          className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                <Laptop className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-extrabold text-slate-800 text-sm">Chuyên mục: Môn Tin học</h4>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Tin học & Kỹ năng số</p>
              </div>
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
              {tinStats.completed}/{tinStats.total} Hoàn tất
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 border-t border-slate-50 pt-3 text-xs">
            <div>
              <span className="text-slate-400 font-bold block mb-0.5 text-[10px] uppercase tracking-wide">Điểm trung bình</span>
              <strong className="text-blue-700 font-mono text-base font-black">
                {tinStats.completed > 0 ? tinStats.avgScore.toFixed(1) : '--'} / 10
              </strong>
            </div>
            <div>
              <span className="text-slate-400 font-bold block mb-0.5 text-[10px] uppercase tracking-wide">Đề đang mở</span>
              <strong className="text-amber-600 font-mono text-base font-black">
                {tinStats.pending} đề ôn tập
              </strong>
            </div>
          </div>

          <div className="relative pt-1">
            <div className="overflow-hidden h-2 text-xs flex rounded-full bg-slate-100">
              <div
                style={{ width: `${tinStats.total > 0 ? (tinStats.completed / tinStats.total) * 100 : 0}%` }}
                className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500 rounded-full transition-all duration-500"
              />
            </div>
          </div>
        </motion.div>
      </div>

      {/* 3. Primary Navigation Tabs: Assignments vs Self-Practice */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => {
            soundManager.playTab();
            setActiveTab('assignments');
          }}
          className={`flex items-center gap-2 px-6 py-3.5 border-b-2 font-extrabold text-xs uppercase tracking-wider transition-all relative ${
            activeTab === 'assignments' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <FileText className="w-4 h-4" />
          Nhiệm vụ rèn luyện từ giáo viên
        </button>
        <button
          onClick={() => {
            soundManager.playTab();
            setActiveTab('practice');
          }}
          className={`flex items-center gap-2 px-6 py-3.5 border-b-2 font-extrabold text-xs uppercase tracking-wider transition-all relative ${
            activeTab === 'practice' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <Award className="w-4 h-4" />
          Góc tự luyện & Khảo thí
        </button>
      </div>

      {/* 4. Tab Contents */}
      <AnimatePresence mode="wait">
        {activeTab === 'assignments' ? (
          <motion.div
            key="assignments-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            {/* Filter Controls Row */}
            <div className="bg-slate-50 p-4 rounded-xl flex flex-col lg:flex-row items-center justify-between gap-4 border border-slate-100">
              {/* Subject Tabs Filter pills */}
              <div className="flex gap-1.5 flex-wrap">
                <button
                  onClick={() => {
                    soundManager.playClick();
                    setActiveSubjectTab('all');
                  }}
                  className={`px-4 py-2 text-xs font-black rounded-lg uppercase tracking-wide cursor-pointer transition-all ${
                    activeSubjectTab === 'all'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  Tất cả môn ({classAssignments.length})
                </button>
                <button
                  onClick={() => {
                    soundManager.playClick();
                    setActiveSubjectTab('toan');
                  }}
                  className={`px-4 py-2 text-xs font-black rounded-lg uppercase tracking-wide cursor-pointer transition-all flex items-center gap-1.5 ${
                    activeSubjectTab === 'toan'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <Calculator className="w-3.5 h-3.5" />
                  Môn Toán học
                </button>
                <button
                  onClick={() => {
                    soundManager.playClick();
                    setActiveSubjectTab('tin');
                  }}
                  className={`px-4 py-2 text-xs font-black rounded-lg uppercase tracking-wide cursor-pointer transition-all flex items-center gap-1.5 ${
                    activeSubjectTab === 'tin'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <Laptop className="w-3.5 h-3.5" />
                  Môn Tin học
                </button>
              </div>

              {/* Status filter and search input */}
              <div className="flex flex-wrap lg:flex-nowrap items-center gap-2 w-full lg:w-auto">
                {/* Status Dropdown */}
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    soundManager.playClick();
                    setStatusFilter(e.target.value as any);
                  }}
                  className="px-3 py-2 bg-white text-slate-700 text-xs font-bold rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 w-full md:w-36"
                >
                  <option value="all">Tất cả trạng thái</option>
                  <option value="pending">Chưa làm</option>
                  <option value="submitted">Đã nộp bài</option>
                </select>

                {/* Search input bar */}
                <div className="relative w-full md:w-64">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Tìm tên đề, bài học..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-white text-xs font-semibold rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 placeholder-slate-450"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2 top-2 text-slate-400 hover:text-slate-600 font-bold text-xs cursor-pointer p-0.5"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Assignments Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredAssignments.map((as) => {
                const exam = exams.find((e) => e.id === as.examId);
                if (!exam) return null;

                const submission = submissions.find(
                  (s) => s.assignmentId === as.id && (s.studentId === resolvedStudentId || s.studentName === profile.studentName)
                );

                const isToan = exam.subject.toLowerCase().includes('toán');

                return (
                  <motion.div
                    key={as.id}
                    layout
                    whileHover={{ y: -3 }}
                    className={`bg-white rounded-2xl border p-5 shadow-xs flex flex-col justify-between space-y-4 transition-all duration-200 ${
                      submission 
                        ? 'border-slate-100 bg-slate-50/20' 
                        : isToan 
                        ? 'border-emerald-100 hover:border-emerald-300 shadow-emerald-50/10' 
                        : 'border-blue-100 hover:border-blue-300 shadow-blue-50/10'
                    }`}
                  >
                    {/* Badge headers */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full ${
                          isToan ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'
                        }`}>
                          Môn: {exam.subject}
                        </span>
                        <span className="text-[9px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-bold">
                          {exam.questions.length} câu
                        </span>
                      </div>
                      
                      <span className="text-slate-400 text-[10px] font-semibold flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        Hạn: {new Date(as.deadline).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Test Title & Messages */}
                    <div>
                      <h4 className="font-extrabold text-slate-800 text-sm leading-snug group-hover:text-emerald-600 transition-colors">
                        {exam.title}
                      </h4>
                      {as.message ? (
                        <div className="bg-slate-50 border border-slate-100/70 p-2.5 rounded-lg text-[10px] text-slate-500 font-semibold leading-relaxed mt-2 italic flex gap-1 items-start">
                          <span className="shrink-0">💬</span>
                          <span>{as.message}</span>
                        </div>
                      ) : (
                        <p className="text-[10px] text-slate-400 font-semibold mt-1">Luyện tập nâng cao năng lực toán/tin củng cố lý thuyết.</p>
                      )}
                    </div>

                    {/* Interaction Button Section */}
                    <div className="pt-2 border-t border-slate-50">
                      {submission ? (
                        <div className="bg-emerald-50/40 border border-emerald-100 p-3 rounded-xl flex items-center justify-between">
                          <div>
                            <span className="text-[9px] text-slate-400 uppercase font-black tracking-wider block">Kết quả luyện tập</span>
                            <strong className="text-emerald-700 text-sm font-black font-mono flex items-center gap-1">
                              <CheckCircle className="w-4 h-4 text-emerald-500" />
                              {submission.score.toFixed(1)} / 10 điểm
                            </strong>
                          </div>
                          <button
                            onClick={() => {
                              soundManager.playClick();
                              setPreviewSubId(submission.id);
                            }}
                            className="px-4 py-2 bg-slate-900 text-white hover:bg-slate-800 text-[10px] font-black rounded-lg cursor-pointer transition-colors uppercase tracking-widest"
                          >
                            Xem bài làm chi tiết
                          </button>
                        </div>
                      ) : (
                        <div>
                          {as.status === 'Đã đóng' ? (
                            <div className="p-2.5 bg-rose-50 border border-rose-100 text-rose-700 text-[10px] font-bold rounded-xl text-center">
                              ⚠️ Bài ôn tập này đã khóa hoặc quá thời hạn cho phép.
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                soundManager.playSuccess();
                                handleStartExam(as, exam);
                              }}
                              className={`w-full py-2.5 text-white text-xs font-black rounded-xl shadow-xs transition-all flex items-center justify-center gap-1 cursor-pointer uppercase tracking-wider ${
                                isToan 
                                  ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/10' 
                                  : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/10'
                              }`}
                            >
                              <BookOpen className="w-4 h-4" />
                              Bắt đầu thực hiện bài thi ({exam.duration} phút)
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}

              {filteredAssignments.length === 0 && (
                <div className="bg-white border border-slate-100 rounded-2xl p-10 text-center col-span-full">
                  <FileQuestion className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-slate-400 text-sm font-bold">Không tìm thấy bài ôn tập nào phù hợp.</p>
                  <p className="text-slate-450 text-xs mt-1">Vui lòng thử chuyển đổi bộ lọc môn học hoặc liên hệ giáo viên để nhận đề mới.</p>
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="practice-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="bg-white border border-slate-100 p-6 rounded-2xl shadow-xs space-y-6"
          >
            <div className="border-b pb-3">
              <h3 className="font-extrabold text-slate-800 text-sm uppercase tracking-wide flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                Góc tự luyện & Tự chủ học tập trắc nghiệm thông minh
              </h3>
              <p className="text-xs text-slate-400 mt-1 font-semibold leading-relaxed">
                Tự động tạo đề thi luyện tập chất lượng cao dựa theo phân phối chương trình môn học. Giúp củng cố vững chắc lý thuyết và kỹ năng giải bài tập của Toán học và Tin học THCS.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Left Settings inputs */}
              <div className="space-y-4 md:col-span-1">
                {/* 1. Subject selector */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">1. Chọn môn rèn luyện</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handlePracticeSubjectChange('Toán')}
                      className={`py-2 px-3 text-xs font-black rounded-lg uppercase tracking-wide cursor-pointer transition-all flex items-center justify-center gap-1 border ${
                        activePracticeSubject === 'Toán'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-300 ring-1 ring-emerald-300'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <Calculator className="w-4 h-4" />
                      Môn Toán
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePracticeSubjectChange('Tin học')}
                      className={`py-2 px-3 text-xs font-black rounded-lg uppercase tracking-wide cursor-pointer transition-all flex items-center justify-center gap-1 border ${
                        activePracticeSubject === 'Tin học'
                          ? 'bg-blue-50 text-blue-700 border-blue-300 ring-1 ring-blue-300'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <Laptop className="w-4 h-4" />
                      Môn Tin học
                    </button>
                  </div>
                </div>

                {/* 2. Chapter selector */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">2. Chọn chương học rèn luyện</label>
                  <select
                    value={selectedChapterId}
                    onChange={(e) => {
                      soundManager.playClick();
                      setSelectedChapterId(e.target.value);
                      setSelectedLessonId(''); // Reset lesson
                    }}
                    className="w-full px-3 py-2 bg-slate-50 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="">-- Tất cả các chương --</option>
                    {practiceChapters.map(ch => (
                      <option key={ch.id} value={ch.id}>{ch.title}</option>
                    ))}
                  </select>
                </div>

                {/* 3. Lesson selector */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">3. Chọn bài học chi tiết</label>
                  <select
                    value={selectedLessonId}
                    disabled={!selectedChapterId}
                    onChange={(e) => {
                      soundManager.playClick();
                      setSelectedLessonId(e.target.value);
                    }}
                    className="w-full px-3 py-2 bg-slate-50 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-50"
                  >
                    <option value="">-- Tất cả các bài học --</option>
                    {practiceLessons.map(le => (
                      <option key={le.id} value={le.id}>{le.title}</option>
                    ))}
                  </select>
                </div>

                {/* 4. Exam duration and questions amount */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">4. Số lượng câu hỏi</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        soundManager.playClick();
                        setPracticeLength(5);
                      }}
                      className={`py-2 px-3 text-xs font-black rounded-lg uppercase tracking-wide cursor-pointer transition-all border ${
                        practiceLength === 5
                          ? 'bg-slate-900 text-white border-slate-800'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      5 Câu (10 phút)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        soundManager.playClick();
                        setPracticeLength(10);
                      }}
                      className={`py-2 px-3 text-xs font-black rounded-lg uppercase tracking-wide cursor-pointer transition-all border ${
                        practiceLength === 10
                          ? 'bg-slate-900 text-white border-slate-800'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      10 Câu (20 phút)
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Summary view and Action */}
              <div className="md:col-span-2 bg-slate-50 border border-slate-100 rounded-2xl p-5 flex flex-col justify-between space-y-4">
                <div className="space-y-4">
                  <h4 className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5">
                    <TrendingUp className="text-emerald-500 w-4 h-4" />
                    Tổng quan cấu trúc đề luyện tập tự do
                  </h4>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-white p-4 rounded-xl border border-slate-100 text-center">
                    <div>
                      <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Môn học</span>
                      <strong className={`text-xs block mt-0.5 ${activePracticeSubject === 'Toán' ? 'text-emerald-600' : 'text-blue-600'}`}>
                        {activePracticeSubject}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Chủ đề</span>
                      <span className="text-[10px] font-bold text-slate-600 block mt-0.5 truncate max-w-xs" title={selectedLesson ? selectedLesson.title : selectedChapter ? selectedChapter.title : 'Chương trình chuẩn'}>
                        {selectedLesson ? selectedLesson.title : selectedChapter ? selectedChapter.title : 'Tất cả chủ đề'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Kho dữ liệu câu</span>
                      <strong className="text-slate-800 text-xs block mt-0.5">
                        {availablePracticeQuestions.length} câu sẵn sàng
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Thời lượng</span>
                      <strong className="text-slate-800 text-xs block mt-0.5">
                        {practiceLength === 5 ? '10 phút' : '20 phút'}
                      </strong>
                    </div>
                  </div>

                  {/* Syllabus topic rendering */}
                  {selectedLesson && selectedLesson.topics && selectedLesson.topics.length > 0 && (
                    <div className="bg-emerald-50/10 border border-emerald-550/10 p-3 rounded-lg text-xs space-y-1.5">
                      <span className="font-extrabold text-emerald-800 uppercase tracking-wide text-[10px] block">Nội dung trọng tâm ôn luyện:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedLesson.topics.map((t, idx) => (
                          <span key={idx} className="bg-white border border-slate-200 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded">
                            ✨ {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {availablePracticeQuestions.length === 0 ? (
                    <div className="p-3 bg-amber-50 border border-amber-100 text-amber-800 text-[11px] font-semibold rounded-lg flex items-start gap-1.5 leading-relaxed">
                      <span>⚠️</span>
                      <span>Chưa có câu hỏi trắc nghiệm nào dành riêng cho bài học đã chọn này. Bạn vui lòng chuyển về <strong>"Tất cả các chương"</strong> hoặc đổi sang môn khác để tiếp tục tự luyện đề.</span>
                    </div>
                  ) : (
                    <div className="p-3 bg-emerald-50 text-emerald-800 text-[11px] font-semibold rounded-lg flex items-start gap-1.5 leading-relaxed border border-emerald-100">
                      <span>💡</span>
                      <span>Hệ thống sẽ lấy ngẫu nhiên <strong>{Math.min(practiceLength, availablePracticeQuestions.length)} câu hỏi</strong> chất lượng cao từ kho học liệu để lập tức mở phòng thi trắc nghiệm độc lập cho bạn. Chúc bạn đạt điểm cao tuyệt đối!</span>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 flex justify-end">
                  <button
                    type="button"
                    disabled={availablePracticeQuestions.length === 0}
                    onClick={handleStartSelfPractice}
                    className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl shadow-md uppercase tracking-widest disabled:opacity-50 cursor-pointer flex items-center gap-1.5 transition-all"
                  >
                    <BookOpen className="w-4 h-4 text-emerald-100 animate-pulse" />
                    Bắt đầu làm bài tự luyện
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>

      {/* Custom robust iframe-safe modal: Change Class Confirm */}
      {showChangeClassModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4">
          <div className="bg-[#1e2530] text-slate-100 border border-slate-700 rounded-2xl shadow-2xl max-w-sm w-full p-6 space-y-4">
            <div className="flex items-center gap-2 text-emerald-400">
              <Lock className="w-6 h-6 shrink-0" />
              <h3 className="text-sm font-black uppercase tracking-wider">Xác nhận đổi lớp học</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed font-semibold">
              Bạn có chắc chắn muốn thoát khỏi lớp học rèn luyện hiện tại để tham gia lớp học khác không?
            </p>
            <div className="flex gap-2 justify-end pt-2 text-xs font-bold">
              <button
                type="button"
                onClick={() => setShowChangeClassModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-lg cursor-pointer transition-colors border border-slate-700"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowChangeClassModal(false);
                  // Clear state & storage for student setup
                  localStorage.removeItem('quickquiz-student-setup-v1');
                  setProfile({
                    classId: '',
                    subject: 'Toán học',
                    studentName: '',
                    studentId: '',
                    isConfirmed: false,
                  });
                  setJoinCodeInput('');
                  setClassPassInput('');
                  setStudentPassInput('');
                  setSelectedStudentId('');
                  setLoginError('');
                  setLoginStep(1);
                  
                  if (onStudentProfileChange) {
                    onStudentProfileChange(null);
                  }
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg cursor-pointer transition-all active:scale-95"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom robust iframe-safe modal: Exit active Exam Confirm */}
      {showExitExamModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4">
          <div className="bg-[#1e2530] text-slate-100 border border-slate-700 rounded-2xl shadow-2xl max-w-sm w-full p-6 space-y-4">
            <div className="flex items-center gap-2 text-rose-500">
              <ShieldAlert className="w-6 h-6 shrink-0" />
              <h3 className="text-sm font-black uppercase tracking-wider">CẢNH BÁO THOÁT PHÒNG THI</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed font-semibold">
              Bạn có muốn bỏ làm bài và Trở về trang chủ học sinh không?<br/><br/>
              <strong className="text-rose-400">Hành động này hệ thống VẪN SẼ TÍNH 1 LƯỢT LÀM BÀI NÀY với điểm số là 0.0.</strong>
            </p>
            <div className="flex gap-2 justify-end pt-2 text-xs font-bold">
              <button
                type="button"
                onClick={() => setShowExitExamModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-lg cursor-pointer transition-colors border border-slate-700"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowExitExamModal(false);
                  if (timerRef.current) clearInterval(timerRef.current);
                  if (activeSession) {
                    const { assignment } = activeSession;
                    const forcedSub: Submission = {
                      id: `sub-stud-abort-${Math.floor(Math.random() * 100000)}`,
                      assignmentId: assignment.id,
                      studentId: resolvedStudentId,
                      studentName: profile.studentName,
                      answers: {},
                      score: 0.0,
                      submittedAt: new Date().toISOString(),
                      gradedBy: 'Hệ thống tự động',
                      comment: 'Học sinh từ bỏ quyền làm bài giữa chừng - Tính 1 lượt rèn luyện.',
                      status: 'Chưa chấm',
                    };
                    onAddSubmission(forcedSub);
                    onSetSidebarInvisible(false);
                    setActiveSession(null);
                    soundManager.playComplete();
                  }
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg cursor-pointer transition-all active:scale-95"
              >
                Xác nhận thoát
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
