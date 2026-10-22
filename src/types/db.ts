export type JobAction =
  | 'find_problems'
  | 'build_solution'
  | 'find_leads'
  | 'write_message'
  | 'write_followup';

export interface JobRow {
  id: string;
  action: JobAction;
  params: Record<string, any>;
  status: 'running' | 'done' | 'failed';
  result: any;
  error: string | null;
  created_at: string;
  updated_at: string;
  finished_at: string | null;
}
export interface ProblemRow {
  id: string;
  job_id: string | null;
  problem_summary: string;
  sector: string | null;
  who_suffers: string | null;
  pays_for_solution: boolean | null;
  automation_fit: string | null;
  score: number | null;
  source: string | null;
  source_url: string | null;
  raw_text: string | null;
  market: 'gulf' | 'arabic' | 'local';
  status: 'new' | 'solution_ready' | 'leads_found' | 'archived';
  created_at: string;
}
export interface SolutionRow {
  id: string;
  problem_id: string;
  solution_name: string;
  pitch: string | null;
  workflow_steps: any;
  demo_script: string | null;
  tools_needed: any;
  created_at: string;
}
export interface LeadRow {
  id: string;
  problem_id: string | null;
  name: string;
  address: string | null;
  city: string | null;
  website: string | null;
  phone: string | null;
  gap_found: string | null;
  contact_channel: 'whatsapp' | 'email' | 'telegram' | 'instagram' | 'other' | null;
  contact_value: string | null;
  fit_score: number | null;
  status: 'new' | 'contacted' | 'replied' | 'won' | 'lost';
  created_at: string;
}
export interface MessageRow {
  id: string;
  lead_id: string;
  solution_id: string | null;
  parent_message_id: string | null;
  type: 'first' | 'followup';
  channel: 'whatsapp' | 'email' | 'telegram' | 'instagram' | 'other';
  subject: string | null;
  message: string;
  status: 'pending_approval' | 'approved' | 'rejected' | 'sent' | 'failed';
  followup_count: number;
  replied: boolean;
  replied_at: string | null;
  sent_at: string | null;
  error: string | null;
  created_at: string;
}
export interface SettingRow {
  key: string;
  value: any;
  description: string | null;
}
export interface DashboardData {
  problems: ProblemRow[];
  solutions: SolutionRow[];
  leads: LeadRow[];
  messages: MessageRow[];
  jobs: JobRow[];
  settings: SettingRow[];
  serverTime: string;
}
