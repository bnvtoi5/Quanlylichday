import React, { useState } from 'react';
import { User } from 'firebase/auth';
import {
  Cloud,
  CloudCheck,
  CloudOff,
  Database,
  Eye,
  LogIn,
  LogOut,
  RefreshCw,
  Share2,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { SyncStatus } from '../services/cloudSync';
import { loginWithGoogle, logoutUser } from '../firebase';

interface CloudSyncIndicatorProps {
  user: User | null;
  syncStatus: SyncStatus;
  statusMessage?: string;
  onForceSync?: () => void;
  onToast: (msg: string) => void;
}

export const CloudSyncIndicator: React.FC<CloudSyncIndicatorProps> = ({
  user,
  syncStatus,
  statusMessage,
  onForceSync,
  onToast,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = async () => {
    try {
      setIsLoggingIn(true);
      await loginWithGoogle();
      onToast('Đăng nhập Google thành công! Bạn hiện có quyền chỉnh sửa & đồng bộ thời gian thực.');
    } catch (err: any) {
      console.error(err);
      onToast('Đăng nhập không thành công hoặc cửa sổ popup đã bị đóng.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      onToast('Đã đăng xuất tài khoản. Hệ thống chuyển về chế độ chỉ xem.');
    } catch (err) {
      console.error(err);
      onToast('Không thể đăng xuất.');
    }
  };

  return (
    <div className="relative">
      {/* Trigger Button on Navbar */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border shadow-2xs ${
          syncStatus === 'syncing'
            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
            : syncStatus === 'synced'
            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
            : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
        }`}
        title="Trạng thái đồng bộ đám mây Firebase (Mọi máy dùng chung)"
      >
        {syncStatus === 'syncing' ? (
          <>
            <RefreshCw className="w-3.5 h-3.5 text-amber-400 animate-spin" />
            <span className="hidden sm:inline">Đang lưu...</span>
          </>
        ) : syncStatus === 'synced' ? (
          <>
            <CloudCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Đã đồng bộ mây (Mọi máy)</span>
          </>
        ) : (
          <>
            <Cloud className="w-3.5 h-3.5 text-rose-400" />
            <span className="hidden sm:inline">Ngoại tuyến</span>
          </>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-84 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-4 z-50 text-white animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-400" />
              <span className="font-bold text-sm">Đồng Bộ Mây Dùng Chung</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white text-xs cursor-pointer p-1"
            >
              ✕
            </button>
          </div>

          {/* Sync Status Info */}
          <div className="py-3 space-y-3">
            <div className="p-2.5 bg-slate-800/80 rounded-lg border border-slate-700/60 text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-[11px]">Trạng thái mây:</span>
                <span
                  className={`font-bold flex items-center gap-1 text-[11px] ${
                    syncStatus === 'synced'
                      ? 'text-emerald-400'
                      : syncStatus === 'syncing'
                      ? 'text-amber-400'
                      : 'text-rose-400'
                  }`}
                >
                  {syncStatus === 'synced' && '● Đã kết nối & Đồng bộ thời gian thực'}
                  {syncStatus === 'syncing' && '● Đang lưu lên đám mây...'}
                  {syncStatus === 'error' && '● Lỗi kết nối đám mây'}
                </span>
              </div>
              <p className="text-[10px] text-slate-300">
                {statusMessage || 'Mọi thay đổi trên máy tính này sẽ tự động cập nhật đến tất cả các máy khác mở web.'}
              </p>
            </div>

            {/* Quick Force Sync Button */}
            {onForceSync && (
              <button
                onClick={() => {
                  onForceSync();
                  setIsOpen(false);
                }}
                className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold text-xs rounded-lg flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Đồng bộ ngay dữ liệu này cho mọi máy</span>
              </button>
            )}

            {/* User Profile / Login Area */}
            {user ? (
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-6 h-6 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-[10px]">
                    {user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}
                  </div>
                  <span className="text-xs text-slate-300 truncate max-w-[150px]">
                    {user.displayName || user.email}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="text-xs text-rose-400 hover:text-rose-300 cursor-pointer flex items-center gap-1"
                >
                  <LogOut className="w-3 h-3" />
                  <span>Đăng xuất</span>
                </button>
              </div>
            ) : (
              <div className="pt-2 border-t border-slate-800">
                <button
                  onClick={handleLogin}
                  disabled={isLoggingIn}
                  className="w-full py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg border border-slate-700 flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                >
                  <LogIn className="w-3 h-3 text-sky-400" />
                  <span>{isLoggingIn ? 'Đang mở đăng nhập...' : 'Đăng nhập Google (Tùy chọn)'}</span>
                </button>
              </div>
            )}
          </div>

          {/* Quota Optimization Note */}
          <div className="pt-3 border-t border-slate-800 text-[10px] text-slate-400 flex items-start gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
            <span>
              <strong>Dùng chung 1 kho dữ liệu (Shared Workspace):</strong> Mọi giáo viên được chia sẻ link khi đăng nhập đều cùng thao tác trên 1 cơ sở dữ liệu chung duy nhất. Thay đổi của bất kỳ ai sẽ lập tức xuất hiện trên màn hình của tất cả mọi người.
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
