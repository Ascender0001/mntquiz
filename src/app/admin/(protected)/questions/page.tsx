'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, TextField } from '@/components/ui';
import { Hint, PageHeading, Switch, useToast } from '@/components/admin';
import { CheckIcon, PlusIcon, XIcon } from '@/components/icons';
import { t } from '@/lib/strings';

type Option = { id?: string; text: string; isCorrect: boolean };
type Question = {
  id: string;
  text: string;
  category: string | null;
  active: boolean;
  order: number;
  options: Option[];
};

type Draft = {
  id?: string;
  text: string;
  category: string;
  active: boolean;
  order: number;
  options: Option[];
};

const emptyDraft = (): Draft => ({
  text: '',
  category: '',
  active: true,
  order: 0,
  options: [
    { text: '', isCorrect: true },
    { text: '', isCorrect: false }
  ]
});

type StatusFilter = 'all' | 'active' | 'inactive';

export default function QuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { show, node } = useToast();

  const load = useCallback(() => {
    const params = new URLSearchParams();
    if (search.trim()) params.set('search', search.trim());
    if (status !== 'all') params.set('status', status);
    setLoading(true);
    fetch(`/api/admin/questions?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => setQuestions(data.questions ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [search, status]);

  useEffect(() => {
    load();
  }, [load]);

  const activeCount = useMemo(() => questions.filter((q) => q.active).length, [questions]);

  const startEdit = (q: Question) =>
    setDraft({
      id: q.id,
      text: q.text,
      category: q.category ?? '',
      active: q.active,
      order: q.order,
      options: q.options.map((o) => ({ text: o.text, isCorrect: o.isCorrect }))
    });

  const remove = async (id: string) => {
    if (!confirm(t('admin.questions.confirmDelete'))) return;
    const res = await fetch(`/api/admin/questions/${id}`, { method: 'DELETE' });
    if (res.ok) {
      show(t('admin.questions.deleted'));
      load();
    } else {
      show(t('common.genericError'), 'error');
    }
  };

  const toggleActive = async (q: Question, next: boolean) => {
    // Optimistic update, then persist the full question payload.
    setQuestions((qs) => qs.map((x) => (x.id === q.id ? { ...x, active: next } : x)));
    const res = await fetch(`/api/admin/questions/${q.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: q.text,
        category: q.category,
        active: next,
        order: q.order,
        options: q.options.map((o) => ({ text: o.text, isCorrect: o.isCorrect }))
      })
    });
    if (res.ok) {
      show(next ? t('admin.questions.activated') : t('admin.questions.deactivated'));
      if (status !== 'all') load();
    } else {
      show(t('common.genericError'), 'error');
      load();
    }
  };

  const save = async () => {
    if (!draft) return;
    const cleanOptions = draft.options
      .map((o) => ({ text: o.text.trim(), isCorrect: o.isCorrect }))
      .filter((o) => o.text.length > 0);

    if (cleanOptions.length < 2) {
      setError(t('admin.questions.needTwoOptions'));
      return;
    }
    if (!cleanOptions.some((o) => o.isCorrect)) {
      setError(t('admin.questions.needCorrect'));
      return;
    }
    setError(null);

    const payload = {
      text: draft.text.trim(),
      category: draft.category.trim() || null,
      active: draft.active,
      order: Number(draft.order) || 0,
      options: cleanOptions
    };

    const isEdit = Boolean(draft.id);
    const res = await fetch(
      isEdit ? `/api/admin/questions/${draft.id}` : '/api/admin/questions',
      {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }
    );

    if (res.ok) {
      setDraft(null);
      show(isEdit ? t('admin.questions.saved') : t('admin.questions.created'));
      load();
    } else {
      setError(t('common.genericError'));
    }
  };

  return (
    <div>
      {node}
      <PageHeading
        title={t('admin.questions.title')}
        description={t('admin.questions.description')}
        action={
          <button
            onClick={() => setDraft(emptyDraft())}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-gradient-anim px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-emerald-900/20 transition hover:brightness-110"
          >
            <PlusIcon className="h-4 w-4" /> {t('admin.questions.new')}
          </button>
        }
      />

      <div className="space-y-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('admin.questions.searchPlaceholder')}
          className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-brand-500 sm:max-w-xs"
        />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex overflow-hidden rounded-xl border border-slate-300">
            {(['all', 'active', 'inactive'] as StatusFilter[]).map((f) => (
              <button
                key={f}
                onClick={() => setStatus(f)}
                className={`px-4 py-2.5 text-sm font-medium transition ${
                  status === f ? 'bg-brand-700 text-white' : 'bg-white text-slate-600'
                }`}
              >
                {t(`admin.questions.${f}`)}
              </button>
            ))}
          </div>
          <span className="text-sm text-slate-500">
            {t('admin.questions.count', { active: activeCount, total: questions.length })}
          </span>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {loading ? (
          <p className="text-slate-400">{t('common.loading')}</p>
        ) : questions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 p-10 text-center">
            <p className="text-slate-500">{t('admin.questions.empty')}</p>
            <p className="mt-1 text-sm text-slate-400">{t('admin.questions.emptyHint')}</p>
            <div className="mx-auto mt-4 w-44">
              <Button onClick={() => setDraft(emptyDraft())}>{t('admin.questions.new')}</Button>
            </div>
          </div>
        ) : (
          questions.map((q) => (
            <div
              key={q.id}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900">{q.text}</p>
                  {q.category ? (
                    <span className="mt-1 inline-block rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                      {q.category}
                    </span>
                  ) : null}
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <Switch
                    checked={q.active}
                    onChange={(v) => toggleActive(q, v)}
                    label={t('admin.questions.activeLabel')}
                  />
                </div>
              </div>

              <ul className="mt-3 space-y-1 text-sm">
                {q.options.map((o, i) => (
                  <li
                    key={i}
                    className={`flex items-center gap-2 ${
                      o.isCorrect ? 'font-medium text-brand-700' : 'text-slate-600'
                    }`}
                  >
                    <span
                      className={`flex h-4 w-4 items-center justify-center rounded-full ${
                        o.isCorrect ? 'bg-brand-100 text-brand-700' : 'bg-slate-100 text-slate-300'
                      }`}
                    >
                      {o.isCorrect ? <CheckIcon className="h-2.5 w-2.5" strokeWidth={3} /> : null}
                    </span>
                    {o.text}
                  </li>
                ))}
              </ul>

              <div className="mt-3 flex gap-4 border-t border-slate-100 pt-3">
                <button
                  onClick={() => startEdit(q)}
                  className="text-sm font-medium text-brand-700 hover:underline"
                >
                  {t('common.edit')}
                </button>
                <button
                  onClick={() => remove(q.id)}
                  className="text-sm font-medium text-red-600 hover:underline"
                >
                  {t('common.delete')}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {draft ? (
        <QuestionEditor
          draft={draft}
          setDraft={setDraft}
          onSave={save}
          onCancel={() => {
            setDraft(null);
            setError(null);
          }}
          error={error}
        />
      ) : null}
    </div>
  );
}

function QuestionEditor({
  draft,
  setDraft,
  onSave,
  onCancel,
  error
}: {
  draft: Draft;
  setDraft: (d: Draft) => void;
  onSave: () => void;
  onCancel: () => void;
  error: string | null;
}) {
  const setOption = (idx: number, patch: Partial<Option>) =>
    setDraft({
      ...draft,
      options: draft.options.map((o, i) => (i === idx ? { ...o, ...patch } : o))
    });

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/50 p-3 sm:p-4">
      <div className="animate-fade-in-up my-4 w-full max-w-lg rounded-2xl bg-white p-5 shadow-xl sm:my-8 sm:p-6">
        <h2 className="text-lg font-bold text-slate-900">
          {draft.id ? t('common.edit') : t('admin.questions.new')}
        </h2>
        <div className="mt-4 space-y-4">
          <TextField
            label={t('admin.questions.questionText')}
            value={draft.text}
            onChange={(e) => setDraft({ ...draft, text: e.target.value })}
            autoFocus
          />
          <TextField
            label={t('admin.questions.category')}
            placeholder={t('admin.questions.categoryPlaceholder')}
            value={draft.category}
            onChange={(e) => setDraft({ ...draft, category: e.target.value })}
          />

          <div>
            <span className="mb-1 block text-sm font-medium text-slate-700">
              {t('admin.questions.options')}
            </span>
            <Hint>{t('admin.questions.editorHint')}</Hint>
            <div className="mt-2 space-y-2">
              {draft.options.map((o, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-2 rounded-xl border p-2 transition ${
                    o.isCorrect ? 'border-brand-300 bg-brand-50/50' : 'border-slate-200'
                  }`}
                >
                  <input
                    value={o.text}
                    onChange={(e) => setOption(i, { text: e.target.value })}
                    placeholder={t('admin.questions.optionPlaceholder')}
                    className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
                  />
                  <label className="flex shrink-0 cursor-pointer items-center gap-1 text-xs font-medium text-slate-600">
                    <input
                      type="checkbox"
                      checked={o.isCorrect}
                      onChange={(e) => setOption(i, { isCorrect: e.target.checked })}
                      className="h-4 w-4 rounded border-slate-300 text-brand-700"
                    />
                    {t('admin.questions.markCorrect')}
                  </label>
                  {draft.options.length > 2 ? (
                    <button
                      type="button"
                      onClick={() =>
                        setDraft({
                          ...draft,
                          options: draft.options.filter((_, idx) => idx !== i)
                        })
                      }
                      className="shrink-0 px-1 text-slate-400 hover:text-red-600"
                      aria-label={t('common.delete')}
                    >
                      <XIcon className="h-4 w-4" />
                    </button>
                  ) : null}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() =>
                setDraft({
                  ...draft,
                  options: [...draft.options, { text: '', isCorrect: false }]
                })
              }
              className="mt-2 text-sm font-medium text-brand-700 hover:underline"
            >
              + {t('admin.questions.addOption')}
            </button>
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={draft.active}
              onChange={(e) => setDraft({ ...draft, active: e.target.checked })}
              className="h-5 w-5 rounded border-slate-300 text-brand-700"
            />
            {t('admin.questions.activeLabel')}
          </label>

          {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}

          <div className="flex gap-3 pt-2">
            <Button onClick={onSave}>{t('common.save')}</Button>
            <Button variant="secondary" onClick={onCancel}>
              {t('common.cancel')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
