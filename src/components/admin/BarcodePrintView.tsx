import React, { useState } from 'react';
import { Barcode as BarcodeIcon, Printer, Check, Copy } from 'lucide-react';
import { ProductVariant, ProductWithVariants, Store } from '../../types';
import { storage } from '../../services/storage';
import { generateBarcodeLines } from '../../utils/barcode';
import { formatRupiah } from '../../utils/formatters';

interface BarcodePrintViewProps {
  store: Store;
  selectedVariant?: ProductVariant;
  selectedProductName?: string;
}

export const BarcodePrintView: React.FC<BarcodePrintViewProps> = ({
  store,
  selectedVariant,
  selectedProductName,
}) => {
  const products = storage.getProducts();

  // Selected variant for single printing
  const [activeVariantId, setActiveVariantId] = useState<string>(
    selectedVariant?.id || products[0]?.variants[0]?.id || ''
  );
  const [copies, setCopies] = useState<number>(3);
  const [labelSize, setLabelSize] = useState<'40x30' | '50x30'>('40x30');

  // Find variant details
  let currentVar: ProductVariant | undefined;
  let currentProd: ProductWithVariants | undefined;

  for (const p of products) {
    const v = p.variants.find((v) => v.id === activeVariantId);
    if (v) {
      currentVar = v;
      currentProd = p;
      break;
    }
  }

  const handlePrint = () => {
    window.print();
  };

  const barcodeBars = currentVar ? generateBarcodeLines(currentVar.barcode) : [];

  return (
    <div className="p-4 lg:p-6 space-y-5 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#223240] tracking-tight">
            Cetak Label Barcode & Price Tag Busana
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Generator barcode sticker thermal (58mm / 40x30mm) untuk pakaian thrift & distro
          </p>
        </div>

        <button
          onClick={handlePrint}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#223240] hover:bg-[#1a2732] text-white rounded-xl text-xs font-bold shadow-sm transition self-start"
        >
          <Printer className="w-3.5 h-3.5 text-[#E1A23D]" />
          <span>Cetak Label Barcode ({copies} Label)</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controls Column */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-4 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">Pilih Produk & Varian</label>
            <select
              value={activeVariantId}
              onChange={(e) => setActiveVariantId(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
            >
              {products.map((p) =>
                p.variants.map((v) => (
                  <option key={v.id} value={v.id}>
                    {p.name} - {v.sizeLabel} ({v.colorLabel})
                  </option>
                ))
              )}
            </select>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Jumlah Lembar Stiker</label>
            <input
              type="number"
              min="1"
              max="50"
              value={copies}
              onChange={(e) => setCopies(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Format Ukuran Kertas</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setLabelSize('40x30')}
                className={`p-2 rounded-lg border font-bold text-xs ${
                  labelSize === '40x30' ? 'bg-[#223240] text-white' : 'bg-slate-50 text-slate-700'
                }`}
              >
                40 x 30 mm
              </button>
              <button
                type="button"
                onClick={() => setLabelSize('50x30')}
                className={`p-2 rounded-lg border font-bold text-xs ${
                  labelSize === '50x30' ? 'bg-[#223240] text-white' : 'bg-slate-50 text-slate-700'
                }`}
              >
                50 x 30 mm
              </button>
            </div>
          </div>

          {currentVar && (
            <div className="p-3 bg-[#FDFBF7] rounded-xl border border-slate-200 space-y-1 font-mono text-[11px]">
              <p>SKU: <strong>{currentVar.sku}</strong></p>
              <p>Barcode: <strong>{currentVar.barcode}</strong></p>
              <p>Harga: <strong>{formatRupiah(currentVar.sellingPrice)}</strong></p>
            </div>
          )}
        </div>

        {/* Printable Label Preview Column */}
        <div className="lg:col-span-2 p-5 bg-slate-100 rounded-2xl border border-slate-200 flex flex-col items-center justify-center min-h-[300px]">
          <p className="text-xs font-bold text-slate-500 mb-4 uppercase tracking-wider">
            Preview Lembar Stiker Thermal (Siap Cetak)
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {Array.from({ length: copies }).map((_, idx) => (
              <div
                key={idx}
                className="w-48 bg-white p-3 rounded-lg border border-slate-300 shadow-xs flex flex-col items-center justify-between text-center select-none"
              >
                <div>
                  <p className="font-extrabold text-[10px] tracking-wider text-[#223240] uppercase">
                    THRIFTORY VINTAGE
                  </p>
                  <p className="font-bold text-[11px] text-slate-900 line-clamp-1 mt-0.5">
                    {currentProd?.name}
                  </p>
                  <p className="text-[10px] text-slate-500 font-mono">
                    Size: <strong>{currentVar?.sizeLabel}</strong> · {currentVar?.colorLabel}
                  </p>
                </div>

                {/* SVG Barcode Vector Graphics */}
                <div className="my-1.5 flex flex-col items-center">
                  <svg className="w-36 h-10" viewBox="0 0 160 36">
                    {barcodeBars.map((bar, bIdx) => (
                      <rect key={bIdx} x={bar.x} y="0" width={bar.width} height="36" fill="#111827" />
                    ))}
                  </svg>
                  <span className="text-[10px] font-mono tracking-widest text-slate-700 font-semibold">
                    {currentVar?.barcode}
                  </span>
                </div>

                <div className="w-full pt-1 border-t border-slate-200 flex justify-between items-center text-[10px] font-mono">
                  <span className="text-slate-400 truncate max-w-[80px]">{currentVar?.sku}</span>
                  <span className="font-black text-xs text-[#223240]">
                    {formatRupiah(currentVar?.sellingPrice || 0)}
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
