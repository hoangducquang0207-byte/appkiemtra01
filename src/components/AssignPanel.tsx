/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Exam, Class, Assignment } from '../types';
import { Clipboard, ShieldAlert, Calendar, CheckSquare, Trash, MessageSquare } from 'lucide-react';

interface AssignPanelProps {
  exams: Exam[];
  classes: Class[];
  assignments: Assignment[];
  onAssignSubmit: (newAssign: Omit<Assignment, 'id' | 'status'>) => void;
  onDeleteAssignment: (id: string) => void;
}

export default function AssignPanel({ exams, classes, assignments, onAssignSubmit, onDeleteAssignment }: AssignPanelProps) {
  // Form fields
  const [examId, setExamId] = useState(exams[0]?.id || '');
  const [classId, setClassId] = useState(classes[0]?.id || '');
  const [deadline, setDeadline] = useState('2026-07-30T23:59');

  const [shuffleQuestions, setShuffleQuestions] = useState(true);
  const [shuffleOptions, setShuffleOptions] = useState(true);
  const [showSolution, setShowSolution] = useState(true);
  const [allowRetry, setAllowRetry] = useState(true);
  const [message, setMessage] = useState('');

  // Sync form defaults when exams or classes lists change
  React.useEffect(() => {
    if (exams.length > 0 && (!examId || !exams.some(ex => ex.id === examId))) {
      setExamId(exams[0].id);
    }
  }, [exams, examId]);

  React.useEffect(() => {
    if (classes.length > 0 && (!classId || !classes.some(c => c.id === classId))) {
      setClassId(classes[0].id);
    }
  }, [classes, classId]);

  const handleAssignSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!examId || !classId) return;

    onAssignSubmit({
      examId,
      classId,
      deadline,
      duration: exams.find((ex) => ex.id === examId)?.duration || 15,
      shuffleQuestions,
      shuffleOptions,
      showSolution,
      allowRetry,
      message,
    });

    setMessage('');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Cấu hình rèn luyện trực tuyến cho học sinh</h1>
        <p className="text-sm text-slate-500">Giao đề ôn tập định kỳ, thiết lập thông điệp rèn luyện sư phạm.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form settings column */}
        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm space-y-4 h-fit">
          <h3 className="font-bold text-slate-800 text-base border-b pb-2">Thiết lập giao bài</h3>

          {exams.length > 0 && classes.length > 0 ? (
            <form onSubmit={handleAssignSubmitForm} className="space-y-3 text-xs font-semibold">
              <div>
                <label className="block text-slate-500 uppercase mb-1">Chọn đề thi mẫu</label>
                <select
                  value={examId}
                  onChange={(e) => setExamId(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 outline-none text-slate-700 font-bold"
                >
                  {exams.map((ex) => (
                    <option key={ex.id} value={ex.id}>
                      {ex.title} ({ex.subject} - {ex.questions.length} câu)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-500 uppercase mb-1">Chọn Lớp nhận đề</label>
                <select
                  value={classId}
                  onChange={(e) => setClassId(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 outline-none text-slate-700 font-bold"
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-500 uppercase mb-1">Mốc thời hạn hoàn tất</label>
                <input
                  type="datetime-local"
                  required
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 outline-none text-slate-700 font-bold"
                />
              </div>

              <div className="space-y-1.5 pt-1 text-slate-600 font-medium select-none">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={shuffleQuestions}
                    onChange={(e) => setShuffleQuestions(e.target.checked)}
                    className="rounded text-emerald-500"
                  />
                  <span>Xáo khóa nội dung câu hỏi</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={shuffleOptions}
                    onChange={(e) => setShuffleOptions(e.target.checked)}
                    className="rounded text-emerald-500"
                  />
                  <span>Xáo trộn ngẫu nhiên đáp án A-D</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showSolution}
                    onChange={(e) => setShowSolution(e.target.checked)}
                    className="rounded text-emerald-500"
                  />
                  <span>Bật xem kết quả giải chi tiết sau nộp</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allowRetry}
                    onChange={(e) => setAllowRetry(e.target.checked)}
                    className="rounded text-emerald-500"
                  />
                  <span>Học sinh được rèn luyện lại nhiều lần</span>
                </label>
              </div>

              <div>
                <label className="block text-slate-500 uppercase mb-1">Lời dặn sư phạm</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Chúc các em bình tĩnh rèn luyện chính xác..."
                  className="w-full text-xs font-semibold p-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 bg-slate-50 outline-none font-sans"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-lg shadow-sm transition-colors uppercase tracking-wider"
              >
                GIAO BÀI TẬP LÊN HỆ THỐNG
              </button>
            </form>
          ) : (
            <p className="text-slate-400 text-xs italic text-center py-6">
              Vui lòng xem lại danh mục đã tạo câu hỏi và lớp học tương ứng trước khi tiến hành giao bài.
            </p>
          )}
        </div>

        {/* List of active allocations tracker */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-100 shadow-sm space-y-6">
          <h3 className="font-bold text-slate-800 text-base border-b pb-2">Danh sách ôn tập đang vận hành</h3>

          <div className="space-y-4">
            {assignments.map((as) => {
              const exam = exams.find((e) => e.id === as.examId);
              const cls = classes.find((c) => c.id === as.classId);
              if (!exam || !cls) return null;

              return (
                <div
                  key={as.id}
                  className="p-4 bg-slate-50/75 border rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-800 text-sm leading-snug">{exam.title}</h4>
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 text-[9px] font-bold rounded uppercase">
                        {as.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1 font-medium">
                      Lớp nhận đề: <strong className="text-slate-600">{cls.name}</strong> | Hạn chót:{' '}
                      <strong className="text-slate-500">{as.deadline.replace('T', ' ')}</strong>
                    </p>
                    {as.message && (
                      <p className="text-[11px] text-emerald-700 font-semibold italic mt-1.5 flex items-center gap-1 bg-white/60 p-1.5 rounded border border-emerald-50">
                        <MessageSquare className="w-3.5 h-3.5" />"{as.message}"
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => onDeleteAssignment(as.id)}
                    className="text-red-500 hover:text-red-700 text-xs font-bold transition-all"
                  >
                    Thu hồi bài
                  </button>
                </div>
              );
            })}

            {assignments.length === 0 && (
              <p className="text-slate-400 text-sm font-semibold text-center py-10">Chưa có bài rèn luyện nào đang hoạt động.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
