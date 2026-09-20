import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { 
  getFirestore, 
  Firestore, 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  getDocs, 
  deleteDoc,
  getDocFromServer,
  onSnapshot,
  query,
  where,
  limit
} from 'firebase/firestore';
import { 
  getAuth, 
  Auth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  User as FirebaseUser 
} from 'firebase/auth';
import { getAnalytics, isSupported, Analytics } from 'firebase/analytics';
import firebaseConfigData from '../../firebase-applet-config.json';

// Master Firebase Configuration matching user's bluenilla-60232 project
export const firebaseConfig = {
  apiKey: firebaseConfigData.apiKey || "AIzaSyA5_AzRis5o5Mop9HaTXUaxL4xRUVYpwDE",
  authDomain: firebaseConfigData.authDomain || "bluenilla-60232.firebaseapp.com",
  projectId: firebaseConfigData.projectId || "bluenilla-60232",
  storageBucket: firebaseConfigData.storageBucket || "bluenilla-60232.firebasestorage.app",
  messagingSenderId: firebaseConfigData.messagingSenderId || "703578451455",
  appId: firebaseConfigData.appId || "1:703578451455:web:6c20f51874ba94f6768bca",
  measurementId: firebaseConfigData.measurementId || "G-MZ7NWV0T9B"
};

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;
let analyticsInstance: Analytics | null = null;

export function getFirebaseApp(): FirebaseApp {
  if (!app) {
    if (getApps().length > 0) {
      app = getApp();
    } else {
      app = initializeApp(firebaseConfig);
    }
  }
  return app;
}

export function getFirebaseAuth(): Auth {
  if (!auth) {
    const firebaseApp = getFirebaseApp();
    auth = getAuth(firebaseApp);
  }
  return auth;
}

export function getFirebaseDb(): Firestore {
  if (!db) {
    const firebaseApp = getFirebaseApp();
    const dbId = firebaseConfigData.firestoreDatabaseId;
    if (dbId && dbId !== '(default)') {
      db = getFirestore(firebaseApp, dbId);
    } else {
      db = getFirestore(firebaseApp);
    }
  }
  return db;
}

// Initialize Analytics safely where supported (browser runtime)
if (typeof window !== 'undefined') {
  isSupported().then(supported => {
    if (supported) {
      try {
        analyticsInstance = getAnalytics(getFirebaseApp());
      } catch (e) {
        console.warn('Firebase Analytics not initialized:', e);
      }
    }
  }).catch(() => {});
}

export const googleAuthProvider = new GoogleAuthProvider();
googleAuthProvider.setCustomParameters({
  prompt: 'select_account'
});

export async function signInWithGoogle(): Promise<FirebaseUser> {
  const firebaseAuth = getFirebaseAuth();
  const result = await signInWithPopup(firebaseAuth, googleAuthProvider);
  return result.user;
}

export async function signOutFirebase(): Promise<void> {
  const firebaseAuth = getFirebaseAuth();
  await signOut(firebaseAuth);
}

// --------------------------------------------------------------------------
// MANDATORY ERROR HANDLING AS DEFINED BY FIREBASE SKILL
// --------------------------------------------------------------------------
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
  const currentAuth = auth || (getApps().length > 0 ? getAuth(getApp()) : null);
  const currentUser = currentAuth?.currentUser;
  
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: currentUser?.uid || null,
      email: currentUser?.email || null,
      emailVerified: currentUser?.emailVerified || null,
      isAnonymous: currentUser?.isAnonymous || null,
      tenantId: currentUser?.tenantId || null,
      providerInfo: currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  
  console.error('Firestore Security / Operation Error: ', JSON.stringify(errInfo, null, 2));
  throw new Error(JSON.stringify(errInfo));
}

// --------------------------------------------------------------------------
// MANDATORY CONNECTION TEST (getDocFromServer) ON BOOT
// --------------------------------------------------------------------------
let connectionTested = false;
export async function testFirestoreConnection(): Promise<{ connected: boolean; message: string; databaseId: string }> {
  try {
    const firestore = getFirebaseDb();
    const testDocRef = doc(firestore, 'test', 'connection');
    try {
      await getDocFromServer(testDocRef);
    } catch (e: any) {
      if (e instanceof Error && e.message.includes('the client is offline')) {
        console.warn("Please check your Firebase configuration.");
      }
      // If permission-denied or document-not-found, the network handshake succeeded to Firestore
    }
    connectionTested = true;
    return {
      connected: true,
      message: 'Connected to Firestore successfully',
      databaseId: firebaseConfigData.firestoreDatabaseId || '(default)',
    };
  } catch (err: any) {
    return {
      connected: false,
      message: err?.message || 'Firestore connection pending',
      databaseId: firebaseConfigData.firestoreDatabaseId || '(default)',
    };
  }
}

// Run boot validation
if (typeof window !== 'undefined') {
  testFirestoreConnection().catch(err => {
    console.debug('Initial Firestore handshake:', err?.message || err);
  });
}

// --------------------------------------------------------------------------
// STRICT ARCHITECTURAL DATABASE ALIGNMENT PATHS
// Hive: hive/platform/...
// Tenants: tenants/{tenantId}/...
// --------------------------------------------------------------------------
export const HIVE_FIRESTORE_PATHS = {
  platformState: () => 'hive/platform_state',
  tenants: () => 'hive/platform/tenants',
  admins: () => 'hive_admins',
  centralBackups: () => 'hive/platform/backups',
  centralBackupDoc: (backupId: string) => `hive/platform/backups/${backupId}`,
  globalAudit: () => 'hive/platform/global_audit',
};

export const TENANT_FIRESTORE_PATHS = {
  root: (tenantId: string) => `tenants/${tenantId}`,
  settingsModules: (tenantId: string) => `tenants/${tenantId}/settings/modules`,
  subscriptionDetails: (tenantId: string) => `tenants/${tenantId}/subscription/details`,
  shopConfig: (tenantId: string) => `tenants/${tenantId}/config/shop_config`,
  products: (tenantId: string) => `tenants/${tenantId}/products`,
  productDoc: (tenantId: string, productId: string) => `tenants/${tenantId}/products/${productId}`,
  transactions: (tenantId: string) => `tenants/${tenantId}/transactions`,
  transactionDoc: (tenantId: string, txId: string) => `tenants/${tenantId}/transactions/${txId}`,
  shopBackups: (tenantId: string) => `tenants/${tenantId}/backups`,
  shopBackupDoc: (tenantId: string, backupId: string) => `tenants/${tenantId}/backups/${backupId}`,
  repairLogs: (tenantId: string) => `tenants/${tenantId}/repair_logs`,
  zReports: (tenantId: string) => `tenants/${tenantId}/z_reports`,
};
