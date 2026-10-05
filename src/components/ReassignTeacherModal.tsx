import React, { useState } from 'react';
import { ArrowRightLeft, Check, Sparkles, UserCheck, UserPlus, X } from 'lucide-react';
import { CourseAssignment, MasterTeacher, Teacher } from '../types';

interface ReassignTeacherModalProps {
  isOpen: boolean;
  onClose: () => void;
  course: CourseAssignment | null;
  currentTeacher: Teacher | null;
  teachersInSemester: Teacher[];
  masterTeachers: MasterTeacher[];
  onConfirmReassign: (
    courseId: string,
    currentTeacherId: string,
    targetTeacher: {
      type: 'existing' | 'master' | 'new';
      teacherId?: string;
      masterTeacher?: MasterTeacher;
      newTeacher?: {
        name: string;
        position: string;
        phone?: string;
        email?: string;
      };
    }
  ) => void;
}

export const ReassignTeacherModal: React.FC<ReassignTeacherModalProps> = ({
  isOpen,
  onClose,
  course,
  currentTeacher,
  teachersInSemester,
  masterTeachers,
  onConfirmReassign,
}) => {
  const [targetType, setTargetType] = useState<'existing' | 'master' | 'new'>('existing');
  const [selectedExistingId, setSelectedExistingId] = useState<string>('');
  const [selectedMasterId, setSelectedMasterId] = useState<string>('');
  const [newTeacherName, setNewTeacherName] = useState('');
  const [newTeacherPosition, setNewTeacherPosition] = useState('Cơ hữu');

  if (!isOpen || !course || !currentTeacher) return null;

  // Filter out current teacher from existing list
  const otherExistingTeachers = teachersInSemester.filter((t) => t.id !== currentTeacher.id);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (targetType === 'existing') {
      const targetId = selectedExistingId || otherExistingTeachers[0]?.id;
      if (!targetId) {
        alert('Vui lòng chọn Giảng viên nhận môn!');
        return;
      }
      onConfirmReassign(course.id, currentTeacher.id, {
        type: 'existing',
        teacherId: targetId,
      });
    } else if (targetType === 'master') {
      const masterT = masterTeachers.find(
        (t) => t.id === (selectedMasterId || masterTeachers[0]?.id)
      );
      if (!masterT) {
        alert('Vui lòng chọn Giảng viên từ danh mục!');
        return;
      }
      onConfirmReassign(course.id, currentTeacher.id, {
        type: 'master',
        teacherId: masterT.id,
        masterTeacher: masterT,
      });
    } else {
      if (!newTeacherName.trim()) {
        alert('Vui lòng nhập tên Giảng viên mới!');
        return;
      }
      onConfirmReassign(course.id, currentTeacher.id, {
        type: 'new',
        newTeacher: {
          name: newTeacherName.trim(),
          position: newTeacherPosition,
        },
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-5 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center shadow-xs">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Đổi Giảng Viên Phụ Trách Môn Học
              </h3>
              <p className="text-xs text-slate-500">
                Chuyển môn sang giảng viên khác mà vẫn giữ nguyên lớp & lịch học
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current info banner */}
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Môn học & Lớp:</span>
            <span className="font-bold text-slate-900 font-mono">
              {course.subjectName} ({course.className})
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">GV hiện tại:</span>
            <span className="font-bold text-amber-700">{currentTeacher.name}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Tổng số tiết:</span>
            <span className="font-semibold text-slate-700">
              {(course.theoryHours || 0) + (course.practiceHours || 0)} tiết
            </span>
          </div>
        </div>

        {/* Tabs for choosing target */}
        <div className="space-y-3">
          <label className="block text-xs font-bold text-slate-800">
            Chọn Giảng Viên Nhận Phụ Trách:
          </label>

          <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
            <button
              type="button"
              onClick={() => setTargetType('existing')}
              className={`py-1.5 px-2 rounded-lg font-semibold transition-all cursor-pointer text-center ${
                targetType === 'existing'
                  ? 'bg-sky-600 text-white shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              GV trong kỳ ({otherExistingTeachers.length})
            </button>
            <button
              type="button"
              onClick={() => setTargetType('master')}
              className={`py-1.5 px-2 rounded-lg font-semibold transition-all cursor-pointer text-center ${
                targetType === 'master'
                  ? 'bg-sky-600 text-white shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Danh mục ({masterTeachers.length})
            </button>
            <button
              type="button"
              onClick={() => setTargetType('new')}
              className={`py-1.5 px-2 rounded-lg font-semibold transition-all cursor-pointer text-center ${
                targetType === 'new'
                  ? 'bg-sky-600 text-white shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              + GV Mới
            </button>
          </div>

          {targetType === 'existing' && (
            <div>
              {otherExistingTeachers.length === 0 ? (
                <p className="text-xs text-slate-500 italic p-2 bg-slate-50 rounded-lg text-center">
                  Không còn GV nào khác trong kỳ này. Vui lòng chọn từ "Danh mục" hoặc "+ GV Mới".
                </p>
              ) : (
                <select
                  value={selectedExistingId || otherExistingTeachers[0]?.id}
                  onChange={(e) => setSelectedExistingId(e.target.value)}
                  className="w-full py-2 px-3 text-xs bg-white border border-slate-300 rounded-lg font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/20 cursor-pointer"
                >
                  {otherExistingTeachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} · {t.position || 'Cơ hữu'} ({t.courses?.length || 0} môn đang dạy)
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {targetType === 'master' && (
            <div>
              {masterTeachers.length === 0 ? (
                <p className="text-xs text-slate-500 italic p-2 bg-slate-50 rounded-lg text-center">
                  Chưa có GV trong danh mục chung.
                </p>
              ) : (
                <select
                  value={selectedMasterId || masterTeachers[0]?.id}
                  onChange={(e) => setSelectedMasterId(e.target.value)}
                  className="w-full py-2 px-3 text-xs bg-white border border-slate-300 rounded-lg font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/20 cursor-pointer"
                >
                  {masterTeachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} · {t.position || 'Cơ hữu'} {t.department ? `(${t.department})` : ''}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {targetType === 'new' && (
            <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Họ và Tên Giảng Viên Mới *
                </label>
                <input
                  type="text"
                  required={targetType === 'new'}
                  value={newTeacherName}
                  onChange={(e) => setNewTeacherName(e.target.value)}
                  placeholder="VD: ThS. Lê Văn B..."
                  className="w-full py-1.5 px-3 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 font-bold focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Chức Vụ *
                </label>
                <select
                  value={newTeacherPosition}
                  onChange={(e) => setNewTeacherPosition(e.target.value)}
                  className="w-full py-1.5 px-3 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 font-semibold focus:outline-none cursor-pointer"
                >
                  <option value="Cơ hữu">Cơ hữu</option>
                  <option value="Thỉnh giảng">Thỉnh giảng</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
          >
            Hủy Bỏ
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-5 py-2 text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>Xác Nhận Đổi Giảng Viên</span>
          </button>
        </div>
      </div>
    </div>
  );
};
