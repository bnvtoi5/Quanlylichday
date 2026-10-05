// Utilities for Vietnam timezone and smart academic calendar progress calculations
import { CoursePauseInterval, CourseSchedulePhase, Holiday, WeeklySessionSlot } from '../types';

export const ALL_WEEKLY_SLOTS: WeeklySessionSlot[] = [
  'S2', 'C2',
  'S3', 'C3',
  'S4', 'C4',
  'S5', 'C5',
  'S6', 'C6',
  'S7', 'C7',
  'SCN', 'CCN',
];

export const WEEKLY_SLOT_INFO: Record<
  WeeklySessionSlot,
  { label: string; short: string; dayOfWeek: number; session: 'S' | 'C'; dayName: string }
> = {
  S2: { label: 'Sáng Thứ 2', short: 'S2', dayOfWeek: 1, session: 'S', dayName: 'Thứ 2' },
  C2: { label: 'Chiều Thứ 2', short: 'C2', dayOfWeek: 1, session: 'C', dayName: 'Thứ 2' },
  S3: { label: 'Sáng Thứ 3', short: 'S3', dayOfWeek: 2, session: 'S', dayName: 'Thứ 3' },
  C3: { label: 'Chiều Thứ 3', short: 'C3', dayOfWeek: 2, session: 'C', dayName: 'Thứ 3' },
  S4: { label: 'Sáng Thứ 4', short: 'S4', dayOfWeek: 3, session: 'S', dayName: 'Thứ 4' },
  C4: { label: 'Chiều Thứ 4', short: 'C4', dayOfWeek: 3, session: 'C', dayName: 'Thứ 4' },
  S5: { label: 'Sáng Thứ 5', short: 'S5', dayOfWeek: 4, session: 'S', dayName: 'Thứ 5' },
  C5: { label: 'Chiều Thứ 5', short: 'C5', dayOfWeek: 4, session: 'C', dayName: 'Thứ 5' },
  S6: { label: 'Sáng Thứ 6', short: 'S6', dayOfWeek: 5, session: 'S', dayName: 'Thứ 6' },
  C6: { label: 'Chiều Thứ 6', short: 'C6', dayOfWeek: 5, session: 'C', dayName: 'Thứ 6' },
  S7: { label: 'Sáng Thứ 7', short: 'S7', dayOfWeek: 6, session: 'S', dayName: 'Thứ 7' },
  C7: { label: 'Chiều Thứ 7', short: 'C7', dayOfWeek: 6, session: 'C', dayName: 'Thứ 7' },
  SCN: { label: 'Sáng Chủ Nhật', short: 'SCN', dayOfWeek: 0, session: 'S', dayName: 'Chủ Nhật' },
  CCN: { label: 'Chiều Chủ Nhật', short: 'CCN', dayOfWeek: 0, session: 'C', dayName: 'Chủ Nhật' },
};

/**
 * Summarize weekly slots into Vietnamese shorthand (e.g. S6, SC7, SC56, S56, C5, C6)
 */
export function formatSlotSummary(slots?: WeeklySessionSlot[]): string {
  if (!slots || slots.length === 0) return '';
  const sList = slots
    .filter((s) => s.startsWith('S') && s !== 'SCN')
    .map((s) => s.replace('S', ''));
  const cList = slots
    .filter((s) => s.startsWith('C') && s !== 'CCN')
    .map((s) => s.replace('C', ''));
  const hasSCN = slots.includes('SCN');
  const hasCCN = slots.includes('CCN');

  if (slots.length === 1) {
    return slots[0];
  }

  // Same day morning + afternoon: e.g. S7 + C7 => SC7
  if (
    sList.length === 1 &&
    cList.length === 1 &&
    sList[0] === cList[0] &&
    !hasSCN &&
    !hasCCN
  ) {
    return `SC${sList[0]}`;
  }

  // SC56: S5, C5, S6, C6
  if (
    sList.length === 2 &&
    cList.length === 2 &&
    sList.slice().sort().join('') === cList.slice().sort().join('') &&
    !hasSCN &&
    !hasCCN
  ) {
    return `SC${sList.slice().sort().join('')}`;
  }

  // All morning: e.g. S5 + S6 => S56
  if (cList.length === 0 && !hasCCN && sList.length > 1 && !hasSCN) {
    return `S${sList.slice().sort().join('')}`;
  }

  // All afternoon: e.g. C5 + C6 => C56
  if (sList.length === 0 && !hasSCN && cList.length > 1 && !hasCCN) {
    return `C${cList.slice().sort().join('')}`;
  }

  return slots.join(', ');
}

