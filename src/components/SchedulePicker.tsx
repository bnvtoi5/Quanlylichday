import React, { useState } from 'react';
import { Calendar, Check, Edit3, Plus, Shuffle, Trash2, Zap } from 'lucide-react';
import { CoursePauseInterval, CourseSchedulePhase, WeeklySessionSlot } from '../types';
import { ALL_WEEKLY_SLOTS, WEEKLY_SLOT_INFO, formatCourseScheduleSummary, formatSlotSummary, formatVietnamDate, parseSlotShorthand } from '../utils/vietnamTime';

interface SchedulePickerProps {
  startDate: string;
  onStartDateChange: (val: string) => void;
  scheduleSlots: WeeklySessionSlot[];
  onScheduleSlotsChange: (slots: WeeklySessionSlot[]) => void;
  hoursPerSession: number;
  onHoursPerSessionChange: (val: number) => void;
  pauseIntervals: CoursePauseInterval[];
  onPauseIntervalsChange: (intervals: CoursePauseInterval[]) => void;
  schedulePhases?: CourseSchedulePhase[];
  onSchedulePhasesChange?: (phases: CourseSchedulePhase[]) => void;
}

const DAYS = [
  { key: '2', name: 'Thứ 2', sSlot: 'S2' as WeeklySessionSlot, cSlot: 'C2' as WeeklySessionSlot },
  { key: '3', name: 'Thứ 3', sSlot: 'S3' as WeeklySessionSlot, cSlot: 'C3' as WeeklySessionSlot },
  { key: '4', name: 'Thứ 4', sSlot: 'S4' as WeeklySessionSlot, cSlot: 'C4' as WeeklySessionSlot },
  { key: '5', name: 'Thứ 5', sSlot: 'S5' as WeeklySessionSlot, cSlot: 'C5' as WeeklySessionSlot },
  { key: '6', name: 'Thứ 6', sSlot: 'S6' as WeeklySessionSlot, cSlot: 'C6' as WeeklySessionSlot },
  { key: '7', name: 'Thứ 7', sSlot: 'S7' as WeeklySessionSlot, cSlot: 'C7' as WeeklySessionSlot },
  { key: 'CN', name: 'Chủ Nhật', sSlot: 'SCN' as WeeklySessionSlot, cSlot: 'CCN' as WeeklySessionSlot },
];

