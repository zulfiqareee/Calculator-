/**
 * Financial Calculation Engine for Bangladesh Banking & Savings
 * Covers Loan EMI, DPS, FDR, Sanchayapatra (National Savings Certificates), and VAT.
 */

export interface EmiResult {
  monthlyEmi: number;
  totalPayment: number;
  totalInterest: number;
  principalPercentage: number;
  interestPercentage: number;
  yearlySchedule: {
    year: number;
    principalPaid: number;
    interestPaid: number;
    balance: number;
  }[];
}

export function calculateLoanEmi(
  principal: number,
  annualInterestRate: number,
  tenureMonths: number
): EmiResult {
  const p = Math.max(0, principal);
  const r = annualInterestRate / 12 / 100;
  const n = Math.max(1, tenureMonths);

  let monthlyEmi = 0;
  if (r > 0) {
    const factor = Math.pow(1 + r, n);
    monthlyEmi = (p * r * factor) / (factor - 1);
  } else {
    monthlyEmi = p / n;
  }

  const totalPayment = monthlyEmi * n;
  const totalInterest = Math.max(0, totalPayment - p);
  const interestPercentage = totalPayment > 0 ? (totalInterest / totalPayment) * 100 : 0;
  const principalPercentage = 100 - interestPercentage;

  // Yearly schedule
  const years = Math.ceil(n / 12);
  let balance = p;
  const schedule: { year: number; principalPaid: number; interestPaid: number; balance: number }[] = [];

  for (let y = 1; y <= years; y++) {
    let yearPrincipal = 0;
    let yearInterest = 0;
    const monthsInThisYear = Math.min(12, n - (y - 1) * 12);

    for (let m = 0; m < monthsInThisYear; m++) {
      const intPayment = balance * r;
      const prinPayment = monthlyEmi - intPayment;
      yearInterest += intPayment;
      yearPrincipal += prinPayment;
      balance = Math.max(0, balance - prinPayment);
    }

    schedule.push({
      year: y,
      principalPaid: Math.round(yearPrincipal),
      interestPaid: Math.round(yearInterest),
      balance: Math.max(0, Math.round(balance)),
    });
  }

  return {
    monthlyEmi: Math.round(monthlyEmi),
    totalPayment: Math.round(totalPayment),
    totalInterest: Math.round(totalInterest),
    principalPercentage,
    interestPercentage,
    yearlySchedule: schedule,
  };
}

export interface DpsResult {
  monthlyDeposit: number;
  totalInvested: number;
  grossInterest: number;
  taxAmount: number;
  netMaturityAmount: number;
  effectiveRate: number;
}

export function calculateDps(
  monthlyDeposit: number,
  annualInterestRate: number,
  tenureYears: number,
  hasTin = true
): DpsResult {
  const p = Math.max(0, monthlyDeposit);
  const r = annualInterestRate / 12 / 100;
  const totalMonths = Math.max(1, tenureYears * 12);
  const taxRate = hasTin ? 0.10 : 0.15; // 10% AIT with TIN, 15% without

  // Compound sum of recurring monthly deposits: S = P * [ (1+r)^n - 1 ] / r * (1+r)
  let maturityValue = 0;
  if (r > 0) {
    maturityValue = p * ((Math.pow(1 + r, totalMonths) - 1) / r) * (1 + r);
  } else {
    maturityValue = p * totalMonths;
  }

  const totalInvested = p * totalMonths;
  const grossInterest = Math.max(0, maturityValue - totalInvested);
  const taxAmount = grossInterest * taxRate;
  const netMaturityAmount = totalInvested + (grossInterest - taxAmount);

  return {
    monthlyDeposit: p,
    totalInvested: Math.round(totalInvested),
    grossInterest: Math.round(grossInterest),
    taxAmount: Math.round(taxAmount),
    netMaturityAmount: Math.round(netMaturityAmount),
    effectiveRate: annualInterestRate,
  };
}

export interface FdrResult {
  principal: number;
  grossProfit: number;
  taxAmount: number;
  netProfit: number;
  totalMaturity: number;
  monthlyIncome: number;
}

export function calculateFdr(
  principal: number,
  annualInterestRate: number,
  tenureYears: number,
  hasTin = true
): FdrResult {
  const p = Math.max(0, principal);
  const taxRate = hasTin ? 0.10 : 0.15;

  // Simple / Annual compound profit for fixed deposits
  const grossProfit = p * (annualInterestRate / 100) * tenureYears;
  const taxAmount = grossProfit * taxRate;
  const netProfit = grossProfit - taxAmount;
  const totalMaturity = p + netProfit;

  // Monthly income option if interest is withdrawn monthly
  const monthlyGross = (p * (annualInterestRate / 100)) / 12;
  const monthlyNet = monthlyGross * (1 - taxRate);

  return {
    principal: p,
    grossProfit: Math.round(grossProfit),
    taxAmount: Math.round(taxAmount),
    netProfit: Math.round(netProfit),
    totalMaturity: Math.round(totalMaturity),
    monthlyIncome: Math.round(monthlyNet),
  };
}

