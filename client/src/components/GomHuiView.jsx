import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  CheckCircle2,
  AlertCircle,
  Clock,
  Calendar,
  Search,
  Filter,
  ArrowRight,
  RefreshCw,
  Phone,
  User,
  Layers,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { api, formatVND, formatDateVN } from '../services/api';
import DongHuiModal from './DongHuiModal';

export default function GomHuiView({ onSelectGroup }) {
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [activeTab, setActiveTab] = useState('today'); // 'today' | 'pending' | 'overdue' | 'paid' | 'all'
  const [selectedGroupId, setSelectedGroupId] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal for paying directly inside GomHuiView
  const [activePaymentModal, setActivePaymentModal] = useState({ isOpen: false, item: null });

  const loadData = async (date) => {
    setLoading(true);
    setError('');
    try {
      const res = await api.getGomHuiSummary(date || selectedDate);
      if (res.success) {
        setData(res.data);
      } else {
        setError(res.error || 'Không thể tải dữ liệu gom hụi');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(selectedDate);
  }, [selectedDate]);

  const handlePayConfirm = async (payload) => {
    const res = await api.payHui(payload);
    if (res.success) {
      await loadData(selectedDate);
    } else {
      throw new Error(res.error || 'Lỗi khi đóng hụi');
    }
  };

  const handleUnpayConfirm = async (payload) => {
    const res = await api.unpayHui(payload);
    if (res.success) {
      await loadData(selectedDate);
    } else {
      throw new Error(res.error || 'Lỗi khi hủy đóng hụi');
    }
  };

  if (loading && !data) {
    return (
      <div className="flex-1 p-6 flex items-center justify-center min-w-0 w-full">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs sm:text-sm font-semibold text-slate-600">Đang quét danh sách thành viên đến hạn gom hụi...</p>
        </div>
      </div>
    );
  }

  const stats = data?.stats || {
    todayDueCount: 0,
    todayDueTotal: 0,
    todayPaidCount: 0,
    todayPaidTotal: 0,
    currentPendingCount: 0,
    currentPendingTotal: 0,
    overdueCount: 0,
    overdueTotal: 0,
    totalGroups: 0,
  };

  const groups = data?.groups || [];
  const allItems = data?.items || [];

  // Filter items according to active tab, group filter, and search query
  const filteredItems = allItems.filter((item) => {
    // 1. Group filter
    if (selectedGroupId !== 'all' && item.group_id !== parseInt(selectedGroupId, 10)) {
      return false;
    }

    // 2. Search query (member name, phone, group name)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = (item.member_name || '').toLowerCase().includes(q);
      const matchPhone = (item.member_phone || '').toLowerCase().includes(q);
      const matchGroup = (item.group_name || '').toLowerCase().includes(q);
      if (!matchName && !matchPhone && !matchGroup) {
        return false;
      }
    }

    // 3. Tab filter
    if (activeTab === 'today') {
      return item.is_today && item.member_type !== 'winner';
    }
    if (activeTab === 'pending') {
      return item.is_current_period && item.is_paid === 0 && item.member_type !== 'winner';
    }
    if (activeTab === 'overdue') {
      return item.is_overdue && item.member_type !== 'winner';
    }
    if (activeTab === 'paid') {
      return item.is_paid === 1 && item.is_current_period;
    }
    if (activeTab === 'all') {
      return item.is_current_period;
    }

    return true;
  });

  return (
    <div className="flex-1 p-3 sm:p-6 lg:p-8 max-w-6xl w-full mx-auto space-y-4 sm:space-y-6 overflow-y-auto overflow-x-hidden min-w-0 pb-20 md:pb-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 min-w-0 w-full">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/25 shrink-0">
            <DollarSign className="w-5 h-5 sm:w-7 sm:h-7" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <h1 className="text-base sm:text-2xl font-black text-slate-900 tracking-tight">
                DANH SÁCH GOM HỤI
              </h1>
              <span className="text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 shrink-0">
                {formatDateVN(selectedDate)}
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-500 font-medium line-clamp-1 sm:line-clamp-none">
              Theo dõi thành viên đến hạn, kiểm tra tiền cần gom và đóng trực tiếp
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex items-center bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 shadow-sm text-xs flex-1 sm:flex-initial">
            <Calendar className="w-4 h-4 text-slate-400 mr-1.5 shrink-0" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="font-semibold text-slate-700 focus:outline-none bg-transparent w-full"
            />
          </div>

          <button
            onClick={() => loadData(selectedDate)}
            className="p-2 sm:px-3 sm:py-2 bg-white border border-slate-200 text-slate-600 hover:text-blue-600 rounded-xl shadow-sm transition-all flex items-center gap-1.5 text-xs font-bold cursor-pointer shrink-0"
            title="Làm mới danh sách"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Làm mới</span>
          </button>
        </div>
      </div>

      {/* Main Alert Notification Box */}
      <div className={`p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border shadow-sm transition-all min-w-0 w-full ${
        stats.todayDueCount > 0
          ? 'bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/15 border-amber-300 text-amber-950'
          : 'bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border-emerald-200 text-emerald-950'
      }`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 min-w-0">
          <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
            <div className={`w-9 h-9 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-md ${
              stats.todayDueCount > 0 ? 'bg-amber-500 text-white' : 'bg-emerald-600 text-white'
            }`}>
              {stats.todayDueCount > 0 ? <AlertCircle className="w-5 h-5 animate-pulse" /> : <CheckCircle2 className="w-5 h-5" />}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs sm:text-base font-black tracking-tight leading-snug">
                {stats.todayDueCount > 0 ? (
                  <>Hôm nay có <span className="text-amber-600 underline underline-offset-2">{stats.todayDueCount} thành viên</span> đến hạn gom hụi!</>
                ) : (
                  <>Hôm nay không có chân hụi nào đến hạn cần gom tiền!</>
                )}
              </div>
              <div className="text-[11px] sm:text-xs opacity-80 mt-0.5 truncate">
                {stats.todayDueCount > 0 ? (
                  <>Tổng tiền cần gom: <strong className="text-amber-700">{formatVND(stats.todayDueTotal)}</strong></>
                ) : (
                  <>Tất cả các khoản hụi hôm nay đã được gom đủ.</>
                )}
              </div>
            </div>
          </div>

          {stats.todayDueCount > 0 && (
            <button
              onClick={() => setActiveTab('today')}
              className="w-full sm:w-auto px-3.5 py-1.5 sm:px-4 sm:py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-extrabold shadow-md shadow-amber-500/25 transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
            >
              <span>Xem người cần gom</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 4 Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3.5 min-w-0 w-full">
        {/* Card 1: Đến hạn hôm nay */}
        <div
          onClick={() => setActiveTab('today')}
          className={`p-3 sm:p-4 rounded-2xl border transition-all cursor-pointer min-w-0 ${
            activeTab === 'today'
              ? 'bg-amber-500/10 border-amber-400 shadow-md ring-2 ring-amber-400/30'
              : 'bg-white border-slate-200 hover:border-amber-300 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">
            <span className="truncate">Đến Hạn Hôm Nay</span>
            <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-amber-500 shrink-0"></span>
          </div>
          <div className="text-base sm:text-2xl font-black text-amber-600 truncate">{stats.todayDueCount} người</div>
          <div className="text-[10px] sm:text-xs font-bold text-slate-600 mt-0.5 truncate">{formatVND(stats.todayDueTotal)}</div>
        </div>

        {/* Card 2: Chưa thu kỳ này */}
        <div
          onClick={() => setActiveTab('pending')}
          className={`p-3 sm:p-4 rounded-2xl border transition-all cursor-pointer min-w-0 ${
            activeTab === 'pending'
              ? 'bg-blue-500/10 border-blue-400 shadow-md ring-2 ring-blue-400/30'
              : 'bg-white border-slate-200 hover:border-blue-300 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">
            <span className="truncate">Chưa Thu Kỳ Này</span>
            <Clock className="w-3 h-3 text-blue-500 shrink-0" />
          </div>
          <div className="text-base sm:text-2xl font-black text-blue-600 truncate">{stats.currentPendingCount} người</div>
          <div className="text-[10px] sm:text-xs font-bold text-slate-600 mt-0.5 truncate">{formatVND(stats.currentPendingTotal)}</div>
        </div>

        {/* Card 3: Quá hạn */}
        <div
          onClick={() => setActiveTab('overdue')}
          className={`p-3 sm:p-4 rounded-2xl border transition-all cursor-pointer min-w-0 ${
            activeTab === 'overdue'
              ? 'bg-rose-500/10 border-rose-400 shadow-md ring-2 ring-rose-400/30'
              : 'bg-white border-slate-200 hover:border-rose-300 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">
            <span className="truncate">Quá Hạn Cần Nhắc</span>
            <AlertCircle className="w-3 h-3 text-rose-500 shrink-0" />
          </div>
          <div className="text-base sm:text-2xl font-black text-rose-600 truncate">{stats.overdueCount} người</div>
          <div className="text-[10px] sm:text-xs font-bold text-slate-600 mt-0.5 truncate">{formatVND(stats.overdueTotal)}</div>
        </div>

        {/* Card 4: Đã thu xong */}
        <div
          onClick={() => setActiveTab('paid')}
          className={`p-3 sm:p-4 rounded-2xl border transition-all cursor-pointer min-w-0 ${
            activeTab === 'paid'
              ? 'bg-emerald-500/10 border-emerald-400 shadow-md ring-2 ring-emerald-400/30'
              : 'bg-white border-slate-200 hover:border-emerald-300 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">
            <span className="truncate">Đã Thu Kỳ Này</span>
            <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
          </div>
          <div className="text-base sm:text-2xl font-black text-emerald-600 truncate">
            {allItems.filter(i => i.is_paid === 1 && i.is_current_period).length} người
          </div>
          <div className="text-[10px] sm:text-xs font-bold text-slate-600 mt-0.5 truncate">
            {formatVND(allItems.filter(i => i.is_paid === 1 && i.is_current_period).reduce((s, i) => s + (i.amount_paid || i.effective_amount_due), 0))}
          </div>
        </div>
      </div>

      {/* Main Filter & Listing Box */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-card overflow-hidden min-w-0 w-full">
        {/* Navigation Tabs & Controls */}
        <div className="p-3 sm:p-5 border-b border-slate-100 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 min-w-0">
          {/* Quick Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-none min-w-0 w-full lg:w-auto">
            <button
              onClick={() => setActiveTab('today')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1 cursor-pointer shrink-0 ${
                activeTab === 'today'
                  ? 'bg-amber-500 text-white shadow-md shadow-amber-500/25'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span>Đến hạn hôm nay</span>
              <span className={`px-1.5 py-0.2 rounded-md text-[10px] ${activeTab === 'today' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'}`}>
                {stats.todayDueCount}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('pending')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1 cursor-pointer shrink-0 ${
                activeTab === 'pending'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span>Chưa thu kỳ này</span>
              <span className={`px-1.5 py-0.2 rounded-md text-[10px] ${activeTab === 'pending' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'}`}>
                {stats.currentPendingCount}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('overdue')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1 cursor-pointer shrink-0 ${
                activeTab === 'overdue'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-500/25'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span>Quá hạn</span>
              <span className={`px-1.5 py-0.2 rounded-md text-[10px] ${activeTab === 'overdue' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'}`}>
                {stats.overdueCount}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('paid')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1 cursor-pointer shrink-0 ${
                activeTab === 'paid'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/25'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span>Đã thu xong</span>
            </button>

            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                activeTab === 'all'
                  ? 'bg-slate-800 text-white shadow-md'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Tất cả
            </button>
          </div>

          {/* Group Filter & Search Input */}
          <div className="flex flex-col sm:flex-row items-center gap-2 min-w-0 w-full lg:w-auto">
            <div className="w-full sm:w-48 relative min-w-0">
              <select
                value={selectedGroupId}
                onChange={(e) => setSelectedGroupId(e.target.value)}
                className="w-full pl-3 pr-7 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer truncate"
              >
                <option value="all">Tất cả dây hụi ({groups.length})</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name} (Kỳ {g.current_period || 1})
                  </option>
                ))}
              </select>
            </div>

            <div className="w-full sm:w-48 relative min-w-0">
              <input
                type="text"
                placeholder="Tìm tên, SĐT..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-3 pr-7 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
              <Search className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>
          </div>
        </div>

        {/* Member Collection List */}
        {filteredItems.length === 0 ? (
          <div className="p-8 sm:p-12 text-center space-y-3">
            <div className="w-14 h-14 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7 text-emerald-500" />
            </div>
            <div className="text-sm sm:text-base font-extrabold text-slate-700">
              Không có thành viên nào trong danh mục này
            </div>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              {activeTab === 'today'
                ? 'Tuyệt vời! Không có ai đến hạn gom tiền hôm nay hoặc tất cả đã được gom đủ.'
                : 'Thử chuyển sang tab bộ lọc khác hoặc kiểm tra lại từ khóa tìm kiếm.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredItems.map((item) => {
              const isWinner = item.member_type === 'winner';
              const isHuiChet = item.member_type === 'hui_chet';
              const isPaid = item.is_paid === 1;

              return (
                <div
                  key={`${item.group_id}-${item.period_number}-${item.member_id}`}
                  className={`p-3.5 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-colors ${
                    isPaid ? 'bg-slate-50/40 hover:bg-slate-50' : 'hover:bg-blue-50/20'
                  }`}
                >
                  {/* Member & Hui Group Details */}
                  <div className="flex items-start gap-3 flex-1 min-w-0 w-full sm:w-auto">
                    {/* Order / Avatar */}
                    <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center shrink-0 font-extrabold text-xs shadow-sm ${
                      isPaid
                        ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                        : item.is_today
                        ? 'bg-amber-100 text-amber-800 border border-amber-300 ring-2 ring-amber-400/30 animate-pulse'
                        : item.is_overdue
                        ? 'bg-rose-100 text-rose-800 border border-rose-200'
                        : 'bg-blue-100 text-blue-700 border border-blue-200'
                    }`}>
                      #{item.order_index}
                    </div>

                    <div className="space-y-1 flex-1 min-w-0">
                      {/* Name & Phone */}
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-extrabold text-slate-800 text-sm sm:text-base tracking-tight truncate">
                          {item.member_name}
                        </span>

                        {/* Phone if available */}
                        {item.member_phone && (
                          <a
                            href={`tel:${item.member_phone}`}
                            className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-1.5 py-0.5 rounded-lg transition-colors shrink-0"
                            title="Gọi cho thành viên này"
                          >
                            <Phone className="w-2.5 h-2.5" />
                            <span>{item.member_phone}</span>
                          </a>
                        )}

                        {/* Hui Type Badge */}
                        <span className={`text-[9px] sm:text-[10px] font-extrabold px-1.5 py-0.2 rounded shrink-0 ${
                          isWinner
                            ? 'bg-purple-100 text-purple-800'
                            : isHuiChet
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-blue-50 text-blue-700'
                        }`}>
                          {isWinner ? 'Hốt Kỳ Này' : isHuiChet ? `Hụi Chết (${item.won_period})` : 'Hụi Sống'}
                        </span>
                      </div>

                      {/* Group Name & Period info */}
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] sm:text-xs text-slate-500">
                        <span className="font-bold text-slate-700 truncate">
                          {item.group_name}
                        </span>
                        <span>•</span>
                        <span className="font-semibold text-slate-600 shrink-0">
                          Kỳ {item.period_number}/{item.total_members || 20}
                        </span>
                        <span>•</span>
                        <span className="shrink-0">
                          Hạn: {formatDateVN(item.due_date)}
                        </span>

                        {/* Due status badge */}
                        {item.is_today && !isPaid && (
                          <span className="text-[9px] font-black px-1.5 py-0.2 bg-amber-500 text-white rounded-full shrink-0">
                            Đến hạn
                          </span>
                        )}
                        {item.is_overdue && !isPaid && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 bg-rose-100 text-rose-700 rounded-full shrink-0">
                            Quá hạn
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Amount Due & Action Buttons */}
                  <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    {/* Amount Block */}
                    <div className="text-left sm:text-right">
                      <div className="text-[10px] font-bold text-slate-400 uppercase">
                        {isPaid ? 'Đã đóng' : 'Cần thu'}
                      </div>
                      <div className={`text-sm sm:text-base font-black tracking-tight ${
                        isPaid ? 'text-emerald-600' : isWinner ? 'text-purple-600' : 'text-slate-900'
                      }`}>
                        {isWinner ? '0 đ' : formatVND(isPaid ? (item.amount_paid || item.effective_amount_due) : item.effective_amount_due)}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {isWinner ? (
                        <div className="px-3 py-1.5 bg-purple-50 text-purple-700 rounded-xl text-xs font-bold border border-purple-100">
                          Hốt Kỳ Này
                        </div>
                      ) : isPaid ? (
                        <button
                          type="button"
                          onClick={() => setActivePaymentModal({ isOpen: true, item })}
                          className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Đã đóng</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setActivePaymentModal({ isOpen: true, item })}
                          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-md shadow-emerald-500/25 transition-all flex items-center gap-1 cursor-pointer transform active:scale-95"
                        >
                          <span>Đóng Hụi</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => onSelectGroup(item.group_id, item.period_number, item.member_id)}
                        className="p-1.5 sm:px-2.5 sm:py-1.5 bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-600 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                        title="Xem chi tiết dây hụi này"
                      >
                        <span className="hidden sm:inline">Vào Bảng</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Embedded DongHuiModal for 1-Click collection */}
      {activePaymentModal.isOpen && activePaymentModal.item && (
        <DongHuiModal
          isOpen={activePaymentModal.isOpen}
          onClose={() => setActivePaymentModal({ isOpen: false, item: null })}
          member={{
            id: activePaymentModal.item.member_id,
            member_name: activePaymentModal.item.member_name,
            won_period: activePaymentModal.item.won_period,
          }}
          group={{
            id: activePaymentModal.item.group_id,
            name: activePaymentModal.item.group_name,
            amount_per_member: activePaymentModal.item.amount_per_member,
            commission_rate: activePaymentModal.item.commission_rate,
          }}
          period={{
            period_number: activePaymentModal.item.period_number,
            due_date: activePaymentModal.item.due_date,
            is_settled: activePaymentModal.item.is_settled,
            bid_amount: activePaymentModal.item.bid_amount,
            winner_member_id: activePaymentModal.item.winner_member_id,
          }}
          payment={{
            is_paid: activePaymentModal.item.is_paid,
            amount_paid: activePaymentModal.item.amount_paid,
            paid_date: activePaymentModal.item.paid_date,
            payment_method: activePaymentModal.item.payment_method,
          }}
          onConfirmPay={handlePayConfirm}
          onConfirmUnpay={handleUnpayConfirm}
        />
      )}
    </div>
  );
}
