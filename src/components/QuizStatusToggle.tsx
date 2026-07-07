'use client';

import { useEffect, useState } from 'react';
import { useToast } from '@/components/admin';
import { PlayIcon, StopIcon } from '@/components/icons';
import { t } from '@/lib/strings';

export default function QuizStatusToggle() {
  const [started, setStarted] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const { show, node } = useToast();

  useEffect(() => {
    fetch('/api/admin/quiz-status')
      .then((r) => r.json())
      .then((d) => setStarted(Boolean(d.started)))
      .catch(() => {});
  }, []);

  const toggle = async () => {
    if (started === null || busy) return;
    const next = !started;
    setBusy(true);
    try {
      const res = await fetch('/api/admin/quiz-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ started: next })
      });
      if (res.ok) {
        setStarted(next);
        show(next ? t('admin.quizStatus.startedMsg') : t('admin.quizStatus.stoppedMsg'));
      } else {
        show(t('common.genericError'), 'error');
      }
    } catch {
      show(t('common.genericError'), 'error');
    } finally {
      setBusy(false);
    }
  };

  const on = started === true;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      {node}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span
            className={`relative flex h-3 w-3 ${started === null ? 'opacity-0' : ''}`}
            aria-hidden
          >
            {on ? (
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-400 opacity-75" />
            ) : null}
            <span
              className={`relative inline-flex h-3 w-3 rounded-full ${
                on ? 'bg-brand-500' : 'bg-slate-300'
              }`}
            />
          </span>
          <div>
            <p className="font-semibold text-slate-900">{t('admin.quizStatus.title')}</p>
            <p className="text-sm text-slate-500">
              {started === null
                ? t('common.loading')
                : on
                  ? `${t('admin.quizStatus.started')} · ${t('admin.quizStatus.startedHint')}`
                  : `${t('admin.quizStatus.stopped')} · ${t('admin.quizStatus.stoppedHint')}`}
            </p>
          </div>
        </div>

        <button
          onClick={toggle}
          disabled={started === null || busy}
          className={`inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold text-white shadow-md transition disabled:opacity-50 sm:w-auto ${
            on
              ? 'bg-red-600 shadow-red-900/20 hover:bg-red-700'
              : 'bg-brand-gradient-anim shadow-emerald-900/20 hover:brightness-110'
          }`}
        >
          {on ? <StopIcon className="h-4 w-4" /> : <PlayIcon className="h-4 w-4" />}
          {on ? t('admin.quizStatus.stop') : t('admin.quizStatus.start')}
        </button>
      </div>
    </div>
  );
}
