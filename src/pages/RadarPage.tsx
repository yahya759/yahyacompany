import React, { useMemo, useState } from 'react';
import { ExternalLink, Radar, Search } from 'lucide-react';
import { Btn, Empty, PageHead, Panel, Pill, inputCls, scoreTone } from '../components/ui';
import { SECTOR_LABELS, mapProblems, isRunning } from '../utils/mappers';
import { api } from '../lib/api';
import type { PageCtx } from './types';

const STATUS: Record<string, { label: string; tone: 'slate' | 'blue' | 'green' | 'amber' }> = {
  new: { label: 'جديدة', tone: 'blue' },
  solution_ready: { label: 'الحل جاهز', tone: 'green' },
  leads_found: { label: 'عملاء جاهزون', tone: 'green' },
  archived: { label: 'مؤرشفة', tone: 'slate' },
};

export const RadarPage: React.FC<{ ctx: PageCtx; onNewRadar: () => void }> = ({ ctx, onNewRadar }) => {
  const { data, run, refresh, toast, openSolution } = ctx;
  const [q, setQ] = useState('');
  const [sector, setSector] = useState('all');
  const [status, setStatus] = useState('active');
  const [minScore, setMinScore] = useState(0);
  const [busy, setBusy] = useState<string | null>(null);

  const rows = useMemo(
    () =>
      mapProblems(data).filter(
        (p) =>
          (sector === 'all' || p.sectorKey === sector) &&
          (status === 'all' ? true : status === 'active' ? p.status !== 'archived' : p.status === status) &&
          p.score >= minScore &&
          (!q || (p.summary + (p.whoSuffers || '')).toLowerCase().includes(q.toLowerCase())),
      ),
    [data, q, sector, status, minScore],
  );

  const archive = async (id: string, to: string) => {
    setBusy(id);
    try {
      await api.patchProblem(id, to);
      await refresh();
    } catch (e: any) {
      toast(`فشل: ${e.message}`);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-5">
      <PageHead
        title="رادار المشاكل"
        subtitle={`${rows.length} مشكلة — كل ما تجاوز حد الجودة في الإعدادات`}
        actions={
          <Btn variant="primary" onClick={onNewRadar}>
            <Radar className="w-4 h-4" /> رادار جديد
          </Btn>
        }
      />
      <Panel>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
          <div className="relative md:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            <input className={`${inputCls} pr-9`} placeholder="بحث بالنص…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <select className={inputCls} value={sector} onChange={(e) => setSector(e.target.value)}>
            <option value="all">كل القطاعات</option>
            {Object.entries(SECTOR_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
          <select className={inputCls} value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="active">النشطة</option>
            <option value="new">جديدة</option>
            <option value="solution_ready">الحل جاهز</option>
            <option value="leads_found">عملاء جاهزون</option>
            <option value="archived">المؤرشفة</option>
            <option value="all">الكل</option>
          </select>
        </div>
        <label className="flex items-center gap-3 text-xs text-slate-600 mb-4">
          الحد الأدنى للتقييم: <b className="tabular-nums w-6">{minScore}</b>
          <input type="range" min={0} max={100} step={5} value={minScore} onChange={(e) => setMinScore(+e.target.value)} className="flex-1 accent-emerald-500" />
        </label>

        {rows.length === 0 ? (
          <Empty text="لا توجد مشاكل مطابقة. شغّل رادار جديد." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="text-slate-400 border-b border-slate-100">
                  <th className="py-2.5 px-2 font-bold">المشكلة</th>
                  <th className="py-2.5 px-2 font-bold">القطاع</th>
                  <th className="py-2.5 px-2 font-bold">المصدر</th>
                  <th className="py-2.5 px-2 font-bold text-center">التقييم</th>
                  <th className="py-2.5 px-2 font-bold text-center">عملاء</th>
                  <th className="py-2.5 px-2 font-bold">الحالة</th>
                  <th className="py-2.5 px-2" />
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => {
                  const st = STATUS[p.status || 'new'];
                  const building = isRunning(data.jobs, 'build_solution', 'problem_id', p.id);
                  return (
                    <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50/60 align-top">
                      <td className="py-3 px-2 max-w-md">
                        <p className="font-bold text-slate-900 leading-relaxed">{p.summary}</p>
                        {p.whoSuffers && <p className="text-[11px] text-slate-500 mt-1">المتضرر: {p.whoSuffers}</p>}
                      </td>
                      <td className="py-3 px-2 whitespace-nowrap">{p.sector}</td>
                      <td className="py-3 px-2 whitespace-nowrap">
                        {p.sourceUrl ? (
                          <a href={p.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sky-700 hover:underline">
                            {p.sourceName} <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          p.sourceName
                        )}
                      </td>
                      <td className="py-3 px-2 text-center">
                        <Pill tone={scoreTone(p.score)}>{p.score}/100</Pill>
                      </td>
                      <td className="py-3 px-2 text-center tabular-nums">{p.leadsCount}</td>
                      <td className="py-3 px-2">
                        <Pill tone={st.tone}>{st.label}</Pill>
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex gap-1.5 justify-end">
                          <Btn variant="dark" busy={building} onClick={() => openSolution(p.id)}>
                            {p.status === 'new' ? 'ابنِ الحل' : 'افتح'}
                          </Btn>
                          {p.status === 'archived' ? (
                            <Btn busy={busy === p.id} onClick={() => archive(p.id, 'new')}>
                              استعادة
                            </Btn>
                          ) : (
                            <Btn variant="danger" busy={busy === p.id} onClick={() => archive(p.id, 'archived')}>
                              أرشفة
                            </Btn>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
};
