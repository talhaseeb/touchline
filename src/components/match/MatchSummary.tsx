"use client";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/db";
import { calculatePlayerStats } from "@/lib/ratings";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Download, FileText } from "lucide-react";
import Link from "next/link";
import { POSITIVE_EVENTS, NEGATIVE_EVENTS } from "@/types";
import { exportMatchPDF } from "@/lib/export";
import { exportMatchCSV } from "@/lib/export";
import { toast } from "sonner";

function RatingBadge({ rating }: { rating: number }) {
  const color =
    rating >= 8 ? "text-green-400" :
    rating >= 6.5 ? "text-lime-400" :
    rating >= 5 ? "text-yellow-400" :
    rating >= 3.5 ? "text-orange-400" : "text-red-400";
  return <span className={`font-bold ${color}`}>{rating.toFixed(1)}</span>;
}

export function MatchSummary({ matchId }: { matchId: string }) {
  const match = useLiveQuery(() => db.matches.get(matchId), [matchId]);
  const matchPlayers = useLiveQuery(() => db.matchPlayers.where("matchId").equals(matchId).toArray(), [matchId]);
  const allPlayers = useLiveQuery(() => db.players.toArray(), []);
  const events = useLiveQuery(() => db.events.where("matchId").equals(matchId).sortBy("timestamp"), [matchId]);
  const opponent = useLiveQuery(() => match ? db.teams.get(match.opponentId) : undefined, [match?.opponentId]);

  if (!match || !matchPlayers || !allPlayers || !events) {
    return (
      <AppShell>
        <div className="p-6 text-center text-muted-foreground">Loading…</div>
      </AppShell>
    );
  }

  const playerMap = Object.fromEntries(allPlayers.map((p) => [p.id, p]));
  const allPlayerIds = matchPlayers.map((mp) => mp.playerId);
  const statsMap = Object.fromEntries(
    allPlayerIds.map((id) => [id, calculatePlayerStats(id, events)])
  );

  const teamGoals = events.filter((e) => e.type === "Goal").length;
  const teamAssists = events.filter((e) => e.type === "Assist").length;
  const teamInterceptions = events.filter((e) => e.type === "Interception").length;
  const teamLostPossession = events.filter((e) => e.type === "Lost Possession").length;

  const formatTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const handlePDF = async () => {
    try {
      await exportMatchPDF({ match, opponent: opponent ?? { id: "", name: "Unknown" }, matchPlayers, players: allPlayers, events });
      toast.success("PDF exported");
    } catch { toast.error("PDF export failed"); }
  };

  const handleCSV = () => {
    try {
      exportMatchCSV({ match, matchPlayers, players: allPlayers, events });
      toast.success("CSV exported");
    } catch { toast.error("CSV export failed"); }
  };

  return (
    <AppShell>
      <div className="p-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link href="/matches">
            <Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">Match Report</h1>
            <p className="text-muted-foreground">vs {opponent?.name} · {new Date(match.date).toLocaleDateString()} · {match.formation}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleCSV}>
              <Download className="w-4 h-4 mr-1" /> CSV
            </Button>
            <Button className="bg-primary hover:bg-primary/90" size="sm" onClick={handlePDF}>
              <FileText className="w-4 h-4 mr-1" /> PDF
            </Button>
          </div>
        </div>

        {/* Team stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label: "Goals", value: teamGoals },
            { label: "Assists", value: teamAssists },
            { label: "Interceptions", value: teamInterceptions },
            { label: "Possession Lost", value: teamLostPossession },
          ].map((s) => (
            <Card key={s.label} className="bg-card border-border">
              <CardContent className="pt-4 text-center">
                <p className="text-3xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {/* Player stats table */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3"><CardTitle className="text-base">Player Ratings</CardTitle></CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left px-4 py-2 text-muted-foreground font-medium">Player</th>
                      <th className="text-center px-2 py-2 text-muted-foreground font-medium">G</th>
                      <th className="text-center px-2 py-2 text-muted-foreground font-medium">A</th>
                      <th className="text-center px-2 py-2 text-muted-foreground font-medium">+</th>
                      <th className="text-center px-2 py-2 text-muted-foreground font-medium">-</th>
                      <th className="text-center px-2 py-2 text-muted-foreground font-medium">Rtg</th>
                    </tr>
                  </thead>
                  <tbody>
                    {matchPlayers
                      .sort((a, b) => (statsMap[b.playerId]?.rating ?? 0) - (statsMap[a.playerId]?.rating ?? 0))
                      .map((mp) => {
                        const player = playerMap[mp.playerId];
                        const stats = statsMap[mp.playerId];
                        if (!player || !stats) return null;
                        return (
                          <tr key={mp.id} className="border-b border-border/50 hover:bg-muted/30">
                            <td className="px-4 py-2">
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">#{player.jerseyNumber}</span>
                                <span className="font-medium">{player.firstName} {player.lastName[0]}.</span>
                                <Badge variant="outline" className="text-xs">{mp.position}</Badge>
                              </div>
                            </td>
                            <td className="text-center px-2">{stats.goals}</td>
                            <td className="text-center px-2">{stats.assists}</td>
                            <td className="text-center px-2 text-green-400">{stats.positiveEvents}</td>
                            <td className="text-center px-2 text-red-400">{stats.negativeEvents}</td>
                            <td className="text-center px-2"><RatingBadge rating={stats.rating} /></td>
                          </tr>
                        );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3"><CardTitle className="text-base">Match Timeline</CardTitle></CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-80">
                <div className="p-4 space-y-2">
                  {events.length === 0 && <p className="text-sm text-muted-foreground">No events recorded</p>}
                  {[...events].reverse().map((ev) => {
                    const player = playerMap[ev.playerId];
                    const isPos = POSITIVE_EVENTS.includes(ev.type);
                    return (
                      <div key={ev.id} className="flex items-start gap-3 text-sm">
                        <span className="font-mono text-xs text-muted-foreground w-12 shrink-0 mt-0.5">{formatTime(ev.timestamp)}</span>
                        <div>
                          <span className={isPos ? "text-green-400 font-medium" : "text-red-400 font-medium"}>{ev.type}</span>
                          <span className="text-muted-foreground"> – {player ? `${player.firstName} ${player.lastName}` : "Unknown"}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
