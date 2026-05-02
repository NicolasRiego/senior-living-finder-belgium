import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import { I18nProvider } from "@/modules/i18n/I18nProvider";
import { CompareProvider } from "@/modules/compare/CompareProvider";
import { PublicLayout } from "@/components/layout/PublicLayout";

import HomePage from "./pages/Home";
import ResidencesPage from "./pages/Residences";
import ResidenceDetailPage from "./pages/ResidenceDetail";
import ComparePage from "./pages/Compare";
import AdvicePage from "./pages/Advice";
import ContactPage from "./pages/Contact";
import LoginPage from "./pages/Login";
import NotFound from "./pages/NotFound";
import MaintenancePage from "./pages/Maintenance";

const queryClient = new QueryClient();

const MAINTENANCE = import.meta.env.VITE_MAINTENANCE_MODE === "true";

const App = () => (
  <QueryClientProvider client={queryClient}>
    <I18nProvider>
      <CompareProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            {MAINTENANCE ? (
              <Routes>
                <Route path="*" element={<MaintenancePage />} />
              </Routes>
            ) : (
              <PublicLayout>
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/residences" element={<ResidencesPage />} />
                  <Route path="/residences/:slug" element={<ResidenceDetailPage />} />
                  <Route path="/comparateur" element={<ComparePage />} />
                  <Route path="/conseils" element={<AdvicePage />} />
                  <Route path="/contact" element={<ContactPage />} />
                  <Route path="/connexion" element={<LoginPage />} />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </PublicLayout>
            )}
          </BrowserRouter>
        </TooltipProvider>
      </CompareProvider>
    </I18nProvider>
  </QueryClientProvider>
);

export default App;
