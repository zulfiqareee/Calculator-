import React from 'react';
import { Compass, Eye } from 'lucide-react';
import { formatNumber } from '../../i18n/translations';
import { Language } from '../../types';

interface QuadVisualizerProps {
  type: 'quad';
  l1: number; // North (feet)
  l2: number; // South (feet)
  w1: number; // West (feet)
  w2: number; // East (feet)
  diag: number; // Diagonal (feet)
  totalSqFt: number;
  totalShotok: number;
  lang: Language;
}

interface TrianglesVisualizerProps {
  type: 'triangles';
  triangles: {
    id: string;
    nameBn: string;
    a: number;
    b: number;
    c: number;
    areaSqFt: number;
    shotok: number;
    valid: boolean;
  }[];
  totalSqFt: number;
  totalShotok: number;
  lang: Language;
}

interface SingleTriangleVisualizerProps {
  type: 'triangle';
  a: number;
  b: number;
  c: number;
  totalSqFt: number;
  totalShotok: number;
  valid: boolean;
  lang: Language;
}

interface CurveVisualizerProps {
  type: 'curve';
  intervalFt: number;
  offsets: { id: string; feet: number; inch: number }[];
  totalSqFt: number;
  totalShotok: number;
  lang: Language;
}

export type PlotVisualizerProps =
  | QuadVisualizerProps
  | TrianglesVisualizerProps
  | SingleTriangleVisualizerProps
  | CurveVisualizerProps;

