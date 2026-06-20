"use client";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/db";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { FileText, Calendar, Eye } from "lucide-react";

export default function ReportsPage() {
  const matches = useLiveQuery(
    () => db.matches.where("status").equals("completed").reverse().sortBy("date"),
    []
  );
  const teams = useLiveQuery(() => db.teams.toArray(), []);
  const teamMap = Object.fromEntries((teams ?? []).map((t) => [t.id, t.name]));

  return (
    <AppShell>
      <div className="p-6 max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Reports</h1>
          <p className="text-muted-foreground">{matches?.length ?? 0} completed matches</p>
        </div>

        {!matches?.length ? (
          <Card className="bg-card border-border">
            <CardContent className="py-12 text-center">
              <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No completed matches yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {matches.map((m) => (
              <Card key={m.id} className="bg-card border-border hover:border-primary/40 transition-colors">
                <CardContent className="py-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold">vs {teamMap[m.opponentId] ?? "Unknown"}</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(m.date).toLocaleDateString()} · {m.formation}
                    </p>
                  </div>
                  <Link href={`/matches/${m.id}`}>
                    <Button variant="outline" size="sm">
                      <Eye className="w-4 h-4 mr-1" /> View
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
