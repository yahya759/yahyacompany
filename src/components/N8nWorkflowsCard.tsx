import React, { useState } from 'react';
import {
  GitBranch,
  Play,
  CheckCircle2,
  AlertTriangle,
  Clock,
  RefreshCw,
  Terminal,
  Activity,
  Check,
} from 'lucide-react';
import { N8nWorkflow } from '../types/dashboard';

interface N8nWorkflowsCardProps {
  workflows: N8nWorkflow[];
  onTriggerWorkflow: (id: string) => void;
  onOpenLogs: (workflow: N8nWorkflow) => void;
}

export const N8nWorkflowsCard: React.FC<N8nWorkflowsCardProps> = ({
  workflows,
  onTriggerWorkflow,
  onOpenLogs,
}) => {
  const [runningId, setRunningId] = useState<string | null>(null);

  const handleRun = (id: string) => {
    setRunningId(id);
    onTriggerWorkflow(id);
    setTimeout(() => {
      setRunningId(null);
    }, 1800);
  };

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-200/70 shadow-sm flex flex-col justify-between h-full">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <GitBranch className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                حالة المهام (Jobs)
              </h3>
              <p className="text-[11px] text-slate-400">
                المحرك الأوتوماتيكي لرصد المشاكل وتغذية قمع التحويل بالعملاء
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              4 مسارات نشطة
            </span>
          </div>
        </div>

        {/* 4 Workflows List */}
        <div className="space-y-3">
          {workflows.map((wf) => {
            const isCurrentlyRunning = runningId === wf.id || wf.status === 'running';

            return (
              <div
                key={wf.id}
                className="p-3.5 rounded-2xl bg-slate-50/90 border border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition-all flex flex-col gap-2.5 group"
              >
                {/* Top line: status dot + title + run buttons */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="shrink-0">
                      {isCurrentlyRunning ? (
                        <span className="relative flex h-2.5 w-2.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-sky-500"></span>
                        </span>
                      ) : wf.status === 'active' ? (
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 block shadow-xs ring-2 ring-emerald-100"></span>
                      ) : (
                        <span className="w-2.5 h-2.5 rounded-full bg-red-500 block"></span>
                      )}
                    </div>
                    <h4 className="text-xs font-bold text-slate-900 group-hover:text-emerald-700 transition-colors truncate">
                      {wf.name}
                    </h4>
                  </div>

                  {/* Actions: Run & Logs */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => onOpenLogs(wf)}
                      className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-slate-900 hover:bg-slate-50 text-xs font-medium transition-colors"
                      title="عرض سجل التنفيذ"
                    >
                      <Terminal className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleRun(wf.id)}
                      disabled={isCurrentlyRunning}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                        isCurrentlyRunning
                          ? 'bg-sky-100 text-sky-800'
                          : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
                      }`}
                    >
                      {isCurrentlyRunning ? (
                        <>
                          <RefreshCw className="w-3 h-3 animate-spin text-sky-600" />
                          <span>جاري الرصد...</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3 h-3 text-emerald-600 fill-emerald-600" />
                          <span>تشغيل الآن</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Subtitle & Execution Metadata line */}
                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100/80">
                  <span className="text-[10px] text-slate-400 font-medium truncate max-w-[200px]">
                    {wf.nameEn}
                  </span>

                  <div className="flex items-center gap-2.5 shrink-0">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {wf.lastRun}
                    </span>
                    <span>·</span>
                    <span className="font-bold text-emerald-700 font-['Plus_Jakarta_Sans',sans-serif] tabular-nums">
                      نجاح {wf.successRate}%
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Insight */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 text-emerald-500" />
          إجمالي عمليات التشغيل اليوم:{' '}
          <strong className="text-slate-900 font-['Plus_Jakarta_Sans',sans-serif] tabular-nums">
            9,080
          </strong>
        </span>
        <span className="text-[11px] text-slate-400">Webhook API: 200 OK</span>
      </div>
    </div>
  );
};
