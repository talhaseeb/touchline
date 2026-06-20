"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/db";
import { useMatchTimer } from "@/hooks/useMatchTimer";
import { calculatePlayerStats } from "@/lib/ratings";
import { getSuggestedSubstitutes } from "@/lib/substitutions";
import { getPositionGroup, GROUP_STYLES } from "@/lib/positions";
import { PositionBadge } from "@/components/ui/PositionBadge";
import { FootballPitch } from "@/components/pitch/FootballPitch";
import type { PitchPlayer } from "@/components/pitch/FootballPitch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { nanoid } from "nanoid";
import { Pause, Play, Square, ArrowLeftRight, Clock } from "lucide-react";
import type { EventType } from "@/types";
import { POSITIVE_EVENTS, NEGATIVE_EVENTS } from "@/types";
import { cn } from "@/lib/utils";

const EVENT_ICONS: Partial<Record<EventType, string>> = {
  Goal: "⚽", Assist: "🎯", "Key Pass": "🔑", Interception: "🛡️",
  "Tackle Won": "💪", Recovery: "♻️", "Good Pass": "✅",
  "Bad Pass": "❌", "Lost Possession": "📉", "Out Of Position": "⚠️",
  "Missed Tackle": "💨", "Missed Chance": "🎯",
};

function RatingDisplay({ rating }: { rating: number }) {
  const color =
    rating >= 8 ? "text-green-400" :
    rating >= 6.5 ? "text-lime-400" :
    rating >= 5 ? "text-yellow-400" :
    rating >= 3.5 ? "text-orange-400" : "text-red-400";
  return <span className={`font-bold tabular-nums ${color}`}>{rating.toFixed(1)}</span>;
}

