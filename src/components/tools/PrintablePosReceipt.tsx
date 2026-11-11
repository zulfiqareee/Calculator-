import React, { useRef, useState } from 'react';
import { Printer, Share2, Download, Check, Copy, QrCode, Sparkles, X } from 'lucide-react';
import { Transaction, ShopProfile, Customer, toBn, formatMoney } from './TallyKhataView';
import { tallySounds } from '../../utils/tallyAudioVoice';

interface PrintablePosReceiptProps {
  transaction: Transaction;
  shop: ShopProfile;
  customer?: Customer;
  onClose: () => void;
}

/**
 * Pure SVG Barcode Generator based on alphanumeric string
 */
export const SvgBarcode: React.FC<{ value: string; height?: number }> = ({ value, height = 36 }) => {
  // Generate deterministic bar widths based on char codes
  const bars = [];
  const chars = value.split('');
  let currentX = 0;

  // Start guard
  bars.push(<rect key="start-1" x={currentX} y="0" width="2" height={height} fill="#0f172a" />);
  currentX += 3;
  bars.push(<rect key="start-2" x={currentX} y="0" width="1" height={height} fill="#0f172a" />);
  currentX += 3;

  for (let i = 0; i < chars.length; i++) {
    const code = chars[i].charCodeAt(0);
    const w1 = (code % 3) + 1;
    const w2 = ((code >> 1) % 2) + 1;
    const w3 = ((code >> 2) % 3) + 1;

    bars.push(<rect key={`bar-${i}-1`} x={currentX} y="0" width={w1} height={height} fill="#0f172a" />);
    currentX += w1 + 1;
    bars.push(<rect key={`bar-${i}-2`} x={currentX} y="0" width={w2} height={height} fill="#0f172a" />);
    currentX += w2 + 2;
    bars.push(<rect key={`bar-${i}-3`} x={currentX} y="0" width={w3} height={height} fill="#0f172a" />);
    currentX += w3 + 1;
  }

  // End guard
  bars.push(<rect key="end-1" x={currentX} y="0" width="2" height={height} fill="#0f172a" />);
  currentX += 3;
  bars.push(<rect key="end-2" x={currentX} y="0" width="1" height={height} fill="#0f172a" />);
  currentX += 4;

  return (
    <div className="flex flex-col items-center">
      <svg
        width={Math.min(260, currentX)}
        height={height}
        viewBox={`0 0 ${currentX} ${height}`}
        className="overflow-visible"
      >
        {bars}
      </svg>
      <span className="text-[10px] tracking-widest font-mono text-slate-700 mt-1 font-bold">
        *{value}*
      </span>
    </div>
  );
};

