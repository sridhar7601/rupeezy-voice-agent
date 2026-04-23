'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mic, MicOff, Phone, PhoneOff, Loader2 } from 'lucide-react';

interface ConversationState {
  language: string;
  topicsCovered: string[];
  objectionsRaised: string[];
  lastLeadIntent: string | null;
  leadEngagement: number;
  turnCount: number;
}

interface Turn {
  role: string;
  text: string;
  intent?: string | null;
  timestamp: string;
}

export default function CallPage() {
  const params = useParams();
  const router = useRouter();
  const leadId = params.leadId as string;

  const [lead, setLead] = useState<any>(null);
  const [callId, setCallId] = useState<string | null>(null);
  const [conversationState, setConversationState] = useState<ConversationState | null>(null);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLead();
  }, [leadId]);

  const fetchLead = async () => {
    try {
      const res = await fetch(`/api/leads`);
      const data = await res.json();
      const foundLead = data.leads.find((l: any) => l.id === leadId);
      if (foundLead) {
        setLead(foundLead);
      } else {
        setError('Lead not found');
      }
    } catch (err) {
      setError('Failed to fetch lead');
    }
  };

  const startCall = async () => {
    try {
      setIsProcessing(true);
      setError(null);
      const res = await fetch('/api/calls/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId,
          language: lead.language || 'ENGLISH',
        }),
      });

      if (!res.ok) throw new Error('Failed to start call');

      const data = await res.json();
      setCallId(data.callId);
      setConversationState(data.conversationState);
      setTurns([
        {
          role: 'agent',
          text: data.openingScript,
          timestamp: new Date().toISOString(),
        },
      ]);

      speak(data.openingScript);
    } catch (err) {
      setError('Failed to start call');
    } finally {
      setIsProcessing(false);
    }
  };

  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lead?.language === 'HINDI' ? 'hi-IN' : 'en-IN';
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleMicClick = () => {
    if (isListening) {
      setIsListening(false);
      if (transcript) {
        sendLeadResponse(transcript);
        setTranscript('');
      }
    } else {
      setIsListening(true);
      setTranscript('');
    }
  };

  const sendLeadResponse = async (text: string) => {
    if (!callId || !text.trim()) return;

    try {
      setIsProcessing(true);
      const newTurn: Turn = {
        role: 'lead',
        text,
        timestamp: new Date().toISOString(),
      };
      setTurns((prev) => [...prev, newTurn]);

      const res = await fetch(`/api/calls/${callId}/turn`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'lead', text }),
      });

      if (!res.ok) throw new Error('Failed to send response');

      const data = await res.json();

      if (data.agentResponse) {
        setTurns((prev) => [
          ...prev,
          {
            role: 'agent',
            text: data.agentResponse.text,
            intent: data.agentResponse.turn.intent,
            timestamp: data.agentResponse.turn.timestamp,
          },
        ]);

        speak(data.agentResponse.text);

        if (data.conversationState) {
          setConversationState(data.conversationState);
        }

        if (data.agentResponse.shouldClose) {
          setTimeout(() => endCall(), 3000);
        }
      }
    } catch (err) {
      setError('Failed to process response');
    } finally {
      setIsProcessing(false);
    }
  };

  const endCall = async () => {
    if (!callId) return;

    try {
      setIsProcessing(true);
      const res = await fetch(`/api/calls/${callId}/end`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ outcome: 'COMPLETED' }),
      });

      if (!res.ok) throw new Error('Failed to end call');

      const data = await res.json();
      router.push(`/calls/${callId}`);
    } catch (err) {
      setError('Failed to end call');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!lead) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    );
  }

  if (!callId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Start Call with {lead.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Phone: {lead.phone}</p>
                <p className="text-sm text-muted-foreground">Language: {lead.language}</p>
                <p className="text-sm text-muted-foreground">Status: {lead.status}</p>
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <Button onClick={startCall} disabled={isProcessing} className="w-full">
                {isProcessing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Phone className="mr-2 h-4 w-4" />
                )}
                Start Call
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Voice Interface</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col items-center justify-center space-y-6 py-8">
                <div className="text-center">
                  <p className="text-2xl font-bold">{lead.name}</p>
                  <p className="text-muted-foreground">{lead.language}</p>
                </div>

                <button
                  onClick={handleMicClick}
                  disabled={isProcessing}
                  className={`relative w-32 h-32 rounded-full flex items-center justify-center transition-all ${
                    isListening
                      ? 'bg-red-500 hover:bg-red-600 animate-pulse'
                      : 'bg-green-600 hover:bg-green-700'
                  } disabled:opacity-50`}
                >
                  {isListening ? (
                    <MicOff className="h-12 w-12 text-white" />
                  ) : (
                    <Mic className="h-12 w-12 text-white" />
                  )}
                </button>

                <p className="text-sm text-muted-foreground text-center">
                  {isListening
                    ? 'Listening... Click to stop'
                    : isProcessing
                    ? 'Processing...'
                    : 'Click mic to speak'}
                </p>

                {isListening && (
                  <div className="w-full p-4 border rounded-lg bg-gray-50">
                    <p className="text-sm">{transcript || 'Start speaking...'}</p>
                  </div>
                )}

                <div className="w-full pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Engagement</span>
                    <span className="text-sm text-muted-foreground">
                      {((conversationState?.leadEngagement || 0) * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full transition-all"
                      style={{
                        width: `${(conversationState?.leadEngagement || 0) * 100}%`,
                      }}
                    />
                  </div>
                </div>

                <Button onClick={endCall} variant="destructive" disabled={isProcessing}>
                  <PhoneOff className="mr-2 h-4 w-4" />
                  End Call
                </Button>
              </div>

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Live Transcript</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {turns.map((turn, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg ${
                      turn.role === 'agent' ? 'bg-green-50 border border-green-200' : 'bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold uppercase">
                        {turn.role === 'agent' ? '🤖 Agent' : '👤 Lead'}
                      </span>
                      {turn.intent && (
                        <Badge variant="outline" className="text-xs">
                          {turn.intent}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm">{turn.text}</p>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-6 border-t space-y-4">
                <div>
                  <p className="text-sm font-medium mb-2">Topics Covered</p>
                  <div className="flex flex-wrap gap-2">
                    {conversationState?.topicsCovered.map((topic) => (
                      <Badge key={topic} variant="default">
                        {topic}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium mb-2">Objections Handled</p>
                  <div className="flex flex-wrap gap-2">
                    {conversationState?.objectionsRaised.map((objection) => (
                      <Badge key={objection} variant="secondary">
                        {objection}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
