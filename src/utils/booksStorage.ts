import { BookItem } from '../types';

const STORAGE_KEY_BOOKS = 'smart_utility_books_v1';

const HOUSE_WIRING_DIAGRAM = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 700 240" width="100%" height="100%" fill="none"><rect width="700" height="240" rx="16" fill="%230f172a"/><text x="350" y="30" fill="%2338bdf8" font-size="15" font-family="sans-serif" font-weight="bold" text-anchor="middle">বাসাবাড়ি সিঙ্গেল ফেজ প্রধান বিতরণ ডায়াগ্রাম (Single Phase Wiring Schematic)</text><rect x="30" y="60" width="100" height="130" rx="10" fill="%231e293b" stroke="%2338bdf8" stroke-width="2"/><text x="80" y="105" fill="%23ffffff" font-size="12" font-family="sans-serif" font-weight="bold" text-anchor="middle">এনার্জি মিটার</text><text x="80" y="125" fill="%2394a3b8" font-size="10" font-family="sans-serif" text-anchor="middle">KWh Meter</text><path d="M 130 100 L 170 100" stroke="%23ef4444" stroke-width="3"/><path d="M 130 130 L 170 130" stroke="%233b82f6" stroke-width="3"/><rect x="170" y="60" width="100" height="130" rx="10" fill="%231e293b" stroke="%23f59e0b" stroke-width="2"/><text x="220" y="105" fill="%23ffffff" font-size="12" font-family="sans-serif" font-weight="bold" text-anchor="middle">মেইন সুইচ</text><text x="220" y="125" fill="%23f59e0b" font-size="10" font-family="sans-serif" font-weight="bold" text-anchor="middle">DP MCB 63A</text><path d="M 270 100 L 310 100" stroke="%23ef4444" stroke-width="3"/><path d="M 270 130 L 310 130" stroke="%233b82f6" stroke-width="3"/><rect x="310" y="60" width="105" height="130" rx="10" fill="%231e293b" stroke="%2310b981" stroke-width="2"/><text x="362" y="105" fill="%23ffffff" font-size="12" font-family="sans-serif" font-weight="bold" text-anchor="middle">সুরক্ষা ব্রেকার</text><text x="362" y="125" fill="%2310b981" font-size="10" font-family="sans-serif" font-weight="bold" text-anchor="middle">RCCB 30mA</text><path d="M 415 100 L 455 100" stroke="%23ef4444" stroke-width="3"/><path d="M 415 130 L 455 130" stroke="%233b82f6" stroke-width="3"/><rect x="455" y="55" width="215" height="150" rx="12" fill="%231e293b" stroke="%23818cf8" stroke-width="2"/><text x="562" y="80" fill="%23ffffff" font-size="12" font-family="sans-serif" font-weight="bold" text-anchor="middle">ডিস্ট্রিবিউশন বোর্ড (SDB)</text><rect x="470" y="95" width="55" height="95" rx="6" fill="%23334155"/><text x="497" y="130" fill="%23ffffff" font-size="10" font-weight="bold" text-anchor="middle">১০A</text><text x="497" y="150" fill="%2394a3b8" font-size="9" text-anchor="middle">লাইট</text><rect x="535" y="95" width="55" height="95" rx="6" fill="%23334155"/><text x="562" y="130" fill="%23ffffff" font-size="10" font-weight="bold" text-anchor="middle">১৬A</text><text x="562" y="150" fill="%2394a3b8" font-size="9" text-anchor="middle">পাওয়ার</text><rect x="600" y="95" width="55" height="95" rx="6" fill="%23334155"/><text x="627" y="130" fill="%23ffffff" font-size="10" font-weight="bold" text-anchor="middle">২০A</text><text x="627" y="150" fill="%2394a3b8" font-size="9" text-anchor="middle">এসি</text><line x1="30" y1="215" x2="670" y2="215" stroke="%2322c55e" stroke-width="2.5" stroke-dasharray="6,4"/><text x="350" y="232" fill="%2322c55e" font-size="10" font-family="sans-serif" font-weight="bold" text-anchor="middle">নিরেপক্ষ নিরাপত্তা আর্থিং বাসবার (Earth Continuity Conductor - Green)</text></svg>`;

