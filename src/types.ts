/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Student {
  id: string;
  name: string;
  avgScore: number;
  completed: number;
  password?: string;
}

export interface Class {
  id: string;
  name: string;
  grade: string;
  subject: string;
  book: string;
  joinCode: string;
  joinPass: string;
  students: Student[];
}

export interface Lesson {
  id: string;
  title: string;
  topics: string[];
  docxText?: string;
}

export interface Chapter {
  id: string;
  title: string;
  lessons: Lesson[];
  docxText?: string;
}

export interface Syllabus {
  id: string;
  grade: string;
  subject: string;
  book: string;
  semester: string;
  periods: string;
  chapters: Chapter[];
}

export type QuestionType = 'MCQ' | 'YESNO' | 'SHORT' | 'ESSAY';
export type QuestionLevel = 'Nhận biết' | 'Thông hiểu' | 'Vận dụng' | 'Vận dụng cao';

export interface Question {
  id: string;
  grade: string;
  subject: string;
  book: string;
  chapterId: string;
  lessonId: string;
  topic: string;
  type: QuestionType;
  content: string;
  options: string[];
  answer: string; // indices comma-separated or values
  explain: string;
  level: QuestionLevel;
  source: string;
  status: string;
  requiredOutcome?: string;
}

export interface ExamMatrixBlock {
  title: string;
  questionsCount: number;
  score: number;
}

export interface Exam {
  id: string;
  title: string;
  grade: string;
  subject: string;
  book: string;
  type: string;
  duration: number;
  totalScore: number;
  questions: string[]; // Question IDs
  matrix?: {
    knowledgeBlocks: ExamMatrixBlock[];
  };
  createdAt: string;
  createdBy: string;
  status: string;
}

export interface Assignment {
  id: string;
  examId: string;
  classId: string;
  deadline: string;
  duration: number;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  showSolution: boolean;
  allowRetry: boolean;
  maxAttempts?: number; // 1, 2, 3, or 999 (unlimited)
  message: string;
  status: 'Đang làm' | 'Đã đóng';
}

export interface Submission {
  id: string;
  assignmentId: string;
  studentId: string;
  studentName: string;
  answers: Record<string, any>; // maps question ID to answer
  score: number;
  submittedAt: string;
  gradedBy: string;
  comment: string;
  status: 'Đã nộp' | 'Chưa chấm';
}

export interface AppSettings {
  soundEnabled: boolean;
  darkMode: boolean;
  primaryColor: string;
  geminiKey: string;
}

export interface TeacherAccount {
  id: string;
  name: string;
  email: string;
  password: string;
  phone?: string;
  department?: string;
  subject?: string;
  school?: string;
  status?: 'active' | 'suspended';
  campus?: string;
}

export interface GlobalState {
  currentRole: 'gv' | 'hs' | 'admin';
  currentUser: { uid: string; name: string; email: string };
  currentModule: string;
  settings: AppSettings;
  classes: Class[];
  questions: Question[];
  exams: Exam[];
  assignments: Assignment[];
  submissions: Submission[];
  syllabus: Syllabus[];
  teachers?: TeacherAccount[];
  activeExamSession: {
    assignmentId: string;
    examId: string;
    answers: Record<string, any>;
  } | null;
}

export function removeVietnameseTones(str: string): string {
  let s = String(str || '');
  s = s.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
  s = s.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
  s = s.replace(/ì|í|ị|ỉ|ĩ/g, "i");
  s = s.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
  s = s.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
  s = s.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
  s = s.replace(/đ/g, "d");
  s = s.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, "A");
  s = s.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, "E");
  s = s.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, "I");
  s = s.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, "O");
  s = s.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, "U");
  s = s.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, "Y");
  s = s.replace(/Đ/g, "D");
  // Combine accents with diacritical marks
  s = s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return s;
}

// Strips STT prefix like "1. ", "01 - ", "1/ ", "[1] ", "STT 1: ", "1:" from student name
export function cleanStudentName(name: string): string {
  return String(name || '')
    .trim()
    .replace(/^(STT\s*\:?\s*\d+\s*[\:\.\-\/]?|\[?\d+\]?[\.\-\/\:\s]+)\s*/i, '') // Removes "STT 1: ", "1. ", "01 - ", "1/ ", "[1] "
    .replace(/\s+/g, ' ')
    .trim();
}

export function generateStudentPassword(name: string): string {
  const cleanedName = cleanStudentName(name);
  return removeVietnameseTones(cleanedName)
    .toLowerCase()
    .replace(/\s+/g, '');
}

