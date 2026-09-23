

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."app_role" AS ENUM (
    'admin',
    'moderator',
    'user'
);


ALTER TYPE "public"."app_role" OWNER TO "postgres";


CREATE TYPE "public"."booking_status" AS ENUM (
    'pending',
    'confirmed',
    'cancelled'
);


ALTER TYPE "public"."booking_status" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."can_play_zoo_session"("_session_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select exists (
    select 1 from public.zoo_session_participants p
    where p.session_id = _session_id
      and p.user_id = auth.uid()
      and p.role = 'player'
  )
$$;


ALTER FUNCTION "public"."can_play_zoo_session"("_session_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_ai_rate_limit"("p_user_id" "uuid", "p_endpoint" "text", "p_max_requests" integer DEFAULT 50, "p_window_minutes" integer DEFAULT 60) RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_current_count integer;
  v_window_start timestamp with time zone;
BEGIN
  -- Get current window start (round down to the hour)
  v_window_start := date_trunc('hour', now());
  
  -- Try to get existing rate limit record
  SELECT request_count INTO v_current_count
  FROM public.ai_rate_limits
  WHERE user_id = p_user_id
    AND endpoint = p_endpoint
    AND window_start = v_window_start
    AND window_start > now() - make_interval(mins => p_window_minutes);
  
  -- If no record exists or window expired, create new one
  IF v_current_count IS NULL THEN
    INSERT INTO public.ai_rate_limits (user_id, endpoint, request_count, window_start)
    VALUES (p_user_id, p_endpoint, 1, v_window_start)
    ON CONFLICT (user_id, endpoint, window_start)
    DO UPDATE SET request_count = ai_rate_limits.request_count + 1;
    
    RETURN true;
  END IF;
  
  -- Check if limit exceeded
  IF v_current_count >= p_max_requests THEN
    RETURN false;
  END IF;
  
  -- Increment counter
  UPDATE public.ai_rate_limits
  SET request_count = request_count + 1
  WHERE user_id = p_user_id
    AND endpoint = p_endpoint
    AND window_start = v_window_start;
  
  RETURN true;
END;
$$;


ALTER FUNCTION "public"."check_ai_rate_limit"("p_user_id" "uuid", "p_endpoint" "text", "p_max_requests" integer, "p_window_minutes" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."check_ai_rate_limit"("p_user_id" "uuid", "p_endpoint" "text", "p_max_requests" integer, "p_window_minutes" integer) IS 'Check if user has exceeded rate limit for AI generation';



CREATE OR REPLACE FUNCTION "public"."check_anonymous_ai_rate_limit"("p_ip_address" "text", "p_endpoint" "text", "p_max_requests" integer DEFAULT 3, "p_window_hours" integer DEFAULT 24) RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_current_count integer;
BEGIN
  -- Count requests from this IP in the time window
  SELECT COUNT(*) INTO v_current_count
  FROM public.anonymous_usage
  WHERE ip_address = p_ip_address
    AND endpoint = p_endpoint
    AND created_at > now() - make_interval(hours => p_window_hours);
  
  -- Check if limit exceeded
  IF v_current_count >= p_max_requests THEN
    RETURN false;
  END IF;
  
  -- Log this request
  INSERT INTO public.anonymous_usage (ip_address, endpoint, user_agent)
  VALUES (p_ip_address, p_endpoint, 'ai-generation');
  
  RETURN true;
END;
$$;


ALTER FUNCTION "public"."check_anonymous_ai_rate_limit"("p_ip_address" "text", "p_endpoint" "text", "p_max_requests" integer, "p_window_hours" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_comment_rate_limit"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM public.knowledge_item_comments
    WHERE user_id = NEW.user_id
      AND created_at > NOW() - INTERVAL '30 seconds'
  ) THEN
    RAISE EXCEPTION 'You are posting too quickly. Please wait 30 seconds between comments.';
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."check_comment_rate_limit"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_contact_rate_limit"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  -- Check if same IP submitted in last 5 minutes
  IF EXISTS (
    SELECT 1 
    FROM public.contacts
    WHERE ip_address = NEW.ip_address
      AND submitted_at > NOW() - INTERVAL '5 minutes'
  ) THEN
    RAISE EXCEPTION 'Rate limit exceeded. Please wait 5 minutes before submitting again.';
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."check_contact_rate_limit"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_duplicate_comment"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM public.knowledge_item_comments
    WHERE user_id = NEW.user_id
      AND knowledge_item_id = NEW.knowledge_item_id
      AND content = NEW.content
      AND created_at > NOW() - INTERVAL '24 hours'
  ) THEN
    RAISE EXCEPTION 'You have already posted this comment. Please avoid duplicate submissions.';
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."check_duplicate_comment"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cleanup_old_anonymous_usage"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  DELETE FROM public.anonymous_usage
  WHERE created_at < now() - INTERVAL '30 days';
END;
$$;


ALTER FUNCTION "public"."cleanup_old_anonymous_usage"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_knowledge_slug"("input_text" "text") RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  RETURN lower(trim(regexp_replace(input_text, '[^a-zA-Z0-9\s-]', '', 'g'))) 
         ||'-'|| 
         substr(md5(random()::text), 1, 8);
END;
$$;


ALTER FUNCTION "public"."create_knowledge_slug"("input_text" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_next_template_version"("template_title" "text") RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $_$
DECLARE
  max_version text;
  version_parts text[];
  major_version integer;
  minor_version integer;
BEGIN
  -- Get the highest version for this template title
  SELECT version INTO max_version
  FROM public.knowledge_templates 
  WHERE title = template_title 
  ORDER BY 
    CASE 
      WHEN version ~ '^\d+\.\d+$' THEN 
        (split_part(version, '.', 1)::integer * 1000 + split_part(version, '.', 2)::integer)
      ELSE 0 
    END DESC
  LIMIT 1;
  
  -- If no existing version found, start with 1.0
  IF max_version IS NULL THEN
    RETURN '1.0';
  END IF;
  
  -- Parse version (assume format is major.minor)
  version_parts := string_to_array(max_version, '.');
  
  -- If version format is invalid, return 1.0
  IF array_length(version_parts, 1) < 2 THEN
    RETURN '1.0';
  END IF;
  
  major_version := version_parts[1]::integer;
  minor_version := version_parts[2]::integer;
  
  -- Increment minor version
  minor_version := minor_version + 1;
  
  RETURN major_version || '.' || minor_version;
END;
$_$;


ALTER FUNCTION "public"."get_next_template_version"("template_title" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_popular_searches"("p_limit" integer DEFAULT 5, "p_days" integer DEFAULT 30) RETURNS TABLE("query" "text", "search_count" bigint)
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT lower(trim(sa.query)) AS query, COUNT(*)::bigint AS search_count
  FROM public.search_analytics sa
  WHERE sa.created_at >= now() - make_interval(days => GREATEST(p_days, 0))
  GROUP BY lower(trim(sa.query))
  ORDER BY COUNT(*) DESC
  LIMIT GREATEST(p_limit, 1)
$$;


ALTER FUNCTION "public"."get_popular_searches"("p_limit" integer, "p_days" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, username, role)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'username',
    'user'
  );

  -- Mirror role into user_roles
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id,
    'user'::public.app_role
  )
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."has_role"("_user_id" "uuid", "_role" "public"."app_role") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT exists (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = _user_id AND ur.role = _role
  );
$$;


ALTER FUNCTION "public"."has_role"("_user_id" "uuid", "_role" "public"."app_role") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."increment_blog_view_count"("post_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  UPDATE public.blog_posts 
  SET view_count = COALESCE(view_count, 0) + 1
  WHERE id = post_id;
END;
$$;


ALTER FUNCTION "public"."increment_blog_view_count"("post_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."increment_knowledge_item_view_count"("item_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  UPDATE public.knowledge_items 
  SET view_count = COALESCE(view_count, 0) + 1
  WHERE id = item_id;
END;
$$;


ALTER FUNCTION "public"."increment_knowledge_item_view_count"("item_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."increment_template_usage_count"("asset_uuid" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  UPDATE public.media_assets 
  SET usage_count = COALESCE(usage_count, 0) + 1
  WHERE id = asset_uuid AND is_template = true;
END;
$$;


ALTER FUNCTION "public"."increment_template_usage_count"("asset_uuid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_admin"() RETURNS boolean
    LANGUAGE "sql" STABLE
    SET "search_path" TO 'public'
    AS $$
  SELECT public.has_role(auth.uid(), 'admin'::public.app_role)
$$;


ALTER FUNCTION "public"."is_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_zoo_session_host"("_session_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select exists (
    select 1 from public.zoo_sessions s
    where s.id = _session_id and s.host_user_id = auth.uid()
  )
$$;


ALTER FUNCTION "public"."is_zoo_session_host"("_session_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_zoo_session_member"("_session_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select exists (
    select 1 from public.zoo_session_participants p
    where p.session_id = _session_id and p.user_id = auth.uid()
  )
$$;


ALTER FUNCTION "public"."is_zoo_session_member"("_session_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."join_zoo_session"("_join_code" "text", "_display_name" "text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  _session_id uuid;
begin
  if auth.uid() is null then
    raise exception 'must be signed in to join a session';
  end if;

  select id into _session_id from public.zoo_sessions
   where upper(join_code) = upper(_join_code) and status <> 'done';
  if _session_id is null then
    raise exception 'no open session with that code';
  end if;

  insert into public.zoo_session_participants (session_id, user_id, display_name)
  values (_session_id, auth.uid(), _display_name)
  on conflict (session_id, user_id)
    do update set last_seen_at = now(), display_name = excluded.display_name;

  return _session_id;
end;
$$;


ALTER FUNCTION "public"."join_zoo_session"("_join_code" "text", "_display_name" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_admin_modification"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  IF public.has_role(auth.uid(), 'admin') THEN
    INSERT INTO public.admin_audit_log (
      admin_id,
      action,
      target_table,
      target_id,
      metadata
    ) VALUES (
      auth.uid(),
      TG_OP,
      TG_TABLE_NAME,
      COALESCE(NEW.id, OLD.id),
      CASE
        WHEN TG_OP = 'UPDATE' THEN 
          jsonb_build_object('old', to_jsonb(OLD), 'new', to_jsonb(NEW))
        WHEN TG_OP = 'DELETE' THEN 
          to_jsonb(OLD)
        ELSE 
          to_jsonb(NEW)
      END
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;


ALTER FUNCTION "public"."log_admin_modification"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_admin_profile_view"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  -- Only log if viewer is admin and viewing someone else's profile
  IF public.has_role(auth.uid(), 'admin') AND auth.uid() != NEW.id THEN
    INSERT INTO public.admin_audit_log (
      admin_id,
      action,
      target_table,
      target_id,
      metadata
    ) VALUES (
      auth.uid(),
      'VIEW_PROFILE',
      'profiles',
      NEW.id,
      jsonb_build_object(
        'viewed_user_email', (SELECT email FROM auth.users WHERE id = NEW.id)
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."log_admin_profile_view"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."prevent_profile_role_change"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF NEW.role IS DISTINCT FROM OLD.role AND NOT public.is_admin() THEN
      RAISE EXCEPTION 'Only admins can change roles';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."prevent_profile_role_change"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."prune_booking_attempts"() RETURNS "void"
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  delete from booking_attempts where created_at < now() - interval '2 days';
$$;


ALTER FUNCTION "public"."prune_booking_attempts"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_blog_tag_usage_count"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
  -- Update the usage count for the affected tag
  IF TG_OP = 'INSERT' THEN
    UPDATE public.blog_tags 
    SET usage_count = (
      SELECT COUNT(*) 
      FROM public.blog_post_tags 
      WHERE tag_id = NEW.tag_id
    )
    WHERE id = NEW.tag_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.blog_tags 
    SET usage_count = (
      SELECT COUNT(*) 
      FROM public.blog_post_tags 
      WHERE tag_id = OLD.tag_id
    )
    WHERE id = OLD.tag_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;


ALTER FUNCTION "public"."update_blog_tag_usage_count"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_canvases_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_canvases_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_import_statistics"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE public.data_imports 
    SET 
      total_rows = (
        SELECT COUNT(*) 
        FROM public.staging_data 
        WHERE import_id = COALESCE(NEW.import_id, OLD.import_id)
      ),
      successful_rows = (
        SELECT COUNT(*) 
        FROM public.staging_data 
        WHERE import_id = COALESCE(NEW.import_id, OLD.import_id)
        AND processing_status = 'processed'
      ),
      failed_rows = (
        SELECT COUNT(*) 
        FROM public.staging_data 
        WHERE import_id = COALESCE(NEW.import_id, OLD.import_id)
        AND processing_status = 'failed'
      )
    WHERE id = COALESCE(NEW.import_id, OLD.import_id);
    
    RETURN COALESCE(NEW, OLD);
  END IF;
  
  RETURN NULL;
END;
$$;


ALTER FUNCTION "public"."update_import_statistics"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_tag_usage_count"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
  -- Update the usage count for the affected tag
  IF TG_OP = 'INSERT' THEN
    UPDATE public.knowledge_tags 
    SET usage_count = (
      SELECT COUNT(*) 
      FROM public.knowledge_item_tags 
      WHERE tag_id = NEW.tag_id
    )
    WHERE id = NEW.tag_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.knowledge_tags 
    SET usage_count = (
      SELECT COUNT(*) 
      FROM public.knowledge_item_tags 
      WHERE tag_id = OLD.tag_id
    )
    WHERE id = OLD.tag_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;


ALTER FUNCTION "public"."update_tag_usage_count"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_user_reputation_on_comment"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  INSERT INTO public.user_reputation (user_id, total_comments, last_comment_at)
  VALUES (NEW.user_id, 1, NOW())
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    total_comments = user_reputation.total_comments + 1,
    last_comment_at = NOW(),
    updated_at = NOW(),
    trust_level = CASE
      WHEN user_reputation.total_comments >= 100 AND user_reputation.reports_received = 0 THEN 'trusted'
      WHEN user_reputation.total_comments >= 10 AND (EXTRACT(EPOCH FROM (NOW() - user_reputation.created_at)) / 86400) >= 30 THEN 'established'
      WHEN user_reputation.reports_received > 3 THEN 'restricted'
      ELSE user_reputation.trust_level
    END;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_user_reputation_on_comment"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_user_reputation_on_report"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  -- Get the user_id of the comment owner
  UPDATE public.user_reputation
  SET 
    reports_received = reports_received + 1,
    updated_at = NOW(),
    trust_level = CASE
      WHEN reports_received + 1 > 3 THEN 'restricted'
      ELSE trust_level
    END
  WHERE user_id = (
    SELECT user_id FROM public.knowledge_item_comments WHERE id = NEW.comment_id
  );
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_user_reputation_on_report"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."zoo_guard_participant_update"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  -- The facilitator grant is the host's alone: without this, "you update your own
  -- participation" is a permission escalation.
  if new.can_facilitate is distinct from old.can_facilitate
     and not exists (select 1 from public.zoo_sessions s
                      where s.id = new.session_id and s.host_user_id = auth.uid())
  then
    raise exception 'only the host may grant facilitation';
  end if;

  -- Sitting out is your own call. Putting somebody ELSE in or out of play is the host's.
  if new.role is distinct from old.role
     and old.user_id <> auth.uid()
     and not exists (select 1 from public.zoo_sessions s
                      where s.id = new.session_id and s.host_user_id = auth.uid())
  then
    raise exception 'only the host may change another participant''s role';
  end if;

  return new;
end;
$$;


ALTER FUNCTION "public"."zoo_guard_participant_update"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."zoo_seat_is_writable"("_game_id" "uuid", "_participant_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select exists (select 1 from public.zoo_games g
                  where g.id = _game_id and public.can_play_zoo_session(g.session_id))
     and (_participant_id is null
       or _participant_id in (select p.id from public.zoo_session_participants p
                               where p.user_id = auth.uid())
       or exists (select 1 from public.zoo_games g
                    join public.zoo_sessions s on s.id = g.session_id
                   where g.id = _game_id and s.host_user_id = auth.uid()));
$$;


ALTER FUNCTION "public"."zoo_seat_is_writable"("_game_id" "uuid", "_participant_id" "uuid") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."activity_domains" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "description" "text",
    "color" "text" DEFAULT '#8B5CF6'::"text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid",
    "updated_by" "uuid",
    "full_description" "text"
);


ALTER TABLE "public"."activity_domains" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."activity_focus" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "description" "text",
    "color" "text" DEFAULT '#3B82F6'::"text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."activity_focus" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."admin_audit_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "admin_id" "uuid" NOT NULL,
    "action" "text" NOT NULL,
    "target_table" "text" NOT NULL,
    "target_id" "uuid",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "ip_address" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."admin_audit_log" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."admin_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "action" "text" NOT NULL,
    "details" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid"
);


ALTER TABLE "public"."admin_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ai_generation_audit" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "story_level" "text" NOT NULL,
    "input_data" "jsonb" NOT NULL,
    "output_data" "jsonb",
    "token_count" integer,
    "execution_time_ms" integer,
    "success" boolean NOT NULL,
    "error_message" "text",
    "ip_address" "text",
    "user_agent" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "is_anonymous" boolean DEFAULT false
);


ALTER TABLE "public"."ai_generation_audit" OWNER TO "postgres";


COMMENT ON TABLE "public"."ai_generation_audit" IS 'Audit log for AI story generation requests';



CREATE TABLE IF NOT EXISTS "public"."ai_rate_limits" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "endpoint" "text" NOT NULL,
    "request_count" integer DEFAULT 1 NOT NULL,
    "window_start" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."ai_rate_limits" OWNER TO "postgres";


COMMENT ON TABLE "public"."ai_rate_limits" IS 'Rate limiting for AI generation endpoints';



CREATE TABLE IF NOT EXISTS "public"."anonymous_usage" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "ip_address" "text" NOT NULL,
    "endpoint" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "user_agent" "text",
    "request_count" integer DEFAULT 1
);


ALTER TABLE "public"."anonymous_usage" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."auth_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "timestamp" timestamp with time zone DEFAULT "now"() NOT NULL,
    "event_message" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."auth_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."authors" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "email" "text",
    "bio" "text",
    "profile_image_url" "text",
    "website_url" "text",
    "expertise_areas" "text"[] DEFAULT '{}'::"text"[],
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid",
    "updated_by" "uuid"
);


ALTER TABLE "public"."authors" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."backlog_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "product_id" "uuid",
    "title" "text" NOT NULL,
    "description" "text",
    "priority" "text" DEFAULT 'medium'::"text",
    "status" "text" DEFAULT 'idea'::"text",
    "backlog_position" integer DEFAULT 0,
    "estimated_value" integer,
    "estimated_effort" integer,
    "source" "text",
    "target_release" "text",
    "tags" "text"[],
    "created_by" "uuid" DEFAULT "auth"."uid"(),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "project_id" "uuid",
    "acceptance_criteria" "text"[],
    "user_story_id" "uuid",
    "parent_item_id" "uuid",
    "item_type" "text" DEFAULT 'story'::"text",
    "user_persona" "text",
    "epic" "text",
    "priority_data" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "backlog_artifact_id" "uuid",
    CONSTRAINT "backlog_items_item_type_check" CHECK (("item_type" = ANY (ARRAY['epic'::"text", 'feature'::"text", 'story'::"text"])))
);


ALTER TABLE "public"."backlog_items" OWNER TO "postgres";


COMMENT ON COLUMN "public"."backlog_items"."parent_item_id" IS 'Reference to parent backlog item when this item was created by splitting acceptance criteria';



CREATE TABLE IF NOT EXISTS "public"."blog_categories" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "description" "text",
    "color" "text" DEFAULT '#3B82F6'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."blog_categories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."blog_post_tags" (
    "post_id" "uuid" NOT NULL,
    "tag_id" "uuid" NOT NULL
);


ALTER TABLE "public"."blog_post_tags" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."blog_posts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "excerpt" "text",
    "content" "text",
    "featured_image_url" "text",
    "author_id" "uuid",
    "category_id" "uuid",
    "is_published" boolean DEFAULT false,
    "is_featured" boolean DEFAULT false,
    "view_count" integer DEFAULT 0,
    "like_count" integer DEFAULT 0,
    "estimated_reading_time" integer DEFAULT 5,
    "seo_title" "text",
    "seo_description" "text",
    "seo_keywords" "text"[],
    "published_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid",
    "updated_by" "uuid",
    "category" "text",
    "display_order" integer
);


ALTER TABLE "public"."blog_posts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."blog_tags" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "usage_count" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."blog_tags" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."booking_attempts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "ip_hash" "text",
    "email" "text",
    "outcome" "text" DEFAULT 'ok'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."booking_attempts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."booking_availability" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "booking_type_id" "uuid" NOT NULL,
    "weekday" integer NOT NULL,
    "start_local" time without time zone NOT NULL,
    "end_local" time without time zone NOT NULL,
    CONSTRAINT "booking_availability_check" CHECK (("end_local" > "start_local")),
    CONSTRAINT "booking_availability_weekday_check" CHECK ((("weekday" >= 0) AND ("weekday" <= 6)))
);


ALTER TABLE "public"."booking_availability" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."booking_overrides" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "booking_type_id" "uuid" NOT NULL,
    "on_date" "date" NOT NULL,
    "closed" boolean DEFAULT true NOT NULL,
    "start_local" time without time zone,
    "end_local" time without time zone,
    "note" "text",
    CONSTRAINT "booking_overrides_check" CHECK ((("closed" AND ("start_local" IS NULL) AND ("end_local" IS NULL)) OR ((NOT "closed") AND ("start_local" IS NOT NULL) AND ("end_local" IS NOT NULL) AND ("end_local" > "start_local"))))
);


ALTER TABLE "public"."booking_overrides" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."booking_types" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "slug" "text" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "duration_minutes" integer NOT NULL,
    "buffer_before" integer DEFAULT 0 NOT NULL,
    "buffer_after" integer DEFAULT 15 NOT NULL,
    "min_notice_minutes" integer DEFAULT 1440 NOT NULL,
    "max_days_ahead" integer DEFAULT 30 NOT NULL,
    "price_pence" integer DEFAULT 0 NOT NULL,
    "video_provider" "text" DEFAULT 'zoom'::"text" NOT NULL,
    "timezone" "text" DEFAULT 'Europe/London'::"text" NOT NULL,
    "active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "booking_types_duration_minutes_check" CHECK (("duration_minutes" > 0))
);


ALTER TABLE "public"."booking_types" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."bookings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "booking_type_id" "uuid" NOT NULL,
    "starts_at" timestamp with time zone NOT NULL,
    "ends_at" timestamp with time zone NOT NULL,
    "blocks_from" timestamp with time zone NOT NULL,
    "blocks_until" timestamp with time zone NOT NULL,
    "guest_name" "text" NOT NULL,
    "guest_email" "text" NOT NULL,
    "guest_timezone" "text" NOT NULL,
    "notes" "text",
    "status" "public"."booking_status" DEFAULT 'pending'::"public"."booking_status" NOT NULL,
    "manage_token" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "meeting_id" "text",
    "meeting_url" "text",
    "meeting_passcode" "text",
    "calendar_event_id" "text",
    "payment_ref" "text",
    "user_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "cancelled_at" timestamp with time zone,
    "failure_reason" "text",
    CONSTRAINT "bookings_check" CHECK (("ends_at" > "starts_at")),
    CONSTRAINT "bookings_check1" CHECK ((("blocks_from" <= "starts_at") AND ("blocks_until" >= "ends_at")))
);


ALTER TABLE "public"."bookings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."canvases" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid",
    "data" "jsonb" DEFAULT '{"elements": [], "metadata": {}}'::"jsonb" NOT NULL,
    "created_by" "uuid",
    "updated_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "canvas_type" "text" DEFAULT 'project'::"text",
    "user_id" "uuid",
    CONSTRAINT "canvases_scope_check" CHECK (((("project_id" IS NOT NULL) AND ("user_id" IS NULL)) OR (("project_id" IS NULL) AND ("user_id" IS NOT NULL))))
);

ALTER TABLE ONLY "public"."canvases" REPLICA IDENTITY FULL;


