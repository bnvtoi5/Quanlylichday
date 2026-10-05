import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  CalendarRange,
  Download,
  GraduationCap,
  Loader2,
  Palette,
  Sliders,
  Star,
  Users,
  X,
} from 'lucide-react';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';
import {
  GanttColumnVisibility,
  GanttColumnWidths,
} from './GanttChart';
import { CourseAssignment, Holiday, MasterClass, Semester, Teacher } from '../types';
import {
  computeCourseGanttSchedule,
  generateSemesterWeeks,
} from '../utils/ganttCalculator';
import { getCanonicalParentName } from '../utils/classGrouping';
import { CoTeachingGroupInfo } from '../utils/coTeachingHelper';
import { formatCourseScheduleSummary, formatSlotSummary, formatVietnamDate } from '../utils/vietnamTime';

// Standard Clean Emerald Green Theme for Course Gantt Bars (100% High-Contrast & Legible)
const STANDARD_EMERALD_THEME = {
  border: 'border-emerald-700',
  borderHex: '#047857',
  bgCompleted: 'bg-[repeating-linear-gradient(45deg,#059669_0,#059669_2px,#10b981_2px,#10b981_4px)]',
  bgCompletedHex: '#059669',
  bgPending: 'bg-emerald-50/70',
  textCompleted: 'text-white',
  textPending: 'text-emerald-950',
};

interface GanttPrintViewProps {
  isOpen: boolean;
  onClose: () => void;
  semester: Semester;
  filteredTeachers: Teacher[];
  holidays: Holiday[];
  masterClasses?: MasterClass[];
  coTeachingGroups?: CoTeachingGroupInfo[];
  colVisibility: GanttColumnVisibility;
  colWidths: GanttColumnWidths;
  onEditCourse?: (teacher: Teacher, course: CourseAssignment) => void;
  initialGroupBy?: 'teacher' | 'class';
  initialWeekRange?: 'WEEK_20' | 'ALL' | 'FIRST_HALF' | 'SECOND_HALF';
}