export function generateSecureStudentPasscode(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let passcode = '';
  for (let i = 0; i < 6; i++) {
    passcode += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return passcode;
}

export function verifyStudentLogin(
  classes: Class[],
  inputClassPass: string,
  inputStudentPass: string
): { foundClass: Class; foundStudent: Student } | null {
  if (!classes || classes.length === 0) return null;

  const cleanStr = (s: string) => String(s || '').replace(/\u00a0/g, ' ').trim();
  const rawClassPass = cleanStr(inputClassPass);
  const rawStudentPass = cleanStr(inputStudentPass);

  if (!rawClassPass || !rawStudentPass) return null;

  const normClassPass = rawClassPass.toLowerCase().replace(/\s+/g, ' ').normalize('NFKC');
  const normStudentPass = rawStudentPass.toLowerCase().replace(/\s+/g, ' ').normalize('NFKC');

  // 1. STRICTLY MATCH CLASS BY CLASS JOIN PASS OR CODE OR ID
  const matchedClasses = classes.filter((c) => {
    const cPass = (c.joinPass || '').toLowerCase().replace(/\s+/g, ' ').trim().normalize('NFKC');
    const cCode = (c.joinCode || '').toLowerCase().replace(/\s+/g, ' ').trim().normalize('NFKC');
    const cId = (c.id || '').toLowerCase().replace(/\s+/g, ' ').trim().normalize('NFKC');
    return cPass === normClassPass || cCode === normClassPass || cId === normClassPass;
  });

  if (matchedClasses.length === 0) {
    return null;
  }

  // 2. STRICTLY MATCH ENROLLED STUDENT BY PERSONAL PASSCODE OR UNACCENTED FULL NAME
  for (const c of matchedClasses) {
    if (!c.students || c.students.length === 0) continue;

    for (const s of c.students) {
      if (!s) continue;

      const genPass = generateStudentPassword(s.name);
      const studentPassNorm = (s.password || genPass).toLowerCase().replace(/\s+/g, '').normalize('NFKC');
      const inputNoSpace = normStudentPass.replace(/\s+/g, '');
      const inputUnaccented = removeVietnameseTones(normStudentPass).toLowerCase().replace(/[^a-z0-9]/g, '');

      if (
        (genPass && (inputNoSpace === genPass || inputUnaccented === genPass)) ||
        (studentPassNorm && (inputNoSpace === studentPassNorm || inputUnaccented === studentPassNorm))
      ) {
        return { foundClass: c, foundStudent: s };
      }
    }
  }

  return null;
}

/**
 * Universal helper to determine if a submission belongs to a target student safely
 * across name variations, STT prefixes, diacritics, and deterministic/phone IDs.
 */
export function isStudentSubmissionMatch(
  sub: { studentId?: string; studentName?: string },
  targetStudentId: string,
  targetStudentName: string
): boolean {
  if (!sub) return false;

  // 1. Exact or case-insensitive ID match
  if (
    sub.studentId &&
    targetStudentId &&
    sub.studentId.trim().toLowerCase() === targetStudentId.trim().toLowerCase()
  ) {
    return true;
  }

  const sName = String(sub.studentName || '').trim();
  const tName = String(targetStudentName || '').trim();

  // 2. ID matching normalized generated student pass
  const targetGen = generateStudentPassword(tName);
  if (targetGen && sub.studentId) {
    const subIdNorm = sub.studentId.toLowerCase().replace(/^s-/, '');
    if (subIdNorm === targetGen) return true;
  }

  if (!sName || !tName) return false;

  // 3. Strict case-insensitive match
  if (sName.toLowerCase() === tName.toLowerCase()) return true;

  // 4. Clean STT prefixes ("1. Nguyễn Văn A" vs "Nguyễn Văn A")
  const sClean = cleanStudentName(sName);
  const tClean = cleanStudentName(tName);
  if (sClean.toLowerCase() === tClean.toLowerCase()) return true;

  // 5. Remove Vietnamese tones / accents
  const sUnaccented = removeVietnameseTones(sClean).toLowerCase().replace(/\s+/g, ' ').trim();
  const tUnaccented = removeVietnameseTones(tClean).toLowerCase().replace(/\s+/g, ' ').trim();
  if (sUnaccented === tUnaccented) return true;

  // 6. Compare generated student passwords (e.g. "dinhthikimnhi")
  const sGen = generateStudentPassword(sClean);
  const tGen = generateStudentPassword(tClean);
  if (sGen && tGen && sGen === tGen) return true;

  // 7. Substring match for full names
  if (sUnaccented.length >= 4 && tUnaccented.length >= 4) {
    if (sUnaccented.includes(tUnaccented) || tUnaccented.includes(sUnaccented)) {
      return true;
    }
  }

  return false;
}

