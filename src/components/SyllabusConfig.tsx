/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Syllabus, Chapter, Lesson, Question } from '../types';
import {
  Sparkles,
  Trash,
  Plus,
  FileText,
  ChevronUp,
  ChevronDown,
  Upload,
  BookOpen,
  FolderPlus,
  FileCode,
  CheckSquare,
  Edit,
  Save,
  BookMarked,
  Layers,
  FileSearch,
  Download,
  HelpCircle,
  Search,
  CheckCircle2,
  ListOrdered,
  FileSpreadsheet
} from 'lucide-react';

interface SyllabusConfigProps {
  syllabus: Syllabus[];
  questions: Question[];
  onDeleteFullSyllabus: (id: string) => void;
  onAddNewChapter: (syllabusId: string, title: string) => void;
  onAddNewLesson: (syllabusId: string, chapterId: string, lessonTitle: string, topics: string[]) => void;
  onDeleteLesson: (syllabusId: string, chapterId: string, lessonId: string) => void;
  onAIAdvisorSuggest: (subject: string, grade: string, req: string, book?: string, semester?: string, periods?: string) => Promise<void> | void;
  onCreateFullSyllabus: (newSy: { grade: string; subject: string; book: string; semester: string; periods: string; chapters?: Chapter[] }) => void;
  onUpdateFullSyllabus: (id: string, updatedChapters: Chapter[]) => void;
  showToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
  onAddQuestions?: (newQuestions: Question[]) => void;
}

