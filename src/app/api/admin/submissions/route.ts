import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAuthenticated } from '@/lib/auth';
import type { Prisma } from '@prisma/client';

export const dynamic = 'force-dynamic';

/**
 * Lists submissions for the admin overview. Intentionally exposes only
 * registration data + pass/fail + score — never the individual answers given.
 */
export async function GET(req: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const result = searchParams.get('result'); // 'passed' | 'failed' | null
  const search = searchParams.get('search')?.trim();

  const where: Prisma.SubmissionWhereInput = {
    ...(result === 'passed'
      ? { passed: true }
      : result === 'failed'
        ? { passed: false }
        : {}),
    ...(search
      ? {
          OR: [
            { firstName: { contains: search, mode: 'insensitive' } },
            { lastName: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
            { phone: { contains: search, mode: 'insensitive' } }
          ]
        }
      : {})
  };

  const [submissions, passedCount, totalCount] = await Promise.all([
    prisma.submission.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        passed: true,
        score: true,
        total: true,
        createdAt: true
      }
    }),
    prisma.submission.count({ where: { passed: true } }),
    prisma.submission.count()
  ]);

  return NextResponse.json({
    submissions,
    stats: { passed: passedCount, total: totalCount }
  });
}
