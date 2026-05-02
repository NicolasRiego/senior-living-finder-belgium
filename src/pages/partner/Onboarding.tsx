import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/modules/auth/AuthProvider";
import { toast } from "sonner";

const slugify = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

export default function PartnerOnboarding() {
  const nav = useNavigate();
  const { refresh } = useAuth();
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");

  const [code, setCode] = useState("");

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    const { data, error } = await supabase.rpc("create_organization_with_owner", {
      _name: name,
      _slug: slug || slugify(name),
      _contact_email: contactEmail || null,
      _contact_phone: contactPhone || null,
    });
    setCreating(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Organisation créée !");
    await refresh();
    nav("/partenaire");
  };

  const onJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setJoining(true);
    const { error } = await supabase.rpc("accept_org_invitation", { _code: code.trim() });
    setJoining(false);
    if (error) {
      toast.error("Code invalide ou expiré");
      return;
    }
    toast.success("Vous avez rejoint l'organisation");
    await refresh();
    nav("/partenaire");
  };

  return (
    <div className="container max-w-2xl py-12">
      <h1 className="font-display text-4xl mb-2">Bienvenue 👋</h1>
      <p className="text-lg text-muted-foreground mb-8">
        Pour gérer vos résidences, créez votre organisation ou rejoignez-en une existante.
      </p>

      <Tabs defaultValue="create">
        <TabsList className="grid w-full grid-cols-2 h-12">
          <TabsTrigger value="create" className="text-base">Créer mon organisation</TabsTrigger>
          <TabsTrigger value="join" className="text-base">Rejoindre via un code</TabsTrigger>
        </TabsList>

        <TabsContent value="create">
          <Card>
            <CardHeader>
              <CardTitle>Nouvelle organisation</CardTitle>
              <CardDescription>Vous en serez le propriétaire (owner).</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={onCreate} className="space-y-4">
                <div className="space-y-2">
                  <Label>Nom de l'organisation *</Label>
                  <Input required value={name} onChange={(e) => { setName(e.target.value); if (!slug) setSlug(slugify(e.target.value)); }} className="h-12" />
                </div>
                <div className="space-y-2">
                  <Label>Slug (identifiant URL) *</Label>
                  <Input required value={slug} onChange={(e) => setSlug(slugify(e.target.value))} className="h-12" />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>E-mail de contact</Label>
                    <Input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} className="h-12" />
                  </div>
                  <div className="space-y-2">
                    <Label>Téléphone</Label>
                    <Input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} className="h-12" />
                  </div>
                </div>
                <Button type="submit" size="lg" disabled={creating || !name || !slug} className="w-full">
                  {creating ? "Création…" : "Créer mon organisation"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="join">
          <Card>
            <CardHeader>
              <CardTitle>Rejoindre une organisation</CardTitle>
              <CardDescription>Saisissez le code reçu de votre administrateur.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={onJoin} className="space-y-4">
                <div className="space-y-2">
                  <Label>Code d'invitation</Label>
                  <Input required value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="ABCD1234" className="h-12 text-lg tracking-widest text-center" />
                </div>
                <Button type="submit" size="lg" disabled={joining || code.length < 4} className="w-full">
                  {joining ? "Vérification…" : "Rejoindre"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
