"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { db } from "@/db";
import { getSession } from "@/lib/auth";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Shield, Swords, Plus, FileText, Calendar, Circle } from "lucide-react";
import type { Match, Team } from "@/types";

export default function DashboardPage() {
  const router = useRouter();
  const session = getSession();
  const [stats, setStats] = useState({ players: 0, teams: 0 });
  const [recentMatches, setRecentMatches] = useState<(Match & { opponentName: string })[]>([]);

  useEffect(() => {
    async function load() {
      const [players, teams, matches] = await Promise.all([
        db.players.count(),
        db.teams.count(),
        db.matches.orderBy("date").reverse().limit(5).toArray(),
      ]);
      const allTeams = await db.teams.toArray();
      const teamMap = Object.fromEntries(allTeams.map((t) => [t.id, t.name]));
      setStats({ players, teams });
      setRecentMatches(matches.map((m) => ({ ...m, opponentName: teamMap[m.opponentId] || "Unknown" })));
    }
    load();
  }, []);

  const canCoach = session?.role === "ADMIN" || session?.role === "COACH";

  return (
    <AppShell>
      <div className="p-6 max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {session?.username}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          <Card className="bg-card border-border">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.players}</p>
                  <p className="text-sm text-muted-foreground">Players</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.teams}</p>
                  <p className="text-sm text-muted-foreground">Teams</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
                  <Swords className="w-5 h-5 text-orange-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{recentMatches.length}</p>
                  <p className="text-sm text-muted-foreground">Matches</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick actions */}
        {canCoach && (
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Quick Actions</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Link href="/matches/new">
                <Button className="w-full h-14 flex-col gap-1 bg-primary hover:bg-primary/90">
                  <Plus className="w-5 h-5" />
                  <span className="text-xs">New Match</span>
                </Button>
              </Link>
              <Link href="/players">
                <Button variant="outline" className="w-full h-14 flex-col gap-1 border-border">
                  <Users className="w-5 h-5" />
                  <span className="text-xs">Players</span>
                </Button>
              </Link>
              <Link href="/teams">
                <Button variant="outline" className="w-full h-14 flex-col gap-1 border-border">
                  <Shield className="w-5 h-5" />
                  <span className="text-xs">Teams</span>
                </Button>
              </Link>
              <Link href="/reports">
                <Button variant="outline" className="w-full h-14 flex-col gap-1 border-border">
                  <FileText className="w-5 h-5" />
                  <span className="text-xs">Reports</span>
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Recent matches */}
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Recent Matches</h2>
          {recentMatches.length === 0 ? (
            <Card className="bg-card border-border">
              <CardContent className="py-12 text-center">
                <Swords className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No matches yet</p>
                {canCoach && (
                  <Link href="/matches/new">
                    <Button className="mt-4 bg-primary hover:bg-primary/90">Create First Match</Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {recentMatches.map((match) => (
                <Link key={match.id} href={`/matches/${match.id}`}>
                  <Card className="bg-card border-border hover:border-primary/50 transition-colors cursor-pointer">
                    <CardContent className="py-4 flex items-center gap-4">
                      <div className="flex-1">
                        <p className="font-medium">vs {match.opponentName}</p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(match.date).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge
                        variant={match.status === "live" ? "default" : "outline"}
                        className={match.status === "live" ? "bg-primary text-white" : ""}
                      >
                        {match.status === "live" && <Circle className="w-2 h-2 mr-1 fill-current animate-pulse" />}
                        {match.status}
                      </Badge>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
