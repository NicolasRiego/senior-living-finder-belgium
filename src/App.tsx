import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import { I18nProvider } from "@/modules/i18n/I18nProvider";
import { CompareProvider } from "@/modules/compare/CompareProvider";
import { AuthProvider } from "@/modules/auth/AuthProvider";
import { RequireAuth } from "@/modules/auth/RequireAuth";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { PartnerLayout } from "@/components/layout/PartnerLayout";

import HomePage from "./pages/Home";
import ResidencesPage from "./pages/Residences";
import ResidenceDetailPage from "./pages/ResidenceDetail";
import ComparePage from "./pages/Compare";
import AdvicePage from "./pages/Advice";
import ContactPage from "./pages/Contact";
import LoginPage from "./pages/auth/Login";
import SignupPage from "./pages/auth/Signup";
import MyAccountPage from "./pages/account/MyAccount";
import NotFound from "./pages/NotFound";
import MaintenancePage from "./pages/Maintenance";

import PartnerOnboarding from "./pages/partner/Onboarding";
import PartnerDashboard from "./pages/partner/Dashboard";
import ResidenceEditor from "./pages/partner/ResidenceEditor";
import ResidencePreview from "./pages/partner/ResidencePreview";
import AdminValidation from "./pages/admin/AdminValidation";

const queryClient = new QueryClient();
const MAINTENANCE = import.meta.env.VITE_MAINTENANCE_MODE === "true";

const App = () => (
  <QueryClientProvider client={queryClient}>
    <I18nProvider>
      <AuthProvider>
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
                <Routes>
                  {/* Public */}
                  <Route element={<PublicLayout><AppOutlet /></PublicLayout>}>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/residences" element={<ResidencesPage />} />
                    <Route path="/residences/:slug" element={<ResidenceDetailPage />} />
                    <Route path="/comparateur" element={<ComparePage />} />
                    <Route path="/conseils" element={<AdvicePage />} />
                    <Route path="/contact" element={<ContactPage />} />
                    <Route path="/connexion" element={<LoginPage />} />
                    <Route path="/inscription" element={<SignupPage />} />
                    <Route path="/mon-espace" element={<RequireAuth><MyAccountPage /></RequireAuth>} />
                  </Route>

                  {/* Partner onboarding (auth, no layout) */}
                  <Route
                    path="/partenaire/onboarding"
                    element={<RequireAuth><PartnerOnboarding /></RequireAuth>}
                  />

                  {/* Partner area */}
                  <Route
                    path="/partenaire"
                    element={
                      <RequireAuth requireOrg>
                        <PartnerLayout><PartnerDashboard /></PartnerLayout>
                      </RequireAuth>
                    }
                  />
                  <Route
                    path="/partenaire/residences/:id/edition"
                    element={
                      <RequireAuth requireOrg>
                        <PartnerLayout><ResidenceEditor /></PartnerLayout>
                      </RequireAuth>
                    }
                  />
                  <Route
                    path="/partenaire/residences/:id/preview"
                    element={<RequireAuth><ResidencePreview /></RequireAuth>}
                  />

                  {/* Admin */}
                  <Route
                    path="/admin/validation"
                    element={<RequireAuth requireAdmin><AdminValidation /></RequireAuth>}
                  />

                  <Route path="*" element={<PublicLayout><NotFound /></PublicLayout>} />
                </Routes>
              )}
            </BrowserRouter>
          </TooltipProvider>
        </CompareProvider>
      </AuthProvider>
    </I18nProvider>
  </QueryClientProvider>
);

// Helper used inside the public layout route — outlet replacement so nested public routes render
import { Outlet } from "react-router-dom";
const AppOutlet = () => <Outlet />;

export default App;
