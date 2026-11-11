import { Customer, Transaction, ShopProfile, toBn, formatMoney } from '../components/tools/TallyKhataView';
import { ProductItem } from '../components/tools/TallyStockAndProfit';

export interface CustomerCreditProfile {
  score: number; // 0 to 100
  rating: 'excellent' | 'moderate' | 'risky';
  labelBn: string;
  badgeBg: string;
  badgeText: string;
  borderColor: string;
  aiRecommendation: string;
  totalTaken: number;
  totalPaid: number;
  repaymentRate: number; // 0 to 100%
  agingDays: number;
  txCount: number;
}

export interface BusinessHealthProfile {
  score: number; // 0 to 100
  grade: 'A+' | 'A' | 'B' | 'C';
  statusBn: string;
  color: string;
  cashSalesPct: number;
  dueSalesPct: number;
  collectionRate: number;
  lowStockCount: number;
  tips: string[];
}

/**
 * Calculate Customer Credit & Trust Score (0 - 100)
 * Evaluates:
 * 1. Repayment history (repaid vs taken) - 40 points
 * 2. Due aging speed (how long due stays unpaid) - 35 points
 * 3. Transaction loyalty & engagement frequency - 25 points
 */
export function calculateCustomerCreditScore(
  customer: Customer,
  transactions: Transaction[]
): CustomerCreditProfile {
  const custTxs = transactions.filter((t) => t.customerId === customer.id);
  const txCount = custTxs.length;

  let totalTaken = 0;
  let totalPaid = 0;

  for (const tx of custTxs) {
    if (tx.type === 'sale_due') {
      totalTaken += tx.amount;
    } else if (tx.type === 'due_collection') {
      totalPaid += tx.amount;
    }
  }

  // Calculate Aging
  let agingDays = 0;
  if (customer.balance > 0) {
    const dues = custTxs.filter((t) => t.type === 'sale_due').sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    if (dues.length > 0) {
      const oldestDue = dues[0];
      const diffMs = Date.now() - new Date(oldestDue.date).getTime();
      agingDays = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
    } else {
      const diffMs = Date.now() - (customer.createdAt || Date.now());
      agingDays = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
    }
  }

  // 1. Repayment Component (Max 40)
  let repaymentRate = 100;
  let repaymentPoints = 40;
  if (totalTaken > 0) {
    repaymentRate = Math.min(100, Math.round((totalPaid / totalTaken) * 100));
    repaymentPoints = Math.round((repaymentRate / 100) * 40);
  } else if (customer.balance <= 0) {
    repaymentPoints = 40;
  }

  // 2. Aging Component (Max 35)
  let agingPoints = 35;
  if (customer.balance > 0) {
    if (agingDays <= 7) {
      agingPoints = 35;
    } else if (agingDays <= 15) {
      agingPoints = 25;
    } else if (agingDays <= 30) {
      agingPoints = 15;
    } else if (agingDays <= 60) {
      agingPoints = 5;
    } else {
      agingPoints = 0;
    }
  }

  // 3. Loyalty & Frequency Component (Max 25)
  let loyaltyPoints = 15;
  if (txCount >= 10) loyaltyPoints = 25;
  else if (txCount >= 5) loyaltyPoints = 20;
  else if (txCount >= 2) loyaltyPoints = 15;
  else loyaltyPoints = 10;

  const rawScore = repaymentPoints + agingPoints + loyaltyPoints;
  const score = Math.max(10, Math.min(100, rawScore));

  let rating: 'excellent' | 'moderate' | 'risky';
  let labelBn: string;
  let badgeBg: string;
  let badgeText: string;
  let borderColor: string;
  let aiRecommendation: string;

  if (score >= 80) {
    rating = 'excellent';
    labelBn = 'উত্তম ও বিশ্বস্ত';
    badgeBg = 'bg-emerald-100 dark:bg-emerald-950/60';
    badgeText = 'text-emerald-700 dark:text-emerald-300';
    borderColor = 'border-emerald-300 dark:border-emerald-700';
    aiRecommendation =
      'নিয়মিত সময়মতো পরিশোধকারী গ্রাহক। নতুন বাকি দেওয়া নিরাপদ এবং বিশেষ লয়ালটি ছাড় দেওয়া যায়।';
  } else if (score >= 55) {
    rating = 'moderate';
    labelBn = 'মাঝারি গ্রাহক';
    badgeBg = 'bg-amber-100 dark:bg-amber-950/60';
    badgeText = 'text-amber-700 dark:text-amber-300';
    borderColor = 'border-amber-300 dark:border-amber-700';
    aiRecommendation =
      'পরিশোধের ধারাবাহিকতা সন্তোষজনক, তবে বকেয়া বৃদ্ধির ক্ষেত্রে সীমিত ক্রেডিট লিমিট রাখুন।';
  } else {
    rating = 'risky';
    labelBn = 'উচ্চ ঝুঁকি / সতর্ক';
    badgeBg = 'bg-rose-100 dark:bg-rose-950/60';
    badgeText = 'text-rose-700 dark:text-rose-300';
    borderColor = 'border-rose-300 dark:border-rose-700';
    aiRecommendation =
      'বকেয়া পরিশোধের গতি ধীর। নতুন পণ্য বাকি দেওয়ার পূর্বে পূর্বের বকেয়া আদায়ের তাগাদা দিন।';
  }

  return {
    score,
    rating,
    labelBn,
    badgeBg,
    badgeText,
    borderColor,
    aiRecommendation,
    totalTaken,
    totalPaid,
    repaymentRate,
    agingDays,
    txCount,
  };
}