ALTER TABLE "public"."canvases" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."certification_bodies" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."certification_bodies" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."classification_config" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "classification_type" "text" NOT NULL,
    "is_visible" boolean DEFAULT true NOT NULL,
    "display_order" integer DEFAULT 0 NOT NULL,
    "custom_label" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_by" "uuid",
    CONSTRAINT "classification_config_classification_type_check" CHECK (("classification_type" = ANY (ARRAY['categories'::"text", 'planning-focuses'::"text", 'activity-domains'::"text"])))
);


ALTER TABLE "public"."classification_config" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."comment_reports" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "comment_id" "uuid" NOT NULL,
    "reported_by" "uuid" NOT NULL,
    "reason" "text" NOT NULL,
    "details" "text",
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "reviewed_at" timestamp with time zone,
    "reviewed_by" "uuid",
    CONSTRAINT "comment_reports_reason_check" CHECK (("reason" = ANY (ARRAY['spam'::"text", 'offensive'::"text", 'off-topic'::"text", 'harassment'::"text", 'other'::"text"]))),
    CONSTRAINT "comment_reports_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'reviewed'::"text", 'dismissed'::"text", 'action_taken'::"text"])))
);


ALTER TABLE "public"."comment_reports" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."comment_votes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "comment_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "vote_type" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "comment_votes_vote_type_check" CHECK (("vote_type" = ANY (ARRAY['up'::"text", 'down'::"text"])))
);


ALTER TABLE "public"."comment_votes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."contacts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "full_name" "text",
    "email" "text" NOT NULL,
    "message" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "ip_address" "text",
    "user_agent" "text",
    "submitted_at" timestamp with time zone DEFAULT "now"(),
    "subject" "text",
    "enquiry_type" "text" DEFAULT 'general'::"text" NOT NULL,
    "attachment_url" "text",
    "attachment_filename" "text",
    "attachment_size" integer,
    "attachment_type" "text",
    "status" "text" DEFAULT 'unread'::"text",
    "preferred_contact_method" "text" DEFAULT 'email'::"text",
    "phone" "text",
    CONSTRAINT "contacts_enquiry_type_check" CHECK (("enquiry_type" = ANY (ARRAY['general'::"text", 'support'::"text", 'partnership'::"text", 'feedback'::"text", 'other'::"text", 'training'::"text", 'coaching'::"text"]))),
    CONSTRAINT "contacts_preferred_contact_method_check" CHECK (("preferred_contact_method" = ANY (ARRAY['email'::"text", 'phone'::"text"]))),
    CONSTRAINT "contacts_status_check" CHECK (("status" = ANY (ARRAY['unread'::"text", 'read'::"text", 'resolved'::"text", 'spam'::"text"])))
);


ALTER TABLE "public"."contacts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."content_blocks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "page_id" "uuid" NOT NULL,
    "type" "text" NOT NULL,
    "content" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "position" integer DEFAULT 0 NOT NULL,
    "is_visible" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "content_blocks_type_check" CHECK (("type" = ANY (ARRAY['text'::"text", 'image'::"text", 'video'::"text", 'hero'::"text", 'section'::"text", 'recommendations'::"text", 'testimonials-carousel'::"text", 'knowledge-items'::"text", 'events-list'::"text", 'blog-posts'::"text"])))
);


ALTER TABLE "public"."content_blocks" OWNER TO "postgres";


COMMENT ON COLUMN "public"."content_blocks"."type" IS 'Type of content block: text, image, video, hero, section, or recommendations';



CREATE TABLE IF NOT EXISTS "public"."course_feedback" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_id" "uuid",
    "course_name" "text" NOT NULL,
    "first_name" "text" NOT NULL,
    "last_name" "text" NOT NULL,
    "rating" integer,
    "comment" "text" NOT NULL,
    "company" "text",
    "job_title" "text",
    "source" "text" DEFAULT 'post_event'::"text" NOT NULL,
    "source_url" "text",
    "submitted_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "is_approved" boolean DEFAULT false NOT NULL,
    "is_featured" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid",
    "updated_by" "uuid",
    CONSTRAINT "course_feedback_rating_check" CHECK ((("rating" >= 1) AND ("rating" <= 10)))
);


ALTER TABLE "public"."course_feedback" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."courses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "slug" "text" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."courses" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."data_imports" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "filename" "text" NOT NULL,
    "file_type" "text" NOT NULL,
    "status" "text" DEFAULT 'uploaded'::"text" NOT NULL,
    "target_entity" "text" NOT NULL,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "processed_at" timestamp with time zone,
    "total_rows" integer DEFAULT 0,
    "successful_rows" integer DEFAULT 0,
    "failed_rows" integer DEFAULT 0,
    "mapping_config" "jsonb" DEFAULT '{}'::"jsonb",
    "processing_log" "jsonb" DEFAULT '[]'::"jsonb",
    "file_size" integer,
    "original_filename" "text",
    CONSTRAINT "data_imports_file_type_check" CHECK (("file_type" = ANY (ARRAY['excel'::"text", 'csv'::"text", 'json'::"text"]))),
    CONSTRAINT "data_imports_status_check" CHECK (("status" = ANY (ARRAY['uploaded'::"text", 'processing'::"text", 'completed'::"text", 'failed'::"text", 'cancelled'::"text"]))),
    CONSTRAINT "data_imports_target_entity_check" CHECK (("target_entity" = ANY (ARRAY['knowledge_items'::"text", 'events'::"text", 'instructors'::"text", 'categories'::"text", 'tags'::"text", 'learning_paths'::"text"])))
);


ALTER TABLE "public"."data_imports" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."decision_levels" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "description" "text",
    "color" "text" DEFAULT '#6366f1'::"text",
    "display_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid",
    "updated_by" "uuid"
);


ALTER TABLE "public"."decision_levels" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."epics" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "theme" "text",
    "status" "text" DEFAULT 'draft'::"text",
    "created_by" "uuid",
    "updated_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "jira_issue_key" "text",
    "position" integer DEFAULT 0,
    "project_id" "uuid",
    "business_objective" "text",
    "success_metrics" "text"[],
    "stakeholders" "text"[],
    "start_date" "date",
    "target_date" "date",
    CONSTRAINT "epics_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'active'::"text", 'completed'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."epics" OWNER TO "postgres";


COMMENT ON COLUMN "public"."epics"."business_objective" IS 'High-level business goal for this epic';



COMMENT ON COLUMN "public"."epics"."success_metrics" IS 'Measurable success criteria';



COMMENT ON COLUMN "public"."epics"."stakeholders" IS 'Key stakeholders involved';



CREATE TABLE IF NOT EXISTS "public"."event_categories" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL
);


ALTER TABLE "public"."event_categories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."event_registrations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_id" "uuid",
    "user_id" "uuid",
    "registered_at" timestamp with time zone DEFAULT "now"(),
    "payment_status" "text" DEFAULT 'unpaid'::"text",
    "stripe_session_id" "text"
);


ALTER TABLE "public"."event_registrations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."event_templates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "duration_days" integer,
    "event_type_id" "uuid",
    "category_id" "uuid",
    "level_id" "uuid",
    "format_id" "uuid",
    "default_location_id" "uuid",
    "default_instructor_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid",
    "updated_by" "uuid",
    "brand_color" "text" DEFAULT '#3B82F6'::"text",
    "icon_name" "text" DEFAULT 'Calendar'::"text",
    "hero_image_url" "text",
    "banner_template" "text" DEFAULT 'default'::"text",
    "learning_outcomes" "text"[],
    "prerequisites" "text"[],
    "target_audience" "text",
    "key_benefits" "text"[],
    "template_tags" "text"[],
    "difficulty_rating" "text" DEFAULT 'intermediate'::"text",
    "popularity_score" integer DEFAULT 0,
    "is_published" boolean DEFAULT false NOT NULL,
    "short_description" "text",
    "display_order" integer DEFAULT 0 NOT NULL,
    "certification_body_id" "uuid",
    "seo_title" "text",
    "seo_description" "text",
    "slug" "text",
    CONSTRAINT "event_templates_difficulty_rating_check" CHECK (("difficulty_rating" = ANY (ARRAY['beginner'::"text", 'intermediate'::"text", 'advanced'::"text"])))
);


ALTER TABLE "public"."event_templates" OWNER TO "postgres";


COMMENT ON COLUMN "public"."event_templates"."brand_color" IS 'Template brand color in hex format for visual consistency';



COMMENT ON COLUMN "public"."event_templates"."icon_name" IS 'Lucide icon name for template visual identity';



COMMENT ON COLUMN "public"."event_templates"."learning_outcomes" IS 'Array of learning outcomes for events using this template';



COMMENT ON COLUMN "public"."event_templates"."key_benefits" IS 'Array of key benefits participants will gain';



COMMENT ON COLUMN "public"."event_templates"."template_tags" IS 'Array of tags for categorizing and filtering templates';



CREATE TABLE IF NOT EXISTS "public"."event_types" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL
);


ALTER TABLE "public"."event_types" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "template_id" "uuid",
    "title" "text" NOT NULL,
    "description" "text",
    "start_date" "date" NOT NULL,
    "end_date" "date",
    "instructor_id" "uuid",
    "location_id" "uuid",
    "is_published" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "price_cents" integer DEFAULT 0,
    "currency" "text" DEFAULT 'usd'::"text",
    "created_by" "uuid",
    "updated_by" "uuid",
    "capacity" integer,
    "registration_deadline" "date",
    "time_zone" "text",
    "meeting_link" "text",
    "venue_details" "text",
    "daily_schedule" "text",
    "banner_image_url" "text",
    "seo_slug" "text",
    "tags" "text"[],
    "internal_notes" "text",
    "course_code" "text",
    "status" "text" DEFAULT 'draft'::"text",
    "expected_revenue_cents" integer,
    "lead_source" "text",
    "event_type_id" "uuid",
    "category_id" "uuid",
    "level_id" "uuid",
    "format_id" "uuid",
    CONSTRAINT "chk_events_status" CHECK (("status" = ANY (ARRAY['draft'::"text", 'scheduled'::"text", 'in_progress'::"text", 'completed'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."exam_attempts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "exam_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "answers" "jsonb",
    "score" integer,
    "passed" boolean,
    "completed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."exam_attempts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."exams" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "duration_minutes" integer DEFAULT 40 NOT NULL,
    "pass_mark" integer DEFAULT 30 NOT NULL,
    "total_questions" integer DEFAULT 50 NOT NULL,
    "status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "slug" "text" NOT NULL,
    "scenario" "text",
    "shuffle" boolean DEFAULT true NOT NULL,
    "seo_title" "text",
    "seo_description" "text",
    "guide" "text",
    CONSTRAINT "exams_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'published'::"text"])))
);


ALTER TABLE "public"."exams" OWNER TO "postgres";


COMMENT ON COLUMN "public"."exams"."guide" IS 'Long-form markdown shown below the start card on the exam page. The substance a candidate and a crawler read before sitting the paper.';



CREATE TABLE IF NOT EXISTS "public"."features" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "epic_id" "uuid",
    "created_by" "uuid",
    "updated_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "jira_issue_key" "text",
    "position" integer DEFAULT 0,
    "project_id" "uuid",
    "user_value" "text",
    "acceptance_criteria" "text"[],
    "status" "text" DEFAULT 'draft'::"text",
    CONSTRAINT "features_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'in_progress'::"text", 'completed'::"text", 'blocked'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."features" OWNER TO "postgres";


COMMENT ON COLUMN "public"."features"."user_value" IS 'Value proposition for the user';



COMMENT ON COLUMN "public"."features"."acceptance_criteria" IS 'List of acceptance criteria';



COMMENT ON COLUMN "public"."features"."status" IS 'Current status: draft, in_progress, completed, blocked, or cancelled';



CREATE TABLE IF NOT EXISTS "public"."flow_game_saves" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "state" "jsonb" NOT NULL,
    "phase" "text",
    "round_number" integer,
    "day" integer,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."flow_game_saves" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."formats" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL
);


ALTER TABLE "public"."formats" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."instructors" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "bio" "text",
    "profile_image_url" "text",
    "created_by" "uuid",
    "updated_by" "uuid"
);


ALTER TABLE "public"."instructors" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."isa_dimensions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "description" "text",
    "color" "text" DEFAULT '#6366f1'::"text",
    "display_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid",
    "updated_by" "uuid"
);


ALTER TABLE "public"."isa_dimensions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."kb_feedback" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "knowledge_item_id" "uuid",
    "rating" integer,
    "comment" "text",
    "ip_address" "text",
    "user_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "kb_feedback_rating_check" CHECK (("rating" = ANY (ARRAY['-1'::integer, 0, 1])))
);


ALTER TABLE "public"."kb_feedback" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."knowledge_categories" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "description" "text",
    "color" "text" DEFAULT '#3B82F6'::"text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid",
    "updated_by" "uuid",
    "display_order" integer DEFAULT 0
);


ALTER TABLE "public"."knowledge_categories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."knowledge_edges" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "source_id" "uuid" NOT NULL,
    "target_id" "uuid" NOT NULL,
    "edge_type" "text" NOT NULL,
    "from_level" "text",
    "to_level" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."knowledge_edges" OWNER TO "postgres";


COMMENT ON COLUMN "public"."knowledge_edges"."edge_type" IS 'convene|generate|decompose|populate|formalise|produce_or_shape|advance|anchors_to|cascades_to';



CREATE TABLE IF NOT EXISTS "public"."knowledge_item_categories" (
    "knowledge_item_id" "uuid" NOT NULL,
    "category_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "is_primary" boolean DEFAULT false,
    "rationale" "text"
);


ALTER TABLE "public"."knowledge_item_categories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."knowledge_item_comments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "knowledge_item_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "content" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "comment_content_length" CHECK ((("length"("content") >= 3) AND ("length"("content") <= 2000)))
);


ALTER TABLE "public"."knowledge_item_comments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."knowledge_item_decision_levels" (
    "knowledge_item_id" "uuid" NOT NULL,
    "decision_level_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "is_primary" boolean DEFAULT false,
    "rationale" "text"
);


ALTER TABLE "public"."knowledge_item_decision_levels" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."knowledge_item_domains" (
    "knowledge_item_id" "uuid" NOT NULL,
    "domain_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "is_primary" boolean DEFAULT false,
    "rationale" "text"
);


ALTER TABLE "public"."knowledge_item_domains" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."knowledge_item_isa_dimensions" (
    "knowledge_item_id" "uuid" NOT NULL,
    "isa_dimension_id" "uuid" NOT NULL,
    "is_primary" boolean DEFAULT false,
    "rationale" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."knowledge_item_isa_dimensions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."knowledge_item_likes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "knowledge_item_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."knowledge_item_likes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."knowledge_item_references" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "knowledge_item_id" "uuid" NOT NULL,
    "publication_id" "uuid" NOT NULL,
    "reference_type" "text" DEFAULT 'evidence'::"text" NOT NULL,
    "page_reference" "text",
    "excerpt" "text",
    "notes" "text",
    "position" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "knowledge_item_references_reference_type_check" CHECK (("reference_type" = ANY (ARRAY['primary'::"text", 'evidence'::"text", 'related'::"text", 'citation'::"text"])))
);


ALTER TABLE "public"."knowledge_item_references" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."knowledge_item_relations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "knowledge_item_id" "uuid" NOT NULL,
    "related_knowledge_item_id" "uuid" NOT NULL,
    "relation_type" "text" DEFAULT 'related'::"text",
    "strength" integer DEFAULT 1,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "knowledge_item_relations_strength_check" CHECK ((("strength" >= 1) AND ("strength" <= 10)))
);


ALTER TABLE "public"."knowledge_item_relations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."knowledge_item_relationships" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "knowledge_item_id" "uuid" NOT NULL,
    "related_item_id" "uuid" NOT NULL,
    "relationship_type" "text" DEFAULT 'pairs_with'::"text" NOT NULL,
    "position" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "knowledge_item_relationships_no_self" CHECK (("knowledge_item_id" <> "related_item_id"))
);


ALTER TABLE "public"."knowledge_item_relationships" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."knowledge_item_steps" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "knowledge_item_id" "uuid" NOT NULL,
    "step_number" integer NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "position" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid",
    "updated_by" "uuid"
);


ALTER TABLE "public"."knowledge_item_steps" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."knowledge_item_tags" (
    "knowledge_item_id" "uuid" NOT NULL,
    "tag_id" "uuid" NOT NULL
);


ALTER TABLE "public"."knowledge_item_tags" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."knowledge_item_templates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "knowledge_item_id" "uuid" NOT NULL,
    "template_id" "uuid" NOT NULL,
    "custom_config" "jsonb" DEFAULT '{}'::"jsonb",
    "display_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "media_asset_id" "uuid"
);


ALTER TABLE "public"."knowledge_item_templates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."knowledge_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "description" "text",
    "category_id" "uuid",
    "domain_id" "uuid",
    "source" "text",
    "background" "text",
    "is_published" boolean DEFAULT true,
    "is_featured" boolean DEFAULT false,
    "view_count" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid",
    "updated_by" "uuid",
    "common_pitfalls" "text"[],
    "evidence_sources" "text"[],
    "related_techniques" "text"[],
    "learning_value_summary" "text",
    "key_terminology" "jsonb" DEFAULT '{}'::"jsonb",
    "author" "text",
    "reference_url" "text",
    "publication_year" integer,
    "planning_focus_id" "uuid",
    "primary_publication_id" "uuid",
    "has_ai_support" boolean DEFAULT false,
    "icon" "text",
    "emoji" "text",
    "item_type" "text" DEFAULT 'technique'::"text",
    "why_it_exists" "text",
    "typical_output" "text",
    "what_good_looks_like" "text"[] DEFAULT '{}'::"text"[],
    "decisions_supported" "text"[] DEFAULT '{}'::"text"[],
    "decision_boundaries" "text",
    "governance_value" "text",
    "use_this_when" "text"[] DEFAULT '{}'::"text"[],
    "avoid_when" "text"[] DEFAULT '{}'::"text"[],
    "inspect_adapt_signals" "text"[] DEFAULT '{}'::"text"[],
    "maturity_indicators" "text"[] DEFAULT '{}'::"text"[],
    "horizon" "text",
    "isa" "text",
    "layer" "text",
    "facet" "text",
    "kind" "text",
    "inheritable" boolean DEFAULT false NOT NULL,
    "produces" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "counterparts" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "techniques" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "components" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "shape" "text",
    "family" "text",
    "level" "text",
    "coaches_slug" "text",
    "cell_key" "text",
    "rung" "text",
    "ladder_order" integer,
    CONSTRAINT "check_publication_year" CHECK ((("publication_year" IS NULL) OR (("publication_year" >= 1900) AND ("publication_year" <= 2030))))
);


ALTER TABLE "public"."knowledge_items" OWNER TO "postgres";


COMMENT ON COLUMN "public"."knowledge_items"."has_ai_support" IS 'Indicates whether this knowledge item has AI-powered workspace support (e.g., BMC, User Stories)';



COMMENT ON COLUMN "public"."knowledge_items"."horizon" IS 'ISA-O3 Value Horizon: Organisation | Coordination | Team';



COMMENT ON COLUMN "public"."knowledge_items"."isa" IS 'ISA-O3 dimension: Intent | Scope | Approach';



COMMENT ON COLUMN "public"."knowledge_items"."layer" IS 'ISA-O3 layer: Anchoring | Iterative | Evidence';



COMMENT ON COLUMN "public"."knowledge_items"."facet" IS 'Anchoring facet (e.g. Identity, Purpose, Direction); null otherwise';



COMMENT ON COLUMN "public"."knowledge_items"."kind" IS 'Element | Artifact';



COMMENT ON COLUMN "public"."knowledge_items"."produces" IS 'Technique -> artifact slugs produced';



COMMENT ON COLUMN "public"."knowledge_items"."counterparts" IS 'Artifact -> counterpart artifact slugs';



COMMENT ON COLUMN "public"."knowledge_items"."techniques" IS 'Artifact -> technique slugs that produce it';



COMMENT ON COLUMN "public"."knowledge_items"."components" IS 'Array of { name, question, perspective }';



COMMENT ON COLUMN "public"."knowledge_items"."shape" IS 'Artifact shape: container | anchor';



COMMENT ON COLUMN "public"."knowledge_items"."family" IS 'Constituent family: queue_item | field_content';



COMMENT ON COLUMN "public"."knowledge_items"."level" IS 'Constituent level: epic | feature | story | task';



CREATE TABLE IF NOT EXISTS "public"."knowledge_items_media" (
    "knowledge_item_id" "uuid" NOT NULL,
    "media_asset_id" "uuid" NOT NULL,
    "position" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."knowledge_items_media" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."knowledge_media" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "knowledge_item_id" "uuid" NOT NULL,
    "type" "text" NOT NULL,
    "title" "text",
    "description" "text",
    "url" "text" NOT NULL,
    "thumbnail_url" "text",
    "position" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "knowledge_media_type_check" CHECK (("type" = ANY (ARRAY['image'::"text", 'video'::"text", 'document'::"text", 'embed'::"text"])))
);


ALTER TABLE "public"."knowledge_media" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."knowledge_tags" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "usage_count" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."knowledge_tags" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."knowledge_templates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "template_type" "text" DEFAULT 'pdf'::"text" NOT NULL,
    "category" "text",
    "version" "text" DEFAULT '1.0'::"text",
    "is_public" boolean DEFAULT true,
    "usage_count" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid",
    "updated_by" "uuid",
    "pdf_url" "text",
    "pdf_filename" "text",
    "pdf_file_size" integer,
    "pdf_page_count" integer,
    "thumbnail_url" "text",
    "tags" "text"[] DEFAULT '{}'::"text"[],
    CONSTRAINT "knowledge_templates_template_type_check" CHECK (("template_type" = ANY (ARRAY['canvas'::"text", 'matrix'::"text", 'worksheet'::"text", 'process'::"text", 'form'::"text", 'pdf'::"text"])))
);


ALTER TABLE "public"."knowledge_templates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."knowledge_use_cases" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "knowledge_item_id" "uuid" NOT NULL,
    "case_type" "text" NOT NULL,
    "title" "text",
    "who" "text",
    "what" "text",
    "when_used" "text",
    "where_used" "text",
    "why" "text",
    "how" "text",
    "how_much" "text",
    "summary" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid",
    "updated_by" "uuid",
    CONSTRAINT "knowledge_use_cases_case_type_check" CHECK (("case_type" = ANY (ARRAY['generic'::"text", 'example'::"text"])))
);


ALTER TABLE "public"."knowledge_use_cases" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."lessons" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "module_id" "uuid",
    "title" "text" NOT NULL,
    "type" "text" NOT NULL,
    "duration" "text" NOT NULL,
    "chapter_ref" "text",
    "notes_html" "text",
    "video_url" "text",
    "position" integer NOT NULL,
    CONSTRAINT "lessons_type_check" CHECK (("type" = ANY (ARRAY['video'::"text", 'text'::"text", 'activity'::"text"])))
);


ALTER TABLE "public"."lessons" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."levels" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL
);


ALTER TABLE "public"."levels" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."locations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "address" "text",
    "virtual_url" "text",
    "created_by" "uuid",
    "updated_by" "uuid"
);


ALTER TABLE "public"."locations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."media_assets" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "type" "text" NOT NULL,
    "title" "text",
    "description" "text",
    "url" "text" NOT NULL,
    "thumbnail_url" "text",
    "file_size" integer,
    "file_type" "text",
    "original_filename" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid",
    "updated_by" "uuid",
    "is_template" boolean DEFAULT false,
    "template_category" "text",
    "template_version" "text" DEFAULT '1.0'::"text",
    "usage_count" integer DEFAULT 0,
    "is_public" boolean DEFAULT true,
    CONSTRAINT "media_assets_type_check" CHECK (("type" = ANY (ARRAY['image'::"text", 'video'::"text", 'document'::"text", 'embed'::"text"])))
);


ALTER TABLE "public"."media_assets" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."modules" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "course_id" "uuid",
    "title" "text" NOT NULL,
    "position" integer NOT NULL
);


