import React, { useState } from 'react';
import {
  BarChart3,
  Download,
  Printer,
  Calendar,
  DollarSign,
  TrendingUp,
  Package,
  Layers,
  Award,
  Users,
} from 'lucide-react';
import { Sale, ProductWithVariants, UserProfile } from '../../types';
import { storage } from '../../services/storage';
import { formatRupiah, formatDate } from '../../utils/formatters';

interface ReportsManagementProps {
  currentUser: UserProfile;
}

export const ReportsManagement: React.FC<ReportsManagementProps> = ({ currentUser }) => {
  const [reportPeriod, setReportPeriod] = useState<'today' | 'week' | 'month' | 'all'>('month');
  const [activeReportTab, setActiveReportTab] = useState<'financial' | 'category' | 'size_color' | 'cashier'>('financial');

  const sales = storage.getSales();
  const products = storage.getProducts();

  // Filter sales
  const now = new Date();
  const validSales = sales.filter((s) => {
    if (s.transactionStatus === 'refunded') return false;
    const d = new Date(s.createdAt);
    if (reportPeriod === 'today') {
      return d.toDateString() === now.toDateString();
    }
    if (reportPeriod === 'week') {
      return (now.getTime() - d.getTime()) / (1000 * 3600 * 24) <= 7;
    }
    if (reportPeriod === 'month') {
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }
    return true;
  });

  const refundedSales = sales.filter((s) => s.transactionStatus === 'refunded');

  // Key Financial Metrics
  const grossRevenue = validSales.reduce((sum, s) => sum + s.subtotal, 0);
  const totalDiscounts = validSales.reduce((sum, s) => sum + s.discountAmount, 0);
  const netSales = validSales.reduce((sum, s) => sum + s.totalAmount, 0);
  const totalRefundAmount = refundedSales.reduce((sum, s) => sum + s.totalAmount, 0);

  // HPP / COGS (Cost of Goods Sold) calculated from line snapshots
  let totalCOGS = 0;
  validSales.forEach((s) => {
    s.items.forEach((item) => {
      totalCOGS += (item.unitCostSnapshot || 0) * item.quantity;
    });
  });

  const grossProfit = netSales - totalCOGS;
  const grossProfitMargin = netSales > 0 ? ((grossProfit / netSales) * 100).toFixed(1) : '0';

  // Total Inventory Valuation (Current Stock * Cost Price)
  let totalInventoryValuation = 0;
  let totalStockQty = 0;
  products.forEach((p) => {
    p.variants.forEach((v) => {
      totalInventoryValuation += v.stock * v.costPrice;
      totalStockQty += v.stock;
    });
  });

  // Category breakdown
  const categorySalesMap: Record<string, { qty: number; revenue: number }> = {};
  const sizeSalesMap: Record<string, { qty: number; revenue: number }> = {};
  const colorSalesMap: Record<string, { qty: number; revenue: number }> = {};
  const cashierSalesMap: Record<string, { name: string; count: number; total: number }> = {};

  validSales.forEach((s) => {
    // Cashier
    if (!cashierSalesMap[s.cashierId]) {
      cashierSalesMap[s.cashierId] = { name: s.cashierName, count: 0, total: 0 };
    }
    cashierSalesMap[s.cashierId].count += 1;
    cashierSalesMap[s.cashierId].total += s.totalAmount;

    // Items
    s.items.forEach((item) => {
      // Find category
      const prod = products.find((p) => p.name === item.productNameSnapshot);
      const catName = prod?.categoryName || 'Lainnya';
      if (!categorySalesMap[catName]) categorySalesMap[catName] = { qty: 0, revenue: 0 };
      categorySalesMap[catName].qty += item.quantity;
      categorySalesMap[catName].revenue += item.lineTotal;

      // Size
      const sizeKey = item.sizeSnapshot;
      if (!sizeSalesMap[sizeKey]) sizeSalesMap[sizeKey] = { qty: 0, revenue: 0 };
      sizeSalesMap[sizeKey].qty += item.quantity;
      sizeSalesMap[sizeKey].revenue += item.lineTotal;

      // Color
      const colorKey = item.colorSnapshot;
      if (!colorSalesMap[colorKey]) colorSalesMap[colorKey] = { qty: 0, revenue: 0 };
      colorSalesMap[colorKey].qty += item.quantity;
      colorSalesMap[colorKey].revenue += item.lineTotal;
    });
  });

  const handlePrintReport = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const lines = [
      'Laporan Keuangan & Penjualan Ritel THRIFTORY POS',
      `Periode: ${reportPeriod.toUpperCase()}`,
      `Tanggal Cetak: ${new Date().toLocaleDateString('id-ID')}`,
      '',
      'RINGKASAN METRIK FINANSIAL',
      `Omzet Kotor,${grossRevenue}`,
      `Total Diskon,${totalDiscounts}`,
      `Penjualan Bersih (Net Sales),${netSales}`,
      `HPP (Harga Pokok Penjualan),${totalCOGS}`,
      `Laba Kotor (Gross Profit),${grossProfit}`,
      `Margin Laba Kotor,${grossProfitMargin}%`,
      `Nilai Persediaan Saat Ini,${totalInventoryValuation}`,
      `Total Unit Stok,${totalStockQty}`,
      `Total Refund,${totalRefundAmount}`,
    ];

    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `laporan_keuangan_thriftory_${reportPeriod}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-4 lg:p-6 space-y-5 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#223240] tracking-tight">
            Laporan Keuangan & Penjualan Ritel
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Analisis omzet bersih, HPP barang terjual, laba kotor, dan valuasi aset persediaan
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Period Selector */}
          <select
            value={reportPeriod}
            onChange={(e) => setReportPeriod(e.target.value as any)}
            className="p-2 text-xs bg-white border border-slate-300 rounded-xl font-bold text-slate-700 shadow-2xs"
          >
            <option value="today">Hari Ini</option>
            <option value="week">7 Hari Terakhir</option>
            <option value="month">Bulan Ini</option>
            <option value="all">Sepanjang Waktu</option>
          </select>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold shadow-2xs transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Ekspor CSV</span>
          </button>

          <button
            onClick={handlePrintReport}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#223240] hover:bg-[#1a2732] text-white rounded-xl text-xs font-bold shadow-sm transition"
          >
            <Printer className="w-3.5 h-3.5 text-[#E1A23D]" />
            <span>Cetak Laporan</span>
          </button>
        </div>
      </div>

      {/* Financial Executive Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Penjualan Bersih */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Penjualan Bersih (Net Sales)
          </span>
          <p className="text-2xl font-black text-[#223240] tabular-nums font-sans">
            {formatRupiah(netSales)}
          </p>
          <p className="text-[11px] text-slate-500">Omzet kotor: {formatRupiah(grossRevenue)}</p>
        </div>

        {/* HPP (COGS) */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            HPP (Harga Pokok Penjualan)
          </span>
          <p className="text-2xl font-black text-rose-600 tabular-nums font-sans">
            {formatRupiah(totalCOGS)}
          </p>
          <p className="text-[11px] text-slate-500">Modal snapshot barang terjual</p>
        </div>

        {/* Laba Kotor (Gross Profit) */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Laba Kotor (Gross Profit)
          </span>
          <p className="text-2xl font-black text-emerald-600 tabular-nums font-sans">
            {formatRupiah(grossProfit)}
          </p>
          <p className="text-[11px] text-emerald-700 font-bold">Margin: {grossProfitMargin}%</p>
        </div>

        {/* Nilai Persediaan Stok Toko */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Nilai Persediaan Aset
          </span>
          <p className="text-2xl font-black text-[#223240] tabular-nums font-sans">
            {formatRupiah(totalInventoryValuation)}
          </p>
          <p className="text-[11px] text-slate-500">{totalStockQty} unit pakaian di gudang/rak</p>
        </div>
      </div>

      {/* Sub Tabs Breakdown */}
      <div className="flex bg-white p-1 rounded-xl border border-slate-200 self-start text-xs font-semibold">
        <button
          onClick={() => setActiveReportTab('financial')}
          className={`px-3 py-1.5 rounded-lg transition ${
            activeReportTab === 'financial' ? 'bg-[#223240] text-white' : 'text-slate-600'
          }`}
        >
          Rincian Finansial & Diskon
        </button>
        <button
          onClick={() => setActiveReportTab('category')}
          className={`px-3 py-1.5 rounded-lg transition ${
            activeReportTab === 'category' ? 'bg-[#223240] text-white' : 'text-slate-600'
          }`}
        >
          Kategori Pakaian
        </button>
        <button
          onClick={() => setActiveReportTab('size_color')}
          className={`px-3 py-1.5 rounded-lg transition ${
            activeReportTab === 'size_color' ? 'bg-[#223240] text-white' : 'text-slate-600'
          }`}
        >
          Ukuran & Warna
        </button>
        <button
          onClick={() => setActiveReportTab('cashier')}
          className={`px-3 py-1.5 rounded-lg transition ${
            activeReportTab === 'cashier' ? 'bg-[#223240] text-white' : 'text-slate-600'
          }`}
        >
          Per Kasir
        </button>
      </div>

      {/* Tab Contents */}
      {activeReportTab === 'financial' && (
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-3 text-xs">
          <h3 className="font-bold text-sm text-[#223240]">Laporan Laba Rugi Sederhana Ritel</h3>
          <table className="w-full text-left">
            <tbody className="divide-y divide-slate-100">
              <tr className="py-2.5 flex justify-between">
                <td className="text-slate-600">Total Omzet Kotor (Gross Sales)</td>
                <td className="font-mono font-bold">{formatRupiah(grossRevenue)}</td>
              </tr>
              <tr className="py-2.5 flex justify-between text-rose-600">
                <td>Potongan Diskon Penjualan</td>
                <td className="font-mono font-bold">-{formatRupiah(totalDiscounts)}</td>
              </tr>
              <tr className="py-2.5 flex justify-between font-bold text-slate-900 border-t border-slate-200">
                <td>Penjualan Bersih (Net Sales)</td>
                <td className="font-mono text-sm">{formatRupiah(netSales)}</td>
              </tr>
              <tr className="py-2.5 flex justify-between text-rose-700">
                <td>Harga Pokok Penjualan (HPP / COGS)</td>
                <td className="font-mono font-bold">-{formatRupiah(totalCOGS)}</td>
              </tr>
              <tr className="py-2.5 flex justify-between font-black text-emerald-700 text-sm border-t-2 border-slate-300">
                <td>LABA KOTOR BERSIH TOKO (GROSS PROFIT)</td>
                <td className="font-mono text-base">{formatRupiah(grossProfit)}</td>
              </tr>
              <tr className="py-2.5 flex justify-between text-slate-500 pt-3">
                <td>Total Pengembalian / Retur / Refund</td>
                <td className="font-mono font-bold text-rose-500">{formatRupiah(totalRefundAmount)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {activeReportTab === 'category' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#223240] text-white uppercase text-[10px] tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Kategori Pakaian</th>
                <th className="py-3 px-3">Unit Terjual</th>
                <th className="py-3 px-3 text-right">Kontribusi Omzet</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {Object.entries(categorySalesMap).map(([cat, data]) => (
                <tr key={cat} className="hover:bg-slate-50">
                  <td className="py-3 px-4 font-bold text-slate-900">{cat}</td>
                  <td className="py-3 px-3 font-mono">{data.qty} pcs</td>
                  <td className="py-3 px-3 text-right font-bold font-mono text-[#223240]">
                    {formatRupiah(data.revenue)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeReportTab === 'size_color' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-2">
            <h4 className="font-bold text-xs text-[#223240] uppercase">Penjualan Berdasarkan Ukuran</h4>
            <div className="divide-y divide-slate-100 text-xs">
              {Object.entries(sizeSalesMap).map(([size, data]) => (
                <div key={size} className="py-2 flex justify-between items-center">
                  <span className="font-bold">{size}</span>
                  <span className="font-mono text-[#223240] font-bold">
                    {data.qty} pcs ({formatRupiah(data.revenue)})
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-2">
            <h4 className="font-bold text-xs text-[#223240] uppercase">Penjualan Berdasarkan Warna</h4>
            <div className="divide-y divide-slate-100 text-xs">
              {Object.entries(colorSalesMap).map(([color, data]) => (
                <div key={color} className="py-2 flex justify-between items-center">
                  <span className="font-bold">{color}</span>
                  <span className="font-mono text-[#223240] font-bold">
                    {data.qty} pcs ({formatRupiah(data.revenue)})
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeReportTab === 'cashier' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#223240] text-white uppercase text-[10px] tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Nama Kasir</th>
                <th className="py-3 px-3">Total Transaksi Dilayani</th>
                <th className="py-3 px-3 text-right">Total Nominal Penjualan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {Object.values(cashierSalesMap).map((c, idx) => (
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="py-3 px-4 font-bold text-slate-900">{c.name}</td>
                  <td className="py-3 px-3 font-mono">{c.count} transaksi</td>
                  <td className="py-3 px-3 text-right font-bold font-mono text-[#223240]">
                    {formatRupiah(c.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
