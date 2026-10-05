import React, { useState, useEffect } from 'react';
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Check,
  ChevronsDown,
  ChevronsUp,
  GraduationCap,
  Layers,
  RotateCcw,
  Search,
  X,
} from 'lucide-react';
import { GanttClassFamilyGroup } from './GanttChart';

interface ReorderClassesModalProps {
  isOpen: boolean;
  onClose: () => void;
  families: GanttClassFamilyGroup[];
  currentOrder: string[];
  onSaveOrder: (newOrder: string[]) => void;
  onToast?: (msg: string) => void;
}

export const ReorderClassesModal: React.FC<ReorderClassesModalProps> = ({
  isOpen,
  onClose,
  families,
  currentOrder,
  onSaveOrder,
  onToast,
}) => {
  const [orderedKeys, setOrderedKeys] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!isOpen) return;

    // Build initial ordered keys list
    const allKeys = families.map((f) => f.parentKey);
    const initial: string[] = [];

    // Add keys from currentOrder first if they exist
    (currentOrder || []).forEach((k) => {
      if (allKeys.includes(k) && !initial.includes(k)) {
        initial.push(k);
      }
    });

    // Add remaining keys alphabetically
    allKeys.forEach((k) => {
      if (!initial.includes(k)) {
        initial.push(k);
      }
    });

    setOrderedKeys(initial);
    setSearchTerm('');
  }, [isOpen, families, currentOrder]);

  if (!isOpen) return null;

  const familyMap = new Map<string, GanttClassFamilyGroup>();
  families.forEach((f) => familyMap.set(f.parentKey, f));

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= orderedKeys.length) return;

    const newKeys = [...orderedKeys];
    const temp = newKeys[index];
    newKeys[index] = newKeys[targetIndex];
    newKeys[targetIndex] = temp;
    setOrderedKeys(newKeys);
  };

  const handleMoveToExtreme = (index: number, position: 'top' | 'bottom') => {
    const newKeys = [...orderedKeys];
    const [item] = newKeys.splice(index, 1);
    if (position === 'top') {
      newKeys.unshift(item);
    } else {
      newKeys.push(item);
    }
    setOrderedKeys(newKeys);
  };

  const handleResetAlphabetical = () => {
    const sorted = [...orderedKeys].sort((a, b) =>
      a.localeCompare(b, 'vi', { sensitivity: 'base', numeric: true })
    );
    setOrderedKeys(sorted);
    if (onToast) onToast('Đã sắp xếp lại thứ tự các lớp theo bảng chữ cái A-Z');
  };

  const handleSave = () => {
    onSaveOrder(orderedKeys);
    if (onToast) onToast('Đã lưu thứ tự hiển thị các lớp thành công!');
    onClose();
  };

  const filteredKeys = orderedKeys.filter((k) => {
    if (!searchTerm.trim()) return true;
    const f = familyMap.get(k);
    const matchKey = k.toLowerCase().includes(searchTerm.toLowerCase());
    const matchMajor = f?.major?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchSub = f?.subgroups.some((s) => s.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchKey || matchMajor || matchSub;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center shadow-2xs">
              <ArrowUpDown className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Sắp Xếp Thứ Tự Các Lớp
              </h2>
              <p className="text-xs text-slate-500">
                Kéo hoặc bấm nút di chuyển để tùy chỉnh thứ tự hiển thị các lớp trên biểu đồ Gantt & Báo cáo
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar: Search & Reset */}
        <div className="p-3 bg-white border-b border-slate-100 flex items-center justify-between gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm tên lớp, ngành..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <button
            type="button"
            onClick={handleResetAlphabetical}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Sắp xếp lại tất cả các lớp theo thứ tự chữ cái A-Z"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>Khôi phục A-Z</span>
          </button>
        </div>

        {/* Class List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 max-h-[55vh]">
          {filteredKeys.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400">
              Không tìm thấy lớp nào phù hợp.
            </div>
          ) : (
            filteredKeys.map((parentKey) => {
              const actualIndex = orderedKeys.indexOf(parentKey);
              const family = familyMap.get(parentKey);
              const isFirst = actualIndex === 0;
              const isLast = actualIndex === orderedKeys.length - 1;

              return (
                <div
                  key={parentKey}
                  className="p-2.5 rounded-xl border border-slate-200 bg-white hover:border-indigo-300 hover:shadow-xs transition-all flex items-center justify-between gap-3 group"
                >
                  {/* Left: Position & Badge */}
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="font-mono text-xs font-bold text-slate-400 w-6 text-center shrink-0">
                      #{actualIndex + 1}
                    </span>

                    <div className="font-mono font-extrabold text-sm text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 flex items-center gap-1.5 shrink-0">
                      <GraduationCap className="w-4 h-4 text-emerald-600" />
                      <span>{parentKey}</span>
                    </div>

                    <div className="truncate min-w-0">
                      <div className="text-xs text-slate-700 font-medium truncate flex items-center gap-1.5">
                        {family?.major && <span>{family.major}</span>}
                        {family?.studentCount && (
                          <span className="text-[11px] text-slate-400">
                            ({family.studentCount} SV)
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 font-medium truncate">
                        {family ? `${family.items.length} môn · ${family.subgroups.length} lớp con (${family.subgroups.join(', ')})` : ''}
                      </div>
                    </div>
                  </div>

                  {/* Right: Move Action Buttons */}
                  <div className="flex items-center gap-1 shrink-0">
                    {/* Move to Top */}
                    <button
                      type="button"
                      disabled={isFirst}
                      onClick={() => handleMoveToExtreme(actualIndex, 'top')}
                      className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none text-slate-600 cursor-pointer transition-colors"
                      title="Chuyển lên đầu danh sách"
                    >
                      <ChevronsUp className="w-4 h-4" />
                    </button>

                    {/* Move Up */}
                    <button
                      type="button"
                      disabled={isFirst}
                      onClick={() => handleMove(actualIndex, 'up')}
                      className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none text-slate-700 font-bold cursor-pointer transition-colors"
                      title="Di chuyển lên 1 bậc"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>

                    {/* Move Down */}
                    <button
                      type="button"
                      disabled={isLast}
                      onClick={() => handleMove(actualIndex, 'down')}
                      className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none text-slate-700 font-bold cursor-pointer transition-colors"
                      title="Di chuyển xuống 1 bậc"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>

                    {/* Move to Bottom */}
                    <button
                      type="button"
                      disabled={isLast}
                      onClick={() => handleMoveToExtreme(actualIndex, 'bottom')}
                      className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none text-slate-600 cursor-pointer transition-colors"
                      title="Chuyển xuống cuối danh sách"
                    >
                      <ChevronsDown className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
          <div className="text-xs text-slate-500 font-medium">
            Tổng cộng: <strong className="text-slate-800">{orderedKeys.length}</strong> lớp
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Lưu thứ tự lớp</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
