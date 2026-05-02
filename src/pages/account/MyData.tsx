import { useState } from "react";
import { Link } from "react-router-dom";
import { Download, Trash2, ShieldCheck, ArrowLeft, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/modules/auth/AuthProvider";

export default function MyDataPage() {
  const { toast } = useToast();
  const { user, signOut } = useAuth();
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const exportData = async () => {
    setExporting(true);
    const { data, error } = await supabase.rpc("export_my_data");
    setExporting(false);
    if (error) {
      toast({ title: "Erreur d'export", description: error.message, variant: "destructive" });
      return;
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `seréniacare-mes-donnees-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Export téléchargé" });
  };

  const deleteAccount = async () => {
    setDeleting(true);
    const { error } = await supabase.rpc("anonymize_my_account");
    if (error) {
      setDeleting(false);
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
      return;
    }
    await signOut();
    toast({ title: "Compte supprimé", description: "Vos données personnelles ont été effacées." });
    window.location.href = "/";
  };

  return (
    <div className="container max-w-3xl py-12">
      <Button asChild variant="ghost" size="sm" className="mb-6">
        <Link to="/mon-espace"><ArrowLeft className="h-4 w-4" /> Mon espace</Link>
      </Button>

      <header className="mb-8">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary-soft px-3 py-1 text-sm text-primary">
          <ShieldCheck className="h-4 w-4" /> RGPD
        </div>
        <h1 className="font-display text-3xl font-semibold md:text-4xl">Mes données personnelles</h1>
        <p className="mt-2 text-muted-foreground">
          Conformément au RGPD, vous pouvez à tout moment exporter ou supprimer vos données personnelles.
        </p>
      </header>

      <div className="space-y-6">
        <section className="rounded-2xl border border-border/60 bg-card p-6 shadow-soft">
          <h2 className="font-display text-xl font-semibold">Compte</h2>
          <p className="mt-1 text-sm text-muted-foreground">{user?.email}</p>
        </section>

        <section className="rounded-2xl border border-border/60 bg-card p-6 shadow-soft">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
              <Download className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h2 className="font-display text-xl font-semibold">Exporter mes données</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Téléchargez un fichier JSON contenant votre profil, vos demandes (leads) et vos favoris.
              </p>
              <Button onClick={exportData} disabled={exporting} className="mt-4">
                {exporting ? <><Loader2 className="h-4 w-4 animate-spin" /> Préparation…</> : "Télécharger l'export"}
              </Button>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-destructive/30 bg-card p-6 shadow-soft">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <Trash2 className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h2 className="font-display text-xl font-semibold">Supprimer mon compte</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Votre profil et vos favoris seront définitivement effacés. Les demandes envoyées aux résidences seront
                <strong> anonymisées</strong> (nom, e-mail et téléphone retirés) afin que les partenaires conservent l'historique
                de leurs échanges, sans plus pouvoir vous identifier.
              </p>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="mt-4" disabled={deleting}>
                    {deleting ? <><Loader2 className="h-4 w-4 animate-spin" /> Suppression…</> : "Supprimer mon compte"}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
                    <AlertDialogDescription>
                      Cette action est irréversible. Votre profil sera effacé et vos demandes anonymisées.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                    <AlertDialogAction onClick={deleteAccount} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      Supprimer définitivement
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-border/60 bg-muted/30 p-6 text-sm text-muted-foreground">
          <h3 className="font-medium text-foreground">Conservation des données</h3>
          <p className="mt-2">
            Les demandes envoyées aux résidences sont automatiquement anonymisées au-delà de 24 mois.
            Toute consultation d'une de vos demandes par un partenaire est tracée dans notre journal d'audit.
          </p>
        </section>
      </div>
    </div>
  );
}
