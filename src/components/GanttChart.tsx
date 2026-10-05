import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Calendar,
  CalendarRange,
  Check,
  ChevronDown,
  ChevronRight,
  Clock,
  Columns,
  Eye,
  EyeOff,
  Filter,
  GraduationCap,
  Info,
  Layers,
  Maximize2,
  Minimize2,
  MoveHorizontal,
  Printer,
  RotateCcw,
  Search,
  Sliders,
  Sparkles,
  Star,
  Users,
  X,
  Zap,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { AppUiSettings, CourseAssignment, CoursePauseInterval, Holiday, MasterClass, Semester, Teacher } from '../types';
import {
  computeCourseGanttSchedule,
  CourseGanttSchedule,
  generateSemesterWeeks,
  SemesterWeek,
  WeekGanttCell,
} from '../utils/ganttCalculator';
import { getCanonicalParentName } from '../utils/classGrouping';
import { formatCourseScheduleSummary, formatSlotSummary, formatVietnamDate, shiftDateByDays } from '../utils/vietnamTime';
import { detectCoTeachingGroups } from '../utils/coTeachingHelper';
import { CoTeachingScannerModal } from './CoTeachingScannerModal';
import { GanttPrintView } from './GanttPrintView';
import { GanttQuickSchedulePopover } from './GanttQuickSchedulePopover';

export interface GanttColumnVisibility {
  [key: string]: boolean;
  stt: boolean;
  teacher: boolean;
  position: boolean;
  subject: boolean;
  class: boolean;
  lt: boolean;
  th: boolean;
  total: boolean;
  progress: boolean;
}

export interface GanttColumnWidths {
  [key: string]: number;
  stt: number;
  teacher: number;
  position: number;
  subject: number;
  class: number;
  lt: number;
  th: number;
  total: number;
  progress: number;
  weekCol: number; // Synchronized width applied to ALL week columns!
}

const DEFAULT_VISIBILITY: GanttColumnVisibility = {
  stt: true,
  teacher: true,
  position: true,
  subject: true,
  class: true,
  lt: true,
  th: true,
  total: true,
  progress: true,
};

const DEFAULT_WIDTHS: GanttColumnWidths = {
  stt: 44,
  teacher: 165,
  position: 95,
  subject: 160,
  class: 85,
  lt: 45,
  th: 45,
  total: 50,
  progress: 80,
  weekCol: 36, // Default 36px for all week columns as requested
};

const STORAGE_KEY_VISIBILITY = 'edutrack_gantt_col_visibility_v3';
const STORAGE_KEY_WIDTHS = 'edutrack_gantt_col_widths_v3';
const STORAGE_KEY_FIT_TO_SCREEN = 'edutrack_gantt_fit_to_screen_v1';
const STORAGE_KEY_WEEK_RANGE = 'edutrack_gantt_week_range_v1';

interface GanttChartProps {
  semester: Semester;
  holidays: Holiday[];
  masterClasses?: MasterClass[];
  onEditCourse?: (teacher: Teacher, course: CourseAssignment) => void;
  onUpdateCourse?: (teacherId: string, courseId: string, updates: Partial<CourseAssignment>) => void;
  onUpdateTeachers?: (updatedTeachers: Teacher[], message?: string) => void;
  onToast?: (msg: string) => void;
  uiSettings?: AppUiSettings;
  onUpdateUiSettings?: (settings: Partial<AppUiSettings>) => void;
  // Shared search & filter props with parent
  searchTerm?: string;
  onSearchChange?: (val: string) => void;
  selectedPosition?: string;
  onPositionChange?: (pos: string) => void;
  selectedStatus?: string;
  onStatusChange?: (status: string) => void;
  isPrintOpen?: boolean;
  onClosePrint?: () => void;
}

export interface GanttClassSubgroupItem {
  teacher: Teacher;
  course: CourseAssignment;
  childClass: string;
}

export interface GanttClassFamilyGroup {
  parentKey: string;
  major?: string;
  studentCount?: number;
  subgroups: string[];
  items: GanttClassSubgroupItem[];
  totalTheoryHours: number;
  totalPracticeHours: number;
  totalHours: number;
}

