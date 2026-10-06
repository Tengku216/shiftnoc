import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import configFile from '../../firebase-applet-config.json';

export const FIREBASE_CONFIG = {
  projectId: configFile?.projectId || 'applied-bonsai-rjhcx',
  appId: configFile?.appId || '1:14380235524:web:33876bb8bdb0b40d4d6e51',
  apiKey: configFile?.apiKey || 'AIzaSyCKnxxNeZDUYayLyfsEsKDZoE79XCqv8rs',
  authDomain: configFile?.authDomain || 'applied-bonsai-rjhcx.firebaseapp.com',
  firestoreDatabaseId: configFile?.firestoreDatabaseId || 'ai-studio-nocshiftschedule-520de6f2-3ab4-428d-a1a4-bf58e3e51733',
  storageBucket: configFile?.storageBucket || 'applied-bonsai-rjhcx.firebasestorage.app',
  messagingSenderId: configFile?.messagingSenderId || '14380235524',
  measurementId: configFile?.measurementId || '',
  oAuthClientId: configFile?.oAuthClientId || '14380235524-ijeb3tvvsnl2s2a25sgp94ka6ri4soub.apps.googleusercontent.com',
  recaptchaSiteKey: configFile?.recaptchaSiteKey || '',
};

const app = getApps().length > 0 ? getApp() : initializeApp(FIREBASE_CONFIG);
export const db = getFirestore(app, FIREBASE_CONFIG.firestoreDatabaseId);
export const auth = getAuth(app);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
      isAnonymous: auth.currentUser?.isAnonymous || null,
      tenantId: auth.currentUser?.tenantId || null,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Test connection on boot
export async function testConnection(): Promise<void> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase connection check: client is offline or starting.');
    }
  }
}

testConnection().catch(() => {
  // connection check complete
});
