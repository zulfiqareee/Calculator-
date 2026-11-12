// Web Audio API Synthesis and Bengali Speech Recognition for SmartHub Tally Khata

class TallyAudioEngine {
  private ctx: AudioContext | null = null;

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  // Cash Register Coin / Bell Chime sound
  playCashChime(): void {
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      // Two bell tones (ding-ding)
      const freqs = [784, 1174.66]; // G5, D6
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);

        gain.gain.setValueAtTime(0, now + idx * 0.08);
        gain.gain.linearRampToValueAtTime(0.3, now + idx * 0.08 + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.45);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.5);
      });
    } catch {
      // Audio autoplay policy fallback
    }
  }

  // Success Confirmation Chime (C-E-G triad)
  playSuccessChime(): void {
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const notes = [523.25, 659.25, 783.99]; // C5, E5, G5

      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.06);

        gain.gain.setValueAtTime(0, now + idx * 0.06);
        gain.gain.linearRampToValueAtTime(0.25, now + idx * 0.06 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.06);
        osc.stop(now + idx * 0.06 + 0.4);
      });
    } catch {
      // Ignore audio error
    }
  }

  // Subtle UI click
  playClickSound(): void {
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(200, now + 0.04);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.05);
    } catch {
      // Ignore click error
    }
  }

  // Due Alert Sound
  playDueAlert(): void {
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const notes = [440, 392];

      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.12);

        gain.gain.setValueAtTime(0, now + idx * 0.12);
        gain.gain.linearRampToValueAtTime(0.2, now + idx * 0.12 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.3);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.12);
        osc.stop(now + idx * 0.12 + 0.35);
      });
    } catch {
      // Ignore
    }
  }
}

export const tallySounds = new TallyAudioEngine();

// Bengali Voice Recognition Engine (Speech-to-Text)
export class BengaliVoiceRecognition {
  private recognition: any = null;
  public isSupported: boolean = false;
  private isListeningActive: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        this.isSupported = true;
      }
    }
  }

  async start(
    onResult: (text: string, isFinal: boolean) => void,
    onError?: (err: any) => void,
    onEnd?: () => void
  ): Promise<void> {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      this.isSupported = false;
      if (onError) onError('not-supported');
      return;
    }

    // Request mic permission explicitly so browser prompt appears on user gesture
    if (typeof navigator !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((track) => track.stop());
      } catch (permErr: any) {
        console.warn('Microphone permission error:', permErr);
        if (permErr?.name === 'NotAllowedError' || permErr?.name === 'PermissionDeniedError') {
          if (onError) onError('not-allowed');
          return;
        }
      }
    }

    try {
      if (this.recognition) {
        try {
          this.recognition.abort();
        } catch {}
      }

      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.maxAlternatives = 1;
      this.recognition.lang = 'bn-BD';

      this.isListeningActive = true;

      this.recognition.onresult = (event: any) => {
        let interim = '';
        let final = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            final += event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }
        const text = (final || interim).trim();
        if (text) {
          onResult(text, Boolean(final));
        }
      };

      this.recognition.onerror = (err: any) => {
        const errorType = err?.error || err;
        console.warn('SpeechRecognition error:', errorType);
        // Ignore silent / non-fatal errors
        if (errorType === 'no-speech' || errorType === 'aborted') {
          return;
        }
        if (onError) onError(errorType);
      };

      this.recognition.onend = () => {
        if (this.isListeningActive) {
          if (onEnd) onEnd();
        }
      };

      this.recognition.start();
    } catch (err: any) {
      console.error('Speech recognition start failed:', err);
      if (onError) onError(err);
    }
  }

  stop(): void {
    this.isListeningActive = false;
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch {}
    }
  }
}

// Bengali Speech Synthesis (Text to Speech)
export function speakBengali(text: string): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'bn-BD';
    utterance.rate = 0.95;
    utterance.pitch = 1.0;

    // Look for a Bengali voice
    const voices = window.speechSynthesis.getVoices();
    const bnVoice = voices.find(
      (v) =>
        v.lang === 'bn-BD' ||
        v.lang === 'bn-IN' ||
        v.lang.toLowerCase().includes('bn') ||
        v.name.toLowerCase().includes('bangla') ||
        v.name.toLowerCase().includes('bengali')
    );
    if (bnVoice) utterance.voice = bnVoice;

    window.speechSynthesis.speak(utterance);
  } catch {
    // Ignore speech synthesis failures
  }
}

export interface ParsedVoiceTx {
  type: 'sale_due' | 'due_collection' | 'expense' | 'sale_cash';
  amount: number;
  note: string;
  customerNameHint?: string;
  rawTranscript: string;
}

