/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc, collection, getDocs, writeBatch } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

// Initialize Firestore using the custom database ID provided in the configuration
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

export { doc, setDoc, getDoc, collection, getDocs, writeBatch };
