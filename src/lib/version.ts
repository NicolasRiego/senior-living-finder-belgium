/**
 * Application version surfaced from build-time env (VITE_APP_VERSION).
 * Typically set to a Git tag or commit SHA by CI.
 * Falls back to "dev" when not provided.
 */
export const APP_VERSION: string =
  (import.meta.env?.VITE_APP_VERSION as string | undefined) ?? "dev";
