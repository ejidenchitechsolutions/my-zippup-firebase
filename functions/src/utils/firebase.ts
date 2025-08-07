import * as admin from 'firebase-admin';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getStorage } from 'firebase-admin/storage';

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp();
}

export const db = getFirestore();
export const auth = getAuth();
export const storage = getStorage();

// Database collections
export const collections = {
  users: 'users',
  providers: 'providers',
  services: 'services',
  bookings: 'bookings',
  marketplaceItems: 'marketplace_items',
  digitalServices: 'digital_services',
  emergencies: 'emergencies',
  wallets: 'wallets',
  transactions: 'transactions',
  reviews: 'reviews',
  tracking: 'tracking',
  notifications: 'notifications',
} as const;

// Helper functions
export const createTimestamp = () => Timestamp.now();

export const createDocument = async <T>(
  collection: string,
  id: string,
  data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>
) => {
  const now = createTimestamp();
  const docData = {
    id,
    ...data,
    createdAt: now,
    updatedAt: now,
  };
  
  await db.collection(collection).doc(id).set(docData);
  return docData;
};

export const updateDocument = async <T>(
  collection: string,
  id: string,
  data: Partial<T>
) => {
  const updateData = {
    ...data,
    updatedAt: createTimestamp(),
  };
  
  await db.collection(collection).doc(id).update(updateData);
  return updateData;
};

export const getDocument = async <T>(
  collection: string,
  id: string
): Promise<T | null> => {
  const doc = await db.collection(collection).doc(id).get();
  if (!doc.exists) {
    return null;
  }
  return doc.data() as T;
};

export const queryDocuments = async <T>(
  collection: string,
  queries: Array<{
    field: string;
    operator: FirebaseFirestore.WhereFilterOp;
    value: any;
  }> = [],
  orderBy?: { field: string; direction: 'asc' | 'desc' },
  limit?: number
): Promise<T[]> => {
  let query: FirebaseFirestore.Query = db.collection(collection);
  
  // Apply where clauses
  queries.forEach(({ field, operator, value }) => {
    query = query.where(field, operator, value);
  });
  
  // Apply ordering
  if (orderBy) {
    query = query.orderBy(orderBy.field, orderBy.direction);
  }
  
  // Apply limit
  if (limit) {
    query = query.limit(limit);
  }
  
  const snapshot = await query.get();
  return snapshot.docs.map(doc => doc.data() as T);
};

export const deleteDocument = async (collection: string, id: string) => {
  await db.collection(collection).doc(id).delete();
};

// Batch operations
export const batchWrite = () => db.batch();

// Transaction helper
export const runTransaction = async <T>(
  updateFunction: (transaction: FirebaseFirestore.Transaction) => Promise<T>
): Promise<T> => {
  return db.runTransaction(updateFunction);
};

// Custom claims helper
export const setCustomClaims = async (uid: string, claims: object) => {
  await auth.setCustomUserClaims(uid, claims);
};

// FCM helper
export const sendNotification = async (
  token: string,
  notification: {
    title: string;
    body: string;
  },
  data?: { [key: string]: string }
) => {
  const message = {
    token,
    notification,
    data,
    android: {
      priority: 'high' as const,
    },
    apns: {
      headers: {
        'apns-priority': '10',
      },
    },
  };
  
  return admin.messaging().send(message);
};