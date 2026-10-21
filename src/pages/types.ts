import type { DashboardData, JobAction } from '../types/db';

export interface PageCtx {
  data: DashboardData;
  run: (action: JobAction, params?: Record<string, unknown>, okMsg?: string) => Promise<boolean>;
  toast: (m: string) => void;
  refresh: () => Promise<unknown>;
  openSolution: (problemId: string) => void;
}
