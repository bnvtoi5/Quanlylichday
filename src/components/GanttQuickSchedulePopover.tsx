import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Check,
  Clock,
  Edit3,
  ExternalLink,
  FastForward,
  Pause,
  Play,
  RotateCcw,
  Shuffle,
  Sparkles,
  Star,
  X,
  Zap,
} from 'lucide-react';
import {
  CourseAssignment,
  CoursePauseInterval,
  CourseSchedulePhase,
  Holiday,
  Semester,
  SessionPeriod,
  Teacher,
  WeeklySessionSlot,
} from '../types';
import {
  computeCourseGanttSchedule,
  CourseGanttSchedule,
  SemesterWeek,
  WeekGanttCell,
} from '../utils/ganttCalculator';
import {
  formatCourseScheduleSummary,
  formatSlotSummary,
  formatVietnamDate,
  parseDateString,
  parseSlotShorthand,
  toDateInputValue,
  WEEKLY_SLOT_INFO,
} from '../utils/vietnamTime';

export interface GanttQuickSchedulePopoverProps {
  isOpen: boolean;
  onClose: () => void;
  anchorRect: DOMRect | null;
  teacher: Teacher;
  course: CourseAssignment;
  week: SemesterWeek;
  semesterWeeks: SemesterWeek[];
  holidays: Holiday[];
  semester: Semester;
  onUpdateCourse: (teacherId: string, courseId: string, updates: Partial<CourseAssignment>) => void;
  onOpenFullEdit: (teacher: Teacher, course: CourseAssignment) => void;
  onToast: (msg: string) => void;
}

// Utility to shift a YYYY-MM-DD date by N days
function shiftDateByDays(dateStr: string, days: number): string {
  const d = parseDateString(dateStr);
  d.setDate(d.getDate() + days);
  return toDateInputValue(d);
}

// Check if a given week falls within any pause interval
function isWeekInPauseIntervals(week: SemesterWeek, pauseIntervals: CoursePauseInterval[] = []): boolean {
  return pauseIntervals.some(
    (p) => p.fromDate && p.toDate && p.fromDate <= week.sundayDateStr && p.toDate >= week.mondayDateStr
  );
}

const COMMON_SLOTS: { id: WeeklySessionSlot; label: string; period: 'Sáng' | 'Chiều' }[] = [
  { id: 'S2', label: 'T2', period: 'Sáng' },
  { id: 'S3', label: 'T3', period: 'Sáng' },
  { id: 'S4', label: 'T4', period: 'Sáng' },
  { id: 'S5', label: 'T5', period: 'Sáng' },
  { id: 'S6', label: 'T6', period: 'Sáng' },
  { id: 'S7', label: 'T7', period: 'Sáng' },
  { id: 'C2', label: 'T2', period: 'Chiều' },
  { id: 'C3', label: 'T3', period: 'Chiều' },
  { id: 'C4', label: 'T4', period: 'Chiều' },
  { id: 'C5', label: 'T5', period: 'Chiều' },
  { id: 'C6', label: 'T6', period: 'Chiều' },
  { id: 'C7', label: 'T7', period: 'Chiều' },
];

