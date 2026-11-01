import React, { useState, useEffect, useRef } from 'react';
import {
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
  Edit3,
  BellRing,
  Moon,
  HelpCircle,
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

  // Modals
  const [showAddEditModal, setShowAddEditModal] = useState<boolean>(false);
  const [editingAlarm, setEditingAlarm] = useState<AlarmItem | null>(null);
  const [showThreeDotMenu, setShowThreeDotMenu] = useState<boolean>(false);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [showSystemTimeDialog, setShowSystemTimeDialog] = useState<boolean>(false);
  const [showAndroidGuideModal, setShowAndroidGuideModal] = useState<boolean>(false);

  // Quick 5s Lockscreen Countdown Test
  const [countdownLockTest, setCountdownLockTest] = useState<number | null>(null);
  const countdownIntervalRef = useRef<number | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Close three-dot menu on outside click
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowThreeDotMenu(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  // Update current live time every second
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
    const isWeekdays =
      repeatDays.length === 5 && [1, 2, 3, 4, 5].every((d) => repeatDays.includes(d));
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

  // Diagnostic Test functions
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
      snoozeEnabled: true,
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
    <div className="min-h-[85vh] bg-black text-white flex flex-col justify-between max-w-md mx-auto relative select-none">
      {/* 1. Top Bar: Title, Live Digital Time, & Vertical Three-Dot Menu */}
      <div className="p-4 flex items-center justify-between border-b border-neutral-900 sticky top-0 bg-black/90 backdrop-blur-md z-20">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white">
            {lang === 'bn' ? 'অ্যালার্ম' : 'Alarm'}
          </h2>
          <span className="text-[11px] font-mono text-neutral-400">
            {toBn(currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }))}
          </span>
        </div>

        {/* Three-Dot Menu */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setShowThreeDotMenu(!showThreeDotMenu)}
            className="p-2.5 rounded-full hover:bg-neutral-900 text-neutral-300 hover:text-white transition cursor-pointer"
            title="More options"
          >
            <MoreVertical className="w-5 h-5" />
          </button>

          {showThreeDotMenu && (
            <div className="absolute right-0 top-12 z-50 w-64 rounded-2xl bg-[#141822] border border-neutral-800 shadow-2xl py-2 text-xs font-medium backdrop-blur-xl animate-fade-in divide-y divide-neutral-800">
              <div className="py-1">
                <button
                  type="button"
                  onClick={() => handleMenuAction('settings')}
                  className="w-full px-4 py-2.5 text-left text-neutral-200 hover:bg-[#0B63F6]/20 hover:text-white flex items-center justify-between transition cursor-pointer"
                >
                  <span>{lang === 'bn' ? '১. অ্যালার্ম সেটিংস' : '1. Alarm Settings'}</span>
                  <SettingsIcon className="w-3.5 h-3.5 text-neutral-400" />
                </button>

                <button
                  type="button"
                  onClick={() => handleMenuAction('edit_time')}
                  className="w-full px-4 py-2.5 text-left text-neutral-200 hover:bg-[#0B63F6]/20 hover:text-white flex items-center justify-between transition cursor-pointer"
                >
                  <span>{lang === 'bn' ? '২. সিস্টেম সময় পরিবর্তন' : '2. Edit System Time'}</span>
                  <Clock className="w-3.5 h-3.5 text-neutral-400" />
                </button>
              </div>

              <div className="py-1">
                <button
                  type="button"
                  onClick={() => handleMenuAction('ringtone')}
                  className="w-full px-4 py-2.5 text-left text-neutral-200 hover:bg-[#0B63F6]/20 hover:text-white flex items-center justify-between transition cursor-pointer"
                >
                  <span>{lang === 'bn' ? '৩. অ্যালার্ম রিংটোন' : '3. Alarm Ringtone'}</span>
                  <Music className="w-3.5 h-3.5 text-neutral-400" />
                </button>

                <button
                  type="button"
                  onClick={() => handleMenuAction('timer_ringtone')}
                  className="w-full px-4 py-2.5 text-left text-neutral-200 hover:bg-[#0B63F6]/20 hover:text-white flex items-center justify-between transition cursor-pointer"
                >
                  <span>{lang === 'bn' ? '৪. টাইমার রিংটোন' : '4. Timer Ringtone'}</span>
                  <Timer className="w-3.5 h-3.5 text-neutral-400" />
                </button>

                <button
                  type="button"
                  onClick={() => handleMenuAction('volume')}
                  className="w-full px-4 py-2.5 text-left text-neutral-200 hover:bg-[#0B63F6]/20 hover:text-white flex items-center justify-between transition cursor-pointer"
                >
                  <span>{lang === 'bn' ? '৫. রিংটোন ভলিউম' : '5. Ringtone Volume'}</span>
                  <Volume2 className="w-3.5 h-3.5 text-neutral-400" />
                </button>

                <button
                  type="button"
                  onClick={() => handleMenuAction('auto_silence')}
                  className="w-full px-4 py-2.5 text-left text-neutral-200 hover:bg-[#0B63F6]/20 hover:text-white flex items-center justify-between transition cursor-pointer"
                >
                  <span>{lang === 'bn' ? '৬. অটো-সাইলেন্স' : '6. Auto-silence'}</span>
                  <VolumeX className="w-3.5 h-3.5 text-neutral-400" />
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

      {/* 2. Simple Test & Verification Toolbar */}
      <div className="px-4 py-2 flex items-center justify-end gap-2 bg-neutral-950 border-b border-neutral-900 text-xs">
        <button
          type="button"
          onClick={handleTestDisplay}
          className="px-2.5 py-1 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-300 flex items-center gap-1 border border-neutral-800 transition active:scale-95"
          title="Display Test"
        >
          <BellRing className="w-3 h-3 text-[#0B63F6]" />
          <span>{lang === 'bn' ? 'ডিসপ্লে টেস্ট' : 'Display Test'}</span>
        </button>

        <button
          type="button"
          onClick={start5sTest}
          className="px-2.5 py-1 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-300 flex items-center gap-1 border border-neutral-800 transition active:scale-95"
          title="Lock Screen 5s Test"
        >
          <Moon className="w-3 h-3 text-purple-400" />
          <span>{lang === 'bn' ? 'লক টেস্ট (৫ সে)' : 'Lock Test (5s)'}</span>
        </button>

        <button
          type="button"
          onClick={() => setShowAndroidGuideModal(true)}
          className="p-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-800 transition"
          title="Guide"
        >
          <HelpCircle className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 5s Countdown Toast */}
      {countdownLockTest !== null && (
        <div className="m-4 p-4 rounded-2xl bg-purple-950/90 text-white border-2 border-purple-500 shadow-xl flex items-center justify-between gap-3 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center font-black text-xl text-white">
              {toBn(countdownLockTest)}
            </div>
            <div>
              <h5 className="font-bold text-xs text-purple-100">
                {lang === 'bn' ? 'দ্রুত স্ক্রিন অফ বা লক করুন!' : 'Turn off screen or lock phone now!'}
              </h5>
              <p className="text-[11px] text-purple-200">
                {lang === 'bn'
                  ? `${toBn(countdownLockTest)} সেকেন্ড পর অ্যালার্ম বাজবে।`
                  : `Alarm will ring in ${countdownLockTest} seconds.`}
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

      {/* 3. Android Clock-Style Alarm List */}
      <div className="flex-1 divide-y divide-neutral-900 overflow-y-auto">
        {alarms.length === 0 ? (
          <div className="py-20 text-center text-neutral-500">
            <Clock className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p className="text-sm font-medium">
              {lang === 'bn' ? 'কোনো অ্যালার্ম সেট করা নেই' : 'No alarms set'}
            </p>
            <button
              type="button"
              onClick={handleOpenAdd}
              className="mt-3 text-xs font-bold text-[#0B63F6] hover:underline"
            >
              {lang === 'bn' ? '+ নতুন অ্যালার্ম যোগ করুন' : '+ Add an alarm'}
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
                className={`px-4 py-4.5 flex items-center justify-between transition-colors ${
                  alarm.enabled ? 'hover:bg-neutral-950/80' : 'opacity-40 hover:bg-neutral-950/40'
                }`}
              >
                {/* Left side: Large Time, AM/PM, Repeat Days & Countdown */}
                <div
                  className="min-w-0 flex-1 cursor-pointer"
                  onClick={() => handleOpenEdit(alarm)}
                >
                  {/* Large Time Display (Clean Android Clock style) */}
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-light font-mono tracking-tight text-white">
                      {toBn(time12.hour)}:{toBn(time12.minute)}
                    </span>
                    <span className="text-sm font-medium text-neutral-400">
                      {time12.period}
                    </span>
                  </div>

                  {/* Alarm Label and Repeat Schedule */}
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-medium text-neutral-300 truncate max-w-[150px]">
                      {lang === 'bn' ? alarm.labelBn : alarm.labelEn}
                    </span>
                    <span className="text-neutral-600 text-xs">•</span>
                    <span className="text-xs text-neutral-400">
                      {scheduleText}
                    </span>
                  </div>

                  {/* Next Alarm Countdown */}
                  <div className="mt-1 text-[11px] text-neutral-500 font-medium">
                    {countdownText}
                  </div>
                </div>

                {/* Right side: Actions & Blue Switch */}
                <div className="flex items-center gap-3 ml-3 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(alarm)}
                    className="p-2 text-neutral-500 hover:text-neutral-200 transition"
                    title={lang === 'bn' ? 'সম্পাদনা' : 'Edit'}
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(alarm.id)}
                    className="p-2 text-neutral-500 hover:text-red-400 transition"
                    title={lang === 'bn' ? 'মুছে ফেলুন' : 'Delete'}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  {/* Classic Android Blue ON/OFF Switch */}
                  <button
                    type="button"
                    role="switch"
                    aria-checked={alarm.enabled}
                    onClick={() => handleToggle(alarm.id)}
                    className={`w-12 h-7 rounded-full p-0.5 transition-colors duration-200 relative flex items-center cursor-pointer ${
                      alarm.enabled ? 'bg-[#0B63F6]' : 'bg-neutral-700'
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-full bg-white shadow-md transform transition-transform duration-200 ${
                        alarm.enabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 4. Bottom Controls: Floating + Button & AdMob Banner */}
      <div className="sticky bottom-0 bg-black/95 border-t border-neutral-900 pt-3 pb-safe z-10 flex flex-col items-center">
        {/* Simple Blue Circular Plus Action Button */}
        <button
          type="button"
          onClick={handleOpenAdd}
          className="w-14 h-14 rounded-full bg-[#0B63F6] hover:bg-blue-600 text-white flex items-center justify-center shadow-xl active:scale-95 transition mb-3 cursor-pointer"
          title={lang === 'bn' ? 'নতুন অ্যালার্ম' : 'Add Alarm'}
        >
          <Plus className="w-7 h-7 stroke-[2.5]" />
        </button>

        {/* Small Responsive AdMob Banner at bottom of Main Alarm Screen */}
        <div className="w-full">
          <AdMobBanner lang={lang} />
        </div>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in select-none">
          <div className="w-full max-w-sm rounded-3xl bg-[#10141D] border border-neutral-800 shadow-2xl p-5 text-white space-y-4">
            <div className="flex items-center gap-2.5 pb-2 border-b border-neutral-800">
              <Clock className="w-5 h-5 text-[#0B63F6]" />
              <h3 className="font-bold text-base text-white">
                {lang === 'bn' ? 'সিস্টেম সময় পরিবর্তন' : 'System Date & Time'}
              </h3>
            </div>

            <p className="text-xs text-neutral-300 leading-relaxed">
              {lang === 'bn'
                ? 'অ্যান্ড্রয়েড অপারেটিং সিস্টেমের নিরাপত্তা বিধির কারণে তারিখ ও সময় পরিবর্তন আপনার মোবাইলের Settings > System > Date & time থেকে করতে হবে।'
                : 'Android requires system date and time to be adjusted in Phone Settings > System > Date & Time.'}
            </p>

            <div className="p-3 rounded-2xl bg-black border border-neutral-800 text-xs font-mono text-center text-neutral-300">
              {currentTime.toString()}
            </div>

            <button
              type="button"
              onClick={() => setShowSystemTimeDialog(false)}
              className="w-full py-2.5 rounded-xl bg-[#0B63F6] text-white font-bold text-xs"
            >
              {lang === 'bn' ? 'ঠিক আছে' : 'OK'}
            </button>
          </div>
        </div>
      )}

      {/* Android Lockscreen Permission Guide Modal */}
      {showAndroidGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in select-none">
          <div className="w-full max-w-md rounded-3xl bg-[#10141D] border border-neutral-800 shadow-2xl p-5 text-white max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <span className="text-xl">📱</span>
                <h3 className="font-bold text-base text-white">
                  {lang === 'bn' ? 'লক স্ক্রিন অ্যালার্ম গাইড' : 'Lock Screen Alarm Guide'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAndroidGuideModal(false)}
                className="p-1.5 rounded-xl text-neutral-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs leading-relaxed">
              <div className="p-3 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-1">
                <span className="font-bold text-[#0B63F6]">১. Show on Lock screen (লক স্ক্রিনে প্রদর্শন)</span>
                <p className="text-neutral-300 text-[11px]">
                  {lang === 'bn'
                    ? 'ফোনের Settings > Apps > Manage Apps > SmartHub এ গিয়ে Permissions থেকে "Show on Lock screen" চালু করুন।'
                    : 'Open Phone Settings > Apps > SmartHub > Other Permissions > Enable "Show on Lock screen".'}
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-1">
                <span className="font-bold text-emerald-400">২. Display pop-up windows (পপ-আপ প্রদর্শন)</span>
                <p className="text-neutral-300 text-[11px]">
                  {lang === 'bn'
                    ? '"Display pop-up windows while running in the background" চালু করুন, যেন অন্য অ্যাপে থাকলেও অ্যালার্ম সরাসরি ভেসে ওঠে।'
                    : 'Enable "Display pop-up windows while running in the background" to show ringing alarm over other apps.'}
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-1">
                <span className="font-bold text-amber-400">৩. Battery Saver (ব্যাটারি সেভার)</span>
                <p className="text-neutral-300 text-[11px]">
                  {lang === 'bn'
                    ? 'Battery Saver এ "No restrictions" নির্বাচন করুন যেন ব্যাকগ্রাউন্ডে অ্যালার্ম সার্ভিস চালু থাকে।'
                    : 'Set Battery Saver to "No restrictions" so the app remains awake for alarms.'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowAndroidGuideModal(false)}
              className="w-full py-2.5 rounded-xl bg-[#0B63F6] text-white font-bold text-xs"
            >
              {lang === 'bn' ? 'বুঝেছি (বন্ধ করুন)' : 'Got it (Close)'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
