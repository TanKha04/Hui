import React, { useState, useEffect } from 'react';
import { X, Trophy, ArrowRight, DollarSign, Calculator, ShieldAlert, Check } from 'lucide-react';
import { formatVND } from '../services/api';
import confetti from 'canvas-confetti';

export default function HotHuiModal({ isOpen, onClose, member, group, period, onConfirmSettle }) {
  if (!isOpen || !member || !group || !period) return null;

  const [bidAmount, setBidAmount] = useState(200000);
  const [bidAmountText, setBidAmountText] = useState('200.000');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const M = group.amount_per_member; // e.g., 2,000,000
  const periodNumber = period.period_number; // e.g., 11
  const totalMembers = group.total_members || 20; // 20
  const remainingMonths = totalMembers - periodNumber; // e.g. 20 - 11 = 9
  const basePot = (totalMembers - 1) * M; // 19 * 2,000,000 = 38,000,000
  const totalDiscount = remainingMonths * bidAmount; // 9 * 200,000 = 1,800,000
  const commission = Math.round(M * (group.commission_rate || 0.5)); // 2,000,000 * 0.5 = 1,000,000
  const netPayout = basePot - totalDiscount - commission; // 35,200,000

  const handleBidChange = (e) => {
    const rawVal = e.target.value.replace(/\D/g, '');
    const num = parseInt(rawVal, 10) || 0;
    setBidAmount(num);
    setBidAmountText(num > 0 ? new Intl.NumberFormat('vi-VN').format(num) : '');
  };

  const handleQuickBid = (val) => {
    setBidAmount(val);
    setBidAmountText(new Intl.NumberFormat('vi-VN').format(val));
  };

  const handleConfirm = async () => {
    setLoading(true);
    setError('');
    try {
      await onConfirmSettle(member.id, bidAmount);
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Lỗi khi xác nhận hốt hụi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-blue-600 to-blue-700 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-md">
              <Trophy className="w-6 h-6 text-yellow-300" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold tracking-tight">Hốt Hụi - Kỳ {periodNumber}</h3>
              <p className="text-xs text-blue-100">Thành viên: <span className="font-bold underline">{member.member_name}</span></p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium">
              {error}
            </div>
          )}

          {/* Form: Số Tiền Lời (Kêu Thăm) */}
          <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-4">
            <label className="block text-xs font-bold text-blue-900 mb-1.5 uppercase tracking-wider flex items-center justify-between">
              <span>Số Tiền Lời (Kêu Thăm) <span className="text-red-500">*</span></span>
              <span className="text-blue-600 font-extrabold text-sm">{formatVND(bidAmount)}</span>
            </label>

            {/* Quick chips */}
            <div className="grid grid-cols-4 gap-2 mb-2.5">
              {[100000, 200000, 300000, 500000].map((val) => (
                <button
                  type="button"
                  key={val}
                  onClick={() => handleQuickBid(val)}
                  className={`py-1.5 text-xs font-bold rounded-xl border transition-all ${
                    bidAmount === val
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {val >= 1000000 ? `${val / 1000000}Tr` : `${val / 1000}k`}
                </button>
              ))}
            </div>

            <div className="relative">
              <input
                type="text"
                autoFocus
                placeholder="Nhập số tiền lời..."
                value={bidAmountText}
                onChange={handleBidChange}
                className="w-full pl-4 pr-16 py-2.5 text-base font-bold bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-600 transition-all text-slate-800"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                VNĐ
              </span>
            </div>
          </div>

          {/* Formula calculation card */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2.5 text-xs text-slate-600">
            <div className="font-bold text-slate-800 flex items-center gap-1.5 text-sm pb-1 border-b border-slate-200">
              <Calculator className="w-4 h-4 text-blue-600" />
              <span>Bảng Chi Tiết Công Thức Hốt Hụi</span>
            </div>

            <div className="flex justify-between items-center py-1">
              <span>1. Tiền gốc 19 phần ({formatVND(M)} × 19):</span>
              <span className="font-bold text-slate-800">{formatVND(basePot)}</span>
            </div>

            <div className="flex justify-between items-center py-1 text-red-600">
              <span>2. Trừ tiền lời {remainingMonths} tháng còn lại ({remainingMonths} × {formatVND(bidAmount)}):</span>
              <span className="font-bold">- {formatVND(totalDiscount)}</span>
            </div>

            <div className="flex justify-between items-center py-1 text-red-600">
              <span>3. Trừ thảo hụi cho Chủ Hụi (50% của 1 chân):</span>
              <span className="font-bold">- {formatVND(commission)}</span>
            </div>

            <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-sm">
              <span className="font-extrabold text-slate-900">Số Tiền Thực Hốt Được:</span>
              <span className="text-xl font-extrabold text-green-600">{formatVND(netPayout)}</span>
            </div>
          </div>

          {/* Note */}
          <p className="text-[11px] text-slate-400 italic">
            * Sau khi xác nhận, người này sẽ được ghi nhận đã hốt hụi ở Kỳ {periodNumber}. Nút hốt hụi của các thành viên khác trong kỳ này sẽ bị khóa lại.
          </p>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={loading}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-500/25 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>{loading ? 'Đang lưu...' : 'Xác Nhận Hốt Hụi'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