const MOTOR_WIRING_DIAGRAM = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 650 200" width="100%" height="100%" fill="none"><rect width="650" height="200" rx="16" fill="%230f172a"/><text x="325" y="28" fill="%2338bdf8" font-size="14" font-family="sans-serif" font-weight="bold" text-anchor="middle">৩-ফেজ ইন্ডাকশন মোটর টার্মিনাল কানেকশন চিত্র</text><rect x="40" y="45" width="260" height="135" rx="10" fill="%231e293b" stroke="%2338bdf8" stroke-width="2"/><text x="170" y="70" fill="%2338bdf8" font-size="12" font-family="sans-serif" font-weight="bold" text-anchor="middle">স্টার কানেকশন (Star - Y)</text><circle cx="100" cy="95" r="12" fill="%23ef4444"/><text x="100" y="99" fill="%23fff" font-size="10" font-weight="bold" text-anchor="middle">W2</text><circle cx="170" cy="95" r="12" fill="%23eab308"/><text x="170" y="99" fill="%23fff" font-size="10" font-weight="bold" text-anchor="middle">U2</text><circle cx="240" cy="95" r="12" fill="%233b82f6"/><text x="240" y="99" fill="%23fff" font-size="10" font-weight="bold" text-anchor="middle">V2</text><line x1="100" y1="95" x2="240" y2="95" stroke="%23a855f7" stroke-width="6"/><circle cx="100" cy="150" r="12" fill="%23ef4444"/><text x="100" y="154" fill="%23fff" font-size="10" font-weight="bold" text-anchor="middle">U1</text><circle cx="170" cy="150" r="12" fill="%23eab308"/><text x="170" y="154" fill="%23fff" font-size="10" font-weight="bold" text-anchor="middle">V1</text><circle cx="240" cy="150" r="12" fill="%233b82f6"/><text x="240" y="154" fill="%23fff" font-size="10" font-weight="bold" text-anchor="middle">W1</text><rect x="350" y="45" width="260" height="135" rx="10" fill="%231e293b" stroke="%2310b981" stroke-width="2"/><text x="480" y="70" fill="%2310b981" font-size="12" font-family="sans-serif" font-weight="bold" text-anchor="middle">ডেল্টা কানেকশন (Delta - Δ)</text><circle cx="410" cy="95" r="12" fill="%23ef4444"/><text x="410" y="99" fill="%23fff" font-size="10" font-weight="bold" text-anchor="middle">W2</text><circle cx="480" cy="95" r="12" fill="%23eab308"/><text x="480" y="99" fill="%23fff" font-size="10" font-weight="bold" text-anchor="middle">U2</text><circle cx="550" cy="95" r="12" fill="%233b82f6"/><text x="550" y="99" fill="%23fff" font-size="10" font-weight="bold" text-anchor="middle">V2</text><line x1="410" y1="95" x2="410" y2="150" stroke="%23a855f7" stroke-width="6"/><line x1="480" y1="95" x2="480" y2="150" stroke="%23a855f7" stroke-width="6"/><line x1="550" y1="95" x2="550" y2="150" stroke="%23a855f7" stroke-width="6"/><circle cx="410" cy="150" r="12" fill="%23ef4444"/><text x="410" y="154" fill="%23fff" font-size="10" font-weight="bold" text-anchor="middle">U1</text><circle cx="480" cy="150" r="12" fill="%23eab308"/><text x="480" y="154" fill="%23fff" font-size="10" font-weight="bold" text-anchor="middle">V1</text><circle cx="550" cy="150" r="12" fill="%233b82f6"/><text x="550" y="154" fill="%23fff" font-size="10" font-weight="bold" text-anchor="middle">W1</text></svg>`;

