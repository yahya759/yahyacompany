/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Loader2, X } from 'lucide-react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { KpiCards } from './components/KpiCards';
import { SalesFunnel } from './components/SalesFunnel';
import { TopProblemsTable } from './components/TopProblemsTable';
import { PendingMessagesCard } from './components/PendingMessagesCard';
import { N8nWorkflowsCard } from './components/N8nWorkflowsCard';
import { SolutionModal } from './components/SolutionModal';
import { EditMessageModal } from './components/EditMessageModal';
import { NewRadarModal } from './components/NewRadarModal';
import { WorkflowLogsModal } from './components/WorkflowLogsModal';
import { Btn, copyText } from './components/ui';
import { RadarPage } from './pages/RadarPage';
import { SolutionsPage } from './pages/SolutionsPage';
import { LeadsPage } from './pages/LeadsPage';
import { ApprovalPage } from './pages/ApprovalPage';
import { DemosPage } from './pages/DemosPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { WorkflowsPage } from './pages/WorkflowsPage';
import { SettingsPage } from './pages/SettingsPage';
import type { PageCtx } from './pages/types';
import { useDashboardData } from './hooks/useDashboardData';
import { api } from './lib/api';
import { computeFunnel, computeStats, mapPendingMessages, mapProblems, mapWorkflows, settingsMap } from './utils/mappers';
import type { MarketRegion, N8nWorkflow, OutreachMessage, ProblemSector } from './types/dashboard';
import type { JobAction } from './types/db';

const AUTO_CHANNELS = ['whatsapp', 'email', 'telegram'];

