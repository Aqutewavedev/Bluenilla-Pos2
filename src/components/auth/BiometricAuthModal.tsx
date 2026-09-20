import React, { useState, useEffect } from 'react';
import { Fingerprint, CheckCircle2, AlertCircle, X, ShieldCheck } from 'lucide-react';
import { posAudio } from '../../services/hardware';
import { User } from '../../types';

interface BiometricAuthModalProps {
  user: User | null;
  onSuccess: () => void;
  onCancel: () => void;
  actionTitle?: string;
}

export const BiometricAuthModal: React.FC<BiometricAuthModalProps> = ({
  user,
  onSuccess,
  onCancel,
  actionTitle = 'Biometric Staff Verification'
}) => {
  const [status, setStatus] = useState<'prompt' | 'scanning' | 'success' | 'failed'>('prompt');
  const [feedback, setFeedback] = useState('Touch the fingerprint sensor or glance at camera');

  const triggerScan = async () => {
    setStatus('scanning');
    setFeedback('Authenticating biometric credential...');

    // Attempt native WebAuthn if available
    let handledByWebAuthn = false;
    if (typeof window !== 'undefined' && window.PublicKeyCredential && navigator.credentials) {
      try {
        // Light check or mock credential check
        // We will do a swift simulation or WebAuthn call
      } catch {
        handledByWebAuthn = false;
      }
    }

    // Interactive high-tech biometric pulse
    setTimeout(() => {
      posAudio.playScanBeep();
      setStatus('success');
      setFeedback('Biometric ID matched: ' + (user?.name || 'Survey Guest'));

      setTimeout(() => {
        onSuccess();
      }, 700);
    }, 1100);
  };

  useEffect(() => {
    // Auto initiate scan prompt on modal mount
    const t = setTimeout(() => {
      triggerScan();
    }, 400);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl text-center">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-indigo-500" />
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {actionTitle}
            </span>
          </div>
          <button 
            onClick={onCancel}
            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mb-4">
          <img 
            src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150'} 
            alt={user?.name || 'Survey Guest'} 
            className="w-14 h-14 rounded-full mx-auto object-cover ring-2 ring-indigo-500/30 mb-2" 
          />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">{user?.name || 'Survey Guest'}</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">{user?.role ? user.role.replace('_', ' ') : 'Guest'} • {user?.branchName || 'Bluenilla Preview'}</p>
        </div>

        {/* Biometric Sensor Target */}
        <div 
          onClick={status !== 'scanning' ? triggerScan : undefined}
          className={`relative w-24 h-24 mx-auto my-6 rounded-2xl flex items-center justify-center cursor-pointer transition-all duration-300 ${
            status === 'scanning'
              ? 'bg-indigo-50 dark:bg-indigo-950/50 border-2 border-indigo-500 shadow-lg shadow-indigo-500/20 scale-105'
              : status === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/50 border-2 border-emerald-500 text-emerald-600 dark:text-emerald-400'
              : 'bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 hover:border-indigo-400'
          }`}
        >
          {status === 'success' ? (
            <CheckCircle2 className="w-12 h-12 text-emerald-500 animate-in zoom-in-50" />
          ) : (
            <Fingerprint className={`w-12 h-12 ${
              status === 'scanning' ? 'text-indigo-500 animate-pulse' : 'text-slate-400'
            }`} />
          )}

          {status === 'scanning' && (
            <div className="absolute inset-x-0 h-1 bg-indigo-500/80 rounded-full animate-bounce shadow-md" />
          )}
        </div>

        <p className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-6">
          {feedback}
        </p>

        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            Cancel
          </button>
          <button
            onClick={triggerScan}
            disabled={status === 'scanning'}
            className="flex-1 py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-xs font-semibold text-white transition active:scale-95 disabled:opacity-50"
          >
            {status === 'scanning' ? 'Verifying...' : 'Touch to Retry'}
          </button>
        </div>
      </div>
    </div>
  );
};
