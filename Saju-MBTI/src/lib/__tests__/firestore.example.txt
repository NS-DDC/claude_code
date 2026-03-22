/**
 * Firestore Service Usage Examples
 *
 * This file demonstrates how to use the Firestore services.
 * These are example patterns, not actual tests.
 */

import {
  firestore,
  historyService,
  preferencesService,
  HistoryService,
  PreferencesService,
  UserPreferences,
} from '../firestore';
import { HistoryRecord } from '@/types';

/**
 * Example 1: Using History Service
 */
async function exampleHistoryUsage(userId: string) {
  // Get all history records
  const allHistory = await historyService.getAll(userId);
  console.log('All history:', allHistory);

  // Add a new history record
  const newRecord: HistoryRecord = {
    type: 'saju',
    data: {
      id: 'record-123',
      date: '2026-03-17',
      input: {
        gender: 'male',
        birthYear: 1990,
        birthMonth: 5,
        birthDay: 15,
        birthHour: 12,
      },
      elements: { 목: 2, 화: 1, 토: 1, 금: 0, 수: 0 },
      description: 'Your saju result...',
      luckyElement: '목',
      unluckyElement: '금',
    },
  };
  await historyService.add(userId, newRecord);

  // Get by type
  const sajuHistory = await historyService.getByType(userId, 'saju');
  console.log('Saju history:', sajuHistory);

  // Get by ID
  const record = await historyService.getById(userId, 'record-123');
  console.log('Specific record:', record);

  // Delete a record
  await historyService.delete(userId, 'record-123');

  // Clear all history
  await historyService.clear(userId);
}

/**
 * Example 2: Using Preferences Service
 */
async function examplePreferencesUsage(userId: string) {
  // Get user preferences
  const prefs = await preferencesService.get(userId);
  console.log('User preferences:', prefs);

  // Save preferences
  const newPrefs: UserPreferences = {
    mbti: 'INTJ',
    element: '목',
    birthInfo: {
      gender: 'male',
      birthYear: 1990,
      birthMonth: 5,
      birthDay: 15,
      birthHour: 12,
    },
  };
  await preferencesService.save(userId, newPrefs);
}

/**
 * Example 3: Error Handling
 */
async function exampleErrorHandling(userId: string) {
  try {
    await historyService.getAll(userId);
  } catch (error) {
    console.error('Failed to get history:', error);
    // Handle error appropriately
  }
}

/**
 * Example 4: Creating Custom Service Instances
 */
function exampleCustomInstances() {
  // Create custom service instances with specific Firestore instance
  const customHistoryService = new HistoryService(firestore);
  const customPrefsService = new PreferencesService(firestore);

  // Use as needed
  return { customHistoryService, customPrefsService };
}

/**
 * Example 5: Migration from localStorage
 */
async function exampleMigrationFromLocalStorage(userId: string) {
  // Import old storage utility
  // import { storage } from '../storage';

  // Get data from localStorage
  // const localHistory = storage.getAll();
  // const localPrefs = storage.getUserPreferences();

  // Migrate history
  // for (const record of localHistory) {
  //   await historyService.add(userId, record);
  // }

  // Migrate preferences
  // if (localPrefs) {
  //   await preferencesService.save(userId, {
  //     mbti: localPrefs.mbti as MBTIType,
  //     element: localPrefs.element as Element,
  //     birthInfo: localPrefs.birthInfo,
  //   });
  // }

  console.log('Migration complete');
}

export {
  exampleHistoryUsage,
  examplePreferencesUsage,
  exampleErrorHandling,
  exampleCustomInstances,
  exampleMigrationFromLocalStorage,
};
