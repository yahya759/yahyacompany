import React, { useState } from 'react';
import {
  ChevronLeft,
  Info,
  CheckCircle2,
  TrendingUp,
  Layers,
  Sparkles,
  ArrowRightLeft,
} from 'lucide-react';
import { FunnelStageData } from '../types/dashboard';

interface SalesFunnelProps {
  stages: FunnelStageData[];
}

export const SalesFunnel: React.FC<SalesFunnelProps> = ({ stages }) => {
  const [selectedStage, setSelectedStage] = useState<string>('deal');

  const currentStage = stages.find((s) => s.id === selectedStage) || stages[0];

  // Colors for stages gradient matching mint green and electric blue theme
  const getStageStyle = (index: number, total: number) => {
    // from blue/cyan to mint green/emerald
    const colors = [
      '#3b82f6', // Problem
      '#0284c7', // Solution
      '#06b6d4', // Lead
      '#6366f1', // Message
      '#8b5cf6', // Reply
      '#10b981', // Demo
      '#059669', // Deal
    ];
    return colors[index % colors.length];
  };

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-200/70 shadow-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <Layers className="w-4 h-4" />
            </span>
            <h3 className="text-base font-bold text-slate-900">
              قمع التحويل التلقائي: من المشكلة إلى إغلاق الصفقة
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            متابعة حركة الفرص من الرصد الأولي حتى تحويلها إلى عقود بيع فعلية
          </p>
        </div>

        {/* Global Pipeline Metrics */}
        <div className="flex items-center gap-4 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100">
          <div>
            <span className="text-[10px] text-slate-400 font-bold block">معدل التحويل الكلي</span>
            <span className="text-sm font-extrabold text-emerald-600 font-['Plus_Jakarta_Sans',sans-serif] tabular-nums">
              3.24% <span className="text-[10px] font-normal text-slate-500">(فوق المتوسط)</span>
            </span>
          </div>
          <div className="h-6 w-px bg-slate-200" />
          <div>
            <span className="text-[10px] text-slate-400 font-bold block">قيمة الصفقات المغلقة</span>
            <span className="text-sm font-extrabold text-slate-900 font-['Plus_Jakarta_Sans',sans-serif] tabular-nums">
              $185,400 <span className="text-[10px] text-emerald-600 font-bold">MRR</span>
            </span>
          </div>
        </div>
      </div>

      {/* Horizontal Sales Funnel Flow Container */}
      <div className="relative overflow-x-auto pb-2 scrollbar-thin">
        <div className="min-w-[760px] flex items-center justify-between gap-2 bg-slate-50/70 p-3.5 rounded-2xl border border-slate-100">
          {stages.map((stage, idx) => {
            const isSelected = stage.id === selectedStage;
            const stageColor = getStageStyle(idx, stages.length);
            const isLast = idx === stages.length - 1;

            return (
              <React.Fragment key={stage.id}>
                {/* Stage Step Item */}
                <button
                  onClick={() => setSelectedStage(stage.id)}
                  className={`flex-1 min-w-[95px] p-3 rounded-xl text-right transition-all duration-150 relative cursor-pointer group ${
                    isSelected
                      ? 'bg-white shadow-md ring-2 ring-emerald-500/30 scale-102'
                      : 'bg-white/80 hover:bg-white hover:shadow-xs border border-slate-200/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span
                      className="text-[10px] font-bold px-1.5 py-0.5 rounded-md text-white font-['Plus_Jakarta_Sans',sans-serif]"
                      style={{ backgroundColor: stageColor }}
                    >
                      0{idx + 1}
                    </span>
                    <span className="text-[10px] font-extrabold text-slate-400 font-['Plus_Jakarta_Sans',sans-serif]">
                      {stage.nameEn}
                    </span>
                  </div>

                  <p className="text-xs font-bold text-slate-800 group-hover:text-emerald-700 transition-colors">
                    {stage.nameAr}
                  </p>

                  <div className="flex items-baseline justify-between mt-2">
                    <span className="text-base font-black text-slate-900 font-['Plus_Jakarta_Sans',sans-serif] tabular-nums">
                      {stage.count.toLocaleString('en-US')}
                    </span>
                    <span className="text-[10px] font-bold text-emerald-600 tabular-nums">
                      {stage.change}
                    </span>
                  </div>

                  {/* Stage Progress Bar inside card */}
                  <div className="w-full h-1.5 bg-slate-100 rounded-full mt-2.5 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.max(15, (stage.count / stages[0].count) * 100)}%`,
                        backgroundColor: stageColor,
                      }}
                    />
                  </div>
                </button>

                {/* Connecting arrow / chevron */}
                {!isLast && (
                  <div className="flex flex-col items-center justify-center px-1 text-slate-300 shrink-0">
                    <ChevronLeft className="w-4 h-4 text-slate-400 -mr-1" />
                    <span className="text-[9px] font-bold text-slate-400 font-['Plus_Jakarta_Sans',sans-serif]">
                      {stages[idx + 1]?.conversionRate}%
                    </span>
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Selected Stage Detail Insight Bar */}
      <div className="mt-4 p-3.5 rounded-2xl bg-gradient-to-l from-slate-50 to-emerald-50/40 border border-slate-200/60 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-xl bg-white shadow-xs border border-slate-200 flex items-center justify-center text-emerald-600 font-bold shrink-0">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="font-bold text-slate-900 ml-1.5">
              مرحلة {currentStage.nameAr} ({currentStage.nameEn}):
            </span>
            <span className="text-slate-600">{currentStage.descriptionAr}</span>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <span className="text-slate-500 font-medium">العدد الحالي:</span>
          <span className="font-extrabold text-slate-900 bg-white px-2.5 py-1 rounded-lg border border-slate-200 tabular-nums font-['Plus_Jakarta_Sans',sans-serif]">
            {currentStage.count.toLocaleString('en-US')} عنصر
          </span>
          <span className="text-slate-500 font-medium">التحويل من السابقة:</span>
          <span className="font-extrabold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200 tabular-nums font-['Plus_Jakarta_Sans',sans-serif]">
            {currentStage.conversionRate}%
          </span>
        </div>
      </div>
    </div>
  );
};
