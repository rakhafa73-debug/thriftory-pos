import React, { useState } from 'react';
import {
  Receipt,
  Search,
  Filter,
  Printer,
  RotateCcw,
  Eye,
  AlertCircle,
  CheckCircle,
  Download,
  WifiOff,
} from 'lucide-react';
import { Sale, UserProfile, Store } from '../../types';
import { storage } from '../../services/storage';
import { formatRupiah, formatDateTime, formatDate } from '../../utils/formatters';
import { ReceiptModal } from '../common/ReceiptModal';

interface TransactionHistoryProps {
  currentUser: UserProfile;
  store: Store;
}

export const TransactionHistory: React.FC<TransactionHistoryProps> = ({
  currentUser,
  store,
}) => {
  const [sales, setSales] = useState<Sale[]>(storage.getSales());
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');

  // Modal states
  const [reprintSale, setReprintSale] = useState<Sale | null>(null);
  const [detailSale, setDetailSale] = useState<Sale | null>(null);
  const [refundModalSale, setRefundModalSale] = useState<Sale | null>(null);
  const [refundReason, setRefundReason] = useState('Pelanggan meminta tukar model / cacat kain');

  const reload = () => {
    setSales(storage.getSales());
  };

  const handleRefund = (e: React.FormEvent) => {
    e.preventDefault();
    if (!refundModalSale) return;

    const res = storage.refundSale(refundModalSale.id, refundReason);
    if (!res.success) {
      alert(res.error || 'Refund gagal');
      return;
    }

    alert(`Transaksi #${refundModalSale.invoiceNumber} berhasil direfund. Stok pakaian telah dikembalikan ke inventaris.`);
    setRefundModalSale(null);
    reload();
  };

  const filteredSales = sales.filter((s) => {
    const q = search.toLowerCase();
    const matchSearch =
      s.invoiceNumber.toLowerCase().includes(q) ||
      s.cashierName.toLowerCase().includes(q) ||
      (s.customerName && s.customerName.toLowerCase().includes(q));
    const matchStatus = statusFilter === 'all' || s.transactionStatus === statusFilter;
    const matchMethod = methodFilter === 'all' || s.paymentMethod === methodFilter;
    return matchSearch && matchStatus && matchMethod;
  });

  const handleExportCSV = () => {
    const headers = ['No. Invoice', 'Waktu', 'Kasir', 'Pelanggan', 'Metode Bayar', 'Total Belanja', 'Status', 'Origin', 'Idempotency Key'];
    const rows = [headers.join(',')];
    sales.forEach((s) => {
      rows.push(
        [
          `"${s.invoiceNumber}"`,
          `"${formatDateTime(s.createdAt)}"`,
          `"${s.cashierName}"`,
          `"${s.customerName || 'Umum'}"`,
          `"${s.paymentMethod}"`,
          s.totalAmount,
          `"${s.transactionStatus}"`,
          `"${s.origin}"`,
          `"${s.idempotencyKey}"`,
        ].join(',')
      );
    });

    const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `transaksi_thriftory_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isCashier = currentUser.role === 'cashier';

  return (
    <div className="p-4 lg:p-6 space-y-5 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#223240] tracking-tight">
            Riwayat Transaksi Penjualan
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Daftar lengkap invoice, cetak ulang struk kasir, retur barang, dan pembatalan transaksi
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold shadow-2xs transition self-start"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Ekspor CSV Transaksi</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari invoice, kasir, atau pelanggan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="p-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none"
          >
            <option value="all">Semua Status Transaksi</option>
            <option value="completed">Selesai (Completed)</option>
            <option value="refunded">Direfund (Refunded)</option>
          </select>

          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="p-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none"
          >
            <option value="all">Semua Metode Pembayaran</option>
            <option value="cash">Tunai</option>
            <option value="qris">QRIS</option>
            <option value="bank_transfer">Transfer Bank</option>
          </select>
        </div>
      </div>

      {/* Sales Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#223240] text-white uppercase text-[10px] tracking-wider font-semibold">
            <tr>
              <th className="py-3 px-4">No. Invoice & Waktu</th>
              <th className="py-3 px-3">Kasir & Pelanggan</th>
              <th className="py-3 px-3">Item Terjual</th>
              <th className="py-3 px-3">Metode Bayar</th>
              <th className="py-3 px-3">Total Nominal</th>
              <th className="py-3 px-3">Status & Sync</th>
              <th className="py-3 px-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredSales.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-400">
                  Tidak ada transaksi yang cocok
                </td>
              </tr>
            ) : (
              filteredSales.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-4">
                    <p className="font-bold text-slate-900 font-mono">{s.invoiceNumber}</p>
                    <p className="text-[10px] text-slate-400">{formatDateTime(s.createdAt)}</p>
                  </td>
                  <td className="py-3 px-3">
                    <p className="font-semibold text-slate-800">{s.cashierName}</p>
                    <p className="text-[10px] text-slate-500">{s.customerName || 'Pelanggan Umum'}</p>
                  </td>
                  <td className="py-3 px-3">
                    <p className="font-mono text-slate-700">{s.items.length} item pakaian</p>
                    <p className="text-[10px] text-slate-400 line-clamp-1">
                      {s.items.map((i) => i.productNameSnapshot).join(', ')}
                    </p>
                  </td>
                  <td className="py-3 px-3">
                    <span className="font-mono uppercase font-bold text-slate-700">
                      {s.paymentMethod.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono font-bold text-slate-900 tabular-nums">
                    {formatRupiah(s.totalAmount)}
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          s.transactionStatus === 'refunded'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {s.transactionStatus}
                      </span>
                      {s.origin === 'offline' && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-800">
                          Offline
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {/* Detail View */}
                      <button
                        onClick={() => setDetailSale(s)}
                        title="Lihat Detail Transaksi"
                        className="p-1.5 text-slate-500 hover:text-[#223240] hover:bg-slate-100 rounded"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {/* Reprint Struk */}
                      <button
                        onClick={() => setReprintSale(s)}
                        title="Cetak Ulang Struk Kasir"
                        className="p-1.5 text-slate-500 hover:text-[#223240] hover:bg-slate-100 rounded"
                      >
                        <Printer className="w-4 h-4 text-[#E1A23D]" />
                      </button>

                      {/* Refund (Check permission) */}
                      {s.transactionStatus !== 'refunded' && (
                        <button
                          onClick={() => {
                            if (isCashier && !currentUser.canRefund) {
                              alert('Akses Ditolak: Kasir tidak memiliki wewenang untuk melakukan refund tanpa persetujuan Admin Toko atau Owner.');
                              return;
                            }
                            setRefundModalSale(s);
                          }}
                          title="Proses Refund / Retur Barang"
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* DETAIL MODAL */}
      {detailSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-5 space-y-4 text-xs animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-sm text-[#223240]">Detail Invoice #{detailSale.invoiceNumber}</h3>
                <p className="text-slate-400 font-mono mt-0.5">{formatDateTime(detailSale.createdAt)}</p>
              </div>
              <button onClick={() => setDetailSale(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl space-y-1">
              <p><span className="text-slate-500">Kasir:</span> <strong>{detailSale.cashierName}</strong></p>
              <p><span className="text-slate-500">Pelanggan:</span> <strong>{detailSale.customerName || 'Umum'}</strong></p>
              <p><span className="text-slate-500">Metode Bayar:</span> <strong className="uppercase">{detailSale.paymentMethod}</strong></p>
              <p><span className="text-slate-500">Idempotency Key:</span> <code className="text-[10px] text-slate-700">{detailSale.idempotencyKey}</code></p>
            </div>

            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              <p className="font-bold text-slate-800">Daftar Item Pakaian:</p>
              {detailSale.items.map((item, idx) => (
                <div key={idx} className="p-2 border border-slate-200 rounded-lg flex justify-between items-center">
                  <div>
                    <p className="font-bold">{item.productNameSnapshot}</p>
                    <p className="text-[10px] text-slate-500">{item.sizeSnapshot} · {item.colorSnapshot} (SKU: {item.skuSnapshot})</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold font-mono">{formatRupiah(item.lineTotal)}</p>
                    <p className="text-[10px] text-slate-400">{item.quantity} x {formatRupiah(item.unitPrice)}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-between items-center font-bold text-sm">
              <span>Total Pembayaran:</span>
              <span className="text-[#223240]">{formatRupiah(detailSale.totalAmount)}</span>
            </div>

            <button
              onClick={() => setDetailSale(null)}
              className="w-full py-2 bg-[#223240] text-white font-bold rounded-lg"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* REFUND MODAL */}
      {refundModalSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-5 space-y-4 text-xs animate-in fade-in zoom-in-95">
            <h3 className="font-bold text-sm text-rose-700 flex items-center gap-2">
              <RotateCcw className="w-4 h-4" />
              <span>Otorisasi Refund & Pengembalian Barang</span>
            </h3>

            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-1">
              <p className="font-bold text-rose-900">Invoice: #{refundModalSale.invoiceNumber}</p>
              <p className="text-rose-700">Nominal yang akan dikembalikan: <strong>{formatRupiah(refundModalSale.totalAmount)}</strong></p>
              <p className="text-[11px] text-rose-600">
                Peringatan: Seluruh {refundModalSale.items.length} item pakaian akan otomatis direstock ke saldo inventaris.
              </p>
            </div>

            <form onSubmit={handleRefund} className="space-y-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Alasan Pengembalian / Refund</label>
                <textarea
                  rows={3}
                  required
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setRefundModalSale(null)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg shadow-sm"
                >
                  Eksekusi Refund Transaksi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REPRINT RECEIPT MODAL */}
      {reprintSale && (
        <ReceiptModal
          isOpen={!!reprintSale}
          onClose={() => setReprintSale(null)}
          sale={reprintSale}
          store={store}
        />
      )}
    </div>
  );
};
