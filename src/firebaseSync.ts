/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { db, doc, setDoc, getDoc, collection, getDocs, writeBatch } from './firebase';
import { Class, TeacherAccount, Question, Exam, Assignment, Submission, Syllabus } from './types';

// Standardized string normalization requested in rule 7:
// String(value ?? '').trim().toLowerCase().normalize('NFKC')
export function normalizeStr(value: any): string {
  return String(value ?? '').trim().toLowerCase().normalize('NFKC');
}

const METADATA_COLLECTION = 'metadata';
const QUESTIONS_COLLECTION = 'questions_chunks';

export interface FirestorePayload {
  classes: Class[];
  teachers: TeacherAccount[];
  exams: Exam[];
  assignments: Assignment[];
  submissions: Submission[];
  syllabus: Syllabus[];
  questions: Question[];
}

/**
 * Splits questions array into smaller chunks to respect Firestore 1MB document size limits safely.
 */
function chunkArray<T>(array: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
}

/**
 * Saves all system state to Firestore
 */
export async function saveStateToFirestore(state: Partial<FirestorePayload>): Promise<boolean> {
  try {
    const batch = writeBatch(db);

    if (state.classes !== undefined) {
      batch.set(doc(db, METADATA_COLLECTION, 'classes'), { classes: state.classes });
    }
    if (state.teachers !== undefined) {
      batch.set(doc(db, METADATA_COLLECTION, 'teachers'), { teachers: state.teachers });
    }
    if (state.exams !== undefined) {
      batch.set(doc(db, METADATA_COLLECTION, 'exams'), { exams: state.exams });
    }
    if (state.assignments !== undefined) {
      batch.set(doc(db, METADATA_COLLECTION, 'assignments'), { assignments: state.assignments });
    }
    if (state.submissions !== undefined) {
      batch.set(doc(db, METADATA_COLLECTION, 'submissions'), { submissions: state.submissions });
    }
    if (state.syllabus !== undefined) {
      batch.set(doc(db, METADATA_COLLECTION, 'syllabus'), { syllabus: state.syllabus });
    }

    await batch.commit();

    // Questions are chunked and saved separately due to 1MB limit
    if (state.questions !== undefined) {
      const chunks = chunkArray(state.questions, 400); // 400 questions per chunk is extremely safe and fast
      
      // First, save the chunk metadata
      await setDoc(doc(db, METADATA_COLLECTION, 'questions_meta'), {
        chunkCount: chunks.length,
        totalQuestions: state.questions.length
      });

      // Save each chunk document
      for (let i = 0; i < chunks.length; i++) {
        await setDoc(doc(db, QUESTIONS_COLLECTION, `chunk_${i}`), {
          questions: chunks[i]
        });
      }
    }

    return true;
  } catch (err) {
    console.error('Error saving state to Firestore:', err);
    return false;
  }
}

/**
 * Loads all state from Firestore. Returns null if firestore has no data yet.
 */
export async function loadStateFromFirestore(): Promise<FirestorePayload | null> {
  try {
    const [
      classesSnap,
      teachersSnap,
      examsSnap,
      assignmentsSnap,
      submissionsSnap,
      syllabusSnap,
      questionsMetaSnap
    ] = await Promise.all([
      getDoc(doc(db, METADATA_COLLECTION, 'classes')),
      getDoc(doc(db, METADATA_COLLECTION, 'teachers')),
      getDoc(doc(db, METADATA_COLLECTION, 'exams')),
      getDoc(doc(db, METADATA_COLLECTION, 'assignments')),
      getDoc(doc(db, METADATA_COLLECTION, 'submissions')),
      getDoc(doc(db, METADATA_COLLECTION, 'syllabus')),
      getDoc(doc(db, METADATA_COLLECTION, 'questions_meta'))
    ]);

    const hasData = classesSnap.exists() || teachersSnap.exists();
    if (!hasData) {
      return null;
    }

    const classes = classesSnap.exists() ? (classesSnap.data().classes || []) : [];
    const teachers = teachersSnap.exists() ? (teachersSnap.data().teachers || []) : [];
    const exams = examsSnap.exists() ? (examsSnap.data().exams || []) : [];
    const assignments = assignmentsSnap.exists() ? (assignmentsSnap.data().assignments || []) : [];
    const submissions = submissionsSnap.exists() ? (submissionsSnap.data().submissions || []) : [];
    const syllabus = syllabusSnap.exists() ? (syllabusSnap.data().syllabus || []) : [];

    // Reconstruct chunked questions
    let questions: Question[] = [];
    if (questionsMetaSnap.exists()) {
      const meta = questionsMetaSnap.data();
      const chunkCount = meta.chunkCount || 0;
      const promises = [];
      for (let i = 0; i < chunkCount; i++) {
        promises.push(getDoc(doc(db, QUESTIONS_COLLECTION, `chunk_${i}`)));
      }
      const snaps = await Promise.all(promises);
      for (const snap of snaps) {
        if (snap.exists()) {
          questions = questions.concat(snap.data().questions || []);
        }
      }
    }

    return {
      classes,
      teachers,
      exams,
      assignments,
      submissions,
      syllabus,
      questions
    };
  } catch (err) {
    console.error('Error loading state from Firestore:', err);
    throw err; // Re-throw so caller can display the connection error
  }
}
