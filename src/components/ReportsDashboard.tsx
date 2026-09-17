/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Class, Submission } from '../types';
import { TrendingUp, AlertTriangle, HelpCircle, Award } from 'lucide-react';

interface ReportsDashboardProps {
  classes: Class[];
  submissions: Submission[];
}

export default function ReportsDashboard({ classes, submissions }: ReportsDashboardProps) {
  const totalSub = submissions.length;
  const avgClassScore = totalSub > 0 ? (submissions.reduce((acc, s) => acc + s.score, 0) / totalSub).toFixed(1) : '0.0';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Biểu đồ & Báo cáo kết quả rèn luyện học viên</h1>
        <p className="text-sm text-slate-500">Phân tích sâu về phổ điểm, định vị các đơn vị kỹ năng chuẩn.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main statistics block with bar charts */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-100 shadow-sm space-y-6">
          <div className="flex items-center gap-1.5 border-b pb-2">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-slate-800 text-base">Thống kê điểm trung bình theo lớp rèn luyện</h3>
          </div>

          <div className="space-y-4 pt-2">
            {classes.map((cls) => {
              const totalScore = cls.students.reduce((s, st) => s + (st.avgScore || 0), 0);
              const avgScore = cls.students.length > 0 ? totalScore / cls.students.length : 0;
              const percentWidth = Math.min(100, Math.max(5, avgScore * 10));

              return (
                <div key={cls.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-650">
                    <span className="font-bold text-slate-700">{cls.name}</span>
                    <span>{avgScore.toFixed(1)} / 10đ TB</span>
                  </div>
                  <div className="w-full bg-slate-150 h-3 rounded-full overflow-hidden bg-slate-100 border">
                    <div
                      className="bg-emerald-500 h-3 rounded-full transition-all duration-750"
                      style={{ width: `${percentWidth}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}

            {classes.length === 0 && (
              <p className="text-slate-400 text-xs italic text-center py-6">Chưa ghi nhận lớp học nào.</p>
            )}
          </div>
        </div>

        {/* Side statistics: weak chapters checklist alert indicator box */}
        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center gap-1.5 border-b pb-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <h3 className="font-bold text-slate-800 text-base">Cảnh báo lỗ hổng kiến thức chuẩn</h3>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 bg-red-50 text-red-800 rounded-lg border border-red-100 space-y-1.5 shadow-sm">
              <span className="font-extrabold block uppercase tracking-widest text-[9px] text-red-600">Báo động kiến thức</span>
              <p className="font-bold text-slate-800">Chương 1 Toán 6: Tập hợp số tự nhiên</p>
              <p className="text-slate-600 font-medium leading-relaxed">
                Tỷ lệ làm sai phần Mệnh đề trắc nghiệm Đúng/Sai của Lớp 6A1 lên tới <strong className="text-red-600">54%</strong>.
              </p>
            </div>

            <div className="p-3 bg-amber-50 text-amber-800 rounded-lg border border-amber-100 space-y-1.5 shadow-sm">
              <span className="font-extrabold block uppercase tracking-widest text-[9px] text-amber-600">Phản hồi cảnh báo</span>
              <p className="font-bold text-slate-800">Bài 2 Tin học 8: Truy cập thông tin</p>
              <p className="text-slate-600 font-medium leading-relaxed">
                Học viên còn chủ quan mơ hồ khi bấm xác thực tài liệu số trực tuyến.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
