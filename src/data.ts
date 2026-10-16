/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Class, Syllabus, Question, Exam, Assignment, Submission } from './types';

export const DEFAULT_CLASSES: Class[] = [
  {
    id: 'c-01',
    name: 'Lớp 6A1 - Toán',
    grade: '6',
    subject: 'Toán',
    book: 'Kết nối tri thức',
    joinCode: 'TOAN6A1',
    joinPass: '123456',
    students: [
      { id: 's-01', name: 'Nguyễn Hoàng Long', password: 'nguyenhoanglong', avgScore: 8.5, completed: 4 },
      { id: 's-02', name: 'Trần Thị Mỹ Linh', password: 'tranthimylinh', avgScore: 7.2, completed: 4 },
      { id: 's-03', name: 'Phạm Minh Đức', password: 'phamminhduc', avgScore: 9.0, completed: 3 },
      { id: 's-04', name: 'Lê Thanh Hải', password: 'lethanhhai', avgScore: 5.5, completed: 4 }
    ]
  },
  {
    id: 'c-02',
    name: 'Lớp 8B2 - Tin học',
    grade: '8',
    subject: 'Tin học',
    book: 'Kết nối tri thức',
    joinCode: 'TIN8B2',
    joinPass: '123456',
    students: [
      { id: 's-05', name: 'Vũ Quốc Trung', password: 'vuquoctrung', avgScore: 8.0, completed: 2 },
      { id: 's-06', name: 'Nguyễn Mai Chi', password: 'nguyenmaichi', avgScore: 9.5, completed: 2 },
      { id: 's-07', name: 'Đỗ Tiến Đạt', password: 'dotiendat', avgScore: 6.0, completed: 2 }
    ]
  },
  {
    id: 'c-03',
    name: 'Lớp 9C1 - Toán Chuyên sâu',
    grade: '9',
    subject: 'Toán',
    book: 'Kết nối tri thức',
    joinCode: 'TOAN9C1',
    joinPass: '123456',
    students: [
      { id: 's-08', name: 'Phùng Bảo Châu', password: 'phungbaochau', avgScore: 9.8, completed: 3 },
      { id: 's-09', name: 'Nguyễn Gia Huy', password: 'nguyengiahuy', avgScore: 8.9, completed: 3 }
    ]
  }
];

import { FULL_SYLLABUS_CATALOG } from './data/syllabusCatalog';

export const DEFAULT_SYLLABUS: Syllabus[] = FULL_SYLLABUS_CATALOG;



