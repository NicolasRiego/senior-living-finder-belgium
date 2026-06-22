import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import { I18nProvider } from "@/modules/i18n/I18nProvider";
import { CompareProvider } from "@/modules/compare/CompareProvider";
import { AuthProvider } from "@/modules/auth/AuthProvider";
import { FontSizeProvider } from "@/modules/accessibility/FontSizeContext";
import { RequireAuth } from "@/modules/auth/RequireAuth";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { PartnerLayout } from "@/components/layout/PartnerLayout";
import { ScrollToTop } from "@/components/layout/ScrollToTop";
import { PasswordGate } from "@/components/PasswordGate";
import { LoginGateDialog } from "@/modules/auth/loginGate";

import HomePage from "./pages/Home";
import ResidencesPage from "./pages/Residences";
import ApartmentsPage from "./pages/Apartments";
import ApartmentDetailPage from "./pages/ApartmentDetail";
import ResidenceDetailPage from "./pages/ResidenceDetail";
import ComparePage from "./pages/Compare";
import AdvicePage from "./pages/Advice";
import ContactPage from "./pages/Contact";
import LoginPage from "./pages/auth/Login";
import SignupPage from "./pages/auth/Signup";
import MyAccountPage from "./pages/account/MyAccount";
import MyDataPage from "./pages/account/MyData";
import NotFound from "./pages/NotFound";
import MaintenancePage from "./pages/Maintenance";

import PartnerOnboarding from "./pages/partner/Onboarding";
import PartnerDashboard from "./pages/partner/Dashboard";
import PartnerLeads from "./pages/partner/Leads";
import ResidenceEditor from "./pages/partner/ResidenceEditor";
import ResidencePreview from "./pages/partner/ResidencePreview";
import ApartmentsList from "./pages/partner/ApartmentsList";
import MyResidences from "./pages/partner/MyResidences";
import Trash from "./pages/partner/Trash";
import ApartmentEditor from "./pages/partner/ApartmentEditor";
import AdminValidation from "./pages/admin/AdminValidation";
import AdminResidences from "./pages/admin/AdminResidences";
import AdminVersions from "./pages/admin/AdminVersions";
import AdminAuditLog from "./pages/admin/AdminAuditLog";
import AdminDeployHistory from "./pages/admin/AdminDeployHistory";
import AdminDemo from "./pages/admin/AdminDemo";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminTickets from "./pages/admin/AdminTickets";
import AdminTasks from "./pages/admin/AdminTasks";
import AdminTicketDetail from "./pages/admin/AdminTicketDetail";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminLeads from "./pages/admin/AdminLeads";
import CrmDashboard from "./pages/admin/crm/CrmDashboard";
import CrmContacts from "./pages/admin/crm/CrmContacts";
import CrmContactDetail from "./pages/admin/crm/CrmContactDetail";
import CrmGroupDetail from "./pages/admin/crm/CrmGroupDetail";
import CrmPipeline from "./pages/admin/crm/CrmPipeline";
import CrmCampaigns from "./pages/admin/crm/CrmCampaigns";
import CrmCampaignDetail from "./pages/admin/crm/CrmCampaignDetail";
import CrmTemplates from "./pages/admin/crm/CrmTemplates";

import { AdminLayout } from "./components/layout/AdminLayout";

const queryClient = new QueryClient();
const MAINTENANCE = import.meta.env.VITE_MAINTENANCE_MODE === "true";

