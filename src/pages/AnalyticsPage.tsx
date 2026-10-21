import React from 'react';
import { PageHead, Panel } from '../components/ui';
import { SalesFunnel } from '../components/SalesFunnel';
import { CHANNEL_LABELS, SECTOR_LABELS, computeFunnel, toSectorKey } from '../utils/mappers';
import type { PageCtx } from './types';

const Bar: React.FC<{ label: string; value: number; max: number; hint?: string; color?: string }> = ({ label, value, max, hint, color = '#10b981' }) => (
  <div>
    <div className="flex justify-between text-xs mb-1">
      <span className="font-semibold text-slate-700">{label}</span>
      <span className="text-slate-500 tabular-nums">{hint ?? value}</span>
    </div>
    <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
      <div className="h-full rounded-full" style={{ width: `${max ? Math.max(3, (value / max) * 100) : 0}%`, background: color }} />
    </div>
  </div>
);

const Stat: React.FC<{ label: string; value: string; sub?: string }> = ({ label, value, sub }) => (
  <Panel className="!p-5">
    <p className="text-[11px] font-bold text-slate-400">{label}</p>
    <p className="text-2xl font-extrabold text-slate-900 mt-1 tabular-nums">{value}</p>
    {sub && <p className="text-[11px] text-slate-500 mt-1">{sub}</p>}
  </Panel>
);

const pct = (a: number, b: number) => (b ? `${Math.round((a / b) * 100)}%` : '—');

export const AnalyticsPage: React.FC<{ ctx: PageCtx }> = ({ ctx }) => {
  const { data } = ctx;
  const sent = data.messages.filter((m) => m.status === 'sent');
  const failed = data.messages.filter((m) => m.status === 'failed').length;
  const replied = sent.filter((m) => m.replied).length;
  const won = data.leads.filter((l) => l.status === 'won').length;
  const doneJobs = data.jobs.filter((j) => j.status === 'done').length;
  const failedJobs = data.jobs.filter((j) => j.status === 'failed').length;

  const channels = Object.keys(CHANNEL_LABELS).map((c) => ({
    c,
    sent: sent.filter((m) => m.channel === c).length,
    replied: sent.filter((m) => m.channel === c && m.replied).length,
  }));
  const sectors = (Object.keys(SECTOR_LABELS) as (keyof typeof SECTOR_LABELS)[])
    .map((k) => {
      const ps = data.problems.filter((p) => toSectorKey(p.sector) === k);
      return { k, n: ps.length, avg: ps.length ? Math.round(ps.reduce((s, p) => s + (p.score ?? 0), 0) / ps.length) : 0 };
    })
    .filter((x) => x.n);
  const leadStatus: [string, string, string][] = [
    ['new', 'جديد', '#0ea5e9'],
    ['contacted', 'تم التواصل', '#6366f1'],
    ['replied', 'ردّ', '#8b5cf6'],
    ['won', 'صفقة', '#059669'],
    ['lost', 'خسارة', '#94a3b8'],
  ];
  const maxN = Math.max(1, ...sectors.map((s) => s.n));
  const maxCh = Math.max(1, ...channels.map((c) => c.sent));
  const maxLead = Math.max(1, ...leadStatus.map(([k]) => data.leads.filter((l) => l.status === k).length));

  return (
    <div className="space-y-5">
      <PageHead title="التحليلات والمبيعات" />
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <Stat label="معدل الرد" value={pct(replied, sent.length)} sub={`${replied} ردّ من ${sent.length} رسالة`} />
        <Stat label="معدل الإغلاق" value={pct(won, data.leads.length)} sub={`${won} صفقة من ${data.leads.length} عميل`} />
        <Stat label="فشل الإرسال" value={String(failed)} sub="رسائل بحالة فشل" />
        <Stat label="نجاح المسارات" value={pct(doneJobs, doneJobs + failedJobs)} sub={`${failedJobs} مهمة فاشلة`} />
      </div>

      <SalesFunnel stages={computeFunnel(data)} />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <Panel>
          <h3 className="text-sm font-bold text-slate-900 mb-4">الرسائل المرسلة حسب القناة</h3>
          <div className="space-y-4">
            {channels.map((c) => (
              <Bar key={c.c} label={CHANNEL_LABELS[c.c]} value={c.sent} max={maxCh} hint={`${c.sent} · ردود ${c.replied}`} color="#6366f1" />
            ))}
          </div>
        </Panel>
        <Panel>
          <h3 className="text-sm font-bold text-slate-900 mb-4">المشاكل حسب القطاع</h3>
          {sectors.length === 0 ? (
            <p className="text-xs text-slate-400">لا بيانات</p>
          ) : (
            <div className="space-y-4">
              {sectors.map((s) => (
                <Bar key={s.k} label={SECTOR_LABELS[s.k]} value={s.n} max={maxN} hint={`${s.n} · متوسط ${s.avg}`} color="#06b6d4" />
              ))}
            </div>
          )}
        </Panel>
        <Panel>
          <h3 className="text-sm font-bold text-slate-900 mb-4">العملاء حسب الحالة</h3>
          <div className="space-y-4">
            {leadStatus.map(([k, label, color]) => (
              <Bar key={k} label={label} value={data.leads.filter((l) => l.status === k).length} max={maxLead} color={color} />
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
};
