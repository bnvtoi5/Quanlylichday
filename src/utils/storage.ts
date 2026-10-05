import { AppState, CourseAssignment, CourseSchedulePhase, MasterTeacher, Semester, SnapshotBackup, Teacher, TeacherPosition, WeeklySessionSlot } from '../types';
import { INITIAL_STATE } from '../data/initialData';

const STORAGE_KEY = 'edutrack_teaching_tracker_gantt_v9';

export function normalizeTeacherPosition(pos?: string): TeacherPosition {
  if (!pos) return 'Cơ hữu';
  const clean = pos.trim().toLowerCase();
  if (clean.includes('thỉnh giảng')) {
    return 'Thỉnh giảng';
  }
  // All other school roles (Trưởng khoa, Hiệu trưởng, Cán bộ...) are 'Cơ hữu'
  return 'Cơ hữu';
}

export interface CourseAuditUpdate {
  teacher: string;
  subjectName: string;
  className: string;
  room?: string;
  buoiDay?: string;
  scheduleSlots: WeeklySessionSlot[];
  schedulePhases?: CourseSchedulePhase[];
  startDate: string;
  startWeek: number;
  hoursPerSession: number;
  sessionsPerWeek: number;
  theoryHours?: number;
  practiceHours?: number;
  mergeRemainderHours?: boolean;
}

export interface CNTT26THCourseUpdate {
  startDate: string;
  scheduleSlots: WeeklySessionSlot[];
  hoursPerSession: number;
  sessionsPerWeek: number;
  mergeRemainderHours?: boolean;
  room?: string;
  className?: string;
}

/**
 * Danh sách 70 môn học được đối soát 100% khớp từ Sheet 1 (TIẾN ĐỘ LỚP) file Excel docs/KHGV HK1 2026-2027 KHOA CNTT_5-09-2026.xls
 */
