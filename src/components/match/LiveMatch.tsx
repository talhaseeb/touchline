"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/db";
import { useMatchTimer } from "@/hooks/useMatchTimer";
import { calculatePlayerStats } from "@/lib/ratings";
import { getSuggestedSubstitutes } from "@/lib/substitutions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { nanoid } from "nanoid";
import { Pause, Play, Plus, Square, ArrowLeftRight, Circle } from "lucide-react";
import type { EventType, Player, MatchPlayer } from "@/types";
import { POSITIVE_EVENTS, NEGATIVE_EVENTS, EVENT_WEIGHTS } from "@/types";
import { cn } from "@/lib/utils";

function RatingBadge({ rating }: { rating: number }) {
  const color =
    rating >= 8 ? "text-green-400" :
    rating >= 6.5 ? "text-lime-400" :
    rating >= 5 ? "text-yellow-400" :
    rating >= 3.5 ? "text-orange-400" : "text-red-400";
  return <span className={`font-bold text-lg ${color}`}>{rating.toFixed(1)}</span>;
}

function EventButton({ type, onClick }: { type: EventType; onClick: () => void }) {
  const isPositive = POSITIVE_EVENTS.includes(type);
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-3 py-2 rounded-lg text-sm font-medium transition-all active:scale-95",
        isPositive
          ? "bg-green-900/50 text-green-300 hover:bg-green-800/60 border border-green-800"
          : "bg-red-900/40 text-red-300 hover:bg-red-800/50 border border-red-900"
      )}
    >
      {type}
    </button>
  );
}

