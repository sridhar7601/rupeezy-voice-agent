import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateFunnelBriefing } from '@/lib/llm-conversation';

export async function GET() {
  try {
    const totalLeads = await db.lead.count();
    const contactedLeads = await db.lead.count({
      where: { status: { in: ['CONTACTED', 'QUALIFIED', 'HANDED_OFF'] } },
    });
    const qualifiedLeads = await db.lead.count({
      where: { status: { in: ['QUALIFIED', 'HANDED_OFF'] } },
    });
    const handedOffLeads = await db.lead.count({ where: { status: 'HANDED_OFF' } });

    const hotCalls = await db.call.count({ where: { interestLevel: 'HOT' } });
    const warmCalls = await db.call.count({ where: { interestLevel: 'WARM' } });
    const coldCalls = await db.call.count({ where: { interestLevel: 'COLD' } });

    const langGroup = await db.call.groupBy({
      by: ['language'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 1,
    });

    const recentCalls = await db.call.findMany({
      take: 10,
      orderBy: { startedAt: 'desc' },
      include: { lead: true },
    });

    const conversionRate = totalLeads > 0 ? handedOffLeads / totalLeads : 0;

    const aiBriefing = await generateFunnelBriefing({
      totalLeads,
      contacted: contactedLeads,
      qualified: qualifiedLeads,
      handedToRm: handedOffLeads,
      hot: hotCalls,
      warm: warmCalls,
      cold: coldCalls,
      topLanguage: langGroup[0]?.language,
      topLanguageCount: langGroup[0]?._count.id,
      conversionRate,
    });

    return NextResponse.json({
      funnel: {
        totalLeads,
        contactedLeads,
        qualifiedLeads,
        handedOffLeads,
      },
      interestBreakdown: { hot: hotCalls, warm: warmCalls, cold: coldCalls },
      recentCalls,
      aiBriefing,
      conversionRate,
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 });
  }
}
