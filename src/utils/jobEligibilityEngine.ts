// Bangladesh Govt Job Eligibility and Life Milestones Calculation Engine

export interface JobCategoryRule {
  id: string;
  nameBn: string;
  nameEn: string;
  minAge: number;
  maxAge: number;
  descriptionBn: string;
  descriptionEn: string;
  badgeBn: string;
  badgeEn: string;
}

export const GOVT_JOB_CATEGORIES: JobCategoryRule[] = [
  {
    id: 'general_bcs',
    nameBn: 'সাধারণ প্রার্থী ও বিসিএস (সবার জন্য)',
    nameEn: 'General Cadre & BCS (Open to All)',
    minAge: 21,
    maxAge: 32,
    descriptionBn: 'নতুন সরকারি অধ্যাদেশ ২০২৪ অনুযায়ী সাধারণ প্রার্থীদের জন্য প্রবেশের বয়সসীমা ৩২ বছর।',
    descriptionEn: 'As per Govt Ordinance 2024, entry age limit for general applicants is 32 years.',
    badgeBn: '৩২ বছর (সর্বোচ্চ)',
    badgeEn: 'Max 32 Years',
  },
  {
    id: 'freedom_fighter',
    nameBn: 'মুক্তিযোদ্ধা / শহীদ মুক্তিযোদ্ধার সন্তান',
    nameEn: 'Freedom Fighter Quota',
    minAge: 21,
    maxAge: 32,
    descriptionBn: 'বীর মুক্তিযোদ্ধা ও শহীদ মুক্তিযোদ্ধাদের সন্তান প্রার্থীদের জন্য সরকারি চাকরিতে প্রবেশের বয়সসীমা ৩২ বছর।',
    descriptionEn: 'Entry age limit for children of Freedom Fighters is 32 years.',
    badgeBn: '৩২ বছর',
    badgeEn: '32 Years',
  },
  {
    id: 'physically_challenged',
    nameBn: 'প্রতিবন্ধী কোটা প্রার্থী',
    nameEn: 'Physically Challenged Quota',
    minAge: 21,
    maxAge: 34,
    descriptionBn: 'শারীরিক প্রতিবন্ধী প্রার্থীদের জন্য বিশেষ সুবিধায় প্রবেশের বয়সসীমা ৩৪ বছর।',
    descriptionEn: 'Age limit for candidates with physical disabilities is up to 34 years.',
    badgeBn: '৩৪ বছর',
    badgeEn: '34 Years',
  },
  {
    id: 'health_cadre',
    nameBn: 'বিসিএস স্বাস্থ্য ক্যাডার (সহকারী সার্জন)',
    nameEn: 'BCS Health Cadre (Assistant Surgeon)',
    minAge: 21,
    maxAge: 32,
    descriptionBn: 'বিসিএস স্বাস্থ্য ও ডেন্টাল সার্জনের জন্য সর্বোচ্চ বয়সসীমা ৩২ বছর।',
    descriptionEn: 'Age limit for BCS Health & Dental Surgeon is up to 32 years.',
    badgeBn: '৩২ বছর',
    badgeEn: '32 Years',
  },
  {
    id: 'judicial_service',
    nameBn: 'বাংলাদেশ জুডিশিয়াল সার্ভিস (বিজেএস)',
    nameEn: 'Bangladesh Judicial Service (BJS)',
    minAge: 21,
    maxAge: 32,
    descriptionBn: 'সহকারী জজ পদে নিয়োগের জন্য সর্বোচ্চ বয়সসীমা ৩২ বছর।',
    descriptionEn: 'Maximum age limit for Assistant Judge is 32 years.',
    badgeBn: '৩২ বছর',
    badgeEn: '32 Years',
  },
  {
    id: 'police_si',
    nameBn: 'পুলিশ সাব-ইন্সপেক্টর (SI / সার্জেন্ট)',
    nameEn: 'Police Sub-Inspector / Sergeant',
    minAge: 19,
    maxAge: 27,
    descriptionBn: 'পুলিশ এসআই এবং সার্জেন্ট পদের জন্য সাধারণ বয়সসীমা ১৯ থেকে ২৭ বছর।',
    descriptionEn: 'General age limit for Police SI & Sergeant is 19 to 27 years.',
    badgeBn: '২৭ বছর',
    badgeEn: '27 Years',
  },
  {
    id: 'primary_teacher',
    nameBn: 'সরকারি প্রাথমিক বিদ্যালয় শিক্ষক',
    nameEn: 'Govt Primary School Teacher',
    minAge: 21,
    maxAge: 32,
    descriptionBn: 'সরকারি প্রাথমিক বিদ্যালয়ের সহকারী শিক্ষক নিয়োগের সর্বোচ্চ বয়সসীমা ৩২ বছর।',
    descriptionEn: 'Assistant Teacher recruitment age limit is 32 years.',
    badgeBn: '৩২ বছর',
    badgeEn: '32 Years',
  },
  {
    id: 'custom',
    nameBn: 'কাস্টম বয়সসীমা (অন্যান্য সার্কুলার)',
    nameEn: 'Custom Age Limit (Other Circulars)',
    minAge: 18,
    maxAge: 32,
    descriptionBn: 'বিজ্ঞপ্তিতে উল্লিখিত যেকোনো নির্দিষ্ট বয়সসীমা নিজের মতো বসিয়ে যাচাই করুন।',
    descriptionEn: 'Check any custom age criteria specified in job circulars.',
    badgeBn: 'কাস্টম',
    badgeEn: 'Custom',
  },
];

