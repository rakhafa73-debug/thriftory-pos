import React from 'react';
import {
  Wifi,
  WifiOff,
  RefreshCw,
  Smartphone,
  Monitor,
  ShieldCheck,
  User,
  Store,
  ChevronDown,
} from 'lucide-react';
import { UserProfile, UserRole } from '../../types';
import { INITIAL_PROFILES } from '../../services/storage';

interface HeaderProps {
  currentUser: UserProfile;
  onSwitchUser: (user: UserProfile) => void;
  isOffline: boolean;
  onToggleOffline: () => void;
  pendingSyncCount: number;
  onTriggerSync: () => void;
  isMobileSimulator: boolean;
  onToggleMobileSimulator: () => void;
  activeBranchName: string;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  onSwitchUser,
  isOffline,
  onToggleOffline,
  pendingSyncCount,
  onTriggerSync,
  isMobileSimulator,
  onToggleMobileSimulator,
  activeBranchName,
}) => {
  const [showUserDropdown, setShowUserDropdown] = React.useState(false);

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case 'owner':
        return 'Owner / Super Admin';
      case 'store_admin':
        return 'Admin Toko';
      case 'cashier':
        return 'Kasir (Restricted)';
      default:
        return role;
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-[#223240] text-white border-b border-[#223240]/40 shadow-sm">
      <div className="flex items-center justify-between px-4 lg:px-6 h-15 gap-4">
        {/* Zone 1: Brand & Branch Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-[#E1A23D] flex items-center justify-center font-bold text-[#223240] text-base tracking-wider shadow-inner">
              T
            </span>
            <div className="leading-tight">
              <span className="font-extrabold tracking-tight text-lg text-white font-sans">
                THRIFTORY
              </span>
              <span className="text-[#E1A23D] font-mono text-xs font-semibold ml-1.5">
                POS
              </span>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#2b3e4f] text-xs text-slate-300 font-medium border border-white/5">
            <Store className="w-3.5 h-3.5 text-[#E1A23D]" />
            <span className="truncate max-w-[150px]">{activeBranchName}</span>
          </div>
        </div>

        {/* Zone 2: Offline Engine, Sync Outbox, Device Mode */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Offline / Online Simulator Button */}
          <button
            onClick={onToggleOffline}
            title={isOffline ? 'Klik untuk kembali Online' : 'Klik untuk simulasi Offline'}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
              isOffline
                ? 'bg-rose-950/80 border-rose-500/60 text-rose-200 animate-pulse'
                : 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/60'
            }`}
          >
            {isOffline ? (
              <>
                <WifiOff className="w-3.5 h-3.5 text-rose-400" />
                <span className="hidden md:inline">Mode Offline</span>
                <span className="md:hidden">Offline</span>
              </>
            ) : (
              <>
                <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden md:inline">Cloud Online</span>
                <span className="md:hidden">Online</span>
              </>
            )}
          </button>

          {/* Sync Outbox Queue */}
          {pendingSyncCount > 0 && (
            <button
              onClick={onTriggerSync}
              title="Sinkronisasi antrean transaksi lokal ke cloud"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#E1A23D]/20 text-[#E1A23D] border border-[#E1A23D]/50 hover:bg-[#E1A23D]/30 transition text-xs font-bold"
            >
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#E1A23D]" />
              <span>{pendingSyncCount} Pending Sync</span>
            </button>
          )}

          {/* Mobile / Desktop Simulator Toggle */}
          <button
            onClick={onToggleMobileSimulator}
            title={isMobileSimulator ? 'Beralih ke Tampilan Desktop' : 'Beralih ke Simulator POS Mobile'}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition border ${
              isMobileSimulator
                ? 'bg-[#E1A23D] text-[#223240] border-[#E1A23D] font-bold shadow-sm'
                : 'bg-[#2b3e4f] text-slate-200 border-white/10 hover:bg-[#344b5f]'
            }`}
          >
            {isMobileSimulator ? (
              <>
                <Monitor className="w-3.5 h-3.5" />
                <span className="hidden lg:inline">Mode Desktop</span>
              </>
            ) : (
              <>
                <Smartphone className="w-3.5 h-3.5" />
                <span className="hidden lg:inline">Simulator Mobile</span>
              </>
            )}
          </button>

          {/* User Profile & Role Switcher */}
          <div className="relative">
            <button
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[#2b3e4f] hover:bg-[#344b5f] border border-white/10 text-xs font-medium transition"
            >
              <div className="w-6 h-6 rounded-full bg-[#E1A23D]/30 text-[#E1A23D] flex items-center justify-center font-bold text-xs">
                {currentUser.fullName.charAt(0)}
              </div>
              <div className="text-left hidden sm:block">
                <p className="font-semibold text-white leading-none truncate max-w-[120px]">
                  {currentUser.fullName.split(' ')[0]}
                </p>
                <p className="text-[10px] text-slate-300 mt-0.5 font-mono">
                  {currentUser.role.toUpperCase()}
                </p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {showUserDropdown && (
              <div className="absolute right-0 mt-2 w-64 bg-white text-[#223240] rounded-xl shadow-2xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-1">
                <div className="px-3.5 py-2 border-b border-slate-100">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Ganti Role Pengguna
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Uji pembatasan hak akses kasir vs admin
                  </p>
                </div>

                <div className="py-1">
                  {INITIAL_PROFILES.map((profile) => (
                    <button
                      key={profile.id}
                      onClick={() => {
                        onSwitchUser(profile);
                        setShowUserDropdown(false);
                      }}
                      className={`w-full text-left px-3.5 py-2.5 text-xs flex items-center justify-between transition ${
                        currentUser.id === profile.id
                          ? 'bg-[#FDFBF7] font-bold text-[#223240]'
                          : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div>
                        <p className="font-medium">{profile.fullName}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {getRoleLabel(profile.role)}
                        </p>
                      </div>
                      {currentUser.id === profile.id && (
                        <ShieldCheck className="w-4 h-4 text-[#E1A23D]" />
                      )}
                    </button>
                  ))}
                </div>

                <div className="px-3.5 py-2 border-t border-slate-100 bg-[#FDFBF7] text-[11px] text-slate-500 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>Kasir tidak bisa melihat harga modal/HPP</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
