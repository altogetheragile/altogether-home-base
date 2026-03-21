import { lazy, Suspense } from 'react';
import { Route } from 'react-router-dom';
import ProtectedRoute from '@/components/ProtectedRoute';
import ErrorBoundary from '@/components/ErrorBoundary';
import { featureFlags } from './featureFlags';
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
const Technique = lazy(() => import('@/pages/Technique'));
const Testimonials = lazy(() => import('@/pages/Testimonials'));
const Auth = lazy(() => import('@/pages/Auth'));
const ResetPassword = lazy(() => import('@/pages/ResetPassword'));
const AIToolsCanvas = lazy(() => import('@/pages/AIToolsCanvas'));
const AIToolsHub = lazy(() => import('@/pages/AIToolsHub'));
const BMCGenerator = lazy(() => import('@/pages/BMCGenerator'));
const ProjectModellingCanvas = lazy(() => import('@/pages/ProjectModellingCanvas'));
const Contact = lazy(() => import('@/pages/Contact'));
const BlogPost = lazy(() => import('@/pages/BlogPost'));
const Terms = lazy(() => import('@/pages/Terms'));
const CookiePolicy = lazy(() => import('@/pages/CookiePolicy'));
const Privacy = lazy(() => import('@/pages/Privacy'));
const AccountSecurity = lazy(() => import('@/pages/AccountSecurity'));
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const ProductBacklog = lazy(() => import('@/pages/ProductBacklog'));
const FlowGame = lazy(() => import('@/pages/FlowGame'));
const ExamsListing = lazy(() => import('@/pages/Exams'));
const ExamPlayer = lazy(() => import('@/pages/ExamPlayer'));

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
const AdminCourses = lazy(() => import('@/pages/admin/AdminCourses'));
const AdminEventBlueprints = lazy(() => import('@/pages/admin/AdminEventBlueprints'));
const AdminEventTypes = lazy(() => import('@/pages/admin/AdminEventTypes'));
const AdminEventCategories = lazy(() => import('@/pages/admin/AdminEventCategories'));

// Admin Pages - Instructors & Locations
const AdminInstructors = lazy(() => import('@/pages/admin/AdminInstructors'));
const CreateInstructor = lazy(() => import('@/pages/admin/CreateInstructor'));
const EditInstructor = lazy(() => import('@/pages/admin/EditInstructor'));
const AdminLocations = lazy(() => import('@/pages/admin/AdminLocations'));

// Admin Pages - Knowledge Management

const CreateKnowledgeItem = lazy(() => import('@/pages/admin/CreateKnowledgeItem'));
const EditKnowledgeItem = lazy(() => import('@/pages/admin/EditKnowledgeItem'));
const CreateKnowledgeUseCase = lazy(() => import('@/pages/admin/CreateKnowledgeUseCase'));
const CreateKnowledgeTemplate = lazy(() => import('@/pages/admin/CreateKnowledgeTemplate'));
const AdminTaxonomy = lazy(() => import('@/pages/admin/AdminTaxonomy'));
const AdminKnowledgeAnalyticsRoute = lazy(() => import('@/pages/admin/AdminKnowledgeAnalyticsRoute'));
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

// Admin Pages - Blog Management
const AdminBlog = lazy(() => import('@/pages/admin/AdminBlog'));
const AdminBlogPost = lazy(() => import('@/pages/admin/AdminBlogPost'));

// Admin Pages - Exam Question Bank
const AdminExams = lazy(() => import('@/pages/admin/AdminExams'));
const AdminExamQuestions = lazy(() => import('@/pages/admin/AdminExamQuestions'));

