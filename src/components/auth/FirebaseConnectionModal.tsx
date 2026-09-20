import React, { useState, useEffect } from 'react';
import { 
  Database, 
  ShieldCheck, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  LogOut, 
  Layers, 
  Server, 
  Store, 
  KeyRound, 
  ExternalLink,
  Copy,
  Check,
  Sparkles,
  Lock,
  ArrowRight,
  Table as TableIcon,
  HelpCircle,
  Plus
} from 'lucide-react';
import { 
  getFirebaseAuth, 
  getFirebaseDb, 
  signInWithGoogle, 
  signOutFirebase, 
  firebaseConfig, 
  testFirestoreConnection,
  TENANT_FIRESTORE_PATHS,
  HIVE_FIRESTORE_PATHS
} from '../../services/firebase';
import { 
  seedFirestoreWithInitialData, 
  SUGGESTED_FIRESTORE_RULES, 
  checkFirestoreConnectionStatus,
  CloudSeedStatus 
} from '../../services/firebaseDataService';
import { DatabaseTableViewer } from '../common/DatabaseTableViewer';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore';

interface FirebaseConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenantId: string;
}

export const FirebaseConnectionModal: React.FC<FirebaseConnectionModalProps> = ({
  isOpen,
  onClose,
  tenantId
}) => {
  const [modalTab, setModalTab] = useState<'tables' | 'cloud'>('tables');
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Firestore Seeding & Cloud Status
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState<CloudSeedStatus | null>(null);
  const [copiedRules, setCopiedRules] = useState(false);
  const [cloudDocCounts, setCloudDocCounts] = useState<{ users: number; tenants: number; products: number } | null>(null);

  // Firestore Health Test
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    status: 'idle' | 'success' | 'error';
    message: string;
    latencyMs?: number;
    path?: string;
  }>({
    status: 'idle',
    message: ''
  });

  useEffect(() => {
    try {
      const auth = getFirebaseAuth();
      const unsub = onAuthStateChanged(auth, (user) => {
        setCurrentUser(user);
      });
      return () => unsub();
    } catch (e) {
      console.warn('Firebase auth state listener error:', e);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      checkFirestoreConnectionStatus().then(res => {
        if (res.connected) {
          setCloudDocCounts({
            users: res.usersCount,
            tenants: res.tenantsCount,
            products: res.productsCount
          });
        }
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopyRules = async () => {
    try {
      await navigator.clipboard.writeText(SUGGESTED_FIRESTORE_RULES);
      setCopiedRules(true);
      setTimeout(() => setCopiedRules(false), 3000);
    } catch (e) {
      console.error('Clipboard copy error:', e);
    }
  };

  const handleSeedFirestore = async () => {
    setIsSeeding(true);
    setSeedResult(null);
    try {
      const res = await seedFirestoreWithInitialData(true);
      setSeedResult(res);
      if (res.seeded) {
        setCloudDocCounts({
          users: res.totalUsers,
          tenants: res.totalTenants,
          products: res.totalProducts
        });
      }
    } catch (err: any) {
      setSeedResult({
        seeded: false,
        totalUsers: 0,
        totalProducts: 0,
        totalTenants: 0,
        totalShifts: 0,
        timestamp: new Date().toISOString(),
        databaseId: '(default)',
        errorMessage: err?.message || 'Failed to seed Cloud Firestore',
        needsRulesPublish: true
      });
    } finally {
      setIsSeeding(false);
    }
  };

  const handleSignIn = async () => {
    setIsAuthenticating(true);
    setAuthError(null);
    try {
      const user = await signInWithGoogle();
      setCurrentUser(user);
    } catch (err: any) {
      setAuthError(err?.message || 'Failed to sign in with Google');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOutFirebase();
      setCurrentUser(null);
    } catch (err: any) {
      setAuthError(err?.message || 'Sign out failed');
    }
  };

  const runFirestoreDiagnostic = async () => {
    setIsTesting(true);
    setTestResult({ status: 'idle', message: 'Testing Firestore read/write permissions...' });
    const startTime = performance.now();

    try {
      const db = getFirebaseDb();
      const testPath = `${TENANT_FIRESTORE_PATHS.root(tenantId)}/config/connection_test`;
      const testDocRef = doc(db, 'tenants', tenantId, 'config', 'connection_test');

      // 1. Write verification token
      const token = `verify_${Date.now()}`;
      await setDoc(testDocRef, {
        token,
        testedAt: new Date().toISOString(),
        tenantId,
        projectId: firebaseConfig.projectId,
        authUid: currentUser?.uid || 'anonymous_or_host'
      });

      // 2. Read back
      const snap = await getDoc(testDocRef);
      const latency = Math.round(performance.now() - startTime);

      if (snap.exists() && snap.data().token === token) {
        setTestResult({
          status: 'success',
          message: `Firestore round-trip verified in ${latency}ms. Read & write authorized!`,
          latencyMs: latency,
          path: testPath
        });
      } else {
        setTestResult({
          status: 'error',
          message: 'Document write did not return matching verification token.'
        });
      }
    } catch (err: any) {
      console.error('Firestore test error:', err);
      setTestResult({
        status: 'error',
        message: err?.message || 'Firestore connection handshake error.'
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in">
      <div className="w-full max-w-4xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-2xl flex flex-col max-h-[92vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/60">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                Database & Cloud Firestore Center
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Project: <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{firebaseConfig.projectId}</span> &bull; DB: <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">(default)</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="flex items-center gap-2 pt-4 pb-2 border-b border-slate-100 dark:border-slate-800">
          <button
            onClick={() => setModalTab('tables')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              modalTab === 'tables'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <TableIcon className="w-4 h-4" />
            <span>Database Table View</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-500 text-white font-mono">
              Live Inspector
            </span>
          </button>

          <button
            onClick={() => setModalTab('cloud')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              modalTab === 'cloud'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Cloud Sync & Console Guide</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </button>
        </div>

        {/* Tab 1: Database Table View */}
        {modalTab === 'tables' && (
          <div className="py-4 space-y-4">
            <DatabaseTableViewer currentTenantId={tenantId} />

            {/* Quick Helper for Firebase Console Table Visibility */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-1.5">
              <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-bold">
                <HelpCircle className="w-4 h-4 text-indigo-500 shrink-0" />
                <span>Why does Firebase Console show "Your database is ready to go. Just add data"?</span>
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                Cloud Firestore does not display collection tables until at least one document is written into that collection. To see your tables appear in the Firebase Console:
                click <strong className="text-emerald-600 dark:text-emerald-400 font-bold">"Push to Cloud"</strong> above for any table, or switch to the <button onClick={() => setModalTab('cloud')} className="text-indigo-600 dark:text-indigo-400 underline font-semibold">Cloud Sync & Console Guide</button> tab to seed all tables at once.
              </p>
            </div>
          </div>
        )}

        {/* Tab 2: Cloud Firestore Config, Auth & Seeder */}
        {modalTab === 'cloud' && (
          <div className="py-4 space-y-4">
            {/* Firebase Console Explanation Banner */}
            <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/20 space-y-2">
              <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 font-bold text-xs">
                <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>About your Firebase Console Screen ("Your database is ready to go")</span>
              </div>
              <p className="text-xs text-amber-800/90 dark:text-amber-300/90 leading-relaxed">
                You are currently looking at the Cloud Firestore data explorer for <code className="font-mono font-bold">bluenilla-60232</code>. In Firestore, collection tables (like <code className="font-mono">users</code>, <code className="font-mono">products</code>, <code className="font-mono">tenants</code>) are created automatically when documents are written. 
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11px]">
                <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800">
                  <span className="font-bold block text-slate-800 dark:text-slate-200">Option 1: 1-Click Cloud Seed</span>
                  <span className="text-slate-500 dark:text-slate-400">Click the purple button below to write all partitioned tables (<code className="font-mono">users</code>, <code className="font-mono">tenants</code>, <code className="font-mono">products</code>) to Firestore.</span>
                </div>
                <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800">
                  <span className="font-bold block text-slate-800 dark:text-slate-200">Option 2: In Firebase Console</span>
                  <span className="text-slate-500 dark:text-slate-400">Click <strong className="font-mono text-indigo-600">+ Start collection</strong> in your browser tab, enter Collection ID <code className="font-mono">users</code>, add 1 field, and the table view will appear!</span>
                </div>
              </div>
            </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Auth Domain</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200 truncate block">{firebaseConfig.authDomain}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Storage Bucket</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200 truncate block">{firebaseConfig.storageBucket}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Database Target</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400 truncate block">Cloud Firestore ((default))</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Analytics Measurement</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200 truncate block">{firebaseConfig.measurementId || 'Configured'}</span>
            </div>
          </div>

          {/* Authentication Section */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-linear-to-b from-white to-slate-50 dark:from-slate-900 dark:to-slate-800/40 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-500" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Firebase Authentication
                </h3>
              </div>
              {currentUser ? (
                <span className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Authenticated
                </span>
              ) : (
                <span className="text-[11px] text-slate-400">Not Logged In</span>
              )}
            </div>

            {currentUser ? (
              <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  {currentUser.photoURL ? (
                    <img src={currentUser.photoURL} alt="" className="w-10 h-10 rounded-full border-2 border-indigo-500 object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-sm">
                      {currentUser.email?.charAt(0).toUpperCase() || 'U'}
                    </div>
                  )}
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                      {currentUser.displayName || 'Google Account'}
                    </p>
                    <p className="text-[11px] text-slate-500 font-mono">{currentUser.email}</p>
                    <p className="text-[10px] text-slate-400 font-mono">UID: {currentUser.uid.slice(0, 16)}...</p>
                  </div>
                </div>

                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-semibold text-rose-600 dark:text-rose-400 transition"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Sign in with your Google account via Firebase Authentication to authenticate POS sessions, sync tenant stores, and write secured records.
                </p>
                <button
                  onClick={handleSignIn}
                  disabled={isAuthenticating}
                  className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-slate-900 dark:text-white text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span>{isAuthenticating ? 'Opening Google Auth Popup...' : 'Sign In with Google (Firebase)'}</span>
                </button>
              </div>
            )}

            {authError && (
              <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2 border border-rose-200 dark:border-rose-800">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span className="truncate">{authError}</span>
              </div>
            )}
          </div>

          {/* Cloud Firestore Live Data Wiring & Seeder Section */}
          <div className="p-4 rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/40 dark:bg-indigo-950/20 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
                  Cloud Firestore Dynamic Data Seeder
                </h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-bold">
                User-Isolated ABAC
              </span>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Feeds and wires dynamic live data directly into Cloud Firestore. Each operator only accesses their own profile (<code className="text-indigo-600 dark:text-indigo-400">/users/{'{uid}'}</code>) and personal shift history (<code className="text-indigo-600 dark:text-indigo-400">/users/{'{uid}'}/shifts</code>). Each store catalog is strictly partitioned (<code className="text-indigo-600 dark:text-indigo-400">/tenants/{'{tenantId}'}/...</code>) with zero cross-tenant breach.
            </p>

            {cloudDocCounts && (
              <div className="grid grid-cols-3 gap-2 py-1 text-center">
                <div className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] uppercase text-slate-400 font-bold block">User Profiles</span>
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-100">{cloudDocCounts.users} docs</span>
                </div>
                <div className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] uppercase text-slate-400 font-bold block">Tenants</span>
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-100">{cloudDocCounts.tenants} stores</span>
                </div>
                <div className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] uppercase text-slate-400 font-bold block">Catalog Items</span>
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-100">{cloudDocCounts.products} items</span>
                </div>
              </div>
            )}

            <button
              onClick={handleSeedFirestore}
              disabled={isSeeding}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSeeding ? 'animate-spin' : ''}`} />
              <span>{isSeeding ? 'Writing User & Tenant Partitions to Firestore...' : 'Feed & Wire All Data into Cloud Firestore'}</span>
            </button>

            {/* Seed Result Success */}
            {seedResult?.seeded && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs border border-emerald-200 dark:border-emerald-800 space-y-1.5 animate-in fade-in">
                <div className="flex items-center gap-2 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Cloud Firestore Successfully Seeded & Live!</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  Populated {seedResult.totalUsers} isolated user accounts, {seedResult.totalProducts} store products, and {seedResult.totalTenants} tenant partitions into Firestore database <code className="font-mono">{seedResult.databaseId}</code>.
                </p>
              </div>
            )}

            {/* Seed Result or Diagnostic Permission Denied Guide */}
            {(seedResult?.needsRulesPublish || testResult.status === 'error') && (
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 text-xs border border-amber-300 dark:border-amber-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-amber-800 dark:text-amber-300">
                    <Lock className="w-4 h-4 shrink-0" />
                    <span>Action Needed in Firebase Console (Rules Tab)</span>
                  </div>
                  <button
                    onClick={handleCopyRules}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-200 dark:bg-amber-900/80 hover:bg-amber-300 dark:hover:bg-amber-800 text-amber-900 dark:text-amber-100 font-bold text-[11px] transition cursor-pointer"
                  >
                    {copiedRules ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedRules ? 'Copied!' : 'Copy Rules'}</span>
                  </button>
                </div>

                <div className="space-y-1 text-[11px] leading-relaxed text-amber-800/90 dark:text-amber-300/90">
                  <p className="font-semibold">To allow authenticated users to access their isolated data:</p>
                  <ol className="list-decimal pl-4 space-y-0.5">
                    <li>Open Firebase Console for <strong className="font-mono">bluenilla-60232</strong>.</li>
                    <li>Click the <strong className="underline">Rules</strong> tab (shown right next to <em>Data</em> in your screenshot).</li>
                    <li>Paste the rules below and click <strong className="font-bold">Publish</strong>.</li>
                    <li>Return here and click <strong className="underline">Feed & Wire All Data into Cloud Firestore</strong>.</li>
                  </ol>
                </div>

                <div className="relative">
                  <pre className="p-2.5 rounded-lg bg-slate-900 text-slate-200 font-mono text-[10px] overflow-x-auto max-h-36 leading-tight border border-slate-700">
                    {SUGGESTED_FIRESTORE_RULES}
                  </pre>
                </div>
              </div>
            )}
          </div>

          {/* Database Alignment & Diagnostic Test */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-500" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Database Alignment Structure
                </h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold">
                Partitioned
              </span>
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex items-start gap-2 p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <Server className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                <div className="text-[11px]">
                  <span className="font-bold text-slate-800 dark:text-slate-200">Hive Platform Partition: </span>
                  <code className="text-amber-600 dark:text-amber-400 font-mono">hive/platform/...</code>
                  <p className="text-[10px] text-slate-400 mt-0.5">Central fleet state, platform backups, global health metrics</p>
                </div>
              </div>

              <div className="flex items-start gap-2 p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <Store className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
                <div className="text-[11px]">
                  <span className="font-bold text-slate-800 dark:text-slate-200">Tenant Store Partition: </span>
                  <code className="text-indigo-600 dark:text-indigo-400 font-mono">tenants/{tenantId}/...</code>
                  <p className="text-[10px] text-slate-400 mt-0.5">Products, sales transactions, isolated shop backups, error aid logs</p>
                </div>
              </div>
            </div>

            {/* Diagnostic Action */}
            <div className="pt-2">
              <button
                onClick={runFirestoreDiagnostic}
                disabled={isTesting}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition shadow-2xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-indigo-500 ${isTesting ? 'animate-spin' : ''}`} />
                <span>{isTesting ? 'Running Firestore Round-Trip...' : 'Test Live Firestore Write & Read'}</span>
              </button>

              {testResult.status !== 'idle' && (
                <div className={`mt-2 p-3 rounded-xl text-xs flex items-start gap-2 border ${
                  testResult.status === 'success'
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                    : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                }`}>
                  {testResult.status === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p className="font-bold leading-tight">{testResult.message}</p>
                    {testResult.path && (
                      <p className="text-[10px] font-mono text-slate-500 mt-1">Verified at: {testResult.path}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        )}

        {/* Footer */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Firebase SDK v12.18.0</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold hover:opacity-90 transition text-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
