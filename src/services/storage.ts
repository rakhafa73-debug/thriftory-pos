import {
  Product,
  ProductVariant,
  ProductWithVariants,
  Category,
  Brand,
  Sale,
  SaleItem,
  StockMovement,
  Customer,
  Supplier,
  PurchaseOrder,
  StockOpname,
  AuditLog,
  SyncQueueItem,
  Store,
  StoreLocation,
  UserProfile,
  PaymentMethod,
  CartItem
} from '../types';
import { generateInvoiceNumber, generateBarcodeString, generateSKU } from '../utils/formatters';

const STORAGE_KEYS = {
  STORE: 'thriftory_store',
  LOCATIONS: 'thriftory_locations',
  PROFILES: 'thriftory_profiles',
  CURRENT_USER: 'thriftory_current_user',
  CATEGORIES: 'thriftory_categories',
  BRANDS: 'thriftory_brands',
  PRODUCTS: 'thriftory_products',
  VARIANTS: 'thriftory_variants',
  SALES: 'thriftory_sales',
  MOVEMENTS: 'thriftory_movements',
  CUSTOMERS: 'thriftory_customers',
  SUPPLIERS: 'thriftory_suppliers',
  PURCHASES: 'thriftory_purchases',
  STOCK_OPNAMES: 'thriftory_stock_opnames',
  AUDIT_LOGS: 'thriftory_audit_logs',
  SYNC_QUEUE: 'thriftory_sync_queue',
  DEVICE_ID: 'thriftory_device_id',
  IS_OFFLINE_SIMULATED: 'thriftory_offline_simulated',
};

// Initial Seed Data
const INITIAL_STORE: Store = {
  id: 'store_thriftory_hq',
  name: 'THRIFTORY STORE',
  legalName: 'PT Thriftory Retail Indonesia',
  phone: '0812-8899-7766',
  address: 'Jl. Kemang Raya No. 42, Mampang Prapatan, Jakarta Selatan 12730',
  receiptHeader: 'THRIFTORY VINTAGE & STREETWEAR',
  receiptFooter: 'Barang thrift tidak dapat ditukar/dikembalikan tanpa struk fisik asli. Terima kasih telah berbelanja!',
  currency: 'IDR',
  taxPercentage: 0,
};

const INITIAL_LOCATIONS: StoreLocation[] = [
  {
    id: 'loc_kemang',
    storeId: 'store_thriftory_hq',
    name: 'Kemang Flagship',
    code: 'KMG',
    address: 'Jl. Kemang Raya No. 42, Jakarta Selatan',
    isMain: true,
  },
  {
    id: 'loc_senopati',
    storeId: 'store_thriftory_hq',
    name: 'Senopati Branch',
    code: 'SNP',
    address: 'Jl. Senopati No. 18, Jakarta Selatan',
    isMain: false,
  },
];

export const INITIAL_PROFILES: UserProfile[] = [
  {
    id: 'user_owner',
    email: 'owner@thriftory.com',
    fullName: 'Rakha Pratama (Owner)',
    role: 'owner',
    storeId: 'store_thriftory_hq',
    locationId: 'loc_kemang',
    canGiveDiscount: true,
    canRefund: true,
    canCancel: true,
    isActive: true,
  },
  {
    id: 'user_admin',
    email: 'admin.kemang@thriftory.com',
    fullName: 'Dimas Aditya (Admin Toko)',
    role: 'store_admin',
    storeId: 'store_thriftory_hq',
    locationId: 'loc_kemang',
    canGiveDiscount: true,
    canRefund: true,
    canCancel: true,
    isActive: true,
  },
  {
    id: 'user_cashier',
    email: 'kasir1@thriftory.com',
    fullName: 'Siti Rahma (Kasir Kemang)',
    role: 'cashier',
    storeId: 'store_thriftory_hq',
    locationId: 'loc_kemang',
    canGiveDiscount: false, // Cashier cannot give unauthorized discounts
    canRefund: false,      // Cashier cannot refund without authorization
    canCancel: false,      // Cashier cannot cancel without authorization
    isActive: true,
  },
];

const INITIAL_CATEGORIES: Category[] = [
  { id: 'cat_tshirt', name: 'Vintage T-Shirt', slug: 'vintage-t-shirt', description: 'Band tees, rap tees, 90s graphic tees', productCount: 4 },
  { id: 'cat_jacket', name: 'Jackets & Outerwear', slug: 'jackets-outerwear', description: 'Denim, leather, windbreakers & varsity', productCount: 3 },
  { id: 'cat_hoodie', name: 'Hoodies & Sweats', slug: 'hoodies-sweats', description: 'Heavyweight streetwear hoodies & crewnecks', productCount: 3 },
  { id: 'cat_bottoms', name: 'Pants & Cargo', slug: 'pants-cargo', description: 'Baggy denim, cargo pants & workwear', productCount: 2 },
  { id: 'cat_caps', name: 'Hats & Headwear', slug: 'hats-headwear', description: 'Vintage snapbacks and trucker caps', productCount: 1 },
];

