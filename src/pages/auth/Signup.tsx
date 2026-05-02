import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Heart, Building2, ArrowLeft } from "lucide-react";

type AccountType = "family" | "partner";

export default function SignupPage() {
  const nav = useNavigate();
  const [params, setParams] = useSearchParams();
  const type = params.get("type") as AccountType | null;

  if (!type) return <ChoiceScreen onSelect={(t) => setParams({ type: t })} />;
  return <SignupForm type={type} onBack={() => setParams({})} onDone={() => {
    nav(type === "partner" ? "/partenaire/onboarding" : "/mon-espace");
  }} />;
}

function ChoiceScreen({ onSelect }: { onSelect: (t: AccountType) => void }) {
  return (
    <div className="container max-w-4xl py-16">
      <h1 className="font-display text-4xl text-center mb-3">Créer mon compte</h1>
      <p className="text-center text-lg text-muted-foreground mb-10">
        Quel type de compte souhaitez-vous créer ?
      </p>

      <div className="grid gap-6 md:grid-cols-2">
        <button
          onClick={() => onSelect("family")}
          className="group rounded-3xl border-2 border-border bg-card p-8 text-left transition-all hover:border-primary hover:shadow-elegant focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30"
        >
          <div className="mb-5 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Heart className="h-8 w-8" />
          </div>
          <h2 className="font-display text-2xl mb-2">Je cherche une résidence</h2>
          <p className="text-base text-muted-foreground">
            Pour vous, un proche ou vos parents. Sauvegardez vos favoris, comparez les
            résidences et suivez vos demandes de contact.
          </p>
          <p className="mt-6 font-semibold text-primary group-hover:underline">
            Créer un compte famille →
          </p>
        </button>

        <button
          onClick={() => onSelect("partner")}
          className="group rounded-3xl border-2 border-border bg-card p-8 text-left transition-all hover:border-primary hover:shadow-elegant focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30"
        >
          <div className="mb-5 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Building2 className="h-8 w-8" />
          </div>
          <h2 className="font-display text-2xl mb-2">Je gère une résidence</h2>
          <p className="text-base text-muted-foreground">
            Référencez votre résidence-services, seigneurie ou maison de repos. Gérez vos
            offres, recevez des contacts qualifiés et suivez vos statistiques.
          </p>
          <p className="mt-6 font-semibold text-primary group-hover:underline">
            Créer un compte partenaire →
          </p>
        </button>
      </div>

      <p className="text-center text-base mt-10">
        Déjà inscrit ?{" "}
        <Link to="/connexion" className="font-semibold text-primary underline">Se connecter</Link>
      </p>
    </div>
  );
}

function SignupForm({ type, onBack, onDone }: { type: AccountType; onBack: () => void; onDone: () => void }) {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }
    if (password !== confirm) {
      toast.error("Les mots de passe ne correspondent pas.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: {
          display_name: displayName,
          account_type: type,
        },
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Compte créé ! Vous êtes connecté.");
    onDone();
  };

  return (
    <div className="container max-w-md py-16">
      <Button variant="ghost" onClick={onBack} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-2" /> Changer de type
      </Button>
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-display">
            {type === "partner" ? "Compte résidence" : "Compte famille"}
          </CardTitle>
          <CardDescription className="text-base">
            {type === "partner"
              ? "Vous pourrez ensuite créer ou rejoindre votre organisation."
              : "Sauvegardez vos favoris et suivez vos demandes."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-base">
                {type === "partner" ? "Votre nom" : "Nom complet"}
              </Label>
              <Input
                id="name"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="h-12 text-base"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-base">E-mail</Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                className="h-12 text-base"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-base">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                className="h-12 text-base"
              />
              <p className="text-sm text-muted-foreground">8 caractères minimum.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm" className="text-base">Confirmer le mot de passe</Label>
              <Input
                id="confirm"
                type="password"
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="new-password"
                className="h-12 text-base"
              />
            </div>
            <Button type="submit" size="lg" className="w-full" disabled={loading}>
              {loading ? "Création…" : "Créer mon compte"}
            </Button>
            <p className="text-center text-base">
              Déjà inscrit ?{" "}
              <Link to="/connexion" className="font-semibold text-primary underline">Se connecter</Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