ALTER TABLE "public"."modules" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."page_style_templates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "styles" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "is_builtin" boolean DEFAULT false,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."page_style_templates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."pages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "slug" "text" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "is_published" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid",
    "updated_by" "uuid",
    "show_in_main_menu" boolean DEFAULT true
);


ALTER TABLE "public"."pages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."pattern_builder_feedback" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "run_id" "uuid" NOT NULL,
    "rating" "text" NOT NULL,
    "comment" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."pattern_builder_feedback" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."pattern_builder_runs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "scenario" "text" NOT NULL,
    "primary_horizon" "text",
    "result" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "assessment" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "was_revised" boolean DEFAULT false NOT NULL,
    "user_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."pattern_builder_runs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."planning_focuses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "description" "text",
    "color" "text" DEFAULT '#10B981'::"text",
    "display_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid",
    "updated_by" "uuid"
);


ALTER TABLE "public"."planning_focuses" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."postgres_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "timestamp" timestamp with time zone DEFAULT "now"() NOT NULL,
    "identifier" "text",
    "event_message" "text",
    "error_severity" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."postgres_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."products" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "slug" "text" NOT NULL,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."products" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "full_name" "text",
    "email" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "role" "text" DEFAULT 'user'::"text" NOT NULL,
    "username" "text"
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."project_artifact_links" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "from_type" "text" NOT NULL,
    "from_id" "text" NOT NULL,
    "to_type" "text" NOT NULL,
    "to_id" "text" NOT NULL,
    "link_kind" "text" NOT NULL,
    "created_by" "uuid" DEFAULT "auth"."uid"(),
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."project_artifact_links" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."project_artifacts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "artifact_type" "text" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "data" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_by" "uuid",
    "updated_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "display_order" integer DEFAULT 0
);


ALTER TABLE "public"."project_artifacts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."projects" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "color_theme" "text" DEFAULT '#3B82F6'::"text",
    "is_archived" boolean DEFAULT false,
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "intent_statement" "text",
    "kind" "text" DEFAULT 'project'::"text" NOT NULL,
    "prioritisation_scheme" "text"
);


ALTER TABLE "public"."projects" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."publication_authors" (
    "publication_id" "uuid" NOT NULL,
    "author_id" "uuid" NOT NULL,
    "author_order" integer DEFAULT 1,
    "role" "text" DEFAULT 'author'::"text",
    CONSTRAINT "publication_authors_role_check" CHECK (("role" = ANY (ARRAY['author'::"text", 'co-author'::"text", 'editor'::"text", 'contributor'::"text"])))
);


ALTER TABLE "public"."publication_authors" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."publications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "publication_type" "text" NOT NULL,
    "url" "text",
    "isbn" "text",
    "doi" "text",
    "publication_year" integer,
    "publisher" "text",
    "journal" "text",
    "volume" "text",
    "issue" "text",
    "pages" "text",
    "abstract" "text",
    "keywords" "text"[] DEFAULT '{}'::"text"[],
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid",
    "updated_by" "uuid",
    CONSTRAINT "publications_publication_type_check" CHECK (("publication_type" = ANY (ARRAY['book'::"text", 'article'::"text", 'paper'::"text", 'website'::"text", 'blog'::"text", 'video'::"text", 'podcast'::"text", 'other'::"text"])))
);


ALTER TABLE "public"."publications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."questions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "exam_id" "uuid" NOT NULL,
    "area" "text" NOT NULL,
    "question_text" "text" NOT NULL,
    "option_a" "text" NOT NULL,
    "option_b" "text" NOT NULL,
    "option_c" "text" NOT NULL,
    "option_d" "text" NOT NULL,
    "correct_answer" "text" NOT NULL,
    "reference" "text",
    "status" "text" DEFAULT 'published'::"text" NOT NULL,
    "sort_order" integer,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "option_e" "text" DEFAULT ''::"text" NOT NULL,
    "option_f" "text" DEFAULT ''::"text" NOT NULL,
    "option_g" "text" DEFAULT ''::"text" NOT NULL,
    "option_h" "text" DEFAULT ''::"text" NOT NULL,
    "question_number" integer,
    "part" "text",
    "item_type" "text",
    "part_instruction" "text",
    CONSTRAINT "questions_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'published'::"text"])))
);


ALTER TABLE "public"."questions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."search_analytics" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "query" "text" NOT NULL,
    "results_count" integer DEFAULT 0 NOT NULL,
    "user_id" "uuid",
    "session_id" "text",
    "ip_address" "text",
    "clicked_technique_id" "uuid",
    "search_filters" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."search_analytics" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."site_copy" (
    "key" "text" NOT NULL,
    "page" "text" NOT NULL,
    "value" "text" DEFAULT ''::"text" NOT NULL,
    "label" "text" DEFAULT ''::"text" NOT NULL,
    "hint" "text" DEFAULT ''::"text" NOT NULL,
    "sort" integer DEFAULT 0 NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_by" "uuid"
);


ALTER TABLE "public"."site_copy" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."site_settings" (
    "id" "uuid" DEFAULT '00000000-0000-0000-0000-000000000001'::"uuid" NOT NULL,
    "company_name" "text" DEFAULT 'AltogetherAgile'::"text",
    "company_description" "text" DEFAULT 'Empowering teams and organizations through agile transformation and coaching.'::"text",
    "contact_email" "text",
    "contact_phone" "text",
    "contact_location" "text",
    "social_linkedin" "text",
    "social_twitter" "text",
    "social_facebook" "text",
    "social_youtube" "text",
    "social_github" "text",
    "quick_links" "jsonb" DEFAULT '[{"url": "/", "label": "Home", "enabled": true}, {"url": "/bmc-generator", "label": "AI Tools", "enabled": true}, {"url": "/dashboard", "label": "Dashboard", "enabled": true}]'::"jsonb",
    "copyright_text" "text" DEFAULT 'All rights reserved.'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "updated_by" "uuid",
    "show_events" boolean DEFAULT false,
    "show_knowledge" boolean DEFAULT false,
    "show_blog" boolean DEFAULT false,
    "show_ai_tools" boolean DEFAULT true,
    "show_contact" boolean DEFAULT true,
    "show_admin_routes" boolean DEFAULT true,
    "show_protected_projects" boolean DEFAULT true,
    "show_dynamic_pages" boolean DEFAULT true,
    "show_dashboard" boolean DEFAULT true,
    "show_recommendations" boolean DEFAULT false,
    "show_testimonial_name" boolean DEFAULT true,
    "show_testimonial_company" boolean DEFAULT true,
    "show_testimonial_rating_header" boolean DEFAULT true,
    "show_testimonial_first_name_only" boolean DEFAULT false,
    "show_coaching" boolean DEFAULT true,
    "show_about" boolean DEFAULT true,
    "show_testimonials" boolean DEFAULT true,
    "show_resources" boolean DEFAULT true,
    "show_flow_game" boolean DEFAULT true,
    "show_exams" boolean DEFAULT true,
    "show_bookings" boolean DEFAULT false,
    "show_zoo_game" boolean DEFAULT false,
    "show_scrum_game" boolean DEFAULT false
);


ALTER TABLE "public"."site_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."staging_data" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "import_id" "uuid" NOT NULL,
    "row_number" integer NOT NULL,
    "raw_data" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "mapped_data" "jsonb" DEFAULT '{}'::"jsonb",
    "validation_status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "validation_errors" "jsonb" DEFAULT '[]'::"jsonb",
    "processing_status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "processing_errors" "jsonb" DEFAULT '[]'::"jsonb",
    "target_record_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "processed_at" timestamp with time zone,
    CONSTRAINT "staging_data_processing_status_check" CHECK (("processing_status" = ANY (ARRAY['pending'::"text", 'processed'::"text", 'failed'::"text", 'skipped'::"text"]))),
    CONSTRAINT "staging_data_validation_status_check" CHECK (("validation_status" = ANY (ARRAY['pending'::"text", 'valid'::"text", 'invalid'::"text"])))
);


ALTER TABLE "public"."staging_data" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."story_relationships" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "source_story_id" "uuid" NOT NULL,
    "target_story_id" "uuid" NOT NULL,
    "relationship_type" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid",
    CONSTRAINT "story_relationships_relationship_type_check" CHECK (("relationship_type" = ANY (ARRAY['blocks'::"text", 'depends_on'::"text", 'relates_to'::"text", 'duplicates'::"text"])))
);


ALTER TABLE "public"."story_relationships" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."technique_comments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "technique_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "parent_comment_id" "uuid",
    "content" "text" NOT NULL,
    "is_approved" boolean DEFAULT true,
    "upvotes" integer DEFAULT 0,
    "downvotes" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."technique_comments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."template_assets" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "template_id" "uuid",
    "type" "text" NOT NULL,
    "storage_path" "text" NOT NULL,
    "original_filename" "text",
    "file_size" integer,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "template_assets_type_check" CHECK (("type" = ANY (ARRAY['image'::"text", 'icon'::"text", 'font'::"text", 'shape'::"text"])))
);


ALTER TABLE "public"."template_assets" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."template_usage" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "template_id" "uuid" NOT NULL,
    "user_id" "uuid",
    "session_data" "jsonb" DEFAULT '{}'::"jsonb",
    "exported_format" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."template_usage" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."template_versions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "template_id" "uuid",
    "version_number" integer NOT NULL,
    "config" "jsonb" NOT NULL,
    "canvas_config" "jsonb" DEFAULT '{}'::"jsonb",
    "change_summary" "text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."template_versions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_bookmarks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "technique_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."user_bookmarks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_contributed_examples" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "technique_id" "uuid" NOT NULL,
    "submitted_by" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text" NOT NULL,
    "context" "text",
    "outcome" "text",
    "industry" "text",
    "company_size" "text",
    "status" "text" DEFAULT 'pending'::"text",
    "reviewed_by" "uuid",
    "reviewed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "user_contributed_examples_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'approved'::"text", 'rejected'::"text"])))
);


ALTER TABLE "public"."user_contributed_examples" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_learning_path_progress" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "path_id" "uuid" NOT NULL,
    "current_step_id" "uuid",
    "status" "text" DEFAULT 'not_started'::"text",
    "started_at" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "completion_percentage" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "user_learning_path_progress_status_check" CHECK (("status" = ANY (ARRAY['not_started'::"text", 'in_progress'::"text", 'completed'::"text", 'paused'::"text"])))
);


ALTER TABLE "public"."user_learning_path_progress" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_preferences" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "preferred_difficulty_levels" "text"[],
    "preferred_categories" "uuid"[],
    "preferred_tags" "uuid"[],
    "notification_settings" "jsonb" DEFAULT '{"push": false, "email": true, "in_app": true}'::"jsonb",
    "display_preferences" "jsonb" DEFAULT '{"theme": "system", "density": "normal", "language": "en"}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."user_preferences" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_progress" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "lesson_id" "uuid",
    "completed_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_progress" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_reading_progress" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "technique_id" "uuid" NOT NULL,
    "status" "text" DEFAULT 'unread'::"text" NOT NULL,
    "started_at" timestamp with time zone DEFAULT "now"(),
    "completed_at" timestamp with time zone,
    "time_spent_seconds" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "user_reading_progress_status_check" CHECK (("status" = ANY (ARRAY['unread'::"text", 'reading'::"text", 'read'::"text", 'applied'::"text", 'mastered'::"text"])))
);


ALTER TABLE "public"."user_reading_progress" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_reputation" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "total_comments" integer DEFAULT 0 NOT NULL,
    "reports_received" integer DEFAULT 0 NOT NULL,
    "reports_dismissed" integer DEFAULT 0 NOT NULL,
    "admin_warnings" integer DEFAULT 0 NOT NULL,
    "trust_level" "text" DEFAULT 'new'::"text" NOT NULL,
    "last_comment_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "user_reputation_trust_level_check" CHECK (("trust_level" = ANY (ARRAY['new'::"text", 'established'::"text", 'trusted'::"text", 'restricted'::"text"])))
);


ALTER TABLE "public"."user_reputation" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_roles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role" "public"."app_role" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."user_roles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_stories" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "acceptance_criteria" "text"[],
    "story_points" integer,
    "status" "text" DEFAULT 'draft'::"text",
    "priority" "text" DEFAULT 'medium'::"text",
    "issue_type" "text" DEFAULT 'story'::"text",
    "epic_id" "uuid",
    "feature_id" "uuid",
    "created_by" "uuid",
    "updated_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "jira_issue_key" "text",
    "position" integer DEFAULT 0,
    "project_id" "uuid",
    "user_persona" "text",
    "problem_statement" "text",
    "business_value" "text",
    "assumptions_risks" "text",
    "dependencies" "text"[],
    "technical_notes" "text",
    "design_notes" "text",
    "ui_mockup_url" "text",
    "definition_of_ready" "jsonb" DEFAULT '{"items": []}'::"jsonb",
    "definition_of_done" "jsonb" DEFAULT '{"items": []}'::"jsonb",
    "tags" "text"[],
    "story_type" "text" DEFAULT 'feature'::"text",
    "sprint" "text",
    "impact_effort_matrix" "jsonb",
    "evidence_links" "text"[],
    "non_functional_requirements" "text"[],
    "customer_journey_stage" "text",
    "confidence_level" integer,
    "parent_story_id" "uuid",
    CONSTRAINT "user_stories_confidence_level_check" CHECK ((("confidence_level" IS NULL) OR (("confidence_level" >= 1) AND ("confidence_level" <= 5)))),
    CONSTRAINT "user_stories_issue_type_check" CHECK (("issue_type" = ANY (ARRAY['epic'::"text", 'story'::"text", 'task'::"text", 'bug'::"text"]))),
    CONSTRAINT "user_stories_priority_check" CHECK (("priority" = ANY (ARRAY['low'::"text", 'medium'::"text", 'high'::"text", 'critical'::"text"]))),
    CONSTRAINT "user_stories_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'ready'::"text", 'in_progress'::"text", 'testing'::"text", 'done'::"text"]))),
    CONSTRAINT "user_stories_story_type_check" CHECK (("story_type" = ANY (ARRAY['feature'::"text", 'spike'::"text", 'bug'::"text", 'chore'::"text", 'task'::"text"])))
);


ALTER TABLE "public"."user_stories" OWNER TO "postgres";


COMMENT ON COLUMN "public"."user_stories"."user_persona" IS 'Target user type or persona for this story';



COMMENT ON COLUMN "public"."user_stories"."problem_statement" IS 'The problem this story aims to solve';



COMMENT ON COLUMN "public"."user_stories"."business_value" IS 'Business impact and value proposition';



COMMENT ON COLUMN "public"."user_stories"."definition_of_ready" IS 'Checklist items for story readiness (JSONB format)';



COMMENT ON COLUMN "public"."user_stories"."definition_of_done" IS 'Checklist items for completion criteria (JSONB format)';



COMMENT ON COLUMN "public"."user_stories"."story_type" IS 'Type of story: feature, spike, bug, chore, or task';



COMMENT ON COLUMN "public"."user_stories"."impact_effort_matrix" IS 'Impact and effort estimation (JSONB format: {"impact": "high", "effort": "medium"})';



COMMENT ON COLUMN "public"."user_stories"."confidence_level" IS 'Confidence level from 1 (low) to 5 (high)';



COMMENT ON COLUMN "public"."user_stories"."parent_story_id" IS 'Reference to parent story when this story was created by splitting acceptance criteria';



CREATE TABLE IF NOT EXISTS "public"."zoo_copy" (
    "key" "text" NOT NULL,
    "value" "text" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_by" "uuid"
);


ALTER TABLE "public"."zoo_copy" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."zoo_game_saves" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "state" "jsonb" NOT NULL,
    "phase" "text",
    "sprint_number" integer,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."zoo_game_saves" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."zoo_game_seats" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "game_id" "uuid" NOT NULL,
    "seat" "text" NOT NULL,
    "seat_no" integer DEFAULT 1 NOT NULL,
    "participant_id" "uuid",
    "is_ai" boolean DEFAULT false NOT NULL,
    "claimed_at" timestamp with time zone,
    CONSTRAINT "zoo_game_seats_seat_check" CHECK (("seat" = ANY (ARRAY['product_owner'::"text", 'scrum_master'::"text", 'developer'::"text"]))),
    CONSTRAINT "zoo_seat_person_or_ai" CHECK ((NOT ("is_ai" AND ("participant_id" IS NOT NULL))))
);


ALTER TABLE "public"."zoo_game_seats" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."zoo_games" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "session_id" "uuid" NOT NULL,
    "seq" integer NOT NULL,
    "theme" "text" DEFAULT 'zoo'::"text" NOT NULL,
    "seed" bigint NOT NULL,
    "state" "jsonb" NOT NULL,
    "version" integer DEFAULT 0 NOT NULL,
    "status" "text" DEFAULT 'live'::"text" NOT NULL,
    "started_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "ended_at" timestamp with time zone,
    CONSTRAINT "zoo_games_status_check" CHECK (("status" = ANY (ARRAY['live'::"text", 'paused'::"text", 'done'::"text"])))
);


ALTER TABLE "public"."zoo_games" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."zoo_session_participants" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "session_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role" "text" DEFAULT 'player'::"text" NOT NULL,
    "can_facilitate" boolean DEFAULT false NOT NULL,
    "display_name" "text" NOT NULL,
    "joined_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "last_seen_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "zoo_session_participants_role_check" CHECK (("role" = ANY (ARRAY['player'::"text", 'observer'::"text"])))
);


ALTER TABLE "public"."zoo_session_participants" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."zoo_sessions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "host_user_id" "uuid" NOT NULL,
    "event_id" "uuid",
    "join_code" "text" NOT NULL,
    "status" "text" DEFAULT 'lobby'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "zoo_sessions_status_check" CHECK (("status" = ANY (ARRAY['lobby'::"text", 'live'::"text", 'paused'::"text", 'done'::"text"])))
);


ALTER TABLE "public"."zoo_sessions" OWNER TO "postgres";


ALTER TABLE ONLY "public"."activity_domains"
    ADD CONSTRAINT "activity_domains_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."activity_domains"
    ADD CONSTRAINT "activity_domains_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."activity_domains"
    ADD CONSTRAINT "activity_domains_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."activity_focus"
    ADD CONSTRAINT "activity_focus_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."activity_focus"
    ADD CONSTRAINT "activity_focus_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."activity_focus"
    ADD CONSTRAINT "activity_focus_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."admin_audit_log"
    ADD CONSTRAINT "admin_audit_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."admin_logs"
    ADD CONSTRAINT "admin_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_generation_audit"
    ADD CONSTRAINT "ai_generation_audit_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_rate_limits"
    ADD CONSTRAINT "ai_rate_limits_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ai_rate_limits"
    ADD CONSTRAINT "ai_rate_limits_user_id_endpoint_window_start_key" UNIQUE ("user_id", "endpoint", "window_start");



ALTER TABLE ONLY "public"."anonymous_usage"
    ADD CONSTRAINT "anonymous_usage_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."auth_logs"
    ADD CONSTRAINT "auth_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."authors"
    ADD CONSTRAINT "authors_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."backlog_items"
    ADD CONSTRAINT "backlog_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."blog_categories"
    ADD CONSTRAINT "blog_categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."blog_categories"
    ADD CONSTRAINT "blog_categories_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."blog_post_tags"
    ADD CONSTRAINT "blog_post_tags_pkey" PRIMARY KEY ("post_id", "tag_id");



ALTER TABLE ONLY "public"."blog_posts"
    ADD CONSTRAINT "blog_posts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."blog_posts"
    ADD CONSTRAINT "blog_posts_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."blog_tags"
    ADD CONSTRAINT "blog_tags_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."blog_tags"
    ADD CONSTRAINT "blog_tags_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."booking_attempts"
    ADD CONSTRAINT "booking_attempts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."booking_availability"
    ADD CONSTRAINT "booking_availability_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."booking_overrides"
    ADD CONSTRAINT "booking_overrides_booking_type_id_on_date_key" UNIQUE ("booking_type_id", "on_date");



ALTER TABLE ONLY "public"."booking_overrides"
    ADD CONSTRAINT "booking_overrides_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."booking_types"
    ADD CONSTRAINT "booking_types_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."booking_types"
    ADD CONSTRAINT "booking_types_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_no_overlap" EXCLUDE USING "gist" ("tstzrange"("blocks_from", "blocks_until") WITH &&) WHERE (("status" <> 'cancelled'::"public"."booking_status"));



ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."canvases"
    ADD CONSTRAINT "canvases_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."canvases"
    ADD CONSTRAINT "canvases_project_id_unique" UNIQUE ("project_id");



ALTER TABLE ONLY "public"."certification_bodies"
    ADD CONSTRAINT "certification_bodies_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."certification_bodies"
    ADD CONSTRAINT "certification_bodies_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."classification_config"
    ADD CONSTRAINT "classification_config_classification_type_key" UNIQUE ("classification_type");



ALTER TABLE ONLY "public"."classification_config"
    ADD CONSTRAINT "classification_config_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."comment_reports"
    ADD CONSTRAINT "comment_reports_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."comment_votes"
    ADD CONSTRAINT "comment_votes_comment_id_user_id_key" UNIQUE ("comment_id", "user_id");



ALTER TABLE ONLY "public"."comment_votes"
    ADD CONSTRAINT "comment_votes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."contacts"
    ADD CONSTRAINT "contacts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."content_blocks"
    ADD CONSTRAINT "content_blocks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."course_feedback"
    ADD CONSTRAINT "course_feedback_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."courses"
    ADD CONSTRAINT "courses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."courses"
    ADD CONSTRAINT "courses_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."data_imports"
    ADD CONSTRAINT "data_imports_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."decision_levels"
    ADD CONSTRAINT "decision_levels_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."decision_levels"
    ADD CONSTRAINT "decision_levels_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."epics"
    ADD CONSTRAINT "epics_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."event_categories"
    ADD CONSTRAINT "event_categories_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."event_categories"
    ADD CONSTRAINT "event_categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."event_registrations"
    ADD CONSTRAINT "event_registrations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."event_templates"
    ADD CONSTRAINT "event_templates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."event_types"
    ADD CONSTRAINT "event_types_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."event_types"
    ADD CONSTRAINT "event_types_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."exam_attempts"
    ADD CONSTRAINT "exam_attempts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."exams"
    ADD CONSTRAINT "exams_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."exams"
    ADD CONSTRAINT "exams_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."features"
    ADD CONSTRAINT "features_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."flow_game_saves"
    ADD CONSTRAINT "flow_game_saves_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."formats"
    ADD CONSTRAINT "formats_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."formats"
    ADD CONSTRAINT "formats_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."instructors"
    ADD CONSTRAINT "instructors_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."isa_dimensions"
    ADD CONSTRAINT "isa_dimensions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."isa_dimensions"
    ADD CONSTRAINT "isa_dimensions_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."kb_feedback"
    ADD CONSTRAINT "kb_feedback_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."knowledge_categories"
    ADD CONSTRAINT "knowledge_categories_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."knowledge_categories"
    ADD CONSTRAINT "knowledge_categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."knowledge_categories"
    ADD CONSTRAINT "knowledge_categories_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."knowledge_edges"
    ADD CONSTRAINT "knowledge_edges_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."knowledge_edges"
    ADD CONSTRAINT "knowledge_edges_source_id_target_id_edge_type_key" UNIQUE ("source_id", "target_id", "edge_type");



ALTER TABLE ONLY "public"."knowledge_item_categories"
    ADD CONSTRAINT "knowledge_item_categories_pkey" PRIMARY KEY ("knowledge_item_id", "category_id");



ALTER TABLE ONLY "public"."knowledge_item_comments"
    ADD CONSTRAINT "knowledge_item_comments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."knowledge_item_decision_levels"
    ADD CONSTRAINT "knowledge_item_decision_levels_pkey" PRIMARY KEY ("knowledge_item_id", "decision_level_id");



ALTER TABLE ONLY "public"."knowledge_item_domains"
    ADD CONSTRAINT "knowledge_item_domains_pkey" PRIMARY KEY ("knowledge_item_id", "domain_id");



ALTER TABLE ONLY "public"."knowledge_item_isa_dimensions"
    ADD CONSTRAINT "knowledge_item_isa_dimensions_pkey" PRIMARY KEY ("knowledge_item_id", "isa_dimension_id");



