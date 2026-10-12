import React, { useState, useEffect } from 'react';
import {
  Search,
  Camera,
  ShoppingCart,
  Receipt,
  RefreshCw,
  Plus,
  Minus,
  Trash2,
  DollarSign,
  User,
  ArrowLeft,
  CheckCircle,
  WifiOff,
  Wifi,
} from 'lucide-react';
import {
  ProductWithVariants,
  ProductVariant,
  CartItem,
  UserProfile,
  Store,
  Sale,
  PaymentMethod,
} from '../../types';
import { storage } from '../../services/storage';
import { formatRupiah, parseRupiahInput } from '../../utils/formatters';
import { BarcodeScannerModal } from '../common/BarcodeScannerModal';
import { ReceiptModal } from '../common/ReceiptModal';

interface MobilePOSViewProps {
  currentUser: UserProfile;
  store: Store;
}

export const MobilePOSView: React.FC<MobilePOSViewProps> = ({
  currentUser,
  store,
}) => {
  const [activeTab, setActiveTab] = useState<'katalog' | 'keranjang' | 'riwayat'>('katalog');
  const [products, setProducts] = useState<ProductWithVariants[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);
  const [salesHistory, setSalesHistory] = useState<Sale[]>([]);

  // Variant Modal
  const [selectedProduct, setSelectedProduct] = useState<ProductWithVariants | null>(null);

  // Quick Mobile Checkout
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [cashInput, setCashInput] = useState<string>('');

  const loadData = () => {
    setProducts(storage.getProducts().filter(p => p.isActive));
    setSalesHistory(storage.getSales().slice(0, 20));
  };

  useEffect(() => {
    loadData();
  }, []);

  const addToCart = (product: ProductWithVariants, variant: ProductVariant) => {
    setCart(prev => {
      const exist = prev.find(i => i.variantId === variant.id);
      if (exist) {
        if (exist.quantity >= variant.stock) return prev;
        return prev.map(i =>
          i.variantId === variant.id
            ? { ...i, quantity: i.quantity + 1, lineTotal: (i.quantity + 1) * i.sellingPrice }
            : i
        );
      }
      return [
        ...prev,
        {
          variantId: variant.id,
          productId: product.id,
          productName: product.name,
          imageUrl: product.primaryImageUrl,
          sku: variant.sku,
          barcode: variant.barcode,
          sizeLabel: variant.sizeLabel,
          colorLabel: variant.colorLabel,
          conditionGrade: variant.conditionGrade,
          isOneOfOne: product.isOneOfOne,
          sellingPrice: variant.sellingPrice,
          costPrice: variant.costPrice,
          quantity: 1,
          availableStock: variant.stock,
          discountAmount: 0,
          lineTotal: variant.sellingPrice,
        },
      ];
    });
    setSelectedProduct(null);
  };

  const totalAmount = cart.reduce((sum, i) => sum + i.lineTotal, 0);
  const totalQty = cart.reduce((sum, i) => sum + i.quantity, 0);

  const handleCheckout = () => {
    const cashVal = paymentMethod === 'cash' ? parseRupiahInput(cashInput) : totalAmount;
    const res = storage.checkout(cart, paymentMethod, cashVal);
    if (res.success && res.sale) {
      setCompletedSale(res.sale);
      setCart([]);
      setIsCheckoutOpen(false);
      loadData();
    }
  };

  const isOffline = storage.isOffline();

  return (
    <div className="min-h-[calc(100vh-60px)] bg-slate-900 flex items-center justify-center p-2 sm:p-6">
      {/* Mobile Device Frame */}
      <div className="w-full max-w-md bg-[#FDFBF7] rounded-[36px] shadow-2xl border-8 border-slate-800 overflow-hidden flex flex-col h-[780px] relative select-none">
        {/* Device Status Bar */}
        <div className="bg-[#223240] text-white px-6 pt-3 pb-2 flex items-center justify-between text-[11px] font-mono">
          <span>09:41</span>
          <div className="w-20 h-4 bg-slate-800 rounded-full mx-auto" />
          <div className="flex items-center gap-1.5">
            {isOffline ? <WifiOff className="w-3 h-3 text-rose-400" /> : <Wifi className="w-3 h-3 text-emerald-400" />}
            <span>100%</span>
          </div>
        </div>

        {/* Mobile Header */}
        <div className="bg-[#223240] text-white px-4 py-3 flex items-center justify-between shadow-xs">
          <div>
            <h2 className="font-extrabold text-sm tracking-tight font-sans">THRIFTORY MOBILE</h2>
            <p className="text-[10px] text-[#E1A23D] font-mono">
              {currentUser.fullName.split(' ')[0]} ({currentUser.role})
            </p>
          </div>
          <button
            onClick={() => setIsScannerOpen(true)}
            className="p-2 rounded-full bg-[#E1A23D] text-[#223240] hover:bg-amber-400 shadow-xs"
          >
            <Camera className="w-4 h-4" />
          </button>
        </div>

        {/* Body View based on tab */}
        <div className="flex-1 overflow-y-auto pb-20">
          {activeTab === 'katalog' && (
            <div className="p-3 space-y-3">
              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari pakaian thrift / distro..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl shadow-2xs"
                />
              </div>

              {/* Product Grid */}
              <div className="grid grid-cols-2 gap-2.5">
                {products
                  .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map(p => (
                    <div
                      key={p.id}
                      onClick={() => setSelectedProduct(p)}
                      className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs cursor-pointer active:scale-98 transition flex flex-col justify-between"
                    >
                      <div className="relative aspect-square bg-slate-100">
                        <img
                          src={p.primaryImageUrl}
                          alt={p.name}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#223240]/90 text-white uppercase">
                          {p.productType}
                        </span>
                      </div>
                      <div className="p-2">
                        <h4 className="text-[11px] font-bold text-slate-900 line-clamp-1">{p.name}</h4>
                        <p className="text-[10px] text-slate-500 font-mono mt-0.5">{p.brandName}</p>
                        <p className="text-xs font-black text-[#223240] mt-1 tabular-nums">
                          {formatRupiah(p.minPrice || 0)}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {activeTab === 'keranjang' && (
            <div className="p-3 space-y-3">
              <h3 className="font-bold text-xs text-slate-700 uppercase tracking-wider">
                Item Dalam Keranjang ({totalQty})
              </h3>

              {cart.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">Keranjang masih kosong</div>
              ) : (
                <div className="space-y-2">
                  {cart.map(item => (
                    <div key={item.variantId} className="p-2.5 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                      <div className="leading-tight">
                        <p className="font-bold text-xs text-slate-900">{item.productName}</p>
                        <p className="text-[10px] text-slate-500 font-mono">{item.sizeLabel} · {item.colorLabel}</p>
                        <p className="text-xs font-bold text-[#223240] mt-0.5">{formatRupiah(item.sellingPrice)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs font-mono">{item.quantity}x</span>
                        <span className="font-black text-xs text-[#223240] tabular-nums">
                          {formatRupiah(item.lineTotal)}
                        </span>
                      </div>
                    </div>
                  ))}

                  <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2">
                    <div className="flex justify-between text-xs font-bold">
                      <span>Total:</span>
                      <span className="text-[#223240] text-sm">{formatRupiah(totalAmount)}</span>
                    </div>
                    <button
                      onClick={() => {
                        setIsCheckoutOpen(true);
                        setCashInput(totalAmount.toString());
                      }}
                      className="w-full py-2.5 bg-[#223240] text-white rounded-lg font-bold text-xs shadow-md"
                    >
                      Proses Pembayaran Mobile
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'riwayat' && (
            <div className="p-3 space-y-2">
              <h3 className="font-bold text-xs text-slate-700 uppercase tracking-wider">
                Transaksi Terkini
              </h3>
              {salesHistory.map(s => (
                <div key={s.id} className="p-2.5 bg-white rounded-xl border border-slate-200 space-y-1 text-xs">
                  <div className="flex justify-between font-bold">
                    <span>{s.invoiceNumber}</span>
                    <span className="text-[#223240]">{formatRupiah(s.totalAmount)}</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>{s.items.length} item · {s.paymentMethod.toUpperCase()}</span>
                    <span className={s.syncStatus === 'synced' ? 'text-emerald-600' : 'text-amber-600 font-bold'}>
                      {s.syncStatus}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Variant Bottom Sheet */}
        {selectedProduct && (
          <div className="absolute inset-0 bg-black/60 z-30 flex items-end">
            <div className="w-full bg-white rounded-t-2xl p-4 space-y-3 max-h-[60%] overflow-y-auto">
              <div className="flex justify-between items-center">
                <h4 className="font-bold text-xs text-slate-900">{selectedProduct.name}</h4>
                <button onClick={() => setSelectedProduct(null)} className="text-slate-400">✕</button>
              </div>
              <div className="space-y-1.5">
                {selectedProduct.variants.map(v => (
                  <button
                    key={v.id}
                    disabled={v.stock <= 0}
                    onClick={() => addToCart(selectedProduct, v)}
                    className="w-full p-2.5 rounded-lg border border-slate-200 text-left flex justify-between items-center active:bg-amber-50"
                  >
                    <div>
                      <p className="font-bold text-xs">{v.sizeLabel} ({v.colorLabel})</p>
                      <p className="text-[10px] text-slate-500">Stok: {v.stock}</p>
                    </div>
                    <span className="font-bold text-xs text-[#223240]">{formatRupiah(v.sellingPrice)}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Mobile Checkout Modal */}
        {isCheckoutOpen && (
          <div className="absolute inset-0 bg-black/60 z-30 flex items-end">
            <div className="w-full bg-white rounded-t-2xl p-4 space-y-3">
              <h4 className="font-bold text-sm text-[#223240]">Konfirmasi Bayar Mobile</h4>
              <p className="text-xl font-black text-[#223240] text-center font-sans">{formatRupiah(totalAmount)}</p>
              
              <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                <button
                  onClick={() => setPaymentMethod('cash')}
                  className={`p-2 rounded-lg border ${paymentMethod === 'cash' ? 'bg-[#223240] text-white' : 'bg-slate-50'}`}
                >
                  Tunai
                </button>
                <button
                  onClick={() => setPaymentMethod('qris')}
                  className={`p-2 rounded-lg border ${paymentMethod === 'qris' ? 'bg-[#223240] text-white' : 'bg-slate-50'}`}
                >
                  QRIS
                </button>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setIsCheckoutOpen(false)}
                  className="flex-1 py-2 text-xs font-bold border border-slate-300 rounded-lg"
                >
                  Batal
                </button>
                <button
                  onClick={handleCheckout}
                  className="flex-1 py-2 text-xs font-bold bg-[#223240] text-white rounded-lg shadow-sm"
                >
                  Selesai
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Mobile Floating Bottom Bar */}
        <div className="absolute bottom-0 inset-x-0 bg-white border-t border-slate-200 px-4 py-2 flex items-center justify-around z-20 shadow-lg">
          <button
            onClick={() => setActiveTab('katalog')}
            className={`flex flex-col items-center gap-0.5 text-[10px] font-bold ${
              activeTab === 'katalog' ? 'text-[#223240]' : 'text-slate-400'
            }`}
          >
            <Search className="w-4 h-4" />
            <span>Katalog</span>
          </button>

          <button
            onClick={() => setActiveTab('keranjang')}
            className={`flex flex-col items-center gap-0.5 text-[10px] font-bold relative ${
              activeTab === 'keranjang' ? 'text-[#223240]' : 'text-slate-400'
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
            {totalQty > 0 && (
              <span className="absolute -top-1 -right-2 w-4 h-4 rounded-full bg-[#E1A23D] text-[#223240] flex items-center justify-center text-[9px]">
                {totalQty}
              </span>
            )}
            <span>Keranjang</span>
          </button>

          <button
            onClick={() => setActiveTab('riwayat')}
            className={`flex flex-col items-center gap-0.5 text-[10px] font-bold ${
              activeTab === 'riwayat' ? 'text-[#223240]' : 'text-slate-400'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>Riwayat</span>
          </button>
        </div>
      </div>

      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={(code) => {
          const res = storage.getVariantByBarcode(code);
          if (res) addToCart(res.product, res.variant);
        }}
        products={products}
      />

      {completedSale && (
        <ReceiptModal
          isOpen={!!completedSale}
          onClose={() => setCompletedSale(null)}
          sale={completedSale}
          store={store}
        />
      )}
    </div>
  );
};