/**
 * Calculate Overall Business Health Score (0 - 100)
 */
export function calculateBusinessHealthScore(
  customers: Customer[],
  transactions: Transaction[],
  products: ProductItem[]
): BusinessHealthProfile {
  let totalSales = 0;
  let cashSales = 0;
  let dueSales = 0;
  let totalDueCollected = 0;
  let totalExpenses = 0;

  for (const tx of transactions) {
    if (tx.type === 'sale_cash') {
      totalSales += tx.amount;
      cashSales += tx.amount;
    } else if (tx.type === 'sale_due') {
      totalSales += tx.amount;
      dueSales += tx.amount;
    } else if (tx.type === 'due_collection') {
      totalDueCollected += tx.amount;
    } else if (tx.type === 'expense') {
      totalExpenses += tx.amount;
    }
  }

  const totalReceivable = customers.reduce((acc, c) => (c.balance > 0 ? acc + c.balance : acc), 0);
  const lowStockCount = products.filter((p) => p.stock <= p.minStock).length;

  const cashSalesPct = totalSales > 0 ? Math.round((cashSales / totalSales) * 100) : 100;
  const dueSalesPct = 100 - cashSalesPct;

  const collectionRate =
    dueSales + totalReceivable > 0
      ? Math.min(100, Math.round((totalDueCollected / (dueSales + totalReceivable)) * 100))
      : 100;

  // Compute score components
  // 1. Cash flow strength: cash sales > 60% = 35 pts
  const cashPoints = Math.round((cashSalesPct / 100) * 35);
  // 2. Collection efficiency: collection rate = 35 pts
  const collectionPoints = Math.round((collectionRate / 100) * 35);
  // 3. Stock Health: Low stock penalty (max 20 pts)
  const stockPoints = Math.max(5, 20 - lowStockCount * 3);
  // 4. Base operations stability: 10 pts
  const opsPoints = totalSales > 0 ? 10 : 5;

  const score = Math.max(20, Math.min(100, cashPoints + collectionPoints + stockPoints + opsPoints));

  let grade: 'A+' | 'A' | 'B' | 'C' = 'B';
  let statusBn = 'সন্তোষজনক';
  let color = 'text-blue-600 dark:text-blue-400';

  if (score >= 85) {
    grade = 'A+';
    statusBn = 'অসাধারণ ও সুদৃঢ়';
    color = 'text-emerald-600 dark:text-emerald-400';
  } else if (score >= 70) {
    grade = 'A';
    statusBn = 'ভালো ও সুরক্ষিত';
    color = 'text-emerald-500 dark:text-emerald-300';
  } else if (score >= 50) {
    grade = 'B';
    statusBn = 'চলনসই / মাঝারি';
    color = 'text-amber-500 dark:text-amber-400';
  } else {
    grade = 'C';
    statusBn = 'মনোযোগ প্রয়োজন';
    color = 'text-rose-500 dark:text-rose-400';
  }

  const tips: string[] = [];
  if (cashSalesPct < 50) {
    tips.push('নগদ বিক্রির হার ৫০% এর নিচে। দ্রুত ক্যাশ ফ্লো নিশ্চিত করতে নগদ ক্রয়ে বিশেষ ছাড় বিবেচনা করুন।');
  } else {
    tips.push('আপনার নগদ বিক্রির অনুপাত চমৎকার, যা ব্যবসা সচল রাখতে মূল শক্তি।');
  }

  if (lowStockCount > 0) {
    tips.push(`${toBn(lowStockCount)}টি পণ্যের স্টক শেষ হয়ে আসছে। ক্রেতা ফিরে যাওয়ার আগেই নতুন স্টক তুলুন।`);
  }

  if (collectionRate < 60 && totalReceivable > 0) {
    tips.push('বকেয়া আদায়ের গতি বাড়াতে আজই অটোমেটেড তাগাদা এসএমএস বা হোয়াটসঅ্যাপ মেসেজ পাঠান।');
  }

  return {
    score,
    grade,
    statusBn,
    color,
    cashSalesPct,
    dueSalesPct,
    collectionRate,
    lowStockCount,
    tips,
  };
}