export const MASTER_EXCEL_COURSE_UPDATES: Record<string, CourseAuditUpdate> = {
  'c-1': {
    teacher: "Nguyễn Thị Tuyết Anh",
    subjectName: "HQT CSDL(MS SQL Server)",
    className: "LTMT24TH1",
    room: "2.6",
    buoiDay: "SC4",
    scheduleSlots: ["S4","C4"],
    startDate: "2026-09-09",
    startWeek: 1,
    hoursPerSession: 4,
    sessionsPerWeek: 2,
    theoryHours: 30,
    practiceHours: 45,
    mergeRemainderHours: false,
  },
  'c-2': {
    teacher: "Lê Quang Ái",
    subjectName: "Lập trình Window",
    className: "LTMT24TH1",
    room: "3.6",
    buoiDay: "SC2,3",
    scheduleSlots: ["S2","C2","S3","C3"],
    startDate: "2026-09-07",
    startWeek: 1,
    hoursPerSession: 4,
    sessionsPerWeek: 4,
    theoryHours: 45,
    practiceHours: 105,
    mergeRemainderHours: false,
  },
  'c-3': {
    teacher: "Bùi Đức Tuấn",
    subjectName: "Lập trình Web",
    className: "LTMT24TH1",
    room: "3.7",
    buoiDay: "SC2,3,4",
    scheduleSlots: ["S2","C2","S3","C3","S4","C4"],
    startDate: "2026-11-09",
    startWeek: 10,
    hoursPerSession: 4,
    sessionsPerWeek: 6,
    theoryHours: 45,
    practiceHours: 75,
    mergeRemainderHours: false,
  },
  'c-4': {
    teacher: "Trần Khắc Sâm",
    subjectName: "Hệ quản trị CSDL MS Access",
    className: "CNTT24TH1",
    room: "3.6",
    buoiDay: "S2,3,4",
    scheduleSlots: ["S2","S3","S4"],
    startDate: "2026-11-16",
    startWeek: 11,
    hoursPerSession: 4,
    sessionsPerWeek: 3,
    theoryHours: 30,
    practiceHours: 75,
    mergeRemainderHours: false,
  },
  'c-5': {
    teacher: "Trần Khắc Sâm",
    subjectName: "Hệ quản trị CSDL MS Access",
    className: "CNTT24TH2",
    room: "3.6",
    buoiDay: "C2,3,4",
    scheduleSlots: ["C2","C3","C4"],
    startDate: "2026-11-16",
    startWeek: 11,
    hoursPerSession: 4,
    sessionsPerWeek: 3,
    theoryHours: 30,
    practiceHours: 75,
    mergeRemainderHours: false,
  },
  'c-6': {
    teacher: "Trần Đào Minh Hải",
    subjectName: "Lập trình Window",
    className: "CNTT24TH1",
    room: "3.4",
    buoiDay: "S2,3,4",
    scheduleSlots: ["S2","S3","S4"],
    startDate: "2026-09-07",
    startWeek: 1,
    hoursPerSession: 4,
    sessionsPerWeek: 3,
    theoryHours: 45,
    practiceHours: 75,
    mergeRemainderHours: false,
  },
  'c-7': {
    teacher: "Võ Triệu Bảo",
    subjectName: "Lập trình Window",
    className: "CNTT24TH2",
    room: "3.4",
    buoiDay: "C2,3,4",
    scheduleSlots: ["C2","C3","C4"],
    startDate: "2026-09-07",
    startWeek: 1,
    hoursPerSession: 4,
    sessionsPerWeek: 3,
    theoryHours: 45,
    practiceHours: 75,
    mergeRemainderHours: false,
  },
  'c-8': {
    teacher: "Bùi Đức Tuấn",
    subjectName: "Thiết kế Web",
    className: "CNTT24TH1",
    room: "3.7",
    buoiDay: "C2,3,4",
    scheduleSlots: ["C2","C3","C4"],
    startDate: "2026-09-07",
    startWeek: 1,
    hoursPerSession: 4,
    sessionsPerWeek: 3,
    theoryHours: 20,
    practiceHours: 0,
    mergeRemainderHours: false,
  },
  'c-9': {
    teacher: "Đỗ Văn Thiện",
    subjectName: "Thiết kế Web",
    className: "CNTT24TH1",
    room: "3.7",
    buoiDay: "C2,3,4",
    scheduleSlots: ["C2","C3","C4"],
    startDate: "2026-09-07",
    startWeek: 1,
    hoursPerSession: 4,
    sessionsPerWeek: 3,
    theoryHours: 10,
    practiceHours: 75,
    mergeRemainderHours: false,
  },
  'c-10': {
    teacher: "Bùi Đức Tuấn",
    subjectName: "Thiết kế Web",
    className: "CNTT24TH2",
    room: "3.7",
    buoiDay: "S2,3,4",
    scheduleSlots: ["S2","S3","S4"],
    startDate: "2026-09-07",
    startWeek: 1,
    hoursPerSession: 4,
    sessionsPerWeek: 3,
    theoryHours: 30,
    practiceHours: 75,
    mergeRemainderHours: false,
  },
  'c-11': {
    teacher: "Nguyễn Tấn Đức",
    subjectName: "An toàn VSCN",
    className: "QTM24TH1",
    room: "4.4",
    buoiDay: "S4",
    scheduleSlots: ["S4"],
    startDate: "2026-09-09",
    startWeek: 1,
    hoursPerSession: 4,
    sessionsPerWeek: 1,
    theoryHours: 30,
    practiceHours: 0,
    mergeRemainderHours: false,
  },
  'c-12': {
    teacher: "Võ Triệu Bảo",
    subjectName: "QTHT WebServer và MailServer",
    className: "QTM24TH1",
    room: "3.4",
    buoiDay: "S2,3,4",
    scheduleSlots: ["S2","S3","S4"],
    startDate: "2026-11-23",
    startWeek: 12,
    hoursPerSession: 4,
    sessionsPerWeek: 3,
    theoryHours: 40,
    practiceHours: 65,
    mergeRemainderHours: false,
  },
  'c-13': {
    teacher: "Nguyễn Thành Lộc",
    subjectName: "An toàn mạng",
    className: "QTM24TH1",
    room: "4.4",
    buoiDay: "C2,4",
    scheduleSlots: ["C2","C4"],
    startDate: "2026-09-07",
    startWeek: 1,
    hoursPerSession: 4,
    sessionsPerWeek: 2,
    theoryHours: 30,
    practiceHours: 30,
    mergeRemainderHours: false,
  },
  'c-14': {
    teacher: "Phạm Thị Duyên",
    subjectName: "Đồ hoạ ứng dụng",
    className: "QTM24TH1",
    room: "4.5",
    buoiDay: "C3",
    scheduleSlots: ["C3"],
    startDate: "2026-09-08",
    startWeek: 1,
    hoursPerSession: 4,
    sessionsPerWeek: 1,
    theoryHours: 15,
    practiceHours: 30,
    mergeRemainderHours: false,
  },
  'c-15': {
    teacher: "Nguyễn Thị Tuyết Anh",
    subjectName: "Lập trình trực quan Access",
    className: "QTM24TH1",
    room: "2.6",
    buoiDay: "SC3,4",
    scheduleSlots: ["S3","C3","S4","C4"],
    startDate: "2026-11-24",
    startWeek: 12,
    hoursPerSession: 4,
    sessionsPerWeek: 4,
    theoryHours: 30,
    practiceHours: 90,
    mergeRemainderHours: false,
  },
  'c-16': {
    teacher: "Phạm Thị Duyên",
    subjectName: "Mạng căn bản",
    className: "LTMT25TH1",
    room: "3.6",
    buoiDay: "SC5",
    scheduleSlots: ["S5","C5"],
    startDate: "2026-09-10",
    startWeek: 1,
    hoursPerSession: 4,
    sessionsPerWeek: 2,
    theoryHours: 30,
    practiceHours: 30,
    mergeRemainderHours: false,
  },
  'c-17': {
    teacher: "Nguyễn Tấn Đức",
    subjectName: "Lập trình hướng đối tượng",
    className: "LTMT25TH1",
    room: "4.5",
    buoiDay: "SC6",
    scheduleSlots: ["S6","C6"],
    startDate: "2026-09-11",
    startWeek: 1,
    hoursPerSession: 4,
    sessionsPerWeek: 2,
    theoryHours: 30,
    practiceHours: 45,
    mergeRemainderHours: false,
  },
  'c-18': {
    teacher: "Trần Đào Minh Hải",
    subjectName: "Cơ sở dữ liệu",
    className: "LTMT25TH1",
    room: "3.4",
    buoiDay: "S5,6",
    scheduleSlots: ["S5","S6"],
    startDate: "2026-11-12",
    startWeek: 10,
    hoursPerSession: 4,
    sessionsPerWeek: 2,
    theoryHours: 30,
    practiceHours: 10,
    mergeRemainderHours: false,
  },
  'c-19': {
    teacher: "Nguyễn Thanh Phong",
    subjectName: "Cơ sở dữ liệu",
    className: "LTMT25TH1",
    room: "3.4",
    buoiDay: "C5,6",
    scheduleSlots: ["C5","C6"],
    startDate: "2026-11-12",
    startWeek: 10,
    hoursPerSession: 4,
    sessionsPerWeek: 2,
    theoryHours: 0,
    practiceHours: 35,
    mergeRemainderHours: false,
  },
  'c-20': {
    teacher: "Phạm Thị Duyên",
    subjectName: "Đồ họa ứng dụng",
    className: "LTMT25TH1",
    room: "4.5",
    buoiDay: "SC7",
    scheduleSlots: ["S7","C7"],
    startDate: "2026-09-12",
    startWeek: 1,
    hoursPerSession: 4,
    sessionsPerWeek: 2,
    theoryHours: 45,
    practiceHours: 75,
    mergeRemainderHours: false,
  },
  'c-21': {
    teacher: "Nguyễn Tấn Đức",
    subjectName: "Lắp ráp cài đặt máy tính",
    className: "CNTT25TH1",
    room: "4.4",
    buoiDay: "S5,7",
    scheduleSlots: ["S5","S7"],
    startDate: "2026-09-10",
    startWeek: 1,
    hoursPerSession: 4,
    sessionsPerWeek: 2,
    theoryHours: 30,
    practiceHours: 60,
    mergeRemainderHours: false,
  },
  'c-22': {
    teacher: "Trần Văn Đại",
    subjectName: "Lắp ráp cài đặt máy tính",
    className: "CNTT25TH2",
    room: "4.4",
    buoiDay: "C5,7",
    scheduleSlots: ["C5","C7"],
    startDate: "2026-09-10",
    startWeek: 1,
    hoursPerSession: 4,
    sessionsPerWeek: 2,
    theoryHours: 30,
    practiceHours: 60,
    mergeRemainderHours: false,
  },
  'c-23': {
    teacher: "Cao Hùng Thiên Bảo",
    subjectName: "Cơ sở dữ liệu",
    className: "CNTT25TH1",
    room: "3.8",
    buoiDay: "C6,7",
    scheduleSlots: ["C6","C7"],
    startDate: "2026-09-11",
    startWeek: 1,
    hoursPerSession: 4,
    sessionsPerWeek: 2,
    theoryHours: 30,
    practiceHours: 45,
    mergeRemainderHours: false,
  },
  'c-24': {
    teacher: "Cao Hùng Thiên Bảo",
    subjectName: "Cơ sở dữ liệu",
    className: "CNTT25TH2",
    room: "3.8",
    buoiDay: "S6,7",
    scheduleSlots: ["S6","S7"],
    startDate: "2026-09-11",
    startWeek: 1,
    hoursPerSession: 4,
    sessionsPerWeek: 2,
    theoryHours: 30,
    practiceHours: 45,
    mergeRemainderHours: false,
  },
  'c-25': {
    teacher: "Đỗ Văn Thiện",
    subjectName: "Lập trình HĐT  (Console)",
    className: "CNTT25TH1",
    room: "3.7",
    buoiDay: "S5,6,7",
    scheduleSlots: ["S5","S6","S7"],
    startDate: "2026-11-12",
    startWeek: 10,
    hoursPerSession: 4,
    sessionsPerWeek: 3,
    theoryHours: 30,
    practiceHours: 30,
    mergeRemainderHours: false,
  },
  'c-26': {
    teacher: "Đỗ Văn Thiện",
    subjectName: "Lập trình HĐT  (Console)",
    className: "CNTT25TH2",
    room: "3.7",
    buoiDay: "C5,6,7",
    scheduleSlots: ["C5","C6","C7"],
    startDate: "2026-11-12",
    startWeek: 10,
    hoursPerSession: 4,
    sessionsPerWeek: 3,
    theoryHours: 30,
    practiceHours: 30,
    mergeRemainderHours: false,
  },
  'c-27': {
    teacher: "Cao Thị Hồng Sanh",
    subjectName: "Nguyên lý hệ điều hành",
    className: "CNTT25TH1",
    room: "4.4",
    buoiDay: "C5,6,7",
    scheduleSlots: ["C5","C6","C7"],
    startDate: "2026-11-12",
    startWeek: 10,
    hoursPerSession: 4,
    sessionsPerWeek: 3,
    theoryHours: 30,
    practiceHours: 45,
    mergeRemainderHours: false,
  },
  'c-28': {
    teacher: "Cao Thị Hồng Sanh",
    subjectName: "Nguyên lý hệ điều hành",
    className: "CNTT25TH2",
    room: "4.4",
    buoiDay: "S5,6,7",
    scheduleSlots: ["S5","S6","S7"],
    startDate: "2026-11-12",
    startWeek: 10,
    hoursPerSession: 4,
    sessionsPerWeek: 3,
    theoryHours: 30,
    practiceHours: 45,
    mergeRemainderHours: false,
  },
  'c-29': {
    teacher: "Khoa Văn Hóa",
    subjectName: "Anh văn chuyên ngành",
    className: "CNTT25TH1",
    room: "VH",
    buoiDay: "VH",
    scheduleSlots: [],
    startDate: "2026-09-07",
    startWeek: 1,
    hoursPerSession: 4,
    sessionsPerWeek: 1,
    theoryHours: 30,
    practiceHours: 30,
    mergeRemainderHours: false,
  },
  'c-30': {
    teacher: "Khoa Văn Hóa",
    subjectName: "Anh văn chuyên ngành",
    className: "CNTT25TH2",
    room: "VH",
    buoiDay: "VH",
    scheduleSlots: [],
    startDate: "2026-09-07",
    startWeek: 1,
    hoursPerSession: 4,
    sessionsPerWeek: 1,
    theoryHours: 30,
    practiceHours: 30,
    mergeRemainderHours: false,
  },
  'c-31': {
    teacher: "Lê Quang Ái",
    subjectName: "Mạng máy tính",
    className: "QTM25TH1",
    room: "3.6",
    buoiDay: "C6,7",
    scheduleSlots: ["C6","C7"],
    startDate: "2026-09-11",
    startWeek: 1,
    hoursPerSession: 4,
    sessionsPerWeek: 2,
    theoryHours: 30,
    practiceHours: 45,
    mergeRemainderHours: false,
  },
  'c-32': {
    teacher: "Lê Quang Ái",
    subjectName: "Mạng máy tính",
    className: "QTM25TH2",
    room: "3.6",
    buoiDay: "S6,7",
    scheduleSlots: ["S6","S7"],
    startDate: "2026-09-11",
    startWeek: 1,
    hoursPerSession: 4,
    sessionsPerWeek: 2,
    theoryHours: 30,
    practiceHours: 45,
    mergeRemainderHours: false,
  },
  'c-33': {
    teacher: "Trần Đào Minh Hải",
    subjectName: "Cơ sở dữ liệu",
    className: "QTM25TH1",
    room: "3.4",
    buoiDay: "S5,6",
    scheduleSlots: ["S5","S6"],
    startDate: "2026-09-10",
    startWeek: 1,
    hoursPerSession: 4,
    sessionsPerWeek: 2,
    theoryHours: 30,
    practiceHours: 45,
    mergeRemainderHours: false,
  },
  'c-34': {
    teacher: "Trần Đào Minh Hải",
    subjectName: "Cơ sở dữ liệu",
    className: "QTM25TH2",
    room: "3.4",
    buoiDay: "C5,6",
    scheduleSlots: ["C5","C6"],
    startDate: "2026-09-10",
    startWeek: 1,
    hoursPerSession: 4,
    sessionsPerWeek: 2,
    theoryHours: 20,
    practiceHours: 45,
    mergeRemainderHours: false,
  },
  'c-35': {
    teacher: "Võ Triệu Bảo",
    subjectName: "Cơ sở dữ liệu",
    className: "QTM25TH2",
    room: "3.4",
    buoiDay: "C5,6",
    scheduleSlots: ["C5","C6"],
    startDate: "2026-09-10",
    startWeek: 1,
    hoursPerSession: 4,
    sessionsPerWeek: 2,
    theoryHours: 10,
    practiceHours: 0,
    mergeRemainderHours: false,
  },
  'c-36': {
    teacher: "Phạm Thị Duyên",
    subjectName: "Hệ quản trị CSDL SQL",
    className: "QTM25TH1",
    room: "3.6",
    buoiDay: "S5,6",
    scheduleSlots: ["S5","S6"],
    startDate: "2026-11-12",
    startWeek: 10,
    hoursPerSession: 4,
    sessionsPerWeek: 2,
    theoryHours: 30,
    practiceHours: 45,
    mergeRemainderHours: false,
  },
  'c-37': {
    teacher: "Võ Thị Kim Liên",
    subjectName: "Hệ quản trị CSDL SQL",
    className: "QTM25TH2",
    room: "3.5",
    buoiDay: "C5,6",
    scheduleSlots: ["C5","C6"],
    startDate: "2026-11-12",
    startWeek: 10,
    hoursPerSession: 4,
    sessionsPerWeek: 2,
    theoryHours: 30,
    practiceHours: 45,
    mergeRemainderHours: false,
  },
  'c-38': {
    teacher: "Trịnh Đình Thắng",
    subjectName: "Nguyên lý hệ điều hành",
    className: "QTM25TH1",
    room: "3.8",
    buoiDay: "C5,6,7",
    scheduleSlots: ["C5","C6","C7"],
    startDate: "2026-11-12",
    startWeek: 10,
    hoursPerSession: 4,
    sessionsPerWeek: 3,
    theoryHours: 30,
    practiceHours: 45,
    mergeRemainderHours: false,
  },
  'c-39': {
    teacher: "Võ Thị Kim Liên",
    subjectName: "Nguyên lý hệ điều hành",
    className: "QTM25TH2",
    room: "3.8",
    buoiDay: "S5,6,7",
    scheduleSlots: ["S5","S6","S7"],
    startDate: "2026-11-12",
    startWeek: 10,
    hoursPerSession: 4,
    sessionsPerWeek: 3,
    theoryHours: 30,
    practiceHours: 45,
    mergeRemainderHours: false,
  },
  'c-40': {
    teacher: "Khoa Văn Hóa",
    subjectName: "Anh văn chuyên ngành",
    className: "QTM25TH1",
    room: "VH",
    buoiDay: "VH",
    scheduleSlots: [],
    startDate: "2026-09-07",
    startWeek: 1,
    hoursPerSession: 4,
    sessionsPerWeek: 1,
    theoryHours: 30,
    practiceHours: 30,
    mergeRemainderHours: false,
  },
  'c-41': {
    teacher: "Khoa Văn Hóa",
    subjectName: "Anh văn chuyên ngành",
    className: "QTM25TH2",
    room: "VH",
    buoiDay: "VH",
    scheduleSlots: [],
    startDate: "2026-09-07",
    startWeek: 1,
    hoursPerSession: 4,
    sessionsPerWeek: 1,
    theoryHours: 30,
    practiceHours: 30,
    mergeRemainderHours: false,
  },
  'c-42': {
    teacher: "Đào Thụy Hạ Quyên",
    subjectName: "Tin học căn bản",
    className: "LTMT26TH1",
    room: "3.5",
    buoiDay: "S7",
    scheduleSlots: ["S7"],
    startDate: "2026-09-12",
    startWeek: 1,
    hoursPerSession: 4,
    sessionsPerWeek: 1,
    theoryHours: 15,
    practiceHours: 30,
    mergeRemainderHours: false,
  },
  'c-43': {
    teacher: "Lê Phạm Bá Học",
    subjectName: "Tin học căn bản",
    className: "LTMT26TH2",
    room: "2.6",
    buoiDay: "S7",
    scheduleSlots: ["S7"],
    startDate: "2026-09-12",
    startWeek: 1,
    hoursPerSession: 4,
    sessionsPerWeek: 1,
    theoryHours: 15,
    practiceHours: 30,
    mergeRemainderHours: false,
  },
  'c-44': {
    teacher: "Lê Phạm Bá Học",
    subjectName: "Tin học Mos",
    className: "LTMT26TH1",
    room: "2.6",
    buoiDay: "C7",
    scheduleSlots: ["C7"],
    startDate: "2026-09-12",
    startWeek: 1,
    hoursPerSession: 4,
    sessionsPerWeek: 1,
    theoryHours: 15,
    practiceHours: 45,
    mergeRemainderHours: false,
  },
  'c-45': {
    teacher: "Đào Thụy Hạ Quyên",
    subjectName: "Tin học Mos",
    className: "LTMT26TH2",
    room: "3.5",
    buoiDay: "C6",
    scheduleSlots: ["C6"],
    startDate: "2026-09-11",
    startWeek: 1,
    hoursPerSession: 4,
    sessionsPerWeek: 1,
    theoryHours: 15,
    practiceHours: 45,
    mergeRemainderHours: false,
  },
  'c-46': {
    teacher: "Võ Thị Kim Liên",
    subjectName: "Kỹ thuật lập trình",
    className: "LTMT26TH1",
    room: "4.4",
    buoiDay: "SC6",
    scheduleSlots: ["S6","C6"],
    startDate: "2026-09-11",
    startWeek: 1,
    hoursPerSession: 4,
    sessionsPerWeek: 2,
    theoryHours: 30,
    practiceHours: 30,
    mergeRemainderHours: false,
  },
  'c-47': {
    teacher: "Vũ Thị Hạnh",
    subjectName: "Kỹ thuật lập trình",
    className: "LTMT26TH2",
    room: "3.8",
    buoiDay: "C7;SC7",
    scheduleSlots: ["C7"],
    schedulePhases: [
      {
        id: "phase-c47-1",
        fromDate: "2026-11-28",
        scheduleSlots: ["S7", "C7"],
        hoursPerSession: 4,
        note: "Từ tuần 12 đổi sang dạy cả Sáng + Chiều Thứ 7 (SC7)",
      },
    ],
    startDate: "2026-11-07",
    startWeek: 9,
    hoursPerSession: 4,
    sessionsPerWeek: 1,
    theoryHours: 30,
    practiceHours: 30,
    mergeRemainderHours: false,
  },
  'c-48': {
    teacher: "Lê Phạm Bá Học",
    subjectName: "Tin học căn bản",
    className: "CNTT26TH1",
    room: "2.6",
    buoiDay: "S6",
    scheduleSlots: ["S6"],
    startDate: "2026-09-11",
    startWeek: 1,
    hoursPerSession: 4,
    sessionsPerWeek: 1,
    theoryHours: 15,
    practiceHours: 30,
    mergeRemainderHours: true,
  },
  'c-49': {
    teacher: "Nguyễn Tấn Đức",
    subjectName: "Tin học căn bản",
    className: "CNTT26TH2",
    room: "4.5",
    buoiDay: "S6",
    scheduleSlots: ["S6"],
    startDate: "2026-11-06",
    startWeek: 9,
    hoursPerSession: 4,
    sessionsPerWeek: 1,
    theoryHours: 15,
    practiceHours: 30,
    mergeRemainderHours: true,
  },
  'c-50': {
    teacher: "Nguyễn Thành Lộc",
    subjectName: "Lắp ráp cài đặt máy tính",
    className: "CNTT26TH1",
    room: "4.10",
    buoiDay: "SC56",
    scheduleSlots: ["S5","C5","S6","C6"],
    startDate: "2026-12-24",
    startWeek: 16,
    hoursPerSession: 4,
    sessionsPerWeek: 4,
    theoryHours: 30,
    practiceHours: 45,
    mergeRemainderHours: true,
  },
  'c-51': {
    teacher: "Trần Văn Đại",
    subjectName: "Lắp ráp cài đặt máy tính",
    className: "CNTT26TH2",
    room: "4.10",
    buoiDay: "SC7",
    scheduleSlots: ["S7","C7"],
    startDate: "2026-11-28",
    startWeek: 12,
    hoursPerSession: 4,
    sessionsPerWeek: 2,
    theoryHours: 30,
    practiceHours: 45,
    mergeRemainderHours: true,
  },
  'c-52': {
    teacher: "Cao Hùng Thiên Bảo",
    subjectName: "Cấu trúc dữ liệu và giải thuật",
    className: "CNTT26TH1",
    room: "4.4",
    buoiDay: "SC7",
    scheduleSlots: ["S7","C7"],
    startDate: "2026-11-14",
    startWeek: 10,
    hoursPerSession: 4,
    sessionsPerWeek: 2,
    theoryHours: 30,
    practiceHours: 45,
    mergeRemainderHours: true,
  },
  'c-53': {
    teacher: "Đào Thụy Hạ Quyên",
    subjectName: "Cấu trúc dữ liệu và giải thuật",
    className: "CNTT26TH2",
    room: "2.6",
    buoiDay: "C5",
    scheduleSlots: ["C5"],
    startDate: "2026-09-10",
    startWeek: 1,
    hoursPerSession: 4,
    sessionsPerWeek: 1,
    theoryHours: 30,
    practiceHours: 45,
    mergeRemainderHours: true,
  },
  'c-54': {
    teacher: "Trần Như Nguyện",
    subjectName: "Tin học Mos",
    className: "CNTT26TH1",
    room: "3.4",
    buoiDay: "C6",
    scheduleSlots: ["C6"],
    startDate: "2026-09-11",
    startWeek: 1,
    hoursPerSession: 4,
    sessionsPerWeek: 1,
    theoryHours: 15,
    practiceHours: 45,
    mergeRemainderHours: true,
  },
  'c-55': {
    teacher: "Lê Phạm Bá Học",
    subjectName: "Tin học Mos",
    className: "CNTT26TH2",
    room: "2.6",
    buoiDay: "C6",
    scheduleSlots: ["C6"],
    startDate: "2026-09-11",
    startWeek: 1,
    hoursPerSession: 4,
    sessionsPerWeek: 1,
    theoryHours: 15,
    practiceHours: 45,
    mergeRemainderHours: true,
  },
  'c-56': {
    teacher: "Lê Phạm Bá Học",
    subjectName: "Kỹ thuật lập trình",
    className: "CNTT26TH1",
    room: "3.5",
    buoiDay: "C5",
    scheduleSlots: ["C5"],
    startDate: "2026-09-10",
    startWeek: 1,
    hoursPerSession: 4,
    sessionsPerWeek: 1,
    theoryHours: 30,
    practiceHours: 30,
    mergeRemainderHours: true,
  },
  'c-57': {
    teacher: "Võ Thị Kim Liên",
    subjectName: "Kỹ thuật lập trình",
    className: "CNTT26TH2",
    room: "3.4",
    buoiDay: "SC7",
    scheduleSlots: ["S7","C7"],
    startDate: "2026-09-12",
    startWeek: 1,
    hoursPerSession: 4,
    sessionsPerWeek: 2,
    theoryHours: 30,
    practiceHours: 30,
    mergeRemainderHours: true,
  },
  'c-58': {
    teacher: "Nguyễn Thành Lộc",
    subjectName: "Tin học căn bản",
    className: "QTM26TH1",
    room: "3.5",
    buoiDay: "S6",
    scheduleSlots: ["S6"],
    startDate: "2026-09-11",
    startWeek: 1,
    hoursPerSession: 4,
    sessionsPerWeek: 1,
    theoryHours: 15,
    practiceHours: 30,
    mergeRemainderHours: false,
  },
  'c-59': {
    teacher: "Nguyễn Thành Lộc",
    subjectName: "Tin học căn bản",
    className: "QTM26TH2",
    room: "3.7",
    buoiDay: "C6",
    scheduleSlots: ["C6"],
    startDate: "2026-09-11",
    startWeek: 1,
    hoursPerSession: 4,
    sessionsPerWeek: 1,
    theoryHours: 15,
    practiceHours: 30,
    mergeRemainderHours: false,
  },
  'c-60': {
    teacher: "Vũ Thị Hạnh",
    subjectName: "Tin học Mos",
    className: "QTM26TH1",
    room: "3.5",
    buoiDay: "SC7",
    scheduleSlots: ["S7","C7"],
    startDate: "2026-09-12",
    startWeek: 1,
    hoursPerSession: 4,
    sessionsPerWeek: 2,
    theoryHours: 15,
    practiceHours: 45,
    mergeRemainderHours: false,
  },
  'c-61': {
    teacher: "Nguyễn Thành Lộc",
    subjectName: "Tin học Mos",
    className: "QTM26TH2",
    room: "4.10",
    buoiDay: "SC7",
    scheduleSlots: ["S7","C7"],
    startDate: "2026-09-12",
    startWeek: 1,
    hoursPerSession: 4,
    sessionsPerWeek: 2,
    theoryHours: 15,
    practiceHours: 45,
    mergeRemainderHours: false,
  },
  'c-62': {
    teacher: "Võ Thị Kim Liên",
    subjectName: "Kỹ thuật lập trình",
    className: "QTM26TH1",
    room: "4.15",
    buoiDay: "C7;SC7",
    scheduleSlots: ["C7"],
    schedulePhases: [
      {
        id: "phase-c62-1",
        fromDate: "2026-12-26",
        scheduleSlots: ["S7", "C7"],
        hoursPerSession: 4,
        note: "Từ tuần 16 đổi sang dạy cả Sáng + Chiều Thứ 7 (SC7)",
      },
    ],
    startDate: "2026-11-07",
    startWeek: 9,
    hoursPerSession: 4,
    sessionsPerWeek: 1,
    theoryHours: 30,
    practiceHours: 30,
    mergeRemainderHours: false,
  },
  'c-63': {
    teacher: "Trần Như Nguyện",
    subjectName: "Kỹ thuật lập trình",
    className: "QTM26TH2",
    room: "3.8",
    buoiDay: "S6",
    scheduleSlots: ["S6"],
    startDate: "2026-09-11",
    startWeek: 1,
    hoursPerSession: 4,
    sessionsPerWeek: 1,
    theoryHours: 30,
    practiceHours: 30,
    mergeRemainderHours: false,
  },
  'c-64': {
    teacher: "Trần Văn Đại",
    subjectName: "Tin học căn bản",
    className: "CĐT26TH1",
    room: "4.5",
    buoiDay: "SC5",
    scheduleSlots: ["S5","C5"],
    startDate: "2026-11-26",
    startWeek: 12,
    hoursPerSession: 4,
    sessionsPerWeek: 2,
    theoryHours: 0,
    practiceHours: 30,
    mergeRemainderHours: false,
  },
  'c-65': {
    teacher: "Nguyễn Tấn Đức",
    subjectName: "Tin học căn bản",
    className: "CĐT26TH1",
    room: "4.5",
    buoiDay: "SC5",
    scheduleSlots: ["S5","C5"],
    startDate: "2026-11-26",
    startWeek: 12,
    hoursPerSession: 4,
    sessionsPerWeek: 2,
    theoryHours: 15,
    practiceHours: 0,
    mergeRemainderHours: false,
  },
  'c-66': {
    teacher: "Lê Phạm Bá Học",
    subjectName: "Tin học căn bản",
    className: "CĐT26TH2",
    room: "2.6",
    buoiDay: "S5",
    scheduleSlots: ["S5"],
    startDate: "2026-09-10",
    startWeek: 1,
    hoursPerSession: 4,
    sessionsPerWeek: 1,
    theoryHours: 15,
    practiceHours: 30,
    mergeRemainderHours: false,
  },
  'c-67': {
    teacher: "Nguyễn Thành Lộc",
    subjectName: "Tin học căn bản",
    className: "CĐT26TH3",
    room: "2.6",
    buoiDay: "S7",
    scheduleSlots: ["S7"],
    startDate: "2026-11-07",
    startWeek: 9,
    hoursPerSession: 4,
    sessionsPerWeek: 1,
    theoryHours: 15,
    practiceHours: 30,
    mergeRemainderHours: false,
  },
  'c-68': {
    teacher: "Nguyễn Tấn Đức",
    subjectName: "Tin học căn bản",
    className: "CĐT26TH4",
    room: "4.5",
    buoiDay: "C6",
    scheduleSlots: ["C6"],
    startDate: "2026-11-13",
    startWeek: 10,
    hoursPerSession: 4,
    sessionsPerWeek: 1,
    theoryHours: 15,
    practiceHours: 30,
    mergeRemainderHours: false,
  },
  'c-69': {
    teacher: "Lương Xuân Quang",
    subjectName: "Tin học căn bản",
    className: "VTHC26TH1",
    room: "2.6",
    buoiDay: "",
    scheduleSlots: [],
    startDate: "2026-09-07",
    startWeek: 1,
    hoursPerSession: 4,
    sessionsPerWeek: 1,
    theoryHours: 15,
    practiceHours: 30,
    mergeRemainderHours: false,
  },
  'c-70': {
    teacher: "Lương Xuân Quang",
    subjectName: "Tin học căn bản",
    className: "VTHC26TH2",
    room: "2.6",
    buoiDay: "",
    scheduleSlots: [],
    startDate: "2026-09-07",
    startWeek: 1,
    hoursPerSession: 4,
    sessionsPerWeek: 1,
    theoryHours: 15,
    practiceHours: 30,
    mergeRemainderHours: false,
  },
};

