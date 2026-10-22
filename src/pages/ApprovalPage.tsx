import React, { useState } from 'react';
import { Check, Copy, ExternalLink, MapPin, RefreshCw, X } from 'lucide-react';
import { Btn, Empty, PageHead, Panel, Pill, copyText, inputCls } from '../components/ui';
import { CHANNEL_LABELS, timeAgo } from '../utils/mappers';
import { channelLink, mapsLink } from '../lib/outreach';
import { api } from '../lib/api';
import type { MessageRow } from '../types/db';
import type { PageCtx } from './types';

const TABS: [MessageRow['status'], string][] = [
  ['pending_approval', 'بانتظار الاعتماد'],
  ['approved', 'معتمدة'],
  ['sent', 'مُرسلة'],
  ['failed', 'فشلت'],
  ['rejected', 'مرفوضة'],
];
const wordCount = (t: string) => t.trim().split(/\s+/).filter(Boolean).length;

const MessageCard: React.FC<{ m: MessageRow; ctx: PageCtx }> = ({ m, ctx }) => {
  const { data, refresh, toast } = ctx;
  const lead = data.leads.find((l) => l.id === m.lead_id);
  const [text, setText] = useState(m.message);
  const [subject, setSubject] = useState(m.subject || '');
  const [busy, setBusy] = useState<string | null>(null);
  const dirty = text !== m.message || subject !== (m.subject || '');
  const link = channelLink(m.channel, lead?.contact_value, text, subject);
  const editable = m.status === 'pending_approval' || m.status === 'approved';

  const act = async (key: string, fn: () => Promise<unknown>, ok?: string) => {
    setBusy(key);
    try {
      await fn();
      if (ok) toast(ok);
      await refresh();
    } catch (e: any) {
      toast(`فشل: ${e.message}`);
    } finally {
      setBusy(null);
    }
  };
  const save = () => api.patchMessage(m.id, { message: text, subject: subject || null });
  const open = () =>
    act(
      'open',
      async () => {
        if (dirty) await save();
        await copyText(text);
        if (link) window.open(link, '_blank', 'noopener');
        if (m.status === 'pending_approval') await api.patchMessage(m.id, { status: 'approved' });
      },
      link ? 'فُتحت المحادثة والرسالة منسوخة — اضغط «تم الإرسال» بعد ما ترسل' : 'نُسخت الرسالة — أرسلها يدوياً ثم اضغط «تم الإرسال»',
    );

  return (
    <Panel>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
            {lead?.name || 'عميل'}
            {lead && (
              <a href={mapsLink(lead)} target="_blank" rel="noreferrer" title="شوف شغله على خرائط Google" className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-[11px] font-bold">
                <MapPin className="w-3 h-3" /> الخريطة
              </a>
            )}
          </h3>
          <p className="text-[11px] text-slate-500 mt-0.5" dir="ltr" style={{ textAlign: 'right' }}>
            {lead?.contact_value}
          </p>
        </div>
        <div className="flex gap-1.5 flex-wrap justify-end">
          <Pill tone="blue">{CHANNEL_LABELS[m.channel]}</Pill>
          {m.type === 'followup' && <Pill tone="violet">متابعة</Pill>}
          <Pill>{timeAgo(m.sent_at || m.created_at)}</Pill>
        </div>
      </div>

      {lead?.gap_found && <p className="text-[11px] text-slate-500 mb-3">الفجوة: {lead.gap_found}</p>}

      {m.channel === 'email' && (
        <input className={`${inputCls} mb-2`} placeholder="عنوان الإيميل" value={subject} disabled={!editable} onChange={(e) => setSubject(e.target.value)} />
      )}
      <textarea
        className={`${inputCls} leading-relaxed min-h-28`}
        value={text}
        disabled={!editable}
        onChange={(e) => setText(e.target.value)}
      />
      <div className="flex items-center justify-between mt-1.5 text-[11px] text-slate-400">
        <span className={wordCount(text) > 80 ? 'text-rose-600 font-bold' : ''}>{wordCount(text)} كلمة (الحد 80)</span>
        {m.error && <span className="text-rose-600">{m.error}</span>}
      </div>

      <div className="flex flex-wrap gap-2 mt-4">
        {(m.status === 'pending_approval' || m.status === 'approved') && (
          <>
            <Btn variant="primary" busy={busy === 'open'} onClick={open}>
              {link ? <ExternalLink className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {link ? `فتح ${CHANNEL_LABELS[m.channel]?.split(' ')[0] || 'المحادثة'} + نسخ` : 'نسخ الرسالة'}
            </Btn>
            {link && (
              <Btn onClick={async () => toast((await copyText(text)) ? 'تم النسخ' : 'تعذّر النسخ')}>
                <Copy className="w-3.5 h-3.5" /> نسخ فقط
              </Btn>
            )}
            <Btn variant="dark" busy={busy === 'manual'} onClick={() => act('manual', async () => { if (dirty) await save(); await api.markSent(m.id); }, 'سُجّلت كمُرسلة')}>
              <Check className="w-3.5 h-3.5" /> تم الإرسال
            </Btn>
            {editable && dirty && (
              <Btn busy={busy === 'save'} onClick={() => act('save', save, 'تم حفظ التعديل')}>
                حفظ التعديل
              </Btn>
            )}
            {m.status === 'pending_approval' ? (
              <Btn variant="danger" busy={busy === 'no'} onClick={() => act('no', () => api.patchMessage(m.id, { status: 'rejected' }))}>
                <X className="w-3.5 h-3.5" /> رفض
              </Btn>
            ) : (
              <Btn busy={busy === 'back'} onClick={() => act('back', () => api.patchMessage(m.id, { status: 'pending_approval' }))}>
                إرجاع للانتظار
              </Btn>
            )}
          </>
        )}
        {m.status === 'sent' && !m.replied && (
          <Btn
            variant="primary"
            busy={busy === 'rep'}
            onClick={() =>
              act('rep', async () => {
                await api.patchMessage(m.id, { replied: true });
                await api.patchLead(m.lead_id, 'replied');
              }, 'سُجّل ردّ العميل')
            }
          >
            العميل ردّ
          </Btn>
        )}
        {m.status === 'sent' && m.replied && <Pill tone="green">ردّ العميل {timeAgo(m.replied_at)}</Pill>}
        {m.status === 'rejected' && (
          <Btn busy={busy === 'back'} onClick={() => act('back', () => api.patchMessage(m.id, { status: 'pending_approval' }))}>
            استعادة
          </Btn>
        )}
      </div>
    </Panel>
  );
};

export const ApprovalPage: React.FC<{ ctx: PageCtx }> = ({ ctx }) => {
  const { data, run } = ctx;
  const [tab, setTab] = useState<MessageRow['status']>('pending_approval');
  const list = data.messages.filter((m) => m.status === tab);
  const count = (s: string) => data.messages.filter((m) => m.status === s).length;

  return (
    <div className="space-y-5">
      <PageHead
        title="اعتماد الرسائل"
        subtitle="الإرسال يدوي: افتح المحادثة، أرسل، ثم اضغط «تم الإرسال»"
        actions={
          <Btn
            variant="dark"
            busy={data.jobs.some((j) => j.status === 'running' && j.action === 'write_followup')}
            onClick={() => run('write_followup', {}, 'بدأ توليد المتابعات المستحقة')}
          >
            <RefreshCw className="w-3.5 h-3.5" /> توليد المتابعات
          </Btn>
        }
      />
      <div className="flex gap-2 flex-wrap">
        {TABS.map(([k, label]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`px-4 py-2 rounded-xl text-xs font-bold border transition-colors ${
              tab === k ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {label} <span className="tabular-nums opacity-70">({count(k)})</span>
          </button>
        ))}
      </div>
      {list.length === 0 ? (
        <Panel>
          <Empty text="لا توجد رسائل هنا." />
        </Panel>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          {list.map((m) => (
            <MessageCard key={`${m.id}:${m.message.length}:${m.status}`} m={m} ctx={ctx} />
          ))}
        </div>
      )}
    </div>
  );
};
