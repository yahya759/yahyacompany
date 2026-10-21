import type {
  DashboardStats,
  FunnelStageData,
  MarketRegion,
  N8nWorkflow,
  OutreachMessage,
  Problem,
  ProblemSector,
} from '../types/dashboard';
import type { DashboardData, JobAction, JobRow, LeadRow, MessageRow, ProblemRow, SolutionRow } from '../types/db';

export const SECTOR_LABELS: Record<Exclude<ProblemSector, 'all'>, string> = {
  'real-estate': 'العقارات',
  ecommerce: 'التجارة الإلكترونية',
  fnb: 'المطاعم والضيافة',
  healthcare: 'الرعاية الصحية',
  construction: 'المقاولات',
  services: 'الخدمات',
};

export const CHANNEL_LABELS: Record<string, string> = {
  whatsapp: 'واتساب',
  email: 'إيميل',
  telegram: 'تليجرام',
  instagram: 'إنستجرام (يدوي)',
  other: 'أخرى (يدوي)',
};

export const SOURCE_LABELS: Record<string, string> = {
  reddit: 'Reddit',
  tavily: 'بحث الويب',
  'google-maps': 'خرائط Google',
  facebook: 'Facebook',
  x: 'منصة X',
  other: 'مصدر آخر',
};

export const ACTION_LABELS: Record<JobAction, { ar: string; en: string; category: string }> = {
  find_problems: { ar: 'رادار المشاكل', en: 'Problem Radar', category: 'الرصد' },
  build_solution: { ar: 'بناء الحل', en: 'Solution Builder', category: 'التحليل' },
  find_leads: { ar: 'البحث عن عملاء', en: 'Lead Finder', category: 'المبيعات' },
  write_message: { ar: 'كتابة الرسائل', en: 'Message Writer', category: 'التواصل' },
  send_message: { ar: 'إرسال الرسائل', en: 'Send Message', category: 'التواصل' },
  write_followup: { ar: 'كتابة المتابعات', en: 'Follow-up Writer', category: 'التواصل' },
};

export function timeAgo(iso?: string | null): string {
  if (!iso) return '—';
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 45) return 'الآن';
  if (s < 3600) return `قبل ${Math.round(s / 60)} دقيقة`;
  if (s < 86400) return `قبل ${Math.round(s / 3600)} ساعة`;
  return `قبل ${Math.round(s / 86400)} يوم`;
}

export function toSectorKey(s?: string | null): Exclude<ProblemSector, 'all'> {
  const v = (s || '').toLowerCase();
  if ((Object.keys(SECTOR_LABELS) as string[]).includes(v)) return v as Exclude<ProblemSector, 'all'>;
  if (/عقار|real/.test(v)) return 'real-estate';
  if (/تجار|متجر|ecom|shop/.test(v)) return 'ecommerce';
  if (/مطعم|مطاعم|كاف|ضياف|food|restaurant|cafe|fnb/.test(v)) return 'fnb';
  if (/صح|طب|عياد|مستشف|health|clinic|medical/.test(v)) return 'healthcare';
  if (/مقاول|بناء|إنشاء|construct/.test(v)) return 'construction';
  return 'services';
}

const firstLine = (t: string, n = 70) => {
  const one = t.split(/[.\n。؟!]/)[0].trim() || t;
  return one.length > n ? one.slice(0, n) + '…' : one;
};

export function mapProblems(d: DashboardData): Problem[] {
  return d.problems.map((p: ProblemRow) => {
    const sol = d.solutions.find((s) => s.problem_id === p.id);
    const src = (p.source || 'other').toLowerCase();
    const source = (['reddit', 'tavily', 'google-maps', 'facebook', 'x'].includes(src) ? src : 'other') as Problem['source'];
    const key = toSectorKey(p.sector);
    return {
      id: p.id,
      title: firstLine(p.problem_summary),
      summary: p.problem_summary,
      sector: SECTOR_LABELS[key],
      sectorKey: key,
      source,
      sourceName: SOURCE_LABELS[source],
      sourceUrl: p.source_url || undefined,
      score: p.score ?? 0,
      market: p.market as MarketRegion,
      leadsCount: d.leads.filter((l) => l.problem_id === p.id).length,
      detectedDate: timeAgo(p.created_at),
      suggestedSolution: sol?.pitch || sol?.solution_name || 'لم يُبنَ حل بعد — اضغط لبنائه',
      demoType: sol?.demo_script ? 'سيناريو عرض جاهز' : 'لا يوجد عرض بعد',
      status: p.status,
      whoSuffers: p.who_suffers || undefined,
    };
  });
}

export function mapPendingMessages(d: DashboardData): OutreachMessage[] {
  return d.messages
    .filter((m) => m.status === 'pending_approval')
    .map((m) => {
      const lead = d.leads.find((l) => l.id === m.lead_id);
      const prob = d.problems.find((p) => p.id === lead?.problem_id);
      const sol = d.solutions.find((s) => s.id === m.solution_id);
      return {
        id: m.id,
        leadId: m.lead_id,
        leadName: lead?.name || 'عميل',
        leadRole: m.type === 'followup' ? 'متابعة' : 'رسالة أولى',
        companyName: lead?.name || '',
        city: lead?.city || lead?.address || '—',
        country: '',
        channel: m.channel,
        channelLabel: CHANNEL_LABELS[m.channel] || m.channel,
        detectedPainPoint: lead?.gap_found || prob?.problem_summary || '',
        sourceSnippet: prob?.problem_summary || '',
        aiMessagePreview: m.message,
        subject: m.subject || undefined,
        demoLink: lead?.website || '',
        demoTitle: sol?.solution_name || '',
        matchScore: lead?.fit_score ?? 0,
        scheduledTime: timeAgo(m.created_at),
      };
    });
}

