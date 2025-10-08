# Archived Features Documentation

This document describes disabled prototype features that were removed from the codebase to reduce clutter. All files are preserved in git history and can be recovered if needed.

**Archived Date:** 2025-10-08  
**Git Tag:** `archive/content-studio-v1`

---

## Content Studio Dashboard Prototype

**Status:** Disabled prototype - UI mockups only, no backend implementation

### Overview
A sophisticated content management interface designed to replace the basic table view with advanced workflow management, analytics, and multiple view modes.

### Components

#### 1. ContentStudioDashboard.disabled
**Purpose:** Main orchestrator component for the Content Studio  
**Features:**
- Sidebar navigation with workflow states (All, Drafts, Review, Published, Featured)
- View switcher (Cards, Table, Kanban, Analytics)
- Command Palette integration (Ctrl+K)
- Bulk operations on selected items
- Search and advanced filtering

#### 2. ContentStudioHeader.disabled
**Purpose:** Top navigation bar with controls  
**Features:**
- Global search input
- Sort dropdown (A-Z, Z-A, Date, Views)
- View mode switcher buttons
- Advanced filters button
- Bulk actions bar when items selected
- Active filter badges

#### 3. ContentCards.disabled
**Purpose:** Grid card view of knowledge items  
**Features:**
- Responsive grid layout
- Content health score visualization
- Category and tag badges
- Status indicators
- Last updated timestamps
- Item selection checkboxes
- Quick action menu per card

#### 4. ContentTable.disabled
**Purpose:** Traditional table view  
**Features:**
- Sortable columns
- Inline status badges
- Quick actions dropdown
- Bulk selection
- Pagination

#### 5. ContentKanban.disabled
**Purpose:** Kanban board organized by workflow state  
**Features:**
- Drag-and-drop between columns
- Columns: Draft, Review, Published, Featured
- Visual card representation
- Quick edit actions
- Empty state messages

#### 6. ContentAnalytics.disabled
**Purpose:** Analytics dashboard for content performance  
**Features:**
- Overview metrics (total items, published/draft counts, total views)
- Content health score calculation
- Charts: content growth over time, category distribution
- Top-performing content list
- Category performance breakdown
- Monthly trend visualizations using Recharts

#### 7. CommandPalette.disabled
**Purpose:** Quick keyboard-driven command interface  
**Features:**
- Keyboard shortcut (Ctrl+K / Cmd+K)
- Searchable command list
- Quick Actions: Create new, Bulk edit, Export, Import
- View switchers: Cards, Table, Kanban, Analytics
- Workflow shortcuts: View Drafts, Review Queue, Published
- Settings access

### Missing Backend Requirements
To fully implement Content Studio, the following would be needed:
- Workflow state management (draft → review → published flow)
- Analytics aggregation tables or views
- Content health scoring algorithm
- Real-time updates for Kanban drag-drop
- Audit log for workflow transitions
- User roles for review/approval process

---

## Alternative Knowledge Item Editor Components

**Status:** Experimental refactor - replaced by current stepper-based editor

### Overview
Alternative editor designs exploring different UX patterns for multi-step forms.

#### 1. FocusBar.disabled
**Purpose:** Container to collapse global navigation when editing  
**Concept:** Maximize vertical space by hiding the site header during editing sessions

#### 2. EditorToolbar.disabled
**Purpose:** Compact horizontal toolbar for editor navigation  
**Features:**
- Back button
- Page title
- Step counter (e.g., "Step 2 / 5")
- Replaces large header to reduce vertical clutter

#### 3. VerticalStepper.disabled
**Purpose:** Left-hand sidebar step navigation  
**Features:**
- Numbered step circles
- Clickable step labels
- Active step highlighting with orange accent
- Visual progress indicator
- Direct navigation between steps

#### 4. KnowledgeItemEditor.disabled
**Purpose:** Complete editor using vertical stepper pattern  
**Features:**
- Multi-step form with react-hook-form
- Steps: Basic Info, Classification, Content, Enhanced, Use Cases, Publication
- Side navigation with VerticalStepper
- EditorToolbar for compact header
- Previous/Next/Save buttons

**Why Disabled:** Current implementation (`EditKnowledgeItem.tsx`) uses a different pattern that better fit the actual data model and workflow requirements.

---

## Alternative Edit Pages

#### 1. EditKnowledgeItem.disabled
**Purpose:** Basic edit page using alternative editor  
**Implementation:** Simple wrapper around `KnowledgeItemEditor.disabled`

#### 2. EditKnowledgeItemRefactored.disabled
**Purpose:** Edit page with data fetching from URL params  
**Features:**
- Extracts knowledge item ID from route params
- Fetches item from Supabase using React Query
- Passes loaded data to editor component
- Loading and error states

**Why Disabled:** Current `EditKnowledgeItem.tsx` uses a different data fetching pattern integrated with the actual editor implementation.

---

## Test Files

#### 1. EventRegistrationsDialog.test.tsx.skip
**Purpose:** Unit tests for EventRegistrationsDialog component  
**Tests Covered:**
- Rendering dialog when open
- Loading state display
- Registration data display
- Missing user data handling
- Stripe session ID copy to clipboard
- Empty state when no registrations

**Why Skipped:** Tests may have been incompatible with component updates or required mocking setup that wasn't maintained.

#### 2. useUserRegistrations.disabled
**Purpose:** Unit tests for useUserRegistrations hook  
**Tests Covered:**
- Fetching user registrations with event enrichment
- Handling missing event data
- Empty registration lists
- API error handling
- Unauthenticated user behavior

#### 3. useEventRegistrations.disabled
**Purpose:** Unit tests for useEventRegistrations and useDeleteRegistration hooks  
**Tests Covered:**
- Fetching event registrations with profile enrichment
- Missing user profile handling
- Fetch errors
- Successful registration deletion
- Deletion error handling with toast notifications

#### 4. AdminEvents.disabled
**Purpose:** Unit tests for AdminEvents page component  
**Tests Covered:**
- Loading state rendering
- Event display with instructor/location
- Registration count interactions
- Empty state handling
- Zero registrations display
- Free event price handling
- Missing instructor/location data
- Event deletion flow

**Why Disabled:** Tests may have become outdated as components evolved, or testing strategy shifted to integration/E2E tests.

---

## Recovery Instructions

All deleted files are preserved in git history. To recover any file:

```bash
# View file contents from before deletion
git show HEAD~1:path/to/file.disabled

# Restore specific file
git checkout HEAD~1 -- path/to/file.disabled

# View all deleted files in this commit
git show --name-only HEAD
```

## Related Current Implementation

- **Active Admin Page:** `src/pages/admin/AdminKnowledgeItems.tsx`
- **Active Editor:** `src/pages/admin/EditKnowledgeItem.tsx`
- **Active Editor Component:** `src/components/admin/knowledge/KnowledgeItemEditorPage.tsx`

---

**Note:** If reviving any of these features, review current data model, authentication patterns, and UI component library versions for compatibility.
