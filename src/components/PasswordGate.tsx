import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const STORAGE_KEY = "silverplace.access";
const PASSWORD = "silverplace2026";

export function PasswordGate({ children }: { children: ReactNode }) {
  const [unlocked, setUnlocked] = useState(
    () => typeof window !== "undefined" && localStorage.getItem(STORAGE_KEY) === "granted",
  );
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (unlocked) return <>{children}</>;

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === PASSWORD) {
      localStorage.setItem(STORAGE_KEY, "granted");
      setUnlocked(true);
    } else {
      setError("Mot de passe incorrect, veuillez réessayer.");
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="font-display text-4xl text-primary">MyLivingHome</CardTitle>
          <p className="mt-2 text-sm text-muted-foreground">
            Site en construction — accès réservé
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-5" noValidate>
            <div className="space-y-2">
              <Label htmlFor="site-password" className="text-base">
                Mot de passe
              </Label>
              <Input
                id="site-password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError(null);
                }}
                autoFocus
                required
                className="h-12 text-base"
                aria-invalid={!!error}
                aria-describedby={error ? "site-password-error" : undefined}
              />
              {error && (
                <p id="site-password-error" role="alert" className="text-sm font-medium text-destructive">
                  {error}
                </p>
              )}
            </div>
            <Button type="submit" size="lg" className="w-full" disabled={!password}>
              Accéder au site
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
