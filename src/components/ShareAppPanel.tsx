/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Share2, Copy, Check, QrCode, ArrowLeft, Send, ExternalLink } from 'lucide-react';
import firebaseConfig from '../../firebase-applet-config.json';

interface ShareAppPanelProps {
  onBack?: () => void;
}

export default function ShareAppPanel({ onBack }: ShareAppPanelProps) {
  const [copied, setCopied] = useState(false);
  const origin = window.location.origin;
  const dbId = firebaseConfig.firestoreDatabaseId;
  const shareLink = `${origin}/?db=${dbId}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(shareLink)}`;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 p-5 rounded-2xl border border-slate-800">
        <div className="space-y-1">
          <h2 className="text-xl font-black text-slate-100 tracking-wide flex items-center gap-2">
            <Share2 className="w-5 h-5 text-emerald-400 animate-pulse" />
            TRUNG TÂM CHIA SẺ ỨNG DỤNG CHO HỌC SINH
          </h2>
          <p className="text-xs text-slate-400 font-medium">
            Tạo liên kết đồng bộ và mã QR Code cho học sinh kết nối dữ liệu thi trực tuyến 100% thành công.
          </p>
        </div>
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-black rounded-lg transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Quay lại
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        {/* Info & Copy Link Block */}
        <div className="md:col-span-3 space-y-5">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xs">
            <h3 className="text-sm font-black text-slate-200 uppercase tracking-wide flex items-center gap-2">
              <Send className="w-4 h-4 text-emerald-400" />
              Cách 1: Gửi đường liên kết đồng bộ (Đề xuất)
            </h3>
            
            <p className="text-xs text-slate-400 leading-relaxed font-medium">
              Hãy sao chép liên kết đặc biệt dưới đây và gửi cho học sinh qua <strong>Zalo, Messenger, SMS, Facebook</strong> hoặc dán lên bảng tin lớp học. 
              Chỉ cần học sinh <strong>bấm trực tiếp vào đường link này một lần duy nhất</strong>, điện thoại của các em sẽ tự động kết nối và tải đúng cơ sở dữ liệu lớp học, đề kiểm tra của nhà trường mà không lo bị báo lỗi sai mật khẩu lớp!
            </p>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={shareLink}
                  className="flex-1 bg-slate-950 border border-slate-800 text-emerald-400 font-mono text-xs px-3.5 py-3 rounded-xl focus:outline-none"
                />
                <button
                  onClick={handleCopy}
                  className={`px-4 py-3 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer ${
                    copied 
                      ? 'bg-emerald-500 text-slate-950 shadow-md' 
                      : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20'
                  }`}
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Đã chép' : 'Sao chép'}
                </button>
              </div>
            </div>

            <div className="bg-emerald-500/5 p-4 rounded-xl border border-emerald-500/10 text-[11px] text-emerald-400/90 leading-relaxed font-semibold">
              ℹ️ <strong>LƯU Ý CỰC KỲ QUAN TRỌNG:</strong> Việc copy link thuần túy không có mã đuôi <code className="bg-emerald-500/10 px-1 py-0.5 rounded font-mono">?db=...</code> sẽ làm học sinh không thể nạp được danh sách lớp học của các giáo viên khác. Thầy cô chỉ gửi đường link dài có chứa đuôi kết nối phía trên!
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-black text-slate-200 uppercase tracking-wide flex items-center gap-2">
              💡 Hướng dẫn mẫu gửi cho Học sinh:
            </h3>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-855 font-medium text-xs text-slate-300 leading-relaxed select-all">
              🔔 <strong>THÔNG BÁO KIỂM TRA TRỰC TUYẾN:</strong><br />
              Để tham gia phòng thi và làm bài rèn luyện, các em học sinh hãy thực hiện như sau:<br />
              1. Bấm trực tiếp vào liên kết kết nối này: <strong>{shareLink}</strong><br />
              2. Chọn mục <strong>HỌC SINH</strong>.<br />
              3. Nhập <strong>Mật khẩu lớp</strong> và <strong>Mật khẩu học sinh</strong> (Họ và tên viết liền không dấu, không khoảng trắng) để đăng nhập làm bài.<br />
              Chúc các em đạt kết quả cao!
            </div>
          </div>
        </div>

        {/* QR Code Block */}
        <div className="md:col-span-2">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center flex flex-col items-center justify-center space-y-4 shadow-xs h-full">
            <div className="space-y-1">
              <h3 className="text-sm font-black text-slate-200 uppercase tracking-wide flex items-center justify-center gap-1.5">
                <QrCode className="w-4 h-4 text-emerald-400" />
                Mã QR kết nối nhanh
              </h3>
              <p className="text-[11px] text-slate-400 font-medium">
                Quét mã này bằng Zalo hoặc Camera điện thoại để truy cập nhanh
              </p>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-slate-800 shadow-lg shrink-0">
              <img 
                src={qrCodeUrl} 
                alt="QR Code Sharing App" 
                className="w-48 h-48 block mx-auto select-none rounded"
                loading="lazy"
              />
            </div>

            <p className="text-[10px] text-slate-500 font-bold leading-normal">
              Thầy cô có thể trình chiếu mã QR này trên máy chiếu lớp học để học sinh dùng điện thoại quét trực tiếp trong phòng thi!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
