import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import fs from 'fs';

const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf-8'));
const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);

async function check() {
  try {
    const snap = await getDoc(doc(db, 'metadata', 'classes'));
    if (!snap.exists()) {
      console.log('No classes document found in Firestore!');
    } else {
      const classes = snap.data().classes || [];
      console.log(`Found ${classes.length} classes on Firestore database:`);
      classes.forEach((c, idx) => {
        console.log(`${idx + 1}. [${c.id}] Name: "${c.name}", Password/JoinPass: "${c.joinPass}", CreatedBy: "${c.createdBy}", Students count: ${c.students ? c.students.length : 0}`);
      });
    }
  } catch (err) {
    console.error('Error fetching from firestore:', err);
  }
  process.exit(0);
}

check();
