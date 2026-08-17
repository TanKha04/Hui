import React, { useState, useEffect } from 'react';
import { X, Calendar, CheckCircle2, Clock, Check, AlertCircle } from 'lucide-react';
import { api, formatVND, formatDateVN } from '../services/api';

export default function NgayDongModal({ isOpen, onClose, member, group, period }) {
  if (!isOpen || !member || !group) return null;

  const [historyData, setHistoryData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const res = await api.getMemberHistory(member.id);
        if (res.success) {
          setHistoryData(res.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [member.id]);

  const paidCount = historyData?.totalPaidCount || 0;
  const totalCount = historyData?.totalPeriods || group.total_members || 20;
  const payments = historyData?.payments || [];
  const percent = Math.round((paidCount / totalCount) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-md">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold tracking-tight">Lịch Sử Ngày Đóng Hụi</h3>
              <p className="text-xs text-blue-100">Thành viên: <span className="font-bold underline">{member.member_name}</span></p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4">
          {/* Main summary card */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-3xl p-5 text-center">
            <div className="text-xs font-bold text-blue-800 uppercase tracking-wider mb-1">
              Tiến Độ Đóng Hụi
            </div>
            <div className="text-3xl font-extrabold text-blue-700">
              Đã đóng {paidCount} / {totalCount} tháng
            </div>
            <div className="text-xs text-slate-500 mt-1">
              (Số lần thực hiện bấm nút đóng hụi thành công: <span className="font-bold text-blue-600">{paidCount} lần</span>)
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-blue-200/60 rounded-full h-3 mt-4 overflow-hidden p-0.5">
              <div
                className="bg-blue-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${percent}%` }}
              ></div>
            </div>
            <div className="text-right text-[10px] font-bold text-blue-600 mt-1">
              {percent}% hoàn thành
            </div>
          </div>

          {/* Current period info */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-xs space-y-1">
            <div className="font-bold text-slate-700">Thông Tin Kỳ Hiện Tại (Kỳ {period?.period_number}):</div>
            <div className="flex justify-between text-slate-600">
              <span>Ngày đóng quy định:</span>
              <span className="font-semibold text-slate-900">{formatDateVN(period?.due_date)}</span>
            </div>
          </div>

          {/* Detailed timeline list */}
          <div>
            <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Nhật Ký Chi Tiết Các Kỳ:
            </div>
            <div className="max-h-52 overflow-y-auto space-y-1.5 pr-1">
              {loading ? (
                <div className="text-center py-4 text-xs text-slate-400">Đang tải...</div>
              ) : (
                payments.map((p) => (
                  <div
                    key={p.id}
                    className={`flex items-center justify-between p-2.5 rounded-xl border text-xs ${
                      p.is_paid === 1
                        ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                        : 'bg-white border-slate-200 text-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        p.is_paid === 1 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {p.period_number}
                      </div>
                      <div>
                        <div className="font-bold">Kỳ {p.period_number} ({formatDateVN(p.due_date)})</div>
                        {p.paid_date && (
                          <div className="text-[10px] text-emerald-700">Đã đóng ngày: {formatDateVN(p.paid_date)}</div>
                        )}
                      </div>
                    </div>

                    <div>
                      {p.is_paid === 1 ? (
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 font-bold rounded-lg text-[10px]">
                          Đã đóng ({formatVND(p.amount_paid)})
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-500 font-medium rounded-lg text-[10px]">
                          Chưa đóng
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition-all"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
