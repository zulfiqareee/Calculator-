import { GoogleGenAI } from '@google/genai';
import {
  VideoProject,
  VideoScript,
  VideoScene,
  VideoMetadataSEO,
  VideoLanguage,
  VideoFormat,
  VideoStyle,
  VideoDurationSec,
} from '../types/videoStudio';
import { getVideoStudioSettings } from './videoStudioStorage';

// ==========================================
// 1. Gemini AI Script Generation
// ==========================================
export async function generateAiVideoScript(
  topic: string,
  language: VideoLanguage,
  format: VideoFormat,
  durationSec: VideoDurationSec,
  style: VideoStyle,
  customInstructions?: string
): Promise<VideoScript> {
  const isBn = language === 'bn';
  const settings = getVideoStudioSettings();

  // Determine approximate scene count
  const sceneCount = durationSec <= 15 ? 2 : durationSec <= 30 ? 3 : durationSec <= 60 ? 5 : durationSec <= 90 ? 7 : 9;
  const sceneDuration = Math.round(durationSec / sceneCount);

  // Attempt using Gemini API
  const apiKey = settings.geminiApiKey || process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;

  if (apiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `You are a professional video director, scriptwriter, and viral content strategist.
Create a high-retention video script for YouTube Shorts / Facebook Reels or Landscape video.

Video Topic: "${topic}"
Target Language: ${isBn ? 'Bengali (বাংলা)' : 'English'}
Video Duration: ${durationSec} seconds
Video Style: ${style}
Format: ${format === 'shorts' ? 'Vertical 9:16 (Shorts/Reels)' : 'Landscape 16:9'}
Number of Scenes: ${sceneCount}
Custom Instructions: ${customInstructions || 'Make it engaging, informative, and viral.'}

Return a STRICT JSON object without markdown formatting:
{
  "topic": "${topic}",
  "hookOpening": "A punchy first 3-second hook in ${isBn ? 'Bengali' : 'English'}",
  "scenes": [
    {
      "sceneNumber": 1,
      "durationSec": ${sceneDuration},
      "narrationText": "Voice narration for scene in ${isBn ? 'Bengali' : 'English'}",
      "visualDescription": "Detailed visual description of what appears on screen",
      "imagePrompt": "Photorealistic prompt to generate image for this scene",
      "transitionType": "fade",
      "cameraMotion": "zoom_in"
    }
  ],
  "closingStatement": "Closing thought in ${isBn ? 'Bengali' : 'English'}",
  "callToAction": "Call to action (e.g. Subscribe / Follow) in ${isBn ? 'Bengali' : 'English'}",
  "sourcesAndReferences": ["WHO/Scientific Reference if applicable"],
  "totalEstimatedSeconds": ${durationSec}
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.7,
        },
      });

      const text = response.text?.trim() || '';
      const cleanJson = text.replace(/^```json/i, '').replace(/```$/i, '').trim();
      const parsed = JSON.parse(cleanJson);

      if (parsed && Array.isArray(parsed.scenes)) {
        return {
          topic: parsed.topic || topic,
          hookOpening: parsed.hookOpening || (isBn ? 'আপনি কি জানেন?' : 'Did you know?'),
          scenes: parsed.scenes.map((s: any, idx: number) => ({
            id: `scene-${Date.now()}-${idx}`,
            sceneNumber: idx + 1,
            durationSec: s.durationSec || sceneDuration,
            narrationText: s.narrationText || '',
            visualDescription: s.visualDescription || '',
            imagePrompt: s.imagePrompt || `${topic} scene ${idx + 1}, cinematic lighting, 4k`,
            transitionType: s.transitionType || (idx % 2 === 0 ? 'fade' : 'zoom'),
            cameraMotion: s.cameraMotion || (idx % 2 === 0 ? 'zoom_in' : 'pan_right'),
          })),
          closingStatement: parsed.closingStatement || (isBn ? 'ধন্যবাদ আমাদের সাথে থাকার জন্য।' : 'Thank you for watching.'),
          callToAction: parsed.callToAction || (isBn ? 'নতুন তথ্যের জন্য এখনই সাবস্ক্রাইব ও ফলো করুন!' : 'Subscribe and follow for more!'),
          sourcesAndReferences: parsed.sourcesAndReferences || [],
          totalEstimatedSeconds: durationSec,
        };
      }
    } catch (err) {
      console.warn('Gemini script generation error, falling back to smart local template:', err);
    }
  }

  // Smart Offline Fallback Script Generator
  return createSmartOfflineScript(topic, language, durationSec, sceneCount, sceneDuration, style);
}

function createSmartOfflineScript(
  topic: string,
  language: VideoLanguage,
  durationSec: VideoDurationSec,
  sceneCount: number,
  sceneDuration: number,
  style: VideoStyle
): VideoScript {
  const isBn = language === 'bn';

  const defaultHooks = {
    bn: [
      `আপনি কি জানেন ${topic} সম্পর্কে এই অজানা সত্যটি?`,
      `${topic} সম্পর্কে যা আজ পর্যন্ত কেউ আপনাকে বলেনি!`,
      `মাত্র ১ মিনিটে জেনে নিন ${topic} এর আসল রহস্য!`,
    ],
    en: [
      `Did you know this mind-blowing fact about ${topic}?`,
      `Here is the untold truth about ${topic} you never heard!`,
      `In just 60 seconds, uncover the real secret of ${topic}!`,
    ],
  };

  const hook = isBn ? defaultHooks.bn[0] : defaultHooks.en[0];

  const scenes: VideoScene[] = [];
  for (let i = 0; i < sceneCount; i++) {
    scenes.push({
      id: `scene-fallback-${i + 1}`,
      sceneNumber: i + 1,
      durationSec: sceneDuration,
      narrationText: isBn
        ? `দৃশ্য ${i + 1}: ${topic} অত্যন্ত গুরুত্বপূর্ণ একটি বিষয়। এটি আমাদের দৈনন্দিন জীবনে বিশেষ ভূমিকা রাখে এবং এর সঠিক উপলব্ধি আমাদের সচেতন করে তোলে।`
        : `Scene ${i + 1}: ${topic} is an essential topic. Understanding its core impact empowers our knowledge and daily decisions.`,
      visualDescription: isBn
        ? `${topic} এর দৃশ্যপট ${i + 1}, বিষয়বস্তুর বাস্তবসম্মত উপস্থাপন এবং স্পষ্ট ভিজ্যুয়াল চিত্রণ।`
        : `Visual depiction of ${topic} scene ${i + 1}, cinematic dynamic composition.`,
      imagePrompt: `${topic}, cinematic scene ${i + 1}, ${style} style, dramatic lighting, high detail, 8k resolution`,
      transitionType: i === 0 ? 'fade' : i % 2 === 0 ? 'zoom' : 'slide',
      cameraMotion: i % 2 === 0 ? 'zoom_in' : 'pan_left',
    });
  }

  return {
    topic,
    hookOpening: hook,
    scenes,
    closingStatement: isBn
      ? `আশা করি ${topic} সম্পর্কিত তথ্যগুলো আপনাদের উপকারে আসবে।`
      : `We hope this insight on ${topic} was valuable to you.`,
    callToAction: isBn
      ? 'পরবর্তী আকর্ষণীয় ভিডিও দেখতে এখনই লাইক, শেয়ার এবং চ্যানেলটি সাবস্ক্রাইব করুন!'
      : 'Like, share and subscribe to our channel for more amazing daily videos!',
    sourcesAndReferences: [isBn ? 'বিশ্বস্ত তথ্যকোষ ও আধুনিক গবেষণা' : 'Verified Knowledge Repository'],
    totalEstimatedSeconds: durationSec,
  };
}

// ==========================================
// 2. Gemini AI SEO Metadata Generation
// ==========================================
export async function generateAiVideoSEO(
  topic: string,
  scriptText: string,
  language: VideoLanguage
): Promise<VideoMetadataSEO> {
  const isBn = language === 'bn';
  const settings = getVideoStudioSettings();
  const apiKey = settings.geminiApiKey || process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;

  if (apiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `You are an expert Social Media & YouTube SEO Strategist.
Generate high-CTR, SEO-optimized metadata for both YouTube and Facebook for this video.

Topic: "${topic}"
Script Excerpt: "${scriptText.slice(0, 500)}"
Language: ${isBn ? 'Bengali (বাংলা)' : 'English'}

Return a STRICT JSON object:
{
  "youtube": {
    "title": "Engaging click-worthy title (under 70 chars) in ${isBn ? 'Bengali' : 'English'}",
    "description": "Rich keyword-optimized description with timestamps and summary",
    "tags": ["tag1", "tag2", "tag3", "tag4", "tag5", "tag6"],
    "keywords": ["keyword1", "keyword2", "keyword3"],
    "hashtags": ["#Tag1", "#Tag2", "#Tag3", "#Shorts"],
    "suggestedCategory": "Education",
    "thumbnailText": "Bold 3-4 word thumbnail hook",
    "pinnedComment": "Friendly engaging pinned comment"
  },
  "facebook": {
    "caption": "Viral Reel caption with emoji hook in ${isBn ? 'Bengali' : 'English'}",
    "description": "Short engaging description for Facebook post",
    "hashtags": ["#Reels", "#Viral", "#${topic.replace(/\\s+/g, '')}"],
    "hookSentence": "First striking sentence to catch viewers in 1 second",
    "callToAction": "Drop a comment with your opinion & follow our Page!"
  }
}`;

      const res = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.7,
        },
      });

      const parsed = JSON.parse(res.text?.replace(/^```json/i, '').replace(/```$/i, '').trim() || '{}');
      if (parsed.youtube && parsed.facebook) {
        return parsed as VideoMetadataSEO;
      }
    } catch (e) {
      console.warn('Gemini SEO generator error, using smart fallback:', e);
    }
  }

  // Smart Fallback SEO
  const cleanTag = topic.replace(/[^a-zA-Z0-9\u0980-\u09FF]/g, '');
  return {
    youtube: {
      title: isBn ? `${topic} — অজানা সত্য ও বিস্তারিত তথ্য` : `${topic} — The Untold Truth & Facts`,
      description: isBn
        ? `আজকের ভিডিওতে জানুন ${topic} সম্পর্কে চমৎকার সব তথ্য। সম্পূর্ণ ভিডিওটি দেখুন এবং আপনার মতামত জানান।\n\n📌 টাইমস্ট্যাম্পস:\n0:00 ভূমিকা ও সূচনা\n0:30 মূল তথ্য\n1:00 উপসংহার\n\n#${cleanTag} #SmartHub #Shorts #বাংলা`
        : `In this video, discover everything you need to know about ${topic}.\n\n📌 Timestamps:\n0:00 Introduction\n0:30 Key Facts\n1:00 Conclusion\n\n#${cleanTag} #SmartHub #Shorts #Trending`,
      tags: [cleanTag, topic, isBn ? 'বাংলা টিউটোরিয়াল' : 'Guide', 'SmartHub', 'Facts', 'Viral'],
      keywords: [topic, `${topic} facts`, `${topic} guide`],
      hashtags: [`#${cleanTag}`, '#Shorts', '#Viral', '#SmartHub'],
      suggestedCategory: 'Education',
      thumbnailText: isBn ? `${topic} আসল রহস্য!` : `${topic} Real Truth!`,
      pinnedComment: isBn ? 'আপনার মন্তব্য নিচে কমেন্ট করে জানান এবং বন্ধুদের সাথে শেয়ার করুন!' : 'What are your thoughts on this? Leave a comment below!',
    },
    facebook: {
      caption: isBn ? `🔥 ${topic} সম্পর্কে এই তথ্যটি কি আপনার জানা ছিল? দেখুন এবং শেয়ার করুন!` : `🔥 Did you know this about ${topic}? Watch now!`,
      description: isBn ? `${topic} এর বিস্তারিত ব্যাখ্যা ও গুরুত্বপূর্ণ তথ্যচিত্র।` : `Detailed insights and breakdown of ${topic}.`,
      hashtags: [`#${cleanTag}`, '#Reels', '#Viral', '#FacebookReels'],
      hookSentence: isBn ? `${topic} এর এমন কিছু যা আপনি আগে শোনেননি!` : `Something about ${topic} you never heard before!`,
      callToAction: isBn ? 'ভিডিওটি ভালো লাগলে পেজটি ফলো করুন!' : 'Follow our page for daily updates!',
    },
  };
}