const weekTrend = (rows: { created_at: string }[]) => {
  const now = Date.now();
  const w = 7 * 86400000;
  const cur = rows.filter((r) => now - new Date(r.created_at).getTime() < w).length;
  const prev = rows.filter((r) => {
    const a = now - new Date(r.created_at).getTime();
    return a >= w && a < 2 * w;
  }).length;
  if (!cur && !prev) return '—';
  if (!prev) return `+${cur} هذا الأسبوع`;
  const pct = Math.round(((cur - prev) / prev) * 100);
  return `${pct >= 0 ? '+' : ''}${pct}%`;
};

export function computeStats(d: DashboardData): DashboardStats {
  const sent = d.messages.filter((m) => m.status === 'sent');
  const pending = d.messages.filter((m) => m.status === 'pending_approval');
  return {
    problemsFound: d.problems.length,
    problemsTrend: weekTrend(d.problems),
    newLeads: d.leads.length,
    leadsTrend: weekTrend(d.leads),
    pendingMessages: pending.length,
    pendingTrend: pending.length ? 'تتطلب اعتمادك' : 'لا شيء بانتظارك',
    demosSent: sent.length,
    demosTrend: weekTrend(sent.map((m) => ({ created_at: m.sent_at || m.created_at }))),
    totalPipelineValue: 0,
    dealsClosed: d.leads.filter((l) => l.status === 'won').length,
  };
}

export function computeFunnel(d: DashboardData): FunnelStageData[] {
  const problems = d.problems.length;
  const withSolution = new Set(d.solutions.map((s) => s.problem_id)).size;
  const leads = d.leads.length;
  const contacted = new Set(d.messages.filter((m) => m.status === 'sent').map((m) => m.lead_id)).size;
  const replied = d.leads.filter((l) => l.status === 'replied' || l.status === 'won').length;
  const won = d.leads.filter((l) => l.status === 'won').length;
  const base = problems || 1;
  const mk = (
    id: string,
    nameAr: string,
    nameEn: string,
    count: number,
    color: string,
    descriptionAr: string,
    rows: { created_at: string }[],
  ): FunnelStageData => ({
    id,
    nameAr,
    nameEn,
    count,
    change: weekTrend(rows),
    conversionRate: Math.round((count / base) * 1000) / 10,
    color,
    descriptionAr,
  });
  return [
    mk('problem', 'المشكلة', 'Problem', problems, '#3b82f6', 'مشاكل عمل رصدها الرادار وتجاوزت حد الجودة', d.problems),
    mk('solution', 'الحل', 'Solution', withSolution, '#06b6d4', 'مشاكل بُني لها حل وسيناريو عرض', d.solutions),
    mk('lead', 'العميل المحتمل', 'Lead', leads, '#0ea5e9', 'أنشطة مناسبة وُجدت وفيها فجوة واضحة', d.leads),
    mk('message', 'الرسالة', 'Message', contacted, '#6366f1', 'عملاء أُرسلت لهم رسالة بعد اعتمادك', d.messages.filter((m) => m.status === 'sent')),
    mk('reply', 'الرد', 'Reply', replied, '#8b5cf6', 'عملاء ردّوا على الرسالة', d.leads.filter((l) => l.status === 'replied' || l.status === 'won')),
    mk('deal', 'الصفقة', 'Deal', won, '#059669', 'صفقات أُغلقت', d.leads.filter((l) => l.status === 'won')),
  ];
}

export function mapWorkflows(jobs: JobRow[]): N8nWorkflow[] {
  return (Object.keys(ACTION_LABELS) as JobAction[]).map((a) => {
    const mine = jobs.filter((j) => j.action === a);
    const latest = mine[0];
    const done = mine.filter((j) => j.status === 'done').length;
    const failed = mine.filter((j) => j.status === 'failed').length;
    const durations = mine
      .filter((j) => j.finished_at)
      .map((j) => (new Date(j.finished_at!).getTime() - new Date(j.created_at).getTime()) / 1000);
    const avg = durations.length ? durations.reduce((x, y) => x + y, 0) / durations.length : 0;
    const status: N8nWorkflow['status'] = !latest
      ? 'idle'
      : mine.some((j) => j.status === 'running')
        ? 'running'
        : latest.status === 'failed'
          ? 'error'
          : 'active';
    return {
      id: a,
      name: ACTION_LABELS[a].ar,
      nameEn: ACTION_LABELS[a].en,
      category: ACTION_LABELS[a].category,
      status,
      lastRun: latest ? timeAgo(latest.created_at) : 'لم يُشغَّل بعد',
      lastRunTimestamp: latest ? new Date(latest.created_at).getTime() : 0,
      successRate: done + failed ? Math.round((done / (done + failed)) * 100) : 100,
      executionsCount: mine.length,
      avgDuration: avg ? `${Math.round(avg)} ث` : '—',
      logs: mine.slice(0, 20).map((j) => ({
        time: new Date(j.created_at).toLocaleTimeString('ar', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        event:
          j.status === 'running'
            ? 'قيد التنفيذ…'
            : j.status === 'done'
              ? 'اكتمل بنجاح'
              : `فشل: ${j.error || 'سبب غير معروف'}`,
        status: j.status === 'done' ? 'success' : j.status === 'failed' ? 'warning' : 'info',
      })),
    };
  });
}

export const settingsMap = (d: DashboardData | null): Record<string, any> =>
  Object.fromEntries((d?.settings ?? []).map((s) => [s.key, s.value]));

export const isRunning = (jobs: JobRow[], action: JobAction, field: string, id: string) =>
  jobs.some((j) => j.status === 'running' && j.action === action && j.params?.[field] === id);

export type { LeadRow, MessageRow, SolutionRow };
