import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  BookOpen,
  Plus,
  Search,
  Users,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Printer,
  Share2,
  Calendar,
  Clock,
  Phone,
  MapPin,
  FileText,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertCircle,
  ArrowUpRight,
  ArrowDownLeft,
  Filter,
  Copy,
  Check,
  Store,
  Save,
  Cloud,
  RefreshCw,
  X,
  CreditCard,
  ShoppingBag,
  Send,
} from 'lucide-react';
import { Language } from '../../types';

interface Props {
  lang: Language;
}

// Shop profile interface
export interface ShopProfile {
  name: string;
  proprietor: string;
  phone: string;
  address: string;
  currency: string;
}

// Customer interface
export interface Customer {
  id: string;
  name: string;
  phone: string;
  address?: string;
  type: 'customer' | 'supplier';
  balance: number; // positive = customer owes us (we will get), negative = we owe them
  createdAt: number;
}

// Transaction item in voucher
export interface VoucherItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

// Transaction interface
export interface Transaction {
  id: string;
  voucherNo: string;
  type: 'sale_cash' | 'sale_due' | 'due_collection' | 'expense' | 'supplier_payment' | 'purchase';
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  amount: number;
  note?: string;
  category?: string;
  items?: VoucherItem[];
  previousDue?: number;
  currentDue?: number;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  createdAt: number;
}

const DEFAULT_SHOP: ShopProfile = {
  name: 'মেসার্স ভাই ভাই এন্টারপ্রাইজ',
  proprietor: 'মোঃ জুলফিকার হাসান',
  phone: '০১৭১২-৩৪৫৬৭৮',
  address: 'প্রধান সড়ক, ঢাকা, বাংলাদেশ',
  currency: '৳',
};

// Convert number to Bengali digits
export function toBn(num: number | string): string {
  const bn = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(num).replace(/\d/g, (d) => bn[parseInt(d, 10)]);
}

// Format currency
export function formatMoney(amount: number): string {
  return toBn(Math.abs(amount).toLocaleString('en-IN'));
}

