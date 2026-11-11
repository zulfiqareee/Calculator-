/**
 * Bangladesh Electricity Tariff & IPS/Solar Sizing Engine
 * Based on BERC (Bangladesh Energy Regulatory Commission) Approved Retail Tariffs.
 */

export type UtilityProvider = 'desco' | 'dpdc' | 'breb' | 'nesco' | 'wzpdcl' | 'bpdb';
export type TariffCategory = 'residential' | 'commercial' | 'small_industry';

export interface TariffSlab {
  min: number;
  max: number;
  rate: number;
  labelBn: string;
  labelEn: string;
}

export interface ProviderInfo {
  id: UtilityProvider;
  nameBn: string;
  nameEn: string;
  areaBn: string;
  meterRentSinglePhase: number;
  meterRentPrepaid: number;
  demandChargePerKw: number;
}

export const PROVIDERS: ProviderInfo[] = [
  {
    id: 'desco',
    nameBn: 'ডেসকো (DESCO)',
    nameEn: 'DESCO',
    areaBn: 'ঢাকা উত্তর, মিরপুর, উত্তরা, গুলশান, বাড্ডা',
    meterRentSinglePhase: 40,
    meterRentPrepaid: 100,
    demandChargePerKw: 35,
  },
  {
    id: 'dpdc',
    nameBn: 'ডিপিডিসি (DPDC)',
    nameEn: 'DPDC',
    areaBn: 'ঢাকা দক্ষিণ, ধানমন্ডি, পুরান ঢাকা, নারায়ণগঞ্জ',
    meterRentSinglePhase: 40,
    meterRentPrepaid: 100,
    demandChargePerKw: 35,
  },
  {
    id: 'breb',
    nameBn: 'পল্লী বিদ্যুৎ (BREB)',
    nameEn: 'BREB (Palli Bidyut)',
    areaBn: 'সারাদেশের সকল উপজেলা ও গ্রামীণ জনপদ',
    meterRentSinglePhase: 40,
    meterRentPrepaid: 80,
    demandChargePerKw: 35,
  },
  {
    id: 'nesco',
    nameBn: 'নেসকো (NESCO)',
    nameEn: 'NESCO',
    areaBn: 'রাজশাহী ও রংপুর বিভাগ',
    meterRentSinglePhase: 40,
    meterRentPrepaid: 100,
    demandChargePerKw: 35,
  },
  {
    id: 'wzpdcl',
    nameBn: 'ওজোপাডিকো (WZPDCL)',
    nameEn: 'WZPDCL',
    areaBn: 'খুলনা, বরিশাল ও বৃহত্তর ফরিদপুর',
    meterRentSinglePhase: 40,
    meterRentPrepaid: 100,
    demandChargePerKw: 35,
  },
  {
    id: 'bpdb',
    nameBn: 'বিপিডিবি (BPDB)',
    nameEn: 'BPDB',
    areaBn: 'চট্টগ্রাম, সিলেট, ময়মনসিংহ ও অন্যান্য শহর',
    meterRentSinglePhase: 40,
    meterRentPrepaid: 100,
    demandChargePerKw: 35,
  },
];

// Current BERC Approved Residential Slabs (LT-A)
export const RESIDENTIAL_SLABS: TariffSlab[] = [
  { min: 1, max: 50, rate: 4.63, labelBn: 'লাইফলাইন (১ - ৫০ ইউনিট)', labelEn: '1 - 50 Units (Lifeline)' },
  { min: 1, max: 75, rate: 5.26, labelBn: 'ধাপ ১ (১ - ৭৫ ইউনিট)', labelEn: '1 - 75 Units (Step 1)' },
  { min: 76, max: 200, rate: 7.20, labelBn: 'ধাপ ২ (৭৬ - ২০০ ইউনিট)', labelEn: '76 - 200 Units (Step 2)' },
  { min: 201, max: 300, rate: 7.59, labelBn: 'ধাপ ৩ (২০১ - ৩০০ ইউনিট)', labelEn: '201 - 300 Units (Step 3)' },
  { min: 301, max: 400, rate: 8.02, labelBn: 'ধাপ ৪ (৩০১ - ৪০০ ইউনিট)', labelEn: '301 - 400 Units (Step 4)' },
  { min: 401, max: 600, rate: 12.67, labelBn: 'ধাপ ৫ (৪০১ - ৬০০ ইউনিট)', labelEn: '401 - 600 Units (Step 5)' },
  { min: 601, max: Infinity, rate: 14.61, labelBn: 'ধাপ ৬ (৬০১+ ইউনিট)', labelEn: 'Above 600 Units (Step 6)' },
];

export interface SlabCostItem {
  slabLabelBn: string;
  units: number;
  rate: number;
  cost: number;
}

