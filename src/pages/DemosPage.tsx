import React, { useState } from 'react';
import { Copy, MonitorPlay } from 'lucide-react';
import { Btn, Empty, PageHead, Panel } from '../components/ui';
import { copyText } from '../components/ui';
import type { PageCtx } from './types';

export const DemosPage: React.FC<{ ctx: PageCtx }> = ({ ctx }) => {
  const { data, toast } = ctx;
  const [open, setOpen] = useState<string | null>(null);
  const list = data.solutions.filter((s) => s.demo_script);
  return (
    <div className="space-y-5">
      <PageHead title="العروض التوضيحية" subtitle="سيناريوهات العرض الجاهزة لكل حل" />
      {list.length === 0 ? (
        <Panel>
          <Empty text="لا توجد سيناريوهات عرض بعد." />
        </Panel>
      ) : (
        <div className="space-y-4">
          {list.map((s) => {
            const prob = data.problems.find((p) => p.id === s.problem_id);
            const isOpen = open === s.id;
            return (
              <Panel key={s.id}>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center shrink-0">
                      <MonitorPlay className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-extrabold text-slate-900 truncate">{s.solution_name}</h3>
                      <p className="text-[11px] text-slate-400 truncate">{prob?.problem_summary}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Btn onClick={async () => toast((await copyText(s.demo_script!)) ? 'تم نسخ السيناريو' : 'تعذّر النسخ')}>
                      <Copy className="w-3.5 h-3.5" /> نسخ
                    </Btn>
                    <Btn variant="dark" onClick={() => setOpen(isOpen ? null : s.id)}>
                      {isOpen ? 'إخفاء' : 'عرض'}
                    </Btn>
                  </div>
                </div>
                {isOpen && (
                  <pre className="mt-4 whitespace-pre-wrap text-xs leading-loose text-slate-800 bg-slate-50 rounded-2xl p-4 font-[inherit]">
                    {s.demo_script}
                  </pre>
                )}
              </Panel>
            );
          })}
        </div>
      )}
    </div>
  );
};