export const DEFAULT_QUESTIONS: Question[] = [
  // TOÁN 6 - CHƯƠNG 1
  {
    id: 'q-01',
    grade: '6',
    subject: 'Toán',
    book: 'Kết nối tri thức',
    chapterId: 'ch-01',
    lessonId: 'le-01',
    topic: 'Khái niệm tập hợp',
    type: 'MCQ',
    content: 'Cho tập hợp $A = \\{x \\in \\mathbb{N} \\mid 3 < x \\le 8\\}$. Viết tập hợp A dưới dạng liệt kê các phần tử.',
    options: [
      'A = {3; 4; 5; 6; 7; 8}',
      'A = {4; 5; 6; 7; 8}',
      'A = {4; 5; 6; 7}',
      'A = {3; 4; 5; 6; 7}'
    ],
    answer: '1',
    explain: 'Các số tự nhiên lớn hơn 3 và nhỏ hơn hoặc bằng 8 là: 4, 5, 6, 7, 8. Do đó $A = \\{4; 5; 6; 7; 8\\}$.',
    level: 'Nhận biết',
    source: 'Giáo viên',
    status: 'Đã duyệt'
  },
  {
    id: 'q-02',
    grade: '6',
    subject: 'Toán',
    book: 'Kết nối tri thức',
    chapterId: 'ch-01',
    lessonId: 'le-02',
    topic: 'Thứ tự trong tập hợp',
    type: 'MCQ',
    content: 'Tìm số tự nhiên liền sau của số $2026$.',
    options: ['2025', '2027', '2028', '2026'],
    answer: '1',
    explain: 'Số liền sau của một số tự nhiên n là n + 1. Vậy liền sau của 2026 là 2027.',
    level: 'Nhận biết',
    source: 'Giáo viên',
    status: 'Đã duyệt'
  },
  {
    id: 'q-03',
    grade: '6',
    subject: 'Toán',
    book: 'Kết nối tri thức',
    chapterId: 'ch-01',
    lessonId: 'le-03',
    topic: 'Tính chất phép cộng',
    type: 'MCQ',
    content: 'Tính nhanh tổng sau bằng cách hợp lý nhất: $28 + 145 + 72$.',
    options: ['(28 + 72) + 145 = 245', '(28 + 145) + 72 = 245', '28 + (145 + 72) = 245', 'Cách nào cũng nhanh như nhau'],
    answer: '0',
    explain: 'Sử dụng tính chất giao hoán và kết hợp của phép cộng: ghép nhóm (28 + 72) tròn trăm.',
    level: 'Thông hiểu',
    source: 'Giáo viên',
    status: 'Đã duyệt'
  },
  // TOÁN 6 - ĐÚNG SAI 4 Ý
  {
    id: 'q-04',
    grade: '6',
    subject: 'Toán',
    book: 'Kết nối tri thức',
    chapterId: 'ch-01',
    lessonId: 'le-01',
    topic: 'Ký hiệu thuộc, không thuộc',
    type: 'YESNO',
    content: 'Cho hai tập hợp: $A = \\{2; 4; 6; 8\\}$ và $B = \\{x \\in \\mathbb{N}^* \\mid x \\le 5\\}$. Xét tính đúng/sai của các mệnh đề sau:',
    options: [
      'Mệnh đề a) Số $2$ vừa thuộc tập hợp A, vừa thuộc tập hợp B.',
      'Mệnh đề b) Số $5$ thuộc tập hợp B nhưng không thuộc tập hợp A.',
      'Mệnh đề c) Số $8$ thuộc tập hợp B.',
      'Mệnh đề d) Số $0$ là phần tử của cả hai tập hợp A và B.'
    ],
    answer: 'true,true,false,false',
    explain: 'A = {2; 4; 6; 8}, B = {1; 2; 3; 4; 5}. a) 2 là phần tử chung -> Đúng; b) 5 thuộc B, 5 không thuộc A -> Đúng; c) 8 thuộc B là Sai; d) 0 không thuộc B vì x thuộc N* -> Sai.',
    level: 'Vận dụng',
    source: 'AI',
    status: 'Đã duyệt'
  },
  // TIN HỌC 8
  {
    id: 'q-05',
    grade: '8',
    subject: 'Tin học',
    book: 'Kết nối tri thức',
    chapterId: 'inf-ch1-8',
    lessonId: 'inf-le1-8',
    topic: 'Chủ đề 1. Máy tính và cộng đồng - Bài 1. Lược sử công cụ tính toán',
    type: 'MCQ',
    content: 'Thế hệ máy tính thứ hai (1955-1965) sử dụng linh kiện điện tử lõi nào sau đây?',
    options: ['Ống chân không', 'Bóng bán dẫn (Transistor)', 'Vi mạch tích hợp (IC)', 'Bộ vi xử lý cực lớn (VLSI)'],
    answer: '1',
    explain: 'Máy tính thế hệ thứ hai dùng bóng bán dẫn để thay thế ống chân không tỏa nhiệt lớn.',
    level: 'Nhận biết',
    source: 'Giáo viên',
    status: 'Đã duyệt'
  },
  {
    id: 'q-06',
    grade: '8',
    subject: 'Tin học',
    book: 'Kết nối tri thức',
    chapterId: 'inf-ch2-8',
    lessonId: 'inf-le2-8',
    topic: 'Chủ đề 2. Tổ chức lưu trữ, tìm kiếm và trao đổi thông tin - Bài 2. Thông tin trong môi trường số',
    type: 'MCQ',
    content: 'Hành động nào dưới đây giúp tăng độ an toàn và độ tin cậy khi tiếp nhận thông tin từ internet?',
    options: [
      'Tin tưởng hoàn toàn các bài đăng có lượt chia sẻ cao',
      'Kiểm chứng thông tin trên các kênh báo chí chính thống của chính phủ',
      'Chia sẻ ngay lập tức tin hot để người thân cảnh giác',
      'Lưu trữ tất cả các quảng cáo được hiển thị tự động'
    ],
    answer: '1',
    explain: 'Cần đối chiếu nguồn tin từ cơ quan chính thức hoặc bài báo khoa học uy tín trước khi tin cậy.',
    level: 'Thông hiểu',
    source: 'Giáo viên',
    status: 'Đã duyệt'
  },
  // TOÁN 9
  {
    id: 'q-07',
    grade: '9',
    subject: 'Toán',
    book: 'Kết nối tri thức',
    chapterId: 'ch-05',
    lessonId: 'le-09',
    topic: 'Phương trình tích',
    type: 'MCQ',
    content: 'Giải phương trình sau trên tập số thực: $(x - 3)(2x + 4) = 0$.',
    options: [
      'x = 3 hoặc x = 2',
      'x = 3 hoặc x = -2',
      'x = -3 hoặc x = -2',
      'Phương trình vô nghiệm'
    ],
    answer: '1',
    explain: 'Ta có $x - 3 = 0 \\Leftrightarrow x = 3$. Hoặc $2x + 4 = 0 \\Leftrightarrow x = -2$.',
    level: 'Thông hiểu',
    source: 'Giáo viên',
    status: 'Đã duyệt'
  },
  {
    id: 'q-08',
    grade: '9',
    subject: 'Toán',
    book: 'Kết nối tri thức',
    chapterId: 'ch-05',
    lessonId: 'le-10',
    topic: 'Phương pháp thế',
    type: 'SHORT',
    content: 'Tìm nghiệm y của hệ phương trình sau: $\\begin{cases} x - y = 3 \\\\ 2x + y = 9 \\end{cases}$. Nhập kết quả dưới dạng số nguyên.',
    options: [],
    answer: '1',
    explain: 'Cộng hai vế: $3x = 12 \\Rightarrow x = 4$. Thế vào pt thứ nhất: $4 - y = 3 \\Rightarrow y = 1$.',
    level: 'Vận dụng',
    source: 'Giáo viên',
    status: 'Đã duyệt'
  },
  {
    id: 'q-09',
    grade: '9',
    subject: 'Toán',
    book: 'Kết nối tri thức',
    chapterId: 'ch-06',
    lessonId: 'le-11',
    topic: 'Khai căn',
    type: 'ESSAY',
    content: 'Rút gọn biểu thức sau và viết quy trình chứng minh chi tiết: $M = \\sqrt{(3 - \\sqrt{5})^2} + \\sqrt{5}$.',
    options: [],
    answer: 'M = 3',
    explain: '$M = |3 - \\sqrt{5}| + \\sqrt{5}$. Vì $3 = \\sqrt{9} > \\sqrt{5}$ nên $3 - \\sqrt{5} > 0$. Do đó $M = 3 - \\sqrt{5} + \\sqrt{5} = 3$.',
    level: 'Vận dụng cao',
    source: 'Giáo viên',
    status: 'Đã duyệt'
  },
  // KHO CÂU HỎI TIN HỌC THCS (DI CHUYỂN SANG HỆ THỐNG CHUNG)
  {
    id: 'inf-q-g6-1',
    grade: '6',
    subject: 'Tin học',
    book: 'Kết nối tri thức',
    chapterId: 'inf-ch1-6',
    lessonId: 'inf-le1-6',
    topic: 'Chủ đề 1. Máy tính và cộng đồng - Bài 1. Thông tin và dữ liệu',
    type: 'MCQ',
    content: 'Phát biểu nào sau đây là phù hợp nhất về sự khác nhau giữa "Thông tin" và "Dữ liệu"?',
    options: [
      'Thông tin là dữ liệu đã được xử lý và có ý nghĩa, còn dữ liệu là các con số, chữ viết, hình ảnh chưa được xử lý.',
      'Thông tin và dữ liệu hoàn toàn giống nhau, không có sự khác biệt.',
      'Dữ liệu luôn có ích và quan trọng hơn thông tin.',
      'Thông tin chỉ có thể được lưu trữ và truyền đạt trong nội bộ máy tính.'
    ],
    answer: '0',
    explain: 'Dữ liệu là các số liệu, ký hiệu mang tính thô sơ ban đầu. Khi dữ liệu được xử lý và mang lại nhận thức cụ thể cho con người, nó trở thành thông tin.',
    level: 'Thông hiểu',
    source: 'SGK Tin học 6',
    status: 'Đã duyệt'
  },
  {
    id: 'inf-q-g7-1',
    grade: '7',
    subject: 'Tin học',
    book: 'Kết nối tri thức',
    chapterId: 'inf-ch1-7',
    lessonId: 'inf-le1-7',
    topic: 'Chủ đề 1. Máy tính và cộng đồng - Bài 1. Thiết bị vào - ra',
    type: 'MCQ',
    content: 'Thiết bị nào sau đây vừa thực hiện chức năng thu nhận thông tin vào (input) vừa hiển thị thông tin ra (output) cho người sử dụng?',
    options: ['Bàn phím cơ học', 'Màn hình cảm ứng', 'Máy in laser', 'Loa âm thanh'],
    answer: '1',
    explain: 'Màn hình cảm ứng cho phép người dùng chạm nhấn trực tiếp để nhập dữ liệu (thiết bị vào), đồng thời tự hiển thị các khung cảnh đồ học phản hồi (thiết bị ra).',
    level: 'Nhận biết',
    source: 'SGK Tin học 7',
    status: 'Đã duyệt'
  },
  {
    id: 'inf-q-pascal',
    grade: '8',
    subject: 'Tin học',
    book: 'Kết nối tri thức',
    chapterId: 'inf-ch1-8',
    lessonId: 'inf-le1-8',
    topic: 'Chủ đề 1. Máy tính và cộng đồng - Bài 1. Lược sử công cụ tính toán',
    type: 'MCQ',
    content: 'Chiếc máy tính cơ học đầu tiên Pascaline được nhà bác học Blaise Pascal sáng chế vào năm nào?',
    options: ['Năm 1642', 'Năm 1833', 'Năm 1943', 'Năm 1945'],
    answer: '0',
    explain: 'Blaise Pascal chế tạo chiếc máy tính cơ học Pascaline vào năm 1642 khi mới chưa đầy 20 tuổi để giúp cha ông trong công việc tính thuế.',
    level: 'Nhận biết',
    source: 'SGK Tin học 8',
    status: 'Đã duyệt'
  },
  {
    id: 'inf-q-transistor',
    grade: '8',
    subject: 'Tin học',
    book: 'Kết nối tri thức',
    chapterId: 'inf-ch1-8',
    lessonId: 'inf-le1-8',
    topic: 'Chủ đề 1. Máy tính và cộng đồng - Bài 1. Lược sử công cụ tính toán',
    type: 'MCQ',
    content: 'Linh kiện điện tử cốt lõi được sử dụng trong thế hệ máy tính thứ hai (1955-1965) là gì?',
    options: ['Đèn điện tử chân không', 'Bóng bán dẫn (Transistor)', 'Mạch tích hợp IC', 'Mạch tích hợp cỡ rất lớn (VLSI)'],
    answer: '1',
    explain: 'Thế hệ máy tính thứ hai (1955-1965) sử dụng linh kiện cốt lõi là bóng bán dẫn (transistor).',
    level: 'Nhận biết',
    source: 'SGK Tin học 8',
    status: 'Đã duyệt'
  },
  {
    id: 'inf-q-g9-countif',
    grade: '9',
    subject: 'Tin học',
    book: 'Kết nối tri thức',
    chapterId: 'inf-ch4-9',
    lessonId: 'inf-le10a-9',
    topic: 'Chủ đề 4. Ứng dụng tin học - Bài 10a. Sử dụng hàm COUNTIF',
    type: 'MCQ',
    content: 'Trong phần mềm bảng tính Microsoft Excel, cú pháp chuẩn của hàm đếm theo một điều kiện cụ thể COUNTIF là gì?',
    options: [
      '=COUNTIF(criteria, range)',
      '=COUNTIF(range, criteria)',
      '=COUNTIF(range, criteria, [sum_range])',
      '=COUNTIF(criteria)'
    ],
    answer: '1',
    explain: 'Cú pháp của hàm COUNTIF là: =COUNTIF(range, criteria) trong đó range là vùng chứa các ô cần kiểm tra và criteria là điều kiện dạng số, văn bản hoặc biểu thức.',
    level: 'Thông hiểu',
    source: 'SGK Tin học 9',
    status: 'Đã duyệt'
  }
];

