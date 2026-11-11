// UTF-8 BOM CSV Excel Export Utility for SmartHub Tally Khata
import { Customer, Transaction, ShopProfile, toBn } from '../components/tools/TallyKhataView';

function downloadCsv(content: string, fileName: string): void {
  // \uFEFF ensures Bengali Unicode renders correctly in Microsoft Excel & Google Sheets
  const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Export Customer Ledger to Excel (.csv)
export function exportCustomersToExcel(customers: Customer[], shop: ShopProfile): void {
  const headers = ['কাস্টমার নাম', 'মোবাইল', 'ধরন', 'বাকি হিসাব (টাকা)', 'অবস্থা', 'ঠিকানা'];
  const rows = customers.map((c) => {
    const status = c.balance > 0 ? 'বাকি পাবো' : c.balance < 0 ? 'দেনা দেবো' : 'পরিশোধ';
    const type = c.type === 'customer' ? 'কাস্টমার' : 'সাপ্লায়ার';
    return [
      `"${c.name.replace(/"/g, '""')}"`,
      `"${c.phone}"`,
      `"${type}"`,
      `"${Math.abs(c.balance)}"`,
      `"${status}"`,
      `"${(c.address || '').replace(/"/g, '""')}"`,
    ];
  });

  const csvContent = [
    `"${shop.name} - গ্রাহক ও খাতা রিপোর্ট"`,
    `"তারিখ: ${new Date().toLocaleDateString('bn-BD')}"`,
    '',
    headers.join(','),
    ...rows.map((r) => r.join(',')),
  ].join('\n');

  const fileName = `tally_customers_${Date.now()}.csv`;
  downloadCsv(csvContent, fileName);
}

// Export Transactions to Excel (.csv)
export function exportTransactionsToExcel(transactions: Transaction[], shop: ShopProfile): void {
  const headers = ['তারিখ', 'সময়', 'ভাউচার নং', 'গ্রাহক / বিবরণ', 'লেনদেনের ধরন', 'টাকা'];
  const rows = transactions.map((t) => {
    let typeLabel = 'নগদ বিক্রি';
    if (t.type === 'sale_due') typeLabel = 'বাকি বিক্রি (দিলাম)';
    else if (t.type === 'due_collection') typeLabel = 'বাকি আদায় (পেলাম)';
    else if (t.type === 'expense') typeLabel = 'খরচ';
    else if (t.type === 'supplier_payment') typeLabel = 'মহাজন পরিশোধ';

    return [
      `"${t.date}"`,
      `"${t.time}"`,
      `"${t.voucherNo}"`,
      `"${(t.customerName || t.note || t.category || '').replace(/"/g, '""')}"`,
      `"${typeLabel}"`,
      `"${t.amount}"`,
    ];
  });

  const csvContent = [
    `"${shop.name} - দৈনিক ও সর্বমোট লেনদেন রিপোর্ট"`,
    `"তারিখ: ${new Date().toLocaleDateString('bn-BD')}"`,
    '',
    headers.join(','),
    ...rows.map((r) => r.join(',')),
  ].join('\n');

  const fileName = `tally_transactions_${Date.now()}.csv`;
  downloadCsv(csvContent, fileName);
}

// Export Stock Inventory to Excel (.csv)
export function exportStockToExcel(
  products: {
    id: string;
    name: string;
    buyPrice: number;
    sellPrice: number;
    stock: number;
    unit: string;
    minStock: number;
  }[],
  shop: ShopProfile
): void {
  const headers = [
    'পণ্যের নাম',
    'একক',
    'বর্তমান স্টক',
    'ক্রয়মূল্য (টাকা)',
    'বিক্রয়মূল্য (টাকা)',
    'স্টক মোট ক্রয়মূল্য',
    'স্টক মোট বিক্রয়মূল্য',
    'অবস্থা',
  ];
  const rows = products.map((p) => {
    const isLow = p.stock <= p.minStock;
    const status = isLow ? 'স্টক শেষ পর্যায়ে' : 'পর্যাপ্ত স্টক';
    const totalBuy = p.buyPrice * p.stock;
    const totalSell = p.sellPrice * p.stock;
    return [
      `"${p.name.replace(/"/g, '""')}"`,
      `"${p.unit}"`,
      `"${p.stock}"`,
      `"${p.buyPrice}"`,
      `"${p.sellPrice}"`,
      `"${totalBuy}"`,
      `"${totalSell}"`,
      `"${status}"`,
    ];
  });

  const csvContent = [
    `"${shop.name} - পণ্য ইনভেন্টরি ও স্টক রিপোর্ট"`,
    `"তারিখ: ${new Date().toLocaleDateString('bn-BD')}"`,
    '',
    headers.join(','),
    ...rows.map((r) => r.join(',')),
  ].join('\n');

  const fileName = `tally_stock_${Date.now()}.csv`;
  downloadCsv(csvContent, fileName);
}
