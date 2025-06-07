# AltogetherAgile App – Architecture Brief

## 🧾 Project Summary

AltogetherAgile is a professional learning platform offering Agile training courses, coaching, and events. This project aims to build a scalable, secure web application that allows users to:

* Browse and register for courses and events
* Complete payments via Stripe
* Manage contact and registration data
* Administer and update event offerings from reusable templates

The frontend will be built with **Lovable** (React + Tailwind) and the backend will be powered by **Supabase** for authentication, database, API access, and Edge Functions.

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

## 🔐 1. Security & Authentication

* **Supabase Auth** for email/password and Google OAuth
* **Row-Level Security (RLS)** for all user-specific data (registrations, contacts, etc.)
* **Edge Functions** to securely handle Stripe webhook events (e.g., checkout.session.completed)

---

## 🧱 2. Scalable Data Model

### Core Tables

* `event_templates`: Reusable blueprints for events
* `events`: Scheduled instances of an event
* `event_types`: e.g., course, webinar
* `event_categories`: e.g., agile, delivery
* `locations`: e.g., London, Zoom
* `instructors`: Reusable speaker/coach records
* `formats`: online, in-person, hybrid
* `levels`: beginner, intermediate, advanced
* `event_registrations`: Links users to events
* `users`: Supabase-authenticated accounts
* `contacts`: CRM-style user contact records

---

## 💳 3. Stripe Integration

* Supabase Edge Functions to:

  * Create payment intents
  * Handle Stripe webhooks
  * Record successful payments in `event_registrations`
* Store Stripe customer IDs for returning users
* Optional: Coupon codes or discount logic in Supabase or Stripe metadata

---

## 🔄 4. Admin UX & CMS-like Functionality

* Admin routes protected by Supabase RLS and role-based logic
* Admins can:

  * Add/edit/delete events and templates
  * Manage dropdowns (formats, categories, instructors, locations)
  * Track and export event registration lists
* Soft delete functionality for event archival

---

## 📢 5. Social Media Integrations

* Social metadata (title, image, description) stored per event
* Optional social post automation via:

  * LinkedIn API
  * Zapier or Edge Function triggers
* Social sharing buttons embedded in event pages

---

## 📁 6. Code Layout (Lovable Frontend)

```
/app
  /components        → UI elements
  /features
    /events          → Listing, detail, registration views
    /admin           → Admin-only views
    /auth            → Login & register
    /contacts        → Contact form
  /lib
    supabase.ts      → Supabase client setup
    stripe.ts        → Stripe integration helpers
  /pages
    index.tsx        → Homepage
    events/[slug].tsx
```

---

## 🛡️ 7. Best Practices

* RLS enforced for all customer data access
* Supabase schemas separated (`public`, `private`, `admin`) if complexity grows
* Use UUIDs for all primary keys
* Use `revalidate` and `useEffect` where needed to ensure client-data sync
* Reuse dropdown metadata tables to reduce duplication
* Audit logs or Supabase logs for admin actions (optional)

---

## 🗃️ Supporting Materials

* ERD (exported from dbdiagram.io) – *\[to be added]*
* Stripe checkout → webhook flow diagram – *\[to be added]*
* Example API contracts – *\[optional enhancement]*
