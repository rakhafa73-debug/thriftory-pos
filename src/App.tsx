import React, { useState, useEffect } from 'react';
import { UserProfile, ProductVariant, Store } from './types';
import { storage } from './services/storage';
import { Header } from './components/common/Header';
import { Sidebar, NavItem } from './components/common/Sidebar';
import { POSInterface } from './components/pos/POSInterface';
import { MobilePOSView } from './components/pos/MobilePOSView';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { ProductManagement } from './components/admin/ProductManagement';
import { InventoryManagement } from './components/admin/InventoryManagement';
import { StockOpnameView } from './components/admin/StockOpname';
import { PurchaseManagement } from './components/admin/PurchaseManagement';
import { CustomerManagement } from './components/admin/CustomerManagement';
import { EmployeeManagement } from './components/admin/EmployeeManagement';
import { TransactionHistory } from './components/admin/TransactionHistory';
import { ReportsManagement } from './components/admin/ReportsManagement';
import { SyncStatusManagement } from './components/admin/SyncStatusManagement';
import { StoreSettings } from './components/admin/StoreSettings';
import { AuditLogView } from './components/admin/AuditLogView';
import { BarcodePrintView } from './components/admin/BarcodePrintView';
import { CategoryBrandManagement } from './components/admin/CategoryBrandManagement';

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile>(storage.getCurrentUser());
  const [store, setStore] = useState<Store>(storage.getStore());
  const [isOffline, setIsOffline] = useState<boolean>(storage.isOffline());
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(storage.getSyncQueue().length);
  const [isMobileSimulator, setIsMobileSimulator] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<NavItem>('pos'); // Default to POS for rapid cashier test

  // Barcode quick print state
  const [barcodePrintVariant, setBarcodePrintVariant] = useState<{
    variant: ProductVariant;
    productName: string;
  } | null>(null);

  const refreshSyncCount = () => {
    setPendingSyncCount(storage.getSyncQueue().length);
  };

  const handleSwitchUser = (user: UserProfile) => {
    storage.setCurrentUser(user);
    setCurrentUser(user);
    // If cashier cannot access current admin tab, redirect to POS
    if (user.role === 'cashier' && ['employees', 'reports', 'settings', 'branches'].includes(activeTab)) {
      setActiveTab('pos');
    }
  };

  const handleToggleOffline = () => {
    const nextState = !isOffline;
    storage.setOfflineSimulation(nextState);
    setIsOffline(nextState);
    refreshSyncCount();
  };

  const handleTriggerSync = () => {
    storage.processSyncQueue();
    refreshSyncCount();
  };

  const handleSelectPrintBarcode = (variant: ProductVariant, productName: string) => {
    setBarcodePrintVariant({ variant, productName });
    setActiveTab('barcode');
  };

  // Render main content area
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <AdminDashboard currentUser={currentUser} />;
      case 'pos':
        return (
          <POSInterface
            currentUser={currentUser}
            store={store}
            onRefreshData={refreshSyncCount}
          />
        );
      case 'transactions':
        return <TransactionHistory currentUser={currentUser} store={store} />;
      case 'products':
      case 'variants':
        return (
          <ProductManagement
            currentUser={currentUser}
            onSelectPrintBarcode={handleSelectPrintBarcode}
          />
        );
      case 'categories':
      case 'brands':
      case 'sizes_colors':
        return <CategoryBrandManagement currentUser={currentUser} />;
      case 'barcode':
        return (
          <BarcodePrintView
            store={store}
            selectedVariant={barcodePrintVariant?.variant}
            selectedProductName={barcodePrintVariant?.productName}
          />
        );
      case 'inventory':
        return <InventoryManagement currentUser={currentUser} />;
      case 'stock_movements':
        return <StockOpnameView currentUser={currentUser} />;
      case 'suppliers':
      case 'purchases':
        return <PurchaseManagement currentUser={currentUser} />;
      case 'customers':
        return <CustomerManagement currentUser={currentUser} />;
      case 'employees':
        return <EmployeeManagement currentUser={currentUser} />;
      case 'branches':
      case 'settings':
      case 'profile':
        return <StoreSettings currentUser={currentUser} activeTab={activeTab as any} />;
      case 'reports':
        return <ReportsManagement currentUser={currentUser} />;
      case 'audit_logs':
        return <AuditLogView />;
      case 'sync_status':
        return <SyncStatusManagement currentUser={currentUser} />;
      default:
        return <AdminDashboard currentUser={currentUser} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col font-sans text-[#223240] selection:bg-[#E1A23D]/20">
      {/* Universal Top Header */}
      <Header
        currentUser={currentUser}
        onSwitchUser={handleSwitchUser}
        isOffline={isOffline}
        onToggleOffline={handleToggleOffline}
        pendingSyncCount={pendingSyncCount}
        onTriggerSync={handleTriggerSync}
        isMobileSimulator={isMobileSimulator}
        onToggleMobileSimulator={() => setIsMobileSimulator(!isMobileSimulator)}
        activeBranchName="Kemang Flagship"
      />

      {/* Main Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {isMobileSimulator ? (
          // Mobile Touch App Simulator View
          <main className="flex-1 overflow-y-auto">
            <MobilePOSView currentUser={currentUser} store={store} />
          </main>
        ) : (
          // Desktop Admin & POS Workspace
          <>
            <Sidebar
              activeTab={activeTab}
              onSelectTab={(tab) => {
                setActiveTab(tab);
                refreshSyncCount();
              }}
              userRole={currentUser.role}
            />

            <main className="flex-1 overflow-y-auto bg-[#FDFBF7]">
              {renderContent()}
            </main>
          </>
        )}
      </div>
    </div>
  );
}
