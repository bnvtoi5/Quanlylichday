import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  ArrowUpDown,
  BookOpen,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  GraduationCap,
  Info,
  Layers,
  Search,
  Sparkles,
  Users,
  X,
  Zap,
} from 'lucide-react';
import { Holiday, Teacher } from '../types';
import {
  applySequentialCoTeachingToGroup,
  autoSequenceAllCoTeachingGroups,
  calculateCourseLastSessionDate,
  CoTeachingGroupInfo,
  CoTeachingSequenceMode,
  detectCoTeachingGroups,
  findNextSequentialStartDate,
} from '../utils/coTeachingHelper';
import { formatVietnamDate } from '../utils/vietnamTime';

interface CoTeachingScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  teachers: Teacher[];
  holidays: Holiday[];
  onApplyCoTeaching: (updatedTeachers: Teacher[], successMessage: string) => void;
}

export const CoTeachingScannerModal: React.FC<CoTeachingScannerModalProps> = ({
  isOpen,
  onClose,
  teachers,
  holidays,
  onApplyCoTeaching,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'OVERLAPPING' | 'SEQUENCED'>('ALL');
  const [sequenceMode, setSequenceMode] = useState<CoTeachingSequenceMode>('NEXT_WEEK');
  // Local state of reordered groups: groupId -> custom items array
  const [customGroupOrders, setCustomGroupOrders] = useState<Record<string, string[]>>({});

  // Detect groups
  const detectedGroups = useMemo(() => {
    if (!isOpen) return [];
    return detectCoTeachingGroups(teachers, holidays, sequenceMode);
  }, [isOpen, teachers, holidays, sequenceMode]);

  // Apply custom orders if any
  const groupsWithCustomOrder = useMemo<CoTeachingGroupInfo[]>(() => {
    return detectedGroups.map((group) => {
      const customOrder = customGroupOrders[group.groupId];
      if (!customOrder || customOrder.length !== group.items.length) {
        return group;
      }

      // Reorder items according to customOrder (teacherIds)
      const reorderedItems = [...group.items].sort((a, b) => {
        const idxA = customOrder.indexOf(a.teacherId);
        const idxB = customOrder.indexOf(b.teacherId);
        return (idxA === -1 ? 99 : idxA) - (idxB === -1 ? 99 : idxB);
      });

      const phase1 = reorderedItems[0];
      const p1Info = calculateCourseLastSessionDate(phase1.course, holidays);
      const phase1LastDate = p1Info?.lastDateStr;

      let suggestedStartPhase2: string | undefined;
      let isOverlapping = false;
      let isSequenced = true;
      let conflictMessage: string | undefined;

      if (reorderedItems.length >= 2 && phase1LastDate) {
        const phase2 = reorderedItems[1];
        const p2Slots = phase2.course.scheduleSlots || phase1.course.scheduleSlots || ['S2'];
        suggestedStartPhase2 = findNextSequentialStartDate(
          phase1LastDate,
          p2Slots,
          holidays,
          sequenceMode
        );

        const p1Start = phase1.course.startDate || '';
        const p2Start = phase2.course.startDate || '';

        if (p1Start === p2Start || p2Start <= phase1LastDate) {
          isOverlapping = true;
          isSequenced = false;
          conflictMessage = `GV ${phase1.teacherName} và GV ${phase2.teacherName} đang trùng lịch. Đề xuất nối tiếp sang tuần mới từ ${suggestedStartPhase2}.`;
        }
      }

      return {
        ...group,
        items: reorderedItems.map((it, idx) => ({ ...it, phase: idx + 1 })),
        phase1LastDate,
        suggestedStartDatePhase2: suggestedStartPhase2,
        isOverlapping,
        isSequenced,
        conflictMessage,
      };
    });
  }, [detectedGroups, customGroupOrders, holidays, sequenceMode]);

  // Filtered groups
  const filteredGroups = useMemo(() => {
    return groupsWithCustomOrder.filter((g) => {
      const matchSearch =
        !searchTerm.trim() ||
        g.className.toLowerCase().includes(searchTerm.toLowerCase()) ||
        g.subjectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        g.items.some((it) => it.teacherName.toLowerCase().includes(searchTerm.toLowerCase()));

      if (!matchSearch) return false;

      if (filterStatus === 'OVERLAPPING') return g.isOverlapping;
      if (filterStatus === 'SEQUENCED') return g.isSequenced && !g.isOverlapping;
      return true;
    });
  }, [groupsWithCustomOrder, searchTerm, filterStatus]);

  const stats = useMemo(() => {
    const total = detectedGroups.length;
    const overlapping = detectedGroups.filter((g) => g.isOverlapping).length;
    const sequenced = detectedGroups.filter((g) => g.isSequenced && !g.isOverlapping).length;
    return { total, overlapping, sequenced };
  }, [detectedGroups]);

  if (!isOpen) return null;

  // Handler: Swap teacher order in a group
  const handleSwapOrder = (groupId: string) => {
    const group = groupsWithCustomOrder.find((g) => g.groupId === groupId);
    if (!group || group.items.length < 2) return;

    const currentTeacherIds = group.items.map((it) => it.teacherId);
    // Reverse or cycle
    const swapped = [currentTeacherIds[1], currentTeacherIds[0], ...currentTeacherIds.slice(2)];

    setCustomGroupOrders((prev) => ({
      ...prev,
      [groupId]: swapped,
    }));
  };

  // Handler: Apply single group
  const handleApplySingleGroup = (group: CoTeachingGroupInfo) => {
    const updatedTeachers = applySequentialCoTeachingToGroup(group, teachers, holidays, sequenceMode);
    onApplyCoTeaching(
      updatedTeachers,
      `Đã thiết lập nối tiếp môn "${group.subjectName}" (Lớp ${group.className}) thành công!`
    );
  };

  // Handler: Apply all groups
  const handleApplyAll = () => {
    // Apply groups one by one respecting custom orders
    let currentTeachers = teachers;
    let appliedCount = 0;

    groupsWithCustomOrder.forEach((group) => {
      currentTeachers = applySequentialCoTeachingToGroup(group, currentTeachers, holidays, sequenceMode);
      appliedCount++;
    });

    onApplyCoTeaching(
      currentTeachers,
      `Đã tự động tính toán & nối tiếp toàn bộ ${appliedCount} môn đồng giảng dạy!`
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-amber-300 shadow-inner">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold flex items-center gap-2">
                Quét & Nối Tiếp Môn Đồng Giảng Dạy
                <span className="text-[11px] font-normal px-2 py-0.5 rounded-full bg-purple-500/30 border border-purple-400/30 text-purple-200">
                  2+ Giảng Viên
                </span>
              </h2>
              <p className="text-xs text-purple-200/80 mt-0.5">
                Tự động nhận diện môn cùng lớp do 2 GV phụ trách, xếp GV dạy trước ➔ GV dạy sau nối tiếp chuẩn lịch
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-purple-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stats & Quick Action Bar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 shrink-0 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Total Detected */}
            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <div className="text-[11px] font-medium text-slate-500">Môn Đồng Giảng Dạy</div>
                <div className="text-lg font-black text-slate-900">{stats.total} nhóm</div>
              </div>
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                <Users className="w-4 h-4" />
              </div>
            </div>

            {/* Overlapping */}
            <div
              className={`p-3 rounded-xl border shadow-xs flex items-center justify-between ${
                stats.overlapping > 0
                  ? 'bg-amber-50/70 border-amber-200 text-amber-900'
                  : 'bg-white border-slate-200 text-slate-900'
              }`}
            >
              <div>
                <div className="text-[11px] font-medium text-slate-500">Trùng Lịch Cần Nối Tiếp</div>
                <div className="text-lg font-black text-amber-600">{stats.overlapping} nhóm</div>
              </div>
              <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>

            {/* Sequenced */}
            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <div className="text-[11px] font-medium text-slate-500">Đã Nối Tiếp Đúng</div>
                <div className="text-lg font-black text-emerald-600">{stats.sequenced} nhóm</div>
              </div>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Sequence Rule Selection: Tách riêng tuần vs Nối tiếp ngay buổi sau */}
          <div className="bg-purple-50/80 p-2.5 rounded-xl border border-purple-200/80 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-purple-950 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-purple-700" />
                <span>Quy tắc nối tiếp:</span>
              </span>
              <div className="inline-flex bg-white p-0.5 rounded-lg border border-purple-200 text-xs">
                <button
                  type="button"
                  onClick={() => setSequenceMode('NEXT_WEEK')}
                  className={`px-3 py-1 rounded-md font-bold transition-all cursor-pointer ${
                    sequenceMode === 'NEXT_WEEK'
                      ? 'bg-purple-700 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="GV 1 kết thúc ở tuần nào thì GV 2 sẽ bắt đầu dạy từ đầu tuần tiếp theo (Tách riêng tuần, không giao tiết chung tuần)"
                >
                  📅 Tách riêng sang tuần mới (Khuyên dùng)
                </button>
                <button
                  type="button"
                  onClick={() => setSequenceMode('IMMEDIATE_SESSION')}
                  className={`px-3 py-1 rounded-md font-bold transition-all cursor-pointer ${
                    sequenceMode === 'IMMEDIATE_SESSION'
                      ? 'bg-purple-700 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="GV 2 bắt đầu dạy ngay buổi trống kế tiếp trong tuần nếu tuần đó còn buổi"
                >
                  ⚡ Nối tiếp ngay buổi sau (Có thể cùng tuần)
                </button>
              </div>
            </div>

            <span className="text-[11px] text-purple-800 italic hidden sm:inline">
              {sequenceMode === 'NEXT_WEEK'
                ? '✨ GV 2 bắt đầu từ tuần kế tiếp (tách riêng tuần).'
                : '✨ GV 2 dạy ngay buổi tiếp theo (có thể cùng tuần).'}
            </span>
          </div>

          {/* Controls & Filter */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <div className="flex items-center gap-2 flex-1 min-w-[240px]">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm theo môn, lớp hoặc tên giảng viên..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                />
              </div>

              {/* Status Filter */}
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 font-medium focus:outline-none"
              >
                <option value="ALL">Tất cả ({detectedGroups.length})</option>
                <option value="OVERLAPPING">Cần nối tiếp ({stats.overlapping})</option>
                <option value="SEQUENCED">Đã nối tiếp ({stats.sequenced})</option>
              </select>
            </div>

            {/* 1-Click Auto Sequence All */}
            {detectedGroups.length > 0 && (
              <button
                type="button"
                onClick={handleApplyAll}
                className="px-4 py-2 text-xs font-bold bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer shrink-0 animate-pulse hover:animate-none"
              >
                <Zap className="w-4 h-4 text-amber-300" />
                <span>Tự Động Nối Tiếp Tất Cả (1-Click)</span>
              </button>
            )}
          </div>
        </div>

        {/* Groups List */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1 bg-slate-100/50">
          {filteredGroups.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 border border-slate-200 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">
                {detectedGroups.length === 0
                  ? 'Chưa tìm thấy môn học nào có từ 2 giảng viên cùng dạy'
                  : 'Không có nhóm môn nào khớp với bộ lọc'}
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                {detectedGroups.length === 0
                  ? 'Khi có một môn học của cùng một lớp được phân công cho 2 giảng viên (ví dụ GV 1 dạy Lý thuyết, GV 2 dạy Thực hành), hệ thống sẽ tự động hiển thị tại đây để nối tiếp lịch dạy.'
                  : 'Hãy thử xóa từ khóa tìm kiếm hoặc chọn "Tất cả" để xem toàn bộ danh sách.'}
              </p>
            </div>
          ) : (
            filteredGroups.map((group, groupIdx) => {
              const phase1 = group.items[0];
              const phase2 = group.items[1];
              const p1Info = calculateCourseLastSessionDate(phase1.course, holidays);
              const p2Info = calculateCourseLastSessionDate(phase2?.course, holidays);

              return (
                <div
                  key={group.groupId}
                  className={`bg-white rounded-2xl p-4 border transition-all shadow-xs ${
                    group.isOverlapping
                      ? 'border-amber-300 hover:border-amber-400 ring-1 ring-amber-200/50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {/* Card Header */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center">
                        {groupIdx + 1}
                      </span>
                      <div>
                        <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                          <span>{group.subjectName}</span>
                          {group.subjectCode && (
                            <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">
                              {group.subjectCode}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                          <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                            Lớp: {group.className}
                          </span>
                          <span>·</span>
                          <span>
                            Tổng: <strong>{group.totalHours} tiết</strong> ({group.totalTheoryHours} LT + {group.totalPracticeHours} TH)
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {group.isOverlapping ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-amber-600" />
                          <span>Trùng ngày bắt đầu</span>
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span>Đã nối tiếp chuẩn</span>
                        </span>
                      )}

                      {group.items.length >= 2 && (
                        <button
                          type="button"
                          onClick={() => handleSwapOrder(group.groupId)}
                          className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-purple-50 hover:text-purple-700 hover:border-purple-200 text-slate-700 border border-slate-200 rounded-lg font-bold transition-all flex items-center gap-1 cursor-pointer"
                          title="Đổi thứ tự giảng viên dạy trước / dạy sau"
                        >
                          <ArrowUpDown className="w-3 h-3 text-purple-600" />
                          <span>Đổi GV Dạy Trước</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleApplySingleGroup(group)}
                        className="px-3 py-1 text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center gap-1 cursor-pointer shadow-xs"
                      >
                        <Zap className="w-3 h-3 text-amber-300" />
                        <span>Áp dụng</span>
                      </button>
                    </div>
                  </div>

                  {/* Visual Sequential Flow */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3 pt-1">
                    {/* Phase 1 Box (Dạy trước) */}
                    <div className="bg-purple-50/50 border border-purple-200/80 rounded-xl p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-purple-600 text-white">
                            ĐỢT 1 (DẠY TRƯỚC)
                          </span>
                          <span className="text-[10px] text-purple-700 font-bold">
                            {phase1.isPrimaryOrTheory ? 'Lý Thuyết / Phần 1' : 'Phần 1'}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-purple-800 bg-purple-100/80 px-1.5 py-0.5 rounded">
                          {(phase1.course.theoryHours || 0) + (phase1.course.practiceHours || 0)} tiết
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-purple-200 text-purple-900 flex items-center justify-center font-bold text-xs shrink-0">
                          {phase1.teacherName.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-slate-900 text-xs truncate">
                            {phase1.teacherName}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            {phase1.teacherPosition || 'Cơ hữu'} · Buổi: {(phase1.course.scheduleSlots || ['S2']).join(', ')}
                          </div>
                        </div>
                      </div>

                      {/* Timeline dates for Phase 1 */}
                      <div className="bg-white/80 rounded-lg p-2 text-[11px] border border-purple-100 flex items-center justify-between text-slate-700">
                        <div>
                          <span className="text-slate-400 block text-[10px]">Ngày bắt đầu:</span>
                          <strong className="text-slate-900">
                            {phase1.course.startDate ? formatVietnamDate(phase1.course.startDate) : 'Chưa đặt'}
                          </strong>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                        <div className="text-right">
                          <span className="text-slate-400 block text-[10px]">Buổi kết thúc:</span>
                          <strong className="text-purple-700">
                            {p1Info?.lastDateStr ? formatVietnamDate(p1Info.lastDateStr) : 'Đang tính...'}
                          </strong>
                          {p1Info?.totalSessions ? (
                            <span className="text-[10px] text-slate-400 block">({p1Info.totalSessions} buổi)</span>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    {/* Phase 2 Box (Dạy sau / Nối tiếp) */}
                    {phase2 && (
                      <div
                        className={`rounded-xl p-3 space-y-2 border ${
                          group.isOverlapping
                            ? 'bg-amber-50/50 border-amber-300'
                            : 'bg-emerald-50/50 border-emerald-200/80'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-black text-white ${
                                group.isOverlapping ? 'bg-amber-600' : 'bg-emerald-600'
                              }`}
                            >
                              ĐỢT 2 (DẠY NỐI TIẾP)
                            </span>
                            <span
                              className={`text-[10px] font-bold ${
                                group.isOverlapping ? 'text-amber-800' : 'text-emerald-800'
                              }`}
                            >
                              Thực Hành / Phần 2
                            </span>
                          </div>
                          <span
                            className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                              group.isOverlapping
                                ? 'bg-amber-100 text-amber-900'
                                : 'bg-emerald-100/80 text-emerald-900'
                            }`}
                          >
                            {(phase2.course.theoryHours || 0) + (phase2.course.practiceHours || 0)} tiết
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                              group.isOverlapping
                                ? 'bg-amber-200 text-amber-900'
                                : 'bg-emerald-200 text-emerald-900'
                            }`}
                          >
                            {phase2.teacherName.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 text-xs truncate">
                              {phase2.teacherName}
                            </div>
                            <div className="text-[10px] text-slate-500">
                              {phase2.teacherPosition || 'Cơ hữu'} · Buổi: {(phase2.course.scheduleSlots || ['S2']).join(', ')}
                            </div>
                          </div>
                        </div>

                        {/* Timeline dates for Phase 2 */}
                        <div className="bg-white/80 rounded-lg p-2 text-[11px] border border-slate-200 flex items-center justify-between text-slate-700">
                          <div>
                            <span className="text-slate-400 block text-[10px]">
                              {group.isOverlapping ? 'Đang trùng ngày:' : 'Ngày bắt đầu nối tiếp:'}
                            </span>
                            {group.isOverlapping ? (
                              <div>
                                <span className="line-through text-slate-400 mr-1 text-[10px]">
                                  {formatVietnamDate(phase2.course.startDate || '')}
                                </span>
                                <strong className="text-emerald-700 font-bold">
                                  ➔ {group.suggestedStartDatePhase2 ? formatVietnamDate(group.suggestedStartDatePhase2) : ''}
                                </strong>
                              </div>
                            ) : (
                              <strong className="text-emerald-700">
                                {phase2.course.startDate ? formatVietnamDate(phase2.course.startDate) : 'Chưa đặt'}
                              </strong>
                            )}
                          </div>
                          <ArrowRight className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <div className="text-right">
                            <span className="text-slate-400 block text-[10px]">Dự kiến kết thúc:</span>
                            <strong className="text-slate-900">
                              {p2Info?.lastDateStr ? formatVietnamDate(p2Info.lastDateStr) : 'Đang tính...'}
                            </strong>
                            {p2Info?.totalSessions ? (
                              <span className="text-[10px] text-slate-400 block">({p2Info.totalSessions} buổi)</span>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {group.conflictMessage && (
                    <div className="mt-2.5 p-2 bg-amber-50 rounded-lg border border-amber-200/80 text-[11px] text-amber-800 flex items-center gap-1.5">
                      <Info className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>{group.conflictMessage}</span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-white shrink-0">
          <div className="text-xs text-slate-500">
            {detectedGroups.length > 0
              ? `Tìm thấy ${detectedGroups.length} nhóm môn học có đồng giảng dạy.`
              : 'Tất cả các môn học đang theo đúng tiến độ.'}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              Đóng
            </button>
            {detectedGroups.length > 0 && (
              <button
                type="button"
                onClick={handleApplyAll}
                className="px-4 py-2 text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Nối Tiếp Tất Cả Môn</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