export function LiveMatch({ matchId }: { matchId: string }) {
  const router = useRouter();
  const timer = useMatchTimer(true);
  const [selectedMpId, setSelectedMpId] = useState<string | null>(null);
  const [subMode, setSubMode] = useState(false);

  const match = useLiveQuery(() => db.matches.get(matchId), [matchId]);
  const allMatchPlayers = useLiveQuery(() => db.matchPlayers.where("matchId").equals(matchId).toArray(), [matchId]);
  const allPlayers = useLiveQuery(() => db.players.toArray(), []);
  const events = useLiveQuery(() => db.events.where("matchId").equals(matchId).reverse().sortBy("timestamp"), [matchId]);
  const opponent = useLiveQuery(() => match ? db.teams.get(match.opponentId) : undefined, [match?.opponentId]);

  const onField = (allMatchPlayers ?? []).filter((mp) => mp.onField);
  const bench = (allMatchPlayers ?? []).filter((mp) => !mp.onField);

  const playerMap = Object.fromEntries((allPlayers ?? []).map((p) => [p.id, p]));

  const selectedMp = selectedMpId ? (allMatchPlayers ?? []).find((mp) => mp.id === selectedMpId) : null;
  const selectedPlayer = selectedMp ? playerMap[selectedMp.playerId] : null;
  const selectedStats = selectedMp && events
    ? calculatePlayerStats(selectedMp.playerId, events)
    : null;

  const suggestions = selectedMp && selectedPlayer && allMatchPlayers && allPlayers
    ? getSuggestedSubstitutes(selectedPlayer, selectedMp, allMatchPlayers, allPlayers)
    : [];

  const recordEvent = async (type: EventType) => {
    if (!selectedMp) return;
    await db.events.add({
      id: nanoid(),
      matchId,
      playerId: selectedMp.playerId,
      timestamp: timer.elapsed,
      type,
    });
    toast.success(`${type} recorded`, { duration: 1500 });
  };

  const performSub = async (benchMpId: string) => {
    if (!selectedMp) return;
    const subMp = (allMatchPlayers ?? []).find((mp) => mp.id === benchMpId);
    if (!subMp) return;
    // Swap
    await db.matchPlayers.update(selectedMp.id, { onField: false });
    await db.matchPlayers.update(subMp.id, { onField: true, position: selectedMp.position });
    // Record substitution events
    await db.events.add({ id: nanoid(), matchId, playerId: selectedMp.playerId, timestamp: timer.elapsed, type: "Out Of Position" as EventType, notes: "Substituted off" });
    setSelectedMpId(null);
    setSubMode(false);
    const subPlayer = playerMap[subMp.playerId];
    const offPlayer = selectedPlayer;
    toast.success(`${subPlayer?.firstName} on, ${offPlayer?.firstName} off`);
  };

  const endMatch = async () => {
    await db.matches.update(matchId, { status: "completed", endTime: new Date().toISOString() });
    router.push(`/matches/${matchId}`);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 py-3 bg-card border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <Circle className="w-3 h-3 fill-primary text-primary animate-pulse" />
          <span className="text-xs font-semibold text-primary uppercase">Live</span>
        </div>
        <div className="text-2xl font-mono font-bold tabular-nums">{timer.display}</div>
        <span className="text-muted-foreground text-sm flex-1">vs {opponent?.name}</span>
        <div className="flex gap-2">
          {timer.running ? (
            <Button size="sm" variant="outline" className="h-9" onClick={timer.pause}><Pause className="w-4 h-4" /></Button>
          ) : (
            <Button size="sm" variant="outline" className="h-9" onClick={timer.resume}><Play className="w-4 h-4" /></Button>
          )}
          <Button size="sm" variant="outline" className="h-9" onClick={() => timer.addTime(300)}>+5m</Button>
          <Button size="sm" variant="destructive" className="h-9" onClick={endMatch}><Square className="w-4 h-4 mr-1" />End</Button>
        </div>
      </div>

      {/* Main area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Pitch */}
        <div className="flex-1 overflow-auto p-3">
          {/* On field players */}
          <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
            {onField.map((mp) => {
              const player = playerMap[mp.playerId];
              if (!player) return null;
              const stats = events ? calculatePlayerStats(mp.playerId, events) : null;
              return (
                <button
                  key={mp.id}
                  onClick={() => { setSelectedMpId(mp.id); setSubMode(false); }}
                  className={cn(
                    "flex flex-col items-center gap-1 p-3 rounded-xl border transition-all active:scale-95",
                    selectedMpId === mp.id
                      ? "border-primary bg-primary/10"
                      : "border-border bg-card hover:border-primary/50"
                  )}
                >
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                    <span className="text-sm font-bold text-white">#{player.jerseyNumber}</span>
                  </div>
                  <span className="text-xs font-semibold text-center leading-tight">{player.jerseyName || `${player.firstName} ${player.lastName[0]}.`}</span>
                  <span className="text-xs text-muted-foreground">{mp.position}</span>
                  {stats && <RatingBadge rating={stats.rating} />}
                </button>
              );
            })}
          </div>

          <Separator className="my-3" />

          {/* Bench */}
          <p className="text-xs text-muted-foreground uppercase font-semibold mb-2">Bench</p>
          <div className="flex flex-wrap gap-2">
            {bench.map((mp) => {
              const player = playerMap[mp.playerId];
              if (!player) return null;
              return (
                <div
                  key={mp.id}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted border border-border"
                >
                  <span className="text-xs font-bold text-muted-foreground">#{player.jerseyNumber}</span>
                  <span className="text-xs">{player.jerseyName || `${player.firstName} ${player.lastName[0]}.`}</span>
                  <Badge variant="outline" className="text-xs">{player.primaryPosition}</Badge>
                </div>
              );
            })}
            {bench.length === 0 && <p className="text-xs text-muted-foreground">No bench players</p>}
          </div>
        </div>

        {/* Timeline sidebar */}
        <div className="hidden lg:flex flex-col w-56 border-l border-border bg-card">
          <p className="text-xs text-muted-foreground uppercase font-semibold px-3 py-2 border-b border-border">Timeline</p>
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1.5">
              {(events ?? []).map((ev) => {
                const player = playerMap[ev.playerId];
                const isPos = POSITIVE_EVENTS.includes(ev.type);
                return (
                  <div key={ev.id} className="text-xs p-2 rounded bg-muted">
                    <span className="font-mono text-muted-foreground">{formatTime(ev.timestamp)} </span>
                    <span className={isPos ? "text-green-400" : "text-red-400"}>
                      {ev.type}
                    </span>
                    <br />
                    <span className="text-muted-foreground">
                      {player ? (player.jerseyName || `${player.firstName} ${player.lastName[0]}.`) : "Unknown"}
                    </span>
                  </div>
                );
              })}
              {!(events?.length) && <p className="text-muted-foreground text-xs p-2">No events yet</p>}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Player event sheet */}
      <Sheet open={!!selectedMpId && !subMode} onOpenChange={(o) => { if (!o) setSelectedMpId(null); }}>
        <SheetContent side="bottom" className="bg-card border-border h-auto max-h-[85vh] overflow-y-auto rounded-t-2xl">
          {selectedPlayer && selectedMp && (
            <>
              <SheetHeader className="mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
                    <span className="font-bold text-white">#{selectedPlayer.jerseyNumber}</span>
                  </div>
                  <div>
                    <SheetTitle className="text-left">{selectedPlayer.firstName} {selectedPlayer.lastName}</SheetTitle>
                    <p className="text-sm text-muted-foreground">{selectedMp.position}</p>
                  </div>
                  {selectedStats && (
                    <div className="ml-auto">
                      <RatingBadge rating={selectedStats.rating} />
                    </div>
                  )}
                </div>
              </SheetHeader>

              <div className="space-y-3 mb-4">
                <p className="text-xs font-semibold text-green-400 uppercase">Positive</p>
                <div className="flex flex-wrap gap-2">
                  {POSITIVE_EVENTS.map((type) => (
                    <EventButton key={type} type={type} onClick={() => recordEvent(type)} />
                  ))}
                </div>
                <p className="text-xs font-semibold text-red-400 uppercase">Negative</p>
                <div className="flex flex-wrap gap-2">
                  {NEGATIVE_EVENTS.map((type) => (
                    <EventButton key={type} type={type} onClick={() => recordEvent(type)} />
                  ))}
                </div>
              </div>

              <Separator className="mb-3" />

              <Button
                variant="outline"
                className="w-full border-primary/40 text-primary"
                onClick={() => setSubMode(true)}
              >
                <ArrowLeftRight className="w-4 h-4 mr-2" /> Substitute Player
              </Button>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Substitution sheet */}
      <Sheet open={!!selectedMpId && subMode} onOpenChange={(o) => { if (!o) { setSubMode(false); setSelectedMpId(null); } }}>
        <SheetContent side="bottom" className="bg-card border-border h-auto max-h-[70vh] overflow-y-auto rounded-t-2xl">
          <SheetHeader className="mb-4">
            <SheetTitle>Substitute for {selectedPlayer?.firstName} {selectedPlayer?.lastName}</SheetTitle>
          </SheetHeader>
          <div className="space-y-2">
            {suggestions.length === 0 && <p className="text-muted-foreground text-sm">No bench players available</p>}
            {suggestions.map(({ player, matchPlayer, reason }) => (
              <button
                key={matchPlayer.id}
                onClick={() => performSub(matchPlayer.id)}
                className="w-full flex items-center gap-3 p-3 rounded-xl border border-border hover:border-primary/50 bg-muted transition-all text-left"
              >
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center shrink-0">
                  <span className="text-sm font-bold">#{player.jerseyNumber}</span>
                </div>
                <div className="flex-1">
                  <p className="font-medium">{player.firstName} {player.lastName}</p>
                  <p className="text-sm text-muted-foreground">{player.primaryPosition}</p>
                </div>
                <Badge
                  variant="outline"
                  className={cn(
                    "text-xs",
                    reason === "Same Position" ? "border-green-600 text-green-400" :
                    reason === "Secondary Position" ? "border-yellow-600 text-yellow-400" :
                    "border-border"
                  )}
                >
                  {reason}
                </Badge>
              </button>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
