import {
  CourseAssignment,
  CoursePauseInterval,
  Holiday,
  WeeklySessionSlot,
} from '../types';
import {
  formatVietnamDate,
  getVietnamNow,
  parseDateString,
  toDateInputValue,
  WEEKLY_SLOT_INFO,
} from './vietnamTime';

export interface SemesterWeek {
  weekIndex: number;
  weekNumber: number;
  weekLabel: string;
  mondayDateStr: string; // YYYY-MM-DD
  sundayDateStr: string; // YYYY-MM-DD
  mondayFormatted: string; // DD/MM
  sundayFormatted: string; // DD/MM
  isCurrentWeek: boolean;
}

export interface CourseSessionInfo {
  sessionIndex: number;
  dateStr: string; // YYYY-MM-DD
  dateFormatted: string; // DD/MM/YYYY
  slot: WeeklySessionSlot;
  sessionPeriod: 'S' | 'C';
  hours: number;
  isCompleted: boolean;
  weekIndex: number;
  phaseId?: string;
  room?: string;
  phaseNote?: string;
}

export interface WeekGanttCell {
  weekIndex: number;
  weekNumber: number;
  isInSpan: boolean;
  isStartWeek: boolean;
  isEndWeek: boolean;
  hasSessions: boolean;
  totalSessionsInWeek: number;
  completedSessionsInWeek: number;
  totalHoursInWeek: number;
  completedHoursInWeek: number;
  status: 'none' | 'completed' | 'in_progress' | 'partially_completed';
  sessions: CourseSessionInfo[];
  pauseNotes?: string[];
  holidayNotes?: string[];
}

export interface CourseGanttSchedule {
  courseId: string;
  totalHours: number;
  completedHours: number;
  firstSessionDateStr?: string;
  firstSessionFormatted?: string;
  lastSessionDateStr?: string;
  lastSessionFormatted?: string;
  startWeekNumber?: number;
  endWeekNumber?: number;
  totalWeeksSpan: number;
  cells: WeekGanttCell[];
}

/**
 * Format a Date object to DD/MM
 */
