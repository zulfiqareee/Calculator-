import React, { useState, useMemo, useRef } from 'react';
import {
  ArrowLeft,
  MoreVertical,
  Calendar,
  Camera,
  FileText,
  Download,
  Bell,
  Share2,
  Trash2,
  Edit2,
  Phone,
  Check,
  X,
  Plus,
  AlertCircle,
  Eye,
  Printer,
  Copy,
  MessageSquare,
  ChevronRight,
  ExternalLink,
  Info,
  Send,
} from 'lucide-react';
import { Customer, Transaction, ShopProfile, toBn, formatMoney } from './TallyKhataView';

interface CustomerLedgerDetailViewProps {
  customer: Customer;
  shop: ShopProfile;
  transactions: Transaction[];
  initialScreen?: 'entry' | 'report';
  onBack: () => void;
  onSaveTransaction: (txData: {
    type: 'sale_due' | 'due_collection';
    amount: number;
    note?: string;
    date: string;
    photoUrl?: string;
  }) => void;
  onUpdateTransaction: (updatedTx: Transaction) => void;
  onDeleteTransaction: (txId: string) => void;
  onUpdateCustomer: (updatedCust: Customer) => void;
  onDeleteCustomer: (custId: string) => void;
}

// Bengali month names
const BENGALI_MONTHS = [
  'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
  'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
];

export function formatBnDateFull(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const day = toBn(parseInt(parts[2], 10).toString().padStart(2, '0'));
  const monthIdx = parseInt(parts[1], 10) - 1;
  const month = BENGALI_MONTHS[monthIdx] || '';
  const year = toBn(parts[0]);
  return `${day} ${month}, ${year}`;
}

export function formatBnDateShort(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const day = toBn(parseInt(parts[2], 10).toString().padStart(2, '0'));
  const monthIdx = parseInt(parts[1], 10) - 1;
  const month = BENGALI_MONTHS[monthIdx] || '';
  return `${day} ${month}`;
}

export function formatBnTime(timeStr: string): string {
  if (!timeStr) return '';
  const parts = timeStr.split(':');
  if (parts.length < 2) return timeStr;
  let h = parseInt(parts[0], 10);
  const m = parts[1];
  const ampm = h >= 12 ? 'PM' : 'AM';
  if (h > 12) h -= 12;
  if (h === 0) h = 12;
  return `${toBn(h.toString().padStart(2, '0'))}:${toBn(m)} ${ampm}`;
}

export function getCustomerInitials(name: string): string {
  if (!name) return 'SE';
  const trimmed = name.trim();
  const words = trimmed.split(/\s+/);
  if (words.length >= 2) {
    const first = words[0][0] || '';
    const second = words[1][0] || '';
    return (first + second).toUpperCase();
  }
  return trimmed.slice(0, 2).toUpperCase();
}

