import React, { useState } from 'react';
import { Radar, X, Sparkles, MapPin, Search, Check, Globe } from 'lucide-react';

interface NewRadarModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartScan: (keyword: string, sector: string, sources: string[]) => Promise<boolean | void> | void;
}

export const NewRadarModal: React.FC<NewRadarModalProps> = ({
  isOpen,
  onClose,
  onStartScan,
}) => {
  const [keyword, setKeyword] = useState('');
  const [sector, setSector] = useState('real-estate');
  const [selectedSources, setSelectedSources] = useState<string[]>(['reddit', 'tavily', 'google-maps']);
  const [isScanning, setIsScanning] = useState(false);

  const toggleSource = (src: string) => {
    setSelectedSources((prev) =>
      prev.includes(src) ? prev.filter((s) => s !== src) : [...prev, src]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsScanning(true);
    try {
      const ok = await onStartScan(keyword.trim(), sector, selectedSources);
      if (ok !== false) onClose();
    } finally {
      setIsScanning(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <Radar className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                إطلاق رادار استكشاف مشاكل جديد
              </h3>
              <p className="text-[11px] text-slate-400">
                مسح المنصات الاجتماعية والخرائط لرصد شكاوى الأعمال
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">
              الكلمات المفتاحية أو المشكلة المستهدفة:
            </label>
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="مثال: تأخر الرد، إلغاء الحجز، مشاكل الشحن، فواتير المقاولات..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">
              القطاع المستهدف:
            </label>
            <select
              value={sector}
              onChange={(e) => setSector(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:bg-white focus:border-emerald-500 outline-none"
            >
              <option value="real-estate">العقارات وإدارة الأملاك</option>
              <option value="healthcare">الرعاية الصحية والمجمعات الطبية</option>
              <option value="ecommerce">التجارة الإلكترونية واللوجستيات</option>
              <option value="fnb">المطاعم والضيافة والمطابخ السحابية</option>
              <option value="construction">المقاولات والإنشاءات</option>
              <option value="services">الخدمات المهنية والتقنية</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">
              قنوات ومصادر الرصد:
            </label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                { id: 'reddit', label: 'Reddit (مجتمعات الأعمال)' },
                { id: 'tavily', label: 'Tavily (بحث الويب)' },
                { id: 'google-maps', label: 'خرائط Google (مراجعات الشركات)' },
                { id: 'facebook', label: 'مجموعات فيسبوك (Apify)' },
              ].map((src) => (
                <button
                  type="button"
                  key={src.id}
                  onClick={() => toggleSource(src.id)}
                  className={`p-2.5 rounded-xl border text-right font-medium transition-all flex items-center justify-between ${
                    selectedSources.includes(src.id)
                      ? 'border-emerald-400 bg-emerald-50 text-emerald-900 font-bold'
                      : 'border-slate-200 bg-slate-50 text-slate-600'
                  }`}
                >
                  <span>{src.label}</span>
                  {selectedSources.includes(src.id) && (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 text-[11px] text-slate-500 flex items-center gap-2">
            <Globe className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              يُرسَل الأمر إلى n8n ويظهر التقدّم في «مسارات العمل»، والنتائج تنزل في رادار المشاكل وفرز العملاء المحتملين تلقائياً.
            </span>
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isScanning || selectedSources.length === 0}
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
            >
              {isScanning ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin text-slate-950" />
                  <span>جاري المسح الذكي...</span>
                </>
              ) : (
                <>
                  <Radar className="w-4 h-4" />
                  <span>بدء المسح الآن</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
