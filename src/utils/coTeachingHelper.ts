import { CourseAssignment, Holiday, Teacher, WeeklySessionSlot } from '../types';
import { calculateAllCourseSessions, generateSemesterWeeks } from './ganttCalculator';
import { parseDateString, toDateInputValue, WEEKLY_SLOT_INFO } from './vietnamTime';

export type CoTeachingSequenceMode = 'NEXT_WEEK' | 'IMMEDIATE_SESSION';

export interface CoTeachingItem {
  teacherId: string;
  teacherName: string;
  teacherPosition?: string;
  course: CourseAssignment;
  phase: number; // 1, 2, 3...
  isPrimaryOrTheory: boolean;
}

export interface CoTeachingGroupInfo {
  groupId: string;
  className: string;
  subjectName: string;
  subjectCode?: string;
  items: CoTeachingItem[];
  isOverlapping: boolean; // True if multiple teachers share identical/overlapping start dates
  isSequenced: boolean; // True if already properly sequenced with non-overlapping dates
  totalTheoryHours: number;
  totalPracticeHours: number;
  totalHours: number;
  suggestedStartDatePhase2?: string;
  phase1LastDate?: string;
  conflictMessage?: string;
}

/**
 * Normalizes subject names for fuzzy/clean matching (e.g. "Toán cao cấp", "Toán Cao Cấp " -> "toan cao cap")
 */
export function normalizeSubjectKey(name: string): string {
  if (!name) return '';
  return name
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ');
}

/**
 * Calculates the last session date for a given course assignment
 */
export function calculateCourseLastSessionDate(
  course: CourseAssignment,
  holidays: Holiday[] = []
): { lastDateStr: string; totalSessions: number; firstDateStr: string } | null {
  const totalHours = (course.theoryHours || 0) + (course.practiceHours || 0);
  if (totalHours <= 0) return null;

  const semesterWeeks = generateSemesterWeeks(course.startDate, undefined, 1);
  const sessions = calculateAllCourseSessions(course, semesterWeeks, holidays);

  if (sessions.length === 0) return null;

  return {
    firstDateStr: sessions[0].dateStr,
    lastDateStr: sessions[sessions.length - 1].dateStr,
    totalSessions: sessions.length,
  };
}

/**
 * Finds the next sequential start date strictly AFTER `afterDateStr` that matches one of `targetSlots`.
 * If `sequenceMode === 'NEXT_WEEK'` (default), moves to the beginning of the NEXT week so that
 * the 2 teachers do not overlap in the same transition week.
 */
export function findNextSequentialStartDate(
  afterDateStr: string,
  targetSlots: (WeeklySessionSlot | string)[] = ['S2'],
  holidays: Holiday[] = [],
  sequenceMode: CoTeachingSequenceMode = 'NEXT_WEEK'
): string {
  if (!afterDateStr) return afterDateStr;

  const activeSlots: WeeklySessionSlot[] =
    targetSlots && targetSlots.length > 0 ? (targetSlots as WeeklySessionSlot[]) : ['S2'];
  const holidayMap = new Map<string, Holiday[]>();
  holidays.forEach((h) => {
    if (!h.date) return;
    const list = holidayMap.get(h.date) || [];
    list.push(h);
    holidayMap.set(h.date, list);
  });

  const cursor = parseDateString(afterDateStr);

  if (sequenceMode === 'NEXT_WEEK') {
    // Jump to the Monday of the NEXT week (tách riêng tuần, không giao tiết trong cùng 1 tuần)
    const dayOfWeek = cursor.getDay(); // 0: Sun, 1: Mon, 2: Tue, 3: Wed...
    const daysToNextMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
    cursor.setDate(cursor.getDate() + daysToNextMonday);
  } else {
    // Jump to next day (nối tiếp ngay buổi sau)
    cursor.setDate(cursor.getDate() + 1);
  }

  let maxDays = 120; // Safety guard for up to ~4 months
  while (maxDays > 0) {
    maxDays--;
    const curDateStr = toDateInputValue(cursor);
    const dayOfWeek = cursor.getDay(); // 0: Sun, 1: Mon...

    const slotsToday = activeSlots.filter((slot) => {
      const info = WEEKLY_SLOT_INFO[slot as WeeklySessionSlot];
      return info && info.dayOfWeek === dayOfWeek;
    });

    if (slotsToday.length > 0) {
      // Check if all slots today are holidays
      const holidaysToday = holidayMap.get(curDateStr) || [];
      const isAvailable = slotsToday.some((slot) => {
        const slotInfo = WEEKLY_SLOT_INFO[slot as WeeklySessionSlot];
        const isHoli = holidaysToday.some(
          (h) => h.session === 'ALL' || h.session === slotInfo.session
        );
        return !isHoli;
      });

      if (isAvailable) {
        return curDateStr;
      }
    }

    cursor.setDate(cursor.getDate() + 1);
  }

  // Fallback: 7 days after
  const fallback = parseDateString(afterDateStr);
  fallback.setDate(fallback.getDate() + 7);
  return toDateInputValue(fallback);
}

