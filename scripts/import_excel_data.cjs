const fs = require('fs');
const XLSX = require('xlsx');

const workbook = XLSX.readFile('./docs/KHGV HK1 2026-2027 KHOA CNTT_5-09-2026.xls');

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
  '2027-01-25', // W21 - Nghỉ Tết
  '2027-02-01', // W22
  '2027-02-08', // W23
  '2027-02-15', // W24
  '2027-02-22', // W25
  '2027-03-01'  // W26
];

function parseScheduleSlot(note) {
  if (!note || typeof note !== 'string') return undefined;
  const str = note.trim();
  const slots = [];
  const regex = /([SCsc]+)([\d,]+)/g;
  let match;
  while ((match = regex.exec(str)) !== null) {
    const sessionTypes = match[1].toUpperCase();
    const days = match[2].split(',').map(d => d.trim()).filter(Boolean);
    for (const d of days) {
      if (sessionTypes.includes('S')) slots.push('S' + d);
      if (sessionTypes.includes('C')) slots.push('C' + d);
    }
  }
  const valid = ['S2','C2','S3','C3','S4','C4','S5','C5','S6','C6','S7','C7','SCN','CCN'];
  const res = Array.from(new Set(slots)).filter(s => valid.includes(s));
  return res.length > 0 ? res : undefined;
}

const masterSubjectsMap = new Map();
const masterTeachersMap = new Map();
const teacherAssignmentsMap = new Map();
const usedClassesSet = new Set();

function getSubjectCode(name) {
  const clean = name.trim().toUpperCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Z0-9]/g, '');
  return clean.slice(0, 8);
}

const sheetsToProcess = [
  { name: 'KH GIAO VIEN CƠ HỮU ', defaultPosition: 'Cơ hữu' },
  { name: 'KH GV HOP DONG', defaultPosition: 'Thỉnh giảng' },
  { name: 'KH GV HOP DONG BO SUNG', defaultPosition: 'Thỉnh giảng' },
  { name: 'CHUYEN', defaultPosition: 'Khoa phối hợp' }
];

let courseCounter = 1;
let teacherCounter = 1;

for (const { name: sName, defaultPosition } of sheetsToProcess) {
  const sheet = workbook.Sheets[sName];
  if (!sheet) continue;
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });
  let currentTeacherName = null;

  for (let r = 5; r < rows.length; r++) {
    const row = rows[r];
    if (!row) continue;
    const stt = row[0];
    const teacherName = row[1];
    const subjName = row[2];

    if (typeof stt === 'number' && teacherName && typeof teacherName === 'string' && teacherName.trim().length > 0) {
      currentTeacherName = teacherName.trim().replace(/\n/g, ' ');
      let pos = defaultPosition;
      let dept = 'Khoa Công nghệ Thông tin';
      if (currentTeacherName.toUpperCase().includes('KHOA VĂN HÓA')) {
        dept = 'Khoa Văn Hóa';
        pos = 'Khoa Văn Hóa';
      } else if (currentTeacherName.toUpperCase().includes('PHONG')) {
        pos = 'Hiệu trưởng';
      } else if (currentTeacherName.toUpperCase().includes('QUANG')) {
        pos = 'Phòng ĐT&ĐBCL';
      } else if (currentTeacherName.toUpperCase().includes('ÁI')) {
        pos = 'Trưởng Khoa';
      } else if (currentTeacherName.toUpperCase().includes('TUẤN') && defaultPosition === 'Cơ hữu') {
        pos = 'Phó Trưởng Khoa';
      }

      if (!masterTeachersMap.has(currentTeacherName)) {
        masterTeachersMap.set(currentTeacherName, {
          id: 'mt-' + (teacherCounter++),
          name: currentTeacherName,
          code: 'GV-' + currentTeacherName.split(' ').map(w => w[0]).join('').toUpperCase(),
          position: pos,
          department: dept
        });
      }
    }

    if (subjName && typeof subjName === 'string' && !subjName.includes('TỔNG CỘNG') && !subjName.includes('HIỆU TRƯỞNG') && !subjName.includes('PHÒNG') && !subjName.includes('MÔN HỌC') && !subjName.includes('Lý Thuyết')) {
      if (!currentTeacherName) continue;

      const cleanSubj = subjName.trim();
      const lt = row[4] !== null && row[4] !== undefined && !isNaN(Number(row[4])) ? Number(row[4]) : 0;
      const th = row[5] !== null && row[5] !== undefined && !isNaN(Number(row[5])) ? Number(row[5]) : 0;
      const rawClass = row[6] ? String(row[6]).trim() : '';
      const room = row[7] !== null && row[7] !== undefined ? String(row[7]).trim() : '';
      const group = row[8] !== null && row[8] !== undefined ? String(row[8]).trim() : '';
      const students = row[9] !== null && row[9] !== undefined && !isNaN(Number(row[9])) ? Number(row[9]) : undefined;
      const note = String(row[40] || row[41] || row[42] || row[39] || '').trim();

      if (cleanSubj.toUpperCase() === 'TRƯỞNG  KHOA' || cleanSubj.toUpperCase() === 'TRƯỞNG KHOA') {
        continue;
      }
      if (cleanSubj.includes('Thực tập tại doanh nghiệp') && lt === 0 && th === 0) {
        continue;
      }

      let targetClassName = rawClass || 'CHƯA PHÂN LỚP';
      if (rawClass && group && group !== '0' && group !== '' && group !== '1' && !rawClass.includes(group)) {
        targetClassName = rawClass + group;
      } else if (rawClass && group === '1' && !rawClass.endsWith('1')) {
        targetClassName = rawClass + '1';
      }

      usedClassesSet.add(targetClassName);
      if (rawClass) usedClassesSet.add(rawClass);

      if (!masterSubjectsMap.has(cleanSubj)) {
        masterSubjectsMap.set(cleanSubj, {
          id: 'subj-' + (masterSubjectsMap.size + 1),
          code: getSubjectCode(cleanSubj),
          name: cleanSubj,
          theoryHours: lt,
          practiceHours: th,
          credits: Math.max(1, Math.round((lt + th) / 30 * 2) / 2) || 2,
          department: cleanSubj === 'AVCN' ? 'Khoa Văn Hóa' : 'Khoa Công nghệ Thông tin'
        });
      }

      let firstActiveWeek = -1;
      for (let w = 11; w <= 36; w++) {
        if (row[w] !== null && row[w] !== undefined && row[w] !== '' && row[w] !== 0) {
          firstActiveWeek = w - 11;
          break;
        }
      }
      const startDate = firstActiveWeek >= 0 ? weekStartDates[firstActiveWeek] : '2026-09-07';
      const slots = parseScheduleSlot(note);

      const courseObj = {
        id: 'c-imp-' + (courseCounter++),
        subjectName: cleanSubj,
        subjectCode: masterSubjectsMap.get(cleanSubj)?.code || getSubjectCode(cleanSubj),
        theoryHours: lt,
        practiceHours: th,
        className: targetClassName,
        credits: masterSubjectsMap.get(cleanSubj)?.credits || 2,
        status: 'Đang dạy',
        completedHours: 0,
        startDate,
        hoursPerSession: 4,
        scheduleSlots: slots,
        customValues: {
          'col-room': room || ''
        }
      };

      if (!teacherAssignmentsMap.has(currentTeacherName)) {
        teacherAssignmentsMap.set(currentTeacherName, []);
      }
      teacherAssignmentsMap.get(currentTeacherName).push(courseObj);
    }
  }
}

