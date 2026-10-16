/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updatePassword,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  getDocs,
  writeBatch,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

const getDbId = (): string => {
  if (typeof window !== 'undefined') {
    try {
      const params = new URLSearchParams(window.location.search);
      const urlDb = params.get('db');
      if (urlDb && urlDb.trim().length > 5) {
        localStorage.setItem('quickquiz-shared-db-id', urlDb.trim());
        return urlDb.trim();
      }
      const storedDb = localStorage.getItem('quickquiz-shared-db-id');
      if (storedDb && storedDb.trim().length > 5) {
        return storedDb.trim();
      }
    } catch (e) {
      console.warn('Error reading db id from location:', e);
    }
  }
  return firebaseConfig.firestoreDatabaseId || '(default)';
};

// Initialize Firestore using custom database ID or default
export const db = getFirestore(app, getDbId());

export {
  doc,
  setDoc,
  getDoc,
  collection,
  getDocs,
  writeBatch,
  onSnapshot,
  query,
  where,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updatePassword,
};
export type { FirebaseUser };
