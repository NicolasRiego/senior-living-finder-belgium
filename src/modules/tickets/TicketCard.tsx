import { memo } from "react";
import { Link } from "react-router-dom";
import { MessageSquare, Users, CalendarClock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  TICKET_PRIORITY_COLORS,
  TICKET_PRIORITY_LABELS,
  type TicketRow,
} from "./types";

type Props = { ticket: TicketRow; unread: boolean };

function formatDate(d: string | null) {
  if (!d) return null;
  return new Date(d).toLocaleDateString("fr-BE", { day: "2-digit", month: "short" });
}

function TicketCardComponent({ ticket, unread }: Props) {
  const deadline = formatDate(ticket.deadline);
  return (
    <Link to={`/admin/tickets/${ticket.id}`} className="block">
      <Card
        className={cn(
          "p-3 hover:shadow-md transition-shadow space-y-2",
          unread && "border-primary ring-1 ring-primary/30",
        )}
      >
        {ticket.screenshots[0] && (
          <img
            src={ticket.screenshots[0]}
            alt=""
            className="w-full h-24 object-cover rounded-md"
            loading="lazy"
          />
        )}
        <h3 className={cn("text-sm leading-snug", unread ? "font-bold" : "font-semibold")}>
          {ticket.title}
        </h3>
        <div className="flex items-center gap-1.5 flex-wrap">
          <Badge variant="secondary" className={cn("text-[10px]", TICKET_PRIORITY_COLORS[ticket.priority])}>
            {TICKET_PRIORITY_LABELS[ticket.priority]}
          </Badge>
          {deadline && (
            <Badge variant="outline" className="text-[10px] gap-1">
              <CalendarClock className="h-3 w-3" /> {deadline}
            </Badge>
          )}
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <MessageSquare className="h-3 w-3" /> {ticket.comment_count}
          </span>
          <span className="flex items-center gap-1">
            <Users className="h-3 w-3" /> {ticket.participant_count}
          </span>
        </div>
      </Card>
    </Link>
  );
}

export const TicketCard = memo(TicketCardComponent);
