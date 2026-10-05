const fs = require('fs');

const weekStartDates = [
  '2026-09-07', // W1
  '2026-09-14', // W2
  '2026-09-21', // W3
  '2026-09-28', // W4
  '2026-10-05', // W5
  '2026-10-12', // W6
  '2026-10-19', // W7
  '2026-10-26', // W8
  '2026-11-02', // W9
  '2026-11-09', // W10
  '2026-11-16', // W11
  '2026-11-23', // W12
  '2026-11-30', // W13
  '2026-12-07', // W14
  '2026-12-14', // W15
  '2026-12-21', // W16
  '2026-12-28', // W17
  '2027-01-04', // W18
  '2027-01-11', // W19
  '2027-01-18', // W20
  '2027-01-25', // W21 - Tết Âm Lịch
  '2027-02-01', // W22
  '2027-02-08', // W23
  '2027-02-15', // W24
  '2027-02-22', // W25
  '2027-03-01'  // W26
];

function getSubjectCode(name) {
  const clean = name.trim().toUpperCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Z0-9]/g, '');
  return clean.slice(0, 8);
}

// Master Classes Definition:
// Every parent group has its child classes (ending in 1, 2, 3...)
// If there's only 1 class, child is TH1
const parentClassDefs = [
  { parent: 'CNTT24TH', major: 'Công nghệ Thông tin', year: '2024-2027', students: 39, children: [{ name: 'CNTT24TH1', s: 18 }, { name: 'CNTT24TH2', s: 21 }] },
  { parent: 'LTMT24TH', major: 'Lập trình Máy tính', year: '2024-2027', students: 23, children: [{ name: 'LTMT24TH1', s: 23 }] },
  { parent: 'QTM24TH', major: 'Quản trị Mạng máy tính', year: '2024-2027', students: 25, children: [{ name: 'QTM24TH1', s: 25 }] },
  { parent: 'CNTT25TH', major: 'Công nghệ Thông tin', year: '2025-2028', students: 35, children: [{ name: 'CNTT25TH1', s: 16 }, { name: 'CNTT25TH2', s: 19 }] },
  { parent: 'LTMT25TH', major: 'Lập trình Máy tính', year: '2025-2028', students: 31, children: [{ name: 'LTMT25TH1', s: 31 }] },
  { parent: 'QTM25TH', major: 'Quản trị Mạng máy tính', year: '2025-2028', students: 38, children: [{ name: 'QTM25TH1', s: 18 }, { name: 'QTM25TH2', s: 20 }] },
  { parent: 'CNTT26TH', major: 'Công nghệ Thông tin', year: '2026-2029', students: 50, children: [{ name: 'CNTT26TH1', s: 25 }, { name: 'CNTT26TH2', s: 25 }] },
  { parent: 'LTMT26TH', major: 'Lập trình Máy tính', year: '2026-2029', students: 45, children: [{ name: 'LTMT26TH1', s: 23 }, { name: 'LTMT26TH2', s: 22 }] },
  { parent: 'QTM26TH', major: 'Quản trị Mạng máy tính', year: '2026-2029', students: 50, children: [{ name: 'QTM26TH1', s: 25 }, { name: 'QTM26TH2', s: 25 }] },
  { parent: 'CĐT26TH', major: 'Cơ Điện Tử', year: '2026-2029', students: 78, children: [{ name: 'CĐT26TH1', s: 19 }, { name: 'CĐT26TH2', s: 20 }, { name: 'CĐT26TH3', s: 19 }, { name: 'CĐT26TH4', s: 20 }] },
  { parent: 'VTHC26TH', major: 'Văn thư Hành chính', year: '2026-2029', students: 50, children: [{ name: 'VTHC26TH1', s: 25 }, { name: 'VTHC26TH2', s: 25 }] },
  { parent: 'CNTT23TH', major: 'Công nghệ Thông tin', year: '2023-2026', students: 24, children: [{ name: 'CNTT23TH1', s: 24 }] }
];

const masterClasses = [];

