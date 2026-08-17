import React, { useState, useEffect } from 'react';
import { History, Trophy, Calendar, CheckCircle2, DollarSign, ArrowRight, Layers, Users, Clock } from 'lucide-react';
import { api, formatVND, formatDateVN } from '../services/api';

export default function HistoryView({ onSelectGroup }) {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await api.getGroups();
        if (res.success) {
          setGroups(res.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6 overflow-y-auto pb-24 md:pb-8">
      {/* Header */}
      <div className="flex items-center gap-3.5">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 text-white flex items-center justify-center shadow-lg shadow-amber-500/25 shrink-0">
          <History className="w-7 h-7" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">
            LỊCH SỬ DÂY HỤI
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Xem lại danh sách tiến độ, số kỳ đã khui và quản lý các dây hụi
          </p>
        </div>
      </div>

      {/* List Card */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-card p-5 sm:p-7 space-y-4">
        <h2 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
          <Layers className="w-4 h-4 text-blue-600" />
          <span>Danh Sách Dây Hụi Trong Hệ Thống ({groups.length})</span>
        </h2>

        {groups.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            Chưa có dây hụi nào trong hệ thống.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {groups.map((g) => {
              const current = g.current_period || 1;
              const total = g.total_members || 20;
              const isCompleted = current >= total;

              return (
                <div
                  key={g.id}
                  className="py-4 sm:py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-slate-50/70 rounded-2xl px-2 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold text-slate-900 text-base">{g.name}</h3>
                      <span className={`text-[10px] font-black px-2 py-0.2 rounded-full ${
                        isCompleted ? 'bg-slate-100 text-slate-600' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {isCompleted ? 'Hoàn tất' : `Đang chạy Kỳ ${current}/${total}`}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                      <span className="font-bold text-rose-600">{formatVND(g.amount_per_member)} / kỳ</span>
                      <span>•</span>
                      <span>Chủ hụi: <strong>{g.host_name || 'Chủ Hụi'}</strong></span>
                      <span>•</span>
                      <span>Mở ngày: {formatDateVN(g.start_date)}</span>
                      <span>•</span>
                      <span>Quy mô: <strong>{formatVND(g.amount_per_member * total)}</strong></span>
                    </div>
                  </div>

                  <button
                    onClick={() => onSelectGroup(g.id)}
                    className="w-full sm:w-auto px-4 py-2.5 bg-blue-50 hover:bg-blue-600 hover:text-white rounded-xl text-xs font-extrabold text-blue-700 transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0 shadow-sm"
                  >
                    <span>Vào Bảng Chi Tiết</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
