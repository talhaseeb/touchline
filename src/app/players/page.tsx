"use client";
import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/db";
import { getSession } from "@/lib/auth";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Search, Pencil, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import type { Player } from "@/types";
import { nanoid } from "nanoid";
import { POSITION_GROUPS, GROUP_STYLES, getPositionGroup } from "@/lib/positions";
import { PositionBadge } from "@/components/ui/PositionBadge";

const ALL_POSITIONS = ["GK", "RB", "CB", "LB", "RWB", "LWB", "CDM", "CM", "CAM", "RM", "LM", "RW", "LW", "SS", "ST", "CF"];

function PlayerForm({ player, onSave, onClose }: {
  player?: Player;
  onSave: (data: Omit<Player, "id">) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    firstName: player?.firstName ?? "",
    lastName: player?.lastName ?? "",
    jerseyName: player?.jerseyName ?? "",
    jerseyNumber: player?.jerseyNumber?.toString() ?? "",
    primaryPosition: player?.primaryPosition ?? "",
    secondaryPosition: player?.secondaryPosition ?? "",
    active: player?.active ?? true,
  });

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName || !form.lastName || !form.jerseyNumber || !form.primaryPosition) {
      toast.error("Fill in all required fields");
      return;
    }
    onSave({
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      jerseyName: form.jerseyName.trim() || form.lastName.trim().toUpperCase(),
      jerseyNumber: Number(form.jerseyNumber),
      primaryPosition: form.primaryPosition,
      secondaryPosition: form.secondaryPosition && form.secondaryPosition !== "none" ? form.secondaryPosition : undefined,
      active: form.active,
    });
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>First Name *</Label>
          <Input value={form.firstName} onChange={(e) => set("firstName", e.target.value)} placeholder="First name" className="h-11" />
        </div>
        <div className="space-y-1.5">
          <Label>Last Name *</Label>
          <Input value={form.lastName} onChange={(e) => set("lastName", e.target.value)} placeholder="Last name" className="h-11" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Jersey Name</Label>
          <Input value={form.jerseyName} onChange={(e) => set("jerseyName", e.target.value)} placeholder="Name on shirt" className="h-11" />
        </div>
        <div className="space-y-1.5">
          <Label>Jersey Number *</Label>
          <Input type="number" min={1} max={99} value={form.jerseyNumber} onChange={(e) => set("jerseyNumber", e.target.value)} placeholder="e.g. 10" className="h-11" />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Primary Position *</Label>
        <Select value={form.primaryPosition} onValueChange={(v: string | null) => set("primaryPosition", v ?? "")}>
          <SelectTrigger className="h-11"><SelectValue placeholder="Select position" /></SelectTrigger>
          <SelectContent>
            {ALL_POSITIONS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label>Secondary Position</Label>
        <Select value={form.secondaryPosition || "none"} onValueChange={(v: string | null) => set("secondaryPosition", v === "none" ? "" : (v ?? ""))}>
          <SelectTrigger className="h-11"><SelectValue placeholder="Optional" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            {ALL_POSITIONS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="flex gap-2 pt-2">
        <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
        <Button type="submit" className="flex-1 bg-primary hover:bg-primary/90">{player ? "Save Changes" : "Add Player"}</Button>
      </div>
    </form>
  );
}

function PlayerRow({ player, canEdit, onEdit, onDelete }: {
  player: Player;
  canEdit: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const group = getPositionGroup(player.primaryPosition);
  const styles = GROUP_STYLES[group];

  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-card border border-border hover:border-border/80 transition-colors group">
      <div className={`w-11 h-11 rounded-full ring-2 ${styles.ring} bg-card flex items-center justify-center shrink-0`}>
        <span className="text-sm font-bold text-foreground">#{player.jerseyNumber}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm leading-tight">{player.firstName} {player.lastName}</p>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <span className="text-xs text-muted-foreground font-mono tracking-wide">{player.jerseyName}</span>
          <PositionBadge position={player.primaryPosition} />
          {player.secondaryPosition && (
            <PositionBadge position={player.secondaryPosition} className="opacity-60" />
          )}
        </div>
      </div>
      {canEdit && (
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={onEdit}>
            <Pencil className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={onDelete}>
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      )}
    </div>
  );
}

