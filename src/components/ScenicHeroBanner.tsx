import React from 'react';
import { Language } from '../types';

interface Props {
  lang: Language;
}

export const ScenicHeroBanner: React.FC<Props> = ({ lang }) => {
  return (
    <div className="relative w-full h-36 sm:h-40 rounded-3xl overflow-hidden shadow-sm select-none border border-blue-100/40 dark:border-slate-800">
      {/* Background Scenic Landscape SVG */}
      <svg
        viewBox="0 0 400 160"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="skyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#0091EA" />
            <stop offset="50%" stopColor="#29B6F6" />
            <stop offset="100%" stopColor="#81D4FA" />
          </linearGradient>

          <linearGradient id="sunGlow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFF9C4" stopOpacity="1" />
            <stop offset="50%" stopColor="#FFEE58" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#FFA726" stopOpacity="0" />
          </linearGradient>

          <linearGradient id="farMtn" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#0288D1" />
            <stop offset="100%" stopColor="#005B9F" />
          </linearGradient>

          <linearGradient id="midMtn" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#00838F" />
            <stop offset="100%" stopColor="#004D40" />
          </linearGradient>

          <linearGradient id="nearHill" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#43A047" />
            <stop offset="100%" stopColor="#1B5E20" />
          </linearGradient>

          <linearGradient id="riverGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#B2EBF2" />
            <stop offset="50%" stopColor="#4DD0E1" />
            <stop offset="100%" stopColor="#0097A7" />
          </linearGradient>
        </defs>

        {/* Sky */}
        <rect width="400" height="160" fill="url(#skyGrad)" />

        {/* Soft clouds */}
        <path d="M 20 40 Q 35 25, 55 35 Q 75 25, 95 38 L 20 42 Z" fill="#ffffff" opacity="0.35" />
        <path d="M 160 30 Q 180 18, 205 28 Q 230 18, 250 32 L 160 35 Z" fill="#ffffff" opacity="0.3" />

        {/* Glowing Sun on Right */}
        <circle cx="310" cy="55" r="32" fill="url(#sunGlow)" opacity="0.45" />
        <circle cx="310" cy="55" r="18" fill="#FFFDE7" />

        {/* Far Mountains (Blue) */}
        <polygon points="120,160 190,75 260,160" fill="url(#farMtn)" opacity="0.85" />
        <polygon points="220,160 290,65 370,160" fill="url(#farMtn)" opacity="0.9" />
        <polygon points="280,160 340,85 410,160" fill="url(#farMtn)" opacity="0.75" />

        {/* Mid Mountains (Teal/Green) */}
        <polygon points="-20,160 70,80 170,160" fill="url(#midMtn)" opacity="0.9" />
        <polygon points="80,160 170,88 270,160" fill="url(#midMtn)" opacity="0.85" />
        <polygon points="270,160 320,105 380,160" fill="#00695C" />

        {/* Near Rolling Hills (Lush Green) */}
        <path d="M -10 160 Q 60 115 150 145 Q 230 170 320 130 Q 370 110 410 160 Z" fill="url(#nearHill)" />

        {/* Winding River */}
        <path d="M 280 160 Q 295 140 310 132 Q 315 125 320 120 L 324 121 Q 315 130 302 143 Q 295 152 292 160 Z" fill="url(#riverGrad)" />

        {/* Tiny tree silhouettes */}
        <polygon points="312,128 310,135 314,135" fill="#1B5E20" />
        <polygon points="316,126 314,133 318,133" fill="#1B5E20" />
        <polygon points="304,133 302,141 306,141" fill="#0D5302" />
      </svg>

      {/* Dark gradient overlay on left for razor-sharp typography contrast */}
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950/65 via-slate-900/35 to-transparent pointer-events-none" />

      {/* Content Text Overlay */}
      <div className="absolute inset-0 p-4 sm:p-5 flex flex-col justify-center text-white z-10">
        <h2 className="text-lg sm:text-xl font-black tracking-tight drop-shadow-md text-white leading-tight">
          {lang === 'bn' ? 'সহজ হিসাব, স্মার্ট জীবন' : 'Smart Tools, Easy Life'}
        </h2>
        <p className="text-[11px] sm:text-xs text-blue-50/95 font-medium mt-1 max-w-[240px] drop-shadow-sm leading-relaxed">
          {lang === 'bn'
            ? 'আপনার দৈনন্দিন কাজকে আরও সহজ করে তুলুন'
            : 'Make your daily electrical & utility work effortless'}
        </p>
      </div>
    </div>
  );
};
