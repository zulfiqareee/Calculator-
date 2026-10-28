import { HealthTipItem } from '../types';

export const HEALTH_TIPS_DATA: HealthTipItem[] = [
  // =========================================================================
  // CATEGORY: শিশু ও বাচ্চা (PEDIATRIC & CHILD CARE)
  // =========================================================================
  {
    id: 'tip-child-1',
    category: 'child',
    titleBn: 'শিশুর মস্তিষ্কের বিকাশ ও বুদ্ধি বৃদ্ধির পুষ্টিকর খাবার',
    titleEn: 'Nutritious Foods for Child Brain Development & Memory',
    summaryBn: 'প্রথম ৫ বছর শিশুর মস্তিষ্কের ৯০% বৃদ্ধি পায়। ডিম, বাদাম, মাছ ও দুধ শিশুর স্মৃতিশক্তি ও মেধা বাড়াতে অপরিহার্য।',
    summaryEn: '90% of brain growth occurs in first 5 years. Eggs, fish, nuts, and dairy are vital for memory and cognition.',
    image: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=700&q=80',
    readTimeBn: '৩ মিনিট পাঠ',
    readTimeEn: '3 min read',
    detailsBn: {
      description: 'শিশুর মস্তিষ্কের কোষগুলো দ্রুত গড়ে ওঠার জন্য ওমেগা-৩ ফ্যাটি এসিড, কোলিন, আয়রন, জিংক ও ভিটামিন বি১২ সমৃদ্ধ খাবার অত্যন্ত জরুরি। প্রক্রিয়াজাত বা অতিরিক্ত চিনিযুক্ত খাবারের বদলে প্রাকৃতিক ঘরে তৈরি খাবার শিশুর মনোযোগ ও শিখন ক্ষমতা বাড়ায়।',
      dos: [
        'প্রতিদিন ১টি ডিম কুসুমসহ সেদ্ধ করে দিন (কোলিন ও প্রোটিন সমৃদ্ধ)।',
        'সপ্তাহে অন্তত ২-৩ দিন সামুদ্রিক বা দেশীয় ছোট মাছ (মলা, ঢেলা, রুই) দিন।',
        'আখরোট, কাঠবাদাম গুঁড়ো করে দুধ বা ওটসের সাথে মিশিয়ে দিন।',
        'রং-বেরঙের তাজা ফল যেমন কলা, পাকা পেঁপে ও আপেল প্রতিদিন খাওয়ান।',
      ],
      donts: [
        'চিপস, চকলেট, প্যাকেটজাত জুস বা অতিরিক্ত চিনিযুক্ত স্ন্যাকস দেবেন না।',
        'খাওয়ানোর সময় মোবাইল ফোন বা টিভি দেখিয়ে অন্যমনস্ক করে খাওয়ানো বর্জন করুন।',
      ],
      nutritions: ['ডিমের কুসুম', 'ছোট দেশি মাছ', 'কাঠবাদাম ও আখরোট', 'টকদই', 'পালং শাক', 'কলা'],
      whenToSeeDoctor: 'বয়স অনুযায়ী শিশু কথা বলতে বা চোখের দিকে তাকাতে দেরি করলে কিংবা অতিরিক্ত অন্যমনস্ক হলে শিশু বিশেষজ্ঞের পরামর্শ নিন।',
    },
    detailsEn: {
      description: 'Omega-3 fatty acids, choline, iron, and zinc are crucial during early childhood for neural synapse development and cognitive performance.',
      dos: [
        'Provide one whole egg daily for choline and high-grade protein.',
        'Incorporate small local fish rich in DHA and healthy fats twice a week.',
        'Offer finely crushed almonds, walnuts, and seasonal fruits.',
      ],
      donts: [
        'Avoid ultra-processed snacks, refined candies, and carbonated beverages.',
        'Never use smartphone screens as mealtime distractions.',
      ],
      nutritions: ['Eggs', 'Fatty Fish', 'Walnuts', 'Greek Yogurt', 'Spinach', 'Bananas'],
      whenToSeeDoctor: 'Consult a pediatrician if developmental speech milestones are delayed.',
    },
  },
  {
    id: 'tip-child-2',
    category: 'child',
    titleBn: 'শিশুর জ্বর, সর্দি ও কাশির নিরাপদ যত্ন এবং সতর্কতা',
    titleEn: 'Safe Care & Red Flags for Child Cough, Cold & Fever',
    summaryBn: 'ঋতু পরিবর্তনে শিশুদের সর্দি-জ্বর সাধারণ। তবে দ্রুত শ্বাস নেওয়া বা বুকের খাঁচা দেবে যাওয়া বিপদের সংকেত।',
    summaryEn: 'Common colds are frequent in season shifts. Rapid breathing or chest indrawing requires urgent care.',
    image: 'https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?auto=format&fit=crop&w=700&q=80',
    readTimeBn: '৪ মিনিট পাঠ',
    readTimeEn: '4 min read',
    detailsBn: {
      description: 'শিশুদের রোগ প্রতিরোধ ক্ষমতা পরিপক্ব হতে সময় লাগে। সাধারণ সর্দি-কাশির বেশিরভাগই ভাইরাল ইনফেকশন, যাতে অ্যান্টিবায়োটিক দেওয়ার প্রয়োজন নেই। উষ্ণ তরল খাবার ও পরিমিত বিশ্রামই প্রধান চিকিৎসা।',
      dos: [
        'জ্বর ১০০°F ছাড়িয়ে গেলে হালকা কুসুম গরম পানিতে সুতি কাপড় ভিজিয়ে শরীর মুছে দিন।',
        'নাক বন্ধ থাকলে নরমাল স্যালাইন ড্রপ দিয়ে নাক পরিষ্কার রাখুন।',
        'প্রচুর পরিমাণে পানি, বুকের দুধ, হালকা স্যুপ ও কুসুম গরম তরল দিন।',
        'ডাক্তারের প্রেসক্রিপশন অনুযায়ী সঠিক ওজনের প্যারাসিটামল ড্রপ/সিরাপ দিন।',
      ],
      donts: [
        'ডাক্তারের পরামর্শ ছাড়া কখনো অ্যান্টিবায়োটিক বা কাশির সিরাপ খাওয়াবেন না।',
        'বরফ-ঠান্ডা পানি দিয়ে শরীর মোছাবেন না বা শিশুকে অতিরিক্ত ভারী কাপড় পরাবেন না।',
      ],
      nutritions: ['কুসুম গরম স্যুপ', 'আদা-তুলসী চা (১ বছরের ঊর্ধ্বে)', 'কমলা ও লেবুর রস', 'বুকের দুধ'],
      whenToSeeDoctor: 'শ্বাস নিতে কষ্ট হলে, বুকের খাঁচা ডেবে গেলে, শিশু নিস্তেজ হয়ে পড়লে বা ৩ দিনের বেশি টানা জ্বর থাকলে সাথে সাথে হাসপাতালে নিন।',
    },
    detailsEn: {
      description: 'Most pediatric respiratory infections are viral. Supportive hydration, saline nasal irrigation, and fever control are the primary measures.',
      dos: [
        'Sponge with lukewarm water if temperature exceeds 100°F.',
        'Use sterile pediatric saline nasal drops for nasal congestion.',
        'Maintain high fluid intake through warm soups and hydration.',
      ],
      donts: [
        'Never self-prescribe antibiotics or OTC adult cough medicines.',
        'Avoid icy water sponging which triggers violent shivering.',
      ],
      nutritions: ['Clear chicken broth', 'Warm lemon honey (above 1 yr)', 'Breastmilk'],
      whenToSeeDoctor: 'Seek emergency care for chest indrawing, stridor, or lethargy.',
    },
  },
  {
    id: 'tip-child-3',
    category: 'child',
    titleBn: 'শিশুর ডায়রিয়া ও ডিহাইড্রেশন প্রতিরোধে খাবার স্যালাইন',
    titleEn: 'Preventing Pediatric Diarrhea & Dehydration with ORS',
    summaryBn: 'ডায়রিয়ায় শরীর থেকে পানি ও লবণ বেরিয়ে যায়। খাবার স্যালাইন (ORS) ও জিংক শিশুর জীবন বাঁচায়।',
    summaryEn: 'Dehydration from loose stools is prevented by accurately prepared Oral Rehydration Salts (ORS) and Zinc.',
    image: 'https://images.unsplash.com/photo-1516627145497-ae6968895b74?auto=format&fit=crop&w=700&q=80',
    readTimeBn: '৩ মিনিট পাঠ',
    readTimeEn: '3 min read',
    detailsBn: {
      description: 'শিশুর ডায়রিয়া হলে কখনোই সাধারণ খাবার বন্ধ করা যাবে না। প্রতিবার পাতলা পায়খানার পর বয়স অনুযায়ী খাবার স্যালাইন খাওয়াতে হবে। স্যালাইন তৈরিতে পুরো ৫০০ মিলি বিশুদ্ধ পানি ব্যবহার নিশ্চিত করুন।',
      dos: [
        'প্রতিবার পায়খানার পর আধা কাপ থেকে এক কাপ তৈরি করা ওআরএস স্যালাইন খাওয়ান।',
        'টানা ১৪ দিন ডাক্তারের পরামর্শে জিংক সিরাপ খাওয়ান যা অন্ত্রের ক্ষত সারায়।',
        'বুকের দুধ ও স্বাভাবিক সহজপাচ্য খাবার (খিচুড়ি, জাউভাত) চালু রাখুন।',
      ],
      donts: [
        'কখনোই অর্ধেক প্যাকেট স্যালাইন অল্প পানিতে গুলবেন না; এতে কিডনির ক্ষতি হতে পারে।',
        'ডায়রিয়া বন্ধ করার ওষুধ (অ্যান্টি-মোটেলিটি) শিশুদের কখনো দেবেন না।',
      ],
      nutritions: ['ওআরএস স্যালাইন', 'ডাবের পানি', 'চিঁড়ার পানি', 'কাঁচাকলা খিচুড়ি'],
      whenToSeeDoctor: 'চোখ গর্তে ঢুকে গেলে, প্রস্রাবের পরিমাণ কমে গেলে বা ৬ ঘণ্টা প্রস্রাব না হলে, শিশু নিস্তেজ হয়ে পড়লে দ্রুত হাসপাতালে নিন।',
    },
    detailsEn: {
      description: 'Proper ORS dilution and continuous feeding are essential in preventing infant hypovolemic shock during acute gastroenteritis.',
      dos: [
        'Administer ORS spoon-by-spoon after every loose bowel movement.',
        'Provide zinc supplementation for 14 continuous days as advised.',
        'Continue regular breastfeeding and nutritious soft khichuri.',
      ],
      donts: [
        'Never mix half an ORS packet in less than full 500ml water.',
        'Do not give antimotility drugs to infants.',
      ],
      nutritions: ['Standard ORS', 'Tender coconut water', 'Green banana soup'],
      whenToSeeDoctor: 'Immediate hospital admission if sunken eyes, dry tongue, or no urine in 6 hours.',
    },
  },
  {
    id: 'tip-child-4',
    category: 'child',
    titleBn: 'শিশুদের চোখের সুরক্ষা ও ডিজিটাল স্ক্রিন-টাইম নিয়ন্ত্রণ',
    titleEn: 'Protecting Child Eyesight & Safe Digital Screen Habits',
    summaryBn: 'অতিরিক্ত মোবাইল ও ট্যাবের ব্যবহারে শিশুদের মায়োপিয়া ও চোখের ক্লান্তি বাড়ছে। বয়স অনুযায়ী স্ক্রিন সীমাবদ্ধ করুন।',
    summaryEn: 'Excessive device screen time causes digital eye strain and progressive myopia in young children.',
    image: 'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?auto=format&fit=crop&w=700&q=80',
    readTimeBn: '৩ মিনিট পাঠ',
    readTimeEn: '3 min read',
    detailsBn: {
      description: 'বিশ্ব স্বাস্থ্য সংস্থা (WHO) অনুযায়ী ২ বছরের নিচের শিশুদের কোনো ডিজিটাল স্ক্রিন দেখানো উচিত নয়। নিয়মিত প্রাকৃতিক সূর্যের আলো ও খেলাধুলা চোখের দৃষ্টি স্বাভাবিক রাখতে সাহায্য করে।',
      dos: [
        'প্রতিদিন অন্তত ১-২ ঘণ্টা শিশুকে বিকেলে বাইরে খেলাধুলার সুযোগ দিন।',
        'পড়ার সময় ঘরের পর্যাপ্ত আলো নিশ্চিত করুন।',
        'খাবারে ভিটামিন-এ সমৃদ্ধ খাবার যেমন গাজর, মিষ্টি কুমড়া, ছোট মাছ ও ডিম দিন।',
      ],
      donts: [
        'ঘুমানোর ১ ঘণ্টা আগে মোবাইল বা টিভি দেখতে দেবেন না।',
        'অন্ধকার ঘরে মোবাইল বা ট্যাব ব্যবহার করতে দেওয়া নিষেধ।',
      ],
      nutritions: ['গাজর', 'মিষ্টি কুমড়া', 'পাকা আম', 'ছোট মাছ', 'সবুজ শাক'],
      whenToSeeDoctor: 'শিশু বই অতিরিক্ত কাছে এনে পড়লে বা বারবার চোখ পিটপিট বা রগড়ালে চক্ষু চিকিৎসকের কাছে যান।',
    },
    detailsEn: {
      description: 'Outdoor play with ambient sunlight slows axial elongation of the eyeball, reducing progressive nearsightedness.',
      dos: [
        'Encourage minimum 90 minutes of outdoor play in daylight daily.',
        'Ensure proper illumination without screen glare while reading.',
      ],
      donts: [
        'No digital media for toddlers under 2 years (WHO guidelines).',
        'Eliminate all screens at least 1 hour prior to sleep.',
      ],
      nutritions: ['Carrots', 'Yellow bell peppers', 'Sweet potatoes', 'Eggs'],
      whenToSeeDoctor: 'Consult an optometrist if child squints frequently or complains of double vision.',
    },
  },

  // =========================================================================
  // CATEGORY: বয়স্ক মানুষ (ELDERLY & SENIOR WELLNESS)
  // =========================================================================
  {
    id: 'tip-elderly-1',
    category: 'elderly',
    titleBn: 'প্রবীণদের উচ্চ রক্তচাপ (High BP) নিয়ন্ত্রণে জীবনযাত্রা ও খাদ্যতালিকা',
    titleEn: 'Senior Hypertension Management: Diet & Lifestyle Guidelines',
    summaryBn: '৬০ ঊর্ধ্ব ব্যক্তিদের রক্তচাপ ১২০-১৩০/৮০ এর আশেপাশে রাখা জরুরি। অতিরিক্ত লবণ ও মানসিক চাপ কমানোই প্রধান চাবিকাঠি।',
    summaryEn: 'Maintaining blood pressure within safe thresholds prevents stroke, renal decline, and coronary incidents.',
    image: 'https://images.unsplash.com/photo-1581579438747-1dc8d17bbce4?auto=format&fit=crop&w=700&q=80',
    readTimeBn: '৪ মিনিট পাঠ',
    readTimeEn: '4 min read',
    detailsBn: {
      description: 'বয়স বাড়ার সাথে সাথে রক্তনালীগুলো শক্ত হয়ে যায়, ফলে রক্তচাপ বেড়ে যাওয়ার প্রবণতা দেখা দেয়। নিয়মিত ওষুধ সেবনের পাশাপাশি কম লবণের সুষম খাদ্য (DASH ডায়েট) প্রবীণদের স্ট্রোক ও কিডনি ফেইলিউর থেকে রক্ষা করে।',
      dos: [
        'ভাতের সাথে কাঁচা লবণ খাওয়া সম্পূর্ণ পরিহার করুন (দিনে ৫ গ্রামের কম লবণ)।',
        'প্রতিদিন সকালে বা বিকেলে ২০-৩০ মিনিট সমতল রাস্তায় ধীরে ধীরে হাঁটুন।',
        'পটাশিয়াম ও ম্যাগনেশিয়াম সমৃদ্ধ খাবার যেমন ডাবের পানি, কলা, লাউ ও শসা খান।',
        'প্রেসারের ওষুধ প্রতিদিন নির্দিষ্ট সময়ে গ্রহণ করুন এবং নিয়মিত প্রেশার রেকর্ড রাখুন।',
      ],
      donts: [
        'প্রেশার স্বাভাবিক দেখালে চিকিৎসকের পরামর্শ ছাড়া হঠাৎ ওষুধ বন্ধ করবেন না।',
        'অতিরিক্ত তেল-চর্বিযুক্ত মাংস, ফাস্টফুড ও প্রক্রিয়াজাত নোনতা খাবার বর্জন করুন।',
      ],
      nutritions: ['রসুন', 'কলা', 'লাউ ও পেঁপে', 'ওটস', 'মেথি ভেজানো পানি', 'ডালিম'],
      whenToSeeDoctor: 'হঠাৎ তীব্র মাথাব্যথা, বুক ধড়ফড়, চোখে ঝাপসা দেখা বা কথা জড়িয়ে গেলে তৎক্ষণাৎ জরুরি বিভাগে নিন।',
    },
    detailsEn: {
      description: 'Arterial stiffness increases vascular resistance with aging. Adopting a low-sodium DASH dietary plan significantly protects against stroke and coronary events.',
      dos: [
        'Restrict dietary sodium strictly below 2,000 mg/day (less than 1 tsp).',
        'Maintain daily mild aerobic walking for 20-30 minutes on level ground.',
        'Log blood pressure twice weekly at consistent times.',
      ],
      donts: [
        'Never stop anti-hypertensive medication without medical review.',
        'Avoid pickled foods, salted snacks, and high-fat red meats.',
      ],
      nutritions: ['Garlic', 'Leafy greens', 'Tender coconut water', 'Pomegranate', 'Oats'],
      whenToSeeDoctor: 'Seek emergency evaluation if systolic exceeds 180 or if experiencing sudden visual blur or slurred speech.',
    },
  },
  {
    id: 'tip-elderly-2',
    category: 'elderly',
    titleBn: 'ডায়াবেটিস নিয়ন্ত্রণ: প্রবীণদের প্রতিদিনের খাবার ও পায়ের যত্ন',
    titleEn: 'Senior Diabetes Care: Glycemic Control & Diabetic Foot Protection',
    summaryBn: 'রক্তে শর্করার মাত্রা নিয়ন্ত্রণে রাখার পাশাপাশি প্রবীণদের পায়ের সামান্য ক্ষতও অবহেলা করা যাবে না।',
    summaryEn: 'Balanced low-glycemic nutrition coupled with daily diabetic foot inspections prevents severe complications.',
    image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=700&q=80',
    readTimeBn: '৪ মিনিট পাঠ',
    readTimeEn: '4 min read',
    detailsBn: {
      description: 'ডায়াবেটিসে আক্রান্ত প্রবীণদের রক্তে নার্ভ দুর্বল হয়ে পড়ে (নিউরোপ্যাথি)। ফলে পায়ে আঘাত বা কাটা-ছেঁড়া সহজে টের পাওয়া যায় না। নিয়মিত সুগার পরিমাপ ও পায়ের যত্ন ডায়াবেটিক ফুট আলসার প্রতিরোধ করে।',
      dos: [
        'প্রতিদিন রাতে নরম কাপড়ে কুসুম গরম পানি দিয়ে পা ধুয়ে শুকিয়ে পরীক্ষা করুন।',
        'ঘরে ও বাইরে সবসময় নরম আরামদায়ক স্পঞ্জ স্যান্ডেল বা মোজা পরুন।',
        'ভাত-রুটির পরিমাণ কমিয়ে বেশি করে শাকসবজি, শসা, করলা ও ডাল দিয়ে পেট ভরান।',
        'হাইপোগ্লাইসেমিয়া (সুগার কমে যাওয়া) এড়াতে সবসময় পকেটে গ্লুকোজ বা মিষ্টি লজেন্স রাখুন।',
      ],
      donts: [
        'কখনোই খালি পায়ে ঘরের মেঝেও হাঁটবেন না।',
        'মিষ্টি, কোমল পানীয়, পাকা আম ও চিনিযুক্ত চা সম্পূর্ণ পরিহার করুন।',
      ],
      nutritions: ['করলা ও উচ্ছে', 'দারুচিনি গুঁড়ো', 'মেথি দানা', 'ঢ্যাঁড়শ', 'সবুজ শাকসবজি'],
      whenToSeeDoctor: 'পায়ে কোনো ঘা, কালো দাগ, বা অবশ অনুভূতি দেখা দিলে বিলম্ব না করে চিকিৎসকের কাছে যান।',
    },
    detailsEn: {
      description: 'Diabetic peripheral neuropathy reduces pain sensation in lower extremities. Daily foot checks and fiber-rich meals safeguard longevity.',
      dos: [
        'Inspect soles and between toes daily under good light.',
        'Always wear supportive, cushioned footwear even indoors.',
        'Increase leafy fiber intake to stabilize postprandial glucose surges.',
      ],
      donts: [
        'Never walk barefoot on hot tiles or uneven terrain.',
        'Avoid high-glycemic desserts, sodas, and dried fruits.',
      ],
      nutritions: ['Bitter gourd', 'Fenugreek seeds', 'Cinnamon tea', 'Okra', 'Whole grains'],
      whenToSeeDoctor: 'Promptly seek medical care for non-healing toe ulcers or localized redness.',
    },
  },
  {
    id: 'tip-elderly-3',
    category: 'elderly',
    titleBn: 'হাড়ের জয়েন্টের ব্যথা, আর্থ্রাইটিস ও অস্টিওপোরোসিস প্রতিরোধ',
    titleEn: 'Senior Arthritis, Knee Joint Pain & Bone Density Preservation',
    summaryBn: 'হাঁটু ও কোমরের ব্যথা প্রবীণদের চলাফেরা কঠিন করে তোলে। ক্যালসিয়াম, ভিটামিন-ডি ও হালকা ব্যায়ামেই মিলবে স্বস্তি।',
    summaryEn: 'Degenerative joint disease and osteoporosis are managed with safe range-of-motion routines and targeted calcium intake.',
    image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=700&q=80',
    readTimeBn: '৩ মিনিট পাঠ',
    readTimeEn: '3 min read',
    detailsBn: {
      description: 'বয়সের সাথে সাথে হাড়ের ভেতরের ঘনত্ব কমে যায় এবং জয়েন্টের তরল (সাইনোভিয়াল ফ্লুইড) শুকিয়ে যায়। ভারী ওজন কমানো এবং প্রতিদিন সকালের রোদ হাড়কে মজবুত রাখতে বিস্ময়কর ভূমিকা পালন করে।',
      dos: [
        'সকাল ৮টা থেকে ১০টার মধ্যে অন্তত ১৫-২০ মিনিট গায়ে মিষ্টি রোদ লাগান (ভিটামিন ডি)।',
        'চেয়ারে বসে পায়ের পাতা ও হাঁটুর হালকা স্ট্রেচিং ব্যায়াম করুন।',
        'প্রতিদিন ১ গ্লাস ননীমুক্ত দুধ বা টকদই এবং ছোট মাছ খান।',
        'উঁচু কমোড ব্যবহার করুন এবং মাটিতে হাঁটু মুড়ে বসা এড়িয়ে চলুন।',
      ],
      donts: [
        'ব্যথানাশক (Painkiller) ওষুধ চিকিৎসকের প্রেসক্রিপশন ছাড়া দীর্ঘদিন খাবেন না (কিডনির ক্ষতি হয়)।',
        'ভারী জিনিস তোলা বা হঠাৎ নিচু হয়ে ঝুঁকে কাজ করবেন না।',
      ],
      nutritions: ['ছোট কাঁটাযুক্ত মাছ', 'দুধ ও টকদই', 'তিল বীজ', 'সজনে পাতা', 'ডিমের কুসুম'],
      whenToSeeDoctor: 'জয়েন্ট ফুলে লাল হয়ে গেলে বা জ্বরসহ তীব্র ব্যথা হলে বিশেষজ্ঞ অর্থোপেডিক চিকিৎসকের শরণাপন্ন হন।',
    },
    detailsEn: {
      description: 'Cartilage wearing and subchondral bone loss require non-weight bearing muscle strengthening and adequate vitamin D3 synthesis.',
      dos: [
        'Expose forearms and legs to morning sunlight for 20 minutes daily.',
        'Perform seated quadriceps extensions and ankle rotations.',
        'Consume low-fat dairy and bone-in small fish for calcium bioavailability.',
      ],
      donts: [
        'Do not chronically abuse NSAID painkillers without gastro/renal monitoring.',
        'Avoid deep squatting on bare hard floors.',
      ],
      nutritions: ['Fortified milk', 'Sesame seeds', 'Moringa leaves', 'Sardines'],
      whenToSeeDoctor: 'Consult if knee joint becomes hot, swollen, or locks up during walking.',
    },
  },
  {
    id: 'tip-elderly-4',
    category: 'elderly',
    titleBn: 'প্রবীণদের রাতের ঘুম ও মানসিক সুস্থতা বজায় রাখার উপায়',
    titleEn: 'Senior Insomnia & Restful Sleep: Healthy Night Routines',
    summaryBn: 'বয়স বাড়লে ঘুমের গভীরতা কমে যায়। সন্ধ্যার পর চা-কফি পরিহার ও নির্দিষ্ট সময়ে বিছানায় যাওয়া গভীর ঘুমে সহায়ক।',
    summaryEn: 'Circadian rhythm changes in older adults require structured sleep hygiene and calming evening rituals.',
    image: 'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&w=700&q=80',
    readTimeBn: '৩ মিনিট পাঠ',
    readTimeEn: '3 min read',
    detailsBn: {
      description: 'প্রবীণদের অনিদ্রা ও বারবার ঘুম ভেঙে যাওয়া হতাশা ও বিষণ্ণতা বাড়াতে পারে। ঘুমের জন্য স্লিপিং পিলের চেয়ে প্রাকৃতিক রুটিন ও হালকা গরম দুধ খাওয়া অনেক বেশি নিরাপদ ও দীর্ঘস্থায়ী।',
      dos: [
        'প্রতিদিন রাত ১০টার মধ্যে একই সময়ে ঘুমানোর অভ্যাস করুন।',
        'ঘুমানোর আগে এক গ্লাস কুসুম গরম দুধ বা এক চিমটি জায়ফল গুঁড়ো মিশিয়ে খান।',
        'দিনের বেলায় আত্মীয়স্বজন ও বন্ধুদের সাথে গল্প করে নিজেকে কর্মচঞ্চল রাখুন।',
      ],
      donts: [
        'সন্ধ্যা ৬টার পর চা, কফি বা অতিরিক্ত পানি পান করবেন না (রাতে বারবার প্রস্রাব হওয়া ঠেকাতে)।',
        'বিকেলে দীর্ঘ সময় ঘুমাবেন না, এতে রাতের ঘুম নষ্ট হয়।',
      ],
      nutritions: ['কুসুম গরম দুধ', 'ক্যামোমাইল চা', 'কলা', 'আখরোট', 'মধু'],
      whenToSeeDoctor: 'টানা কয়েক সপ্তাহ তীব্র অনিদ্রা, অমূলক ভয় বা অতিরিক্ত ভুলে যাওয়ার প্রবণতা দেখা দিলে নিউরোলজিস্ট দেখান।',
    },
    detailsEn: {
      description: 'Reduced melatonin secretion in older age can cause fragmented nocturnal sleep. Environmental tranquility fosters restorative sleep cycles.',
      dos: [
        'Keep bedroom dark, quiet, and well-ventilated.',
        'Sip a cup of warm milk before sleep for tryptophan release.',
      ],
      donts: [
        'Avoid caffeinated beverages after 4 PM.',
        'Limit evening fluid intake to reduce disruptive nocturia episodes.',
      ],
      nutritions: ['Warm milk', 'Walnuts', 'Chamomile infusion', 'Bananas'],
      whenToSeeDoctor: 'Seek medical evaluation if severe daytime disorientation or cognitive confusion persists.',
    },
  },

  // =========================================================================
  // CATEGORY: সাধারণ মানুষ ও প্রাপ্তবয়স্ক (GENERAL ADULTS & YOUTH)
  // =========================================================================
  {
    id: 'tip-gen-1',
    category: 'general',
    titleBn: 'প্রতিদিন সঠিক নিয়মে পানি পান ও কিডনি সুরক্ষার বিজ্ঞান',
    titleEn: 'Scientific Hydration Rules & Protecting Kidney Health',
    summaryBn: 'সারাদিনে ২.৫ থেকে ৩ লিটার পানি পান প্রস্রাবের ইনফেকশন, কোষ্ঠকাঠিন্য ও কিডনিতে পাথর হওয়া রোধ করে।',
    summaryEn: 'Drinking 2.5-3 liters of fluids daily flushes toxins and substantially reduces nephrolithiasis risk.',
    image: 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?auto=format&fit=crop&w=700&q=80',
    readTimeBn: '৩ মিনিট পাঠ',
    readTimeEn: '3 min read',
    detailsBn: {
      description: 'পানি শুধু তৃষ্ণা মেটায় না, এটি শরীরের রক্ত সঞ্চালন ও কোষের বর্জ্য অপসারণ করে। পানি পানের সঠিক নিয়ম হলো ধীরে ধীরে বসে চুমুক দিয়ে খাওয়া এবং প্রস্রাবের রঙের দিকে খেয়াল রাখা।',
      dos: [
        'সকালে ঘুম থেকে উঠে খালি পেটে ১-২ গ্লাস হালকা কুসুম গরম পানি পান করুন।',
        'প্রস্রাবের রঙ হালকা স্বচ্ছ বা খড় রঙের রাখা নিশ্চিত করতে পর্যাপ্ত পানি পান করুন।',
        'খাবার খাওয়ার ৩০ মিনিট আগে বা ৪৫ মিনিট পরে পানি পান করা হজমে সাহায্য করে।',
      ],
      donts: [
        'খাবার খাওয়ার মাঝে ঢকঢক করে বেশি পানি খাবেন না; এতে পাচক রস পাতলা হয়ে বদহজম হয়।',
        'পানির বিকল্প হিসেবে মিষ্টি কোল্ড ড্রিঙ্কস বা এনার্জি ড্রিঙ্কস পান করবেন না।',
      ],
      nutritions: ['লেবু পানি', 'ডাবের পানি', 'শসা', 'তরমুজ', 'ইসবগুলের ভুষি'],
      whenToSeeDoctor: 'প্রস্রাবে জ্বালাপোড়া, তলপেটে তীব্র ব্যথা বা প্রস্রাবের সাথে রক্ত গেলে অবিলম্বে ইউরোলজিস্টের শরণাপন্ন হন।',
    },
    detailsEn: {
      description: 'Adequate hydration maintains optimal glomerular filtration rate and prevents urinary sediment aggregation.',
      dos: [
        'Drink a glass of warm water upon waking to kickstart peristalsis.',
        'Sip water steadily throughout the day rather than chugging in bulk.',
      ],
      donts: [
        'Do not replace water with sweetened carbonated sodas.',
        'Avoid delaying urination when the bladder sensation arises.',
      ],
      nutritions: ['Lemon infused water', 'Cucumber', 'Tender coconut', 'Isabgol'],
      whenToSeeDoctor: 'Seek treatment if you experience flank pain, dysuria, or hematuria.',
    },
  },
  {
    id: 'tip-gen-2',
    category: 'general',
    titleBn: 'গ্যাস, বুক জ্বালাপোড়া ও অ্যাসিডিটি দূর করার স্থায়ী ঘরোয়া উপায়',
    titleEn: 'Permanent Home Remedies for Acidity, GERD & Bloating',
    summaryBn: 'অনিয়মিত খাওয়া ও ভাজাপোড়া খাবার অ্যাসিডিটির মূল কারণ। খাবার খাওয়ার পরপরই শুয়ে পড়ার অভ্যাস ত্যাগ করুন।',
    summaryEn: 'Gastric reflux and bloating are largely manageable with timely meals, chewing thoroughly, and posture control.',
    image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=700&q=80',
    readTimeBn: '৪ মিনিট পাঠ',
    readTimeEn: '4 min read',
    detailsBn: {
      description: 'গ্যাস্ট্রিকের জন্য কথায় কথায় এন্টাসিড বা ওমিপ্রাজল খাওয়া দীর্ঘমেয়াদে পাকস্থলীর হজম ক্ষমতা কমিয়ে দেয়। জীবনযাত্রার সামান্য পরিবর্তনই অ্যাসিডিটি চিরতরে দূর করতে সক্ষম।',
      dos: [
        'খাবার ধীরে ধীরে ভালো করে চিবিয়ে খান (খাবার অন্তত ২০ মিনিট সময় নিয়ে খান)।',
        'রাতের খাবার ঘুমানোর অন্তত ২ থেকে ৩ ঘণ্টা আগে শেষ করুন।',
        'পেটে গ্যাস হলে আদা কুচি, মৌরি বা পুদিনা পাতা মেশানো কুসুম গরম পানি পান করুন।',
        'সকালের নাস্তা কখনোই বাদ দেবেন না; সময়মতো সুষম খাবার খান।',
      ],
      donts: [
        'ডুবো তেলে ভাজা খাবার, অতিরিক্ত ঝাল-মসলা ও পরোটা নিয়মিত খাওয়া পরিহার করুন।',
        'খাওয়ার সাথে সাথে বিছানায় শুয়ে পড়বেন না।',
      ],
      nutritions: ['কাঁচা পেঁপে', 'আদা চা', 'টকদই', 'মৌরি বীজ', 'ঠান্ডা দুধ'],
      whenToSeeDoctor: 'খাবার গিলতে কষ্ট হলে, বমি হলে বা কালো পায়খানা হলে দ্রুত গ্যাস্ট্রোএন্টারোলজিস্ট দেখান।',
    },
    detailsEn: {
      description: 'Frequent reliance on PPI medication can lower stomach acid excessively, impairing micronutrient absorption. Lifestyle shifts are foundational.',
      dos: [
        'Chew each bite thoroughly to stimulate salivary digestive enzymes.',
        'Finish dinner at least 2.5 hours before lying down.',
        'Consume probiotic plain curd to balance gut microbiota.',
      ],
      donts: [
        'Eliminate deep-fried, oily snacks and late-night spicy meals.',
        'Avoid tight waistbands right after eating.',
      ],
      nutritions: ['Papaya', 'Ginger', 'Fennel infusion', 'Probiotic yogurt'],
      whenToSeeDoctor: 'Consult a physician if experiencing dysphagia, unexplained weight loss, or black stools.',
    },
  },
  {
    id: 'tip-gen-3',
    category: 'general',
    titleBn: 'ফ্যাটি লিভার ও অতিরিক্ত পেটের মেদ কমানোর বিজ্ঞানসম্মত উপায়',
    titleEn: 'Reversing Fatty Liver Disease & Reducing Abdominal Visceral Fat',
    summaryBn: 'অতিরিক্ত চিনি, মিষ্টি ও অলস জীবনযাত্রা লিভারে চর্বি জমায়। নিয়মিত শরীরচর্চা লিভারকে পুনরুজ্জীবিত করে।',
    summaryEn: 'Non-alcoholic fatty liver is reversible with carbohydrate moderation, aerobic intervals, and healthy fats.',
    image: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=700&q=80',
    readTimeBn: '৪ মিনিট পাঠ',
    readTimeEn: '4 min read',
    detailsBn: {
      description: 'লিভারের নিজস্ব ক্ষমতা আছে ক্ষতিগ্রস্ত কোষ মেরামত করার। ভাত ও মিষ্টিজাতীয় কার্বোহাইড্রেট কমিয়ে দৈনিক শারীরিক কসরত করলে লিভারের চর্বি গলে যায়।',
      dos: [
        'সপ্তাহে অন্তত ৫ দিন প্রতিদিন ৩০-৪০ মিনিট দ্রুত হাঁটা বা জগিং করুন।',
        'খাদ্যতালিকায় গ্রিন টি, লেবু, কফি ও প্রচুর পরিমাণে কাঁচা সালাদ রাখুন।',
        'রান্নায় সরিষার তেল বা কম পরিমাণে তেল ব্যবহার করুন।',
      ],
      donts: [
        'মিষ্টি, কেক, পেস্ট্রি, নরম পানীয় ও প্যাকেটজাত জুস খাওয়া সম্পূর্ণ বন্ধ করুন।',
        'ধূমপান ও যেকোনো ধরনের অ্যালকোহল লিভারের মারাত্মক শত্রু।',
      ],
      nutritions: ['গ্রিন টি', 'ব্ল্যাক কফি (চিনি ছাড়া)', 'রসুন', 'ব্রোকলি', 'পালং শাক', 'লেবু'],
      whenToSeeDoctor: 'চোখ বা প্রস্রাব হলুদ হলে, পেটের ডানপাশে সার্বক্ষণিক ভারী লাগলে লিভার ফাংশন টেস্ট (SGPT) করান।',
    },
    detailsEn: {
      description: 'Hepatic steatosis correlates directly with insulin resistance and sedentary habits. Intermittent fasting and active movement restore hepatic health.',
      dos: [
        'Engage in 150 minutes of moderate aerobic cardio weekly.',
        'Incorporate unsweetened black coffee and cruciferous vegetables.',
      ],
      donts: [
        'Cut out refined fructose, sodas, and hydrogenated bakery shortening.',
        'Avoid chronic alcohol consumption.',
      ],
      nutritions: ['Unsweetened coffee', 'Garlic', 'Turmeric', 'Green leafy salads'],
      whenToSeeDoctor: 'Check liver function panel if experiencing chronic right upper quadrant discomfort.',
    },
  },
  {
    id: 'tip-gen-4',
    category: 'general',
    titleBn: 'মানসিক ক্লান্তি, অতিরিক্ত দুশ্চিন্তা ও স্ট্রেস থেকে মুক্তির উপায়',
    titleEn: 'Overcoming Chronic Stress, Burnout & Anxiety Naturally',
    summaryBn: 'মানসিক চাপ শরীরের রোগ প্রতিরোধ ক্ষমতা দুর্বল করে। ৪-৭-৮ শ্বাসপ্রশ্বাসের ব্যায়াম ও পর্যাপ্ত ঘুম মন শান্ত করে।',
    summaryEn: 'Chronic cortisol elevation harms immunity. Diaphragmatic breathing and digital detox restore balance.',
    image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=700&q=80',
    readTimeBn: '৩ মিনিট পাঠ',
    readTimeEn: '3 min read',
    detailsBn: {
      description: 'কাজের চাপ ও সামাজিক ব্যস্ততায় অতিরিক্ত স্ট্রেস হৃদরোগ ও অনিদ্রার ঝুঁকি বাড়ায়। প্রতিদিন নিজের জন্য কিছু নীরব সময় রাখা এবং গভীর শ্বাস নেওয়ার অভ্যাস মনকে প্রফুল্ল রাখে।',
      dos: [
        'প্রতিদিন ১০ মিনিট গভীর শ্বাস-প্রশ্বাসের অনুশীলন (Deep Breathing) করুন।',
        'রাতে ঘুমানোর আগে ফোন দূরে রেখে নিজের পছন্দের বই পড়ুন বা প্রশান্তিদায়ক সঙ্গীত শুনুন।',
        'পারিবারিক ও সামাজিক যোগাযোগ বাড়ান; মনের কথা বিশ্বস্ত কারও সাথে শেয়ার করুন।',
      ],
      donts: [
        'স্ট্রেস কমাতে অতিরিক্ত ধূমপান বা চা-কফি পানের আশ্রয় নেবেন না।',
        'রাত জেগে সোশ্যাল মিডিয়ায় অন্তহীন স্ক্রল করা বন্ধ করুন।',
      ],
      nutritions: ['কালো চকলেট (ডার্ক চকলেট)', 'কলা', 'গ্রিন টি', 'বাদাম', 'দুধ'],
      whenToSeeDoctor: 'আতঙ্কগ্রস্ততা (Panic attack), তীব্র বিষণ্ণতা বা আত্মহত্যার চিন্তা এলে অবিলম্বে মনোরোগ বিশেষজ্ঞের কাছে যান।',
    },
    detailsEn: {
      description: 'Vagal nerve stimulation through slow box-breathing activates parasympathetic calming responses.',
      dos: [
        'Practice 4-7-8 rhythmic breathing twice daily.',
        'Spend screen-free time connecting with nature or supportive companions.',
      ],
      donts: [
        'Avoid self-medicating with sedatives, tobacco, or heavy caffeine.',
        'Do not isolate yourself during depressive moods.',
      ],
      nutritions: ['Dark chocolate (>70%)', 'Almonds', 'Chamomile', 'Bananas'],
      whenToSeeDoctor: 'Seek mental health counselor for panic attacks or persistent depressive paralysis.',
    },
  },

  // =========================================================================
  // CATEGORY: নারী ও মায়েদের যত্ন (WOMEN & MATERNAL CARE)
  // =========================================================================
  {
    id: 'tip-women-1',
    category: 'women',
    titleBn: 'রক্তস্বল্পতা (Anemia) দূর করতে আয়রন ও ভিটামিন-সি সমৃদ্ধ খাবার',
    titleEn: 'Combating Iron-Deficiency Anemia in Women with Food Synergy',
    summaryBn: 'বাংলাদেশের বহু নারী রক্তস্বল্পতায় ভোগেন। কচুশাক, কলিজা ও ডালিমের সাথে লেবুর রস খেলে আয়রন দ্রুত শোষিত হয়।',
    summaryEn: 'Synergizing plant and heme iron with dietary Vitamin C triples gut absorption and banishes fatigue.',
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=700&q=80',
    readTimeBn: '৩ মিনিট পাঠ',
    readTimeEn: '3 min read',
    detailsBn: {
      description: 'রক্তে হিমোগ্লোবিন কমে গেলে শরীর ক্লান্ত লাগে, বুক ধড়ফড় করে এবং চুল পড়া বাড়ে। উদ্ভিজ্জ আয়রনের সাথে ভিটামিন সি যুক্ত করলে শরীর আয়রন দ্বিগুণ কার্যকরভাবে গ্রহণ করতে পারে।',
      dos: [
        'শাকসবজি বা ডাল খাওয়ার সময় পাতে এক টুকরো কাঁচা লেবুর রস চিপে নিন।',
        'খাদ্যতালিকায় কলিজা, ডিম, কাঁচাকলা, বিট ও কালো ডালিম রাখুন।',
        'ভারী মাসিকের সমস্যা থাকলে ডাক্তারের পরামর্শে আয়রন ও ফলিক এসিড বড়ি খান।',
      ],
      donts: [
        'ভারী খাবারের সাথে সাথে চা বা কফি খাবেন না (চা-কফির ট্যানিন আয়রন শোষণে বাধা দেয়)।',
        'ক্যালসিয়াম ও আয়রন ট্যাবলেট একসাথে খাবেন না; অন্তত ২ ঘণ্টা ব্যবধান রাখুন।',
      ],
      nutritions: ['কচুশাক ও লালশাক', 'মুরগির কলিজা', 'ডালিম', 'খেজুর', 'কিশমিশ', 'আমলকী'],
      whenToSeeDoctor: 'চোখের নিচের পাতা সাদাটে হয়ে গেলে, সামান্য হাঁটলে হাঁপিয়ে উঠলে রক্তে হিমোগ্লোবিন পরীক্ষা (CBC) করান।',
    },
    detailsEn: {
      description: 'Pairing non-heme iron sources with ascorbic acid significantly enhances mucosal uptake, restoring energy levels.',
      dos: [
        'Always squeeze fresh lemon juice over lentils and leafy greens.',
        'Consume iron-rich organic meats, dates, and beets regularly.',
      ],
      donts: [
        'Avoid tea or coffee immediately following iron-rich meals.',
        'Never ingest calcium supplements concurrently with iron tablets.',
      ],
      nutritions: ['Spinach', 'Poultry liver', 'Pomegranates', 'Black raisins', 'Amla'],
      whenToSeeDoctor: 'Check CBC hemoglobin levels if experiencing severe breathlessness or spoon-shaped nails.',
    },
  },
  {
    id: 'tip-women-2',
    category: 'women',
    titleBn: 'গর্ভবতী মায়ের সুষম পুষ্টি ও গর্ভাবস্থায় জরুরি যত্ন',
    titleEn: 'Maternal Nutrition & Essential Antenatal Care Guidelines',
    summaryBn: 'গর্ভস্থ শিশুর জন্মগত ত্রুটি রোধে ফলিক এসিড এবং শিশুর হাড়ের গঠনে ক্যালসিয়াম ও আয়রন গ্রহণ অপরিহার্য।',
    summaryEn: 'Comprehensive antenatal nutrition with folic acid, iodine, and calcium safeguards both mother and fetus.',
    image: 'https://images.unsplash.com/photo-1516627145497-ae6968895b74?auto=format&fit=crop&w=700&q=80',
    readTimeBn: '৪ মিনিট পাঠ',
    readTimeEn: '4 min read',
    detailsBn: {
      description: 'গর্ভাবস্থায় মায়ের শরীরে স্বাভাবিকের চেয়ে অতিরিক্ত পুষ্টির প্রয়োজন হয়। "দু\'জনের খাবার" মানে দ্বিগুণ খাবার খাওয়া নয়, বরং সঠিক পুষ্টিসমৃদ্ধ খাবার পরিমিত পরিমাণে খাওয়া।',
      dos: [
        'গর্ভধারণের প্রথম দিন থেকেই ডাক্তারের পরামর্শে ফলিক এসিড ও ক্যালসিয়াম শুরু করুন।',
        'প্রতিদিন অন্তত ২টি ডিম, ১-২ গ্লাস দুধ এবং প্রচুর রঙিন তাজা শাকসবজি খান।',
        'বাম কাত হয়ে শোয়ার অভ্যাস করুন (এতে গর্ভস্থ শিশুর রক্ত সঞ্চালন ভালো হয়)।',
        'নির্ধারিত তারিখে অন্তত ৪ বার গর্ভকালীন স্বাস্থ্য পরীক্ষা (ANC) সম্পন্ন করুন।',
      ],
      donts: [
        'কাঁচা পেঁপে, অতিরিক্ত আনারস বা আধাসেদ্ধ মাংস পরিহার করুন।',
        'ভারী বালতি বা ওজন তোলা এবং দীর্ঘ পথ ঝাঁকুনির গাড়িতে ভ্রমণ করবেন না।',
      ],
      nutritions: ['দুধ ও ছানা', 'ডিম', 'সবুজ শাকসবজি', 'বাদাম', 'ফলমূল', 'ছোট মাছ'],
      whenToSeeDoctor: 'রক্তস্রাব, চোখে ঝাপসা দেখা, হাত-পা অতিরিক্ত ফুলে যাওয়া বা গর্ভস্থ শিশুর নড়াচড়া কমে গেলে জরুরি ভিত্তিতে হাসপাতালে যান।',
    },
    detailsEn: {
      description: 'Adequate micronutrient supplementation during gestation prevents neural tube defects, pre-eclampsia, and intrauterine growth restriction.',
      dos: [
        'Initiate folic acid and elemental iron supplementation early.',
        'Sleep predominantly in the left lateral position for uterine perfusion.',
        'Complete at least four formal antenatal check-ups.',
      ],
      donts: [
        'Avoid raw or unpasteurized dairy, undercooked eggs, and unripe papaya.',
        'Avoid lifting heavy loads and riding over unpaved bumpy roads.',
      ],
      nutritions: ['Pasteurized milk', 'Free-range eggs', 'Green vegetables', 'Walnuts'],
      whenToSeeDoctor: 'Immediate hospital visit for vaginal bleeding, severe epigastric pain, or reduced fetal kicks.',
    },
  },

  // =========================================================================
  // CATEGORY: জরুরি প্রাথমিক চিকিৎসা (FIRST AID & EMERGENCY)
  // =========================================================================
  {
    id: 'tip-firstaid-1',
    category: 'firstaid',
    titleBn: 'আগুনে বা গরম তেলে হাত পুড়লে তাৎক্ষণিক করণীয় ও ভুল ধারণা',
    titleEn: 'Immediate Burn First Aid & Harmful Myths to Avoid',
    summaryBn: 'পোড়া স্থানে সঙ্গে সঙ্গে একটানা ১৫-২০ মিনিট সাধারণ ট্যাপের পানি ঢালুন। টুথপেস্ট বা ডিম লাগানো সম্পূর্ণ ক্ষতিকর।',
    summaryEn: 'Cool superficial burns under running tap water for 20 minutes. Never apply toothpaste, ice, or egg whites.',
    image: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=700&q=80',
    readTimeBn: '৩ মিনিট পাঠ',
    readTimeEn: '3 min read',
    detailsBn: {
      description: 'আগুনে পোড়ার প্রথম কয়েক মিনিটের সঠিক পদক্ষেপই চামড়ার গভীর ক্ষত রোধ করে। ভুল উপাদান লাগালে ইনফেকশনের ঝুঁকি বহুগুণ বেড়ে যায়।',
      dos: [
        'পোড়া জায়গায় সাধারণ তাপমাত্রার বহমান পানির নিচে অন্তত ১৫-২০ মিনিট ধরে রাখুন।',
        'আক্রান্ত স্থানের আংটি, ঘড়ি বা আঁটসাঁট কাপড় দ্রুত খুলে ফেলুন (স্থানটি ফুলে যাওয়ার আগেই)।',
        'পরিষ্কার জীবাণুমুক্ত গজ ব্যান্ডেজ দিয়ে হালকা করে ঢেকে হাসপাতালে নিয়ে যান।',
      ],
      donts: [
        'পোড়া জায়গায় কখনোই বরফ লাগাবেন না (বরফ রক্ত চলাচল বন্ধ করে টিস্যু নষ্ট করে)।',
        'টুথপেস্ট, তেল, ডিমের সাদা অংশ বা গোবর জাতীয় কোনো কিছু লাগাবেন না।',
        'পোড়া ফোসকা ভুলেও ফাটাবেন না।',
      ],
      nutritions: ['প্রচুর ওআরএস স্যালাইন', 'ডাবের পানি', 'প্রোটিন সমৃদ্ধ খাবার (পরবর্তীতে)'],
      whenToSeeDoctor: 'মুখ, হাত বা যৌনাঙ্গ পুড়ে গেলে, পোড়া চামড়া সাদা বা কয়লার মতো কালো হলে অবিলম্বে বার্ন ইউনিটে যান।',
    },
    detailsEn: {
      description: 'Immediate thermal energy dissipation under flowing room-temperature water limits tissue necrosis depth.',
      dos: [
        'Flush burn area continuously under cool running tap water for 15-20 minutes.',
        'Remove rings and tight watches before inflammatory swelling begins.',
        'Cover loosely with sterile non-adherent dressing.',
      ],
      donts: [
        'Never apply ice directly which worsens ischemic tissue injury.',
        'Avoid folk remedies like toothpaste, butter, or raw eggs.',
        'Never puncture intact blister domes.',
      ],
      nutritions: ['Oral rehydration fluid', 'Clean water', 'High-protein diet'],
      whenToSeeDoctor: 'Transport immediately to specialized burn center if face, hands, or extensive surface is involved.',
    },
  },
  {
    id: 'tip-firstaid-2',
    category: 'firstaid',
    titleBn: 'হিটস্ট্রোক ও তীব্র গরমে ডিহাইড্রেশন থেকে বাঁচার জরুরি উপায়',
    titleEn: 'Heat Stroke Prevention & Emergency Heat Stress Protocol',
    summaryBn: 'তীব্র গরমে শরীর ঘেমে যাওয়া বন্ধ হয়ে তাপমাত্রা ১০৪°F ছাড়িয়ে গেলে হিটস্ট্রোক হতে পারে। দ্রুত শীতল করাই জীবন রক্ষাকারী।',
    summaryEn: 'Heat stroke occurs when thermoregulation fails and core temp hits 104°F. Rapid external cooling is life-saving.',
    image: 'https://images.unsplash.com/photo-1527525443983-6e60c75fff46?auto=format&fit=crop&w=700&q=80',
    readTimeBn: '৩ মিনিট পাঠ',
    readTimeEn: '3 min read',
    detailsBn: {
      description: 'হিটস্ট্রোক একটি প্রাণঘাতী জরুরি অবস্থা। প্রচণ্ড গরমে যখন শরীর ঘামের মাধ্যমে তাপমাত্রা নিয়ন্ত্রণে ব্যর্থ হয়, তখন দ্রুত শীতল পরিবেশ ও প্রাথমিক চিকিৎসা না দিলে মস্তিষ্ক ও অঙ্গের ক্ষতি হতে পারে।',
      dos: [
        'আক্রান্ত ব্যক্তিকে অবিলম্বে রোদ থেকে সরিয়ে ছায়াযুক্ত বা ফ্যানের নিচে শীতল জায়গায় শুইয়ে দিন।',
        'শরীরের কাপড় ঢিলেঢালা করে দিন এবং ঘাড়, বগল ও কুঁচকিতে ভেজা কাপড় বা বরফের প্যাক দিন।',
        'যদি রোগী সজ্ঞানে থাকে, তবে স্যালাইন বা ঠান্ডা পানি অল্প অল্প করে পান করান।',
      ],
      donts: [
        'অচেতন ব্যক্তিকে মুখে জোর করে পানি বা স্যালাইন পান করাবেন না (ফুসফুসে ঢুকে শ্বাসরোধ হতে পারে)।',
        'গরমের দিনে তৃষ্ণা মেটাতে মাত্রাতিরিক্ত চা বা কোমল পানীয় পান করবেন না।',
      ],
      nutritions: ['খাবার স্যালাইন', 'ডাবের পানি', 'বেলের শরবত', 'লেবুর পানি'],
      whenToSeeDoctor: 'রোগী প্রলাপ বকলে, অজ্ঞান হয়ে গেলে বা খিঁচুনি হলে কালবিলম্ব না করে নিকটস্থ হাসপাতালে জরুরি বিভাগে নিন।',
    },
    detailsEn: {
      description: 'Exertional and non-exertional hyperthermia cause multi-organ breakdown if core temperature is not brought down rapidly.',
      dos: [
        'Move patient immediately to shaded, air-conditioned or ventilated spot.',
        'Apply cold wet towels or ice packs to axillae, neck, and groin.',
      ],
      donts: [
        'Never administer oral liquids to a semi-conscious or seizing victim.',
      ],
      nutritions: ['Chilled oral rehydration solution', 'Coconut water'],
      whenToSeeDoctor: 'Call emergency ambulance immediately if loss of consciousness or convulsions occur.',
    },
  },
];