export const GanttQuickSchedulePopover: React.FC<GanttQuickSchedulePopoverProps> = ({
  isOpen,
  onClose,
  anchorRect,
  teacher,
  course,
  week,
  semesterWeeks,
  holidays,
  semester,
  onUpdateCourse,
  onOpenFullEdit,
  onToast,
}) => {
  const popoverRef = useRef<HTMLDivElement>(null);

  // Compute current schedule for this course
  const schedule: CourseGanttSchedule = useMemo(() => {
    return computeCourseGanttSchedule(course, semesterWeeks, holidays);
  }, [course, semesterWeeks, holidays]);

  const currentCell: WeekGanttCell | undefined = useMemo(() => {
    return schedule.cells.find((c) => c.weekIndex === week.weekIndex);
  }, [schedule, week.weekIndex]);

  const totalCourseHours =
    Math.round(((course.theoryHours || 0) + (course.practiceHours || 0)) * 100) / 100;

  const currentPause = useMemo(() => {
    return (course.pauseIntervals || []).find(
      (p) =>
        p.fromDate &&
        p.toDate &&
        p.fromDate <= week.sundayDateStr &&
        p.toDate >= week.mondayDateStr
    );
  }, [course.pauseIntervals, week.mondayDateStr, week.sundayDateStr]);

  const pauseSession: SessionPeriod | null = currentPause ? currentPause.session || 'ALL' : null;
  const isPausedThisWeek = Boolean(currentPause);
  const isInSpan = currentCell?.isInSpan ?? false;

  // Cumulative hours taught up through this week
  const cumulativeHoursUpToThisWeek = useMemo(() => {
    const cellsThroughWeek = schedule.cells.filter((c) => c.weekIndex <= week.weekIndex);
    return Math.min(
      totalCourseHours,
      Math.round(cellsThroughWeek.reduce((sum, c) => sum + c.totalHoursInWeek, 0) * 100) / 100
    );
  }, [schedule, week.weekIndex, totalCourseHours]);

  // Position the popover dynamically next to anchorRect without overflowing viewport
  const [popoverStyle, setPopoverStyle] = useState<React.CSSProperties>({
    position: 'fixed',
    top: 0,
    left: 0,
    opacity: 0,
    pointerEvents: 'none',
  });

  useEffect(() => {
    if (!isOpen || !anchorRect) return;

    const updatePosition = () => {
      const popoverWidth = 360;
      const popoverHeight = 440;
      const padding = 12;

      let top = anchorRect.bottom + 8;
      let left = anchorRect.left + anchorRect.width / 2 - popoverWidth / 2;

      // Check vertical overflow
      if (top + popoverHeight > window.innerHeight - padding) {
        top = Math.max(padding, anchorRect.top - popoverHeight - 8);
      }

      // Check horizontal overflow
      if (left + popoverWidth > window.innerWidth - padding) {
        left = window.innerWidth - popoverWidth - padding;
      }
      if (left < padding) {
        left = padding;
      }

      setPopoverStyle({
        position: 'fixed',
        top: `${top}px`,
        left: `${left}px`,
        width: `${popoverWidth}px`,
        zIndex: 9999,
        opacity: 1,
        pointerEvents: 'auto',
      });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isOpen, anchorRect]);

  // Close on outside click or Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !anchorRect) return null;

  // --------------------------------------------------------------------------
  // DIRECT MANIPULATION HANDLERS (Thao tác trực tiếp biến thành Data)
  // --------------------------------------------------------------------------

  // 1. Shift Schedule forward/backward by N weeks
  const handleShiftWeeks = (weeksDelta: number) => {
    const daysDelta = weeksDelta * 7;
    const currentStart = course.startDate || semester.startDate || '2026-09-07';
    const newStartDate = shiftDateByDays(currentStart, daysDelta);

    // Shift pause intervals proportionally so gaps remain relative
    const shiftedIntervals = (course.pauseIntervals || []).map((p) => ({
      ...p,
      fromDate: shiftDateByDays(p.fromDate, daysDelta),
      toDate: shiftDateByDays(p.toDate, daysDelta),
    }));

    onUpdateCourse(teacher.id, course.id, {
      startDate: newStartDate,
      pauseIntervals: shiftedIntervals,
    });

    onToast(
      `⚡ Đã dời lịch "${course.subjectName}" ${
        weeksDelta > 0 ? `tiến +${weeksDelta}` : `lùi ${weeksDelta}`
      } tuần (bắt đầu: ${formatVietnamDate(newStartDate)})`
    );
  };

  // 2. Set Start Date directly to this week's Monday
  const handleSetStartHere = () => {
    const targetMonday = week.mondayDateStr;
    const currentStart = course.startDate || semester.startDate || '2026-09-07';
    const oldD = parseDateString(currentStart);
    const newD = parseDateString(targetMonday);
    const daysDelta = Math.round((newD.getTime() - oldD.getTime()) / (1000 * 60 * 60 * 24));

    const shiftedIntervals = (course.pauseIntervals || []).map((p) => ({
      ...p,
      fromDate: shiftDateByDays(p.fromDate, daysDelta),
      toDate: shiftDateByDays(p.toDate, daysDelta),
    }));

    onUpdateCourse(teacher.id, course.id, {
      startDate: targetMonday,
      pauseIntervals: shiftedIntervals,
    });

    onToast(
      `🚀 Đã đặt "${course.subjectName}" bắt đầu từ ${week.weekLabel} (${week.mondayFormatted})!`
    );
  };

  // 3. Set Pause Session for this week (ALL / S / C / NONE)
  const handleSetPauseSession = (targetSession: SessionPeriod | 'NONE') => {
    // Remove existing pause overlapping this week
    const filtered = (course.pauseIntervals || []).filter(
      (p) =>
        !(
          p.fromDate &&
          p.toDate &&
          p.fromDate <= week.sundayDateStr &&
          p.toDate >= week.mondayDateStr
        )
    );

    let newIntervals: CoursePauseInterval[];

    if (targetSession === 'NONE') {
      newIntervals = filtered;
      onToast(`▶️ Đã khôi phục dạy bình thường ${week.weekLabel} cho môn "${course.subjectName}"`);
    } else {
      const sessionLabel =
        targetSession === 'ALL'
          ? 'cả ngày'
          : targetSession === 'S'
          ? 'buổi sáng'
          : 'buổi chiều';

      newIntervals = [
        ...filtered,
        {
          id: `pause-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          fromDate: week.mondayDateStr,
          toDate: week.sundayDateStr,
          session: targetSession,
          reason: `Nghỉ ${sessionLabel} ${week.weekLabel}`,
        },
      ];

      onToast(
        `⏸️ Đã đặt tạm ngưng ${sessionLabel} ${week.weekLabel} (${week.mondayFormatted} - ${week.sundayFormatted}) cho môn "${course.subjectName}"`
      );
    }

    onUpdateCourse(teacher.id, course.id, {
      pauseIntervals: newIntervals,
    });
  };

  // 4. Mark Completed through this week
  const handleMarkCompletedThroughWeek = () => {
    const isDone = cumulativeHoursUpToThisWeek >= totalCourseHours && totalCourseHours > 0;
    onUpdateCourse(teacher.id, course.id, {
      completedHours: cumulativeHoursUpToThisWeek,
      status: isDone ? 'Đã hoàn thành' : 'Đang dạy',
    });

    onToast(
      `✅ Đã cập nhật "${course.subjectName}": Đã dạy ${cumulativeHoursUpToThisWeek}/${totalCourseHours} tiết (hết ${week.weekLabel})`
    );
  };

  // 5. Toggle a specific weekly slot (S2, C4, etc.)
  const handleToggleSlot = (slotId: WeeklySessionSlot) => {
    const currentSlots: WeeklySessionSlot[] =
      course.scheduleSlots && course.scheduleSlots.length > 0
        ? course.scheduleSlots
        : (['S2'] as WeeklySessionSlot[]);
    let newSlots: WeeklySessionSlot[];

    if (currentSlots.includes(slotId)) {
      if (currentSlots.length <= 1) {
        onToast('⚠️ Môn học cần có ít nhất 1 buổi học trong tuần!');
        return;
      }
      newSlots = currentSlots.filter((s) => s !== slotId);
    } else {
      newSlots = [...currentSlots, slotId];
    }

    onUpdateCourse(teacher.id, course.id, {
      scheduleSlots: newSlots,
      sessionsPerWeek: newSlots.length,
    });

    onToast(`📅 Đã cập nhật lịch tuần của "${course.subjectName}" (${newSlots.length} buổi/tuần)`);
  };

  const handleSetPhaseFromThisWeek = (presetCode: string) => {
    const parsed = parseSlotShorthand(presetCode);
    if (parsed.length === 0) return;

    const fromDate = week.mondayDateStr;
    const existingPhases = course.schedulePhases || [];
    const otherPhases = existingPhases.filter((p) => p.fromDate !== fromDate);
    const newPhase: CourseSchedulePhase = {
      id: `phase-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      fromDate,
      scheduleSlots: parsed,
      note: `Từ ${week.weekLabel} (${formatVietnamDate(fromDate)}) đổi sang ${presetCode}`,
    };
    const updatedPhases = [...otherPhases, newPhase].sort((a, b) => a.fromDate.localeCompare(b.fromDate));

    onUpdateCourse(teacher.id, course.id, {
      schedulePhases: updatedPhases,
    });

    onToast(`⚡ Đã thiết lập: Từ ${week.weekLabel} (${formatVietnamDate(fromDate)}) đổi sang dạy ${presetCode}!`);
  };

  return (
    <div
      ref={popoverRef}
      style={popoverStyle}
      className="bg-slate-900 text-slate-100 rounded-2xl shadow-2xl border border-slate-700 p-4 text-xs font-sans space-y-3.5 animate-in fade-in zoom-in-95 backdrop-blur-md"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-[10px] bg-slate-800 text-emerald-400 px-1.5 py-0.5 rounded border border-slate-700">
              {course.className}
            </span>
            <span className="text-[11px] text-slate-400 font-medium">
              {teacher.name}
            </span>
          </div>
          <h4 className="font-bold text-sm text-white mt-1 leading-snug line-clamp-1 flex items-center gap-1.5">
            <span>{course.subjectName}</span>
            {course.mergeRemainderHours && (
              <span
                className="inline-flex items-center text-amber-400 hover:text-amber-300 transition-transform hover:scale-125 shrink-0"
                title="⭐ Môn này đã bật cộng dồn số tiết lẻ vào buổi cuối cùng cho biểu đồ Gantt"
              >
                <Star className="w-3.5 h-3.5 fill-amber-300 text-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.8)] animate-pulse" />
              </span>
            )}
          </h4>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
            <Calendar className="w-3 h-3 text-emerald-400" />
            <span className="font-bold text-emerald-300">{week.weekLabel}</span>
            <span>({week.mondayFormatted} - {week.sundayFormatted})</span>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer transition-colors shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Week Status Banner & Session-Level Pause Controls */}
      <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700/80 space-y-2">
        <div className="flex items-center gap-2">
          {pauseSession ? (
            <Pause className="w-4 h-4 text-amber-400 shrink-0" />
          ) : isInSpan ? (
            <Clock className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <Calendar className="w-4 h-4 text-slate-500 shrink-0" />
          )}

          <div>
            <div className="font-bold text-xs text-white">
              {pauseSession === 'ALL'
                ? '⏸️ Tuần này ngưng CẢ NGÀY'
                : pauseSession === 'S'
                ? '🌅 Tuần này ngưng buổi SÁNG (Chiều vẫn học)'
                : pauseSession === 'C'
                ? '🌆 Tuần này ngưng buổi CHIỀU (Sáng vẫn học)'
                : isInSpan
                ? `Đang học: ${currentCell?.totalHoursInWeek || 0} tiết (${currentCell?.totalSessionsInWeek || 0} buổi)`
                : 'Ngoài khoảng thời gian của môn'}
            </div>
            <div className="text-[10px] text-slate-400">
              {pauseSession
                ? 'Chọn buổi bên dưới để đổi sang ngưng Sáng/Chiều hoặc Học lại'
                : isInSpan
                ? `Tiến độ tích lũy hết tuần này: ${cumulativeHoursUpToThisWeek}/${totalCourseHours} tiết`
                : `Môn bắt đầu: ${formatVietnamDate(course.startDate || semester.startDate || '')}`}
            </div>
          </div>
        </div>

        {/* 4 Quick Pause Session Buttons */}
        <div className="grid grid-cols-4 gap-1.5 pt-1.5 border-t border-slate-700/60">
          <button
            type="button"
            onClick={() => handleSetPauseSession('ALL')}
            className={`py-1.5 px-1 rounded-lg text-xs font-bold border transition-all cursor-pointer text-center ${
              pauseSession === 'ALL'
                ? 'bg-amber-600 text-white border-amber-500 shadow-sm'
                : 'bg-slate-700/70 text-slate-300 border-slate-600 hover:bg-slate-700 hover:text-white'
            }`}
            title="Tạm ngưng cả ngày (tất cả các buổi trong tuần)"
          >
            Cả ngày
          </button>

          <button
            type="button"
            onClick={() => handleSetPauseSession('S')}
            className={`py-1.5 px-1 rounded-lg text-xs font-bold border transition-all cursor-pointer text-center ${
              pauseSession === 'S'
                ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                : 'bg-slate-700/70 text-slate-300 border-slate-600 hover:bg-slate-700 hover:text-white'
            }`}
            title="Chỉ tạm ngưng các buổi SÁNG trong tuần này"
          >
            Ngưng Sáng
          </button>

          <button
            type="button"
            onClick={() => handleSetPauseSession('C')}
            className={`py-1.5 px-1 rounded-lg text-xs font-bold border transition-all cursor-pointer text-center ${
              pauseSession === 'C'
                ? 'bg-purple-600 text-white border-purple-500 shadow-sm'
                : 'bg-slate-700/70 text-slate-300 border-slate-600 hover:bg-slate-700 hover:text-white'
            }`}
            title="Chỉ tạm ngưng các buổi CHIỀU trong tuần này"
          >
            Ngưng Chiều
          </button>

          <button
            type="button"
            onClick={() => handleSetPauseSession('NONE')}
            className={`py-1.5 px-1 rounded-lg text-xs font-bold border transition-all cursor-pointer text-center ${
              !pauseSession
                ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                : 'bg-slate-700/70 text-slate-300 border-slate-600 hover:bg-emerald-700 hover:text-white'
            }`}
            title="Học bình thường (không tạm ngưng tuần này)"
          >
            Học lại
          </button>
        </div>
      </div>

      {/* Direct Quick Schedule Adjustments */}
      <div className="space-y-2">
        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
          <Zap className="w-3 h-3 text-amber-400" />
          <span>Thao tác dời lịch tức thì (1-Click)</span>
        </div>

        <div className="grid grid-cols-3 gap-1.5">
          {/* Shift -1 Week */}
          <button
            type="button"
            onClick={() => handleShiftWeeks(-1)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 hover:text-white border border-slate-700/80 text-left transition-all cursor-pointer flex flex-col items-center justify-center text-center gap-1 group"
            title="Dời toàn bộ môn học lùi lại 1 tuần về trước"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-400 transition-colors" />
            <span className="font-bold text-[11px] text-white">Lùi 1 tuần</span>
            <span className="text-[9px] text-slate-400">-7 ngày</span>
          </button>

          {/* Set Start Here */}
          <button
            type="button"
            onClick={handleSetStartHere}
            className="p-2 rounded-xl bg-emerald-950/50 hover:bg-emerald-900/60 border border-emerald-600/50 text-emerald-200 text-left transition-all cursor-pointer flex flex-col items-center justify-center text-center gap-1 group shadow-xs"
            title="Đặt ngày bắt đầu môn học đúng vào thứ Hai tuần này"
          >
            <FastForward className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform" />
            <span className="font-bold text-[11px] text-emerald-300">Bắt đầu từ đây</span>
            <span className="text-[9px] text-emerald-400/80">{week.mondayFormatted}</span>
          </button>

          {/* Shift +1 Week */}
          <button
            type="button"
            onClick={() => handleShiftWeeks(1)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 hover:text-white border border-slate-700/80 text-left transition-all cursor-pointer flex flex-col items-center justify-center text-center gap-1 group"
            title="Dời toàn bộ môn học tiến lên 1 tuần về sau"
          >
            <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-400 transition-colors" />
            <span className="font-bold text-[11px] text-white">Tiến 1 tuần</span>
            <span className="text-[9px] text-slate-400">+7 ngày</span>
          </button>
        </div>

        {/* Mark completed through here */}
        <button
          type="button"
          onClick={handleMarkCompletedThroughWeek}
          className="w-full py-1.5 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 flex items-center justify-between text-xs transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5 text-emerald-400" />
            <span>Đánh dấu đã dạy đến hết tuần này</span>
          </div>
          <span className="font-bold font-mono text-emerald-400">
            {cumulativeHoursUpToThisWeek} tiết
          </span>
        </button>
      </div>

      {/* Quick Weekly Slots Picker (T2..T7 Sáng / Chiều) */}
      <div className="space-y-1.5 pt-1 border-t border-slate-800">
        <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
          <span>Buổi học trong tuần:</span>
          <span className="text-[10px] text-emerald-400 font-mono">
            {formatSlotSummary(course.scheduleSlots) ? `${formatSlotSummary(course.scheduleSlots)} · ` : ''}
            {(course.scheduleSlots || []).join(', ') || 'Chưa chọn'} ({(course.scheduleSlots || []).length} buổi)
          </span>
        </div>

        {/* Quick Shorthand Presets */}
        <div className="flex flex-wrap items-center gap-1">
          <span className="text-[9px] text-slate-500 font-semibold uppercase">Mẫu nhanh:</span>
          {[
            { code: 'S6', label: 'S6' },
            { code: 'SC7', label: 'SC7' },
            { code: 'SC56', label: 'sc56' },
            { code: 'S56', label: 'S56' },
            { code: 'C5', label: 'C5' },
            { code: 'C6', label: 'C6' },
            { code: 'S2, S4', label: 'S2, S4' },
            { code: 'S3, S5', label: 'S3, S5' },
          ].map((preset) => {
            const isMatch = formatSlotSummary(course.scheduleSlots) === preset.code.replace(/[\s,]+/g, '');
            return (
              <button
                key={preset.code}
                type="button"
                onClick={() => {
                  const parsed = parseSlotShorthand(preset.code);
                  if (parsed.length > 0) {
                    onUpdateCourse(teacher.id, course.id, {
                      scheduleSlots: parsed,
                      sessionsPerWeek: parsed.length,
                    });
                    onToast(`📅 Đã gán lịch ${preset.label} (${parsed.join(', ')})`);
                  }
                }}
                className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold transition-all cursor-pointer ${
                  isMatch
                    ? 'bg-amber-500 text-slate-950 font-black'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700'
                }`}
                title={`Gán nhanh ${preset.label}`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>

        {/* Morning Slots */}
        <div className="space-y-1">
          <div className="text-[9px] text-slate-500 font-semibold uppercase">Sáng (S2-S7):</div>
          <div className="grid grid-cols-6 gap-1">
            {COMMON_SLOTS.filter((s) => s.period === 'Sáng').map((slot) => {
              const isSelected = (course.scheduleSlots || []).includes(slot.id);
              return (
                <button
                  key={slot.id}
                  type="button"
                  onClick={() => handleToggleSlot(slot.id)}
                  className={`py-1 rounded font-bold text-[10px] transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white border border-slate-700/60'
                  }`}
                  title={`${slot.period} ${WEEKLY_SLOT_INFO[slot.id]?.dayName || slot.label}`}
                >
                  {slot.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Afternoon Slots */}
        <div className="space-y-1 pt-0.5">
          <div className="text-[9px] text-slate-500 font-semibold uppercase">Chiều (C2-C7):</div>
          <div className="grid grid-cols-6 gap-1">
            {COMMON_SLOTS.filter((s) => s.period === 'Chiều').map((slot) => {
              const isSelected = (course.scheduleSlots || []).includes(slot.id);
              return (
                <button
                  key={slot.id}
                  type="button"
                  onClick={() => handleToggleSlot(slot.id)}
                  className={`py-1 rounded font-bold text-[10px] transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white border border-slate-700/60'
                  }`}
                  title={`${slot.period} ${WEEKLY_SLOT_INFO[slot.id]?.dayName || slot.label}`}
                >
                  {slot.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Multi-phase Schedule Quick Transition */}
      <div className="bg-purple-950/40 rounded-xl p-3 border border-purple-800/60 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-purple-200 flex items-center gap-1.5">
            <Shuffle className="w-3.5 h-3.5 text-purple-400" />
            <span>Đổi buổi từ tuần này ({week.weekLabel})</span>
          </span>
          {course.schedulePhases && course.schedulePhases.length > 0 && (
            <span className="text-[10px] font-mono text-purple-300 bg-purple-900/60 px-1.5 py-0.5 rounded border border-purple-700/60">
              {formatCourseScheduleSummary(course.scheduleSlots, course.schedulePhases)}
            </span>
          )}
        </div>
        <div className="text-[10px] text-purple-300/80">
          Thiết lập giai đoạn mới (VD: trước dạy C7, từ tuần này đổi sang SC7):
        </div>
        <div className="flex flex-wrap items-center gap-1">
          {['SC7', 'C7', 'S7', 'SC6', 'S6', 'C6', 'SC56', 'S5,6'].map((code) => (
            <button
              key={code}
              type="button"
              onClick={() => handleSetPhaseFromThisWeek(code)}
              className="px-2 py-1 rounded text-[10px] font-mono font-bold bg-purple-900/70 hover:bg-purple-700 text-purple-100 border border-purple-600/70 transition-all cursor-pointer"
              title={`Từ ${week.weekLabel} chuyển sang dạy ${code}`}
            >
              + Đổi {code}
            </button>
          ))}
          {course.schedulePhases && course.schedulePhases.length > 0 && (
            <button
              type="button"
              onClick={() => {
                onUpdateCourse(teacher.id, course.id, { schedulePhases: [] });
                onToast('Đã xóa tất cả các giai đoạn đổi buổi!');
              }}
              className="px-2 py-1 rounded text-[10px] text-rose-300 hover:text-rose-100 hover:bg-rose-900/60 border border-rose-800/60 transition-all cursor-pointer ml-auto"
              title="Xóa hết các giai đoạn đổi buổi, chỉ giữ lịch gốc"
            >
              Xóa giai đoạn
            </button>
          )}
        </div>
      </div>

      {/* Footer link to full modal */}
      <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
        <span className="text-[10px] text-slate-500">
          Thao tác tự động lưu dữ liệu ngay
        </span>

        <button
          type="button"
          onClick={() => {
            onClose();
            onOpenFullEdit(teacher, course);
          }}
          className="text-emerald-400 hover:text-emerald-300 font-bold text-[11px] flex items-center gap-1 cursor-pointer"
        >
          <Edit3 className="w-3 h-3" />
          <span>Mở chi tiết đầy đủ</span>
        </button>
      </div>
    </div>
  );
};
