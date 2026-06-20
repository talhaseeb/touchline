"use client";
import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/db";
import { getSession } from "@/lib/auth";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Search, Pencil, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import type { Player } from "@/types";
import { nanoid } from "nanoid";

const POSITIONS = ["GK", "RB", "CB", "LB", "RWB", "LWB", "CDM", "CM", "CAM", "RM", "LM", "RW", "LW", "SS", "ST", "CF"];

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

  const handle = (k: string, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));

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
      secondaryPosition: form.secondaryPosition && form.secondaryPosition !== "none"
        ? form.secondaryPosition
        : undefined,
      active: form.active,
    });
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>First Name *</Label>
          <Input value={form.firstName} onChange={(e) => handle("firstName", e.target.value)} placeholder="First name" className="h-11" />
        </div>
        <div className="space-y-1.5">
          <Label>Last Name *</Label>
          <Input value={form.lastName} onChange={(e) => handle("lastName", e.target.value)} placeholder="Last name" className="h-11" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Jersey Name</Label>
          <Input value={form.jerseyName} onChange={(e) => handle("jerseyName", e.target.value)} placeholder="Name on shirt" className="h-11" />
        </div>
        <div className="space-y-1.5">
          <Label>Jersey Number *</Label>
          <Input type="number" min={1} max={99} value={form.jerseyNumber} onChange={(e) => handle("jerseyNumber", e.target.value)} placeholder="e.g. 10" className="h-11" />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Primary Position *</Label>
        <Select value={form.primaryPosition} onValueChange={(v: string | null) => handle("primaryPosition", v ?? "")}>
          <SelectTrigger className="h-11"><SelectValue placeholder="Select position" /></SelectTrigger>
          <SelectContent>
            {POSITIONS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label>Secondary Position</Label>
        <Select value={form.secondaryPosition || "none"} onValueChange={(v: string | null) => handle("secondaryPosition", v === "none" ? "" : (v ?? ""))}>
          <SelectTrigger className="h-11"><SelectValue placeholder="Optional" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            {POSITIONS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
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

export default function PlayersPage() {
  const session = getSession();
  const canEdit = session?.role === "ADMIN" || session?.role === "COACH";
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [editPlayer, setEditPlayer] = useState<Player | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const players = useLiveQuery(() => db.players.orderBy("jerseyNumber").toArray(), []);

  const filtered = (players ?? []).filter((p) =>
    `${p.firstName} ${p.lastName} ${p.jerseyName} ${p.jerseyNumber} ${p.primaryPosition}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

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
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Players</h1>
            <p className="text-muted-foreground">{players?.length ?? 0} players · JRJ Jets</p>
          </div>
          {canEdit && (
            <Button className="bg-primary hover:bg-primary/90" onClick={() => setAddOpen(true)}>
              <Plus className="w-4 h-4 mr-2" /> Add Player
            </Button>
          )}
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-9 h-11" placeholder="Search by name, number, or position…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        {filtered.length === 0 ? (
          <Card className="bg-card border-border">
            <CardContent className="py-12 text-center">
              <Users className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">{search ? "No players found" : "No players yet"}</p>
              {canEdit && !search && (
                <Button className="mt-4 bg-primary hover:bg-primary/90" onClick={() => setAddOpen(true)}>Add First Player</Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {filtered.map((p) => (
              <Card key={p.id} className="bg-card border-border hover:border-border/80 transition-colors">
                <CardContent className="py-3 flex items-center gap-4">
                  {/* Jersey number circle */}
                  <div className="w-11 h-11 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-primary">#{p.jerseyNumber}</span>
                  </div>

                  {/* Name block */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold leading-tight">{p.firstName} {p.lastName}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-xs text-muted-foreground font-mono">{p.jerseyName}</span>
                      <Badge variant="outline" className="text-xs border-primary/40 text-primary">{p.primaryPosition}</Badge>
                      {p.secondaryPosition && (
                        <Badge variant="outline" className="text-xs text-muted-foreground">{p.secondaryPosition}</Badge>
                      )}
                    </div>
                  </div>

                  {canEdit && (
                    <div className="flex gap-1 shrink-0">
                      <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setEditPlayer(p)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive hover:text-destructive" onClick={() => setDeleteId(p.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
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