/**
 * Scans all teachers and courses in the semester to identify co-taught courses (2+ teachers for same class & subject)
 */
export function detectCoTeachingGroups(
  teachers: Teacher[],
  holidays: Holiday[] = [],
  sequenceMode: CoTeachingSequenceMode = 'NEXT_WEEK'
): CoTeachingGroupInfo[] {
  // Map: `${classUpper}__${normSubject}` -> Array of { teacher, course }
  const groupsMap = new Map<string, Array<{ teacher: Teacher; course: CourseAssignment }>>();

  teachers.forEach((teacher) => {
    (teacher.courses || []).forEach((course) => {
      const classUpper = (course.className || '').trim().toUpperCase();
      const normSubj = normalizeSubjectKey(course.subjectName || '');
      if (!classUpper || !normSubj) return;

      const key = `${classUpper}__${normSubj}`;
      const list = groupsMap.get(key) || [];
      list.push({ teacher, course });
      groupsMap.set(key, list);
    });
  });

  const result: CoTeachingGroupInfo[] = [];

  groupsMap.forEach((rawItems, key) => {
    // Only process if co-taught by >= 2 DIFFERENT teachers (or multiple distinct course assignments)
    if (rawItems.length < 2) return;

    // Check if at least 2 distinct teacher IDs or 2 entries
    const [className] = key.split('__');
    const representativeSubject = rawItems[0].course.subjectName;
    const representativeCode = rawItems[0].course.subjectCode;

    // Determine ordering/phases:
    // 1. If explicit sequentialPhase exists on courses, sort by it.
    // 2. Otherwise: Course with theoryHours > 0 goes first (Phase 1), Practice-only goes second (Phase 2).
    // 3. Otherwise: Earlier start date goes first.
    const sortedRaw = [...rawItems].sort((a, b) => {
      const phaseA = a.course.sequentialPhase || 0;
      const phaseB = b.course.sequentialPhase || 0;
      if (phaseA > 0 && phaseB > 0) return phaseA - phaseB;
      if (phaseA > 0) return -1;
      if (phaseB > 0) return 1;

      // Prefer theory teacher first
      const hasTheoryA = (a.course.theoryHours || 0) > 0;
      const hasTheoryB = (b.course.theoryHours || 0) > 0;
      if (hasTheoryA && !hasTheoryB) return -1;
      if (!hasTheoryA && hasTheoryB) return 1;

      // Prefer earlier start date
      const dateA = a.course.startDate || '9999-99-99';
      const dateB = b.course.startDate || '9999-99-99';
      return dateA.localeCompare(dateB);
    });

    const items: CoTeachingItem[] = sortedRaw.map((item, idx) => ({
      teacherId: item.teacher.id,
      teacherName: item.teacher.name,
      teacherPosition: item.teacher.position,
      course: item.course,
      phase: item.course.sequentialPhase || idx + 1,
      isPrimaryOrTheory: (item.course.theoryHours || 0) > 0,
    }));

    // Calculate total hours
    const totalTheoryHours = items.reduce((acc, i) => acc + (i.course.theoryHours || 0), 0);
    const totalPracticeHours = items.reduce((acc, i) => acc + (i.course.practiceHours || 0), 0);
    const totalHours = totalTheoryHours + totalPracticeHours;

    // Check overlap status:
    // Phase 1 course
    const phase1Item = items[0];
    const phase1Info = calculateCourseLastSessionDate(phase1Item.course, holidays);
    const phase1LastDate = phase1Info?.lastDateStr;

    let suggestedStartDatePhase2: string | undefined;
    let isOverlapping = false;
    let isSequenced = true;
    let conflictMessage: string | undefined;

    if (items.length >= 2 && phase1LastDate) {
      const phase2Item = items[1];
      const phase2Slots = phase2Item.course.scheduleSlots || phase1Item.course.scheduleSlots || ['S2'];
      suggestedStartDatePhase2 = findNextSequentialStartDate(
        phase1LastDate,
        phase2Slots,
        holidays,
        sequenceMode
      );

      const p1Start = phase1Item.course.startDate || '';
      const p2Start = phase2Item.course.startDate || '';

      if (p1Start === p2Start || p2Start <= phase1LastDate) {
        isOverlapping = true;
        isSequenced = false;
        conflictMessage = `GV ${phase1Item.teacherName} và GV ${phase2Item.teacherName} đang trùng lịch (${p1Start || 'chưa đặt'}). Khuyên nghị nối tiếp sang tuần mới từ ${suggestedStartDatePhase2}.`;
      } else {
        isSequenced = true;
        isOverlapping = false;
      }
    }

    result.push({
      groupId: `coteach-${className}-${normalizeSubjectKey(representativeSubject)}`,
      className,
      subjectName: representativeSubject,
      subjectCode: representativeCode,
      items,
      isOverlapping,
      isSequenced,
      totalTheoryHours,
      totalPracticeHours,
      totalHours,
      phase1LastDate,
      suggestedStartDatePhase2,
      conflictMessage,
    });
  });

  return result;
}

