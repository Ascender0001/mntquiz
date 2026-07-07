import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAuthenticated } from '@/lib/auth';
import { questionSchema } from '@/lib/validation';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search')?.trim();
  const status = searchParams.get('status'); // 'active' | 'inactive' | null
  const category = searchParams.get('category')?.trim();

  const questions = await prisma.question.findMany({
    where: {
      ...(search ? { text: { contains: search, mode: 'insensitive' } } : {}),
      ...(status === 'active'
        ? { active: true }
        : status === 'inactive'
          ? { active: false }
          : {}),
      ...(category ? { category } : {})
    },
    orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    include: { options: { orderBy: { order: 'asc' } } }
  });

  return NextResponse.json({ questions });
}

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

  const parsed = questionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'validation_failed', issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { text, category, type, active, order, options } = parsed.data;

  const question = await prisma.question.create({
    data: {
      text,
      category: category || null,
      type,
      active,
      order,
      options: {
        create: options.map((o, idx) => ({
          text: o.text,
          isCorrect: o.isCorrect,
          order: idx
        }))
      }
    },
    include: { options: { orderBy: { order: 'asc' } } }
  });

  return NextResponse.json({ question }, { status: 201 });
}
