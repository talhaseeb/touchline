"use client";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/db";
import { getSession } from "@/lib/auth";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Plus, Swords, Calendar, Circle } from "lucide-react";

export default function MatchesPage() {
  const session = getSession();
  const canEdit = session?.role === "ADMIN" || session?.role === "COACH";

  const matches = useLiveQuery(() => db.matches.orderBy("date").reverse().toArray(), []);
  const teams = useLiveQuery(() => db.teams.toArray(), []);
  const teamMap = Object.fromEntries((teams ?? []).map((t) => [t.id, t.name]));

  return (
    <AppShell>
      <div className="p-6 max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Matches</h1>
            <p className="text-muted-foreground">{matches?.length ?? 0} matches</p>
          </div>
          {canEdit && (
            <Link href="/matches/new">
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="w-4 h-4 mr-2" /> New Match
              </Button>
            </Link>
          )}
        </div>

        {!matches?.length ? (
          <Card className="bg-card border-border">
            <CardContent className="py-12 text-center">
              <Swords className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No matches yet</p>
              {canEdit && (
                <Link href="/matches/new">
                  <Button className="mt-4 bg-primary hover:bg-primary/90">Create First Match</Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {matches.map((m) => (
              <Link key={m.id} href={`/matches/${m.id}`}>
                <Card className="bg-card border-border hover:border-primary/40 transition-colors cursor-pointer">
                  <CardContent className="py-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
                      <Swords className="w-5 h-5 text-orange-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold">vs {teamMap[m.opponentId] ?? "Unknown"}</p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(m.date).toLocaleDateString()} · {m.formation}
                      </p>
                    </div>
                    <Badge
                      variant={m.status === "live" ? "default" : "outline"}
                      className={m.status === "live" ? "bg-primary text-white" : ""}
                    >
                      {m.status === "live" && <Circle className="w-2 h-2 mr-1 fill-current animate-pulse" />}
                      {m.status}
                    </Badge>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
