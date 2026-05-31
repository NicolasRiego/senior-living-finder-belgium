import { useEffect, useState } from "react";
import { getScreenshotSignedUrl } from "./ticketsApi";

type Props = {
  stored: string;
  alt?: string;
  className?: string;
};

/** Resolves a stored screenshot reference into a short-lived signed URL and renders it. */
export function TicketScreenshot({ stored, alt = "", className }: Props) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getScreenshotSignedUrl(stored).then((u) => {
      if (!cancelled) setUrl(u);
    });
    return () => {
      cancelled = true;
    };
  }, [stored]);

  if (!url) {
    return <div className={className} aria-hidden="true" />;
  }
  return <img src={url} alt={alt} className={className} loading="lazy" />;
}
