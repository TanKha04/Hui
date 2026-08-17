import React, { useState } from 'react';
import {
  Plus,
  ChevronRight,
  BookUser,
  Calendar,
  Users,
  DollarSign,
  Trophy,
  Trash2,
  ArrowRight,
  TrendingUp,
  Sparkles,
  Layers,
  Search,
  Printer,
  ShieldCheck,
  CheckCircle2,
  X,
  UserCheck,
} from 'lucide-react';
import { formatVND, formatDateVN } from '../services/api';

const removeAccents = (str) => {
  if (!str) return '';
  return str
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .trim();
};

export default function HuiListView({
  groups,
  onSelectGroup,
  onOpenCreateModal,
  onDeleteGroup,
  searchQuery = '',
  setSearchQuery,
}) {
  const [filterStatus, setFilterStatus] = useState('all'); // 'all' | 'active' | 'completed'

  const normalizedQuery = removeAccents(searchQuery);

  const processedGroups = groups.map((g) => {
    const memberList = Array.isArray(g.member_names) ? g.member_names : [];
    let matchingMembers = [];

    let matchSearch = true;
    if (normalizedQuery) {
      const matchName = removeAccents(g.name).includes(normalizedQuery);
      const matchHost = removeAccents(g.host_name).includes(normalizedQuery);
      matchingMembers = memberList.filter((m) => removeAccents(m).includes(normalizedQuery));
      const matchMember = matchingMembers.length > 0;
      matchSearch = matchName || matchHost || matchMember;
    }

    const isCompleted = (g.current_period || 1) >= (g.total_members || 20);
    let matchFilter = true;
    if (filterStatus === 'active') matchFilter = !isCompleted;
    if (filterStatus === 'completed') matchFilter = isCompleted;

    return {
      ...g,
      matchSearch,
      matchFilter,
      matchingMembers,
      isCompleted,
    };
  });

  const filteredGroups = processedGroups.filter((g) => g.matchSearch && g.matchFilter);

  const totalPotValue = groups.reduce(
    (sum, g) => sum + (g.amount_per_member * (g.total_members || 20)),
    0
  );
  const totalMembersCount = groups.reduce(
    (sum, g) => sum + (g.total_members || 20),
    0
  );

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 overflow-y-auto pb-24 md:pb-8">
      {/* Top Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-blue-700 text-white flex items-center justify-center shadow-lg shadow-blue-500/30 shrink-0">
            <DollarSign className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              QUẢN LÝ DÂY HỤI
              <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700">
                {groups.length} Dây
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Theo dõi danh sách các dây hụi, tiến độ khui hụi và quản lý dòng tiền an toàn
            </p>
          </div>
        </div>

        <button
          onClick={onOpenCreateModal}
          className="w-full sm:w-auto px-5 py-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-600 text-white rounded-2xl font-extrabold text-xs sm:text-sm shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40 transition-all flex items-center justify-center gap-2 transform active:scale-95 cursor-pointer"
        >
          <Plus className="w-5 h-5" />
          <span>Tạo Dây Hụi Mới</span>
        </button>
      </div>

      {/* Summary Statistic Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-card space-y-1.5 hover:border-blue-300 transition-colors">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Tổng Số Dây Hụi</span>
            <Layers className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900">{groups.length} Dây</div>
          <div className="text-xs text-blue-600 font-bold flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            <span>Tổng cộng {totalMembersCount} phần tham gia</span>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-card space-y-1.5 hover:border-emerald-300 transition-colors">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Tổng Quy Mô Vốn</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-600 truncate">{formatVND(totalPotValue)}</div>
          <div className="text-xs text-slate-500 font-medium">Tích lũy các dây đang hoạt động</div>
        </div>
      </div>

      {/* Filter Tabs & Search Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-3.5">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              filterStatus === 'all'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            Tất cả ({groups.length})
          </button>
          <button
            onClick={() => setFilterStatus('active')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              filterStatus === 'active'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            Đang chạy ({groups.filter(g => (g.current_period || 1) < (g.total_members || 20)).length})
          </button>
          <button
            onClick={() => setFilterStatus('completed')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              filterStatus === 'completed'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            Hoàn tất ({groups.filter(g => (g.current_period || 1) >= (g.total_members || 20)).length})
          </button>
        </div>

        {/* Search Bar */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 sm:w-80 min-w-0">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery && setSearchQuery(e.target.value)}
              placeholder="Tìm tên hụi, thành viên, chủ hụi..."
              className="w-full pl-9 pr-8 py-2 text-xs bg-white border border-slate-200 hover:border-slate-300 focus:border-blue-500 rounded-xl font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery && setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
                title="Xóa tìm kiếm"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="text-xs text-slate-400 font-semibold whitespace-nowrap hidden lg:block">
            {normalizedQuery ? (
              <span>Tìm thấy <strong>{filteredGroups.length}</strong> dây hụi</span>
            ) : (
              <span>Hiển thị <strong>{filteredGroups.length}</strong> dây hụi</span>
            )}
          </div>
        </div>
      </div>

      {/* Grid of Hui Cards */}
      {filteredGroups.length === 0 ? (
        normalizedQuery ? (
          <div className="bg-white rounded-3xl p-8 sm:p-12 text-center border border-slate-200/90 shadow-card space-y-4 max-w-lg mx-auto">
            <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
              <Search className="w-8 h-8" />
            </div>
            <h3 className="text-base sm:text-lg font-black text-slate-800">Không tìm thấy kết quả phù hợp</h3>
            <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
              Không có dây hụi hoặc thành viên nào khớp với từ khóa <strong className="text-slate-800 font-bold">"{searchQuery}"</strong>.
            </p>
            <button
              onClick={() => setSearchQuery && setSearchQuery('')}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5 active:scale-95"
            >
              <X className="w-3.5 h-3.5" />
              <span>Xóa bộ lọc tìm kiếm</span>
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-8 sm:p-14 text-center border border-slate-200/90 shadow-card space-y-4 max-w-lg mx-auto">
            <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
              <BookUser className="w-10 h-10" />
            </div>
            <h3 className="text-lg font-black text-slate-800">Chưa có dây hụi nào phù hợp</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
              Hãy bắt đầu tạo dây hụi đầu tiên để quản lý danh sách các thành viên, số tiền hốt và tiến độ thu hụi hàng kỳ.
            </p>
            <button
              onClick={onOpenCreateModal}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-black shadow-lg shadow-blue-500/25 transition-all cursor-pointer transform active:scale-95 inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Tạo Dây Hụi Mới Ngay</span>
            </button>
          </div>
        )
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
          {filteredGroups.map((group) => {
            const total = group.total_members || 20;
            const current = group.current_period || 1;
            const progressPercent = Math.min(100, Math.round((current / total) * 100));
            const isCompleted = group.isCompleted;

            return (
              <div
                key={group.id}
                onClick={() => onSelectGroup(group.id)}
                className="group bg-white hover:bg-gradient-to-b hover:from-white hover:to-blue-50/30 border border-slate-200 hover:border-blue-400 rounded-3xl p-5 sm:p-6 shadow-card hover:shadow-xl transition-all duration-200 flex flex-col justify-between cursor-pointer space-y-4 relative overflow-hidden"
              >
                {/* Top header on card */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform shrink-0">
                      <BookUser className="w-6 h-6" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-base sm:text-lg font-black text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                          {group.name}
                        </h3>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full shrink-0 ${
                          isCompleted
                            ? 'bg-slate-100 text-slate-600'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {isCompleted ? 'Hoàn tất' : 'Đang chạy'}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 font-medium flex items-center gap-1.5 mt-0.5">
                        <span>Chủ hụi: <strong>{group.host_name || 'Chủ Hụi'}</strong></span>
                        <span>•</span>
                        <span>Mở: {formatDateVN(group.start_date)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Delete button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm(`Bạn có chắc chắn muốn xóa dây hụi "${group.name}" không?`)) {
                        onDeleteGroup(group.id);
                      }
                    }}
                    className="p-2 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all opacity-80 hover:opacity-100 cursor-pointer"
                    title="Xóa dây hụi"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Middle Info: Amount & Progress */}
                <div className="space-y-3 pt-1">
                  <div className="flex items-center justify-between bg-slate-50/80 rounded-2xl p-3 border border-slate-100">
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mệnh Giá 1 Phần</div>
                      <div className="text-base sm:text-lg font-black text-rose-600">
                        {formatVND(group.amount_per_member)} <span className="text-xs font-bold text-slate-400">/ kỳ</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tổng Quy Mô Dây</div>
                      <div className="text-xs sm:text-sm font-extrabold text-slate-800">
                        {formatVND(group.amount_per_member * total)}
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-600 flex items-center gap-1">
                        <Trophy className="w-3.5 h-3.5 text-amber-500" />
                        <span>Tiến độ: Kỳ {current} / {total}</span>
                      </span>
                      <span className="text-blue-600">{progressPercent}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full transition-all duration-500"
                        style={{ width: `${progressPercent}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Matching members indicator when searching */}
                {group.matchingMembers && group.matchingMembers.length > 0 && (
                  <div className="bg-blue-50/90 border border-blue-200/80 rounded-xl px-3 py-1.5 flex items-center gap-2 text-xs">
                    <UserCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <div className="text-slate-600 truncate">
                      <span className="font-medium text-slate-500">Thành viên khớp: </span>
                      <strong className="text-blue-700 font-bold">{group.matchingMembers.join(', ')}</strong>
                    </div>
                  </div>
                )}

                {/* Bottom Actions */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="text-xs text-slate-500 font-semibold flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    <span>{total} thành viên</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-blue-600 group-hover:text-blue-700 flex items-center gap-1">
                      <span>Vào Bảng Hụi</span>
                      <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
