import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { listContacts, listTasks, updateContactStatus } from "@/modules/crm/api";
import {
  STATUS_LABELS,
  STATUS_ORDER,
  type CrmContact,
  type CrmContactStatus,
  type CrmTask,
} from "@/modules/crm/types";
import { TypeBadge, daysSince, formatDate } from "@/modules/crm/ui";
import { toast } from "sonner";
import { ClipboardList } from "lucide-react";

export default function CrmPipeline() {
  const navigate = useNavigate();
  const [contacts, setContacts] = useState<CrmContact[]>([]);
  const [tasks, setTasks] = useState<CrmTask[]>([]);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [pendingPartner, setPendingPartner] = useState<CrmContact | null>(null);

  const reload = async () => {
    const [c, t] = await Promise.all([listContacts(), listTasks({ status: "a_faire" })]);
    setContacts(c);
    setTasks(t);
  };
  useEffect(() => { reload().catch((e) => toast.error(e.message)); }, []);

  const columns = useMemo(() => {
    const map = new Map<CrmContactStatus, CrmContact[]>();
    STATUS_ORDER.forEach((s) => map.set(s, []));
    contacts.forEach((c) => map.get(c.status)?.push(c));
    return map;
  }, [contacts]);

  const tasksByContact = useMemo(() => {
    const m = new Map<string, CrmTask>();
    tasks.forEach((t) => {
      if (t.contact_id && !m.has(t.contact_id)) m.set(t.contact_id, t);
    });
    return m;
  }, [tasks]);

  const onDrop = async (status: CrmContactStatus) => {
    if (!draggedId) return;
    const c = contacts.find((x) => x.id === draggedId);
    if (!c || c.status === status) { setDraggedId(null); return; }
    try {
      await updateContactStatus(draggedId, status);
      toast.success(`Déplacé vers ${STATUS_LABELS[status]}`);
      if (status === "partenaire") setPendingPartner({ ...c, status });
      reload();
    } catch (e: any) { toast.error(e.message); }
    setDraggedId(null);
  };

  return (
    <div className="space-y-4">
      <h1 className="font-display text-3xl">Pipeline commercial</h1>
      <div className="flex gap-3 overflow-x-auto pb-4">
        {STATUS_ORDER.map((status) => {
          const items = columns.get(status) ?? [];
          const totalResidences = items.length; // simplification: 1 per contact
          return (
            <div
              key={status}
              className="flex-shrink-0 w-72 bg-muted/30 rounded-lg p-3 space-y-2"
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => onDrop(status)}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-sm">{STATUS_LABELS[status]}</h3>
                  <Badge variant="secondary">{items.length}</Badge>
                </div>
                <span className="text-xs text-muted-foreground">{totalResidences} résid.</span>
              </div>
              {items.map((c) => {
                const since = daysSince(c.updated_at);
                const colorClass = since !== null && since > 14 ? "text-red-600" : since !== null && since > 7 ? "text-orange-600" : "text-muted-foreground";
                const todayStr = new Date().toISOString().slice(0, 10);
                const overdueFollow = c.next_followup_date && c.next_followup_date < todayStr;
                const task = tasksByContact.get(c.id);
                return (
                  <Card
                    key={c.id}
                    draggable
                    onDragStart={() => setDraggedId(c.id)}
                    onClick={() => navigate(`/admin/crm/contacts/${c.id}`)}
                    className="p-3 cursor-pointer hover:shadow-md transition space-y-1.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-medium text-sm leading-tight">{c.name}</div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <TypeBadge type={c.type} />
                    </div>
                    <div className={`text-xs ${colorClass}`}>
                      {since !== null ? `Il y a ${since}j` : "Jamais contacté"}
                    </div>
                    {task && (
                      <div className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                        <ClipboardList className="h-3 w-3 flex-shrink-0" /> {task.title}
                      </div>
                    )}
                    {c.next_followup_date && (
                      <div className={`text-xs ${overdueFollow ? "text-red-600 font-medium" : "text-muted-foreground"}`}>
                        Relance : {formatDate(c.next_followup_date)}
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          );
        })}
      </div>

      <Dialog open={!!pendingPartner} onOpenChange={(o) => !o && setPendingPartner(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Attribuer dans MyLivingHome ?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            Souhaitez-vous attribuer les résidences de <strong>{pendingPartner?.name}</strong> dans MyLivingHome maintenant ?
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingPartner(null)}>Plus tard</Button>
            <Button onClick={() => { setPendingPartner(null); navigate("/admin/residences"); }}>Oui, attribuer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
