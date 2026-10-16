/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Award, CheckCircle, TrendingUp, Cpu } from 'lucide-react';

export default function StudentProgress() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Cây tiến trình rèn luyện cá nhân</h1>
        <p className="text-sm text-slate-500">Định lượng mức độ phủ kín kỹ năng và lịch sử tích lũy điểm số.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center gap-1.5 border-b pb-2">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-slate-800 text-base">Học phần Toán lớp 6 (Kết nối tri thức)</h3>
          </div>

          <div className="space-y-4 font-semibold text-xs leading-relaxed">
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-500 mb-1">
                <span>Tiến độ hoàn thành chuyên đề</span>
                <span>75%</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border">
                <div className="bg-emerald-500 h-2.5 rounded-full" style={{ width: '75%' }}></div>
              </div>
            </div>

            <div className="text-slate-400 space-y-1.5 font-medium">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                <span>Đã thông học: Chương 1: Tập hợp số tự nhiên</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                <span>Cần bổ sung rèn luyện: Chương 2: Tính chia hết</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-1.5 border-b pb-2">
              <Award className="w-5 h-5 text-amber-505 text-amber-500" />
              <h3 className="font-bold text-slate-800 text-base">Thống kê huy chương đạt điểm số chuẩn</h3>
            </div>

            <div className="flex items-center justify-between text-slate-700 text-xs font-bold bg-slate-50 p-3 rounded-lg border">
              <span>Bài rèn luyện Chương 1 đợt 1:</span>
              <span className="text-emerald-600 font-extrabold text-sm">10.0 Điểm Tuyệt Đối</span>
            </div>
          </div>

          <div className="text-[11px] text-zinc-400 bg-emerald-50/50 p-2.5 rounded border border-emerald-100 flex items-center gap-1.5 font-semibold text-emerald-800 leading-relaxed mt-4">
            <Cpu className="w-4 h-4 text-emerald-600 animate-spin" />
            Lộ trình học tập tiếp theo sẽ được hệ thống gợi ý thích ứng theo năng lực.
          </div>
        </div>
      </div>
    </div>
  );
}
