import React, { useState } from 'react';
import {
  Wand2,
  X,
  Sparkles,
  CheckCircle2,
  Building,
  Users,
  Send,
  ExternalLink,
  Laptop,
  Flame,
  ArrowRight,
} from 'lucide-react';
import { Problem } from '../types/dashboard';

interface SolutionModalProps {
  problem: Problem | null;
  onClose: () => void;
  onLaunchCampaign: (problem: Problem) => void;
}

export const SolutionModal: React.FC<SolutionModalProps> = ({
  problem,
  onClose,
  onLaunchCampaign,
}) => {
  if (!problem) return null;

  const [activeTab, setActiveTab] = useState<'architecture' | 'leads' | 'demo'>('architecture');
  const [isLaunching, setIsLaunching] = useState(false);

  const matchedLeads = [
    {
      name: 'مجموعة المشرق الطبية',
      contact: 'د. سامي العلي (مدير التشغيل)',
      city: 'الرياض',
      match: '98%',
      phone: '+966 50 *** 4120',
    },
    {
      name: 'مجمع واحة الصحة التخصصي',
      contact: 'أ. هناء القاسم (مديرة تجربة المريض)',
      city: 'جدة',
      match: '95%',
      phone: '+966 55 *** 8819',
    },
    {
      name: 'مركز كير أند مور لجراحة اليوم الواحد',
      contact: 'د. فيصل المنصور (المؤسس)',
      city: 'الدمام',
      match: '91%',
      phone: '+966 54 *** 3302',
    },
  ];

  const handleLaunch = () => {
    setIsLaunching(true);
    setTimeout(() => {
      setIsLaunching(false);
      onLaunchCampaign(problem);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center shadow-sm">
              <Wand2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                استوديو بناء الحل الذكي (Solution Studio)
              </h3>
              <p className="text-xs text-slate-500">
                تحويل مشكلة العمل المرصودة إلى منتج برمجي وعرض تجريبي مقنع
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Problem Banner */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span className="font-bold text-slate-700">المشكلة المستهدفة:</span>
              <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md font-bold">
                القطاع: {problem.sector}
              </span>
            </div>
            <h4 className="text-sm font-black text-slate-900 leading-snug">
              {problem.title}
            </h4>
            <p className="text-xs text-slate-600 mt-1.5">{problem.summary}</p>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <button
              onClick={() => setActiveTab('architecture')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'architecture'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              هيكلية الحل البرمجي المقترح
            </button>
            <button
              onClick={() => setActiveTab('leads')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'leads'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              العملاء المتطابقون ({problem.leadsCount} شركة)
            </button>
            <button
              onClick={() => setActiveTab('demo')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'demo'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              العرض التوضيحي (Interactive Demo)
            </button>
          </div>

          {/* Tab 1: Architecture */}
          {activeTab === 'architecture' && (
            <div className="space-y-4 text-xs animate-in fade-in duration-150">
              <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100">
                <span className="font-bold text-emerald-900 block mb-1 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  مواصفات الحل المولّد بالذكاء الاصطناعي:
                </span>
                <p className="text-emerald-950 font-medium leading-relaxed">
                  {problem.suggestedSolution}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[11px] font-bold text-slate-400 block mb-1">
                    قيمة التوفير المتوقعة للعميل
                  </span>
                  <span className="text-base font-extrabold text-slate-900 font-['Plus_Jakarta_Sans',sans-serif] tabular-nums">
                    35% - 40%
                  </span>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    تقليص ساعات المتابعة اليدوية وهدر المواعيد
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[11px] font-bold text-slate-400 block mb-1">
                    متوسط قيمة الاشتراك السنوي
                  </span>
                  <span className="text-base font-extrabold text-emerald-700 font-['Plus_Jakarta_Sans',sans-serif] tabular-nums">
                    $4,800 / سنوياً
                  </span>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    تسعير مناسب لشركات الفئة المتوسطة
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Matched Leads */}
          {activeTab === 'leads' && (
            <div className="space-y-2.5 animate-in fade-in duration-150">
              <p className="text-xs text-slate-500 mb-2">
                تم استخراج جهات اتصال مباشرة لصناع القرار المتأثرين بهذه المشكلة عبر خرائط Google وLinkedIn:
              </p>
              {matchedLeads.map((lead, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs"
                >
                  <div>
                    <h5 className="font-bold text-slate-900">{lead.name}</h5>
                    <p className="text-[11px] text-slate-500">{lead.contact} · {lead.city}</p>
                  </div>
                  <div className="text-left">
                    <span className="px-2 py-0.5 rounded-md font-bold text-emerald-700 bg-emerald-50 text-[11px] font-['Plus_Jakarta_Sans',sans-serif] tabular-nums">
                      تطابق {lead.match}
                    </span>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">{lead.phone}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Tab 3: Demo Preview */}
          {activeTab === 'demo' && (
            <div className="space-y-3 animate-in fade-in duration-150 text-xs">
              <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                    <Laptop className="w-4 h-4" />
                    نوع العرض التجريبي المصمم:
                  </span>
                  <span className="text-[11px] text-slate-400">جاهز للإرسال الفوري</span>
                </div>
                <h5 className="text-sm font-bold text-white">{problem.demoType}</h5>
                <p className="text-xs text-slate-300 leading-relaxed">
                  يتم إرسال رابط فريد لكل عميل محتمل يتضمن شعاره واسم شركته، مع إمكانية تجربة الحل بشكل تفاعلي خلال 60 ثانية قبل التحدث مع فريق المبيعات.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors"
          >
            إلغاء
          </button>

          <button
            onClick={handleLaunch}
            disabled={isLaunching}
            className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 flex items-center gap-2 transition-all cursor-pointer"
          >
            {isLaunching ? (
              <>
                <Sparkles className="w-4 h-4 animate-spin text-slate-950" />
                <span>جاري توليد مسارات التواصل...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>إطلاق حملة التواصل الآلية لهذا الحل</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
