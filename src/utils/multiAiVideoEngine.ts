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
  VideoMode,
  AIProviderConfig,
} from '../types/multiAi';
import { executeWithSmartFallback } from './smartAiRouter';

// ==========================================
// 1. Script Generation with Multi-AI Routing
// ==========================================
export async function generateSmartScript(
  topic: string,
  mode: VideoMode,
  language: VideoLanguage,
  format: VideoFormat,
  durationSec: VideoDurationSec,
  style: VideoStyle,
  customInstructions?: string
): Promise<VideoScript> {
  const isBn = language === 'bn';
  const sceneCount = durationSec <= 15 ? 2 : durationSec <= 30 ? 3 : durationSec <= 60 ? 5 : durationSec <= 90 ? 7 : 9;
  const sceneDuration = Math.round(durationSec / sceneCount);

  return executeWithSmartFallback<VideoScript>(
    'script_generation',
    {
      // 1. Google Gemini 3.8 Flash Executor
      gemini: async (_provider: AIProviderConfig, apiKey: string) => {
        const ai = new GoogleGenAI({ apiKey });
        const prompt = `You are a world-class viral video director and scriptwriter.
Generate a high-retention video script for YouTube Shorts / Facebook Reels / Landscape.
Topic: "${topic}"
Video Mode: ${mode === 'voiceless' ? 'VOICE-LESS (No narration speech, focus on punchy ON-SCREEN bold text and visual storytelling)' : 'VOICE NARRATED (High-engagement narration voiceover)'}
Target Language: ${isBn ? 'Bengali (বাংলা)' : 'English'}
Total Duration: ${durationSec}s across ${sceneCount} scenes (~${sceneDuration}s each).
Style: ${style}
Custom Instructions: ${customInstructions || 'Create an intriguing hook, emotional connection, and high retention.'}

Return STRICT JSON:
{
  "topic": "${topic}",
  "mode": "${mode}",
  "hookOpening": "Punchy 3-second hook in ${isBn ? 'Bengali' : 'English'}",
  "scenes": [
    {
      "sceneNumber": 1,
      "durationSec": ${sceneDuration},
      "narrationText": "${mode === 'voiceless' ? '' : `Spoken narration in ${isBn ? 'Bengali' : 'English'}`}",
      "onScreenText": "Short bold 3-5 word headline for screen overlay in ${isBn ? 'Bengali' : 'English'}",
      "visualDescription": "Visual scene description",
      "imagePrompt": "Cinematic visual prompt, ${style} aesthetic, high detail",
      "transitionType": "fade",
      "cameraMotion": "zoom_in"
    }
  ],
  "closingStatement": "Final impactful thought in ${isBn ? 'Bengali' : 'English'}",
  "callToAction": "Call to action in ${isBn ? 'Bengali' : 'English'}",
  "sourcesAndReferences": ["Verified Fact / Source"],
  "totalEstimatedSeconds": ${durationSec}
}`;

        const res = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            temperature: 0.7,
          },
        });

        const text = res.text?.trim() || '';
        const clean = text.replace(/^```json/i, '').replace(/```$/i, '').trim();
        const parsed = JSON.parse(clean);

        return {
          topic: parsed.topic || topic,
          mode,
          hookOpening: parsed.hookOpening || (isBn ? 'আপনি কি জানেন এই সত্যটি?' : 'Did you know this?'),
          scenes: parsed.scenes.map((s: any, idx: number) => ({
            id: `scene-${Date.now()}-${idx}`,
            sceneNumber: idx + 1,
            durationSec: s.durationSec || sceneDuration,
            narrationText: mode === 'voiceless' ? '' : (s.narrationText || ''),
            onScreenText: s.onScreenText || (isBn ? `ধাপ ${idx + 1}` : `Step ${idx + 1}`),
            visualDescription: s.visualDescription || '',
            imagePrompt: s.imagePrompt || `${topic} scene ${idx + 1}, cinematic lighting`,
            transitionType: s.transitionType || (idx % 2 === 0 ? 'fade' : 'zoom'),
            cameraMotion: s.cameraMotion || (idx % 2 === 0 ? 'zoom_in' : 'pan_left'),
          })),
          closingStatement: parsed.closingStatement || (isBn ? 'ধন্যবাদ আমাদের সাথে থাকার জন্য।' : 'Thank you for watching.'),
          callToAction: parsed.callToAction || (isBn ? 'লাইক ও ফলো করে সাথে থাকুন!' : 'Follow for more daily content!'),
          sourcesAndReferences: parsed.sourcesAndReferences || [],
          totalEstimatedSeconds: durationSec,
          generatedByProvider: 'gemini',
          providerName: 'Google Gemini 3.8 Flash',
        };
      },

      // 2. Groq Cloud Executor (Llama 3.3 70B / Mixtral - 100% Free Tier API)
      groq: async (_provider: AIProviderConfig, apiKey: string) => {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [
              {
                role: 'system',
                content: 'You are an expert video producer. Return ONLY strict valid JSON matching the requested schema without markdown quotes.',
              },
              {
                role: 'user',
                content: `Topic: "${topic}", Mode: ${mode}, Language: ${isBn ? 'Bengali' : 'English'}, Duration: ${durationSec}s, Style: ${style}, Scenes: ${sceneCount}.
JSON format:
{
  "topic": "${topic}",
  "mode": "${mode}",
  "hookOpening": "string",
  "scenes": [{"sceneNumber": 1, "durationSec": ${sceneDuration}, "narrationText": "string", "onScreenText": "string", "visualDescription": "string", "imagePrompt": "string", "transitionType": "fade", "cameraMotion": "zoom_in"}],
  "closingStatement": "string",
  "callToAction": "string"
}`,
              },
            ],
            temperature: 0.7,
            response_format: { type: 'json_object' },
          }),
        });

        if (!response.ok) {
          throw new Error(`Groq API returned HTTP ${response.status}: ${await response.text()}`);
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || '{}';
        const parsed = JSON.parse(content);

        return {
          topic: parsed.topic || topic,
          mode,
          hookOpening: parsed.hookOpening || (isBn ? 'একটি চমকপ্রদ তথ্য!' : 'An astonishing fact!'),
          scenes: (parsed.scenes || []).map((s: any, idx: number) => ({
            id: `scene-groq-${Date.now()}-${idx}`,
            sceneNumber: idx + 1,
            durationSec: s.durationSec || sceneDuration,
            narrationText: mode === 'voiceless' ? '' : (s.narrationText || ''),
            onScreenText: s.onScreenText || (isBn ? `মূল বিষয় ${idx + 1}` : `Key Point ${idx + 1}`),
            visualDescription: s.visualDescription || '',
            imagePrompt: s.imagePrompt || `${topic} visual scene ${idx + 1}`,
            transitionType: s.transitionType || 'fade',
            cameraMotion: s.cameraMotion || 'zoom_in',
          })),
          closingStatement: parsed.closingStatement || (isBn ? 'সম্পূর্ণ তথ্য জানতে সাথে থাকুন।' : 'Stay tuned for more.'),
          callToAction: parsed.callToAction || (isBn ? 'ভিডিওটি শেয়ার করুন!' : 'Share this video!'),
          totalEstimatedSeconds: durationSec,
          generatedByProvider: 'groq',
          providerName: 'Groq Cloud (Llama 3.3)',
        };
      },
    },
    // 3. Smart Local Offline Fallback Generator
    () => {
      const scenes: VideoScene[] = [];
      for (let i = 0; i < sceneCount; i++) {
        scenes.push({
          id: `scene-offline-${i + 1}`,
          sceneNumber: i + 1,
          durationSec: sceneDuration,
          narrationText: mode === 'voiceless'
            ? ''
            : (isBn
                ? `দৃশ্য ${i + 1}: ${topic} সম্পর্কে এই তথ্যটি অত্যন্ত গুরুত্বপূর্ণ। এটি আমাদের দৃষ্টিভঙ্গি বদলে দেয় এবং নতুন ধারণা দেয়।`
                : `Scene ${i + 1}: Understanding ${topic} reveals critical insights that empower our knowledge.`),
          onScreenText: isBn ? `${topic} • পর্ব ${i + 1}` : `${topic} • Part ${i + 1}`,
          visualDescription: isBn ? `${topic} এর আকর্ষণীয় ভিজ্যুয়াল দৃশ্যপট ${i + 1}` : `Visual representation of ${topic} scene ${i + 1}`,
          imagePrompt: `${topic}, cinematic scene ${i + 1}, ${style} style, dramatic lighting`,
          transitionType: i === 0 ? 'fade' : i % 2 === 0 ? 'zoom' : 'slide',
          cameraMotion: i % 2 === 0 ? 'zoom_in' : 'pan_left',
        });
      }

      return {
        topic,
        mode,
        hookOpening: isBn ? `আপনি কি জানেন ${topic} সম্পর্কে এই আসল রহস্যটি?` : `Did you know this fascinating truth about ${topic}?`,
        scenes,
        closingStatement: isBn ? `আশা করি ${topic} সম্পর্কিত বিষয়টি আপনার ভালো লেগেছে।` : `We hope this insight on ${topic} was inspiring.`,
        callToAction: isBn ? 'পরবর্তী ভিডিও পেতে এখনই লাইক ও সাবস্ক্রাইব করুন!' : 'Like, share and subscribe for more amazing updates!',
        totalEstimatedSeconds: durationSec,
        generatedByProvider: 'local_offline',
        providerName: 'Smart Local Procedural Engine',
      };
    }
  ).then((res) => ({ ...res.data, providerName: res.providerName, generatedByProvider: res.providerId }));
}

