import React, { useState, useEffect } from 'react';
import { X, Wallet, CheckCircle2, AlertCircle, DollarSign, ArrowRight, ShieldCheck } from 'lucide-react';
import { api, formatVND, formatDateVN } from '../services/api';

export default function ConLaiModal({ isOpen, onClose, member, group, onAfterPayAll }) {
  if (!isOpen || !member || !group) return null;

  const [historyData, setHistoryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await api.getMemberHistory(member.id);
      if (res.success) {
        setHistoryData(res.data);
      } else {
        setError(res.error || 'Lỗi khi tải dữ liệu');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [member.id]);

  const handlePayAll = async () => {
    setSubmitting(true);
    setError('');
    try {
      const res = await api.payAllMemberDebt(member.id);
      if (res.success) {
        await onAfterPayAll();
        onClose();
      } else {
        setError(res.error || 'Có lỗi khi thanh toán toàn bộ');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const unpaidList = historyData?.unpaidPeriodsUpToNow || [];
  const totalDebt = historyData?.totalDebt || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-700 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-md">
              <Wallet className="w-6 h-6 text-slate-200" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold tracking-tight">Số Tiền Còn Lại Phải Đóng</h3>
              <p className="text-xs text-slate-300">Thành viên: <span className="font-bold underline text-white">{member.member_name}</span></p>
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
        <div className="p-6 overflow-y-auto space-y-5">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium">
              {error}
            </div>
          )}

          {loading ? (
            <div className="py-8 text-center text-slate-400 text-sm">Đang tính toán công nợ...</div>
          ) : (
            <>
              {/* Total Debt Summary Box */}
              <div className="bg-gradient-to-br from-rose-50 to-orange-50 border border-rose-200 rounded-3xl p-5 text-center">
                <div className="text-xs font-bold text-rose-800 uppercase tracking-wider mb-1">
                  Tổng Số Tiền Còn Nợ Đến Kỳ Hiện Tại ({group.current_period})
                </div>
                <div className="text-3xl font-black text-rose-600">
                  {formatVND(totalDebt)}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  {unpaidList.length === 0
                    ? 'Thành viên này đã đóng đủ tất cả các tháng đến nay, không còn nợ!'
                    : `Còn thiếu ${unpaidList.length} kỳ chưa thanh toán (đã trừ các tháng đã đóng).`}
                </p>
              </div>

              {/* Breakdown of unpaid periods */}
              {unpaidList.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Chi Tiết Các Kỳ Chưa Đóng:
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-2 max-h-48 overflow-y-auto space-y-1.5">
                    {unpaidList.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between px-3 py-2 bg-white rounded-xl border border-slate-200/80 text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-700 font-bold flex items-center justify-center text-[10px]">
                            {item.period_number}
                          </span>
                          <span className="font-semibold text-slate-700">Kỳ {item.period_number}</span>
                          <span className="text-slate-400">({formatDateVN(item.due_date)})</span>
                        </div>
                        <span className="font-bold text-rose-600">
                          {formatVND(item.amount_due)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Status summary */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-xs text-slate-600 flex items-center justify-between">
                <div>
                  Đã đóng hoàn tất: <span className="font-bold text-emerald-600">{historyData?.totalPaidCount || 0} kỳ</span>
                </div>
                <div>
                  Tổng số kỳ dây hụi: <span className="font-bold text-slate-800">{historyData?.totalPeriods || 20} kỳ</span>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Đóng
                </button>

                {totalDebt > 0 && (
                  <button
                    type="button"
                    onClick={handlePayAll}
                    disabled={submitting}
                    className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{submitting ? 'Đang thanh toán...' : 'Đóng Hết Tiền Huội'}</span>
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