function formatDDMM(d: Date): string {
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}`;
}

/**
 * Generates an array of SemesterWeeks based on semester start/end dates and start week number
 */
export function generateSemesterWeeks(
  startDateStr?: string,
  endDateStr?: string,
  startWeekNumber: number = 1
): SemesterWeek[] {
  const vnNow = getVietnamNow();
  const todayMidnight = new Date(vnNow.getFullYear(), vnNow.getMonth(), vnNow.getDate());
  const todayStr = toDateInputValue(todayMidnight);

  let startD: Date;
  if (startDateStr) {
    startD = parseDateString(startDateStr);
  } else {
    startD = new Date(2026, 8, 7);
  }

  // Adjust start date to Monday if needed
  const dayOfWeek = startD.getDay(); // 0: Sun, 1: Mon...
  if (dayOfWeek !== 1) {
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    startD.setDate(startD.getDate() + diff);
  }

  // Default end date: 20 weeks later if not specified
  let endD: Date;
  if (endDateStr) {
    endD = parseDateString(endDateStr);
  } else {
    endD = new Date(startD);
    endD.setDate(endD.getDate() + 20 * 7 - 1);
  }

  const weeks: SemesterWeek[] = [];
  const cursor = new Date(startD);
  let weekIndex = 0;

  while (cursor.getTime() <= endD.getTime() || weeks.length < 15) {
    const monday = new Date(cursor);
    const sunday = new Date(cursor);
    sunday.setDate(sunday.getDate() + 6);

    const monStr = toDateInputValue(monday);
    const sunStr = toDateInputValue(sunday);

    const isCurrentWeek = todayStr >= monStr && todayStr <= sunStr;
    const currentWeekNum = startWeekNumber + weekIndex;

    weeks.push({
      weekIndex,
      weekNumber: currentWeekNum,
      weekLabel: `Tuần ${currentWeekNum}`,
      mondayDateStr: monStr,
      sundayDateStr: sunStr,
      mondayFormatted: formatDDMM(monday),
      sundayFormatted: formatDDMM(sunday),
      isCurrentWeek,
    });

    weekIndex++;
    cursor.setDate(cursor.getDate() + 7);

    if (weeks.length >= 30) break;
  }

  return weeks;
}

/**
 * Calculates every actual teaching session for a course, taking into account weekly slots, holidays, pause intervals,
 * and individual course.mergeRemainderHours setting (Dồn tiết lẻ vào buổi cuối)
 */
export function calculateAllCourseSessions(
  course: CourseAssignment,
  semesterWeeks: SemesterWeek[],
  holidays: Holiday[]
): CourseSessionInfo[] {
  const totalHours = (course.theoryHours || 0) + (course.practiceHours || 0);
  if (totalHours <= 0) return [];

  const hoursPerSession = course.hoursPerSession || 4;
  const initialSlots: WeeklySessionSlot[] =
    course.scheduleSlots && course.scheduleSlots.length > 0
      ? course.scheduleSlots
      : ['S2'];

  const validPhases = (course.schedulePhases || [])
    .filter((p) => p.fromDate && p.scheduleSlots && p.scheduleSlots.length > 0)
    .sort((a, b) => a.fromDate.localeCompare(b.fromDate));

  const startDateStr = course.startDate || semesterWeeks[0]?.mondayDateStr || '2026-09-07';
  const startMidnight = parseDateString(startDateStr);

  // Holiday lookup map: dateStr -> Holiday[]
  const holidayMap = new Map<string, Holiday[]>();
  holidays.forEach((h) => {
    if (!h.date) return;
    const list = holidayMap.get(h.date) || [];
    list.push(h);
    holidayMap.set(h.date, list);
  });

  // Valid pause intervals
  const validPauses: CoursePauseInterval[] = (course.pauseIntervals || []).filter(
    (p) => p.fromDate && p.toDate && p.fromDate <= p.toDate
  );

  // Per-course remainder handling:
  // If course.mergeRemainderHours === true and totalHours % hoursPerSession !== 0:
  // E.g. 45h with 4h/session: fullSessions = 11, remainder = 1h.
  // Sessions 1 to 10 have 4h each. Session 11 has 4 + 1 = 5h. (Total 11 sessions instead of 12)
  const remainder = Math.round((totalHours % hoursPerSession) * 100) / 100;
  const fullSessions = Math.floor(totalHours / hoursPerSession);
  const shouldMergeLast = Boolean(course.mergeRemainderHours) && remainder > 0 && fullSessions >= 1;
  const targetTotalSessions = shouldMergeLast ? fullSessions : Math.ceil(totalHours / hoursPerSession);

  const sessions: CourseSessionInfo[] = [];
  let accumulatedHours = 0;
  const cursor = new Date(startMidnight);
  let maxLoopDays = 400; // Safety guard

  while (accumulatedHours < totalHours && maxLoopDays > 0) {
    maxLoopDays--;
    const curDateStr = toDateInputValue(cursor);
    const dayOfWeek = cursor.getDay(); // 0: Sun, 1: Mon...

    // Determine active slots, session hours, and room for this day based on schedule phases
    let currentSlots = initialSlots;
    let currentSessionHours = hoursPerSession;
    let currentRoom = course.customValues?.['col-room'];
    let currentPhaseNote = undefined;
    let currentPhaseId = undefined;

    for (const phase of validPhases) {
      if (curDateStr >= phase.fromDate) {
        currentSlots = phase.scheduleSlots;
        currentPhaseId = phase.id;
        currentPhaseNote = phase.note;
        if (phase.hoursPerSession && phase.hoursPerSession > 0) {
          currentSessionHours = phase.hoursPerSession;
        }
        if (phase.room) {
          currentRoom = phase.room;
        }
      }
    }

    // Check slots assigned to this day
    const slotsToday = currentSlots.filter((slot) => {
      const info = WEEKLY_SLOT_INFO[slot];
      return info && info.dayOfWeek === dayOfWeek;
    });

    for (const slot of slotsToday) {
      if (accumulatedHours >= totalHours) break;

      const slotInfo = WEEKLY_SLOT_INFO[slot];
      const sessionPeriod = slotInfo.session; // 'S' or 'C'

      // Check pause intervals for this date and session period ('ALL', 'S', or 'C')
      const isPaused = validPauses.some((p) => {
        if (curDateStr < p.fromDate || curDateStr > p.toDate) return false;
        const pauseSession = p.session || 'ALL';
        return pauseSession === 'ALL' || pauseSession === sessionPeriod;
      });

      if (isPaused) {
        continue;
      }

      // Check holidays
      const holidaysOnDate = holidayMap.get(curDateStr) || [];
      const isHoliday = holidaysOnDate.some(
        (h) => h.session === 'ALL' || h.session === sessionPeriod
      );

      if (isHoliday) {
        continue;
      }

      // Valid session calculation
      const currentSessionIndex = sessions.length + 1;
      let sessionHours = currentSessionHours;

      if (shouldMergeLast && currentSessionIndex === targetTotalSessions) {
        // Last session takes standard session + remainder
        sessionHours = Math.round((currentSessionHours + remainder) * 100) / 100;
      } else {
        const remainingNeeded = Math.round((totalHours - accumulatedHours) * 100) / 100;
        sessionHours = Math.min(currentSessionHours, remainingNeeded);
      }

      accumulatedHours = Math.round((accumulatedHours + sessionHours) * 100) / 100;

      // Determine which semester week this session belongs to
      let weekIdx = semesterWeeks.findIndex(
        (w) => curDateStr >= w.mondayDateStr && curDateStr <= w.sundayDateStr
      );

      if (weekIdx === -1) {
        if (semesterWeeks.length > 0 && curDateStr < semesterWeeks[0].mondayDateStr) {
          weekIdx = 0;
        } else if (semesterWeeks.length > 0) {
          weekIdx = semesterWeeks.length - 1;
        } else {
          weekIdx = 0;
        }
      }

      const isCompleted = accumulatedHours <= (course.completedHours || 0);

      sessions.push({
        sessionIndex: currentSessionIndex,
        dateStr: curDateStr,
        dateFormatted: formatVietnamDate(curDateStr),
        slot,
        sessionPeriod,
        hours: sessionHours,
        isCompleted,
        weekIndex: weekIdx,
        phaseId: currentPhaseId,
        room: currentRoom,
        phaseNote: currentPhaseNote,
      });
    }

    cursor.setDate(cursor.getDate() + 1);
  }

  return sessions;
}

/**
 * Builds the complete Gantt row cells for a single course across all semester weeks
 */
export function computeCourseGanttSchedule(
  course: CourseAssignment,
  semesterWeeks: SemesterWeek[],
  holidays: Holiday[]
): CourseGanttSchedule {
  const totalHours = (course.theoryHours || 0) + (course.practiceHours || 0);
  const completedHours = Math.min(totalHours, course.completedHours || 0);
  const sessions = calculateAllCourseSessions(course, semesterWeeks, holidays);

  if (sessions.length === 0) {
    return {
      courseId: course.id,
      totalHours,
      completedHours,
      totalWeeksSpan: 0,
      cells: semesterWeeks.map((w) => ({
        weekIndex: w.weekIndex,
        weekNumber: w.weekNumber,
        isInSpan: false,
        isStartWeek: false,
        isEndWeek: false,
        hasSessions: false,
        totalSessionsInWeek: 0,
        completedSessionsInWeek: 0,
        totalHoursInWeek: 0,
        completedHoursInWeek: 0,
        status: 'none',
        sessions: [],
      })),
    };
  }

  const firstSession = sessions[0];
  const lastSession = sessions[sessions.length - 1];

  const minWeekIdx = Math.min(...sessions.map((s) => s.weekIndex));
  const maxWeekIdx = Math.max(...sessions.map((s) => s.weekIndex));

  const cells: WeekGanttCell[] = semesterWeeks.map((week) => {
    const weekIdx = week.weekIndex;
    const isInSpan = weekIdx >= minWeekIdx && weekIdx <= maxWeekIdx;
    const isStartWeek = weekIdx === minWeekIdx;
    const isEndWeek = weekIdx === maxWeekIdx;

    const sessionsInWeek = sessions.filter((s) => s.weekIndex === weekIdx);
    const hasSessions = sessionsInWeek.length > 0;

    const totalSessionsInWeek = sessionsInWeek.length;
    const completedSessionsInWeek = sessionsInWeek.filter((s) => s.isCompleted).length;
    const totalHoursInWeek =
      Math.round(sessionsInWeek.reduce((s, c) => s + c.hours, 0) * 100) / 100;
    const completedHoursInWeek =
      Math.round(
        sessionsInWeek
          .filter((s) => s.isCompleted)
          .reduce((s, c) => s + c.hours, 0) * 100
      ) / 100;

    let status: 'none' | 'completed' | 'in_progress' | 'partially_completed' = 'none';
    if (hasSessions || isInSpan) {
      if (completedSessionsInWeek === totalSessionsInWeek && totalSessionsInWeek > 0) {
        status = 'completed';
      } else if (completedSessionsInWeek > 0 && completedSessionsInWeek < totalSessionsInWeek) {
        status = 'partially_completed';
      } else {
        status = 'in_progress';
      }
    }

    return {
      weekIndex: weekIdx,
      weekNumber: week.weekNumber,
      isInSpan,
      isStartWeek,
      isEndWeek,
      hasSessions,
      totalSessionsInWeek,
      completedSessionsInWeek,
      totalHoursInWeek,
      completedHoursInWeek,
      status,
      sessions: sessionsInWeek,
    };
  });

  return {
    courseId: course.id,
    totalHours,
    completedHours,
    firstSessionDateStr: firstSession.dateStr,
    firstSessionFormatted: firstSession.dateFormatted,
    lastSessionDateStr: lastSession.dateStr,
    lastSessionFormatted: lastSession.dateFormatted,
    startWeekNumber: semesterWeeks[minWeekIdx]?.weekNumber,
    endWeekNumber: semesterWeeks[maxWeekIdx]?.weekNumber,
    totalWeeksSpan: maxWeekIdx - minWeekIdx + 1,
    cells,
  };
}
