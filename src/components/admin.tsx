'use client';

import { useCallback, useRef, useState, type ReactNode } from 'react';

type Toast = { msg: string; kind: 'success' | 'error' };

/** Lightweight toast: a `show(msg, kind)` fn and a `node` to render once. */
export function useToast() {
  const [toast, setToast] = useState<Toast | null>(null);
  const timer = useRef<number | null>(null);

  const show = useCallback((msg: string, kind: 'success' | 'error' = 'success') => {
    if (timer.current) window.clearTimeout(timer.current);
    setToast({ msg, kind });
    timer.current = window.setTimeout(() => setToast(null), 3200);
  }, []);

  const node = (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-4">
      {toast ? (
        <div
          role="status"
          className={`animate-fade-in-up pointer-events-auto rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-lg ${
            toast.kind === 'success' ? 'bg-brand-700' : 'bg-red-600'
          }`}
        >
          {toast.msg}
        </div>
      ) : null}
    </div>
  );

  return { show, node };
}

export function PageHeading({
  title,
  description,
  action
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
        {description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function Hint({ children }: { children: ReactNode }) {
  return <p className="mt-1 text-xs leading-relaxed text-slate-500">{children}</p>;
}

export function Switch({
  checked,
  onChange,
  label
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition ${
        checked ? 'bg-brand-600' : 'bg-slate-300'
      }`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
          checked ? 'translate-x-[22px]' : 'translate-x-0.5'
        }`}
      />
    </button>
  );
}

export function StatCard({
  label,
  value,
  accent = false
}: {
  label: string;
  value: string | number;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-5 shadow-sm ${
        accent
          ? 'border-transparent bg-brand-gradient-anim text-white shadow-emerald-900/20'
          : 'border-slate-200 bg-white'
      }`}
    >
      <p className={`text-sm ${accent ? 'text-white/80' : 'text-slate-500'}`}>{label}</p>
      <p className={`mt-1 text-3xl font-bold ${accent ? 'text-white' : 'text-brand-800'}`}>
        {value}
      </p>
    </div>
  );
}
