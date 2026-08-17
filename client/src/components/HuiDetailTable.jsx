import React, { useState, useEffect } from 'react';
import {
  Printer,
  ChevronLeft,
  ChevronRight,
  Search,
  CheckCircle2,
  Calendar,
  Wallet,
  Trophy,
  ArrowLeft,
  DollarSign,
  AlertCircle,
  Clock,
  Sparkles,
  Layers,
  Pencil,
  User,
} from 'lucide-react';
import { api, formatVND, formatDateVN } from '../services/api';
import HotHuiModal from './HotHuiModal';
import DongHuiModal from './DongHuiModal';
import ConLaiModal from './ConLaiModal';
import NgayDongModal from './NgayDongModal';
import PrintHuiModal from './PrintHuiModal';

export default function HuiDetailTable({ groupId, onBack, initialPeriod, initialMemberIdForPay }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchMember, setSearchMember] = useState('');
  const [selectedPeriodNumber, setSelectedPeriodNumber] = useState(initialPeriod || 1);

  // Active Modals state
  const [hotHuiModal, setHotHuiModal] = useState({ isOpen: false, member: null });
  const [dongHuiModal, setDongHuiModal] = useState({ isOpen: false, member: null });
  const [conLaiModal, setConLaiModal] = useState({ isOpen: false, member: null });
  const [ngayDongModal, setNgayDongModal] = useState({ isOpen: false, member: null });
  const [printModalOpen, setPrintModalOpen] = useState(false);

  // Inline editing member names
  const [editingNames, setEditingNames] = useState({});

  const loadGroupDetail = async () => {
    try {
      const res = await api.getGroupDetail(groupId);
      if (res.success) {
        setData(res.data);
        const activePeriod = initialPeriod || res.data.group.current_period || 1;
        setSelectedPeriodNumber(activePeriod);

        if (initialMemberIdForPay) {
          const targetMem = res.data.members.find((m) => m.id === initialMemberIdForPay);
          if (targetMem) {
            setDongHuiModal({ isOpen: true, member: targetMem });
          }
        }
      } else {
        setError(res.error || 'Lỗi tải chi tiết hụi');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGroupDetail();
  }, [groupId]);

  if (loading) {
    return (
      <div className="flex-1 p-8 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm font-semibold text-slate-600">Đang tải bảng hụi...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex-1 p-8 text-center space-y-4">
        <div className="text-red-500 font-bold">{error || 'Không tìm thấy dữ liệu'}</div>
        <button onClick={onBack} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold cursor-pointer">
          Quay lại danh sách
        </button>
      </div>
    );
  }

  const { group, members, periods, currentPeriodPayments } = data;

  // Selected period object
  const currentPeriod = periods.find((p) => p.period_number === selectedPeriodNumber) || periods[0] || {};
  const isPeriodSettled = currentPeriod.is_settled === 1;
  const periodWinner = isPeriodSettled ? members.find((m) => m.id === currentPeriod.winner_member_id) : null;

  // Handle period change
  const handlePeriodChange = async (newPeriodNum) => {
    if (newPeriodNum < 1 || newPeriodNum > (group.total_members || 20)) return;
    setSelectedPeriodNumber(newPeriodNum);
    await api.setGroupPeriod(group.id, newPeriodNum);
    loadGroupDetail();
  };

  // Member name blur save
  const handleNameBlur = async (memberId, currentName) => {
    const newName = editingNames[memberId];
    if (newName !== undefined && newName.trim() !== '' && newName !== currentName) {
      await api.updateMember(memberId, { member_name: newName.trim() });
      loadGroupDetail();
    }
  };

  // Settle action (Hốt Hụi)
  const handleConfirmSettle = async (winnerMemberId, bidAmount) => {
    const res = await api.settlePeriod(group.id, selectedPeriodNumber, winnerMemberId, bidAmount);
    if (res.success) {
      loadGroupDetail();
    } else {
      throw new Error(res.error || 'Không thể xác nhận hốt hụi');
    }
  };

  // Pay action (Đóng Hụi)
  const handleConfirmPay = async (payload) => {
    const res = await api.payHui(payload);
    if (res.success) {
      loadGroupDetail();
    } else {
      throw new Error(res.error || 'Không thể đóng hụi');
    }
  };

  // Unpay action
  const handleConfirmUnpay = async (payload) => {
    const res = await api.unpayHui(payload);
    if (res.success) {
      loadGroupDetail();
    } else {
      throw new Error(res.error || 'Không thể hủy đóng hụi');
    }
  };

  // Filter members by search
  const filteredMembers = members.filter((m) =>
    (m.member_name || '').toLowerCase().includes(searchMember.toLowerCase())
  );

  const totalPaidCount = filteredMembers.filter(
    (m) => currentPeriodPayments.find((p) => p.member_id === m.id && p.is_paid === 1)
  ).length;

  return (
    <div className="flex-1 p-3 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-5 overflow-y-auto pb-24 md:pb-8">
      {/* Top Navigation Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-blue-600 bg-white hover:bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl transition-all shadow-sm cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Danh Sách Dây Hụi</span>
        </button>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          {isPeriodSettled && (
            <div className="text-xs font-bold bg-amber-50 border border-amber-200 text-amber-800 px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-sm">
              <Trophy className="w-3.5 h-3.5 text-amber-600" />
              <span>Người hốt Kỳ {selectedPeriodNumber}: <strong>{periodWinner?.member_name || 'Đã hốt'}</strong> (Lời: {formatVND(currentPeriod.bid_amount)})</span>
            </div>
          )}

          <button
            onClick={() => setPrintModalOpen(true)}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-500/25 transition-all flex items-center gap-1.5 cursor-pointer ml-auto sm:ml-0"
          >
            <Printer className="w-4 h-4" />
            <span>In Giấy Hụi</span>
          </button>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-card overflow-hidden">
        {/* Header Block */}
        <div className="p-5 sm:p-8 border-b border-slate-100 text-center space-y-2 bg-gradient-to-b from-slate-50/50 to-transparent">
          <div className="text-xs font-extrabold text-blue-600 uppercase tracking-wider flex items-center justify-center gap-1">
            <Layers className="w-3.5 h-3.5" />
            <span>BẢNG THEO DÕI HỤI</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Tên Hụi: {group.name}
          </h1>

          <div className="text-lg sm:text-xl font-extrabold text-rose-600">
            Mệnh giá: {formatVND(group.amount_per_member)} <span className="text-xs font-bold text-slate-400">/ chân</span>
          </div>

          <div className="text-xs sm:text-sm font-semibold text-slate-500 flex items-center justify-center gap-3 flex-wrap">
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span>Hạn Kỳ {selectedPeriodNumber}: <strong>{formatDateVN(currentPeriod.due_date || group.start_date)}</strong></span>
            </span>
            <span>•</span>
            <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">
              Đã thu: {totalPaidCount} / {group.total_members || 20} chân
            </span>
          </div>
        </div>

        {/* Toolbar: Navigation & Search */}
        <div className="p-3 sm:p-5 bg-slate-50/80 border-b border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Period selector buttons `< >` */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-center">
            <button
              onClick={() => handlePeriodChange(selectedPeriodNumber - 1)}
              disabled={selectedPeriodNumber <= 1}
              className="w-9 h-9 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed shadow-sm transition-all cursor-pointer"
              title="Kỳ trước"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="px-4 py-1.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-black text-slate-800 shadow-sm flex items-center gap-1">
              <span>Kỳ {selectedPeriodNumber}</span>
              <span className="text-slate-400 font-normal">/ {group.total_members || 20}</span>
            </div>

            <button
              onClick={() => handlePeriodChange(selectedPeriodNumber + 1)}
              disabled={selectedPeriodNumber >= (group.total_members || 20)}
              className="w-9 h-9 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed shadow-sm transition-all cursor-pointer"
              title="Kỳ kế tiếp"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Search box */}
          <div className="w-full sm:w-64 relative">
            <input
              type="text"
              placeholder="Tìm tên thành viên..."
              value={searchMember}
              onChange={(e) => setSearchMember(e.target.value)}
              className="w-full pl-3 pr-8 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-slate-700 placeholder:text-slate-400 shadow-sm"
            />
            <Search className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>
        </div>

        {/* DESKTOP VIEW: Table (Hidden on small screens) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[11px] tracking-wider">
                <th className="py-3.5 px-3 text-center w-12">STT</th>
                <th className="py-3.5 px-4 min-w-[200px]">Tên Thành Viên</th>
                <th className="py-3.5 px-3 text-center min-w-[110px]">Hốt Hụi</th>
                <th className="py-3.5 px-3 text-center min-w-[140px]">Đóng Hụi</th>
                <th className="py-3.5 px-3 text-center min-w-[100px]">Còn Lại</th>
                <th className="py-3.5 px-4 text-center min-w-[150px]">Ngày Đóng</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMembers.map((member) => {
                const payment = currentPeriodPayments.find((p) => p.member_id === member.id);
                const isPaid = payment && payment.is_paid === 1;
                const wonThisPeriod = currentPeriod.winner_member_id === member.id;
                const wonPreviousPeriod = member.won_period !== null && member.won_period < selectedPeriodNumber;
                const someoneElseWonThisPeriod = isPeriodSettled && !wonThisPeriod;
                const hasWonSomeOtherPeriod = member.won_period !== null && member.won_period !== selectedPeriodNumber;

                return (
                  <tr key={member.id} className="hover:bg-blue-50/30 transition-colors">
                    {/* STT */}
                    <td className="py-3 px-3 text-center font-bold text-slate-500 text-xs sm:text-sm">
                      {member.order_index}
                    </td>

                    {/* Tên Thành Viên (Editable input) */}
                    <td className="py-2.5 px-4">
                      <div className="relative flex items-center">
                        <input
                          type="text"
                          placeholder="Nhập tên..."
                          value={editingNames[member.id] !== undefined ? editingNames[member.id] : member.member_name}
                          onChange={(e) =>
                            setEditingNames({ ...editingNames, [member.id]: e.target.value })
                          }
                          onBlur={() => handleNameBlur(member.id, member.member_name)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.target.blur();
                            }
                          }}
                          className="w-full max-w-xs px-3 py-1.5 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all font-semibold text-slate-800 shadow-sm"
                        />
                      </div>
                    </td>

                    {/* Nút Hốt Hụi */}
                    <td className="py-2.5 px-3 text-center">
                      {wonThisPeriod ? (
                        <div className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-500 text-white rounded-xl text-xs font-bold shadow-sm animate-pulse">
                          <Trophy className="w-3.5 h-3.5" />
                          <span>Hốt Kỳ {selectedPeriodNumber}</span>
                        </div>
                      ) : hasWonSomeOtherPeriod ? (
                        <span className="text-[11px] font-bold text-slate-400 bg-slate-100 px-2.5 py-1.5 rounded-xl inline-block">
                          Đã hốt Kỳ {member.won_period}
                        </span>
                      ) : someoneElseWonThisPeriod ? (
                        <button
                          disabled
                          className="px-4 py-1.5 bg-slate-100 text-slate-300 rounded-xl text-xs font-bold cursor-not-allowed"
                        >
                          Hốt Hụi
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setHotHuiModal({ isOpen: true, member })}
                          className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm shadow-blue-500/25 transition-all transform active:scale-95 cursor-pointer"
                        >
                          Hốt Hụi
                        </button>
                      )}
                    </td>

                    {/* Nút Đóng Hụi */}
                    <td className="py-2.5 px-3 text-center">
                      {wonThisPeriod ? (
                        <span className="text-[11px] font-bold text-purple-700 bg-purple-50 border border-purple-100 px-3 py-1.5 rounded-xl inline-block">
                          Chân Hốt Kỳ Này
                        </span>
                      ) : isPaid ? (
                        <button
                          type="button"
                          onClick={() => setDongHuiModal({ isOpen: true, member })}
                          className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-700 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1 shadow-sm cursor-pointer"
                          title="Bấm để xem chi tiết hoặc hủy đóng"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Đã đóng kỳ này</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setDongHuiModal({ isOpen: true, member })}
                          className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm shadow-emerald-500/25 transition-all transform active:scale-95 cursor-pointer"
                        >
                          Đóng Hụi
                        </button>
                      )}
                    </td>

                    {/* Nút Còn Lại */}
                    <td className="py-2.5 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => setConLaiModal({ isOpen: true, member })}
                        className="px-3.5 py-1.5 bg-slate-600 hover:bg-slate-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm transition-all transform active:scale-95 cursor-pointer"
                      >
                        Còn Lại
                      </button>
                    </td>

                    {/* Ngày Đóng */}
                    <td className="py-2.5 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => setNgayDongModal({ isOpen: true, member })}
                        className="inline-flex items-center justify-between gap-2 px-3 py-1.5 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-xl text-xs font-semibold text-slate-700 transition-all shadow-sm group cursor-pointer"
                      >
                        <span className="group-hover:text-blue-600">
                          {formatDateVN(currentPeriod.due_date)}
                        </span>
                        <Calendar className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 shrink-0" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* MOBILE VIEW: Touch-Friendly Card Grid (Visible on small screens) */}
        <div className="md:hidden divide-y divide-slate-100 p-3 space-y-3">
          {filteredMembers.map((member) => {
            const payment = currentPeriodPayments.find((p) => p.member_id === member.id);
            const isPaid = payment && payment.is_paid === 1;
            const wonThisPeriod = currentPeriod.winner_member_id === member.id;
            const wonPreviousPeriod = member.won_period !== null && member.won_period < selectedPeriodNumber;
            const someoneElseWonThisPeriod = isPeriodSettled && !wonThisPeriod;
            const hasWonSomeOtherPeriod = member.won_period !== null && member.won_period !== selectedPeriodNumber;

            return (
              <div key={member.id} className="bg-slate-50/60 border border-slate-200/80 rounded-2xl p-4 space-y-3 shadow-sm">
                {/* Header: STT, Name, Badge */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="w-7 h-7 rounded-xl bg-blue-600 text-white font-extrabold text-xs flex items-center justify-center shrink-0 shadow-sm">
                      #{member.order_index}
                    </span>
                    <input
                      type="text"
                      placeholder="Nhập tên..."
                      value={editingNames[member.id] !== undefined ? editingNames[member.id] : member.member_name}
                      onChange={(e) =>
                        setEditingNames({ ...editingNames, [member.id]: e.target.value })
                      }
                      onBlur={() => handleNameBlur(member.id, member.member_name)}
                      className="w-full px-2.5 py-1 text-sm font-extrabold bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 text-slate-800"
                    />
                  </div>

                  {/* Badge */}
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-md shrink-0 ${
                    wonThisPeriod
                      ? 'bg-amber-500 text-white'
                      : wonPreviousPeriod
                      ? 'bg-slate-200 text-slate-700'
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {wonThisPeriod ? 'Hốt Kỳ Này' : wonPreviousPeriod ? `Hụi Chết (Kỳ ${member.won_period})` : 'Hụi Sống'}
                  </span>
                </div>

                {/* Actions 2x2 Grid */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  {/* Đóng Hụi */}
                  {wonThisPeriod ? (
                    <div className="py-2.5 text-center bg-purple-50 text-purple-700 font-bold text-xs rounded-xl border border-purple-100">
                      Chân Hốt Kỳ Này
                    </div>
                  ) : isPaid ? (
                    <button
                      type="button"
                      onClick={() => setDongHuiModal({ isOpen: true, member })}
                      className="py-2.5 px-2 bg-emerald-50 border border-emerald-300 text-emerald-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1 shadow-sm cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Đã đóng hụi</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setDongHuiModal({ isOpen: true, member })}
                      className="py-2.5 px-2 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-500/25 flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <span>Đóng Hụi</span>
                    </button>
                  )}

                  {/* Hốt Hụi */}
                  {wonThisPeriod ? (
                    <div className="py-2.5 text-center bg-amber-500 text-white font-bold text-xs rounded-xl shadow-sm">
                      Đã Hốt Kỳ Này
                    </div>
                  ) : hasWonSomeOtherPeriod ? (
                    <div className="py-2.5 text-center bg-slate-100 text-slate-400 font-bold text-xs rounded-xl">
                      Đã hốt Kỳ {member.won_period}
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={someoneElseWonThisPeriod}
                      onClick={() => setHotHuiModal({ isOpen: true, member })}
                      className={`py-2.5 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 cursor-pointer ${
                        someoneElseWonThisPeriod
                          ? 'bg-slate-100 text-slate-300 cursor-not-allowed'
                          : 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                      }`}
                    >
                      <Trophy className="w-3.5 h-3.5" />
                      <span>Hốt Hụi</span>
                    </button>
                  )}

                  {/* Còn Lại */}
                  <button
                    type="button"
                    onClick={() => setConLaiModal({ isOpen: true, member })}
                    className="py-2 px-2 bg-slate-700 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Wallet className="w-3.5 h-3.5" />
                    <span>Xem Còn Lại</span>
                  </button>

                  {/* Ngày Đóng */}
                  <button
                    type="button"
                    onClick={() => setNgayDongModal({ isOpen: true, member })}
                    className="py-2 px-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Lịch Sử Đóng</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer info bar */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            Đang hiển thị <span className="font-bold text-slate-800">{filteredMembers.length} / {group.total_members || 20}</span> thành viên
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span> Hụi Sống
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span> Hụi Chết
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span> Đã Đóng Kỳ Này
            </span>
          </div>
        </div>
      </div>

      {/* Modals */}
      {hotHuiModal.isOpen && (
        <HotHuiModal
          isOpen={hotHuiModal.isOpen}
          onClose={() => setHotHuiModal({ isOpen: false, member: null })}
          member={hotHuiModal.member}
          group={group}
          period={currentPeriod}
          onConfirmSettle={handleConfirmSettle}
        />
      )}

      {dongHuiModal.isOpen && (
        <DongHuiModal
          isOpen={dongHuiModal.isOpen}
          onClose={() => setDongHuiModal({ isOpen: false, member: null })}
          member={dongHuiModal.member}
          group={group}
          period={currentPeriod}
          payment={currentPeriodPayments.find((p) => p.member_id === dongHuiModal.member?.id)}
          onConfirmPay={handleConfirmPay}
          onConfirmUnpay={handleConfirmUnpay}
        />
      )}

      {conLaiModal.isOpen && (
        <ConLaiModal
          isOpen={conLaiModal.isOpen}
          onClose={() => setConLaiModal({ isOpen: false, member: null })}
          member={conLaiModal.member}
          group={group}
          onAfterPayAll={loadGroupDetail}
        />
      )}

      {ngayDongModal.isOpen && (
        <NgayDongModal
          isOpen={ngayDongModal.isOpen}
          onClose={() => setNgayDongModal({ isOpen: false, member: null })}
          member={ngayDongModal.member}
          group={group}
          period={currentPeriod}
        />
      )}

      {printModalOpen && (
        <PrintHuiModal
          isOpen={printModalOpen}
          onClose={() => setPrintModalOpen(false)}
          group={group}
          members={members}
          periods={periods}
        />
      )}
    </div>
  );
}
