import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { StepProps } from "@/pages/partner/ResidenceEditor";
import { toast } from "sonner";
import { ImagePlus, Star, Trash2, ArrowUp, ArrowDown, GripVertical } from "lucide-react";
import {
  DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, TouchSensor,
  closestCenter, useSensor, useSensors,
} from "@dnd-kit/core";
import {
  SortableContext, arrayMove, rectSortingStrategy, useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type Photo = {
  id: string;
  storage_path: string;
  category: string;
  display_order: number;
  alt_text: string | null;
  title: string | null;
};

const categories = [
  { value: "cover", label: "Photo de couverture" },
  { value: "exterior", label: "Extérieur" },
  { value: "interior", label: "Intérieur" },
  { value: "room", label: "Logement" },
  { value: "common_area", label: "Espaces communs" },
  { value: "garden", label: "Jardin" },
  { value: "dining", label: "Restauration" },
  { value: "other", label: "Autre" },
];

const isExternalUrl = (path: string) => /^https?:\/\//i.test(path);

function PhotoCard({
  p, idx, total, signedUrl, isCover, onSetCover, onCategory, onUp, onDown, onRemove, isOverlay,
}: {
  p: Photo; idx: number; total: number; signedUrl?: string; isCover: boolean;
  onSetCover: () => void; onCategory: (v: string) => void;
  onUp: () => void; onDown: () => void; onRemove: () => void;
  isOverlay?: boolean;
}) {
  const sortable = useSortable({ id: p.id });
  const { attributes, listeners, setNodeRef, transform, transition, isDragging, isOver } = sortable;
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };
  return (
    <div ref={setNodeRef} style={style}>
      <Card
        className={`${isCover ? "ring-2 ring-primary" : ""} ${isOver ? "outline outline-2 outline-dashed outline-green-500" : ""} ${isOverlay ? "scale-105 shadow-2xl opacity-90" : ""}`}
      >
        <div className="relative aspect-video bg-muted overflow-hidden rounded-t-lg">
          {signedUrl && <img src={signedUrl} alt={p.alt_text ?? ""} className="h-full w-full object-cover" />}
          <button
            type="button"
            className="absolute top-1 left-1 rounded bg-background/80 p-1 cursor-grab active:cursor-grabbing touch-none"
            aria-label="Glisser pour réordonner"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-4 w-4" />
          </button>
        </div>
        <CardContent className="p-3 space-y-2">
          <Select value={p.category} onValueChange={onCategory}>
            <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
            <SelectContent>
              {categories.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="flex items-center justify-between gap-1">
            <Button variant="ghost" size="icon" onClick={onSetCover} aria-label="Définir comme couverture">
              <Star className={`h-4 w-4 ${isCover ? "fill-primary text-primary" : ""}`} />
            </Button>
            <Button variant="ghost" size="icon" onClick={onUp} disabled={idx === 0} aria-label="Monter">
              <ArrowUp className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onDown} disabled={idx === total - 1} aria-label="Descendre">
              <ArrowDown className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onRemove} aria-label="Supprimer">
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function PhotosStep({ residence }: StepProps) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [uploading, setUploading] = useState(false);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
  );

  const load = async () => {
    const { data } = await supabase.from("photos").select("*")
      .eq("residence_id", residence.id).order("display_order");
    const list = (data ?? []) as any as Photo[];
    setPhotos(list);
    const urls: Record<string, string> = {};
    await Promise.all(list.map(async (p) => {
      if (isExternalUrl(p.storage_path)) { urls[p.id] = p.storage_path; return; }
      const { data: s } = await supabase.storage.from("residence-photos").createSignedUrl(p.storage_path, 3600);
      if (s?.signedUrl) urls[p.id] = s.signedUrl;
    }));
    setSignedUrls(urls);
  };
  useEffect(() => { load(); }, [residence.id]);

  const persistOrder = async (list: Photo[]) => {
    const results = await Promise.all(list.map((p, i) =>
      supabase.from("photos").update({ display_order: i }).eq("id", p.id)
    ));
    const err = results.find((r) => r.error)?.error;
    if (err) toast.error("Ordre non sauvegardé: " + err.message);
  };

  const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !files.length) return;
    setUploading(true);
    try {
      for (const f of Array.from(files)) {
        const ext = f.name.split(".").pop();
        const path = `${residence.id}/${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage.from("residence-photos").upload(path, f);
        if (upErr) throw upErr;
        const nextOrder = (photos[photos.length - 1]?.display_order ?? -1) + 1;
        const cat = photos.some((p) => p.category === "cover") ? "other" : "cover";
        await supabase.from("photos").insert({
          residence_id: residence.id, storage_path: path, category: cat as any,
          display_order: nextOrder, alt_text: f.name,
        });
      }
      await load();
    } catch (e: any) {
      toast.error(e.message ?? "Erreur d'upload");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const remove = async (p: Photo) => {
    if (!confirm("Supprimer cette photo ?")) return;
    if (!isExternalUrl(p.storage_path)) {
      await supabase.storage.from("residence-photos").remove([p.storage_path]);
    }
    await supabase.from("photos").delete().eq("id", p.id);
    const next = photos.filter((x) => x.id !== p.id);
    setPhotos(next);
    await persistOrder(next);
    toast.success("Photo supprimée");
  };

  const setCover = async (p: Photo) => {
    // Optimistic: exactly one cover
    setPhotos((ps) => ps.map((x) => ({ ...x, category: x.id === p.id ? "cover" : (x.category === "cover" ? "other" : x.category) })));
    const others = photos.filter((x) => x.category === "cover" && x.id !== p.id).map((x) => x.id);
    if (others.length) {
      await supabase.from("photos").update({ category: "other" as any }).in("id", others);
    }
    await supabase.from("photos").update({ category: "cover" as any }).eq("id", p.id);
    toast.success("Photo de couverture définie");
  };

  const updateCategory = async (p: Photo, cat: string) => {
    if (cat === "cover") { await setCover(p); return; }
    // If demoting current cover, just update it
    await supabase.from("photos").update({ category: cat as any }).eq("id", p.id);
    setPhotos((ps) => ps.map((x) => x.id === p.id ? { ...x, category: cat } : x));
  };

  const move = async (idx: number, dir: -1 | 1) => {
    const j = idx + dir;
    if (j < 0 || j >= photos.length) return;
    const next = arrayMove(photos, idx, j).map((p, i) => ({ ...p, display_order: i }));
    setPhotos(next);
    await persistOrder(next);
  };

  const onDragStart = (e: DragStartEvent) => setActiveId(String(e.active.id));
  const onDragEnd = async (e: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIdx = photos.findIndex((p) => p.id === active.id);
    const newIdx = photos.findIndex((p) => p.id === over.id);
    if (oldIdx < 0 || newIdx < 0) return;
    const next = arrayMove(photos, oldIdx, newIdx).map((p, i) => ({ ...p, display_order: i }));
    setPhotos(next);
    await persistOrder(next);
  };

  const hasCover = photos.some((p) => p.category === "cover");
  const activePhoto = activeId ? photos.find((p) => p.id === activeId) : null;

  return (
    <Card>
      <CardHeader><CardTitle>Étape 7 — Photos</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        {!hasCover && photos.length > 0 && (
          <div className="rounded-lg border-2 border-amber-300 bg-amber-50 p-4 text-amber-900">
            ⚠ Définissez une <strong>photo de couverture</strong> en cliquant sur l'étoile.
          </div>
        )}

        <label className="flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-8 cursor-pointer hover:bg-accent">
          <ImagePlus className="h-10 w-10 text-muted-foreground" />
          <span className="text-lg">{uploading ? "Téléversement…" : "Cliquez pour ajouter des photos"}</span>
          <input type="file" multiple accept="image/*" className="hidden" onChange={onUpload} disabled={uploading} />
        </label>

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={onDragStart} onDragEnd={onDragEnd}>
          <SortableContext items={photos.map((p) => p.id)} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              {photos.map((p, idx) => (
                <PhotoCard
                  key={p.id}
                  p={p} idx={idx} total={photos.length}
                  signedUrl={signedUrls[p.id]}
                  isCover={p.category === "cover"}
                  onSetCover={() => setCover(p)}
                  onCategory={(v) => updateCategory(p, v)}
                  onUp={() => move(idx, -1)}
                  onDown={() => move(idx, 1)}
                  onRemove={() => remove(p)}
                />
              ))}
            </div>
          </SortableContext>
          <DragOverlay>
            {activePhoto && (
              <Card className="scale-105 shadow-2xl opacity-90">
                <div className="aspect-video bg-muted overflow-hidden rounded-t-lg">
                  {signedUrls[activePhoto.id] && (
                    <img src={signedUrls[activePhoto.id]} alt="" className="h-full w-full object-cover" />
                  )}
                </div>
              </Card>
            )}
          </DragOverlay>
        </DndContext>
      </CardContent>
    </Card>
  );
}