/**
 * Hiển thị tóm tắt lịch buổi dạy có hỗ trợ chuyển đổi nhiều giai đoạn:
 * Ví dụ: "C7 ➔ SC7 (từ 28/11)" hoặc "C7"
 */
export function formatCourseScheduleSummary(
  scheduleSlots?: WeeklySessionSlot[],
  schedulePhases?: CourseSchedulePhase[]
): string {
  const baseSummary = formatSlotSummary(scheduleSlots);
  const validPhases = (schedulePhases || [])
    .filter((p) => p.fromDate && p.scheduleSlots && p.scheduleSlots.length > 0)
    .sort((a, b) => a.fromDate.localeCompare(b.fromDate));

  if (validPhases.length === 0) {
    return baseSummary || '';
  }

  const parts = [baseSummary || '...'];
  validPhases.forEach((p) => {
    const slotStr = formatSlotSummary(p.scheduleSlots);
    const dateFormatted = formatVietnamDate(p.fromDate);
    parts.push(`${slotStr} (từ ${dateFormatted})`);
  });

  return parts.join(' ➔ ');
}

/**
 * Phân tích ký hiệu viết tắt buổi học tiếng Việt thành danh sách WeeklySessionSlot[]:
 * - "S6" -> ['S6'] (Sáng thứ 6)
 * - "SC7" -> ['S7', 'C7'] (Sáng thứ 7 và Chiều thứ 7)
 * - "S56" -> ['S5', 'S6'] (Sáng thứ 5 và Sáng thứ 6)
 * - "sc56" hoặc "SC56" -> ['S5', 'C5', 'S6', 'C6'] (Sáng 5, Chiều 5, Sáng 6, Chiều 6)
 * - "C5" -> ['C5'] (Chiều thứ 5)
 * - "C6" -> ['C6'] (Chiều thứ 6)
 * - "SC5" -> ['S5', 'C5'] (Sáng 5 và Chiều 5)
 * - "C7;SC7" -> ['S7', 'C7']
 */
export function parseSlotShorthand(input?: string): WeeklySessionSlot[] {
  if (!input || typeof input !== 'string') return [];
  const clean = input.trim().toUpperCase();
  if (!clean || clean === 'VH') return [];

  const slotsSet = new Set<WeeklySessionSlot>();
  const chunks = clean.split(/[;\/\n]+/).map((c) => c.trim()).filter(Boolean);

  for (const chunk of chunks) {
    const tokens = chunk.split(/[,+\s]+/).filter(Boolean);
    let currentPrefix = '';

    for (const token of tokens) {
      if (ALL_WEEKLY_SLOTS.includes(token as WeeklySessionSlot)) {
        slotsSet.add(token as WeeklySessionSlot);
        currentPrefix = token[0];
        continue;
      }

      const scMatch = token.match(/^SC([2-7]+)$/);
      if (scMatch) {
        currentPrefix = 'SC';
        for (const d of scMatch[1].split('')) {
          slotsSet.add(`S${d}` as WeeklySessionSlot);
          slotsSet.add(`C${d}` as WeeklySessionSlot);
        }
        continue;
      }

      if (token === 'SC') {
        currentPrefix = 'SC';
        continue;
      }

      const sMatch = token.match(/^S([2-7]+)$/);
      if (sMatch) {
        currentPrefix = 'S';
        for (const d of sMatch[1].split('')) {
          slotsSet.add(`S${d}` as WeeklySessionSlot);
        }
        continue;
      }

      const cMatch = token.match(/^C([2-7]+)$/);
      if (cMatch) {
        currentPrefix = 'C';
        for (const d of cMatch[1].split('')) {
          slotsSet.add(`C${d}` as WeeklySessionSlot);
        }
        continue;
      }

      if (/^[2-7]+$/.test(token)) {
        if (currentPrefix === 'SC') {
          for (const d of token.split('')) {
            slotsSet.add(`S${d}` as WeeklySessionSlot);
            slotsSet.add(`C${d}` as WeeklySessionSlot);
          }
        } else if (currentPrefix === 'S') {
          for (const d of token.split('')) {
            slotsSet.add(`S${d}` as WeeklySessionSlot);
          }
        } else if (currentPrefix === 'C') {
          for (const d of token.split('')) {
            slotsSet.add(`C${d}` as WeeklySessionSlot);
          }
        }
        continue;
      }
    }
  }

  const order: WeeklySessionSlot[] = [
    'S2', 'C2',
    'S3', 'C3',
    'S4', 'C4',
    'S5', 'C5',
    'S6', 'C6',
    'S7', 'C7',
    'SCN', 'CCN',
  ];

  return Array.from(slotsSet).sort((a, b) => order.indexOf(a) - order.indexOf(b));
}

