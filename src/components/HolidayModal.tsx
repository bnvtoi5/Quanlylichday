import React, { useState } from 'react';
import {
  Calendar,
  Check,
  Edit2,
  Plus,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import { Holiday, SessionPeriod } from '../types';
import { formatVietnamDate, parseDateString } from '../utils/vietnamTime';
import { ConfirmModal } from './ConfirmModal';

interface HolidayModalProps {
  isOpen: boolean;
  onClose: () => void;
  holidays: Holiday[];
  onAddHoliday: (holiday: Omit<Holiday, 'id'>) => void;
  onUpdateHoliday: (holiday: Holiday) => void;
  onDeleteHoliday: (id: string) => void;
  onBatchDeleteHolidays: (ids: string[]) => void;
  onResetDefaultHolidays: () => void;
}

export const HolidayModal: React.FC<HolidayModalProps> = ({
  isOpen,
  onClose,
  holidays,
  onAddHoliday,
  onUpdateHoliday,
  onDeleteHoliday,
  onBatchDeleteHolidays,
  onResetDefaultHolidays,
}) => {
  // Add / Edit form states
  const [editingHoliday, setEditingHoliday] = useState<Holiday | null>(null);
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [session, setSession] = useState<SessionPeriod>('ALL');

  // Multi-select for batch delete
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Confirmation modals
  const [confirmDelete, setConfirmDelete] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  if (!isOpen) return null;

  const handleStartEdit = (h: Holiday) => {
    setEditingHoliday(h);
    setName(h.name);
    setDate(h.date);
    setSession(h.session);
  };

  const handleCancelEdit = () => {
    setEditingHoliday(null);
    setName('');
    setDate('');
    setSession('ALL');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !date) return;

    if (editingHoliday) {
      onUpdateHoliday({
        id: editingHoliday.id,
        name: name.trim(),
        date,
        session,
      });
      handleCancelEdit();
    } else {
      onAddHoliday({
        name: name.trim(),
        date,
        session,
      });
      setName('');
      setDate('');
      setSession('ALL');
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAll = () => {
    if (selectedIds.length === holidays.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(holidays.map((h) => h.id));
    }
  };

  const promptBatchDelete = () => {
    if (selectedIds.length === 0) return;
    setConfirmDelete({
      isOpen: true,
      title: `Xóa ${selectedIds.length} ngày nghỉ đã chọn?`,
      message: `Bạn có chắc muốn xóa ${selectedIds.length} ngày nghỉ lễ này khỏi hệ thống?`,
      onConfirm: () => {
        onBatchDeleteHolidays(selectedIds);
        setSelectedIds([]);
      },
    });
  };

  // Sort holidays by date
  const sortedHolidays = [...holidays].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shadow-xs">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Thiết Lập Ngày Nghỉ Lễ (Trừ Tự Động Khi Tính Tiết)
              </h2>
              <p className="text-xs text-slate-500">
                Cấu hình các ngày nghỉ lễ, nghỉ khoa; phân biệt nghỉ Cả ngày, Sáng (S) hoặc Chiều (C)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4 text-xs">
          {/* Helper note */}
          <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3 text-amber-900 flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong>Hao trừ thông minh:</strong> Khi tính tiến độ, hệ thống sẽ tự động trừ các buổi dạy rơi vào ngày nghỉ này. Nếu ngày đó chỉ nghỉ <strong>Sáng (S)</strong>, lịch dạy buổi Chiều vẫn được tính bình thường.
            </div>
          </div>

          {/* Form to add or edit holiday */}
          <form
            onSubmit={handleSubmit}
            className={`border rounded-xl p-4 space-y-3 transition-colors ${
              editingHoliday
                ? 'bg-amber-50/60 border-amber-300 ring-2 ring-amber-400/20'
                : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center justify-between">
              <span>{editingHoliday ? '✏️ Chỉnh Sửa Ngày Nghỉ' : '+ Thêm Ngày Nghỉ Mới'}</span>
              {!editingHoliday && (
                <button
                  type="button"
                  onClick={onResetDefaultHolidays}
                  className="text-[11px] text-amber-700 hover:text-amber-800 font-semibold underline cursor-pointer"
                  title="Khôi phục danh sách các ngày lễ lớn tại Việt Nam"
                >
                  Nạp ngày lễ mẫu VN
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Holiday Name */}
              <div className="sm:col-span-1">
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Tên ngày nghỉ / dịp lễ *
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: 30/4, Họp khoa..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-slate-800 font-bold"
                />
              </div>

              {/* Date */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Ngày nghỉ (Dương lịch) *
                </label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-slate-800 font-bold"
                />
              </div>

              {/* Session: ALL / S / C */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Buổi được nghỉ *
                </label>
                <div className="grid grid-cols-3 gap-1">
                  <button
                    type="button"
                    onClick={() => setSession('ALL')}
                    className={`py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                      session === 'ALL'
                        ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    Cả ngày
                  </button>
                  <button
                    type="button"
                    onClick={() => setSession('S')}
                    className={`py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                      session === 'S'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                    title="Chỉ nghỉ buổi Sáng (S)"
                  >
                    Sáng (S)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSession('C')}
                    className={`py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                      session === 'C'
                        ? 'bg-orange-600 text-white border-orange-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                    title="Chỉ nghỉ buổi Chiều (C)"
                  >
                    Chiều (C)
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              {editingHoliday && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-200 rounded-lg text-xs font-medium cursor-pointer"
                >
                  Hủy sửa
                </button>
              )}
              <button
                type="submit"
                className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
              >
                {editingHoliday ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Lưu Cập Nhật</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5" />
                    <span>Thêm vào danh sách</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Holiday List Header & Batch Actions */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-600 font-semibold uppercase tracking-wider px-1">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={holidays.length > 0 && selectedIds.length === holidays.length}
                  onChange={handleToggleSelectAll}
                  className="rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                  title="Chọn tất cả ngày nghỉ"
                />
                <span>Danh sách ngày nghỉ đã thiết lập ({sortedHolidays.length})</span>
              </div>

              {selectedIds.length > 0 && (
                <button
                  type="button"
                  onClick={promptBatchDelete}
                  className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-md text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Xóa ({selectedIds.length}) ngày đã chọn</span>
                </button>
              )}
            </div>

            {sortedHolidays.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-xl text-slate-400 text-xs">
                Chưa có ngày nghỉ lễ nào. Bạn có thể bấm "Nạp ngày lễ mẫu VN" ở trên hoặc thêm thủ công.
              </div>
            ) : (
              <div className="divide-y divide-slate-200 border border-slate-200 rounded-xl overflow-hidden bg-white">
                {sortedHolidays.map((h) => {
                  const dObj = parseDateString(h.date);
                  const dayOfWeekName = dObj.toLocaleDateString('vi-VN', { weekday: 'long' });
                  const isChecked = selectedIds.includes(h.id);

                  return (
                    <div
                      key={h.id}
                      className={`p-3 hover:bg-slate-50 flex items-center justify-between gap-3 text-xs transition-colors ${
                        isChecked ? 'bg-amber-50/50' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleSelect(h.id)}
                          className="rounded text-amber-600 focus:ring-amber-500 cursor-pointer shrink-0"
                        />

                        {/* Date badge: Day big on top, Month below (Fixed as requested!) */}
                        <div className="w-14 text-center bg-amber-50 border border-amber-200 py-1 px-1 rounded-lg shrink-0 shadow-2xs">
                          <div className="text-base font-extrabold text-amber-900 leading-none">
                            {dObj.getDate()}
                          </div>
                          <div className="text-[10px] text-amber-700 font-bold uppercase mt-0.5">
                            Tháng {dObj.getMonth() + 1}
                          </div>
                        </div>

                        <div className="min-w-0">
                          <div className="font-bold text-slate-900 flex items-center gap-2 truncate">
                            <span className="truncate">{h.name}</span>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                                h.session === 'ALL'
                                  ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                  : h.session === 'S'
                                  ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                  : 'bg-orange-100 text-orange-800 border border-orange-200'
                              }`}
                            >
                              {h.session === 'ALL'
                                ? 'Nghỉ Cả ngày'
                                : h.session === 'S'
                                ? 'Nghỉ Buổi Sáng'
                                : 'Nghỉ Buổi Chiều'}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            {dayOfWeekName} · Ngày {formatVietnamDate(h.date)}
                          </div>
                        </div>
                      </div>

                      {/* Actions: Edit and Delete */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleStartEdit(h)}
                          className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg cursor-pointer transition-colors"
                          title="Chỉnh sửa ngày nghỉ này"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setConfirmDelete({
                              isOpen: true,
                              title: `Xóa Ngày Nghỉ "${h.name}"?`,
                              message: `Bạn có chắc muốn xóa ngày nghỉ "${h.name}" (${formatVietnamDate(h.date)})?`,
                              onConfirm: () => onDeleteHoliday(h.id),
                            })
                          }
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
                          title="Xóa ngày nghỉ này"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-3 border-t border-slate-100 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-xs cursor-pointer transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>

      {/* Confirm modal */}
      <ConfirmModal
        isOpen={confirmDelete.isOpen}
        onClose={() => setConfirmDelete((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmDelete.onConfirm}
        title={confirmDelete.title}
        message={confirmDelete.message}
        confirmText="Xác nhận xóa"
        isDanger={true}
      />
    </div>
  );
};
