import React, { useState } from 'react';
import {
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  Archive,
  Edit,
  Eye,
  Barcode,
  Layers,
  Shirt,
  CheckCircle,
  AlertCircle,
  X,
  FileSpreadsheet,
} from 'lucide-react';
import {
  ProductWithVariants,
  ProductVariant,
  Category,
  Brand,
  ProductType,
  ConditionGrade,
  UserProfile,
} from '../../types';
import { storage } from '../../services/storage';
import { formatRupiah, generateBarcodeString, generateSKU, formatDate } from '../../utils/formatters';

interface ProductManagementProps {
  currentUser: UserProfile;
  onSelectPrintBarcode?: (variant: ProductVariant, productName: string) => void;
}

export const ProductManagement: React.FC<ProductManagementProps> = ({
  currentUser,
  onSelectPrintBarcode,
}) => {
  const [products, setProducts] = useState<ProductWithVariants[]>(storage.getProducts());
  const categories = storage.getCategories();
  const brands = storage.getBrands();

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductWithVariants | null>(null);
  const [detailProduct, setDetailProduct] = useState<ProductWithVariants | null>(null);

  // Form State for Create / Edit
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState(categories[0]?.id || '');
  const [formBrand, setFormBrand] = useState(brands[0]?.id || '');
  const [formType, setFormType] = useState<ProductType>('thrift');
  const [formDescription, setFormDescription] = useState('');
  const [formImageUrl, setFormImageUrl] = useState('/src/assets/images/vintage_washed_tee_1791782639024.jpg');
  const [formIsOneOfOne, setFormIsOneOfOne] = useState(true);

  // Initial Variant inputs
  const [formSize, setFormSize] = useState('L');
  const [formColor, setFormColor] = useState('Hitam');
  const [formCondition, setFormCondition] = useState<ConditionGrade>('grade_a');
  const [formCostPrice, setFormCostPrice] = useState(150000);
  const [formSellingPrice, setFormSellingPrice] = useState(350000);
  const [formStock, setFormStock] = useState(1);

  const isCashier = currentUser.role === 'cashier';

  const reload = () => {
    setProducts(storage.getProducts());
  };

  const handleOpenCreate = () => {
    setEditingProduct(null);
    setFormName('');
    setFormCategory(categories[0]?.id || '');
    setFormBrand(brands[0]?.id || '');
    setFormType('thrift');
    setFormDescription('');
    setFormImageUrl('/src/assets/images/vintage_washed_tee_1791782639024.jpg');
    setFormIsOneOfOne(true);
    setFormSize('L');
    setFormColor('Hitam');
    setFormCondition('grade_a');
    setFormCostPrice(150000);
    setFormSellingPrice(350000);
    setFormStock(1);
    setIsCreateModalOpen(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      alert('Nama produk tidak boleh kosong');
      return;
    }

    const prodId = editingProduct ? editingProduct.id : `prod_${Date.now()}`;
    const brandObj = brands.find(b => b.id === formBrand);
    const catObj = categories.find(c => c.id === formCategory);

    const baseProduct = {
      id: prodId,
      storeId: currentUser.storeId,
      categoryId: formCategory,
      brandId: formBrand,
      name: formName.trim(),
      slug: formName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      productType: formType,
      description: formDescription,
      primaryImageUrl: formImageUrl,
      isOneOfOne: formIsOneOfOne,
      isActive: true,
      createdAt: editingProduct ? editingProduct.createdAt : new Date().toISOString(),
    };

    let variantsToSave: ProductVariant[] = [];
    if (editingProduct && editingProduct.variants.length > 0) {
      // Preserve existing variants or update first
      variantsToSave = editingProduct.variants;
    } else {
      // Create primary variant
      const brandName = brandObj?.name || 'GEN';
      const catName = catObj?.name || 'APP';
      const generatedBarcode = generateBarcodeString();
      const generatedSku = generateSKU(brandName, catName, formSize, formIsOneOfOne);

      variantsToSave = [
        {
          id: `var_${Date.now()}_1`,
          productId: prodId,
          sku: generatedSku,
          barcode: generatedBarcode,
          sizeLabel: formSize,
          colorLabel: formColor,
          conditionGrade: formIsOneOfOne ? formCondition : undefined,
          costPrice: Number(formCostPrice),
          sellingPrice: Number(formSellingPrice),
          stock: formIsOneOfOne ? 1 : Number(formStock),
          minStockAlert: 1,
          isActive: true,
        },
      ];
    }

    storage.saveProduct(baseProduct, variantsToSave);
    setIsCreateModalOpen(false);
    reload();
  };

  const handleArchive = (productId: string) => {
    if (window.confirm('Arsipkan produk ini? Data historis transaksi akan tetap terjaga.')) {
      storage.archiveProduct(productId);
      reload();
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['ID', 'Nama Produk', 'Brand', 'Kategori', 'Tipe', 'SKU', 'Barcode', 'Ukuran', 'Warna', 'Harga Jual', 'Stok'];
    if (!isCashier) headers.push('Harga Modal');

    const rows: string[] = [headers.join(',')];
    products.forEach(p => {
      p.variants.forEach(v => {
        const row = [
          `"${p.id}"`,
          `"${p.name.replace(/"/g, '""')}"`,
          `"${p.brandName || ''}"`,
          `"${p.categoryName || ''}"`,
          `"${p.productType}"`,
          `"${v.sku}"`,
          `"${v.barcode}"`,
          `"${v.sizeLabel}"`,
          `"${v.colorLabel}"`,
          v.sellingPrice,
          v.stock,
        ];
        if (!isCashier) row.push(v.costPrice.toString());
        rows.push(row.join(','));
      });
    });

    const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `katalog_thriftory_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.variants.some(v => v.sku.toLowerCase().includes(search.toLowerCase()) || v.barcode.includes(search));
    const matchesCategory = categoryFilter === 'all' || p.categoryId === categoryFilter;
    const matchesType = typeFilter === 'all' || p.productType === typeFilter;
    return matchesSearch && matchesCategory && matchesType;
  });

  return (
    <div className="p-4 lg:p-6 space-y-5 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#223240] tracking-tight">
            Manajemen Produk Fashion
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Katalog pakaian thrift, vintage one-of-one, dan distro pakaian jadi
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold shadow-2xs transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Ekspor CSV</span>
          </button>

          {!isCashier && (
            <button
              onClick={handleOpenCreate}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#223240] hover:bg-[#1a2732] text-white rounded-xl text-xs font-bold shadow-sm transition"
            >
              <Plus className="w-4 h-4 text-[#E1A23D]" />
              <span>Tambah Produk Baru</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama, SKU, atau barcode..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#223240]"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="p-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none"
          >
            <option value="all">Semua Kategori</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="p-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none"
          >
            <option value="all">Semua Tipe Produk</option>
            <option value="thrift">Thrift (One-of-One)</option>
            <option value="vintage">Vintage</option>
            <option value="distro">Distro</option>
            <option value="new">Produk Baru</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#223240] text-white uppercase text-[10px] tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Produk</th>
                <th className="py-3 px-3">Tipe / Kategori</th>
                <th className="py-3 px-3">Varian & SKU</th>
                <th className="py-3 px-3">Stok Unit</th>
                {!isCashier && <th className="py-3 px-3">Harga Modal</th>}
                <th className="py-3 px-3">Harga Jual</th>
                <th className="py-3 px-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Tidak ada produk fashion ditemukan
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const mainVariant = p.variants[0];
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition">
                      {/* Name & Photo */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={p.primaryImageUrl}
                            alt={p.name}
                            referrerPolicy="no-referrer"
                            className="w-11 h-11 object-cover rounded-lg bg-slate-100 border border-slate-200 shrink-0"
                          />
                          <div>
                            <p className="font-bold text-slate-900 leading-snug">{p.name}</p>
                            <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                              {p.brandName} · Dibuat: {formatDate(p.createdAt)}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Type & Category */}
                      <td className="py-3 px-3">
                        <span className="inline-block px-2 py-0.5 bg-slate-100 rounded text-[10px] font-bold uppercase text-slate-700">
                          {p.productType}
                        </span>
                        <p className="text-[11px] text-slate-500 mt-0.5">{p.categoryName}</p>
                      </td>

                      {/* Variants & SKU */}
                      <td className="py-3 px-3">
                        <p className="font-mono font-medium text-slate-700">
                          {mainVariant?.sku || '-'}
                        </p>
                        <p className="text-[10px] text-slate-400 font-mono">
                          {p.variants.length} varian aktif
                        </p>
                      </td>

                      {/* Stock */}
                      <td className="py-3 px-3">
                        <span
                          className={`font-bold tabular-nums ${
                            (p.totalStock || 0) <= 1
                              ? 'text-rose-600'
                              : (p.totalStock || 0) <= 3
                              ? 'text-amber-600'
                              : 'text-emerald-700'
                          }`}
                        >
                          {p.totalStock || 0} unit
                        </span>
                      </td>

                      {/* Cost Price (RESTRICTED: HIDDEN FROM CASHIER) */}
                      {!isCashier && (
                        <td className="py-3 px-3 font-mono tabular-nums text-slate-600">
                          {mainVariant ? formatRupiah(mainVariant.costPrice) : '-'}
                        </td>
                      )}

                      {/* Selling Price */}
                      <td className="py-3 px-3 font-mono font-bold tabular-nums text-[#223240]">
                        {formatRupiah(p.minPrice || 0)}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Print Barcode Label */}
                          {mainVariant && onSelectPrintBarcode && (
                            <button
                              onClick={() => onSelectPrintBarcode(mainVariant, p.name)}
                              title="Cetak Label Barcode Tag"
                              className="p-1.5 text-slate-500 hover:text-[#223240] hover:bg-slate-100 rounded"
                            >
                              <Barcode className="w-4 h-4 text-[#E1A23D]" />
                            </button>
                          )}

                          {/* Detail View */}
                          <button
                            onClick={() => setDetailProduct(p)}
                            title="Detail Produk"
                            className="p-1.5 text-slate-500 hover:text-[#223240] hover:bg-slate-100 rounded"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Archive (Admin only) */}
                          {!isCashier && (
                            <button
                              onClick={() => handleArchive(p.id)}
                              title="Arsipkan Produk"
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded"
                            >
                              <Archive className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE PRODUCT MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 my-6 animate-in fade-in zoom-in-95">
            <div className="p-4 bg-[#223240] text-white flex items-center justify-between">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Shirt className="w-4 h-4 text-[#E1A23D]" />
                <span>Tambah Produk Fashion Baru</span>
              </h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-300 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Nama Produk Fashion</label>
                <input
                  type="text"
                  required
                  placeholder="Misal: 1996 Nirvana In Utero Vintage Tee"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#223240]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Kategori</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Brand</label>
                  <select
                    value={formBrand}
                    onChange={(e) => setFormBrand(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
                  >
                    {brands.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Tipe Produk</label>
                  <select
                    value={formType}
                    onChange={(e) => {
                      const t = e.target.value as ProductType;
                      setFormType(t);
                      setFormIsOneOfOne(t === 'thrift');
                    }}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
                  >
                    <option value="thrift">Thrift (1-of-1)</option>
                    <option value="vintage">Vintage Archive</option>
                    <option value="distro">Distro Pakaian</option>
                    <option value="new">Produk Baru</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Foto Sampel</label>
                  <select
                    value={formImageUrl}
                    onChange={(e) => setFormImageUrl(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
                  >
                    <option value="/src/assets/images/vintage_washed_tee_1791782639024.jpg">Vintage Washed Graphic Tee</option>
                    <option value="/src/assets/images/retro_denim_jacket_1791782653407.jpg">Denim Trucker Jacket</option>
                    <option value="/src/assets/images/vintage_windbreaker_1791782667705.jpg">Colorblock Windbreaker</option>
                    <option value="/src/assets/images/distro_beige_hoodie_1791782679718.jpg">Boxy Washed Beige Hoodie</option>
                  </select>
                </div>
              </div>

              {/* Varian Awal */}
              <div className="p-3.5 bg-[#FDFBF7] rounded-xl border border-slate-200 space-y-3">
                <p className="font-bold text-[#223240] uppercase tracking-wider text-[11px]">
                  Detail Varian & Harga Produk
                </p>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block">Ukuran</label>
                    <input
                      type="text"
                      value={formSize}
                      onChange={(e) => setFormSize(e.target.value)}
                      placeholder="L / XL / Free Size"
                      className="w-full p-1.5 bg-white border border-slate-300 rounded"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block">Warna</label>
                    <input
                      type="text"
                      value={formColor}
                      onChange={(e) => setFormColor(e.target.value)}
                      placeholder="Hitam Washed"
                      className="w-full p-1.5 bg-white border border-slate-300 rounded"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block">Kondisi</label>
                    <select
                      value={formCondition}
                      onChange={(e) => setFormCondition(e.target.value as ConditionGrade)}
                      className="w-full p-1.5 bg-white border border-slate-300 rounded"
                    >
                      <option value="mint">Mint (Like New)</option>
                      <option value="grade_a">Grade A</option>
                      <option value="grade_b">Grade B</option>
                      <option value="vintage_fade">Vintage Fade</option>
                      <option value="distressed">Distressed</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block">Harga Modal (Rp)</label>
                    <input
                      type="number"
                      value={formCostPrice}
                      onChange={(e) => setFormCostPrice(Number(e.target.value))}
                      className="w-full p-1.5 bg-white border border-slate-300 rounded font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block">Harga Jual (Rp)</label>
                    <input
                      type="number"
                      value={formSellingPrice}
                      onChange={(e) => setFormSellingPrice(Number(e.target.value))}
                      className="w-full p-1.5 bg-white border border-slate-300 rounded font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block">
                      {formIsOneOfOne ? 'Stok (1-of-1)' : 'Stok Awal'}
                    </label>
                    <input
                      type="number"
                      disabled={formIsOneOfOne}
                      value={formIsOneOfOne ? 1 : formStock}
                      onChange={(e) => setFormStock(Number(e.target.value))}
                      className="w-full p-1.5 bg-white border border-slate-300 rounded font-mono disabled:bg-slate-100"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Deskripsi Singkat</label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Kondisi kain, tag baju, single stitch..."
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 bg-white"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#223240] text-white font-bold rounded-lg shadow-sm hover:bg-[#1a2732]"
                >
                  Simpan Produk & Varian
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DETAIL PRODUCT MODAL */}
      {detailProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 p-5 space-y-4">
            <div className="flex justify-between items-start">
              <div className="flex gap-3">
                <img
                  src={detailProduct.primaryImageUrl}
                  alt={detailProduct.name}
                  referrerPolicy="no-referrer"
                  className="w-16 h-16 object-cover rounded-xl border border-slate-200"
                />
                <div>
                  <h3 className="font-bold text-sm text-[#223240]">{detailProduct.name}</h3>
                  <p className="text-xs text-slate-500 font-mono">
                    {detailProduct.brandName} · {detailProduct.productType.toUpperCase()}
                  </p>
                </div>
              </div>
              <button onClick={() => setDetailProduct(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              {detailProduct.description || 'Tidak ada deskripsi tambahan.'}
            </p>

            <div className="space-y-2">
              <p className="font-bold text-xs text-slate-800">Daftar Varian & Stok:</p>
              {detailProduct.variants.map((v) => (
                <div key={v.id} className="p-2.5 rounded-lg border border-slate-200 text-xs flex justify-between items-center">
                  <div>
                    <p className="font-bold">{v.sizeLabel} · {v.colorLabel}</p>
                    <p className="text-[10px] text-slate-400 font-mono">SKU: {v.sku} | Barcode: {v.barcode}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold font-mono text-[#223240]">{formatRupiah(v.sellingPrice)}</p>
                    <p className="text-[10px] font-semibold text-emerald-600">Stok: {v.stock}</p>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setDetailProduct(null)}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 font-bold text-xs text-slate-700 rounded-lg"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
