import React, { useState } from 'react';
import {
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Package,
  AlertTriangle,
  RefreshCw,
  Users,
  CreditCard,
  Calendar,
  Layers,
  Award,
  ArrowUpRight,
} from 'lucide-react';
import { Sale, ProductWithVariants, UserProfile } from '../../types';
import { storage } from '../../services/storage';
import { formatRupiah, formatDateTime, formatDate } from '../../utils/formatters';

interface AdminDashboardProps {
  currentUser: UserProfile;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ currentUser }) => {
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month'>('today');

  const sales = storage.getSales();
  const products = storage.getProducts();
  const queue = storage.getSyncQueue();

  // Filter sales by time
  const now = new Date();
  const filteredSales = sales.filter((s) => {
    if (s.transactionStatus === 'refunded') return false; // don't count refunded in active revenue
    const d = new Date(s.createdAt);
    if (timeRange === 'today') {
      return (
        d.getDate() === now.getDate() &&
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear()
      );
    }
    if (timeRange === 'week') {
      const diffDays = (now.getTime() - d.getTime()) / (1000 * 3600 * 24);
      return diffDays <= 7;
    }
    return true; // month
  });

  // Gross Revenue & Net Sales
  const grossRevenue = filteredSales.reduce((sum, s) => sum + s.subtotal, 0);
  const totalDiscounts = filteredSales.reduce((sum, s) => sum + s.discountAmount, 0);
  const netSales = filteredSales.reduce((sum, s) => sum + s.totalAmount, 0);

  // Total active stock units & products
  const activeProductsCount = products.filter((p) => p.isActive).length;
  const totalStockUnits = products.reduce((sum, p) => sum + (p.totalStock || 0), 0);

  // Low Stock Items (Stock <= minStockAlert)
  const lowStockItems: { productName: string; size: string; stock: number; sku: string }[] = [];
  products.forEach((p) => {
    p.variants.forEach((v) => {
      if (v.stock <= v.minStockAlert) {
        lowStockItems.push({
          productName: p.name,
          size: v.sizeLabel,
          stock: v.stock,
          sku: v.sku,
        });
      }
    });
  });

  // Payment methods breakdown
  const paymentMethodCounts: Record<string, number> = {};
  filteredSales.forEach((s) => {
    paymentMethodCounts[s.paymentMethod] = (paymentMethodCounts[s.paymentMethod] || 0) + s.totalAmount;
  });

  // Best selling products
  const productSalesMap: Record<string, { name: string; qty: number; revenue: number }> = {};
  const sizeSalesMap: Record<string, number> = {};
  filteredSales.forEach((s) => {
    s.items.forEach((item) => {
      if (!productSalesMap[item.productNameSnapshot]) {
        productSalesMap[item.productNameSnapshot] = {
          name: item.productNameSnapshot,
          qty: 0,
          revenue: 0,
        };
      }
      productSalesMap[item.productNameSnapshot].qty += item.quantity;
      productSalesMap[item.productNameSnapshot].revenue += item.lineTotal;

      const sizeKey = item.sizeSnapshot.split(' ')[0]; // Normalize S, M, L, XL
      sizeSalesMap[sizeKey] = (sizeSalesMap[sizeKey] || 0) + item.quantity;
    });
  });

  const bestSellingProducts = Object.values(productSalesMap)
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);

  const topSizes = Object.entries(sizeSalesMap)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 4);

  // Cashier sales breakdown
  const cashierMap: Record<string, { name: string; count: number; total: number }> = {};
  filteredSales.forEach((s) => {
    if (!cashierMap[s.cashierId]) {
      cashierMap[s.cashierId] = { name: s.cashierName, count: 0, total: 0 };
    }
    cashierMap[s.cashierId].count += 1;
    cashierMap[s.cashierId].total += s.totalAmount;
  });

  // 7-day trend bars data
  const daysTrend = [6, 5, 4, 3, 2, 1, 0].map((daysAgo) => {
    const target = new Date();
    target.setDate(target.getDate() - daysAgo);
    const dayStr = target.toLocaleDateString('id-ID', { weekday: 'short' });
    const dayTotal = sales
      .filter((s) => {
        const d = new Date(s.createdAt);
        return (
          d.getDate() === target.getDate() &&
          d.getMonth() === target.getMonth() &&
          d.getFullYear() === target.getFullYear() &&
          s.transactionStatus !== 'refunded'
        );
      })
      .reduce((sum, s) => sum + s.totalAmount, 0);
    return { day: dayStr, total: dayTotal };
  });

  const maxTrend = Math.max(...daysTrend.map((d) => d.total), 1000000);

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#223240] tracking-tight">
            Dashboard Analytics
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Performa ritel pakaian, omzet kasir, dan kontrol persediaan
          </p>
        </div>

        {/* Time Filter Segmented Control */}
        <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs self-start">
          <button
            onClick={() => setTimeRange('today')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              timeRange === 'today'
                ? 'bg-[#223240] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Hari Ini
          </button>
          <button
            onClick={() => setTimeRange('week')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              timeRange === 'week'
                ? 'bg-[#223240] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            7 Hari
          </button>
          <button
            onClick={() => setTimeRange('month')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              timeRange === 'month'
                ? 'bg-[#223240] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Bulan Ini
          </button>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Omzet Kotor */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Penjualan Bersih</span>
            <DollarSign className="w-4 h-4 text-[#E1A23D]" />
          </div>
          <p className="text-2xl font-black text-[#223240] tabular-nums font-sans">
            {formatRupiah(netSales)}
          </p>
          <p className="text-[11px] text-slate-500">
            Diskon: -{formatRupiah(totalDiscounts)}
          </p>
        </div>

        {/* Jumlah Transaksi */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Jumlah Transaksi</span>
            <ShoppingBag className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-[#223240] tabular-nums font-sans">
            {filteredSales.length}
          </p>
          <p className="text-[11px] text-slate-500">
            Tiket kasir terverifikasi
          </p>
        </div>

        {/* Total Unit Stok */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Total Unit Stok</span>
            <Package className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-black text-[#223240] tabular-nums font-sans">
            {totalStockUnits}
          </p>
          <p className="text-[11px] text-slate-500">
            Dari {activeProductsCount} katalog produk aktif
          </p>
        </div>

        {/* Peringatan Stok Rendah & Offline Queue */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Stok Menipis / Queue</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-black text-amber-600 tabular-nums font-sans">
              {lowStockItems.length}
            </p>
            <span className="text-xs text-slate-500">item perlu restock</span>
          </div>
          <p className="text-[11px] text-slate-500">
            {queue.length > 0 ? `${queue.length} antrean offline siap sync` : 'Sinkronisasi cloud stabil'}
          </p>
        </div>
      </div>

      {/* Charts & Breakdown Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* 7-Day Trend Chart */}
        <div className="lg:col-span-2 p-5 bg-white rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#223240]">Trend Penjualan 7 Hari Terakhir</h3>
              <p className="text-xs text-slate-500">Grafik omzet harian toko</p>
            </div>
            <TrendingUp className="w-4 h-4 text-[#E1A23D]" />
          </div>

          {/* Clean SVG Bar Chart */}
          <div className="h-52 flex items-end gap-3 pt-6 pb-2 px-2">
            {daysTrend.map((item, idx) => {
              const heightPct = Math.max(8, Math.round((item.total / maxTrend) * 100));
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                  <span className="text-[10px] font-mono font-bold text-slate-600 opacity-0 group-hover:opacity-100 transition tabular-nums">
                    {formatRupiah(item.total)}
                  </span>
                  <div
                    style={{ height: `${heightPct}%` }}
                    className="w-full bg-[#223240] hover:bg-[#E1A23D] rounded-t-lg transition-all duration-300 relative"
                  />
                  <span className="text-[11px] font-semibold text-slate-500 font-sans">{item.day}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Metrik Ukuran Terlaris & Metode Pembayaran */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-2xs space-y-5">
          <div>
            <h3 className="text-sm font-bold text-[#223240]">Ukuran Paling Laris</h3>
            <p className="text-xs text-slate-500 mb-3">Distribusi ukuran pakaian terjual</p>
            <div className="space-y-2">
              {topSizes.length === 0 ? (
                <p className="text-xs text-slate-400">Belum ada data transaksi ukuran</p>
              ) : (
                topSizes.map(([size, count]) => (
                  <div key={size} className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                      Size {size}
                    </span>
                    <span className="font-extrabold text-[#223240] font-mono tabular-nums">
                      {count} unit terjual
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <h3 className="text-sm font-bold text-[#223240]">Metode Pembayaran</h3>
            <p className="text-xs text-slate-500 mb-2.5">Distribusi nominal transaksi</p>
            <div className="space-y-1.5">
              {Object.entries(paymentMethodCounts).length === 0 ? (
                <p className="text-xs text-slate-400">Belum ada transaksi</p>
              ) : (
                Object.entries(paymentMethodCounts).map(([method, amount]) => (
                  <div key={method} className="flex justify-between items-center text-xs">
                    <span className="capitalize text-slate-600">{method.replace('_', ' ')}</span>
                    <span className="font-bold text-[#223240] tabular-nums font-mono">
                      {formatRupiah(amount)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Section: Produk Terlaris & Transaksi Terkini */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Produk Terlaris */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#223240]">Produk Paling Laris (Bestseller)</h3>
            <Award className="w-4 h-4 text-[#E1A23D]" />
          </div>

          <div className="divide-y divide-slate-100">
            {bestSellingProducts.length === 0 ? (
              <p className="text-xs text-slate-400 py-4">Belum ada data penjualan tercatat</p>
            ) : (
              bestSellingProducts.map((p, idx) => (
                <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-[10px]">
                      {idx + 1}
                    </span>
                    <span className="font-semibold text-slate-900 line-clamp-1 max-w-[240px]">
                      {p.name}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-[#223240] tabular-nums">{p.qty} pcs</p>
                    <p className="text-[10px] text-slate-500 font-mono">{formatRupiah(p.revenue)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Transaksi Terbaru */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#223240]">Transaksi Kasir Terkini</h3>
            <span className="text-xs text-[#E1A23D] font-bold">Terbaru</span>
          </div>

          <div className="divide-y divide-slate-100">
            {sales.slice(0, 5).map((s) => (
              <div key={s.id} className="py-2 flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-slate-900">{s.invoiceNumber}</p>
                  <p className="text-[10px] text-slate-500">
                    Kasir: {s.cashierName} · {s.items.length} item · {formatDateTime(s.createdAt)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-extrabold text-[#223240] tabular-nums">
                    {formatRupiah(s.totalAmount)}
                  </p>
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                      s.origin === 'offline'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {s.origin}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