export type SanchayapatraType = 'poribar' | 'three_month' | 'pensioner' | 'bangladesh';

export interface SanchayapatraResult {
  typeNameBn: string;
  investmentAmount: number;
  periodLabel: string;
  grossMonthlyProfit: number;
  sourceTaxPercent: number;
  netProfitPerPeriod: number;
  annualNetProfit: number;
}

export function calculateSanchayapatra(
  investmentAmount: number,
  type: SanchayapatraType = 'poribar'
): SanchayapatraResult {
  const amount = Math.max(0, investmentAmount);

  // Government Tiered Rates (First 15 Lakh: Max rate, 15-30 Lakh: Step 2, 30+ Lakh: Step 3)
  let annualRate = 11.52; // Default Poribar
  let periodLabel = 'প্রতি মাসে প্রাপ্ত নিট মুনাফা';
  let typeName = 'পরিবার সঞ্চয়পত্র (৫ বছর মেয়াদী)';

  if (type === 'poribar') {
    typeName = 'পরিবার সঞ্চয়পত্র (৫ বছর)';
    periodLabel = 'প্রতি মাসে কিস্তি মুনাফা';
    if (amount <= 1500000) annualRate = 11.52;
    else if (amount <= 3000000) annualRate = 10.50;
    else annualRate = 9.50;
  } else if (type === 'three_month') {
    typeName = '৩ মাস অন্তর মুনাফাভিত্তিক সঞ্চয়পত্র';
    periodLabel = 'প্রতি ৩ মাস পর পর নিট মুনাফা';
    if (amount <= 1500000) annualRate = 11.04;
    else if (amount <= 3000000) annualRate = 10.00;
    else annualRate = 9.00;
  } else if (type === 'pensioner') {
    typeName = 'পেনশনার সঞ্চয়পত্র (৫ বছর)';
    periodLabel = 'প্রতি ৩ মাস পর পর নিট মুনাফা';
    if (amount <= 1500000) annualRate = 11.76;
    else if (amount <= 3000000) annualRate = 10.75;
    else annualRate = 9.75;
  } else {
    typeName = 'বাংলাদেশ সঞ্চয়পত্র (৫ বছর)';
    periodLabel = 'মেয়াদান্তে নিট মুনাফা';
    if (amount <= 1500000) annualRate = 11.28;
    else if (amount <= 3000000) annualRate = 10.20;
    else annualRate = 9.20;
  }

  // Tax on profit: 5% for up to 5 lakh profit/investment, 10% above
  const taxRate = amount <= 500000 ? 0.05 : 0.10;
  const taxPercent = taxRate * 100;

  const annualGrossProfit = amount * (annualRate / 100);
  const annualNetProfit = annualGrossProfit * (1 - taxRate);

  let netProfitPerPeriod = 0;
  if (type === 'poribar') {
    netProfitPerPeriod = annualNetProfit / 12;
  } else if (type === 'three_month' || type === 'pensioner') {
    netProfitPerPeriod = annualNetProfit / 4;
  } else {
    netProfitPerPeriod = annualNetProfit;
  }

  return {
    typeNameBn: typeName,
    investmentAmount: amount,
    periodLabel,
    grossMonthlyProfit: Math.round(annualGrossProfit / 12),
    sourceTaxPercent: taxPercent,
    netProfitPerPeriod: Math.round(netProfitPerPeriod),
    annualNetProfit: Math.round(annualNetProfit),
  };
}

export function calculateVat(amount: number, vatPercent = 15, isInclusive = false): {
  baseAmount: number;
  vatAmount: number;
  totalAmount: number;
} {
  const val = Math.max(0, amount);
  const rate = Math.max(0, vatPercent) / 100;

  if (isInclusive) {
    // Amount already includes VAT: Base = Amount / (1 + rate)
    const baseAmount = val / (1 + rate);
    const vatAmount = val - baseAmount;
    return {
      baseAmount: Math.round(baseAmount * 100) / 100,
      vatAmount: Math.round(vatAmount * 100) / 100,
      totalAmount: val,
    };
  } else {
    // VAT exclusive: Add VAT on top of Amount
    const vatAmount = val * rate;
    const totalAmount = val + vatAmount;
    return {
      baseAmount: val,
      vatAmount: Math.round(vatAmount * 100) / 100,
      totalAmount: Math.round(totalAmount * 100) / 100,
    };
  }
}