export const GanttPrintView: React.FC<GanttPrintViewProps> = ({
  isOpen,
  onClose,
  semester,
  filteredTeachers,
  holidays,
  masterClasses = [],
  coTeachingGroups,
  colVisibility,
  colWidths: initialColWidths,
  initialGroupBy = 'class',
  initialWeekRange = 'WEEK_20',
}) => {
  const printableRef = useRef<HTMLDivElement>(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  // Group By State: 'teacher' | 'class'
  const [groupBy, setGroupBy] = useState<'teacher' | 'class'>(initialGroupBy);

  // Week Range Mode: 'WEEK_20' (default 20 weeks, prevents excess trailing columns) | 'ALL' | 'FIRST_HALF' | 'SECOND_HALF'
  const [weekRangeMode, setWeekRangeMode] = useState<
    'WEEK_20' | 'ALL' | 'FIRST_HALF' | 'SECOND_HALF'
  >(initialWeekRange || 'WEEK_20');

  // Selected Parent Class Filter in Print Preview (Optional, 'ALL' by default)
  const [selectedParentClass, setSelectedParentClass] = useState<string>('ALL');

  // Sync initialGroupBy & initialWeekRange when modal opens
  useEffect(() => {
    if (initialGroupBy) {
      setGroupBy(initialGroupBy);
    }
  }, [initialGroupBy, isOpen]);

  // Live adjustable column widths inside preview (Default to clean legible width)
  const [previewWidths, setPreviewWidths] = useState<GanttColumnWidths>(() => ({
    ...initialColWidths,
    weekCol: Math.max(initialColWidths.weekCol || 36, 36),
  }));

  useEffect(() => {
    setPreviewWidths({
      ...initialColWidths,
      weekCol: Math.max(initialColWidths.weekCol || 36, 36),
    });
  }, [initialColWidths, isOpen]);

  // All weeks generated from semester dates
  const allSemesterWeeks = useMemo(() => {
    return generateSemesterWeeks(
      semester.startDate,
      semester.endDate,
      semester.startWeekNumber || 1
    );
  }, [semester.startDate, semester.endDate, semester.startWeekNumber]);

  // Filtered displayed/printed weeks according to weekRangeMode (Defaults to 20 weeks)
  const semesterWeeks = useMemo(() => {
    if (weekRangeMode === 'WEEK_20') {
      return allSemesterWeeks.slice(0, 20);
    }
    if (weekRangeMode === 'FIRST_HALF') {
      const half = Math.ceil(Math.min(20, allSemesterWeeks.length) / 2);
      return allSemesterWeeks.slice(0, half);
    }
    if (weekRangeMode === 'SECOND_HALF') {
      const half = Math.ceil(Math.min(20, allSemesterWeeks.length) / 2);
      return allSemesterWeeks.slice(half, Math.min(20, allSemesterWeeks.length));
    }
    return allSemesterWeeks;
  }, [allSemesterWeeks, weekRangeMode]);

  // Calculate EXACT visible column count to guarantee 100% perfect colSpan without phantom columns
  const visibleStaticColCount = useMemo(() => {
    let count = 0;
    if (colVisibility.stt) count++;
    if (groupBy === 'teacher') {
      if (colVisibility.teacher) count++;
      if (colVisibility.position) count++;
      if (colVisibility.subject) count++;
      if (colVisibility.class) count++;
    } else {
      if (colVisibility.class) count++;
      if (colVisibility.subject) count++;
      if (colVisibility.teacher) count++;
      if (colVisibility.position) count++;
    }
    if (colVisibility.lt) count++;
    if (colVisibility.th) count++;
    if (colVisibility.total) count++;
    if (colVisibility.progress) count++;
    return count;
  }, [colVisibility, groupBy]);

  const totalTableColCount = visibleStaticColCount + semesterWeeks.length;

  // Helper to give distinct colorful badges for subgroups like in the main software UI
  const getSubgroupBadgeStyle = (childClass: string, subgroups: string[]) => {
    const idx = subgroups.indexOf(childClass);
    if (idx === 0) return 'bg-sky-100 text-sky-900 border-sky-300';
    if (idx === 1) return 'bg-purple-100 text-purple-900 border-purple-300';
    if (idx === 2) return 'bg-amber-100 text-amber-900 border-amber-300';
    if (idx === 3) return 'bg-emerald-100 text-emerald-900 border-emerald-300';
    if (idx === 4) return 'bg-indigo-100 text-indigo-900 border-indigo-300';
    if (idx === 5) return 'bg-rose-100 text-rose-900 border-rose-300';
    return 'bg-teal-100 text-teal-900 border-teal-300';
  };

  // Group Courses by Parent Class Family (when groupBy === 'class') with metadata
  const classFamilyGroups = useMemo(() => {
    const masterMap = new Map<string, MasterClass>();
    (masterClasses || []).forEach((mc) => {
      masterMap.set(mc.name.trim().toUpperCase(), mc);
    });

    const parentToChildren = new Map<string, Set<string>>();
    const childToParent = new Map<string, string>();

    (masterClasses || []).forEach((mc) => {
      const uName = mc.name.trim().toUpperCase();
      if (mc.isParent && mc.subgroups && mc.subgroups.length > 0) {
        const s = parentToChildren.get(uName) || new Set<string>();
        mc.subgroups.forEach((child) => {
          const cU = child.trim().toUpperCase();
          s.add(cU);
          childToParent.set(cU, uName);
        });
        parentToChildren.set(uName, s);
      } else if (mc.parentClassName) {
        const pU = mc.parentClassName.trim().toUpperCase();
        childToParent.set(uName, pU);
        const s = parentToChildren.get(pU) || new Set<string>();
        s.add(uName);
        parentToChildren.set(pU, s);
      }
    });

    const parentMap = new Map<
      string,
      {
        parentKey: string;
        major?: string;
        studentCount?: number;
        subgroups: string[];
        items: { teacher: Teacher; course: CourseAssignment; childClass: string }[];
        totalHours: number;
        totalTheoryHours: number;
        totalPracticeHours: number;
      }
    >();

    filteredTeachers.forEach((teacher) => {
      (teacher.courses || []).forEach((course) => {
        const childClass = (course.className || 'Chưa xếp lớp').trim().toUpperCase();
        let parentKey = childToParent.get(childClass);
        if (!parentKey) {
          parentKey = getCanonicalParentName(childClass);
        }

        const masterParent = masterMap.get(parentKey);
        let group = parentMap.get(parentKey);
        if (!group) {
          const s = parentToChildren.get(parentKey) || new Set<string>();
          s.add(childClass);
          parentToChildren.set(parentKey, s);

          const subgroups = Array.from(s).sort((a, b) =>
            a.localeCompare(b, 'vi', { sensitivity: 'base', numeric: true })
          );

          group = {
            parentKey,
            major: masterParent?.major,
            studentCount: masterParent?.studentCount,
            subgroups,
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

    let customClassOrder: string[] = [];
    try {
      const saved = localStorage.getItem('edutrack_parent_class_order_v1');
      if (saved) customClassOrder = JSON.parse(saved);
    } catch {}

    const sortedFamilies = Array.from(parentMap.values()).sort((a, b) => {
      if (customClassOrder && customClassOrder.length > 0) {
        const idxA = customClassOrder.indexOf(a.parentKey);
        const idxB = customClassOrder.indexOf(b.parentKey);
        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
        if (idxA !== -1) return -1;
        if (idxB !== -1) return 1;
      }
      return a.parentKey.localeCompare(b.parentKey, 'vi', { sensitivity: 'base', numeric: true });
    });

    sortedFamilies.forEach((f) => {
      f.items.sort((a, b) => {
        const cmpClass = a.childClass.localeCompare(b.childClass, 'vi', { numeric: true });
        if (cmpClass !== 0) return cmpClass;
        return a.course.subjectName.localeCompare(b.course.subjectName, 'vi');
      });
    });

    return sortedFamilies;
  }, [filteredTeachers, masterClasses]);

  if (!isOpen) return null;

  // Direct High-Resolution PDF File Generation using html-to-image (100% OKLCH & UTF-8 proof)
  const handleDownloadPdfFile = async () => {
    if (!printableRef.current) return;
    setIsExportingPdf(true);
    setExportError(null);

    try {
      const element = printableRef.current;

      const dataUrl = await toPng(element, {
        quality: 0.98,
        pixelRatio: 2, // 2x high-resolution retina quality
        backgroundColor: '#ffffff',
        cacheBust: true,
      });

      const img = new Image();
      img.src = dataUrl;
      await new Promise((resolve) => {
        img.onload = resolve;
      });

      const imgWidth = img.naturalWidth || img.width;
      const imgHeight = img.naturalHeight || img.height;

      // Calculate PDF dimensions in mm (Landscape)
      const pdfWidth = 297; // A4 landscape width (297mm)
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
      const groupSuffix = groupBy === 'class' ? 'Theo_Lop' : 'Theo_GV';
      const fileName = `Tien_Do_Tuan_${groupSuffix}_${cleanSemesterName}_${new Date()
        .toISOString()
        .slice(0, 10)}.pdf`;

      pdf.save(fileName);
    } catch (err: any) {
      console.error('Error generating PDF:', err);
      setExportError(err?.message || 'Có lỗi khi xuất PDF.');
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 print:p-0 print:bg-white print:static print:inset-auto">
      {/* Container */}
      <div className="bg-white rounded-2xl max-w-[98vw] w-full max-h-[96vh] flex flex-col shadow-2xl border border-slate-200 print:border-none print:shadow-none print:max-h-none print:max-w-none print:w-full print:rounded-none">
        {/* Top Control Bar */}
        <div className="p-3.5 sm:p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-900 text-white rounded-t-2xl shrink-0">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Xem Trước & Tải Bản PDF Tiến Độ Tuần</span>
              <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full font-bold">
                {weekRangeMode === 'WEEK_20' ? 'Chuẩn 20 Tuần' : `${semesterWeeks.length} Tuần`}
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Chọn gom nhóm, phạm vi tuần học kỳ, bảng màu đa sắc và tải file PDF chất lượng cao
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Group By Mode Toggle in Print Preview */}
            <div className="flex items-center bg-slate-800 p-0.5 rounded-lg border border-slate-700 text-xs">
              <button
                type="button"
                onClick={() => setGroupBy('teacher')}
                className={`px-2.5 py-1 rounded-md font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  groupBy === 'teacher'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'text-slate-300 hover:text-white'
                }`}
                title="Gom nhóm bảng theo từng Giảng Viên"
              >
                <Users className="w-3.5 h-3.5" />
                <span>Theo GV</span>
              </button>
              <button
                type="button"
                onClick={() => setGroupBy('class')}
                className={`px-2.5 py-1 rounded-md font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  groupBy === 'class'
                    ? 'bg-purple-600 text-white shadow-2xs'
                    : 'text-slate-300 hover:text-white'
                }`}
                title="Gom nhóm bảng theo từng Lớp Học"
              >
                <GraduationCap className="w-3.5 h-3.5" />
                <span>Theo Lớp</span>
              </button>
            </div>

            {/* Week Range Filter Switcher (Eliminates excess weeks after week 20) */}
            <div className="flex items-center bg-slate-800 p-0.5 rounded-lg border border-slate-700 text-xs">
              <button
                type="button"
                onClick={() => setWeekRangeMode('WEEK_20')}
                className={`px-2.5 py-1 rounded-md font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  weekRangeMode === 'WEEK_20'
                    ? 'bg-amber-600 text-white shadow-2xs ring-1 ring-amber-400/50'
                    : 'text-slate-300 hover:text-white'
                }`}
                title="Giới hạn đúng 20 tuần chuẩn học kỳ (07/09 - 24/01, không bị dư cột trống sau tuần 20)"
              >
                <CalendarRange className="w-3.5 h-3.5 text-amber-200" />
                <span>20 Tuần Chuẩn</span>
                <span className="hidden sm:inline text-[9px] bg-amber-900/90 text-amber-200 px-1 py-0.2 rounded font-extrabold">
                  Gọn đẹp
                </span>
              </button>
              <button
                type="button"
                onClick={() => setWeekRangeMode('ALL')}
                className={`px-2.5 py-1 rounded-md font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  weekRangeMode === 'ALL'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'text-slate-300 hover:text-white'
                }`}
                title="Hiển thị tất cả tuần của học kỳ"
              >
                <span>Tất cả ({allSemesterWeeks.length}T)</span>
              </button>
            </div>

            {/* Parent Class Filter in Print Preview when groupBy === 'class' */}
            {groupBy === 'class' && classFamilyGroups.length > 1 && (
              <div className="flex items-center gap-1 bg-slate-800 px-2 py-1 rounded-lg border border-slate-700 text-xs">
                <span className="text-slate-400 font-semibold text-[11px]">Lớp:</span>
                <select
                  value={selectedParentClass}
                  onChange={(e) => setSelectedParentClass(e.target.value)}
                  className="bg-transparent text-xs font-bold text-purple-300 focus:outline-none cursor-pointer max-w-[150px] truncate"
                >
                  <option value="ALL" className="bg-slate-900 text-white">Tất cả {classFamilyGroups.length} Cụm</option>
                  {classFamilyGroups.map((f) => (
                    <option key={f.parentKey} value={f.parentKey} className="bg-slate-900 text-white">
                      {f.parentKey} ({f.items.length} môn)
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Live Column Width Control in Preview */}
            <div className="flex items-center gap-2 bg-slate-800 px-2.5 py-1 rounded-xl border border-slate-700 text-xs">
              <Sliders className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="text-slate-300 font-medium text-[11px]">Cột tuần:</span>
              <input
                type="range"
                min={32}
                max={100}
                step={2}
                value={previewWidths.weekCol}
                onChange={(e) =>
                  setPreviewWidths((prev) => ({
                    ...prev,
                    weekCol: Number(e.target.value),
                  }))
                }
                className="w-16 sm:w-24 accent-emerald-500 cursor-pointer h-1.5 bg-slate-700 rounded-lg"
              />
              <span className="font-mono font-bold text-emerald-400 bg-slate-900 px-1 py-0.5 rounded text-[10px]">
                {previewWidths.weekCol}px
              </span>
            </div>
          </div>

          {/* Action: Download PDF File */}
          <div className="flex items-center gap-2">
            {exportError && (
              <span className="text-xs text-rose-400 font-medium mr-2">
                {exportError}
              </span>
            )}

            <button
              type="button"
              disabled={isExportingPdf}
              onClick={handleDownloadPdfFile}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-lg text-xs flex items-center gap-2 shadow-md cursor-pointer transition-all border border-emerald-400/30"
              title="Tải trực tiếp file PDF (.pdf) chất lượng cao về máy"
            >
              {isExportingPdf ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang Tạo File PDF...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Tải File PDF (.pdf)</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg cursor-pointer transition-colors ml-1"
              title="Đóng cửa sổ xem trước"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Document Body (Printable Area) */}
        <div className="flex-1 overflow-auto p-4 sm:p-6 text-slate-800 bg-slate-50/40">
          {/* Printable Container Target */}
          <div
            ref={printableRef}
            className="p-4 sm:p-6 bg-white border border-slate-200 rounded-xl shadow-xs min-w-[950px]"
          >
            {/* Header Info Banner */}
            <div className="mb-4 pb-3 border-b-2 border-slate-300">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight uppercase">
                      BÁO CÁO TIẾN ĐỘ GIẢNG DẠY THEO TUẦN (GANTT CHART)
                    </h1>
                    <span className="text-[11px] font-extrabold px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 border border-emerald-300">
                      {groupBy === 'class' ? 'GOM THEO LỚP HỌC' : 'GOM THEO GIẢNG VIÊN'}
                    </span>
                  </div>
                  <div className="text-xs font-bold text-emerald-800 mt-0.5">
                    {semester.name.toUpperCase()} · NIÊN KHÓA {semester.academicYear || '2026-2027'}
                  </div>
                </div>

                <div className="text-right text-[11px] text-slate-500 space-y-0.5">
                  <div>
                    Thời gian: <strong className="text-slate-800">{formatVietnamDate(semester.startDate || '2026-09-07')}</strong> → <strong className="text-slate-800">{semesterWeeks[semesterWeeks.length - 1]?.sundayFormatted ? `${semesterWeeks[semesterWeeks.length - 1].sundayFormatted}` : formatVietnamDate(semester.endDate || '2027-01-24')}</strong>
                  </div>
                  <div>
                    Phạm vi: <strong className="text-emerald-800">{semesterWeeks.length} tuần ({semesterWeeks[0]?.weekLabel} → {semesterWeeks[semesterWeeks.length - 1]?.weekLabel})</strong> · Ngày xuất: <strong className="text-slate-800">{new Date().toLocaleDateString('vi-VN')}</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Table Container */}
            <div className="border border-slate-300 rounded-lg overflow-hidden bg-white">
              <table className="w-full border-collapse text-[11px] text-slate-700 table-fixed">
                <colgroup>
                  {colVisibility.stt && <col style={{ width: `${previewWidths.stt}px` }} />}

                  {groupBy === 'teacher' ? (
                    <>
                      {colVisibility.teacher && <col style={{ width: `${previewWidths.teacher}px` }} />}
                      {colVisibility.position && <col style={{ width: `${previewWidths.position}px` }} />}
                      {colVisibility.subject && <col style={{ width: `${previewWidths.subject}px` }} />}
                      {colVisibility.class && <col style={{ width: `${previewWidths.class}px` }} />}
                    </>
                  ) : (
                    <>
                      {colVisibility.class && <col style={{ width: `${Math.max(previewWidths.class, 85)}px` }} />}
                      {colVisibility.subject && <col style={{ width: `${Math.max(previewWidths.subject, 140)}px` }} />}
                      {colVisibility.teacher && <col style={{ width: `${previewWidths.teacher}px` }} />}
                      {colVisibility.position && <col style={{ width: `${previewWidths.position}px` }} />}
                    </>
                  )}

                  {colVisibility.lt && <col style={{ width: `${previewWidths.lt}px` }} />}
                  {colVisibility.th && <col style={{ width: `${previewWidths.th}px` }} />}
                  {colVisibility.total && <col style={{ width: `${previewWidths.total}px` }} />}
                  {colVisibility.progress && <col style={{ width: `${previewWidths.progress}px` }} />}

                  {semesterWeeks.map((week) => (
                    <col key={week.weekIndex} style={{ width: `${previewWidths.weekCol}px` }} />
                  ))}
                </colgroup>

                <thead className="bg-slate-200 text-slate-900 font-bold border-b border-slate-300">
                  {/* Header Row 1 */}
                  <tr className="border-b border-slate-300">
                    {colVisibility.stt && (
                      <th rowSpan={3} className="py-2 px-1 text-center border-r border-slate-300">
                        STT
                      </th>
                    )}

                    {groupBy === 'teacher' ? (
                      <>
                        {colVisibility.teacher && (
                          <th rowSpan={3} className="py-2 px-2 text-left border-r border-slate-300">
                            Giảng Viên
                          </th>
                        )}
                        {colVisibility.position && (
                          <th rowSpan={3} className="py-2 px-1 text-center border-r border-slate-300">
                            Chức Vụ
                          </th>
                        )}
                        {colVisibility.subject && (
                          <th rowSpan={3} className="py-2 px-2 text-left border-r border-slate-300">
                            Môn Học
                          </th>
                        )}
                        {colVisibility.class && (
                          <th rowSpan={3} className="py-2 px-1 text-center border-r border-slate-300">
                            Lớp
                          </th>
                        )}
                      </>
                    ) : (
                      <>
                        {colVisibility.class && (
                          <th rowSpan={3} className="py-2 px-2 text-left border-r border-slate-300">
                            Lớp Học
                          </th>
                        )}
                        {colVisibility.subject && (
                          <th rowSpan={3} className="py-2 px-2 text-left border-r border-slate-300">
                            Môn Học
                          </th>
                        )}
                        {colVisibility.teacher && (
                          <th rowSpan={3} className="py-2 px-2 text-left border-r border-slate-300">
                            Giảng Viên
                          </th>
                        )}
                        {colVisibility.position && (
                          <th rowSpan={3} className="py-2 px-1 text-center border-r border-slate-300">
                            Chức Vụ
                          </th>
                        )}
                      </>
                    )}

                    {colVisibility.lt && (
                      <th rowSpan={3} className="py-2 px-1 text-center border-r border-slate-300">
                        LT
                      </th>
                    )}
                    {colVisibility.th && (
                      <th rowSpan={3} className="py-2 px-1 text-center border-r border-slate-300">
                        TH
                      </th>
                    )}
                    {colVisibility.total && (
                      <th rowSpan={3} className="py-2 px-1 text-center border-r border-slate-300">
                        Tổng
                      </th>
                    )}
                    {colVisibility.progress && (
                      <th rowSpan={3} className="py-2 px-1 text-center border-r-2 border-slate-400">
                        Đã dạy
                      </th>
                    )}

                    {/* Week Names */}
                    {semesterWeeks.map((week) => (
                      <th
                        key={week.weekIndex}
                        className={`py-1 px-1 text-center border-r border-slate-300 text-[10px] font-bold ${
                          week.isCurrentWeek ? 'bg-amber-200 text-amber-950 font-extrabold' : 'bg-slate-200 text-slate-800'
                        }`}
                      >
                        {week.weekLabel}
                      </th>
                    ))}
                  </tr>

                  {/* Header Row 2: Monday */}
                  <tr className="border-b border-slate-300">
                    {semesterWeeks.map((week) => (
                      <th
                        key={`mon-${week.weekIndex}`}
                        className={`py-0.5 px-0.5 text-center border-r border-slate-300 font-mono text-[9px] font-semibold ${
                          week.isCurrentWeek ? 'bg-amber-100 text-amber-900' : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {week.mondayFormatted}
                      </th>
                    ))}
                  </tr>

                  {/* Header Row 3: Sunday */}
                  <tr className="border-b-2 border-slate-400">
                    {semesterWeeks.map((week) => (
                      <th
                        key={`sun-${week.weekIndex}`}
                        className={`py-0.5 px-0.5 text-center border-r border-slate-300 font-mono text-[9px] font-medium ${
                          week.isCurrentWeek ? 'bg-amber-100 text-amber-900' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {week.sundayFormatted}
                      </th>
                    ))}
                  </tr>
                </thead>

                {/* Table Body */}
                <tbody className="divide-y divide-slate-200">
                  {groupBy === 'class' ? (
                    (() => {
                      const displayedFamilies = classFamilyGroups.filter(
                        (f) => selectedParentClass === 'ALL' || f.parentKey === selectedParentClass
                      );

                      if (displayedFamilies.length === 0) {
                        return (
                          <tr>
                            <td
                              colSpan={totalTableColCount}
                              className="py-8 text-center text-slate-400 italic"
                            >
                              Không tìm thấy lớp học hoặc môn học nào phù hợp.
                            </td>
                          </tr>
                        );
                      }

                      return displayedFamilies.map((family) => {
                        return (
                          <React.Fragment key={`family-${family.parentKey}`}>
                            {/* Parent Class Section Banner with Clean Minimalist Styling */}
                            <tr className="bg-slate-100 text-slate-900 font-bold border-t-2 border-b border-slate-300">
                              <td
                                colSpan={totalTableColCount}
                                className="py-1.5 px-3"
                              >
                                <div className="flex items-center justify-between text-xs flex-wrap gap-2">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-mono font-extrabold bg-white text-slate-900 px-2 py-0.5 rounded border border-slate-300 shadow-2xs">
                                      {family.parentKey}
                                    </span>
                                    {family.subgroups.length > 1 && (
                                      <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-bold border border-slate-300">
                                        {family.subgroups.length} lớp con: {family.subgroups.join(', ')}
                                      </span>
                                    )}
                                    {family.major && (
                                      <span className="text-[10px] text-slate-600 font-semibold hidden md:inline">
                                        · {family.major}
                                      </span>
                                    )}
                                    {family.studentCount && (
                                      <span className="text-[10px] text-slate-600 bg-white px-1.5 py-0.5 rounded border border-slate-200 font-bold">
                                        {family.studentCount} SV
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[10px] font-bold text-emerald-950 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-300 shadow-2xs">
                                    {family.items.length} môn · {family.totalHours} tiết ({family.totalTheoryHours} LT + {family.totalPracticeHours} TH)
                                  </span>
                                </div>
                              </td>
                            </tr>

                            {/* Course rows under this parent class with Standard Emerald Green Bars & Distinct Class Badges */}
                            {family.items.map((item, itemIdx) => {
                              const { teacher, course, childClass } = item;
                              const totalHours =
                                Math.round(((course.theoryHours || 0) + (course.practiceHours || 0)) * 100) / 100;
                              const completed = course.completedHours || 0;
                              const isDone = completed >= totalHours && totalHours > 0;
                              const schedule = computeCourseGanttSchedule(course, semesterWeeks, holidays);
                              const theme = STANDARD_EMERALD_THEME;

                              const validPhases = (course.schedulePhases || []).filter(
                                (p) => p.fromDate && p.scheduleSlots && p.scheduleSlots.length > 0
                              );

                              return (
                                <tr
                                  key={`${childClass}-${course.id}`}
                                  className={`border-b border-slate-200 ${
                                    itemIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'
                                  }`}
                                >
                                  {/* STT */}
                                  {colVisibility.stt && (
                                    <td className="py-1 px-1 text-center font-bold text-slate-500 bg-white border-r border-slate-200 text-[10px]">
                                      {itemIdx + 1}
                                    </td>
                                  )}

                                  {/* Child Class Name with Multi-color Subgroup Badges */}
                                  {colVisibility.class && (
                                    <td className="py-1 px-1.5 bg-white border-r border-slate-200">
                                      <span
                                        className={`font-mono font-bold text-[10px] px-1.5 py-0.5 rounded border shadow-2xs inline-block ${getSubgroupBadgeStyle(
                                          childClass,
                                          family.subgroups
                                        )}`}
                                        title={`Lớp con thuộc cụm ${family.parentKey}`}
                                      >
                                        {childClass}
                                      </span>
                                    </td>
                                  )}

                                  {/* Subject with Star, Subject Code, Slots & Phase Badges */}
                                  {colVisibility.subject && (
                                    <td className="py-1 px-2 font-bold text-slate-900 border-r border-slate-200 truncate text-[11px]">
                                      <div className="flex items-center gap-1.5">
                                        <span className="truncate">{course.subjectName}</span>
                                        {course.mergeRemainderHours && (
                                          <span
                                            className="inline-flex items-center text-amber-500 shrink-0"
                                            title="⭐ Môn này đã bật cộng dồn số tiết lẻ vào buổi cuối cùng cho biểu đồ Gantt"
                                          >
                                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500 drop-shadow-[0_0_3px_rgba(245,158,11,0.8)]" />
                                          </span>
                                        )}
                                      </div>
                                      <div className="flex flex-wrap items-center gap-1 text-[9px] text-slate-500 font-mono mt-0.5">
                                        {course.subjectCode && <span>{course.subjectCode}</span>}
                                        {validPhases.length > 0 ? (
                                          <span
                                            className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-purple-100 text-purple-900 border border-purple-300 flex items-center gap-0.5"
                                            title={`Đổi buổi theo giai đoạn: ${formatCourseScheduleSummary(course.scheduleSlots, validPhases)}`}
                                          >
                                            <span>{formatSlotSummary(course.scheduleSlots)}</span>
                                            <span className="text-purple-600 font-bold">➔</span>
                                            <span>{validPhases.map((p) => formatSlotSummary(p.scheduleSlots)).join(' ➔ ')}</span>
                                          </span>
                                        ) : course.scheduleSlots && course.scheduleSlots.length > 0 ? (
                                          <span
                                            className="px-1 py-0.2 rounded text-[9px] font-bold bg-amber-50 text-amber-800 border border-amber-200"
                                            title={`Buổi dạy: ${(course.scheduleSlots || []).join(', ')}`}
                                          >
                                            {formatSlotSummary(course.scheduleSlots)}
                                          </span>
                                        ) : null}
                                        {(() => {
                                          if (!coTeachingGroups) return null;
                                          const coGroup = coTeachingGroups.find(
                                            (g) =>
                                              g.className.toUpperCase() === course.className.toUpperCase() &&
                                              g.items.some((it: any) => it.course.id === course.id)
                                          );
                                          if (!coGroup || coGroup.items.length < 2) return null;
                                          const coItem = coGroup.items.find((it: any) => it.course.id === course.id);
                                          const phaseNum = coItem?.phase || course.sequentialPhase;
                                          return (
                                            <span
                                              className={`px-1 py-0.2 rounded text-[8px] font-bold ${
                                                phaseNum === 1
                                                  ? 'bg-purple-100 text-purple-800 border border-purple-200'
                                                  : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                              }`}
                                            >
                                              {phaseNum === 1 ? 'Đợt 1' : 'Đợt 2'}
                                            </span>
                                          );
                                        })()}
                                      </div>
                                    </td>
                                  )}

                                  {/* Teacher Name */}
                                  {colVisibility.teacher && (
                                    <td className="py-1 px-2 border-r border-slate-200 font-semibold text-slate-800 truncate text-[11px]">
                                      {teacher.name}
                                    </td>
                                  )}

                                  {/* Position with Distinct Color Badge */}
                                  {colVisibility.position && (
                                    <td className="py-1 px-1 text-center border-r border-slate-200 text-[9px]">
                                      <span
                                        className={`px-1.5 py-0.5 rounded font-bold border inline-block ${
                                          teacher.position?.includes('Cơ hữu')
                                            ? 'bg-blue-100 text-blue-800 border-blue-200'
                                            : 'bg-amber-100 text-amber-800 border-amber-200'
                                        }`}
                                      >
                                        {teacher.position || ''}
                                      </span>
                                    </td>
                                  )}

                                  {/* LT */}
                                  {colVisibility.lt && (
                                    <td className="py-1 px-1 text-center text-slate-600 border-r border-slate-200 text-[10px]">
                                      {course.theoryHours}
                                    </td>
                                  )}

                                  {/* TH */}
                                  {colVisibility.th && (
                                    <td className="py-1 px-1 text-center text-slate-600 border-r border-slate-200 text-[10px]">
                                      {course.practiceHours}
                                    </td>
                                  )}

                                  {/* Total */}
                                  {colVisibility.total && (
                                    <td className="py-1 px-1 text-center font-bold text-slate-800 border-r border-slate-200 text-[10px]">
                                      {totalHours}
                                    </td>
                                  )}

                                  {/* Completed */}
                                  {colVisibility.progress && (
                                    <td className="py-1 px-1 text-center border-r-2 border-slate-400 font-bold text-[9px]">
                                      <span
                                        className={`px-1 py-0.5 rounded border inline-block ${
                                          isDone
                                            ? 'text-emerald-700 bg-emerald-50 border-emerald-200 font-extrabold'
                                            : 'text-blue-700 bg-blue-50 border-blue-200'
                                        }`}
                                      >
                                        {completed}/{totalHours}h
                                      </span>
                                    </td>
                                  )}

                                  {/* Continuous Connected Gantt Bar Cells with Multi-Color Theme */}
                                  {semesterWeeks.map((week) => {
                                    const cell = schedule.cells.find((c) => c.weekIndex === week.weekIndex);

                                    if (!cell || !cell.isInSpan) {
                                      return (
                                        <td key={week.weekIndex} className="border-r border-slate-200 p-0 text-center" />
                                      );
                                    }

                                    const isCompletedWeek = cell.status === 'completed';
                                    const isPartial = cell.status === 'partially_completed';
                                    const isPauseWeek = !cell.hasSessions || cell.totalHoursInWeek === 0;

                                    return (
                                      <td
                                        key={week.weekIndex}
                                        className="border-r border-slate-200 p-0 text-center align-middle"
                                      >
                                        <div
                                          className={`h-4.5 w-full border-t-2 border-b-2 ${
                                            isPauseWeek ? 'border-slate-400 bg-slate-200' : theme.border
                                          } ${
                                            cell.isStartWeek ? 'border-l-2 rounded-l-xs ml-0.2' : 'border-l-0'
                                          } ${
                                            cell.isEndWeek ? 'border-r-2 rounded-r-xs mr-0.2' : 'border-r-0'
                                          } ${
                                            isPauseWeek
                                              ? 'bg-slate-200'
                                              : isCompletedWeek
                                              ? theme.bgCompleted
                                              : isPartial
                                              ? 'bg-gradient-to-r from-emerald-600 from-50% to-white to-50%'
                                              : theme.bgPending
                                          } flex items-center justify-center`}
                                        >
                                          <span
                                            className={`text-[8px] font-bold ${
                                              isCompletedWeek
                                                ? theme.textCompleted
                                                : isPauseWeek
                                                ? 'text-slate-600'
                                                : theme.textPending
                                            }`}
                                          >
                                            {isPauseWeek ? '0' : cell.totalHoursInWeek}
                                          </span>
                                        </div>
                                      </td>
                                    );
                                  })}
                                </tr>
                              );
                            })}
                          </React.Fragment>
                        );
                      });
                    })()
                  ) : filteredTeachers.length === 0 ? (
                    <tr>
                      <td
                        colSpan={totalTableColCount}
                        className="py-8 text-center text-slate-400 italic"
                      >
                        Không tìm thấy giảng viên hoặc môn học nào phù hợp.
                      </td>
                    </tr>
                  ) : (
                    filteredTeachers.map((teacher, tIdx) => {
                      const courses = teacher.courses && teacher.courses.length > 0 ? teacher.courses : [];
                      const courseSpan = courses.length || 1;

                      if (courses.length === 0) {
                        const remainingStatic = Math.max(
                          1,
                          visibleStaticColCount -
                            (colVisibility.stt ? 1 : 0) -
                            (colVisibility.teacher ? 1 : 0) -
                            (colVisibility.position ? 1 : 0)
                        );
                        return (
                          <tr key={teacher.id} className="border-b border-slate-200">
                            {colVisibility.stt && (
                              <td className="py-2 px-1 text-center font-bold text-slate-600 border-r border-slate-200">
                                {tIdx + 1}
                              </td>
                            )}
                            {colVisibility.teacher && (
                              <td className="py-2 px-2 border-r border-slate-200 font-bold text-slate-900">
                                {teacher.name}
                              </td>
                            )}
                            {colVisibility.position && (
                              <td className="py-2 px-1 text-center border-r border-slate-200 text-[10px]">
                                <span
                                  className={`px-1.5 py-0.5 rounded font-bold border inline-block ${
                                    teacher.position?.includes('Cơ hữu')
                                      ? 'bg-blue-100 text-blue-800 border-blue-200'
                                      : 'bg-amber-100 text-amber-800 border-amber-200'
                                  }`}
                                >
                                  {teacher.position}
                                </span>
                              </td>
                            )}
                            <td colSpan={remainingStatic} className="py-2 px-2 text-slate-400 italic border-r-2 border-slate-400">
                              (Chưa phân công môn)
                            </td>
                            {semesterWeeks.map((w) => (
                              <td key={w.weekIndex} className="border-r border-slate-200" />
                            ))}
                          </tr>
                        );
                      }

                      return courses.map((course, cIdx) => {
                        const isFirst = cIdx === 0;
                        const totalHours =
                          Math.round(((course.theoryHours || 0) + (course.practiceHours || 0)) * 100) / 100;
                        const completed = course.completedHours || 0;
                        const isDone = completed >= totalHours && totalHours > 0;
                        const schedule = computeCourseGanttSchedule(course, semesterWeeks, holidays);
                        const borderColor = 'border-emerald-700';

                        const validPhases = (course.schedulePhases || []).filter(
                          (p) => p.fromDate && p.scheduleSlots && p.scheduleSlots.length > 0
                        );

                        return (
                          <tr key={course.id} className="border-b border-slate-200">
                            {/* STT */}
                            {colVisibility.stt && isFirst && (
                              <td
                                rowSpan={courseSpan}
                                className="py-2 px-1 text-center font-bold text-slate-700 align-middle border-r border-slate-200"
                              >
                                {tIdx + 1}
                              </td>
                            )}

                            {/* Teacher Name */}
                            {colVisibility.teacher && isFirst && (
                              <td
                                rowSpan={courseSpan}
                                className="py-2 px-2 align-middle border-r border-slate-200 font-bold text-slate-900"
                              >
                                {teacher.name}
                              </td>
                            )}

                            {/* Position with Distinct Color Badge */}
                            {colVisibility.position && isFirst && (
                              <td
                                rowSpan={courseSpan}
                                className="py-2 px-1 text-center align-middle border-r border-slate-200 text-[10px]"
                              >
                                <span
                                  className={`px-1.5 py-0.5 rounded font-bold border inline-block ${
                                    teacher.position?.includes('Cơ hữu')
                                      ? 'bg-blue-100 text-blue-800 border-blue-200'
                                      : 'bg-amber-100 text-amber-800 border-amber-200'
                                  }`}
                                >
                                  {teacher.position}
                                </span>
                              </td>
                            )}

                            {/* Subject with Star, Subject Code & Phase Badges */}
                            {colVisibility.subject && (
                              <td className="py-1.5 px-2 font-bold text-slate-900 border-r border-slate-200 truncate">
                                <div className="flex items-center gap-1.5">
                                  <span className="truncate">{course.subjectName}</span>
                                  {course.mergeRemainderHours && (
                                    <span
                                      className="inline-flex items-center text-amber-500 shrink-0"
                                      title="⭐ Môn này đã bật cộng dồn số tiết lẻ vào buổi cuối cùng cho biểu đồ Gantt"
                                    >
                                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500 drop-shadow-[0_0_3px_rgba(245,158,11,0.8)]" />
                                    </span>
                                  )}
                                </div>
                                <div className="flex flex-wrap items-center gap-1 text-[9px] text-slate-500 font-mono mt-0.5">
                                  {course.subjectCode && <span>{course.subjectCode}</span>}
                                  {validPhases.length > 0 ? (
                                    <span
                                      className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-purple-100 text-purple-900 border border-purple-300 flex items-center gap-0.5"
                                      title={`Đổi buổi theo giai đoạn: ${formatCourseScheduleSummary(course.scheduleSlots, validPhases)}`}
                                    >
                                      <span>{formatSlotSummary(course.scheduleSlots)}</span>
                                      <span className="text-purple-600 font-bold">➔</span>
                                      <span>{validPhases.map((p) => formatSlotSummary(p.scheduleSlots)).join(' ➔ ')}</span>
                                    </span>
                                  ) : course.scheduleSlots && course.scheduleSlots.length > 0 ? (
                                    <span
                                      className="px-1 py-0.2 rounded text-[9px] font-bold bg-amber-50 text-amber-800 border border-amber-200"
                                      title={`Buổi dạy: ${(course.scheduleSlots || []).join(', ')}`}
                                    >
                                      {formatSlotSummary(course.scheduleSlots)}
                                    </span>
                                  ) : null}
                                </div>
                              </td>
                            )}

                            {/* Class */}
                            {colVisibility.class && (
                              <td className="py-1.5 px-1 text-center font-mono font-bold text-[10px] text-slate-700 border-r border-slate-200">
                                {course.className}
                              </td>
                            )}

                            {/* LT */}
                            {colVisibility.lt && (
                              <td className="py-1.5 px-1 text-center text-slate-600 border-r border-slate-200">
                                {course.theoryHours}
                              </td>
                            )}

                            {/* TH */}
                            {colVisibility.th && (
                              <td className="py-1.5 px-1 text-center text-slate-600 border-r border-slate-200">
                                {course.practiceHours}
                              </td>
                            )}

                            {/* Total */}
                            {colVisibility.total && (
                              <td className="py-1.5 px-1 text-center font-bold text-slate-800 border-r border-slate-200">
                                {totalHours}
                              </td>
                            )}

                            {/* Completed */}
                            {colVisibility.progress && (
                              <td className="py-1.5 px-1 text-center border-r-2 border-slate-400 font-bold text-[10px]">
                                <span
                                  className={`px-1 py-0.5 rounded border inline-block ${
                                    isDone
                                      ? 'text-emerald-700 bg-emerald-50 border-emerald-200 font-extrabold'
                                      : 'text-blue-700 bg-blue-50 border-blue-200'
                                  }`}
                                >
                                  {completed}/{totalHours}h
                                </span>
                              </td>
                            )}

                            {/* Continuous Connected Gantt Bar Cells */}
                            {semesterWeeks.map((week) => {
                              const cell = schedule.cells.find((c) => c.weekIndex === week.weekIndex);

                              if (!cell || !cell.isInSpan) {
                                return (
                                  <td key={week.weekIndex} className="border-r border-slate-200 p-0 text-center" />
                                );
                              }

                              const isCompletedWeek = cell.status === 'completed';
                              const isPartial = cell.status === 'partially_completed';
                              const isPauseWeek = !cell.hasSessions || cell.totalHoursInWeek === 0;

                              return (
                                <td key={week.weekIndex} className="border-r border-slate-200 p-0 text-center align-middle">
                                  <div
                                    className={`h-4.5 w-full border-t-2 border-b-2 ${borderColor} ${
                                      cell.isStartWeek ? 'border-l-2 rounded-l-xs ml-0.5' : 'border-l-0'
                                    } ${
                                      cell.isEndWeek ? 'border-r-2 rounded-r-xs mr-0.5' : 'border-r-0'
                                    } ${
                                      isPauseWeek
                                        ? 'bg-slate-100 bg-[radial-gradient(#94a3b8_1.2px,transparent_1.2px)] [background-size:5px_5px]'
                                        : isCompletedWeek
                                        ? 'bg-[repeating-linear-gradient(45deg,#059669_0,#059669_2px,#10b981_2px,#10b981_4px)]'
                                        : isPartial
                                        ? 'bg-gradient-to-r from-emerald-600 to-white'
                                        : 'bg-white'
                                    }`}
                                  />
                                </td>
                              );
                            })}
                          </tr>
                        );
                      });
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

