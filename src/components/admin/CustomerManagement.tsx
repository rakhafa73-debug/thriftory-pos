import React, { useState } from 'react';
import { Users, Plus, Phone, Mail, MapPin, Search } from 'lucide-react';
import { Customer, UserProfile } from '../../types';
import { storage } from '../../services/storage';
import { formatRupiah, formatDate } from '../../utils/formatters';

interface CustomerManagementProps {
  currentUser: UserProfile;
}

export const CustomerManagement: React.FC<CustomerManagementProps> = ({ currentUser }) => {
  const [customers, setCustomers] = useState<Customer[]>(storage.getCustomers());
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formNotes, setFormNotes] = useState('');

  const reload = () => setCustomers(storage.getCustomers());

  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const newCust: Customer = {
      id: `cust_${Date.now()}`,
      storeId: currentUser.storeId,
      name: formName.trim(),
      phone: formPhone.trim(),
      email: formEmail.trim() || undefined,
      address: formAddress.trim() || undefined,
      notes: formNotes.trim() || undefined,
      totalSpent: 0,
      totalOrders: 0,
      createdAt: new Date().toISOString(),
    };

    storage.saveCustomer(newCust);
    setIsModalOpen(false);
    setFormName('');
    setFormPhone('');
    setFormEmail('');
    setFormAddress('');
    setFormNotes('');
    reload();
  };

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search) ||
      (c.email && c.email.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="p-4 lg:p-6 space-y-5 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#223240] tracking-tight">
            Data Pelanggan & Member Loyalitas
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Database member ritel, akumulasi nilai belanja, dan riwayat pesanan
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#223240] hover:bg-[#1a2732] text-white rounded-xl text-xs font-bold shadow-sm transition self-start"
        >
          <Plus className="w-4 h-4 text-[#E1A23D]" />
          <span>Tambah Pelanggan</span>
        </button>
      </div>

      <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama pelanggan, nomor telepon..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((c) => (
          <div key={c.id} className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-3 text-xs">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-bold text-sm text-[#223240]">{c.name}</h4>
                <p className="text-[11px] text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                  <Phone className="w-3 h-3 text-slate-400" />
                  <span>{c.phone || '-'}</span>
                </p>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#E1A23D]/20 text-[#223240]">
                {c.totalOrders} Order
              </span>
            </div>

            <div className="space-y-1 text-slate-600 border-t border-slate-100 pt-2">
              {c.email && (
                <p className="flex items-center gap-1.5 text-[11px]">
                  <Mail className="w-3 h-3 text-slate-400" />
                  <span>{c.email}</span>
                </p>
              )}
              {c.address && (
                <p className="flex items-center gap-1.5 text-[11px]">
                  <MapPin className="w-3 h-3 text-slate-400" />
                  <span className="line-clamp-1">{c.address}</span>
                </p>
              )}
              {c.notes && <p className="italic text-slate-400 text-[11px]">"{c.notes}"</p>}
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
              <span className="text-slate-500">Total Belanja:</span>
              <span className="font-extrabold text-[#223240] font-mono tabular-nums">
                {formatRupiah(c.totalSpent)}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* CREATE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-5 space-y-4 text-xs animate-in fade-in zoom-in-95">
            <h3 className="font-bold text-sm text-[#223240] flex items-center gap-2">
              <Users className="w-4 h-4 text-[#E1A23D]" />
              <span>Tambah Pelanggan Baru</span>
            </h3>

            <form onSubmit={handleSaveCustomer} className="space-y-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Misal: Dimas Setiawan"
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Nomor WhatsApp / HP</label>
                <input
                  type="text"
                  required
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  placeholder="0812-XXXX-XXXX"
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Email (Opsional)</label>
                <input
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="dimas@gmail.com"
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Alamat Domisili</label>
                <input
                  type="text"
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  placeholder="Jakarta Selatan"
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Catatan Preferensi</label>
                <input
                  type="text"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Misal: Penggemar denim vintage size 32"
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
                />
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
                  Simpan Pelanggan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
