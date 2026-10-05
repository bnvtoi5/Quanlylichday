import React, { useEffect, useRef, useState } from 'react';
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Copy,
  Edit2,
  Pencil,
  Plus,
  RotateCcw,
  Star,
  Trash2,
  Zap
} from 'lucide-react';
import { AppUiSettings, CourseAssignment, CustomColumn, Holiday, Teacher, TeachingStatus } from '../types';
import { calculateTeachingProgress } from '../utils/vietnamTime';
import { ConfirmModal } from './ConfirmModal';

interface TeacherTableProps {
  teachers: Teacher[];
  customColumns: CustomColumn[];
  holidays?: Holiday[];
  selectedCourseIds: string[];
  isAllFilteredSelected?: boolean;
  uiSettings?: AppUiSettings;
  onUpdateUiSettings?: (settings: Partial<AppUiSettings>) => void;
  onToggleSelectAllFiltered?: () => void;
  onToggleSelectCourse: (courseId: string) => void;
  onToggleSelectTeacher: (teacherId: string) => void;
  onUpdateCourseStatus: (teacherId: string, courseId: string, newStatus: TeachingStatus) => void;
  onUpdateCourseHours: (teacherId: string, courseId: string, completedHours: number) => void;
  onUpdateCustomValue: (teacherId: string, courseId: string, columnId: string, val: any) => void;
  onOpenQuickAddCourse: (teacher: Teacher) => void;
  onEditTeacher: (teacher: Teacher) => void;
  onDeleteTeacher: (teacherId: string) => void;
  onMoveTeacher?: (teacherId: string, direction: 'up' | 'down') => void;
  onEditCourse: (teacher: Teacher, course: CourseAssignment) => void;
  onDuplicateCourse: (teacherId: string, course: CourseAssignment) => void;
  onDeleteCourse: (teacherId: string, courseId: string) => void;
  onOpenAddTeacher?: () => void;
  onAutoCalculateAll?: () => void;
}

// Default column widths in pixels
const DEFAULT_COLUMN_WIDTHS: Record<string, number> = {
  stt: 55,
  teacher: 200,
  subject: 220,
  class: 110,
  theory: 65,
  practice: 65,
  total: 75,
  progress: 230,
  status: 150,
  actions: 105,
};

