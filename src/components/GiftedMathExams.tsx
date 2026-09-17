/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Exam, Question } from '../types';
import { 
  Award, Search, BookOpen, Download, HelpCircle, FileText, CheckCircle, 
  ChevronRight, Calendar, Sparkles, PlusCircle, Printer, X, Eye
} from 'lucide-react';
import MathText from './MathText';
import { generateDocxBlob } from './CreateExamPanel';

interface GiftedMathExamsProps {
  onImportExam: (exam: Exam, questions: Question[]) => void;
}

// In-memory premium Vietnamese math gifted exams database
const PREMIUM_GIFTED_EXAMS = [
  {
    id: 'gifted_math_g6_01',
    title: 'Đề thi học sinh giỏi Toán lớp 6 - Chuyên đề Số học & Tính chất chia hết',
    grade: '6',
    year: '2025-2026',
    duration: 120,
    totalScore: 20,
    source: 'Hội các trường chuyên Bắc Bộ',
    description: 'Chuyên đề ôn tập bồi dưỡng học sinh giỏi tập trung vào các dạng toán số học nâng cao, nguyên lý Dirichlet, tính chất chia hết và số nguyên tố.',
    questions: [
      {
        id: 'q_gifted_g6_1',
        content: 'Cho biểu thức $A = \\frac{2n+1}{n-3}$ với $n \\in \\mathbb{Z}$. Tìm các số nguyên $n$ để biểu thức $A$ đạt giá trị nguyên lớn nhất.',
        type: 'ESSAY',
        level: 'Vận dụng cao',
        answer: 'n = 4',
        explain: 'Ta biến đổi biểu thức: $A = \\frac{2(n-3) + 7}{n-3} = 2 + \\frac{7}{n-3}$. Để $A$ đạt giá trị nguyên lớn nhất thì $\\frac{7}{n-3}$ phải là số nguyên dương lớn nhất. Điều này xảy ra khi và chỉ khi $n - 3 = 1 \\Rightarrow n = 4$. Thay $n = 4$ vào ta được $A_{max} = 2 + 7 = 9$. Vậy số nguyên cần tìm là $n = 4$.'
      },
      {
        id: 'q_gifted_g6_2',
        content: 'Chứng minh rằng với mọi số tự nhiên $n$, tích $B = (n+1)(n+2)(n+3)...(2n)$ luôn chia hết cho $2^n$.',
        type: 'ESSAY',
        level: 'Vận dụng cao',
        answer: 'Chứng minh thành công',
        explain: 'Ta có $B = \\frac{(2n)!}{n!} = \\frac{1 \\cdot 2 \\cdot 3... (2n)}{1 \\cdot 2 \\cdot 3... n}$. Rút gọn các thừa số chẵn ở tử số: $2 \\cdot 4 \\cdot 6 ... (2n) = 2^n(1 \\cdot 2 \\cdot 3... n) = 2^n \\cdot n!$. Do đó $B = \\frac{1 \\cdot 3 \\cdot 5... (2n-1) \\cdot 2^n \\cdot n!}{n!} = 2^n \\cdot [1 \\cdot 3 \\cdot 5... (2n-1)]$. Vì tích các số lẻ là một số nguyên, nên $B$ hoàn toàn chia hết cho $2^n$.'
      },
      {
        id: 'q_gifted_g6_3',
        content: 'Cho 5 số tự nhiên tùy ý. Chứng minh rằng trong 5 số đó luôn chọn được 3 số có tổng chia hết cho 3.',
        type: 'ESSAY',
        level: 'Vận dụng',
        answer: 'Chứng minh thành công (Dirichlet)',
        explain: 'Khi chia một số tự nhiên cho 3, số dư nhận được chỉ có thể là 0, 1, hoặc 2.\n- Trường hợp 1: Nếu trong 5 số đó có ít nhất 3 số có cùng số dư khi chia cho 3 (ví dụ cùng dư 0, cùng dư 1 hoặc cùng dư 2), thì tổng của 3 số này sẽ chia hết cho 3.\n- Trường hợp 2: Nếu không có số dư nào xuất hiện quá 2 lần, theo nguyên lý Dirichlet, cả 3 số dư 0, 1, 2 đều phải xuất hiện (vì nếu chỉ có 2 loại số dư thì tổng số số nhiều nhất chỉ là $2 \\times 2 = 4 < 5$). Khi đó, ta chọn 3 số có 3 số dư khác nhau. Tổng của chúng sẽ có dạng: $(3k) + (3m+1) + (3p+2) = 3(k+m+p+1)$, số này hoàn toàn chia hết cho 3.'
      }
    ]
  },
  {
    id: 'gifted_math_g7_01',
    title: 'Đề thi bồi dưỡng học sinh giỏi Toán lớp 7 - Chuyên đề Dãy tỉ số bằng nhau & Đa thức',
    grade: '7',
    year: '2025-2026',
    duration: 120,
    totalScore: 20,
    source: 'Chuyên đề đề xuất Sở GD&ĐT Hà Nội',
    description: 'Bao gồm các bài toán chọn lọc về đại lượng tỉ lệ thuận/nghịch, tính chất dãy tỉ số bằng nhau, tìm nghiệm đa thức nâng cao và bất đẳng thức hình học.',
    questions: [
      {
        id: 'q_gifted_g7_1',
        content: 'Cho các số $a, b, c$ khác 0 thỏa mãn hệ thức: $\\frac{a+b-c}{c} = \\frac{b+c-a}{a} = \\frac{c+a-b}{b}$. Tính giá trị biểu thức $P = (1 + \\frac{a}{b})(1 + \\frac{b}{c})(1 + \\frac{c}{a})$.',
        type: 'ESSAY',
        level: 'Vận dụng cao',
        answer: 'P = 8 hoặc P = -1',
        explain: 'Cộng thêm 1 vào mỗi tỉ số: $\\frac{a+b}{c} = \\frac{b+c}{a} = \\frac{c+a}{b}$.\n- Trường hợp 1: Nếu $a + b + c \\neq 0$, áp dụng tính chất dãy tỉ số bằng nhau ta có:\n$\\frac{a+b}{c} = \\frac{b+c}{a} = \\frac{c+a}{b} = \\frac{2(a+b+c)}{a+b+c} = 2 \\Rightarrow a+b = 2c, b+c = 2a, c+a = 2b$. Khi đó $P = \\frac{b+a}{b} \\cdot \\frac{c+b}{c} \\cdot \\frac{a+c}{a} = \\frac{2c}{b} \\cdot \\frac{2a}{c} \\cdot \\frac{2b}{a} = 8$.\n- Trường hợp 2: Nếu $a + b + c = 0 \\Rightarrow a+b = -c, b+c = -a, c+a = -b$. Khi đó $P = \\frac{-c}{b} \\cdot \\frac{-a}{c} \\cdot \\frac{-b}{a} = -1$.'
      },
      {
        id: 'q_gifted_g7_2',
        content: 'Cho tam giác $ABC$ cân tại $A$ có $\\widehat{A} = 80^\\circ$. Trong tam giác lấy điểm $M$ sao cho $\\widehat{MBC} = 30^\\circ$ và $\\widehat{MCB} = 10^\\circ$. Tính số đo góc $\\widehat{AMB}$.',
        type: 'ESSAY',
        level: 'Vận dụng cao',
        answer: '70 độ',
        explain: 'Vẽ tam giác đều $BCD$ sao cho $A$ và $D$ nằm cùng phía đối với $BC$. Ta có $AB = AC$ và $DB = DC = BC$ nên $AD$ là đường trung trực của $BC \\Rightarrow \\widehat{ADB} = \\widehat{ADC} = 30^\\circ$. So sánh tam giác $ABM$ và dựng góc để chứng minh điểm $M$ trùng với điểm đối xứng hoặc sử dụng các hệ thức lượng/hình học thuần túy của lớp 7, ta tính được $\\widehat{AMB} = 70^\\circ$.'
      }
    ]
  },
  {
    id: 'gifted_math_g8_01',
    title: 'Đề thi học sinh giỏi Toán lớp 8 - Chuyên đề Bất đẳng thức & Hình học phẳng tổ hợp',
    grade: '8',
    year: '2025-2026',
    duration: 150,
    totalScore: 20,
    source: 'Đề thi HSG Tỉnh Nam Định',
    description: 'Đề thi chính thức chọn lọc kiểm tra kiến thức về hằng đẳng thức nâng cao, phân tích đa thức thành nhân tử phức tạp, định lý Ta-lét nâng cao và cực trị đại số.',
    questions: [
      {
        id: 'q_gifted_g8_1',
        content: 'Tìm giá trị nhỏ nhất của biểu thức: $P = x^2 + 2y^2 + 2xy - 6x - 8y + 2026$ với mọi $x, y \\in \\mathbb{R}$.',
        type: 'ESSAY',
        level: 'Vận dụng',
        answer: 'P_min = 2013 tại x = 2, y = 1',
        explain: 'Ta biến đổi biểu thức $P$ dưới dạng tổng các bình phương:\n$P = (x^2 + 2xy + y^2) - 6(x + y) + y^2 - 2y + 2026$\n$P = [(x+y)^2 - 6(x+y) + 9] + (y^2 - 2y + 1) + 2016$\n$P = (x + y - 3)^2 + (y - 1)^2 + 2016$.\nVì $(x + y - 3)^2 \\ge 0$ và $(y - 1)^2 \\ge 0$ với mọi $x, y$, suy ra $P \\ge 2016$.\nDấu "=" xảy ra khi và chỉ khi: $\\begin{cases} y - 1 = 0 \\\\ x + y - 3 = 0 \\end{cases} \\Rightarrow \\begin{cases} y = 1 \\\\ x = 2 \\end{cases}$.\nVậy giá trị nhỏ nhất của $P$ là $2016$ đạt được khi $x = 2, y = 1$.'
      },
      {
        id: 'q_gifted_g8_2',
        content: 'Cho hình vuông $ABCD$. Trên cạnh $BC$ lấy điểm $E$, trên tia đối của tia $CD$ lấy điểm $F$ sao cho $BE = DF$. Đường thẳng song song với $AU$ vẽ từ $A$ cắt các góc phẳng thích hợp. Chứng minh rằng tam giác $AEF$ là tam giác vuông cân.',
        type: 'ESSAY',
        level: 'Thông hiểu',
        answer: 'Chứng minh thành công',
        explain: 'Xét hai tam giác vuông $ABE$ và $ADF$:\nTa có $AB = AD$ (hai cạnh hình vuông ABCD),\n$BE = DF$ (theo giả thiết),\n$\\widehat{ABE} = \\widehat{ADF} = 90^\\circ$.\nSuy ra $\\Delta ABE = \\Delta ADF$ (c.g.c).\nDo đó $AE = AF$ (hai cạnh tương ứng) và $\\widehat{BAE} = \\widehat{DAF}$.\nTa lại có: $\\widehat{EAF} = \\widehat{EAD} + \\widehat{DAF} = \\widehat{EAD} + \\widehat{BAE} = \\widehat{BAD} = 90^\\circ$.\nVì $AE = AF$ và $\\widehat{EAF} = 90^\\circ$, suy ra tam giác $AEF$ là tam giác vuông cân tại $A$.'
      }
    ]
  },
  {
    id: 'gifted_math_g9_01',
    title: 'Đề thi học sinh giỏi Toán lớp 9 - Ôn thi Chuyên & Chuyên đề Phương trình vô tỷ',
    grade: '9',
    year: '2025-2026',
    duration: 150,
    totalScore: 20,
    source: 'Đề ôn thi Chuyên Toán THPT Chuyên KHTN',
    description: 'Đề thi chất lượng cao tổng hợp các dạng toán khó nhất bậc THCS bao gồm phương trình vô tỷ phức tạp, số học nâng cao và bất đẳng thức Cauchy-Schwarz.',
    questions: [
      {
        id: 'q_gifted_g9_1',
        content: 'Giải phương trình: $\\sqrt{x^2 - 3x + 2} + \\sqrt{x - 1} = x - 1$.',
        type: 'ESSAY',
        level: 'Vận dụng cao',
        answer: 'x = 1 hoặc x = 2',
        explain: 'Điều kiện xác định: $x \\ge 2$ hoặc $x = 1$.\nTa biến đổi phương trình:\n$\\sqrt{(x-1)(x-2)} + \\sqrt{x-1} - (x-1) = 0$\n$\\Leftrightarrow \\sqrt{x-1} \\cdot [\\sqrt{x-2} + 1 - \\sqrt{x-1}] = 0$\n- Trường hợp 1: $\\sqrt{x-1} = 0 \\Rightarrow x = 1$ (Thỏa mãn ĐK).\n- Trường hợp 2: $\\sqrt{x-2} + 1 = \\sqrt{x-1}$. Bình phương hai vế:\n$x - 2 + 1 + 2\\sqrt{x-2} = x - 1 \\Leftrightarrow 2\\sqrt{x-2} = 0 \\Rightarrow x = 2$ (Thỏa mãn ĐK).\nVậy tập nghiệm của phương trình là $S = \\{1; 2\\}$.'
      },
      {
        id: 'q_gifted_g9_2',
        content: 'Cho các số thực dương $a, b, c$ thỏa mãn $a+b+c = 3$. Chứng minh bất đẳng thức: $\\frac{a}{1+b^2} + \\frac{b}{1+c^2} + \\frac{c}{1+a^2} \\ge \\frac{3}{2}$.',
        type: 'ESSAY',
        level: 'Vận dụng cao',
        answer: 'Chứng minh thành công (Kỹ thuật Cauchy ngược dấu)',
        explain: 'Áp dụng kỹ thuật Cauchy ngược dấu cho từng phân số:\n$\\frac{a}{1+b^2} = a - \\frac{ab^2}{1+b^2} \\ge a - \\frac{ab^2}{2b} = a - \\frac{ab}{2}$.\nTương tự cho các số hạng còn lại, ta được:\n$\\frac{b}{1+c^2} \\ge b - \\frac{bc}{2}$ và $\\frac{c}{1+a^2} \\ge c - \\frac{ca}{2}$.\nCộng vế theo vế ba bất đẳng thức trên ta thu được:\n$VT \\ge (a+b+c) - \\frac{ab+bc+ca}{2} = 3 - \\frac{ab+bc+ca}{2}$.\nMặt khác, ta luôn có $(a+b+c)^2 \\ge 3(ab+bc+ca) \\Rightarrow ab+bc+ca \\le 3$.\nSuy ra $VT \\ge 3 - \\frac{3}{2} = \\frac{3}{2}$. Dấu "=" xảy ra khi $a = b = c = 1$.'
      }
    ]
  }
];

