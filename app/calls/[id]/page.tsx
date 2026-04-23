import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Clock, Phone } from 'lucide-react';
import { formatDuration, formatDate } from '@/lib/utils';

async function getCall(id: string) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/calls/${id}`, {
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function CallDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const call = await getCall(id);

  if (!call) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardHeader>
            <CardTitle>Call Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <Link href="/">
              <Button>Go to Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const topicsCovered = JSON.parse(call.topicsCovered) as string[];
  const objectionsRaised = JSON.parse(call.objectionsRaised) as string[];
  const handoffContext = call.handoffContext ? JSON.parse(call.handoffContext) : null;

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-8">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Call Summary</h1>
            <p className="text-muted-foreground">
              {call.lead.name} • {formatDate(call.startedAt)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardDescription>Duration</CardDescription>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                {call.durationSec ? formatDuration(call.durationSec) : 'In progress'}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardDescription>Language</CardDescription>
              <CardTitle>{call.language}</CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardDescription>Outcome</CardDescription>
              <CardTitle>{call.outcome || 'Ongoing'}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        {call.interestLevel && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Interest Assessment</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Interest Level</span>
                  <Badge
                    variant={
                      call.interestLevel === 'HOT'
                        ? 'destructive'
                        : call.interestLevel === 'WARM'
                        ? 'default'
                        : 'secondary'
                    }
                    className="text-lg px-4 py-1"
                  >
                    {call.interestLevel}
                  </Badge>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Interest Score</span>
                    <span className="text-sm text-muted-foreground">
                      {((call.interestScore || 0) * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        call.interestLevel === 'HOT'
                          ? 'bg-red-500'
                          : call.interestLevel === 'WARM'
                          ? 'bg-yellow-500'
                          : 'bg-blue-500'
                      }`}
                      style={{ width: `${(call.interestScore || 0) * 100}%` }}
                    />
                  </div>
                </div>

                {call.summary && (
                  <div className="pt-4 border-t">
                    <p className="text-sm font-medium mb-2">Reasoning</p>
                    <p className="text-sm text-muted-foreground">{call.summary}</p>
                  </div>
                )}

                {call.nextAction && (
                  <div className="pt-4 border-t">
                    <p className="text-sm font-medium mb-2">Next Action</p>
                    <Badge variant="outline">{call.nextAction}</Badge>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {handoffContext && (
          <Card className="mb-6 border-green-300 bg-green-50">
            <CardHeader>
              <CardTitle className="text-green-700">🎯 Handoff Context for RM</CardTitle>
              <CardDescription>Information to pass to the Relationship Manager</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                {handoffContext.primaryInterest && (
                  <div>
                    <span className="font-semibold">Primary Interest: </span>
                    <span className="text-muted-foreground">{handoffContext.primaryInterest}</span>
                  </div>
                )}
                {handoffContext.concernsAddressed && handoffContext.concernsAddressed.length > 0 && (
                  <div>
                    <span className="font-semibold">Concerns Addressed: </span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {handoffContext.concernsAddressed.map((concern: string) => (
                        <Badge key={concern} variant="secondary">
                          {concern}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {handoffContext.nextSteps && (
                  <div>
                    <span className="font-semibold">Next Steps: </span>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      {handoffContext.nextSteps.map((step: string) => (
                        <li key={step} className="text-muted-foreground">
                          {step}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Topics Covered ({topicsCovered.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {topicsCovered.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No topics covered yet</p>
                ) : (
                  topicsCovered.map((topic) => (
                    <Badge key={topic} variant="default">
                      {topic}
                    </Badge>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Objections Handled ({objectionsRaised.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {objectionsRaised.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No objections raised</p>
                ) : (
                  objectionsRaised.map((objection) => (
                    <Badge key={objection} variant="secondary">
                      {objection}
                    </Badge>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Full Transcript ({call.turns.length} turns)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {call.turns.map((turn: any) => (
                <div
                  key={turn.id}
                  className={`p-4 rounded-lg ${
                    turn.role === 'agent' ? 'bg-green-50 border border-green-200' : 'bg-gray-100'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold uppercase">
                        {turn.role === 'agent' ? '🤖 Agent' : '👤 Lead'}
                      </span>
                      {turn.intent && (
                        <Badge variant="outline" className="text-xs">
                          {turn.intent}
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(turn.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-sm">{turn.text}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
