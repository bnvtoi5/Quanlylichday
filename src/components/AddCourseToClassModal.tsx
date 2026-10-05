import React, { useEffect, useMemo, useState } from 'react';
import {
  BookOpen,
  GraduationCap,
  Plus,
  Sparkles,
  Star,
  UserCheck,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import {
  CourseAssignment,
  CoursePauseInterval,
  CourseSchedulePhase,
  CustomColumn,
  Holiday,
  MasterClass,
  MasterSubject,
  MasterTeacher,
  Teacher,
  TeachingStatus,
  WeeklySessionSlot,
} from '../types';
import { getVietnamNow } from '../utils/vietnamTime';
import { ensureChildClassName } from '../utils/classGrouping';
import { SchedulePicker } from './SchedulePicker';

interface AddCourseToClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetClassName: string;
  availableClasses?: MasterClass[];
  masterSubjects: MasterSubject[];
  teachersInSemester: Teacher[];
  masterTeachers: MasterTeacher[];
  customColumns: CustomColumn[];
  holidays: Holiday[];
  onAddCourseToClass: (
    className: string,
    teacherSelection: {
      type: 'existing' | 'master' | 'new';
      teacherId?: string;
      masterTeacher?: MasterTeacher;
      newTeacher?: {
        name: string;
        position: string;
        phone?: string;
        email?: string;
      };
    },
    courseData: Omit<CourseAssignment, 'id'>
  ) => void;
}

