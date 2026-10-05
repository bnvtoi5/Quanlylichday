import React, { useMemo, useState } from 'react';
import { Plus, Sparkles, X } from 'lucide-react';
import { CoursePauseInterval, MasterClass, MasterSubject, Teacher, TeachingStatus, WeeklySessionSlot } from '../types';
import { getVietnamNow } from '../utils/vietnamTime';
import { ensureChildClassName } from '../utils/classGrouping';
import { SchedulePicker } from './SchedulePicker';

interface QuickAddCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  teacher: Teacher | null;
  masterSubjects: MasterSubject[];
  masterClasses: MasterClass[];
  onAddCourse: (
    teacherId: string,
    courseData: {
      subjectName: string;
      subjectCode: string;
      theoryHours: number;
      practiceHours: number;
      className: string;
      credits: number;
      status: TeachingStatus;
      completedHours: number;
      startDate: string;
      sessionsPerWeek: number;
      hoursPerSession: number;
      scheduleSlots: WeeklySessionSlot[];
      pauseIntervals: CoursePauseInterval[];
      mergeRemainderHours?: boolean;
      customValues: Record<string, any>;
    }
  ) => void;
}

export const QuickAddCourseModal: React.FC<QuickAddCourseModalProps> = ({
  isOpen,
  onClose,
  teacher,
  masterSubjects,
  masterClasses,
  onAddCourse,
}) => {
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(
    masterSubjects[0]?.id || 'custom'
  );
  const [selectedClass, setSelectedClass] = useState<string>(
    masterClasses[0]?.name || 'CNTT26TH1'
  );
  const [customSubjectName, setCustomSubjectName] = useState('');
  const [customTheoryHours, setCustomTheoryHours] = useState(30);
  const [customPracticeHours, setCustomPracticeHours] = useState(30);

  // Calendar settings
  const [startDate, setStartDate] = useState<string>(() =>
    getVietnamNow().toISOString().slice(0, 10)
  );
  const [scheduleSlots, setScheduleSlots] = useState<WeeklySessionSlot[]>(['S2', 'S4']);
  const [hoursPerSession, setHoursPerSession] = useState<number>(4);
  const [pauseIntervals, setPauseIntervals] = useState<CoursePauseInterval[]>([]);
  const [mergeRemainderHours, setMergeRemainderHours] = useState<boolean>(false);

  const sortedMasterSubjects = useMemo(() => {
    return [...masterSubjects].sort((a, b) =>
      a.name.localeCompare(b.name, 'vi', { sensitivity: 'base' })
    );
  }, [masterSubjects]);

  if (!isOpen || !teacher) return null;

  const isCustomSubject = selectedSubjectId === 'custom';
  const selectedMaster = masterSubjects.find((s) => s.id === selectedSubjectId);

  const totalCourseHours = isCustomSubject
    ? Math.round((Number(customTheoryHours || 0) + Number(customPracticeHours || 0)) * 100) / 100
    : Math.round(((selectedMaster?.theoryHours || 0) + (selectedMaster?.practiceHours || 0)) * 100) / 100;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const subjName = isCustomSubject
      ? customSubjectName.trim()
      : selectedMaster?.name || 'Môn học mới';
    const subjCode = isCustomSubject
      ? `SUBJ${Date.now().toString().slice(-4)}`
      : selectedMaster?.code || '';
    const lt = isCustomSubject ? Number(customTheoryHours) || 0 : selectedMaster?.theoryHours || 0;
    const th = isCustomSubject ? Number(customPracticeHours) || 0 : selectedMaster?.practiceHours || 0;
    const creds = selectedMaster?.credits || 3;

    const cleanPauseIntervals = pauseIntervals.filter((p) => p.fromDate && p.toDate);

    onAddCourse(teacher.id, {
      subjectName: subjName,
      subjectCode: subjCode,
      theoryHours: lt,
      practiceHours: th,
      className: ensureChildClassName(selectedClass).trim().toUpperCase(),
      credits: creds,
      status: 'Đang dạy',
      completedHours: 0,
      startDate: startDate || getVietnamNow().toISOString().slice(0, 10),
      sessionsPerWeek: scheduleSlots.length || 1,
      hoursPerSession: Number(hoursPerSession) || 4,
      scheduleSlots: scheduleSlots.length > 0 ? scheduleSlots : ['S2'],
      pauseIntervals: cleanPauseIntervals,
      mergeRemainderHours,
      customValues: {},
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-slate-100 shrink-0 bg-white">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Gán Môn Nhanh Cho Giảng Viên</h2>
              <p className="text-xs text-slate-500">
                GV: <strong className="text-slate-800">{teacher.name}</strong> ({teacher.position})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form id="quick-add-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {/* Select Subject */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Chọn Môn Học từ Danh Mục Quản Lý *
            </label>
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="w-full py-2 px-3 bg-white border border-slate-200 rounded-lg text-slate-900 font-semibold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
            >
              {sortedMasterSubjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.theoryHours} LT + {s.practiceHours} TH = {s.theoryHours + s.practiceHours} tiết)
                </option>
              ))}
              <option value="custom">✏️ Nhập tên môn mới khác...</option>
            </select>
          </div>

          {/* If custom subject */}
          {isCustomSubject && (
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2.5">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Tên Môn Mới *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Cơ sở dữ liệu, Mạng máy tính..."
                  value={customSubjectName}
                  onChange={(e) => setCustomSubjectName(e.target.value)}
                  className="w-full py-1.5 px-2.5 bg-white border border-slate-200 rounded-lg text-slate-900 font-bold"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] text-slate-600 mb-0.5">Tiết LT</label>
                  <input
                    type="number"
                    min={0}
                    step="any"
                    placeholder="30 hoặc 67.5"
                    value={customTheoryHours}
                    onChange={(e) => setCustomTheoryHours(e.target.value === '' ? ('' as any) : Number(e.target.value))}
                    className="w-full py-1.5 px-2.5 bg-white border border-slate-200 rounded-lg font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-600 mb-0.5">Tiết TH</label>
                  <input
                    type="number"
                    min={0}
                    step="any"
                    placeholder="30 hoặc 22.5"
                    value={customPracticeHours}
                    onChange={(e) => setCustomPracticeHours(e.target.value === '' ? ('' as any) : Number(e.target.value))}
                    className="w-full py-1.5 px-2.5 bg-white border border-slate-200 rounded-lg font-bold text-slate-900"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Select or Type Class */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Lớp Giảng Dạy *</label>
            <input
              type="text"
              required
              placeholder="CNTT26TH1, CNTT26TH2, QTMT26TH1..."
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full py-2 px-3 border border-slate-200 rounded-lg font-mono font-bold text-slate-800 uppercase outline-none"
            />
            {masterClasses.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1.5">
                <span className="text-[10px] text-slate-400 self-center">Chọn nhanh:</span>
                {masterClasses.map((cls) => (
                  <button
                    type="button"
                    key={cls.id}
                    onClick={() => setSelectedClass(cls.name)}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-mono cursor-pointer transition-colors ${
                      selectedClass === cls.name
                        ? 'bg-emerald-600 text-white font-bold'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {cls.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Teaching Calendar Setup */}
          <SchedulePicker
            startDate={startDate}
            onStartDateChange={setStartDate}
            scheduleSlots={scheduleSlots}
            onScheduleSlotsChange={setScheduleSlots}
            hoursPerSession={hoursPerSession}
            onHoursPerSessionChange={setHoursPerSession}
            pauseIntervals={pauseIntervals}
            onPauseIntervalsChange={setPauseIntervals}
          />

          {/* Checkbox: Remainder Hours Setting */}
          <div className="bg-amber-50/70 p-3 rounded-xl border border-amber-200/80">
            <label className="flex items-start gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={mergeRemainderHours}
                onChange={(e) => setMergeRemainderHours(e.target.checked)}
                className="mt-0.5 rounded text-amber-600 focus:ring-amber-500 cursor-pointer w-4 h-4"
              />
              <div>
                <span className="font-bold text-amber-950 text-xs block">
                  Dồn số tiết lẻ vào buổi cuối cùng (Dành cho biểu đồ Gantt)
                </span>
                <span className="text-[11px] text-amber-800 leading-tight block mt-0.5">
                  Ví dụ tổng {totalCourseHours} tiết ({hoursPerSession} tiết/buổi), tích chọn để gom tiết dư vào buổi cuối thay vì tách thêm 1 buổi riêng.
                </span>
              </div>
            </label>
          </div>
        </form>

        <div className="flex items-center justify-end gap-2 p-4 border-t border-slate-100 bg-slate-50/80 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg font-medium transition-colors cursor-pointer"
          >
            Hủy
          </button>
          <button
            type="submit"
            form="quick-add-form"
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold shadow-xs cursor-pointer flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Gán Môn Dạy</span>
          </button>
        </div>
      </div>
    </div>
  );
};
