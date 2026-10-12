import React, { useState } from 'react';
import { Settings, Building2, Printer, Store as StoreIcon, Save, Check } from 'lucide-react';
import { Store, StoreLocation, UserProfile } from '../../types';
import { storage } from '../../services/storage';

interface StoreSettingsProps {
  currentUser: UserProfile;
  activeTab?: 'settings' | 'branches' | 'profile';
}

export const StoreSettings: React.FC<StoreSettingsProps> = ({
  currentUser,
  activeTab = 'settings',
}) => {
  const [store, setStore] = useState<Store>(storage.getStore());
  const [locations, setLocations] = useState<StoreLocation[]>(storage.getLocations());
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Form states
  const [name, setName] = useState(store.name);
  const [phone, setPhone] = useState(store.phone);
  const [address, setAddress] = useState(store.address);
  const [receiptHeader, setReceiptHeader] = useState(store.receiptHeader);
  const [receiptFooter, setReceiptFooter] = useState(store.receiptFooter);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedStore: Store = {
      ...store,
      name: name.trim(),
      phone: phone.trim(),
      address: address.trim(),
      receiptHeader: receiptHeader.trim(),
      receiptFooter: receiptFooter.trim(),
    };

    storage.updateStore(updatedStore);
    setStore(updatedStore);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-5xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-[#223240] tracking-tight">
          Pengaturan Toko & Profil Cabang
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Identitas bisnis ritel, header/footer struk thermal, dan pengelolaan cabang toko
        </p>
      </div>

      {savedSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>Pengaturan toko berhasil diperbarui!</span>
        </div>
      )}

      {/* Main Settings Form */}
      <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-5 text-xs">
        <h3 className="font-bold text-sm text-[#223240] flex items-center gap-2">
          <StoreIcon className="w-4 h-4 text-[#E1A23D]" />
          <span>Identitas Usaha & Struk Kasir</span>
        </h3>

        <form onSubmit={handleSaveSettings} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Nama Toko Ritel</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Nomor Telepon Toko</label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Alamat Lengkap Toko</label>
            <textarea
              rows={2}
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg"
            />
          </div>

          <div className="pt-2 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Header Struk Thermal</label>
              <input
                type="text"
                value={receiptHeader}
                onChange={(e) => setReceiptHeader(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-mono"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Footer / Ketentuan Struk</label>
              <input
                type="text"
                value={receiptFooter}
                onChange={(e) => setReceiptFooter(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-mono"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className="px-6 py-2.5 bg-[#223240] hover:bg-[#1a2732] text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-sm transition"
            >
              <Save className="w-4 h-4 text-[#E1A23D]" />
              <span>Simpan Perubahan Pengaturan</span>
            </button>
          </div>
        </form>
      </div>

      {/* Branches List */}
      <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-4 text-xs">
        <h3 className="font-bold text-sm text-[#223240] flex items-center gap-2">
          <Building2 className="w-4 h-4 text-[#E1A23D]" />
          <span>Cabang Toko Terdaftar</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {locations.map((loc) => (
            <div key={loc.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-900">{loc.name}</span>
                <span className="font-mono text-[10px] bg-slate-200 text-slate-800 px-2 py-0.5 rounded font-bold">
                  {loc.code}
                </span>
              </div>
              <p className="text-slate-500">{loc.address}</p>
              {loc.isMain && (
                <span className="inline-block mt-1 text-[10px] text-emerald-700 font-bold">
                  Kantor & Toko Pusat (Main)
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
