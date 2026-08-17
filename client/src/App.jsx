import React, { useState, useEffect } from 'react';
import {
  Home,
  DollarSign,
  Calculator,
  Settings,
  History,
  Menu,
  Plus,
  Bell,
  Sparkles,
  User,
} from 'lucide-react';
import Sidebar from './components/Sidebar';
import HuiListView from './components/HuiListView';
import HuiDetailTable from './components/HuiDetailTable';
import CreateHuiModal from './components/CreateHuiModal';
import CalculatorView from './components/CalculatorView';
import GomHuiView from './components/GomHuiView';
import HistoryView from './components/HistoryView';
import SettingsView from './components/SettingsView';
import { api } from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [groups, setGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [targetPeriod, setTargetPeriod] = useState(null);
  const [targetMemberId, setTargetMemberId] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [todayDueCount, setTodayDueCount] = useState(0);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [brandName, setBrandName] = useState(() => localStorage.getItem('huilink_brand_name') || 'HụiLink');

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const res = await api.getGroups();
      if (res.success) {
        let groupList = res.data || [];
        // Ensure each group has member_names array even if backend was not restarted yet
        const missingMemberGroups = groupList.filter(
          (g) => !g.member_names || g.member_names.length === 0
        );
        if (missingMemberGroups.length > 0) {
          const detailResults = await Promise.all(
            missingMemberGroups.map((g) => api.getGroupDetail(g.id).catch(() => null))
          );
          const memberMap = {};
          detailResults.forEach((d) => {
            if (d?.success && d?.data?.group?.id && Array.isArray(d?.data?.members)) {
              memberMap[d.data.group.id] = d.data.members
                .map((m) => m.member_name)
                .filter(Boolean);
            }
          });
          groupList = groupList.map((g) => ({
            ...g,
            member_names:
              g.member_names && g.member_names.length > 0
                ? g.member_names
                : memberMap[g.id] || [],
          }));
        }
        setGroups(groupList);
      }
    } catch (err) {
      console.error('Error fetching groups:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDueCount = async () => {
    try {
      const res = await api.getGomHuiSummary();
      if (res.success && res.data?.stats) {
        setTodayDueCount(res.data.stats.todayDueCount || 0);
      }
    } catch (err) {
      console.error('Error fetching due count:', err);
    }
  };

  useEffect(() => {
    fetchGroups();
    fetchDueCount();

    const handleBrandUpdate = () => {
      const stored = localStorage.getItem('huilink_brand_name');
      if (stored) setBrandName(stored);
    };
    window.addEventListener('huilink_brand_updated', handleBrandUpdate);
    return () => window.removeEventListener('huilink_brand_updated', handleBrandUpdate);
  }, []);

  const handleSelectGroup = (id, periodNumber = null, memberId = null) => {
    setSelectedGroupId(id);
    setTargetPeriod(periodNumber);
    setTargetMemberId(memberId);
    setActiveTab('home');
  };

  const handleGroupCreated = async (newGroupId) => {
    await fetchGroups();
    fetchDueCount();
    setSelectedGroupId(newGroupId);
    setTargetPeriod(null);
    setTargetMemberId(null);
  };

  const handleDeleteGroup = async (id) => {
    try {
      const res = await api.deleteGroup(id);
      if (res.success) {
        if (selectedGroupId === id) {
          setSelectedGroupId(null);
          setTargetPeriod(null);
          setTargetMemberId(null);
        }
        fetchGroups();
        fetchDueCount();
      }
    } catch (err) {
      alert('Không thể xóa dây hụi: ' + err.message);
    }
  };

  const navItems = [
    { id: 'home', label: 'Trang Chủ', icon: Home },
    { id: 'gomhui', label: 'Gom Hụi', icon: DollarSign, badge: todayDueCount },
    { id: 'calculator', label: 'Máy Tính', icon: Calculator },
    { id: 'history', label: 'Lịch Sử', icon: History },
    { id: 'settings', label: 'Cài Đặt', icon: Settings },
  ];

  return (
    <div className="flex flex-col md:flex-row h-[100dvh] min-h-[100dvh] max-h-[100dvh] w-full overflow-hidden bg-[#f8fafc] text-slate-800 antialiased font-sans">
      {/* Desktop Sidebar & Mobile Sliding Drawer */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          if (tab !== 'home') {
            setSelectedGroupId(null);
            setTargetPeriod(null);
            setTargetMemberId(null);
          }
          fetchDueCount();
        }}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedGroup={selectedGroupId}
        setSelectedGroup={setSelectedGroupId}
        todayDueCount={todayDueCount}
        isMobileOpen={isMobileDrawerOpen}
        setIsMobileOpen={setIsMobileDrawerOpen}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full max-h-full overflow-hidden w-full">
        {/* Mobile Top Header (Visible only on mobile screens < 768px) */}
        <header className="md:hidden bg-white/95 backdrop-blur-md border-b border-slate-200 px-3.5 py-2.5 flex items-center justify-between z-20 shrink-0 sticky top-0 shadow-sm w-full">
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsMobileDrawerOpen(true)}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
              aria-label="Mở menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-1.5 font-black text-base text-slate-900 tracking-tight">
              <div className="w-7 h-7 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-md shadow-blue-500/25">
                $
              </div>
              <span className="truncate max-w-[140px]">{brandName}</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {todayDueCount > 0 && (
              <button
                onClick={() => {
                  setActiveTab('gomhui');
                  setSelectedGroupId(null);
                }}
                className="px-2.5 py-1 bg-amber-500 text-white rounded-full text-xs font-extrabold flex items-center gap-1 shadow-sm animate-pulse cursor-pointer"
              >
                <Bell className="w-3.5 h-3.5" />
                <span>{todayDueCount}</span>
              </button>
            )}

            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="p-2 bg-blue-600 text-white rounded-xl shadow-md shadow-blue-500/25 flex items-center justify-center cursor-pointer"
              title="Tạo Hụi Mới"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Dynamic Main View */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col">
          {activeTab === 'home' && (
            selectedGroupId ? (
              <HuiDetailTable
                groupId={selectedGroupId}
                initialPeriod={targetPeriod}
                initialMemberIdForPay={targetMemberId}
                onBack={() => {
                  setSelectedGroupId(null);
                  setTargetPeriod(null);
                  setTargetMemberId(null);
                  fetchDueCount();
                  fetchGroups();
                }}
              />
            ) : (
              <HuiListView
                groups={groups}
                onSelectGroup={handleSelectGroup}
                onOpenCreateModal={() => setIsCreateModalOpen(true)}
                onDeleteGroup={handleDeleteGroup}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
              />
            )
          )}

          {activeTab === 'gomhui' && (
            <GomHuiView onSelectGroup={handleSelectGroup} />
          )}

          {activeTab === 'history' && (
            <HistoryView onSelectGroup={handleSelectGroup} />
          )}

          {activeTab === 'calculator' && (
            <CalculatorView />
          )}

          {activeTab === 'settings' && (
            <SettingsView />
          )}
        </main>

        {/* Mobile Bottom Navigation Bar (Fixed bottom on < 768px) */}
        <nav className="md:hidden bg-white/95 backdrop-blur-lg border-t border-slate-200/90 px-2 py-2 flex items-center justify-around z-30 shrink-0 shadow-lg pb-safe">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  if (item.id !== 'home') {
                    setSelectedGroupId(null);
                    setTargetPeriod(null);
                    setTargetMemberId(null);
                  }
                  fetchDueCount();
                }}
                className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer relative min-w-[56px] ${
                  isActive
                    ? 'text-blue-600 font-black'
                    : 'text-slate-500 hover:text-slate-800 font-semibold'
                }`}
              >
                <div className={`p-1 rounded-xl transition-all ${isActive ? 'bg-blue-50 text-blue-600 scale-110' : ''}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] mt-0.5 tracking-tight">{item.label}</span>

                {item.badge > 0 && (
                  <span className="absolute -top-0.5 right-2 px-1.5 py-0.2 rounded-full text-[9px] font-black bg-amber-500 text-white shadow-sm animate-pulse">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Create Hui Modal */}
      <CreateHuiModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreated={handleGroupCreated}
      />
    </div>
  );
}
