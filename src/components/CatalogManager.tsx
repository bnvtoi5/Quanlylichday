import React, { useMemo, useState } from 'react';
import {
  ArrowDownAZ,
  ArrowUpDown,
  ArrowUpZA,
  BookOpen,
  CalendarPlus,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  Edit2,
  GraduationCap,
  Plus,
  RotateCcw,
  Search,
  Sparkles,
  Trash2,
  Users,
} from 'lucide-react';
import { MasterClass, MasterSubject, MasterTeacher, TeacherPosition } from '../types';
import { ConfirmModal } from './ConfirmModal';

interface CatalogManagerProps {
  masterSubjects: MasterSubject[];
  masterClasses: MasterClass[];
  masterTeachers: MasterTeacher[];
  onAddSubject: (subject: Omit<MasterSubject, 'id'>) => void;
  onUpdateSubject: (subject: MasterSubject) => void;
  onDeleteSubject: (subjectId: string) => void;
  onAddClass: (newClass: Omit<MasterClass, 'id'>) => void;
  onUpdateClass: (updatedClass: MasterClass) => void;
  onDeleteClass: (classId: string) => void;
  onAddMasterTeacher: (teacher: Omit<MasterTeacher, 'id'>) => void;
  onUpdateMasterTeacher: (teacher: MasterTeacher) => void;
  onDeleteMasterTeacher: (teacherId: string) => void;
  onAddMasterTeacherToSemester?: (teacher: MasterTeacher) => void;
  onReorderSubjects?: (sortedSubjects: MasterSubject[]) => void;
  onAutoScanClassParents?: () => void;
}

