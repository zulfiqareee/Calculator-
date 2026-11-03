import React, { useState, useEffect } from 'react';
import {
  Shield,
  MapPin,
  Bell,
  Music,
  CheckCircle2,
  XCircle,
  AlertCircle,
  X,
  Sparkles,
  Lock,
  ArrowRight,
} from 'lucide-react';
import { Language } from '../../types';
import {
  checkAppPermissions,
  requestLocationPermission,
  requestNotificationPermission,
  setOnboardingCompleted,
  AppPermissionStatus,
} from '../../utils/permissionManager';

interface Props {
  isOpen?: boolean;
  isFirstLaunch?: boolean;
  lang: Language;
  onClose: () => void;
  onLocationGranted?: (lat: number, lon: number) => void;
}

export const PermissionManagerModal: React.FC<Props> = ({
  isOpen = true,
  isFirstLaunch = false,
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

  const refreshPerms = () => {
    checkAppPermissions().then(setPerms);
  };

  useEffect(() => {
    refreshPerms();
  }, []);

  const handleRequestLocation = async () => {
    setLoadingAction('location');
    setToastMessage(null);
    try {
      const res = await requestLocationPermission();
      setPerms((prev) => ({ ...prev, location: 'granted' }));
      setToastMessage(isBn ? '✓ জিপিএস লোকেশন পারমিশন অনুমোদিত হয়েছে!' : '✓ Location permission granted!');
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
        setToastMessage(isBn ? '✓ নোটিফিকেশন পারমিশন সফল হয়েছে!' : '✓ Notification permission granted!');
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

  const handleRequestAll = async () => {
    setLoadingAction('all');
    setToastMessage(null);
    try {
      // 1. Location
      try {
        const res = await requestLocationPermission();
        if (onLocationGranted) onLocationGranted(res.lat, res.lon);
      } catch (e) {
        console.warn('Location request error in batch:', e);
      }

      // 2. Notification
      try {
        await requestNotificationPermission();
      } catch (e) {
        console.warn('Notification request error in batch:', e);
      }

      await checkAppPermissions().then(setPerms);
      setToastMessage(isBn ? 'পারমিশন আপডেট সম্পন্ন হয়েছে।' : 'Permissions updated.');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleFinish = () => {
    setOnboardingCompleted(true);
    onClose();
  };

  const items = [
    {
      id: 'location',
      icon: MapPin,
      titleBn: '১. জিপিএস লোকেশন এক্সেস (GPS Location)',
      titleEn: '1. GPS Location Access',
      descBn: 'কম্পাসের সঠিক উত্তর দিক ও কিবলা নির্ণয় এবং আপনার এলাকার লাইভ আবহাওয়া ও সঠিক নামাজের সময়সূচীর জন্য অপরিহার্য।',
      descEn: 'Required for accurate compass True North, Qibla heading, real-time live weather and prayer times.',
      status: perms.location,
      onRequest: handleRequestLocation,
      color: 'text-[#0B63F6] bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900',
    },
    {
      id: 'notification',
      icon: Bell,
      titleBn: '২. নোটিফিকেশন ও অ্যালার্ট (Notifications)',
      titleEn: '2. Notifications & Alerts',
      descBn: 'সময়মতো স্মার্ট অ্যালার্ম রিং হওয়া, সেহরি ও ইফতারের সতর্কতা এবং ওয়াক্তের নোটিফিকেশন পাওয়ার জন্য প্রয়োজন।',
      descEn: 'Required for timely alarm firing, Sehri/Iftar reminders, and daily prayer alerts.',
      status: perms.notification,
      onRequest: handleRequestNotification,
      color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900',
    },
    {
      id: 'audio',
      icon: Music,
      titleBn: '৩. ফোন স্টোরেজ ও অডিও ফাইল (Audio Files)',
      titleEn: '3. Device Audio & Storage',
      descBn: 'আপনার ফোন মেমরি বা মেমরি কার্ড থেকে যেকোনো প্রিয় গজল, রিংটোন বা আজানের অডিও ফাইল অ্যালার্মে সেট করার সুবিধা।',
      descEn: 'Allows picking custom MP3/WAV/Audio ringtones or azan from your device storage for alarms.',
      status: perms.audioStorage,
      onRequest: null,
      color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in select-none">
      <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-5 sm:p-6 text-slate-900 dark:text-white max-h-[92vh] overflow-y-auto space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#0B63F6] text-white flex items-center justify-center shadow-md">
              <Shield className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  {isFirstLaunch
                    ? (isBn ? 'অ্যাপ পারমিশন অনুমোদন' : 'Device Permissions Setup')
                    : (isBn ? 'অ্যাপ পারমিশন নিয়ন্ত্রণ' : 'App Permissions')}
                </h2>
                {isFirstLaunch && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/30">
                    {isBn ? 'প্রথম লঞ্চ' : 'Startup'}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isBn
                  ? 'প্লে-স্টোর স্ট্যান্ডার্ড অনুযায়ী ডিভাইসের গোপনীয়তা সুরক্ষিত'
                  : 'Play Store compliant on-device privacy guarantee'}
              </p>
            </div>
          </div>
          {!isFirstLaunch && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Explain Banner */}
        <div className="p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 text-xs text-slate-700 dark:text-blue-200 leading-relaxed">
          {isBn
            ? 'স্মার্টহাবের ওয়েদার, সঠিক কম্পাস, কিবলা দিকদর্শন এবং অ্যালার্ম ঘড়ি সঠিকভাবে চলার জন্য নিচে উল্লেখিত ডিভাইস এক্সেসগুলো দেওয়া প্রয়োজন।'
            : 'For SmartHub to accurately provide live weather, compass heading, Qibla direction, and custom alarms, please grant the following device permissions.'}
        </div>

        {/* Toast */}
        {toastMessage && (
          <div className="p-3 rounded-2xl bg-[#0B63F6] text-white text-xs font-bold text-center animate-fade-in shadow-md">
            {toastMessage}
          </div>
        )}

        {/* Master "Allow All" Button */}
        {(perms.location !== 'granted' || perms.notification !== 'granted') && (
          <button
            onClick={handleRequestAll}
            disabled={loadingAction === 'all'}
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-[#0B63F6] to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 active:scale-98 transition disabled:opacity-60"
          >
            <Sparkles className="w-4 h-4" />
            <span>
              {loadingAction === 'all'
                ? (isBn ? 'অনুমতি গ্রহণ করা হচ্ছে...' : 'Requesting permissions...')
                : (isBn ? 'এক ক্লিকে সকল প্রয়োজনীয় পারমিশন মঞ্জুর করুন' : 'Grant All Required Permissions')}
            </span>
          </button>
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
                className={`p-3.5 sm:p-4 rounded-2xl border transition ${
                  isGranted
                    ? 'border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/30 dark:bg-emerald-950/20'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40'
                } space-y-2`}
              >
                <div className="flex items-start justify-between gap-2.5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${item.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                        {isBn ? item.titleBn : item.titleEn}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {isGranted ? (
                          <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            {isBn ? 'অনুমোদিত (Granted)' : 'Granted'}
                          </span>
                        ) : isDenied ? (
                          <span className="text-[11px] font-bold text-rose-500 flex items-center gap-1">
                            <XCircle className="w-3.5 h-3.5" />
                            {isBn ? 'প্রত্যাখ্যাত (Denied)' : 'Denied'}
                          </span>
                        ) : (
                          <span className="text-[11px] font-bold text-amber-500 flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5" />
                            {isBn ? 'অনুমতি প্রয়োজন (Pending)' : 'Action required'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {item.onRequest && !isGranted && (
                    <button
                      onClick={item.onRequest}
                      disabled={loadingAction === item.id}
                      className="px-3.5 py-1.5 rounded-xl bg-[#0B63F6] hover:bg-blue-700 active:scale-95 text-white text-xs font-bold shrink-0 transition disabled:opacity-50 shadow-xs"
                    >
                      {loadingAction === item.id
                        ? (isBn ? 'যাচাই হচ্ছে...' : 'Verifying...')
                        : (isBn ? 'অনুমতি দিন' : 'Allow')}
                    </button>
                  )}

                  {!item.onRequest && isGranted && (
                    <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                      {isBn ? 'সক্রিয়' : 'Active'}
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed pl-1">
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
              ? 'গুগল প্লে-স্টোর পলিসি অনুযায়ী কোনো ব্যক্তিগত ফাইল বা অবস্থান অনলাইনে পাঠানো বা শেয়ার করা হয় না।'
              : 'Per Google Play policies, location and files remain on-device and are never shared.'}
          </span>
        </div>

        {/* Continue Button */}
        <button
          onClick={handleFinish}
          className="w-full py-3.5 rounded-2xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition active:scale-98 shadow-md"
        >
          <span>{isFirstLaunch ? (isBn ? 'স্মার্টহাবে প্রবেশ করুন' : 'Continue to SmartHub') : (isBn ? 'সম্পন্ন (Done)' : 'Done')}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
