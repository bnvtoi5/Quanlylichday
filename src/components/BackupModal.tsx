import React, { useRef, useState } from 'react';
import {
  Clock,
  Download,
  FolderSync,
  History,
  RotateCcw,
  Sparkles,
  Trash2,
  Upload,
  X
} from 'lucide-react';
import { Semester, SnapshotBackup } from '../types';
import { ConfirmModal } from './ConfirmModal';

interface BackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeSemester: Semester;
  snapshots: SnapshotBackup[];
  onCreateSnapshot: () => void;
  onRestoreSnapshot: (snapshot: SnapshotBackup) => void;
  onDeleteSnapshot: (snapshotId: string) => void;
  onDownloadJsonBackup: () => void;
  onImportJsonBackup: (importedData: any) => void;
  onResetToCleanSlate: () => void;
}

export const BackupModal: React.FC<BackupModalProps> = ({
  isOpen,
  onClose,
  activeSemester,
  snapshots,
  onCreateSnapshot,
  onRestoreSnapshot,
  onDeleteSnapshot,
  onDownloadJsonBackup,
  onImportJsonBackup,
  onResetToCleanSlate,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.semesters && Array.isArray(parsed.semesters)) {
          onImportJsonBackup(parsed);
          onClose();
        } else {
          setErrorMessage('Tệp sao lưu không hợp lệ. Vui lòng chọn tệp JSON được xuất từ EduTrack.');
        }
      } catch (err) {
        setErrorMessage('Lỗi đọc tệp sao lưu. Vui lòng kiểm tra lại định dạng file JSON.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
              <FolderSync className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Sao Lưu & Phục Hồi Dữ Liệu</h2>
              <p className="text-xs text-slate-500">
                Bảo vệ dữ liệu giảng dạy từng kỳ, chống mất mát thông tin khi thay đổi
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

        {errorMessage && (
          <div className="mt-3 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs font-medium flex items-center justify-between">
            <span>{errorMessage}</span>
            <button onClick={() => setErrorMessage(null)} className="text-rose-500 hover:text-rose-800">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="my-4 space-y-5 text-xs">
          {/* Quick Snapshot Action */}
          <div className="bg-amber-50/70 p-4 rounded-xl border border-amber-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-amber-900 text-sm block">
                  Điểm Phục Hồi Nhanh (Snapshot)
                </span>
                <p className="text-[11px] text-amber-800 mt-0.5">
                  Lưu lại trạng thái hiện tại của "{activeSemester.name}" trước khi cập nhật lớn hoặc trước khi họp.
                </p>
              </div>
              <button
                onClick={onCreateSnapshot}
                className="px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-bold shadow-xs cursor-pointer flex items-center gap-1.5 transition-colors shrink-0"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Tạo Snapshot Ngay</span>
              </button>
            </div>

            {/* List of recent snapshots */}
            <div className="pt-2 border-t border-amber-200/60">
              <span className="font-semibold text-amber-900 text-[11px] uppercase tracking-wider block mb-2">
                Lịch sử các bản snapshot đã lưu ({snapshots.length})
              </span>

              {snapshots.length === 0 ? (
                <p className="text-amber-700 italic text-[11px]">Chưa có bản snapshot nào được lưu.</p>
              ) : (
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {snapshots.map((snap) => {
                    const dateFormatted = new Date(snap.timestamp).toLocaleString('vi-VN', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    });

                    return (
                      <div
                        key={snap.id}
                        className="bg-white p-2.5 rounded-lg border border-amber-200/60 flex items-center justify-between gap-2 shadow-2xs"
                      >
                        <div className="space-y-0.5">
                          <div className="font-semibold text-slate-800 flex items-center gap-2">
                            <span>{snap.semesterName}</span>
                            <span className="text-[10px] text-slate-400 font-normal">
                              ({snap.teacherCount} GV · {snap.courseCount} môn)
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-500 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>{dateFormatted}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              setConfirmState({
                                isOpen: true,
                                title: 'Khôi phục bản Snapshot?',
                                message: `Bạn có chắc muốn khôi phục học kỳ về bản snapshot lúc ${dateFormatted}? Dữ liệu hiện tại sẽ được thay thế.`,
                                onConfirm: () => {
                                  onRestoreSnapshot(snap);
                                  onClose();
                                },
                              });
                            }}
                            className="px-2 py-1 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded text-[11px] font-semibold cursor-pointer"
                          >
                            Khôi phục
                          </button>
                          <button
                            onClick={() => onDeleteSnapshot(snap.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                            title="Xóa bản snapshot này"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Export & Import File Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Download JSON */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col justify-between">
              <div>
                <span className="font-bold text-slate-900 block mb-1">Xuất Tệp Sao Lưu (.JSON)</span>
                <p className="text-[11px] text-slate-500 mb-3">
                  Tải toàn bộ dữ liệu gồm các học kỳ, phân công và danh mục về lưu trên máy tính.
                </p>
              </div>
              <button
                onClick={onDownloadJsonBackup}
                className="w-full py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Tải File Sao Lưu Về</span>
              </button>
            </div>

            {/* Import JSON */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col justify-between">
              <div>
                <span className="font-bold text-slate-900 block mb-1">Khôi Phục Từ File (.JSON)</span>
                <p className="text-[11px] text-slate-500 mb-3">
                  Nhập dữ liệu đã lưu từ máy tính để tiếp tục làm việc trên máy khác.
                </p>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                accept=".json"
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-2 px-3 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5 text-slate-500" />
                <span>Chọn File JSON Để Nạp</span>
              </button>
            </div>
          </div>

          {/* Reset Clean Slate */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] text-slate-500">
              Làm sạch trắng toàn bộ database để tự nhập thử nghiệm?
            </span>
            <button
              onClick={() => {
                setConfirmState({
                  isOpen: true,
                  title: 'Xóa Sạch Toàn Bộ Database?',
                  message: 'Hành động này sẽ xóa toàn bộ các học kỳ và danh mục, trả về trạng thái rỗng sạch sẽ để bạn tự nhập liệu thử nghiệm.',
                  onConfirm: () => {
                    onResetToCleanSlate();
                    onClose();
                  },
                });
              }}
              className="text-rose-600 hover:text-rose-800 text-xs font-semibold underline cursor-pointer"
            >
              Xóa sạch database
            </button>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium cursor-pointer"
          >
            Đóng
          </button>
        </div>
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
