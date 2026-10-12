import React, { useState } from 'react';
import {
  Package,
  ArrowUpDown,
  Plus,
  Minus,
  AlertTriangle,
  History,
  CheckCircle,
  Search,
} from 'lucide-react';
import { ProductVariant, StockMovement, UserProfile } from '../../types';
import { storage } from '../../services/storage';
import { formatRupiah, formatDateTime } from '../../utils/formatters';

interface InventoryManagementProps {
  currentUser: UserProfile;
}

export const InventoryManagement: React.FC<InventoryManagementProps> = ({ currentUser }) => {
  const [activeSubTab, setActiveSubTab] = useState<'balance' | 'movements'>('balance');
  const [search, setSearch] = useState('');
  const [adjustModalVariant, setAdjustModalVariant] = useState<{ variant: ProductVariant; productName: string } | null>(null);
  const [adjustType, setAdjustType] = useState<'in' | 'out' | 'adjustment'>('in');
  const [adjustQty, setAdjustQty] = useState<number>(1);
  const [adjustNotes, setAdjustNotes] = useState<string>('Penerimaan stok tambahan toko');

  const products = storage.getProducts();
  const movements = storage.getStockMovements();

  // Flatten variants with product names
  const allStockList: { variant: ProductVariant; productName: string; brandName?: string }[] = [];
  products.forEach(p => {
    p.variants.forEach(v => {
      allStockList.push({
        variant: v,
        productName: p.name,
        brandName: p.brandName,
      });
    });
  });

  const filteredList = allStockList.filter(item => {
    const q = search.toLowerCase();
    return (
      item.productName.toLowerCase().includes(q) ||
      item.variant.sku.toLowerCase().includes(q) ||
      item.variant.barcode.includes(q)
    );
  });

  const handleExecuteAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustModalVariant) return;

    const delta = adjustType === 'out' ? -Math.abs(adjustQty) : Math.abs(adjustQty);
    const success = storage.adjustStock(adjustModalVariant.variant.id, delta, adjustType, adjustNotes);
    if (!success) {
      alert('Penyesuaian gagal! Periksa kembali kuantitas stok.');
      return;
    }

    setAdjustModalVariant(null);
    setAdjustQty(1);
  };

  const isCashier = currentUser.role === 'cashier';

  return (
    <div className="p-4 lg:p-6 space-y-5 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#223240] tracking-tight">
            Inventaris & Mutasi Stok Pakaian
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit saldo stok, pencatatan mutasi barang masuk/keluar, dan penyesuaian
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex bg-white p-1 rounded-xl border border-slate-200 self-start">
          <button
            onClick={() => setActiveSubTab('balance')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeSubTab === 'balance'
                ? 'bg-[#223240] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Saldo Stok Varian
          </button>
          <button
            onClick={() => setActiveSubTab('movements')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeSubTab === 'movements'
                ? 'bg-[#223240] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Riwayat Mutasi ({movements.length})
          </button>
        </div>
      </div>

      {activeSubTab === 'balance' ? (
        <div className="space-y-4">
          {/* Search bar */}
          <div className="p-3 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
            <div className="relative max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari varian pakaian, SKU, barcode..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none"
              />
            </div>
          </div>

          {/* Stock Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#223240] text-white uppercase text-[10px] tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Produk & Varian</th>
                  <th className="py-3 px-3">SKU / Barcode</th>
                  <th className="py-3 px-3">Ukuran & Warna</th>
                  <th className="py-3 px-3">Harga Jual</th>
                  <th className="py-3 px-3">Stok Saat Ini</th>
                  <th className="py-3 px-3">Status</th>
                  {!isCashier && <th className="py-3 px-3 text-right">Aksi</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredList.map((item) => {
                  const v = item.variant;
                  const isLow = v.stock <= v.minStockAlert;
                  return (
                    <tr key={v.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4">
                        <p className="font-bold text-slate-900">{item.productName}</p>
                        <p className="text-[10px] text-slate-500">{item.brandName}</p>
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-600">
                        <p>{v.sku}</p>
                        <p className="text-[10px] text-slate-400">{v.barcode}</p>
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-semibold text-slate-800">{v.sizeLabel}</span>
                        <span className="text-slate-500"> · {v.colorLabel}</span>
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-[#223240]">
                        {formatRupiah(v.sellingPrice)}
                      </td>
                      <td className="py-3 px-3 font-mono font-black text-sm">
                        <span className={v.stock <= 0 ? 'text-rose-600' : isLow ? 'text-amber-600' : 'text-emerald-700'}>
                          {v.stock} unit
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        {v.stock <= 0 ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                            Habis
                          </span>
                        ) : isLow ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                            Menipis
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            Aman
                          </span>
                        )}
                      </td>
                      {!isCashier && (
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() =>
                              setAdjustModalVariant({
                                variant: v,
                                productName: item.productName,
                              })
                            }
                            className="px-2.5 py-1 bg-slate-100 hover:bg-[#223240] hover:text-white rounded-md text-[11px] font-bold text-slate-700 transition"
                          >
                            Sesuaikan Stok
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Movements Log Tab */
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#223240] text-white uppercase text-[10px] tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Waktu & Ref</th>
                <th className="py-3 px-3">Produk & SKU</th>
                <th className="py-3 px-3">Tipe Mutasi</th>
                <th className="py-3 px-3">Perubahan</th>
                <th className="py-3 px-3">Saldo (Sebelum ➔ Sesudah)</th>
                <th className="py-3 px-3">Petugas & Catatan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {movements.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Belum ada riwayat mutasi stok tercatat
                  </td>
                </tr>
              ) : (
                movements.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900">{m.referenceNumber}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{formatDateTime(m.createdAt)}</p>
                    </td>
                    <td className="py-3 px-3">
                      <p className="font-semibold text-slate-800">{m.productName}</p>
                      <p className="text-[10px] text-slate-400 font-mono">SKU: {m.variantSku}</p>
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-bold uppercase font-mono">
                        {m.movementType}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-xs">
                      <span className={m.quantity > 0 ? 'text-emerald-600' : 'text-rose-600'}>
                        {m.quantity > 0 ? `+${m.quantity}` : m.quantity} pcs
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-600">
                      {m.previousQuantity} ➔ <span className="font-bold text-slate-900">{m.newQuantity}</span>
                    </td>
                    <td className="py-3 px-3 text-slate-600">
                      <p className="font-semibold text-slate-800">{m.performedBy}</p>
                      <p className="text-[11px] text-slate-500">{m.notes || '-'}</p>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL: Adjust Stock */}
      {adjustModalVariant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-5 space-y-4 animate-in fade-in zoom-in-95">
            <h3 className="font-bold text-sm text-[#223240] flex items-center gap-2">
              <ArrowUpDown className="w-4 h-4 text-[#E1A23D]" />
              <span>Penyesuaian Manual Stok Inventaris</span>
            </h3>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs leading-relaxed">
              <p className="font-bold text-slate-900">{adjustModalVariant.productName}</p>
              <p className="text-slate-500 font-mono mt-0.5">
                Varian: {adjustModalVariant.variant.sizeLabel} · {adjustModalVariant.variant.colorLabel} (Stok: {adjustModalVariant.variant.stock})
              </p>
            </div>

            <form onSubmit={handleExecuteAdjustment} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Jenis Mutasi</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustType('in')}
                    className={`p-2 rounded-lg border font-bold ${
                      adjustType === 'in' ? 'bg-[#223240] text-white' : 'bg-slate-50 text-slate-700'
                    }`}
                  >
                    Masuk (+)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustType('out')}
                    className={`p-2 rounded-lg border font-bold ${
                      adjustType === 'out' ? 'bg-[#223240] text-white' : 'bg-slate-50 text-slate-700'
                    }`}
                  >
                    Keluar (-)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustType('adjustment')}
                    className={`p-2 rounded-lg border font-bold ${
                      adjustType === 'adjustment' ? 'bg-[#223240] text-white' : 'bg-slate-50 text-slate-700'
                    }`}
                  >
                    Koreksi
                  </button>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Jumlah Unit</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(Number(e.target.value))}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Alasan Penyesuaian / Catatan</label>
                <input
                  type="text"
                  required
                  value={adjustNotes}
                  onChange={(e) => setAdjustNotes(e.target.value)}
                  placeholder="Misal: Rusak, sampel pajangan, hilang..."
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setAdjustModalVariant(null)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#223240] text-white font-bold rounded-lg shadow-sm"
                >
                  Konfirmasi Mutasi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
