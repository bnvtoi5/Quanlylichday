import { AppState, Holiday, MasterClass, MasterSubject, MasterTeacher, Semester } from '../types';

export const INITIAL_MASTER_SUBJECTS: MasterSubject[] = [
  {
    "id": "subj-1",
    "code": "HQTCSDLM",
    "name": "HQT CSDL(MS SQL Server)",
    "theoryHours": 30,
    "practiceHours": 45,
    "credits": 2.5,
    "department": "Khoa Công nghệ Thông tin"
  },
  {
    "id": "subj-2",
    "code": "LAPTRINH",
    "name": "Lập trình Window",
    "theoryHours": 45,
    "practiceHours": 105,
    "credits": 5,
    "department": "Khoa Công nghệ Thông tin"
  },
  {
    "id": "subj-3",
    "code": "LAPTRINH",
    "name": "Lập trình Web",
    "theoryHours": 45,
    "practiceHours": 75,
    "credits": 4,
    "department": "Khoa Công nghệ Thông tin"
  },
  {
    "id": "subj-4",
    "code": "HEQUANTR",
    "name": "Hệ quản trị CSDL MS Access",
    "theoryHours": 30,
    "practiceHours": 75,
    "credits": 3.5,
    "department": "Khoa Công nghệ Thông tin"
  },
  {
    "id": "subj-5",
    "code": "THIETKEW",
    "name": "Thiết kế Web",
    "theoryHours": 20,
    "practiceHours": 0,
    "credits": 1,
    "department": "Khoa Công nghệ Thông tin"
  },
  {
    "id": "subj-6",
    "code": "ANTOANVS",
    "name": "An toàn VSCN",
    "theoryHours": 30,
    "practiceHours": 0,
    "credits": 1,
    "department": "Khoa Công nghệ Thông tin"
  },
  {
    "id": "subj-7",
    "code": "QTHTWEBS",
    "name": "QTHT WebServer và MailServer",
    "theoryHours": 40,
    "practiceHours": 65,
    "credits": 3.5,
    "department": "Khoa Công nghệ Thông tin"
  },
  {
    "id": "subj-8",
    "code": "ANTOANMA",
    "name": "An toàn mạng",
    "theoryHours": 30,
    "practiceHours": 30,
    "credits": 2,
    "department": "Khoa Công nghệ Thông tin"
  },
  {
    "id": "subj-9",
    "code": "OHOAUNGD",
    "name": "Đồ hoạ ứng dụng",
    "theoryHours": 15,
    "practiceHours": 30,
    "credits": 1.5,
    "department": "Khoa Công nghệ Thông tin"
  },
  {
    "id": "subj-10",
    "code": "LAPTRINH",
    "name": "Lập trình trực quan Access",
    "theoryHours": 30,
    "practiceHours": 90,
    "credits": 4,
    "department": "Khoa Công nghệ Thông tin"
  },
  {
    "id": "subj-11",
    "code": "MANGCANB",
    "name": "Mạng căn bản",
    "theoryHours": 30,
    "practiceHours": 30,
    "credits": 2,
    "department": "Khoa Công nghệ Thông tin"
  },
  {
    "id": "subj-12",
    "code": "LAPTRINH",
    "name": "Lập trình hướng đối tượng",
    "theoryHours": 30,
    "practiceHours": 45,
    "credits": 2.5,
    "department": "Khoa Công nghệ Thông tin"
  },
  {
    "id": "subj-13",
    "code": "COSODULI",
    "name": "Cơ sở dữ liệu",
    "theoryHours": 30,
    "practiceHours": 10,
    "credits": 1.5,
    "department": "Khoa Công nghệ Thông tin"
  },
  {
    "id": "subj-14",
    "code": "OHOAUNGD",
    "name": "Đồ họa ứng dụng",
    "theoryHours": 45,
    "practiceHours": 75,
    "credits": 4,
    "department": "Khoa Công nghệ Thông tin"
  },
  {
    "id": "subj-15",
    "code": "LAPRAPCA",
    "name": "Lắp ráp cài đặt máy tính",
    "theoryHours": 30,
    "practiceHours": 60,
    "credits": 3,
    "department": "Khoa Công nghệ Thông tin"
  },
  {
    "id": "subj-16",
    "code": "LAPTRINH",
    "name": "Lập trình HĐT  (Console)",
    "theoryHours": 30,
    "practiceHours": 30,
    "credits": 2,
    "department": "Khoa Công nghệ Thông tin"
  },
  {
    "id": "subj-17",
    "code": "NGUYENLY",
    "name": "Nguyên lý hệ điều hành",
    "theoryHours": 30,
    "practiceHours": 45,
    "credits": 2.5,
    "department": "Khoa Công nghệ Thông tin"
  },
  {
    "id": "subj-18",
    "code": "ANHVANCH",
    "name": "Anh văn chuyên ngành",
    "theoryHours": 30,
    "practiceHours": 30,
    "credits": 2,
    "department": "Khoa Văn Hóa"
  },
  {
    "id": "subj-19",
    "code": "MANGMAYT",
    "name": "Mạng máy tính",
    "theoryHours": 30,
    "practiceHours": 45,
    "credits": 2.5,
    "department": "Khoa Công nghệ Thông tin"
  },
  {
    "id": "subj-20",
    "code": "HEQUANTR",
    "name": "Hệ quản trị CSDL SQL",
    "theoryHours": 30,
    "practiceHours": 45,
    "credits": 2.5,
    "department": "Khoa Công nghệ Thông tin"
  },
  {
    "id": "subj-21",
    "code": "TINHOCCA",
    "name": "Tin học căn bản",
    "theoryHours": 15,
    "practiceHours": 30,
    "credits": 1.5,
    "department": "Khoa Công nghệ Thông tin"
  },
  {
    "id": "subj-22",
    "code": "TINHOCMO",
    "name": "Tin học Mos",
    "theoryHours": 15,
    "practiceHours": 45,
    "credits": 2,
    "department": "Khoa Công nghệ Thông tin"
  },
  {
    "id": "subj-23",
    "code": "KYTHUATL",
    "name": "Kỹ thuật lập trình",
    "theoryHours": 30,
    "practiceHours": 30,
    "credits": 2,
    "department": "Khoa Công nghệ Thông tin"
  },
  {
    "id": "subj-24",
    "code": "CAUTRUCD",
    "name": "Cấu trúc dữ liệu và giải thuật",
    "theoryHours": 30,
    "practiceHours": 45,
    "credits": 2.5,
    "department": "Khoa Công nghệ Thông tin"
  },
  {
    "id": "subj-chunhiem",
    "code": "CN-LOP",
    "name": "Chủ nhiệm lớp",
    "theoryHours": 67.5,
    "practiceHours": 0,
    "credits": 2,
    "department": "Khoa Công nghệ Thông tin"
  }
];

