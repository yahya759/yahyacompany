import React, { useState } from 'react';
import { Wand2, X, Users, Send, Laptop, Copy } from 'lucide-react';
import type { Problem } from '../types/dashboard';
import type { JobRow, LeadRow, SolutionRow } from '../types/db';
import { Btn, Pill, copyText, scoreTone } from './ui';
import { CHANNEL_LABELS, isRunning } from '../utils/mappers';
import { asList } from '../pages/SolutionsPage';

interface Props {
  problem: Problem | null;
  solution?: SolutionRow;
  leads: LeadRow[];
  jobs: JobRow[];
  onClose: () => void;
  onBuildSolution: (problemId: string) => void;
  onFindLeads: (problemId: string) => void;
  onWriteMessage: (leadId: string) => void;
}

export const SolutionModal: React.FC<Props> = ({ problem, solution, leads, jobs, onClose, onBuildSolution, onFindLeads, onWriteMessage }) => {
  const [tab, setTab] = useState<'architecture' | 'leads' | 'demo'>('architecture');
  if (!problem) return null;
  const building = isRunning(jobs, 'build_solution', 'problem_id', problem.id);
  const finding = isRunning(jobs, 'find_leads', 'problem_id', problem.id);
  const steps = asList(solution?.workflow_steps);
  const tools = asList(solution?.tools_needed);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="px-6 py-5 border-b border-slate-100 flex items-start justify-between gap-4 bg-slate-50/50">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <Wand2 className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-extrabold text-slate-900 leading-relaxed">{problem.summary}</h3>
              <div className="flex gap-1.5 mt-2 flex-wrap">
                <Pill tone={scoreTone(problem.score)}>{problem.score}/100</Pill>
                <Pill>{problem.sector}</Pill>
                <Pill>{problem.sourceName}</Pill>
                {problem.whoSuffers && <Pill tone="blue">{problem.whoSuffers}</Pill>}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 pt-4 flex gap-2">
          {(
            [
              ['architecture', 'الحل', Wand2],
              ['leads', `العملاء (${leads.length})`, Users],
              ['demo', 'سيناريو العرض', Laptop],
            ] as const
          ).map(([k, label, Icon]) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 ${tab === k ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              <Icon className="w-3.5 h-3.5" /> {label}
            </button>
          ))}
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {!solution ? (
            <div className="py-10 text-center space-y-4">
              <p className="text-sm text-slate-500">لم يُبنَ حل لهذه المشكلة بعد.</p>
              <Btn variant="primary" busy={building} onClick={() => onBuildSolution(problem.id)}>
                <Wand2 className="w-4 h-4" /> {building ? 'جاري البناء…' : 'ابنِ الحل'}
              </Btn>
            </div>
          ) : tab === 'architecture' ? (
            <div className="space-y-4">
              <div>
                <h4 className="text-base font-extrabold text-slate-900">{solution.solution_name}</h4>
                {solution.pitch && <p className="text-xs text-slate-700 leading-loose mt-2">{solution.pitch}</p>}
              </div>
              {steps.length > 0 && (
                <div>
                  <p className="text-[11px] font-bold text-slate-400 mb-2">خطوات المسار</p>
                  <ol className="space-y-1.5 list-decimal pr-5 text-xs text-slate-700">
                    {steps.map((x, i) => (
                      <li key={i}>{x}</li>
                    ))}
                  </ol>
                </div>
              )}
              {tools.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {tools.map((t) => (
                    <Pill key={t} tone="blue">
                      {t}
                    </Pill>
                  ))}
                </div>
              )}
            </div>
          ) : tab === 'leads' ? (
            <div className="space-y-3">
              <Btn variant="primary" busy={finding} onClick={() => onFindLeads(problem.id)}>
                <Users className="w-3.5 h-3.5" /> {finding ? 'جاري البحث…' : leads.length ? 'ابحث عن المزيد' : 'ابحث عن عملاء'}
              </Btn>
              {leads.length === 0 && <p className="text-xs text-slate-400 pt-2">لا يوجد عملاء بعد.</p>}
              {leads.map((l) => (
                <div key={l.id} className="flex items-start justify-between gap-3 p-3.5 rounded-2xl bg-slate-50">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900">{l.name}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{l.gap_found || '—'}</p>
                    <div className="flex gap-1.5 mt-2">
                      <Pill tone={scoreTone(l.fit_score ?? 0)}>{l.fit_score ?? 0}%</Pill>
                      {l.contact_channel && <Pill tone="blue">{CHANNEL_LABELS[l.contact_channel]}</Pill>}
                    </div>
                  </div>
                  <Btn
                    busy={jobs.some((j) => j.status === 'running' && j.action === 'write_message' && j.params?.lead_id === l.id)}
                    disabled={!l.contact_channel}
                    onClick={() => onWriteMessage(l.id)}
                  >
                    <Send className="w-3.5 h-3.5" /> اكتب رسالة
                  </Btn>
                </div>
              ))}
            </div>
          ) : (
            <div>
              {solution.demo_script ? (
                <>
                  <Btn onClick={() => copyText(solution.demo_script!)} className="mb-3">
                    <Copy className="w-3.5 h-3.5" /> نسخ
                  </Btn>
                  <pre className="whitespace-pre-wrap text-xs leading-loose text-slate-800 bg-slate-50 rounded-2xl p-4 font-[inherit]">{solution.demo_script}</pre>
                </>
              ) : (
                <p className="text-xs text-slate-400">لا يوجد سيناريو.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
