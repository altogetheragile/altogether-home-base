import { lazy, Suspense } from 'react';
import { Route, Navigate } from 'react-router-dom';
import LegacyKnowledgeRedirect from '@/components/knowledge-base/LegacyKnowledgeRedirect';
import ProtectedRoute from '@/components/ProtectedRoute';
import ErrorBoundary from '@/components/ErrorBoundary';
import { featureFlags } from './featureFlags';
import { SiteSettingsRouteGuard } from '@/components/SiteSettingsRouteGuard';
import { TAXONOMY_CONFIGS } from '@/config/taxonomyRegistry';

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
const KnowledgeBase = lazy(() => import('@/pages/KnowledgeBase'));
const KnowledgeBaseArtifact = lazy(() => import('@/pages/KnowledgeBaseArtifact'));
const KnowledgeBaseTechniques = lazy(() => import('@/pages/KnowledgeBaseTechniques'));
const KnowledgeBaseTechnique = lazy(() => import('@/pages/KnowledgeBaseTechnique'));
const KnowledgeBaseLattice = lazy(() => import('@/pages/KnowledgeBaseLattice'));
const PatternBuilder = lazy(() => import('@/pages/PatternBuilder'));
const Testimonials = lazy(() => import('@/pages/Testimonials'));
const Auth = lazy(() => import('@/pages/Auth'));
const ResetPassword = lazy(() => import('@/pages/ResetPassword'));
const AIToolsCanvas = lazy(() => import('@/pages/AIToolsCanvas'));
const AIToolsHub = lazy(() => import('@/pages/AIToolsHub'));
const BMCGenerator = lazy(() => import('@/pages/BMCGenerator'));
const ProjectModellingCanvas = lazy(() => import('@/pages/ProjectModellingCanvas'));
const ImpactMap = lazy(() => import('@/pages/ImpactMap'));
const PersonaStudio = lazy(() => import('@/pages/PersonaStudio'));
const WaysOfWorking = lazy(() => import('@/pages/WaysOfWorking'));
const ProbeTracker = lazy(() => import('@/pages/ProbeTracker'));
const BenefitsScorecard = lazy(() => import('@/pages/BenefitsScorecard'));
const CoachingStudio = lazy(() => import('@/pages/CoachingStudio'));
const JourneyMap = lazy(() => import('@/pages/JourneyMap'));
const StoryMap = lazy(() => import('@/pages/StoryMap'));
const CanvasCatalogue = lazy(() => import('@/pages/CanvasCatalogue'));
const CoachedCanvasPage = lazy(() => import('@/pages/CoachedCanvasPage'));
const Contact = lazy(() => import('@/pages/Contact'));
const CoursePage = lazy(() => import('@/pages/CoursePage'));
const BlogPost = lazy(() => import('@/pages/BlogPost'));
const Terms = lazy(() => import('@/pages/Terms'));
const CookiePolicy = lazy(() => import('@/pages/CookiePolicy'));
const Privacy = lazy(() => import('@/pages/Privacy'));
const AccountSecurity = lazy(() => import('@/pages/AccountSecurity'));
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const ProductBacklog = lazy(() => import('@/pages/ProductBacklog'));
const FlowGame = lazy(() => import('@/pages/FlowGame'));
const ScrumGame = lazy(() => import('@/pages/ScrumGame'));
const ZooGame = lazy(() => import('@/pages/ZooGame'));
const ZooTogether = lazy(() => import('@/pages/ZooTogether'));
const PathwaysPicker = lazy(() => import('@/components/pipeline/PathwaysPicker'));
const FlowSimulatorPreview = lazy(() => import('@/components/pipeline/FlowSimulatorPreview'));
const ExamsListing = lazy(() => import('@/pages/Exams'));
const ExamPlayer = lazy(() => import('@/pages/ExamPlayer'));
const BookingPage = lazy(() => import('@/pages/BookingPage'));

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
// The six simple taxonomy editors are unified in one generic component (taxonomyRegistry).
const TaxonomyManager = lazy(() => import('@/components/admin/TaxonomyManager').then(m => ({ default: m.TaxonomyManager })));