export default function SyllabusConfig({
  syllabus,
  questions,
  onDeleteFullSyllabus,
  onAddNewChapter,
  onAddNewLesson,
  onDeleteLesson,
  onAIAdvisorSuggest,
  onCreateFullSyllabus,
  onUpdateFullSyllabus,
  showToast,
  onAddQuestions,
}: SyllabusConfigProps) {
  // NAVIGATION & MODE TABS
  const [activeTab, setActiveTab] = useState<'docxStructure' | 'aiSuggest' | 'manual'>('docxStructure');
  
  // CURRENT SELECTION
  const [selectedSyId, setSelectedSyId] = useState(syllabus[0]?.id || '');

  // SEARCH FILTER FOR TREE VIEW
  const [treeSearchTerm, setTreeSearchTerm] = useState('');

  // IMPORT FORMAT PRESETS / MODE
  const [importMode, setImportMode] = useState<'replace' | 'append'>('replace');

  // DOCX TAB FORM STATES
  const [docxSubject, setDocxSubject] = useState('Toán');
  const [docxCustomSubject, setDocxCustomSubject] = useState('');
  const [docxGrade, setDocxGrade] = useState('9');
  const [docxBook, setDocxBook] = useState('Kết nối tri thức');
  const [docxSemester, setDocxSemester] = useState('1');
  const [docxPeriods, setDocxPeriods] = useState('4');

  // MANUAL SYLLABUS FORM STATES
  const [manualSubject, setManualSubject] = useState('Toán');
  const [manualCustomSubject, setManualCustomSubject] = useState('');
  const [manualGrade, setManualGrade] = useState('9');
  const [manualBook, setManualBook] = useState('Kết nối tri thức');
  const [manualSemester, setManualSemester] = useState('1');
  const [manualPeriods, setManualPeriods] = useState('4');

  // DOCX RAW STRUCTURE IMPORT TEXT
  const [docxRawStructure, setDocxRawStructure] = useState(
    `Chương I: Tập hợp các số tự nhiên\n- Bài 1: Tập hợp. Phần tử của tập hợp\n- Bài 2: Tập hợp các số tự nhiên\n- Bài 3: Phép cộng và phép trừ số tự nhiên\nChương II: Tính chia hết trong tập hợp các số tự nhiên\n- Bài 4: Quan hệ chia hết và tính chất\n- Bài 5: Dấu hiệu chia hết cho 2, cho 5`
  );
  
  // CHAPTER & LESSON CREATION WIZARDS
  const [isAddingChapter, setIsAddingChapter] = useState(false);
  const [newChapterTitle, setNewChapterTitle] = useState('');
  const [newChapterDocx, setNewChapterDocx] = useState('');

  const [activeChapterIdForLesson, setActiveChapterIdForLesson] = useState<string | null>(null);
  const [newLessonTitle, setNewLessonTitle] = useState('');
  const [newLessonTopics, setNewLessonTopics] = useState('Từ khóa chính, Chủ đề ôn luyện');
  const [newLessonDocx, setNewLessonDocx] = useState('');

  // EDIT CHAPTER / LESSON MODALS
  const [editingChapterModal, setEditingChapterModal] = useState<{ id: string; title: string } | null>(null);
  const [editingLessonModal, setEditingLessonModal] = useState<{ chapterId: string; lessonId: string; title: string; topicsStr: string } | null>(null);

  // INLINE DOCX EDITOR MODAL / PANEL STATE
  const [editingDocxTarget, setEditingDocxTarget] = useState<{
    type: 'chapter' | 'lesson';
    chapterId: string;
    lessonId?: string;
    title: string;
    currentText: string;
  } | null>(null);

  // AI DISPATCH STATES
  const [sub, setSub] = useState('Toán');
  const [customAiSubject, setCustomAiSubject] = useState('');
  const [grade, setGrade] = useState('9');
  const [book, setBook] = useState('Kết nối tri thức');
  const [semester, setSemester] = useState('1');
  const [periods, setPeriods] = useState('4');
  const [reqText, setReqText] = useState('');
  const [isAIPlanning, setIsAIPlanning] = useState(false);

  // AI Question Generating state for individual lessons
  const [generatingQuestionsLessonId, setGeneratingQuestionsLessonId] = useState<string | null>(null);

  // Active program resolver
  const activeSy = syllabus.find((sy) => sy.id === selectedSyId) || syllabus[0] || null;

  // Auto-switch selected syllabus when list changes
  React.useEffect(() => {
    if (syllabus.length > 0 && (!selectedSyId || !syllabus.some(s => s.id === selectedSyId))) {
      setSelectedSyId(syllabus[0].id);
    }
  }, [syllabus, selectedSyId]);

  // Sync DOCX tab states with activeSy when activeSy changes
  React.useEffect(() => {
    if (activeSy) {
      setDocxSubject(activeSy.subject);
      setDocxGrade(activeSy.grade);
      setDocxBook(activeSy.book || 'Kết nối tri thức');
      setDocxSemester(activeSy.semester || '1');
      setDocxPeriods(activeSy.periods || '4');
    }
  }, [activeSy?.id]);

  // Statistics calculation for Active Syllabus
  const activeStats = useMemo(() => {
    if (!activeSy) return { totalChapters: 0, totalLessons: 0, questionCount: 0 };
    const totalChapters = activeSy.chapters?.length || 0;
    const totalLessons = activeSy.chapters?.reduce((acc, ch) => acc + (ch.lessons?.length || 0), 0) || 0;
    
    // Count questions in Question Bank for this subject & grade
    const questionCount = questions.filter(
      (q) => q.subject.toLowerCase() === activeSy.subject.toLowerCase() && q.grade === activeSy.grade
    ).length;

    return { totalChapters, totalLessons, questionCount };
  }, [activeSy, questions]);

  // Handlers for manual Syllabus program creation
  const handleManualSyllabusSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalSubject = manualSubject === 'Khác' ? (manualCustomSubject.trim() || 'Môn học mới') : manualSubject;
    
    onCreateFullSyllabus({
      grade: manualGrade,
      subject: finalSubject,
      book: manualBook,
      semester: manualSemester,
      periods: manualPeriods,
    });

    setManualCustomSubject('');
    if (showToast) showToast(`Khởi tạo thành công khung môn ${finalSubject} Lớp ${manualGrade}!`, 'success');
  };

  // AI Dispatch handler
  const handleAIPlanningSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAIPlanning(true);
    const finalSubject = sub === 'Khác' ? (customAiSubject.trim() || 'Môn mới') : sub;

    try {
      await onAIAdvisorSuggest(finalSubject, grade, reqText, book, semester, periods);
    } catch (err) {
      console.error(err);
    } finally {
      setIsAIPlanning(false);
      setReqText('');
    }
  };

  // Parsing helper algorithm for nested chapters & lessons from single-paste source
  const parseSyllabusFromText = (text: string, subjectName: string, bookName: string): Chapter[] => {
    if (!text.trim()) return [];
    const lines = text.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
    const parsedChaptersList: Chapter[] = [];
    let currentCh: Chapter | null = null;

    lines.forEach((line) => {
      // Smart check for Vietnamese/English chapter and major category headings
      const isChLine =
        /^(chương|chapter|phần|chủ\s+đề|ch|c\.|khối\s+kiến\s+thức)\s+/i.test(line) ||
        /^\d+\.\s+(chương|chủ\s+đề|phần)/i.test(line) ||
        /^(i|ii|iii|iv|v|vi|vii|viii|ix|x)\.\s*[A-ZĐƯĂÂÔỔ]/i.test(line) ||
        (/^[0-9]+\.\s+[A-ZĐƯĂÂÔỔ]/.test(line) && line.toUpperCase().includes('CHƯƠNG')) ||
        /^(Chương|CHƯƠNG|Chủ\s+đề|CHỦ\s+ĐỀ)\s+[0-9a-zA-ZIVX]+/i.test(line);

      if (isChLine) {
        currentCh = {
          id: `ch-parsed-${Math.floor(Math.random() * 100000)}-${Date.now()}`,
          title: line,
          docxText: `— Sách: ${bookName}\n— Phân tích chuẩn: Khung nội dung chi tiết Chương.`,
          lessons: []
        };
        parsedChaptersList.push(currentCh);
      } else {
        // Normal Lesson line. Strip bullet markers, numbers, or "Bài X:", "Tiết Y:" prefix
        const cleanLessonTitle = line.replace(/^([-+*•\s\d.]|bài\s+[0-9a-zA-Z]+\s*[:.-]?|bài học\s+\d+\s*[:.-]?|tiết\s+\d+\s*[:.-]?)+\s*/i, '').trim();
        
        if (cleanLessonTitle.length >= 2) {
          const lessonObj: Lesson = {
            id: `le-parsed-${Math.floor(Math.random() * 100000)}-${Date.now()}`,
            title: cleanLessonTitle,
            topics: ['Chuẩn GDPT 2018', subjectName],
            docxText: `— Nội dung cụ thể bài học: ${cleanLessonTitle}`
          };

          if (currentCh) {
            currentCh.lessons.push(lessonObj);
          } else {
            currentCh = {
              id: `ch-parsed-fallback-${Math.floor(Math.random() * 100000)}-${Date.now()}`,
              title: 'Chương 1: Khung kiến thức tổng quan',
              docxText: '',
              lessons: [lessonObj]
            };
            parsedChaptersList.push(currentCh);
          }
        }
      }
    });

    return parsedChaptersList;
  };

  // Parsing line-by-line function to populate full Syllabus structure instantly
  const handleParseAndApplyDocxStructure = () => {
    if (!docxRawStructure.trim()) {
      alert('Vui lòng nhập văn bản cấu trúc DOCX để phân tích!');
      return;
    }

    const finalSubject = docxSubject === 'Khác' ? (docxCustomSubject.trim() || 'Môn học mới') : docxSubject;
    const parsedChapters = parseSyllabusFromText(docxRawStructure, finalSubject, docxBook);
    
    if (parsedChapters.length === 0) {
      alert('Không nhận diện được chương hoặc bài học nào hợp lệ. Vui lòng kiểm tra lại cấu trúc văn bản của bạn!');
      return;
    }

    // Check if a syllabus already exists for this subject & grade
    const targetSy = syllabus.find(
      (s) => s.subject.toLowerCase() === finalSubject.toLowerCase() && s.grade === docxGrade
    );

    if (targetSy) {
      let finalChapters: Chapter[] = [];
      if (importMode === 'replace') {
        finalChapters = parsedChapters;
      } else {
        finalChapters = [...targetSy.chapters, ...parsedChapters];
      }

      onUpdateFullSyllabus(targetSy.id, finalChapters);
      setSelectedSyId(targetSy.id);
      
      setDocxRawStructure('');
      if (showToast) {
        showToast(`Đã ${importMode === 'replace' ? 'thiết lập mới hoàn toàn' : 'bổ sung thêm'} ${parsedChapters.length} Chương vào ${finalSubject} Lớp ${docxGrade}!`, 'success');
      }
    } else {
      // Create a new syllabus directly with the parsed chapters
      onCreateFullSyllabus({
        grade: docxGrade,
        subject: finalSubject,
        book: docxBook,
        semester: docxSemester,
        periods: docxPeriods,
        chapters: parsedChapters,
      });

      setDocxRawStructure('');
      if (showToast) {
        showToast(`Đã khởi tạo môn mới ${finalSubject} Lớp ${docxGrade} và nạp ${parsedChapters.length} Chương!`, 'success');
      }
    }
  };

  // Add a brand-new Chapter manually
  const handleAddNewChapterDirect = () => {
    if (!activeSy) return;
    if (!newChapterTitle.trim()) {
      alert('Vui lòng nhập tên chương!');
      return;
    }

    const newCh: Chapter = {
      id: `ch-${Date.now()}`,
      title: newChapterTitle.trim(),
      lessons: [],
      docxText: newChapterDocx.trim() || `Tài liệu tóm tắt của chương: ${newChapterTitle}`
    };

    const updatedChapters = [...activeSy.chapters, newCh];
    onUpdateFullSyllabus(activeSy.id, updatedChapters);

    setNewChapterTitle('');
    setNewChapterDocx('');
    setIsAddingChapter(false);
    if (showToast) showToast('Đã thêm Chương mới vào chương trình.', 'success');
  };

  // Add a brand-new Lesson inside a specific Chapter manually
  const handleAddNewLessonDirect = (chapterId: string) => {
    if (!activeSy) return;
    if (!newLessonTitle.trim()) {
      alert('Vui lòng nhập tên bài học!');
      return;
    }

    const topicsArray = newLessonTopics
      ? newLessonTopics.split(',').map((t) => t.trim()).filter((t) => t.length > 0)
      : ['Chuẩn kiến thức'];

    const newLe: Lesson = {
      id: `le-${Date.now()}`,
      title: newLessonTitle.trim(),
      topics: topicsArray,
      docxText: newLessonDocx.trim() || `Tài liệu bài giảng chi tiết: ${newLessonTitle}`
    };

    const updatedChapters = activeSy.chapters.map((ch) => {
      if (ch.id === chapterId) {
        return {
          ...ch,
          lessons: [...ch.lessons, newLe]
        };
      }
      return ch;
    });

    onUpdateFullSyllabus(activeSy.id, updatedChapters);

    setNewLessonTitle('');
    setNewLessonTopics('Từ khóa chính, Chủ đề ôn luyện');
    setNewLessonDocx('');
    setActiveChapterIdForLesson(null);
    if (showToast) showToast('Đã thêm Bài học mới thành công.', 'success');
  };

  // Move Chapter Up/Down
  const handleMoveChapter = (chapterId: string, direction: 'up' | 'down') => {
    if (!activeSy) return;
    const index = activeSy.chapters.findIndex((c) => c.id === chapterId);
    if (index < 0) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= activeSy.chapters.length) return;

    const newChapters = [...activeSy.chapters];
    const [moved] = newChapters.splice(index, 1);
    newChapters.splice(targetIndex, 0, moved);

    onUpdateFullSyllabus(activeSy.id, newChapters);
  };

  // Move Lesson Up/Down
  const handleMoveLesson = (chapterId: string, lessonId: string, direction: 'up' | 'down') => {
    if (!activeSy) return;
    const newChapters = activeSy.chapters.map((ch) => {
      if (ch.id !== chapterId) return ch;
      const index = ch.lessons.findIndex((l) => l.id === lessonId);
      if (index < 0) return ch;
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= ch.lessons.length) return ch;

      const newLessons = [...ch.lessons];
      const [moved] = newLessons.splice(index, 1);
      newLessons.splice(targetIndex, 0, moved);
      return { ...ch, lessons: newLessons };
    });

    onUpdateFullSyllabus(activeSy.id, newChapters);
  };

  // Delete Chapter
  const handleDeleteChapter = (chapterId: string) => {
    if (!activeSy) return;
    if (!confirm('Bạn có chắc chắn muốn xóa Chương này cùng tất cả các bài học trong chương?')) return;
    const newChapters = activeSy.chapters.filter((ch) => ch.id !== chapterId);
    onUpdateFullSyllabus(activeSy.id, newChapters);
    if (showToast) showToast('Đã xóa Chương.', 'info');
  };

  // Rename Chapter Modal Saver
  const handleSaveChapterRename = () => {
    if (!activeSy || !editingChapterModal) return;
    const newTitle = editingChapterModal.title.trim();
    if (!newTitle) return;

    const updatedChapters = activeSy.chapters.map((ch) => {
      if (ch.id === editingChapterModal.id) {
        return { ...ch, title: newTitle };
      }
      return ch;
    });

    onUpdateFullSyllabus(activeSy.id, updatedChapters);
    setEditingChapterModal(null);
    if (showToast) showToast('Đã cập nhật tên Chương.', 'success');
  };

  // Rename Lesson Modal Saver
  const handleSaveLessonEdit = () => {
    if (!activeSy || !editingLessonModal) return;
    const newTitle = editingLessonModal.title.trim();
    if (!newTitle) return;

    const topicsArr = editingLessonModal.topicsStr
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const updatedChapters = activeSy.chapters.map((ch) => {
      if (ch.id === editingLessonModal.chapterId) {
        const updatedLessons = ch.lessons.map((le) => {
          if (le.id === editingLessonModal.lessonId) {
            return { ...le, title: newTitle, topics: topicsArr.length > 0 ? topicsArr : le.topics };
          }
          return le;
        });
        return { ...ch, lessons: updatedLessons };
      }
      return ch;
    });

    onUpdateFullSyllabus(activeSy.id, updatedChapters);
    setEditingLessonModal(null);
    if (showToast) showToast('Đã cập nhật thông tin Bài học.', 'success');
  };

  // Save Docx Text Edit
  const handleSaveDocxEdit = () => {
    if (!activeSy || !editingDocxTarget) return;

    let updatedChapters = [...activeSy.chapters];

    if (editingDocxTarget.type === 'chapter') {
      updatedChapters = updatedChapters.map((ch) => {
        if (ch.id === editingDocxTarget.chapterId) {
          return { ...ch, docxText: editingDocxTarget.currentText };
        }
        return ch;
      });
    } else {
      updatedChapters = updatedChapters.map((ch) => {
        if (ch.id === editingDocxTarget.chapterId) {
          const updatedLessons = ch.lessons.map((le) => {
            if (le.id === editingDocxTarget.lessonId) {
              return { ...le, docxText: editingDocxTarget.currentText };
            }
            return le;
          });
          return { ...ch, lessons: updatedLessons };
        }
        return ch;
      });
    }

    onUpdateFullSyllabus(activeSy.id, updatedChapters);
    setEditingDocxTarget(null);
    if (showToast) showToast('Đã lưu văn bản DOCX.', 'success');
  };

  // Export Active Syllabus to JSON
  const handleExportJSON = () => {
    if (!activeSy) return;
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(activeSy, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `Syllabus_${activeSy.subject}_Lop${activeSy.grade}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    if (showToast) showToast('Đã xuất file JSON thành công.', 'success');
  };

  // Generate Questions via AI for a single lesson
  const handleGenerateQuestionsForLesson = async (chapterTitle: string, lesson: Lesson) => {
    if (!activeSy || !onAddQuestions) return;
    setGeneratingQuestionsLessonId(lesson.id);

    try {
      if (showToast) showToast(`Gemini AI đang sinh 5 câu hỏi tự động cho bài: ${lesson.title}...`, 'info');

      const promptReq = `Hãy tạo 5 câu hỏi trắc nghiệm khách quan 4 phương án (A, B, C, D) cho bài học: "${lesson.title}" thuộc chương "${chapterTitle}", môn ${activeSy.subject} Lớp ${activeSy.grade}. Đảm bảo có đáp án đúng rõ ràng và lời giải chi tiết.`;

      const res = await fetch('/api/generate-exam-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: activeSy.subject,
          grade: activeSy.grade,
          numQuestions: 5,
          prompt: promptReq,
        }),
      });

      const data = await res.json();

      if (data.success && Array.isArray(data.questions) && data.questions.length > 0) {
        const createdQuestions: Question[] = data.questions.map((q: any, i: number) => ({
          id: `q-ai-gen-${Date.now()}-${i}`,
          content: q.content || `Câu hỏi ${i + 1} bài ${lesson.title}`,
          type: 'multiple-choice',
          options: Array.isArray(q.options) && q.options.length === 4 ? q.options : ['Lựa chọn A', 'Lựa chọn B', 'Lựa chọn C', 'Lựa chọn D'],
          correctAnswer: q.correctAnswer || 0,
          explanation: q.explanation || `Lời giải cho bài ${lesson.title}`,
          grade: activeSy.grade,
          subject: activeSy.subject,
          chapterId: activeSy.chapters.find((c) => c.title === chapterTitle)?.id || '',
          lessonId: lesson.id,
          level: (['Nhận biết', 'Thông hiểu', 'Vận dụng', 'Vận dụng cao'] as const)[i % 4],
          source: 'Gemini AI',
          status: 'Đã duyệt',
        }));

        onAddQuestions(createdQuestions);
        if (showToast) {
          showToast(`Đã tự động thêm ${createdQuestions.length} câu hỏi mới vào Kho câu hỏi cho bài "${lesson.title}"!`, 'success');
        }
      } else {
        if (showToast) showToast('Không thể tạo câu hỏi tự động. Vui lòng thử lại!', 'error');
      }
    } catch (err: any) {
      console.error(err);
      if (showToast) showToast(`Lỗi tạo câu hỏi: ${err.message || 'Chưa thể kết nối AI'}`, 'error');
    } finally {
      setGeneratingQuestionsLessonId(null);
    }
  };

  // Filtered Chapters based on search
  const filteredChapters = useMemo(() => {
    if (!activeSy) return [];
    if (!treeSearchTerm.trim()) return activeSy.chapters;
    const term = treeSearchTerm.toLowerCase();
    
    return activeSy.chapters.filter((ch) => {
      const chMatch = ch.title.toLowerCase().includes(term);
      const lessonMatch = ch.lessons.some(
        (le) => le.title.toLowerCase().includes(term) || le.topics.some((t) => t.toLowerCase().includes(term))
      );
      return chMatch || lessonMatch;
    });
  }, [activeSy, treeSearchTerm]);

  return (
    <div className="space-y-6">
      
      {/* Dynamic Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <BookMarked className="w-6 h-6 text-emerald-600" />
            Cấu hình Khung Chương trình Học & Phân phối Môn học
          </h1>
          <p className="text-xs text-slate-500 font-semibold mt-1">
            Thiết lập thủ công hoặc tự động lập kế hoạch phân phối chương trình môn học bằng Gemini AI & bóc tách file Word/DOCX chuẩn sư phạm GDPT 2018.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-50 border p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('docxStructure')}
            className={`px-3 py-2 rounded-lg text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'docxStructure' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            Nhập Cấu trúc DOCX / VB
          </button>
          <button
            onClick={() => setActiveTab('aiSuggest')}
            className={`px-3 py-2 rounded-lg text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'aiSuggest' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Trợ lý AI Phân phối
          </button>
          <button
            onClick={() => setActiveTab('manual')}
            className={`px-3 py-2 rounded-lg text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'manual' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FolderPlus className="w-3.5 h-3.5" />
            Thêm Môn & Khối mới
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT ASPECT: Interactive Inputs depending on chosen tab */}
        <div className="space-y-6">
          
          {/* Tab 1: DOCX Text Structure Copy Pasting Parser */}
          {activeTab === 'docxStructure' && (
            <div className="bg-white p-6 rounded-2xl border border-indigo-100 shadow-md space-y-5">
              <div className="flex items-center gap-2 text-indigo-600 border-b pb-3">
                <FileCode className="w-5 h-5 text-indigo-600" />
                <h3 className="font-extrabold text-slate-800 text-sm uppercase tracking-wider">Trình nạp & Tự động tách Chương / Bài từ DOCX</h3>
              </div>

              <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                Dán toàn bộ phân bổ chương trình học (Chương, Bài) copy từ file Word (.docx) của bạn vào ô dưới đây. Chọn môn học, khối lớp và bộ sách bên dưới để nạp cấu trúc.
              </p>

              {/* SELECTION FOR SUBJECT, GRADE, BOOK, SEMESTER */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 text-xs font-bold">
                <div className="flex items-center justify-between text-indigo-700 uppercase text-[11px] font-black border-b border-slate-200 pb-1.5">
                  <span>🎯 CHỌN MÔN HỌC & KHỐI LỚP NẠP CẤU TRÚC</span>
                  <span className="text-[10px] text-indigo-500 font-medium">Tự động kết nối</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 mb-1 uppercase tracking-wide">MÔN HỌC</label>
                    <select
                      value={docxSubject}
                      onChange={(e) => {
                        const val = e.target.value;
                        setDocxSubject(val);
                        const matched = syllabus.find(s => s.subject.toLowerCase() === val.toLowerCase() && s.grade === docxGrade);
                        if (matched) setSelectedSyId(matched.id);
                      }}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="Toán">Toán học</option>
                      <option value="Tin học">Tin học</option>
                      <option value="Vật lý">Vật lý</option>
                      <option value="Hóa học">Hóa học</option>
                      <option value="Sinh học">Sinh học</option>
                      <option value="Khoa học tự nhiên">Khoa học tự nhiên (KHTN)</option>
                      <option value="Ngữ văn">Ngữ văn</option>
                      <option value="Tiếng Anh">Tiếng Anh</option>
                      <option value="Lịch sử & Địa lý">Lịch sử & Địa lý</option>
                      <option value="Lịch sử">Lịch sử</option>
                      <option value="Địa lý">Địa lý</option>
                      <option value="Hoạt động trải nghiệm">Hoạt động trải nghiệm</option>
                      <option value="Giáo dục công dân">Giáo dục công dân</option>
                      <option value="Công nghệ">Công nghệ</option>
                      <option value="Khác">Môn học tùy chỉnh...</option>
                    </select>
                  </div>

                  {docxSubject === 'Khác' && (
                    <div className="sm:col-span-2">
                      <label className="block text-slate-600 mb-1 uppercase tracking-wide">TÊN MÔN HỌC KHÁC</label>
                      <input
                        type="text"
                        placeholder="Ví dụ: Giáo dục Quốc phòng..."
                        value={docxCustomSubject}
                        onChange={(e) => setDocxCustomSubject(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-slate-600 mb-1 uppercase tracking-wide">KHỐI LỚP</label>
                    <select
                      value={docxGrade}
                      onChange={(e) => {
                        const val = e.target.value;
                        setDocxGrade(val);
                        const matched = syllabus.find(s => s.subject.toLowerCase() === docxSubject.toLowerCase() && s.grade === val);
                        if (matched) setSelectedSyId(matched.id);
                      }}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      {[6, 7, 8, 9, 10, 11, 12].map((g) => (
                        <option key={g} value={String(g)}>Khối lớp {g}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-600 mb-1 uppercase tracking-wide">BỘ SÁCH GIÁO KHOA</label>
                    <select
                      value={docxBook}
                      onChange={(e) => setDocxBook(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="Kết nối tri thức">Kết nối tri thức với cuộc sống</option>
                      <option value="Cánh diều">Cánh diều</option>
                      <option value="Chân trời sáng tạo">Chân trời sáng tạo</option>
                      <option value="Cùng học để phát triển">Cùng học để phát triển năng lực</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-600 mb-1 uppercase tracking-wide">HỌC KỲ</label>
                    <select
                      value={docxSemester}
                      onChange={(e) => setDocxSemester(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="1">Học kỳ I</option>
                      <option value="2">Học kỳ II</option>
                      <option value="Cả năm">Cả năm</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-600 mb-1 uppercase tracking-wide">SỐ TIẾT / TUẦN</label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={docxPeriods}
                      onChange={(e) => setDocxPeriods(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4 text-xs font-bold">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-slate-600 uppercase tracking-wide">NỘI DUNG VĂN BẢN DOCX</span>
                    <div className="flex gap-1.5">
                      <span
                        className="text-[10px] text-indigo-600 font-extrabold bg-indigo-50 px-2 py-0.5 rounded cursor-pointer hover:bg-indigo-100 transition-colors"
                        onClick={() => setDocxRawStructure(
                          "Chương I: Mệnh đề và tập hợp môn học\n- Bài 1: Mệnh đề toán học\n- Bài 2: Tập hợp và phép toán trên tập hợp\n- Bài 3: Các số đặc trưng đo xu thế\nChương II: Bất phương trình và hệ bất phương trình\n- Bài 1: Bất phương trình bậc nhất hai ẩn\n- Bài 2: Hệ bất phương trình bậc nhất hai ẩn"
                        )}
                      >
                        Mẫu Toán
                      </span>
                      <span
                        className="text-[10px] text-emerald-600 font-extrabold bg-emerald-50 px-2 py-0.5 rounded cursor-pointer hover:bg-emerald-100 transition-colors"
                        onClick={() => setDocxRawStructure(
                          "Chương I: Khái quát cơ sở hóa học đại cương\n- Bài 1: Thành phần nguyên tử cấu tạo\n- Bài 2: Bảng tuần hoàn nguyên tố hóa học\nChương II: Liên kết hóa học và phản ứng\n- Bài 3: Liên kết ion và phân cực\n- Bài 4: Phản ứng oxi hóa - khử nâng cao"
                        )}
                      >
                        Mẫu Hóa
                      </span>
                    </div>
                  </div>
                  <textarea
                    rows={8}
                    value={docxRawStructure}
                    onChange={(e) => setDocxRawStructure(e.target.value)}
                    placeholder="Dán toàn bộ danh mục từ tệp DOCX vào đây...&#13;&#10;&#13;&#10;Ví dụ:&#13;&#10;Chương 1: Khám phá lý thuyết số&#13;&#10;- Bài 1: Bản chất của phép chia có dư&#13;&#10;- Bài 2: Ước số chung lớn nhất"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed font-mono font-medium text-slate-700 placeholder:text-zinc-400"
                  />
                </div>

                {/* Import Mode Selector */}
                <div className="space-y-2">
                  <label className="block text-slate-500 uppercase tracking-wide">CHẾ ĐỘ NẠP VÀO MÔN ĐANG CHỌN</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setImportMode('replace')}
                      className={`p-2.5 rounded-xl border font-black text-xs transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
                        importMode === 'replace'
                          ? 'border-indigo-600 bg-indigo-50/50 text-indigo-700 ring-2 ring-indigo-50'
                          : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-500'
                      }`}
                    >
                      <span className="font-extrabold">Ghi đè mới</span>
                      <span className="text-[9px] font-medium opacity-80">(Thiết lập lại từ đầu)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setImportMode('append')}
                      className={`p-2.5 rounded-xl border font-black text-xs transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
                        importMode === 'append'
                          ? 'border-indigo-600 bg-indigo-50/50 text-indigo-700 ring-2 ring-indigo-50'
                          : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-500'
                      }`}
                    >
                      <span className="font-extrabold">Nối tiếp thêm</span>
                      <span className="text-[9px] font-medium opacity-80">(Giữ chương cũ, thêm dưới)</span>
                    </button>
                  </div>
                </div>

                {/* Instant Real-Time Split Preview UI Block */}
                <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between border-b pb-1.5">
                    <span className="text-slate-650 uppercase font-black text-[11px] tracking-wider flex items-center gap-1 text-indigo-600">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                      Xem trước kết quả phân tách
                    </span>
                    <span className="bg-white px-2 py-0.5 border text-slate-600 rounded text-[10px] font-black">
                      {parseSyllabusFromText(docxRawStructure, docxSubject, docxBook).length} Chương |{' '}
                      {parseSyllabusFromText(docxRawStructure, docxSubject, docxBook).reduce(
                        (acc, ch) => acc + ch.lessons.length,
                        0
                      )}{' '}
                      Bài học
                    </span>
                  </div>

                  <div className="max-h-40 overflow-y-auto space-y-2 text-xs font-semibold leading-relaxed font-mono pr-1 text-slate-600">
                    {parseSyllabusFromText(docxRawStructure, docxSubject, docxBook).length > 0 ? (
                      parseSyllabusFromText(docxRawStructure, docxSubject, docxBook).map((ch, i) => (
                        <div key={i} className="border-b last:border-0 pb-1.5 last:pb-0 space-y-1">
                          <p className="text-slate-800 font-bold truncate flex items-center gap-1">
                            <span className="text-indigo-500 font-bold">📂</span> {ch.title}
                          </p>
                          <div className="pl-4 space-y-0.5 text-[11px] text-slate-500">
                            {ch.lessons.map((le, j) => (
                              <p key={j} className="truncate flex items-center gap-1 font-medium">
                                <span className="text-zinc-400">📄</span> {le.title}
                              </p>
                            ))}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-slate-400 italic font-sans text-center py-4">
                        Dán văn bản DOCX phía trên để xem trước...
                      </p>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleParseAndApplyDocxStructure}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs tracking-wider uppercase rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Upload className="w-4 h-4 text-indigo-100" />
                  XÁC NHẬN PHÂN TÁCH & NẠP CẤU TRÚC
                </button>
              </div>
            </div>
          )}

          {/* Tab 2: Gemini AI Suggested Advisor */}
          {activeTab === 'aiSuggest' && (
            <div className="bg-white p-6 rounded-2xl border border-emerald-100 shadow-md space-y-4">
              <div className="flex items-center gap-2 text-emerald-600 border-b pb-3">
                <Sparkles className="w-5 h-5 text-emerald-500 animate-spin" />
                <h3 className="font-extrabold text-slate-800 text-sm uppercase tracking-wider">Trợ lý Gemini AI Phân phối Chương trình</h3>
              </div>

              <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                Tự động lập khung phân phối chương trình học chuẩn GDPT 2018 bằng AI. Chỉ cần chọn môn, khối lớp và yêu cầu đặc thù.
              </p>

              <form onSubmit={handleAIPlanningSubmit} className="space-y-3.5 text-xs font-bold">
                <div>
                  <label className="block text-slate-500 mb-1">MÔN HỌC ĐỀ XUẤT</label>
                  <select
                    value={sub}
                    onChange={(e) => setSub(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Toán">Toán học</option>
                    <option value="Tin học">Tin học</option>
                    <option value="Vật lý">Vật lý</option>
                    <option value="Hóa học">Hóa học</option>
                    <option value="Sinh học">Sinh học</option>
                    <option value="Khoa học tự nhiên">Khoa học tự nhiên (KHTN)</option>
                    <option value="Ngữ văn">Ngữ văn</option>
                    <option value="Tiếng Anh">Tiếng Anh</option>
                    <option value="Lịch sử & Địa lý">Lịch sử & Địa lý</option>
                    <option value="Lịch sử">Lịch sử</option>
                    <option value="Địa lý">Địa lý</option>
                    <option value="Hoạt động trải nghiệm">Hoạt động trải nghiệm</option>
                    <option value="Giáo dục công dân">Giáo dục công dân</option>
                    <option value="Công nghệ">Công nghệ</option>
                    <option value="Khác">Môn học tùy chỉnh mới...</option>
                  </select>
                </div>

                {sub === 'Khác' && (
                  <div>
                    <label className="block text-slate-500 mb-1">NHẬP TÊN MÔN HỌC</label>
                    <input
                      type="text"
                      required
                      placeholder="Ví dụ: Giáo dục kinh tế và pháp luật..."
                      value={customAiSubject}
                      onChange={(e) => setCustomAiSubject(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-500 mb-1">KHỐI LỚP</label>
                    <select
                      value={grade}
                      onChange={(e) => setGrade(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      {[6, 7, 8, 9, 10, 11, 12].map((g) => (
                        <option key={g} value={String(g)}>Khối lớp {g}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-500 mb-1">HỌC KỲ</label>
                    <select
                      value={semester}
                      onChange={(e) => setSemester(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="1">Kỳ I</option>
                      <option value="2">Kỳ II</option>
                      <option value="Cả năm">Cả năm</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-500 mb-1">BỘ SÁCH GIÁO KHOA</label>
                    <select
                      value={book}
                      onChange={(e) => setBook(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="Kết nối tri thức">Kết nối tri thức</option>
                      <option value="Cánh diều">Cánh diều</option>
                      <option value="Chân trời sáng tạo">Chân trời sáng tạo</option>
                      <option value="Cùng học để phát triển">Cùng học để phát triển</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-500 mb-1">SỐ TIẾT/TUẦN</label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={periods}
                      onChange={(e) => setPeriods(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-500 mb-1">YÊU CẦU ĐẶC THÙ (TÙY CHỌN)</label>
                  <textarea
                    rows={3}
                    value={reqText}
                    onChange={(e) => setReqText(e.target.value)}
                    placeholder="Ví dụ: Phân bổ 4 tiết/tuần, chú trọng thực hành bài tập, bao gồm các tuần kiểm tra giữa kỳ..."
                    className="w-full bg-slate-50 p-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none leading-relaxed font-semibold text-slate-700"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isAIPlanning}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs tracking-wider uppercase rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4" />
                  {isAIPlanning ? 'GEMINI AI ĐANG TÍNH TOÁN...' : 'TẠO KHUNG HỌC TRÌNH BẰNG AI'}
                </button>
              </form>
            </div>
          )}

          {/* Tab 3: Manual subject grade creator */}
          {activeTab === 'manual' && (
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-emerald-600 border-b pb-3">
                <FolderPlus className="w-5 h-5" />
                <h3 className="font-extrabold text-slate-800 text-sm uppercase tracking-wider">Thêm môn, lớp học phần</h3>
              </div>

              <p className="text-xs text-slate-400 font-semibold leading-relaxed">
                Khởi tạo khung chương trình học rỗng, sau đó giáo viên có thể tự do thêm các Chương và Bài học tùy thích.
              </p>

              <form onSubmit={handleManualSyllabusSubmit} className="space-y-3.5 text-xs font-bold">
                <div>
                  <label className="block text-slate-500 mb-1">MÔN HỌC CHUẨN</label>
                  <select
                    value={manualSubject}
                    onChange={(e) => setManualSubject(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Toán">Toán học</option>
                    <option value="Tin học">Tin học</option>
                    <option value="Vật lý">Vật lý</option>
                    <option value="Hóa học">Hóa học</option>
                    <option value="Sinh học">Sinh học</option>
                    <option value="Khoa học tự nhiên">Khoa học tự nhiên (KHTN)</option>
                    <option value="Ngữ văn">Ngữ văn</option>
                    <option value="Tiếng Anh">Tiếng Anh</option>
                    <option value="Lịch sử & Địa lý">Lịch sử & Địa lý</option>
                    <option value="Lịch sử">Lịch sử</option>
                    <option value="Địa lý">Địa lý</option>
                    <option value="Hoạt động trải nghiệm">Hoạt động trải nghiệm</option>
                    <option value="Giáo dục công dân">Giáo dục công dân</option>
                    <option value="Công nghệ">Công nghệ</option>
                    <option value="Khác">Môn học tùy chỉnh mới...</option>
                  </select>
                </div>

                {manualSubject === 'Khác' && (
                  <div>
                    <label className="block text-slate-500 mb-1">NHẬP TÊN MÔN HỌC KHÁC</label>
                    <input
                      type="text"
                      required
                      placeholder="Ví dụ: Giáo dục công dân, Công nghệ..."
                      value={manualCustomSubject}
                      onChange={(e) => setManualCustomSubject(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-slate-500 mb-1">KHỐI LỚP</label>
                  <select
                    value={manualGrade}
                    onChange={(e) => setManualGrade(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {[6, 7, 8, 9, 10, 11, 12].map((g) => (
                      <option key={g} value={String(g)}>Khối lớp {g}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-500 mb-1">BỘ SÁCH GIÁO KHOA CHUẨN</label>
                  <select
                    value={manualBook}
                    onChange={(e) => setManualBook(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Kết nối tri thức">Kết nối tri thức</option>
                    <option value="Cánh diều">Cánh diều</option>
                    <option value="Chân trời sáng tạo">Chân trời sáng tạo</option>
                    <option value="Cùng học để phát triển">Cùng học để phát triển</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-500 mb-1">HỌC KỲ</label>
                    <select
                      value={manualSemester}
                      onChange={(e) => setManualSemester(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="1">Kỳ I</option>
                      <option value="2">Kỳ II</option>
                      <option value="Cả năm">Cả năm</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-500 mb-1">SỐ TIẾT/TUẦN</label>
                    <input
                      type="number"
                      min="1"
                      placeholder="4"
                      value={manualPeriods}
                      onChange={(e) => setManualPeriods(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs tracking-wider uppercase rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Khởi tạo cây môn học
                </button>
              </form>
            </div>
          )}
        </div>

        {/* RIGHT ASPECT: Interactive Syllabus Tree View & Configuration Details */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
          
          {/* Active Syllabus Selector & Header Toolbar */}
          <div className="border-b border-slate-100 pb-4 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-emerald-600" />
                <h3 className="font-black text-slate-800 text-base">
                  Cây Phân phối Chương trình Học
                </h3>
              </div>
              
              <div className="flex items-center gap-2 text-xs font-bold">
                <span className="text-slate-500 font-medium hidden md:inline">Chọn Môn / Lớp:</span>
                <select
                  value={selectedSyId}
                  onChange={(e) => setSelectedSyId(e.target.value)}
                  className="bg-emerald-50 border border-emerald-200 text-emerald-900 font-black rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                >
                  {syllabus.map((sy) => (
                    <option key={sy.id} value={sy.id}>
                      {sy.subject} - Lớp {sy.grade} ({sy.book})
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={handleExportJSON}
                  title="Xuất cấu trúc chương trình ra file JSON"
                  className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-[11px]"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Tải JSON</span>
                </button>
              </div>
            </div>

            {activeSy && (
              <div className="space-y-3">
                {/* Information Card & Stats */}
                <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-semibold">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-slate-900 text-sm font-black">
                        {activeSy.subject} — Lớp {activeSy.grade}
                      </span>
                      <span className="px-2 py-0.5 bg-emerald-600 text-white font-extrabold rounded-full text-[10px]">
                        SGK: {activeSy.book}
                      </span>
                      <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 font-extrabold rounded-full text-[10px]">
                        Học kỳ {activeSy.semester}
                      </span>
                    </div>
                    <p className="text-slate-600 font-medium">
                      Phân phối thời lượng: <strong>{activeSy.periods} tiết/tuần</strong>
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onDeleteFullSyllabus(activeSy.id)}
                      className="px-3 py-1.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 font-extrabold uppercase text-[10px] rounded-lg transition-colors cursor-pointer"
                    >
                      Gỡ môn này
                    </button>
                  </div>
                </div>

                {/* Dashboard Stats Bar */}
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-2.5 bg-slate-50 border rounded-xl">
                    <span className="block text-slate-400 font-bold uppercase text-[10px]">TỔNG SỐ CHƯƠNG</span>
                    <span className="text-base font-black text-slate-800">{activeStats.totalChapters}</span>
                  </div>
                  <div className="p-2.5 bg-slate-50 border rounded-xl">
                    <span className="block text-slate-400 font-bold uppercase text-[10px]">TỔNG SỐ BÀI HỌC</span>
                    <span className="text-base font-black text-emerald-600">{activeStats.totalLessons}</span>
                  </div>
                  <div className="p-2.5 bg-slate-50 border rounded-xl">
                    <span className="block text-slate-400 font-bold uppercase text-[10px]">CÂU HỎI KHO MÔN</span>
                    <span className="text-base font-black text-indigo-600">{activeStats.questionCount}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Search Filter and Add Chapter Wizard Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-bold">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={treeSearchTerm}
                onChange={(e) => setTreeSearchTerm(e.target.value)}
                placeholder="Lọc tên chương, bài học..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 text-slate-700 font-medium"
              />
            </div>

            <button
              onClick={() => setIsAddingChapter(!isAddingChapter)}
              className="w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer font-extrabold uppercase text-[11px]"
            >
              <Plus className="w-4 h-4" />
              {isAddingChapter ? 'Đóng wizard' : 'Thêm Chương mới'}
            </button>
          </div>

          {/* Add Chapter Form Box */}
          {isAddingChapter && (
            <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-200 space-y-3 text-xs font-bold animate-fadeIn">
              <h4 className="text-emerald-800 uppercase tracking-wide font-extrabold flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-emerald-600" />
                Thêm Chương Mới Vào Cấu Trúc
              </h4>
              <input
                type="text"
                value={newChapterTitle}
                onChange={(e) => setNewChapterTitle(e.target.value)}
                placeholder="Nhập tên chương... (Ví dụ: Chương III: Phương trình bậc hai một ẩn)"
                className="w-full bg-white border border-slate-200 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
              />
              <textarea
                rows={2}
                value={newChapterDocx}
                onChange={(e) => setNewChapterDocx(e.target.value)}
                placeholder="Mô tả tóm tắt tài liệu chương (Tùy chọn)..."
                className="w-full bg-white border border-slate-200 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddingChapter(false)}
                  className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleAddNewChapterDirect}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-xs cursor-pointer"
                >
                  Xác nhận thêm Chương
                </button>
              </div>
            </div>
          )}

          {/* Active Syllabus Chapters and Lessons Interactive Tree */}
          {filteredChapters.length > 0 ? (
            <div className="space-y-4">
              {filteredChapters.map((chapter, chIdx) => (
                <div key={chapter.id} className="bg-slate-50/80 rounded-2xl border border-slate-200/80 overflow-hidden shadow-2xs">
                  
                  {/* Chapter Header Line */}
                  <div className="p-4 bg-slate-100/70 border-b border-slate-200/60 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 font-black text-slate-800 text-sm flex-1 min-w-0">
                      <span className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-xs shadow-2xs flex-shrink-0">
                        {chIdx + 1}
                      </span>
                      <span className="truncate">{chapter.title}</span>
                      <span className="text-[10px] text-slate-400 font-semibold px-2 py-0.5 bg-white border rounded-md hidden sm:inline flex-shrink-0">
                        {chapter.lessons.length} bài học
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* Move Chapter Buttons */}
                      <button
                        onClick={() => handleMoveChapter(chapter.id, 'up')}
                        disabled={chIdx === 0}
                        title="Di chuyển chương lên"
                        className="p-1.5 bg-white hover:bg-slate-200 text-slate-600 rounded border transition-colors cursor-pointer disabled:opacity-30"
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleMoveChapter(chapter.id, 'down')}
                        disabled={chIdx === filteredChapters.length - 1}
                        title="Di chuyển chương xuống"
                        className="p-1.5 bg-white hover:bg-slate-200 text-slate-600 rounded border transition-colors cursor-pointer disabled:opacity-30"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>

                      {/* Edit Chapter Docx Button */}
                      <button
                        onClick={() => setEditingDocxTarget({
                          type: 'chapter',
                          chapterId: chapter.id,
                          title: chapter.title,
                          currentText: chapter.docxText || ''
                        })}
                        title="Chỉnh sửa nội dung tài liệu DOCX tóm tắt của chương"
                        className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded border border-indigo-200 transition-colors cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5" />
                      </button>

                      {/* Rename Chapter */}
                      <button
                        onClick={() => setEditingChapterModal({ id: chapter.id, title: chapter.title })}
                        title="Đổi tên chương"
                        className="p-1.5 bg-white hover:bg-slate-200 text-slate-600 rounded border transition-colors cursor-pointer"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>

                      {/* Add Lesson to this Chapter */}
                      <button
                        onClick={() => setActiveChapterIdForLesson(activeChapterIdForLesson === chapter.id ? null : chapter.id)}
                        title="Thêm bài học vào chương này"
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        <span className="hidden sm:inline">Thêm Bài</span>
                      </button>

                      {/* Delete Chapter */}
                      <button
                        onClick={() => handleDeleteChapter(chapter.id)}
                        title="Xóa chương này"
                        className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded border border-red-200 transition-colors cursor-pointer"
                      >
                        <Trash className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Add Lesson Wizard for this Chapter */}
                  {activeChapterIdForLesson === chapter.id && (
                    <div className="p-4 bg-emerald-50/40 border-b border-emerald-100 space-y-3 text-xs font-bold animate-fadeIn">
                      <h5 className="text-emerald-800 uppercase tracking-wide font-extrabold flex items-center gap-1">
                        <Plus className="w-3.5 h-3.5 text-emerald-600" />
                        Thêm bài học mới vào: {chapter.title}
                      </h5>
                      <input
                        type="text"
                        value={newLessonTitle}
                        onChange={(e) => setNewLessonTitle(e.target.value)}
                        placeholder="Tên bài học... (Ví dụ: Bài 1: Công thức Vi-ét và ứng dụng)"
                        className="w-full bg-white border border-slate-200 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                      />
                      <input
                        type="text"
                        value={newLessonTopics}
                        onChange={(e) => setNewLessonTopics(e.target.value)}
                        placeholder="Từ khóa, chủ đề (ngăn cách bằng dấu phẩy)..."
                        className="w-full bg-white border border-slate-200 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setActiveChapterIdForLesson(null)}
                          className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg cursor-pointer"
                        >
                          Hủy
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAddNewLessonDirect(chapter.id)}
                          className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-xs cursor-pointer"
                        >
                          Lưu Bài Học
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Lessons List inside Chapter */}
                  <div className="p-3 space-y-2">
                    {chapter.lessons && chapter.lessons.length > 0 ? (
                      chapter.lessons.map((lesson, leIdx) => (
                        <div
                          key={lesson.id}
                          className="p-3 bg-white rounded-xl border border-slate-200/70 hover:border-emerald-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group shadow-2xs"
                        >
                          <div className="space-y-1 flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-slate-400 font-mono text-[11px] font-extrabold flex-shrink-0">
                                {chIdx + 1}.{leIdx + 1}
                              </span>
                              <p className="font-extrabold text-slate-800 text-xs truncate">
                                {lesson.title}
                              </p>
                            </div>

                            {/* Lesson Topics Pills */}
                            {lesson.topics && lesson.topics.length > 0 && (
                              <div className="flex items-center gap-1.5 flex-wrap pl-5">
                                {lesson.topics.map((tp, idx) => (
                                  <span
                                    key={idx}
                                    className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-bold"
                                  >
                                    #{tp}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Lesson Actions Toolbar */}
                          <div className="flex items-center gap-1.5 self-end sm:self-center">
                            {/* AI Question Generator Button */}
                            <button
                              onClick={() => handleGenerateQuestionsForLesson(chapter.title, lesson)}
                              disabled={generatingQuestionsLessonId === lesson.id}
                              title="Tự động biên soạn 5 câu hỏi trắc nghiệm bằng Gemini AI cho bài học này"
                              className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 font-extrabold text-[10px] rounded-lg transition-colors cursor-pointer flex items-center gap-1 disabled:opacity-50"
                            >
                              <Sparkles className="w-3 h-3 text-emerald-600" />
                              <span>{generatingQuestionsLessonId === lesson.id ? 'Đang tạo...' : 'AI sinh câu hỏi'}</span>
                            </button>

                            {/* Move Lesson */}
                            <button
                              onClick={() => handleMoveLesson(chapter.id, lesson.id, 'up')}
                              disabled={leIdx === 0}
                              className="p-1 bg-slate-50 hover:bg-slate-200 text-slate-500 rounded border cursor-pointer disabled:opacity-30"
                              title="Lên"
                            >
                              <ChevronUp className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleMoveLesson(chapter.id, lesson.id, 'down')}
                              disabled={leIdx === chapter.lessons.length - 1}
                              className="p-1 bg-slate-50 hover:bg-slate-200 text-slate-500 rounded border cursor-pointer disabled:opacity-30"
                              title="Xuống"
                            >
                              <ChevronDown className="w-3 h-3" />
                            </button>

                            {/* Edit Lesson Docx Text */}
                            <button
                              onClick={() => setEditingDocxTarget({
                                type: 'lesson',
                                chapterId: chapter.id,
                                lessonId: lesson.id,
                                title: lesson.title,
                                currentText: lesson.docxText || ''
                              })}
                              title="Nội dung bài giảng DOCX"
                              className="p-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded border border-indigo-200 cursor-pointer"
                            >
                              <FileText className="w-3 h-3" />
                            </button>

                            {/* Edit Lesson */}
                            <button
                              onClick={() => setEditingLessonModal({
                                chapterId: chapter.id,
                                lessonId: lesson.id,
                                title: lesson.title,
                                topicsStr: lesson.topics ? lesson.topics.join(', ') : ''
                              })}
                              title="Sửa tên bài"
                              className="p-1 bg-slate-50 hover:bg-slate-200 text-slate-600 rounded border cursor-pointer"
                            >
                              <Edit className="w-3 h-3" />
                            </button>

                            {/* Delete Lesson */}
                            <button
                              onClick={() => onDeleteLesson(activeSy.id, chapter.id, lesson.id)}
                              title="Xóa bài học"
                              className="p-1 bg-red-50 hover:bg-red-100 text-red-600 rounded border border-red-200 cursor-pointer"
                            >
                              <Trash className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-4 text-center text-slate-400 italic text-xs font-medium">
                        Chưa có bài học nào trong chương này. Bấm nút "Thêm Bài" để khởi tạo bài học.
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center space-y-3">
              <BookOpen className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-slate-600">Chưa tìm thấy chương hoặc bài học nào khớp với điều kiện.</p>
              <p className="text-xs text-slate-400">Bạn có thể tạo thêm chương mới hoặc thử dán cấu trúc từ file DOCX ở cột bên trái.</p>
            </div>
          )}
        </div>
      </div>

      {/* RENAME CHAPTER MODAL */}
      {editingChapterModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4 border border-slate-100 animate-fadeIn text-xs font-bold">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide">Đổi Tên Chương</h3>
            <div>
              <label className="block text-slate-500 mb-1">TÊN CHƯƠNG MỚI</label>
              <input
                type="text"
                value={editingChapterModal.title}
                onChange={(e) => setEditingChapterModal({ ...editingChapterModal, title: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-emerald-500 font-extrabold text-slate-800"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setEditingChapterModal(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={handleSaveChapterRename}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs cursor-pointer uppercase font-black"
              >
                Lưu Thay Đổi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT LESSON MODAL */}
      {editingLessonModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4 border border-slate-100 animate-fadeIn text-xs font-bold">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide">Chỉnh Sửa Bài Học</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-slate-500 mb-1">TÊN BÀI HỌC</label>
                <input
                  type="text"
                  value={editingLessonModal.title}
                  onChange={(e) => setEditingLessonModal({ ...editingLessonModal, title: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-emerald-500 font-extrabold text-slate-800"
                />
              </div>
              <div>
                <label className="block text-slate-500 mb-1">TỪ KHÓA & CHỦ ĐỀ (Cách nhau bằng dấu phẩy)</label>
                <input
                  type="text"
                  value={editingLessonModal.topicsStr}
                  onChange={(e) => setEditingLessonModal({ ...editingLessonModal, topicsStr: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-emerald-500 text-slate-700"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setEditingLessonModal(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={handleSaveLessonEdit}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs cursor-pointer uppercase font-black"
              >
                Cập Nhật Bài Học
              </button>
            </div>
          </div>
        </div>
      )}

      {/* INLINE DOCX CONTENT EDITOR MODAL */}
      {editingDocxTarget && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl shadow-2xl space-y-4 border border-slate-100 animate-fadeIn text-xs font-bold">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2 text-indigo-600">
                <FileText className="w-5 h-5" />
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide">
                  Nội dung Tài liệu DOCX — {editingDocxTarget.title}
                </h3>
              </div>
              <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 font-extrabold rounded-lg text-[10px] uppercase">
                {editingDocxTarget.type === 'chapter' ? 'Nội dung Chương' : 'Bài giảng Bài học'}
              </span>
            </div>

            <div>
              <label className="block text-slate-500 mb-1.5 uppercase tracking-wide">
                VĂN BẢN TÀI LIỆU CHI TIẾT
              </label>
              <textarea
                rows={10}
                value={editingDocxTarget.currentText}
                onChange={(e) => setEditingDocxTarget({ ...editingDocxTarget, currentText: e.target.value })}
                placeholder="Nhập lý thuyết trọng tâm, các dạng bài tập mẫu và hướng dẫn học tập..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed font-sans text-slate-800"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setEditingDocxTarget(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={handleSaveDocxEdit}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs cursor-pointer uppercase font-black"
              >
                Lưu Nội Dung DOCX
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
