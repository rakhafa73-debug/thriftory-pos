import React from 'react';
import {
  LayoutDashboard,
  ShoppingCart,
  Receipt,
  Shirt,
  Layers,
  Tag,
  Bookmark,
  Palette,
  Barcode,
  Package,
  ArrowUpDown,
  Truck,
  ShoppingBag,
  Users,
  UserCheck,
  Building2,
  BarChart3,
  FileText,
  Settings,
  User,
  LogOut,
  RefreshCw,
} from 'lucide-react';
import { UserRole } from '../../types';

export type NavItem =
  | 'dashboard'
  | 'pos'
  | 'transactions'
  | 'products'
  | 'variants'
  | 'categories'
  | 'brands'
  | 'sizes_colors'
  | 'barcode'
  | 'inventory'
  | 'stock_movements'
  | 'suppliers'
  | 'purchases'
  | 'customers'
  | 'employees'
  | 'branches'
  | 'reports'
  | 'audit_logs'
  | 'sync_status'
  | 'settings'
  | 'profile';

interface SidebarProps {
  activeTab: NavItem;
  onSelectTab: (tab: NavItem) => void;
  userRole: UserRole;
  isCollapsed?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  userRole,
}) => {
  const isCashier = userRole === 'cashier';

  // Navigation Items defined in the Master Prompt
  const navSections = [
    {
      title: 'OPERASIONAL UTAMA',
      items: [
        { id: 'dashboard' as NavItem, label: 'Dashboard', icon: LayoutDashboard, roles: ['owner', 'store_admin', 'cashier'] },
        { id: 'pos' as NavItem, label: 'Kasir POS', icon: ShoppingCart, roles: ['owner', 'store_admin', 'cashier'], highlight: true },
        { id: 'transactions' as NavItem, label: 'Riwayat Transaksi', icon: Receipt, roles: ['owner', 'store_admin', 'cashier'] },
      ],
    },
    {
      title: 'KATALOG & FASHION',
      items: [
        { id: 'products' as NavItem, label: 'Produk Fashion', icon: Shirt, roles: ['owner', 'store_admin', 'cashier'] },
        { id: 'variants' as NavItem, label: 'Varian Produk', icon: Layers, roles: ['owner', 'store_admin'] },
        { id: 'categories' as NavItem, label: 'Kategori', icon: Tag, roles: ['owner', 'store_admin'] },
        { id: 'brands' as NavItem, label: 'Brand', icon: Bookmark, roles: ['owner', 'store_admin'] },
        { id: 'sizes_colors' as NavItem, label: 'Ukuran & Warna', icon: Palette, roles: ['owner', 'store_admin'] },
        { id: 'barcode' as NavItem, label: 'Cetak Barcode Label', icon: Barcode, roles: ['owner', 'store_admin', 'cashier'] },
      ],
    },
    {
      title: 'INVENTARIS & SUPLAI',
      items: [
        { id: 'inventory' as NavItem, label: 'Inventaris Stok', icon: Package, roles: ['owner', 'store_admin', 'cashier'] },
        { id: 'stock_movements' as NavItem, label: 'Stok Opname & Mutasi', icon: ArrowUpDown, roles: ['owner', 'store_admin'] },
        { id: 'suppliers' as NavItem, label: 'Data Supplier', icon: Truck, roles: ['owner', 'store_admin'] },
        { id: 'purchases' as NavItem, label: 'Pembelian & PO', icon: ShoppingBag, roles: ['owner', 'store_admin'] },
      ],
    },
    {
      title: 'RELASI & BISNIS',
      items: [
        { id: 'customers' as NavItem, label: 'Pelanggan', icon: Users, roles: ['owner', 'store_admin', 'cashier'] },
        { id: 'employees' as NavItem, label: 'Karyawan & Hak Akses', icon: UserCheck, roles: ['owner', 'store_admin'] },
        { id: 'branches' as NavItem, label: 'Cabang Toko', icon: Building2, roles: ['owner'] },
        { id: 'reports' as NavItem, label: 'Laporan & Keuangan', icon: BarChart3, roles: ['owner', 'store_admin'] },
        { id: 'audit_logs' as NavItem, label: 'Audit Log', icon: FileText, roles: ['owner', 'store_admin'] },
        { id: 'sync_status' as NavItem, label: 'Status Sinkronisasi', icon: RefreshCw, roles: ['owner', 'store_admin', 'cashier'] },
        { id: 'settings' as NavItem, label: 'Pengaturan Toko', icon: Settings, roles: ['owner'] },
      ],
    },
    {
      title: 'AKUN',
      items: [
        { id: 'profile' as NavItem, label: 'Profil Saya', icon: User, roles: ['owner', 'store_admin', 'cashier'] },
      ],
    },
  ];

  return (
    <aside className="w-64 bg-[#223240] text-slate-300 flex flex-col h-full shrink-0 border-r border-[#223240]/50 select-none">
      {/* Role Notice */}
      <div className="px-4 py-3 bg-[#1d2a36] border-b border-white/5 flex items-center justify-between text-xs">
        <span className="text-slate-400">Akses Aktif:</span>
        <span className="font-bold text-[#E1A23D] uppercase tracking-wider font-mono">
          {userRole.replace('_', ' ')}
        </span>
      </div>

      {/* Nav List */}
      <div className="flex-1 overflow-y-auto py-3 px-2 space-y-5">
        {navSections.map((section, sIdx) => {
          const visibleItems = section.items.filter((item) =>
            item.roles.includes(userRole)
          );
          if (visibleItems.length === 0) return null;

          return (
            <div key={sIdx}>
              <p className="px-3 text-[10px] font-bold text-slate-400 tracking-wider mb-1.5 uppercase font-sans">
                {section.title}
              </p>
              <div className="space-y-0.5">
                {visibleItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;

                  return (
                    <button
                      key={item.id}
                      onClick={() => onSelectTab(item.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all text-left ${
                        isActive
                          ? 'bg-[#E1A23D] text-[#223240] font-bold shadow-sm'
                          : item.highlight
                          ? 'bg-[#2b3e4f] text-white hover:bg-[#344b5f]'
                          : 'text-slate-300 hover:text-white hover:bg-[#2b3e4f]'
                      }`}
                    >
                      <Icon
                        className={`w-4 h-4 shrink-0 ${
                          isActive
                            ? 'text-[#223240]'
                            : item.highlight
                            ? 'text-[#E1A23D]'
                            : 'text-slate-400'
                        }`}
                      />
                      <span className="truncate">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-white/5 text-[11px] text-slate-400 bg-[#1d2a36]">
        <div className="flex items-center justify-between">
          <span>THRIFTORY POS v1.2</span>
          <span className="text-emerald-400 font-mono">WIB (UTC+7)</span>
        </div>
      </div>
    </aside>
  );
};
