import React, { useState } from 'react';
import {
  Send,
  Edit3,
  SkipForward,
  MessageSquare,
  Sparkles,
  Building2,
  MapPin,
  ExternalLink,
  CheckCircle2,
  Clock,
  PhoneCall,
  Share2,
} from 'lucide-react';
import { OutreachMessage } from '../types/dashboard';

interface PendingMessagesCardProps {
  messages: OutreachMessage[];
  onSendMessage: (id: string) => void;
  onEditMessage: (message: OutreachMessage) => void;
  onSkipMessage: (id: string) => void;
}

export const PendingMessagesCard: React.FC<PendingMessagesCardProps> = ({
  messages,
  onSendMessage,
  onEditMessage,
  onSkipMessage,
}) => {
  const currentMessage = messages[0];
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (currentMessage) {
      navigator.clipboard?.writeText(currentMessage.aiMessagePreview);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-200/70 shadow-sm flex flex-col justify-between h-full">
      {/* Header with queue status */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                الرسائل المعلقة بانتظار الاعتماد
              </h3>
              <p className="text-[11px] text-slate-400">
                مراجعة واعتماد عروض التواصل الموجهة قبل الإرسال التلقائي
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200/60 tabular-nums">
              {messages.length > 0 ? `${messages.length} رسائل متبقية` : 'مكتمل'}
            </span>
          </div>
        </div>

        {/* Content Area */}
        {!currentMessage ? (
          <div className="p-8 text-center rounded-2xl bg-slate-50 border border-slate-100 my-4">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center mb-3">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-800">
              رائع! تم اعتماد وإرسال جميع الرسائل لليوم 🎉
            </h4>
            <p className="text-xs text-slate-500 mt-1">
              سيقوم رادار n8n باستخراج عملاء ومسودات جديدة تلقائياً خلال الفحص القادم.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Lead Bio Card */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm text-slate-900">
                      {currentMessage.leadName}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-500">
                      ({currentMessage.leadRole})
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-600 mt-0.5">
                    <span className="font-medium text-emerald-800">{currentMessage.companyName}</span>
                    <span className="text-slate-300">·</span>
                    <span className="flex items-center gap-1 text-[11px] text-slate-500">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      {currentMessage.city}، {currentMessage.country}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-emerald-100 text-emerald-800">
                    {currentMessage.channelLabel}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 font-['Plus_Jakarta_Sans',sans-serif] tabular-nums">
                    تطابق {currentMessage.matchScore}%
                  </span>
                </div>
              </div>

              {/* Detected Pain Point */}
              <div className="mt-3 pt-3 border-t border-slate-200/60">
                <div className="text-[11px] font-bold text-slate-400 mb-1 flex items-center gap-1">
                  <span>نقطة الألم المكتشفة من المصدر:</span>
                </div>
                <p className="text-xs font-semibold text-slate-700 bg-amber-50/70 p-2.5 rounded-xl border border-amber-200/50">
                  ⚠️ {currentMessage.detectedPainPoint}
                </p>
              </div>
            </div>

            {/* AI-written Message Preview */}
            <div className="p-4 rounded-2xl bg-white border border-emerald-500/20 shadow-xs relative">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                  معاينة الرسالة المكتوبة بالذكاء الاصطناعي (Gemini 2.5 Flash)
                </span>
                <button
                  onClick={handleCopy}
                  className="text-[11px] text-slate-500 hover:text-emerald-600 font-bold flex items-center gap-1"
                >
                  {copied ? 'تم النسخ ✓' : 'نسخ النص'}
                </button>
              </div>

              <div className="text-xs leading-relaxed text-slate-800 bg-slate-50/80 p-3.5 rounded-xl border border-slate-100 font-medium">
                {currentMessage.aiMessagePreview}
              </div>

              {/* Demo URL preview */}
              {currentMessage.demoLink && (<div className="mt-2.5 flex items-center justify-between text-[11px] bg-emerald-50/60 px-3 py-1.5 rounded-lg border border-emerald-100">
                <div className="flex items-center gap-1.5 text-emerald-800 font-semibold truncate">
                  <span>موقع النشاط:</span>
                  <span className="font-['Plus_Jakarta_Sans',sans-serif] underline truncate">
                    {currentMessage.demoLink}
                  </span>
                </div>
                <a
                  href={currentMessage.demoLink}
                  target="_blank"
                  rel="noreferrer"
                  className="text-emerald-700 hover:text-emerald-900 font-bold shrink-0 flex items-center gap-1"
                >
                  <ExternalLink className="w-3 h-3" />
                  معاينة
                </a>
              </div>)}
            </div>
          </div>
        )}
      </div>

      {/* 3 Action Buttons: Send, Edit, Skip */}
      {currentMessage && (
        <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {/* Skip Button */}
            <button
              onClick={() => onSkipMessage(currentMessage.id)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 active:scale-95 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <SkipForward className="w-3.5 h-3.5 text-slate-400" />
              <span>تخطي</span>
            </button>

            {/* Edit Button */}
            <button
              onClick={() => onEditMessage(currentMessage)}
              className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300 active:scale-95 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5 text-sky-600" />
              <span>تعديل الصياغة</span>
            </button>
          </div>

          {/* Send Button */}
          <button
            onClick={() => onSendMessage(currentMessage.id)}
            className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/25 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>إرسال الآن</span>
          </button>
        </div>
      )}
    </div>
  );
};
