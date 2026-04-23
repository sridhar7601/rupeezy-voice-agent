import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import type { Language } from '@/lib/prisma-types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { leads } = body;

    if (!Array.isArray(leads) || leads.length === 0) {
      return NextResponse.json({ error: 'Invalid leads array' }, { status: 400 });
    }

    const created = await db.lead.createMany({
      data: leads.map((lead: any) => ({
        name: lead.name,
        phone: lead.phone,
        email: lead.email || null,
        language: (lead.language as Language) || 'ENGLISH',
        source: lead.source || 'bulk_upload',
        status: 'NEW',
      })),
    });

    return NextResponse.json({ created: created.count }, { status: 201 });
  } catch (error) {
    console.error('Error bulk creating leads:', error);
    return NextResponse.json({ error: 'Failed to create leads' }, { status: 500 });
  }
}
