import React, { useState, useEffect } from 'react';
import { Settings, ShieldCheck, Database, Save, CheckCircle2, Layout, User, Phone, Percent, Sparkles, RefreshCw } from 'lucide-react';
import { api } from '../services/api';

export default function SettingsView() {
  const [brandName, setBrandName] = useState(() => localStorage.getItem('huilink_brand_name') || 'Hụi');
  const [greetingName, setGreetingName] = useState(() => localStorage.getItem('huilink_greeting_name') || 'Xin chào!');
  const [defaultHostName, setDefaultHostName] = useState(() => localStorage.getItem('huilink_host_name') || 'Chị Bảy Hụi');
  const [defaultPhone, setDefaultPhone] = useState(() => localStorage.getItem('huilink_host_phone') || '0901234567');
  const [defaultCommission, setDefaultCommission] = useState(() => localStorage.getItem('huilink_commission_rate') || '0.5');
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  // Load saved settings from database API on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const res = await api.getSettings();
        if (res.success && res.data) {
          const d = res.data;
          if (d.brand_name) {
            setBrandName(d.brand_name);
            localStorage.setItem('huilink_brand_name', d.brand_name);
          }
          if (d.greeting_name) {
            setGreetingName(d.greeting_name);
            localStorage.setItem('huilink_greeting_name', d.greeting_name);
          }
          if (d.host_name) {
            setDefaultHostName(d.host_name);
            localStorage.setItem('huilink_host_name', d.host_name);
          }
          if (d.host_phone) {
            setDefaultPhone(d.host_phone);
            localStorage.setItem('huilink_host_phone', d.host_phone);
          }
          if (d.commission_rate) {
            setDefaultCommission(d.commission_rate);
            localStorage.setItem('huilink_commission_rate', d.commission_rate);
          }
        }
      } catch (err) {
        console.error('Error loading settings:', err);
      }
    };
    loadSettings();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        brand_name: brandName.trim() || 'Hụi',
        greeting_name: greetingName.trim() || 'Xin chào!',
        host_name: defaultHostName.trim() || 'Chủ Hụi',
        host_phone: defaultPhone.trim(),
        commission_rate: defaultCommission,
      };

      // 1. Save to Database & update existing groups
      await api.saveSettings(payload);

      // 2. Save to localStorage for instant local access
      localStorage.setItem('huilink_brand_name', payload.brand_name);
      localStorage.setItem('huilink_greeting_name', payload.greeting_name);
      localStorage.setItem('huilink_host_name', payload.host_name);
      localStorage.setItem('huilink_host_phone', payload.host_phone);
      localStorage.setItem('huilink_commission_rate', payload.commission_rate);

      // 3. Dispatch event to update Sidebar & other views
      window.dispatchEvent(new Event('huilink_brand_updated'));

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      alert('Lỗi lưu cài đặt: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto space-y-6 overflow-y-auto pb-24 md:pb-8">
      {/* Header */}
      <div className="flex items-center gap-3.5">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-slate-800 to-slate-900 text-white flex items-center justify-center shadow-lg shadow-slate-700/25 shrink-0">
          <Settings className="w-7 h-7" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">CÀI ĐẶT HỆ THỐNG</h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">Thiết lập tên ứng dụng, thông tin chủ hụi mặc định và cơ sở dữ liệu</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="bg-white rounded-3xl border border-slate-200/90 shadow-card p-5 sm:p-7 space-y-6">
        {saved && (
          <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs sm:text-sm rounded-2xl font-bold flex items-center gap-2.5 animate-fadeIn shadow-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>Đã lưu thông tin cài đặt và đồng bộ tên chủ hụi thành công!</span>
          </div>
        )}

        {/* Section 1: Brand & Sidebar */}
        <div className="space-y-4">
          <div className="border-b border-slate-100 pb-2.5 flex items-center gap-2 text-slate-900 font-extrabold text-sm">
            <Layout className="w-4 h-4 text-blue-600" />
            <span>Giao Diện & Thương Hiệu Sidebar</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Tên Ứng Dụng (Góc Trái)
              </label>
              <input
                type="text"
                required
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                placeholder="VD: Hụi, Hụi Chị Bảy..."
                className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-600 focus:bg-white focus:outline-none font-bold text-slate-900 shadow-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Lời Chào / Tiêu Đề Phụ
              </label>
              <input
                type="text"
                value={greetingName}
                onChange={(e) => setGreetingName(e.target.value)}
                placeholder="VD: Xin chào!, Chủ Hụi Uy Tín..."
                className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-600 focus:bg-white focus:outline-none font-semibold text-slate-700 shadow-sm"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Host Information */}
        <div className="space-y-4 pt-2">
          <div className="border-b border-slate-100 pb-2.5 flex items-center gap-2 text-slate-900 font-extrabold text-sm">
            <User className="w-4 h-4 text-blue-600" />
            <span>Thông Tin Chủ Hụi & Tiền Thảo Mặc Định</span>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Tên Chủ Hụi Mặc Định
            </label>
            <input
              type="text"
              required
              value={defaultHostName}
              onChange={(e) => setDefaultHostName(e.target.value)}
              placeholder="VD: Nguyễn Thị Lan, Chị Bảy Hụi..."
              className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-600 focus:bg-white focus:outline-none font-bold text-slate-900 shadow-sm"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Tên này sẽ được tự động điền khi tạo dây hụi mới và in trên giấy hụi.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Số Điện Thoại Chủ Hụi
            </label>
            <input
              type="text"
              value={defaultPhone}
              onChange={(e) => setDefaultPhone(e.target.value)}
              placeholder="VD: 0901234567"
              className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-600 focus:bg-white focus:outline-none font-semibold text-slate-800 shadow-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Tỷ Lệ Tiền Thảo Mặc Định (Hoa Hồng)
            </label>
            <select
              value={defaultCommission}
              onChange={(e) => setDefaultCommission(e.target.value)}
              className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-600 focus:bg-white focus:outline-none font-semibold text-slate-800 shadow-sm cursor-pointer"
            >
              <option value="0.5">50% của 1 chân hụi (Tiêu chuẩn Việt Nam)</option>
              <option value="0.4">40% của 1 chân hụi</option>
              <option value="0.3">30% của 1 chân hụi</option>
              <option value="1.0">100% của 1 chân hụi</option>
              <option value="0">0% (Không tính tiền thảo)</option>
            </select>
          </div>
        </div>

        {/* Submit button */}
        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-2xl text-xs sm:text-sm font-extrabold shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 cursor-pointer transition-all transform active:scale-95 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{loading ? 'Đang Lưu...' : 'Lưu Thay Đổi'}</span>
          </button>
        </div>
      </form>

      {/* Database status card */}
      <div className="bg-slate-50 rounded-3xl border border-slate-200/90 p-5 sm:p-6 space-y-3 shadow-sm">
        <div className="flex items-center gap-2 text-slate-800 font-extrabold text-sm">
          <Database className="w-4 h-4 text-blue-600" />
          <span>Cơ Sở Dữ Liệu SQLite & Lưu Trữ Vĩnh Viễn</span>
        </div>
        <p className="text-xs text-slate-500 leading-relaxed">
          Tất cả cài đặt và dữ liệu dây hụi được lưu trữ an toàn trong cơ sở dữ liệu SQLite (<code className="bg-slate-200 px-1.5 py-0.5 rounded font-mono text-[11px]">/data/hui.db</code>) và đồng bộ vĩnh viễn trên trình duyệt, không bao giờ bị mất khi bấm làm mới F5.
        </p>
      </div>
    </div>
  );
}
