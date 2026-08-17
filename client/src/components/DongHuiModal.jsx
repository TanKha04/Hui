import React, { useState } from 'react';
import { X, CheckCircle2, Calendar, CreditCard, DollarSign, AlertCircle, Undo2 } from 'lucide-react';
import { formatVND, formatDateVN } from '../services/api';

export default function DongHuiModal({ isOpen, onClose, member, group, period, payment, onConfirmPay, onConfirmUnpay }) {
  if (!isOpen || !member || !group || !period) return null;

  const today = new Date().toISOString().split('T')[0];
  const [paidDate, setPaidDate] = useState(payment?.paid_date || today);
  const [paymentMethod, setPaymentMethod] = useState(payment?.payment_method || 'cash');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isAlreadyPaid = payment && payment.is_paid === 1;

  // Determine amount due
  let amountDue = group.amount_per_member;
  const isWinnerThisPeriod = period.winner_member_id === member.id;
  const isHuiChet = member.won_period !== null && member.won_period < period.period_number;
  const isHuiSong = !isHuiChet && !isWinnerThisPeriod;

  if (isWinnerThisPeriod) {
    amountDue = 0;
  } else if (period.is_settled === 1 && isHuiSong) {
    amountDue = Math.max(0, group.amount_per_member - (period.bid_amount || 0));
  } else {
    amountDue = group.amount_per_member;
  }

  const handlePay = async () => {
    setLoading(true);
    setError('');
    try {
      await onConfirmPay({
        group_id: group.id,
        period_number: period.period_number,
        member_id: member.id,
        paid_date: paidDate,
        payment_method: paymentMethod,
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Lỗi khi đóng hụi');
    } finally {
      setLoading(false);
    }
  };

  const handleUnpay = async () => {
    setLoading(true);
    setError('');
    try {
      await onConfirmUnpay({
        group_id: group.id,
        period_number: period.period_number,
        member_id: member.id,
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Lỗi khi hủy');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className={`px-6 py-5 ${isAlreadyPaid ? 'bg-gradient-to-r from-emerald-600 to-teal-600' : 'bg-gradient-to-r from-emerald-600 to-green-600'} text-white flex items-center justify-between shrink-0`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-md">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold tracking-tight">
                {isAlreadyPaid ? 'Đã Đóng Huội Tháng Này' : 'Đóng Huội'} - Kỳ {period.period_number}
              </h3>
              <p className="text-xs text-green-100">Thành viên: <span className="font-bold underline">{member.member_name}</span></p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 overflow-y-auto">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium">
              {error}
            </div>
          )}

          {isAlreadyPaid ? (
            /* Already Paid State */
            <div className="text-center py-3 space-y-3">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner animate-bounce">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div>
                <h4 className="text-base font-extrabold text-emerald-700">
                  Thành viên này đã đóng huội trong tháng này!
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  Đã thanh toán số tiền: <span className="font-bold text-slate-800">{formatVND(payment?.amount_paid || amountDue)}</span>
                </p>
                <p className="text-xs text-slate-500">
                  Ngày đóng: <span className="font-bold text-slate-800">{formatDateVN(payment?.paid_date)}</span>
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleUnpay}
                  disabled={loading}
                  className="px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-xl transition-colors flex items-center gap-1.5"
                >
                  <Undo2 className="w-3.5 h-3.5" />
                  <span>Hủy trạng thái đóng (nếu bấm nhầm)</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition-all"
                >
                  Đóng
                </button>
              </div>
            </div>
          ) : (
            /* Not Paid Yet State */
            <div className="space-y-4">
              {/* Type of Hui Badge */}
              <div className="flex items-center justify-between text-xs px-3 py-2 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-500">Loại chân hụi kỳ này:</span>
                <span className={`font-bold px-2 py-0.5 rounded-lg ${isHuiChet ? 'bg-amber-100 text-amber-800' : isWinnerThisPeriod ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                  {isWinnerThisPeriod ? 'Người hốt kỳ này' : isHuiChet ? 'Hụi Chết (Đã hốt trước đó)' : 'Hụi Sống (Chưa hốt)'}
                </span>
              </div>

              {/* Amount due */}
              <div className="bg-emerald-50/60 border border-emerald-200 rounded-2xl p-4 text-center">
                <div className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-1">
                  Số Tiền Cần Đóng Tháng Này
                </div>
                <div className="text-3xl font-extrabold text-emerald-600">
                  {formatVND(amountDue)}
                </div>
                {period.is_settled === 1 && isHuiSong && period.bid_amount > 0 && (
                  <div className="text-[11px] text-emerald-700 mt-1">
                    (Mệnh giá {formatVND(group.amount_per_member)} - Tiền lời {formatVND(period.bid_amount)})
                  </div>
                )}
              </div>

              {/* Paid Date */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Ngày Tháng Năm Hiện Tại / Ngày Đóng</span>
                </label>
                <input
                  type="date"
                  value={paidDate}
                  onChange={(e) => setPaidDate(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 focus:bg-white transition-all font-medium text-slate-800"
                />
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider flex items-center gap-1">
                  <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                  <span>Hình Thức Thanh Toán</span>
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 focus:bg-white transition-all font-medium text-slate-800"
                >
                  <option value="cash">Tiền mặt</option>
                  <option value="transfer">Chuyển khoản ngân hàng</option>
                  <option value="momo">Ví điện tử / Khác</option>
                </select>
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handlePay}
                  disabled={loading}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-emerald-500/25 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{loading ? 'Đang lưu...' : 'Xác Nhận Đóng Huội'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
