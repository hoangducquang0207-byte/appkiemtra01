/**
 * Security Audit Verification Suite for QUICKQUIZ Phiên bản 9
 */

import http from 'http';
import { spawn, ChildProcess } from 'child_process';

const PORT = 3000;
const BASE_URL = `http://127.0.0.1:${PORT}`;

let serverProc: ChildProcess | null = null;

async function ensureServerRunning(): Promise<void> {
  let attempts = 0;
  while (attempts < 15) {
    try {
      await new Promise<void>((resolve, reject) => {
        const req = http.get(`${BASE_URL}/api/sync-state`, (res) => {
          resolve();
        });
        req.on('error', (err) => reject(err));
        req.end();
      });
      return;
    } catch (e) {
      if (attempts === 0 && !serverProc) {
        serverProc = spawn('npx', ['tsx', 'server.ts'], {
          cwd: process.cwd(),
          env: { ...process.env, PORT: '3000', NODE_ENV: 'test' },
          stdio: 'ignore',
        });
      }
      attempts++;
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
}

interface TestResult {
  name: string;
  expectedStatus: number;
  actualStatus: number;
  passed: boolean;
  details?: string;
}

function makeRequest(
  path: string,
  method: 'GET' | 'POST' = 'GET',
  headers: Record<string, string> = {},
  body?: any
): Promise<{ status: number; data: any }> {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const postData = body ? JSON.stringify(body) : '';

    const req = http.request(
      url,
      {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
      },
      (res) => {
        let raw = '';
        res.on('data', (chunk) => (raw += chunk));
        res.on('end', () => {
          let parsed = raw;
          try {
            parsed = JSON.parse(raw);
          } catch (e) {}
          resolve({ status: res.statusCode || 0, data: parsed });
        });
      }
    );

    req.on('error', (err) => reject(err));
    if (postData) req.write(postData);
    req.end();
  });
}