export const DEFAULT_EXAMS: Exam[] = [
  {
    id: 'ex-01',
    title: 'Đề kiểm tra thường xuyên - Chương 1 Toán 6',
    grade: '6',
    subject: 'Toán',
    book: 'Kết nối tri thức',
    type: 'kiểm tra thường xuyên',
    duration: 15,
    totalScore: 10,
    questions: ['q-01', 'q-02', 'q-03', 'q-04'],
    matrix: { knowledgeBlocks: [{ title: 'Số tự nhiên', questionsCount: 4, score: 10 }] },
    createdAt: '2026-05-12',
    createdBy: 'gv-demo',
    status: 'Đang dùng'
  },
  {
    id: 'ex-02',
    title: 'Đề đánh giá Giữa kỳ 1 - Tin học 8',
    grade: '8',
    subject: 'Tin học',
    book: 'Kết nối tri thức',
    type: 'giữa kỳ',
    duration: 45,
    totalScore: 10,
    questions: ['q-05', 'q-06'],
    matrix: { knowledgeBlocks: [{ title: 'Lịch sử phát triển và kỹ năng số', questionsCount: 2, score: 10 }] },
    createdAt: '2026-05-18',
    createdBy: 'gv-demo',
    status: 'Đang dùng'
  }
];

export const DEFAULT_ASSIGNMENTS: Assignment[] = [
  {
    id: 'as-01',
    examId: 'ex-01',
    classId: 'c-01',
    deadline: '2026-07-30T23:59',
    duration: 15,
    shuffleQuestions: true,
    shuffleOptions: true,
    showSolution: true,
    allowRetry: true,
    maxAttempts: 999,
    message: 'Các em chú ý đọc kỹ đề bài toán tập hợp và áp dụng chuẩn kiến thức nhé!',
    status: 'Đang làm'
  },
  {
    id: 'as-02',
    examId: 'ex-02',
    classId: 'c-02',
    deadline: '2026-07-28T18:00',
    duration: 45,
    shuffleQuestions: false,
    shuffleOptions: false,
    showSolution: true,
    allowRetry: false,
    maxAttempts: 1,
    message: 'Làm bài kiểm tra giữa kỳ nghiêm túc.',
    status: 'Đang làm'
  }
];

