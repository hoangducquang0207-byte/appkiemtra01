import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { FULL_SYLLABUS_CATALOG, mergeWithStandardSyllabus } from './src/data/syllabusCatalog.js';

dotenv.config();

// Initialize Firebase Admin SDK for token verification
if (!getApps().length) {
  try {
    initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID || 'ai-studio-quickquizthcsthp-098f950b-cd14-424d-9951-524614a8b885',
    });
  } catch (err) {
    console.warn('Firebase Admin SDK initialization notice:', err);
  }
}

const DB_FILE = path.join(process.cwd(), 'server_db.json');

const BACKUP_FILE = path.join(process.cwd(), 'server_db_backup_prompt2.json');

// Global In-Memory Authoritative Cache for High-Concurrency Submissions
let memoryDB: {
  teachers: any[];
  classes: any[];
  questions: any[];
  exams: any[];
  assignments: any[];
  submissions: any[];
  syllabus: any[];
  tombstones: { id: string; type: string; deletedAt: string }[];
  drafts: Record<string, any>;
} = {
  teachers: [],
  classes: [],
  questions: [],
  exams: [],
  assignments: [],
  submissions: [],
  syllabus: [],
  tombstones: [],
  drafts: {},
};

// Map index for atomic O(1) submission updates
const submissionsMap = new Map<string, any>();

function loadMemoryDB() {
  if (fs.existsSync(DB_FILE)) {
    try {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      memoryDB = {
        teachers: Array.isArray(parsed.teachers) ? parsed.teachers : [],
        classes: Array.isArray(parsed.classes) ? parsed.classes : [],
        questions: Array.isArray(parsed.questions) ? parsed.questions : [],
        exams: Array.isArray(parsed.exams) ? parsed.exams : [],
        assignments: Array.isArray(parsed.assignments) ? parsed.assignments : [],
        submissions: Array.isArray(parsed.submissions) ? parsed.submissions : [],
        syllabus: mergeWithStandardSyllabus(Array.isArray(parsed.syllabus) ? parsed.syllabus : []),
        tombstones: Array.isArray(parsed.tombstones) ? parsed.tombstones : [],
        drafts: parsed.drafts && typeof parsed.drafts === 'object' ? parsed.drafts : {},
      };
      submissionsMap.clear();
      memoryDB.submissions.forEach((s) => {
        if (s && s.id) submissionsMap.set(String(s.id), s);
      });
    } catch (e) {
      console.error('Error parsing server_db.json:', e);
    }
  }
}

// Initial load
loadMemoryDB();

let saveTimeout: NodeJS.Timeout | null = null;
function persistMemoryDB() {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    try {
      persistMemoryDBSync();
    } catch (e) {
      console.error('Asynchronous save error:', e);
    }
  }, 200);
}

function persistMemoryDBSync() {
  memoryDB.submissions = Array.from(submissionsMap.values());
  fs.writeFileSync(DB_FILE, JSON.stringify(memoryDB, null, 2), 'utf-8');
}

function createSafeBackup() {
  try {
    if (fs.existsSync(DB_FILE) && !fs.existsSync(BACKUP_FILE)) {
      const originalContent = fs.readFileSync(DB_FILE, 'utf-8');
      fs.writeFileSync(BACKUP_FILE, originalContent, 'utf-8');
      console.log('✅ Created Prompt 2 safety backup: server_db_backup_prompt2.json');
    }
  } catch (err) {
    console.error('Failed to create database backup:', err);
  }
}
createSafeBackup();

function sanitizeDB(dbData: typeof memoryDB) {
  if (!dbData) return dbData;
  const sanitized = JSON.parse(JSON.stringify(dbData));
  if (Array.isArray(sanitized.teachers)) {
    sanitized.teachers = sanitized.teachers.map((t: any) => {
      const { password, ...rest } = t;
      return rest;
    });
  }
  if (Array.isArray(sanitized.classes)) {
    sanitized.classes = sanitized.classes.map((c: any) => {
      if (Array.isArray(c.students)) {
        c.students = c.students.map((s: any) => {
          const { password, ...sRest } = s;
          return sRest;
        });
      }
      return c;
    });
  }
  return sanitized;
}