ALTER TABLE ONLY "public"."knowledge_item_likes"
    ADD CONSTRAINT "knowledge_item_likes_knowledge_item_id_user_id_key" UNIQUE ("knowledge_item_id", "user_id");



ALTER TABLE ONLY "public"."knowledge_item_likes"
    ADD CONSTRAINT "knowledge_item_likes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."knowledge_item_references"
    ADD CONSTRAINT "knowledge_item_references_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."knowledge_item_relations"
    ADD CONSTRAINT "knowledge_item_relations_knowledge_item_id_related_knowledg_key" UNIQUE ("knowledge_item_id", "related_knowledge_item_id", "relation_type");



ALTER TABLE ONLY "public"."knowledge_item_relations"
    ADD CONSTRAINT "knowledge_item_relations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."knowledge_item_relationships"
    ADD CONSTRAINT "knowledge_item_relationships_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."knowledge_item_relationships"
    ADD CONSTRAINT "knowledge_item_relationships_unique" UNIQUE ("knowledge_item_id", "related_item_id", "relationship_type");



ALTER TABLE ONLY "public"."knowledge_item_steps"
    ADD CONSTRAINT "knowledge_item_steps_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."knowledge_item_tags"
    ADD CONSTRAINT "knowledge_item_tags_pkey" PRIMARY KEY ("knowledge_item_id", "tag_id");



ALTER TABLE ONLY "public"."knowledge_item_templates"
    ADD CONSTRAINT "knowledge_item_templates_knowledge_item_id_template_id_key" UNIQUE ("knowledge_item_id", "template_id");



ALTER TABLE ONLY "public"."knowledge_item_templates"
    ADD CONSTRAINT "knowledge_item_templates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."knowledge_items_media"
    ADD CONSTRAINT "knowledge_items_media_pkey" PRIMARY KEY ("knowledge_item_id", "media_asset_id");



ALTER TABLE ONLY "public"."knowledge_items"
    ADD CONSTRAINT "knowledge_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."knowledge_items"
    ADD CONSTRAINT "knowledge_items_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."knowledge_media"
    ADD CONSTRAINT "knowledge_media_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."knowledge_tags"
    ADD CONSTRAINT "knowledge_tags_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."knowledge_tags"
    ADD CONSTRAINT "knowledge_tags_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."knowledge_templates"
    ADD CONSTRAINT "knowledge_templates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."knowledge_use_cases"
    ADD CONSTRAINT "knowledge_use_cases_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."lessons"
    ADD CONSTRAINT "lessons_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."levels"
    ADD CONSTRAINT "levels_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."levels"
    ADD CONSTRAINT "levels_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."locations"
    ADD CONSTRAINT "locations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."media_assets"
    ADD CONSTRAINT "media_assets_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."modules"
    ADD CONSTRAINT "modules_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."page_style_templates"
    ADD CONSTRAINT "page_style_templates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pages"
    ADD CONSTRAINT "pages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pages"
    ADD CONSTRAINT "pages_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."pattern_builder_feedback"
    ADD CONSTRAINT "pattern_builder_feedback_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pattern_builder_runs"
    ADD CONSTRAINT "pattern_builder_runs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."planning_focuses"
    ADD CONSTRAINT "planning_focuses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."postgres_logs"
    ADD CONSTRAINT "postgres_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_username_key" UNIQUE ("username");



ALTER TABLE ONLY "public"."project_artifact_links"
    ADD CONSTRAINT "project_artifact_links_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."project_artifacts"
    ADD CONSTRAINT "project_artifacts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "projects_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."publication_authors"
    ADD CONSTRAINT "publication_authors_pkey" PRIMARY KEY ("publication_id", "author_id");



ALTER TABLE ONLY "public"."publications"
    ADD CONSTRAINT "publications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."questions"
    ADD CONSTRAINT "questions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."search_analytics"
    ADD CONSTRAINT "search_analytics_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."site_copy"
    ADD CONSTRAINT "site_copy_pkey" PRIMARY KEY ("key");



ALTER TABLE ONLY "public"."site_settings"
    ADD CONSTRAINT "site_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."staging_data"
    ADD CONSTRAINT "staging_data_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."story_relationships"
    ADD CONSTRAINT "story_relationships_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."technique_comments"
    ADD CONSTRAINT "technique_comments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."template_assets"
    ADD CONSTRAINT "template_assets_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."template_usage"
    ADD CONSTRAINT "template_usage_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."template_versions"
    ADD CONSTRAINT "template_versions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."knowledge_templates"
    ADD CONSTRAINT "unique_template_title_version" UNIQUE ("title", "version");



ALTER TABLE ONLY "public"."user_bookmarks"
    ADD CONSTRAINT "user_bookmarks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_bookmarks"
    ADD CONSTRAINT "user_bookmarks_user_id_technique_id_key" UNIQUE ("user_id", "technique_id");



ALTER TABLE ONLY "public"."user_contributed_examples"
    ADD CONSTRAINT "user_contributed_examples_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_learning_path_progress"
    ADD CONSTRAINT "user_learning_path_progress_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_learning_path_progress"
    ADD CONSTRAINT "user_learning_path_progress_user_id_path_id_key" UNIQUE ("user_id", "path_id");



ALTER TABLE ONLY "public"."user_preferences"
    ADD CONSTRAINT "user_preferences_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_preferences"
    ADD CONSTRAINT "user_preferences_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."user_progress"
    ADD CONSTRAINT "user_progress_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_progress"
    ADD CONSTRAINT "user_progress_user_id_lesson_id_key" UNIQUE ("user_id", "lesson_id");



ALTER TABLE ONLY "public"."user_reading_progress"
    ADD CONSTRAINT "user_reading_progress_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_reading_progress"
    ADD CONSTRAINT "user_reading_progress_user_id_technique_id_key" UNIQUE ("user_id", "technique_id");



ALTER TABLE ONLY "public"."user_reputation"
    ADD CONSTRAINT "user_reputation_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_reputation"
    ADD CONSTRAINT "user_reputation_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_user_id_role_key" UNIQUE ("user_id", "role");



ALTER TABLE ONLY "public"."user_stories"
    ADD CONSTRAINT "user_stories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."zoo_copy"
    ADD CONSTRAINT "zoo_copy_pkey" PRIMARY KEY ("key");



ALTER TABLE ONLY "public"."zoo_game_saves"
    ADD CONSTRAINT "zoo_game_saves_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."zoo_game_seats"
    ADD CONSTRAINT "zoo_game_seats_game_id_seat_seat_no_key" UNIQUE ("game_id", "seat", "seat_no");



ALTER TABLE ONLY "public"."zoo_game_seats"
    ADD CONSTRAINT "zoo_game_seats_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."zoo_games"
    ADD CONSTRAINT "zoo_games_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."zoo_games"
    ADD CONSTRAINT "zoo_games_session_id_seq_key" UNIQUE ("session_id", "seq");



ALTER TABLE ONLY "public"."zoo_session_participants"
    ADD CONSTRAINT "zoo_session_participants_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."zoo_session_participants"
    ADD CONSTRAINT "zoo_session_participants_session_id_user_id_key" UNIQUE ("session_id", "user_id");



ALTER TABLE ONLY "public"."zoo_sessions"
    ADD CONSTRAINT "zoo_sessions_join_code_key" UNIQUE ("join_code");



ALTER TABLE ONLY "public"."zoo_sessions"
    ADD CONSTRAINT "zoo_sessions_pkey" PRIMARY KEY ("id");



CREATE INDEX "booking_attempts_email_idx" ON "public"."booking_attempts" USING "btree" ("lower"("email"), "created_at" DESC);



CREATE INDEX "booking_attempts_ip_idx" ON "public"."booking_attempts" USING "btree" ("ip_hash", "created_at" DESC);



CREATE INDEX "booking_availability_type_idx" ON "public"."booking_availability" USING "btree" ("booking_type_id", "weekday");



CREATE INDEX "bookings_failure_reason_idx" ON "public"."bookings" USING "btree" ("created_at" DESC) WHERE ("failure_reason" IS NOT NULL);



CREATE INDEX "bookings_manage_token_idx" ON "public"."bookings" USING "btree" ("manage_token");



CREATE INDEX "bookings_starts_at_idx" ON "public"."bookings" USING "btree" ("starts_at");



CREATE UNIQUE INDEX "event_templates_slug_key" ON "public"."event_templates" USING "btree" ("slug");



CREATE INDEX "idx_admin_audit_log_admin_id" ON "public"."admin_audit_log" USING "btree" ("admin_id");



CREATE INDEX "idx_admin_audit_log_created_at" ON "public"."admin_audit_log" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_admin_audit_log_target" ON "public"."admin_audit_log" USING "btree" ("target_table", "target_id");



CREATE INDEX "idx_admin_logs_action" ON "public"."admin_logs" USING "btree" ("action");



CREATE INDEX "idx_admin_logs_created_at" ON "public"."admin_logs" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_admin_logs_created_by" ON "public"."admin_logs" USING "btree" ("created_by");



CREATE INDEX "idx_ai_audit_level" ON "public"."ai_generation_audit" USING "btree" ("story_level");



CREATE INDEX "idx_ai_audit_user_created" ON "public"."ai_generation_audit" USING "btree" ("user_id", "created_at" DESC);



CREATE INDEX "idx_ai_generation_audit_anonymous" ON "public"."ai_generation_audit" USING "btree" ("is_anonymous", "created_at" DESC) WHERE ("is_anonymous" = true);



CREATE INDEX "idx_anonymous_usage_ip_endpoint_created" ON "public"."anonymous_usage" USING "btree" ("ip_address", "endpoint", "created_at" DESC);



CREATE INDEX "idx_auth_logs_timestamp" ON "public"."auth_logs" USING "btree" ("timestamp" DESC);



CREATE INDEX "idx_authors_name" ON "public"."authors" USING "btree" ("name");



CREATE INDEX "idx_backlog_items_backlog_artifact" ON "public"."backlog_items" USING "btree" ("backlog_artifact_id");



CREATE INDEX "idx_backlog_items_item_type" ON "public"."backlog_items" USING "btree" ("item_type");



CREATE INDEX "idx_backlog_items_parent" ON "public"."backlog_items" USING "btree" ("parent_item_id") WHERE ("parent_item_id" IS NOT NULL);



CREATE INDEX "idx_backlog_items_parent_item_id" ON "public"."backlog_items" USING "btree" ("parent_item_id");



CREATE INDEX "idx_backlog_items_position" ON "public"."backlog_items" USING "btree" ("backlog_position");



CREATE INDEX "idx_backlog_items_product_id" ON "public"."backlog_items" USING "btree" ("product_id");



CREATE INDEX "idx_backlog_items_project_id" ON "public"."backlog_items" USING "btree" ("project_id");



CREATE INDEX "idx_backlog_items_status" ON "public"."backlog_items" USING "btree" ("status");



CREATE INDEX "idx_backlog_items_user_story_id" ON "public"."backlog_items" USING "btree" ("user_story_id");



CREATE INDEX "idx_blog_posts_display_order" ON "public"."blog_posts" USING "btree" ("display_order");



CREATE INDEX "idx_canvases_project_id" ON "public"."canvases" USING "btree" ("project_id");



CREATE INDEX "idx_canvases_user_id_type" ON "public"."canvases" USING "btree" ("user_id", "canvas_type") WHERE ("user_id" IS NOT NULL);



CREATE INDEX "idx_comment_reports_comment_id" ON "public"."comment_reports" USING "btree" ("comment_id");



CREATE INDEX "idx_comment_reports_status" ON "public"."comment_reports" USING "btree" ("status");



CREATE INDEX "idx_contacts_admin_view" ON "public"."contacts" USING "btree" ("status", "submitted_at" DESC);



CREATE INDEX "idx_contacts_enquiry_type" ON "public"."contacts" USING "btree" ("enquiry_type", "submitted_at" DESC);



CREATE INDEX "idx_content_blocks_page_id" ON "public"."content_blocks" USING "btree" ("page_id");



CREATE INDEX "idx_content_blocks_position" ON "public"."content_blocks" USING "btree" ("page_id", "position");



CREATE INDEX "idx_course_feedback_course_name" ON "public"."course_feedback" USING "btree" ("course_name");



CREATE INDEX "idx_course_feedback_event_id" ON "public"."course_feedback" USING "btree" ("event_id");



CREATE INDEX "idx_course_feedback_is_approved" ON "public"."course_feedback" USING "btree" ("is_approved");



CREATE INDEX "idx_course_feedback_is_featured" ON "public"."course_feedback" USING "btree" ("is_featured");



CREATE INDEX "idx_course_feedback_rating" ON "public"."course_feedback" USING "btree" ("rating");



CREATE INDEX "idx_course_feedback_submitted_at" ON "public"."course_feedback" USING "btree" ("submitted_at" DESC);



CREATE INDEX "idx_data_imports_created_at" ON "public"."data_imports" USING "btree" ("created_at");



CREATE INDEX "idx_data_imports_created_by" ON "public"."data_imports" USING "btree" ("created_by");



CREATE INDEX "idx_data_imports_status" ON "public"."data_imports" USING "btree" ("status");



CREATE INDEX "idx_epics_start_date" ON "public"."epics" USING "btree" ("start_date");



CREATE INDEX "idx_epics_target_date" ON "public"."epics" USING "btree" ("target_date");



CREATE INDEX "idx_event_registrations_event_id" ON "public"."event_registrations" USING "btree" ("event_id");



CREATE INDEX "idx_event_registrations_stripe_session" ON "public"."event_registrations" USING "btree" ("stripe_session_id");



CREATE INDEX "idx_event_registrations_user_id" ON "public"."event_registrations" USING "btree" ("user_id");



CREATE INDEX "idx_event_templates_brand_color" ON "public"."event_templates" USING "btree" ("brand_color");



CREATE INDEX "idx_event_templates_difficulty" ON "public"."event_templates" USING "btree" ("difficulty_rating");



CREATE INDEX "idx_event_templates_popularity" ON "public"."event_templates" USING "btree" ("popularity_score" DESC);



CREATE INDEX "idx_event_templates_tags" ON "public"."event_templates" USING "gin" ("template_tags");



CREATE INDEX "idx_events_category_id" ON "public"."events" USING "btree" ("category_id");



CREATE INDEX "idx_events_event_type_id" ON "public"."events" USING "btree" ("event_type_id");



CREATE INDEX "idx_events_format_id" ON "public"."events" USING "btree" ("format_id");



CREATE INDEX "idx_events_level_id" ON "public"."events" USING "btree" ("level_id");



CREATE INDEX "idx_events_seo_slug" ON "public"."events" USING "btree" ("seo_slug");



CREATE INDEX "idx_events_status" ON "public"."events" USING "btree" ("status");



CREATE INDEX "idx_events_tags" ON "public"."events" USING "gin" ("tags");



CREATE INDEX "idx_exam_attempts_exam_id" ON "public"."exam_attempts" USING "btree" ("exam_id");



CREATE INDEX "idx_exam_attempts_user_id" ON "public"."exam_attempts" USING "btree" ("user_id");



CREATE INDEX "idx_exams_slug" ON "public"."exams" USING "btree" ("slug");



CREATE INDEX "idx_features_epic_id" ON "public"."features" USING "btree" ("epic_id");



CREATE INDEX "idx_features_status" ON "public"."features" USING "btree" ("status");



CREATE INDEX "idx_flow_game_saves_user" ON "public"."flow_game_saves" USING "btree" ("user_id", "updated_at" DESC);



CREATE INDEX "idx_kb_feedback_created_at" ON "public"."kb_feedback" USING "btree" ("created_at");



CREATE INDEX "idx_kb_feedback_knowledge_item_id" ON "public"."kb_feedback" USING "btree" ("knowledge_item_id");



CREATE INDEX "idx_knowledge_edges_source" ON "public"."knowledge_edges" USING "btree" ("source_id");



CREATE INDEX "idx_knowledge_edges_target" ON "public"."knowledge_edges" USING "btree" ("target_id");



CREATE INDEX "idx_knowledge_edges_type" ON "public"."knowledge_edges" USING "btree" ("edge_type");



CREATE INDEX "idx_knowledge_item_comments_item" ON "public"."knowledge_item_comments" USING "btree" ("knowledge_item_id");



CREATE INDEX "idx_knowledge_item_comments_user" ON "public"."knowledge_item_comments" USING "btree" ("user_id");



CREATE INDEX "idx_knowledge_item_likes_item" ON "public"."knowledge_item_likes" USING "btree" ("knowledge_item_id");



CREATE INDEX "idx_knowledge_item_likes_user" ON "public"."knowledge_item_likes" USING "btree" ("user_id");



CREATE INDEX "idx_knowledge_item_refs_item" ON "public"."knowledge_item_references" USING "btree" ("knowledge_item_id");



CREATE INDEX "idx_knowledge_item_refs_publication" ON "public"."knowledge_item_references" USING "btree" ("publication_id");



CREATE INDEX "idx_knowledge_item_relations_related" ON "public"."knowledge_item_relations" USING "btree" ("related_knowledge_item_id");



CREATE INDEX "idx_knowledge_item_relations_source" ON "public"."knowledge_item_relations" USING "btree" ("knowledge_item_id");



CREATE INDEX "idx_knowledge_item_relationships_item" ON "public"."knowledge_item_relationships" USING "btree" ("knowledge_item_id");



CREATE INDEX "idx_knowledge_item_relationships_related" ON "public"."knowledge_item_relationships" USING "btree" ("related_item_id");



CREATE INDEX "idx_knowledge_item_steps_knowledge_item_id" ON "public"."knowledge_item_steps" USING "btree" ("knowledge_item_id");



CREATE INDEX "idx_knowledge_item_steps_position" ON "public"."knowledge_item_steps" USING "btree" ("knowledge_item_id", "position");



CREATE INDEX "idx_knowledge_item_templates_ki" ON "public"."knowledge_item_templates" USING "btree" ("knowledge_item_id");



CREATE INDEX "idx_knowledge_item_templates_media_asset" ON "public"."knowledge_item_templates" USING "btree" ("media_asset_id");



CREATE INDEX "idx_knowledge_item_templates_template" ON "public"."knowledge_item_templates" USING "btree" ("template_id");



CREATE INDEX "idx_knowledge_items_category" ON "public"."knowledge_items" USING "btree" ("category_id");



CREATE INDEX "idx_knowledge_items_domain" ON "public"."knowledge_items" USING "btree" ("domain_id");



CREATE INDEX "idx_knowledge_items_featured" ON "public"."knowledge_items" USING "btree" ("is_featured");



CREATE INDEX "idx_knowledge_items_media_position" ON "public"."knowledge_items_media" USING "btree" ("knowledge_item_id", "position");



CREATE INDEX "idx_knowledge_items_primary_publication" ON "public"."knowledge_items" USING "btree" ("primary_publication_id");



CREATE INDEX "idx_knowledge_items_published" ON "public"."knowledge_items" USING "btree" ("is_published");



CREATE INDEX "idx_knowledge_items_slug" ON "public"."knowledge_items" USING "btree" ("slug");



CREATE INDEX "idx_knowledge_media_knowledge_item_id" ON "public"."knowledge_media" USING "btree" ("knowledge_item_id");



CREATE INDEX "idx_knowledge_media_position" ON "public"."knowledge_media" USING "btree" ("position");



CREATE INDEX "idx_knowledge_templates_category" ON "public"."knowledge_templates" USING "btree" ("category");



CREATE INDEX "idx_knowledge_templates_public" ON "public"."knowledge_templates" USING "btree" ("is_public");



CREATE INDEX "idx_knowledge_templates_type" ON "public"."knowledge_templates" USING "btree" ("template_type");



CREATE INDEX "idx_knowledge_use_cases_item" ON "public"."knowledge_use_cases" USING "btree" ("knowledge_item_id");



CREATE INDEX "idx_knowledge_use_cases_type" ON "public"."knowledge_use_cases" USING "btree" ("case_type");



CREATE INDEX "idx_media_assets_created_by" ON "public"."media_assets" USING "btree" ("created_by");



CREATE INDEX "idx_media_assets_is_template" ON "public"."media_assets" USING "btree" ("is_template");



CREATE INDEX "idx_media_assets_template_category" ON "public"."media_assets" USING "btree" ("template_category");



CREATE INDEX "idx_media_assets_type" ON "public"."media_assets" USING "btree" ("type");



CREATE UNIQUE INDEX "idx_one_hero_per_page" ON "public"."content_blocks" USING "btree" ("page_id") WHERE ("type" = 'hero'::"text");



CREATE INDEX "idx_pages_slug" ON "public"."pages" USING "btree" ("slug");



CREATE INDEX "idx_pal_from" ON "public"."project_artifact_links" USING "btree" ("from_type", "from_id");



CREATE INDEX "idx_pal_project" ON "public"."project_artifact_links" USING "btree" ("project_id");



CREATE INDEX "idx_pal_to" ON "public"."project_artifact_links" USING "btree" ("to_type", "to_id");



CREATE INDEX "idx_pattern_feedback_run" ON "public"."pattern_builder_feedback" USING "btree" ("run_id");



CREATE INDEX "idx_postgres_logs_severity" ON "public"."postgres_logs" USING "btree" ("error_severity");



CREATE INDEX "idx_postgres_logs_timestamp" ON "public"."postgres_logs" USING "btree" ("timestamp" DESC);



CREATE INDEX "idx_products_slug" ON "public"."products" USING "btree" ("slug");



CREATE INDEX "idx_profiles_role" ON "public"."profiles" USING "btree" ("role");



CREATE INDEX "idx_profiles_username" ON "public"."profiles" USING "btree" ("username");



CREATE INDEX "idx_project_artifacts_project_id" ON "public"."project_artifacts" USING "btree" ("project_id");



CREATE INDEX "idx_project_artifacts_type" ON "public"."project_artifacts" USING "btree" ("artifact_type");



CREATE INDEX "idx_publication_authors_author" ON "public"."publication_authors" USING "btree" ("author_id");



CREATE INDEX "idx_publication_authors_publication" ON "public"."publication_authors" USING "btree" ("publication_id");



CREATE INDEX "idx_publications_title" ON "public"."publications" USING "btree" ("title");



CREATE INDEX "idx_publications_type_year" ON "public"."publications" USING "btree" ("publication_type", "publication_year");



CREATE INDEX "idx_questions_area" ON "public"."questions" USING "btree" ("area");



CREATE INDEX "idx_questions_exam_id" ON "public"."questions" USING "btree" ("exam_id");



CREATE INDEX "idx_search_analytics_created_at" ON "public"."search_analytics" USING "btree" ("created_at");



CREATE INDEX "idx_search_analytics_query" ON "public"."search_analytics" USING "btree" ("query");



CREATE INDEX "idx_search_analytics_user_id" ON "public"."search_analytics" USING "btree" ("user_id") WHERE ("user_id" IS NOT NULL);



CREATE INDEX "idx_staging_data_import_id" ON "public"."staging_data" USING "btree" ("import_id");



CREATE INDEX "idx_staging_data_row_number" ON "public"."staging_data" USING "btree" ("import_id", "row_number");



CREATE INDEX "idx_staging_data_status" ON "public"."staging_data" USING "btree" ("validation_status", "processing_status");



CREATE INDEX "idx_story_relationships_source" ON "public"."story_relationships" USING "btree" ("source_story_id");



CREATE INDEX "idx_story_relationships_target" ON "public"."story_relationships" USING "btree" ("target_story_id");



CREATE INDEX "idx_template_assets_template_id" ON "public"."template_assets" USING "btree" ("template_id");



CREATE INDEX "idx_template_assets_type" ON "public"."template_assets" USING "btree" ("type");



CREATE INDEX "idx_template_usage_created" ON "public"."template_usage" USING "btree" ("created_at");



CREATE INDEX "idx_template_usage_template" ON "public"."template_usage" USING "btree" ("template_id");



CREATE INDEX "idx_template_usage_user" ON "public"."template_usage" USING "btree" ("user_id");



CREATE INDEX "idx_template_versions_template_id" ON "public"."template_versions" USING "btree" ("template_id");



