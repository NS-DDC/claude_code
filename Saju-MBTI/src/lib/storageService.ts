/**
 * Storage Service (Async)
 *
 * Hybrid storage that uses Firestore for authenticated users and localStorage as fallback.
 * Provides automatic migration from localStorage to Firestore on first authenticated use.
 */

import { HistoryRecord } from '@/types';
import { historyService, preferencesService, UserPreferences } from './firestore';

const STORAGE_KEY = 'fortune_mbti_history';
const MIGRATION_FLAG_KEY = 'firestore_migration_completed';

/**
 * Check if user data has been migrated to Firestore
 */
function isMigrationCompleted(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(MIGRATION_FLAG_KEY) === 'true';
}

/**
 * Mark migration as completed
 */
function markMigrationCompleted(): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(MIGRATION_FLAG_KEY, 'true');
}

/**
 * Migrate localStorage data to Firestore for authenticated user
 */
async function migrateToFirestore(userId: string): Promise<void> {
  if (isMigrationCompleted()) return;

  try {
    // Migrate history
    const localHistory = localStorage.getItem(STORAGE_KEY);
    if (localHistory) {
      const records: HistoryRecord[] = JSON.parse(localHistory);
      for (const record of records) {
        await historyService.add(userId, record);
      }
      console.log(`Migrated ${records.length} history records to Firestore`);
    }

    // Migrate preferences
    const userMBTI = localStorage.getItem('userMBTI');
    const userElement = localStorage.getItem('userElement');
    const userBirthInfo = localStorage.getItem('userBirthInfo');

    if (userMBTI || userElement || userBirthInfo) {
      const prefs: UserPreferences = {
        mbti: userMBTI as any,
        element: userElement as any,
        birthInfo: userBirthInfo ? JSON.parse(userBirthInfo) : undefined,
      };
      await preferencesService.save(userId, prefs);
      console.log('Migrated user preferences to Firestore');
    }

    markMigrationCompleted();
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

/**
 * Storage service with hybrid Firestore/localStorage backend
 */
export const storageService = {
  /**
   * Get all history records
   * @param userId - User ID (required for Firestore, optional for localStorage fallback)
   */
  async getAll(userId?: string): Promise<HistoryRecord[]> {
    if (userId) {
      try {
        // Migrate data on first authenticated call
        if (!isMigrationCompleted()) {
          await migrateToFirestore(userId);
        }
        return await historyService.getAll(userId);
      } catch (error) {
        console.error('Firestore getAll failed, falling back to localStorage:', error);
        // Fallback to localStorage
      }
    }

    // localStorage fallback for non-authenticated users
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to get history from localStorage:', error);
      return [];
    }
  },

  /**
   * Add a new history record
   */
  async add(record: HistoryRecord, userId?: string): Promise<void> {
    if (userId) {
      try {
        if (!isMigrationCompleted()) {
          await migrateToFirestore(userId);
        }
        await historyService.add(userId, record);
        return;
      } catch (error) {
        console.error('Firestore add failed, falling back to localStorage:', error);
      }
    }

    // localStorage fallback
    if (typeof window === 'undefined') return;
    try {
      const history = await this.getAll();
      history.unshift(record);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    } catch (error) {
      console.error('Failed to add history to localStorage:', error);
    }
  },

  /**
   * Delete a history record by ID
   */
  async delete(id: string, userId?: string): Promise<void> {
    if (userId) {
      try {
        await historyService.delete(userId, id);
        return;
      } catch (error) {
        console.error('Firestore delete failed, falling back to localStorage:', error);
      }
    }

    // localStorage fallback
    if (typeof window === 'undefined') return;
    try {
      const history = await this.getAll();
      const filtered = history.filter(record => record.data.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('Failed to delete from localStorage:', error);
    }
  },

  /**
   * Clear all history
   */
  async clear(userId?: string): Promise<void> {
    if (userId) {
      try {
        await historyService.clear(userId);
        return;
      } catch (error) {
        console.error('Firestore clear failed, falling back to localStorage:', error);
      }
    }

    // localStorage fallback
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear localStorage:', error);
    }
  },

  /**
   * Get a specific history record by ID
   */
  async getById(id: string, userId?: string): Promise<HistoryRecord | null> {
    if (userId) {
      try {
        return await historyService.getById(userId, id);
      } catch (error) {
        console.error('Firestore getById failed, falling back to localStorage:', error);
      }
    }

    // localStorage fallback
    const history = await this.getAll();
    return history.find(record => record.data.id === id) || null;
  },

  /**
   * Get history records by type
   */
  async getByType(type: HistoryRecord['type'], userId?: string): Promise<HistoryRecord[]> {
    if (userId) {
      try {
        return await historyService.getByType(userId, type);
      } catch (error) {
        console.error('Firestore getByType failed, falling back to localStorage:', error);
      }
    }

    // localStorage fallback
    const history = await this.getAll();
    return history.filter(record => record.type === type);
  },

  /**
   * Get user preferences
   */
  async getUserPreferences(userId?: string): Promise<{ mbti?: string; element?: string; birthInfo?: any } | null> {
    if (userId) {
      try {
        if (!isMigrationCompleted()) {
          await migrateToFirestore(userId);
        }
        const prefs = await preferencesService.get(userId);
        return prefs ? {
          mbti: prefs.mbti,
          element: prefs.element,
          birthInfo: prefs.birthInfo
        } : null;
      } catch (error) {
        console.error('Firestore getUserPreferences failed, falling back to localStorage:', error);
      }
    }

    // localStorage fallback
    if (typeof window === 'undefined') return null;
    try {
      const mbti = localStorage.getItem('userMBTI');
      const element = localStorage.getItem('userElement');
      const birthInfo = localStorage.getItem('userBirthInfo');

      return {
        mbti: mbti || undefined,
        element: element || undefined,
        birthInfo: birthInfo ? JSON.parse(birthInfo) : undefined
      };
    } catch (error) {
      console.error('Failed to get user preferences from localStorage:', error);
      return null;
    }
  },

  /**
   * Save user preferences
   */
  async saveUserPreferences(mbti: string, element: string, birthInfo: any, userId?: string): Promise<void> {
    if (userId) {
      try {
        await preferencesService.save(userId, { mbti: mbti as any, element: element as any, birthInfo });
        return;
      } catch (error) {
        console.error('Firestore saveUserPreferences failed, falling back to localStorage:', error);
      }
    }

    // localStorage fallback
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem('userMBTI', mbti);
      localStorage.setItem('userElement', element);
      localStorage.setItem('userBirthInfo', JSON.stringify(birthInfo));
    } catch (error) {
      console.error('Failed to save user preferences to localStorage:', error);
    }
  }
};
