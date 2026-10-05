import { User } from 'firebase/auth';
import { collection, doc, getDoc, getDocs, onSnapshot, setDoc } from 'firebase/firestore';
import { AppState, Semester } from '../types';
import {
  OperationType,
  db,
  handleFirestoreError,
} from '../firebase';

export type SyncStatus = 'offline' | 'local_only' | 'syncing' | 'synced' | 'error';

/**
 * Loads the complete application state directly from Firestore Cloud Database.
 * Ensures every computer/device opening the URL gets the exact same live version.
 */
export async function fetchInitialCloudState(): Promise<AppState | null> {
  try {
    const semestersCollection = collection(db, 'semesters');
    const semestersSnapshot = await getDocs(semestersCollection);

    if (semestersSnapshot.empty) {
      return null;
    }

    const loadedSemesters: Semester[] = [];
    semestersSnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      loadedSemesters.push({
        id: data.id || docSnap.id,
        name: data.name,
        academicYear: data.academicYear || '2026-2027',
        startDate: data.startDate,
        endDate: data.endDate,
        startWeekNumber: data.startWeekNumber || 1,
        isCurrent: data.isCurrent ?? true,
        createdAt: data.createdAt || new Date().toISOString(),
        teachers: data.teachers || [],
        customColumns: data.customColumns || [],
      });
    });

    const activeSem = loadedSemesters.find((s) => s.isCurrent) || loadedSemesters[0];

    const catalogDocRef = doc(db, 'catalogs', 'master_catalog');
    const catalogSnap = await getDoc(catalogDocRef);
    const catData = catalogSnap.exists() ? catalogSnap.data() : {};

    return {
      semesters: loadedSemesters,
      activeSemesterId: activeSem.id,
      masterSubjects: catData.masterSubjects || [],
      masterClasses: catData.masterClasses || [],
      masterTeachers: catData.masterTeachers || [],
      holidays: catData.holidays || [],
      snapshots: [],
    };
  } catch (err) {
    console.warn('Could not fetch initial cloud state (offline?):', err);
    return null;
  }
}

export interface CloudSyncOptions {
  user: User | null;
  appState: AppState;
  onRemoteStateReceived: (updatedSemester: Semester, masterCatalogUpdates?: Partial<AppState>) => void;
  onStatusChange: (status: SyncStatus, message?: string) => void;
}

// In-memory debounce timers and signature caches
let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let lastWrittenSignature: string | null = null;
let lastReceivedSemesterSignature: string | null = null;

let catalogDebounceTimer: ReturnType<typeof setTimeout> | null = null;
let lastWrittenCatalogSignature: string | null = null;
let lastReceivedCatalogSignature: string | null = null;

let unsubscribeSemester: (() => void) | null = null;
let unsubscribeCatalog: (() => void) | null = null;

/**
 * Attaches a single realtime listener to the active semester
 * and master catalog documents. Works seamlessly with or without user login.
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

  try {
    // 1. Semester listener: Realtime sync across all devices
    unsubscribeSemester = onSnapshot(
      semesterDocRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          onStatusChange('synced', 'Đám mây sẵn sàng');
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

        // Loop prevention: ignore if we just wrote this exact payload OR already received it
        if (incomingSignature === lastWrittenSignature || incomingSignature === lastReceivedSemesterSignature) {
          onStatusChange('synced', 'Đã đồng bộ đám mây');
          return;
        }

        lastReceivedSemesterSignature = incomingSignature;

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
          'synced',
          'Đã đồng bộ đám mây thời gian thực (Mọi máy xem chung)'
        );
      },
      (error) => {
        console.error('Snapshot error on semester:', error);
        onStatusChange(
          'error',
          'Lỗi kết nối đám mây'
        );
      }
    );

    // 2. Master Catalog listener: Shared subjects, classes, teachers, holidays
    unsubscribeCatalog = onSnapshot(
      catalogDocRef,
      (snapshot) => {
        if (!snapshot.exists()) return;
        const data = snapshot.data();
        const incomingCatSig = JSON.stringify({
          s: data.masterSubjects || [],
          c: data.masterClasses || [],
          t: data.masterTeachers || [],
          h: data.holidays || [],
        });

        // Loop prevention: ignore if we just wrote this or already received it
        if (incomingCatSig === lastWrittenCatalogSignature || incomingCatSig === lastReceivedCatalogSignature) {
          return;
        }

        lastReceivedCatalogSignature = incomingCatSig;

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
 * Strictly guards against echoing back remote changes.
 */