// ==========================================
// 2. SEO Metadata Generation with Multi-AI
// ==========================================
export async function generateSmartSEO(
  topic: string,
  scriptText: string,
  language: VideoLanguage
): Promise<VideoMetadataSEO> {
  const isBn = language === 'bn';

  return executeWithSmartFallback<VideoMetadataSEO>(
    'seo_metadata',
    {
      gemini: async (_p, apiKey) => {
        const ai = new GoogleGenAI({ apiKey });
        const prompt = `Generate viral, high-CTR YouTube & Facebook SEO metadata for:
Topic: "${topic}"
Script: "${scriptText.slice(0, 400)}"
Language: ${isBn ? 'Bengali' : 'English'}

Strict JSON schema:
{
  "youtube": {
    "title": "High-CTR Title under 65 chars in ${isBn ? 'Bengali' : 'English'}",
    "description": "Rich keyword description with summary and tags",
    "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
    "keywords": ["key1", "key2", "key3"],
    "hashtags": ["#Shorts", "#Trending", "#${topic.replace(/\\s+/g, '')}"],
    "suggestedCategory": "Education",
    "thumbnailText": "3-word catchy punchline",
    "pinnedComment": "Question to engage audience"
  },
  "facebook": {
    "caption": "Catchy reel caption with emojis",
    "description": "Reel description",
    "hashtags": ["#Reels", "#Viral"],
    "hookSentence": "First line hook",
    "callToAction": "Follow page for more"
  }
}`;

        const res = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: { responseMimeType: 'application/json' },
        });

        const parsed = JSON.parse(res.text?.trim() || '{}');
        return {
          ...parsed,
          generatedByProvider: 'gemini',
        };
      },

      groq: async (_p, apiKey) => {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [
              { role: 'system', content: 'Generate high-CTR social media SEO metadata in strict JSON.' },
              { role: 'user', content: `Topic: ${topic}, Language: ${isBn ? 'Bengali' : 'English'}. Return JSON with youtube and facebook fields.` },
            ],
            response_format: { type: 'json_object' },
          }),
        });
        const data = await response.json();
        const parsed = JSON.parse(data.choices?.[0]?.message?.content || '{}');
        return {
          ...parsed,
          generatedByProvider: 'groq',
        };
      },
    },
    // Offline SEO fallback
    () => {
      const cleanTopic = topic.replace(/[^\w\s\u0980-\u09FF]/g, '');
      return {
        youtube: {
          title: isBn ? `${cleanTopic} সম্পর্কে যা আপনার জানা উচিত! ⚡` : `The Untold Truth About ${cleanTopic}! ⚡`,
          description: isBn
            ? `${cleanTopic} সম্পর্কে সম্পূর্ণ তথ্য ও বিস্তারিত আলোচনা। ভিডিওটি ভালো লাগলে অবশ্যই লাইক এবং চ্যানেলটি সাবস্ক্রাইব করুন।`
            : `Discover all essential insights about ${cleanTopic}. Like, share and subscribe for daily content.`,
          tags: [cleanTopic, isBn ? 'স্মার্টটিপস' : 'smarttips', 'shorts', 'viral', isBn ? 'শিক্ষা' : 'education'],
          keywords: [cleanTopic, 'facts', 'daily'],
          hashtags: ['#Shorts', '#Viral', `#${cleanTopic.replace(/\s+/g, '')}`],
          suggestedCategory: 'Education',
          thumbnailText: isBn ? 'আসল সত্যটি জানুন!' : 'Shocking Truth!',
          pinnedComment: isBn ? 'আপনার মতামত আমাদের কমেন্ট করে জানান!' : 'What do you think? Let us know in comments!',
        },
        facebook: {
          caption: isBn ? `${cleanTopic} এর এই রহস্যটি জানলে আপনিও চমকে যাবেন! 🚀` : `This insight about ${cleanTopic} will blow your mind! 🚀`,
          description: cleanTopic,
          hashtags: ['#Reels', '#ViralReels', `#${cleanTopic.replace(/\s+/g, '')}`],
          hookSentence: isBn ? 'মাত্র ৬০ সেকেন্ডে জেনে নিন!' : 'Discover in just 60 seconds!',
          callToAction: isBn ? 'পেজটি ফলো করে পাশে থাকুন!' : 'Follow our page for daily reels!',
        },
        generatedByProvider: 'local_offline',
      };
    }
  ).then((r) => r.data);
}