CREATE INDEX "idx_template_versions_version_number" ON "public"."template_versions" USING "btree" ("template_id", "version_number");



CREATE INDEX "idx_user_reputation_trust_level" ON "public"."user_reputation" USING "btree" ("trust_level");



CREATE INDEX "idx_user_stories_confidence_level" ON "public"."user_stories" USING "btree" ("confidence_level");



CREATE INDEX "idx_user_stories_epic_id" ON "public"."user_stories" USING "btree" ("epic_id");



CREATE INDEX "idx_user_stories_feature_id" ON "public"."user_stories" USING "btree" ("feature_id");



CREATE INDEX "idx_user_stories_parent" ON "public"."user_stories" USING "btree" ("parent_story_id") WHERE ("parent_story_id" IS NOT NULL);



CREATE INDEX "idx_user_stories_sprint" ON "public"."user_stories" USING "btree" ("sprint");



CREATE INDEX "idx_user_stories_status" ON "public"."user_stories" USING "btree" ("status");



CREATE INDEX "idx_user_stories_story_type" ON "public"."user_stories" USING "btree" ("story_type");



CREATE INDEX "idx_user_stories_tags" ON "public"."user_stories" USING "gin" ("tags");



CREATE INDEX "idx_zoo_game_saves_user" ON "public"."zoo_game_saves" USING "btree" ("user_id", "updated_at" DESC);



CREATE INDEX "idx_zoo_games_session" ON "public"."zoo_games" USING "btree" ("session_id", "seq");



CREATE INDEX "idx_zoo_participants_session" ON "public"."zoo_session_participants" USING "btree" ("session_id");



CREATE UNIQUE INDEX "idx_zoo_seat_one_per_participant" ON "public"."zoo_game_seats" USING "btree" ("game_id", "participant_id") WHERE ("participant_id" IS NOT NULL);



CREATE INDEX "site_copy_page_idx" ON "public"."site_copy" USING "btree" ("page", "sort");



CREATE OR REPLACE TRIGGER "audit_event_registrations" AFTER DELETE OR UPDATE ON "public"."event_registrations" FOR EACH ROW EXECUTE FUNCTION "public"."log_admin_modification"();



CREATE OR REPLACE TRIGGER "audit_user_roles" AFTER INSERT OR DELETE OR UPDATE ON "public"."user_roles" FOR EACH ROW EXECUTE FUNCTION "public"."log_admin_modification"();



CREATE OR REPLACE TRIGGER "check_contact_rate_limit_trigger" BEFORE INSERT ON "public"."contacts" FOR EACH ROW EXECUTE FUNCTION "public"."check_contact_rate_limit"();



CREATE OR REPLACE TRIGGER "enforce_comment_rate_limit" BEFORE INSERT ON "public"."knowledge_item_comments" FOR EACH ROW EXECUTE FUNCTION "public"."check_comment_rate_limit"();



CREATE OR REPLACE TRIGGER "enforce_duplicate_check" BEFORE INSERT ON "public"."knowledge_item_comments" FOR EACH ROW EXECUTE FUNCTION "public"."check_duplicate_comment"();



CREATE OR REPLACE TRIGGER "trg_prevent_profile_role_change" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."prevent_profile_role_change"();



CREATE OR REPLACE TRIGGER "update_activity_domains_updated_at" BEFORE UPDATE ON "public"."activity_domains" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_activity_focus_updated_at" BEFORE UPDATE ON "public"."activity_focus" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_authors_updated_at" BEFORE UPDATE ON "public"."authors" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_backlog_items_updated_at" BEFORE UPDATE ON "public"."backlog_items" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_blog_categories_updated_at" BEFORE UPDATE ON "public"."blog_categories" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_blog_posts_updated_at" BEFORE UPDATE ON "public"."blog_posts" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_blog_tag_usage_count_trigger" AFTER INSERT OR DELETE ON "public"."blog_post_tags" FOR EACH ROW EXECUTE FUNCTION "public"."update_blog_tag_usage_count"();



CREATE OR REPLACE TRIGGER "update_canvases_updated_at" BEFORE UPDATE ON "public"."canvases" FOR EACH ROW EXECUTE FUNCTION "public"."update_canvases_updated_at"();



CREATE OR REPLACE TRIGGER "update_classification_config_updated_at" BEFORE UPDATE ON "public"."classification_config" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_content_blocks_updated_at" BEFORE UPDATE ON "public"."content_blocks" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_course_feedback_updated_at" BEFORE UPDATE ON "public"."course_feedback" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_decision_levels_updated_at" BEFORE UPDATE ON "public"."decision_levels" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_epics_updated_at" BEFORE UPDATE ON "public"."epics" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_features_updated_at" BEFORE UPDATE ON "public"."features" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_flow_game_saves_updated_at" BEFORE UPDATE ON "public"."flow_game_saves" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_import_stats_trigger" AFTER INSERT OR UPDATE OF "processing_status" ON "public"."staging_data" FOR EACH ROW EXECUTE FUNCTION "public"."update_import_statistics"();



CREATE OR REPLACE TRIGGER "update_isa_dimensions_updated_at" BEFORE UPDATE ON "public"."isa_dimensions" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_knowledge_categories_updated_at" BEFORE UPDATE ON "public"."knowledge_categories" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_knowledge_item_comments_updated_at" BEFORE UPDATE ON "public"."knowledge_item_comments" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_knowledge_item_references_updated_at" BEFORE UPDATE ON "public"."knowledge_item_references" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_knowledge_item_steps_updated_at" BEFORE UPDATE ON "public"."knowledge_item_steps" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_knowledge_items_updated_at" BEFORE UPDATE ON "public"."knowledge_items" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_knowledge_tag_usage_count" AFTER INSERT OR DELETE ON "public"."knowledge_item_tags" FOR EACH ROW EXECUTE FUNCTION "public"."update_tag_usage_count"();



CREATE OR REPLACE TRIGGER "update_knowledge_templates_updated_at" BEFORE UPDATE ON "public"."knowledge_templates" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_knowledge_use_cases_updated_at" BEFORE UPDATE ON "public"."knowledge_use_cases" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_media_assets_updated_at" BEFORE UPDATE ON "public"."media_assets" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_pages_updated_at" BEFORE UPDATE ON "public"."pages" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_planning_focuses_updated_at" BEFORE UPDATE ON "public"."planning_focuses" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_products_updated_at" BEFORE UPDATE ON "public"."products" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_project_artifacts_updated_at" BEFORE UPDATE ON "public"."project_artifacts" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_projects_updated_at" BEFORE UPDATE ON "public"."projects" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_publications_updated_at" BEFORE UPDATE ON "public"."publications" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_reputation_after_comment" AFTER INSERT ON "public"."knowledge_item_comments" FOR EACH ROW EXECUTE FUNCTION "public"."update_user_reputation_on_comment"();



CREATE OR REPLACE TRIGGER "update_reputation_after_report" AFTER INSERT ON "public"."comment_reports" FOR EACH ROW EXECUTE FUNCTION "public"."update_user_reputation_on_report"();



CREATE OR REPLACE TRIGGER "update_site_settings_updated_at" BEFORE UPDATE ON "public"."site_settings" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_technique_comments_updated_at" BEFORE UPDATE ON "public"."technique_comments" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_template_assets_updated_at" BEFORE UPDATE ON "public"."template_assets" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_user_contributed_examples_updated_at" BEFORE UPDATE ON "public"."user_contributed_examples" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_user_learning_path_progress_updated_at" BEFORE UPDATE ON "public"."user_learning_path_progress" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_user_preferences_updated_at" BEFORE UPDATE ON "public"."user_preferences" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_user_reading_progress_updated_at" BEFORE UPDATE ON "public"."user_reading_progress" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_user_stories_updated_at" BEFORE UPDATE ON "public"."user_stories" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_zoo_game_saves_updated_at" BEFORE UPDATE ON "public"."zoo_game_saves" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_zoo_sessions_updated_at" BEFORE UPDATE ON "public"."zoo_sessions" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "zoo_guard_participant_update" BEFORE UPDATE ON "public"."zoo_session_participants" FOR EACH ROW EXECUTE FUNCTION "public"."zoo_guard_participant_update"();



ALTER TABLE ONLY "public"."activity_domains"
    ADD CONSTRAINT "activity_domains_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."activity_domains"
    ADD CONSTRAINT "activity_domains_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."admin_audit_log"
    ADD CONSTRAINT "admin_audit_log_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."admin_logs"
    ADD CONSTRAINT "admin_logs_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."ai_generation_audit"
    ADD CONSTRAINT "ai_generation_audit_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."ai_rate_limits"
    ADD CONSTRAINT "ai_rate_limits_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."authors"
    ADD CONSTRAINT "authors_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."authors"
    ADD CONSTRAINT "authors_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."backlog_items"
    ADD CONSTRAINT "backlog_items_backlog_artifact_id_fkey" FOREIGN KEY ("backlog_artifact_id") REFERENCES "public"."project_artifacts"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."backlog_items"
    ADD CONSTRAINT "backlog_items_parent_item_id_fkey" FOREIGN KEY ("parent_item_id") REFERENCES "public"."backlog_items"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."backlog_items"
    ADD CONSTRAINT "backlog_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."backlog_items"
    ADD CONSTRAINT "backlog_items_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."blog_post_tags"
    ADD CONSTRAINT "blog_post_tags_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "public"."blog_posts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."blog_post_tags"
    ADD CONSTRAINT "blog_post_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "public"."blog_tags"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."blog_posts"
    ADD CONSTRAINT "blog_posts_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."blog_categories"("id");



ALTER TABLE ONLY "public"."booking_availability"
    ADD CONSTRAINT "booking_availability_booking_type_id_fkey" FOREIGN KEY ("booking_type_id") REFERENCES "public"."booking_types"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."booking_overrides"
    ADD CONSTRAINT "booking_overrides_booking_type_id_fkey" FOREIGN KEY ("booking_type_id") REFERENCES "public"."booking_types"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_booking_type_id_fkey" FOREIGN KEY ("booking_type_id") REFERENCES "public"."booking_types"("id");



ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."canvases"
    ADD CONSTRAINT "canvases_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."canvases"
    ADD CONSTRAINT "canvases_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."canvases"
    ADD CONSTRAINT "canvases_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."canvases"
    ADD CONSTRAINT "canvases_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."classification_config"
    ADD CONSTRAINT "classification_config_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."comment_reports"
    ADD CONSTRAINT "comment_reports_comment_id_fkey" FOREIGN KEY ("comment_id") REFERENCES "public"."knowledge_item_comments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."comment_reports"
    ADD CONSTRAINT "comment_reports_reported_by_fkey" FOREIGN KEY ("reported_by") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."comment_reports"
    ADD CONSTRAINT "comment_reports_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."content_blocks"
    ADD CONSTRAINT "content_blocks_page_id_fkey" FOREIGN KEY ("page_id") REFERENCES "public"."pages"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."course_feedback"
    ADD CONSTRAINT "course_feedback_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."course_feedback"
    ADD CONSTRAINT "course_feedback_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."course_feedback"
    ADD CONSTRAINT "course_feedback_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."data_imports"
    ADD CONSTRAINT "data_imports_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."decision_levels"
    ADD CONSTRAINT "decision_levels_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."decision_levels"
    ADD CONSTRAINT "decision_levels_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."epics"
    ADD CONSTRAINT "epics_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."event_registrations"
    ADD CONSTRAINT "event_registrations_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id");



ALTER TABLE ONLY "public"."event_registrations"
    ADD CONSTRAINT "event_registrations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."event_templates"
    ADD CONSTRAINT "event_templates_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."event_categories"("id");



ALTER TABLE ONLY "public"."event_templates"
    ADD CONSTRAINT "event_templates_certification_body_id_fkey" FOREIGN KEY ("certification_body_id") REFERENCES "public"."certification_bodies"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."event_templates"
    ADD CONSTRAINT "event_templates_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."event_templates"
    ADD CONSTRAINT "event_templates_default_instructor_id_fkey" FOREIGN KEY ("default_instructor_id") REFERENCES "public"."instructors"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."event_templates"
    ADD CONSTRAINT "event_templates_default_location_id_fkey" FOREIGN KEY ("default_location_id") REFERENCES "public"."locations"("id");



ALTER TABLE ONLY "public"."event_templates"
    ADD CONSTRAINT "event_templates_event_type_id_fkey" FOREIGN KEY ("event_type_id") REFERENCES "public"."event_types"("id");



ALTER TABLE ONLY "public"."event_templates"
    ADD CONSTRAINT "event_templates_format_id_fkey" FOREIGN KEY ("format_id") REFERENCES "public"."formats"("id");



ALTER TABLE ONLY "public"."event_templates"
    ADD CONSTRAINT "event_templates_level_id_fkey" FOREIGN KEY ("level_id") REFERENCES "public"."levels"("id");



ALTER TABLE ONLY "public"."event_templates"
    ADD CONSTRAINT "event_templates_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_instructor_id_fkey" FOREIGN KEY ("instructor_id") REFERENCES "public"."instructors"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id");



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "public"."event_templates"("id");



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."exam_attempts"
    ADD CONSTRAINT "exam_attempts_exam_id_fkey" FOREIGN KEY ("exam_id") REFERENCES "public"."exams"("id");



ALTER TABLE ONLY "public"."exam_attempts"
    ADD CONSTRAINT "exam_attempts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."features"
    ADD CONSTRAINT "features_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."backlog_items"
    ADD CONSTRAINT "fk_backlog_items_user_story" FOREIGN KEY ("user_story_id") REFERENCES "public"."user_stories"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."event_registrations"
    ADD CONSTRAINT "fk_event_registrations_user_id" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "fk_events_category_id" FOREIGN KEY ("category_id") REFERENCES "public"."event_categories"("id");



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "fk_events_event_type_id" FOREIGN KEY ("event_type_id") REFERENCES "public"."event_types"("id");



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "fk_events_format_id" FOREIGN KEY ("format_id") REFERENCES "public"."formats"("id");



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "fk_events_level_id" FOREIGN KEY ("level_id") REFERENCES "public"."levels"("id");



ALTER TABLE ONLY "public"."features"
    ADD CONSTRAINT "fk_features_epic" FOREIGN KEY ("epic_id") REFERENCES "public"."epics"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."knowledge_item_templates"
    ADD CONSTRAINT "fk_knowledge_item_templates_media_asset" FOREIGN KEY ("media_asset_id") REFERENCES "public"."media_assets"("id");



ALTER TABLE ONLY "public"."story_relationships"
    ADD CONSTRAINT "fk_story_relationships_source" FOREIGN KEY ("source_story_id") REFERENCES "public"."user_stories"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."story_relationships"
    ADD CONSTRAINT "fk_story_relationships_target" FOREIGN KEY ("target_story_id") REFERENCES "public"."user_stories"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_stories"
    ADD CONSTRAINT "fk_user_stories_epic" FOREIGN KEY ("epic_id") REFERENCES "public"."epics"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."user_stories"
    ADD CONSTRAINT "fk_user_stories_feature" FOREIGN KEY ("feature_id") REFERENCES "public"."features"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."flow_game_saves"
    ADD CONSTRAINT "flow_game_saves_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."instructors"
    ADD CONSTRAINT "instructors_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."instructors"
    ADD CONSTRAINT "instructors_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."isa_dimensions"
    ADD CONSTRAINT "isa_dimensions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."isa_dimensions"
    ADD CONSTRAINT "isa_dimensions_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."kb_feedback"
    ADD CONSTRAINT "kb_feedback_knowledge_item_id_fkey" FOREIGN KEY ("knowledge_item_id") REFERENCES "public"."knowledge_items"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."kb_feedback"
    ADD CONSTRAINT "kb_feedback_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."knowledge_categories"
    ADD CONSTRAINT "knowledge_categories_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."knowledge_categories"
    ADD CONSTRAINT "knowledge_categories_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."knowledge_edges"
    ADD CONSTRAINT "knowledge_edges_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "public"."knowledge_items"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."knowledge_edges"
    ADD CONSTRAINT "knowledge_edges_target_id_fkey" FOREIGN KEY ("target_id") REFERENCES "public"."knowledge_items"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."knowledge_item_categories"
    ADD CONSTRAINT "knowledge_item_categories_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."knowledge_categories"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."knowledge_item_categories"
    ADD CONSTRAINT "knowledge_item_categories_knowledge_item_id_fkey" FOREIGN KEY ("knowledge_item_id") REFERENCES "public"."knowledge_items"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."knowledge_item_comments"
    ADD CONSTRAINT "knowledge_item_comments_knowledge_item_id_fkey" FOREIGN KEY ("knowledge_item_id") REFERENCES "public"."knowledge_items"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."knowledge_item_comments"
    ADD CONSTRAINT "knowledge_item_comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."knowledge_item_decision_levels"
    ADD CONSTRAINT "knowledge_item_decision_levels_decision_level_id_fkey" FOREIGN KEY ("decision_level_id") REFERENCES "public"."decision_levels"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."knowledge_item_decision_levels"
    ADD CONSTRAINT "knowledge_item_decision_levels_knowledge_item_id_fkey" FOREIGN KEY ("knowledge_item_id") REFERENCES "public"."knowledge_items"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."knowledge_item_domains"
    ADD CONSTRAINT "knowledge_item_domains_domain_id_fkey" FOREIGN KEY ("domain_id") REFERENCES "public"."activity_domains"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."knowledge_item_domains"
    ADD CONSTRAINT "knowledge_item_domains_knowledge_item_id_fkey" FOREIGN KEY ("knowledge_item_id") REFERENCES "public"."knowledge_items"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."knowledge_item_isa_dimensions"
    ADD CONSTRAINT "knowledge_item_isa_dimensions_isa_dimension_id_fkey" FOREIGN KEY ("isa_dimension_id") REFERENCES "public"."isa_dimensions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."knowledge_item_isa_dimensions"
    ADD CONSTRAINT "knowledge_item_isa_dimensions_knowledge_item_id_fkey" FOREIGN KEY ("knowledge_item_id") REFERENCES "public"."knowledge_items"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."knowledge_item_likes"
    ADD CONSTRAINT "knowledge_item_likes_knowledge_item_id_fkey" FOREIGN KEY ("knowledge_item_id") REFERENCES "public"."knowledge_items"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."knowledge_item_likes"
    ADD CONSTRAINT "knowledge_item_likes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."knowledge_item_references"
    ADD CONSTRAINT "knowledge_item_references_knowledge_item_id_fkey" FOREIGN KEY ("knowledge_item_id") REFERENCES "public"."knowledge_items"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."knowledge_item_references"
    ADD CONSTRAINT "knowledge_item_references_publication_id_fkey" FOREIGN KEY ("publication_id") REFERENCES "public"."publications"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."knowledge_item_relations"
    ADD CONSTRAINT "knowledge_item_relations_knowledge_item_id_fkey" FOREIGN KEY ("knowledge_item_id") REFERENCES "public"."knowledge_items"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."knowledge_item_relations"
    ADD CONSTRAINT "knowledge_item_relations_related_knowledge_item_id_fkey" FOREIGN KEY ("related_knowledge_item_id") REFERENCES "public"."knowledge_items"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."knowledge_item_relationships"
    ADD CONSTRAINT "knowledge_item_relationships_knowledge_item_id_fkey" FOREIGN KEY ("knowledge_item_id") REFERENCES "public"."knowledge_items"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."knowledge_item_relationships"
    ADD CONSTRAINT "knowledge_item_relationships_related_item_id_fkey" FOREIGN KEY ("related_item_id") REFERENCES "public"."knowledge_items"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."knowledge_item_steps"
    ADD CONSTRAINT "knowledge_item_steps_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."knowledge_item_steps"
    ADD CONSTRAINT "knowledge_item_steps_knowledge_item_id_fkey" FOREIGN KEY ("knowledge_item_id") REFERENCES "public"."knowledge_items"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."knowledge_item_steps"
    ADD CONSTRAINT "knowledge_item_steps_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."knowledge_item_tags"
    ADD CONSTRAINT "knowledge_item_tags_knowledge_item_id_fkey" FOREIGN KEY ("knowledge_item_id") REFERENCES "public"."knowledge_items"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."knowledge_item_tags"
    ADD CONSTRAINT "knowledge_item_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "public"."knowledge_tags"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."knowledge_item_templates"
    ADD CONSTRAINT "knowledge_item_templates_knowledge_item_id_fkey" FOREIGN KEY ("knowledge_item_id") REFERENCES "public"."knowledge_items"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."knowledge_item_templates"
    ADD CONSTRAINT "knowledge_item_templates_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "public"."knowledge_templates"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."knowledge_items"
    ADD CONSTRAINT "knowledge_items_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."knowledge_categories"("id");



ALTER TABLE ONLY "public"."knowledge_items"
    ADD CONSTRAINT "knowledge_items_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."knowledge_items"
    ADD CONSTRAINT "knowledge_items_domain_id_fkey" FOREIGN KEY ("domain_id") REFERENCES "public"."activity_domains"("id");



ALTER TABLE ONLY "public"."knowledge_items_media"
    ADD CONSTRAINT "knowledge_items_media_knowledge_item_id_fkey" FOREIGN KEY ("knowledge_item_id") REFERENCES "public"."knowledge_items"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."knowledge_items_media"
    ADD CONSTRAINT "knowledge_items_media_media_asset_id_fkey" FOREIGN KEY ("media_asset_id") REFERENCES "public"."media_assets"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."knowledge_items"
    ADD CONSTRAINT "knowledge_items_planning_focus_id_fkey" FOREIGN KEY ("planning_focus_id") REFERENCES "public"."planning_focuses"("id");



ALTER TABLE ONLY "public"."knowledge_items"
    ADD CONSTRAINT "knowledge_items_primary_publication_id_fkey" FOREIGN KEY ("primary_publication_id") REFERENCES "public"."publications"("id");



