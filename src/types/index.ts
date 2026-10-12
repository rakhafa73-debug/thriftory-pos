export type UserRole = 'owner' | 'store_admin' | 'cashier';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  storeId: string;
  locationId: string;
  avatarUrl?: string;
  canGiveDiscount: boolean;
  canRefund: boolean;
  canCancel: boolean;
  isActive: boolean;
}

export interface Store {
  id: string;
  name: string;
  legalName?: string;
  phone: string;
  address: string;
  receiptHeader: string;
  receiptFooter: string;
  currency: string;
  taxPercentage: number;
}

export interface StoreLocation {
  id: string;
  storeId: string;
  name: string;
  code: string;
  address: string;
  isMain: boolean;
}

export type ProductType = 'thrift' | 'vintage' | 'distro' | 'new';
export type ConditionGrade = 'mint' | 'grade_a' | 'grade_b' | 'vintage_fade' | 'distressed';

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  productCount?: number;
}

export interface Brand {
  id: string;
  name: string;
  countryOfOrigin?: string;
}

export interface Product {
  id: string;
  storeId: string;
  categoryId: string;
  brandId: string;
  name: string;
  slug: string;
  productType: ProductType;
  description?: string;
  primaryImageUrl: string;
  isOneOfOne: boolean; // Thrift 1-of-1
  isActive: boolean;
  createdAt: string;
}

export interface ProductVariant {
  id: string;
  productId: string;
  sku: string;
  barcode: string;
  sizeLabel: string; // XS, S, M, L, XL, XXL, Custom
  colorLabel: string;
  conditionGrade?: ConditionGrade;
  costPrice: number; // Harga modal (hidden from cashier)
  sellingPrice: number; // Harga jual
  stock: number;
  minStockAlert: number;
  isActive: boolean;
}

export interface ProductWithVariants extends Product {
  categoryName?: string;
  brandName?: string;
  variants: ProductVariant[];
  totalStock?: number;
  minPrice?: number;
  maxPrice?: number;
}

export interface CartItem {
  variantId: string;
  productId: string;
  productName: string;
  imageUrl: string;
  sku: string;
  barcode: string;
  sizeLabel: string;
  colorLabel: string;
  conditionGrade?: ConditionGrade;
  isOneOfOne: boolean;
  sellingPrice: number;
  costPrice: number;
  quantity: number;
  availableStock: number;
  discountAmount: number;
  lineTotal: number;
}

export type PaymentMethod = 'cash' | 'qris' | 'bank_transfer' | 'debit_card' | 'credit_card';
export type PaymentStatus = 'pending' | 'completed' | 'refunded' | 'failed';
export type SaleStatus = 'completed' | 'refunded' | 'partially_refunded' | 'cancelled';
export type SaleOrigin = 'online' | 'offline';
export type SyncStatus = 'pending_sync' | 'synced' | 'conflict' | 'failed';

export interface SaleItem {
  id: string;
  saleId: string;
  variantId: string;
  productNameSnapshot: string;
  skuSnapshot: string;
  barcodeSnapshot: string;
  sizeSnapshot: string;
  colorSnapshot: string;
  conditionGradeSnapshot?: ConditionGrade;
  quantity: number;
  unitPrice: number;
  unitCostSnapshot: number;
  discountAmount: number;
  lineTotal: number;
}

export interface Sale {
  id: string;
  storeId: string;
  locationId: string;
  cashierId: string;
  cashierName: string;
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  invoiceNumber: string;
  idempotencyKey: string;
  deviceId: string;
  localTransactionId?: string;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  amountReceived: number;
  changeGiven: number;
  paymentStatus: PaymentStatus;
  transactionStatus: SaleStatus;
  origin: SaleOrigin;
  syncStatus: SyncStatus;
  notes?: string;
  refundReason?: string;
  deviceCreatedAt?: string;
  createdAt: string;
  items: SaleItem[];
}

export type MovementType = 'in' | 'out' | 'adjustment' | 'transfer' | 'sale' | 'refund' | 'stock_opname';

export interface StockMovement {
  id: string;
  variantId: string;
  variantSku: string;
  productName: string;
  movementType: MovementType;
  quantity: number;
  previousQuantity: number;
  newQuantity: number;
  referenceNumber: string;
  notes?: string;
  performedBy: string;
  createdAt: string;
}

export interface Customer {
  id: string;
  storeId: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  notes?: string;
  totalSpent: number;
  totalOrders: number;
  lastPurchaseDate?: string;
  createdAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email?: string;
  address?: string;
  notes?: string;
  isActive: boolean;
}

export type PurchaseStatus = 'draft' | 'ordered' | 'received' | 'cancelled';

export interface PurchaseOrderItem {
  id: string;
  variantId: string;
  variantSku: string;
  productName: string;
  quantity: number;
  unitCost: number;
  lineTotal: number;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  status: PurchaseStatus;
  totalAmount: number;
  notes?: string;
  items: PurchaseOrderItem[];
  orderedAt?: string;
  receivedAt?: string;
  createdAt: string;
}

export interface StockOpnameItem {
  variantId: string;
  sku: string;
  productName: string;
  sizeLabel: string;
  colorLabel: string;
  systemQuantity: number;
  physicalQuantity: number;
  variance: number;
  unitCost: number;
  varianceValue: number;
}

export interface StockOpname {
  id: string;
  opnameNumber: string;
  conductedBy: string;
  status: 'completed' | 'in_progress';
  notes?: string;
  totalItemsChecked: number;
  totalDiscrepancyQty: number;
  totalDiscrepancyValue: number;
  createdAt: string;
  items: StockOpnameItem[];
}

export interface AuditLog {
  id: string;
  actorName: string;
  actorRole: UserRole;
  action: string;
  entityType: string;
  entityId?: string;
  details: string;
  createdAt: string;
}

export interface SyncQueueItem {
  id: string;
  idempotencyKey: string;
  deviceId: string;
  operationType: 'create_sale' | 'update_stock';
  payload: any;
  status: SyncStatus;
  retryCount: number;
  lastError?: string;
  createdAt: string;
}
