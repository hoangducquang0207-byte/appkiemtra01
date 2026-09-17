/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { Question, QuestionType, QuestionLevel, Syllabus } from '../types';
import MathText from './MathText';
import { 
  Plus, Search, Trash, BookOpen, Layers, CheckSquare, Sparkles, 
  Copy, Check, FileText, Upload, AlertCircle, Info, RefreshCw, CheckCircle,
  FolderOpen, ChevronRight, ChevronDown, Library, ArrowRight
} from 'lucide-react';

interface InformaticsQuestionBankProps {
  questions: Question[];
  syllabus?: Syllabus[];
  onAddQuestion: (q: Omit<Question, 'id' | 'source' | 'status'> | Omit<Question, 'id' | 'source' | 'status'>[]) => void;
  onDeleteQuestion: (id: string) => void;
  onUpdateQuestion?: (id: string, updatedFields: Partial<Question>) => void;
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

// Complete curriculum index mapped 100% to SGK Tin học 6, 7, 8, 9 "Kết nối tri thức"
const INF_SYLLABUS_MAP: Record<string, { id: string; title: string; lessons: { id: string; title: string; topics: string[] }[] }[]> = {
  '6': [
    {
      id: 'inf-ch1-6',
      title: 'Chủ đề 1. Máy tính và cộng đồng',
      lessons: [
        { id: 'inf-le1-6', title: 'Bài 1. Thông tin và dữ liệu', topics: ['Thông tin', 'Dữ liệu', 'Vật mang tin'] },
        { id: 'inf-le2-6', title: 'Bài 2. Xử lí thông tin', topics: ['Thu nhận', 'Xử lí', 'Lưu trữ', 'Truyền thông tin'] },
        { id: 'inf-le3-6', title: 'Bài 3. Thông tin trong máy tính', topics: ['Biểu diễn số', 'Bit', 'Byte', 'Dãy bit'] }
      ]
    },
    {
      id: 'inf-ch2-6',
      title: 'Chủ đề 2. Mạng máy tính và Internet',
      lessons: [
        { id: 'inf-le4-6', title: 'Bài 4. Mạng máy tính', topics: ['Thiết bị đầu cuối', 'Thiết bị kết nối', 'Lợi ích mạng'] },
        { id: 'inf-le5-6', title: 'Bài 5. Internet', topics: ['Đặc điểm Internet', 'Lợi ích Internet'] }
      ]
    },
    {
      id: 'inf-ch3-6',
      title: 'Chủ đề 3. Tổ chức lưu trữ, tìm kiếm và trao đổi thông tin',
      lessons: [
        { id: 'inf-le6-6', title: 'Bài 6. Mạng thông tin toàn cầu', topics: ['WWW', 'Trang web', 'Trình duyệt'] },
        { id: 'inf-le7-6', title: 'Bài 7. Tìm kiếm thông tin trên Internet', topics: ['Máy tìm kiếm', 'Từ khóa', 'Tìm kiếm thông tin'] },
        { id: 'inf-le8-6', title: 'Bài 8. Thư điện tử', topics: ['Địa chỉ email', 'Hộp thư', 'Gửi nhận thư'] }
      ]
    },
    {
      id: 'inf-ch4-6',
      title: 'Chủ đề 4. Đạo đức, pháp luật và văn hóa trong môi trường số',
      lessons: [
        { id: 'inf-le9-6', title: 'Bài 9. An toàn thông tin trên Internet', topics: ['Tác hại Internet', 'Bảo vệ tài khoản', 'Quy tắc an toàn'] }
      ]
    },
    {
      id: 'inf-ch5-6',
      title: 'Chủ đề 5. Ứng dụng tin học',
      lessons: [
        { id: 'inf-le10-6', title: 'Bài 10. Sơ đồ tư duy', topics: ['Khái niệm', 'Vẽ sơ đồ', 'Phần mềm sơ đồ'] },
        { id: 'inf-le11-6', title: 'Bài 11. Định dạng văn bản', topics: ['Đoạn văn', 'Căn lề', 'In ấn', 'Cỡ chữ', 'Phông chữ'] },
        { id: 'inf-le12-6', title: 'Bài 12. Trình bày thông tin ở dạng bảng', topics: ['Tạo bảng', 'Định dạng bảng', 'Bố cục bảng'] },
        { id: 'inf-le13-6', title: 'Bài 13. Thực hành: Tìm kiếm và thay thế', topics: ['Find', 'Replace', 'Thao tác soạn thảo'] },
        { id: 'inf-le14-6', title: 'Bài 14. Thực hành tổng hợp: Hoàn thiện sổ lưu niệm', topics: ['Thiết kế sổ', 'Trang trí', 'Định dạng trang'] }
      ]
    },
    {
      id: 'inf-ch6-6',
      title: 'Chủ đề 6. Giải quyết vấn đề với sự trợ giúp của máy tính',
      lessons: [
        { id: 'inf-le15-6', title: 'Bài 15. Thuật toán', topics: ['Khái niệm', 'Sơ đồ khối', 'Mô tả thuật toán'] },
        { id: 'inf-le16-6', title: 'Bài 16. Các cấu trúc điều khiển', topics: ['Tuần tự', 'Rẽ nhánh', 'Vòng lặp'] },
        { id: 'inf-le17-6', title: 'Bài 17. Chương trình máy tính', topics: ['Viết mã', 'Kịch bản Scratch', 'Chạy chương trình'] }
      ]
    }
  ],
  '7': [
    {
      id: 'inf-ch1-7',
      title: 'Chủ đề 1. Máy tính và cộng đồng',
      lessons: [
        { id: 'inf-le1-7', title: 'Bài 1. Thiết bị vào - ra', topics: ['Bàn phím', 'Chuột', 'Màn hình', 'Loa', 'Máy in'] },
        { id: 'inf-le2-7', title: 'Bài 2. Phần mềm máy tính', topics: ['Hệ điều hành', 'Phần mềm ứng dụng', 'Mở rộng tên tệp'] },
        { id: 'inf-le3-7', title: 'Bài 3. Quản lí dữ liệu trong máy tính', topics: ['Tệp và thư mục', 'Sao chép', 'Đổi tên', 'Xóa thư mục'] }
      ]
    },
    {
      id: 'inf-ch2-7',
      title: 'Chủ đề 2. Tổ chức lưu trữ, tìm kiếm và trao đổi thông tin',
      lessons: [
        { id: 'inf-le4-7', title: 'Bài 4. Mạng xã hội và một số kênh trao đổi thông tin trên Internet', topics: ['Facebook', 'Zalo', 'YouTube', 'Trách nhiệm số'] }
      ]
    },
    {
      id: 'inf-ch3-7',
      title: 'Chủ đề 3. Đạo đức, pháp luật và văn hóa trong môi trường số',
      lessons: [
        { id: 'inf-le5-7', title: 'Bài 5. Ứng xử trên mạng', topics: ['Giao tiếp mạng', 'Nghiện Internet', 'Quy tắc ứng xử'] }
      ]
    },
    {
      id: 'inf-ch4-7',
      title: 'Chủ đề 4. Ứng dụng tin học',
      lessons: [
        { id: 'inf-le6-7', title: 'Bài 6. Làm quen với phần mềm bảng tính', topics: ['Giao diện Excel', 'Nhập dữ liệu', 'Định dạng ô'] },
        { id: 'inf-le7-7', title: 'Bài 7. Tính toán tự động trên bảng tính', topics: ['Công thức toán', 'Sao chép công thức', 'Tham chiếu'] },
        { id: 'inf-le8-7', title: 'Bài 8. Công cụ hỗ trợ tính toán', topics: ['Hàm SUM', 'Hàm AVERAGE', 'Hàm MIN', 'Hàm MAX', 'Hàm COUNT'] },
        { id: 'inf-le9-7', title: 'Bài 9. Trình bày bảng tính', topics: ['Kẻ đường viền', 'Định dạng số', 'Định dạng ngày tháng'] },
        { id: 'inf-le10-7', title: 'Bài 10. Hoàn thiện bảng tính', topics: ['In bảng tính', 'Thiết lập trang in', 'Xem trước khi in'] },
        { id: 'inf-le11-7', title: 'Bài 11. Tạo bài trình chiếu', topics: ['Tiêu đề', 'Cấu trúc phân cấp', 'Bố cục trang chiếu'] },
        { id: 'inf-le12-7', title: 'Bài 12. Định dạng đối tượng trên trang chiếu', topics: ['Định dạng chữ', 'Chèn hình ảnh', 'Căn lề đối tượng'] },
        { id: 'inf-le13-7', title: 'Bài 13. Thực hành tổng hợp: Hoàn thiện bài trình chiếu', topics: ['Hiệu ứng động', 'Thiết kế slide báo cáo', 'Hoàn thiện'] }
      ]
    },
    {
      id: 'inf-ch5-7',
      title: 'Chủ đề 5. Giải quyết vấn đề với sự trợ giúp của máy tính',
      lessons: [
        { id: 'inf-le14-7', title: 'Bài 14. Thuật toán tìm kiếm tuần tự', topics: ['Mô tả', 'Sơ đồ khối', 'Tìm kiếm tuần tự'] },
        { id: 'inf-le15-7', title: 'Bài 15. Thuật toán tìm kiếm nhị phân', topics: ['Mô tả', 'Sơ đồ khối', 'Tìm kiếm nhị phân'] },
        { id: 'inf-le16-7', title: 'Bài 16. Thuật toán sắp xếp', topics: ['Sắp xếp nổi bọt', 'Sắp xếp chọn', 'Mô phỏng'] }
      ]
    }
  ],
  '8': [
    {
      id: 'inf-ch1-8',
      title: 'Chủ đề 1. Máy tính và cộng đồng',
      lessons: [
        { id: 'inf-le1-8', title: 'Bài 1. Lược sử công cụ tính toán', topics: ['Pascaline', 'Babbage', 'Bóng bán dẫn', 'Vi mạch', 'Thế hệ máy tính'] }
      ]
    },
    {
      id: 'inf-ch2-8',
      title: 'Chủ đề 2. Tổ chức lưu trữ, tìm kiếm và trao đổi thông tin',
      lessons: [
        { id: 'inf-le2-8', title: 'Bài 2. Thông tin trong môi trường số', topics: ['Đặc điểm thông tin số', 'Thông tin đáng tin cậy', 'Ý kiến và sự thật'] },
        { id: 'inf-le3-8', title: 'Bài 3. Thực hành: Khai thác thông tin số', topics: ['Khai thác thông tin số', 'Đánh giá độ tin cậy'] }
      ]
    },
    {
      id: 'inf-ch3-8',
      title: 'Chủ đề 3. Đạo đức, pháp luật và văn hóa trong môi trường số',
      lessons: [
        { id: 'inf-le4-8', title: 'Bài 4. Đạo đức và văn hóa trong sử dụng công nghệ kĩ thuật số', topics: ['Vi phạm bản quyền', 'Sử dụng phần mềm bẻ khóa', 'Văn hóa ứng xử số'] }
      ]
    },
    {
      id: 'inf-ch4-8',
      title: 'Chủ đề 4. Ứng dụng tin học',
      lessons: [
        { id: 'inf-le5-8', title: 'Bài 5. Sử dụng bảng tính giải quyết bài toán thực tế', topics: ['Địa chỉ tương đối', 'Địa chỉ tuyệt đối', 'Tính toán thực tế'] },
        { id: 'inf-le6-8', title: 'Bài 6. Sắp xếp và lọc dữ liệu', topics: ['Sắp xếp dữ liệu', 'Bộ lọc dữ liệu', 'Lọc theo điều kiện'] },
        { id: 'inf-le7-8', title: 'Bài 7. Trình bày dữ liệu bằng biểu đồ', topics: ['Biểu đồ cột', 'Biểu đồ đoạn thẳng', 'Biểu đồ quạt tròn'] },
        { id: 'inf-le8a-8', title: 'Bài 8a. Làm việc với danh sách dạng liệt kê và hình ảnh', topics: ['Danh sách liệt kê', 'Chèn hình ảnh', 'Bố cục văn bản'] },
        { id: 'inf-le8b-8', title: 'Bài 8b. Phần mềm chỉnh sửa ảnh', topics: ['GIMP', 'Vùng chọn', 'Lớp ảnh (Layer)'] },
        { id: 'inf-le9a-8', title: 'Bài 9a. Tạo đầu trang, chân trang cho văn bản', topics: ['Header và Footer', 'Đánh số trang'] },
        { id: 'inf-le9b-8', title: 'Bài 9b. Thay đổi khung hình, kích thước ảnh', topics: ['Xoay ảnh', 'Cắt ảnh (Crop)', 'Thay đổi kích thước (Resize)'] },
        { id: 'inf-le10a-8', title: 'Bài 10a. Định dạng nâng cao cho trang chiếu', topics: ['Định dạng trang chiếu', 'Màu sắc trang chiếu'] },
        { id: 'inf-le10b-8', title: 'Bài 10b. Thêm văn bản, tạo hiệu ứng cho ảnh', topics: ['Thêm văn bản vào ảnh', 'Hiệu ứng mờ/độ tương phản'] },
        { id: 'inf-le11a-8', title: 'Bài 11a. Sử dụng bản mẫu tạo bài trình chiếu', topics: ['Bản mẫu (Template)', 'Thiết kế Slide chuyên nghiệp'] },
        { id: 'inf-le11b-8', title: 'Bài 11b. Thực hành tổng hợp chỉnh sửa ảnh', topics: ['Thực hành GIMP', 'Thiết kế tờ rơi'] }
      ]
    },
    {
      id: 'inf-ch5-8',
      title: 'Chủ đề 5. Giải quyết vấn đề với sự giúp của máy tính',
      lessons: [
        { id: 'inf-le12-8', title: 'Bài 12. Từ thuật toán đến chương trình', topics: ['Thuật toán', 'Chương trình Scratch', 'Cấu trúc tuần tự'] },
        { id: 'inf-le13-8', title: 'Bài 13. Biểu diễn dữ liệu', topics: ['Hằng và biến', 'Kiểu dữ liệu trong Scratch'] },
        { id: 'inf-le14-8', title: 'Bài 14. Cấu trúc điều khiển', topics: ['Cấu trúc rẽ nhánh', 'Cấu trúc lặp', 'Khối lệnh điều khiển'] },
        { id: 'inf-le15-8', title: 'Bài 15. Gỡ lỗi', topics: ['Kiểm thử chương trình', 'Tìm lỗi cú pháp', 'Tìm lỗi logic'] }
      ]
    },
    {
      id: 'inf-ch6-8',
      title: 'Chủ đề 6. Hướng nghiệp với Tin học',
      lessons: [
        { id: 'inf-le16-8', title: 'Bài 16. Tin học với nghề nghiệp', topics: ['Tin học văn phòng', 'Kỹ sư phần mềm', 'Quản trị mạng', 'Bình đẳng giới trong CNTT'] }
      ]
    }
  ],
  '9': [
    {
      id: 'inf-ch1-9',
      title: 'Chủ đề 1. Máy tính và cộng đồng',
      lessons: [
        { id: 'inf-le1-9', title: 'Bài 1. Thế giới kĩ thuật số', topics: ['Thế giới số', 'Bộ vi xử lý', 'Ứng dụng thực tế'] }
      ]
    },
    {
      id: 'inf-ch2-9',
      title: 'Chủ đề 2. Tổ chức lưu trữ, tìm kiếm và trao đổi thông tin',
      lessons: [
        { id: 'inf-le2-9', title: 'Bài 2. Thông tin trong giải quyết vấn đề', topics: ['Giá trị thông tin', 'Chất lượng thông tin', 'Giải quyết vấn đề'] },
        { id: 'inf-le3-9', title: 'Bài 3. Thực hành: Đánh giá chất lượng thông tin', topics: ['Đánh giá thông tin', 'Độ tin cậy', 'Tính cập nhật'] }
      ]
    },
    {
      id: 'inf-ch3-9',
      title: 'Chủ đề 3. Đạo đức, pháp luật và văn hóa trong môi trường số',
      lessons: [
        { id: 'inf-le4-9', title: 'Bài 4. Một số vấn đề pháp lí về sử dụng dịch vụ Internet', topics: ['Luật an ninh mạng', 'Quyền sở hữu trí tuệ', 'Dịch vụ Internet'] }
      ]
    },
    {
      id: 'inf-ch4-9',
      title: 'Chủ đề 4. Ứng dụng tin học',
      lessons: [
        { id: 'inf-le5-9', title: 'Bài 5. Tìm hiểu phần mềm mô phỏng', topics: ['Mô phỏng khoa học', 'Lợi ích mô phỏng', 'Phần mềm mô phỏng'] },
        { id: 'inf-le6-9', title: 'Bài 6. Thực hành: Khai thác phần mềm mô phỏng', topics: ['PhET', 'Mô phỏng vật lý', 'Mô phỏng hóa học'] },
        { id: 'inf-le7-9', title: 'Bài 7. Trình bày thông tin trong trao đổi và hợp tác', topics: ['Trình bày trực quan', 'Cấu trúc bài thuyết trình'] },
        { id: 'inf-le8-9', title: 'Bài 8. Thực hành: Sử dụng công cụ trực quan trình bày thông tin trong trao đổi và hợp tác', topics: ['Sơ đồ tư duy trực quan', 'Đính kèm dữ liệu'] },
        { id: 'inf-le9a-9', title: 'Bài 9a. Sử dụng công cụ xác thực dữ liệu', topics: ['Data Validation', 'Xác thực số nguyên', 'Danh sách thả xuống'] },
        { id: 'inf-le10a-9', title: 'Bài 10a. Sử dụng hàm COUNTIF', topics: ['COUNTIF', 'Đếm theo điều kiện'] },
        { id: 'inf-le11a-9', title: 'Bài 11a. Sử dụng hàm SUMIF', topics: ['SUMIF', 'Tính tổng theo điều kiện'] },
        { id: 'inf-le12a-9', title: 'Bài 12a. Sử dụng hàm IF', topics: ['Hàm IF', 'Điều kiện lồng nhau'] },
        { id: 'inf-le13a-9', title: 'Bài 13a. Hoàn thiện bảng tính quản lí tài chính gia đình', topics: ['Quản lý chi tiêu', 'Báo cáo tài chính'] },
        { id: 'inf-le9b-9', title: 'Bài 9b. Các chức năng chính của phần mềm làm video', topics: ['Video Editor', 'Giao diện làm video', 'Thêm hình ảnh'] },
        { id: 'inf-le10b-9', title: 'Bài 10b. Chuẩn bị dữ liệu và dựng video', topics: ['Kịch bản video', 'Cắt ngắn video', 'Thời gian hiển thị'] },
        { id: 'inf-le11b-9', title: 'Bài 11b. Thực hành: Dựng video theo kịch bản', topics: ['Dựng hình ảnh', 'Bộ lọc hiệu ứng', 'Thêm phụ đề'] },
        { id: 'inf-le12b-9', title: 'Bài 12b. Hoàn thiện việc dựng video', topics: ['Thêm nhạc nền', 'Điều chỉnh âm lượng', 'Xoay hướng video'] },
        { id: 'inf-le13b-9', title: 'Bài 13b. Biên tập và xuất video', topics: ['Xuất tệp MP4', 'Chọn chất lượng video', 'Biên tập lỗi'] }
      ]
    },
    {
      id: 'inf-ch5-9',
      title: 'Chủ đề 5. Giải quyết vấn đề với sự trợ giúp của máy tính',
      lessons: [
        { id: 'inf-le14-9', title: 'Bài 14. Giải quyết vấn đề', topics: ['Quy trình giải quyết', 'Phân tích dữ liệu', 'Đầu vào đầu ra'] },
        { id: 'inf-le15-9', title: 'Bài 15. Bài toán tin học', topics: ['Mô tả thuật toán', 'Giải bài toán thực tế'] },
        { id: 'inf-le16-9', title: 'Bài 16. Thực hành: Lập chương trình máy tính', topics: ['Lập trình Scratch', 'Cấu trúc lặp', 'Tìm giá trị lớn nhất'] }
      ]
    },
    {
      id: 'inf-ch6-9',
      title: 'Chủ đề 6. Hướng nghiệp với tin học',
      lessons: [
        { id: 'inf-le17-9', title: 'Bài 17. Tin học và thế giới nghề nghiệp', topics: ['Nghề thiết kế đồ họa', 'Quản trị CSDL', 'Lập trình viên'] }
      ]
    }
  ]
};

export default function InformaticsQuestionBank({ 
  questions, 
  syllabus = [], 
  onAddQuestion, 
  onDeleteQuestion, 
  onUpdateQuestion 
}: InformaticsQuestionBankProps) {
  
  // Combine props syllabus with hardcoded INF_SYLLABUS_MAP to ensure data is rich and editable
  const combinedSyllabus: Syllabus[] = [...syllabus];
  ['6', '7', '8', '9'].forEach(g => {
    const hasTinHoc = combinedSyllabus.some(sy => sy.grade === g && sy.subject === 'Tin học');
    if (!hasTinHoc) {
      combinedSyllabus.push({
        id: `sy-tin-${g}`,
        grade: g,
        subject: 'Tin học',
        book: 'Kết nối tri thức',
        semester: '1',
        periods: '1',
        chapters: INF_SYLLABUS_MAP[g].map(ch => ({
          id: ch.id,
          title: ch.title,
          lessons: ch.lessons.map(le => ({
            id: le.id,
            title: le.title,
            topics: le.topics
          }))
        }))
      });
    }
  });

  // Creator tab: 'manual' or 'import'
  const [activeCreatorTab, setActiveCreatorTab] = useState<'manual' | 'import'>('manual');

  // Manual input form state
  const [sub] = useState('Tin học');
  const [grade, setGrade] = useState('8');
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
  const [rightPanelTab, setRightPanelTab] = useState<'database' | 'import-preview'>('database');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Target assignment parameters for batch imports
  const [importAssignGrade, setImportAssignGrade] = useState<string>('AUTO');
  const [importAssignSub] = useState<string>('Tin học');
  const [importAssignChapterID, setImportAssignChapterID] = useState<string>('AUTO');
  const [importAssignLessonID, setImportAssignLessonID] = useState<string>('AUTO');
  const [importSelectedLevels, setImportSelectedLevels] = useState<QuestionLevel[]>(['Nhận biết', 'Thông hiểu', 'Vận dụng', 'Vận dụng cao']);

  // Active guide sample tab ('MCQ' | 'YESNO' | 'SHORT' | 'ESSAY')
  const [guideTab, setGuideTab] = useState<QuestionType>('MCQ');
  const [copiedText, setCopiedText] = useState(false);

  // Filters State
  const [filterSub] = useState('Tin học');
  const [filterGrade, setFilterGrade] = useState('ALL');
  const [filterType, setFilterType] = useState('ALL');
  const [filterChapterId, setFilterChapterId] = useState('ALL');
  const [filterLessonId, setFilterLessonId] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Manual Creation States for Chapter & Lesson
  const [manualChapterId, setManualChapterId] = useState('AUTO');
  const [manualLessonId, setManualLessonId] = useState('AUTO');

  // Explorer Matrix View Drawer States
  const [isExplorerOpen, setIsExplorerOpen] = useState(false);
  const [explorerSub] = useState('Tin học');
  const [explorerGrade, setExplorerGrade] = useState('8');
  const [explorerExpandedChapters, setExplorerExpandedChapters] = useState<string[]>([]);
  const [explorerMoveTargetChapter, setExplorerMoveTargetChapter] = useState<string>('');
  const [explorerMoveTargetLesson, setExplorerMoveTargetLesson] = useState<string>('');
  const [explorerSelectedQuestionIds, setExplorerSelectedQuestionIds] = useState<string[]>([]);
  const [selectedNode, setSelectedNode] = useState<{ chapterId: string; lessonId: string } | null>(null);

  // Quick edit details dialog modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editQuestionId, setEditQuestionId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editExplain, setEditExplain] = useState('');
  const [editLevel, setEditLevel] = useState<QuestionLevel>('Nhận biết');
  const [editTopic, setEditTopic] = useState('');
  const [editOutcome, setEditOutcome] = useState('');

  // Auto-seed Informatics questions if the database is currently empty of Informatics questions
  useEffect(() => {
    const activeDbQuestions = questions.filter(q => q.subject === 'Tin học');
    if (activeDbQuestions.length === 0 && SAMPLE_INF_QUESTIONS.length > 0) {
      const formatted = SAMPLE_INF_QUESTIONS.map(q => ({
        grade: q.grade,
        subject: 'Tin học',
        book: q.book || 'Kết nối tri thức',
        chapterId: q.chapterId || 'ch-general',
        lessonId: q.lessonId || 'le-general',
        topic: q.topic || 'Tin học THCS',
        type: q.type,
        content: q.content,
        options: q.options || [],
        answer: q.answer,
        explain: q.explain,
        level: q.level,
        requiredOutcome: q.requiredOutcome
      }));
      onAddQuestion(formatted);
    }
  }, []);

  // Derived state for Explorer Matrix View
  const activeSyl = combinedSyllabus.find(sy => sy.grade === explorerGrade && sy.subject === explorerSub);
  
  // Find general questions for selected grade and subject
  const unassignedQs = questions.filter(q => 
    q.subject === explorerSub && 
    q.grade === explorerGrade && 
    (!q.chapterId || q.chapterId === 'ch-general' || q.chapterId === 'temp' || q.chapterId === 'ch-unassigned')
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
      const chName = syllabusStructure.find(c => c.id === selectedNode.chapterId)?.title || 'Chủ đề';
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
    }
  }

