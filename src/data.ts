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