// ==========================================
// 3. Audio & Voice Narration Engine
// ==========================================
let currentAudioElement: HTMLAudioElement | null = null;

export async function generateGeminiTTSAudio(
  text: string,
  gender: 'male' | 'female'
): Promise<string | null> {
  const apiKey = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash-lite-tts',
      contents: [
        {
          role: 'user',
          parts: [{ text: text.slice(0, 300), speechMetadata: { style: 'Clear, engaging, articulate narrator' } }],
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: gender === 'female' ? 'Kore' : 'Puck' },
          },
        },
      },
    });

    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
  } catch (err) {
    console.warn('[Gemini TTS] Error:', err);
    return null;
  }
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
    osc.frequency.exponentialRampToValueAtTime(freq * 1.4, ctx.currentTime + duration * 0.5);
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (e) {}
}

export async function playSceneVoice(
  text: string,
  lang: VideoLanguage,
  gender: 'male' | 'female',
  rate: number = 1.0,
  cachedWavBase64?: string,
  onEnd?: () => void
): Promise<boolean> {
  stopSceneVoice();

  // 1. Try Cached WAV or Gemini TTS
  let wavData = cachedWavBase64;
  if (!wavData) {
    try {
      wavData = (await generateGeminiTTSAudio(text, gender)) || undefined;
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
      console.warn('WAV Audio playback note:', e);
    }
  }

  // 2. Web Speech API with safe voice selection
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
          const timeout = setTimeout(res, 200);
          window.speechSynthesis.onvoiceschanged = () => {
            clearTimeout(timeout);
            res();
          };
        });
        voices = window.speechSynthesis.getVoices();
      }

      const targetCode = lang === 'bn' ? 'bn' : 'en';
      const matched = voices.find((v) => v.lang.toLowerCase().startsWith(targetCode));
      if (matched) {
        utterance.voice = matched;
        utterance.lang = matched.lang;
      } else if (voices.length > 0) {
        utterance.voice = voices[0];
      }

      utterance.onend = () => onEnd?.();
      utterance.onerror = () => {
        playProceduralTone(523.25, 0.4);
        onEnd?.();
      };

      window.speechSynthesis.speak(utterance);
      return true;
    } catch (e) {}
  }

  // 3. Fallback tone
  playProceduralTone(440, 0.4);
  setTimeout(() => onEnd?.(), 800);
  return true;
}