// Admin Pages - Instructors & Locations
const AdminInstructors = lazy(() => import('@/pages/admin/AdminInstructors'));
const CreateInstructor = lazy(() => import('@/pages/admin/CreateInstructor'));
const EditInstructor = lazy(() => import('@/pages/admin/EditInstructor'));

// Admin Pages - Knowledge Management

const CreateKnowledgeItem = lazy(() => import('@/pages/admin/CreateKnowledgeItem'));
const EditKnowledgeItem = lazy(() => import('@/pages/admin/EditKnowledgeItem'));
const CreateKnowledgeUseCase = lazy(() => import('@/pages/admin/CreateKnowledgeUseCase'));
const CreateKnowledgeTemplate = lazy(() => import('@/pages/admin/CreateKnowledgeTemplate'));
const AdminTaxonomy = lazy(() => import('@/pages/admin/AdminTaxonomy'));
const AdminKnowledgeAnalyticsRoute = lazy(() => import('@/pages/admin/AdminKnowledgeAnalyticsRoute'));
const AdminKnowledgeImport = lazy(() => import('@/pages/admin/AdminKnowledgeImport'));
const AdminPatternBuilderFeedback = lazy(() => import('@/pages/admin/AdminPatternBuilderFeedback'));
const AdminKnowledgeItems = lazy(() => import('@/pages/admin/AdminKnowledgeItems'));
const PreviewPage = lazy(() => import('@/components/admin/knowledge/PreviewPage').then(m => ({ default: m.PreviewPage })));

// Admin Pages - Content & Media
const AdminAssets = lazy(() => import('@/pages/admin/AdminAssets'));

// Admin Pages - Configuration
const AdminSelfPacedCourses = lazy(() => import('@/pages/admin/AdminSelfPacedCourses'));
const AdminActivityDomains = lazy(() => import('@/pages/admin/AdminActivityDomains'));
const AdminFooter = lazy(() => import('@/pages/admin/AdminFooter'));
const AdminCopy = lazy(() => import('@/pages/admin/AdminCopy'));
const AdminSettings = lazy(() => import('@/pages/admin/AdminSettings'));

// Admin Pages - Users & Logs
const AdminUsers = lazy(() => import('@/pages/admin/AdminUsers'));
const AdminAuditLogs = lazy(() => import('@/pages/admin/AdminAuditLogs'));

// Admin Pages - Blog Management
const AdminBlog = lazy(() => import('@/pages/admin/AdminBlog'));
const AdminBlogPost = lazy(() => import('@/pages/admin/AdminBlogPost'));

