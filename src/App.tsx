import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Schools from "./pages/Schools";
import SchoolDetail from "./pages/SchoolDetail";
import Auth from "./pages/Auth";
import UploadList from "./pages/UploadList";
import Partners from "./pages/Partners";
import Institutions from "./pages/Institutions";
import Brands from "./pages/Brands";
import Dashboard from "./pages/admin/Dashboard";
import AdminSchools from "./pages/admin/Schools";
import AdminLists from "./pages/admin/Lists";
import Analytics from "./pages/admin/Analytics";
import AdminLeads from "./pages/admin/Leads";
import ClaimRequests from "./pages/admin/ClaimRequests";
import SchoolAdminDashboard from "./pages/school-admin/Dashboard";
import SchoolAdminLists from "./pages/school-admin/Lists";
import SchoolAdminPreview from "./pages/school-admin/Preview";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/escolas" element={<Schools />} />
            <Route path="/escola/:slug" element={<SchoolDetail />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/contribuir" element={<UploadList />} />
            <Route path="/parceiros" element={<Partners />} />
            <Route path="/instituicoes" element={<Institutions />} />
            <Route path="/marcas" element={<Brands />} />
            {/* Admin routes */}
            <Route path="/admin" element={<Dashboard />} />
            <Route path="/admin/escolas" element={<AdminSchools />} />
            <Route path="/admin/listas" element={<AdminLists />} />
            <Route path="/admin/analytics" element={<Analytics />} />
            <Route path="/admin/leads" element={<AdminLeads />} />
            <Route path="/admin/requisicoes" element={<ClaimRequests />} />
            {/* School Admin routes */}
            <Route path="/escola-admin" element={<SchoolAdminDashboard />} />
            <Route path="/escola-admin/listas" element={<SchoolAdminLists />} />
            <Route path="/escola-admin/preview" element={<SchoolAdminPreview />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
