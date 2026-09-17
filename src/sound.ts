/**
 * QuickQuiz Sound Effects Engine (Web Audio API Synthesizer)
 * Fully synthesized sound effects to avoid loading external files.
 * Custom built, lightweight, and offline-compatible.
 */

let audioCtx: AudioContext | null = null;
let isMutedState = false;

// Initialize muted state from localStorage
try {
  const savedMute = localStorage.getItem('quickquiz-muted-v1');
  if (savedMute !== null) {
    isMutedState = savedMute === 'true';
  }
} catch (e) {
  console.warn('Failed to read sound preference from localStorage:', e);
}

function getAudioContext(): AudioContext | null {
  if (isMutedState) return null;
  
  if (!audioCtx) {
    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        audioCtx = new AudioCtxClass();
      }
    } catch (e) {
      console.warn('Web Audio API is not supported in this browser/iframe context:', e);
    }
  }
  
  // Resume context if suspended (browser security policy)
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  
  return audioCtx;
}

export const soundManager = {
  isMuted(): boolean {
    return isMutedState;
  },

  setMuted(muted: boolean) {
    isMutedState = muted;
    try {
      localStorage.setItem('quickquiz-muted-v1', String(muted));
    } catch (e) {
      console.error('Failed to save sound preference:', e);
    }
  },

  toggleMute(): boolean {
    this.setMuted(!isMutedState);
    return isMutedState;
  },

  playClick() {
    const ctx = getAudioContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } catch (e) {
      // Ignore audio glitches or sandboxed context limits
    }
  },

  playTab() {
    const ctx = getAudioContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(500, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(650, ctx.currentTime + 0.1);

      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } catch (e) {}
  },

  playSuccess() {
    const ctx = getAudioContext();
    if (!ctx) return;

    try {
      const playTone = (freq: number, startDelay: number, duration: number, vol = 0.06) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + startDelay);

        gain.gain.setValueAtTime(0, ctx.currentTime + startDelay);
        gain.gain.linearRampToValueAtTime(vol, ctx.currentTime + startDelay + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startDelay + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime + startDelay);
        osc.stop(ctx.currentTime + startDelay + duration);
      };

      // Play C5 -> E5 -> G5 -> C6 arpeggio
      playTone(523.25, 0, 0.15);      // C5
      playTone(659.25, 0.06, 0.15);   // E5
      playTone(783.99, 0.12, 0.15);   // G5
      playTone(1046.50, 0.18, 0.3, 0.08); // C6
    } catch (e) {}
  },

  playError() {
    const ctx = getAudioContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(160, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(100, ctx.currentTime + 0.25);

      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);

      // Simple low pass filter to make it less harsh
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(600, ctx.currentTime);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } catch (e) {}
  },

  playCorrect() {
    const ctx = getAudioContext();
    if (!ctx) return;

    try {
      // Bright double chime: E5 -> A5 (perfect fourth up, clean and positive)
      const playTone = (freq: number, startDelay: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + startDelay);

        gain.gain.setValueAtTime(0, ctx.currentTime + startDelay);
        gain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + startDelay + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startDelay + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime + startDelay);
        osc.stop(ctx.currentTime + startDelay + duration);
      };

      playTone(659.25, 0, 0.18);   // E5
      playTone(880.00, 0.08, 0.35); // A5
    } catch (e) {}
  },

  playWrong() {
    const ctx = getAudioContext();
    if (!ctx) return;

    try {
      // Classic incorrect sound: low, slightly out of tune double buzz
      const playTone = (freq: number, startDelay: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + startDelay);

        gain.gain.setValueAtTime(0, ctx.currentTime + startDelay);
        gain.gain.linearRampToValueAtTime(0.09, ctx.currentTime + startDelay + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startDelay + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime + startDelay);
        osc.stop(ctx.currentTime + startDelay + duration);
      };

      playTone(220.00, 0, 0.2);   // A3
      playTone(185.00, 0.12, 0.3); // F#3
    } catch (e) {}
  },

  playCountdown() {
    const ctx = getAudioContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1000, ctx.currentTime);

      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.06);
    } catch (e) {}
  },

  playComplete() {
    const ctx = getAudioContext();
    if (!ctx) return;

    try {
      // Glorious triumphant fanfare arpeggio
      const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50]; // C4, E4, G4, C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const delay = idx * 0.07;
        const dur = 0.4 - idx * 0.03;
        
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
        
        gain.gain.setValueAtTime(0, ctx.currentTime + delay);
        gain.gain.linearRampToValueAtTime(0.05, ctx.currentTime + delay + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + dur);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(ctx.currentTime + delay);
        osc.stop(ctx.currentTime + delay + dur);
      });
    } catch (e) {}
  }
};
