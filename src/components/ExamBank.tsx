/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Exam, Question } from '../types';
import { 
  Trash, Calendar, Clipboard, BookOpen, Clock, FileText, Eye, Download, X,
  CheckCircle, HelpCircle, Award, Sparkles, CheckSquare, ChevronRight, Check
} from 'lucide-react';
import MathText from './MathText';
import { generateDocxBlob } from './CreateExamPanel';

interface ExamBankProps {
  exams: Exam[];
  questions: Question[];
  onDeleteExam: (id: string) => void;
  onAssignExam: (id: string) => void;
}

export default function ExamBank({ exams, questions, onDeleteExam, onAssignExam }: ExamBankProps) {
  const [selectedExamForPreview, setSelectedExamForPreview] = useState<Exam | null>(null);
  const [showAnswerKey, setShowAnswerKey] = useState<boolean>(true);

  const handleDownloadDocx = (ex: Exam) => {
    const resolved = ex.questions
      .map((qId) => questions.find((q) => q.id === qId))
      .filter(Boolean) as Question[];

    if (resolved.length === 0) {
      alert('Đề thi rỗng hoặc không tìm thấy các câu hỏi tương ứng trong CSDL!');
      return;
    }

    const blob = generateDocxBlob(ex.title, ex.subject, ex.grade, ex.duration, resolved);
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `De_Word_${ex.subject || 'Mon'}_Lop${ex.grade || '6'}_${ex.title.replace(/\s+/g, '_')}.doc`;
    link.click();
  };

  const handleDownloadTxt = (ex: Exam) => {
    const resolved = ex.questions
      .map((qId) => questions.find((q) => q.id === qId))
      .filter(Boolean) as Question[];

    if (resolved.length === 0) {
      alert('Đề thi rỗng hoặc không tìm thấy các câu hỏi tương ứng trong CSDL!');
      return;
    }

    let txt = `ĐỀ THI BIÊN SOẠN TỪ KHO CÂU HỎI CHUYÊN NGHIỆP\n`;
    txt += `Đề thi: ${ex.title}\n`;
    txt += `Môn: ${ex.subject} - Lớp: ${ex.grade}\n`;
    txt += `Thời gian làm bài: ${ex.duration} phút - Thang điểm thiết lập: ${ex.totalScore || 10}đ\n`;
    txt += `====================================\n\n`;

    resolved.forEach((q, idx) => {
      txt += `Câu ${idx + 1} [${q.level || 'Thông hiểu'}] [${q.type || 'MCQ'}]: ${q.content}\n`;
      if (q.type === 'MCQ' && q.options) {
        q.options.forEach((opt, oIdx) => {
          txt += `  ${['A', 'B', 'C', 'D'][oIdx]}. ${opt}\n`;
        });
      } else if (q.type === 'YESNO' && q.options) {
        q.options.forEach((opt, oIdx) => {
          txt += `  ${['a', 'b', 'c', 'd'][oIdx]}. ${opt}\n`;
        });
      }
      txt += `\n`;
    });

    txt += `\n====================================\n`;
    txt += `HƯỚNG DẪN GIẢI CHI TIẾT VÀ ĐÁP ÁN CHUẨN\n`;
    txt += `====================================\n`;

    resolved.forEach((q, idx) => {
      let fAns = q.answer;
      if (q.type === 'MCQ') {
        fAns = ['A', 'B', 'C', 'D'][parseInt(q.answer)] || q.answer;
      } else if (q.type === 'YESNO') {
        fAns = q.answer
          .split(',')
          .map((a, i) => `${['a', 'b', 'c', 'd'][i]} (${a === 'true' ? 'Đúng' : 'Sai'})`)
          .join(', ');
      }
      txt += `Câu ${idx + 1} Đáp án đúng: ${fAns}\n`;
      txt += `Giải thích: ${q.explain}\n\n`;
    });

    const blob = new Blob([txt], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `De_Txt_${ex.subject || 'Mon'}_Lop${ex.grade || '6'}_${ex.title.replace(/\s+/g, '_')}.txt`;
    link.click();
  };

  // Resolve questions for the currently selected preview exam
  const previewQuestions = selectedExamForPreview
    ? (selectedExamForPreview.questions
        .map((qId) => questions.find((q) => q.id === qId))
        .filter(Boolean) as Question[])
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Kho lưu trữ đề thi số hóa của trường</h1>
        <p className="text-sm text-slate-500">Nơi lưu trữ, quản lý cấu trúc các đề đã được duyệt sử dụng rèn luyện.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {exams.map((ex) => (
          <div
            key={ex.id}
            id={`exam-card-${ex.id}`}
            className="bg-white rounded-xl border border-slate-100 p-5 shadow-xs hover:shadow-md transition-all space-y-4 flex flex-col justify-between"
          >
            <div className="space-y-2">
              <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 text-[9px] font-bold rounded uppercase">
                {ex.subject} Lớp {ex.grade}
              </span>
              <h4 className="font-bold text-slate-800 text-sm leading-snug line-clamp-2">{ex.title}</h4>

              <div className="flex items-center justify-between text-xs text-slate-400 font-semibold pt-1 border-b border-indigo-50/50 pb-2">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {ex.duration} phút
                </span>
                <span className="flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5" />
                  {ex.questions.length} câu hỏi
                </span>
              </div>
            </div>

            {/* Quick Actions inside the card directory */}
            <div className="grid grid-cols-3 gap-1.5 bg-slate-50 p-1.5 rounded-xl border border-slate-100">
              <button
                type="button"
                id={`btn-view-${ex.id}`}
                onClick={() => {
                  setSelectedExamForPreview(ex);
                  setShowAnswerKey(true);
                }}
                className="py-1.5 px-1 bg-white border border-slate-200 text-slate-700 font-bold text-[10px] rounded-lg shadow-2xs hover:bg-slate-100 flex items-center justify-center gap-0.5 cursor-pointer"
                title="Xem chi tiết đề"
              >
                <Eye className="w-3 h-3 text-blue-500" />
                Xem đề
              </button>
              <button
                type="button"
                id={`btn-docx-${ex.id}`}
                onClick={() => handleDownloadDocx(ex)}
                className="py-1.5 px-1 bg-white border border-emerald-200 text-emerald-700 font-bold text-[10px] rounded-lg shadow-2xs hover:bg-emerald-50 flex items-center justify-center gap-0.5 cursor-pointer"
                title="Tải file Word (.DOC)"
              >
                <Download className="w-3 h-3 text-emerald-600" />
                Tải Word
              </button>
              <button
                type="button"
                id={`btn-txt-${ex.id}`}
                onClick={() => handleDownloadTxt(ex)}
                className="py-1.5 px-1 bg-white border border-sky-200 text-sky-700 font-bold text-[10px] rounded-lg shadow-2xs hover:bg-sky-50 flex items-center justify-center gap-0.5 cursor-pointer"
                title="Tải file văn bản (.TXT)"
              >
                <FileText className="w-3 h-3 text-sky-600" />
                Tải TXT
              </button>
            </div>

            <div className="pt-2 flex gap-2 justify-between items-center border-t border-slate-100">
              <button
                type="button"
                id={`btn-del-${ex.id}`}
                onClick={() => {
                  onDeleteExam(ex.id);
                }}
                className="px-2.5 py-1.5 text-xs font-semibold text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
              >
                Xóa đề
              </button>
              <button
                type="button"
                id={`btn-assign-${ex.id}`}
                onClick={() => onAssignExam(ex.id)}
                className="px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-650 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-xs rounded-lg shadow-xs transition-all flex items-center gap-1 cursor-pointer"
              >
                <Clipboard className="w-3.5 h-3.5" />
                Giao đề ngay
              </button>
            </div>
          </div>
        ))}

        {exams.length === 0 && (
          <p className="text-slate-400 text-sm font-semibold col-span-full text-center py-10">
            Chưa có đề thi nào trong kho lưu trữ học vụ. Hãy truy cập "Ma trận, tạo đề" để khởi tạo đề đầu tiên.
          </p>
        )}
      </div>

      {/* ===========================================
          MODAL: INTERACTIVE EXAM STRUCTURAL PREVIEW
          =========================================== */}
      {selectedExamForPreview && (
        <div 
          id="exam-preview-modal"
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn"
        >
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 max-w-4xl w-full max-h-[90vh] flex flex-col animate-scaleUp">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-start justify-between bg-gradient-to-r from-indigo-50/60 to-blue-50/40">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 bg-blue-100 text-blue-800 border border-blue-200 text-[10px] font-black rounded uppercase">
                    {selectedExamForPreview.subject} - Lớp {selectedExamForPreview.grade}
                  </span>
                  <span className="px-2.5 py-0.5 bg-yellow-100 text-yellow-800 border border-yellow-200 text-[10px] font-black rounded">
                    Khảo thí chuyên sâu
                  </span>
                </div>
                <h2 className="text-lg font-black text-slate-800 tracking-tight leading-snug">
                  {selectedExamForPreview.title}
                </h2>
                <div className="flex items-center gap-4 text-xs font-semibold text-slate-500 pt-1">
                  <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-slate-400" /> {selectedExamForPreview.duration} phút</span>
                  <span className="flex items-center gap-1"><FileText className="w-3.5 h-3.5 text-slate-400" /> {previewQuestions.length} câu hỏi</span>
                  <span className="flex items-center gap-1"><Award className="w-3.5 h-3.5 text-slate-400" /> Khảo thế 10 điểm</span>
                </div>
              </div>
              <button
                type="button"
                id="btn-close-modal"
                onClick={() => setSelectedExamForPreview(null)}
                className="p-1 px-2.5 hover:bg-slate-100 text-slate-400 hover:text-slate-700 font-bold rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Actions Checklist Toolbar */}
            <div className="p-3.5 border-b border-slate-50 bg-slate-50 px-5 flex flex-wrap items-center justify-between gap-3">
              <label className="flex items-center gap-2 text-xs font-black text-slate-600 select-none cursor-pointer">
                <input
                  type="checkbox"
                  checked={showAnswerKey}
                  onChange={(e) => setShowAnswerKey(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-slate-350 focus:ring-blue-500"
                />
                Hiển thị hướng dẫn giải chi tiết & đáp án
              </label>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  id="btn-download-modal-txt"
                  onClick={() => handleDownloadTxt(selectedExamForPreview)}
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-black rounded-xl shadow-sm flex items-center gap-1.5 cursor-pointer uppercase transition-all duration-200"
                >
                  <FileText className="w-3.5 h-3.5 text-sky-100" />
                  Tải file TXT bản thô
                </button>

                <button
                  type="button"
                  id="btn-download-modal-docx"
                  onClick={() => handleDownloadDocx(selectedExamForPreview)}
                  className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-650 hover:from-emerald-700 hover:to-teal-750 text-white text-xs font-black rounded-xl shadow-sm flex items-center gap-1.5 cursor-pointer uppercase transition-all duration-200"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-100" />
                  Tải file Word (.DOC) với Equation chuẩn
                </button>
              </div>
            </div>

            {/* Modal Body Questions list */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50/50">
              {previewQuestions.map((q, idx) => (
                <div 
                  key={q.id}
                  className="bg-white p-5 rounded-2xl border border-slate-150/80 shadow-3xs space-y-3"
                >
                  {/* Tag level and info */}
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-black text-indigo-600 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-indigo-500" />
                      Câu hỏi {idx + 1}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 text-[9px] font-bold rounded ${
                        q.level === 'Nhận biết' ? 'bg-zinc-100 text-zinc-700' :
                        q.level === 'Thông hiểu' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                        q.level === 'Vận dụng' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                        'bg-rose-50 text-rose-700 border border-rose-100'
                      }`}>
                        {q.level}
                      </span>
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[9px] font-bold rounded uppercase">
                        {q.type === 'MCQ' ? 'MCQ' : q.type === 'YESNO' ? 'Đúng/Sai' : q.type === 'SHORT' ? 'Trống/Ngắn' : 'Tự luận'}
                      </span>
                    </div>
                  </div>

                  {/* Question Content with Math display */}
                  <div className="text-slate-800 text-sm font-semibold leading-relaxed">
                    <MathText text={q.content} />
                  </div>

                  {/* MCQ Options Rendering */}
                  {q.type === 'MCQ' && q.options && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1">
                      {q.options.slice(0, 4).map((option, oIdx) => {
                        const isCorrect = showAnswerKey && q.answer && parseInt(q.answer) === oIdx;
                        return (
                          <div 
                            key={oIdx}
                            className={`p-3 rounded-xl border text-xs font-semibold flex items-start gap-1.5 transition-colors ${
                              isCorrect 
                                ? 'bg-emerald-50/80 border-emerald-200 text-emerald-800' 
                                : 'bg-slate-50/50 border-slate-100 text-slate-650'
                            }`}
                          >
                            <span className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0 ${
                              isCorrect ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-700'
                            }`}>
                              {['A', 'B', 'C', 'D'][oIdx]}
                            </span>
                            <div className="pt-0.5">
                              <MathText text={option} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* YES NO Options rendering */}
                  {q.type === 'YESNO' && q.options && (
                    <div className="space-y-1.5 pt-1">
                      {q.options.slice(0, 4).map((option, oIdx) => {
                        // answer format can be "true,false,true,false"
                        const answersArr = q.answer ? q.answer.split(',') : [];
                        const optCorrect = answersArr[oIdx] === 'true';
                        return (
                          <div 
                            key={oIdx}
                            className="bg-slate-50/50 border border-slate-150 p-3 rounded-xl flex items-center justify-between text-xs"
                          >
                            <div className="flex items-start gap-2 max-w-[70%] font-semibold">
                              <span className="text-slate-400 font-bold uppercase">{['a', 'b', 'c', 'd'][oIdx]}.</span>
                              <MathText text={option} />
                            </div>
                            <div className="flex items-center gap-1">
                              <span className={`px-2.5 py-1 text-[9.5px] font-black rounded-lg ${
                                showAnswerKey 
                                  ? (optCorrect ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400')
                                  : 'bg-slate-200 text-slate-700'
                              }`}>
                                Đúng
                              </span>
                              <span className={`px-2.5 py-1 text-[9.5px] font-black rounded-lg ${
                                showAnswerKey 
                                  ? (!optCorrect ? 'bg-rose-500 text-white' : 'bg-slate-200 text-slate-400')
                                  : 'bg-slate-205 text-slate-700'
                              }`}>
                                Sai
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* SHORT & ESSAY answer rendering */}
                  {showAnswerKey && (q.type === 'SHORT' || q.type === 'ESSAY') && (
                    <div className="mt-3 p-3 bg-emerald-50/60 border border-emerald-150 rounded-xl space-y-1">
                      <p className="text-[10px] uppercase font-black text-emerald-800">Đáp án chuẩn:</p>
                      <div className="text-xs font-bold text-slate-800">
                        {q.type === 'SHORT' ? (
                          <span className="font-mono bg-white px-2 py-0.5 rounded border border-emerald-200 text-emerald-800">
                            {q.answer || 'Chưa cung cấp'}
                          </span>
                        ) : (
                          <MathText text={q.answer || 'Chưa cung cấp nội dung tự luận chuẩn'} />
                        )}
                      </div>
                    </div>
                  )}

                  {/* Collapsible/Toggled Explanations */}
                  {showAnswerKey && q.explain && (
                    <div className="mt-2.5 p-3.5 bg-blue-50/40 border border-indigo-100 rounded-xl space-y-1">
                      <p className="text-[10px] uppercase font-black text-indigo-800 flex items-center gap-1">
                        <HelpCircle className="w-3.5 h-3.5 text-blue-500" />
                        Hướng dẫn giải chi tiết:
                      </p>
                      <div className="text-xs text-slate-700 font-medium leading-relaxed leading-snug">
                        <MathText text={q.explain} />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between px-6">
              <p className="text-[10px] text-slate-400 font-bold">
                * Toàn bộ sơ đề hiển thị Equation đạt tiêu chuẩn Bộ Giáo dục quốc gia.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedExamForPreview(null)}
                  className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Đóng lại
                </button>
                <button
                  type="button"
                  onClick={() => onAssignExam(selectedExamForPreview.id)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl cursor-pointer shadow-sm flex items-center gap-1.5"
                >
                  <Clipboard className="w-3.5 h-3.5" />
                  Giao đề lớp học
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
