import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAuthenticated } from '@/lib/auth';
import { questionSchema } from '@/lib/validation';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, { params }: Params) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const { id } = await params;

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

  const existing = await prisma.question.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  const { text, category, type, active, order, options } = parsed.data;

  // Replace options wholesale to keep the update simple and predictable.
  const question = await prisma.$transaction(async (tx) => {
    await tx.option.deleteMany({ where: { questionId: id } });
    return tx.question.update({
      where: { id },
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
  });

  return NextResponse.json({ question });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  const existing = await prisma.question.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  await prisma.question.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
