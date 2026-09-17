/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Class, Question, Exam, Assignment, Submission } from '../types';
import { BookOpen, Users, HelpCircle, TrendingUp, Sparkles, Eye, ArrowRight, Clipboard } from 'lucide-react';

interface TeacherDashboardProps {
  classes: Class[];
  questions: Question[];
  exams: Exam[];
  assignments: Assignment[];
  submissions: Submission[];
  onNavigate: (moduleName: string) => void;
  onViewClass: (classId: string) => void;
}

export default function TeacherDashboard({
  classes,
  questions,
  exams,
  assignments,
  submissions,
  onNavigate,
  onViewClass,
}: TeacherDashboardProps) {
  // Statistics
  const totalClasses = classes.length;
  const totalStudents = classes.reduce((acc, c) => acc + c.students.length, 0);
  const totalQuestions = questions.length;
  const totalExams = exams.length;
  const totalAssigned = assignments.length;
  const totalSubmitted = submissions.length;

  return (
    <div className="space-y-6">
      {/* Title & Fast Action */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Trang chủ quản trị học vụ</h1>
          <p className="text-sm text-slate-500">Phân tích chuyên môn kiểm tra, ôn tập rèn luyện định hướng năng lực.</p>
        </div>
        <button
          onClick={() => onNavigate('create-exam')}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-lg shadow-md hover:shadow-lg transition-all flex items-center gap-2"
        >
          <Sparkles className="w-4 h-4" />
          Tạo nhanh đề kiểm tra
        </button>
      </div>

      {/* STATS CARDS GRID */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Lớp quản lý</div>
            <div className="text-xl font-bold text-slate-800 mt-0.5">{totalClasses} Lớp</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Học sinh</div>
            <div className="text-xl font-bold text-slate-800 mt-0.5">{totalStudents} học sinh</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
            <HelpCircle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Học liệu rèn luyện</div>
            <div className="text-xl font-bold text-slate-800 mt-0.5">{totalQuestions} câu / {totalExams} đề</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="p-3 bg-orange-50 text-orange-600 rounded-lg">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Lượt làm bài</div>
            <div className="text-xl font-bold text-slate-800 mt-0.5">{totalAssigned} bài ({totalSubmitted} nộp)</div>
          </div>
        </div>
      </div>

      {/* TWO COLUMN MAIN AREA */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Main: Active Classes List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-800 text-lg">Danh sách lớp học phụ trách</h3>
              <button
                onClick={() => onNavigate('classes')}
                className="text-xs font-semibold text-emerald-600 hover:text-emerald-700"
              >
                Cấu hình thêm &rarr;
              </button>
            </div>
            <div className="divide-y divide-slate-100">
              {classes.map((cls) => {
                const totalScore = cls.students.reduce((s, st) => s + (st.avgScore || 0), 0);
                const avgScore = cls.students.length > 0 ? (totalScore / cls.students.length).toFixed(1) : '0.0';
                return (
                  <div key={cls.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-800">{cls.name}</h4>
                        <span className="px-2 py-0.5 text-[10px] bg-slate-100 text-slate-600 rounded font-semibold uppercase">
                          {cls.subject} Lớp {cls.grade}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        Sách: {cls.book} | Mã lớp: <strong className="text-slate-600 font-mono select-all">{cls.joinCode}</strong>
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-sm font-bold text-slate-700">{cls.students.length} học viên</div>
                        <div className="text-xs text-slate-400">
                          Điểm TB: <span className="text-emerald-600 font-semibold">{avgScore}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => onViewClass(cls.id)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-600 text-slate-600 font-semibold text-xs rounded-lg transition-colors flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Xem chi tiết
                      </button>
                    </div>
                  </div>
                );
              })}
              {classes.length === 0 && (
                <p className="text-slate-400 text-sm text-center py-6">Chưa có lớp học nào được đăng ký.</p>
              )}
            </div>
          </div>

          {/* AI Remedial Suggestion Widget */}
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-xl shadow-lg border border-slate-700 p-6 text-white relative overflow-hidden">
            <div className="absolute -right-4 -bottom-10 opacity-10">
              <Sparkles className="w-48 h-48 text-emerald-500" />
            </div>
            <div className="flex items-center gap-2 mb-2 text-emerald-400">
              <Sparkles className="w-5 h-5 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wider">Trí tuệ nhân tạo QUICK-AI phân tích</span>
            </div>
            <h4 className="font-bold text-lg mb-2">Đề xuất rèn luyện khắc phục lỗ hổng kiến thức</h4>
            <p className="text-sm text-slate-300 leading-relaxed mb-4">
              Hệ thống phát hiện thấy một số học sinh đang có điểm số rèn luyện chưa tối ưu ở phần kiến thức "Tập hợp các số tự nhiên".
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => onNavigate('ai-support')}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-lg transition-all flex items-center gap-1"
              >
                Xem phân tích & Tạo bài ôn tập bổ trợ
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Main: Assignments Status list */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
            <h3 className="font-bold text-slate-800 text-lg mb-4">Các hoạt động rèn luyện vừa qua</h3>
            <div className="space-y-4">
              {assignments.map((as) => {
                const exam = exams.find((e) => e.id === as.examId);
                const cls = classes.find((c) => c.id === as.classId);
                const submissionsCount = submissions.filter((s) => s.assignmentId === as.id).length;
                if (!exam || !cls) return null;

                const completionPercent = cls.students.length > 0 ? Math.round((submissionsCount / cls.students.length) * 100) : 0;

                return (
                  <div key={as.id} className="p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-slate-700 line-clamp-1">{exam.title}</h4>
                        <p className="text-[10px] text-slate-400 mt-0.5">Lớp: {cls.name}</p>
                      </div>
                      <span className="px-2 py-0.5 text-[9px] bg-amber-50 text-amber-600 border border-amber-200 rounded-full font-bold uppercase">
                        {as.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>
                        Đã nộp: <strong>{submissionsCount}/{cls.students.length}</strong>
                      </span>
                      <span>Hạn chót: {as.deadline.replace('T', ' ')}</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-1">
                      <div
                        className="bg-emerald-500 h-1 rounded-full transition-all duration-500"
                        style={{ width: `${completionPercent}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
              {assignments.length === 0 && (
                <p className="text-slate-400 text-[11px] text-center py-4">Chưa có bài tập nào được giao gần đây.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
