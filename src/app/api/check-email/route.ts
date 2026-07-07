import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rateLimit, clientIp } from '@/lib/rateLimit';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const schema = z.object({ email: z.string().trim().email().max(160) });

/**
 * Reports whether an email has already been used for a submission, so the
 * client can reject a duplicate at registration time (before the quiz).
 */
export async function POST(req: NextRequest) {
  const limit = rateLimit(`check-email:${clientIp(req)}`, 30, 60_000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: 'rate_limited' },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfter) } }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'validation_failed' }, { status: 400 });
  }

  const existing = await prisma.submission.findUnique({
    where: { email: parsed.data.email.toLowerCase() },
    select: { id: true }
  });

  return NextResponse.json({ available: !existing });
}
