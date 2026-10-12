import React, { useState } from 'react';
import {
  Truck,
  ShoppingBag,
  Plus,
  CheckCircle,
  Clock,
  Building,
  DollarSign,
  AlertCircle,
  Eye,
} from 'lucide-react';
import { Supplier, PurchaseOrder, PurchaseOrderItem, UserProfile } from '../../types';
import { storage } from '../../services/storage';
import { formatRupiah, formatDateTime, formatDate } from '../../utils/formatters';

interface PurchaseManagementProps {
  currentUser: UserProfile;
}

export const PurchaseManagement: React.FC<PurchaseManagementProps> = ({ currentUser }) => {
  const [activeTab, setActiveTab] = useState<'purchases' | 'suppliers'>('purchases');
  const suppliers = storage.getSuppliers();
  const purchases = storage.getPurchases();
  const products = storage.getProducts();

  // Create PO Modal
  const [isCreatePoOpen, setIsCreatePoOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(suppliers[0]?.id || '');
  const [poNotes, setPoNotes] = useState('Pemesanan batch baru pakaian');

  // Item lines for new PO
  const [selectedVariantId, setSelectedVariantId] = useState('');
  const [orderQty, setOrderQty] = useState(10);
  const [orderCost, setOrderCost] = useState(150000);
  const [poItems, setPoItems] = useState<PurchaseOrderItem[]>([]);

  // Create Supplier Modal
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [supName, setSupName] = useState('');
  const [supContact, setSupContact] = useState('');
  const [supPhone, setSupPhone] = useState('');
  const [supAddress, setSupAddress] = useState('');

  const handleAddItemToPo = () => {
    if (!selectedVariantId) return;
    let foundVar: any = null;
    let foundProdName = '';
    products.forEach((p) => {
      const v = p.variants.find((v) => v.id === selectedVariantId);
      if (v) {
        foundVar = v;
        foundProdName = p.name;
      }
    });

    if (!foundVar) return;

    setPoItems((prev) => [
      ...prev,
      {
        id: `poi_${Date.now()}`,
        variantId: foundVar.id,
        variantSku: foundVar.sku,
        productName: foundProdName,
        quantity: orderQty,
        unitCost: orderCost,
        lineTotal: orderQty * orderCost,
      },
    ]);
  };

  const handleSavePO = (e: React.FormEvent) => {
    e.preventDefault();
    if (poItems.length === 0) {
      alert('Tambahkan minimal 1 item pakaian dalam Purchase Order');
      return;
    }

    const supObj = suppliers.find((s) => s.id === selectedSupplier);
    const totalAmount = poItems.reduce((sum, item) => sum + item.lineTotal, 0);

    const newPo: PurchaseOrder = {
      id: `po_${Date.now()}`,
      poNumber: `PO-${new Date().toISOString().slice(2, 10).replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`,
      supplierId: selectedSupplier,
      supplierName: supObj?.name || 'Supplier Umum',
      status: 'ordered',
      totalAmount,
      notes: poNotes,
      items: poItems,
      orderedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    storage.savePurchase(newPo);
    setIsCreatePoOpen(false);
    setPoItems([]);
  };

  const handleReceivePO = (poId: string) => {
    if (window.confirm('Sahkan penerimaan barang PO ini? Stok inventaris pakaian akan bertambah secara atomik.')) {
      storage.receivePurchaseOrder(poId);
    }
  };

  const handleSaveSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supName.trim()) return;

    const newSup: Supplier = {
      id: `sup_${Date.now()}`,
      name: supName.trim(),
      contactPerson: supContact,
      phone: supPhone,
      address: supAddress,
      isActive: true,
    };
    storage.saveSupplier(newSup);
    setIsSupplierModalOpen(false);
    setSupName('');
    setSupContact('');
    setSupPhone('');
    setSupAddress('');
  };

  return (
    <div className="p-4 lg:p-6 space-y-5 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#223240] tracking-tight">
            Pembelian & Supplier Fashion
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manajemen rantai pasok bal pakaian thrift, distro garment, dan penerimaan PO
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-white p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setActiveTab('purchases')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'purchases'
                  ? 'bg-[#223240] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Purchase Orders ({purchases.length})
            </button>
            <button
              onClick={() => setActiveTab('suppliers')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'suppliers'
                  ? 'bg-[#223240] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Data Supplier ({suppliers.length})
            </button>
          </div>

          {activeTab === 'purchases' ? (
            <button
              onClick={() => setIsCreatePoOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#223240] hover:bg-[#1a2732] text-white rounded-xl text-xs font-bold transition shadow-sm"
            >
              <Plus className="w-4 h-4 text-[#E1A23D]" />
              <span>Buat PO Baru</span>
            </button>
          ) : (
            <button
              onClick={() => setIsSupplierModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#223240] hover:bg-[#1a2732] text-white rounded-xl text-xs font-bold transition shadow-sm"
            >
              <Plus className="w-4 h-4 text-[#E1A23D]" />
              <span>Tambah Supplier</span>
            </button>
          )}
        </div>
      </div>

      {activeTab === 'purchases' ? (
        /* Purchase Orders List */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#223240] text-white uppercase text-[10px] tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">No. PO & Tanggal</th>
                <th className="py-3 px-3">Supplier</th>
                <th className="py-3 px-3">Jumlah Item</th>
                <th className="py-3 px-3">Total Biaya PO</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {purchases.map((po) => (
                <tr key={po.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-4">
                    <p className="font-bold text-slate-900">{po.poNumber}</p>
                    <p className="text-[10px] text-slate-400 font-mono">{formatDate(po.createdAt)}</p>
                  </td>
                  <td className="py-3 px-3">
                    <p className="font-semibold text-slate-800">{po.supplierName}</p>
                    <p className="text-[10px] text-slate-500">{po.notes || '-'}</p>
                  </td>
                  <td className="py-3 px-3 font-mono">
                    {po.items.reduce((s, i) => s + i.quantity, 0)} pcs ({po.items.length} sku)
                  </td>
                  <td className="py-3 px-3 font-mono font-bold text-[#223240]">
                    {formatRupiah(po.totalAmount)}
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        po.status === 'received'
                          ? 'bg-emerald-100 text-emerald-800'
                          : po.status === 'ordered'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {po.status}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    {po.status === 'ordered' && (
                      <button
                        onClick={() => handleReceivePO(po.id)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-xs"
                      >
                        Terima Barang
                      </button>
                    )}
                    {po.status === 'received' && (
                      <span className="text-[11px] text-slate-400 font-medium">Stok Masuk ✓</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* Suppliers List */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {suppliers.map((sup) => (
            <div key={sup.id} className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-2 text-xs">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-bold text-sm text-[#223240]">{sup.name}</h4>
                  <p className="text-slate-500 font-medium">PIC: {sup.contactPerson}</p>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Aktif
                </span>
              </div>
              <div className="space-y-1 text-slate-600 pt-2 border-t border-slate-100">
                <p>Telp: {sup.phone}</p>
                {sup.email && <p>Email: {sup.email}</p>}
                <p>Alamat: {sup.address || '-'}</p>
                {sup.notes && <p className="italic text-slate-400">"{sup.notes}"</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE PO MODAL */}
      {isCreatePoOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-5 space-y-4 animate-in fade-in zoom-in-95 my-6 text-xs">
            <h3 className="font-bold text-sm text-[#223240] flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-[#E1A23D]" />
              <span>Buat Purchase Order Pakaian</span>
            </h3>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Pilih Supplier</label>
              <select
                value={selectedSupplier}
                onChange={(e) => setSelectedSupplier(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
              >
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.contactPerson})
                  </option>
                ))}
              </select>
            </div>

            {/* Line items adder */}
            <div className="p-3 bg-[#FDFBF7] rounded-xl border border-slate-200 space-y-2">
              <p className="font-bold text-slate-800">Tambahkan Varian Pakaian</p>
              <div className="space-y-2">
                <select
                  value={selectedVariantId}
                  onChange={(e) => {
                    setSelectedVariantId(e.target.value);
                    let foundV: any = null;
                    products.forEach((p) => {
                      const v = p.variants.find((v) => v.id === e.target.value);
                      if (v) foundV = v;
                    });
                    if (foundV) setOrderCost(foundV.costPrice);
                  }}
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs"
                >
                  <option value="">-- Pilih Varian Produk --</option>
                  {products.map((p) =>
                    p.variants.map((v) => (
                      <option key={v.id} value={v.id}>
                        {p.name} - Size {v.sizeLabel} ({v.colorLabel})
                      </option>
                    ))
                  )}
                </select>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block">Jumlah Unit</label>
                    <input
                      type="number"
                      min="1"
                      value={orderQty}
                      onChange={(e) => setOrderQty(Number(e.target.value))}
                      className="w-full p-1.5 border border-slate-300 rounded font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block">Harga Beli / Satuan (Rp)</label>
                    <input
                      type="number"
                      min="0"
                      value={orderCost}
                      onChange={(e) => setOrderCost(Number(e.target.value))}
                      className="w-full p-1.5 border border-slate-300 rounded font-mono"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleAddItemToPo}
                  className="w-full py-1.5 bg-slate-200 hover:bg-slate-300 font-bold rounded-lg text-slate-800"
                >
                  + Tambahkan ke Daftar PO
                </button>
              </div>

              {/* Items List in PO */}
              {poItems.length > 0 && (
                <div className="divide-y divide-slate-200 pt-2">
                  {poItems.map((item, idx) => (
                    <div key={idx} className="py-1.5 flex justify-between items-center text-xs">
                      <div>
                        <p className="font-bold text-slate-900">{item.productName}</p>
                        <p className="text-[10px] text-slate-500 font-mono">
                          {item.quantity} pcs @ {formatRupiah(item.unitCost)}
                        </p>
                      </div>
                      <span className="font-bold font-mono text-[#223240]">{formatRupiah(item.lineTotal)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Catatan PO</label>
              <input
                type="text"
                value={poNotes}
                onChange={(e) => setPoNotes(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setIsCreatePoOpen(false)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700"
              >
                Batal
              </button>
              <button
                onClick={handleSavePO}
                className="px-5 py-2 bg-[#223240] text-white font-bold rounded-lg shadow-sm"
              >
                Simpan & Terbitkan PO
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE SUPPLIER MODAL */}
      {isSupplierModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-5 space-y-4 text-xs animate-in fade-in zoom-in-95">
            <h3 className="font-bold text-sm text-[#223240] flex items-center gap-2">
              <Truck className="w-4 h-4 text-[#E1A23D]" />
              <span>Tambah Supplier Baru</span>
            </h3>

            <form onSubmit={handleSaveSupplier} className="space-y-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Nama Supplier / PT</label>
                <input
                  type="text"
                  required
                  value={supName}
                  onChange={(e) => setSupName(e.target.value)}
                  placeholder="Misal: Bandung Distro Bal Garment"
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Nama Kontak Person (PIC)</label>
                <input
                  type="text"
                  required
                  value={supContact}
                  onChange={(e) => setSupContact(e.target.value)}
                  placeholder="Misal: Pak Budi Gunawan"
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Nomor Telepon</label>
                <input
                  type="text"
                  required
                  value={supPhone}
                  onChange={(e) => setSupPhone(e.target.value)}
                  placeholder="0812-XXXX-XXXX"
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Alamat Gudang</label>
                <textarea
                  rows={2}
                  value={supAddress}
                  onChange={(e) => setSupAddress(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsSupplierModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#223240] text-white font-bold rounded-lg shadow-sm"
                >
                  Simpan Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
