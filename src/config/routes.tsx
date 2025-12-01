import React, { lazy, Suspense } from 'react';
import { Route } from 'react-router-dom';
import ProtectedRoute from '@/components/ProtectedRoute';
import ErrorBoundary from '@/components/ErrorBoundary';
import { featureFlags } from './featureFlags';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { SiteSettingsRouteGuard } from '@/components/SiteSettingsRouteGuard';

// ============= Loading Fallback Components =============
const LoadingFallback = () => (
  <div className="flex items-center justify-center h-64">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

const AdminLoadingFallback = () => (
  <div className="flex items-center justify-center h-64">
    <div className="text-muted-foreground">Loading admin...</div>
  </div>
);

// ============= Lazy Loaded Components =============

// Admin Layout
const AdminLayout = lazy(() => import('@/components/admin/AdminLayout'));

// Public Pages
const EventDetail = lazy(() => import('@/pages/EventDetail'));
const KnowledgeDetail = lazy(() => import('@/pages/KnowledgeDetail'));
const Testimonials = lazy(() => import('@/pages/Testimonials'));
const Auth = lazy(() => import('@/pages/Auth'));
const ResetPassword = lazy(() => import('@/pages/ResetPassword'));
const AIToolsCanvas = lazy(() => import('@/pages/AIToolsCanvas'));
const AIToolsHub = lazy(() => import('@/pages/AIToolsHub'));
const BMCGenerator = lazy(() => import('@/pages/BMCGenerator'));
const ProjectModellingCanvas = lazy(() => import('@/pages/ProjectModellingCanvas'));
const Contact = lazy(() => import('@/pages/Contact'));
const AccountSecurity = lazy(() => import('@/pages/AccountSecurity'));
const Dashboard = lazy(() => import('@/pages/Dashboard'));

// Protected Project Pages
const ProjectDetail = lazy(() => import('@/pages/ProjectDetail'));
const ProjectCanvas = lazy(() => import('@/pages/ProjectCanvas'));
const ProjectBMC = lazy(() => import('@/pages/ProjectBMC'));
const ArtifactViewer = lazy(() => import('@/pages/ArtifactViewer'));

// Admin Pages - Dashboard
const AdminDashboard = lazy(() => import('@/pages/admin/AdminDashboard'));

// Admin Pages - Events Management
const AdminEvents = lazy(() => import('@/pages/admin/AdminEvents'));
const CreateEvent = lazy(() => import('@/pages/admin/CreateEvent'));
const EditEvent = lazy(() => import('@/pages/admin/EditEvent'));
const AdminEventBlueprints = lazy(() => import('@/pages/admin/AdminEventBlueprints'));
const AdminEventTypes = lazy(() => import('@/pages/admin/AdminEventTypes'));
const AdminEventCategories = lazy(() => import('@/pages/admin/AdminEventCategories'));

// Admin Pages - Instructors & Locations
const AdminInstructors = lazy(() => import('@/pages/admin/AdminInstructors'));
const CreateInstructor = lazy(() => import('@/pages/admin/CreateInstructor'));
const EditInstructor = lazy(() => import('@/pages/admin/EditInstructor'));
const AdminLocations = lazy(() => import('@/pages/admin/AdminLocations'));

// Admin Pages - Knowledge Management
const AdminKnowledgeItems = lazy(() => import('@/pages/admin/AdminKnowledgeItems'));
const CreateKnowledgeItem = lazy(() => import('@/pages/admin/CreateKnowledgeItem'));
const EditKnowledgeItem = lazy(() => import('@/pages/admin/EditKnowledgeItem'));
const CreateKnowledgeUseCase = lazy(() => import('@/pages/admin/CreateKnowledgeUseCase'));
const CreateKnowledgeTemplate = lazy(() => import('@/pages/admin/CreateKnowledgeTemplate'));
const AdminKnowledgeTags = lazy(() => import('@/pages/admin/AdminKnowledgeTags'));
const AdminKnowledgeLearningPaths = lazy(() => import('@/pages/admin/AdminKnowledgeLearningPaths'));
const AdminKnowledgeAnalyticsRoute = lazy(() => import('@/pages/admin/AdminKnowledgeAnalyticsRoute'));
const AdminKnowledgeTemplates = lazy(() => import('@/pages/admin/AdminKnowledgeTemplates'));
const AdminClassifications = lazy(() => import('@/pages/admin/AdminClassifications'));
const AdminKnowledgeImport = lazy(() => import('@/pages/admin/AdminKnowledgeImport'));
const PreviewPage = lazy(() => import('@/components/admin/knowledge/PreviewPage').then(m => ({ default: m.PreviewPage })));

// Admin Pages - Content & Media
const AdminPages = lazy(() => import('@/pages/admin/AdminPages'));
const PageEditor = lazy(() => import('@/components/pageEditor/PageEditor').then(m => ({ default: m.PageEditor })));
const AdminMedia = lazy(() => import('@/pages/admin/AdminMedia'));
const AdminAssets = lazy(() => import('@/pages/admin/AdminAssets'));

// Admin Pages - Configuration
const AdminLevels = lazy(() => import('@/pages/admin/AdminLevels'));
const AdminFormats = lazy(() => import('@/pages/admin/AdminFormats'));
const AdminActivityDomains = lazy(() => import('@/pages/admin/AdminActivityDomains'));
const AdminFooter = lazy(() => import('@/pages/admin/AdminFooter'));
const AdminSettings = lazy(() => import('@/pages/admin/AdminSettings'));

// Admin Pages - Users & Logs
const AdminUsers = lazy(() => import('@/pages/admin/AdminUsers'));
const AdminLogs = lazy(() => import('@/pages/admin/AdminLogs'));
const AdminLogsApplicationRoute = lazy(() => import('@/pages/admin/AdminLogsApplicationRoute'));
const AdminLogsDatabaseRoute = lazy(() => import('@/pages/admin/AdminLogsDatabaseRoute'));
const AdminLogsAuthRoute = lazy(() => import('@/pages/admin/AdminLogsAuthRoute'));
const AdminAuditLogs = lazy(() => import('@/pages/admin/AdminAuditLogs'));

// Admin Pages - Content Moderation & Data
const AdminModeration = lazy(() => import('@/pages/admin/AdminModeration'));
const AdminContacts = lazy(() => import('@/pages/admin/AdminContacts'));
const AdminFeedback = lazy(() => import('@/pages/admin/AdminFeedback'));
const AdminImports = lazy(() => import('@/pages/admin/AdminImports'));

// Dynamic Pages
const DynamicPageRenderer = lazy(() => import('@/components/DynamicPageRenderer').then(m => ({ default: m.DynamicPageRenderer })));
const Home = lazy(() => import('@/pages/Home'));
const NotFound = lazy(() => import('@/pages/NotFound'));

// ============= Public Routes =============
export const PublicRoutes = () => {
  return (
    <>
      <Route path="/events/:id" element={
        <SiteSettingsRouteGuard feature="events">
          <Suspense fallback={<LoadingFallback />}>
            <EventDetail />
          </Suspense>
        </SiteSettingsRouteGuard>
      } />
      <Route path="/knowledge/:slug" element={
        <SiteSettingsRouteGuard feature="knowledge">
          <Suspense fallback={<LoadingFallback />}>
            <KnowledgeDetail />
          </Suspense>
        </SiteSettingsRouteGuard>
      } />
    <Route path="/testimonials" element={
      <Suspense fallback={<LoadingFallback />}>
        <Testimonials />
      </Suspense>
    } />
    <Route path="/auth" element={
      <Suspense fallback={<LoadingFallback />}>
        <Auth />
      </Suspense>
    } />
    <Route path="/auth/reset" element={
      <Suspense fallback={<LoadingFallback />}>
        <ResetPassword />
      </Suspense>
    } />
    <Route path="/ai-tools" element={
      <Suspense fallback={<LoadingFallback />}>
        <AIToolsHub />
      </Suspense>
    } />
    <Route path="/user-story-canvas" element={
      <Suspense fallback={<LoadingFallback />}>
        <AIToolsCanvas />
      </Suspense>
    } />
    <Route path="/bmc-generator" element={
      <Suspense fallback={<LoadingFallback />}>
        <BMCGenerator />
      </Suspense>
    } />
    <Route path="/project-modelling" element={
      <Suspense fallback={<LoadingFallback />}>
        <ProjectModellingCanvas />
      </Suspense>
    } />
    <Route path="/contact" element={
      <Suspense fallback={<LoadingFallback />}>
        <Contact />
      </Suspense>
    } />
    <Route path="/account/security" element={
      <Suspense fallback={<LoadingFallback />}>
        <AccountSecurity />
      </Suspense>
    } />
    </>
  );
};

// ============= Protected User Routes =============
export const ProtectedUserRoutes = () => (
  <>
    {/* User Dashboard - Requires AAL2 */}
    <Route path="/dashboard" element={
      <ProtectedRoute requireAAL2={true}>
        <Suspense fallback={<LoadingFallback />}>
          <Dashboard />
        </Suspense>
      </ProtectedRoute>
    } />
    
    {/* Project Routes */}
    {featureFlags.protectedProjects && (
      <>
        <Route path="/projects/:projectId" element={
          <ProtectedRoute>
            <Suspense fallback={<LoadingFallback />}>
              <ProjectDetail />
            </Suspense>
          </ProtectedRoute>
        } />
        <Route path="/projects/:projectId/canvas" element={
          <ProtectedRoute>
            <Suspense fallback={<LoadingFallback />}>
              <ProjectCanvas />
            </Suspense>
          </ProtectedRoute>
        } />
        <Route path="/projects/:projectId/bmc" element={
          <ProtectedRoute>
            <Suspense fallback={<LoadingFallback />}>
              <ProjectBMC />
            </Suspense>
          </ProtectedRoute>
        } />
        <Route path="/projects/:projectId/artifacts/:artifactId" element={
          <ProtectedRoute>
            <Suspense fallback={<LoadingFallback />}>
              <ArtifactViewer />
            </Suspense>
          </ProtectedRoute>
        } />
      </>
    )}
  </>
);

// ============= Admin Routes =============
export const AdminRoutes = () => {
  if (!featureFlags.adminRoutes) return null;

  return (
    <>
      {/* Admin Layout with Nested Routes */}
      <Route path="/admin" element={
        <ProtectedRoute requiredRole="admin" requireAAL2={true}>
          <Suspense fallback={<AdminLoadingFallback />}>
            <AdminLayout />
          </Suspense>
        </ProtectedRoute>
      }>
        {/* Dashboard */}
        <Route index element={
          <Suspense fallback={<LoadingFallback />}>
            <AdminDashboard />
          </Suspense>
        } />
        
        {/* Users Management */}
        <Route path="users" element={
          <Suspense fallback={<LoadingFallback />}>
            <AdminUsers />
          </Suspense>
        } />
        
        {/* Events Management */}
        <Route path="events" element={
          <ErrorBoundary fallback={
            <div className="flex items-center justify-center h-64">
              <div className="text-lg text-destructive">Failed to load Events module</div>
            </div>
          }>
            <Suspense fallback={<LoadingFallback />}>
              <AdminEvents />
            </Suspense>
          </ErrorBoundary>
        } />
        <Route path="events/new" element={
          <Suspense fallback={<LoadingFallback />}>
            <CreateEvent />
          </Suspense>
        } />
        <Route path="events/:id/edit" element={
          <Suspense fallback={<LoadingFallback />}>
            <EditEvent />
          </Suspense>
        } />
        <Route path="event-blueprints" element={
          <Suspense fallback={<LoadingFallback />}>
            <AdminEventBlueprints />
          </Suspense>
        } />
        <Route path="event-types" element={
          <Suspense fallback={<LoadingFallback />}>
            <AdminEventTypes />
          </Suspense>
        } />
        <Route path="event-categories" element={
          <Suspense fallback={<LoadingFallback />}>
            <AdminEventCategories />
          </Suspense>
        } />
        
        {/* Instructors & Locations */}
        <Route path="instructors" element={
          <Suspense fallback={<LoadingFallback />}>
            <AdminInstructors />
          </Suspense>
        } />
        <Route path="instructors/new" element={
          <Suspense fallback={<LoadingFallback />}>
            <CreateInstructor />
          </Suspense>
        } />
        <Route path="instructors/:id/edit" element={
          <Suspense fallback={<LoadingFallback />}>
            <EditInstructor />
          </Suspense>
        } />
        <Route path="locations" element={
          <Suspense fallback={<LoadingFallback />}>
            <AdminLocations />
          </Suspense>
        } />
        
        {/* Knowledge Management */}
        <Route path="knowledge/items" element={
          <Suspense fallback={<LoadingFallback />}>
            <AdminKnowledgeItems />
          </Suspense>
        } />
        <Route path="knowledge/items/:knowledgeItemId/use-cases/new" element={
          <Suspense fallback={<LoadingFallback />}>
            <CreateKnowledgeUseCase />
          </Suspense>
        } />
        <Route path="knowledge/items/:knowledgeItemId/use-cases/:useCaseId/edit" element={
          <Suspense fallback={<LoadingFallback />}>
            <CreateKnowledgeUseCase />
          </Suspense>
        } />
        <Route path="knowledge/templates" element={
          <Suspense fallback={<LoadingFallback />}>
            <AdminAssets />
          </Suspense>
        } />
        <Route path="knowledge/templates/new" element={
          <Suspense fallback={<LoadingFallback />}>
            <CreateKnowledgeTemplate />
          </Suspense>
        } />
        <Route path="knowledge/templates/:id/edit" element={
          <Suspense fallback={<LoadingFallback />}>
            <CreateKnowledgeTemplate />
          </Suspense>
        } />
        <Route path="knowledge/analytics" element={
          <Suspense fallback={<LoadingFallback />}>
            <AdminKnowledgeAnalyticsRoute />
          </Suspense>
        } />
        <Route path="knowledge/classifications" element={
          <Suspense fallback={<LoadingFallback />}>
            <AdminClassifications />
          </Suspense>
        } />
        <Route path="knowledge/tags" element={
          <Suspense fallback={<LoadingFallback />}>
            <AdminKnowledgeTags />
          </Suspense>
        } />
        <Route path="knowledge/learning-paths" element={
          <Suspense fallback={<LoadingFallback />}>
            <AdminKnowledgeLearningPaths />
          </Suspense>
        } />
        <Route path="knowledge/import" element={
          <Suspense fallback={<LoadingFallback />}>
            <AdminKnowledgeImport />
          </Suspense>
        } />
        <Route path="knowledge/imports" element={
          <Suspense fallback={<LoadingFallback />}>
            <AdminKnowledgeImport />
          </Suspense>
        } />
        
        {/* Content & Media */}
        <Route path="pages" element={
          <Suspense fallback={<LoadingFallback />}>
            <AdminPages />
          </Suspense>
        } />
        <Route path="pages/:id/edit" element={
          <Suspense fallback={<LoadingFallback />}>
            <PageEditor />
          </Suspense>
        } />
        <Route path="media" element={
          <Suspense fallback={<LoadingFallback />}>
            <AdminMedia />
          </Suspense>
        } />
        <Route path="assets" element={
          <Suspense fallback={<LoadingFallback />}>
            <AdminAssets />
          </Suspense>
        } />
        
        {/* Configuration */}
        <Route path="levels" element={
          <Suspense fallback={<LoadingFallback />}>
            <AdminLevels />
          </Suspense>
        } />
        <Route path="formats" element={
          <Suspense fallback={<LoadingFallback />}>
            <AdminFormats />
          </Suspense>
        } />
        <Route path="activity-domains" element={
          <Suspense fallback={<LoadingFallback />}>
            <AdminActivityDomains />
          </Suspense>
        } />
        <Route path="footer" element={
          <Suspense fallback={<LoadingFallback />}>
            <AdminFooter />
          </Suspense>
        } />
        <Route path="settings" element={
          <Suspense fallback={<LoadingFallback />}>
            <AdminSettings />
          </Suspense>
        } />
        
        {/* Data Management */}
        <Route path="imports" element={
          <Suspense fallback={<LoadingFallback />}>
            <AdminImports />
          </Suspense>
        } />
        
        {/* Logs & Audit */}
        <Route path="logs" element={
          <Suspense fallback={<LoadingFallback />}>
            <AdminLogs />
          </Suspense>
        } />
        <Route path="logs/application" element={
          <Suspense fallback={<LoadingFallback />}>
            <AdminLogsApplicationRoute />
          </Suspense>
        } />
        <Route path="logs/database" element={
          <Suspense fallback={<LoadingFallback />}>
            <AdminLogsDatabaseRoute />
          </Suspense>
        } />
        <Route path="logs/auth" element={
          <Suspense fallback={<LoadingFallback />}>
            <AdminLogsAuthRoute />
          </Suspense>
        } />
        <Route path="logs/audit" element={
          <Suspense fallback={<LoadingFallback />}>
            <AdminAuditLogs />
          </Suspense>
        } />
        
        {/* Content Moderation */}
        <Route path="moderation" element={
          <Suspense fallback={<LoadingFallback />}>
            <AdminModeration />
          </Suspense>
        } />
        <Route path="contacts" element={
          <Suspense fallback={<LoadingFallback />}>
            <AdminContacts />
          </Suspense>
        } />
        <Route path="feedback" element={
          <Suspense fallback={<LoadingFallback />}>
            <AdminFeedback />
          </Suspense>
        } />
      </Route>
      
      {/* Full Page Admin Routes (Outside Layout) */}
      <Route path="/admin/knowledge/items/new" element={
        <ProtectedRoute requiredRole="admin" requireAAL2={true}>
          <Suspense fallback={<LoadingFallback />}>
            <CreateKnowledgeItem />
          </Suspense>
        </ProtectedRoute>
      } />
      <Route path="/admin/knowledge/items/:id/edit" element={
        <ProtectedRoute requiredRole="admin" requireAAL2={true}>
          <Suspense fallback={<LoadingFallback />}>
            <EditKnowledgeItem />
          </Suspense>
        </ProtectedRoute>
      } />
      <Route path="/admin/knowledge/preview/:id" element={
        <ProtectedRoute requiredRole="admin" requireAAL2={true}>
          <Suspense fallback={<LoadingFallback />}>
            <PreviewPage />
          </Suspense>
        </ProtectedRoute>
      } />
    </>
  );
};

// ============= Dynamic CMS Routes =============
export const DynamicRoutes = () => {
  if (!featureFlags.dynamicPages) return null;

  // Special page components - must be defined BEFORE catch-all
  const Knowledge = lazy(() => import('@/pages/Knowledge'));
  const Events = lazy(() => import('@/pages/Events'));
  const Blog = lazy(() => import('@/pages/Blog'));

  return (
    <>
      {/* Home Page */}
      <Route path="/" element={
        <ErrorBoundary fallback={
          <Suspense fallback={<LoadingFallback />}>
            <Home />
          </Suspense>
        }>
          <Suspense fallback={<LoadingFallback />}>
            <DynamicPageRenderer />
          </Suspense>
        </ErrorBoundary>
      } />
      
      {/* Special Pages - Always defined, guarded by SiteSettingsRouteGuard */}
      <Route path="/knowledge" element={
        <SiteSettingsRouteGuard feature="knowledge">
          <ErrorBoundary>
            <Suspense fallback={<LoadingFallback />}>
              <Knowledge />
            </Suspense>
          </ErrorBoundary>
        </SiteSettingsRouteGuard>
      } />
      
      <Route path="/events" element={
        <SiteSettingsRouteGuard feature="events">
          <ErrorBoundary>
            <Suspense fallback={<LoadingFallback />}>
              <Events />
            </Suspense>
          </ErrorBoundary>
        </SiteSettingsRouteGuard>
      } />
      
      <Route path="/blog" element={
        <SiteSettingsRouteGuard feature="blog">
          <ErrorBoundary>
            <Suspense fallback={<LoadingFallback />}>
              <Blog />
            </Suspense>
          </ErrorBoundary>
        </SiteSettingsRouteGuard>
      } />
      
      {/* Dynamic Catch-All for CMS Pages - MUST be last */}
      <Route path="/:slug" element={
        <ErrorBoundary fallback={
          <div className="flex items-center justify-center h-64">
            <div className="text-lg text-destructive">Failed to load page</div>
          </div>
        }>
          <Suspense fallback={<LoadingFallback />}>
            <DynamicPageRenderer />
          </Suspense>
        </ErrorBoundary>
      } />
    </>
  );
};

// ============= Fallback Routes =============
export const FallbackRoutes = () => (
  <Route path="*" element={
    <Suspense fallback={<LoadingFallback />}>
      <NotFound />
    </Suspense>
  } />
);
