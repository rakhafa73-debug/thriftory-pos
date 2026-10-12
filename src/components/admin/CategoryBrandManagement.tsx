import React, { useState } from 'react';
import { Tag, Bookmark, Plus, Check } from 'lucide-react';
import { Category, Brand, UserProfile } from '../../types';
import { storage } from '../../services/storage';

interface CategoryBrandManagementProps {
  currentUser: UserProfile;
}

export const CategoryBrandManagement: React.FC<CategoryBrandManagementProps> = ({ currentUser }) => {
  const [categories, setCategories] = useState<Category[]>(storage.getCategories());
  const [brands, setBrands] = useState<Brand[]>(storage.getBrands());

  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');

  const [newBrandName, setNewBrandName] = useState('');
  const [newBrandCountry, setNewBrandCountry] = useState('USA');

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    const cat: Category = {
      id: `cat_${Date.now()}`,
      name: newCatName.trim(),
      slug: newCatName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      description: newCatDesc.trim(),
      productCount: 0,
    };
    storage.saveCategory(cat);
    setCategories(storage.getCategories());
    setNewCatName('');
    setNewCatDesc('');
  };

  const handleAddBrand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBrandName.trim()) return;

    const br: Brand = {
      id: `brand_${Date.now()}`,
      name: newBrandName.trim(),
      countryOfOrigin: newBrandCountry,
    };
    storage.saveBrand(br);
    setBrands(storage.getBrands());
    setNewBrandName('');
  };

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-[#223240] tracking-tight">
          Kategori & Brand Pakaian
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Klasifikasi busana thrift vintage, kategori outerwear, dan arsip brand internasional
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Categories Section */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-[#E1A23D]" />
            <h3 className="font-bold text-sm text-[#223240]">Kategori Pakaian</h3>
          </div>

          <form onSubmit={handleAddCategory} className="flex gap-2">
            <input
              type="text"
              required
              placeholder="Nama kategori baru..."
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              className="flex-1 p-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-[#223240] text-white font-bold text-xs rounded-lg hover:bg-[#1a2732] shrink-0"
            >
              + Tambah
            </button>
          </form>

          <div className="divide-y divide-slate-100 text-xs">
            {categories.map((c) => (
              <div key={c.id} className="py-2.5 flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-900">{c.name}</p>
                  <p className="text-[11px] text-slate-500">{c.description || 'Tanpa deskripsi'}</p>
                </div>
                <span className="text-[10px] font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                  {c.slug}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Brands Section */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center gap-2">
            <Bookmark className="w-4 h-4 text-[#E1A23D]" />
            <h3 className="font-bold text-sm text-[#223240]">Brand & Apparel Label</h3>
          </div>

          <form onSubmit={handleAddBrand} className="flex gap-2">
            <input
              type="text"
              required
              placeholder="Nama brand pakaian..."
              value={newBrandName}
              onChange={(e) => setNewBrandName(e.target.value)}
              className="flex-1 p-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-[#223240] text-white font-bold text-xs rounded-lg hover:bg-[#1a2732] shrink-0"
            >
              + Tambah
            </button>
          </form>

          <div className="divide-y divide-slate-100 text-xs">
            {brands.map((b) => (
              <div key={b.id} className="py-2.5 flex items-center justify-between">
                <p className="font-bold text-slate-900">{b.name}</p>
                <span className="text-[10px] font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                  {b.countryOfOrigin || 'International'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