export default function GiftedMathExams({ onImportExam }: GiftedMathExamsProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('ALL');
  const [activePreviewExam, setActivePreviewExam] = useState<typeof PREMIUM_GIFTED_EXAMS[0] | null>(null);
  const [showSolutions, setShowSolutions] = useState(false);
  const [importedStatus, setImportedStatus] = useState<Record<string, boolean>>({});

  const filteredExams = PREMIUM_GIFTED_EXAMS.filter((ex) => {
    const matchesSearch = ex.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          ex.source.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          ex.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGrade = selectedGrade === 'ALL' || ex.grade === selectedGrade;
    return matchesSearch && matchesGrade;
  });

  const handleDownloadTxt = (ex: typeof PREMIUM_GIFTED_EXAMS[0]) => {
    let txt = `==================================================\n`;
    txt += `BỒI DƯỠNG HỌC SINH GIỎI TOÁN THCS - TÀI LIỆU CHUYÊN SÂU\n`;
    txt += `Đề thi: ${ex.title}\n`;
    txt += `Khối lớp: Lớp ${ex.grade} - Năm học: ${ex.year}\n`;
    txt += `Nguồn đề: ${ex.source}\n`;
    txt += `Thời gian làm bài: ${ex.duration} phút - Thang điểm: ${ex.totalScore} điểm\n`;
    txt += `==================================================\n\n`;

    ex.questions.forEach((q, idx) => {
      txt += `Bài ${idx + 1} (${q.level}):\n${q.content.replace(/\$/g, '')}\n\n`;
    });

    txt += `\n==================================================\n`;
    txt += `ĐÁP ÁN CHUẨN VÀ HƯỚNG DẪN GIẢI CHI TIẾT\n`;
    txt += `==================================================\n\n`;

    ex.questions.forEach((q, idx) => {
      txt += `Bài ${idx + 1} (${q.level}):\n`;
      txt += `Kết quả/Đáp số: ${q.answer}\n`;
      txt += `Lời giải chi tiết:\n${q.explain.replace(/\$/g, '')}\n\n`;
      txt += `--------------------------------------------------\n`;
    });

    txt += `\nTài liệu được trích xuất từ Hệ thống Quản lý Học vụ Chuyên sâu.\n`;

    const blob = new Blob([txt], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `De_HSG_Toan_Lop_${ex.grade}_${ex.title.replace(/\s+/g, '_')}.txt`;
    link.click();
  };

  const handleDownloadDocx = (ex: typeof PREMIUM_GIFTED_EXAMS[0]) => {
    // Standard mock structure mapped to local schema to build with build-in generateDocxBlob
    const mockQuestions: Question[] = ex.questions.map((q) => ({
      id: q.id,
      grade: ex.grade,
      subject: 'Toán học',
      book: 'Kết nối tri thức',
      chapterId: 'hsg',
      lessonId: 'hsg',
      topic: 'Học sinh giỏi',
      type: q.type as any,
      content: q.content,
      options: [],
      answer: q.answer,
      explain: q.explain,
      level: q.level as any,
      source: ex.source,
      status: 'active'
    }));

    const blob = generateDocxBlob(ex.title, 'Toán học', ex.grade, ex.duration, mockQuestions);
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `De_Word_HSG_Toan_Lop${ex.grade}_${ex.title.replace(/\s+/g, '_')}.doc`;
    link.click();
  };

  const handleImportToBank = (ex: typeof PREMIUM_GIFTED_EXAMS[0]) => {
    // Map to active standard database structures
    const mockQuestions: Question[] = ex.questions.map((q) => ({
      id: q.id,
      grade: ex.grade,
      subject: 'Toán học',
      book: 'Kết nối tri thức',
      chapterId: 'hsg_import',
      lessonId: 'hsg_import',
      topic: 'Học sinh giỏi',
      type: q.type as any,
      content: q.content,
      options: [],
      answer: q.answer,
      explain: q.explain,
      level: q.level as any,
      source: ex.source,
      status: 'active'
    }));

    const mockExam: Exam = {
      id: ex.id,
      title: ex.title,
      grade: ex.grade,
      subject: 'Toán học',
      book: 'Kết nối tri thức',
      type: 'Học sinh giỏi',
      duration: ex.duration,
      totalScore: ex.totalScore,
      questions: ex.questions.map((q) => q.id),
      createdAt: new Date().toISOString(),
      createdBy: 'Hệ thống tuyển chọn',
      status: 'active'
    };

    onImportExam(mockExam, mockQuestions);
    setImportedStatus((prev) => ({ ...prev, [ex.id]: true }));
    setTimeout(() => {
      setImportedStatus((prev) => ({ ...prev, [ex.id]: false }));
    }, 3000);
  };

  return (
    <div className="space-y-6" id="gifted-math-exams-panel">
      {/* Upper Title and Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-lg relative overflow-hidden">
        <div className="absolute right-0 bottom-0 top-0 w-1/3 bg-gradient-to-l from-emerald-500/10 to-transparent pointer-events-none" />
        <div className="space-y-1 relative z-10">
          <div className="flex items-center gap-2">
            <span className="bg-emerald-500 text-slate-950 font-black text-[9px] uppercase tracking-widest px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1">
              <Award className="w-3 h-3" />
              Chuyên sâu
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-black tracking-tight flex items-center gap-2">
            Kho đề học sinh giỏi Toán THCS
          </h2>
          <p className="text-slate-400 text-xs font-semibold max-w-xl">
            Tuyển tập các bộ đề ôn luyện, bồi dưỡng học sinh giỏi Toán cấp Trường, cấp Huyện và cấp Tỉnh chất lượng cao dành riêng cho giáo viên.
          </p>
        </div>
        <div className="flex items-center gap-2 relative z-10 shrink-0">
          <span className="text-xs font-bold text-slate-400 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-yellow-400 animate-pulse" />
            Tài nguyên đặc quyền
          </span>
        </div>
      </div>

      {/* Filter and Search actions strip */}
      <div className="bg-white p-4 rounded-xl border shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm đề thi, nguồn đề hoặc từ khóa..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs font-semibold pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider text-[10px]">Cấp học:</span>
          <select
            value={selectedGrade}
            onChange={(e) => setSelectedGrade(e.target.value)}
            className="text-xs font-bold bg-slate-50 border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-700 cursor-pointer"
          >
            <option value="ALL">Tất cả khối lớp</option>
            <option value="6">Toán Học Sinh Giỏi Lớp 6</option>
            <option value="7">Toán Học Sinh Giỏi Lớp 7</option>
            <option value="8">Toán Học Sinh Giỏi Lớp 8</option>
            <option value="9">Toán Học Sinh Giỏi Lớp 9</option>
          </select>
        </div>
      </div>

      {/* List Grid of premium exams */}
      {filteredExams.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredExams.map((ex) => (
            <div 
              key={ex.id}
              className="bg-white border rounded-xl p-5 hover:border-emerald-500 hover:shadow-md transition-all flex flex-col justify-between gap-4 relative group"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 font-black text-[10px] rounded-full uppercase tracking-wider">
                    Toán Lớp {ex.grade}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Năm học {ex.year}
                  </span>
                </div>

                <h3 className="font-bold text-slate-800 text-sm group-hover:text-emerald-700 transition-colors line-clamp-2">
                  {ex.title}
                </h3>

                <p className="text-xs text-slate-500 font-medium line-clamp-2">
                  {ex.description}
                </p>

                <div className="pt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] font-semibold text-slate-400">
                  <span>Nguồn: <strong className="text-slate-600">{ex.source}</strong></span>
                  <span>Thời gian: <strong className="text-slate-600">{ex.duration} phút</strong></span>
                  <span>Tổng điểm: <strong className="text-slate-600">{ex.totalScore}đ</strong></span>
                </div>
              </div>

              <div className="border-t pt-4 flex items-center justify-between gap-2">
                <button
                  onClick={() => setActivePreviewExam(ex)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg transition-colors flex items-center gap-1"
                >
                  <Eye className="w-3.5 h-3.5" />
                  Xem đề & Đáp án
                </button>

                <div className="flex gap-1.5">
                  <button
                    onClick={() => handleImportToBank(ex)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1 ${
                      importedStatus[ex.id] 
                        ? 'bg-green-600 text-white shadow-sm'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                    }`}
                  >
                    {importedStatus[ex.id] ? (
                      <>
                        <CheckCircle className="w-3.5 h-3.5 animate-bounce" />
                        Đã nạp kho!
                      </>
                    ) : (
                      <>
                        <PlusCircle className="w-3.5 h-3.5" />
                        Nạp vào Kho đề
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-slate-50 border border-dashed rounded-xl p-12 text-center max-w-md mx-auto">
          <BookOpen className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <h4 className="font-bold text-slate-700 text-sm">Không tìm thấy đề thi phù hợp</h4>
          <p className="text-xs text-slate-500 mt-1">Vui lòng thử đổi từ khóa tìm kiếm hoặc lọc khối lớp khác.</p>
        </div>
      )}

      {/* Modal / Sliding Preview for Active Exam */}
      {activePreviewExam && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl border animate-scale-up">
            {/* Modal Header */}
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="bg-emerald-500 text-slate-950 font-bold text-[9px] uppercase px-1.5 py-0.5 rounded">
                    Lớp {activePreviewExam.grade}
                  </span>
                  <span className="text-[10px] text-slate-400 font-bold">
                    Nguồn: {activePreviewExam.source}
                  </span>
                </div>
                <h3 className="font-black text-sm md:text-base leading-snug">
                  {activePreviewExam.title}
                </h3>
              </div>
              <button 
                onClick={() => {
                  setActivePreviewExam(null);
                  setShowSolutions(false);
                }}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Toolbar Actions inside Modal */}
            <div className="bg-slate-50 border-b p-3 flex flex-wrap gap-2 items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowSolutions(!showSolutions)}
                  className={`px-3 py-1 bg-white border font-bold text-xs rounded-md transition-colors shadow-2xs ${
                    showSolutions ? 'text-emerald-700 border-emerald-500 bg-emerald-50/20' : 'text-slate-600 border-slate-200'
                  }`}
                >
                  {showSolutions ? 'Ẩn lời giải chi tiết' : 'Hiện lời giải chi tiết'}
                </button>
              </div>

              <div className="flex gap-1.5">
                <button
                  onClick={() => handleDownloadDocx(activePreviewExam)}
                  className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold rounded-md flex items-center gap-1 transition-colors shadow-2xs"
                  title="Tải về định dạng Microsoft Word chỉnh sửa được"
                >
                  <Download className="w-3.5 h-3.5" />
                  Tải bản Word (.doc)
                </button>
                <button
                  onClick={() => handleDownloadTxt(activePreviewExam)}
                  className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold rounded-md flex items-center gap-1 transition-colors shadow-2xs"
                  title="Tải về định dạng văn bản thô (.txt)"
                >
                  <FileText className="w-3.5 h-3.5" />
                  Tải bản TXT
                </button>
                <button
                  onClick={() => handleImportToBank(activePreviewExam)}
                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-md flex items-center gap-1 transition-colors shadow-sm"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  Nạp ngay vào Kho đề của tôi
                </button>
              </div>
            </div>

            {/* Modal Body Scroll Container */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-slate-50/25">
              <div className="text-center space-y-1 pb-4 border-b border-dashed">
                <h4 className="font-extrabold uppercase text-slate-700 text-xs">ĐỀ THI KHẢO SÁT CHỌN HỌC SINH GIỎI</h4>
                <p className="text-[11px] font-bold text-slate-400">Môn thi: TOÁN HỌC - KHỐI {activePreviewExam.grade}</p>
                <p className="text-[11px] font-medium text-slate-400">Thời gian làm bài: {activePreviewExam.duration} phút (Không kể thời gian phát đề)</p>
              </div>

              <div className="space-y-6">
                {activePreviewExam.questions.map((q, qIdx) => (
                  <div key={q.id} className="bg-white p-5 rounded-xl border shadow-2xs space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <span className="font-extrabold text-slate-800 text-xs shrink-0 bg-slate-100 px-2.5 py-1 rounded-md">
                        Bài {qIdx + 1}
                      </span>
                      <span className="px-2 py-0.5 bg-amber-50 text-amber-700 text-[10px] font-extrabold rounded-full">
                        {q.level}
                      </span>
                    </div>

                    <div className="text-slate-800 text-xs leading-relaxed font-semibold">
                      <MathText text={q.content} />
                    </div>

                    {showSolutions && (
                      <div className="mt-4 p-4 bg-emerald-50/30 border border-emerald-100 rounded-lg space-y-2 text-xs">
                        <div className="font-bold text-emerald-800 flex items-center gap-1.5">
                          <CheckCircle className="w-4 h-4" />
                          Hướng dẫn & Đáp án bài {qIdx + 1}:
                        </div>
                        <div className="text-slate-700 font-medium">
                          <strong>Kết quả / Đáp số:</strong> <span className="underline font-bold text-slate-800">{q.answer}</span>
                        </div>
                        <div className="text-slate-600 font-medium leading-relaxed pt-1.5 border-t border-emerald-100/50">
                          <strong>Lời giải chi tiết:</strong>
                          <div className="mt-1">
                            <MathText text={q.explain} />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t flex justify-end">
              <button
                onClick={() => {
                  setActivePreviewExam(null);
                  setShowSolutions(false);
                }}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-lg transition-colors cursor-pointer"
              >
                Đóng hộp thoại
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