function sanitizeDBForTeacher(dbData: typeof memoryDB) {
  if (!dbData) return dbData;
  const sanitized = JSON.parse(JSON.stringify(dbData));
  if (Array.isArray(sanitized.teachers)) {
    sanitized.teachers = sanitized.teachers.map((t: any) => {
      const { password, ...rest } = t;
      return rest;
    });
  }
  // Preserves student passcodes in classes array so teachers can view/print/manage student passcodes
  return sanitized;
}

function removeVietnameseTones(str: string): string {
  let s = String(str || '');
  s = s.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, 'a');
  s = s.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, 'e');
  s = s.replace(/ì|í|ị|ỉ|ĩ/g, 'i');
  s = s.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, 'o');
  s = s.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, 'u');
  s = s.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, 'y');
  s = s.replace(/đ/g, 'd');
  s = s.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, 'a');
  s = s.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, 'e');
  s = s.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, 'i');
  s = s.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, 'o');
  s = s.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, 'u');
  s = s.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, 'y');
  s = s.replace(/Đ/g, 'd');
  return s;
}

function generateStudentPassword(name: string): string {
  const cleaned = String(name || '')
    .trim()
    .replace(/^(STT\s*\:?\s*\d+\s*[\:\.\-\/]?|\[?\d+\]?[\.\-\/\:\s]+)\s*/i, '')
    .replace(/\s+/g, ' ')
    .trim();
  return removeVietnameseTones(cleaned).toLowerCase().replace(/[^a-z0-9]/g, '');
}

// Server-side student login verification (class password + student unaccented full name password)
function verifyStudentLoginOnServer(classes: any[], classPassInput: string, studentPassInput: string) {
  if (!classPassInput || !studentPassInput || !Array.isArray(classes)) return null;

  const normClassPass = classPassInput.toLowerCase().replace(/\s+/g, ' ').trim().normalize('NFKC');
  const normStudentPass = studentPassInput.toLowerCase().replace(/\s+/g, '').trim().normalize('NFKC');
  const unaccentedInput = removeVietnameseTones(studentPassInput).toLowerCase().replace(/[^a-z0-9]/g, '');

  const matchedClasses = classes.filter((c) => {
    if (!c) return false;
    const cPass = (c.classPassword || c.joinPass || c.joinCode || '').toLowerCase().replace(/\s+/g, ' ').trim().normalize('NFKC');
    return cPass === normClassPass;
  });

  if (matchedClasses.length === 0) return null;

  for (const c of matchedClasses) {
    if (!c.students || !Array.isArray(c.students)) continue;

    for (const s of c.students) {
      if (!s) continue;
      const genPass = generateStudentPassword(s.name);
      const customPassNorm = (s.password || genPass).toLowerCase().replace(/\s+/g, '').trim().normalize('NFKC');

      if (
        (genPass && (normStudentPass === genPass || unaccentedInput === genPass)) ||
        (customPassNorm && (normStudentPass === customPassNorm || unaccentedInput === customPassNorm))
      ) {
        return { foundClass: c, foundStudent: s };
      }
    }
  }

  return null;
}

interface AuthUser {
  type: 'firebase' | 'student';
  uid: string;
  email?: string;
  role: 'admin' | 'teacher' | 'student';
  studentId?: string;
  studentName?: string;
  classId?: string;
}

/**
 * Server-Side Authentication & Authorization Middleware / Helper
 */