ALTER TABLE ONLY "public"."knowledge_items"
    ADD CONSTRAINT "knowledge_items_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."knowledge_media"
    ADD CONSTRAINT "knowledge_media_knowledge_item_id_fkey" FOREIGN KEY ("knowledge_item_id") REFERENCES "public"."knowledge_items"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."knowledge_templates"
    ADD CONSTRAINT "knowledge_templates_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."knowledge_templates"
    ADD CONSTRAINT "knowledge_templates_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."knowledge_use_cases"
    ADD CONSTRAINT "knowledge_use_cases_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."knowledge_use_cases"
    ADD CONSTRAINT "knowledge_use_cases_knowledge_item_id_fkey" FOREIGN KEY ("knowledge_item_id") REFERENCES "public"."knowledge_items"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."knowledge_use_cases"
    ADD CONSTRAINT "knowledge_use_cases_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."lessons"
    ADD CONSTRAINT "lessons_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "public"."modules"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."locations"
    ADD CONSTRAINT "locations_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."locations"
    ADD CONSTRAINT "locations_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."media_assets"
    ADD CONSTRAINT "media_assets_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."media_assets"
    ADD CONSTRAINT "media_assets_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."modules"
    ADD CONSTRAINT "modules_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."page_style_templates"
    ADD CONSTRAINT "page_style_templates_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."pattern_builder_feedback"
    ADD CONSTRAINT "pattern_builder_feedback_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "public"."pattern_builder_runs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."project_artifact_links"
    ADD CONSTRAINT "project_artifact_links_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_artifacts"
    ADD CONSTRAINT "project_artifacts_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."project_artifacts"
    ADD CONSTRAINT "project_artifacts_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_artifacts"
    ADD CONSTRAINT "project_artifacts_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "projects_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."publication_authors"
    ADD CONSTRAINT "publication_authors_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "public"."authors"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."publication_authors"
    ADD CONSTRAINT "publication_authors_publication_id_fkey" FOREIGN KEY ("publication_id") REFERENCES "public"."publications"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."publications"
    ADD CONSTRAINT "publications_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."publications"
    ADD CONSTRAINT "publications_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."questions"
    ADD CONSTRAINT "questions_exam_id_fkey" FOREIGN KEY ("exam_id") REFERENCES "public"."exams"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."site_copy"
    ADD CONSTRAINT "site_copy_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."site_settings"
    ADD CONSTRAINT "site_settings_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."staging_data"
    ADD CONSTRAINT "staging_data_import_id_fkey" FOREIGN KEY ("import_id") REFERENCES "public"."data_imports"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."technique_comments"
    ADD CONSTRAINT "technique_comments_parent_comment_id_fkey" FOREIGN KEY ("parent_comment_id") REFERENCES "public"."technique_comments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."technique_comments"
    ADD CONSTRAINT "technique_comments_technique_id_fkey" FOREIGN KEY ("technique_id") REFERENCES "public"."knowledge_items"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."template_assets"
    ADD CONSTRAINT "template_assets_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "public"."knowledge_templates"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."template_usage"
    ADD CONSTRAINT "template_usage_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "public"."knowledge_templates"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."template_usage"
    ADD CONSTRAINT "template_usage_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."template_versions"
    ADD CONSTRAINT "template_versions_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "public"."knowledge_templates"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_progress"
    ADD CONSTRAINT "user_progress_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_progress"
    ADD CONSTRAINT "user_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_reputation"
    ADD CONSTRAINT "user_reputation_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_stories"
    ADD CONSTRAINT "user_stories_parent_story_id_fkey" FOREIGN KEY ("parent_story_id") REFERENCES "public"."user_stories"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."user_stories"
    ADD CONSTRAINT "user_stories_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."zoo_copy"
    ADD CONSTRAINT "zoo_copy_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."zoo_game_saves"
    ADD CONSTRAINT "zoo_game_saves_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."zoo_game_seats"
    ADD CONSTRAINT "zoo_game_seats_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "public"."zoo_games"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."zoo_game_seats"
    ADD CONSTRAINT "zoo_game_seats_participant_id_fkey" FOREIGN KEY ("participant_id") REFERENCES "public"."zoo_session_participants"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."zoo_games"
    ADD CONSTRAINT "zoo_games_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."zoo_sessions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."zoo_session_participants"
    ADD CONSTRAINT "zoo_session_participants_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."zoo_sessions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."zoo_session_participants"
    ADD CONSTRAINT "zoo_session_participants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."zoo_sessions"
    ADD CONSTRAINT "zoo_sessions_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."zoo_sessions"
    ADD CONSTRAINT "zoo_sessions_host_user_id_fkey" FOREIGN KEY ("host_user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "A host creates a session" ON "public"."zoo_sessions" FOR INSERT WITH CHECK (("host_user_id" = "auth"."uid"()));



CREATE POLICY "Admins can delete any registration" ON "public"."event_registrations" FOR DELETE USING ("public"."is_admin"());



CREATE POLICY "Admins can delete contacts" ON "public"."contacts" FOR DELETE TO "authenticated" USING ("public"."is_admin"());



CREATE POLICY "Admins can delete exams" ON "public"."exams" FOR DELETE USING ("public"."is_admin"());



CREATE POLICY "Admins can delete questions" ON "public"."questions" FOR DELETE USING ("public"."is_admin"());



CREATE POLICY "Admins can insert event categories" ON "public"."event_categories" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = 'admin'::"text")))));



CREATE POLICY "Admins can insert event templates" ON "public"."event_templates" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = 'admin'::"text")))));



CREATE POLICY "Admins can insert event types" ON "public"."event_types" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = 'admin'::"text")))));



CREATE POLICY "Admins can insert event_templates" ON "public"."event_templates" FOR INSERT TO "authenticated" WITH CHECK (("public"."is_admin"() AND ("auth"."uid"() = "created_by")));



CREATE POLICY "Admins can insert exams" ON "public"."exams" FOR INSERT WITH CHECK ("public"."is_admin"());



CREATE POLICY "Admins can insert formats" ON "public"."formats" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = 'admin'::"text")))));



CREATE POLICY "Admins can insert instructors" ON "public"."instructors" FOR INSERT TO "authenticated" WITH CHECK (("public"."is_admin"() AND ("auth"."uid"() = "created_by")));



CREATE POLICY "Admins can insert levels" ON "public"."levels" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = 'admin'::"text")))));



CREATE POLICY "Admins can insert locations" ON "public"."locations" FOR INSERT TO "authenticated" WITH CHECK (("public"."is_admin"() AND ("auth"."uid"() = "created_by")));



CREATE POLICY "Admins can insert logs" ON "public"."admin_logs" FOR INSERT WITH CHECK ("public"."is_admin"());



CREATE POLICY "Admins can insert questions" ON "public"."questions" FOR INSERT WITH CHECK ("public"."is_admin"());



CREATE POLICY "Admins can manage activity domains" ON "public"."activity_domains" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Admins can manage activity focus" ON "public"."activity_focus" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Admins can manage all artifact links" ON "public"."project_artifact_links" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Admins can manage all artifacts" ON "public"."project_artifacts" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Admins can manage all blog posts" ON "public"."blog_posts" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Admins can manage all canvases" ON "public"."canvases" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Admins can manage all comments" ON "public"."knowledge_item_comments" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Admins can manage all content blocks" ON "public"."content_blocks" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Admins can manage all contributed examples" ON "public"."user_contributed_examples" USING ("public"."is_admin"());



CREATE POLICY "Admins can manage all events" ON "public"."events" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = 'admin'::"text"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = 'admin'::"text")))));



CREATE POLICY "Admins can manage all feedback" ON "public"."kb_feedback" USING ("public"."is_admin"());



CREATE POLICY "Admins can manage all imports" ON "public"."data_imports" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Admins can manage all knowledge item media associations" ON "public"."knowledge_items_media" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Admins can manage all knowledge items" ON "public"."knowledge_items" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Admins can manage all media" ON "public"."knowledge_media" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Admins can manage all media assets" ON "public"."media_assets" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Admins can manage all pages" ON "public"."pages" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Admins can manage all references" ON "public"."knowledge_item_references" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Admins can manage all reports" ON "public"."comment_reports" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Admins can manage all reputation" ON "public"."user_reputation" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Admins can manage all staging data" ON "public"."staging_data" USING ("public"."is_admin"());



CREATE POLICY "Admins can manage all steps" ON "public"."knowledge_item_steps" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Admins can manage all story relationships" ON "public"."story_relationships" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Admins can manage all tag associations" ON "public"."knowledge_item_tags" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Admins can manage all technique comments" ON "public"."technique_comments" USING ("public"."is_admin"());



CREATE POLICY "Admins can manage all template assets" ON "public"."template_assets" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Admins can manage all template associations" ON "public"."knowledge_item_templates" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Admins can manage all template versions" ON "public"."template_versions" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Admins can manage all templates" ON "public"."event_templates" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = 'admin'::"text"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = 'admin'::"text")))));



CREATE POLICY "Admins can manage all templates" ON "public"."knowledge_templates" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Admins can manage all templates" ON "public"."page_style_templates" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Admins can manage all use cases" ON "public"."knowledge_use_cases" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Admins can manage authors" ON "public"."authors" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Admins can manage blog categories" ON "public"."blog_categories" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Admins can manage blog post tags" ON "public"."blog_post_tags" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Admins can manage blog tags" ON "public"."blog_tags" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Admins can manage certification_bodies" ON "public"."certification_bodies" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Admins can manage classification config" ON "public"."classification_config" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Admins can manage courses" ON "public"."courses" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Admins can manage knowledge categories" ON "public"."knowledge_categories" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Admins can manage knowledge edges" ON "public"."knowledge_edges" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Admins can manage knowledge item relations" ON "public"."knowledge_item_relations" USING ("public"."is_admin"());



CREATE POLICY "Admins can manage knowledge tags" ON "public"."knowledge_tags" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Admins can manage lessons" ON "public"."lessons" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Admins can manage modules" ON "public"."modules" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Admins can manage planning focuses" ON "public"."planning_focuses" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Admins can manage products" ON "public"."products" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Admins can manage publication authors" ON "public"."publication_authors" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Admins can manage publications" ON "public"."publications" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Admins can manage staging data" ON "public"."staging_data" USING ("public"."has_role"("auth"."uid"(), 'admin'::"public"."app_role")) WITH CHECK ("public"."has_role"("auth"."uid"(), 'admin'::"public"."app_role"));



CREATE POLICY "Admins can manage user roles" ON "public"."user_roles" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Admins can read all attempts" ON "public"."exam_attempts" FOR SELECT USING ("public"."is_admin"());



CREATE POLICY "Admins can read all exams" ON "public"."exams" FOR SELECT USING ("public"."is_admin"());



CREATE POLICY "Admins can read all questions" ON "public"."questions" FOR SELECT USING ("public"."is_admin"());



CREATE POLICY "Admins can update contacts" ON "public"."contacts" FOR UPDATE USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Admins can update exams" ON "public"."exams" FOR UPDATE USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Admins can update questions" ON "public"."questions" FOR UPDATE USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Admins can update site settings" ON "public"."site_settings" FOR UPDATE USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Admins can view all audit logs" ON "public"."admin_audit_log" FOR SELECT USING ("public"."has_role"("auth"."uid"(), 'admin'::"public"."app_role"));



CREATE POLICY "Admins can view all audit logs" ON "public"."ai_generation_audit" FOR SELECT USING ("public"."has_role"("auth"."uid"(), 'admin'::"public"."app_role"));



CREATE POLICY "Admins can view all contacts" ON "public"."contacts" FOR SELECT USING ("public"."is_admin"());



CREATE POLICY "Admins can view all logs" ON "public"."admin_logs" FOR SELECT USING ("public"."is_admin"());



CREATE POLICY "Admins can view all profiles" ON "public"."profiles" FOR SELECT USING ("public"."is_admin"());



CREATE POLICY "Admins can view all reading progress" ON "public"."user_reading_progress" FOR SELECT USING ("public"."is_admin"());



CREATE POLICY "Admins can view all registrations" ON "public"."event_registrations" FOR SELECT TO "authenticated" USING ("public"."is_admin"());



CREATE POLICY "Admins can view all search analytics" ON "public"."search_analytics" FOR SELECT USING ("public"."is_admin"());



CREATE POLICY "Admins can view all template usage" ON "public"."template_usage" FOR SELECT USING ("public"."is_admin"());



CREATE POLICY "Admins can view anonymous usage" ON "public"."anonymous_usage" FOR SELECT USING ("public"."is_admin"());



CREATE POLICY "Admins can view auth logs" ON "public"."auth_logs" FOR SELECT TO "authenticated" USING ("public"."is_admin"());



CREATE POLICY "Admins can view pattern builder feedback" ON "public"."pattern_builder_feedback" FOR SELECT USING ("public"."is_admin"());



CREATE POLICY "Admins can view pattern builder runs" ON "public"."pattern_builder_runs" FOR SELECT USING ("public"."is_admin"());



CREATE POLICY "Admins can view postgres logs" ON "public"."postgres_logs" FOR SELECT TO "authenticated" USING ("public"."is_admin"());



CREATE POLICY "Admins cannot delete audit logs" ON "public"."admin_audit_log" FOR DELETE USING (false);



CREATE POLICY "Admins cannot modify audit logs" ON "public"."admin_audit_log" FOR UPDATE USING (false);



CREATE POLICY "Admins manage backlog_items" ON "public"."backlog_items" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Admins manage epics" ON "public"."epics" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Admins manage features" ON "public"."features" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Admins manage feedback" ON "public"."course_feedback" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Admins manage user_stories" ON "public"."user_stories" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Admins view rate limits" ON "public"."ai_rate_limits" FOR SELECT TO "authenticated" USING ("public"."is_admin"());



CREATE POLICY "Allow insert for authenticated users" ON "public"."profiles" FOR INSERT WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Anyone can submit feedback" ON "public"."kb_feedback" FOR INSERT WITH CHECK (true);



CREATE POLICY "Anyone can view approved examples" ON "public"."user_contributed_examples" FOR SELECT USING (("status" = 'approved'::"text"));



CREATE POLICY "Anyone can view approved technique comments" ON "public"."technique_comments" FOR SELECT USING (("is_approved" = true));



CREATE POLICY "Anyone can view certification_bodies" ON "public"."certification_bodies" FOR SELECT USING (true);



CREATE POLICY "Anyone can view comments" ON "public"."knowledge_item_comments" FOR SELECT USING (true);



CREATE POLICY "Anyone can view courses" ON "public"."courses" FOR SELECT USING (true);



CREATE POLICY "Anyone can view feedback stats" ON "public"."kb_feedback" FOR SELECT USING (true);



CREATE POLICY "Anyone can view knowledge item relations" ON "public"."knowledge_item_relations" FOR SELECT USING (true);



CREATE POLICY "Anyone can view lessons" ON "public"."lessons" FOR SELECT USING (true);



CREATE POLICY "Anyone can view likes" ON "public"."knowledge_item_likes" FOR SELECT USING (true);



CREATE POLICY "Anyone can view modules" ON "public"."modules" FOR SELECT USING (true);



CREATE POLICY "Anyone can view votes" ON "public"."comment_votes" FOR SELECT USING (true);



CREATE POLICY "Authenticated users can add comments" ON "public"."knowledge_item_comments" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Authenticated users can add likes" ON "public"."knowledge_item_likes" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Authenticated users can create story relationships" ON "public"."story_relationships" FOR INSERT WITH CHECK (("auth"."uid"() = "created_by"));



CREATE POLICY "Authenticated users can insert search analytics" ON "public"."search_analytics" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Authenticated users can view products" ON "public"."products" FOR SELECT USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Decision levels are viewable by everyone" ON "public"."decision_levels" FOR SELECT USING (true);



CREATE POLICY "ISA dimensions are viewable by everyone" ON "public"."isa_dimensions" FOR SELECT USING (true);



CREATE POLICY "Junction viewable by everyone" ON "public"."knowledge_item_categories" FOR SELECT USING (true);



CREATE POLICY "Junction viewable by everyone" ON "public"."knowledge_item_decision_levels" FOR SELECT USING (true);



CREATE POLICY "Junction viewable by everyone" ON "public"."knowledge_item_domains" FOR SELECT USING (true);



CREATE POLICY "Junction viewable by everyone" ON "public"."knowledge_item_isa_dimensions" FOR SELECT USING (true);



CREATE POLICY "Knowledge item relationships are viewable by everyone" ON "public"."knowledge_item_relationships" FOR SELECT USING (true);



CREATE POLICY "Members read the games" ON "public"."zoo_games" FOR SELECT USING ("public"."is_zoo_session_member"("session_id"));



CREATE POLICY "Members read the participants" ON "public"."zoo_session_participants" FOR SELECT USING (("public"."is_zoo_session_member"("session_id") OR "public"."is_zoo_session_host"("session_id")));



CREATE POLICY "Members read the seats" ON "public"."zoo_game_seats" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."zoo_games" "g"
  WHERE (("g"."id" = "zoo_game_seats"."game_id") AND "public"."is_zoo_session_member"("g"."session_id")))));



CREATE POLICY "Members read their sessions" ON "public"."zoo_sessions" FOR SELECT USING (("public"."is_zoo_session_member"("id") OR ("host_user_id" = "auth"."uid"())));



CREATE POLICY "Only admins can delete" ON "public"."knowledge_item_categories" FOR DELETE USING ("public"."is_admin"());



CREATE POLICY "Only admins can delete" ON "public"."knowledge_item_decision_levels" FOR DELETE USING ("public"."is_admin"());



CREATE POLICY "Only admins can delete" ON "public"."knowledge_item_domains" FOR DELETE USING ("public"."is_admin"());



CREATE POLICY "Only admins can delete ISA dimension junctions" ON "public"."knowledge_item_isa_dimensions" FOR DELETE USING ("public"."is_admin"());



CREATE POLICY "Only admins can delete ISA dimensions" ON "public"."isa_dimensions" FOR DELETE USING ("public"."is_admin"());



CREATE POLICY "Only admins can delete decision levels" ON "public"."decision_levels" FOR DELETE USING ("public"."is_admin"());



CREATE POLICY "Only admins can delete knowledge item relationships" ON "public"."knowledge_item_relationships" FOR DELETE USING ("public"."is_admin"());



CREATE POLICY "Only admins can insert" ON "public"."knowledge_item_categories" FOR INSERT WITH CHECK ("public"."is_admin"());



CREATE POLICY "Only admins can insert" ON "public"."knowledge_item_decision_levels" FOR INSERT WITH CHECK ("public"."is_admin"());



CREATE POLICY "Only admins can insert" ON "public"."knowledge_item_domains" FOR INSERT WITH CHECK ("public"."is_admin"());



CREATE POLICY "Only admins can insert ISA dimension junctions" ON "public"."knowledge_item_isa_dimensions" FOR INSERT WITH CHECK ("public"."is_admin"());



CREATE POLICY "Only admins can insert ISA dimensions" ON "public"."isa_dimensions" FOR INSERT WITH CHECK ("public"."is_admin"());



CREATE POLICY "Only admins can insert audit logs" ON "public"."admin_audit_log" FOR INSERT WITH CHECK ("public"."is_admin"());



CREATE POLICY "Only admins can insert decision levels" ON "public"."decision_levels" FOR INSERT WITH CHECK ("public"."is_admin"());



CREATE POLICY "Only admins can insert instructors" ON "public"."instructors" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text")))));



CREATE POLICY "Only admins can insert knowledge item relationships" ON "public"."knowledge_item_relationships" FOR INSERT WITH CHECK ("public"."is_admin"());



CREATE POLICY "Only admins can update ISA dimension junctions" ON "public"."knowledge_item_isa_dimensions" FOR UPDATE USING ("public"."is_admin"());



CREATE POLICY "Only admins can update ISA dimensions" ON "public"."isa_dimensions" FOR UPDATE USING ("public"."is_admin"());



CREATE POLICY "Only admins can update decision levels" ON "public"."decision_levels" FOR UPDATE USING ("public"."is_admin"());



CREATE POLICY "Only admins can update knowledge item relationships" ON "public"."knowledge_item_relationships" FOR UPDATE USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Only service role can update registrations" ON "public"."event_registrations" FOR UPDATE TO "service_role" USING (true);



CREATE POLICY "Only system can insert site settings" ON "public"."site_settings" FOR INSERT WITH CHECK (false);



CREATE POLICY "Owners manage backlog_items" ON "public"."backlog_items" TO "authenticated" USING ((("created_by" = "auth"."uid"()) OR (("project_id" IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM "public"."projects" "p"
  WHERE (("p"."id" = "backlog_items"."project_id") AND ("p"."created_by" = "auth"."uid"()))))) OR (("product_id" IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM "public"."products" "pr"
  WHERE (("pr"."id" = "backlog_items"."product_id") AND ("pr"."created_by" = "auth"."uid"()))))))) WITH CHECK ((("created_by" = "auth"."uid"()) OR (("project_id" IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM "public"."projects" "p"
  WHERE (("p"."id" = "backlog_items"."project_id") AND ("p"."created_by" = "auth"."uid"()))))) OR (("product_id" IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM "public"."products" "pr"
  WHERE (("pr"."id" = "backlog_items"."product_id") AND ("pr"."created_by" = "auth"."uid"())))))));



CREATE POLICY "Owners manage epics" ON "public"."epics" TO "authenticated" USING ((("created_by" = "auth"."uid"()) OR (("project_id" IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM "public"."projects" "p"
  WHERE (("p"."id" = "epics"."project_id") AND ("p"."created_by" = "auth"."uid"()))))))) WITH CHECK ((("created_by" = "auth"."uid"()) OR (("project_id" IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM "public"."projects" "p"
  WHERE (("p"."id" = "epics"."project_id") AND ("p"."created_by" = "auth"."uid"())))))));



CREATE POLICY "Owners manage features" ON "public"."features" TO "authenticated" USING ((("created_by" = "auth"."uid"()) OR (("project_id" IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM "public"."projects" "p"
  WHERE (("p"."id" = "features"."project_id") AND ("p"."created_by" = "auth"."uid"()))))))) WITH CHECK ((("created_by" = "auth"."uid"()) OR (("project_id" IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM "public"."projects" "p"
  WHERE (("p"."id" = "features"."project_id") AND ("p"."created_by" = "auth"."uid"())))))));



CREATE POLICY "Owners manage user_stories" ON "public"."user_stories" TO "authenticated" USING ((("created_by" = "auth"."uid"()) OR (("project_id" IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM "public"."projects" "p"
  WHERE (("p"."id" = "user_stories"."project_id") AND ("p"."created_by" = "auth"."uid"()))))))) WITH CHECK ((("created_by" = "auth"."uid"()) OR (("project_id" IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM "public"."projects" "p"
  WHERE (("p"."id" = "user_stories"."project_id") AND ("p"."created_by" = "auth"."uid"())))))));



CREATE POLICY "Players lay out the seats when a game starts" ON "public"."zoo_game_seats" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."zoo_games" "g"
  WHERE (("g"."id" = "zoo_game_seats"."game_id") AND "public"."can_play_zoo_session"("g"."session_id")))));



CREATE POLICY "Players start a game" ON "public"."zoo_games" FOR INSERT WITH CHECK ("public"."can_play_zoo_session"("session_id"));



CREATE POLICY "Players take and leave their own seat" ON "public"."zoo_game_seats" FOR UPDATE USING ("public"."zoo_seat_is_writable"("game_id", "participant_id")) WITH CHECK ("public"."zoo_seat_is_writable"("game_id", "participant_id"));



CREATE POLICY "Players write the game" ON "public"."zoo_games" FOR UPDATE USING ("public"."can_play_zoo_session"("session_id")) WITH CHECK ("public"."can_play_zoo_session"("session_id"));



CREATE POLICY "Prevent deletion of site settings" ON "public"."site_settings" FOR DELETE USING (false);



CREATE POLICY "Public can submit contact forms" ON "public"."contacts" FOR INSERT WITH CHECK (true);



CREATE POLICY "Public can view activity domains" ON "public"."activity_domains" FOR SELECT USING (true);



CREATE POLICY "Public can view activity focus" ON "public"."activity_focus" FOR SELECT USING (true);



CREATE POLICY "Public can view all templates" ON "public"."event_templates" FOR SELECT USING (true);



CREATE POLICY "Public can view approved feedback" ON "public"."course_feedback" FOR SELECT USING (("is_approved" = true));



CREATE POLICY "Public can view assets for public templates" ON "public"."template_assets" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."knowledge_templates" "kt"
  WHERE (("kt"."id" = "template_assets"."template_id") AND ("kt"."is_public" = true)))));



CREATE POLICY "Public can view authors" ON "public"."authors" FOR SELECT USING (true);



CREATE POLICY "Public can view blocks of published pages" ON "public"."content_blocks" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."pages" "p"
  WHERE (("p"."id" = "content_blocks"."page_id") AND ("p"."is_published" = true)))));



CREATE POLICY "Public can view blog categories" ON "public"."blog_categories" FOR SELECT USING (true);



CREATE POLICY "Public can view blog post tags" ON "public"."blog_post_tags" FOR SELECT USING (true);



CREATE POLICY "Public can view blog tags" ON "public"."blog_tags" FOR SELECT USING (true);



CREATE POLICY "Public can view builtin templates" ON "public"."page_style_templates" FOR SELECT TO "authenticated" USING (("is_builtin" = true));



CREATE POLICY "Public can view classification config" ON "public"."classification_config" FOR SELECT USING (true);



CREATE POLICY "Public can view knowledge categories" ON "public"."knowledge_categories" FOR SELECT USING (true);



CREATE POLICY "Public can view knowledge edges" ON "public"."knowledge_edges" FOR SELECT USING (true);



CREATE POLICY "Public can view knowledge tags" ON "public"."knowledge_tags" FOR SELECT USING (true);



CREATE POLICY "Public can view media associations for published items" ON "public"."knowledge_items_media" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."knowledge_items" "ki"
  WHERE (("ki"."id" = "knowledge_items_media"."knowledge_item_id") AND ("ki"."is_published" = true)))));



CREATE POLICY "Public can view media for published items" ON "public"."knowledge_media" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."knowledge_items" "ki"
  WHERE (("ki"."id" = "knowledge_media"."knowledge_item_id") AND ("ki"."is_published" = true)))));



CREATE POLICY "Public can view planning focuses" ON "public"."planning_focuses" FOR SELECT USING (true);



