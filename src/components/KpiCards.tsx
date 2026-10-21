import React from 'react';
import {
  TrendingUp,
  ArrowUpRight,
  Radar,
  Users,
  Send,
  MonitorPlay,
  Sparkles,
} from 'lucide-react';
import { DashboardStats } from '../types/dashboard';

interface KpiCardsProps {
  stats: DashboardStats;
  onFilterApproval?: () => void;
}

export const KpiCards: React.FC<KpiCardsProps> = ({ stats, onFilterApproval }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
      {/* 1. Problems Found */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/70 shadow-sm hover:shadow-md transition-all duration-200 group flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                <Radar className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-500">المشاكل المكتشفة</span>
            </div>
            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 tabular-nums">
              <TrendingUp className="w-3 h-3" />
              {stats.problemsTrend}
            </span>
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <h3 className="text-3xl font-extrabold text-slate-900 font-['Plus_Jakarta_Sans',sans-serif] tabular-nums">
              {stats.problemsFound.toLocaleString('en-US')}
            </h3>
            <span className="text-[11px] text-slate-400 font-medium">مشكلة نشطة</span>
          </div>
        </div>

        {/* Small Trend Sparkline Wave */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">آخر 7 أيام</span>
          <div className="w-28 h-7">
            <svg viewBox="0 0 100 28" className="w-full h-full overflow-visible">
              <path
                d="M0,22 Q15,26 30,16 T60,18 T85,6 L100,2"
                fill="none"
                stroke="#0ea5e9"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <circle cx="100" cy="2" r="3" fill="#0ea5e9" />
            </svg>
          </div>
        </div>
      </div>

      {/* 2. New Leads */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/70 shadow-sm hover:shadow-md transition-all duration-200 group flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-500">العملاء المحتملون الجدد</span>
            </div>
            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 tabular-nums">
              <TrendingUp className="w-3 h-3" />
              {stats.leadsTrend}
            </span>
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <h3 className="text-3xl font-extrabold text-slate-900 font-['Plus_Jakarta_Sans',sans-serif] tabular-nums">
              {stats.newLeads.toLocaleString('en-US')}
            </h3>
            <span className="text-[11px] text-slate-400 font-medium">جهة اتصال مؤكدة</span>
          </div>
        </div>

        {/* Small Trend Sparkline Bar sequence */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">معدل التحقق 96%</span>
          <div className="flex items-end gap-1 h-7">
            {[40, 55, 35, 70, 65, 85, 95].map((h, i) => (
              <span
                key={i}
                style={{ height: `${h}%` }}
                className={`w-2.5 rounded-xs transition-all ${
                  i === 6 ? 'bg-emerald-500' : 'bg-emerald-200'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* 3. Messages Awaiting Approval */}
      <div
        onClick={onFilterApproval}
        className="bg-white rounded-3xl p-5 border border-slate-200/70 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all duration-200 group flex flex-col justify-between cursor-pointer"
      >
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Send className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-500">رسائل بانتظار الموافقة</span>
            </div>
            <span className="inline-flex items-center gap-0.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 animate-pulse">
              تتطلب إجراءً
            </span>
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <div className="flex items-center gap-2">
              <h3 className="text-3xl font-extrabold text-slate-900 font-['Plus_Jakarta_Sans',sans-serif] tabular-nums">
                {stats.pendingMessages}
              </h3>
              {stats.pendingMessages > 0 && (
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                  مسودات جاهزة
                </span>
              )}
            </div>
            <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-500 transition-colors" />
          </div>
        </div>

        {/* Small indicator */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">صاغها الذكاء الاصطناعي</span>
          <div className="w-28 h-7">
            <svg viewBox="0 0 100 28" className="w-full h-full overflow-visible">
              <path
                d="M0,18 Q20,10 40,20 T70,12 T100,5"
                fill="none"
                stroke="#f59e0b"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <circle cx="100" cy="5" r="3" fill="#f59e0b" />
            </svg>
          </div>
        </div>
      </div>

      {/* 4. Demos Sent */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/70 shadow-sm hover:shadow-md transition-all duration-200 group flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <MonitorPlay className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-500">العروض التوضيحية المرسلة</span>
            </div>
            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 tabular-nums">
              <TrendingUp className="w-3 h-3" />
              {stats.demosTrend}
            </span>
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <h3 className="text-3xl font-extrabold text-slate-900 font-['Plus_Jakarta_Sans',sans-serif] tabular-nums">
              {stats.demosSent.toLocaleString('en-US')}
            </h3>
            <span className="text-[11px] text-emerald-600 font-bold">48 صفقة مغلقة</span>
          </div>
        </div>

        {/* Small Trend Sparkline with green fill gradient */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">معدل تحويل العروض 38.7%</span>
          <div className="w-28 h-7">
            <svg viewBox="0 0 100 28" className="w-full h-full overflow-visible">
              <defs>
                <linearGradient id="demoGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <path
                d="M0,24 Q25,20 50,15 T80,8 T100,2 L100,28 L0,28 Z"
                fill="url(#demoGrad)"
              />
              <path
                d="M0,24 Q25,20 50,15 T80,8 T100,2"
                fill="none"
                stroke="#10b981"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <circle cx="100" cy="2" r="3" fill="#10b981" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};
