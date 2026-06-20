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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Search, Pencil, Trash2, Shield } from "lucide-react";
import { toast } from "sonner";
import type { Team } from "@/types";
import { nanoid } from "nanoid";

export default function TeamsPage() {
  const session = getSession();
  const canEdit = session?.role === "ADMIN" || session?.role === "COACH";
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [editTeam, setEditTeam] = useState<Team | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [teamName, setTeamName] = useState("");

  const teams = useLiveQuery(() => db.teams.orderBy("name").toArray(), []);
  const filtered = (teams ?? []).filter((t) => t.name.toLowerCase().includes(search.toLowerCase()));

  const openAdd = () => { setTeamName(""); setAddOpen(true); };
  const openEdit = (t: Team) => { setTeamName(t.name); setEditTeam(t); };

  const handleAdd = async () => {
    if (!teamName.trim()) { toast.error("Team name required"); return; }
    await db.teams.add({ id: nanoid(), name: teamName.trim() });
    setAddOpen(false);
    toast.success("Team added");
  };

  const handleEdit = async () => {
    if (!editTeam || !teamName.trim()) return;
    await db.teams.update(editTeam.id, { name: teamName.trim() });
    setEditTeam(null);
    toast.success("Team updated");
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await db.teams.delete(deleteId);
    setDeleteId(null);
    toast.success("Team deleted");
  };

  return (
    <AppShell>
      <div className="p-6 max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Teams</h1>
            <p className="text-muted-foreground">{teams?.length ?? 0} opposition teams</p>
          </div>
          {canEdit && (
            <Button className="bg-primary hover:bg-primary/90" onClick={openAdd}>
              <Plus className="w-4 h-4 mr-2" /> Add Team
            </Button>
          )}
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-9 h-11" placeholder="Search teams…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        {filtered.length === 0 ? (
          <Card className="bg-card border-border">
            <CardContent className="py-12 text-center">
              <Shield className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">{search ? "No teams found" : "No teams yet"}</p>
              {canEdit && !search && (
                <Button className="mt-4 bg-primary hover:bg-primary/90" onClick={openAdd}>Add First Team</Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {filtered.map((t) => (
              <Card key={t.id} className="bg-card border-border">
                <CardContent className="py-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-blue-400" />
                  </div>
                  <p className="flex-1 font-semibold">{t.name}</p>
                  {canEdit && (
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => openEdit(t)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive hover:text-destructive" onClick={() => setDeleteId(t.id)}>
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

      {/* Add dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader><DialogTitle>Add Team</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Team Name *</Label>
              <Input value={teamName} onChange={(e) => setTeamName(e.target.value)} placeholder="e.g. FC Barcelona" className="h-11" onKeyDown={(e) => e.key === "Enter" && handleAdd()} />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setAddOpen(false)}>Cancel</Button>
              <Button className="flex-1 bg-primary hover:bg-primary/90" onClick={handleAdd}>Add Team</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editTeam} onOpenChange={() => setEditTeam(null)}>
        <DialogContent className="bg-card border-border">
          <DialogHeader><DialogTitle>Edit Team</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Team Name *</Label>
              <Input value={teamName} onChange={(e) => setTeamName(e.target.value)} className="h-11" onKeyDown={(e) => e.key === "Enter" && handleEdit()} />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setEditTeam(null)}>Cancel</Button>
              <Button className="flex-1 bg-primary hover:bg-primary/90" onClick={handleEdit}>Save Changes</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Team?</AlertDialogTitle>
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
