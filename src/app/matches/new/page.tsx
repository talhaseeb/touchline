"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/db";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { nanoid } from "nanoid";
import { FORMATIONS } from "@/types";
import type { MatchPlayer, Player } from "@/types";
import { POSITION_GROUPS, GROUP_STYLES, getPositionGroup } from "@/lib/positions";
import { PositionBadge } from "@/components/ui/PositionBadge";
import { ArrowLeft, ChevronRight, X, Check, UserMinus } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const FORMATION_KEYS = Object.keys(FORMATIONS);

export default function NewMatchPage() {
  const router = useRouter();
  const teams = useLiveQuery(() => db.teams.orderBy("name").toArray(), []);
  const players = useLiveQuery(() => db.players.orderBy("jerseyNumber").toArray(), []);

  const [opponentId, setOpponentId] = useState("");
  const [formation, setFormation] = useState("4-4-2");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedStarters, setSelectedStarters] = useState<string[]>([]);
  const [starterPositions, setStarterPositions] = useState<Record<string, string>>({});
  const [excludedFromBench, setExcludedFromBench] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const formationPositions = FORMATIONS[formation]?.positions ?? [];
  const starterSet = new Set(selectedStarters);

  // Auto-bench: all non-starters who haven't been explicitly removed
  const benchPlayers = (players ?? []).filter((p) => !starterSet.has(p.id) && !excludedFromBench.has(p.id));

  const toggleStarter = (player: Player) => {
    if (starterSet.has(player.id)) {
      setSelectedStarters((s) => s.filter((id) => id !== player.id));
      setStarterPositions((p) => { const n = { ...p }; delete n[player.id]; return n; });
    } else if (selectedStarters.length < 11) {
      const pos = formationPositions[selectedStarters.length] ?? player.primaryPosition;
      setSelectedStarters((s) => [...s, player.id]);
      setStarterPositions((p) => ({ ...p, [player.id]: pos }));
    } else {
      toast.error("Maximum 11 starters selected");
    }
  };

  const removeFromBench = (playerId: string) => {
    setExcludedFromBench((s) => new Set([...s, playerId]));
  };

  const restoreToBench = (playerId: string) => {
    setExcludedFromBench((s) => { const n = new Set(s); n.delete(playerId); return n; });
  };

  const handleCreate = async () => {
    if (!opponentId) { toast.error("Select an opponent"); return; }
    if (selectedStarters.length < 1) { toast.error("Select at least 1 starter"); return; }
    setLoading(true);

    const matchId = nanoid();

    await db.matches.add({
      id: matchId,
      opponentId,
      date,
      formation,
      startTime: new Date().toISOString(),
      status: "scheduled",
    });

    const matchPlayerRecords: MatchPlayer[] = [
      ...selectedStarters.map((pid) => ({
        id: nanoid(), matchId, playerId: pid, starting: true,
        position: starterPositions[pid] ?? "CM", onField: false,
      })),
      ...benchPlayers.map((p) => ({
        id: nanoid(), matchId, playerId: p.id, starting: false,
        position: p.primaryPosition, onField: false,
      })),
    ];

    await db.matchPlayers.bulkAdd(matchPlayerRecords);
    toast.success("Match created!");
    router.push(`/matches/${matchId}`);
  };

  // Group non-excluded non-starters by position for the bench display
  const excludedPlayers = (players ?? []).filter((p) => !starterSet.has(p.id) && excludedFromBench.has(p.id));

  // Group players by position category
  const groupedPlayers = (Object.keys(POSITION_GROUPS) as Array<keyof typeof POSITION_GROUPS>).map((key) => ({
    key,
    label: POSITION_GROUPS[key].label,
    styles: GROUP_STYLES[key],
    players: (players ?? []).filter((p) => getPositionGroup(p.primaryPosition) === key),
  })).filter((g) => g.players.length > 0);

  return (
    <AppShell>
      <div className="p-6 max-w-3xl mx-auto pb-24">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/matches">
            <Button variant="ghost" size="icon" className="h-9 w-9"><ArrowLeft className="w-5 h-5" /></Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">New Match</h1>
            <p className="text-muted-foreground text-sm">Set up your lineup and formation</p>
          </div>
        </div>

        <div className="space-y-5">
          {/* Match Details */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Match Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Opponent *</Label>
                <Select value={opponentId} onValueChange={(v: string | null) => setOpponentId(v ?? "")}>
                  <SelectTrigger className="h-11 bg-background"><SelectValue placeholder="Select opponent team" /></SelectTrigger>
                  <SelectContent>
                    {(teams ?? []).map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Date</Label>
                  <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-11 bg-background" />
                </div>
                <div className="space-y-1.5">
                  <Label>Formation</Label>
                  <Select value={formation} onValueChange={(v: string | null) => setFormation(v ?? "4-4-2")}>
                    <SelectTrigger className="h-11 bg-background"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {FORMATION_KEYS.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Starting XI */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Starting XI</CardTitle>
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    {Array.from({ length: 11 }).map((_, i) => (
                      <div key={i} className={cn("w-2 h-2 rounded-full", i < selectedStarters.length ? "bg-primary" : "bg-border")} />
                    ))}
                  </div>
                  <span className="text-xs font-mono text-muted-foreground">{selectedStarters.length}/11</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              {groupedPlayers.map(({ key, label, styles, players: gPlayers }) => (
                <div key={key}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${styles.dot}`} />
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</span>
                  </div>
                  <div className="space-y-1.5">
                    {gPlayers.map((p) => {
                      const isStarter = starterSet.has(p.id);
                      const starterPos = starterPositions[p.id];
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => toggleStarter(p)}
                          className={cn(
                            "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all text-left",
                            isStarter
                              ? "border-primary bg-primary/10"
                              : "border-border bg-background hover:border-primary/40 hover:bg-primary/5"
                          )}
                        >
                          <div className={cn(
                            "w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-sm font-bold transition-colors",
                            isStarter ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                          )}>
                            {isStarter ? <Check className="w-4 h-4" /> : `#${p.jerseyNumber}`}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={cn("text-sm font-semibold", isStarter ? "text-foreground" : "text-muted-foreground")}>
                              {p.firstName} {p.lastName}
                            </p>
                            <p className="text-xs text-muted-foreground">{p.jerseyName}</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {isStarter && starterPos && (
                              <PositionBadge position={starterPos} />
                            )}
                            {!isStarter && (
                              <PositionBadge position={p.primaryPosition} />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Position assignments — only shown once at least 1 starter picked */}
          {selectedStarters.length > 0 && (
            <Card className="bg-card border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Match Positions
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">Adjust each player's position for this match only</p>
              </CardHeader>
              <CardContent className="space-y-2">
                {selectedStarters.map((pid) => {
                  const p = (players ?? []).find((pl) => pl.id === pid);
                  if (!p) return null;
                  return (
                    <div key={pid} className="flex items-center gap-3 px-3 py-2 rounded-xl bg-primary/5 border border-primary/20">
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-white">#{p.jerseyNumber}</span>
                      </div>
                      <span className="text-sm font-medium flex-1 truncate">{p.jerseyName}</span>
                      <select
                        value={starterPositions[pid] ?? p.primaryPosition}
                        onChange={(e) => setStarterPositions((prev) => ({ ...prev, [pid]: e.target.value }))}
                        className="text-sm font-semibold bg-background border border-border rounded-lg px-2 py-1 text-foreground outline-none focus:border-primary/60 transition-colors"
                      >
                        {["GK","RB","CB","LB","RWB","LWB","CDM","CM","CAM","RM","LM","RW","LW","SS","ST","CF"].map((pos) => (
                          <option key={pos} value={pos}>{pos}</option>
                        ))}
                      </select>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {/* Bench */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Bench</CardTitle>
                <Badge variant="outline" className="text-xs">{benchPlayers.length} players</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">All non-starters are on the bench by default. Tap × to remove.</p>
            </CardHeader>
            <CardContent>
              {benchPlayers.length === 0 && excludedPlayers.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-3">All players are in the Starting XI</p>
              ) : (
                <div className="space-y-2">
                  {benchPlayers.map((p) => (
                    <div key={p.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-muted/40 border border-border">
                      <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center shrink-0">
                        <span className="text-xs font-bold">#{p.jerseyNumber}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{p.firstName} {p.lastName}</p>
                      </div>
                      <PositionBadge position={p.primaryPosition} />
                      <button
                        type="button"
                        onClick={() => removeFromBench(p.id)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Excluded players — can restore */}
              {excludedPlayers.length > 0 && (
                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-xs text-muted-foreground mb-2">Excluded from squad</p>
                  <div className="flex flex-wrap gap-2">
                    {excludedPlayers.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => restoreToBench(p.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted border border-border text-xs text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
                      >
                        <UserMinus className="w-3 h-3" />
                        {p.jerseyName || p.lastName} #{p.jerseyNumber}
                        <span className="text-primary ml-1">+ Add back</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Sticky bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 md:left-56 p-4 glass-header border-t border-border/50">
        <Button
          className="w-full h-12 bg-primary hover:bg-primary/90 text-base font-bold shadow-lg shadow-primary/25"
          onClick={handleCreate}
          disabled={loading || selectedStarters.length < 1}
        >
          {loading ? "Creating…" : `Create Match · ${selectedStarters.length} starters, ${benchPlayers.length} on bench`}
          <ChevronRight className="ml-2 w-5 h-5" />
        </Button>
      </div>
    </AppShell>
  );
}
