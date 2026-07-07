'use client';

import { useEffect, useState } from 'react';
import { PageHeading, useToast } from '@/components/admin';
import { DownloadIcon, TrashIcon } from '@/components/icons';
import { t } from '@/lib/strings';

type Submission = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  passed: boolean;
  score: number;
  total: number;
  createdAt: string;
};

type Filter = 'all' | 'passed' | 'failed';

export default function SubmissionsPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [stats, setStats] = useState({ passed: 0, total: 0 });
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const { show, node } = useToast();

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams();
    if (filter !== 'all') params.set('result', filter);
    if (search.trim()) params.set('search', search.trim());

    setLoading(true);
    fetch(`/api/admin/submissions?${params.toString()}`, { signal: controller.signal })
      .then((r) => r.json())
      .then((data) => {
        setSubmissions(data.submissions ?? []);
        setStats(data.stats ?? { passed: 0, total: 0 });
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [filter, search, refreshKey]);

  const remove = async (id: string) => {
    if (!confirm(t('admin.submissions.confirmDelete'))) return;
    const res = await fetch(`/api/admin/submissions/${id}`, { method: 'DELETE' });
    if (res.ok) {
      show(t('admin.submissions.deleted'));
      setRefreshKey((k) => k + 1);
    } else {
      show(t('common.genericError'), 'error');
    }
  };

  const passRate = stats.total > 0 ? Math.round((stats.passed / stats.total) * 100) : 0;

  return (
    <div>
      {node}
      <PageHeading
        title={t('admin.submissions.title')}
        description={t('admin.submissions.description')}
        action={
          <a
            href="/api/admin/export"
            className="inline-flex items-center gap-2 rounded-xl bg-brand-gradient-anim px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-emerald-900/20 transition hover:brightness-110"
          >
            <DownloadIcon className="h-4 w-4" /> {t('admin.submissions.exportCsv')}
          </a>
        }
      />

      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {[
          { label: t('admin.submissions.total'), value: stats.total },
          { label: t('admin.submissions.passed'), value: stats.passed },
          { label: t('admin.dashboard.passRate'), value: `${passRate}%` }
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4"
          >
            <p className="text-xl font-bold text-brand-800 sm:text-2xl">{s.value}</p>
            <p className="mt-0.5 text-[11px] leading-tight text-slate-500 sm:text-xs">
              {s.label}
            </p>
          </div>
        ))}
      </div>

      <p className="mt-4 text-xs text-slate-500">{t('admin.submissions.note')}</p>

      <div className="mt-3 space-y-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('admin.submissions.searchPlaceholder')}
          className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-brand-500 sm:max-w-xs"
        />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex overflow-hidden rounded-xl border border-slate-300">
            {(['all', 'passed', 'failed'] as Filter[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2.5 text-sm font-medium transition ${
                  filter === f ? 'bg-brand-700 text-white' : 'bg-white text-slate-600'
                }`}
              >
                {t(`admin.submissions.${f}`)}
              </button>
            ))}
          </div>
          <span className="text-sm text-slate-500">
            {t('admin.submissions.showing', { count: submissions.length })}
          </span>
        </div>
      </div>

      {/* Desktop: table */}
      <div className="mt-3 hidden overflow-x-auto rounded-2xl border border-slate-200 bg-white sm:block">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">{t('admin.submissions.name')}</th>
              <th className="px-4 py-3 font-medium">{t('admin.submissions.email')}</th>
              <th className="px-4 py-3 font-medium">{t('admin.submissions.phone')}</th>
              <th className="px-4 py-3 font-medium">{t('admin.submissions.result')}</th>
              <th className="px-4 py-3 font-medium">{t('admin.submissions.score')}</th>
              <th className="px-4 py-3 font-medium">{t('admin.submissions.date')}</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-slate-400">
                  {t('common.loading')}
                </td>
              </tr>
            ) : submissions.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-slate-400">
                  {t('admin.submissions.empty')}
                </td>
              </tr>
            ) : (
              submissions.map((s) => (
                <tr key={s.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                  <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-800">
                    {s.lastName} {s.firstName}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{s.email}</td>
                  <td className="px-4 py-3 text-slate-600">{s.phone || '—'}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        s.passed ? 'bg-brand-100 text-brand-800' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {s.passed ? t('admin.submissions.passed') : t('admin.submissions.failed')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {s.score}/{s.total}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-500">
                    {new Date(s.createdAt).toLocaleString('hu-HU')}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => remove(s.id)}
                      className="inline-flex items-center rounded-lg p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                      aria-label={t('admin.submissions.delete')}
                      title={t('admin.submissions.delete')}
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile: cards */}
      <div className="mt-3 space-y-3 sm:hidden">
        {loading ? (
          <p className="py-8 text-center text-slate-400">{t('common.loading')}</p>
        ) : submissions.length === 0 ? (
          <p className="py-8 text-center text-slate-400">{t('admin.submissions.empty')}</p>
        ) : (
          submissions.map((s) => (
            <div
              key={s.id}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900">
                    {s.lastName} {s.firstName}
                  </p>
                  <p className="truncate text-sm text-slate-500">{s.email}</p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    s.passed ? 'bg-brand-100 text-brand-800' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {s.passed ? t('admin.submissions.passed') : t('admin.submissions.failed')}
                </span>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
                <span>{s.phone || '—'}</span>
                <span className="font-medium text-slate-700">
                  {s.score}/{s.total}
                </span>
                <span>{new Date(s.createdAt).toLocaleString('hu-HU')}</span>
              </div>
              <div className="mt-2 flex justify-end">
                <button
                  onClick={() => remove(s.id)}
                  className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm font-medium text-red-600 hover:bg-red-50"
                >
                  <TrashIcon className="h-4 w-4" />
                  {t('admin.submissions.delete')}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
