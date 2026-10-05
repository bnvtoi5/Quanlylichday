import { MasterClass } from '../types';

export interface ClassDetectionResult {
  updatedMasterClasses: MasterClass[];
  createdParents: string[];
  linkedSubgroups: { parent: string; child: string }[];
  hasChanges: boolean;
}

/**
 * Phân tích tên lớp để tìm tên Cụm Lớp Chung (Lớp Mẹ) và Hậu tố lớp con.
 * Quy ước chuẩn tại trường:
 * - CNTT24TH1 -> Lớp chung: CNTT24TH, Lớp con: CNTT24TH1 (Hậu tố 1)
 * - LTMT24TH1 -> Lớp chung: LTMT24TH, Lớp con: LTMT24TH1 (Hậu tố 1)
 * - CĐT26TH3  -> Lớp chung: CĐT26TH,  Lớp con: CĐT26TH3  (Hậu tố 3)
 * - CNTT24TH  -> Lớp chung: CNTT24TH (Nếu là lớp đơn thì lớp con là CNTT24TH1)
 */
export function extractCandidateParentName(
  className: string
): { baseName: string; suffix: string } | null {
  const trimmed = className.trim().toUpperCase();
  if (!trimmed || trimmed.length < 3) return null;

  // Pattern 1: Rõ ràng có tiền tố nhóm/tổ: "-N1", "_N2", " N1", "-T1", "_T2", " NHOM 1", " TO 2"
  const explicitGroupPattern = /^(.*?)[\s\-_]+(?:NHÓM|NHOM|TỔ|TO|N|T)\s*([0-9A-Z]+)$/i;
  const explicitMatch = trimmed.match(explicitGroupPattern);
  if (explicitMatch) {
    const base = explicitMatch[1].trim();
    const suffix = explicitMatch[2].trim();
    if (base.length >= 3) {
      return { baseName: base, suffix: `N${suffix}` };
    }
  }

  // Pattern 2: Đuôi là 1 chữ số duy nhất (1 đến 9) đứng sau chữ cái
  // Ví dụ: CNTT24TH1 -> base: CNTT24TH, suffix: 1
  // LTMT25TH1 -> base: LTMT25TH, suffix: 1
  // CĐT26TH4 -> base: CĐT26TH, suffix: 4
  const trailingSingleDigitPattern = /^(.*?[A-ZÀ-Ỹ]+)([1-9])$/i;
  const digitMatch = trimmed.match(trailingSingleDigitPattern);
  if (digitMatch) {
    const base = digitMatch[1].trim();
    const digit = digitMatch[2];
    if (base.length >= 3) {
      return { baseName: base, suffix: digit };
    }
  }

  // Pattern 3: Nếu là lớp kết thúc bằng chữ cái (VD: CNTT24TH, QTM24TH)
  // Bản thân nó chính là Base Name
  if (/^[A-ZÀ-Ỹ0-9]+[A-ZÀ-Ỹ]+$/i.test(trimmed) && trimmed.length >= 4) {
    return { baseName: trimmed, suffix: '' };
  }

  return null;
}

/**
 * Lấy tên Cụm Lớp Chung (Lớp Mẹ) từ bất kỳ tên lớp con nào
 */
export function getCanonicalParentName(className: string): string {
  const candidate = extractCandidateParentName(className);
  return candidate ? candidate.baseName : className.trim().toUpperCase();
}

/**
 * Đảm bảo tên lớp học được gán môn luôn là Lớp Con (mang mã TH1, TH2...).
 * Không bao giờ gán môn vào lớp chung TH không có số.
 */
export function ensureChildClassName(className: string): string {
  const trimmed = className.trim();
  if (!trimmed) return 'CNTT26TH1';

  // Nếu kết thúc bằng số 1..9 -> Đã là lớp con
  if (/[1-9]$/.test(trimmed)) {
    return trimmed;
  }

  // Nếu kết thúc bằng chữ cái (e.g. CNTT24TH, LTMT24TH) -> Chuyển thành TH1
  return `${trimmed}1`;
}

/**
 * Tự động quét toàn bộ danh sách lớp (trong masterClasses và trong các môn học của học kỳ)
 * để chuẩn hóa toàn bộ thành cấu trúc Cụm Lớp Chung -> Lớp Con.
 */