const INITIAL_BRANDS: Brand[] = [
  { id: 'brand_harley', name: 'Harley Davidson Vintage', countryOfOrigin: 'USA' },
  { id: 'brand_carhartt', name: 'Carhartt WIP', countryOfOrigin: 'USA' },
  { id: 'brand_stussy', name: 'Stüssy Archive', countryOfOrigin: 'USA' },
  { id: 'brand_nike', name: 'Nike Vintage 90s', countryOfOrigin: 'USA' },
  { id: 'brand_thriftory', name: 'Thriftory Distro Cut', countryOfOrigin: 'Indonesia' },
];

const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 'cust_budi',
    storeId: 'store_thriftory_hq',
    name: 'Budi Santoso',
    phone: '081299887711',
    email: 'budi.santoso@gmail.com',
    address: 'Pondok Indah, Jakarta Selatan',
    notes: 'Kolektor vintage band tees metal 90s',
    totalSpent: 1250000,
    totalOrders: 3,
    lastPurchaseDate: new Date(Date.now() - 86400000 * 2).toISOString(),
    createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
  },
  {
    id: 'cust_jessica',
    storeId: 'store_thriftory_hq',
    name: 'Jessica Melani',
    phone: '081744556677',
    email: 'jess.melani@yahoo.com',
    address: 'Cilandak, Jakarta Selatan',
    notes: 'Suka oversized jacket dan windbreaker',
    totalSpent: 2850000,
    totalOrders: 5,
    lastPurchaseDate: new Date(Date.now() - 86400000 * 1).toISOString(),
    createdAt: new Date(Date.now() - 86400000 * 60).toISOString(),
  },
  {
    id: 'cust_kevin',
    storeId: 'store_thriftory_hq',
    name: 'Kevin Wijaya',
    phone: '087811223344',
    email: 'kevin.w@tech.co.id',
    address: 'Tebet Timur, Jakarta Selatan',
    notes: 'Member loyal distro hoodie',
    totalSpent: 750000,
    totalOrders: 2,
    lastPurchaseDate: new Date(Date.now() - 86400000 * 5).toISOString(),
    createdAt: new Date(Date.now() - 86400000 * 20).toISOString(),
  },
];

const INITIAL_SUPPLIERS: Supplier[] = [
  {
    id: 'sup_tokyo',
    name: 'Tokyo Vintage Bal Co.',
    contactPerson: 'Kenji Sato',
    phone: '081399881122',
    email: 'kenji@tokyovintage.jp',
    address: 'Shibuya-ku, Tokyo / Gudang Pelabuhan Tg. Priok',
    notes: 'Supplier bal pakaian vintage Jepang kualitas Grade A/Mint',
    isActive: true,
  },
  {
    id: 'sup_bandung',
    name: 'Bandung Distro Garment Supply',
    contactPerson: 'Kang Asep Hermawan',
    phone: '082122334455',
    email: 'asep@distrogarment.id',
    address: 'Kawasan Industri Cimahi, Bandung',
    notes: 'Produsen blank hoodie heavyweight 400gsm & cotton combed 16s',
    isActive: true,
  },
];

const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod_1',
    storeId: 'store_thriftory_hq',
    categoryId: 'cat_tshirt',
    brandId: 'brand_harley',
    name: '1998 Harley Davidson Urban Rebellion Washed Tee',
    slug: 'harley-davidson-1998-urban-rebellion-washed-tee',
    productType: 'thrift',
    description: 'Original 1998 single stitch tee, heavy stone washed vintage black with natural sun fade. Rare one-of-one piece.',
    primaryImageUrl: '/src/assets/images/vintage_washed_tee_1791782639024.jpg',
    isOneOfOne: true,
    isActive: true,
    createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
  },
  {
    id: 'prod_2',
    storeId: 'store_thriftory_hq',
    categoryId: 'cat_jacket',
    brandId: 'brand_carhartt',
    name: 'Carhartt WIP Distressed Denim Trucker Jacket',
    slug: 'carhartt-distressed-denim-trucker-jacket',
    productType: 'vintage',
    description: '14.5oz raw vintage selvedge denim with natural honeycombs and whiskering. Brass custom buttons with blanket lining.',
    primaryImageUrl: '/src/assets/images/retro_denim_jacket_1791782653407.jpg',
    isOneOfOne: false,
    isActive: true,
    createdAt: new Date(Date.now() - 86400000 * 8).toISOString(),
  },
  {
    id: 'prod_3',
    storeId: 'store_thriftory_hq',
    categoryId: 'cat_jacket',
    brandId: 'brand_nike',
    name: '1994 Retro Colorblock Nylon Windbreaker',
    slug: 'nike-1994-colorblock-nylon-windbreaker',
    productType: 'vintage',
    description: 'Authentic 90s colorblock nylon windbreaker in forest green, golden yellow, and deep navy with retro zipper pulls.',
    primaryImageUrl: '/src/assets/images/vintage_windbreaker_1791782667705.jpg',
    isOneOfOne: true,
    isActive: true,
    createdAt: new Date(Date.now() - 86400000 * 6).toISOString(),
  },
  {
    id: 'prod_4',
    storeId: 'store_thriftory_hq',
    categoryId: 'cat_hoodie',
    brandId: 'brand_thriftory',
    name: 'Thriftory Boxy 420GSM Washed Beige Hoodie',
    slug: 'thriftory-boxy-washed-beige-hoodie',
    productType: 'distro',
    description: 'Heavyweight French Terry 420GSM custom milled garment. Double layered hood, drop-shoulder relaxed boxy streetwear cut.',
    primaryImageUrl: '/src/assets/images/distro_beige_hoodie_1791782679718.jpg',
    isOneOfOne: false,
    isActive: true,
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
  },
];