export const CatalogManager: React.FC<CatalogManagerProps> = ({
  masterSubjects,
  masterClasses,
  masterTeachers,
  onAddSubject,
  onUpdateSubject,
  onDeleteSubject,
  onAddClass,
  onUpdateClass,
  onDeleteClass,
  onAddMasterTeacher,
  onUpdateMasterTeacher,
  onDeleteMasterTeacher,
  onAddMasterTeacherToSemester,
  onReorderSubjects,
  onAutoScanClassParents,
}) => {
  const [activeTab, setActiveTab] = useState<'teachers' | 'subjects' | 'classes'>('teachers');

  // Subjects Sorting & Search State
  type SubjectSortField = 'name' | 'code' | 'theoryHours' | 'practiceHours' | 'totalHours' | 'credits';
  const [subjectSearch, setSubjectSearch] = useState('');
  const [subjectSortField, setSubjectSortField] = useState<SubjectSortField>('name');
  const [subjectSortDirection, setSubjectSortDirection] = useState<'asc' | 'desc'>('asc');
  const [isSavedRecently, setIsSavedRecently] = useState(false);

  // Confirm delete modal state
  const [deleteConfirm, setDeleteConfirm] = useState<{
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

  // Teacher Form State
  const [editingTeacher, setEditingTeacher] = useState<MasterTeacher | null>(null);
  const [showTeacherModal, setShowTeacherModal] = useState(false);
  const [teacherName, setTeacherName] = useState('');
  const [teacherCode, setTeacherCode] = useState('');
  const [teacherPosition, setTeacherPosition] = useState<TeacherPosition>('Cơ hữu');
  const [teacherDept, setTeacherDept] = useState('Khoa Công Nghệ');
  const [teacherEmail, setTeacherEmail] = useState('');
  const [teacherPhone, setTeacherPhone] = useState('');

  // Subject Form State
  const [editingSubject, setEditingSubject] = useState<MasterSubject | null>(null);
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [subjName, setSubjName] = useState('');
  const [subjCode, setSubjCode] = useState('');
  const [subjLT, setSubjLT] = useState(30);
  const [subjTH, setSubjTH] = useState(30);
  const [subjCredits, setSubjCredits] = useState(3);
  const [subjDept, setSubjDept] = useState('Khoa Công Nghệ');

  // Class Form State
  const [editingClass, setEditingClass] = useState<MasterClass | null>(null);
  const [showClassModal, setShowClassModal] = useState(false);
  const [className, setClassName] = useState('');
  const [classMajor, setClassMajor] = useState('Công nghệ Thông tin');
  const [classStudents, setClassStudents] = useState(45);
  const [classYear, setClassYear] = useState('2023-2027');
  const [classIsParent, setClassIsParent] = useState(false);
  const [classSubgroups, setClassSubgroups] = useState('');
  const [classParentName, setClassParentName] = useState('');

  // Teacher Handlers
  const openNewTeacherModal = () => {
    setEditingTeacher(null);
    setTeacherName('');
    setTeacherCode(`GV${Math.floor(100 + Math.random() * 900)}`);
    setTeacherPosition('Cơ hữu');
    setTeacherDept('Khoa Công Nghệ');
    setTeacherEmail('');
    setTeacherPhone('');
    setShowTeacherModal(true);
  };

  const openEditTeacherModal = (t: MasterTeacher) => {
    setEditingTeacher(t);
    setTeacherName(t.name);
    setTeacherCode(t.code || '');
    setTeacherPosition(t.position);
    setTeacherDept(t.department || 'Khoa Công Nghệ');
    setTeacherEmail(t.email || '');
    setTeacherPhone(t.phone || '');
    setShowTeacherModal(true);
  };

  const handleSaveTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacherName.trim()) return;

    if (editingTeacher) {
      onUpdateMasterTeacher({
        ...editingTeacher,
        name: teacherName.trim(),
        code: teacherCode.trim().toUpperCase(),
        position: teacherPosition,
        department: teacherDept.trim(),
        email: teacherEmail.trim(),
        phone: teacherPhone.trim(),
      });
    } else {
      onAddMasterTeacher({
        name: teacherName.trim(),
        code: teacherCode.trim().toUpperCase(),
        position: teacherPosition,
        department: teacherDept.trim(),
        email: teacherEmail.trim(),
        phone: teacherPhone.trim(),
      });
    }
    setShowTeacherModal(false);
  };

  // Subject Handlers
  const openNewSubjectModal = () => {
    setEditingSubject(null);
    setSubjName('');
    setSubjCode('');
    setSubjLT(30);
    setSubjTH(30);
    setSubjCredits(3);
    setSubjDept('Khoa Công Nghệ');
    setShowSubjectModal(true);
  };

  const openEditSubjectModal = (subj: MasterSubject) => {
    setEditingSubject(subj);
    setSubjName(subj.name);
    setSubjCode(subj.code);
    setSubjLT(subj.theoryHours);
    setSubjTH(subj.practiceHours);
    setSubjCredits(subj.credits);
    setSubjDept(subj.department || 'Khoa Công Nghệ');
    setShowSubjectModal(true);
  };

  const handleSaveSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjName.trim()) return;

    if (editingSubject) {
      onUpdateSubject({
        ...editingSubject,
        name: subjName.trim(),
        code: subjCode.trim().toUpperCase(),
        theoryHours: Number(subjLT) || 0,
        practiceHours: Number(subjTH) || 0,
        credits: Number(subjCredits) || 1,
        department: subjDept.trim(),
      });
    } else {
      onAddSubject({
        name: subjName.trim(),
        code: subjCode.trim().toUpperCase() || `SUBJ${Date.now().toString().slice(-4)}`,
        theoryHours: Number(subjLT) || 0,
        practiceHours: Number(subjTH) || 0,
        credits: Number(subjCredits) || 1,
        department: subjDept.trim(),
      });
    }
    setShowSubjectModal(false);
  };

  // Class Handlers
  const openNewClassModal = () => {
    setEditingClass(null);
    setClassName('');
    setClassMajor('Công nghệ Thông tin');
    setClassStudents(45);
    setClassYear('2023-2027');
    setClassIsParent(false);
    setClassSubgroups('');
    setClassParentName('');
    setShowClassModal(true);
  };

  const openEditClassModal = (cls: MasterClass) => {
    setEditingClass(cls);
    setClassName(cls.name);
    setClassMajor(cls.major || 'Công nghệ Thông tin');
    setClassStudents(cls.studentCount || 45);
    setClassYear(cls.academicYear || '2023-2027');
    setClassIsParent(Boolean(cls.isParent));
    setClassSubgroups((cls.subgroups || []).join(', '));
    setClassParentName(cls.parentClassName || '');
    setShowClassModal(true);
  };

  const handleSaveClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!className.trim()) return;

    const trimmedName = className.trim().toUpperCase();
    const subgroupsArr = classIsParent
      ? classSubgroups
          .split(',')
          .map((s) => s.trim().toUpperCase())
          .filter(Boolean)
      : undefined;

    const parentNameVal = !classIsParent && classParentName.trim()
      ? classParentName.trim().toUpperCase()
      : undefined;

    if (editingClass) {
      onUpdateClass({
        ...editingClass,
        name: trimmedName,
        major: classMajor.trim(),
        studentCount: Number(classStudents) || 0,
        academicYear: classYear.trim(),
        isParent: classIsParent,
        subgroups: subgroupsArr,
        parentClassName: parentNameVal,
      });
    } else {
      onAddClass({
        name: trimmedName,
        major: classMajor.trim(),
        studentCount: Number(classStudents) || 0,
        academicYear: classYear.trim(),
        isParent: classIsParent,
        subgroups: subgroupsArr,
        parentClassName: parentNameVal,
      });
    }
    setShowClassModal(false);
  };

  // ----------------------------------------------------
  // Subject Sorting & Filtering Engine
  // ----------------------------------------------------
  const filteredAndSortedSubjects = useMemo(() => {
    let list = [...masterSubjects];

    // Filter by search
    if (subjectSearch.trim()) {
      const q = subjectSearch.toLowerCase().trim();
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          (s.code && s.code.toLowerCase().includes(q)) ||
          (s.department && s.department.toLowerCase().includes(q))
      );
    }

    // Sort
    list.sort((a, b) => {
      let cmp = 0;
      if (subjectSortField === 'name') {
        cmp = a.name.localeCompare(b.name, 'vi', { sensitivity: 'base' });
      } else if (subjectSortField === 'code') {
        cmp = (a.code || '').localeCompare(b.code || '', 'vi');
      } else if (subjectSortField === 'totalHours') {
        const totA = (a.theoryHours || 0) + (a.practiceHours || 0);
        const totB = (b.theoryHours || 0) + (b.practiceHours || 0);
        cmp = totA - totB;
      } else if (subjectSortField === 'credits') {
        cmp = (a.credits || 0) - (b.credits || 0);
      } else if (subjectSortField === 'theoryHours') {
        cmp = (a.theoryHours || 0) - (b.theoryHours || 0);
      } else if (subjectSortField === 'practiceHours') {
        cmp = (a.practiceHours || 0) - (b.practiceHours || 0);
      }

      return subjectSortDirection === 'asc' ? cmp : -cmp;
    });

    return list;
  }, [masterSubjects, subjectSearch, subjectSortField, subjectSortDirection]);

  const handleToggleSortField = (field: SubjectSortField) => {
    if (subjectSortField === field) {
      setSubjectSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSubjectSortField(field);
      setSubjectSortDirection('asc');
    }
  };

  const handleSortAlphabeticallyAndSave = () => {
    const sorted = [...masterSubjects].sort((a, b) =>
      a.name.localeCompare(b.name, 'vi', { sensitivity: 'base' })
    );
    setSubjectSortField('name');
    setSubjectSortDirection('asc');
    if (onReorderSubjects) {
      onReorderSubjects(sorted);
      setIsSavedRecently(true);
      setTimeout(() => setIsSavedRecently(false), 2500);
    }
  };

  const handleSaveCurrentSortAsDefault = () => {
    const fullSorted = [...masterSubjects].sort((a, b) => {
      let cmp = 0;
      if (subjectSortField === 'name') {
        cmp = a.name.localeCompare(b.name, 'vi', { sensitivity: 'base' });
      } else if (subjectSortField === 'code') {
        cmp = (a.code || '').localeCompare(b.code || '', 'vi');
      } else if (subjectSortField === 'totalHours') {
        const totA = (a.theoryHours || 0) + (a.practiceHours || 0);
        const totB = (b.theoryHours || 0) + (b.practiceHours || 0);
        cmp = totA - totB;
      } else if (subjectSortField === 'credits') {
        cmp = (a.credits || 0) - (b.credits || 0);
      } else if (subjectSortField === 'theoryHours') {
        cmp = (a.theoryHours || 0) - (b.theoryHours || 0);
      } else if (subjectSortField === 'practiceHours') {
        cmp = (a.practiceHours || 0) - (b.practiceHours || 0);
      }
      return subjectSortDirection === 'asc' ? cmp : -cmp;
    });

    if (onReorderSubjects) {
      onReorderSubjects(fullSorted);
      setIsSavedRecently(true);
      setTimeout(() => setIsSavedRecently(false), 2500);
    }
  };

  const handleMoveSubject = (subjectId: string, direction: 'up' | 'down') => {
    const idx = masterSubjects.findIndex((s) => s.id === subjectId);
    if (idx === -1) return;
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= masterSubjects.length) return;

    const newList = [...masterSubjects];
    const temp = newList[idx];
    newList[idx] = newList[targetIdx];
    newList[targetIdx] = temp;

    if (onReorderSubjects) {
      onReorderSubjects(newList);
    }
  };

  return (
    <div className="space-y-6">
      {/* Intro info box */}
      <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4 flex items-start gap-3">
        <Sparkles className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
        <div className="text-xs text-emerald-900 leading-relaxed">
          <strong>Quản Lý Dữ Liệu Dùng Chung:</strong> Quản lý danh sách{' '}
          <strong>Giảng viên</strong>, <strong>Môn học</strong> và <strong>Lớp học</strong> có sẵn.
          Khi phân công giảng dạy trong từng học kỳ, bạn chỉ cần chọn nhanh từ danh mục thả xuống (dropdown) mà không cần nhập lại từ đầu.
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          {/* Tab 1: Quản lý Giảng viên */}
          <button
            onClick={() => setActiveTab('teachers')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg flex items-center gap-2 transition-colors cursor-pointer ${
              activeTab === 'teachers'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Users className="w-4 h-4 text-emerald-400" />
            <span>Quản Lý Giảng Viên ({masterTeachers.length})</span>
          </button>

          {/* Tab 2: Quản lý Môn học */}
          <button
            onClick={() => setActiveTab('subjects')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg flex items-center gap-2 transition-colors cursor-pointer ${
              activeTab === 'subjects'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <BookOpen className="w-4 h-4 text-sky-400" />
            <span>Quản Lý Môn Học ({masterSubjects.length})</span>
          </button>

          {/* Tab 3: Quản lý Lớp học */}
          <button
            onClick={() => setActiveTab('classes')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg flex items-center gap-2 transition-colors cursor-pointer ${
              activeTab === 'classes'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <GraduationCap className="w-4 h-4 text-indigo-400" />
            <span>Quản Lý Lớp Học ({masterClasses.length})</span>
          </button>
        </div>

        <div>
          {activeTab === 'teachers' ? (
            <button
              onClick={openNewTeacherModal}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm Giảng Viên Mới</span>
            </button>
          ) : activeTab === 'subjects' ? (
            <button
              onClick={openNewSubjectModal}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm Môn Học Mới</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              {onAutoScanClassParents && (
                <button
                  type="button"
                  onClick={onAutoScanClassParents}
                  className="px-3 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                  title="Quét toàn bộ hệ thống để tự động gom và tạo lớp mẹ cho các nhóm con (VD: CNTT24TH1, CNTT24TH2 -> CNTT24TH)"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Quét & Gom Lớp Mẹ</span>
                </button>
              )}
              <button
                onClick={openNewClassModal}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Thêm Lớp Mới</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Teachers Content */}
      {activeTab === 'teachers' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          {masterTeachers.length === 0 ? (
            <div className="p-12 text-center text-slate-500 space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                <Users className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-slate-700 text-sm">Chưa có giảng viên trong danh mục quản lý</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Bấm nút "Thêm Giảng Viên Mới" để tạo hồ sơ giảng viên dùng chung cho các học kỳ.
              </p>
              <button
                onClick={openNewTeacherModal}
                className="mt-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Thêm Giảng Viên Đầu Tiên</span>
              </button>
            </div>
          ) : (
            <table className="w-full text-left text-xs divide-y divide-slate-200">
              <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Mã GV</th>
                  <th className="py-3 px-4">Họ và Tên</th>
                  <th className="py-3 px-4">Chức Vụ</th>
                  <th className="py-3 px-4">Khoa / Bộ Môn</th>
                  <th className="py-3 px-4">Email / SĐT</th>
                  <th className="py-3 px-4 text-center">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {masterTeachers.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 font-mono font-bold text-slate-800">{t.code || '-'}</td>
                    <td className="py-3 px-4 font-bold text-slate-900 text-sm">{t.name}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded font-semibold text-[11px] ${
                          t.position?.includes('Cơ hữu')
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {t.position}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{t.department || '-'}</td>
                    <td className="py-3 px-4 text-slate-500">
                      <div>{t.email || '-'}</div>
                      {t.phone && <div className="text-[11px] text-slate-400">{t.phone}</div>}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {onAddMasterTeacherToSemester && (
                          <button
                            onClick={() => onAddMasterTeacherToSemester(t)}
                            className="px-2 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                            title="Đưa giảng viên này vào học kỳ đang chọn"
                          >
                            <CalendarPlus className="w-3.5 h-3.5" />
                            <span>Vào kỳ</span>
                          </button>
                        )}
                        <button
                          onClick={() => openEditTeacherModal(t)}
                          className="p-1 text-slate-400 hover:text-emerald-600 rounded cursor-pointer"
                          title="Chỉnh sửa GV"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setDeleteConfirm({
                              isOpen: true,
                              title: `Xóa Giảng Viên "${t.name}"?`,
                              message: 'Bạn có chắc chắn muốn xóa giảng viên này khỏi danh mục quản lý?',
                              onConfirm: () => onDeleteMasterTeacher(t.id),
                            });
                          }}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                          title="Xóa GV"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Subjects Content */}
      {activeTab === 'subjects' && (
        <div className="space-y-3">
          {/* Sorting & Search Control Bar */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={subjectSearch}
                onChange={(e) => setSubjectSearch(e.target.value)}
                placeholder="Tìm kiếm môn học theo tên, mã môn, khoa..."
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
              {subjectSearch && (
                <button
                  onClick={() => setSubjectSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs cursor-pointer p-0.5"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Quick Sort Actions */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={handleSortAlphabeticallyAndSave}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                title="Sắp xếp toàn bộ môn học từ A đến Z theo chuẩn tiếng Việt và lưu làm thứ tự mặc định"
              >
                <ArrowDownAZ className="w-4 h-4" />
                <span>Sắp xếp A → Z & Lưu</span>
              </button>

              <button
                type="button"
                onClick={handleSaveCurrentSortAsDefault}
                disabled={isSavedRecently}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-60"
                title="Lưu thứ tự đang hiển thị làm danh sách mặc định cho các menu chọn môn"
              >
                {isSavedRecently ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700 font-bold">Đã lưu thứ tự!</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5 text-slate-500" />
                    <span>Lưu thứ tự này</span>
                  </>
                )}
              </button>

              {/* Reset to ID order or Z-A */}
              <button
                type="button"
                onClick={() => {
                  if (subjectSortField === 'name' && subjectSortDirection === 'asc') {
                    setSubjectSortDirection('desc');
                  } else {
                    setSubjectSortField('name');
                    setSubjectSortDirection('asc');
                  }
                }}
                className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
                title="Đổi chiều A-Z / Z-A"
              >
                {subjectSortField === 'name' && subjectSortDirection === 'asc' ? (
                  <>
                    <ArrowDownAZ className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="hidden sm:inline">A → Z</span>
                  </>
                ) : subjectSortField === 'name' && subjectSortDirection === 'desc' ? (
                  <>
                    <ArrowUpZA className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="hidden sm:inline">Z → A</span>
                  </>
                ) : (
                  <>
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
                    <span className="hidden sm:inline">Sắp xếp</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Subjects Table */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            {filteredAndSortedSubjects.length === 0 ? (
              <div className="p-12 text-center text-slate-500 space-y-3">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                  <BookOpen className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-slate-700 text-sm">
                  {subjectSearch ? 'Không tìm thấy môn học nào khớp' : 'Chưa có môn học trong danh mục quản lý'}
                </h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  {subjectSearch
                    ? `Không tìm thấy kết quả cho từ khóa "${subjectSearch}". Thử tìm với từ khóa khác.`
                    : 'Tạo môn học kèm số tiết LT, TH và tín chỉ để khi phân công chỉ cần chọn từ danh sách thả xuống.'}
                </p>
                {subjectSearch ? (
                  <button
                    onClick={() => setSubjectSearch('')}
                    className="mt-2 px-3 py-1.5 bg-slate-800 text-white text-xs font-bold rounded-lg inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Xóa bộ lọc tìm kiếm</span>
                  </button>
                ) : (
                  <button
                    onClick={openNewSubjectModal}
                    className="mt-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Thêm Môn Học Đầu Tiên</span>
                  </button>
                )}
              </div>
            ) : (
              <table className="w-full text-left text-xs divide-y divide-slate-200">
                <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-3 text-center w-12 text-slate-400">STT</th>
                    {/* Mã Môn - Click to sort */}
                    <th
                      onClick={() => handleToggleSortField('code')}
                      className="py-3 px-4 cursor-pointer select-none hover:bg-slate-100 transition-colors group"
                      title="Bấm để sắp xếp theo Mã Môn"
                    >
                      <div className="flex items-center gap-1">
                        <span>Mã Môn</span>
                        {subjectSortField === 'code' ? (
                          subjectSortDirection === 'asc' ? (
                            <ArrowDownAZ className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <ArrowUpZA className="w-3.5 h-3.5 text-emerald-600" />
                          )
                        ) : (
                          <ArrowUpDown className="w-3 h-3 text-slate-300 group-hover:text-slate-500" />
                        )}
                      </div>
                    </th>

                    {/* Tên Môn Học - Click to sort */}
                    <th
                      onClick={() => handleToggleSortField('name')}
                      className="py-3 px-4 cursor-pointer select-none hover:bg-slate-100 transition-colors group"
                      title="Bấm để sắp xếp theo Tên Môn Học (A-Z)"
                    >
                      <div className="flex items-center gap-1">
                        <span className="text-slate-900 font-bold">Tên Môn Học</span>
                        {subjectSortField === 'name' ? (
                          subjectSortDirection === 'asc' ? (
                            <ArrowDownAZ className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <ArrowUpZA className="w-4 h-4 text-emerald-600" />
                          )
                        ) : (
                          <ArrowUpDown className="w-3 h-3 text-slate-300 group-hover:text-slate-500" />
                        )}
                      </div>
                    </th>

                    {/* Tiết LT */}
                    <th
                      onClick={() => handleToggleSortField('theoryHours')}
                      className="py-3 px-3 text-center cursor-pointer select-none hover:bg-slate-100 transition-colors group"
                      title="Bấm để sắp xếp theo số tiết Lý Thuyết"
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span>Tiết LT</span>
                        {subjectSortField === 'theoryHours' ? (
                          <span className="text-emerald-600 font-bold">
                            {subjectSortDirection === 'asc' ? '▲' : '▼'}
                          </span>
                        ) : (
                          <ArrowUpDown className="w-2.5 h-2.5 text-slate-300 group-hover:text-slate-500" />
                        )}
                      </div>
                    </th>

                    {/* Tiết TH */}
                    <th
                      onClick={() => handleToggleSortField('practiceHours')}
                      className="py-3 px-3 text-center cursor-pointer select-none hover:bg-slate-100 transition-colors group"
                      title="Bấm để sắp xếp theo số tiết Thực Hành"
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span>Tiết TH</span>
                        {subjectSortField === 'practiceHours' ? (
                          <span className="text-emerald-600 font-bold">
                            {subjectSortDirection === 'asc' ? '▲' : '▼'}
                          </span>
                        ) : (
                          <ArrowUpDown className="w-2.5 h-2.5 text-slate-300 group-hover:text-slate-500" />
                        )}
                      </div>
                    </th>

                    {/* Tổng Tiết */}
                    <th
                      onClick={() => handleToggleSortField('totalHours')}
                      className="py-3 px-3 text-center cursor-pointer select-none hover:bg-slate-100 transition-colors group"
                      title="Bấm để sắp xếp theo Tổng Số Tiết"
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span className="text-emerald-800 font-bold">Tổng Tiết</span>
                        {subjectSortField === 'totalHours' ? (
                          <span className="text-emerald-600 font-bold">
                            {subjectSortDirection === 'asc' ? '▲' : '▼'}
                          </span>
                        ) : (
                          <ArrowUpDown className="w-2.5 h-2.5 text-slate-300 group-hover:text-slate-500" />
                        )}
                      </div>
                    </th>

                    {/* Tín Chỉ */}
                    <th
                      onClick={() => handleToggleSortField('credits')}
                      className="py-3 px-3 text-center cursor-pointer select-none hover:bg-slate-100 transition-colors group"
                      title="Bấm để sắp xếp theo Số Tín Chỉ"
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span>Tín Chỉ</span>
                        {subjectSortField === 'credits' ? (
                          <span className="text-emerald-600 font-bold">
                            {subjectSortDirection === 'asc' ? '▲' : '▼'}
                          </span>
                        ) : (
                          <ArrowUpDown className="w-2.5 h-2.5 text-slate-300 group-hover:text-slate-500" />
                        )}
                      </div>
                    </th>

                    <th className="py-3 px-4">Bộ Môn Phụ Trách</th>
                    <th className="py-3 px-4 text-center">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredAndSortedSubjects.map((subj, index) => {
                    const totalHours =
                      Math.round(((subj.theoryHours || 0) + (subj.practiceHours || 0)) * 100) / 100;
                    const canMove = !subjectSearch.trim() && Boolean(onReorderSubjects);

                    return (
                      <tr key={subj.id} className="hover:bg-slate-50/70 group">
                        <td className="py-2.5 px-3 text-center text-slate-400 font-mono text-xs">
                          {index + 1}
                        </td>
                        <td className="py-2.5 px-4 font-mono font-bold text-slate-800">{subj.code}</td>
                        <td className="py-2.5 px-4 font-semibold text-slate-900 text-sm">{subj.name}</td>
                        <td className="py-2.5 px-3 text-center text-slate-600 font-medium">
                          {subj.theoryHours}
                        </td>
                        <td className="py-2.5 px-3 text-center text-slate-600 font-medium">
                          {subj.practiceHours}
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold text-emerald-700">
                          {totalHours}
                        </td>
                        <td className="py-2.5 px-3 text-center font-medium">{subj.credits}</td>
                        <td className="py-2.5 px-4 text-slate-500">{subj.department || '-'}</td>
                        <td className="py-2.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            {/* Manual Move Up / Down (active when not searching) */}
                            {canMove && (
                              <>
                                <button
                                  type="button"
                                  disabled={index === 0}
                                  onClick={() => handleMoveSubject(subj.id, 'up')}
                                  className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20 rounded cursor-pointer disabled:cursor-not-allowed"
                                  title="Đẩy môn này lên trên"
                                >
                                  <ChevronUp className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  disabled={index === filteredAndSortedSubjects.length - 1}
                                  onClick={() => handleMoveSubject(subj.id, 'down')}
                                  className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20 rounded cursor-pointer disabled:cursor-not-allowed"
                                  title="Đẩy môn này xuống dưới"
                                >
                                  <ChevronDown className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}

                            <button
                              onClick={() => openEditSubjectModal(subj)}
                              className="p-1 text-slate-400 hover:text-emerald-600 rounded cursor-pointer"
                              title="Chỉnh sửa môn học"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                setDeleteConfirm({
                                  isOpen: true,
                                  title: `Xóa Môn Học "${subj.name}"?`,
                                  message: 'Bạn có chắc chắn muốn xóa môn này khỏi danh mục quản lý?',
                                  onConfirm: () => onDeleteSubject(subj.id),
                                });
                              }}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                              title="Xóa môn học"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Footer status summary */}
          <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
            <span>
              Hiển thị <strong>{filteredAndSortedSubjects.length}</strong> / {masterSubjects.length} môn học
            </span>
            <span>
              Đang sắp xếp theo:{' '}
              <strong className="text-slate-700">
                {subjectSortField === 'name' && `Tên môn (${subjectSortDirection === 'asc' ? 'A → Z' : 'Z → A'})`}
                {subjectSortField === 'code' && `Mã môn (${subjectSortDirection === 'asc' ? 'A → Z' : 'Z → A'})`}
                {subjectSortField === 'totalHours' &&
                  `Tổng tiết (${subjectSortDirection === 'asc' ? 'Ít → Nhiều' : 'Nhiều → Ít'})`}
                {subjectSortField === 'credits' &&
                  `Tín chỉ (${subjectSortDirection === 'asc' ? 'Ít → Nhiều' : 'Nhiều → Ít'})`}
                {subjectSortField === 'theoryHours' && 'Tiết lý thuyết'}
                {subjectSortField === 'practiceHours' && 'Tiết thực hành'}
              </strong>
            </span>
          </div>
        </div>
      )}

      {/* Classes Content */}
      {activeTab === 'classes' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          {masterClasses.length === 0 ? (
            <div className="p-12 text-center text-slate-500 space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                <GraduationCap className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-slate-700 text-sm">Chưa có lớp học trong danh mục quản lý</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Tạo mã lớp (như CNTT26TH1, QTMT26TH1...) để chọn nhanh khi phân công cho giảng viên.
              </p>
              <button
                onClick={openNewClassModal}
                className="mt-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Thêm Lớp Đầu Tiên</span>
              </button>
            </div>
          ) : (
            <table className="w-full text-left text-xs divide-y divide-slate-200">
              <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Mã / Tên Lớp</th>
                  <th className="py-3 px-4">Ngành / Khoa</th>
                  <th className="py-3 px-3 text-center">Sĩ Số</th>
                  <th className="py-3 px-4">Khóa Học</th>
                  <th className="py-3 px-4 text-center">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {masterClasses.map((cls) => (
                  <tr key={cls.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-slate-900 text-sm">{cls.name}</span>
                        {cls.isParent && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200 flex items-center gap-1">
                            <span>Lớp Mẹ</span>
                            <span className="bg-purple-200/80 px-1 rounded text-[9px]">
                              {cls.subgroups?.length || 0} nhóm
                            </span>
                          </span>
                        )}
                        {cls.parentClassName && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-sky-50 text-sky-700 border border-sky-200">
                            Nhóm của {cls.parentClassName}
                          </span>
                        )}
                        {!cls.isParent && !cls.parentClassName && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-normal bg-slate-100 text-slate-500">
                            Lớp đơn
                          </span>
                        )}
                      </div>
                      {cls.isParent && cls.subgroups && cls.subgroups.length > 0 && (
                        <div className="flex items-center gap-1 mt-1 text-[11px] text-purple-700 font-mono flex-wrap">
                          <span className="text-[10px] text-slate-400 font-sans font-medium">Nhóm con:</span>
                          {cls.subgroups.map((sg) => (
                            <span
                              key={sg}
                              className="bg-purple-50/90 text-purple-800 px-1.5 py-0.2 rounded border border-purple-200 text-[10px] font-bold"
                            >
                              {sg}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-700">{cls.major || '-'}</td>
                    <td className="py-3 px-3 text-center text-slate-600 font-semibold">{cls.studentCount || '-'} SV</td>
                    <td className="py-3 px-4 text-slate-500">{cls.academicYear || '-'}</td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => openEditClassModal(cls)}
                          className="p-1 text-slate-400 hover:text-emerald-600 rounded cursor-pointer"
                          title="Chỉnh sửa lớp"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setDeleteConfirm({
                              isOpen: true,
                              title: `Xóa Lớp "${cls.name}"?`,
                              message: 'Bạn có chắc chắn muốn xóa lớp này khỏi danh mục quản lý?',
                              onConfirm: () => onDeleteClass(cls.id),
                            });
                          }}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                          title="Xóa lớp"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Modal Add/Edit Teacher */}
      {showTeacherModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <h3 className="text-base font-bold text-slate-900 mb-4">
              {editingTeacher ? 'Chỉnh Sửa Giảng Viên' : 'Thêm Giảng Viên Vào Quản Lý Dùng Chung'}
            </h3>

            <form onSubmit={handleSaveTeacher} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Họ và Tên Giảng Viên *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Nguyễn Văn A"
                  value={teacherName}
                  onChange={(e) => setTeacherName(e.target.value)}
                  className="w-full py-2 px-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-slate-900 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Chức Vụ *</label>
                  <select
                    value={teacherPosition}
                    onChange={(e) => setTeacherPosition(e.target.value as TeacherPosition)}
                    className="w-full py-2 px-3 bg-white border border-slate-200 rounded-lg font-semibold text-slate-800 focus:outline-none cursor-pointer"
                  >
                    <option value="Cơ hữu">Cơ hữu (Trường, Trưởng khoa, Hiệu trưởng...)</option>
                    <option value="Thỉnh giảng">Thỉnh giảng (Mời bên ngoài)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Mã GV</label>
                  <input
                    type="text"
                    placeholder="GV001"
                    value={teacherCode}
                    onChange={(e) => setTeacherCode(e.target.value)}
                    className="w-full py-2 px-3 border border-slate-200 rounded-lg font-mono uppercase text-slate-800 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Khoa / Bộ Môn</label>
                <input
                  type="text"
                  placeholder="Hệ thống thông tin, Công nghệ phần mềm..."
                  value={teacherDept}
                  onChange={(e) => setTeacherDept(e.target.value)}
                  className="w-full py-2 px-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="gv@university.edu.vn"
                    value={teacherEmail}
                    onChange={(e) => setTeacherEmail(e.target.value)}
                    className="w-full py-2 px-3 border border-slate-200 rounded-lg outline-none text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Số Điện Thoại</label>
                  <input
                    type="tel"
                    placeholder="0901234567"
                    value={teacherPhone}
                    onChange={(e) => setTeacherPhone(e.target.value)}
                    className="w-full py-2 px-3 border border-slate-200 rounded-lg outline-none text-slate-900"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowTeacherModal(false)}
                  className="px-3.5 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold transition-colors cursor-pointer shadow-xs"
                >
                  {editingTeacher ? 'Lưu Thay Đổi' : 'Thêm Vào Quản Lý'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Add/Edit Subject */}
      {showSubjectModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <h3 className="text-base font-bold text-slate-900 mb-4">
              {editingSubject ? 'Chỉnh Sửa Môn Học' : 'Thêm Môn Học Mới Vào Quản Lý'}
            </h3>

            <form onSubmit={handleSaveSubject} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tên Môn Học *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Cơ sở dữ liệu, Tin học cơ bản..."
                  value={subjName}
                  onChange={(e) => setSubjName(e.target.value)}
                  className="w-full py-2 px-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-slate-900 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Mã Môn</label>
                  <input
                    type="text"
                    placeholder="CSDL01"
                    value={subjCode}
                    onChange={(e) => setSubjCode(e.target.value)}
                    className="w-full py-2 px-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-slate-900 uppercase font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Số Tín Chỉ</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={subjCredits}
                    onChange={(e) => setSubjCredits(Number(e.target.value))}
                    className="w-full py-2 px-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tiết LT (Lý thuyết)</label>
                  <input
                    type="number"
                    min={0}
                    step="any"
                    placeholder="30 hoặc 67.5"
                    value={subjLT}
                    onChange={(e) => setSubjLT(e.target.value === '' ? ('' as any) : Number(e.target.value))}
                    className="w-full py-2 px-3 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-slate-900 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tiết TH (Thực hành)</label>
                  <input
                    type="number"
                    min={0}
                    step="any"
                    placeholder="30 hoặc 22.5"
                    value={subjTH}
                    onChange={(e) => setSubjTH(e.target.value === '' ? ('' as any) : Number(e.target.value))}
                    className="w-full py-2 px-3 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-slate-900 font-bold"
                  />
                </div>
                <div className="col-span-2 text-[11px] text-slate-500 flex justify-between">
                  <span>
                    Tổng số tiết: <strong>{Math.round((Number(subjLT || 0) + Number(subjTH || 0)) * 100) / 100}</strong> tiết
                  </span>
                  <span>(Tự động điền khi gán môn)</span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Bộ Môn Quản Lý</label>
                <input
                  type="text"
                  placeholder="Hệ thống thông tin, Công nghệ phần mềm..."
                  value={subjDept}
                  onChange={(e) => setSubjDept(e.target.value)}
                  className="w-full py-2 px-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-slate-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowSubjectModal(false)}
                  className="px-3.5 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold transition-colors cursor-pointer shadow-xs"
                >
                  {editingSubject ? 'Lưu Thay Đổi' : 'Thêm Vào Quản Lý'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Add/Edit Class */}
      {showClassModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <h3 className="text-base font-bold text-slate-900 mb-4">
              {editingClass ? 'Chỉnh Sửa Lớp' : 'Thêm Lớp Mới Vào Quản Lý'}
            </h3>

            <form onSubmit={handleSaveClass} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Mã Lớp / Tên Lớp *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: CNTT26TH1, CNTT26TH2, QTMT26TH1..."
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  className="w-full py-2 px-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-slate-900 uppercase font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Ngành Học / Khoa</label>
                <input
                  type="text"
                  placeholder="Công nghệ Thông tin, Quản trị Mạng..."
                  value={classMajor}
                  onChange={(e) => setClassMajor(e.target.value)}
                  className="w-full py-2 px-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Sĩ Số (Sinh viên)</label>
                  <input
                    type="number"
                    min={1}
                    max={200}
                    value={classStudents}
                    onChange={(e) => setClassStudents(Number(e.target.value))}
                    className="w-full py-2 px-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Khóa Học / Niên Khóa</label>
                  <input
                    type="text"
                    placeholder="2023-2027"
                    value={classYear}
                    onChange={(e) => setClassYear(e.target.value)}
                    className="w-full py-2 px-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-slate-900"
                  />
                </div>
              </div>

              {/* Lớp Mẹ & Nhóm Con Settings */}
              <div className="bg-purple-50/60 p-3 rounded-xl border border-purple-200/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-purple-950">
                    <input
                      type="checkbox"
                      checked={classIsParent}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setClassIsParent(checked);
                        if (checked) {
                          setClassParentName('');
                          if (!classSubgroups.trim() && className.trim()) {
                            setClassSubgroups(`${className.trim().toUpperCase()}1, ${className.trim().toUpperCase()}2`);
                          }
                        }
                      }}
                      className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 border-slate-300 cursor-pointer"
                    />
                    <span>Đây là Lớp Mẹ (Lớp lớn có chia nhóm con)</span>
                  </label>
                </div>

                {classIsParent ? (
                  <div className="space-y-2 pl-6 pt-1 border-t border-purple-200/60">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-purple-900">
                        Danh sách các nhóm con (Thực hành / Phân tổ):
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            const base = className.trim().toUpperCase() || 'LOP';
                            setClassSubgroups(`${base}1, ${base}2`);
                          }}
                          className="px-1.5 py-0.5 bg-white border border-purple-200 hover:border-purple-400 text-purple-700 rounded text-[10px] font-bold cursor-pointer transition-colors"
                        >
                          + 2 nhóm
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const base = className.trim().toUpperCase() || 'LOP';
                            setClassSubgroups(`${base}1, ${base}2, ${base}3`);
                          }}
                          className="px-1.5 py-0.5 bg-white border border-purple-200 hover:border-purple-400 text-purple-700 rounded text-[10px] font-bold cursor-pointer transition-colors"
                        >
                          + 3 nhóm
                        </button>
                      </div>
                    </div>
                    <input
                      type="text"
                      placeholder="Ví dụ: CNTT24TH1, CNTT24TH2 (ngăn cách bằng dấu phẩy)"
                      value={classSubgroups}
                      onChange={(e) => setClassSubgroups(e.target.value)}
                      className="w-full py-1.5 px-3 bg-white border border-purple-300 rounded-lg text-xs font-mono font-bold text-purple-950 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none uppercase"
                    />
                    <p className="text-[10px] text-purple-700 leading-tight">
                      Khi xếp môn, môn Lý thuyết có thể xếp vào <strong>{className || 'Lớp Mẹ'}</strong>, còn môn Thực hành xếp vào từng nhóm con tương ứng.
                    </p>
                  </div>
                ) : (
                  <div className="pl-6 space-y-1.5">
                    <label className="block text-[11px] font-semibold text-slate-600">
                      Thuộc Lớp Mẹ (Nếu đây là nhóm con của một lớp lớn):
                    </label>
                    <select
                      value={classParentName}
                      onChange={(e) => setClassParentName(e.target.value)}
                      className="w-full py-1.5 px-2.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 cursor-pointer"
                    >
                      <option value="">-- Lớp độc lập (Không chia nhóm) --</option>
                      {masterClasses
                        .filter((c) => c.name !== className && (c.isParent || (c.subgroups && c.subgroups.length > 0)))
                        .map((c) => (
                          <option key={c.id} value={c.name}>
                            {c.name} {c.major ? `(${c.major})` : ''} - Lớp Mẹ
                          </option>
                        ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowClassModal(false)}
                  className="px-3.5 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold transition-colors cursor-pointer shadow-xs"
                >
                  {editingClass ? 'Lưu Thay Đổi' : 'Thêm Vào Quản Lý'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={deleteConfirm.onConfirm}
        title={deleteConfirm.title}
        message={deleteConfirm.message}
      />
    </div>
  );
};