export const AddCourseToClassModal: React.FC<AddCourseToClassModalProps> = ({
  isOpen,
  onClose,
  targetClassName,
  availableClasses = [],
  masterSubjects,
  teachersInSemester,
  masterTeachers,
  customColumns,
  holidays,
  onAddCourseToClass,
}) => {
  // Class selection state (default to targetClassName)
  const [selectedClass, setSelectedClass] = useState<string>(targetClassName);

  // Find related family (parent or subgroups) for quick switching
  const relatedFamily = useMemo(() => {
    if (!availableClasses || availableClasses.length === 0) return null;
    const currentName = (selectedClass.trim() || targetClassName.trim()).toUpperCase();
    if (!currentName) return null;

    // Is currentName a parent?
    const parent = availableClasses.find(
      (c) => c.name.toUpperCase() === currentName && (c.isParent || (c.subgroups && c.subgroups.length > 0))
    );
    if (parent && parent.subgroups && parent.subgroups.length > 0) {
      return {
        parentName: parent.name,
        subgroups: parent.subgroups,
      };
    }

    // Is currentName a subgroup of a parent?
    const parentOfSubgroup = availableClasses.find(
      (c) =>
        (c.subgroups && c.subgroups.some((sg) => sg.toUpperCase() === currentName)) ||
        (c.isParent && c.subgroups?.includes(currentName))
    );
    if (parentOfSubgroup && parentOfSubgroup.subgroups && parentOfSubgroup.subgroups.length > 0) {
      return {
        parentName: parentOfSubgroup.name,
        subgroups: parentOfSubgroup.subgroups,
      };
    }

    // Check parentClassName attribute
    const childClass = availableClasses.find((c) => c.name.toUpperCase() === currentName);
    if (childClass?.parentClassName) {
      const p = availableClasses.find(
        (c) => c.name.toUpperCase() === childClass.parentClassName?.toUpperCase()
      );
      if (p) {
        return {
          parentName: p.name,
          subgroups: p.subgroups || [currentName],
        };
      }
    }

    return null;
  }, [availableClasses, selectedClass, targetClassName]);

  // Subject states
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(
    masterSubjects[0]?.id || 'custom'
  );
  const [subjectName, setSubjectName] = useState('');
  const [subjectCode, setSubjectCode] = useState('');
  const [theoryHours, setTheoryHours] = useState<number>(30);
  const [practiceHours, setPracticeHours] = useState<number>(30);
  const [credits, setCredits] = useState<number>(3);

  // Teacher selection state
  // Mode: 'existing' (from semester), 'master' (from catalog), 'new' (type fresh)
  const [teacherMode, setTeacherMode] = useState<'existing' | 'master' | 'new'>('existing');
  const [selectedExistingTeacherId, setSelectedExistingTeacherId] = useState<string>('');
  const [selectedMasterTeacherId, setSelectedMasterTeacherId] = useState<string>('');
  const [newTeacherName, setNewTeacherName] = useState('');
  const [newTeacherPosition, setNewTeacherPosition] = useState('Cơ hữu');
  const [newTeacherPhone, setNewTeacherPhone] = useState('');
  const [newTeacherEmail, setNewTeacherEmail] = useState('');

  // Schedule & Academic Settings
  const [startDate, setStartDate] = useState<string>(() =>
    getVietnamNow().toISOString().slice(0, 10)
  );
  const [scheduleSlots, setScheduleSlots] = useState<WeeklySessionSlot[]>(['S2', 'S4']);
  const [schedulePhases, setSchedulePhases] = useState<CourseSchedulePhase[]>([]);
  const [hoursPerSession, setHoursPerSession] = useState<number>(4);
  const [pauseIntervals, setPauseIntervals] = useState<CoursePauseInterval[]>([]);
  const [mergeRemainderHours, setMergeRemainderHours] = useState<boolean>(false);
  const [customValues, setCustomValues] = useState<Record<string, any>>({});

  // Reset or initialize on open
  useEffect(() => {
    if (isOpen) {
      setSelectedClass(targetClassName || availableClasses[0]?.name || 'CNTT26TH1');

      if (masterSubjects.length > 0) {
        const first = masterSubjects[0];
        setSelectedSubjectId(first.id);
        setSubjectName(first.name);
        setSubjectCode(first.code);
        setTheoryHours(first.theoryHours);
        setPracticeHours(first.practiceHours);
        setCredits(first.credits || 3);
      } else {
        setSelectedSubjectId('custom');
        setSubjectName('');
        setSubjectCode('');
        setTheoryHours(30);
        setPracticeHours(30);
        setCredits(3);
      }

      // Default teacher selection
      if (teachersInSemester.length > 0) {
        setTeacherMode('existing');
        setSelectedExistingTeacherId(teachersInSemester[0].id);
      } else if (masterTeachers.length > 0) {
        setTeacherMode('master');
        setSelectedMasterTeacherId(masterTeachers[0].id);
      } else {
        setTeacherMode('new');
        setNewTeacherName('');
        setNewTeacherPosition('Cơ hữu');
      }

      setStartDate(getVietnamNow().toISOString().slice(0, 10));
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
  }, [isOpen, targetClassName, masterSubjects, teachersInSemester, masterTeachers, customColumns]);

  const sortedMasterSubjects = useMemo(() => {
    return [...masterSubjects].sort((a, b) =>
      a.name.localeCompare(b.name, 'vi', { sensitivity: 'base' })
    );
  }, [masterSubjects]);

  const handleSelectMasterSubject = (id: string) => {
    setSelectedSubjectId(id);
    if (id === 'custom') {
      setSubjectName('');
      setSubjectCode('');
      setTheoryHours(30);
      setPracticeHours(30);
      setCredits(3);
    } else {
      const found = masterSubjects.find((s) => s.id === id);
      if (found) {
        setSubjectName(found.name);
        setSubjectCode(found.code);
        setTheoryHours(found.theoryHours);
        setPracticeHours(found.practiceHours);
        setCredits(found.credits || 3);
      }
    }
  };

  if (!isOpen) return null;

  const totalCourseHours = Math.round((Number(theoryHours || 0) + Number(practiceHours || 0)) * 100) / 100;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedClass.trim()) {
      alert('Vui lòng chọn hoặc nhập tên lớp!');
      return;
    }

    if (!subjectName.trim()) {
      alert('Vui lòng nhập tên môn học!');
      return;
    }

    let teacherSelection: any = { type: teacherMode };

    if (teacherMode === 'existing') {
      if (!selectedExistingTeacherId) {
        alert('Vui lòng chọn Giảng viên phụ trách!');
        return;
      }
      teacherSelection.teacherId = selectedExistingTeacherId;
    } else if (teacherMode === 'master') {
      const masterT = masterTeachers.find((t) => t.id === selectedMasterTeacherId);
      if (!masterT) {
        alert('Vui lòng chọn Giảng viên từ danh mục!');
        return;
      }
      teacherSelection.masterTeacher = masterT;
      teacherSelection.teacherId = masterT.id;
    } else {
      if (!newTeacherName.trim()) {
        alert('Vui lòng nhập tên Giảng viên mới!');
        return;
      }
      teacherSelection.newTeacher = {
        name: newTeacherName.trim(),
        position: newTeacherPosition,
        phone: newTeacherPhone.trim(),
        email: newTeacherEmail.trim(),
      };
    }

    const targetChildClass = ensureChildClassName(selectedClass).trim().toUpperCase();

    const cleanSchedulePhases = (schedulePhases || []).filter(
      (p) => p.fromDate && p.scheduleSlots && p.scheduleSlots.length > 0
    );

    const courseData: Omit<CourseAssignment, 'id'> = {
      subjectName: subjectName.trim(),
      subjectCode: subjectCode.trim().toUpperCase(),
      theoryHours: Number(theoryHours) || 0,
      practiceHours: Number(practiceHours) || 0,
      className: targetChildClass,
      credits: Number(credits) || 3,
      status: 'Đang dạy',
      completedHours: 0,
      startDate: startDate || getVietnamNow().toISOString().slice(0, 10),
      sessionsPerWeek: scheduleSlots.length || 2,
      hoursPerSession: Number(hoursPerSession) || 4,
      scheduleSlots: scheduleSlots.length > 0 ? scheduleSlots : ['S2', 'S4'],
      schedulePhases: cleanSchedulePhases,
      pauseIntervals: pauseIntervals.filter((p) => p.fromDate && p.toDate),
      mergeRemainderHours: Boolean(mergeRemainderHours),
      customValues,
    };

    onAddCourseToClass(targetChildClass, teacherSelection, courseData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 bg-gradient-to-r from-emerald-50/80 via-teal-50/60 to-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">
                  Thêm Môn Mới Vào Lớp Học
                </h2>
                <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  {selectedClass || targetClassName}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Thêm môn trực tiếp cho lớp rồi phân công Giảng viên phụ trách
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-white/80 cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form
          id="add-course-to-class-form"
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs"
        >
          {/* Section 1: Target Class Selector */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex flex-col gap-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-slate-500" />
                <span className="font-bold text-slate-800">Lớp học nhận môn:</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  required
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value.toUpperCase())}
                  placeholder="Nhập mã lớp..."
                  className="py-1.5 px-3 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 uppercase tracking-wide"
                />
                {availableClasses.length > 0 && (
                  <select
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className="py-1.5 px-2.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-700 font-semibold focus:outline-none cursor-pointer"
                  >
                    <option value="">-- Chọn lớp mẫu --</option>
                    {availableClasses.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name} {c.studentCount ? `(${c.studentCount} SV)` : ''}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {/* Quick Family Subgroup Chips */}
            {relatedFamily && (
              <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-slate-200/80">
                <span className="text-[11px] font-semibold text-purple-900">Gán cho:</span>
                <button
                  type="button"
                  onClick={() => setSelectedClass(relatedFamily.parentName)}
                  className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer ${
                    selectedClass.toUpperCase() === relatedFamily.parentName.toUpperCase()
                      ? 'bg-purple-700 text-white shadow-xs'
                      : 'bg-white border border-purple-200 text-purple-700 hover:bg-purple-100'
                  }`}
                >
                  🏫 Cả lớp chung ({relatedFamily.parentName})
                </button>
                {relatedFamily.subgroups.map((sg, idx) => (
                  <button
                    key={sg}
                    type="button"
                    onClick={() => setSelectedClass(sg)}
                    className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer ${
                      selectedClass.toUpperCase() === sg.toUpperCase()
                        ? 'bg-purple-700 text-white shadow-xs'
                        : 'bg-white border border-purple-200 text-purple-700 hover:bg-purple-100'
                    }`}
                  >
                    👥 Nhóm {idx + 1} ({sg})
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Section 2: Subject Selector */}
          <div className="bg-emerald-50/50 p-3.5 rounded-xl border border-emerald-200/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="font-bold text-emerald-950 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>1. Chọn Môn Học từ Danh Mục hoặc Tùy Biến:</span>
              </label>
              <span className="text-[11px] text-emerald-700 font-semibold">Tự điền số tiết chuẩn</span>
            </div>

            <select
              value={selectedSubjectId}
              onChange={(e) => handleSelectMasterSubject(e.target.value)}
              className="w-full py-2 px-3 bg-white border border-emerald-300 rounded-lg text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              {sortedMasterSubjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.theoryHours} LT + {s.practiceHours} TH = {s.theoryHours + s.practiceHours} tiết, {s.credits} TC)
                </option>
              ))}
              <option value="custom">✏️ Nhập tên môn học tùy biến khác...</option>
            </select>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 pt-1">
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Tên Môn Học *
                </label>
                <input
                  type="text"
                  required
                  value={subjectName}
                  onChange={(e) => setSubjectName(e.target.value)}
                  placeholder="VD: Lập trình Web..."
                  className="w-full py-1.5 px-3 bg-white border border-slate-300 rounded-lg text-slate-900 font-bold focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Mã Môn</label>
                <input
                  type="text"
                  value={subjectCode}
                  onChange={(e) => setSubjectCode(e.target.value.toUpperCase())}
                  placeholder="VD: WEB101"
                  className="w-full py-1.5 px-3 bg-white border border-slate-300 rounded-lg font-mono uppercase text-slate-800 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Số Tín Chỉ</label>
                <input
                  type="number"
                  min={1}
                  max={15}
                  value={credits}
                  onChange={(e) => setCredits(Number(e.target.value))}
                  className="w-full py-1.5 px-3 bg-white border border-slate-300 rounded-lg text-slate-800 font-bold focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Hours */}
            <div className="grid grid-cols-3 gap-2.5 pt-1">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Tiết Lý Thuyết (LT)
                </label>
                <input
                  type="number"
                  min={0}
                  step="any"
                  value={theoryHours}
                  onChange={(e) => setTheoryHours(Number(e.target.value) || 0)}
                  className="w-full py-1.5 px-3 bg-white border border-slate-300 rounded-lg font-bold text-slate-800 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Tiết Thực Hành (TH)
                </label>
                <input
                  type="number"
                  min={0}
                  step="any"
                  value={practiceHours}
                  onChange={(e) => setPracticeHours(Number(e.target.value) || 0)}
                  className="w-full py-1.5 px-3 bg-white border border-slate-300 rounded-lg font-bold text-slate-800 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Tổng Tiết
                </label>
                <div className="py-1.5 px-3 bg-emerald-100/90 border border-emerald-300 rounded-lg font-black text-emerald-900 text-center">
                  {totalCourseHours} tiết
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Teacher In Charge (The core requested feature!) */}
          <div className="bg-sky-50/60 p-3.5 rounded-xl border border-sky-200/90 space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-bold text-sky-950 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-sky-600" />
                <span>2. Phân Công Giảng Viên Phụ Trách:</span>
              </label>

              {/* Mode Selector Tabs */}
              <div className="flex items-center bg-white p-0.5 rounded-lg border border-sky-200 text-[11px] font-semibold">
                <button
                  type="button"
                  onClick={() => setTeacherMode('existing')}
                  className={`px-2 py-1 rounded transition-colors cursor-pointer ${
                    teacherMode === 'existing'
                      ? 'bg-sky-600 text-white font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  GV Trong Kỳ ({teachersInSemester.length})
                </button>
                <button
                  type="button"
                  onClick={() => setTeacherMode('master')}
                  className={`px-2 py-1 rounded transition-colors cursor-pointer ${
                    teacherMode === 'master'
                      ? 'bg-sky-600 text-white font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Từ Danh Mục ({masterTeachers.length})
                </button>
                <button
                  type="button"
                  onClick={() => setTeacherMode('new')}
                  className={`px-2 py-1 rounded transition-colors cursor-pointer ${
                    teacherMode === 'new'
                      ? 'bg-sky-600 text-white font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  + Thêm Mới
                </button>
              </div>
            </div>

            {/* Mode 1: Existing Teachers already in activeSemester */}
            {teacherMode === 'existing' && (
              <div>
                {teachersInSemester.length === 0 ? (
                  <div className="p-3 bg-white rounded-lg border border-sky-200 text-slate-500 text-center">
                    Học kỳ này chưa có giảng viên nào.{' '}
                    <button
                      type="button"
                      onClick={() => setTeacherMode('master')}
                      className="text-sky-700 underline font-bold"
                    >
                      Bấm vào đây để chọn từ Danh mục GV
                    </button>
                  </div>
                ) : (
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Chọn Giảng viên có sẵn trong kỳ này:
                    </label>
                    <select
                      value={selectedExistingTeacherId}
                      onChange={(e) => setSelectedExistingTeacherId(e.target.value)}
                      className="w-full py-2 px-3 bg-white border border-sky-300 rounded-lg text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                    >
                      {teachersInSemester.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} · {t.position || 'Cơ hữu'} ({t.courses?.length || 0} môn đang dạy)
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}

            {/* Mode 2: Master Teachers from Catalog */}
            {teacherMode === 'master' && (
              <div>
                {masterTeachers.length === 0 ? (
                  <div className="p-3 bg-white rounded-lg border border-sky-200 text-slate-500 text-center">
                    Danh mục trường chưa có GV.{' '}
                    <button
                      type="button"
                      onClick={() => setTeacherMode('new')}
                      className="text-sky-700 underline font-bold"
                    >
                      Nhập nhanh GV mới tại đây
                    </button>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Chọn Giảng viên từ Danh mục Trường (Tự động đưa vào kỳ):
                    </label>
                    <select
                      value={selectedMasterTeacherId}
                      onChange={(e) => setSelectedMasterTeacherId(e.target.value)}
                      className="w-full py-2 px-3 bg-white border border-sky-300 rounded-lg text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                    >
                      {masterTeachers.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} · {t.position || 'Cơ hữu'} {t.department ? `(${t.department})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}

            {/* Mode 3: Add Fresh New Teacher right here */}
            {teacherMode === 'new' && (
              <div className="bg-white p-3 rounded-lg border border-sky-200 space-y-2.5">
                <div className="font-semibold text-sky-900 text-xs flex items-center gap-1">
                  <UserPlus className="w-3.5 h-3.5 text-sky-600" />
                  <span>Nhập thông tin Giảng viên mới phụ trách môn này:</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Họ và Tên Giảng Viên *
                    </label>
                    <input
                      type="text"
                      required={teacherMode === 'new'}
                      value={newTeacherName}
                      onChange={(e) => setNewTeacherName(e.target.value)}
                      placeholder="VD: ThS. Nguyễn Văn A..."
                      className="w-full py-1.5 px-3 border border-slate-300 rounded-lg text-slate-900 font-bold focus:border-sky-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Chức Vụ / Hợp Đồng *
                    </label>
                    <select
                      value={newTeacherPosition}
                      onChange={(e) => setNewTeacherPosition(e.target.value)}
                      className="w-full py-1.5 px-3 border border-slate-300 rounded-lg text-slate-900 font-semibold focus:border-sky-500 focus:outline-none cursor-pointer"
                    >
                      <option value="Cơ hữu">Cơ hữu</option>
                      <option value="Thỉnh giảng">Thỉnh giảng</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Số Điện Thoại
                    </label>
                    <input
                      type="text"
                      value={newTeacherPhone}
                      onChange={(e) => setNewTeacherPhone(e.target.value)}
                      placeholder="VD: 0901234567..."
                      className="w-full py-1.5 px-3 border border-slate-300 rounded-lg text-slate-800 focus:border-sky-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={newTeacherEmail}
                      onChange={(e) => setNewTeacherEmail(e.target.value)}
                      placeholder="VD: giaovien@edu.vn..."
                      className="w-full py-1.5 px-3 border border-slate-300 rounded-lg text-slate-800 focus:border-sky-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 4: Schedule Picker (Slots, Start Date, Session Pauses) */}
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
                <span className="font-bold text-amber-950 text-xs flex items-center gap-1.5">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500 drop-shadow-[0_0_4px_rgba(245,158,11,0.7)] animate-pulse" />
                  <span>Dồn số tiết lẻ vào buổi cuối cùng (Biểu đồ Gantt)</span>
                </span>
                <span className="text-[11px] text-amber-800 leading-tight block mt-0.5">
                  Ví dụ tổng {totalCourseHours} tiết (mỗi buổi {hoursPerSession} tiết) thì gom số tiết dư vào buổi cuối cùng thay vì tách thêm buổi riêng.
                </span>
              </div>
            </label>
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

        {/* Footer Actions */}
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
            form="add-course-to-class-form"
            className="px-5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm Môn Vào Lớp Này</span>
          </button>
        </div>
      </div>
    </div>
  );
};
