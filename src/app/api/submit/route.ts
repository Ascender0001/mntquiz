import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { submitSchema } from '@/lib/validation';
import { isInsideGeofence } from '@/lib/geo';
import { rateLimit, clientIp } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

/**
 * Scores a quiz attempt server-side (correct answers never leave the server),
 * re-checks the geofence, and stores the submission. Returns pass/fail + score.
 */
export async function POST(req: NextRequest) {
  const ip = clientIp(req);

  // Anti-botting: cap submissions per IP. A short burst limit plus a sustained
  // hourly limit curbs scripted multi-account attempts.
  const burst = rateLimit(`submit:burst:${ip}`, 3, 15_000);
  const hourly = rateLimit(`submit:hourly:${ip}`, 10, 60 * 60_000);
  if (!burst.ok || !hourly.ok) {
    const retryAfter = Math.max(burst.retryAfter, hourly.retryAfter);
    return NextResponse.json(
      { error: 'rate_limited' },
      { status: 429, headers: { 'Retry-After': String(retryAfter) } }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const parsed = submitSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'validation_failed', issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { registration, answers, location } = parsed.data;

  const config = await prisma.config.findUnique({ where: { id: 1 } });
  if (!config) {
    return NextResponse.json({ error: 'not_configured' }, { status: 503 });
  }

  // Server-side geofence enforcement. When NEXT_PUBLIC_DISABLE_GEOFENCE=true
  // (e.g. testing off-site) the location requirement and radius check are
  // skipped; otherwise a location is required and must fall inside the radius.
  const geofenceDisabled = process.env.NEXT_PUBLIC_DISABLE_GEOFENCE === 'true';
  if (!geofenceDisabled) {
    if (location) {
      const inside = isInsideGeofence(
        location.latitude,
        location.longitude,
        config.centerLat,
        config.centerLng,
        config.radiusMeters
      );
      if (!inside) {
        return NextResponse.json({ error: 'outside_geofence' }, { status: 403 });
      }
    } else {
      return NextResponse.json({ error: 'location_required' }, { status: 403 });
    }
  }

  // Anti-cheat: accept at most ONE answer per question. Otherwise a client
  // could submit every option for a question and always get it "correct".
  const chosenByQuestion = new Map<string, string>();
  for (const a of answers) {
    if (chosenByQuestion.has(a.questionId)) {
      return NextResponse.json({ error: 'duplicate_answers' }, { status: 400 });
    }
    chosenByQuestion.set(a.questionId, a.optionId);
  }

  // Load the correct options for the answered questions.
  const questionIds = [...chosenByQuestion.keys()];
  const questions = await prisma.question.findMany({
    where: { id: { in: questionIds }, active: true },
    select: {
      id: true,
      options: { select: { id: true, isCorrect: true } }
    }
  });

  const correctByQuestion = new Map<string, Set<string>>();
  for (const q of questions) {
    correctByQuestion.set(
      q.id,
      new Set(q.options.filter((o) => o.isCorrect).map((o) => o.id))
    );
  }

  // Score one point per active question whose single chosen option is correct.
  let score = 0;
  for (const q of questions) {
    const chosen = chosenByQuestion.get(q.id);
    const correct = correctByQuestion.get(q.id);
    if (chosen && correct && correct.has(chosen)) {
      score += 1;
    }
  }

  const total = questions.length;
  const passed = score >= config.passThreshold;

  // One submission per email. Normalize to lowercase so casing can't be used
  // to bypass the limit.
  const email = registration.email.toLowerCase();

  const existing = await prisma.submission.findUnique({
    where: { email },
    select: { id: true }
  });
  if (existing) {
    return NextResponse.json({ error: 'email_already_used' }, { status: 409 });
  }

  let submission: { id: string };
  try {
    submission = await prisma.submission.create({
      data: {
        firstName: registration.firstName,
        lastName: registration.lastName,
        email,
        phone: registration.phone ?? null,
        passed,
        score,
        total,
        latitude: location?.latitude ?? null,
        longitude: location?.longitude ?? null
      },
      select: { id: true }
    });
  } catch (err) {
    // Race-safe fallback: unique constraint violation (P2002) if two requests
    // for the same email arrive concurrently.
    if (
      typeof err === 'object' &&
      err !== null &&
      'code' in err &&
      (err as { code?: string }).code === 'P2002'
    ) {
      return NextResponse.json({ error: 'email_already_used' }, { status: 409 });
    }
    throw err;
  }

  return NextResponse.json({
    id: submission.id,
    passed,
    score,
    total,
    threshold: config.passThreshold
  });
}