export const INITIAL_MASTER_CLASSES: MasterClass[] = [
  {
    "id": "mc-cntt24th",
    "name": "CNTT24TH",
    "major": "Công nghệ Thông tin",
    "academicYear": "2024-2027",
    "studentCount": 39,
    "isParent": true,
    "subgroups": [
      "CNTT24TH1",
      "CNTT24TH2"
    ]
  },
  {
    "id": "mc-cntt24th1",
    "name": "CNTT24TH1",
    "major": "Công nghệ Thông tin",
    "academicYear": "2024-2027",
    "studentCount": 18,
    "parentClassName": "CNTT24TH"
  },
  {
    "id": "mc-cntt24th2",
    "name": "CNTT24TH2",
    "major": "Công nghệ Thông tin",
    "academicYear": "2024-2027",
    "studentCount": 21,
    "parentClassName": "CNTT24TH"
  },
  {
    "id": "mc-ltmt24th",
    "name": "LTMT24TH",
    "major": "Lập trình Máy tính",
    "academicYear": "2024-2027",
    "studentCount": 23,
    "isParent": true,
    "subgroups": [
      "LTMT24TH1"
    ]
  },
  {
    "id": "mc-ltmt24th1",
    "name": "LTMT24TH1",
    "major": "Lập trình Máy tính",
    "academicYear": "2024-2027",
    "studentCount": 23,
    "parentClassName": "LTMT24TH"
  },
  {
    "id": "mc-qtm24th",
    "name": "QTM24TH",
    "major": "Quản trị Mạng máy tính",
    "academicYear": "2024-2027",
    "studentCount": 25,
    "isParent": true,
    "subgroups": [
      "QTM24TH1"
    ]
  },
  {
    "id": "mc-qtm24th1",
    "name": "QTM24TH1",
    "major": "Quản trị Mạng máy tính",
    "academicYear": "2024-2027",
    "studentCount": 25,
    "parentClassName": "QTM24TH"
  },
  {
    "id": "mc-cntt25th",
    "name": "CNTT25TH",
    "major": "Công nghệ Thông tin",
    "academicYear": "2025-2028",
    "studentCount": 35,
    "isParent": true,
    "subgroups": [
      "CNTT25TH1",
      "CNTT25TH2"
    ]
  },
  {
    "id": "mc-cntt25th1",
    "name": "CNTT25TH1",
    "major": "Công nghệ Thông tin",
    "academicYear": "2025-2028",
    "studentCount": 16,
    "parentClassName": "CNTT25TH"
  },
  {
    "id": "mc-cntt25th2",
    "name": "CNTT25TH2",
    "major": "Công nghệ Thông tin",
    "academicYear": "2025-2028",
    "studentCount": 19,
    "parentClassName": "CNTT25TH"
  },
  {
    "id": "mc-ltmt25th",
    "name": "LTMT25TH",
    "major": "Lập trình Máy tính",
    "academicYear": "2025-2028",
    "studentCount": 31,
    "isParent": true,
    "subgroups": [
      "LTMT25TH1"
    ]
  },
  {
    "id": "mc-ltmt25th1",
    "name": "LTMT25TH1",
    "major": "Lập trình Máy tính",
    "academicYear": "2025-2028",
    "studentCount": 31,
    "parentClassName": "LTMT25TH"
  },
  {
    "id": "mc-qtm25th",
    "name": "QTM25TH",
    "major": "Quản trị Mạng máy tính",
    "academicYear": "2025-2028",
    "studentCount": 38,
    "isParent": true,
    "subgroups": [
      "QTM25TH1",
      "QTM25TH2"
    ]
  },
  {
    "id": "mc-qtm25th1",
    "name": "QTM25TH1",
    "major": "Quản trị Mạng máy tính",
    "academicYear": "2025-2028",
    "studentCount": 18,
    "parentClassName": "QTM25TH"
  },
  {
    "id": "mc-qtm25th2",
    "name": "QTM25TH2",
    "major": "Quản trị Mạng máy tính",
    "academicYear": "2025-2028",
    "studentCount": 20,
    "parentClassName": "QTM25TH"
  },
  {
    "id": "mc-cntt26th",
    "name": "CNTT26TH",
    "major": "Công nghệ Thông tin",
    "academicYear": "2026-2029",
    "studentCount": 50,
    "isParent": true,
    "subgroups": [
      "CNTT26TH1",
      "CNTT26TH2"
    ]
  },
  {
    "id": "mc-cntt26th1",
    "name": "CNTT26TH1",
    "major": "Công nghệ Thông tin",
    "academicYear": "2026-2029",
    "studentCount": 25,
    "parentClassName": "CNTT26TH"
  },
  {
    "id": "mc-cntt26th2",
    "name": "CNTT26TH2",
    "major": "Công nghệ Thông tin",
    "academicYear": "2026-2029",
    "studentCount": 25,
    "parentClassName": "CNTT26TH"
  },
  {
    "id": "mc-ltmt26th",
    "name": "LTMT26TH",
    "major": "Lập trình Máy tính",
    "academicYear": "2026-2029",
    "studentCount": 45,
    "isParent": true,
    "subgroups": [
      "LTMT26TH1",
      "LTMT26TH2"
    ]
  },
  {
    "id": "mc-ltmt26th1",
    "name": "LTMT26TH1",
    "major": "Lập trình Máy tính",
    "academicYear": "2026-2029",
    "studentCount": 23,
    "parentClassName": "LTMT26TH"
  },
  {
    "id": "mc-ltmt26th2",
    "name": "LTMT26TH2",
    "major": "Lập trình Máy tính",
    "academicYear": "2026-2029",
    "studentCount": 22,
    "parentClassName": "LTMT26TH"
  },
  {
    "id": "mc-qtm26th",
    "name": "QTM26TH",
    "major": "Quản trị Mạng máy tính",
    "academicYear": "2026-2029",
    "studentCount": 50,
    "isParent": true,
    "subgroups": [
      "QTM26TH1",
      "QTM26TH2"
    ]
  },
  {
    "id": "mc-qtm26th1",
    "name": "QTM26TH1",
    "major": "Quản trị Mạng máy tính",
    "academicYear": "2026-2029",
    "studentCount": 25,
    "parentClassName": "QTM26TH"
  },
  {
    "id": "mc-qtm26th2",
    "name": "QTM26TH2",
    "major": "Quản trị Mạng máy tính",
    "academicYear": "2026-2029",
    "studentCount": 25,
    "parentClassName": "QTM26TH"
  },
  {
    "id": "mc-cđt26th",
    "name": "CĐT26TH",
    "major": "Cơ Điện Tử",
    "academicYear": "2026-2029",
    "studentCount": 78,
    "isParent": true,
    "subgroups": [
      "CĐT26TH1",
      "CĐT26TH2",
      "CĐT26TH3",
      "CĐT26TH4"
    ]
  },
  {
    "id": "mc-cđt26th1",
    "name": "CĐT26TH1",
    "major": "Cơ Điện Tử",
    "academicYear": "2026-2029",
    "studentCount": 19,
    "parentClassName": "CĐT26TH"
  },
  {
    "id": "mc-cđt26th2",
    "name": "CĐT26TH2",
    "major": "Cơ Điện Tử",
    "academicYear": "2026-2029",
    "studentCount": 20,
    "parentClassName": "CĐT26TH"
  },
  {
    "id": "mc-cđt26th3",
    "name": "CĐT26TH3",
    "major": "Cơ Điện Tử",
    "academicYear": "2026-2029",
    "studentCount": 19,
    "parentClassName": "CĐT26TH"
  },
  {
    "id": "mc-cđt26th4",
    "name": "CĐT26TH4",
    "major": "Cơ Điện Tử",
    "academicYear": "2026-2029",
    "studentCount": 20,
    "parentClassName": "CĐT26TH"
  },
  {
    "id": "mc-vthc26th",
    "name": "VTHC26TH",
    "major": "Văn thư Hành chính",
    "academicYear": "2026-2029",
    "studentCount": 50,
    "isParent": true,
    "subgroups": [
      "VTHC26TH1",
      "VTHC26TH2"
    ]
  },
  {
    "id": "mc-vthc26th1",
    "name": "VTHC26TH1",
    "major": "Văn thư Hành chính",
    "academicYear": "2026-2029",
    "studentCount": 25,
    "parentClassName": "VTHC26TH"
  },
  {
    "id": "mc-vthc26th2",
    "name": "VTHC26TH2",
    "major": "Văn thư Hành chính",
    "academicYear": "2026-2029",
    "studentCount": 25,
    "parentClassName": "VTHC26TH"
  },
  {
    "id": "mc-cntt23th",
    "name": "CNTT23TH",
    "major": "Công nghệ Thông tin",
    "academicYear": "2023-2026",
    "studentCount": 24,
    "isParent": true,
    "subgroups": [
      "CNTT23TH1"
    ]
  },
  {
    "id": "mc-cntt23th1",
    "name": "CNTT23TH1",
    "major": "Công nghệ Thông tin",
    "academicYear": "2023-2026",
    "studentCount": 24,
    "parentClassName": "CNTT23TH"
  }
];