export const SchedulePicker: React.FC<SchedulePickerProps> = ({
  startDate,
  onStartDateChange,
  scheduleSlots,
  onScheduleSlotsChange,
  hoursPerSession,
  onHoursPerSessionChange,
  pauseIntervals,
  onPauseIntervalsChange,
  schedulePhases = [],
  onSchedulePhasesChange,
}) => {
  const [quickShorthand, setQuickShorthand] = useState('');

  const toggleSlot = (slot: WeeklySessionSlot) => {
    if (scheduleSlots.includes(slot)) {
      onScheduleSlotsChange(scheduleSlots.filter((s) => s !== slot));
    } else {
      onScheduleSlotsChange([...scheduleSlots, slot]);
    }
  };

  const handleApplyShorthand = (val: string) => {
    setQuickShorthand(val);
    const parsed = parseSlotShorthand(val);
    if (parsed.length > 0) {
      onScheduleSlotsChange(parsed);
    }
  };

  const handleQuickPreset = (code: string) => {
    setQuickShorthand(code);
    const parsed = parseSlotShorthand(code);
    if (parsed.length > 0) {
      onScheduleSlotsChange(parsed);
    }
  };

  const currentSummary = formatSlotSummary(scheduleSlots);

  const handleAddPhase = () => {
    if (!onSchedulePhasesChange) return;
    const newPhase: CourseSchedulePhase = {
      id: `phase-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      fromDate: '',
      scheduleSlots: ['S7', 'C7'], // Gợi ý mặc định SC7 như tình huống thực tế
      note: '',
    };
    onSchedulePhasesChange([...(schedulePhases || []), newPhase]);
  };

  const handleUpdatePhase = (id: string, updates: Partial<CourseSchedulePhase>) => {
    if (!onSchedulePhasesChange) return;
    onSchedulePhasesChange(
      (schedulePhases || []).map((p) => (p.id === id ? { ...p, ...updates } : p))
    );
  };

  const handleDeletePhase = (id: string) => {
    if (!onSchedulePhasesChange) return;
    onSchedulePhasesChange((schedulePhases || []).filter((p) => p.id !== id));
  };

  const handleAddPause = () => {
    const newPause: CoursePauseInterval = {
      id: `pause-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      fromDate: '',
      toDate: '',
      session: 'ALL',
    };
    onPauseIntervalsChange([...pauseIntervals, newPause]);
  };

  const handleUpdatePause = (
    id: string,
    field: 'fromDate' | 'toDate' | 'session',
    value: string
  ) => {
    onPauseIntervalsChange(
      pauseIntervals.map((p) => {
        if (p.id !== id) return p;
        // Auto-fill toDate with the same date if toDate is empty, convenient for 1-day pause
        if (field === 'fromDate' && !p.toDate) {
          return { ...p, fromDate: value, toDate: value };
        }
        return { ...p, [field]: value };
      })
    );
  };

  const handleDeletePause = (id: string) => {
    onPauseIntervalsChange(pauseIntervals.filter((p) => p.id !== id));
  };

  return (
    <div className="bg-sky-50/70 p-4 rounded-xl border border-sky-200/90 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-sky-200/60">
        <div className="font-bold text-sky-950 flex items-center gap-1.5 text-xs">
          <Calendar className="w-4 h-4 text-sky-600 shrink-0" />
          <span>Lịch Giảng Dạy & Tự Động Tính Tiết Theo Lịch VN</span>
        </div>
        <span className="text-[11px] font-bold text-sky-700 bg-sky-100/90 px-2.5 py-0.5 rounded-full border border-sky-200">
          {scheduleSlots.length} buổi / tuần
        </span>
      </div>

      {/* Start date & hours per session */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-[11px] font-semibold text-slate-700 mb-1">
            Ngày bắt đầu dạy *
          </label>
          <input
            type="date"
            required
            value={startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
            className="w-full py-2 px-3 bg-white border border-slate-300 rounded-lg text-slate-900 font-bold text-xs focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-700 mb-1">
            Số tiết 1 buổi (Mặc định 4h) *
          </label>
          <input
            type="number"
            min={0.5}
            max={12}
            step="any"
            value={hoursPerSession}
            onChange={(e) => onHoursPerSessionChange(e.target.value === '' ? ('' as any) : Number(e.target.value))}
            className="w-full py-2 px-3 bg-white border border-slate-300 rounded-lg text-slate-900 font-bold text-xs focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
          />
        </div>
      </div>

      {/* Weekly Slots Picker */}
      <div className="space-y-2">
        {/* Quick Shorthand Input & Preset Buttons */}
        <div className="bg-white p-2.5 rounded-xl border border-sky-200/80 shadow-2xs space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-[11px]">
            <div className="flex items-center gap-1 font-bold text-slate-800">
              <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span>Nhập nhanh ký hiệu buổi:</span>
            </div>
            <div className="text-[10px] text-slate-500 italic">
              VD: <strong className="text-sky-800 font-mono">S6</strong> (Sáng 6), <strong className="text-sky-800 font-mono">SC7</strong> (Sáng & Chiều 7), <strong className="text-sky-800 font-mono">sc56</strong> (Sáng & Chiều 5, 6), <strong className="text-sky-800 font-mono">S56</strong> (Sáng 5, 6)
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={quickShorthand}
                onChange={(e) => handleApplyShorthand(e.target.value)}
                placeholder="Gõ mã: S6, SC7, sc56, S56, C5, C6, S2,S4..."
                className="w-full py-1.5 px-3 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono font-bold text-xs uppercase focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 focus:bg-white"
              />
              {currentSummary && (
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300 font-mono font-black text-[10px]">
                  {currentSummary}
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                setQuickShorthand('');
                onScheduleSlotsChange([]);
              }}
              className="py-1.5 px-2.5 text-[11px] font-semibold text-rose-700 hover:text-rose-900 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg cursor-pointer transition-colors"
            >
              Xóa hết
            </button>
          </div>

          {/* Quick Click Preset Chips */}
          <div className="flex flex-wrap items-center gap-1 pt-1 border-t border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 mr-0.5">Chọn mẫu:</span>
            {[
              { code: 'S6', label: 'S6 (Sáng T6)', desc: '1 buổi/tuần' },
              { code: 'SC7', label: 'SC7 (Sáng & Chiều T7)', desc: '2 buổi/tuần' },
              { code: 'SC56', label: 'sc56 (Sáng & Chiều T5, T6)', desc: '4 buổi/tuần' },
              { code: 'S56', label: 'S56 (Sáng T5, T6)', desc: '2 buổi/tuần' },
              { code: 'C5', label: 'C5 (Chiều T5)', desc: '1 buổi/tuần' },
              { code: 'C6', label: 'C6 (Chiều T6)', desc: '1 buổi/tuần' },
              { code: 'S2, S4', label: 'S2, S4', desc: '2 buổi/tuần' },
              { code: 'S3, S5', label: 'S3, S5', desc: '2 buổi/tuần' },
            ].map((p) => {
              const isActive = currentSummary.toUpperCase() === p.code.replace(/[\s,]+/g, '').toUpperCase() ||
                (p.code === 'S2, S4' && scheduleSlots.includes('S2') && scheduleSlots.includes('S4') && scheduleSlots.length === 2) ||
                (p.code === 'S3, S5' && scheduleSlots.includes('S3') && scheduleSlots.includes('S5') && scheduleSlots.length === 2);

              return (
                <button
                  key={p.code}
                  type="button"
                  onClick={() => handleQuickPreset(p.code)}
                  className={`px-2 py-0.8 rounded-md text-[10px] font-bold transition-all cursor-pointer border ${
                    isActive
                      ? 'bg-sky-600 text-white border-sky-600 shadow-2xs ring-1 ring-sky-300'
                      : 'bg-slate-100 text-slate-700 hover:bg-sky-50 hover:text-sky-800 border-slate-200'
                  }`}
                  title={`${p.label} - ${p.desc}`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Visual Matrix Header */}
        <div className="flex items-center justify-between text-[11px] pt-1">
          <span className="font-bold text-slate-800">
            Hoặc bấm chọn trực tiếp vào bảng các buổi bên dưới:
          </span>
          {currentSummary && (
            <span className="text-[11px] font-mono font-bold text-sky-800 bg-sky-100 px-2 py-0.5 rounded border border-sky-200">
              Ký hiệu: {currentSummary} ({scheduleSlots.length} buổi/tuần)
            </span>
          )}
        </div>

        {/* Grid for days of week */}
        <div className="grid grid-cols-7 gap-1.5 bg-white p-2.5 rounded-xl border border-sky-100 shadow-2xs">
          {DAYS.map((day) => {
            const isSSelected = scheduleSlots.includes(day.sSlot);
            const isCSelected = scheduleSlots.includes(day.cSlot);

            return (
              <div key={day.key} className="text-center space-y-1">
                <div className="text-[11px] font-bold text-slate-700 pb-0.5 border-b border-slate-100">
                  {day.name}
                </div>

                {/* Sáng Slot button */}
                <button
                  type="button"
                  onClick={() => toggleSlot(day.sSlot)}
                  className={`w-full py-1.5 text-[11px] font-bold rounded-lg border transition-all cursor-pointer ${
                    isSSelected
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs ring-1 ring-blue-400'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                  title={`${day.name} - Buổi Sáng (${day.sSlot})`}
                >
                  {day.sSlot}
                </button>

                {/* Chiều Slot button */}
                <button
                  type="button"
                  onClick={() => toggleSlot(day.cSlot)}
                  className={`w-full py-1.5 text-[11px] font-bold rounded-lg border transition-all cursor-pointer ${
                    isCSelected
                      ? 'bg-amber-600 text-white border-amber-600 shadow-xs ring-1 ring-amber-400'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                  title={`${day.name} - Buổi Chiều (${day.cSlot})`}
                >
                  {day.cSlot}
                </button>
              </div>
            );
          })}
        </div>

        <div className="text-[11px] text-slate-600 flex items-center justify-between pt-0.5">
          <span>
            {scheduleSlots.length === 0 ? (
              <span className="text-rose-600 font-semibold">
                ⚠️ Chưa chọn buổi dạy (sẽ mặc định thứ 2)
              </span>
            ) : (
              <span>
                Đang chọn:{' '}
                <strong className="text-sky-900 font-bold">
                  {scheduleSlots
                    .map((s) => `${s} (${WEEKLY_SLOT_INFO[s]?.label || s})`)
                    .join(', ')}
                </strong>
              </span>
            )}
          </span>
        </div>
      </div>

      {/* Multi-phase Schedule Transitions Section */}
      <div className="pt-3 border-t border-sky-200/70 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <Shuffle className="w-4 h-4 text-purple-600" />
              <span>Giai Đoạn Đổi Buổi Dạy Theo Thời Gian (Tùy chọn)</span>
            </span>
            <span className="text-[11px] text-slate-500 block">
              Dành cho trường hợp ban đầu dạy một số buổi (VD: <strong className="text-purple-900 font-mono font-bold">C7</strong>), sau đó đổi sang hoặc tăng thêm buổi (VD: <strong className="text-purple-900 font-mono font-bold">SC7</strong>)
            </span>
          </div>

          {onSchedulePhasesChange && (
            <button
              type="button"
              onClick={handleAddPhase}
              className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-300 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5 text-purple-600" />
              <span>+ Thêm giai đoạn đổi buổi</span>
            </button>
          )}
        </div>

        {/* Visual Timeline of Phases */}
        <div className="bg-white/90 p-2.5 rounded-lg border border-purple-200 text-xs flex flex-wrap items-center gap-2 shadow-2xs">
          <span className="font-bold text-slate-700 text-[11px]">Lộ trình các giai đoạn:</span>
          <span className="px-2 py-0.5 rounded font-mono font-bold text-[11px] bg-slate-100 border border-slate-300 text-slate-800">
            GĐ 1 (từ {startDate ? formatVietnamDate(startDate) : 'ngày bắt đầu'}): <strong>{formatSlotSummary(scheduleSlots) || 'Chưa chọn'}</strong> ({scheduleSlots.length} buổi/tuần)
          </span>
          {(schedulePhases || []).map((phase, idx) => (
            <React.Fragment key={phase.id}>
              <span className="text-purple-600 font-bold">➔</span>
              <span className="px-2 py-0.5 rounded font-mono font-bold text-[11px] bg-purple-100 border border-purple-300 text-purple-900">
                GĐ {idx + 2} (từ {phase.fromDate ? formatVietnamDate(phase.fromDate) : '...'}): <strong>{formatSlotSummary(phase.scheduleSlots) || 'Chưa chọn'}</strong> ({phase.scheduleSlots?.length || 0} buổi/tuần)
              </span>
            </React.Fragment>
          ))}
        </div>

        {/* List of Phases */}
        {(schedulePhases || []).length === 0 ? (
          <div className="text-[11px] text-slate-400 italic bg-white/70 p-3 rounded-xl border border-dashed border-purple-200 text-center">
            Chưa thiết lập giai đoạn đổi buổi nào (buổi dạy cố định suốt môn). Bấm nút <strong>"+ Thêm giai đoạn đổi buổi"</strong> phía trên nếu môn học có thay đổi buổi dạy giữa kỳ.
          </div>
        ) : (
          <div className="space-y-3 pt-1">
            {(schedulePhases || []).map((phase, idx) => {
              const phaseSummary = formatSlotSummary(phase.scheduleSlots);
              return (
                <div
                  key={phase.id}
                  className="bg-white p-3.5 rounded-xl border border-purple-200 shadow-2xs space-y-3 relative"
                >
                  <div className="flex items-center justify-between pb-1.5 border-b border-purple-100">
                    <span className="font-bold text-xs text-purple-900 flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center text-[10px] font-bold">
                        {idx + 2}
                      </span>
                      <span>Giai đoạn {idx + 2}: Đổi sang lịch buổi dạy mới</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDeletePhase(phase.id)}
                      className="text-xs text-rose-600 hover:text-rose-800 font-semibold flex items-center gap-1 px-2 py-0.5 hover:bg-rose-50 rounded-md cursor-pointer transition-colors"
                      title="Xóa giai đoạn này"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Xóa giai đoạn</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Áp dụng từ ngày bắt đầu đợt mới *
                      </label>
                      <input
                        type="date"
                        required
                        value={phase.fromDate}
                        onChange={(e) => handleUpdatePhase(phase.id, { fromDate: e.target.value })}
                        className="w-full py-1.5 px-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Phòng học giai đoạn này (Tùy chọn)
                      </label>
                      <input
                        type="text"
                        placeholder="Để trống nếu học cùng phòng cũ"
                        value={phase.room || ''}
                        onChange={(e) => handleUpdatePhase(phase.id, { room: e.target.value })}
                        className="w-full py-1.5 px-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                      />
                    </div>
                  </div>

                  {/* Slot selector for this phase */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-[11px] font-semibold text-slate-700">
                        Chọn các buổi dạy của giai đoạn này:
                      </label>
                      <span className="text-[11px] font-mono font-bold text-purple-800 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                        {phaseSummary || 'Chưa chọn'} ({phase.scheduleSlots?.length || 0} buổi/tuần)
                      </span>
                    </div>

                    {/* Quick presets for this phase */}
                    <div className="flex flex-wrap items-center gap-1 mb-2">
                      <span className="text-[10px] text-slate-500 font-medium">Gợi ý nhanh:</span>
                      {['SC7', 'S7', 'C7', 'SC6', 'S6', 'C6', 'SC56', 'S5,6', 'C5,6', 'SC4', 'S2,3,4', 'C2,3,4'].map((code) => (
                        <button
                          key={code}
                          type="button"
                          onClick={() => {
                            const parsed = parseSlotShorthand(code);
                            if (parsed.length > 0) {
                              handleUpdatePhase(phase.id, { scheduleSlots: parsed });
                            }
                          }}
                          className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold border transition-colors cursor-pointer ${
                            phaseSummary === code.replace(/[\s,]+/g, '')
                              ? 'bg-purple-600 text-white border-purple-600'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-purple-50 hover:border-purple-300'
                          }`}
                        >
                          {code}
                        </button>
                      ))}
                    </div>

                    {/* Quick Shorthand input for phase */}
                    <div className="flex items-center gap-2 mb-2">
                      <input
                        type="text"
                        placeholder="Hoặc gõ mã viết tắt (VD: SC7, C7, S56...)"
                        className="py-1 px-2.5 text-xs font-mono font-bold bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-400 text-slate-900 w-56 placeholder:font-normal placeholder:text-slate-400"
                        onChange={(e) => {
                          const parsed = parseSlotShorthand(e.target.value);
                          if (parsed.length > 0) {
                            handleUpdatePhase(phase.id, { scheduleSlots: parsed });
                          }
                        }}
                      />
                      <span className="text-[10px] text-slate-400">Tự động nhận diện khi gõ xong</span>
                    </div>

                    {/* Slot buttons table */}
                    <div className="grid grid-cols-7 gap-1">
                      {DAYS.map((d) => {
                        const isS = (phase.scheduleSlots || []).includes(d.sSlot);
                        const isC = (phase.scheduleSlots || []).includes(d.cSlot);
                        return (
                          <div key={d.key} className="flex flex-col gap-1 text-center">
                            <span className="text-[10px] font-bold text-slate-500">{d.name}</span>
                            <button
                              type="button"
                              onClick={() => {
                                const current = phase.scheduleSlots || [];
                                const next = current.includes(d.sSlot)
                                  ? current.filter((s) => s !== d.sSlot)
                                  : [...current, d.sSlot];
                                handleUpdatePhase(phase.id, { scheduleSlots: next });
                              }}
                              className={`py-1 text-[10px] font-bold rounded border transition-all cursor-pointer ${
                                isS
                                  ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                              }`}
                              title={`Sáng ${d.name}`}
                            >
                              S
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const current = phase.scheduleSlots || [];
                                const next = current.includes(d.cSlot)
                                  ? current.filter((s) => s !== d.cSlot)
                                  : [...current, d.cSlot];
                                handleUpdatePhase(phase.id, { scheduleSlots: next });
                              }}
                              className={`py-1 text-[10px] font-bold rounded border transition-all cursor-pointer ${
                                isC
                                  ? 'bg-purple-600 text-white border-purple-700 shadow-xs'
                                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                              }`}
                              title={`Chiều ${d.name}`}
                            >
                              C
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Ghi chú giai đoạn (Tùy chọn)
                    </label>
                    <input
                      type="text"
                      placeholder="Ví dụ: Đổi sang dạy cả Sáng + Chiều Thứ 7"
                      value={phase.note || ''}
                      onChange={(e) => handleUpdatePhase(phase.id, { note: e.target.value })}
                      className="w-full py-1.5 px-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pause Intervals Section - Spacious, unblocked, no reason field */}
      <div className="pt-3 border-t border-sky-200/70 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-900 block">
              Khoảng Thời Gian Tạm Ngưng Dạy (Né Không Tính Tiết)
            </span>
            <span className="text-[11px] text-slate-500 block">
              Hệ thống sẽ tự động trừ các buổi dạy rơi vào những ngày này
            </span>
            <span className="text-[10px] text-emerald-700 font-semibold block mt-0.5">
              💡 Nếu chỉ ngưng đúng 1 ngày: bạn chỉ cần chọn "Từ ngày" và "Đến ngày" là cùng một ngày đó.
            </span>
          </div>

          <button
            type="button"
            onClick={handleAddPause}
            className="px-3 py-1.5 bg-white hover:bg-sky-50 text-sky-800 border border-sky-300 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5 text-sky-600" />
            <span>+ Thêm khoảng ngưng</span>
          </button>
        </div>

        {pauseIntervals.length === 0 ? (
          <div className="text-[11px] text-slate-400 italic bg-white/70 p-3 rounded-xl border border-dashed border-sky-200 text-center">
            Chưa thiết lập khoảng ngưng nào (dạy liên tục các tuần).
          </div>
        ) : (
          <div className="space-y-2.5">
            {pauseIntervals.map((pause, idx) => (
              <div
                key={pause.id}
                className="bg-white p-3 rounded-xl border border-sky-200 shadow-2xs space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                    <span className="text-xs font-bold text-sky-950">
                      Khoảng ngưng #{idx + 1}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeletePause(pause.id)}
                    className="text-xs text-rose-600 hover:text-rose-800 font-semibold flex items-center gap-1 px-2 py-0.5 hover:bg-rose-50 rounded-md cursor-pointer transition-colors"
                    title="Xóa khoảng ngưng này"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Xóa</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 items-end">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Từ ngày (Bắt đầu) *
                    </label>
                    <input
                      type="date"
                      required
                      value={pause.fromDate}
                      onChange={(e) => handleUpdatePause(pause.id, 'fromDate', e.target.value)}
                      className="w-full py-1.5 px-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Đến ngày (Kết thúc) *
                    </label>
                    <input
                      type="date"
                      required
                      value={pause.toDate}
                      onChange={(e) => handleUpdatePause(pause.id, 'toDate', e.target.value)}
                      className="w-full py-1.5 px-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Buổi ngưng dạy *
                    </label>
                    <div className="grid grid-cols-3 gap-1">
                      <button
                        type="button"
                        onClick={() => handleUpdatePause(pause.id, 'session', 'ALL')}
                        className={`py-1.5 px-1 text-xs font-bold rounded-lg border transition-all cursor-pointer text-center ${
                          (pause.session || 'ALL') === 'ALL'
                            ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        Cả ngày
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdatePause(pause.id, 'session', 'S')}
                        className={`py-1.5 px-1 text-xs font-bold rounded-lg border transition-all cursor-pointer text-center ${
                          pause.session === 'S'
                            ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        Sáng
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdatePause(pause.id, 'session', 'C')}
                        className={`py-1.5 px-1 text-xs font-bold rounded-lg border transition-all cursor-pointer text-center ${
                          pause.session === 'C'
                            ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        Chiều
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
