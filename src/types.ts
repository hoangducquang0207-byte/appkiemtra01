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
  let s = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
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

export function generateStudentPassword(name: string): string {
  return removeVietnameseTones(name)
    .toLowerCase()
    .replace(/\s+/g, '');
}

