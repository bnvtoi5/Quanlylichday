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
  '2027-01-25', // W21 - Tết Âm Lịch
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

// Map short teacher names to canonical names
function normalizeTeacherName(name) {
  if (!name) return 'Chưa phân công';
  const n = String(name).trim().replace(/\n/g, ' ');
  const upper = n.toUpperCase();

  if (upper.includes('PHONG')) return 'Nguyễn Thanh Phong';
  if (upper.includes('QUANG')) return 'Lương Xuân Quang';
  if (upper.includes('ÁI') || upper.includes('AI')) return 'Lê Quang Ái';
  if (upper.includes('ĐỨC') || upper.includes('DUC')) return 'Nguyễn Tấn Đức';
  if (upper.includes('TUẤN') || upper.includes('TUAN')) return 'Bùi Đức Tuấn';
  if (upper.includes('HẢI') || upper.includes('HAI')) return 'Trần Đào Minh Hải';
  
  if (upper.includes('TUYẾT ANH') || upper.includes('T.ANH')) return 'Nguyễn Thị Tuyết Anh';
  if (upper.includes('THIÊN BẢO') || upper.includes('TH.BẢO')) return 'Cao Hùng Thiên Bảo';
  if (upper.includes('TRIỆU BẢO') || upper.includes('BẢO')) return 'Võ Triệu Bảo';
  if (upper.includes('HỌC')) return 'Lê Phạm Bá Học';
  if (upper.includes('HẠ QUYÊN') || upper.includes('QUYÊN')) return 'Đào Thụy Hạ Quyên';
  if (upper.includes('THIỆN')) return 'Đỗ Văn Thiện';
  if (upper.includes('LỘC')) return 'Nguyễn Thành Lộc';
  if (upper.includes('HẠNH')) return 'Vũ Thị Hạnh';
  if (upper.includes('SANH')) return 'Cao Thị Hồng Sanh';
  if (upper.includes('ĐẠI')) return 'Trần Văn Đại';
  if (upper.includes('THẮNG')) return 'Trịnh Đình Thắng';
  if (upper.includes('KIM LIÊN') || upper.includes('LIÊN')) return 'Võ Thị Kim Liên';
  if (upper.includes('LINH')) return 'Mai Hoài Vương Linh';
  if (upper.includes('LAN')) return 'Nguyễn Thị Lan';
  if (upper.includes('ĐÀO THỊ DUYÊN') || upper.includes('Đ.DUYÊN')) return 'Đào Thị Duyên';
  if (upper.includes('DUYÊN')) return 'Phạm Thị Duyên';
  if (upper.includes('SÂM')) return 'Trần Khắc Sâm';
  if (upper.includes('NGUYỆN')) return 'Trần Như Nguyện';
  if (upper.includes('VĂN HÓA') || upper === 'VH' || upper === 'KHOA VH') return 'Khoa Văn Hóa';

  return n;
}

const sheet = workbook.Sheets['TIEN DO LOP'];
const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });

let currentClassName = '';
let currentClassMajor = 'Công nghệ Thông tin';
const classAssignments = [];

// Classes definition:
// Define whether a class has subgroups or not
const classesWithSubgroups = new Set(['CNTT24TH', 'CNTT25TH', 'QTM25TH', 'LTMT26TH', 'CNTT26TH', 'QTM26TH', 'CĐT26TH', 'VTHC26TH']);

