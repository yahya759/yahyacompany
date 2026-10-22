import React from 'react';
import { N8nWorkflowsCard } from '../components/N8nWorkflowsCard';
import { Empty, PageHead, Panel, Pill } from '../components/ui';
import { ACTION_LABELS, mapWorkflows, timeAgo } from '../utils/mappers';
import { api } from '../lib/api';
import { Btn } from '../components/ui';
import type { N8nWorkflow } from '../types/dashboard';
import type { PageCtx } from './types';

const jobSummary = (j: any): string => {
  const r = j.result;
  if (j.status !== 'done' || !r) return '';
  if (j.action === 'find_problems') {
    if (!r.analyzed) return r.note || 'لا نتائج';
    const top = r.topRejected?.[0];
    const src = r.sources ? Object.entries(r.sources).map(([k, v]: any) => `${k}: ${v.usable}/${v.fetched}`).join(' · ') : '';
    return `حُلّل ${r.analyzed} → ${r.found} مشكلة` + (r.found === 0 && top ? ` (أعلى تقييم ${top.score} والحد ${r.threshold})` : '') + (src ? ` | ${src}` : '');
  }
  if (j.action === 'find_leads') return `فُحص ${r.scanned ?? 0} نشاط → ${r.found ?? 0} عميل${r.note ? ` (${r.note})` : ''}`;
  if (j.action === 'write_followup') return `${r.created ?? 0} متابعة جديدة`;
  return '';
};

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
      <PageHead title="المهام" subtitle="كل تشغيل يُسجَّل في جدول jobs ويُنفَّذ بالخلفية" />
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
                          {j.error ? <span className="text-rose-600">{j.error}</span> : jobSummary(j) ? <span className="text-slate-700 font-semibold">{jobSummary(j)}</span> : <span dir="ltr" className="text-[11px]">{Object.keys(j.params || {}).length ? JSON.stringify(j.params).slice(0, 80) : '—'}</span>}
                          {j.status === 'running' && (
                            <Btn variant="danger" className="mr-2 !py-1" onClick={async () => { try { await api.cancelJob(j.id); await ctx.refresh(); } catch (e: any) { ctx.toast(`فشل: ${e.message}`); } }}>
                              إلغاء
                            </Btn>
                          )}
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
