-- ==============================================================================
-- THRIFTORY POS: DATABASE MIGRATION & RLS SCHEMA
-- Migration: 20261012_init_thriftory.sql
-- Database: PostgreSQL 15+ / Supabase
-- Currency: IDR (Numeric/Decimal, strictly non-floating)
-- Timezone: Asia/Jakarta (UTC+7)
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. ENUMS
CREATE TYPE user_role AS ENUM ('owner', 'store_admin', 'cashier');
CREATE TYPE product_type AS ENUM ('thrift', 'vintage', 'distro', 'new');
CREATE TYPE condition_grade AS ENUM ('mint', 'grade_a', 'grade_b', 'vintage_fade', 'distressed');
CREATE TYPE payment_method_type AS ENUM ('cash', 'qris', 'bank_transfer', 'debit_card', 'credit_card');
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'refunded', 'failed');
CREATE TYPE sale_status AS ENUM ('completed', 'refunded', 'partially_refunded', 'cancelled');
CREATE TYPE sale_origin AS ENUM ('online', 'offline');
CREATE TYPE movement_type AS ENUM ('in', 'out', 'adjustment', 'transfer', 'sale', 'refund', 'stock_opname');
CREATE TYPE purchase_status AS ENUM ('draft', 'ordered', 'received', 'cancelled');
CREATE TYPE sync_status_type AS ENUM ('pending_sync', 'synced', 'conflict', 'failed');

-- 3. PROFILES & ACCESS CONTROL
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    phone TEXT,
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE stores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    legal_name TEXT,
    tax_number TEXT,
    phone TEXT NOT NULL,
    address TEXT NOT NULL,
    receipt_header TEXT DEFAULT 'THRIFTORY RETAIL & VINTAGE',
    receipt_footer TEXT DEFAULT 'Barang thrift tidak dapat ditukar/dikembalikan tanpa struk fisik. Terima Kasih!',
    currency TEXT DEFAULT 'IDR' NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE store_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    address TEXT,
    phone TEXT,
    is_main BOOLEAN DEFAULT FALSE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(store_id, code)
);

CREATE TABLE store_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    location_id UUID REFERENCES store_locations(id) ON DELETE SET NULL,
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    role user_role DEFAULT 'cashier' NOT NULL,
    can_give_discount BOOLEAN DEFAULT FALSE NOT NULL,
    can_refund BOOLEAN DEFAULT FALSE NOT NULL,
    can_cancel BOOLEAN DEFAULT FALSE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(store_id, profile_id)
);

CREATE TABLE devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    location_id UUID NOT NULL REFERENCES store_locations(id) ON DELETE CASCADE,
    device_name TEXT NOT NULL,
    device_identifier TEXT NOT NULL,
    last_synced_at TIMESTAMPTZ,
    is_authorized BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(store_id, device_identifier)
);

-- 4. FASHION PRODUCT & VARIANTS
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT,
    parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(store_id, slug)
);

CREATE TABLE brands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    country_of_origin TEXT,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(store_id, name)
);

CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    brand_id UUID REFERENCES brands(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    product_type product_type DEFAULT 'thrift' NOT NULL,
    description TEXT,
    primary_image_url TEXT,
    additional_images TEXT[] DEFAULT '{}',
    is_one_of_one BOOLEAN DEFAULT FALSE NOT NULL, -- For thrift 1-of-1 items
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(store_id, slug)
);

CREATE TABLE product_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    sku TEXT NOT NULL,
    barcode TEXT NOT NULL,
    size_label TEXT NOT NULL, -- XS, S, M, L, XL, XXL, Free Size, etc.
    color_label TEXT NOT NULL,
    condition_grade condition_grade DEFAULT 'grade_a',
    cost_price NUMERIC(15, 2) NOT NULL CHECK (cost_price >= 0),
    selling_price NUMERIC(15, 2) NOT NULL CHECK (selling_price >= 0),
    min_stock_alert INT DEFAULT 1 NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(sku),
    UNIQUE(barcode)
);

