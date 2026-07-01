// Config registry that drives the generic <TaxonomyManager>. It replaces six
// near-identical admin CRUD pages (Categories, Types, Levels, Formats, Certification
// Bodies, Locations). Each entry reuses the EXISTING list hook (those hooks are consumed
// widely elsewhere — event forms, filters — so they must not change) and declares the
// table, literal query key (kept per-entity: the keys are inconsistent by history and
// other consumers key off the exact string), labels, fields, and per-entity quirks.
import type { ReactNode } from 'react';
import { useEventCategories } from '@/hooks/useEventCategories';
import { useEventTypes } from '@/hooks/useEventTypes';
import { useLevels } from '@/hooks/useLevels';
import { useFormats } from '@/hooks/useFormats';
import { useCertificationBodies } from '@/hooks/useCertificationBodies';
import { useLocations } from '@/hooks/useLocations';

export type TaxonomyField = {
  key: string;
  label: string;
  type: 'text' | 'url';
  required?: boolean;
  showInTable?: boolean; // `name` is always shown; extra fields opt in as columns
  renderCell?: (value: string) => ReactNode;
};

export type TaxonomyConfig = {
  table: string;
  queryKey: string[];
  // The existing list hook, reused verbatim (same key/order/select as other consumers).
  useList: () => { data: Array<Record<string, unknown> & { id: string }> | undefined; isLoading: boolean; error: unknown };
  singularLabel: string;
  pageTitle: string;
  pageSubtitle: string;
  addButtonLabel: string;
  cardTitle: string;
  emptyState: string;
  deleteWarning: (name: string) => string;
  fields: TaxonomyField[];
  stampAudit?: boolean; // Locations: inject created_by / updated_by from the auth user
};

const nameField: TaxonomyField = { key: 'name', label: 'Name', type: 'text', required: true };

export const TAXONOMY_CONFIGS: Record<string, TaxonomyConfig> = {
  'event-categories': {
    table: 'event_categories',
    queryKey: ['event-categories'],
    useList: useEventCategories,
    singularLabel: 'Category',
    pageTitle: 'Event Categories',
    pageSubtitle: 'Manage event categories',
    addButtonLabel: 'Add Category',
    cardTitle: 'All Event Categories',
    emptyState: 'No event categories found. Create your first category above.',
    deleteWarning: (name) => `This will permanently delete the event category "${name}". This action cannot be undone.`,
    fields: [nameField],
  },
  'event-types': {
    table: 'event_types',
    queryKey: ['event-types'],
    useList: useEventTypes,
    singularLabel: 'Event Type',
    pageTitle: 'Event Types',
    pageSubtitle: 'Manage event type categories',
    addButtonLabel: 'Add Event Type',
    cardTitle: 'All Event Types',
    emptyState: 'No event types found. Create your first event type above.',
    deleteWarning: (name) => `This will permanently delete the event type "${name}". This action cannot be undone.`,
    fields: [nameField],
  },
  levels: {
    table: 'levels',
    queryKey: ['levels'],
    useList: useLevels,
    singularLabel: 'Level',
    pageTitle: 'Levels',
    pageSubtitle: 'Manage skill/difficulty levels',
    addButtonLabel: 'Add Level',
    cardTitle: 'All Levels',
    emptyState: 'No levels found. Create your first level above.',
    deleteWarning: (name) => `This will permanently delete the level "${name}". This action cannot be undone.`,
    fields: [nameField],
  },
  formats: {
    table: 'formats',
    queryKey: ['formats'],
    useList: useFormats,
    singularLabel: 'Format',
    pageTitle: 'Formats',
    pageSubtitle: 'Manage event formats (online, in-person, hybrid)',
    addButtonLabel: 'Add Format',
    cardTitle: 'All Formats',
    emptyState: 'No formats found. Create your first format above.',
    deleteWarning: (name) => `This will permanently delete the format "${name}". This action cannot be undone.`,
    fields: [nameField],
  },
  'certification-bodies': {
    table: 'certification_bodies',
    queryKey: ['certification_bodies'],
    useList: useCertificationBodies,
    singularLabel: 'Certification Body',
    pageTitle: 'Certification Bodies',
    pageSubtitle: 'Manage certification bodies for courses',
    addButtonLabel: 'Add Certification Body',
    cardTitle: 'All Certification Bodies',
    emptyState: 'No certification bodies found. Create your first one above.',
    deleteWarning: (name) => `This will permanently delete "${name}". Any courses using this certification body will be unlinked.`,
    fields: [nameField],
  },
  locations: {
    table: 'locations',
    queryKey: ['locations'],
    useList: useLocations,
    stampAudit: true,
    singularLabel: 'Location',
    pageTitle: 'Locations',
    pageSubtitle: 'Manage event locations and venues',
    addButtonLabel: 'Add Location',
    cardTitle: 'All Locations',
    emptyState: 'No locations found. Create your first location above.',
    deleteWarning: (name) => `This will permanently delete the location "${name}". This action cannot be undone.`,
    fields: [
      nameField,
      { key: 'address', label: 'Address', type: 'text', required: true, showInTable: true },
      {
        key: 'virtual_url',
        label: 'Virtual URL',
        type: 'url',
        required: false,
        showInTable: true,
      },
    ],
  },
};
