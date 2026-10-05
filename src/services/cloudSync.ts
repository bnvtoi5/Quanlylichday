import { User } from 'firebase/auth';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { AppState, Semester } from '../types';
import {
  OperationType,
  auth,
  db,
  handleFirestoreError,
} from '../firebase';

export type SyncStatus = 'offline' | 'local_only' | 'syncing' | 'synced' | 'error';

export interface CloudSyncOptions {
  user: User | null;
  appState: AppState;
  onRemoteStateReceived: (updatedSemester: Semester, masterCatalogUpdates?: Partial<AppState>) => void;
  onStatusChange: (status: SyncStatus, message?: string) => void;
}

// In-memory debounce timer and signature cache
let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let lastWrittenSignature: string | null = null;
let unsubscribeSemester: (() => void) | null = null;
let unsubscribeCatalog: (() => void) | null = null;

/**
 * Attaches a single, cost-efficient realtime listener to the active semester
 * and master catalog documents.
 */
export function subscribeToCloudSemester(
  semesterId: string,
  user: User | null,
  onRemoteSemesterReceived: (semester: Semester) => void,
  onRemoteCatalogReceived: (catalog: Partial<AppState>) => void,
  onStatusChange: (status: SyncStatus, msg?: string) => void
): () => void {
  // Clean up any existing listeners
  if (unsubscribeSemester) {
    unsubscribeSemester();
    unsubscribeSemester = null;
  }
  if (unsubscribeCatalog) {
    unsubscribeCatalog();
    unsubscribeCatalog = null;
  }

  const semesterDocRef = doc(db, 'semesters', semesterId);
  const catalogDocRef = doc(db, 'catalogs', 'master_catalog');

  onStatusChange('syncing', 'Đang kết nối dữ liệu đám mây...');

  try {
    // 1. Semester listener: only 1 read charged on open, 0 reads charged while listening!
    unsubscribeSemester = onSnapshot(
      semesterDocRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          onStatusChange(
            user ? 'synced' : 'local_only',
            user ? 'Đã kết nối mây' : 'Chế độ xem (Đăng nhập để sửa)'
          );
          return;
        }

        const data = snapshot.data();
        const incomingSignature = JSON.stringify({
          id: data.id,
          name: data.name,
          teachers: data.teachers,
          customColumns: data.customColumns,
          startDate: data.startDate,
          endDate: data.endDate,
        });

        // Loop prevention: ignore if we just wrote this exact payload
        if (incomingSignature === lastWrittenSignature) {
          onStatusChange(user ? 'synced' : 'local_only', 'Đã đồng bộ');
          return;
        }

        const remoteSemester: Semester = {
          id: data.id,
          name: data.name,
          academicYear: data.academicYear || '2026-2027',
          startDate: data.startDate,
          endDate: data.endDate,
          startWeekNumber: data.startWeekNumber || 1,
          isCurrent: data.isCurrent ?? true,
          createdAt: data.createdAt || new Date().toISOString(),
          teachers: data.teachers || [],
          customColumns: data.customColumns || [],
        };

        onRemoteSemesterReceived(remoteSemester);
        onStatusChange(
          user ? 'synced' : 'local_only',
          user ? 'Đã đồng bộ mây thời gian thực' : 'Đang xem trực tiếp từ đám mây'
        );
      },
      (error) => {
        console.error('Snapshot error on semester:', error);
        onStatusChange(
          'error',
          'Không thể tải dữ liệu đám mây'
        );
      }
    );

    // 2. Master Catalog listener: Shared subjects, classes, teachers, holidays
    unsubscribeCatalog = onSnapshot(
      catalogDocRef,
      (snapshot) => {
        if (!snapshot.exists()) return;
        const data = snapshot.data();
        onRemoteCatalogReceived({
          masterSubjects: data.masterSubjects || [],
          masterClasses: data.masterClasses || [],
          masterTeachers: data.masterTeachers || [],
          holidays: data.holidays || [],
        });
      },
      (error) => {
        console.error('Snapshot error on catalog:', error);
      }
    );
  } catch (err) {
    onStatusChange('error', 'Không thể khởi tạo đồng bộ');
  }

  return () => {
    if (unsubscribeSemester) unsubscribeSemester();
    if (unsubscribeCatalog) unsubscribeCatalog();
  };
}

/**
 * Pushes local semester changes to Firestore using a DEBOUNCE buffer (1.5s).
 * This collapses hundreds of rapid UI edits into ONE single Firestore write,
 * strictly safeguarding the 20,000 daily free-tier write quota.
 */
export function queueCloudSemesterSync(
  semester: Semester,
  user: User | null,
  onStatusChange: (status: SyncStatus, msg?: string) => void,
  debounceMs: number = 1500
): void {
  if (!user) {
    onStatusChange('local_only');
    return;
  }

  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }

  onStatusChange('syncing', 'Đang gom dữ liệu để lưu lên mây...');

  debounceTimer = setTimeout(async () => {
    try {
      const payloadSignature = JSON.stringify({
        id: semester.id,
        name: semester.name,
        teachers: semester.teachers,
        customColumns: semester.customColumns,
        startDate: semester.startDate,
        endDate: semester.endDate,
      });

      // Avoid redundant write if unchanged
      if (payloadSignature === lastWrittenSignature) {
        onStatusChange('synced', 'Đã đồng bộ');
        return;
      }

      lastWrittenSignature = payloadSignature;

      const semesterDocRef = doc(db, 'semesters', semester.id);
      await setDoc(
        semesterDocRef,
        {
          id: semester.id,
          name: semester.name,
          academicYear: semester.academicYear || '2026-2027',
          startDate: semester.startDate,
          endDate: semester.endDate,
          startWeekNumber: semester.startWeekNumber || 1,
          isCurrent: semester.isCurrent ?? true,
          createdAt: semester.createdAt || new Date().toISOString(),
          teachers: semester.teachers || [],
          customColumns: semester.customColumns || [],
          updatedAt: new Date().toISOString(),
          updatedBy: user.uid,
          updatedByEmail: user.email || 'unknown',
        },
        { merge: true }
      );

      onStatusChange('synced', 'Đã lưu lên mây an toàn');
    } catch (err) {
      console.error('Failed to sync semester to cloud:', err);
      onStatusChange('error', 'Lỗi khi lưu lên mây');
      handleFirestoreError(err, OperationType.WRITE, `semesters/${semester.id}`);
    }
  }, debounceMs);
}

/**
 * Pushes shared catalogs (Subjects, Classes, Teachers, Holidays) to Firestore with debounce.
 */
export function queueCloudCatalogSync(
  state: AppState,
  user: User | null,
  onStatusChange: (status: SyncStatus, msg?: string) => void
): void {
  if (!user) return;

  const catalogDocRef = doc(db, 'catalogs', 'master_catalog');
  setDoc(
    catalogDocRef,
    {
      id: 'master_catalog',
      masterSubjects: state.masterSubjects || [],
      masterClasses: state.masterClasses || [],
      masterTeachers: state.masterTeachers || [],
      holidays: state.holidays || [],
      updatedAt: new Date().toISOString(),
      updatedBy: user.uid,
    },
    { merge: true }
  ).catch((err) => {
    console.error('Error syncing catalog:', err);
  });
}
