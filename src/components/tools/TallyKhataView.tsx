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
  Lock,
  Unlock,
  Shield,
  ShieldCheck,
  Package,
  BarChart2,
  Mic,
  FileSpreadsheet,
  Volume2,
  QrCode,
  AlertTriangle,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { Language } from '../../types';
import { CustomerLedgerDetailView } from './CustomerLedgerDetailView';
import { PinSecurityLock, PIN_ENABLED_KEY, PIN_STORAGE_KEY } from './PinSecurityLock';
import {
  TallyStockAndProfit,
  ProductItem,
  loadStoredProducts,
  saveStoredProducts,
} from './TallyStockAndProfit';
import { PaymentQrCard } from './PaymentQrCard';
import { VoiceTransactionModal } from './VoiceTransactionModal';
import { tallySounds, BengaliVoiceRecognition, speakBengali } from '../../utils/tallyAudioVoice';
import { exportCustomersToExcel, exportTransactionsToExcel } from '../../utils/tallyExport';
import { CustomerCreditBadge } from './CustomerCreditBadge';
import { SmartTagadaModal } from './SmartTagadaModal';
import { PrintablePosReceipt } from './PrintablePosReceipt';
import { BusinessHealthCard } from './BusinessHealthCard';
import { calculateCustomerCreditScore } from '../../utils/tallyCreditScorer';

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
  // Step 1: Digital payment settings
  bkashNumber?: string;
  bkashType?: 'personal' | 'merchant';
  nagadNumber?: string;
  rocketNumber?: string;
  paymentInstructions?: string;
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
  photoUrl?: string;
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
  bkashNumber: '০১৭১২-৩৪৫৬৭৮',
  bkashType: 'personal',
  nagadNumber: '০১৭১২-৩৪৫৬৭৮',
  rocketNumber: '',
  paymentInstructions: 'রেফারেন্সে আপনার নাম অথবা ভাউচার নম্বর দিন।',
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