// ==========================================
// 3. Procedural Background Music Generator (100% Royalty Free Web Audio)
// ==========================================
export function createSynthesizedMusicBuffer(
  audioCtx: AudioContext,
  trackType: string,
  durationSec: number
): AudioBuffer {
  const sampleRate = audioCtx.sampleRate;
  const numSamples = Math.floor(sampleRate * durationSec);
  const buffer = audioCtx.createBuffer(2, numSamples, sampleRate);
  const left = buffer.getChannelData(0);
  const right = buffer.getChannelData(1);

  if (trackType === 'silence') {
    return buffer;
  }

  // Chord progression definitions
  let chordFreqs: number[][];
  if (trackType === 'spiritual') {
    // D Minor / Hijaz spiritual ambient
    chordFreqs = [
      [146.83, 220.0, 293.66, 440.0],
      [130.81, 196.0, 261.63, 392.0],
      [116.54, 174.61, 233.08, 349.23],
      [146.83, 220.0, 293.66, 440.0],
    ];
  } else if (trackType === 'motivational') {
    // C Major energetic driving progression
    chordFreqs = [
      [130.81, 164.81, 196.0, 261.63],
      [174.61, 220.0, 261.63, 349.23],
      [146.83, 174.61, 220.0, 293.66],
      [196.0, 246.94, 293.66, 392.0],
    ];
  } else {
    // Cinematic Ambient pad progression
    chordFreqs = [
      [110.0, 164.81, 220.0, 329.63],
      [98.0, 146.83, 196.0, 293.66],
      [87.31, 130.81, 174.61, 261.63],
      [110.0, 164.81, 220.0, 329.63],
    ];
  }

  const chordDuration = 4.0; // 4 seconds per chord

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const chordIndex = Math.floor(t / chordDuration) % chordFreqs.length;
    const currentChord = chordFreqs[chordIndex];
    const chordPhase = (t % chordDuration) / chordDuration;
    const envelope = Math.sin(Math.PI * chordPhase); // smooth swell

    let sampleL = 0;
    let sampleR = 0;

    for (let c = 0; c < currentChord.length; c++) {
      const f = currentChord[c];
      const sine = Math.sin(2 * Math.PI * f * t);
      const overtone = Math.sin(2 * Math.PI * f * 2 * t) * 0.25;
      const val = (sine + overtone) * envelope * 0.08;

      // Slight stereo spread
      sampleL += val * (c % 2 === 0 ? 0.9 : 0.6);
      sampleR += val * (c % 2 === 0 ? 0.6 : 0.9);
    }

    left[i] = sampleL;
    right[i] = sampleR;
  }

  return buffer;
}

