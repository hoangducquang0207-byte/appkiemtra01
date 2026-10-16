/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Syllabus } from '../types';

export const STANDARD_SUBJECTS = [
  'Toán',
  'Tin học',
  'Khoa học tự nhiên',
  'Vật lý',
  'Hóa học',
  'Sinh học',
  'Ngữ văn',
  'Tiếng Anh',
  'Lịch sử & Địa lý',
  'Lịch sử',
  'Địa lý',
  'GDCD',
  'GDKT&PL',
  'Công nghệ'
];

export const STANDARD_BOOKS = [
  'Kết nối tri thức',
  'Cánh diều',
  'Chân trời sáng tạo',
  'Global Success',
  'Dùng chung'
];

export function normalizeSubject(subject: string): string {
  const clean = String(subject || '').trim();
  if (clean === 'Toán học') return 'Toán';
  if (clean === 'Lịch sử và Địa lý') return 'Lịch sử & Địa lý';
  return clean;
}

export const FULL_SYLLABUS_CATALOG: Syllabus[] = [
  // ==================== LỚP 6 ====================
  {
    id: 'sy-toan-6',
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
          { id: 'le-03', title: 'Bài 3: Phép cộng và phép trừ số tự nhiên', topics: ['Tính chất phép cộng', 'Phép toán trừ', 'Phép nhân và phép chia số tự nhiên', 'Quy tắc dấu ngoặc'] }
        ]
      },
      {
        id: 'ch-02',
        title: 'Chương 2: Tính chia hết trong tập hợp các số tự nhiên',
        lessons: [
          { id: 'le-04', title: 'Bài 4: Quan hệ chia hết và tính chất', topics: ['Quan hệ chia hết', 'Tính chất chia hết của một tổng', 'Bội chung. Bội chung nhỏ nhất'] },
          { id: 'le-05', title: 'Bài 5: Dấu hiệu chia hết cho 2, cho 5, cho 3, cho 9', topics: ['Dấu hiệu chia hết', 'Ứng dụng thực tế'] }
        ]
      },
      {
        id: 'ch-03',
        title: 'Chương 3: Phân số và số thập phân',
        lessons: [
          { id: 'le-06', title: 'Bài 6: Mở rộng phân số. Phân số bằng nhau', topics: ['Mở rộng phân số', 'Phân số bằng nhau'] },
          { id: 'le-07', title: 'Bài 7: Hai bài toán về phân số', topics: ['Hai bài toán về phân số', 'Một số bài toán về tỉ số và tỉ số phần trăm'] },
          { id: 'le-08', title: 'Bài 8: Số thập phân', topics: ['Số thập phân', 'Các phép tính với số thập phân'] }
        ]
      },
      {
        id: 'ch-04',
        title: 'Chương 4: Một số hình phẳng trong thực tiễn',
        lessons: [
          { id: 'le-09', title: 'Bài 9: Hình có trục đối xứng và tâm đối xứng', topics: ['Hình có trục đối xứng', 'Hình có tâm đối xứng'] },
          { id: 'le-10', title: 'Bài 10: Chu vi và diện tích của một số tứ giác đã học', topics: ['Chu vi và diện tích của một số tứ giác đã học'] }
        ]
      },
      {
        id: 'ch-05',
        title: 'Chương 5: Thống kê và Hình học phẳng',
        lessons: [
          { id: 'le-11', title: 'Bài 11: Điểm, đường thẳng, góc và trung điểm', topics: ['Trung điểm của đoạn thẳng', 'Số đo góc'] },
          { id: 'le-12', title: 'Bài 12: Biểu đồ cột và biểu đồ cột kép', topics: ['Biểu đồ cột', 'Đọc dữ liệu biểu đồ'] }
        ]
      },
      {
        id: 'ch-06',
        title: 'Chương 6: Ôn tập & Bồi dưỡng',
        lessons: [
          { id: 'le-13', title: 'Bài 13: Bài tập tổng hợp & Học sinh giỏi', topics: ['Nội dung bồi dưỡng', 'Học sinh giỏi'] }
        ]
      }
    ]
  },
  {
    id: 'sy-tin-6',
    grade: '6',
    subject: 'Tin học',
    book: 'Kết nối tri thức',
    semester: '1',
    periods: '1',
    chapters: [
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
    ]
  },
  {
    id: 'sy-khtn-6',
    grade: '6',
    subject: 'Khoa học tự nhiên',
    book: 'Kết nối tri thức',
    semester: '1',
    periods: '3',
    chapters: [
      {
        id: 'khtn6-ch1',
        title: 'Chương 1: Mở đầu về Khoa học tự nhiên và Đo lường',
        lessons: [
          { id: 'khtn6-le1', title: 'Bài 1: Giới thiệu về Khoa học tự nhiên', topics: ['Vai trò KHTN', 'Phương pháp học tập'] },
          { id: 'khtn6-le2', title: 'Bài 2: Đo chiều dài, khối lượng và thời gian', topics: ['Dụng cụ đo', 'Đơn vị đo chuẩn'] }
        ]
      },
      {
        id: 'khtn6-ch2',
        title: 'Chương 2: Lực và sự chuyển động',
        lessons: [
          { id: 'khtn6-le3', title: 'Bài 3: Lực và tác dụng của lực', topics: ['Khái niệm lực', 'Đơn vị Niutơn'] },
          { id: 'khtn6-le4', title: 'Bài 4: Lực tiếp xúc và lực không tiếp xúc', topics: ['Lực hấp dẫn', 'Lực ma sát'] }
        ]
      }
    ]
  },

  // ==================== LỚP 7 ====================
  {
    id: 'sy-toan-7',
    grade: '7',
    subject: 'Toán',
    book: 'Kết nối tri thức',
    semester: '1',
    periods: '4',
    chapters: [
      {
        id: 'toan7-ch1',
        title: 'Chương 1: Số hữu tỉ',
        lessons: [
          { id: 'toan7-le1', title: 'Bài 1: Tập hợp các số hữu tỉ', topics: ['Số hữu tỉ', 'Biểu diễn trên trục số'] },
          { id: 'toan7-le2', title: 'Bài 2: Cộng, trừ, nhân, chia số hữu tỉ', topics: ['Quy tắc tính toán', 'Quy tắc chuyển vế'] },
          { id: 'toan7-le3', title: 'Bài 3: Lũy thừa với thừa số nguyên của một số hữu tỉ', topics: ['Công thức lũy thừa', 'Nhân chia lũy thừa'] }
        ]
      },
      {
        id: 'toan7-ch2',
        title: 'Chương 2: Số thực',
        lessons: [
          { id: 'toan7-le4', title: 'Bài 4: Số vô tỉ. Căn bậc hai số học', topics: ['Căn bậc hai số học', 'Số vô tỉ'] },
          { id: 'toan7-le5', title: 'Bài 5: Tập hợp các số thực', topics: ['Giá trị tuyệt đối', 'So sánh số thực'] }
        ]
      },
      {
        id: 'toan7-ch3',
        title: 'Chương 3: Góc và đường thẳng song song',
        lessons: [
          { id: 'toan7-le6', title: 'Bài 6: Các góc ở vị trí đặc biệt', topics: ['Hai góc kề bù', 'Hai góc đối đỉnh'] },
          { id: 'toan7-le7', title: 'Bài 7: Dấu hiệu nhận biết hai đường thẳng song song', topics: ['Góc so le trong', 'Góc đồng vị'] }
        ]
      }
    ]
  },
  {
    id: 'sy-tin-7',
    grade: '7',
    subject: 'Tin học',
    book: 'Kết nối tri thức',
    semester: '1',
    periods: '1',
    chapters: [
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
    ]
  },

  // ==================== LỚP 8 ====================
  {
    id: 'sy-toan-8',
    grade: '8',
    subject: 'Toán',
    book: 'Kết nối tri thức',
    semester: '1',
    periods: '4',
    chapters: [
      {
        id: 'toan8-ch1',
        title: 'Chương 1: Đa thức',
        lessons: [
          { id: 'toan8-le1', title: 'Bài 1: Đơn thức nhiều biến. Đa thức nhiều biến', topics: ['Đơn thức đồng dạng', 'Bậc của đa thức', 'Hệ số', 'Hạng tử'] },
          { id: 'toan8-le2', title: 'Bài 2: Các phép toán với đa thức nhiều biến', topics: ['Cộng trừ đa thức', 'Nhân đa thức'] }
        ]
      },
      {
        id: 'toan8-ch2',
        title: 'Chương 2: Hằng đẳng thức đáng nhớ và ứng dụng',
        lessons: [
          { id: 'toan8-le3', title: 'Bài 3: Hằng đẳng thức đáng nhớ', topics: ['Bình phương của một tổng', 'Hiệu hai bình phương'] },
          { id: 'toan8-le4', title: 'Bài 4: Phân tích đa thức thành nhân tử', topics: ['Đặt nhân tử chung', 'Nhóm hạng tử'] }
        ]
      },
      {
        id: 'toan8-ch3',
        title: 'Chương 3: Tứ giác',
        lessons: [
          { id: 'toan8-le5', title: 'Bài 1: Tứ giác', topics: ['Tổng các góc của một tứ giác', 'Tứ giác lồi'] },
          { id: 'toan8-le6', title: 'Bài 2: Hình thang cân', topics: ['Định nghĩa hình thang cân', 'Tính chất hai đường chéo'] },
          { id: 'toan8-le7', title: 'Bài 3: Hình bình hành', topics: ['Tính chất hình bình hành', 'Dấu hiệu nhận biết'] },
          { id: 'toan8-le8', title: 'Bài 4: Hình chữ nhật, hình thoi, hình vuông', topics: ['Hình chữ nhật', 'Hình thoi', 'Hình vuông'] }
        ]
      }
    ]
  },
  {
    id: 'sy-tin-8',
    grade: '8',
    subject: 'Tin học',
    book: 'Kết nối tri thức',
    semester: '1',
    periods: '1',
    chapters: [
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
        title: 'Chủ đề 5. Giải quyết vấn đề với sự trợ giúp của máy tính',
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
    ]
  },
  {
    id: 'sy-hoa-8',
    grade: '8',
    subject: 'Hóa học',
    book: 'Kết nối tri thức',
    semester: '1',
    periods: '2',
    chapters: [
      {
        id: 'hoa8-ch1',
        title: 'Chương 1: Phản ứng hóa học',
        lessons: [
          { id: 'hoa8-le1', title: 'Bài 1: Biến đổi vật lý và biến đổi hóa học', topics: ['Hiện tượng vật lý', 'Hiện tượng hóa học'] },
          { id: 'hoa8-le2', title: 'Bài 2: Phản ứng hóa học và năng lượng phản ứng', topics: ['Phương trình hóa học', 'Cân bằng phương trình'] }
        ]
      },
      {
        id: 'hoa8-ch2',
        title: 'Chương 2: Một số hợp chất thông dụng',
        lessons: [
          { id: 'hoa8-le3', title: 'Bài 3: Acid (Axit)', topics: ['Tính chất hóa học Acid', 'Axit HCl, H2SO4'] },
          { id: 'hoa8-le4', title: 'Bài 4: Base (Bazơ)', topics: ['Phân loại Bazơ', 'Thang pH'] }
        ]
      }
    ]
  },

  // ==================== LỚP 9 ====================
  {
    id: 'sy-toan-9',
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
          { id: 'le-10', title: 'Bài 2: Phương trình bậc nhất hai ẩn và hệ hai phương trình bậc nhất hai ẩn', topics: ['Hệ phương trình', 'Phương pháp thế', 'Phương pháp cộng đại số'] },
          { id: 'le-10b', title: 'Bài 3: Giải bài toán bằng cách lập hệ phương trình', topics: ['Bài toán chuyển động', 'Bài toán làm chung làm riêng'] }
        ]
      },
      {
        id: 'ch-06',
        title: 'Chương 2: Căn bậc hai và căn bậc ba',
        lessons: [
          { id: 'le-11', title: 'Bài 1: Căn bậc hai và căn thức bậc hai', topics: ['Khai căn', 'Hằng đẳng thức $\\sqrt{A^2} = |A|$'] },
          { id: 'le-12', title: 'Bài 2: Khai căn bậc hai một tích và một thương', topics: ['Biến đổi căn thức', 'Rút gọn biểu thức'] },
          { id: 'le-13', title: 'Bài 3: Căn bậc ba', topics: ['Định nghĩa căn bậc ba', 'Tính chất căn bậc ba'] }
        ]
      },
      {
        id: 'ch-07',
        title: 'Chương 3: Hàm số $y = ax^2$ ($a \\neq 0$) và Phương trình bậc hai một ẩn',
        lessons: [
          { id: 'le-14', title: 'Bài 1: Hàm số $y = ax^2$ và đồ thị', topics: ['Đồ thị Parabol', 'Tính chất biến thiên'] },
          { id: 'le-15', title: 'Bài 2: Phương trình bậc hai một ẩn và công thức nghiệm', topics: ['Công thức nghiệm Delta', 'Delta phẩy'] },
          { id: 'le-16', title: 'Bài 3: Định lý Vi-ét và ứng dụng', topics: ['Định lý Vi-ét', 'Nhẩm nghiệm', 'Hệ thức giữa các nghiệm'] }
        ]
      }
    ]
  },
  {
    id: 'sy-tin-9',
    grade: '9',
    subject: 'Tin học',
    book: 'Kết nối tri thức',
    semester: '1',
    periods: '1',
    chapters: [
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
  },
  {
    id: 'sy-van-9',
    grade: '9',
    subject: 'Ngữ văn',
    book: 'Kết nối tri thức',
    semester: '1',
    periods: '4',
    chapters: [
      {
        id: 'van9-ch1',
        title: 'Chủ đề 1: Thơ truyền kỳ và truyện thơ Nôm',
        lessons: [
          { id: 'van9-le1', title: 'Bài 1: Đọc - Chuyện người con gái Nam Xương', topics: ['Nguyễn Dữ', 'Tác phẩm truyền kỳ'] },
          { id: 'van9-le2', title: 'Bài 2: Thực hành tiếng Việt - Tác dụng của biện pháp tu từ', topics: ['Biện pháp tu từ', 'Điệp ngữ, Ẩn dụ'] }
        ]
      },
      {
        id: 'van9-ch2',
        title: 'Chủ đề 2: Văn bản nghị luận xã hội và văn học',
        lessons: [
          { id: 'van9-le3', title: 'Bài 3: Viết bài văn nghị luận về một vấn đề cần giải quyết', topics: ['Mở bài, Thân bài, Kết bài', 'Luận điểm, Lý lẽ, Dẫn chứng'] }
        ]
      }
    ]
  },
  {
    id: 'sy-anh-9',
    grade: '9',
    subject: 'Tiếng Anh',
    book: 'Global Success',
    semester: '1',
    periods: '3',
    chapters: [
      {
        id: 'eng9-ch1',
        title: 'Unit 1: Local Community',
        lessons: [
          { id: 'eng9-le1', title: 'Lesson 1: Getting Started & A Closer Look 1', topics: ['Vocabulary: Handicrafts', 'Pronunciation'] },
          { id: 'eng9-le2', title: 'Lesson 2: A Closer Look 2 & Communication', topics: ['Question words before to-infinitive', 'Phrasal verbs'] }
        ]
      },
      {
        id: 'eng9-ch2',
        title: 'Unit 2: City Life',
        lessons: [
          { id: 'eng9-le3', title: 'Lesson 1: Getting Started & Vocabulary', topics: ['City features', 'Adjectives describing city life'] },
          { id: 'eng9-le4', title: 'Lesson 2: Grammar & Skills', topics: ['Comparison of adjectives', 'Reading & Listening'] }
        ]
      }
    ]
  },

  // ==================== LỚP 10 ====================
  {
    id: 'sy-toan-10',
    grade: '10',
    subject: 'Toán',
    book: 'Kết nối tri thức',
    semester: '1',
    periods: '4',
    chapters: [
      {
        id: 'toan10-ch1',
        title: 'Chương 1: Mệnh đề và Tập hợp',
        lessons: [
          { id: 'toan10-le1', title: 'Bài 1: Mệnh đề', topics: ['Mệnh đề kéo theo', 'Mệnh đề phủ định'] },
          { id: 'toan10-le2', title: 'Bài 2: Tập hợp và các phép toán trên tập hợp', topics: ['Giao, hợp, hiệu của hai tập hợp', 'Tập con'] }
        ]
      },
      {
        id: 'toan10-ch2',
        title: 'Chương 2: Bất phương trình và hệ bất phương trình bậc nhất hai ẩn',
        lessons: [
          { id: 'toan10-le3', title: 'Bài 1: Bất phương trình bậc nhất hai ẩn', topics: ['Miền nghiệm của bất phương trình'] },
          { id: 'toan10-le4', title: 'Bài 2: Hệ bất phương trình bậc nhất hai ẩn', topics: ['Miền nghiệm của hệ bất phương trình', 'Bài toán quy hoạch tuyến tính'] }
        ]
      }
    ]
  },
  {
    id: 'sy-tin-10',
    grade: '10',
    subject: 'Tin học',
    book: 'Kết nối tri thức',
    semester: '1',
    periods: '2',
    chapters: [
      {
        id: 'tin10-ch1',
        title: 'Chủ đề 1. Máy tính và xã hội trí tuệ nhân tạo',
        lessons: [
          { id: 'tin10-le1', title: 'Bài 1. Thông tin và xử lí thông tin', topics: ['Hệ nhị phân', 'Đơn vị đo dung lượng dữ liệu'] },
          { id: 'tin10-le2', title: 'Bài 2. Vai trò của thiết bị thông minh và tin học đối với xã hội', topics: ['Internet of Things (IoT)', 'Trí tuệ nhân tạo (AI)'] }
        ]
      },
      {
        id: 'tin10-ch2',
        title: 'Chủ đề 2. Lập trình giải quyết bài toán với Python',
        lessons: [
          { id: 'tin10-le3', title: 'Bài 3. Làm quen với Python', topics: ['Biến', 'Kiểu dữ liệu', 'Phép gán'] },
          { id: 'tin10-le4', title: 'Bài 4. Các cấu trúc rẽ nhánh và lặp trong Python', topics: ['Lệnh if-else', 'Vòng lặp for', 'Vòng lặp while'] }
        ]
      }
    ]
  },

  // ==================== LỚP 11 ====================
  {
    id: 'sy-toan-11',
    grade: '11',
    subject: 'Toán',
    book: 'Kết nối tri thức',
    semester: '1',
    periods: '4',
    chapters: [
      {
        id: 'toan11-ch1',
        title: 'Chương 1: Hàm số lượng giác và phương trình lượng giác',
        lessons: [
          { id: 'toan11-le1', title: 'Bài 1: Giá trị lượng giác của góc lượng giác', topics: ['Công thức lượng giác', 'Đường tròn lượng giác'] },
          { id: 'toan11-le2', title: 'Bài 2: Phương trình lượng giác cơ bản', topics: ['Phương trình sin, cos, tan, cot'] }
        ]
      },
      {
        id: 'toan11-ch2',
        title: 'Chương 2: Dãy số. Cấp số cộng và cấp số nhân',
        lessons: [
          { id: 'toan11-le3', title: 'Bài 1: Cấp số cộng', topics: ['Số hạng tổng quát', 'Tổng n số hạng đầu'] },
          { id: 'toan11-le4', title: 'Bài 2: Cấp số nhân', topics: ['Công bội', 'Tổng cấp số nhân'] }
        ]
      }
    ]
  },

  // ==================== LỚP 12 ====================
  {
    id: 'sy-toan-12',
    grade: '12',
    subject: 'Toán',
    book: 'Kết nối tri thức',
    semester: '1',
    periods: '4',
    chapters: [
      {
        id: 'toan12-ch1',
        title: 'Chương 1: Ứng dụng đạo hàm để khảo sát và vẽ đồ thị hàm số',
        lessons: [
          { id: 'toan12-le1', title: 'Bài 1: Tính đơn điệu và cực trị của hàm số', topics: ['Hàm số đồng biến, nghịch biến', 'Điểm cực trị'] },
          { id: 'toan12-le2', title: 'Bài 2: Giá trị lớn nhất và giá trị nhỏ nhất của hàm số', topics: ['Tìm GTLN, GTNN trên đoạn'] },
          { id: 'toan12-le3', title: 'Bài 3: Đường tiệm cận của đồ thị hàm số', topics: ['Tiệm cận đứng', 'Tiệm cận ngang', 'Tiệm cận xiên'] }
        ]
      },
      {
        id: 'toan12-ch2',
        title: 'Chương 2: Tọa độ của vectơ trong không gian',
        lessons: [
          { id: 'toan12-le4', title: 'Bài 1: Vectơ và các phép toán trong không gian', topics: ['Phép cộng, trừ vectơ', 'Tích vô hướng'] },
          { id: 'toan12-le5', title: 'Bài 2: Tọa độ của điểm và vectơ trong hệ trục Oxyz', topics: ['Tọa độ điểm', 'Độ dài vectơ'] }
        ]
      }
    ]
  }
];

/**
 * Ensures syllabus is never empty on first run. If the user has already configured or deleted
 * subjects in their syllabus, it preserves and respects the user's configured syllabus array.
 */
export function mergeWithStandardSyllabus(existingSyllabus: Syllabus[] = []): Syllabus[] {
  if (!Array.isArray(existingSyllabus) || existingSyllabus.length === 0) {
    return FULL_SYLLABUS_CATALOG;
  }
  return existingSyllabus;
}
