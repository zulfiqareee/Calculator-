import React, { useState, useEffect, useRef } from 'react';
import {
  Bell,
  Clock,
  Plus,
  Trash2,
  MoreVertical,
  Settings as SettingsIcon,
  Music,
  Timer,
  Volume2,
  VolumeX,
  Sliders,
  BellRing,
  Moon,
  HelpCircle,
  Edit3,
  X,
} from 'lucide-react';
import { Language } from '../../types';
import {
  AlarmItem,
  getStoredAlarms,
  addOrUpdateAlarm,
  deleteAlarm,
  toggleAlarm,
  calculateNextAlarmDate,
  formatAlarmCountdown,
  triggerAlarmRinging,
  requestNotificationPermission,
  unlockAudio,
  getAlarmSettings,
} from '../../utils/alarmEngine';
import { AddEditAlarmModal } from './AddEditAlarmModal';
import { AlarmSettingsModal } from './AlarmSettingsModal';
import { AdMobBanner } from '../admob/AdMobBanner';

interface Props {
  lang: Language;
}

const DAYS_BN = ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহঃ', 'শুক্র', 'শনি'];
const DAYS_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const AlarmMainView: React.FC<Props> = ({ lang }) => {
  const [alarms, setAlarms] = useState<AlarmItem[]>(getStoredAlarms());
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  // Modals & Menus
  const [showAddEditModal, setShowAddEditModal] = useState<boolean>(false);
  const [editingAlarm, setEditingAlarm] = useState<AlarmItem | null>(null);
  const [showThreeDotMenu, setShowThreeDotMenu] = useState<boolean>(false);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [showSystemTimeDialog, setShowSystemTimeDialog] = useState<boolean>(false);
  const [showAndroidGuideModal, setShowAndroidGuideModal] = useState<boolean>(false);

  // Lockscreen 5s countdown test
  const [countdownLockTest, setCountdownLockTest] = useState<number | null>(null);
  const countdownIntervalRef = useRef<number | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Close three-dot menu when clicking outside
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowThreeDotMenu(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  // Update current live clock
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => {
      clearInterval(timer);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, []);

  const toBn = (num: number | string) => {
    if (lang !== 'bn') return String(num);
    const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    return String(num).replace(/\d/g, (d) => bnDigits[Number(d)]);
  };

  const formatTime12h = (time24: string) => {
    const [hStr, mStr] = time24.split(':');
    let h = parseInt(hStr, 10);
    const m = mStr;
    const period = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return {
      hour: String(h).padStart(2, '0'),
      minute: m,
      period,
    };
  };

  const getRepeatScheduleText = (repeatDays: number[]) => {
    if (!repeatDays || repeatDays.length === 0) {
      return lang === 'bn' ? 'একবার বাজবে' : 'Ring once';
    }
    if (repeatDays.length === 7) {
      return lang === 'bn' ? 'প্রতিদিন' : 'Daily';
    }
    const isWeekdays = repeatDays.length === 5 && [1, 2, 3, 4, 5].every((d) => repeatDays.includes(d));
    if (isWeekdays) {
      return lang === 'bn' ? 'সোম - শুক্র' : 'Mon - Fri';
    }
    return repeatDays.map((d) => (lang === 'bn' ? DAYS_BN[d] : DAYS_EN[d])).join(', ');
  };

  const handleToggle = (id: string) => {
    const updated = toggleAlarm(id);
    setAlarms(updated);
  };

  const handleDelete = (id: string) => {
    const updated = deleteAlarm(id);
    setAlarms(updated);
  };

  const handleOpenAdd = () => {
    setEditingAlarm(null);
    setShowAddEditModal(true);
  };

  const handleOpenEdit = (alarm: AlarmItem) => {
    setEditingAlarm(alarm);
    setShowAddEditModal(true);
  };

  const handleSaveAlarm = (saved: AlarmItem) => {
    const updated = addOrUpdateAlarm(saved);
    setAlarms(updated);
    setShowAddEditModal(false);
  };

  const handleMenuAction = (action: string) => {
    setShowThreeDotMenu(false);
    if (action === 'edit_time') {
      setShowSystemTimeDialog(true);
    } else {
      setShowSettingsModal(true);
    }
  };

  const handleTestDisplay = () => {
    unlockAudio();
    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    const settings = getAlarmSettings();
    const testItem: AlarmItem = {
      id: 'test-' + Date.now(),
      time: `${h}:${m}`,
      labelBn: lang === 'bn' ? 'সকালের রুটিন ও কাজ' : 'Morning Work Routine',
      labelEn: 'Morning Work Routine',
      enabled: true,
      repeatDays: [],
      soundTone: settings.defaultRingtone || 'chime',
      vibrate: settings.vibrateWithAlarm,
      snoozeDuration: settings.snoozeDurationMinutes,
      autoSilence: settings.autoSilenceMinutes,
      createdAt: Date.now(),
    };
    triggerAlarmRinging(testItem);
  };

  const start5sTest = async () => {
    unlockAudio();
    await requestNotificationPermission();
    setCountdownLockTest(5);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);

    let count = 5;
    countdownIntervalRef.current = window.setInterval(() => {
      count -= 1;
      if (count > 0) {
        setCountdownLockTest(count);
      } else {
        if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
        setCountdownLockTest(null);
        handleTestDisplay();
      }
    }, 1000);
  };

  return (
    <div className="space-y-4 max-w-2xl mx-auto text-slate-100 pb-16">
      {/* 1. Header with Title & Three-Dot Menu */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-[#0B63F6]/20 border border-[#0B63F6]/40 flex items-center justify-center text-[#0B63F6]">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-black text-white leading-tight">
              {lang === 'bn' ? 'স্মার্ট অ্যালার্ম' : 'Smart Alarm'}
            </h2>
            <p className="text-xs text-slate-400">
              {currentTime.toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              })}
              {' • '}
              <span className="font-mono text-slate-300">
                {toBn(currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }))}
              </span>
            </p>
          </div>
        </div>

        {/* Action Controls & Three-Dot Menu */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0B63F6] hover:bg-blue-600 text-white font-bold text-xs shadow-md shadow-blue-900/40 active:scale-95 transition cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>{lang === 'bn' ? 'নতুন অ্যালার্ম' : 'Add Alarm'}</span>
          </button>

          {/* Three-Dot Menu */}
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setShowThreeDotMenu(!showThreeDotMenu)}
              className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-slate-700 transition active:scale-95 cursor-pointer"
              title="More options"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {showThreeDotMenu && (
              <div className="absolute right-0 top-12 z-50 w-64 rounded-2xl bg-[#0F1E36] border border-slate-700/90 shadow-2xl py-2 text-xs font-semibold backdrop-blur-xl animate-fade-in divide-y divide-slate-800/80">
                <div className="py-1">
                  <button
                    type="button"
                    onClick={() => handleMenuAction('settings')}
                    className="w-full px-4 py-2.5 text-left text-slate-200 hover:bg-[#0B63F6]/20 hover:text-white flex items-center justify-between transition cursor-pointer"
                  >
                    <span>{lang === 'bn' ? '১. অ্যালার্ম সেটিংস' : '1. Alarm Settings'}</span>
                    <SettingsIcon className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleMenuAction('edit_time')}
                    className="w-full px-4 py-2.5 text-left text-slate-200 hover:bg-[#0B63F6]/20 hover:text-white flex items-center justify-between transition cursor-pointer"
                  >
                    <span>{lang === 'bn' ? '২. সিস্টেম সময় পরিবর্তন' : '2. Edit System Time'}</span>
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                </div>

                <div className="py-1">
                  <button
                    type="button"
                    onClick={() => handleMenuAction('ringtone')}
                    className="w-full px-4 py-2.5 text-left text-slate-200 hover:bg-[#0B63F6]/20 hover:text-white flex items-center justify-between transition cursor-pointer"
                  >
                    <span>{lang === 'bn' ? '৩. অ্যালার্ম রিংটোন' : '3. Alarm Ringtone'}</span>
                    <Music className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleMenuAction('timer_ringtone')}
                    className="w-full px-4 py-2.5 text-left text-slate-200 hover:bg-[#0B63F6]/20 hover:text-white flex items-center justify-between transition cursor-pointer"
                  >
                    <span>{lang === 'bn' ? '৪. টাইমার রিংটোন' : '4. Timer Ringtone'}</span>
                    <Timer className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleMenuAction('volume')}
                    className="w-full px-4 py-2.5 text-left text-slate-200 hover:bg-[#0B63F6]/20 hover:text-white flex items-center justify-between transition cursor-pointer"
                  >
                    <span>{lang === 'bn' ? '৫. রিংটোন ভলিউম' : '5. Ringtone Volume'}</span>
                    <Volume2 className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleMenuAction('auto_silence')}
                    className="w-full px-4 py-2.5 text-left text-slate-200 hover:bg-[#0B63F6]/20 hover:text-white flex items-center justify-between transition cursor-pointer"
                  >
                    <span>{lang === 'bn' ? '৬. অটো-সাইলেন্স' : '6. Auto-silence'}</span>
                    <VolumeX className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                </div>

                <div className="py-1">
                  <button
                    type="button"
                    onClick={() => handleMenuAction('additional')}
                    className="w-full px-4 py-2.5 text-left text-blue-400 hover:bg-[#0B63F6]/20 hover:text-blue-300 flex items-center justify-between transition cursor-pointer"
                  >
                    <span>{lang === 'bn' ? '৭. অতিরিক্ত অ্যালার্ম সেটিংস' : '7. Additional Alarm Settings'}</span>
                    <Sliders className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. Hero Digital Clock & Diagnostic Bar */}
      <div className="p-5 rounded-3xl bg-[#091527] border border-slate-800/80 shadow-lg text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#0B63F6]/10 rounded-full blur-2xl pointer-events-none"></div>

        <span className="text-[11px] font-bold uppercase tracking-widest text-[#0B63F6]">
          {lang === 'bn' ? 'ডিজিটাল ঘড়ি' : 'Digital Clock'}
        </span>

        <h1 className="text-5xl sm:text-6xl font-black font-mono tracking-tight text-white my-1.5 drop-shadow-md">
          {toBn(currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }))}
        </h1>

        <p className="text-xs text-slate-400 font-medium">
          {currentTime.toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-US', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </p>

        {/* Quick Diagnostics Row */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            onClick={handleTestDisplay}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#0B63F6]/20 hover:bg-[#0B63F6]/30 text-blue-300 border border-[#0B63F6]/40 flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
            title="ডিসপ্লেতে পূর্ণাঙ্গ অ্যালার্মের স্ক্রিন ও সাউন্ড টেস্ট করুন"
          >
            <BellRing className="w-3.5 h-3.5 text-[#0B63F6]" />
            <span>{lang === 'bn' ? 'ডিসপ্লে টেস্ট' : 'Display Test'}</span>
          </button>

          <button
            type="button"
            onClick={start5sTest}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
            title="৫ সেকেন্ড পর বাজবে, পাওয়ার বাটন টিপে স্ক্রিন অফ করে পরীক্ষা করুন"
          >
            <Moon className="w-3.5 h-3.5 text-purple-400" />
            <span>{lang === 'bn' ? 'লক স্ক্রিন টেস্ট (৫ সে)' : 'Lock Test (5s)'}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowAndroidGuideModal(true)}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
            <span>{lang === 'bn' ? 'লকস্ক্রিন নির্দেশিকা' : 'Lockscreen Guide'}</span>
          </button>
        </div>
      </div>

      {/* 5s Countdown Toast */}
      {countdownLockTest !== null && (
        <div className="p-4 rounded-3xl bg-purple-950/90 text-white border-2 border-purple-500 shadow-xl flex items-center justify-between gap-3 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-purple-600 flex items-center justify-center font-black text-2xl text-white">
              {toBn(countdownLockTest)}
            </div>
            <div>
              <h5 className="font-bold text-sm text-purple-100">
                {lang === 'bn' ? 'দ্রুত স্ক্রিন অফ বা লক করুন!' : 'Turn off screen or lock phone now!'}
              </h5>
              <p className="text-xs text-purple-200">
                {lang === 'bn'
                  ? `${toBn(countdownLockTest)} সেকেন্ড পর অ্যালার্ম বাজবে এবং ডিসপ্লে অন হবে।`
                  : `Alarm will ring and wake up screen in ${countdownLockTest} seconds.`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
              setCountdownLockTest(null);
            }}
            className="px-3 py-1.5 rounded-xl bg-purple-800 text-xs font-bold hover:bg-purple-700"
          >
            {lang === 'bn' ? 'বাতিল' : 'Cancel'}
          </button>
        </div>
      )}

      {/* 3. Alarms List (Matches Reference Design) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            {lang === 'bn' ? `সেট করা অ্যালার্মসমূহ (${alarms.length})` : `Alarms (${alarms.length})`}
          </span>
          <span className="text-[11px] text-slate-400 font-mono">
            {alarms.filter((a) => a.enabled).length} {lang === 'bn' ? 'টি সক্রিয়' : 'active'}
          </span>
        </div>

        {alarms.length === 0 ? (
          <div className="p-8 text-center rounded-3xl bg-[#091527] border border-slate-800 text-slate-400">
            <Bell className="w-12 h-12 mx-auto mb-3 text-slate-600" />
            <p className="text-sm font-semibold text-slate-300">
              {lang === 'bn' ? 'কোনো অ্যালার্ম সেট করা নেই' : 'No alarms set'}
            </p>
            <button
              type="button"
              onClick={handleOpenAdd}
              className="mt-3 text-xs font-bold text-[#0B63F6] hover:underline"
            >
              {lang === 'bn' ? '+ নতুন অ্যালার্ম যুক্ত করুন' : '+ Add an alarm'}
            </button>
          </div>
        ) : (
          alarms.map((alarm) => {
            const time12 = formatTime12h(alarm.time);
            const nextTrigger = calculateNextAlarmDate(alarm);
            const countdownText = formatAlarmCountdown(nextTrigger, lang);
            const scheduleText = getRepeatScheduleText(alarm.repeatDays);

            return (
              <div
                key={alarm.id}
                className={`p-5 rounded-3xl border transition-all duration-200 shadow-md flex items-center justify-between ${
                  alarm.enabled
                    ? 'bg-[#091527] border-slate-700/80 hover:border-[#0B63F6]/50'
                    : 'bg-[#060e1b] border-slate-800/60 opacity-60'
                }`}
              >
                {/* Left side */}
                <div
                  className="min-w-0 flex-1 cursor-pointer"
                  onClick={() => handleOpenEdit(alarm)}
                >
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl sm:text-5xl font-black font-mono tracking-tight text-white drop-shadow-xs">
                      {toBn(time12.hour)}:{toBn(time12.minute)}
                    </span>
                    <span className="text-sm font-bold text-[#0B63F6]">
                      {time12.period}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 mt-1.5">
                    <span className="text-xs font-bold text-slate-200">
                      {lang === 'bn' ? alarm.labelBn : alarm.labelEn}
                    </span>
                    <span className="text-slate-500 text-xs">•</span>
                    <span className="text-xs text-slate-400 font-medium">
                      {scheduleText}
                    </span>
                  </div>

                  <div className="mt-1 flex items-center gap-1.5 text-[11px] font-medium text-emerald-400">
                    <Clock className="w-3 h-3 text-emerald-400 shrink-0" />
                    <span>{countdownText}</span>
                  </div>
                </div>

                {/* Right side: Edit, Delete & Blue Toggle Switch */}
                <div className="flex items-center gap-3 ml-4 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(alarm)}
                    className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
                    title={lang === 'bn' ? 'সম্পাদনা করুন' : 'Edit alarm'}
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(alarm.id)}
                    className="p-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-950/30 transition"
                    title={lang === 'bn' ? 'মুছে ফেলুন' : 'Delete alarm'}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  {/* Blue Toggle Switch */}
                  <button
                    type="button"
                    role="switch"
                    aria-checked={alarm.enabled}
                    onClick={() => handleToggle(alarm.id)}
                    className={`w-13 h-7.5 rounded-full p-1 transition-colors duration-200 ease-in-out relative flex items-center cursor-pointer ${
                      alarm.enabled ? 'bg-[#0B63F6]' : 'bg-slate-700'
                    }`}
                  >
                    <div
                      className={`w-5.5 h-5.5 rounded-full bg-white shadow-md transform transition-transform duration-200 ease-in-out ${
                        alarm.enabled ? 'translate-x-5.5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Floating Plus Action Button */}
      <div className="fixed bottom-22 right-5 z-30">
        <button
          type="button"
          onClick={handleOpenAdd}
          className="w-14 h-14 rounded-full bg-[#0B63F6] hover:bg-blue-600 text-white flex items-center justify-center shadow-2xl shadow-blue-900/60 active:scale-95 transition border-2 border-blue-400/30 cursor-pointer"
          title={lang === 'bn' ? 'নতুন অ্যালার্ম যোগ করুন' : 'Add Alarm'}
        >
          <Plus className="w-7 h-7 stroke-[3]" />
        </button>
      </div>

      {/* 4. AdMob Banner Placement at bottom of the Alarm screen (Strictly NOT on ringing screen) */}
      <div className="mt-8 pt-4 border-t border-slate-800/80 rounded-2xl overflow-hidden">
        <AdMobBanner lang={lang} />
      </div>

      {/* Modals */}
      {showAddEditModal && (
        <AddEditAlarmModal
          alarm={editingAlarm}
          lang={lang}
          onSave={handleSaveAlarm}
          onClose={() => setShowAddEditModal(false)}
        />
      )}

      {showSettingsModal && (
        <AlarmSettingsModal
          lang={lang}
          onClose={() => setShowSettingsModal(false)}
        />
      )}

      {/* Edit System Time Dialog */}
      {showSystemTimeDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md rounded-3xl bg-[#091527] border border-slate-700 shadow-2xl p-5 sm:p-6 text-slate-100 space-y-4">
            <div className="flex items-center gap-2.5 pb-2 border-b border-slate-800">
              <Clock className="w-5 h-5 text-[#0B63F6]" />
              <h3 className="font-black text-base text-white">
                {lang === 'bn' ? 'সিস্টেম তারিখ ও সময়' : 'System Date & Time'}
              </h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {lang === 'bn'
                ? 'অ্যান্ড্রয়েড অপারেটিং সিস্টেমের নিরাপত্তা বিধির কারণে সময় পরিবর্তন আপনার মোবাইলের প্রধান Settings > System > Date & time থেকে করতে হবে।'
                : 'Android requires system time to be changed in Phone Settings > System > Date & Time.'}
            </p>
            <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-xs font-mono text-center text-slate-200">
              {currentTime.toString()}
            </div>
            <button
              type="button"
              onClick={() => setShowSystemTimeDialog(false)}
              className="w-full py-2.5 rounded-xl bg-[#0B63F6] text-white font-bold text-xs cursor-pointer"
            >
              {lang === 'bn' ? 'ঠিক আছে' : 'OK'}
            </button>
          </div>
        </div>
      )}

      {/* Android Lockscreen Guide Dialog */}
      {showAndroidGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-[#091527] border border-slate-700 shadow-2xl p-5 sm:p-6 text-slate-100 max-h-[92vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <span className="text-xl">📱</span>
                <div>
                  <h3 className="font-black text-base text-white">
                    {lang === 'bn' ? 'লক স্ক্রিন ও ব্যাকগ্রাউন্ড ডিসপ্লে গাইড' : 'Lock Screen & Background Guide'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Xiaomi, Redmi, Poco, Realme, Vivo, Oppo & Samsung
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAndroidGuideModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs leading-relaxed">
              <div className="p-3 rounded-2xl bg-[#0F1E36] border border-slate-800 space-y-1">
                <span className="font-bold text-[#0B63F6]">১. Show on Lock screen (লক স্ক্রিনে প্রদর্শন)</span>
                <p className="text-slate-300 text-[11px]">
                  {lang === 'bn'
                    ? 'ফোনের Settings > Apps > Manage Apps > SmartHub এ গিয়ে Permissions থেকে "Show on Lock screen" চালু করুন।'
                    : 'Open Phone Settings > Apps > SmartHub > Other Permissions > Enable "Show on Lock screen".'}
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-[#0F1E36] border border-slate-800 space-y-1">
                <span className="font-bold text-emerald-400">২. Display pop-up windows (পপ-আপ প্রদর্শন)</span>
                <p className="text-slate-300 text-[11px]">
                  {lang === 'bn'
                    ? '"Display pop-up windows while running in the background" চালু করুন, যেন অন্য অ্যাপে থাকলেও অ্যালার্ম সরাসরি ভেসে ওঠে।'
                    : 'Enable "Display pop-up windows while running in the background" to show ringing alarm over other apps.'}
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-[#0F1E36] border border-slate-800 space-y-1">
                <span className="font-bold text-amber-400">৩. Battery Saver (ব্যাটারি সেভার)</span>
                <p className="text-slate-300 text-[11px]">
                  {lang === 'bn'
                    ? 'Battery Saver এ "No restrictions" নির্বাচন করুন যেন ব্যাকগ্রাউন্ডে অ্যালার্ম সার্ভিস চালু থাকে।'
                    : 'Set Battery Saver to "No restrictions" so the app remains awake for alarms.'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowAndroidGuideModal(false)}
              className="w-full py-2.5 rounded-xl bg-[#0B63F6] text-white font-bold text-xs cursor-pointer"
            >
              {lang === 'bn' ? 'বুঝেছি (বন্ধ করুন)' : 'Got it (Close)'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