export const INITIAL_MASTER_TEACHERS: MasterTeacher[] = [
  {
    "id": "mt-1",
    "name": "Nguyễn Thanh Phong",
    "code": "GV-NTP",
    "position": "Cơ hữu",
    "department": "Hiệu trưởng · Khoa Công nghệ Thông tin"
  },
  {
    "id": "mt-2",
    "name": "Lương Xuân Quang",
    "code": "GV-LXQ",
    "position": "Cơ hữu",
    "department": "Phòng ĐT&ĐBCL · Khoa CNTT"
  },
  {
    "id": "mt-3",
    "name": "Lê Quang Ái",
    "code": "GV-LQA",
    "position": "Cơ hữu",
    "department": "Trưởng Khoa · Khoa Công nghệ Thông tin"
  },
  {
    "id": "mt-4",
    "name": "Nguyễn Tấn Đức",
    "code": "GV-NTD",
    "position": "Cơ hữu",
    "department": "Khoa Công nghệ Thông tin"
  },
  {
    "id": "mt-5",
    "name": "Bùi Đức Tuấn",
    "code": "GV-BDT",
    "position": "Cơ hữu",
    "department": "Phó Trưởng Khoa · Khoa Công nghệ Thông tin"
  },
  {
    "id": "mt-6",
    "name": "Trần Đào Minh Hải",
    "code": "GV-TDMH",
    "position": "Cơ hữu",
    "department": "Khoa Công nghệ Thông tin"
  },
  {
    "id": "mt-7",
    "name": "Phạm Thị Duyên",
    "code": "GV-PTD",
    "position": "Thỉnh giảng",
    "department": "Khoa Công nghệ Thông tin"
  },
  {
    "id": "mt-8",
    "name": "Trần Khắc Sâm",
    "code": "GV-TKS",
    "position": "Thỉnh giảng",
    "department": "Khoa Công nghệ Thông tin"
  },
  {
    "id": "mt-9",
    "name": "Võ Triệu Bảo",
    "code": "GV-VTB",
    "position": "Thỉnh giảng",
    "department": "Khoa Công nghệ Thông tin"
  },
  {
    "id": "mt-10",
    "name": "Lê Phạm Bá Học",
    "code": "GV-LPBH",
    "position": "Thỉnh giảng",
    "department": "Khoa Công nghệ Thông tin"
  },
  {
    "id": "mt-11",
    "name": "Nguyễn Thị Tuyết Anh",
    "code": "GV-NTTA",
    "position": "Thỉnh giảng",
    "department": "Khoa Công nghệ Thông tin"
  },
  {
    "id": "mt-12",
    "name": "Đào Thụy Hạ Quyên",
    "code": "GV-DTHQ",
    "position": "Thỉnh giảng",
    "department": "Khoa Công nghệ Thông tin"
  },
  {
    "id": "mt-13",
    "name": "Đỗ Văn Thiện",
    "code": "GV-DVT",
    "position": "Thỉnh giảng",
    "department": "Khoa Công nghệ Thông tin"
  },
  {
    "id": "mt-14",
    "name": "Nguyễn Thành Lộc",
    "code": "GV-NTL",
    "position": "Thỉnh giảng",
    "department": "Khoa Công nghệ Thông tin"
  },
  {
    "id": "mt-15",
    "name": "Vũ Thị Hạnh",
    "code": "GV-VTH",
    "position": "Thỉnh giảng",
    "department": "Khoa Công nghệ Thông tin"
  },
  {
    "id": "mt-16",
    "name": "Cao Thị Hồng Sanh",
    "code": "GV-CTHS",
    "position": "Thỉnh giảng",
    "department": "Khoa Công nghệ Thông tin"
  },
  {
    "id": "mt-17",
    "name": "Trần Văn Đại",
    "code": "GV-TVD",
    "position": "Thỉnh giảng",
    "department": "Khoa Công nghệ Thông tin"
  },
  {
    "id": "mt-18",
    "name": "Trịnh Đình Thắng",
    "code": "GV-TDT",
    "position": "Thỉnh giảng",
    "department": "Khoa Công nghệ Thông tin"
  },
  {
    "id": "mt-19",
    "name": "Võ Thị Kim Liên",
    "code": "GV-VTKL",
    "position": "Thỉnh giảng",
    "department": "Khoa Công nghệ Thông tin"
  },
  {
    "id": "mt-20",
    "name": "Cao Hùng Thiên Bảo",
    "code": "GV-CHTB",
    "position": "Thỉnh giảng",
    "department": "Khoa Công nghệ Thông tin"
  },
  {
    "id": "mt-21",
    "name": "Mai Hoài Vương Linh",
    "code": "GV-MHVL",
    "position": "Thỉnh giảng",
    "department": "Khoa Công nghệ Thông tin"
  },
  {
    "id": "mt-22",
    "name": "Nguyễn Thị Lan",
    "code": "GV-NTL2",
    "position": "Thỉnh giảng",
    "department": "Khoa Công nghệ Thông tin"
  },
  {
    "id": "mt-23",
    "name": "Đào Thị Duyên",
    "code": "GV-DTD",
    "position": "Thỉnh giảng",
    "department": "Khoa Công nghệ Thông tin"
  },
  {
    "id": "mt-24",
    "name": "Trần Như Nguyện",
    "code": "GV-TNN",
    "position": "Thỉnh giảng",
    "department": "Khoa Công nghệ Thông tin"
  },
  {
    "id": "mt-25",
    "name": "Khoa Văn Hóa",
    "code": "DV-KVH",
    "position": "Cơ hữu",
    "department": "Khoa Văn Hóa"
  }
];

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
  "id": "sem-2026-hk1-cntt",
  "name": "Học kỳ 1 (2026 - 2027) - Khoa CNTT",
  "academicYear": "2026-2027",
  "startDate": "2026-09-07",
  "endDate": "2027-03-07",
  "startWeekNumber": 1,
  "isCurrent": true,
  "createdAt": "2026-10-05T05:54:28.491Z",
  "customColumns": [
    {
      "id": "col-room",
      "name": "Phòng học",
      "type": "text",
      "defaultValue": ""
    }
  ],
  "teachers": [
    {
      "id": "t-sem-mt-1",
      "name": "Nguyễn Thanh Phong",
      "code": "GV-NTP",
      "position": "Cơ hữu",
      "department": "Hiệu trưởng · Khoa Công nghệ Thông tin",
      "courses": [
        {
          "id": "c-19",
          "subjectName": "Cơ sở dữ liệu",
          "subjectCode": "COSODULI",
          "theoryHours": 0,
          "practiceHours": 35,
          "className": "LTMT25TH1",
          "credits": 1.5,
          "status": "Đang dạy",
          "completedHours": 0,
          "startDate": "2026-11-12",
          "hoursPerSession": 4,
          "customValues": {
            "col-room": "3.4"
          },
          "sessionsPerWeek": 2,
          "scheduleSlots": [
            "C5",
            "C6"
          ]
        }
      ]
    },
    {
      "id": "t-sem-mt-2",
      "name": "Lương Xuân Quang",
      "code": "GV-LXQ",
      "position": "Cơ hữu",
      "department": "Phòng ĐT&ĐBCL · Khoa CNTT",
      "courses": [
        {
          "id": "c-69",
          "subjectName": "Tin học căn bản",
          "subjectCode": "TINHOCCA",
          "theoryHours": 15,
          "practiceHours": 30,
          "className": "VTHC26TH1",
          "credits": 1.5,
          "status": "Đang dạy",
          "completedHours": 0,
          "startDate": "2026-09-07",
          "hoursPerSession": 4,
          "customValues": {
            "col-room": "2.6"
          },
          "sessionsPerWeek": 1,
          "scheduleSlots": []
        },
        {
          "id": "c-70",
          "subjectName": "Tin học căn bản",
          "subjectCode": "TINHOCCA",
          "theoryHours": 15,
          "practiceHours": 30,
          "className": "VTHC26TH2",
          "credits": 1.5,
          "status": "Đang dạy",
          "completedHours": 0,
          "startDate": "2026-09-07",
          "hoursPerSession": 4,
          "customValues": {
            "col-room": "2.6"
          },
          "sessionsPerWeek": 1,
          "scheduleSlots": []
        }
      ]
    },
    {
      "id": "t-sem-mt-3",
      "name": "Lê Quang Ái",
      "code": "GV-LQA",
      "position": "Cơ hữu",
      "department": "Trưởng Khoa · Khoa Công nghệ Thông tin",
      "courses": [
        {
          "id": "c-2",
          "subjectName": "Lập trình Window",
          "subjectCode": "LAPTRINH",
          "theoryHours": 45,
          "practiceHours": 105,
          "className": "LTMT24TH1",
          "credits": 5,
          "status": "Đang dạy",
          "completedHours": 0,
          "startDate": "2026-09-07",
          "hoursPerSession": 4,
          "customValues": {
            "col-room": "3.6"
          },
          "sessionsPerWeek": 4,
          "scheduleSlots": [
            "S2",
            "C2",
            "S3",
            "C3"
          ]
        },
        {
          "id": "c-31",
          "subjectName": "Mạng máy tính",
          "subjectCode": "MANGMAYT",
          "theoryHours": 30,
          "practiceHours": 45,
          "className": "QTM25TH1",
          "credits": 2.5,
          "status": "Đang dạy",
          "completedHours": 0,
          "startDate": "2026-09-11",
          "hoursPerSession": 4,
          "customValues": {
            "col-room": "3.6"
          },
          "sessionsPerWeek": 2,
          "scheduleSlots": [
            "C6",
            "C7"
          ]
        },
        {
          "id": "c-32",
          "subjectName": "Mạng máy tính",
          "subjectCode": "MANGMAYT",
          "theoryHours": 30,
          "practiceHours": 45,
          "className": "QTM25TH2",
          "credits": 2.5,
          "status": "Đang dạy",
          "completedHours": 0,
          "startDate": "2026-09-11",
          "hoursPerSession": 4,
          "customValues": {
            "col-room": "3.6"
          },
          "sessionsPerWeek": 2,
          "scheduleSlots": [
            "S6",
            "S7"
          ]
        }
      ]
    },
    {
      "id": "t-sem-mt-4",
      "name": "Nguyễn Tấn Đức",
      "code": "GV-NTD",
      "position": "Cơ hữu",
      "department": "Khoa Công nghệ Thông tin",
      "courses": [
        {
          "id": "c-11",
          "subjectName": "An toàn VSCN",
          "subjectCode": "ANTOANVS",
          "theoryHours": 30,
          "practiceHours": 0,
          "className": "QTM24TH1",
          "credits": 1,
          "status": "Đang dạy",
          "completedHours": 0,
          "startDate": "2026-09-09",
          "hoursPerSession": 4,
          "customValues": {
            "col-room": "4.4"
          },
          "sessionsPerWeek": 1,
          "scheduleSlots": [
            "S4"
          ]
        },
        {
          "id": "c-17",
          "subjectName": "Lập trình hướng đối tượng",
          "subjectCode": "LAPTRINH",
          "theoryHours": 30,
          "practiceHours": 45,
          "className": "LTMT25TH1",
          "credits": 2.5,
          "status": "Đang dạy",
          "completedHours": 0,
          "startDate": "2026-09-11",
          "hoursPerSession": 4,
          "customValues": {
            "col-room": "4.5"
          },
          "sessionsPerWeek": 2,
          "scheduleSlots": [
            "S6",
            "C6"
          ]
        },
        {
          "id": "c-21",
          "subjectName": "Lắp ráp cài đặt máy tính",
          "subjectCode": "LAPRAPCA",
          "theoryHours": 30,
          "practiceHours": 60,
          "className": "CNTT25TH1",
          "credits": 3,
          "status": "Đang dạy",
          "completedHours": 0,
          "startDate": "2026-09-10",
          "hoursPerSession": 4,
          "customValues": {
            "col-room": "4.4"
          },
          "sessionsPerWeek": 2,
          "scheduleSlots": [
            "S5",
            "S7"
          ]
        },
        {
          "id": "c-49",
          "subjectName": "Tin học căn bản",
          "subjectCode": "TINHOCCA",
          "theoryHours": 15,
          "practiceHours": 30,
          "className": "CNTT26TH2",
          "credits": 1.5,
          "status": "Đang dạy",
          "completedHours": 0,
          "startDate": "2026-11-06",
          "sessionsPerWeek": 1,
          "hoursPerSession": 4,
          "scheduleSlots": [
            "S6"
          ],
          "mergeRemainderHours": true,
          "customValues": {
            "col-room": "4.5"
          },
        },
        {
          "id": "c-65",
          "subjectName": "Tin học căn bản",
          "subjectCode": "TINHOCCA",
          "theoryHours": 15,
          "practiceHours": 0,
          "className": "CĐT26TH1",
          "credits": 1.5,
          "status": "Đang dạy",
          "completedHours": 0,
          "startDate": "2026-11-26",
          "hoursPerSession": 4,
          "customValues": {
            "col-room": "4.5"
          },
          "sessionsPerWeek": 2,
          "scheduleSlots": [
            "S5",
            "C5"
          ]
        },
        {
          "id": "c-68",
          "subjectName": "Tin học căn bản",
          "subjectCode": "TINHOCCA",
          "theoryHours": 15,
          "practiceHours": 30,
          "className": "CĐT26TH4",
          "credits": 1.5,
          "status": "Đang dạy",
          "completedHours": 0,
          "startDate": "2026-11-13",
          "hoursPerSession": 4,
          "customValues": {
            "col-room": "4.5"
          },
          "sessionsPerWeek": 1,
          "scheduleSlots": [
            "C6"
          ]
        },
        {
          "id": "c-73",
          "subjectName": "Chủ nhiệm lớp QTM24TH",
          "subjectCode": "CN-LOP",
          "theoryHours": 67.5,
          "practiceHours": 0,
          "className": "QTM24TH1",
          "credits": 2,
          "status": "Đang dạy",
          "completedHours": 0,
          "startDate": "2026-09-07",
          "hoursPerSession": 4,
          "customValues": {
            "col-room": "Phòng BM"
          }
        }
      ]
    },
    {
      "id": "t-sem-mt-5",
      "name": "Bùi Đức Tuấn",
      "code": "GV-BDT",
      "position": "Cơ hữu",
      "department": "Phó Trưởng Khoa · Khoa Công nghệ Thông tin",
      "courses": [
        {
          "id": "c-3",
          "subjectName": "Lập trình Web",
          "subjectCode": "LAPTRINH",
          "theoryHours": 45,
          "practiceHours": 75,
          "className": "LTMT24TH1",
          "credits": 4,
          "status": "Đang dạy",
          "completedHours": 0,
          "startDate": "2026-11-09",
          "hoursPerSession": 4,
          "customValues": {
            "col-room": "3.7"
          },
          "sessionsPerWeek": 6,
          "scheduleSlots": [
            "S2",
            "C2",
            "S3",
            "C3",
            "S4",
            "C4"
          ]
        },
        {
          "id": "c-8",
          "subjectName": "Thiết kế Web",
          "subjectCode": "THIETKEW",
          "theoryHours": 20,
          "practiceHours": 0,
          "className": "CNTT24TH1",
          "credits": 1,
          "status": "Đang dạy",
          "completedHours": 0,
          "startDate": "2026-09-07",
          "hoursPerSession": 4,
          "customValues": {
            "col-room": "3.7"
          },
          "sessionsPerWeek": 3,
          "scheduleSlots": [
            "C2",
            "C3",
            "C4"
          ]
        },
        {
          "id": "c-10",
          "subjectName": "Thiết kế Web",
          "subjectCode": "THIETKEW",
          "theoryHours": 30,
          "practiceHours": 75,
          "className": "CNTT24TH2",
          "credits": 1,
          "status": "Đang dạy",
          "completedHours": 0,
          "startDate": "2026-09-07",
          "hoursPerSession": 4,
          "customValues": {
            "col-room": "3.7"
          },
          "sessionsPerWeek": 3,
          "scheduleSlots": [
            "S2",
            "S3",
            "S4"
          ]
        },
        {
          "id": "c-74",
          "subjectName": "Chủ nhiệm lớp CNTT25TH",
          "subjectCode": "CN-LOP",
          "theoryHours": 67.5,
          "practiceHours": 0,
          "className": "CNTT25TH1",
          "credits": 2,
          "status": "Đang dạy",
          "completedHours": 0,
          "startDate": "2026-09-07",
          "hoursPerSession": 4,
          "customValues": {
            "col-room": "Phòng BM"
          }
        }
      ]
    },
    {
      "id": "t-sem-mt-6",
      "name": "Trần Đào Minh Hải",
      "code": "GV-TDMH",
      "position": "Cơ hữu",
      "department": "Khoa Công nghệ Thông tin",
      "courses": [
        {
          "id": "c-6",
          "subjectName": "Lập trình Window",
          "subjectCode": "LAPTRINH",
          "theoryHours": 45,
          "practiceHours": 75,
          "className": "CNTT24TH1",
          "credits": 5,
          "status": "Đang dạy",
          "completedHours": 0,
          "startDate": "2026-09-07",
          "hoursPerSession": 4,
          "customValues": {
            "col-room": "3.4"
          },
          "sessionsPerWeek": 3,
          "scheduleSlots": [
            "S2",
            "S3",
            "S4"
          ]
        },
        {
          "id": "c-18",
          "subjectName": "Cơ sở dữ liệu",
          "subjectCode": "COSODULI",
          "theoryHours": 30,
          "practiceHours": 10,
          "className": "LTMT25TH1",
          "credits": 1.5,
          "status": "Đang dạy",
          "completedHours": 0,
          "startDate": "2026-11-12",
          "hoursPerSession": 4,
          "customValues": {
            "col-room": "3.4"
          },
          "sessionsPerWeek": 2,
          "scheduleSlots": [
            "S5",
            "S6"
          ]
        },
        {
          "id": "c-33",
          "subjectName": "Cơ sở dữ liệu",
          "subjectCode": "COSODULI",
          "theoryHours": 30,
          "practiceHours": 45,
          "className": "QTM25TH1",
          "credits": 1.5,
          "status": "Đang dạy",
          "completedHours": 0,
          "startDate": "2026-09-10",
          "hoursPerSession": 4,
          "customValues": {
            "col-room": "3.4"
          },
          "sessionsPerWeek": 2,
          "scheduleSlots": [
            "S5",
            "S6"
          ]
        },
        {
          "id": "c-34",
          "subjectName": "Cơ sở dữ liệu",
          "subjectCode": "COSODULI",
          "theoryHours": 20,
          "practiceHours": 45,
          "className": "QTM25TH2",
          "credits": 1.5,
          "status": "Đang dạy",
          "completedHours": 0,
          "startDate": "2026-09-10",
          "hoursPerSession": 4,
          "customValues": {
            "col-room": "3.4"
          },
          "sessionsPerWeek": 2,
          "scheduleSlots": [
            "C5",
            "C6"
          ]
        },
        {
          "id": "c-72",
          "subjectName": "Chủ nhiệm lớp LTMT24TH",
          "subjectCode": "CN-LOP",
          "theoryHours": 67.5,
          "practiceHours": 0,
          "className": "LTMT24TH1",
          "credits": 2,
          "status": "Đang dạy",
          "completedHours": 0,
          "startDate": "2026-09-07",
          "hoursPerSession": 4,
          "customValues": {
            "col-room": "Phòng BM"
          }
        }
      ]
    },
    {
      "id": "t-sem-mt-7",
      "name": "Phạm Thị Duyên",
      "code": "GV-PTD",
      "position": "Thỉnh giảng",
      "department": "Khoa Công nghệ Thông tin",
      "courses": [
        {
          "id": "c-14",
          "subjectName": "Đồ hoạ ứng dụng",
          "subjectCode": "OHOAUNGD",
          "theoryHours": 15,
          "practiceHours": 30,
          "className": "QTM24TH1",
          "credits": 1.5,
          "status": "Đang dạy",
          "completedHours": 0,
          "startDate": "2026-09-08",
          "hoursPerSession": 4,
          "customValues": {
            "col-room": "4.5"
          },
          "sessionsPerWeek": 1,
          "scheduleSlots": [
            "C3"
          ]
        },
        {
          "id": "c-16",
          "subjectName": "Mạng căn bản",
          "subjectCode": "MANGCANB",
          "theoryHours": 30,
          "practiceHours": 30,
          "className": "LTMT25TH1",
          "credits": 2,
          "status": "Đang dạy",
          "completedHours": 0,
          "startDate": "2026-09-10",
          "hoursPerSession": 4,
          "customValues": {
            "col-room": "3.6"
          },
          "sessionsPerWeek": 2,
          "scheduleSlots": [
            "S5",
            "C5"
          ]
        },
        {
          "id": "c-20",
          "subjectName": "Đồ họa ứng dụng",
          "subjectCode": "OHOAUNGD",
          "theoryHours": 45,
          "practiceHours": 75,
          "className": "LTMT25TH1",
          "credits": 4,
          "status": "Đang dạy",
          "completedHours": 0,
          "startDate": "2026-09-12",
          "hoursPerSession": 4,
          "customValues": {
            "col-room": "4.5"
          },
          "sessionsPerWeek": 2,
          "scheduleSlots": [
            "S7",
            "C7"
          ]
        },
        {
          "id": "c-36",
          "subjectName": "Hệ quản trị CSDL SQL",
          "subjectCode": "HEQUANTR",
          "theoryHours": 30,
          "practiceHours": 45,
          "className": "QTM25TH1",
          "credits": 2.5,
          "status": "Đang dạy",
          "completedHours": 0,
          "startDate": "2026-11-12",
          "hoursPerSession": 4,
          "customValues": {
            "col-room": "3.6"
          },
          "sessionsPerWeek": 2,
          "scheduleSlots": [
            "S5",
            "S6"
          ]
        }
      ]
    },
    {
      "id": "t-sem-mt-8",
      "name": "Trần Khắc Sâm",
      "code": "GV-TKS",
      "position": "Thỉnh giảng",
      "department": "Khoa Công nghệ Thông tin",
      "courses": [
        {
          "id": "c-4",
          "subjectName": "Hệ quản trị CSDL MS Access",
          "subjectCode": "HEQUANTR",
          "theoryHours": 30,
          "practiceHours": 75,
          "className": "CNTT24TH1",
          "credits": 3.5,
          "status": "Đang dạy",
          "completedHours": 0,
          "startDate": "2026-11-16",
          "hoursPerSession": 4,
          "customValues": {
            "col-room": "3.6"
          },
          "sessionsPerWeek": 3,
          "scheduleSlots": [
            "S2",
            "S3",
            "S4"
          ]
        },
        {
          "id": "c-5",
          "subjectName": "Hệ quản trị CSDL MS Access",
          "subjectCode": "HEQUANTR",
          "theoryHours": 30,
          "practiceHours": 75,
          "className": "CNTT24TH2",
          "credits": 3.5,
          "status": "Đang dạy",
          "completedHours": 0,
          "startDate": "2026-11-16",
          "hoursPerSession": 4,
          "customValues": {
            "col-room": "3.6"
          },
          "sessionsPerWeek": 3,
          "scheduleSlots": [
            "C2",
            "C3",
            "C4"
          ]
        }
      ]
    },
    {
      "id": "t-sem-mt-9",
      "name": "Võ Triệu Bảo",
      "code": "GV-VTB",
      "position": "Thỉnh giảng",
      "department": "Khoa Công nghệ Thông tin",
      "courses": [
        {
          "id": "c-7",
          "subjectName": "Lập trình Window",
          "subjectCode": "LAPTRINH",
          "theoryHours": 45,
          "practiceHours": 75,
          "className": "CNTT24TH2",
          "credits": 5,
          "status": "Đang dạy",
          "completedHours": 0,
          "startDate": "2026-09-07",
          "hoursPerSession": 4,
          "customValues": {
            "col-room": "3.4"
          },
          "sessionsPerWeek": 3,
          "scheduleSlots": [
            "C2",
            "C3",
            "C4"
          ]
        },
        {
          "id": "c-12",
          "subjectName": "QTHT WebServer và MailServer",
          "subjectCode": "QTHTWEBS",
          "theoryHours": 40,
          "practiceHours": 65,
          "className": "QTM24TH1",
          "credits": 3.5,
          "status": "Đang dạy",
          "completedHours": 0,
          "startDate": "2026-11-23",
          "hoursPerSession": 4,
          "customValues": {
            "col-room": "3.4"
          },
          "sessionsPerWeek": 3,
          "scheduleSlots": [
            "S2",
            "S3",
            "S4"
          ]
        },
        {
          "id": "c-35",
          "subjectName": "Cơ sở dữ liệu",
          "subjectCode": "COSODULI",
          "theoryHours": 10,
          "practiceHours": 0,
          "className": "QTM25TH2",
          "credits": 1.5,
          "status": "Đang dạy",
          "completedHours": 0,
          "startDate": "2026-09-10",
          "hoursPerSession": 4,
          "customValues": {
            "col-room": "3.4"
          },
          "sessionsPerWeek": 2,
          "scheduleSlots": [
            "C5",
            "C6"
          ]
        }
      ]
    },
    {
      "id": "t-sem-mt-10",
      "name": "Lê Phạm Bá Học",
      "code": "GV-LPBH",
      "position": "Thỉnh giảng",
      "department": "Khoa Công nghệ Thông tin",
      "courses": [
        {
          "id": "c-43",
          "subjectName": "Tin học căn bản",
          "subjectCode": "TINHOCCA",
          "theoryHours": 15,
          "practiceHours": 30,
          "className": "LTMT26TH2",
          "credits": 1.5,
          "status": "Đang dạy",
          "completedHours": 0,
          "startDate": "2026-09-12",
          "hoursPerSession": 4,
          "customValues": {
            "col-room": "2.6"
          },
          "sessionsPerWeek": 1,
          "scheduleSlots": [
            "S7"
          ]
        },
        {
          "id": "c-44",
          "subjectName": "Tin học Mos",
          "subjectCode": "TINHOCMO",
          "theoryHours": 15,
          "practiceHours": 45,
          "className": "LTMT26TH1",
          "credits": 2,
          "status": "Đang dạy",
          "completedHours": 0,
          "startDate": "2026-09-12",
          "hoursPerSession": 4,
          "customValues": {
            "col-room": "2.6"
          },
          "sessionsPerWeek": 1,
          "scheduleSlots": [
            "C7"
          ]
        },
        {
          "id": "c-48",
          "subjectName": "Tin học căn bản",
          "subjectCode": "TINHOCCA",
          "theoryHours": 15,
          "practiceHours": 30,
          "className": "CNTT26TH1",
          "credits": 1.5,
          "status": "Đang dạy",
          "completedHours": 0,
          "startDate": "2026-09-11",
          "sessionsPerWeek": 1,
          "hoursPerSession": 4,
          "scheduleSlots": [
            "S6"
          ],
          "mergeRemainderHours": true,
          "customValues": {
            "col-room": "2.6"
          },
        },
        {
          "id": "c-55",
          "subjectName": "Tin học Mos",
          "subjectCode": "TINHOCMO",
          "theoryHours": 15,
          "practiceHours": 45,
          "className": "CNTT26TH2",
          "credits": 2,
          "status": "Đang dạy",
          "completedHours": 0,
          "startDate": "2026-09-11",
          "sessionsPerWeek": 1,
          "hoursPerSession": 4,
          "scheduleSlots": [
            "C6"
          ],
          "mergeRemainderHours": true,
          "customValues": {
            "col-room": "2.6"
          },
        },
        {
          "id": "c-56",
          "subjectName": "Kỹ thuật lập trình",
          "subjectCode": "KYTHUATL",
          "theoryHours": 30,
          "practiceHours": 30,
          "className": "CNTT26TH1",
          "credits": 2,
          "status": "Đang dạy",
          "completedHours": 0,
          "startDate": "2026-09-10",
          "sessionsPerWeek": 1,
          "hoursPerSession": 4,
          "scheduleSlots": [
            "C5"
          ],
          "mergeRemainderHours": true,
          "customValues": {
            "col-room": "3.5"
          },
        },
        {
          "id": "c-66",
          "subjectName": "Tin học căn bản",
          "subjectCode": "TINHOCCA",
          "theoryHours": 15,
          "practiceHours": 30,
          "className": "CĐT26TH2",
          "credits": 1.5,
          "status": "Đang dạy",
          "completedHours": 0,
          "startDate": "2026-09-10",
          "hoursPerSession": 4,
          "customValues": {
            "col-room": "2.6"
          },
          "sessionsPerWeek": 1,
          "scheduleSlots": [
            "S5"
          ]
        }
      ]
    },
    {
      "id": "t-sem-mt-11",
      "name": "Nguyễn Thị Tuyết Anh",
      "code": "GV-NTTA",
      "position": "Thỉnh giảng",
      "department": "Khoa Công nghệ Thông tin",
      "courses": [
        {
          "id": "c-1",
          "subjectName": "HQT CSDL(MS SQL Server)",
          "subjectCode": "HQTCSDLM",
          "theoryHours": 30,
          "practiceHours": 45,
          "className": "LTMT24TH1",
          "credits": 2.5,
          "status": "Đang dạy",
          "completedHours": 0,
          "startDate": "2026-09-09",
          "hoursPerSession": 4,
          "customValues": {
            "col-room": "2.6"
          },
          "sessionsPerWeek": 2,
          "scheduleSlots": [
            "S4",
            "C4"
          ]
        },
        {
          "id": "c-15",
          "subjectName": "Lập trình trực quan Access",
          "subjectCode": "LAPTRINH",
          "theoryHours": 30,
          "practiceHours": 90,
          "className": "QTM24TH1",
          "credits": 4,
          "status": "Đang dạy",
          "completedHours": 0,
          "startDate": "2026-11-24",
          "hoursPerSession": 4,
          "customValues": {
            "col-room": "2.6"
          },
          "sessionsPerWeek": 4,
          "scheduleSlots": [
            "S3",
            "C3",
            "S4",
            "C4"
          ]
        }
      ]
    },
    {
      "id": "t-sem-mt-12",
      "name": "Đào Thụy Hạ Quyên",
      "code": "GV-DTHQ",
      "position": "Thỉnh giảng",
      "department": "Khoa Công nghệ Thông tin",
      "courses": [
        {
          "id": "c-42",
          "subjectName": "Tin học căn bản",
          "subjectCode": "TINHOCCA",
          "theoryHours": 15,
          "practiceHours": 30,
          "className": "LTMT26TH1",
          "credits": 1.5,
          "status": "Đang dạy",
          "completedHours": 0,
          "startDate": "2026-09-12",
          "hoursPerSession": 4,
          "customValues": {
            "col-room": "3.5"
          },
          "sessionsPerWeek": 1,
          "scheduleSlots": [
            "S7"
          ]
        },
        {
          "id": "c-45",
          "subjectName": "Tin học Mos",
          "subjectCode": "TINHOCMO",
          "theoryHours": 15,
          "practiceHours": 45,
          "className": "LTMT26TH2",
          "credits": 2,
          "status": "Đang dạy",
          "completedHours": 0,
          "startDate": "2026-09-11",
          "hoursPerSession": 4,
          "customValues": {
            "col-room": "3.5"
          },
          "sessionsPerWeek": 1,
          "scheduleSlots": [
            "C6"
          ]
        },
        {
          "id": "c-53",
          "subjectName": "Cấu trúc dữ liệu và giải thuật",
          "subjectCode": "CAUTRUCD",
          "theoryHours": 30,
          "practiceHours": 45,
          "className": "CNTT26TH2",
          "credits": 2.5,
          "status": "Đang dạy",
          "completedHours": 0,
          "startDate": "2026-09-10",
          "sessionsPerWeek": 1,
          "hoursPerSession": 4,
          "scheduleSlots": [
            "C5"
          ],
          "mergeRemainderHours": true,
          "customValues": {
            "col-room": "2.6"
          },
        }
      ]
    },
    {
      "id": "t-sem-mt-13",
      "name": "Đỗ Văn Thiện",
      "code": "GV-DVT",
      "position": "Thỉnh giảng",
      "department": "Khoa Công nghệ Thông tin",
      "courses": [
        {
          "id": "c-9",
          "subjectName": "Thiết kế Web",
          "subjectCode": "THIETKEW",
          "theoryHours": 10,
          "practiceHours": 75,
          "className": "CNTT24TH1",
          "credits": 1,
          "status": "Đang dạy",
          "completedHours": 0,
          "startDate": "2026-09-07",
          "hoursPerSession": 4,
          "customValues": {
            "col-room": "3.7"
          },
          "sessionsPerWeek": 3,
          "scheduleSlots": [
            "C2",
            "C3",
            "C4"
          ]
        },
        {
          "id": "c-25",
          "subjectName": "Lập trình HĐT  (Console)",
          "subjectCode": "LAPTRINH",
          "theoryHours": 30,
          "practiceHours": 30,
          "className": "CNTT25TH1",
          "credits": 2,
          "status": "Đang dạy",
          "completedHours": 0,
          "startDate": "2026-11-12",
          "hoursPerSession": 4,
          "customValues": {
            "col-room": "3.7"
          },
          "sessionsPerWeek": 3,
          "scheduleSlots": [
            "S5",
            "S6",
            "S7"
          ]
        },
        {
          "id": "c-26",
          "subjectName": "Lập trình HĐT  (Console)",
          "subjectCode": "LAPTRINH",
          "theoryHours": 30,
          "practiceHours": 30,
          "className": "CNTT25TH2",
          "credits": 2,
          "status": "Đang dạy",
          "completedHours": 0,
          "startDate": "2026-11-12",
          "hoursPerSession": 4,
          "customValues": {
            "col-room": "3.7"
          },
          "sessionsPerWeek": 3,
          "scheduleSlots": [
            "C5",
            "C6",
            "C7"
          ]
        }
      ]
    },
    {
      "id": "t-sem-mt-14",
      "name": "Nguyễn Thành Lộc",
      "code": "GV-NTL",
      "position": "Thỉnh giảng",
      "department": "Khoa Công nghệ Thông tin",
      "courses": [
        {
          "id": "c-13",
          "subjectName": "An toàn mạng",
          "subjectCode": "ANTOANMA",
          "theoryHours": 30,
          "practiceHours": 30,
          "className": "QTM24TH1",
          "credits": 2,
          "status": "Đang dạy",
          "completedHours": 0,
          "startDate": "2026-09-07",
          "hoursPerSession": 4,
          "customValues": {
            "col-room": "4.4"
          },
          "sessionsPerWeek": 2,
          "scheduleSlots": [
            "C2",
            "C4"
          ]
        },
        {
          "id": "c-50",
          "subjectName": "Lắp ráp cài đặt máy tính",
          "subjectCode": "LAPRAPCA",
          "theoryHours": 30,
          "practiceHours": 45,
          "className": "CNTT26TH1",
          "credits": 3,
          "status": "Đang dạy",
          "completedHours": 0,
          "startDate": "2026-12-24",
          "sessionsPerWeek": 4,
          "hoursPerSession": 4,
          "scheduleSlots": [
            "S5",
            "C5",
            "S6",
            "C6"
          ],
          "mergeRemainderHours": true,
          "customValues": {
            "col-room": "4.10"
          },
        },
        {
          "id": "c-58",
          "subjectName": "Tin học căn bản",
          "subjectCode": "TINHOCCA",
          "theoryHours": 15,
          "practiceHours": 30,
          "className": "QTM26TH1",
          "credits": 1.5,
          "status": "Đang dạy",
          "completedHours": 0,
          "startDate": "2026-09-11",
          "hoursPerSession": 4,
          "customValues": {
            "col-room": "3.5"
          },
          "sessionsPerWeek": 1,
          "scheduleSlots": [
            "S6"
          ]
        },
        {
          "id": "c-59",
          "subjectName": "Tin học căn bản",
          "subjectCode": "TINHOCCA",
          "theoryHours": 15,
          "practiceHours": 30,
          "className": "QTM26TH2",
          "credits": 1.5,
          "status": "Đang dạy",
          "completedHours": 0,
          "startDate": "2026-09-11",
          "hoursPerSession": 4,
          "customValues": {
            "col-room": "3.7"
          },
          "sessionsPerWeek": 1,
          "scheduleSlots": [
            "C6"
          ]
        },
        {
          "id": "c-61",
          "subjectName": "Tin học Mos",
          "subjectCode": "TINHOCMO",
          "theoryHours": 15,
          "practiceHours": 45,
          "className": "QTM26TH2",
          "credits": 2,
          "status": "Đang dạy",
          "completedHours": 0,
          "startDate": "2026-09-12",
          "hoursPerSession": 4,
          "customValues": {
            "col-room": "4.10"
          },
          "sessionsPerWeek": 2,
          "scheduleSlots": [
            "S7",
            "C7"
          ]
        },
        {
          "id": "c-67",
          "subjectName": "Tin học căn bản",
          "subjectCode": "TINHOCCA",
          "theoryHours": 15,
          "practiceHours": 30,
          "className": "CĐT26TH3",
          "credits": 1.5,
          "status": "Đang dạy",
          "completedHours": 0,
          "startDate": "2026-11-07",
          "hoursPerSession": 4,
          "customValues": {
            "col-room": "2.6"
          },
          "sessionsPerWeek": 1,
          "scheduleSlots": [
            "S7"
          ]
        },
        {
          "id": "c-75",
          "subjectName": "Chủ nhiệm lớp LTMT25TH",
          "subjectCode": "CN-LOP",
          "theoryHours": 67.5,
          "practiceHours": 0,
          "className": "LTMT25TH1",
          "credits": 2,
          "status": "Đang dạy",
          "completedHours": 0,
          "startDate": "2026-09-07",
          "hoursPerSession": 4,
          "customValues": {
            "col-room": "Phòng BM"
          }
        }
      ]
    },
    {
      "id": "t-sem-mt-15",
      "name": "Vũ Thị Hạnh",
      "code": "GV-VTH",
      "position": "Thỉnh giảng",
      "department": "Khoa Công nghệ Thông tin",
      "courses": [
        {
          "id": "c-47",
          "subjectName": "Kỹ thuật lập trình",
          "subjectCode": "KYTHUATL",
          "theoryHours": 30,
          "practiceHours": 30,
          "className": "LTMT26TH2",
          "credits": 2,
          "status": "Đang dạy",
          "completedHours": 0,
          "startDate": "2026-11-07",
          "hoursPerSession": 4,
          "customValues": {
            "col-room": "3.8"
          },
          "sessionsPerWeek": 1,
          "scheduleSlots": [
            "C7"
          ],
          "schedulePhases": [
            {
              "id": "phase-c47-1",
              "fromDate": "2026-11-28",
              "scheduleSlots": [
                "S7",
                "C7"
              ],
              "hoursPerSession": 4,
              "note": "Từ tuần 12 đổi sang dạy cả Sáng + Chiều Thứ 7 (SC7)"
            }
          ]
        },
        {
          "id": "c-60",
          "subjectName": "Tin học Mos",
          "subjectCode": "TINHOCMO",
          "theoryHours": 15,
          "practiceHours": 45,
          "className": "QTM26TH1",
          "credits": 2,
          "status": "Đang dạy",
          "completedHours": 0,
          "startDate": "2026-09-12",
          "hoursPerSession": 4,
          "customValues": {
            "col-room": "3.5"
          },
          "sessionsPerWeek": 2,
          "scheduleSlots": [
            "S7",
            "C7"
          ]
        }
      ]
    },
    {
      "id": "t-sem-mt-16",
      "name": "Cao Thị Hồng Sanh",
      "code": "GV-CTHS",
      "position": "Thỉnh giảng",
      "department": "Khoa Công nghệ Thông tin",
      "courses": [
        {
          "id": "c-27",
          "subjectName": "Nguyên lý hệ điều hành",
          "subjectCode": "NGUYENLY",
          "theoryHours": 30,
          "practiceHours": 45,
          "className": "CNTT25TH1",
          "credits": 2.5,
          "status": "Đang dạy",
          "completedHours": 0,
          "startDate": "2026-11-12",
          "hoursPerSession": 4,
          "customValues": {
            "col-room": "4.4"
          },
          "sessionsPerWeek": 3,
          "scheduleSlots": [
            "C5",
            "C6",
            "C7"
          ]
        },
        {
          "id": "c-28",
          "subjectName": "Nguyên lý hệ điều hành",
          "subjectCode": "NGUYENLY",
          "theoryHours": 30,
          "practiceHours": 45,
          "className": "CNTT25TH2",
          "credits": 2.5,
          "status": "Đang dạy",
          "completedHours": 0,
          "startDate": "2026-11-12",
          "hoursPerSession": 4,
          "customValues": {
            "col-room": "4.4"
          },
          "sessionsPerWeek": 3,
          "scheduleSlots": [
            "S5",
            "S6",
            "S7"
          ]
        }
      ]
    },
    {
      "id": "t-sem-mt-17",
      "name": "Trần Văn Đại",
      "code": "GV-TVD",
      "position": "Thỉnh giảng",
      "department": "Khoa Công nghệ Thông tin",
      "courses": [
        {
          "id": "c-22",
          "subjectName": "Lắp ráp cài đặt máy tính",
          "subjectCode": "LAPRAPCA",
          "theoryHours": 30,
          "practiceHours": 60,
          "className": "CNTT25TH2",
          "credits": 3,
          "status": "Đang dạy",
          "completedHours": 0,
          "startDate": "2026-09-10",
          "hoursPerSession": 4,
          "customValues": {
            "col-room": "4.4"
          },
          "sessionsPerWeek": 2,
          "scheduleSlots": [
            "C5",
            "C7"
          ]
        },
        {
          "id": "c-51",
          "subjectName": "Lắp ráp cài đặt máy tính",
          "subjectCode": "LAPRAPCA",
          "theoryHours": 30,
          "practiceHours": 45,
          "className": "CNTT26TH2",
          "credits": 3,
          "status": "Đang dạy",
          "completedHours": 0,
          "startDate": "2026-11-28",
          "sessionsPerWeek": 2,
          "hoursPerSession": 4,
          "scheduleSlots": [
            "S7",
            "C7"
          ],
          "mergeRemainderHours": true,
          "customValues": {
            "col-room": "4.10"
          },
        },
        {
          "id": "c-64",
          "subjectName": "Tin học căn bản",
          "subjectCode": "TINHOCCA",
          "theoryHours": 0,
          "practiceHours": 30,
          "className": "CĐT26TH1",
          "credits": 1.5,
          "status": "Đang dạy",
          "completedHours": 0,
          "startDate": "2026-11-26",
          "hoursPerSession": 4,
          "customValues": {
            "col-room": "4.5"
          },
          "sessionsPerWeek": 2,
          "scheduleSlots": [
            "S5",
            "C5"
          ]
        }
      ]
    },
    {
      "id": "t-sem-mt-18",
      "name": "Trịnh Đình Thắng",
      "code": "GV-TDT",
      "position": "Thỉnh giảng",
      "department": "Khoa Công nghệ Thông tin",
      "courses": [
        {
          "id": "c-38",
          "subjectName": "Nguyên lý hệ điều hành",
          "subjectCode": "NGUYENLY",
          "theoryHours": 30,
          "practiceHours": 45,
          "className": "QTM25TH1",
          "credits": 2.5,
          "status": "Đang dạy",
          "completedHours": 0,
          "startDate": "2026-11-12",
          "hoursPerSession": 4,
          "customValues": {
            "col-room": "3.8"
          },
          "sessionsPerWeek": 3,
          "scheduleSlots": [
            "C5",
            "C6",
            "C7"
          ]
        }
      ]
    },
    {
      "id": "t-sem-mt-19",
      "name": "Võ Thị Kim Liên",
      "code": "GV-VTKL",
      "position": "Thỉnh giảng",
      "department": "Khoa Công nghệ Thông tin",
      "courses": [
        {
          "id": "c-37",
          "subjectName": "Hệ quản trị CSDL SQL",
          "subjectCode": "HEQUANTR",
          "theoryHours": 30,
          "practiceHours": 45,
          "className": "QTM25TH2",
          "credits": 2.5,
          "status": "Đang dạy",
          "completedHours": 0,
          "startDate": "2026-11-12",
          "hoursPerSession": 4,
          "customValues": {
            "col-room": "3.5"
          },
          "sessionsPerWeek": 2,
          "scheduleSlots": [
            "C5",
            "C6"
          ]
        },
        {
          "id": "c-39",
          "subjectName": "Nguyên lý hệ điều hành",
          "subjectCode": "NGUYENLY",
          "theoryHours": 30,
          "practiceHours": 45,
          "className": "QTM25TH2",
          "credits": 2.5,
          "status": "Đang dạy",
          "completedHours": 0,
          "startDate": "2026-11-12",
          "hoursPerSession": 4,
          "customValues": {
            "col-room": "3.8"
          },
          "sessionsPerWeek": 3,
          "scheduleSlots": [
            "S5",
            "S6",
            "S7"
          ]
        },
        {
          "id": "c-46",
          "subjectName": "Kỹ thuật lập trình",
          "subjectCode": "KYTHUATL",
          "theoryHours": 30,
          "practiceHours": 30,
          "className": "LTMT26TH1",
          "credits": 2,
          "status": "Đang dạy",
          "completedHours": 0,
          "startDate": "2026-09-11",
          "hoursPerSession": 4,
          "customValues": {
            "col-room": "4.4"
          },
          "sessionsPerWeek": 2,
          "scheduleSlots": [
            "S6",
            "C6"
          ]
        },
        {
          "id": "c-57",
          "subjectName": "Kỹ thuật lập trình",
          "subjectCode": "KYTHUATL",
          "theoryHours": 30,
          "practiceHours": 30,
          "className": "CNTT26TH2",
          "credits": 2,
          "status": "Đang dạy",
          "completedHours": 0,
          "startDate": "2026-09-12",
          "sessionsPerWeek": 2,
          "hoursPerSession": 4,
          "scheduleSlots": [
            "S7",
            "C7"
          ],
          "mergeRemainderHours": true,
          "customValues": {
            "col-room": "3.4"
          },
        },
        {
          "id": "c-62",
          "subjectName": "Kỹ thuật lập trình",
          "subjectCode": "KYTHUATL",
          "theoryHours": 30,
          "practiceHours": 30,
          "className": "QTM26TH1",
          "credits": 2,
          "status": "Đang dạy",
          "completedHours": 0,
          "startDate": "2026-11-07",
          "hoursPerSession": 4,
          "customValues": {
            "col-room": "4.15"
          },
          "sessionsPerWeek": 1,
          "scheduleSlots": [
            "C7"
          ],
          "schedulePhases": [
            {
              "id": "phase-c62-1",
              "fromDate": "2026-12-26",
              "scheduleSlots": [
                "S7",
                "C7"
              ],
              "hoursPerSession": 4,
              "note": "Từ tuần 16 đổi sang dạy cả Sáng + Chiều Thứ 7 (SC7)"
            }
          ]
        }
      ]
    },
    {
      "id": "t-sem-mt-20",
      "name": "Cao Hùng Thiên Bảo",
      "code": "GV-CHTB",
      "position": "Thỉnh giảng",
      "department": "Khoa Công nghệ Thông tin",
      "courses": [
        {
          "id": "c-23",
          "subjectName": "Cơ sở dữ liệu",
          "subjectCode": "COSODULI",
          "theoryHours": 30,
          "practiceHours": 45,
          "className": "CNTT25TH1",
          "credits": 1.5,
          "status": "Đang dạy",
          "completedHours": 0,
          "startDate": "2026-09-11",
          "hoursPerSession": 4,
          "customValues": {
            "col-room": "3.8"
          },
          "sessionsPerWeek": 2,
          "scheduleSlots": [
            "C6",
            "C7"
          ]
        },
        {
          "id": "c-24",
          "subjectName": "Cơ sở dữ liệu",
          "subjectCode": "COSODULI",
          "theoryHours": 30,
          "practiceHours": 45,
          "className": "CNTT25TH2",
          "credits": 1.5,
          "status": "Đang dạy",
          "completedHours": 0,
          "startDate": "2026-09-11",
          "hoursPerSession": 4,
          "customValues": {
            "col-room": "3.8"
          },
          "sessionsPerWeek": 2,
          "scheduleSlots": [
            "S6",
            "S7"
          ]
        },
        {
          "id": "c-52",
          "subjectName": "Cấu trúc dữ liệu và giải thuật",
          "subjectCode": "CAUTRUCD",
          "theoryHours": 30,
          "practiceHours": 45,
          "className": "CNTT26TH1",
          "credits": 2.5,
          "status": "Đang dạy",
          "completedHours": 0,
          "startDate": "2026-11-14",
          "sessionsPerWeek": 2,
          "hoursPerSession": 4,
          "scheduleSlots": [
            "S7",
            "C7"
          ],
          "mergeRemainderHours": true,
          "customValues": {
            "col-room": "4.4"
          },
        }
      ]
    },
    {
      "id": "t-sem-mt-21",
      "name": "Mai Hoài Vương Linh",
      "code": "GV-MHVL",
      "position": "Thỉnh giảng",
      "department": "Khoa Công nghệ Thông tin",
      "courses": [
        {
          "id": "c-76",
          "subjectName": "Chủ nhiệm lớp QTM25TH",
          "subjectCode": "CN-LOP",
          "theoryHours": 67.5,
          "practiceHours": 0,
          "className": "QTM25TH1",
          "credits": 2,
          "status": "Đang dạy",
          "completedHours": 0,
          "startDate": "2026-09-07",
          "hoursPerSession": 4,
          "customValues": {
            "col-room": "Phòng BM"
          }
        },
        {
          "id": "c-78",
          "subjectName": "Chủ nhiệm lớp LTMT26TH",
          "subjectCode": "CN-LOP",
          "theoryHours": 67.5,
          "practiceHours": 0,
          "className": "LTMT26TH1",
          "credits": 2,
          "status": "Đang dạy",
          "completedHours": 0,
          "startDate": "2026-09-07",
          "hoursPerSession": 4,
          "customValues": {
            "col-room": "Phòng BM"
          }
        }
      ]
    },
    {
      "id": "t-sem-mt-22",
      "name": "Nguyễn Thị Lan",
      "code": "GV-NTL2",
      "position": "Thỉnh giảng",
      "department": "Khoa Công nghệ Thông tin",
      "courses": [
        {
          "id": "c-71",
          "subjectName": "Chủ nhiệm lớp CNTT24TH",
          "subjectCode": "CN-LOP",
          "theoryHours": 67.5,
          "practiceHours": 0,
          "className": "CNTT24TH1",
          "credits": 2,
          "status": "Đang dạy",
          "completedHours": 0,
          "startDate": "2026-09-07",
          "hoursPerSession": 4,
          "customValues": {
            "col-room": "Phòng BM"
          }
        },
        {
          "id": "c-79",
          "subjectName": "Chủ nhiệm lớp QTM26TH",
          "subjectCode": "CN-LOP",
          "theoryHours": 67.5,
          "practiceHours": 0,
          "className": "QTM26TH1",
          "credits": 2,
          "status": "Đang dạy",
          "completedHours": 0,
          "startDate": "2026-09-07",
          "hoursPerSession": 4,
          "customValues": {
            "col-room": "Phòng BM"
          }
        }
      ]
    },
    {
      "id": "t-sem-mt-23",
      "name": "Đào Thị Duyên",
      "code": "GV-DTD",
      "position": "Thỉnh giảng",
      "department": "Khoa Công nghệ Thông tin",
      "courses": [
        {
          "id": "c-77",
          "subjectName": "Chủ nhiệm lớp CNTT26TH",
          "subjectCode": "CN-LOP",
          "theoryHours": 67.5,
          "practiceHours": 0,
          "className": "CNTT26TH1",
          "credits": 2,
          "status": "Đang dạy",
          "completedHours": 0,
          "startDate": "2026-09-07",
          "hoursPerSession": 4,
          "customValues": {
            "col-room": "Phòng BM"
          }
        },
        {
          "id": "c-80",
          "subjectName": "Chủ nhiệm lớp CNTT23TH",
          "subjectCode": "CN-LOP",
          "theoryHours": 59,
          "practiceHours": 0,
          "className": "CNTT23TH1",
          "credits": 2,
          "status": "Đang dạy",
          "completedHours": 0,
          "startDate": "2026-09-07",
          "hoursPerSession": 4,
          "customValues": {
            "col-room": "Phòng BM"
          }
        }
      ]
    },
    {
      "id": "t-sem-mt-24",
      "name": "Trần Như Nguyện",
      "code": "GV-TNN",
      "position": "Thỉnh giảng",
      "department": "Khoa Công nghệ Thông tin",
      "courses": [
        {
          "id": "c-54",
          "subjectName": "Tin học Mos",
          "subjectCode": "TINHOCMO",
          "theoryHours": 15,
          "practiceHours": 45,
          "className": "CNTT26TH1",
          "credits": 2,
          "status": "Đang dạy",
          "completedHours": 0,
          "startDate": "2026-09-11",
          "sessionsPerWeek": 1,
          "hoursPerSession": 4,
          "scheduleSlots": [
            "C6"
          ],
          "mergeRemainderHours": true,
          "customValues": {
            "col-room": "3.4"
          },
        },
        {
          "id": "c-63",
          "subjectName": "Kỹ thuật lập trình",
          "subjectCode": "KYTHUATL",
          "theoryHours": 30,
          "practiceHours": 30,
          "className": "QTM26TH2",
          "credits": 2,
          "status": "Đang dạy",
          "completedHours": 0,
          "startDate": "2026-09-11",
          "hoursPerSession": 4,
          "customValues": {
            "col-room": "3.8"
          },
          "sessionsPerWeek": 1,
          "scheduleSlots": [
            "S6"
          ]
        }
      ]
    },
    {
      "id": "t-sem-mt-25",
      "name": "Khoa Văn Hóa",
      "code": "DV-KVH",
      "position": "Cơ hữu",
      "department": "Khoa Văn Hóa",
      "courses": [
        {
          "id": "c-29",
          "subjectName": "Anh văn chuyên ngành",
          "subjectCode": "ANHVANCH",
          "theoryHours": 30,
          "practiceHours": 30,
          "className": "CNTT25TH1",
          "credits": 2,
          "status": "Đang dạy",
          "completedHours": 0,
          "startDate": "2026-09-07",
          "hoursPerSession": 4,
          "customValues": {
            "col-room": "VH"
          },
          "sessionsPerWeek": 1,
          "scheduleSlots": []
        },
        {
          "id": "c-30",
          "subjectName": "Anh văn chuyên ngành",
          "subjectCode": "ANHVANCH",
          "theoryHours": 30,
          "practiceHours": 30,
          "className": "CNTT25TH2",
          "credits": 2,
          "status": "Đang dạy",
          "completedHours": 0,
          "startDate": "2026-09-07",
          "hoursPerSession": 4,
          "customValues": {
            "col-room": "VH"
          },
          "sessionsPerWeek": 1,
          "scheduleSlots": []
        },
        {
          "id": "c-40",
          "subjectName": "Anh văn chuyên ngành",
          "subjectCode": "ANHVANCH",
          "theoryHours": 30,
          "practiceHours": 30,
          "className": "QTM25TH1",
          "credits": 2,
          "status": "Đang dạy",
          "completedHours": 0,
          "startDate": "2026-09-07",
          "hoursPerSession": 4,
          "customValues": {
            "col-room": "VH"
          },
          "sessionsPerWeek": 1,
          "scheduleSlots": []
        },
        {
          "id": "c-41",
          "subjectName": "Anh văn chuyên ngành",
          "subjectCode": "ANHVANCH",
          "theoryHours": 30,
          "practiceHours": 30,
          "className": "QTM25TH2",
          "credits": 2,
          "status": "Đang dạy",
          "completedHours": 0,
          "startDate": "2026-09-07",
          "hoursPerSession": 4,
          "customValues": {
            "col-room": "VH"
          },
          "sessionsPerWeek": 1,
          "scheduleSlots": []
        }
      ]
    }
  ]
}
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
