import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';
import { Holiday, Semester, Teacher } from '../types';
import {
  computeCourseGanttSchedule,
  generateSemesterWeeks,
} from './ganttCalculator';
import { getCanonicalParentName } from './classGrouping';
import { formatCourseScheduleSummary, formatSlotSummary, formatVietnamDate } from './vietnamTime';

export interface DirectGanttPdfOptions {
  semester: Semester;
  teachers: Teacher[];
  holidays: Holiday[];
  titleSuffix?: string;
  fileNamePrefix?: string;
  weekColWidth?: number;
  groupBy?: 'teacher' | 'class';
  maxWeeks?: number;
}

// 8 Vivid Color Themes for PDF Export Bars in Class Mode
const PDF_BAR_THEMES = [
  { border: '#0284c7', bg: '#0284c7', stripe: '#38bdf8', text: '#ffffff', tint: '#f0f9ff' },
  { border: '#047857', bg: '#059669', stripe: '#10b981', text: '#ffffff', tint: '#f0fdf4' },
  { border: '#9333ea', bg: '#9333ea', stripe: '#c084fc', text: '#ffffff', tint: '#faf5ff' },
  { border: '#d97706', bg: '#d97706', stripe: '#fbbf24', text: '#ffffff', tint: '#fffbeb' },
  { border: '#e11d48', bg: '#e11d48', stripe: '#fb7185', text: '#ffffff', tint: '#fff1f2' },
  { border: '#0d9488', bg: '#0d9488', stripe: '#2dd4bf', text: '#ffffff', tint: '#f0fdfa' },
  { border: '#4f46e5', bg: '#4f46e5', stripe: '#818cf8', text: '#ffffff', tint: '#eef2ff' },
  { border: '#0891b2', bg: '#0891b2', stripe: '#22d3ee', text: '#ffffff', tint: '#ecfeff' },
];

const getPdfSubgroupColor = (childClass: string, subgroups: string[]) => {
  const idx = subgroups.indexOf(childClass);
  if (idx === 0) return { bg: '#e0f2fe', color: '#0369a1', border: '#7dd3fc' }; // Sky
  if (idx === 1) return { bg: '#f3e8ff', color: '#7e22ce', border: '#d8b4fe' }; // Purple
  if (idx === 2) return { bg: '#fef3c7', color: '#b45309', border: '#fcd34d' }; // Amber
  if (idx === 3) return { bg: '#d1fae5', color: '#047857', border: '#6ee7b7' }; // Emerald
  if (idx === 4) return { bg: '#e0e7ff', color: '#4338ca', border: '#a5b4fc' }; // Indigo
  if (idx === 5) return { bg: '#ffe4e6', color: '#be123c', border: '#fda4af' }; // Rose
  return { bg: '#ccfbf1', color: '#0f766e', border: '#5eead4' }; // Teal
};

/**
 * Programmatically constructs a standalone DOM element, captures it as a high-DPI image,
 * and downloads a professional PDF file.
 */
