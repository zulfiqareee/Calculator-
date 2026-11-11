/**
 * Bangladesh Land Registration, Stamp Duty & Govt Fees Calculator
 * Based on Registration Act, Stamp Act & National Board of Revenue (NBR) rules.
 */

export type DeedType = 'saf_kabala' | 'heba_blood' | 'bonton_nama' | 'danpotro';
export type AreaType = 'city_corp' | 'pouroshova' | 'union_parishad';

export interface RegistrationInput {
  deedType: DeedType;
  areaType: AreaType;
  deedValueTaka: number; // দলিলের মূল্য বা মৌজা রেট (টাকা)
}

export interface FeeItem {
  nameBn: string;
  nameEn: string;
  rateLabel: string;
  amountTaka: number;
  noteBn: string;
}

export interface RegistrationResult {
  deedTitleBn: string;
  areaTitleBn: string;
  totalGovtFees: number;
  feeItems: FeeItem[];
  tipsBn: string[];
}

export function calculateLandRegistrationFees(input: RegistrationInput): RegistrationResult {
  const { deedType, areaType, deedValueTaka } = input;
  const value = Math.max(0, deedValueTaka);

  const feeItems: FeeItem[] = [];
  let tips: string[] = [];

  const areaNames: Record<AreaType, string> = {
    city_corp: 'সিটি কর্পোরেশন এলাকা',
    pouroshova: 'পৌরসভা এলাকা',
    union_parishad: 'ইউনিয়ন পরিষদ (পল্লী এলাকা)',
  };

  const deedNames: Record<DeedType, string> = {
    saf_kabala: 'সাফ-কবলা দলিল (বিক্রয়)',
    heba_blood: 'রক্তের সম্পর্কের হেবা দলিল (পিতা-মাতা, সন্তান, স্বামী-স্ত্রী, ভাই-বোন)',
    bonton_nama: 'আপস বণ্টননামা দলিল (ওয়ারিশদের মধ্যে সম্পত্তি ভাগ)',
    danpotro: 'সাধারণ দানপত্র দলিল',
  };

  if (deedType === 'saf_kabala') {
    // 1. Stamp Duty: 1.5%
    const stampRate = 0.015;
    const stampFee = Math.max(100, Math.round(value * stampRate));
    feeItems.push({
      nameBn: 'স্ট্যাম্প শুল্ক (Stamp Duty)',
      nameEn: 'Stamp Duty',
      rateLabel: '১.৫%',
      amountTaka: stampFee,
      noteBn: 'মূল্যের ১.৫% হারে সরকারি নন-জুডিশিয়াল স্ট্যাম্পে প্রযোজ্য।',
    });

    // 2. Registration Fee: 1%
    const regRate = 0.01;
    const regFee = Math.max(100, Math.round(value * regRate));
    feeItems.push({
      nameBn: 'রেজিস্ট্রেশন ফি (Registration Fee)',
      nameEn: 'Registration Fee',
      rateLabel: '১.০%',
      amountTaka: regFee,
      noteBn: 'সাব-রেজিস্ট্রি অফিসের চালানে জমা দিতে হয়।',
    });

    // 3. Local Government Tax
    let localGovtRate = 0.01;
    let localGovtLabel = '১.০%';
    if (areaType === 'city_corp') {
      localGovtRate = 0.03;
      localGovtLabel = '৩.০%';
    } else if (areaType === 'pouroshova') {
      localGovtRate = 0.02;
      localGovtLabel = '২.০%';
    }
    const localFee = Math.round(value * localGovtRate);
    feeItems.push({
      nameBn: 'স্থানীয় সরকার কর (Local Govt Tax)',
      nameEn: 'Local Govt Tax',
      rateLabel: localGovtLabel,
      amountTaka: localFee,
      noteBn: `${areaNames[areaType]} হিসেবে নির্ধারিত ট্যাক্স।`,
    });

    // 4. Source Tax (উৎস কর / AIT)
    let sourceTaxRate = 0.01;
    let sourceTaxLabel = '১.০%';
    if (areaType === 'city_corp') {
      sourceTaxRate = 0.05; // 4-8% average 5%
      sourceTaxLabel = '৫.০%';
    } else if (areaType === 'pouroshova') {
      sourceTaxRate = 0.03;
      sourceTaxLabel = '৩.০%';
    }
    const sourceTaxFee = Math.round(value * sourceTaxRate);
    feeItems.push({
      nameBn: 'উৎস কর (Gain Tax / 4B AIT)',
      nameEn: 'Source Tax (AIT)',
      rateLabel: sourceTaxLabel,
      amountTaka: sourceTaxFee,
      noteBn: 'বিক্রেতার পক্ষ থেকে চালানে জমা যোগ্য কর।',
    });

    // Fixed fees
    feeItems.push({
      nameBn: 'হলফনামা স্ট্যাম্প (Affidavit Stamp)',
      nameEn: 'Affidavit Stamp',
      rateLabel: 'নির্দিষ্ট',
      amountTaka: 300,
      noteBn: '৩০০ টাকার স্ট্যাম্পে হলফনামা তৈরি।',
    });
    feeItems.push({
      nameBn: 'এন-ফি ও ই-ফি (N-Fee & E-Fee)',
      nameEn: 'N-Fee & E-Fee',
      rateLabel: 'নির্দিষ্ট',
      amountTaka: 360,
      noteBn: 'প্রতি পৃষ্ঠার নকল ও ইলেকট্রনিক ফি।',
    });

    tips = [
      'মৌজা রেটের চেয়ে কম মূল্যে দলিল রেজিস্ট্রি করা যায় না, সর্বনিম্ন মৌজা রেট অনুযায়ী হিসাব করতে হবে।',
      'উৎস কর বিক্রেতার পক্ষ থেকে জমা হয় এবং স্ট্যাম্প শুল্ক ও রেজিস্ট্রেশন ফি ক্রেতা বহন করেন।',
      'দলিল রেজিস্ট্রির পূর্বে নামজারি (মিউটেশন) পর্চা ও হাল সনের ভূমি উন্নয়ন কর (খাজনা) দাখিলা নিশ্চিত করুন।',
    ];
  } else if (deedType === 'heba_blood') {
    // Heba (Blood Relations): Nominal fixed fees
    feeItems.push({
      nameBn: 'রেজিস্ট্রেশন ফি (Registration Fee)',
      nameEn: 'Registration Fee',
      rateLabel: 'নির্দিষ্ট (ফিক্সড)',
      amountTaka: 100,
      noteBn: 'রক্তের সম্পর্কে হেবার ক্ষেত্রে সরকারি ফি মাত্র ১০০ টাকা।',
    });
    feeItems.push({
      nameBn: 'স্ট্যাম্প শুল্ক (Stamp Duty)',
      nameEn: 'Stamp Duty',
      rateLabel: 'নির্দিষ্ট',
      amountTaka: 200,
      noteBn: '২০০ টাকার নন-জুডিশিয়াল স্ট্যাম্প।',
    });
    feeItems.push({
      nameBn: 'হলফনামা স্ট্যাম্প (Affidavit Stamp)',
      nameEn: 'Affidavit Stamp',
      rateLabel: 'নির্দিষ্ট',
      amountTaka: 300,
      noteBn: '৩০০ টাকার স্ট্যাম্পে হলফনামা।',
    });
    feeItems.push({
      nameBn: 'এন-ফি ও ই-ফি (N-Fee & E-Fee)',
      nameEn: 'N-Fee & E-Fee',
      rateLabel: 'নির্দিষ্ট',
      amountTaka: 360,
      noteBn: 'নকল ও ই-ফি।',
    });

    tips = [
      'রক্তের সম্পর্কের হেবা হলো মুসলিম উত্তরাধিকারীদের মধ্যে সবচেয়ে কম খরচের বৈধ দলিল (পিতা, মাতা, স্বামী, স্ত্রী, সন্তান, সহোদর ভাইবোন)।',
      'এখানে কোনো উৎস কর (AIT) বা স্থানীয় সরকার কর প্রযোজ্য নয়।',
      'সম্পর্কের সত্যতা প্রমাণের জন্য জাতীয় পরিচয়পত্র (NID) ও ওয়ারিশ সনদ সংযুক্ত করতে হয়।',
    ];
  } else if (deedType === 'bonton_nama') {
    // Bonton-nama (Partition Deed)
    let stampFee = 50;
    if (value > 300000 && value <= 1000000) stampFee = 100;
    else if (value > 1000000 && value <= 3000000) stampFee = 200;
    else if (value > 3000000 && value <= 5000000) stampFee = 300;
    else if (value > 5000000) stampFee = 500;

    feeItems.push({
      nameBn: 'স্ট্যাম্প শুল্ক (Stamp Duty)',
      nameEn: 'Stamp Duty',
      rateLabel: 'নির্দিষ্ট স্ল্যাব',
      amountTaka: stampFee,
      noteBn: 'সম্পত্তির মোট মূল্যায়ন অনুযায়ী ৫০ টাকা থেকে সর্বোচ্চ ৫০০ টাকা।',
    });

    feeItems.push({
      nameBn: 'রেজিস্ট্রেশন ফি (Registration Fee)',
      nameEn: 'Registration Fee',
      rateLabel: 'নির্দিষ্ট ফিক্সড',
      amountTaka: 500,
      noteBn: 'আপস বণ্টননামা রেজিস্ট্রেশন ফি মাত্র ৫০০ টাকা।',
    });

    feeItems.push({
      nameBn: 'হলফনামা স্ট্যাম্প (Affidavit Stamp)',
      nameEn: 'Affidavit Stamp',
      rateLabel: 'নির্দিষ্ট',
      amountTaka: 300,
      noteBn: '৩০০ টাকার স্ট্যাম্প।',
    });

    feeItems.push({
      nameBn: 'এন-ফি ও ই-ফি (N-Fee & E-Fee)',
      nameEn: 'N-Fee & E-Fee',
      rateLabel: 'পৃষ্ঠা ভিত্তিক',
      amountTaka: 400,
      noteBn: 'নকল ও নথি ফি।',
    });

    tips = [
      'আপস বণ্টননামা দলিলের মাধ্যমে ওয়ারিশদের মধ্যে সম্পত্তি চিরতরে সুনির্দিষ্ট দাগ ও খতিয়ানে বণ্টন হয়।',
      'বণ্টননামা রেজিস্ট্রি থাকলে ভবিষ্যতে ভাই-বোনের মধ্যে জমি নিয়ে কোনো মামলা-মোকদ্দমার সুযোগ থাকে না।',
      'সকল বৈধ জীবিত ওয়ারিশের উপস্থিতি ও স্বাক্ষর অপরিহার্য।',
    ];
  } else {
    // General Danpotro
    const stampFee = Math.max(200, Math.round(value * 0.015));
    const regFee = Math.max(100, Math.round(value * 0.01));
    feeItems.push({
      nameBn: 'স্ট্যাম্প শুল্ক (Stamp Duty)',
      nameEn: 'Stamp Duty',
      rateLabel: '১.৫%',
      amountTaka: stampFee,
      noteBn: 'সাধারণ দানপত্রে ১.৫% স্ট্যাম্প শুল্ক।',
    });
    feeItems.push({
      nameBn: 'রেজিস্ট্রেশন ফি (Registration Fee)',
      nameEn: 'Registration Fee',
      rateLabel: '১.০%',
      amountTaka: regFee,
      noteBn: '১% রেজিস্ট্রেশন ফি।',
    });
    feeItems.push({
      nameBn: 'হলফনামা ও ই-ফি',
      nameEn: 'Affidavit & E-Fee',
      rateLabel: 'নির্দিষ্ট',
      amountTaka: 660,
      noteBn: 'হলফনামা ও নকল ফি।',
    });

    tips = [
      'সাধারণ দানপত্র অ-রক্তীয় ব্যক্তির ক্ষেত্রে প্রযোজ্য।',
      'প্রয়োজনীয় ক্ষেত্রে কর পরিশোধের প্রমাণপত্র লাগতে পারে।',
    ];
  }

  const totalGovtFees = feeItems.reduce((acc, item) => acc + item.amountTaka, 0);

  return {
    deedTitleBn: deedNames[deedType],
    areaTitleBn: areaNames[areaType],
    totalGovtFees,
    feeItems,
    tipsBn: tips,
  };
}
