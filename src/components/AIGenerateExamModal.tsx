/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Sparkles, Upload, FileText, Image as ImageIcon, CheckCircle, RefreshCw, X, Save, HelpCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { Question, Exam } from '../types';

interface AIGenerateExamModalProps {
  onClose: () => void;
  onSaveGeneratedExam: (examTitle: string, subject: string, grade: string, generatedQuestions: Question[]) => void;
}

export default function AIGenerateExamModal({ onClose, onSaveGeneratedExam }: AIGenerateExamModalProps) {
  const [examTitle, setExamTitle] = useState('Đề kiểm tra AI - Bài học SGK mới');
  const [subject, setSubject] = useState('Toán');
  const [grade, setGrade] = useState('9');
  const [questionCount, setQuestionCount] = useState<number>(10);

  const [inputText, setInputText] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [generatedQuestions, setGeneratedQuestions] = useState<Question[]>([]);

  // Image upload handling
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Vui lòng chọn một tệp hình ảnh (PNG, JPG, WEBP).');
      return;
    }

    setErrorMessage('');
    setImageFile(file);
    const url = URL.createObjectURL(file);
    setImagePreviewUrl(url);

    const reader = new FileReader();
    reader.onloadend = () => {
      setImageBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleClearImage = () => {
    setImageFile(null);
    setImagePreviewUrl(null);
    setImageBase64(null);
  };

  // Generate Questions via Gemini AI Server Endpoint
  const handleGenerateAI = async () => {
    if (!inputText.trim() && !imageBase64) {
      setErrorMessage('Vui lòng dán văn bản bài học hoặc tải lên ảnh chụp SGK để Gemini AI phân tích.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const res = await fetch('/api/generate-exam-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: inputText.trim(),
          imageBase64: imageBase64,
          mimeType: imageFile?.type || 'image/jpeg',
          subject,
          grade,
          count: questionCount,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Lỗi kết nối máy chủ Gemini AI');
      }

      const rawQuestions = data.questions || [];
      const now = new Date().toISOString();

      // Transform raw AI questions to App Question objects
      const formattedQuestions: Question[] = rawQuestions.map((q: any, idx: number) => ({
        id: `ai-q-${Date.now()}-${idx + 1}-${Math.random().toString(36).substring(2, 7)}`,
        type: 'MCQ',
        content: q.content || `Câu hỏi ${idx + 1}`,
        options: Array.isArray(q.options) && q.options.length === 4 ? q.options : ['Phương án A', 'Phương án B', 'Phương án C', 'Phương án D'],
        answer: String(q.answer ?? '0'),
        explain: q.explain || 'Giải thích chi tiết chuẩn sư phạm do Gemini AI khởi tạo.',
        level: (['Nhận biết', 'Thông hiểu', 'Vận dụng', 'Vận dụng cao'].includes(q.level) ? q.level : 'Thông hiểu') as any,
        source: 'Trí tuệ nhân tạo Gemini AI',
        status: 'Đã duyệt',
      }));

      setGeneratedQuestions(formattedQuestions);
    } catch (err: any) {
      console.error('AI Generation Error:', err);
      setErrorMessage(err.message || 'Không thể tạo đề thi. Vui lòng kiểm tra lại hình ảnh hoặc nội dung.');
    } finally {
      setIsLoading(false);
    }
  };

  // Save generated exam
  const handleSaveExam = () => {
    if (generatedQuestions.length === 0) return;
    onSaveGeneratedExam(examTitle, subject, grade, generatedQuestions);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 text-slate-100 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden font-sans">
        {/* Header */}
        <div className="flex items-center justify-between p-5 bg-slate-950 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base font-black uppercase tracking-wider text-slate-100 flex items-center gap-2">
                TỰ ĐỘNG TẠO ĐỀ THI BẰNG TRÍ TUỆ NHÂN TẠO (GEMINI AI)
              </h2>
              <p className="text-xs text-slate-400 font-medium">
                Tải ảnh chụp bài học SGK hoặc dán văn bản, AI sẽ phân tích và khởi tạo ngay bộ câu hỏi trắc nghiệm kèm đáp án.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 custom-scrollbar flex-1">
          {/* Exam Title & Subject Setup */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 bg-slate-950/50 p-4 rounded-xl border border-slate-800/80">
            <div className="sm:col-span-2 space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-400 block">Tên Bộ Đề Thi Khởi Tạo:</label>
              <input
                type="text"
                value={examTitle}
                onChange={e => setExamTitle(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-xs font-bold text-slate-100 px-3 py-2 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none"
                placeholder="Nhập tên bài học / bộ đề..."
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-400 block">Môn Học:</label>
              <select
                value={subject}
                onChange={e => setSubject(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-xs font-bold text-slate-100 px-3 py-2 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none"
              >
                <option value="Toán">Toán học</option>
                <option value="Tin học">Tin học</option>
                <option value="Khoa học tự nhiên">Khoa học tự nhiên</option>
                <option value="Văn học">Văn học</option>
                <option value="Tiếng Anh">Tiếng Anh</option>
                <option value="Lịch sử & Địa lý">Lịch sử & Địa lý</option>
                <option value="Vật lý">Vật lý</option>
                <option value="Hóa học">Hóa học</option>
                <option value="Sinh học">Sinh học</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-400 block">Khối Lớp & Số Cấu Hỏi:</label>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={grade}
                  onChange={e => setGrade(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-xs font-bold text-slate-100 p-2 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none"
                >
                  <option value="6">Lớp 6</option>
                  <option value="7">Lớp 7</option>
                  <option value="8">Lớp 8</option>
                  <option value="9">Lớp 9</option>
                  <option value="10">Lớp 10</option>
                  <option value="11">Lớp 11</option>
                  <option value="12">Lớp 12</option>
                </select>

                <select
                  value={questionCount}
                  onChange={e => setQuestionCount(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 text-xs font-bold text-slate-100 p-2 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none"
                >
                  <option value={10}>10 câu</option>
                  <option value={15}>15 câu</option>
                  <option value={20}>20 câu</option>
                </select>
              </div>
            </div>
          </div>

          {/* Input Sources: Image upload OR Text Snippet */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Image upload box */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-emerald-400" />
                  Nguồn 1: Tải ảnh chụp SGK / Bài học
                </span>
                {imageFile && (
                  <button
                    onClick={handleClearImage}
                    className="text-[10px] text-rose-400 hover:underline flex items-center gap-0.5 cursor-pointer"
                  >
                    Xóa ảnh
                  </button>
                )}
              </label>

              {imagePreviewUrl ? (
                <div className="relative rounded-xl border border-emerald-500/30 overflow-hidden bg-slate-950 h-48 flex items-center justify-center p-2">
                  <img src={imagePreviewUrl} alt="Bài học SGK" className="max-h-full max-w-full object-contain rounded" />
                </div>
              ) : (
                <label className="border-2 border-dashed border-slate-700 hover:border-emerald-500/50 bg-slate-950/50 hover:bg-slate-950 p-6 rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-all h-48 text-center">
                  <Upload className="w-8 h-8 text-emerald-400/80 animate-bounce" />
                  <span className="text-xs font-bold text-slate-300">Nhấp để chọn ảnh chụp SGK / Bài học</span>
                  <span className="text-[10px] text-slate-500">Hỗ trợ ảnh PNG, JPG, WEBP chụp từ điện thoại hoặc sách</span>
                  <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                </label>
              )}
            </div>

            {/* Text snippet box */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-teal-400" />
                Nguồn 2: Dán nội dung văn bản bài học SGK
              </label>
              <textarea
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                placeholder="Dán văn bản đoạn trích SGK, ghi chú kiến thức hoặc đề mục lý thuyết vào đây..."
                className="w-full h-48 bg-slate-950/50 border border-slate-700 rounded-xl p-3 text-xs text-slate-200 font-mono focus:ring-1 focus:ring-emerald-500 outline-none custom-scrollbar resize-none"
              />
            </div>
          </div>

          {errorMessage && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold rounded-xl flex items-center gap-2">
              <X className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Action Trigger Button */}
          <div className="flex justify-center pt-2">
            <button
              onClick={handleGenerateAI}
              disabled={isLoading}
              className={`px-8 py-3.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-green-600 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-emerald-500/10 flex items-center gap-2 cursor-pointer active:scale-95 ${
                isLoading ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Gemini AI đang phân tích & Soạn đề...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Phân Tích & Phân Bổ Tạo Đề Thi Ngay
                </>
              )}
            </button>
          </div>

          {/* Generated Questions Preview & Import List */}
          {generatedQuestions.length > 0 && (
            <div className="space-y-4 pt-4 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Kết quả khởi tạo ({generatedQuestions.length} câu hỏi chuẩn)
                </h3>
                <button
                  onClick={handleSaveExam}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  Lưu Vào Ngân Hàng Đề Thi
                </button>
              </div>

              <div className="space-y-4 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                {generatedQuestions.map((q, idx) => (
                  <div key={q.id} className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-bold text-slate-100 leading-relaxed">
                        <span className="text-emerald-400 font-mono">Câu {idx + 1}:</span> {q.content}
                      </p>
                      <span className="px-2 py-0.5 bg-slate-800 text-slate-400 text-[10px] font-bold rounded-md shrink-0">
                        {q.level}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-medium pt-1">
                      {q.options.map((opt, oIdx) => {
                        const isCorrect = String(oIdx) === String(q.answer);
                        return (
                          <div
                            key={oIdx}
                            className={`p-2 rounded-lg border text-xs flex items-center gap-2 ${
                              isCorrect
                                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300 font-bold'
                                : 'bg-slate-900 border-slate-800 text-slate-400'
                            }`}
                          >
                            <span className={`w-5 h-5 rounded-full flex items-center justify-center font-mono text-[10px] shrink-0 ${
                              isCorrect ? 'bg-emerald-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400'
                            }`}>
                              {String.fromCharCode(65 + oIdx)}
                            </span>
                            <span className="flex-1">{opt}</span>
                          </div>
                        );
                      })}
                    </div>

                    {q.explain && (
                      <div className="p-2.5 bg-slate-900/80 rounded-lg border border-slate-800/80 text-[11px] text-slate-400 space-y-0.5">
                        <span className="text-emerald-400 font-bold block text-[10px]">💡 Lời giải chi tiết:</span>
                        <p>{q.explain}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
