/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Class, Submission, Assignment, Exam, isStudentSubmissionMatch } from '../types';
import { 
  TrendingUp, 
  AlertTriangle, 
  Download, 
  Printer, 
  Search, 
  Filter, 
  FileSpreadsheet, 
  Users, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Award,
  BookOpen,
  RefreshCw
} from 'lucide-react';

interface ReportsDashboardProps {
  classes: Class[];
  submissions: Submission[];
  assignments?: Assignment[];
  exams?: Exam[];
  onSyncCloudData?: () => void;
}

export default function ReportsDashboard({ 
  classes = [], 
  submissions = [], 
  assignments = [], 
  exams = [],
  onSyncCloudData
}: ReportsDashboardProps) {
  const [selectedClassId, setSelectedClassId] = useState<string>('all');
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'submitted' | 'missing'>('all');
  const [activeView, setActiveView] = useState<'gradebook' | 'charts'>('gradebook');

  // Map assignments and exams for fast lookup
  const assignmentMap = useMemo(() => {
    const map = new Map<string, Assignment>();
    assignments.forEach(a => map.set(a.id, a));
    return map;
  }, [assignments]);

  const examMap = useMemo(() => {
    const map = new Map<string, Exam>();
    exams.forEach(e => map.set(e.id, e));
    return map;
  }, [exams]);

  const classMap = useMemo(() => {
    const map = new Map<string, Class>();
    classes.forEach(c => map.set(c.id, c));
    return map;
  }, [classes]);

  // Construct comprehensive gradebook rows combining classes, students, assignments, and submissions
  const gradebookData = useMemo(() => {
    const rows: Array<{
      id: string;
      classId: string;
      className: string;
      studentId: string;
      studentName: string;
      assignmentId: string;
      assignmentTitle: string;
      examTitle: string;
      score: number | null;
      submittedAt: string | null;
      status: 'submitted' | 'missing';
      comment: string;
    }> = [];

    const matchedSubIds = new Set<string>();

    // Filter active classes
    const targetClasses = selectedClassId === 'all' 
      ? classes 
      : classes.filter(c => c.id === selectedClassId);

    targetClasses.forEach(cls => {
      // Find assignments for this class
      const classAssignments = assignments.filter(a => a.classId === cls.id);

      if (classAssignments.length === 0) {
        // If no assignments exist yet, show student list
        cls.students.forEach(st => {
          rows.push({
            id: `${cls.id}-${st.id}-none`,
            classId: cls.id,
            className: cls.name,
            studentId: st.id,
            studentName: st.name,
            assignmentId: '',
            assignmentTitle: 'Chưa có bài giao',
            examTitle: 'Chưa giao bài kiểm tra',
            score: st.avgScore || null,
            submittedAt: null,
            status: 'missing',
            comment: ''
          });
        });
      } else {
        classAssignments.forEach(asg => {
          if (selectedAssignmentId !== 'all' && asg.id !== selectedAssignmentId) return;

          const exam = examMap.get(asg.examId);
          const examTitle = exam?.title || 'Bài kiểm tra';

          cls.students.forEach(st => {
            const stNameNorm = (st.name || '').trim().toLowerCase().normalize('NFKC');
            // Find submission for this student and assignment
            const sub = submissions.find(s => {
              if (s.assignmentId !== asg.id) return false;
              return isStudentSubmissionMatch(s, st.id, st.name);
            });

            if (sub) {
              matchedSubIds.add(sub.id);
            }

            rows.push({
              id: `${cls.id}-${asg.id}-${st.id}`,
              classId: cls.id,
              className: cls.name,
              studentId: st.id,
              studentName: st.name,
              assignmentId: asg.id,
              assignmentTitle: asg.message || examTitle,
              examTitle: examTitle,
              score: sub ? sub.score : null,
              submittedAt: sub ? sub.submittedAt : null,
              status: sub ? 'submitted' : 'missing',
              comment: sub?.comment || ''
            });
          });
        });
      }
    });

    // CRITICAL: Always aggregate ALL unassigned, auto-enrolled, or remote student submissions so teacher NEVER misses any student submissions!
    submissions.forEach(sub => {
      if (matchedSubIds.has(sub.id)) return;
      const asg = assignmentMap.get(sub.assignmentId);
      if (selectedAssignmentId !== 'all' && sub.assignmentId !== selectedAssignmentId) return;
      const cls = asg ? classMap.get(asg.classId) : null;
      if (selectedClassId !== 'all' && cls && cls.id !== selectedClassId) return;

      const exam = asg ? examMap.get(asg.examId) : null;
      const examTitle = exam?.title || 'Bài kiểm tra rèn luyện';

      rows.push({
        id: `unmatched-${sub.id}`,
        classId: cls?.id || 'c-default',
        className: cls?.name || 'Học sinh mới nộp',
        studentId: sub.studentId || 's-unmatched',
        studentName: sub.studentName || 'Học sinh',
        assignmentId: sub.assignmentId,
        assignmentTitle: asg?.message || examTitle,
        examTitle: examTitle,
        score: sub.score,
        submittedAt: sub.submittedAt,
        status: 'submitted',
        comment: sub.comment || ''
      });
    });

    return rows;
  }, [classes, assignments, submissions, examMap, assignmentMap, classMap, selectedClassId, selectedAssignmentId]);

  // Filter gradebook data based on search query and status filter
  const filteredRows = useMemo(() => {
    return gradebookData.filter(row => {
      const matchSearch = searchQuery.trim() === '' || 
        row.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        row.className.toLowerCase().includes(searchQuery.toLowerCase()) ||
        row.examTitle.toLowerCase().includes(searchQuery.toLowerCase());

      const matchStatus = filterStatus === 'all' || row.status === filterStatus;

      return matchSearch && matchStatus;
    });
  }, [gradebookData, searchQuery, filterStatus]);

  // Statistics summaries
  const totalStudentsCount = useMemo(() => {
    const uniqueStudents = new Set();
    filteredRows.forEach(r => uniqueStudents.add(r.studentId));
    return uniqueStudents.size;
  }, [filteredRows]);

  const submittedCount = useMemo(() => {
    return filteredRows.filter(r => r.status === 'submitted').length;
  }, [filteredRows]);

  const averageScoreCalculated = useMemo(() => {
    const scores = filteredRows.filter(r => r.score !== null).map(r => r.score as number);
    if (scores.length === 0) return '0.0';
    const sum = scores.reduce((a, b) => a + b, 0);
    return (sum / scores.length).toFixed(1);
  }, [filteredRows]);

  // Export to Excel / CSV with UTF-8 BOM (\uFEFF)
  const handleExportCSV = () => {
    let csv = '\uFEFF';
    csv += 'STT,Mã Lớp,Lớp Học,Mã Học Sinh,Họ và Tên Học Sinh,Bài Kiểm Tra,Điểm Số,Thời Gian Nộp,Trạng Thái,Ghi Chú Lời Phê\n';

    filteredRows.forEach((row, idx) => {
      const stt = idx + 1;
      const classIdStr = `"${row.classId}"`;
      const classNameStr = `"${row.className.replace(/"/g, '""')}"`;
      const studentIdStr = `"${row.studentId}"`;
      const studentNameStr = `"${row.studentName.replace(/"/g, '""')}"`;
      const examTitleStr = `"${row.examTitle.replace(/"/g, '""')}"`;
      const scoreStr = row.score !== null ? row.score.toFixed(1) : 'Chưa nộp';
      const timeStr = row.submittedAt ? `"${row.submittedAt}"` : 'Chưa nộp';
      const statusStr = row.status === 'submitted' ? 'Đã nộp bài' : 'Chưa nộp bài';
      const commentStr = `"${(row.comment || '').replace(/"/g, '""')}"`;

      csv += `${stt},${classIdStr},${classNameStr},${studentIdStr},${studentNameStr},${examTitleStr},${scoreStr},${timeStr},"${statusStr}",${commentStr}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const dateStr = new Date().toISOString().slice(0, 10);
    const selectedClassName = selectedClassId === 'all' ? 'ToanTruong' : (classMap.get(selectedClassId)?.name.replace(/[^a-zA-Z0-9]/g, '_') || 'Lop');
    a.download = `Nhat_Ky_Diem_${selectedClassName}_${dateStr}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Print view handler
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <FileSpreadsheet className="w-7 h-7 text-emerald-600" />
            Nhật Ký & Báo Cáo Điểm Số Lớp Kiểm Tra
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Thống kê nhật ký điểm số, xuất danh sách bảng điểm Excel/CSV cho giáo viên và nhà trường.
          </p>
        </div>

        {/* View mode toggle tabs & Cloud Sync */}
        <div className="flex flex-wrap items-center gap-2">
          {onSyncCloudData && (
            <button
              onClick={onSyncCloudData}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer uppercase tracking-wider"
              title="Đồng bộ ngay dữ liệu nộp bài mới nhất từ đám mây"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Đồng bộ bài nộp ({submissions.length})
            </button>
          )}

          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setActiveView('gradebook')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                activeView === 'gradebook'
                  ? 'bg-white text-emerald-700 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Bảng Nhật Ký Điểm
            </button>
            <button
              onClick={() => setActiveView('charts')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                activeView === 'charts'
                  ? 'bg-white text-emerald-700 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              Phổ Điểm & Cảnh Báo
            </button>
          </div>
        </div>
      </div>

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Tổng số lượt làm</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-800">{filteredRows.length}</span>
            <Users className="w-5 h-5 text-slate-400" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Đã hoàn thành nộp bài</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-emerald-600">{submittedCount}</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Chưa làm / Chưa nộp</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-amber-600">{filteredRows.length - submittedCount}</span>
            <Clock className="w-5 h-5 text-amber-500" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Điểm trung bình lớp</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-sky-600">{averageScoreCalculated} / 10</span>
            <Award className="w-5 h-5 text-sky-500" />
          </div>
        </div>
      </div>

      {activeView === 'gradebook' && (
        <div className="space-y-4">
          {/* Controls & Filters Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 flex-1">
              {/* Select Class */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase block">Lớp kiểm tra:</label>
                <select
                  value={selectedClassId}
                  onChange={e => {
                    setSelectedClassId(e.target.value);
                    setSelectedAssignmentId('all');
                  }}
                  className="w-full bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 rounded-lg p-2 focus:ring-1 focus:ring-emerald-500 outline-none"
                >
                  <option value="all">-- Tất cả các lớp ({classes.length}) --</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.students.length} HS)</option>
                  ))}
                </select>
              </div>

              {/* Select Assignment */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase block">Bài kiểm tra / Đề giao:</label>
                <select
                  value={selectedAssignmentId}
                  onChange={e => setSelectedAssignmentId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 rounded-lg p-2 focus:ring-1 focus:ring-emerald-500 outline-none"
                >
                  <option value="all">-- Tất cả bài kiểm tra --</option>
                  {assignments
                    .filter(a => selectedClassId === 'all' || a.classId === selectedClassId)
                    .map(a => {
                      const ex = examMap.get(a.examId);
                      return (
                        <option key={a.id} value={a.id}>
                          {ex?.title || a.message || 'Bài kiểm tra'}
                        </option>
                      );
                    })}
                </select>
              </div>

              {/* Status Filter */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase block">Trạng thái bài làm:</label>
                <select
                  value={filterStatus}
                  onChange={e => setFilterStatus(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 rounded-lg p-2 focus:ring-1 focus:ring-emerald-500 outline-none"
                >
                  <option value="all">Tất cả trạng thái</option>
                  <option value="submitted">Chỉ xem học sinh ĐÃ NỘP BÀI</option>
                  <option value="missing">Chỉ xem học sinh CHƯA NỘP BÀI</option>
                </select>
              </div>
            </div>

            {/* Search and Action Buttons */}
            <div className="flex items-center gap-2 pt-2 lg:pt-0">
              <div className="relative flex-1 sm:w-48">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Tìm tên học sinh..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-xs text-slate-800 font-medium pl-8 pr-3 py-2 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none"
                />
              </div>

              <button
                onClick={handleExportCSV}
                title="Xuất bảng điểm ra file Excel (CSV UTF-8)"
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Xuất Excel</span>
              </button>

              <button
                onClick={handlePrint}
                title="In bảng điểm nhật ký lớp học"
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-all border border-slate-200 flex items-center gap-1 cursor-pointer shrink-0"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>In</span>
              </button>
            </div>
          </div>

          {/* Gradebook Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700 border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-[11px] font-black uppercase text-slate-600">
                    <th className="py-3 px-3 w-12 text-center">STT</th>
                    <th className="py-3 px-3">Lớp học</th>
                    <th className="py-3 px-3">Họ và tên học sinh</th>
                    <th className="py-3 px-3">Tên bài kiểm tra</th>
                    <th className="py-3 px-3 text-center">Điểm số</th>
                    <th className="py-3 px-3">Thời gian nộp</th>
                    <th className="py-3 px-3 text-center">Trạng thái</th>
                    <th className="py-3 px-3">Ghi chú / Nhận xét</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredRows.map((row, idx) => {
                    const score = row.score;
                    let scoreBadgeClass = 'text-slate-400 bg-slate-100';
                    if (score !== null) {
                      if (score >= 8) scoreBadgeClass = 'text-emerald-700 bg-emerald-50 border border-emerald-200';
                      else if (score >= 5) scoreBadgeClass = 'text-sky-700 bg-sky-50 border border-sky-200';
                      else scoreBadgeClass = 'text-red-700 bg-red-50 border border-red-200';
                    }

                    return (
                      <tr key={row.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-3 text-center font-bold text-slate-400">{idx + 1}</td>
                        <td className="py-3 px-3 font-bold text-slate-800">{row.className}</td>
                        <td className="py-3 px-3 font-bold text-slate-900">{row.studentName}</td>
                        <td className="py-3 px-3 text-slate-600 font-medium max-w-xs truncate" title={row.examTitle}>
                          {row.examTitle}
                        </td>
                        <td className="py-3 px-3 text-center">
                          {score !== null ? (
                            <span className={`inline-block px-2.5 py-0.5 rounded-full font-black text-xs ${scoreBadgeClass}`}>
                              {score.toFixed(1)} / 10
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">Chưa nộp</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-slate-500 text-[11px] font-mono">
                          {row.submittedAt || '---'}
                        </td>
                        <td className="py-3 px-3 text-center">
                          {row.status === 'submitted' ? (
                            <span className="inline-flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md font-bold text-[10.5px]">
                              <CheckCircle2 className="w-3 h-3" /> Đã nộp
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md font-bold text-[10.5px]">
                              <Clock className="w-3 h-3" /> Chưa nộp
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-slate-500 italic max-w-xs truncate">
                          {row.comment || '---'}
                        </td>
                      </tr>
                    );
                  })}

                  {filteredRows.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400 italic">
                        Không tìm thấy nhật ký điểm phù hợp với bộ lọc.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeView === 'charts' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main statistics block with bar charts */}
          <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-6">
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
                    <div className="w-full h-3 rounded-full overflow-hidden bg-slate-100 border">
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
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center gap-1.5 border-b pb-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <h3 className="font-bold text-slate-800 text-base">Cảnh báo lỗ hổng kiến thức chuẩn</h3>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-red-50 text-red-800 rounded-lg border border-red-100 space-y-1.5 shadow-2xs">
                <span className="font-extrabold block uppercase tracking-widest text-[9px] text-red-600">Báo động kiến thức</span>
                <p className="font-bold text-slate-800">Chương 1 Toán 6: Tập hợp số tự nhiên</p>
                <p className="text-slate-600 font-medium leading-relaxed">
                  Tỷ lệ làm sai phần Mệnh đề trắc nghiệm Đúng/Sai của Lớp 6A1 lên tới <strong className="text-red-600">54%</strong>.
                </p>
              </div>

              <div className="p-3 bg-amber-50 text-amber-800 rounded-lg border border-amber-100 space-y-1.5 shadow-2xs">
                <span className="font-extrabold block uppercase tracking-widest text-[9px] text-amber-600">Phản hồi cảnh báo</span>
                <p className="font-bold text-slate-800">Bài 2 Tin học 8: Truy cập thông tin</p>
                <p className="text-slate-600 font-medium leading-relaxed">
                  Học viên còn chủ quan mơ hồ khi bấm xác thực tài liệu số trực tuyến.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
