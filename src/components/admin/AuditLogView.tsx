import React from 'react';
import { FileText, Shield, User, Clock } from 'lucide-react';
import { storage } from '../../services/storage';
import { formatDateTime } from '../../utils/formatters';

export const AuditLogView: React.FC = () => {
  const logs = storage.getAuditLogs();

  return (
    <div className="p-4 lg:p-6 space-y-5 max-w-7xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-[#223240] tracking-tight">
          Audit Log Sistem & Keamanan
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Jejak aktivitas transaksi, mutasi stok, perubahan harga, dan sinkronisasi
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#223240] text-white uppercase text-[10px] tracking-wider font-semibold">
            <tr>
              <th className="py-3 px-4">Waktu (WIB)</th>
              <th className="py-3 px-3">Pengguna & Peran</th>
              <th className="py-3 px-3">Aksi</th>
              <th className="py-3 px-3">Entitas</th>
              <th className="py-3 px-3">Rincian Aktivitas</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-sans">
            {logs.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-400">
                  Belum ada log audit tercatat
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap">
                    {formatDateTime(log.createdAt)}
                  </td>
                  <td className="py-3 px-3">
                    <p className="font-bold text-slate-900">{log.actorName}</p>
                    <span className="text-[10px] font-mono text-[#E1A23D] uppercase">
                      {log.actorRole}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-slate-100 text-slate-800">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-600 uppercase text-[11px]">
                    {log.entityType}
                  </td>
                  <td className="py-3 px-3 text-slate-700 max-w-md">
                    {log.details}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
