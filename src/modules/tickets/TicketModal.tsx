import { useEffect, useState } from "react";
import { X, Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/modules/auth/AuthProvider";
import {
  TICKET_PRIORITY_LABELS,
  TICKET_STATUS_LABELS,
  TICKET_STATUS_ORDER,
  type TicketPriority,
  type TicketStatus,
} from "./types";
import { createTicket, updateTicket, uploadScreenshot, type TicketInput } from "./ticketsApi";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  initial?: { id: string } & TicketInput;
};

const PRIORITY_COLORS: Record<TicketPriority, string> = {
  faible: "bg-muted hover:bg-muted/80",
  moderee: "bg-orange-500 text-white hover:bg-orange-600",
  importante: "bg-red-500 text-white hover:bg-red-600",
};

export function TicketModal({ open, onClose, onSaved, initial }: Props) {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<TicketStatus>("a_reflechir");
  const [priority, setPriority] = useState<TicketPriority>("moderee");
  const [deadline, setDeadline] = useState<string>("");
  const [screenshots, setScreenshots] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setTitle(initial?.title ?? "");
      setDescription(initial?.description ?? "");
      setStatus(initial?.status ?? "a_reflechir");
      setPriority(initial?.priority ?? "moderee");
      setDeadline(initial?.deadline ?? "");
      setScreenshots(initial?.screenshots ?? []);
    }
  }, [open, initial]);

  const handleUpload = async (files: FileList | null) => {
    if (!files || !user) return;
    const remaining = 3 - screenshots.length;
    const list = Array.from(files).slice(0, remaining);
    setUploading(true);
    try {
      const urls = await Promise.all(list.map((f) => uploadScreenshot(f, user.id)));
      setScreenshots((s) => [...s, ...urls]);
    } catch (e) {
      toast({ title: "Upload échoué", description: (e as Error).message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    if (!title.trim()) {
      toast({ title: "Titre requis", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const payload: TicketInput = {
        title: title.trim(),
        description: description.trim() || undefined,
        status,
        priority,
        deadline: deadline || null,
        screenshots,
      };
      if (initial?.id) await updateTicket(initial.id, payload);
      else await createTicket(payload, user.id);
      toast({ title: initial?.id ? "Ticket mis à jour" : "Ticket créé" });
      onSaved();
      onClose();
    } catch (e) {
      toast({ title: "Erreur", description: (e as Error).message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initial?.id ? "Modifier le ticket" : "Nouveau ticket"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="t-title">Titre *</Label>
            <Input id="t-title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="t-desc">Description</Label>
            <Textarea id="t-desc" rows={5} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div>
            <Label>Priorité</Label>
            <div className="flex gap-2 mt-1">
              {(Object.keys(TICKET_PRIORITY_LABELS) as TicketPriority[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-sm font-medium border transition",
                    PRIORITY_COLORS[p],
                    priority === p ? "ring-2 ring-primary ring-offset-1" : "opacity-70",
                  )}
                >
                  {TICKET_PRIORITY_LABELS[p]}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="t-status">Statut</Label>
              <select
                id="t-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as TicketStatus)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                {TICKET_STATUS_ORDER.map((s) => (
                  <option key={s} value={s}>
                    {TICKET_STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="t-deadline">Deadline</Label>
              <Input id="t-deadline" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Captures d'écran ({screenshots.length}/3)</Label>
            <div className="flex gap-2 flex-wrap mt-1">
              {screenshots.map((url) => (
                <div key={url} className="relative w-24 h-24">
                  <img src={url} alt="" className="w-full h-full object-cover rounded-md border" />
                  <button
                    type="button"
                    onClick={() => setScreenshots((s) => s.filter((u) => u !== url))}
                    aria-label="Supprimer"
                    className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {screenshots.length < 3 && (
                <label className="w-24 h-24 border-2 border-dashed rounded-md flex flex-col items-center justify-center cursor-pointer text-xs text-muted-foreground hover:border-primary">
                  {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5 mb-1" />}
                  <span>Ajouter</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => handleUpload(e.target.files)}
                  />
                </label>
              )}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