export const PrintablePosReceipt: React.FC<PrintablePosReceiptProps> = ({
  transaction,
  shop,
  customer,
  onClose,
}) => {
  const receiptRef = useRef<HTMLDivElement>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const handlePrint = () => {
    tallySounds.playClickSound();
    window.print();
  };

  const handleShare = async () => {
    tallySounds.playClickSound();
    const typeLabel =
      transaction.type === 'sale_cash'
        ? 'নগদ ক্যাশ মেমো'
        : transaction.type === 'sale_due'
        ? 'বাকি ভাউচার'
        : transaction.type === 'due_collection'
        ? 'টাকা জমা রশিদ'
        : 'খরচ ভাউচার';

    const shareText = `🧾 ${shop.name} - ${typeLabel}
ভাউচার নং: ${transaction.voucherNo}
তারিখ: ${transaction.date} (${transaction.time})
গ্রাহক: ${transaction.customerName || 'সাধারণ ক্রেতা'}
টাকার পরিমাণ: ${shop.currency} ${toBn(transaction.amount)}
${transaction.currentDue !== undefined ? `মোট বকেয়া স্থিতি: ${shop.currency} ${toBn(transaction.currentDue)}` : ''}
দোকান যোগাযোগ: ${shop.phone}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${shop.name} - ${transaction.voucherNo}`,
          text: shareText,
        });
      } catch (err) {
        console.log('Share dismissed');
      }
    } else {
      navigator.clipboard.writeText(shareText);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const typeConfig = {
    sale_cash: { label: 'নগদ ক্যাশ মেমো (CASH MEMO)', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-300' },
    sale_due: { label: 'বাকি ভাউচার (CREDIT VOUCHER)', color: 'text-red-700', bg: 'bg-red-50 border-red-300' },
    due_collection: { label: 'বকেয়া জমা রশিদ (RECEIPT)', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-300' },
    expense: { label: 'দোকান খরচ ভাউচার (EXPENSE)', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-300' },
    supplier_payment: { label: 'মহাজন পরিশোধ (PAYMENT)', color: 'text-purple-700', bg: 'bg-purple-50 border-purple-300' },
    purchase: { label: 'ক্রয় রশিদ (PURCHASE)', color: 'text-indigo-700', bg: 'bg-indigo-50 border-indigo-300' },
  }[transaction.type] || { label: 'হিসাব ভাউচার', color: 'text-slate-700', bg: 'bg-slate-50 border-slate-300' };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
      <div className="w-full max-w-md max-h-[95vh] overflow-y-auto bg-white text-slate-900 rounded-3xl p-4 sm:p-5 shadow-2xl flex flex-col gap-3">
        {/* Modal Top Header Actions */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase text-slate-700 tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              অফিসিয়াল ডিজিটাল মেমো
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleShare}
              className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'কপি হয়েছে' : 'শেয়ার'}</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-3 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>প্রিন্ট</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-800 cursor-pointer ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ================= Printable POS Slip Area ================= */}
        <div
          ref={receiptRef}
          id="official-pos-voucher-sheet"
          className="p-5 bg-white border border-slate-300 rounded-2xl shadow-xs text-slate-900 font-sans flex flex-col gap-3"
        >
          {/* Shop Header */}
          <div className="text-center pb-2 border-b-2 border-dashed border-slate-300">
            <h2 className="text-xl font-black tracking-tight text-slate-950 uppercase">{shop.name}</h2>
            {shop.proprietor && (
              <p className="text-[11px] font-semibold text-slate-700 mt-0.5">স্বত্বাধিকারী: {shop.proprietor}</p>
            )}
            <p className="text-[11px] text-slate-600">{shop.address}</p>
            <p className="text-[11px] font-bold text-slate-800">মোবাইল: {shop.phone}</p>
            <div className={`mt-2 inline-block px-3 py-0.5 rounded-full border text-[10px] font-black tracking-wider uppercase ${typeConfig.bg} ${typeConfig.color}`}>
              {typeConfig.label}
            </div>
          </div>

          {/* Barcode & Voucher Meta */}
          <div className="flex flex-col items-center justify-center pt-1 pb-2 border-b border-dashed border-slate-200">
            <SvgBarcode value={transaction.voucherNo} height={32} />
          </div>

          {/* Invoice Info Details */}
          <div className="grid grid-cols-2 gap-2 text-[11px] py-1 border-b border-dashed border-slate-200">
            <div>
              <span className="text-slate-500 block">ভাউচার নম্বর:</span>
              <span className="font-mono font-bold text-slate-900">{transaction.voucherNo}</span>
            </div>
            <div className="text-right">
              <span className="text-slate-500 block">তারিখ ও সময়:</span>
              <span className="font-bold text-slate-900">
                {toBn(transaction.date)} | {toBn(transaction.time)}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">গ্রাহকের নাম:</span>
              <span className="font-bold text-slate-900">
                {transaction.customerName || customer?.name || 'নগদ ক্রেতা'}
              </span>
            </div>
            <div className="text-right">
              <span className="text-slate-500 block">মোবাইল:</span>
              <span className="font-bold text-slate-900">
                {transaction.customerPhone || customer?.phone || '—'}
              </span>
            </div>
          </div>

          {/* Itemized Table if available */}
          {transaction.items && transaction.items.length > 0 ? (
            <div className="py-1">
              <table className="w-full text-[11px] border-collapse">
                <thead>
                  <tr className="border-b border-slate-300 text-slate-600">
                    <th className="text-left py-1 font-bold">বিবরণ / পণ্য</th>
                    <th className="text-center py-1 font-bold">পরিমাণ</th>
                    <th className="text-right py-1 font-bold">দর</th>
                    <th className="text-right py-1 font-bold">মোট</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {transaction.items.map((item, idx) => (
                    <tr key={item.id || idx}>
                      <td className="py-1 text-slate-800 font-medium">{item.name}</td>
                      <td className="py-1 text-center font-bold">{toBn(item.quantity)}</td>
                      <td className="py-1 text-right text-slate-600">{toBn(item.unitPrice)}</td>
                      <td className="py-1 text-right font-black text-slate-900">{toBn(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : transaction.note ? (
            <div className="p-2 rounded-xl bg-slate-50 text-[11px] text-slate-700">
              <span className="font-bold text-slate-500 block mb-0.5">মন্তব্য / বিবরণ:</span>
              {transaction.note}
            </div>
          ) : null}

          {/* Financial Calculation Breakdown */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs flex flex-col gap-1.5">
            <div className="flex items-center justify-between font-bold text-slate-600">
              <span>লেনদেনের পরিমাণ:</span>
              <span className="font-black text-slate-900">
                {shop.currency} {formatMoney(transaction.amount)}
              </span>
            </div>

            {transaction.previousDue !== undefined && (
              <div className="flex items-center justify-between text-slate-500 text-[11px]">
                <span>পূর্বের বকেয়া বাকি:</span>
                <span>{shop.currency} {formatMoney(transaction.previousDue)}</span>
              </div>
            )}

            {transaction.currentDue !== undefined && (
              <div className="pt-1.5 mt-0.5 border-t border-dashed border-slate-300 flex items-center justify-between font-black text-sm text-slate-900">
                <span>সর্বমোট বকেয়া বাকি:</span>
                <span className={transaction.currentDue > 0 ? 'text-red-600' : 'text-emerald-600'}>
                  {shop.currency} {formatMoney(transaction.currentDue)}
                </span>
              </div>
            )}
          </div>

          {/* Digital Payment QR Stamp on Receipt */}
          {(shop.bkashNumber || shop.nagadNumber) && (
            <div className="p-2.5 rounded-xl border border-dashed border-slate-300 bg-slate-50/50 flex items-center justify-between gap-2 text-[10px]">
              <div>
                <span className="font-bold text-slate-900 block flex items-center gap-1">
                  <QrCode className="w-3.5 h-3.5 text-pink-600" />
                  ডিজিটাল পেমেন্ট করুন
                </span>
                <span className="text-slate-500">
                  {shop.bkashNumber ? `বিকাশ: ${shop.bkashNumber}` : ''}
                  {shop.nagadNumber ? ` | নগদ: ${shop.nagadNumber}` : ''}
                </span>
              </div>
              <div className="px-2 py-1 rounded-md bg-white border border-slate-200 font-mono font-bold text-slate-700">
                {transaction.voucherNo}
              </div>
            </div>
          )}

          {/* Footer Seal & Message */}
          <div className="pt-2 border-t-2 border-dashed border-slate-300 text-center flex flex-col items-center gap-1">
            <p className="text-[10px] text-slate-500 italic">
              "আমাদের সাথে থাকার জন্য ধন্যবাদ। আবার আসবেন!"
            </p>
            <div className="w-full flex items-center justify-between pt-4 text-[9px] text-slate-400">
              <span>ক্রেতার স্বাক্ষর</span>
              <span>কর্তৃপক্ষের সিল ও স্বাক্ষর</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
