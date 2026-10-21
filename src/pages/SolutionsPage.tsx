import React from 'react';
import { Lightbulb, Users, Wand2 } from 'lucide-react';
import { Btn, Empty, PageHead, Panel, Pill } from '../components/ui';
import { isRunning, timeAgo } from '../utils/mappers';
import type { PageCtx } from './types';

export const asList = (v: any): string[] => {
  if (Array.isArray(v)) return v.map((x) => (typeof x === 'string' ? x : x?.title || x?.step || x?.name || JSON.stringify(x)));
  if (typeof v === 'string') return v.split(/\n|،|,/).map((s) => s.trim()).filter(Boolean);
  return [];
};

export const SolutionsPage: React.FC<{ ctx: PageCtx }> = ({ ctx }) => {
  const { data, run, openSolution } = ctx;
  const without = data.problems.filter((p) => p.status === 'new' && !data.solutions.some((s) => s.problem_id === p.id));
  const top = [...without].sort((a, b) => (b.score ?? 0) - (a.score ?? 0)).slice(0, 8);

  return (
    <div className="space-y-5">
      <PageHead title="الحلول الذكية" subtitle={`${data.solutions.length} حل جاهز`} />

      {top.length > 0 && (
        <Panel>
          <h3 className="text-sm font-bold text-slate-900 mb-3">مشاكل تنتظر بناء حل ({without.length})</h3>
          <div className="space-y-2">
            {top.map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-slate-50">
                <p className="text-xs font-semibold text-slate-800 line-clamp-2 flex-1">{p.problem_summary}</p>
                <Pill tone="amber">{p.score}</Pill>
                <Btn
                  variant="primary"
                  busy={isRunning(data.jobs, 'build_solution', 'problem_id', p.id)}
                  onClick={() => run('build_solution', { problem_id: p.id }, 'بدأ بناء الحل')}
                >
                  <Wand2 className="w-3.5 h-3.5" /> ابنِ الحل
                </Btn>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {data.solutions.length === 0 ? (
        <Panel>
          <Empty text="لا توجد حلول بعد. ابنِ حلاً من إحدى المشاكل." />
        </Panel>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          {data.solutions.map((s) => {
            const prob = data.problems.find((p) => p.id === s.problem_id);
            const leads = data.leads.filter((l) => l.problem_id === s.problem_id).length;
            const steps = asList(s.workflow_steps);
            const tools = asList(s.tools_needed);
            return (
              <Panel key={s.id}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <Lightbulb className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-900">{s.solution_name}</h3>
                      <p className="text-[11px] text-slate-400">{timeAgo(s.created_at)}</p>
                    </div>
                  </div>
                  <Pill tone="blue">
                    <Users className="w-3 h-3" /> {leads}
                  </Pill>
                </div>
                {s.pitch && <p className="text-xs text-slate-700 leading-relaxed mt-3">{s.pitch}</p>}
                {prob && <p className="text-[11px] text-slate-400 mt-2 line-clamp-1">المشكلة: {prob.problem_summary}</p>}
                {steps.length > 0 && (
                  <ol className="mt-3 space-y-1 text-[11px] text-slate-600 list-decimal pr-4">
                    {steps.slice(0, 4).map((x, i) => (
                      <li key={i}>{x}</li>
                    ))}
                    {steps.length > 4 && <li className="list-none text-slate-400">+{steps.length - 4} خطوات</li>}
                  </ol>
                )}
                {tools.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {tools.map((t) => (
                      <Pill key={t}>{t}</Pill>
                    ))}
                  </div>
                )}
                <div className="flex gap-2 mt-4">
                  <Btn variant="dark" onClick={() => openSolution(s.problem_id)}>
                    التفاصيل
                  </Btn>
                  <Btn
                    busy={isRunning(data.jobs, 'find_leads', 'problem_id', s.problem_id)}
                    onClick={() => run('find_leads', { problem_id: s.problem_id }, 'بدأ البحث عن عملاء')}
                  >
                    {leads ? 'ابحث عن المزيد' : 'ابحث عن عملاء'}
                  </Btn>
                </div>
              </Panel>
            );
          })}
        </div>
      )}
    </div>
  );
};