// Convert Bengali numeric text & compound words to numbers
export function parseBengaliSpokenNumber(text: string): number {
  if (!text) return 0;

  // 1. Check for standard Bengali / English digits
  const bnToEnMap: Record<string, string> = {
    '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
    '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9',
  };
  const normalizedDigits = text.replace(/[০-৯]/g, (d) => bnToEnMap[d] || d);
  const digitMatch = normalizedDigits.match(/\d+(\.\d+)?/);
  if (digitMatch) {
    const parsed = parseFloat(digitMatch[0]);
    if (!isNaN(parsed) && parsed > 0) return parsed;
  }

  // 2. Compound Bengali Words
  const wordMap: Record<string, number> = {
    'দেড় হাজার': 1500,
    'দেড় হাজার': 1500,
    'আড়াই হাজার': 2500,
    'আড়াই হাজার': 2500,
    'এক হাজার': 1000,
    'দুই হাজার': 2000,
    'তিন হাজার': 3000,
    'চার হাজার': 4000,
    'পাঁচ হাজার': 5000,
    'ছয় হাজার': 6000,
    'ছয় হাজার': 6000,
    'সাত হাজার': 7000,
    'আট হাজার': 8000,
    'নয় হাজার': 9000,
    'নয় হাজার': 9000,
    'দশ হাজার': 10000,
    'বিশ হাজার': 20000,
    'পঞ্চাশ হাজার': 50000,
    'এক লক্ষ': 100000,
    'এক লাখ': 100000,
    'একশো': 100,
    'একশত': 100,
    'একশ': 100,
    'দুইশো': 200,
    'দুইশত': 200,
    'দুইশ': 200,
    'তিনশো': 300,
    'তিনশত': 300,
    'তিনশ': 300,
    'চারশো': 400,
    'চারশত': 400,
    'চারশ': 400,
    'পাঁচশো': 500,
    'পাঁচশত': 500,
    'পাঁচশ': 500,
    'ছয়শো': 600,
    'ছয়শো': 600,
    'সাতশো': 700,
    'সাতশত': 700,
    'সাতশ': 700,
    'আটশো': 800,
    'আটশত': 800,
    'আটশ': 800,
    'নয়শো': 900,
    'নয়শো': 900,
    'নয়শত': 900,
    'পঞ্চাশ': 50,
    'চল্লিশ': 40,
    'ত্রিশ': 30,
    'বিশ': 20,
    'দশ': 10,
    'হাজার': 1000,
  };

  for (const [phrase, val] of Object.entries(wordMap)) {
    if (text.includes(phrase)) {
      return val;
    }
  }

  return 0;
}

// Smart NLP parser for voice commands like:
// "করিম ৫০০ টাকা বাকি" -> type: 'sale_due', amount: 500, customer: 'করিম'
// "১০০০ টাকা পেলাম" -> type: 'due_collection', amount: 1000
// "চা নাস্তা খরচ ১৫০ টাকা" -> type: 'expense', amount: 150
export function parseBengaliTransactionVoice(spokenText: string): ParsedVoiceTx {
  const clean = spokenText.trim();
  const lower = clean.toLowerCase();

  // Extract amount
  const amount = parseBengaliSpokenNumber(clean);

  // Determine transaction type
  let type: ParsedVoiceTx['type'] = 'sale_due';

  if (
    lower.includes('পেলাম') ||
    lower.includes('পেয়েছি') ||
    lower.includes('পেয়েছি') ||
    lower.includes('জমা') ||
    lower.includes('আদায়') ||
    lower.includes('আদায়') ||
    lower.includes('পরিশোধ') ||
    lower.includes('দিল') ||
    lower.includes('দিলো')
  ) {
    type = 'due_collection';
  } else if (
    lower.includes('খরচ') ||
    lower.includes('নাস্তা') ||
    lower.includes('চা') ||
    lower.includes('বিল') ||
    lower.includes('ভাড়া') ||
    lower.includes('ভাড়া')
  ) {
    type = 'expense';
  } else if (lower.includes('নগদ') || lower.includes('ক্যাশ')) {
    type = 'sale_cash';
  } else if (
    lower.includes('বাকি') ||
    lower.includes('দিলাম') ||
    lower.includes('দিছি') ||
    lower.includes('দিয়েছি') ||
    lower.includes('বেচা')
  ) {
    type = 'sale_due';
  }

  // Extract customer name if mentioned at start (e.g. "করিম ৫০০ টাকা বাকি" -> "করিম")
  let customerNameHint: string | undefined;
  const words = clean.split(/\s+/);
  if (words.length >= 2) {
    const firstWord = words[0];
    const triggerWords = ['বাকি', 'দিলাম', 'পেলাম', 'খরচ', 'টাকা', 'আজকের', 'নগদ', 'মোট'];
    if (!triggerWords.includes(firstWord) && isNaN(parseBengaliSpokenNumber(firstWord))) {
      customerNameHint = firstWord.replace(/[কে|র|এর]$/, '');
    }
  }

  // Generate note
  let note = clean;
  if (customerNameHint && clean.startsWith(customerNameHint)) {
    note = clean.replace(customerNameHint, '').trim();
  }

  return {
    type,
    amount,
    note: note || (type === 'sale_due' ? 'বাকি লেনদেন' : type === 'due_collection' ? 'টাকা আদায়' : 'ভয়েস এন্ট্রি'),
    customerNameHint,
    rawTranscript: clean,
  };
}
