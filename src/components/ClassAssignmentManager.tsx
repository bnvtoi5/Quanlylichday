import React, { useMemo, useState } from 'react';
import {
  ArrowRightLeft,
  ArrowUpDown,
  BookOpen,
  Calendar,
  ChevronDown,
  ChevronRight,
  Clock,
  Copy,
  Edit,
  GraduationCap,
  Layers,
  Plus,
  RotateCcw,
  Search,
  Shuffle,
  Sparkles,
  Star,
  Trash2,
  User,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
import {
  CourseAssignment,
  Holiday,
  MasterClass,
  MasterSubject,
  MasterTeacher,
  Semester,
  Teacher,
} from '../types';
import { extractCandidateParentName } from '../utils/classGrouping';
import { formatCourseScheduleSummary, formatSlotSummary, formatVietnamDate, WEEKLY_SLOT_INFO } from '../utils/vietnamTime';
import { detectCoTeachingGroups } from '../utils/coTeachingHelper';
import { AddCourseToClassModal } from './AddCourseToClassModal';
import { CoTeachingScannerModal } from './CoTeachingScannerModal';
import { ReassignTeacherModal } from './ReassignTeacherModal';

interface ClassAssignmentManagerProps {
  semester: Semester;
  masterClasses: MasterClass[];
  masterSubjects: MasterSubject[];
  masterTeachers: MasterTeacher[];
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
  onEditCourse: (teacher: Teacher, course: CourseAssignment) => void;
  onDuplicateCourse: (teacherId: string, course: CourseAssignment) => void;
  onDeleteCourse: (teacherId: string, courseId: string) => void;
  onReassignTeacher: (
    courseId: string,
    currentTeacherId: string,
    targetTeacher: {
      type: 'existing' | 'master' | 'new';
      teacherId?: string;
      masterTeacher?: MasterTeacher;
      newTeacher?: {
        name: string;
        position: string;
        phone?: string;
        email?: string;
      };
    }
  ) => void;
  onAddClassToCatalog: (classData: {
    name: string;
    studentCount?: number;
    major?: string;
    isParent?: boolean;
    subgroups?: string[];
  }) => void;
  onAutoScanClassParents?: () => void;
  onUpdateTeachers?: (updatedTeachers: Teacher[], message?: string) => void;
  onToast: (msg: string) => void;
}

interface ClassCourseItem {
  course: CourseAssignment;
  teacher: Teacher;
  subgroupTag: string; // Tên lớp/nhóm gán thực tế (VD: 'CNTT24TH' hoặc 'CNTT24TH1')
  isGeneral: boolean; // Có phải môn học chung cả lớp không
}

interface ClassFamilyData {
  familyKey: string; // Tên lớp chính (VD: 'CNTT24TH' hoặc 'QTKD24TH')
  isParent: boolean; // Là lớp mẹ có phân nhóm con
  masterInfo?: MasterClass;
  subgroups: string[]; // Danh sách nhóm con: ['CNTT24TH1', 'CNTT24TH2']
  memberClassNames: string[]; // Toàn bộ các mã lớp thành viên (lớp mẹ + các nhóm con)
  items: ClassCourseItem[];
  totalTheoryHours: number;
  totalPracticeHours: number;
  totalHours: number;
  studentCount?: number;
  major?: string;
}

export const ClassAssignmentManager: React.FC<ClassAssignmentManagerProps> = ({
  semester,
  masterClasses,
  masterSubjects,
  masterTeachers,
  holidays,
  onAddCourseToClass,
  onEditCourse,
  onDuplicateCourse,
  onDeleteCourse,
  onReassignTeacher,
  onAddClassToCatalog,
  onAutoScanClassParents,
  onUpdateTeachers,
  onToast,
}) => {
  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMajor, setFilterMajor] = useState('ALL');
  const [filterClassType, setFilterClassType] = useState<'ALL' | 'PARENT' | 'STANDALONE'>('ALL');

  // Modals state
  const [isAddCourseModalOpen, setIsAddCourseModalOpen] = useState(false);
  const [targetClassForAdd, setTargetClassForAdd] = useState<string>('');

  const [isReassignModalOpen, setIsReassignModalOpen] = useState(false);
  const [reassignCourse, setReassignCourse] = useState<CourseAssignment | null>(null);
  const [reassignCurrentTeacher, setReassignCurrentTeacher] = useState<Teacher | null>(null);

  // Co-teaching scanner modal state
  const [isCoTeachingScannerOpen, setIsCoTeachingScannerOpen] = useState(false);

  // Quick New Class Modal / Popover
  const [isCreateClassOpen, setIsCreateClassOpen] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [newClassMajor, setNewClassMajor] = useState('');
  const [newClassStudentCount, setNewClassStudentCount] = useState<number | ''>('');
  const [newClassIsParent, setNewClassIsParent] = useState(false);
  const [newClassSubgroups, setNewClassSubgroups] = useState('');

  // Expand / Collapse state per family
  const [collapsedFamilies, setCollapsedFamilies] = useState<Record<string, boolean>>({});

  // Subgroup tab filter per family: familyKey -> 'ALL' | childClassName
  const [familySubgroupTabs, setFamilySubgroupTabs] = useState<Record<string, string>>({});

  // Detect co-teaching groups in this semester
  const coTeachingGroups = useMemo(() => {
    return detectCoTeachingGroups(semester.teachers || [], holidays || []);
  }, [semester.teachers, holidays]);

  const overlappingCoTeachingCount = useMemo(() => {
    return coTeachingGroups.filter((g) => g.isOverlapping).length;
  }, [coTeachingGroups]);

  // Sorting state for courses inside class tables
  const [sortField, setSortField] = useState<
    | 'subjectName'
    | 'subgroupTag'
    | 'teacherName'
    | 'theoryHours'
    | 'practiceHours'
    | 'totalHours'
    | 'startDate'
    | 'status'
    | null
  >(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleToggleSort = (
    field:
      | 'subjectName'
      | 'subgroupTag'
      | 'teacherName'
      | 'theoryHours'
      | 'practiceHours'
      | 'totalHours'
      | 'startDate'
      | 'status'
  ) => {
    if (sortField === field) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else {
        setSortField(null);
        setSortDirection('asc');
      }
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleResetSort = () => {
    setSortField(null);
    setSortDirection('asc');
  };

  const getSortFieldLabel = (field: string) => {
    switch (field) {
      case 'subjectName':
        return 'Tên Môn Học';
      case 'subgroupTag':
        return 'Lớp Con';
      case 'teacherName':
        return 'Giảng Viên';
      case 'theoryHours':
        return 'Tiết LT';
      case 'practiceHours':
        return 'Tiết TH';
      case 'totalHours':
        return 'Tổng Tiết';
      case 'startDate':
        return 'Ngày Bắt Đầu';
      case 'status':
        return 'Tiến Độ';
      default:
        return '';
    }
  };

  const getSortedItems = (items: ClassCourseItem[]): ClassCourseItem[] => {
    if (!sortField) return items;
    return [...items].sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'subjectName':
          cmp = (a.course.subjectName || '').localeCompare(b.course.subjectName || '', 'vi', {
            sensitivity: 'base',
          });
          break;
        case 'subgroupTag':
          cmp = (a.subgroupTag || '').localeCompare(b.subgroupTag || '', 'vi', {
            sensitivity: 'base',
            numeric: true,
          });
          break;
        case 'teacherName':
          cmp = (a.teacher.name || '').localeCompare(b.teacher.name || '', 'vi', {
            sensitivity: 'base',
          });
          break;
        case 'theoryHours':
          cmp = (a.course.theoryHours || 0) - (b.course.theoryHours || 0);
          break;
        case 'practiceHours':
          cmp = (a.course.practiceHours || 0) - (b.course.practiceHours || 0);
          break;
        case 'totalHours': {
          const totA = (a.course.theoryHours || 0) + (a.course.practiceHours || 0);
          const totB = (b.course.theoryHours || 0) + (b.course.practiceHours || 0);
          cmp = totA - totB;
          break;
        }
        case 'startDate':
          cmp = (a.course.startDate || '').localeCompare(b.course.startDate || '');
          break;
        case 'status': {
          const totA = (a.course.theoryHours || 0) + (a.course.practiceHours || 0);
          const isDoneA = (a.course.completedHours || 0) >= totA && totA > 0 ? 1 : 0;
          const totB = (b.course.theoryHours || 0) + (b.course.practiceHours || 0);
          const isDoneB = (b.course.completedHours || 0) >= totB && totB > 0 ? 1 : 0;
          cmp = isDoneA - isDoneB;
          break;
        }
      }
      return sortDirection === 'asc' ? cmp : -cmp;
    });
  };

  // ----------------------------------------------------
  // Family & Subgroup Grouping Engine
  // ----------------------------------------------------
  const classFamilies = useMemo<ClassFamilyData[]>(() => {
    // 1. Tạo bản đồ tra cứu MasterClass theo tên chữ hoa
    const masterMap = new Map<string, MasterClass>();
    masterClasses.forEach((mc) => {
      const upper = mc.name.trim().toUpperCase();
      if (upper) masterMap.set(upper, mc);
    });

    // 2. Nhận diện các Cụm Lớp Chung và các Lớp Con trực thuộc
    // Parent Name -> Set các lớp con
    const parentToChildren = new Map<string, Set<string>>();
    // Child Name -> Parent Name
    const childToParent = new Map<string, string>();

    // Khởi tạo từ masterClasses
    masterClasses.forEach((mc) => {
      const upperName = mc.name.trim().toUpperCase();
      if (mc.isParent && mc.subgroups && mc.subgroups.length > 0) {
        const set = parentToChildren.get(upperName) || new Set<string>();
        mc.subgroups.forEach((child) => {
          const childUpper = child.trim().toUpperCase();
          set.add(childUpper);
          childToParent.set(childUpper, upperName);
        });
        parentToChildren.set(upperName, set);
      } else if (mc.parentClassName) {
        const parentUpper = mc.parentClassName.trim().toUpperCase();
        childToParent.set(upperName, parentUpper);
        const set = parentToChildren.get(parentUpper) || new Set<string>();
        set.add(upperName);
        parentToChildren.set(parentUpper, set);
      }
    });

    // Quét thêm từ các khóa học trong học kỳ
    semester.teachers.forEach((t) => {
      (t.courses || []).forEach((c) => {
        const cls = (c.className || 'CHƯA PHÂN LỚP').trim().toUpperCase();
        if (childToParent.has(cls)) return;

        const candidate = extractCandidateParentName(cls);
        if (candidate) {
          const { baseName } = candidate;
          const set = parentToChildren.get(baseName) || new Set<string>();
          set.add(cls);
          parentToChildren.set(baseName, set);
          childToParent.set(cls, baseName);
        } else {
          // Lớp đơn không rõ tiền tố -> tự coi là cụm
          const set = parentToChildren.get(cls) || new Set<string>();
          set.add(cls);
          parentToChildren.set(cls, set);
          childToParent.set(cls, cls);
        }
      });
    });

    // Đảm bảo mỗi cụm lớp đều có ít nhất 1 lớp con (TH1)
    masterClasses.forEach((mc) => {
      const upperName = mc.name.trim().toUpperCase();
      if (!childToParent.has(upperName) && !parentToChildren.has(upperName)) {
        const candidate = extractCandidateParentName(upperName);
        const baseName = candidate?.baseName || upperName;
        const set = parentToChildren.get(baseName) || new Set<string>();
        const childName = candidate?.suffix ? upperName : `${baseName}1`;
        set.add(childName);
        parentToChildren.set(baseName, set);
        childToParent.set(childName, baseName);
      }
    });

    // 3. Xây dựng Family Map
    const familyMap = new Map<string, ClassFamilyData>();

    parentToChildren.forEach((childrenSet, parentName) => {
      const parentMaster = masterMap.get(parentName);
      const childrenList = Array.from(childrenSet).sort((a, b) =>
        a.localeCompare(b, 'vi', { sensitivity: 'base', numeric: true })
      );

      let totalStudents = parentMaster?.studentCount || 0;
      let major = parentMaster?.major;

      childrenList.forEach((child) => {
        const childMaster = masterMap.get(child);
        if (!totalStudents && childMaster?.studentCount) {
          totalStudents += childMaster.studentCount;
        }
        if (!major && childMaster?.major) {
          major = childMaster.major;
        }
      });

      familyMap.set(parentName, {
        familyKey: parentName,
        isParent: true,
        masterInfo: parentMaster,
        subgroups: childrenList,
        memberClassNames: childrenList,
        items: [],
        totalTheoryHours: 0,
        totalPracticeHours: 0,
        totalHours: 0,
        studentCount: totalStudents > 0 ? totalStudents : undefined,
        major: major || undefined,
      });
    });

    // 4. Gán toàn bộ môn học từ semester.teachers vào từng Family
    semester.teachers.forEach((teacher) => {
      (teacher.courses || []).forEach((course) => {
        const rawClass = (course.className || 'CHƯA PHÂN LỚP').trim().toUpperCase();

        let targetFamilyKey = rawClass;
        if (childToParent.has(rawClass)) {
          targetFamilyKey = childToParent.get(rawClass)!;
        } else {
          const candidate = extractCandidateParentName(rawClass);
          if (candidate && parentToChildren.has(candidate.baseName)) {
            targetFamilyKey = candidate.baseName;
          }
        }

        let family = familyMap.get(targetFamilyKey);
        if (!family) {
          family = {
            familyKey: targetFamilyKey,
            isParent: true,
            subgroups: [rawClass],
            memberClassNames: [rawClass],
            items: [],
            totalTheoryHours: 0,
            totalPracticeHours: 0,
            totalHours: 0,
          };
          familyMap.set(targetFamilyKey, family);
        }

        family.items.push({
          course,
          teacher,
          subgroupTag: rawClass,
          isGeneral: false,
        });

        family.totalTheoryHours += course.theoryHours || 0;
        family.totalPracticeHours += course.practiceHours || 0;
        family.totalHours += (course.theoryHours || 0) + (course.practiceHours || 0);
      });
    });

    const result = Array.from(familyMap.values());
    result.sort((a, b) => a.familyKey.localeCompare(b.familyKey, 'vi', { sensitivity: 'base', numeric: true }));

    return result;
  }, [masterClasses, semester.teachers]);

  // ----------------------------------------------------
  // Filtered Families
  // ----------------------------------------------------
  const filteredFamilies = useMemo(() => {
    let list = classFamilies;

    // Filter by Class Type
    if (filterClassType === 'PARENT') {
      list = list.filter((f) => f.isParent);
    } else if (filterClassType === 'STANDALONE') {
      list = list.filter((f) => !f.isParent);
    }

    // Filter by Major
    if (filterMajor !== 'ALL') {
      list = list.filter((f) => f.major === filterMajor || f.masterInfo?.major === filterMajor);
    }

    // Filter by Search term
    if (searchTerm.trim()) {
      const term = searchTerm.trim().toLowerCase();
      list = list.filter((f) => {
        const matchesKey = f.familyKey.toLowerCase().includes(term);
        const matchesSubgroup = f.subgroups.some((sg) => sg.toLowerCase().includes(term));
        const matchesCourse = f.items.some(
          ({ course, teacher }) =>
            course.subjectName.toLowerCase().includes(term) ||
            (course.subjectCode && course.subjectCode.toLowerCase().includes(term)) ||
            course.className.toLowerCase().includes(term) ||
            teacher.name.toLowerCase().includes(term)
        );
        return matchesKey || matchesSubgroup || matchesCourse;
      });
    }

    return list;
  }, [classFamilies, filterClassType, filterMajor, searchTerm]);

  // ----------------------------------------------------
  // Statistics
  // ----------------------------------------------------
  const stats = useMemo(() => {
    const totalFamilies = classFamilies.length;
    const parentCount = classFamilies.filter((f) => f.isParent).length;
    const standaloneCount = totalFamilies - parentCount;
    const totalCourses = classFamilies.reduce((acc, f) => acc + f.items.length, 0);
    const totalHours =
      Math.round(classFamilies.reduce((acc, f) => acc + f.totalHours, 0) * 100) / 100;
    return { totalFamilies, parentCount, standaloneCount, totalCourses, totalHours };
  }, [classFamilies]);

  // Unique majors for filter
  const availableMajors = useMemo(() => {
    const set = new Set<string>();
    masterClasses.forEach((c) => {
      if (c.major) set.add(c.major);
    });
    classFamilies.forEach((f) => {
      if (f.major) set.add(f.major);
    });
    return Array.from(set).sort();
  }, [masterClasses, classFamilies]);

  // Toggle Collapse
  const toggleCollapse = (familyKey: string) => {
    setCollapsedFamilies((prev) => ({
      ...prev,
      [familyKey]: !prev[familyKey],
    }));
  };

  const handleExpandAll = () => setCollapsedFamilies({});
  const handleCollapseAll = () => {
    const all: Record<string, boolean> = {};
    classFamilies.forEach((f) => {
      all[f.familyKey] = true;
    });
    setCollapsedFamilies(all);
  };

  // Open modal for class
  const openAddCourseForClass = (className: string) => {
    setTargetClassForAdd(className);
    setIsAddCourseModalOpen(true);
  };

  // Reassign teacher
  const openReassignForCourse = (course: CourseAssignment, teacher: Teacher) => {
    setReassignCourse(course);
    setReassignCurrentTeacher(teacher);
    setIsReassignModalOpen(true);
  };

  // Create new class from popover
  const handleCreateNewClassSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim()) return;

    const trimmedUpper = newClassName.trim().toUpperCase();
    const subgroupsArr = newClassIsParent
      ? newClassSubgroups
          .split(',')
          .map((s) => s.trim().toUpperCase())
          .filter(Boolean)
      : undefined;

    onAddClassToCatalog({
      name: trimmedUpper,
      major: newClassMajor.trim() || undefined,
      studentCount: newClassStudentCount ? Number(newClassStudentCount) : undefined,
      isParent: newClassIsParent,
      subgroups: subgroupsArr,
    });

    onToast(`Đã thêm lớp học "${trimmedUpper}" vào hệ thống!`);
    setNewClassName('');
    setNewClassMajor('');
    setNewClassStudentCount('');
    setNewClassIsParent(false);
    setNewClassSubgroups('');
    setIsCreateClassOpen(false);
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Top Banner & Strategy Description */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-center font-bold shadow-md shadow-emerald-500/20 shrink-0">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Phân Công Theo Lớp Học
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                Hỗ Trợ Lớp Mẹ & Phân Nhóm Thực Hành
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Xếp môn trực tiếp cho từng Lớp Mẹ hoặc Nhóm Con rồi chỉ định Giảng viên phụ trách · Tự động đồng bộ 2 chiều với Phân Công Theo GV & Gantt
            </p>
          </div>
        </div>

        {/* Quick KPI stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-center">
            <span className="text-[10px] text-slate-400 font-semibold block uppercase">Cụm Lớp</span>
            <span className="text-base font-black text-slate-800">{stats.totalFamilies}</span>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-xl px-3 py-2 text-center">
            <span className="text-[10px] text-purple-700 font-semibold block uppercase">Lớp Mẹ (Nhóm)</span>
            <span className="text-base font-black text-purple-700">{stats.parentCount}</span>
          </div>
          <div className="bg-sky-50 border border-sky-200 rounded-xl px-3 py-2 text-center">
            <span className="text-[10px] text-sky-700 font-semibold block uppercase">Tổng Môn</span>
            <span className="text-base font-black text-sky-700">{stats.totalCourses}</span>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-center">
            <span className="text-[10px] text-amber-800 font-semibold block uppercase">Tổng Tiết</span>
            <span className="text-base font-black text-amber-800">{stats.totalHours}h</span>
          </div>
        </div>
      </div>

      {/* Toolbar: Search, Filters & Actions */}
      <div className="bg-white rounded-xl p-3 border border-slate-200/90 shadow-xs flex flex-wrap items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo Mã lớp, Nhóm con, Tên môn học, Giảng viên..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 font-medium"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Class Type (All / Parent / Standalone) */}
        <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs">
          <span className="text-slate-500 font-medium">Loại lớp:</span>
          <select
            value={filterClassType}
            onChange={(e) => setFilterClassType(e.target.value as any)}
            className="bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer"
          >
            <option value="ALL">Tất cả ({classFamilies.length})</option>
            <option value="PARENT">Lớp Mẹ có nhóm ({stats.parentCount})</option>
            <option value="STANDALONE">Lớp đơn độc lập ({stats.standaloneCount})</option>
          </select>
        </div>

        {/* Filter Major */}
        {availableMajors.length > 0 && (
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs">
            <span className="text-slate-500 font-medium">Ngành/Khoa:</span>
            <select
              value={filterMajor}
              onChange={(e) => setFilterMajor(e.target.value)}
              className="bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="ALL">Tất cả ngành</option>
              {availableMajors.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center gap-2">
          {onUpdateTeachers && (
            <button
              type="button"
              onClick={() => setIsCoTeachingScannerOpen(true)}
              className="px-3 py-1.5 text-xs font-bold bg-gradient-to-r from-purple-700 via-indigo-700 to-slate-800 hover:from-purple-600 hover:to-indigo-600 text-white rounded-lg shadow-xs transition-all flex items-center gap-1.5 cursor-pointer relative"
              title="Quét và tự động nối tiếp các môn học có 2+ giảng viên cùng dạy trên 1 lớp"
            >
              <Users className="w-3.5 h-3.5 text-amber-300" />
              <span>Môn Đồng Giảng (2 GV)</span>
              {overlappingCoTeachingCount > 0 ? (
                <span className="px-1.5 py-0.2 rounded-full bg-amber-400 text-amber-950 text-[10px] font-black animate-pulse">
                  {overlappingCoTeachingCount} cần nối
                </span>
              ) : coTeachingGroups.length > 0 ? (
                <span className="px-1.5 py-0.2 rounded-full bg-purple-500/40 text-purple-200 text-[10px] font-bold">
                  {coTeachingGroups.length}
                </span>
              ) : null}
            </button>
          )}

          {onAutoScanClassParents && (
            <button
              type="button"
              onClick={onAutoScanClassParents}
              className="px-3 py-1.5 text-xs font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-lg shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
              title="Quét toàn bộ môn học & lớp để tự động phát hiện và gom nhóm các lớp mẹ (VD: CNTT24TH1, CNTT24TH2 -> CNTT24TH)"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Quét & Gom Lớp Mẹ</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleExpandAll}
            className="px-2.5 py-1.5 text-xs text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium transition-colors cursor-pointer"
            title="Mở rộng toàn bộ danh sách lớp"
          >
            Mở rộng
          </button>
          <button
            type="button"
            onClick={handleCollapseAll}
            className="px-2.5 py-1.5 text-xs text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium transition-colors cursor-pointer"
            title="Thu gọn toàn bộ danh sách lớp"
          >
            Thu gọn
          </button>

          {sortField && (
            <button
              type="button"
              onClick={handleResetSort}
              className="px-2.5 py-1.5 text-xs bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 rounded-lg font-bold transition-all flex items-center gap-1 cursor-pointer"
              title="Đặt lại thứ tự sắp xếp về mặc định ban đầu"
            >
              <RotateCcw className="w-3 h-3 text-purple-600" />
              <span>
                Đang xếp: <strong>{getSortFieldLabel(sortField)}</strong> ({sortDirection === 'asc' ? 'A-Z ▲' : 'Z-A ▼'})
              </span>
              <span className="text-purple-400 hover:text-purple-700 ml-0.5">✕</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsCreateClassOpen(true)}
            className="px-3.5 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo Lớp Mới</span>
          </button>
        </div>
      </div>

      {/* Main Class Cards Container */}
      {filteredFamilies.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 border border-slate-200 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <GraduationCap className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">Không tìm thấy lớp học nào</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Thử thay đổi từ khóa tìm kiếm, lọc loại lớp hoặc bấm nút "Quét & Gom Lớp Mẹ" để hệ thống tự động chuẩn hóa.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredFamilies.map((family) => {
            const isCollapsed = Boolean(collapsedFamilies[family.familyKey]);
            const courseCount = family.items.length;
            const currentSubTab = familySubgroupTabs[family.familyKey] || 'ALL';

            // Filter items displayed according to selected subgroup tab
            const displayedItems = family.items.filter((item) => {
              if (currentSubTab === 'ALL') return true;
              return item.subgroupTag === currentSubTab;
            });

            return (
              <div
                key={family.familyKey}
                className={`bg-white rounded-2xl border shadow-xs overflow-hidden transition-all hover:shadow-md ${
                  family.isParent
                    ? 'border-purple-200/90 ring-1 ring-purple-100'
                    : 'border-slate-200/90'
                }`}
              >
                {/* Family Header */}
                <div
                  className={`p-3.5 sm:p-4 border-b flex flex-wrap items-center justify-between gap-3 ${
                    family.isParent
                      ? 'bg-gradient-to-r from-purple-50/70 via-white to-purple-50/40 border-purple-200/70'
                      : 'bg-gradient-to-r from-slate-50 via-white to-slate-50 border-slate-200/70'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => toggleCollapse(family.familyKey)}
                      className="p-1 rounded-lg hover:bg-slate-200 text-slate-500 hover:text-slate-800 cursor-pointer transition-colors"
                      title={isCollapsed ? 'Mở rộng cụm lớp này' : 'Thu gọn cụm lớp này'}
                    >
                      {isCollapsed ? (
                        <ChevronRight className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>

                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-sm sm:text-base font-black text-slate-900 tracking-tight">
                        {family.familyKey}
                      </span>

                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200 flex items-center gap-1">
                        <Users className="w-3 h-3 text-purple-600" />
                        <span>
                          Cụm {family.subgroups.length} Lớp con ({family.subgroups.join(', ')})
                        </span>
                      </span>

                      {family.major && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-700">
                          {family.major}
                        </span>
                      )}

                      {family.studentCount && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-sky-100 text-sky-800">
                          {family.studentCount} Sinh viên
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Summary badges & Action button */}
                  <div className="flex items-center gap-3">
                    <div className="hidden sm:flex items-center gap-2 text-xs">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 font-semibold text-slate-700">
                        {courseCount} môn học
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 font-bold text-emerald-800">
                        {family.totalHours} tiết ({family.totalTheoryHours} LT +{' '}
                        {family.totalPracticeHours} TH)
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        openAddCourseForClass(
                          currentSubTab !== 'ALL' ? currentSubTab : family.subgroups[0] || `${family.familyKey}1`
                        )
                      }
                      className="px-3 py-1.5 rounded-lg text-xs font-bold text-white shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer bg-purple-700 hover:bg-purple-800 shadow-purple-500/20"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Thêm Môn Vào Lớp</span>
                    </button>
                  </div>
                </div>

                {/* Subgroup Segment Filter for Multi-Child Classes */}
                {!isCollapsed && (
                  <div className="px-4 py-2 bg-purple-50/40 border-b border-purple-100 flex items-center justify-between flex-wrap gap-2 text-xs">
                    {family.subgroups.length > 1 ? (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[11px] font-semibold text-purple-900 mr-1">Xem theo lớp con:</span>
                        <button
                          type="button"
                          onClick={() =>
                            setFamilySubgroupTabs((prev) => ({ ...prev, [family.familyKey]: 'ALL' }))
                          }
                          className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                            currentSubTab === 'ALL'
                              ? 'bg-purple-700 text-white shadow-2xs'
                              : 'bg-white text-purple-900 border border-purple-200 hover:bg-purple-100'
                          }`}
                        >
                          Tất cả các lớp con ({family.items.length})
                        </button>

                        {family.subgroups.map((sub, idx) => {
                          const subCount = family.items.filter((i) => i.subgroupTag === sub).length;
                          return (
                            <button
                              key={sub}
                              type="button"
                              onClick={() =>
                                setFamilySubgroupTabs((prev) => ({
                                  ...prev,
                                  [family.familyKey]: sub,
                                }))
                              }
                              className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer font-mono ${
                                currentSubTab === sub
                                  ? 'bg-purple-700 text-white shadow-2xs'
                                  : 'bg-white text-purple-900 border border-purple-200 hover:bg-purple-100'
                              }`}
                            >
                              Lớp con {idx + 1}: {sub} ({subCount} môn)
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-semibold text-purple-900">
                          🏫 Lớp con trực thuộc:
                        </span>
                        <span className="font-mono font-bold bg-white text-purple-950 px-2 py-0.5 rounded border border-purple-200 text-xs">
                          {family.subgroups[0] || `${family.familyKey}1`}
                        </span>
                        <span className="text-slate-500 text-[11px]">
                          ({family.items.length} môn học)
                        </span>
                      </div>
                    )}

                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-purple-700 italic">
                        Môn học chỉ phân cho lớp con · Cụm lớp dùng để nhóm tổng hợp
                      </span>
                    </div>
                  </div>
                )}

                {/* Courses Table */}
                {!isCollapsed && (
                  <div>
                    {displayedItems.length === 0 ? (
                      <div className="p-6 text-center bg-slate-50/50">
                        <p className="text-xs text-slate-500 italic mb-2">
                          Chưa có môn học nào thuộc bộ lọc này trong học kỳ.
                        </p>
                        <button
                          type="button"
                          onClick={() =>
                            openAddCourseForClass(
                              currentSubTab !== 'ALL' && currentSubTab !== 'GENERAL'
                                ? currentSubTab
                                : family.subgroups[0] || `${family.familyKey}1`
                            )
                          }
                          className="px-3 py-1.5 bg-white border border-dashed border-emerald-300 hover:border-emerald-500 text-emerald-700 rounded-lg text-xs font-bold inline-flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>
                            Bấm để xếp môn cho{' '}
                            {currentSubTab !== 'ALL' && currentSubTab !== 'GENERAL'
                              ? currentSubTab
                              : family.subgroups[0] || `${family.familyKey}1`}
                          </span>
                        </button>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="bg-slate-100/90 border-b border-slate-200 text-slate-700 font-bold text-[11px] uppercase tracking-wider divide-x divide-slate-200/60">
                              <th className="py-2.5 px-3 text-center w-10 text-slate-500">STT</th>
                              
                              {/* Môn Học */}
                              <th
                                onClick={() => handleToggleSort('subjectName')}
                                className={`py-2.5 px-3 min-w-[200px] select-none cursor-pointer hover:bg-slate-200 transition-colors group ${
                                  sortField === 'subjectName' ? 'bg-purple-100/80 text-purple-900 font-black' : ''
                                }`}
                                title="Bấm để sắp xếp theo Tên Môn Học"
                              >
                                <div className="flex items-center justify-between">
                                  <span>Môn Học</span>
                                  {sortField === 'subjectName' ? (
                                    <span className="text-purple-700 font-black text-xs">
                                      {sortDirection === 'asc' ? '▲' : '▼'}
                                    </span>
                                  ) : (
                                    <ArrowUpDown className="w-3 h-3 text-slate-400 group-hover:text-slate-600 opacity-40 group-hover:opacity-100 transition-opacity" />
                                  )}
                                </div>
                              </th>

                              {/* Lớp Con */}
                              <th
                                onClick={() => handleToggleSort('subgroupTag')}
                                className={`py-2.5 px-2 text-center w-28 select-none cursor-pointer hover:bg-slate-200 transition-colors group ${
                                  sortField === 'subgroupTag' ? 'bg-purple-100/80 text-purple-900 font-black' : ''
                                }`}
                                title="Bấm để sắp xếp theo Mã Lớp Con"
                              >
                                <div className="flex items-center justify-center gap-1">
                                  <span>Lớp Con</span>
                                  {sortField === 'subgroupTag' ? (
                                    <span className="text-purple-700 font-black text-xs">
                                      {sortDirection === 'asc' ? '▲' : '▼'}
                                    </span>
                                  ) : (
                                    <ArrowUpDown className="w-3 h-3 text-slate-400 group-hover:text-slate-600 opacity-40 group-hover:opacity-100 transition-opacity" />
                                  )}
                                </div>
                              </th>

                              {/* Giảng Viên Phụ Trách */}
                              <th
                                onClick={() => handleToggleSort('teacherName')}
                                className={`py-2.5 px-3 min-w-[220px] select-none cursor-pointer hover:bg-slate-200 transition-colors group ${
                                  sortField === 'teacherName' ? 'bg-purple-100/80 text-purple-900 font-black' : ''
                                }`}
                                title="Bấm để sắp xếp theo Tên Giảng Viên"
                              >
                                <div className="flex items-center justify-between">
                                  <span>Giảng Viên Phụ Trách</span>
                                  {sortField === 'teacherName' ? (
                                    <span className="text-purple-700 font-black text-xs">
                                      {sortDirection === 'asc' ? '▲' : '▼'}
                                    </span>
                                  ) : (
                                    <ArrowUpDown className="w-3 h-3 text-slate-400 group-hover:text-slate-600 opacity-40 group-hover:opacity-100 transition-opacity" />
                                  )}
                                </div>
                              </th>

                              {/* LT */}
                              <th
                                onClick={() => handleToggleSort('theoryHours')}
                                className={`py-2.5 px-2 text-center w-14 select-none cursor-pointer hover:bg-slate-200 transition-colors group ${
                                  sortField === 'theoryHours' ? 'bg-purple-100/80 text-purple-900 font-black' : ''
                                }`}
                                title="Bấm để sắp xếp theo Tiết Lý Thuyết"
                              >
                                <div className="flex items-center justify-center gap-0.5">
                                  <span>LT</span>
                                  {sortField === 'theoryHours' ? (
                                    <span className="text-purple-700 font-black text-xs">
                                      {sortDirection === 'asc' ? '▲' : '▼'}
                                    </span>
                                  ) : (
                                    <ArrowUpDown className="w-2.5 h-2.5 text-slate-400 group-hover:text-slate-600 opacity-40 group-hover:opacity-100" />
                                  )}
                                </div>
                              </th>

                              {/* TH */}
                              <th
                                onClick={() => handleToggleSort('practiceHours')}
                                className={`py-2.5 px-2 text-center w-14 select-none cursor-pointer hover:bg-slate-200 transition-colors group ${
                                  sortField === 'practiceHours' ? 'bg-purple-100/80 text-purple-900 font-black' : ''
                                }`}
                                title="Bấm để sắp xếp theo Tiết Thực Hành"
                              >
                                <div className="flex items-center justify-center gap-0.5">
                                  <span>TH</span>
                                  {sortField === 'practiceHours' ? (
                                    <span className="text-purple-700 font-black text-xs">
                                      {sortDirection === 'asc' ? '▲' : '▼'}
                                    </span>
                                  ) : (
                                    <ArrowUpDown className="w-2.5 h-2.5 text-slate-400 group-hover:text-slate-600 opacity-40 group-hover:opacity-100" />
                                  )}
                                </div>
                              </th>

                              {/* Tổng */}
                              <th
                                onClick={() => handleToggleSort('totalHours')}
                                className={`py-2.5 px-2 text-center w-16 select-none cursor-pointer hover:bg-slate-200 transition-colors group ${
                                  sortField === 'totalHours' ? 'bg-purple-100/80 text-purple-900 font-black' : ''
                                }`}
                                title="Bấm để sắp xếp theo Tổng số tiết"
                              >
                                <div className="flex items-center justify-center gap-0.5">
                                  <span>Tổng</span>
                                  {sortField === 'totalHours' ? (
                                    <span className="text-purple-700 font-black text-xs">
                                      {sortDirection === 'asc' ? '▲' : '▼'}
                                    </span>
                                  ) : (
                                    <ArrowUpDown className="w-2.5 h-2.5 text-slate-400 group-hover:text-slate-600 opacity-40 group-hover:opacity-100" />
                                  )}
                                </div>
                              </th>

                              {/* Lịch Tuần & Bắt Đầu */}
                              <th
                                onClick={() => handleToggleSort('startDate')}
                                className={`py-2.5 px-3 min-w-[150px] select-none cursor-pointer hover:bg-slate-200 transition-colors group ${
                                  sortField === 'startDate' ? 'bg-purple-100/80 text-purple-900 font-black' : ''
                                }`}
                                title="Bấm để sắp xếp theo Ngày Bắt Đầu"
                              >
                                <div className="flex items-center justify-between">
                                  <span>Lịch & Ngày Bắt Đầu</span>
                                  {sortField === 'startDate' ? (
                                    <span className="text-purple-700 font-black text-xs">
                                      {sortDirection === 'asc' ? '▲' : '▼'}
                                    </span>
                                  ) : (
                                    <ArrowUpDown className="w-3 h-3 text-slate-400 group-hover:text-slate-600 opacity-40 group-hover:opacity-100 transition-opacity" />
                                  )}
                                </div>
                              </th>

                              {/* Tiến Độ */}
                              <th
                                onClick={() => handleToggleSort('status')}
                                className={`py-2.5 px-3 text-center w-28 select-none cursor-pointer hover:bg-slate-200 transition-colors group ${
                                  sortField === 'status' ? 'bg-purple-100/80 text-purple-900 font-black' : ''
                                }`}
                                title="Bấm để sắp xếp theo Tiến độ hoàn thành"
                              >
                                <div className="flex items-center justify-center gap-1">
                                  <span>Tiến Độ</span>
                                  {sortField === 'status' ? (
                                    <span className="text-purple-700 font-black text-xs">
                                      {sortDirection === 'asc' ? '▲' : '▼'}
                                    </span>
                                  ) : (
                                    <ArrowUpDown className="w-3 h-3 text-slate-400 group-hover:text-slate-600 opacity-40 group-hover:opacity-100 transition-opacity" />
                                  )}
                                </div>
                              </th>

                              <th className="py-2.5 px-3 text-right w-36 text-slate-500">Thao Tác</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {getSortedItems(displayedItems).map((item, idx) => {
                              const { course, teacher, subgroupTag, isGeneral } = item;
                              const totalHours =
                                (course.theoryHours || 0) + (course.practiceHours || 0);
                              const completed = course.completedHours || 0;
                              const isDone = completed >= totalHours && totalHours > 0;
                              const slots = course.scheduleSlots || [];

                              // Co-teaching status
                              const coGroup = coTeachingGroups.find(
                                (g) =>
                                  g.className.toUpperCase() === course.className.toUpperCase() &&
                                  g.items.some((it) => it.course.id === course.id)
                              );
                              const coItem = coGroup?.items.find((it) => it.course.id === course.id);
                              const isCoTaught = Boolean(coGroup && coGroup.items.length >= 2);
                              const isOverlapping = Boolean(coGroup?.isOverlapping);
                              const phaseNum = coItem?.phase || course.sequentialPhase;

                              return (
                                <tr
                                  key={course.id}
                                  className="hover:bg-slate-50/80 transition-colors group"
                                >
                                  {/* STT */}
                                  <td className="py-2.5 px-3 text-center font-bold text-slate-400">
                                    {idx + 1}
                                  </td>

                                  {/* Subject Name & Code */}
                                  <td className="py-2.5 px-3">
                                    <div className="font-bold text-slate-900 group-hover:text-emerald-700 transition-colors flex items-center gap-1.5">
                                      <span>{course.subjectName}</span>
                                      {course.mergeRemainderHours && (
                                        <span
                                          className="inline-flex items-center text-amber-500 hover:text-amber-600 transition-transform hover:scale-125 shrink-0"
                                          title="⭐ Môn này đã bật cộng dồn số tiết lẻ vào buổi cuối cùng cho biểu đồ Gantt"
                                        >
                                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500 drop-shadow-[0_0_4px_rgba(245,158,11,0.7)] animate-pulse" />
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-slate-500 mt-0.5">
                                      {course.subjectCode && (
                                        <span className="font-mono bg-slate-100 px-1 rounded border border-slate-200">
                                          {course.subjectCode}
                                        </span>
                                      )}
                                      {course.credits !== undefined && (
                                        <span>· {course.credits} tín chỉ</span>
                                      )}
                                      {isCoTaught && (
                                        <>
                                          {phaseNum === 1 ? (
                                            <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-purple-100 text-purple-800 border border-purple-200">
                                              Đợt 1 (Dạy trước)
                                            </span>
                                          ) : phaseNum === 2 ? (
                                            <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                                              Đợt 2 (Nối tiếp)
                                            </span>
                                          ) : (
                                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                                              Đợt {phaseNum}
                                            </span>
                                          )}

                                          {isOverlapping && (
                                            <button
                                              type="button"
                                              onClick={() => setIsCoTeachingScannerOpen(true)}
                                              className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-100 hover:bg-amber-200 text-amber-800 border border-amber-300 transition-colors cursor-pointer"
                                              title="Đang trùng ngày bắt đầu với GV cùng dạy môn này. Bấm để tự động nối tiếp!"
                                            >
                                              ⚠️ Cần nối tiếp
                                            </button>
                                          )}
                                        </>
                                      )}
                                    </div>
                                  </td>

                                  {/* Lớp Con Badge */}
                                  <td className="py-2.5 px-2 text-center">
                                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-200 font-mono">
                                      {subgroupTag}
                                    </span>
                                  </td>

                                  {/* Assigned Teacher */}
                                  <td className="py-2.5 px-3">
                                    <div className="flex items-center justify-between gap-2">
                                      <div className="flex items-center gap-1.5 min-w-0">
                                        <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-[10px] shrink-0">
                                          {teacher.name.charAt(0)}
                                        </div>
                                        <div className="min-w-0">
                                          <div className="font-bold text-slate-800 truncate text-xs">
                                            {teacher.name}
                                          </div>
                                          <div className="text-[10px] text-slate-400 truncate">
                                            {teacher.position || 'Cơ hữu'}
                                            {teacher.department ? ` · ${teacher.department}` : ''}
                                          </div>
                                        </div>
                                      </div>

                                      <button
                                        type="button"
                                        onClick={() => openReassignForCourse(course, teacher)}
                                        className="text-[10px] text-sky-700 hover:text-sky-900 bg-sky-50 hover:bg-sky-100 border border-sky-200 px-2 py-1 rounded-md font-bold transition-colors flex items-center gap-1 cursor-pointer shrink-0"
                                        title="Chuyển môn này sang Giảng viên khác"
                                      >
                                        <ArrowRightLeft className="w-3 h-3 text-sky-600" />
                                        <span>Đổi GV</span>
                                      </button>
                                    </div>
                                  </td>

                                  {/* LT */}
                                  <td className="py-2.5 px-2 text-center text-slate-600 font-medium">
                                    {course.theoryHours}
                                  </td>

                                  {/* TH */}
                                  <td className="py-2.5 px-2 text-center text-slate-600 font-medium">
                                    {course.practiceHours}
                                  </td>

                                  {/* Total */}
                                  <td className="py-2.5 px-2 text-center font-bold text-slate-900">
                                    {totalHours}
                                  </td>

                                  {/* Weekly Slots & Start Date */}
                                  <td className="py-2.5 px-3">
                                    {(() => {
                                      const validPhases = (course.schedulePhases || []).filter(
                                        (p) => p.fromDate && p.scheduleSlots && p.scheduleSlots.length > 0
                                      );
                                      const hasPhases = validPhases.length > 0;

                                      if (slots.length === 0 && !hasPhases) {
                                        return (
                                          <button
                                            type="button"
                                            onClick={() => onEditCourse(teacher, course)}
                                            className="text-[10px] text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-300 px-2 py-0.5 rounded font-bold flex items-center gap-1 cursor-pointer transition-colors"
                                            title="Bấm để xếp lịch buổi dạy cho môn này"
                                          >
                                            <span>⚠️ Chưa xếp buổi</span>
                                            <span className="underline font-normal text-amber-900">Xếp ngay</span>
                                          </button>
                                        );
                                      }

                                      if (hasPhases) {
                                        return (
                                          <div className="space-y-1">
                                            <div className="flex flex-wrap items-center gap-1.5">
                                              <button
                                                type="button"
                                                onClick={() => onEditCourse(teacher, course)}
                                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-black bg-purple-100 hover:bg-purple-200 border border-purple-300 text-purple-900 font-mono shadow-2xs transition-colors cursor-pointer text-left"
                                                title={`Bấm để xem/sửa các giai đoạn đổi buổi dạy: ${formatCourseScheduleSummary(slots, validPhases)}`}
                                              >
                                                <span>{formatSlotSummary(slots)}</span>
                                                <span className="text-purple-600 font-bold">➔</span>
                                                {validPhases.map((p, pIdx) => (
                                                  <React.Fragment key={p.id || pIdx}>
                                                    {pIdx > 0 && <span className="text-purple-600 font-bold">➔</span>}
                                                    <span>{formatSlotSummary(p.scheduleSlots)}</span>
                                                  </React.Fragment>
                                                ))}
                                              </button>
                                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-purple-50 text-purple-800 border border-purple-200 flex items-center gap-0.5">
                                                <Shuffle className="w-2.5 h-2.5 text-purple-600" />
                                                <span>Đổi buổi ({validPhases.length + 1} GĐ)</span>
                                              </span>
                                            </div>
                                            <div className="text-[10px] text-purple-800 font-medium">
                                              {validPhases.map((p, pIdx) => (
                                                <span key={p.id || pIdx}>
                                                  Từ {formatVietnamDate(p.fromDate)}: đổi sang <strong>{formatSlotSummary(p.scheduleSlots)}</strong> ({p.scheduleSlots.map((s) => WEEKLY_SLOT_INFO[s]?.short || s).join(', ')})
                                                </span>
                                              ))}
                                            </div>
                                          </div>
                                        );
                                      }

                                      return (
                                        <div className="flex flex-wrap items-center gap-1.5">
                                          <span
                                            className="px-2 py-0.5 rounded text-[11px] font-black bg-amber-100 border border-amber-300 text-amber-900 font-mono shadow-2xs"
                                            title={`Ký hiệu buổi: ${formatSlotSummary(slots)} (${slots.map((s) => WEEKLY_SLOT_INFO[s]?.label || s).join(', ')})`}
                                          >
                                            {formatSlotSummary(slots)}
                                          </span>
                                          <span className="text-[10px] font-semibold text-slate-600">
                                            ({slots.map((s) => WEEKLY_SLOT_INFO[s]?.short || s).join(', ')})
                                          </span>
                                        </div>
                                      );
                                    })()}
                                    <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-500 mt-1">
                                      {course.startDate && (
                                        <span>
                                          Bắt đầu: <strong className="text-slate-800 font-bold">{formatVietnamDate(course.startDate)}</strong>
                                        </span>
                                      )}
                                      {course.customValues?.['col-room'] && (
                                        <span className="font-mono bg-sky-50 text-sky-800 border border-sky-200 px-1.5 py-0.2 rounded font-bold text-[9px]">
                                          Phòng: {course.customValues['col-room']}
                                        </span>
                                      )}
                                    </div>
                                  </td>

                                  {/* Progress / Status */}
                                  <td className="py-2.5 px-3 text-center">
                                    <span
                                      className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                        isDone
                                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                          : 'bg-amber-100 text-amber-800 border border-amber-200'
                                      }`}
                                    >
                                      {isDone ? 'Đã hoàn thành' : 'Đang dạy'}
                                    </span>
                                    <div className="text-[10px] text-slate-500 font-semibold mt-0.5">
                                      {completed}/{totalHours}h
                                    </div>
                                  </td>

                                  {/* Actions */}
                                  <td className="py-2.5 px-3 text-right">
                                    <div className="flex items-center justify-end gap-1">
                                      <button
                                        type="button"
                                        onClick={() => onEditCourse(teacher, course)}
                                        className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg cursor-pointer transition-colors"
                                        title="Chỉnh sửa môn học & thời khóa biểu"
                                      >
                                        <Edit className="w-3.5 h-3.5" />
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => onDuplicateCourse(teacher.id, course)}
                                        className="p-1.5 text-slate-500 hover:text-sky-700 hover:bg-sky-50 rounded-lg cursor-pointer transition-colors"
                                        title="Nhân bản môn học này"
                                      >
                                        <Copy className="w-3.5 h-3.5" />
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => onDeleteCourse(teacher.id, course.id)}
                                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
                                        title="Xóa môn này khỏi lớp"
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
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Thêm Môn Vào Lớp */}
      {isAddCourseModalOpen && (
        <AddCourseToClassModal
          isOpen={isAddCourseModalOpen}
          onClose={() => setIsAddCourseModalOpen(false)}
          targetClassName={targetClassForAdd}
          availableClasses={masterClasses}
          masterSubjects={masterSubjects}
          teachersInSemester={semester.teachers}
          masterTeachers={masterTeachers}
          customColumns={semester.customColumns || []}
          holidays={holidays}
          onAddCourseToClass={(className, teacherSelection, courseData) => {
            onAddCourseToClass(className, teacherSelection, courseData);
            setIsAddCourseModalOpen(false);
          }}
        />
      )}

      {/* Modal: Đổi Giảng Viên */}
      {isReassignModalOpen && reassignCourse && reassignCurrentTeacher && (
        <ReassignTeacherModal
          isOpen={isReassignModalOpen}
          onClose={() => {
            setIsReassignModalOpen(false);
            setReassignCourse(null);
            setReassignCurrentTeacher(null);
          }}
          course={reassignCourse}
          currentTeacher={reassignCurrentTeacher}
          teachersInSemester={semester.teachers}
          masterTeachers={masterTeachers}
          onConfirmReassign={(courseId, currentTeacherId, targetTeacher) => {
            onReassignTeacher(courseId, currentTeacherId, targetTeacher);
            setIsReassignModalOpen(false);
            setReassignCourse(null);
            setReassignCurrentTeacher(null);
          }}
        />
      )}

      {/* Modal: Tạo Lớp Mới Nhanh */}
      {isCreateClassOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-900">
                Tạo Lớp Học Mới
              </h3>
              <button
                type="button"
                onClick={() => setIsCreateClassOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateNewClassSubmit} className="space-y-3.5 mt-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Mã Lớp / Tên Lớp *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: CNTT24TH, QTKD24TH..."
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  className="w-full py-2 px-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-slate-900 uppercase font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Ngành Học / Khoa
                </label>
                <input
                  type="text"
                  placeholder="Công nghệ Thông tin, Kế toán..."
                  value={newClassMajor}
                  onChange={(e) => setNewClassMajor(e.target.value)}
                  className="w-full py-2 px-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Sĩ Số (Dự kiến)
                </label>
                <input
                  type="number"
                  min={1}
                  max={200}
                  placeholder="45"
                  value={newClassStudentCount}
                  onChange={(e) =>
                    setNewClassStudentCount(
                      e.target.value ? Number(e.target.value) : ''
                    )
                  }
                  className="w-full py-2 px-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-slate-900"
                />
              </div>

              {/* Lớp Mẹ checkbox */}
              <div className="bg-purple-50/60 p-3 rounded-xl border border-purple-200/80 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-purple-950">
                  <input
                    type="checkbox"
                    checked={newClassIsParent}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setNewClassIsParent(checked);
                      if (checked && !newClassSubgroups.trim() && newClassName.trim()) {
                        const base = newClassName.trim().toUpperCase();
                        setNewClassSubgroups(`${base}1, ${base}2`);
                      }
                    }}
                    className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 border-slate-300 cursor-pointer"
                  />
                  <span>Đây là Lớp Mẹ (Có chia các nhóm con)</span>
                </label>

                {newClassIsParent && (
                  <div className="space-y-1.5 pl-6 pt-1">
                    <span className="text-[11px] font-semibold text-purple-900">
                      Các nhóm con (ngăn cách bằng dấu phẩy):
                    </span>
                    <input
                      type="text"
                      placeholder="Ví dụ: CNTT24TH1, CNTT24TH2"
                      value={newClassSubgroups}
                      onChange={(e) => setNewClassSubgroups(e.target.value)}
                      className="w-full py-1.5 px-3 bg-white border border-purple-300 rounded-lg text-xs font-mono font-bold text-purple-950 uppercase"
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateClassOpen(false)}
                  className="px-3.5 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold transition-colors cursor-pointer shadow-xs"
                >
                  Tạo Lớp
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Co-teaching Scanner & Sequential Setup Modal */}
      {onUpdateTeachers && (
        <CoTeachingScannerModal
          isOpen={isCoTeachingScannerOpen}
          onClose={() => setIsCoTeachingScannerOpen(false)}
          teachers={semester.teachers || []}
          holidays={holidays || []}
          onApplyCoTeaching={(updatedTeachers, msg) => {
            onUpdateTeachers(updatedTeachers, msg);
            if (onToast) onToast(msg);
          }}
        />
      )}
    </div>
  );
};