for (const p of parentClassDefs) {
  const childNames = p.children.map(c => c.name);
  masterClasses.push({
    id: `mc-${p.parent.toLowerCase()}`,
    name: p.parent,
    major: p.major,
    academicYear: p.year,
    studentCount: p.students,
    isParent: true,
    subgroups: childNames
  });

  for (const c of p.children) {
    masterClasses.push({
      id: `mc-${c.name.toLowerCase()}`,
      name: c.name,
      major: p.major,
      academicYear: p.year,
      studentCount: c.s,
      parentClassName: p.parent
    });
  }
}

// Master Teachers (Only 'Cơ hữu' or 'Thỉnh giảng', administrative titles in department)
const masterTeachers = [
  { id: 'mt-1', name: 'Nguyễn Thanh Phong', code: 'GV-NTP', position: 'Cơ hữu', department: 'Hiệu trưởng · Khoa Công nghệ Thông tin' },
  { id: 'mt-2', name: 'Lương Xuân Quang', code: 'GV-LXQ', position: 'Cơ hữu', department: 'Phòng ĐT&ĐBCL · Khoa CNTT' },
  { id: 'mt-3', name: 'Lê Quang Ái', code: 'GV-LQA', position: 'Cơ hữu', department: 'Trưởng Khoa · Khoa Công nghệ Thông tin' },
  { id: 'mt-4', name: 'Nguyễn Tấn Đức', code: 'GV-NTD', position: 'Cơ hữu', department: 'Khoa Công nghệ Thông tin' },
  { id: 'mt-5', name: 'Bùi Đức Tuấn', code: 'GV-BDT', position: 'Cơ hữu', department: 'Phó Trưởng Khoa · Khoa Công nghệ Thông tin' },
  { id: 'mt-6', name: 'Trần Đào Minh Hải', code: 'GV-TDMH', position: 'Cơ hữu', department: 'Khoa Công nghệ Thông tin' },

  { id: 'mt-7', name: 'Phạm Thị Duyên', code: 'GV-PTD', position: 'Thỉnh giảng', department: 'Khoa Công nghệ Thông tin' },
  { id: 'mt-8', name: 'Trần Khắc Sâm', code: 'GV-TKS', position: 'Thỉnh giảng', department: 'Khoa Công nghệ Thông tin' },
  { id: 'mt-9', name: 'Võ Triệu Bảo', code: 'GV-VTB', position: 'Thỉnh giảng', department: 'Khoa Công nghệ Thông tin' },
  { id: 'mt-10', name: 'Lê Phạm Bá Học', code: 'GV-LPBH', position: 'Thỉnh giảng', department: 'Khoa Công nghệ Thông tin' },
  { id: 'mt-11', name: 'Nguyễn Thị Tuyết Anh', code: 'GV-NTTA', position: 'Thỉnh giảng', department: 'Khoa Công nghệ Thông tin' },
  { id: 'mt-12', name: 'Đào Thụy Hạ Quyên', code: 'GV-DTHQ', position: 'Thỉnh giảng', department: 'Khoa Công nghệ Thông tin' },
  { id: 'mt-13', name: 'Đỗ Văn Thiện', code: 'GV-DVT', position: 'Thỉnh giảng', department: 'Khoa Công nghệ Thông tin' },
  { id: 'mt-14', name: 'Nguyễn Thành Lộc', code: 'GV-NTL', position: 'Thỉnh giảng', department: 'Khoa Công nghệ Thông tin' },
  { id: 'mt-15', name: 'Vũ Thị Hạnh', code: 'GV-VTH', position: 'Thỉnh giảng', department: 'Khoa Công nghệ Thông tin' },
  { id: 'mt-16', name: 'Cao Thị Hồng Sanh', code: 'GV-CTHS', position: 'Thỉnh giảng', department: 'Khoa Công nghệ Thông tin' },
  { id: 'mt-17', name: 'Trần Văn Đại', code: 'GV-TVD', position: 'Thỉnh giảng', department: 'Khoa Công nghệ Thông tin' },
  { id: 'mt-18', name: 'Trịnh Đình Thắng', code: 'GV-TDT', position: 'Thỉnh giảng', department: 'Khoa Công nghệ Thông tin' },
  { id: 'mt-19', name: 'Võ Thị Kim Liên', code: 'GV-VTKL', position: 'Thỉnh giảng', department: 'Khoa Công nghệ Thông tin' },
  { id: 'mt-20', name: 'Cao Hùng Thiên Bảo', code: 'GV-CHTB', position: 'Thỉnh giảng', department: 'Khoa Công nghệ Thông tin' },
  { id: 'mt-21', name: 'Mai Hoài Vương Linh', code: 'GV-MHVL', position: 'Thỉnh giảng', department: 'Khoa Công nghệ Thông tin' },
  { id: 'mt-22', name: 'Nguyễn Thị Lan', code: 'GV-NTL2', position: 'Thỉnh giảng', department: 'Khoa Công nghệ Thông tin' },
  { id: 'mt-23', name: 'Đào Thị Duyên', code: 'GV-DTD', position: 'Thỉnh giảng', department: 'Khoa Công nghệ Thông tin' },
  { id: 'mt-24', name: 'Trần Như Nguyện', code: 'GV-TNN', position: 'Thỉnh giảng', department: 'Khoa Công nghệ Thông tin' },
  { id: 'mt-25', name: 'Khoa Văn Hóa', code: 'DV-KVH', position: 'Cơ hữu', department: 'Khoa Văn Hóa' }
];