  // -----------------------------------------------------------------
  // TXT EXTRACT AUTOMATION PARSER WITH SYLLABUS RESOLUTION
  // -----------------------------------------------------------------
  const parseUploadedText = (text: string, defaultGrade: string = '8', defaultSubject: string = 'Tin học'): ParsedBatchQuestion[] => {
    const lines = text.split(/\r?\n/);
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
    
    let currentQ: Partial<ParsedBatchQuestion> = {};
    let capturingField: 'content' | 'explain' | null = null;
    
    // File-wide context auto-detection
    let fileGrade: string | null = null;
    let fileSubject: string | null = null;
    let fileChapterText = '';
    let fileLessonText = '';
    let fileOutcomeText = '';
    let lastType: QuestionType = 'MCQ';
    let lastLevel: QuestionLevel = 'Nhận biết';

    // Scan lines for metadata markers
    for (let i = 0; i < Math.min(200, lines.length); i++) {
      const rl = lines[i].trim();
      if (/^(?:Lớp|Lop|Khối|Khoi)\s*[:\.\s-]/i.test(rl)) {
        const val = rl.replace(/^(?:Lớp|Lop|Khối|Khoi)\s*[:\.\s-]?/i, '').trim();
        const numMatch = val.match(/\d+/);
        if (numMatch) {
          fileGrade = numMatch[0];
        }
      } else if (/^(?:Môn|Mon|Môn học|Mon hoc)\s*[:\.\s-]/i.test(rl)) {
        const val = rl.replace(/^(?:Môn|Mon|Môn học|Mon hoc)\s*[:\.\s-]?/i, '').trim();
        if (val.toLowerCase().includes('tin') || val.toLowerCase().includes('tin học')) fileSubject = 'Tin học';
      }
    }

    const commitCurrentQ = () => {
      if (currentQ.content && currentQ.content.trim()) {
        let finalType: QuestionType = currentQ.type || lastType;
        const isTrueFalseContent = /đúng\s*[\/\-]\s*sai|đúng\s+hoặc\s+sai|yes\s*[\/\-]\s*no|xác định tính đúng/i.test(currentQ.content || '');
        if (finalType === 'MCQ' && isTrueFalseContent) {
          finalType = 'YESNO';
        }
        let finalLevel: QuestionLevel = currentQ.level || lastLevel;
        let finalOptions = currentQ.options || [];
        let finalAnswer = currentQ.answer || '';
        
        // Normalize MCQ Answer Letters
        if (finalType === 'MCQ') {
          const cleanAns = finalAnswer.trim().toUpperCase();
          if (['A', 'B', 'C', 'D'].includes(cleanAns)) {
            finalAnswer = String(['A', 'B', 'C', 'D'].indexOf(cleanAns));
          } else if (['0', '1', '2', '3'].includes(cleanAns)) {
            finalAnswer = cleanAns;
          } else {
            finalAnswer = '0';
          }
        } 
        // Normalize YESNO Correct Answer list
        else if (finalType === 'YESNO') {
          const items = finalAnswer.split(/[,;\s]+/).map(item => {
            const lower = item.trim().toLowerCase();
            return (lower === 'đúng' || lower === 'dung' || lower === 'true' || lower === 't') ? 'true' : 'false';
          });
          while (items.length < 4) items.push('false');
          finalAnswer = items.slice(0, 4).join(',');
        }

        // Auto-match chapter and lesson from syllabus for the resolved grade and subject
        const resolvedGrade = fileGrade || defaultGrade;
        const resolvedSubject = fileSubject || defaultSubject;
        
        let resolvedChapterId = 'ch-general';
        let resolvedLessonId = 'le-general';

        const activeSyl = combinedSyllabus.find(
          (sy) => sy.grade === resolvedGrade && sy.subject.toLowerCase() === resolvedSubject.toLowerCase()
        );

        if (activeSyl) {
          // Attempt to match chapter
          if (fileChapterText) {
            const cleanCh = fileChapterText.toLowerCase().trim();
            const chNumMatch = cleanCh.match(/(?:chủ đề|chu de|chương|chuong)\s+([0-9a-zivx]+)/);
            const chNum = chNumMatch ? chNumMatch[1].trim() : '';

            let matchedCh = activeSyl.chapters.find(ch => {
              const chTitleLower = ch.title.toLowerCase();
              if (chNum) {
                const titleNumMatch = chTitleLower.match(/(?:chủ đề|chu de|chương|chuong)\s+([0-9a-zivx]+)/);
                if (titleNumMatch && titleNumMatch[1] === chNum) return true;
              }
              return chTitleLower.includes(cleanCh) || cleanCh.includes(chTitleLower) || isStringSimilar(ch.title, fileChapterText);
            });

            // Fallback for roman numerals vs arabic numbers
            if (!matchedCh && chNum) {
              const romanMap: { [key: string]: string } = {
                '1': 'i', '2': 'ii', '3': 'iii', '4': 'iv', '5': 'v', '6': 'vi',
                'i': '1', 'ii': '2', 'iii': '3', 'iv': '4', 'v': '5', 'vi': '6'
              };
              const altNum = romanMap[chNum];
              if (altNum) {
                matchedCh = activeSyl.chapters.find(ch => {
                  const titleNumMatch = ch.title.toLowerCase().match(/(?:chủ đề|chu de|chương|chuong)\s+([0-9a-zivx]+)/);
                  return (titleNumMatch && titleNumMatch[1] === altNum) || isStringSimilar(ch.title, fileChapterText);
                });
              }
            }

            if (matchedCh) {
              resolvedChapterId = matchedCh.id;
              
              // Attempt to match lesson inside this chapter
              if (fileLessonText) {
                const cleanLe = fileLessonText.toLowerCase().trim();
                const leNumMatch = cleanLe.match(/(?:bài|bai)\s+(\d+)/);
                const leNum = leNumMatch ? leNumMatch[1] : '';

                const matchedLe = matchedCh.lessons.find(le => {
                  const leTitleLower = le.title.toLowerCase();
                  if (leNum) {
                    const titleNumMatch = leTitleLower.match(/(?:bài|bai)\s+(\d+)/);
                    if (titleNumMatch && titleNumMatch[1] === leNum) return true;
                  }
                  return leTitleLower.includes(cleanLe) || cleanLe.includes(leTitleLower) || isStringSimilar(le.title, fileLessonText);
                });

                if (matchedLe) {
                  resolvedLessonId = matchedLe.id;
                }
              }
            }
          }
        }

        parsedQuestions.push({
          grade: resolvedGrade,
          subject: resolvedSubject,
          book: 'Kết nối tri thức',
          chapterId: resolvedChapterId,
          lessonId: resolvedLessonId,
          topic: currentQ.topic || fileOutcomeText || 'Nhập hàng loạt',
          type: finalType,
          content: currentQ.content,
          options: finalOptions,
          answer: finalAnswer,
          explain: currentQ.explain || '',
          level: finalLevel,
          requiredOutcome: currentQ.requiredOutcome || fileOutcomeText || undefined
        });
      }
      currentQ = {};
      capturingField = null;
    };

    lines.forEach((line) => {
      const cleanLine = line.trim();
      if (!cleanLine) return;

      // Avoid state bleeding: if we hit a metadata header, we commit the previous question first!
      const isHeaderLine = /^(?:Môn|Mon|Lớp|Lop|Khối|Khoi|Chương|Chủ đề|Chu de|Chapter|Bài|Bai|Lesson|Yêu cầu cần đạt|Outcome|Mức độ|Muc do|Cấp độ|Cap do|Level|Dạng|Dang|Type)\s*[:\.\s-]/i.test(cleanLine);
      if (isHeaderLine && currentQ.content) {
        commitCurrentQ();
      }

      // Check Metadata Headers
      if (/^(?:Chương|Chủ đề|Chu de|Chapter)\s*[:\.\s-]/i.test(cleanLine)) {
        fileChapterText = cleanLine.replace(/^(?:Chương|Chủ đề|Chu de|Chapter)\s*[:\.\s-]?/i, '').trim();
        return;
      }
      if (/^(?:Bài|Bai|Lesson)\s*[:\.\s-]/i.test(cleanLine)) {
        fileLessonText = cleanLine.replace(/^(?:Bài|Bai|Lesson)\s*[:\.\s-]?/i, '').trim();
        return;
      }
      if (/^(?:Yêu cầu cần đạt|Outcome)\s*[:\.\s-]/i.test(cleanLine)) {
        fileOutcomeText = cleanLine.replace(/^(?:Yêu cầu cần đạt|Outcome)\s*[:\.\s-]?/i, '').trim();
        return;
      }

      // Check Level metadata
      if (/^(?:Mức độ|Muc do|Cấp độ|Cap do|Level)\s*[:\.\s-]/i.test(cleanLine)) {
        const val = cleanLine.replace(/^(?:Mức độ|Muc do|Cấp độ|Cap do|Level)\s*[:\.\s-]?/i, '').trim().toLowerCase();
        if (val.includes('nhận biết') || val.includes('nhan biet') || val.includes('easy')) lastLevel = 'Nhận biết';
        else if (val.includes('thông hiểu') || val.includes('thong hieu') || val.includes('medium')) lastLevel = 'Thông hiểu';
        else if (val.includes('vận dụng cao') || val.includes('kho')) lastLevel = 'Vận dụng cao';
        else if (val.includes('vận dụng') || val.includes('van dung')) lastLevel = 'Vận dụng';
        return;
      }

      // Check Question Type metadata
      if (/^(?:Dạng|Dang|Type)\s*[:\.\s-]/i.test(cleanLine)) {
        const val = cleanLine.replace(/^(?:Dạng|Dang|Type)\s*[:\.\s-]?/i, '').trim().toLowerCase();
        if (val.includes('đúng sai') || val.includes('yesno') || val.includes('tf') || val.includes('đúng/sai') || val.includes('dung/sai')) lastType = 'YESNO';
        else if (val.includes('trả lời ngắn') || val.includes('điền khuyết') || val.includes('short')) lastType = 'SHORT';
        else if (val.includes('tự luận') || val.includes('essay')) lastType = 'ESSAY';
        else lastType = 'MCQ';
        return;
      }

      // Detect Question Start Header (e.g., Câu 1:, Cau 1., Q1:, [Câu 1], 1., 1/, 1:, hoặc Câu:)
      const qMatch = cleanLine.match(/^(?:\[?(?:Câu|Cau|Q|Question)(?:\s*(\d+))?\]?|(\d+))[\s\.\:\-\)\/]/i);
      if (qMatch) {
        commitCurrentQ();
        const headerLength = qMatch[0].length;
        currentQ = {
          content: cleanLine.substring(headerLength).trim(),
          options: [],
          type: lastType,
          level: lastLevel
        };
        capturingField = 'content';
        return;
      }

      // Detect MCQ option item
      const optMatch = cleanLine.match(/^([A-D])[\.\:\)\-\s]/i);
      if (optMatch && currentQ.content) {
        capturingField = null;
        const isTrueFalseContent = /đúng\s*[\/\-]\s*sai|đúng\s+hoặc\s+sai|yes\s*[\/\-]\s*no|xác định tính đúng/i.test(currentQ.content || '');
        if (currentQ.type !== 'YESNO' && !isTrueFalseContent) {
          currentQ.type = 'MCQ';
        } else {
          currentQ.type = 'YESNO';
        }
        const optText = cleanLine.replace(/^[A-D][\.\:\)\-\s]?/i, '').trim();
        if (!currentQ.options) currentQ.options = [];
        currentQ.options.push(optText);
        return;
      }