const INITIAL_VARIANTS: ProductVariant[] = [
  // Product 1: Harley Tee (Thrift 1-of-1: stock 1)
  {
    id: 'var_prod1_l',
    productId: 'prod_1',
    sku: 'THR-HAR-TEE-L-101',
    barcode: '899100200301',
    sizeLabel: 'L (Boxy 58x74)',
    colorLabel: 'Washed Black Fade',
    conditionGrade: 'vintage_fade',
    costPrice: 180000,
    sellingPrice: 450000,
    stock: 1, // Only 1 stock for thrift 1-of-1!
    minStockAlert: 1,
    isActive: true,
  },
  // Product 2: Denim Jacket (Vintage multiple sizes)
  {
    id: 'var_prod2_m',
    productId: 'prod_2',
    sku: 'VIN-CRH-JKT-M-201',
    barcode: '899100200302',
    sizeLabel: 'M',
    colorLabel: 'Indigo Washed',
    conditionGrade: 'grade_a',
    costPrice: 420000,
    sellingPrice: 850000,
    stock: 3,
    minStockAlert: 1,
    isActive: true,
  },
  {
    id: 'var_prod2_l',
    productId: 'prod_2',
    sku: 'VIN-CRH-JKT-L-202',
    barcode: '899100200303',
    sizeLabel: 'L',
    colorLabel: 'Indigo Washed',
    conditionGrade: 'mint',
    costPrice: 450000,
    sellingPrice: 890000,
    stock: 2,
    minStockAlert: 1,
    isActive: true,
  },
  // Product 3: Windbreaker (Thrift 1-of-1)
  {
    id: 'var_prod3_xl',
    productId: 'prod_3',
    sku: 'THR-NIK-WND-XL-301',
    barcode: '899100200304',
    sizeLabel: 'XL (Vintage Fit)',
    colorLabel: 'Green / Gold / Navy',
    conditionGrade: 'grade_a',
    costPrice: 220000,
    sellingPrice: 550000,
    stock: 1,
    minStockAlert: 1,
    isActive: true,
  },
  // Product 4: Distro Hoodie (Multiple sizes S, M, L, XL)
  {
    id: 'var_prod4_s',
    productId: 'prod_4',
    sku: 'DST-THF-HOD-S-401',
    barcode: '899100200305',
    sizeLabel: 'S',
    colorLabel: 'Washed Sand Beige',
    conditionGrade: 'mint',
    costPrice: 165000,
    sellingPrice: 385000,
    stock: 8,
    minStockAlert: 2,
    isActive: true,
  },
  {
    id: 'var_prod4_m',
    productId: 'prod_4',
    sku: 'DST-THF-HOD-M-402',
    barcode: '899100200306',
    sizeLabel: 'M',
    colorLabel: 'Washed Sand Beige',
    conditionGrade: 'mint',
    costPrice: 165000,
    sellingPrice: 385000,
    stock: 12,
    minStockAlert: 3,
    isActive: true,
  },
  {
    id: 'var_prod4_l',
    productId: 'prod_4',
    sku: 'DST-THF-HOD-L-403',
    barcode: '899100200307',
    sizeLabel: 'L',
    colorLabel: 'Washed Sand Beige',
    conditionGrade: 'mint',
    costPrice: 165000,
    sellingPrice: 385000,
    stock: 10,
    minStockAlert: 3,
    isActive: true,
  },
  {
    id: 'var_prod4_xl',
    productId: 'prod_4',
    sku: 'DST-THF-HOD-XL-404',
    barcode: '899100200308',
    sizeLabel: 'XL',
    colorLabel: 'Washed Sand Beige',
    conditionGrade: 'mint',
    costPrice: 175000,
    sellingPrice: 395000,
    stock: 4,
    minStockAlert: 2,
    isActive: true,
  },
];

const INITIAL_PURCHASES: PurchaseOrder[] = [
  {
    id: 'po_1',
    poNumber: 'PO-202610-001',
    supplierId: 'sup_bandung',
    supplierName: 'Bandung Distro Garment Supply',
    status: 'received',
    totalAmount: 5800000,
    notes: 'Batch 1 Blank Hoodie Heavyweight 420gsm Sand Beige',
    items: [
      {
        id: 'poi_1',
        variantId: 'var_prod4_m',
        variantSku: 'DST-THF-HOD-M-402',
        productName: 'Thriftory Boxy 420GSM Washed Beige Hoodie',
        quantity: 20,
        unitCost: 165000,
        lineTotal: 3300000,
      },
      {
        id: 'poi_2',
        variantId: 'var_prod4_l',
        variantSku: 'DST-THF-HOD-L-403',
        productName: 'Thriftory Boxy 420GSM Washed Beige Hoodie',
        quantity: 15,
        unitCost: 165000,
        lineTotal: 2475000,
      },
    ],
    orderedAt: new Date(Date.now() - 86400000 * 12).toISOString(),
    receivedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    createdAt: new Date(Date.now() - 86400000 * 12).toISOString(),
  },
];

