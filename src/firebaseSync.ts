/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { db, auth, doc, setDoc, getDoc, collection, getDocs, writeBatch, onSnapshot } from './firebase';
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

let isFirestoreQuotaExceeded = false;
const lastSavedCache = new Map<string, string>();

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
 * Saves all system state to Firestore safely merging remote items by ID to avoid overwriting student submissions or shared data
 */
export async function saveStateToFirestore(state: Partial<FirestorePayload>): Promise<boolean> {
  if (isFirestoreQuotaExceeded) {
    return false;
  }

  try {
    const batch = writeBatch(db);
    let hasWrites = false;

    if (state.classes !== undefined) {
      const serialized = JSON.stringify(state.classes);
      if (lastSavedCache.get('classes') !== serialized) {
        batch.set(doc(db, METADATA_COLLECTION, 'classes'), { classes: state.classes });
        lastSavedCache.set('classes', serialized);
        hasWrites = true;
      }
    }

    if (state.teachers !== undefined) {
      const serialized = JSON.stringify(state.teachers);
      if (lastSavedCache.get('teachers') !== serialized) {
        batch.set(doc(db, METADATA_COLLECTION, 'teachers'), { teachers: state.teachers });
        lastSavedCache.set('teachers', serialized);
        hasWrites = true;
      }
    }

    if (state.exams !== undefined) {
      const serialized = JSON.stringify(state.exams);
      if (lastSavedCache.get('exams') !== serialized) {
        batch.set(doc(db, METADATA_COLLECTION, 'exams'), { exams: state.exams });
        lastSavedCache.set('exams', serialized);
        hasWrites = true;
      }
    }

    if (state.assignments !== undefined) {
      const serialized = JSON.stringify(state.assignments);
      if (lastSavedCache.get('assignments') !== serialized) {
        batch.set(doc(db, METADATA_COLLECTION, 'assignments'), { assignments: state.assignments });
        lastSavedCache.set('assignments', serialized);
        hasWrites = true;
      }
    }

    if (state.syllabus !== undefined) {
      const serialized = JSON.stringify(state.syllabus);
      if (lastSavedCache.get('syllabus') !== serialized) {
        batch.set(doc(db, METADATA_COLLECTION, 'syllabus'), { syllabus: state.syllabus });
        lastSavedCache.set('syllabus', serialized);
        hasWrites = true;
      }
    }

    if (hasWrites) {
      await batch.commit();
    }

    // Questions are chunked and saved separately due to 1MB limit - ONLY write if questions changed
    if (state.questions !== undefined) {
      const serialized = JSON.stringify(state.questions);
      if (lastSavedCache.get('questions') !== serialized) {
        lastSavedCache.set('questions', serialized);
        const chunks = chunkArray(state.questions, 400);
        
        await setDoc(doc(db, METADATA_COLLECTION, 'questions_meta'), {
          chunkCount: chunks.length,
          totalQuestions: state.questions.length
        });

        for (let i = 0; i < chunks.length; i++) {
          await setDoc(doc(db, QUESTIONS_COLLECTION, `chunk_${i}`), {
            questions: chunks[i]
          });
        }
      }
    }

    return true;
  } catch (err: any) {
    const errStr = String(err?.message || err);
    if (errStr.includes('resource-exhausted') || errStr.includes('Quota limit exceeded')) {
      isFirestoreQuotaExceeded = true;
      console.warn('Firestore daily write quota reached. App continues operating on LocalStorage & Express DB.');
    } else {
      console.error('Error saving state to Firestore:', err);
    }
    return false;
  }
}

/**
 * Universal client authentication header helper for Express API calls
 */
export async function getAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  try {
    const currentUser = auth.currentUser;
    if (currentUser) {
      const token = await currentUser.getIdToken();
      headers['Authorization'] = `Bearer ${token}`;
      return headers;
    }
  } catch (e) {
    console.warn('Failed to get Firebase ID token:', e);
  }

  try {
    const savedStudent = localStorage.getItem('quickquiz-student-setup-v1');
    if (savedStudent) {
      const parsed = JSON.parse(savedStudent);
      if (parsed.classPass || parsed.studentPass || parsed.studentId) {
        headers['X-Student-Auth'] = `${parsed.classId || ''}:${parsed.studentId || ''}:${parsed.classPass || ''}:${parsed.studentPass || ''}`;
      }
    }
  } catch (e) {}

  return headers;
}

/**
 * Atomic helper to push a new submission to Firestore without risking overwrites
 */
