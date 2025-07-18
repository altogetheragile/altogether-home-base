
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import AdminLayout from "@/components/admin/AdminLayout";
import ErrorBoundary from "@/components/ErrorBoundary";

import Events from "./pages/Events";
import EventDetail from "./pages/EventDetail";
import Blog from "./pages/Blog";
import KnowledgeBase from "./pages/KnowledgeBase";
import KnowledgeTechniqueDetail from "./pages/KnowledgeTechniqueDetail";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
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
import AdminKnowledgeBase from "./pages/admin/AdminKnowledgeBase";
import CreateEvent from "./pages/admin/CreateEvent";
import EditEvent from "./pages/admin/EditEvent";
import CreateInstructor from "./pages/admin/CreateInstructor";
import EditInstructor from "./pages/admin/EditInstructor";
import { PageEditor } from "./components/pageEditor/PageEditor";
import { DynamicPageRenderer } from "./components/DynamicPageRenderer";
import NotFound from "./pages/NotFound";
import UserDashboard from "./pages/UserDashboard";
import LearningPaths from "./pages/LearningPaths";

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
              <Route path="/knowledge" element={<KnowledgeBase />} />
              <Route path="/knowledge/:slug" element={<KnowledgeTechniqueDetail />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/user-dashboard" element={<UserDashboard />} />
              <Route path="/learning-paths" element={<LearningPaths />} />
              
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
                <Route path="knowledge" element={<AdminKnowledgeBase />} />
                <Route path="logs" element={<AdminLogs />} />
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
