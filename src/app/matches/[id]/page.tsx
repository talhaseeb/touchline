"use client";
import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/db";
import { getSession } from "@/lib/auth";
import { AppShell } from "@/components/layout/AppShell";
import { LiveMatch } from "@/components/match/LiveMatch";
import { MatchSummary } from "@/components/match/MatchSummary";
import { FootballPitch } from "@/components/pitch/FootballPitch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Play, Users } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import type { PitchPlayer } from "@/components/pitch/FootballPitch";

export default function MatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const session = getSession();
  const canEdit = session?.role === "ADMIN" || session?.role === "COACH";

  const match = useLiveQuery(() => db.matches.get(id), [id]);
  const team = useLiveQuery(
    () => match ? db.teams.get(match.opponentId) : undefined,
    [match?.opponentId]
  );
  const matchPlayers = useLiveQuery(
    () => db.matchPlayers.where("matchId").equals(id).toArray(),
    [id]
  );
  const allPlayers = useLiveQuery(() => db.players.toArray(), []);

  const handleStart = async () => {
    await db.matches.update(id, {
      status: "live",
      startTime: new Date().toISOString(),
    });
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

  // Build pitch data
  const playerMap = Object.fromEntries((allPlayers ?? []).map((p) => [p.id, p]));
  const starters: PitchPlayer[] = (matchPlayers ?? [])
    .filter((mp) => mp.starting)
    .map((mp) => ({ matchPlayer: mp, player: playerMap[mp.playerId] }))
    .filter((pp) => !!pp.player);
  const benchList: PitchPlayer[] = (matchPlayers ?? [])
    .filter((mp) => !mp.starting)
    .map((mp) => ({ matchPlayer: mp, player: playerMap[mp.playerId] }))
    .filter((pp) => !!pp.player);

  // Scheduled preview
  return (
    <AppShell>
      <div className="p-4 max-w-lg mx-auto pb-8">
        <div className="flex items-center gap-3 mb-5">
          <Link href="/matches">
            <Button variant="ghost" size="icon" className="h-9 w-9"><ArrowLeft className="w-5 h-5" /></Button>
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold truncate">vs {team?.name ?? "…"}</h1>
            <p className="text-muted-foreground text-sm">
              {new Date(match.date).toLocaleDateString()} · {match.formation}
            </p>
          </div>
          <Badge variant="outline" className="shrink-0 capitalize">{match.status}</Badge>
        </div>

        {/* Pitch preview */}
        {starters.length > 0 ? (
          <div className="glass-card rounded-2xl p-3 mb-5">
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Starting XI · {match.formation}
              </span>
            </div>
            <FootballPitch
              formation={match.formation}
              starters={starters}
              bench={benchList}
            />
          </div>
        ) : (
          <div className="glass-card rounded-2xl p-6 mb-5 text-center">
            <p className="text-muted-foreground text-sm">No lineup set yet</p>
          </div>
        )}

        {canEdit && (
          <Button
            className="w-full h-14 text-lg font-bold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25"
            onClick={handleStart}
          >
            <Play className="w-6 h-6 mr-2" /> Start Match
          </Button>
        )}
      </div>
    </AppShell>
  );
}
