'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import type { ComponentType, ReactNode, SVGProps } from 'react';
import {
  ClipboardListIcon,
  HelpCircleIcon,
  LayoutGridIcon,
  LogOutIcon,
  SettingsIcon
} from '@/components/icons';
import { t } from '@/lib/strings';

const NAV: {
  href: string;
  key: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
}[] = [
  { href: '/admin', key: 'dashboard', Icon: LayoutGridIcon },
  { href: '/admin/questions', key: 'questions', Icon: HelpCircleIcon },
  { href: '/admin/submissions', key: 'submissions', Icon: ClipboardListIcon },
  { href: '/admin/config', key: 'config', Icon: SettingsIcon }
];

export default function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const signOut = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.replace('/admin/login');
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="h-1.5 w-full bg-brand-600" />
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-2 px-4 py-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <Image
              src="/mnt-logo.png"
              alt="Magyar Nemzeti Tanács"
              width={945}
              height={1182}
              priority
              className="h-12 w-auto shrink-0"
            />
            <span className="truncate font-bold text-brand-800">{t('common.appName')}</span>
          </div>
          <button
            onClick={signOut}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-slate-500 hover:bg-slate-100 hover:text-brand-700"
            aria-label={t('admin.signOut')}
          >
            <LogOutIcon className="h-4 w-4" />
            <span className="hidden sm:inline">{t('admin.signOut')}</span>
          </button>
        </div>
        <nav className="mx-auto flex max-w-5xl">
          {NAV.map((item) => {
            const active =
              item.href === '/admin'
                ? pathname === '/admin'
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-1 flex-col items-center gap-1 border-b-2 px-1 py-2 text-[11px] font-medium leading-none transition sm:flex-none sm:flex-row sm:gap-2 sm:px-4 sm:py-2.5 sm:text-sm ${
                  active
                    ? 'border-brand-600 text-brand-700'
                    : 'border-transparent text-slate-500 hover:text-brand-700'
                }`}
              >
                <item.Icon className="h-5 w-5 sm:h-4 sm:w-4" />
                <span>{t(`admin.nav.${item.key}`)}</span>
              </Link>
            );
          })}
        </nav>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
    </div>
  );
}
