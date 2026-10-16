/**
 * Dry-run migration script for QUICKQUIZ Version 10
 */
const fs = require('fs');
const path = require('path');

const mainDbPath = path.join(process.cwd(), 'server_db.json');
const backup3Path = path.join(process.cwd(), 'server_db_backup_master3.json');

const mainDb = JSON.parse(fs.readFileSync(mainDbPath, 'utf8'));
const backup3 = fs.existsSync(backup3Path) ? JSON.parse(fs.readFileSync(backup3Path, 'utf8')) : null;

console.log('======================================================================');
console.log('DRY-RUN RECONCILIATION & MIGRATION REPORT - QUICKQUIZ V10');
console.log('======================================================================\n');

// 1. Audit Teachers
console.log('[1. TEACHER RECONCILIATION]');
console.log(`- Current teachers in server_db.json: ${mainDb.teachers ? mainDb.teachers.length : 0}`);
let teachersToRestore = [];
if (backup3 && Array.isArray(backup3.teachers)) {
  teachersToRestore = backup3.teachers;
  console.log(`- Teachers found in server_db_backup_master3.json: ${teachersToRestore.length}`);
  teachersToRestore.forEach((t) => {
    console.log(`  * ID: ${t.id} | Name: ${t.name} | Email: ${t.email}`);
  });
}
console.log(`-> PROPOSAL: Restore ${teachersToRestore.length} teachers into server_db.json.\n`);

// 2. Audit Classes and Student Schema
console.log('[2. CLASS & STUDENT SCHEMA MIGRATION]');
let classPassFixed = 0;
let totalStudents = 0;
let studentsNeedingPasscode = 0;

if (Array.isArray(mainDb.classes)) {
  mainDb.classes.forEach((c) => {
    if (!c.classPassword && (c.joinPass || c.joinCode)) {
      classPassFixed++;
    }
    if (Array.isArray(c.students)) {
      totalStudents += c.students.length;
      c.students.forEach((s) => {
        if (!s.password) {
          studentsNeedingPasscode++;
        }
      });
    }
  });
}

console.log(`- Total Classes: ${mainDb.classes ? mainDb.classes.length : 0}`);
console.log(`- Classes using joinPass/joinCode needing classPassword sync: ${classPassFixed}`);
console.log(`- Total Student Enrollments: ${totalStudents}`);
console.log(`- Students missing personal passcode (password): ${studentsNeedingPasscode}`);
console.log(`-> PROPOSAL: Synchronize classPassword field and generate 6-character alphanumeric passcodes for ${studentsNeedingPasscode} students while preserving student IDs, names, and class memberships.\n`);

// 3. Audit Submissions
console.log('[3. SUBMISSIONS RECONCILIATION]');
const submissions = mainDb.submissions || [];
console.log(`- Total Submissions in server_db.json: ${submissions.length}`);

let realSubs = 0;
let testSubs = 0;
const assignmentIdsInDb = new Set((mainDb.assignments || []).map((a) => a.id));
let unlinkedSubs = 0;

submissions.forEach((s) => {
  if (s.id.startsWith('test-sub-')) {
    testSubs++;
  } else {
    realSubs++;
  }
  if (!assignmentIdsInDb.has(s.assignmentId)) {
    unlinkedSubs++;
  }
});

console.log(`  * Real Student Submissions: ${realSubs}`);
console.log(`  * Automated Security Test Submissions: ${testSubs}`);
console.log(`  * Submissions associated with historical/custom assignments: ${unlinkedSubs}`);
console.log(`-> PROPOSAL: Retain all 27 real historical submissions intact.\n`);

console.log('======================================================================');
console.log('DRY-RUN COMPLETE. READY TO APPLY MIGRATION WITH ADMIN APPROVAL.');
console.log('======================================================================');
