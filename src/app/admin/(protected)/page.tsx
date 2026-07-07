import Link from 'next/link';
import type { ComponentType, SVGProps } from 'react';
import { prisma } from '@/lib/prisma';
import { StatCard } from '@/components/admin';
import {
  ArrowRightIcon,
  ClipboardListIcon,
  HelpCircleIcon,
  SettingsIcon
} from '@/components/icons';
import { t } from '@/lib/strings';

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  const [total, passed, activeQuestions] = await Promise.all([
    prisma.submission.count(),
    prisma.submission.count({ where: { passed: true } }),
    prisma.question.count({ where: { active: true } })
  ]);

  const passRate = total > 0 ? Math.round((passed / total) * 100) : 0;

  const links: {
    href: string;
    label: string;
    Icon: ComponentType<SVGProps<SVGSVGElement>>;
  }[] = [
    { href: '/admin/questions', label: t('admin.dashboard.manageQuestions'), Icon: HelpCircleIcon },
    { href: '/admin/submissions', label: t('admin.dashboard.viewSubmissions'), Icon: ClipboardListIcon },
    { href: '/admin/config', label: t('admin.dashboard.editConfig'), Icon: SettingsIcon }
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">{t('admin.dashboard.title')}</h1>
      <p className="mt-1 text-sm text-slate-500">{t('admin.dashboard.subtitle')}</p>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label={t('admin.dashboard.totalSubmissions')} value={total} />
        <StatCard label={t('admin.dashboard.passed')} value={passed} />
        <StatCard label={t('admin.dashboard.passRate')} value={`${passRate}%`} accent />
        <StatCard label={t('admin.dashboard.activeQuestions')} value={activeQuestions} />
      </div>

      <h2 className="mt-8 text-sm font-semibold uppercase tracking-wide text-slate-500">
        {t('admin.dashboard.quickActions')}
      </h2>
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="group flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-brand-400 hover:shadow-md"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
              <l.Icon className="h-5 w-5" />
            </span>
            <span className="font-semibold text-slate-800 group-hover:text-brand-700">
              {l.label}
            </span>
            <ArrowRightIcon className="ml-auto h-5 w-5 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-brand-500" />
          </Link>
        ))}
      </div>
    </div>
  );
}
