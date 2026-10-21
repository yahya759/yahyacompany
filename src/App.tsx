/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
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

import {
  initialStats,
  funnelStages,
  initialProblems,
  initialPendingMessages,
  initialWorkflows,
} from './data/mockData';
import {
  Problem,
  ProblemSector,
  MarketRegion,
  OutreachMessage,
  N8nWorkflow,
  DashboardStats,
} from './types/dashboard';
import { CheckCircle2, Sparkles, X, Info } from 'lucide-react';

export default function App() {
  // Navigation & View State
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [isDark, setIsDark] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [marketFilter, setMarketFilter] = useState<MarketRegion>('all');
  const [activeSector, setActiveSector] = useState<ProblemSector>('all');

  // Core Data States
  const [stats, setStats] = useState<DashboardStats>(initialStats);
  const [problems, setProblems] = useState<Problem[]>(initialProblems);
  const [pendingMessages, setPendingMessages] = useState<OutreachMessage[]>(initialPendingMessages);
  const [workflows, setWorkflows] = useState<N8nWorkflow[]>(initialWorkflows);

  // Modal States
  const [selectedProblemForSolution, setSelectedProblemForSolution] = useState<Problem | null>(null);
  const [editingMessage, setEditingMessage] = useState<OutreachMessage | null>(null);
  const [isNewRadarOpen, setIsNewRadarOpen] = useState<boolean>(false);
  const [selectedWorkflowForLogs, setSelectedWorkflowForLogs] = useState<N8nWorkflow | null>(null);

  // Toast notification feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3800);
  };

  // Filtered problems based on search query, sector, and market
  const filteredProblems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return problems.filter((item) => {
      const matchesSearch =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.summary.toLowerCase().includes(q) ||
        item.sector.toLowerCase().includes(q);

      const matchesSector =
        activeSector === 'all' || item.sectorKey === activeSector;

      const matchesMarket =
        marketFilter === 'all' || item.market === marketFilter;

      return matchesSearch && matchesSector && matchesMarket;
    });
  }, [problems, searchQuery, activeSector, marketFilter]);

  // Handlers for Pending Messages (Send, Edit, Skip)
  const handleSendMessage = (id: string) => {
    const target = pendingMessages.find((m) => m.id === id);
    if (!target) return;

    setPendingMessages((prev) => prev.filter((m) => m.id !== id));
    setStats((prev) => ({
      ...prev,
      pendingMessages: Math.max(0, prev.pendingMessages - 1),
      demosSent: prev.demosSent + 1,
    }));

    showToast(`تم إرسال العرض التوضيحي إلى ${target.leadName} (${target.companyName}) عبر ${target.channelLabel} بنجاح 🚀`);
  };

  const handleSkipMessage = (id: string) => {
    const target = pendingMessages.find((m) => m.id === id);
    setPendingMessages((prev) => prev.filter((m) => m.id !== id));
    setStats((prev) => ({
      ...prev,
      pendingMessages: Math.max(0, prev.pendingMessages - 1),
    }));

    if (target) {
      showToast(`تم تخطي الرسالة الموجهة إلى ${target.companyName}`);
    }
  };

  const handleSaveEditedMessage = (id: string, newText: string) => {
    setPendingMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, aiMessagePreview: newText } : m))
    );
    showToast('تم حفظ التعديلات على نص العرض بنجاح');
  };

  // Trigger n8n Workflow simulation
  const handleTriggerWorkflow = (id: string) => {
    setWorkflows((prev) =>
      prev.map((wf) => {
        if (wf.id === id) {
          return {
            ...wf,
            status: 'running',
            lastRun: 'الآن (جارٍ الرصد)',
            executionsCount: wf.executionsCount + 1,
          };
        }
        return wf;
      })
    );

    setTimeout(() => {
      setWorkflows((prev) =>
        prev.map((wf) => {
          if (wf.id === id) {
            return {
              ...wf,
              status: 'active',
              lastRun: 'الآن (ناجح)',
              logs: [
                {
                  time: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                  event: `تم تنفيذ مسار ${wf.nameEn} وتحديث البيانات بنجاح`,
                  status: 'success',
                },
                ...wf.logs,
              ],
            };
          }
          return wf;
        })
      );
      showToast(`اكتمل تشغيل مسار العمل بنجاح وجرى تحديث البيانات.`);
    }, 2000);
  };

  // Launch campaign from Solution Studio modal
  const handleLaunchSolutionCampaign = (problem: Problem) => {
    setStats((prev) => ({
      ...prev,
      newLeads: prev.newLeads + problem.leadsCount,
      pendingMessages: prev.pendingMessages + 3,
    }));

    // Add a new pending message queue item
    const newQueueItem: OutreachMessage = {
      id: `msg-${Date.now()}`,
      leadName: `م. عبد العزيز الراجحي`,
      leadRole: 'مدير العمليات والشراكات',
      companyName: `شركة الحلول الرقمية في ${problem.sector}`,
      city: 'الرياض',
      country: 'المملكة العربية السعودية',
      channel: 'whatsapp',
      channelLabel: 'واتساب أعمال',
      detectedPainPoint: problem.title,
      sourceSnippet: problem.summary,
      aiMessagePreview: `السلام عليكم، رصدنا في شركتكم التحديات المرتبطة بـ "${problem.title}". جهزنا لكم هذا العرض التوضيحي السريع لمعالجة المشكلة تلقائياً: https://p2c.io/demo/${problem.id} - نسعد باطلاعكم.`,
      demoLink: `https://p2c.io/demo/${problem.id}`,
      demoTitle: `عرض تفاعلي لـ ${problem.title}`,
      matchScore: 96,
      scheduledTime: 'اليوم، خلال ساعة',
    };

    setPendingMessages((prev) => [newQueueItem, ...prev]);
    showToast(`تم إطلاق حملة التواصل لـ "${problem.title}" وإضافة 3 مسودات جديدة للاعتماد!`);
  };

  // Add new radar discovery scan
  const handleStartScan = (keyword: string, sector: string, sources: string[]) => {
    const newProb: Problem = {
      id: `prob-${Date.now()}`,
      title: `رصد شكاوى متزايدة: ${keyword}`,
      summary: `كشف المسار عن أكثر من 18 منشور ومراجعة حديثة في قطاع ${sector} تعاني من ${keyword}.`,
      sector: sector === 'real-estate' ? 'العقارات' : sector === 'healthcare' ? 'الرعاية الصحية' : 'الخدمات',
      sectorKey: sector as ProblemSector,
      source: (sources[0] as Problem['source']) || 'x',
      sourceName: sources[0] === 'reddit' ? 'Reddit' : sources[0] === 'google-maps' ? 'Google Maps' : 'منصة X',
      score: 91,
      market: marketFilter,
      leadsCount: 34,
      detectedDate: 'الآن',
      suggestedSolution: `أداة ذكاء اصطناعي وأتمتة مسار عمل تعالج ${keyword} بشكل فوري عبر واتساب وبوابات الدفع`,
      demoType: 'نموذج محاكاة حي مخصص',
    };

    setProblems((prev) => [newProb, ...prev]);
    setStats((prev) => ({
      ...prev,
      problemsFound: prev.problemsFound + 1,
      newLeads: prev.newLeads + 34,
    }));

    showToast(`تم اكتشاف مشكلة جديدة وإضافتها إلى قائمة المشاكل المستهدفة!`);
  };

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-[#f0f2f5] text-slate-800 font-['Cairo',sans-serif] flex flex-row overflow-x-hidden"
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-6 z-50 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 border border-slate-700 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold">{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white mr-2"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Right Sidebar (Dark navy) docked on the RIGHT edge as required */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          setMobileMenuOpen(false);
        }}
        pendingCount={stats.pendingMessages}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      {/* Main Content Area (to the left of Sidebar) */}
      <main className="flex-1 flex flex-col min-w-0 min-h-screen overflow-y-auto">
        {/* Top bar header */}
        <Header
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          marketFilter={marketFilter}
          setMarketFilter={setMarketFilter}
          onOpenNewRadar={() => setIsNewRadarOpen(true)}
          isDark={isDark}
          toggleDark={() => setIsDark(!isDark)}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
        />

        {/* Dashboard Content Container */}
        <div className="p-6 md:p-8 space-y-6 max-w-[1700px] w-full mx-auto pb-16">
          {/* Row of 4 KPI cards */}
          <KpiCards
            stats={stats}
            onFilterApproval={() => {
              const el = document.getElementById('pending-messages-section');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
          />

          {/* Center Section: Funnel Chart and Top Problems Table */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
            {/* Sales Funnel Chart (Horizontal Pipeline) */}
            <div className="xl:col-span-12">
              <SalesFunnel stages={funnelStages} />
            </div>

            {/* Top Problems Table */}
            <div className="xl:col-span-12">
              <TopProblemsTable
                problems={filteredProblems}
                onBuildSolution={(prob) => setSelectedProblemForSolution(prob)}
                activeSector={activeSector}
                setActiveSector={setActiveSector}
              />
            </div>
          </div>

          {/* Bottom Section: Pending Messages & n8n Workflows Status */}
          <div
            id="pending-messages-section"
            className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch"
          >
            {/* Bottom-left: Pending Messages (7 columns) */}
            <div className="lg:col-span-7">
              <PendingMessagesCard
                messages={pendingMessages}
                onSendMessage={handleSendMessage}
                onEditMessage={(msg) => setEditingMessage(msg)}
                onSkipMessage={handleSkipMessage}
              />
            </div>

            {/* Bottom-right: n8n Workflows Status (5 columns) */}
            <div className="lg:col-span-5">
              <N8nWorkflowsCard
                workflows={workflows}
                onTriggerWorkflow={handleTriggerWorkflow}
                onOpenLogs={(wf) => setSelectedWorkflowForLogs(wf)}
              />
            </div>
          </div>
        </div>
      </main>

      {/* Interactive Modals */}
      <SolutionModal
        problem={selectedProblemForSolution}
        onClose={() => setSelectedProblemForSolution(null)}
        onLaunchCampaign={handleLaunchSolutionCampaign}
      />

      <EditMessageModal
        message={editingMessage}
        onClose={() => setEditingMessage(null)}
        onSave={handleSaveEditedMessage}
      />

      <NewRadarModal
        isOpen={isNewRadarOpen}
        onClose={() => setIsNewRadarOpen(false)}
        onStartScan={handleStartScan}
      />

      <WorkflowLogsModal
        workflow={selectedWorkflowForLogs}
        onClose={() => setSelectedWorkflowForLogs(null)}
      />
    </div>
  );
}
