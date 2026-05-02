import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, MapPin } from "lucide-react";

export default function ResidencePreview() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<any>(null);
  const [units, setUnits] = useState<any[]>([]);
  const [pricing, setPricing] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [photos, setPhotos] = useState<{ url: string; alt: string; cover: boolean }[]>([]);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const r = await supabase.from("residences").select("*").eq("id", id).single();
      setData(r.data);
      const u = await supabase.from("unit_types").select("*").eq("residence_id", id);
      setUnits(u.data ?? []);
      const utIds = (u.data ?? []).map((x) => x.id);
      if (utIds.length) {
        const p = await supabase.from("pricing").select("*").in("unit_type_id", utIds);
        setPricing(p.data ?? []);
      }
      const s = await supabase.from("residence_services").select("*, services_catalog(*)").eq("residence_id", id);
      setServices(s.data ?? []);
      const ph = await supabase.from("photos").select("*").eq("residence_id", id).order("display_order");
      const out: { url: string; alt: string; cover: boolean }[] = [];
      for (const p of ph.data ?? []) {
        const { data: signed } = await supabase.storage.from("residence-photos").createSignedUrl(p.storage_path, 3600);
        if (signed?.signedUrl) out.push({ url: signed.signedUrl, alt: p.alt_text ?? "", cover: p.category === "cover" });
      }
      setPhotos(out);
    })();
  }, [id]);

  if (!data) return <div className="container py-12">Chargement…</div>;
  const cover = photos.find((p) => p.cover) ?? photos[0];

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-amber-50 border-b border-amber-200 py-3">
        <div className="container flex items-center justify-between">
          <p className="text-amber-900">
            👁 Aperçu privé — cette fiche n'est pas encore publiée
          </p>
          <Button variant="outline" asChild>
            <Link to={`/partenaire/residences/${id}/edition`}>
              <ArrowLeft className="h-4 w-4 mr-2" /> Retour à l'édition
            </Link>
          </Button>
        </div>
      </div>

      {cover && (
        <div className="relative h-[420px] bg-muted">
          <img src={cover.url} alt={cover.alt} className="w-full h-full object-cover" />
        </div>
      )}

      <div className="container py-10 space-y-8 max-w-4xl">
        <header>
          <h1 className="font-display text-5xl">{data.nom_fr}</h1>
          {data.tagline_fr && <p className="text-2xl text-muted-foreground mt-2">{data.tagline_fr}</p>}
          {data.adresse && (
            <p className="mt-3 flex items-center gap-2 text-lg">
              <MapPin className="h-5 w-5 text-primary" />
              {data.adresse}, {data.code_postal} {data.ville}
            </p>
          )}
        </header>

        {data.description_fr && (
          <section className="prose max-w-none">
            <h2 className="font-display text-2xl">Présentation</h2>
            <p className="text-lg leading-relaxed whitespace-pre-line">{data.description_fr}</p>
          </section>
        )}

        {units.length > 0 && (
          <section>
            <h2 className="font-display text-2xl mb-3">Logements & tarifs</h2>
            <div className="grid gap-3 md:grid-cols-2">
              {units.map((u) => {
                const ps = pricing.filter((p) => p.unit_type_id === u.id);
                return (
                  <Card key={u.id}><CardContent className="pt-5">
                    <p className="font-semibold text-lg">{u.type}</p>
                    <p className="text-muted-foreground">{u.count_total} unités · {u.available_count} disponibles</p>
                    {ps.map((p) => (
                      <p key={p.id} className="mt-2">
                        {p.estimated_monthly_min && `À partir de ${p.estimated_monthly_min} € / mois`}
                      </p>
                    ))}
                  </CardContent></Card>
                );
              })}
            </div>
          </section>
        )}

        {services.length > 0 && (
          <section>
            <h2 className="font-display text-2xl mb-3">Services</h2>
            <ul className="grid gap-2 md:grid-cols-2">
              {services.map((s: any) => (
                <li key={s.id} className="text-lg">• {s.services_catalog?.label_fr}</li>
              ))}
            </ul>
          </section>
        )}

        {photos.length > 1 && (
          <section>
            <h2 className="font-display text-2xl mb-3">Photos</h2>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {photos.map((p, i) => (
                <img key={i} src={p.url} alt={p.alt} className="aspect-video w-full object-cover rounded-lg" />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
