import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

type Row = {
  id: string;
  actor_id: string | null;
  action: string;
  entity: string;
  entity_id: string | null;
  metadata_json: any;
  created_at: string;
};

const ACTIONS = ["all", "INSERT", "UPDATE", "DELETE", "SUBMIT", "APPROVE", "REJECT", "ARCHIVE", "UNARCHIVE", "RESTORE"];

export default function AdminAuditLog() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState("all");
  const [entity, setEntity] = useState("all");
  const [actorEmail, setActorEmail] = useState("");
  const [entityId, setEntityId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [emails, setEmails] = useState<Record<string, string>>({});

  const load = async () => {
    setLoading(true);
    let q = supabase
      .from("audit_log")
      .select("id, actor_id, action, entity, entity_id, metadata_json, created_at")
      .order("created_at", { ascending: false })
      .limit(300);
    if (action !== "all") q = q.eq("action", action);
    if (entity !== "all") q = q.eq("entity", entity);
    if (entityId.trim()) q = q.eq("entity_id", entityId.trim());
    if (from) q = q.gte("created_at", from);
    if (to) q = q.lte("created_at", to + "T23:59:59");
    const { data, error } = await q;
    if (error) { toast.error(error.message); setLoading(false); return; }
    let list = (data ?? []) as Row[];

    // Resolve actor display names from profiles
    const ids = Array.from(new Set(list.map((r) => r.actor_id).filter(Boolean))) as string[];
    if (ids.length) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("user_id, display_name")
        .in("user_id", ids);
      const map: Record<string, string> = {};
      (profs ?? []).forEach((p: any) => { map[p.user_id] = p.display_name ?? p.user_id; });
      setEmails(map);
    }

    if (actorEmail.trim()) {
      const needle = actorEmail.trim().toLowerCase();
      list = list.filter((r) => (emails[r.actor_id ?? ""] ?? "").toLowerCase().includes(needle));
    }
    setRows(list);
    setLoading(false);
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl mb-1">Journal d'activité</h1>
        <p className="text-muted-foreground">Toutes les actions tracées sur les résidences et leurs entités.</p>
      </div>

      <Card>
        <CardContent className="py-4 grid gap-3 md:grid-cols-6">
          <select className="h-10 rounded-md border bg-background px-3 text-sm md:col-span-1" value={action} onChange={(e) => setAction(e.target.value)}>
            {ACTIONS.map((a) => <option key={a} value={a}>{a === "all" ? "Toutes actions" : a}</option>)}
          </select>
          <select className="h-10 rounded-md border bg-background px-3 text-sm md:col-span-1" value={entity} onChange={(e) => setEntity(e.target.value)}>
            <option value="all">Toutes entités</option>
            <option value="residences">residences</option>
            <option value="unit_types">unit_types</option>
            <option value="pricing">pricing</option>
            <option value="residence_services">services</option>
            <option value="photos">photos</option>
          </select>
          <Input placeholder="Acteur (nom)" value={actorEmail} onChange={(e) => setActorEmail(e.target.value)} className="md:col-span-1" />
          <Input placeholder="ID entité (uuid)" value={entityId} onChange={(e) => setEntityId(e.target.value)} className="md:col-span-1" />
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="md:col-span-1" />
          <div className="flex gap-2 md:col-span-1">
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            <Button onClick={load}>OK</Button>
          </div>
        </CardContent>
      </Card>

      {loading ? <p>Chargement…</p> : rows.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">Aucun événement.</CardContent></Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr className="text-left">
                    <th className="px-4 py-3 font-medium">Date</th>
                    <th className="px-4 py-3 font-medium">Action</th>
                    <th className="px-4 py-3 font-medium">Entité</th>
                    <th className="px-4 py-3 font-medium">ID entité</th>
                    <th className="px-4 py-3 font-medium">Acteur</th>
                    <th className="px-4 py-3 font-medium">Détails</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id} className="border-t align-top">
                      <td className="px-4 py-3 whitespace-nowrap">{new Date(r.created_at).toLocaleString("fr-BE")}</td>
                      <td className="px-4 py-3"><Badge variant="outline">{r.action}</Badge></td>
                      <td className="px-4 py-3">{r.entity}</td>
                      <td className="px-4 py-3 font-mono text-xs">{r.entity_id?.slice(0, 8) ?? "—"}</td>
                      <td className="px-4 py-3">{r.actor_id ? (emails[r.actor_id] ?? r.actor_id.slice(0, 8)) : "—"}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground max-w-[320px] truncate" title={JSON.stringify(r.metadata_json)}>
                        {r.metadata_json && Object.keys(r.metadata_json).length > 0 ? JSON.stringify(r.metadata_json) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