/**
 * Tương thích ngược cho cấu hình lớp CNTT26TH
 */
export const CNTT26TH_COURSE_UPDATES: Record<string, CNTT26THCourseUpdate> = {
  'c-48': { startDate: '2026-09-11', scheduleSlots: ["S6"], hoursPerSession: 4, sessionsPerWeek: 1, mergeRemainderHours: true, room: '2.6', className: 'CNTT26TH1' },
  'c-49': { startDate: '2026-11-06', scheduleSlots: ["S6"], hoursPerSession: 4, sessionsPerWeek: 1, mergeRemainderHours: true, room: '4.5', className: 'CNTT26TH2' },
  'c-50': { startDate: '2026-12-24', scheduleSlots: ["S5","C5","S6","C6"], hoursPerSession: 4, sessionsPerWeek: 4, mergeRemainderHours: true, room: '4.10', className: 'CNTT26TH1' },
  'c-51': { startDate: '2026-11-28', scheduleSlots: ["S7","C7"], hoursPerSession: 4, sessionsPerWeek: 2, mergeRemainderHours: true, room: '4.10', className: 'CNTT26TH2' },
  'c-52': { startDate: '2026-11-14', scheduleSlots: ["S7","C7"], hoursPerSession: 4, sessionsPerWeek: 2, mergeRemainderHours: true, room: '4.4', className: 'CNTT26TH1' },
  'c-53': { startDate: '2026-09-10', scheduleSlots: ["C5"], hoursPerSession: 4, sessionsPerWeek: 1, mergeRemainderHours: true, room: '2.6', className: 'CNTT26TH2' },
  'c-54': { startDate: '2026-09-11', scheduleSlots: ["C6"], hoursPerSession: 4, sessionsPerWeek: 1, mergeRemainderHours: true, room: '3.4', className: 'CNTT26TH1' },
  'c-55': { startDate: '2026-09-11', scheduleSlots: ["C6"], hoursPerSession: 4, sessionsPerWeek: 1, mergeRemainderHours: true, room: '2.6', className: 'CNTT26TH2' },
  'c-56': { startDate: '2026-09-10', scheduleSlots: ["C5"], hoursPerSession: 4, sessionsPerWeek: 1, mergeRemainderHours: true, room: '3.5', className: 'CNTT26TH1' },
  'c-57': { startDate: '2026-09-12', scheduleSlots: ["S7","C7"], hoursPerSession: 4, sessionsPerWeek: 2, mergeRemainderHours: true, room: '3.4', className: 'CNTT26TH2' },
};

