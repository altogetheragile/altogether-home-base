import React, { Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
const AdminLayout = React.lazy(() => import("./components/admin/AdminLayout"));
import ErrorBoundary from "@/components/ErrorBoundary";

import AdminModeration from "./pages/admin/AdminModeration";
import AdminDashboard from "./pages/admin/AdminDashboard";
import EventDetail from "./pages/EventDetail";
import Events from "./pages/Events";
import Blog from "./pages/Blog";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import AIToolsCanvas from "./pages/AIToolsCanvas";
import BMCGenerator from "./components/bmc/BMCGenerator";
import AccountSecurity from "./pages/AccountSecurity";
import NotFound from "./pages/NotFound";
import Dashboard from "./pages/Dashboard";
// Lazy load AdminEvents to prevent it from running on unrelated routes
const AdminEvents = React.lazy(() => import("./pages/admin/AdminEvents"));
import AdminInstructors from "./pages/admin/AdminInstructors";
import AdminLocations from "./pages/admin/AdminLocations";
import AdminEventBlueprints from "./pages/admin/AdminEventBlueprints";
import AdminAssets from "./pages/admin/AdminAssets";
import AdminEventTypes from "./pages/admin/AdminEventTypes";
import AdminEventCategories from "./pages/admin/AdminEventCategories";
import AdminLevels from "./pages/admin/AdminLevels";
import AdminFormats from "./pages/admin/AdminFormats";
import AdminPages from "./pages/admin/AdminPages";
import AdminLogs from "./pages/admin/AdminLogs";
import AdminLogsApplicationRoute from "./pages/admin/AdminLogsApplicationRoute";
import AdminLogsDatabaseRoute from "./pages/admin/AdminLogsDatabaseRoute";
import AdminLogsAuthRoute from "./pages/admin/AdminLogsAuthRoute";
import AdminAuditLogs from "./pages/admin/AdminAuditLogs";
import AdminImports from "./pages/admin/AdminImports";
import AdminKnowledgeImport from "./pages/admin/AdminKnowledgeImport";
import AdminActivityDomains from "./pages/admin/AdminActivityDomains";
import AdminKnowledgeItems from "./pages/admin/AdminKnowledgeItems";
import AdminKnowledgeTags from "./pages/admin/AdminKnowledgeTags";
const AdminUsers = React.lazy(() => import("./pages/admin/AdminUsers"));
import AdminKnowledgeLearningPaths from "./pages/admin/AdminKnowledgeLearningPaths";
import AdminKnowledgeAnalyticsRoute from "./pages/admin/AdminKnowledgeAnalyticsRoute";
import AdminKnowledgeTemplates from "./pages/admin/AdminKnowledgeTemplates";
import AdminClassifications from "./pages/admin/AdminClassifications";
import AdminMedia from "./pages/admin/AdminMedia";
import CreateEvent from "./pages/admin/CreateEvent";
import EditEvent from "./pages/admin/EditEvent";
import CreateInstructor from "./pages/admin/CreateInstructor";
import EditInstructor from "./pages/admin/EditInstructor";
import CreateKnowledgeItem from "./pages/admin/CreateKnowledgeItem";
import EditKnowledgeItem from "./pages/admin/EditKnowledgeItem";
import CreateKnowledgeUseCase from "./pages/admin/CreateKnowledgeUseCase";
import CreateKnowledgeTemplate from "./pages/admin/CreateKnowledgeTemplate";
import { PreviewPage } from "./components/admin/knowledge/PreviewPage";
import { PageEditor } from "./components/pageEditor/PageEditor";
import ProjectCanvas from "./pages/ProjectCanvas";
import Home from "./pages/Home";
import HomeSafe from "./pages/HomeSafe";
import { DynamicPageRenderer } from "./components/DynamicPageRenderer";
import Knowledge from "./pages/Knowledge";
import KnowledgeDetail from "./pages/KnowledgeDetail";


// Feature flags for gradual restoration
const ENABLE_ADMIN_ROUTES = true; // ✅ Re-enabling admin routes  
const ENABLE_PROTECTED_PROJECTS = true; // ✅ Hexagon canvas enabled
const ENABLE_DYNAMIC_PAGES = true; // ✅ Re-enabling CMS pages

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
              <Route path="/knowledge" element={<Knowledge />} />
              <Route path="/knowledge/:slug" element={<KnowledgeDetail />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/auth/reset" element={<ResetPassword />} />
              <Route path="/ai-tools" element={<AIToolsCanvas />} />
              <Route path="/bmc-generator" element={<BMCGenerator />} />
              
              {/* User Dashboard - Protected */}
              <Route path="/dashboard" element={
                <ProtectedRoute requireAAL2={true}>
                  <Dashboard />
                </ProtectedRoute>
              } />
              
              {/* Protected Project Routes (gated) */}
              {ENABLE_PROTECTED_PROJECTS && (
                <Route path="/projects/:projectId/canvas" element={<ProtectedRoute><ProjectCanvas /></ProtectedRoute>} />
              )}
              
              <Route path="/account/security" element={<AccountSecurity />} />
              
              {/* Protected Admin Routes (gated) */}
              {ENABLE_ADMIN_ROUTES && (
                <>
                  <Route path="/admin" element={
                    <ProtectedRoute requiredRole="admin" requireAAL2={true}>
                      <Suspense fallback={<div className="flex items-center justify-center h-64">Loading admin...</div>}>
                        <AdminLayout />
                      </Suspense>
                    </ProtectedRoute>
                  }>
                    {/* Admin Dashboard - Index/Landing Page */}
                    <Route index element={<AdminDashboard />} />
                    
                    {/* Users Management */}
                    <Route path="users" element={
                      <Suspense fallback={<div className="flex items-center justify-center h-64">Loading users...</div>}>
                        <AdminUsers />
                      </Suspense>
                    } />
                    
                    <Route path="events" element={
                      <ErrorBoundary fallback={
                        <div className="flex items-center justify-center h-64">
                          <div className="text-lg text-red-600">Failed to load Events module</div>
                        </div>
                      }>
                        <Suspense fallback={<div className="flex items-center justify-center h-64">Loading events...</div>}>
                          <AdminEvents />
                        </Suspense>
                      </ErrorBoundary>
                    } />
                    <Route path="events/new" element={<CreateEvent />} />
                    <Route path="events/:id/edit" element={<EditEvent />} />
                    <Route path="instructors" element={<AdminInstructors />} />
                    <Route path="instructors/new" element={<CreateInstructor />} />
                    <Route path="instructors/:id/edit" element={<EditInstructor />} />
                    <Route path="locations" element={<AdminLocations />} />
    <Route path="event-blueprints" element={<AdminEventBlueprints />} />
    <Route path="assets" element={<AdminAssets />} />
                    <Route path="event-types" element={<AdminEventTypes />} />
                    <Route path="event-categories" element={<AdminEventCategories />} />
                    <Route path="levels" element={<AdminLevels />} />
                    <Route path="formats" element={<AdminFormats />} />
                    <Route path="pages" element={<AdminPages />} />
                    <Route path="pages/:id/edit" element={<PageEditor />} />
                    
                    <Route path="knowledge/items" element={<AdminKnowledgeItems />} />
                    <Route path="knowledge/items/:knowledgeItemId/use-cases/new" element={<CreateKnowledgeUseCase />} />
                    <Route path="knowledge/items/:knowledgeItemId/use-cases/:useCaseId/edit" element={<CreateKnowledgeUseCase />} />
                    <Route path="knowledge/templates" element={<AdminAssets />} />
                    <Route path="knowledge/templates/new" element={<CreateKnowledgeTemplate />} />
                    <Route path="knowledge/templates/:id/edit" element={<CreateKnowledgeTemplate />} />
                    <Route path="knowledge/analytics" element={<AdminKnowledgeAnalyticsRoute />} />
                    <Route path="knowledge/classifications" element={<AdminClassifications />} />
                    <Route path="knowledge/tags" element={<AdminKnowledgeTags />} />
                    <Route path="knowledge/learning-paths" element={<AdminKnowledgeLearningPaths />} />
                    <Route path="knowledge/import" element={<AdminKnowledgeImport />} />
                    <Route path="knowledge/imports" element={<AdminKnowledgeImport />} />
                    <Route path="imports" element={<AdminImports />} />
                    <Route path="media" element={<AdminMedia />} />
                    <Route path="logs" element={<AdminLogs />} />
                    <Route path="logs/application" element={<AdminLogsApplicationRoute />} />
                    <Route path="logs/database" element={<AdminLogsDatabaseRoute />} />
                    <Route path="logs/auth" element={<AdminLogsAuthRoute />} />
                    <Route path="logs/audit" element={<AdminAuditLogs />} />
                    <Route path="moderation" element={<AdminModeration />} />
                  </Route>
                  
                  {/* Knowledge Item Editor - Protected Full Page Routes Outside Admin Layout */}
                  <Route path="/admin/knowledge/items/new" element={
                    <ProtectedRoute requiredRole="admin" requireAAL2={true}>
                      <CreateKnowledgeItem />
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/knowledge/items/:id/edit" element={
                    <ProtectedRoute requiredRole="admin" requireAAL2={true}>
                      <EditKnowledgeItem />
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/knowledge/preview/:id" element={
                    <ProtectedRoute requiredRole="admin" requireAAL2={true}>
                      <PreviewPage />
                    </ProtectedRoute>
                  } />
                </>
              )}
              
              {/* Static Home Page - Restored Safely */}
              <Route path="/" element={<Home />} />
              
              {/* Dynamic CMS Pages - Handles other slugs (gated) */}
              {ENABLE_DYNAMIC_PAGES && (
                <>
                  <Route path="/:slug" element={
                    <ErrorBoundary fallback={
                      <div className="flex items-center justify-center h-64">
                        <div className="text-lg text-red-600">Failed to load page</div>
                      </div>
                    }>
                      <DynamicPageRenderer slug={window.location.pathname.slice(1)} />
                    </ErrorBoundary>
                  } />
                  
                  {/* Optional: Test route for dynamic home */}
                  <Route path="/home-dynamic" element={
                    <ErrorBoundary fallback={
                      <div className="flex items-center justify-center h-64">
                        <div className="text-lg text-red-600">Failed to load dynamic home page</div>
                      </div>
                    }>
                      <Suspense fallback={<div className="flex items-center justify-center h-64">Loading...</div>}>
                        <DynamicPageRenderer slug="home" />
                      </Suspense>
                    </ErrorBoundary>
                  } />
                </>
              )}
              
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
