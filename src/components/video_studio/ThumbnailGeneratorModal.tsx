import React, { useState, useRef, useEffect } from 'react';
import { X, Download, Sparkles, RefreshCw, Check, Image as ImageIcon } from 'lucide-react';
import { VideoFormat, VideoStyle } from '../../types/multiAi';

interface ThumbnailGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  topic: string;
  style: VideoStyle;
  format: VideoFormat;
  onSelectThumbnail?: (dataUrl: string) => void;
}

export const ThumbnailGeneratorModal: React.FC<ThumbnailGeneratorModalProps> = ({
  isOpen,
  onClose,
  topic,
  style,
  format,
  onSelectThumbnail,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [headline, setHeadline] = useState(topic || 'ভিডিওর আকর্ষণীয় শিরোনাম');
  const [subText, setSubText] = useState('সম্পূর্ণ নতুন তথ্য • এখনই দেখুন!');
  const [badgeText, setBadgeText] = useState('MUST WATCH');
  const [badgeColor, setBadgeColor] = useState('#EF4444');
  const [bgGradient, setBgGradient] = useState<'sunset' | 'cyber' | 'emerald' | 'gold' | 'dark'>('sunset');
  const [textColor, setTextColor] = useState('#FFFFFF');
  const [hasBorder, setHasBorder] = useState(true);
  const [savedDataUrl, setSavedDataUrl] = useState<string | null>(null);

  useEffect(() => {
    if (topic) {
      setHeadline(topic.slice(0, 45));
    }
  }, [topic]);

  useEffect(() => {
    if (isOpen) {
      renderThumbnail();
    }
  }, [isOpen, headline, subText, badgeText, badgeColor, bgGradient, textColor, hasBorder, format]);

  if (!isOpen) return null;

  const width = format === 'shorts' ? 1080 : 1280;
  const height = format === 'shorts' ? 1920 : 720;

  const renderThumbnail = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = width;
    canvas.height = height;

    // Background Gradient
    const grad = ctx.createLinearGradient(0, 0, width, height);
    if (bgGradient === 'sunset') {
      grad.addColorStop(0, '#1e1b4b');
      grad.addColorStop(0.5, '#4c1d95');
      grad.addColorStop(1, '#be185d');
    } else if (bgGradient === 'cyber') {
      grad.addColorStop(0, '#0f172a');
      grad.addColorStop(0.5, '#0284c7');
      grad.addColorStop(1, '#06b6d4');
    } else if (bgGradient === 'emerald') {
      grad.addColorStop(0, '#022c22');
      grad.addColorStop(0.5, '#065f46');
      grad.addColorStop(1, '#059669');
    } else if (bgGradient === 'gold') {
      grad.addColorStop(0, '#1c1917');
      grad.addColorStop(0.5, '#78350f');
      grad.addColorStop(1, '#d97706');
    } else {
      grad.addColorStop(0, '#09090b');
      grad.addColorStop(0.5, '#18181b');
      grad.addColorStop(1, '#27272a');
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Decorative geometric shapes/particles
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
    for (let i = 0; i < 24; i++) {
      const px = (i * 137.5) % width;
      const py = (i * 219.3) % height;
      const rad = 40 + (i % 5) * 35;
      ctx.beginPath();
      ctx.arc(px, py, rad, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // Center focal glow
    const radial = ctx.createRadialGradient(width / 2, height / 2, 50, width / 2, height / 2, width * 0.7);
    radial.addColorStop(0, 'rgba(255, 255, 255, 0.12)');
    radial.addColorStop(1, 'rgba(0, 0, 0, 0.4)');
    ctx.fillStyle = radial;
    ctx.fillRect(0, 0, width, height);

    // Border
    if (hasBorder) {
      ctx.strokeStyle = badgeColor;
      ctx.lineWidth = format === 'shorts' ? 24 : 16;
      ctx.strokeRect(ctx.lineWidth / 2, ctx.lineWidth / 2, width - ctx.lineWidth, height - ctx.lineWidth);
    }

    const centerY = height / 2;

    // Top Badge (Category/Must Watch)
    if (badgeText.trim()) {
      ctx.save();
      const badgeY = format === 'shorts' ? centerY - 380 : centerY - 140;
      ctx.font = `bold ${format === 'shorts' ? 44 : 26}px sans-serif`;
      const badgeW = ctx.measureText(badgeText).width + 60;
      const badgeH = format === 'shorts' ? 70 : 44;
      const badgeX = (width - badgeW) / 2;

      // Drop shadow for badge
      ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
      ctx.shadowBlur = 15;
      ctx.fillStyle = badgeColor;
      ctx.beginPath();
      ctx.roundRect(badgeX, badgeY - badgeH / 2, badgeW, badgeH, 12);
      ctx.fill();

      ctx.shadowBlur = 0;
      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(badgeText.toUpperCase(), width / 2, badgeY);
      ctx.restore();
    }

    // Headline (Large Catchy Text)
    ctx.save();
    const titleSize = format === 'shorts' ? 84 : 54;
    ctx.font = `900 ${titleSize}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Black stroke / drop shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
    ctx.shadowBlur = 24;
    ctx.lineWidth = 14;
    ctx.strokeStyle = '#000000';

    // Word wrap headline
    const words = headline.split(' ');
    let lines: string[] = [];
    let currentLine = '';
    const maxWidth = width * 0.85;

    for (const w of words) {
      const testLine = currentLine ? `${currentLine} ${w}` : w;
      if (ctx.measureText(testLine).width > maxWidth) {
        if (currentLine) lines.push(currentLine);
        currentLine = w;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) lines.push(currentLine);
    if (lines.length > 4) lines = lines.slice(0, 4);

    const lineHeight = titleSize * 1.25;
    const totalTextHeight = lines.length * lineHeight;
    const startY = format === 'shorts' ? centerY - totalTextHeight / 2 + 30 : centerY - totalTextHeight / 2 + 10;

    lines.forEach((line, idx) => {
      const y = startY + idx * lineHeight;
      ctx.strokeText(line, width / 2, y);
      ctx.fillStyle = idx === 0 ? textColor : '#FDE047'; // alternate with vibrant yellow
      ctx.fillText(line, width / 2, y);
    });
    ctx.restore();

    // SubText / Call to Action at bottom
    if (subText.trim()) {
      ctx.save();
      const subY = format === 'shorts' ? centerY + 420 : centerY + 180;
      const subSize = format === 'shorts' ? 44 : 26;
      ctx.font = `bold ${subSize}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Background pill for subtext
      const subW = ctx.measureText(subText).width + 50;
      const subH = subSize * 1.8;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
      ctx.beginPath();
      ctx.roundRect((width - subW) / 2, subY - subH / 2, subW, subH, 24);
      ctx.fill();

      ctx.fillStyle = '#38BDF8'; // Cyan text
      ctx.fillText(subText, width / 2, subY);
      ctx.restore();
    }

    // SmartHub watermark tag in bottom right
    ctx.save();
    ctx.font = `bold ${format === 'shorts' ? 28 : 18}px sans-serif`;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.textAlign = 'right';
    ctx.fillText('SmartHub AI Studio', width - (hasBorder ? 36 : 24), height - (hasBorder ? 36 : 24));
    ctx.restore();

    const dataUrl = canvas.toDataURL('image/png');
    setSavedDataUrl(dataUrl);
  };

  const handleDownload = () => {
    if (!savedDataUrl) return;
    const a = document.createElement('a');
    a.href = savedDataUrl;
    a.download = `thumbnail_${Date.now()}_${format}.png`;
    a.click();
  };

  const handleApplyToProject = () => {
    if (savedDataUrl && onSelectThumbnail) {
      onSelectThumbnail(savedDataUrl);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl p-6 shadow-2xl my-6 flex flex-col gap-6 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-amber-500 to-red-600 rounded-2xl text-white shadow-lg">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                AI থাম্বনেইল জেনারেটর
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-medium">
                  {format === 'shorts' ? '9:16 Shorts' : '16:9 Landscape'}
                </span>
              </h2>
              <p className="text-xs text-slate-400">কাস্টম আকর্ষণীয় ও হাই-কনভার্সন থাম্বনেইল ডিজাইন করুন</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area: Preview & Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Controls Column */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 mb-1.5 block">প্রধান শিরোনাম (Headline)</label>
              <textarea
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                rows={2}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                placeholder="ভিডিওর প্রধান আকর্ষণীয় কথা"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 mb-1.5 block">সাব-টেক্সট / কল টু অ্যাকশন</label>
              <input
                type="text"
                value={subText}
                onChange={(e) => setSubText(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                placeholder="যেমন: এখনই দেখুন • সম্পূর্ণ সত্য"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 mb-1.5 block">টপ ব্যাজ টেক্সট</label>
                <input
                  type="text"
                  value={badgeText}
                  onChange={(e) => setBadgeText(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-300 mb-1.5 block">ব্যাজ কালার</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={badgeColor}
                    onChange={(e) => setBadgeColor(e.target.value)}
                    className="w-9 h-9 rounded-lg bg-transparent cursor-pointer border border-slate-700"
                  />
                  <span className="text-xs text-slate-400 font-mono">{badgeColor}</span>
                </div>
              </div>
            </div>

            {/* Background Style Presets */}
            <div>
              <label className="text-xs font-semibold text-slate-300 mb-2 block">ব্যাকগ্রাউন্ড গ্রেডিয়েন্ট</label>
              <div className="grid grid-cols-5 gap-2">
                {(
                  [
                    { id: 'sunset', label: 'Sunset', color: 'from-purple-900 to-pink-600' },
                    { id: 'cyber', label: 'Cyber', color: 'from-slate-900 to-cyan-600' },
                    { id: 'emerald', label: 'Green', color: 'from-emerald-950 to-emerald-600' },
                    { id: 'gold', label: 'Gold', color: 'from-stone-900 to-amber-600' },
                    { id: 'dark', label: 'Dark', color: 'from-zinc-950 to-zinc-800' },
                  ] as const
                ).map((g) => (
                  <button
                    key={g.id}
                    onClick={() => setBgGradient(g.id)}
                    className={`h-10 rounded-xl bg-gradient-to-br ${g.color} border-2 transition flex items-center justify-center text-[10px] font-bold text-white shadow-sm ${
                      bgGradient === g.id ? 'border-white scale-105' : 'border-transparent opacity-75'
                    }`}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-xs text-slate-300 font-medium">আউটার বর্ডার বর্ডারফ্রেম</span>
              <button
                type="button"
                onClick={() => setHasBorder(!hasBorder)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  hasBorder ? 'bg-amber-600' : 'bg-slate-700'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    hasBorder ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Preview Canvas Column */}
          <div className="lg:col-span-7 flex flex-col items-center justify-center bg-slate-950 p-4 rounded-2xl border border-slate-800 min-h-[360px]">
            <div className="relative max-h-[460px] flex items-center justify-center overflow-hidden rounded-xl shadow-2xl border border-slate-800/80">
              <canvas
                ref={canvasRef}
                className="max-h-[440px] max-w-full object-contain rounded-lg"
                style={{
                  aspectRatio: format === 'shorts' ? '9/16' : '16/9',
                }}
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-2 text-center">
              প্রিভিউ: {format === 'shorts' ? '1080 x 1920 (HD Shorts)' : '1280 x 720 (HD Landscape)'}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-800">
          <button
            onClick={() => {
              setHeadline(topic || 'ভিডিওর প্রধান আকর্ষণীয় কথা');
              setSubText('সম্পূর্ণ নতুন তথ্য • এখনই দেখুন!');
              setBadgeText('MUST WATCH');
              setBadgeColor('#EF4444');
              setBgGradient('sunset');
            }}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            ডিফল্ট রিসেট
          </button>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={handleDownload}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition"
            >
              <Download className="w-4 h-4" />
              ডাউনলোড PNG
            </button>
            {onSelectThumbnail && (
              <button
                onClick={handleApplyToProject}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-red-600 hover:from-amber-600 hover:to-red-700 text-white text-xs font-bold transition shadow-lg shadow-amber-500/20"
              >
                <Check className="w-4 h-4" />
                প্রজেক্টে যুক্ত করুন
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
