import React, { useState, useEffect } from 'react';
import {
  Search,
  Barcode,
  Camera,
  Filter,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Tag,
  CreditCard,
  User,
  QrCode,
  DollarSign,
  Receipt,
  AlertCircle,
  CheckCircle,
  ArrowRight,
  Sparkles,
  WifiOff,
} from 'lucide-react';
import {
  ProductWithVariants,
  ProductVariant,
  CartItem,
  Category,
  Customer,
  PaymentMethod,
  UserProfile,
  Sale,
  Store,
} from '../../types';
import { storage } from '../../services/storage';
import { formatRupiah, parseRupiahInput } from '../../utils/formatters';
import { BarcodeScannerModal } from '../common/BarcodeScannerModal';
import { ReceiptModal } from '../common/ReceiptModal';

interface POSInterfaceProps {
  currentUser: UserProfile;
  store: Store;
  onRefreshData?: () => void;
}

export const POSInterface: React.FC<POSInterfaceProps> = ({
  currentUser,
  store,
  onRefreshData,
}) => {
  // State
  const [products, setProducts] = useState<ProductWithVariants[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');

  // Variant Modal
  const [variantModalProduct, setVariantModalProduct] = useState<ProductWithVariants | null>(null);

  // Barcode Scanner Modal
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // Checkout Modal State
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [cashReceivedInput, setCashReceivedInput] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  // Discount modal state
  const [discountModalItem, setDiscountModalItem] = useState<CartItem | null>(null);
  const [tempDiscountAmount, setTempDiscountAmount] = useState<string>('0');

  // Success Receipt Modal
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);

  // Load products & categories
  const loadData = () => {
    setProducts(storage.getProducts().filter(p => p.isActive));
    setCategories(storage.getCategories());
    setCustomers(storage.getCustomers());
  };

  useEffect(() => {
    loadData();
  }, []);

  // Global physical barcode scanner listener (detects rapid keystrokes ending in Enter)
  useEffect(() => {
    let buffer = '';
    let lastKeyTime = Date.now();

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in an active input or textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      const currentTime = Date.now();
      if (currentTime - lastKeyTime > 100) {
        buffer = '';
      }
      lastKeyTime = currentTime;

      if (e.key === 'Enter') {
        if (buffer.length >= 4) {
          handleBarcodeScanned(buffer);
          buffer = '';
        }
      } else if (e.key.length === 1) {
        buffer += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [products]);

  // Handle scanned barcode / SKU
  const handleBarcodeScanned = (code: string) => {
    const result = storage.getVariantByBarcode(code);
    if (!result) {
      alert(`Barcode "${code}" tidak ditemukan dalam sistem!`);
      return;
    }
    const { product, variant } = result;
    if (variant.stock <= 0) {
      alert(`Stok untuk produk ${product.name} (${variant.sizeLabel}) sudah habis!`);
      return;
    }
    addToCart(product, variant);
  };

  // Add item to cart
  const addToCart = (product: ProductWithVariants, variant: ProductVariant) => {
    setCart(prevCart => {
      const existing = prevCart.find(item => item.variantId === variant.id);
      if (existing) {
        if (existing.quantity >= variant.stock) {
          alert(`Maksimal stok tercapai (${variant.stock} unit) untuk ${product.name} (${variant.sizeLabel})`);
          return prevCart;
        }
        return prevCart.map(item =>
          item.variantId === variant.id
            ? {
                ...item,
                quantity: item.quantity + 1,
                lineTotal: (item.quantity + 1) * item.sellingPrice - item.discountAmount,
              }
            : item
        );
      } else {
        const newItem: CartItem = {
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
        };
        return [...prevCart, newItem];
      }
    });

    setVariantModalProduct(null);
  };

  // Update item quantity
  const updateQuantity = (variantId: string, delta: number) => {
    setCart(prevCart => {
      return prevCart
        .map(item => {
          if (item.variantId === variantId) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            if (newQty > item.availableStock) {
              alert(`Stok tersedia hanya ${item.availableStock} unit`);
              return item;
            }
            return {
              ...item,
              quantity: newQty,
              lineTotal: newQty * item.sellingPrice - item.discountAmount,
            };
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  // Remove item
  const removeFromCart = (variantId: string) => {
    setCart(prevCart => prevCart.filter(item => item.variantId !== variantId));
  };

  // Apply discount to line item
  const handleApplyDiscount = () => {
    if (!discountModalItem) return;
    const discountVal = parseRupiahInput(tempDiscountAmount);

    if (!currentUser.canGiveDiscount && currentUser.role === 'cashier' && discountVal > 0) {
      alert('Kasir tidak diizinkan memberikan diskon manual tanpa wewenang Admin/Owner!');
      return;
    }

    setCart(prevCart =>
      prevCart.map(item => {
        if (item.variantId === discountModalItem.variantId) {
          const clampedDiscount = Math.min(discountVal, item.sellingPrice * item.quantity);
          return {
            ...item,
            discountAmount: clampedDiscount,
            lineTotal: item.quantity * item.sellingPrice - clampedDiscount,
          };
        }
        return item;
      })
    );
    setDiscountModalItem(null);
  };

  // Cart calculations
  const subtotal = cart.reduce((sum, item) => sum + item.quantity * item.sellingPrice, 0);
  const totalDiscount = cart.reduce((sum, item) => sum + item.discountAmount, 0);
  const totalAmount = subtotal - totalDiscount;
  const totalItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Filtered products
  const filteredProducts = products.filter(p => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.variants.some(v => v.sku.toLowerCase().includes(searchQuery.toLowerCase()) || v.barcode.includes(searchQuery));
    const matchesCategory = selectedCategory === 'all' || p.categoryId === selectedCategory;
    const matchesType = selectedType === 'all' || p.productType === selectedType;
    return matchesSearch && matchesCategory && matchesType;
  });

  // Execute checkout
  const handleExecuteCheckout = () => {
    setCheckoutError(null);
    const cashVal = paymentMethod === 'cash' ? parseRupiahInput(cashReceivedInput) : totalAmount;

    if (paymentMethod === 'cash' && cashVal < totalAmount) {
      setCheckoutError('Uang tunai yang diterima kurang dari total belanja.');
      return;
    }

    const result = storage.checkout(cart, paymentMethod, cashVal, selectedCustomer || undefined, notes);
    if (!result.success) {
      setCheckoutError(result.error || 'Terjadi kesalahan saat memproses checkout.');
      return;
    }

    // Success!
    setCompletedSale(result.sale!);
    setCart([]);
    setIsCheckoutOpen(false);
    setCashReceivedInput('');
    setNotes('');
    loadData(); // reload stocks
    if (onRefreshData) onRefreshData();
  };

  const isOffline = storage.isOffline();

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-60px)] overflow-hidden bg-[#FDFBF7]">
      {/* LEFT SECTION: Catalog & Search */}
      <div className="flex-1 flex flex-col min-w-0 border-r border-slate-200 overflow-hidden">
        {/* Top Filter & Search Bar */}
        <div className="p-3.5 bg-white border-b border-slate-200 space-y-2.5">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari nama pakaian, brand, SKU atau scan barcode..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#223240] focus:bg-white"
              />
            </div>

            {/* Camera / Barcode Scanner Modal Button */}
            <button
              onClick={() => setIsScannerOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-[#223240] hover:bg-[#1a2732] text-white rounded-lg text-xs font-semibold transition shrink-0"
              title="Buka Kamera Barcode Scanner"
            >
              <Camera className="w-4 h-4 text-[#E1A23D]" />
              <span className="hidden sm:inline">Scan Barcode</span>
            </button>
          </div>

          {/* Category & Product Type Filters */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1 rounded-full whitespace-nowrap text-xs font-medium transition ${
                selectedCategory === 'all'
                  ? 'bg-[#223240] text-white font-semibold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Semua Kategori
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.id)}
                className={`px-3 py-1 rounded-full whitespace-nowrap text-xs font-medium transition ${
                  selectedCategory === c.id
                    ? 'bg-[#223240] text-white font-semibold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {c.name}
              </button>
            ))}

            <div className="h-4 w-px bg-slate-300 mx-1 shrink-0" />

            {/* Type Filter */}
            <button
              onClick={() => setSelectedType(selectedType === 'thrift' ? 'all' : 'thrift')}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition border ${
                selectedType === 'thrift'
                  ? 'bg-[#E1A23D] text-[#223240] border-[#E1A23D]'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              Thrift (1-of-1)
            </button>
            <button
              onClick={() => setSelectedType(selectedType === 'distro' ? 'all' : 'distro')}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition border ${
                selectedType === 'distro'
                  ? 'bg-[#E1A23D] text-[#223240] border-[#E1A23D]'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              Distro
            </button>
          </div>
        </div>

        {/* Catalog Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {filteredProducts.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 py-12">
              <Search className="w-10 h-10 mb-2 stroke-1 text-slate-300" />
              <p className="font-semibold text-sm">Tidak ada produk fashion yang sesuai</p>
              <p className="text-xs text-slate-500 mt-1">Coba kata kunci pencarian atau kategori lain</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3.5">
              {filteredProducts.map((product) => {
                const totalStock = product.totalStock || 0;
                const isOutOfStock = totalStock <= 0;

                return (
                  <div
                    key={product.id}
                    onClick={() => {
                      if (isOutOfStock) return;
                      if (product.isOneOfOne && product.variants.length === 1) {
                        addToCart(product, product.variants[0]);
                      } else {
                        setVariantModalProduct(product);
                      }
                    }}
                    className={`bg-white rounded-xl border border-slate-200/80 shadow-2xs hover:shadow-md transition-all overflow-hidden flex flex-col cursor-pointer group select-none ${
                      isOutOfStock ? 'opacity-60 grayscale' : 'hover:border-[#E1A23D]/60'
                    }`}
                  >
                    {/* Product Photo */}
                    <div className="relative aspect-4/3 bg-slate-100 overflow-hidden">
                      <img
                        src={product.primaryImageUrl}
                        alt={product.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {/* Product Type Flag */}
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#223240]/90 text-white backdrop-blur-xs">
                        {product.productType}
                      </span>
                      {/* Stock Badge */}
                      <span
                        className={`absolute bottom-2 right-2 px-2 py-0.5 rounded text-[10px] font-bold ${
                          isOutOfStock
                            ? 'bg-rose-600 text-white'
                            : totalStock <= 2
                            ? 'bg-amber-500 text-white'
                            : 'bg-emerald-600 text-white'
                        }`}
                      >
                        {isOutOfStock ? 'Habis' : `Stok: ${totalStock}`}
                      </span>
                    </div>

                    {/* Product Meta */}
                    <div className="p-3 flex-1 flex flex-col justify-between">
                      <div>
                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider truncate">
                          {product.brandName} · {product.categoryName}
                        </p>
                        <h4 className="text-xs font-bold text-slate-900 line-clamp-2 leading-snug mt-0.5">
                          {product.name}
                        </h4>
                      </div>

                      <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-xs font-extrabold text-[#223240] tabular-nums">
                          {product.minPrice === product.maxPrice
                            ? formatRupiah(product.minPrice || 0)
                            : `${formatRupiah(product.minPrice || 0)}`}
                        </span>
                        <span className="text-[10px] font-medium text-[#E1A23D] bg-amber-50 px-1.5 py-0.5 rounded">
                          {product.variants.length > 1 ? `${product.variants.length} Varian` : 'Pilih'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT SECTION: Active Cart & Checkout */}
      <div className="w-full lg:w-96 bg-white flex flex-col h-full shrink-0 border-l border-slate-200">
        {/* Cart Header */}
        <div className="p-3.5 border-b border-slate-200 bg-[#223240] text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-4 h-4 text-[#E1A23D]" />
            <h3 className="text-xs font-bold uppercase tracking-wider">Keranjang Belanja</h3>
            <span className="w-5 h-5 rounded-full bg-[#E1A23D] text-[#223240] flex items-center justify-center text-[10px] font-bold">
              {totalItemsCount}
            </span>
          </div>

          {cart.length > 0 && (
            <button
              onClick={() => setCart([])}
              className="text-[11px] text-slate-300 hover:text-rose-400 transition"
            >
              Kosongkan
            </button>
          )}
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 py-12">
              <ShoppingCart className="w-10 h-10 mb-2 stroke-1 text-slate-300" />
              <p className="font-semibold text-xs text-slate-600">Keranjang masih kosong</p>
              <p className="text-[11px] text-slate-400 text-center max-w-[200px] mt-1">
                Pilih pakaian dari katalog atau scan barcode fisik kasir
              </p>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.variantId}
                className="p-2.5 bg-[#FDFBF7] rounded-xl border border-slate-200/80 space-y-2 text-xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex gap-2">
                    <img
                      src={item.imageUrl}
                      alt={item.productName}
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 object-cover rounded-md bg-slate-100 shrink-0"
                    />
                    <div className="leading-tight">
                      <p className="font-bold text-slate-900 line-clamp-1">{item.productName}</p>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                        {item.sizeLabel} · {item.colorLabel}
                      </p>
                      <p className="text-[11px] font-bold text-[#223240] tabular-nums mt-0.5">
                        {formatRupiah(item.sellingPrice)}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => removeFromCart(item.variantId)}
                    className="p-1 text-slate-400 hover:text-rose-600 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Quantity Controls & Line Discount */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                  <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg p-0.5">
                    <button
                      onClick={() => updateQuantity(item.variantId, -1)}
                      className="p-1 text-slate-600 hover:bg-slate-100 rounded"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-6 text-center font-bold text-xs font-mono">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.variantId, 1)}
                      disabled={item.quantity >= item.availableStock}
                      className="p-1 text-slate-600 hover:bg-slate-100 rounded disabled:opacity-30"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Discount Button */}
                  <button
                    onClick={() => {
                      setDiscountModalItem(item);
                      setTempDiscountAmount(item.discountAmount.toString());
                    }}
                    className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-semibold border ${
                      item.discountAmount > 0
                        ? 'bg-rose-50 text-rose-700 border-rose-300'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <Tag className="w-3 h-3" />
                    <span>
                      {item.discountAmount > 0
                        ? `Disc: -${formatRupiah(item.discountAmount)}`
                        : 'Beri Diskon'}
                    </span>
                  </button>

                  <span className="font-extrabold text-[#223240] tabular-nums text-xs">
                    {formatRupiah(item.lineTotal)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Cart Bottom Summary & Checkout Button */}
        <div className="p-3.5 bg-white border-t border-slate-200 space-y-3">
          {/* Customer Selector */}
          <div className="flex items-center justify-between gap-2 text-xs">
            <span className="text-slate-500 font-medium flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-slate-400" />
              <span>Pelanggan:</span>
            </span>
            <select
              value={selectedCustomer}
              onChange={(e) => setSelectedCustomer(e.target.value)}
              className="px-2 py-1 bg-slate-50 border border-slate-300 rounded text-xs focus:outline-none max-w-[170px]"
            >
              <option value="">Pelanggan Umum (Non-Member)</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.phone || 'No Phone'})
                </option>
              ))}
            </select>
          </div>

          {/* Pricing breakdown */}
          <div className="space-y-1 text-xs border-t border-slate-100 pt-2">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal:</span>
              <span className="tabular-nums font-mono">{formatRupiah(subtotal)}</span>
            </div>
            {totalDiscount > 0 && (
              <div className="flex justify-between text-rose-600 font-semibold">
                <span>Diskon Promo:</span>
                <span className="tabular-nums font-mono">-{formatRupiah(totalDiscount)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-extrabold text-slate-900 pt-1 border-t border-slate-200">
              <span>Total Bayar:</span>
              <span className="tabular-nums text-base text-[#223240]">{formatRupiah(totalAmount)}</span>
            </div>
          </div>

          {/* Offline Notice banner if applicable */}
          {isOffline && (
            <div className="p-2 bg-rose-50 border border-rose-200 rounded-lg text-[11px] text-rose-700 font-medium flex items-center gap-1.5">
              <WifiOff className="w-3.5 h-3.5 shrink-0" />
              <span>Mode Offline: Struk lokal dicetak & antrean disimpan.</span>
            </div>
          )}

          {/* Checkout CTA */}
          <button
            onClick={() => {
              if (cart.length === 0) return;
              setIsCheckoutOpen(true);
              setCashReceivedInput(totalAmount.toString());
            }}
            disabled={cart.length === 0}
            className="w-full py-3 bg-[#223240] hover:bg-[#1a2732] text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition disabled:opacity-40 disabled:cursor-not-allowed shadow-md"
          >
            <DollarSign className="w-4 h-4 text-[#E1A23D]" />
            <span>Bayar Sekarang ({formatRupiah(totalAmount)})</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* MODAL 1: Variant Picker Modal (Sizes & Colors) */}
      {variantModalProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="p-4 bg-[#223240] text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm">{variantModalProduct.name}</h3>
                <p className="text-xs text-[#E1A23D]">{variantModalProduct.brandName} · Pilih Varian</p>
              </div>
              <button
                onClick={() => setVariantModalProduct(null)}
                className="text-slate-300 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-4 max-h-80 overflow-y-auto space-y-2">
              {variantModalProduct.variants.map((v) => {
                const isOutOfStock = v.stock <= 0;
                return (
                  <button
                    key={v.id}
                    disabled={isOutOfStock}
                    onClick={() => addToCart(variantModalProduct, v)}
                    className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition ${
                      isOutOfStock
                        ? 'opacity-40 bg-slate-50 border-slate-200 cursor-not-allowed'
                        : 'hover:border-[#E1A23D] hover:bg-[#FDFBF7] border-slate-200'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900">
                          Ukuran: {v.sizeLabel}
                        </span>
                        <span className="text-xs text-slate-500">· {v.colorLabel}</span>
                        {v.conditionGrade && (
                          <span className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-mono">
                            {v.conditionGrade}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                        SKU: {v.sku} · Barcode: {v.barcode}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="font-extrabold text-xs text-[#223240] tabular-nums">
                        {formatRupiah(v.sellingPrice)}
                      </p>
                      <p
                        className={`text-[10px] font-bold ${
                          isOutOfStock ? 'text-rose-600' : 'text-emerald-600'
                        }`}
                      >
                        {isOutOfStock ? 'Stok Habis' : `Stok: ${v.stock}`}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Line Item Discount Modal */}
      {discountModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-5 space-y-4 animate-in fade-in zoom-in-95">
            <h4 className="font-bold text-sm text-[#223240]">Beri Diskon Item</h4>
            <p className="text-xs text-slate-600">
              {discountModalItem.productName} ({discountModalItem.sizeLabel})
            </p>

            <div>
              <label className="text-xs font-semibold text-slate-700">Nominal Diskon (Rp)</label>
              <input
                type="number"
                value={tempDiscountAmount}
                onChange={(e) => setTempDiscountAmount(e.target.value)}
                className="w-full mt-1 p-2 border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-[#223240]"
                min="0"
                max={discountModalItem.sellingPrice * discountModalItem.quantity}
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setDiscountModalItem(null)}
                className="flex-1 py-2 text-xs font-semibold text-slate-600 border border-slate-300 rounded-lg"
              >
                Batal
              </button>
              <button
                onClick={handleApplyDiscount}
                className="flex-1 py-2 text-xs font-bold text-white bg-[#223240] rounded-lg hover:bg-[#1a2732]"
              >
                Terapkan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Checkout & Payment Modal */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 my-8">
            <div className="p-4 bg-[#223240] text-white flex items-center justify-between">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-[#E1A23D]" />
                <span>Pilih Metode Pembayaran & Konfirmasi</span>
              </h3>
              <button onClick={() => setIsCheckoutOpen(false)} className="text-slate-300 hover:text-white">
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
              {checkoutError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{checkoutError}</span>
                </div>
              )}

              {/* Total Summary Banner */}
              <div className="p-4 bg-[#FDFBF7] rounded-xl border border-slate-200 text-center">
                <p className="text-xs text-slate-500 font-medium">TOTAL YANG HARUS DIBAYAR</p>
                <p className="text-2xl font-black text-[#223240] tabular-nums mt-1 font-sans">
                  {formatRupiah(totalAmount)}
                </p>
              </div>

              {/* Payment Method Selector */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-2">Metode Pembayaran</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cash')}
                    className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition ${
                      paymentMethod === 'cash'
                        ? 'border-[#223240] bg-[#223240] text-white shadow-xs'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <DollarSign className="w-4 h-4 text-[#E1A23D]" />
                    <span>TUNAI</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('qris')}
                    className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition ${
                      paymentMethod === 'qris'
                        ? 'border-[#223240] bg-[#223240] text-white shadow-xs'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <QrCode className="w-4 h-4 text-[#E1A23D]" />
                    <span>QRIS</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('bank_transfer')}
                    className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition ${
                      paymentMethod === 'bank_transfer'
                        ? 'border-[#223240] bg-[#223240] text-white shadow-xs'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <CreditCard className="w-4 h-4 text-[#E1A23D]" />
                    <span>TRANSFER</span>
                  </button>
                </div>
              </div>

              {/* Conditional Payment Details */}
              {paymentMethod === 'cash' && (
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block">Uang Tunai Diterima (Rp)</label>
                    <input
                      type="text"
                      value={cashReceivedInput ? formatRupiah(parseRupiahInput(cashReceivedInput)) : ''}
                      onChange={(e) => setCashReceivedInput(e.target.value)}
                      placeholder="Rp 0"
                      className="w-full mt-1 p-2 bg-white border border-slate-300 rounded-lg text-sm font-bold font-mono focus:ring-2 focus:ring-[#223240]"
                    />
                  </div>

                  {/* Quick Cash Chips */}
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => setCashReceivedInput(totalAmount.toString())}
                      className="px-2.5 py-1 bg-white border border-slate-300 rounded text-xs font-bold text-slate-700 hover:bg-slate-100"
                    >
                      Uang Pas
                    </button>
                    {[50000, 100000, 200000, 500000, 1000000].map((amt) => {
                      if (amt < totalAmount) return null;
                      return (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => setCashReceivedInput(amt.toString())}
                          className="px-2.5 py-1 bg-white border border-slate-300 rounded text-xs font-semibold text-slate-700 hover:bg-slate-100"
                        >
                          {formatRupiah(amt)}
                        </button>
                      );
                    })}
                  </div>

                  {/* Cash Change Calculator */}
                  <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-600">Uang Kembalian:</span>
                    <span className="font-extrabold text-sm text-emerald-600 font-mono">
                      {formatRupiah(Math.max(0, parseRupiahInput(cashReceivedInput) - totalAmount))}
                    </span>
                  </div>
                </div>
              )}

              {paymentMethod === 'qris' && (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center space-y-2">
                  <div className="w-40 h-40 mx-auto bg-white p-2 rounded-lg border border-slate-300 flex items-center justify-center shadow-xs">
                    {/* Simulated Clean QR Code Graphic */}
                    <div className="w-full h-full bg-[#223240] p-3 rounded flex flex-col items-center justify-center text-white">
                      <QrCode className="w-16 h-16 text-[#E1A23D]" />
                      <span className="text-[10px] font-mono tracking-widest mt-1">QRIS DINAMIS</span>
                    </div>
                  </div>
                  <p className="text-xs font-bold text-slate-800">Scan QRIS menggunakan BCA, Mandiri, GoPay, OVO, ShopeePay</p>
                  <p className="text-[11px] text-slate-500">Nominal otomatis tercatat: {formatRupiah(totalAmount)}</p>
                </div>
              )}

              {paymentMethod === 'bank_transfer' && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                  <p className="font-bold text-slate-800">Rekening Tujuan Toko:</p>
                  <div className="p-2.5 bg-white rounded-lg border border-slate-200 font-mono space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Bank:</span>
                      <span className="font-bold text-slate-900">BCA (Bank Central Asia)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">No. Rekening:</span>
                      <span className="font-bold text-slate-900">882-019-4820</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Atas Nama:</span>
                      <span className="font-bold text-slate-900">PT THRIFTORY INDONESIA</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Transaction Notes */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Catatan Tambahan (Opsional)</label>
                <input
                  type="text"
                  placeholder="Misal: Titipan baju, ganti kancing gratis..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-[#223240]"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsCheckoutOpen(false)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 bg-white"
              >
                Kembali
              </button>
              <button
                type="button"
                onClick={handleExecuteCheckout}
                className="px-6 py-2 bg-[#223240] hover:bg-[#1a2732] text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-sm"
              >
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span>Selesaikan Transaksi</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Barcode Scanner Modal */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={handleBarcodeScanned}
        products={products}
      />

      {/* Completed Sale Receipt Modal */}
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