/**
 * Automatically calculates and applies sequential start dates and linkage for a specific co-teaching group
 */
export function applySequentialCoTeachingToGroup(
  group: CoTeachingGroupInfo,
  teachers: Teacher[],
  holidays: Holiday[] = [],
  sequenceMode: CoTeachingSequenceMode = 'NEXT_WEEK'
): Teacher[] {
  if (!group || group.items.length < 2) return teachers;

  const updatedTeachers = teachers.map((t) => ({
    ...t,
    courses: (t.courses || []).map((c) => ({ ...c })),
  }));

  const groupId = group.groupId;
  let previousLastDate: string | null = null;
  let previousCourseId: string | null = null;
  let previousTeacherName: string | null = null;

  group.items.forEach((item, idx) => {
    const phase = idx + 1;
    const targetTeacher = updatedTeachers.find((t) => t.id === item.teacherId);
    if (!targetTeacher) return;

    const courseIndex = targetTeacher.courses.findIndex((c) => c.id === item.course.id);
    if (courseIndex === -1) return;

    const currentCourse = targetTeacher.courses[courseIndex];

    let newStartDate = currentCourse.startDate;

    if (idx === 0) {
      // Phase 1 (First teacher): Keep existing start date or default to semester start
      targetTeacher.courses[courseIndex] = {
        ...currentCourse,
        coTeachingGroupId: groupId,
        sequentialPhase: 1,
        precedingCourseId: undefined,
        precedingTeacherName: undefined,
      };

      // Calculate Phase 1 last session date
      const p1Info = calculateCourseLastSessionDate(targetTeacher.courses[courseIndex], holidays);
      previousLastDate = p1Info?.lastDateStr || null;
      previousCourseId = currentCourse.id;
      previousTeacherName = targetTeacher.name;
    } else {
      // Phase 2+ (Subsequent teachers): Calculate start date strictly after previous teacher's last date
      if (previousLastDate) {
        const slots = currentCourse.scheduleSlots && currentCourse.scheduleSlots.length > 0
          ? currentCourse.scheduleSlots
          : ['S2'];
        newStartDate = findNextSequentialStartDate(previousLastDate, slots, holidays, sequenceMode);
      }

      targetTeacher.courses[courseIndex] = {
        ...currentCourse,
        startDate: newStartDate,
        coTeachingGroupId: groupId,
        sequentialPhase: phase,
        precedingCourseId: previousCourseId || undefined,
        precedingTeacherName: previousTeacherName || undefined,
      };

      // Calculate this phase's last session date for any subsequent phases
      const pInfo = calculateCourseLastSessionDate(targetTeacher.courses[courseIndex], holidays);
      previousLastDate = pInfo?.lastDateStr || null;
      previousCourseId = currentCourse.id;
      previousTeacherName = targetTeacher.name;
    }
  });

  return updatedTeachers;
}

/**
 * Scans and auto-sequences ALL co-taught courses across the entire active semester
 */
export function autoSequenceAllCoTeachingGroups(
  teachers: Teacher[],
  holidays: Holiday[] = [],
  sequenceMode: CoTeachingSequenceMode = 'NEXT_WEEK'
): { updatedTeachers: Teacher[]; groupCount: number; updatedCount: number } {
  const groups = detectCoTeachingGroups(teachers, holidays, sequenceMode);
  let currentTeachers = teachers;
  let updatedCount = 0;

  groups.forEach((group) => {
    currentTeachers = applySequentialCoTeachingToGroup(group, currentTeachers, holidays, sequenceMode);
    updatedCount++;
  });

  return {
    updatedTeachers: currentTeachers,
    groupCount: groups.length,
    updatedCount,
  };
}
