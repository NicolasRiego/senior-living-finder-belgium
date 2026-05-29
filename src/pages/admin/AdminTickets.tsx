import { useEffect, useMemo, useState } from "react";
import { Plus, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { TicketCard } from "@/modules/tickets/TicketCard";
import { TicketModal } from "@/modules/tickets/TicketModal";
import { listTickets, updateTicketStatus } from "@/modules/tickets/ticketsApi";
import {
  TICKET_PRIORITY_LABELS,
  TICKET_STATUS_LABELS,
  TICKET_STATUS_ORDER,
  type TicketPriority,
  type TicketRow,
  type TicketStatus,
} from "@/modules/tickets/types";

const LAST_VISIT_KEY = "admin_tickets_last_visits";

function getLastVisits(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(LAST_VISIT_KEY) || "{}");
  } catch {
    return {};
  }
}

export default function AdminTickets() {
  const [tickets, setTickets] = useState<TicketRow[]>([]);
  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<TicketPriority | "all">("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [visits] = useState<Record<string, string>>(getLastVisits());

  const load = async () => {
    try {
      setTickets(await listTickets());
    } catch (e) {
      toast({ title: "Erreur", description: (e as Error).message, variant: "destructive" });
    }
  };

  useEffect(() => {
    document.title = "Tickets · Admin";
    load();
    const channel = supabase
      .channel("admin-tickets")
      .on("postgres_changes", { event: "*", schema: "public", table: "admin_tickets" }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "admin_ticket_comments" }, () => load())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filtered = useMemo(() => {
    return tickets.filter((t) => {
      if (priorityFilter !== "all" && t.priority !== priorityFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!t.title.toLowerCase().includes(q) && !(t.creator_email || "").toLowerCase().includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [tickets, search, priorityFilter]);

  const columns = useMemo(() => {
    const map: Record<TicketStatus, TicketRow[]> = {
      a_reflechir: [],
      a_faire: [],
      en_cours: [],
      resolu: [],
    };
    filtered.forEach((t) => map[t.status].push(t));
    return map;
  }, [filtered]);

  const handleDrop = async (status: TicketStatus) => {
    if (!draggingId) return;
    const ticket = tickets.find((t) => t.id === draggingId);
    setDraggingId(null);
    if (!ticket || ticket.status === status) return;
    try {
      await updateTicketStatus(draggingId, status);
    } catch (e) {
      toast({ title: "Erreur", description: (e as Error).message, variant: "destructive" });
    }
  };

  const isUnread = (t: TicketRow) => {
    if (!t.last_comment_at) return false;
    const last = visits[t.id];
    if (!last) return true;
    return new Date(t.last_comment_at) > new Date(last);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-display">Tickets</h1>
          <p className="text-sm text-muted-foreground">{tickets.length} ticket(s) au total</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> Nouveau ticket
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3 p-3 border rounded-md bg-card">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value as TicketPriority | "all")}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="all">Toutes priorités</option>
          {(Object.keys(TICKET_PRIORITY_LABELS) as TicketPriority[]).map((p) => (
            <option key={p} value={p}>
              {TICKET_PRIORITY_LABELS[p]}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {TICKET_STATUS_ORDER.map((status) => (
          <div
            key={status}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleDrop(status)}
            className="bg-muted/30 rounded-lg p-3 min-h-[300px] space-y-3"
          >
            <h2 className="font-semibold text-sm flex items-center justify-between">
              {TICKET_STATUS_LABELS[status]}
              <span className="text-xs text-muted-foreground">{columns[status].length}</span>
            </h2>
            <div className="space-y-3">
              {columns[status].map((t) => (
                <div
                  key={t.id}
                  draggable
                  onDragStart={() => setDraggingId(t.id)}
                  onDragEnd={() => setDraggingId(null)}
                  className="cursor-grab active:cursor-grabbing"
                >
                  <TicketCard ticket={t} unread={isUnread(t)} />
                </div>
              ))}
              {columns[status].length === 0 && (
                <p className="text-xs text-muted-foreground italic text-center py-4">Aucun ticket</p>
              )}
            </div>
          </div>
        ))}
      </div>

      <TicketModal open={modalOpen} onClose={() => setModalOpen(false)} onSaved={load} />
    </div>
  );
}
