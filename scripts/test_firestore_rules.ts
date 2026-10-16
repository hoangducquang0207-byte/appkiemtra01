/**
 * Firestore Security Rules Logic Verification Test Suite
 */

interface RuleContext {
  auth?: {
    uid: string;
    token?: {
      email?: string;
      email_verified?: boolean;
    };
  } | null;
}

interface TestRuleResult {
  name: string;
  expectedAllow: boolean;
  actualAllow: boolean;
  passed: boolean;
  details?: string;
}

function evaluateIsSignedIn(ctx: RuleContext): boolean {
  return ctx.auth != null;
}

function evaluateGetUserEmail(ctx: RuleContext): string {
  if (evaluateIsSignedIn(ctx) && ctx.auth?.token?.email) {
    return ctx.auth.token.email.toLowerCase();
  }
  return '';
}

function evaluateIsAdmin(ctx: RuleContext): boolean {
  const email = evaluateGetUserEmail(ctx);
  return evaluateIsSignedIn(ctx) && (
    email === 'hoangducquang0207@gmail.com' ||
    email === 'admin@quickquiz.vn' ||
    ctx.auth?.uid === 'admin-demo'
  );
}

function evaluateIsTeacher(ctx: RuleContext): boolean {
  const email = evaluateGetUserEmail(ctx);
  return evaluateIsSignedIn(ctx) && (
    evaluateIsAdmin(ctx) ||
    (ctx.auth?.token?.email != null && ctx.auth?.token?.email_verified === true) ||
    [
      'hoangducquang0207@gmail.com',
      'hieunguyenhung1967@gmail.com',
      'hoangquang1611@gmail.com',
      'hoangquangntq@gmail.com',
      'quanghoangduc0227@gmail.com',
      'hoangducquang0227@gmail.com',
      'gv@quickquiz.vn',
    ].includes(email)
  );
}

// Collection access evaluators
function canReadTeacherRoster(ctx: RuleContext): boolean {
  return evaluateIsSignedIn(ctx) && evaluateIsTeacher(ctx);
}

function canCreateSubmission(ctx: RuleContext): boolean {
  return evaluateIsSignedIn(ctx);
}

function canReadSubmission(ctx: RuleContext, subOwnerUid: string): boolean {
  return evaluateIsSignedIn(ctx) && (evaluateIsTeacher(ctx) || subOwnerUid === ctx.auth?.uid);
}

function canWriteQuestionChunks(ctx: RuleContext): boolean {
  return evaluateIsSignedIn(ctx) && evaluateIsTeacher(ctx);
}

function canAccessDraft(ctx: RuleContext, draftOwnerUid: string): boolean {
  return evaluateIsSignedIn(ctx) && (evaluateIsTeacher(ctx) || draftOwnerUid === ctx.auth?.uid);
}

function runRulesTests() {
  console.log('============== BAT DAU KIEM THU FIRESTORE SECURITY RULES ==============\n');

  const unauthenticated: RuleContext = { auth: null };
  const studentCtx: RuleContext = { auth: { uid: 'student-s01', token: { email: 'student-s01@quickquiz.vn' } } };
  const teacherCtx: RuleContext = { auth: { uid: 'teacher-t01', token: { email: 'gv@quickquiz.vn', email_verified: true } } };
  const adminCtx: RuleContext = { auth: { uid: 'admin-a01', token: { email: 'hoangducquang0207@gmail.com', email_verified: true } } };

  const tests: TestRuleResult[] = [];

  // 1. Unauthenticated reading teacher roster -> DENIED
  const r1 = canReadTeacherRoster(unauthenticated);
  tests.push({ name: '1. Unauthenticated reading metadata/teachers', expectedAllow: false, actualAllow: r1, passed: r1 === false });

  // 2. Student reading teacher roster -> DENIED
  const r2 = canReadTeacherRoster(studentCtx);
  tests.push({ name: '2. Student reading metadata/teachers', expectedAllow: false, actualAllow: r2, passed: r2 === false });

  // 3. Teacher reading teacher roster -> ALLOWED
  const r3 = canReadTeacherRoster(teacherCtx);
  tests.push({ name: '3. Teacher reading metadata/teachers', expectedAllow: true, actualAllow: r3, passed: r3 === true });

  // 4. Admin reading teacher roster -> ALLOWED
  const r4 = canReadTeacherRoster(adminCtx);
  tests.push({ name: '4. Admin reading metadata/teachers', expectedAllow: true, actualAllow: r4, passed: r4 === true });

  // 5. Unauthenticated creating submission -> DENIED
  const r5 = canCreateSubmission(unauthenticated);
  tests.push({ name: '5. Unauthenticated creating submission in submissions_docs', expectedAllow: false, actualAllow: r5, passed: r5 === false });

  // 6. Student creating submission -> ALLOWED
  const r6 = canCreateSubmission(studentCtx);
  tests.push({ name: '6. Authenticated Student creating submission', expectedAllow: true, actualAllow: r6, passed: r6 === true });

  // 7. Student reading own submission -> ALLOWED
  const r7 = canReadSubmission(studentCtx, 'student-s01');
  tests.push({ name: '7. Student reading OWN submission', expectedAllow: true, actualAllow: r7, passed: r7 === true });

  // 8. Student reading ANOTHER student submission -> DENIED
  const r8 = canReadSubmission(studentCtx, 'student-OTHER-999');
  tests.push({ name: '8. Student reading ANOTHER student submission', expectedAllow: false, actualAllow: r8, passed: r8 === false });

  // 9. Teacher reading any student submission -> ALLOWED
  const r9 = canReadSubmission(teacherCtx, 'student-OTHER-999');
  tests.push({ name: '9. Teacher reading ANY student submission', expectedAllow: true, actualAllow: r9, passed: r9 === true });

  // 10. Student attempting to write questions_chunks -> DENIED
  const r10 = canWriteQuestionChunks(studentCtx);
  tests.push({ name: '10. Student writing questions_chunks', expectedAllow: false, actualAllow: r10, passed: r10 === false });

  // 11. Teacher writing questions_chunks -> ALLOWED
  const r11 = canWriteQuestionChunks(teacherCtx);
  tests.push({ name: '11. Teacher writing questions_chunks', expectedAllow: true, actualAllow: r11, passed: r11 === true });

  // 12. Student accessing another student draft -> DENIED
  const r12 = canAccessDraft(studentCtx, 'student-OTHER-999');
  tests.push({ name: '12. Student accessing another student draft', expectedAllow: false, actualAllow: r12, passed: r12 === false });

  console.log('----------------------------------------------------------------------');
  let passCount = 0;
  tests.forEach((t, idx) => {
    const status = t.passed ? '✅ DAT' : '❌ KHONG DAT';
    if (t.passed) passCount++;
    console.log(`[Test ${idx + 1}] ${status}: ${t.name}`);
    console.log(`         Expected Allow: ${t.expectedAllow} | Actual Allow: ${t.actualAllow}`);
  });

  console.log(`\nTONG CONG FIRESTORE RULES: ${passCount}/${tests.length} TEST DAT (SUCCESS RATE: ${Math.round((passCount / tests.length) * 100)}%)`);
  console.log('======================================================================');
}

runRulesTests();
