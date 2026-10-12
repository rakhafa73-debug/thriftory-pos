import React, { useState } from 'react';
import {
  ClipboardCheck,
  Search,
  CheckCircle,
  AlertTriangle,
  History,
  Save,
  Plus,
} from 'lucide-react';
import { StockOpname, StockOpnameItem, UserProfile } from '../../types';
import { storage } from '../../services/storage';
import { formatRupiah, formatDateTime } from '../../utils/formatters';

interface StockOpnameProps {
  currentUser: UserProfile;
}

export const StockOpnameView: React.FC<StockOpnameProps> = ({ currentUser }) => {
  const [activeTab, setActiveTab] = useState<'create' | 'history'>('create');
  const products = storage.getProducts();
  const pastOpnames = storage.getStockOpnames();

  // Opname session items state
  const [counts, setCounts] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    products.forEach((p) => {
      p.variants.forEach((v) => {
        initial[v.id] = v.stock; // Default physical equals system
      });
    });
    return initial;
  });

  const [notes, setNotes] = useState('Stok opname rutin mingguan fisik rak toko');
  const [search, setSearch] = useState('');

  // Calculate items with differences
  const allVariantsList: {
    variantId: string;
    productName: string;
    sku: string;
    sizeLabel: string;
    colorLabel: string;
    systemStock: number;
    costPrice: number;
  }[] = [];

  products.forEach((p) => {
    p.variants.forEach((v) => {
      allVariantsList.push({
        variantId: v.id,
        productName: p.name,
        sku: v.sku,
        sizeLabel: v.sizeLabel,
        colorLabel: v.colorLabel,
        systemStock: v.stock,
        costPrice: v.costPrice,
      });
    });
  });

  const filteredItems = allVariantsList.filter(
    (item) =>
      item.productName.toLowerCase().includes(search.toLowerCase()) ||
      item.sku.toLowerCase().includes(search.toLowerCase())
  );

  const handlePhysicalChange = (variantId: string, val: number) => {
    setCounts((prev) => ({
      ...prev,
      [variantId]: Math.max(0, val),
    }));
  };

  // Summary calculations
  let totalDiscrepancyQty = 0;
  let totalDiscrepancyValue = 0;
  const opnameItems: StockOpnameItem[] = allVariantsList.map((item) => {
    const physical = counts[item.variantId] !== undefined ? counts[item.variantId] : item.systemStock;
    const variance = physical - item.systemStock;
    const varianceValue = variance * item.costPrice;

    if (variance !== 0) {
      totalDiscrepancyQty += Math.abs(variance);
      totalDiscrepancyValue += varianceValue;
    }

    return {
      variantId: item.variantId,
      sku: item.sku,
      productName: item.productName,
      sizeLabel: item.sizeLabel,
      colorLabel: item.colorLabel,
      systemQuantity: item.systemStock,
      physicalQuantity: physical,
      variance,
      unitCost: item.costPrice,
      varianceValue,
    };
  });

  const handleSaveOpname = () => {
    if (window.confirm('Simpan hasil Stok Opname? Seluruh saldo stok sistem akan disesuaikan dengan hasil fisik secara atomik.')) {
      const opnameRecord: StockOpname = {
        id: `opn_${Date.now()}`,
        opnameNumber: `OPN-${new Date().toISOString().slice(2, 10).replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`,
        conductedBy: currentUser.fullName,
        status: 'completed',
        notes,
        totalItemsChecked: allVariantsList.length,
        totalDiscrepancyQty,
        totalDiscrepancyValue,
        createdAt: new Date().toISOString(),
        items: opnameItems,
      };

      storage.saveStockOpname(opnameRecord);
      alert('Stok Opname berhasil disimpan dan saldo stok telah diselaraskan!');
      setActiveTab('history');
    }
  };

  return (
    <div className="p-4 lg:p-6 space-y-5 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#223240] tracking-tight">
            Stok Opname Fisik Pakaian
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Pencocokan stok fisik rak toko dengan database sistem dan perhitungan selisih nilai
          </p>
        </div>

        <div className="flex bg-white p-1 rounded-xl border border-slate-200 self-start">
          <button
            onClick={() => setActiveTab('create')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'create'
                ? 'bg-[#223240] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Form Perhitungan Fisik
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'history'
                ? 'bg-[#223240] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Riwayat Opname ({pastOpnames.length})
          </button>
        </div>
      </div>

      {activeTab === 'create' ? (
        <div className="space-y-4">
          {/* Summary Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-xs font-bold text-slate-500 uppercase">Total Item Dihitung</span>
              <p className="text-xl font-black text-[#223240] mt-1 font-sans">{allVariantsList.length} Varian</p>
            </div>
            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-xs font-bold text-slate-500 uppercase">Selisih Unit (Variance)</span>
              <p className={`text-xl font-black mt-1 font-sans ${totalDiscrepancyQty > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                {totalDiscrepancyQty} Unit
              </p>
            </div>
            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-xs font-bold text-slate-500 uppercase">Estimasi Selisih Nilai</span>
              <p className={`text-xl font-black mt-1 font-sans ${totalDiscrepancyValue !== 0 ? 'text-rose-600' : 'text-slate-900'}`}>
                {formatRupiah(totalDiscrepancyValue)}
              </p>
            </div>
          </div>

          {/* Search & Actions Bar */}
          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari pakaian opname..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none"
              />
            </div>

            <button
              onClick={handleSaveOpname}
              className="w-full sm:w-auto px-5 py-2.5 bg-[#223240] hover:bg-[#1a2732] text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-sm transition"
            >
              <Save className="w-4 h-4 text-[#E1A23D]" />
              <span>Simpan & Terapkan Hasil Opname</span>
            </button>
          </div>

          {/* Opname Calculation Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#223240] text-white uppercase text-[10px] tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Produk & Varian</th>
                  <th className="py-3 px-3">SKU</th>
                  <th className="py-3 px-3 text-center">Stok Sistem</th>
                  <th className="py-3 px-3 text-center">Hitungan Fisik</th>
                  <th className="py-3 px-3 text-center">Selisih</th>
                  <th className="py-3 px-3 text-right">Nilai Selisih</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredItems.map((item) => {
                  const physical = counts[item.variantId] !== undefined ? counts[item.variantId] : item.systemStock;
                  const variance = physical - item.systemStock;
                  const varVal = variance * item.costPrice;

                  return (
                    <tr key={item.variantId} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4">
                        <p className="font-bold text-slate-900">{item.productName}</p>
                        <p className="text-[10px] text-slate-500">{item.sizeLabel} · {item.colorLabel}</p>
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-600">{item.sku}</td>
                      <td className="py-3 px-3 text-center font-bold font-mono">{item.systemStock}</td>
                      <td className="py-3 px-3 text-center">
                        <input
                          type="number"
                          min="0"
                          value={physical}
                          onChange={(e) => handlePhysicalChange(item.variantId, parseInt(e.target.value) || 0)}
                          className="w-16 text-center p-1 border border-slate-300 rounded font-mono font-bold bg-amber-50/50 focus:bg-white"
                        />
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-bold">
                        <span className={variance === 0 ? 'text-slate-400' : variance > 0 ? 'text-emerald-600' : 'text-rose-600'}>
                          {variance > 0 ? `+${variance}` : variance}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums font-semibold">
                        {formatRupiah(varVal)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Opname History */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 font-bold text-xs text-slate-700">
            Riwayat Berita Acara Stok Opname
          </div>
          <div className="divide-y divide-slate-100">
            {pastOpnames.length === 0 ? (
              <p className="p-8 text-center text-slate-400 text-xs">Belum ada riwayat stok opname yang diselesaikan</p>
            ) : (
              pastOpnames.map((o) => (
                <div key={o.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{o.opnameNumber}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-100 text-emerald-800 font-bold uppercase">
                        {o.status}
                      </span>
                    </div>
                    <p className="text-slate-500 mt-1">
                      Petugas: {o.conductedBy} · Diperiksa: {o.totalItemsChecked} varian · {formatDateTime(o.createdAt)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-[#223240]">Selisih Nilai: {formatRupiah(o.totalDiscrepancyValue)}</p>
                    <p className="text-[11px] text-slate-400">{o.totalDiscrepancyQty} unit deviasi</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
