import React from 'react';
import {
  LayoutDashboard,
  Compass,
  Radar,
  Lightbulb,
  Users,
  Send,
  MonitorPlay,
  BarChart3,
  GitBranch,
  Sparkles,
  Settings,
  HelpCircle,
  ChevronLeft,
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  pendingCount: number;
  runningJobs?: number;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  pendingCount,
  runningJobs = 0,
  mobileOpen = false,
  onCloseMobile,
}) => {
  const navItems = [
    { id: 'overview', label: 'نظرة عامة', labelEn: 'Overview', icon: LayoutDashboard },
    { id: 'discover', label: 'اكتشاف تلقائي', labelEn: 'Discover', icon: Compass },
    { id: 'radar', label: 'رادار المشاكل', labelEn: 'Problem Radar', icon: Radar },
    { id: 'solutions', label: 'الحلول الذكية', labelEn: 'Solutions', icon: Lightbulb },
    { id: 'leads', label: 'العملاء المحتملون', labelEn: 'Leads', icon: Users },
    {
      id: 'approval',
      label: 'اعتماد الرسائل',
      labelEn: 'Outreach Approval',
      icon: Send,
      badge: pendingCount > 0 ? pendingCount : undefined,
    },
    { id: 'demos', label: 'العروض التوضيحية', labelEn: 'Demos', icon: MonitorPlay },
    { id: 'analytics', label: 'التحليلات والمبيعات', labelEn: 'Analytics', icon: BarChart3 },
    { id: 'workflows', label: 'المهام', labelEn: 'Workflows', icon: GitBranch },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40 lg:hidden"
        />
      )}

      <aside
        className={`fixed lg:static top-0 right-0 h-full w-64 bg-[#0a1128] text-slate-200 flex flex-col justify-between shrink-0 shadow-2xl z-50 transition-transform duration-200 select-none border-l border-slate-800/80 ${
          mobileOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand & Logo */}
        <div>
          <div className="p-6 border-b border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-sky-400 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-emerald-500/20">
                <Sparkles className="w-5 h-5 text-slate-950 stroke-[2.5]" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-base tracking-tight text-white font-['Plus_Jakarta_Sans',sans-serif]">
                    Problem<span className="text-emerald-400">2</span>Client
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium">من المشكلة إلى الصفقة</p>
              </div>
            </div>

            {/* Mobile close button */}
            {onCloseMobile && (
              <button
                onClick={onCloseMobile}
                className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                ✕
              </button>
            )}
          </div>

        {/* Navigation list */}
        <div className="px-3 py-4">
          <div className="px-3 pb-2 text-[11px] font-bold text-slate-400/80 uppercase tracking-wider">
            القائمة الرئيسية
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 group ${
                    isActive
                      ? 'bg-gradient-to-l from-emerald-500/20 to-sky-500/10 text-white border-r-4 border-emerald-400 shadow-sm'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-4 h-4 transition-colors ${
                        isActive ? 'text-emerald-400' : 'text-slate-400 group-hover:text-slate-200'
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-emerald-500 text-slate-950 tabular-nums shadow-sm shadow-emerald-500/30">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* System Status & Profile Bottom Card */}
      <div className="p-4 border-t border-slate-800/80 space-y-3">
        {/* n8n Live Ping Indicator */}
        <div className="bg-slate-900/80 rounded-2xl p-3 border border-slate-800">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium text-slate-300">محرك الرصد الذكي</span>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              متصل
            </span>
          </div>
          <p className="text-[11px] text-slate-400 line-clamp-1">
            {runningJobs ? `${runningJobs} مهمة قيد التنفيذ الآن` : 'لا توجد مهام جارية'}
          </p>
        </div>

        {/* User Card */}
        <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/40 hover:bg-slate-800/60 transition-colors">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-300 font-extrabold flex items-center justify-center ring-2 ring-emerald-400/40">ي</div>
              <span className="absolute -bottom-0.5 -left-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-[#0a1128]"></span>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-white leading-tight">يحيى</p>
              <p className="text-[10px] text-slate-400">المؤسس</p>
            </div>
          </div>
          <div className="flex items-center">
          <button
            title="الإعدادات"
            onClick={() => setActiveTab('settings')}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors"
          >
            <Settings className="w-4 h-4" />
          </button>
          </div>
        </div>
      </div>
    </aside>
  </>
);
};