// ==========================================
// 4. Voice Audio Generator (Gemini 3.8 Flash Lite TTS + Web Speech Engine)
// ==========================================
let currentAudioElement: HTMLAudioElement | null = null;

export async function generateSpeechAudio(
  text: string,
  lang: VideoLanguage,
  gender: 'male' | 'female'
): Promise<string | null> {
  const settings = getVideoStudioSettings();
  const apiKey = settings.geminiApiKey || process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash-lite-tts',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: text.slice(0, 350),
              speechMetadata: {
                style: 'Clear, engaging, professional narrator',
              },
            },
          ],
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: gender === 'female' ? 'Kore' : 'Puck',
            },
          },
        },
      },
    });

    const base64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64) {
      return base64;
    }
  } catch (err) {
    console.warn('Gemini TTS attempt:', err);
  }
  return null;
}

export function playProceduralTone(freq = 440, duration = 0.3): void {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.5, ctx.currentTime + duration * 0.5);
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (e) {}
}

export async function playSceneVoicePreview(
  text: string,
  lang: VideoLanguage,
  gender: 'male' | 'female',
  rate: number = 1.0,
  audioBase64?: string,
  onEnd?: () => void
): Promise<boolean> {
  stopVoicePlayback();

  // Layer 1: Check if audioBase64 exists or generate via Gemini TTS
  let wavData = audioBase64;
  if (!wavData) {
    try {
      wavData = (await generateSpeechAudio(text, lang, gender)) || undefined;
    } catch (e) {}
  }

  if (wavData) {
    try {
      const audio = new Audio(`data:audio/wav;base64,${wavData}`);
      currentAudioElement = audio;
      audio.playbackRate = rate;
      audio.onended = () => {
        currentAudioElement = null;
        onEnd?.();
      };
      audio.onerror = () => {
        currentAudioElement = null;
        onEnd?.();
      };
      await audio.play();
      return true;
    } catch (e) {
      console.warn('Direct WAV audio playback fallback to Web Speech:', e);
    }
  }

  // Layer 2: Web Speech Synthesis with voice unblocking
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = rate;
      utterance.pitch = gender === 'female' ? 1.15 : 0.95;

      let voices = window.speechSynthesis.getVoices();
      if (voices.length === 0) {
        await new Promise<void>((res) => {
          const timeout = setTimeout(res, 250);
          window.speechSynthesis.onvoiceschanged = () => {
            clearTimeout(timeout);
            res();
          };
        });
        voices = window.speechSynthesis.getVoices();
      }

      const targetCode = lang === 'bn' ? 'bn' : 'en';
      const matchedVoice = voices.find((v) => v.lang.toLowerCase().startsWith(targetCode));

      if (matchedVoice) {
        utterance.voice = matchedVoice;
        utterance.lang = matchedVoice.lang;
      } else {
        // Crucial: If Bengali voice pack is not installed on device, DO NOT set utterance.lang = 'bn-BD'!
        // Chromium drops it with 'language-unavailable'.
        // Instead, leave default or use first available voice so device sounds aloud!
        if (voices.length > 0) {
          utterance.voice = voices[0];
        }
      }

      utterance.onend = () => onEnd?.();
      utterance.onerror = (e) => {
        console.warn('SpeechSynthesis error, playing procedural tone:', e);
        playProceduralTone(523.25, 0.4);
        onEnd?.();
      };

      window.speechSynthesis.speak(utterance);
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
      return true;
    } catch (err) {
      console.warn('SpeechSynthesis caught error:', err);
    }
  }

  // Layer 3: Audio Tone Fallback so user always receives audible feedback
  playProceduralTone(440, 0.5);
  setTimeout(() => onEnd?.(), 1000);
  return true;
}

