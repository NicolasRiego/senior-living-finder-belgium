import { Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  open: boolean;
  onClose: () => void;
  url: string;
  name: string;
};

export default function PebPreviewModal({ open, onClose, url, name }: Props) {
  if (!open) return null;
  const isPdf = /\.pdf(\?|$)/i.test(url);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Aperçu du certificat PEB"
      className="fixed inset-0 z-50 flex flex-col bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div className="flex items-center justify-between gap-3 px-4 py-3 text-white">
        <p className="text-sm font-medium truncate">{name}</p>
        <div className="flex items-center gap-2">
          <Button asChild variant="secondary" size="sm">
            <a href={url} download={name} target="_blank" rel="noopener noreferrer">
              <Download className="h-4 w-4 mr-2" /> Télécharger
            </a>
          </Button>
          <Button variant="secondary" size="sm" onClick={onClose}>
            <X className="h-4 w-4 mr-2" /> Fermer
          </Button>
        </div>
      </div>
      <div
        className="flex-1 p-4 overflow-auto flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        {isPdf ? (
          <iframe
            src={url}
            title="Certificat PEB"
            className="w-full h-full min-h-[70vh] bg-white rounded"
          />
        ) : (
          <img
            src={url}
            alt={name}
            className="max-h-full max-w-full object-contain bg-white rounded"
          />
        )}
      </div>
    </div>
  );
}
