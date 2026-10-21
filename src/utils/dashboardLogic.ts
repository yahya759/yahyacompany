/**
 * Pure business logic for Problem2Client SaaS Dashboard
 * Decoupled from React UI for deterministic testing and ultra mode verification.
 */

export interface FunnelStage {
  id: string;
  nameAr: string;
  nameEn: string;
  count: number;
  conversionFromPrev?: number;
}

export interface ProblemItem {
  id: string;
  title: string;
  sector: string;
  sectorKey: 'real-estate' | 'ecommerce' | 'fnb' | 'healthcare' | 'construction' | 'services';
  source: 'reddit' | 'x' | 'google-maps' | 'facebook';
  sourceName: string;
  score: number; // 0-100
  market: 'gulf' | 'arabic' | 'local';
  leadsCount: number;
  snippet: string;
  dateAdded: string;
}

export interface PendingMessage {
  id: string;
  leadName: string;
  leadTitle: string;
  company: string;
  city: string;
  sector: string;
  channel: 'whatsapp' | 'email' | 'linkedin';
  painPoint: string;
  aiMessagePreview: string;
  demoUrl: string;
  confidenceScore: number;
}

export interface WorkflowItem {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'idle' | 'running' | 'error';
  lastRun: string;
  lastRunTimestamp: number;
  successRate: number;
  runsToday: number;
}

/**
 * Calculates conversion rates between funnel stages
 */
export function calculateFunnelConversions(stages: { id: string; nameAr: string; nameEn: string; count: number }[]): FunnelStage[] {
  return stages.map((stage, index) => {
    if (index === 0) {
      return { ...stage, conversionFromPrev: 100 };
    }
    const prevCount = stages[index - 1].count;
    const rate = prevCount > 0 ? Math.round((stage.count / prevCount) * 100) : 0;
    return { ...stage, conversionFromPrev: rate };
  });
}

/**
 * Categorizes a problem score into visual status
 */
export function getScoreCategory(score: number): {
  color: 'green' | 'orange' | 'red';
  labelAr: string;
  bgClass: string;
  textClass: string;
} {
  if (score >= 80) {
    return {
      color: 'green',
      labelAr: 'فرصة عالية',
      bgClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      textClass: 'text-emerald-600',
    };
  }
  if (score >= 60) {
    return {
      color: 'orange',
      labelAr: 'فرصة واعدة',
      bgClass: 'bg-amber-50 text-amber-700 border-amber-200',
      textClass: 'text-amber-600',
    };
  }
  return {
    color: 'red',
    labelAr: 'فرصة عادية',
    bgClass: 'bg-slate-100 text-slate-700 border-slate-200',
    textClass: 'text-slate-600',
  };
}

/**
 * Filter problems by search term, sector, and market
 */
export function filterProblems(
  problems: ProblemItem[],
  query: string,
  sectorFilter: string,
  marketFilter: string
): ProblemItem[] {
  const cleanQuery = query.trim().toLowerCase();
  
  return problems.filter((item) => {
    const matchesQuery =
      !cleanQuery ||
      item.title.toLowerCase().includes(cleanQuery) ||
      item.sector.toLowerCase().includes(cleanQuery) ||
      item.snippet.toLowerCase().includes(cleanQuery);

    const matchesSector = !sectorFilter || sectorFilter === 'all' || item.sectorKey === sectorFilter;
    const matchesMarket = !marketFilter || marketFilter === 'all' || item.market === marketFilter;

    return matchesQuery && matchesSector && matchesMarket;
  });
}

/**
 * Message approval queue transition logic
 */
export function processMessageAction(
  queue: PendingMessage[],
  currentId: string,
  action: 'send' | 'edit' | 'skip',
  updatedContent?: string
): {
  remainingQueue: PendingMessage[];
  processedMessage: PendingMessage | null;
  status: 'sent' | 'edited' | 'skipped';
} {
  const targetIndex = queue.findIndex((m) => m.id === currentId);
  if (targetIndex === -1) {
    return { remainingQueue: queue, processedMessage: null, status: 'skipped' };
  }

  const target = { ...queue[targetIndex] };
  if (action === 'edit' && updatedContent) {
    target.aiMessagePreview = updatedContent;
  }

  const remaining = queue.filter((m) => m.id !== currentId);
  return {
    remainingQueue: remaining,
    processedMessage: target,
    status: action === 'send' ? 'sent' : action === 'edit' ? 'edited' : 'skipped',
  };
}