for (let r = 8; r < rows.length; r++) {
  const row = rows[r];
  if (!row) continue;
  if (row.some(c => typeof c === 'string' && c.includes('TỔNG CỘNG'))) continue;
  if (row.some(c => typeof c === 'string' && (c.includes('HIỆU TRƯỞNG') || c.includes('PHÒNG')))) break;

  const stt = row[0];
  const teacherCol = row[1];
  const subjName = row[2];
  const lt = row[4] !== null && row[4] !== undefined && !isNaN(Number(row[4])) ? Number(row[4]) : 0;
  const th = row[5] !== null && row[5] !== undefined && !isNaN(Number(row[5])) ? Number(row[5]) : 0;
  const rawClass = row[6] ? String(row[6]).trim() : '';
  const room = row[7] ? String(row[7]).trim() : '';
  const group = row[8] !== null && row[8] !== undefined ? String(row[8]).trim() : '';
  const students = row[9] !== null && row[9] !== undefined ? Number(row[9]) : undefined;
  const note = String(row[40] || row[41] || row[42] || '').trim();

  if (rawClass) {
    currentClassName = rawClass;
  }

  if (subjName && typeof subjName === 'string' && !subjName.includes('MÔN HỌC') && !subjName.includes('Lý Thuyết')) {
    const parentClass = currentClassName || rawClass;
    let actualClass = parentClass;

    if (classesWithSubgroups.has(parentClass)) {
      if (group && group !== '0' && group !== '') {
        actualClass = `${parentClass}${group}`;
      }
    }

    // Determine teacher: prioritize Col1, or override if specific replacement
    let teacher = normalizeTeacherName(teacherCol);
    if (actualClass === 'QTM24TH' && subjName.includes('An toàn mạng')) {
      teacher = 'Nguyễn Thành Lộc'; // Thay Thầy Thắng
    }
    if (actualClass === 'CNTT26TH1' && subjName.includes('Tin học Mos')) {
      teacher = 'Trần Như Nguyện'; // Thay Cô Hạnh
    }
    if (actualClass === 'QTM26TH2' && subjName.includes('Kỹ thuật lập trình')) {
      teacher = 'Trần Như Nguyện'; // Thay GV
    }

    // Find start week
    let firstActiveWeek = -1;
    for (let w = 11; w <= 36; w++) {
      if (row[w] !== null && row[w] !== undefined && row[w] !== '' && row[w] !== 0) {
        firstActiveWeek = w - 11;
        break;
      }
    }
    const startDate = firstActiveWeek >= 0 ? weekStartDates[firstActiveWeek] : '2026-09-07';
    const slots = parseScheduleSlot(note);

    classAssignments.push({
      rowIdx: r,
      subjectName: subjName.trim(),
      parentClass,
      className: actualClass,
      group: group || undefined,
      teacher,
      theoryHours: lt,
      practiceHours: th,
      room,
      students,
      startDate,
      scheduleSlots: slots,
      note
    });
  }
}

console.log('Extracted assignments count from TIEN DO LOP:', classAssignments.length);

// Also add Homeroom assignments (Chủ nhiệm) from the master sheet
const homeroomDuties = [
  { className: 'CNTT24TH', teacher: 'Nguyễn Thị Lan', hours: 67.5, students: 39 },
  { className: 'LTMT24TH', teacher: 'Trần Đào Minh Hải', hours: 67.5, students: 25 },
  { className: 'QTM24TH', teacher: 'Nguyễn Tấn Đức', hours: 67.5, students: 30 },
  { className: 'CNTT25TH', teacher: 'Bùi Đức Tuấn', hours: 67.5, students: 37 },
  { className: 'LTMT25TH', teacher: 'Nguyễn Thành Lộc', hours: 67.5, students: 30 },
  { className: 'QTM25TH', teacher: 'Mai Hoài Vương Linh', hours: 67.5, students: 38 },
  { className: 'CNTT26TH', teacher: 'Đào Thị Duyên', hours: 67.5, students: 50 },
  { className: 'LTMT26TH', teacher: 'Mai Hoài Vương Linh', hours: 67.5, students: 50 },
  { className: 'QTM26TH', teacher: 'Nguyễn Thị Lan', hours: 67.5, students: 50 },
  { className: 'CNTT23TH', teacher: 'Đào Thị Duyên', hours: 59, students: 24 }
];

console.log('Class assignments preview:');
classAssignments.forEach((ca, i) => {
  console.log(`${i+1}. [${ca.className}] ${ca.subjectName} (LT:${ca.theoryHours}h, TH:${ca.practiceHours}h) -> ${ca.teacher} | Phòng: ${ca.room} | Start: ${ca.startDate} | Slots: ${ca.scheduleSlots?.join(',') || '-'}`);
});

fs.writeFileSync('./docs/accurate_tien_do.json', JSON.stringify({ classAssignments, homeroomDuties }, null, 2));
