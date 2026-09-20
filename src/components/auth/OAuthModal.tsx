import React, { useState, useEffect } from 'react';
import { Shield, CheckCircle2, Lock, X, AlertCircle, Database, LogOut, Check, Sparkles } from 'lucide-react';
import { User } from '../../types';
import { 
  getFirebaseAuth, 
  signInWithGoogle, 
  signOutFirebase, 
  firebaseConfig,
  testFirestoreConnection,
  getFirebaseDb
} from '../../services/firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';

interface OAuthModalProps {
  onSuccess: (user: Partial<User>) => void;
  onCancel: () => void;
  tenantId?: string;
}

export const OAuthModal: React.FC<OAuthModalProps> = ({ onSuccess, onCancel, tenantId = 'bluenilla-main' }) => {
  const [provider, setProvider] = useState<'google' | 'corporate'>('google');
  const [step, setStep] = useState<'select' | 'authorizing' | 'success' | 'error'>('select');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isTestingFirestore, setIsTestingFirestore] = useState(false);
  const [firestoreStatus, setFirestoreStatus] = useState<{ tested: boolean; success: boolean; msg: string }>({
    tested: false,
    success: false,
    msg: ''
  });

  useEffect(() => {
    try {
      const auth = getFirebaseAuth();
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        setFirebaseUser(user);
      });
      return () => unsubscribe();
    } catch (e) {
      console.warn('Firebase Auth state listener error:', e);
    }
  }, []);

  const handleGoogleSignIn = async () => {
    setProvider('google');
    setStep('authorizing');
    setErrorMessage('');

    try {
      const user = await signInWithGoogle();
      setFirebaseUser(user);
      setStep('success');

      // Test real Firestore write to tenant partition upon successful login
      try {
        const db = getFirebaseDb();
        const userDocRef = doc(db, 'tenants', tenantId, 'users', user.uid);
        await setDoc(userDocRef, {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          tenantId,
          lastLogin: new Date().toISOString(),
          authProvider: 'firebase_google'
        }, { merge: true });
      } catch (dbErr) {
        console.debug('Firestore sync on login note:', dbErr);
      }

      setTimeout(() => {
        onSuccess({
          id: user.uid,
          name: user.displayName || user.email || 'Authenticated User',
          email: user.email || 'authenticated@bluenilla.com',
          avatar: user.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
          lastLogin: 'Just now via Firebase Google Auth'
        });
      }, 900);
    } catch (err: any) {
      console.error('Firebase Auth error:', err);
      // If iframe blocks popup or window closed by user
      const msg = err?.message || 'Authentication failed or popup was closed.';
      setErrorMessage(msg);
      setStep('error');
    }
  };

  const handleCorporateFallback = (role: 'host' | 'owner') => {
    setProvider('corporate');
    setStep('authorizing');

    setTimeout(() => {
      setStep('success');
      setTimeout(() => {
        if (role === 'host') {
          onSuccess({
            name: 'Platform Root Host (Hive Master)',
            email: 'aqutewavedev@gmail.com',
            lastLogin: 'Just now via Enterprise SSO'
          });
        } else {
          onSuccess({
            name: 'Marcus Vance (Business Owner)',
            email: 'marcus.owner@bluenilla.com',
            lastLogin: 'Just now via Corporate SAML'
          });
        }
      }, 700);
    }, 900);
  };

  const handleSignOut = async () => {
    try {
      await signOutFirebase();
      setFirebaseUser(null);
      setFirestoreStatus({ tested: false, success: false, msg: '' });
    } catch (e: any) {
      setErrorMessage(e?.message || 'Sign out failed');
    }
  };

  const handleTestFirestore = async () => {
    setIsTestingFirestore(true);
    try {
      const res = await testFirestoreConnection();
      const db = getFirebaseDb();
      const testRef = doc(db, 'tenants', tenantId, 'config', 'health_check');
      await setDoc(testRef, {
        healthy: true,
        checkedAt: new Date().toISOString(),
        projectId: firebaseConfig.projectId
      }, { merge: true });
      const snap = await getDoc(testRef);
      
      setFirestoreStatus({
        tested: true,
        success: true,
        msg: `Connected to "${firebaseConfig.projectId}"! Test doc verified in tenants/${tenantId}/`
      });
    } catch (err: any) {
      setFirestoreStatus({
        tested: true,
        success: false,
        msg: err?.message || 'Firestore test call completed.'
      });
    } finally {
      setIsTestingFirestore(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">Firebase Authentication & Cloud DB</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Project: <span className="font-mono font-semibold text-indigo-600 dark:text-indigo-400">{firebaseConfig.projectId}</span></p>
            </div>
          </div>
          <button 
            onClick={onCancel} 
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Live Firebase User Status Banner if already logged in */}
        {firebaseUser && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              {firebaseUser.photoURL ? (
                <img src={firebaseUser.photoURL} alt="" className="w-8 h-8 rounded-full border border-emerald-400" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-xs">
                  {firebaseUser.email?.charAt(0).toUpperCase() || 'U'}
                </div>
              )}
              <div>
                <p className="text-xs font-bold text-emerald-950 dark:text-emerald-200 leading-tight">
                  {firebaseUser.displayName || 'Firebase Account'}
                </p>
                <p className="text-[10px] text-emerald-700 dark:text-emerald-400 font-mono truncate max-w-[200px]">
                  {firebaseUser.email}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => {
                  onSuccess({
                    id: firebaseUser.uid,
                    name: firebaseUser.displayName || firebaseUser.email || 'Firebase User',
                    email: firebaseUser.email || 'user@bluenilla.com',
                    avatar: firebaseUser.photoURL || undefined
                  });
                }}
                className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold rounded-lg transition"
              >
                Use Session
              </button>
              <button
                onClick={handleSignOut}
                title="Sign out of Firebase"
                className="p-1 hover:bg-emerald-200/60 dark:hover:bg-emerald-900/60 rounded-lg text-emerald-800 dark:text-emerald-300 transition"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Main Content States */}
        {step === 'select' && (
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700 dark:text-slate-200">Firebase Target:</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  {firebaseConfig.authDomain}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span>Partition Isolation:</span>
                <span className="font-mono text-slate-500">tenants/{tenantId}/* & hive/*</span>
              </div>
            </div>

            {/* Primary Action: Real Firebase Google Sign-In */}
            <button
              onClick={handleGoogleSignIn}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/60 dark:bg-indigo-950/40 hover:bg-indigo-100/80 dark:hover:bg-indigo-900/60 text-slate-900 dark:text-white text-xs font-bold transition shadow-xs cursor-pointer group"
            >
              <svg className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Sign in with Google (Firebase Auth)</span>
            </button>

            {/* Test Firestore Connection Button */}
            <button
              onClick={handleTestFirestore}
              disabled={isTestingFirestore}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-xs font-semibold transition"
            >
              <Database className={`w-3.5 h-3.5 text-amber-500 ${isTestingFirestore ? 'animate-spin' : ''}`} />
              <span>{isTestingFirestore ? 'Testing Firestore Handshake...' : 'Verify Cloud Database Connection'}</span>
            </button>

            {firestoreStatus.tested && (
              <div className={`p-2.5 rounded-xl text-xs flex items-start gap-2 ${
                firestoreStatus.success 
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                  : 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
              }`}>
                {firestoreStatus.success ? <Check className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" /> : <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />}
                <p className="leading-tight">{firestoreStatus.msg}</p>
              </div>
            )}

            {/* Developer Fast Login Fallbacks */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-2">Simulated SSO Passkeys</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleCorporateFallback('host')}
                  className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-semibold transition"
                >
                  <Shield className="w-3.5 h-3.5 text-amber-500" />
                  <span>Host SSO</span>
                </button>
                <button
                  onClick={() => handleCorporateFallback('owner')}
                  className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-semibold transition"
                >
                  <Lock className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Owner SSO</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {step === 'authorizing' && (
          <div className="py-8 text-center space-y-3">
            <div className="w-10 h-10 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
              Authenticating with Firebase ({firebaseConfig.projectId})...
            </p>
            <p className="text-[11px] text-slate-400">Exchanging credentials via secure Google Identity Services popup</p>
          </div>
        )}

        {step === 'success' && (
          <div className="py-8 text-center space-y-3 animate-in zoom-in-95">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
            <p className="text-sm font-bold text-slate-900 dark:text-white">Authentication Verified</p>
            <p className="text-xs text-slate-500">Connected to Firebase project and synchronized tenant session...</p>
          </div>
        )}

        {step === 'error' && (
          <div className="py-6 text-center space-y-3">
            <div className="p-3 rounded-full bg-rose-50 dark:bg-rose-950/50 text-rose-500 w-12 h-12 mx-auto flex items-center justify-center">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">Authentication Notice</p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">{errorMessage}</p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setStep('select')}
                className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200"
              >
                Try Again
              </button>
              <button
                onClick={() => handleCorporateFallback('owner')}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-500 shadow-xs"
              >
                Continue with Demo Session
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
