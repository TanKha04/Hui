import React, { useState } from 'react';
import { X, Plus, Calendar, DollarSign, Users, User, Phone, CheckCircle2 } from 'lucide-react';
import { formatVND } from '../services/api';

const QUICK_AMOUNTS = [
  1000000,
  2000000,
  3000000,
  5000000,
  10000000,
  20000000,
];

export default function CreateHuiModal({ isOpen, onClose, onCreated }) {
  if (!isOpen) return null;

  const today = new Date().toISOString().split('T')[0];
  const [name, setName] = useState('');
  const [amount, setAmount] = useState(2000000);
  const [customAmountText, setCustomAmountText] = useState('2.000.000');
  const [startDate, setStartDate] = useState(today);
  const [commissionRate, setCommissionRate] = useState(0.5); // 50%
  const [totalMembers, setTotalMembers] = useState(20);
  const [showAdvancedMembers, setShowAdvancedMembers] = useState(false);
  const [memberNames, setMemberNames] = useState(
    Array.from({ length: 20 }, (_, i) => `Thành viên ${i + 1}`)
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAmountChipClick = (val) => {
    setAmount(val);
    setCustomAmountText(new Intl.NumberFormat('vi-VN').format(val));
  };

  const handleCustomAmountChange = (e) => {
    const rawVal = e.target.value.replace(/\D/g, '');
    const num = parseInt(rawVal, 10) || 0;
    setAmount(num);
    setCustomAmountText(num > 0 ? new Intl.NumberFormat('vi-VN').format(num) : '');
  };

  const handleMemberNameChange = (index, value) => {
    const updated = [...memberNames];
    updated[index] = value;
    setMemberNames(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Vui lòng nhập tên dây hụi');
      return;
    }
    if (!amount || amount <= 0) {
      setError('Vui lòng nhập số tiền hụi hợp lệ');
      return;
    }
    if (!startDate) {
      setError('Vui lòng chọn ngày mở hụi');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const savedHostName = localStorage.getItem('huilink_host_name') || 'Chủ Hụi';
      const savedHostPhone = localStorage.getItem('huilink_host_phone') || '';

      const payload = {
        name: name.trim(),
        amount_per_member: amount,
        total_members: totalMembers,
        start_date: startDate,
        host_name: savedHostName,
        host_phone: savedHostPhone,
        commission_rate: commissionRate,
        member_names: memberNames,
      };

      const res = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (data.success) {
        onCreated(data.groupId);
        onClose();
      } else {
        setError(data.error || 'Có lỗi xảy ra khi tạo hụi');
      }
    } catch (err) {
      setError('Không thể kết nối đến máy chủ: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-md">
              <Plus className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold tracking-tight">Tạo Dây Hụi Mới</h2>
              <p className="text-xs text-blue-100">Khởi tạo bảng quản lý 20 phần hụi chuẩn xác & minh bạch</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium">
              {error}
            </div>
          )}

          {/* Group Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
              Tên Dây Hụi <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Ví dụ: Hụi Vàng 9999, Hụi Tiết Kiệm Tết 2026..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 focus:bg-white transition-all font-medium text-slate-800"
            />
          </div>

          {/* Amount per member with quick chips */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider flex items-center justify-between">
              <span>Số Tiền Hụi (Mỗi Phần / Kỳ) <span className="text-red-500">*</span></span>
              <span className="text-blue-600 font-bold text-sm">{formatVND(amount)}</span>
            </label>

            {/* Quick chips */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-2.5">
              {QUICK_AMOUNTS.map((val) => (
                <button
                  type="button"
                  key={val}
                  onClick={() => handleAmountChipClick(val)}
                  className={`py-1.5 px-2 text-xs font-bold rounded-xl border transition-all ${
                    amount === val
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                  }`}
                >
                  {val >= 1000000 ? `${val / 1000000} Triệu` : `${val / 1000}k`}
                </button>
              ))}
            </div>

            {/* Custom input */}
            <div className="relative">
              <input
                type="text"
                placeholder="Tự nhập số tiền..."
                value={customAmountText}
                onChange={handleCustomAmountChange}
                className="w-full pl-4 pr-16 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 focus:bg-white transition-all font-semibold text-slate-800"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                VNĐ
              </span>
            </div>
          </div>

          {/* Date & Commission grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                Ngày Mở Hụi (Kỳ 1) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 focus:bg-white transition-all font-medium text-slate-800"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                Hoa Hồng Chủ Hụi (Thảo Hụi)
              </label>
              <select
                value={commissionRate}
                onChange={(e) => setCommissionRate(parseFloat(e.target.value))}
                className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 focus:bg-white transition-all font-medium text-slate-800"
              >
                <option value={0.5}>50% của 1 phần ({formatVND(amount * 0.5)}) - Tiêu chuẩn</option>
                <option value={0.4}>40% của 1 phần ({formatVND(amount * 0.4)})</option>
                <option value={0.3}>30% của 1 phần ({formatVND(amount * 0.3)})</option>
                <option value={1.0}>100% của 1 phần ({formatVND(amount)})</option>
                <option value={0}>Không thu hoa hồng (0đ)</option>
              </select>
            </div>
          </div>

          {/* Member customize drawer */}
          <div className="border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={() => setShowAdvancedMembers(!showAdvancedMembers)}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1.5 focus:outline-none"
            >
              <Users className="w-4 h-4" />
              <span>{showAdvancedMembers ? '▲ Thu gọn danh sách 20 thành viên' : '▼ Tùy chỉnh danh sách 20 thành viên ngay bây giờ (Không bắt buộc, có thể sửa sau)'}</span>
            </button>

            {showAdvancedMembers && (
              <div className="mt-3 p-4 bg-slate-50 border border-slate-200 rounded-2xl max-h-56 overflow-y-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {memberNames.map((mName, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="w-6 text-xs font-bold text-slate-400 text-right">{idx + 1}.</span>
                      <input
                        type="text"
                        value={mName}
                        onChange={(e) => handleMemberNameChange(idx, e.target.value)}
                        placeholder={`Tên thành viên ${idx + 1}`}
                        className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-500/25 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{loading ? 'Đang tạo...' : 'Hoàn Thành (Tạo Bảng Hụi)'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
