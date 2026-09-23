-- Security Fix: Remove orphaned kv_store table with RLS but no policies
-- This table has no foreign keys, no data, and is not referenced in the codebase

DROP TABLE IF EXISTS public.kv_store_308f6a12;