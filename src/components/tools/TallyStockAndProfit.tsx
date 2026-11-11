import React, { useState, useMemo } from 'react';
import {
  Package,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Plus,
  Search,
  DollarSign,
  BarChart2,
  Calendar,
  CheckCircle2,
  Trash2,
  Edit2,
  X,
  ArrowUpRight,
  ArrowDownLeft,
  FileSpreadsheet,
  Printer,
  Sparkles,
  Layers,
  ArrowRight,
  Check,
} from 'lucide-react';
import { ShopProfile, Transaction, toBn, formatMoney } from './TallyKhataView';
import { tallySounds, speakBengali } from '../../utils/tallyAudioVoice';
import { exportStockToExcel } from '../../utils/tallyExport';

export interface ProductItem {
  id: string;
  name: string;
  buyPrice: number;
  sellPrice: number;
  stock: number;
  unit: string;
  minStock: number;
}

export const STOCK_STORAGE_KEY = 'smarthub_tally_stock_items';

export const DEFAULT_PRODUCTS: ProductItem[] = [
  { id: 'p1', name: 'মিনিকেট চাল (৫০ কেজি)', buyPrice: 3200, sellPrice: 3500, stock: 12, unit: 'বস্তা', minStock: 5 },
  { id: 'p2', name: 'রূপচাঁদা সয়াবিন তেল (৫ লিটার)', buyPrice: 780, sellPrice: 840, stock: 4, unit: 'বোতল', minStock: 6 },
  { id: 'p3', name: 'তীর চিনি (১ কেজি)', buyPrice: 125, sellPrice: 135, stock: 45, unit: 'কেজি', minStock: 10 },
  { id: 'p4', name: 'প্রাণ গুঁড়ো দুধ (৫০০ গ্রাম)', buyPrice: 410, sellPrice: 460, stock: 2, unit: 'প্যাকেট', minStock: 5 },
  { id: 'p5', name: 'আইয়োডিনযুক্ত লবণ (১ কেজি)', buyPrice: 32, sellPrice: 40, stock: 28, unit: 'কেজি', minStock: 8 },
  { id: 'p6', name: 'আটা ২ কেজি প্যাকেট', buyPrice: 95, sellPrice: 110, stock: 35, unit: 'প্যাকেট', minStock: 8 },
  { id: 'p7', name: 'মসুর ডাল (১ কেজি)', buyPrice: 120, sellPrice: 135, stock: 3, unit: 'কেজি', minStock: 5 },
];

export function loadStoredProducts(): ProductItem[] {
  try {
    const saved = localStorage.getItem(STOCK_STORAGE_KEY);
    return saved ? JSON.parse(saved) : DEFAULT_PRODUCTS;
  } catch {
    return DEFAULT_PRODUCTS;
  }
}

export function saveStoredProducts(products: ProductItem[]): void {
  try {
    localStorage.setItem(STOCK_STORAGE_KEY, JSON.stringify(products));
  } catch {}
}

interface TallyStockAndProfitProps {
  shop: ShopProfile;
  transactions: Transaction[];
  activeSubView: 'stock' | 'profit';
  products?: ProductItem[];
  onUpdateProducts?: (updated: ProductItem[]) => void;
}