export function getVietnamNow(): Date {
  // Convert current time to Vietnam timezone (UTC+7)
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  return new Date(utc + 3600000 * 7);
}

/**
 * Lấy mã định danh chu kỳ 6:00 AM mỗi ngày theo giờ Việt Nam.
 * Ví dụ:
 * - Nếu thời gian VN hiện tại là 05/10/2026 05:45 AM -> chu kỳ là 2026-10-04_06:00
 * - Nếu thời gian VN hiện tại là 05/10/2026 06:00 AM hoặc trễ hơn -> chu kỳ là 2026-10-05_06:00
 */
export function getVietnam6amCycleKey(vnDate: Date = getVietnamNow()): string {
  const y = vnDate.getFullYear();
  const m = String(vnDate.getMonth() + 1).padStart(2, '0');
  const d = String(vnDate.getDate()).padStart(2, '0');
  const hours = vnDate.getHours();

  if (hours < 6) {
    const prevDay = new Date(vnDate.getTime() - 24 * 3600 * 1000);
    const py = prevDay.getFullYear();
    const pm = String(prevDay.getMonth() + 1).padStart(2, '0');
    const pd = String(prevDay.getDate()).padStart(2, '0');
    return `${py}-${pm}-${pd}_06:00`;
  }
  return `${y}-${m}-${d}_06:00`;
}

export function formatVietnamDate(dateInput: Date | string): string {
  try {
    const d = typeof dateInput === 'string' ? parseDateString(dateInput) : dateInput;
    if (!d || isNaN(d.getTime())) return '';
    return d.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return String(dateInput);
  }
}

