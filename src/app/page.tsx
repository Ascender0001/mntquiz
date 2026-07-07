'use client';

import { useCallback, useEffect, useState, type CSSProperties } from 'react';
import { Button, Card, Checkbox, PageShell, TextField } from '@/components/ui';
import { ArrowLeftIcon, CheckIcon, MapPinIcon, SunIcon } from '@/components/icons';
import { distanceMeters } from '@/lib/geo';
import { t } from '@/lib/strings';

type Option = { id: string; text: string };
type Question = {
  id: string;
  text: string;
  category: string | null;
  type: 'choice' | 'text';
  options: Option[];
};
type Geofence = { centerLat: number; centerLng: number; radiusMeters: number };
type QuizData = { geofence: Geofence; questions: Question[]; total: number };
type Coords = { latitude: number; longitude: number };

type Stage =
  | 'loading'
  | 'landing'
  | 'geo-denied'
  | 'geo-unavailable'
  | 'geo-outside'
  | 'register'
  | 'quiz'
  | 'submitting'
  | 'result';

type Registration = { firstName: string; lastName: string; email: string; phone: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const GEOFENCE_DISABLED = process.env.NEXT_PUBLIC_DISABLE_GEOFENCE === 'true';

function formatDistance(m: number): string {
  return m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(1)} km`;
}

export default function GamePage() {
  const [stage, setStage] = useState<Stage>('loading');
  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [coords, setCoords] = useState<Coords | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [registration, setRegistration] = useState<Registration | null>(null);

  useEffect(() => {
    fetch('/api/quiz')
      .then((r) => r.json())
      .then((data: QuizData) => {
        setQuiz(data);
        setStage('landing');
      })
      .catch(() => setError(t('common.genericError')));
  }, []);

  const checkLocation = useCallback(() => {
    if (!quiz) return;
    setError(null);
    setStage('loading');

    // Testing override: skip the geofence entirely and go straight to registration.
    if (GEOFENCE_DISABLED) {
      setCoords(null);
      setDistance(null);
      setStage('register');
      return;
    }

    if (!('geolocation' in navigator)) {
      setStage('geo-unavailable');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const c = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
        const d = distanceMeters(
          c.latitude,
          c.longitude,
          quiz.geofence.centerLat,
          quiz.geofence.centerLng
        );
        setCoords(c);
        setDistance(d);
        setStage(d <= quiz.geofence.radiusMeters ? 'register' : 'geo-outside');
      },
      (err) => {
        setStage(err.code === err.PERMISSION_DENIED ? 'geo-denied' : 'geo-unavailable');
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  }, [quiz]);

  if (error) {
    return (
      <PageShell>
        <Card>
          <p className="text-center text-slate-700">{error}</p>
        </Card>
      </PageShell>
    );
  }

  if (stage === 'loading' || !quiz) {
    return (
      <PageShell>
        <div className="flex justify-center">
          <Spinner />
        </div>
      </PageShell>
    );
  }

  if (stage === 'landing' && quiz.questions.length === 0) {
    return (
      <PageShell>
        <Card className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-400">
            <SunIcon className="h-8 w-8" />
          </div>
          <h1 className="mt-4 text-xl font-bold text-brand-800">{t('landing.unavailable')}</h1>
          <p className="mx-auto mt-3 max-w-xs text-slate-600">{t('landing.unavailableHint')}</p>
        </Card>
      </PageShell>
    );
  }

  if (stage === 'landing') {
    return (
      <PageShell>
        <Card className="text-center">
          <div className="relative mx-auto flex h-20 w-20 items-center justify-center">
            <span
              className="absolute -inset-5 rounded-full"
              style={{
                background: 'radial-gradient(circle, rgba(253,224,71,0.55), transparent 70%)'
              }}
            />
            <span className="animate-pop-in relative flex h-20 w-20 items-center justify-center rounded-full bg-brand-gradient-anim text-white shadow-lg shadow-emerald-900/25">
              <SunIcon className="h-10 w-10" />
            </span>
          </div>

          <p className="mt-5 text-xs font-bold uppercase tracking-widest text-amber-600">
            {t('landing.welcome')}
          </p>
          <h1 className="text-gradient bg-brand-gradient-anim mt-1 text-3xl font-extrabold leading-[1.1] tracking-tight sm:text-4xl">
            {t('common.appName')}
          </h1>

          <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
            <MapPinIcon className="h-3.5 w-3.5 text-brand-600" />
            Palics · Palić
          </span>

          <p className="mx-auto mt-4 max-w-xs text-slate-600">{t('landing.subtitle')}</p>

          {!GEOFENCE_DISABLED ? (
            <p className="mx-auto mt-4 max-w-xs text-xs leading-relaxed text-slate-500">
              {t('landing.locationNeeded')}
            </p>
          ) : null}

          <div className="mt-6">
            <Button onClick={checkLocation}>
              {GEOFENCE_DISABLED ? t('landing.start') : t('landing.allowLocation')}
            </Button>
          </div>
        </Card>
      </PageShell>
    );
  }

  if (stage === 'geo-denied' || stage === 'geo-unavailable' || stage === 'geo-outside') {
    const msg =
      stage === 'geo-denied'
        ? t('landing.locationDenied')
        : stage === 'geo-unavailable'
          ? t('landing.locationUnavailable')
          : t('landing.locationOutside');
    return (
      <PageShell>
        <Card className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-50 text-amber-500">
            <MapPinIcon className="h-8 w-8" />
          </div>
          <h1 className="mt-4 text-xl font-bold text-brand-800">{t('common.appName')}</h1>
          <p className="mx-auto mt-3 max-w-xs text-slate-700">{msg}</p>
          {stage === 'geo-outside' && distance !== null ? (
            <p className="mt-2 text-sm text-slate-500">
              {t('landing.distanceAway', { distance: formatDistance(distance) })}
            </p>
          ) : null}
          <div className="mt-6">
            <Button variant="secondary" onClick={checkLocation}>
              {t('common.retry')}
            </Button>
          </div>
        </Card>
      </PageShell>
    );
  }

  if (stage === 'register') {
    return (
      <RegistrationForm
        onSubmit={(reg) => {
          setRegistration(reg);
          setStage('quiz');
        }}
        onBack={() => setStage('landing')}
        registration={registration}
      />
    );
  }

  if (stage === 'quiz' || stage === 'submitting') {
    return (
      <Quiz
        questions={quiz.questions}
        submitting={stage === 'submitting'}
        onFinish={async (answers) => {
          if (!registration) return;
          setStage('submitting');
          try {
            const res = await fetch('/api/submit', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                registration,
                answers,
                ...(coords ? { location: coords } : {})
              })
            });
            if (res.status === 409) {
              setError(t('registration.emailUsed'));
              return;
            }
            if (!res.ok) {
              setError(t('common.genericError'));
              return;
            }
            setStage('result');
          } catch {
            setError(t('common.genericError'));
          }
        }}
      />
    );
  }

  if (stage === 'result') {
    return (
      <PageShell>
        <Card className="relative overflow-hidden text-center">
          <Confetti />
          <div className="relative">
            <div className="animate-celebrate mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-brand-gradient-anim text-white shadow-lg shadow-emerald-900/25">
              <CheckIcon className="h-12 w-12" strokeWidth={2.5} />
            </div>
            <h1 className="text-gradient bg-brand-gradient-anim mt-5 text-2xl font-extrabold">
              {t('result.submittedTitle')}
            </h1>
            <p className="mx-auto mt-3 max-w-xs text-slate-600">{t('result.goodLuck')}</p>
          </div>

          <div className="mt-7">
            <Button variant="secondary" onClick={() => window.location.reload()}>
              {t('result.playAgain')}
            </Button>
          </div>
        </Card>
      </PageShell>
    );
  }

  return null;
}

function Spinner() {
  return (
    <span
      className="mx-auto block h-12 w-12 animate-spin rounded-full border-4 border-brand-100 border-t-brand-600"
      role="status"
      aria-label={t('common.loading')}
    />
  );
}

function Confetti() {
  const colors = ['#00b85f', '#84cc16', '#0d9488', '#f59e0b', '#00904d', '#22d3ee'];
  const pieces = Array.from({ length: 16 }, (_, i) => {
    const left = (i * 6.2 + 4) % 100;
    const dx = ((i % 5) - 2) * 18;
    const delay = (i % 8) * 110;
    const duration = 1500 + (i % 4) * 300;
    const rounded = i % 2 === 0;
    const style = {
      position: 'absolute',
      top: '-14px',
      left: `${left}%`,
      width: rounded ? '8px' : '6px',
      height: rounded ? '8px' : '11px',
      background: colors[i % colors.length],
      borderRadius: rounded ? '9999px' : '2px',
      '--dx': `${dx}px`,
      animation: `confetti-fall ${duration}ms ease-in ${delay}ms forwards`
    } as CSSProperties;
    return <span key={i} style={style} aria-hidden="true" />;
  });
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {pieces}
    </div>
  );
}

function RegistrationForm({
  onSubmit,
  onBack,
  registration
}: {
  onSubmit: (reg: Registration) => void;
  onBack: () => void;
  registration: Registration | null;
}) {
  const [form, setForm] = useState<Registration>(
    registration ?? { firstName: '', lastName: '', email: '', phone: '' }
  );
  const [consent, setConsent] = useState(false);
  const [checking, setChecking] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (key: keyof Registration, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.firstName.trim()) e.firstName = t('registration.required');
    if (!form.lastName.trim()) e.lastName = t('registration.required');
    if (!form.email.trim()) e.email = t('registration.required');
    else if (!EMAIL_RE.test(form.email.trim())) e.email = t('registration.invalidEmail');
    // Phone is optional — only validate when something was entered.
    if (form.phone.trim()) {
      const digits = form.phone.replace(/\D/g, '');
      if (digits.length < 7 || !/^\+?[0-9\s\-()]{6,30}$/.test(form.phone.trim()))
        e.phone = t('registration.invalidPhone');
    }
    if (!consent) e.consent = t('registration.consentRequired');
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  return (
    <PageShell>
      <Card>
        <button
          type="button"
          onClick={onBack}
          className="-ml-1 mb-3 inline-flex items-center gap-1.5 rounded-lg py-1 pr-2 text-sm font-medium text-slate-500 transition hover:text-brand-700"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          {t('common.back')}
        </button>
        <h1 className="text-gradient bg-brand-gradient-anim text-2xl font-extrabold tracking-tight">
          {t('registration.title')}
        </h1>
        <p className="mt-2 text-sm text-slate-600">{t('registration.intro')}</p>
        <form
          className="mt-6 space-y-4"
          onSubmit={async (ev) => {
            ev.preventDefault();
            if (!validate()) return;
            setChecking(true);
            try {
              // Reject a duplicate email up front, before the quiz starts.
              const res = await fetch('/api/check-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: form.email.trim() })
              });
              const data = await res.json().catch(() => ({}));
              if (res.ok && data.available === false) {
                setErrors((e) => ({ ...e, email: t('registration.emailUsed') }));
                return;
              }
              // On any error, proceed — the server still enforces uniqueness on submit.
              onSubmit({
                firstName: form.firstName.trim(),
                lastName: form.lastName.trim(),
                email: form.email.trim(),
                phone: form.phone.trim()
              });
            } finally {
              setChecking(false);
            }
          }}
          noValidate
        >
          <TextField
            label={t('registration.firstName')}
            value={form.firstName}
            onChange={(e) => set('firstName', e.target.value)}
            error={errors.firstName}
            autoComplete="given-name"
          />
          <TextField
            label={t('registration.lastName')}
            value={form.lastName}
            onChange={(e) => set('lastName', e.target.value)}
            error={errors.lastName}
            autoComplete="family-name"
          />
          <TextField
            label={t('registration.email')}
            type="email"
            inputMode="email"
            value={form.email}
            onChange={(e) => set('email', e.target.value)}
            error={errors.email}
            autoComplete="email"
          />
          <TextField
            label={t('registration.phone')}
            type="tel"
            inputMode="tel"
            value={form.phone}
            onChange={(e) => set('phone', e.target.value)}
            error={errors.phone}
            autoComplete="tel"
          />
          <Checkbox
            checked={consent}
            onChange={setConsent}
            error={Boolean(errors.consent)}
          >
            {t('registration.consent')}
          </Checkbox>
          {errors.consent ? (
            <p className="text-sm text-red-600">{errors.consent}</p>
          ) : null}
          <Button type="submit" disabled={checking}>
            {checking ? t('registration.checking') : t('registration.submit')}
          </Button>
          <p className="text-xs leading-relaxed text-slate-400">
            {t('registration.privacyNotice')}
          </p>
        </form>
      </Card>
    </PageShell>
  );
}

type QuizAnswer = { questionId: string; optionId?: string; text?: string };

function Quiz({
  questions,
  submitting,
  onFinish
}: {
  questions: Question[];
  submitting: boolean;
  onFinish: (answers: QuizAnswer[]) => void;
}) {
  const [index, setIndex] = useState(0);
  // One map keyed by questionId: option id (choice) or typed text (text).
  const [responses, setResponses] = useState<Record<string, string>>({});
  const current = questions[index];
  const isLast = index === questions.length - 1;

  // Defensive guard: never render the quiz body without a question.
  if (!current) {
    return (
      <PageShell>
        <Card className="text-center">
          <p className="text-slate-600">{t('landing.unavailableHint')}</p>
        </Card>
      </PageShell>
    );
  }

  const value = responses[current.id];
  const answered =
    current.type === 'text' ? Boolean(value && value.trim()) : Boolean(value);

  const advance = () => {
    if (!answered) return;
    if (isLast) {
      onFinish(
        questions.map((q) =>
          q.type === 'text'
            ? { questionId: q.id, text: responses[q.id] ?? '' }
            : { questionId: q.id, optionId: responses[q.id] }
        )
      );
    } else {
      setIndex((i) => i + 1);
    }
  };

  return (
    <PageShell>
      <Card>
        <div className="flex items-center justify-between text-sm font-semibold text-brand-600">
          <span>{t('quiz.progress', { current: index + 1, total: questions.length })}</span>
          <span className="text-slate-400">
            {Math.round(((index + 1) / questions.length) * 100)}%
          </span>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="bg-brand-gradient-anim h-full rounded-full transition-[width] duration-500 ease-out"
            style={{ width: `${((index + 1) / questions.length) * 100}%` }}
          />
        </div>
        <h2 className="mt-5 text-xl font-bold text-slate-900">{current.text}</h2>

        {current.type === 'text' ? (
          <div className="mt-5">
            <textarea
              value={value ?? ''}
              onChange={(e) =>
                setResponses((r) => ({ ...r, [current.id]: e.target.value }))
              }
              placeholder={t('quiz.answerPlaceholder')}
              rows={3}
              className="min-h-[104px] w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
            />
          </div>
        ) : (
          <div className="mt-5 space-y-3">
            {current.options.map((opt, i) => {
              const active = value === opt.id;
              const letter = String.fromCharCode(65 + i); // A, B, C, D…
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() =>
                    setResponses((r) => ({ ...r, [current.id]: opt.id }))
                  }
                  className={`flex min-h-[60px] w-full items-center gap-3 rounded-2xl border px-3 py-3 text-left text-base transition-colors duration-75 active:scale-[0.98] ${
                    active
                      ? 'border-brand-600 bg-brand-50 font-semibold text-brand-800 ring-2 ring-brand-500'
                      : 'border-slate-200 bg-white text-slate-800'
                  }`}
                >
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${
                      active ? 'bg-brand-gradient-anim text-white' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {active ? <CheckIcon className="h-4 w-4" strokeWidth={3} /> : letter}
                  </span>
                  <span className="flex-1">{opt.text}</span>
                </button>
              );
            })}
          </div>
        )}

        <div className="mt-6">
          <Button onClick={advance} disabled={!answered || submitting}>
            {submitting
              ? t('quiz.submitting')
              : isLast
                ? t('quiz.finish')
                : t('quiz.next')}
          </Button>
        </div>
      </Card>
    </PageShell>
  );
}
