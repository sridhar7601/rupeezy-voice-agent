import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Phone, ArrowLeft } from 'lucide-react';

async function getLeads() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/leads`, {
      cache: 'no-store',
    });
    if (!res.ok) return { total: 0, leads: [] };
    return res.json();
  } catch {
    return { total: 0, leads: [] };
  }
}

export default async function LeadsPage() {
  const { leads } = await getLeads();

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">Leads</h1>
              <p className="text-muted-foreground">Manage your partner leads</p>
            </div>
          </div>
          <Button>Add Lead</Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Leads ({leads.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {leads.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No leads found. Run the seed script to populate demo data.
                </p>
              ) : (
                leads.map((lead: any) => (
                  <div
                    key={lead.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <p className="font-semibold">{lead.name}</p>
                        <Badge variant="outline">{lead.language}</Badge>
                        <Badge
                          variant={
                            lead.status === 'QUALIFIED'
                              ? 'default'
                              : lead.status === 'HANDED_OFF'
                              ? 'destructive'
                              : 'secondary'
                          }
                        >
                          {lead.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {lead.phone} • {lead.source || 'Unknown source'}
                      </p>
                      {lead.lastCallSummary && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Last call: {lead.lastCallSummary.interestLevel || 'In progress'} •{' '}
                          {lead.lastCallSummary.durationSec
                            ? `${Math.floor(lead.lastCallSummary.durationSec / 60)}m ${lead.lastCallSummary.durationSec % 60}s`
                            : 'Ongoing'}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {lead.lastCallSummary && (
                        <Link href={`/calls/${lead.lastCallSummary.id}`}>
                          <Button variant="outline" size="sm">
                            View Call
                          </Button>
                        </Link>
                      )}
                      <Link href={`/call/${lead.id}`}>
                        <Button size="sm">
                          <Phone className="mr-2 h-4 w-4" />
                          Call Now
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
