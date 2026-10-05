import React from 'react';
import {
  AlertCircle,
  Award,
  BookCheck,
  CheckCircle2,
  Clock,
  GraduationCap,
  Sparkles,
  TrendingUp,
  Users
} from 'lucide-react';
import { Semester } from '../types';

interface DashboardStatsProps {
  semester: Semester;
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({ semester }) => {
  const teachers = semester.teachers || [];

  // Metrics computation
  const totalTeachers = teachers.length;
  const fulltimeTeachers = teachers.filter((t) => t.position?.toLowerCase().includes('cơ hữu') || !t.position?.toLowerCase().includes('thỉnh giảng')).length;
  const visitingTeachers = totalTeachers - fulltimeTeachers;

  const allCourses = teachers.flatMap((t) => t.courses || []);
  const totalCourses = allCourses.length;

  let totalTheory = 0;
  let totalPractice = 0;
  let totalHours = 0;
  let totalCompletedHours = 0;
  let completedCount = 0;
  let inProgressCount = 0;

  allCourses.forEach((c) => {
    const lt = c.theoryHours || 0;
    const th = c.practiceHours || 0;
    const cTotal = lt + th;
    const cDone = c.completedHours || 0;

    totalTheory += lt;
    totalPractice += th;
    totalHours += cTotal;
    totalCompletedHours += cDone;

    if (cDone >= cTotal && cTotal > 0) completedCount++;
    else inProgressCount++;
  });

  totalTheory = Math.round(totalTheory * 100) / 100;
  totalPractice = Math.round(totalPractice * 100) / 100;
  totalHours = Math.round(totalHours * 100) / 100;
  totalCompletedHours = Math.round(totalCompletedHours * 100) / 100;

  const completionPercent = totalHours > 0 ? Math.min(100, Math.round((totalCompletedHours / totalHours) * 100)) : 0;
  const courseFinishRate = totalCourses > 0 ? Math.round((completedCount / totalCourses) * 100) : 0;

  // Fulltime vs Visiting workload hours
  let fulltimeHours = 0;
  let visitingHours = 0;
  teachers.forEach((t) => {
    const tHours = (t.courses || []).reduce(
      (sum, c) => sum + (c.theoryHours || 0) + (c.practiceHours || 0),
      0
    );
    if (t.position?.toLowerCase().includes('cơ hữu')) {
      fulltimeHours += tHours;
    } else {
      visitingHours += tHours;
    }
  });

  fulltimeHours = Math.round(fulltimeHours * 100) / 100;
  visitingHours = Math.round(visitingHours * 100) / 100;

  return (
    <section className="mb-6 space-y-4">
      {/* 4 Primary KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Giảng viên */}
        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Giảng Viên</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-800 tracking-tight">{totalTeachers}</span>
            <span className="text-xs text-slate-500">thầy / cô</span>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-500">
            <span className="font-medium text-blue-700">{fulltimeTeachers} Cơ hữu</span>
            <span>·</span>
            <span className="font-medium text-amber-700">{visitingTeachers} Thỉnh giảng</span>
          </div>
        </div>

        {/* KPI 2: Môn học & Lớp */}
        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Lớp - Môn Học</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <GraduationCap className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-800 tracking-tight">{totalCourses}</span>
            <span className="text-xs text-slate-500">phân công</span>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-emerald-700 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> {completedCount} đã xong
            </span>
            <span className="text-blue-700 font-medium flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-blue-600" /> {inProgressCount} đang dạy
            </span>
          </div>
        </div>

        {/* KPI 3: Tổng khối lượng tiết */}
        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Khối Lượng Tiết</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <BookCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-800 tracking-tight">{totalHours}</span>
            <span className="text-xs text-slate-500">tiết giảng</span>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-500">
            <span title="Lý thuyết">{totalTheory} tiết LT</span>
            <span>·</span>
            <span title="Thực hành">{totalPractice} tiết TH</span>
            <span>·</span>
            <span className="font-semibold text-slate-700">{totalCompletedHours}h đã dạy</span>
          </div>
        </div>

        {/* KPI 4: Tiến độ hoàn thành */}
        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Tiến Độ Kỳ Học</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-600 tracking-tight">{completionPercent}%</span>
            <span className="text-xs text-slate-500">hoàn thành giờ dạy</span>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Tỉ lệ kết thúc môn: <strong className="text-slate-700">{courseFinishRate}%</strong></span>
            {completionPercent >= 80 ? (
              <span className="text-emerald-700 font-medium flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Chuẩn bị tổng kết
              </span>
            ) : (
              <span className="text-blue-700 font-medium">Đang triển khai</span>
            )}
          </div>
        </div>
      </div>

      {/* Visual Progress Bar & Workload Breakdown */}
      <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-800">
              Tiến độ Giảng dạy Toàn Học kỳ
            </span>
            <span className="text-xs text-slate-500">
              ({totalCompletedHours} / {totalHours} tiết · {completedCount}/{totalCourses} môn hoàn thành)
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span className="text-slate-600">Đã hoàn thành ({completedCount})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
              <span className="text-slate-600">Đang dạy ({inProgressCount})</span>
            </div>
          </div>
        </div>

        {/* Multi-segment progress bar */}
        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex">
          <div
            className="h-full bg-emerald-500 transition-all duration-500"
            style={{ width: `${totalCourses > 0 ? (completedCount / totalCourses) * 100 : 0}%` }}
            title={`Đã hoàn thành: ${completedCount} môn`}
          />
          <div
            className="h-full bg-blue-500 transition-all duration-500"
            style={{ width: `${totalCourses > 0 ? (inProgressCount / totalCourses) * 100 : 0}%` }}
            title={`Đang dạy: ${inProgressCount} môn`}
          />
        </div>

        {/* Quick workload distribution footer */}
        <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
          <div className="flex items-center gap-3">
            <span>Phân bổ khối lượng:</span>
            <span className="text-slate-700 font-medium">
              Cơ hữu: <strong>{fulltimeHours}</strong> tiết ({totalHours > 0 ? Math.round((fulltimeHours / totalHours) * 100) : 0}%)
            </span>
            <span>·</span>
            <span className="text-slate-700 font-medium">
              Thỉnh giảng: <strong>{visitingHours}</strong> tiết ({totalHours > 0 ? Math.round((visitingHours / totalHours) * 100) : 0}%)
            </span>
          </div>
          <div className="flex items-center gap-1 text-slate-400">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Dữ liệu tự động cập nhật ngay khi thay đổi trạng thái môn học</span>
          </div>
        </div>
      </div>

      {/* Teachers Workload Ranking & Progress Detail Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top Teachers Workload */}
        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Award className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">Khối Lượng Giảng Dạy Từng Giảng Viên</h4>
                <p className="text-[11px] text-slate-500">Thống kê số môn và tổng số tiết trong học kỳ</p>
              </div>
            </div>
            <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
              {teachers.length} Thầy / Cô
            </span>
          </div>

          {teachers.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-4 text-center">Chưa có giảng viên trong kỳ này.</p>
          ) : (
            <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
              {[...teachers]
                .sort((a, b) => {
                  const aHours = (a.courses || []).reduce((s, c) => s + (c.theoryHours || 0) + (c.practiceHours || 0), 0);
                  const bHours = (b.courses || []).reduce((s, c) => s + (c.theoryHours || 0) + (c.practiceHours || 0), 0);
                  return bHours - aHours;
                })
                .map((t, idx) => {
                  const tCourses = t.courses || [];
                  const tTotal = tCourses.reduce((s, c) => s + (c.theoryHours || 0) + (c.practiceHours || 0), 0);
                  const tDone = tCourses.reduce((s, c) => s + (c.completedHours || 0), 0);
                  const tPct = tTotal > 0 ? Math.round((tDone / tTotal) * 100) : 0;

                  return (
                    <div key={t.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 font-bold text-[10px] flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <div className="min-w-0">
                          <div className="font-bold text-slate-900 truncate">{t.name}</div>
                          <div className="text-[10px] text-slate-400">
                            {t.position} · {tCourses.length} môn
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="font-bold text-slate-800">
                          {tDone} / {tTotal} tiết
                        </div>
                        <div className="text-[10px] font-semibold text-emerald-600">
                          {tPct}% hoàn thành
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>

        {/* Classes & Course Assignments Overview */}
        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <GraduationCap className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">Danh Sách Lớp & Môn Đang Triển Khai</h4>
                <p className="text-[11px] text-slate-500">Tình trạng dạy thực tế của từng phân công</p>
              </div>
            </div>
            <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
              {allCourses.length} Phân công
            </span>
          </div>

          {allCourses.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-4 text-center">Chưa có môn học nào được phân công.</p>
          ) : (
            <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
              {allCourses.slice(0, 15).map((c) => {
                const tot = (c.theoryHours || 0) + (c.practiceHours || 0);
                const isFinished = (c.completedHours || 0) >= tot && tot > 0;
                return (
                  <div key={c.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                    <div className="min-w-0">
                      <div className="font-bold text-slate-900 truncate">{c.subjectName}</div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                        <span className="font-mono font-semibold bg-slate-100 px-1 rounded text-slate-700">{c.className}</span>
                        <span>·</span>
                        <span>{tot} tiết ({c.theoryHours} LT + {c.practiceHours} TH)</span>
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      {isFinished ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          Đã xong
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                          {c.completedHours || 0}/{tot}h
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
