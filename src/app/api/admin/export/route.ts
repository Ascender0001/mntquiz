import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAuthenticated } from '@/lib/auth';

export const dynamic = 'force-dynamic';

function csvEscape(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * CSV export of successful participants only.
 * Columns: first_name, last_name, email, phone, passed_at.
 */
export async function GET() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const rows = await prisma.submission.findMany({
    where: { passed: true },
    orderBy: { createdAt: 'asc' },
    select: {
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      createdAt: true
    }
  });

  const header = ['first_name', 'last_name', 'email', 'phone', 'passed_at'];
  const lines = [header.join(',')];

  for (const r of rows) {
    lines.push(
      [
        csvEscape(r.firstName),
        csvEscape(r.lastName),
        csvEscape(r.email),
        csvEscape(r.phone ?? ''),
        csvEscape(r.createdAt.toISOString())
      ].join(',')
    );
  }

  // Prepend UTF-8 BOM so Excel renders Hungarian/Serbian characters correctly.
  const body = '﻿' + lines.join('\r\n') + '\r\n';

  return new NextResponse(body, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="palic-quiz-participants.csv"'
    }
  });
}
