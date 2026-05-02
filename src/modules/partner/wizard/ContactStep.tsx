import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAutosave } from "../useAutosave";
import { StepProps } from "@/pages/partner/ResidenceEditor";

export default function ContactStep({ residence, onChange, setExternalSaving }: StepProps) {
  const [local, setLocal] = useState({
    contact_email: residence.contact_email ?? "",
    contact_phone: residence.contact_phone ?? "",
    website: residence.website ?? "",
  });

  useAutosave(local, async (v) => {
    setExternalSaving("saving");
    const { error } = await supabase.from("residences").update({
      contact_email: v.contact_email || null,
      contact_phone: v.contact_phone || null,
      website: v.website || null,
    }).eq("id", residence.id);
    if (error) { setExternalSaving("error"); throw error; }
    setExternalSaving("saved");
    onChange(v as any);
  });

  return (
    <Card>
      <CardHeader><CardTitle>Étape 8 — Contact</CardTitle></CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <Label>E-mail public</Label>
          <Input type="email" value={local.contact_email} onChange={(e) => setLocal((s) => ({ ...s, contact_email: e.target.value }))} className="h-12" />
        </div>
        <div className="space-y-2">
          <Label>Téléphone public</Label>
          <Input value={local.contact_phone} onChange={(e) => setLocal((s) => ({ ...s, contact_phone: e.target.value }))} className="h-12" />
        </div>
        <div className="space-y-2">
          <Label>Site web</Label>
          <Input value={local.website} onChange={(e) => setLocal((s) => ({ ...s, website: e.target.value }))} placeholder="https://" className="h-12" />
        </div>
      </CardContent>
    </Card>
  );
}