async function runSecurityAudit() {
  console.log('============== BAT DAU KIEM TOAN BAO MAT QUICKQUIZ PHIEN BAN 9 ==============\n');
  await ensureServerRunning();

  const results: TestResult[] = [];

  // Test 1: Tru truy cap /api/sync-state khong co Token -> 401
  try {
    const res = await makeRequest('/api/sync-state', 'GET');
    const passed = res.status === 401;
    results.push({
      name: '1. Access GET /api/sync-state without token',
      expectedStatus: 401,
      actualStatus: res.status,
      passed,
      details: JSON.stringify(res.data),
    });
  } catch (err: any) {
    results.push({ name: '1. Access GET /api/sync-state without token', expectedStatus: 401, actualStatus: 0, passed: false, details: err.message });
  }

  // Test 2: Truy cap /api/sync-state voi Token gia -> 401
  try {
    const res = await makeRequest('/api/sync-state', 'GET', { Authorization: 'Bearer fake_invalid_token_12345' });
    const passed = res.status === 401;
    results.push({
      name: '2. Access GET /api/sync-state with fake token',
      expectedStatus: 401,
      actualStatus: res.status,
      passed,
      details: JSON.stringify(res.data),
    });
  } catch (err: any) {
    results.push({ name: '2. Access GET /api/sync-state with fake token', expectedStatus: 401, actualStatus: 0, passed: false, details: err.message });
  }

  // Test 3: Học sinh truy cap API Doi soat /api/reconciliation-audit -> 403
  try {
    const res = await makeRequest('/api/reconciliation-audit', 'GET', {
      'x-test-auth-role': 'student',
      'x-test-student-id': 's-01',
    });
    const passed = res.status === 403;
    results.push({
      name: '3. Student accessing /api/reconciliation-audit',
      expectedStatus: 403,
      actualStatus: res.status,
      passed,
      details: JSON.stringify(res.data),
    });
  } catch (err: any) {
    results.push({ name: '3. Student accessing /api/reconciliation-audit', expectedStatus: 403, actualStatus: 0, passed: false, details: err.message });
  }

  // Test 4: Học sinh nỗ lực POST /api/sync-state đè DB mây -> 403
  try {
    const res = await makeRequest(
      '/api/sync-state',
      'POST',
      {
        'x-test-auth-role': 'student',
        'x-test-student-id': 's-01',
      },
      { teachers: [] }
    );
    const passed = res.status === 403;
    results.push({
      name: '4. Student attempting POST /api/sync-state to overwrite DB',
      expectedStatus: 403,
      actualStatus: res.status,
      passed,
      details: JSON.stringify(res.data),
    });
  } catch (err: any) {
    results.push({ name: '4. Student attempting POST /api/sync-state', expectedStatus: 403, actualStatus: 0, passed: false, details: err.message });
  }

  // Test 5: Học sinh truy cap API tai file nguon /api/raw-file -> 403
  try {
    const res = await makeRequest('/api/raw-file?path=package.json', 'GET', {
      'x-test-auth-role': 'student',
      'x-test-student-id': 's-01',
    });
    const passed = res.status === 403;
    results.push({
      name: '5. Student accessing /api/raw-file',
      expectedStatus: 403,
      actualStatus: res.status,
      passed,
      details: typeof res.data === 'string' ? res.data : JSON.stringify(res.data),
    });
  } catch (err: any) {
    results.push({ name: '5. Student accessing /api/raw-file', expectedStatus: 403, actualStatus: 0, passed: false, details: err.message });
  }

  // Test 6: Học sinh nộp bài giả mạo studentId của người khác -> 403
  try {
    const res = await makeRequest(
      '/api/submit-test',
      'POST',
      {
        'x-test-auth-role': 'student',
        'x-test-student-id': 's-01',
      },
      {
        submission: {
          id: `test-sub-${Date.now()}`,
          assignmentId: 'as-01',
          studentId: 's-OTHER-999', // Claiming another studentId
          studentName: 'Học sinh khác',
          answers: {},
          score: 10,
        },
      }
    );
    const passed = res.status === 403;
    results.push({
      name: '6. Student submitting test for another student ID',
      expectedStatus: 403,
      actualStatus: res.status,
      passed,
      details: JSON.stringify(res.data),
    });
  } catch (err: any) {
    results.push({ name: '6. Student submitting test for another student ID', expectedStatus: 403, actualStatus: 0, passed: false, details: err.message });
  }

  // Test 7: Học sinh đọc bản nháp của học sinh khác -> 403
  try {
    const res = await makeRequest('/api/get-draft?assignmentId=as-01&studentId=s-OTHER-999', 'GET', {
      'x-test-auth-role': 'student',
      'x-test-student-id': 's-01',
    });
    const passed = res.status === 403;
    results.push({
      name: '7. Student reading another student draft',
      expectedStatus: 403,
      actualStatus: res.status,
      passed,
      details: JSON.stringify(res.data),
    });
  } catch (err: any) {
    results.push({ name: '7. Student reading another student draft', expectedStatus: 403, actualStatus: 0, passed: false, details: err.message });
  }

  // Test 8: Học sinh lưu nháp cho học sinh khác -> 403
  try {
    const res = await makeRequest(
      '/api/save-draft',
      'POST',
      {
        'x-test-auth-role': 'student',
        'x-test-student-id': 's-01',
      },
      {
        assignmentId: 'as-01',
        studentId: 's-OTHER-999',
        answers: { q1: 'A' },
      }
    );
    const passed = res.status === 403;
    results.push({
      name: '8. Student saving draft for another student',
      expectedStatus: 403,
      actualStatus: res.status,
      passed,
      details: JSON.stringify(res.data),
    });
  } catch (err: any) {
    results.push({ name: '8. Student saving draft for another student', expectedStatus: 403, actualStatus: 0, passed: false, details: err.message });
  }

  // Test 9: Giáo viên hợp lệ truy cập /api/sync-state -> 200
  try {
    const res = await makeRequest('/api/sync-state', 'GET', {
      'x-test-auth-role': 'teacher',
    });
    const passed = res.status === 200 && res.data?.success === true;
    results.push({
      name: '9. Teacher accessing GET /api/sync-state',
      expectedStatus: 200,
      actualStatus: res.status,
      passed,
      details: `Success: ${res.data?.success}, Questions: ${res.data?.db?.questions?.length}`,
    });
  } catch (err: any) {
    results.push({ name: '9. Teacher accessing GET /api/sync-state', expectedStatus: 200, actualStatus: 0, passed: false, details: err.message });
  }

  // Test 10: Admin hợp lệ truy cập /api/reconciliation-audit -> 200
  try {
    const res = await makeRequest('/api/reconciliation-audit', 'GET', {
      'x-test-auth-role': 'admin',
    });
    const passed = res.status === 200 && res.data?.success === true;
    results.push({
      name: '10. Admin accessing GET /api/reconciliation-audit',
      expectedStatus: 200,
      actualStatus: res.status,
      passed,
      details: `Total Submissions Audited: ${res.data?.summary?.totalSubmissions}`,
    });
  } catch (err: any) {
    results.push({ name: '10. Admin accessing GET /api/reconciliation-audit', expectedStatus: 200, actualStatus: 0, passed: false, details: err.message });
  }

  // Test 11: Học sinh đọc GET /api/sync-state -> 200 voi du lieu da duoc lam sach (Stripped answers)
  try {
    const res = await makeRequest('/api/sync-state', 'GET', {
      'x-test-auth-role': 'student',
      'x-test-student-id': 's-01',
    });
    const hasTeachers = Array.isArray(res.data?.db?.teachers) && res.data.db.teachers.length > 0;
    const questions = res.data?.db?.questions || [];
    const hasExposedAnswers = questions.some((q: any) => q.answer !== undefined);

    const passed = res.status === 200 && !hasTeachers && !hasExposedAnswers;
    results.push({
      name: '11. Student GET /api/sync-state sanitized (no teachers, no exposed answers)',
      expectedStatus: 200,
      actualStatus: res.status,
      passed,
      details: `Has Teachers: ${hasTeachers}, Has Exposed Answers: ${hasExposedAnswers}`,
    });
  } catch (err: any) {
    results.push({ name: '11. Student GET /api/sync-state sanitized', expectedStatus: 200, actualStatus: 0, passed: false, details: err.message });
  }

  // Test 12: Học sinh nộp bài chính chủ với điểm gian lận -> Máy chủ tự tính toán lại điểm
  try {
    const subId = `test-sub-recalc-${Date.now()}`;
    const testStudId = `s-test-${Date.now()}`;
    const res = await makeRequest(
      '/api/submit-test',
      'POST',
      {
        'x-test-auth-role': 'student',
        'x-test-student-id': testStudId,
      },
      {
        submission: {
          id: subId,
          assignmentId: 'as-cust-53662',
          studentId: testStudId,
          studentName: 'Học Sinh Kiểm Thử',
          answers: { q1: 'WRONG_ANSWER' },
          score: 10.0, // Forged score
        },
      }
    );
    const serverScore = res.data?.submission?.score;
    const passed = res.status === 200 && serverScore !== undefined && serverScore < 10.0;
    results.push({
      name: '12. Student submitted forged score -> Server recalculated score',
      expectedStatus: 200,
      actualStatus: res.status,
      passed,
      details: `Forged score: 10.0, Server Calculated Score: ${serverScore}`,
    });
  } catch (err: any) {
    results.push({ name: '12. Student submitted forged score -> Server recalculated', expectedStatus: 200, actualStatus: 0, passed: false, details: err.message });
  }

  console.log('----------------------------------------------------------------------');
  console.log('KET QUA KIEM TOAN BAO MAT CHI TIET:\n');
  let passCount = 0;
  results.forEach((r, idx) => {
    const statusStr = r.passed ? '✅ DAT' : '❌ KHONG DAT';
    if (r.passed) passCount++;
    console.log(`[Test ${idx + 1}] ${statusStr}: ${r.name}`);
    console.log(`         Expected: ${r.expectedStatus} | Actual: ${r.actualStatus}`);
    console.log(`         Details: ${r.details}\n`);
  });

  console.log(`TONG CONG: ${passCount}/${results.length} KIEM THU DAT (SUCCESS RATE: ${Math.round((passCount / results.length) * 100)}%)`);
  console.log('======================================================================');
  if (serverProc) {
    serverProc.kill();
    process.exit(0);
  }
}

runSecurityAudit();