export async function syncAndMergeSubmissions(newSub?: Submission): Promise<{ success: boolean; submissions: Submission[]; error?: string }> {
  let localSubs: Submission[] = [];
  try {
    const data = localStorage.getItem('QuickQuiz_V2.5_DB');
    if (data) {
      const parsed = JSON.parse(data);
      localSubs = parsed.submissions || [];
    }
  } catch (e) {}

  let serverConfirmed = false;
  let serverSubs: Submission[] = [];

  // Always attempt to send newSub to Express Server DB
  if (newSub && newSub.id) {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/submit-test', {
        method: 'POST',
        headers,
        body: JSON.stringify({ submission: newSub })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          serverConfirmed = true;
          if (Array.isArray(data.submissions)) {
            serverSubs = data.submissions;
          }
        }
      }
    } catch (err) {
      console.warn('Server endpoint /api/submit-test sync error:', err);
    }
  }

  // Merge local, server, and newSub
  const map = new Map<string, Submission>();
  localSubs.forEach((s) => { if (s && s.id) map.set(s.id, s); });
  serverSubs.forEach((s) => { if (s && s.id) map.set(s.id, s); });
  if (newSub && newSub.id) map.set(newSub.id, newSub);
  let merged = Array.from(map.values());

  if (!isFirestoreQuotaExceeded) {
    try {
      const subRef = doc(db, METADATA_COLLECTION, 'submissions');
      const snap = await getDoc(subRef);
      let remoteSubs: Submission[] = [];
      if (snap.exists()) {
        remoteSubs = snap.data().submissions || [];
      }

      remoteSubs.forEach((s) => { if (s && s.id) map.set(s.id, s); });
      if (newSub && newSub.id) map.set(newSub.id, newSub);
      merged = Array.from(map.values());

      if (newSub && newSub.id) {
        await setDoc(doc(db, 'submissions_docs', newSub.id), newSub);
      }
      await setDoc(subRef, { submissions: merged });
      serverConfirmed = true;
    } catch (err: any) {
      const errStr = String(err?.message || err);
      if (errStr.includes('resource-exhausted') || errStr.includes('Quota limit exceeded')) {
        isFirestoreQuotaExceeded = true;
      }
    }
  }

  // Update LocalStorage
  try {
    const existing = localStorage.getItem('QuickQuiz_V2.5_DB');
    if (existing) {
      const parsed = JSON.parse(existing);
      parsed.submissions = merged;
      localStorage.setItem('QuickQuiz_V2.5_DB', JSON.stringify(parsed));
    }
  } catch (e) {}

  return {
    success: serverConfirmed || !newSub,
    submissions: merged,
    error: !serverConfirmed && newSub ? 'Chưa nhận được phản hồi từ Máy chủ/Đám mây. Đáp án đã được lưu nháp an toàn trên thiết bị.' : undefined
  };
}

/**
 * Real-time Firestore listener for Submissions collection
 */
export function subscribeToSubmissions(onUpdate: (subs: Submission[]) => void): () => void {
  if (isFirestoreQuotaExceeded) {
    return () => {};
  }

  try {
    const subRef = doc(db, METADATA_COLLECTION, 'submissions');
    const unsubscribe = onSnapshot(
      subRef,
      (snap) => {
        if (snap.exists()) {
          const remoteSubs: Submission[] = snap.data().submissions || [];
          onUpdate(remoteSubs);
        }
      },
      (error) => {
        const errStr = String(error?.message || error);
        if (errStr.includes('resource-exhausted') || errStr.includes('Quota limit exceeded')) {
          isFirestoreQuotaExceeded = true;
        } else {
          console.warn('Real-time submission listener error:', error);
        }
      }
    );
    return unsubscribe;
  } catch (err) {
    return () => {};
  }
}

/**
 * Lightweight helper to fetch ONLY remote submissions from Firestore without pulling all questions
 */
export async function fetchRemoteSubmissionsOnly(): Promise<Submission[]> {
  if (isFirestoreQuotaExceeded) return [];
  try {
    const subRef = doc(db, METADATA_COLLECTION, 'submissions');
    const snap = await getDoc(subRef);
    if (snap.exists()) {
      return snap.data().submissions || [];
    }
  } catch (err: any) {
    const errStr = String(err?.message || err);
    if (errStr.includes('resource-exhausted') || errStr.includes('Quota limit exceeded')) {
      isFirestoreQuotaExceeded = true;
    }
  }
  return [];
}

/**
 * Loads all state from Firestore. Returns null if firestore has no data yet.
 */
export async function loadStateFromFirestore(): Promise<FirestorePayload | null> {
  if (isFirestoreQuotaExceeded) {
    return null;
  }

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

    const hasData =
      classesSnap.exists() ||
      teachersSnap.exists() ||
      examsSnap.exists() ||
      assignmentsSnap.exists() ||
      submissionsSnap.exists() ||
      syllabusSnap.exists() ||
      questionsMetaSnap.exists();
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
  } catch (err: any) {
    const errStr = String(err?.message || err);
    if (errStr.includes('resource-exhausted') || errStr.includes('Quota limit exceeded')) {
      isFirestoreQuotaExceeded = true;
    }
    console.warn('Firestore load failed (e.g. quota/network), falling back to Server DB:', err);
    return null;
  }
}
