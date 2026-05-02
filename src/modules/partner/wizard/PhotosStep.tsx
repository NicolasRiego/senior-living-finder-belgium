import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { StepProps } from "@/pages/partner/ResidenceEditor";
import { toast } from "sonner";
import { ImagePlus, Star, Trash2, ArrowUp, ArrowDown } from "lucide-react";

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

export default function PhotosStep({ residence }: StepProps) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [uploading, setUploading] = useState(false);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});

  const load = async () => {
    const { data } = await supabase.from("photos").select("*")
      .eq("residence_id", residence.id).order("display_order");
    const list = (data ?? []) as any as Photo[];
    setPhotos(list);
    // signed urls (residence might not be published yet)
    const urls: Record<string, string> = {};
    for (const p of list) {
      const { data: s } = await supabase.storage.from("residence-photos").createSignedUrl(p.storage_path, 3600);
      if (s?.signedUrl) urls[p.id] = s.signedUrl;
    }
    setSignedUrls(urls);
  };
  useEffect(() => { load(); }, [residence.id]);

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
    await supabase.storage.from("residence-photos").remove([p.storage_path]);
    await supabase.from("photos").delete().eq("id", p.id);
    setPhotos((ps) => ps.filter((x) => x.id !== p.id));
  };

  const setCover = async (p: Photo) => {
    // unset existing covers, then set this one
    const covers = photos.filter((x) => x.category === "cover" && x.id !== p.id);
    for (const c of covers) {
      await supabase.from("photos").update({ category: "other" as any }).eq("id", c.id);
    }
    await supabase.from("photos").update({ category: "cover" as any }).eq("id", p.id);
    await load();
    toast.success("Photo de couverture définie");
  };

  const updateCategory = async (p: Photo, cat: string) => {
    await supabase.from("photos").update({ category: cat as any }).eq("id", p.id);
    setPhotos((ps) => ps.map((x) => x.id === p.id ? { ...x, category: cat } : x));
  };

  const move = async (idx: number, dir: -1 | 1) => {
    const j = idx + dir;
    if (j < 0 || j >= photos.length) return;
    const a = photos[idx], b = photos[j];
    await Promise.all([
      supabase.from("photos").update({ display_order: b.display_order }).eq("id", a.id),
      supabase.from("photos").update({ display_order: a.display_order }).eq("id", b.id),
    ]);
    await load();
  };

  const hasCover = photos.some((p) => p.category === "cover");

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

        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {photos.map((p, idx) => (
            <Card key={p.id} className={p.category === "cover" ? "ring-2 ring-primary" : ""}>
              <div className="aspect-video bg-muted overflow-hidden rounded-t-lg">
                {signedUrls[p.id] && <img src={signedUrls[p.id]} alt={p.alt_text ?? ""} className="h-full w-full object-cover" />}
              </div>
              <CardContent className="p-3 space-y-2">
                <Select value={p.category} onValueChange={(v) => updateCategory(p, v)}>
                  <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
                <div className="flex items-center justify-between gap-1">
                  <Button variant="ghost" size="icon" onClick={() => setCover(p)} aria-label="Définir comme couverture">
                    <Star className={`h-4 w-4 ${p.category === "cover" ? "fill-primary text-primary" : ""}`} />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => move(idx, -1)} aria-label="Monter"><ArrowUp className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => move(idx, 1)} aria-label="Descendre"><ArrowDown className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => remove(p)} aria-label="Supprimer"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
