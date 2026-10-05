import ExcelJS from 'exceljs';
import { CustomColumn, Semester, Teacher } from '../types';

export interface ExportExcelOptions {
  semester: Semester;
  filteredTeachers: Teacher[];
  filterPosition?: string;
  filterStatus?: string;
  searchTerm?: string;
  customColumns: CustomColumn[];
  customTitle?: string;
  fileNamePrefix?: string;
}

/**
 * Generates and downloads a fully styled Excel spreadsheet (.xlsx)
 * with bordered grid lines, bold headers, background fills, and cell merges.
 */
export async function exportTeachingReportToExcel({
  semester,
  filteredTeachers,
  customColumns,
  customTitle,
  fileNamePrefix,
}: ExportExcelOptions): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'EduTrack System';
  workbook.lastModifiedBy = 'EduTrack System';
  workbook.created = new Date();
  workbook.modified = new Date();

  const safeSheetName =
    semester.name.replace(/[:\\/?*[\]]/g, ' ').substring(0, 30) || 'BaoCaoGiangDay';
  const worksheet = workbook.addWorksheet(safeSheetName, {
    views: [{ showGridLines: true }],
  });

  const thinBorder: Partial<ExcelJS.Borders> = {
    top: { style: 'thin', color: { argb: 'FF94A3B8' } },
    left: { style: 'thin', color: { argb: 'FF94A3B8' } },
    bottom: { style: 'thin', color: { argb: 'FF94A3B8' } },
    right: { style: 'thin', color: { argb: 'FF94A3B8' } },
  };

  const headerBorder: Partial<ExcelJS.Borders> = {
    top: { style: 'medium', color: { argb: 'FF0F172A' } },
    left: { style: 'thin', color: { argb: 'FF475569' } },
    bottom: { style: 'medium', color: { argb: 'FF0F172A' } },
    right: { style: 'thin', color: { argb: 'FF475569' } },
  };

  const headers = [
    'STT',
    'Họ và Tên Giảng Viên',
    'Chức Vụ',
    'Tên Môn Học',
    'Lớp Giảng Dạy',
    'Tiết LT',
    'Tiết TH',
    'Tổng Tiết',
    'Đã Dạy',
    'Tiến Độ (%)',
    'Tình Trạng',
    ...customColumns.map((col) => col.name),
  ];

  const totalCols = headers.length;

  // Row 1: Main Title
  const mainTitle =
    customTitle ||
    `BẢNG THEO DÕI TIẾN ĐỘ GIẢNG DẠY - ${semester.name.toUpperCase()}`;
  const titleRow = worksheet.addRow([mainTitle]);
  worksheet.mergeCells(1, 1, 1, totalCols);
  titleRow.height = 32;
  titleRow.font = {
    name: 'Segoe UI',
    size: 14,
    bold: true,
    color: { argb: 'FF0F172A' },
  };
  titleRow.alignment = { vertical: 'middle', horizontal: 'center' };

  // Row 2: Subtitle info
  const subTitleText = `Năm học: ${semester.academicYear || '2026-2027'} | Thời gian: ${semester.startDate || ''} → ${semester.endDate || ''} | Xuất ngày: ${new Date().toLocaleDateString('vi-VN')}`;
  const subRow = worksheet.addRow([subTitleText]);
  worksheet.mergeCells(2, 1, 2, totalCols);
  subRow.height = 20;
  subRow.font = {
    name: 'Segoe UI',
    size: 10,
    italic: true,
    color: { argb: 'FF475569' },
  };
  subRow.alignment = { vertical: 'middle', horizontal: 'center' };

  // Row 3: Spacer
  const spacerRow = worksheet.addRow([]);
  spacerRow.height = 10;

  // Row 4: Header Row
  const headerRow = worksheet.addRow(headers);
  headerRow.height = 28;
  headerRow.eachCell((cell) => {
    cell.font = {
      name: 'Segoe UI',
      size: 11,
      bold: true,
      color: { argb: 'FFFFFFFF' },
    };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF065F46' }, // Dark Emerald header
    };
    cell.alignment = {
      vertical: 'middle',
      horizontal: 'center',
      wrapText: true,
    };
    cell.border = headerBorder;
  });

  // Data Rows start at row 5
  let currentRowIdx = 5;
  let teacherIndex = 1;

  filteredTeachers.forEach((teacher) => {
    const courseList =
      teacher.courses && teacher.courses.length > 0
        ? teacher.courses
        : [
            {
              id: 'empty',
              subjectName: '(Chưa phân công môn)',
              theoryHours: 0,
              practiceHours: 0,
              className: '-',
              status: 'Đang dạy' as const,
              completedHours: 0,
              customValues: {},
            },
          ];

    const courseSpan = courseList.length;
    const startRow = currentRowIdx;

    courseList.forEach((c, idx) => {
      const isFirst = idx === 0;
      const totalCourseHours = (c.theoryHours || 0) + (c.practiceHours || 0);
      const taughtHours = c.completedHours !== undefined ? c.completedHours : 0;
      const progressPercent =
        totalCourseHours > 0
          ? Math.min(100, Math.round((taughtHours / totalCourseHours) * 100))
          : 0;
      const isDone = taughtHours >= totalCourseHours && totalCourseHours > 0;
      const statusText = isDone ? 'Đã hoàn thành' : 'Đang dạy';

      // Custom column values
      const customColVals = customColumns.map((col) => {
        const val = c.customValues?.[col.id];
        if (typeof val === 'boolean') {
          return val ? '✓ Đã xong' : 'Chưa';
        }
        return val ?? '';
      });

      const rowData = [
        isFirst ? teacherIndex : '',
        isFirst ? teacher.name : '',
        isFirst ? teacher.position || 'Giảng viên' : '',
        c.subjectName,
        c.className,
        c.theoryHours || 0,
        c.practiceHours || 0,
        totalCourseHours,
        taughtHours,
        `${progressPercent}%`,
        statusText,
        ...customColVals,
      ];

      const dataRow = worksheet.addRow(rowData);
      dataRow.height = 24;

      // Style every cell with borders and appropriate alignment
      dataRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        cell.border = thinBorder;
        cell.font = { name: 'Segoe UI', size: 10.5, color: { argb: 'FF1E293B' } };

        // Specific alignments
        if (colNumber === 1 || colNumber === 5 || colNumber === 11) {
          // STT, Class, Status
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
        } else if (colNumber === 3) {
          // Position
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
        } else if (colNumber >= 6 && colNumber <= 10) {
          // Numbers (LT, TH, Total, Done, %)
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
          if (colNumber === 8 || colNumber === 9) {
            cell.font = { name: 'Segoe UI', size: 10.5, bold: true, color: { argb: 'FF0F172A' } };
          }
          if (colNumber === 10) {
            cell.font = {
              name: 'Segoe UI',
              size: 10.5,
              bold: true,
              color: { argb: isDone ? 'FF047857' : 'FF1D4ED8' },
            };
          }
        } else if (colNumber === 2 || colNumber === 4) {
          // Teacher Name, Subject Name
          cell.alignment = { vertical: 'middle', horizontal: 'left' };
          if (colNumber === 2) {
            cell.font = { name: 'Segoe UI', size: 10.5, bold: true, color: { argb: 'FF0F172A' } };
          }
        } else {
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
        }

        // Status highlight
        if (colNumber === 11) {
          cell.font = {
            name: 'Segoe UI',
            size: 10,
            bold: true,
            color: { argb: isDone ? 'FF047857' : 'FF1E40AF' },
          };
        }
      });

      currentRowIdx++;
    });

    // Merge STT, Teacher Name and Position across teacher's courses
    if (courseSpan > 1) {
      const endRow = startRow + courseSpan - 1;

      worksheet.mergeCells(startRow, 1, endRow, 1); // STT
      worksheet.mergeCells(startRow, 2, endRow, 2); // Teacher Name
      worksheet.mergeCells(startRow, 3, endRow, 3); // Position

      // Re-apply borders to merged areas
      for (let r = startRow; r <= endRow; r++) {
        worksheet.getCell(r, 1).border = thinBorder;
        worksheet.getCell(r, 2).border = thinBorder;
        worksheet.getCell(r, 3).border = thinBorder;
      }
    }

    teacherIndex++;
  });

  // Set column widths in Excel
  const colWidths = [
    { width: 7 }, // STT
    { width: 28 }, // Họ tên GV
    { width: 22 }, // Chức vụ
    { width: 34 }, // Tên Môn
    { width: 16 }, // Lớp
    { width: 10 }, // LT
    { width: 10 }, // TH
    { width: 12 }, // Tổng tiết
    { width: 12 }, // Đã dạy
    { width: 14 }, // Tiến độ %
    { width: 18 }, // Tình trạng
    ...customColumns.map(() => ({ width: 18 })),
  ];

  colWidths.forEach((col, i) => {
    worksheet.getColumn(i + 1).width = col.width;
  });

  // Generate buffer and trigger browser download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  const cleanSemesterName = semester.name
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9_\u00C0-\u1EF9]/g, '');

  const prefix = fileNamePrefix || 'Bao_Cao_Chuan';
  const fileName = `${prefix}_${cleanSemesterName}_${new Date()
    .toISOString()
    .slice(0, 10)}.xlsx`;

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
