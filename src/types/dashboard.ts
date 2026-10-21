export type MarketRegion = 'all' | 'gulf' | 'arabic' | 'local';

export type ProblemSector = 'all' | 'real-estate' | 'ecommerce' | 'fnb' | 'healthcare' | 'construction' | 'services';

export interface Problem {
  id: string;
  title: string;
  summary: string;
  sector: string;
  sectorKey: ProblemSector;
  source: 'reddit' | 'x' | 'google-maps' | 'facebook' | 'tavily' | 'other';
  sourceName: string;
  sourceUrl?: string;
  status?: string;
  whoSuffers?: string;
  score: number; // 0-100
  market: MarketRegion;
  leadsCount: number;
  detectedDate: string;
  suggestedSolution: string;
  demoType: string;
}

export interface FunnelStageData {
  id: string;
  nameAr: string;
  nameEn: string;
  count: number;
  change: string;
  conversionRate: number;
  color: string;
  descriptionAr: string;
}

export interface OutreachMessage {
  id: string;
  leadName: string;
  leadRole: string;
  companyName: string;
  city: string;
  country: string;
  channel: 'whatsapp' | 'email' | 'telegram' | 'instagram' | 'linkedin' | 'other';
  subject?: string;
  leadId?: string;
  channelLabel: string;
  detectedPainPoint: string;
  sourceSnippet: string;
  aiMessagePreview: string;
  demoLink: string;
  demoTitle: string;
  matchScore: number;
  scheduledTime: string;
}

export interface N8nWorkflow {
  id: string;
  name: string;
  nameEn: string;
  category: string;
  status: 'active' | 'running' | 'idle' | 'error';
  lastRun: string;
  lastRunTimestamp: number;
  successRate: number;
  executionsCount: number;
  avgDuration: string;
  logs: { time: string; event: string; status: 'success' | 'info' | 'warning' }[];
}

export interface DashboardStats {
  problemsFound: number;
  problemsTrend: string;
  newLeads: number;
  leadsTrend: string;
  pendingMessages: number;
  pendingTrend: string;
  demosSent: number;
  demosTrend: string;
  totalPipelineValue: number;
  dealsClosed: number;
}