// Admin Pages - Exam Question Bank
const AdminExams = lazy(() => import('@/pages/admin/AdminExams'));
const AdminBookings = lazy(() => import('@/pages/admin/AdminBookings'));
const AdminSEO = lazy(() => import('@/pages/admin/AdminSEO'));
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
      <Route path="/knowledge/:slug" element={<LegacyKnowledgeRedirect />} />
    <Route path="/testimonials" element={
      <SiteSettingsRouteGuard feature="testimonials">
        <ErrorBoundary>
          <Suspense fallback={<LoadingFallback />}>
            <Testimonials />
          </Suspense>
        </ErrorBoundary>
    
      </SiteSettingsRouteGuard>
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
      <SiteSettingsRouteGuard feature="ai_tools">
        <ErrorBoundary>
          <Suspense fallback={<LoadingFallback />}>
            <AIToolsHub />
          </Suspense>
        </ErrorBoundary>
    
      </SiteSettingsRouteGuard>
    } />
    <Route path="/user-story-canvas" element={
      <SiteSettingsRouteGuard feature="ai_tools">
        <ErrorBoundary>
          <Suspense fallback={<LoadingFallback />}>
            <AIToolsCanvas />
          </Suspense>
        </ErrorBoundary>
    
      </SiteSettingsRouteGuard>
    } />
    <Route path="/bmc-generator" element={
      <SiteSettingsRouteGuard feature="ai_tools">
        <ErrorBoundary>
          <Suspense fallback={<LoadingFallback />}>
            <BMCGenerator />
          </Suspense>
        </ErrorBoundary>
    
      </SiteSettingsRouteGuard>
    } />
    <Route path="/project-modelling" element={
      <SiteSettingsRouteGuard feature="ai_tools">
        <ErrorBoundary>
          <Suspense fallback={<LoadingFallback />}>
            <ProjectModellingCanvas />
          </Suspense>
        </ErrorBoundary>
    
      </SiteSettingsRouteGuard>
    } />
    <Route path="/impact-map" element={
      <SiteSettingsRouteGuard feature="ai_tools">
        <ErrorBoundary>
          <Suspense fallback={<LoadingFallback />}>
            <ImpactMap />
          </Suspense>
        </ErrorBoundary>
    
      </SiteSettingsRouteGuard>
    } />
    <Route path="/personas" element={
      <SiteSettingsRouteGuard feature="ai_tools">
        <ErrorBoundary>
          <Suspense fallback={<LoadingFallback />}>
            <PersonaStudio />
          </Suspense>
        </ErrorBoundary>
    
      </SiteSettingsRouteGuard>
    } />
    <Route path="/ways-of-working" element={
      <SiteSettingsRouteGuard feature="protected_projects">
        <ErrorBoundary>
          <Suspense fallback={<LoadingFallback />}>
            <WaysOfWorking />
          </Suspense>
        </ErrorBoundary>
    
      </SiteSettingsRouteGuard>
    } />
    <Route path="/probes" element={
      <SiteSettingsRouteGuard feature="protected_projects">
        <ErrorBoundary>
          <Suspense fallback={<LoadingFallback />}>
            <ProbeTracker />
          </Suspense>
        </ErrorBoundary>
    
      </SiteSettingsRouteGuard>
    } />
    <Route path="/benefits" element={
      <SiteSettingsRouteGuard feature="protected_projects">
        <ErrorBoundary>
          <Suspense fallback={<LoadingFallback />}>
            <BenefitsScorecard />
          </Suspense>
        </ErrorBoundary>
    
      </SiteSettingsRouteGuard>
    } />
    <Route path="/coach" element={
      <SiteSettingsRouteGuard feature="protected_projects">
        <ErrorBoundary>
          <Suspense fallback={<LoadingFallback />}>
            <CoachingStudio />
          </Suspense>
        </ErrorBoundary>
    
      </SiteSettingsRouteGuard>
    } />
    <Route path="/journey-map" element={
      <SiteSettingsRouteGuard feature="ai_tools">
        <ErrorBoundary>
          <Suspense fallback={<LoadingFallback />}>
            <JourneyMap />
          </Suspense>
        </ErrorBoundary>
    
      </SiteSettingsRouteGuard>
    } />
    <Route path="/story-map" element={
      <SiteSettingsRouteGuard feature="ai_tools">
        <ErrorBoundary>
          <Suspense fallback={<LoadingFallback />}>
            <StoryMap />
          </Suspense>
        </ErrorBoundary>
    
      </SiteSettingsRouteGuard>
    } />
    <Route path="/canvases" element={
      <SiteSettingsRouteGuard feature="ai_tools">
        <ErrorBoundary>
          <Suspense fallback={<LoadingFallback />}>
            <CanvasCatalogue />
          </Suspense>
        </ErrorBoundary>
    
      </SiteSettingsRouteGuard>
    } />
    <Route path="/canvases/:canvasKey" element={
      <SiteSettingsRouteGuard feature="ai_tools">
        <ErrorBoundary>
          <Suspense fallback={<LoadingFallback />}>
            <CoachedCanvasPage />
          </Suspense>
        </ErrorBoundary>
    
      </SiteSettingsRouteGuard>
    } />
    <Route path="/contact" element={
      <SiteSettingsRouteGuard feature="contact">
        <ErrorBoundary>
          <Suspense fallback={<LoadingFallback />}>
            <Contact />
          </Suspense>
        </ErrorBoundary>
    
      </SiteSettingsRouteGuard>
    } />
    <Route path="/events/learn/:slug" element={
      <SiteSettingsRouteGuard feature="events">
        <Suspense fallback={<LoadingFallback />}>
          <CoursePage />
        </Suspense>
    
      </SiteSettingsRouteGuard>
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
      <SiteSettingsRouteGuard feature="flow_game">
        <ErrorBoundary>
          <Suspense fallback={<LoadingFallback />}>
            <FlowGame />
          </Suspense>
        </ErrorBoundary>
    
      </SiteSettingsRouteGuard>
    } />
    <Route path="/scrum-game" element={
      <SiteSettingsRouteGuard feature="scrum_game">
        <ErrorBoundary>
          <Suspense fallback={<LoadingFallback />}>
            <ScrumGame />
          </Suspense>
        </ErrorBoundary>
    
      </SiteSettingsRouteGuard>
    } />
    <Route path="/zoo-game" element={
      <SiteSettingsRouteGuard feature="zoo_game">
        <ErrorBoundary>
          <Suspense fallback={<LoadingFallback />}>
            <ZooGame />
          </Suspense>
        </ErrorBoundary>
    
      </SiteSettingsRouteGuard>
    } />
    <Route path="/zoo-game/together" element={
      <SiteSettingsRouteGuard feature="zoo_game">
        <ErrorBoundary>
          <Suspense fallback={<LoadingFallback />}>
            <ZooTogether />
          </Suspense>
        </ErrorBoundary>
    
      </SiteSettingsRouteGuard>
    } />
    <Route path="/pathways" element={
      <SiteSettingsRouteGuard feature="protected_projects">
        <ErrorBoundary>
          <Suspense fallback={<LoadingFallback />}>
            <PathwaysPicker />
          </Suspense>
        </ErrorBoundary>
    
      </SiteSettingsRouteGuard>
    } />
    <Route path="/simulator-preview" element={
      <SiteSettingsRouteGuard feature="protected_projects">
        <ErrorBoundary>
          <Suspense fallback={<LoadingFallback />}>
            <FlowSimulatorPreview />
          </Suspense>
        </ErrorBoundary>
    
      </SiteSettingsRouteGuard>
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
    <Route path="/exams/:slug" element={
      <SiteSettingsRouteGuard feature="exams">
        <ErrorBoundary>
          <Suspense fallback={<LoadingFallback />}>
            <ExamPlayer />
          </Suspense>
        </ErrorBoundary>
      </SiteSettingsRouteGuard>
    } />
    <Route path="/book/:slug" element={
      <SiteSettingsRouteGuard feature="bookings">
        <ErrorBoundary>
          <Suspense fallback={<LoadingFallback />}>
            <BookingPage />
          </Suspense>
        </ErrorBoundary>
      </SiteSettingsRouteGuard>
    } />
    <Route path="/backlog" element={
      <SiteSettingsRouteGuard feature="protected_projects">
        <Suspense fallback={<LoadingFallback />}>
          <ProductBacklog />
        </Suspense>
    
      </SiteSettingsRouteGuard>
    } />
    </>
  );
};