const rawTienDo = JSON.parse(fs.readFileSync('./docs/accurate_tien_do.json', 'utf8'));

// Normalize class names so that all classes always assign to their child class (e.g. TH1, TH2...)
function normalizeChildClassName(cls) {
  if (!cls) return 'CNTT26TH1';
  const trimmed = cls.trim();
  if (/[1-9]$/.test(trimmed)) return trimmed;
  return `${trimmed}1`;
}

const masterSubjectsMap = new Map();
const teacherCoursesMap = new Map();
masterTeachers.forEach(t => teacherCoursesMap.set(t.name, []));

let courseIdCounter = 1;

for (const a of rawTienDo.classAssignments) {
  const subjName = a.subjectName;
  const childClass = normalizeChildClassName(a.className);

  if (!masterSubjectsMap.has(subjName)) {
    masterSubjectsMap.set(subjName, {
      id: 'subj-' + (masterSubjectsMap.size + 1),
      code: getSubjectCode(subjName),
      name: subjName,
      theoryHours: a.theoryHours,
      practiceHours: a.practiceHours,
      credits: Math.max(1, Math.round((a.theoryHours + a.practiceHours) / 30 * 2) / 2) || 2,
      department: subjName === 'Anh văn chuyên ngành' || subjName === 'AVCN' ? 'Khoa Văn Hóa' : 'Khoa Công nghệ Thông tin'
    });
  }

  const courseObj = {
    id: `c-${courseIdCounter++}`,
    subjectName: subjName,
    subjectCode: masterSubjectsMap.get(subjName)?.code || getSubjectCode(subjName),
    theoryHours: a.theoryHours,
    practiceHours: a.practiceHours,
    className: childClass, // Always child class (e.g. CNTT24TH1, LTMT24TH1...)
    credits: masterSubjectsMap.get(subjName)?.credits || 2,
    status: 'Đang dạy',
    completedHours: 0,
    startDate: a.startDate || '2026-09-07',
    hoursPerSession: 4,
    scheduleSlots: a.scheduleSlots,
    customValues: {
      'col-room': a.room || ''
    }
  };

  const list = teacherCoursesMap.get(a.teacher) || [];
  list.push(courseObj);
  teacherCoursesMap.set(a.teacher, list);
}