export const GanttChart: React.FC<GanttChartProps> = ({
  semester,
  holidays,
  masterClasses = [],
  onEditCourse,
  onUpdateCourse,
  onUpdateTeachers,
  onToast,
  uiSettings,
  onUpdateUiSettings,
  searchTerm: parentSearchTerm,
  onSearchChange: parentOnSearchChange,
  selectedPosition: parentSelectedPosition,
  onPositionChange: parentOnPositionChange,
  selectedStatus: parentSelectedStatus,
  onStatusChange: parentOnStatusChange,
  isPrintOpen: parentIsPrintOpen,
  onClosePrint: parentOnClosePrint,
}) => {
  // Local fallback filter states if not provided by parent
  const [localSearchTerm, setLocalSearchTerm] = useState('');
  const [localSelectedPosition, setLocalSelectedPosition] = useState('ALL');
  const [localSelectedStatus, setLocalSelectedStatus] = useState('ALL');

  // Co-teaching modal state
  const [isCoTeachingModalOpen, setIsCoTeachingModalOpen] = useState(false);

  // Detect co-teaching groups in this semester
  const coTeachingGroups = useMemo(() => {
    return detectCoTeachingGroups(semester.teachers || [], holidays || []);
  }, [semester.teachers, holidays]);

  const overlappingCoTeachingCount = useMemo(() => {
    return coTeachingGroups.filter((g) => g.isOverlapping).length;
  }, [coTeachingGroups]);

  // Group By State: 'teacher' | 'class'
  const [groupBy, setGroupBy] = useState<'teacher' | 'class'>('teacher');

  // Parent Class Filter when groupBy === 'class'
  const [selectedParentClass, setSelectedParentClass] = useState<string>('ALL');

  // Collapsed state per Parent Class in Gantt
  const [collapsedParentClasses, setCollapsedParentClasses] = useState<Record<string, boolean>>({});

  // Subgroup tab filter per Parent Class: parentKey -> 'ALL' | childClassName
  const [parentSubgroupTabs, setParentSubgroupTabs] = useState<Record<string, string>>({});

  const toggleParentCollapse = (parentKey: string) => {
    setCollapsedParentClasses((prev) => ({
      ...prev,
      [parentKey]: !prev[parentKey],
    }));
  };

  const searchTerm = parentSearchTerm !== undefined ? parentSearchTerm : localSearchTerm;
  const setSearchTerm = parentOnSearchChange || setLocalSearchTerm;

  const selectedPosition = parentSelectedPosition !== undefined ? parentSelectedPosition : localSelectedPosition;
  const setSelectedPosition = parentOnPositionChange || setLocalSelectedPosition;

  const selectedStatus = parentSelectedStatus !== undefined ? parentSelectedStatus : localSelectedStatus;
  const setSelectedStatus = parentOnStatusChange || setLocalSelectedStatus;

  // Print view modal state
  const [localIsPrintOpen, setLocalIsPrintOpen] = useState(false);
  const isPrintModalOpen = parentIsPrintOpen !== undefined ? parentIsPrintOpen : localIsPrintOpen;
  const closePrintModal = parentOnClosePrint || (() => setLocalIsPrintOpen(false));

  // Fit to Screen & Panoramic View Mode
  const [isFitToScreen, setIsFitToScreen] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY_FIT_TO_SCREEN) === 'true';
    } catch {}
    return false;
  });

  // Week Range Filter: 'WEEK_20' | 'ALL' | 'FIRST_HALF' | 'SECOND_HALF' | 'CURRENT_WINDOW'
  const [weekRangeFilter, setWeekRangeFilter] = useState<
    'WEEK_20' | 'ALL' | 'FIRST_HALF' | 'SECOND_HALF' | 'CURRENT_WINDOW'
  >(() => {
    try {
      return (
        (localStorage.getItem(STORAGE_KEY_WEEK_RANGE) as
          | 'WEEK_20'
          | 'ALL'
          | 'FIRST_HALF'
          | 'SECOND_HALF'
          | 'CURRENT_WINDOW') || 'ALL'
      );
    } catch {}
    return 'ALL';
  });

  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Container measurement ref
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(1200);

  // Measure container width for responsive fit-to-screen
  useEffect(() => {
    if (!containerRef.current) return;
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth || 1200);
      }
    };
    updateWidth();
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0) {
          setContainerWidth(entry.contentRect.width);
        }
      }
    });
    observer.observe(containerRef.current);
    window.addEventListener('resize', updateWidth);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateWidth);
    };
  }, []);

  // Save fit & range settings to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_FIT_TO_SCREEN, String(isFitToScreen));
    } catch {}
  }, [isFitToScreen]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_WEEK_RANGE, weekRangeFilter);
    } catch {}
  }, [weekRangeFilter]);

  // ESC key to exit fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  // Column Visibility & Widths State with Cloud & localStorage Persistence
  const [colVisibility, setColVisibility] = useState<GanttColumnVisibility>(() => {
    if (uiSettings?.ganttColumnVisibility) {
      return { ...DEFAULT_VISIBILITY, ...uiSettings.ganttColumnVisibility };
    }
    try {
      const saved = localStorage.getItem(STORAGE_KEY_VISIBILITY);
      if (saved) return { ...DEFAULT_VISIBILITY, ...JSON.parse(saved) };
    } catch {}
    return DEFAULT_VISIBILITY;
  });

  const [colWidths, setColWidths] = useState<GanttColumnWidths>(() => {
    if (uiSettings?.ganttColumnWidths) {
      return { ...DEFAULT_WIDTHS, ...uiSettings.ganttColumnWidths };
    }
    try {
      const saved = localStorage.getItem(STORAGE_KEY_WIDTHS);
      if (saved) return { ...DEFAULT_WIDTHS, ...JSON.parse(saved) };
    } catch {}
    return DEFAULT_WIDTHS;
  });

  // Sync incoming Cloud uiSettings when received from another device
  useEffect(() => {
    if (!uiSettings) return;

    if (uiSettings.ganttColumnVisibility) {
      setColVisibility((prev) => {
        const isSame = Object.keys(uiSettings.ganttColumnVisibility!).every(
          (k) => (uiSettings.ganttColumnVisibility as any)[k] === (prev as any)[k]
        );
        return isSame ? prev : { ...prev, ...uiSettings.ganttColumnVisibility };
      });
    }
    if (uiSettings.ganttColumnWidths) {
      setColWidths((prev) => {
        const isSame = Object.keys(uiSettings.ganttColumnWidths!).every(
          (k) => (uiSettings.ganttColumnWidths as any)[k] === (prev as any)[k]
        );
        return isSame ? prev : { ...prev, ...uiSettings.ganttColumnWidths };
      });
    }
    if (uiSettings.ganttFitToScreen !== undefined) {
      setIsFitToScreen((prev) => (prev === uiSettings.ganttFitToScreen ? prev : uiSettings.ganttFitToScreen!));
    }
    if (uiSettings.ganttWeekRange) {
      setWeekRangeFilter((prev) => (prev === uiSettings.ganttWeekRange ? prev : (uiSettings.ganttWeekRange as any)));
    }
  }, [uiSettings]);

  const syncSettingsDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const notifyUiSettingsChange = (partial: Partial<AppUiSettings>) => {
    if (syncSettingsDebounceRef.current) {
      clearTimeout(syncSettingsDebounceRef.current);
    }
    syncSettingsDebounceRef.current = setTimeout(() => {
      onUpdateUiSettings?.(partial);
    }, 400);
  };

  // Save changes to localStorage and push to Cloud uiSettings
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_VISIBILITY, JSON.stringify(colVisibility));
    } catch {}
    notifyUiSettingsChange({ ganttColumnVisibility: colVisibility });
  }, [colVisibility]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_WIDTHS, JSON.stringify(colWidths));
    } catch {}
    notifyUiSettingsChange({ ganttColumnWidths: colWidths });
  }, [colWidths]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_FIT_TO_SCREEN, String(isFitToScreen));
    } catch {}
    notifyUiSettingsChange({ ganttFitToScreen: isFitToScreen });
  }, [isFitToScreen]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_WEEK_RANGE, weekRangeFilter);
    } catch {}
    notifyUiSettingsChange({ ganttWeekRange: weekRangeFilter });
  }, [weekRangeFilter]);

  // Dropdown states
  const [isColumnDropdownOpen, setIsColumnDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsColumnDropdownOpen(false);
      }
    };
    if (isColumnDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isColumnDropdownOpen]);

  // Reset to default
  const handleResetToDefault = () => {
    setColVisibility(DEFAULT_VISIBILITY);
    setColWidths(DEFAULT_WIDTHS);
    setIsFitToScreen(false);
    setWeekRangeFilter('ALL');
    try {
      localStorage.removeItem(STORAGE_KEY_VISIBILITY);
      localStorage.removeItem(STORAGE_KEY_WIDTHS);
      localStorage.removeItem(STORAGE_KEY_FIT_TO_SCREEN);
      localStorage.removeItem(STORAGE_KEY_WEEK_RANGE);
    } catch {}
    notifyUiSettingsChange({
      ganttColumnVisibility: DEFAULT_VISIBILITY,
      ganttColumnWidths: DEFAULT_WIDTHS,
      ganttFitToScreen: false,
      ganttWeekRange: 'ALL',
    });
  };

  // Toggle single column
  const toggleColumn = (key: keyof GanttColumnVisibility) => {
    setColVisibility((prev) => {
      const visibleCount = Object.values({ ...prev, [key]: !prev[key] }).filter(Boolean).length;
      if (visibleCount === 0) return prev;
      return {
        ...prev,
        [key]: !prev[key],
      };
    });
  };

  // Show all columns
  const handleShowAllColumns = () => {
    setColVisibility(DEFAULT_VISIBILITY);
  };

  // Quick preset: Compact columns (hide non-essential columns to maximize Gantt timeline width)
  const handleToggleCompactColumns = () => {
    const isAlreadyCompact =
      !colVisibility.position && !colVisibility.lt && !colVisibility.th;
    if (isAlreadyCompact) {
      setColVisibility(DEFAULT_VISIBILITY);
    } else {
      setColVisibility((prev) => ({
        ...prev,
        position: false,
        lt: false,
        th: false,
      }));
    }
  };

  // Zoom adjustments
  const handleZoom = (direction: 'in' | 'out') => {
    setIsFitToScreen(false);
    setColWidths((prev) => {
      const current = prev.weekCol;
      const step = 8;
      const nextVal = direction === 'in' ? Math.min(150, current + step) : Math.max(20, current - step);
      return { ...prev, weekCol: nextVal };
    });
  };

  const handleApplyPreset = (preset: 'fit' | 'compact' | 'standard' | 'wide') => {
    if (preset === 'fit') {
      setIsFitToScreen(true);
    } else if (preset === 'compact') {
      setIsFitToScreen(false);
      setColWidths((prev) => ({ ...prev, weekCol: 24 }));
    } else if (preset === 'standard') {
      setIsFitToScreen(false);
      setColWidths((prev) => ({ ...prev, weekCol: 42 }));
    } else if (preset === 'wide') {
      setIsFitToScreen(false);
      setColWidths((prev) => ({ ...prev, weekCol: 75 }));
    }
  };

  // Column Resizing Logic
  const startResize = (colKey: keyof GanttColumnWidths, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsFitToScreen(false); // Turn off auto-fit when manually dragging
    const startX = e.clientX;
    const startWidth = colWidths[colKey];

    const onMouseMove = (moveEvent: MouseEvent) => {
      const delta = moveEvent.clientX - startX;
      const minWidth = colKey === 'weekCol' ? 20 : 30;
      const maxWidth = colKey === 'weekCol' ? 180 : 500;
      const newWidth = Math.max(minWidth, Math.min(maxWidth, startWidth + delta));

      setColWidths((prev) => ({
        ...prev,
        [colKey]: newWidth,
      }));
    };

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';
    };

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  // Semester weeks generation
  const semesterWeeks = useMemo<SemesterWeek[]>(() => {
    return generateSemesterWeeks(
      semester.startDate,
      semester.endDate,
      semester.startWeekNumber || 1
    );
  }, [semester.startDate, semester.endDate, semester.startWeekNumber]);

  // Displayed weeks after applying week range filter
  const displayedWeeks = useMemo<SemesterWeek[]>(() => {
    if (weekRangeFilter === 'WEEK_20') {
      return semesterWeeks.slice(0, 20);
    }
    if (weekRangeFilter === 'FIRST_HALF') {
      const half = Math.ceil(semesterWeeks.length / 2);
      return semesterWeeks.slice(0, half);
    }
    if (weekRangeFilter === 'SECOND_HALF') {
      const half = Math.ceil(semesterWeeks.length / 2);
      return semesterWeeks.slice(half);
    }
    if (weekRangeFilter === 'CURRENT_WINDOW') {
      const currIdx = semesterWeeks.findIndex((w) => w.isCurrentWeek);
      if (currIdx >= 0) {
        const start = Math.max(0, currIdx - 3);
        const end = Math.min(semesterWeeks.length, currIdx + 5);
        return semesterWeeks.slice(start, end);
      }
      return semesterWeeks.slice(0, Math.min(8, semesterWeeks.length));
    }
    return semesterWeeks;
  }, [semesterWeeks, weekRangeFilter]);

  // Active / computed column widths (responsive fit-to-screen vs manual)
  const activeColWidths = useMemo<GanttColumnWidths>(() => {
    if (!isFitToScreen) {
      return colWidths;
    }

    // In Fit-to-screen mode, calculate optimal widths to eliminate horizontal scrolling
    const compactStatic = {
      stt: colVisibility.stt ? 34 : 0,
      teacher: colVisibility.teacher ? (groupBy === 'teacher' ? 135 : 120) : 0,
      position: colVisibility.position ? 68 : 0,
      subject: colVisibility.subject ? 135 : 0,
      class: colVisibility.class ? (groupBy === 'class' ? 120 : 65) : 0,
      lt: colVisibility.lt ? 32 : 0,
      th: colVisibility.th ? 32 : 0,
      total: colVisibility.total ? 36 : 0,
      progress: colVisibility.progress ? 58 : 0,
    };

    const totalStaticWidth = Object.values(compactStatic).reduce((a, b) => a + b, 0);
    const availableForWeeks = Math.max(100, containerWidth - totalStaticWidth - 8);
    const totalWeeksCount = Math.max(1, displayedWeeks.length);
    const dynamicWeekWidth = Math.max(16, Math.floor(availableForWeeks / totalWeeksCount));

    return {
      stt: 34,
      teacher: groupBy === 'teacher' ? 135 : 120,
      position: 68,
      subject: 135,
      class: groupBy === 'class' ? 120 : 65,
      lt: 32,
      th: 32,
      total: 36,
      progress: 58,
      weekCol: dynamicWeekWidth,
    };
  }, [
    isFitToScreen,
    colWidths,
    colVisibility,
    groupBy,
    containerWidth,
    displayedWeeks.length,
  ]);

  // Current week object
  const currentWeek = useMemo(() => {
    return semesterWeeks.find((w) => w.isCurrentWeek);
  }, [semesterWeeks]);

  // Available positions for filtering (strictly Cơ hữu & Thỉnh giảng)
  const availablePositions = useMemo(() => {
    return ['Cơ hữu', 'Thỉnh giảng'];
  }, []);

  // Filtered teachers and their courses
  const filteredTeachers: Teacher[] = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();

    return (semester.teachers || [])
      .filter((teacher) => {
        if (selectedPosition !== 'ALL' && teacher.position !== selectedPosition) {
          return false;
        }
        return true;
      })
      .map((teacher) => {
        let courses = teacher.courses || [];

        if (selectedStatus !== 'ALL') {
          courses = courses.filter((c) => {
            const tot = (c.theoryHours || 0) + (c.practiceHours || 0);
            const isDone = (c.completedHours || 0) >= tot && tot > 0;
            return selectedStatus === 'Đã hoàn thành' ? isDone : !isDone;
          });
        }

        if (term) {
          const matchTeacher =
            teacher.name.toLowerCase().includes(term) ||
            (teacher.department && teacher.department.toLowerCase().includes(term)) ||
            (teacher.position && teacher.position.toLowerCase().includes(term));

          if (!matchTeacher) {
            courses = courses.filter(
              (c) =>
                c.subjectName.toLowerCase().includes(term) ||
                c.className.toLowerCase().includes(term) ||
                (c.subjectCode && c.subjectCode.toLowerCase().includes(term))
            );
          }
        }

        return {
          ...teacher,
          courses,
        };
      })
      .filter((teacher) => {
        if (selectedStatus !== 'ALL') {
          return teacher.courses.length > 0;
        }
        if (searchTerm.trim()) {
          const matchTeacher = teacher.name.toLowerCase().includes(searchTerm.toLowerCase().trim());
          return matchTeacher || teacher.courses.length > 0;
        }
        return true;
      });
  }, [semester.teachers, searchTerm, selectedPosition, selectedStatus]);

  // Precompute Gantt schedules for all courses (each course uses its own mergeRemainderHours setting)
  const courseSchedulesMap = useMemo(() => {
    const map = new Map<string, CourseGanttSchedule>();
    filteredTeachers.forEach((teacher) => {
      (teacher.courses || []).forEach((course) => {
        const schedule = computeCourseGanttSchedule(course, semesterWeeks, holidays);
        map.set(course.id, schedule);
      });
    });
    return map;
  }, [filteredTeachers, semesterWeeks, holidays]);

  // Helper to give distinct color badges for subgroups
  const getSubgroupBadgeStyle = (childClass: string, subgroups: string[]) => {
    const idx = subgroups.indexOf(childClass);
    if (idx === 0) return 'bg-sky-100 text-sky-900 border-sky-300';
    if (idx === 1) return 'bg-purple-100 text-purple-900 border-purple-300';
    if (idx === 2) return 'bg-amber-100 text-amber-900 border-amber-300';
    if (idx === 3) return 'bg-emerald-100 text-emerald-900 border-emerald-300';
    return 'bg-indigo-100 text-indigo-900 border-indigo-300';
  };

  // Group Courses by Parent Class Family (when groupBy === 'class')
  const classFamilyGroups = useMemo<GanttClassFamilyGroup[]>(() => {
    const masterMap = new Map<string, MasterClass>();
    (masterClasses || []).forEach((mc) => {
      masterMap.set(mc.name.trim().toUpperCase(), mc);
    });

    const parentToChildren = new Map<string, Set<string>>();
    const childToParent = new Map<string, string>();

    (masterClasses || []).forEach((mc) => {
      const uName = mc.name.trim().toUpperCase();
      if (mc.isParent && mc.subgroups && mc.subgroups.length > 0) {
        const s = parentToChildren.get(uName) || new Set<string>();
        mc.subgroups.forEach((child) => {
          const cU = child.trim().toUpperCase();
          s.add(cU);
          childToParent.set(cU, uName);
        });
        parentToChildren.set(uName, s);
      } else if (mc.parentClassName) {
        const pU = mc.parentClassName.trim().toUpperCase();
        childToParent.set(uName, pU);
        const s = parentToChildren.get(pU) || new Set<string>();
        s.add(uName);
        parentToChildren.set(pU, s);
      }
    });

    // Extract all courses and map them to parent classes
    const familyMap = new Map<string, GanttClassFamilyGroup>();

    filteredTeachers.forEach((teacher) => {
      (teacher.courses || []).forEach((course) => {
        const childClass = (course.className || 'Chưa xếp lớp').trim().toUpperCase();
        let parentKey = childToParent.get(childClass);
        if (!parentKey) {
          parentKey = getCanonicalParentName(childClass);
        }

        const masterParent = masterMap.get(parentKey);
        let family = familyMap.get(parentKey);
        if (!family) {
          const s = parentToChildren.get(parentKey) || new Set<string>();
          s.add(childClass);
          parentToChildren.set(parentKey, s);

          const subgroups = Array.from(s).sort((a, b) =>
            a.localeCompare(b, 'vi', { sensitivity: 'base', numeric: true })
          );

          family = {
            parentKey,
            major: masterParent?.major,
            studentCount: masterParent?.studentCount,
            subgroups,
            items: [],
            totalTheoryHours: 0,
            totalPracticeHours: 0,
            totalHours: 0,
          };
          familyMap.set(parentKey, family);
        } else {
          if (!family.subgroups.includes(childClass)) {
            family.subgroups.push(childClass);
            family.subgroups.sort((a, b) =>
              a.localeCompare(b, 'vi', { sensitivity: 'base', numeric: true })
            );
          }
        }

        family.items.push({
          teacher,
          course,
          childClass,
        });

        family.totalTheoryHours += course.theoryHours || 0;
        family.totalPracticeHours += course.practiceHours || 0;
        family.totalHours += (course.theoryHours || 0) + (course.practiceHours || 0);
      });
    });

    // Also include any masterClasses that are parents even if they currently have 0 courses
    (masterClasses || []).forEach((mc) => {
      if (mc.isParent) {
        const uName = mc.name.trim().toUpperCase();
        if (!familyMap.has(uName)) {
          familyMap.set(uName, {
            parentKey: uName,
            major: mc.major,
            studentCount: mc.studentCount,
            subgroups: mc.subgroups || [`${uName}1`],
            items: [],
            totalTheoryHours: 0,
            totalPracticeHours: 0,
            totalHours: 0,
          });
        }
      }
    });

    const sortedFamilies = Array.from(familyMap.values()).sort((a, b) =>
      a.parentKey.localeCompare(b.parentKey, 'vi', { sensitivity: 'base', numeric: true })
    );

    // Sort items inside each family by childClass, then subjectName
    sortedFamilies.forEach((f) => {
      f.items.sort((a, b) => {
        const cmpClass = a.childClass.localeCompare(b.childClass, 'vi', { numeric: true });
        if (cmpClass !== 0) return cmpClass;
        return a.course.subjectName.localeCompare(b.course.subjectName, 'vi');
      });
    });

    return sortedFamilies;
  }, [filteredTeachers, masterClasses]);

  // Filtered family groups according to parent class filter and search
  const filteredFamilyGroups = useMemo(() => {
    if (selectedParentClass === 'ALL') {
      return classFamilyGroups.filter((f) => f.items.length > 0 || (searchTerm || '').trim() !== '');
    }
    return classFamilyGroups.filter((f) => f.parentKey === selectedParentClass);
  }, [classFamilyGroups, selectedParentClass, searchTerm]);

  // Sticky offset calculations for STT and Teacher/Class
  const sttStickyLeft = 0;
  const teacherStickyLeft = colVisibility.stt ? activeColWidths.stt : 0;
  const classStickyLeft = colVisibility.stt ? activeColWidths.stt : 0;

  // Number of visible static columns for empty colSpan
  const visibleStaticCount = [
    colVisibility.stt,
    colVisibility.teacher,
    colVisibility.position,
    colVisibility.subject,
    colVisibility.class,
    colVisibility.lt,
    colVisibility.th,
    colVisibility.total,
    colVisibility.progress,
  ].filter(Boolean).length;

  // --------------------------------------------------------------------------
  // DIRECT MANIPULATION (UI ↔ DATA) LOGIC & HANDLERS
  // --------------------------------------------------------------------------

  // Interactive Quick Popover state
  const [popoverData, setPopoverData] = useState<{
    anchorRect: DOMRect;
    teacher: Teacher;
    course: CourseAssignment;
    week: SemesterWeek;
  } | null>(null);

  // Drag-to-shift timeline state
  const [dragState, setDragState] = useState<{
    teacherId: string;
    courseId: string;
    courseName: string;
    className: string;
    startWeekIndex: number;
    deltaWeeks: number;
    currentX: number;
    currentY: number;
  } | null>(null);

  const dragInfoRef = useRef<{
    isDragging: boolean;
    hasMoved: boolean;
    startX: number;
    startY: number;
    teacher: Teacher;
    course: CourseAssignment;
    week: SemesterWeek;
    deltaWeeks: number;
  } | null>(null);

  const handleCellMouseDown = (
    e: React.MouseEvent,
    teacher: Teacher,
    course: CourseAssignment,
    week: SemesterWeek
  ) => {
    if (e.button !== 0) return;
    if (e.detail > 1) return; // Prevent drag trigger on double click

    dragInfoRef.current = {
      isDragging: true,
      hasMoved: false,
      startX: e.clientX,
      startY: e.clientY,
      teacher,
      course,
      week,
      deltaWeeks: 0,
    };

    const onMouseMove = (moveEvent: MouseEvent) => {
      if (!dragInfoRef.current || !dragInfoRef.current.isDragging) return;
      const dx = moveEvent.clientX - dragInfoRef.current.startX;
      const dy = moveEvent.clientY - dragInfoRef.current.startY;

      if (Math.abs(dx) > 6 || Math.abs(dy) > 6 || dragInfoRef.current.hasMoved) {
        dragInfoRef.current.hasMoved = true;
        const weekColW = colWidths.weekCol || 36;
        const deltaWeeks = Math.round(dx / weekColW);
        dragInfoRef.current.deltaWeeks = deltaWeeks;

        setDragState({
          teacherId: dragInfoRef.current.teacher.id,
          courseId: dragInfoRef.current.course.id,
          courseName: dragInfoRef.current.course.subjectName,
          className: dragInfoRef.current.course.className,
          startWeekIndex: dragInfoRef.current.week.weekIndex,
          deltaWeeks,
          currentX: moveEvent.clientX,
          currentY: moveEvent.clientY,
        });

        document.body.style.cursor = 'grabbing';
        document.body.style.userSelect = 'none';
      }
    };

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';

      if (dragInfoRef.current?.hasMoved && dragInfoRef.current.deltaWeeks !== 0) {
        const { teacher: t, course: c, deltaWeeks } = dragInfoRef.current;
        const daysDelta = deltaWeeks * 7;
        const currentStart = c.startDate || semester.startDate || '2026-09-07';
        const newStartDate = shiftDateByDays(currentStart, daysDelta);

        const shiftedPause = (c.pauseIntervals || []).map((p) => ({
          ...p,
          fromDate: shiftDateByDays(p.fromDate, daysDelta),
          toDate: shiftDateByDays(p.toDate, daysDelta),
        }));

        if (onUpdateCourse) {
          onUpdateCourse(t.id, c.id, {
            startDate: newStartDate,
            pauseIntervals: shiftedPause,
          });
        }

        if (onToast) {
          onToast(
            `⚡ Đã kéo dời lịch "${c.subjectName}" ${
              deltaWeeks > 0 ? `tiến +${deltaWeeks}` : `lùi ${deltaWeeks}`
            } tuần (bắt đầu: ${formatVietnamDate(newStartDate)})`
          );
        }
      }

      setDragState(null);
      setTimeout(() => {
        if (dragInfoRef.current) {
          dragInfoRef.current.isDragging = false;
          dragInfoRef.current.hasMoved = false;
        }
      }, 50);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const handleCellClick = (
    e: React.MouseEvent,
    teacher: Teacher,
    course: CourseAssignment,
    week: SemesterWeek
  ) => {
    e.stopPropagation();
    if (dragInfoRef.current?.hasMoved) return;

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setPopoverData({
      anchorRect: rect,
      teacher,
      course,
      week,
    });
  };

  const handleCellDoubleClick = (
    e: React.MouseEvent,
    teacher: Teacher,
    course: CourseAssignment,
    week: SemesterWeek
  ) => {
    e.preventDefault();
    e.stopPropagation();
    if (!onUpdateCourse) return;

    const isPaused = (course.pauseIntervals || []).some(
      (p) =>
        p.fromDate &&
        p.toDate &&
        p.fromDate <= week.sundayDateStr &&
        p.toDate >= week.mondayDateStr
    );

    let newPause: CoursePauseInterval[];
    if (isPaused) {
      newPause = (course.pauseIntervals || []).filter(
        (p) =>
          !(
            p.fromDate &&
            p.toDate &&
            p.fromDate <= week.sundayDateStr &&
            p.toDate >= week.mondayDateStr
          )
      );
      if (onToast) onToast(`▶️ Đã hủy tạm ngưng ${week.weekLabel} cho môn "${course.subjectName}"`);
    } else {
      newPause = [
        ...(course.pauseIntervals || []),
        {
          id: `pause-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          fromDate: week.mondayDateStr,
          toDate: week.sundayDateStr,
          session: 'ALL',
          reason: `Nghỉ ${week.weekLabel}`,
        },
      ];
      if (onToast) {
        onToast(
          `⏸️ Đã tạm ngưng cả ngày ${week.weekLabel} cho môn "${course.subjectName}". (Click 1 lần vào ô nếu muốn chỉnh ngưng Sáng hoặc Chiều)`
        );
      }
    }

    onUpdateCourse(teacher.id, course.id, { pauseIntervals: newPause });
    setPopoverData(null);
  };

  const renderWeekCell = (
    teacher: Teacher,
    course: CourseAssignment,
    week: SemesterWeek,
    schedule?: CourseGanttSchedule
  ) => {
    const cell = schedule?.cells.find((c) => c.weekIndex === week.weekIndex);
    const isCurrent = week.isCurrentWeek;
    const isBeingDragged = dragState?.courseId === course.id;

    // Ghost preview bar when dragging
    let isGhostWeek = false;
    if (isBeingDragged && dragState && dragState.deltaWeeks !== 0 && schedule) {
      const originalWeekIdx = week.weekIndex - dragState.deltaWeeks;
      const originalCell = schedule.cells.find((c) => c.weekIndex === originalWeekIdx);
      if (originalCell?.isInSpan) {
        isGhostWeek = true;
      }
    }

    if (!cell || !cell.isInSpan) {
      return (
        <td
          key={week.weekIndex}
          onClick={(e) => handleCellClick(e, teacher, course, week)}
          className={`border-r border-slate-200 p-0 text-center relative group/empty cursor-pointer transition-colors ${
            isGhostWeek
              ? 'bg-emerald-400/25 border-emerald-400 border-dashed border'
              : isCurrent
              ? 'bg-amber-50/40 hover:bg-emerald-500/15'
              : 'hover:bg-emerald-500/10'
          }`}
          title={`Bấm để mở lịch hoặc đặt bắt đầu dạy từ ${week.weekLabel} (${week.mondayFormatted})`}
        >
          {isGhostWeek ? (
            <div className="h-5 w-full bg-emerald-500/30 border-2 border-dashed border-emerald-600 rounded-xs animate-pulse" />
          ) : (
            <div className="h-5 w-full flex items-center justify-center opacity-0 group-hover/empty:opacity-100 transition-opacity">
              <span className="text-[10px] text-emerald-600 font-bold">+</span>
            </div>
          )}
        </td>
      );
    }

    const isCompletedWeek = cell.status === 'completed';
    const isPartial = cell.status === 'partially_completed';
    const isPauseWeek = !cell.hasSessions || cell.totalHoursInWeek === 0;
    const borderColor = 'border-emerald-700';

    return (
      <td
        key={week.weekIndex}
        onMouseDown={(e) => handleCellMouseDown(e, teacher, course, week)}
        onClick={(e) => handleCellClick(e, teacher, course, week)}
        onDoubleClick={(e) => handleCellDoubleClick(e, teacher, course, week)}
        className={`border-r border-slate-200 p-0 text-center align-middle relative cursor-grab active:cursor-grabbing group/bar select-none ${
          isCurrent ? 'bg-amber-50/50' : ''
        }`}
      >
        <div
          className={`h-5 w-full transition-all border-t-2 border-b-2 ${borderColor} ${
            cell.isStartWeek ? 'border-l-2 rounded-l-md ml-0.5' : 'border-l-0'
          } ${
            cell.isEndWeek ? 'border-r-2 rounded-r-md mr-0.5' : 'border-r-0'
          } ${
            isPauseWeek
              ? 'bg-slate-100 bg-[radial-gradient(#94a3b8_1.2px,transparent_1.2px)] [background-size:5px_5px]'
              : isCompletedWeek
              ? 'bg-[repeating-linear-gradient(45deg,#059669_0,#059669_3px,#10b981_3px,#10b981_6px)]'
              : isPartial
              ? 'bg-gradient-to-r from-emerald-600 to-white'
              : 'bg-white'
          } group-hover/bar:shadow-sm group-hover/bar:brightness-95`}
          title={
            isPauseWeek
              ? `${course.subjectName} (${course.className})\n${week.weekLabel}: Tạm ngưng dạy / Nghỉ lễ\n(Click để xem · Kéo để dời lịch · Click đúp để mở lại)`
              : `${course.subjectName} (${course.className})\n${week.weekLabel} (${week.mondayFormatted} - ${week.sundayFormatted})\nSố buổi: ${cell.totalSessionsInWeek} buổi (${cell.totalHoursInWeek} tiết)\nĐã dạy: ${cell.completedHoursInWeek} tiết\n(Click để đổi lịch/tạm ngưng · Kéo để dời tuần · Click đúp để tạm ngưng)`
          }
        />
      </td>
    );
  };

  return (
    <div
      className={`space-y-4 animate-in fade-in duration-200 ${
        isFullscreen
          ? 'fixed inset-0 z-50 bg-slate-100 p-4 overflow-y-auto'
          : ''
      }`}
    >
      {/* Top Banner & Legend */}
      <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900">
                Tiến Độ Tuần & Gantt Timeline Học Kỳ
              </h3>
              {currentWeek && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                  Đang ở {currentWeek.weekLabel} ({currentWeek.mondayFormatted} - {currentWeek.sundayFormatted})
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500">
              Kéo mép cột để chỉnh độ rộng (Tất cả cột Tuần tự động co dãn đồng bộ) · Tùy chỉnh ẩn/hiện cột · Xuất file PDF tiếng Việt sắc nét
            </p>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-3 rounded-xs border border-emerald-600 bg-[repeating-linear-gradient(45deg,#059669_0,#059669_2px,#10b981_2px,#10b981_4px)]"></div>
            <span className="text-slate-600 text-[11px] font-medium">Đã hoàn thành (Sọc xanh)</span>
          </div>

          <div className="flex items-center gap-1.5">
            <div className="w-5 h-3 rounded-xs border-2 border-emerald-700 bg-white"></div>
            <span className="text-slate-600 text-[11px] font-medium">Đang / Sắp dạy (Trắng)</span>
          </div>

          <div className="flex items-center gap-1.5">
            <div className="w-5 h-3 rounded-xs border border-slate-300 bg-slate-100 bg-[radial-gradient(#94a3b8_1.2px,transparent_1.2px)] [background-size:5px_5px]"></div>
            <span className="text-slate-600 text-[11px] font-medium">Tạm ngưng / Nghỉ (Xám nhạt)</span>
          </div>

          <div className="flex items-center gap-1.5">
            <div className="w-5 h-3 rounded-xs bg-amber-200 border border-amber-400"></div>
            <span className="text-slate-600 text-[11px] font-medium">Tuần hiện tại</span>
          </div>
        </div>
      </div>

      {/* Interactive UI-to-Data Quick Action Hints */}
      <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-blue-500/10 border border-emerald-500/20 rounded-xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-700 shadow-xs">
        <div className="flex items-center gap-2 font-medium">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="font-semibold text-emerald-950 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            Thao tác trực tiếp trên UI & tự động lưu dữ liệu:
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-600">
          <span className="inline-flex items-center gap-1 bg-white/70 px-2 py-0.5 rounded border border-emerald-200/60 shadow-2xs">
            <span className="text-emerald-700 font-bold">↔️ Kéo thanh tiến độ:</span> Dời lịch tiến/lùi N tuần trực quan
          </span>
          <span className="inline-flex items-center gap-1 bg-white/70 px-2 py-0.5 rounded border border-emerald-200/60 shadow-2xs">
            <span className="text-emerald-700 font-bold">👆 Click vào ô tuần:</span> Mở menu dời lịch, đổi thứ/buổi, chỉnh ngày bắt đầu
          </span>
          <span className="inline-flex items-center gap-1 bg-white/70 px-2 py-0.5 rounded border border-emerald-200/60 shadow-2xs">
            <span className="text-emerald-700 font-bold">⏸️ Nhấp đúp vào ô:</span> Bật/tắt nghỉ tuần (các tuần sau tự động lùi)
          </span>
        </div>
      </div>

      {/* Toolbar: Search, Filters, Column Visibility & Print Controls */}
      <div className="bg-white rounded-xl p-3 border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-2.5">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo tên Giảng viên, Môn học, Lớp..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-8 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Position Filter */}
        <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
          <Filter className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <span className="text-xs text-slate-500 font-medium">Chức vụ:</span>
          <select
            value={selectedPosition}
            onChange={(e) => setSelectedPosition(e.target.value)}
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

        {/* Status Filter */}
        <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
          <span className="text-xs text-slate-500 font-medium">Trạng thái:</span>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
          >
            <option value="ALL">Tất cả</option>
            <option value="Đang dạy">🟢 Đang dạy</option>
            <option value="Đã hoàn thành">✅ Đã hoàn thành</option>
          </select>
        </div>

        {/* Group By Mode Toggle: Teacher vs Class */}
        <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
          <button
            type="button"
            onClick={() => setGroupBy('teacher')}
            className={`px-2.5 py-1 rounded-md font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              groupBy === 'teacher'
                ? 'bg-white text-emerald-800 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Gom nhóm các môn học theo từng Giảng Viên"
          >
            <Users className="w-3.5 h-3.5" />
            <span>Theo GV</span>
          </button>
          <button
            type="button"
            onClick={() => setGroupBy('class')}
            className={`px-2.5 py-1 rounded-md font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              groupBy === 'class'
                ? 'bg-white text-purple-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Gom nhóm các môn học theo Cụm Lớp Chung & Nhóm Con"
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Theo Lớp Chung</span>
          </button>
        </div>

        {/* Parent Class Filter (when groupBy === 'class') */}
        {groupBy === 'class' && (
          <div className="flex items-center gap-1.5 bg-purple-50 border border-purple-200 rounded-lg px-2.5 py-1.5 animate-in fade-in">
            <span className="text-xs text-purple-900 font-bold flex items-center gap-1">
              🏫 Lớp:
            </span>
            <select
              value={selectedParentClass}
              onChange={(e) => setSelectedParentClass(e.target.value)}
              className="bg-transparent text-xs font-bold text-purple-950 focus:outline-none cursor-pointer max-w-[200px] truncate"
            >
              <option value="ALL">Tất cả {classFamilyGroups.length} Cụm Lớp</option>
              {classFamilyGroups.map((f) => (
                <option key={f.parentKey} value={f.parentKey}>
                  {f.parentKey} ({f.subgroups.length} nhóm con · {f.items.length} môn)
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Column Visibility & Width Settings Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsColumnDropdownOpen(!isColumnDropdownOpen)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs ${
              isColumnDropdownOpen
                ? 'bg-slate-800 text-white border-slate-800'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Columns className="w-3.5 h-3.5 text-emerald-600" />
            <span>Tùy chỉnh cột & Độ rộng</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {/* Dropdown Popover */}
          {isColumnDropdownOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-80 bg-white rounded-xl shadow-xl border border-slate-200 p-3.5 z-50 text-xs space-y-3.5 animate-in fade-in zoom-in-95">
              {/* Header */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Cài đặt hiển thị cột Gantt</span>
                </div>
                <button
                  type="button"
                  onClick={handleResetToDefault}
                  className="text-[11px] text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1 cursor-pointer"
                  title="Đặt lại tất cả cột và độ rộng về mặc định ban đầu"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset mặc định</span>
                </button>
              </div>

              {/* Synchronized Week Column Width Control */}
              <div className="bg-emerald-50/60 p-2.5 rounded-lg border border-emerald-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-950 text-xs">
                    Độ rộng các cột Tuần (Đồng bộ)
                  </span>
                  <span className="font-mono font-bold text-emerald-800 bg-white px-1.5 py-0.5 rounded border border-emerald-200 text-[11px]">
                    {colWidths.weekCol}px
                  </span>
                </div>

                <input
                  type="range"
                  min={36}
                  max={130}
                  step={2}
                  value={colWidths.weekCol}
                  onChange={(e) =>
                    setColWidths((prev) => ({
                      ...prev,
                      weekCol: Number(e.target.value),
                    }))
                  }
                  className="w-full accent-emerald-600 cursor-pointer h-1.5 bg-emerald-200 rounded-lg"
                />

                <div className="flex items-center justify-between text-[10px] text-emerald-700">
                  <button
                    type="button"
                    onClick={() => setColWidths((prev) => ({ ...prev, weekCol: 42 }))}
                    className="hover:underline cursor-pointer"
                  >
                    Gọn (42px)
                  </button>
                  <button
                    type="button"
                    onClick={() => setColWidths((prev) => ({ ...prev, weekCol: 58 }))}
                    className="hover:underline cursor-pointer font-bold"
                  >
                    Chuẩn (58px)
                  </button>
                  <button
                    type="button"
                    onClick={() => setColWidths((prev) => ({ ...prev, weekCol: 85 }))}
                    className="hover:underline cursor-pointer"
                  >
                    Rộng (85px)
                  </button>
                  <button
                    type="button"
                    onClick={() => setColWidths((prev) => ({ ...prev, weekCol: 110 }))}
                    className="hover:underline cursor-pointer"
                  >
                    Lớn (110px)
                  </button>
                </div>
              </div>

              {/* Column Visibility Checkboxes */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-slate-500 font-semibold text-[11px] uppercase tracking-wider">
                  <span>Chọn cột hiển thị</span>
                  <button
                    type="button"
                    onClick={handleShowAllColumns}
                    className="text-emerald-600 hover:underline cursor-pointer lowercase"
                  >
                    Hiện tất cả
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-1.5 pt-1">
                  {[
                    { key: 'stt' as const, label: 'STT' },
                    { key: 'teacher' as const, label: 'Giảng viên' },
                    { key: 'position' as const, label: 'Chức vụ' },
                    { key: 'subject' as const, label: 'Môn học' },
                    { key: 'class' as const, label: 'Lớp' },
                    { key: 'lt' as const, label: 'Lý thuyết (LT)' },
                    { key: 'th' as const, label: 'Thực hành (TH)' },
                    { key: 'total' as const, label: 'Tổng số tiết' },
                    { key: 'progress' as const, label: 'Đã dạy / %' },
                  ].map(({ key, label }) => (
                    <label
                      key={key}
                      className="flex items-center gap-2 p-1.5 rounded-md hover:bg-slate-50 cursor-pointer text-slate-700 select-none"
                    >
                      <input
                        type="checkbox"
                        checked={colVisibility[key]}
                        onChange={() => toggleColumn(key)}
                        className="rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                      />
                      <span className={colVisibility[key] ? 'font-medium' : 'text-slate-400'}>
                        {label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] text-slate-400">
                  Tự động lưu cấu hình
                </span>
                <button
                  type="button"
                  onClick={() => setIsColumnDropdownOpen(false)}
                  className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-md text-[11px] cursor-pointer"
                >
                  Xong
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Standalone Reset Button */}
        <button
          type="button"
          onClick={handleResetToDefault}
          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
          title="Đặt lại kích thước và hiển thị cột về mặc định"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        {/* View Mode & Fit-to-Screen Panorama Controls Group */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-50/90 p-1 rounded-lg border border-slate-200/80">
          {/* Week Range Filter */}
          <div className="flex items-center gap-1 text-xs">
            <CalendarRange className="w-3.5 h-3.5 text-slate-500 ml-1" />
            <select
              value={weekRangeFilter}
              onChange={(e) => setWeekRangeFilter(e.target.value as any)}
              className="bg-transparent text-xs font-bold text-slate-700 focus:outline-none cursor-pointer pr-1 py-0.5"
              title="Lọc phạm vi tuần hiển thị"
            >
              <option value="WEEK_20">📅 Chuẩn 20 tuần học kỳ (Tuần 1 - 20)</option>
              <option value="ALL">🌐 Tất cả {semesterWeeks.length} tuần</option>
              <option value="FIRST_HALF">
                ◀️ Nửa đầu kỳ (T{semesterWeeks[0]?.weekNumber ?? 1} - T
                {semesterWeeks[Math.ceil(semesterWeeks.length / 2) - 1]?.weekNumber ?? Math.ceil(semesterWeeks.length / 2)})
              </option>
              <option value="SECOND_HALF">
                ▶️ Nửa sau kỳ (T
                {semesterWeeks[Math.ceil(semesterWeeks.length / 2)]?.weekNumber ?? Math.ceil(semesterWeeks.length / 2) + 1} - T
                {semesterWeeks[semesterWeeks.length - 1]?.weekNumber ?? semesterWeeks.length})
              </option>
              <option value="CURRENT_WINDOW">
                🎯 Tuần hiện tại (±4 tuần)
              </option>
            </select>
          </div>

          <div className="h-4 w-px bg-slate-200" />

          {/* 1-Click Fit to Screen Toggle Button */}
          <button
            type="button"
            onClick={() => setIsFitToScreen(!isFitToScreen)}
            className={`px-2.5 py-1 rounded-md text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs ${
              isFitToScreen
                ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-500/20'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
            title="Tự động co dãn tất cả cột tuần để vừa trọn 100% màn hình, không cần cuộn ngang"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>Vừa màn hình (Fit)</span>
            {isFitToScreen && (
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            )}
          </button>

          {/* Quick Density Presets */}
          <div className="hidden xl:flex items-center gap-1 text-[11px]">
            <button
              type="button"
              onClick={() => handleApplyPreset('compact')}
              className={`px-1.5 py-0.5 rounded cursor-pointer ${
                !isFitToScreen && activeColWidths.weekCol <= 28
                  ? 'bg-emerald-100 text-emerald-800 font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
              title="Chế độ siêu gọn (24px/tuần) để nhìn trọn học kỳ"
            >
              Siêu gọn
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset('standard')}
              className={`px-1.5 py-0.5 rounded cursor-pointer ${
                !isFitToScreen && activeColWidths.weekCol > 28 && activeColWidths.weekCol <= 55
                  ? 'bg-emerald-100 text-emerald-800 font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
              title="Chế độ chuẩn (42px/tuần)"
            >
              Chuẩn
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset('wide')}
              className={`px-1.5 py-0.5 rounded cursor-pointer ${
                !isFitToScreen && activeColWidths.weekCol > 55
                  ? 'bg-emerald-100 text-emerald-800 font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
              title="Chế độ rộng (75px/tuần)"
            >
              Rộng
            </button>
          </div>

          {/* Zoom In / Out Buttons */}
          <div className="flex items-center bg-white border border-slate-200 rounded-md p-0.5">
            <button
              type="button"
              onClick={() => handleZoom('out')}
              className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded cursor-pointer transition-colors"
              title="Thu nhỏ độ rộng cột tuần"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] font-mono font-bold text-slate-700 px-1 select-none">
              {activeColWidths.weekCol}px
            </span>
            <button
              type="button"
              onClick={() => handleZoom('in')}
              className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded cursor-pointer transition-colors"
              title="Phóng to độ rộng cột tuần"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Toggle Fullscreen */}
          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className={`p-1 rounded-md cursor-pointer transition-colors ${
              isFullscreen
                ? 'bg-slate-800 text-white'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
            title={isFullscreen ? 'Thoát toàn màn hình (ESC)' : 'Xem toàn màn hình'}
          >
            {isFullscreen ? (
              <Minimize2 className="w-3.5 h-3.5" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5" />
            )}
          </button>
        </div>

        {/* Co-teaching Scanner Button */}
        {onUpdateTeachers && (
          <button
            type="button"
            onClick={() => setIsCoTeachingModalOpen(true)}
            className="px-3 py-1.5 bg-gradient-to-r from-purple-700 via-indigo-700 to-slate-800 hover:from-purple-600 hover:to-indigo-600 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
            title="Quét và nối tiếp các môn học có 2+ giảng viên cùng dạy trên 1 lớp"
          >
            <Users className="w-3.5 h-3.5 text-amber-300" />
            <span>Môn Đồng Giảng (2 GV)</span>
            {overlappingCoTeachingCount > 0 ? (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-400 text-amber-950 text-[10px] font-black animate-pulse">
                {overlappingCoTeachingCount}
              </span>
            ) : coTeachingGroups.length > 0 ? (
              <span className="px-1.5 py-0.2 rounded-full bg-purple-400/30 text-purple-200 text-[10px] font-bold">
                {coTeachingGroups.length}
              </span>
            ) : null}
          </button>
        )}

        {/* PDF Preview & Download Button */}
        <button
          type="button"
          onClick={() => setLocalIsPrintOpen(true)}
          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors ml-auto sm:ml-0"
          title="Xem trước bản in và xuất file PDF chất lượng cao"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>Xem & In PDF</span>
        </button>
      </div>

      {/* Fullscreen Header Banner when active */}
      {isFullscreen && (
        <div className="bg-slate-900 text-white px-4 py-2.5 rounded-xl flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm">⛶ Chế độ Toàn Màn Hình - Bảng Tiến Độ Tuần</span>
            <span className="text-xs text-slate-400">
              (Hiển thị tối đa không gian màn hình · Nhấn ESC hoặc nút bên phải để thoát)
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsFullscreen(false)}
            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <Minimize2 className="w-3.5 h-3.5" />
            <span>Thoát Toàn Màn Hình (ESC)</span>
          </button>
        </div>
      )}

      {/* Main Gantt Table Container with Draggable Resizers */}
      <div
        ref={containerRef}
        className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
      >
        <div className="overflow-x-auto max-h-[75vh]">
          <table className="w-full border-collapse text-xs text-slate-700 table-fixed">
            {/* Column Width Definitions */}
            <colgroup>
              {colVisibility.stt && <col style={{ width: `${activeColWidths.stt}px` }} />}

              {groupBy === 'teacher' ? (
                <>
                  {colVisibility.teacher && <col style={{ width: `${activeColWidths.teacher}px` }} />}
                  {colVisibility.position && <col style={{ width: `${activeColWidths.position}px` }} />}
                  {colVisibility.subject && <col style={{ width: `${activeColWidths.subject}px` }} />}
                  {colVisibility.class && <col style={{ width: `${activeColWidths.class}px` }} />}
                </>
              ) : (
                <>
                  {colVisibility.class && <col style={{ width: `${activeColWidths.class}px` }} />}
                  {colVisibility.subject && <col style={{ width: `${activeColWidths.subject}px` }} />}
                  {colVisibility.teacher && <col style={{ width: `${activeColWidths.teacher}px` }} />}
                  {colVisibility.position && <col style={{ width: `${activeColWidths.position}px` }} />}
                </>
              )}

              {colVisibility.lt && <col style={{ width: `${activeColWidths.lt}px` }} />}
              {colVisibility.th && <col style={{ width: `${activeColWidths.th}px` }} />}
              {colVisibility.total && <col style={{ width: `${activeColWidths.total}px` }} />}
              {colVisibility.progress && <col style={{ width: `${activeColWidths.progress}px` }} />}

              {/* Synchronized Week Columns Widths */}
              {displayedWeeks.map((week) => (
                <col key={week.weekIndex} style={{ width: `${activeColWidths.weekCol}px` }} />
              ))}
            </colgroup>

            {/* Table Header matching the user's uploaded image exactly */}
            <thead className="bg-slate-200/95 text-slate-800 font-bold sticky top-0 z-30 shadow-xs select-none">
              {/* Row 1: Left static columns + "Tuần 1", "Tuần 2"... */}
              <tr className="border-b border-slate-300">
                {colVisibility.stt && (
                  <th
                    rowSpan={3}
                    style={{ width: activeColWidths.stt, left: sttStickyLeft }}
                    className="py-2 px-1 text-center bg-slate-200 border-r border-slate-300 sticky z-40 relative group"
                  >
                    <span>STT</span>
                    {/* Resizer Handle */}
                    <div
                      onMouseDown={(e) => startResize('stt', e)}
                      className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-emerald-500 active:bg-emerald-600 transition-colors z-50"
                      title="Kéo để chỉnh độ rộng"
                    />
                  </th>
                )}

                {groupBy === 'teacher' ? (
                  <>
                    {colVisibility.teacher && (
                      <th
                        rowSpan={3}
                        style={{ width: activeColWidths.teacher, left: teacherStickyLeft }}
                        className="py-2 px-2 text-left bg-slate-200 border-r border-slate-300 sticky z-40 relative group"
                      >
                        <span>Giảng Viên</span>
                        <div
                          onMouseDown={(e) => startResize('teacher', e)}
                          className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-emerald-500 active:bg-emerald-600 transition-colors z-50"
                          title="Kéo để chỉnh độ rộng"
                        />
                      </th>
                    )}

                    {colVisibility.position && (
                      <th
                        rowSpan={3}
                        style={{ width: activeColWidths.position }}
                        className="py-2 px-2 text-center bg-slate-200 border-r border-slate-300 relative group"
                      >
                        <span>Chức Vụ</span>
                        <div
                          onMouseDown={(e) => startResize('position', e)}
                          className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-emerald-500 active:bg-emerald-600 transition-colors z-50"
                          title="Kéo để chỉnh độ rộng"
                        />
                      </th>
                    )}

                    {colVisibility.subject && (
                      <th
                        rowSpan={3}
                        style={{ width: activeColWidths.subject }}
                        className="py-2 px-2 text-left bg-slate-200 border-r border-slate-300 relative group"
                      >
                        <span>Môn Học</span>
                        <div
                          onMouseDown={(e) => startResize('subject', e)}
                          className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-emerald-500 active:bg-emerald-600 transition-colors z-50"
                          title="Kéo để chỉnh độ rộng"
                        />
                      </th>
                    )}

                    {colVisibility.class && (
                      <th
                        rowSpan={3}
                        style={{ width: activeColWidths.class }}
                        className="py-2 px-1 text-center bg-slate-200 border-r border-slate-300 relative group"
                      >
                        <span>Lớp</span>
                        <div
                          onMouseDown={(e) => startResize('class', e)}
                          className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-emerald-500 active:bg-emerald-600 transition-colors z-50"
                          title="Kéo để chỉnh độ rộng"
                        />
                      </th>
                    )}
                  </>
                ) : (
                  <>
                    {colVisibility.class && (
                      <th
                        rowSpan={3}
                        style={{ width: activeColWidths.class, left: classStickyLeft }}
                        className="py-2 px-2 text-left bg-slate-200 border-r border-slate-300 sticky z-40 relative group"
                      >
                        <span>Lớp Học</span>
                        <div
                          onMouseDown={(e) => startResize('class', e)}
                          className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-emerald-500 active:bg-emerald-600 transition-colors z-50"
                          title="Kéo để chỉnh độ rộng"
                        />
                      </th>
                    )}

                    {colVisibility.subject && (
                      <th
                        rowSpan={3}
                        style={{ width: activeColWidths.subject }}
                        className="py-2 px-2 text-left bg-slate-200 border-r border-slate-300 relative group"
                      >
                        <span>Môn Học</span>
                        <div
                          onMouseDown={(e) => startResize('subject', e)}
                          className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-emerald-500 active:bg-emerald-600 transition-colors z-50"
                          title="Kéo để chỉnh độ rộng"
                        />
                      </th>
                    )}

                    {colVisibility.teacher && (
                      <th
                        rowSpan={3}
                        style={{ width: activeColWidths.teacher }}
                        className="py-2 px-2 text-left bg-slate-200 border-r border-slate-300 relative group"
                      >
                        <span>Giảng Viên</span>
                        <div
                          onMouseDown={(e) => startResize('teacher', e)}
                          className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-emerald-500 active:bg-emerald-600 transition-colors z-50"
                          title="Kéo để chỉnh độ rộng"
                        />
                      </th>
                    )}

                    {colVisibility.position && (
                      <th
                        rowSpan={3}
                        style={{ width: activeColWidths.position }}
                        className="py-2 px-2 text-center bg-slate-200 border-r border-slate-300 relative group"
                      >
                        <span>Chức Vụ</span>
                        <div
                          onMouseDown={(e) => startResize('position', e)}
                          className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-emerald-500 active:bg-emerald-600 transition-colors z-50"
                          title="Kéo để chỉnh độ rộng"
                        />
                      </th>
                    )}
                  </>
                )}

                {colVisibility.lt && (
                  <th
                    rowSpan={3}
                    style={{ width: activeColWidths.lt }}
                    className="py-2 px-1 text-center bg-slate-200 border-r border-slate-300 relative group"
                  >
                    <span>LT</span>
                    <div
                      onMouseDown={(e) => startResize('lt', e)}
                      className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-emerald-500 active:bg-emerald-600 transition-colors z-50"
                      title="Kéo để chỉnh độ rộng"
                    />
                  </th>
                )}

                {colVisibility.th && (
                  <th
                    rowSpan={3}
                    style={{ width: activeColWidths.th }}
                    className="py-2 px-1 text-center bg-slate-200 border-r border-slate-300 relative group"
                  >
                    <span>TH</span>
                    <div
                      onMouseDown={(e) => startResize('th', e)}
                      className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-emerald-500 active:bg-emerald-600 transition-colors z-50"
                      title="Kéo để chỉnh độ rộng"
                    />
                  </th>
                )}

                {colVisibility.total && (
                  <th
                    rowSpan={3}
                    style={{ width: activeColWidths.total }}
                    className="py-2 px-1 text-center bg-slate-200 border-r border-slate-300 relative group"
                  >
                    <span>Tổng</span>
                    <div
                      onMouseDown={(e) => startResize('total', e)}
                      className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-emerald-500 active:bg-emerald-600 transition-colors z-50"
                      title="Kéo để chỉnh độ rộng"
                    />
                  </th>
                )}

                {colVisibility.progress && (
                  <th
                    rowSpan={3}
                    style={{ width: activeColWidths.progress }}
                    className="py-2 px-1.5 text-center bg-slate-200 border-r-2 border-slate-400 relative group"
                  >
                    <span>Đã dạy</span>
                    <div
                      onMouseDown={(e) => startResize('progress', e)}
                      className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-emerald-500 active:bg-emerald-600 transition-colors z-50"
                      title="Kéo để chỉnh độ rộng"
                    />
                  </th>
                )}

                {/* Week Columns Header: Row 1 (Tuần 1, Tuần 2...) */}
                {displayedWeeks.map((week) => {
                  const wCol = activeColWidths.weekCol;
                  const label =
                    wCol < 28
                      ? String(week.weekNumber)
                      : wCol < 48
                      ? `T${week.weekNumber}`
                      : week.weekLabel;

                  return (
                    <th
                      key={week.weekIndex}
                      style={{ width: activeColWidths.weekCol }}
                      className={`py-1 px-0.5 text-center border-r border-slate-300 text-xs font-bold transition-colors relative group ${
                        week.isCurrentWeek
                          ? 'bg-amber-200 text-amber-950 font-extrabold'
                          : 'bg-slate-200 text-slate-800'
                      }`}
                      title={`${week.weekLabel} (${week.mondayFormatted} - ${week.sundayFormatted})`}
                    >
                      <span className="truncate block select-none">{label}</span>
                      <div
                        onMouseDown={(e) => startResize('weekCol', e)}
                        className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-emerald-500 active:bg-emerald-600 transition-colors z-50"
                        title="Kéo để chỉnh độ rộng (Tất cả cột Tuần co dãn đồng bộ)"
                      />
                    </th>
                  );
                })}
              </tr>

              {/* Row 2: Monday Date (07/09, 14/09, 21/09...) */}
              <tr className="border-b border-slate-300">
                {displayedWeeks.map((week) => {
                  const wCol = activeColWidths.weekCol;
                  const monLabel =
                    wCol < 28
                      ? week.mondayFormatted.split('/')[0]
                      : week.mondayFormatted;

                  return (
                    <th
                      key={`mon-${week.weekIndex}`}
                      style={{ width: activeColWidths.weekCol }}
                      className={`py-0.5 px-0.5 text-center border-r border-slate-300 font-mono text-[10px] font-semibold relative group ${
                        week.isCurrentWeek
                          ? 'bg-amber-100/90 text-amber-900 font-bold'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                      title={`Bắt đầu: Thứ Hai ${week.mondayFormatted}`}
                    >
                      <span className="truncate block select-none">{monLabel}</span>
                      <div
                        onMouseDown={(e) => startResize('weekCol', e)}
                        className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-emerald-500 active:bg-emerald-600 transition-colors z-50"
                        title="Kéo để chỉnh độ rộng (Tất cả cột Tuần co dãn đồng bộ)"
                      />
                    </th>
                  );
                })}
              </tr>

              {/* Row 3: Sunday Date (13/09, 20/09, 27/09...) */}
              <tr className="border-b-2 border-slate-400">
                {displayedWeeks.map((week) => {
                  const wCol = activeColWidths.weekCol;
                  const sunLabel =
                    wCol < 28
                      ? week.sundayFormatted.split('/')[0]
                      : week.sundayFormatted;

                  return (
                    <th
                      key={`sun-${week.weekIndex}`}
                      style={{ width: activeColWidths.weekCol }}
                      className={`py-0.5 px-0.5 text-center border-r border-slate-300 font-mono text-[10px] font-medium relative group ${
                        week.isCurrentWeek
                          ? 'bg-amber-100/90 text-amber-900 font-bold'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                      title={`Kết thúc: Chủ Nhật ${week.sundayFormatted}`}
                    >
                      <span className="truncate block select-none">{sunLabel}</span>
                      <div
                        onMouseDown={(e) => startResize('weekCol', e)}
                        className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-emerald-500 active:bg-emerald-600 transition-colors z-50"
                        title="Kéo để chỉnh độ rộng (Tất cả cột Tuần co dãn đồng bộ)"
                      />
                    </th>
                  );
                })}
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-slate-200">
              {groupBy === 'class' ? (
                filteredFamilyGroups.length === 0 ? (
                  <tr>
                    <td
                      colSpan={visibleStaticCount + displayedWeeks.length}
                      className="py-12 text-center text-slate-400 italic"
                    >
                      Không tìm thấy lớp học hoặc môn học nào phù hợp với bộ lọc.
                    </td>
                  </tr>
                ) : (
                  filteredFamilyGroups.map((family, familyIdx) => {
                    const isCollapsed = Boolean(collapsedParentClasses[family.parentKey]);
                    const currentSubTab = parentSubgroupTabs[family.parentKey] || 'ALL';

                    // Filter items displayed according to selected subgroup tab
                    const displayedItems = family.items.filter((item) => {
                      if (currentSubTab === 'ALL') return true;
                      return item.childClass === currentSubTab;
                    });

                    return (
                      <React.Fragment key={`family-${family.parentKey}`}>
                        {/* Parent Class Section Header Banner */}
                        <tr className="bg-gradient-to-r from-purple-100/90 via-purple-50 to-white text-purple-950 font-bold border-t-2 border-b border-purple-300 select-none sticky z-20">
                          <td
                            colSpan={visibleStaticCount + displayedWeeks.length}
                            className="py-2 px-3 shadow-2xs"
                          >
                            <div className="flex items-center justify-between gap-3 flex-wrap">
                              {/* Left: Parent Name & Details */}
                              <div className="flex items-center gap-2 flex-wrap">
                                <button
                                  type="button"
                                  onClick={() => toggleParentCollapse(family.parentKey)}
                                  className="p-1 rounded-md hover:bg-purple-200 text-purple-800 cursor-pointer transition-colors"
                                  title={isCollapsed ? 'Mở rộng cụm lớp này' : 'Thu gọn cụm lớp này'}
                                >
                                  {isCollapsed ? (
                                    <ChevronRight className="w-4 h-4 text-purple-800" />
                                  ) : (
                                    <ChevronDown className="w-4 h-4 text-purple-800" />
                                  )}
                                </button>

                                <span className="font-mono text-xs sm:text-sm font-black text-purple-950 bg-white px-2.5 py-0.5 rounded-md border border-purple-300 shadow-2xs">
                                  🏫 CỤM LỚP CHUNG: {family.parentKey}
                                </span>

                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-200/80 text-purple-900 border border-purple-300">
                                  {family.subgroups.length} Lớp con: {family.subgroups.join(', ')}
                                </span>

                                {family.major && (
                                  <span className="text-[11px] text-purple-900 font-medium hidden md:inline">
                                    · {family.major}
                                  </span>
                                )}

                                {family.studentCount && (
                                  <span className="text-[11px] text-sky-800 font-semibold hidden sm:inline">
                                    ({family.studentCount} SV)
                                  </span>
                                )}
                              </div>

                              {/* Right: Subgroup Filters & Hours Summary */}
                              <div className="flex items-center gap-2 flex-wrap">
                                {family.subgroups.length > 1 && (
                                  <div className="flex items-center gap-1 bg-white/90 p-0.5 rounded-lg border border-purple-200 text-[11px]">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setParentSubgroupTabs((prev) => ({
                                          ...prev,
                                          [family.parentKey]: 'ALL',
                                        }))
                                      }
                                      className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-all ${
                                        currentSubTab === 'ALL'
                                          ? 'bg-purple-700 text-white shadow-2xs'
                                          : 'text-purple-900 hover:bg-purple-100'
                                      }`}
                                    >
                                      Tất cả ({family.items.length})
                                    </button>
                                    {family.subgroups.map((sub, sIdx) => {
                                      const count = family.items.filter((i) => i.childClass === sub).length;
                                      return (
                                        <button
                                          key={sub}
                                          type="button"
                                          onClick={() =>
                                            setParentSubgroupTabs((prev) => ({
                                              ...prev,
                                              [family.parentKey]: sub,
                                            }))
                                          }
                                          className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono cursor-pointer transition-all ${
                                            currentSubTab === sub
                                              ? 'bg-purple-700 text-white shadow-2xs'
                                              : 'text-purple-900 hover:bg-purple-100'
                                          }`}
                                        >
                                          Nhóm {sIdx + 1}: {sub} ({count})
                                        </button>
                                      );
                                    })}
                                  </div>
                                )}

                                <span className="text-[11px] px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-900 font-bold border border-emerald-300">
                                  {family.items.length} môn · {family.totalHours} tiết ({family.totalTheoryHours} LT + {family.totalPracticeHours} TH)
                                </span>
                              </div>
                            </div>
                          </td>
                        </tr>

                        {/* Course Rows */}
                        {!isCollapsed &&
                          (displayedItems.length === 0 ? (
                            <tr>
                              <td
                                colSpan={visibleStaticCount + semesterWeeks.length}
                                className="py-4 text-center text-slate-400 italic bg-slate-50/50"
                              >
                                Không có môn học nào trong nhóm con này.
                              </td>
                            </tr>
                          ) : (
                            displayedItems.map((item, itemIdx) => {
                              const { teacher, course, childClass } = item;
                              const totalHours = (course.theoryHours || 0) + (course.practiceHours || 0);
                              const completed = course.completedHours || 0;
                              const isDone = completed >= totalHours && totalHours > 0;
                              const schedule = courseSchedulesMap.get(course.id);
                              const badgeStyle = getSubgroupBadgeStyle(childClass, family.subgroups);

                              return (
                                <tr
                                  key={`${childClass}-${course.id}`}
                                  className={`border-b border-slate-200 transition-colors ${
                                    itemIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'
                                  } hover:bg-slate-100/70`}
                                >
                                  {/* STT */}
                                  {colVisibility.stt && (
                                    <td
                                      style={{ left: sttStickyLeft }}
                                      className="py-2.5 px-1 text-center font-bold text-slate-500 bg-white border-r border-slate-200 sticky z-10"
                                    >
                                      <span>{itemIdx + 1}</span>
                                    </td>
                                  )}

                                  {/* Child Class Column */}
                                  {colVisibility.class && (
                                    <td
                                      style={{ left: classStickyLeft }}
                                      className="py-2.5 px-2 bg-white border-r border-slate-200 sticky z-10"
                                    >
                                      <div className="flex items-center gap-1">
                                        <span
                                          className={`font-mono font-bold text-xs px-2 py-0.5 rounded border shadow-2xs ${badgeStyle}`}
                                          title={`Lớp con thuộc cụm ${family.parentKey}`}
                                        >
                                          {childClass}
                                        </span>
                                      </div>
                                    </td>
                                  )}

                                  {/* Subject Name */}
                                  {colVisibility.subject && (
                                    <td className="py-2 px-2 font-semibold text-slate-900 border-r border-slate-200">
                                      <div
                                        onClick={() => onEditCourse && onEditCourse(teacher, course)}
                                        className="hover:text-emerald-700 cursor-pointer truncate font-bold flex items-center gap-1.5"
                                        title={`${course.subjectName}${course.mergeRemainderHours ? ' (⭐ Đã bật dồn tiết lẻ vào buổi cuối)' : ''}`}
                                      >
                                        <span className="truncate">{course.subjectName}</span>
                                        {course.mergeRemainderHours && (
                                          <span
                                            className="inline-flex items-center text-amber-500 hover:text-amber-600 transition-transform hover:scale-125 shrink-0"
                                            title="⭐ Môn này đã bật cộng dồn số tiết lẻ vào buổi cuối cùng cho biểu đồ Gantt"
                                          >
                                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500 drop-shadow-[0_0_4px_rgba(245,158,11,0.7)] animate-pulse" />
                                          </span>
                                        )}
                                      </div>
                                      <div className="flex flex-wrap items-center gap-1 text-[10px] text-slate-400 font-mono">
                                        {course.subjectCode && <span>{course.subjectCode}</span>}
                                        {(() => {
                                          const validPhases = (course.schedulePhases || []).filter(
                                            (p) => p.fromDate && p.scheduleSlots && p.scheduleSlots.length > 0
                                          );
                                          if (validPhases.length > 0) {
                                            return (
                                              <span
                                                className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-purple-100 text-purple-900 border border-purple-300 flex items-center gap-0.5 cursor-pointer hover:bg-purple-200 transition-colors"
                                                onClick={() => onEditCourse && onEditCourse(teacher, course)}
                                                title={`Đổi buổi theo giai đoạn: ${formatCourseScheduleSummary(course.scheduleSlots, validPhases)} (Click để sửa)`}
                                              >
                                                <span>{formatSlotSummary(course.scheduleSlots)}</span>
                                                <span className="text-purple-600 font-bold">➔</span>
                                                <span>{validPhases.map((p) => formatSlotSummary(p.scheduleSlots)).join(' ➔ ')}</span>
                                              </span>
                                            );
                                          }
                                          if (course.scheduleSlots && course.scheduleSlots.length > 0) {
                                            return (
                                              <span
                                                className="px-1 py-0.2 rounded text-[9px] font-bold bg-amber-50 text-amber-800 border border-amber-200"
                                                title={`Buổi dạy: ${(course.scheduleSlots || []).join(', ')}`}
                                              >
                                                {formatSlotSummary(course.scheduleSlots)}
                                              </span>
                                            );
                                          }
                                          return null;
                                        })()}
                                        {(() => {
                                          const coGroup = coTeachingGroups.find(
                                            (g) =>
                                              g.className.toUpperCase() === course.className.toUpperCase() &&
                                              g.items.some((it) => it.course.id === course.id)
                                          );
                                          if (!coGroup || coGroup.items.length < 2) return null;
                                          const coItem = coGroup.items.find((it) => it.course.id === course.id);
                                          const phaseNum = coItem?.phase || course.sequentialPhase;
                                          return (
                                            <span
                                              className={`px-1 py-0.2 rounded text-[9px] font-bold ${
                                                phaseNum === 1
                                                  ? 'bg-purple-100 text-purple-800 border border-purple-200'
                                                  : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                              }`}
                                            >
                                              {phaseNum === 1 ? 'Đợt 1' : 'Đợt 2 (Nối tiếp)'}
                                            </span>
                                          );
                                        })()}
                                      </div>
                                    </td>
                                  )}

                                  {/* Teacher Name */}
                                  {colVisibility.teacher && (
                                    <td className="py-2 px-2 border-r border-slate-200">
                                      <div className="font-bold text-slate-900 truncate" title={teacher.name}>
                                        {teacher.name}
                                      </div>
                                    </td>
                                  )}

                                  {/* Position */}
                                  {colVisibility.position && (
                                    <td className="py-2 px-1.5 text-center border-r border-slate-200 text-[10px]">
                                      <span
                                        className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                                          teacher.position?.includes('Cơ hữu')
                                            ? 'bg-blue-100 text-blue-800'
                                            : 'bg-amber-100 text-amber-800'
                                        }`}
                                      >
                                        {teacher.position}
                                      </span>
                                    </td>
                                  )}

                                  {/* LT */}
                                  {colVisibility.lt && (
                                    <td className="py-2 px-1 text-center font-medium text-slate-600 border-r border-slate-200">
                                      {course.theoryHours}
                                    </td>
                                  )}

                                  {/* TH */}
                                  {colVisibility.th && (
                                    <td className="py-2 px-1 text-center font-medium text-slate-600 border-r border-slate-200">
                                      {course.practiceHours}
                                    </td>
                                  )}

                                  {/* Total */}
                                  {colVisibility.total && (
                                    <td className="py-2 px-1 text-center font-bold text-slate-800 border-r border-slate-200">
                                      {totalHours}
                                    </td>
                                  )}

                                  {/* Progress */}
                                  {colVisibility.progress && (
                                    <td className="py-2 px-1.5 text-center border-r-2 border-slate-400">
                                      <span
                                        className={`font-bold text-xs ${
                                          isDone ? 'text-emerald-700 font-extrabold' : 'text-blue-700'
                                        }`}
                                      >
                                        {completed}/{totalHours}h
                                      </span>
                                    </td>
                                  )}

                                  {/* Week Gantt Timeline Cells */}
                                  {displayedWeeks.map((week) =>
                                    renderWeekCell(teacher, course, week, schedule)
                                  )}
                                </tr>
                              );
                            })
                          ))}
                      </React.Fragment>
                    );
                  })
                )
              ) : filteredTeachers.length === 0 ? (
                <tr>
                  <td
                    colSpan={visibleStaticCount + semesterWeeks.length}
                    className="py-12 text-center text-slate-400 italic"
                  >
                    Không tìm thấy giảng viên hoặc môn học nào phù hợp với bộ lọc.
                  </td>
                </tr>
              ) : (
                filteredTeachers.map((teacher, tIdx) => {
                  const courses = teacher.courses && teacher.courses.length > 0 ? teacher.courses : [];
                  const courseCount = courses.length || 1;

                  if (courses.length === 0) {
                    return (
                      <tr key={teacher.id} className="hover:bg-slate-50/60 border-b border-slate-200">
                        {colVisibility.stt && (
                          <td
                            style={{ left: sttStickyLeft }}
                            className="py-2.5 px-1 text-center font-bold text-slate-500 bg-white border-r border-slate-200 sticky z-10"
                          >
                            {tIdx + 1}
                          </td>
                        )}

                        {colVisibility.teacher && (
                          <td
                            style={{ left: teacherStickyLeft }}
                            className="py-2.5 px-2 bg-white border-r border-slate-200 sticky z-10"
                          >
                            <div className="font-bold text-slate-900 truncate">{teacher.name}</div>
                          </td>
                        )}

                        {colVisibility.position && (
                          <td className="py-2.5 px-1.5 text-center border-r border-slate-200">
                            <span className="text-[10px] text-slate-500">{teacher.position}</span>
                          </td>
                        )}

                        {/* Merged empty info columns */}
                        {visibleStaticCount > (colVisibility.stt ? 1 : 0) + (colVisibility.teacher ? 1 : 0) + (colVisibility.position ? 1 : 0) && (
                          <td
                            colSpan={
                              visibleStaticCount -
                              (colVisibility.stt ? 1 : 0) -
                              (colVisibility.teacher ? 1 : 0) -
                              (colVisibility.position ? 1 : 0)
                            }
                            className="py-2.5 px-3 text-slate-400 italic border-r-2 border-slate-400"
                          >
                            Chưa phân công môn học trong kỳ này.
                          </td>
                        )}

                        {displayedWeeks.map((week) => (
                          <td
                            key={week.weekIndex}
                            className={`border-r border-slate-200 ${
                              week.isCurrentWeek ? 'bg-amber-50/40' : ''
                            }`}
                          />
                        ))}
                      </tr>
                    );
                  }

                  return courses.map((course, cIdx) => {
                    const isFirst = cIdx === 0;
                    const totalHours = (course.theoryHours || 0) + (course.practiceHours || 0);
                    const completed = course.completedHours || 0;
                    const isDone = completed >= totalHours && totalHours > 0;

                    const schedule = courseSchedulesMap.get(course.id);

                    return (
                      <tr
                        key={course.id}
                        className={`border-b border-slate-200 transition-colors ${
                          cIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'
                        } hover:bg-slate-100/70`}
                      >
                        {/* Column 1: STT (Merged) */}
                        {colVisibility.stt && isFirst && (
                          <td
                            rowSpan={courseCount}
                            style={{ left: sttStickyLeft }}
                            className="py-2.5 px-1 text-center font-bold text-slate-700 align-top bg-white border-r border-slate-200 sticky z-10"
                          >
                            <span className="pt-1 block">{tIdx + 1}</span>
                          </td>
                        )}

                        {/* Column 2: Teacher Name & Position (Merged) */}
                        {colVisibility.teacher && isFirst && (
                          <td
                            rowSpan={courseCount}
                            style={{ left: teacherStickyLeft }}
                            className="py-2.5 px-2 align-top bg-white border-r border-slate-200 sticky z-10"
                          >
                            <div className="space-y-1 pt-1">
                              <div className="font-bold text-slate-900 leading-snug truncate" title={teacher.name}>
                                {teacher.name}
                              </div>
                              {!colVisibility.position && (
                                <span
                                  className={`inline-block px-1.5 py-0.2 rounded text-[10px] font-semibold ${
                                    teacher.position?.includes('Cơ hữu')
                                      ? 'bg-blue-100 text-blue-800'
                                      : 'bg-amber-100 text-amber-800'
                                  }`}
                                >
                                  {teacher.position}
                                </span>
                              )}
                            </div>
                          </td>
                        )}

                        {/* Column 3: Position (Single or Merged) */}
                        {colVisibility.position && isFirst && (
                          <td
                            rowSpan={courseCount}
                            className="py-2.5 px-1.5 align-top text-center border-r border-slate-200 bg-white"
                          >
                            <span
                              className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold mt-1 ${
                                teacher.position?.includes('Cơ hữu')
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {teacher.position}
                            </span>
                          </td>
                        )}

                        {/* Column 4: Subject Name */}
                        {colVisibility.subject && (
                          <td className="py-2 px-2 font-semibold text-slate-900 border-r border-slate-200">
                            <div
                              onClick={() => onEditCourse && onEditCourse(teacher, course)}
                              className="hover:text-emerald-700 cursor-pointer truncate flex items-center gap-1.5"
                              title={`${course.subjectName}${course.mergeRemainderHours ? ' (⭐ Đã bật dồn tiết lẻ vào buổi cuối)' : ''}`}
                            >
                              <span className="truncate">{course.subjectName}</span>
                              {course.mergeRemainderHours && (
                                <span
                                  className="inline-flex items-center text-amber-500 hover:text-amber-600 transition-transform hover:scale-125 shrink-0"
                                  title="⭐ Môn này đã bật cộng dồn số tiết lẻ vào buổi cuối cùng cho biểu đồ Gantt"
                                >
                                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500 drop-shadow-[0_0_4px_rgba(245,158,11,0.7)] animate-pulse" />
                                </span>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-1 mt-0.5">
                              {(() => {
                                const validPhases = (course.schedulePhases || []).filter(
                                  (p) => p.fromDate && p.scheduleSlots && p.scheduleSlots.length > 0
                                );
                                if (validPhases.length > 0) {
                                  return (
                                    <span
                                      className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-purple-100 text-purple-900 border border-purple-300 flex items-center gap-0.5 cursor-pointer hover:bg-purple-200 transition-colors"
                                      onClick={() => onEditCourse && onEditCourse(teacher, course)}
                                      title={`Đổi buổi theo giai đoạn: ${formatCourseScheduleSummary(course.scheduleSlots, validPhases)} (Click để sửa)`}
                                    >
                                      <span>{formatSlotSummary(course.scheduleSlots)}</span>
                                      <span className="text-purple-600 font-bold">➔</span>
                                      <span>{validPhases.map((p) => formatSlotSummary(p.scheduleSlots)).join(' ➔ ')}</span>
                                    </span>
                                  );
                                }
                                if (course.scheduleSlots && course.scheduleSlots.length > 0) {
                                  return (
                                    <span
                                      className="px-1 py-0.2 rounded text-[9px] font-bold bg-amber-50 text-amber-800 border border-amber-200"
                                      title={`Buổi dạy: ${(course.scheduleSlots || []).join(', ')}`}
                                    >
                                      {formatSlotSummary(course.scheduleSlots)}
                                    </span>
                                  );
                                }
                                return null;
                              })()}
                              {(() => {
                              const coGroup = coTeachingGroups.find(
                                (g) =>
                                  g.className.toUpperCase() === course.className.toUpperCase() &&
                                  g.items.some((it) => it.course.id === course.id)
                              );
                              if (!coGroup || coGroup.items.length < 2) return null;
                              const coItem = coGroup.items.find((it) => it.course.id === course.id);
                              const phaseNum = coItem?.phase || course.sequentialPhase;
                              return (
                                <div className="flex items-center gap-1 mt-0.5">
                                  <span
                                    className={`px-1 py-0.2 rounded text-[9px] font-bold ${
                                      phaseNum === 1
                                        ? 'bg-purple-100 text-purple-800 border border-purple-200'
                                        : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                    }`}
                                  >
                                    {phaseNum === 1 ? 'Đợt 1' : 'Đợt 2 (Nối tiếp)'}
                                  </span>
                                </div>
                              );
                            })()}
                            </div>
                          </td>
                        )}

                        {/* Column 5: Class Name */}
                        {colVisibility.class && (
                          <td className="py-2 px-1 text-center border-r border-slate-200 font-mono font-bold text-[11px] text-slate-700 truncate">
                            {course.className}
                          </td>
                        )}

                        {/* Column 6: LT */}
                        {colVisibility.lt && (
                          <td className="py-2 px-1 text-center text-slate-600 border-r border-slate-200">
                            {course.theoryHours}
                          </td>
                        )}

                        {/* Column 7: TH */}
                        {colVisibility.th && (
                          <td className="py-2 px-1 text-center text-slate-600 border-r border-slate-200">
                            {course.practiceHours}
                          </td>
                        )}

                        {/* Column 8: Total Hours */}
                        {colVisibility.total && (
                          <td className="py-2 px-1 text-center font-bold text-slate-800 border-r border-slate-200">
                            {totalHours}
                          </td>
                        )}

                        {/* Column 9: Completed / % */}
                        {colVisibility.progress && (
                          <td className="py-2 px-1.5 text-center border-r-2 border-slate-400">
                            <span
                              className={`font-bold text-[11px] ${
                                isDone ? 'text-emerald-700 font-extrabold' : 'text-blue-700'
                              }`}
                            >
                              {completed}/{totalHours}h
                            </span>
                          </td>
                        )}

                        {/* Week Gantt Timeline Cells - Continuous Connected Bar with Border */}
                        {displayedWeeks.map((week) =>
                          renderWeekCell(teacher, course, week, schedule)
                        )}
                      </tr>
                    );
                  });
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Floating Drag Indicator Badge following Cursor */}
      {dragState && (
        <div
          style={{
            position: 'fixed',
            left: `${dragState.currentX + 16}px`,
            top: `${dragState.currentY + 16}px`,
            zIndex: 99999,
            pointerEvents: 'none',
          }}
          className="bg-slate-900/95 text-white border-2 border-emerald-500 px-3 py-2 rounded-xl shadow-2xl text-xs backdrop-blur-md flex items-center gap-2.5 animate-in fade-in zoom-in-95"
        >
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          <div className="flex flex-col">
            <span className="font-bold text-slate-100">
              {dragState.courseName} ({dragState.className})
            </span>
            <span className="text-[11px] text-slate-300">
              {dragState.deltaWeeks === 0
                ? '↔️ Kéo sang trái/phải để dời tuần'
                : dragState.deltaWeeks > 0
                ? `⚡ Dời TIẾN +${dragState.deltaWeeks} tuần`
                : `⚡ Dời LÙI ${dragState.deltaWeeks} tuần`}
            </span>
          </div>
          <span
            className={`px-2 py-1 rounded-md text-[11px] font-black ${
              dragState.deltaWeeks === 0
                ? 'bg-slate-800 text-slate-400'
                : dragState.deltaWeeks > 0
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-blue-600 text-white shadow-sm'
            }`}
          >
            {dragState.deltaWeeks === 0
              ? '0 tuần'
              : dragState.deltaWeeks > 0
              ? `+${dragState.deltaWeeks} tuần`
              : `${dragState.deltaWeeks} tuần`}
          </span>
        </div>
      )}

      {/* Interactive Quick Schedule Popover */}
      {popoverData && (
        <GanttQuickSchedulePopover
          isOpen={!!popoverData}
          onClose={() => setPopoverData(null)}
          anchorRect={popoverData.anchorRect}
          teacher={popoverData.teacher}
          course={popoverData.course}
          week={popoverData.week}
          semesterWeeks={semesterWeeks}
          holidays={holidays}
          semester={semester}
          onUpdateCourse={onUpdateCourse || (() => {})}
          onOpenFullEdit={(t, c) => {
            setPopoverData(null);
            if (onEditCourse) onEditCourse(t, c);
          }}
          onToast={onToast || (() => {})}
        />
      )}

      {/* High-Fidelity Printable PDF Preview & Direct Download Modal */}
      <GanttPrintView
        isOpen={isPrintModalOpen}
        onClose={closePrintModal}
        semester={semester}
        filteredTeachers={filteredTeachers}
        holidays={holidays}
        masterClasses={masterClasses}
        coTeachingGroups={coTeachingGroups}
        colVisibility={colVisibility}
        colWidths={colWidths}
        onEditCourse={onEditCourse}
        initialGroupBy={groupBy}
        initialWeekRange={weekRangeFilter === 'ALL' ? 'ALL' : 'WEEK_20'}
      />

      {/* Co-teaching Scanner & Sequential Setup Modal */}
      {onUpdateTeachers && (
        <CoTeachingScannerModal
          isOpen={isCoTeachingModalOpen}
          onClose={() => setIsCoTeachingModalOpen(false)}
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
