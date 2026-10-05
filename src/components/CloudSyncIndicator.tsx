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
          !user
            ? 'bg-slate-800 text-sky-300 border-sky-500/40 hover:bg-slate-700'
            : syncStatus === 'syncing'
            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
            : syncStatus === 'synced'
            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
            : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
        }`}
        title="Trạng thái đồng bộ đám mây Firebase & Phân quyền"
      >
        {!user ? (
          <>
            <Eye className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden sm:inline">Chế độ xem</span>
          </>
        ) : syncStatus === 'syncing' ? (
          <>
            <RefreshCw className="w-3.5 h-3.5 text-amber-400 animate-spin" />
            <span className="hidden sm:inline">Đang lưu...</span>
          </>
        ) : syncStatus === 'synced' ? (
          <>
            <CloudCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Đã đồng bộ mây</span>
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
              <span className="font-bold text-sm">Đồng Bộ & Chia Sẻ Mây</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white text-xs cursor-pointer p-1"
            >
              ✕
            </button>
          </div>

          {/* User Profile Area */}
          <div className="py-3">
            {user ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2.5">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || 'User'}
                      className="w-8 h-8 rounded-full border border-emerald-500/40"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-xs">
                      {user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-xs truncate text-slate-100 flex items-center gap-1.5">
                      <span>{user.displayName || 'Cộng tác viên'}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-600/50">
                        Chỉnh sửa
                      </span>
                    </p>
                    <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                  </div>
                </div>

                {/* Sync status card */}
                <div className="p-2.5 bg-slate-800/80 rounded-lg border border-slate-700/60 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-[11px]">Trạng thái:</span>
                    <span
                      className={`font-bold flex items-center gap-1 text-[11px] ${
                        syncStatus === 'synced'
                          ? 'text-emerald-400'
                          : syncStatus === 'syncing'
                          ? 'text-amber-400'
                          : 'text-rose-400'
                      }`}
                    >
                      {syncStatus === 'synced' && '● Đang đồng bộ thời gian thực'}
                      {syncStatus === 'syncing' && '● Đang lưu lên đám mây...'}
                      {syncStatus === 'error' && '● Lỗi đồng bộ'}
                    </span>
                  </div>
                  {statusMessage && (
                    <p className="text-[10px] text-slate-400 italic">{statusMessage}</p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-1">
                  {onForceSync && (
                    <button
                      onClick={() => {
                        onForceSync();
                        onToast('Đang tiến hành đồng bộ dữ liệu ngay lập tức...');
                      }}
                      className="flex-1 py-1.5 px-2 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <RefreshCw className="w-3 h-3 text-emerald-400" />
                      <span>Đồng bộ ngay</span>
                    </button>
                  )}

                  <button
                    onClick={handleLogout}
                    className="py-1.5 px-3 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-semibold rounded-lg border border-rose-500/40 flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <LogOut className="w-3 h-3" />
                    <span>Đăng xuất</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-2.5 bg-sky-950/40 border border-sky-800/50 rounded-lg text-xs space-y-1.5">
                  <div className="flex items-center gap-1.5 text-sky-300 font-bold text-[11px]">
                    <Users className="w-3.5 h-3.5" />
                    <span>Dành cho người xem / Đồng nghiệp:</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Bạn đang ở <strong>Chế độ xem trực tuyến</strong> (được tải trực tiếp từ cơ sở dữ liệu mây).
                  </p>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Để được <strong>quyền thêm sửa dữ liệu, phân công giảng dạy và lưu lên mây</strong>, hãy đăng nhập bằng tài khoản Google.
                  </p>
                </div>

                <button
                  onClick={handleLogin}
                  disabled={isLoggingIn}
                  className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-lg flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>{isLoggingIn ? 'Đang mở đăng nhập...' : 'Đăng nhập Google để chỉnh sửa'}</span>
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