CREATE POLICY "Public can view public templates" ON "public"."knowledge_templates" FOR SELECT USING (("is_public" = true));



CREATE POLICY "Public can view publication authors" ON "public"."publication_authors" FOR SELECT USING (true);



CREATE POLICY "Public can view publications" ON "public"."publications" FOR SELECT USING (true);



CREATE POLICY "Public can view published blog posts" ON "public"."blog_posts" FOR SELECT USING (("is_published" = true));



CREATE POLICY "Public can view published events" ON "public"."events" FOR SELECT USING (("is_published" = true));



CREATE POLICY "Public can view published knowledge items" ON "public"."knowledge_items" FOR SELECT USING (("is_published" = true));



CREATE POLICY "Public can view published pages" ON "public"."pages" FOR SELECT USING (("is_published" = true));



CREATE POLICY "Public can view references for published items" ON "public"."knowledge_item_references" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."knowledge_items" "ki"
  WHERE (("ki"."id" = "knowledge_item_references"."knowledge_item_id") AND ("ki"."is_published" = true)))));



CREATE POLICY "Public can view site settings" ON "public"."site_settings" FOR SELECT USING (true);



CREATE POLICY "Public can view steps for published items" ON "public"."knowledge_item_steps" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."knowledge_items" "ki"
  WHERE (("ki"."id" = "knowledge_item_steps"."knowledge_item_id") AND ("ki"."is_published" = true)))));



CREATE POLICY "Public can view tag associations for published items" ON "public"."knowledge_item_tags" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."knowledge_items" "ki"
  WHERE (("ki"."id" = "knowledge_item_tags"."knowledge_item_id") AND ("ki"."is_published" = true)))));



CREATE POLICY "Public can view template associations for published items" ON "public"."knowledge_item_templates" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."knowledge_items" "ki"
  WHERE (("ki"."id" = "knowledge_item_templates"."knowledge_item_id") AND ("ki"."is_published" = true)))));



CREATE POLICY "Public can view use cases for published items" ON "public"."knowledge_use_cases" FOR SELECT TO "authenticated", "anon" USING ((EXISTS ( SELECT 1
   FROM "public"."knowledge_items" "ki"
  WHERE (("ki"."id" = "knowledge_use_cases"."knowledge_item_id") AND ("ki"."is_published" = true)))));



CREATE POLICY "Published exams are publicly readable" ON "public"."exams" FOR SELECT USING (("status" = 'published'::"text"));



CREATE POLICY "Published questions are publicly readable" ON "public"."questions" FOR SELECT USING ((("status" = 'published'::"text") AND (EXISTS ( SELECT 1
   FROM "public"."exams"
  WHERE (("exams"."id" = "questions"."exam_id") AND ("exams"."status" = 'published'::"text"))))));



CREATE POLICY "Service role can insert anonymous usage" ON "public"."anonymous_usage" FOR INSERT TO "service_role" WITH CHECK (true);



CREATE POLICY "Service role can insert audit logs" ON "public"."ai_generation_audit" FOR INSERT WITH CHECK (true);



CREATE POLICY "Service role can update payment status" ON "public"."event_registrations" FOR UPDATE USING (true) WITH CHECK (true);



CREATE POLICY "Service role can update registrations" ON "public"."event_registrations" FOR UPDATE TO "service_role" USING (true);



CREATE POLICY "The host deletes the session" ON "public"."zoo_sessions" FOR DELETE USING (("host_user_id" = "auth"."uid"()));



CREATE POLICY "The host joins their own session" ON "public"."zoo_session_participants" FOR INSERT WITH CHECK ((("user_id" = "auth"."uid"()) AND "public"."is_zoo_session_host"("session_id")));



CREATE POLICY "The host manages participants" ON "public"."zoo_session_participants" FOR UPDATE USING ("public"."is_zoo_session_host"("session_id"));



CREATE POLICY "The host updates the session" ON "public"."zoo_sessions" FOR UPDATE USING (("host_user_id" = "auth"."uid"())) WITH CHECK (("host_user_id" = "auth"."uid"()));



CREATE POLICY "Users can create artifact links in their projects" ON "public"."project_artifact_links" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."projects" "p"
  WHERE (("p"."id" = "project_artifact_links"."project_id") AND ("p"."created_by" = "auth"."uid"())))));



CREATE POLICY "Users can create artifacts in their projects" ON "public"."project_artifacts" FOR INSERT TO "authenticated" WITH CHECK ((("auth"."uid"() = "created_by") AND (EXISTS ( SELECT 1
   FROM "public"."projects" "p"
  WHERE (("p"."id" = "project_artifacts"."project_id") AND ("p"."created_by" = "auth"."uid"()))))));



CREATE POLICY "Users can create canvases" ON "public"."canvases" FOR INSERT WITH CHECK ((("auth"."uid"() = "created_by") AND ((("user_id" IS NOT NULL) AND ("auth"."uid"() = "user_id")) OR (("project_id" IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM "public"."projects" "p"
  WHERE (("p"."id" = "canvases"."project_id") AND ("p"."created_by" = "auth"."uid"()))))))));



CREATE POLICY "Users can create products" ON "public"."products" FOR INSERT WITH CHECK (("auth"."uid"() = "created_by"));



CREATE POLICY "Users can create technique comments" ON "public"."technique_comments" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can create template usage records" ON "public"."template_usage" FOR INSERT WITH CHECK (true);



CREATE POLICY "Users can create their own imports" ON "public"."data_imports" FOR INSERT WITH CHECK (("auth"."uid"() = "created_by"));



CREATE POLICY "Users can create their own media assets" ON "public"."media_assets" FOR INSERT WITH CHECK (("auth"."uid"() = "created_by"));



CREATE POLICY "Users can create their own projects" ON "public"."projects" FOR INSERT WITH CHECK (("auth"."uid"() = "created_by"));



CREATE POLICY "Users can create their own templates" ON "public"."knowledge_templates" FOR INSERT WITH CHECK (("auth"."uid"() = "created_by"));



CREATE POLICY "Users can delete own profile" ON "public"."profiles" FOR DELETE USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can delete own progress" ON "public"."user_progress" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete own registrations" ON "public"."event_registrations" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their canvases" ON "public"."canvases" FOR DELETE USING (((("user_id" IS NOT NULL) AND ("auth"."uid"() = "user_id")) OR (("project_id" IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM "public"."projects" "p"
  WHERE (("p"."id" = "canvases"."project_id") AND ("p"."created_by" = "auth"."uid"())))))));



CREATE POLICY "Users can delete their own comments" ON "public"."knowledge_item_comments" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own likes" ON "public"."knowledge_item_likes" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own projects" ON "public"."projects" FOR DELETE USING (("auth"."uid"() = "created_by"));



CREATE POLICY "Users can delete their project artifact links" ON "public"."project_artifact_links" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."projects" "p"
  WHERE (("p"."id" = "project_artifact_links"."project_id") AND ("p"."created_by" = "auth"."uid"())))));



CREATE POLICY "Users can delete their project artifacts" ON "public"."project_artifacts" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."projects" "p"
  WHERE (("p"."id" = "project_artifacts"."project_id") AND ("p"."created_by" = "auth"."uid"())))));



CREATE POLICY "Users can edit own technique comments" ON "public"."technique_comments" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own attempts" ON "public"."exam_attempts" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own progress" ON "public"."user_progress" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own registrations" ON "public"."event_registrations" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage assets for their templates" ON "public"."template_assets" USING ((EXISTS ( SELECT 1
   FROM "public"."knowledge_templates" "kt"
  WHERE (("kt"."id" = "template_assets"."template_id") AND (("kt"."created_by" = "auth"."uid"()) OR "public"."is_admin"()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."knowledge_templates" "kt"
  WHERE (("kt"."id" = "template_assets"."template_id") AND (("kt"."created_by" = "auth"."uid"()) OR "public"."is_admin"())))));



CREATE POLICY "Users can manage own bookmarks" ON "public"."user_bookmarks" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage own learning path progress" ON "public"."user_learning_path_progress" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage own preferences" ON "public"."user_preferences" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage own profile" ON "public"."profiles" USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can manage own reading progress" ON "public"."user_reading_progress" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage own votes" ON "public"."comment_votes" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage use cases for items they can edit" ON "public"."knowledge_use_cases" TO "authenticated" USING (("public"."is_admin"() OR (EXISTS ( SELECT 1
   FROM "public"."knowledge_items" "ki"
  WHERE (("ki"."id" = "knowledge_use_cases"."knowledge_item_id") AND (("ki"."created_by" = "auth"."uid"()) OR "public"."is_admin"())))))) WITH CHECK (("public"."is_admin"() OR (EXISTS ( SELECT 1
   FROM "public"."knowledge_items" "ki"
  WHERE (("ki"."id" = "knowledge_use_cases"."knowledge_item_id") AND (("ki"."created_by" = "auth"."uid"()) OR "public"."is_admin"()))))));



CREATE POLICY "Users can manage versions for their templates" ON "public"."template_versions" USING ((EXISTS ( SELECT 1
   FROM "public"."knowledge_templates" "kt"
  WHERE (("kt"."id" = "template_versions"."template_id") AND (("kt"."created_by" = "auth"."uid"()) OR "public"."is_admin"()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."knowledge_templates" "kt"
  WHERE (("kt"."id" = "template_versions"."template_id") AND (("kt"."created_by" = "auth"."uid"()) OR "public"."is_admin"())))));



CREATE POLICY "Users can read own attempts" ON "public"."exam_attempts" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can register themselves" ON "public"."event_registrations" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can report comments" ON "public"."comment_reports" FOR INSERT WITH CHECK (("auth"."uid"() = "reported_by"));



CREATE POLICY "Users can select own profile" ON "public"."profiles" FOR SELECT USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can submit examples" ON "public"."user_contributed_examples" FOR INSERT WITH CHECK (("auth"."uid"() = "submitted_by"));



CREATE POLICY "Users can update own attempts" ON "public"."exam_attempts" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own profile" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id")) WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users can update registration details only" ON "public"."event_registrations" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK ((("auth"."uid"() = "user_id") AND ("payment_status" = ( SELECT "event_registrations_1"."payment_status"
   FROM "public"."event_registrations" "event_registrations_1"
  WHERE ("event_registrations_1"."id" = "event_registrations_1"."id")))));



CREATE POLICY "Users can update their canvases" ON "public"."canvases" FOR UPDATE USING (((("user_id" IS NOT NULL) AND ("auth"."uid"() = "user_id")) OR (("project_id" IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM "public"."projects" "p"
  WHERE (("p"."id" = "canvases"."project_id") AND ("p"."created_by" = "auth"."uid"())))))));



CREATE POLICY "Users can update their own comments" ON "public"."knowledge_item_comments" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own media assets" ON "public"."media_assets" FOR UPDATE USING ((("auth"."uid"() = "created_by") OR "public"."is_admin"())) WITH CHECK ((("auth"."uid"() = "created_by") OR "public"."is_admin"()));



CREATE POLICY "Users can update their own projects" ON "public"."projects" FOR UPDATE USING (("auth"."uid"() = "created_by")) WITH CHECK (("auth"."uid"() = "created_by"));



CREATE POLICY "Users can update their own templates" ON "public"."knowledge_templates" FOR UPDATE USING ((("auth"."uid"() = "created_by") OR "public"."is_admin"())) WITH CHECK ((("auth"."uid"() = "created_by") OR "public"."is_admin"()));



CREATE POLICY "Users can update their project artifacts" ON "public"."project_artifacts" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."projects" "p"
  WHERE (("p"."id" = "project_artifacts"."project_id") AND ("p"."created_by" = "auth"."uid"()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."projects" "p"
  WHERE (("p"."id" = "project_artifacts"."project_id") AND ("p"."created_by" = "auth"."uid"())))));



CREATE POLICY "Users can view all event categories" ON "public"."event_categories" FOR SELECT USING (true);



CREATE POLICY "Users can view all event types" ON "public"."event_types" FOR SELECT USING (true);



CREATE POLICY "Users can view all formats" ON "public"."formats" FOR SELECT USING (true);



CREATE POLICY "Users can view all instructors" ON "public"."instructors" FOR SELECT USING (true);



CREATE POLICY "Users can view all levels" ON "public"."levels" FOR SELECT USING (true);



CREATE POLICY "Users can view all locations" ON "public"."locations" FOR SELECT USING (true);



CREATE POLICY "Users can view media assets" ON "public"."media_assets" FOR SELECT USING (true);



CREATE POLICY "Users can view own audit logs" ON "public"."ai_generation_audit" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own progress" ON "public"."user_progress" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own registrations" ON "public"."event_registrations" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own reports" ON "public"."comment_reports" FOR SELECT USING (("auth"."uid"() = "reported_by"));



CREATE POLICY "Users can view own reputation" ON "public"."user_reputation" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own roles" ON "public"."user_roles" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own submissions" ON "public"."user_contributed_examples" FOR SELECT USING (("auth"."uid"() = "submitted_by"));



CREATE POLICY "Users can view story relationships" ON "public"."story_relationships" FOR SELECT USING (true);



CREATE POLICY "Users can view their canvases" ON "public"."canvases" FOR SELECT USING (((("user_id" IS NOT NULL) AND ("auth"."uid"() = "user_id")) OR (("project_id" IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM "public"."projects" "p"
  WHERE (("p"."id" = "canvases"."project_id") AND ("p"."created_by" = "auth"."uid"())))))));



CREATE POLICY "Users can view their own imports" ON "public"."data_imports" FOR SELECT USING (("auth"."uid"() = "created_by"));



CREATE POLICY "Users can view their own projects" ON "public"."projects" FOR SELECT USING (("auth"."uid"() = "created_by"));



CREATE POLICY "Users can view their own template usage" ON "public"."template_usage" FOR SELECT USING ((("auth"."uid"() = "user_id") OR ("user_id" IS NULL)));



CREATE POLICY "Users can view their project artifact links" ON "public"."project_artifact_links" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."projects" "p"
  WHERE (("p"."id" = "project_artifact_links"."project_id") AND ("p"."created_by" = "auth"."uid"())))));



CREATE POLICY "Users can view their project artifacts" ON "public"."project_artifacts" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."projects" "p"
  WHERE (("p"."id" = "project_artifacts"."project_id") AND ("p"."created_by" = "auth"."uid"())))));



CREATE POLICY "Users can view their staging data" ON "public"."staging_data" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."data_imports" "di"
  WHERE (("di"."id" = "staging_data"."import_id") AND ("di"."created_by" = "auth"."uid"())))));



CREATE POLICY "Users manage their own flow game saves" ON "public"."flow_game_saves" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Users manage their own zoo game saves" ON "public"."zoo_game_saves" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Users submit own feedback" ON "public"."course_feedback" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "created_by"));



CREATE POLICY "You can leave" ON "public"."zoo_session_participants" FOR DELETE USING (("user_id" = "auth"."uid"()));



CREATE POLICY "You update your own participation" ON "public"."zoo_session_participants" FOR UPDATE USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."activity_domains" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."activity_focus" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "admin manage availability" ON "public"."booking_availability" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "admin manage booking types" ON "public"."booking_types" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "admin manage bookings" ON "public"."bookings" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "admin manage categories" ON "public"."event_categories" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "admin manage formats" ON "public"."formats" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "admin manage instructors" ON "public"."instructors" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "admin manage levels" ON "public"."levels" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "admin manage locations" ON "public"."locations" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "admin manage overrides" ON "public"."booking_overrides" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "admin manage types" ON "public"."event_types" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



ALTER TABLE "public"."admin_audit_log" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."admin_logs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "admins write site copy" ON "public"."site_copy" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



ALTER TABLE "public"."ai_generation_audit" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ai_rate_limits" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."anonymous_usage" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."auth_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."authors" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."backlog_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."blog_categories" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."blog_post_tags" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."blog_posts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."blog_tags" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."booking_attempts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."booking_availability" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."booking_overrides" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."booking_types" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."bookings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."canvases" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."certification_bodies" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."classification_config" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."comment_reports" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."comment_votes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."contacts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."content_blocks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."course_feedback" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."courses" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."data_imports" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."decision_levels" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "delete own profile" ON "public"."profiles" FOR DELETE USING (("auth"."uid"() = "id"));



ALTER TABLE "public"."epics" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."event_categories" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."event_registrations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."event_templates" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."event_types" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."exam_attempts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."exams" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."features" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."flow_game_saves" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."formats" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "guest reads own bookings" ON "public"."bookings" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "insert authenticated profile" ON "public"."profiles" FOR INSERT WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "insert own registration" ON "public"."event_registrations" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."instructors" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."isa_dimensions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."kb_feedback" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."knowledge_categories" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."knowledge_edges" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."knowledge_item_categories" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."knowledge_item_comments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."knowledge_item_decision_levels" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."knowledge_item_domains" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."knowledge_item_isa_dimensions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."knowledge_item_likes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."knowledge_item_references" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."knowledge_item_relations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."knowledge_item_relationships" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."knowledge_item_steps" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."knowledge_item_tags" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."knowledge_item_templates" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."knowledge_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."knowledge_items_media" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."knowledge_media" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."knowledge_tags" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."knowledge_templates" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."knowledge_use_cases" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."lessons" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."levels" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."locations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."media_assets" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."modules" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."page_style_templates" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."pages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."pattern_builder_feedback" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."pattern_builder_runs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."planning_focuses" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."postgres_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."products" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."project_artifact_links" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."project_artifacts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."projects" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "public read active booking types" ON "public"."booking_types" FOR SELECT USING ("active");



ALTER TABLE "public"."publication_authors" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."publications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."questions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."search_analytics" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "select own profile" ON "public"."profiles" FOR SELECT USING (("auth"."uid"() = "id"));



CREATE POLICY "select own registration" ON "public"."event_registrations" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "service updates" ON "public"."event_registrations" FOR UPDATE TO "service_role" USING (true);



CREATE POLICY "site copy is readable by anyone" ON "public"."site_copy" FOR SELECT USING (true);



ALTER TABLE "public"."site_copy" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."site_settings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."staging_data" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."story_relationships" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."technique_comments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."template_assets" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."template_usage" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."template_versions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "update own profile" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id")) WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "update own registration" ON "public"."event_registrations" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."user_bookmarks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_contributed_examples" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_learning_path_progress" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_preferences" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_progress" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_reading_progress" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_reputation" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_roles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_stories" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "view categories" ON "public"."event_categories" FOR SELECT USING (true);



CREATE POLICY "view event types" ON "public"."event_types" FOR SELECT USING (true);



CREATE POLICY "view formats" ON "public"."formats" FOR SELECT USING (true);



CREATE POLICY "view instructors" ON "public"."instructors" FOR SELECT USING (true);



CREATE POLICY "view levels" ON "public"."levels" FOR SELECT USING (true);



CREATE POLICY "view locations" ON "public"."locations" FOR SELECT USING (true);



ALTER TABLE "public"."zoo_copy" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "zoo_copy readable by everyone" ON "public"."zoo_copy" FOR SELECT USING (true);



CREATE POLICY "zoo_copy writable by admins" ON "public"."zoo_copy" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



ALTER TABLE "public"."zoo_game_saves" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."zoo_game_seats" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."zoo_games" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."zoo_session_participants" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."zoo_sessions" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";






















































































































































