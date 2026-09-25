/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import React, { useState, useRef } from 'react';
import { Question, QuestionType, QuestionLevel, Syllabus } from '../types';
import { DEFAULT_QUESTIONS } from '../data';
import MathText from './MathText';
import { 
  Plus, Search, Trash, BookOpen, Layers, CheckSquare, Sparkles, 
  Copy, Check, FileText, Upload, AlertCircle, Info, RefreshCw, FileCheck,
  FolderOpen, ChevronRight, ChevronDown, Library, ArrowRight
} from 'lucide-react';

interface QuestionBankProps {
  questions: Question[];
  syllabus?: Syllabus[];
  onAddQuestion: (q: Omit<Question, 'id' | 'source' | 'status'> | Omit<Question, 'id' | 'source' | 'status'>[]) => void;
  onDeleteQuestion: (idOrIds: string | string[]) => void;
  onUpdateQuestion?: (id: string, updatedFields: Partial<Question>) => void;
  showToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
}

interface ParsedBatchQuestion {
  grade: string;
  subject: string;
  book: string;
  chapterId: string;
  lessonId: string;
  topic: string;
  type: QuestionType;
  content: string;
  options: string[];
  answer: string;
  explain: string;
  level: QuestionLevel;
  requiredOutcome?: string;
}

