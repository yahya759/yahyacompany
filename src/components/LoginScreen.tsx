import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { api, setToken } from '../lib/api';
import { Btn, inputCls } from './ui';

export const LoginScreen: React.FC<{ onDone: () => void }> = ({ onDone }) => {
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr('');
    try {
      const { token } = await api.login(pw);
      setToken(token);
      onDone();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div dir="rtl" className="min-h-screen bg-[#0a1128] flex items-center justify-center p-4 font-['Cairo',sans-serif]">
      <form onSubmit={submit} className="bg-white rounded-3xl p-8 w-full max-w-sm space-y-5 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-sky-400 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-slate-950" />
          </div>
          <div>
            <p className="font-extrabold text-slate-900">Problem2Client</p>
            <p className="text-[11px] text-slate-500">لوحة التحكم</p>
          </div>
        </div>
        <input type="password" autoFocus className={inputCls} placeholder="كلمة المرور" value={pw} onChange={(e) => setPw(e.target.value)} />
        {err && <p className="text-xs text-rose-600 font-semibold">{err}</p>}
        <Btn type="submit" variant="primary" busy={busy} className="w-full !py-3" disabled={!pw}>
          دخول
        </Btn>
      </form>
    </div>
  );
};