export function autoDetectAndAddParentClasses(
  existingMasterClasses: MasterClass[],
  extraClassNamesFromCourses: string[] = []
): ClassDetectionResult {
  let hasChanges = false;
  const createdParents: string[] = [];
  const linkedSubgroups: { parent: string; child: string }[] = [];

  const classMap = new Map<string, MasterClass>();
  existingMasterClasses.forEach((mc) => {
    classMap.set(mc.name.trim().toUpperCase(), { ...mc });
  });

  const allClassNames = new Set<string>();
  existingMasterClasses.forEach((mc) => {
    if (mc.name.trim()) allClassNames.add(mc.name.trim().toUpperCase());
  });
  extraClassNamesFromCourses.forEach((name) => {
    const trimmed = (name || '').trim().toUpperCase();
    if (trimmed && trimmed !== 'CHƯA PHÂN LỚP') allClassNames.add(trimmed);
  });

  const parentToChildren = new Map<string, Set<string>>();

  allClassNames.forEach((name) => {
    const candidate = extractCandidateParentName(name);
    if (candidate) {
      const { baseName } = candidate;
      const set = parentToChildren.get(baseName) || new Set<string>();
      if (candidate.suffix) {
        set.add(name);
      }
      parentToChildren.set(baseName, set);
    } else {
      const set = parentToChildren.get(name) || new Set<string>();
      parentToChildren.set(name, set);
    }
  });

  // Đảm bảo mỗi cụm lớp mẹ đều có ít nhất 1 lớp con (nếu chưa có thì tạo TH1)
  parentToChildren.forEach((childrenSet, parentName) => {
    if (childrenSet.size === 0) {
      childrenSet.add(`${parentName}1`);
      hasChanges = true;
    }

    const childrenList = Array.from(childrenSet).sort((a, b) =>
      a.localeCompare(b, 'vi', { sensitivity: 'base', numeric: true })
    );

    // 1. Kiểm tra hoặc tạo MasterClass cho Lớp Chung (Mẹ)
    let parentObj = classMap.get(parentName);
    if (!parentObj) {
      let sampleMajor = '';
      let sampleYear = '';
      let totalStudents = 0;

      childrenList.forEach((childName) => {
        const c = classMap.get(childName);
        if (c) {
          if (!sampleMajor && c.major) sampleMajor = c.major;
          if (!sampleYear && c.academicYear) sampleYear = c.academicYear;
          if (c.studentCount) totalStudents += c.studentCount;
        }
      });

      if (!sampleMajor) {
        if (parentName.startsWith('QTM')) sampleMajor = 'Quản trị Mạng máy tính';
        else if (parentName.startsWith('LTMT')) sampleMajor = 'Lập trình Máy tính';
        else if (parentName.startsWith('CĐT')) sampleMajor = 'Cơ Điện Tử';
        else if (parentName.startsWith('VTHC')) sampleMajor = 'Văn thư Hành chính';
        else sampleMajor = 'Công nghệ Thông tin';
      }

      parentObj = {
        id: `mc-${parentName.toLowerCase()}`,
        name: parentName,
        major: sampleMajor,
        academicYear: sampleYear || undefined,
        studentCount: totalStudents > 0 ? totalStudents : undefined,
        isParent: true,
        subgroups: childrenList,
      };

      classMap.set(parentName, parentObj);
      createdParents.push(parentName);
      hasChanges = true;
    } else {
      parentObj.isParent = true;
      parentObj.subgroups = childrenList;
      classMap.set(parentName, parentObj);
    }

    // 2. Tạo hoặc liên kết từng Lớp Con
    childrenList.forEach((childName) => {
      let childObj = classMap.get(childName);
      if (!childObj) {
        childObj = {
          id: `mc-${childName.toLowerCase()}`,
          name: childName,
          major: parentObj?.major,
          academicYear: parentObj?.academicYear,
          parentClassName: parentName,
        };
        classMap.set(childName, childObj);
        hasChanges = true;
      } else {
        if (childObj.parentClassName !== parentName) {
          childObj.parentClassName = parentName;
          classMap.set(childName, childObj);
          hasChanges = true;
        }
      }
      linkedSubgroups.push({ parent: parentName, child: childName });
    });
  });

  return {
    updatedMasterClasses: Array.from(classMap.values()),
    createdParents,
    linkedSubgroups,
    hasChanges,
  };
}
