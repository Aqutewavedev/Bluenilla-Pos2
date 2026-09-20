/**
 * Hardware & Peripheral Simulation Service
 * - Web Audio API POS feedback (scanner beep, cash drawer kick, warning tone)
 * - Barcode Scanner (USB HID rapid keystroke listener + Camera stream scanner)
 * - Cash Drawer Solenoid pulse simulation
 * - Thermal Receipt 80mm printer emulation
 */

// Web Audio synthesizer for crisp POS sounds
class POSAudioEngine {
  private ctx: AudioContext | null = null;

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playScanBeep() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(2100, this.ctx.currentTime); // Crisp retail scanner frequency
      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.09);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.09);
    } catch {
      // Audio might be blocked until user gesture
    }
  }

  playDrawerKick() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      // Mechanical thud + chime
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(140, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.18);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.18);
    } catch {}
  }

  playCashChime() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1046.5, this.ctx.currentTime); // C6 chime
      osc.frequency.exponentialRampToValueAtTime(1318.5, this.ctx.currentTime + 0.12); // E6
      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.35);
    } catch {}
  }

  playErrorTone() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(320, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.25);
    } catch {}
  }

  playSuccessChime() {
    this.playCashChime();
  }

  playButtonPress() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.05);
    } catch {}
  }

  playTrash() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(220, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.1);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.1);
    } catch {}
  }
}

export const posAudio = new POSAudioEngine();

/**
 * Global Keyboard Barcode Scanner Listener
 * Typical USB/Bluetooth barcode scanners act as keyboard input (HID)
 * that pumps characters in <50ms bursts ending with 'Enter'.
 */
export function initUSBBarcodeScanner(onBarcodeScanned: (barcode: string) => void) {
  let buffer = '';
  let lastKeyTime = 0;

  const handleKeyDown = (e: KeyboardEvent) => {
    // Ignore if user is typing inside an explicit input or textarea, unless it's pure rapid barcode stream
    const target = e.target as HTMLElement;
    const isInputElement = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

    const currentTime = Date.now();
    const diff = currentTime - lastKeyTime;
    lastKeyTime = currentTime;

    if (e.key === 'Enter') {
      if (buffer.length >= 6) {
        // High confidence barcode scanned
        const code = buffer;
        buffer = '';
        posAudio.playScanBeep();
        onBarcodeScanned(code);
        if (!isInputElement) {
          e.preventDefault();
        }
      } else {
        buffer = '';
      }
      return;
    }

    // Standard printable character
    if (e.key.length === 1) {
      if (diff > 120 && !isInputElement) {
        // Human typing slowly outside input - reset buffer
        buffer = e.key;
      } else {
        buffer += e.key;
      }
    }
  };

  window.addEventListener('keydown', handleKeyDown);
  return () => {
    window.removeEventListener('keydown', handleKeyDown);
  };
}

export const attachBarcodeScannerListener = initUSBBarcodeScanner;
