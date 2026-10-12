import React, { useState } from 'react';
import { UserCheck, Shield, Plus, Lock, CheckCircle2, XCircle } from 'lucide-react';
import { UserProfile, UserRole } from '../../types';
import { storage, INITIAL_PROFILES } from '../../services/storage';

interface EmployeeManagementProps {
  currentUser: UserProfile;
}

export const EmployeeManagement: React.FC<EmployeeManagementProps> = ({ currentUser }) => {
  const [users, setUsers] = useState<UserProfile[]>(storage.getUsers());
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formRole, setFormRole] = useState<UserRole>('cashier');
  const [canDiscount, setCanDiscount] = useState(false);
  const [canRefund, setCanRefund] = useState(false);
  const [canCancel, setCanCancel] = useState(false);

  const reload = () => setUsers(storage.getUsers());

  const handleTogglePermission = (user: UserProfile, field: 'canGiveDiscount' | 'canRefund' | 'canCancel' | 'isActive') => {
    // Only Owner and Admin can change permissions
    if (currentUser.role === 'cashier') {
      alert('Akses Ditolak: Kasir tidak memiliki wewenang untuk mengubah hak akses pengguna.');
      return;
    }
    // Cannot alter owner permissions
    if (user.role === 'owner' && field === 'isActive') {
      alert('Tidak dapat menonaktifkan akun Owner utama.');
      return;
    }

    const updatedUser = {
      ...user,
      [field]: !user[field],
    };
    storage.saveUser(updatedUser);
    reload();
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formEmail.trim()) return;

    const newUser: UserProfile = {
      id: `user_${Date.now()}`,
      email: formEmail.trim(),
      fullName: formName.trim(),
      role: formRole,
      storeId: currentUser.storeId,
      locationId: currentUser.locationId,
      canGiveDiscount: canDiscount,
      canRefund: canRefund,
      canCancel: canCancel,
      isActive: true,
    };

    storage.saveUser(newUser);
    setIsModalOpen(false);
    setFormName('');
    setFormEmail('');
    reload();
  };

  return (
    <div className="p-4 lg:p-6 space-y-5 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#223240] tracking-tight">
            Karyawan & Manajemen Hak Akses (RBAC)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Pengaturan peran Owner, Admin Toko, dan Kasir dengan otorisasi diskon dan refund
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#223240] hover:bg-[#1a2732] text-white rounded-xl text-xs font-bold shadow-sm transition self-start"
        >
          <Plus className="w-4 h-4 text-[#E1A23D]" />
          <span>Tambah Akun Karyawan</span>
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#223240] text-white uppercase text-[10px] tracking-wider font-semibold">
            <tr>
              <th className="py-3 px-4">Nama & Email Karyawan</th>
              <th className="py-3 px-3">Role Sistem</th>
              <th className="py-3 px-3 text-center">Izin Diskon</th>
              <th className="py-3 px-3 text-center">Izin Refund</th>
              <th className="py-3 px-3 text-center">Izin Batal</th>
              <th className="py-3 px-3 text-center">Status Akun</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-slate-50/80 transition">
                <td className="py-3 px-4">
                  <p className="font-bold text-slate-900">{u.fullName}</p>
                  <p className="text-[10px] text-slate-400 font-mono">{u.email}</p>
                </td>
                <td className="py-3 px-3">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${
                      u.role === 'owner'
                        ? 'bg-[#E1A23D]/20 text-[#223240]'
                        : u.role === 'store_admin'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {u.role.replace('_', ' ')}
                  </span>
                </td>

                {/* Permission Toggles */}
                <td className="py-3 px-3 text-center">
                  <button
                    onClick={() => handleTogglePermission(u, 'canGiveDiscount')}
                    className={`px-2.5 py-1 rounded text-[11px] font-bold transition ${
                      u.canGiveDiscount
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {u.canGiveDiscount ? 'Diizinkan ✓' : 'Terkunci ✕'}
                  </button>
                </td>

                <td className="py-3 px-3 text-center">
                  <button
                    onClick={() => handleTogglePermission(u, 'canRefund')}
                    className={`px-2.5 py-1 rounded text-[11px] font-bold transition ${
                      u.canRefund
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {u.canRefund ? 'Diizinkan ✓' : 'Terkunci ✕'}
                  </button>
                </td>

                <td className="py-3 px-3 text-center">
                  <button
                    onClick={() => handleTogglePermission(u, 'canCancel')}
                    className={`px-2.5 py-1 rounded text-[11px] font-bold transition ${
                      u.canCancel
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {u.canCancel ? 'Diizinkan ✓' : 'Terkunci ✕'}
                  </button>
                </td>

                <td className="py-3 px-3 text-center">
                  <button
                    onClick={() => handleTogglePermission(u, 'isActive')}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      u.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                    }`}
                  >
                    {u.isActive ? 'Aktif' : 'Nonaktif'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* CREATE USER MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-5 space-y-4 text-xs animate-in fade-in zoom-in-95">
            <h3 className="font-bold text-sm text-[#223240] flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-[#E1A23D]" />
              <span>Tambah Karyawan / Kasir Baru</span>
            </h3>

            <form onSubmit={handleCreateUser} className="space-y-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Nama Lengkap Karyawan</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Misal: Andi Kasir"
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Email Login</label>
                <input
                  type="email"
                  required
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="kasir@thriftory.com"
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Role / Peran</label>
                <select
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value as UserRole)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
                >
                  <option value="cashier">Kasir POS (Terbatas)</option>
                  <option value="store_admin">Admin Toko</option>
                  <option value="owner">Owner / Super Admin</option>
                </select>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl space-y-2 border border-slate-200">
                <p className="font-bold text-slate-700">Hak Akses Khusus:</p>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={canDiscount}
                    onChange={(e) => setCanDiscount(e.target.checked)}
                    className="rounded"
                  />
                  <span>Boleh memberikan diskon manual di POS</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={canRefund}
                    onChange={(e) => setCanRefund(e.target.checked)}
                    className="rounded"
                  />
                  <span>Boleh melakukan refund / retur transaksi</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={canCancel}
                    onChange={(e) => setCanCancel(e.target.checked)}
                    className="rounded"
                  />
                  <span>Boleh membatalkan transaksi tersimpan</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#223240] text-white font-bold rounded-lg shadow-sm"
                >
                  Simpan Akun
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
