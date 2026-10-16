/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Sparkles, CheckSquare, Plus, ArrowRight, AlertTriangle, RefreshCw, FileText, Image as ImageIcon, BookOpen, Layers } from 'lucide-react';
import { Question } from '../types';
import AIGenerateExamModal from './AIGenerateExamModal';

interface AISupportProps {
  onAutoAssignRemedial: () => void;
  onSaveGeneratedExam: (examTitle: string, subject: string, grade: string, generatedQuestions: Question[]) => void;
}

export default function AISupport({ onAutoAssignRemedial, onSaveGeneratedExam }: AISupportProps) {
  const [analyzed, setAnalyzed] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);

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
        <h1 className="text-2xl font-bold text-slate-800">Trí Tuệ Nhân Tạo (Gemini AI) Biên Soạn Đề Thi & Bồi Dưỡng</h1>
        <p className="text-sm text-slate-500">Tự động phân tích ảnh chụp SGK/văn bản bài học để khởi tạo bộ đề thi trắc nghiệm chuẩn sư phạm.</p>
      </div>

      {/* Main AI Feature Card 1: Automatic Exam Generation from Image/Text */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-emerald-950 text-white rounded-2xl p-6 shadow-xl border border-slate-800 relative overflow-hidden space-y-4">
        <div className="absolute -right-4 -bottom-10 opacity-10">
          <Sparkles className="w-64 h-64 text-emerald-400" />
        </div>

        <div className="flex items-center gap-2 text-emerald-400">
          <Sparkles className="w-5 h-5 animate-pulse" />
          <span className="text-xs font-black uppercase tracking-widest">Tự động Soạn Đề Thi Bằng Gemini AI</span>
        </div>

        <h2 className="font-extrabold text-xl leading-snug">
          Phân Tích Ảnh Chụp SGK / Bài Học & Khởi Tạo Đề Thi Trắc Nghiệm 10 - 20 Câu
        </h2>
        <p className="text-slate-300 text-xs leading-relaxed max-w-2xl">
          Giáo viên chỉ cần tải lên 1 ảnh chụp sách giáo khoa, ghi chú bài giảng hoặc dán đoạn văn bản. Gemini AI sẽ tự động phân tích kiến thức, tạo ngay bộ 10-20 câu hỏi trắc nghiệm chuẩn sư phạm (kèm đáp án và lời giải chi tiết KaTeX) và lưu trực tiếp vào Ngân hàng Đề thi!
        </p>

        <div className="flex flex-wrap gap-3 pt-2">
          <button
            onClick={() => setShowGenerateModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-emerald-500 via-teal-500 to-green-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-lg flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <Sparkles className="w-4 h-4" />
            <span>Khởi Tạo Đề Thi Từ Ảnh / Văn Bản SGK Ngay</span>
          </button>
        </div>
      </div>

      {/* Main AI Feature Card 2: Diagnostic & Remedial Planning */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex items-center gap-2 text-indigo-600">
          <Layers className="w-5 h-5" />
          <h3 className="font-black text-slate-800 text-base">Chẩn Đoán Học Vụ & Lập Kế Hoạch Phụ Đạo Tự Động</h3>
        </div>

        <p className="text-slate-600 text-xs leading-relaxed">
          Nhờ các thuật toán bồi dưỡng chuyên biệt của QUICKQUIZ, hệ thống hỗ trợ truy vết chính xác những mảng kiến thức lệch pha của nhóm rèn luyện để bù đắp nhanh chóng.
        </p>

        <button
          onClick={handleCreateRemedialReport}
          disabled={isRunning}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
        >
          {isRunning ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              Đang chẩn đoán học vụ...
            </>
          ) : (
            <>
              <CheckSquare className="w-3.5 h-3.5" />
              AI Phân Tích Lớp & Tạo Kế Hoạch Phụ Đạo
            </>
          )}
        </button>
      </div>

      {analyzed && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
          {/* Diagnostic report card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <h3 className="font-bold text-slate-800 text-base border-b pb-2 flex items-center gap-1.5 text-emerald-600">
              <CheckSquare className="w-5 h-5" />
              Kết quả chẩn đoán chi tiết của AI
            </h3>

            <div className="space-y-3 font-semibold text-xs leading-relaxed">
              <div className="bg-slate-50 p-3.5 rounded-xl space-y-1 border border-slate-100">
                <span className="text-[10px] text-zinc-400 block uppercase font-bold">Điểm nghẽn liên quan:</span>
                <p className="text-sm text-slate-800 font-bold">
                  Lớp học đang gặp lỗ hổng lớn về chủ đề 'Mệnh đề Đúng Sai' và 'Thứ tự thực hiện phép tính' (Tỉ lệ sai 54%).
                </p>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl space-y-1 text-slate-600 font-medium border border-slate-100">
                <span className="text-[10px] text-zinc-400 block uppercase font-bold">Hành trình ôn tập khuyến nghị:</span>
                <p>1. Thiết lập 5 câu trắc nghiệm Đúng/Sai bám sát tính chất giao hoán tròn trăm số học.</p>
                <p className="mt-1">2. Tổ chức ôn tập phòng luyện trực tuyến 15 phút đầu giờ dưới hình thức đố vui nhanh.</p>
              </div>
            </div>
          </div>

          {/* Action col with vulnerable participants and drill scheduler */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between gap-4">
            <div className="space-y-3">
              <h3 className="font-bold text-slate-800 text-base border-b pb-2">Học sinh được phân bổ bồi dưỡng bổ trợ</h3>
              <p className="text-xs text-slate-600">Tự động khoanh vùng nhóm học viên đạt điểm dưới 5.0 để phát bài ôn tập phục hồi kiến thức.</p>
            </div>

            <button
              onClick={handleDispatchDrills}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Phát Đề Bồi Dưỡng Tự Động Cho Nhóm Yếu</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Modal for AI Exam Generator */}
      {showGenerateModal && (
        <AIGenerateExamModal
          onClose={() => setShowGenerateModal(false)}
          onSaveGeneratedExam={onSaveGeneratedExam}
        />
      )}
    </div>
  );
}