      // Detect Yes/No item block
      const ynMatch = cleanLine.match(/^([a-d])[\.\:\)\-\s]/i);
      if (ynMatch && currentQ.content && currentQ.type === 'YESNO') {
        capturingField = null;
        const ynText = cleanLine.replace(/^[a-d][\.\:\)\-\s]?/i, '').trim();
        if (!currentQ.options) currentQ.options = [];
        currentQ.options.push(ynText);
        return;
      }

      // Detect Answer keyword
      if (/^(?:Đáp án|Đáp án đúng|Dap an|Answer|Key)\s*[:\.\s-]/i.test(cleanLine)) {
        capturingField = null;
        currentQ.answer = cleanLine.replace(/^(?:Đáp án|Đáp án đúng|Dap an|Answer|Key)\s*[:\.\s-]?/i, '').trim();
        return;
      }

      // Detect Explanation start keyword
      if (/^(?:Lời giải|Giải thích|Lời giải chi tiết|Explanation|Explain|Sol|Solution)\s*[:\.\s-]/i.test(cleanLine)) {
        currentQ.explain = cleanLine.replace(/^(?:Lời giải|Giải thích|Lời giải chi tiết|Explanation|Explain|Sol|Solution)\s*[:\.\s-]?/i, '').trim();
        capturingField = 'explain';
        return;
      }

      // Append trailing multiline content text
      if (capturingField === 'content' && currentQ.content !== undefined) {
        currentQ.content += ' ' + cleanLine;
      } else if (capturingField === 'explain' && currentQ.explain !== undefined) {
        currentQ.explain += ' ' + cleanLine;
      }
    });

    commitCurrentQ();
    return parsedQuestions;
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
      handleUploadedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleUploadedFile(e.target.files[0]);
    }
  };

  const handleUploadedFile = (file: File) => {
    if (!file.name.endsWith('.txt')) {
      alert('Hệ thống chỉ hỗ trợ phân phối tệp văn bản thô định dạng mở rộng (.txt)');
      return;
    }

    setImportStatus('Đang đọc tệp tin...');
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      try {
        const list = parseUploadedText(text, importAssignGrade === 'AUTO' ? '8' : importAssignGrade, 'Tin học');
        if (list.length === 0) {
          alert('Không phát hiện câu hỏi chuẩn nào trong tệp. Hãy chắc chắn tệp bám sát định dạng mẫu.');
          setImportStatus(null);
        } else {
          setImportedQuestions(list);
          setSelectedImportIndices(list.map((_, i) => i));
          setImportStatus(`Đã phát hiện thành công ${list.length} câu hỏi.`);
          setRightPanelTab('import-preview');
        }
      } catch (err) {
        console.error(err);
        alert('Lỗi xử lý tệp văn bản.');
        setImportStatus(null);
      }
    };
    reader.readAsText(file, 'UTF-8');
  };

  const getSelectedSyllabusTitles = () => {
    const finalGrade = importAssignGrade === 'AUTO' ? '8' : importAssignGrade;
    const finalSub = importAssignSub === 'AUTO' ? 'Tin học' : importAssignSub;
    const activeSyl = combinedSyllabus.find(sy => sy.grade === finalGrade && sy.subject === finalSub);
    
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

  const handleBulkImportSubmit = () => {
    if (selectedImportIndices.length === 0) {
      alert('Vui lòng tích chọn câu hỏi muốn đưa vào kho lưu trữ!');
      return;
    }

    const { chapterTitle, lessonTitle } = getSelectedSyllabusTitles();

    const batchToAdd: Omit<Question, 'id' | 'source' | 'status'>[] = [];
    selectedImportIndices.forEach((idx) => {
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
    setRightPanelTab('database');
    setActiveCreatorTab('manual');
  };

  const handleMoveQuestions = () => {
    if (explorerSelectedQuestionIds.length === 0) {
      alert('Vui lòng chọn ít nhất một câu hỏi để gán phân phối!');
      return;
    }
    if (!explorerMoveTargetChapter) {
      alert('Vui lòng chọn Chủ đề đích!');
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
        const activeSyl = combinedSyllabus.find(sy => sy.grade === grade && sy.subject === sub);
        let t = 'Biên soạn tự do';
        if (activeSyl && manualChapterId !== 'AUTO') {
          const ch = activeSyl.chapters.find(c => c.id === manualChapterId);
          if (ch) {
            t = ch.title;
            if (manualLessonId !== 'AUTO') {
              const le = ch.lessons.find(l => l.id === manualLessonId);
              if (le) t += ` - ${le.title}`;
            }
          }
        }
        return t;
      })(),
      type,
      content,
      options,
      answer,
      explain,
      level,
      requiredOutcome: requiredOutcome || undefined
    });

    alert('Đã lưu trữ thành công câu hỏi vào cơ sở dữ liệu học vụ!');
    
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

  const handleEditSubmit = () => {
    if (editQuestionId && onUpdateQuestion) {
      onUpdateQuestion(editQuestionId, {
        content: editContent,
        explain: editExplain,
        level: editLevel,
        topic: editTopic || 'Nhập hàng loạt',
        requiredOutcome: editOutcome || undefined
      });
      alert('Đã cập nhật câu hỏi thành công!');
      setIsEditModalOpen(false);
      setEditQuestionId(null);
    }
  };

  const triggerOpenEditModal = (q: Question) => {
    setEditQuestionId(q.id);
    setEditContent(q.content);
    setEditExplain(q.explain);
    setEditLevel(q.level);
    setEditTopic(q.topic);
    setEditOutcome(q.requiredOutcome || '');
    setIsEditModalOpen(true);
  };

  const handleSyncSampleQuestions = () => {
    const existingContents = new Set(questions.filter(q => q.subject === 'Tin học').map(q => q.content.trim()));
    const toSync = SAMPLE_INF_QUESTIONS.filter(q => !existingContents.has(q.content.trim()));

    if (toSync.length === 0) {
      alert('Tất cả câu hỏi mẫu đã được đồng bộ đầy đủ vào Kho lưu trữ dữ liệu!');
      return;
    }

    const formatted = toSync.map(q => ({
      grade: q.grade,
      subject: 'Tin học',
      book: q.book || 'Kết nối tri thức',
      chapterId: q.chapterId || 'ch-general',
      lessonId: q.lessonId || 'le-general',
      topic: q.topic || 'Tin học THCS',
      type: q.type,
      content: q.content,
      options: q.options || [],
      answer: q.answer,
      explain: q.explain,
      level: q.level,
      requiredOutcome: q.requiredOutcome
    }));

    onAddQuestion(formatted);
    alert(`Đồng bộ thành công ${formatted.length} câu hỏi mẫu Tin học vào Kho lưu trữ dữ liệu chính! Giờ đây bạn có thể chỉnh sửa, di chuyển hoặc xóa chúng tự do.`);
  };

  // Pre-load mock questions as display fallback when database is completely empty
  const activeDbQuestions = questions.filter(q => q.subject === 'Tin học');
  const displayQuestions = activeDbQuestions.length > 0 ? activeDbQuestions : SAMPLE_INF_QUESTIONS;

  // Final filtered list of questions for standard browsing
  const filteredQuestions = displayQuestions.filter((q) => {
    const searchMatch = !searchQuery.trim() || 
      q.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.explain.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.topic.toLowerCase().includes(searchQuery.toLowerCase());
    
    const gradeMatch = filterGrade === 'ALL' || q.grade === filterGrade;
    const typeMatch = filterType === 'ALL' || q.type === filterType;

    const chMatch = filterChapterId === 'ALL' || q.chapterId === filterChapterId || (filterChapterId === 'ch-general' && (!q.chapterId || q.chapterId === 'ch-general' || q.chapterId === 'temp'));
    const leMatch = filterLessonId === 'ALL' || q.lessonId === filterLessonId || (filterLessonId === 'le-general' && (!q.lessonId || q.lessonId === 'le-general' || q.lessonId === 'temp'));

    return searchMatch && gradeMatch && typeMatch && chMatch && leMatch;
  });

  const activeSyllabusForManual = combinedSyllabus.find(sy => sy.grade === grade && sy.subject === sub);
  const activeChapterForManual = activeSyllabusForManual?.chapters.find(c => c.id === manualChapterId);

  // Guidelines texts
  const sampleGuidelineMCQ = `Chương 1. Máy tính và cộng đồng
Bài 1. Thông tin và dữ liệu
Mức độ: Thông hiểu
Dạng: Trắc nghiệm

Câu 1: Phát biểu nào sau đây là phù hợp nhất về sự khác nhau giữa "Thông tin" và "Dữ liệu"?
A. Thông tin là dữ liệu đã được xử lý và có ý nghĩa, còn dữ liệu là các con số thô.
B. Thông tin và dữ liệu hoàn toàn giống nhau.
C. Dữ liệu luôn quan trọng hơn thông tin.
D. Thông tin chỉ được lưu trữ trong máy tính.
Đáp án: A
Lời giải: Dữ liệu là các con số, hình ảnh thô. Khi được xử lý mang lại hiểu biết thì trở thành thông tin.`;

  const sampleGuidelineYESNO = `Chủ đề 4. Ứng dụng tin học
Bài 6. Làm quen với phần mềm bảng tính
Mức độ: Vận dụng
Dạng: Đúng sai

Câu 1: Cho các nhận định sau đây về địa chỉ ô tính trong Microsoft Excel:
a) Địa chỉ tương đối (ví dụ A1) sẽ tự động thay đổi khi sao chép công thức.
b) Địa chỉ tuyệt đối có ký hiệu đô la $ trước tên cột và hàng (ví dụ $A$1).
c) Không thể kết hợp địa chỉ tuyệt đối và tương đối trên cùng một công thức.
d) Ký hiệu địa chỉ ô luôn ghi số hàng trước, tên cột sau.
Đáp án: Đúng, Đúng, Sai, Sai
Lời giải: Có thể kết hợp địa chỉ hỗn hợp (ví dụ $A1) và địa chỉ ô luôn ghi chữ cái cột trước, số hàng sau.`;

  const sampleGuidelineSHORT = `Chủ đề 5. Giải quyết vấn đề với sự trợ giúp của máy tính
Bài 13. Biểu diễn dữ liệu
Mức độ: Nhận biết
Dạng: Trả lời ngắn

Câu 1: Đại lượng được đặt tên và có giá trị có thể thay đổi trong quá trình thực hiện chương trình Scratch được gọi là gì?
Đáp án: Biến, Biến số, variable
Lời giải: Biến là đại lượng dùng để lưu trữ dữ liệu và giá trị của biến có thể thay đổi trong lúc chạy kịch bản.`;

  const sampleGuidelineESSAY = `Chủ đề 3. Đạo đức, pháp luật và văn hóa trong môi trường số
Bài 4. Đạo đức và văn hóa trong sử dụng công nghệ kĩ thuật số
Mức độ: Vận dụng
Dạng: Tự luận

Câu 1: Hãy phân tích tác hại của việc sử dụng các phần mềm bẻ khóa (crack) lậu trên mạng?
Lời giải: Gây nguy cơ lây nhiễm mã độc, virus, xâm phạm luật bản quyền và làm giảm uy tín văn hóa số quốc gia.`;

  return (
    <div className="space-y-6">
      {/* HEADER CONTROLS BANNER */}
      <div className="bg-slate-900 border border-slate-800 text-white p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-md">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="bg-emerald-500 text-slate-950 font-black text-[9px] uppercase px-2 py-0.5 rounded-full tracking-wider shadow-sm">
              SGK Tin học THCS - Kết nối tri thức
            </span>
            <span className="bg-slate-800 text-slate-300 font-extrabold text-[9px] uppercase px-2 py-0.5 rounded-full tracking-wider border border-slate-700">
              Mục lục 6, 7, 8, 9
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-black tracking-tight">
            Kho câu hỏi Tin học THCS
          </h2>
          <p className="text-slate-400 text-xs font-semibold max-w-xl">
            Hệ thống ngân hàng quản lý, biên soạn học vụ, import văn bản thông minh bám sát sơ đồ ma trận nhận thức môn Tin học Trung học cơ sở.
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={handleSyncSampleQuestions}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold rounded-xl shadow-md flex items-center gap-1.5 transition-colors cursor-pointer border-none"
          >
            <RefreshCw className="w-4 h-4 animate-none" />
            Đồng bộ câu hỏi mẫu
          </button>

          <button
            onClick={() => setIsExplorerOpen(true)}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-xl shadow-md flex items-center gap-1.5 transition-colors cursor-pointer border-none"
          >
            <Layers className="w-4 h-4" />
            Sơ đồ ma trận & Phân phối (Xem kho)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: MANUAL ENTRY FORM & IMPORT */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white border rounded-2xl shadow-xs overflow-hidden">
            <div className="flex border-b text-xs font-bold bg-slate-50">
              <button
                onClick={() => setActiveCreatorTab('manual')}
                className={`flex-1 py-3 text-center border-none border-b-2 transition-all cursor-pointer ${
                  activeCreatorTab === 'manual' 
                    ? 'text-emerald-700 bg-white font-black' 
                    : 'text-slate-500 bg-transparent opacity-80 hover:text-slate-800'
                }`}
                style={{ borderBottom: activeCreatorTab === 'manual' ? '2px solid #059669' : '2px solid transparent' }}
              >
                <Plus className="w-3.5 h-3.5 inline mr-1" />
                Soạn câu hỏi thủ công
              </button>
              
              <button
                onClick={() => setActiveCreatorTab('import')}
                className={`flex-1 py-3 text-center border-none border-b-2 transition-all cursor-pointer ${
                  activeCreatorTab === 'import' 
                    ? 'text-emerald-700 bg-white font-black' 
                    : 'text-slate-500 bg-transparent opacity-80 hover:text-slate-800'
                }`}
                style={{ borderBottom: activeCreatorTab === 'import' ? '2px solid #059669' : '2px solid transparent' }}
              >
                <Upload className="w-3.5 h-3.5 inline mr-1" />
                Nạp tệp TXT thông minh
              </button>
            </div>

            <div className="p-5">
              {activeCreatorTab === 'manual' ? (
                <form onSubmit={handleAddQuestionSubmit} className="space-y-4 text-xs font-semibold text-slate-700">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-400 text-[10px] uppercase font-black mb-1">Khối lớp</label>
                      <select
                        value={grade}
                        onChange={(e) => {
                          const val = e.target.value;
                          setGrade(val);
                          const syl = combinedSyllabus.find(s => s.grade === val && s.subject === sub);
                          if (syl && syl.chapters.length > 0) {
                            setManualChapterId(syl.chapters[0].id);
                            if (syl.chapters[0].lessons.length > 0) {
                              setManualLessonId(syl.chapters[0].lessons[0].id);
                            } else {
                              setManualLessonId('AUTO');
                            }
                          } else {
                            setManualChapterId('AUTO');
                            setManualLessonId('AUTO');
                          }
                        }}
                        className="w-full p-2 bg-slate-50 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="6">Lớp 6</option>
                        <option value="7">Lớp 7</option>
                        <option value="8">Lớp 8</option>
                        <option value="9">Lớp 9</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-400 text-[10px] uppercase font-black mb-1">Cấp độ nhận thức</label>
                      <select
                        value={level}
                        onChange={(e) => setLevel(e.target.value as QuestionLevel)}
                        className="w-full p-2 bg-slate-50 border rounded-lg focus:ring-2 focus:ring-emerald-500 font-bold"
                      >
                        <option value="Nhận biết">Nhận biết</option>
                        <option value="Thông hiểu">Thông hiểu</option>
                        <option value="Vận dụng">Vận dụng</option>
                        <option value="Vận dụng cao">Vận dụng cao</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <label className="block text-slate-400 text-[10px] uppercase font-black mb-1">Chương học / Chuyên đề</label>
                      <select
                        value={manualChapterId}
                        onChange={(e) => {
                          const chId = e.target.value;
                          setManualChapterId(chId);
                          const ch = activeSyllabusForManual?.chapters.find(c => c.id === chId);
                          if (ch && ch.lessons.length > 0) {
                            setManualLessonId(ch.lessons[0].id);
                          } else {
                            setManualLessonId('AUTO');
                          }
                        }}
                        className="w-full p-2 bg-slate-50 border rounded-lg focus:ring-2 focus:ring-emerald-500 text-xs font-bold"
                      >
                        <option value="AUTO">-- Tự do / Chưa phân chia --</option>
                        {activeSyllabusForManual?.chapters.map(ch => (
                          <option key={ch.id} value={ch.id}>{ch.title}</option>
                        ))}
                      </select>
                    </div>

                    {manualChapterId !== 'AUTO' && (
                      <div>
                        <label className="block text-slate-400 text-[10px] uppercase font-black mb-1">Bài học phân bổ</label>
                        <select
                          value={manualLessonId}
                          onChange={(e) => setManualLessonId(e.target.value)}
                          className="w-full p-2 bg-slate-50 border rounded-lg focus:ring-2 focus:ring-emerald-500 text-xs font-bold"
                        >
                          <option value="AUTO">-- Chuyên đề chung toàn chương --</option>
                          {activeChapterForManual?.lessons.map(le => (
                            <option key={le.id} value={le.id}>{le.title}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-slate-400 text-[10px] uppercase font-black mb-1">Hình thức câu hỏi</label>
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value as QuestionType)}
                      className="w-full p-2 bg-slate-50 border rounded-lg focus:ring-2 focus:ring-emerald-500 font-bold"
                    >
                      <option value="MCQ">Trắc nghiệm chọn một đáp án (MCQ)</option>
                      <option value="YESNO">Trắc nghiệm Đúng / Sai (Đa khẳng định)</option>
                      <option value="SHORT">Điền khuyết / Trả lời ngắn</option>
                      <option value="ESSAY">Tự luận học vụ / Phân tích chi tiết</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 text-[10px] uppercase font-black mb-1">Nội dung câu hỏi (Hỗ trợ định dạng KaTeX toán/tin)</label>
                    <textarea
                      rows={3}
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="Nhập đề bài câu hỏi..."
                      className="w-full p-2.5 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-semibold text-xs"
                    />
                  </div>

                  {type === 'MCQ' && (
                    <div className="space-y-2 border border-slate-100 p-3 rounded-xl bg-slate-50/50">
                      <span className="block text-slate-400 text-[10px] uppercase font-black mb-1">Khai báo phương án đáp án</span>
                      {[0, 1, 2, 3].map(idx => (
                        <div key={idx} className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="mcq-manual-ans"
                            checked={mcqAns === idx.toString()}
                            onChange={() => setMcqAns(idx.toString())}
                            className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 shrink-0"
                          />
                          <input
                            type="text"
                            value={idx === 0 ? opt0 : idx === 1 ? opt1 : idx === 2 ? opt2 : opt3}
                            onChange={(e) => {
                              const v = e.target.value;
                              if (idx === 0) setOpt0(v);
                              else if (idx === 1) setOpt1(v);
                              else if (idx === 2) setOpt2(v);
                              else setOpt3(v);
                            }}
                            placeholder={`Phương án ${['A', 'B', 'C', 'D'][idx]}...`}
                            className="flex-1 p-1.5 bg-white border border-slate-200 rounded-md text-xs font-semibold"
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {type === 'YESNO' && (
                    <div className="space-y-2 border border-slate-100 p-3 rounded-xl bg-slate-50/50">
                      <span className="block text-slate-400 text-[10px] uppercase font-black mb-1">Các nhận định Đúng / Sai</span>
                      {[0, 1, 2, 3].map(idx => (
                        <div key={idx} className="space-y-1 bg-white p-2 rounded-lg border border-slate-150">
                          <input
                            type="text"
                            value={idx === 0 ? ynOpt0 : idx === 1 ? ynOpt1 : idx === 2 ? ynOpt2 : ynOpt3}
                            onChange={(e) => {
                              const v = e.target.value;
                              if (idx === 0) setYnOpt0(v);
                              else if (idx === 1) setYnOpt1(v);
                              else if (idx === 2) setYnOpt2(v);
                              else setYnOpt3(v);
                            }}
                            placeholder={`Khẳng định ${['a', 'b', 'c', 'd'][idx]}...`}
                            className="w-full p-1.5 bg-slate-50 border rounded-md text-xs"
                          />
                          <div className="flex gap-4 pl-2">
                            <label className="flex items-center gap-1 cursor-pointer">
                              <input
                                type="radio"
                                name={`yn-ans-${idx}`}
                                checked={(idx === 0 ? ynAns0 : idx === 1 ? ynAns1 : idx === 2 ? ynAns2 : ynAns3) === 'true'}
                                onChange={() => {
                                  if (idx === 0) setYnAns0('true');
                                  else if (idx === 1) setYnAns1('true');
                                  else if (idx === 2) setYnAns2('true');
                                  else setYnAns3('true');
                                }}
                                className="text-emerald-600 focus:ring-emerald-500"
                              />
                              <span className="text-[10px] font-black text-slate-500">Đúng</span>
                            </label>
                            <label className="flex items-center gap-1 cursor-pointer">
                              <input
                                type="radio"
                                name={`yn-ans-${idx}`}
                                checked={(idx === 0 ? ynAns0 : idx === 1 ? ynAns1 : idx === 2 ? ynAns2 : ynAns3) === 'false'}
                                onChange={() => {
                                  if (idx === 0) setYnAns0('false');
                                  else if (idx === 1) setYnAns1('false');
                                  else if (idx === 2) setYnAns2('false');
                                  else setYnAns3('false');
                                }}
                                className="text-red-650 focus:ring-red-500"
                              />
                              <span className="text-[10px] font-black text-slate-500">Sai</span>
                            </label>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {type === 'SHORT' && (
                    <div>
                      <label className="block text-slate-400 text-[10px] uppercase font-black mb-1">Đáp án khớp (Ngăn cách nhiều đáp án hợp lệ bằng dấu phẩy)</label>
                      <input
                        type="text"
                        value={shortAns}
                        onChange={(e) => setShortAns(e.target.value)}
                        placeholder="Ví dụ: Biến, Biến số, variable"
                        className="w-full p-2 bg-slate-50 border rounded-lg focus:ring-2 focus:ring-emerald-500 font-semibold"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-slate-400 text-[10px] uppercase font-black mb-1">Hướng dẫn giải chi tiết</label>
                    <textarea
                      rows={2}
                      value={explain}
                      onChange={(e) => setExplain(e.target.value)}
                      placeholder="Nhập hướng dẫn giải, phân tích đáp án chi tiết..."
                      className="w-full p-2 bg-slate-50 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none font-semibold text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 text-[10px] uppercase font-black mb-1">Yêu cầu cần đạt / Mục tiêu học tập</label>
                    <input
                      type="text"
                      value={requiredOutcome}
                      onChange={(e) => setRequiredOutcome(e.target.value)}
                      placeholder="Ví dụ: Biết lược sử chiếc máy tính cơ học..."
                      className="w-full p-2 bg-slate-50 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer border-none text-xs"
                  >
                    <Plus className="w-4 h-4" />
                    Thêm câu hỏi vào kho
                  </button>
                </form>
              ) : (
                <div className="space-y-4">
                  {/* CONFIGURATION PARAMETERS FOR BATCH IMPORTS */}
                  <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100 space-y-3 text-[11px]">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block mb-1 text-slate-400 font-bold uppercase text-[9px]">Khối lớp chỉ định</label>
                        <select
                          value={importAssignGrade}
                          onChange={(e) => {
                            setImportAssignGrade(e.target.value);
                            setImportAssignChapterID('AUTO');
                            setImportAssignLessonID('AUTO');
                          }}
                          className="w-full text-xs bg-white border border-slate-200 p-2 rounded-lg outline-none font-bold text-slate-700 cursor-pointer"
                        >
                          <option value="AUTO">-- Tự phát hiện từ tệp --</option>
                          <option value="6">Lớp 6</option>
                          <option value="7">Lớp 7</option>
                          <option value="8">Lớp 8</option>
                          <option value="9">Lớp 9</option>
                        </select>
                      </div>

                      <div>
                        <label className="block mb-1 text-slate-400 font-bold uppercase text-[9px]">Môn học chỉ định</label>
                        <select
                          disabled
                          value="Tin học"
                          className="w-full text-xs bg-slate-100 border border-slate-200 p-2 rounded-lg outline-none font-bold text-slate-500 cursor-not-allowed"
                        >
                          <option value="Tin học">Tin Học</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="block mb-0.5 text-slate-400 font-bold uppercase text-[9px]">Chương học chỉ định</label>
                        <select
                          disabled={importAssignGrade === 'AUTO'}
                          value={importAssignChapterID}
                          onChange={(e) => {
                            setImportAssignChapterID(e.target.value);
                            setImportAssignLessonID('AUTO');
                          }}
                          className="w-full text-xs bg-white disabled:bg-slate-100 disabled:text-slate-400 border border-slate-200 p-1.5 rounded-lg outline-none font-bold text-slate-700 cursor-pointer"
                        >
                          <option value="AUTO">-- Tự bóc từ tệp --</option>
                          {combinedSyllabus
                            .find(sy => sy.grade === importAssignGrade && sy.subject === 'Tin học')
                            ?.chapters.map(ch => (
                              <option key={ch.id} value={ch.id}>{ch.title}</option>
                            ))
                          }
                        </select>
                      </div>

                      <div>
                        <label className="block mb-0.5 text-slate-400 font-bold uppercase text-[9px]">Bài học chỉ định</label>
                        <select
                          disabled={importAssignChapterID === 'AUTO'}
                          value={importAssignLessonID}
                          onChange={(e) => setImportAssignLessonID(e.target.value)}
                          className="w-full text-xs bg-white disabled:bg-slate-100 disabled:text-slate-400 border border-slate-200 p-1.5 rounded-lg outline-none font-bold text-slate-700 cursor-pointer"
                        >
                          <option value="AUTO">-- Tự bóc từ tệp --</option>
                          {combinedSyllabus
                            .find(sy => sy.grade === importAssignGrade && sy.subject === 'Tin học')
                            ?.chapters.find(ch => ch.id === importAssignChapterID)
                            ?.lessons.map(le => (
                              <option key={le.id} value={le.id}>{le.title}</option>
                            ))
                          }
                        </select>
                      </div>
                    </div>

                    {/* COGNITIVE LEVEL FILTER */}
                    <div className="border-t border-slate-100 pt-2.5">
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-slate-500 font-extrabold uppercase text-[9px]">Mức độ nhận thức hiển thị</label>
                        <div className="flex gap-2 text-[9px] font-black">
                          <button
                            type="button"
                            onClick={() => setImportSelectedLevels(['Nhận biết', 'Thông hiểu', 'Vận dụng', 'Vận dụng cao'])}
                            className="text-emerald-600 hover:underline cursor-pointer bg-transparent border-none p-0"
                          >
                            Tất cả
                          </button>
                          <span className="text-slate-300">|</span>
                          <button
                            type="button"
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
                              className={`flex items-center gap-1.5 p-1.5 rounded-lg text-[9.5px] font-bold cursor-pointer transition-all ${
                                isSelected
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
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
                                className="w-3.5 h-3.5 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                              />
                              <span>{lvl}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* DRAG AND DROP AREA */}
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`p-6 border-2 border-dashed rounded-xl text-center cursor-pointer transition-all ${
                      dragActive 
                        ? 'border-emerald-600 bg-emerald-50/40' 
                        : 'border-slate-300 hover:border-slate-400 bg-slate-50/50'
                    }`}
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileInputChange}
                      onClick={(e) => e.stopPropagation()}
                      accept=".txt"
                      className="hidden"
                    />
                    <Upload className="w-10 h-10 text-emerald-600 mx-auto mb-2 animate-bounce" />
                    <p className="text-xs font-bold text-slate-700">Kéo thả tệp tin câu hỏi (.txt) hoặc click để chọn</p>
                    <p className="text-[10px] text-slate-400 mt-1 font-semibold">Tự động nhận diện cấu trúc đề thi, đáp án và giải thích chi tiết</p>
                    
                    {/* Always visible, highly prominent button inside the upload zone */}
                    <div className="mt-4">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          fileInputRef.current?.click();
                        }}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-black rounded-lg shadow-sm transition-all inline-flex items-center gap-1.5 cursor-pointer border-none"
                      >
                        <Upload className="w-3.5 h-3.5 text-white" />
                        Chọn tệp để thêm câu hỏi vào kho
                      </button>
                    </div>
                  </div>

                  {importStatus && (
                    <div className="p-3 bg-indigo-50 border border-indigo-100 text-indigo-800 rounded-lg flex items-center gap-2 text-xs font-semibold">
                      <RefreshCw className="w-4 h-4 animate-spin text-indigo-500 shrink-0" />
                      <span>{importStatus}</span>
                    </div>
                  )}

                  {/* Staging List preview before saving */}
                  {importedQuestions.length > 0 && (() => {
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
                            onClick={() => {
                              if (allVisibleChecked) {
                                setSelectedImportIndices(selectedImportIndices.filter(idx => !visibleIndices.includes(idx)));
                              } else {
                                const union = Array.from(new Set([...selectedImportIndices, ...visibleIndices]));
                                setSelectedImportIndices(union);
                              }
                            }}
                            className="text-emerald-700 text-[10px] hover:underline bg-transparent border-none cursor-pointer font-bold"
                          >
                            {allVisibleChecked ? 'Bỏ chọn hết' : 'Chọn tất cả'}
                          </button>
                        </div>

                        <div className="max-h-[190px] overflow-y-auto border rounded-xl divide-y space-y-1 p-2 bg-slate-50">
                          {visibleStagedWithIndex.length === 0 ? (
                            <p className="text-center text-slate-400 py-3 text-[10px] font-semibold italic">
                              {importSelectedLevels.length === 0 
                                ? '⚠️ Hãy chọn mức độ nhận thức ở trên để hiển thị câu hỏi.' 
                                : 'Không có câu hỏi nào khớp mức độ nhận thức đã lọc.'}
                            </p>
                          ) : (
                            visibleStagedWithIndex.map((item) => {
                              const isChecked = selectedImportIndices.includes(item.originalIndex);
                              return (
                                <div key={item.originalIndex} className="flex items-start gap-2 py-1.5 first:pt-0 last:pb-0 text-[10px]">
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
                                      Mức độ: <span className="font-bold text-emerald-700">{item.q.level}</span> | Dạng: <span className="font-bold text-emerald-700">{item.q.type}</span>
                                      {item.q.requiredOutcome && (
                                        <>
                                          {' | '}
                                          Yêu cầu cần đạt: <span className="font-bold text-emerald-600">{item.q.requiredOutcome}</span>
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
                          onClick={() => {
                            const finalIndexesToSubmit = selectedImportIndices.filter(idx => {
                              const lvl = importedQuestions[idx]?.level;
                              return lvl && importSelectedLevels.includes(lvl);
                            });
                            if (finalIndexesToSubmit.length === 0) {
                              alert('Vui lòng tích chọn câu hỏi muốn đưa vào kho lưu trữ!');
                              return;
                            }
                            setSelectedImportIndices(finalIndexesToSubmit);
                            setTimeout(() => {
                              handleBulkImportSubmit();
                            }, 50);
                          }}
                          className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5 cursor-pointer border-none"
                        >
                          <CheckCircle className="w-4 h-4 text-white" />
                          Thêm {visibleCheckedCount} câu hỏi vào kho
                        </button>
                      </div>
                    );
                  })()}

                  {/* PREVIEW TEMPLATE EXAMPLES */}
                  <div className="border rounded-xl overflow-hidden">
                    <div className="bg-slate-50 p-2.5 border-b flex items-center justify-between text-[10px] uppercase font-black text-slate-400 tracking-wider">
                      <span>Bản mẫu văn bản nguồn chuẩn (TXT)</span>
                      <button
                        onClick={() => {
                          const text = guideTab === 'MCQ' ? sampleGuidelineMCQ 
                                      : guideTab === 'YESNO' ? sampleGuidelineYESNO 
                                      : guideTab === 'SHORT' ? sampleGuidelineSHORT 
                                      : sampleGuidelineESSAY;
                          navigator.clipboard.writeText(text);
                          setCopiedText(true);
                          setTimeout(() => setCopiedText(false), 2000);
                        }}
                        className="p-1 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer border-none bg-transparent"
                        title="Copy văn bản mẫu"
                      >
                        {copiedText ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>

                    <div className="flex border-b text-[10px] font-bold bg-slate-50/30">
                      {(['MCQ', 'YESNO', 'SHORT', 'ESSAY'] as QuestionType[]).map((tab) => (
                        <button
                          key={tab}
                          onClick={() => setGuideTab(tab)}
                          className={`flex-1 py-1.5 text-center cursor-pointer border-none bg-transparent border-b-2 transition-colors ${
                            guideTab === tab ? 'text-emerald-700 font-black border-b-emerald-600' : 'text-slate-500'
                          }`}
                        >
                          {tab === 'MCQ' ? 'Trắc nghiệm MCQ' : tab === 'YESNO' ? 'Đúng Sai' : tab === 'SHORT' ? 'Trả lời ngắn' : 'Tự luận'}
                        </button>
                      ))}
                    </div>

                    <pre className="p-3 bg-slate-900 text-slate-200 text-[10px] leading-relaxed font-mono overflow-x-auto whitespace-pre-wrap max-h-48">
                      {guideTab === 'MCQ' && sampleGuidelineMCQ}
                      {guideTab === 'YESNO' && sampleGuidelineYESNO}
                      {guideTab === 'SHORT' && sampleGuidelineSHORT}
                      {guideTab === 'ESSAY' && sampleGuidelineESSAY}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: SEARCH, FILTERS & CARDS */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* Tabs for Right Pane if there are imported questions */}
          {importedQuestions.length > 0 && (
            <div className="bg-white p-1 rounded-xl border border-slate-150 flex gap-1 shadow-xs">
              <button
                type="button"
                onClick={() => setRightPanelTab('database')}
                className={`flex-1 py-2 text-xs font-black rounded-lg transition-all cursor-pointer border-none flex items-center justify-center gap-1.5 ${
                  rightPanelTab === 'database'
                    ? 'bg-slate-100 text-slate-800'
                    : 'text-slate-500 bg-transparent hover:bg-slate-50'
                }`}
              >
                <Library className="w-4 h-4 text-slate-500" />
                Kho câu hỏi chính ({questions.filter(q => q.subject === 'Tin học').length} câu)
              </button>
              <button
                type="button"
                onClick={() => setRightPanelTab('import-preview')}
                className={`flex-1 py-2 text-xs font-black rounded-lg transition-all cursor-pointer border-none flex items-center justify-center gap-1.5 ${
                  rightPanelTab === 'import-preview'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-500 bg-transparent hover:bg-slate-50'
                }`}
              >
                <FileText className="w-4 h-4" />
                Duyệt câu hỏi trong tệp nạp (.txt)
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                  rightPanelTab === 'import-preview' ? 'bg-white text-emerald-700' : 'bg-rose-500 text-white'
                }`}>
                  {importedQuestions.length} câu
                </span>
              </button>
            </div>
          )}

          {rightPanelTab === 'database' || importedQuestions.length === 0 ? (
            <>
              {/* SEARCH & FILTERS CONTROLS */}
              <div className="bg-white p-4 border rounded-2xl shadow-xs flex flex-wrap gap-3 items-center justify-between">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="w-4.5 h-4.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tìm nội dung câu hỏi, chủ đề, hướng dẫn giải..."
                    className="w-full text-xs font-semibold pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  <select
                    value={filterGrade}
                    onChange={(e) => {
                      setFilterGrade(e.target.value);
                      setFilterChapterId('ALL');
                      setFilterLessonId('ALL');
                    }}
                    className="text-xs font-bold bg-slate-50 border border-slate-200 rounded-lg p-2 cursor-pointer text-slate-700"
                  >
                    <option value="ALL">Tất cả Lớp</option>
                    <option value="6">Khối Lớp 6</option>
                    <option value="7">Khối Lớp 7</option>
                    <option value="8">Khối Lớp 8</option>
                    <option value="9">Khối Lớp 9</option>
                  </select>

                  <select
                    disabled={filterGrade === 'ALL'}
                    value={filterChapterId}
                    onChange={(e) => {
                      setFilterChapterId(e.target.value);
                      setFilterLessonId('ALL');
                    }}
                    className="text-xs font-bold bg-slate-50 border border-slate-200 rounded-lg p-2 cursor-pointer text-slate-700 max-w-[200px] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="ALL">Tất cả Chủ đề</option>
                    <option value="ch-general">Tự do / Chưa phân chia</option>
                    {filterGrade !== 'ALL' && combinedSyllabus
                      .find(sy => sy.grade === filterGrade && sy.subject === 'Tin học')
                      ?.chapters.map(ch => (
                        <option key={ch.id} value={ch.id}>{ch.title}</option>
                      ))
                    }
                  </select>

                  <select
                    disabled={filterChapterId === 'ALL' || filterChapterId === 'ch-general'}
                    value={filterLessonId}
                    onChange={(e) => setFilterLessonId(e.target.value)}
                    className="text-xs font-bold bg-slate-50 border border-slate-200 rounded-lg p-2 cursor-pointer text-slate-700 max-w-[200px] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="ALL">Tất cả Bài học</option>
                    <option value="le-general">Chuyên đề chung toàn chương</option>
                    {filterGrade !== 'ALL' && filterChapterId !== 'ALL' && combinedSyllabus
                      .find(sy => sy.grade === filterGrade && sy.subject === 'Tin học')
                      ?.chapters.find(ch => ch.id === filterChapterId)
                      ?.lessons.map(le => (
                        <option key={le.id} value={le.id}>{le.title}</option>
                      ))
                    }
                  </select>

                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="text-xs font-bold bg-slate-50 border border-slate-200 rounded-lg p-2 cursor-pointer text-slate-700"
                  >
                    <option value="ALL">Tất cả Dạng</option>
                    <option value="MCQ">Trắc nghiệm chọn một đáp án</option>
                    <option value="YESNO">Trắc nghiệm Đúng / Sai</option>
                    <option value="SHORT">Điền khuyết / Trả lời ngắn</option>
                    <option value="ESSAY">Tự luận</option>
                  </select>
                </div>
              </div>

              {/* QUESTIONS LIST */}
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider pl-1">
                  <span>Danh sách câu hỏi lọc ({filteredQuestions.length} kết quả)</span>
                  <span>Tin học THCS</span>
                </div>

                {filteredQuestions.length === 0 ? (
                  <div className="bg-white p-12 text-center border rounded-2xl shadow-xs space-y-2">
                    <Library className="w-12 h-12 text-slate-350 mx-auto" />
                    <h3 className="text-sm font-black text-slate-700">Chưa tìm thấy câu hỏi tương thích</h3>
                    <p className="text-xs text-slate-400 font-semibold">Vui lòng tinh chỉnh lại bộ lọc hoặc soạn thêm câu hỏi mới.</p>
                  </div>
                ) : (
                  filteredQuestions.map((q, idx) => (
                    <div key={q.id || idx} className="bg-white border hover:border-emerald-350 rounded-2xl shadow-xs p-5 transition-all space-y-4 relative group">
                      
                      {/* CARD UPPER LABELS */}
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="bg-emerald-50 text-emerald-700 border border-emerald-150 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wide">
                            Lớp {q.grade}
                          </span>
                          <span className="bg-slate-50 text-slate-600 border border-slate-200 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wide">
                            {q.type === 'MCQ' ? 'Trắc nghiệm chọn một' : q.type === 'YESNO' ? 'Đúng / Sai' : q.type === 'SHORT' ? 'Trả lời ngắn' : 'Tự luận'}
                          </span>
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wide ${
                            q.level === 'Nhận biết' ? 'bg-sky-50 text-sky-700 border border-sky-150' :
                            q.level === 'Thông hiểu' ? 'bg-amber-50 text-amber-700 border border-amber-150' :
                            q.level === 'Vận dụng' ? 'bg-purple-50 text-purple-700 border border-purple-150' :
                            'bg-rose-50 text-rose-700 border border-rose-150'
                          }`}>
                            {q.level}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 text-[10px] font-extrabold text-slate-400">
                          <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                          <span>{q.topic}</span>
                        </div>
                      </div>

                      {/* QUESTION CONTENT */}
                      <div className="text-slate-850 font-extrabold text-xs md:text-sm leading-relaxed whitespace-pre-wrap">
                        <span className="text-emerald-600 font-black mr-1">Câu {idx + 1}:</span>
                        <MathText text={q.content} />
                      </div>

                      {/* MCQ OPTIONS LIST */}
                      {q.type === 'MCQ' && q.options && q.options.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-semibold pl-1 text-slate-650">
                          {q.options.slice(0, 4).map((opt, oIdx) => {
                            const isCorrect = q.answer === oIdx.toString();
                            return (
                              <div 
                                key={oIdx} 
                                className={`p-2 rounded-xl border flex items-start gap-2 ${
                                  isCorrect 
                                    ? 'bg-emerald-50/70 border-emerald-250 text-emerald-800' 
                                    : 'bg-slate-50/50 border-slate-150'
                                }`}
                              >
                                <span className={`w-5 h-5 rounded-full font-bold flex items-center justify-center text-[10px] shrink-0 ${
                                  isCorrect ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                                }`}>
                                  {['A', 'B', 'C', 'D'][oIdx]}
                                </span>
                                <span className="pt-0.5"><MathText text={opt} /></span>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* YESNO STATEMENTS LIST */}
                      {q.type === 'YESNO' && q.options && q.options.length > 0 && (
                        <div className="space-y-2 text-xs font-semibold text-slate-655 pl-1">
                          {q.options.slice(0, 4).map((opt, oIdx) => {
                            const ansList = q.answer.split(',');
                            const isTrue = ansList[oIdx] === 'true';
                            return (
                              <div key={oIdx} className="p-2 border border-slate-150 rounded-xl bg-slate-50/40 flex items-start justify-between gap-3">
                                <div className="flex gap-2">
                                  <span className="font-black text-slate-400">{['a', 'b', 'c', 'd'][oIdx]})</span>
                                  <span><MathText text={opt} /></span>
                                </div>
                                <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase ${
                                  isTrue ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                                }`}>
                                  {isTrue ? 'Đúng' : 'Sai'}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* SHORT ANSWER */}
                      {q.type === 'SHORT' && (
                        <div className="p-3 bg-amber-50/60 border border-amber-100 rounded-xl pl-3 flex items-center gap-1.5 text-xs font-extrabold text-amber-800">
                          <span className="text-[10px] uppercase font-black tracking-wide bg-amber-200/60 px-2 py-0.5 rounded-md">Đáp án:</span>
                          <span>{q.answer}</span>
                        </div>
                      )}

                      {/* ESSAY SOLUTION */}
                      {q.type === 'ESSAY' && (
                        <div className="p-3 bg-purple-50/50 border border-purple-100 rounded-xl text-xs font-semibold pl-3 text-purple-900 leading-relaxed">
                          <span className="font-black block text-[10px] text-purple-500 uppercase tracking-wide mb-1">Gợi ý tự luận:</span>
                          <MathText text={q.explain} />
                        </div>
                      )}

                      {/* BOTTOM INFO PANEL */}
                      {q.explain && q.type !== 'ESSAY' && (
                        <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs pl-3 text-slate-500 leading-relaxed font-semibold">
                          <span className="font-extrabold text-slate-700 block text-[10px] uppercase tracking-wide mb-1">Hướng dẫn giải chi tiết:</span>
                          <MathText text={q.explain} />
                        </div>
                      )}

                      {/* ACTION CONTROLS PANEL */}
                      <div className="flex items-center justify-between border-t border-dashed border-slate-100 pt-3">
                        <div className="text-[10px] font-bold text-slate-400">
                          <span>Nguồn: <strong>{q.source || 'Kho Tin học'}</strong></span>
                          {q.requiredOutcome && (
                            <span className="ml-3 border-l pl-3">Outcome: <strong>{q.requiredOutcome}</strong></span>
                          )}
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => triggerOpenEditModal(q)}
                            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 transition-colors cursor-pointer border-none bg-transparent"
                            title="Chỉnh sửa chi tiết"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => {
                              if (confirm('Bạn chắc chắn muốn xóa câu hỏi này ra khỏi kho lưu trữ?')) {
                                onDeleteQuestion(q.id);
                              }
                            }}
                            className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600 transition-colors cursor-pointer border-none bg-transparent"
                            title="Xóa câu hỏi"
                          >
                            <Trash className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          ) : (
            /* IMPORT PREVIEW INTERFACE */
            <div className="space-y-4">
              {/* Info Header Banner */}
              <div className="bg-emerald-50 border border-emerald-150 p-4 rounded-2xl shadow-xs">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-emerald-600 rounded-xl text-white shrink-0">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-black text-emerald-900 flex items-center gap-2">
                      Duyệt & Tinh Lọc Học Liệu Nạp Từ Tệp
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full">
                        {importedQuestions.length} câu bóc tách
                      </span>
                    </h3>
                    <p className="text-slate-600 text-xs font-semibold mt-1 leading-relaxed">
                      Các câu hỏi bên dưới đã được bóc tách tự động thành công từ tệp tin <code>.txt</code>. Hãy tích chọn các câu hỏi tối ưu nhất và nhấn <strong>"Đồng bộ vào Kho Lưu Trữ"</strong> để nhập liệu hàng loạt.
                    </p>
                  </div>
                </div>

                {/* Bulk controls bar */}
                <div className="mt-4 pt-3 border-t border-emerald-100/50 flex flex-wrap items-center justify-between gap-3">
                  {(() => {
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
                      <>
                        <div className="flex items-center gap-4">
                          <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={allVisibleChecked}
                              onChange={() => {
                                if (allVisibleChecked) {
                                  setSelectedImportIndices(selectedImportIndices.filter(idx => !visibleIndices.includes(idx)));
                                } else {
                                  const union = Array.from(new Set([...selectedImportIndices, ...visibleIndices]));
                                  setSelectedImportIndices(union);
                                }
                              }}
                              className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                            />
                            <span>Chọn tất cả ({visibleStagedWithIndex.length} câu)</span>
                          </label>

                          <span className="text-slate-300">|</span>
                          <span className="text-xs font-bold text-slate-500">
                            Đang chọn: <strong className="text-emerald-700">{visibleCheckedCount} / {visibleStagedWithIndex.length}</strong> câu hiển thị
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setImportedQuestions([]);
                              setSelectedImportIndices([]);
                              setImportStatus(null);
                              setRightPanelTab('database');
                            }}
                            className="px-3 py-2 text-xs font-black text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer border-none"
                          >
                            Hủy bỏ tệp nạp
                          </button>
                          
                          <button
                            type="button"
                            onClick={() => {
                              const finalIndexesToSubmit = selectedImportIndices.filter(idx => {
                                const lvl = importedQuestions[idx]?.level;
                                return lvl && importSelectedLevels.includes(lvl);
                              });
                              if (finalIndexesToSubmit.length === 0) {
                                alert('Vui lòng tích chọn câu hỏi muốn đưa vào kho lưu trữ!');
                                return;
                              }
                              setSelectedImportIndices(finalIndexesToSubmit);
                              setTimeout(() => {
                                handleBulkImportSubmit();
                              }, 50);
                            }}
                            className="px-4 py-2.5 text-xs font-black text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer border-none"
                          >
                            <CheckCircle className="w-4 h-4 text-white" />
                            Thêm {visibleCheckedCount} câu hỏi vào kho
                          </button>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* STAGED CARDS PREVIEW */}
              <div className="space-y-4">
                {(() => {
                  const visibleStagedWithIndex = importedQuestions
                    .map((q, idx) => ({ q, originalIndex: idx }))
                    .filter(item => importSelectedLevels.includes(item.q.level));

                  if (visibleStagedWithIndex.length === 0) {
                    return (
                      <div className="bg-white p-12 text-center border rounded-2xl shadow-xs space-y-2">
                        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
                        <h3 className="text-sm font-black text-slate-700">Không có câu hỏi nào được hiển thị</h3>
                        <p className="text-xs text-slate-400 font-semibold max-w-sm mx-auto">
                          Hãy kiểm tra và tích chọn ít nhất một "Mức độ nhận thức hiển thị" bên bảng điều khiển lọc tệp tin phía tay trái.
                        </p>
                      </div>
                    );
                  }

                  return visibleStagedWithIndex.map((item, idx) => {
                    const q = item.q;
                    const isChecked = selectedImportIndices.includes(item.originalIndex);
                    
                    // Syllabus and configuration fallback
                    const displayGrade = importAssignGrade === 'AUTO' ? q.grade : importAssignGrade;
                    const displayChapterId = importAssignChapterID === 'AUTO' ? q.chapterId : importAssignChapterID;
                    const displayLessonId = importAssignLessonID === 'AUTO' ? q.lessonId : importAssignLessonID;

                    const { chapterTitle, lessonTitle } = getSelectedSyllabusTitles();
                    let displayTopic = q.topic;
                    if (importAssignChapterID !== 'AUTO') {
                      displayTopic = chapterTitle;
                      if (importAssignLessonID !== 'AUTO' && lessonTitle) {
                        displayTopic += ` - ${lessonTitle}`;
                      }
                    }

                    return (
                      <div 
                        key={item.originalIndex} 
                        className={`bg-white border rounded-2xl shadow-xs p-5 transition-all space-y-4 relative ${
                          isChecked 
                            ? 'border-emerald-500 ring-2 ring-emerald-500/10' 
                            : 'border-slate-200 opacity-80 hover:opacity-100 hover:border-slate-300'
                        }`}
                      >
                        {/* SELECTABLE HEADER BLOCK */}
                        <div 
                          className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 cursor-pointer select-none"
                          onClick={() => {
                            if (isChecked) {
                              setSelectedImportIndices(selectedImportIndices.filter((i) => i !== item.originalIndex));
                            } else {
                              setSelectedImportIndices([...selectedImportIndices, item.originalIndex]);
                            }
                          }}
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              readOnly
                              className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 pointer-events-none cursor-pointer"
                            />
                            <span className="text-xs font-black text-slate-700">
                              Câu {idx + 1} bóc từ tệp {isChecked ? '(Được chọn nhập kho)' : '(Bỏ qua)'}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 text-[9px] font-black uppercase text-indigo-700 bg-indigo-50 border border-indigo-150 px-2 py-0.5 rounded-md">
                            SẴN SÀNG ĐỒNG BỘ
                          </div>
                        </div>

                        {/* CARD UPPER LABELS */}
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="bg-emerald-50 text-emerald-700 border border-emerald-150 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wide">
                              Lớp {displayGrade}
                            </span>
                            <span className="bg-slate-50 text-slate-600 border border-slate-200 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wide">
                              {q.type === 'MCQ' ? 'Trắc nghiệm chọn một' : q.type === 'YESNO' ? 'Đúng / Sai' : q.type === 'SHORT' ? 'Trả lời ngắn' : 'Tự luận'}
                            </span>
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wide ${
                              q.level === 'Nhận biết' ? 'bg-sky-50 text-sky-700 border border-sky-150' :
                              q.level === 'Thông hiểu' ? 'bg-amber-50 text-amber-700 border border-amber-150' :
                              q.level === 'Vận dụng' ? 'bg-purple-50 text-purple-700 border border-purple-150' :
                              'bg-rose-50 text-rose-700 border border-rose-150'
                            }`}>
                              {q.level}
                            </span>
                          </div>

                          <div className="flex items-center gap-1 text-[10px] font-extrabold text-slate-400 max-w-[250px] truncate">
                            <BookOpen className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">{displayTopic || 'Tin học THCS'}</span>
                          </div>
                        </div>

                        {/* QUESTION CONTENT */}
                        <div className="text-slate-850 font-extrabold text-xs md:text-sm leading-relaxed whitespace-pre-wrap">
                          <MathText text={q.content} />
                        </div>

                        {/* MCQ OPTIONS LIST */}
                        {q.type === 'MCQ' && q.options && q.options.length > 0 && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-semibold pl-1 text-slate-650">
                            {q.options.slice(0, 4).map((opt, oIdx) => {
                              const isCorrect = q.answer === oIdx.toString();
                              return (
                                <div 
                                  key={oIdx} 
                                  className={`p-2 rounded-xl border flex items-start gap-2 ${
                                    isCorrect 
                                      ? 'bg-emerald-50/75 border-emerald-250 text-emerald-800' 
                                      : 'bg-slate-50/50 border-slate-150'
                                  }`}
                                >
                                  <span className={`w-5 h-5 rounded-full font-bold flex items-center justify-center text-[10px] shrink-0 ${
                                    isCorrect ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                                  }`}>
                                    {['A', 'B', 'C', 'D'][oIdx]}
                                  </span>
                                  <span className="pt-0.5"><MathText text={opt} /></span>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* YESNO STATEMENTS LIST */}
                        {q.type === 'YESNO' && q.options && q.options.length > 0 && (
                          <div className="space-y-2 text-xs font-semibold text-slate-655 pl-1">
                            {q.options.slice(0, 4).map((opt, oIdx) => {
                              const ansList = q.answer.split(',');
                              const isTrue = ansList[oIdx] === 'true';
                              return (
                                <div key={oIdx} className="p-2 border border-slate-150 rounded-xl bg-slate-50/40 flex items-start justify-between gap-3">
                                  <div className="flex gap-2">
                                    <span className="font-black text-slate-400">{['a', 'b', 'c', 'd'][oIdx]})</span>
                                    <span><MathText text={opt} /></span>
                                  </div>
                                  <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase ${
                                    isTrue ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                                  }`}>
                                    {isTrue ? 'Đúng' : 'Sai'}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* SHORT ANSWER */}
                        {q.type === 'SHORT' && (
                          <div className="p-3 bg-amber-50/60 border border-amber-100 rounded-xl pl-3 flex items-center gap-1.5 text-xs font-extrabold text-amber-800">
                            <span className="text-[10px] uppercase font-black tracking-wide bg-amber-200/60 px-2 py-0.5 rounded-md">Đáp án:</span>
                            <span>{q.answer}</span>
                          </div>
                        )}

                        {/* ESSAY SOLUTION */}
                        {q.type === 'ESSAY' && (
                          <div className="p-3 bg-purple-50/50 border border-purple-100 rounded-xl text-xs font-semibold pl-3 text-purple-900 leading-relaxed">
                            <span className="font-black block text-[10px] text-purple-500 uppercase tracking-wide mb-1">Gợi ý tự luận:</span>
                            <MathText text={q.explain} />
                          </div>
                        )}

                        {/* EXPLANATION */}
                        {q.explain && q.type !== 'ESSAY' && (
                          <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs pl-3 text-slate-500 leading-relaxed font-semibold">
                            <span className="font-extrabold text-slate-700 block text-[10px] uppercase tracking-wide mb-1">Hướng dẫn giải chi tiết:</span>
                            <MathText text={q.explain} />
                          </div>
                        )}

                        {/* REQUIRED OUTCOME */}
                        {q.requiredOutcome && (
                          <div className="text-[10px] font-bold text-slate-400 pt-1 flex items-center gap-1.5">
                            <CheckSquare className="w-3.5 h-3.5 text-slate-450" />
                            <span>Yêu cầu cần đạt: <strong>{q.requiredOutcome}</strong></span>
                          </div>
                        )}
                      </div>
                    );
                  });
                })()}
              </div>

              {/* Bottom Sticky action bar for fast imports */}
              {selectedImportIndices.length > 0 && (
                <div className="sticky bottom-4 z-10 bg-white border border-emerald-150 p-4 rounded-2xl shadow-xl flex items-center justify-between gap-4">
                  <div className="text-xs font-extrabold text-slate-700">
                    Sẵn sàng đồng bộ <span className="text-emerald-700 font-black text-sm">{selectedImportIndices.length}</span> câu hỏi được chọn vào ngân hàng rèn luyện chung!
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      handleBulkImportSubmit();
                    }}
                    className="px-6 py-3 text-sm font-black text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center gap-2 cursor-pointer border-none"
                  >
                    <CheckCircle className="w-5 h-5 text-white animate-pulse" />
                    Thêm {selectedImportIndices.length} câu hỏi vào kho
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* -----------------------------------------------------------------
          SIDE DRAWER: EXPLORER MATRIX VIEW (XEM KHO CÂU HỎI)
          ----------------------------------------------------------------- */}
      {isExplorerOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex justify-end z-50">
          <div className="w-full max-w-5xl bg-white h-full shadow-2xl flex flex-col animate-slide-in">
            
            {/* DRAWER HEADER PANEL */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <Layers className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="text-sm font-black tracking-tight">Sơ đồ ma trận & Phân phối môn Tin học</h3>
                  <p className="text-[10px] text-slate-400 font-semibold">Tích chọn câu hỏi chưa phân loại để phân phối nhanh vào từng chủ đề, bài học sách giáo khoa.</p>
                </div>
              </div>
              <button
                onClick={() => setIsExplorerOpen(false)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer border-none"
              >
                Đóng
              </button>
            </div>

            {/* GRADE TABS PANEL */}
            <div className="px-4 py-3 bg-slate-50 border-b flex items-center justify-between shrink-0">
              <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200">
                {['6', '7', '8', '9'].map(gr => (
                  <button
                    key={gr}
                    onClick={() => {
                      setExplorerGrade(gr);
                      setSelectedNode(null);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-black border-none cursor-pointer transition-all ${
                      explorerGrade === gr ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-500 bg-transparent hover:text-slate-800'
                    }`}
                  >
                    Lớp {gr}
                  </button>
                ))}
              </div>
            </div>

            {/* SPLIT PANEL VIEW */}
            <div className="flex-1 flex overflow-hidden min-h-0 bg-slate-50/50">
              
              {/* LEFT SIDEBAR: DIRECTORY ACCORDION */}
              <div className="w-1/2 p-4 overflow-y-auto border-r border-slate-200 space-y-3">
                <div className="flex items-center justify-between text-[10px] font-black uppercase text-slate-400 border-b pb-1">
                  <span>Mục lục sơ đồ bài học</span>
                  <span>Phân bổ</span>
                </div>

                {/* UNASSIGNED NODE */}
                <button
                  onClick={() => setSelectedNode({ chapterId: 'ch-unassigned', lessonId: 'le-general' })}
                  className={`w-full p-3 rounded-xl border text-left cursor-pointer transition-all flex items-center justify-between ${
                    (selectedNode && selectedNode.chapterId === 'ch-unassigned') || (!selectedNode && unassignedQs.length > 0)
                      ? 'bg-rose-50 border-rose-250 text-rose-800'
                      : 'bg-white hover:bg-rose-50/20 border-slate-200 text-slate-600'
                  }`}
                >
                  <span className="flex items-center gap-2 font-black text-xs">
                    <AlertCircle className="w-4 h-4 text-rose-500" />
                    Câu hỏi chưa phân phối (Chờ gán)
                  </span>
                  <span className="px-2 py-0.5 bg-rose-100 rounded-full text-[10px] font-black text-rose-900">
                    {unassignedQs.length} câu
                  </span>
                </button>

                {/* TEXTBOOK TOPICS MAP */}
                {syllabusStructure.map((ch) => {
                  const isExpanded = explorerExpandedChapters.includes(ch.id);
                  const toggleExpand = () => {
                    if (isExpanded) {
                      setExplorerExpandedChapters(explorerExpandedChapters.filter(id => id !== ch.id));
                    } else {
                      setExplorerExpandedChapters([...explorerExpandedChapters, ch.id]);
                    }
                  };

                  return (
                    <div key={ch.id} className="bg-white border rounded-xl overflow-hidden shadow-xs">
                      <div className="p-2.5 bg-slate-50/70 border-b flex items-center justify-between">
                        <button
                          onClick={toggleExpand}
                          className="flex items-center gap-1.5 text-left border-none bg-transparent cursor-pointer font-black text-xs text-slate-800 min-w-0"
                        >
                          {isExpanded ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                          <FolderOpen className="w-4 h-4 text-amber-500" />
                          <span className="truncate">{ch.title}</span>
                        </button>
                        <span className="px-2 py-0.5 bg-slate-200/60 rounded-full text-[10px] font-black text-slate-600">
                          {ch.chQsCount} câu
                        </span>
                      </div>

                      {isExpanded && (
                        <div className="divide-y text-xs">
                          {/* General Chapter Item */}
                          <button
                            onClick={() => setSelectedNode({ chapterId: ch.id, lessonId: 'le-general' })}
                            className={`w-full p-2 pl-9 hover:bg-slate-50 text-left border-none cursor-pointer flex items-center justify-between text-[11px] font-bold ${
                              selectedNode && selectedNode.chapterId === ch.id && selectedNode.lessonId === 'le-general'
                                ? 'bg-emerald-50 text-emerald-800 font-extrabold border-l-4 border-emerald-600 pl-8'
                                : 'text-slate-500 bg-white'
                            }`}
                          >
                            <span>↳ Chuyên đề chung toàn chương</span>
                            <span>{ch.generalChCount} câu</span>
                          </button>

                          {/* Lesson Items */}
                          {ch.lessonsStructure.map(le => (
                            <button
                              key={le.id}
                              onClick={() => setSelectedNode({ chapterId: ch.id, lessonId: le.id })}
                              className={`w-full p-2 pl-9 hover:bg-slate-50 text-left border-none cursor-pointer flex items-center justify-between text-[11px] font-bold ${
                                selectedNode && selectedNode.chapterId === ch.id && selectedNode.lessonId === le.id
                                  ? 'bg-emerald-50 text-emerald-800 font-extrabold border-l-4 border-emerald-600 pl-8'
                                  : 'text-slate-655 bg-white'
                              }`}
                            >
                              <span className="truncate">{le.title}</span>
                              <span>{le.count} câu</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* RIGHT CONTENT COLUMN: BROWSE & QUICK ASSIGNMENT */}
              <div className="w-1/2 p-4 overflow-y-auto flex flex-col gap-4">
                
                {/* ACTIONS PANEL FOR TARGET ASSIGNMENT */}
                <div className="bg-white p-3.5 border border-slate-200 rounded-xl space-y-3 shrink-0 shadow-xs">
                  <div className="flex items-center gap-1 text-slate-700 font-black text-xs">
                    <CheckSquare className="w-4 h-4 text-emerald-500" />
                    <span>Hành động phân phối nhanh ({explorerSelectedQuestionIds.length} mục chọn)</span>
                  </div>

                  <div className="grid grid-cols-1 gap-2.5">
                    <div>
                      <select
                        value={explorerMoveTargetChapter}
                        onChange={(e) => {
                          setExplorerMoveTargetChapter(e.target.value);
                          setExplorerMoveTargetLesson('');
                        }}
                        className="w-full text-xs font-bold bg-slate-50 border rounded-lg p-2 cursor-pointer"
                      >
                        <option value="">-- Bước 1. Chọn Chủ đề đích --</option>
                        {syllabusStructure.map(ch => (
                          <option key={ch.id} value={ch.id}>{ch.title}</option>
                        ))}
                      </select>
                    </div>

                    {explorerMoveTargetChapter && (
                      <div>
                        <select
                          value={explorerMoveTargetLesson}
                          onChange={(e) => setExplorerMoveTargetLesson(e.target.value)}
                          className="w-full text-xs font-bold bg-slate-50 border rounded-lg p-2 cursor-pointer"
                        >
                          <option value="le-general">-- Bước 2. Chọn Chuyên đề chung toàn chương --</option>
                          {syllabusStructure.find(c => c.id === explorerMoveTargetChapter)?.lessonsStructure.map(le => (
                            <option key={le.id} value={le.id}>{le.title}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={handleMoveQuestions}
                    disabled={explorerSelectedQuestionIds.length === 0}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-lg transition-colors cursor-pointer border-none flex items-center justify-center gap-1 shadow-xs text-xs"
                  >
                    <ArrowRight className="w-4 h-4" />
                    Phân phối nhanh vào mục lục
                  </button>
                </div>

                {/* QUESTIONS LIST */}
                <div className="flex-1 space-y-3">
                  <div className="text-slate-400 text-[10px] font-black uppercase tracking-wider pl-1 border-b pb-1 flex items-center justify-between">
                    <span>Nội dung bên trong: {viewTitle}</span>
                    <span>{activeExplorerQs.length} câu</span>
                  </div>

                  {activeExplorerQs.length === 0 ? (
                    <div className="bg-white p-8 text-center border rounded-xl shadow-xs text-slate-400 text-xs font-semibold">
                      Chưa có câu hỏi gán cho chuyên đề này.
                    </div>
                  ) : (
                    activeExplorerQs.map(eq => (
                      <div key={eq.id} className="bg-white border rounded-xl p-3 text-xs font-semibold shadow-xs space-y-2 relative">
                        <div className="flex items-start gap-2">
                          <input
                            type="checkbox"
                            checked={explorerSelectedQuestionIds.includes(eq.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setExplorerSelectedQuestionIds([...explorerSelectedQuestionIds, eq.id]);
                              } else {
                                setExplorerSelectedQuestionIds(explorerSelectedQuestionIds.filter(id => id !== eq.id));
                              }
                            }}
                            className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 mt-0.5 shrink-0"
                          />
                          <div className="leading-relaxed text-slate-750">
                            <MathText text={eq.content} />
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-[9px] text-slate-400 uppercase font-black border-t pt-2 mt-2">
                          <span>Dạng: {eq.type} | Đáp án: {eq.type === 'MCQ' ? ['A', 'B', 'C', 'D'][parseInt(eq.answer)] || eq.answer : eq.answer}</span>
                          <span className="text-amber-600">{eq.level}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* -----------------------------------------------------------------
          DIALOG MODAL: QUICK EDIT DETAILS
          ----------------------------------------------------------------- */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden animate-zoom-in">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-400">Cập nhật chi tiết câu hỏi</span>
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="bg-transparent border-none text-slate-400 hover:text-white cursor-pointer font-bold"
              >
                Đóng
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs font-semibold text-slate-700">
              <div>
                <label className="block text-slate-400 text-[10px] uppercase font-black mb-1">Nội dung câu hỏi</label>
                <textarea
                  rows={4}
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                />
              </div>

              <div>
                <label className="block text-slate-400 text-[10px] uppercase font-black mb-1">Cấp độ nhận thức</label>
                <select
                  value={editLevel}
                  onChange={(e) => setEditLevel(e.target.value as QuestionLevel)}
                  className="w-full p-2 bg-slate-50 border rounded-lg focus:ring-2 focus:ring-emerald-500 font-bold"
                >
                  <option value="Nhận biết">Nhận biết</option>
                  <option value="Thông hiểu">Thông hiểu</option>
                  <option value="Vận dụng">Vận dụng</option>
                  <option value="Vận dụng cao">Vận dụng cao</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 text-[10px] uppercase font-black mb-1">Hướng dẫn giải chi tiết</label>
                <textarea
                  rows={2}
                  value={editExplain}
                  onChange={(e) => setEditExplain(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 text-[10px] uppercase font-black mb-1">Chủ đề chi tiết</label>
                  <input
                    type="text"
                    value={editTopic}
                    onChange={(e) => setEditTopic(e.target.value)}
                    className="w-full p-2 bg-slate-50 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-[10px] uppercase font-black mb-1">Yêu cầu cần đạt</label>
                  <input
                    type="text"
                    value={editOutcome}
                    onChange={(e) => setEditOutcome(e.target.value)}
                    className="w-full p-2 bg-slate-50 border rounded-lg"
                  />
                </div>
              </div>

              <button
                onClick={handleEditSubmit}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl transition-colors cursor-pointer border-none shadow-xs text-xs"
              >
                Lưu thay đổi học vụ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Sub-batch accurate question values mapping for preloaded Tin học THCS questions
const SAMPLE_INF_QUESTIONS: Question[] = [
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
    status: 'approved'
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
    status: 'approved'
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
    status: 'approved'
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
    status: 'approved'
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
    status: 'approved'
  }
];