export function queueCloudSemesterSync(
  semester: Semester,
  user: User | null,
  onStatusChange: (status: SyncStatus, msg?: string) => void,
  debounceMs: number = 1500
): void {
  const payloadSignature = JSON.stringify({
    id: semester.id,
    name: semester.name,
    teachers: semester.teachers,
    customColumns: semester.customColumns,
    startDate: semester.startDate,
    endDate: semester.endDate,
  });

  // Loop prevention: avoid write if unchanged from what we wrote or remote just pushed
  if (payloadSignature === lastWrittenSignature || payloadSignature === lastReceivedSemesterSignature) {
    return;
  }

  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }

  onStatusChange('syncing', 'Đang lưu lên đám mây...');

  debounceTimer = setTimeout(async () => {
    try {
      if (payloadSignature === lastWrittenSignature || payloadSignature === lastReceivedSemesterSignature) {
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
          updatedBy: user?.uid || 'web-client',
          updatedByEmail: user?.email || 'anonymous',
        },
        { merge: true }
      );

      onStatusChange('synced', 'Đã lưu mây (Tất cả máy đều thấy)');
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
  onStatusChange?: (status: SyncStatus, msg?: string) => void
): void {
  const payloadSignature = JSON.stringify({
    s: state.masterSubjects || [],
    c: state.masterClasses || [],
    t: state.masterTeachers || [],
    h: state.holidays || [],
  });

  // Loop prevention: avoid write if unchanged from what we wrote or remote just pushed
  if (payloadSignature === lastWrittenCatalogSignature || payloadSignature === lastReceivedCatalogSignature) {
    return;
  }

  if (catalogDebounceTimer) {
    clearTimeout(catalogDebounceTimer);
  }

  catalogDebounceTimer = setTimeout(async () => {
    try {
      if (payloadSignature === lastWrittenCatalogSignature || payloadSignature === lastReceivedCatalogSignature) {
        return;
      }

      lastWrittenCatalogSignature = payloadSignature;

      const catalogDocRef = doc(db, 'catalogs', 'master_catalog');
      await setDoc(
        catalogDocRef,
        {
          id: 'master_catalog',
          masterSubjects: state.masterSubjects || [],
          masterClasses: state.masterClasses || [],
          masterTeachers: state.masterTeachers || [],
          holidays: state.holidays || [],
          updatedAt: new Date().toISOString(),
          updatedBy: user?.uid || 'web-client',
        },
        { merge: true }
      );
    } catch (err) {
      console.error('Error syncing catalog:', err);
    }
  }, 2000);
}

/**
 * Explicitly publishes full database state (active semester + all semesters + catalog)
 * to Firestore immediately. Used when user uploads a JSON backup or clicks sync.
 */
export async function publishFullStateToCloud(
  state: AppState,
  user?: User | null
): Promise<boolean> {
  try {
    for (const sem of state.semesters) {
      await setDoc(
        doc(db, 'semesters', sem.id),
        {
          id: sem.id,
          name: sem.name,
          academicYear: sem.academicYear || '2026-2027',
          startDate: sem.startDate,
          endDate: sem.endDate,
          startWeekNumber: sem.startWeekNumber || 1,
          isCurrent: sem.isCurrent ?? (sem.id === state.activeSemesterId),
          createdAt: sem.createdAt || new Date().toISOString(),
          teachers: sem.teachers || [],
          customColumns: sem.customColumns || [],
          updatedAt: new Date().toISOString(),
          updatedBy: user?.uid || 'web-sync',
          updatedByEmail: user?.email || 'anonymous',
        },
        { merge: true }
      );
    }

    await setDoc(
      doc(db, 'catalogs', 'master_catalog'),
      {
        id: 'master_catalog',
        masterSubjects: state.masterSubjects || [],
        masterClasses: state.masterClasses || [],
        masterTeachers: state.masterTeachers || [],
        holidays: state.holidays || [],
        updatedAt: new Date().toISOString(),
        updatedBy: user?.uid || 'web-sync',
      },
      { merge: true }
    );

    return true;
  } catch (err) {
    console.error('publishFullStateToCloud failed:', err);
    return false;
  }
}
