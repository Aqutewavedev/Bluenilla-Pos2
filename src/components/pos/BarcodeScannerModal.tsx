import React, { useState, useEffect, useRef } from 'react';
import { Camera, Barcode, X, RefreshCw, Check, Sparkles } from 'lucide-react';
import { Product } from '../../types';
import { posAudio } from '../../services/hardware';

interface BarcodeScannerModalProps {
  products?: Product[];
  onScan?: (barcode: string) => void;
  onDetected?: (barcode: string) => void;
  onClose: () => void;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  products = [],
  onScan,
  onDetected,
  onClose
}) => {
  const handleTriggerScan = (code: string) => {
    if (onScan) onScan(code);
    if (onDetected) onDetected(code);
  };
  const [manualCode, setManualCode] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    let active = true;

    async function startCamera() {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment' }
          });
          if (active) {
            streamRef.current = stream;
            if (videoRef.current) {
              videoRef.current.srcObject = stream;
            }
            setCameraActive(true);
          } else {
            stream.getTracks().forEach(t => t.stop());
          }
        } else {
          setCameraError('Camera stream not supported in this preview frame.');
        }
      } catch (err: any) {
        setCameraError('Camera access unavailable or declined. Using instant barcode simulator.');
      }
    }

    startCamera();

    return () => {
      active = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  const handleScanCode = (code: string) => {
    posAudio.playScanBeep();
    handleTriggerScan(code);
    onClose();
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      handleScanCode(manualCode.trim());
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <Barcode className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Optical Barcode Scanner</h3>
              <p className="text-[11px] text-slate-500">Camera sensor & fast catalog lookup</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Viewport / Video viewfinder */}
        <div className="relative my-3 bg-slate-950 rounded-xl overflow-hidden aspect-4/3 flex items-center justify-center border border-slate-800">
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            muted 
            className={`w-full h-full object-cover ${cameraActive ? 'block' : 'hidden'}`}
          />

          {/* Fallback Viewfinder Graphic if camera not running */}
          {!cameraActive && (
            <div className="text-center p-4 text-slate-400">
              <Camera className="w-10 h-10 mx-auto mb-2 text-indigo-400/80 animate-pulse" />
              <p className="text-xs font-medium text-slate-300">Target Laser Active</p>
              <p className="text-[11px] text-slate-500 mt-1 max-w-xs">{cameraError || 'Align barcode in red reticle box'}</p>
            </div>
          )}

          {/* Scanner Target Reticle & Laser Line */}
          <div className="absolute inset-8 border-2 border-dashed border-indigo-400/60 rounded-lg pointer-events-none flex items-center justify-center">
            <div className="w-full h-0.5 bg-red-500 shadow-md shadow-red-500 animate-pulse" />
          </div>

          <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/60 text-[10px] text-slate-300 font-mono">
            UPC-A / EAN-13 / Code128
          </div>
        </div>

        {/* Manual Barcode Input */}
        <form onSubmit={handleManualSubmit} className="flex gap-2 mb-3">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Enter or scan SKU / UPC (e.g. 884019234101)..."
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              className="w-full py-2 pl-3 pr-8 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              autoFocus
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition"
          >
            Lookup
          </button>
        </form>

        {/* Quick Demo Scan Buttons for tester convenience */}
        <div className="flex-1 overflow-y-auto pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" />
              Quick Sample Barcodes
            </span>
            <span className="text-[10px] text-slate-400">Click to emulate scan</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {products.slice(0, 6).map(prod => (
              <button
                key={prod.id}
                onClick={() => handleScanCode(prod.barcode)}
                className="text-left p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-500/50 bg-slate-50 dark:bg-slate-800/50 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 transition group"
              >
                <div className="flex items-center gap-2">
                  <img src={prod.imageUrl} alt={prod.name} className="w-8 h-8 rounded-lg object-cover" />
                  <div className="overflow-hidden">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                      {prod.name}
                    </p>
                    <p className="text-[10px] text-slate-500 font-mono">{prod.barcode}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
