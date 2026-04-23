import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Phone, Users, TrendingUp, CheckCircle, Clock } from 'lucide-react';

async function getDashboardData() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/dashboard/funnel`, {
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function Dashboard() {
  const data = await getDashboardData();

  const funnel = data?.funnel || {
    totalLeads: 0,
    contactedLeads: 0,
    qualifiedLeads: 0,
    handedOffLeads: 0,
  };

  const interest = data?.interestBreakdown || { hot: 0, warm: 0, cold: 0 };
  const recentCalls = data?.recentCalls || [];

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-green-600">RupeeSpeak Dashboard</h1>
            <p className="text-gray-600 mt-2">AI voice agent for partner lead conversion</p>
          </div>
          <div className="flex gap-4">
            <Link href="/leads">
              <Button variant="outline">
                <Users className="mr-2 h-4 w-4" />
                View Leads
              </Button>
            </Link>
            <Link href="/kb">
              <Button variant="secondary">Knowledge Base</Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Leads</CardDescription>
              <CardTitle className="text-3xl">{funnel.totalLeads}</CardTitle>
            </CardHeader>
            <CardContent>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Contacted</CardDescription>
              <CardTitle className="text-3xl">{funnel.contactedLeads}</CardTitle>
            </CardHeader>
            <CardContent>
              <Phone className="h-4 w-4 text-muted-foreground" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Qualified</CardDescription>
              <CardTitle className="text-3xl">{funnel.qualifiedLeads}</CardTitle>
            </CardHeader>
            <CardContent>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Handed Off</CardDescription>
              <CardTitle className="text-3xl">{funnel.handedOffLeads}</CardTitle>
            </CardHeader>
            <CardContent>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-red-50 border-red-200">
            <CardHeader>
              <CardTitle className="text-red-700">🔥 Hot Leads</CardTitle>
              <CardDescription className="text-5xl font-bold text-red-600">
                {interest.hot}
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-yellow-50 border-yellow-200">
            <CardHeader>
              <CardTitle className="text-yellow-700">⚡ Warm Leads</CardTitle>
              <CardDescription className="text-5xl font-bold text-yellow-600">
                {interest.warm}
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-blue-700">❄️ Cold Leads</CardTitle>
              <CardDescription className="text-5xl font-bold text-blue-600">
                {interest.cold}
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Calls</CardTitle>
            <CardDescription>Latest call activity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentCalls.length === 0 ? (
                <p className="text-muted-foreground">No calls yet. Start calling leads!</p>
              ) : (
                recentCalls.map((call: any) => (
                  <div
                    key={call.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div>
                      <p className="font-semibold">{call.lead.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {call.language} • {call.durationSec ? `${Math.floor(call.durationSec / 60)}:${(call.durationSec % 60).toString().padStart(2, '0')}` : 'In progress'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {call.interestLevel && (
                        <Badge
                          variant={
                            call.interestLevel === 'HOT'
                              ? 'destructive'
                              : call.interestLevel === 'WARM'
                              ? 'default'
                              : 'secondary'
                          }
                        >
                          {call.interestLevel}
                        </Badge>
                      )}
                      <Link href={`/calls/${call.id}`}>
                        <Button variant="outline" size="sm">
                          View
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