export const INITIAL_BOOKS: BookItem[] = [
  {
    id: 'book-electrical-handbook',
    titleBn: 'ব্যবহারিক ইলেকট্রিক্যাল হ্যান্ডবুক ও ওয়্যারিং গাইড',
    titleEn: 'Practical Electrical Handbook & Wiring Guide',
    author: 'জুলফিকার হাসান (Zulfiqar Hasan)',
    category: 'ইলেকট্রিক্যাল ইঞ্জিনিয়ারিং',
    coverColor: 'from-blue-600 to-indigo-800',
    descriptionBn: 'বাসাবাড়ি ও ইন্ডাস্ট্রিয়াল ওয়্যারিং, লোড ক্যালকুলেশন, নিরাপদ আর্থিং ও ব্রেকার সিলেকশনের বাস্তবভিত্তিক গাইড।',
    descriptionEn: 'Comprehensive practical guide for residential and industrial wiring, load calculations, and earthing safety.',
    chapters: [
      {
        id: 'ch-1',
        titleBn: 'অধ্যায় ১: হাউজ ওয়্যারিং লোড ক্যালকুলেশন ও তারের হিসাব',
        titleEn: 'Chapter 1: House Wiring Load & Cable Selection',
        content: `### ১.১ লোড নির্ধারণের নিয়মাবলী:
বাসাবাড়ির ওয়্যারিং করার পূর্বে প্রতিটি কক্ষের কানেক্টেড লোড সঠিকভাবে নির্ণয় করা অত্যন্ত জরুরি।

**সাধারণ লোড পাওয়ার চার্ট:**
- সিলিং ফ্যান: ৮০ ওয়াট
- এলইডি লাইট: ১৫-২০ ওয়াট
- রেফ্রিজারেটর: ২০০-৩৫০ ওয়াট
- ১.৫ টন এসি (ইনভার্টার): ১৫০০-১৮০০ ওয়াট
- ওয়াটার পাম্প (১ HP): ৭৪৬ ওয়াট

### ১.২ সিঙ্গেল ফেজ হাউজ ওয়্যারিং সংযোগ ডায়াগ্রাম:

![বাসাবাড়ির সিঙ্গেল ফেজ প্রধান বিতরণ ডায়াগ্রাম](${HOUSE_WIRING_DIAGRAM})

### ১.৩ ক্যাবল সাইজিং নিয়ম:
- লাইট ও ফ্যান সার্কিট (সর্বোচ্চ ৮০০ ওয়াট): **১.৫ mm² (৩/২২)**
- সাধারণ পাওয়ার সকেট (কম্পিউটার, টিভি, ফ্রিজ): **২.৫ mm² (৭/২২)**
- এসি ও গিজার পয়েন্ট: **৪.০ mm² (৭/২০)**
- মেইন ডিস্ট্রিবিউশন ডিবি বোর্ড থেকে এসডিবি: **৬.০ mm² বা ১০.০ mm²**

> **টিপস:** কখনোই ফ্যান বা লাইট পয়েন্ট থেকে এসি বা হিটারের সংযোগ টানবেন না। প্রতি এয়ারকন্ডিশনারের জন্য আলাদা ডেডিকেটেড সার্কিট ব্রেকার ও আর্থিং ওয়্যার স্থাপন করুন।`,
      },
      {
        id: 'ch-2',
        titleBn: 'অধ্যায় ২: সার্কিট ব্রেকার ও আর্থিং নিরাপত্তা প্রটোকল',
        titleEn: 'Chapter 2: Circuit Breakers & Earthing Safety',
        content: `### ২.১ সার্কিট ব্রেকার (MCB & RCCB):
১. **MCB (Miniature Circuit Breaker):** শর্ট সার্কিট ও ওভারলোড থেকে তারকে রক্ষা করে।
২. **RCCB / ELCB (Earth Leakage Circuit Breaker):** কোনো ব্যক্তি বিদ্যুৎস্পৃষ্ট হলে বা কারেন্ট লিকেজ ৩০mA অতিক্রম করলে ০.০৩ সেকেন্ডে বিদ্যুৎ বিচ্ছিন্ন করে জীবন বাঁচায়।

### ২.২ সঠিক রেটিং নির্বাচন:
- লাইটিং লোড: **৬A বা ১০A Type-B/C MCB**
- সাধারণ পাওয়ার সকেট: **১৬A বা ২০A Type-C MCB**
- ১.৫ টন এসি: **২০A Type-C MCB**
- মেইন সুইচ: **৩২A বা ৪০A বা ৬৩A Double Pole MCB + RCCB**

### ২.৩ কার্যকর আর্থিং রেজিস্ট্যান্স:
- বাসাবাড়ির জন্য আর্থ রেজিস্ট্যান্স অবশ্যই **৫ ওহম (৫ Ω)** এর নিচে হতে হবে।
- সাব-স্টেশন বা জেনারেটরের জন্য **১ ওহম (১ Ω)** এর নিচে থাকা আদর্শ।
- শুকনো মাটিতে কাঠকয়লা ও খাবার লবণের মিশ্রণ ব্যবহার করে রেজিস্টিভিটি কমানো যায়।`,
      },
      {
        id: 'ch-3',
        titleBn: 'অধ্যায় ৩: ৩-ফেজ মোটর কানেকশন ও স্টার-ডেল্টা স্টার্টার',
        titleEn: 'Chapter 3: Three-Phase Motor Connections & Star-Delta',
        content: `### ৩.১ মোটর টার্মিনাল কানেকশন:
ইন্ডাকশন মোটরে ৬টি টার্মিনাল থাকে: **U1, V1, W1** এবং **U2, V2, W2**।

![৩-ফেজ ইন্ডাকশন মোটর স্টার ও ডেল্টা টার্মিনাল কানেকশন চিত্র](${MOTOR_WIRING_DIAGRAM})

**স্টার কানেকশন (Star / Y):**
- U2, V2, W2 শর্ট লিঙ্ক দিয়ে যুক্ত করতে হয়।
- U1, V1, W1 এ তিন ফেজ (R, Y, B) সংযোগ দিতে হয়।
- স্টার সংযোগে মোটরের স্টার্টিং কারেন্ট কম টানে (ডেল্টার ১/৩ অংশ)।

**ডেল্টা কানেকশন (Delta / Δ):**
- U1 এর সাথে W2, V1 এর সাথে U2, এবং W1 এর সাথে V2 সংযোগ করা হয়।
- মোটর সম্পূর্ণ শক্তি ও টর্ক উৎপন্ন করে।

### ৩.২ মোটর ফুল লোড কারেন্ট (FLA) বের করার সহজ থাম্বরুল:
- **৪০০V ৩-ফেজ মোটরে:** প্রতি ১ HP মোটরের ফুল লোড কারেন্ট আনুমানিক **১.৪ থেকে ১.৫ অ্যাম্পিয়ার** হয়।
- উদাহরণ: একটি ৫ HP মোটরের ফুল লোড কারেন্ট হবে প্রায় 5 × 1.45 = **7.25 Amperes**।`,
      },
    ],
    createdAt: Date.now() - 3600000,
    updatedAt: Date.now(),
  },
];

export function getStoredBooks(): BookItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_BOOKS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_BOOKS, JSON.stringify(INITIAL_BOOKS));
      return INITIAL_BOOKS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : INITIAL_BOOKS;
  } catch {
    return INITIAL_BOOKS;
  }
}

export function saveStoredBooks(books: BookItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_BOOKS, JSON.stringify(books));
  } catch (err) {
    console.error('Failed to save books', err);
  }
}

export function addOrUpdateBook(book: BookItem): void {
  const current = getStoredBooks();
  const index = current.findIndex((b) => b.id === book.id);
  if (index >= 0) {
    current[index] = { ...book, updatedAt: Date.now() };
    saveStoredBooks(current);
  } else {
    saveStoredBooks([{ ...book, createdAt: Date.now(), updatedAt: Date.now() }, ...current]);
  }
}

export function deleteBook(bookId: string): void {
  const current = getStoredBooks();
  const updated = current.filter((b) => b.id !== bookId);
  saveStoredBooks(updated);
}
