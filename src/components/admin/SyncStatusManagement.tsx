import React, { useState } from 'react';
import {
  RefreshCw,
  Wifi,
  WifiOff,
  Database,
  ShieldCheck,
  Smartphone,
  CheckCircle2,
  AlertTriangle,
  History,
  Lock,
} from 'lucide-react';
import { SyncQueueItem, UserProfile } from '../../types';
import { storage } from '../../services/storage';
import { formatDateTime, formatRupiah } from '../../utils/formatters';

interface SyncStatusManagementProps {
  currentUser: UserProfile;
}

export const SyncStatusManagement: React.FC<SyncStatusManagementProps> = ({ currentUser }) => {
  const [queue, setQueue] = useState<SyncQueueItem[]>(storage.getSyncQueue());
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  const isOffline = storage.isOffline();
  const deviceId = storage.getDeviceId();
  const sales = storage.getSales();
  const pendingSales = sales.filter((s) => s.syncStatus === 'pending_sync');
  const syncedSales = sales.filter((s) => s.syncStatus === 'synced');

  const handleForceSync = () => {
    setIsSyncing(true);
    setSyncFeedback(null);

    setTimeout(() => {
      const res = storage.processSyncQueue();
      setIsSyncing(false);
      setQueue(storage.getSyncQueue());
      setSyncFeedback(
        `Sinkronisasi Cloud Berhasil: ${res.syncedCount} transaksi outbox telah direkonsiliasi tanpa konflik idempotensi.`
      );
    }, 800);
  };

  return (
    <div className="p-4 lg:p-6 space-y-5 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#223240] tracking-tight">
            Status Sinkronisasi & Offline Outbox Engine
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Arsitektur offline-first, antrean transaksi tertunda, dan verifikasi kunci idempotensi
          </p>
        </div>

        <button
          onClick={handleForceSync}
          disabled={isSyncing || queue.length === 0}
          className="flex items-center gap-2 px-4 py-2 bg-[#223240] hover:bg-[#1a2732] text-white rounded-xl text-xs font-bold shadow-sm transition disabled:opacity-40 self-start"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-[#E1A23D] ${isSyncing ? 'animate-spin' : ''}`} />
          <span>{isSyncing ? 'Menyinkronkan...' : 'Sinkronkan Sekarang'}</span>
        </button>
      </div>

      {syncFeedback && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2 font-semibold animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{syncFeedback}</span>
        </div>
      )}

      {/* Device & Engine Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Connection State */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Koneksi Mesin POS</span>
            {isOffline ? (
              <WifiOff className="w-4 h-4 text-rose-500" />
            ) : (
              <Wifi className="w-4 h-4 text-emerald-600" />
            )}
          </div>
          <p className={`text-xl font-black font-sans ${isOffline ? 'text-rose-600' : 'text-emerald-700'}`}>
            {isOffline ? 'Offline (Lokal Disimpan)' : 'Online (Cloud Connected)'}
          </p>
          <p className="text-[11px] text-slate-500">
            {isOffline ? 'Transaksi disimpan di IndexedDB/Outbox' : 'Database PostgreSQL sinkron'}
          </p>
        </div>

        {/* Outbox Pending Sales */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Antrean Outbox Pending</span>
            <Database className="w-4 h-4 text-[#E1A23D]" />
          </div>
          <p className="text-xl font-black text-[#223240] tabular-nums font-sans">
            {queue.length} Operasi
          </p>
          <p className="text-[11px] text-slate-500">
            {pendingSales.length} transaksi kasir menunggu upload
          </p>
        </div>

        {/* Device Identifier */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">ID Perangkat Klien</span>
            <Smartphone className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-base font-black text-slate-800 font-mono mt-1">{deviceId}</p>
          <p className="text-[11px] text-slate-500">Terdaftar pada Cabang Kemang</p>
        </div>
      </div>

      {/* Outbox Queue Table */}
      <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm text-[#223240]">Daftar Antrean Outbox (Pending Cloud Sync)</h3>
          <span className="text-xs text-slate-400 font-mono">{queue.length} antrean</span>
        </div>

        {queue.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            Tidak ada transaksi pending. Semua data penjualan telah tersimpan di cloud database.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#223240] text-white uppercase text-[10px] tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Idempotency Key</th>
                  <th className="py-3 px-3">Tipe Operasi</th>
                  <th className="py-3 px-3">Waktu Dibuat</th>
                  <th className="py-3 px-3">Device ID</th>
                  <th className="py-3 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {queue.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-bold text-slate-900">{item.idempotencyKey}</td>
                    <td className="py-3 px-3 uppercase text-slate-600">{item.operationType}</td>
                    <td className="py-3 px-3 text-slate-500">{formatDateTime(item.createdAt)}</td>
                    <td className="py-3 px-3 text-slate-600">{item.deviceId}</td>
                    <td className="py-3 px-3 text-right">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 uppercase">
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Architecture Spec Card */}
      <div className="p-5 bg-[#FDFBF7] rounded-2xl border border-slate-200 space-y-2 text-xs leading-relaxed text-slate-700">
        <h4 className="font-bold text-[#223240] flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-[#E1A23D]" />
          <span>Jaminan Idempotensi & Resolusi Konflik Stok Offline</span>
        </h4>
        <p>
          Setiap transaksi offline yang dibuat pada mesin POS Kasir dibubuhi <code>idempotency_key</code> unik.
          Ketika jaringan internet kembali terhubung, server PostgreSQL/Supabase memvalidasi keaslian kunci ini.
          Jika transaksi pernah diterima sebelumnya, server menolak duplikasi dan hanya mengonfirmasi status receipt.
        </p>
      </div>
    </div>
  );
};
