import React, { useState } from 'react';
import { Edit3, X, Check, Sparkles, MessageSquare } from 'lucide-react';
import { OutreachMessage } from '../types/dashboard';

interface EditMessageModalProps {
  message: OutreachMessage | null;
  onClose: () => void;
  onSave: (id: string, newText: string) => void;
}

export const EditMessageModal: React.FC<EditMessageModalProps> = ({
  message,
  onClose,
  onSave,
}) => {
  if (!message) return null;

  const [text, setText] = useState(message.aiMessagePreview);

  const handleSave = () => {
    onSave(message.id, text);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-xl w-full overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <Edit3 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                تعديل رسالة التواصل قبل الإرسال
              </h3>
              <p className="text-[11px] text-slate-400">
                المرسل إليه: {message.leadName} ({message.companyName})
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

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
              <span>نص الرسالة المخصص:</span>
              <span className="text-[10px] text-slate-400 tabular-nums">
                {text.length} حرف
              </span>
            </label>
            <textarea
              rows={6}
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full p-3.5 rounded-2xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-xs leading-relaxed text-slate-800 outline-none transition-all resize-none"
            />
          </div>

          <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-100 text-[11px] text-emerald-800 flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>
              نصيحة: حافظ على اللهجة المهنية الهادئة واحرص على تضمين رابط العرض التجريبي القصير لزيادة معدل التفاعل بنسبة 40%.
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors"
          >
            إلغاء
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>حفظ واعتماد الصياغة</span>
          </button>
        </div>
      </div>
    </div>
  );
};
