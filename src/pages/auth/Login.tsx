import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function LoginPage() {
  const nav = useNavigate();
  const [params] = useSearchParams();
  const redirectParam = params.get("redirect");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setLoading(false);
    if (error) {
      toast.error("Email ou mot de passe incorrect");
      return;
    }
    toast.success("Bienvenue !");
    // Route selon le type de compte
    if (redirectParam) {
      nav(redirectParam);
      return;
    }
    const [{ data: roleRows }, { data: profile }] = await Promise.all([
      supabase.from("user_roles").select("role").eq("user_id", data.user.id),
      supabase.from("profiles").select("account_type").eq("user_id", data.user.id).maybeSingle(),
    ]);
    const isAdmin = (roleRows ?? []).some((r) => r.role === "admin");
    if (isAdmin) nav("/admin");
    else if (profile?.account_type === "partner") nav("/partenaire");
    else nav("/mon-espace");
  };

  return (
    <div className="container max-w-md py-16">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-display">Connexion</CardTitle>
          <CardDescription className="text-base">
            Entrez vos identifiants pour accéder à votre espace.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-base">Adresse e-mail</Label>
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                className="h-12 text-base"
              />
            </div>
            <Button type="submit" size="lg" className="w-full" disabled={loading || !email || !password}>
              {loading ? "Connexion…" : "Se connecter"}
            </Button>
            <p className="text-center text-base">
              Pas encore de compte ?{" "}
              <Link to="/inscription" className="font-semibold text-primary underline">
                S'inscrire
              </Link>
            </p>
            <p className="text-center text-sm text-muted-foreground">
              <Link to="/" className="underline">Retour à l'accueil</Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