export default function QuestionBank({ questions, syllabus = [], onAddQuestion, onDeleteQuestion, onUpdateQuestion, showToast }: QuestionBankProps) {
  // Creator tab: 'manual' or 'import'
  const [activeCreatorTab, setActiveCreatorTab] = useState<'manual' | 'import'>('manual');

  // Manual input form state
  const [sub, setSub] = useState('Toán');
  const [grade, setGrade] = useState('6');
  const [type, setType] = useState<QuestionType>('MCQ');
  const [level, setLevel] = useState<QuestionLevel>('Nhận biết');
  const [content, setContent] = useState('');
  const [explain, setExplain] = useState('');
  const [requiredOutcome, setRequiredOutcome] = useState('');

  // MCQ Options
  const [opt0, setOpt0] = useState('');
  const [opt1, setOpt1] = useState('');
  const [opt2, setOpt2] = useState('');
  const [opt3, setOpt3] = useState('');
  const [mcqAns, setMcqAns] = useState('0');

  // YESNO Options
  const [ynOpt0, setYnOpt0] = useState('');
  const [ynOpt1, setYnOpt1] = useState('');
  const [ynOpt2, setYnOpt2] = useState('');
  const [ynOpt3, setYnOpt3] = useState('');
  const [ynAns0, setYnAns0] = useState('true');
  const [ynAns1, setYnAns1] = useState('true');
  const [ynAns2, setYnAns2] = useState('false');
  const [ynAns3, setYnAns3] = useState('false');

  // SHORT Options
  const [shortAns, setShortAns] = useState('');

  // Bulk Import state
  const [dragActive, setDragActive] = useState(false);
  const [importedQuestions, setImportedQuestions] = useState<ParsedBatchQuestion[]>([]);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [selectedImportIndices, setSelectedImportIndices] = useState<number[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Target class, subject, chapter, lesson, level for Import Session
  const [importAssignGrade, setImportAssignGrade] = useState<string>('AUTO');
  const [importAssignSub, setImportAssignSub] = useState<string>('AUTO');
  const [importAssignChapterID, setImportAssignChapterID] = useState<string>('AUTO');
  const [importAssignLessonID, setImportAssignLessonID] = useState<string>('AUTO');
  const [importSelectedLevels, setImportSelectedLevels] = useState<QuestionLevel[]>(['Nhận biết', 'Thông hiểu', 'Vận dụng', 'Vận dụng cao']);

  // Active guide sample tab ('MCQ' | 'YESNO' | 'SHORT' | 'ESSAY')
  const [guideTab, setGuideTab] = useState<QuestionType>('MCQ');
  const [copiedText, setCopiedText] = useState(false);

  // Filters State
  const [filterSub, setFilterSub] = useState('ALL');
  const [filterGrade, setFilterGrade] = useState('ALL');
  const [filterType, setFilterType] = useState('ALL');
  const [filterChapterId, setFilterChapterId] = useState('ALL');
  const [filterLessonId, setFilterLessonId] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Manual Creation States for Chapter & Lesson
  const [manualChapterId, setManualChapterId] = useState('AUTO');
  const [manualLessonId, setManualLessonId] = useState('AUTO');

  // Explorer Matrix View States (Xem kho câu hỏi)
  const [isExplorerOpen, setIsExplorerOpen] = useState(false);
  const [explorerSub, setExplorerSub] = useState('Toán');
  const [explorerGrade, setExplorerGrade] = useState('9');
  const [explorerExpandedChapters, setExplorerExpandedChapters] = useState<string[]>([]);
  const [explorerMoveTargetChapter, setExplorerMoveTargetChapter] = useState<string>('');
  const [explorerMoveTargetLesson, setExplorerMoveTargetLesson] = useState<string>('');
  const [explorerSelectedQuestionIds, setExplorerSelectedQuestionIds] = useState<string[]>([]);
  const [selectedNode, setSelectedNode] = useState<{ chapterId: string; lessonId: string } | null>(null);

  // Derived state for Explorer Matrix View
  const activeSyl = syllabus.find(sy => sy.grade === explorerGrade && sy.subject === explorerSub);
  
  // Find general questions for selected grade and subject
  const unassignedQs = questions.filter(q => 
    q.subject === explorerSub && 
    q.grade === explorerGrade && 
    (!q.chapterId || q.chapterId === 'ch-general' || q.chapterId === 'temp')
  );

  // Compute counts
  const syllabusStructure = activeSyl ? activeSyl.chapters.map(ch => {
    const chQsCount = questions.filter(q => q.subject === explorerSub && q.grade === explorerGrade && q.chapterId === ch.id).length;
    const lessonsStructure = ch.lessons.map(le => {
      const count = questions.filter(q => q.subject === explorerSub && q.grade === explorerGrade && q.chapterId === ch.id && q.lessonId === le.id).length;
      return { ...le, count };
    });
    const generalChCount = questions.filter(q => q.subject === explorerSub && q.grade === explorerGrade && q.chapterId === ch.id && (!q.lessonId || q.lessonId === 'le-general' || q.lessonId === 'temp')).length;
    return { ...ch, chQsCount, lessonsStructure, generalChCount };
  }) : [];

  // Currently viewed list of questions inside the explorer column
  let activeExplorerQs: Question[] = [];
  let viewTitle = '';
  if (selectedNode) {
    if (selectedNode.chapterId === 'ch-unassigned') {
      activeExplorerQs = unassignedQs;
      viewTitle = 'Chưa phân phối vào Chương/Bài';
    } else if (selectedNode.lessonId === 'le-general') {
      activeExplorerQs = questions.filter(q => 
        q.subject === explorerSub && 
        q.grade === explorerGrade && 
        q.chapterId === selectedNode.chapterId && 
        (!q.lessonId || q.lessonId === 'le-general' || q.lessonId === 'temp')
      );
      const chName = syllabusStructure.find(c => c.id === selectedNode.chapterId)?.title || 'Chương';
      viewTitle = `${chName} (Chuyên đề chung)`;
    } else {
      activeExplorerQs = questions.filter(q => 
        q.subject === explorerSub && 
        q.grade === explorerGrade && 
        q.chapterId === selectedNode.chapterId && 
        q.lessonId === selectedNode.lessonId
      );
      const chObj = syllabusStructure.find(c => c.id === selectedNode.chapterId);
      const leName = chObj?.lessonsStructure.find(l => l.id === selectedNode.lessonId)?.title || 'Bài học';
      viewTitle = leName;
    }
  } else {
    // Default selection fallback
    if (unassignedQs.length > 0) {
      activeExplorerQs = unassignedQs;
      viewTitle = 'Chưa phân phối vào Chương/Bài';
    } else if (syllabusStructure.length > 0) {
      const firstCh = syllabusStructure[0];
      const firstLe = firstCh.lessonsStructure[0];
      if (firstLe) {
        activeExplorerQs = questions.filter(q => 
          q.subject === explorerSub && 
          q.grade === explorerGrade && 
          q.chapterId === firstCh.id && 
          q.lessonId === firstLe.id
        );
        viewTitle = firstLe.title;
      } else {
        activeExplorerQs = unassignedQs;
        viewTitle = 'Không có bài học';
      }
    } else {
      activeExplorerQs = unassignedQs;
      viewTitle = 'Chưa phân phối vào Chương/Bài';
    }
  }

  // -----------------------------------------------------------------
  // SYNTAX GUIDE TEMPLATES FOR ALL 4 TYPES
  // -----------------------------------------------------------------
  const FORMAT_TEMPLATES: Record<QuestionType, { desc: string; text: string; exampleObj: any }> = {
    MCQ: {
      desc: 'Câu hỏi trắc nghiệm khách quan với 4 phương án lựa chọn A, B, C, D độc lập. Chỉ có duy nhất một phương án đúng nhất.',
      text: `Môn: Toán
Lớp: 6
Chương: Chương I. Tập hợp các số tự nhiên
Bài: Lũy thừa với số mũ tự nhiên
Yêu cầu cần đạt: Nhận biết được lũy thừa với số mũ tự nhiên; tính được giá trị của lũy thừa đơn giản.
Mức độ nhận thức: Nhận biết
Dạng: MCQ
Câu: Tính giá trị của biểu thức lũy thừa sau: $A = 2^3 \\cdot 5$.
A. $A = 30$
B. $A = 40$
C. $A = 20$
D. $A = 45$
Đáp án: B
Lời giải: Ta có $2^3 = 8$. Do đó $A = 8 \\cdot 5 = 40$ ứng với đáp án B.`,
      exampleObj: {
        sub: 'Toán',
        grade: '6',
        type: 'MCQ',
        level: 'Nhận biết',
        requiredOutcome: 'Nhận biết được lũy thừa với số mũ tự nhiên; tính được giá trị của lũy thừa đơn giản.',
        content: 'Tính giá trị của biểu thức lũy thừa sau: $A = 2^3 \\cdot 5$.',
        opt0: '$A = 30$',
        opt1: '$A = 40$',
        opt2: '$A = 20$',
        opt3: '$A = 45$',
        mcqAns: '1',
        explain: 'Ta có $2^3 = 8$. Do đó $A = 8 \\cdot 5 = 40$ ứng với đáp án B.',
      },
    },
    YESNO: {
      desc: 'Câu hỏi Đúng / Sai gồm 4 mệnh đề a, b, c, d liên quan đến cấu trúc chủ đề. Quy tắc chấm điểm lũy tiến khách quan bộ GD&ĐT thiết kế.',
      text: `Môn: Toán
Lớp: 6
Chương: Chương IV. Một số hình phẳng trong thực tiễn
Bài: Tam giác đều, hình vuông, lục giác đều
Yêu cầu cần đạt: Nhận biết được một số yếu tố cơ bản của lục giác đều; xác định được đường chéo chính, tâm và các tam giác đều tạo thành trong lục giác đều.
Mức độ nhận thức: Thông hiểu
Dạng: TF
Câu: Cho hình lục giác đều $ABCDEF$ tâm $O$. Hãy xác định tính Đúng/Sai của các khẳng định sau đây:
a) Có đúng ba đường chéo chính đi qua tâm $O$ của lục giác.
b) Sáu tam giác nhỏ được chia bởi ba đường chéo chính là tam giác đều.
c) Độ dài của mỗi đường chéo chính bằng một nửa độ dài cạnh của lục giác đều.
d) Số đường chéo chính lớn gấp đôi số cạnh của lục giác đều.
Đáp án: Đúng,Đúng,Sai,Sai
Lời giải: Các đường chéo chính $AD$, $BE$, $CF$ cắt nhau tại $O$ và tạo thành 6 tam giác đều. Mỗi đường chéo chính dài gấp 2 lần độ dài cạnh. Số đường chéo chính là 3, trong khi số cạnh của lục giác đều là 6.`,
      exampleObj: {
        sub: 'Toán',
        grade: '6',
        type: 'YESNO',
        level: 'Thông hiểu',
        requiredOutcome: 'Nhận biết được một số yếu tố cơ bản của lục giác đều; xác định được đường chéo chính, tâm và các tam giác đều tạo thành trong lục giác đều.',
        content: 'Cho hình lục giác đều $ABCDEF$ tâm $O$. Hãy xác định tính Đúng/Sai của các khẳng định sau đây:',
        ynOpt0: 'Có đúng ba đường chéo chính đi qua tâm $O$ của lục giác.',
        ynOpt1: 'Sáu tam giác nhỏ được chia bởi ba đường chéo chính là tam giác đều.',
        ynOpt2: 'Độ dài của mỗi đường chéo chính bằng một nửa độ dài cạnh của lục giác đều.',
        ynOpt3: 'Số đường chéo chính lớn gấp đôi số cạnh của lục giác đều.',
        ynAns0: 'true',
        ynAns1: 'true',
        ynAns2: 'false',
        ynAns3: 'false',
        explain: 'Các đường chéo chính $AD$, $BE$, $CF$ cắt nhau tại $O$ và tạo thành 6 tam giác đều. Mỗi đường chéo chính dài gấp 2 lần độ dài cạnh. Số đường chéo chính là 3, trong khi số cạnh của lục giác đều là 6.',
      },
    },
    SHORT: {
      desc: 'Câu hỏi điền kết quả ngắn, yêu cầu học sinh làm tự động và tự nhập trị số chính xác, không dùng trắc nghiệm gợi ý.',
      text: `Môn: Toán
Lớp: 6
Chương: Chương I. Tập hợp các số tự nhiên
Bài: Thứ tự thực hiện các phép tính
Yêu cầu cần đạt: Thực hiện đúng thứ tự các phép tính trong biểu thức có chứa lũy thừa, phép nhân, phép chia, phép trừ.
Mức độ nhận thức: Vận dụng
Dạng: SHORT
Câu: Cho biểu thức số học sau: $B = 5 \\cdot 4^2 - 18 : 3^2$. Tính giá trị của biểu thức $B$.
Đáp án: 78
Lời giải: Theo quy tắc thứ tự thực hiện phép tính, ta tính lũy thừa trước: $B = 5 \\cdot 16 - 18 : 9 = 80 - 2 = 78$.`,
      exampleObj: {
        sub: 'Toán',
        grade: '6',
        type: 'SHORT',
        level: 'Vận dụng',
        requiredOutcome: 'Thực hiện đúng thứ tự các phép tính trong biểu thức có chứa lũy thừa, phép nhân, phép chia, phép trừ.',
        content: 'Cho biểu thức số học sau: $B = 5 \\cdot 4^2 - 18 : 3^2$. Tính giá trị của biểu thức $B$.',
        shortAns: '78',
        explain: 'Theo quy tắc thứ tự thực hiện phép tính, ta tính lũy thừa trước: $B = 5 \\cdot 16 - 18 : 9 = 80 - 2 = 78$.',
      },
    },
    ESSAY: {
      desc: 'Câu tự luận lập luận logic trình bày tự do, giáo viên chấm điểm thủ công chi tiết dựa trên các mốc hướng dẫn giải.',
      text: `Môn: Toán
Lớp: 6
Chương: Chương I. Số tự nhiên
Bài: Ước và bội
Yêu cầu cần đạt: Vận dụng được kiến thức về bội chung và bội chung nhỏ nhất để giải quyết bài toán thực tiễn đơn giản.
Mức độ nhận thức: Vận dụng cao
Dạng: ESSAY
Câu: Một trường THCS tổ chức cho khoảng từ 300 đến 400 học sinh đi dã ngoại bằng xe ô tô. Nếu xếp 30 người hay 45 người lên một xe thì đều vừa đủ. Hỏi trường đó có chính xác bao nhiêu học sinh đi dã ngoại? Hãy viết lời giải tự luận chi tiết.
Đáp án: 360 học sinh
Lời giải: Gọi số học sinh đi dã ngoại là $x$ học sinh, với $x \\in \\mathbb{N}$ và $300 \\le x \\le 400$.
Vì xếp 30 người hay 45 người lên một xe đều vừa đủ nên $x$ chia hết cho 30 và $x$ chia hết cho 45. Do đó, $x$ là bội chung của 30 và 45.
Ta tìm $BCNN(30, 45)$:
$30 = 2 \\cdot 3 \\cdot 5$
$45 = 3^2 \\cdot 5$
Suy ra $BCNN(30, 45) = 2 \\cdot 3^2 \\cdot 5 = 90$.
Các bội chung của 30 và 45 là bội của 90: $BC(30, 45) = \\{0; 90; 180; 270; 360; 450; ...\\}$.
Vì $300 \\le x \\le 400$ nên $x = 360$.
Vậy số học sinh đi dã ngoại là 360 học sinh.`,
      exampleObj: {
        sub: 'Toán',
        grade: '6',
        type: 'ESSAY',
        level: 'Vận dụng cao',
        requiredOutcome: 'Vận dụng được kiến thức về bội chung và bội chung nhỏ nhất để giải quyết bài toán thực tiễn đơn giản.',
        content: 'Một trường THCS tổ chức cho khoảng từ 300 đến 400 học sinh đi dã ngoại bằng xe ô tô. Nếu xếp 30 người hay 45 người lên một xe thì đều vừa đủ. Hỏi trường đó có chính xác bao nhiêu học sinh đi dã ngoại? Hãy viết lời giải tự luận chi tiết.',
        shortAns: '360 học sinh',
        explain: `Gọi số học sinh đi dã ngoại là $x$ học sinh, với $x \\in \\mathbb{N}$ và $300 \\le x \\le 400$.
Vì xếp 30 người hay 45 người lên một xe đều vừa đủ nên $x$ chia hết cho 30 và $x$ chia hết cho 45. Do đó, $x$ là bội chung của 30 và 45.
Ta tìm $BCNN(30, 45)$:
$30 = 2 \\cdot 3 \\cdot 5$
$45 = 3^2 \\cdot 5$
Suy ra $BCNN(30, 45) = 2 \\cdot 3^2 \\cdot 5 = 90$.
Các bội chung của 30 và 45 là bội của 90: $BC(30, 45) = \\{0; 90; 180; 270; 360; 450; ...\\}$.
Vì $300 \\le x \\le 400$ nên $x = 360$.
Vậy số học sinh đi dã ngoại là 360 học sinh.`,
      },
    },
  };

  const handleCopyTemplateText = () => {
    navigator.clipboard.writeText(FORMAT_TEMPLATES[guideTab].text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  const handleTrySampleInForm = (sampleObj: any) => {
    setSub(sampleObj.sub);
    setGrade(sampleObj.grade);
    setType(sampleObj.type as QuestionType);
    setLevel(sampleObj.level as QuestionLevel);
    setContent(sampleObj.content);
    setExplain(sampleObj.explain);
    setRequiredOutcome(sampleObj.requiredOutcome || '');

    if (sampleObj.type === 'MCQ') {
      setOpt0(sampleObj.opt0 || '');
      setOpt1(sampleObj.opt1 || '');
      setOpt2(sampleObj.opt2 || '');
      setOpt3(sampleObj.opt3 || '');
      setMcqAns(sampleObj.mcqAns || '0');
    } else if (sampleObj.type === 'YESNO') {
      setYnOpt0(sampleObj.ynOpt0 || '');
      setYnOpt1(sampleObj.ynOpt1 || '');
      setYnOpt2(sampleObj.ynOpt2 || '');
      setYnOpt3(sampleObj.ynOpt3 || '');
      setYnAns0(sampleObj.ynAns0 || 'true');
      setYnAns1(sampleObj.ynAns1 || 'true');
      setYnAns2(sampleObj.ynAns2 || 'false');
      setYnAns3(sampleObj.ynAns3 || 'true');
    } else {
      setShortAns(sampleObj.shortAns || '');
    }

    setActiveCreatorTab('manual');
    window.scrollTo({ top: 300, behavior: 'smooth' });
  };

  const handleDownloadTxtTemplate = () => {
    const templateText = `Môn: Toán
Lớp: 6
Chương: Chương I. Tập hợp các số tự nhiên
Bài: Lũy thừa với số mũ tự nhiên
Yêu cầu cần đạt: Nhận biết được lũy thừa với số mũ tự nhiên; tính được giá trị của lũy thừa đơn giản.
Mức độ nhận thức: Nhận biết
Dạng: MCQ
Câu: Tính giá trị của biểu thức lũy thừa sau: $A = 2^3 \\cdot 5$.
A. $A = 30$
B. $A = 40$
C. $A = 20$
D. $A = 45$
Đáp án: B
Lời giải: Ta có $2^3 = 8$. Do đó $A = 8 \\cdot 5 = 40$ ứng với đáp án B.

Môn: Toán
Lớp: 6
Chương: Chương IV. Một số hình phẳng trong thực tiễn
Bài: Tam giác đều, hình vuông, lục giác đều
Yêu cầu cần đạt: Nhận biết được một số yếu tố cơ bản của lục giác đều; xác định được đường chéo chính, tâm và các tam giác đều tạo thành trong lục giác đều.
Mức độ nhận thức: Thông hiểu
Dạng: TF
Câu: Cho hình lục giác đều $ABCDEF$ tâm $O$. Hãy xác định tính Đúng/Sai của các khẳng định sau đây:
a) Có đúng ba đường chéo chính đi qua tâm $O$ của lục giác.
b) Sáu tam giác nhỏ được chia bởi ba đường chéo chính là tam giác đều.
c) Độ dài của mỗi đường chéo chính bằng một nửa độ dài cạnh của lục giác đều.
d) Số đường chéo chính lớn gấp đôi số cạnh của lục giác đều.
Đáp án: Đúng,Đúng,Sai,Sai
Lời giải: Các đường chéo chính $AD$, $BE$, $CF$ cắt nhau tại $O$ và tạo thành 6 tam giác đều. Mỗi đường chéo chính dài gấp 2 lần độ dài cạnh. Số đường chéo chính là 3, trong khi số cạnh của lục giác đều là 6.

Môn: Toán
Lớp: 6
Chương: Chương I. Tập hợp các số tự nhiên
Bài: Thứ tự thực hiện các phép tính
Yêu cầu cần đạt: Thực hiện đúng thứ tự các phép tính trong biểu thức có chứa lũy thừa, phép nhân, phép chia, phép trừ.
Mức độ nhận thức: Vận dụng
Dạng: SHORT
Câu: Cho biểu thức số học sau: $B = 5 \\cdot 4^2 - 18 : 3^2$. Tính giá trị của biểu thức $B$.
Đáp án: 78
Lời giải: Theo quy tắc thứ tự thực hiện phép tính, ta tính lũy thừa trước: $B = 5 \\cdot 16 - 18 : 9 = 80 - 2 = 78$.

Môn: Toán
Lớp: 6
Chương: Chương I. Số tự nhiên
Bài: Ước và bội
Yêu cầu cần đạt: Vận dụng được kiến thức về bội chung và bội chung nhỏ nhất để giải quyết bài toán thực tiễn đơn giản.
Mức độ nhận thức: Vận dụng cao
Dạng: ESSAY
Câu: Một trường THCS tổ chức cho khoảng từ 300 đến 400 học sinh đi dã ngoại bằng xe ô tô. Nếu xếp 30 người hay 45 người lên một xe thì đều vừa đủ. Hỏi trường đó có chính xác bao nhiêu học sinh đi dã ngoại? Hãy viết lời giải tự luận chi tiết.
Đáp án: 360 học sinh
Lời giải: Gọi số học sinh đi dã ngoại là $x$ học sinh, với $x \\in \\mathbb{N}$ và $300 \\le x \\le 400$.
Vì xếp 30 người hay 45 người lên một xe đều vừa đủ nên $x$ chia hết cho 30 và $x$ chia hết cho 45. Do đó, $x$ là bội chung của 30 và 45.
Ta tìm $BCNN(30, 45)$:
$30 = 2 \\cdot 3 \\cdot 5$
$45 = 3^2 \\cdot 5$
Suy ra $BCNN(30, 45) = 2 \\cdot 3^2 \\cdot 5 = 90$.
Các bội chung của 30 và 45 là bội của 90: $BC(30, 45) = \\{0; 90; 180; 270; 360; 450; ...\\}$.
Vì $300 \\le x \\le 400$ nên $x = 360$.
Vậy số học sinh đi dã ngoại là 360 học sinh.
`;
    const blob = new Blob([templateText], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'Mẫu_Chuẩn_Ma_Trận_Yêu_Cầu_Cần_Đạt.txt';
    link.click();
  };

  // -----------------------------------------------------------------
  // TXT EXTRACT AUTOMATION PARSER WITH SYLLABUS RESOLUTION
  // -----------------------------------------------------------------
  const parseUploadedText = (text: string): ParsedBatchQuestion[] => {
    const cleanText = text.replace(/^\uFEFF/, '').trim();
    const parsedQuestions: ParsedBatchQuestion[] = [];

    const isStringSimilar = (str1: string, str2: string): boolean => {
      const clean = (s: string) => s.toLowerCase()
        .replace(/[^a-z0-9àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/g, ' ')
        .trim();
      const s1 = clean(str1);
      const s2 = clean(str2);
      if (!s1 || !s2) return false;
      if (s1.includes(s2) || s2.includes(s1)) return true;

      const w1 = s1.split(/\s+/).filter(w => w.length >= 2);
      const w2 = s2.split(/\s+/).filter(w => w.length >= 2);
      if (w1.length === 0 || w2.length === 0) return false;

      let matches = 0;
      w1.forEach(w => {
        if (w2.includes(w)) matches++;
      });
      const ratio = matches / Math.min(w1.length, w2.length);
      return matches >= 4 || ratio >= 0.55;
    };

    let textBlocks: string[] = [];
    const lowerText = cleanText.toLowerCase();
    
    // Count occurrences of Môn header keywords to see if metadata is repeated per question or is a single global header
    const monCount = (lowerText.match(/môn\s*[:\-]/g) || []).length;
    const monHocCount = (lowerText.match(/môn\s+học\s*[:\-]/g) || []).length;
    const hasMultipleMon = (monCount + monHocCount) >= 2;

    // Split by blocks
    if (hasMultipleMon) {
      textBlocks = cleanText.split(/(?=(?:^|[\r\n]+)\s*Môn\s*[:\-])/gi);
    } else {
      textBlocks = cleanText.split(/(?=(?:^|[\r\n]+)\s*Câu\s*\d+\s*[:\.])|(?=(?:^|[\r\n]+)\s*Câu\s*[:\.])/gi);
    }

    // Remove empty/whitespace-only blocks and non-question instructions
    textBlocks = textBlocks.map(b => b.trim()).filter(b => {
      if (b.length === 0) return false;
      const lowerB = b.toLowerCase();
      if (hasMultipleMon) {
        return lowerB.includes('môn:') || lowerB.includes('môn học:') || lowerB.includes('môn -');
      }
      return (
        lowerB.includes('câu:') || 
        lowerB.includes('câu ') || 
        lowerB.includes('cau:') || 
        lowerB.includes('cau ') ||
        lowerB.includes('câu hỏi') ||
        lowerB.includes('đáp án') ||
        lowerB.includes('dap an')
      );
    });

    // File-wide context auto-detection fallbacks
    let fileGrade: string | null = null;
    let fileSubject: string | null = null;
    let fileChapterText = '';
    let fileLessonText = '';
    let fileOutcomeText = '';

    // First, scan the first few blocks or headers to establish global grade/subject if possible
    for (let i = 0; i < Math.min(10, textBlocks.length); i++) {
      const blockLines = textBlocks[i].split('\n').map(l => l.trim());
      for (const rl of blockLines) {
        if (/^(?:Lớp|Lop|Khối|Khoi)\s*[:\.\s-]/i.test(rl)) {
          const val = rl.replace(/^(?:Lớp|Lop|Khối|Khoi)\s*[:\.\s-]?/i, '').trim();
          const numMatch = val.match(/\d+/);
          if (numMatch) {
            fileGrade = numMatch[0];
          }
        } else if (/^(?:Môn|Mon|Môn học|Mon hoc)\s*[:\.\s-]/i.test(rl)) {
          const val = rl.replace(/^(?:Môn|Mon|Môn học|Mon hoc)\s*[:\.\s-]?/i, '').trim();
          if (val.toLowerCase().includes('toán') || val.toLowerCase().includes('toan')) fileSubject = 'Toán';
          else if (val.toLowerCase().includes('tin') || val.toLowerCase().includes('tin học')) fileSubject = 'Tin học';
          else if (val.toLowerCase().includes('vật lý') || val.toLowerCase().includes('ly')) fileSubject = 'Vật lý';
        }
      }
    }

    for (let idx = 0; idx < textBlocks.length; idx++) {
      const block = textBlocks[idx];
      const lines = block.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
      if (lines.length === 0) continue;

      const contentLines: string[] = [];
      const options: string[] = [];
      let answer = '';
      let explain = '';
      let level: QuestionLevel = 'Thông hiểu';
      let type: QuestionType = 'MCQ';
      let blockChapterName = '';
      let blockLessonName = '';
      let blockSubject = '';
      let blockGrade = '';
      let blockOutcomeText = '';

      for (let c = 0; c < lines.length; c++) {
        const line = lines[c];

        // Match metadata markers
        const isChapterLine = /^(?:Chương|Chuong)\s*[:\.\s-]/i.test(line);
        const isLessonLine = /^(?:Bài|Bai)\s*[:\.\s-]/i.test(line);
        const isGradeLine = /^(?:Lớp|Lop|Khối|Khoi)\s*[:\.\s-]/i.test(line);
        const isSubjectLine = /^(?:Môn|Mon|Môn học|Mon hoc)\s*[:\.\s-]/i.test(line);
        const isOutcomeLine = /^(?:Yêu cầu cần đạt|Yeu cau can dat|Yêu cầu|Yeu cau|Yccđ|Yccd)\s*[:\.\s-]/i.test(line);
        const isLevelLine = /^(?:Mức độ nhận thức|Muc do nhan thuc|Mức độ|Muc do|Level)\s*[:\.\s-]/i.test(line);
        const isTypeLine = /^(?:Dạng|Dang|Type)\s*[:\.\s-]/i.test(line);
        const isOption = /^[A-Da-d]\s*[:\.\/\)-]/i.test(line);
        const isAnswerLine = /^(?:Đáp án|Dap an|Key)\s*[:\.\s-]/i.test(line);
        const isExplainLine = /^(?:Lời giải|Loi giai|Giải thích|Giai thich|Hướng dẫn giải)\s*[:\.\s-]/i.test(line);
        const isQuestion = /^(?:Câu|Cau|Đề bài|Câu hỏi|De)\s*[:\.\/\)-]/i.test(line);

        if (isChapterLine) {
          const value = line.replace(/^(?:Chương|Chuong)\s*[:\.\s-]?/i, '').trim();
          blockChapterName = value;
          fileChapterText = value || fileChapterText;
        } else if (isLessonLine) {
          const value = line.replace(/^(?:Bài|Bai)\s*[:\.\s-]?/i, '').trim();
          blockLessonName = value;
          fileLessonText = value || fileLessonText;
        } else if (isGradeLine) {
          const val = line.replace(/^(?:Lớp|Lop|Khối|Khoi)\s*[:\.\s-]?/i, '').trim();
          const numMatch = val.match(/\d+/);
          if (numMatch) {
            blockGrade = numMatch[0];
            fileGrade = blockGrade || fileGrade;
          }
        } else if (isSubjectLine) {
          const val = line.replace(/^(?:Môn|Mon|Môn học|Mon hoc)\s*[:\.\s-]?/i, '').trim();
          if (val.toLowerCase().includes('toán') || val.toLowerCase().includes('toan')) blockSubject = 'Toán';
          else if (val.toLowerCase().includes('tin') || val.toLowerCase().includes('tin học')) blockSubject = 'Tin học';
          else if (val.toLowerCase().includes('vật lý') || val.toLowerCase().includes('ly')) blockSubject = 'Vật lý';
          fileSubject = blockSubject || fileSubject;
        } else if (isOutcomeLine) {
          const value = line.replace(/^(?:Yêu cầu cần đạt|Yeu cau can dat|Yêu cầu|Yeu cau|Yccđ|Yccd)\s*[:\.\s-]?/i, '').trim();
          blockOutcomeText = value;
          fileOutcomeText = value || fileOutcomeText;
        } else if (isLevelLine) {
          const value = line.replace(/^(?:Mức độ nhận thức|Muc do nhan thuc|Mức độ|Muc do|Level)\s*[:\.\s-]?/i, '').trim();
          if (value.includes('Nhận biết') || value.includes('Nhan biet')) level = 'Nhận biết';
          else if (value.includes('Thông hiểu') || value.includes('Thong hieu')) level = 'Thông hiểu';
          else if (value.includes('Vận dụng cao') || value.includes('Van dung cao')) level = 'Vận dụng cao';
          else if (value.includes('Vận dụng') || value.includes('Van dung')) level = 'Vận dụng';
        } else if (isTypeLine) {
          const value = line.replace(/^(?:Dạng|Dang|Type)\s*[:\.\s-]?/i, '').trim().toUpperCase();
          if (value.includes('MCQ')) {
            type = 'MCQ';
          } else if (value.includes('TF') || value.includes('ĐÚNG') || value.includes('YESNO') || value.includes('ĐÚNG/SAI')) {
            type = 'YESNO';
          } else if (value.includes('SHORT') || value.includes('NGẮN')) {
            type = 'SHORT';
          } else if (value.includes('ESSAY') || value.includes('TỰ LUẬN')) {
            type = 'ESSAY';
          }
        } else if (isOption && (type === 'MCQ' || type === 'YESNO')) {
          const optionVal = line.replace(/^[A-Da-d]\s*[:\.\/\)-]?/i, '').trim();
          options.push(optionVal);
        } else if (isAnswerLine) {
          const value = line.replace(/^(?:Đáp án|Dap an|Key)\s*[:\.\s-]?/i, '').trim();
          answer = value;
        } else if (isExplainLine) {
          explain = line.replace(/^(?:Lời giải|Loi giai|Giải thích|Giai thich|Hướng dẫn giải)\s*[:\.\s-]?/i, '').trim();
          for (let next = c + 1; next < lines.length; next++) {
            const nextLine = lines[next].trim();
            if (!nextLine) continue;

            const isCh = /^(?:Chương|Chuong)\s*[:\.\s-]/i.test(nextLine);
            const isLe = /^(?:Bài|Bai)\s*[:\.\s-]/i.test(nextLine);
            const isGr = /^(?:Lớp|Lop|Khối|Khoi)\s*[:\.\s-]/i.test(nextLine);
            const isSu = /^(?:Môn|Mon|Môn học|Mon hoc)\s*[:\.\s-]/i.test(nextLine);
            const isOu = /^(?:Yêu cầu cần đạt|Yeu cau can dat|Yêu cầu|Yeu cau|Yccđ|Yccd)\s*[:\.\s-]/i.test(nextLine);
            const isLv = /^(?:Mức độ nhận thức|Muc do nhan thuc|Mức độ|Muc do|Level)\s*[:\.\s-]/i.test(nextLine);
            const isTy = /^(?:Dạng|Dang|Type)\s*[:\.\s-]/i.test(nextLine);
            const isAns = /^(?:Đáp án|Dap an|Key)\s*[:\.\s-]/i.test(nextLine);

            if (isCh) {
              blockChapterName = nextLine.replace(/^(?:Chương|Chuong)\s*[:\.\s-]?/i, '').trim();
            } else if (isLe) {
              blockLessonName = nextLine.replace(/^(?:Bài|Bai)\s*[:\.\s-]?/i, '').trim();
            } else if (isGr) {
              const val = nextLine.replace(/^(?:Lớp|Lop|Khối|Khoi)\s*[:\.\s-]?/i, '').trim();
              const numMatch = val.match(/\d+/);
              if (numMatch) {
                blockGrade = numMatch[0];
                fileGrade = blockGrade || fileGrade;
              }
            } else if (isSu) {
              const val = nextLine.replace(/^(?:Môn|Mon|Môn học|Mon hoc)\s*[:\.\s-]?/i, '').trim();
              if (val.toLowerCase().includes('toán') || val.toLowerCase().includes('toan')) blockSubject = 'Toán';
              else if (val.toLowerCase().includes('tin') || val.toLowerCase().includes('tin học')) blockSubject = 'Tin học';
              else if (val.toLowerCase().includes('vật lý') || val.toLowerCase().includes('ly')) blockSubject = 'Vật lý';
              fileSubject = blockSubject || fileSubject;
            } else if (isOu) {
              blockOutcomeText = nextLine.replace(/^(?:Yêu cầu cần đạt|Yeu cau can dat|Yêu cầu|Yeu cau|Yccđ|Yccd)\s*[:\.\s-]?/i, '').trim();
            } else if (isLv) {
              const value = nextLine.replace(/^(?:Mức độ nhận thức|Muc do nhan thuc|Mức độ|Muc do|Level)\s*[:\.\s-]?/i, '').trim();
              if (value.includes('Nhận biết') || value.includes('Nhan biet')) level = 'Nhận biết';
              else if (value.includes('Thông hiểu') || value.includes('Thong hieu')) level = 'Thông hiểu';
              else if (value.includes('Vận dụng cao') || value.includes('Van dung cao')) level = 'Vận dụng cao';
              else if (value.includes('Vận dụng') || value.includes('Van dung')) level = 'Vận dụng';
            } else if (isTy) {
              const value = nextLine.replace(/^(?:Dạng|Dang|Type)\s*[:\.\s-]?/i, '').trim().toUpperCase();
              if (value.includes('MCQ')) {
                type = 'MCQ';
              } else if (value.includes('TF') || value.includes('ĐÚNG') || value.includes('YESNO') || value.includes('ĐÚNG/SAI')) {
                type = 'YESNO';
              } else if (value.includes('SHORT') || value.includes('NGẮN')) {
                type = 'SHORT';
              } else if (value.includes('ESSAY') || value.includes('TỰ LUẬN')) {
                type = 'ESSAY';
              }
            } else if (isAns) {
              answer = nextLine.replace(/^(?:Đáp án|Dap an|Key)\s*[:\.\s-]?/i, '').trim();
            } else {
              explain += '\n' + nextLine;
            }
          }
          break;
        } else if (isQuestion) {
          const value = line.replace(/^(?:Câu|Cau|Đề bài|Câu hỏi|De)\s*[:\.\/\)-]?/i, '').trim();
          contentLines.push(value);
        } else {
          contentLines.push(line);
        }
      }

      const cleanContent = contentLines.join('\n').trim();
      if (!cleanContent) continue;

      // Automatically deduce type if defaulted to MCQ but has no options (A, B, C, D)
      if (type === 'MCQ' && options.length === 0) {
        const lowerC = cleanContent.toLowerCase();
        const isEssayMatch = 
          lowerC.includes('giải thích') || 
          lowerC.includes('nêu') || 
          lowerC.includes('vì sao') || 
          lowerC.includes('chứng minh') || 
          lowerC.includes('trình bày') || 
          lowerC.includes('định nghĩa') || 
          lowerC.includes('viết ba nghiệm') || 
          lowerC.includes('nghiệm tổng quát') ||
          answer.length > 8;

        if (isEssayMatch) {
          type = 'ESSAY';
        } else {
          type = 'SHORT';
        }
      }

      // Normalize MCQ Answer Letters
      if (type === 'MCQ') {
        const cleanAns = answer.trim().toUpperCase();
        if (['A', 'B', 'C', 'D'].includes(cleanAns)) {
          answer = String(['A', 'B', 'C', 'D'].indexOf(cleanAns));
        } else if (['0', '1', '2', '3'].includes(cleanAns)) {
          answer = cleanAns;
        } else {
          answer = '0';
        }
      } 
      // Normalize YESNO Correct Answer list
      else if (type === 'YESNO') {
        const items = answer.split(/[\s,;\/\+\|]+/).map(item => {
          const lower = item.trim().toLowerCase();
          return (lower === 'đúng' || lower === 'dung' || lower === 'true' || lower === 't') ? 'true' : 'false';
        });
        while (items.length < 4) items.push('false');
        answer = items.slice(0, 4).join(',');
      }

      const resolvedGrade = blockGrade || fileGrade || grade || '6';
      const resolvedSubject = blockSubject || fileSubject || sub || 'Toán';
      
      let resolvedChapterId = 'ch-general';
      let resolvedLessonId = 'le-general';

      const activeSyl = syllabus.find(
        (sy) => sy.grade === resolvedGrade && sy.subject.toLowerCase() === resolvedSubject.toLowerCase()
      );

      if (activeSyl && activeSyl.chapters.length > 0) {
        resolvedChapterId = activeSyl.chapters[0].id;
        if (activeSyl.chapters[0].lessons && activeSyl.chapters[0].lessons.length > 0) {
          resolvedLessonId = activeSyl.chapters[0].lessons[0].id;
        }
      }

      const targetChapterText = blockChapterName || fileChapterText;
      const targetLessonText = blockLessonName || fileLessonText;

      if (activeSyl) {
        if (targetChapterText) {
          const cleanCh = targetChapterText.toLowerCase().trim();
          const chNumMatch = cleanCh.match(/(?:chương|chuong)\s+([0-9a-zivx]+)/);
          const chNum = chNumMatch ? chNumMatch[1].trim() : '';

          let matchedCh = activeSyl.chapters.find(ch => {
            const chTitleLower = ch.title.toLowerCase();
            if (chNum) {
              const titleNumMatch = chTitleLower.match(/(?:chương|chuong)\s+([0-9a-zivx]+)/);
              if (titleNumMatch && titleNumMatch[1] === chNum) return true;
            }
            return chTitleLower.includes(cleanCh) || cleanCh.includes(chTitleLower) || isStringSimilar(ch.title, targetChapterText);
          });

          if (!matchedCh && chNum) {
            const romanMap: { [key: string]: string } = {
              '1': 'i', '2': 'ii', '3': 'iii', '4': 'iv', '5': 'v', '6': 'vi',
              'i': '1', 'ii': '2', 'iii': '3', 'iv': '4', 'v': '5', 'vi': '6'
            };
            const altNum = romanMap[chNum];
            if (altNum) {
              matchedCh = activeSyl.chapters.find(ch => {
                const titleNumMatch = ch.title.toLowerCase().match(/(?:chương|chuong)\s+([0-9a-zivx]+)/);
                return (titleNumMatch && titleNumMatch[1] === altNum) || isStringSimilar(ch.title, targetChapterText);
              });
            }
          }

          if (matchedCh) {
            resolvedChapterId = matchedCh.id;

            if (targetLessonText) {
              const cleanLe = targetLessonText.toLowerCase().trim();
              const leNumMatch = cleanLe.match(/(?:bài|bai)\s+(\d+)/);
              const leNum = leNumMatch ? leNumMatch[1].trim() : '';

              const matchedLe = matchedCh.lessons.find(le => {
                const leTitleLower = le.title.toLowerCase();
                if (leNum) {
                  const titleNumMatch = leTitleLower.match(/(?:bài|bai)\s+(\d+)/);
                  if (titleNumMatch && titleNumMatch[1] === leNum) return true;
                }
                return leTitleLower.includes(cleanLe) || cleanLe.includes(leTitleLower) || isStringSimilar(le.title, targetLessonText);
              });

              if (matchedLe) {
                resolvedLessonId = matchedLe.id;
              }
            }
          }
        }
      }

      let topic = 'Tải lên hàng loạt';
      if (targetChapterText) {
        topic = targetChapterText;
        if (targetLessonText) {
          topic += ` - ${targetLessonText}`;
        }
      }

      parsedQuestions.push({
        grade: resolvedGrade,
        subject: resolvedSubject,
        book: 'Kết nối tri thức',
        chapterId: resolvedChapterId,
        lessonId: resolvedLessonId,
        topic,
        type,
        content: cleanContent,
        options: options,
        answer,
        explain: explain.trim() || 'Chưa cung cấp hướng dẫn giải chi tiết.',
        level,
        requiredOutcome: blockOutcomeText || fileOutcomeText || '',
      });
    }

    return parsedQuestions;
  };

  const handleFileUploadProcess = (file: File) => {
    if (!file.name.toLowerCase().endsWith('.txt')) {
      alert('Chỉ hỗ trợ nhập tệp văn bản thô định dạng đuôi .TXT chuẩn!');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (!text) return;
      try {
        const list = parseUploadedText(text);
        if (list.length === 0) {
          setImportStatus(`Không tìm thấy cấu trúc câu hỏi khả thi trong file này. Vui lòng xem kỹ Quy định câu mẫu.`);
          setImportedQuestions([]);
        } else {
          setImportedQuestions(list);
          setSelectedImportIndices(list.map((_, idx) => idx));
          setImportStatus(`Tìm thấy và giải mã thành công ${list.length} câu hỏi rèn luyện.`);
        }
      } catch (err) {
        setImportStatus('Đã xảy ra sự cố đọc file. Vui lòng xem kỹ định dạng.');
      }
    };
    reader.readAsText(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUploadProcess(e.dataTransfer.files[0]);
    }
  };

  const getSelectedSyllabusTitles = () => {
    const finalGrade = importAssignGrade === 'AUTO' ? '6' : importAssignGrade;
    const finalSub = importAssignSub === 'AUTO' ? 'Toán' : importAssignSub;
    const activeSyl = syllabus.find(sy => sy.grade === finalGrade && sy.subject === finalSub);
    
    let chapterTitle = '';
    let lessonTitle = '';
    
    if (activeSyl && importAssignChapterID !== 'AUTO') {
      const ch = activeSyl.chapters.find(c => c.id === importAssignChapterID);
      if (ch) {
        chapterTitle = ch.title;
        if (importAssignLessonID !== 'AUTO') {
          const le = ch.lessons.find(l => l.id === importAssignLessonID);
          if (le) {
            lessonTitle = le.title;
          }
        }
      }
    }
    return { chapterTitle, lessonTitle };
  };

  const handleBulkImportSubmit = (indicesToSubmit?: number[]) => {
    const indices = indicesToSubmit || selectedImportIndices;
    if (indices.length === 0) {
      alert('Vui lòng tích chọn câu hỏi muốn đưa vào kho lưu trữ!');
      return;
    }

    const { chapterTitle, lessonTitle } = getSelectedSyllabusTitles();

    const batchToAdd: Omit<Question, 'id' | 'source' | 'status'>[] = [];
    indices.forEach((idx) => {
      const q = importedQuestions[idx];
      
      const finalGrade = importAssignGrade === 'AUTO' ? q.grade : importAssignGrade;
      const finalSubject = importAssignSub === 'AUTO' ? q.subject : importAssignSub;
      const finalChapterId = importAssignChapterID === 'AUTO' ? q.chapterId : importAssignChapterID;
      const finalLessonId = importAssignLessonID === 'AUTO' ? q.lessonId : importAssignLessonID;
      
      let finalTopic = q.topic;
      if (importAssignChapterID !== 'AUTO') {
        finalTopic = chapterTitle;
        if (importAssignLessonID !== 'AUTO' && lessonTitle) {
          finalTopic += ` - ${lessonTitle}`;
        }
      }

      batchToAdd.push({
        grade: finalGrade,
        subject: finalSubject,
        book: q.book,
        chapterId: finalChapterId,
        lessonId: finalLessonId,
        topic: finalTopic,
        type: q.type,
        content: q.content,
        options: q.options,
        answer: q.answer,
        explain: q.explain,
        level: q.level,
      });
    });

    onAddQuestion(batchToAdd);

    alert(`Hoàn tất nhập thành công ${batchToAdd.length} câu hỏi tinh lọc vào Ngân hàng rèn luyện chung!`);
    setImportedQuestions([]);
    setSelectedImportIndices([]);
    setImportStatus(null);
    setActiveCreatorTab('manual');
  };

  const handleMoveQuestions = () => {
    if (explorerSelectedQuestionIds.length === 0) {
      alert('Vui lòng chọn ít nhất một câu hỏi để gán phân phối!');
      return;
    }
    if (!explorerMoveTargetChapter) {
      alert('Vui lòng chọn Chương học đích!');
      return;
    }
    
    if (onUpdateQuestion) {
      explorerSelectedQuestionIds.forEach(id => {
        onUpdateQuestion(id, {
          chapterId: explorerMoveTargetChapter,
          lessonId: explorerMoveTargetLesson || 'le-general'
        });
      });
      alert(`Đã di chuyển thành công ${explorerSelectedQuestionIds.length} câu hỏi vào sơ đồ bài học.`);
      setExplorerSelectedQuestionIds([]);
    }
  };

  // -----------------------------------------------------------------
  // MANUAL FORM SUBMIT
  // -----------------------------------------------------------------
  const handleAddQuestionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    let options: string[] = [];
    let answer = '';

    if (type === 'MCQ') {
      options = [opt0 || 'Phương án A', opt1 || 'Phương án B', opt2 || 'Phương án C', opt3 || 'Phương án D'];
      answer = mcqAns;
    } else if (type === 'YESNO') {
      options = [ynOpt0 || 'Khẳng định a', ynOpt1 || 'Khẳng định b', ynOpt2 || 'Khẳng định c', ynOpt3 || 'Khẳng định d'];
      answer = [ynAns0, ynAns1, ynAns2, ynAns3].join(',');
    } else {
      answer = shortAns || 'Chưa định nghĩa';
    }

    onAddQuestion({
      grade,
      subject: sub,
      book: 'Kết nối tri thức',
      chapterId: manualChapterId === 'AUTO' ? 'ch-general' : manualChapterId,
      lessonId: manualLessonId === 'AUTO' ? 'le-general' : manualLessonId,
      topic: (() => {
        const activeSyl = syllabus.find(sy => sy.grade === grade && sy.subject === sub);
        let t = 'Biên soạn tự do';
        if (activeSyl && manualChapterId !== 'AUTO') {
          const ch = activeSyl.chapters.find(c => c.id === manualChapterId);
          if (ch) {
            t = ch.title;
            if (manualLessonId !== 'AUTO') {
              const le = ch.lessons.find(l => l.id === manualLessonId);
              if (le) {
                t += ` - ${le.title}`;
              }
            }
          }
        }
        return t;
      })(),
      type,
      content,
      options,
      answer,
      explain: explain.trim() || 'Không có lời giải thích.',
      level,
      requiredOutcome: requiredOutcome.trim(),
    });

    // Reset Form
    setContent('');
    setExplain('');
    setRequiredOutcome('');
    setOpt0('');
    setOpt1('');
    setOpt2('');
    setOpt3('');
    setYnOpt0('');
    setYnOpt1('');
    setYnOpt2('');
    setYnOpt3('');
    setShortAns('');
  };

  const filteredQuestions = questions.filter((q) => {
    const sMatch = filterSub === 'ALL' || q.subject === filterSub;
    const gMatch = filterGrade === 'ALL' || q.grade === filterGrade;
    const tMatch = filterType === 'ALL' || q.type === filterType;
    const chMatch = filterChapterId === 'ALL' || q.chapterId === filterChapterId || (filterChapterId === 'ch-general' && (!q.chapterId || q.chapterId === 'ch-general' || q.chapterId === 'temp'));
    const leMatch = filterLessonId === 'ALL' || q.lessonId === filterLessonId || (filterLessonId === 'le-general' && (!q.lessonId || q.lessonId === 'le-general' || q.lessonId === 'temp'));
    const qMatch = !searchQuery.trim() || q.content.toLowerCase().includes(searchQuery.toLowerCase());
    return sMatch && gMatch && tMatch && chMatch && leMatch && qMatch;
  });

  return (
    <div className="space-y-6">
      {/* Top Main Heading */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <BookOpen className="w-7 h-7 text-indigo-600" />
            Ngân hàng câu hỏi rèn luyện tinh tuyển
          </h1>
          <p className="text-xs font-bold text-slate-500 mt-0.5">
            Biên soạn thủ công, tự động hóa tải tệp Word/TXT, kiểm định chất lượng câu hỏi đa dạng thức nâng cao.
          </p>
        </div>

        {/* Dynamic score summary widget or class overview */}
        <div className="bg-indigo-50 border border-indigo-100 p-2.5 px-4 rounded-xl flex items-center gap-3 text-xs shadow-sm">
          <Sparkles className="w-5 h-5 text-indigo-600 animate-pulse" />
          <div>
            <p className="font-extrabold text-slate-700">Tổng năng lực kho lưu trữ:</p>
            <p className="text-[10px] text-indigo-700 font-black uppercase">
              {questions.length} câu hỏi chuẩn mực có sẵn
            </p>
          </div>
        </div>
      </div>

      {/* -----------------------------------------------------------------
          IMPORTANT RULE COMPOSER ALERT: TRUE / FAIL SCORING BLUEPRINT
          ----------------------------------------------------------------- */}
      <div className="bg-gradient-to-r from-teal-50 to-emerald-50 border border-emerald-100 p-4 rounded-2xl shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1.5 max-w-3xl">
          <h3 className="font-black text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5 text-emerald-800">
            <CheckSquare className="w-4 h-4 text-emerald-600 animate-bounce" />
            QUY CHUẨN ĐIỂM SỐ DẠNG ĐÚNG/SAI (BỘ GD&ĐT ĐỀ XUẤT)
          </h3>
          <p className="text-[11px] text-slate-600 leading-relaxed font-semibold">
            Dạng câu hỏi Đúng/Sai cấu trúc 4 ý độc lập (a, b, c, d) được hệ thống chấm điểm tự động tích lũy từng bước để tránh đoán lụi:
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
            <div className="bg-white/80 p-1.5 rounded-lg border text-center">
              <p className="text-[9px] text-slate-400 font-bold uppercase">Đúng 1 ý</p>
              <p className="text-xs font-black text-emerald-700">+0.1 điểm</p>
            </div>
            <div className="bg-white/80 p-1.5 rounded-lg border text-center">
              <p className="text-[9px] text-slate-400 font-bold uppercase">Đúng 2 ý</p>
              <p className="text-xs font-black text-emerald-700">+0.25 điểm</p>
            </div>
            <div className="bg-white/80 p-1.5 rounded-lg border text-center">
              <p className="text-[9px] text-slate-400 font-bold uppercase">Đúng 3 ý</p>
              <p className="text-xs font-black text-emerald-700">+0.5 điểm</p>
            </div>
            <div className="bg-white/80 p-1.5 rounded-lg border text-center ring-2 ring-emerald-500/20">
              <p className="text-[9px] text-emerald-500 font-black uppercase">Đúng cả 4 ý</p>
              <p className="text-xs font-black text-emerald-600">+1.0 điểm</p>
            </div>
          </div>
        </div>

        <div className="border-l pl-4 h-full hidden md:block">
          <p className="text-[11px] text-slate-500 font-bold italic text-right max-w-[150px]">
            Hệ thống tự phân bố hệ số quy điểm này vào bài thi của học sinh.
          </p>
        </div>
      </div>

      {/* -----------------------------------------------------------------
          INTERACTIVE SPECIFICATION DIRECTIVES (Cẩm nang Dạng câu mẫu)
          ----------------------------------------------------------------- */}
      <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-150 pb-3 gap-2">
          <div>
            <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5 text-indigo-600">
              <Layers className="w-4 h-4 text-indigo-600" />
              Quy chuẩn và Cú Pháp Định dạng câu mẫu
            </h3>
            <p className="text-[10px] text-slate-400 font-bold mt-0.5">
              Học viện cấu trúc rèn luyện: Chuyển đổi định dạng tệp thô thành các khối câu hỏi phức tạp.
            </p>
          </div>

          <div className="flex bg-slate-100 p-1 rounded-xl self-end">
            {(['MCQ', 'YESNO', 'SHORT', 'ESSAY'] as QuestionType[]).map((tType) => (
              <button
                key={tType}
                type="button"
                onClick={() => setGuideTab(tType)}
                className={`px-3 py-1 text-[10px] font-black rounded-lg transition-all border-none cursor-pointer ${
                  guideTab === tType ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {tType === 'MCQ' && 'Trắc nghiệm'}
                {tType === 'YESNO' && 'Đúng/Sai (TF)'}
                {tType === 'SHORT' && 'Lời giải ngắn'}
                {tType === 'ESSAY' && 'Tự luận'}
              </button>
            ))}
          </div>
        </div>

        {/* Guide spec display block */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="md:col-span-2 space-y-3">
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1">
                <Info className="w-3.5 h-3.5 text-blue-500" />
                Mô tả dạng cấu trúc mẫu:
              </h4>
              <p className="text-[11px] text-slate-500 font-medium leading-relaxed mt-1.5">
                {FORMAT_TEMPLATES[guideTab].desc}
              </p>
              
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleCopyTemplateText}
                  className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-350 rounded-lg text-[10px] font-black cursor-pointer flex items-center gap-1.5 transition-all"
                >
                  {copiedText ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-500" />
                      Đã sao chép!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      Sao chép mã thô
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => handleTrySampleInForm(FORMAT_TEMPLATES[guideTab].exampleObj)}
                  className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-[10px] font-black cursor-pointer flex items-center gap-1.5 transition-all"
                >
                  <Sparkles className="w-3 h-3 text-indigo-500" />
                  Thử nhập nháp này
                </button>
                <button
                  type="button"
                  onClick={handleDownloadTxtTemplate}
                  className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-[10px] font-black cursor-pointer flex items-center gap-1.5 transition-all"
                >
                  <FileText className="w-3 h-3 text-blue-550" />
                  Tải tệp mẫu (.TXT)
                </button>
              </div>
            </div>
          </div>

          <div className="md:col-span-3">
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Cú pháp mã nguồn chuẩn (.TXT):</label>
            <pre className="text-[10px] font-mono text-slate-600 bg-slate-900 text-slate-100 p-3.5 rounded-xl overflow-x-auto select-all max-h-[170px] custom-scrollbar shadow-inner">
              {FORMAT_TEMPLATES[guideTab].text}
            </pre>
          </div>
        </div>
      </div>

      {/* Main Form Creator & Repository Display */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* LEFT COLUMN: Manual Creator Form + Bulk Files Uploader */}
        <div className="space-y-6 lg:col-span-1">
          {/* Creator switcher header tab */}
          <div className="bg-white p-1.5 rounded-2xl border border-slate-150 shadow-xs flex gap-1">
            <button
              type="button"
              onClick={() => setActiveCreatorTab('manual')}
              className={`flex-1 py-1.5 text-xs font-black rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 border-none ${
                activeCreatorTab === 'manual'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 bg-transparent hover:bg-slate-50'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              Soạn thủ công
            </button>
            <button
              type="button"
              onClick={() => setActiveCreatorTab('import')}
              className={`flex-1 py-1.5 text-xs font-black rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 border-none ${
                activeCreatorTab === 'import'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 bg-transparent hover:bg-slate-50'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              Tải tệp (.TXT)
            </button>
          </div>

          {/* CREATOR CONTAINER: Tab 1 (Manual Creator Form) */}
          {activeCreatorTab === 'manual' && (
            <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-sm space-y-4">
              <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5 text-emerald-600 border-b border-slate-100 pb-2">
                <Plus className="w-4 h-4 text-emerald-600" />
                Soạn thảo câu lý thuyết & toán
              </h3>

              <form onSubmit={handleAddQuestionSubmit} className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-bold text-slate-500 uppercase mb-1">Môn học</label>
                  <select
                    value={sub}
                    onChange={(e) => {
                      setSub(e.target.value);
                      setManualChapterId('AUTO');
                      setManualLessonId('AUTO');
                    }}
                    className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="Toán">Toán học</option>
                    <option value="Tin học">Tin học</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold text-slate-500 uppercase mb-1">Khối lớp</label>
                    <select
                      value={grade}
                      onChange={(e) => {
                        setGrade(e.target.value);
                        setManualChapterId('AUTO');
                        setManualLessonId('AUTO');
                      }}
                      className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                      <option value="6">Lớp 6</option>
                      <option value="7">Lớp 7</option>
                      <option value="8">Lớp 8</option>
                      <option value="9">Lớp 9</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-500 uppercase mb-1">Mức độ nhận thức</label>
                    <select
                      value={level}
                      onChange={(e) => setLevel(e.target.value as QuestionLevel)}
                      className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                      <option value="Nhận biết">Nhận biết</option>
                      <option value="Thông hiểu">Thông hiểu</option>
                      <option value="Vận dụng">Vận dụng</option>
                      <option value="Vận dụng cao">Vận dụng cao</option>
                    </select>
                  </div>
                </div>

                <div className="bg-slate-50/85 p-3 rounded-xl border border-slate-200/80 space-y-2.5">
                  <p className="text-[10px] font-extrabold uppercase text-indigo-600 tracking-wider">LỰA CHỌN CHƯƠNG & BÀI HỌC</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[9.5px] font-bold text-slate-500 uppercase mb-1">Chương học</label>
                      <select
                        value={manualChapterId}
                        onChange={(e) => {
                          setManualChapterId(e.target.value);
                          setManualLessonId('AUTO');
                        }}
                        className="w-full text-xs font-semibold bg-white border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-indigo-500 outline-none cursor-pointer"
                      >
                        <option value="AUTO">-- Chung / Ngoài danh mục --</option>
                        {syllabus
                          .find(sy => sy.grade === grade && sy.subject === sub)
                          ?.chapters.map(ch => (
                            <option key={ch.id} value={ch.id}>{ch.title}</option>
                          ))
                        }
                      </select>
                    </div>

                    <div>
                      <label className="block text-[9.5px] font-bold text-slate-500 uppercase mb-1">Bài học</label>
                      <select
                        disabled={manualChapterId === 'AUTO'}
                        value={manualLessonId}
                        onChange={(e) => setManualLessonId(e.target.value)}
                        className="w-full text-xs font-semibold bg-white disabled:bg-slate-100 disabled:text-slate-400 border border-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-indigo-500 outline-none cursor-pointer"
                      >
                        <option value="AUTO">-- Chung / Toàn chương --</option>
                        {syllabus
                          .find(sy => sy.grade === grade && sy.subject === sub)
                          ?.chapters.find(ch => ch.id === manualChapterId)
                          ?.lessons.map(le => (
                            <option key={le.id} value={le.id}>{le.title}</option>
                          ))
                        }
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-500 uppercase mb-1">Dạng thiết kế câu hỏi</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as QuestionType)}
                    className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-indigo-700"
                  >
                    <option value="MCQ">Trắc nghiệm MCQ (4 đáp án)</option>
                    <option value="YESNO">Đúng / Sai (4 mệnh đề)</option>
                    <option value="SHORT">Trả lời ngắn / Điền số</option>
                    <option value="ESSAY">Đáp án Tự luận</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-500 uppercase mb-1">Yêu cầu cần đạt</label>
                  <input
                    type="text"
                    value={requiredOutcome}
                    onChange={(e) => setRequiredOutcome(e.target.value)}
                    placeholder="Ví dụ: Nhận biết được một số hệ thức về cạnh và đường cao..."
                    className="w-full text-xs font-semibold p-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 bg-slate-50 outline-none"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block font-bold text-slate-500 uppercase">Nội dung câu hỏi</label>
                    <span className="text-[10px] text-indigo-500 font-bold">LaTex dạng $...$</span>
                  </div>
                  <textarea
                    required
                    rows={4}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Ví dụ: Tìm x để $y = \sqrt{x - 3}$ xác định."
                    className="w-full text-xs font-semibold p-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 bg-slate-50 outline-none"
                  />
                </div>

                {/* MCQ Options Form */}
                {type === 'MCQ' && (
                  <div className="space-y-2.5 bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <label className="block font-extrabold text-slate-600">Thiết lập 4 phương án:</label>
                    <div className="space-y-2 font-semibold">
                      <div className="flex items-center gap-1">
                        <span className="font-bold text-slate-400">A.</span>
                        <input
                          type="text"
                          placeholder="Nhập phương án A"
                          value={opt0}
                          onChange={(e) => setOpt0(e.target.value)}
                          className="w-full p-2 bg-white border rounded text-xs focus:ring-1 focus:ring-indigo-500 font-semibold"
                        />
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="font-bold text-slate-400">B.</span>
                        <input
                          type="text"
                          placeholder="Nhập phương án B"
                          value={opt1}
                          onChange={(e) => setOpt1(e.target.value)}
                          className="w-full p-2 bg-white border rounded text-xs focus:ring-1 focus:ring-indigo-500 font-semibold"
                        />
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="font-bold text-slate-400">C.</span>
                        <input
                          type="text"
                          placeholder="Nhập phương án C"
                          value={opt2}
                          onChange={(e) => setOpt2(e.target.value)}
                          className="w-full p-2 bg-white border rounded text-xs focus:ring-1 focus:ring-indigo-500 font-semibold"
                        />
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="font-bold text-slate-400">D.</span>
                        <input
                          type="text"
                          placeholder="Nhập phương án D"
                          value={opt3}
                          onChange={(e) => setOpt3(e.target.value)}
                          className="w-full p-2 bg-white border rounded text-xs focus:ring-1 focus:ring-indigo-500 font-semibold"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Đáp án đúng của MCQ:</label>
                      <select
                        value={mcqAns}
                        onChange={(e) => setMcqAns(e.target.value)}
                        className="w-full p-2 bg-white border rounded text-xs text-emerald-800 font-black cursor-pointer shadow-xs"
                      >
                        <option value="0">Phương án ĐÚNG là: A</option>
                        <option value="1">Phương án ĐÚNG là: B</option>
                        <option value="2">Phương án ĐÚNG là: C</option>
                        <option value="3">Phương án ĐÚNG là: D</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* YESNO Đúng/Sai Options Form */}
                {type === 'YESNO' && (
                  <div className="space-y-2.5 bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <label className="block font-extrabold text-slate-600">Bổ sung 4 mệnh đề đúng sai:</label>
                    <div className="space-y-2 font-semibold">
                      <div className="space-y-1 bg-white p-2 rounded-lg border">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-indigo-600">a)</span>
                          <input
                            type="text"
                            placeholder="Khẳng định a..."
                            value={ynOpt0}
                            onChange={(e) => setYnOpt0(e.target.value)}
                            className="w-full p-1 text-xs outline-none border-none font-semibold bg-transparent"
                          />
                        </div>
                        <div className="flex justify-end gap-2 text-[10px] border-t pt-1 mt-1">
                          <label className="cursor-pointer font-bold flex items-center gap-1">
                            <input type="radio" name="yn-a" value="true" checked={ynAns0 === 'true'} onChange={() => setYnAns0('true')} />
                            <span className="text-emerald-700 font-bold">Đúng</span>
                          </label>
                          <label className="cursor-pointer font-bold flex items-center gap-1">
                            <input type="radio" name="yn-a" value="false" checked={ynAns0 === 'false'} onChange={() => setYnAns0('false')} />
                            <span className="text-rose-700 font-bold">Sai</span>
                          </label>
                        </div>
                      </div>

                      <div className="space-y-1 bg-white p-2 rounded-lg border">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-indigo-600">b)</span>
                          <input
                            type="text"
                            placeholder="Khẳng định b..."
                            value={ynOpt1}
                            onChange={(e) => setYnOpt1(e.target.value)}
                            className="w-full p-1 text-xs outline-none border-none font-semibold bg-transparent"
                          />
                        </div>
                        <div className="flex justify-end gap-2 text-[10px] border-t pt-1 mt-1">
                          <label className="cursor-pointer font-bold flex items-center gap-1">
                            <input type="radio" name="yn-b" value="true" checked={ynAns1 === 'true'} onChange={() => setYnAns1('true')} />
                            <span className="text-emerald-700 font-bold">Đúng</span>
                          </label>
                          <label className="cursor-pointer font-bold flex items-center gap-1">
                            <input type="radio" name="yn-b" value="false" checked={ynAns1 === 'false'} onChange={() => setYnAns1('false')} />
                            <span className="text-rose-700 font-bold">Sai</span>
                          </label>
                        </div>
                      </div>

                      <div className="space-y-1 bg-white p-2 rounded-lg border">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-indigo-600">c)</span>
                          <input
                            type="text"
                            placeholder="Khẳng định c..."
                            value={ynOpt2}
                            onChange={(e) => setYnOpt2(e.target.value)}
                            className="w-full p-1 text-xs outline-none border-none font-semibold bg-transparent"
                          />
                        </div>
                        <div className="flex justify-end gap-2 text-[10px] border-t pt-1 mt-1">
                          <label className="cursor-pointer font-bold flex items-center gap-1">
                            <input type="radio" name="yn-c" value="true" checked={ynAns2 === 'true'} onChange={() => setYnAns2('true')} />
                            <span className="text-emerald-700 font-bold">Đúng</span>
                          </label>
                          <label className="cursor-pointer font-bold flex items-center gap-1">
                            <input type="radio" name="yn-c" value="false" checked={ynAns2 === 'false'} onChange={() => setYnAns2('false')} />
                            <span className="text-rose-700 font-bold">Sai</span>
                          </label>
                        </div>
                      </div>

                      <div className="space-y-1 bg-white p-2 rounded-lg border">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-indigo-600">d)</span>
                          <input
                            type="text"
                            placeholder="Khẳng định d..."
                            value={ynOpt3}
                            onChange={(e) => setYnOpt3(e.target.value)}
                            className="w-full p-1 text-xs outline-none border-none font-semibold bg-transparent"
                          />
                        </div>
                        <div className="flex justify-end gap-2 text-[10px] border-t pt-1 mt-1">
                          <label className="cursor-pointer font-bold flex items-center gap-1">
                            <input type="radio" name="yn-d" value="true" checked={ynAns3 === 'true'} onChange={() => setYnAns3('true')} />
                            <span className="text-emerald-700 font-bold">Đúng</span>
                          </label>
                          <label className="cursor-pointer font-bold flex items-center gap-1">
                            <input type="radio" name="yn-d" value="false" checked={ynAns3 === 'false'} onChange={() => setYnAns3('false')} />
                            <span className="text-rose-700 font-bold">Sai</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* SHORT & ESSAY Answer forms */}
                {(type === 'SHORT' || type === 'ESSAY') && (
                  <div>
                    <label className="block font-bold text-slate-500 uppercase mb-1">
                      {type === 'SHORT' ? 'Đáp số đúng (Số trị / Chuỗi chính xác)' : 'Gợi ý dốc đáp án chuẩn'}
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ví dụ: x = 12 hoặc S = 25"
                      value={shortAns}
                      onChange={(e) => setShortAns(e.target.value)}
                      className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-xs font-semibold"
                    />
                  </div>
                )}

                <div>
                  <label className="block font-bold text-slate-500 uppercase mb-1">Lời giải / Giải thích khoa học</label>
                  <textarea
                    rows={3}
                    value={explain}
                    onChange={(e) => setExplain(e.target.value)}
                    placeholder="Nhập lập luận chi tiết từng bước..."
                    className="w-full text-xs font-semibold p-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 bg-slate-50 outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer border-none"
                >
                  <Plus className="w-4 h-4" />
                  Đồng bộ vào Kho Lưu Trữ
                </button>
              </form>
            </div>
          )}

          {/* CREATOR CONTAINER: Tab 2 (TXT Bulk Import Drag-Drop Parser) */}
          {activeCreatorTab === 'import' && (
            <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-sm space-y-4">
              <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5 text-blue-600 border-b border-slate-100 pb-2">
                <Upload className="w-4 h-4 text-blue-600" />
                Tải tệp câu hỏi mẫu tự động
              </h3>

              <div className="space-y-3">
                <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                  Thiết kế cấu trúc rèn luyện thô trong Word/Notepad, lưu lại dưới tệp <strong className="text-slate-700">.txt (UTF-8)</strong> rồi kéo thả vào đây để hệ thống tự động bóc tách chi tiết.
                </p>

                <div className="bg-blue-50/50 p-2.5 rounded-xl border border-blue-100 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-[10.5px]">
                  <div className="flex items-center gap-1.5 text-slate-600 font-semibold">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <span>Mẫu .TXT chuẩn cấu trúc Đề thi/Bài ôn</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleDownloadTxtTemplate}
                    className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-lg cursor-pointer transition-all border-none flex items-center gap-1"
                  >
                    <FileCheck className="w-3.5 h-3.5" />
                    Tải về tệp TXT mẫu
                  </button>
                </div>

                {/* ASSIGNMENT CONFIGURATION PANEL */}
                <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-3 space-y-3">
                  <p className="text-[10px] font-black uppercase text-indigo-650 tracking-wider flex items-center gap-1">
                    <BookOpen className="w-3.5 h-3.5 text-indigo-600 animate-pulse" />
                    TIÊU CHÍ NHẬP (LỚP, CHƯƠNG, BÀI)
                  </p>
                  
                  <div className="grid grid-cols-2 gap-2 text-[10px] font-semibold text-slate-600">
                    <div>
                      <label className="block mb-1 text-slate-400 font-bold uppercase text-[9px]">Chọn Lớp</label>
                      <select
                        id="import-grade-select"
                        value={importAssignGrade}
                        onChange={(e) => {
                          setImportAssignGrade(e.target.value);
                          setImportAssignChapterID('AUTO');
                          setImportAssignLessonID('AUTO');
                        }}
                        className="w-full text-[11px] bg-white border border-slate-250 p-2 rounded-lg outline-none font-bold text-slate-700 cursor-pointer"
                      >
                        <option value="AUTO">-- Tự phát hiện từ tệp --</option>
                        <option value="6">Lớp 6</option>
                        <option value="7">Lớp 7</option>
                        <option value="8">Lớp 8</option>
                        <option value="9">Lớp 9</option>
                      </select>
                    </div>

                    <div>
                      <label className="block mb-1 text-slate-400 font-bold uppercase text-[9px]">Chọn Môn học</label>
                      <select
                        id="import-sub-select"
                        value={importAssignSub}
                        onChange={(e) => {
                          setImportAssignSub(e.target.value);
                          setImportAssignChapterID('AUTO');
                          setImportAssignLessonID('AUTO');
                        }}
                        className="w-full text-[11px] bg-white border border-slate-250 p-2 rounded-lg outline-none font-bold text-slate-700 cursor-pointer"
                      >
                        <option value="AUTO">-- Tự phát hiện từ tệp --</option>
                        <option value="Toán">Toán Học</option>
                        <option value="Tin học">Tin Học</option>
                        <option value="Vật lý">Vật lý</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block mb-0.5 text-slate-400 font-bold uppercase text-[9px]">Chương học chỉ định</label>
                      <select
                        id="import-chapter-select"
                        disabled={importAssignGrade === 'AUTO' || importAssignSub === 'AUTO'}
                        value={importAssignChapterID}
                        onChange={(e) => {
                          setImportAssignChapterID(e.target.value);
                          setImportAssignLessonID('AUTO');
                        }}
                        className="w-full text-[11px] bg-white disabled:bg-slate-100 disabled:text-slate-400 border border-slate-250 p-1.5 rounded-lg outline-none font-bold text-slate-700 cursor-pointer"
                      >
                        <option value="AUTO">-- Tự bóc từ tệp --</option>
                        {syllabus
                          .find(sy => sy.grade === importAssignGrade && sy.subject === importAssignSub)
                          ?.chapters.map(ch => (
                            <option key={ch.id} value={ch.id}>{ch.title}</option>
                          ))
                        }
                      </select>
                    </div>

                    <div>
                      <label className="block mb-0.5 text-slate-400 font-bold uppercase text-[9px]">Bài học chỉ định</label>
                      <select
                        id="import-lesson-select"
                        disabled={importAssignChapterID === 'AUTO'}
                        value={importAssignLessonID}
                        onChange={(e) => setImportAssignLessonID(e.target.value)}
                        className="w-full text-[11px] bg-white disabled:bg-slate-100 disabled:text-slate-400 border border-slate-250 p-1.5 rounded-lg outline-none font-bold text-slate-700 cursor-pointer"
                      >
                        <option value="AUTO">-- Tự bóc từ tệp --</option>
                        {syllabus
                          .find(sy => sy.grade === importAssignGrade && sy.subject === importAssignSub)
                          ?.chapters.find(ch => ch.id === importAssignChapterID)
                          ?.lessons.map(le => (
                            <option key={le.id} value={le.id}>{le.title}</option>
                          ))
                        }
                      </select>
                    </div>
                  </div>

                  {/* COGNITIVE LEVEL FILTER */}
                  <div className="border-t pt-2.5">
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-slate-500 font-extrabold uppercase text-[9px]">Mức độ nhận thức hiển thị</label>
                      <div className="flex gap-2 text-[9px] font-black">
                        <button
                          type="button"
                          id="import-select-all-levels"
                          onClick={() => setImportSelectedLevels(['Nhận biết', 'Thông hiểu', 'Vận dụng', 'Vận dụng cao'])}
                          className="text-indigo-600 hover:underline cursor-pointer bg-transparent border-none p-0"
                        >
                          Tất cả
                        </button>
                        <span className="text-slate-300">|</span>
                        <button
                          type="button"
                          id="import-clear-all-levels"
                          onClick={() => setImportSelectedLevels([])}
                          className="text-rose-600 hover:underline cursor-pointer bg-transparent border-none p-0"
                        >
                          Xóa hết
                        </button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-1.5">
                      {(['Nhận biết', 'Thông hiểu', 'Vận dụng', 'Vận dụng cao'] as QuestionLevel[]).map((lvl) => {
                        const isSelected = importSelectedLevels.includes(lvl);
                        return (
                          <label
                            key={lvl}
                            id={`import-level-label-${lvl.replace(/\s+/g, '-')}`}
                            className={`flex items-center gap-1.5 p-1.5 rounded-lg text-[9.5px] font-bold cursor-pointer transition-all ${
                              isSelected
                                ? 'bg-indigo-50 border border-indigo-200 text-indigo-700'
                                : 'bg-white border border-slate-200 text-slate-400 opacity-60 hover:opacity-100'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {
                                if (isSelected) {
                                  setImportSelectedLevels(importSelectedLevels.filter((x) => x !== lvl));
                                } else {
                                  setImportSelectedLevels([...importSelectedLevels, lvl]);
                                }
                              }}
                              className="w-3.5 h-3.5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                            />
                            <span>{lvl}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Drag zone Area */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all space-y-3 ${
                    dragActive
                      ? 'border-blue-500 bg-blue-50/20'
                      : 'border-slate-300 hover:border-blue-400 bg-slate-50/60'
                  }`}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".txt"
                    onChange={(e) => e.target.files?.[0] && handleFileUploadProcess(e.target.files[0])}
                    className="hidden"
                  />
                  <Upload className="w-7 h-7 text-slate-400 mx-auto animate-pulse" />
                  <div className="space-y-1">
                    <p className="text-xs font-black text-slate-700">Nhấp duyệt tệp hoặc bốc thả TXT</p>
                    <p className="text-[10px] text-slate-400 font-bold">Dung lượng ranh giới dưới 10MB</p>
                  </div>
                </div>

                {importStatus && (
                  <div className="p-3 bg-blue-50 text-blue-800 border border-blue-100 rounded-xl text-[11px] font-semibold flex items-start gap-1.5">
                    <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <span>{importStatus}</span>
                  </div>
                )}

                {/* Staging List preview before saving */}
                {importedQuestions.length > 0 && (() => {
                  // Filter the staged questions so they instantly match checked cognitive levels
                  const visibleStagedWithIndex = importedQuestions
                    .map((q, idx) => ({ q, originalIndex: idx }))
                    .filter(item => importSelectedLevels.includes(item.q.level));

                  const visibleIndices = visibleStagedWithIndex.map(item => item.originalIndex);
                  const allVisibleChecked = visibleIndices.length > 0 && visibleIndices.every(idx => selectedImportIndices.includes(idx));
                  const visibleCheckedCount = selectedImportIndices.filter(idx => {
                    const lvl = importedQuestions[idx]?.level;
                    return lvl && importSelectedLevels.includes(lvl);
                  }).length;

                  return (
                    <div className="space-y-3 pt-2">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                        <span>Cơ cấu bóc được ({visibleStagedWithIndex.length} câu hiển thị):</span>
                        <button
                          type="button"
                          id="import-toggle-all-visible"
                          onClick={() => {
                            if (allVisibleChecked) {
                              // Deselect only currently visible ones
                              setSelectedImportIndices(selectedImportIndices.filter(idx => !visibleIndices.includes(idx)));
                            } else {
                              // Select all currently visible ones
                              const union = Array.from(new Set([...selectedImportIndices, ...visibleIndices]));
                              setSelectedImportIndices(union);
                            }
                          }}
                          className="text-indigo-650 text-[10px] hover:underline bg-transparent border-none cursor-pointer font-bold"
                        >
                          {allVisibleChecked ? 'Bỏ chọn hết' : 'Chọn tất cả'}
                        </button>
                      </div>

                      <div className="max-h-[190px] overflow-y-auto custom-scrollbar border rounded-xl divide-y space-y-1 p-2 bg-slate-50">
                        {visibleStagedWithIndex.length === 0 ? (
                          <p className="text-center text-slate-400 py-3 text-[10px] font-semibold italic">Không có câu hỏi nào khớp mức độ nhận thức đã lọc.</p>
                        ) : (
                          visibleStagedWithIndex.map((item) => {
                            const isChecked = selectedImportIndices.includes(item.originalIndex);
                            return (
                              <div key={item.originalIndex} id={`import-staged-${item.originalIndex}`} className="flex items-start gap-2 py-1.5 first:pt-0 last:pb-0 text-[10px]">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => {
                                    if (isChecked) {
                                      setSelectedImportIndices(selectedImportIndices.filter((i) => i !== item.originalIndex));
                                    } else {
                                      setSelectedImportIndices([...selectedImportIndices, item.originalIndex]);
                                    }
                                  }}
                                  className="mt-0.5 cursor-pointer"
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="font-extrabold text-slate-700 truncate">{item.q.content}</p>
                                  <p className="text-[9px] text-slate-400 font-medium">
                                    Mức độ: <span className="font-bold text-indigo-650">{item.q.level}</span> | Dạng: <span className="font-bold text-indigo-650">{item.q.type}</span>
                                    {item.q.requiredOutcome && (
                                      <>
                                        {' | '}
                                        Yêu cầu cần đạt: <span className="font-bold text-emerald-650">{item.q.requiredOutcome}</span>
                                      </>
                                    )}
                                  </p>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>

                      <button
                        type="button"
                        id="import-submit-synced"
                        onClick={() => {
                          // Submit only visible indexes that are selected
                          const finalIndexesToSubmit = selectedImportIndices.filter(idx => {
                            const lvl = importedQuestions[idx]?.level;
                            return lvl && importSelectedLevels.includes(lvl);
                          });
                          if (finalIndexesToSubmit.length === 0) {
                            alert('Vui lòng tích chọn câu hỏi muốn đưa vào kho lưu trữ!');
                            return;
                          }
                          // Call with direct parameters to bypass any state updates delay
                          handleBulkImportSubmit(finalIndexesToSubmit);
                        }}
                        className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md flex items-center justify-center gap-1 cursor-pointer border-none"
                      >
                        <FileCheck className="w-4 h-4 text-emerald-105" />
                        Nhập vào kho rèn luyện ({visibleCheckedCount} câu)
                      </button>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Search Filter Header and Question Cards Feed */}
        <div className="lg:col-span-3 space-y-4">
          
          {/* Header filter grid panel */}
          <div className="bg-white p-4 rounded-xl border border-slate-150 flex flex-wrap items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={filterSub}
                onChange={(e) => {
                  setFilterSub(e.target.value);
                  setFilterChapterId('ALL');
                  setFilterLessonId('ALL');
                }}
                className="text-xs font-extrabold text-slate-600 bg-slate-50 border border-slate-200 rounded-lg p-2.5 outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="ALL">Môn học: Tất cả</option>
                <option value="Toán">Toán Học</option>
                <option value="Tin học">Tin Học</option>
              </select>

              <select
                value={filterGrade}
                onChange={(e) => {
                  setFilterGrade(e.target.value);
                  setFilterChapterId('ALL');
                  setFilterLessonId('ALL');
                }}
                className="text-xs font-extrabold text-slate-600 bg-slate-50 border border-slate-200 rounded-lg p-2.5 outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="ALL">Khối lớp: Tất cả</option>
                <option value="6">Lớp 6</option>
                <option value="7">Lớp 7</option>
                <option value="8">Lớp 8</option>
                <option value="9">Lớp 9</option>
              </select>

              <select
                disabled={filterGrade === 'ALL' || filterSub === 'ALL'}
                value={filterChapterId}
                onChange={(e) => {
                  setFilterChapterId(e.target.value);
                  setFilterLessonId('ALL');
                }}
                className="text-xs font-extrabold text-slate-600 bg-slate-50 border border-slate-200 rounded-lg p-2.5 outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer disabled:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="ALL">Chương: Tất cả</option>
                <option value="ch-general">Chung / Tự do</option>
                {filterGrade !== 'ALL' && filterSub !== 'ALL' && syllabus
                  .find(sy => sy.grade === filterGrade && sy.subject === filterSub)
                  ?.chapters.map(ch => (
                    <option key={ch.id} value={ch.id}>{ch.title}</option>
                  ))
                }
              </select>

              <select
                disabled={filterChapterId === 'ALL' || filterChapterId === 'ch-general'}
                value={filterLessonId}
                onChange={(e) => setFilterLessonId(e.target.value)}
                className="text-xs font-extrabold text-slate-600 bg-slate-50 border border-slate-200 rounded-lg p-2.5 outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer disabled:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="ALL">Bài học: Tất cả</option>
                <option value="le-general">Chung / Toàn chương</option>
                {filterGrade !== 'ALL' && filterSub !== 'ALL' && filterChapterId !== 'ALL' && syllabus
                  .find(sy => sy.grade === filterGrade && sy.subject === filterSub)
                  ?.chapters.find(ch => ch.id === filterChapterId)
                  ?.lessons.map(le => (
                    <option key={le.id} value={le.id}>{le.title}</option>
                  ))
                }
              </select>

              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="text-xs font-extrabold text-slate-600 bg-slate-50 border border-slate-200 rounded-lg p-2.5 outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer animate-none"
              >
                <option value="ALL">Dạng thức: Tất cả</option>
                <option value="MCQ">Trắc nghiệm dạng MCQ</option>
                <option value="YESNO">Dạng Đúng / Sai (TF)</option>
                <option value="SHORT">Dạng Trả lời ngắn</option>
                <option value="ESSAY">Dạng Tự luận</option>
              </select>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => {
                  if (filterSub !== 'ALL') setExplorerSub(filterSub);
                  if (filterGrade !== 'ALL') setExplorerGrade(filterGrade);
                  setIsExplorerOpen(true);
                }}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl shadow-md border-none flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
              >
                <Library className="w-4 h-4 text-white" />
                Xem kho câu hỏi
              </button>

              {filteredQuestions.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    const seen = new Set<string>();
                    const duplicateIds: string[] = [];
                    filteredQuestions.forEach((q) => {
                      const cleaned = q.content.trim().toLowerCase().replace(/\s+/g, '');
                      if (seen.has(cleaned)) {
                        duplicateIds.push(q.id);
                      } else {
                        seen.add(cleaned);
                      }
                    });
                    if (duplicateIds.length === 0) {
                      if (showToast) {
                        showToast("Không tìm thấy câu hỏi trùng lặp nào với bộ lọc hiện tại.", "info");
                      } else {
                        alert("Không tìm thấy câu hỏi trùng lặp nào với bộ lọc hiện tại.");
                      }
                    } else {
                      const label = `${filterSub !== 'ALL' ? filterSub : ''} Lớp ${filterGrade !== 'ALL' ? filterGrade : 'Tất cả'}`;
                      if (window.confirm(`Tìm thấy ${duplicateIds.length} câu hỏi trùng lặp trong danh sách lọc (${label}). Bạn có muốn xóa chúng không?`)) {
                        onDeleteQuestion(duplicateIds);
                        if (showToast) {
                          showToast(`Đã lọc trùng thành công! Đã dọn sạch ${duplicateIds.length} câu hỏi trùng lặp khỏi danh sách lọc.`, "success");
                        }
                      }
                    }
                  }}
                  className="px-3 py-2 bg-amber-50 text-amber-700 hover:bg-amber-100 font-extrabold text-xs rounded-xl shadow-xs border border-amber-200 flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                  title="Tìm và xóa các câu hỏi trùng lặp dựa trên bộ lọc hiện tại"
                >
                  <Copy className="w-4 h-4 text-amber-600" />
                  Lọc trùng ({filteredQuestions.length})
                </button>
              )}

              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Tìm từ khóa đề bài..."
                  value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs border border-zinc-200 rounded-lg pl-9 pr-3 py-2.5 bg-slate-50/50 outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-700"
              />
            </div>
          </div>

          {/* Verified Question Cards Feed */}
          <div className="space-y-4 max-h-[750px] overflow-y-auto custom-scrollbar pr-1.5">
            {[...filteredQuestions].reverse().map((q, idx) => (
              <div
                key={q.id || idx}
                className="bg-white p-5 rounded-2xl border border-slate-150 shadow-xs hover:shadow-md transition-all duration-200 space-y-3.5"
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 font-extrabold uppercase rounded border border-indigo-100 text-[9px]">
                      {q.level}
                    </span>
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-600 font-black uppercase rounded text-[9px] border">
                      {q.type === 'YESNO' ? 'Đúng/Sai (TF)' : q.type}
                    </span>
                    <span className="text-[10px] text-zinc-400 font-bold">
                      {q.subject} Lớp {q.grade} | {q.topic}
                    </span>
                  </div>
                  
                  <button
                    onClick={() => onDeleteQuestion(q.id)}
                    className="text-red-450 hover:text-red-600 font-black block text-[11px] flex items-center gap-1 border-none bg-transparent cursor-pointer"
                    title="Xóa vĩnh viễn"
                  >
                    <Trash className="w-3.5 h-3.5 text-red-500" />
                    Xóa câu hỏi
                  </button>
                </div>

                {q.requiredOutcome && (
                  <div className="bg-emerald-50/40 text-emerald-900 border border-emerald-100/60 rounded-xl px-3 py-2 text-[11px] font-semibold flex items-start gap-1.5 shadow-2xs">
                    <span className="text-emerald-700 font-bold shrink-0 select-none">🎯 Yêu cầu cần đạt:</span>
                    <span className="text-slate-700 font-medium leading-relaxed">{q.requiredOutcome}</span>
                  </div>
                )}

                <div className="text-sm font-extrabold text-slate-800 leading-relaxed pr-2 pl-2 border-l-2 border-indigo-500/50">
                  <MathText text={q.content} />
                </div>

                {/* Question option render layout options */}
                {q.type === 'MCQ' && q.options && q.options.length > 0 && (
                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 font-semibold pl-2">
                    {q.options.slice(0, 4).map((opt, oIdx) => (
                      <div key={oIdx} className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                        <strong className="text-slate-800 font-black mr-1">{['A', 'B', 'C', 'D'][oIdx]}.</strong> 
                        <MathText text={opt} />
                      </div>
                    ))}
                  </div>
                )}

                {/* YESNO option render layout options */}
                {q.type === 'YESNO' && q.options && q.options.length > 0 && (
                  <div className="space-y-1.5 text-xs text-slate-600 font-semibold pl-2">
                    {q.options.slice(0, 4).map((opt, oIdx) => (
                      <div key={oIdx} className="p-2 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between gap-4">
                        <span>
                          <strong className="text-indigo-700 font-black mr-1.5">{['a', 'b', 'c', 'd'][oIdx]})</strong> 
                          <MathText text={opt} />
                        </span>
                        <span className="text-[9px] uppercase font-semibold text-slate-400 tracking-wide select-none">
                          Chuẩn mệnh đề
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="bg-emerald-50/20 border border-emerald-100 p-3 rounded-xl text-xs text-slate-600 space-y-1">
                  <div className="flex items-center gap-1.5 text-emerald-800 font-black">
                    <CheckSquare className="w-4 h-4 text-emerald-600" />
                    <span>Hướng dẫn Giải và Đáp án đúng:</span>
                  </div>
                  
                  <div className="p-2 bg-white rounded-lg border border-emerald-50 text-[11px] font-medium space-y-1.5 text-slate-700">
                    <p>
                      <strong className="text-emerald-700 font-black">Đáp án chuẩn:</strong>{' '}
                      {q.type === 'YESNO'
                        ? q.answer.split(',').map((ans, aIdx) => `${['a', 'b', 'c', 'd'][aIdx]} (${ans === 'true' ? 'Đúng' : 'Sai'})`).join(', ')
                        : q.type === 'MCQ'
                        ? ['A', 'B', 'C', 'D'][parseInt(q.answer)] || q.answer
                        : q.answer}
                    </p>
                    <p className="border-t border-dashed border-slate-100 pt-1.5 text-slate-500 italic font-semibold">
                      <MathText text={q.explain || 'Chưa cung cấp giải thích.'} />
                    </p>
                  </div>
                </div>
              </div>
            ))}

            {filteredQuestions.length === 0 && (
              <div className="bg-white text-center py-24 rounded-2xl border border-dashed border-slate-200">
                <Search className="w-12 h-12 text-slate-200 mx-auto animate-pulse mb-3" />
                <p className="text-slate-400 text-sm font-extrabold uppercase">Không tìm thấy câu hỏi tương thích bộ lọc</p>
                <p className="text-xs text-slate-400/80 mt-1">Hãy thay đổi môn học, cấp lớp hoặc điều chỉnh từ khóa tìm kiếm.</p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* -----------------------------------------------------------------
          EXPLORER MODAL: KHO CÂU HỎI MA TRẬN PHÂN BỐ KHOA HỌC
          ----------------------------------------------------------------- */}
      {isExplorerOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <div className="bg-white w-full max-w-5xl h-[85vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 animate-in fade-in duration-250">
              
              {/* MODAL HEADER */}
              <div className="p-4 bg-gradient-to-r from-indigo-700 to-indigo-850 text-white flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <Library className="w-6 h-6 text-indigo-200" />
                  <div>
                    <h2 className="text-sm font-black uppercase tracking-wider text-indigo-100">Khám Phá Sơ Đồ Phân Phối Kho Câu Hỏi</h2>
                    <p className="text-[10px] text-indigo-200/90 font-bold mt-0.5">
                      Phân chia chi tiết theo ma trận môn học, lớp rèn luyện, liên kết bài giảng khoa học
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsExplorerOpen(false)}
                  className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg cursor-pointer border-none transition-all text-xs font-black"
                >
                  Đóng sơ đồ ✕
                </button>
              </div>

              {/* BAR: SUBJECT & GRADE SELECTION BAR */}
              <div className="p-3 bg-indigo-50 border-b border-indigo-100 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 text-xs font-extrabold text-slate-700">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 font-bold uppercase text-[9px] min-w-[60px]">Môn học:</span>
                  <div className="flex bg-slate-200/60 p-1 rounded-xl">
                    {['Toán', 'Tin học', 'Vật lý'].map(su => (
                      <button
                        key={su}
                        type="button"
                        onClick={() => {
                          setExplorerSub(su);
                          setSelectedNode(null);
                          setExplorerSelectedQuestionIds([]);
                        }}
                        className={`px-3 py-1 text-[10px] font-black rounded-lg transition-all border-none cursor-pointer ${
                          explorerSub === su ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-655 hover:text-slate-900 bg-transparent'
                        }`}
                      >
                        {su === 'Toán' ? 'Toán Học' : su === 'Tin học' ? 'Tin Học' : 'Vật lý'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-slate-400 font-bold uppercase text-[9px]">Cấp lớp:</span>
                  <div className="flex bg-slate-200/60 p-1 rounded-xl">
                    {['6', '7', '8', '9'].map(gr => (
                      <button
                        key={gr}
                        type="button"
                        onClick={() => {
                          setExplorerGrade(gr);
                          setSelectedNode(null);
                          setExplorerSelectedQuestionIds([]);
                        }}
                        className={`px-3 py-1 text-[10px] font-black rounded-lg transition-all border-none cursor-pointer ${
                          explorerGrade === gr ? 'bg-indigo-650 text-white shadow-xs' : 'text-slate-655 hover:text-slate-900 bg-transparent'
                        }`}
                      >
                        Lớp {gr}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* CORE SPLIT COLUMNS CONTAINER */}
              <div className="flex-1 flex overflow-hidden min-h-0 min-w-0 bg-slate-50/50">
                
                {/* LEFT COLUMN: INTERACTIVE SYLLABUS DIRECTORY TREE */}
                <div className="w-1/2 p-4 overflow-y-auto border-r border-slate-200 space-y-4">
                  <div className="flex items-center justify-between text-slate-400 uppercase text-[9px] font-black tracking-wider pb-1.5 border-b border-dashed">
                    <span>Mục lục sơ đồ bài học</span>
                    <span>Hệ số thống kê</span>
                  </div>

                  <div className="space-y-2">
                    
                    {/* NODE: CHƯA PHÂN PHỐI (UNASSIGNED) */}
                    <button
                      onClick={() => setSelectedNode({ chapterId: 'ch-unassigned', lessonId: 'le-general' })}
                      className={`w-full p-2.5 rounded-xl border text-left cursor-pointer transition-all flex items-center justify-between gap-2 ${
                        (selectedNode && selectedNode.chapterId === 'ch-unassigned') || (!selectedNode && unassignedQs.length > 0)
                          ? 'bg-rose-50 border-rose-200 text-rose-800'
                          : 'bg-white hover:bg-rose-50/20 border-slate-200 text-slate-600'
                      }`}
                    >
                      <span className="flex items-center gap-2 font-extrabold text-xs">
                        <AlertCircle className={`w-4 h-4 ${unassignedQs.length > 0 ? 'text-rose-500 shrink-0' : 'text-slate-450'}`} />
                        Chung / Chưa phân phối (Chờ gán)
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${unassignedQs.length > 0 ? 'bg-rose-200 text-rose-900 animate-pulse' : 'bg-slate-100 text-slate-400'}`}>
                        {unassignedQs.length} câu
                      </span>
                    </button>

                    {/* STRUCTURED SYLLABUS NODES */}
                    {syllabusStructure.length === 0 ? (
                      <div className="p-8 text-center text-slate-400 text-xs font-semibold bg-white rounded-xl border border-dashed">
                        Không tìm thấy cấu trúc giáo trình cho môn này ở Lớp {explorerGrade}.
                      </div>
                    ) : (
                      syllabusStructure.map((ch, chIdx) => {
                        const isExpanded = explorerExpandedChapters.includes(ch.id) || chIdx === 0; // Default first expanded
                        const toggleExpand = () => {
                          if (explorerExpandedChapters.includes(ch.id)) {
                            setExplorerExpandedChapters(explorerExpandedChapters.filter(id => id !== ch.id));
                          } else {
                            setExplorerExpandedChapters([...explorerExpandedChapters, ch.id]);
                          }
                        };

                        return (
                          <div key={ch.id} className="bg-white border rounded-xl overflow-hidden shadow-xs">
                            {/* CHAPTER ACCORDION HEADER */}
                            <div className="p-2.5 bg-slate-50/80 border-b flex items-center justify-between gap-2">
                              <button
                                onClick={toggleExpand}
                                className="flex items-center gap-1.5 text-left border-none bg-transparent cursor-pointer font-black text-xs text-slate-750 min-w-0"
                              >
                                {isExpanded ? <ChevronDown className="w-4 h-4 shrink-0 text-slate-400" /> : <ChevronRight className="w-4 h-4 shrink-0 text-slate-400" />}
                                <FolderOpen className="w-4 h-4 text-amber-500 shrink-0" />
                                <span className="truncate">{ch.title}</span>
                              </button>
                              <span className="px-2 py-0.5 bg-slate-200/60 rounded-full text-[10px] font-extrabold text-slate-650 shrink-0">
                                {ch.chQsCount} câu
                              </span>
                            </div>

                            {/* LESSONS LIST INSIDE Expanded chapter */}
                            {isExpanded && (
                              <div className="divide-y text-xs">
                                
                                {/* OPTION Chapter Gen */}
                                <button
                                  onClick={() => setSelectedNode({ chapterId: ch.id, lessonId: 'le-general' })}
                                  className={`w-full p-2 pl-8.5 hover:bg-indigo-50/30 text-left cursor-pointer flex items-center justify-between text-[11px] font-bold ${
                                    selectedNode && selectedNode.chapterId === ch.id && selectedNode.lessonId === 'le-general'
                                      ? 'bg-indigo-50/85 text-indigo-700 font-extrabold border-l-3 border-indigo-600 pl-7.5'
                                      : 'text-slate-500 bg-white border-none'
                                  }`}
                                >
                                  <span>↳ Chuyên đề chung toàn chương</span>
                                  <span className="text-[10px] text-slate-400">{ch.generalChCount} câu</span>
                                </button>

                                {ch.lessonsStructure.map(le => (
                                  <button
                                    key={le.id}
                                    onClick={() => setSelectedNode({ chapterId: ch.id, lessonId: le.id })}
                                    className={`w-full p-2.5 pl-8.5 hover:bg-indigo-50/30 text-left cursor-pointer flex items-center justify-between text-[11px] font-bold ${
                                      selectedNode && selectedNode.chapterId === ch.id && selectedNode.lessonId === le.id
                                        ? 'bg-indigo-50/85 text-indigo-700 font-extrabold border-l-3 border-indigo-600 pl-7.5'
                                        : 'text-slate-650 bg-white border-none'
                                    }`}
                                  >
                                    <span className="truncate">{le.title}</span>
                                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${le.count > 0 ? 'bg-indigo-100 text-indigo-805' : 'bg-slate-50 text-slate-400 border'}`}>
                                      {le.count} câu
                                    </span>
                                  </button>
                                ))}
                              </div>
                            )}

                          </div>
                        );
                      })
                    )}

                  </div>
                </div>

                {/* RIGHT COLUMN: QUESTIONS LIST IN SELECTED CORE NODE */}
                <div className="w-1/2 p-4 flex flex-col overflow-hidden min-w-[280px]">
                  
                  {/* Selected Location Title bar */}
                  <div className="mb-3 shrink-0 flex items-center justify-between border-b pb-2">
                    <div>
                      <span className="text-[9px] text-slate-400 uppercase font-black">Địa điểm bài rèn luyện</span>
                      <h3 className="text-xs font-black text-slate-850 pr-2 truncate">{viewTitle || 'Vui lòng chọn'}</h3>
                    </div>

                    {activeExplorerQs.length > 0 && (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            const seen = new Set<string>();
                            const duplicateIds: string[] = [];
                            activeExplorerQs.forEach((q) => {
                              const cleaned = q.content.trim().toLowerCase().replace(/\s+/g, '');
                              if (seen.has(cleaned)) {
                                duplicateIds.push(q.id);
                              } else {
                                seen.add(cleaned);
                              }
                            });
                            if (duplicateIds.length === 0) {
                              if (showToast) {
                                showToast("Tuyệt vời! Không tìm thấy câu hỏi trùng lặp nào trong phần này.", "info");
                              } else {
                                alert("Tuyệt vời! Không tìm thấy câu hỏi trùng lặp nào trong phần này.");
                              }
                            } else {
                              if (window.confirm(`Tìm thấy ${duplicateIds.length} câu hỏi trùng lặp trong mục này. Bạn có muốn xóa chúng và giữ lại một bản duy nhất?`)) {
                                onDeleteQuestion(duplicateIds);
                                if (showToast) {
                                  showToast(`Đã lọc trùng thành công! Đã loại bỏ ${duplicateIds.length} câu hỏi lặp khỏi mục này.`, "success");
                                }
                              }
                            }
                          }}
                          className="p-1 px-2.5 bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 font-extrabold text-[10px] rounded-lg cursor-pointer transition-all flex items-center gap-1.5"
                          title="Lọc và xóa các câu hỏi trùng lặp trong mục này"
                        >
                          <Copy className="w-3 h-3 text-amber-600" />
                          Lọc trùng ({activeExplorerQs.length})
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            const ids = activeExplorerQs.map(q => q.id);
                            onDeleteQuestion(ids);
                          }}
                          className="p-1 px-2.5 bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 font-extrabold text-[10px] rounded-lg cursor-pointer transition-all flex items-center gap-1.5"
                          title="Xóa tất cả câu hỏi của bài này"
                        >
                          <Trash className="w-3 h-3 text-rose-600" />
                          Xoá hết ({activeExplorerQs.length})
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            // Close explorer and apply these exact filters in the main view!
                            if (selectedNode) {
                              setFilterSub(explorerSub);
                              setFilterGrade(explorerGrade);
                              if (selectedNode.chapterId === 'ch-unassigned') {
                                setFilterChapterId('ch-general');
                                setFilterLessonId('le-general');
                              } else {
                                setFilterChapterId(selectedNode.chapterId);
                                setFilterLessonId(selectedNode.lessonId);
                              }
                            } else {
                              setFilterSub(explorerSub);
                              setFilterGrade(explorerGrade);
                            }
                            setIsExplorerOpen(false);
                          }}
                          className="p-1 px-2.5 bg-indigo-50 text-indigo-750 border border-indigo-150 hover:bg-indigo-100 font-extrabold text-[10px] rounded-lg cursor-pointer transition-all flex items-center gap-1"
                        >
                          Lọc ngoài chính ➜
                        </button>
                      </div>
                    )}
                  </div>

                  {/* List of Questions inside right column */}
                  <div className="flex-1 overflow-y-auto pr-1 space-y-2 min-h-0 min-w-0">
                    
                    {activeExplorerQs.length === 0 ? (
                      <div className="py-20 text-center text-slate-405 text-xs font-semibold bg-white rounded-xl border border-dashed">
                        Chưa có câu hỏi nào trong bài này.
                        <p className="text-[10px] text-slate-400/80 mt-1">Soạn thủ công hoặc tải tệp TXT và chỉ định bài này.</p>
                      </div>
                    ) : (
                      activeExplorerQs.map((eq: Question, idx) => {
                        const isChecked = explorerSelectedQuestionIds.includes(eq.id);
                        return (
                          <div key={eq.id || idx} className="bg-white p-3 rounded-xl border border-slate-205 text-xs space-y-2 relative shadow-xs">
                            <div className="flex items-start gap-2">
                              {(selectedNode?.chapterId === 'ch-unassigned' || !selectedNode) && (
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => {
                                    if (isChecked) {
                                      setExplorerSelectedQuestionIds(explorerSelectedQuestionIds.filter(id => id !== eq.id));
                                    } else {
                                      setExplorerSelectedQuestionIds([...explorerSelectedQuestionIds, eq.id]);
                                    }
                                  }}
                                  className="mt-1 w-3.5 h-3.5 text-indigo-600 rounded border-slate-300"
                                />
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="font-extrabold text-slate-700 leading-relaxed">
                                  <span className="text-indigo-605 font-black mr-1 uppercase">[{eq.level}]:</span>
                                  <MathText text={eq.content} />
                                </p>
                                <p className="text-[9.5px] text-slate-400 font-medium mt-1">
                                  Dạng: <strong className="text-slate-500">{eq.type}</strong> | Đáp án: <strong className="text-slate-600">{eq.type === 'MCQ' ? ['A', 'B', 'C', 'D'][parseInt(eq.answer)] || eq.answer : eq.answer}</strong>
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}

                  </div>

                  {/* UTILITY: MOVE QUESTIONS PANEL FOR UNASSIGNED ONES */}
                  {(selectedNode?.chapterId === 'ch-unassigned' || !selectedNode) && activeExplorerQs.length > 0 && (
                    <div className="mt-3 shrink-0 p-3 bg-indigo-50 rounded-2xl border border-indigo-150 space-y-2">
                      <div className="flex items-center justify-between text-[10px] font-black uppercase text-indigo-850">
                        <span className="flex items-center gap-1">
                          <RefreshCw className="w-3.5 h-3.5 text-indigo-750 animate-spin" />
                          Gán phân phối nhanh ({explorerSelectedQuestionIds.length} câu chọn)
                        </span>
                        <button
                          onClick={() => {
                            const allIds = activeExplorerQs.map(q => q.id);
                            if (explorerSelectedQuestionIds.length === allIds.length) {
                              setExplorerSelectedQuestionIds([]);
                            } else {
                              setExplorerSelectedQuestionIds(allIds);
                            }
                          }}
                          className="text-[9px] text-indigo-650 hover:underline border-none cursor-pointer p-0 bg-transparent"
                        >
                          {explorerSelectedQuestionIds.length === activeExplorerQs.length ? 'Bỏ chọn hết' : 'Chọn tất cả'}
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-1.5 text-[10px] font-bold text-slate-600">
                        <div>
                          <label className="block mb-0.5 text-slate-400 text-[8px] font-extrabold">Chọn Chương Đích</label>
                          <select
                            value={explorerMoveTargetChapter}
                            onChange={(e) => {
                              setExplorerMoveTargetChapter(e.target.value);
                              setExplorerMoveTargetLesson('');
                            }}
                            className="w-full text-[10px] p-1.5 bg-white border border-slate-200 rounded-lg outline-none font-bold"
                          >
                            <option value="">-- Chọn Chương học --</option>
                            {syllabusStructure.map(ch => (
                              <option key={ch.id} value={ch.id}>{ch.title}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block mb-0.5 text-slate-400 text-[8px] font-extrabold">Chọn Bài Đích</label>
                          <select
                            disabled={!explorerMoveTargetChapter}
                            value={explorerMoveTargetLesson}
                            onChange={(e) => setExplorerMoveTargetLesson(e.target.value)}
                            className="w-full text-[10px] p-1.5 bg-white disabled:bg-slate-100 border border-slate-200 rounded-lg outline-none font-bold"
                          >
                            <option value="le-general">Chuyên đề chung của chương</option>
                            {syllabusStructure
                              .find(c => c.id === explorerMoveTargetChapter)
                              ?.lessonsStructure.map(le => (
                                <option key={le.id} value={le.id}>{le.title}</option>
                              ))
                            }
                          </select>
                        </div>
                      </div>

                      <button
                        onClick={handleMoveQuestions}
                        disabled={explorerSelectedQuestionIds.length === 0 || !explorerMoveTargetChapter}
                        className="w-full py-2 bg-indigo-650 disabled:bg-slate-300 hover:bg-indigo-750 text-white border-none rounded-xl font-black text-xs cursor-pointer shadow-sm flex items-center justify-center gap-1"
                      >
                        <ArrowRight className="w-3.5 h-3.5" />
                        Đồng bộ phân bổ mới ({explorerSelectedQuestionIds.length} câu)
                      </button>

                    </div>
                  )}

                </div>

              </div>

            </div>
          </div>
      )}

    </div>
  </div>
  );
}