GRANT ALL ON FUNCTION "public"."can_play_zoo_session"("_session_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."can_play_zoo_session"("_session_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."can_play_zoo_session"("_session_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."check_ai_rate_limit"("p_user_id" "uuid", "p_endpoint" "text", "p_max_requests" integer, "p_window_minutes" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."check_ai_rate_limit"("p_user_id" "uuid", "p_endpoint" "text", "p_max_requests" integer, "p_window_minutes" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_ai_rate_limit"("p_user_id" "uuid", "p_endpoint" "text", "p_max_requests" integer, "p_window_minutes" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."check_anonymous_ai_rate_limit"("p_ip_address" "text", "p_endpoint" "text", "p_max_requests" integer, "p_window_hours" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."check_anonymous_ai_rate_limit"("p_ip_address" "text", "p_endpoint" "text", "p_max_requests" integer, "p_window_hours" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_anonymous_ai_rate_limit"("p_ip_address" "text", "p_endpoint" "text", "p_max_requests" integer, "p_window_hours" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."check_comment_rate_limit"() TO "anon";
GRANT ALL ON FUNCTION "public"."check_comment_rate_limit"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_comment_rate_limit"() TO "service_role";



GRANT ALL ON FUNCTION "public"."check_contact_rate_limit"() TO "anon";
GRANT ALL ON FUNCTION "public"."check_contact_rate_limit"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_contact_rate_limit"() TO "service_role";



GRANT ALL ON FUNCTION "public"."check_duplicate_comment"() TO "anon";
GRANT ALL ON FUNCTION "public"."check_duplicate_comment"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_duplicate_comment"() TO "service_role";



GRANT ALL ON FUNCTION "public"."cleanup_old_anonymous_usage"() TO "anon";
GRANT ALL ON FUNCTION "public"."cleanup_old_anonymous_usage"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."cleanup_old_anonymous_usage"() TO "service_role";



GRANT ALL ON FUNCTION "public"."create_knowledge_slug"("input_text" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."create_knowledge_slug"("input_text" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_knowledge_slug"("input_text" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_next_template_version"("template_title" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_next_template_version"("template_title" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_next_template_version"("template_title" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_popular_searches"("p_limit" integer, "p_days" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_popular_searches"("p_limit" integer, "p_days" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_popular_searches"("p_limit" integer, "p_days" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."has_role"("_user_id" "uuid", "_role" "public"."app_role") TO "anon";
GRANT ALL ON FUNCTION "public"."has_role"("_user_id" "uuid", "_role" "public"."app_role") TO "authenticated";
GRANT ALL ON FUNCTION "public"."has_role"("_user_id" "uuid", "_role" "public"."app_role") TO "service_role";



GRANT ALL ON FUNCTION "public"."increment_blog_view_count"("post_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."increment_blog_view_count"("post_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment_blog_view_count"("post_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."increment_knowledge_item_view_count"("item_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."increment_knowledge_item_view_count"("item_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment_knowledge_item_view_count"("item_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."increment_template_usage_count"("asset_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."increment_template_usage_count"("asset_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment_template_usage_count"("asset_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_zoo_session_host"("_session_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_zoo_session_host"("_session_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_zoo_session_host"("_session_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_zoo_session_member"("_session_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_zoo_session_member"("_session_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_zoo_session_member"("_session_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."join_zoo_session"("_join_code" "text", "_display_name" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."join_zoo_session"("_join_code" "text", "_display_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."join_zoo_session"("_join_code" "text", "_display_name" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."log_admin_modification"() TO "anon";
GRANT ALL ON FUNCTION "public"."log_admin_modification"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_admin_modification"() TO "service_role";



GRANT ALL ON FUNCTION "public"."log_admin_profile_view"() TO "anon";
GRANT ALL ON FUNCTION "public"."log_admin_profile_view"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_admin_profile_view"() TO "service_role";



GRANT ALL ON FUNCTION "public"."prevent_profile_role_change"() TO "anon";
GRANT ALL ON FUNCTION "public"."prevent_profile_role_change"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."prevent_profile_role_change"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."prune_booking_attempts"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."prune_booking_attempts"() TO "anon";
GRANT ALL ON FUNCTION "public"."prune_booking_attempts"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."prune_booking_attempts"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_blog_tag_usage_count"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_blog_tag_usage_count"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_blog_tag_usage_count"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_canvases_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_canvases_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_canvases_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_import_statistics"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_import_statistics"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_import_statistics"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_tag_usage_count"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_tag_usage_count"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_tag_usage_count"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_user_reputation_on_comment"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_user_reputation_on_comment"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_user_reputation_on_comment"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_user_reputation_on_report"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_user_reputation_on_report"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_user_reputation_on_report"() TO "service_role";



GRANT ALL ON FUNCTION "public"."zoo_guard_participant_update"() TO "anon";
GRANT ALL ON FUNCTION "public"."zoo_guard_participant_update"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."zoo_guard_participant_update"() TO "service_role";



GRANT ALL ON FUNCTION "public"."zoo_seat_is_writable"("_game_id" "uuid", "_participant_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."zoo_seat_is_writable"("_game_id" "uuid", "_participant_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."zoo_seat_is_writable"("_game_id" "uuid", "_participant_id" "uuid") TO "service_role";


















GRANT ALL ON TABLE "public"."activity_domains" TO "anon";
GRANT ALL ON TABLE "public"."activity_domains" TO "authenticated";
GRANT ALL ON TABLE "public"."activity_domains" TO "service_role";



GRANT ALL ON TABLE "public"."activity_focus" TO "anon";
GRANT ALL ON TABLE "public"."activity_focus" TO "authenticated";
GRANT ALL ON TABLE "public"."activity_focus" TO "service_role";



GRANT ALL ON TABLE "public"."admin_audit_log" TO "anon";
GRANT ALL ON TABLE "public"."admin_audit_log" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_audit_log" TO "service_role";



GRANT ALL ON TABLE "public"."admin_logs" TO "anon";
GRANT ALL ON TABLE "public"."admin_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_logs" TO "service_role";



GRANT ALL ON TABLE "public"."ai_generation_audit" TO "anon";
GRANT ALL ON TABLE "public"."ai_generation_audit" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_generation_audit" TO "service_role";



GRANT ALL ON TABLE "public"."ai_rate_limits" TO "anon";
GRANT ALL ON TABLE "public"."ai_rate_limits" TO "authenticated";
GRANT ALL ON TABLE "public"."ai_rate_limits" TO "service_role";



GRANT ALL ON TABLE "public"."anonymous_usage" TO "anon";
GRANT ALL ON TABLE "public"."anonymous_usage" TO "authenticated";
GRANT ALL ON TABLE "public"."anonymous_usage" TO "service_role";



GRANT ALL ON TABLE "public"."auth_logs" TO "anon";
GRANT ALL ON TABLE "public"."auth_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."auth_logs" TO "service_role";



GRANT ALL ON TABLE "public"."authors" TO "anon";
GRANT ALL ON TABLE "public"."authors" TO "authenticated";
GRANT ALL ON TABLE "public"."authors" TO "service_role";



GRANT ALL ON TABLE "public"."backlog_items" TO "anon";
GRANT ALL ON TABLE "public"."backlog_items" TO "authenticated";
GRANT ALL ON TABLE "public"."backlog_items" TO "service_role";



GRANT ALL ON TABLE "public"."blog_categories" TO "anon";
GRANT ALL ON TABLE "public"."blog_categories" TO "authenticated";
GRANT ALL ON TABLE "public"."blog_categories" TO "service_role";



GRANT ALL ON TABLE "public"."blog_post_tags" TO "anon";
GRANT ALL ON TABLE "public"."blog_post_tags" TO "authenticated";
GRANT ALL ON TABLE "public"."blog_post_tags" TO "service_role";



GRANT ALL ON TABLE "public"."blog_posts" TO "anon";
GRANT ALL ON TABLE "public"."blog_posts" TO "authenticated";
GRANT ALL ON TABLE "public"."blog_posts" TO "service_role";



GRANT ALL ON TABLE "public"."blog_tags" TO "anon";
GRANT ALL ON TABLE "public"."blog_tags" TO "authenticated";
GRANT ALL ON TABLE "public"."blog_tags" TO "service_role";



GRANT ALL ON TABLE "public"."booking_attempts" TO "anon";
GRANT ALL ON TABLE "public"."booking_attempts" TO "authenticated";
GRANT ALL ON TABLE "public"."booking_attempts" TO "service_role";



GRANT ALL ON TABLE "public"."booking_availability" TO "anon";
GRANT ALL ON TABLE "public"."booking_availability" TO "authenticated";
GRANT ALL ON TABLE "public"."booking_availability" TO "service_role";



GRANT ALL ON TABLE "public"."booking_overrides" TO "anon";
GRANT ALL ON TABLE "public"."booking_overrides" TO "authenticated";
GRANT ALL ON TABLE "public"."booking_overrides" TO "service_role";



GRANT ALL ON TABLE "public"."booking_types" TO "anon";
GRANT ALL ON TABLE "public"."booking_types" TO "authenticated";
GRANT ALL ON TABLE "public"."booking_types" TO "service_role";



GRANT ALL ON TABLE "public"."bookings" TO "anon";
GRANT ALL ON TABLE "public"."bookings" TO "authenticated";
GRANT ALL ON TABLE "public"."bookings" TO "service_role";



GRANT ALL ON TABLE "public"."canvases" TO "anon";
GRANT ALL ON TABLE "public"."canvases" TO "authenticated";
GRANT ALL ON TABLE "public"."canvases" TO "service_role";



GRANT ALL ON TABLE "public"."certification_bodies" TO "anon";
GRANT ALL ON TABLE "public"."certification_bodies" TO "authenticated";
GRANT ALL ON TABLE "public"."certification_bodies" TO "service_role";



GRANT ALL ON TABLE "public"."classification_config" TO "anon";
GRANT ALL ON TABLE "public"."classification_config" TO "authenticated";
GRANT ALL ON TABLE "public"."classification_config" TO "service_role";



GRANT ALL ON TABLE "public"."comment_reports" TO "anon";
GRANT ALL ON TABLE "public"."comment_reports" TO "authenticated";
GRANT ALL ON TABLE "public"."comment_reports" TO "service_role";



GRANT ALL ON TABLE "public"."comment_votes" TO "anon";
GRANT ALL ON TABLE "public"."comment_votes" TO "authenticated";
GRANT ALL ON TABLE "public"."comment_votes" TO "service_role";



GRANT ALL ON TABLE "public"."contacts" TO "anon";
GRANT ALL ON TABLE "public"."contacts" TO "authenticated";
GRANT ALL ON TABLE "public"."contacts" TO "service_role";



GRANT ALL ON TABLE "public"."content_blocks" TO "anon";
GRANT ALL ON TABLE "public"."content_blocks" TO "authenticated";
GRANT ALL ON TABLE "public"."content_blocks" TO "service_role";



GRANT ALL ON TABLE "public"."course_feedback" TO "anon";
GRANT ALL ON TABLE "public"."course_feedback" TO "authenticated";
GRANT ALL ON TABLE "public"."course_feedback" TO "service_role";



GRANT ALL ON TABLE "public"."courses" TO "anon";
GRANT ALL ON TABLE "public"."courses" TO "authenticated";
GRANT ALL ON TABLE "public"."courses" TO "service_role";



GRANT ALL ON TABLE "public"."data_imports" TO "anon";
GRANT ALL ON TABLE "public"."data_imports" TO "authenticated";
GRANT ALL ON TABLE "public"."data_imports" TO "service_role";



GRANT ALL ON TABLE "public"."decision_levels" TO "anon";
GRANT ALL ON TABLE "public"."decision_levels" TO "authenticated";
GRANT ALL ON TABLE "public"."decision_levels" TO "service_role";



GRANT ALL ON TABLE "public"."epics" TO "anon";
GRANT ALL ON TABLE "public"."epics" TO "authenticated";
GRANT ALL ON TABLE "public"."epics" TO "service_role";



GRANT ALL ON TABLE "public"."event_categories" TO "anon";
GRANT ALL ON TABLE "public"."event_categories" TO "authenticated";
GRANT ALL ON TABLE "public"."event_categories" TO "service_role";



GRANT ALL ON TABLE "public"."event_registrations" TO "anon";
GRANT ALL ON TABLE "public"."event_registrations" TO "authenticated";
GRANT ALL ON TABLE "public"."event_registrations" TO "service_role";



GRANT ALL ON TABLE "public"."event_templates" TO "anon";
GRANT ALL ON TABLE "public"."event_templates" TO "authenticated";
GRANT ALL ON TABLE "public"."event_templates" TO "service_role";



GRANT ALL ON TABLE "public"."event_types" TO "anon";
GRANT ALL ON TABLE "public"."event_types" TO "authenticated";
GRANT ALL ON TABLE "public"."event_types" TO "service_role";



GRANT ALL ON TABLE "public"."events" TO "anon";
GRANT ALL ON TABLE "public"."events" TO "authenticated";
GRANT ALL ON TABLE "public"."events" TO "service_role";



GRANT ALL ON TABLE "public"."exam_attempts" TO "anon";
GRANT ALL ON TABLE "public"."exam_attempts" TO "authenticated";
GRANT ALL ON TABLE "public"."exam_attempts" TO "service_role";



GRANT ALL ON TABLE "public"."exams" TO "anon";
GRANT ALL ON TABLE "public"."exams" TO "authenticated";
GRANT ALL ON TABLE "public"."exams" TO "service_role";



GRANT ALL ON TABLE "public"."features" TO "anon";
GRANT ALL ON TABLE "public"."features" TO "authenticated";
GRANT ALL ON TABLE "public"."features" TO "service_role";



GRANT ALL ON TABLE "public"."flow_game_saves" TO "anon";
GRANT ALL ON TABLE "public"."flow_game_saves" TO "authenticated";
GRANT ALL ON TABLE "public"."flow_game_saves" TO "service_role";



GRANT ALL ON TABLE "public"."formats" TO "anon";
GRANT ALL ON TABLE "public"."formats" TO "authenticated";
GRANT ALL ON TABLE "public"."formats" TO "service_role";



GRANT ALL ON TABLE "public"."instructors" TO "anon";
GRANT ALL ON TABLE "public"."instructors" TO "authenticated";
GRANT ALL ON TABLE "public"."instructors" TO "service_role";



GRANT ALL ON TABLE "public"."isa_dimensions" TO "anon";
GRANT ALL ON TABLE "public"."isa_dimensions" TO "authenticated";
GRANT ALL ON TABLE "public"."isa_dimensions" TO "service_role";



GRANT ALL ON TABLE "public"."kb_feedback" TO "anon";
GRANT ALL ON TABLE "public"."kb_feedback" TO "authenticated";
GRANT ALL ON TABLE "public"."kb_feedback" TO "service_role";



GRANT ALL ON TABLE "public"."knowledge_categories" TO "anon";
GRANT ALL ON TABLE "public"."knowledge_categories" TO "authenticated";
GRANT ALL ON TABLE "public"."knowledge_categories" TO "service_role";



GRANT ALL ON TABLE "public"."knowledge_edges" TO "anon";
GRANT ALL ON TABLE "public"."knowledge_edges" TO "authenticated";
GRANT ALL ON TABLE "public"."knowledge_edges" TO "service_role";



GRANT ALL ON TABLE "public"."knowledge_item_categories" TO "anon";
GRANT ALL ON TABLE "public"."knowledge_item_categories" TO "authenticated";
GRANT ALL ON TABLE "public"."knowledge_item_categories" TO "service_role";



GRANT ALL ON TABLE "public"."knowledge_item_comments" TO "anon";
GRANT ALL ON TABLE "public"."knowledge_item_comments" TO "authenticated";
GRANT ALL ON TABLE "public"."knowledge_item_comments" TO "service_role";



GRANT ALL ON TABLE "public"."knowledge_item_decision_levels" TO "anon";
GRANT ALL ON TABLE "public"."knowledge_item_decision_levels" TO "authenticated";
GRANT ALL ON TABLE "public"."knowledge_item_decision_levels" TO "service_role";



GRANT ALL ON TABLE "public"."knowledge_item_domains" TO "anon";
GRANT ALL ON TABLE "public"."knowledge_item_domains" TO "authenticated";
GRANT ALL ON TABLE "public"."knowledge_item_domains" TO "service_role";



GRANT ALL ON TABLE "public"."knowledge_item_isa_dimensions" TO "anon";
GRANT ALL ON TABLE "public"."knowledge_item_isa_dimensions" TO "authenticated";
GRANT ALL ON TABLE "public"."knowledge_item_isa_dimensions" TO "service_role";



GRANT ALL ON TABLE "public"."knowledge_item_likes" TO "anon";
GRANT ALL ON TABLE "public"."knowledge_item_likes" TO "authenticated";
GRANT ALL ON TABLE "public"."knowledge_item_likes" TO "service_role";



GRANT ALL ON TABLE "public"."knowledge_item_references" TO "anon";
GRANT ALL ON TABLE "public"."knowledge_item_references" TO "authenticated";
GRANT ALL ON TABLE "public"."knowledge_item_references" TO "service_role";



GRANT ALL ON TABLE "public"."knowledge_item_relations" TO "anon";
GRANT ALL ON TABLE "public"."knowledge_item_relations" TO "authenticated";
GRANT ALL ON TABLE "public"."knowledge_item_relations" TO "service_role";



GRANT ALL ON TABLE "public"."knowledge_item_relationships" TO "anon";
GRANT ALL ON TABLE "public"."knowledge_item_relationships" TO "authenticated";
GRANT ALL ON TABLE "public"."knowledge_item_relationships" TO "service_role";



GRANT ALL ON TABLE "public"."knowledge_item_steps" TO "anon";
GRANT ALL ON TABLE "public"."knowledge_item_steps" TO "authenticated";
GRANT ALL ON TABLE "public"."knowledge_item_steps" TO "service_role";



GRANT ALL ON TABLE "public"."knowledge_item_tags" TO "anon";
GRANT ALL ON TABLE "public"."knowledge_item_tags" TO "authenticated";
GRANT ALL ON TABLE "public"."knowledge_item_tags" TO "service_role";



GRANT ALL ON TABLE "public"."knowledge_item_templates" TO "anon";
GRANT ALL ON TABLE "public"."knowledge_item_templates" TO "authenticated";
GRANT ALL ON TABLE "public"."knowledge_item_templates" TO "service_role";



GRANT ALL ON TABLE "public"."knowledge_items" TO "anon";
GRANT ALL ON TABLE "public"."knowledge_items" TO "authenticated";
GRANT ALL ON TABLE "public"."knowledge_items" TO "service_role";



GRANT ALL ON TABLE "public"."knowledge_items_media" TO "anon";
GRANT ALL ON TABLE "public"."knowledge_items_media" TO "authenticated";
GRANT ALL ON TABLE "public"."knowledge_items_media" TO "service_role";



GRANT ALL ON TABLE "public"."knowledge_media" TO "anon";
GRANT ALL ON TABLE "public"."knowledge_media" TO "authenticated";
GRANT ALL ON TABLE "public"."knowledge_media" TO "service_role";



GRANT ALL ON TABLE "public"."knowledge_tags" TO "anon";
GRANT ALL ON TABLE "public"."knowledge_tags" TO "authenticated";
GRANT ALL ON TABLE "public"."knowledge_tags" TO "service_role";



GRANT ALL ON TABLE "public"."knowledge_templates" TO "anon";
GRANT ALL ON TABLE "public"."knowledge_templates" TO "authenticated";
GRANT ALL ON TABLE "public"."knowledge_templates" TO "service_role";



GRANT ALL ON TABLE "public"."knowledge_use_cases" TO "anon";
GRANT ALL ON TABLE "public"."knowledge_use_cases" TO "authenticated";
GRANT ALL ON TABLE "public"."knowledge_use_cases" TO "service_role";



GRANT ALL ON TABLE "public"."lessons" TO "anon";
GRANT ALL ON TABLE "public"."lessons" TO "authenticated";
GRANT ALL ON TABLE "public"."lessons" TO "service_role";



GRANT ALL ON TABLE "public"."levels" TO "anon";
GRANT ALL ON TABLE "public"."levels" TO "authenticated";
GRANT ALL ON TABLE "public"."levels" TO "service_role";



GRANT ALL ON TABLE "public"."locations" TO "anon";
GRANT ALL ON TABLE "public"."locations" TO "authenticated";
GRANT ALL ON TABLE "public"."locations" TO "service_role";



GRANT ALL ON TABLE "public"."media_assets" TO "anon";
GRANT ALL ON TABLE "public"."media_assets" TO "authenticated";
GRANT ALL ON TABLE "public"."media_assets" TO "service_role";



GRANT ALL ON TABLE "public"."modules" TO "anon";
GRANT ALL ON TABLE "public"."modules" TO "authenticated";
GRANT ALL ON TABLE "public"."modules" TO "service_role";



GRANT ALL ON TABLE "public"."page_style_templates" TO "anon";
GRANT ALL ON TABLE "public"."page_style_templates" TO "authenticated";
GRANT ALL ON TABLE "public"."page_style_templates" TO "service_role";



GRANT ALL ON TABLE "public"."pages" TO "anon";
GRANT ALL ON TABLE "public"."pages" TO "authenticated";
GRANT ALL ON TABLE "public"."pages" TO "service_role";



GRANT ALL ON TABLE "public"."pattern_builder_feedback" TO "anon";
GRANT ALL ON TABLE "public"."pattern_builder_feedback" TO "authenticated";
GRANT ALL ON TABLE "public"."pattern_builder_feedback" TO "service_role";



GRANT ALL ON TABLE "public"."pattern_builder_runs" TO "anon";
GRANT ALL ON TABLE "public"."pattern_builder_runs" TO "authenticated";
GRANT ALL ON TABLE "public"."pattern_builder_runs" TO "service_role";



GRANT ALL ON TABLE "public"."planning_focuses" TO "anon";
GRANT ALL ON TABLE "public"."planning_focuses" TO "authenticated";
GRANT ALL ON TABLE "public"."planning_focuses" TO "service_role";



GRANT ALL ON TABLE "public"."postgres_logs" TO "anon";
GRANT ALL ON TABLE "public"."postgres_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."postgres_logs" TO "service_role";



GRANT ALL ON TABLE "public"."products" TO "anon";
GRANT ALL ON TABLE "public"."products" TO "authenticated";
GRANT ALL ON TABLE "public"."products" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."project_artifact_links" TO "anon";
GRANT ALL ON TABLE "public"."project_artifact_links" TO "authenticated";
GRANT ALL ON TABLE "public"."project_artifact_links" TO "service_role";



GRANT ALL ON TABLE "public"."project_artifacts" TO "anon";
GRANT ALL ON TABLE "public"."project_artifacts" TO "authenticated";
GRANT ALL ON TABLE "public"."project_artifacts" TO "service_role";



GRANT ALL ON TABLE "public"."projects" TO "anon";
GRANT ALL ON TABLE "public"."projects" TO "authenticated";
GRANT ALL ON TABLE "public"."projects" TO "service_role";



GRANT ALL ON TABLE "public"."publication_authors" TO "anon";
GRANT ALL ON TABLE "public"."publication_authors" TO "authenticated";
GRANT ALL ON TABLE "public"."publication_authors" TO "service_role";



GRANT ALL ON TABLE "public"."publications" TO "anon";
GRANT ALL ON TABLE "public"."publications" TO "authenticated";
GRANT ALL ON TABLE "public"."publications" TO "service_role";



GRANT ALL ON TABLE "public"."questions" TO "anon";
GRANT ALL ON TABLE "public"."questions" TO "authenticated";
GRANT ALL ON TABLE "public"."questions" TO "service_role";



GRANT ALL ON TABLE "public"."search_analytics" TO "anon";
GRANT ALL ON TABLE "public"."search_analytics" TO "authenticated";
GRANT ALL ON TABLE "public"."search_analytics" TO "service_role";



GRANT ALL ON TABLE "public"."site_copy" TO "anon";
GRANT ALL ON TABLE "public"."site_copy" TO "authenticated";
GRANT ALL ON TABLE "public"."site_copy" TO "service_role";



GRANT ALL ON TABLE "public"."site_settings" TO "anon";
GRANT ALL ON TABLE "public"."site_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."site_settings" TO "service_role";



GRANT ALL ON TABLE "public"."staging_data" TO "anon";
GRANT ALL ON TABLE "public"."staging_data" TO "authenticated";
GRANT ALL ON TABLE "public"."staging_data" TO "service_role";



GRANT ALL ON TABLE "public"."story_relationships" TO "anon";
GRANT ALL ON TABLE "public"."story_relationships" TO "authenticated";
GRANT ALL ON TABLE "public"."story_relationships" TO "service_role";



GRANT ALL ON TABLE "public"."technique_comments" TO "anon";
GRANT ALL ON TABLE "public"."technique_comments" TO "authenticated";
GRANT ALL ON TABLE "public"."technique_comments" TO "service_role";



GRANT ALL ON TABLE "public"."template_assets" TO "anon";
GRANT ALL ON TABLE "public"."template_assets" TO "authenticated";
GRANT ALL ON TABLE "public"."template_assets" TO "service_role";



GRANT ALL ON TABLE "public"."template_usage" TO "anon";
GRANT ALL ON TABLE "public"."template_usage" TO "authenticated";
GRANT ALL ON TABLE "public"."template_usage" TO "service_role";



GRANT ALL ON TABLE "public"."template_versions" TO "anon";
GRANT ALL ON TABLE "public"."template_versions" TO "authenticated";
GRANT ALL ON TABLE "public"."template_versions" TO "service_role";



GRANT ALL ON TABLE "public"."user_bookmarks" TO "anon";
GRANT ALL ON TABLE "public"."user_bookmarks" TO "authenticated";
GRANT ALL ON TABLE "public"."user_bookmarks" TO "service_role";



GRANT ALL ON TABLE "public"."user_contributed_examples" TO "anon";
GRANT ALL ON TABLE "public"."user_contributed_examples" TO "authenticated";
GRANT ALL ON TABLE "public"."user_contributed_examples" TO "service_role";



GRANT ALL ON TABLE "public"."user_learning_path_progress" TO "anon";
GRANT ALL ON TABLE "public"."user_learning_path_progress" TO "authenticated";
GRANT ALL ON TABLE "public"."user_learning_path_progress" TO "service_role";



GRANT ALL ON TABLE "public"."user_preferences" TO "anon";
GRANT ALL ON TABLE "public"."user_preferences" TO "authenticated";
GRANT ALL ON TABLE "public"."user_preferences" TO "service_role";



GRANT ALL ON TABLE "public"."user_progress" TO "anon";
GRANT ALL ON TABLE "public"."user_progress" TO "authenticated";
GRANT ALL ON TABLE "public"."user_progress" TO "service_role";



GRANT ALL ON TABLE "public"."user_reading_progress" TO "anon";
GRANT ALL ON TABLE "public"."user_reading_progress" TO "authenticated";
GRANT ALL ON TABLE "public"."user_reading_progress" TO "service_role";



GRANT ALL ON TABLE "public"."user_reputation" TO "anon";
GRANT ALL ON TABLE "public"."user_reputation" TO "authenticated";
GRANT ALL ON TABLE "public"."user_reputation" TO "service_role";



GRANT ALL ON TABLE "public"."user_roles" TO "anon";
GRANT ALL ON TABLE "public"."user_roles" TO "authenticated";
GRANT ALL ON TABLE "public"."user_roles" TO "service_role";



GRANT ALL ON TABLE "public"."user_stories" TO "anon";
GRANT ALL ON TABLE "public"."user_stories" TO "authenticated";
GRANT ALL ON TABLE "public"."user_stories" TO "service_role";



GRANT ALL ON TABLE "public"."zoo_copy" TO "anon";
GRANT ALL ON TABLE "public"."zoo_copy" TO "authenticated";
GRANT ALL ON TABLE "public"."zoo_copy" TO "service_role";



GRANT ALL ON TABLE "public"."zoo_game_saves" TO "anon";
GRANT ALL ON TABLE "public"."zoo_game_saves" TO "authenticated";
GRANT ALL ON TABLE "public"."zoo_game_saves" TO "service_role";



GRANT ALL ON TABLE "public"."zoo_game_seats" TO "anon";
GRANT ALL ON TABLE "public"."zoo_game_seats" TO "authenticated";
GRANT ALL ON TABLE "public"."zoo_game_seats" TO "service_role";



GRANT ALL ON TABLE "public"."zoo_games" TO "anon";
GRANT ALL ON TABLE "public"."zoo_games" TO "authenticated";
GRANT ALL ON TABLE "public"."zoo_games" TO "service_role";



GRANT ALL ON TABLE "public"."zoo_session_participants" TO "anon";
GRANT ALL ON TABLE "public"."zoo_session_participants" TO "authenticated";
GRANT ALL ON TABLE "public"."zoo_session_participants" TO "service_role";



GRANT ALL ON TABLE "public"."zoo_sessions" TO "anon";
GRANT ALL ON TABLE "public"."zoo_sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."zoo_sessions" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";






