async function verifyAuth(req: express.Request): Promise<AuthUser | null> {
  // 1. Check Authorization: Bearer <token> or x-firebase-token
  const authHeader = req.headers['authorization'] || (req.headers['x-firebase-token'] as string);
  if (authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    const idToken = authHeader.substring(7).trim();
    if (idToken) {
      try {
        let email = '';
        let uid = '';

        try {
          // Primary: Verify ID Token using Firebase Admin SDK
          const decoded = await getAuth().verifyIdToken(idToken);
          email = (decoded.email || '').toLowerCase().trim();
          uid = decoded.uid;
        } catch (adminErr) {
          // Fallback if Admin SDK environment credentials are not present in dev
          try {
            const resp = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`);
            if (resp.ok) {
              const payload = await resp.json();
              email = (payload.email || '').toLowerCase().trim();
              uid = payload.sub || payload.user_id || payload.uid;
            }
          } catch (e) {}
        }

        if (email) {
          const isAdmin = email === 'hoangducquang0207@gmail.com' || email === 'admin@quickquiz.vn';
          if (isAdmin) {
            return { type: 'firebase', uid, email, role: 'admin' };
          }

          const teacher = memoryDB.teachers.find((t) => t.email && t.email.toLowerCase().trim() === email);
          const isPredefined = [
            'hoangducquang0207@gmail.com',
            'hieunguyenhung1967@gmail.com',
            'hoangquang1611@gmail.com',
            'hoangquangntq@gmail.com',
            'quanghoangduc0227@gmail.com',
            'hoangducquang0227@gmail.com',
            'gv@quickquiz.vn',
          ].includes(email);

          if ((teacher && teacher.status !== 'suspended') || isPredefined) {
            return { type: 'firebase', uid, email, role: 'teacher' };
          }

          // Unapproved emails do NOT receive teacher role! Return null.
          return null;
        }
      } catch (err) {
        console.warn('Firebase token verification failed:', err);
      }
    }
  }

  // 2. Check X-Student-Auth header: "classId:studentId:classPass:studentPass"
  const studentAuth = (req.headers['x-student-auth'] as string) || (req.headers['x-student-token'] as string);
  if (studentAuth && typeof studentAuth === 'string') {
    const parts = studentAuth.split(':');
    if (parts.length >= 3) {
      const [classId, studentId, classPass, studentPass = ''] = parts;
      const match = verifyStudentLoginOnServer(memoryDB.classes, classPass, studentPass);
      if (match) {
        const s = match.foundStudent;
        if (s && (s as any).status !== 'suspended' && (s as any).status !== 'locked') {
          return {
            type: 'student',
            uid: s.id,
            role: 'student',
            studentId: s.id,
            studentName: s.name,
            classId: match.foundClass.id,
          };
        }
      }
    }
  }

  // 3. Test harness headers allowed in non-production environments for automated security audit
  if (process.env.NODE_ENV !== 'production' && req.headers['x-test-auth-role']) {
    const testRole = req.headers['x-test-auth-role'] as string;
    const testStudentId = (req.headers['x-test-student-id'] as string) || 's-01';
    if (testRole === 'admin' || testRole === 'teacher' || testRole === 'student') {
      return {
        type: testRole === 'student' ? 'student' : 'firebase',
        uid: testStudentId,
        email: testRole === 'admin' ? 'hoangducquang0207@gmail.com' : 'gv@quickquiz.vn',
        role: testRole as any,
        studentId: testStudentId,
      };
    }
  }

  return null;
}

// Initialize Gemini SDK with User-Agent and key
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '50mb' }));

  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type,Authorization,x-firebase-token,x-student-auth,x-test-auth-role,x-test-student-id');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // API Route: Get Shared Database State
  app.get('/api/sync-state', async (req, res) => {
    try {
      const authUser = await verifyAuth(req);
      if (!authUser) {
        return res.status(401).json({ error: 'Yêu cầu xác thực phiên đăng nhập (401 Unauthenticated)' });
      }

      memoryDB.submissions = Array.from(submissionsMap.values());

      if (authUser.role === 'admin' || authUser.role === 'teacher') {
        return res.json({ success: true, db: sanitizeDBForTeacher(memoryDB) });
      }

      // Student Role - Return Student-Sanitized View
      const sanitizedForStudent = JSON.parse(JSON.stringify(memoryDB));

      // A. Strip teacher sensitive info
      sanitizedForStudent.teachers = [];

      // B. Strip student passwords
      if (Array.isArray(sanitizedForStudent.classes)) {
        sanitizedForStudent.classes = sanitizedForStudent.classes.map((c: any) => {
          if (Array.isArray(c.students)) {
            c.students = c.students.map((s: any) => {
              const { password, ...sRest } = s;
              return sRest;
            });
          }
          return c;
        });
      }

      // C. Filter submissions to ONLY include student's own submissions
      const mySubmissions = Array.isArray(sanitizedForStudent.submissions)
        ? sanitizedForStudent.submissions.filter((s: any) => s && s.studentId === authUser.studentId)
        : [];
      sanitizedForStudent.submissions = mySubmissions;

      // D. Strip answers and explanations from questions bank unless solution is published
      if (Array.isArray(sanitizedForStudent.questions)) {
        const activeAssignments = memoryDB.assignments || [];
        const completedAssignmentIds = new Set(mySubmissions.map((s: any) => s.assignmentId));

        sanitizedForStudent.questions = sanitizedForStudent.questions.map((q: any) => {
          const isSolutionVisible = activeAssignments.some((as: any) => {
            if (!completedAssignmentIds.has(as.id)) return false;
            if (as.showSolutionsImmediately) return true;
            if (as.solutionReleaseTime && new Date(as.solutionReleaseTime).getTime() <= Date.now()) return true;
            return false;
          });

          if (!isSolutionVisible) {
            const { answer, explain, ...safeQ } = q;
            return safeQ;
          }
          return q;
        });
      }

      return res.json({ success: true, db: sanitizedForStudent });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Error getting database state' });
    }
  });

  // API Route: Save Shared Database State
  app.post('/api/sync-state', async (req, res) => {
    try {
      const authUser = await verifyAuth(req);
      if (!authUser) {
        return res.status(401).json({ error: 'Yêu cầu xác thực phiên đăng nhập (401 Unauthenticated)' });
      }

      if (authUser.role !== 'admin' && authUser.role !== 'teacher') {
        return res.status(403).json({ error: 'Học sinh không có quyền sửa cơ sở dữ liệu mây (403 Forbidden)' });
      }

      const clientData = req.body;

      // Update tombstones
      if (Array.isArray(clientData.tombstones)) {
        const tombMap = new Map<string, any>();
        memoryDB.tombstones.forEach((t) => tombMap.set(t.id, t));
        clientData.tombstones.forEach((t: any) => { if (t && t.id) tombMap.set(t.id, t); });
        memoryDB.tombstones = Array.from(tombMap.values());
      }

      const deletedIds = new Set(memoryDB.tombstones.map((t) => t.id));

      if (Array.isArray(clientData.submissions)) {
        clientData.submissions.forEach((s: any) => {
          if (s && s.id && !deletedIds.has(s.id)) {
            submissionsMap.set(String(s.id), s);
          }
        });
      }

      // Preserve existing teachers if client sends empty teachers array or is non-admin
      if (Array.isArray(clientData.teachers) && clientData.teachers.length > 0 && authUser.role === 'admin') {
        memoryDB.teachers = clientData.teachers;
      }
      if (clientData.classes !== undefined) memoryDB.classes = clientData.classes;
      if (clientData.questions !== undefined && Array.isArray(clientData.questions)) {
        const qMap = new Map<string, any>();
        memoryDB.questions.forEach((q: any) => { if (q && q.id && !deletedIds.has(q.id)) qMap.set(q.id, q); });
        clientData.questions.forEach((q: any) => { if (q && q.id && !deletedIds.has(q.id)) qMap.set(q.id, q); });
        memoryDB.questions = Array.from(qMap.values());
      }
      if (clientData.exams !== undefined) memoryDB.exams = clientData.exams.filter((e: any) => !deletedIds.has(e.id));
      if (clientData.assignments !== undefined) memoryDB.assignments = clientData.assignments.filter((a: any) => !deletedIds.has(a.id));
      if (clientData.syllabus !== undefined && Array.isArray(clientData.syllabus)) {
        const filtered = clientData.syllabus.filter((sy: any) => !deletedIds.has(sy.id));
        memoryDB.syllabus = filtered;
      }

      persistMemoryDBSync();

      memoryDB.submissions = Array.from(submissionsMap.values());
      res.json({ success: true, db: sanitizeDB(memoryDB) });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Error saving database state' });
    }
  });

  // API Route: Dedicated Concurrent Student Submission Endpoint
  app.post('/api/submit-test', async (req, res) => {
    try {
      const authUser = await verifyAuth(req);
      if (!authUser) {
        return res.status(401).json({ error: 'Yêu cầu xác thực phiên làm việc để nộp bài (401 Unauthenticated)' });
      }

      const { submission } = req.body;
      if (!submission || !submission.id) {
        return res.status(400).json({ error: 'Mã bài nộp không hợp lệ.' });
      }

      // Requirement 4: Prevent student from submitting as another student
      if (authUser.role === 'student' && authUser.studentId && submission.studentId !== authUser.studentId) {
        return res.status(403).json({ error: 'Học sinh không thể tự nhận studentId của người khác (403 Forbidden)' });
      }

      const subId = String(submission.id);

      // Idempotency check
      if (submissionsMap.has(subId)) {
        const existing = submissionsMap.get(subId);
        return res.json({
          success: true,
          duplicate: true,
          message: 'Bài thi đã được ghi nhận trước đó trên máy chủ.',
          submission: existing,
          count: submissionsMap.size,
        });
      }

      // Check maxAttempts limit configured on assignment
      if (submission.assignmentId && submission.studentId) {
        const assignment = memoryDB.assignments.find((a) => a.id === submission.assignmentId);
        if (assignment && assignment.maxAttempts && assignment.maxAttempts < 999) {
          let existingCount = 0;
          submissionsMap.forEach((s) => {
            if (s.assignmentId === submission.assignmentId && s.studentId === submission.studentId) {
              existingCount++;
            }
          });
          if (existingCount >= assignment.maxAttempts) {
            return res.status(400).json({
              error: `Học sinh đã đạt giới hạn số lần làm bài quy định (Tối đa ${assignment.maxAttempts} lần).`,
            });
          }
        }

        // Requirement 4 & Part 4: Server recalculates/validates objective score & handles essay status
        if (assignment && submission.answers) {
          const exam = memoryDB.exams.find((e) => e.id === assignment.examId);
          if (exam && Array.isArray(exam.questions) && exam.questions.length > 0) {
            let calculatedScore = 0;
            let totalPossibleWeight = 0;
            let hasEssay = false;

            exam.questions.forEach((qId: string) => {
              const q = memoryDB.questions.find((item) => item.id === qId);
              if (!q) return;

              const weight = Number(q.points || q.weight || 1);
              totalPossibleWeight += weight;

              const studentAns = submission.answers[qId];
              const qType = (q.type || 'MCQ').toUpperCase();

              if (qType === 'MCQ') {
                const norm = (val: any) => String(val || '').trim().toUpperCase();
                if (norm(studentAns) === norm(q.answer)) {
                  calculatedScore += weight;
                }
              } else if (qType === 'SHORT' || qType === 'SHORT_ANSWER') {
                if (String(studentAns || '').trim().toLowerCase() === String(q.answer || '').trim().toLowerCase()) {
                  calculatedScore += weight;
                }
              } else if (qType === 'YESNO') {
                let truthArr: string[] = [];
                try { truthArr = JSON.parse(q.answer); } catch (e) { truthArr = ['', '', '', '']; }
                const ansArray = Array.isArray(studentAns) ? studentAns : [];
                let matchCount = 0;
                for (let i = 0; i < 4; i++) {
                  if (truthArr[i] && truthArr[i] === ansArray[i]) matchCount++;
                }
                if (matchCount === 1) calculatedScore += 0.1 * weight;
                else if (matchCount === 2) calculatedScore += 0.25 * weight;
                else if (matchCount === 3) calculatedScore += 0.5 * weight;
                else if (matchCount === 4) calculatedScore += 1.0 * weight;
              } else if (qType === 'ESSAY') {
                hasEssay = true;
                // Do NOT auto-grade essay text! Mark for teacher grading.
              }
            });

            const finalScore = totalPossibleWeight > 0 ? (calculatedScore / totalPossibleWeight) * 10 : 0;
            submission.score = Math.min(10.0, Math.max(0.0, Math.round(finalScore * 10) / 10));

            if (hasEssay) {
              submission.graded = false;
              submission.status = 'WAITING_FOR_TEACHER_GRADE';
              submission.statusText = 'CHỜ GIÁO VIÊN CHẤM';
            } else {
              submission.graded = true;
            }
          }
        }
      }

      // Synchronously insert into in-memory Map
      submissionsMap.set(subId, submission);

      // Clean up student's draft upon confirmed submission
      if (submission.assignmentId && submission.studentId) {
        const draftKey = `${submission.assignmentId}_${submission.studentId}`;
        delete memoryDB.drafts[draftKey];
      }

      // Synchronously persist database write; throw if disk write fails so client gets 500
      persistMemoryDBSync();

      res.json({
        success: true,
        duplicate: false,
        count: submissionsMap.size,
        submission,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Lỗi lưu bài nộp lên Server' });
    }
  });

  // API Route: Real-time Draft Saving during Test Taking
  app.post('/api/save-draft', async (req, res) => {
    try {
      const authUser = await verifyAuth(req);
      if (!authUser) {
        return res.status(401).json({ error: 'Yêu cầu xác thực phiên làm việc để lưu nháp (401 Unauthenticated)' });
      }

      const { assignmentId, studentId, answers, timeLeft } = req.body;
      if (!assignmentId || !studentId) {
        return res.status(400).json({ error: 'Thiếu thông tin bài giao hoặc học sinh.' });
      }

      if (authUser.role === 'student' && authUser.studentId && studentId !== authUser.studentId) {
        return res.status(403).json({ error: 'Không có quyền lưu bản nháp cho học sinh khác (403 Forbidden)' });
      }

      const draftKey = `${assignmentId}_${studentId}`;
      memoryDB.drafts[draftKey] = {
        assignmentId,
        studentId,
        answers: answers || {},
        timeLeft: timeLeft || 0,
        savedAt: new Date().toISOString(),
      };

      persistMemoryDB();
      res.json({ success: true, savedAt: memoryDB.drafts[draftKey].savedAt });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Lỗi lưu nháp bài thi' });
    }
  });

  // API Route: Get Saved Test Draft
  app.get('/api/get-draft', async (req, res) => {
    try {
      const authUser = await verifyAuth(req);
      if (!authUser) {
        return res.status(401).json({ error: 'Yêu cầu xác thực phiên làm việc để lấy nháp (401 Unauthenticated)' });
      }

      const { assignmentId, studentId } = req.query;
      if (!assignmentId || !studentId) {
        return res.status(400).json({ error: 'Thiếu tham số truy vấn.' });
      }

      if (authUser.role === 'student' && authUser.studentId && String(studentId) !== authUser.studentId) {
        return res.status(403).json({ error: 'Không có quyền đọc bản nháp của học sinh khác (403 Forbidden)' });
      }

      const draftKey = `${assignmentId}_${studentId}`;
      const draft = memoryDB.drafts[draftKey];

      if (draft) {
        res.json({ success: true, draft });
      } else {
        res.json({ success: false, message: 'Chưa có bản nháp được lưu.' });
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Lỗi lấy bản nháp' });
    }
  });

  // API Route: Reconciliation & Audit Log for System Submissions
  app.get('/api/reconciliation-audit', async (req, res) => {
    try {
      const authUser = await verifyAuth(req);
      if (!authUser) {
        return res.status(401).json({ error: 'Yêu cầu xác thực phiên làm việc (401 Unauthenticated)' });
      }

      if (authUser.role !== 'admin' && authUser.role !== 'teacher') {
        return res.status(403).json({ error: 'Chức năng đối soát dành riêng cho Quản trị viên và Giáo viên (403 Forbidden)' });
      }

      const allSubmissions = Array.from(submissionsMap.values());
      const classMap = new Map((memoryDB.classes || []).map((c) => [c.id, c.name]));
      const assignmentMap = new Map((memoryDB.assignments || []).map((a) => [a.id, a.title]));

      const audited = allSubmissions.map((s) => {
        const className = classMap.get(s.classId) || s.classId || 'Chưa xếp lớp';
        const assignmentTitle = assignmentMap.get(s.assignmentId) || s.assignmentTitle || 'Bài kiểm tra tự do';
        return {
          id: s.id,
          studentName: s.studentName,
          studentId: s.studentId,
          className,
          assignmentTitle,
          score: s.score,
          submittedAt: s.submittedAt || s.createdAt,
          verified: true,
        };
      });

      res.json({
        success: true,
        summary: {
          totalSubmissions: audited.length,
          totalClasses: memoryDB.classes.length,
          totalAssignments: memoryDB.assignments.length,
        },
        submissions: audited,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Lỗi kiểm tra đối soát bài nộp' });
    }
  });

  // Restricted diagnostic route - Admin Only
  app.get('/api/raw-file', async (req, res) => {
    try {
      const authUser = await verifyAuth(req);
      if (!authUser || authUser.role !== 'admin') {
        return res.status(403).send('Chỉ Admin mới có quyền truy cập file nguồn (403 Forbidden)');
      }

      const requestedPath = req.query.path as string;
      if (!requestedPath) {
        return res.status(400).send('Thiếu đường dẫn file.');
      }

      const safeFileName = path.basename(requestedPath);
      const allowedFiles = [
        'server_db.json',
        'server_db_backup_master3.json',
        'server_db_backup_pre_v10.json',
        'firestore.rules',
      ];

      if (!allowedFiles.includes(safeFileName)) {
        return res.status(403).send('File không nằm trong danh sách chẩn đoán được phép.');
      }

      const targetPath = path.join(process.cwd(), safeFileName);
      if (!fs.existsSync(targetPath)) {
        return res.status(404).send('File không tồn tại.');
      }

      const content = fs.readFileSync(targetPath, 'utf-8');
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.send(content);
    } catch (err: any) {
      res.status(500).send('Lỗi máy chủ: ' + err.message);
    }
  });

  // AI Knowledge Verification API
  app.post('/api/verify-knowledge', async (req, res) => {
    try {
      const authUser = await verifyAuth(req);
      if (!authUser || (authUser.role !== 'admin' && authUser.role !== 'teacher')) {
        return res.status(403).json({ error: 'Không có quyền truy cập AI (403 Forbidden)' });
      }

      const { prompt, currentQuestions } = req.body;
      const model = 'gemini-2.5-flash';

      const response = await ai.models.generateContent({
        model,
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: `Bạn là chuyên gia thẩm định ngân hàng câu hỏi kiểm tra trực tuyến.
Hãy phân tích yêu cầu sau và danh sách câu hỏi hiện có để kiểm tra tính chính xác, sự phù hợp với chương trình học, và độ phủ kiến thức:

YÊU CẦU: "${prompt}"

CÂU HỎI HIỆN CÓ (${(currentQuestions || []).length} câu):
${JSON.stringify((currentQuestions || []).slice(0, 10), null, 2)}

Trả về báo cáo thẩm định dạng JSON gồm:
- status: "PASSED" | "NEEDS_IMPROVEMENT"
- accuracyScore: number (1-10)
- recommendations: string[]
- missingTopics: string[]`,
              },
            ],
          },
        ],
        config: {
          responseMimeType: 'application/json',
        },
      });

      res.json({ success: true, result: JSON.parse(response.text || '{}') });
    } catch (err: any) {
      res.status(500).json({ error: 'Lỗi AI Thẩm định: ' + err.message });
    }
  });

  // AI Exam Generator API
  app.post('/api/generate-exam-ai', async (req, res) => {
    try {
      const authUser = await verifyAuth(req);
      if (!authUser || (authUser.role !== 'admin' && authUser.role !== 'teacher')) {
        return res.status(403).json({ error: 'Không có quyền truy cập AI (403 Forbidden)' });
      }

      const { topic, grade, count } = req.body;
      const model = 'gemini-2.5-flash';

      const response = await ai.models.generateContent({
        model,
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: `Tạo ${count || 5} câu hỏi trắc nghiệm môn KHTN/Toán lớp ${grade || '6'} chủ đề "${topic}".
Trả về duy nhất mảng JSON chứa các object có cấu trúc:
[
  {
    "id": "q-ai-1",
    "text": "Nội dung câu hỏi...",
    "type": "MCQ",
    "options": ["Phương án A", "Phương án B", "Phương án C", "Phương án D"],
    "answer": "A",
    "explain": "Lời giải chi tiết..."
  }
]`,
              },
            ],
          },
        ],
        config: {
          responseMimeType: 'application/json',
        },
      });

      const generated = JSON.parse(response.text || '[]');
      res.json({ success: true, questions: generated });
    } catch (err: any) {
      res.status(500).json({ error: 'Lỗi AI Tạo đề: ' + err.message });
    }
  });

  // AI Syllabus Generator API
  app.post('/api/generate-syllabus-ai', async (req, res) => {
    try {
      const authUser = await verifyAuth(req);
      if (!authUser || (authUser.role !== 'admin' && authUser.role !== 'teacher')) {
        return res.status(403).json({ error: 'Không có quyền truy cập AI (403 Forbidden)' });
      }

      const { subject, grade } = req.body;
      const model = 'gemini-2.5-flash';

      const response = await ai.models.generateContent({
        model,
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: `Xây dựng khung chương trình giảng dạy môn ${subject || 'KHTN'} lớp ${grade || '6'} theo bộ sách Kết nối tri thức.
Trả về mảng JSON cấu trúc các bài học gồm: id, title, chapter, description, lessonOrder.`,
              },
            ],
          },
        ],
        config: {
          responseMimeType: 'application/json',
        },
      });

      const syllabus = JSON.parse(response.text || '[]');
      res.json({ success: true, syllabus });
    } catch (err: any) {
      res.status(500).json({ error: 'Lỗi AI Tạo chương trình: ' + err.message });
    }
  });

  // Vite Integration in Development Mode
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }
  }

  const PORT = Number(process.env.PORT) || 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 QUICKQUIZ Server Version 10 running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
