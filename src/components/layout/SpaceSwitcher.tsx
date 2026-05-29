import { useNavigate } from "react-router-dom";
import { Shield, Building2, User, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type Props = {
  triggerClassName?: string;
  variant?: "outline" | "ghost" | "default";
type Props = {
  triggerClassName?: string;
  variant?: "outline" | "ghost" | "default";
  size?: "sm" | "default";
  label?: string;
  onOpenChange?: (open: boolean) => void;
};

export function SpaceSwitcher({
  triggerClassName,
  variant = "outline",
  size = "sm",
  label = "Mon espace",
  onOpenChange,
}: Props) {
  const navigate = useNavigate();
  return (
    <DropdownMenu modal={false} onOpenChange={onOpenChange}>

        <Button variant={variant} size={size} className={cn("gap-1.5", triggerClassName)}>
          <User className="h-4 w-4" />
          <span>{label}</span>
          <ChevronDown className="h-4 w-4 opacity-70" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>Changer d'espace</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => navigate("/admin")}
          className="flex items-start gap-3 cursor-pointer py-2.5"
        >
          <Shield className="h-5 w-5 mt-0.5 text-primary" />
          <div>
            <p className="font-semibold leading-tight">Espace admin</p>
            <p className="text-xs text-muted-foreground">Gestion globale</p>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => navigate("/partenaire")}
          className="flex items-start gap-3 cursor-pointer py-2.5"
        >
          <Building2 className="h-5 w-5 mt-0.5 text-primary" />
          <div>
            <p className="font-semibold leading-tight">Espace gérant</p>
            <p className="text-xs text-muted-foreground">Gestion des résidences</p>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => navigate("/mon-espace")}
          className="flex items-start gap-3 cursor-pointer py-2.5"
        >
          <User className="h-5 w-5 mt-0.5 text-primary" />
          <div>
            <p className="font-semibold leading-tight">Espace utilisateur</p>
            <p className="text-xs text-muted-foreground">Vue senior / chercheur</p>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
