import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft } from 'lucide-react';

async function getKnowledgeBase() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/kb`, {
      cache: 'no-store',
    });
    if (!res.ok) return { total: 0, entries: [] };
    return res.json();
  } catch {
    return { total: 0, entries: [] };
  }
}

export default async function KnowledgeBasePage() {
  const { entries } = await getKnowledgeBase();

  const categories = Array.from(new Set(entries.map((e: any) => e.category as string))) as string[];

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
              <h1 className="text-3xl font-bold">Knowledge Base</h1>
              <p className="text-muted-foreground">Conversation scripts and responses</p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {categories.map((category: string) => {
            const categoryEntries = entries.filter((e: any) => e.category === category);
            return (
              <Card key={category}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Badge variant="outline">{category}</Badge>
                    <span className="text-muted-foreground text-sm font-normal">
                      ({categoryEntries.length} entries)
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {categoryEntries.map((entry: any) => (
                      <div key={entry.id} className="border rounded-lg p-4">
                        <p className="font-semibold text-sm mb-3 text-green-700">{entry.key}</p>
                        <div className="space-y-2">
                          <div>
                            <span className="text-xs font-semibold uppercase text-muted-foreground">
                              English:
                            </span>
                            <p className="text-sm mt-1">{entry.enContent}</p>
                          </div>
                          <div>
                            <span className="text-xs font-semibold uppercase text-muted-foreground">
                              Hindi:
                            </span>
                            <p className="text-sm mt-1">{entry.hiContent}</p>
                          </div>
                          <div>
                            <span className="text-xs font-semibold uppercase text-muted-foreground">
                              Hinglish:
                            </span>
                            <p className="text-sm mt-1">{entry.hinglishContent}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {entries.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">
                  No knowledge base entries found. Run the seed script to populate demo data.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </main>
  );
}
