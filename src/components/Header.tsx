import React, { useState } from 'react';
import {
  Search,
  Bell,
  Globe2,
  Calendar,
  Plus,
  Moon,
  Sun,
  CheckCircle2,
  Sparkles,
  ChevronDown,
} from 'lucide-react';
import { MarketRegion } from '../types/dashboard';

interface HeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  marketFilter: MarketRegion;
  setMarketFilter: (market: MarketRegion) => void;
  onOpenNewRadar: () => void;
  isDark: boolean;
  toggleDark: () => void;
  onOpenMobileMenu?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  setSearchQuery,
  marketFilter,
  setMarketFilter,
  onOpenNewRadar,
  isDark,
  toggleDark,
  onOpenMobileMenu,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMarketDropdown, setShowMarketDropdown] = useState(false);

  const marketLabels: Record<MarketRegion, { label: string; sub: string }> = {
    all: { label: 'جميع الأسواق', sub: 'الخليج والدول العربية' },
    gulf: { label: 'الخليج العربي', sub: 'السعودية، الإمارات، قطر، الكويت' },
    arabic: { label: 'السوق العربي الموسع', sub: 'مصر، الأردن، دول شمال إفريقيا' },
    local: { label: 'السوق المحلي الفوري', sub: 'الرياض، جدة، المنطقة الشرقية' },
  };

  const notifications = [
    {
      id: 1,
      title: 'رصد 14 مشكلة جديدة في عقارات دبي',
      time: 'منذ 5 دقائق',
      unread: true,
    },
    {
      id: 2,
      title: 'تم تأكيد حجز عرض توضيحي لمجمع طبي بالرياض',
      time: 'منذ 25 دقيقة',
      unread: true,
    },
    {
      id: 3,
      title: 'مسار عمل n8n استخرج 42 رقم واتساب تنفيذي',
      time: 'منذ ساعة',
      unread: false,
    },
  ];

  return (
    <header className="px-5 md:px-8 py-4 md:py-5 border-b border-slate-200/80 bg-white/70 backdrop-blur-md sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 transition-colors">
      {/* Right side in RTL: Welcome & Date info */}
      <div className="flex items-center gap-3 md:gap-6">
        {onOpenMobileMenu && (
          <button
            onClick={onOpenMobileMenu}
            className="lg:hidden p-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
            title="القائمة"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16m-7 6h7" />
            </svg>
          </button>
        )}

        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            مرحباً بك، المهندس يحيى 👋
          </h1>
          <p className="text-[11px] md:text-xs text-slate-500 font-medium">
            الرادار الذكي يراقب الأسواق ويجهز لك فرص عملاء جديدة
          </p>
        </div>

        {/* Date capsule matching the reference image's calendar badge */}
        <div className="hidden xl:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold border border-slate-200/60 shadow-xs">
          <Calendar className="w-3.5 h-3.5 text-slate-500" />
          <span>21 أكتوبر 2026 - 28 أكتوبر 2026</span>
        </div>
      </div>

      {/* Left side in RTL (Controls, Search, Market Dropdown, Notifications, Avatar) */}
      <div className="flex items-center gap-3">
        {/* Search Input */}
        <div className="relative w-64 md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث عن مشكلة، قطاع، أو شركة..."
            className="w-full pr-10 pl-4 py-2 bg-slate-100/90 hover:bg-slate-100 focus:bg-white text-xs font-medium text-slate-800 rounded-full border border-transparent focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 outline-none transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
            >
              ✕
            </button>
          )}
        </div>

        {/* Market Filter Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowMarketDropdown(!showMarketDropdown)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 shadow-xs transition-all"
          >
            <Globe2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>{marketLabels[marketFilter].label}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {showMarketDropdown && (
            <div className="absolute left-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 p-1.5 z-30 animate-in fade-in zoom-in-95 duration-150">
              <div className="p-2 text-[11px] font-bold text-slate-400 uppercase border-b border-slate-100">
                اختر النطاق الجغرافي المستهدف
              </div>
              {(['all', 'gulf', 'arabic', 'local'] as MarketRegion[]).map((m) => (
                <button
                  key={m}
                  onClick={() => {
                    setMarketFilter(m);
                    setShowMarketDropdown(false);
                  }}
                  className={`w-full text-right p-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition-colors ${
                    marketFilter === m
                      ? 'bg-emerald-50 text-emerald-800'
                      : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div>
                    <p className="font-bold">{marketLabels[m].label}</p>
                    <p className="text-[10px] text-slate-500 font-normal">{marketLabels[m].sub}</p>
                  </div>
                  {marketFilter === m && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Action Button: "+ استكشاف مشكلة" matching "+ Add New Wallet" from reference image */}
        <button
          onClick={onOpenNewRadar}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-md shadow-slate-900/10 transition-all hover:scale-[1.02] active:scale-95"
        >
          <Plus className="w-3.5 h-3.5 text-emerald-400" />
          <span className="whitespace-nowrap">استكشاف مشكلة جديدة</span>
        </button>

        {/* Notifications Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2.5 rounded-full bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 shadow-xs transition-colors"
            title="الإشعارات والتنبيهات"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 left-1.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white"></span>
          </button>

          {showNotifications && (
            <div className="absolute left-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 p-3 z-30 animate-in fade-in duration-150">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-900">تنبيهات الرادار والفرص</span>
                <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                  2 غير مقروء
                </span>
              </div>
              <div className="divide-y divide-slate-100 my-1">
                {notifications.map((n) => (
                  <div key={n.id} className="py-2.5 text-right hover:bg-slate-50 rounded-lg px-2">
                    <p className="text-xs font-bold text-slate-800">{n.title}</p>
                    <span className="text-[10px] text-slate-400">{n.time}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Avatar matching Sujon style in reference image */}
        <div className="flex items-center gap-2 pr-2 border-r border-slate-200">
          <img
            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
            alt="صورة المستخدم"
            referrerPolicy="no-referrer"
            className="w-9 h-9 rounded-full object-cover ring-2 ring-emerald-500/20 shadow-xs"
          />
        </div>
      </div>
    </header>
  );
};
