"use client";
import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/db";
import { getSession } from "@/lib/auth";
import { AppShell } from "@/components/layout/AppShell";
import { LiveMatch } from "@/components/match/LiveMatch";
import { MatchSummary } from "@/components/match/MatchSummary";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Play, Circle } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function MatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const session = getSession();
  const canEdit = session?.role === "ADMIN" || session?.role === "COACH";

  const match = useLiveQuery(() => db.matches.get(id), [id]);
  const team = useLiveQuery(
    () => match ? db.teams.get(match.opponentId) : undefined,
    [match?.opponentId]
  );

  const handleStart = async () => {
    await db.matches.update(id, {
      status: "live",
      startTime: new Date().toISOString(),
    });
    // set all starters onField
    const starters = await db.matchPlayers.where("matchId").equals(id).and((mp) => mp.starting).toArray();
    await Promise.all(starters.map((mp) => db.matchPlayers.update(mp.id, { onField: true })));
    toast.success("Match started!");
  };

  if (!match) {
    return (
      <AppShell>
        <div className="p-6 text-center text-muted-foreground">Loading match…</div>
      </AppShell>
    );
  }

  if (match.status === "live") {
    return <LiveMatch matchId={id} />;
  }

  if (match.status === "completed") {
    return <MatchSummary matchId={id} />;
  }

  // Scheduled
  return (
    <AppShell>
      <div className="p-6 max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/matches">
            <Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">vs {team?.name ?? "…"}</h1>
            <p className="text-muted-foreground">{new Date(match.date).toLocaleDateString()} · {match.formation}</p>
          </div>
          <Badge variant="outline" className="ml-auto">{match.status}</Badge>
        </div>

        {canEdit && (
          <Button
            className="w-full h-14 text-lg font-bold bg-primary hover:bg-primary/90"
            onClick={handleStart}
          >
            <Play className="w-6 h-6 mr-2" /> Start Match
          </Button>
        )}
      </div>
    </AppShell>
  );
}
