/**
 * Firestore Service
 *
 * Production-ready Firestore service with offline persistence and error handling.
 * Provides services for managing user history and preferences.
 *
 * Collection Structure:
 * - users/{userId}/history/{recordId}
 * - users/{userId}/preferences/default
 */

import {
  initializeFirestore,
  getFirestore,
  Firestore,
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  addDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  persistentLocalCache,
  persistentMultipleTabManager,
  Timestamp,
  serverTimestamp,
  QueryDocumentSnapshot,
  DocumentData
} from 'firebase/firestore';
import { app, isConfigured } from './firebase';
import { HistoryRecord, SajuInput, MBTIType, Element } from '@/types';

/**
 * User preferences stored in Firestore
 */
export interface UserPreferences {
  mbti?: MBTIType;
  element?: Element;
  birthInfo?: SajuInput;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

/**
 * Initialize Firestore instance with offline persistence
 */
let firestoreInstance: Firestore | null = null;

/**
 * Get Firestore instance (singleton pattern)
 * Uses persistentLocalCache for offline support (replaces deprecated enableIndexedDbPersistence)
 */
export function getFirestoreInstance(): Firestore | null {
  if (!isConfigured) return null;

  if (!firestoreInstance) {
    try {
      firestoreInstance = initializeFirestore(app, {
        localCache: persistentLocalCache({
          tabManager: persistentMultipleTabManager(),
        }),
      });
    } catch {
      // Already initialized — get existing instance
      firestoreInstance = getFirestore(app);
    }
  }

  return firestoreInstance;
}

/**
 * Firestore instance - use this for all Firestore operations
 * Will be null if Firebase is not configured
 */
export const firestore = getFirestoreInstance();

/**
 * History Service
 * Manages user history records in Firestore
 */
export class HistoryService {
  private firestore: Firestore | null;

  constructor(firestoreInstance?: Firestore | null) {
    this.firestore = firestoreInstance !== undefined ? firestoreInstance : firestore;
  }

  /**
   * Get collection reference for user's history
   */
  private getCollectionRef(userId: string) {
    if (!this.firestore) throw new Error('Firestore not initialized');
    return collection(this.firestore, 'users', userId, 'history');
  }

  /**
   * Get document reference for a specific history record
   */
  private getDocRef(userId: string, recordId: string) {
    if (!this.firestore) throw new Error('Firestore not initialized');
    return doc(this.firestore, 'users', userId, 'history', recordId);
  }

  /**
   * Convert Firestore document to HistoryRecord
   */
  private docToHistoryRecord(docSnap: QueryDocumentSnapshot<DocumentData>): HistoryRecord {
    const data = docSnap.data();
    return {
      type: data.type,
      data: data.data,
    } as HistoryRecord;
  }

  /**
   * Get all history records for a user, ordered by creation date descending
   */
  async getAll(userId: string): Promise<HistoryRecord[]> {
    try {
      const collectionRef = this.getCollectionRef(userId);
      const q = query(collectionRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => this.docToHistoryRecord(doc));
    } catch (error) {
      console.error('Failed to get history records:', error);
      throw new Error(`Failed to retrieve history: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Add a new history record.
   * Uses data.id as the Firestore document ID so delete/getById work by the same ID.
   */
  async add(userId: string, record: HistoryRecord): Promise<void> {
    try {
      const docId = record.data.id;
      if (!docId) {
        // Fallback: addDoc for records missing an ID (shouldn't happen in practice)
        await addDoc(this.getCollectionRef(userId), {
          type: record.type,
          data: record.data,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        return;
      }
      await setDoc(this.getDocRef(userId, docId), {
        type: record.type,
        data: record.data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Failed to add history record:', error);
      throw new Error(`Failed to add history record: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete a specific history record by its data.id
   */
  async delete(userId: string, recordId: string): Promise<void> {
    try {
      await deleteDoc(this.getDocRef(userId, recordId));
    } catch (error) {
      console.error('Failed to delete history record:', error);
      throw new Error(`Failed to delete history record ${recordId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Clear all history records for a user
   */
  async clear(userId: string): Promise<void> {
    try {
      const records = await this.getAll(userId);
      await Promise.all(records.map(record => this.delete(userId, record.data.id)));
    } catch (error) {
      console.error('Failed to clear history:', error);
      throw new Error(`Failed to clear history: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get a specific history record by its data.id
   */
  async getById(userId: string, recordId: string): Promise<HistoryRecord | null> {
    try {
      const docSnap = await getDoc(this.getDocRef(userId, recordId));
      if (!docSnap.exists()) return null;
      return this.docToHistoryRecord(docSnap as QueryDocumentSnapshot<DocumentData>);
    } catch (error) {
      console.error('Failed to get history record by ID:', error);
      throw new Error(`Failed to get history record ${recordId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get history records filtered by type
   */
  async getByType(userId: string, type: HistoryRecord['type']): Promise<HistoryRecord[]> {
    try {
      const collectionRef = this.getCollectionRef(userId);
      const q = query(collectionRef, where('type', '==', type), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => this.docToHistoryRecord(doc));
    } catch (error) {
      console.error('Failed to get history records by type:', error);
      throw new Error(`Failed to get history records of type ${type}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

/**
 * Preferences Service
 * Manages user preferences in Firestore
 */
export class PreferencesService {
  private firestore: Firestore | null;
  private readonly PREFS_DOC_ID = 'default';

  constructor(firestoreInstance?: Firestore | null) {
    this.firestore = firestoreInstance !== undefined ? firestoreInstance : firestore;
  }

  /**
   * Get document reference for user's preferences
   */
  private getDocRef(userId: string) {
    if (!this.firestore) throw new Error('Firestore not initialized');
    return doc(this.firestore, 'users', userId, 'preferences', this.PREFS_DOC_ID);
  }

  /**
   * Get user preferences
   * @param userId - User ID
   * @returns Promise resolving to user preferences or null if not found
   */
  async get(userId: string): Promise<UserPreferences | null> {
    try {
      const docRef = this.getDocRef(userId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return null;
      }

      return docSnap.data() as UserPreferences;
    } catch (error) {
      console.error('Failed to get user preferences:', error);
      throw new Error(`Failed to get preferences for user ${userId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Save user preferences
   * @param userId - User ID
   * @param prefs - User preferences to save
   * @returns Promise resolving when preferences are saved
   */
  async save(userId: string, prefs: UserPreferences): Promise<void> {
    try {
      const docRef = this.getDocRef(userId);
      const existingPrefs = await this.get(userId);
      await setDoc(docRef, {
        ...prefs,
        createdAt: existingPrefs?.createdAt ?? serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Failed to save user preferences:', error);
      throw new Error(`Failed to save preferences: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

/**
 * Export service instances for convenient usage
 */
export const historyService = new HistoryService();
export const preferencesService = new PreferencesService();

/**
 * Default export: firestore instance
 */
export default firestore;
