import React, { useEffect, useRef, useState } from 'react';
import { User } from 'firebase/auth';
import {
  BarChart3,
  Calendar,
  Check,
  ChevronDown,
  Clock,
  Columns,
  Download,
  FileSpreadsheet,
  FileType,
  FolderSync,
  GraduationCap,
  Layers,
  LayoutDashboard,
  Plus,
  Sparkles,
  TableProperties,
  Zap,
} from 'lucide-react';
import { Semester } from '../types';
import { formatVietnamFullDate, getVietnamNow } from '../utils/vietnamTime';
import { CloudSyncIndicator } from './CloudSyncIndicator';
import { SyncStatus } from '../services/cloudSync';

interface NavbarProps {
  semesters: Semester[];
  activeSemester: Semester;
  onSelectSemester: (semesterId: string) => void;
  onOpenSemesterModal: () => void;
  viewMode: 'table' | 'classes' | 'gantt' | 'catalog' | 'overview';
  onChangeViewMode: (mode: 'table' | 'classes' | 'gantt' | 'catalog' | 'overview') => void;
  onOpenCustomColumnsModal: () => void;
  onOpenHolidayModal: () => void;
  onOpenBackupModal: () => void;
  onExportExcel: () => void;
  onExportGanttPdf: () => void;
  onUpdateAndBatchExportAll?: () => void;
  user?: User | null;
  syncStatus?: SyncStatus;
  statusMessage?: string;
  onForceSync?: () => void;
  onToast: (msg: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  semesters,
  activeSemester,
  onSelectSemester,
  onOpenSemesterModal,
  viewMode,
  onChangeViewMode,
  onOpenCustomColumnsModal,
  onOpenHolidayModal,
  onOpenBackupModal,
  onExportExcel,
  onExportGanttPdf,
  onUpdateAndBatchExportAll,
  user = null,
  syncStatus = 'local_only',
  statusMessage,
  onForceSync,
  onToast,
}) => {
  const [vietnamDateStr, setVietnamDateStr] = useState<string>('');
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);
  const exportDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateTime = () => {
      const vnNow = getVietnamNow();
      const timeStr = vnNow.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
      const dateStr = formatVietnamFullDate(vnNow);
      setVietnamDateStr(`${dateStr} · ${timeStr} (Giờ VN)`);
    };

    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        exportDropdownRef.current &&
        !exportDropdownRef.current.contains(e.target as Node)
      ) {
        setIsExportDropdownOpen(false);
      }
    };
    if (isExportDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isExportDropdownOpen]);

  return (
    <header className="bg-slate-900 border-b border-slate-800/80 text-white sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-12 py-1 gap-3">
          {/* Left: Semester Selector & Clock */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-1.5 bg-slate-800/90 px-2.5 py-1 rounded-lg border border-slate-700/70 shadow-2xs">
              <Calendar className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <select
                value={activeSemester.id}
                onChange={(e) => onSelectSemester(e.target.value)}
                className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer pr-1 max-w-[180px] sm:max-w-[260px] truncate"
                title="Chọn học kỳ làm việc"
              >
                {semesters.map((s) => (
                  <option key={s.id} value={s.id} className="bg-slate-800 text-white">
                    {s.name}
                  </option>
                ))}
              </select>

              <button
                onClick={onOpenSemesterModal}
                title="Quản lý học kỳ / Sửa thời gian & số tuần"
                className="text-[11px] bg-slate-700/80 hover:bg-slate-600 text-slate-200 px-2 py-0.5 rounded transition-colors flex items-center gap-1 shrink-0 font-medium cursor-pointer"
              >
                <Plus className="w-3 h-3 text-emerald-400" />
                <span>Quản lý kỳ</span>
              </button>
            </div>

            {/* Vietnam Clock */}
            <div className="items-center gap-1.5 text-[11px] text-slate-400 font-mono hidden md:flex">
              <Clock className="w-3 h-3 text-emerald-400 shrink-0" />
              <span>{vietnamDateStr || 'Giờ Việt Nam (UTC+7)'}</span>
            </div>
          </div>

          {/* Right Action Tools */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Custom columns button */}
            <button
              onClick={onOpenCustomColumnsModal}
              className="text-xs text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 border border-slate-700 px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Tự tạo thêm cột linh hoạt"
            >
              <Columns className="w-3.5 h-3.5 text-sky-400" />
              <span className="hidden lg:inline">Thêm cột</span>
            </button>

            {/* Holiday settings button */}
            <button
              onClick={onOpenHolidayModal}
              className="text-xs text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 border border-slate-700 px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Thiết lập ngày nghỉ lễ (tự động trừ buổi Sáng / Chiều khi tính tiết)"
            >
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden lg:inline">Nghỉ lễ</span>
            </button>

            {/* Backup & snapshots */}
            <button
              onClick={onOpenBackupModal}
              className="text-xs text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 border border-slate-700 px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Sao lưu & Phục hồi dữ liệu"
            >
              <FolderSync className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden lg:inline">Sao lưu</span>
            </button>

            {/* Cloud Sync Status & Account indicator */}
            <CloudSyncIndicator
              user={user}
              syncStatus={syncStatus}
              statusMessage={statusMessage}
              onForceSync={onForceSync}
              onToast={onToast}
            />

            {/* Redesigned Export Dropdown Button */}
            <div className="relative" ref={exportDropdownRef}>
              <button
                type="button"
                onClick={() => setIsExportDropdownOpen(!isExportDropdownOpen)}
                className="text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 px-3 py-1.5 rounded-lg shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer border border-emerald-500/50"
                title="Xuất dữ liệu báo cáo (Excel hoặc PDF)"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Xuất</span>
                <ChevronDown className="w-3 h-3 text-emerald-200" />
              </button>

              {/* Export Choices Popover */}
              {isExportDropdownOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-80 bg-white rounded-xl shadow-xl border border-slate-200 p-2 z-50 text-slate-800 animate-in fade-in zoom-in-95 space-y-1.5">
                  <div className="px-2.5 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                    <span>Tùy chọn xuất báo cáo</span>
                  </div>

                  {/* Primary Option: Cập nhật và xuất (Tách riêng 2 file Excel + 2 file PDF Gantt) */}
                  {onUpdateAndBatchExportAll && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsExportDropdownOpen(false);
                        onUpdateAndBatchExportAll();
                      }}
                      className="w-full p-2.5 rounded-lg bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/80 hover:border-emerald-400 text-left transition-all flex items-start gap-2.5 cursor-pointer group shadow-2xs"
                    >
                      <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-xs">
                        <Zap className="w-4 h-4 fill-amber-300 text-amber-300" />
                      </div>
                      <div>
                        <div className="font-extrabold text-xs text-emerald-950 group-hover:text-emerald-800 flex items-center gap-1.5">
                          <span>Cập nhật và xuất</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-600 text-white font-bold">
                            Tự động 4 tệp
                          </span>
                        </div>
                        <div className="text-[11px] text-emerald-800 leading-tight mt-0.5 font-medium">
                          Tính lại tiến độ & xuất riêng 2 Excel + 2 PDF Gantt cho Cơ hữu & Thỉnh giảng
                        </div>
                      </div>
                    </button>
                  )}

                  <div className="h-px bg-slate-100 my-1" />

                  {/* Option 2: Standard Excel Report */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsExportDropdownOpen(false);
                      onExportExcel();
                    }}
                    className="w-full p-2 rounded-lg hover:bg-slate-50 text-left transition-colors flex items-start gap-2.5 cursor-pointer group"
                  >
                    <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="font-bold text-xs text-slate-900 group-hover:text-emerald-900">
                        Xuất Báo Cáo Chuẩn (Excel)
                      </div>
                      <div className="text-[10px] text-slate-500 leading-tight mt-0.5">
                        Bảng phân công & tiến độ gộp ô theo bộ lọc hiện tại (.xlsx)
                      </div>
                    </div>
                  </button>

                  {/* Option 3: Gantt Timeline PDF */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsExportDropdownOpen(false);
                      onExportGanttPdf();
                    }}
                    className="w-full p-2 rounded-lg hover:bg-slate-50 text-left transition-colors flex items-start gap-2.5 cursor-pointer group"
                  >
                    <div className="w-7 h-7 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <FileType className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="font-bold text-xs text-slate-900 group-hover:text-sky-900">
                        Xem Preview & Xuất Tiến Độ Tuần (PDF)
                      </div>
                      <div className="text-[10px] text-slate-500 leading-tight mt-0.5">
                        Mở bản xem trước để tùy chỉnh độ rộng cột và tải file (.pdf)
                      </div>
                    </div>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* View Mode Tabs Navigation */}
        <div className="flex items-center justify-between border-t border-slate-800 py-1.5 overflow-visible">
          <div className="flex items-center gap-1.5 bg-slate-800/70 p-1 rounded-lg border border-slate-700/60 shrink-0 overflow-visible">
            {/* Unified Assignment Tab with High-Visibility Integrated Dropdown */}
            <div
              className={`flex items-center rounded-lg transition-all p-0.5 border ${
                viewMode === 'table' || viewMode === 'classes'
                  ? 'bg-emerald-600/90 border-emerald-500 text-white shadow-xs'
                  : 'bg-slate-800/80 border-slate-700/70 text-slate-300 hover:text-white hover:bg-slate-700/60'
              }`}
            >
              <button
                type="button"
                onClick={() => {
                  if (viewMode !== 'table' && viewMode !== 'classes') {
                    onChangeViewMode('table');
                  }
                }}
                className="px-2.5 py-1 text-xs font-semibold flex items-center gap-1.5 cursor-pointer rounded-l-md hover:bg-white/10 transition-colors"
                title="Chuyển đến chế độ Phân công giảng dạy"
              >
                {viewMode === 'classes' ? (
                  <GraduationCap className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                ) : (
                  <TableProperties className="w-3.5 h-3.5 text-emerald-200 shrink-0" />
                )}
                <span>Phân công:</span>
              </button>

              <div className="relative flex items-center">
                <select
                  value={viewMode === 'classes' ? 'classes' : 'table'}
                  onChange={(e) => {
                    const mode = e.target.value as 'table' | 'classes';
                    onChangeViewMode(mode);
                  }}
                  className={`text-xs font-bold py-1 pl-2 pr-6 rounded-md cursor-pointer focus:outline-none transition-all appearance-none border ${
                    viewMode === 'table' || viewMode === 'classes'
                      ? 'bg-emerald-700 text-white border-emerald-400/40 hover:bg-emerald-600 focus:ring-1 focus:ring-emerald-300'
                      : 'bg-slate-900 text-slate-200 border-slate-600/80 hover:bg-slate-800 focus:ring-1 focus:ring-emerald-400'
                  }`}
                  style={{
                    backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2334d399' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 0.35rem center',
                    backgroundSize: '0.85em 0.85em',
                  }}
                  title="Chọn xem Phân công theo GV (Mặc định) hoặc theo Lớp"
                >
                  <option value="table" className="bg-slate-900 text-white font-semibold py-1">
                    Theo GV (Mặc định)
                  </option>
                  <option value="classes" className="bg-slate-900 text-white font-semibold py-1">
                    Theo Lớp
                  </option>
                </select>
              </div>
            </div>

            {/* Tab: Tiến Độ Tuần (Gantt Chart) */}
            <button
              onClick={() => onChangeViewMode('gantt')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'gantt'
                  ? 'bg-emerald-600 text-white shadow-xs font-bold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Tiến Độ Tuần (Gantt Chart)</span>
            </button>

            {/* Tab: Quản Lý GV, Môn và Lớp */}
            <button
              onClick={() => onChangeViewMode('catalog')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'catalog'
                  ? 'bg-emerald-600 text-white shadow-xs font-bold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Quản Lý GV, Môn và Lớp</span>
            </button>

            {/* Tab: Tổng Quan Học Kỳ */}
            <button
              onClick={() => onChangeViewMode('overview')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'overview'
                  ? 'bg-emerald-600 text-white shadow-xs font-bold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Tổng Quan Học Kỳ</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