// ============= Protected User Routes =============
export const ProtectedUserRoutes = () => (
  <>
    {/* User Dashboard - Requires AAL2 */}
    <Route path="/dashboard" element={
      <SiteSettingsRouteGuard feature="dashboard">
        <ProtectedRoute requireAAL2={true}>
          <Suspense fallback={<LoadingFallback />}>
            <Dashboard />
          </Suspense>
        </ProtectedRoute>
    
      </SiteSettingsRouteGuard>
    } />
    
    {/* Project Routes */}
    {featureFlags.protectedProjects && (
      <>
        <Route path="/projects/:projectId" element={
          <SiteSettingsRouteGuard feature="protected_projects">
            <ProtectedRoute>
              <Suspense fallback={<LoadingFallback />}>
                <ProjectDetail />
              </Suspense>
            </ProtectedRoute>
        
          </SiteSettingsRouteGuard>
        } />
        <Route path="/projects/:projectId/canvas" element={
          <SiteSettingsRouteGuard feature="protected_projects">
            <ProtectedRoute>
              <Suspense fallback={<LoadingFallback />}>
                <ProjectCanvas />
              </Suspense>
            </ProtectedRoute>
        
          </SiteSettingsRouteGuard>
        } />
        <Route path="/projects/:projectId/bmc" element={
          <SiteSettingsRouteGuard feature="protected_projects">
            <ProtectedRoute>
              <Suspense fallback={<LoadingFallback />}>
                <ProjectBMC />
              </Suspense>
            </ProtectedRoute>
        
          </SiteSettingsRouteGuard>
        } />
        <Route path="/projects/:projectId/artifacts/:artifactId" element={
          <SiteSettingsRouteGuard feature="protected_projects">
            <ProtectedRoute>
              <Suspense fallback={<LoadingFallback />}>
                <ArtifactViewer />
              </Suspense>
            </ProtectedRoute>
        
          </SiteSettingsRouteGuard>
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
        <Route path="event-types" element={
          <Suspense fallback={<LoadingFallback />}>
            <TaxonomyManager config={TAXONOMY_CONFIGS['event-types']} />
          </Suspense>
        } />
        <Route path="event-categories" element={
          <Suspense fallback={<LoadingFallback />}>
            <TaxonomyManager config={TAXONOMY_CONFIGS['event-categories']} />
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
            <TaxonomyManager config={TAXONOMY_CONFIGS['locations']} />
          </Suspense>
        } />
        
        {/* Knowledge Management */}
        <Route path="knowledge/items" element={
          <Suspense fallback={<LoadingFallback />}>
            <AdminKnowledgeItems />
          </Suspense>
        } />
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
        <Route path="knowledge/pattern-feedback" element={
          <Suspense fallback={<LoadingFallback />}>
            <AdminPatternBuilderFeedback />
          </Suspense>
        } />
        <Route path="knowledge/imports" element={
          <Suspense fallback={<LoadingFallback />}>
            <AdminKnowledgeImport />
          </Suspense>
        } />
        
        {/* Content & Media */}
        <Route path="assets" element={
          <Suspense fallback={<LoadingFallback />}>
            <AdminAssets />
          </Suspense>
        } />
        
        {/* Configuration */}
        <Route path="levels" element={
          <Suspense fallback={<LoadingFallback />}>
            <TaxonomyManager config={TAXONOMY_CONFIGS['levels']} />
          </Suspense>
        } />
        <Route path="formats" element={
          <Suspense fallback={<LoadingFallback />}>
            <TaxonomyManager config={TAXONOMY_CONFIGS['formats']} />
          </Suspense>
        } />
        <Route path="certification-bodies" element={
          <Suspense fallback={<LoadingFallback />}>
            <TaxonomyManager config={TAXONOMY_CONFIGS['certification-bodies']} />
          </Suspense>
        } />
        <Route path="self-paced-courses" element={
          <Suspense fallback={<LoadingFallback />}>
            <AdminSelfPacedCourses />
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
        <Route path="copy" element={<Suspense fallback={<LoadingFallback />}><AdminCopy /></Suspense>} />
        <Route path="settings" element={
          <Suspense fallback={<LoadingFallback />}>
            <AdminSettings />
          </Suspense>
        } />
        
        {/* Bookings */}
        <Route path="bookings" element={
          <Suspense fallback={<LoadingFallback />}>
            <AdminBookings />
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

        {/* SEO */}
        <Route path="seo" element={
          <Suspense fallback={<LoadingFallback />}>
            <AdminSEO />
          </Suspense>
        } />

        {/* Data Management */}
        <Route path="imports" element={
          <Suspense fallback={<LoadingFallback />}>
            <AdminImports />
          </Suspense>
        } />
        
        {/* Logs & Audit — the single audit log (admin_audit_log). Legacy log paths redirect. */}
        <Route path="logs" element={<Navigate to="/admin/logs/audit" replace />} />
        <Route path="logs/application" element={<Navigate to="/admin/logs/audit" replace />} />
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
      {/* Legacy /knowledge now redirects to the ISA-O3 Knowledge Base */}
      <Route path="/knowledge" element={<Navigate to="/knowledge-base" replace />} />

      {/* ISA-O3 Knowledge Base */}
      <Route path="/knowledge-base" element={
        <SiteSettingsRouteGuard feature="knowledge">
          <ErrorBoundary>
            <Suspense fallback={<LoadingFallback />}>
              <KnowledgeBase />
            </Suspense>
          </ErrorBoundary>
        </SiteSettingsRouteGuard>
      } />
      <Route path="/knowledge-base/artifacts/:id" element={
        <SiteSettingsRouteGuard feature="knowledge">
          <ErrorBoundary>
            <Suspense fallback={<LoadingFallback />}>
              <KnowledgeBaseArtifact />
            </Suspense>
          </ErrorBoundary>
        </SiteSettingsRouteGuard>
      } />
      <Route path="/knowledge-base/techniques" element={
        <SiteSettingsRouteGuard feature="knowledge">
          <ErrorBoundary>
            <Suspense fallback={<LoadingFallback />}>
              <KnowledgeBaseTechniques />
            </Suspense>
          </ErrorBoundary>
        </SiteSettingsRouteGuard>
      } />
      <Route path="/knowledge-base/lattice" element={
        <SiteSettingsRouteGuard feature="knowledge">
          <ErrorBoundary>
            <Suspense fallback={<LoadingFallback />}>
              <KnowledgeBaseLattice />
            </Suspense>
          </ErrorBoundary>
        </SiteSettingsRouteGuard>
      } />
      <Route path="/knowledge-base/techniques/:id" element={
        <SiteSettingsRouteGuard feature="knowledge">
          <ErrorBoundary>
            <Suspense fallback={<LoadingFallback />}>
              <KnowledgeBaseTechnique />
            </Suspense>
          </ErrorBoundary>
        </SiteSettingsRouteGuard>
      } />
      <Route path="/knowledge-base/pattern-builder" element={
        <SiteSettingsRouteGuard feature="knowledge">
          <ErrorBoundary>
            <Suspense fallback={<LoadingFallback />}>
              <PatternBuilder />
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
        <SiteSettingsRouteGuard feature="coaching">
          <ErrorBoundary>
            <Suspense fallback={<LoadingFallback />}>
              <Coaching />
            </Suspense>
          </ErrorBoundary>
      
        </SiteSettingsRouteGuard>
      } />

      <Route path="/about" element={
        <SiteSettingsRouteGuard feature="about">
          <ErrorBoundary>
            <Suspense fallback={<LoadingFallback />}>
              <AboutPage />
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
        <SiteSettingsRouteGuard feature="dynamic_pages">
          <ErrorBoundary fallback={
            <div className="flex items-center justify-center h-64">
              <div className="text-lg text-destructive">Failed to load page</div>
            </div>
          }>
            <Suspense fallback={<LoadingFallback />}>
              <DynamicPageRenderer />
            </Suspense>
          </ErrorBoundary>
      
        </SiteSettingsRouteGuard>
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
