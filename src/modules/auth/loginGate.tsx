import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
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

type GateState = { open: boolean; title: string; description: string };

const listeners = new Set<(s: GateState) => void>();
let state: GateState = {
  open: false,
  title: "Connectez-vous pour enregistrer",
  description: "Créez un compte gratuit ou connectez-vous pour enregistrer vos favoris.",
};

function setState(next: Partial<GateState>) {
  state = { ...state, ...next };
  listeners.forEach((l) => l(state));
}

export function openLoginGate(opts?: { title?: string; description?: string }) {
  setState({
    open: true,
    title: opts?.title ?? "Connectez-vous pour enregistrer",
    description:
      opts?.description ??
      "Créez un compte gratuit ou connectez-vous pour enregistrer vos favoris.",
  });
}

export function LoginGateDialog() {
  const [s, setS] = useState(state);
  useEffect(() => {
    listeners.add(setS);
    return () => {
      listeners.delete(setS);
    };
  }, []);

  return (
    <AlertDialog open={s.open} onOpenChange={(o) => setState({ open: o })}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{s.title}</AlertDialogTitle>
          <AlertDialogDescription>{s.description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction asChild>
            <Link to="/inscription" onClick={() => setState({ open: false })}>
              Créer un compte
            </Link>
          </AlertDialogAction>
          <AlertDialogAction asChild>
            <Link to="/connexion" onClick={() => setState({ open: false })}>
              Se connecter
            </Link>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
