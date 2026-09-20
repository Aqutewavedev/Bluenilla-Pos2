import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { 
  Smartphone, 
  Download, 
  X, 
  Copy, 
  Check, 
  Share2, 
  Globe, 
  ShieldCheck, 
  Layers, 
  ExternalLink,
  ChevronRight,
  Terminal,
  CheckCircle2
} from 'lucide-react';
import { usePWAInstall } from './usePWAInstall';

interface MobileInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileInstallModal: React.FC<MobileInstallModalProps> = ({ isOpen, onClose }) => {
  const { isInstallable, isInstalled, install } = usePWAInstall();
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'android' | 'ios' | 'apk'>('android');

  const appUrl = typeof window !== 'undefined' ? window.location.origin : 'https://bluenilla-pos.web.app';

  useEffect(() => {
    if (isOpen) {
      QRCode.toDataURL(appUrl, {
        width: 220,
        margin: 1.5,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      })
        .then((url) => setQrCodeUrl(url))
        .catch((err) => console.error('Error generating QR code', err));
    }
  }, [isOpen, appUrl]);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(appUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 relative my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
              Install Mobile App
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Download & run BLUENILLA POS on smartphones & tablets
            </p>
          </div>
        </div>

        {/* QR Code Scan Area */}
        <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-4 border border-slate-200/80 dark:border-slate-700/80 flex flex-col sm:flex-row items-center gap-4 mb-5">
          <div className="bg-white p-2 rounded-xl shadow-xs border border-slate-200/70 shrink-0">
            {qrCodeUrl ? (
              <img src={qrCodeUrl} alt="Scan to install on mobile" className="w-28 h-28 object-contain" />
            ) : (
              <div className="w-28 h-28 flex items-center justify-center text-xs text-slate-400">
                Generating QR...
              </div>
            )}
          </div>

          <div className="flex-1 text-center sm:text-left">
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[11px] font-semibold mb-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Instant Camera Scan</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-snug mb-3">
              Point any mobile phone camera at this QR code to open the app directly on your phone or tablet.
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyLink}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/80 transition active:scale-95 shadow-2xs"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                <span>{copied ? 'Link Copied!' : 'Copy Link'}</span>
              </button>

              {isInstallable && (
                <button
                  onClick={install}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition active:scale-95 shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Install Direct</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Platform Selection Tabs */}
        <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl mb-4">
          <button
            onClick={() => setActiveTab('android')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition ${
              activeTab === 'android'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Android (Chrome)
          </button>
          <button
            onClick={() => setActiveTab('ios')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition ${
              activeTab === 'ios'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            iPhone / iPad (iOS)
          </button>
          <button
            onClick={() => setActiveTab('apk')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition ${
              activeTab === 'apk'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Native APK (Capacitor)
          </button>
        </div>

        {/* Tab Content */}
        <div className="text-xs space-y-2.5 mb-5">
          {activeTab === 'android' && (
            <div className="space-y-2">
              <div className="flex items-start gap-2.5 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 font-bold flex items-center justify-center shrink-0 text-[10px]">
                  1
                </span>
                <div>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">Open in Chrome or Samsung Internet</p>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px]">Scan the QR code above or open the shared link on your Android device.</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 font-bold flex items-center justify-center shrink-0 text-[10px]">
                  2
                </span>
                <div>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">Tap "Install" or "Add to Home Screen"</p>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px]">Chrome will display an automatic install banner, or tap the three dots (<span className="font-bold">⋮</span>) menu at top-right and choose <strong>Install app</strong>.</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 font-bold flex items-center justify-center shrink-0 text-[10px]">
                  3
                </span>
                <div>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">Launches Fullscreen with Offline Mode</p>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px]">The app gets its own app icon on the home screen and app drawer, operating offline with IndexedDB.</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'ios' && (
            <div className="space-y-2">
              <div className="flex items-start gap-2.5 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 font-bold flex items-center justify-center shrink-0 text-[10px]">
                  1
                </span>
                <div>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">Open in Safari Browser</p>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px]">Scan the QR code with your iPhone camera or open the link inside Safari.</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 font-bold flex items-center justify-center shrink-0 text-[10px]">
                  2
                </span>
                <div>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">Tap the "Share" Button</p>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px]">At the bottom toolbar in Safari, tap the square icon with an upward arrow (<Share2 className="w-3 h-3 inline mx-0.5" />).</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 font-bold flex items-center justify-center shrink-0 text-[10px]">
                  3
                </span>
                <div>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">Select "Add to Home Screen"</p>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px]">Scroll down the sheet, tap <strong>Add to Home Screen</strong>, then tap <strong>Add</strong> at top-right.</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'apk' && (
            <div className="space-y-2">
              <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 text-amber-800 dark:text-amber-200">
                <p className="font-semibold flex items-center gap-1.5 mb-1">
                  <Terminal className="w-3.5 h-3.5" />
                  <span>Native Android Package (Capacitor)</span>
                </p>
                <p className="text-[11px] leading-relaxed">
                  The project includes native Android configuration (package <code className="font-mono bg-amber-100 dark:bg-amber-900 px-1 py-0.5 rounded">com.bluenilla.pos</code> in <code className="font-mono bg-amber-100 dark:bg-amber-900 px-1 py-0.5 rounded">android/</code>).
                </p>
              </div>

              <div className="flex items-start gap-2.5 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 font-bold flex items-center justify-center shrink-0 text-[10px]">
                  1
                </span>
                <div>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">Export or Build APK</p>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px]">Open the <code className="font-mono">android</code> folder in Android Studio or compile with Gradle to produce <code className="font-mono">app-release.apk</code>.</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 font-bold flex items-center justify-center shrink-0 text-[10px]">
                  2
                </span>
                <div>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">Direct Customer Sideloading</p>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px]">Host the APK file on your server or share via WhatsApp/Google Drive. The customer taps the file to install directly onto their Android POS device.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer / Offline capability reminder */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>IndexedDB offline database supported on all phones</span>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
