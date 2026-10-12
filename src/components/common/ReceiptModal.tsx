import React, { useState } from 'react';
import { Printer, Download, X, CheckCircle2, WifiOff } from 'lucide-react';
import { Sale, Store } from '../../types';
import { formatRupiah, formatDateTime } from '../../utils/formatters';

interface ReceiptModalProps {
  sale: Sale;
  store: Store;
  isOpen: boolean;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  sale,
  store,
  isOpen,
  onClose,
}) => {
  const [paperWidth, setPaperWidth] = useState<'58mm' | '80mm'>('80mm');

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'cash':
        return 'TUNAI (CASH)';
      case 'qris':
        return 'QRIS STATIS/DINAMIS';
      case 'bank_transfer':
        return 'TRANSFER BANK';
      case 'debit_card':
        return 'KARTU DEBIT';
      case 'credit_card':
        return 'KARTU KREDIT';
      default:
        return method.toUpperCase();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95">
        {/* Header Dialog Controls */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-[#223240] text-white border-b border-slate-700">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-bold tracking-tight">Struk Transaksi Selesai</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/10 text-slate-300 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Paper Format Selector */}
        <div className="flex items-center justify-between px-5 py-2.5 bg-[#FDFBF7] border-b border-slate-200 text-xs">
          <span className="text-slate-600 font-medium">Ukuran Kertas Thermal:</span>
          <div className="flex items-center gap-1 bg-slate-200 p-0.5 rounded-lg">
            <button
              onClick={() => setPaperWidth('58mm')}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition ${
                paperWidth === '58mm'
                  ? 'bg-white text-[#223240] shadow-xs'
                  : 'text-slate-600 hover:text-[#223240]'
              }`}
            >
              58 mm
            </button>
            <button
              onClick={() => setPaperWidth('80mm')}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition ${
                paperWidth === '80mm'
                  ? 'bg-white text-[#223240] shadow-xs'
                  : 'text-slate-600 hover:text-[#223240]'
              }`}
            >
              80 mm
            </button>
          </div>
        </div>

        {/* Receipt Paper Simulation */}
        <div className="p-4 bg-slate-100 max-h-[60vh] overflow-y-auto flex justify-center">
          <div
            id="thermal-receipt"
            className={`bg-white p-5 shadow-sm border border-slate-200 font-mono text-xs text-slate-900 transition-all ${
              paperWidth === '58mm' ? 'w-[280px]' : 'w-[360px]'
            }`}
            style={{ fontSize: paperWidth === '58mm' ? '11px' : '12px' }}
          >
            {/* Header Struk */}
            <div className="text-center pb-3 border-b border-dashed border-slate-400 space-y-1">
              <p className="font-bold text-sm tracking-wider uppercase font-sans">
                {store.name}
              </p>
              <p className="text-[11px] text-slate-600 leading-tight">
                {store.address}
              </p>
              <p className="text-[11px] text-slate-600">Telp: {store.phone}</p>
            </div>

            {/* Offline Status Warning */}
            {sale.origin === 'offline' && (
              <div className="my-2 p-1.5 bg-rose-50 border border-rose-300 text-rose-700 text-[10px] text-center font-bold rounded">
                [STRUK OFFLINE — PENDING SYNC CLOUD]
              </div>
            )}

            {/* Info Transaksi */}
            <div className="py-2.5 border-b border-dashed border-slate-400 space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span>No. Invoice:</span>
                <span className="font-bold">{sale.invoiceNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>Waktu:</span>
                <span>{formatDateTime(sale.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span>Kasir:</span>
                <span>{sale.cashierName}</span>
              </div>
              {sale.customerName && (
                <div className="flex justify-between">
                  <span>Pelanggan:</span>
                  <span>{sale.customerName}</span>
                </div>
              )}
            </div>

            {/* Daftar Barang */}
            <div className="py-3 border-b border-dashed border-slate-400 space-y-2">
              {sale.items.map((item, idx) => (
                <div key={idx} className="space-y-0.5">
                  <div className="font-semibold leading-snug">
                    {item.productNameSnapshot}
                  </div>
                  <div className="text-[10px] text-slate-600 flex justify-between">
                    <span>
                      {item.sizeSnapshot} / {item.colorSnapshot}
                      {item.conditionGradeSnapshot && ` (${item.conditionGradeSnapshot.toUpperCase()})`}
                    </span>
                    <span className="font-mono text-slate-500">SKU: {item.skuSnapshot}</span>
                  </div>
                  <div className="flex justify-between items-center text-[11px]">
                    <span>
                      {item.quantity} x {formatRupiah(item.unitPrice)}
                    </span>
                    <span className="font-bold tabular-nums">
                      {formatRupiah(item.lineTotal)}
                    </span>
                  </div>
                  {item.discountAmount > 0 && (
                    <div className="text-[10px] text-rose-600 flex justify-between">
                      <span>Diskon item:</span>
                      <span>-{formatRupiah(item.discountAmount)}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Summary & Totals */}
            <div className="py-2.5 border-b border-dashed border-slate-400 space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="tabular-nums">{formatRupiah(sale.subtotal)}</span>
              </div>
              {sale.discountAmount > 0 && (
                <div className="flex justify-between text-rose-600">
                  <span>Total Diskon:</span>
                  <span className="tabular-nums">-{formatRupiah(sale.discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-sm pt-1 border-t border-slate-300">
                <span>TOTAL AKHIR:</span>
                <span className="tabular-nums">{formatRupiah(sale.totalAmount)}</span>
              </div>
            </div>

            {/* Pembayaran & Kembalian */}
            <div className="py-2.5 border-b border-dashed border-slate-400 space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span>Metode Bayar:</span>
                <span className="font-bold">{getPaymentMethodLabel(sale.paymentMethod)}</span>
              </div>
              <div className="flex justify-between">
                <span>Uang Diterima:</span>
                <span className="tabular-nums">{formatRupiah(sale.amountReceived)}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>Kembalian:</span>
                <span className="tabular-nums">{formatRupiah(sale.changeGiven)}</span>
              </div>
            </div>

            {/* Footer Struk */}
            <div className="pt-3 text-center text-[10px] text-slate-600 space-y-1">
              <p className="font-medium">{store.receiptFooter}</p>
              <p className="text-[9px] text-slate-400">
                Idemp: {sale.idempotencyKey.slice(0, 16)}...
              </p>
            </div>
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 border border-slate-300 rounded-lg hover:bg-slate-50 transition"
          >
            Tutup Dialog
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#223240] hover:bg-[#1a2732] rounded-lg transition shadow-sm"
            >
              <Printer className="w-4 h-4 text-[#E1A23D]" />
              <span>Cetak Struk Thermal</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