/**
 * Tìm cấu hình buổi và ngày bắt đầu phù hợp nhất cho lớp CNTT26TH
 */
export function findCNTT26THCourseUpdate(
  teacherName: string,
  courseId: string,
  className?: string,
  subjectName?: string
): CNTT26THCourseUpdate | null {
  if (CNTT26TH_COURSE_UPDATES[courseId]) {
    return CNTT26TH_COURSE_UPDATES[courseId];
  }

  const tNorm = (teacherName || '').toUpperCase();
  const sNorm = (subjectName || '').toUpperCase();
  const cNorm = (className || '').toUpperCase();

  if (!cNorm.includes('CNTT26TH') && !sNorm.includes('CNTT26TH')) {
    return null;
  }

  if (tNorm.includes('ĐỨC') && sNorm.includes('CĂN BẢN')) return CNTT26TH_COURSE_UPDATES['c-49'];
  if (tNorm.includes('HỌC') && sNorm.includes('CĂN BẢN')) return CNTT26TH_COURSE_UPDATES['c-48'];
  if (tNorm.includes('LỘC') && sNorm.includes('LẮP RÁP')) return CNTT26TH_COURSE_UPDATES['c-50'];
  if (tNorm.includes('ĐẠI') && sNorm.includes('LẮP RÁP')) return CNTT26TH_COURSE_UPDATES['c-51'];
  if (tNorm.includes('BẢO') && sNorm.includes('CẤU TRÚC')) return CNTT26TH_COURSE_UPDATES['c-52'];
  if (tNorm.includes('QUYÊN') && sNorm.includes('CẤU TRÚC')) return CNTT26TH_COURSE_UPDATES['c-53'];
  if (tNorm.includes('NGUYỆN') && sNorm.includes('MOS')) return CNTT26TH_COURSE_UPDATES['c-54'];
  if (tNorm.includes('HỌC') && sNorm.includes('MOS')) return CNTT26TH_COURSE_UPDATES['c-55'];
  if (tNorm.includes('HỌC') && sNorm.includes('LẬP TRÌNH')) return CNTT26TH_COURSE_UPDATES['c-56'];
  if (tNorm.includes('LIÊN') && sNorm.includes('LẬP TRÌNH')) return CNTT26TH_COURSE_UPDATES['c-57'];

  if (cNorm.includes('CNTT26TH1') || cNorm === 'CNTT26TH') {
    if (sNorm.includes('CĂN BẢN')) return CNTT26TH_COURSE_UPDATES['c-48'];
    if (sNorm.includes('LẮP RÁP')) return CNTT26TH_COURSE_UPDATES['c-50'];
    if (sNorm.includes('CẤU TRÚC')) return CNTT26TH_COURSE_UPDATES['c-52'];
    if (sNorm.includes('MOS')) return CNTT26TH_COURSE_UPDATES['c-54'];
    if (sNorm.includes('LẬP TRÌNH')) return CNTT26TH_COURSE_UPDATES['c-56'];
  }
  if (cNorm.includes('CNTT26TH2')) {
    if (sNorm.includes('CĂN BẢN')) return CNTT26TH_COURSE_UPDATES['c-49'];
    if (sNorm.includes('LẮP RÁP')) return CNTT26TH_COURSE_UPDATES['c-51'];
    if (sNorm.includes('CẤU TRÚC')) return CNTT26TH_COURSE_UPDATES['c-53'];
    if (sNorm.includes('MOS')) return CNTT26TH_COURSE_UPDATES['c-55'];
    if (sNorm.includes('LẬP TRÌNH')) return CNTT26TH_COURSE_UPDATES['c-57'];
  }

  return null;
}

