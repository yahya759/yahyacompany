import React, { useMemo, useState } from 'react';
import { ExternalLink, Globe, MapPin, Search } from 'lucide-react';
import { Btn, Empty, PageHead, Panel, Pill, inputCls, scoreTone } from '../components/ui';
import { CHANNEL_LABELS } from '../utils/mappers';
import { mapsLink, searchLink } from '../lib/outreach';
import { api } from '../lib/api';
import type { PageCtx } from './types';

const STATUSES: [string, string][] = [
  ['new', 'جديد'],
  ['contacted', 'تم التواصل'],
  ['replied', 'ردّ'],
  ['won', 'صفقة'],
  ['lost', 'خسارة'],
];

export const LeadsPage: React.FC<{ ctx: PageCtx }> = ({ ctx }) => {
  const { data, run, refresh, toast } = ctx;
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('all');
  const [problem, setProblem] = useState('all');

  const rows = useMemo(
    () =>
      data.leads.filter(
        (l) =>
          (status === 'all' || l.status === status) &&
          (problem === 'all' || l.problem_id === problem) &&
          (!q || `${l.name} ${l.city ?? ''} ${l.gap_found ?? ''}`.toLowerCase().includes(q.toLowerCase())),
      ),
    [data.leads, q, status, problem],
  );

  const setLeadStatus = async (id: string, s: string) => {
    try {
      await api.patchLead(id, s);
      await refresh();
    } catch (e: any) {
      toast(`فشل: ${e.message}`);
    }
  };

  const problemsWithLeads = data.problems.filter((p) => data.leads.some((l) => l.problem_id === p.id));

  return (
    <div className="space-y-5">
      <PageHead title="العملاء المحتملون" subtitle={`${rows.length} من ${data.leads.length}`} />
      <Panel>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
          <div className="relative md:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            <input className={`${inputCls} pr-9`} placeholder="اسم النشاط، المدينة، الفجوة…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <select className={inputCls} value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="all">كل الحالات</option>
            {STATUSES.map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
          <select className={inputCls} value={problem} onChange={(e) => setProblem(e.target.value)}>
            <option value="all">كل المشاكل</option>
            {problemsWithLeads.map((p) => (
              <option key={p.id} value={p.id}>
                {p.problem_summary.slice(0, 40)}
              </option>
            ))}
          </select>
        </div>

        {rows.length === 0 ? (
          <Empty text="لا يوجد عملاء. افتح مشكلة لها حل واضغط «ابحث عن عملاء»." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="text-slate-400 border-b border-slate-100">
                  <th className="py-2.5 px-2 font-bold">النشاط</th>
                  <th className="py-2.5 px-2 font-bold">الفجوة</th>
                  <th className="py-2.5 px-2 font-bold">قناة التواصل</th>
                  <th className="py-2.5 px-2 font-bold text-center">التطابق</th>
                  <th className="py-2.5 px-2 font-bold">الحالة</th>
                  <th className="py-2.5 px-2" />
                </tr>
              </thead>
              <tbody>
                {rows.map((l) => {
                  const msgs = data.messages.filter((m) => m.lead_id === l.id);
                  const hasMsg = msgs.length > 0;
                  const writing = data.jobs.some((j) => j.status === 'running' && j.action === 'write_message' && j.params?.lead_id === l.id);
                  return (
                    <tr key={l.id} className="border-b border-slate-50 hover:bg-slate-50/60 align-top">
                      <td className="py-3 px-2">
                        <p className="font-bold text-slate-900">{l.name}</p>
                        <p className="text-[11px] text-slate-500">{l.city || l.address || '—'}</p>
                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                          <a
                            href={mapsLink(l)}
                            target="_blank"
                            rel="noreferrer"
                            title="افتح حسابه على خرائط Google (التقييمات والصور)"
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-[11px] font-bold"
                          >
                            <MapPin className="w-3 h-3" /> الخريطة
                          </a>
                          {l.website && (
                            <a
                              href={l.website}
                              target="_blank"
                              rel="noreferrer"
                              title="موقعه الإلكتروني"
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-sky-50 text-sky-700 hover:bg-sky-100 text-[11px] font-bold"
                            >
                              <Globe className="w-3 h-3" /> الموقع
                            </a>
                          )}
                          <a
                            href={searchLink(l)}
                            target="_blank"
                            rel="noreferrer"
                            title="ابحث عنه في Google (إنستجرام، فيسبوك…)"
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 text-[11px] font-bold"
                          >
                            <ExternalLink className="w-3 h-3" /> بحث
                          </a>
                        </div>
                      </td>
                      <td className="py-3 px-2 max-w-xs leading-relaxed">{l.gap_found || '—'}</td>
                      <td className="py-3 px-2">
                        {l.contact_channel ? (
                          <>
                            <Pill tone="blue">{CHANNEL_LABELS[l.contact_channel]}</Pill>
                            <p className="text-[11px] text-slate-500 mt-1 ltr-text" dir="ltr">
                              {l.contact_value}
                            </p>
                          </>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="py-3 px-2 text-center">
                        <Pill tone={scoreTone(l.fit_score ?? 0)}>{l.fit_score ?? 0}%</Pill>
                      </td>
                      <td className="py-3 px-2">
                        <select
                          className="px-2 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-[11px] font-bold"
                          value={l.status}
                          onChange={(e) => setLeadStatus(l.id, e.target.value)}
                        >
                          {STATUSES.map(([k, v]) => (
                            <option key={k} value={k}>
                              {v}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-3 px-2">
                        <Btn
                          variant={hasMsg ? 'ghost' : 'primary'}
                          busy={writing}
                          disabled={!l.contact_channel}
                          title={!l.contact_channel ? 'لا توجد قناة تواصل' : undefined}
                          onClick={() => run('write_message', { lead_id: l.id }, 'بدأت كتابة الرسالة')}
                        >
                          {hasMsg ? 'رسالة جديدة' : 'اكتب رسالة'}
                        </Btn>
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