export const TallyStockAndProfit: React.FC<TallyStockAndProfitProps> = ({
  shop,
  transactions,
  activeSubView,
  products: parentProducts,
  onUpdateProducts,
}) => {
  const [internalProducts, setInternalProducts] = useState<ProductItem[]>(() => loadStoredProducts());

  const products = parentProducts || internalProducts;

  const updateProductList = (updated: ProductItem[]) => {
    if (onUpdateProducts) {
      onUpdateProducts(updated);
    }
    setInternalProducts(updated);
    saveStoredProducts(updated);
  };

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [stockFilter, setStockFilter] = useState<'all' | 'low'>('all');
  const [profitTimeframe, setProfitTimeframe] = useState<'today' | '7days' | 'month' | 'all'>('month');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);
  const [quickAdjustProduct, setQuickAdjustProduct] = useState<ProductItem | null>(null);
  const [quickAdjustAmount, setQuickAdjustAmount] = useState<string>('5');
  const [adjustType, setAdjustType] = useState<'add' | 'remove'>('add');

  // Form state
  const [pName, setPName] = useState<string>('');
  const [pBuy, setPBuy] = useState<string>('');
  const [pSell, setPSell] = useState<string>('');
  const [pStock, setPStock] = useState<string>('');
  const [pUnit, setPUnit] = useState<string>('পিস');
  const [pMin, setPMin] = useState<string>('5');

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pName.trim()) return;

    if (editingProduct) {
      const updated = products.map((p) =>
        p.id === editingProduct.id
          ? {
              ...p,
              name: pName.trim(),
              buyPrice: parseFloat(pBuy) || 0,
              sellPrice: parseFloat(pSell) || 0,
              stock: Math.max(0, parseFloat(pStock) || 0),
              unit: pUnit.trim() || 'পিস',
              minStock: parseFloat(pMin) || 5,
            }
          : p
      );
      updateProductList(updated);
    } else {
      const newItem: ProductItem = {
        id: `prod_${Date.now()}`,
        name: pName.trim(),
        buyPrice: parseFloat(pBuy) || 0,
        sellPrice: parseFloat(pSell) || 0,
        stock: Math.max(0, parseFloat(pStock) || 0),
        unit: pUnit.trim() || 'পিস',
        minStock: parseFloat(pMin) || 5,
      };
      updateProductList([newItem, ...products]);
    }

    tallySounds.playSuccessChime();
    setShowAddModal(false);
    setEditingProduct(null);
    setPName('');
    setPBuy('');
    setPSell('');
    setPStock('');
  };

  const handleDelete = (id: string) => {
    if (window.confirm('আপনি কি এই পণ্যটি মুছে ফেলতে চান?')) {
      const updated = products.filter((p) => p.id !== id);
      updateProductList(updated);
      tallySounds.playClickSound();
    }
  };

  // Quick Stock Adjustment (+ মাল ঢুকলো / - পণ্য নষ্ট বা সমন্বয়)
  const handleQuickAdjustStock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickAdjustProduct) return;
    const qty = parseFloat(quickAdjustAmount);
    if (isNaN(qty) || qty <= 0) return;

    const delta = adjustType === 'add' ? qty : -qty;
    const updated = products.map((p) => {
      if (p.id === quickAdjustProduct.id) {
        const nextStock = Math.max(0, p.stock + delta);
        return { ...p, stock: nextStock };
      }
      return p;
    });

    updateProductList(updated);
    tallySounds.playCashChime();
    speakBengali(
      `${quickAdjustProduct.name} ${adjustType === 'add' ? 'স্টক যোগ' : 'স্টক মাইনাস'} হয়েছে`
    );
    setQuickAdjustProduct(null);
    setQuickAdjustAmount('5');
  };

  // Stock Analytics
  const stockStats = useMemo(() => {
    let totalStockValue = 0;
    let totalSellingValue = 0;
    let lowStockCount = 0;

    products.forEach((p) => {
      totalStockValue += p.buyPrice * p.stock;
      totalSellingValue += p.sellPrice * p.stock;
      if (p.stock <= p.minStock) lowStockCount++;
    });

    return {
      totalProducts: products.length,
      totalStockValue,
      totalSellingValue,
      expectedProfit: totalSellingValue - totalStockValue,
      lowStockCount,
    };
  }, [products]);

  // Filtered transactions for selected timeframe in Profit & Loss
  const filteredTxsForProfit = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const monthPrefix = todayStr.slice(0, 7); // e.g. '2026-11'

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(now.getDate() - 7);
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().slice(0, 10);

    return transactions.filter((tx) => {
      if (profitTimeframe === 'today') return tx.date === todayStr;
      if (profitTimeframe === '7days') return tx.date >= sevenDaysAgoStr;
      if (profitTimeframe === 'month') return tx.date.startsWith(monthPrefix);
      return true; // 'all'
    });
  }, [transactions, profitTimeframe]);

  // Profit & Loss calculation based on filtered timeframe
  const profitStats = useMemo(() => {
    let totalSalesRevenue = 0;
    let totalExpenses = 0;
    let totalDueCollected = 0;
    let totalDueGiven = 0;

    // Track expense categories breakdown
    const expenseByCategory: Record<string, number> = {};

    filteredTxsForProfit.forEach((tx) => {
      if (tx.type === 'sale_cash' || tx.type === 'sale_due') {
        totalSalesRevenue += tx.amount;
        if (tx.type === 'sale_due') totalDueGiven += tx.amount;
      } else if (tx.type === 'expense') {
        totalExpenses += tx.amount;
        const cat = tx.category || tx.note || 'সাধারণ খরচ';
        expenseByCategory[cat] = (expenseByCategory[cat] || 0) + tx.amount;
      } else if (tx.type === 'due_collection') {
        totalDueCollected += tx.amount;
      }
    });

    // Estimate COGS (Cost of Goods Sold): average wholesale ratio ~82% or based on product catalogue margin
    const estimatedCogs = totalSalesRevenue * 0.82;
    const grossProfit = totalSalesRevenue - estimatedCogs;
    const netProfit = grossProfit - totalExpenses;
    const profitMargin = totalSalesRevenue > 0 ? (netProfit / totalSalesRevenue) * 100 : 0;
    const grossMargin = totalSalesRevenue > 0 ? (grossProfit / totalSalesRevenue) * 100 : 0;

    const sortedExpenseCategories = Object.entries(expenseByCategory)
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount);

    return {
      totalSalesRevenue,
      totalExpenses,
      estimatedCogs,
      grossProfit,
      netProfit,
      profitMargin,
      grossMargin,
      totalDueCollected,
      totalDueGiven,
      sortedExpenseCategories,
    };
  }, [filteredTxsForProfit]);

  // Filtered Products for Stock View
  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return products.filter((p) => {
      const matchSearch = p.name.toLowerCase().includes(q) || p.unit.toLowerCase().includes(q);
      if (!matchSearch) return false;
      if (stockFilter === 'low') return p.stock <= p.minStock;
      return true;
    });
  }, [products, searchQuery, stockFilter]);

  return (
    <div className="flex flex-col gap-4 animate-fadeIn">
      {/* ================= VIEW 1: STOCK & INVENTORY ================= */}
      {activeSubView === 'stock' && (
        <div className="flex flex-col gap-4">
          {/* Top Analytics Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  মোট মালামাল পণ্য
                </span>
                <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1 block">
                  {toBn(stockStats.totalProducts)} টি
                </span>
              </div>
              <span className="text-[10px] text-slate-500 mt-1">দোকানের সব পণ্য</span>
            </div>

            <div className="p-4 rounded-3xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 shadow-xs flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
                  মোট ক্রয়মূল্য (স্টক সম্পদ)
                </span>
                <span className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 block">
                  {shop.currency} {formatMoney(stockStats.totalStockValue)}
                </span>
              </div>
              <span className="text-[10px] text-slate-500 mt-1">মজুদ মালের পাইকারি মূল্য</span>
            </div>

            <div className="p-4 rounded-3xl bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40 shadow-xs flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider block">
                  সম্ভাব্য বিক্রয়মূল্য
                </span>
                <span className="text-xl sm:text-2xl font-black text-blue-600 dark:text-blue-400 mt-1 block">
                  {shop.currency} {formatMoney(stockStats.totalSellingValue)}
                </span>
              </div>
              <span className="text-[10px] text-slate-500 mt-1">
                সম্ভাব্য লাভ: {shop.currency} {formatMoney(stockStats.expectedProfit)}
              </span>
            </div>

            <div
              onClick={() => setStockFilter(stockFilter === 'low' ? 'all' : 'low')}
              className={`p-4 rounded-3xl border shadow-xs flex flex-col justify-between cursor-pointer transition ${
                stockStats.lowStockCount > 0
                  ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800 hover:border-amber-500'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
              }`}
            >
              <div>
                <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider block flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 text-amber-600" /> স্টক শেষ সতর্কতা
                </span>
                <span className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400 mt-1 block">
                  {toBn(stockStats.lowStockCount)} টি পণ্য
                </span>
              </div>
              <span className="text-[10px] text-amber-700 dark:text-amber-400 underline mt-1">
                {stockFilter === 'low' ? 'সব পণ্য দেখুন' : 'ক্লিক করে ফিল্টার করুন'}
              </span>
            </div>
          </div>

          {/* Action Header & Search Bar */}
          <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Package className="w-4 h-4 text-emerald-500" />
                  দোকানের পণ্য ইনভেন্টরি ও স্টক
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  ক্রয়মূল্য, বিক্রয়মূল্য ও সঠিক স্টক গণনা
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    tallySounds.playSuccessChime();
                    exportStockToExcel(products, shop);
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition shadow-xs cursor-pointer"
                  title="এক্সেল ফাইলে স্টক রিপোর্ট ডাউনলোড করুন"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                  <span>স্টক Excel (.csv)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setEditingProduct(null);
                    setPName('');
                    setPBuy('');
                    setPSell('');
                    setPStock('');
                    setPUnit('পিস');
                    setPMin('5');
                    setShowAddModal(true);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>নতুন পণ্য স্টক</span>
                </button>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 pt-1">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="পণ্যের নাম দিয়ে খুঁজুন..."
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto text-xs shrink-0">
                <button
                  type="button"
                  onClick={() => setStockFilter('all')}
                  className={`px-3 py-1.5 rounded-full font-bold transition cursor-pointer ${
                    stockFilter === 'all'
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  সব পণ্য ({toBn(products.length)})
                </button>
                <button
                  type="button"
                  onClick={() => setStockFilter('low')}
                  className={`px-3 py-1.5 rounded-full font-bold transition cursor-pointer flex items-center gap-1 ${
                    stockFilter === 'low'
                      ? 'bg-amber-600 text-white'
                      : 'bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                  }`}
                >
                  <AlertTriangle className="w-3 h-3" />
                  স্টক শেষ ({toBn(stockStats.lowStockCount)})
                </button>
              </div>
            </div>
          </div>

          {/* Products List Cards */}
          <div className="flex flex-col gap-2.5">
            {filteredProducts.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
                কোনো পণ্য খুঁজে পাওয়া যায়নি।
              </div>
            ) : (
              filteredProducts.map((p) => {
                const isLow = p.stock <= p.minStock;
                const profitPerUnit = p.sellPrice - p.buyPrice;
                const unitMargin = p.sellPrice > 0 ? (profitPerUnit / p.sellPrice) * 100 : 0;

                return (
                  <div
                    key={p.id}
                    className={`p-4 rounded-3xl bg-white dark:bg-slate-900 border shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition ${
                      isLow
                        ? 'border-amber-300 dark:border-amber-800 bg-amber-50/20'
                        : 'border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-sm shrink-0 shadow-xs ${
                          isLow
                            ? 'bg-amber-500/15 text-amber-600 animate-pulse'
                            : 'bg-emerald-500/10 text-emerald-600'
                        }`}
                      >
                        <Package className="w-6 h-6" />
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                            {p.name}
                          </h4>
                          {isLow && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-black bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" /> রি-অর্ডার করুন!
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-2.5 text-xs text-slate-500 dark:text-slate-400 mt-1">
                          <span>ক্রয়: {shop.currency} {formatMoney(p.buyPrice)}</span>
                          <span>• বিক্রয়: {shop.currency} {formatMoney(p.sellPrice)}</span>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">
                            লাভ: {shop.currency} {formatMoney(profitPerUnit)} ({toBn(unitMargin.toFixed(0))}%)
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                      {/* Stock Value Indicator */}
                      <div className="text-right">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">
                          বর্তমান মজুদ
                        </span>
                        <span
                          className={`text-base font-black ${
                            isLow ? 'text-amber-600 dark:text-amber-400' : 'text-slate-900 dark:text-white'
                          }`}
                        >
                          {toBn(p.stock)} {p.unit}
                        </span>
                      </div>

                      {/* Quick Adjust Button */}
                      <button
                        type="button"
                        onClick={() => {
                          setQuickAdjustProduct(p);
                          setAdjustType('add');
                          setQuickAdjustAmount('5');
                        }}
                        className="px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 font-bold text-xs transition cursor-pointer flex items-center gap-1"
                        title="স্টক সংখ্যা বাড়ানো বা কমানো"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>স্টক সমন্বয়</span>
                      </button>

                      {/* Edit & Delete Buttons */}
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingProduct(p);
                            setPName(p.name);
                            setPBuy(p.buyPrice.toString());
                            setPSell(p.sellPrice.toString());
                            setPStock(p.stock.toString());
                            setPUnit(p.unit);
                            setPMin(p.minStock.toString());
                            setShowAddModal(true);
                          }}
                          className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                          title="এডিট করুন"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(p.id)}
                          className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                          title="মুছুন"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ================= VIEW 2: PROFIT & LOSS REPORT ================= */}
      {activeSubView === 'profit' && (
        <div className="flex flex-col gap-4">
          {/* Timeframe Filter Buttons */}
          <div className="p-3.5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between gap-2 overflow-x-auto">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300 shrink-0 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-emerald-500" />
              হিসাবের সময়কাল:
            </span>
            <div className="flex items-center gap-1.5 text-xs font-bold">
              <button
                type="button"
                onClick={() => setProfitTimeframe('today')}
                className={`px-3 py-1.5 rounded-full transition cursor-pointer ${
                  profitTimeframe === 'today'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                আজকের
              </button>

              <button
                type="button"
                onClick={() => setProfitTimeframe('7days')}
                className={`px-3 py-1.5 rounded-full transition cursor-pointer ${
                  profitTimeframe === '7days'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                গত ৭ দিন
              </button>

              <button
                type="button"
                onClick={() => setProfitTimeframe('month')}
                className={`px-3 py-1.5 rounded-full transition cursor-pointer ${
                  profitTimeframe === 'month'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                চলতি মাস
              </button>

              <button
                type="button"
                onClick={() => setProfitTimeframe('all')}
                className={`px-3 py-1.5 rounded-full transition cursor-pointer ${
                  profitTimeframe === 'all'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                সর্বমোট
              </button>
            </div>
          </div>

          {/* Main Net Profit Display Banner */}
          <div className="p-5 sm:p-6 rounded-3xl bg-linear-to-br from-emerald-700 via-teal-800 to-slate-900 text-white shadow-xl flex flex-col gap-4 relative overflow-hidden">
            <div className="flex items-center justify-between relative z-10">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-200 block">
                  {profitTimeframe === 'today'
                    ? 'আজকের নিট লাভ (Today Net Profit)'
                    : profitTimeframe === '7days'
                    ? 'গত ৭ দিনের নিট লাভ'
                    : profitTimeframe === 'month'
                    ? 'চলতি মাসের নিট লাভ (Monthly Net Profit)'
                    : 'সর্বমোট নিট লাভ (All-time Net Profit)'}
                </span>
                <h2 className="text-3xl sm:text-4xl font-black mt-1">
                  {shop.currency} {formatMoney(Math.max(0, profitStats.netProfit))}
                </h2>
              </div>

              <div className="p-3 rounded-2xl bg-white/15 backdrop-blur-md text-white font-bold text-sm flex items-center gap-1.5 shadow-sm">
                <TrendingUp className="w-5 h-5 text-emerald-300" />
                <span>{toBn(profitStats.profitMargin.toFixed(1))}% নিট মার্জিন</span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-white/20 text-xs relative z-10">
              <div>
                <span className="text-white/70 block">মোট বিক্রি (Revenue):</span>
                <span className="font-bold text-base mt-0.5 block">
                  {shop.currency} {formatMoney(profitStats.totalSalesRevenue)}
                </span>
              </div>

              <div>
                <span className="text-white/70 block">মালের পাইকারি খরচ (COGS):</span>
                <span className="font-bold text-base mt-0.5 block text-slate-200">
                  {shop.currency} {formatMoney(profitStats.estimatedCogs)}
                </span>
              </div>

              <div>
                <span className="text-white/70 block">গ্রস লাভ (Gross Profit):</span>
                <span className="font-bold text-base mt-0.5 block text-emerald-300">
                  {shop.currency} {formatMoney(profitStats.grossProfit)}
                </span>
              </div>

              <div>
                <span className="text-white/70 block">দোকান খরচ (Expenses):</span>
                <span className="font-bold text-base mt-0.5 block text-rose-300">
                  -{shop.currency} {formatMoney(profitStats.totalExpenses)}
                </span>
              </div>
            </div>
          </div>

          {/* Breakdown cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Revenue & Gross Profit Card */}
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-3">
              <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-emerald-500" />
                আয় ও বিক্রির বিশদ বিবরণ
              </h4>
              <div className="flex flex-col gap-2 text-xs">
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 flex justify-between items-center">
                  <span className="font-medium text-slate-600 dark:text-slate-300">মোট বিক্রয় (নগদ ও বাকি):</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {shop.currency} {formatMoney(profitStats.totalSalesRevenue)}
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 flex justify-between items-center">
                  <span className="font-medium text-slate-600 dark:text-slate-300">বাকি দেয়া হয়েছে:</span>
                  <span className="font-bold text-red-600">
                    {shop.currency} {formatMoney(profitStats.totalDueGiven)}
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 flex justify-between items-center">
                  <span className="font-medium text-slate-600 dark:text-slate-300">পুরনো বাকি আদায়:</span>
                  <span className="font-bold text-emerald-600">
                    +{shop.currency} {formatMoney(profitStats.totalDueCollected)}
                  </span>
                </div>
              </div>
            </div>

            {/* Operating Expenses Breakdown */}
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-rose-500" />
                  দোকান পরিচালন খরচ খাতসমূহ
                </h4>
                <span className="text-xs font-black text-rose-600">
                  মোট: {shop.currency} {formatMoney(profitStats.totalExpenses)}
                </span>
              </div>

              <div className="flex flex-col gap-2 text-xs">
                {profitStats.sortedExpenseCategories.length === 0 ? (
                  <div className="p-6 text-center text-slate-400">এই সময়কালে কোনো খরচ এন্ট্রি নেই।</div>
                ) : (
                  profitStats.sortedExpenseCategories.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 flex justify-between items-center"
                    >
                      <span className="font-semibold text-slate-700 dark:text-slate-200">{item.name}</span>
                      <span className="font-black text-rose-600">
                        {shop.currency} {formatMoney(item.amount)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                {editingProduct ? 'পণ্য তথ্য এডিট করুন' : 'নতুন পণ্য স্টক এন্ট্রি'}
              </h4>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="flex flex-col gap-3 text-xs">
              <div>
                <label className="font-bold text-slate-600 dark:text-slate-300 block mb-1">
                  পণ্যের নাম *
                </label>
                <input
                  type="text"
                  required
                  value={pName}
                  onChange={(e) => setPName(e.target.value)}
                  placeholder="যেমন: মিনিকেট চাল"
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-600 dark:text-slate-300 block mb-1">
                    ক্রয়মূল্য (৳)
                  </label>
                  <input
                    type="number"
                    value={pBuy}
                    onChange={(e) => setPBuy(e.target.value)}
                    placeholder="১০০"
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-600 dark:text-slate-300 block mb-1">
                    বিক্রয়মূল্য (৳)
                  </label>
                  <input
                    type="number"
                    value={pSell}
                    onChange={(e) => setPSell(e.target.value)}
                    placeholder="১২০"
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-bold text-emerald-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-600 dark:text-slate-300 block mb-1">
                    মজুদ পরিমাণ
                  </label>
                  <input
                    type="number"
                    value={pStock}
                    onChange={(e) => setPStock(e.target.value)}
                    placeholder="৫০"
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-600 dark:text-slate-300 block mb-1">
                    একক (Unit)
                  </label>
                  <input
                    type="text"
                    value={pUnit}
                    onChange={(e) => setPUnit(e.target.value)}
                    placeholder="কেজি / পিস / বস্তা"
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-600 dark:text-slate-300 block mb-1">
                  সর্বনিম্ন স্টক সতর্কতা সীমা
                </label>
                <input
                  type="number"
                  value={pMin}
                  onChange={(e) => setPMin(e.target.value)}
                  placeholder="৫"
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200 font-bold"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md"
                >
                  সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Stock Adjustment Modal */}
      {quickAdjustProduct && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-2xl flex flex-col gap-4 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                <Package className="w-4 h-4 text-purple-600" />
                স্টক সমন্বয়: {quickAdjustProduct.name}
              </h4>
              <button
                type="button"
                onClick={() => setQuickAdjustProduct(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 flex justify-between items-center font-bold">
              <span>বর্তমান স্টক:</span>
              <span className="text-base text-slate-900 dark:text-white">
                {toBn(quickAdjustProduct.stock)} {quickAdjustProduct.unit}
              </span>
            </div>

            <form onSubmit={handleQuickAdjustStock} className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAdjustType('add')}
                  className={`py-2 rounded-xl font-bold transition flex items-center justify-center gap-1 ${
                    adjustType === 'add'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" /> + স্টক যোগ (মাল ঢুকলো)
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustType('remove')}
                  className={`py-2 rounded-xl font-bold transition flex items-center justify-center gap-1 ${
                    adjustType === 'remove'
                      ? 'bg-red-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <TrendingDown className="w-3.5 h-3.5" /> - স্টক মাইনাস
                </button>
              </div>

              <div>
                <label className="font-bold text-slate-600 dark:text-slate-300 block mb-1">
                  পরিমাণ ({quickAdjustProduct.unit}):
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={quickAdjustAmount}
                  onChange={(e) => setQuickAdjustAmount(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-bold text-base"
                />
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex items-center gap-2">
                {['1', '5', '10', '20', '50'].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setQuickAdjustAmount(preset)}
                    className="flex-1 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-purple-100 dark:hover:bg-purple-900/40 text-slate-700 dark:text-slate-300 font-bold text-[11px]"
                  >
                    +{toBn(preset)}
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setQuickAdjustProduct(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200 font-bold"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md"
                >
                  সমন্বয় সম্পন্ন করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
