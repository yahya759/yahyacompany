import React from 'react';
import { Terminal, X, CheckCircle2, Clock, Activity, Copy, Check } from 'lucide-react';
import { N8nWorkflow } from '../types/dashboard';

interface WorkflowLogsModalProps {
  workflow: N8nWorkflow | null;
  onClose: () => void;
}

export const WorkflowLogsModal: React.FC<WorkflowLogsModalProps> = ({
  workflow,
  onClose,
}) => {
  if (!workflow) return null;

  const [copied, setCopied] = React.useState(false);

  const samplePayload = {
    workflow_id: workflow.id,
    workflow_name: workflow.name,
    environment: 'production-cloud-n8n',
    status: 'ACTIVE_LISTENING',
    last_trigger_timestamp: new Date().toISOString(),
    metrics: {
      success_rate: `${workflow.successRate}%`,
      avg_execution_ms: 2420,
      total_payloads_processed_today: workflow.executionsCount,
    },
    pipeline_nodes: [
      { node: 'Webhook Trigger / Cron Schedule', status: 'SUCCESS', code: 200 },
      { node: 'Gemini 2.5 Flash Problem Extractor & Pain Classifier', status: 'SUCCESS' },
      { node: 'Google Places & LinkedIn Lead Enricher', status: 'SUCCESS' },
      { node: 'Personalized Demo Script Generator', status: 'SUCCESS' },
      { node: 'Approval Queue Dispatcher', status: 'QUEUED_FOR_USER' },
    ],
  };

  const copyPayload = () => {
    navigator.clipboard?.writeText(JSON.stringify(samplePayload, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-slate-950 text-slate-100 rounded-3xl shadow-2xl border border-slate-800 max-w-2xl w-full overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-slate-800 text-emerald-400 flex items-center justify-center font-mono">
              <Terminal className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white font-mono">
                n8n_execution_logs: {workflow.id}
              </h3>
              <p className="text-[11px] text-slate-400">{workflow.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Log stream */}
        <div className="p-6 overflow-y-auto space-y-4 font-mono text-xs">
          <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-800 pb-2">
            <span>سجل الأحداث اللحظي (Execution Trace)</span>
            <span className="text-emerald-400 flex items-center gap-1 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              200 OK
            </span>
          </div>

          <div className="space-y-2">
            {workflow.logs.map((log, i) => (
              <div
                key={i}
                className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-start gap-2.5"
              >
                <span className="text-slate-500 text-[10px] tabular-nums shrink-0 mt-0.5">
                  [{log.time}]
                </span>
                <span
                  className={
                    log.status === 'success'
                      ? 'text-emerald-400'
                      : log.status === 'warning'
                      ? 'text-amber-400'
                      : 'text-sky-300'
                  }
                >
                  ✓ {log.event}
                </span>
              </div>
            ))}
          </div>

          {/* JSON Payload viewer */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-1.5 text-[11px] text-slate-400">
              <span>Webhook Payload & Engine Metadata:</span>
              <button
                onClick={copyPayload}
                className="text-slate-400 hover:text-white flex items-center gap-1 text-[10px]"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                {copied ? 'تم النسخ' : 'نسخ JSON'}
              </button>
            </div>
            <pre className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800/80 text-[11px] text-slate-300 overflow-x-auto text-left dir-ltr max-h-48 scrollbar-thin">
              {JSON.stringify(samplePayload, null, 2)}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-900/50 flex items-center justify-between text-xs">
          <span className="text-slate-400">
            معدل النجاح: <strong className="text-emerald-400">{workflow.successRate}%</strong>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-colors"
          >
            إغلاق السجل
          </button>
        </div>
      </div>
    </div>
  );
};
