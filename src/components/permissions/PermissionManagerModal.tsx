import React, { useState, useEffect } from 'react';
import {
  Shield,
  MapPin,
  Bell,
  Music,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronRight,
  X,
  Sparkles,
  Lock,
} from 'lucide-react';
import { Language } from '../../types';
import {
  checkAppPermissions,
  requestLocationPermission,
  requestNotificationPermission,
  AppPermissionStatus,
} from '../../utils/permissionManager';

interface Props {
  isOpen?: boolean;
  lang: Language;
  onClose: () => void;
  onLocationGranted?: (lat: number, lon: number) => void;
}

export const PermissionManagerModal: React.FC<Props> = ({
  isOpen = true,
  lang,
  onClose,
  onLocationGranted,
}) => {
  if (!isOpen) return null;

  const [perms, setPerms] = useState<AppPermissionStatus>({
    location: 'prompt',
    notification: 'prompt',
    audioStorage: 'granted',
  });
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const isBn = lang === 'bn';

  useEffect(() => {
    checkAppPermissions().then(setPerms);
  }, []);

  const handleRequestLocation = async () => {
    setLoadingAction('location');
    setToastMessage(null);
    try {
      const res = await requestLocationPermission();
      setPerms((prev) => ({ ...prev, location: 'granted' }));
      setToastMessage(isBn ? 'জিপিএস লোকেশন পারমিশন সফলভাবে গৃহীত হয়েছে!' : 'Location permission granted!');
      if (onLocationGranted) {
        onLocationGranted(res.lat, res.lon);
      }
    } catch (err: any) {
      setToastMessage(err.message || (isBn ? 'পারমিশন পাওয়া যায়নি।' : 'Permission failed.'));
      setPerms((prev) => ({ ...prev, location: 'denied' }));
    } finally {
      setLoadingAction(null);
      setTimeout(() => setToastMessage(null), 4000);
    }
  };

  const handleRequestNotification = async () => {
    setLoadingAction('notification');
    setToastMessage(null);
    try {
      const granted = await requestNotificationPermission();
      setPerms((prev) => ({ ...prev, notification: granted ? 'granted' : 'denied' }));
      if (granted) {
        setToastMessage(isBn ? 'নোটিফিকেশন পারমিশন সফল হয়েছে!' : 'Notification permission granted!');
      } else {
        setToastMessage(isBn ? 'নোটিফিকেশন পারমিশন দেওয়া হয়নি।' : 'Notification permission denied.');
      }
    } catch {
      setToastMessage(isBn ? 'পারমিশন গ্রহণ ব্যর্থ হয়েছে।' : 'Failed to request permission.');
    } finally {
      setLoadingAction(null);
      setTimeout(() => setToastMessage(null), 4000);
    }
  };

  const items = [
    {
      id: 'location',
      icon: MapPin,
      titleBn: 'জিপিএস অবস্থান পারমিশন (GPS Location)',
      titleEn: 'GPS Location Permission',
      descBn: 'আপনার বর্তমান এলাকার সঠিক রিয়েল-টাইম আবহাওয়া, নামাজের সময় ও কেবলার দিক নির্ণয়ের জন্য ব্যবহৃত হয়।',
      descEn: 'Used for exact local live weather forecast, prayer timings, and Qibla compass bearing.',
      status: perms.location,
      onRequest: handleRequestLocation,
      color: 'text-[#0B63F6] bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900',
    },
    {
      id: 'notification',
      icon: Bell,
      titleBn: 'অ্যালার্ম ও নোটিফিকেশন পারমিশন (Notifications)',
      titleEn: 'Alarm & Notification Alert',
      descBn: 'অ্যালার্ম রিং হওয়া ও নামাজের ওয়াক্তের সময় আপনাকে সতর্কবার্তা জানানোর জন্য প্রয়োজনীয়।',
      descEn: 'Required for alarm ringtone alerts and timely prayer notifications.',
      status: perms.notification,
      onRequest: handleRequestNotification,
      color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900',
    },
    {
      id: 'audio',
      icon: Music,
      titleBn: 'স্টোরেজ ও অডিও ফাইল পারমিশন (Audio Storage)',
      titleEn: 'Custom Audio & File Storage',
      descBn: 'ফোনের মেমোরি থেকে আপনার পছন্দের গান, গজল বা রিংটোন সরাসরি অ্যালার্মে সেট করার সুবিধা।',
      descEn: 'Allows choosing custom songs, azan or ringtones directly from device storage for alarms.',
      status: perms.audioStorage,
      onRequest: null,
      color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in select-none">
      <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-5 sm:p-6 text-slate-900 dark:text-white max-h-[92vh] overflow-y-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#0B63F6]/10 text-[#0B63F6] flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold">
                {isBn ? 'অ্যাপ পারমিশন নিয়ন্ত্রণ ও সুরক্ষা' : 'App Permissions & Privacy'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isBn ? 'প্লে-স্টোর স্ট্যান্ডার্ড ডাটা নিরাপত্তা' : 'Play Store compliant privacy controls'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toast */}
        {toastMessage && (
          <div className="p-3 rounded-2xl bg-blue-600 text-white text-xs font-bold text-center animate-fade-in">
            {toastMessage}
          </div>
        )}

        {/* Permission List */}
        <div className="space-y-3">
          {items.map((item) => {
            const Icon = item.icon;
            const isGranted = item.status === 'granted';
            const isDenied = item.status === 'denied';

            return (
              <div
                key={item.id}
                className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-2.5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${item.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                        {isBn ? item.titleBn : item.titleEn}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {isGranted ? (
                          <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            {isBn ? 'অনুমতি দেওয়া হয়েছে (Granted)' : 'Granted'}
                          </span>
                        ) : isDenied ? (
                          <span className="text-[11px] font-bold text-rose-500 flex items-center gap-1">
                            <XCircle className="w-3.5 h-3.5" />
                            {isBn ? 'প্রত্যাখ্যাত (Denied)' : 'Denied'}
                          </span>
                        ) : (
                          <span className="text-[11px] font-bold text-amber-500 flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5" />
                            {isBn ? 'অনুমতি প্রয়োজন (Requires Permission)' : 'Not granted'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {item.onRequest && !isGranted && (
                    <button
                      onClick={item.onRequest}
                      disabled={loadingAction === item.id}
                      className="px-3 py-1.5 rounded-xl bg-[#0B63F6] hover:bg-blue-700 active:scale-95 text-white text-xs font-bold shrink-0 transition disabled:opacity-50"
                    >
                      {loadingAction === item.id
                        ? (isBn ? 'যাচাই হচ্ছে...' : 'Checking...')
                        : (isBn ? 'অনুমতি দিন' : 'Allow')}
                    </button>
                  )}
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {isBn ? item.descBn : item.descEn}
                </p>
              </div>
            );
          })}
        </div>

        {/* Play Store Privacy Guarantee */}
        <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800/80 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2">
          <Lock className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            {isBn
              ? 'গুগল প্লে-স্টোর পলিসি অনুযায়ী আপনার ব্যক্তিগত ডেটা বা লোকেশন কোথাও শেয়ার বা বিক্রি করা হয় না।'
              : 'Per Google Play policies, your location and private data are kept on-device and never sold.'}
          </span>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 rounded-2xl bg-slate-900 dark:bg-slate-800 text-white font-bold text-xs hover:bg-slate-800 transition active:scale-98"
        >
          {isBn ? 'ঠিক আছে' : 'Done'}
        </button>
      </div>
    </div>
  );
};