export const CustomerLedgerDetailView: React.FC<CustomerLedgerDetailViewProps> = ({
  customer,
  shop,
  transactions,
  initialScreen = 'entry',
  onBack,
  onSaveTransaction,
  onUpdateTransaction,
  onDeleteTransaction,
  onUpdateCustomer,
  onDeleteCustomer,
}) => {
  // Current screen: 'entry' (Screen 1) or 'report' (Screen 2)
  const [currentScreen, setCurrentScreen] = useState<'entry' | 'report'>(initialScreen);

  // Screen 1 Form State
  const [activeEntryType, setActiveEntryType] = useState<'sale_due' | 'due_collection'>('sale_due');
  const [debitAmount, setDebitAmount] = useState<string>(''); // দিলাম / বেচা
  const [creditAmount, setCreditAmount] = useState<string>(''); // পেলাম
  const [noteText, setNoteText] = useState<string>('');
  const [entryDate, setEntryDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [attachedPhoto, setAttachedPhoto] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [showThreeDotMenu, setShowThreeDotMenu] = useState<boolean>(false);
  const [entrySuccessToast, setEntrySuccessToast] = useState<string | null>(null);

  // Screen 2 State
  const [showInfoBanner, setShowInfoBanner] = useState<boolean>(true);
  const [reportShareActive, setReportShareActive] = useState<boolean>(false);
  const [showTagadaModal, setShowTagadaModal] = useState<boolean>(false);
  const [showDownloadModal, setShowDownloadModal] = useState<boolean>(false);
  const [copiedTagadaMsg, setCopiedTagadaMsg] = useState<boolean>(false);

  // Edit / Delete Transaction Modal State
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [editAmount, setEditAmount] = useState<string>('');
  const [editType, setEditType] = useState<'sale_due' | 'due_collection'>('sale_due');
  const [editNote, setEditNote] = useState<string>('');
  const [editDate, setEditDate] = useState<string>('');
  const [editPhoto, setEditPhoto] = useState<string | null>(null);
  const [showDeleteTxConfirm, setShowDeleteTxConfirm] = useState<boolean>(false);

  // Customer Edit / Delete Modal State
  const [showEditCustomerModal, setShowEditCustomerModal] = useState<boolean>(false);
  const [editCustName, setEditCustName] = useState<string>(customer.name);
  const [editCustPhone, setEditCustPhone] = useState<string>(customer.phone);
  const [editCustAddress, setEditCustAddress] = useState<string>(customer.address || '');
  const [showDeleteCustomerConfirm, setShowDeleteCustomerConfirm] = useState<boolean>(false);

  // Photo viewer modal
  const [viewingPhotoUrl, setViewingPhotoUrl] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);
  const printStatementRef = useRef<HTMLDivElement>(null);

  // Filter transactions for this customer
  const customerTxs = useMemo(() => {
    return transactions
      .filter((t) => t.customerId === customer.id)
      .sort((a, b) => {
        // Chronological order (oldest to newest for calculating running balance)
        const dateA = new Date(`${a.date}T${a.time || '00:00'}`).getTime();
        const dateB = new Date(`${b.date}T${b.time || '00:00'}`).getTime();
        return dateA - dateB;
      });
  }, [transactions, customer.id]);

  // Compute running balance for each transaction chronologically
  const txsWithRunningBalance = useMemo(() => {
    let running = 0;
    return customerTxs.map((tx) => {
      if (tx.type === 'sale_due') {
        running += tx.amount;
      } else if (tx.type === 'due_collection') {
        running -= tx.amount;
      }
      return {
        ...tx,
        runningDue: running,
      };
    });
  }, [customerTxs]);

  // Calculate totals for report
  const reportTotals = useMemo(() => {
    let totalDebit = 0; // দিলাম
    let totalCredit = 0; // পেলাম
    customerTxs.forEach((tx) => {
      if (tx.type === 'sale_due') totalDebit += tx.amount;
      else if (tx.type === 'due_collection') totalCredit += tx.amount;
    });
    return { totalDebit, totalCredit };
  }, [customerTxs]);

  // Relative last activity tag (e.g. "(২ দিন আগে)" or "(আজকে)")
  const lastActivityTag = useMemo(() => {
    if (customerTxs.length === 0) return '(কোনো লেনদেন নেই)';
    const latest = customerTxs[customerTxs.length - 1];
    const txDate = new Date(latest.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    txDate.setHours(0, 0, 0, 0);
    const diffDays = Math.round((today.getTime() - txDate.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return '(আজকে)';
    if (diffDays === 1) return '(গতকাল)';
    return `(${toBn(diffDays)} দিন আগে)`;
  }, [customerTxs]);

  // Handle Photo Picker
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>, isEdit = false) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        if (isEdit) {
          setEditPhoto(reader.result);
        } else {
          setAttachedPhoto(reader.result);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  // Submit Screen 1 Transaction
  const handleConfirmEntry = () => {
    let amount = 0;
    let type: 'sale_due' | 'due_collection' = 'sale_due';

    if (activeEntryType === 'sale_due') {
      amount = parseFloat(debitAmount);
      type = 'sale_due';
    } else {
      amount = parseFloat(creditAmount);
      type = 'due_collection';
    }

    if (isNaN(amount) || amount <= 0) {
      alert('অনুগ্রহ করে টাকার পরিমাণ সঠিকভাবে লিখুন।');
      return;
    }

    onSaveTransaction({
      type,
      amount,
      note: noteText.trim() || undefined,
      date: entryDate,
      photoUrl: attachedPhoto || undefined,
    });

    // Reset fields
    setDebitAmount('');
    setCreditAmount('');
    setNoteText('');
    setAttachedPhoto(null);

    // Toast
    setEntrySuccessToast(
      type === 'sale_due'
        ? `৳ ${formatMoney(amount)} বাকি দিলাম সফলভাবে যুক্ত হয়েছে!`
        : `৳ ${formatMoney(amount)} জমা পেলাম সফলভাবে যুক্ত হয়েছে!`
    );
    setTimeout(() => setEntrySuccessToast(null), 3000);
  };

  // Open Edit Modal for a Transaction
  const handleOpenEditTx = (tx: Transaction) => {
    setEditingTx(tx);
    setEditAmount(tx.amount.toString());
    setEditType(tx.type === 'due_collection' ? 'due_collection' : 'sale_due');
    setEditNote(tx.note || '');
    setEditDate(tx.date);
    setEditPhoto(tx.photoUrl || null);
    setShowDeleteTxConfirm(false);
  };

  // Save Transaction Edit
  const handleSaveTxEdit = () => {
    if (!editingTx) return;
    const amountNum = parseFloat(editAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      alert('সঠিক টাকার পরিমাণ লিখুন।');
      return;
    }

    const updated: Transaction = {
      ...editingTx,
      amount: amountNum,
      type: editType,
      note: editNote.trim() || undefined,
      date: editDate || editingTx.date,
      photoUrl: editPhoto || undefined,
    };

    onUpdateTransaction(updated);
    setEditingTx(null);
  };

  // Delete Transaction
  const handleConfirmDeleteTx = () => {
    if (!editingTx) return;
    onDeleteTransaction(editingTx.id);
    setEditingTx(null);
    setShowDeleteTxConfirm(false);
  };

  // Save Customer Info Edit
  const handleSaveCustomerInfo = () => {
    if (!editCustName.trim()) {
      alert('কাস্টমারের নাম লিখুন।');
      return;
    }
    const updatedCust: Customer = {
      ...customer,
      name: editCustName.trim(),
      phone: editCustPhone.trim() || customer.phone,
      address: editCustAddress.trim() || undefined,
    };
    onUpdateCustomer(updatedCust);
    setShowEditCustomerModal(false);
  };

  // Confirm Delete Customer
  const handleConfirmDeleteCustomer = () => {
    onDeleteCustomer(customer.id);
    setShowDeleteCustomerConfirm(false);
    onBack();
  };

  // Send / Copy Tagada Message
  const getTagadaText = () => {
    const dueAmount = formatMoney(customer.balance);
    return `প্রিয় ${customer.name}, ${shop.name}-এ আপনার বকেয়া হিসাব ৳ ${dueAmount}। অনুগ্রহ করে বকেয়া পরিশোধ করার অনুরোধ রইল। যোগাযোগ: ${shop.phone}। ধন্যবাদ।`;
  };

  const handleCopyTagadaText = () => {
    navigator.clipboard.writeText(getTagadaText());
    setCopiedTagadaMsg(true);
    setTimeout(() => setCopiedTagadaMsg(false), 2500);
  };

  const initials = getCustomerInitials(customer.name);

  return (
    <div className="flex flex-col min-h-[640px] bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 rounded-3xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 relative select-none">
      {/* Hidden File Input for Receipt / Voucher Photo */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        onChange={(e) => handlePhotoSelect(e, false)}
        className="hidden"
      />
      <input
        type="file"
        ref={editFileInputRef}
        accept="image/*"
        onChange={(e) => handlePhotoSelect(e, true)}
        className="hidden"
      />

      {/* ======================================================== */}
      {/* SCREEN 1: TRANSACTION ENTRY SCREEN (১ নম্বরের মতো)        */}
      {/* ======================================================== */}
      {currentScreen === 'entry' && (
        <div className="flex flex-col flex-1 justify-between p-4 sm:p-5 bg-white dark:bg-slate-950 animate-fadeIn">
          {/* Top Header Row */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onBack}
                  className="p-2 -ml-1 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                  title="ফিরে যান"
                >
                  <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
                </button>

                {/* Orange Circular Initials Badge */}
                <div className="w-10 h-10 rounded-full bg-orange-500 text-white font-bold text-sm flex items-center justify-center shadow-xs shrink-0 tracking-wider">
                  {initials}
                </div>

                <div className="flex flex-col">
                  <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-tight">
                    {customer.name}
                  </h2>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {customer.phone}
                  </span>
                </div>
              </div>

              {/* Three-Dot Menu */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowThreeDotMenu(!showThreeDotMenu)}
                  className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  <MoreVertical className="w-5 h-5" />
                </button>

                {showThreeDotMenu && (
                  <div
                    className="absolute right-0 top-10 w-52 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 py-1.5 z-50 text-xs font-semibold animate-fadeIn"
                    onClick={() => setShowThreeDotMenu(false)}
                  >
                    <a
                      href={`tel:${customer.phone}`}
                      className="w-full px-4 py-2.5 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2.5 transition"
                    >
                      <Phone className="w-4 h-4 text-emerald-500" />
                      <span>কল করুন ({customer.phone})</span>
                    </a>

                    <button
                      type="button"
                      onClick={() => {
                        setEditCustName(customer.name);
                        setEditCustPhone(customer.phone);
                        setEditCustAddress(customer.address || '');
                        setShowEditCustomerModal(true);
                      }}
                      className="w-full px-4 py-2.5 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2.5 transition cursor-pointer"
                    >
                      <Edit2 className="w-4 h-4 text-blue-500" />
                      <span>কাস্টমার তথ্য এডিট করুন</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCurrentScreen('report')}
                      className="w-full px-4 py-2.5 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2.5 transition cursor-pointer"
                    >
                      <FileText className="w-4 h-4 text-indigo-500" />
                      <span>সম্পূর্ণ রিপোর্ট দেখুন</span>
                    </button>

                    <div className="border-t border-slate-100 dark:border-slate-800 my-1" />

                    <button
                      type="button"
                      onClick={() => setShowDeleteCustomerConfirm(true)}
                      className="w-full px-4 py-2.5 text-left text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2.5 transition cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4 text-rose-600" />
                      <span>কাস্টমার ডিলিট করুন</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Balance & Report Button Row */}
            <div className="flex items-center justify-between pt-2">
              <div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {customer.balance >= 0 ? 'পাবো' : 'দেবো'}
                  </span>
                  <span
                    className={`text-lg sm:text-xl font-black ${
                      customer.balance > 0
                        ? 'text-red-600 dark:text-red-400'
                        : customer.balance < 0
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    ৳ {formatMoney(customer.balance)}
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 block font-medium">
                  {lastActivityTag}
                </span>
              </div>

              {/* [📋 রিপোর্ট] Button */}
              <button
                type="button"
                onClick={() => setCurrentScreen('report')}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 transition shadow-2xs cursor-pointer"
              >
                <FileText className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                <span>রিপোর্ট</span>
              </button>
            </div>

            {/* Amount Input Row: [ ৳ দিলাম/বেচা ]  [ ৳ পেলাম ] */}
            <div className="grid grid-cols-2 gap-3 pt-4">
              {/* Left Box: দিলাম / বেচা */}
              <div
                onClick={() => {
                  setActiveEntryType('sale_due');
                  setCreditAmount('');
                }}
                className={`p-3.5 rounded-2xl border-2 transition-all cursor-text flex flex-col justify-center ${
                  activeEntryType === 'sale_due'
                    ? 'border-slate-800 dark:border-slate-200 bg-white dark:bg-slate-900 shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60'
                }`}
              >
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1">
                  ৳ দিলাম/বেচা
                </label>
                <input
                  type="number"
                  inputMode="decimal"
                  value={debitAmount}
                  onChange={(e) => {
                    setDebitAmount(e.target.value);
                    setCreditAmount('');
                    setActiveEntryType('sale_due');
                  }}
                  onFocus={() => {
                    setActiveEntryType('sale_due');
                    setCreditAmount('');
                  }}
                  placeholder="০.০০"
                  className="w-full text-lg sm:text-xl font-black bg-transparent text-slate-900 dark:text-white placeholder-slate-300 dark:placeholder-slate-700 focus:outline-none"
                />
              </div>

              {/* Right Box: পেলাম */}
              <div
                onClick={() => {
                  setActiveEntryType('due_collection');
                  setDebitAmount('');
                }}
                className={`p-3.5 rounded-2xl border-2 transition-all cursor-text flex flex-col justify-center ${
                  activeEntryType === 'due_collection'
                    ? 'border-emerald-600 dark:border-emerald-400 bg-white dark:bg-slate-900 shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60'
                }`}
              >
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1">
                  ৳ পেলাম
                </label>
                <input
                  type="number"
                  inputMode="decimal"
                  value={creditAmount}
                  onChange={(e) => {
                    setCreditAmount(e.target.value);
                    setDebitAmount('');
                    setActiveEntryType('due_collection');
                  }}
                  onFocus={() => {
                    setActiveEntryType('due_collection');
                    setDebitAmount('');
                  }}
                  placeholder="০.০০"
                  className="w-full text-lg sm:text-xl font-black bg-transparent text-slate-900 dark:text-white placeholder-slate-300 dark:placeholder-slate-700 focus:outline-none"
                />
              </div>
            </div>

            {/* Note / Description Box: [ 📝 বিবরণ ] */}
            <div className="pt-2">
              <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus-within:border-slate-700 dark:focus-within:border-slate-300 transition flex items-center gap-2.5">
                <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                <input
                  type="text"
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="বিবরণ (যেমন: মুদি মালামাল, বিকাশ পেমেন্ট)"
                  className="w-full text-xs sm:text-sm bg-transparent text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none font-medium"
                />
              </div>
            </div>

            {/* Action Row: Date Picker Button + Photo Upload Button */}
            <div className="flex items-center justify-between pt-2">
              {/* Date Button [ 📅 ০৯ নভেম্বর ] */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowDatePicker(!showDatePicker)}
                  className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white py-1.5 px-1 cursor-pointer"
                >
                  <Calendar className="w-4 h-4 text-slate-500" />
                  <span>{formatBnDateShort(entryDate)}</span>
                </button>

                {showDatePicker && (
                  <div className="absolute left-0 top-9 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-30 flex flex-col gap-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">তারিখ পরিবর্তন:</span>
                    <input
                      type="date"
                      value={entryDate}
                      onChange={(e) => {
                        setEntryDate(e.target.value);
                        setShowDatePicker(false);
                      }}
                      className="text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-2 py-1 text-slate-800 dark:text-slate-200"
                    />
                  </div>
                )}
              </div>

              {/* Photo Button [ 📷 ছবি ] */}
              <div className="flex items-center gap-2">
                {attachedPhoto ? (
                  <div className="flex items-center gap-1.5 p-1 pl-2 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-xl text-xs font-bold text-emerald-700 dark:text-emerald-300">
                    <button
                      type="button"
                      onClick={() => setViewingPhotoUrl(attachedPhoto)}
                      className="flex items-center gap-1 hover:underline cursor-pointer"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>ছবি যুক্ত</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setAttachedPhoto(null)}
                      className="p-1 rounded-md text-emerald-600 hover:bg-emerald-200 dark:hover:bg-emerald-900"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white py-1.5 px-2 cursor-pointer"
                  >
                    <Camera className="w-4 h-4 text-slate-500" />
                    <span>ছবি</span>
                  </button>
                )}
              </div>
            </div>

            {/* Success Feedback Toast */}
            {entrySuccessToast && (
              <div className="p-3 rounded-2xl bg-emerald-500 text-white text-xs font-bold flex items-center justify-between shadow-lg animate-fadeIn">
                <span>{entrySuccessToast}</span>
                <Check className="w-4 h-4" />
              </div>
            )}
          </div>

          {/* Bottom Fixed Button: [ নিশ্চিত ] */}
          <div className="pt-6 pb-2">
            <button
              type="button"
              disabled={
                (!debitAmount.trim() && !creditAmount.trim()) ||
                (parseFloat(debitAmount) <= 0 && parseFloat(creditAmount) <= 0)
              }
              onClick={handleConfirmEntry}
              className="w-full py-3.5 sm:py-4 rounded-full bg-gradient-to-r from-pink-50 to-pink-100 dark:from-pink-950/40 dark:to-purple-950/40 border border-pink-200 dark:border-pink-800/60 hover:from-pink-100 hover:to-pink-200 dark:hover:from-pink-900/50 dark:hover:to-purple-900/50 text-slate-900 dark:text-white font-black text-sm shadow-md transition-all active:scale-98 disabled:opacity-40 disabled:pointer-events-none cursor-pointer flex items-center justify-center gap-2"
            >
              <span>নিশ্চিত</span>
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SCREEN 2: CUSTOMER STATEMENT / REPORT (২ নম্বরের মতো)     */}
      {/* ======================================================== */}
      {currentScreen === 'report' && (
        <div className="flex flex-col flex-1 bg-white dark:bg-slate-950 animate-fadeIn">
          {/* Top App Bar */}
          <div className="p-4 sm:p-5 pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setCurrentScreen('entry')}
                className="p-2 -ml-1 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                title="ফিরে যান"
              >
                <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
              </button>

              {/* Orange Avatar */}
              <div className="w-10 h-10 rounded-full bg-orange-500 text-white font-bold text-sm flex items-center justify-center shadow-xs shrink-0 tracking-wider">
                {initials}
              </div>

              <div>
                <h2 className="text-base font-black text-slate-900 dark:text-white leading-tight">
                  {customer.name}
                </h2>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="text-[11px] font-bold text-slate-500">
                    {customer.balance >= 0 ? 'পাবো' : 'দেবো'}
                  </span>
                  <span
                    className={`text-xs font-black ${
                      customer.balance > 0
                        ? 'text-red-600 dark:text-red-400'
                        : customer.balance < 0
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {formatMoney(customer.balance)}
                  </span>
                </div>
              </div>
            </div>

            {/* Top Right: [📥 ডাউনলোড] Button */}
            <button
              type="button"
              onClick={() => setShowDownloadModal(true)}
              className="flex flex-col items-center text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
            >
              <Download className="w-5 h-5" />
              <span className="text-[10px] font-bold mt-0.5">ডাউনলোড</span>
            </button>
          </div>

          {/* Quick Tagada Action Bar: [ 🔔 তাগাদা মেসেজ পাঠাই ] */}
          <div className="px-4 sm:px-5 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-center">
            <button
              type="button"
              onClick={() => setShowTagadaModal(true)}
              className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition cursor-pointer"
            >
              <Bell className="w-4 h-4 text-slate-400" />
              <span>তাগাদা মেসেজ পাঠাই</span>
            </button>
          </div>

          {/* Info Banner */}
          {showInfoBanner && (
            <div className="mx-4 sm:mx-5 my-3 p-3.5 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-100 dark:border-sky-900/50 flex items-start justify-between gap-3 text-xs text-sky-900 dark:text-sky-200">
              <div className="flex items-start gap-2.5">
                <Info className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
                <span className="font-medium leading-relaxed">
                  লেনদেন রেকর্ড এডিট/ডিলিট করতে লেনদেনের উপর ট্যাপ করুন।
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowInfoBanner(false)}
                className="p-1 rounded-lg text-sky-400 hover:text-sky-800 dark:hover:text-sky-100"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Report Share Toggle Row */}
          <div className="px-4 sm:px-5 py-2.5 flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
            <span>রিপোর্ট শেয়ার</span>
            <button
              type="button"
              onClick={() => setReportShareActive(!reportShareActive)}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                reportShareActive ? 'bg-red-500' : 'bg-slate-300 dark:bg-slate-700'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                  reportShareActive ? 'right-1' : 'left-1'
                }`}
              />
            </button>
          </div>

          {/* Report Statement Table Header */}
          <div className="px-4 sm:px-5 py-2.5 bg-slate-50 dark:bg-slate-900/80 border-y border-slate-200 dark:border-slate-800 grid grid-cols-12 text-[11px] font-black text-slate-500 uppercase tracking-wider">
            <span className="col-span-6">লেনদেনের বিবরণ</span>
            <span className="col-span-3 text-right">দিলাম</span>
            <span className="col-span-3 text-right">পেলাম</span>
          </div>

          {/* Transaction Statement Rows */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80">
            {txsWithRunningBalance.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
                <FileText className="w-8 h-8 text-slate-300" />
                <span>এই কাস্টমারের এখনও কোনো লেনদেন রেকর্ড নেই।</span>
                <button
                  type="button"
                  onClick={() => setCurrentScreen('entry')}
                  className="mt-2 text-xs font-bold text-emerald-600 hover:underline"
                >
                  + প্রথম লেনদেন যুক্ত করুন
                </button>
              </div>
            ) : (
              // Reverse chronological for viewing statement
              [...txsWithRunningBalance].reverse().map((tx) => (
                <div
                  key={tx.id}
                  onClick={() => handleOpenEditTx(tx)}
                  className="px-4 sm:px-5 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-900/60 transition cursor-pointer group"
                >
                  <div className="grid grid-cols-12 items-start gap-1">
                    {/* Left: Date, Time & Description */}
                    <div className="col-span-6 flex flex-col">
                      <span className="font-bold text-xs text-slate-900 dark:text-white">
                        {formatBnDateFull(tx.date)}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {formatBnTime(tx.time)}
                      </span>
                      {tx.note && (
                        <span className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                          {tx.note}
                        </span>
                      )}
                      {tx.photoUrl && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setViewingPhotoUrl(tx.photoUrl || null);
                          }}
                          className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-1 hover:underline"
                        >
                          <Camera className="w-3 h-3" />
                          <span>ভাউচার ফটো দেখুন</span>
                        </button>
                      )}
                    </div>

                    {/* Middle: দিলাম (Debit) */}
                    <div className="col-span-3 text-right">
                      {tx.type === 'sale_due' && (
                        <span className="font-black text-xs sm:text-sm text-red-600 dark:text-red-400">
                          {formatMoney(tx.amount)}
                        </span>
                      )}
                    </div>

                    {/* Right: পেলাম (Credit) */}
                    <div className="col-span-3 text-right">
                      {tx.type === 'due_collection' && (
                        <span className="font-black text-xs sm:text-sm text-emerald-600 dark:text-emerald-400">
                          {formatMoney(tx.amount)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Running Balance Sub-Row */}
                  <div className="mt-1 pt-1 flex items-center justify-between text-[11px] text-slate-400">
                    <span className="font-medium">
                      {tx.runningDue >= 0 ? 'পাবো' : 'দেবো'} {formatMoney(tx.runningDue)}
                    </span>
                    <span className="text-[10px] text-slate-300 opacity-0 group-hover:opacity-100 transition">
                      এডিট / মুছুন ✎
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Sticky Bottom Total Summary Footer */}
          <div className="px-4 sm:px-5 py-3.5 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 grid grid-cols-12 items-center text-xs sm:text-sm font-black text-slate-900 dark:text-white">
            <span className="col-span-6">মোট</span>
            <span className="col-span-3 text-right text-red-600 dark:text-red-400 font-black">
              {formatMoney(reportTotals.totalDebit)}
            </span>
            <span className="col-span-3 text-right text-emerald-600 dark:text-emerald-400 font-black">
              {formatMoney(reportTotals.totalCredit)}
            </span>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 1: EDIT / DELETE TRANSACTION MODAL                */}
      {/* ======================================================== */}
      {editingTx && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-3xl p-5 shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-black">লেনদেন এডিট করুন</h3>
              <button
                type="button"
                onClick={() => setEditingTx(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-800 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col gap-3 text-xs">
              {/* Type Switcher: দিলাম/বেচা vs পেলাম */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-950 rounded-xl font-bold">
                <button
                  type="button"
                  onClick={() => setEditType('sale_due')}
                  className={`py-2 rounded-lg transition ${
                    editType === 'sale_due'
                      ? 'bg-red-600 text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  দিলাম / বেচা
                </button>
                <button
                  type="button"
                  onClick={() => setEditType('due_collection')}
                  className={`py-2 rounded-lg transition ${
                    editType === 'due_collection'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  পেলাম
                </button>
              </div>

              {/* Amount */}
              <div>
                <label className="text-[11px] font-bold text-slate-500 block mb-1">
                  টাকার পরিমাণ (৳):
                </label>
                <input
                  type="number"
                  inputMode="decimal"
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                  className="w-full text-base font-black p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Note / Description */}
              <div>
                <label className="text-[11px] font-bold text-slate-500 block mb-1">
                  বিবরণ / নোট:
                </label>
                <input
                  type="text"
                  value={editNote}
                  onChange={(e) => setEditNote(e.target.value)}
                  placeholder="যেমন: মালামাল বাকি, নগদ গ্রহণ"
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Date */}
              <div>
                <label className="text-[11px] font-bold text-slate-500 block mb-1">
                  তারিখ:
                </label>
                <input
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Photo attachment in Edit */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] font-bold text-slate-500">ভাউচার ছবি:</span>
                {editPhoto ? (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setViewingPhotoUrl(editPhoto)}
                      className="text-xs text-indigo-500 font-bold hover:underline"
                    >
                      প্রিভিউ দেখুন
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditPhoto(null)}
                      className="text-xs text-rose-500 font-bold hover:underline"
                    >
                      মুছুন
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => editFileInputRef.current?.click()}
                    className="text-xs text-indigo-500 font-bold hover:underline flex items-center gap-1"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>ছবি যোগ করুন</span>
                  </button>
                )}
              </div>
            </div>

            {/* Action Buttons: Update and Delete */}
            <div className="flex flex-col gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={handleSaveTxEdit}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition shadow-sm cursor-pointer"
              >
                পরিবর্তন সংরক্ষণ করুন
              </button>

              {showDeleteTxConfirm ? (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex flex-col gap-2 text-center">
                  <span className="text-xs text-rose-600 dark:text-rose-400 font-bold">
                    আপনি কি নিশ্চিতভাবে এই লেনদেনটি মুছে ফেলতে চান?
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setShowDeleteTxConfirm(false)}
                      className="py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-xs font-bold"
                    >
                      বাতিল
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmDeleteTx}
                      className="py-1.5 rounded-lg bg-rose-600 text-white text-xs font-bold"
                    >
                      হ্যাঁ, মুছুন
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowDeleteTxConfirm(true)}
                  className="w-full py-2 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>লেনদেন ডিলিট করুন</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: EDIT CUSTOMER INFO MODAL                       */}
      {/* ======================================================== */}
      {showEditCustomerModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-3xl p-5 shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-black">কাস্টমার তথ্য এডিট করুন</h3>
              <button
                type="button"
                onClick={() => setShowEditCustomerModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-800 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col gap-3 text-xs">
              <div>
                <label className="text-[11px] font-bold text-slate-500 block mb-1">
                  নাম:
                </label>
                <input
                  type="text"
                  value={editCustName}
                  onChange={(e) => setEditCustName(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-bold text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 block mb-1">
                  মোবাইল নম্বর:
                </label>
                <input
                  type="text"
                  value={editCustPhone}
                  onChange={(e) => setEditCustPhone(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 block mb-1">
                  ঠিকানা (ঐচ্ছিক):
                </label>
                <input
                  type="text"
                  value={editCustAddress}
                  onChange={(e) => setEditCustAddress(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowEditCustomerModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={handleSaveCustomerInfo}
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition shadow-sm"
              >
                আপডেট করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 3: DELETE CUSTOMER CONFIRMATION MODAL             */}
      {/* ======================================================== */}
      {showDeleteCustomerConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-3xl p-5 shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col gap-3 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-600 mx-auto flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>

            <h3 className="text-sm font-black text-slate-900 dark:text-white">
              কাস্টমার ডিলিট করতে চান?
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              আপনি কি নিশ্চিতভাবে <span className="font-bold text-slate-800 dark:text-slate-200">"{customer.name}"</span> এর খাতা এবং সমস্ত লেনদেন রেকর্ড চিরতরে মুছে ফেলতে চান? এটি আর ফিরিয়ে আনা যাবে না।
            </p>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteCustomerConfirm(false)}
                className="py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs"
              >
                না, রাখুন
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteCustomer}
                className="py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition"
              >
                হ্যাঁ, ডিলিট করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 4: TAGADA REMINDER MODAL                          */}
      {/* ======================================================== */}
      {showTagadaModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-3xl p-5 shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-black flex items-center gap-1.5">
                <Bell className="w-4 h-4 text-amber-500" />
                তাগাদা মেসেজ পাঠান
              </h3>
              <button
                type="button"
                onClick={() => setShowTagadaModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-800 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-mono leading-relaxed text-slate-700 dark:text-slate-300">
              {getTagadaText()}
            </div>

            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={handleCopyTagadaText}
                className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
              >
                {copiedTagadaMsg ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-500" />
                    <span>মেসেজ কপি হয়েছে!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>মেসেজ কপি করুন</span>
                  </>
                )}
              </button>

              <a
                href={`sms:${customer.phone}?body=${encodeURIComponent(getTagadaText())}`}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-xs"
              >
                <MessageSquare className="w-4 h-4" />
                <span>সরাসরি SMS পাঠান</span>
              </a>

              <a
                href={`https://wa.me/?text=${encodeURIComponent(getTagadaText())}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-xs"
              >
                <Send className="w-4 h-4" />
                <span>WhatsApp এ পাঠান</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 5: DOWNLOAD & PRINT STATEMENT MODAL                */}
      {/* ======================================================== */}
      {showDownloadModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white text-slate-900 rounded-3xl p-5 shadow-2xl border border-slate-200 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <h3 className="text-xs font-black uppercase text-slate-500 tracking-wider">
                কাস্টমার লেজার স্টেটমেন্ট রিপোর্ট
              </h3>
              <button
                type="button"
                onClick={() => setShowDownloadModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Printable Statement Layout */}
            <div
              ref={printStatementRef}
              id="printable-customer-statement"
              className="p-5 bg-white border border-slate-300 rounded-2xl shadow-xs text-slate-900 font-sans flex flex-col gap-3"
            >
              {/* Header */}
              <div className="text-center pb-2 border-b-2 border-dashed border-slate-400">
                <h2 className="text-lg font-black tracking-tight">{shop.name}</h2>
                <p className="text-[11px] text-slate-600 font-medium">{shop.address}</p>
                <p className="text-[11px] text-slate-600 font-medium">মোবাইল: {shop.phone}</p>
                <div className="mt-1.5 inline-block px-3 py-0.5 rounded-full bg-slate-100 text-[10px] font-black uppercase tracking-wider">
                  গ্রাহক হিসাব বিবরণী (Customer Statement)
                </div>
              </div>

              {/* Customer Info */}
              <div className="flex justify-between text-[11px] text-slate-700 py-1 border-b border-slate-200">
                <div>
                  <div className="font-bold text-slate-900">গ্রাহক: {customer.name}</div>
                  <div>মোবাইল: {customer.phone}</div>
                </div>
                <div className="text-right">
                  <div>তারিখ: {formatBnDateFull(new Date().toISOString().slice(0, 10))}</div>
                  <div className="font-bold text-red-600">
                    বকেয়া: ৳ {formatMoney(customer.balance)}
                  </div>
                </div>
              </div>

              {/* Transaction Table */}
              <div className="py-2">
                <table className="w-full text-left text-[11px]">
                  <thead>
                    <tr className="border-b border-slate-300 font-bold text-slate-800">
                      <th className="py-1">তারিখ</th>
                      <th className="py-1">বিবরণ</th>
                      <th className="py-1 text-right">দিলাম (৳)</th>
                      <th className="py-1 text-right">পেলাম (৳)</th>
                      <th className="py-1 text-right">বাকি (৳)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {txsWithRunningBalance.map((tx) => (
                      <tr key={tx.id} className="border-b border-slate-100">
                        <td className="py-1">{tx.date}</td>
                        <td className="py-1">{tx.note || (tx.type === 'sale_due' ? 'বাকি' : 'জমা')}</td>
                        <td className="py-1 text-right text-red-600">
                          {tx.type === 'sale_due' ? formatMoney(tx.amount) : '—'}
                        </td>
                        <td className="py-1 text-right text-emerald-600">
                          {tx.type === 'due_collection' ? formatMoney(tx.amount) : '—'}
                        </td>
                        <td className="py-1 text-right font-bold">
                          {formatMoney(tx.runningDue)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Total Summary */}
              <div className="flex justify-between font-black text-xs pt-2 border-t-2 border-slate-300">
                <span>সর্বমোট:</span>
                <div className="flex gap-4">
                  <span className="text-red-600">দিলাম: ৳ {formatMoney(reportTotals.totalDebit)}</span>
                  <span className="text-emerald-600">পেলাম: ৳ {formatMoney(reportTotals.totalCredit)}</span>
                </div>
              </div>

              {/* Net Balance */}
              <div className="flex justify-between font-black text-sm pt-1 border-t border-slate-200">
                <span>সর্বশেষ বকেয়া বাকি:</span>
                <span className="text-red-600">৳ {formatMoney(customer.balance)}</span>
              </div>

              {/* Signatures */}
              <div className="flex justify-between items-end pt-8 text-[10px] text-slate-500">
                <div className="border-t border-slate-400 pt-1 text-center w-24">গ্রাহকের স্বাক্ষর</div>
                <div className="border-t border-slate-400 pt-1 text-center w-24">স্বত্বাধিকারী স্বাক্ষর</div>
              </div>
            </div>

            {/* Print & Copy Actions */}
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                প্রিন্ট / ডাউনলোড করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 6: FULL PHOTO PREVIEW MODAL                       */}
      {/* ======================================================== */}
      {viewingPhotoUrl && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="relative max-w-md w-full bg-slate-900 rounded-3xl p-3 shadow-2xl flex flex-col items-center gap-3">
            <button
              type="button"
              onClick={() => setViewingPhotoUrl(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-black/60 text-white hover:bg-black/80"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="w-full max-h-[75vh] overflow-hidden rounded-2xl flex items-center justify-center bg-black">
              <img
                src={viewingPhotoUrl}
                alt="Voucher Receipt"
                className="w-full h-auto object-contain max-h-[70vh]"
              />
            </div>
            <span className="text-xs text-slate-300 font-semibold">সংযুক্ত ভাউচার / রশিদের ছবি</span>
          </div>
        </div>
      )}
    </div>
  );
};