export function formatVietnamFullDate(dateInput: Date | string): string {
  try {
    const d = typeof dateInput === 'string' ? parseDateString(dateInput) : dateInput;
    if (!d || isNaN(d.getTime())) return '';
    return d.toLocaleDateString('vi-VN', {
      weekday: 'long',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return String(dateInput);
  }
}

// Helper to safely parse YYYY-MM-DD into a localized midnight Date
export function parseDateString(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

export function toDateInputValue(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function shiftDateByDays(dateStr: string, days: number): string {
  const d = parseDateString(dateStr);
  d.setDate(d.getDate() + days);
  return toDateInputValue(d);
}

export interface SmartProgressCalculation {
  startDateFormatted: string;
  todayFormatted: string;
  totalSessionsHeld: number;
  calculatedHours: number;
  totalHours: number;
  isCompleted: boolean;
  holidaySessionsSkipped: number;
  holidayDetails: string[];
  pausedDaysSkipped: number;
  pauseIntervalsDetails: string[];
  slotsFormatted: string;
  explanation: string;
}

export function calculateTeachingProgress(
  startDateStr: string | undefined,
  scheduleSlots: WeeklySessionSlot[] = [],
  hoursPerSession: number = 4,
  totalHours: number = 60,
  holidays: Holiday[] = [],
  pauseIntervals: CoursePauseInterval[] = [],
  schedulePhases: CourseSchedulePhase[] = []
): SmartProgressCalculation {
  const vnNow = getVietnamNow();
  const todayMidnight = new Date(vnNow.getFullYear(), vnNow.getMonth(), vnNow.getDate());
  const todayFormatted = formatVietnamDate(todayMidnight);

  if (!startDateStr) {
    return {
      startDateFormatted: 'Chưa đặt',
      todayFormatted,
      totalSessionsHeld: 0,
      calculatedHours: 0,
      totalHours,
      isCompleted: false,
      holidaySessionsSkipped: 0,
      holidayDetails: [],
      pausedDaysSkipped: 0,
      pauseIntervalsDetails: [],
      slotsFormatted: 'Chưa gán',
      explanation: 'Chưa cấu hình ngày bắt đầu dạy cho môn này.',
    };
  }

  const startMidnight = parseDateString(startDateStr);
  if (isNaN(startMidnight.getTime())) {
    return {
      startDateFormatted: startDateStr,
      todayFormatted,
      totalSessionsHeld: 0,
      calculatedHours: 0,
      totalHours,
      isCompleted: false,
      holidaySessionsSkipped: 0,
      holidayDetails: [],
      pausedDaysSkipped: 0,
      pauseIntervalsDetails: [],
      slotsFormatted: 'Chưa gán',
      explanation: 'Ngày bắt đầu không đúng định dạng YYYY-MM-DD.',
    };
  }

  const startDateFormatted = formatVietnamDate(startMidnight);

  // If start is in the future
  if (startMidnight.getTime() > todayMidnight.getTime()) {
    return {
      startDateFormatted,
      todayFormatted,
      totalSessionsHeld: 0,
      calculatedHours: 0,
      totalHours,
      isCompleted: false,
      holidaySessionsSkipped: 0,
      holidayDetails: [],
      pausedDaysSkipped: 0,
      pauseIntervalsDetails: [],
      slotsFormatted: scheduleSlots.join(', ') || 'Chưa gán',
      explanation: `Môn học bắt đầu vào ngày ${startDateFormatted} (chưa đến ngày học theo giờ VN).`,
    };
  }

  // Active slots in week (if none provided, fallback to default 'S2' Monday Morning)
  const activeSlots: WeeklySessionSlot[] =
    scheduleSlots && scheduleSlots.length > 0 ? scheduleSlots : ['S2'];

  const slotsFormatted = activeSlots
    .map((s) => `${s} (${WEEKLY_SLOT_INFO[s]?.label || s})`)
    .join(', ');

  // Organize holidays into map for O(1) lookup: dateStr -> Holiday[]
  const holidayMap = new Map<string, Holiday[]>();
  holidays.forEach((h) => {
    if (!h.date) return;
    const list = holidayMap.get(h.date) || [];
    list.push(h);
    holidayMap.set(h.date, list);
  });

  // Organize valid pause intervals
  const validPauseIntervals = pauseIntervals.filter(
    (p) => p.fromDate && p.toDate && p.fromDate <= p.toDate
  );

  // Organize valid schedule phases
  const validPhases = (schedulePhases || [])
    .filter((p) => p.fromDate && p.scheduleSlots && p.scheduleSlots.length > 0)
    .sort((a, b) => a.fromDate.localeCompare(b.fromDate));

  let totalSessionsHeld = 0;
  let accumulatedProgressHours = 0;
  let holidaySessionsSkipped = 0;
  const holidayDetails: string[] = [];
  let pausedDaysSkipped = 0;
  const pauseIntervalsDetails: string[] = [];

  // Iterate day by day from start date to today
  const cursor = new Date(startMidnight);

  while (cursor.getTime() <= todayMidnight.getTime()) {
    const curDateStr = toDateInputValue(cursor);
    const dayOfWeek = cursor.getDay(); // 0: Sun, 1: Mon, ..., 6: Sat

    // 1. Check if this date falls within any pause intervals
    const matchingPause = validPauseIntervals.find(
      (p) => curDateStr >= p.fromDate && curDateStr <= p.toDate
    );

    if (matchingPause) {
      pausedDaysSkipped++;
      const reasonTxt = matchingPause.reason ? ` - ${matchingPause.reason}` : '';
      const pauseStr = `${formatVietnamDate(curDateStr)} (Tạm ngưng: ${formatVietnamDate(matchingPause.fromDate)} → ${formatVietnamDate(matchingPause.toDate)}${reasonTxt})`;
      if (!pauseIntervalsDetails.includes(pauseStr) && pauseIntervalsDetails.length < 5) {
        pauseIntervalsDetails.push(pauseStr);
      }
      // Advance to next day
      cursor.setDate(cursor.getDate() + 1);
      continue;
    }

    // 2. Determine active slots and hours for curDateStr based on phases
    let currentSlots = activeSlots;
    let currentSessionHours = hoursPerSession;

    for (const phase of validPhases) {
      if (curDateStr >= phase.fromDate) {
        currentSlots = phase.scheduleSlots;
        if (phase.hoursPerSession && phase.hoursPerSession > 0) {
          currentSessionHours = phase.hoursPerSession;
        }
      }
    }

    // Check slots assigned to this day of the week
    const slotsForToday = currentSlots.filter((slot) => {
      const info = WEEKLY_SLOT_INFO[slot];
      return info && info.dayOfWeek === dayOfWeek;
    });

    for (const slot of slotsForToday) {
      const slotInfo = WEEKLY_SLOT_INFO[slot];
      const sessionPeriod = slotInfo.session; // 'S' or 'C'

      // Check if this date & session is a registered holiday
      const holidaysOnDate = holidayMap.get(curDateStr) || [];
      const holidayMatch = holidaysOnDate.find(
        (h) => h.session === 'ALL' || h.session === sessionPeriod
      );

      if (holidayMatch) {
        holidaySessionsSkipped++;
        const sessTxt =
          holidayMatch.session === 'ALL'
            ? 'Cả ngày'
            : holidayMatch.session === 'S'
            ? 'Sáng'
            : 'Chiều';
        holidayDetails.push(
          `${formatVietnamDate(curDateStr)} (${slot}): ${holidayMatch.name} (Nghỉ ${sessTxt})`
        );
      } else {
        // Valid teaching session took place!
        totalSessionsHeld++;
        accumulatedProgressHours += currentSessionHours;
      }
    }

    // Advance to next day
    cursor.setDate(cursor.getDate() + 1);
  }

  const calculatedHours = Math.min(totalHours, accumulatedProgressHours);
  const isCompleted = calculatedHours >= totalHours && totalHours > 0;

  // Build natural language explanation for confirmation popup
  const parts: string[] = [];
  const scheduleDesc = formatCourseScheduleSummary(activeSlots, validPhases);
  parts.push(
    `Lịch dạy đã chọn: ${scheduleDesc} (khoảng ${hoursPerSession} tiết/buổi).`
  );
  parts.push(
    `Từ ngày bắt đầu (${startDateFormatted}) đến hôm nay (${todayFormatted}):`
  );
  parts.push(`• Đã diễn ra: ${totalSessionsHeld} buổi dạy hợp lệ.`);

  if (holidaySessionsSkipped > 0) {
    parts.push(
      `• Đã tự động hao trừ: ${holidaySessionsSkipped} buổi do rơi vào ngày nghỉ lễ (${holidayDetails.slice(0, 3).join('; ')}${holidayDetails.length > 3 ? '...' : ''}).`
    );
  }

  if (pausedDaysSkipped > 0) {
    parts.push(
      `• Đã né ${pausedDaysSkipped} ngày nằm trong các khoảng thời gian tạm ngưng dạy.`
    );
  }

  parts.push(
    `=> Tổng số tiết đã dạy tự động tính: ${calculatedHours}/${totalHours} tiết (${totalSessionsHeld} buổi × ${hoursPerSession}h).`
  );

  return {
    startDateFormatted,
    todayFormatted,
    totalSessionsHeld,
    calculatedHours,
    totalHours,
    isCompleted,
    holidaySessionsSkipped,
    holidayDetails,
    pausedDaysSkipped,
    pauseIntervalsDetails,
    slotsFormatted,
    explanation: parts.join('\n'),
  };
}