export interface DetailedDateDiff {
  years: number;
  months: number;
  days: number;
  totalDays: number;
}

export function calculatePreciseAge(birthDateStr: string, asOfDateStr: string): DetailedDateDiff | null {
  if (!birthDateStr || !asOfDateStr) return null;

  const birth = new Date(birthDateStr);
  const target = new Date(asOfDateStr);

  if (isNaN(birth.getTime()) || isNaN(target.getTime())) return null;
  if (birth > target) return null;

  let years = target.getFullYear() - birth.getFullYear();
  let months = target.getMonth() - birth.getMonth();
  let days = target.getDate() - birth.getDate();

  if (days < 0) {
    months -= 1;
    const prevMonth = new Date(target.getFullYear(), target.getMonth(), 0);
    days += prevMonth.getDate();
  }

  if (months < 0) {
    years -= 1;
    months += 12;
  }

  const diffTime = target.getTime() - birth.getTime();
  const totalDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  return {
    years,
    months,
    days,
    totalDays,
  };
}

// Add years to a date string to find maximum expiration date
export function getAgeLimitExpiryDate(birthDateStr: string, maxYears: number): Date | null {
  const birth = new Date(birthDateStr);
  if (isNaN(birth.getTime())) return null;
  const expiry = new Date(birth);
  expiry.setFullYear(birth.getFullYear() + maxYears);
  return expiry;
}

// Job Eligibility Status
export interface JobEligibilityResult {
  isEligible: boolean;
  status: 'eligible' | 'overage' | 'underage';
  ageAtCutoff: DetailedDateDiff;
  timeRemaining?: {
    years: number;
    months: number;
    days: number;
    totalDays: number;
  };
  timeOverage?: {
    years: number;
    months: number;
    days: number;
    totalDays: number;
  };
  expiryDate: Date;
  rule: JobCategoryRule;
}

export function checkJobEligibility(
  birthDateStr: string,
  cutoffDateStr: string,
  rule: JobCategoryRule,
  customMinAge?: number,
  customMaxAge?: number
): JobEligibilityResult | null {
  const age = calculatePreciseAge(birthDateStr, cutoffDateStr);
  if (!age) return null;

  const min = customMinAge !== undefined ? customMinAge : rule.minAge;
  const max = customMaxAge !== undefined ? customMaxAge : rule.maxAge;

  const cutoffDate = new Date(cutoffDateStr);
  const expiryDate = getAgeLimitExpiryDate(birthDateStr, max)!;

  // Exact comparison: If years > max, or (years === max and (months > 0 or days > 0)) => overage
  let status: 'eligible' | 'overage' | 'underage' = 'eligible';
  if (age.years < min) {
    status = 'underage';
  } else if (age.years > max || (age.years === max && (age.months > 0 || age.days > 0))) {
    status = 'overage';
  }

  let timeRemaining: JobEligibilityResult['timeRemaining'];
  let timeOverage: JobEligibilityResult['timeOverage'];

  if (status === 'eligible') {
    // Time remaining until expiryDate
    const diff = calculatePreciseAge(cutoffDateStr, expiryDate.toISOString().split('T')[0]);
    if (diff) {
      timeRemaining = diff;
    }
  } else if (status === 'overage') {
    // Time overage since expiryDate
    const diff = calculatePreciseAge(expiryDate.toISOString().split('T')[0], cutoffDateStr);
    if (diff) {
      timeOverage = diff;
    }
  }

  return {
    isEligible: status === 'eligible',
    status,
    ageAtCutoff: age,
    timeRemaining,
    timeOverage,
    expiryDate,
    rule,
  };
}

