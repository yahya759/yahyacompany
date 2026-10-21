import React from 'react';
import { N8nWorkflowsCard } from '../components/N8nWorkflowsCard';
import { Empty, PageHead, Panel, Pill } from '../components/ui';
import { ACTION_LABELS, mapWorkflows, timeAgo } from '../utils/mappers';
import type { N8nWorkflow } from '../types/dashboard';
import type { PageCtx } from './types';

export const WorkflowsPage: React.FC<{
  ctx: PageCtx;
  onTrigger: (id: string) => void;
  onOpenLogs: (wf: N8nWorkflow) => void;
}> = ({ ctx, onTrigger, onOpenLogs }) => {
  const { data } = ctx;
  const tone = { running: 'blue', done: 'green', failed: 'red' } as const;
  const label = { running: 'قيد التنفيذ', done: 'اكتمل', failed: 'فشل' } as const;
  return (
    <div className="space-y-5">
      <PageHead title="مسارات العمل n8n" subtitle="كل تشغيل يُسجَّل في جدول jobs" />
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        <div className="xl:col-span-5">
          <N8nWorkflowsCard workflows={mapWorkflows(data.jobs)} onTriggerWorkflow={onTrigger} onOpenLogs={onOpenLogs} />
        </div>
        <div className="xl:col-span-7">
          <Panel>
            <h3 className="text-sm font-bold text-slate-900 mb-4">آخر المهام</h3>
            {data.jobs.length === 0 ? (
              <Empty text="لا توجد مهام بعد." />
            ) : (
              <div className="overflow-x-auto max-h-[640px] overflow-y-auto">
                <table className="w-full text-right text-xs">
                  <thead>
                    <tr className="text-slate-400 border-b border-slate-100 sticky top-0 bg-white">
                      <th className="py-2 px-2 font-bold">المسار</th>
                      <th className="py-2 px-2 font-bold">الحالة</th>
                      <th className="py-2 px-2 font-bold">الوقت</th>
                      <th className="py-2 px-2 font-bold">المدة</th>
                      <th className="py-2 px-2 font-bold">التفاصيل</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.jobs.slice(0, 60).map((j) => (
                      <tr key={j.id} className="border-b border-slate-50 align-top">
                        <td className="py-2.5 px-2 font-bold text-slate-800 whitespace-nowrap">{ACTION_LABELS[j.action]?.ar || j.action}</td>
                        <td className="py-2.5 px-2">
                          <Pill tone={tone[j.status]}>{label[j.status]}</Pill>
                        </td>
                        <td className="py-2.5 px-2 whitespace-nowrap text-slate-500">{timeAgo(j.created_at)}</td>
                        <td className="py-2.5 px-2 whitespace-nowrap text-slate-500 tabular-nums">
                          {j.finished_at ? `${Math.round((new Date(j.finished_at).getTime() - new Date(j.created_at).getTime()) / 1000)} ث` : '—'}
                        </td>
                        <td className="py-2.5 px-2 text-slate-500 max-w-xs">
                          {j.error ? <span className="text-rose-600">{j.error}</span> : <span dir="ltr" className="text-[11px]">{Object.keys(j.params || {}).length ? JSON.stringify(j.params).slice(0, 80) : '—'}</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
};