export function stopVoicePlayback(): void {
  if (currentAudioElement) {
    try {
      currentAudioElement.pause();
      currentAudioElement.currentTime = 0;
    } catch (e) {}
    currentAudioElement = null;
  }
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch (e) {}
  }
}

// ==========================================
// 5. Procedural Thematic Visual Scene Generator
// ==========================================
export function generateProceduralSceneVisual(
  scene: VideoScene,
  topic: string,
  style: VideoStyle,
  format: VideoFormat,
  index: number
): string {
  const isShorts = format === 'shorts';
  const width = isShorts ? 720 : 1280;
  const height = isShorts ? 1280 : 720;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Background gradient based on style and scene index
  const palettes: Record<VideoStyle, string[][]> = {
    cinematic: [
      ['#0B132B', '#1C2541', '#3A506B'],
      ['#03071E', '#370617', '#6A040F'],
      ['#14213D', '#000000', '#FCA311'],
    ],
    islamic: [
      ['#062C22', '#0A4A3B', '#13755C'],
      ['#0B1B3D', '#112F5E', '#1D4E89'],
      ['#2A1B0E', '#5C381E', '#9E6B38'],
    ],
    tech: [
      ['#050814', '#0A1838', '#10376B'],
      ['#0B032D', '#2B0B5E', '#5B159E'],
      ['#001220', '#003666', '#006494'],
    ],
    motivational: [
      ['#1F1A3A', '#412B6B', '#7A3B9E'],
      ['#26110D', '#5E2015', '#A6361C'],
      ['#0E2A1E', '#1B543B', '#2C8C61'],
    ],
    educational: [
      ['#0F172A', '#1E293B', '#334155'],
      ['#0C2340', '#1D4ED8', '#3B82F6'],
      ['#14532D', '#15803D', '#22C55E'],
    ],
    health: [
      ['#071B35', '#112B48', '#153D55'],
      ['#042F2E', '#115E59', '#14B8A6'],
      ['#1E1B4B', '#3730A3', '#6366F1'],
    ],
    documentary: [
      ['#1C1917', '#292524', '#44403C'],
      ['#18181B', '#27272A', '#3F3F46'],
      ['#1E293B', '#0F172A', '#020617'],
    ],
    realistic: [
      ['#0A0F1D', '#1B2438', '#2D3B58'],
      ['#171923', '#2D3748', '#4A5568'],
      ['#0F172A', '#1E293B', '#334155'],
    ],
  };

  const stylePalettes = palettes[style] || palettes.cinematic;
  const chosenColors = stylePalettes[index % stylePalettes.length];

  const grad = ctx.createLinearGradient(0, 0, width, height);
  grad.addColorStop(0, chosenColors[0]);
  grad.addColorStop(0.5, chosenColors[1]);
  grad.addColorStop(1, chosenColors[2]);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  // Geometric & ambient particle art
  ctx.save();
  ctx.globalAlpha = 0.15;
  for (let i = 0; i < 8; i++) {
    const radius = 80 + i * 45;
    ctx.beginPath();
    ctx.arc(
      (width / 2) + Math.cos(i + index) * 120,
      (height / 2) + Math.sin(i + index) * 140,
      radius,
      0,
      Math.PI * 2
    );
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  ctx.restore();

  // Subtle dark vignette for high contrast
  const vignette = ctx.createRadialGradient(
    width / 2,
    height / 2,
    width * 0.2,
    width / 2,
    height / 2,
    width * 0.75
  );
  vignette.addColorStop(0, 'rgba(0,0,0,0)');
  vignette.addColorStop(1, 'rgba(0,0,0,0.65)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, width, height);

  // Scene Number & Topic Badge Card
  ctx.save();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
  ctx.lineWidth = 1.5;
  const badgeW = width * 0.75;
  const badgeH = 70;
  const badgeX = (width - badgeW) / 2;
  const badgeY = height * 0.25;
  
  // Rounded rect
  ctx.beginPath();
  ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 20);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#69DCC0';
  ctx.font = 'bold 22px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`SCENE ${scene.sceneNumber} • ${style.toUpperCase()}`, width / 2, badgeY + 42);

  // Visual description overlay in center
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 28px system-ui, -apple-system, sans-serif';
  ctx.fillText(topic.slice(0, 32), width / 2, height * 0.42);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
  ctx.font = '16px system-ui, -apple-system, sans-serif';
  ctx.fillText(scene.visualDescription.slice(0, 60), width / 2, height * 0.47);
  ctx.restore();

  return canvas.toDataURL('image/jpeg', 0.85);
}

// ==========================================
// 6. Complete Real Video Rendering Engine (MediaRecorder -> MP4/WebM)
// ==========================================
export async function renderVideoToBlob(
  project: VideoProject,
  onProgress?: (percent: number, stage: string) => void
): Promise<{ blob: Blob; url: string; sizeMb: number }> {
  return new Promise(async (resolve, reject) => {
    try {
      const isShorts = project.format === 'shorts';
      const width = isShorts ? 720 : 1280;
      const height = isShorts ? 1280 : 720;
      const fps = 30;

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas 2D context unavailable.');

      onProgress?.(5, 'ভিজ্যুয়াল সিন প্রস্তুত করা হচ্ছে...');

      // Prepare scene images (procedural or provided)
      const sceneImages: HTMLImageElement[] = [];
      for (let i = 0; i < project.script.scenes.length; i++) {
        const scene = project.script.scenes[i];
        const dataUrl =
          scene.visualImageUrl ||
          generateProceduralSceneVisual(scene, project.title, project.style, project.format, i);
        
        const img = new Image();
        img.src = dataUrl;
        await new Promise((res) => {
          img.onload = res;
          img.onerror = res; // continue on error
        });
        sceneImages.push(img);
      }

      onProgress?.(20, 'অডিও ট্র্যাক ও ব্যাকগ্রাউন্ড মিউজিক কম্পোজ করা হচ্ছে...');

      // Setup Web Audio Context & Synthesizer
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioCtx();
      if (audioCtx.state === 'suspended') {
        try {
          await audioCtx.resume();
        } catch (e) {}
      }
      const audioDest = audioCtx.createMediaStreamDestination();

      // Total duration: optimize scene durations for crisp mobile video render (3-5s per scene)
      const sceneRenderDurations = project.script.scenes.map((s) => Math.min(s.durationSec, 5));
      const totalSec = sceneRenderDurations.reduce((acc, d) => acc + d, 0);

      // Play synthesized background music
      if (project.bgMusicVolume > 0 && project.bgMusicTrack !== 'silence') {
        try {
          const musicBuffer = createSynthesizedMusicBuffer(audioCtx, project.bgMusicTrack, totalSec);
          const musicSource = audioCtx.createBufferSource();
          musicSource.buffer = musicBuffer;

          const musicGain = audioCtx.createGain();
          musicGain.gain.value = project.bgMusicVolume * 0.35; // balanced volume
          musicSource.connect(musicGain);
          musicGain.connect(audioDest);
          musicSource.start(0);
        } catch (e) {
          console.warn('Background music synth note:', e);
        }
      }

      // Stream from Canvas + Audio Destination
      const canvasStream = canvas.captureStream(fps);
      const audioTracks = audioDest.stream.getAudioTracks();
      const combinedTracks = [
        ...canvasStream.getVideoTracks(),
        ...(audioTracks.length > 0 ? audioTracks : []),
      ];
      const combinedStream = new MediaStream(combinedTracks);

      // MediaRecorder options
      const mimeTypes = [
        'video/mp4;codecs=avc1',
        'video/mp4',
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp8,opus',
        'video/webm;codecs=h264',
        'video/webm',
      ];
      let selectedMime = '';
      for (const m of mimeTypes) {
        try {
          if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(m)) {
            selectedMime = m;
            break;
          }
        } catch (e) {}
      }

      const mediaRecorderOptions: MediaRecorderOptions = {};
      if (selectedMime) {
        mediaRecorderOptions.mimeType = selectedMime;
      }
      try {
        mediaRecorderOptions.videoBitsPerSecond = 2000000;
      } catch (e) {}

      const mediaRecorder = new MediaRecorder(combinedStream, mediaRecorderOptions);

      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };

      mediaRecorder.onerror = (e) => {
        console.error('MediaRecorder error:', e);
        reject(new Error('MediaRecorder recording failed on device.'));
      };

      mediaRecorder.onstop = () => {
        const finalType = selectedMime.includes('mp4') ? 'video/mp4' : 'video/webm';
        const blob = new Blob(chunks, { type: finalType });
        const url = URL.createObjectURL(blob);
        const sizeMb = Math.round((blob.size / (1024 * 1024)) * 10) / 10;
        audioCtx.close().catch(() => {});
        onProgress?.(100, 'ভিডিও রেন্ডারিং সম্পন্ন হয়েছে!');
        resolve({ blob, url, sizeMb });
      };

      mediaRecorder.start(100);

      onProgress?.(30, 'ভিডিও ফ্রেম অ্যানিমেশন ও সাবটাইটেল সিঙ্ক হচ্ছে...');

      // Render Loop scene by scene
      const totalFrames = totalSec * fps;
      let currentFrame = 0;

      for (let sIdx = 0; sIdx < project.script.scenes.length; sIdx++) {
        const scene = project.script.scenes[sIdx];
        const sceneDurationSec = sceneRenderDurations[sIdx];
        const sceneFrames = sceneDurationSec * fps;
        const img = sceneImages[sIdx];

        for (let f = 0; f < sceneFrames; f++) {
          const progressInScene = f / sceneFrames;
          const globalProgress = (currentFrame / totalFrames) * 70 + 30; // 30% to 100%

          if (f % 15 === 0) {
            onProgress?.(Math.min(98, Math.round(globalProgress)), `রেন্ডারিং ফ্রেম: ${currentFrame}/${totalFrames}...`);
          }

          // 1. Draw animated visual with Ken Burns Motion
          ctx.save();
          let scale = 1.0;
          let panX = 0;
          let panY = 0;

          if (scene.cameraMotion === 'zoom_in') {
            scale = 1.0 + progressInScene * 0.15; // 1.0 to 1.15
          } else if (scene.cameraMotion === 'zoom_out') {
            scale = 1.15 - progressInScene * 0.15;
          } else if (scene.cameraMotion === 'pan_left') {
            scale = 1.1;
            panX = -progressInScene * 30;
          } else if (scene.cameraMotion === 'pan_right') {
            scale = 1.1;
            panX = progressInScene * 30;
          } else {
            scale = 1.05 + Math.sin(progressInScene * Math.PI) * 0.05;
          }

          ctx.translate(width / 2 + panX, height / 2 + panY);
          ctx.scale(scale, scale);
          ctx.drawImage(img, -width / 2, -height / 2, width, height);
          ctx.restore();

          // 2. Scene Cross-Dissolve Transition (first and last 8 frames)
          if (f < 8 && sIdx > 0) {
            ctx.fillStyle = `rgba(0, 0, 0, ${1 - f / 8})`;
            ctx.fillRect(0, 0, width, height);
          } else if (f > sceneFrames - 8 && sIdx < project.script.scenes.length - 1) {
            ctx.fillStyle = `rgba(0, 0, 0, ${(f - (sceneFrames - 8)) / 8})`;
            ctx.fillRect(0, 0, width, height);
          }

          // 3. Subtitles overlay
          if (project.subtitleEnabled && scene.narrationText) {
            ctx.save();
            const fontSize = isShorts ? 28 : 32;
            ctx.font = `bold ${fontSize}px system-ui, -apple-system, sans-serif`;
            ctx.textAlign = 'center';

            const subY = isShorts ? height * 0.78 : height * 0.85;
            const text = scene.narrationText;

            // Draw subtitle background capsule
            const textMetrics = ctx.measureText(text);
            const padX = 24;
            const padY = 12;
            const subW = Math.min(width * 0.9, textMetrics.width + padX * 2);
            const subH = fontSize + padY * 2;
            const subX = (width - subW) / 2;

            ctx.fillStyle = 'rgba(0, 0, 0, 0.78)';
            ctx.beginPath();
            ctx.roundRect(subX, subY - fontSize - padY, subW, subH, 16);
            ctx.fill();

            // Subtitle text with yellow highlight
            ctx.fillStyle = '#FFE600';
            ctx.fillText(text.slice(0, 50), width / 2, subY);
            ctx.restore();
          }

          // 4. Hook Title in Scene 1
          if (sIdx === 0 && f < fps * 4) {
            ctx.save();
            ctx.fillStyle = 'rgba(255, 230, 0, 0.95)';
            ctx.font = `black ${isShorts ? 36 : 42}px system-ui, sans-serif`;
            ctx.textAlign = 'center';
            ctx.shadowColor = 'rgba(0,0,0,0.85)';
            ctx.shadowBlur = 12;
            ctx.fillText(project.script.hookOpening || project.title, width / 2, isShorts ? 180 : 120);
            ctx.restore();
          }

          // 5. Video Progress Bar at the very bottom
          ctx.fillStyle = '#69DCC0';
          const progressW = (currentFrame / totalFrames) * width;
          ctx.fillRect(0, height - 6, progressW, 6);

          currentFrame++;
          // Yield to browser event loop every frame
          await new Promise((r) => setTimeout(r, 1000 / fps));
        }
      }

      mediaRecorder.stop();
    } catch (err: any) {
      console.error('Video rendering failure:', err);
      reject(err);
    }
  });
}
