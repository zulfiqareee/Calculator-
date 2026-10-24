import React, { useState } from 'react';
import { Info, Sparkles, X } from 'lucide-react';
import { Language } from '../../types';
import { getStoredAdMobConfig } from '../../utils/storage';

interface Props {
  lang: Language;
  onOpenGuide?: () => void;
}

export const AdMobBanner: React.FC<Props> = ({ lang, onOpenGuide }) => {
  const [dismissed, setDismissed] = useState(false);
  const config = getStoredAdMobConfig();

  if (dismissed) return null;

  return (
    <aside
      aria-label="Google AdMob Advertisement"
      className="w-full bg-slate-100 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-1.5 px-3 select-none"
    >
      <div className="max-w-md mx-auto flex items-center justify-between gap-2">
        {/* Test Ad Badge and Container */}
        <div className="flex-1 min-w-0 flex items-center gap-2">
          <span className="bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0">
            {lang === 'bn' ? 'বিজ্ঞাপন' : 'Ad'}
          </span>
          <div className="flex flex-col min-w-0">
            <span className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 truncate">
              {config.isTestMode
                ? (lang === 'bn' ? 'গুগল টেস্ট ব্যানার (AdMob 320x50)' : 'Google AdMob Test Banner (320x50)')
                : 'Sponsored Partner Ad'}
            </span>
            <span className="text-[9px] text-slate-500 dark:text-slate-400 font-mono truncate">
              {config.isTestMode ? config.bannerAdUnitId : 'Production Ad Unit Active'}
            </span>
          </div>
        </div>

        {/* AdMob Setup Info Button */}
        <div className="flex items-center gap-1 shrink-0">
          {onOpenGuide && (
            <button
              onClick={onOpenGuide}
              className="text-[10px] text-emerald-600 dark:text-emerald-400 hover:underline px-1.5 py-1 font-medium flex items-center gap-0.5"
              title="AdMob Setup Details"
            >
              <Info className="w-3 h-3" />
              <span>{lang === 'bn' ? 'কনফিগ' : 'Setup'}</span>
            </button>
          )}
          <button
            onClick={() => setDismissed(true)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
            title="Dismiss Preview"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
};