export default function PlayersPage() {
  const session = getSession();
  const canEdit = session?.role === "ADMIN" || session?.role === "COACH";
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [editPlayer, setEditPlayer] = useState<Player | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const players = useLiveQuery(() => db.players.orderBy("jerseyNumber").toArray(), []);

  const filtered = (players ?? []).filter((p) =>
    `${p.firstName} ${p.lastName} ${p.jerseyName} ${p.jerseyNumber} ${p.primaryPosition} ${p.secondaryPosition ?? ""}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  // Group by position
  const grouped = (Object.keys(POSITION_GROUPS) as Array<keyof typeof POSITION_GROUPS>).map((groupKey) => {
    const group = POSITION_GROUPS[groupKey];
    const groupPlayers = filtered.filter((p) => getPositionGroup(p.primaryPosition) === groupKey);
    return { groupKey, label: group.label, players: groupPlayers, styles: GROUP_STYLES[groupKey] };
  }).filter((g) => g.players.length > 0);

  const handleAdd = async (data: Omit<Player, "id">) => {
    await db.players.add({ id: nanoid(), ...data });
    setAddOpen(false);
    toast.success("Player added");
  };

  const handleEdit = async (data: Omit<Player, "id">) => {
    if (!editPlayer) return;
    await db.players.update(editPlayer.id, data);
    setEditPlayer(null);
    toast.success("Player updated");
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await db.players.delete(deleteId);
    setDeleteId(null);
    toast.success("Player deleted");
  };

  return (
    <AppShell>
      <div className="p-6 max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Squad</h1>
            <p className="text-muted-foreground text-sm">{players?.length ?? 0} players · JRJ Jets</p>
          </div>
          {canEdit && (
            <Button className="bg-primary hover:bg-primary/90 shadow-md shadow-primary/20" onClick={() => setAddOpen(true)}>
              <Plus className="w-4 h-4 mr-2" /> Add Player
            </Button>
          )}
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-10 h-11 bg-card" placeholder="Search by name, number, or position…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        {/* Empty state */}
        {filtered.length === 0 && (
          <Card className="bg-card border-border">
            <CardContent className="py-16 text-center">
              <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                <Users className="w-7 h-7 text-muted-foreground" />
              </div>
              <p className="font-medium mb-1">{search ? "No players found" : "No players yet"}</p>
              <p className="text-sm text-muted-foreground mb-4">{search ? "Try a different search" : "Add your first player to get started"}</p>
              {canEdit && !search && (
                <Button className="bg-primary hover:bg-primary/90" onClick={() => setAddOpen(true)}>Add First Player</Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Grouped players */}
        <div className="space-y-6">
          {grouped.map(({ groupKey, label, players: gPlayers, styles }) => (
            <div key={groupKey}>
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-2 h-2 rounded-full ${styles.dot}`} />
                <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</h2>
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-foreground">{gPlayers.length}</span>
              </div>
              <div className="space-y-1.5">
                {gPlayers.map((p) => (
                  <PlayerRow
                    key={p.id}
                    player={p}
                    canEdit={canEdit}
                    onEdit={() => setEditPlayer(p)}
                    onDelete={() => setDeleteId(p.id)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="bg-card border-border max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Add Player</DialogTitle></DialogHeader>
          <PlayerForm onSave={handleAdd} onClose={() => setAddOpen(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editPlayer} onOpenChange={() => setEditPlayer(null)}>
        <DialogContent className="bg-card border-border max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Edit Player</DialogTitle></DialogHeader>
          {editPlayer && <PlayerForm player={editPlayer} onSave={handleEdit} onClose={() => setEditPlayer(null)} />}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Player?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}
