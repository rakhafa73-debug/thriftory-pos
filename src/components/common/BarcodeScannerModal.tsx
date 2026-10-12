import React, { useState } from 'react';
import { Camera, X, Barcode, Search, AlertCircle, CheckCircle } from 'lucide-react';
import { ProductVariant, ProductWithVariants } from '../../types';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (barcodeOrSku: string) => void;
  products: ProductWithVariants[];
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  onScanSuccess,
  products,
}) => {
  const [manualCode, setManualCode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successFeedback, setSuccessFeedback] = useState<string | null>(null);

  if (!isOpen) return null;

  // Flatten sample items to provide instant test clickers
  const sampleVariants: { name: string; variant: ProductVariant }[] = [];
  products.forEach(p => {
    p.variants.forEach(v => {
      sampleVariants.push({ name: `${p.name} (${v.sizeLabel})`, variant: v });
    });
  });

  const handleTestScan = (code: string) => {
    setErrorMsg('');
    // Validate barcode
    let found = false;
    for (const p of products) {
      if (p.variants.some(v => v.barcode === code || v.sku === code)) {
        found = true;
        break;
      }
    }

    if (!found) {
      setErrorMsg(`Barcode / SKU "${code}" tidak terdaftar dalam sistem katalog toko!`);
      return;
    }

    setSuccessFeedback(`Berhasil memindai: ${code}`);
    setTimeout(() => {
      onScanSuccess(code);
      setSuccessFeedback(null);
      setManualCode('');
      onClose();
    }, 400);
  };

  const handleSubmitManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    handleTestScan(manualCode.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-[#223240] text-white">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-[#E1A23D]" />
            <h3 className="text-sm font-bold">Pemindai Barcode / Kamera POS</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/10 text-slate-300 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Simulated Camera Viewfinder */}
          <div className="relative aspect-16/9 bg-slate-900 rounded-xl overflow-hidden flex flex-col items-center justify-center text-white border border-slate-700 shadow-inner">
            <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 h-0.5 bg-rose-500/80 shadow-[0_0_12px_rgba(239,68,68,0.8)] animate-pulse" />
            
            {/* Viewfinder Target Box */}
            <div className="w-48 h-28 border-2 border-[#E1A23D] rounded-lg relative flex items-center justify-center">
              <span className="text-[11px] text-[#E1A23D] font-mono tracking-wider font-semibold">
                ARAHKAN BARCODE KE SINI
              </span>
            </div>

            <p className="absolute bottom-3 text-xs text-slate-300 flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5 text-slate-400" />
              <span>Kamera Aktif & Sensor Barcode Siap</span>
            </p>
          </div>

          {/* Feedback Alerts */}
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-700">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <p className="font-medium">{errorMsg}</p>
            </div>
          )}

          {successFeedback && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-xs text-emerald-800">
              <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
              <p className="font-semibold">{successFeedback}</p>
            </div>
          )}

          {/* Manual Barcode Input */}
          <form onSubmit={handleSubmitManual} className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">
              Input Manual Barcode / SKU Scanner Fisik
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Barcode className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Ketik angka barcode atau scan USB..."
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#223240] focus:bg-white font-mono"
                  autoFocus
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-[#223240] text-white text-xs font-bold rounded-lg hover:bg-[#1a2732] transition"
              >
                Cari
              </button>
            </div>
          </form>

          {/* Instant Quick-Test Barcodes for Demo */}
          <div className="pt-2 border-t border-slate-100">
            <p className="text-[11px] font-bold text-slate-500 mb-2 uppercase tracking-wider">
              Uji Cepat Barcode Sampel Katalog:
            </p>
            <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto pr-1">
              {sampleVariants.slice(0, 6).map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleTestScan(item.variant.barcode)}
                  className="p-2 text-left bg-[#FDFBF7] hover:bg-amber-50 border border-slate-200 hover:border-[#E1A23D] rounded-lg transition group"
                >
                  <p className="text-[11px] font-bold text-slate-800 group-hover:text-[#223240] truncate">
                    {item.name}
                  </p>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono mt-0.5">
                    <span>{item.variant.barcode}</span>
                    <span className="text-emerald-700 font-bold">Stok: {item.variant.stock}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 border border-slate-300 rounded-lg bg-white"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
