import React, { useState } from 'react';
import {
  CalendarClock,
  CheckSquare,
  Filter,
  Percent,
  Plus,
  RotateCcw,
  Search,
  Square,
  Trash2,
  X,
  Zap,
} from 'lucide-react';
import { ConfirmModal } from './ConfirmModal';

interface FilterBarProps {
  searchTerm: string;
  onSearchChange: (val: string) => void;
  selectedPosition: string;
  onPositionChange: (pos: string) => void;
  availablePositions: string[];
  selectedStatus: string;
  onStatusChange: (status: string) => void;
  minProgressPercent: string;
  onMinProgressChange: (val: string) => void;
  maxProgressPercent: string;
  onMaxProgressChange: (val: string) => void;
  remainingWeeksFilter: string;
  onRemainingWeeksChange: (val: string) => void;
  remainingWeeksMode: 'exact' | 'lte';
  onRemainingWeeksModeChange: (mode: 'exact' | 'lte') => void;
  selectedCourseIds: string[];
  totalFilteredCoursesCount: number;
  isAllFilteredSelected: boolean;
  onToggleSelectAllFiltered: () => void;
  onClearSelection: () => void;
  onBatchAutoCalculate: () => void;
  onBatchDeleteCourses: () => void;
  onOpenAddTeacher: () => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  searchTerm,
  onSearchChange,
  selectedPosition,
  onPositionChange,
  availablePositions,
  selectedStatus,
  onStatusChange,
  minProgressPercent,
  onMinProgressChange,
  maxProgressPercent,
  onMaxProgressChange,
  remainingWeeksFilter,
  onRemainingWeeksChange,
  remainingWeeksMode,
  onRemainingWeeksModeChange,
  selectedCourseIds,
  totalFilteredCoursesCount,
  isAllFilteredSelected,
  onToggleSelectAllFiltered,
  onClearSelection,
  onBatchAutoCalculate,
  onBatchDeleteCourses,
  onOpenAddTeacher,
}) => {
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    confirmText?: string;
    isDanger?: boolean;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const hasSelectedCourses = selectedCourseIds.length > 0;
  const hasProgressFilter = minProgressPercent.trim() !== '' || maxProgressPercent.trim() !== '';
  const hasRemainingWeeksFilter = remainingWeeksFilter.trim() !== '';
  const hasAnyAdvancedFilter =
    hasProgressFilter ||
    hasRemainingWeeksFilter ||
    selectedPosition !== 'ALL' ||
    selectedStatus !== 'ALL' ||
    searchTerm.trim() !== '';

  const applyProgressPreset = (min: string, max: string) => {
    onMinProgressChange(min);
    onMaxProgressChange(max);
  };

  return (
    <div className="bg-white rounded-xl p-3 border border-slate-200/80 shadow-xs mb-4 space-y-2.5">
      {/* Row 1: Primary search & core filters */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2.5">
        {/* Search input */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo tên Giảng viên, Môn học, Lớp (CSDL, CNTT26TH1, Nguyễn Văn A)..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-8 py-1.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-800 placeholder-slate-400"
          />
          {searchTerm && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filters Group + Select All Toggle + Add Teacher Button */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Select All Toggle Button */}
          {totalFilteredCoursesCount > 0 && (
            <button
              type="button"
              onClick={onToggleSelectAllFiltered}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border ${
                isAllFilteredSelected
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
              title="Chọn tất cả các môn của các giảng viên đang hiển thị theo lọc"
            >
              {isAllFilteredSelected ? (
                <CheckSquare className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Square className="w-3.5 h-3.5 text-slate-400" />
              )}
              <span>
                {isAllFilteredSelected
                  ? 'Đang chọn tất cả'
                  : `Chọn tất cả (${totalFilteredCoursesCount} môn)`}
              </span>
            </button>
          )}

          {/* Filter by Position */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span className="text-xs text-slate-500 font-medium hidden sm:inline">Chức vụ:</span>
            <select
              value={selectedPosition}
              onChange={(e) => onPositionChange(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="ALL">Tất cả chức vụ</option>
              {availablePositions.map((pos) => (
                <option key={pos} value={pos}>
                  {pos}
                </option>
              ))}
            </select>
          </div>

          {/* Filter by Status */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
            <span className="text-xs text-slate-500 font-medium hidden sm:inline">Trạng thái:</span>
            <select
              value={selectedStatus}
              onChange={(e) => onStatusChange(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="ALL">Tất cả</option>
              <option value="Đang dạy">🟢 Đang dạy</option>
              <option value="Đã hoàn thành">✅ Đã hoàn thành</option>
            </select>
          </div>

          {/* Add Teacher Button */}
          <button
            onClick={onOpenAddTeacher}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            title="Thêm giảng viên mới vào học kỳ này"
          >
            <Plus className="w-4 h-4" />
            <span>+ Thêm GV Vào Kỳ</span>
          </button>
        </div>
      </div>

      {/* Row 2: Progress % Range Filter & Remaining Weeks Filter (Chuẩn bị kế hoạch tuần kế tiếp) */}
      <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* 1. Filter by Progress % Range */}
          <div
            className={`flex flex-wrap items-center gap-1.5 rounded-lg px-2.5 py-1.5 border transition-colors ${
              hasProgressFilter
                ? 'bg-blue-50/90 border-blue-300 text-blue-950 shadow-2xs'
                : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}
          >
            <Percent className={`w-3.5 h-3.5 shrink-0 ${hasProgressFilter ? 'text-blue-600' : 'text-slate-500'}`} />
            <span className="text-xs font-bold whitespace-nowrap">Tiến độ đã dạy (%):</span>
            <div className="flex items-center gap-1">
              <input
                type="number"
                min={0}
                max={100}
                placeholder="Từ %"
                value={minProgressPercent}
                onChange={(e) => onMinProgressChange(e.target.value)}
                className="w-14 px-1.5 py-0.5 text-xs font-bold text-center bg-white border border-slate-300 rounded focus:outline-none focus:border-blue-500 text-slate-800"
                title="Phần trăm số tiết đã dạy tối thiểu (Ví dụ: 80)"
              />
              <span className="text-xs text-slate-400 font-bold">–</span>
              <input
                type="number"
                min={0}
                max={100}
                placeholder="Đến %"
                value={maxProgressPercent}
                onChange={(e) => onMaxProgressChange(e.target.value)}
                className="w-14 px-1.5 py-0.5 text-xs font-bold text-center bg-white border border-slate-300 rounded focus:outline-none focus:border-blue-500 text-slate-800"
                title="Phần trăm số tiết đã dạy tối đa (Ví dụ: 100)"
              />
            </div>

            {/* Quick % Range Presets */}
            <div className="flex items-center gap-1 ml-1">
              {[
                { label: '80-100%', min: '80', max: '100', title: 'Từ 80% đến 100%' },
                { label: '80-99%', min: '80', max: '99', title: 'Sắp xong (80% - 99%, chưa kết thúc)' },
                { label: '50-80%', min: '50', max: '80', title: 'Từ 50% đến 80%' },
                { label: '<50%', min: '0', max: '49', title: 'Dưới 50%' },
              ].map((preset) => {
                const isActive =
                  minProgressPercent === preset.min && maxProgressPercent === preset.max;
                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() =>
                      isActive ? applyProgressPreset('', '') : applyProgressPreset(preset.min, preset.max)
                    }
                    className={`px-1.5 py-0.5 rounded text-[11px] font-bold transition-colors cursor-pointer border ${
                      isActive
                        ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200'
                    }`}
                    title={preset.title}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>

            {hasProgressFilter && (
              <button
                type="button"
                onClick={() => applyProgressPreset('', '')}
                className="p-0.5 text-blue-600 hover:text-blue-900 hover:bg-blue-100 rounded cursor-pointer"
                title="Xóa lọc % tiến độ"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* 2. Filter by Remaining Weeks Until Completion */}
          <div
            className={`flex flex-wrap items-center gap-1.5 rounded-lg px-2.5 py-1.5 border transition-colors ${
              hasRemainingWeeksFilter
                ? 'bg-amber-50 border-amber-300 text-amber-950 shadow-2xs'
                : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}
          >
            <CalendarClock
              className={`w-3.5 h-3.5 shrink-0 ${
                hasRemainingWeeksFilter ? 'text-amber-600' : 'text-slate-500'
              }`}
            />
            <span className="text-xs font-bold whitespace-nowrap">Sắp kết thúc còn:</span>

            {/* Mode selector: Đúng X tuần vs <= X tuần */}
            <select
              value={remainingWeeksMode}
              onChange={(e) => onRemainingWeeksModeChange(e.target.value as 'exact' | 'lte')}
              className="bg-white border border-slate-300 rounded px-1.5 py-0.5 text-[11px] font-bold text-slate-700 focus:outline-none focus:border-amber-500 cursor-pointer"
              title="Chọn chế độ lọc: Đúng N tuần còn lại hoặc Tối đa N tuần còn lại"
            >
              <option value="exact">Đúng</option>
              <option value="lte">≤ Tối đa</option>
            </select>

            <div className="flex items-center gap-1">
              <input
                type="number"
                min={1}
                max={30}
                placeholder="Số tuần"
                value={remainingWeeksFilter}
                onChange={(e) => onRemainingWeeksChange(e.target.value)}
                className="w-16 px-1.5 py-0.5 text-xs font-bold text-center bg-white border border-slate-300 rounded focus:outline-none focus:border-amber-500 text-slate-800"
                title="Nhập số tuần giảng dạy còn lại là kết thúc (Ví dụ: 1, 2, 3...)"
              />
              <span className="text-xs font-semibold text-slate-600">tuần</span>
            </div>

            {/* Quick 1, 2, 3, 4 weeks buttons */}
            <div className="flex items-center gap-1 ml-0.5">
              {['1', '2', '3', '4'].map((w) => {
                const isActive = remainingWeeksFilter === w;
                return (
                  <button
                    key={w}
                    type="button"
                    onClick={() => onRemainingWeeksChange(isActive ? '' : w)}
                    className={`px-2 py-0.5 rounded text-[11px] font-bold transition-colors cursor-pointer border ${
                      isActive
                        ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-amber-50 hover:text-amber-800 hover:border-amber-200'
                    }`}
                    title={`Lọc các môn còn ${remainingWeeksMode === 'exact' ? 'đúng' : 'tối đa'} ${w} tuần là kết thúc để chuẩn bị kế hoạch tuần kế tiếp`}
                  >
                    {w} tuần
                  </button>
                );
              })}
            </div>

            {hasRemainingWeeksFilter && (
              <button
                type="button"
                onClick={() => onRemainingWeeksChange('')}
                className="p-0.5 text-amber-700 hover:text-amber-950 hover:bg-amber-200/60 rounded cursor-pointer"
                title="Xóa lọc số tuần còn lại"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Active filter result badge & Reset all button */}
        {hasAnyAdvancedFilter && (
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
              Kết quả lọc: {totalFilteredCoursesCount} môn học
            </span>
            <button
              type="button"
              onClick={() => {
                onSearchChange('');
                onPositionChange('ALL');
                onStatusChange('ALL');
                onMinProgressChange('');
                onMaxProgressChange('');
                onRemainingWeeksChange('');
              }}
              className="px-2.5 py-1 rounded-lg text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 flex items-center gap-1 cursor-pointer transition-colors"
              title="Xóa toàn bộ điều kiện lọc"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Xóa lọc</span>
            </button>
          </div>
        )}
      </div>

      {/* Batch selection floating/inline bar with Auto Calculate & Delete */}
      {hasSelectedCourses && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 sm:p-3 flex flex-wrap items-center justify-between gap-2.5 animate-in fade-in duration-200 shadow-2xs">
          <div className="flex items-center gap-2 text-xs text-emerald-900 font-medium">
            <span className="bg-emerald-600 text-white font-bold px-2.5 py-0.5 rounded-full text-xs shadow-xs">
              {selectedCourseIds.length}
            </span>
            <span>môn học đang được chọn</span>
            <button
              onClick={onClearSelection}
              className="text-emerald-700 hover:text-emerald-950 underline text-xs cursor-pointer ml-1 font-semibold"
            >
              Bỏ chọn
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Batch Auto-Calculate Button */}
            <button
              type="button"
              onClick={() => {
                setConfirmState({
                  isOpen: true,
                  title: `⚡ Tự động tính nhanh ${selectedCourseIds.length} môn đã chọn?`,
                  message: `Hệ thống sẽ đối chiếu Ngày bắt đầu dạy, lịch các thứ trong tuần, danh sách ngày nghỉ lễ và khoảng tạm ngưng để tự động tính chính xác số tiết đã dạy cho ${selectedCourseIds.length} môn học này. Bạn có muốn tiếp tục?`,
                  confirmText: '⚡ Bắt đầu tính nhanh',
                  isDanger: false,
                  onConfirm: () => onBatchAutoCalculate(),
                });
              }}
              className="text-xs font-bold bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white px-3.5 py-1.5 rounded-lg shadow-xs flex items-center gap-1.5 cursor-pointer transition-all border border-emerald-500"
              title="Tự động tính nhanh số tiết đã dạy cho các môn được chọn"
            >
              <Zap className="w-3.5 h-3.5 text-amber-300" />
              <span>⚡ Tự động tính nhanh ({selectedCourseIds.length} môn)</span>
            </button>

            {/* Batch Delete Button */}
            <button
              type="button"
              onClick={() => {
                setConfirmState({
                  isOpen: true,
                  title: `Xóa ${selectedCourseIds.length} môn đã chọn?`,
                  message: `Bạn có chắc chắn muốn xóa ${selectedCourseIds.length} môn học đang được chọn khỏi giảng viên?`,
                  confirmText: 'Xác nhận xóa',
                  isDanger: true,
                  onConfirm: () => onBatchDeleteCourses(),
                });
              }}
              className="text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white px-3 py-1.5 rounded-lg shadow-xs flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Xóa ({selectedCourseIds.length}) môn</span>
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmState.isOpen}
        onClose={() => setConfirmState((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmState.onConfirm}
        title={confirmState.title}
        message={confirmState.message}
        confirmText={confirmState.confirmText || 'Xác nhận'}
        isDanger={confirmState.isDanger}
      />
    </div>
  );
};