CREATE INDEX idx_variants_barcode ON product_variants(barcode);
CREATE INDEX idx_variants_sku ON product_variants(sku);

-- 5. INVENTORY & STOCK MOVEMENTS
CREATE TABLE inventory_balances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    variant_id UUID NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
    location_id UUID NOT NULL REFERENCES store_locations(id) ON DELETE CASCADE,
    quantity INT DEFAULT 0 NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(variant_id, location_id)
);

CREATE TABLE inventory_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    location_id UUID NOT NULL REFERENCES store_locations(id) ON DELETE CASCADE,
    variant_id UUID NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
    movement_type movement_type NOT NULL,
    quantity INT NOT NULL, -- positive for in, negative for out
    previous_quantity INT NOT NULL,
    new_quantity INT NOT NULL,
    reference_id UUID, -- Sale ID, PO ID, or Stock Transfer ID
    reference_number TEXT,
    notes TEXT,
    performed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 6. CUSTOMERS & SUPPLIERS
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    address TEXT,
    notes TEXT,
    total_spent NUMERIC(15, 2) DEFAULT 0 NOT NULL,
    total_orders INT DEFAULT 0 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(store_id, phone)
);

CREATE TABLE suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    contact_person TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    location_id UUID NOT NULL REFERENCES store_locations(id) ON DELETE CASCADE,
    supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
    po_number TEXT NOT NULL,
    total_amount NUMERIC(15, 2) DEFAULT 0 NOT NULL,
    status purchase_status DEFAULT 'draft' NOT NULL,
    notes TEXT,
    ordered_at TIMESTAMPTZ,
    received_at TIMESTAMPTZ,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(store_id, po_number)
);

CREATE TABLE purchase_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_id UUID NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
    variant_id UUID NOT NULL REFERENCES product_variants(id) ON DELETE RESTRICT,
    quantity INT NOT NULL CHECK (quantity > 0),
    unit_cost NUMERIC(15, 2) NOT NULL CHECK (unit_cost >= 0),
    line_total NUMERIC(15, 2) NOT NULL CHECK (line_total >= 0)
);

-- 7. SALES & ATOMIC TRANSACTIONS
CREATE TABLE sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    location_id UUID NOT NULL REFERENCES store_locations(id) ON DELETE CASCADE,
    cashier_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    invoice_number TEXT NOT NULL,
    idempotency_key TEXT NOT NULL,
    device_id TEXT,
    local_transaction_id TEXT,
    subtotal NUMERIC(15, 2) NOT NULL CHECK (subtotal >= 0),
    discount_amount NUMERIC(15, 2) DEFAULT 0 NOT NULL CHECK (discount_amount >= 0),
    tax_amount NUMERIC(15, 2) DEFAULT 0 NOT NULL CHECK (tax_amount >= 0),
    total_amount NUMERIC(15, 2) NOT NULL CHECK (total_amount >= 0),
    payment_status payment_status DEFAULT 'completed' NOT NULL,
    transaction_status sale_status DEFAULT 'completed' NOT NULL,
    origin sale_origin DEFAULT 'online' NOT NULL,
    notes TEXT,
    device_created_at TIMESTAMPTZ,
    server_received_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(store_id, invoice_number),
    UNIQUE(store_id, idempotency_key)
);

CREATE TABLE sale_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    variant_id UUID NOT NULL REFERENCES product_variants(id) ON DELETE RESTRICT,
    product_name_snapshot TEXT NOT NULL,
    sku_snapshot TEXT NOT NULL,
    barcode_snapshot TEXT NOT NULL,
    size_snapshot TEXT NOT NULL,
    color_snapshot TEXT NOT NULL,
    condition_grade_snapshot condition_grade,
    quantity INT NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(15, 2) NOT NULL CHECK (unit_price >= 0),
    unit_cost_snapshot NUMERIC(15, 2) NOT NULL CHECK (unit_cost_snapshot >= 0),
    discount_amount NUMERIC(15, 2) DEFAULT 0 NOT NULL CHECK (discount_amount >= 0),
    line_total NUMERIC(15, 2) NOT NULL CHECK (line_total >= 0)
);

CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    payment_method payment_method_type NOT NULL,
    amount_paid NUMERIC(15, 2) NOT NULL CHECK (amount_paid >= 0),
    amount_received NUMERIC(15, 2) NOT NULL CHECK (amount_received >= 0),
    change_given NUMERIC(15, 2) DEFAULT 0 NOT NULL CHECK (change_given >= 0),
    reference_code TEXT,
    status payment_status DEFAULT 'completed' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 8. REFUNDS & CANCELLATIONS
CREATE TABLE refunds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    authorized_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
    refund_number TEXT NOT NULL,
    refund_amount NUMERIC(15, 2) NOT NULL CHECK (refund_amount > 0),
    reason TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(store_id, refund_number)
);

CREATE TABLE refund_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    refund_id UUID NOT NULL REFERENCES refunds(id) ON DELETE CASCADE,
    sale_item_id UUID NOT NULL REFERENCES sale_items(id) ON DELETE RESTRICT,
    quantity INT NOT NULL CHECK (quantity > 0),
    restock_to_inventory BOOLEAN DEFAULT TRUE NOT NULL
);

-- 9. STOCK OPNAME & AUDIT LOGS
CREATE TABLE stock_counts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    location_id UUID NOT NULL REFERENCES store_locations(id) ON DELETE CASCADE,
    opname_number TEXT NOT NULL,
    conducted_by UUID NOT NULL REFERENCES profiles(id),
    status TEXT DEFAULT 'completed' NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(store_id, opname_number)
);

CREATE TABLE stock_count_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stock_count_id UUID NOT NULL REFERENCES stock_counts(id) ON DELETE CASCADE,
    variant_id UUID NOT NULL REFERENCES product_variants(id) ON DELETE RESTRICT,
    system_quantity INT NOT NULL,
    physical_quantity INT NOT NULL,
    variance INT NOT NULL,
    unit_cost NUMERIC(15, 2) NOT NULL,
    variance_value NUMERIC(15, 2) NOT NULL
);

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    actor_email TEXT,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    details JSONB DEFAULT '{}'::jsonb,
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE sync_receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    device_id TEXT NOT NULL,
    idempotency_key TEXT NOT NULL,
    local_transaction_id TEXT NOT NULL,
    sale_id UUID REFERENCES sales(id) ON DELETE SET NULL,
    status sync_status_type DEFAULT 'synced' NOT NULL,
    received_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    reconciled_at TIMESTAMPTZ,
    conflict_notes TEXT,
    UNIQUE(store_id, idempotency_key)
);

-- 10. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_counts ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_receipts ENABLE ROW LEVEL SECURITY;

-- Helper security functions
CREATE OR REPLACE FUNCTION get_user_store_ids()
RETURNS TABLE (store_id UUID) AS $$
BEGIN
    RETURN QUERY
    SELECT sm.store_id
    FROM store_members sm
    WHERE sm.profile_id = auth.uid() AND sm.is_active = TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_user_role(target_store_id UUID)
RETURNS user_role AS $$
DECLARE
    r user_role;
BEGIN
    SELECT role INTO r
    FROM store_members
    WHERE profile_id = auth.uid() AND store_id = target_store_id AND is_active = TRUE;
    RETURN r;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Sample: Sales Policy
CREATE POLICY "Users can view sales for their assigned store"
ON sales FOR SELECT
USING (store_id IN (SELECT get_user_store_ids()));

CREATE POLICY "Cashiers and Admins can insert sales"
ON sales FOR INSERT
WITH CHECK (
    store_id IN (SELECT get_user_store_ids())
    AND (get_user_role(store_id) IN ('owner', 'store_admin', 'cashier'))
);

-- RLS Sample: Cost price restriction
-- Cashiers should not see cost_price directly in production queries via Supabase Views or restricted column select.
