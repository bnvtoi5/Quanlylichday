/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Cloud, Loader2 } from 'lucide-react';
import {
  AppState,
  CourseAssignment,
  Holiday,
  MasterClass,
  MasterSubject,
  MasterTeacher,
  Semester,
  SnapshotBackup,
  Teacher,
  TeacherPosition,
  TeachingStatus
} from './types';
import { INITIAL_HOLIDAYS, INITIAL_STATE } from './data/initialData';
import {
  createSemesterSnapshot,
  downloadJsonBackup,
  loadAppState,
  normalizeTeacherPosition,
  sanitizeSemester,
  saveAppState
} from './utils/storage';
import { exportTeachingReportToExcel } from './utils/excelExport';
import { exportGanttPdfDirectly } from './utils/ganttPdfExport';
import { calculateTeachingProgress } from './utils/vietnamTime';
import { autoDetectAndAddParentClasses, ensureChildClassName } from './utils/classGrouping';

import { Navbar } from './components/Navbar';
import { DashboardStats } from './components/DashboardStats';
import { FilterBar } from './components/FilterBar';
import { TeacherTable } from './components/TeacherTable';
import { ClassAssignmentManager } from './components/ClassAssignmentManager';
import { GanttChart } from './components/GanttChart';
import { CatalogManager } from './components/CatalogManager';
import { SemesterModal } from './components/SemesterModal';
import { CustomColumnModal } from './components/CustomColumnModal';
import { HolidayModal } from './components/HolidayModal';
import { TeacherModal } from './components/TeacherModal';
import { CourseModal } from './components/CourseModal';
import { QuickAddCourseModal } from './components/QuickAddCourseModal';
import { BackupModal } from './components/BackupModal';
import { ConfirmModal } from './components/ConfirmModal';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
import {
  SyncStatus,
  fetchInitialCloudState,
  publishFullStateToCloud,
  queueCloudCatalogSync,
  queueCloudSemesterSync,
  subscribeToCloudSemester,
} from './services/cloudSync';