export const TeacherTable: React.FC<TeacherTableProps> = ({
  teachers,
  customColumns,
  holidays = [],
  selectedCourseIds,
  isAllFilteredSelected = false,
  uiSettings,
  onUpdateUiSettings,
  onToggleSelectAllFiltered,
  onToggleSelectCourse,
  onToggleSelectTeacher,
  onUpdateCourseHours,
  onUpdateCustomValue,
  onUpdateCourseStatus,
  onOpenQuickAddCourse,
  onEditTeacher,
  onDeleteTeacher,
  onMoveTeacher,
  onEditCourse,
  onDuplicateCourse,
  onDeleteCourse,
  onOpenAddTeacher,
  onAutoCalculateAll,
}) => {
  // Column resizing state (saved to Cloud & localStorage)
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() => {
    if (uiSettings?.tableColumnWidths) {
      return { ...DEFAULT_COLUMN_WIDTHS, ...uiSettings.tableColumnWidths };
    }
    try {
      const saved = localStorage.getItem('edutrack_table_col_widths_v3');
      return saved ? JSON.parse(saved) : DEFAULT_COLUMN_WIDTHS;
    } catch {
      return DEFAULT_COLUMN_WIDTHS;
    }
  });

  useEffect(() => {
    if (uiSettings?.tableColumnWidths) {
      setColumnWidths((prev) => {
        const isSame = Object.keys(uiSettings.tableColumnWidths!).every(
          (k) => uiSettings.tableColumnWidths![k] === prev[k]
        );
        return isSame ? prev : { ...prev, ...uiSettings.tableColumnWidths };
      });
    }
  }, [uiSettings?.tableColumnWidths]);

  const syncTableWidthsDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const notifyTableWidthsChange = (widths: Record<string, number>) => {
    if (syncTableWidthsDebounce.current) {
      clearTimeout(syncTableWidthsDebounce.current);
    }
    syncTableWidthsDebounce.current = setTimeout(() => {
      onUpdateUiSettings?.({ tableColumnWidths: widths });
    }, 500);
  };

  const handleResetWidths = () => {
    setColumnWidths(DEFAULT_COLUMN_WIDTHS);
    try {
      localStorage.removeItem('edutrack_table_col_widths_v3');
    } catch {}
    notifyTableWidthsChange(DEFAULT_COLUMN_WIDTHS);
  };

  // Mouse Drag Column Resizing
  const startResizeCol = (e: React.MouseEvent, colKey: string) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startWidth = columnWidths[colKey] || DEFAULT_COLUMN_WIDTHS[colKey] || 120;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const diff = moveEvent.clientX - startX;
      const newWidth = Math.max(50, startWidth + diff);
      setColumnWidths((prev) => ({
        ...prev,
        [colKey]: newWidth,
      }));
    };

    const handleMouseUp = () => {
      setColumnWidths((latest) => {
        try {
          localStorage.setItem('edutrack_table_col_widths_v3', JSON.stringify(latest));
        } catch {}
        notifyTableWidthsChange(latest);
        return latest;
      });
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';
    };

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // In-app Confirm Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    isDanger?: boolean;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Xác nhận',
    isDanger: false,
    onConfirm: () => {},
  });

  // Direct manual hours editing state
  const [editingHoursCourseId, setEditingHoursCourseId] = useState<string | null>(null);
  const [tempHoursInput, setTempHoursInput] = useState<number>(0);

  if (teachers.length === 0) {
    return (
      <div className="bg-white rounded-xl p-12 text-center border border-slate-200 space-y-4">
        <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
          <Plus className="w-8 h-8" />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-800">Chưa có giảng viên trong học kỳ này</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Học kỳ hiện đang trống. Bấm nút bên dưới để thêm giảng viên và các môn học.
          </p>
        </div>
        {onOpenAddTeacher && (
          <button
            onClick={onOpenAddTeacher}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs inline-flex items-center gap-2 shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Thêm GV Vào Kỳ Này</span>
          </button>
        )}
      </div>
    );
  }

  // Calculate table grand totals
  let grandTotalLT = 0;
  let grandTotalTH = 0;
  let grandTotalHours = 0;
  let grandCompletedHours = 0;
  let grandCompletedCourses = 0;
  let grandTotalCourses = 0;

  teachers.forEach((t) => {
    (t.courses || []).forEach((c) => {
      grandTotalCourses++;
      const lt = c.theoryHours || 0;
      const th = c.practiceHours || 0;
      const tot = lt + th;
      grandTotalLT += lt;
      grandTotalTH += th;
      grandTotalHours += tot;
      const done = c.completedHours || 0;
      grandCompletedHours += done;
      if (done >= tot && tot > 0) grandCompletedCourses++;
    });
  });

  grandTotalLT = Math.round(grandTotalLT * 100) / 100;
  grandTotalTH = Math.round(grandTotalTH * 100) / 100;
  grandTotalHours = Math.round(grandTotalHours * 100) / 100;
  grandCompletedHours = Math.round(grandCompletedHours * 100) / 100;

  // Action: Smart Auto-Sync teaching hours from real calendar
  const handleTriggerAutoSyncCalendar = (
    teacher: Teacher,
    course: CourseAssignment
  ) => {
    const total = (course.theoryHours || 0) + (course.practiceHours || 0);
    const progress = calculateTeachingProgress(
      course.startDate,
      course.scheduleSlots || [],
      course.hoursPerSession || 4,
      total,
      holidays,
      course.pauseIntervals || [],
      course.schedulePhases || []
    );

    setConfirmModal({
      isOpen: true,
      title: 'Tự Động Tính Tiết Dạy Theo Lịch Dương VN',
      message: `${progress.explanation}\n\nBạn có muốn tự động cập nhật số tiết đã dạy của môn "${course.subjectName}" (Lớp ${course.className}) thành ${progress.calculatedHours}/${total} tiết?`,
      confirmText: 'Đồng ý cập nhật',
      isDanger: false,
      onConfirm: () => {
        onUpdateCourseHours(teacher.id, course.id, progress.calculatedHours);
      },
    });
  };

  // Action: Add 4 hours (+1 session)
  const handleAddSessionHours = (
    teacher: Teacher,
    course: CourseAssignment
  ) => {
    const total = (course.theoryHours || 0) + (course.practiceHours || 0);
    const current = course.completedHours || 0;
    const sessionH = course.hoursPerSession || 4;
    const target = Math.min(total, current + sessionH);

    setConfirmModal({
      isOpen: true,
      title: `Cộng ${sessionH} Tiết (1 Buổi Dạy Bù / Thêm)?`,
      message: `Xác nhận cộng ${sessionH} tiết cho môn "${course.subjectName}" (Lớp ${course.className}) của giảng viên ${teacher.name}? Số tiết sẽ tăng từ ${current}h lên ${target}h.`,
      confirmText: `Cộng +${sessionH}h`,
      isDanger: false,
      onConfirm: () => {
        onUpdateCourseHours(teacher.id, course.id, target);
      },
    });
  };

  // Action: Subtract 4 hours (-1 session)
  const handleSubtractSessionHours = (
    teacher: Teacher,
    course: CourseAssignment
  ) => {
    const current = course.completedHours || 0;
    const sessionH = course.hoursPerSession || 4;
    const target = Math.max(0, current - sessionH);

    setConfirmModal({
      isOpen: true,
      title: `Trừ ${sessionH} Tiết (Nghỉ Phép / Nghỉ Lễ)?`,
      message: `Xác nhận trừ ${sessionH} tiết cho môn "${course.subjectName}" (Lớp ${course.className}) của giảng viên ${teacher.name}? Số tiết sẽ giảm từ ${current}h xuống ${target}h.`,
      confirmText: `Trừ -${sessionH}h`,
      isDanger: true,
      onConfirm: () => {
        onUpdateCourseHours(teacher.id, course.id, target);
      },
    });
  };

  // Action: Custom exact hours prompt
  const handleSaveExactHours = (teacherId: string, courseId: string, total: number) => {
    const val = Math.max(0, Math.min(total, Number(tempHoursInput) || 0));
    onUpdateCourseHours(teacherId, courseId, val);
    setEditingHoursCourseId(null);
  };

  return (
    <div className="space-y-2">
      {/* Table Top Controls: Auto Calculate All & Reset Dimensions Buttons */}
      <div className="flex items-center justify-between px-1 text-xs text-slate-500">
        <span className="text-[11px] text-slate-400">
          (Rê chuột vào mép cột để kéo giãn độ rộng cột như Excel)
        </span>

        <div className="flex items-center gap-2">
          {/* Auto Calculate All Progress Button */}
          {onAutoCalculateAll && (
            <button
              type="button"
              onClick={onAutoCalculateAll}
              className="px-3 py-1 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs border border-amber-600/30"
              title="Tự động tính lại toàn bộ tiến độ các môn học dựa trên lịch dạy và ngày nghỉ"
            >
              <Zap className="w-3.5 h-3.5 fill-slate-950 text-slate-950" />
              <span>Tự tính cho tất cả</span>
            </button>
          )}

          {/* Reset Dimensions Button */}
          <button
            type="button"
            onClick={handleResetWidths}
            className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-600 hover:text-slate-900 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
            title="Đặt lại độ rộng cột về mặc định ban đầu"
          >
            <RotateCcw className="w-3 h-3 text-slate-500" />
            <span>Reset độ rộng mặc định</span>
          </button>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto select-none">
          <table className="w-full text-left border-collapse table-fixed">
            {/* Table Header with Draggable Column Resizers */}
            <thead>
              <tr className="bg-slate-800 text-white text-xs font-semibold uppercase tracking-wider divide-x divide-slate-700/60 select-none">
                {/* STT with Master Checkbox */}
                <th
                  style={{ width: `${columnWidths.stt || DEFAULT_COLUMN_WIDTHS.stt}px` }}
                  className="py-2.5 px-2 text-center relative group select-none"
                >
                  <div className="flex flex-col items-center justify-center gap-0.5">
                    {onToggleSelectAllFiltered && (
                      <input
                        type="checkbox"
                        checked={isAllFilteredSelected}
                        onChange={onToggleSelectAllFiltered}
                        className="rounded text-emerald-500 focus:ring-emerald-400 cursor-pointer w-3.5 h-3.5 bg-slate-700 border-slate-600"
                        title={isAllFilteredSelected ? "Bỏ chọn tất cả các môn" : "Tick chọn tất cả các giảng viên & môn học theo lọc"}
                      />
                    )}
                    <span className="text-[10px] text-slate-300 font-bold uppercase tracking-wider">STT</span>
                  </div>
                  <div
                    onMouseDown={(e) => startResizeCol(e, 'stt')}
                    className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-emerald-400/80 transition-colors z-10"
                    title="Kéo để đổi độ rộng cột"
                  />
                </th>

                {/* Giảng viên & Chức vụ */}
                <th
                  style={{ width: `${columnWidths.teacher || DEFAULT_COLUMN_WIDTHS.teacher}px` }}
                  className="py-3 px-4 relative group"
                >
                  Giảng Viên & Chức Vụ
                  <div
                    onMouseDown={(e) => startResizeCol(e, 'teacher')}
                    className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-emerald-400/80 transition-colors z-10"
                    title="Kéo để đổi độ rộng cột"
                  />
                </th>

                {/* Môn Học (Tên rút gọn as requested) */}
                <th
                  style={{ width: `${columnWidths.subject || DEFAULT_COLUMN_WIDTHS.subject}px` }}
                  className="py-3 px-4 relative group"
                >
                  Môn Học
                  <div
                    onMouseDown={(e) => startResizeCol(e, 'subject')}
                    className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-emerald-400/80 transition-colors z-10"
                    title="Kéo để đổi độ rộng cột"
                  />
                </th>

                {/* Lớp */}
                <th
                  style={{ width: `${columnWidths.class || DEFAULT_COLUMN_WIDTHS.class}px` }}
                  className="py-3 px-3 relative group text-center"
                >
                  Lớp
                  <div
                    onMouseDown={(e) => startResizeCol(e, 'class')}
                    className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-emerald-400/80 transition-colors z-10"
                    title="Kéo để đổi độ rộng cột"
                  />
                </th>

                {/* LT */}
                <th
                  style={{ width: `${columnWidths.theory || DEFAULT_COLUMN_WIDTHS.theory}px` }}
                  className="py-3 px-2 text-center relative group"
                  title="Tiết Lý Thuyết"
                >
                  LT
                  <div
                    onMouseDown={(e) => startResizeCol(e, 'theory')}
                    className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-emerald-400/80 transition-colors z-10"
                    title="Kéo để đổi độ rộng cột"
                  />
                </th>

                {/* TH */}
                <th
                  style={{ width: `${columnWidths.practice || DEFAULT_COLUMN_WIDTHS.practice}px` }}
                  className="py-3 px-2 text-center relative group"
                  title="Tiết Thực Hành"
                >
                  TH
                  <div
                    onMouseDown={(e) => startResizeCol(e, 'practice')}
                    className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-emerald-400/80 transition-colors z-10"
                    title="Kéo để đổi độ rộng cột"
                  />
                </th>

                {/* Tổng Tiết */}
                <th
                  style={{ width: `${columnWidths.total || DEFAULT_COLUMN_WIDTHS.total}px` }}
                  className="py-3 px-2 text-center relative group"
                  title="Tổng số tiết"
                >
                  Tổng
                  <div
                    onMouseDown={(e) => startResizeCol(e, 'total')}
                    className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-emerald-400/80 transition-colors z-10"
                    title="Kéo để đổi độ rộng cột"
                  />
                </th>

                {/* Tiến Độ (Title shortened as requested) */}
                <th
                  style={{ width: `${columnWidths.progress || DEFAULT_COLUMN_WIDTHS.progress}px` }}
                  className="py-3 px-3 relative group"
                >
                  Tiến Độ
                  <div
                    onMouseDown={(e) => startResizeCol(e, 'progress')}
                    className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-emerald-400/80 transition-colors z-10"
                    title="Kéo để đổi độ rộng cột"
                  />
                </th>

                {/* Tình Trạng (Hiển thị theo tiến độ) */}
                <th
                  style={{ width: `${columnWidths.status || DEFAULT_COLUMN_WIDTHS.status}px` }}
                  className="py-3 px-3 text-center relative group"
                >
                  Tình Trạng
                  <div
                    onMouseDown={(e) => startResizeCol(e, 'status')}
                    className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-emerald-400/80 transition-colors z-10"
                    title="Kéo để đổi độ rộng cột"
                  />
                </th>

                {/* Dynamic custom columns */}
                {customColumns.map((col) => {
                  const colKey = `custom_${col.id}`;
                  const w = columnWidths[colKey] || 130;
                  return (
                    <th
                      key={col.id}
                      style={{ width: `${w}px` }}
                      className="py-3 px-3 text-center relative group"
                    >
                      {col.name}
                      <div
                        onMouseDown={(e) => startResizeCol(e, colKey)}
                        className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-emerald-400/80 transition-colors z-10"
                        title="Kéo để đổi độ rộng cột"
                      />
                    </th>
                  );
                })}

                {/* Thao tác */}
                <th
                  style={{ width: `${columnWidths.actions || DEFAULT_COLUMN_WIDTHS.actions}px` }}
                  className="py-3 px-2 text-center"
                >
                  Thao Tác
                </th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-slate-200 text-xs text-slate-700">
              {teachers.map((teacher, tIndex) => {
                const courses = teacher.courses && teacher.courses.length > 0 ? teacher.courses : [];
                const courseCount = courses.length || 1;
                const teacherTotalHours = courses.reduce(
                  (sum, c) => sum + (c.theoryHours || 0) + (c.practiceHours || 0),
                  0
                );
                const teacherDoneHours = courses.reduce(
                  (sum, c) => sum + (c.completedHours || 0),
                  0
                );

                const allTeacherCoursesSelected =
                  courses.length > 0 && courses.every((c) => selectedCourseIds.includes(c.id));

                if (courses.length === 0) {
                  return (
                    <tr
                      key={teacher.id}
                      className="hover:bg-slate-50/70 border-b border-slate-200"
                    >
                      <td className="py-2.5 px-2 text-center font-medium text-slate-500">{tIndex + 1}</td>
                      <td className="py-2.5 px-4">
                        <div className="space-y-1.5 pt-1">
                          <div className="flex items-start justify-between gap-1">
                            <span className="font-bold text-slate-900 text-sm leading-snug">
                              {teacher.name}
                            </span>
                            <div className="flex items-center gap-0.5">
                              {/* Move Up */}
                              <button
                                type="button"
                                disabled={tIndex === 0}
                                onClick={() => onMoveTeacher && onMoveTeacher(teacher.id, 'up')}
                                className="p-1 text-slate-400 hover:text-slate-800 disabled:opacity-20 rounded cursor-pointer disabled:cursor-not-allowed"
                                title="Đẩy GV lên trên"
                              >
                                <ChevronUp className="w-3.5 h-3.5" />
                              </button>
                              {/* Move Down */}
                              <button
                                type="button"
                                disabled={tIndex === teachers.length - 1}
                                onClick={() => onMoveTeacher && onMoveTeacher(teacher.id, 'down')}
                                className="p-1 text-slate-400 hover:text-slate-800 disabled:opacity-20 rounded cursor-pointer disabled:cursor-not-allowed"
                                title="Đẩy GV xuống dưới"
                              >
                                <ChevronDown className="w-3.5 h-3.5" />
                              </button>
                              {/* Nút thêm môn dấu cộng gọn kế nút bút chì và thùng rác */}
                              <button
                                type="button"
                                onClick={() => onOpenQuickAddCourse(teacher)}
                                className="p-1 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded cursor-pointer"
                                title="Thêm môn học cho GV này"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => onEditTeacher(teacher)}
                                className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded cursor-pointer"
                                title="Chỉnh sửa GV"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => onDeleteTeacher(teacher.id)}
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                                title="Xóa GV này"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-0.5 text-[11px] font-semibold rounded ${
                                teacher.position?.includes('Cơ hữu')
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {teacher.position}
                            </span>
                            <span className="font-bold text-slate-800 text-xs">
                              0 tiết
                            </span>
                          </div>
                        </div>
                      </td>
                      <td colSpan={6 + customColumns.length} className="py-2.5 px-4 text-slate-400 italic">
                        Chưa có phân công môn học nào trong học kỳ này.
                      </td>
                      <td className="py-2.5 px-2 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => onOpenQuickAddCourse(teacher)}
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded cursor-pointer"
                            title="Thêm môn cho giảng viên này"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onEditTeacher(teacher)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded cursor-pointer"
                            title="Chỉnh sửa GV"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteTeacher(teacher.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                            title="Xóa GV này"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                }

                return courses.map((course, cIndex) => {
                  const isFirstCourse = cIndex === 0;
                  const totalCourseHours =
                    Math.round(((course.theoryHours || 0) + (course.practiceHours || 0)) * 100) / 100;
                  const currentDone = course.completedHours || 0;
                  const progressPct =
                    totalCourseHours > 0 ? Math.min(100, Math.round((currentDone / totalCourseHours) * 100)) : 0;
                  const isDone = currentDone >= totalCourseHours && totalCourseHours > 0;
                  const isSelected = selectedCourseIds.includes(course.id);

                  return (
                    <tr
                      key={course.id}
                      className={`transition-colors ${
                        isSelected ? 'bg-emerald-50/50' : cIndex % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'
                      } hover:bg-slate-100/70 border-b border-slate-200/80`}
                    >
                      {/* Column 1: STT & Teacher Selection (Merged) */}
                      {isFirstCourse && (
                        <td
                          rowSpan={courseCount}
                          className="py-2.5 px-2 text-center align-top border-r border-slate-200 bg-white"
                        >
                          <div className="flex flex-col items-center gap-1.5 pt-2">
                            <input
                              type="checkbox"
                              checked={allTeacherCoursesSelected}
                              onChange={() => onToggleSelectTeacher(teacher.id)}
                              title="Chọn tất cả môn của giảng viên này"
                              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                            />
                            <span className="font-bold text-slate-700 text-xs">{tIndex + 1}</span>
                          </div>
                        </td>
                      )}

                      {/* Column 2: Teacher Name, Position & Hours ONLY (Simplified as requested) */}
                      {isFirstCourse && (
                        <td
                          rowSpan={courseCount}
                          className="py-2.5 px-4 align-top border-r border-slate-200 bg-white"
                        >
                          <div className="space-y-1.5 pt-1">
                            <div className="flex items-start justify-between gap-1">
                              <span className="font-bold text-slate-900 text-sm leading-snug">
                                {teacher.name}
                              </span>
                              <div className="flex items-center gap-0.5">
                                {/* Move Up */}
                                <button
                                  type="button"
                                  disabled={tIndex === 0}
                                  onClick={() => onMoveTeacher && onMoveTeacher(teacher.id, 'up')}
                                  className="p-1 text-slate-400 hover:text-slate-800 disabled:opacity-20 rounded cursor-pointer disabled:cursor-not-allowed"
                                  title="Đẩy GV lên trên"
                                >
                                  <ChevronUp className="w-3.5 h-3.5" />
                                </button>
                                {/* Move Down */}
                                <button
                                  type="button"
                                  disabled={tIndex === teachers.length - 1}
                                  onClick={() => onMoveTeacher && onMoveTeacher(teacher.id, 'down')}
                                  className="p-1 text-slate-400 hover:text-slate-800 disabled:opacity-20 rounded cursor-pointer disabled:cursor-not-allowed"
                                  title="Đẩy GV xuống dưới"
                                >
                                  <ChevronDown className="w-3.5 h-3.5" />
                                </button>
                                {/* Nút thêm môn dấu cộng gọn kế nút bút chì và thùng rác */}
                                <button
                                  type="button"
                                  onClick={() => onOpenQuickAddCourse(teacher)}
                                  className="p-1 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded cursor-pointer"
                                  title="Thêm môn học cho GV này"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => onEditTeacher(teacher)}
                                  className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded cursor-pointer"
                                  title="Chỉnh sửa GV"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => onDeleteTeacher(teacher.id)}
                                  className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                                  title="Xóa GV này"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {/* Chức vụ & Tổng số tiết (bỏ chữ tổng tải, bỏ chi tiết thừa) */}
                            <div className="flex items-center gap-2">
                              <span
                                className={`px-2 py-0.5 text-[11px] font-semibold rounded ${
                                  teacher.position?.includes('Cơ hữu')
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {teacher.position}
                              </span>
                              <span className="font-bold text-slate-800 text-xs">
                                {teacherTotalHours} tiết
                              </span>
                            </div>
                          </div>
                        </td>
                      )}

                      {/* Column 3: Môn Học (Tên môn học ONLY as requested) */}
                      <td className="py-2.5 px-4 font-semibold text-slate-900">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => onToggleSelectCourse(course.id)}
                            className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                          />
                          <span className="text-slate-800 hover:text-emerald-700 transition-colors flex items-center gap-1.5">
                            <span>{course.subjectName}</span>
                            {course.mergeRemainderHours && (
                              <span
                                className="inline-flex items-center text-amber-500 hover:text-amber-600 transition-transform hover:scale-125 shrink-0"
                                title="⭐ Môn này đã bật cộng dồn số tiết lẻ vào buổi cuối cùng cho biểu đồ Gantt"
                              >
                                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500 drop-shadow-[0_0_4px_rgba(245,158,11,0.7)] animate-pulse" />
                              </span>
                            )}
                          </span>
                        </div>
                      </td>

                      {/* Column 4: Class Name */}
                      <td className="py-2.5 px-3 text-center">
                        <span className="font-mono font-bold text-xs bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200">
                          {course.className}
                        </span>
                      </td>

                      {/* Column 5: LT */}
                      <td className="py-2.5 px-2 text-center font-medium text-slate-600">
                        {course.theoryHours}
                      </td>

                      {/* Column 6: TH */}
                      <td className="py-2.5 px-2 text-center font-medium text-slate-600">
                        {course.practiceHours}
                      </td>

                      {/* Column 7: Total Hours */}
                      <td className="py-2.5 px-2 text-center font-bold text-slate-800">
                        {totalCourseHours}
                      </td>

                      {/* Column 8: Tiến Độ (Short title) */}
                      <td className="py-2.5 px-3">
                        <div className="space-y-1.5">
                          {/* Progress text & bar */}
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-bold text-slate-800">
                              {currentDone} / {totalCourseHours} tiết
                            </span>
                            <span className={`font-bold ${isDone ? 'text-emerald-600' : 'text-blue-600'}`}>
                              {progressPct}%
                            </span>
                          </div>

                          <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all duration-300 ${
                                isDone ? 'bg-emerald-500' : 'bg-blue-500'
                              }`}
                              style={{ width: `${progressPct}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Column 9: Tình Trạng */}
                      <td className="py-2.5 px-3 text-center">
                        {isDone ? (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Đã hoàn thành</span>
                          </div>
                        ) : (
                          <div className="inline-flex flex-col items-center">
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200">
                              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
                              <span>Đang dạy</span>
                            </div>
                            <span className="text-[10px] text-slate-400 mt-0.5">
                              (Còn {Math.round((totalCourseHours - currentDone) * 100) / 100} tiết)
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Dynamic Custom Columns */}
                      {customColumns.map((col) => {
                        const val = course.customValues?.[col.id];
                        return (
                          <td key={col.id} className="py-2.5 px-3 text-center">
                            {col.type === 'boolean' ? (
                              <input
                                type="checkbox"
                                checked={Boolean(val)}
                                onChange={(e) =>
                                  onUpdateCustomValue(
                                    teacher.id,
                                    course.id,
                                    col.id,
                                    e.target.checked
                                  )
                                }
                                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                              />
                            ) : (
                              <input
                                type="text"
                                value={val ?? ''}
                                placeholder="-"
                                onChange={(e) =>
                                  onUpdateCustomValue(
                                    teacher.id,
                                    course.id,
                                    col.id,
                                    e.target.value
                                  )
                                }
                                className="w-full text-center text-xs py-1 px-1 bg-slate-50/60 hover:bg-white focus:bg-white border border-transparent hover:border-slate-300 focus:border-emerald-500 rounded focus:outline-none"
                              />
                            )}
                          </td>
                        );
                      })}

                      {/* Column Actions per Course */}
                      <td className="py-2.5 px-2 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => onDuplicateCourse(teacher.id, course)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded cursor-pointer"
                            title="Nhân bản môn này"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onEditCourse(teacher, course)}
                            className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded cursor-pointer"
                            title="Sửa chi tiết môn"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteCourse(teacher.id, course.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                            title="Xóa môn này"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                });
              })}
            </tbody>

            {/* Table Footer: Grand Summary Row */}
            <tfoot>
              <tr className="bg-slate-100 font-bold text-xs text-slate-900 border-t-2 border-slate-300">
                <td colSpan={4} className="py-3 px-4 text-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="uppercase tracking-wider">TỔNG CỘNG HỌC KỲ</span>
                    <span className="text-slate-500 font-normal">
                      {teachers.length} Giảng viên · {grandTotalCourses} Lớp/Môn
                    </span>
                  </div>
                </td>
                <td className="py-3 px-2 text-center text-slate-800">{grandTotalLT}</td>
                <td className="py-3 px-2 text-center text-slate-800">{grandTotalTH}</td>
                <td className="py-3 px-2 text-center text-emerald-800 text-sm font-extrabold">
                  {grandTotalHours}
                </td>
                <td className="py-3 px-3">
                  <div className="text-[11px] font-medium text-slate-700">
                    Đã dạy: <span className="text-emerald-700 font-bold">{grandCompletedHours}</span> / {grandTotalHours}h
                    ({grandTotalHours > 0 ? Math.round((grandCompletedHours / grandTotalHours) * 100) : 0}%)
                  </div>
                </td>
                <td className="py-3 px-3 text-center">
                  <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full font-bold text-[11px]">
                    {grandCompletedCourses}/{grandTotalCourses} Hoàn thành
                  </span>
                </td>
                <td colSpan={customColumns.length + 1} className="py-3 px-3 text-right text-slate-500 font-normal italic">
                  Tiến độ tự động theo lịch Việt Nam
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText || 'Xác nhận'}
        isDanger={confirmModal.isDanger || false}
      />
    </div>
  );
};