export async function exportGanttPdfDirectly({
  semester,
  teachers,
  holidays,
  titleSuffix,
  fileNamePrefix = 'Tien_Do_Tuan',
  weekColWidth = 36, // Default 36px
  groupBy = 'teacher',
  maxWeeks = 20, // Default 20 weeks to avoid excess trailing columns after week 20
}: DirectGanttPdfOptions): Promise<void> {
  const rawWeeks = generateSemesterWeeks(
    semester.startDate,
    semester.endDate,
    semester.startWeekNumber || 1
  );

  // Default to 20 weeks to avoid excess empty weeks after week 20
  const effectiveMaxWeeks = maxWeeks || (rawWeeks.length > 20 ? 20 : rawWeeks.length);
  const semesterWeeks = rawWeeks.slice(0, effectiveMaxWeeks);

  // Group Courses by Parent Class Family (when groupBy === 'class')
  const classFamilyGroups: {
    parentKey: string;
    subgroups: string[];
    items: { teacher: Teacher; course: any; childClass: string }[];
    totalHours: number;
    totalTheoryHours: number;
    totalPracticeHours: number;
  }[] = [];

  if (groupBy === 'class') {
    const parentMap = new Map<
      string,
      {
        parentKey: string;
        subgroups: string[];
        items: { teacher: Teacher; course: any; childClass: string }[];
        totalHours: number;
        totalTheoryHours: number;
        totalPracticeHours: number;
      }
    >();

    teachers.forEach((teacher) => {
      (teacher.courses || []).forEach((course) => {
        const childClass = (course.className || 'Chưa xếp lớp').trim().toUpperCase();
        const parentKey = getCanonicalParentName(childClass);

        let group = parentMap.get(parentKey);
        if (!group) {
          group = {
            parentKey,
            subgroups: [childClass],
            items: [],
            totalHours: 0,
            totalTheoryHours: 0,
            totalPracticeHours: 0,
          };
          parentMap.set(parentKey, group);
        } else {
          if (!group.subgroups.includes(childClass)) {
            group.subgroups.push(childClass);
            group.subgroups.sort((a, b) =>
              a.localeCompare(b, 'vi', { sensitivity: 'base', numeric: true })
            );
          }
        }

        group.items.push({ teacher, course, childClass });
        group.totalTheoryHours += course.theoryHours || 0;
        group.totalPracticeHours += course.practiceHours || 0;
        group.totalHours += (course.theoryHours || 0) + (course.practiceHours || 0);
      });
    });

    const sortedFamilies = Array.from(parentMap.values()).sort((a, b) =>
      a.parentKey.localeCompare(b.parentKey, 'vi', { sensitivity: 'base', numeric: true })
    );

    sortedFamilies.forEach((f) => {
      f.items.sort((a, b) => {
        const cmpClass = a.childClass.localeCompare(b.childClass, 'vi', { numeric: true });
        if (cmpClass !== 0) return cmpClass;
        return a.course.subjectName.localeCompare(b.course.subjectName, 'vi');
      });
      classFamilyGroups.push(f);
    });
  }

  // Static columns width: STT(36) + (Lop(85) + Mon(140) + GV(130) + ChucVu(80)) + LT(34) + TH(34) + Tong(38) + DaDay(65) = ~642px
  const staticColsWidth = 642;
  const totalTableWidth = staticColsWidth + semesterWeeks.length * weekColWidth;
  const totalContainerWidth = Math.max(1200, totalTableWidth + 48);

  // Create an on-screen but hidden behind (negative z-index) container
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '0px';
  container.style.top = '0px';
  container.style.zIndex = '-9999';
  container.style.width = `${totalContainerWidth}px`;
  container.style.minWidth = `${totalContainerWidth}px`;
  container.style.backgroundColor = '#ffffff';
  container.style.padding = '24px';
  container.style.fontFamily = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  container.style.color = '#1e293b';
  container.style.boxSizing = 'border-box';
  container.style.pointerEvents = 'none';

  // Build the Header
  const groupLabel = groupBy === 'class' ? 'THEO LỚP HỌC (ĐA SẮC)' : 'THEO GIẢNG VIÊN';
  const titleText = `BÁO CÁO TIẾN ĐỘ GIẢNG DẠY THEO TUẦN (GANTT CHART) - ${groupLabel}${titleSuffix ? ` - ${titleSuffix.toUpperCase()}` : ''}`;
  const subTitle = `${semester.name.toUpperCase()} · NIÊN KHÓA ${semester.academicYear || '2026-2027'}`;
  const lastWeek = semesterWeeks[semesterWeeks.length - 1];
  const lastDateStr = lastWeek ? lastWeek.sundayFormatted : formatVietnamDate(semester.endDate || '2027-01-24');
  const dateInfo = `Thời gian: ${formatVietnamDate(semester.startDate || '2026-09-07')} → ${lastDateStr} (${semesterWeeks.length} tuần) | Tuần bắt đầu: #${semester.startWeekNumber || 1} | Xuất ngày: ${new Date().toLocaleDateString('vi-VN')}`;

  let tableHtml = `
    <div style="margin-bottom: 16px; padding-bottom: 12px; border-bottom: 2px solid #cbd5e1; display: flex; justify-content: space-between; align-items: flex-start;">
      <div>
        <h1 style="font-size: 16px; font-weight: 900; color: #0f172a; margin: 0; text-transform: uppercase;">${titleText}</h1>
        <div style="font-size: 12px; font-weight: 700; color: #065f46; margin-top: 2px;">${subTitle}</div>
      </div>
      <div style="text-align: right; font-size: 11px; color: #64748b;">
        ${dateInfo}
      </div>
    </div>

    <div style="border: 1px solid #cbd5e1; border-radius: 8px; overflow: hidden; background: #ffffff;">
      <table style="width: 100%; border-collapse: collapse; font-size: 11px; table-layout: fixed; color: #334155;">
        <colgroup>
          <col style="width: 36px;" />
          ${
            groupBy === 'teacher'
              ? `
            <col style="width: 140px;" />
            <col style="width: 80px;" />
            <col style="width: 130px;" />
            <col style="width: 75px;" />
          `
              : `
            <col style="width: 85px;" />
            <col style="width: 145px;" />
            <col style="width: 130px;" />
            <col style="width: 75px;" />
          `
          }
          <col style="width: 34px;" />
          <col style="width: 34px;" />
          <col style="width: 38px;" />
          <col style="width: 65px;" />
          ${semesterWeeks.map(() => `<col style="width: ${weekColWidth}px;" />`).join('')}
        </colgroup>
        <thead>
          <!-- Row 1 -->
          <tr style="background-color: #e2e8f0; color: #0f172a; font-weight: 700; border-bottom: 1px solid #cbd5e1;">
            <th rowspan="3" style="padding: 6px 2px; text-align: center; border-right: 1px solid #cbd5e1;">STT</th>
            ${
              groupBy === 'teacher'
                ? `
              <th rowspan="3" style="padding: 6px 6px; text-align: left; border-right: 1px solid #cbd5e1;">Giảng Viên</th>
              <th rowspan="3" style="padding: 6px 4px; text-align: center; border-right: 1px solid #cbd5e1;">Chức Vụ</th>
              <th rowspan="3" style="padding: 6px 6px; text-align: left; border-right: 1px solid #cbd5e1;">Môn Học</th>
              <th rowspan="3" style="padding: 6px 2px; text-align: center; border-right: 1px solid #cbd5e1;">Lớp</th>
            `
                : `
              <th rowspan="3" style="padding: 6px 4px; text-align: left; border-right: 1px solid #cbd5e1;">Lớp Học</th>
              <th rowspan="3" style="padding: 6px 6px; text-align: left; border-right: 1px solid #cbd5e1;">Môn Học</th>
              <th rowspan="3" style="padding: 6px 6px; text-align: left; border-right: 1px solid #cbd5e1;">Giảng Viên</th>
              <th rowspan="3" style="padding: 6px 4px; text-align: center; border-right: 1px solid #cbd5e1;">Chức Vụ</th>
            `
            }
            <th rowspan="3" style="padding: 6px 2px; text-align: center; border-right: 1px solid #cbd5e1;">LT</th>
            <th rowspan="3" style="padding: 6px 2px; text-align: center; border-right: 1px solid #cbd5e1;">TH</th>
            <th rowspan="3" style="padding: 6px 2px; text-align: center; border-right: 1px solid #cbd5e1;">Tổng</th>
            <th rowspan="3" style="padding: 6px 4px; text-align: center; border-right: 2px solid #94a3b8;">Đã dạy</th>
            ${semesterWeeks
              .map(
                (w) => `
              <th style="padding: 4px 1px; text-align: center; border-right: 1px solid #cbd5e1; font-size: 10px; font-weight: 700; background-color: ${w.isCurrentWeek ? '#fde68a' : '#e2e8f0'}; color: ${w.isCurrentWeek ? '#451a03' : '#1e293b'};">
                ${w.weekLabel}
              </th>
            `
              )
              .join('')}
          </tr>

          <!-- Row 2: Monday -->
          <tr style="border-bottom: 1px solid #cbd5e1;">
            ${semesterWeeks
              .map(
                (w) => `
              <th style="padding: 2px 1px; text-align: center; border-right: 1px solid #cbd5e1; font-family: monospace; font-size: 9px; font-weight: 600; background-color: ${w.isCurrentWeek ? '#fef3c7' : '#f1f5f9'}; color: ${w.isCurrentWeek ? '#78350f' : '#334155'};">
                ${w.mondayFormatted}
              </th>
            `
              )
              .join('')}
          </tr>

          <!-- Row 3: Sunday -->
          <tr style="border-bottom: 2px solid #94a3b8;">
            ${semesterWeeks
              .map(
                (w) => `
              <th style="padding: 2px 1px; text-align: center; border-right: 1px solid #cbd5e1; font-family: monospace; font-size: 9px; font-weight: 500; background-color: ${w.isCurrentWeek ? '#fef3c7' : '#f1f5f9'}; color: ${w.isCurrentWeek ? '#78350f' : '#475569'};">
                ${w.sundayFormatted}
              </th>
            `
              )
              .join('')}
          </tr>
        </thead>
        <tbody>
  `;

  if (groupBy === 'class') {
    // Render by Parent Class Groups with Vivid Multi-Color Styling
    classFamilyGroups.forEach((family) => {
      // Parent Class Header Banner
      tableHtml += `
        <tr style="background: linear-gradient(to right, #f3e8ff, #faf5ff, #ffffff); border-top: 2px solid #d8b4fe; border-bottom: 1px solid #d8b4fe; font-weight: 700; color: #581c87;">
          <td colspan="${8 + semesterWeeks.length}" style="padding: 6px 12px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="font-family: monospace; font-weight: 900; background: #ffffff; padding: 2px 8px; border-radius: 4px; border: 1px solid #d8b4fe; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">🏫 CỤM LỚP CHUNG: ${family.parentKey}</span>
                <span style="font-size: 10px; background: #e9d5ff; color: #581c87; padding: 2px 8px; border-radius: 12px; border: 1px solid #c084fc;">${family.subgroups.length} Lớp con: ${family.subgroups.join(', ')}</span>
              </div>
              <span style="font-size: 10px; font-weight: 700; color: #065f46; background: #ecfdf5; padding: 2px 8px; border-radius: 4px; border: 1px solid #a7f3d0;">
                ${family.items.length} môn · ${family.totalHours} tiết (${family.totalTheoryHours} LT + ${family.totalPracticeHours} TH)
              </span>
            </div>
          </td>
        </tr>
      `;

      family.items.forEach((item, itemIdx) => {
        const { teacher, course, childClass } = item;
        const totalHours = Math.round(((course.theoryHours || 0) + (course.practiceHours || 0)) * 100) / 100;
        const completed = course.completedHours || 0;
        const isDone = completed >= totalHours && totalHours > 0;
        const schedule = computeCourseGanttSchedule(course, semesterWeeks, holidays);

        // Course theme for multi-color bars
        const theme = PDF_BAR_THEMES[itemIdx % PDF_BAR_THEMES.length];
        const subColor = getPdfSubgroupColor(childClass, family.subgroups);
        const isCoHuu = (teacher.position || '').includes('Cơ hữu');

        const validPhases = (course.schedulePhases || []).filter(
          (p: any) => p.fromDate && p.scheduleSlots && p.scheduleSlots.length > 0
        );

        tableHtml += `<tr style="border-bottom: 1px solid #cbd5e1; background-color: ${itemIdx % 2 === 0 ? '#ffffff' : '#f8fafc'};">`;

        // STT
        tableHtml += `<td style="padding: 4px 2px; text-align: center; font-weight: 700; border-right: 1px solid #cbd5e1; color: #64748b;">${itemIdx + 1}</td>`;

        // Child Class Badge
        tableHtml += `
          <td style="padding: 4px 6px; border-right: 1px solid #cbd5e1;">
            <span style="font-family: monospace; font-weight: 800; font-size: 10px; padding: 2px 6px; background-color: ${subColor.bg}; color: ${subColor.color}; border: 1px solid ${subColor.border}; border-radius: 4px; display: inline-block;">
              ${childClass}
            </span>
          </td>
        `;

        // Subject with Star & Phase Badges
        const starHtml = course.mergeRemainderHours
          ? `<span style="color: #f59e0b; font-weight: 900; margin-left: 4px;" title="⭐ Đã cộng dồn tiết lẻ buổi cuối">⭐</span>`
          : '';
        const phaseHtml = validPhases.length > 0
          ? `<div style="margin-top: 2px;"><span style="font-size: 8px; font-weight: 700; background-color: #f3e8ff; color: #6b21a8; border: 1px solid #d8b4fe; padding: 1px 4px; border-radius: 3px;">${formatSlotSummary(course.scheduleSlots)} ➔ ${validPhases.map((p: any) => formatSlotSummary(p.scheduleSlots)).join(' ➔ ')}</span></div>`
          : course.scheduleSlots && course.scheduleSlots.length > 0
          ? `<div style="margin-top: 2px;"><span style="font-size: 8px; font-weight: 700; background-color: #fef3c7; color: #92400e; border: 1px solid #fde68a; padding: 1px 4px; border-radius: 3px;">${formatSlotSummary(course.scheduleSlots)}</span></div>`
          : '';

        tableHtml += `
          <td style="padding: 4px 6px; border-right: 1px solid #cbd5e1; overflow: hidden; text-overflow: ellipsis;">
            <div style="font-weight: 700; color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
              ${course.subjectName}${starHtml}
            </div>
            ${phaseHtml}
          </td>
          <td style="padding: 4px 6px; font-weight: 600; color: #1e293b; border-right: 1px solid #cbd5e1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${teacher.name}</td>
          <td style="padding: 4px 2px; text-align: center; font-size: 9px; border-right: 1px solid #cbd5e1;">
            <span style="padding: 2px 4px; background-color: ${isCoHuu ? '#dbeafe' : '#fef3c7'}; color: ${isCoHuu ? '#1e40af' : '#92400e'}; border-radius: 4px; border: 1px solid ${isCoHuu ? '#bfdbfe' : '#fde68a'}; font-weight: 700;">${teacher.position || ''}</span>
          </td>
          <td style="padding: 4px 2px; text-align: center; border-right: 1px solid #cbd5e1;">${course.theoryHours || 0}</td>
          <td style="padding: 4px 2px; text-align: center; border-right: 1px solid #cbd5e1;">${course.practiceHours || 0}</td>
          <td style="padding: 4px 2px; text-align: center; font-weight: 700; border-right: 1px solid #cbd5e1;">${totalHours}</td>
          <td style="padding: 4px 4px; text-align: center; font-weight: 700; font-size: 10px; border-right: 2px solid #94a3b8; color: ${isDone ? '#047857' : '#1d4ed8'};">
            ${completed}/${totalHours}h
          </td>
        `;

        // Timeline cells with Vibrant Colors
        semesterWeeks.forEach((week) => {
          const cell = schedule.cells.find((c) => c.weekIndex === week.weekIndex);

          if (!cell || !cell.isInSpan) {
            tableHtml += `<td style="border-right: 1px solid #cbd5e1; padding: 0; text-align: center;"></td>`;
            return;
          }

          const isCompletedWeek = cell.status === 'completed';
          const isPartial = cell.status === 'partially_completed';
          const isPauseWeek = !cell.hasSessions || cell.totalHoursInWeek === 0;

          let cellStyle = `background-color: ${theme.tint}; border-color: ${theme.border};`;
          let textColor = theme.border;

          if (isPauseWeek) {
            cellStyle = 'background-color: #f1f5f9; background-image: radial-gradient(#94a3b8 1.2px, transparent 1.2px); background-size: 5px 5px; border-color: #94a3b8;';
            textColor = '#64748b';
          } else if (isCompletedWeek) {
            cellStyle = `background-image: repeating-linear-gradient(45deg, ${theme.bg} 0, ${theme.bg} 2px, ${theme.stripe} 2px, ${theme.stripe} 4px); border-color: ${theme.border};`;
            textColor = '#ffffff';
          } else if (isPartial) {
            cellStyle = `background-image: linear-gradient(to right, ${theme.bg}, #ffffff); border-color: ${theme.border};`;
            textColor = theme.border;
          }

          const borderLeftStyle = cell.isStartWeek ? `2px solid ${theme.border}; border-top-left-radius: 3px; border-bottom-left-radius: 3px;` : 'none';
          const borderRightStyle = cell.isEndWeek ? `2px solid ${theme.border}; border-top-right-radius: 3px; border-bottom-right-radius: 3px;` : 'none';

          tableHtml += `
            <td style="border-right: 1px solid #cbd5e1; padding: 0; text-align: center; vertical-align: middle;">
              <div style="height: 18px; width: 100%; border-top: 2px solid ${theme.border}; border-bottom: 2px solid ${theme.border}; border-left: ${borderLeftStyle}; border-right: ${borderRightStyle}; ${cellStyle} display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 8px; font-weight: 700; color: ${textColor};">${isPauseWeek ? '0' : cell.totalHoursInWeek}</span>
              </div>
            </td>
          `;
        });

        tableHtml += `</tr>`;
      });
    });
  } else {
    // Render by Teacher
    teachers.forEach((teacher, tIdx) => {
      const courses = teacher.courses && teacher.courses.length > 0 ? teacher.courses : [];
      const courseSpan = courses.length || 1;

      if (courses.length === 0) {
        tableHtml += `
          <tr style="border-bottom: 1px solid #cbd5e1;">
            <td style="padding: 6px 2px; text-align: center; font-weight: 700; border-right: 1px solid #cbd5e1;">${tIdx + 1}</td>
            <td style="padding: 6px 6px; font-weight: 700; color: #0f172a; border-right: 1px solid #cbd5e1;">${teacher.name}</td>
            <td style="padding: 6px 2px; text-align: center; font-size: 10px; border-right: 1px solid #cbd5e1;">${teacher.position || ''}</td>
            <td colspan="6" style="padding: 6px 6px; color: #94a3b8; font-style: italic; border-right: 2px solid #94a3b8;">(Chưa phân công môn)</td>
            ${semesterWeeks.map(() => `<td style="border-right: 1px solid #cbd5e1;"></td>`).join('')}
          </tr>
        `;
        return;
      }

      courses.forEach((course, cIdx) => {
        const isFirst = cIdx === 0;
        const totalHours = Math.round(((course.theoryHours || 0) + (course.practiceHours || 0)) * 100) / 100;
        const completed = course.completedHours || 0;
        const isDone = completed >= totalHours && totalHours > 0;
        const schedule = computeCourseGanttSchedule(course, semesterWeeks, holidays);

        tableHtml += `<tr style="border-bottom: 1px solid #cbd5e1;">`;

        if (isFirst) {
          const isCoHuu = (teacher.position || '').includes('Cơ hữu');
          tableHtml += `
            <td rowspan="${courseSpan}" style="padding: 6px 2px; text-align: center; font-weight: 700; vertical-align: middle; border-right: 1px solid #cbd5e1;">${tIdx + 1}</td>
            <td rowspan="${courseSpan}" style="padding: 6px 6px; font-weight: 700; color: #0f172a; vertical-align: middle; border-right: 1px solid #cbd5e1;">${teacher.name}</td>
            <td rowspan="${courseSpan}" style="padding: 6px 2px; text-align: center; font-size: 9px; vertical-align: middle; border-right: 1px solid #cbd5e1;">
              <span style="padding: 2px 4px; background-color: ${isCoHuu ? '#dbeafe' : '#fef3c7'}; color: ${isCoHuu ? '#1e40af' : '#92400e'}; border-radius: 4px; border: 1px solid ${isCoHuu ? '#bfdbfe' : '#fde68a'}; font-weight: 700;">${teacher.position || ''}</span>
            </td>
          `;
        }

        const starHtml = course.mergeRemainderHours
          ? `<span style="color: #f59e0b; font-weight: 900; margin-left: 4px;" title="⭐ Đã cộng dồn tiết lẻ buổi cuối">⭐</span>`
          : '';

        tableHtml += `
          <td style="padding: 4px 6px; font-weight: 700; color: #0f172a; border-right: 1px solid #cbd5e1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${course.subjectName}${starHtml}</td>
          <td style="padding: 4px 2px; text-align: center; font-family: monospace; font-weight: 700; font-size: 10px; border-right: 1px solid #cbd5e1;">${course.className}</td>
          <td style="padding: 4px 2px; text-align: center; border-right: 1px solid #cbd5e1;">${course.theoryHours || 0}</td>
          <td style="padding: 4px 2px; text-align: center; border-right: 1px solid #cbd5e1;">${course.practiceHours || 0}</td>
          <td style="padding: 4px 2px; text-align: center; font-weight: 700; border-right: 1px solid #cbd5e1;">${totalHours}</td>
          <td style="padding: 4px 4px; text-align: center; font-weight: 700; font-size: 10px; border-right: 2px solid #94a3b8; color: ${isDone ? '#047857' : '#1d4ed8'};">
            ${completed}/${totalHours}h
          </td>
        `;

        // Timeline cells
        semesterWeeks.forEach((week) => {
          const cell = schedule.cells.find((c) => c.weekIndex === week.weekIndex);

          if (!cell || !cell.isInSpan) {
            tableHtml += `<td style="border-right: 1px solid #cbd5e1; padding: 0; text-align: center;"></td>`;
            return;
          }

          const isCompletedWeek = cell.status === 'completed';
          const isPartial = cell.status === 'partially_completed';
          const isPauseWeek = !cell.hasSessions || cell.totalHoursInWeek === 0;

          let cellStyle = 'background-color: #ffffff;';
          if (isPauseWeek) {
            cellStyle = 'background-color: #f1f5f9; background-image: radial-gradient(#94a3b8 1.2px, transparent 1.2px); background-size: 5px 5px;';
          } else if (isCompletedWeek) {
            cellStyle = 'background-image: repeating-linear-gradient(45deg, #059669 0, #059669 2px, #10b981 2px, #10b981 4px);';
          } else if (isPartial) {
            cellStyle = 'background-image: linear-gradient(to right, #059669, #ffffff);';
          }

          const borderLeftStyle = cell.isStartWeek ? '2px solid #047857; border-top-left-radius: 3px; border-bottom-left-radius: 3px;' : 'none';
          const borderRightStyle = cell.isEndWeek ? '2px solid #047857; border-top-right-radius: 3px; border-bottom-right-radius: 3px;' : 'none';

          tableHtml += `
            <td style="border-right: 1px solid #cbd5e1; padding: 0; text-align: center; vertical-align: middle;">
              <div style="height: 18px; width: 100%; border-top: 2px solid #047857; border-bottom: 2px solid #047857; border-left: ${borderLeftStyle}; border-right: ${borderRightStyle}; ${cellStyle} display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 8px; font-weight: 700; color: ${isCompletedWeek ? '#ffffff' : isPauseWeek ? '#64748b' : '#065f46'};">${isPauseWeek ? '0' : cell.totalHoursInWeek}</span>
              </div>
            </td>
          `;
        });

        tableHtml += `</tr>`;
      });
    });
  }

  tableHtml += `
        </tbody>
      </table>
    </div>
  `;

  container.innerHTML = tableHtml;
  document.body.appendChild(container);

  try {
    // Wait for DOM layout engine to settle
    await new Promise((resolve) => setTimeout(resolve, 150));

    const dataUrl = await toPng(container, {
      quality: 0.98,
      pixelRatio: 2,
      backgroundColor: '#ffffff',
      cacheBust: true,
      width: totalContainerWidth,
      height: container.offsetHeight || container.scrollHeight,
    });

    const img = new Image();
    img.src = dataUrl;
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
    });

    const imgWidth = img.naturalWidth || img.width;
    const imgHeight = img.naturalHeight || img.height;

    const pdfWidth = 297; // Landscape A4
    const pdfHeight = (imgHeight * pdfWidth) / imgWidth;

    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: pdfHeight > 210 ? [pdfWidth, pdfHeight + 10] : 'a4',
    });

    pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);

    const cleanSemesterName = semester.name
      .replace(/\s+/g, '_')
      .replace(/[^a-zA-Z0-9_\u00C0-\u1EF9]/g, '');

    const fileName = `${fileNamePrefix}_${cleanSemesterName}_${new Date()
      .toISOString()
      .slice(0, 10)}.pdf`;

    pdf.save(fileName);
  } finally {
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
  }
}