export const TallyKhataView: React.FC<Props> = ({ lang }) => {
  const isBn = lang === 'bn';

  // Navigation tab inside Tally Khata
  const [activeTab, setActiveTab] = useState<'dashboard' | 'customers' | 'cashbook' | 'voucher' | 'reports' | 'settings'>('dashboard');

  // Shop Profile state
  const [shop, setShop] = useState<ShopProfile>(() => {
    try {
      const stored = localStorage.getItem('smarthub_tally_shop');
      return stored ? JSON.parse(stored) : DEFAULT_SHOP;
    } catch {
      return DEFAULT_SHOP;
    }
  });

  // Customers & Suppliers list
  const [customers, setCustomers] = useState<Customer[]>(() => {
    try {
      const stored = localStorage.getItem('smarthub_tally_customers');
      if (stored) return JSON.parse(stored);
      // Demo starters
      return [
        { id: 'c1', name: 'আব্দুল করিম', phone: '01812345678', address: 'মিরপুর ১০, ঢাকা', type: 'customer', balance: 2450, createdAt: Date.now() - 86400000 * 5 },
        { id: 'c2', name: 'রফিকুল ইসলাম', phone: '01798765432', address: 'উত্তরা সেক্টর ৭', type: 'customer', balance: 1200, createdAt: Date.now() - 86400000 * 3 },
        { id: 'c3', name: 'মেসার্স মদিনা ট্রেডার্স (সাপ্লায়ার)', phone: '01911223344', address: 'চকবাজার, ঢাকা', type: 'supplier', balance: -5800, createdAt: Date.now() - 86400000 * 10 },
      ];
    } catch {
      return [];
    }
  });

  // Transactions list
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      const stored = localStorage.getItem('smarthub_tally_transactions');
      if (stored) return JSON.parse(stored);
      const today = new Date().toISOString().slice(0, 10);
      return [
        {
          id: 'tx1',
          voucherNo: 'TK-1001',
          type: 'sale_cash',
          amount: 3500,
          category: 'নগদ বিক্রি',
          note: 'দৈনিক ক্যাশ বিক্রি',
          date: today,
          time: '10:30',
          createdAt: Date.now() - 3600000 * 3,
        },
        {
          id: 'tx2',
          voucherNo: 'TK-1002',
          type: 'sale_due',
          customerId: 'c1',
          customerName: 'আব্দুল করিম',
          customerPhone: '01812345678',
          amount: 1450,
          category: 'বাকি বিক্রি',
          note: 'মুদি সামগ্রী বাকি',
          previousDue: 1000,
          currentDue: 2450,
          items: [
            { id: 'i1', name: 'মিনিকেট চাল ২৫ কেজি', quantity: 1, unitPrice: 1200, total: 1200 },
            { id: 'i2', name: 'সয়াবিন তেল ১ লিটার', quantity: 1, unitPrice: 250, total: 250 },
          ],
          date: today,
          time: '11:45',
          createdAt: Date.now() - 3600000 * 2,
        },
        {
          id: 'tx3',
          voucherNo: 'TK-1003',
          type: 'expense',
          amount: 320,
          category: 'নাস্তা ও আপ্যায়ন',
          note: 'দোকানের চা-নাস্তা খরচ',
          date: today,
          time: '14:15',
          createdAt: Date.now() - 3600000 * 1,
        },
      ];
    } catch {
      return [];
    }
  });

  // Selected Customer for detail view or voucher
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Search query for customer
  const [customerSearch, setCustomerSearch] = useState<string>('');

  // Modals state
  const [showAddCustomerModal, setShowAddCustomerModal] = useState<boolean>(false);
  const [showTransactionModal, setShowTransactionModal] = useState<boolean>(false);
  const [showVoucherModal, setShowVoucherModal] = useState<boolean>(false);
  const [currentVoucher, setCurrentVoucher] = useState<Transaction | null>(null);

  // Transaction form state
  const [txType, setTxType] = useState<Transaction['type']>('sale_cash');
  const [txCustomerId, setTxCustomerId] = useState<string>('');
  const [txAmount, setTxAmount] = useState<string>('');
  const [txCategory, setTxCategory] = useState<string>('নগদ বিক্রি');
  const [txNote, setTxNote] = useState<string>('');
  const [voucherItems, setVoucherItems] = useState<VoucherItem[]>([
    { id: 'item_1', name: '', quantity: 1, unitPrice: 0, total: 0 },
  ]);

  // Customer form state
  const [custName, setCustName] = useState<string>('');
  const [custPhone, setCustPhone] = useState<string>('');
  const [custAddress, setCustAddress] = useState<string>('');
  const [custType, setCustType] = useState<'customer' | 'supplier'>('customer');
  const [custInitialBalance, setCustInitialBalance] = useState<string>('0');

  // Server Cloud Sync Status State
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');
  const [syncMessage, setSyncMessage] = useState<string>('');
  const [copiedTagada, setCopiedTagada] = useState<boolean>(false);

  // Print voucher ref
  const printAreaRef = useRef<HTMLDivElement>(null);

  // Save to LocalStorage whenever state changes
  useEffect(() => {
    localStorage.setItem('smarthub_tally_shop', JSON.stringify(shop));
  }, [shop]);

  useEffect(() => {
    localStorage.setItem('smarthub_tally_customers', JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    localStorage.setItem('smarthub_tally_transactions', JSON.stringify(transactions));
  }, [transactions]);

  // Cloud Sync to server
  const handleServerSync = async () => {
    setSyncStatus('syncing');
    setSyncMessage('সার্ভারে ব্যাকআপ ও সিঙ্ক হচ্ছে...');
    try {
      const payload = {
        shop,
        customers,
        transactions,
        syncedAt: Date.now(),
      };
      const response = await fetch('/api/tally/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }

      const resData = await response.json();
      setSyncStatus('synced');
      setSyncMessage(resData.message || 'সার্ভারে সফলভাবে ক্লাউড ব্যাকআপ সংরক্ষিত হয়েছে!');
      setTimeout(() => setSyncStatus('idle'), 4000);
    } catch (err: any) {
      console.warn('Server sync offline:', err);
      setSyncStatus('error');
      setSyncMessage('লোকাল স্টোরেজে সংরক্ষিত হয়েছে। সার্ভার সংযোগ চালু হলে পুনরায় সিঙ্ক হবে।');
      setTimeout(() => setSyncStatus('idle'), 5000);
    }
  };

  // Restore from server
  const handleRestoreFromServer = async () => {
    if (!window.confirm('আপনি কি সার্ভার থেকে ব্যাকআপ রিস্টোর করতে চান?')) return;
    setSyncStatus('syncing');
    try {
      const response = await fetch('/api/tally/sync');
      const resData = await response.json();
      if (resData.success && resData.data) {
        if (resData.data.shop) setShop(resData.data.shop);
        if (resData.data.customers) setCustomers(resData.data.customers);
        if (resData.data.transactions) setTransactions(resData.data.transactions);
        setSyncStatus('synced');
        setSyncMessage('সার্ভার থেকে সফলভাবে রিস্টোর সম্পন্ন হয়েছে!');
      } else {
        setSyncStatus('error');
        setSyncMessage('সার্ভারে কোনো ব্যাকআপ ফাইল পাওয়া যায়নি।');
      }
      setTimeout(() => setSyncStatus('idle'), 4000);
    } catch (err) {
      setSyncStatus('error');
      setSyncMessage('সার্ভার থেকে রিস্টোর করতে সমস্যা হয়েছে।');
      setTimeout(() => setSyncStatus('idle'), 4000);
    }
  };

  // Calculation summaries
  const todayStr = new Date().toISOString().slice(0, 10);

  const stats = useMemo(() => {
    let totalReceivable = 0; // Total customer due to receive
    let totalPayable = 0; // Total supplier due to pay

    customers.forEach((c) => {
      if (c.balance > 0) totalReceivable += c.balance;
      else if (c.balance < 0) totalPayable += Math.abs(c.balance);
    });

    let todaySales = 0;
    let todayExpenses = 0;
    let todayDueCollected = 0;
    let todayCashIn = 0;
    let todayCashOut = 0;

    transactions.forEach((tx) => {
      if (tx.date === todayStr) {
        if (tx.type === 'sale_cash') {
          todaySales += tx.amount;
          todayCashIn += tx.amount;
        } else if (tx.type === 'sale_due') {
          todaySales += tx.amount;
        } else if (tx.type === 'due_collection') {
          todayDueCollected += tx.amount;
          todayCashIn += tx.amount;
        } else if (tx.type === 'expense') {
          todayExpenses += tx.amount;
          todayCashOut += tx.amount;
        } else if (tx.type === 'supplier_payment' || tx.type === 'purchase') {
          todayCashOut += tx.amount;
        }
      }
    });

    const netCashInHand = todayCashIn - todayCashOut;

    return {
      totalReceivable,
      totalPayable,
      todaySales,
      todayExpenses,
      todayDueCollected,
      todayCashIn,
      todayCashOut,
      netCashInHand,
    };
  }, [customers, transactions, todayStr]);

  // Filtered customers
  const filteredCustomers = useMemo(() => {
    const q = customerSearch.trim().toLowerCase();
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        (c.address && c.address.toLowerCase().includes(q))
    );
  }, [customers, customerSearch]);

  // Add customer handler
  const handleAddCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!custName.trim()) return;

    const initial = parseFloat(custInitialBalance) || 0;
    const newCust: Customer = {
      id: `cust_${Date.now()}`,
      name: custName.trim(),
      phone: custPhone.trim() || '—',
      address: custAddress.trim() || undefined,
      type: custType,
      balance: custType === 'customer' ? initial : -initial,
      createdAt: Date.now(),
    };

    setCustomers([newCust, ...customers]);
    setCustName('');
    setCustPhone('');
    setCustAddress('');
    setCustInitialBalance('0');
    setShowAddCustomerModal(false);
  };

  // Add Transaction handler
  const handleSaveTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(txAmount);
    if (isNaN(amountNum) || amountNum <= 0) return;

    const targetCustomer = customers.find((c) => c.id === txCustomerId);
    const now = new Date();
    const date = now.toISOString().slice(0, 10);
    const time = now.toTimeString().slice(0, 5);
    const voucherNo = `TK-${Math.floor(1000 + Math.random() * 9000)}`;

    let previousDue = targetCustomer ? targetCustomer.balance : 0;
    let currentDue = previousDue;

    // Adjust balance
    if (targetCustomer) {
      if (txType === 'sale_due') {
        currentDue = previousDue + amountNum;
      } else if (txType === 'due_collection') {
        currentDue = previousDue - amountNum;
      } else if (txType === 'supplier_payment') {
        currentDue = previousDue + amountNum; // reducing supplier debt (since debt is negative)
      }

      // Update customer balance in state
      setCustomers((prev) =>
        prev.map((c) => (c.id === targetCustomer.id ? { ...c, balance: currentDue } : c))
      );
    }

    // Filter valid items if any
    const validItems = voucherItems.filter((it) => it.name.trim() && it.total > 0);

    const newTx: Transaction = {
      id: `tx_${Date.now()}`,
      voucherNo,
      type: txType,
      customerId: targetCustomer?.id,
      customerName: targetCustomer?.name,
      customerPhone: targetCustomer?.phone,
      amount: amountNum,
      category: txCategory,
      note: txNote.trim() || undefined,
      items: validItems.length > 0 ? validItems : undefined,
      previousDue: targetCustomer ? previousDue : undefined,
      currentDue: targetCustomer ? currentDue : undefined,
      date,
      time,
      createdAt: Date.now(),
    };

    setTransactions([newTx, ...transactions]);

    // Reset Form
    setTxAmount('');
    setTxNote('');
    setVoucherItems([{ id: 'item_1', name: '', quantity: 1, unitPrice: 0, total: 0 }]);
    setShowTransactionModal(false);

    // Prompt to view voucher
    setCurrentVoucher(newTx);
    setShowVoucherModal(true);
  };

  // Delete transaction
  const handleDeleteTransaction = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('আপনি কি নিশ্চিত যে এই লেনদেনটি মুছে ফেলতে চান?')) {
      setTransactions(transactions.filter((tx) => tx.id !== id));
    }
  };

  // Handle Print Action
  const handlePrint = () => {
    window.print();
  };

  // Generate WhatsApp / SMS Reminder
  const handleCopyTagada = (cust: Customer) => {
    const text = `সম্মানিত গ্রাহক ${cust.name}, আপনার কাছে ${shop.name}-এর বকেয়া বাকি ${shop.currency} ${toBn(cust.balance)} টাকা। দ্রুত পরিশোধ করার অনুরোধ রইল। যোগাযোগ: ${shop.phone}`;
    navigator.clipboard.writeText(text);
    setCopiedTagada(true);
    setTimeout(() => setCopiedTagada(false), 3000);
  };

  return (
    <div className="flex flex-col gap-4 animate-fadeIn text-slate-800 dark:text-slate-100">
      {/* Top Shop Banner with Server Sync Badge */}
      <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-emerald-700 via-teal-800 to-slate-900 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider bg-white/20 backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-1.5">
              <Store className="w-3.5 h-3.5" />
              ডিজিটাল টালি খাতা ও হিসাব মেমো
            </span>

            {/* Cloud Server Sync Button */}
            <button
              onClick={handleServerSync}
              disabled={syncStatus === 'syncing'}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/30 hover:bg-emerald-500/50 border border-emerald-400/40 text-xs font-semibold text-emerald-200 transition cursor-pointer"
              title="সার্ভারে ক্লাউড সিঙ্ক করুন"
            >
              <Cloud className={`w-3.5 h-3.5 ${syncStatus === 'syncing' ? 'animate-bounce' : ''}`} />
              <span>{syncStatus === 'syncing' ? 'সিঙ্ক হচ্ছে...' : 'সার্ভার সিঙ্ক'}</span>
            </button>
          </div>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight">{shop.name}</h1>
              <p className="text-xs text-emerald-100 mt-0.5 flex items-center gap-2">
                <span>প্রোপ্রাইটর: {shop.proprietor}</span>
                <span>•</span>
                <span>মোবাইল: {shop.phone}</span>
              </p>
            </div>

            <button
              onClick={() => setActiveTab('settings')}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition flex items-center gap-1.5"
            >
              <Edit2 className="w-3.5 h-3.5" />
              দোকান এডিট
            </button>
          </div>

          {/* Sync Status Feedback Toast */}
          {syncMessage && (
            <div
              className={`text-xs px-3 py-1.5 rounded-xl flex items-center gap-1.5 ${
                syncStatus === 'synced'
                  ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-200 border border-amber-500/30'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>{syncMessage}</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Feature Tabs */}
      <div className="flex items-center bg-slate-200/80 dark:bg-slate-900 p-1 rounded-2xl border border-slate-300/60 dark:border-slate-800 text-xs font-bold overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex-1 min-w-[70px] py-2 px-2.5 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'dashboard'
              ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>ড্যাশবোর্ড</span>
        </button>

        <button
          onClick={() => setActiveTab('customers')}
          className={`flex-1 min-w-[90px] py-2 px-2.5 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'customers'
              ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>কাস্টমার খাতা ({customers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('cashbook')}
          className={`flex-1 min-w-[80px] py-2 px-2.5 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'cashbook'
              ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>দৈনিক ক্যাশ</span>
        </button>

        <button
          onClick={() => setActiveTab('reports')}
          className={`flex-1 min-w-[80px] py-2 px-2.5 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'reports'
              ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>হিসাব রিপোর্ট</span>
        </button>
      </div>

      {/* ================= TAB 1: DASHBOARD ================= */}
      {activeTab === 'dashboard' && (
        <div className="flex flex-col gap-4 animate-fadeIn">
          {/* Quick Balance Cards Grid */}
          <div className="grid grid-cols-2 gap-3">
            {/* Total Due to Receive (পাবো) */}
            <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 shadow-xs flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-bold text-red-600 dark:text-red-400 uppercase tracking-wider block">
                  মোট বাকি পাবো (Receivable)
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-red-600 dark:text-red-400 mt-1">
                  {shop.currency} {formatMoney(stats.totalReceivable)}
                </h3>
              </div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-2">
                কাস্টমারদের কাছে বকেয়া বাকি
              </span>
            </div>

            {/* Total Payable to Suppliers (দেবো) */}
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 shadow-xs flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">
                  মোট দেনা দেবো (Payable)
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
                  {shop.currency} {formatMoney(stats.totalPayable)}
                </h3>
              </div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-2">
                মহাজন / পাইকার দেনা
              </span>
            </div>

            {/* Today's Sales */}
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 shadow-xs flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
                  আজকের মোট বিক্রি (Sales)
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                  {shop.currency} {formatMoney(stats.todaySales)}
                </h3>
              </div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-2">
                নগদ ও বাকি বিক্রি সহ
              </span>
            </div>

            {/* Today's Cash in Hand */}
            <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40 shadow-xs flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider block">
                  আজকের ক্যাশ ব্যালেন্স
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">
                  {shop.currency} {formatMoney(stats.netCashInHand)}
                </h3>
              </div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-2">
                ক্যাশ জমা - খরচ বাদ
              </span>
            </div>
          </div>

          {/* Quick Action Buttons Bar */}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={() => {
                setTxType('sale_due');
                setShowTransactionModal(true);
              }}
              className="p-3.5 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition cursor-pointer"
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>- বাকি দিলাম</span>
            </button>

            <button
              onClick={() => {
                setTxType('due_collection');
                setShowTransactionModal(true);
              }}
              className="p-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition cursor-pointer"
            >
              <ArrowDownLeft className="w-4 h-4" />
              <span>+ টাকা পেলাম (জমা)</span>
            </button>

            <button
              onClick={() => {
                setTxType('sale_cash');
                setShowTransactionModal(true);
              }}
              className="p-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>নগদ বিক্রি ও মেমো</span>
            </button>

            <button
              onClick={() => {
                setTxType('expense');
                setShowTransactionModal(true);
              }}
              className="p-3.5 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition cursor-pointer"
            >
              <DollarSign className="w-4 h-4" />
              <span>খরচ হিসাব এন্ট্রি</span>
            </button>
          </div>

          {/* Recent Transactions List */}
          <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-500" />
                সাম্প্রতিক লেনদেনসমূহ
              </h3>
              <button
                onClick={() => setActiveTab('cashbook')}
                className="text-xs text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
              >
                সব দেখুন →
              </button>
            </div>

            {transactions.slice(0, 5).map((tx) => (
              <div
                key={tx.id}
                onClick={() => {
                  setCurrentVoucher(tx);
                  setShowVoucherModal(true);
                }}
                className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 flex items-center justify-between gap-3 text-xs hover:border-emerald-400 transition cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      tx.type === 'due_collection' || tx.type === 'sale_cash'
                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                        : tx.type === 'sale_due'
                        ? 'bg-red-500/15 text-red-600 dark:text-red-400'
                        : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                    }`}
                  >
                    {tx.type === 'due_collection' || tx.type === 'sale_cash' ? (
                      <ArrowDownLeft className="w-4 h-4" />
                    ) : (
                      <ArrowUpRight className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white">
                      {tx.customerName || tx.category || 'লেনদেন'}
                    </h4>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                      {tx.note || tx.category} • {tx.time} ({tx.voucherNo})
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span
                    className={`font-black text-sm block ${
                      tx.type === 'due_collection' || tx.type === 'sale_cash'
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : tx.type === 'sale_due'
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-amber-600 dark:text-amber-400'
                    }`}
                  >
                    {tx.type === 'due_collection' || tx.type === 'sale_cash' ? '+' : '-'} {shop.currency}{' '}
                    {formatMoney(tx.amount)}
                  </span>
                  <span className="text-[10px] text-slate-400 underline">রশিদ দেখুন</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= TAB 2: CUSTOMERS & SUPPLIERS LEDGER ================= */}
      {activeTab === 'customers' && (
        <div className="flex flex-col gap-4 animate-fadeIn">
          {/* Header & Search */}
          <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  কাস্টমার ও সাপ্লায়ার খাতা
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  প্রতিটি গ্রাহকের বাকি এবং জমার নির্ভুল ডিজিটাল খাতা
                </p>
              </div>

              <button
                onClick={() => setShowAddCustomerModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                নতুন কাস্টমার
              </button>
            </div>

            {/* Search Input */}
            <div className="relative mt-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                placeholder="কাস্টমারের নাম বা মোবাইল নম্বর খুঁজুন..."
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Customers List */}
          <div className="flex flex-col gap-2.5">
            {filteredCustomers.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
                কোনো কাস্টমার বা সাপ্লায়ার পাওয়া যায়নি। নতুন গ্রাহক যোগ করুন।
              </div>
            ) : (
              filteredCustomers.map((cust) => (
                <div
                  key={cust.id}
                  className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                          {cust.name}
                        </h4>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                            cust.type === 'customer'
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                              : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                          }`}
                        >
                          {cust.type === 'customer' ? 'কাস্টমার' : 'সাপ্লায়ার'}
                        </span>
                      </div>
                      <span className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 block flex items-center gap-1.5">
                        <Phone className="w-3 h-3" /> {cust.phone}
                        {cust.address && <span>• {cust.address}</span>}
                      </span>
                    </div>

                    {/* Balance */}
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">
                        {cust.balance > 0 ? 'বাকি পাবো' : cust.balance < 0 ? 'দেনা দেবো' : 'পরিশোধ'}
                      </span>
                      <span
                        className={`text-base font-black ${
                          cust.balance > 0
                            ? 'text-red-600 dark:text-red-400'
                            : cust.balance < 0
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-emerald-600 dark:text-emerald-400'
                        }`}
                      >
                        {shop.currency} {formatMoney(cust.balance)}
                      </span>
                    </div>
                  </div>

                  {/* Actions for this customer */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          setTxCustomerId(cust.id);
                          setTxType('sale_due');
                          setShowTransactionModal(true);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-950/60 dark:text-red-300 font-bold transition"
                      >
                        - বাকি দিলাম
                      </button>

                      <button
                        onClick={() => {
                          setTxCustomerId(cust.id);
                          setTxType('due_collection');
                          setShowTransactionModal(true);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 font-bold transition"
                      >
                        + জমা পেলাম
                      </button>
                    </div>

                    {/* Tagada SMS */}
                    {cust.balance > 0 && (
                      <button
                        onClick={() => handleCopyTagada(cust)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-medium transition"
                        title="বাকি তাগাদা মেসেজ কপি করুন"
                      >
                        <Send className="w-3 h-3 text-red-500" />
                        <span>{copiedTagada ? 'কপি হয়েছে!' : 'তাগাদা SMS'}</span>
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ================= TAB 3: DAILY CASHBOOK ================= */}
      {activeTab === 'cashbook' && (
        <div className="flex flex-col gap-4 animate-fadeIn">
          {/* Cashbook Summary */}
          <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  দৈনিক ক্যাশবই (Daily Cashbook)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  আজকের মোট ক্যাশ আগমন, নির্গমন ও অবশিষ্ট ক্যাশ
                </p>
              </div>

              <button
                onClick={() => {
                  setTxType('sale_cash');
                  setShowTransactionModal(true);
                }}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition"
              >
                <Plus className="w-3.5 h-3.5" />
                নতুন লেনদেন
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-center">
              <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/20">
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 block">মোট ক্যাশ ইন</span>
                <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                  {shop.currency} {formatMoney(stats.todayCashIn)}
                </span>
              </div>
              <div className="p-2 rounded-xl bg-red-50 dark:bg-red-950/20">
                <span className="text-[10px] font-bold text-red-600 dark:text-red-400 block">মোট ক্যাশ আউট</span>
                <span className="text-sm font-black text-red-600 dark:text-red-400">
                  {shop.currency} {formatMoney(stats.todayCashOut)}
                </span>
              </div>
              <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/20">
                <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 block">অবশিষ্ট ক্যাশ</span>
                <span className="text-sm font-black text-blue-600 dark:text-blue-400">
                  {shop.currency} {formatMoney(stats.netCashInHand)}
                </span>
              </div>
            </div>
          </div>

          {/* Transactions Feed */}
          <div className="flex flex-col gap-2">
            {transactions.map((tx) => (
              <div
                key={tx.id}
                onClick={() => {
                  setCurrentVoucher(tx);
                  setShowVoucherModal(true);
                }}
                className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between gap-3 text-xs cursor-pointer hover:border-emerald-500 transition"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      tx.type === 'due_collection' || tx.type === 'sale_cash'
                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                        : 'bg-red-500/15 text-red-600 dark:text-red-400'
                    }`}
                  >
                    {tx.type === 'due_collection' || tx.type === 'sale_cash' ? (
                      <ArrowDownLeft className="w-4 h-4" />
                    ) : (
                      <ArrowUpRight className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white">
                      {tx.customerName ? `${tx.customerName} (${tx.category || 'কাস্টমার'})` : tx.category || 'লেনদেন'}
                    </h4>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                      ভাউচার: {tx.voucherNo} • {tx.date} {tx.time}
                    </span>
                    {tx.note && <span className="text-[11px] text-slate-400 block">নোট: {tx.note}</span>}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span
                      className={`font-black text-sm block ${
                        tx.type === 'due_collection' || tx.type === 'sale_cash'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      {tx.type === 'due_collection' || tx.type === 'sale_cash' ? '+' : '-'} {shop.currency}{' '}
                      {formatMoney(tx.amount)}
                    </span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center justify-end gap-1">
                      <Printer className="w-3 h-3" /> মেমো
                    </span>
                  </div>

                  <button
                    onClick={(e) => handleDeleteTransaction(tx.id, e)}
                    className="p-1 text-slate-400 hover:text-red-500"
                    title="মুছে ফেলুন"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= TAB 4: REPORTS & ANALYTICS ================= */}
      {activeTab === 'reports' && (
        <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-4 animate-fadeIn">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">ব্যবসায়িক হিসাব সারাংশ</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">লাভ-ক্ষতি ও মোট আর্থিক বিবরণী</p>
            </div>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" /> প্রিন্ট রিপোর্ট
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-between">
              <span className="font-semibold text-slate-600 dark:text-slate-300">মোট বিক্রয় (আজ)</span>
              <span className="font-bold text-sm text-emerald-600 dark:text-emerald-400">
                {shop.currency} {formatMoney(stats.todaySales)}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-between">
              <span className="font-semibold text-slate-600 dark:text-slate-300">মোট বকেয়া আদায় (আজ)</span>
              <span className="font-bold text-sm text-emerald-600 dark:text-emerald-400">
                {shop.currency} {formatMoney(stats.todayDueCollected)}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-between">
              <span className="font-semibold text-slate-600 dark:text-slate-300">মোট দোকান ব্যয় / খরচ (আজ)</span>
              <span className="font-bold text-sm text-red-600 dark:text-red-400">
                {shop.currency} {formatMoney(stats.todayExpenses)}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-between">
              <span className="font-semibold text-slate-600 dark:text-slate-300">মোট বকেয়া পাওনা (সকল কাস্টমার)</span>
              <span className="font-bold text-sm text-red-600 dark:text-red-400">
                {shop.currency} {formatMoney(stats.totalReceivable)}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-between">
              <span className="font-semibold text-slate-600 dark:text-slate-300">মোট মহাজন দেনা (সাপ্লায়ার)</span>
              <span className="font-bold text-sm text-amber-600 dark:text-amber-400">
                {shop.currency} {formatMoney(stats.totalPayable)}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800 flex items-center justify-between">
              <span className="font-bold text-emerald-800 dark:text-emerald-300">আজকের নেট ক্যাশ স্থিতি</span>
              <span className="font-black text-base text-emerald-600 dark:text-emerald-400">
                {shop.currency} {formatMoney(stats.netCashInHand)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 5: SHOP SETTINGS ================= */}
      {activeTab === 'settings' && (
        <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-4 animate-fadeIn">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">দোকান ও ব্যবসা প্রোফাইল সেটিংস</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              এখানে দেওয়া নাম, ঠিকানা ও মোবাইল নম্বর স্বয়ংক্রিয়ভাবে প্রতিটি ক্যাশ মেমো ও ভাউচারে প্রিন্ট হবে
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              alert('দোকানের তথ্য সফলভাবে সংরক্ষিত হয়েছে!');
              setActiveTab('dashboard');
            }}
            className="flex flex-col gap-3 text-xs"
          >
            <div>
              <label className="font-bold text-slate-600 dark:text-slate-300 block mb-1">
                দোকান বা প্রতিষ্ঠানের নাম *
              </label>
              <input
                type="text"
                required
                value={shop.name}
                onChange={(e) => setShop({ ...shop, name: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold"
              />
            </div>

            <div>
              <label className="font-bold text-slate-600 dark:text-slate-300 block mb-1">
                প্রোপ্রাইটর / স্বত্বাধিকারীর নাম
              </label>
              <input
                type="text"
                value={shop.proprietor}
                onChange={(e) => setShop({ ...shop, proprietor: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs"
              />
            </div>

            <div>
              <label className="font-bold text-slate-600 dark:text-slate-300 block mb-1">
                মোবাইল নম্বর *
              </label>
              <input
                type="text"
                required
                value={shop.phone}
                onChange={(e) => setShop({ ...shop, phone: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs"
              />
            </div>

            <div>
              <label className="font-bold text-slate-600 dark:text-slate-300 block mb-1">
                দোকানের ঠিকানা *
              </label>
              <input
                type="text"
                required
                value={shop.address}
                onChange={(e) => setShop({ ...shop, address: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs"
              />
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={handleRestoreFromServer}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" /> সার্ভার ব্যাকআপ রিস্টোর
              </button>

              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md transition"
              >
                সংরক্ষণ করুন
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ================= MODAL: ADD CUSTOMER ================= */}
      {showAddCustomerModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-500" />
                নতুন কাস্টমার / সাপ্লায়ার যোগ
              </h3>
              <button
                onClick={() => setShowAddCustomerModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddCustomer} className="flex flex-col gap-3 text-xs">
              <div>
                <label className="font-bold text-slate-600 dark:text-slate-300 block mb-1">
                  ধরন নির্বাচন করুন:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setCustType('customer')}
                    className={`py-2 rounded-xl font-bold transition ${
                      custType === 'customer'
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                    }`}
                  >
                    কাস্টমার (খরিদ্দার)
                  </button>
                  <button
                    type="button"
                    onClick={() => setCustType('supplier')}
                    className={`py-2 rounded-xl font-bold transition ${
                      custType === 'supplier'
                        ? 'bg-amber-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                    }`}
                  >
                    সাপ্লায়ার (পাইকার)
                  </button>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-600 dark:text-slate-300 block mb-1">
                  নাম *
                </label>
                <input
                  type="text"
                  required
                  value={custName}
                  onChange={(e) => setCustName(e.target.value)}
                  placeholder="যেমন: মোঃ জসিম উদ্দিন"
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs"
                />
              </div>

              <div>
                <label className="font-bold text-slate-600 dark:text-slate-300 block mb-1">
                  মোবাইল নম্বর
                </label>
                <input
                  type="text"
                  value={custPhone}
                  onChange={(e) => setCustPhone(e.target.value)}
                  placeholder="017xxxxxxxx"
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs"
                />
              </div>

              <div>
                <label className="font-bold text-slate-600 dark:text-slate-300 block mb-1">
                  ঠিকানা (ঐচ্ছিক)
                </label>
                <input
                  type="text"
                  value={custAddress}
                  onChange={(e) => setCustAddress(e.target.value)}
                  placeholder="গ্রাম / এলাকা"
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs"
                />
              </div>

              <div>
                <label className="font-bold text-slate-600 dark:text-slate-300 block mb-1">
                  পূর্বের বকেয়া ব্যালেন্স (যদি থাকে)
                </label>
                <input
                  type="number"
                  value={custInitialBalance}
                  onChange={(e) => setCustInitialBalance(e.target.value)}
                  placeholder="0"
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-bold"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddCustomerModal(false)}
                  className="px-3 py-2 rounded-xl text-slate-400 font-bold"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md transition"
                >
                  যোগ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: NEW TRANSACTION ================= */}
      {showTransactionModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="w-full max-w-md max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-500" />
                নতুন হিসাব ও লেনদেন এন্ট্রি
              </h3>
              <button
                onClick={() => setShowTransactionModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveTransaction} className="flex flex-col gap-3 text-xs">
              {/* Type Switcher */}
              <div>
                <label className="font-bold text-slate-600 dark:text-slate-300 block mb-1">
                  লেনদেনের ধরন:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setTxType('sale_due');
                      setTxCategory('বাকি বিক্রি');
                    }}
                    className={`py-2 px-2 rounded-xl font-bold transition flex items-center justify-center gap-1 ${
                      txType === 'sale_due'
                        ? 'bg-red-600 text-white shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                    }`}
                  >
                    <ArrowUpRight className="w-3.5 h-3.5" /> - বাকি দিলাম
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setTxType('due_collection');
                      setTxCategory('বাকি আদায়');
                    }}
                    className={`py-2 px-2 rounded-xl font-bold transition flex items-center justify-center gap-1 ${
                      txType === 'due_collection'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                    }`}
                  >
                    <ArrowDownLeft className="w-3.5 h-3.5" /> + টাকা পেলাম
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setTxType('sale_cash');
                      setTxCategory('নগদ বিক্রি');
                    }}
                    className={`py-2 px-2 rounded-xl font-bold transition flex items-center justify-center gap-1 ${
                      txType === 'sale_cash'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                    }`}
                  >
                    <ShoppingBag className="w-3.5 h-3.5" /> নগদ বিক্রি ও ক্যাশ
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setTxType('expense');
                      setTxCategory('দোকান খরচ');
                    }}
                    className={`py-2 px-2 rounded-xl font-bold transition flex items-center justify-center gap-1 ${
                      txType === 'expense'
                        ? 'bg-amber-600 text-white shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                    }`}
                  >
                    <DollarSign className="w-3.5 h-3.5" /> খরচ হিসাব
                  </button>
                </div>
              </div>

              {/* Customer Selector if not general expense */}
              {txType !== 'expense' && (
                <div>
                  <label className="font-bold text-slate-600 dark:text-slate-300 block mb-1">
                    কাস্টমার / গ্রাহক নির্বাচন করুন:
                  </label>
                  <select
                    value={txCustomerId}
                    onChange={(e) => setTxCustomerId(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-medium"
                  >
                    <option value="">— কাস্টমার বাছাই করুন (বা সাধারণ ক্যাশ) —</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.phone}) — বকেয়া: {shop.currency} {formatMoney(c.balance)}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Amount */}
              <div>
                <label className="font-bold text-slate-600 dark:text-slate-300 block mb-1">
                  টাকার পরিমাণ ({shop.currency}) *
                </label>
                <input
                  type="number"
                  required
                  value={txAmount}
                  onChange={(e) => setTxAmount(e.target.value)}
                  placeholder="যেমন: ৫০০"
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-base font-black text-emerald-600 dark:text-emerald-400"
                />
              </div>

              {/* Note / Remarks */}
              <div>
                <label className="font-bold text-slate-600 dark:text-slate-300 block mb-1">
                  বিবরণ / পণ্যের নোট
                </label>
                <input
                  type="text"
                  value={txNote}
                  onChange={(e) => setTxNote(e.target.value)}
                  placeholder="যেমন: চিনি ২ কেজি, ডাল ১ কেজি"
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowTransactionModal(false)}
                  className="px-3 py-2 rounded-xl text-slate-400 font-bold"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md transition"
                >
                  সংরক্ষণ ও মেমো দেখুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: PRINTABLE CASH MEMO / VOUCHER ================= */}
      {showVoucherModal && currentVoucher && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
          <div className="w-full max-w-md max-h-[92vh] overflow-y-auto bg-white text-slate-900 rounded-3xl p-5 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <h3 className="text-xs font-bold uppercase text-slate-500 tracking-wider">
                ক্যাশ মেমো ও ভাউচার প্রিভিউ
              </h3>
              <button
                onClick={() => setShowVoucherModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Printable Memo Layout (Thermal POS / Official Invoice Style) */}
            <div
              ref={printAreaRef}
              id="printable-voucher-area"
              className="p-5 bg-white border border-slate-300 rounded-2xl shadow-sm text-slate-900 font-sans flex flex-col gap-3"
            >
              {/* Shop Header */}
              <div className="text-center pb-2 border-b-2 border-dashed border-slate-400">
                <h2 className="text-lg font-black tracking-tight">{shop.name}</h2>
                <p className="text-[11px] text-slate-600 font-medium">{shop.address}</p>
                <p className="text-[11px] text-slate-600 font-medium">মোবাইল: {shop.phone}</p>
                <div className="mt-1.5 inline-block px-3 py-0.5 rounded-full bg-slate-100 text-[10px] font-black uppercase tracking-wider">
                  {currentVoucher.type === 'sale_cash'
                    ? 'নগদ ক্যাশ মেমো'
                    : currentVoucher.type === 'sale_due'
                    ? 'বাকি ভাউচার'
                    : currentVoucher.type === 'due_collection'
                    ? 'মানি রিসিট (জমা রশিদ)'
                    : 'ডেবিট ভাউচার'}
                </div>
              </div>

              {/* Memo Info Bar */}
              <div className="flex justify-between text-[11px] text-slate-700 py-1 border-b border-slate-200">
                <div>
                  <span className="font-bold">ভাউচার নং: </span>
                  <span className="font-mono">{currentVoucher.voucherNo}</span>
                </div>
                <div>
                  <span className="font-bold">তারিখ: </span>
                  <span>{currentVoucher.date} {currentVoucher.time}</span>
                </div>
              </div>

              {/* Customer Info */}
              {currentVoucher.customerName && (
                <div className="text-[11px] py-1 border-b border-slate-200">
                  <div className="font-bold text-slate-900">গ্রাহক: {currentVoucher.customerName}</div>
                  {currentVoucher.customerPhone && (
                    <div className="text-slate-600">মোবাইল: {currentVoucher.customerPhone}</div>
                  )}
                </div>
              )}

              {/* Items List / Description */}
              <div className="py-2">
                <table className="w-full text-left text-[11px]">
                  <thead>
                    <tr className="border-b border-slate-300 font-bold text-slate-800">
                      <th className="py-1">বিবরণ</th>
                      <th className="py-1 text-right">পরিমাণ</th>
                      <th className="py-1 text-right">টাকা</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentVoucher.items && currentVoucher.items.length > 0 ? (
                      currentVoucher.items.map((it) => (
                        <tr key={it.id} className="border-b border-slate-100">
                          <td className="py-1">{it.name}</td>
                          <td className="py-1 text-right">{toBn(it.quantity)}</td>
                          <td className="py-1 text-right">{shop.currency} {formatMoney(it.total)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr className="border-b border-slate-100">
                        <td className="py-1">{currentVoucher.note || currentVoucher.category || 'নগদ লেনদেন'}</td>
                        <td className="py-1 text-right">১</td>
                        <td className="py-1 text-right">{shop.currency} {formatMoney(currentVoucher.amount)}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Total Calculation Summary */}
              <div className="flex flex-col gap-1 pt-1 border-t-2 border-slate-300 text-xs">
                <div className="flex justify-between font-bold">
                  <span>মোট টাকার পরিমাণ:</span>
                  <span>{shop.currency} {formatMoney(currentVoucher.amount)}</span>
                </div>

                {currentVoucher.previousDue !== undefined && (
                  <div className="flex justify-between text-slate-600 text-[11px]">
                    <span>পূর্বের বকেয়া বাকি:</span>
                    <span>{shop.currency} {formatMoney(currentVoucher.previousDue)}</span>
                  </div>
                )}

                {currentVoucher.currentDue !== undefined && (
                  <div className="flex justify-between font-black text-red-600 pt-1 border-t border-slate-200">
                    <span>বর্তমান মোট বকেয়া:</span>
                    <span>{shop.currency} {formatMoney(currentVoucher.currentDue)}</span>
                  </div>
                )}
              </div>

              {/* Footer Signatures */}
              <div className="flex justify-between items-end pt-8 text-[10px] text-slate-500">
                <div className="border-t border-slate-400 pt-1 text-center w-24">ক্রেতার স্বাক্ষর</div>
                <div className="border-t border-slate-400 pt-1 text-center w-24">বিক্রেতার স্বাক্ষর</div>
              </div>

              <div className="text-center text-[10px] text-slate-400 pt-2 border-t border-dashed border-slate-300">
                ধন্যবাদ, আবার আসবেন। স্মার্টহাব ডিজিটাল টালি খাতা।
              </div>
            </div>

            {/* Print & Share Buttons */}
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={handlePrint}
                className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                ভাউচার প্রিন্ট করুন
              </button>

              <button
                onClick={() => {
                  const memoText = `রশিদ: ${currentVoucher.voucherNo}\nদোকান: ${shop.name}\nতারিখ: ${currentVoucher.date}\nপরিমাণ: ${shop.currency} ${toBn(currentVoucher.amount)}\n${currentVoucher.currentDue ? `বর্তমান বাকি: ${shop.currency} ${toBn(currentVoucher.currentDue)}` : ''}\nধন্যবাদ।`;
                  navigator.clipboard.writeText(memoText);
                  alert('ভাউচার বিবরণ ক্লিপবোর্ডে কপি হয়েছে!');
                }}
                className="py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Copy className="w-4 h-4" />
                মেমো কপি
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