// Admin Pages - Content Moderation & Data
const AdminModeration = lazy(() => import('@/pages/admin/AdminModeration'));
const AdminContacts = lazy(() => import('@/pages/admin/AdminContacts'));
const AdminFeedback = lazy(() => import('@/pages/admin/AdminFeedback'));
const PopulateBacklog = lazy(() => import('@/pages/admin/PopulateBacklog'));
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
          <ErrorBoundary>
            <Suspense fallback={<LoadingFallback />}>
              <EventDetail />
            </Suspense>
          </ErrorBoundary>
        </SiteSettingsRouteGuard>
      } />
      <Route path="/courses/:id" element={
        <SiteSettingsRouteGuard feature="events">
          <ErrorBoundary>
            <Suspense fallback={<LoadingFallback />}>
              <EventDetail />
            </Suspense>
          </ErrorBoundary>
        </SiteSettingsRouteGuard>
      } />
      <Route path="/knowledge/new" element={
        <SiteSettingsRouteGuard feature="knowledge">
          <ProtectedRoute requiredRole="admin">
            <Suspense fallback={<LoadingFallback />}>
              <KnowledgeDetail />
            </Suspense>
          </ProtectedRoute>
        </SiteSettingsRouteGuard>
      } />
      <Route path="/knowledge/:slug" element={
        <SiteSettingsRouteGuard feature="knowledge">
          <ErrorBoundary>
            <Suspense fallback={<LoadingFallback />}>
              <Technique />
            </Suspense>
          </ErrorBoundary>
        </SiteSettingsRouteGuard>
      } />
    <Route path="/testimonials" element={
      <ErrorBoundary>
        <Suspense fallback={<LoadingFallback />}>
          <Testimonials />
        </Suspense>
      </ErrorBoundary>
    } />
    <Route path="/auth" element={
      <ErrorBoundary>
        <Suspense fallback={<LoadingFallback />}>
          <Auth />
        </Suspense>
      </ErrorBoundary>
    } />
    <Route path="/auth/reset" element={
      <ErrorBoundary>
        <Suspense fallback={<LoadingFallback />}>
          <ResetPassword />
        </Suspense>
      </ErrorBoundary>
    } />
    <Route path="/ai-tools" element={
      <ErrorBoundary>
        <Suspense fallback={<LoadingFallback />}>
          <AIToolsHub />
        </Suspense>
      </ErrorBoundary>
    } />
    <Route path="/user-story-canvas" element={
      <ErrorBoundary>
        <Suspense fallback={<LoadingFallback />}>
          <AIToolsCanvas />
        </Suspense>
      </ErrorBoundary>
    } />
    <Route path="/bmc-generator" element={
      <ErrorBoundary>
        <Suspense fallback={<LoadingFallback />}>
          <BMCGenerator />
        </Suspense>
      </ErrorBoundary>
    } />
    <Route path="/project-modelling" element={
      <ErrorBoundary>
        <Suspense fallback={<LoadingFallback />}>
          <ProjectModellingCanvas />
        </Suspense>
      </ErrorBoundary>
    } />
    <Route path="/contact" element={
      <ErrorBoundary>
        <Suspense fallback={<LoadingFallback />}>
          <Contact />
        </Suspense>
      </ErrorBoundary>
    } />
    <Route path="/terms" element={
      <Suspense fallback={<LoadingFallback />}>
        <Terms />
      </Suspense>
    } />
    <Route path="/cookies" element={
      <Suspense fallback={<LoadingFallback />}>
        <CookiePolicy />
      </Suspense>
    } />
    <Route path="/privacy" element={
      <Suspense fallback={<LoadingFallback />}>
        <Privacy />
      </Suspense>
    } />
    <Route path="/account/security" element={
      <ProtectedRoute>
        <ErrorBoundary>
          <Suspense fallback={<LoadingFallback />}>
            <AccountSecurity />
          </Suspense>
        </ErrorBoundary>
      </ProtectedRoute>
    } />
    <Route path="/flow-game" element={
      <ErrorBoundary>
        <Suspense fallback={<LoadingFallback />}>
          <FlowGame />
        </Suspense>
      </ErrorBoundary>
    } />
    <Route path="/exams" element={
      <SiteSettingsRouteGuard feature="exams">
        <ErrorBoundary>
          <Suspense fallback={<LoadingFallback />}>
            <ExamsListing />
          </Suspense>
        </ErrorBoundary>
      </SiteSettingsRouteGuard>
    } />
    <Route path="/exams/:examId" element={
      <SiteSettingsRouteGuard feature="exams">
        <ErrorBoundary>
          <Suspense fallback={<LoadingFallback />}>
            <ExamPlayer />
          </Suspense>
        </ErrorBoundary>
      </SiteSettingsRouteGuard>
    } />
    <Route path="/backlog" element={
      <Suspense fallback={<LoadingFallback />}>
        <ProductBacklog />
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
        <Route path="courses" element={
          <Suspense fallback={<LoadingFallback />}>
            <AdminCourses />
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
        
        {/* Blog Management */}
        <Route path="blog" element={
          <Suspense fallback={<LoadingFallback />}>
            <AdminBlog />
          </Suspense>
        } />
        <Route path="blog/new" element={
          <Suspense fallback={<LoadingFallback />}>
            <AdminBlogPost />
          </Suspense>
        } />
        <Route path="blog/:id" element={
          <Suspense fallback={<LoadingFallback />}>
            <AdminBlogPost />
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
        <Route path="knowledge/items/:id/edit" element={
          <Suspense fallback={<LoadingFallback />}>
            <EditKnowledgeItem />
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
        <Route path="knowledge/taxonomy" element={
          <Suspense fallback={<LoadingFallback />}>
            <AdminTaxonomy />
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
        
        {/* Exam Question Bank */}
        <Route path="exams" element={
          <Suspense fallback={<LoadingFallback />}>
            <AdminExams />
          </Suspense>
        } />
        <Route path="exams/:examId/questions" element={
          <Suspense fallback={<LoadingFallback />}>
            <AdminExamQuestions />
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
        <Route path="populate-backlog" element={
          <Suspense fallback={<LoadingFallback />}>
            <PopulateBacklog />
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
  const Coaching = lazy(() => import('@/pages/Coaching'));
  const AboutPage = lazy(() => import('@/pages/About'));
  const Blog = lazy(() => import('@/pages/Blog'));

  return (
    <>
      {/* Home Page — renders the new designed homepage directly */}
      <Route path="/" element={
        <Suspense fallback={<LoadingFallback />}>
          <Home />
        </Suspense>
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
      
      <Route path="/coaching" element={
        <ErrorBoundary>
          <Suspense fallback={<LoadingFallback />}>
            <Coaching />
          </Suspense>
        </ErrorBoundary>
      } />

      <Route path="/about" element={
        <ErrorBoundary>
          <Suspense fallback={<LoadingFallback />}>
            <AboutPage />
          </Suspense>
        </ErrorBoundary>
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

      <Route path="/blog/:slug" element={
        <SiteSettingsRouteGuard feature="blog">
          <ErrorBoundary>
            <Suspense fallback={<LoadingFallback />}>
              <BlogPost />
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
