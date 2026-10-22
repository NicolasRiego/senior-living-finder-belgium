import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Trash2, FileText, FileSpreadsheet, Image as ImageIcon, File as FileIcon, Download, Upload, Eye } from "lucide-react";
import { toast } from "@/hooks/use-toast";

// Bucket privé : on lit les fichiers via le client Supabase (session admin),
// jamais via une URL publique. Les chemins existants (colonne file_url) sont inchangés.
const BUCKET = "admin-documents";

type DocRow = {
  id: string; title: string; description: string | null;
  file_url: string; file_name: string; file_type: string | null; file_size: number | null;
  task_id: string | null; uploaded_by: string | null; created_at: string;
};
type TaskLite = { id: string; title: string };
type Admin = { user_id: string; display_name: string | null; email: string | null };

const formatSize = (n: number | null) => {
  if (!n) return "";
  if (n < 1024) return `${n} o`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} Ko`;
  return `${(n / 1024 / 1024).toFixed(1)} Mo`;
};

const isImage = (d: DocRow) =>
  (d.file_type || "").toLowerCase().startsWith("image/") || /\.(png|jpe?g|gif|webp|svg)$/i.test(d.file_name);
const isPdf = (d: DocRow) =>
  (d.file_type || "").toLowerCase() === "application/pdf" || /\.pdf$/i.test(d.file_name);
const isText = (d: DocRow) =>
  (d.file_type || "").toLowerCase().startsWith("text/") || /\.(txt|csv)$/i.test(d.file_name);
// Seuls ces formats s'affichent dans le navigateur ; Word, Excel, PowerPoint… se téléchargent.
const canPreview = (d: DocRow) => isImage(d) || isPdf(d) || isText(d);

const docIconFor = (d: DocRow) => {
  const t = (d.file_type || "").toLowerCase();
  const n = d.file_name.toLowerCase();
  if (t.startsWith("image/") || /\.(png|jpe?g|gif|webp|svg|heic)$/.test(n)) return <ImageIcon className="h-5 w-5 text-purple-600" />;
  if (t === "application/pdf" || n.endsWith(".pdf")) return <FileText className="h-5 w-5 text-red-600" />;
  if (t.includes("sheet") || /\.(xlsx?|csv|ods)$/.test(n)) return <FileSpreadsheet className="h-5 w-5 text-navy-600" />;
  if (t.includes("word") || /\.(docx?|odt|rtf)$/.test(n)) return <FileText className="h-5 w-5 text-blue-600" />;
  return <FileIcon className="h-5 w-5 text-muted-foreground" />;
};

export default function AdminDrive() {
  const [documents, setDocuments] = useState<DocRow[]>([]);
  const [tasks, setTasks] = useState<TaskLite[]>([]);
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [docFilterTask, setDocFilterTask] = useState<string>("all");
  const [docOpen, setDocOpen] = useState(false);
  const [docTitle, setDocTitle] = useState("");
  const [docDescription, setDocDescription] = useState("");
  const [docTaskId, setDocTaskId] = useState<string>("none");
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docUploading, setDocUploading] = useState(false);

  const loadDocuments = async () => {
    const { data, error } = await (supabase as any)
      .from("admin_task_documents")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      toast({ title: "Erreur documents", description: error.message, variant: "destructive" });
      return;
    }
    setDocuments((data ?? []) as DocRow[]);
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [t, a] = await Promise.all([
        supabase.from("admin_tasks").select("id, title").order("created_at", { ascending: false }),
        supabase.rpc("admin_list_admins"),
        loadDocuments(),
      ]);
      if (!t.error) setTasks((t.data ?? []) as TaskLite[]);
      if (!a.error) setAdmins((a.data ?? []) as Admin[]);
      setLoading(false);
    })();
  }, []);

  const adminMap = useMemo(() => {
    const m = new Map<string, Admin>();
    admins.forEach((u) => m.set(u.user_id, u));
    return m;
  }, [admins]);

  const taskTitleById = useMemo(() => {
    const m = new Map<string, string>();
    tasks.forEach((t) => m.set(t.id, t.title));
    return m;
  }, [tasks]);

  const filteredDocs = useMemo(() => {
    if (docFilterTask === "all") return documents;
    if (docFilterTask === "none") return documents.filter((d) => !d.task_id);
    return documents.filter((d) => d.task_id === docFilterTask);
  }, [documents, docFilterTask]);

  const resetDocForm = () => {
    setDocTitle(""); setDocDescription(""); setDocTaskId("none"); setDocFile(null);
  };

  const uploadDocument = async () => {
    if (!docTitle.trim()) { toast({ title: "Titre requis", variant: "destructive" }); return; }
    if (!docFile) { toast({ title: "Fichier requis", variant: "destructive" }); return; }
    setDocUploading(true);
    try {
      const { data: userRes } = await supabase.auth.getUser();
      const uid = userRes.user?.id;
      if (!uid) throw new Error("Non connecté");
      const ext = docFile.name.includes(".") ? docFile.name.split(".").pop() : "";
      const path = `${uid}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext ? "." + ext : ""}`;
      const up = await supabase.storage.from(BUCKET).upload(path, docFile, {
        contentType: docFile.type || undefined,
        upsert: false,
      });
      if (up.error) throw up.error;
      const ins = await (supabase as any).from("admin_task_documents").insert({
        title: docTitle.trim(),
        description: docDescription.trim() || null,
        file_url: path,
        file_name: docFile.name,
        file_type: docFile.type || null,
        file_size: docFile.size,
        task_id: docTaskId === "none" ? null : docTaskId,
        uploaded_by: uid,
      });
      if (ins.error) {
        // Évite un fichier orphelin dans le stockage si la ligne n'a pas pu être créée.
        await supabase.storage.from(BUCKET).remove([path]);
        throw ins.error;
      }
      toast({ title: "Document ajouté" });
      setDocOpen(false);
      resetDocForm();
      loadDocuments();
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    } finally {
      setDocUploading(false);
    }
  };

  // Récupère le fichier avec la session de l'admin connecté (fonctionne avec le bucket privé).
  const fetchBlob = async (d: DocRow) => {
    const { data, error } = await supabase.storage.from(BUCKET).download(d.file_url);
    if (error || !data) throw new Error(error?.message || "Fichier introuvable");
    const type = d.file_type || data.type || "application/octet-stream";
    return data.type === type ? data : new Blob([data], { type });
  };

  const saveBlob = (blob: Blob, fileName: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName; // nom d'origine, pas le nom technique du stockage
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  };

  const downloadDocument = async (d: DocRow) => {
    setBusyId(d.id);
    try {
      saveBlob(await fetchBlob(d), d.file_name);
    } catch (e: any) {
      toast({ title: "Téléchargement impossible", description: e.message, variant: "destructive" });
    } finally {
      setBusyId(null);
    }
  };

  const openDocument = async (d: DocRow) => {
    if (!canPreview(d)) { downloadDocument(d); return; }
    // L'onglet est ouvert tout de suite (pendant le clic) pour ne pas être bloqué comme pop-up.
    const win = window.open("", "_blank");
    setBusyId(d.id);
    try {
      const url = URL.createObjectURL(await fetchBlob(d));
      if (win) {
        win.location.href = url;
      } else {
        window.location.assign(url);
      }
      setTimeout(() => URL.revokeObjectURL(url), 5 * 60_000);
    } catch (e: any) {
      win?.close();
      toast({ title: "Ouverture impossible", description: e.message, variant: "destructive" });
    } finally {
      setBusyId(null);
    }
  };

  const deleteDocument = async (d: DocRow) => {
    if (!confirm("Supprimer ce document ?")) return;
    await supabase.storage.from(BUCKET).remove([d.file_url]);
    const { error } = await (supabase as any).from("admin_task_documents").delete().eq("id", d.id);
    if (error) { toast({ title: "Erreur", description: error.message, variant: "destructive" }); return; }
    setDocuments((prev) => prev.filter((x) => x.id !== d.id));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-display font-semibold">Drive</h1>
          <p className="text-muted-foreground text-sm">Documents internes partagés entre administrateurs</p>
        </div>
        <Button onClick={() => { resetDocForm(); setDocOpen(true); }} className="bg-navy-600 hover:bg-navy-700 text-white">
          <Upload className="h-4 w-4" /> Ajouter un document
        </Button>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-[240px]">
          <Label className="text-xs">Filtrer par tâche</Label>
          <Select value={docFilterTask} onValueChange={setDocFilterTask}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes</SelectItem>
              <SelectItem value="none">Sans tâche liée</SelectItem>
              {tasks.map((t) => (
                <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Chargement…</p>
      ) : filteredDocs.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">Aucun document</Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="text-left font-medium px-4 py-2">Document</th>
                  <th className="text-left font-medium px-4 py-2">Tâche liée</th>
                  <th className="text-left font-medium px-4 py-2">Ajouté par</th>
                  <th className="text-left font-medium px-4 py-2">Date</th>
                  <th className="px-4 py-2 w-28"></th>
                </tr>
              </thead>
              <tbody>
                {filteredDocs.map((d) => (
                  <tr key={d.id} className="border-t hover:bg-muted/30">
                    <td className="px-4 py-2">
                      <button
                        type="button"
                        onClick={() => openDocument(d)}
                        disabled={busyId === d.id}
                        className="flex items-start gap-2 text-left group"
                        title={canPreview(d) ? "Ouvrir" : "Télécharger"}
                      >
                        {docIconFor(d)}
                        <div className="min-w-0">
                          <div className="font-medium truncate group-hover:text-primary group-hover:underline">{d.title}</div>
                          <div className="text-xs text-muted-foreground truncate">
                            {d.file_name}{d.file_size ? ` · ${formatSize(d.file_size)}` : ""}
                          </div>
                          {d.description && (
                            <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{d.description}</div>
                          )}
                        </div>
                      </button>
                    </td>
                    <td className="px-4 py-2">
                      {d.task_id ? (
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          {taskTitleById.get(d.task_id) || "Tâche supprimée"}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-muted-foreground">
                      {d.uploaded_by ? (adminMap.get(d.uploaded_by)?.display_name || adminMap.get(d.uploaded_by)?.email || "—") : "—"}
                    </td>
                    <td className="px-4 py-2 text-muted-foreground whitespace-nowrap">
                      {new Date(d.created_at).toLocaleDateString("fr-BE")}
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex items-center justify-end gap-2">
                        {canPreview(d) && (
                          <button
                            onClick={() => openDocument(d)}
                            disabled={busyId === d.id}
                            className="text-muted-foreground hover:text-primary disabled:opacity-50"
                            aria-label="Ouvrir"
                            title="Ouvrir"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => downloadDocument(d)}
                          disabled={busyId === d.id}
                          className="text-muted-foreground hover:text-primary disabled:opacity-50"
                          aria-label="Télécharger"
                          title="Télécharger"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => deleteDocument(d)}
                          className="text-muted-foreground hover:text-destructive"
                          aria-label="Supprimer le document"
                          title="Supprimer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Dialog open={docOpen} onOpenChange={(o) => { setDocOpen(o); if (!o) resetDocForm(); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Ajouter un document</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Titre *</Label>
              <Input value={docTitle} onChange={(e) => setDocTitle(e.target.value)} />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={docDescription} onChange={(e) => setDocDescription(e.target.value)} rows={2} />
            </div>
            <div>
              <Label>Tâche liée</Label>
              <Select value={docTaskId} onValueChange={setDocTaskId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Aucune</SelectItem>
                  {tasks.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Fichier *</Label>
              <Input
                type="file"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.ppt,.pptx,.txt,.rtf,.odt,.ods,image/*"
                onChange={(e) => setDocFile(e.target.files?.[0] ?? null)}
              />
              {docFile && (
                <p className="text-xs text-muted-foreground mt-1">
                  {docFile.name} · {formatSize(docFile.size)}
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDocOpen(false)} disabled={docUploading}>Annuler</Button>
            <Button onClick={uploadDocument} disabled={docUploading} className="bg-navy-600 hover:bg-navy-700 text-white">
              {docUploading ? "Envoi…" : "Ajouter"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