export default function App() {
  // No login screen: the dashboard opens straight into the app.
  const { data, error, loading, refresh } = useDashboardData(true);

  const [activeTab, setActiveTab] = useState<string>('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [marketFilter, setMarketFilter] = useState<MarketRegion>('all');
  const [activeSector, setActiveSector] = useState<ProblemSector>('all');

  const [selectedProblemId, setSelectedProblemId] = useState<string | null>(null);
  const [editingMessage, setEditingMessage] = useState<OutreachMessage | null>(null);
  const [isNewRadarOpen, setIsNewRadarOpen] = useState(false);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | null>(null);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    window.setTimeout(() => setToastMessage((cur) => (cur === msg ? null : cur)), 4200);
  };

  const run: PageCtx['run'] = async (action: JobAction, params = {}, okMsg) => {
    try {
      await api.runAction(action, params);
      showToast(okMsg || 'بدأ التنفيذ — تابع التقدّم من «مسارات العمل»');
      await refresh();
      return true;
    } catch (e: any) {
      showToast(`فشل التشغيل: ${e.message}`);
      return false;
    }
  };

  const problems = useMemo(() => (data ? mapProblems(data) : []), [data]);
  const stats = useMemo(() => (data ? computeStats(data) : null), [data]);
  const funnel = useMemo(() => (data ? computeFunnel(data) : []), [data]);
  const pending = useMemo(() => (data ? mapPendingMessages(data) : []), [data]);
  const workflows = useMemo(() => (data ? mapWorkflows(data.jobs) : []), [data]);

  const filteredProblems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return problems.filter(
      (p) =>
        p.status !== 'archived' &&
        (!q || p.summary.toLowerCase().includes(q) || p.sector.toLowerCase().includes(q)) &&
        (activeSector === 'all' || p.sectorKey === activeSector) &&
        (marketFilter === 'all' || p.market === marketFilter),
    );
  }, [problems, searchQuery, activeSector, marketFilter]);

  if (!data || !stats) {
    return (
      <div dir="rtl" className="min-h-screen flex items-center justify-center bg-[#f0f2f5] font-['Cairo',sans-serif] p-6">
        {loading && !error ? (
          <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
        ) : (
          <div className="bg-white rounded-3xl p-8 max-w-md text-center space-y-4 border border-slate-200">
            <p className="text-sm font-bold text-rose-600">تعذّر الاتصال بالخادم</p>
            <p className="text-xs text-slate-500 leading-relaxed">{error}</p>
            <p className="text-[11px] text-slate-400">تأكد من SUPABASE_URL و SUPABASE_SERVICE_ROLE_KEY في ملف .env</p>
            <Btn variant="primary" onClick={() => refresh()}>
              إعادة المحاولة
            </Btn>
          </div>
        )}
      </div>
    );
  }

  const ctx: PageCtx = {
    data,
    run,
    toast: showToast,
    refresh,
    openSolution: (id) => setSelectedProblemId(id),
  };

  const guard = async (fn: () => Promise<unknown>, ok?: string) => {
    try {
      await fn();
      if (ok) showToast(ok);
      await refresh();
    } catch (e: any) {
      showToast(`فشل: ${e.message}`);
    }
  };

  const handleSendMessage = async (id: string) => {
    const m = pending.find((x) => x.id === id);
    if (!m) return;
    if (AUTO_CHANNELS.includes(m.channel)) {
      await guard(() => api.sendMessage(id), `تم تمرير الرسالة إلى ${m.leadName} عبر ${m.channelLabel}`);
    } else {
      await copyText(m.aiMessagePreview);
      showToast('قناة يدوية: نُسخت الرسالة — أرسلها ثم علّمها «تم الإرسال» من صفحة الاعتماد');
      setActiveTab('approval');
    }
  };
  const handleSkipMessage = (id: string) => guard(() => api.patchMessage(id, { status: 'rejected' }), 'تم رفض الرسالة');
  const handleSaveEditedMessage = (id: string, text: string) => guard(() => api.patchMessage(id, { message: text }), 'تم حفظ التعديل');

  const handleTriggerWorkflow = (id: string) => {
    if (id === 'find_problems') return setIsNewRadarOpen(true);
    if (id === 'write_followup') return void run('write_followup', {}, 'بدأ توليد المتابعات');
    showToast('هذا المسار يُشغَّل من صفحة المشكلة أو العميل المعني');
  };

  const handleStartScan = async (keyword: string, sector: string, sources: string[]) => {
    const s = settingsMap(data);
    const keywords = keyword ? [keyword] : Array.isArray(s.keywords) ? s.keywords : [];
    return run(
      'find_problems',
      { keywords, sector, sources, market: marketFilter === 'all' ? undefined : marketFilter, markets: s.markets },
      'انطلق الرادار — النتائج ستظهر تلقائياً',
    );
  };

  const selectedProblem = problems.find((p) => p.id === selectedProblemId) || null;
  const selectedWorkflow: N8nWorkflow | null = workflows.find((w) => w.id === selectedWorkflowId) || null;
  const runningJobs = data.jobs.filter((j) => j.status === 'running').length;

  const overview = (
    <>
      <KpiCards stats={stats} onFilterApproval={() => setActiveTab('approval')} />
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
        <div className="xl:col-span-12">
          <SalesFunnel stages={funnel} />
        </div>
        <div className="xl:col-span-12">
          <TopProblemsTable
            problems={filteredProblems}
            onBuildSolution={(p) => setSelectedProblemId(p.id)}
            activeSector={activeSector}
            setActiveSector={setActiveSector}
          />
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-7">
          <PendingMessagesCard
            messages={pending}
            onSendMessage={handleSendMessage}
            onEditMessage={(m) => setEditingMessage(m)}
            onSkipMessage={handleSkipMessage}
          />
        </div>
        <div className="lg:col-span-5">
          <N8nWorkflowsCard workflows={workflows} onTriggerWorkflow={handleTriggerWorkflow} onOpenLogs={(w) => setSelectedWorkflowId(w.id)} />
        </div>
      </div>
    </>
  );

  const page = {
    overview,
    radar: <RadarPage ctx={ctx} onNewRadar={() => setIsNewRadarOpen(true)} />,
    solutions: <SolutionsPage ctx={ctx} />,
    leads: <LeadsPage ctx={ctx} />,
    approval: <ApprovalPage ctx={ctx} />,
    demos: <DemosPage ctx={ctx} />,
    analytics: <AnalyticsPage ctx={ctx} />,
    workflows: <WorkflowsPage ctx={ctx} onTrigger={handleTriggerWorkflow} onOpenLogs={(w) => setSelectedWorkflowId(w.id)} />,
    settings: <SettingsPage ctx={ctx} />,
  }[activeTab];

  return (
    <div dir="rtl" className="min-h-screen bg-[#f0f2f5] text-slate-800 font-['Cairo',sans-serif] flex flex-row overflow-x-hidden">
      {toastMessage && (
        <div className="fixed bottom-6 left-6 z-[60] bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 border border-slate-700 max-w-md">
          <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold">{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-white mr-2">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <Sidebar
        activeTab={activeTab}
        setActiveTab={(t) => {
          setActiveTab(t);
          setMobileMenuOpen(false);
        }}
        pendingCount={stats.pendingMessages}
        runningJobs={runningJobs}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      <main className="flex-1 flex flex-col min-w-0 min-h-screen overflow-y-auto">
        <Header
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          marketFilter={marketFilter}
          setMarketFilter={setMarketFilter}
          onOpenNewRadar={() => setIsNewRadarOpen(true)}
          isDark={false}
          toggleDark={() => {}}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
        />
        {error && <div className="mx-6 mt-4 px-4 py-2 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 font-semibold">انقطع التحديث التلقائي: {error}</div>}
        <div className="p-6 md:p-8 space-y-6 max-w-[1700px] w-full mx-auto pb-16">{page}</div>
      </main>

      <SolutionModal
        problem={selectedProblem}
        solution={data.solutions.find((s) => s.problem_id === selectedProblemId)}
        leads={data.leads.filter((l) => l.problem_id === selectedProblemId)}
        jobs={data.jobs}
        onClose={() => setSelectedProblemId(null)}
        onBuildSolution={(id) => run('build_solution', { problem_id: id }, 'بدأ بناء الحل')}
        onFindLeads={(id) => run('find_leads', { problem_id: id }, 'بدأ البحث عن عملاء')}
        onWriteMessage={(id) => run('write_message', { lead_id: id }, 'بدأت كتابة الرسالة')}
      />
      <EditMessageModal message={editingMessage} onClose={() => setEditingMessage(null)} onSave={handleSaveEditedMessage} />
      <NewRadarModal isOpen={isNewRadarOpen} onClose={() => setIsNewRadarOpen(false)} onStartScan={handleStartScan} />
      <WorkflowLogsModal workflow={selectedWorkflow} onClose={() => setSelectedWorkflowId(null)} />
    </div>
  );
}
