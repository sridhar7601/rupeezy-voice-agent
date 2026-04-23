import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import type { Language } from '@/lib/prisma-types';

export async function GET(request: NextRequest) {
  try {
    const leads = await db.lead.findMany({
      include: {
        calls: {
          orderBy: { startedAt: 'desc' },
          take: 1,
          include: {
            turns: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const leadsWithSummary = leads.map((lead) => {
      const lastCall = lead.calls[0];
      return {
        ...lead,
        lastCallSummary: lastCall
          ? {
              id: lastCall.id,
              outcome: lastCall.outcome,
              interestLevel: lastCall.interestLevel,
              durationSec: lastCall.durationSec,
              startedAt: lastCall.startedAt,
            }
          : null,
      };
    });

    return NextResponse.json({
      total: leadsWithSummary.length,
      leads: leadsWithSummary,
    });
  } catch (error) {
    console.error('Error fetching leads:', error);
    return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, phone, email, language, source } = body;

    if (!name || !phone) {
      return NextResponse.json({ error: 'Name and phone are required' }, { status: 400 });
    }

    const lead = await db.lead.create({
      data: {
        name,
        phone,
        email: email || null,
        language: (language as Language) || 'ENGLISH',
        source: source || 'web',
        status: 'NEW',
      },
    });

    return NextResponse.json(lead, { status: 201 });
  } catch (error) {
    console.error('Error creating lead:', error);
    return NextResponse.json({ error: 'Failed to create lead' }, { status: 500 });
  }
}
