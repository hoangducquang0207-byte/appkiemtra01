/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Sparkles, CheckSquare, Plus, ArrowRight, AlertTriangle, RefreshCw } from 'lucide-react';

interface AISupportProps {
  onAutoAssignRemedial: () => void;
}

export default function AISupport({ onAutoAssignRemedial }: AISupportProps) {
  const [analyzed, setAnalyzed] = useState(false);
  const [isRunning, setIsRunning] = useState(false);

  const handleCreateRemedialReport = () => {
    setIsRunning(true);
    setTimeout(() => {
      setAnalyzed(true);
      setIsRunning(false);
    }, 1500);
  };

  const handleDispatchDrills = () => {
    onAutoAssignRemedial();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Trí tuệ nhân tạo (AI) bồi dưỡng & Phụ đạo</h1>
        <p className="text-sm text-slate-500">AI tự động phân tích điểm kết quả, định lượng yếu điểm rèn luyện, bồi dưỡng khắc phục tức thì.</p>
      </div>

      <div className="bg-gradient-to-tr from-slate-950 via-slate-900 to-indigo-950 text-white rounded-2xl p-6 shadow-xl relative overflow-hidden space-y-4">
        <div className="absolute -right-4 -bottom-10 opacity-5">
          <Sparkles className="w-64 h-64 text-emerald-500" />
        </div>

        <div className="flex items-center gap-2 text-emerald-400">
          <Sparkles className="w-6 h-6 animate-pulse" />
          <span className="text-xs font-extrabold uppercase tracking-widest">Bồi dưỡng và rèn luyện thông minh bằng Trí tuệ QUICK-AI</span>
        </div>

        <h2 className="font-bold text-xl leading-snug">Lập kế hoạch phụ đạo & Phục hồi kiến thức tức thì</h2>
        <p className="text-slate-400 text-sm leading-relaxed max-w-2xl">
          Nhờ các thuật toán bồi dưỡng chuyên biệt của QUICKQUIZ, hệ thống hỗ trợ truy vết chính xác những mảng kiến thức lệch pha của nhóm rèn luyện để bù đắp nhanh chóng.
        </p>

        <div className="flex flex-wrap gap-2 pt-2">
          <button
            onClick={handleCreateRemedialReport}
            disabled={isRunning}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-all shadow-md flex items-center gap-1.5"
          >
            {isRunning ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Đang chẩn đoán học vụ...
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                AI phân tích lớp & Tạo kế hoạch phụ đạo
              </>
            )}
          </button>
        </div>
      </div>

      {analyzed && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
          {/* Diagnostic report card */}
          <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 text-base border-b pb-2 flex items-center gap-1.5 text-emerald-600">
              <CheckSquare className="w-5 h-5" />
              Kết quả chẩn đoán chi tiết của AI
            </h3>

            <div className="space-y-3 font-semibold text-xs leading-relaxed">
              <div className="bg-slate-50 p-3.5 rounded-lg space-y-1">
                <span className="text-[10px] text-zinc-400 block uppercase font-bold">Điểm nghẽn liên quan:</span>
                <p className="text-sm text-slate-800 font-bold">
                  Lớp học đang gặp lỗ hổng lớn về chủ đề 'Mệnh đề Đúng Sai' và 'Thứ tự thực hiện phép tính' (Tỉ lệ sai 54%).
                </p>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-lg space-y-1 text-slate-600 font-medium">
                <span className="text-[10px] text-zinc-400 block uppercase font-bold">Hành trình ôn tập khuyến nghị:</span>
                <p>1. Thiết lập 5 câu trắc nghiệm Đúng/Sai bám sát tính chất giao hoán tròn trăm số học.</p>
                <p className="mt-1">2. Tổ chức ôn tập phòng luyện trực tuyến 15 phút đầu giờ dưới hình thức đố vui nhanh.</p>
              </div>
            </div>
          </div>

          {/* Action col with vulnerable participants and drill scheduler */}
          <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex flex-col justify-between gap-4">
            <div className="space-y-3">
              <h3 className="font-bold text-slate-800 text-base border-b pb-2">Học sinh được phân bổ bồi dưỡng bổ trợ</h3>
              <div className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                <div className="py-3 flex items-center justify-between">
                  <span>Trần Thị Mỹ Linh</span>
                  <span className="px-2 py-0.5 bg-red-50 text-red-600 border border-red-100 rounded-full font-bold uppercase text-[9px]">
                    Lỗ hổng: lớn
                  </span>
                </div>
                <div className="py-3 flex items-center justify-between">
                  <span>Lê Thanh Hải</span>
                  <span className="px-2 py-0.5 bg-red-50 text-red-600 border border-red-100 rounded-full font-bold uppercase text-[9px]">
                    Lỗ hổng: lớn
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={handleDispatchDrills}
              className="w-full py-3 bg-slate-900 hover:bg-slate-850 text-white font-bold text-xs rounded-xl shadow-md transition-all uppercase flex items-center justify-center gap-1.5"
            >
              AI TỰ ĐỘNG GIAO BÀI ÔN TẬP KẾT CẤU CHUYÊN SÂU LẬP TỨC
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
