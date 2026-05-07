import type { ReactNode } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { useFontSize } from "@/modules/accessibility/FontSizeContext";

export function PublicLayout({ children }: { children: ReactNode }) {
  const { size } = useFontSize();
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Header />
      <main
        id="main"
        data-fontsize={size}
        className="flex-1 max-w-[100vw] [overflow-x:clip]"
      >
        {children}
      </main>
      <Footer />
    </div>
  );
}
