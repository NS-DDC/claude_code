# Firestore Service Setup Guide

## Overview

The Firestore service (`firestore.ts`) provides production-ready data persistence with offline support for user history and preferences.

## Features

- **Offline Persistence**: Automatically caches data using IndexedDB
- **Type-Safe**: Full TypeScript support with proper interfaces
- **Error Handling**: Descriptive error messages for debugging
- **Automatic Timestamps**: createdAt and updatedAt fields managed automatically
- **Service Pattern**: Clean separation of concerns with HistoryService and PreferencesService

## Prerequisites

1. **Firebase Project**: Create a project at [Firebase Console](https://console.firebase.google.com/)
2. **Firestore Database**: Enable Firestore in your Firebase project
3. **Environment Variables**: Configure Firebase credentials

## Environment Setup

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
```

## Firestore Security Rules

Configure security rules in Firebase Console:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## Firestore Indexes

For optimal query performance, create these indexes:

1. **History by createdAt**:
   - Collection: `users/{userId}/history`
   - Fields: `createdAt` (Descending)

2. **History by type and createdAt**:
   - Collection: `users/{userId}/history`
   - Fields: `type` (Ascending), `createdAt` (Descending)

Firebase will prompt you to create these indexes automatically when you first run queries.

## Usage Examples

### History Service

```typescript
import { historyService } from '@/lib/firestore';

// Get all history
const history = await historyService.getAll(userId);

// Add new record
await historyService.add(userId, {
  type: 'saju',
  data: sajuResult
});

// Get by type
const sajuHistory = await historyService.getByType(userId, 'saju');

// Get by ID
const record = await historyService.getById(userId, recordId);

// Delete record
await historyService.delete(userId, recordId);

// Clear all history
await historyService.clear(userId);
```

### Preferences Service

```typescript
import { preferencesService } from '@/lib/firestore';

// Get preferences
const prefs = await preferencesService.get(userId);

// Save preferences
await preferencesService.save(userId, {
  mbti: 'INTJ',
  element: '목',
  birthInfo: {
    gender: 'male',
    birthYear: 1990,
    birthMonth: 5,
    birthDay: 15,
    birthHour: 12
  }
});
```

### Error Handling

```typescript
try {
  const history = await historyService.getAll(userId);
} catch (error) {
  console.error('Failed to fetch history:', error);
  // Show user-friendly error message
}
```

## Data Structure

### Collection Paths

- History: `users/{userId}/history/{recordId}`
- Preferences: `users/{userId}/preferences/default`

### Document Schema

**History Record**:
```typescript
{
  type: 'saju' | 'saju-compatibility' | 'mbti' | 'fortune' | 'destiny' | 'destiny-compatibility' | 'daily-fortune',
  data: HistoryItem,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

**User Preferences**:
```typescript
{
  mbti?: MBTIType,
  element?: Element,
  birthInfo?: SajuInput,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

## Migration from localStorage

To migrate existing localStorage data to Firestore:

```typescript
import { storage } from '@/lib/storage';
import { historyService, preferencesService } from '@/lib/firestore';

async function migrateToFirestore(userId: string) {
  // Migrate history
  const localHistory = storage.getAll();
  for (const record of localHistory) {
    await historyService.add(userId, record);
  }

  // Migrate preferences
  const localPrefs = storage.getUserPreferences();
  if (localPrefs) {
    await preferencesService.save(userId, {
      mbti: localPrefs.mbti as MBTIType,
      element: localPrefs.element as Element,
      birthInfo: localPrefs.birthInfo
    });
  }
}
```

## Offline Support

The service automatically enables offline persistence using IndexedDB. Data will be:
- Cached locally for offline access
- Automatically synced when connection is restored
- Available across app restarts

**Note**: Offline persistence may fail if:
- Multiple tabs are open (only one tab can use persistence)
- Browser doesn't support IndexedDB
- Storage quota is exceeded

## Testing

See `__tests__/firestore.test.example.ts` for usage examples and patterns.

## Troubleshooting

### Build fails with Firebase error
- Ensure `.env.local` file exists with all required variables
- Check that variables start with `NEXT_PUBLIC_` prefix
- Restart development server after adding environment variables

### Permission denied errors
- Verify Firestore security rules allow user access
- Ensure user is authenticated before accessing data
- Check that userId matches authenticated user's UID

### Offline persistence warnings
- Close other tabs using the same app
- These warnings don't prevent the app from working
- Data will still be cached in memory if IndexedDB fails

## Production Considerations

1. **Authentication**: Always authenticate users before allowing Firestore access
2. **Rate Limiting**: Consider implementing rate limiting for write operations
3. **Data Validation**: Validate data on both client and server (use Firestore Rules)
4. **Monitoring**: Set up Firebase monitoring and alerts
5. **Backup**: Enable automatic Firestore backups in production
6. **Costs**: Monitor Firestore usage to avoid unexpected costs

## API Reference

See JSDoc comments in `firestore.ts` for detailed API documentation.
