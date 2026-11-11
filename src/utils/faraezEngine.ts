/**
 * Islamic Farayez (Inheritance) & Khatiyan Ana-Gonda Calculation Engine
 * Based on Quranic Shares, Hanafi Fiqh & Bangladesh Succession Laws.
 */

export interface FarayezInput {
  deceasedGender: 'male' | 'female';
  totalLandShotok: number; // in shotok (decimal)
  totalValuationTaka: number; // property market valuation in BDT

  // Heirs count
  wifeCount: number; // 0 to 4 (if deceased is male)
  hasHusband: boolean; // (if deceased is female)

  sons: number;
  daughters: number;

  hasFather: boolean;
  hasMother: boolean;
  paternalGrandfather: boolean; // if father absent
  grandmother: boolean; // if mother absent

  fullBrothers: number;
  fullSisters: number;
}

export interface HeirShareResult {
  roleBn: string;
  roleEn: string;
  count: number;
  quranicShareLabel: string;
  totalPercentage: number;
  individualPercentage: number;
  totalShotok: number;
  individualShotok: number;
  totalSqFt: number;
  individualSqFt: number;
  totalTaka: number;
  individualTaka: number;
  anaGondaText: string;
}

export interface FarayezCalculationResult {
  heirs: HeirShareResult[];
  totalDistributedPercentage: number;
  hasAwl: boolean;
  hasRadd: boolean;
  explanationBn: string;
}

/**
 * Convert a decimal fraction (0.0 to 1.0) into Khatiyan Ana-Gonda-Kora-Kranti-Til representation
 * 16 Ana = 1.0 (সম্পূর্ণ অংশ)
 * 1 Ana = 20 Gonda (মোট ৩২০ গণ্ডা)
 * 1 Gonda = 4 Kora (মোট ১২৮০ কড়া)
 * 1 Kora = 3 Kranti (মোট ৩৮৪০ ক্রান্তি)
 * 1 Kranti = 20 Til (মোট ৭৬,৮০০ তিল)
 */
export function decimalToAnaGonda(fraction: number): {
  ana: number;
  gonda: number;
  kora: number;
  kranti: number;
  til: number;
  textBn: string;
  textEn: string;
} {
  const safeFrac = Math.max(0, Math.min(1, fraction));
  const totalTils = Math.round(safeFrac * 76800);

  const ana = Math.floor(totalTils / 4800);
  const rem1 = totalTils % 4800;

  const gonda = Math.floor(rem1 / 240);
  const rem2 = rem1 % 240;

  const kora = Math.floor(rem2 / 60);
  const rem3 = rem2 % 60;

  const kranti = Math.floor(rem3 / 20);
  const til = rem3 % 20;

  const partsBn: string[] = [];
  if (ana > 0) partsBn.push(`${ana} আনা`);
  if (gonda > 0) partsBn.push(`${gonda} গণ্ডা`);
  if (kora > 0) partsBn.push(`${kora} কড়া`);
  if (kranti > 0) partsBn.push(`${kranti} ক্রান্তি`);
  if (til > 0 || partsBn.length === 0) partsBn.push(`${til} তিল`);

  return {
    ana,
    gonda,
    kora,
    kranti,
    til,
    textBn: partsBn.join(' '),
    textEn: `${ana} Ana ${gonda} Gonda ${kora} Kora ${kranti} Kranti ${til} Til`,
  };
}

/**
 * Convert Khatiyan Ana-Gonda-Kora-Kranti-Til into decimal fraction (0.0 to 1.0)
 */
export function anaGondaToDecimal(
  ana: number,
  gonda: number,
  kora: number,
  kranti: number,
  til: number
): {
  fraction: number;
  percentage: number;
  sahasrangsho: number; // out of 1000 (সহস্রাংশ)
} {
  const totalTils =
    (ana || 0) * 4800 +
    (gonda || 0) * 240 +
    (kora || 0) * 60 +
    (kranti || 0) * 20 +
    (til || 0);

  const fraction = totalTils / 76800;
  return {
    fraction,
    percentage: fraction * 100,
    sahasrangsho: Math.round(fraction * 1000 * 100) / 100,
  };
}

/**
 * Main Islamic Farayez Inheritance Engine
 */