// Add homeroom duties to teachers as assignments
for (const h of rawTienDo.homeroomDuties) {
  const childClass = normalizeChildClassName(h.className);
  const subjName = `Chủ nhiệm lớp ${h.className}`;

  if (!masterSubjectsMap.has('Chủ nhiệm lớp')) {
    masterSubjectsMap.set('Chủ nhiệm lớp', {
      id: 'subj-chunhiem',
      code: 'CN-LOP',
      name: 'Chủ nhiệm lớp',
      theoryHours: 67.5,
      practiceHours: 0,
      credits: 2,
      department: 'Khoa Công nghệ Thông tin'
    });
  }

  const courseObj = {
    id: `c-${courseIdCounter++}`,
    subjectName: subjName,
    subjectCode: 'CN-LOP',
    theoryHours: h.hours,
    practiceHours: 0,
    className: childClass,
    credits: 2,
    status: 'Đang dạy',
    completedHours: 0,
    startDate: '2026-09-07',
    hoursPerSession: 4,
    customValues: {
      'col-room': 'Phòng BM'
    }
  };

  const list = teacherCoursesMap.get(h.teacher) || [];
  list.push(courseObj);
  teacherCoursesMap.set(h.teacher, list);
}

const semesterTeachers = masterTeachers.map(mt => ({
  id: 't-sem-' + mt.id,
  name: mt.name,
  code: mt.code,
  position: mt.position,
  department: mt.department,
  courses: teacherCoursesMap.get(mt.name) || []
}));

const masterSubjects = Array.from(masterSubjectsMap.values());

const fileContent = `import { AppState, Holiday, MasterClass, MasterSubject, MasterTeacher, Semester } from '../types';

export const INITIAL_MASTER_SUBJECTS: MasterSubject[] = ${JSON.stringify(masterSubjects, null, 2)};

export const INITIAL_MASTER_CLASSES: MasterClass[] = ${JSON.stringify(masterClasses, null, 2)};

export const INITIAL_MASTER_TEACHERS: MasterTeacher[] = ${JSON.stringify(masterTeachers, null, 2)};

export const INITIAL_HOLIDAYS: Holiday[] = [
  { id: 'hol-1', name: 'Nghỉ Lễ Quốc Khánh (2/9)', date: '2026-09-02', session: 'ALL' },
  { id: 'hol-2', name: 'Ngày Nhà Giáo VN (20/11)', date: '2026-11-20', session: 'ALL' },
  { id: 'hol-3', name: 'Tết Dương Lịch 2027', date: '2027-01-01', session: 'ALL' },
  { id: 'hol-4', name: 'Nghỉ Tết Âm Lịch 2027 (Tuần 21)', date: '2027-01-25', session: 'ALL' },
  { id: 'hol-5', name: 'Nghỉ Tết Âm Lịch 2027', date: '2027-01-26', session: 'ALL' },
  { id: 'hol-6', name: 'Nghỉ Tết Âm Lịch 2027', date: '2027-01-27', session: 'ALL' },
  { id: 'hol-7', name: 'Nghỉ Tết Âm Lịch 2027', date: '2027-01-28', session: 'ALL' },
  { id: 'hol-8', name: 'Nghỉ Tết Âm Lịch 2027', date: '2027-01-29', session: 'ALL' },
  { id: 'hol-9', name: 'Nghỉ Tết Âm Lịch 2027', date: '2027-01-30', session: 'ALL' },
];

export const INITIAL_SEMESTERS: Semester[] = [
  {
    id: 'sem-2026-hk1-cntt',
    name: 'Học kỳ 1 (2026 - 2027) - Khoa CNTT',
    academicYear: '2026-2027',
    startDate: '2026-09-07',
    endDate: '2027-03-07',
    startWeekNumber: 1,
    isCurrent: true,
    createdAt: new Date().toISOString(),
    customColumns: [
      { id: 'col-room', name: 'Phòng học', type: 'text', defaultValue: '' },
    ],
    teachers: ${JSON.stringify(semesterTeachers, null, 2)},
  },
];

export const INITIAL_STATE: AppState = {
  semesters: INITIAL_SEMESTERS,
  activeSemesterId: 'sem-2026-hk1-cntt',
  masterSubjects: INITIAL_MASTER_SUBJECTS,
  masterClasses: INITIAL_MASTER_CLASSES,
  masterTeachers: INITIAL_MASTER_TEACHERS,
  holidays: INITIAL_HOLIDAYS,
  snapshots: [],
};
`;

fs.writeFileSync('./src/data/initialData.ts', fileContent, 'utf8');
console.log('Regenerated src/data/initialData.ts with clean child-class only assignments.');
