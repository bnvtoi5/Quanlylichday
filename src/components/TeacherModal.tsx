import React, { useEffect, useMemo, useState } from 'react';
import {
  Check,
  CheckCircle2,
  Plus,
  Search,
  Sparkles,
  User,
  UserCheck,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { MasterTeacher, Teacher, TeacherPosition } from '../types';

interface TeacherModalProps {
  isOpen: boolean;
  onClose: () => void;
  teacherToEdit: Teacher | null;
  semesterName: string;
  semesterTeachers: Teacher[];
  masterTeachers: MasterTeacher[];
  onAddMasterTeacherToSemester: (masterT: MasterTeacher) => void;
  onAddBatchMasterTeachersToSemester: (masterTs: MasterTeacher[]) => void;
  onSaveTeacher: (teacherData: {
    id?: string;
    name: string;
    code?: string;
    position: TeacherPosition;
    department?: string;
    email?: string;
    phone?: string;
    saveToMaster?: boolean;
  }) => void;
}

export const TeacherModal: React.FC<TeacherModalProps> = ({
  isOpen,
  onClose,
  teacherToEdit,
  semesterName,
  semesterTeachers,
  masterTeachers = [],
  onAddMasterTeacherToSemester,
  onAddBatchMasterTeachersToSemester,
  onSaveTeacher,
}) => {
  // Mode when adding new teacher: 'from_master' (choose existing) or 'manual' (type new)
  const [addMode, setAddMode] = useState<'from_master' | 'manual'>('from_master');

  // Search in master teachers
  const [catalogSearch, setCatalogSearch] = useState('');
  const [selectedMasterIds, setSelectedMasterIds] = useState<string[]>([]);

  // Form states for manual or edit
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [position, setPosition] = useState<TeacherPosition>('Cơ hữu');
  const [department, setDepartment] = useState('Hệ thống thông tin');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [saveToMaster, setSaveToMaster] = useState(true);

  // Set initial states when opening modal
  useEffect(() => {
    if (teacherToEdit) {
      setName(teacherToEdit.name);
      setCode(teacherToEdit.code || '');
      setPosition(teacherToEdit.position || 'Cơ hữu');
      setDepartment(teacherToEdit.department || 'Hệ thống thông tin');
      setEmail(teacherToEdit.email || '');
      setPhone(teacherToEdit.phone || '');
      setSaveToMaster(false);
    } else {
      setName('');
      setCode(`GV${Math.floor(100 + Math.random() * 900)}`);
      setPosition('Cơ hữu');
      setDepartment('Hệ thống thông tin');
      setEmail('');
      setPhone('');
      setSaveToMaster(true);
      setSelectedMasterIds([]);
      setCatalogSearch('');
      // Default to from_master if catalog has teachers, otherwise manual
      setAddMode(masterTeachers.length > 0 ? 'from_master' : 'manual');
    }
  }, [teacherToEdit, isOpen, masterTeachers.length]);

  // Set of names already in active semester (case-insensitive)
  const existingNamesSet = useMemo(() => {
    const s = new Set<string>();
    semesterTeachers.forEach((t) => s.add(t.name.trim().toLowerCase()));
    return s;
  }, [semesterTeachers]);

  // Set of codes already in active semester
  const existingCodesSet = useMemo(() => {
    const s = new Set<string>();
    semesterTeachers.forEach((t) => {
      if (t.code) s.add(t.code.trim().toUpperCase());
    });
    return s;
  }, [semesterTeachers]);

  // Filter master teachers for search
  const filteredMasterTeachers = useMemo(() => {
    const q = catalogSearch.toLowerCase().trim();
    if (!q) return masterTeachers;
    return masterTeachers.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        (m.code && m.code.toLowerCase().includes(q)) ||
        (m.department && m.department.toLowerCase().includes(q)) ||
        (m.position && m.position.toLowerCase().includes(q))
    );
  }, [masterTeachers, catalogSearch]);

  if (!isOpen) return null;

  // Check if manual name already exists in this semester
  const isNameDuplicateInSemester =
    !teacherToEdit && name.trim() && existingNamesSet.has(name.trim().toLowerCase());

  const handleToggleSelectMaster = (id: string) => {
    setSelectedMasterIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleAddSelectedFromMaster = () => {
    const toAdd = masterTeachers.filter((m) => selectedMasterIds.includes(m.id));
    if (toAdd.length > 0) {
      onAddBatchMasterTeachersToSemester(toAdd);
      onClose();
    }
  };

  const handleSingleAddFromMaster = (m: MasterTeacher) => {
    onAddMasterTeacherToSemester(m);
  };

  const handleSubmitManualOrEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (isNameDuplicateInSemester) {
      return;
    }

    onSaveTeacher({
      id: teacherToEdit?.id,
      name: name.trim(),
      code: code.trim(),
      position,
      department: department.trim(),
      email: email.trim(),
      phone: phone.trim(),
      saveToMaster: !teacherToEdit && saveToMaster,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 shrink-0 bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              {teacherToEdit ? <User className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {teacherToEdit ? 'Chỉnh Sửa Thông Tin Giảng Viên' : 'Thêm Giảng Viên Vào Học Kỳ'}
              </h2>
              <p className="text-xs text-slate-500">
                Học kỳ: <strong className="text-slate-800">{semesterName}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 text-xs space-y-4">
          {/* If ADDING NEW TEACHER: Provide 2 clear options */}
          {!teacherToEdit && (
            <div className="flex items-center bg-slate-100 p-1 rounded-xl gap-1">
              <button
                type="button"
                onClick={() => setAddMode('from_master')}
                className={`flex-1 py-2 px-3 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  addMode === 'from_master'
                    ? 'bg-white text-emerald-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Chọn từ Quản Lý GV ({masterTeachers.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setAddMode('manual')}
                className={`flex-1 py-2 px-3 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  addMode === 'manual'
                    ? 'bg-white text-emerald-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nhập mới giảng viên</span>
              </button>
            </div>
          )}

          {/* MODE A: Select from Master Teachers */}
          {!teacherToEdit && addMode === 'from_master' && (
            <div className="space-y-3">
              {masterTeachers.length === 0 ? (
                <div className="p-6 bg-amber-50/70 border border-amber-200 rounded-xl text-center space-y-2">
                  <p className="font-semibold text-amber-900">
                    Danh mục Quản lý Giảng viên hiện đang trống!
                  </p>
                  <p className="text-slate-600 text-xs">
                    Bạn hãy chuyển sang tab <strong>"Nhập mới giảng viên"</strong> để thêm trực tiếp vào học kỳ này.
                  </p>
                  <button
                    type="button"
                    onClick={() => setAddMode('manual')}
                    className="mt-2 px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-xs cursor-pointer shadow-2xs"
                  >
                    Nhập mới ngay
                  </button>
                </div>
              ) : (
                <>
                  {/* Search box in master list */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Tìm kiếm theo tên GV, mã GV, khoa bộ môn..."
                      value={catalogSearch}
                      onChange={(e) => setCatalogSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>

                  {/* List of master teachers */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 max-h-64 overflow-y-auto bg-white">
                    {filteredMasterTeachers.map((m) => {
                      const alreadyInSemester = existingNamesSet.has(m.name.trim().toLowerCase());
                      const isChecked = selectedMasterIds.includes(m.id);

                      return (
                        <div
                          key={m.id}
                          className={`p-3 flex items-center justify-between gap-3 transition-colors ${
                            alreadyInSemester
                              ? 'bg-slate-50/80 opacity-75'
                              : isChecked
                              ? 'bg-emerald-50/60'
                              : 'hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            {!alreadyInSemester ? (
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleToggleSelectMaster(m.id)}
                                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                              />
                            ) : (
                              <div className="w-4 h-4 flex items-center justify-center text-slate-400">
                                <Check className="w-3.5 h-3.5" />
                              </div>
                            )}

                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-900 truncate">{m.name}</span>
                                {m.code && (
                                  <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                                    {m.code}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                                <span
                                  className={`px-1.5 py-0.2 rounded font-semibold ${
                                    m.position?.includes('Cơ hữu')
                                      ? 'bg-blue-50 text-blue-700'
                                      : 'bg-amber-50 text-amber-700'
                                  }`}
                                >
                                  {m.position}
                                </span>
                                <span>·</span>
                                <span className="truncate">{m.department || 'Bộ môn'}</span>
                              </div>
                            </div>
                          </div>

                          <div className="shrink-0">
                            {alreadyInSemester ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-md">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>Đã có trong kỳ</span>
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleSingleAddFromMaster(m)}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md font-bold text-[11px] flex items-center gap-1 shadow-2xs cursor-pointer transition-colors"
                              >
                                <Plus className="w-3 h-3" />
                                <span>Thêm vào kỳ</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Batch add button if selections exist */}
                  {selectedMasterIds.length > 0 && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-emerald-900">
                        Đang chọn <strong>{selectedMasterIds.length}</strong> giảng viên
                      </span>
                      <button
                        type="button"
                        onClick={handleAddSelectedFromMaster}
                        className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-xs shadow-xs cursor-pointer transition-colors"
                      >
                        Thêm ({selectedMasterIds.length}) GV vào kỳ
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* MODE B: Manual Entry OR Edit Existing Teacher */}
          {(teacherToEdit || addMode === 'manual') && (
            <form id="teacher-form" onSubmit={handleSubmitManualOrEdit} className="space-y-3.5">
              {isNameDuplicateInSemester && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-semibold flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0"></span>
                  <span>
                    Giảng viên <strong>"{name}"</strong> đã có trong học kỳ này! Vui lòng không thêm trùng lặp.
                  </span>
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Họ và Tên Giảng Viên *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: ThS. Nguyễn Văn A"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full py-2 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-slate-900 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Chức Vụ / Hình Thức *
                  </label>
                  <select
                    value={position}
                    onChange={(e) => setPosition(e.target.value as TeacherPosition)}
                    className="w-full py-2 px-3 bg-white border border-slate-300 rounded-lg focus:outline-none font-semibold text-slate-800 cursor-pointer"
                  >
                    <option value="Cơ hữu">Cơ hữu (Cán bộ, Trưởng khoa, Hiệu trưởng...)</option>
                    <option value="Thỉnh giảng">Thỉnh giảng (Giảng viên mời bên ngoài)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Mã Giảng Viên
                  </label>
                  <input
                    type="text"
                    placeholder="Ví dụ: GV01"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full py-2 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-slate-900 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Khoa / Bộ Môn
                </label>
                <input
                  type="text"
                  placeholder="Hệ thống thông tin..."
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full py-2 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Email Liên Hệ
                  </label>
                  <input
                    type="email"
                    placeholder="gv@university.edu.vn"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full py-2 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Số Điện Thoại
                  </label>
                  <input
                    type="tel"
                    placeholder="0901234567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full py-2 px-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-slate-900"
                  />
                </div>
              </div>

              {!teacherToEdit && (
                <label className="flex items-center gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer">
                  <input
                    type="checkbox"
                    checked={saveToMaster}
                    onChange={(e) => setSaveToMaster(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-slate-700 font-medium">
                    Đồng thời lưu vào <strong>Quản Lý Giảng Viên</strong> để dùng cho các học kỳ sau
                  </span>
                </label>
              )}
            </form>
          )}
        </div>

        {/* Modal Sticky Footer */}
        <div className="flex items-center justify-end gap-2 p-4 border-t border-slate-100 bg-slate-50/80 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg font-medium transition-colors cursor-pointer"
          >
            Đóng
          </button>

          {(teacherToEdit || addMode === 'manual') && (
            <button
              type="submit"
              form="teacher-form"
              disabled={Boolean(isNameDuplicateInSemester)}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-bold shadow-xs cursor-pointer transition-colors"
            >
              {teacherToEdit ? 'Lưu Cập Nhật' : '+ Thêm Vào Học Kỳ'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
