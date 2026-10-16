/**
 * Apply Migration V10 for QUICKQUIZ
 */
const fs = require('fs');
const path = require('path');

const mainDbPath = path.join(process.cwd(), 'server_db.json');
const backupPreV10Path = path.join(process.cwd(), 'server_db_backup_pre_v10.json');
const backup3Path = path.join(process.cwd(), 'server_db_backup_master3.json');

// Step 1: Create Safety Backup before modifying
if (fs.existsSync(mainDbPath)) {
  fs.copyFileSync(mainDbPath, backupPreV10Path);
  console.log(`✅ Created safety backup: server_db_backup_pre_v10.json`);
}

const mainDb = JSON.parse(fs.readFileSync(mainDbPath, 'utf8'));
const backup3 = fs.existsSync(backup3Path) ? JSON.parse(fs.readFileSync(backup3Path, 'utf8')) : null;

// Helper to generate 6-character secure passcode
function generateSecureStudentPasscode() {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let passcode = '';
  for (let i = 0; i < 6; i++) {
    passcode += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return passcode;
}

// 1. Restore Teachers
if (backup3 && Array.isArray(backup3.teachers) && backup3.teachers.length > 0) {
  const existingEmailSet = new Set((mainDb.teachers || []).map((t) => t.email && t.email.toLowerCase()));
  if (!mainDb.teachers) mainDb.teachers = [];
  
  backup3.teachers.forEach((t) => {
    if (t.email && !existingEmailSet.has(t.email.toLowerCase())) {
      mainDb.teachers.push(t);
    }
  });
  console.log(`✅ Restored teachers count in main DB: ${mainDb.teachers.length}`);
}

// 2. Harmonize Class Password & Student Passcodes
let passcodesGenerated = 0;
let classesHarmonized = 0;

if (Array.isArray(mainDb.classes)) {
  mainDb.classes.forEach((c) => {
    const unifiedPass = c.classPassword || c.joinPass || c.joinCode || 'LOPHOC123';
    c.classPassword = unifiedPass;
    c.joinPass = unifiedPass;
    c.joinCode = unifiedPass;
    classesHarmonized++;

    if (Array.isArray(c.students)) {
      c.students.forEach((s) => {
        if (!s.password) {
          s.password = generateSecureStudentPasscode();
          passcodesGenerated++;
        }
      });
    }
  });
}

console.log(`✅ Harmonized ${classesHarmonized} classes.`);
console.log(`✅ Generated ${passcodesGenerated} student passcodes.`);

// 3. Save Migration Result
fs.writeFileSync(mainDbPath, JSON.stringify(mainDb, null, 2), 'utf8');
console.log(`✅ Successfully applied Migration V10 to server_db.json`);
