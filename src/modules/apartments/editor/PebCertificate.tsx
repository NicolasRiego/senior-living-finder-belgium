import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
  FileText, Upload, Eye, EyeOff, Trash2, Loader2,
} from "lucide-react";
import PebPreviewModal from "../PebPreviewModal";

type PebState = {
  url: string | null;
  name: string | null;
  uploadedAt: string | null;
  visible: boolean;
};

const BUCKET = "peb-certificates";

export default function PebCertificate() {
  const { residenceId, apartmentId } = useParams<{ residenceId: string; apartmentId?: string }>();
  const [state, setState] = useState<PebState>({
    url: null, name: null, uploadedAt: null, visible: true,
  });
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!apartmentId) { setLoading(false); return; }
    (async () => {
      const { data } = await supabase
        .from("apartments")
        .select("peb_certificate_url, peb_certificate_name, peb_certificate_uploaded_at, peb_certificate_visible")
        .eq("id", apartmentId)
        .maybeSingle();
      if (data) {
        setState({
          url: (data.peb_certificate_url as string) ?? null,
          name: (data.peb_certificate_name as string) ?? null,
          uploadedAt: (data.peb_certificate_uploaded_at as string) ?? null,
          visible: (data.peb_certificate_visible as boolean) ?? true,
        });
      }
      setLoading(false);
    })();
  }, [apartmentId]);

  if (!apartmentId || !residenceId) {
    return (
      <Card>
        <CardHeader><CardTitle>Certificat PEB</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Enregistrez d'abord l'appartement pour pouvoir téléverser un certificat PEB.
          </p>
        </CardContent>
      </Card>
    );
  }

  const onPickFile = () => inputRef.current?.click();

  const onUpload = async (file: File) => {
    const ext = (file.name.split(".").pop() ?? "pdf").toLowerCase();
    if (!["pdf", "png", "jpg", "jpeg", "webp"].includes(ext)) {
      toast.error("Format non supporté (PDF, PNG, JPG)"); return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Fichier trop volumineux (10 Mo max)"); return;
    }
    setUploading(true);
    setProgress(10);
    const path = `${residenceId}/${apartmentId}/peb.${ext}`;
    // remove previous file at any extension if needed
    if (state.url) {
      const oldExt = (state.url.split(".").pop() ?? "").split("?")[0].toLowerCase();
      if (oldExt && oldExt !== ext) {
        await supabase.storage.from(BUCKET).remove([`${residenceId}/${apartmentId}/peb.${oldExt}`]);
      }
    }
    setProgress(40);
    const { error: upErr } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, { upsert: true, contentType: file.type || undefined });
    if (upErr) { setUploading(false); setProgress(0); toast.error(upErr.message); return; }
    setProgress(70);
    const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
    const url = pub.publicUrl;
    const uploadedAt = new Date().toISOString();
    const { error: dbErr } = await supabase
      .from("apartments")
      .update({
        peb_certificate_url: url,
        peb_certificate_name: file.name,
        peb_certificate_uploaded_at: uploadedAt,
        peb_certificate_visible: true,
      })
      .eq("id", apartmentId);
    if (dbErr) { setUploading(false); setProgress(0); toast.error(dbErr.message); return; }
    setState({ url, name: file.name, uploadedAt, visible: true });
    setProgress(100);
    setTimeout(() => { setUploading(false); setProgress(0); }, 400);
    toast.success("Certificat PEB téléversé");
  };

  const onToggleVisible = async (visible: boolean) => {
    setState((s) => ({ ...s, visible }));
    const { error } = await supabase
      .from("apartments")
      .update({ peb_certificate_visible: visible })
      .eq("id", apartmentId);
    if (error) {
      setState((s) => ({ ...s, visible: !visible }));
      toast.error(error.message);
    } else {
      toast.success(visible ? "Certificat visible" : "Certificat masqué");
    }
  };

  const onDelete = async () => {
    if (!state.url) return;
    const ext = (state.url.split(".").pop() ?? "").split("?")[0].toLowerCase();
    await supabase.storage.from(BUCKET).remove([`${residenceId}/${apartmentId}/peb.${ext}`]);
    const { error } = await supabase
      .from("apartments")
      .update({
        peb_certificate_url: null,
        peb_certificate_name: null,
        peb_certificate_uploaded_at: null,
        peb_certificate_visible: true,
      })
      .eq("id", apartmentId);
    if (error) { toast.error(error.message); return; }
    setState({ url: null, name: null, uploadedAt: null, visible: true });
    setConfirmDelete(false);
    toast.success("Certificat supprimé");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Certificat PEB</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.png,.jpg,.jpeg,.webp,application/pdf,image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onUpload(f);
            e.target.value = "";
          }}
        />

        {loading ? (
          <p className="text-sm text-muted-foreground">Chargement…</p>
        ) : !state.url ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Téléversez le certificat PEB officiel (PDF, JPG ou PNG, 10 Mo max).
            </p>
            <Button onClick={onPickFile} disabled={uploading}>
              {uploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
              {uploading ? `Envoi… ${progress}%` : "Téléverser un certificat"}
            </Button>
            {uploading && (
              <div className="h-2 w-full bg-muted rounded overflow-hidden">
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-muted/40 px-4 py-3">
              <FileText className="h-5 w-5 text-primary shrink-0" aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="font-medium truncate">{state.name ?? "Certificat PEB"}</p>
                {state.uploadedAt && (
                  <p className="text-xs text-muted-foreground">
                    Téléversé le {new Date(state.uploadedAt).toLocaleDateString("fr-BE", {
                      day: "2-digit", month: "long", year: "numeric",
                    })}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setPreviewOpen(true)}>
                <Eye className="h-4 w-4 mr-2" /> Voir l'aperçu
              </Button>
              <Button variant="outline" size="sm" onClick={onPickFile} disabled={uploading}>
                <Upload className="h-4 w-4 mr-2" /> Remplacer
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfirmDelete(true)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" /> Supprimer
              </Button>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border px-4 py-3">
              <div className="flex items-center gap-2">
                {state.visible ? (
                  <span className="inline-flex items-center gap-2 text-sm font-medium text-green-700">
                    <Eye className="h-4 w-4" /> ✓ Visible sur la fiche publique
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <EyeOff className="h-4 w-4" /> ○ Masqué du public
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Visible aux visiteurs</span>
                <Switch
                  checked={state.visible}
                  onCheckedChange={onToggleVisible}
                  aria-label="Visibilité du certificat PEB"
                />
              </div>
            </div>
          </div>
        )}

        <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Supprimer définitivement ce certificat PEB ?</AlertDialogTitle>
              <AlertDialogDescription>
                Cette action est irréversible.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction
                onClick={onDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Supprimer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {state.url && (
          <PebPreviewModal
            open={previewOpen}
            onClose={() => setPreviewOpen(false)}
            url={state.url}
            name={state.name ?? "certificat-peb"}
          />
        )}
      </CardContent>
    </Card>
  );
}