/**
 * Chuẩn hóa học kỳ: Giữ nguyên 100% dữ liệu người dùng đã chỉnh sửa (giảng viên, môn, lớp, số tiết, dồn tiết lẻ...)
 */
export function sanitizeSemester(sem: Semester): Semester {
  return {
    ...sem,
    teachers: (sem.teachers || []).map((t: Teacher) => ({
      ...t,
      position: normalizeTeacherPosition(t.position),
      courses: (t.courses || []).map((c) => ({
        ...c,
        sessionsPerWeek: c.sessionsPerWeek || (c.scheduleSlots ? c.scheduleSlots.length : 1),
      })),
    })),
  };
}

export function loadAppState(): AppState {
  try {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return INITIAL_STATE;
    }

    // Kiểm tra tìm kiếm dữ liệu đã lưu của người dùng từ các phiên bản v9, v8, v7...
    const possibleKeys = [
      STORAGE_KEY,
      'edutrack_teaching_tracker_gantt_v8',
      'edutrack_teaching_tracker_gantt_v7',
      'edutrack_teaching_tracker_gantt_v6',
      'edutrack_teaching_tracker_gantt_v5',
    ];

    let raw: string | null = null;
    let foundKey: string | null = null;

    for (const key of possibleKeys) {
      const val = localStorage.getItem(key);
      if (val && val.trim() !== '') {
        try {
          const parsedCheck = JSON.parse(val);
          if (parsedCheck.semesters && Array.isArray(parsedCheck.semesters) && parsedCheck.semesters.length > 0) {
            raw = val;
            foundKey = key;
            break;
          }
        } catch {
          // ignore corrupted json
        }
      }
    }

    if (!raw) {
      return INITIAL_STATE;
    }

    // Tự động sao chép sang key hiện tại nếu tìm thấy ở key cũ để bảo lưu tuyệt đối
    if (foundKey && foundKey !== STORAGE_KEY) {
      try {
        localStorage.setItem(STORAGE_KEY, raw);
      } catch {
        // quota exceeded or private mode
      }
    }

    const parsed = JSON.parse(raw);
    if (!parsed.semesters || !Array.isArray(parsed.semesters) || parsed.semesters.length === 0) {
      return INITIAL_STATE;
    }

    // Bảo toàn trọn vẹn dữ liệu người dùng đã chỉnh sửa
    const sanitizedSemesters: Semester[] = parsed.semesters.map(sanitizeSemester);

    const sanitizedMasterTeachers: MasterTeacher[] = (parsed.masterTeachers || []).map((mt: MasterTeacher) => ({
      ...mt,
      position: normalizeTeacherPosition(mt.position),
    }));

    return {
      semesters: sanitizedSemesters,
      activeSemesterId: parsed.activeSemesterId || sanitizedSemesters[0].id,
      masterSubjects: parsed.masterSubjects || [],
      masterClasses: parsed.masterClasses || [],
      masterTeachers: sanitizedMasterTeachers,
      holidays: parsed.holidays || INITIAL_STATE.holidays || [],
      snapshots: parsed.snapshots || [],
      uiSettings: parsed.uiSettings || undefined,
    };
  } catch (error) {
    console.error('Error loading app state from storage:', error);
    return INITIAL_STATE;
  }
}

export function saveAppState(state: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('Error saving app state to storage:', error);
  }
}

export function createSemesterSnapshot(
  semester: Semester,
  snapshots: SnapshotBackup[]
): SnapshotBackup[] {
  const teacherCount = semester.teachers.length;
  const courseCount = semester.teachers.reduce(
    (sum, t) => sum + (t.courses ? t.courses.length : 0),
    0
  );

  const snapshot: SnapshotBackup = {
    id: `snap-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
    semesterName: semester.name,
    teacherCount,
    courseCount,
    data: JSON.parse(JSON.stringify(semester)),
  };

  const updatedSnapshots = [snapshot, ...snapshots];
  return updatedSnapshots.slice(0, 10);
}

export function downloadJsonBackup(state: AppState): void {
  try {
    const jsonStr = JSON.stringify(state, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.href = url;
    const now = new Date();
    const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
    downloadAnchor.setAttribute('download', `edutrack_backup_${dateStr}.json`);
    downloadAnchor.style.display = 'none';
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    setTimeout(() => {
      downloadAnchor.remove();
      URL.revokeObjectURL(url);
    }, 1500);
  } catch (error) {
    console.error('Failed to download json backup:', error);
  }
}