// Build classes with parent-subgroup relationships
const parentBaseNames = [
  'CNTT24TH',
  'QTM24TH',
  'LTMT24TH',
  'CNTT25TH',
  'LTMT25TH',
  'QTM25TH',
  'CNTT26TH',
  'LTMT26TH',
  'QTM26TH',
  'CĐT26TH',
  'VTHC26TH',
  'CNTT23TH'
];
const masterClasses = [];

for (const pName of parentBaseNames) {
  const subgroups = [];
  usedClassesSet.forEach((cName) => {
    if (cName !== pName && cName.startsWith(pName)) {
      subgroups.push(cName);
    }
  });
  subgroups.sort();

  let major = 'Công nghệ Thông tin';
  if (pName.startsWith('QTM')) major = 'Quản trị Mạng máy tính';
  else if (pName.startsWith('LTMT')) major = 'Lập trình Máy tính';
  else if (pName.startsWith('CĐT')) major = 'Cơ Điện Tử';
  else if (pName.startsWith('VTHC')) major = 'Văn thư Hành chính';

  masterClasses.push({
    id: 'mc-' + pName.toLowerCase(),
    name: pName,
    major,
    isParent: subgroups.length > 0,
    subgroups: subgroups.length > 0 ? subgroups : undefined
  });

  for (const sub of subgroups) {
    masterClasses.push({
      id: 'mc-' + sub.toLowerCase(),
      name: sub,
      major,
      parentClassName: pName
    });
  }
}

// Build Teachers for Semester
const semesterTeachers = [];
for (const [tName, courses] of teacherAssignmentsMap.entries()) {
  const masterT = masterTeachersMap.get(tName);
  semesterTeachers.push({
    id: 't-sem-' + (semesterTeachers.length + 1),
    name: tName,
    code: masterT?.code || 'GV',
    position: masterT?.position || 'Giáo viên',
    department: masterT?.department || 'Khoa Công nghệ Thông tin',
    courses
  });
}

const fileContent = `import { AppState, Holiday, MasterClass, MasterSubject, MasterTeacher, Semester } from '../types';

export const INITIAL_MASTER_SUBJECTS: MasterSubject[] = ${JSON.stringify(Array.from(masterSubjectsMap.values()), null, 2)};

export const INITIAL_MASTER_CLASSES: MasterClass[] = ${JSON.stringify(masterClasses, null, 2)};

export const INITIAL_MASTER_TEACHERS: MasterTeacher[] = ${JSON.stringify(Array.from(masterTeachersMap.values()), null, 2)};

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
console.log('Successfully generated src/data/initialData.ts');
console.log('Total Master Subjects:', masterSubjectsMap.size);
console.log('Total Master Classes:', masterClasses.length);
console.log('Total Master Teachers:', masterTeachersMap.size);
console.log('Total Semester Teachers:', semesterTeachers.length);
console.log('Total Assigned Courses:', semesterTeachers.reduce((s, t) => s + t.courses.length, 0));