// Calculate Customer Due Aging in Days (FIFO based on transactions)
export function getCustomerDueAgingDays(customer: Customer, transactions: Transaction[]): number {
  if (customer.balance <= 0) return 0;

  const custTxs = transactions
    .filter((t) => t.customerId === customer.id)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  if (custTxs.length === 0) {
    const diffMs = Date.now() - (customer.createdAt || Date.now());
    return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
  }

  // FIFO Calculation: Deduct collections from oldest dues
  const dueEntries: { amount: number; date: string }[] = [];
  let collections = 0;

  for (const tx of custTxs) {
    if (tx.type === 'sale_due') {
      dueEntries.push({ amount: tx.amount, date: tx.date });
    } else if (tx.type === 'due_collection') {
      collections += tx.amount;
    }
  }

  let remainingPaid = collections;
  let oldestUnpaidDate: string | null = null;

  for (const entry of dueEntries) {
    if (remainingPaid >= entry.amount) {
      remainingPaid -= entry.amount;
    } else {
      oldestUnpaidDate = entry.date;
      break;
    }
  }

  const referenceDateStr = oldestUnpaidDate || custTxs[custTxs.length - 1]?.date;
  if (!referenceDateStr) return 0;

  const refTime = new Date(referenceDateStr).getTime();
  const diffDays = Math.floor((Date.now() - refTime) / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

// Get color-coded aging tier badge
export function getAgingTier(days: number): {
  label: string;
  badgeClass: string;
  dotClass: string;
  isUrgent: boolean;
} {
  if (days <= 7) {
    return {
      label: '১-৭ দিন',
      badgeClass: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
      dotClass: 'bg-emerald-500',
      isUrgent: false,
    };
  } else if (days <= 15) {
    return {
      label: '৮-১৫ দিন',
      badgeClass: 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800',
      dotClass: 'bg-blue-500',
      isUrgent: false,
    };
  } else if (days <= 30) {
    return {
      label: '১৬-৩০ দিন',
      badgeClass: 'bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300 dark:border-amber-800',
      dotClass: 'bg-amber-500',
      isUrgent: true,
    };
  } else {
    return {
      label: `${toBn(days)} দিন পুরনো`,
      badgeClass: 'bg-rose-50 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300 border-rose-300 dark:border-rose-800 font-black',
      dotClass: 'bg-rose-500',
      isUrgent: true,
    };
  }
}

export const TallyKhataView: React.FC<Props> = ({ lang }) => {
  const isBn = lang === 'bn';

  // Navigation tab inside Tally Khata
  const [activeTab, setActiveTab] = useState<'dashboard' | 'customers' | 'stock' | 'profit' | 'cashbook' | 'voucher' | 'reports' | 'settings'>('dashboard');

  // Security PIN Lock State (Disabled/Unlocked by default)
  const [isPinEnabled, setIsPinEnabled] = useState<boolean>(() => {
    return localStorage.getItem(PIN_ENABLED_KEY) === 'true';
  });
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [pinCodeInput, setPinCodeInput] = useState<string>(() => {
    return localStorage.getItem(PIN_STORAGE_KEY) || '1234';
  });
  const [pinChangeSuccess, setPinChangeSuccess] = useState<boolean>(false);

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
  const [customerSubView, setCustomerSubView] = useState<'none' | 'entry' | 'report'>('none');

  // Search query for customer
  const [customerSearch, setCustomerSearch] = useState<string>('');

  // Step 1 & 4: Customer due aging & AI Credit score filter
  const [customerAgingFilter, setCustomerAgingFilter] = useState<'all' | 'due' | '15' | '30' | 'credit_high' | 'credit_risk'>('all');

  // Step 1: Digital payment QR Modal state
  const [activePaymentQr, setActivePaymentQr] = useState<{ amount?: number; customerName?: string } | null>(null);

  // Step 4: Active Tagada Modal customer
  const [activeTagadaCustomer, setActiveTagadaCustomer] = useState<Customer | null>(null);

  // Modals state
  const [showAddCustomerModal, setShowAddCustomerModal] = useState<boolean>(false);
  const [showTransactionModal, setShowTransactionModal] = useState<boolean>(false);
  const [showVoucherModal, setShowVoucherModal] = useState<boolean>(false);
  const [showVoiceModal, setShowVoiceModal] = useState<boolean>(false);
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

  // Step 3: Inventory Products state & Low stock memo
  const [products, setProducts] = useState<ProductItem[]>(() => loadStoredProducts());
  const [selectedProductToAdd, setSelectedProductToAdd] = useState<string>('');

  useEffect(() => {
    saveStoredProducts(products);
  }, [products]);

  const lowStockProducts = useMemo(() => {
    return products.filter((p) => p.stock <= p.minStock);
  }, [products]);

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
        products,
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
        if (resData.data.products && Array.isArray(resData.data.products)) {
          setProducts(resData.data.products);
          saveStoredProducts(resData.data.products);
        }
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

  // Open customer detail / ledger screen (matching Screen 1 or Screen 2)
  const handleOpenCustomerDetail = (cust: Customer, mode: 'entry' | 'report' = 'entry') => {
    setSelectedCustomer(cust);
    setCustomerSubView(mode);
  };

  // Handle saving transaction from Screen 1 (Customer ledger entry)
  const handleSaveTransactionFromDetail = (txData: {
    type: 'sale_due' | 'due_collection';
    amount: number;
    note?: string;
    date: string;
    photoUrl?: string;
  }) => {
    if (!selectedCustomer) return;

    const now = new Date();
    const time = now.toTimeString().slice(0, 5);
    const voucherNo = `TK-${Math.floor(1000 + Math.random() * 9000)}`;

    const previousDue = selectedCustomer.balance;
    const balanceChange = txData.type === 'sale_due' ? txData.amount : -txData.amount;
    const currentDue = previousDue + balanceChange;

    const newTx: Transaction = {
      id: `tx_${Date.now()}`,
      voucherNo,
      type: txData.type,
      customerId: selectedCustomer.id,
      customerName: selectedCustomer.name,
      customerPhone: selectedCustomer.phone,
      amount: txData.amount,
      note: txData.note,
      photoUrl: txData.photoUrl,
      category: txData.type === 'sale_due' ? 'বাকি বিক্রি' : 'জমা গ্রহণ',
      previousDue,
      currentDue,
      date: txData.date || now.toISOString().slice(0, 10),
      time,
      createdAt: Date.now(),
    };

    // Update customer balance in state and update selectedCustomer
    const updatedCustomer: Customer = {
      ...selectedCustomer,
      balance: currentDue,
    };

    setCustomers((prev) =>
      prev.map((c) => (c.id === selectedCustomer.id ? updatedCustomer : c))
    );
    setSelectedCustomer(updatedCustomer);
    setTransactions((prev) => [newTx, ...prev]);

    // Background sync to server
    setTimeout(() => {
      handleServerSync();
    }, 200);
  };

  // Handle updating an existing transaction from Screen 2 (Report view)
  const handleUpdateTransaction = (updatedTx: Transaction) => {
    const oldTx = transactions.find((t) => t.id === updatedTx.id);
    if (!oldTx || !selectedCustomer) return;

    // Calculate delta on customer balance
    const oldEffect =
      oldTx.type === 'sale_due'
        ? oldTx.amount
        : oldTx.type === 'due_collection'
        ? -oldTx.amount
        : 0;
    const newEffect =
      updatedTx.type === 'sale_due'
        ? updatedTx.amount
        : updatedTx.type === 'due_collection'
        ? -updatedTx.amount
        : 0;
    const delta = newEffect - oldEffect;

    const newBalance = selectedCustomer.balance + delta;
    const updatedCustomer: Customer = {
      ...selectedCustomer,
      balance: newBalance,
    };

    setTransactions((prev) =>
      prev.map((t) => (t.id === updatedTx.id ? updatedTx : t))
    );
    setCustomers((prev) =>
      prev.map((c) => (c.id === selectedCustomer.id ? updatedCustomer : c))
    );
    setSelectedCustomer(updatedCustomer);

    setTimeout(() => {
      handleServerSync();
    }, 200);
  };

  // Handle deleting a transaction from Screen 2 (Report view)
  const handleDeleteTransactionFromDetail = (txId: string) => {
    const deletedTx = transactions.find((t) => t.id === txId);
    if (!deletedTx || !selectedCustomer) return;

    // Revert balance effect
    const effect =
      deletedTx.type === 'sale_due'
        ? deletedTx.amount
        : deletedTx.type === 'due_collection'
        ? -deletedTx.amount
        : 0;
    const newBalance = selectedCustomer.balance - effect;

    const updatedCustomer: Customer = {
      ...selectedCustomer,
      balance: newBalance,
    };

    setTransactions((prev) => prev.filter((t) => t.id !== txId));
    setCustomers((prev) =>
      prev.map((c) => (c.id === selectedCustomer.id ? updatedCustomer : c))
    );
    setSelectedCustomer(updatedCustomer);

    setTimeout(() => {
      handleServerSync();
    }, 200);
  };

  // Handle updating customer details (from Screen 1 / Screen 2 modal)
  const handleUpdateCustomer = (updatedCust: Customer) => {
    setCustomers((prev) =>
      prev.map((c) => (c.id === updatedCust.id ? updatedCust : c))
    );
    setSelectedCustomer(updatedCust);

    // Also update customerName and customerPhone across transactions
    setTransactions((prev) =>
      prev.map((t) =>
        t.customerId === updatedCust.id
          ? { ...t, customerName: updatedCust.name, customerPhone: updatedCust.phone }
          : t
      )
    );

    setTimeout(() => {
      handleServerSync();
    }, 200);
  };

  // Handle deleting customer and all related transactions
  const handleDeleteCustomer = (custId: string) => {
    setCustomers((prev) => prev.filter((c) => c.id !== custId));
    setTransactions((prev) => prev.filter((t) => t.customerId !== custId));
    setSelectedCustomer(null);
    setCustomerSubView('none');

    setTimeout(() => {
      handleServerSync();
    }, 200);
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

  // Step 1: Aging Counts & Overdue Stats
  const agingCounts = useMemo(() => {
    let dueCount = 0;
    let count15 = 0;
    let count30 = 0;
    let total30 = 0;
    let total15 = 0;

    customers.forEach((c) => {
      if (c.type === 'customer' && c.balance > 0) {
        dueCount += 1;
        const days = getCustomerDueAgingDays(c, transactions);
        if (days > 30) {
          count30 += 1;
          total30 += c.balance;
        } else if (days > 15) {
          count15 += 1;
          total15 += c.balance;
        }
      }
    });

    return { dueCount, count15, count30, total30, total15, allCount: customers.length };
  }, [customers, transactions]);

  // Filtered customers with search and due aging filter
  const filteredCustomers = useMemo(() => {
    const q = customerSearch.trim().toLowerCase();
    return customers.filter((c) => {
      const matchesSearch =
        c.name.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        (c.address && c.address.toLowerCase().includes(q));
      if (!matchesSearch) return false;

      if (customerAgingFilter === 'all') return true;
      if (customerAgingFilter === 'due') return c.balance > 0;

      if (customerAgingFilter === 'credit_high') {
        const credit = calculateCustomerCreditScore(c, transactions);
        return credit.score >= 80;
      }
      if (customerAgingFilter === 'credit_risk') {
        const credit = calculateCustomerCreditScore(c, transactions);
        return credit.score < 55;
      }

      const ageDays = getCustomerDueAgingDays(c, transactions);
      if (customerAgingFilter === '15') return c.balance > 0 && ageDays > 15;
      if (customerAgingFilter === '30') return c.balance > 0 && ageDays > 30;

      return true;
    });
  }, [customers, customerSearch, customerAgingFilter, transactions]);

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

    // Step 3: Auto-deduct stock from inventory for sale items
    if (validItems.length > 0 && (txType === 'sale_cash' || txType === 'sale_due')) {
      let lowStockAlertName: string | null = null;
      setProducts((prev) => {
        const updated = prev.map((prod) => {
          const matchedItem = validItems.find(
            (it) => it.name.trim().toLowerCase() === prod.name.trim().toLowerCase()
          );
          if (matchedItem) {
            const newStock = Math.max(0, prod.stock - matchedItem.quantity);
            if (newStock <= prod.minStock && prod.stock > prod.minStock) {
              lowStockAlertName = prod.name;
            }
            return { ...prod, stock: newStock };
          }
          return prod;
        });
        saveStoredProducts(updated);
        return updated;
      });

      if (lowStockAlertName) {
        setTimeout(() => {
          speakBengali(`সতর্কতা: ${lowStockAlertName} এর স্টক ফুরিয়ে যাচ্ছে`);
        }, 2200);
      }
    }

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

    // Sound & Voice feedback
    if (txType === 'due_collection' || txType === 'sale_cash') {
      tallySounds.playCashChime();
    } else {
      tallySounds.playDueAlert();
    }

    const typeName =
      txType === 'sale_due'
        ? 'বাকি'
        : txType === 'due_collection'
        ? 'জমা গ্রহণ'
        : txType === 'expense'
        ? 'খরচ'
        : 'নগদ বিক্রি';
    speakBengali(`৳ ${toBn(amountNum)} টাকা ${typeName} এন্ট্রি সম্পন্ন হয়েছে`);

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

  // Generate WhatsApp / SMS Reminder with Digital Payment Options
  const handleCopyTagada = (cust: Customer) => {
    const paymentMethods: string[] = [];
    if (shop.bkashNumber) {
      paymentMethods.push(`বিকাশ (${shop.bkashType === 'merchant' ? 'মার্চেন্ট' : 'পার্সোনাল'}): ${shop.bkashNumber}`);
    }
    if (shop.nagadNumber) {
      paymentMethods.push(`নগদ: ${shop.nagadNumber}`);
    }
    if (shop.rocketNumber) {
      paymentMethods.push(`রকেট: ${shop.rocketNumber}`);
    }

    const paySection = paymentMethods.length > 0
      ? ` | পেমেন্ট পাঠানোর মাধ্যম: ${paymentMethods.join(', ')}`
      : '';

    const text = `সম্মানিত গ্রাহক ${cust.name}, আপনার কাছে ${shop.name}-এর বকেয়া বাকি ${shop.currency} ${toBn(cust.balance)} টাকা।${paySection} দ্রুত পরিশোধ করার অনুরোধ রইল। যোগাযোগ: ${shop.phone}`;
    navigator.clipboard.writeText(text);
    setCopiedTagada(true);
    setTimeout(() => setCopiedTagada(false), 3000);
  };

  // If viewing a customer's dedicated ledger/entry screen or report screen
  if (customerSubView !== 'none' && selectedCustomer) {
    return (
      <CustomerLedgerDetailView
        customer={selectedCustomer}
        shop={shop}
        transactions={transactions}
        initialScreen={customerSubView}
        onBack={() => setCustomerSubView('none')}
        onSaveTransaction={handleSaveTransactionFromDetail}
        onUpdateTransaction={handleUpdateTransaction}
        onDeleteTransaction={handleDeleteTransactionFromDetail}
        onUpdateCustomer={handleUpdateCustomer}
        onDeleteCustomer={handleDeleteCustomer}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4 animate-fadeIn text-slate-800 dark:text-slate-100 relative">
      {/* 4-Digit Security PIN Lock Screen Modal (If active and locked) */}
      <PinSecurityLock
        isLocked={isLocked}
        onUnlock={() => setIsLocked(false)}
        shopName={shop.name}
        shopPhone={shop.phone}
      />

      {/* Top Shop Banner with Server Sync & PIN Lock Badge */}
      <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-emerald-700 via-teal-800 to-slate-900 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider bg-white/20 backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-1.5">
              <Store className="w-3.5 h-3.5" />
              ডিজিটাল টালি খাতা ও হিসাব মেমো
            </span>

            <div className="flex items-center gap-1.5">
              {/* Quick Lock Button */}
              <button
                type="button"
                onClick={() => {
                  tallySounds.playClickSound();
                  if (isPinEnabled) {
                    setIsLocked(true);
                  } else {
                    setActiveTab('settings');
                    alert('পিন লক সক্রিয় করতে সেটিংস থেকে ৪-ডিজিট পিন অন করুন।');
                  }
                }}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/15 hover:bg-white/25 border border-white/20 text-xs font-semibold text-white transition cursor-pointer"
                title={isPinEnabled ? 'অ্যাপ লক করুন' : 'পিন লক সেট করুন'}
              >
                <Lock className="w-3.5 h-3.5 text-emerald-300" />
                <span>{isPinEnabled ? 'লক' : 'পিন লক'}</span>
              </button>

              {/* Cloud Server Sync Button */}
              <button
                type="button"
                onClick={handleServerSync}
                disabled={syncStatus === 'syncing'}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/30 hover:bg-emerald-500/50 border border-emerald-400/40 text-xs font-semibold text-emerald-200 transition cursor-pointer"
                title="সার্ভারে ক্লাউড সিঙ্ক করুন"
              >
                <Cloud className={`w-3.5 h-3.5 ${syncStatus === 'syncing' ? 'animate-bounce' : ''}`} />
                <span>{syncStatus === 'syncing' ? 'সিঙ্ক...' : 'সার্ভার সিঙ্ক'}</span>
              </button>
            </div>
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
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
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

      {/* Main Feature Tabs Bar */}
      <div className="flex items-center bg-slate-200/80 dark:bg-slate-900 p-1 rounded-2xl border border-slate-300/60 dark:border-slate-800 text-xs font-bold overflow-x-auto no-scrollbar gap-1">
        <button
          onClick={() => {
            tallySounds.playClickSound();
            setActiveTab('dashboard');
          }}
          className={`shrink-0 py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'dashboard'
              ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>ড্যাশবোর্ড</span>
        </button>

        <button
          onClick={() => {
            tallySounds.playClickSound();
            setActiveTab('customers');
          }}
          className={`shrink-0 py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'customers'
              ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>কাস্টমার খাতা ({customers.length})</span>
        </button>

        <button
          onClick={() => {
            tallySounds.playClickSound();
            setActiveTab('stock');
          }}
          className={`shrink-0 py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer relative ${
            activeTab === 'stock'
              ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Package className="w-4 h-4 text-amber-500" />
          <span>পণ্য স্টক</span>
          {lowStockProducts.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-rose-600 text-white animate-pulse">
              {toBn(lowStockProducts.length)}
            </span>
          )}
        </button>

        <button
          onClick={() => {
            tallySounds.playClickSound();
            setActiveTab('profit');
          }}
          className={`shrink-0 py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'profit'
              ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <BarChart2 className="w-4 h-4 text-purple-500" />
          <span>লাভ-লোকসান</span>
        </button>

        <button
          onClick={() => {
            tallySounds.playClickSound();
            setActiveTab('cashbook');
          }}
          className={`shrink-0 py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'cashbook'
              ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>দৈনিক ক্যাশ</span>
        </button>

        <button
          onClick={() => {
            tallySounds.playClickSound();
            setActiveTab('reports');
          }}
          className={`shrink-0 py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'reports'
              ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>হিসাব রিপোর্ট</span>
        </button>

        <button
          onClick={() => {
            tallySounds.playClickSound();
            setActiveTab('settings');
          }}
          className={`shrink-0 py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'settings'
              ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Store className="w-4 h-4" />
          <span>দোকান সেটিংস</span>
        </button>
      </div>

      {/* ================= TAB 1: DASHBOARD ================= */}
      {activeTab === 'dashboard' && (
        <div className="flex flex-col gap-4 animate-fadeIn">
          {/* Step 4: AI Business Health Scorecard */}
          <BusinessHealthCard
            customers={customers}
            transactions={transactions}
            products={products}
            onNavigateToStock={() => {
              tallySounds.playClickSound();
              setActiveTab('stock');
            }}
          />

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

          {/* Overdue Debt Aging Alert Banner */}
          {agingCounts.count30 > 0 ? (
            <div className="p-4 rounded-3xl bg-linear-to-r from-rose-50 to-amber-50 dark:from-rose-950/50 dark:to-amber-950/40 border border-rose-200 dark:border-rose-900/60 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fadeIn">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-sm animate-pulse">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-600 text-white uppercase tracking-wider">
                      জরুরি তাগাদা সতর্কতা
                    </span>
                    <span className="text-xs font-bold text-rose-900 dark:text-rose-200">
                      ৩০+ দিনের পুরনো বকেয়া
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 mt-1">
                    <span className="font-bold text-rose-600 dark:text-rose-400">{toBn(agingCounts.count30)} জন</span> কাস্টমারের কাছে মোট{' '}
                    <span className="font-black text-rose-600 dark:text-rose-400">{shop.currency} {formatMoney(agingCounts.total30)}</span> টাকা ১ মাসেরও বেশি সময় ধরে বাকি রয়েছে!
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setCustomerAgingFilter('30');
                  setActiveTab('customers');
                  tallySounds.playClickSound();
                }}
                className="shrink-0 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>বাকিদের দেখুন ও তাগাদা দিন</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : agingCounts.count15 > 0 ? (
            <div className="p-4 rounded-3xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fadeIn">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                    <span>১৫+ দিনের পুরনো বকেয়া নোটিশ</span>
                  </h4>
                  <p className="text-xs text-slate-700 dark:text-slate-300 mt-0.5">
                    {toBn(agingCounts.count15)} জনের কাছে {shop.currency} {formatMoney(agingCounts.total15)} টাকা ১৫ দিনের বেশি পুরনো বাকি রয়েছে।
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setCustomerAgingFilter('15');
                  setActiveTab('customers');
                  tallySounds.playClickSound();
                }}
                className="shrink-0 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
              >
                <span>তালিকা ফিল্টার করুন</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : null}

          {/* Step 3: Low Stock Alert Banner */}
          {lowStockProducts.length > 0 && (
            <div className="p-4 rounded-3xl bg-linear-to-r from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/30 border border-amber-300 dark:border-amber-900/60 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fadeIn">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-600 text-white uppercase tracking-wider">
                      স্টক সতর্কতা (Low Stock Alert)
                    </span>
                    <span className="text-xs font-bold text-amber-900 dark:text-amber-200">
                      {toBn(lowStockProducts.length)}টি পণ্যের স্টক শেষ হয়ে আসছে!
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 mt-1">
                    {lowStockProducts.slice(0, 3).map((p) => `${p.name} (বাকি: ${toBn(p.stock)} ${p.unit})`).join(', ')}
                    {lowStockProducts.length > 3 ? ` এবং আরও ${toBn(lowStockProducts.length - 3)}টি পণ্য` : ''}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  tallySounds.playClickSound();
                  setActiveTab('stock');
                }}
                className="shrink-0 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>স্টক দেখুন ও রিস্টক করুন</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Bengali Voice Quick Assistant Card */}
          <div className="p-4 rounded-3xl bg-linear-to-r from-purple-700 via-indigo-700 to-slate-900 text-white shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fadeIn">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shrink-0 shadow-inner">
                <Mic className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-300" />
                    AI ভয়েস সহকারী
                  </span>
                  <span className="text-xs font-bold text-purple-200">মুখে বললেই অটো এন্ট্রি</span>
                </div>
                <h4 className="text-sm font-black mt-1">
                  বাংলায় কথা বলে যেকোনো হিসাব এন্ট্রি করুন
                </h4>
                <p className="text-[11px] text-purple-200 mt-0.5">
                  যেমন: "করিম ৫০০ টাকা বাকি" অথবা "রহিম ১০০০ টাকা দিল"
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                tallySounds.playClickSound();
                setShowVoiceModal(true);
              }}
              className="shrink-0 px-4 py-2.5 rounded-2xl bg-white text-purple-900 hover:bg-purple-50 font-black text-xs shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Mic className="w-4 h-4 text-purple-700" />
              <span>মুখে বলুন</span>
            </button>
          </div>

          {/* Quick Action Buttons Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
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

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    tallySounds.playClickSound();
                    setShowVoiceModal(true);
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md transition cursor-pointer active:scale-95"
                  title="মুখে বলে লেনদেন এন্ট্রি করুন"
                >
                  <Mic className="w-4 h-4" />
                  <span>ভয়েস এন্ট্রি</span>
                </button>

                <button
                  onClick={() => setShowAddCustomerModal(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  নতুন কাস্টমার
                </button>
              </div>
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

            {/* Filter Pills: সব | বাকি রয়েছে | ১৫+ দিন পুরনো | ৩০+ দিন পুরনো */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
              <button
                type="button"
                onClick={() => {
                  setCustomerAgingFilter('all');
                  tallySounds.playClickSound();
                }}
                className={`shrink-0 px-3 py-1.5 rounded-full font-bold transition cursor-pointer ${
                  customerAgingFilter === 'all'
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                সব ({toBn(agingCounts.allCount)})
              </button>

              <button
                type="button"
                onClick={() => {
                  setCustomerAgingFilter('due');
                  tallySounds.playClickSound();
                }}
                className={`shrink-0 px-3 py-1.5 rounded-full font-bold transition cursor-pointer ${
                  customerAgingFilter === 'due'
                    ? 'bg-red-600 text-white shadow-xs'
                    : 'bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300 hover:bg-red-100'
                }`}
              >
                বাকি রয়েছে ({toBn(agingCounts.dueCount)})
              </button>

              <button
                type="button"
                onClick={() => {
                  setCustomerAgingFilter('15');
                  tallySounds.playClickSound();
                }}
                className={`shrink-0 px-3 py-1.5 rounded-full font-bold transition cursor-pointer ${
                  customerAgingFilter === '15'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 hover:bg-amber-100'
                }`}
              >
                ১৫+ দিন পুরনো ({toBn(agingCounts.count15)})
              </button>

              <button
                type="button"
                onClick={() => {
                  setCustomerAgingFilter('30');
                  tallySounds.playClickSound();
                }}
                className={`shrink-0 px-3 py-1.5 rounded-full font-black transition cursor-pointer ${
                  customerAgingFilter === '30'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 hover:bg-rose-100'
                }`}
              >
                ⚠️ ৩০+ দিন বাকি ({toBn(agingCounts.count30)})
              </button>

              <button
                type="button"
                onClick={() => {
                  setCustomerAgingFilter('credit_high');
                  tallySounds.playClickSound();
                }}
                className={`shrink-0 px-3 py-1.5 rounded-full font-bold transition cursor-pointer ${
                  customerAgingFilter === 'credit_high'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 hover:bg-emerald-100'
                }`}
              >
                🌟 বিশ্বস্ত গ্রাহক (৮০+)
              </button>

              <button
                type="button"
                onClick={() => {
                  setCustomerAgingFilter('credit_risk');
                  tallySounds.playClickSound();
                }}
                className={`shrink-0 px-3 py-1.5 rounded-full font-bold transition cursor-pointer ${
                  customerAgingFilter === 'credit_risk'
                    ? 'bg-rose-700 text-white shadow-xs'
                    : 'bg-rose-50 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 hover:bg-rose-100'
                }`}
              >
                ⚠️ ঝুঁকিপূর্ণ ক্রেডিট
              </button>
            </div>
          </div>

          {/* Customers List */}
          <div className="flex flex-col gap-2.5">
            {filteredCustomers.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
                কোনো কাস্টমার বা সাপ্লায়ার পাওয়া যায়নি। নতুন গ্রাহক যোগ করুন।
              </div>
            ) : (
              filteredCustomers.map((cust) => {
                const initials =
                  cust.name
                    .split(' ')
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((p) => p[0].toUpperCase())
                    .join('') || 'C';

                const dueDays = getCustomerDueAgingDays(cust, transactions);
                const agingTier = getAgingTier(dueDays);

                return (
                  <div
                    key={cust.id}
                    className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-3 hover:border-emerald-500/50 transition"
                  >
                    {/* Top Clickable Area: Opens Screen 1 (Entry & Ledger) */}
                    <div
                      onClick={() => handleOpenCustomerDetail(cust, 'entry')}
                      className="flex items-start justify-between gap-3 cursor-pointer group"
                      title="কাস্টমার বিস্তারিত ও লেনদেন এন্ট্রি খুলুন"
                    >
                      <div className="flex items-center gap-3">
                        {/* Circular Avatar matching reference screenshots */}
                        <div className="w-11 h-11 rounded-full bg-orange-500 text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                          {initials}
                        </div>

                        <div>
                          <div className="flex flex-wrap items-center gap-1.5">
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
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

                            {cust.type === 'customer' && (
                              <CustomerCreditBadge customer={cust} transactions={transactions} compact />
                            )}

                            {cust.balance > 0 && (
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${agingTier.badgeClass}`}
                                title={`এই বকেয়াটি ${toBn(dueDays)} দিন পুরনো`}
                              >
                                <span className={`w-1.5 h-1.5 rounded-full ${agingTier.dotClass}`} />
                                {agingTier.label}
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 block flex items-center gap-1.5">
                            <Phone className="w-3 h-3" /> {cust.phone}
                            {cust.address && <span>• {cust.address}</span>}
                          </span>
                        </div>
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
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium block mt-0.5">
                          হিসাব খুলুন →
                        </span>
                      </div>
                    </div>

                    {/* Actions for this customer */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleOpenCustomerDetail(cust, 'entry')}
                          className="px-3 py-1.5 rounded-xl bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-950/60 dark:text-red-300 font-bold transition flex items-center gap-1"
                        >
                          <span>- দিলাম / বেচা</span>
                        </button>

                        <button
                          onClick={() => handleOpenCustomerDetail(cust, 'entry')}
                          className="px-3 py-1.5 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 font-bold transition flex items-center gap-1"
                        >
                          <span>+ পেলাম</span>
                        </button>

                        {/* Dedicated Report Button matching Screen 2 */}
                        <button
                          onClick={() => handleOpenCustomerDetail(cust, 'report')}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold transition flex items-center gap-1"
                          title="কাস্টমারের বিস্তারিত রিপোর্ট ও স্টেটমেন্ট দেখুন"
                        >
                          <FileText className="w-3.5 h-3.5 text-slate-500" />
                          <span>রিপোর্ট</span>
                        </button>

                        {/* Digital Payment QR Modal Trigger */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActivePaymentQr({
                              amount: cust.balance > 0 ? cust.balance : undefined,
                              customerName: cust.name,
                            });
                          }}
                          className="px-2.5 py-1.5 rounded-xl bg-pink-50 hover:bg-pink-100 text-pink-700 dark:bg-pink-950/50 dark:text-pink-300 font-bold transition flex items-center gap-1 cursor-pointer"
                          title="বিকাশ / নগদ পেমেন্ট কিউআর কোড"
                        >
                          <QrCode className="w-3.5 h-3.5 text-pink-600 dark:text-pink-400" />
                          <span>কিউআর</span>
                        </button>
                      </div>

                      {/* Tagada SMS & WhatsApp Multi-Template Modal */}
                      {cust.balance > 0 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            tallySounds.playClickSound();
                            setActiveTagadaCustomer(cust);
                          }}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-orange-50 dark:bg-orange-950/40 hover:bg-orange-100 text-orange-700 dark:text-orange-300 font-bold transition cursor-pointer shadow-2xs"
                          title="স্মার্ট তাগাদা মেসেজ ও হোয়াটসঅ্যাপ রিমাইন্ডার পাঠান"
                        >
                          <Send className="w-3.5 h-3.5 text-orange-600" />
                          <span>তাগাদা পাঠান</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ================= TAB: STOCK & INVENTORY ================= */}
      {activeTab === 'stock' && (
        <TallyStockAndProfit
          shop={shop}
          transactions={transactions}
          activeSubView="stock"
          products={products}
          onUpdateProducts={(updated) => setProducts(updated)}
        />
      )}

      {/* ================= TAB: PROFIT & LOSS ================= */}
      {activeTab === 'profit' && (
        <TallyStockAndProfit
          shop={shop}
          transactions={transactions}
          activeSubView="profit"
          products={products}
          onUpdateProducts={(updated) => setProducts(updated)}
        />
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

          {/* Step 4: AI Business Health Scorecard */}
          <BusinessHealthCard
            customers={customers}
            transactions={transactions}
            products={products}
            onNavigateToStock={() => {
              tallySounds.playClickSound();
              setActiveTab('stock');
            }}
          />

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

          {/* Excel / Spreadsheet 1-Click Export Row */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                tallySounds.playSuccessChime();
                exportCustomersToExcel(customers, shop);
              }}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition shadow-sm cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>কাস্টমার খাতা Excel (.csv)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                tallySounds.playSuccessChime();
                exportTransactionsToExcel(transactions, shop);
              }}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition shadow-sm cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>সব লেনদেন Excel (.csv)</span>
            </button>
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

            {/* Digital Payment QR & Mobile Banking Configuration Card */}
            <div className="p-4 rounded-2xl bg-pink-50/70 dark:bg-pink-950/20 border border-pink-200 dark:border-pink-900/50 flex flex-col gap-3.5">
              <div className="flex items-center justify-between pb-2 border-b border-pink-200/60 dark:border-pink-900/40">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-pink-500/15 text-pink-600 dark:text-pink-400 flex items-center justify-center font-bold">
                    <QrCode className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white">ডিজিটাল পেমেন্ট কিউআর ও অনলাইন সেটিংস</h4>
                    <p className="text-[11px] text-slate-500">বিকাশ, নগদ ও রকেট পেমেন্ট গ্রহণ ও তাগাদায় যুক্ত করুন</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    tallySounds.playClickSound();
                    setActivePaymentQr({ amount: 500, customerName: 'কাস্টমার টেস্ট' });
                  }}
                  className="px-3 py-1.5 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-bold text-[11px] transition flex items-center gap-1 cursor-pointer"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>কিউআর টেস্ট</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* bKash Number */}
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    বিকাশ নম্বর
                  </label>
                  <input
                    type="text"
                    value={shop.bkashNumber || ''}
                    onChange={(e) => setShop({ ...shop, bkashNumber: e.target.value })}
                    placeholder="০১৭১২-৩৪৫৬৭৮"
                    className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold"
                  />
                </div>

                {/* bKash Type */}
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    বিকাশ অ্যাকাউন্ট ধরন
                  </label>
                  <select
                    value={shop.bkashType || 'personal'}
                    onChange={(e) => setShop({ ...shop, bkashType: e.target.value as 'personal' | 'merchant' })}
                    className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold"
                  >
                    <option value="personal">পার্সোনাল (Personal Send Money)</option>
                    <option value="merchant">মার্চেন্ট (Merchant Payment)</option>
                  </select>
                </div>

                {/* Nagad Number */}
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    নগদ নম্বর
                  </label>
                  <input
                    type="text"
                    value={shop.nagadNumber || ''}
                    onChange={(e) => setShop({ ...shop, nagadNumber: e.target.value })}
                    placeholder="০১৭১২-৩৪৫৬৭৮"
                    className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold"
                  />
                </div>

                {/* Rocket Number */}
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    রকেট নম্বর (ঐচ্ছিক)
                  </label>
                  <input
                    type="text"
                    value={shop.rocketNumber || ''}
                    onChange={(e) => setShop({ ...shop, rocketNumber: e.target.value })}
                    placeholder="০১৭১২-৩৪৫৬৭৮-৯"
                    className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold"
                  />
                </div>
              </div>

              {/* Payment Instructions */}
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  পেমেন্ট নির্দেশনা বার্তা (মেমো ও তাগাদায় যুক্ত হবে)
                </label>
                <input
                  type="text"
                  value={shop.paymentInstructions || ''}
                  onChange={(e) => setShop({ ...shop, paymentInstructions: e.target.value })}
                  placeholder="রেফারেন্সে আপনার নাম অথবা ভাউচার নম্বর লিখুন..."
                  className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs"
                />
              </div>
            </div>

            {/* 4-Digit PIN Security Management Card */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white">৪-ডিজিট সিকিউরিটি পিন লক</h4>
                    <p className="text-[11px] text-slate-500">দোকানের গোপনীয় হিসাব রক্ষায় পিন কোড সেট করুন</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const next = !isPinEnabled;
                    setIsPinEnabled(next);
                    localStorage.setItem(PIN_ENABLED_KEY, next ? 'true' : 'false');
                    tallySounds.playClickSound();
                  }}
                  className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                    isPinEnabled ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                    isPinEnabled ? 'right-1' : 'left-1'
                  }`} />
                </button>
              </div>

              {isPinEnabled && (
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex flex-col gap-2">
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                    নতুন ৪-ডিজিট পিন কোড:
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="password"
                      maxLength={4}
                      value={pinCodeInput}
                      onChange={(e) => setPinCodeInput(e.target.value.replace(/\D/g, ''))}
                      placeholder="১২৩৪"
                      className="w-32 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-center text-sm font-black tracking-widest text-slate-900 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (pinCodeInput.length === 4) {
                          localStorage.setItem(PIN_STORAGE_KEY, pinCodeInput);
                          tallySounds.playSuccessChime();
                          setPinChangeSuccess(true);
                          setTimeout(() => setPinChangeSuccess(false), 3000);
                        } else {
                          alert('অনুগ্রহ করে ৪ ডিজিটের পিন লিখুন।');
                        }
                      }}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer"
                    >
                      পিন সেভ করুন
                    </button>
                  </div>
                  {pinChangeSuccess && (
                    <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> পিন সফলভাবে আপডেট হয়েছে!
                    </span>
                  )}
                </div>
              )}

              {/* Sound Test Button */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  ক্যাশ রেজিস্টার সাউন্ড শুনুন:
                </span>
                <button
                  type="button"
                  onClick={() => tallySounds.playCashChime()}
                  className="px-3 py-1.5 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Volume2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>সাউন্ড বাজান</span>
                </button>
              </div>
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
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowVoiceModal(true)}
                  className="px-2.5 py-1 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-[11px] flex items-center gap-1 cursor-pointer transition active:scale-95 shadow-xs"
                  title="মুখে বলে লেনদেন পূরণ করুন"
                >
                  <Mic className="w-3.5 h-3.5" />
                  <span>মুখে বলুন</span>
                </button>
                <button
                  onClick={() => setShowTransactionModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
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

              {/* Step 3: Stock Product Selector & Auto Deduction for Sales */}
              {(txType === 'sale_cash' || txType === 'sale_due') && (
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 text-xs">
                      <Package className="w-3.5 h-3.5 text-amber-500" />
                      <span>ইনভেন্টরি স্টক থেকে পণ্য যোগ করুন (ঐচ্ছিক)</span>
                    </span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                      অটো স্টক কমবে
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={selectedProductToAdd}
                      onChange={(e) => setSelectedProductToAdd(e.target.value)}
                      className="flex-1 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-medium"
                    >
                      <option value="">— স্টক থেকে পণ্য বেছে নিন —</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id} disabled={p.stock <= 0}>
                          {p.name} (স্টক: {toBn(p.stock)} {p.unit}) — ৳ {toBn(p.sellPrice)}
                          {p.stock <= p.minStock ? ' ⚠️ স্বল্প স্টক' : ''}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      disabled={!selectedProductToAdd}
                      onClick={() => {
                        const prod = products.find((p) => p.id === selectedProductToAdd);
                        if (!prod) return;
                        tallySounds.playClickSound();

                        const existingIdx = voucherItems.findIndex(
                          (it) => it.name.trim().toLowerCase() === prod.name.trim().toLowerCase()
                        );

                        let updatedItems: VoucherItem[];
                        if (existingIdx >= 0) {
                          updatedItems = voucherItems.map((it, idx) => {
                            if (idx === existingIdx) {
                              const newQty = it.quantity + 1;
                              return { ...it, quantity: newQty, total: newQty * it.unitPrice };
                            }
                            return it;
                          });
                        } else {
                          const isFirstEmpty = voucherItems.length === 1 && !voucherItems[0].name.trim();
                          const newItem: VoucherItem = {
                            id: `item_${Date.now()}`,
                            name: prod.name,
                            quantity: 1,
                            unitPrice: prod.sellPrice,
                            total: prod.sellPrice,
                          };
                          updatedItems = isFirstEmpty ? [newItem] : [...voucherItems, newItem];
                        }

                        setVoucherItems(updatedItems);
                        const sumTotal = updatedItems.reduce((acc, curr) => acc + curr.total, 0);
                        setTxAmount(String(sumTotal));
                        const itemSummary = updatedItems.map((it) => `${it.name} (${toBn(it.quantity)})`).join(', ');
                        setTxNote(itemSummary);
                        setSelectedProductToAdd('');
                      }}
                      className="px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-slate-950 font-bold text-xs shrink-0 transition flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>যোগ করুন</span>
                    </button>
                  </div>

                  {/* Selected items list */}
                  {voucherItems.filter((it) => it.name.trim()).length > 0 && (
                    <div className="mt-1 flex flex-col gap-1.5 border-t border-slate-200 dark:border-slate-800 pt-2">
                      {voucherItems
                        .filter((it) => it.name.trim())
                        .map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px]"
                          >
                            <div className="flex-1 min-w-0 pr-2">
                              <span className="font-bold text-slate-800 dark:text-slate-200 truncate block">
                                {item.name}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                দর: ৳ {toBn(item.unitPrice)}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newQty = Math.max(1, item.quantity - 1);
                                    const updated = voucherItems.map((it) =>
                                      it.id === item.id ? { ...it, quantity: newQty, total: newQty * it.unitPrice } : it
                                    );
                                    setVoucherItems(updated);
                                    const sum = updated.reduce((acc, c) => acc + c.total, 0);
                                    setTxAmount(String(sum));
                                    setTxNote(updated.map((it) => `${it.name} (${toBn(it.quantity)})`).join(', '));
                                  }}
                                  className="w-5 h-5 flex items-center justify-center font-bold text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 rounded cursor-pointer"
                                >
                                  -
                                </button>
                                <span className="font-bold px-1 text-slate-800 dark:text-slate-100">
                                  {toBn(item.quantity)}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newQty = item.quantity + 1;
                                    const updated = voucherItems.map((it) =>
                                      it.id === item.id ? { ...it, quantity: newQty, total: newQty * it.unitPrice } : it
                                    );
                                    setVoucherItems(updated);
                                    const sum = updated.reduce((acc, c) => acc + c.total, 0);
                                    setTxAmount(String(sum));
                                    setTxNote(updated.map((it) => `${it.name} (${toBn(it.quantity)})`).join(', '));
                                  }}
                                  className="w-5 h-5 flex items-center justify-center font-bold text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 rounded cursor-pointer"
                                >
                                  +
                                </button>
                              </div>

                              <span className="font-black text-emerald-600 dark:text-emerald-400 min-w-14 text-right">
                                ৳ {toBn(item.total)}
                              </span>

                              <button
                                type="button"
                                onClick={() => {
                                  const updated = voucherItems.filter((it) => it.id !== item.id);
                                  const effective = updated.length > 0 ? updated : [{ id: 'item_1', name: '', quantity: 1, unitPrice: 0, total: 0 }];
                                  setVoucherItems(effective);
                                  const sum = updated.reduce((acc, c) => acc + c.total, 0);
                                  setTxAmount(sum > 0 ? String(sum) : '');
                                  setTxNote(updated.map((it) => `${it.name} (${toBn(it.quantity)})`).join(', '));
                                }}
                                className="p-1 rounded text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
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
        <PrintablePosReceipt
          transaction={currentVoucher}
          shop={shop}
          customer={customers.find((c) => c.id === currentVoucher.customerId)}
          onClose={() => setShowVoucherModal(false)}
        />
      )}

      {/* ================= MODAL: SMART MULTI-TEMPLATE TAGADA ================= */}
      {activeTagadaCustomer && (
        <SmartTagadaModal
          customer={activeTagadaCustomer}
          shop={shop}
          onClose={() => setActiveTagadaCustomer(null)}
        />
      )}

      {/* ================= MODAL: DIGITAL PAYMENT QR CODE ================= */}
      {activePaymentQr && (
        <PaymentQrCard
          shop={shop}
          amount={activePaymentQr.amount}
          customerName={activePaymentQr.customerName}
          showInModal={true}
          onClose={() => setActivePaymentQr(null)}
        />
      )}

      {/* ================= MODAL: BENGALI VOICE TRANSACTION ================= */}
      {showVoiceModal && (
        <VoiceTransactionModal
          isOpen={showVoiceModal}
          onClose={() => setShowVoiceModal(false)}
          customers={customers}
          onConfirmVoiceTx={(data) => {
            const now = new Date();
            const dateStr = now.toISOString().slice(0, 10);
            const timeStr = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
            const voucherNo = `VCH-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(transactions.length + 1).padStart(3, '0')}`;

            const targetCust = customers.find((c) => c.id === data.customerId);
            let prevDue = targetCust ? targetCust.balance : 0;
            let newDue = prevDue;

            if (targetCust) {
              if (data.type === 'sale_due') {
                newDue = prevDue + data.amount;
              } else if (data.type === 'due_collection') {
                newDue = prevDue - data.amount;
              }
              setCustomers((prev) =>
                prev.map((c) => (c.id === targetCust.id ? { ...c, balance: newDue } : c))
              );
            }

            let cat = 'ভয়েস এন্ট্রি';
            if (data.type === 'sale_due') cat = 'বাকি বিক্রি';
            else if (data.type === 'due_collection') cat = 'বাকি আদায়';
            else if (data.type === 'expense') cat = 'খরচ';
            else if (data.type === 'sale_cash') cat = 'নগদ বিক্রি';

            const newTx: Transaction = {
              id: `tx_${Date.now()}`,
              voucherNo,
              type: data.type,
              customerId: targetCust?.id,
              customerName: targetCust?.name,
              customerPhone: targetCust?.phone,
              amount: data.amount,
              category: cat,
              note: data.note,
              previousDue: targetCust ? prevDue : undefined,
              currentDue: targetCust ? newDue : undefined,
              date: dateStr,
              time: timeStr,
              createdAt: Date.now(),
            };

            setTransactions([newTx, ...transactions]);

            setTimeout(() => {
              handleServerSync();
            }, 300);

            setCurrentVoucher(newTx);
            setShowVoucherModal(true);
          }}
        />
      )}
    </div>
  );
};
