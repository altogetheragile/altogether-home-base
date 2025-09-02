import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import AdminLayout from "@/components/admin/AdminLayout";
import ErrorBoundary from "@/components/ErrorBoundary";

import EventDetail from "./pages/EventDetail";
import Events from "./pages/Events";
import Blog from "./pages/Blog";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import AIToolsCanvas from "./pages/AIToolsCanvas";
import AccountSecurity from "./pages/AccountSecurity";
import NotFound from "./pages/NotFound";
import AdminEvents from "./pages/admin/AdminEvents";
import AdminInstructors from "./pages/admin/AdminInstructors";
import AdminLocations from "./pages/admin/AdminLocations";
import AdminTemplates from "./pages/admin/AdminTemplates";
import AdminEventTypes from "./pages/admin/AdminEventTypes";
import AdminEventCategories from "./pages/admin/AdminEventCategories";
import AdminLevels from "./pages/admin/AdminLevels";
import AdminFormats from "./pages/admin/AdminFormats";
import AdminPages from "./pages/admin/AdminPages";
import AdminLogs from "./pages/admin/AdminLogs";
import AdminLogsApplicationRoute from "./pages/admin/AdminLogsApplicationRoute";
import AdminLogsDatabaseRoute from "./pages/admin/AdminLogsDatabaseRoute";
import AdminLogsAuthRoute from "./pages/admin/AdminLogsAuthRoute";
import AdminImports from "./pages/admin/AdminImports";
import AdminKnowledgeImport from "./pages/admin/AdminKnowledgeImport";
import AdminPlanningLayers from "./pages/admin/AdminPlanningLayers";
import AdminActivityDomains from "./pages/admin/AdminActivityDomains";
import AdminKnowledgeItems from "./pages/admin/AdminKnowledgeItems";
import AdminKnowledgeCategories from "./pages/admin/AdminKnowledgeCategories";
import AdminKnowledgeTags from "./pages/admin/AdminKnowledgeTags";
import AdminKnowledgeLearningPaths from "./pages/admin/AdminKnowledgeLearningPaths";
import AdminKnowledgeAnalyticsRoute from "./pages/admin/AdminKnowledgeAnalyticsRoute";
import AdminMedia from "./pages/admin/AdminMedia";
import CreateEvent from "./pages/admin/CreateEvent";
import EditEvent from "./pages/admin/EditEvent";
import CreateInstructor from "./pages/admin/CreateInstructor";
import EditInstructor from "./pages/admin/EditInstructor";
import CreateKnowledgeItem from "./pages/admin/CreateKnowledgeItem";
import EditKnowledgeItem from "./pages/admin/EditKnowledgeItem";
import CreateKnowledgeUseCase from "./pages/admin/CreateKnowledgeUseCase";
import { PageEditor } from "./components/pageEditor/PageEditor";
import ProjectCanvas from "./pages/ProjectCanvas";
import { DynamicPageRenderer } from "./components/DynamicPageRenderer";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/events" element={<Events />} />
              <Route path="/events/:id" element={<EventDetail />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/auth/reset" element={<ResetPassword />} />
              <Route path="/ai-tools" element={<AIToolsCanvas />} />
              <Route path="/projects/:projectId/canvas" element={<ProtectedRoute><ProjectCanvas /></ProtectedRoute>} />
              
              <Route path="/account/security" element={<AccountSecurity />} />
              
              {/* Protected Admin Routes */}
              <Route path="/admin" element={
                <ProtectedRoute requiredRole="admin">
                  <AdminLayout />
                </ProtectedRoute>
              }>
                <Route path="events" element={<AdminEvents />} />
                <Route path="events/new" element={<CreateEvent />} />
                <Route path="events/:id/edit" element={<EditEvent />} />
                <Route path="instructors" element={<AdminInstructors />} />
                <Route path="instructors/new" element={<CreateInstructor />} />
                <Route path="instructors/:id/edit" element={<EditInstructor />} />
                <Route path="locations" element={<AdminLocations />} />
                <Route path="templates" element={<AdminTemplates />} />
                <Route path="event-types" element={<AdminEventTypes />} />
                <Route path="event-categories" element={<AdminEventCategories />} />
                <Route path="levels" element={<AdminLevels />} />
                <Route path="formats" element={<AdminFormats />} />
                <Route path="pages" element={<AdminPages />} />
                <Route path="pages/:id/edit" element={<PageEditor />} />
                <Route path="knowledge/items" element={<AdminKnowledgeItems />} />
                <Route path="knowledge/items/new" element={<CreateKnowledgeItem />} />
                <Route path="knowledge/items/:id/edit" element={<EditKnowledgeItem />} />
                <Route path="knowledge/items/:knowledgeItemId/use-cases/new" element={<CreateKnowledgeUseCase />} />
                <Route path="knowledge/items/:knowledgeItemId/use-cases/:useCaseId/edit" element={<CreateKnowledgeUseCase />} />
                <Route path="knowledge/categories" element={<AdminKnowledgeCategories />} />
                <Route path="knowledge/tags" element={<AdminKnowledgeTags />} />
                <Route path="knowledge/learning-paths" element={<AdminKnowledgeLearningPaths />} />
                <Route path="knowledge/analytics" element={<AdminKnowledgeAnalyticsRoute />} />
                <Route path="knowledge/planning-layers" element={<AdminPlanningLayers />} />
                <Route path="knowledge/activity-domains" element={<AdminActivityDomains />} />
                <Route path="knowledge/import" element={<AdminKnowledgeImport />} />
                <Route path="knowledge/imports" element={<AdminKnowledgeImport />} />
                <Route path="imports" element={<AdminImports />} />
                <Route path="media" element={<AdminMedia />} />
                <Route path="logs" element={<AdminLogs />} />
                <Route path="logs/application" element={<AdminLogsApplicationRoute />} />
                <Route path="logs/database" element={<AdminLogsDatabaseRoute />} />
                <Route path="logs/auth" element={<AdminLogsAuthRoute />} />
              </Route>
              
              {/* Dynamic Pages Route - handles root and other slugs */}
              <Route path="/" element={<DynamicPageRenderer slug="home" />} />
              <Route path="/:slug" element={<DynamicPageRenderer slug={window.location.pathname.slice(1)} />} />
              
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;