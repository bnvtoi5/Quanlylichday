import React, { useEffect, useMemo, useState } from 'react';
import { BookOpen, Sparkles, Star, X } from 'lucide-react';
import { CourseAssignment, CoursePauseInterval, CourseSchedulePhase, CustomColumn, MasterClass, MasterSubject, Teacher, TeachingStatus, WeeklySessionSlot } from '../types';
import { getVietnamNow } from '../utils/vietnamTime';
import { ensureChildClassName } from '../utils/classGrouping';
import { SchedulePicker } from './SchedulePicker';

interface CourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetTeacher: Teacher | null;
  courseToEdit: CourseAssignment | null;
  masterSubjects: MasterSubject[];
  masterClasses: MasterClass[];
  customColumns: CustomColumn[];
  onSaveCourse: (teacherId: string, courseData: Omit<CourseAssignment, 'id'> & { id?: string }) => void;
}

export const CourseModal: React.FC<CourseModalProps> = ({
  isOpen,
  onClose,
  targetTeacher,
  courseToEdit,
  masterSubjects,
  masterClasses,
  customColumns,
  onSaveCourse,
}) => {
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [subjectName, setSubjectName] = useState('');
  const [subjectCode, setSubjectCode] = useState('');
  const [theoryHours, setTheoryHours] = useState(30);
  const [practiceHours, setPracticeHours] = useState(30);
  const [credits, setCredits] = useState(3);
  const [className, setClassName] = useState('CNTT26TH1');
  const [completedHours, setCompletedHours] = useState<number>(0);

  // Smart Academic Calendar settings
  const [startDate, setStartDate] = useState<string>('');
  const [scheduleSlots, setScheduleSlots] = useState<WeeklySessionSlot[]>(['S2']);
  const [schedulePhases, setSchedulePhases] = useState<CourseSchedulePhase[]>([]);
  const [hoursPerSession, setHoursPerSession] = useState<number>(4);
  const [pauseIntervals, setPauseIntervals] = useState<CoursePauseInterval[]>([]);
  const [mergeRemainderHours, setMergeRemainderHours] = useState<boolean>(false);

  const [customValues, setCustomValues] = useState<Record<string, any>>({});

  useEffect(() => {
    const vnNow = getVietnamNow();
    const defaultDateStr = vnNow.toISOString().slice(0, 10);

    if (courseToEdit) {
      setSubjectName(courseToEdit.subjectName);
      setSubjectCode(courseToEdit.subjectCode || '');
      setTheoryHours(courseToEdit.theoryHours);
      setPracticeHours(courseToEdit.practiceHours);
      setCredits(courseToEdit.credits || 3);
      setClassName(courseToEdit.className);
      setCompletedHours(courseToEdit.completedHours || 0);
      setStartDate(courseToEdit.startDate || defaultDateStr);
      setScheduleSlots(courseToEdit.scheduleSlots && courseToEdit.scheduleSlots.length > 0 ? courseToEdit.scheduleSlots : ['S2']);
      setSchedulePhases(courseToEdit.schedulePhases ? JSON.parse(JSON.stringify(courseToEdit.schedulePhases)) : []);
      setHoursPerSession(courseToEdit.hoursPerSession || 4);
      setPauseIntervals(courseToEdit.pauseIntervals || []);
      setMergeRemainderHours(Boolean(courseToEdit.mergeRemainderHours));
      setCustomValues(courseToEdit.customValues || {});

      const matched = masterSubjects.find((s) => s.name === courseToEdit.subjectName);
      setSelectedSubjectId(matched ? matched.id : 'custom');
    } else {
      if (masterSubjects.length > 0) {
        const first = masterSubjects[0];
        setSelectedSubjectId(first.id);
        setSubjectName(first.name);
        setSubjectCode(first.code);
        setTheoryHours(first.theoryHours);
        setPracticeHours(first.practiceHours);
        setCredits(first.credits);
      } else {
        setSelectedSubjectId('custom');
        setSubjectName('Môn học mới');
        setSubjectCode('');
        setTheoryHours(30);
        setPracticeHours(30);
        setCredits(3);
      }
      setClassName(masterClasses.length > 0 ? masterClasses[0].name : 'CNTT26TH1');
      setCompletedHours(0);
      setStartDate(defaultDateStr);
      setScheduleSlots(['S2', 'S4']);
      setSchedulePhases([]);
      setHoursPerSession(4);
      setPauseIntervals([]);
      setMergeRemainderHours(false);

      const defaults: Record<string, any> = {};
      customColumns.forEach((c) => {
        if (c.defaultValue !== undefined) defaults[c.id] = c.defaultValue;
      });
      setCustomValues(defaults);
    }
  }, [courseToEdit, isOpen, masterSubjects, masterClasses, customColumns]);

  const sortedMasterSubjects = useMemo(() => {
    return [...masterSubjects].sort((a, b) =>
      a.name.localeCompare(b.name, 'vi', { sensitivity: 'base' })
    );
  }, [masterSubjects]);

  if (!isOpen || !targetTeacher) return null;

  const handleSelectMasterSubject = (subjId: string) => {
    setSelectedSubjectId(subjId);
    if (subjId === 'custom') return;
    const found = masterSubjects.find((s) => s.id === subjId);
    if (found) {
      setSubjectName(found.name);
      setSubjectCode(found.code);
      setTheoryHours(found.theoryHours);
      setPracticeHours(found.practiceHours);
      setCredits(found.credits);
    }
  };

  const totalCourseHours =
    Math.round((Number(theoryHours || 0) + Number(practiceHours || 0)) * 100) / 100;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectName.trim() || !className.trim()) return;

    const validatedCompleted = Math.max(0, Math.min(totalCourseHours, Number(completedHours) || 0));
    const derivedStatus: TeachingStatus =
      validatedCompleted >= totalCourseHours && totalCourseHours > 0 ? 'Đã hoàn thành' : 'Đang dạy';

    const cleanPauseIntervals = pauseIntervals.filter((p) => p.fromDate && p.toDate);
    const cleanSchedulePhases = (schedulePhases || []).filter(
      (p) => p.fromDate && p.scheduleSlots && p.scheduleSlots.length > 0
    );

    onSaveCourse(targetTeacher.id, {
      id: courseToEdit?.id,
      subjectName: subjectName.trim(),
      subjectCode: subjectCode.trim(),
      theoryHours: Number(theoryHours) || 0,
      practiceHours: Number(practiceHours) || 0,
      className: ensureChildClassName(className).trim().toUpperCase(),
      credits: Number(credits) || 1,
      status: derivedStatus,
      completedHours: Math.round(validatedCompleted * 100) / 100,
      startDate: startDate || getVietnamNow().toISOString().slice(0, 10),
      sessionsPerWeek: scheduleSlots.length || 1,
      hoursPerSession: Number(hoursPerSession) || 4,
      scheduleSlots: scheduleSlots.length > 0 ? scheduleSlots : ['S2'],
      schedulePhases: cleanSchedulePhases,
      pauseIntervals: cleanPauseIntervals,
      mergeRemainderHours,
      customValues,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-slate-100 shrink-0 bg-white">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {courseToEdit ? 'Chỉnh Sửa Phân Công Môn' : 'Phân Công Môn Dạy Mới'}
              </h2>
              <p className="text-xs text-slate-500">
                Giảng viên: <strong className="text-slate-800">{targetTeacher.name}</strong> ({targetTeacher.position})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form id="course-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {/* Quick Master Subject dropdown selector */}
          <div className="bg-emerald-50/60 p-3 rounded-xl border border-emerald-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-emerald-900 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>Chọn nhanh môn từ danh mục:</span>
              </label>
              <span className="text-[11px] text-emerald-700 font-medium">Tự động điền số tiết</span>
            </div>

            <select
              value={selectedSubjectId}
              onChange={(e) => handleSelectMasterSubject(e.target.value)}
              className="w-full py-2 px-3 bg-white border border-emerald-300 rounded-lg text-slate-800 font-semibold focus:outline-none"
            >
              {sortedMasterSubjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.theoryHours} LT + {s.practiceHours} TH = {s.theoryHours + s.practiceHours} tiết, {s.credits} TC)
                </option>
              ))}
              <option value="custom">✏️ Nhập tên môn tùy biến khác...</option>
            </select>
          </div>

          {/* Subject details */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">Tên Môn Học *</label>
              <input
                type="text"
                required
                value={subjectName}
                onChange={(e) => setSubjectName(e.target.value)}
                className="w-full py-2 px-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-slate-900 font-bold"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Mã Môn</label>
              <input
                type="text"
                value={subjectCode}
                onChange={(e) => setSubjectCode(e.target.value)}
                className="w-full py-2 px-3 border border-slate-200 rounded-lg font-mono uppercase text-slate-800 outline-none"
              />
            </div>
          </div>

          {/* Class selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Lớp Giảng Dạy *</label>
              <input
                type="text"
                required
                placeholder="Ví dụ: CNTT26TH1, QTMT26TH1..."
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                className="w-full py-2 px-3 border border-slate-200 rounded-lg font-mono font-bold text-slate-800 outline-none uppercase"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Số Tín Chỉ</label>
              <input
                type="number"
                min={1}
                max={15}
                value={credits}
                onChange={(e) => setCredits(Number(e.target.value))}
                className="w-full py-2 px-3 border border-slate-200 rounded-lg outline-none text-slate-800"
              />
            </div>
          </div>

          {/* Theory & Practice Hours */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Tiết Lý Thuyết (LT)</label>
              <input
                type="number"
                min={0}
                step="any"
                placeholder="Ví dụ: 30 hoặc 67.5"
                value={theoryHours}
                onChange={(e) => setTheoryHours(e.target.value === '' ? ('' as any) : Number(e.target.value))}
                className="w-full py-2 px-3 bg-white border border-slate-200 rounded-lg text-slate-900 font-bold"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Tiết Thực Hành (TH)</label>
              <input
                type="number"
                min={0}
                step="any"
                placeholder="Ví dụ: 30 hoặc 22.5"
                value={practiceHours}
                onChange={(e) => setPracticeHours(e.target.value === '' ? ('' as any) : Number(e.target.value))}
                className="w-full py-2 px-3 bg-white border border-slate-200 rounded-lg text-slate-900 font-bold"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Tổng Số Tiết</label>
              <div className="py-2 px-3 bg-emerald-50 border border-emerald-200 rounded-lg font-black text-emerald-800 text-sm text-center">
                {totalCourseHours} tiết
              </div>
            </div>
          </div>

          {/* Smart Academic Calendar & Pause Intervals Setup */}
          <SchedulePicker
            startDate={startDate}
            onStartDateChange={setStartDate}
            scheduleSlots={scheduleSlots}
            onScheduleSlotsChange={setScheduleSlots}
            hoursPerSession={hoursPerSession}
            onHoursPerSessionChange={setHoursPerSession}
            pauseIntervals={pauseIntervals}
            onPauseIntervalsChange={setPauseIntervals}
            schedulePhases={schedulePhases}
            onSchedulePhasesChange={setSchedulePhases}
          />

          {/* Checkbox: Remainder Hours Setting (Dồn tiết lẻ vào buổi cuối) */}
          <div className="bg-amber-50/70 p-3 rounded-xl border border-amber-200/80">
            <label className="flex items-start gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={mergeRemainderHours}
                onChange={(e) => setMergeRemainderHours(e.target.checked)}
                className="mt-0.5 rounded text-amber-600 focus:ring-amber-500 cursor-pointer w-4 h-4"
              />
              <div>
                <span className="font-bold text-amber-950 text-xs flex items-center gap-1.5">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500 drop-shadow-[0_0_4px_rgba(245,158,11,0.7)] animate-pulse" />
                  <span>Dồn số tiết lẻ vào buổi cuối cùng (Dành cho biểu đồ Gantt)</span>
                </span>
                <span className="text-[11px] text-amber-800 leading-tight block mt-0.5">
                  Ví dụ tổng {totalCourseHours} tiết (mỗi buổi {hoursPerSession} tiết) thì thay vì tách thêm 1 buổi lẻ riêng, hệ thống sẽ gom số tiết dư vào buổi cuối cùng.
                </span>
              </div>
            </label>
          </div>

          {/* Current completed hours */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Số Tiết Đã Dạy Hiện Tại
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                max={totalCourseHours}
                step="any"
                value={completedHours}
                onChange={(e) => setCompletedHours(e.target.value === '' ? ('' as any) : Number(e.target.value))}
                className="w-full py-2 px-3 border border-slate-200 rounded-lg text-slate-900 font-bold"
              />
              <span className="text-slate-500 shrink-0 font-medium">/ {totalCourseHours} tiết</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              * Tình trạng sẽ tự động hiển thị: <strong>Đã hoàn thành</strong> khi đạt đủ {totalCourseHours} tiết, hoặc <strong>Đang dạy</strong> khi chưa đủ.
            </p>
          </div>

          {/* Custom Columns Fields */}
          {customColumns.length > 0 && (
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
              <span className="font-bold text-slate-700 block">Các Cột Tùy Biến:</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {customColumns.map((col) => (
                  <div key={col.id}>
                    <label className="block font-medium text-slate-600 mb-1">{col.name}</label>
                    {col.type === 'boolean' ? (
                      <label className="flex items-center gap-2 cursor-pointer mt-2">
                        <input
                          type="checkbox"
                          checked={Boolean(customValues[col.id])}
                          onChange={(e) =>
                            setCustomValues((prev) => ({ ...prev, [col.id]: e.target.checked }))
                          }
                          className="rounded text-emerald-600 focus:ring-emerald-500"
                        />
                        <span className="text-slate-700">Đã hoàn tất</span>
                      </label>
                    ) : (
                      <input
                        type={col.type === 'number' ? 'number' : col.type === 'date' ? 'date' : 'text'}
                        value={customValues[col.id] || ''}
                        onChange={(e) =>
                          setCustomValues((prev) => ({ ...prev, [col.id]: e.target.value }))
                        }
                        className="w-full py-1.5 px-3 border border-slate-200 rounded-lg text-slate-800"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </form>

        <div className="p-4 border-t border-slate-100 flex items-center justify-end gap-2 bg-slate-50 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            Hủy Bỏ
          </button>
          <button
            type="submit"
            form="course-form"
            className="px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            {courseToEdit ? 'Lưu Thay Đổi' : 'Thêm Phân Công Môn'}
          </button>
        </div>
      </div>
    </div>
  );
};