export function calculateFarayez(input: FarayezInput): FarayezCalculationResult {
  const {
    deceasedGender,
    totalLandShotok,
    totalValuationTaka,
    wifeCount,
    hasHusband,
    sons,
    daughters,
    hasFather,
    hasMother,
    paternalGrandfather,
    grandmother,
    fullBrothers,
    fullSisters,
  } = input;

  const hasChildren = sons > 0 || daughters > 0;
  const siblingCount = fullBrothers + fullSisters;

  type ShareAllocation = {
    roleBn: string;
    roleEn: string;
    count: number;
    fraction: number; // raw Quranic share before Awl/Radd
    isAsabah: boolean;
    asabahWeight?: number;
    quranicLabel: string;
  };

  const fixedShares: ShareAllocation[] = [];
  const explanations: string[] = [];

  // 1. SPOUSE SHARE
  if (deceasedGender === 'male' && wifeCount > 0) {
    const fraction = hasChildren ? 1 / 8 : 1 / 4;
    const label = hasChildren ? '১/৮ (সন্তান আছে)' : '১/৪ (সন্তান নেই)';
    fixedShares.push({
      roleBn: wifeCount > 1 ? `স্ত্রীগণ (${wifeCount} জন)` : 'স্ত্রী',
      roleEn: wifeCount > 1 ? `Wives (${wifeCount})` : 'Wife',
      count: wifeCount,
      fraction,
      isAsabah: false,
      quranicLabel: label,
    });
    explanations.push(
      `মৃতের স্ত্রী ${hasChildren ? 'সন্তান থাকায় ১/৮ অংশ' : 'সন্তান না থাকায় ১/৪ অংশ'} পাবেন।`
    );
  } else if (deceasedGender === 'female' && hasHusband) {
    const fraction = hasChildren ? 1 / 4 : 1 / 2;
    const label = hasChildren ? '১/৪ (সন্তান আছে)' : '১/২ (সন্তান নেই)';
    fixedShares.push({
      roleBn: 'স্বামী',
      roleEn: 'Husband',
      count: 1,
      fraction,
      isAsabah: false,
      quranicLabel: label,
    });
    explanations.push(
      `মৃতার স্বামী ${hasChildren ? 'সন্তান থাকায় ১/৪ অংশ' : 'সন্তান না থাকায় ১/২ অংশ'} পাবেন।`
    );
  }

  // 2. MOTHER & GRANDMOTHER
  if (hasMother) {
    const fraction = hasChildren || siblingCount >= 2 ? 1 / 6 : 1 / 3;
    const label =
      hasChildren || siblingCount >= 2
        ? '১/৬ (সন্তান বা একাধিক ভাইবোন আছে)'
        : '১/৩ (সন্তান নেই)';
    fixedShares.push({
      roleBn: 'মাতা',
      roleEn: 'Mother',
      count: 1,
      fraction,
      isAsabah: false,
      quranicLabel: label,
    });
    explanations.push(
      `মাতা ${hasChildren || siblingCount >= 2 ? '১/৬ অংশ' : '১/৩ অংশ'} পাবেন।`
    );
  } else if (grandmother) {
    fixedShares.push({
      roleBn: 'দাদী / নানী',
      roleEn: 'Grandmother',
      count: 1,
      fraction: 1 / 6,
      isAsabah: false,
      quranicLabel: '১/৬ (মাতার অবর্তমানে)',
    });
    explanations.push('মাতার অবর্তমানে দাদী/নানী ১/৬ অংশ পাবেন।');
  }

  // 3. FATHER & PATERNAL GRANDFATHER
  let fatherAsabah = false;
  if (hasFather) {
    if (sons > 0) {
      // With son: father gets fixed 1/6
      fixedShares.push({
        roleBn: 'পিতা',
        roleEn: 'Father',
        count: 1,
        fraction: 1 / 6,
        isAsabah: false,
        quranicLabel: '১/৬ (পুত্র আছে)',
      });
      explanations.push('পুত্র সন্তানের উপস্থিতিতে পিতা নির্ধারিত ১/৬ অংশ পাবেন।');
    } else if (daughters > 0) {
      // With daughters only: father gets 1/6 + Asabah
      fixedShares.push({
        roleBn: 'পিতা (নির্ধারিত ১/৬)',
        roleEn: 'Father (Fixed 1/6)',
        count: 1,
        fraction: 1 / 6,
        isAsabah: false,
        quranicLabel: '১/৬',
      });
      fatherAsabah = true;
      explanations.push('শুধু কন্যা থাকায় পিতা ১/৬ অংশের পাশাপাশি অবশিষ্টভোগী (আসাবা) হবেন।');
    } else {
      // No children: father is pure Asabah
      fatherAsabah = true;
      explanations.push('কোনো সন্তান না থাকায় পিতা পূর্ণ অবশিষ্টভোগী (আসাবা) হিসেবে অংশ পাবেন।');
    }
  } else if (paternalGrandfather) {
    if (sons > 0) {
      fixedShares.push({
        roleBn: 'দাদা',
        roleEn: 'Paternal Grandfather',
        count: 1,
        fraction: 1 / 6,
        isAsabah: false,
        quranicLabel: '১/৬ (পিতার অবর্তমানে)',
      });
    } else {
      fatherAsabah = true;
    }
  }

  // 4. DAUGHTERS (if no sons, they are Zawil Furud)
  if (daughters > 0 && sons === 0) {
    const fraction = daughters === 1 ? 1 / 2 : 2 / 3;
    const label = daughters === 1 ? '১/২ (একক কন্যা)' : `২/৩ (${daughters} কন্যা মিলে)`;
    fixedShares.push({
      roleBn: daughters === 1 ? 'কন্যা' : `কন্যাগণ (${daughters} জন)`,
      roleEn: daughters === 1 ? 'Daughter' : `Daughters (${daughters})`,
      count: daughters,
      fraction,
      isAsabah: false,
      quranicLabel: label,
    });
    explanations.push(
      `কোনো পুত্র না থাকায় ${daughters === 1 ? 'একক কন্যা হিসেবে ১/২' : 'একাধিক কন্যা মিলে ২/৩'} অংশ পাবেন।`
    );
  }

  // Calculate sum of fixed shares
  let fixedSum = fixedShares.reduce((acc, s) => acc + s.fraction, 0);
  let remainder = Math.max(0, 1 - fixedSum);
  let hasAwl = false;
  let hasRadd = false;

  const finalAllocations: {
    roleBn: string;
    roleEn: string;
    count: number;
    finalFraction: number;
    quranicLabel: string;
  }[] = [];

  // Check Awl (আওল) - fixed shares exceed 1
  if (fixedSum > 1.0001) {
    hasAwl = true;
    explanations.push(
      `আওল (Awl) নীতি প্রযোজ্য: মোট অংশের যোগফল ${(fixedSum * 100).toFixed(1)}% হওয়ায় সকল অংশীদারের অংশ সংখ্যানুপাতিক হারে সমন্বয় করা হয়েছে।`
    );
    fixedShares.forEach((s) => {
      finalAllocations.push({
        roleBn: s.roleBn,
        roleEn: s.roleEn,
        count: s.count,
        finalFraction: s.fraction / fixedSum,
        quranicLabel: `${s.quranicLabel} (আওলে সমন্বিত)`,
      });
    });
  } else {
    // Fixed shares do not exceed 1
    fixedShares.forEach((s) => {
      finalAllocations.push({
        roleBn: s.roleBn,
        roleEn: s.roleEn,
        count: s.count,
        finalFraction: s.fraction,
        quranicLabel: s.quranicLabel,
      });
    });

    // Handle Asabah (অবশিষ্টভোগী)
    if (sons > 0) {
      // Sons and Daughters get remainder in 2:1 ratio
      const sonWeight = sons * 2;
      const daughterWeight = daughters * 1;
      const totalWeight = sonWeight + daughterWeight;

      if (remainder > 0 && totalWeight > 0) {
        const sonShare = (remainder * sonWeight) / totalWeight;
        const daughterShare = (remainder * daughterWeight) / totalWeight;

        finalAllocations.push({
          roleBn: sons === 1 ? 'পুত্র' : `পুত্রগণ (${sons} জন)`,
          roleEn: sons === 1 ? 'Son' : `Sons (${sons})`,
          count: sons,
          finalFraction: sonShare,
          quranicLabel: 'আসাবা (পুত্র ২ : কন্যা ১)',
        });

        if (daughters > 0) {
          finalAllocations.push({
            roleBn: daughters === 1 ? 'কন্যা' : `কন্যাগণ (${daughters} জন)`,
            roleEn: daughters === 1 ? 'Daughter' : `Daughters (${daughters})`,
            count: daughters,
            finalFraction: daughterShare,
            quranicLabel: 'আসাবা (পুত্রের সঙ্গে ১ ভাগ)',
          });
        }
        explanations.push(
          `পুত্র ও কন্যা মিলে অবশিষ্ট ${(remainder * 100).toFixed(1)}% অংশ ২:১ অনুপাতে পাবেন।`
        );
        remainder = 0;
      }
    } else if (fatherAsabah && remainder > 0) {
      // Father takes remainder
      const fatherItem = finalAllocations.find((a) => a.roleBn.includes('পিতা'));
      if (fatherItem) {
        fatherItem.finalFraction += remainder;
        fatherItem.quranicLabel += ' + অবশিষ্ট আসাবা';
      } else {
        finalAllocations.push({
          roleBn: 'পিতা',
          roleEn: 'Father',
          count: 1,
          finalFraction: remainder,
          quranicLabel: 'আসাবা (সম্পূর্ণ অবশিষ্ট)',
        });
      }
      explanations.push(`পিতা অবশিষ্ট ${(remainder * 100).toFixed(1)}% অংশ লাভ করবেন।`);
      remainder = 0;
    } else if (!hasChildren && !hasFather && siblingCount > 0 && remainder > 0) {
      // Siblings inherit as Asabah
      const broWeight = fullBrothers * 2;
      const sisWeight = fullSisters * 1;
      const totalSibWeight = broWeight + sisWeight;

      if (totalSibWeight > 0) {
        if (fullBrothers > 0) {
          finalAllocations.push({
            roleBn: fullBrothers === 1 ? 'সহোদর ভাই' : `সহোদর ভাইগণ (${fullBrothers} জন)`,
            roleEn: 'Brother(s)',
            count: fullBrothers,
            finalFraction: (remainder * broWeight) / totalSibWeight,
            quranicLabel: 'আসাবা (ভাই ২ : বোন ১)',
          });
        }
        if (fullSisters > 0) {
          finalAllocations.push({
            roleBn: fullSisters === 1 ? 'সহোদর বোন' : `সহোদর বোনগণ (${fullSisters} জন)`,
            roleEn: 'Sister(s)',
            count: fullSisters,
            finalFraction: (remainder * sisWeight) / totalSibWeight,
            quranicLabel: 'আসাবা (ভাইয়ের সঙ্গে ১ ভাগ)',
          });
        }
        remainder = 0;
      }
    } else if (remainder > 0.0001) {
      // Radd (রাদ্দ) - Return surplus to blood relatives (excluding spouse)
      hasRadd = true;
      const bloodRelatives = finalAllocations.filter(
        (a) => !a.roleBn.includes('স্ত্রী') && !a.roleBn.includes('স্বামী')
      );
      const bloodSum = bloodRelatives.reduce((acc, a) => acc + a.finalFraction, 0);
      if (bloodSum > 0) {
        bloodRelatives.forEach((a) => {
          a.finalFraction += (a.finalFraction / bloodSum) * remainder;
          a.quranicLabel += ' (রাদ্দ সহ)';
        });
        explanations.push(
          `রাদ্দ (Radd) নীতি প্রযোজ্য: অবশিষ্ট ${(remainder * 100).toFixed(1)}% রক্তীয় ওয়ারিশদের মাঝে পুনরায় ভাগ করে দেওয়া হয়েছে।`
        );
        remainder = 0;
      }
    }
  }

  // Calculate exact land shotok, sqft, valuation and ana-gonda for each
  const totalSqFt = totalLandShotok * 435.6;

  const results: HeirShareResult[] = finalAllocations.map((alloc) => {
    const totalPercentage = alloc.finalFraction * 100;
    const individualPercentage = totalPercentage / alloc.count;

    const totalShotok = totalLandShotok * alloc.finalFraction;
    const individualShotok = totalShotok / alloc.count;

    const totalSqFtHeir = totalSqFt * alloc.finalFraction;
    const individualSqFt = totalSqFtHeir / alloc.count;

    const totalTaka = totalValuationTaka * alloc.finalFraction;
    const individualTaka = totalTaka / alloc.count;

    const anaGonda = decimalToAnaGonda(alloc.finalFraction);

    return {
      roleBn: alloc.roleBn,
      roleEn: alloc.roleEn,
      count: alloc.count,
      quranicShareLabel: alloc.quranicLabel,
      totalPercentage,
      individualPercentage,
      totalShotok,
      individualShotok,
      totalSqFt: totalSqFtHeir,
      individualSqFt,
      totalTaka,
      individualTaka,
      anaGondaText: anaGonda.textBn,
    };
  });

  const sumPercentage = results.reduce((acc, r) => acc + r.totalPercentage, 0);

  return {
    heirs: results,
    totalDistributedPercentage: sumPercentage,
    hasAwl,
    hasRadd,
    explanationBn: explanations.join(' '),
  };
}
