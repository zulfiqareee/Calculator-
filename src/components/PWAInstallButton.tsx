import React, { useEffect, useState } from 'react';
import { Download, Smartphone, X } from 'lucide-react';
import { Language } from '../types';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

interface Props {
  lang: Language;
}

export const PWAInstallButton: React.FC<Props> = ({ lang }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [isIOS, setIsIOS] = useState<boolean>(false);
  const [showIOSModal, setShowIOSModal] = useState<boolean>(false);

  useEffect(() => {
    // Check if running standalone
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsInstalled(isStandalone);

    const ua = window.navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(ua));

    const handlePrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handlePrompt);
    window.addEventListener('appinstalled', handleInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handlePrompt);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setIsInstalled(true);
        setDeferredPrompt(null);
      }
    } else if (isIOS) {
      setShowIOSModal(true);
    }
  };

  // If already standalone, hide button
  if (isInstalled) return null;

  return (
    <>
      <button
        onClick={handleInstallClick}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-xs transition active:scale-95 whitespace-nowrap shrink-0"
        title="Install to Home Screen"
      >
        <Download className="w-3.5 h-3.5" />
        <span>{lang === 'bn' ? 'ইনস্টল' : 'Install'}</span>
      </button>

      {/* iOS Modal */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 p-6 shadow-xl border border-slate-200 dark:border-slate-800 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {lang === 'bn' ? 'হোম স্ক্রিনে যুক্ত করুন' : 'Install on iPhone / iPad'}
              </h3>
              <button
                onClick={() => setShowIOSModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {lang === 'bn'
                ? '১. সাফারি ব্রাউজারের নিচে শেয়ার (Share) বোতামে চাপ দিন।\n২. নিচে স্ক্রল করে "Add to Home Screen" অপশন বেছে নিন।'
                : '1. Tap the Share button in Safari browser.\n2. Scroll down and tap "Add to Home Screen".'}
            </p>
            <button
              onClick={() => setShowIOSModal(false)}
              className="mt-2 w-full h-10 rounded-xl bg-slate-100 dark:bg-slate-800 font-semibold text-xs text-slate-800 dark:text-slate-200"
            >
              {lang === 'bn' ? 'ঠিক আছে' : 'Got it'}
            </button>
          </div>
        </div>
      )}
    </>
  );
};