export const LandPlotVisualizer: React.FC<PlotVisualizerProps> = (props) => {
  const { lang, totalSqFt, totalShotok } = props;

  return (
    <div className="relative w-full rounded-2xl bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 border border-slate-700/60 p-4 shadow-inner overflow-hidden select-none">
      {/* Visual Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold border border-emerald-500/30">
            <Eye size={13} />
          </div>
          <span className="text-xs font-bold text-slate-200">
            {lang === 'bn' ? 'ডিজিটাল নকশা (আমিন ক্যাডাস্ট্রাল ভিউ)' : 'Digital Cadastral Cad-Plot'}
          </span>
        </div>

        {/* North Compass Indicator */}
        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-800/80 border border-slate-700 text-[10px] text-amber-300 font-bold">
          <Compass size={11} className="text-rose-400 animate-pulse" />
          <span>N ↑ {lang === 'bn' ? 'উত্তর' : 'North'}</span>
        </div>
      </div>

      {/* SVG Canvas Area */}
      <div className="w-full h-56 flex items-center justify-center relative">
        {props.type === 'quad' && (
          <svg viewBox="0 0 340 200" className="w-full h-full max-h-56">
            <defs>
              {/* Grid pattern */}
              <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="0.8" />
              </pattern>
              <linearGradient id="plotGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#0B63F6" stopOpacity="0.15" />
              </linearGradient>
            </defs>

            <rect width="340" height="200" fill="url(#grid)" rx="8" />

            {/* Approximate Quad Polygon based on proportions */}
            {/* Points: A(top-left), B(top-right), C(bottom-right), D(bottom-left) */}
            <polygon
              points="45,40 285,45 295,160 35,155"
              fill="url(#plotGrad)"
              stroke="#10b981"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />

            {/* Diagonal line */}
            <line
              x1="45"
              y1="40"
              x2="295"
              y2="160"
              stroke="#38bdf8"
              strokeWidth="1.8"
              strokeDasharray="4,4"
            />

            {/* Side Dimension Badges */}
            {/* Top / North */}
            <g>
              <rect x="135" y="24" width="75" height="18" rx="4" fill="#0f172a" stroke="#10b981" strokeWidth="1" />
              <text x="172" y="37" fill="#6ee7b7" fontSize="10" fontWeight="bold" textAnchor="middle">
                উত্তর: {formatNumber(props.l1.toFixed(1), lang)}′
              </text>
            </g>

            {/* Bottom / South */}
            <g>
              <rect x="135" y="165" width="75" height="18" rx="4" fill="#0f172a" stroke="#10b981" strokeWidth="1" />
              <text x="172" y="178" fill="#6ee7b7" fontSize="10" fontWeight="bold" textAnchor="middle">
                দক্ষিণ: {formatNumber(props.l2.toFixed(1), lang)}′
              </text>
            </g>

            {/* Left / West */}
            <g>
              <rect x="2" y="90" width="70" height="18" rx="4" fill="#0f172a" stroke="#38bdf8" strokeWidth="1" />
              <text x="37" y="103" fill="#7dd3fc" fontSize="10" fontWeight="bold" textAnchor="middle">
                পশ্চিম: {formatNumber(props.w1.toFixed(1), lang)}′
              </text>
            </g>

            {/* Right / East */}
            <g>
              <rect x="268" y="90" width="70" height="18" rx="4" fill="#0f172a" stroke="#38bdf8" strokeWidth="1" />
              <text x="303" y="103" fill="#7dd3fc" fontSize="10" fontWeight="bold" textAnchor="middle">
                পূর্ব: {formatNumber(props.w2.toFixed(1), lang)}′
              </text>
            </g>

            {/* Diagonal Label */}
            {props.diag > 0 && (
              <g>
                <rect x="135" y="92" width="78" height="17" rx="4" fill="#0284c7" />
                <text x="174" y="104" fill="#ffffff" fontSize="9" fontWeight="bold" textAnchor="middle">
                  কর্ণ: {formatNumber(props.diag.toFixed(1), lang)}′
                </text>
              </g>
            )}

            {/* Corner pins */}
            <circle cx="45" cy="40" r="4" fill="#34d399" />
            <circle cx="285" cy="45" r="4" fill="#34d399" />
            <circle cx="295" cy="160" r="4" fill="#34d399" />
            <circle cx="35" cy="155" r="4" fill="#34d399" />
          </svg>
        )}

        {props.type === 'triangles' && (
          <svg viewBox="0 0 340 200" className="w-full h-full max-h-56">
            <defs>
              <pattern id="grid2" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="0.8" />
              </pattern>
            </defs>
            <rect width="340" height="200" fill="url(#grid2)" rx="8" />

            {/* Triangle 1 */}
            <polygon
              points="40,160 170,35 170,160"
              fill="rgba(16, 185, 129, 0.2)"
              stroke="#10b981"
              strokeWidth="2"
            />
            {/* Triangle 2 */}
            <polygon
              points="170,35 300,160 170,160"
              fill="rgba(56, 189, 248, 0.2)"
              stroke="#38bdf8"
              strokeWidth="2"
            />

            {/* Common baseline */}
            <line x1="40" y1="160" x2="300" y2="160" stroke="#f59e0b" strokeWidth="2.5" />

            <circle cx="40" cy="160" r="4" fill="#10b981" />
            <circle cx="170" cy="35" r="4" fill="#38bdf8" />
            <circle cx="300" cy="160" r="4" fill="#f59e0b" />
            <circle cx="170" cy="160" r="4" fill="#ec4899" />

            <text x="105" y="110" fill="#a7f3d0" fontSize="11" fontWeight="bold" textAnchor="middle">
              ত্রিভুজ ১
            </text>
            <text x="235" y="110" fill="#bae6fd" fontSize="11" fontWeight="bold" textAnchor="middle">
              ত্রিভুজ ২
            </text>

            <rect x="70" y="170" width="200" height="18" rx="4" fill="#0f172a" stroke="#475569" strokeWidth="1" />
            <text x="170" y="183" fill="#cbd5e1" fontSize="9.5" fontWeight="bold" textAnchor="middle">
              {props.triangles.length}টি সংযুক্ত ত্রিভুজায়ন খণ্ড
            </text>
          </svg>
        )}

        {props.type === 'triangle' && (
          <svg viewBox="0 0 340 200" className="w-full h-full max-h-56">
            <defs>
              <pattern id="grid3" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="0.8" />
              </pattern>
            </defs>
            <rect width="340" height="200" fill="url(#grid3)" rx="8" />

            <polygon
              points="170,30 50,165 290,165"
              fill="rgba(245, 158, 11, 0.2)"
              stroke="#f59e0b"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />

            <circle cx="170" cy="30" r="4" fill="#fbbf24" />
            <circle cx="50" cy="165" r="4" fill="#fbbf24" />
            <circle cx="290" cy="165" r="4" fill="#fbbf24" />

            <text x="95" y="90" fill="#fde68a" fontSize="10" fontWeight="bold" textAnchor="middle">
              বাহু ক: {formatNumber(props.a.toFixed(1), lang)}′
            </text>
            <text x="245" y="90" fill="#fde68a" fontSize="10" fontWeight="bold" textAnchor="middle">
              বাহু খ: {formatNumber(props.b.toFixed(1), lang)}′
            </text>
            <text x="170" y="183" fill="#fde68a" fontSize="10" fontWeight="bold" textAnchor="middle">
              বাহু গ: {formatNumber(props.c.toFixed(1), lang)}′
            </text>
          </svg>
        )}

        {props.type === 'curve' && (
          <svg viewBox="0 0 340 200" className="w-full h-full max-h-56">
            <defs>
              <pattern id="grid4" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="0.8" />
              </pattern>
            </defs>
            <rect width="340" height="200" fill="url(#grid4)" rx="8" />

            {/* Baseline */}
            <line x1="30" y1="165" x2="310" y2="165" stroke="#94a3b8" strokeWidth="2.5" />

            {/* Curved river boundary */}
            <path
              d="M 30,120 Q 80,60 140,85 T 230,55 T 310,105"
              fill="none"
              stroke="#38bdf8"
              strokeWidth="3"
            />

            {/* Shaded water/boundary fill */}
            <path
              d="M 30,120 Q 80,60 140,85 T 230,55 T 310,105 L 310,165 L 30,165 Z"
              fill="rgba(56, 189, 248, 0.15)"
            />

            {/* Offsets perpendicular lines */}
            {[
              { x: 30, y: 120, label: 'O₁' },
              { x: 100, y: 72, label: 'O₂' },
              { x: 170, y: 75, label: 'O₃' },
              { x: 240, y: 60, label: 'O₄' },
              { x: 310, y: 105, label: 'O₅' },
            ].map((p, idx) => (
              <g key={idx}>
                <line x1={p.x} y1={p.y} x2={p.x} y2="165" stroke="#f43f5e" strokeWidth="1.5" strokeDasharray="2,2" />
                <circle cx={p.x} cy={p.y} r="3" fill="#38bdf8" />
                <text x={p.x} y={p.y - 6} fill="#fecdd3" fontSize="8" fontWeight="bold" textAnchor="middle">
                  {p.label}
                </text>
              </g>
            ))}

            <text x="170" y="184" fill="#cbd5e1" fontSize="9" fontWeight="bold" textAnchor="middle">
              বেসলাইন (দূরত্ব ব্যবধান d = {formatNumber(props.intervalFt.toString(), lang)} ফুট)
            </text>
          </svg>
        )}
      </div>

      {/* Floating Result Badge */}
      <div className="mt-2 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-xl p-2.5 flex items-center justify-between text-xs">
        <div>
          <span className="text-[10px] text-slate-400 block font-medium">
            {lang === 'bn' ? 'মোট পরিমাপ ক্ষেত্রফল:' : 'Total Calculated Area:'}
          </span>
          <span className="text-sm font-extrabold text-emerald-400 font-mono">
            {formatNumber(totalShotok.toFixed(3), lang)} {lang === 'bn' ? 'শতক / ডেসিমেল' : 'Decimal'}
          </span>
        </div>
        <div className="text-right">
          <span className="text-[10px] text-slate-400 block font-medium">
            {lang === 'bn' ? 'বর্গফুট:' : 'Square Feet:'}
          </span>
          <span className="text-xs font-bold text-slate-200 font-mono">
            {formatNumber(totalSqFt.toFixed(1), lang)} sq ft
          </span>
        </div>
      </div>
    </div>
  );
};