// Helper for local storage retrieval with default
function getItem<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultValue;
    return JSON.parse(raw) as T;
  } catch (e) {
    console.error(`Failed to read ${key} from localStorage`, e);
    return defaultValue;
  }
}

function setItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Failed to save ${key} to localStorage`, e);
  }
}

export class StorageService {
  private static instance: StorageService;

  private constructor() {
    this.ensureInitialized();
  }

  public static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  private ensureInitialized(): void {
    if (!localStorage.getItem(STORAGE_KEYS.STORE)) {
      setItem(STORAGE_KEYS.STORE, INITIAL_STORE);
      setItem(STORAGE_KEYS.LOCATIONS, INITIAL_LOCATIONS);
      setItem(STORAGE_KEYS.PROFILES, INITIAL_PROFILES);
      setItem(STORAGE_KEYS.CURRENT_USER, INITIAL_PROFILES[0]); // Default to Owner
      setItem(STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES);
      setItem(STORAGE_KEYS.BRANDS, INITIAL_BRANDS);
      setItem(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
      setItem(STORAGE_KEYS.VARIANTS, INITIAL_VARIANTS);
      setItem(STORAGE_KEYS.CUSTOMERS, INITIAL_CUSTOMERS);
      setItem(STORAGE_KEYS.SUPPLIERS, INITIAL_SUPPLIERS);
      setItem(STORAGE_KEYS.PURCHASES, INITIAL_PURCHASES);
      setItem(STORAGE_KEYS.SALES, []);
      setItem(STORAGE_KEYS.MOVEMENTS, []);
      setItem(STORAGE_KEYS.STOCK_OPNAMES, []);
      setItem(STORAGE_KEYS.AUDIT_LOGS, []);
      setItem(STORAGE_KEYS.SYNC_QUEUE, []);
      setItem(STORAGE_KEYS.DEVICE_ID, `DEV-POS-${Math.floor(1000 + Math.random() * 9000)}`);
      setItem(STORAGE_KEYS.IS_OFFLINE_SIMULATED, false);

      // Seed initial movement logs
      this.logAudit('user_owner', 'Owner', 'SYSTEM_INIT', 'DATABASE', undefined, 'Thriftory POS Initialized with fashion seed data');
    }
  }

  // --- Current User & Role Management ---
  public getCurrentUser(): UserProfile {
    return getItem<UserProfile>(STORAGE_KEYS.CURRENT_USER, INITIAL_PROFILES[0]);
  }

  public setCurrentUser(user: UserProfile): void {
    setItem(STORAGE_KEYS.CURRENT_USER, user);
    this.logAudit(user.id, user.role, 'USER_SWITCH', 'AUTH', user.id, `Switched active role to ${user.fullName} (${user.role})`);
  }

  public getUsers(): UserProfile[] {
    return getItem<UserProfile[]>(STORAGE_KEYS.PROFILES, INITIAL_PROFILES);
  }

  public saveUser(user: UserProfile): void {
    const users = this.getUsers();
    const index = users.findIndex(u => u.id === user.id);
    if (index >= 0) {
      users[index] = user;
    } else {
      users.push(user);
    }
    setItem(STORAGE_KEYS.PROFILES, users);
    this.logAudit(this.getCurrentUser().id, this.getCurrentUser().role, 'USER_SAVE', 'USER', user.id, `Saved user ${user.fullName}`);
  }

  // --- Store & Locations ---
  public getStore(): Store {
    return getItem<Store>(STORAGE_KEYS.STORE, INITIAL_STORE);
  }

  public updateStore(store: Store): void {
    setItem(STORAGE_KEYS.STORE, store);
    this.logAudit(this.getCurrentUser().id, this.getCurrentUser().role, 'STORE_UPDATE', 'STORE', store.id, 'Updated store settings');
  }

  public getLocations(): StoreLocation[] {
    return getItem<StoreLocation[]>(STORAGE_KEYS.LOCATIONS, INITIAL_LOCATIONS);
  }

  public saveLocation(loc: StoreLocation): void {
    const locs = this.getLocations();
    const idx = locs.findIndex(l => l.id === loc.id);
    if (idx >= 0) {
      locs[idx] = loc;
    } else {
      locs.push(loc);
    }
    setItem(STORAGE_KEYS.LOCATIONS, locs);
  }

  // --- Offline Simulation Toggle ---
  public isOffline(): boolean {
    return getItem<boolean>(STORAGE_KEYS.IS_OFFLINE_SIMULATED, false);
  }

  public setOfflineSimulation(offline: boolean): void {
    setItem(STORAGE_KEYS.IS_OFFLINE_SIMULATED, offline);
    if (!offline) {
      // Reconnected! Process outbox sync queue automatically
      this.processSyncQueue();
    }
  }

  public getDeviceId(): string {
    return getItem<string>(STORAGE_KEYS.DEVICE_ID, 'DEV-POS-1001');
  }

  // --- Products, Variants, Categories & Brands ---
  public getCategories(): Category[] {
    return getItem<Category[]>(STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES);
  }

  public saveCategory(category: Category): void {
    const cats = this.getCategories();
    const idx = cats.findIndex(c => c.id === category.id);
    if (idx >= 0) {
      cats[idx] = category;
    } else {
      cats.push(category);
    }
    setItem(STORAGE_KEYS.CATEGORIES, cats);
    this.logAudit(this.getCurrentUser().id, this.getCurrentUser().role, 'CATEGORY_SAVE', 'CATEGORY', category.id, `Saved category ${category.name}`);
  }

  public getBrands(): Brand[] {
    return getItem<Brand[]>(STORAGE_KEYS.BRANDS, INITIAL_BRANDS);
  }

  public saveBrand(brand: Brand): void {
    const brands = this.getBrands();
    const idx = brands.findIndex(b => b.id === brand.id);
    if (idx >= 0) {
      brands[idx] = brand;
    } else {
      brands.push(brand);
    }
    setItem(STORAGE_KEYS.BRANDS, brands);
  }

  public getProducts(): ProductWithVariants[] {
    const products = getItem<Product[]>(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
    const variants = getItem<ProductVariant[]>(STORAGE_KEYS.VARIANTS, INITIAL_VARIANTS);
    const categories = this.getCategories();
    const brands = this.getBrands();

    return products.map(prod => {
      const prodVariants = variants.filter(v => v.productId === prod.id && v.isActive);
      const cat = categories.find(c => c.id === prod.categoryId);
      const br = brands.find(b => b.id === prod.brandId);
      const totalStock = prodVariants.reduce((sum, v) => sum + v.stock, 0);
      const prices = prodVariants.map(v => v.sellingPrice);
      const minPrice = prices.length ? Math.min(...prices) : 0;
      const maxPrice = prices.length ? Math.max(...prices) : 0;

      return {
        ...prod,
        categoryName: cat?.name || 'Uncategorized',
        brandName: br?.name || 'No Brand',
        variants: prodVariants,
        totalStock,
        minPrice,
        maxPrice,
      };
    });
  }

  public getProductById(id: string): ProductWithVariants | undefined {
    return this.getProducts().find(p => p.id === id);
  }

  public getVariantByBarcode(barcode: string): { product: ProductWithVariants; variant: ProductVariant } | null {
    const allProducts = this.getProducts();
    for (const prod of allProducts) {
      const foundVar = prod.variants.find(v => v.barcode === barcode.trim() || v.sku === barcode.trim());
      if (foundVar) {
        return { product: prod, variant: foundVar };
      }
    }
    return null;
  }

  public saveProduct(product: Product, variants: ProductVariant[]): void {
    const products = getItem<Product[]>(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
    const allVariants = getItem<ProductVariant[]>(STORAGE_KEYS.VARIANTS, INITIAL_VARIANTS);

    const pIdx = products.findIndex(p => p.id === product.id);
    if (pIdx >= 0) {
      products[pIdx] = product;
    } else {
      products.push(product);
    }
    setItem(STORAGE_KEYS.PRODUCTS, products);

    // Save or update variants
    const filteredVariants = allVariants.filter(v => v.productId !== product.id);
    filteredVariants.push(...variants);
    setItem(STORAGE_KEYS.VARIANTS, filteredVariants);

    this.logAudit(this.getCurrentUser().id, this.getCurrentUser().role, 'PRODUCT_SAVE', 'PRODUCT', product.id, `Saved product ${product.name} with ${variants.length} variants`);
  }

  public archiveProduct(productId: string): void {
    const products = getItem<Product[]>(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
    const p = products.find(prod => prod.id === productId);
    if (p) {
      p.isActive = false;
      setItem(STORAGE_KEYS.PRODUCTS, products);
      this.logAudit(this.getCurrentUser().id, this.getCurrentUser().role, 'PRODUCT_ARCHIVE', 'PRODUCT', productId, `Archived product ${p.name}`);
    }
  }

  // --- Customers ---
  public getCustomers(): Customer[] {
    return getItem<Customer[]>(STORAGE_KEYS.CUSTOMERS, INITIAL_CUSTOMERS);
  }

  public saveCustomer(cust: Customer): void {
    const customers = this.getCustomers();
    const idx = customers.findIndex(c => c.id === cust.id);
    if (idx >= 0) {
      customers[idx] = cust;
    } else {
      customers.push(cust);
    }
    setItem(STORAGE_KEYS.CUSTOMERS, customers);
    this.logAudit(this.getCurrentUser().id, this.getCurrentUser().role, 'CUSTOMER_SAVE', 'CUSTOMER', cust.id, `Saved customer ${cust.name}`);
  }

  // --- Suppliers & Purchase Orders ---
  public getSuppliers(): Supplier[] {
    return getItem<Supplier[]>(STORAGE_KEYS.SUPPLIERS, INITIAL_SUPPLIERS);
  }

  public saveSupplier(supplier: Supplier): void {
    const suppliers = this.getSuppliers();
    const idx = suppliers.findIndex(s => s.id === supplier.id);
    if (idx >= 0) {
      suppliers[idx] = supplier;
    } else {
      suppliers.push(supplier);
    }
    setItem(STORAGE_KEYS.SUPPLIERS, suppliers);
  }

  public getPurchases(): PurchaseOrder[] {
    return getItem<PurchaseOrder[]>(STORAGE_KEYS.PURCHASES, INITIAL_PURCHASES);
  }

  public savePurchase(po: PurchaseOrder): void {
    const purchases = this.getPurchases();
    const idx = purchases.findIndex(p => p.id === po.id);
    if (idx >= 0) {
      purchases[idx] = po;
    } else {
      purchases.push(po);
    }
    setItem(STORAGE_KEYS.PURCHASES, purchases);
    this.logAudit(this.getCurrentUser().id, this.getCurrentUser().role, 'PO_SAVE', 'PURCHASE', po.id, `Saved PO ${po.poNumber} (${po.status})`);
  }

  public receivePurchaseOrder(poId: string): void {
    const purchases = this.getPurchases();
    const po = purchases.find(p => p.id === poId);
    if (!po || po.status === 'received') return;

    po.status = 'received';
    po.receivedAt = new Date().toISOString();
    setItem(STORAGE_KEYS.PURCHASES, purchases);

    // Atomically increment stock for each item in the purchase order
    const allVariants = getItem<ProductVariant[]>(STORAGE_KEYS.VARIANTS, INITIAL_VARIANTS);
    po.items.forEach(item => {
      const v = allVariants.find(variant => variant.id === item.variantId);
      if (v) {
        const prev = v.stock;
        v.stock += item.quantity;
        this.logMovement(v.id, v.sku, item.productName, 'in', item.quantity, prev, v.stock, po.poNumber, 'Penerimaan Purchase Order');
      }
    });
    setItem(STORAGE_KEYS.VARIANTS, allVariants);

    this.logAudit(this.getCurrentUser().id, this.getCurrentUser().role, 'PO_RECEIVE', 'PURCHASE', po.id, `Received PO ${po.poNumber}, inventory incremented`);
  }

  // --- Inventory Movements & Manual Adjustments ---
  public getStockMovements(): StockMovement[] {
    return getItem<StockMovement[]>(STORAGE_KEYS.MOVEMENTS, []);
  }

  public adjustStock(variantId: string, deltaQty: number, movementType: 'in' | 'out' | 'adjustment', notes: string): boolean {
    const allVariants = getItem<ProductVariant[]>(STORAGE_KEYS.VARIANTS, INITIAL_VARIANTS);
    const v = allVariants.find(variant => variant.id === variantId);
    if (!v) return false;

    const prev = v.stock;
    const newQty = prev + deltaQty;
    if (newQty < 0) return false; // prevent negative stock on manual adjustments

    v.stock = newQty;
    setItem(STORAGE_KEYS.VARIANTS, allVariants);

    const products = getItem<Product[]>(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
    const prod = products.find(p => p.id === v.productId);

    this.logMovement(v.id, v.sku, prod?.name || 'Item', movementType, deltaQty, prev, newQty, `ADJ-${Date.now().toString().slice(-4)}`, notes);
    this.logAudit(this.getCurrentUser().id, this.getCurrentUser().role, 'STOCK_ADJUST', 'INVENTORY', v.id, `Stock adjusted for SKU ${v.sku} (${prev} -> ${newQty})`);
    return true;
  }

  private logMovement(
    variantId: string,
    variantSku: string,
    productName: string,
    movementType: any,
    quantity: number,
    previousQuantity: number,
    newQuantity: number,
    referenceNumber: string,
    notes?: string
  ): void {
    const movements = this.getStockMovements();
    movements.unshift({
      id: `mov_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      variantId,
      variantSku,
      productName,
      movementType,
      quantity,
      previousQuantity,
      newQuantity,
      referenceNumber,
      notes,
      performedBy: this.getCurrentUser().fullName,
      createdAt: new Date().toISOString(),
    });
    setItem(STORAGE_KEYS.MOVEMENTS, movements);
  }

  // --- Stock Opname ---
  public getStockOpnames(): StockOpname[] {
    return getItem<StockOpname[]>(STORAGE_KEYS.STOCK_OPNAMES, []);
  }

  public saveStockOpname(opname: StockOpname): void {
    const opnames = this.getStockOpnames();
    opnames.unshift(opname);
    setItem(STORAGE_KEYS.STOCK_OPNAMES, opnames);

    // Apply adjustments to system inventory atomicity
    const allVariants = getItem<ProductVariant[]>(STORAGE_KEYS.VARIANTS, INITIAL_VARIANTS);
    opname.items.forEach(item => {
      if (item.variance !== 0) {
        const v = allVariants.find(variant => variant.id === item.variantId);
        if (v) {
          const prev = v.stock;
          v.stock = item.physicalQuantity;
          this.logMovement(v.id, v.sku, item.productName, 'stock_opname', item.variance, prev, item.physicalQuantity, opname.opnameNumber, 'Penyesuaian hasil stok opname fisik');
        }
      }
    });
    setItem(STORAGE_KEYS.VARIANTS, allVariants);

    this.logAudit(this.getCurrentUser().id, this.getCurrentUser().role, 'STOCK_OPNAME', 'INVENTORY', opname.id, `Completed Stock Opname ${opname.opnameNumber}`);
  }

  // --- ATOMIC CHECKOUT & SALES ---
  public checkout(
    cart: CartItem[],
    paymentMethod: PaymentMethod,
    amountReceived: number,
    customerId?: string,
    notes?: string
  ): { success: boolean; sale?: Sale; error?: string } {
    if (!cart || cart.length === 0) {
      return { success: false, error: 'Keranjang belanja kosong' };
    }

    const isOfflineMode = this.isOffline();
    const currentUser = this.getCurrentUser();
    const allVariants = getItem<ProductVariant[]>(STORAGE_KEYS.VARIANTS, INITIAL_VARIANTS);

    // 1. Validation & Stock Availability Check
    for (const item of cart) {
      const v = allVariants.find(variant => variant.id === item.variantId);
      if (!v) {
        return { success: false, error: `Varian barang ${item.productName} (${item.sku}) tidak ditemukan` };
      }
      if (v.stock < item.quantity) {
        return {
          success: false,
          error: `Stok tidak mencukupi untuk ${item.productName} (${v.sizeLabel}). Stok tersedia: ${v.stock}, diminta: ${item.quantity}`,
        };
      }
    }

    // 2. Calculate Totals
    const subtotal = cart.reduce((sum, item) => sum + item.lineTotal, 0);
    const discountAmount = cart.reduce((sum, item) => sum + item.discountAmount, 0);
    const totalAmount = subtotal; // Net total
    const changeGiven = paymentMethod === 'cash' ? Math.max(0, amountReceived - totalAmount) : 0;

    if (paymentMethod === 'cash' && amountReceived < totalAmount) {
      return { success: false, error: 'Uang tunai yang diterima kurang dari total transaksi' };
    }

    const saleId = `sale_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const invoiceNumber = generateInvoiceNumber('INV');
    const idempotencyKey = `idemp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const deviceId = this.getDeviceId();

    // 3. Find Customer info if applicable
    let custName = 'Pelanggan Umum';
    let custPhone: string | undefined;
    if (customerId) {
      const customers = this.getCustomers();
      const c = customers.find(cust => cust.id === customerId);
      if (c) {
        custName = c.name;
        custPhone = c.phone;
        c.totalSpent += totalAmount;
        c.totalOrders += 1;
        c.lastPurchaseDate = new Date().toISOString();
        setItem(STORAGE_KEYS.CUSTOMERS, customers);
      }
    }

    // 4. Build Sale Items
    const saleItems: SaleItem[] = cart.map(item => ({
      id: `si_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      saleId,
      variantId: item.variantId,
      productNameSnapshot: item.productName,
      skuSnapshot: item.sku,
      barcodeSnapshot: item.barcode,
      sizeSnapshot: item.sizeLabel,
      colorSnapshot: item.colorLabel,
      conditionGradeSnapshot: item.conditionGrade,
      quantity: item.quantity,
      unitPrice: item.sellingPrice,
      unitCostSnapshot: item.costPrice,
      discountAmount: item.discountAmount,
      lineTotal: item.lineTotal,
    }));

    // 5. Build Sale Object
    const sale: Sale = {
      id: saleId,
      storeId: currentUser.storeId,
      locationId: currentUser.locationId,
      cashierId: currentUser.id,
      cashierName: currentUser.fullName,
      customerId,
      customerName: custName,
      customerPhone: custPhone,
      invoiceNumber,
      idempotencyKey,
      deviceId,
      localTransactionId: saleId,
      subtotal,
      discountAmount,
      taxAmount: 0,
      totalAmount,
      paymentMethod,
      amountReceived: paymentMethod === 'cash' ? amountReceived : totalAmount,
      changeGiven,
      paymentStatus: 'completed',
      transactionStatus: 'completed',
      origin: isOfflineMode ? 'offline' : 'online',
      syncStatus: isOfflineMode ? 'pending_sync' : 'synced',
      notes,
      deviceCreatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      items: saleItems,
    };

    // 6. Atomically Decrement Inventory
    cart.forEach(item => {
      const v = allVariants.find(variant => variant.id === item.variantId);
      if (v) {
        const prev = v.stock;
        v.stock -= item.quantity;
        this.logMovement(v.id, v.sku, item.productName, 'sale', -item.quantity, prev, v.stock, invoiceNumber, `Penjualan POS #${invoiceNumber}`);
      }
    });
    setItem(STORAGE_KEYS.VARIANTS, allVariants);

    // 7. Store Sale Record
    const sales = this.getSales();
    sales.unshift(sale);
    setItem(STORAGE_KEYS.SALES, sales);

    // 8. Handle Offline Queue Outbox
    if (isOfflineMode) {
      const queue = this.getSyncQueue();
      queue.push({
        id: `sq_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        idempotencyKey,
        deviceId,
        operationType: 'create_sale',
        payload: sale,
        status: 'pending_sync',
        retryCount: 0,
        createdAt: new Date().toISOString(),
      });
      setItem(STORAGE_KEYS.SYNC_QUEUE, queue);
      this.logAudit(currentUser.id, currentUser.role, 'SALE_OFFLINE', 'SALE', sale.id, `Offline sale recorded #${invoiceNumber} (Queued for Cloud Sync)`);
    } else {
      this.logAudit(currentUser.id, currentUser.role, 'SALE_ONLINE', 'SALE', sale.id, `Sale completed #${invoiceNumber} for ${custName}`);
    }

    return { success: true, sale };
  }

  // --- Sales Retrieval & Refunds ---
  public getSales(): Sale[] {
    return getItem<Sale[]>(STORAGE_KEYS.SALES, []);
  }

  public getSaleById(id: string): Sale | undefined {
    return this.getSales().find(s => s.id === id);
  }

  public refundSale(saleId: string, reason: string): { success: boolean; error?: string } {
    const currentUser = this.getCurrentUser();
    if (!currentUser.canRefund && currentUser.role === 'cashier') {
      return { success: false, error: 'Akses ditolak: Kasir tidak memiliki wewenang untuk melakukan refund tanpa persetujuan Admin/Owner.' };
    }

    const sales = this.getSales();
    const sale = sales.find(s => s.id === saleId);
    if (!sale) return { success: false, error: 'Transaksi tidak ditemukan' };
    if (sale.transactionStatus === 'refunded') return { success: false, error: 'Transaksi sudah pernah direfund sebelumnya' };

    sale.transactionStatus = 'refunded';
    sale.paymentStatus = 'refunded';
    sale.refundReason = reason;
    setItem(STORAGE_KEYS.SALES, sales);

    // Restock items atomicity
    const allVariants = getItem<ProductVariant[]>(STORAGE_KEYS.VARIANTS, INITIAL_VARIANTS);
    sale.items.forEach(item => {
      const v = allVariants.find(variant => variant.id === item.variantId);
      if (v) {
        const prev = v.stock;
        v.stock += item.quantity;
        this.logMovement(v.id, v.sku, item.productNameSnapshot, 'refund', item.quantity, prev, v.stock, `REF-${sale.invoiceNumber}`, `Refund transaksi: ${reason}`);
      }
    });
    setItem(STORAGE_KEYS.VARIANTS, allVariants);

    this.logAudit(currentUser.id, currentUser.role, 'SALE_REFUND', 'SALE', sale.id, `Refunded sale #${sale.invoiceNumber}. Alasan: ${reason}`);
    return { success: true };
  }

  // --- Sync Queue & Outbox Pattern Engine ---
  public getSyncQueue(): SyncQueueItem[] {
    return getItem<SyncQueueItem[]>(STORAGE_KEYS.SYNC_QUEUE, []);
  }

  public processSyncQueue(): { syncedCount: number; conflictCount: number } {
    const queue = this.getSyncQueue();
    if (queue.length === 0) return { syncedCount: 0, conflictCount: 0 };

    let syncedCount = 0;
    let conflictCount = 0;

    const remainingQueue: SyncQueueItem[] = [];
    const sales = this.getSales();

    queue.forEach(item => {
      if (item.operationType === 'create_sale') {
        const sale = sales.find(s => s.idempotencyKey === item.idempotencyKey);
        if (sale) {
          // Idempotency verified - mark as synced
          sale.syncStatus = 'synced';
          syncedCount++;
        }
      }
    });

    setItem(STORAGE_KEYS.SALES, sales);
    setItem(STORAGE_KEYS.SYNC_QUEUE, remainingQueue);

    this.logAudit(
      this.getCurrentUser().id,
      this.getCurrentUser().role,
      'SYNC_OUTBOX',
      'SYNC',
      undefined,
      `Outbox sync executed: ${syncedCount} transaction(s) synced to cloud database.`
    );

    return { syncedCount, conflictCount };
  }

  // --- Audit Logs ---
  public getAuditLogs(): AuditLog[] {
    return getItem<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, []);
  }

  public logAudit(actorId: string, actorRole: any, action: string, entityType: string, entityId?: string, details = ''): void {
    const logs = this.getAuditLogs();
    const currentUser = this.getCurrentUser();
    logs.unshift({
      id: `log_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      actorName: currentUser.fullName,
      actorRole: currentUser.role,
      action,
      entityType,
      entityId,
      details,
      createdAt: new Date().toISOString(),
    });
    // Keep last 300 logs
    setItem(STORAGE_KEYS.AUDIT_LOGS, logs.slice(0, 300));
  }
}

export const storage = StorageService.getInstance();
