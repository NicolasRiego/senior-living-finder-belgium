import { useEffect, useState } from "react";
import { Trash2, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/modules/auth/AuthProvider";
import { addComment, deleteComment, listComments } from "./ticketsApi";
import type { TicketComment } from "./types";

type Props = { ticketId: string };

function initials(name?: string | null, email?: string | null) {
  const src = name || email || "?";
  return src.slice(0, 2).toUpperCase();
}

function timeAgo(iso: string) {
  return new Date(iso).toLocaleString("fr-BE", { dateStyle: "short", timeStyle: "short" });
}

export function TicketComments({ ticketId }: Props) {
  const { user } = useAuth();
  const [comments, setComments] = useState<TicketComment[]>([]);
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);

  const load = async () => {
    try {
      setComments(await listComments(ticketId));
    } catch (e) {
      toast({ title: "Erreur", description: (e as Error).message, variant: "destructive" });
    }
  };

  useEffect(() => {
    load();
    const channel = supabase
      .channel(`tc-${ticketId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "admin_ticket_comments", filter: `ticket_id=eq.${ticketId}` },
        () => load(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticketId]);

  const handleSend = async () => {
    if (!user || !content.trim()) return;
    setSending(true);
    try {
      await addComment(ticketId, user.id, content.trim());
      setContent("");
    } catch (e) {
      toast({ title: "Erreur", description: (e as Error).message, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer ce commentaire ?")) return;
    try {
      await deleteComment(id);
    } catch (e) {
      toast({ title: "Erreur", description: (e as Error).message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="font-semibold text-lg">Commentaires ({comments.length})</h2>
      <div className="space-y-3">
        {comments.map((c) => (
          <div key={c.id} className="flex gap-3 items-start">
            <Avatar className="h-9 w-9">
              <AvatarFallback>{initials(c.author_name, c.author_email)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 bg-muted/50 rounded-md p-3">
              <div className="flex justify-between items-start gap-2 mb-1">
                <div className="text-sm">
                  <span className="font-medium">{c.author_name || c.author_email}</span>
                  <span className="text-muted-foreground ml-2 text-xs">{timeAgo(c.created_at)}</span>
                </div>
                {user?.id === c.author_id && (
                  <button
                    onClick={() => handleDelete(c.id)}
                    aria-label="Supprimer"
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
              <p className="text-sm whitespace-pre-wrap">{c.content}</p>
            </div>
          </div>
        ))}
        {comments.length === 0 && (
          <p className="text-sm text-muted-foreground italic">Aucun commentaire pour le moment.</p>
        )}
      </div>
      <div className="flex gap-2 items-end pt-2 border-t">
        <Textarea
          rows={2}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Écrire un commentaire…"
          className="resize-none"
        />
        <Button onClick={handleSend} disabled={sending || !content.trim()}>
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}
