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
} from 'lucide-react';
import { formatVND, formatDateVN } from '../services/api';

export default function HuiListView({ groups, onSelectGroup, onOpenCreateModal, onDeleteGroup, searchQuery }) {
  const [filterStatus, setFilterStatus] = useState('all'); // 'all' | 'active' | 'completed'

  const filteredGroups = groups.filter((g) => {
    const matchSearch = g.name.toLowerCase().includes((searchQuery || '').toLowerCase()) ||
      (g.host_name || '').toLowerCase().includes((searchQuery || '').toLowerCase());
    if (!matchSearch) return false;

    const isCompleted = (g.current_period || 1) >= (g.total_members || 20);
    if (filterStatus === 'active') return !isCompleted;
    if (filterStatus === 'completed') return isCompleted;
    return true;
  });

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

      {/* Filter Tabs */}
      <div className="flex items-center justify-between gap-3 border-b border-slate-200/80 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterStatus === 'all'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            Tất cả ({groups.length})
          </button>
          <button
            onClick={() => setFilterStatus('active')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterStatus === 'active'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            Đang chạy ({groups.filter(g => (g.current_period || 1) < (g.total_members || 20)).length})
          </button>
        </div>

        <div className="text-xs text-slate-400 font-semibold hidden sm:block">
          Hiển thị <strong>{filteredGroups.length}</strong> dây hụi
        </div>
      </div>

      {/* Grid of Hui Cards */}
      {filteredGroups.length === 0 ? (
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
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
          {filteredGroups.map((group) => {
            const total = group.total_members || 20;
            const current = group.current_period || 1;
            const progressPercent = Math.min(100, Math.round((current / total) * 100));
            const isCompleted = current >= total;

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