export interface BillEstimateResult {
  energyCharge: number;
  demandCharge: number;
  meterRent: number;
  vatAmount: number;
  totalBill: number;
  slabBreakdown: SlabCostItem[];
}

export function calculateElectricityBill(
  units: number,
  sanctionedLoadKw = 2,
  isPrepaid = false,
  providerId: UtilityProvider = 'desco'
): BillEstimateResult {
  const provider = PROVIDERS.find((p) => p.id === providerId) || PROVIDERS[0];
  const safeUnits = Math.max(0, units);

  const slabBreakdown: SlabCostItem[] = [];
  let energyCharge = 0;

  if (safeUnits <= 50) {
    // Pure Lifeline
    const cost = safeUnits * 4.63;
    slabBreakdown.push({
      slabLabelBn: 'লাইফলাইন (১ - ৫০ ইউনিট)',
      units: safeUnits,
      rate: 4.63,
      cost,
    });
    energyCharge = cost;
  } else {
    // Normal stepped tiering
    let remaining = safeUnits;
    const steppedTiers = [
      { min: 1, max: 75, rate: 5.26, labelBn: 'ধাপ ১ (১ - ৭৫ ইউনিট)' },
      { min: 76, max: 200, rate: 7.20, labelBn: 'ধাপ ২ (৭৬ - ২০০ ইউনিট)' },
      { min: 201, max: 300, rate: 7.59, labelBn: 'ধাপ ৩ (২০১ - ৩০০ ইউনিট)' },
      { min: 301, max: 400, rate: 8.02, labelBn: 'ধাপ ৪ (৩০১ - ৪০০ ইউনিট)' },
      { min: 401, max: 600, rate: 12.67, labelBn: 'ধাপ ৫ (৪০১ - ৬০০ ইউনিট)' },
      { min: 601, max: Infinity, rate: 14.61, labelBn: 'ধাপ ৬ (৬০১+ ইউনিট)' },
    ];

    for (const tier of steppedTiers) {
      if (remaining <= 0) break;
      const capacity = tier.max === Infinity ? remaining : tier.max - tier.min + 1;
      const unitsInSlab = Math.min(remaining, capacity);
      const cost = unitsInSlab * tier.rate;

      slabBreakdown.push({
        slabLabelBn: tier.labelBn,
        units: unitsInSlab,
        rate: tier.rate,
        cost,
      });

      energyCharge += cost;
      remaining -= unitsInSlab;
    }
  }

  const demandCharge = Math.max(1, sanctionedLoadKw) * provider.demandChargePerKw;
  const meterRent = isPrepaid ? provider.meterRentPrepaid : provider.meterRentSinglePhase;
  const subtotal = energyCharge + demandCharge + meterRent;
  const vatAmount = subtotal * 0.05; // 5% Govt VAT
  const totalBill = Math.round(subtotal + vatAmount);

  return {
    energyCharge,
    demandCharge,
    meterRent,
    vatAmount,
    totalBill,
    slabBreakdown,
  };
}

export interface IpsSizingResult {
  totalLoadWatts: number;
  recommendedInverterVa: number;
  recommendedBatteryAh: number;
  estimatedBackupHours: number;
  chargingCurrentAmps: number;
}

export function calculateIpsSizing(
  fans: number,
  lights: number,
  tvs: number,
  pcs: number,
  routers: number,
  customWatts: number,
  batteryAh = 150,
  batteryType: 'tubular' | 'flat' | 'lithium' = 'tubular'
): IpsSizingResult {
  const totalLoadWatts =
    fans * 75 + lights * 15 + tvs * 85 + pcs * 120 + routers * 12 + customWatts;

  // Power factor ~0.8 -> VA = Watts / 0.8 with 25% safety overhead
  const safeVa = Math.ceil((totalLoadWatts / 0.8) * 1.25);
  const recommendedInverterVa = safeVa < 600 ? 600 : safeVa < 800 ? 800 : safeVa < 1000 ? 1000 : safeVa < 1200 ? 1200 : safeVa;

  // Battery backup hours: (V * Ah * DoD * Efficiency) / Watts
  const dod = batteryType === 'lithium' ? 0.9 : batteryType === 'tubular' ? 0.75 : 0.65;
  const usableWh = 12 * batteryAh * dod * 0.85;
  const estimatedBackupHours = totalLoadWatts > 0 ? usableWh / totalLoadWatts : 0;

  // Recommended battery for ~3 hours backup
  const neededWhFor3Hours = totalLoadWatts * 3;
  const recommendedBatteryAh = Math.ceil(neededWhFor3Hours / (12 * dod * 0.85));

  // Charging current ~10% of battery Ah
  const chargingCurrentAmps = Math.round(batteryAh * 0.1);

  return {
    totalLoadWatts,
    recommendedInverterVa,
    recommendedBatteryAh,
    estimatedBackupHours,
    chargingCurrentAmps,
  };
}
