import React from 'react';
import { Loader2 } from 'lucide-react';

export const Panel: React.FC<{ className?: string; children: React.ReactNode }> = ({ className = '', children }) => (
  <div className={`bg-white rounded-3xl p-6 border border-slate-200/70 shadow-sm ${className}`}>{children}</div>
);

export const PageHead: React.FC<{ title: string; subtitle?: string; actions?: React.ReactNode }> = ({
  title,
  subtitle,
  actions,
}) => (
  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
    <div>
      <h2 className="text-xl font-extrabold text-slate-900">{title}</h2>
      {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
    </div>
    {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
  </div>
);

const TONES: Record<string, string> = {
  green: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  amber: 'bg-amber-50 text-amber-700 border-amber-100',
  red: 'bg-rose-50 text-rose-700 border-rose-100',
  blue: 'bg-sky-50 text-sky-700 border-sky-100',
  slate: 'bg-slate-100 text-slate-600 border-slate-200',
  violet: 'bg-violet-50 text-violet-700 border-violet-100',
};
export const Pill: React.FC<{ tone?: keyof typeof TONES; children: React.ReactNode }> = ({ tone = 'slate', children }) => (
  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border whitespace-nowrap ${TONES[tone]}`}>
    {children}
  </span>
);

export const Btn: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost' | 'danger' | 'dark'; busy?: boolean }
> = ({ variant = 'ghost', busy, children, className = '', disabled, ...rest }) => {
  const v = {
    primary: 'bg-emerald-500 hover:bg-emerald-600 text-slate-950',
    dark: 'bg-slate-900 hover:bg-slate-800 text-white',
    ghost: 'bg-slate-100 hover:bg-slate-200 text-slate-700',
    danger: 'bg-rose-50 hover:bg-rose-100 text-rose-700',
  }[variant];
  return (
    <button
      {...rest}
      disabled={disabled || busy}
      className={`px-3.5 py-2 rounded-xl text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${v} ${className}`}
    >
      {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
      {children}
    </button>
  );
};

export const Empty: React.FC<{ text: string }> = ({ text }) => (
  <div className="py-14 text-center text-sm text-slate-400">{text}</div>
);

export const scoreTone = (n: number): 'green' | 'amber' | 'slate' => (n >= 80 ? 'green' : n >= 60 ? 'amber' : 'slate');

export const inputCls =
  'w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:bg-white focus:border-emerald-400 outline-none';

export const copyText = async (t: string) => {
  try {
    await navigator.clipboard.writeText(t);
    return true;
  } catch {
    return false;
  }
};
