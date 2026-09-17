/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Syllabus, Chapter, Lesson, Question } from '../types';
import {
  Sparkles,
  Trash,
  Plus,
  FileText,
  ChevronRight,
  AlertTriangle,
  CheckCircle,
  FileSpreadsheet,
  ClipboardList,
  Upload,
  BookOpen,
  Settings,
  HelpCircle,
  FolderPlus,
  FileCode,
  CheckSquare,
  Edit,
  Save,
  BookMarked,
  Layers,
  FileSearch
} from 'lucide-react';

interface SyllabusConfigProps {
  syllabus: Syllabus[];
  questions: Question[];
  onDeleteFullSyllabus: (id: string) => void;
  onAddNewChapter: (syllabusId: string, title: string) => void;
  onAddNewLesson: (syllabusId: string, chapterId: string, lessonTitle: string, topics: string[]) => void;
  onDeleteLesson: (syllabusId: string, chapterId: string, lessonId: string) => void;
  onAIAdvisorSuggest: (subject: string, grade: string, req: string) => void;
  onCreateFullSyllabus: (newSy: { grade: string; subject: string; book: string; semester: string; periods: string }) => void;
  onUpdateFullSyllabus: (id: string, updatedChapters: Chapter[]) => void;
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
}: SyllabusConfigProps) {
  // NAVIGATION & MODE TABS
  const [activeTab, setActiveTab] = useState<'manual' | 'docxStructure' | 'aiSuggest'>('docxStructure');
  
  // CURRENT SELECTION
  const [selectedSyId, setSelectedSyId] = useState(syllabus[0]?.id || '');

  // IMPORT FORMAT PRESETS / MODE
  const [importMode, setImportMode] = useState<'replace' | 'append'>('replace');

  // MANUAL SYLLABUS FORM STATES
  const [manualSubject, setManualSubject] = useState('Toán');
  const [manualCustomSubject, setManualCustomSubject] = useState('');
  const [manualGrade, setManualGrade] = useState('6');
  const [manualBook, setManualBook] = useState('Kết nối tri thức');
  const [manualSemester, setManualSemester] = useState('1');
  const [manualPeriods, setManualPeriods] = useState('4');

  // DOCX RAW STRUCTURE IMPORT TEXT
  const [docxRawStructure, setDocxRawStructure] = useState(
    `Chương I: Tập hợp các số tự nhiên\n- Bài 1: Tập hợp. Phần tử của tập hợp\n- Bài 2: Khái niệm số tự nhiên\n- Bài 3: Phép toán nguyên lý cộng học\nChương II: Tính chia hết trong số học\n- Bài 4: Tính chất chia hết của một tổng\n- Bài 5: Dấu hiệu chia hết phổ thông`
  );
  
  // CHAPTER & LESSON CREATION WIZARDS
  const [isAddingChapter, setIsAddingChapter] = useState(false);
  const [newChapterTitle, setNewChapterTitle] = useState('');
  const [newChapterDocx, setNewChapterDocx] = useState('');

  const [activeChapterIdForLesson, setActiveChapterIdForLesson] = useState<string | null>(null);
  const [newLessonTitle, setNewLessonTitle] = useState('');
  const [newLessonTopics, setNewLessonTopics] = useState('Từ khóa chính, Chủ đề ôn luyện');
  const [newLessonDocx, setNewLessonDocx] = useState('');

  // INLINE DOCX EDITOR MODAL / PANEL STATE
  const [editingDocxTarget, setEditingDocxTarget] = useState<{
    type: 'chapter' | 'lesson';
    chapterId: string;
    lessonId?: string;
    title: string;
    currentText: string;
  } | null>(null);

  // ORIGINAL AI DISPATCH STATES
  const [sub, setSub] = useState('Toán');
  const [grade, setGrade] = useState('6');
  const [reqText, setReqText] = useState('');
  const [isAIPlanning, setIsAIPlanning] = useState(false);

  // Active program resolver
  const activeSy = syllabus.find((sy) => sy.id === selectedSyId) || syllabus[0] || null;

  // Auto-switch selected syllabus when list changes
  React.useEffect(() => {
    if (syllabus.length > 0 && !selectedSyId) {
      setSelectedSyId(syllabus[0].id);
    }
  }, [syllabus, selectedSyId]);

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

    // Reset some inputs
    setManualCustomSubject('');
  };

  // Original AI Dispatch handler
  const handleAIPlanningSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsAIPlanning(true);
    setTimeout(() => {
      onAIAdvisorSuggest(sub, grade, reqText);
      setIsAIPlanning(false);
      setReqText('');
    }, 1500);
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
          docxText: `— Sách: ${bookName}\n— Phân tích chuẩn: Khung nội dung chi tiết Chương.\nDán nội dung DOCX chi tiết môn học của bạn ở đây...`,
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
            topics: ['Phân dã DOCX', subjectName],
            docxText: `— Nội dung cụ thể bài học: ${cleanLessonTitle}\n[DOCX] Dán bài giảng chi tiết, công thức, ví dụ giải toán tự chọn từ file DOCX của bạn tại đây...`
          };

          if (currentCh) {
            currentCh.lessons.push(lessonObj);
          } else {
            // Fallback initial chapter if doc starts without chapter
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
    if (!activeSy) {
      alert('Vui lòng chọn một chương trình học ở cột phải trước khi dán cấu cấu trúc chương trình!');
      return;
    }

    if (!docxRawStructure.trim()) {
      alert('Vui lòng nhập văn bản cấu trúc DOCX để phân tích!');
      return;
    }

    const parsedChapters = parseSyllabusFromText(docxRawStructure, activeSy.subject, activeSy.book);
    
    if (parsedChapters.length === 0) {
      alert('Không nhận diện được chương hoặc bài học nào hợp lệ. Vui lòng kiểm tra lại cấu trúc văn bản của bạn!');
      return;
    }

    let finalChapters: Chapter[] = [];
    if (importMode === 'replace') {
      finalChapters = parsedChapters;
    } else {
      finalChapters = [...activeSy.chapters, ...parsedChapters];
    }

    onUpdateFullSyllabus(activeSy.id, finalChapters);
    
    // Clear structural input
    setDocxRawStructure('');
    alert(`Phân tích thành công! Đã ${importMode === 'replace' ? 'thiết lập mới hoàn toàn' : 'bổ sung thêm'} ${parsedChapters.length} Chương và ${parsedChapters.reduce((acc, c) => acc + c.lessons.length, 0)} bài học vào chương trình hiện tại.`);
  };

  // Add a brand-new Chapter manually with an optional detailed DOCX text
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
      docxText: newChapterDocx.trim() || `Tài liệu DOCX tóm tắt của chương: ${newChapterTitle}`
    };

    const updatedChapters = [...activeSy.chapters, newCh];
    onUpdateFullSyllabus(activeSy.id, updatedChapters);

    // Reset Chapter Form
    setNewChapterTitle('');
    setNewChapterDocx('');
    setIsAddingChapter(false);
  };

  // Add a brand-new Lesson inside a specific Chapter manually with its own DOCX text
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
      docxText: newLessonDocx.trim() || `Tài liệu bài giảng chi tiết DOCX rèn kỹ năng: ${newLessonTitle}`
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

    // Reset Lesson Form
    setNewLessonTitle('');
    setNewLessonTopics('Từ khóa chính, Chủ đề ôn luyện');
    setNewLessonDocx('');
    setActiveChapterIdForLesson(null);
  };

  // Active docx editor model saver
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
      // type === 'lesson'
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
  };

  return (
    <div className="space-y-6">
      
      {/* Dynamic Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <BookMarked className="w-6 h-6 text-emerald-600" />
            Cấu hình khung học trình & Phân phối môn học
          </h1>
          <p className="text-xs text-slate-500 font-semibold mt-1">
            Thiết lập thủ công khối học, môn chuẩn, chương chuyên biệt, và bài trong chương. Cho phép dán văn bản phân bổ từ Microsoft Word / DOCX.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-55 bg-slate-50 border p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('manual')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
              activeTab === 'manual' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Thêm Môn & Lớp
          </button>
          <button
            onClick={() => setActiveTab('docxStructure')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1 ${
              activeTab === 'docxStructure' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            Nhập Cấu trúc DOCX
          </button>
          <button
            onClick={() => setActiveTab('aiSuggest')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1 ${
              activeTab === 'aiSuggest' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            AI Phân phối
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT ASPECT: Interactive Inputs depending on chosen tab */}
        <div className="space-y-6">
          
          {/* Tab 1: Manual subject grade creator */}
          {activeTab === 'manual' && (
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-emerald-600 border-b pb-2">
                <FolderPlus className="w-5 h-5" />
                <h3 className="font-extrabold text-slate-800 text-sm uppercase tracking-wider">Thêm môn, lớp học phần</h3>
              </div>

              <p className="text-xs text-slate-400 font-semibold leading-relaxed">
                Khởi tạo chương trình rèn luyện rỗng, sau đó giáo viên có thể bóc tách thêm mới các chương và bài để áp dụng giảng dạy.
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
                    <option value="Ngữ văn">Ngữ văn</option>
                    <option value="Tiếng Anh">Tiếng Anh</option>
                    <option value="Khác">Môn học tùy chỉnh mới...</option>
                  </select>
                </div>

                {manualSubject === 'Khác' && (
                  <div className="animate-fade-in">
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
                  <label className="block text-slate-500 mb-1">KHỐI LỚP / PHÂN BẬC</label>
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
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Kết nối tri thức, Chân trời sáng tạo..."
                    value={manualBook}
                    onChange={(e) => setManualBook(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-500 mb-1">HỌC KỲ</label>
                    <select
                      value={manualSemester}
                      onChange={(e) => setManualSemester(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="1">Kỳ học I</option>
                      <option value="2">Kỳ học II</option>
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
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs tracking-wider uppercase rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  Khởi tạo cây môn học
                </button>
              </form>
            </div>
          )}

                  {/* Tab 2: Smart line-by-line DOCX text structure copy pasting parser with Real-time Auto Split Preview */}
          {activeTab === 'docxStructure' && (
            <div className="bg-white p-6 rounded-2xl border border-indigo-100 shadow-md space-y-5">
              <div className="flex items-center gap-2 text-indigo-600 border-b pb-2">
                <FileCode className="w-5 h-5 text-indigo-505" />
                <h3 className="font-extrabold text-slate-800 text-sm uppercase tracking-wider">Trình nạp & Tự động tách Chương / Bài từ DOCX</h3>
              </div>

              <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                Chỉ cần dán toàn bộ phân bổ chương trình học (Chương, Bài) copy từ file Word (.docx) của bạn vào ô dưới đây. Hệ thống sẽ <span className="text-indigo-600 font-bold">tự động bóc tách</span> và kiến tạo cây bài giảng rèn luyện ngay lập tức.
              </p>

              <div className="space-y-4 text-xs font-bold">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-slate-650 uppercase tracking-wide">NỘI DUNG VĂN BẢN DOCX</span>
                    <div className="flex gap-2">
                      <span
                        className="text-[10px] text-indigo-600 font-extrabold bg-indigo-50 px-2 py-0.5 rounded cursor-pointer hover:bg-indigo-100 transition-colors"
                        onClick={() => setDocxRawStructure(
                          "Chương I: Mệnh đề và tập hợp môn học\n- Bài 1: Mệnh đề toán học\n- Bài 2: Tập hợp và phép toán trên tập hợp\n- Bài 3: Các số đặc trưng đo xu thế\nChương II: Bất phương trình và hệ bất phương trình bậc nhất\n- Bài 1: Bất phương trình bậc nhất hai ẩn\n- Bài 2: Hệ bất phương trình bậc nhất hai ẩn"
                        )}
                      >
                        Mẫu 1 (Toán)
                      </span>
                      <span
                        className="text-[10px] text-emerald-600 font-extrabold bg-emerald-50 px-2 py-0.5 rounded cursor-pointer hover:bg-emerald-100 transition-colors"
                        onClick={() => setDocxRawStructure(
                          "Chương I: Khái quát cơ sở hóa học đại cương\n- Bài 1: Thành phần nguyên tử cấu tạo\n- Bài 2: Bảng tuần hoàn nguyên tố hóa học\nChương II: Liên kết hóa học và phản ứng\n- Bài 3: Liên kết ion và phân cực\n- Bài 4: Phản ứng oxi hóa - khử nâng cao"
                        )}
                      >
                        Mẫu 2 (Hóa)
                      </span>
                    </div>
                  </div>
                  <textarea
                    rows={8}
                    value={docxRawStructure}
                    onChange={(e) => setDocxRawStructure(e.target.value)}
                    placeholder="Dán toàn bộ danh mục từ tệp DOCX vào đây...&#13;&#10;&#13;&#10;Ví dụ:&#13;&#10;Chương 1: Khám phá lý thuyết số&#13;&#10;- Bài 1: Bản chất của phép chia có dư&#13;&#10;- Bài 2: Ước số chung lớn nhất&#13;&#10;Chương 2:..."
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
                      <span className="text-[9px] font-medium opacity-80">(Xóa hết các chương cũ)</span>
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
                      Xem trước kết quả phân tách tự động
                    </span>
                    <span className="bg-white px-2 py-0.5 border text-slate-600 rounded text-[10px] font-black">
                      {parseSyllabusFromText(docxRawStructure, activeSy?.subject || 'Môn', activeSy?.book || 'Sách').length} Chương |{' '}
                      {parseSyllabusFromText(docxRawStructure, activeSy?.subject || 'Môn', activeSy?.book || 'Sách').reduce(
                        (acc, ch) => acc + ch.lessons.length,
                        0
                      )}{' '}
                      Bài học
                    </span>
                  </div>

                  <div className="max-h-44 overflow-y-auto space-y-2 text-xs font-semibold leading-relaxed font-mono pr-1 text-slate-600">
                    {parseSyllabusFromText(docxRawStructure, activeSy?.subject || 'Môn', activeSy?.book || 'Sách').length > 0 ? (
                      parseSyllabusFromText(docxRawStructure, activeSy?.subject || 'Môn', activeSy?.book || 'Sách').map((ch, i) => (
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
                            {ch.lessons.length === 0 && (
                              <p className="italic text-[10px] text-amber-500">Chưa ghi nhận bài học nào trong chương này</p>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-slate-400 italic font-sans text-center py-4">
                        Hệ thống sẽ tự nhận diện trực quan khi bạn nhập hoặc chép dữ liệu DOCX vào ô văn bản phía trên...
                      </p>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleParseAndApplyDocxStructure}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs tracking-wider uppercase rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Upload className="w-4 h-4 animate-bounce text-indigo-100" />
                  XÁC NHẬN PHÂN TÁCH & KHỞI TẠO NGAY
                </button>
              </div>
            </div>
          )}

          {/* Tab 3: Original AI Suggested Advisor */}
          {activeTab === 'aiSuggest' && (
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-teal-600 border-b pb-2">
                <Sparkles className="w-5 h-5 text-teal-500 animate-spin" />
                <h3 className="font-extrabold text-slate-800 text-sm uppercase tracking-wider">AI đề xuất phân phối</h3>
              </div>

              <p className="text-xs text-slate-400 font-semibold leading-relaxed">
                Yêu cầu Trí tuệ nhân tạo lập kế hoạch rèn luyện chuẩn khung học vụ định hướng từ Bộ Giáo dục.
              </p>

              <form onSubmit={handleAIPlanningSubmit} className="space-y-3 text-xs font-bold">
                <div>
                  <label className="block text-slate-500 mb-1">MÔN HỌC ĐỀ XUẤT</label>
                  <select
                    value={sub}
                    onChange={(e) => setSub(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Toán">Toán học</option>
                    <option value="Tin học">Tin học</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-500 mb-1">KHỐI LỚP / PHÂN BẬC</label>
                  <select
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="6">Khối lớp 6</option>
                    <option value="7">Khối lớp 7</option>
                    <option value="8">Khối lớp 8</option>
                    <option value="9">Khối lớp 9</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-500 mb-1">YÊU CẦU ĐẶC THÙ</label>
                  <textarea
                    rows={4}
                    value={reqText}
                    onChange={(e) => setReqText(e.target.value)}
                    placeholder="Ví dụ: Phân phối 4 tiết/tuần, tăng số tiết luyện tập số hóa giữa kỳ học..."
                    className="w-full bg-slate-50 p-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none leading-relaxed font-semibold"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isAIPlanning}
                  className="w-full py-3 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-extrabold text-xs tracking-wider uppercase rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  {isAIPlanning ? 'HÃY ĐỢI AI TÍNH TOÁN...' : 'AI PHÂN PHỐI HỌC TRÌNH NGAY'}
                </button>
              </form>
            </div>
          )}
        </div>

        {/* RIGHT ASPECT: Interactive Syllabus Tree View & Configuration Details */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
          
          {/* Active Syllabus Selector bar */}
          <div className="border-b border-slate-100 pb-4 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h3 className="font-black text-slate-800 text-base flex items-center gap-1.5">
                <Layers className="w-5 h-5 text-emerald-600" />
                Cây phân phối chương trình rèn luyện
              </h3>
              
              <div className="text-xs font-bold">
                <select
                  value={selectedSyId}
                  onChange={(e) => setSelectedSyId(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-slate-700 font-extrabold rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {syllabus.map((sy) => (
                    <option key={sy.id} value={sy.id}>
                      {sy.subject} - Lớp {sy.grade} ({sy.book})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {activeSy && (
              <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100/70 flex justify-between items-center text-xs font-semibold">
                <div className="space-y-1">
                  <p className="text-slate-800 text-sm font-extrabold">
                    {activeSy.subject} — Lớp {activeSy.grade}
                  </p>
                  <p className="text-slate-500 font-medium">
                    Sách giáo khoa: <strong className="text-slate-700">{activeSy.book}</strong> | Học kỳ: {activeSy.semester} | Phân phối: {activeSy.periods} tiết/tuần
                  </p>
                </div>
                <button
                  onClick={() => onDeleteFullSyllabus(activeSy.id)}
                  className="px-3 py-1.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 font-extrabold uppercase text-[10px] rounded-lg transition-colors"
                >
                  Gỡ bỏ môn học này
                </button>
              </div>
            )}
          </div>

          {/* Custom Forms inside the Tree */}
          {activeSy && (
            <div className="space-y-4">
              
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-400 font-bold uppercase tracking-wider">
                  Cơ cấu thư mục và Tài liệu DOCX hỗ trợ
                </span>
                
                {!isAddingChapter ? (
                  <button
                    onClick={() => setIsAddingChapter(true)}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-1 shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Thêm Chương mới
                  </button>
                ) : (
                  <button
                    onClick={() => setIsAddingChapter(false)}
                    className="px-2.5 py-1 text-xs font-bold text-slate-500 hover:text-slate-700"
                  >
                    Đóng
                  </button>
                )}
              </div>

              {/* Expandable Manual Chapter Creator box containing DOCX pasting input */}
              {isAddingChapter && (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 animate-slide-down">
                  <h4 className="font-extrabold text-slate-800 text-xs uppercase text-emerald-700">Tạo Chương mới & Dán tài liệu DOCX</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-bold">
                    <div className="space-y-3">
                      <div>
                        <label className="block text-slate-500 mb-1">TIÊU ĐỀ CHƯƠNG *</label>
                        <input
                          type="text"
                          placeholder="Ví dụ: Chương I: Hình học phẳng..."
                          value={newChapterTitle}
                          onChange={(e) => setNewChapterTitle(e.target.value)}
                          className="w-full bg-white border border-slate-250 border-slate-200 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                      <button
                        onClick={handleAddNewChapterDirect}
                        className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs uppercase rounded-lg shadow-inner flex items-center justify-center gap-1.5"
                      >
                        <Save className="w-3.5 h-3.5" />
                        LƯU TRỮ CHƯƠNG MỚI
                      </button>
                    </div>

                    <div>
                      <label className="block text-slate-500 mb-1 flex items-center justify-between">
                        <span>KHUNG CHÉP VĂN BẢN DOCX CỦA CHƯƠNG</span>
                        <span className="text-[9px] text-zinc-400 font-medium">Tùy chọn</span>
                      </label>
                      <textarea
                        rows={4}
                        placeholder="Có thể sao dán dàn ý, tóm tắt lý thuyết sơ bộ của chương từ Word/DOCX tại đây..."
                        value={newChapterDocx}
                        onChange={(e) => setNewChapterDocx(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 outline-none focus:ring-2 focus:ring-emerald-500 text-xs font-semibold leading-relaxed"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* LIST OF CHAPTERS AND LESSONS IN SYLLABUS */}
              <div className="space-y-4">
                {activeSy.chapters.map((ch) => {
                  const hasChDocx = !!ch.docxText?.trim();
                  return (
                    <div key={ch.id} className="border border-slate-150 rounded-2xl p-4 bg-slate-50/50 space-y-4">
                      
                      {/* Chapter heading box */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-2">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4.5 h-4.5 text-emerald-600" />
                          <div>
                            <h4 className="font-black text-slate-800 text-sm leading-snug">
                              {ch.title}
                            </h4>
                            <div className="flex gap-2 mt-0.5">
                              {hasChDocx ? (
                                <span className="px-2 py-0.2 bg-green-50 text-green-700 border border-green-200 text-[9px] font-extrabold rounded-full uppercase flex items-center gap-0.5">
                                  <CheckSquare className="w-2.5 h-2.5" /> Có khung DOCX
                                </span>
                              ) : (
                                <span className="text-slate-400 text-[10px] font-medium italic">Khung DOCX: trống</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Chapter actions row */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setEditingDocxTarget({
                              type: 'chapter',
                              chapterId: ch.id,
                              title: ch.title,
                              currentText: ch.docxText || ''
                            })}
                            className="px-2 py-1 bg-white hover:bg-slate-100 border text-slate-600 font-bold text-[10px] rounded-lg transition-colors flex items-center gap-1"
                          >
                            <Edit className="w-3 h-3 text-emerald-600" />
                            Khung DOCX
                          </button>

                          <button
                            onClick={() => {
                              if (activeChapterIdForLesson === ch.id) {
                                setActiveChapterIdForLesson(null);
                              } else {
                                setActiveChapterIdForLesson(ch.id);
                              }
                            }}
                            className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold text-[10px] rounded-lg transition-colors"
                          >
                            + Thêm bài rèn luyện
                          </button>
                        </div>
                      </div>

                      {/* Expandable Manual Lesson Creator box inside individual chapter containing docx box */}
                      {activeChapterIdForLesson === ch.id && (
                        <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3 animate-slide-down">
                          <h5 className="font-extrabold text-slate-800 text-xs uppercase text-emerald-700">Tạo bài rèn luyện & Khung chép DOCX</h5>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-bold">
                            <div className="space-y-3">
                              <div>
                                <label className="block text-slate-500 mb-1">TÊN BÀI HỌC MỚI *</label>
                                <input
                                  type="text"
                                  placeholder="Ví dụ: Bài 3: Phép nhân và phép chia căn thức..."
                                  value={newLessonTitle}
                                  onChange={(e) => setNewLessonTitle(e.target.value)}
                                  className="w-full bg-slate-50 border border-slate-220 border-slate-200 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                              </div>

                              <div>
                                <label className="block text-slate-500 mb-1">CÁC TỪ KHÓA CHỦ ĐỀ CHUẨN</label>
                                <input
                                  type="text"
                                  placeholder="Cách nhau bằng dấu phẩy..."
                                  value={newLessonTopics}
                                  onChange={(e) => setNewLessonTopics(e.target.value)}
                                  className="w-full bg-slate-50 border border-slate-220 border-slate-200 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                              </div>

                              <button
                                onClick={() => handleAddNewLessonDirect(ch.id)}
                                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs uppercase rounded-lg shadow-inner flex items-center justify-center gap-1.5"
                              >
                                <Save className="w-3.5 h-3.5" />
                                HOÀN TẤT & LƯU BÀI HỌC
                              </button>
                            </div>

                            <div>
                              <label className="block text-slate-500 mb-1">KHUNG CHÉP VĂN BẢN DOCX BÀI GIẢNG / BÀI TẬP</label>
                              <textarea
                                rows={6}
                                placeholder="Dán nội dung lý thuyết chi tiết, phương án giải, các lưu ý copy từ Word/DOCX của bài này tại đây..."
                                value={newLessonDocx}
                                onChange={(e) => setNewLessonDocx(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-emerald-500 text-xs font-semibold leading-relaxed"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Display Lessons list */}
                      <div className="pl-4 md:pl-6 border-l-2 border-emerald-500/20 space-y-2">
                        {ch.lessons?.map((le) => {
                          const hasLeDocx = !!le.docxText?.trim();
                          return (
                            <div
                              key={le.id}
                              className="bg-white p-3 rounded-xl border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs leading-relaxed transition-all hover:shadow-xs group"
                            >
                              <div>
                                <span className="font-extrabold text-slate-755 text-slate-800 block text-xs">
                                  {le.title}
                                </span>
                                <div className="flex flex-wrap items-center gap-2 mt-1">
                                  <span className="text-[10px] text-slate-400 font-medium bg-slate-100 px-1.5 py-0.5 rounded">
                                    Từ khóa: {le.topics.join(', ')}
                                  </span>
                                  {hasLeDocx ? (
                                    <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.2 rounded-full border border-emerald-100 block">
                                      Có khung văn bản DOCX
                                    </span>
                                  ) : (
                                    <span className="text-[10px] font-medium text-slate-400 italic">DOCX rỗng</span>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-2 text-[10px]">
                                <button
                                  onClick={() => setEditingDocxTarget({
                                    type: 'lesson',
                                    chapterId: ch.id,
                                    lessonId: le.id,
                                    title: le.title,
                                    currentText: le.docxText || ''
                                  })}
                                  className="px-2 py-1 bg-slate-50 hover:bg-slate-100 active:bg-slate-200 border text-slate-600 font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                                  title="Biên dịch dán dữ liệu DOCX"
                                >
                                  <Edit className="w-3 h-3 text-emerald-600" />
                                  Dán DOCX
                                </button>
                                
                                <button
                                  onClick={() => onDeleteLesson(activeSy.id, ch.id, le.id)}
                                  className="text-red-400 hover:text-red-600 font-extrabold px-1.5 py-1 text-sm bg-red-50/20 rounded transition-colors"
                                  title="Gỡ bài này"
                                >
                                  &times;
                                </button>
                              </div>
                            </div>
                          );
                        })}

                        {(!ch.lessons || ch.lessons.length === 0) && (
                          <p className="text-[11px] text-slate-400 italic py-1">Chương này chưa được rải bài rèn luyện tập trung.</p>
                        )}
                      </div>
                    </div>
                  );
                })}

                {activeSy.chapters.length === 0 && (
                  <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400 space-y-2">
                    <FileSearch className="w-10 h-10 text-slate-300 mx-auto" />
                    <p className="text-sm font-semibold">Chưa thiết lập chương và bài học cho môn học này.</p>
                    <p className="text-xs">Dán văn bản cấu trúc DOCX ở cột trái hoặc bấm "Thêm Chương mới" ở góc phải để bắt đầu kiến tạo.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Fallback layout if no syllabus configured */}
          {syllabus.length === 0 && (
            <div className="text-center py-16 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400 space-y-4">
              <BookOpen className="w-12 h-12 text-slate-300 mx-auto animate-bounce" />
              <h3 className="text-base font-extrabold text-slate-700">Chưa ghi nhận chương trình môn rèn luyện nào</h3>
              <p className="text-xs max-w-sm mx-auto leading-relaxed">
                Hãy click nút "Tạo môn & lớp" ở phía cột bên trái để khởi nguồn chương trình đào tạo mẫu hoặc sử dụng trí tuệ AI hỗ trợ.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* DETAILED INTERACTIVE SPLIT DOCX TEXT EDITOR MODAL */}
      {editingDocxTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full flex flex-col overflow-hidden max-h-[85vh] text-slate-800">
            
            {/* Modal header */}
            <header className="bg-[#0f172a] text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-600 rounded-lg">
                  <FileText className="w-4 h-4 text-white" />
                </div>
                <div>
                  <span className="text-[9px] uppercase font-bold text-emerald-400 block tracking-widest">
                    KHUNG CHỨA VĂN BẢN DOCX CHUYÊN BIỆT
                  </span>
                  <h3 className="text-sm font-bold text-slate-200 line-clamp-1">
                    {editingDocxTarget.title}
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setEditingDocxTarget(null)}
                className="text-slate-400 hover:text-white font-extrabold text-lg"
              >
                &times;
              </button>
            </header>

            {/* Modal action container */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              <label className="block text-xs font-bold text-slate-500 uppercase">
                VĂN BẢN PHÁC THẢO BÀI GIẢNG / GIÁO ÁN CHI TIẾT (COPY TỪ FILE WORD / DOCX):
              </label>
              <p className="text-[11px] text-slate-400 leading-relaxed font-semibold">
                Khi dán văn bản thô từ Docx của bạn vào đây, dữ liệu sẽ được lưu trữ cục bộ bảo mật, làm căn cứ vững chắc để giáo viên theo dõi và biên soạn đề kiểm tra sau này.
              </p>

              <div>
                <textarea
                  rows={14}
                  value={editingDocxTarget.currentText}
                  onChange={(e) => setEditingDocxTarget({
                    ...editingDocxTarget,
                    currentText: e.target.value
                  })}
                  placeholder="Dán toàn bộ tài liệu giảng dạy, bài giải mẫu, lý thuyết chi tiết từ file Word / DOCX của bài này tại đây..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs font-semibold leading-relaxed focus:ring-2 focus:ring-emerald-500 outline-none text-slate-700 min-h-[300px]"
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-zinc-400 font-bold">
                <span>Dung lượng dữ liệu dán: {editingDocxTarget.currentText.length} ký tự</span>
                <span className="text-emerald-600">Được tối ưu chuẩn hóa tự động</span>
              </div>
            </div>

            {/* Modal footer action */}
            <footer className="bg-slate-50 px-6 py-4 border-t flex justify-end gap-3 text-xs font-bold uppercase tracking-wider">
              <button
                onClick={() => setEditingDocxTarget(null)}
                className="px-4 py-2.5 text-slate-500 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
              >
                HỦY BỎ
              </button>
              <button
                onClick={handleSaveDocxEdit}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm cursor-pointer transition-colors flex items-center gap-1.5"
              >
                <Save className="w-4 h-4" />
                LƯU KHUNG VĂN BẢN
              </button>
            </footer>

          </div>
        </div>
      )}

    </div>
  );
}
