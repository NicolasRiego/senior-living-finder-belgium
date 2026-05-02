import { useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Mail } from "lucide-react";

export default function LoginPage() {
  const [params] = useSearchParams();
  const redirect = params.get("redirect") ?? "/partenaire";
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const redirectTo = `${window.location.origin}${redirect}`;
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: redirectTo },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setSent(true);
  };

  return (
    <div className="container max-w-md py-16">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-display">Connexion</CardTitle>
          <CardDescription className="text-lg">
            Recevez un lien magique par e-mail. Pas de mot de passe à retenir.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sent ? (
            <div className="space-y-4 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Mail className="h-7 w-7" />
              </div>
              <p className="text-lg">
                Vérifiez votre boîte mail <strong>{email}</strong>.
              </p>
              <p className="text-muted-foreground">
                Cliquez sur le lien reçu pour vous connecter. Pensez à vérifier vos spams.
              </p>
              <Button variant="ghost" onClick={() => setSent(false)}>
                Utiliser une autre adresse
              </Button>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-base">Adresse e-mail</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="vous@residence.be"
                  autoComplete="email"
                  className="h-12 text-base"
                />
              </div>
              <Button type="submit" size="lg" className="w-full" disabled={loading || !email}>
                {loading ? "Envoi…" : "Recevoir le lien magique"}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                <Link to="/" className="underline">Retour à l'accueil</Link>
              </p>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
