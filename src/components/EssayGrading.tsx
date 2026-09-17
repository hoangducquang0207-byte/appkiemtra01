/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Submission, Exam, Assignment, Question } from '../types';
import {
  Check,
  Clipboard,
  Search,
  AlertCircle,
  Sparkles,
  CheckCircle,
  FileText,
  X,
  Image as ImageIcon,
  ZoomIn,
  Award,
  ChevronRight,
  HelpCircle,
  TrendingUp,
} from 'lucide-react';
import MathText from './MathText';

interface EssayGradingProps {
  submissions: Submission[];
  exams: Exam[];
  assignments: Assignment[];
  questions: Question[];
  onApproveSub: (subId: string, score: number, comment: string) => void;
}

export default function EssayGrading({
  submissions,
  exams,
  assignments,
  questions,
  onApproveSub,
}: EssayGradingProps) {
  const [selectedSubId, setSelectedSubId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [manualScore, setManualScore] = useState(8.5);
  const [manualComment, setManualComment] = useState('Giải bài toàn vẹn, nắm rõ bản chất chủ đề.');
  const [isAIReviewing, setIsAIReviewing] = useState(false);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  // Per-question scores state for active grading session
  const [questionScores, setQuestionScores] = useState<Record<string, number>>({});

  const activeSub = submissions.find((s) => s.id === selectedSubId);
  const activeAs = activeSub ? assignments.find((a) => a.id === activeSub.assignmentId) : null;
  const activeExam = activeAs ? exams.find((e) => e.id === activeAs.examId) : null;

  const handleReviewTrigger = (sub: Submission) => {
    setSelectedSubId(sub.id);
    setManualScore(sub.score);
    setManualComment(sub.comment || 'Giải bài toàn vẹn, nắm rõ bản chất chủ đề.');

    // Initialize sub-question scores if any
    const as = assignments.find((a) => a.id === sub.assignmentId);
    const exam = as ? exams.find((e) => e.id === as.examId) : null;
    const initialScores: Record<string, number> = {};
    if (exam) {
      const essays = exam.questions.filter((qId) => {
        const q = questions.find((item) => item.id === qId);
        return q && q.type === 'ESSAY';
      });
      const perQScore = essays.length > 0 ? sub.score / essays.length : sub.score;
      essays.forEach((qId) => {
        initialScores[qId] = Math.round(perQScore * 10) / 10;
      });
    }
    setQuestionScores(initialScores);
  };

  const handleUpdateQScore = (qId: string, score: number) => {
    const updated = { ...questionScores, [qId]: Math.min(10, Math.max(0, score)) };
    setQuestionScores(updated);

    // Sum up scores or calculate average for final score
    const scoresArray = Object.values(updated) as number[];
    const total = scoresArray.reduce((sum, val) => sum + val, 0);
    const avg = scoresArray.length > 0 ? total / scoresArray.length : total;
    setManualScore(Math.round(avg * 10) / 10);
  };

  const handleAISimulateSubmit = () => {
    if (!selectedSubId || !activeExam) return;
    setIsAIReviewing(true);

    setTimeout(() => {
      // AI suggested score and analysis feedback
      const score = Math.min(10, Math.max(1, Math.round((manualScore + 1.2) * 10) / 10));
      onApproveSub(
        selectedSubId,
        score,
        '[AI Chấm Điểm] Học sinh trình bày lập luận toán học mạch lạc, chứng minh chặt chẽ các bước giải. Chi tiết hình ảnh bài vẽ tay khớp chính xác với giải thuyết toán lý thuyết.'
      );
      setIsAIReviewing(false);
      setSelectedSubId(null);
    }, 1500);
  };

  const handleManualApproveSubmit = () => {
    if (!selectedSubId) return;
    onApproveSub(selectedSubId, manualScore, manualComment);
    setSelectedSubId(null);
  };

  // Filter submissions by search term
  const filteredSubmissions = submissions.filter((sub) => {
    const nameMatch = sub.studentName.toLowerCase().includes(searchTerm.toLowerCase());
    const exam = exams.find((e) => e.id === (assignments.find((a) => a.id === sub.assignmentId)?.examId));
    const titleMatch = exam?.title.toLowerCase().includes(searchTerm.toLowerCase()) || false;
    return nameMatch || titleMatch;
  });

  return (
    <div className="space-y-6 font-sans text-slate-800">
      <div>
        <h1 className="text-xl md:text-2xl font-black text-slate-850 text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <Award className="w-6 h-6 text-emerald-500 animate-pulse" />
          Cổng kiểm soát & Chấm bài tự luận
        </h1>
        <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide">
          Phê duyệt hiệu quả bài nộp tự luận của học sinh, kiểm duyệt ảnh bài viết tay & phản hồi thông tin học vụ.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        {/* Submissions Table / Left Pane */}
        <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-xl p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
            <h3 className="font-black text-slate-800 text-sm uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-emerald-600" />
              Danh sách bài độc thoại tự luận cần phê duyệt
            </h3>
            
            {/* Search filter input */}
            <div className="relative max-w-xs w-full">
              <input
                type="text"
                placeholder="Tìm học sinh, đề thi..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-emerald-500 font-medium"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-slate-400 uppercase bg-slate-50/50">
                <tr>
                  <th className="px-4 py-3 font-bold tracking-wider">Học sinh</th>
                  <th className="px-4 py-3 font-bold tracking-wider">Bài rèn luyện</th>
                  <th className="px-4 py-3 font-bold tracking-wider text-center">Trạng thái bài làm</th>
                  <th className="px-4 py-3 font-bold tracking-wider text-center">Mốc điểm số</th>
                  <th className="px-4 py-3 font-bold tracking-wider text-right">Khởi chạy</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-bold text-slate-600">
                {filteredSubmissions.map((sub) => {
                  const as = assignments.find((a) => a.id === sub.assignmentId);
                  const exam = as ? exams.find((e) => e.id === as.examId) : null;
                  if (!exam) return null;

                  // Check if this submission has essay questions
                  const hasEssay = exam.questions.some(qId => {
                    const q = questions.find(item => item.id === qId);
                    return q && q.type === 'ESSAY';
                  });

                  // If it doesn't have essay, we can skip it in essay grading list if we want, or display all
                  const essayCount = exam.questions.filter(qId => questions.find(item => item.id === qId)?.type === 'ESSAY').length;

                  const isSelected = sub.id === selectedSubId;

                  return (
                    <tr key={sub.id} className={`hover:bg-slate-50/80 transition-all ${isSelected ? 'bg-emerald-50/40 text-emerald-850' : ''}`}>
                      <td className="px-4 py-3.5 font-black text-slate-800 text-xs sm:text-sm">
                        {sub.studentName}
                      </td>
                      <td className="px-4 py-3.5 text-slate-500 font-semibold max-w-xs truncate">
                        <div className="font-bold text-slate-700">{exam.title}</div>
                        <div className="text-[10px] text-slate-400 uppercase tracking-widest mt-0.5 font-bold flex items-center gap-1">
                          <span>{essayCount} câu tự luận</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] bg-sky-50 text-sky-700 border border-sky-200">
                          <CheckCircle className="w-3 h-3" />
                          Toàn bộ bài làm
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center text-emerald-600 font-black text-xs sm:text-sm">
                        {sub.score.toFixed(1)} / 10
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <button
                          onClick={() => handleReviewTrigger(sub)}
                          className={`px-3 py-1.5 font-bold text-[10px] sm:text-xs rounded-xl shadow-xs transition-all uppercase flex items-center gap-1.5 ml-auto cursor-pointer ${
                            isSelected
                              ? 'bg-emerald-600 text-white shadow-md'
                              : 'bg-slate-900 text-white hover:bg-slate-800'
                          }`}
                        >
                          Chấm tự luận
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {filteredSubmissions.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-slate-400 italic text-center py-12 font-medium">
                      Chưa nhận được bài nộp tự luận nào phù hợp tiêu chí tìm kiếm.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Selected Review details panel / Right Pane */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xl space-y-5 h-fit xl:sticky xl:top-24">
          <h3 className="font-black text-slate-800 text-sm uppercase tracking-wider border-b pb-2.5 flex items-center gap-1.5">
            <Check className="w-4 h-4 text-emerald-500" />
            Bảng kiểm duyệt chi tiết
          </h3>

          {activeSub && activeExam ? (
            <div className="space-y-5">
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-1">
                <span className="text-[10px] text-emerald-600 font-black uppercase tracking-wider block">Bản thông tin rèn luyện</span>
                <h4 className="text-xs font-bold text-slate-800 leading-snug">{activeExam.title}</h4>
                <p className="text-[11px] text-slate-500 font-semibold mt-1">
                  Thí sinh: <strong className="text-slate-700">{activeSub.studentName}</strong> | Nộp ngày: {new Date(activeSub.submittedAt).toLocaleDateString()}
                </p>
              </div>

              {/* Student Essay Questions Viewer */}
              <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1 border border-slate-100 p-2 rounded-xl bg-slate-50/50">
                <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-1">Chi tiết bài làm từng câu tự luận:</h4>
                {activeExam.questions
                  .map((qId, idx) => {
                    const q = questions.find((item) => item.id === qId);
                    if (!q || q.type !== 'ESSAY') return null;

                    const storedAns = activeSub.answers[qId];
                    const answerText = typeof storedAns === 'object' && storedAns !== null ? storedAns.text : (storedAns || '');
                    const answerImg = typeof storedAns === 'object' && storedAns !== null ? storedAns.image : undefined;

                    return (
                      <div key={q.id} className="bg-white p-3 rounded-xl border border-slate-200 space-y-3 shadow-xs">
                        <div className="flex justify-between items-center bg-slate-100/50 p-1.5 rounded-lg">
                          <span className="text-[10px] font-black text-slate-700 uppercase">Câu {idx + 1} (Tự luận)</span>
                          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                            Mức độ: {q.level}
                          </span>
                        </div>

                        <div className="text-xs text-slate-800 font-medium bg-slate-50 p-2 rounded border border-slate-100 leading-relaxed">
                          <MathText text={q.content} />
                        </div>

                        {/* Student typed answer */}
                        <div className="space-y-1">
                          <span className="text-[10px] font-black text-emerald-600 uppercase tracking-wider block">📝 Bài viết học sinh:</span>
                          <div className="bg-emerald-50/20 border border-emerald-500/10 rounded-lg p-3 text-xs text-slate-700 font-medium whitespace-pre-wrap leading-relaxed min-h-20">
                            {answerText ? answerText : <span className="text-slate-400 italic">Học sinh không điền văn bản trả lời.</span>}
                          </div>
                        </div>

                        {/* Student uploaded handwriting image */}
                        {answerImg && (
                          <div className="space-y-1">
                            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-wider block">📷 Ảnh bài làm đính kèm:</span>
                            <div className="relative w-full h-32 bg-slate-900 rounded-lg overflow-hidden border border-slate-200 group">
                              <img
                                src={answerImg}
                                alt="Ảnh tự luận viết tay"
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                              <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                                <button
                                  type="button"
                                  onClick={() => setZoomedImage(answerImg)}
                                  className="p-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-transform transform hover:scale-105"
                                >
                                  <ZoomIn className="w-4 h-4" />
                                  Kính phóng đại
                                </button>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Mini per-question score editor */}
                        <div className="flex items-center justify-between border-t border-slate-100 pt-2 bg-slate-50/50 p-2 rounded-lg">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Cho điểm câu này:</label>
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              min={0}
                              max={10}
                              step={0.5}
                              value={questionScores[q.id] !== undefined ? questionScores[q.id] : 0}
                              onChange={(e) => handleUpdateQScore(q.id, parseFloat(e.target.value) || 0)}
                              className="w-14 text-center text-xs font-extrabold bg-white border border-slate-200 rounded p-1 font-mono text-emerald-700 focus:outline-hidden"
                            />
                            <span className="text-[10px] text-slate-400 font-bold">/ 10</span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                  .filter(Boolean)}
              </div>

              {/* Total aggregated score and pedagogical comment text */}
              <div className="space-y-3.5 border-t border-slate-100 pt-3">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-black text-slate-500 uppercase tracking-wider">Điểm tổng kết ước đạt</label>
                    <span className="text-xs font-black bg-rose-50 text-rose-700 px-2 py-0.5 rounded-full border border-rose-200 uppercase font-mono">
                      {manualScore} / 10 điểm
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={10}
                    step={0.1}
                    value={manualScore}
                    onChange={(e) => setManualScore(parseFloat(e.target.value) || 0)}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-505 text-slate-500 uppercase tracking-wider mb-1">Nhận xét sư phạm tổng kết</label>
                  <textarea
                    rows={3}
                    value={manualComment}
                    onChange={(e) => setManualComment(e.target.value)}
                    className="w-full text-xs font-semibold p-3 border border-slate-200 rounded-xl focus:ring-1 focus:ring-emerald-500 bg-slate-50 outline-none text-slate-700 font-sans"
                    placeholder="Nhập ghi chú sư phạm hoặc hướng dẫn giải cho học sinh..."
                  />
                </div>
              </div>

              {/* Grading Actions list */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  disabled={isAIReviewing}
                  onClick={handleAISimulateSubmit}
                  className="w-full py-2.5 bg-gradient-to-r from-emerald-600 via-teal-650 to-green-600 hover:from-emerald-700 hover:via-teal-750 hover:to-green-700 disabled:from-slate-400 disabled:to-slate-450 text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 uppercase tracking-wider cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-emerald-200 animate-pulse" />
                  {isAIReviewing ? 'AI đang thẩm duyệt tranh vẽ...' : 'Trợ lý AI Độc quyền duyệt'}
                </button>

                <button
                  onClick={handleManualApproveSubmit}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs rounded-xl transition-colors uppercase tracking-wider border cursor-pointer"
                >
                  LƯU CHẤM CÔNG VẬT LÝ
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-16 space-y-3 bg-slate-50/50 border border-slate-100 rounded-2xl">
              <div className="w-10 h-10 bg-slate-200/50 text-slate-400 rounded-full flex items-center justify-center mx-auto">
                <HelpCircle className="w-5 h-5" />
              </div>
              <p className="text-slate-400 text-xs italic leading-relaxed px-4">
                Vui lòng lựa chọn bài làm của học sinh từ danh sách bên trái để phê duyệt học học vụ tự luận & xem ảnh đính kèm.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* High resolution zoomed image lightbox portal modal */}
      {zoomedImage && (
        <div
          className="fixed inset-0 z-55 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4 animate-fade-in"
          onClick={() => setZoomedImage(null)}
        >
          <div className="relative max-w-4xl max-h-[85vh] w-full flex flex-col justify-center bg-slate-900 rounded-2xl border border-slate-800 p-2 overflow-hidden shadow-2xl">
            <button
              onClick={() => setZoomedImage(null)}
              className="absolute top-4 right-4 p-2 bg-slate-850 hover:bg-slate-750 text-white rounded-full transition-colors z-10 cursor-pointer"
              title="Đóng cửa sổ"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="overflow-auto max-h-[75vh] flex items-center justify-center">
              <img
                src={zoomedImage}
                alt="Ảnh học sinh viết tay phóng to"
                className="max-w-full max-h-full rounded-lg object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="p-3 text-center text-slate-400 text-xs font-semibold bg-slate-950/20">
              💡 Bạn có thể thu phóng bằng trình duyệt nếu muốn xem nét mực chi tiết của học sinh.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