export function stopSceneVoice(): void {
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
// 4. Procedural Royalty-Free Web Audio Synthesizer
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

  if (trackType === 'silence') return buffer;

  let chordFreqs: number[][];
  if (trackType === 'spiritual') {
    chordFreqs = [
      [146.83, 220.0, 293.66, 440.0],
      [130.81, 196.0, 261.63, 392.0],
      [116.54, 174.61, 233.08, 349.23],
      [146.83, 220.0, 293.66, 440.0],
    ];
  } else if (trackType === 'motivational') {
    chordFreqs = [
      [130.81, 164.81, 196.0, 261.63],
      [174.61, 220.0, 261.63, 349.23],
      [146.83, 174.61, 220.0, 293.66],
      [196.0, 246.94, 293.66, 392.0],
    ];
  } else {
    // Cinematic
    chordFreqs = [
      [110.0, 164.81, 220.0, 329.63],
      [98.0, 146.83, 196.0, 293.66],
      [87.31, 130.81, 174.61, 261.63],
      [110.0, 164.81, 220.0, 329.63],
    ];
  }

  const chordDuration = 4.0;
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const chordIndex = Math.floor(t / chordDuration) % chordFreqs.length;
    const currentChord = chordFreqs[chordIndex];
    const chordPhase = (t % chordDuration) / chordDuration;
    const envelope = Math.sin(Math.PI * chordPhase);

    let sampleL = 0;
    let sampleR = 0;
    for (let c = 0; c < currentChord.length; c++) {
      const f = currentChord[c];
      const sine = Math.sin(2 * Math.PI * f * t);
      const overtone = Math.sin(2 * Math.PI * f * 2 * t) * 0.25;
      const val = (sine + overtone) * envelope * 0.08;
      sampleL += val * (c % 2 === 0 ? 0.9 : 0.6);
      sampleR += val * (c % 2 === 0 ? 0.6 : 0.9);
    }
    left[i] = sampleL;
    right[i] = sampleR;
  }
  return buffer;
}