function EventBtn({ type, onClick }: { type: EventType; onClick: () => void }) {
  const isPos = POSITIVE_EVENTS.includes(type);
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all active:scale-95 border",
        isPos
          ? "bg-emerald-950/60 text-emerald-300 border-emerald-800 hover:bg-emerald-900/60"
          : "bg-rose-950/50 text-rose-300 border-rose-900 hover:bg-rose-900/50"
      )}
    >
      <span className="text-base leading-none">{EVENT_ICONS[type] ?? ""}</span>
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
      id: nanoid(), matchId, playerId: selectedMp.playerId,
      timestamp: timer.elapsed, type,
    });
    toast.success(`${type} recorded`, { duration: 1200 });
    setSelectedMpId(null); // auto-close after recording
  };

  const changePosition = async (newPos: string) => {
    if (!selectedMp) return;
    await db.matchPlayers.update(selectedMp.id, { position: newPos });
  };

  const performSub = async (benchMpId: string) => {
    if (!selectedMp) return;
    const subMp = (allMatchPlayers ?? []).find((mp) => mp.id === benchMpId);
    if (!subMp) return;

    await db.matchPlayers.update(selectedMp.id, { onField: false });
    await db.matchPlayers.update(subMp.id, { onField: true, position: selectedMp.position });

    await db.events.add({
      id: nanoid(), matchId,
      playerId: selectedMp.playerId,
      relatedPlayerId: subMp.playerId,
      timestamp: timer.elapsed,
      type: "Substitution",
    });

    const outName = selectedPlayer?.jerseyName ?? selectedPlayer?.lastName ?? "Player";
    const inPlayer = playerMap[subMp.playerId];
    const inName = inPlayer?.jerseyName ?? inPlayer?.lastName ?? "Player";
    toast.success(`${inName} on · ${outName} off`);
    setSelectedMpId(null);
    setSubMode(false);
  };

  const endMatch = async () => {
    await db.matches.update(matchId, { status: "completed", endTime: new Date().toISOString() });
    router.push(`/matches/${matchId}`);
  };

  const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  // Build pitch data
  const starterPitchPlayers: PitchPlayer[] = onField.map((mp) => ({
    matchPlayer: mp,
    player: playerMap[mp.playerId],
    stats: events ? calculatePlayerStats(mp.playerId, events) : null,
  })).filter((pp) => !!pp.player);

  const benchPitchPlayers: PitchPlayer[] = bench.map((mp) => ({
    matchPlayer: mp,
    player: playerMap[mp.playerId],
    stats: events ? calculatePlayerStats(mp.playerId, events) : null,
  })).filter((pp) => !!pp.player);

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">

      {/* Top bar */}
      <div className="glass-header flex items-center gap-3 px-4 py-3 shrink-0">
        <div className="flex items-center gap-2 shrink-0">
          <span className="inline-block w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="text-xs font-bold text-primary uppercase tracking-wider">Live</span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <Clock className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-2xl font-mono font-bold tabular-nums">{timer.display}</span>
        </div>
        <span className="text-sm text-muted-foreground flex-1 truncate">vs {opponent?.name}</span>
        <div className="flex gap-1.5">
          {timer.running
            ? <Button size="sm" variant="outline" className="h-9 px-3" onClick={timer.pause}><Pause className="w-4 h-4" /></Button>
            : <Button size="sm" variant="outline" className="h-9 px-3 text-primary border-primary/40" onClick={timer.resume}><Play className="w-4 h-4" /></Button>
          }
          <Button size="sm" variant="outline" className="h-9 px-3 text-xs" onClick={() => timer.addTime(300)}>+5m</Button>
          <Button size="sm" variant="destructive" className="h-9 px-3" onClick={endMatch}>
            <Square className="w-3.5 h-3.5 mr-1" />End
          </Button>
        </div>
      </div>

      {/* Main area */}
      <div className="flex flex-1 overflow-hidden">

        {/* Pitch column */}
        <div className="flex-1 overflow-auto p-3">
          <FootballPitch
            formation={match?.formation ?? "4-4-2"}
            starters={starterPitchPlayers}
            bench={benchPitchPlayers}
            onPlayerClick={(mpId) => { setSelectedMpId(mpId); setSubMode(false); }}
            selectedMpId={selectedMpId}
            showRatings
          />
        </div>

        {/* Timeline sidebar — desktop only */}
        <div className="hidden lg:flex flex-col w-60 border-l border-border/50 glass-sidebar shrink-0">
          <div className="px-3 py-2.5 border-b border-border/50">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Timeline</p>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1.5">
              {(events ?? []).map((ev) => {
                const player = playerMap[ev.playerId];
                const isPos = POSITIVE_EVENTS.includes(ev.type);
                const isSub = ev.type === "Substitution";
                const relatedPlayer = ev.relatedPlayerId ? playerMap[ev.relatedPlayerId] : null;
                return (
                  <div key={ev.id} className={cn(
                    "text-xs p-2.5 rounded-xl border",
                    isSub ? "bg-blue-950/30 border-blue-900/40" :
                    isPos ? "bg-emerald-950/30 border-emerald-900/40" :
                    "bg-rose-950/30 border-rose-900/40"
                  )}>
                    <div className="flex items-center justify-between mb-0.5">
                      <span className={cn(
                        "font-semibold",
                        isSub ? "text-blue-400" : isPos ? "text-emerald-400" : "text-rose-400"
                      )}>
                        {EVENT_ICONS[ev.type] ?? ""} {isSub ? "Sub" : ev.type}
                      </span>
                      <span className="font-mono text-muted-foreground">{fmt(ev.timestamp)}</span>
                    </div>
                    {isSub ? (
                      <p className="text-muted-foreground">
                        <span className="text-rose-400">{player?.jerseyName ?? "?"}</span>
                        {" → "}
                        <span className="text-emerald-400">{relatedPlayer?.jerseyName ?? "?"}</span>
                      </p>
                    ) : (
                      <p className="text-muted-foreground">{player?.jerseyName ?? player?.firstName ?? "Unknown"}</p>
                    )}
                  </div>
                );
              })}
              {!(events?.length) && (
                <p className="text-muted-foreground text-xs p-3 text-center">No events yet</p>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Player event sheet */}
      <Sheet open={!!selectedMpId && !subMode} onOpenChange={(o) => { if (!o) setSelectedMpId(null); }}>
        <SheetContent side="bottom" className="glass-sheet rounded-t-2xl max-h-[85vh] overflow-y-auto">
          {selectedPlayer && selectedMp && (
            <>
              <SheetHeader className="mb-5">
                <div className="flex items-center gap-4">
                  <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center ring-2 shrink-0",
                    GROUP_STYLES[getPositionGroup(selectedMp.position)].ring, "bg-card/60"
                  )}>
                    <span className="text-lg font-bold">#{selectedPlayer.jerseyNumber}</span>
                  </div>
                  <div className="flex-1">
                    <SheetTitle className="text-left text-lg">{selectedPlayer.firstName} {selectedPlayer.lastName}</SheetTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm text-muted-foreground">{selectedPlayer.jerseyName}</span>
                      <PositionBadge position={selectedMp.position} />
                    </div>
                  </div>
                  {selectedStats && (
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground mb-0.5">Rating</p>
                      <span className="text-2xl"><RatingDisplay rating={selectedStats.rating} /></span>
                    </div>
                  )}
                </div>
              </SheetHeader>

              {/* Position editor — match-only, persisted to DB */}
              <div className="flex items-center gap-3 mb-4 px-1">
                <span className="text-xs text-muted-foreground shrink-0">Position (this match)</span>
                <select
                  value={selectedMp?.position ?? ""}
                  onChange={(e) => changePosition(e.target.value)}
                  className="flex-1 text-sm font-semibold bg-white/8 border border-border/50 rounded-lg px-3 py-1.5 text-foreground outline-none focus:border-primary/50 transition-colors"
                >
                  {["GK","RB","CB","LB","RWB","LWB","CDM","CM","CAM","RM","LM","RW","LW","SS","ST","CF"].map((p) => (
                    <option key={p} value={p} style={{ background: "#0f1726" }}>{p}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-4 mb-5">
                <div>
                  <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wide mb-2">Positive Events</p>
                  <div className="flex flex-wrap gap-2">
                    {POSITIVE_EVENTS.map((type) => <EventBtn key={type} type={type} onClick={() => recordEvent(type)} />)}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-rose-400 uppercase tracking-wide mb-2">Negative Events</p>
                  <div className="flex flex-wrap gap-2">
                    {NEGATIVE_EVENTS.map((type) => <EventBtn key={type} type={type} onClick={() => recordEvent(type)} />)}
                  </div>
                </div>
              </div>

              <Separator className="mb-4" />

              <Button
                variant="outline"
                className="w-full h-11 border-primary/30 text-primary hover:bg-primary/10 font-semibold"
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
        <SheetContent side="bottom" className="glass-sheet rounded-t-2xl max-h-[75vh] overflow-y-auto">
          <SheetHeader className="mb-4">
            <SheetTitle>
              Substitute for {selectedPlayer?.jerseyName ?? selectedPlayer?.firstName}
            </SheetTitle>
            <p className="text-sm text-muted-foreground">
              Select the player coming on · sorted by position match
            </p>
          </SheetHeader>
          <div className="space-y-2">
            {suggestions.length === 0 && (
              <p className="text-muted-foreground text-sm text-center py-6">No bench players available</p>
            )}
            {suggestions.map(({ player, matchPlayer, reason }) => (
              <button
                key={matchPlayer.id}
                onClick={() => performSub(matchPlayer.id)}
                className="w-full flex items-center gap-3 p-3.5 rounded-xl border border-border/50 hover:border-primary/50 hover:bg-primary/5 bg-white/4 transition-all text-left active:scale-[0.99]"
              >
                <div className="w-11 h-11 rounded-full bg-secondary flex items-center justify-center shrink-0">
                  <span className="text-sm font-bold">#{player.jerseyNumber}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold">{player.firstName} {player.lastName}</p>
                  <p className="text-sm text-muted-foreground">{player.jerseyName}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <PositionBadge position={player.primaryPosition} />
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-xs font-medium",
                      reason === "Same Position" ? "border-emerald-600 text-emerald-400 bg-emerald-950/30" :
                      reason === "Secondary Position" ? "border-amber-600 text-amber-400 bg-amber-950/30" :
                      "border-border text-muted-foreground"
                    )}
                  >
                    {reason}
                  </Badge>
                </div>
              </button>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
