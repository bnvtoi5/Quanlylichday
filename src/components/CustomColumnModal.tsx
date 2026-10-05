import React, { useState } from 'react';
import { Columns, Plus, Sparkles, Trash2, X } from 'lucide-react';
import { CustomColumn } from '../types';
import { ConfirmModal } from './ConfirmModal';

interface CustomColumnModalProps {
  isOpen: boolean;
  onClose: () => void;
  customColumns: CustomColumn[];
  onAddColumn: (name: string, type: 'text' | 'number' | 'boolean' | 'date', defaultValue?: any) => void;
  onDeleteColumn: (columnId: string) => void;
}

export const CustomColumnModal: React.FC<CustomColumnModalProps> = ({
  isOpen,
  onClose,
  customColumns,
  onAddColumn,
  onDeleteColumn,
}) => {
  const [colName, setColName] = useState('');
  const [colType, setColType] = useState<'text' | 'number' | 'boolean' | 'date'>('text');
  const [defaultVal, setDefaultVal] = useState('');

  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!colName.trim()) return;

    let parsedVal: any = defaultVal;
    if (colType === 'boolean') {
      parsedVal = defaultVal === 'true';
    } else if (colType === 'number') {
      parsedVal = Number(defaultVal) || 0;
    }

    onAddColumn(colName.trim(), colType, parsedVal);
    setColName('');
    setDefaultVal('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center">
              <Columns className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Tùy Biến Thêm Cột Mới</h2>
              <p className="text-xs text-slate-500">
                Tự do tạo thêm các cột dữ liệu theo đặc thù môn học & báo cáo Excel
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

        {/* Existing columns list */}
        <div className="my-4 space-y-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Các cột đang hiển thị ({customColumns.length})
          </span>

          {customColumns.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-2">
              Chưa có cột tùy biến nào. Thêm cột mới bên dưới.
            </p>
          ) : (
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {customColumns.map((col) => (
                <div
                  key={col.id}
                  className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-800">{col.name}</span>
                    <span className="text-[11px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded">
                      {col.type === 'boolean'
                        ? 'Ô tích (Có/Không)'
                        : col.type === 'number'
                        ? 'Dạng số'
                        : col.type === 'date'
                        ? 'Ngày tháng'
                        : 'Văn bản'}
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      setConfirmState({
                        isOpen: true,
                        title: `Xóa Cột "${col.name}"?`,
                        message: `Bạn có chắc muốn xóa cột "${col.name}" khỏi bảng và báo cáo Excel?`,
                        onConfirm: () => onDeleteColumn(col.id),
                      });
                    }}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                    title="Xóa cột này"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add new column form */}
        <form onSubmit={handleSubmit} className="border-t border-slate-100 pt-4 space-y-3 text-xs">
          <div className="font-bold text-slate-800 flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5 text-emerald-600" />
            <span>Thêm Cột Mới</span>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Tên Cột *</label>
            <input
              type="text"
              required
              placeholder="Ví dụ: Phòng học, Hình thức thi, Đã nộp đề cương, Tuần học..."
              value={colName}
              onChange={(e) => setColName(e.target.value)}
              className="w-full py-2 px-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-slate-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Kiểu Dữ Liệu</label>
              <select
                value={colType}
                onChange={(e) => setColType(e.target.value as any)}
                className="w-full py-2 px-3 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none"
              >
                <option value="text">Văn bản (Text)</option>
                <option value="boolean">Ô tích Có / Không (Checkbox)</option>
                <option value="number">Số lượng (Number)</option>
                <option value="date">Ngày tháng (Date)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Giá Trị Mặc Định</label>
              {colType === 'boolean' ? (
                <select
                  value={defaultVal}
                  onChange={(e) => setDefaultVal(e.target.value)}
                  className="w-full py-2 px-3 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none"
                >
                  <option value="false">Chưa tích (False)</option>
                  <option value="true">Đã tích (True)</option>
                </select>
              ) : (
                <input
                  type={colType === 'number' ? 'number' : 'text'}
                  placeholder="Để trống hoặc nhập..."
                  value={defaultVal}
                  onChange={(e) => setDefaultVal(e.target.value)}
                  className="w-full py-2 px-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-slate-900"
                />
              )}
            </div>
          </div>

          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 flex items-center gap-2 text-[11px] text-slate-500">
            <Sparkles className="w-3.5 h-3.5 text-sky-500 shrink-0" />
            <span>Cột mới sẽ xuất hiện trực tiếp trên bảng và tự động đưa vào file Excel khi xuất!</span>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Đóng
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold transition-colors cursor-pointer shadow-xs flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Tạo Cột</span>
            </button>
          </div>
        </form>
      </div>

      <ConfirmModal
        isOpen={confirmState.isOpen}
        onClose={() => setConfirmState((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmState.onConfirm}
        title={confirmState.title}
        message={confirmState.message}
      />
    </div>
  );
};
