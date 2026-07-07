import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAuthenticated } from '@/lib/auth';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const config = await prisma.config.findUnique({
    where: { id: 1 },
    select: { quizStarted: true }
  });
  return NextResponse.json({ started: config?.quizStarted ?? false });
}

const schema = z.object({ started: z.boolean() });

export async function POST(req: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
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

  const config = await prisma.config.upsert({
    where: { id: 1 },
    update: { quizStarted: parsed.data.started },
    create: { id: 1, quizStarted: parsed.data.started },
    select: { quizStarted: true }
  });

  return NextResponse.json({ started: config.quizStarted });
}
