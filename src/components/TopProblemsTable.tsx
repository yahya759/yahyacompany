import React, { useState } from 'react';
import {
  Sparkles,
  ArrowUpRight,
  Filter,
  MapPin,
  ExternalLink,
  Wand2,
  CheckCircle,
  Building,
  Layers,
} from 'lucide-react';
import { Problem, ProblemSector } from '../types/dashboard';
import { getScoreCategory } from '../utils/dashboardLogic';

interface TopProblemsTableProps {
  problems: Problem[];
  onBuildSolution: (problem: Problem) => void;
  activeSector: ProblemSector;
  setActiveSector: (sector: ProblemSector) => void;
}

export const TopProblemsTable: React.FC<TopProblemsTableProps> = ({
  problems,
  onBuildSolution,
  activeSector,
  setActiveSector,
}) => {
  const sectors = [
    { id: 'all', label: 'الكل' },
    { id: 'healthcare', label: 'الرعاية الصحية' },
    { id: 'real-estate', label: 'العقارات' },
    { id: 'ecommerce', label: 'التجارة الإلكترونية' },
    { id: 'fnb', label: 'المطاعم والضيافة' },
    { id: 'construction', label: 'المقاولات' },
    { id: 'services', label: 'الخدمات' },
  ];

  // Helper for source brand rendering with crisp SVG icons
  const renderSourceIcon = (source: Problem['source'], name: string) => {
    switch (source) {
      case 'reddit':
        return (
          <div className="flex items-center gap-1.5" title="Reddit">
            <div className="w-6 h-6 rounded-lg bg-orange-500/10 text-orange-600 flex items-center justify-center font-bold text-xs">
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.702zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" />
              </svg>
            </div>
            <span className="text-[11px] font-semibold text-slate-600 hidden sm:inline">Reddit</span>
          </div>
        );
      case 'x':
        return (
          <div className="flex items-center gap-1.5" title="منصة X">
            <div className="w-6 h-6 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
              <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </div>
            <span className="text-[11px] font-semibold text-slate-600 hidden sm:inline">منصة 𝕏</span>
          </div>
        );
      case 'google-maps':
        return (
          <div className="flex items-center gap-1.5" title="Google Maps">
            <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs">
              <MapPin className="w-3.5 h-3.5" />
            </div>
            <span className="text-[11px] font-semibold text-slate-600 hidden sm:inline">خرائط Google</span>
          </div>
        );
      case 'facebook':
        return (
          <div className="flex items-center gap-1.5" title="Facebook">
            <div className="w-6 h-6 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
              <span className="font-['Plus_Jakarta_Sans',sans-serif] text-xs font-bold">f</span>
            </div>
            <span className="text-[11px] font-semibold text-slate-600 hidden sm:inline">Facebook</span>
          </div>
        );
      case 'google-search':
        return (
          <div className="flex items-center gap-1.5" title="Google">
            <div className="w-6 h-6 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center font-bold text-xs">G</div>
            <span className="text-[11px] font-semibold text-slate-600 hidden sm:inline">بحث الويب</span>
          </div>
        );
      default:
        return <span className="text-[11px] font-semibold text-slate-500">{name}</span>;
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-200/70 shadow-sm">
      {/* Table Header & Sector Filter Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900">
              أبرز المشاكل المكتشفة في السوق
            </h3>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 tabular-nums">
              {problems.length} فرصة
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            تم استخراجها وتصنيفها وتحليل احتياج أصحاب الأعمال لحلول برمجية فورية
          </p>
        </div>

        {/* Sector Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto p-1 bg-slate-100/80 rounded-2xl border border-slate-200/40">
          {sectors.map((sec) => (
            <button
              key={sec.id}
              onClick={() => setActiveSector(sec.id as ProblemSector)}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl whitespace-nowrap transition-all ${
                activeSector === sec.id
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {sec.label}
            </button>
          ))}
        </div>
      </div>

      {/* High-density Data Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-right border-collapse">
          <thead>
            <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400">
              <th className="pb-3 pr-2">المشكلة ونقطة الألم</th>
              <th className="pb-3 px-3">القطاع</th>
              <th className="pb-3 px-3">المصدر</th>
              <th className="pb-3 px-3 text-center">مؤشر الجدوى</th>
              <th className="pb-3 px-3">العملاء المهتمون</th>
              <th className="pb-3 pl-2 text-left">الإجراء</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {problems.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-400">
                  لا توجد مشاكل مطابقة لهذا الفلتر حالياً
                </td>
              </tr>
            ) : (
              problems.map((problem) => {
                const category = getScoreCategory(problem.score);
                return (
                  <tr
                    key={problem.id}
                    className="hover:bg-slate-50/80 transition-colors group"
                  >
                    {/* Problem Title & Pain */}
                    <td className="py-3.5 pr-2 max-w-sm">
                      <div className="font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                        {problem.title}
                      </div>
                      <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                        {problem.summary}
                      </p>
                    </td>

                    {/* Sector */}
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 text-slate-700">
                        {problem.sector}
                      </span>
                    </td>

                    {/* Source Icon */}
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      {renderSourceIcon(problem.source, problem.sourceName)}
                    </td>

                    {/* Score Badge (0-100 colored green/orange) */}
                    <td className="py-3.5 px-3 text-center whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl font-bold font-['Plus_Jakarta_Sans',sans-serif] tabular-nums text-xs border border-transparent shadow-2xs">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            category.color === 'green'
                              ? 'bg-emerald-500'
                              : category.color === 'orange'
                              ? 'bg-amber-500'
                              : 'bg-slate-400'
                          }`}
                        />
                        <span className={category.textClass}>{problem.score}/100</span>
                      </div>
                    </td>

                    {/* Leads count */}
                    <td className="py-3.5 px-3 whitespace-nowrap font-medium text-slate-600">
                      <span className="font-extrabold text-slate-900 font-['Plus_Jakarta_Sans',sans-serif] tabular-nums">
                        {problem.leadsCount}
                      </span>{' '}
                      شركة متأثرة
                    </td>

                    {/* Build solution CTA button */}
                    <td className="py-3.5 pl-2 text-left whitespace-nowrap">
                      <button
                        onClick={() => onBuildSolution(problem)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-slate-950 font-bold text-xs shadow-sm shadow-emerald-500/20 transition-all cursor-pointer"
                      >
                        <Wand2 className="w-3.5 h-3.5" />
                        <span>بناء حل</span>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
