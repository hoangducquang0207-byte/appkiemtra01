import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { FULL_SYLLABUS_CATALOG } from '../src/data/syllabusCatalog.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_FILE = path.join(__dirname, '../server_db.json');

if (!fs.existsSync(DB_FILE)) {
  console.error('server_db.json not found');
  process.exit(1);
}

const raw = fs.readFileSync(DB_FILE, 'utf8');
const data = JSON.parse(raw);

console.log('Original questions count:', data.questions ? data.questions.length : 0);

let convertedSubjectCount = 0;
let updatedChapterCount = 0;

if (Array.isArray(data.questions)) {
  data.questions.forEach((q: any) => {
    // 1. Normalize Subject
    if (q.subject === 'Toán học') {
      q.subject = 'Toán';
      convertedSubjectCount++;
    }
    if (!q.book) {
      q.book = 'Kết nối tri thức';
    }

    const gr = String(q.grade);
    const subj = q.subject;
    const top = q.topic || '';

    // 2. Map Grade 6 Toán
    if (gr === '6' && subj === 'Toán') {
      if (top.includes('tập hợp') || top.includes('phép cộng') || top.includes('dấu ngoặc') || top.includes('số tự nhiên')) {
        q.chapterId = 'ch-01';
        if (top.includes('Khái niệm tập hợp') || top.includes('Ký hiệu')) q.lessonId = 'le-01';
        else if (top.includes('Thứ tự')) q.lessonId = 'le-02';
        else q.lessonId = 'le-03';
      } else if (top.includes('chia hết') || top.includes('Bội chung')) {
        q.chapterId = 'ch-02';
        q.lessonId = top.includes('Dấu hiệu') ? 'le-05' : 'le-04';
      } else if (top.includes('phân số') || top.includes('thập phân') || top.includes('tỉ số')) {
        q.chapterId = 'ch-03';
        if (top.includes('Mở rộng')) q.lessonId = 'le-06';
        else if (top.includes('thập phân')) q.lessonId = 'le-08';
        else q.lessonId = 'le-07';
      } else if (top.includes('đối xứng') || top.includes('diện tích')) {
        q.chapterId = 'ch-04';
        q.lessonId = top.includes('đối xứng') ? 'le-09' : 'le-10';
      } else if (top.includes('đoạn thẳng') || top.includes('góc') || top.includes('Biểu đồ')) {
        q.chapterId = 'ch-05';
        q.lessonId = top.includes('Biểu đồ') ? 'le-12' : 'le-11';
      } else {
        q.chapterId = 'ch-06';
        q.lessonId = 'le-13';
      }
      updatedChapterCount++;
    }

    // 3. Map Grade 8 Toán
    else if (gr === '8' && subj === 'Toán') {
      if (top.includes('Tứ giác')) {
        q.chapterId = 'toan8-ch3';
        if (top.includes('Hình thang cân')) {
          q.lessonId = 'toan8-le6';
          q.topic = 'Bài 2: Hình thang cân';
        } else {
          q.lessonId = 'toan8-le5';
          q.topic = 'Bài 1: Tứ giác';
        }
      } else {
        q.chapterId = 'toan8-ch1';
        q.lessonId = 'toan8-le1';
        q.topic = 'Bài 1: Đơn thức nhiều biến. Đa thức nhiều biến';
      }
      updatedChapterCount++;
    }

    // 4. Map Grade 9 Toán
    else if (gr === '9' && subj === 'Toán') {
      q.chapterId = 'ch-05';
      q.lessonId = 'le-10';
      q.topic = 'Bài 2: Phương trình bậc nhất hai ẩn và hệ hai phương trình bậc nhất hai ẩn';
      updatedChapterCount++;
    }

    // 5. Map Grade 6 Tin học
    else if (gr === '6' && subj === 'Tin học') {
      q.chapterId = 'inf-ch1-6';
      q.lessonId = 'inf-le1-6';
      q.topic = 'Bài 1. Thông tin và dữ liệu';
      updatedChapterCount++;
    }

    // 6. Map Grade 7 Tin học
    else if (gr === '7' && subj === 'Tin học') {
      if (top.includes('Bài 1') || top.includes('Thiết bị vào - ra')) {
        q.chapterId = 'inf-ch1-7';
        q.lessonId = 'inf-le1-7';
        q.topic = 'Chủ đề 1. Máy tính và cộng đồng - Bài 1. Thiết bị vào - ra';
      } else if (top.includes('Bài 2') || top.includes('Phần mềm máy tính')) {
        q.chapterId = 'inf-ch1-7';
        q.lessonId = 'inf-le2-7';
        q.topic = 'Chủ đề 1. Máy tính và cộng đồng - Bài 2. Phần mềm máy tính';
      } else if (top.includes('Bài 3') || top.includes('Quản lí dữ liệu')) {
        q.chapterId = 'inf-ch1-7';
        q.lessonId = 'inf-le3-7';
        q.topic = 'Chủ đề 1. Máy tính và cộng đồng - Bài 3. Quản lí dữ liệu trong máy tính';
      } else if (top.includes('Bài 4') || top.includes('Mạng xã hội')) {
        q.chapterId = 'inf-ch2-7';
        q.lessonId = 'inf-le4-7';
        q.topic = 'Chủ đề 2. Tổ chức lưu trữ - Bài 4. Mạng xã hội';
      } else if (top.includes('Bài 5') || top.includes('Ứng xử trên mạng')) {
        q.chapterId = 'inf-ch3-7';
        q.lessonId = 'inf-le5-7';
        q.topic = 'Chủ đề 3. Đạo đức - Bài 5. Ứng xử trên mạng';
      } else if (top.includes('Bài 6') || top.includes('bảng tính')) {
        q.chapterId = 'inf-ch4-7';
        q.lessonId = 'inf-le6-7';
        q.topic = 'Chủ đề 4. Ứng dụng tin học - Bài 6. Làm quen với phần mềm bảng tính';
      } else {
        q.chapterId = 'inf-ch5-7';
        q.lessonId = 'inf-le14-7';
        q.topic = 'Chủ đề 5. Giải quyết vấn đề - Bài 14. Thuật toán tìm kiếm tuần tự';
      }
      updatedChapterCount++;
    }

    // 7. Map Grade 8 Tin học
    else if (gr === '8' && subj === 'Tin học') {
      if (top.includes('Bài 1') || top.includes('Lược sử công cụ tính toán')) {
        q.chapterId = 'inf-ch1-8';
        q.lessonId = 'inf-le1-8';
        q.topic = 'Chủ đề 1. Máy tính và cộng đồng - Bài 1. Lược sử công cụ tính toán';
      } else if (top.includes('Bài 2') || top.includes('Thông tin trong môi trường số')) {
        q.chapterId = 'inf-ch2-8';
        q.lessonId = 'inf-le2-8';
        q.topic = 'Chủ đề 2. Tổ chức lưu trữ - Bài 2. Thông tin trong môi trường số';
      } else if (top.includes('Bài 4') || top.includes('Đạo đức')) {
        q.chapterId = 'inf-ch3-8';
        q.lessonId = 'inf-le4-8';
        q.topic = 'Chủ đề 3. Đạo đức - Bài 4. Đạo đức và văn hóa số';
      } else if (top.includes('bảng tính') || top.includes('Bài 5')) {
        q.chapterId = 'inf-ch4-8';
        q.lessonId = 'inf-le5-8';
        q.topic = 'Chủ đề 4. Ứng dụng tin học - Bài 5. Sử dụng bảng tính';
      } else if (top.includes('thuật toán') || top.includes('chương trình')) {
        q.chapterId = 'inf-ch5-8';
        q.lessonId = 'inf-le12-8';
        q.topic = 'Chủ đề 5. Giải quyết vấn đề - Bài 12. Từ thuật toán đến chương trình';
      } else {
        q.chapterId = 'inf-ch6-8';
        q.lessonId = 'inf-le16-8';
        q.topic = 'Chủ đề 6. Hướng nghiệp - Bài 16. Tin học với nghề nghiệp';
      }
      updatedChapterCount++;
    }

    // 8. Map Grade 9 Tin học
    else if (gr === '9' && subj === 'Tin học') {
      q.chapterId = 'inf-ch4-9';
      q.lessonId = 'inf-le10a-9';
      q.topic = 'Chủ đề 4. Ứng dụng tin học - Bài 10a. Sử dụng hàm COUNTIF';
      updatedChapterCount++;
    }
  });
}

// Set Full Syllabus Catalog in server_db.json
data.syllabus = FULL_SYLLABUS_CATALOG;

fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');

console.log(`✅ Normalized server_db.json successfully!`);
console.log(`   - Converted "Toán học" to "Toán": ${convertedSubjectCount} questions`);
console.log(`   - Mapped chapterId & lessonId: ${updatedChapterCount} questions`);
console.log(`   - Saved full syllabus catalog to server_db.json (${FULL_SYLLABUS_CATALOG.length} syllabus items)`);