export default function App() {
  // Global Application State (Loaded clean without sample data)
  const [appState, setAppState] = useState<AppState>(() => loadAppState());
  const [isCloudLoading, setIsCloudLoading] = useState(true);
  const isCloudInitializedRef = useRef(false);

  // Firebase Auth & Cloud Sync States
  const [user, setUser] = useState<User | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('synced');
  const [syncMessage, setSyncMessage] = useState<string>('Đang đồng bộ đám mây...');

  // Cloud-First Initialization: Fetch live data from Firestore on every machine startup
  useEffect(() => {
    let isMounted = true;
    fetchInitialCloudState()
      .then((cloudState) => {
        if (!isMounted) return;
        if (cloudState && cloudState.semesters && cloudState.semesters.length > 0) {
          setAppState((prev) => {
            const mergedState: AppState = {
              ...cloudState,
              snapshots: prev.snapshots || [],
            };
            saveAppState(mergedState);
            return mergedState;
          });
          setSyncStatus('synced');
          setSyncMessage('Đã đồng bộ đám mây (Tất cả máy đều thấy)');
        }
        isCloudInitializedRef.current = true;
        setIsCloudLoading(false);
      })
      .catch((err) => {
        console.warn('Initial cloud sync error:', err);
        if (isMounted) {
          isCloudInitializedRef.current = true;
          setIsCloudLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Listen to Firebase Auth state (without downgrading sync status for anonymous/public cloud users)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // Save to localStorage on state changes (Offline-first safety)
  useEffect(() => {
    saveAppState(appState);
  }, [appState]);

  // Current Active Semester
  const activeSemester: Semester = useMemo(() => {
    const found = appState.semesters.find((s) => s.id === appState.activeSemesterId);
    return found || appState.semesters[0] || INITIAL_STATE.semesters[0];
  }, [appState.semesters, appState.activeSemesterId]);

  // Realtime Cloud Listener: Anyone opening on any machine gets live cloud data
  useEffect(() => {
    if (!activeSemester?.id) return;

    const unsubscribe = subscribeToCloudSemester(
      activeSemester.id,
      user,
      (remoteSemester) => {
        const sanitized = sanitizeSemester(remoteSemester);
        setAppState((prev) => {
          const current = prev.semesters.find((s) => s.id === sanitized.id);
          if (current) {
            const curSig = JSON.stringify({
              id: current.id,
              name: current.name,
              teachers: current.teachers,
              customColumns: current.customColumns,
              startDate: current.startDate,
              endDate: current.endDate,
            });
            const remSig = JSON.stringify({
              id: sanitized.id,
              name: sanitized.name,
              teachers: sanitized.teachers,
              customColumns: sanitized.customColumns,
              startDate: sanitized.startDate,
              endDate: sanitized.endDate,
            });
            if (curSig === remSig) {
              return prev; // Return exact same reference: completely skips re-render!
            }
          }

          const exists = prev.semesters.some((s) => s.id === sanitized.id);
          const updatedSemesters = exists
            ? prev.semesters.map((s) => (s.id === sanitized.id ? sanitized : s))
            : [sanitized, ...prev.semesters];
          const nextState = {
            ...prev,
            semesters: updatedSemesters,
          };
          saveAppState(nextState);
          return nextState;
        });
      },
      (remoteCatalog) => {
        setAppState((prev) => {
          const isDiff =
            (remoteCatalog.masterSubjects && JSON.stringify(prev.masterSubjects) !== JSON.stringify(remoteCatalog.masterSubjects)) ||
            (remoteCatalog.masterClasses && JSON.stringify(prev.masterClasses) !== JSON.stringify(remoteCatalog.masterClasses)) ||
            (remoteCatalog.masterTeachers && JSON.stringify(prev.masterTeachers) !== JSON.stringify(remoteCatalog.masterTeachers)) ||
            (remoteCatalog.holidays && JSON.stringify(prev.holidays) !== JSON.stringify(remoteCatalog.holidays));

          if (!isDiff) {
            return prev; // Return exact same reference: completely skips re-render!
          }

          const nextState = {
            ...prev,
            ...remoteCatalog,
          };
          saveAppState(nextState);
          return nextState;
        });
      },
      (status, msg) => {
        setSyncStatus(status);
        if (msg) setSyncMessage(msg);
      }
    );

    return () => unsubscribe();
  }, [user, activeSemester?.id]);

  // Debounced Cloud Push: Automatically saves edits to Cloud Firestore so all machines see them
  useEffect(() => {
    if (!isCloudInitializedRef.current || !activeSemester) return;
    queueCloudSemesterSync(
      activeSemester,
      user,
      (status, msg) => {
        setSyncStatus(status);
        if (msg) setSyncMessage(msg);
      },
      1500
    );
  }, [activeSemester, user]);

  // Sync Shared Catalogs
  useEffect(() => {
    if (!isCloudInitializedRef.current) return;
    queueCloudCatalogSync(appState, user);
  }, [appState.masterSubjects, appState.masterClasses, appState.masterTeachers, appState.holidays, user]);

  // Manual Force Sync Handler: Pushes complete data immediately to Firestore
  const handleForceSync = async () => {
    showToast('⚡ Đang đồng bộ toàn bộ dữ liệu lên đám mây...');
    const ok = await publishFullStateToCloud(appState, user);
    if (ok) {
      setSyncStatus('synced');
      setSyncMessage('Đã đồng bộ đám mây (Tất cả máy đều thấy)');
      showToast('✅ Đã đồng bộ thành công! Mọi máy mở web đều sẽ thấy dữ liệu này.');
    } else {
      showToast('❌ Có lỗi khi đồng bộ lên đám mây. Vui lòng kiểm tra lại kết nối mạng.');
    }
  };

  // View Mode: 'classes' (Phân Công Theo Lớp), 'table' (Bảng Báo Cáo), 'gantt' (Tiến Độ Tuần Gantt Chart), 'catalog' (Quản Lý GV, Môn và Lớp), 'overview' (Tổng Quan Học Kỳ)
  const [viewMode, setViewMode] = useState<'table' | 'classes' | 'gantt' | 'catalog' | 'overview'>('classes');

  // Filter & Search states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPosition, setSelectedPosition] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  // Selected courses for bulk actions
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);

  // Notification Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((cur) => (cur === msg ? null : cur));
    }, 3500);
  };

  // Generic in-app Confirm Modal State (replaces all window.confirm)
  const [appConfirmState, setAppConfirmState] = useState<{
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

  // Modals state
  const [isSemesterModalOpen, setIsSemesterModalOpen] = useState(false);
  const [isCustomColumnModalOpen, setIsCustomColumnModalOpen] = useState(false);
  const [isHolidayModalOpen, setIsHolidayModalOpen] = useState(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [isTeacherModalOpen, setIsTeacherModalOpen] = useState(false);
  const [teacherToEdit, setTeacherToEdit] = useState<Teacher | null>(null);
  const [isGanttPrintOpen, setIsGanttPrintOpen] = useState(false);

  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [targetTeacherForCourse, setTargetTeacherForCourse] = useState<Teacher | null>(null);
  const [courseToEdit, setCourseToEdit] = useState<CourseAssignment | null>(null);

  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [quickAddTeacher, setQuickAddTeacher] = useState<Teacher | null>(null);

  // Available positions for filter dropdown (strictly Cơ hữu & Thỉnh giảng)
  const availablePositions = useMemo(() => {
    return ['Cơ hữu', 'Thỉnh giảng'];
  }, []);

  // Filtered teachers & courses calculation
  const filteredTeachers: Teacher[] = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();

    return activeSemester.teachers
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
  }, [activeSemester.teachers, searchTerm, selectedPosition, selectedStatus]);

  // Helper to update active semester in state
  const updateCurrentSemester = (updater: (prevSem: Semester) => Semester) => {
    setAppState((prev) => {
      const updatedSemesters = prev.semesters.map((s) => {
        if (s.id === prev.activeSemesterId) {
          return updater(s);
        }
        return s;
      });
      return {
        ...prev,
        semesters: updatedSemesters,
      };
    });
  };

  // ----------------------------------------------------
  // Semester Management
  // ----------------------------------------------------
  const handleSelectSemester = (id: string) => {
    setAppState((prev) => ({
      ...prev,
      activeSemesterId: id,
    }));
    setSelectedCourseIds([]);
    showToast(`Đã chuyển sang ${appState.semesters.find((s) => s.id === id)?.name}`);
  };

  const handleCreateSemester = (
    name: string,
    academicYear: string,
    startDate: string,
    endDate: string,
    startWeekNumber: number,
    inheritanceMode: 'full' | 'teachers_only' | 'empty',
    sourceSemesterId?: string,
    resetCourseStatus = true
  ) => {
    const newId = `sem-${Date.now()}`;
    const sourceSem =
      appState.semesters.find((s) => s.id === sourceSemesterId) || activeSemester;

    let inheritedTeachers: Teacher[] = [];
    if (inheritanceMode === 'full' && sourceSem) {
      inheritedTeachers = sourceSem.teachers.map((t) => ({
        ...t,
        id: `t-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        courses: (t.courses || []).map((c) => ({
          ...c,
          id: `c-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          status: resetCourseStatus ? ('Đang dạy' as TeachingStatus) : c.status,
          completedHours: resetCourseStatus ? 0 : c.completedHours,
        })),
      }));
    } else if (inheritanceMode === 'teachers_only' && sourceSem) {
      inheritedTeachers = sourceSem.teachers.map((t) => ({
        ...t,
        id: `t-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        courses: [],
      }));
    }

    const newSemester: Semester = {
      id: newId,
      name,
      academicYear,
      startDate,
      endDate,
      startWeekNumber,
      isCurrent: true,
      createdAt: new Date().toISOString(),
      teachers: inheritedTeachers,
      customColumns: sourceSem ? [...sourceSem.customColumns] : [],
    };

    setAppState((prev) => ({
      ...prev,
      semesters: [...prev.semesters, newSemester],
      activeSemesterId: newId,
    }));

    showToast(`Đã tạo space học kỳ mới: "${name}" thành công!`);
  };

  const handleUpdateSemesterInfo = (
    semesterId: string,
    updates: {
      name: string;
      academicYear: string;
      startDate: string;
      endDate: string;
      startWeekNumber: number;
    }
  ) => {
    setAppState((prev) => ({
      ...prev,
      semesters: prev.semesters.map((s) =>
        s.id === semesterId
          ? {
              ...s,
              ...updates,
            }
          : s
      ),
    }));
    showToast(`Đã cập nhật thông tin và lịch ${updates.name}`);
  };

  const handleDeleteSemester = (semesterId: string) => {
    setAppState((prev) => {
      const remaining = prev.semesters.filter((s) => s.id !== semesterId);
      if (remaining.length === 0) {
        const fresh: Semester = {
          id: `sem-${Date.now()}`,
          name: 'Học kỳ 1 (2026 - 2027)',
          academicYear: '2026-2027',
          startDate: '2026-09-07',
          endDate: '2027-01-24',
          startWeekNumber: 1,
          isCurrent: true,
          createdAt: new Date().toISOString(),
          teachers: [],
          customColumns: [],
        };
        return {
          ...prev,
          semesters: [fresh],
          activeSemesterId: fresh.id,
        };
      }

      const newActive =
        prev.activeSemesterId === semesterId ? remaining[0].id : prev.activeSemesterId;
      return {
        ...prev,
        semesters: remaining,
        activeSemesterId: newActive,
      };
    });
    showToast('Đã xóa space học kỳ thành công!');
  };

  const handleClearSemesterAssignments = (semesterId: string) => {
    setAppState((prev) => ({
      ...prev,
      semesters: prev.semesters.map((s) => {
        if (s.id !== semesterId) return s;
        return {
          ...s,
          teachers: s.teachers.map((t) => ({ ...t, courses: [] })),
        };
      }),
    }));
    showToast('Đã làm sạch phân công các môn trong kỳ!');
  };

  // ----------------------------------------------------
  // Course Status & Hours Updates
  // ----------------------------------------------------
  const handleAutoCalculateAllCourses = () => {
    updateCurrentSemester((sem) => {
      const updatedTeachers = (sem.teachers || []).map((teacher) => {
        const updatedCourses = (teacher.courses || []).map((course) => {
          const totalHours = (course.theoryHours || 0) + (course.practiceHours || 0);
          const courseStartDate = course.startDate || sem.startDate;

          const autoProgress = calculateTeachingProgress(
            courseStartDate,
            course.scheduleSlots || [],
            course.hoursPerSession || 4,
            totalHours,
            appState.holidays || [],
            course.pauseIntervals || []
          );

          const newCompleted = autoProgress.calculatedHours;
          const isDone = newCompleted >= totalHours && totalHours > 0;

          return {
            ...course,
            completedHours: newCompleted,
            status: (isDone ? 'Đã hoàn thành' : 'Đang dạy') as TeachingStatus,
          };
        });

        return {
          ...teacher,
          courses: updatedCourses,
        };
      });

      return {
        ...sem,
        teachers: updatedTeachers,
      };
    });

    showToast('⚡ Đã tự động tính toán lại toàn bộ tiến độ các môn học theo lịch!');
  };

  const handleUpdateCourseStatus = (
    teacherId: string,
    courseId: string,
    newStatus: TeachingStatus
  ) => {
    updateCurrentSemester((sem) => {
      const updatedTeachers = sem.teachers.map((t) => {
        if (t.id !== teacherId) return t;
        const updatedCourses = (t.courses || []).map((c) => {
          if (c.id !== courseId) return c;
          const total = (c.theoryHours || 0) + (c.practiceHours || 0);
          const newCompleted = newStatus === 'Đã hoàn thành' ? total : 0;
          return {
            ...c,
            status: newStatus,
            completedHours: newCompleted,
            updatedAt: new Date().toISOString(),
          };
        });
        return { ...t, courses: updatedCourses };
      });
      return { ...sem, teachers: updatedTeachers };
    });

    showToast(`Đã chuyển trạng thái: ${newStatus}`);
  };

  const handleUpdateCourseHours = (
    teacherId: string,
    courseId: string,
    completedHours: number
  ) => {
    updateCurrentSemester((sem) => {
      const updatedTeachers = sem.teachers.map((t) => {
        if (t.id !== teacherId) return t;
        const updatedCourses = (t.courses || []).map((c) => {
          if (c.id !== courseId) return c;
          const total = (c.theoryHours || 0) + (c.practiceHours || 0);
          const safeHours = Math.max(0, Math.min(total, completedHours));
          const newStatus: TeachingStatus = safeHours >= total && total > 0 ? 'Đã hoàn thành' : 'Đang dạy';
          return {
            ...c,
            completedHours: safeHours,
            status: newStatus,
          };
        });
        return { ...t, courses: updatedCourses };
      });
      return { ...sem, teachers: updatedTeachers };
    });

    showToast(`Đã cập nhật tiến độ: ${completedHours} tiết`);
  };

  const handleUpdateCustomValue = (
    teacherId: string,
    courseId: string,
    columnId: string,
    value: any
  ) => {
    updateCurrentSemester((sem) => {
      const updatedTeachers = sem.teachers.map((t) => {
        if (t.id !== teacherId) return t;
        const updatedCourses = (t.courses || []).map((c) => {
          if (c.id !== courseId) return c;
          return {
            ...c,
            customValues: {
              ...(c.customValues || {}),
              [columnId]: value,
            },
          };
        });
        return { ...t, courses: updatedCourses };
      });
      return { ...sem, teachers: updatedTeachers };
    });
  };

  // ----------------------------------------------------
  // Teacher Actions
  // ----------------------------------------------------
  const handleSaveTeacher = (teacherData: {
    id?: string;
    name: string;
    code?: string;
    position: TeacherPosition;
    department?: string;
    email?: string;
    phone?: string;
    saveToMaster?: boolean;
  }) => {
    if (teacherData.id) {
      updateCurrentSemester((sem) => ({
        ...sem,
        teachers: sem.teachers.map((t) =>
          t.id === teacherData.id
            ? {
                ...t,
                name: teacherData.name,
                code: teacherData.code || t.code,
                position: teacherData.position,
                department: teacherData.department,
                email: teacherData.email,
                phone: teacherData.phone,
              }
            : t
        ),
      }));
      showToast('Đã cập nhật thông tin giảng viên');
    } else {
      // Check duplicate
      const exists = activeSemester.teachers.some(
        (t) => t.name.trim().toLowerCase() === teacherData.name.trim().toLowerCase()
      );
      if (exists) {
        showToast(`Giảng viên "${teacherData.name}" đã có trong học kỳ này!`);
        return;
      }

      const newTeacher: Teacher = {
        id: `t-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
        name: teacherData.name.trim(),
        code: teacherData.code?.trim() || `GV${Math.floor(100 + Math.random() * 900)}`,
        position: teacherData.position,
        department: teacherData.department?.trim() || '',
        email: teacherData.email?.trim() || '',
        phone: teacherData.phone?.trim() || '',
        courses: [],
      };

      updateCurrentSemester((sem) => ({
        ...sem,
        teachers: [...sem.teachers, newTeacher],
      }));

      // Optionally save to Master Teachers catalog
      if (teacherData.saveToMaster) {
        const alreadyInMaster = (appState.masterTeachers || []).some(
          (m) => m.name.trim().toLowerCase() === newTeacher.name.toLowerCase()
        );
        if (!alreadyInMaster) {
          handleAddMasterTeacher({
            name: newTeacher.name,
            code: newTeacher.code,
            position: newTeacher.position,
            department: newTeacher.department,
            email: newTeacher.email,
            phone: newTeacher.phone,
          });
        }
      }

      showToast(`Đã thêm GV "${teacherData.name}" vào học kỳ này`);
    }
  };

  const handleAddBatchMasterTeachersToSemester = (selectedList: MasterTeacher[]) => {
    let addedCount = 0;
    updateCurrentSemester((sem) => {
      const existingNames = new Set(sem.teachers.map((t) => t.name.trim().toLowerCase()));
      const toAdd: Teacher[] = [];

      selectedList.forEach((m) => {
        if (!existingNames.has(m.name.trim().toLowerCase())) {
          existingNames.add(m.name.trim().toLowerCase());
          toAdd.push({
            id: `t-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
            name: m.name,
            code: m.code,
            position: m.position,
            department: m.department,
            email: m.email,
            phone: m.phone,
            courses: [],
          });
          addedCount++;
        }
      });

      return {
        ...sem,
        teachers: [...sem.teachers, ...toAdd],
      };
    });

    if (addedCount > 0) {
      showToast(`Đã thêm ${addedCount} giảng viên vào ${activeSemester.name}`);
    } else {
      showToast('Tất cả giảng viên được chọn đã có trong học kỳ này!');
    }
  };

  const handleMoveTeacher = (teacherId: string, direction: 'up' | 'down') => {
    updateCurrentSemester((sem) => {
      // Find current teacher in filteredTeachers to know who to swap with visually
      const fIndex = filteredTeachers.findIndex((t) => t.id === teacherId);
      if (fIndex === -1) return sem;
      const targetFIndex = direction === 'up' ? fIndex - 1 : fIndex + 1;
      if (targetFIndex < 0 || targetFIndex >= filteredTeachers.length) return sem;

      const targetTeacherId = filteredTeachers[targetFIndex].id;

      const list = [...sem.teachers];
      const idxA = list.findIndex((t) => t.id === teacherId);
      const idxB = list.findIndex((t) => t.id === targetTeacherId);
      if (idxA === -1 || idxB === -1) return sem;

      const temp = list[idxA];
      list[idxA] = list[idxB];
      list[idxB] = temp;

      return {
        ...sem,
        teachers: list,
      };
    });
  };

  const promptDeleteTeacher = (teacherId: string) => {
    const t = activeSemester.teachers.find((x) => x.id === teacherId);
    if (!t) return;
    setAppConfirmState({
      isOpen: true,
      title: `Xóa Giảng Viên "${t.name}"?`,
      message: `Bạn có chắc muốn xóa giảng viên "${t.name}" cùng tất cả các môn phân công của thầy/cô trong học kỳ này?`,
      onConfirm: () => {
        updateCurrentSemester((sem) => ({
          ...sem,
          teachers: sem.teachers.filter((x) => x.id !== teacherId),
        }));
        showToast(`Đã xóa giảng viên ${t.name}`);
      },
    });
  };

  // ----------------------------------------------------
  // Course Actions
  // ----------------------------------------------------
  const handleUpdateCourse = (
    teacherId: string,
    courseId: string,
    updates: Partial<CourseAssignment>
  ) => {
    updateCurrentSemester((sem) => ({
      ...sem,
      teachers: sem.teachers.map((t) => {
        if (t.id !== teacherId) return t;
        return {
          ...t,
          courses: (t.courses || []).map((c) => {
            if (c.id !== courseId) return c;
            const updated = { ...c, ...updates };
            const tot = (updated.theoryHours || 0) + (updated.practiceHours || 0);
            if (updates.completedHours !== undefined && updates.status === undefined) {
              if (updated.completedHours >= tot && tot > 0) {
                updated.status = 'Đã hoàn thành';
              } else if (updated.completedHours > 0) {
                updated.status = 'Đang dạy';
              }
            }
            return updated;
          }),
        };
      }),
    }));
  };

  const handleSaveCourse = (
    teacherId: string,
    courseData: Omit<CourseAssignment, 'id'> & { id?: string }
  ) => {
    updateCurrentSemester((sem) => ({
      ...sem,
      teachers: sem.teachers.map((t) => {
        if (t.id !== teacherId) return t;

        let courses = t.courses || [];
        if (courseData.id) {
          courses = courses.map((c) => (c.id === courseData.id ? { ...courseData, id: c.id } : c));
        } else {
          const newCourse: CourseAssignment = {
            ...courseData,
            id: `c-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          };
          courses = [...courses, newCourse];
        }
        return { ...t, courses };
      }),
    }));

    showToast('Đã lưu phân công môn học thành công!');
  };

  const handleDuplicateCourse = (teacherId: string, course: CourseAssignment) => {
    updateCurrentSemester((sem) => ({
      ...sem,
      teachers: sem.teachers.map((t) => {
        if (t.id !== teacherId) return t;
        const duplicated: CourseAssignment = {
          ...course,
          id: `c-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          className: `${course.className} (Copy)`,
          status: 'Đang dạy',
          completedHours: 0,
        };
        return {
          ...t,
          courses: [...(t.courses || []), duplicated],
        };
      }),
    }));
    showToast(`Đã nhân bản môn "${course.subjectName}"`);
  };

  const promptDeleteCourse = (teacherId: string, courseId: string) => {
    const teacher = activeSemester.teachers.find((t) => t.id === teacherId);
    const course = teacher?.courses?.find((c) => c.id === courseId);
    setAppConfirmState({
      isOpen: true,
      title: `Xóa Môn Học "${course?.subjectName || 'Này'}"?`,
      message: `Bạn có chắc muốn xóa phân công môn ${course?.subjectName} (${course?.className}) khỏi giảng viên?`,
      onConfirm: () => {
        updateCurrentSemester((sem) => ({
          ...sem,
          teachers: sem.teachers.map((t) => {
            if (t.id !== teacherId) return t;
            return {
              ...t,
              courses: (t.courses || []).filter((c) => c.id !== courseId),
            };
          }),
        }));
        setSelectedCourseIds((prev) => prev.filter((id) => id !== courseId));
        showToast('Đã xóa môn học');
      },
    });
  };

  // ----------------------------------------------------
  // Class-First Workflow Handlers (Thêm môn vào lớp & đổi GV phụ trách)
  // ----------------------------------------------------
  const handleAddCourseToClass = (
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
  ) => {
    const targetChildClass = ensureChildClassName(className);
    const newCourse: CourseAssignment = {
      ...courseData,
      id: `c-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      className: targetChildClass.trim().toUpperCase(),
    };

    updateCurrentSemester((sem) => {
      let updatedTeachers = [...sem.teachers];

      if (teacherSelection.type === 'existing' && teacherSelection.teacherId) {
        updatedTeachers = updatedTeachers.map((t) => {
          if (t.id !== teacherSelection.teacherId) return t;
          return {
            ...t,
            courses: [...(t.courses || []), newCourse],
          };
        });
      } else if (teacherSelection.type === 'master' && teacherSelection.masterTeacher) {
        const mt = teacherSelection.masterTeacher;
        const existingIdx = updatedTeachers.findIndex(
          (t) => t.name.trim().toLowerCase() === mt.name.trim().toLowerCase() || t.id === mt.id
        );
        if (existingIdx >= 0) {
          updatedTeachers[existingIdx] = {
            ...updatedTeachers[existingIdx],
            courses: [...(updatedTeachers[existingIdx].courses || []), newCourse],
          };
        } else {
          const newT: Teacher = {
            id: mt.id || `t-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            name: mt.name,
            code: mt.code || `GV${Math.floor(100 + Math.random() * 900)}`,
            position: mt.position,
            department: mt.department,
            email: mt.email,
            phone: mt.phone,
            courses: [newCourse],
          };
          updatedTeachers.push(newT);
        }
      } else if (teacherSelection.type === 'new' && teacherSelection.newTeacher) {
        const nt = teacherSelection.newTeacher;
        const newTId = `t-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
        const pos = normalizeTeacherPosition(nt.position);
        const newT: Teacher = {
          id: newTId,
          name: nt.name,
          code: `GV${Math.floor(100 + Math.random() * 900)}`,
          position: pos,
          email: nt.email,
          phone: nt.phone,
          courses: [newCourse],
        };
        updatedTeachers.push(newT);

        // Also add to masterTeachers so it persists in school catalog
        setAppState((prev) => ({
          ...prev,
          masterTeachers: [
            ...prev.masterTeachers,
            {
              id: newTId,
              name: nt.name,
              position: pos,
              email: nt.email,
              phone: nt.phone,
            },
          ],
        }));
      }

      return {
        ...sem,
        teachers: updatedTeachers,
      };
    });

    showToast(`Đã thêm môn "${newCourse.subjectName}" vào lớp ${className}!`);
  };

  const handleReassignCourseTeacher = (
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
  ) => {
    updateCurrentSemester((sem) => {
      let movingCourse: CourseAssignment | null = null;

      // 1. Remove from current teacher
      let updatedTeachers = sem.teachers.map((t) => {
        if (t.id !== currentTeacherId) return t;
        const found = (t.courses || []).find((c) => c.id === courseId);
        if (found) movingCourse = found;
        return {
          ...t,
          courses: (t.courses || []).filter((c) => c.id !== courseId),
        };
      });

      if (!movingCourse) return sem;

      // 2. Add to target teacher
      if (targetTeacher.type === 'existing' && targetTeacher.teacherId) {
        updatedTeachers = updatedTeachers.map((t) => {
          if (t.id !== targetTeacher.teacherId) return t;
          return {
            ...t,
            courses: [...(t.courses || []), movingCourse!],
          };
        });
      } else if (targetTeacher.type === 'master' && targetTeacher.masterTeacher) {
        const mt = targetTeacher.masterTeacher;
        const existingIdx = updatedTeachers.findIndex(
          (t) => t.name.trim().toLowerCase() === mt.name.trim().toLowerCase() || t.id === mt.id
        );
        if (existingIdx >= 0) {
          updatedTeachers[existingIdx] = {
            ...updatedTeachers[existingIdx],
            courses: [...(updatedTeachers[existingIdx].courses || []), movingCourse!],
          };
        } else {
          const newT: Teacher = {
            id: mt.id || `t-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            name: mt.name,
            code: mt.code || `GV${Math.floor(100 + Math.random() * 900)}`,
            position: mt.position,
            department: mt.department,
            email: mt.email,
            phone: mt.phone,
            courses: [movingCourse!],
          };
          updatedTeachers.push(newT);
        }
      } else if (targetTeacher.type === 'new' && targetTeacher.newTeacher) {
        const nt = targetTeacher.newTeacher;
        const newTId = `t-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
        const pos = normalizeTeacherPosition(nt.position);
        const newT: Teacher = {
          id: newTId,
          name: nt.name,
          code: `GV${Math.floor(100 + Math.random() * 900)}`,
          position: pos,
          email: nt.email,
          phone: nt.phone,
          courses: [movingCourse!],
        };
        updatedTeachers.push(newT);

        setAppState((prev) => ({
          ...prev,
          masterTeachers: [
            ...prev.masterTeachers,
            {
              id: newTId,
              name: nt.name,
              position: pos,
              email: nt.email,
              phone: nt.phone,
            },
          ],
        }));
      }

      return {
        ...sem,
        teachers: updatedTeachers,
      };
    });

    showToast('Đã đổi giảng viên phụ trách thành công!');
  };

  // ----------------------------------------------------
  // Bulk Actions
  // ----------------------------------------------------
  const handleToggleSelectCourse = (courseId: string) => {
    setSelectedCourseIds((prev) =>
      prev.includes(courseId) ? prev.filter((id) => id !== courseId) : [...prev, courseId]
    );
  };

  const handleToggleSelectTeacher = (teacherId: string) => {
    const teacher = activeSemester.teachers.find((t) => t.id === teacherId);
    if (!teacher) return;
    const courseIds = (teacher.courses || []).map((c) => c.id);
    const allSelected = courseIds.every((id) => selectedCourseIds.includes(id));

    if (allSelected) {
      setSelectedCourseIds((prev) => prev.filter((id) => !courseIds.includes(id)));
    } else {
      setSelectedCourseIds((prev) => Array.from(new Set([...prev, ...courseIds])));
    }
  };

  const handleBatchUpdateStatus = (status: TeachingStatus) => {
    if (selectedCourseIds.length === 0) return;

    updateCurrentSemester((sem) => ({
      ...sem,
      teachers: sem.teachers.map((t) => ({
        ...t,
        courses: (t.courses || []).map((c) => {
          if (!selectedCourseIds.includes(c.id)) return c;
          const tot = (c.theoryHours || 0) + (c.practiceHours || 0);
          return {
            ...c,
            status,
            completedHours: status === 'Đã hoàn thành' ? tot : 0,
          };
        }),
      })),
    }));

    showToast(`Đã chuyển ${selectedCourseIds.length} môn sang trạng thái "${status}"`);
    setSelectedCourseIds([]);
  };

  const allFilteredCourseIds = useMemo(() => {
    return filteredTeachers.flatMap((t) => (t.courses || []).map((c) => c.id));
  }, [filteredTeachers]);

  const isAllFilteredSelected =
    allFilteredCourseIds.length > 0 &&
    allFilteredCourseIds.every((id) => selectedCourseIds.includes(id));

  const handleToggleSelectAllFiltered = () => {
    if (isAllFilteredSelected) {
      setSelectedCourseIds((prev) =>
        prev.filter((id) => !allFilteredCourseIds.includes(id))
      );
    } else {
      setSelectedCourseIds((prev) =>
        Array.from(new Set([...prev, ...allFilteredCourseIds]))
      );
    }
  };

  const handleBatchAutoCalculate = () => {
    if (selectedCourseIds.length === 0) return;

    let computedCount = 0;
    updateCurrentSemester((sem) => ({
      ...sem,
      teachers: sem.teachers.map((t) => ({
        ...t,
        courses: (t.courses || []).map((c) => {
          if (!selectedCourseIds.includes(c.id)) return c;
          const tot = (c.theoryHours || 0) + (c.practiceHours || 0);
          const progress = calculateTeachingProgress(
            c.startDate,
            c.scheduleSlots || [],
            c.hoursPerSession || 4,
            tot,
            appState.holidays || [],
            c.pauseIntervals || []
          );
          computedCount++;
          const isDone = progress.calculatedHours >= tot && tot > 0;
          return {
            ...c,
            completedHours: progress.calculatedHours,
            status: isDone ? ('Đã hoàn thành' as TeachingStatus) : ('Đang dạy' as TeachingStatus),
          };
        }),
      })),
    }));

    showToast(`⚡ Đã tự động tính nhanh tiến độ cho ${selectedCourseIds.length} môn học đã chọn!`);
    setSelectedCourseIds([]);
  };

  const handleBatchDeleteCourses = () => {
    if (selectedCourseIds.length === 0) return;
    updateCurrentSemester((sem) => ({
      ...sem,
      teachers: sem.teachers.map((t) => ({
        ...t,
        courses: (t.courses || []).filter((c) => !selectedCourseIds.includes(c.id)),
      })),
    }));
    showToast(`Đã xóa ${selectedCourseIds.length} môn học`);
    setSelectedCourseIds([]);
  };

  const handleResetAllCoursesStatus = (status: TeachingStatus) => {
    updateCurrentSemester((sem) => ({
      ...sem,
      teachers: sem.teachers.map((t) => ({
        ...t,
        courses: (t.courses || []).map((c) => {
          const tot = (c.theoryHours || 0) + (c.practiceHours || 0);
          return {
            ...c,
            status,
            completedHours: status === 'Đã hoàn thành' ? tot : 0,
          };
        }),
      })),
    }));
    showToast(`Đã cập nhật toàn bộ môn về "${status}"`);
  };

  const handleClearCompletedCourses = () => {
    updateCurrentSemester((sem) => ({
      ...sem,
      teachers: sem.teachers.map((t) => ({
        ...t,
        courses: (t.courses || []).filter((c) => {
          const tot = (c.theoryHours || 0) + (c.practiceHours || 0);
          return (c.completedHours || 0) < tot;
        }),
      })),
    }));
    showToast('Đã xóa tất cả các môn đã dạy xong');
  };

  // ----------------------------------------------------
  // Custom Columns Actions
  // ----------------------------------------------------
  const handleAddColumn = (
    name: string,
    type: 'text' | 'number' | 'boolean' | 'date',
    defaultValue?: any
  ) => {
    const colId = `col-${Date.now()}`;
    const newCol = { id: colId, name, type, defaultValue };

    updateCurrentSemester((sem) => ({
      ...sem,
      customColumns: [...sem.customColumns, newCol],
    }));
    showToast(`Đã tạo thêm cột "${name}"`);
  };

  const handleDeleteColumn = (columnId: string) => {
    updateCurrentSemester((sem) => ({
      ...sem,
      customColumns: sem.customColumns.filter((c) => c.id !== columnId),
    }));
    showToast('Đã xóa cột tùy biến');
  };

  // ----------------------------------------------------
  // Holiday Settings Actions
  // ----------------------------------------------------
  const handleAddHoliday = (holiday: Omit<Holiday, 'id'>) => {
    const newHol: Holiday = {
      ...holiday,
      id: `hol-${Date.now()}`,
    };
    setAppState((prev) => ({
      ...prev,
      holidays: [...(prev.holidays || []), newHol],
    }));
    showToast(`Đã thêm ngày nghỉ lễ: "${holiday.name}"`);
  };

  const handleUpdateHoliday = (updated: Holiday) => {
    setAppState((prev) => ({
      ...prev,
      holidays: (prev.holidays || []).map((h) => (h.id === updated.id ? updated : h)),
    }));
    showToast(`Đã cập nhật ngày nghỉ: "${updated.name}"`);
  };

  const handleDeleteHoliday = (id: string) => {
    setAppState((prev) => ({
      ...prev,
      holidays: (prev.holidays || []).filter((h) => h.id !== id),
    }));
    showToast('Đã xóa ngày nghỉ lễ');
  };

  const handleBatchDeleteHolidays = (ids: string[]) => {
    setAppState((prev) => ({
      ...prev,
      holidays: (prev.holidays || []).filter((h) => !ids.includes(h.id)),
    }));
    showToast(`Đã xóa ${ids.length} ngày nghỉ lễ đã chọn`);
  };

  const handleResetDefaultHolidays = () => {
    setAppState((prev) => ({
      ...prev,
      holidays: INITIAL_HOLIDAYS,
    }));
    showToast('Đã nạp danh sách các ngày lễ lớn Việt Nam');
  };

  // ----------------------------------------------------
  // Master Catalog Actions (Teachers, Subjects & Classes)
  // ----------------------------------------------------
  const handleAddMasterTeacher = (teacher: Omit<MasterTeacher, 'id'>) => {
    const newTeacher: MasterTeacher = {
      ...teacher,
      id: `mt-${Date.now()}`,
    };
    setAppState((prev) => ({
      ...prev,
      masterTeachers: [...(prev.masterTeachers || []), newTeacher],
    }));
    showToast(`Đã thêm GV "${teacher.name}" vào danh mục quản lý`);
  };

  const handleUpdateMasterTeacher = (updated: MasterTeacher) => {
    setAppState((prev) => ({
      ...prev,
      masterTeachers: (prev.masterTeachers || []).map((t) => (t.id === updated.id ? updated : t)),
    }));
    showToast(`Đã cập nhật GV "${updated.name}"`);
  };

  const handleDeleteMasterTeacher = (id: string) => {
    setAppState((prev) => ({
      ...prev,
      masterTeachers: (prev.masterTeachers || []).filter((t) => t.id !== id),
    }));
    showToast('Đã xóa GV khỏi danh mục quản lý');
  };

  const handleAddMasterTeacherToSemester = (masterT: MasterTeacher) => {
    const exists = activeSemester.teachers.some(
      (t) => t.name.toLowerCase() === masterT.name.toLowerCase()
    );
    if (exists) {
      showToast(`Giảng viên "${masterT.name}" đã có trong học kỳ này!`);
      return;
    }

    const newTeacher: Teacher = {
      id: `t-${Date.now()}`,
      name: masterT.name,
      code: masterT.code,
      position: masterT.position,
      department: masterT.department,
      email: masterT.email,
      phone: masterT.phone,
      courses: [],
    };

    updateCurrentSemester((sem) => ({
      ...sem,
      teachers: [...sem.teachers, newTeacher],
    }));
    showToast(`Đã đưa GV "${masterT.name}" vào ${activeSemester.name}`);
  };

  const handleAddSubject = (subject: Omit<MasterSubject, 'id'>) => {
    const newSubj: MasterSubject = {
      ...subject,
      id: `subj-${Date.now()}`,
    };
    setAppState((prev) => ({
      ...prev,
      masterSubjects: [...(prev.masterSubjects || []), newSubj],
    }));
    showToast(`Đã thêm môn "${subject.name}" vào danh mục quản lý`);
  };

  const handleUpdateSubject = (updated: MasterSubject) => {
    setAppState((prev) => ({
      ...prev,
      masterSubjects: (prev.masterSubjects || []).map((s) => (s.id === updated.id ? updated : s)),
    }));
    showToast(`Đã cập nhật môn "${updated.name}"`);
  };

  const handleDeleteSubject = (id: string) => {
    setAppState((prev) => ({
      ...prev,
      masterSubjects: (prev.masterSubjects || []).filter((s) => s.id !== id),
    }));
    showToast('Đã xóa môn khỏi danh mục quản lý');
  };

  const handleReorderSubjects = (sortedSubjects: MasterSubject[]) => {
    setAppState((prev) => ({
      ...prev,
      masterSubjects: sortedSubjects,
    }));
    showToast('✅ Đã lưu thứ tự sắp xếp danh mục môn học thành công!');
  };

  const handleAddClass = (newClass: Omit<MasterClass, 'id'>) => {
    const created: MasterClass = {
      ...newClass,
      id: `class-${Date.now()}`,
    };
    setAppState((prev) => ({
      ...prev,
      masterClasses: [...(prev.masterClasses || []), created],
    }));
    showToast(`Đã thêm lớp "${newClass.name}" vào danh mục quản lý`);
  };

  const handleUpdateClass = (updated: MasterClass) => {
    setAppState((prev) => ({
      ...prev,
      masterClasses: (prev.masterClasses || []).map((c) => (c.id === updated.id ? updated : c)),
    }));
    showToast(`Đã cập nhật lớp "${updated.name}"`);
  };

  const handleDeleteClass = (id: string) => {
    setAppState((prev) => ({
      ...prev,
      masterClasses: (prev.masterClasses || []).filter((c) => c.id !== id),
    }));
    showToast('Đã xóa lớp khỏi danh mục quản lý');
  };

  // Quét & Tự động phát hiện, tạo Lớp Mẹ và gom các nhóm con
  const handleAutoScanClassParents = (silent = false) => {
    const courseClasses: string[] = [];
    appState.semesters.forEach((s) => {
      s.teachers.forEach((t) => {
        (t.courses || []).forEach((c) => {
          if (c.className) courseClasses.push(c.className);
        });
      });
    });

    const result = autoDetectAndAddParentClasses(
      appState.masterClasses || [],
      courseClasses
    );

    if (result.hasChanges) {
      setAppState((prev) => ({
        ...prev,
        masterClasses: result.updatedMasterClasses,
      }));

      if (!silent) {
        const parts: string[] = [];
        if (result.createdParents.length > 0) {
          parts.push(`Tạo mới ${result.createdParents.length} lớp mẹ (${result.createdParents.join(', ')})`);
        }
        if (result.linkedSubgroups.length > 0) {
          parts.push(`Gom ${result.linkedSubgroups.length} nhóm con`);
        }
        showToast(`✨ Đã quét & chuẩn hóa: ${parts.join(' và ')}`);
      }
    } else if (!silent) {
      showToast('Hệ thống đã chuẩn hóa toàn bộ lớp mẹ & nhóm con!');
    }
  };

  // Auto-scan once on mount to detect existing classes with subgroups (only after cloud load)
  useEffect(() => {
    if (!isCloudLoading && isCloudInitializedRef.current) {
      handleAutoScanClassParents(true);
    }
  }, [isCloudLoading]);

  // ----------------------------------------------------
  // Snapshots & Backup Actions
  // ----------------------------------------------------
  const handleCreateSnapshot = () => {
    const updatedSnapshots = createSemesterSnapshot(activeSemester, appState.snapshots);
    setAppState((prev) => ({
      ...prev,
      snapshots: updatedSnapshots,
    }));
    showToast('Đã tạo bản snapshot điểm phục hồi thành công!');
  };

  const handleRestoreSnapshot = (snapshot: SnapshotBackup) => {
    updateCurrentSemester(() => ({
      ...snapshot.data,
      id: activeSemester.id,
      name: activeSemester.name,
    }));
    showToast('Đã khôi phục dữ liệu từ bản snapshot');
  };

  const handleDeleteSnapshot = (snapshotId: string) => {
    setAppState((prev) => ({
      ...prev,
      snapshots: prev.snapshots.filter((s) => s.id !== snapshotId),
    }));
    showToast('Đã xóa bản snapshot');
  };

  const handleUpdateTeachers = (updatedTeachers: Teacher[], toastMessage?: string) => {
    updateCurrentSemester((sem) => ({
      ...sem,
      teachers: updatedTeachers,
    }));
    if (toastMessage) showToast(toastMessage);
  };

  const handleDownloadBackup = () => {
    downloadJsonBackup(appState);
    showToast('Đã tải xuống tệp sao lưu dữ liệu');
  };

  const handleImportBackup = (imported: any) => {
    try {
      if (!imported || !imported.semesters || !Array.isArray(imported.semesters) || imported.semesters.length === 0) {
        showToast('Tệp sao lưu không hợp lệ hoặc không có dữ liệu học kỳ.');
        return;
      }
      const sanitizedSemesters = imported.semesters.map(sanitizeSemester);
      const activeId =
        imported.activeSemesterId && sanitizedSemesters.some((s: Semester) => s.id === imported.activeSemesterId)
          ? imported.activeSemesterId
          : sanitizedSemesters[0].id;

      const sanitizedTeachers = (imported.masterTeachers || []).map((mt: any) => ({
        ...mt,
        position: normalizeTeacherPosition(mt.position),
      }));

      const newAppState: AppState = {
        semesters: sanitizedSemesters,
        activeSemesterId: activeId,
        masterSubjects: imported.masterSubjects || [],
        masterClasses: imported.masterClasses || [],
        masterTeachers: sanitizedTeachers,
        holidays: imported.holidays || INITIAL_HOLIDAYS,
        snapshots: imported.snapshots || [],
      };

      setAppState(newAppState);
      saveAppState(newAppState);
      showToast('Đang đồng bộ dữ liệu vừa nạp lên đám mây cho tất cả các máy...');
      publishFullStateToCloud(newAppState, user).then((ok) => {
        if (ok) {
          setSyncStatus('synced');
          setSyncMessage('Đã đồng bộ đám mây (Tất cả máy đều thấy)');
          showToast('🚀 Đã khôi phục & ĐỒNG BỘ MÂY thành công! Mọi máy khác mở web đều thấy ngay.');
        } else {
          showToast('Đã khôi phục cục bộ. (Vui lòng bấm Đồng bộ mây khi có mạng)');
        }
      });
    } catch (err) {
      console.error('Import backup error:', err);
      showToast('Có lỗi xảy ra khi nạp tệp sao lưu.');
    }
  };

  const handleResetToCleanSlate = () => {
    const cleanId = `sem-${Date.now()}`;
    const cleanState: AppState = {
      semesters: [
        {
          id: cleanId,
          name: 'Học kỳ 1 (2026 - 2027)',
          academicYear: '2026-2027',
          startDate: '2026-09-07',
          endDate: '2027-01-24',
          startWeekNumber: 1,
          isCurrent: true,
          createdAt: new Date().toISOString(),
          teachers: [],
          customColumns: [],
        },
      ],
      activeSemesterId: cleanId,
      masterSubjects: [],
      masterClasses: [],
      masterTeachers: [],
      holidays: INITIAL_HOLIDAYS,
      snapshots: [],
    };
    setAppState(cleanState);
    showToast('Đã xóa sạch database! Bạn có thể tự do nhập liệu thử nghiệm.');
  };

  // ----------------------------------------------------
  // Export Handlers (Excel & Gantt PDF)
  // ----------------------------------------------------
  const handleExportExcel = async () => {
    try {
      await exportTeachingReportToExcel({
        semester: activeSemester,
        filteredTeachers: filteredTeachers,
        filterPosition: selectedPosition === 'ALL' ? 'Tất cả' : selectedPosition,
        filterStatus: selectedStatus === 'ALL' ? 'Tất cả' : selectedStatus,
        searchTerm: searchTerm,
        customColumns: activeSemester.customColumns || [],
      });
      showToast('Đã xuất báo cáo Excel chuẩn chỉ kẻ viền & in đậm thành công!');
    } catch (err) {
      console.error(err);
      showToast('Lỗi khi xuất file Excel. Vui lòng kiểm tra lại.');
    }
  };

  const handleExportGanttPdf = () => {
    setViewMode('gantt');
    setIsGanttPrintOpen(true);
  };

  // Automated Progress Recalculation & Split Multi-file Export (2 Excel + 2 PDF Gantt)
  const handleUpdateAndBatchExportAll = async () => {
    try {
      showToast('⏳ Đang cập nhật tiến độ và khởi tạo 4 tệp báo cáo...');

      // 1. Refresh all course progress automatically based on Vietnam schedule
      let updatedSemester = { ...activeSemester };
      const refreshedTeachers = (activeSemester.teachers || []).map((teacher) => {
        const refreshedCourses = (teacher.courses || []).map((course) => {
          const totalHours = (course.theoryHours || 0) + (course.practiceHours || 0);
          const courseStartDate = course.startDate || activeSemester.startDate;

          const autoProgress = calculateTeachingProgress(
            courseStartDate,
            course.scheduleSlots || [],
            course.hoursPerSession || 4,
            totalHours,
            appState.holidays || [],
            course.pauseIntervals || []
          );

          const newCompleted = autoProgress.calculatedHours;
          const isDone = newCompleted >= totalHours && totalHours > 0;

          return {
            ...course,
            completedHours: newCompleted,
            status: (isDone ? 'Đã hoàn thành' : 'Đang dạy') as TeachingStatus,
          };
        });

        return {
          ...teacher,
          courses: refreshedCourses,
        };
      });

      updatedSemester = {
        ...updatedSemester,
        teachers: refreshedTeachers,
      };

      // Save the recalculated semester state
      updateCurrentSemester(() => updatedSemester);

      // 2. Split teachers into Co Huu (Full-time) and Thinh Giang (Visiting)
      const coHuuTeachers = refreshedTeachers.filter(
        (t) => t.position === 'Cơ hữu'
      );
      const thinhGiangTeachers = refreshedTeachers.filter(
        (t) => t.position === 'Thỉnh giảng'
      );

      // 3. Export 2 Excel Files (Co Huu & Thinh Giang)
      await exportTeachingReportToExcel({
        semester: updatedSemester,
        filteredTeachers: coHuuTeachers,
        customColumns: updatedSemester.customColumns || [],
        customTitle: `BẢNG THEO DÕI TIẾN ĐỘ GIẢNG DẠY (GIẢNG VIÊN CƠ HỮU) - ${updatedSemester.name.toUpperCase()}`,
        fileNamePrefix: 'Bao_Cao_Tien_Do_Co_Huu',
      });

      // Small delay between downloads so browser doesn't block multi-download
      await new Promise((r) => setTimeout(r, 400));

      await exportTeachingReportToExcel({
        semester: updatedSemester,
        filteredTeachers: thinhGiangTeachers,
        customColumns: updatedSemester.customColumns || [],
        customTitle: `BẢNG THEO DÕI TIẾN ĐỘ GIẢNG DẠY (GIẢNG VIÊN THỈNH GIẢNG) - ${updatedSemester.name.toUpperCase()}`,
        fileNamePrefix: 'Bao_Cao_Tien_Do_Thinh_Giang',
      });

      await new Promise((r) => setTimeout(r, 400));

      // 4. Export 2 Gantt PDF Files (Co Huu & Thinh Giang)
      await exportGanttPdfDirectly({
        semester: updatedSemester,
        teachers: coHuuTeachers,
        holidays: appState.holidays || [],
        titleSuffix: 'GIẢNG VIÊN CƠ HỮU',
        fileNamePrefix: 'Tien_Do_Tuan_Co_Huu',
        weekColWidth: 36,
      });

      await new Promise((r) => setTimeout(r, 400));

      await exportGanttPdfDirectly({
        semester: updatedSemester,
        teachers: thinhGiangTeachers,
        holidays: appState.holidays || [],
        titleSuffix: 'GIẢNG VIÊN THỈNH GIẢNG',
        fileNamePrefix: 'Tien_Do_Tuan_Thinh_Giang',
        weekColWidth: 36,
      });

      showToast('✅ Đã cập nhật và tải thành công 4 tệp (2 Excel + 2 PDF Gantt riêng Cơ hữu & Thỉnh giảng)!');
    } catch (err) {
      console.error('Error during batch update & export:', err);
      showToast('Lỗi khi xuất hàng loạt. Vui lòng thử lại.');
    }
  };

  if (isCloudLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 text-white">
        <div className="flex flex-col items-center space-y-4 max-w-sm text-center animate-in fade-in zoom-in-95">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shadow-xl">
            <Cloud className="w-8 h-8 text-emerald-400 animate-pulse" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100">Đang tải dữ liệu từ máy chủ đám mây...</h2>
            <p className="text-xs text-slate-400 mt-1">Đồng bộ phiên bản mới nhất dùng chung cho tất cả các máy tính</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-emerald-300 bg-slate-800/80 px-3.5 py-1.5 rounded-full border border-slate-700/60 shadow-inner">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
            <span>Đang nạp dữ liệu giảng dạy...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-800 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* Top Navigation */}
      <Navbar
        semesters={appState.semesters}
        activeSemester={activeSemester}
        onSelectSemester={handleSelectSemester}
        onOpenSemesterModal={() => setIsSemesterModalOpen(true)}
        viewMode={viewMode}
        onChangeViewMode={setViewMode}
        onOpenCustomColumnsModal={() => setIsCustomColumnModalOpen(true)}
        onOpenHolidayModal={() => setIsHolidayModalOpen(true)}
        onOpenBackupModal={() => setIsBackupModalOpen(true)}
        onExportExcel={handleExportExcel}
        onExportGanttPdf={handleExportGanttPdf}
        onUpdateAndBatchExportAll={handleUpdateAndBatchExportAll}
        user={user}
        syncStatus={syncStatus}
        statusMessage={syncMessage}
        onForceSync={handleForceSync}
        onToast={showToast}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl border border-slate-700 text-xs font-semibold flex items-center gap-2 animate-in slide-in-from-bottom-5">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>{toastMessage}</span>
          </div>
        )}

        {/* View Mode: Bảng Báo Cáo, Tiến Độ Tuần Gantt, Quản Lý GV Môn Lớp, hoặc Tổng Quan Học Kỳ */}
        {viewMode === 'classes' && (
          <ClassAssignmentManager
            semester={activeSemester}
            masterClasses={appState.masterClasses || []}
            masterSubjects={appState.masterSubjects || []}
            masterTeachers={appState.masterTeachers || []}
            holidays={appState.holidays || []}
            onAddCourseToClass={handleAddCourseToClass}
            onEditCourse={(teacher, course) => {
              setTargetTeacherForCourse(teacher);
              setCourseToEdit(course);
              setIsCourseModalOpen(true);
            }}
            onDuplicateCourse={handleDuplicateCourse}
            onDeleteCourse={promptDeleteCourse}
            onReassignTeacher={handleReassignCourseTeacher}
            onAddClassToCatalog={handleAddClass}
            onAutoScanClassParents={handleAutoScanClassParents}
            onUpdateTeachers={handleUpdateTeachers}
            onToast={showToast}
          />
        )}

        {viewMode === 'gantt' && (
          <GanttChart
            semester={activeSemester}
            holidays={appState.holidays || []}
            masterClasses={appState.masterClasses || []}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            selectedPosition={selectedPosition}
            onPositionChange={setSelectedPosition}
            selectedStatus={selectedStatus}
            onStatusChange={setSelectedStatus}
            isPrintOpen={isGanttPrintOpen}
            onClosePrint={() => setIsGanttPrintOpen(false)}
            onEditCourse={(teacher, course) => {
              setTargetTeacherForCourse(teacher);
              setCourseToEdit(course);
              setIsCourseModalOpen(true);
            }}
            onUpdateCourse={handleUpdateCourse}
            onUpdateTeachers={handleUpdateTeachers}
            onToast={showToast}
          />
        )}

        {viewMode === 'overview' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* KPI Dashboard & Progress Breakdown */}
            <DashboardStats semester={activeSemester} />
          </div>
        )}

        {viewMode === 'catalog' && (
          <CatalogManager
            masterSubjects={appState.masterSubjects || []}
            masterClasses={appState.masterClasses || []}
            masterTeachers={appState.masterTeachers || []}
            onAddSubject={handleAddSubject}
            onUpdateSubject={handleUpdateSubject}
            onDeleteSubject={handleDeleteSubject}
            onAddClass={handleAddClass}
            onUpdateClass={handleUpdateClass}
            onDeleteClass={handleDeleteClass}
            onAddMasterTeacher={handleAddMasterTeacher}
            onUpdateMasterTeacher={handleUpdateMasterTeacher}
            onDeleteMasterTeacher={handleDeleteMasterTeacher}
            onAddMasterTeacherToSemester={handleAddMasterTeacherToSemester}
            onReorderSubjects={handleReorderSubjects}
            onAutoScanClassParents={handleAutoScanClassParents}
          />
        )}

        {viewMode === 'table' && (
          <>
            {/* Multi-Criteria Filters & Add Teacher Action */}
            <FilterBar
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              selectedPosition={selectedPosition}
              onPositionChange={setSelectedPosition}
              availablePositions={availablePositions}
              selectedStatus={selectedStatus}
              onStatusChange={setSelectedStatus}
              selectedCourseIds={selectedCourseIds}
              totalFilteredCoursesCount={allFilteredCourseIds.length}
              isAllFilteredSelected={isAllFilteredSelected}
              onToggleSelectAllFiltered={handleToggleSelectAllFiltered}
              onClearSelection={() => setSelectedCourseIds([])}
              onBatchAutoCalculate={handleBatchAutoCalculate}
              onBatchDeleteCourses={handleBatchDeleteCourses}
              onOpenAddTeacher={() => {
                setTeacherToEdit(null);
                setIsTeacherModalOpen(true);
              }}
            />

            {/* Resizable Merged Report Table */}
            <TeacherTable
              teachers={filteredTeachers}
              customColumns={activeSemester.customColumns || []}
              holidays={appState.holidays || []}
              selectedCourseIds={selectedCourseIds}
              isAllFilteredSelected={isAllFilteredSelected}
              onToggleSelectAllFiltered={handleToggleSelectAllFiltered}
              onToggleSelectCourse={handleToggleSelectCourse}
              onToggleSelectTeacher={handleToggleSelectTeacher}
              onUpdateCourseStatus={handleUpdateCourseStatus}
              onUpdateCourseHours={handleUpdateCourseHours}
              onUpdateCustomValue={handleUpdateCustomValue}
              onOpenQuickAddCourse={(teacher) => {
                setQuickAddTeacher(teacher);
                setIsQuickAddOpen(true);
              }}
              onEditTeacher={(teacher) => {
                setTeacherToEdit(teacher);
                setIsTeacherModalOpen(true);
              }}
              onDeleteTeacher={promptDeleteTeacher}
              onMoveTeacher={handleMoveTeacher}
              onEditCourse={(teacher, course) => {
                setTargetTeacherForCourse(teacher);
                setCourseToEdit(course);
                setIsCourseModalOpen(true);
              }}
              onDuplicateCourse={handleDuplicateCourse}
              onDeleteCourse={promptDeleteCourse}
              onOpenAddTeacher={() => {
                setTeacherToEdit(null);
                setIsTeacherModalOpen(true);
              }}
              onAutoCalculateAll={handleAutoCalculateAllCourses}
            />
          </>
        )}
      </main>

      {/* Modals */}
      <SemesterModal
        isOpen={isSemesterModalOpen}
        onClose={() => setIsSemesterModalOpen(false)}
        semesters={appState.semesters}
        activeSemesterId={appState.activeSemesterId}
        onSelectSemester={handleSelectSemester}
        onCreateSemester={handleCreateSemester}
        onUpdateSemesterInfo={handleUpdateSemesterInfo}
        onDeleteSemester={handleDeleteSemester}
        onClearSemesterAssignments={handleClearSemesterAssignments}
      />

      <CustomColumnModal
        isOpen={isCustomColumnModalOpen}
        onClose={() => setIsCustomColumnModalOpen(false)}
        customColumns={activeSemester.customColumns || []}
        onAddColumn={handleAddColumn}
        onDeleteColumn={handleDeleteColumn}
      />

      <HolidayModal
        isOpen={isHolidayModalOpen}
        onClose={() => setIsHolidayModalOpen(false)}
        holidays={appState.holidays || []}
        onAddHoliday={handleAddHoliday}
        onUpdateHoliday={handleUpdateHoliday}
        onDeleteHoliday={handleDeleteHoliday}
        onBatchDeleteHolidays={handleBatchDeleteHolidays}
        onResetDefaultHolidays={handleResetDefaultHolidays}
      />

      <TeacherModal
        isOpen={isTeacherModalOpen}
        onClose={() => setIsTeacherModalOpen(false)}
        teacherToEdit={teacherToEdit}
        semesterName={activeSemester.name}
        semesterTeachers={activeSemester.teachers}
        masterTeachers={appState.masterTeachers || []}
        onAddMasterTeacherToSemester={handleAddMasterTeacherToSemester}
        onAddBatchMasterTeachersToSemester={handleAddBatchMasterTeachersToSemester}
        onSaveTeacher={handleSaveTeacher}
      />

      <CourseModal
        isOpen={isCourseModalOpen}
        onClose={() => {
          setIsCourseModalOpen(false);
          setTargetTeacherForCourse(null);
          setCourseToEdit(null);
        }}
        targetTeacher={targetTeacherForCourse}
        courseToEdit={courseToEdit}
        masterSubjects={appState.masterSubjects || []}
        masterClasses={appState.masterClasses || []}
        customColumns={activeSemester.customColumns || []}
        onSaveCourse={handleSaveCourse}
      />

      <QuickAddCourseModal
        isOpen={isQuickAddOpen}
        onClose={() => {
          setIsQuickAddOpen(false);
          setQuickAddTeacher(null);
        }}
        teacher={quickAddTeacher}
        masterSubjects={appState.masterSubjects || []}
        masterClasses={appState.masterClasses || []}
        onAddCourse={(teacherId, courseData) => {
          handleSaveCourse(teacherId, courseData);
        }}
      />

      <BackupModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        activeSemester={activeSemester}
        snapshots={appState.snapshots}
        onCreateSnapshot={handleCreateSnapshot}
        onRestoreSnapshot={handleRestoreSnapshot}
        onDeleteSnapshot={handleDeleteSnapshot}
        onDownloadJsonBackup={handleDownloadBackup}
        onImportJsonBackup={handleImportBackup}
        onResetToCleanSlate={handleResetToCleanSlate}
        onForceSyncCloud={handleForceSync}
      />

      {/* App-Wide Confirm Modal (Replaces blocked window.confirm) */}
      <ConfirmModal
        isOpen={appConfirmState.isOpen}
        onClose={() => setAppConfirmState((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={appConfirmState.onConfirm}
        title={appConfirmState.title}
        message={appConfirmState.message}
      />
    </div>
  );
}
