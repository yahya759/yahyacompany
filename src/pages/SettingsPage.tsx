import React, { useEffect, useState } from 'react';
import { Plus, X } from 'lucide-react';
import { Btn, PageHead, Panel, inputCls } from '../components/ui';
import { settingsMap } from '../utils/mappers';
import { api } from '../lib/api';
import type { PageCtx } from './types';

const Section: React.FC<{ title: string; desc: string; onSave: () => Promise<void>; children: React.ReactNode }> = ({ title, desc, onSave, children }) => {
  const [busy, setBusy] = useState(false);
  return (
    <Panel>
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h3 className="text-sm font-extrabold text-slate-900">{title}</h3>
          <p className="text-[11px] text-slate-500 mt-0.5">{desc}</p>
        </div>
        <Btn
          variant="dark"
          busy={busy}
          onClick={async () => {
            setBusy(true);
            try {
              await onSave();
            } finally {
              setBusy(false);
            }
          }}
        >
          حفظ
        </Btn>
      </div>
      {children}
    </Panel>
  );
};

const Toggle: React.FC<{ label: string; on: boolean; onChange: (v: boolean) => void; disabled?: boolean }> = ({ label, on, onChange, disabled }) => (
  <button
    type="button"
    disabled={disabled}
    onClick={() => onChange(!on)}
    className={`flex items-center justify-between w-full px-3.5 py-2.5 rounded-xl border text-xs font-bold disabled:opacity-60 ${on ? 'border-emerald-300 bg-emerald-50 text-emerald-800' : 'border-slate-200 bg-slate-50 text-slate-500'}`}
  >
    <span>{label}</span>
    <span className={`w-8 h-4 rounded-full relative ${on ? 'bg-emerald-500' : 'bg-slate-300'}`}>
      <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${on ? 'right-0.5' : 'right-[18px]'}`} />
    </span>
  </button>
);

const Tags: React.FC<{ value: string[]; onChange: (v: string[]) => void; placeholder: string }> = ({ value, onChange, placeholder }) => {
  const [t, setT] = useState('');
  const add = () => {
    const v = t.trim();
    if (v && !value.includes(v)) onChange([...value, v]);
    setT('');
  };
  return (
    <div>
      <div className="flex gap-2">
        <input
          className={inputCls}
          value={t}
          placeholder={placeholder}
          onChange={(e) => setT(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              add();
            }
          }}
        />
        <Btn onClick={add}>
          <Plus className="w-3.5 h-3.5" />
        </Btn>
      </div>
      <div className="flex flex-wrap gap-1.5 mt-3">
        {value.map((x) => (
          <span key={x} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-xs font-semibold text-slate-700">
            {x}
            <button onClick={() => onChange(value.filter((y) => y !== x))} className="text-slate-400 hover:text-rose-600">
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        {value.length === 0 && <span className="text-[11px] text-slate-400">لا شيء بعد</span>}
      </div>
    </div>
  );
};

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <label className="block">
    <span className="text-[11px] font-bold text-slate-600 block mb-1.5">{label}</span>
    {children}
  </label>
);

export const SettingsPage: React.FC<{ ctx: PageCtx }> = ({ ctx }) => {
  const { data, refresh, toast } = ctx;
  const s = settingsMap(data);
  const [llm, setLlm] = useState({ primary: '', fallback: '' });
  const [th, setTh] = useState<Record<string, number>>({});
  const [ch, setCh] = useState<Record<string, any>>({});
  const [src, setSrc] = useState<Record<string, boolean>>({});
  const [sectors, setSectors] = useState<string[]>([]);
  const [markets, setMarkets] = useState<string[]>([]);
  const [keywords, setKeywords] = useState<string[]>([]);

  // hydrate once from the server (do not clobber edits on each poll)
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    if (hydrated || !data.settings.length) return;
    setLlm({ primary: s.llm_model?.primary ?? '', fallback: s.llm_model?.fallback ?? '' });
    setTh(s.thresholds ?? {});
    setCh(s.send_channels ?? {});
    setSrc(s.problem_sources ?? {});
    setSectors(Array.isArray(s.sectors) ? s.sectors : []);
    setMarkets(Array.isArray(s.markets) ? s.markets : []);
    setKeywords(Array.isArray(s.keywords) ? s.keywords : []);
    setHydrated(true);
  }, [data.settings, hydrated]);

  const save = (key: string, value: unknown) => async () => {
    try {
      await api.saveSetting(key, value);
      await refresh();
      toast('تم حفظ الإعدادات');
    } catch (e: any) {
      toast(`فشل الحفظ: ${e.message}`);
    }
  };

  const numField = (k: string, label: string) => (
    <Field label={label}>
      <input type="number" className={inputCls} value={th[k] ?? ''} onChange={(e) => setTh({ ...th, [k]: Number(e.target.value) })} />
    </Field>
  );

  return (
    <div className="space-y-5">
      <PageHead title="الإعدادات" subtitle="تُقرأ مباشرة من جدول settings داخل مسارات n8n" />
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <Section title="النموذج" desc="الأساسي والبديل عند الوصول للحد" onSave={save('llm_model', llm)}>
          <div className="space-y-3">
            <Field label="الأساسي">
              <input className={inputCls} dir="ltr" value={llm.primary} onChange={(e) => setLlm({ ...llm, primary: e.target.value })} />
            </Field>
            <Field label="البديل (Fallback)">
              <input className={inputCls} dir="ltr" value={llm.fallback} onChange={(e) => setLlm({ ...llm, fallback: e.target.value })} />
            </Field>
          </div>
        </Section>

        <Section title="الحدود" desc="الفلترة والمتابعة وطول الرسالة" onSave={save('thresholds', th)}>
          <div className="grid grid-cols-2 gap-3">
            {numField('problem_score_min', 'أدنى تقييم للمشكلة')}
            {numField('lead_fit_min', 'أدنى تطابق للعميل')}
            {numField('followup_after_days', 'متابعة بعد (أيام)')}
            {numField('max_followups', 'أقصى عدد متابعات')}
            {numField('max_message_words', 'أقصى كلمات للرسالة')}
          </div>
        </Section>

        <Section title="قنوات الإرسال" desc="إنستجرام يدوي دائماً (نسخ الرسالة)" onSave={save('send_channels', ch)}>
          <div className="space-y-2">
            <Toggle label="إيميل (Gmail)" on={!!ch.email} onChange={(v) => setCh({ ...ch, email: v })} />
            <Toggle label="تليجرام" on={!!ch.telegram} onChange={(v) => setCh({ ...ch, telegram: v })} />
            <Toggle label="واتساب Business (يحتاج Template معتمد)" on={!!ch.whatsapp} onChange={(v) => setCh({ ...ch, whatsapp: v })} />
            <Toggle label="إنستجرام — يدوي" on disabled onChange={() => {}} />
          </div>
        </Section>

        <Section title="مصادر الرادار" desc="من أين يبحث Problem Radar" onSave={save('problem_sources', src)}>
          <div className="space-y-2">
            <Toggle label="Reddit" on={!!src.reddit} onChange={(v) => setSrc({ ...src, reddit: v })} />
            <Toggle label="Tavily (بحث الويب)" on={!!src.tavily} onChange={(v) => setSrc({ ...src, tavily: v })} />
            <Toggle label="مراجعات خرائط Google (Apify)" on={!!src.apify_google_maps_reviews} onChange={(v) => setSrc({ ...src, apify_google_maps_reviews: v })} />
          </div>
        </Section>

        <Section title="القطاعات المستهدفة" desc="مفاتيح مثل: real-estate, healthcare, fnb" onSave={save('sectors', sectors)}>
          <Tags value={sectors} onChange={setSectors} placeholder="أضف قطاعاً واضغط Enter" />
        </Section>
        <Section title="الأسواق والمدن" desc="تُستخدم في البحث عن العملاء" onSave={save('markets', markets)}>
          <Tags value={markets} onChange={setMarkets} placeholder="مثال: الرياض، دبي، عمّان" />
        </Section>
        <div className="xl:col-span-2">
          <Section title="كلمات البحث" desc="كلمات يبني منها الرادار استعلاماته" onSave={save('keywords', keywords)}>
            <Tags value={keywords} onChange={setKeywords} placeholder="مثال: تأخر الرد، إلغاء الحجز" />
          </Section>
        </div>
      </div>
    </div>
  );
};
