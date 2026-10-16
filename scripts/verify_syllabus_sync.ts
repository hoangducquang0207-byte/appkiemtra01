import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { FULL_SYLLABUS_CATALOG } from '../src/data/syllabusCatalog.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_FILE = path.join(__dirname, '../server_db.json');

console.log('🔍 Starting QUICKQUIZ Syllabus Sync Audit...');

if (!fs.existsSync(DB_FILE)) {
  console.error('❌ FAIL: server_db.json does not exist!');
  process.exit(1);
}

const raw = fs.readFileSync(DB_FILE, 'utf8');
const data = JSON.parse(raw);

const questions = data.questions || [];
const syllabus = data.syllabus || [];

let passed = true;

// CHECK 1: No "Toán học" in question subjects
const toanHocQuestions = questions.filter((q: any) => q.subject === 'Toán học');
if (toanHocQuestions.length === 0) {
  console.log(`✅ TEST 1 PASSED: 0 questions have subject "Toán học".`);
} else {
  console.error(`❌ TEST 1 FAILED: Found ${toanHocQuestions.length} questions with subject "Toán học"!`);
  passed = false;
}

// CHECK 2: No parsed chapter or lesson IDs
const parsedChapterQuestions = questions.filter((q: any) => 
  (q.chapterId && q.chapterId.includes('parsed')) || 
  (q.lessonId && q.lessonId.includes('parsed'))
);
if (parsedChapterQuestions.length === 0) {
  console.log(`✅ TEST 2 PASSED: 0 questions have unparsed "ch-parsed-*" or "le-parsed-*" IDs.`);
} else {
  console.error(`❌ TEST 2 FAILED: Found ${parsedChapterQuestions.length} questions with parsed IDs!`);
  passed = false;
}

// CHECK 3: Syllabus catalog exists in server_db.json and is populated
if (Array.isArray(syllabus) && syllabus.length > 0) {
  console.log(`✅ TEST 3 PASSED: server_db.json contains ${syllabus.length} syllabus items.`);
} else {
  console.error(`❌ TEST 3 FAILED: Syllabus in server_db.json is empty or invalid!`);
  passed = false;
}

// CHECK 4: All questions have non-empty grade, subject, chapterId, lessonId
const invalidQuestionStructure = questions.filter((q: any) => 
  !q.grade || !q.subject || !q.chapterId || !q.lessonId
);
if (invalidQuestionStructure.length === 0) {
  console.log(`✅ TEST 4 PASSED: All ${questions.length} questions have valid grade, subject, chapterId, lessonId.`);
} else {
  console.error(`❌ TEST 4 FAILED: Found ${invalidQuestionStructure.length} questions with missing metadata!`);
  passed = false;
}

// SUMMARY
if (passed) {
  console.log('\n🎉 ALL SYLLABUS SYNC AUDIT TESTS PASSED SUCCESSFULLY! 100% COMPLIANT.');
  process.exit(0);
} else {
  console.error('\n❌ SYLLABUS SYNC AUDIT FAILED! Please review errors above.');
  process.exit(1);
}
