import type { ButtonHTMLAttributes, CSSProperties, InputHTMLAttributes, ReactNode } from 'react';
import { CheckIcon } from '@/components/icons';
import { t } from '@/lib/strings';

/**
 * Cheap decorative background: soft radial-gradient "blobs" that slowly float.
 * No CSS filter blur (expensive on low-end phones) — the softness comes from
 * the gradient alpha falloff, so it stays smooth everywhere.
 */
function DecorLayer() {
  const blobs: { cls: string; style: CSSProperties }[] = [
    {
      // Warm summer sun, glowing in the top-right corner.
      cls: 'blob blob-b',
      style: {
        top: '-4rem',
        right: '-4rem',
        width: '17rem',
        height: '17rem',
        background:
          'radial-gradient(circle at 60% 40%, rgba(250,204,21,0.38), rgba(251,191,36,0.12) 55%, transparent 72%)'
      }
    },
    {
      // Fresh grass green, top-left.
      cls: 'blob blob-a',
      style: {
        top: '-5rem',
        left: '-4rem',
        width: '18rem',
        height: '18rem',
        background: 'radial-gradient(circle at 30% 30%, rgba(0,184,95,0.32), transparent 70%)'
      }
    },
    {
      // Lime, mid-left.
      cls: 'blob blob-c',
      style: {
        top: '38%',
        left: '-6rem',
        width: '15rem',
        height: '15rem',
        background: 'radial-gradient(circle at 50% 50%, rgba(163,230,53,0.30), transparent 70%)'
      }
    },
    {
      // Lake teal, bottom.
      cls: 'blob blob-c',
      style: {
        bottom: '-6rem',
        left: '25%',
        width: '20rem',
        height: '20rem',
        background: 'radial-gradient(circle at 50% 50%, rgba(20,184,166,0.22), transparent 70%)'
      }
    }
  ];
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {blobs.map((b, i) => (
        <div key={i} className={b.cls} style={b.style} />
      ))}
    </div>
  );
}

/**
 * Institutional header inspired by mnt.org.rs: white bar, animated brand
 * gradient accent line, wordmark on the left. Compact for mobile.
 */
export function AppHeader() {
  return (
    <header
      className="relative z-20 border-b border-slate-200 bg-white"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      <div className="bg-brand-gradient-anim h-1.5 w-full" />
      <div className="mx-auto flex max-w-md items-center gap-3 px-4 py-3">
        <div className="bg-brand-gradient-anim flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold tracking-tight text-white shadow-sm shadow-emerald-900/20">
          MNT
        </div>
        <div className="leading-tight">
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
            Magyar Nemzeti Tanács
          </p>
          <p className="text-sm font-bold text-brand-800">{t('common.appName')}</p>
        </div>
      </div>
    </header>
  );
}

function AppFooter() {
  return (
    <footer
      className="relative z-10 mx-auto w-full max-w-md px-4 pt-2"
      style={{ paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom))' }}
    >
      <p className="text-center text-xs leading-relaxed text-slate-400">
        {t('common.appName')} · Magyar Nemzeti Tanács
      </p>
    </footer>
  );
}

/**
 * Full-screen, mobile-first shell.
 * - min-h-[100dvh]: dynamic viewport height, so mobile browser chrome
 *   (URL bar) doesn't cut off content the way 100vh does.
 * - safe-area insets: content stays clear of notches / home indicators.
 * - m-auto on the inner column centers when there's room but lets tall
 *   content (e.g. a quiz with long options) scroll instead of clipping.
 */
export function PageShell({ children }: { children: ReactNode }) {
  return (
    <div
      className="relative flex min-h-[100dvh] flex-col overflow-hidden bg-gradient-to-b from-lime-50 via-white to-emerald-50"
      style={{
        paddingLeft: 'env(safe-area-inset-left)',
        paddingRight: 'env(safe-area-inset-right)'
      }}
    >
      <DecorLayer />
      <AppHeader />
      <main className="relative z-10 flex flex-1 flex-col px-4 py-6 sm:py-8">
        <div className="m-auto w-full max-w-md">{children}</div>
      </main>
      <AppFooter />
    </div>
  );
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`animate-fade-in-up rounded-3xl border border-slate-100 bg-white p-5 shadow-xl shadow-emerald-950/5 ring-1 ring-slate-900/5 sm:p-7 ${className}`}
    >
      {children}
    </div>
  );
}

export function Button({
  children,
  variant = 'primary',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
}) {
  const base =
    'inline-flex w-full min-h-[52px] items-center justify-center gap-2 rounded-2xl px-5 text-base font-semibold transition-all duration-200 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2';
  const variants = {
    primary:
      'bg-brand-gradient-anim text-white shadow-lg shadow-emerald-900/25 hover:brightness-110 hover:shadow-emerald-900/35',
    secondary:
      'border-2 border-brand-600 bg-white/80 text-brand-700 hover:bg-brand-50',
    ghost: 'text-brand-700 hover:bg-brand-50',
    danger: 'bg-red-600 text-white shadow-lg shadow-red-900/20 hover:bg-red-700'
  };
  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}

export function Checkbox({
  checked,
  onChange,
  error = false,
  children
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  error?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="flex cursor-pointer select-none items-start gap-3 text-sm text-slate-700">
      {/* Visually hidden native checkbox keeps keyboard + a11y behaviour. */}
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="peer sr-only"
      />
      <span
        className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 transition peer-focus-visible:ring-2 peer-focus-visible:ring-brand-400 peer-focus-visible:ring-offset-2 ${
          checked
            ? 'border-transparent bg-brand-gradient-anim shadow-sm shadow-emerald-900/20'
            : error
              ? 'border-red-400 bg-white'
              : 'border-slate-300 bg-white'
        }`}
      >
        <CheckIcon
          className={`h-4 w-4 text-white transition-all ${
            checked ? 'scale-100 opacity-100' : 'scale-50 opacity-0'
          }`}
          strokeWidth={3}
        />
      </span>
      <span className="pt-0.5">{children}</span>
    </label>
  );
}

export function TextField({
  label,
  error,
  className = '',
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">{label}</span>
      <input
        className={`min-h-[48px] w-full rounded-xl border bg-white px-4 text-base text-slate-900 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100 ${
          error ? 'border-red-400' : 'border-slate-300'
        } ${className}`}
        {...props}
      />
      {error ? <span className="mt-1 block text-sm text-red-600">{error}</span> : null}
    </label>
  );
}
