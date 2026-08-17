import React from 'react';
import { X, Download, Printer } from 'lucide-react';
import { formatVND, formatDateVN, api } from '../services/api';

export default function PrintHuiModal({ isOpen, onClose, group, members, periods }) {
  if (!isOpen || !group) return null;

  const handleDownloadDocx = () => {
    window.location.href = api.getExportDocxUrl(group.id);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn print:p-0 print:bg-white print:static">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh] print:max-h-none print:shadow-none print:border-none print:w-full">
        {/* Header - Hidden during print */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-between print:hidden shrink-0">
          <div>
            <h3 className="text-base font-extrabold tracking-tight">Mẫu Giấy Hụi Chuẩn</h3>
            <p className="text-xs text-blue-100">Dây hụi: <span className="font-bold underline">{group.name}</span></p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadDocx}
              className="px-3.5 py-2 bg-white text-blue-700 hover:bg-blue-50 rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Tải File Word (.docx)</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Printer className="w-4 h-4" />
              <span>In Ngay</span>
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-white ml-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Paper preview matching the traditional Vietnamese Hui sheet format */}
        <div className="p-6 sm:p-10 overflow-y-auto bg-slate-100 print:p-0 print:bg-white flex justify-center">
          <div className="bg-white shadow-lg rounded-2xl p-8 sm:p-12 max-w-lg w-full border border-slate-200 print:border-none print:shadow-none print:p-0 text-slate-900 text-sm leading-relaxed space-y-6">
            {/* Centered Top Header */}
            <div className="text-center space-y-2 pb-2">
              <div className="text-lg sm:text-xl font-bold tracking-wide">
                Đầu Thảo {group.host_name || 'Chủ Hụi'}
              </div>
              <div className="text-base sm:text-lg font-semibold text-slate-800">
                Huội: {formatVND(group.amount_per_member)}
              </div>
              <div className="text-sm sm:text-base font-semibold text-slate-700">
                Khui ngày: {formatDateVN(group.start_date)}
              </div>
            </div>

            {/* Numbered Members List (1 to 20) */}
            <div className="pt-2 pl-4 sm:pl-8 space-y-2 text-sm sm:text-base font-medium">
              {members.map((m, idx) => (
                <div key={m.id || idx} className="flex items-center gap-2">
                  <span className="font-semibold text-slate-800 w-7 text-left">{idx + 1}.</span>
                  <span className="text-slate-900 font-medium">
                    {m.member_name || `Thành viên ${idx + 1}`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