// Western & Bengali Zodiac Sign
export function getZodiacSign(month: number, day: number): {
  nameBn: string;
  nameEn: string;
  symbol: string;
  elementBn: string;
  elementEn: string;
} {
  // Month is 1-indexed (1 = Jan, 12 = Dec)
  if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) {
    return { nameBn: 'মেষ রাশি', nameEn: 'Aries', symbol: '♈', elementBn: 'অগ্নি', elementEn: 'Fire' };
  }
  if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) {
    return { nameBn: 'বৃষ রাশি', nameEn: 'Taurus', symbol: '♉', elementBn: 'মাটি', elementEn: 'Earth' };
  }
  if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) {
    return { nameBn: 'মিথুন রাশি', nameEn: 'Gemini', symbol: '♊', elementBn: 'বায়ু', elementEn: 'Air' };
  }
  if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) {
    return { nameBn: 'কর্কট রাশি', nameEn: 'Cancer', symbol: '♋', elementBn: 'জল', elementEn: 'Water' };
  }
  if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) {
    return { nameBn: 'সিংহ রাশি', nameEn: 'Leo', symbol: '♌', elementBn: 'অগ্নি', elementEn: 'Fire' };
  }
  if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) {
    return { nameBn: 'কন্যা রাশি', nameEn: 'Virgo', symbol: '♍', elementBn: 'মাটি', elementEn: 'Earth' };
  }
  if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) {
    return { nameBn: 'তুলা রাশি', nameEn: 'Libra', symbol: '♎', elementBn: 'বায়ু', elementEn: 'Air' };
  }
  if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) {
    return { nameBn: 'বৃশ্চিক রাশি', nameEn: 'Scorpio', symbol: '♏', elementBn: 'জল', elementEn: 'Water' };
  }
  if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) {
    return { nameBn: 'ধনু রাশি', nameEn: 'Sagittarius', symbol: '♐', elementBn: 'অগ্নি', elementEn: 'Fire' };
  }
  if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) {
    return { nameBn: 'মকর রাশি', nameEn: 'Capricorn', symbol: '♑', elementBn: 'মাটি', elementEn: 'Earth' };
  }
  if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) {
    return { nameBn: 'কুম্ভ রাশি', nameEn: 'Aquarius', symbol: '♒', elementBn: 'বায়ু', elementEn: 'Air' };
  }
  return { nameBn: 'মীন রাশি', nameEn: 'Pisces', symbol: '♓', elementBn: 'জল', elementEn: 'Water' };
}

// Planetary Ages
export function getPlanetaryAges(earthYears: number) {
  return [
    { planetBn: 'বুধ (Mercury)', planetEn: 'Mercury', ratio: 0.2408467, age: (earthYears / 0.2408467).toFixed(1) },
    { planetBn: 'শুক্র (Venus)', planetEn: 'Venus', ratio: 0.61519726, age: (earthYears / 0.61519726).toFixed(1) },
    { planetBn: 'মঙ্গল (Mars)', planetEn: 'Mars', ratio: 1.8808158, age: (earthYears / 1.8808158).toFixed(1) },
    { planetBn: 'বৃহস্পতি (Jupiter)', planetEn: 'Jupiter', ratio: 11.862615, age: (earthYears / 11.862615).toFixed(2) },
    { planetBn: 'শনি (Saturn)', planetEn: 'Saturn', ratio: 29.447498, age: (earthYears / 29.447498).toFixed(2) },
  ];
}

// Biological Estimates
export function getBiologicalStats(totalDays: number) {
  const heartbeats = Math.floor(totalDays * 24 * 60 * 72); // ~72 bpm
  const breaths = Math.floor(totalDays * 24 * 60 * 16); // ~16 breaths/min
  const sleepHours = Math.floor(totalDays * 8); // ~8 hours/day
  const meals = Math.floor(totalDays * 3); // ~3 meals/day

  return {
    heartbeats,
    breaths,
    sleepHours,
    meals,
  };
}

// Bangladesh Office Working Days (Friday & Saturday are weekends)
export function calculateWorkingDaysBD(
  startDateStr: string,
  endDateStr: string,
  includeEnd: boolean = true,
  weekendType: 'bd_fri_sat' | 'intl_sat_sun' = 'bd_fri_sat'
) {
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) return null;

  const earlier = start <= end ? start : end;
  const later = start <= end ? end : start;

  let totalDays = Math.floor((later.getTime() - earlier.getTime()) / (1000 * 60 * 60 * 24));
  if (includeEnd) totalDays += 1;

  let workingDays = 0;
  let weekendDays = 0;

  const cur = new Date(earlier);
  for (let i = 0; i < totalDays; i++) {
    const dayOfWeek = cur.getDay(); // 0: Sun, 1: Mon, ... 5: Fri, 6: Sat
    let isWeekend = false;
    if (weekendType === 'bd_fri_sat') {
      isWeekend = dayOfWeek === 5 || dayOfWeek === 6; // Fri & Sat in BD
    } else {
      isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // Sat & Sun internationally
    }

    if (isWeekend) {
      weekendDays++;
    } else {
      workingDays++;
    }
    cur.setDate(cur.getDate() + 1);
  }

  return {
    totalDays,
    workingDays,
    weekendDays,
    isReversed: start > end,
  };
}

// Govt Retirement (PRL & Pension) Calculator
export function calculateGovtRetirement(birthDateStr: string, retirementAge: number = 59) {
  const birth = new Date(birthDateStr);
  if (isNaN(birth.getTime())) return null;

  // PRL (Post Retirement Leave) starts at exact age of retirement (59 or 60 years)
  const prlDate = new Date(birth);
  prlDate.setFullYear(birth.getFullYear() + retirementAge);

  // Final retirement is typically 1 year after PRL
  const finalPensionDate = new Date(prlDate);
  finalPensionDate.setFullYear(prlDate.getFullYear() + 1);

  const today = new Date();
  const timeToPrl = calculatePreciseAge(today.toISOString().split('T')[0], prlDate.toISOString().split('T')[0]);

  return {
    retirementAge,
    prlDate,
    finalPensionDate,
    timeToPrl,
    hasRetired: today >= prlDate,
  };
}
