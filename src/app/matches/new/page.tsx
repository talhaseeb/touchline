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
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { nanoid } from "nanoid";
import { FORMATIONS } from "@/types";
import type { MatchPlayer } from "@/types";
import { ArrowLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

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
  const [selectedSubs, setSelectedSubs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const formationPositions = FORMATIONS[formation]?.positions ?? [];

  const toggleStarter = (playerId: string) => {
    if (selectedStarters.includes(playerId)) {
      setSelectedStarters((s) => s.filter((id) => id !== playerId));
      setStarterPositions((p) => { const n = { ...p }; delete n[playerId]; return n; });
    } else if (selectedStarters.length < 11) {
      const pos = formationPositions[selectedStarters.length] ?? "CM";
      setSelectedStarters((s) => [...s, playerId]);
      setStarterPositions((p) => ({ ...p, [playerId]: pos }));
    } else {
      toast.error("Maximum 11 starters");
    }
  };

  const toggleSub = (playerId: string) => {
    if (selectedStarters.includes(playerId)) return;
    setSelectedSubs((s) => s.includes(playerId) ? s.filter((id) => id !== playerId) : [...s, playerId]);
  };

  const handleCreate = async () => {
    if (!opponentId) { toast.error("Select an opponent"); return; }
    if (selectedStarters.length < 1) { toast.error("Select at least 1 starter"); return; }
    setLoading(true);

    const matchId = nanoid();
    const now = new Date().toISOString();

    await db.matches.add({
      id: matchId,
      opponentId,
      date,
      formation,
      startTime: now,
      status: "scheduled",
    });

    const matchPlayers: MatchPlayer[] = [
      ...selectedStarters.map((pid) => ({
        id: nanoid(),
        matchId,
        playerId: pid,
        starting: true,
        position: starterPositions[pid] ?? "CM",
        onField: false,
      })),
      ...selectedSubs.map((pid) => ({
        id: nanoid(),
        matchId,
        playerId: pid,
        starting: false,
        position: players?.find((p) => p.id === pid)?.primaryPosition ?? "CM",
        onField: false,
      })),
    ];

    await db.matchPlayers.bulkAdd(matchPlayers);
    toast.success("Match created!");
    router.push(`/matches/${matchId}`);
  };

  return (
    <AppShell>
      <div className="p-6 max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/matches">
            <Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">New Match</h1>
            <p className="text-muted-foreground">Set up your lineup and formation</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Opponent */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3"><CardTitle className="text-base">Match Details</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Opponent *</Label>
                <Select value={opponentId} onValueChange={(v: string | null) => setOpponentId(v ?? "")}>
                  <SelectTrigger className="h-11"><SelectValue placeholder="Select opponent" /></SelectTrigger>
                  <SelectContent>
                    {(teams ?? []).map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Date</Label>
                  <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-11" />
                </div>
                <div className="space-y-1.5">
                  <Label>Formation</Label>
                  <Select value={formation} onValueChange={(v: string | null) => setFormation(v ?? "4-4-2")}>
                    <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {FORMATION_KEYS.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Players */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Select Players</CardTitle>
                <Badge variant="outline">{selectedStarters.length}/11 starters</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {(players ?? []).map((p) => {
                  const isStarter = selectedStarters.includes(p.id);
                  const isSub = selectedSubs.includes(p.id);
                  return (
                    <div key={p.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-primary">#{p.jerseyNumber}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{p.firstName} {p.lastName}</p>
                        <p className="text-xs text-muted-foreground">{p.primaryPosition}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant={isStarter ? "default" : "outline"}
                          className={`text-xs h-8 ${isStarter ? "bg-primary" : ""}`}
                          onClick={() => toggleStarter(p.id)}
                        >
                          {isStarter ? `XI · ${starterPositions[p.id] ?? ""}` : "Starter"}
                        </Button>
                        <Button
                          size="sm"
                          variant={isSub ? "secondary" : "outline"}
                          className="text-xs h-8"
                          disabled={isStarter}
                          onClick={() => toggleSub(p.id)}
                        >
                          Sub
                        </Button>
                      </div>
                    </div>
                  );
                })}
                {!(players?.length) && (
                  <p className="text-sm text-muted-foreground text-center py-4">No players — add players first</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Button
            className="w-full h-12 bg-primary hover:bg-primary/90 text-base font-semibold"
            onClick={handleCreate}
            disabled={loading}
          >
            {loading ? "Creating…" : "Create Match"} <ChevronRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
