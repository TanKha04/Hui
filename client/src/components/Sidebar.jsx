import React, { useState, useEffect } from 'react';
import {
  Home,
  DollarSign,
  History,
  Calculator,
  Settings,
  ShieldCheck,
  User,
  Search,
  Pencil,
  Check,
  X,
  Menu,
  Sparkles,
  ChevronRight,
} from 'lucide-react';

export default function Sidebar({
  activeTab,
  setActiveTab,
  searchQuery,
  setSearchQuery,
  selectedGroup,
  setSelectedGroup,
  todayDueCount = 0,
  isMobileOpen,
  setIsMobileOpen,
}) {
  const [brandName, setBrandName] = useState(() => localStorage.getItem('huilink_brand_name') || 'HụiLink');
  const [greetingName, setGreetingName] = useState(() => localStorage.getItem('huilink_greeting_name') || 'Xin chào!');
  const [isEditing, setIsEditing] = useState(false);
  const [tempBrand, setTempBrand] = useState(brandName);
  const [tempGreeting, setTempGreeting] = useState(greetingName);

  // Sync with storage events
  useEffect(() => {
    const handleStorageChange = () => {
      const storedBrand = localStorage.getItem('huilink_brand_name');
      const storedGreeting = localStorage.getItem('huilink_greeting_name');
      if (storedBrand) setBrandName(storedBrand);
      if (storedGreeting) setGreetingName(storedGreeting);
    };
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('huilink_brand_updated', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('huilink_brand_updated', handleStorageChange);
    };
  }, []);

  const handleStartEdit = () => {
    setTempBrand(brandName);
    setTempGreeting(greetingName);
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    const finalBrand = tempBrand.trim() || 'HụiLink';
    const finalGreeting = tempGreeting.trim() || 'Xin chào!';
    setBrandName(finalBrand);
    setGreetingName(finalGreeting);
    localStorage.setItem('huilink_brand_name', finalBrand);
    localStorage.setItem('huilink_greeting_name', finalGreeting);
    window.dispatchEvent(new Event('huilink_brand_updated'));
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setTempBrand(brandName);
    setTempGreeting(greetingName);
    setIsEditing(false);
  };

  const menuItems = [
    { id: 'home', label: 'Trang chủ', icon: Home },
    { id: 'gomhui', label: 'Gom Hụi', icon: DollarSign, badge: todayDueCount },
    { id: 'history', label: 'Lịch Sử', icon: History },
    { id: 'calculator', label: 'Máy Tính', icon: Calculator },
    { id: 'settings', label: 'Cài Đặt', icon: Settings },
  ];

  const sidebarContent = (
    <div className="flex flex-col justify-between h-full select-none">
      {/* Top section */}
      <div>
        {/* User profile / App Brand Header (Editable) */}
        <div className="p-5 border-b border-slate-100/80 relative group bg-gradient-to-b from-slate-50/50 to-transparent">
          {isEditing ? (
            /* Editing State */
            <div className="space-y-2.5 animate-fadeIn">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold text-blue-600 uppercase tracking-wider">Đổi Tên Ứng Dụng</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={handleSaveEdit}
                    className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs transition-colors cursor-pointer shadow-sm"
                    title="Lưu tên"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="p-1.5 bg-slate-200 hover:bg-slate-300 text-slate-600 rounded-lg text-xs transition-colors cursor-pointer"
                    title="Hủy"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div>
                <input
                  type="text"
                  value={tempBrand}
                  onChange={(e) => setTempBrand(e.target.value)}
                  placeholder="Tên ứng dụng..."
                  maxLength={30}
                  className="w-full px-3 py-1.5 text-xs font-black bg-white border-2 border-blue-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 shadow-sm"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveEdit();
                    if (e.key === 'Escape') handleCancelEdit();
                  }}
                />
              </div>

              <div>
                <input
                  type="text"
                  value={tempGreeting}
                  onChange={(e) => setTempGreeting(e.target.value)}
                  placeholder="Lời chào / Tên phụ..."
                  maxLength={30}
                  className="w-full px-3 py-1 text-[11px] font-medium bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-600 shadow-sm"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveEdit();
                    if (e.key === 'Escape') handleCancelEdit();
                  }}
                />
              </div>
            </div>
          ) : (
            /* Normal View State */
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold shadow-md shadow-blue-500/25 shrink-0">
                  <User className="w-6 h-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <div
                    onClick={handleStartEdit}
                    className="font-black text-lg text-slate-900 tracking-tight flex items-center gap-1.5 cursor-pointer hover:text-blue-600 transition-colors truncate"
                    title="Bấm để đổi tên thương hiệu"
                  >
                    <span className="truncate">{brandName}</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse shrink-0 shadow-sm shadow-emerald-500/50"></span>
                  </div>
                  <div
                    onClick={handleStartEdit}
                    className="text-xs text-slate-400 font-semibold truncate cursor-pointer hover:text-slate-600 transition-colors flex items-center gap-1"
                    title="Bấm để đổi lời chào"
                  >
                    <span>{greetingName}</span>
                  </div>
                </div>
              </div>

              {/* Edit Icon Button */}
              <button
                type="button"
                onClick={handleStartEdit}
                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50/80 rounded-xl transition-all cursor-pointer opacity-70 group-hover:opacity-100 shrink-0"
                title="Đổi tên thương hiệu / Lời chào"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Search input */}
        <div className="px-4 py-3.5">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm kiếm nhanh..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-3.5 py-2.5 text-xs bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 focus:border-blue-500 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-medium placeholder:text-slate-400 shadow-sm"
            />
          </div>
        </div>

        {/* Navigation items */}
        <nav className="px-3 space-y-1.5">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  if (setIsMobileOpen) setIsMobileOpen(false);
                }}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl font-bold text-xs sm:text-sm transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30 translate-x-0.5'
                    : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900 active:scale-98'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div className={`p-1.5 rounded-xl transition-colors ${isActive ? 'bg-white/20 text-white' : 'text-slate-500'}`}>
                    <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <span>{item.label}</span>
                </div>

                {item.badge > 0 && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-black shrink-0 ${
                      isActive
                        ? 'bg-white text-blue-700 shadow-sm'
                        : 'bg-amber-500 text-white animate-pulse shadow-sm shadow-amber-500/40'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Trust Card */}
      <div className="p-4">
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white rounded-3xl p-4 shadow-xl border border-slate-700/50 text-center relative overflow-hidden">
          <div className="w-10 h-10 mx-auto rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-500 text-white flex items-center justify-center shadow-lg shadow-blue-500/30 mb-2.5">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h4 className="font-extrabold text-xs tracking-tight text-white mb-0.5">Hệ Thống An Toàn</h4>
          <p className="text-[10px] text-slate-300 leading-tight">
            Tự động tính sổ hụi, minh bạch & chuẩn xác 100%
          </p>
          <div className="flex justify-center items-center gap-1.5 mt-3">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-[10px] font-bold text-slate-300">Hoạt động ổn định</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (hidden on mobile) */}
      <aside className="hidden md:block w-64 lg:w-72 bg-white/90 backdrop-blur-md border-r border-slate-200/80 h-screen sticky top-0 shadow-sm z-30 shrink-0">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer (Slide in overlay) */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex animate-fadeIn">
          {/* Backdrop */}
          <div
            onClick={() => setIsMobileOpen(false)}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
          />

          {/* Drawer content */}
          <div className="relative w-4/5 max-w-xs bg-white h-full shadow-2xl z-10 flex flex-col transform transition-transform duration-300 ease-out">
            <div className="absolute top-4 right-4 z-20">
              <button
                onClick={() => setIsMobileOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center cursor-pointer hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