// ==========================================
// 5. Thematic Procedural Visual Scene Generator
// ==========================================
export function generateProceduralVisualScene(
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

  const palettes: Record<VideoStyle, string[][]> = {
    cinematic: [['#0B132B', '#1C2541', '#3A506B'], ['#03071E', '#370617', '#6A040F'], ['#14213D', '#000000', '#FCA311']],
    islamic: [['#062C22', '#0A4A3B', '#13755C'], ['#0B1B3D', '#112F5E', '#1D4E89'], ['#2A1B0E', '#5C381E', '#9E6B38']],
    tech: [['#050814', '#0A1838', '#10376B'], ['#0B032D', '#2B0B5E', '#5B159E'], ['#001220', '#003666', '#006494']],
    motivational: [['#1F1A3A', '#412B6B', '#7A3B9E'], ['#26110D', '#5E2015', '#A6361C'], ['#0E2A1E', '#1B543B', '#2C8C61']],
    educational: [['#0F172A', '#1E293B', '#334155'], ['#0C2340', '#1D4ED8', '#3B82F6'], ['#14532D', '#15803D', '#22C55E']],
    health: [['#071B35', '#112B48', '#153D55'], ['#042F2E', '#115E59', '#14B8A6'], ['#1E1B4B', '#3730A3', '#6366F1']],
    documentary: [['#1C1917', '#292524', '#44403C'], ['#18181B', '#27272A', '#3F3F46'], ['#1E293B', '#0F172A', '#020617']],
    realistic: [['#0A0A0A', '#171717', '#262626'], ['#0C141F', '#1F2937', '#374151'], ['#18181B', '#27272A', '#3F3F46']],
  };

  const currentPalette = palettes[style] || palettes.cinematic;
  const colors = currentPalette[index % currentPalette.length];

  // Draw smooth gradient
  const grad = ctx.createLinearGradient(0, 0, width, height);
  grad.addColorStop(0, colors[0]);
  grad.addColorStop(0.5, colors[1]);
  grad.addColorStop(1, colors[2]);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  // Geometric particle art
  ctx.save();
  ctx.globalAlpha = 0.15;
  for (let i = 0; i < 7; i++) {
    const radius = 90 + i * 40;
    ctx.beginPath();
    ctx.arc((width / 2) + Math.cos(i + index) * 110, (height / 2) + Math.sin(i + index) * 130, radius, 0, Math.PI * 2);
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  ctx.restore();

  // Dark vignette
  const vignette = ctx.createRadialGradient(width / 2, height / 2, width * 0.25, width / 2, height / 2, width * 0.8);
  vignette.addColorStop(0, 'rgba(0,0,0,0)');
  vignette.addColorStop(1, 'rgba(0,0,0,0.65)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, width, height);

  // Scene & Topic Overlay Badge
  ctx.save();
  const badgeW = width * 0.78;
  const badgeH = 74;
  const badgeX = (width - badgeW) / 2;
  const badgeY = height * 0.22;

  ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 18);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#69DCC0';
  ctx.font = 'bold 22px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`SCENE ${scene.sceneNumber} • ${style.toUpperCase()}`, width / 2, badgeY + 44);

  // Main visual representation headline
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 30px system-ui, -apple-system, sans-serif';
  ctx.fillText(topic.slice(0, 32), width / 2, height * 0.40);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.font = '16px system-ui, -apple-system, sans-serif';
  ctx.fillText(scene.visualDescription.slice(0, 60), width / 2, height * 0.46);
  ctx.restore();

  return canvas.toDataURL('image/jpeg', 0.85);
}

// ==========================================
// 6. Complete Real Video Rendering Engine (MediaRecorder -> MP4/WebM)
// ==========================================
export async function renderMultiAiVideoToBlob(
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

      // Prepare scene images
      const sceneImages: HTMLImageElement[] = [];
      for (let i = 0; i < project.script.scenes.length; i++) {
        const scene = project.script.scenes[i];
        const dataUrl =
          scene.visualImageUrl ||
          generateProceduralVisualScene(scene, project.title, project.style, project.format, i);

        const img = new Image();
        img.src = dataUrl;
        await new Promise((res) => {
          img.onload = res;
          img.onerror = res;
        });
        sceneImages.push(img);
      }

      onProgress?.(20, 'অডিও ট্র্যাক ও ব্যাকগ্রাউন্ড মিউজিক কম্পোজ করা হচ্ছে...');

      // Web Audio Context Setup
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioCtx();
      if (audioCtx.state === 'suspended') {
        try {
          await audioCtx.resume();
        } catch (e) {}
      }
      const audioDest = audioCtx.createMediaStreamDestination();

      // Optimize scene durations for crisp mobile render (3 to 5s per scene)
      const sceneRenderDurations = project.script.scenes.map((s) => Math.min(s.durationSec, 5));
      const totalSec = sceneRenderDurations.reduce((acc, d) => acc + d, 0);

      // Play synthesized background music
      if (project.bgMusicVolume > 0 && project.bgMusicTrack !== 'silence') {
        try {
          const musicBuffer = createSynthesizedMusicBuffer(audioCtx, project.bgMusicTrack, totalSec);
          const musicSource = audioCtx.createBufferSource();
          musicSource.buffer = musicBuffer;

          const musicGain = audioCtx.createGain();
          musicGain.gain.value = project.bgMusicVolume * 0.35;
          musicSource.connect(musicGain);
          musicGain.connect(audioDest);
          musicSource.start(0);
        } catch (e) {
          console.warn('BG music error:', e);
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

      // Codec selection
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
      if (selectedMime) mediaRecorderOptions.mimeType = selectedMime;
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
        reject(new Error('MediaRecorder execution failed on device.'));
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
      onProgress?.(30, 'ভিডিও ফ্রেম অ্যানিমেশন ও টেক্সট সিঙ্ক হচ্ছে...');

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
          const globalProgress = (currentFrame / totalFrames) * 70 + 30;

          if (f % 12 === 0) {
            onProgress?.(Math.min(98, Math.round(globalProgress)), `রেন্ডারিং ফ্রেম: ${currentFrame}/${totalFrames}...`);
          }

          // 1. Ken Burns Camera Movement
          ctx.save();
          let scale = 1.0;
          let panX = 0;
          let panY = 0;

          if (scene.cameraMotion === 'zoom_in') {
            scale = 1.0 + progressInScene * 0.15;
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

          // 2. Cross-dissolve transitions
          if (f < 8 && sIdx > 0) {
            ctx.fillStyle = `rgba(0, 0, 0, ${1 - f / 8})`;
            ctx.fillRect(0, 0, width, height);
          } else if (f > sceneFrames - 8 && sIdx < project.script.scenes.length - 1) {
            ctx.fillStyle = `rgba(0, 0, 0, ${(f - (sceneFrames - 8)) / 8})`;
            ctx.fillRect(0, 0, width, height);
          }

          // 3. VOICE-LESS MODE: Bold Animated Headline Typography Overlay
          if (project.mode === 'voiceless') {
            ctx.save();
            const onScreenTitle = scene.onScreenText || project.title;
            const cardY = isShorts ? height * 0.70 : height * 0.75;

            // Dramatic animated text card
            ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
            ctx.strokeStyle = '#69DCC0';
            ctx.lineWidth = 3;
            const boxW = Math.min(width * 0.9, 640);
            const boxH = 90;
            const boxX = (width - boxW) / 2;

            ctx.beginPath();
            ctx.roundRect(boxX, cardY, boxW, boxH, 20);
            ctx.fill();
            ctx.stroke();

            // Glowing text
            ctx.fillStyle = '#FFE600';
            ctx.font = `bold ${isShorts ? 32 : 36}px system-ui, -apple-system, sans-serif`;
            ctx.textAlign = 'center';
            ctx.shadowColor = 'rgba(0,0,0,0.9)';
            ctx.shadowBlur = 10;
            ctx.fillText(onScreenTitle.slice(0, 36), width / 2, cardY + 56);
            ctx.restore();
          }

          // 4. VOICE MODE: Subtitles Overlay
          if (project.mode === 'voice' && project.subtitleEnabled && scene.narrationText) {
            ctx.save();
            const fontSize = isShorts ? 28 : 32;
            ctx.font = `bold ${fontSize}px system-ui, -apple-system, sans-serif`;
            ctx.textAlign = 'center';

            const subY = isShorts ? height * 0.78 : height * 0.85;
            const text = scene.narrationText;

            const textMetrics = ctx.measureText(text);
            const padX = 22;
            const padY = 12;
            const subW = Math.min(width * 0.9, textMetrics.width + padX * 2);
            const subH = fontSize + padY * 2;
            const subX = (width - subW) / 2;

            ctx.fillStyle = 'rgba(0, 0, 0, 0.80)';
            ctx.beginPath();
            ctx.roundRect(subX, subY - fontSize - padY, subW, subH, 16);
            ctx.fill();

            ctx.fillStyle = '#FFE600';
            ctx.fillText(text.slice(0, 48), width / 2, subY);
            ctx.restore();
          }

          // 5. Opening Hook Badge in Scene 1
          if (sIdx === 0 && f < fps * 4) {
            ctx.save();
            ctx.fillStyle = 'rgba(255, 230, 0, 0.95)';
            ctx.font = `black ${isShorts ? 36 : 42}px system-ui, sans-serif`;
            ctx.textAlign = 'center';
            ctx.shadowColor = 'rgba(0,0,0,0.9)';
            ctx.shadowBlur = 12;
            ctx.fillText(project.script.hookOpening || project.title, width / 2, isShorts ? 180 : 120);
            ctx.restore();
          }

          // 6. Bottom Progress Bar
          ctx.fillStyle = '#69DCC0';
          const progressW = (currentFrame / totalFrames) * width;
          ctx.fillRect(0, height - 6, progressW, 6);

          currentFrame++;
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
