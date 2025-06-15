
# AltogetherAgile App – Architecture Brief

## 🧾 Project Summary

AltogetherAgile is a professional learning platform offering Agile training courses, coaching, and events. This project aims to build a scalable, secure web application that allows users to:

* Browse and register for courses and events
* Complete payments via Stripe
* Manage contact and registration data
* Administer and update event offerings from reusable templates

The frontend is built with **Lovable** (React + Tailwind) and the backend uses **Supabase** for authentication, database, API access, and Edge Functions.

---

## 📐 Functional Requirements

### As a Visitor

* I can view available events filtered by category, format, or level.
* I can see details like instructor, date, location, and description.

### As a Customer

* I can register and pay securely for an event.
* I can receive confirmation of my registration.

### As an Admin

* I can add/update/delete events based on reusable templates.
* I can manage dropdown options such as instructors, locations, and formats.
* I can view and manage customer registrations and contact messages.

---

## 🟢 Current Implementation Status

### ✅ Completed & Tested

- User dashboard and registration views
- Basic authentication and route-protection (`ProtectedRoute`, `useUserRole`)
- Admin navigation layout (`AdminLayout`)
- Instructor and location CRUD (UI and most backend integration)
- Event CRUD (UI and most backend integration) — **delete event not implemented**

### 🔄 Implemented but Untested/Incomplete

- Most admin CRUD flows lack comprehensive tests
- Some error or empty states not well-handled
- Registration listing and status badges in admin event table
- Delete UI button for events (but handler not wired up)

### ❌ Missing/Incomplete

- Event templates: Only a placeholder UI; logic not built
- Contact form and admin contact management
- Event deletion (backend, wire up button)
- Registration export for admin
- Templates to Event conversion
- Email notification flows
- Social media or automation integration

---

## 🛠️ Technical Debt & Test Coverage

- Most admin features lack automated tests; see test plan
- Current test coverage is thin for admin event/instructor/location CRUD, templates, export, and integration flows
- Some UI-only placeholder sections remain (e.g., event templates)
- Codebase is growing: some key files (e.g., CreateEvent, EditInstructor, AdminLocations) are long and should be refactored for maintainability

---

## 📁 Code Layout (Lovable Frontend Actual Structure)

```
/src
  /components              → UI elements (including /admin, /dashboard, /ui, etc)
  /hooks                   → React query/data hooks (useUserRole, useInstructors, etc)
  /pages
    /admin                 → Admin event/instructor/location/template UIs & forms
    Dashboard.tsx          → User dashboard
    Events.tsx, EventDetail.tsx, Auth.tsx
  /integrations
    /supabase              → Supabase client and types
  /test                    → Vitest/RTL test setup and feature tests
```

---

## 📈 Planned Improvements

* Implement missing backend and UI for event templates, contact management, event deletion, and registration export
* Add comprehensive testing per feature area
* Refactor long files into focused components/hooks

---

## 🛡️ Security & Authentication

* **Supabase Auth** for email/password and Google OAuth
* **Row-Level Security (RLS)** for all user-specific data (registrations, contacts, etc.)
* **Edge Functions** to securely handle Stripe webhook events (e.g., checkout.session.completed)

---

## 🧱 2. Scalable Data Model

*see original spec for detailed tables — most tables present in Supabase schema; templates and contact features not fully implemented in UI*

---

## 💳 3. Stripe Integration

* Supabase Edge Functions to:
  * Create payment intents
  * Handle Stripe webhooks
  * Record successful payments in `event_registrations`
* Store Stripe customer IDs for returning users

---

## 🔄 4. Admin UX & CMS-like Functionality

* Admin routes are protected (see `ProtectedRoute` and role logic)
* Admins have functional screens for events, instructors, locations
* Templates, contacts, deletion/export features not yet implemented

---

## 📢 5. Social Media Integrations

* Not yet implemented; only placeholder in documentation

---

## 🛡️ 7. Best Practices

* RLS enforced for all customer data access
* UUIDs for all primary keys
* Client-side data revalidation using React Query
* Dropdown metadata tables deduplicate common data (instructors, formats, etc.)

---

## 🗃️ Supporting Materials

* *To be added*: ERD (exported from dbdiagram.io)
* *To be added*: Stripe checkout → webhook flow diagram
* *To be added*: Example API contracts

---

## 📋 Implementation & Test-First Roadmap

See internal documentation/test plan for upcoming staged improvements, tests, and codebase refactoring.

