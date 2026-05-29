import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Bell, BellOff, Pencil, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/modules/auth/AuthProvider";
import { TicketComments } from "@/modules/tickets/TicketComments";
import { TicketModal } from "@/modules/tickets/TicketModal";
import {
  deleteTicket,
  getTicket,
  listParticipants,
  toggleParticipant,
} from "@/modules/tickets/ticketsApi";
import {
  TICKET_PRIORITY_COLORS,
  TICKET_PRIORITY_LABELS,
  TICKET_STATUS_LABELS,
  type TicketParticipant,
  type TicketPriority,
  type TicketStatus,
} from "@/modules/tickets/types";

interface FullTicket {
  id: string;
  title: string;
  description: string | null;
  status: TicketStatus;
  priority: TicketPriority;
  deadline: string | null;
  screenshots: string[];
  created_by: string;
  created_at: string;
}

const LAST_VISIT_KEY = "admin_tickets_last_visits";

export default function AdminTicketDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [ticket, setTicket] = useState<FullTicket | null>(null);
  const [participants, setParticipants] = useState<TicketParticipant[]>([]);
  const [isSuper, setIsSuper] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!id) return;
    try {
      const t = await getTicket(id);
      setTicket(t as FullTicket);
      setParticipants(await listParticipants(id));
    } catch (e) {
      toast({ title: "Erreur", description: (e as Error).message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!id) return;
    document.title = "Détail ticket · Admin";
    load();

    // Mark as visited
    try {
      const v = JSON.parse(localStorage.getItem(LAST_VISIT_KEY) || "{}");
      v[id] = new Date().toISOString();
      localStorage.setItem(LAST_VISIT_KEY, JSON.stringify(v));
    } catch {
      /* ignore */
    }

    // Super admin check
    if (user) {
      supabase
        .from("profiles")
        .select("is_super_admin")
        .eq("user_id", user.id)
        .maybeSingle()
        .then(({ data }) => setIsSuper(!!data?.is_super_admin));
    }

    const channel = supabase
      .channel(`ticket-${id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "admin_ticket_participants", filter: `ticket_id=eq.${id}` },
        () => load(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user?.id]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }
  if (!ticket) {
    return <p className="text-center text-muted-foreground py-12">Ticket introuvable.</p>;
  }

  const isFollowing = !!participants.find((p) => p.user_id === user?.id);
  const canEdit = user?.id === ticket.created_by || isSuper;

  const handleFollow = async () => {
    if (!user) return;
    try {
      await toggleParticipant(ticket.id, user.id, !isFollowing);
      load();
    } catch (e) {
      toast({ title: "Erreur", description: (e as Error).message, variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    try {
      await deleteTicket(ticket.id);
      toast({ title: "Ticket supprimé" });
      navigate("/admin/tickets");
    } catch (e) {
      toast({ title: "Erreur", description: (e as Error).message, variant: "destructive" });
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Button variant="ghost" size="sm" onClick={() => navigate("/admin/tickets")}>
        <ArrowLeft className="h-4 w-4 mr-2" /> Retour aux tickets
      </Button>

      <div className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-display">{ticket.title}</h1>
            <div className="flex gap-2 mt-2 flex-wrap">
              <Badge className={TICKET_PRIORITY_COLORS[ticket.priority]}>
                {TICKET_PRIORITY_LABELS[ticket.priority]}
              </Badge>
              <Badge variant="outline">{TICKET_STATUS_LABELS[ticket.status]}</Badge>
              {ticket.deadline && (
                <Badge variant="outline">
                  Échéance : {new Date(ticket.deadline).toLocaleDateString("fr-BE")}
                </Badge>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleFollow}>
              {isFollowing ? <BellOff className="h-4 w-4 mr-2" /> : <Bell className="h-4 w-4 mr-2" />}
              {isFollowing ? "Ne plus suivre" : "Suivre"}
            </Button>
            {canEdit && (
              <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
                <Pencil className="h-4 w-4 mr-2" /> Éditer
              </Button>
            )}
            {isSuper && (
              <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}>
                <Trash2 className="h-4 w-4 mr-2" /> Supprimer
              </Button>
            )}
          </div>
        </div>

        {ticket.description && (
          <div className="prose prose-sm max-w-none whitespace-pre-wrap text-foreground/90">
            {ticket.description}
          </div>
        )}

        {ticket.screenshots.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {ticket.screenshots.map((url) => (
              <a key={url} href={url} target="_blank" rel="noreferrer">
                <img src={url} alt="" className="w-full h-40 object-cover rounded-md border" />
              </a>
            ))}
          </div>
        )}

        <p className="text-sm text-muted-foreground">
          🔔 {participants.length} participant(s) suivent ce ticket
        </p>
      </div>

      <div className="border-t pt-6">
        <TicketComments ticketId={ticket.id} />
      </div>

      <TicketModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSaved={load}
        initial={{
          id: ticket.id,
          title: ticket.title,
          description: ticket.description ?? "",
          status: ticket.status,
          priority: ticket.priority,
          deadline: ticket.deadline,
          screenshots: ticket.screenshots,
        }}
      />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce ticket ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Tous les commentaires associés seront également supprimés.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
