import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  Edit2,
  Eraser,
  Plus,
  RotateCcw,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import { Semester } from '../types';
import { formatVietnamDate, parseDateString } from '../utils/vietnamTime';
import { ConfirmModal } from './ConfirmModal';

interface SemesterModalProps {
  isOpen: boolean;
  onClose: () => void;
  semesters: Semester[];
  activeSemesterId: string;
  onSelectSemester: (id: string) => void;
  onCreateSemester: (
    name: string,
    academicYear: string,
    startDate: string,
    endDate: string,
    startWeekNumber: number,
    inheritanceMode: 'full' | 'teachers_only' | 'empty',
    sourceSemesterId?: string,
    resetCourseStatus?: boolean
  ) => void;
  onUpdateSemesterInfo: (
    semesterId: string,
    updates: {
      name: string;
      academicYear: string;
      startDate: string;
      endDate: string;
      startWeekNumber: number;
    }
  ) => void;
  onDeleteSemester: (semesterId: string) => void;
  onClearSemesterAssignments: (semesterId: string) => void;
}

export const SemesterModal: React.FC<SemesterModalProps> = ({
  isOpen,
  onClose,
  semesters,
  activeSemesterId,
  onSelectSemester,
  onCreateSemester,
  onUpdateSemesterInfo,
  onDeleteSemester,
  onClearSemesterAssignments,
}) => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingSemester, setEditingSemester] = useState<Semester | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [academicYear, setAcademicYear] = useState('2026-2027');
  const [startDate, setStartDate] = useState('2026-09-07');
  const [endDate, setEndDate] = useState('2027-01-24');
  const [startWeekNumber, setStartWeekNumber] = useState<number>(1);

  // Inheritance mode for creation
  const [inheritanceMode, setInheritanceMode] = useState<'full' | 'teachers_only' | 'empty'>('empty');
  const [sourceSemId, setSourceSemId] = useState(activeSemesterId);
  const [resetStatusToNotStarted, setResetStatusToNotStarted] = useState(true);

  // Confirm delete modal state
  const [confirmState, setConfirmState] = useState<{
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

  const handleStartCreate = () => {
    setEditingSemester(null);
    setShowCreateForm(true);
    const nextNum = semesters.length + 1;
    setName(`Học kỳ ${nextNum % 2 === 0 ? 2 : 1} (2026 - 2027)`);
    setAcademicYear('2026-2027');
    setStartDate('2026-09-07');
    setEndDate('2027-01-24');
    setStartWeekNumber(1);
    setInheritanceMode('empty');
    setSourceSemId(activeSemesterId);
  };

  const handleStartEdit = (sem: Semester) => {
    setEditingSemester(sem);
    setShowCreateForm(true);
    setName(sem.name);
    setAcademicYear(sem.academicYear || '2026-2027');
    setStartDate(sem.startDate || '2026-09-07');
    setEndDate(sem.endDate || '2027-01-24');
    setStartWeekNumber(sem.startWeekNumber || 1);
  };

  const handleCancelForm = () => {
    setShowCreateForm(false);
    setEditingSemester(null);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingSemester) {
      onUpdateSemesterInfo(editingSemester.id, {
        name: name.trim(),
        academicYear: academicYear.trim(),
        startDate,
        endDate,
        startWeekNumber: Number(startWeekNumber) || 1,
      });
    } else {
      onCreateSemester(
        name.trim(),
        academicYear.trim(),
        startDate,
        endDate,
        Number(startWeekNumber) || 1,
        inheritanceMode,
        sourceSemId,
        resetStatusToNotStarted
      );
    }

    handleCancelForm();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-xs">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Quản Lý Không Gian Học Kỳ (Semesters)</h2>
              <p className="text-xs text-slate-500">
                Tạo space học kỳ mới, cấu hình ngày bắt đầu/kết thúc & số tuần Gantt Chart
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
          {!showCreateForm ? (
            <>
              {/* Button to open creation form */}
              <button
                onClick={handleStartCreate}
                className="w-full py-3 px-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded-xl border border-dashed border-emerald-300 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4 text-emerald-600" />
                <span>+ Tạo Space Học Kỳ Mới (Học kỳ 1, Học kỳ 2, Học kỳ Hè...)</span>
              </button>

              {/* List of Semesters */}
              <div className="space-y-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block">
                  Danh sách space học kỳ hiện có ({semesters.length})
                </span>

                {semesters.map((sem) => {
                  const isActive = sem.id === activeSemesterId;
                  const tCount = sem.teachers?.length || 0;
                  const cCount = (sem.teachers || []).reduce(
                    (s, t) => s + (t.courses?.length || 0),
                    0
                  );

                  return (
                    <div
                      key={sem.id}
                      className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        isActive
                          ? 'bg-emerald-50/70 border-emerald-300 ring-1 ring-emerald-400/40 shadow-xs'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm">{sem.name}</span>
                          {isActive && (
                            <span className="px-2 py-0.5 bg-emerald-600 text-white text-[10px] font-bold rounded-full">
                              Đang mở
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-2.5 text-slate-500 text-[11px]">
                          <span>Năm học: <strong className="text-slate-700">{sem.academicYear || '2026-2027'}</strong></span>
                          <span>·</span>
                          <span className="text-slate-700 font-medium">{tCount} giảng viên</span>
                          <span>·</span>
                          <span className="text-slate-700 font-medium">{cCount} môn/lớp</span>
                        </div>

                        <div className="text-[11px] text-emerald-800 bg-emerald-100/60 px-2 py-0.5 rounded-md inline-flex items-center gap-1 font-medium">
                          <Clock className="w-3 h-3 text-emerald-600" />
                          <span>
                            Thời gian: {formatVietnamDate(sem.startDate || '2026-09-07')} → {formatVietnamDate(sem.endDate || '2027-01-24')} (Tuần bắt đầu: #{sem.startWeekNumber || 1})
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* Edit semester info */}
                        <button
                          onClick={() => handleStartEdit(sem)}
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                          title="Sửa tên, ngày bắt đầu/kết thúc & số tuần"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-slate-600" />
                          <span>Sửa lịch</span>
                        </button>

                        {!isActive ? (
                          <button
                            onClick={() => {
                              onSelectSemester(sem.id);
                              onClose();
                            }}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold transition-all shadow-xs cursor-pointer"
                          >
                            Chuyển sang kỳ này
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setConfirmState({
                                isOpen: true,
                                title: `Làm sạch phân công "${sem.name}"?`,
                                message: `Bạn có chắc muốn xóa tất cả phân công môn học trong học kỳ này? Danh sách giảng viên vẫn được giữ nguyên.`,
                                onConfirm: () => onClearSemesterAssignments(sem.id),
                              });
                            }}
                            className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg cursor-pointer transition-colors"
                            title="Làm sạch phân công môn trong kỳ này"
                          >
                            <Eraser className="w-4 h-4" />
                          </button>
                        )}

                        {semesters.length > 1 && (
                          <button
                            onClick={() => {
                              setConfirmState({
                                isOpen: true,
                                title: `Xóa Học Kỳ "${sem.name}"?`,
                                message: `Bạn có chắc chắn muốn xóa toàn bộ học kỳ này cùng tất cả dữ liệu bên trong?`,
                                onConfirm: () => onDeleteSemester(sem.id),
                              });
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
                            title="Xóa học kỳ này"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            /* Creation / Edit Form */
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="bg-emerald-50/70 p-3.5 rounded-xl border border-emerald-200">
                <h3 className="font-bold text-emerald-950 text-sm flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>{editingSemester ? 'Chỉnh Sửa Thông Tin & Lịch Học Kỳ' : 'Cấu Hình Học Kỳ Mới'}</span>
                </h3>
                <p className="text-emerald-800 text-[11px] mt-0.5">
                  Thiết lập thời gian bắt đầu (Thứ 2), kết thúc và số tuần hiển thị trên Gantt Chart.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Tên Học Kỳ *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Học kỳ 1 (2026 - 2027)"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full py-2 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Niên Khóa / Năm Học
                  </label>
                  <input
                    type="text"
                    placeholder="Ví dụ: 2026-2027"
                    value={academicYear}
                    onChange={(e) => setAcademicYear(e.target.value)}
                    className="w-full py-2 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900"
                  />
                </div>
              </div>

              {/* Start Date, End Date & Start Week Number */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3">
                <span className="font-bold text-slate-800 block text-xs">
                  Thiết Lập Mốc Thời Gian Học Kỳ & Tuần Gantt Chart:
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Ngày bắt đầu HK (Thứ 2) *
                    </label>
                    <input
                      type="date"
                      required
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full py-1.5 px-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Ngày kết thúc HK (Chủ Nhật) *
                    </label>
                    <input
                      type="date"
                      required
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full py-1.5 px-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Số bắt đầu của tuần *
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      required
                      value={startWeekNumber}
                      onChange={(e) => setStartWeekNumber(Number(e.target.value) || 1)}
                      className="w-full py-1.5 px-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      title="Ví dụ: Tuần 1, hoặc Tuần 20 theo quy ước đào tạo"
                    />
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      (Ví dụ: Tuần 1, Tuần 20...)
                    </span>
                  </div>
                </div>
              </div>

              {!editingSemester && (
                <div className="space-y-3 pt-2 border-t border-slate-200">
                  <label className="block font-semibold text-slate-700">
                    Chế độ kế thừa dữ liệu:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setInheritanceMode('empty')}
                      className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                        inheritanceMode === 'empty'
                          ? 'bg-emerald-50 border-emerald-500 ring-1 ring-emerald-500 font-bold text-emerald-950'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="text-xs">Trống hoàn toàn</div>
                      <div className="text-[10px] text-slate-500 mt-1">
                        Học kỳ mới tinh chưa có GV và môn học nào
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setInheritanceMode('teachers_only')}
                      className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                        inheritanceMode === 'teachers_only'
                          ? 'bg-emerald-50 border-emerald-500 ring-1 ring-emerald-500 font-bold text-emerald-950'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="text-xs">Kế thừa Giảng viên</div>
                      <div className="text-[10px] text-slate-500 mt-1">
                        Sao chép danh sách GV nhưng môn học để trống
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setInheritanceMode('full')}
                      className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                        inheritanceMode === 'full'
                          ? 'bg-emerald-50 border-emerald-500 ring-1 ring-emerald-500 font-bold text-emerald-950'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="text-xs">Kế thừa Toàn bộ</div>
                      <div className="text-[10px] text-slate-500 mt-1">
                        Sao chép cả GV và các môn đã phân công
                      </div>
                    </button>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleCancelForm}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg font-medium transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold transition-colors cursor-pointer shadow-xs"
                >
                  {editingSemester ? 'Lưu Thay Đổi' : 'Tạo Học Kỳ'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        {!showCreateForm && (
          <div className="flex justify-end pt-3 border-t border-slate-100 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-xs cursor-pointer transition-colors"
            >
              Đóng
            </button>
          </div>
        )}
      </div>

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmState.isOpen}
        onClose={() => setConfirmState((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmState.onConfirm}
        title={confirmState.title}
        message={confirmState.message}
        isDanger={true}
      />
    </div>
  );
};
