import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Sparkles, RotateCw, Copy, Save } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/modules/auth/AuthProvider";
import {
  createInteraction,
  draftMessage,
  listTemplates,
} from "./api";
import {
  MESSAGE_LANG_LABELS,
  MESSAGE_TONE_LABELS,
  MESSAGE_TYPE_LABELS,
  type CrmContact,
  type CrmMessageLanguage,
  type CrmMessageTone,
  type CrmMessageType,
  type CrmTemplate,
} from "./types";

type Props = {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  contact: CrmContact;
  lastInteractionSummary?: string | null;
  residencesCount?: number;
  onSaved?: () => void;
};

export function MessageComposerDialog({
  open,
  onOpenChange,
  contact,
  lastInteractionSummary,
  residencesCount = 1,
  onSaved,
}: Props) {
  const { user } = useAuth();
  const [messageType, setMessageType] = useState<CrmMessageType>("premier_contact");
  const [language, setLanguage] = useState<CrmMessageLanguage>("fr");
  const [tone, setTone] = useState<CrmMessageTone>("professionnel");
  const [templates, setTemplates] = useState<CrmTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [extraInstructions, setExtraInstructions] = useState<string>("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    listTemplates().then(setTemplates).catch(() => {});
  }, [open]);

  const applyTemplate = (id: string) => {
    setSelectedTemplateId(id);
    const t = templates.find((x) => x.id === id);
    if (!t) return;
    setMessageType(t.message_type as CrmMessageType);
    setLanguage(t.language as CrmMessageLanguage);
    setTone(t.tone as CrmMessageTone);
    setExtraInstructions(t.extra_instructions ?? "");
  };

  const generate = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await draftMessage({
        messageType,
        language,
        tone,
        contact,
        lastInteraction: lastInteractionSummary ?? null,
        residencesCount,
        extraInstructions,
      });
      setSubject(res.subject);
      setBody(res.body);
    } catch (e: any) {
      setError(e?.message || "Erreur de génération. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  const copyAll = async () => {
    await navigator.clipboard.writeText(`Objet : ${subject}\n\n${body}`);
    toast.success("Message copié");
  };

  const saveAsInteraction = async () => {
    if (!subject && !body) return toast.error("Générez d'abord un message");
    setSaving(true);
    try {
      await createInteraction({
        contact_id: contact.id,
        type: "email",
        summary: subject || "(sans objet)",
        content: body,
        date: new Date().toISOString(),
        created_by: user?.id ?? null,
      } as any);
      toast.success("Message enregistré dans la timeline ✓");
      onSaved?.();
      onOpenChange(false);
      // reset for next open
      setSubject("");
      setBody("");
    } catch (e: any) {
      toast.error(e?.message || "Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  const hasMessage = useMemo(() => Boolean(subject || body), [subject, body]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" /> Rédiger un message — {contact.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Templates */}
          {templates.length > 0 && (
            <div>
              <Label className="text-xs">Template (optionnel)</Label>
              <Select value={selectedTemplateId} onValueChange={applyTemplate}>
                <SelectTrigger><SelectValue placeholder="— Choisir un template —" /></SelectTrigger>
                <SelectContent>
                  {templates.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Type */}
          <div>
            <Label className="text-xs mb-2 block">Type de message</Label>
            <RadioGroup value={messageType} onValueChange={(v) => setMessageType(v as CrmMessageType)} className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {Object.entries(MESSAGE_TYPE_LABELS).map(([k, v]) => (
                <label key={k} className="flex items-center gap-2 rounded border p-2 cursor-pointer hover:bg-muted/50">
                  <RadioGroupItem value={k} id={`mt-${k}`} />
                  <span className="text-sm">{v}</span>
                </label>
              ))}
            </RadioGroup>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Langue</Label>
              <Select value={language} onValueChange={(v) => setLanguage(v as CrmMessageLanguage)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(MESSAGE_LANG_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Ton</Label>
              <Select value={tone} onValueChange={(v) => setTone(v as CrmMessageTone)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(MESSAGE_TONE_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="text-xs">Instructions additionnelles (optionnel)</Label>
            <Textarea
              value={extraInstructions}
              onChange={(e) => setExtraInstructions(e.target.value)}
              rows={2}
              placeholder="Ex : mentionner notre récente présence au salon Zorg & Co…"
            />
          </div>

          {/* Loading / error */}
          {loading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground border rounded p-3 bg-muted/30">
              <Loader2 className="h-4 w-4 animate-spin" />
              L'IA rédige votre message…
            </div>
          )}
          {error && (
            <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded p-3">{error}</div>
          )}

          {/* Generated message */}
          {hasMessage && (
            <div className="space-y-3 border rounded-lg p-3 bg-card">
              <div>
                <Label className="text-xs">Objet</Label>
                <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">Message</Label>
                <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={14} />
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex-wrap gap-2">
          <Button onClick={generate} disabled={loading} className="bg-primary hover:bg-primary/90">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {hasMessage ? "Générer à nouveau" : "Générer avec l'IA"}
          </Button>
          {hasMessage && (
            <>
              <Button variant="outline" onClick={generate} disabled={loading}>
                <RotateCw className="h-4 w-4" /> Régénérer
              </Button>
              <Button variant="outline" onClick={copyAll}>
                <Copy className="h-4 w-4" /> Copier
              </Button>
              <Button onClick={saveAsInteraction} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Enregistrer comme interaction
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
