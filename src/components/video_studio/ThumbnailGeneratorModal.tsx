import React, { useState, useRef, useEffect } from 'react';
import {
  Image as ImageIcon,
  Download,
  Sparkles,
  Type,
  Palette,
  X,
  Check,
  RotateCw,
} from 'lucide-react';
import { VideoFormat, VideoLanguage } from '../../types/videoStudio';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  topic: string;
  suggestedText?: string;
  format: VideoFormat;
  language: VideoLanguage;
  onSaveThumbnail: (dataUrl: string) => void;
}

export const ThumbnailGeneratorModal: React.FC<Props> = ({
  isOpen,
  onClose,
  topic,
  suggestedText,
  format,
  language,
  onSaveThumbnail,
}) => {
  if (!isOpen) return null;

  const isBn = language === 'bn';
  const isShorts = format === 'shorts';

  const [headline, setHeadline] = useState<string>(suggestedText || topic || (isBn ? 'আসল রহস্য ফাঁস!' : 'THE REAL TRUTH!'));
  const [subText, setSubText] = useState<string>(isBn ? '১০০% প্রমাণিত তথ্য • এখনই দেখুন' : '100% PROVEN FACTS • WATCH NOW');
  const [badgeText, setBadgeText] = useState<string>(isBn ? '🔥 ভাইরাল সত্য' : '🔥 VIRAL REVEAL');
  const [themeColor, setThemeColor] = useState<string>('#FF0055');
  const [textColor, setTextColor] = useState<string>('#FFFFFF');
  const [fontSize, setFontSize] = useState<number>(isShorts ? 48 : 56);
  const [thumbnailPreviewUrl, setThumbnailPreviewUrl] = useState<string>('');

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const drawThumbnail = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = isShorts ? 720 : 1280;
    const h = isShorts ? 1280 : 720;
    canvas.width = w;
    canvas.height = h;

    // Background Gradient
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, '#090D16');
    grad.addColorStop(0.5, '#131A2B');
    grad.addColorStop(1, '#05070B');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Glowing Neon Burst in background
    const glow = ctx.createRadialGradient(w * 0.7, h * 0.4, 50, w * 0.7, h * 0.4, w * 0.6);
    glow.addColorStop(0, themeColor + '88');
    glow.addColorStop(1, 'transparent');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);

    // Vignette
    const vig = ctx.createRadialGradient(w / 2, h / 2, w * 0.3, w / 2, h / 2, w * 0.8);
    vig.addColorStop(0, 'rgba(0,0,0,0)');
    vig.addColorStop(1, 'rgba(0,0,0,0.85)');
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, w, h);

    // Top Badge
    if (badgeText) {
      ctx.save();
      const badgeW = 240;
      const badgeH = 50;
      const badgeX = isShorts ? (w - badgeW) / 2 : 70;
      const badgeY = isShorts ? 140 : 80;

      ctx.fillStyle = themeColor;
      ctx.beginPath();
      ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 14);
      ctx.fill();

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'black 20px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(badgeText, badgeX + badgeW / 2, badgeY + 32);
      ctx.restore();
    }

    // Main Big Hook Headline (Multi-line)
    ctx.save();
    ctx.font = `black ${fontSize}px system-ui, sans-serif`;
    ctx.fillStyle = textColor;
    ctx.textAlign = isShorts ? 'center' : 'left';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.95)';
    ctx.shadowBlur = 18;

    const startX = isShorts ? w / 2 : 70;
    let startY = isShorts ? h * 0.38 : h * 0.42;

    // Word wrap
    const words = headline.split(' ');
    let line = '';
    const maxLineW = isShorts ? w * 0.85 : w * 0.75;

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxLineW && n > 0) {
        ctx.fillText(line.trim(), startX, startY);
        line = words[n] + ' ';
        startY += fontSize * 1.25;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line.trim(), startX, startY);
    ctx.restore();

    // Supporting Subtitle Text
    if (subText) {
      ctx.save();
      ctx.font = 'bold 22px system-ui, sans-serif';
      ctx.fillStyle = '#69DCC0';
      ctx.textAlign = isShorts ? 'center' : 'left';
      ctx.shadowColor = 'rgba(0,0,0,0.8)';
      ctx.shadowBlur = 8;
      ctx.fillText(subText, isShorts ? w / 2 : 70, startY + 60);
      ctx.restore();
    }

    // Border Accent
    ctx.strokeStyle = themeColor;
    ctx.lineWidth = 12;
    ctx.strokeRect(0, 0, w, h);

    const url = canvas.toDataURL('image/png');
    setThumbnailPreviewUrl(url);
  };

  useEffect(() => {
    drawThumbnail();
  }, [headline, subText, badgeText, themeColor, textColor, fontSize]);

  const handleDownload = () => {
    if (!thumbnailPreviewUrl) return;
    const a = document.createElement('a');
    a.href = thumbnailPreviewUrl;
    a.download = `thumbnail-${Date.now()}.png`;
    a.click();
  };

  const handleApplyToProject = () => {
    if (thumbnailPreviewUrl) {
      onSaveThumbnail(thumbnailPreviewUrl);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-fade-in select-none">
      <div className="w-full max-w-2xl rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-5 text-white max-h-[92vh] overflow-y-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-500 to-amber-500 flex items-center justify-center text-white shadow-md">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold">
                {isBn ? 'এআই থাম্বনেইল স্টুডিও' : 'AI Thumbnail Studio'}
              </h3>
              <p className="text-[11px] text-slate-400">
                {isShorts ? 'YouTube Shorts & Facebook Reels (9:16)' : 'YouTube Landscape (16:9)'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Hidden Canvas for generation */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Live Preview Display */}
        <div className="flex justify-center bg-black/50 p-2 sm:p-4 rounded-2xl border border-slate-800">
          {thumbnailPreviewUrl && (
            <img
              src={thumbnailPreviewUrl}
              alt="Thumbnail Preview"
              className={`rounded-xl object-contain shadow-2xl border border-slate-700/80 ${
                isShorts ? 'max-h-72 w-auto aspect-[9/16]' : 'w-full max-h-56 aspect-[16/9]'
              }`}
            />
          )}
        </div>

        {/* Controls */}
        <div className="space-y-3 text-xs">
          <div>
            <label className="text-[11px] font-bold text-slate-300 block mb-1">
              {isBn ? 'মূল আকর্ষণীয় হেডলাইন (Headline):' : 'Main Catchy Headline:'}
            </label>
            <input
              type="text"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white font-bold"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1">
                {isBn ? 'সাবটাইটেল / প্রমাণ বার্তা:' : 'Supporting Subtitle:'}
              </label>
              <input
                type="text"
                value={subText}
                onChange={(e) => setSubText(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1">
                {isBn ? 'শীর্ষ ব্যাজ (Badge):' : 'Top Hook Badge:'}
              </label>
              <input
                type="text"
                value={badgeText}
                onChange={(e) => setBadgeText(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white"
              />
            </div>
          </div>

          {/* Color Palettes */}
          <div className="flex items-center gap-2 pt-1">
            <span className="text-slate-400 font-bold">{isBn ? 'থিম কালার:' : 'Theme:'}</span>
            {['#FF0055', '#FF7700', '#00E5FF', '#FFE600', '#00FF66', '#8B5CF6'].map((c) => (
              <button
                key={c}
                onClick={() => setThemeColor(c)}
                style={{ backgroundColor: c }}
                className={`w-6 h-6 rounded-full transition transform active:scale-90 ${
                  themeColor === c ? 'ring-2 ring-white scale-110' : ''
                }`}
              />
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-2 border-t border-slate-800">
          <button
            onClick={handleDownload}
            className="flex-1 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-95 border border-slate-700"
          >
            <Download className="w-4 h-4 text-[#69DCC0]" />
            <span>{isBn ? 'ছবি ডাউনলোড করুন' : 'Download PNG'}</span>
          </button>

          <button
            onClick={handleApplyToProject}
            className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-95 shadow-md shadow-emerald-600/30"
          >
            <Check className="w-4 h-4" />
            <span>{isBn ? 'ভিডিওতে প্রয়োগ করুন' : 'Apply to Video'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
