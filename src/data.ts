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
      { id: 's-01', name: 'Nguyễn Hoàng Long', avgScore: 8.5, completed: 4 },
      { id: 's-02', name: 'Trần Thị Mỹ Linh', avgScore: 7.2, completed: 4 },
      { id: 's-03', name: 'Phạm Minh Đức', avgScore: 9.0, completed: 3 },
      { id: 's-04', name: 'Lê Thanh Hải', avgScore: 5.5, completed: 4 }
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
      { id: 's-05', name: 'Vũ Quốc Trung', avgScore: 8.0, completed: 2 },
      { id: 's-06', name: 'Nguyễn Mai Chi', avgScore: 9.5, completed: 2 },
      { id: 's-07', name: 'Đỗ Tiến Đạt', avgScore: 6.0, completed: 2 }
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
      { id: 's-08', name: 'Phùng Bảo Châu', avgScore: 9.8, completed: 3 },
      { id: 's-09', name: 'Nguyễn Gia Huy', avgScore: 8.9, completed: 3 }
    ]
  }
];

export const DEFAULT_SYLLABUS: Syllabus[] = [
  {
    id: 'sy-01',
    grade: '6',
    subject: 'Toán',
    book: 'Kết nối tri thức',
    semester: '1',
    periods: '4',
    chapters: [
      {
        id: 'ch-01',
        title: 'Chương 1: Tập hợp các số tự nhiên',
        lessons: [
          { id: 'le-01', title: 'Bài 1: Tập hợp. Phần tử của tập hợp', topics: ['Khái niệm tập hợp', 'Ký hiệu thuộc, không thuộc'] },
          { id: 'le-02', title: 'Bài 2: Tập hợp các số tự nhiên', topics: ['Biểu diễn số tự nhiên', 'Thứ tự trong tập hợp'] },
          { id: 'le-03', title: 'Bài 3: Phép cộng và phép trừ số tự nhiên', topics: ['Tính chất phép cộng', 'Phép toán trừ'] }
        ]
      },
      {
        id: 'ch-02',
        title: 'Chương 2: Tính chia hết trong tập hợp các số tự nhiên',
        lessons: [
          { id: 'le-04', title: 'Bài 4: Quan hệ chia hết và tính chất', topics: ['Quan hệ chia hết', 'Tính chất chia hết của một tổng'] },
          { id: 'le-05', title: 'Bài 5: Dấu hiệu chia hết cho 2, cho 5', topics: ['Dấu hiệu chia hết', 'Ứng dụng thực tế'] }
        ]
      }
    ]
  },
  {
    id: 'sy-02',
    grade: '8',
    subject: 'Tin học',
    book: 'Kết nối tri thức',
    semester: '1',
    periods: '1',
    chapters: [
      {
        id: 'ch-03',
        title: 'Chương 1: Máy tính và cộng đồng',
        lessons: [
          { id: 'le-06', title: 'Bài 1: Lịch sử phát triển máy tính', topics: ['Các thế hệ máy tính', 'Đặc điểm thiết kế phần cứng'] },
          { id: 'le-07', title: 'Bài 2: Thông tin trong môi trường số', topics: ['Độ tin cậy của thông tin', 'Xác thực tài liệu số'] }
        ]
      },
      {
        id: 'ch-04',
        title: 'Chương 2: Tổ chức lưu trữ, tìm kiếm và trao đổi thông tin',
        lessons: [
          { id: 'le-08', title: 'Bài 3: Tìm kiếm thông tin trên Internet', topics: ['Sử dụng từ khóa nâng cao', 'Lọc kết quả tìm kiếm'] }
        ]
      }
    ]
  },
  {
    id: 'sy-03',
    grade: '9',
    subject: 'Toán',
    book: 'Kết nối tri thức',
    semester: '1',
    periods: '4',
    chapters: [
      {
        id: 'ch-05',
        title: 'Chương 1: Phương trình và hệ phương trình bậc nhất',
        lessons: [
          { id: 'le-09', title: 'Bài 1: Phương trình quy về phương trình bậc nhất một ẩn', topics: ['Phương trình tích', 'Phương trình chứa ẩn ở mẫu'] },
          { id: 'le-10', title: 'Bài 2: Phương trình bậc nhất hai ẩn và hệ hai phương trình bậc nhất hai ẩn', topics: ['Hệ phương trình', 'Phương pháp thế'] }
        ]
      },
      {
        id: 'ch-06',
        title: 'Chương 2: Căn bậc hai và căn bậc ba',
        lessons: [
          { id: 'le-11', title: 'Bài 3: Căn bậc hai và căn thức bậc hai', topics: ['Khai căn', 'Hằng đẳng thức'] }
        ]
      }
    ]
  }
];

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
    chapterId: 'ch-03',
    lessonId: 'le-06',
    topic: 'Các thế hệ máy tính',
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
    chapterId: 'ch-03',
    lessonId: 'le-07',
    topic: 'Độ tin cậy của thông tin',
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
