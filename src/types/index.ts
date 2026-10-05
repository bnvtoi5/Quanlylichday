export type TeacherPosition = 'Cơ hữu' | 'Thỉnh giảng';

export type TeachingStatus = 'Đang dạy' | 'Đã hoàn thành';

export type WeeklySessionSlot =
  | 'S2'
  | 'C2'
  | 'S3'
  | 'C3'
  | 'S4'
  | 'C4'
  | 'S5'
  | 'C5'
  | 'S6'
  | 'C6'
  | 'S7'
  | 'C7'
  | 'SCN'
  | 'CCN';

export type SessionPeriod = 'ALL' | 'S' | 'C'; // ALL: Cả ngày, S: Sáng, C: Chiều

export interface Holiday {
  id: string;
  name: string; // Tên ngày nghỉ / lễ
  date: string; // YYYY-MM-DD
  session: SessionPeriod; // Buổi nghỉ: Sáng (S), Chiều (C), hoặc Cả ngày (ALL)
}

export interface CoursePauseInterval {
  id: string;
  fromDate: string; // YYYY-MM-DD
  toDate: string; // YYYY-MM-DD
  session?: SessionPeriod; // Buổi ngưng: 'ALL' (Cả ngày), 'S' (Sáng), 'C' (Chiều)
  reason?: string; // Lý do tạm ngưng
}

export interface CourseSchedulePhase {
  id: string;
  fromDate: string; // Ngày bắt đầu chuyển sang lịch/buổi dạy này (YYYY-MM-DD)
  scheduleSlots: WeeklySessionSlot[]; // Ví dụ: ['S7', 'C7'] (Đổi sang SC7)
  hoursPerSession?: number; // Số tiết mỗi buổi của giai đoạn này (nếu khác mặc định)
  room?: string; // Phòng học giai đoạn này (nếu đổi phòng)
  note?: string; // Ghi chú (VD: "Đổi sang dạy cả Sáng + Chiều thứ 7")
}

export interface CustomColumn {
  id: string;
  name: string;
  type: 'text' | 'number' | 'boolean' | 'date';
  defaultValue?: string | number | boolean;
}

export interface CourseAssignment {
  id: string;
  subjectName: string;
  subjectCode?: string;
  theoryHours: number; // Tiết lý thuyết (LT)
  practiceHours: number; // Tiết thực hành (TH)
  className: string; // Tên lớp (e.g., CNTT26TH1)
  credits?: number; // Số tín chỉ
  status: TeachingStatus; // Tự động hiển thị theo tiến độ
  completedHours: number; // Số tiết đã hoàn thành thực tế
  startDate?: string; // Ngày bắt đầu dạy (YYYY-MM-DD)
  sessionsPerWeek?: number; // Số buổi dạy mỗi tuần (dự phòng)
  hoursPerSession?: number; // Số tiết mỗi buổi (mặc định 4)
  scheduleSlots?: WeeklySessionSlot[]; // Ví dụ: ['S2', 'C4'] (Sáng thứ 2, Chiều thứ 4)
  schedulePhases?: CourseSchedulePhase[]; // Danh sách các giai đoạn chuyển đổi buổi dạy theo thời gian (VD: ban đầu C7, sau đó SC7)
  pauseIntervals?: CoursePauseInterval[]; // Danh sách các khoảng thời gian ngưng dạy
  mergeRemainderHours?: boolean; // Tích chọn: Dồn số tiết lẻ vào buổi cuối cùng (VD: 45h = 10 buổi 4h + 1 buổi 5h)
  customValues: Record<string, any>; // custom column values by id
  updatedAt?: string;

  // Co-teaching & Sequential phases support (2+ teachers sharing a course)
  coTeachingGroupId?: string; // Nhóm định danh môn đồng giảng dạy
  sequentialPhase?: number; // Thứ tự đợt dạy: 1 (Đợt 1 - Dạy trước), 2 (Đợt 2 - Dạy sau / Nối tiếp), 3...
  precedingCourseId?: string; // ID môn học dạy trước đó (để nối tiếp)
  precedingTeacherName?: string; // Tên GV dạy đợt trước để hiển thị trực quan
}

export interface Teacher {
  id: string;
  name: string;
  code?: string;
  position: TeacherPosition;
  department?: string;
  email?: string;
  phone?: string;
  courses: CourseAssignment[];
}

export interface MasterSubject {
  id: string;
  code: string;
  name: string;
  theoryHours: number;
  practiceHours: number;
  credits: number;
  department?: string;
}

export interface MasterClass {
  id: string;
  name: string;
  major?: string;
  academicYear?: string;
  studentCount?: number;
  isParent?: boolean; // Đánh dấu đây là lớp mẹ / lớp lớn (VD: CNTT24TH)
  parentClassName?: string; // Tên lớp mẹ nếu đây là nhóm con (VD: 'CNTT24TH' cho CNTT24TH1)
  subgroups?: string[]; // Danh sách tên các nhóm con (VD: ['CNTT24TH1', 'CNTT24TH2'])
}

export interface MasterTeacher {
  id: string;
  name: string;
  code?: string;
  position: TeacherPosition;
  department?: string;
  email?: string;
  phone?: string;
}

export interface Semester {
  id: string;
  name: string; // e.g. "Học kỳ 1 (2025 - 2026)"
  academicYear: string; // e.g. "2025-2026"
  isCurrent: boolean;
  createdAt: string;
  startDate?: string; // Ngày bắt đầu học kỳ (thường là Thứ 2, YYYY-MM-DD)
  endDate?: string; // Ngày kết thúc học kỳ (thường là Chủ nhật, YYYY-MM-DD)
  startWeekNumber?: number; // Số tuần bắt đầu (mặc định 1, hoặc 20 theo quy ước trường)
  teachers: Teacher[];
  customColumns: CustomColumn[];
}

export interface SnapshotBackup {
  id: string;
  timestamp: string;
  semesterName: string;
  teacherCount: number;
  courseCount: number;
  data: Semester;
}

export interface AppUiSettings {
  ganttColumnWidths?: Record<string, number>;
  ganttColumnVisibility?: Record<string, boolean>;
  ganttFitToScreen?: boolean;
  ganttWeekRange?: string;
  tableColumnWidths?: Record<string, number>;
}

export interface AppState {
  semesters: Semester[];
  activeSemesterId: string;
  masterSubjects: MasterSubject[];
  masterClasses: MasterClass[];
  masterTeachers: MasterTeacher[];
  holidays: Holiday[]; // Danh sách các ngày lễ / ngày nghỉ
  snapshots: SnapshotBackup[];
  uiSettings?: AppUiSettings; // Tùy chọn hiển thị cột & độ rộng cột đồng bộ mọi máy
}
