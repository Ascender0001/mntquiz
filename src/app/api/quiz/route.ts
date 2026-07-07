import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rateLimit, clientIp } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

/** Fisher-Yates shuffle returning a new array. */
function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Public endpoint returning the active question set (without revealing which
 * options are correct) plus the geofence configuration the client needs to
 * gate participation.
 */
export async function GET(req: NextRequest) {
  const limit = rateLimit(`quiz:${clientIp(req)}`, 40, 60_000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: 'rate_limited' },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfter) } }
    );
  }

  const config = await prisma.config.findUnique({ where: { id: 1 } });
  if (!config) {
    return NextResponse.json({ error: 'not_configured' }, { status: 503 });
  }

  // The quiz must be started by an organizer. Until then, don't expose the
  // geofence/questions — the client shows a waiting screen and polls this.
  if (!config.quizStarted) {
    return NextResponse.json({ started: false });
  }

  const allActive = await prisma.question.findMany({
    where: { active: true },
    select: {
      id: true,
      text: true,
      category: true,
      type: true,
      options: {
        select: { id: true, text: true } // isCorrect is intentionally omitted
      }
    }
  });

  // Randomise per attempt: a shuffled subset of active questions, each with its
  // answer options shuffled. Different players get different questions in a
  // different order, which discourages answer-sharing between nearby
  // participants. Scoring is server-side, so all of this is display-only.
  const randomised = shuffle(allActive)
    .slice(0, config.questionsPerQuiz)
    .map((q) => ({ ...q, options: shuffle(q.options) }));

  return NextResponse.json({
    started: true,
    geofence: {
      centerLat: config.centerLat,
      centerLng: config.centerLng,
      radiusMeters: config.radiusMeters
    },
    questions: randomised,
    total: randomised.length
  });
}
