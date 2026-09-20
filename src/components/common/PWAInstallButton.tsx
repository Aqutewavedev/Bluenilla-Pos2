import React, { useState } from 'react';
import { usePWAInstall } from './usePWAInstall';
import { Download, Smartphone, QrCode } from 'lucide-react';
import { MobileInstallModal } from './MobileInstallModal';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showModal, setShowModal] = useState<boolean>(false);

  return (
    <>
      <div className="flex items-center gap-1">
        {isInstallable && (
          <button
            id="btn-pwa-install-direct"
            onClick={install}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xs transition-all active:scale-95 cursor-pointer"
            title="Install BLUENILLA as standalone desktop or mobile application"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Install App</span>
          </button>
        )}

        <button
          id="btn-open-mobile-install-modal"
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-all cursor-pointer shadow-2xs"
          title="Scan QR Code or view installation guide for Android, iPhone, and tablets"
        >
          <Smartphone className="w-3.5 h-3.5 text-indigo-500" />
          <span className="hidden lg:inline">Mobile App</span>
          <QrCode className="w-3 h-3 text-slate-400" />
        </button>
      </div>

      <MobileInstallModal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)} 
      />
    </>
  );
};