export const DEFAULT_SUBMISSIONS: Submission[] = [
  {
    id: 'sub-01',
    assignmentId: 'as-01',
    studentId: 's-01',
    studentName: 'Nguyễn Hoàng Long',
    answers: { 'q-01': '1', 'q-02': '1', 'q-03': '0', 'q-04': 'true,true,false,false' },
    score: 10.0,
    submittedAt: '2026-06-15T09:12:00',
    gradedBy: 'Hệ thống',
    comment: 'Rất xuất sắc! Nắm vững hoàn toàn bản chất tập hợp số tự nhiên và phương pháp tính nhanh.',
    status: 'Đã nộp'
  },
  {
    id: 'sub-02',
    assignmentId: 'as-01',
    studentId: 's-02',
    studentName: 'Trần Thị Mỹ Linh',
    answers: { 'q-01': '0', 'q-02': '1', 'q-03': '1', 'q-04': 'true,false,false,false' },
    score: 4.1,
    submittedAt: '2026-06-15T10:30:00',
    gradedBy: 'Hệ thống',
    comment: 'Cần rèn luyện thêm phép tính nhanh và viết lại các phần tử của tập hợp theo điều kiện.',
    status: 'Đã nộp'
  },
  {
    id: 'sub-03',
    assignmentId: 'as-01',
    studentId: 's-04',
    studentName: 'Lê Thanh Hải',
    answers: { 'q-01': '1', 'q-02': '2', 'q-03': '0', 'q-04': 'true,true,true,false' },
    score: 7.5,
    submittedAt: '2026-06-16T15:22:00',
    gradedBy: 'Hệ thống',
    comment: 'Có tiến bộ lớn, cố gắng phát huy ở phần mệnh đề Đúng Sai.',
    status: 'Đã nộp'
  }
];
