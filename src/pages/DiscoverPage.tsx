import React, { useState } from 'react';
import { Compass, Globe2, Star, TrendingUp } from 'lucide-react';
import { Btn, PageHead, Panel, inputCls } from '../components/ui';
import { SECTOR_LABELS } from '../utils/mappers';
import type { PageCtx } from './types';

export const DiscoverPage: React.FC<{ ctx: PageCtx }> = ({ ctx }) => {
  const { data, run } = ctx;
  const [market, setMarket] = useState('gulf');
  const [sector, setSector] = useState('all');
  const running = (action: string, mode: string) =>
    data.jobs.some((j) => j.status === 'running' && j.action === action && j.params?.mode === mode);

  const cards = [
    {
      key: 'no_website',
      icon: Globe2,
      tone: 'bg-sky-50 text-sky-600',
      title: 'أنشطة بدون موقع إلكتروني',
      desc: 'يبحث في خرائط Google عن أنشطة عندها رقم هاتف وما عندها موقع، ويحفظها كعملاء مع فجوة واضحة.',
      busy: running('discover_leads', 'no_website'),
      go: () => run('discover_leads', { mode: 'no_website', market, sector: sector === 'all' ? undefined : sector }, 'بدأ البحث عن أنشطة بدون موقع'),
    },
    {
      key: 'low_rating',
      icon: Star,
      tone: 'bg-amber-50 text-amber-600',
      title: 'أنشطة بتقييم ضعيف',
      desc: 'يبحث عن أنشطة تقييمها 3.8 أو أقل مع عدد مراجعات معقول، ويضيف شكوى حقيقية من العملاء كفجوة.',
      busy: running('discover_leads', 'low_rating'),
      go: () => run('discover_leads', { mode: 'low_rating', market, sector: sector === 'all' ? undefined : sector }, 'بدأ البحث عن أنشطة بتقييم ضعيف'),
    },
    {
      key: 'trends',
      icon: TrendingUp,
      tone: 'bg-violet-50 text-violet-600',
      title: `أكبر مشاكل السوق العربي ${new Date().getFullYear()} (AI والأتمتة)`,
      desc: 'يبحث لحاله بالويب وReddit بصيغ عربية وإنجليزية متنوعة، ويستخرج المشاكل والاحتياجات اللي يمكن تحويلها لمنتج أو خدمة.',
      busy: running('find_problems', 'trends'),
      go: () => run('find_problems', { mode: 'trends', market }, 'بدأ البحث عن مشاكل السوق'),
    },
  ];

  return (
    <div className="space-y-5">
      <PageHead title="اكتشاف تلقائي" subtitle="بدون كتابة كلمات بحث: اضغط وانتظر بضع دقائق، والنتائج تظهر لحالها" />
      <Panel className="!p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="block">
            <span className="text-[11px] font-bold text-slate-600 block mb-1.5">السوق</span>
            <select className={inputCls} value={market} onChange={(e) => setMarket(e.target.value)}>
              <option value="gulf">الخليج (الرياض، جدة، دبي، الدوحة…)</option>
              <option value="arabic">دول عربية (عمّان، القاهرة، بيروت…)</option>
              <option value="local">فلسطين (نابلس، رام الله، الخليل، غزة)</option>
            </select>
          </label>
          <label className="block">
            <span className="text-[11px] font-bold text-slate-600 block mb-1.5">القطاع (للعملاء فقط)</span>
            <select className={inputCls} value={sector} onChange={(e) => setSector(e.target.value)}>
              <option value="all">متنوع (يختار أنواع أنشطة مختلفة كل مرة)</option>
              {Object.entries(SECTOR_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </label>
        </div>
        <p className="text-[11px] text-slate-400 mt-3">المدينة تُختار عشوائياً من السوق (أو من «الأسواق والمدن» في الإعدادات إن حددتها)، فكل تشغيل يعطي نتائج جديدة.</p>
      </Panel>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {cards.map((c) => (
          <Panel key={c.key} className="flex flex-col">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${c.tone}`}>
              <c.icon className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-extrabold text-slate-900 mt-4">{c.title}</h3>
            <p className="text-xs text-slate-600 leading-loose mt-2 flex-1">{c.desc}</p>
            <Btn variant="primary" className="mt-5 !py-3" busy={c.busy} onClick={c.go}>
              <Compass className="w-4 h-4" /> {c.busy ? 'جاري البحث…' : 'ابدأ'}
            </Btn>
          </Panel>
        ))}
      </div>
      <p className="text-xs text-slate-500">
        النتائج: العملاء في «العملاء المحتملون»، والمشاكل في «رادار المشاكل». التقدّم والأخطاء في «المهام».
      </p>
    </div>
  );
};
