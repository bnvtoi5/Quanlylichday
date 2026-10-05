import React, { useState } from 'react';
import {
  CheckSquare,
  Filter,
  Plus,
  Search,
  Sparkles,
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

  return (
    <div className="bg-white rounded-xl p-3 border border-slate-200/80 shadow-xs mb-4 space-y-3">
      {/* Primary search & filters row */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Search input */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo tên Giảng viên, Môn học, Lớp (CSDL, CNTT26TH1, Nguyễn Văn A)..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-800 placeholder-slate-400"
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