/**
 * Multi-Template Due Reminder Engine
 */
export function getTagadaTemplates(
  customer: Customer,
  shop: ShopProfile
): {
  polite: string;
  urgent: string;
  offer: string;
  festive: string;
} {
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

  const paySection =
    paymentMethods.length > 0
      ? `\n\n📲 পেমেন্ট পাঠানোর মাধ্যম:\n${paymentMethods.join('\n')}`
      : '';

  const polite = `সম্মানিত গ্রাহক ${customer.name},
আশা করি ভালো আছেন। ${shop.name}-এ আপনার চলমান খাতার বর্তমান বকেয়া ${shop.currency} ${toBn(customer.balance)} টাকা।
সুবিধাজনক সময়ে বকেয়াটি পরিশোধ করার অনুরোধ রইল।${paySection}

ধন্যবাদান্তে,
${shop.proprietor || shop.name}
মোবাইল: ${shop.phone}`;

  const urgent = `জরুরি তাগাদা নোটিশ ⚠️
শ্রদ্ধেয় ${customer.name},
${shop.name}-এ আপনার বকেয়া ${shop.currency} ${toBn(customer.balance)} টাকা দীর্ঘদিনের পুরনো।
হিসাব হালনাগাদ রাখতে আগামী ২৪ থেকে ৪৮ ঘণ্টার মধ্যে পরিশোধ করার বিনীত অনুরোধ জানাচ্ছি।${paySection}

যোগাযোগ: ${shop.phone}`;

  const offer = `সুসংবাদ ও বিশেষ ছাড় অফার! 🎁
প্রিয় ${customer.name},
${shop.name}-এর সম্মানিত কাস্টমার হিসেবে আপনার মোট বকেয়া ${shop.currency} ${toBn(customer.balance)} টাকা।
চলতি সপ্তাহের মধ্যে সম্পূর্ণ বকেয়া পরিশোধ করলে পরবর্তী ক্রয়ে পাবেন বিশেষ ক্যাশব্যাক / ছাড়!${paySection}

ধন্যবাদান্তে, ${shop.name} (${shop.phone})`;

  const festive = `শুভেচ্ছা বার্তা 🌙✨
সম্মানিত ${customer.name},
${shop.name}-এর পক্ষ থেকে আপনার ও আপনার পরিবারের জন্য রইল আন্তরিক শুভেচ্ছা!
আপনার চলমান হিসাব বিবরণী: বর্তমান বকেয়া বাকি ${shop.currency} ${toBn(customer.balance)} টাকা। হিসাব নিয়মিত রাখতে পরিশোধের অনুরোধ রইল।${paySection}

দোকান: ${shop.name} | ${shop.phone}`;

  return { polite, urgent, offer, festive };
}

/**
 * Generate Direct WhatsApp Link with Clean Bangladesh Phone Formatting
 */
export function formatWhatsAppUrl(phone: string, text: string): string {
  let cleanPhone = phone.replace(/[^0-9]/g, '');
  if (cleanPhone.startsWith('0')) {
    cleanPhone = '88' + cleanPhone;
  } else if (!cleanPhone.startsWith('88') && cleanPhone.length === 10) {
    cleanPhone = '880' + cleanPhone;
  }
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
}

/**
 * Generate Direct SMS Link
 */
export function formatSmsUrl(phone: string, text: string): string {
  const cleanPhone = phone.replace(/[^0-9+]/g, '');
  return `sms:${cleanPhone}?body=${encodeURIComponent(text)}`;
}