const App = () => (
  <QueryClientProvider client={queryClient}>
    <I18nProvider>
      <FontSizeProvider>
       <AuthProvider>
        <CompareProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <LoginGateDialog />
            <PasswordGate>
            <BrowserRouter>
              <ScrollToTop />
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
                    <Route path="/appartements" element={<ApartmentsPage />} />
                    <Route path="/appartements/:id" element={<ApartmentDetailPage />} />
                    <Route path="/comparateur" element={<ComparePage />} />
                    <Route path="/conseils" element={<AdvicePage />} />
                    <Route path="/contact" element={<ContactPage />} />
                    <Route path="/connexion" element={<LoginPage />} />
                    <Route path="/inscription" element={<SignupPage />} />
                    <Route path="/mon-espace" element={<RequireAuth><MyAccountPage /></RequireAuth>} />
                    <Route path="/mon-espace/donnees" element={<RequireAuth><MyDataPage /></RequireAuth>} />
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
                    path="/partenaire/residences"
                    element={
                      <RequireAuth requireOrg>
                        <PartnerLayout><MyResidences /></PartnerLayout>
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
                  <Route
                    path="/partenaire/residences/:residenceId/appartements"
                    element={
                      <RequireAuth requireOrg>
                        <PartnerLayout><ApartmentsList /></PartnerLayout>
                      </RequireAuth>
                    }
                  />
                  <Route
                    path="/partenaire/residences/:residenceId/appartements/nouveau"
                    element={
                      <RequireAuth requireOrg>
                        <PartnerLayout><ApartmentEditor /></PartnerLayout>
                      </RequireAuth>
                    }
                  />
                  <Route
                    path="/partenaire/residences/:residenceId/appartements/:apartmentId"
                    element={
                      <RequireAuth requireOrg>
                        <PartnerLayout><ApartmentEditor /></PartnerLayout>
                      </RequireAuth>
                    }
                  />
                  <Route
                    path="/partenaire/corbeille"
                    element={
                      <RequireAuth requireOrg>
                        <PartnerLayout><Trash /></PartnerLayout>
                      </RequireAuth>
                    }
                  />
                  <Route
                    path="/partenaire/leads"
                    element={
                      <RequireAuth requireOrg>
                        <PartnerLayout><PartnerLeads /></PartnerLayout>
                      </RequireAuth>
                    }
                  />

                  {/* Admin */}
                  <Route path="/admin" element={<RequireAuth requireAdmin><AdminLayout><AdminDashboard /></AdminLayout></RequireAuth>} />
                  <Route
                    path="/admin/validation"
                    element={<RequireAuth requireAdmin><AdminLayout><AdminValidation /></AdminLayout></RequireAuth>}
                  />
                  <Route
                    path="/admin/residences"
                    element={<RequireAuth requireAdmin><AdminLayout><AdminResidences /></AdminLayout></RequireAuth>}
                  />
                  <Route
                    path="/admin/residences/:id/versions"
                    element={<RequireAuth requireAdmin><AdminLayout><AdminVersions /></AdminLayout></RequireAuth>}
                  />
                  <Route
                    path="/admin/audit"
                    element={<RequireAuth requireAdmin><AdminLayout><AdminAuditLog /></AdminLayout></RequireAuth>}
                  />
                  <Route
                    path="/admin/deploiements"
                    element={<RequireAuth requireAdmin><AdminLayout><AdminDeployHistory /></AdminLayout></RequireAuth>}
                  />
                  <Route
                    path="/admin/demo"
                    element={<RequireAuth requireAdmin><AdminLayout><AdminDemo /></AdminLayout></RequireAuth>}
                  />
                  <Route
                    path="/admin/utilisateurs"
                    element={<RequireAuth requireAdmin><AdminLayout><AdminUsers /></AdminLayout></RequireAuth>}
                  />
                  <Route
                    path="/admin/tickets"
                    element={<RequireAuth requireAdmin><AdminLayout><AdminTickets /></AdminLayout></RequireAuth>}
                  />
                  <Route
                    path="/admin/tickets/:id"
                    element={<RequireAuth requireAdmin><AdminLayout><AdminTicketDetail /></AdminLayout></RequireAuth>}
                  />
                  <Route path="/admin/crm" element={<RequireAuth requireAdmin><AdminLayout><CrmDashboard /></AdminLayout></RequireAuth>} />
                  <Route path="/admin/crm/contacts" element={<RequireAuth requireAdmin><AdminLayout><CrmContacts /></AdminLayout></RequireAuth>} />
                  <Route path="/admin/crm/contacts/:id" element={<RequireAuth requireAdmin><AdminLayout><CrmContactDetail /></AdminLayout></RequireAuth>} />
                  <Route path="/admin/crm/groupes/:id" element={<RequireAuth requireAdmin><AdminLayout><CrmGroupDetail /></AdminLayout></RequireAuth>} />
                  <Route path="/admin/crm/pipeline" element={<RequireAuth requireAdmin><AdminLayout><CrmPipeline /></AdminLayout></RequireAuth>} />
                  <Route path="/admin/crm/campagnes" element={<RequireAuth requireAdmin><AdminLayout><CrmCampaigns /></AdminLayout></RequireAuth>} />
                  <Route path="/admin/crm/campagnes/:id" element={<RequireAuth requireAdmin><AdminLayout><CrmCampaignDetail /></AdminLayout></RequireAuth>} />
                  <Route path="/admin/crm/templates" element={<RequireAuth requireAdmin><AdminLayout><CrmTemplates /></AdminLayout></RequireAuth>} />
                  <Route path="/admin/leads" element={<RequireAuth requireAdmin><AdminLayout><AdminLeads /></AdminLayout></RequireAuth>} />



                  <Route path="*" element={<PublicLayout><NotFound /></PublicLayout>} />
                </Routes>
              )}
            </BrowserRouter>
            </PasswordGate>
          </TooltipProvider>
        </CompareProvider>
       </AuthProvider>
      </FontSizeProvider>
    </I18nProvider>
  </QueryClientProvider>
);

// Helper used inside the public layout route — outlet replacement so nested public routes render
import { Outlet } from "react-router-dom";
const AppOutlet = () => <Outlet />;

export default App;
