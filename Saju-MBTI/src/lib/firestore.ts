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
  enableIndexedDbPersistence,
  Timestamp,
  serverTimestamp,
  QueryDocumentSnapshot,
  DocumentData
} from 'firebase/firestore';
import { app, isConfigured } from './firebase';
import { HistoryRecord, SajuInput, MBTIType, Element } from '@/types';
import { NotificationSettings } from './notifications';

/**
 * User preferences stored in Firestore
 */
export interface UserPreferences {
  mbti?: MBTIType;
  element?: Element;
  birthInfo?: SajuInput;
  notificationSettings?: NotificationSettings;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

/**
 * History record with Firestore timestamps
 */
interface FirestoreHistoryRecord extends HistoryRecord {
  id: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Initialize Firestore instance with offline persistence
 */
let firestoreInstance: Firestore | null = null;

/**
 * Get Firestore instance (singleton pattern)
 * Enables offline persistence on first call
 */
export function getFirestoreInstance(): Firestore | null {
  // Return null if Firebase is not configured
  if (!isConfigured) {
    return null;
  }

  if (!firestoreInstance) {
    firestoreInstance = getFirestore(app);

    // Enable offline persistence (only in browser environment)
    if (typeof window !== 'undefined') {
      enableIndexedDbPersistence(firestoreInstance)
        .then(() => {
          console.log('Firestore offline persistence enabled');
        })
        .catch((err) => {
          if (err.code === 'failed-precondition') {
            console.warn('Firestore persistence failed: Multiple tabs open');
          } else if (err.code === 'unimplemented') {
            console.warn('Firestore persistence not available in this browser');
          } else {
            console.error('Firestore persistence error:', err);
          }
        });
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
  private docToHistoryRecord(docSnap: QueryDocumentSnapshot<DocumentData>): FirestoreHistoryRecord {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      type: data.type,
      data: data.data,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    } as FirestoreHistoryRecord;
  }

  /**
   * Get all history records for a user
   * @param userId - User ID
   * @returns Promise resolving to array of history records
   */
  async getAll(userId: string): Promise<HistoryRecord[]> {
    try {
      const collectionRef = this.getCollectionRef(userId);
      const q = query(collectionRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map(doc => this.docToHistoryRecord(doc));
    } catch (error) {
      console.error('Failed to get history records:', error);
      throw new Error(`Failed to retrieve history for user ${userId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Add a new history record
   * @param userId - User ID
   * @param record - History record to add
   * @returns Promise resolving when record is added
   */
  async add(userId: string, record: HistoryRecord): Promise<void> {
    try {
      const collectionRef = this.getCollectionRef(userId);
      const timestamp = serverTimestamp();

      await addDoc(collectionRef, {
        ...record,
        createdAt: timestamp,
        updatedAt: timestamp,
      });
    } catch (error) {
      console.error('Failed to add history record:', error);
      throw new Error(`Failed to add history record for user ${userId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete a specific history record
   * @param userId - User ID
   * @param recordId - Record ID to delete
   * @returns Promise resolving when record is deleted
   */
  async delete(userId: string, recordId: string): Promise<void> {
    try {
      const docRef = this.getDocRef(userId, recordId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Failed to delete history record:', error);
      throw new Error(`Failed to delete history record ${recordId} for user ${userId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Clear all history records for a user
   * @param userId - User ID
   * @returns Promise resolving when all records are deleted
   */
  async clear(userId: string): Promise<void> {
    try {
      const records = await this.getAll(userId);
      const deletePromises = records.map(record =>
        this.delete(userId, record.data.id)
      );

      await Promise.all(deletePromises);
    } catch (error) {
      console.error('Failed to clear history:', error);
      throw new Error(`Failed to clear history for user ${userId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get a specific history record by ID
   * @param userId - User ID
   * @param recordId - Record ID
   * @returns Promise resolving to history record or null if not found
   */
  async getById(userId: string, recordId: string): Promise<HistoryRecord | null> {
    try {
      const docRef = this.getDocRef(userId, recordId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return null;
      }

      return this.docToHistoryRecord(docSnap as QueryDocumentSnapshot<DocumentData>);
    } catch (error) {
      console.error('Failed to get history record by ID:', error);
      throw new Error(`Failed to get history record ${recordId} for user ${userId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get history records filtered by type
   * @param userId - User ID
   * @param type - Record type to filter by
   * @returns Promise resolving to array of history records
   */
  async getByType(userId: string, type: HistoryRecord['type']): Promise<HistoryRecord[]> {
    try {
      const collectionRef = this.getCollectionRef(userId);
      const q = query(
        collectionRef,
        where('type', '==', type),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map(doc => this.docToHistoryRecord(doc));
    } catch (error) {
      console.error('Failed to get history records by type:', error);
      throw new Error(`Failed to get history records of type ${type} for user ${userId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
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

      const timestamp = serverTimestamp();
      const dataToSave: UserPreferences = {
        ...prefs,
        createdAt: existingPrefs?.createdAt || (timestamp as Timestamp),
        updatedAt: timestamp as Timestamp,
      };

      await setDoc(docRef, dataToSave);
    } catch (error) {
      console.error('Failed to save user preferences:', error);
      throw new Error(`Failed to save preferences for user ${userId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
