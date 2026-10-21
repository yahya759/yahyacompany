import React from 'react';

/** Without this, any render error unmounts React and leaves a blank white page. */
export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { err: Error | null }> {
  state: { err: Error | null } = { err: null };

  static getDerivedStateFromError(err: Error) {
    return { err };
  }

  render() {
    const { err } = this.state;
    if (!err) return this.props.children;
    return (
      <div dir="rtl" className="min-h-screen flex items-center justify-center bg-[#0a1128] p-6 font-['Cairo',sans-serif]">
        <div className="bg-white rounded-3xl p-8 w-full max-w-md text-center space-y-4 shadow-2xl">
          <p className="text-sm font-bold text-rose-600">صار خطأ غير متوقع في الواجهة</p>
          <pre dir="ltr" className="text-[11px] text-slate-500 whitespace-pre-wrap text-left bg-slate-50 rounded-xl p-3">
            {String(err.message)}
          </pre>
          <button
            onClick={() => location.reload()}
            className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl px-5 py-2.5 text-sm font-bold"
          >
            إعادة التحميل
          </button>
        </div>
      </div>
    );
  }
}
