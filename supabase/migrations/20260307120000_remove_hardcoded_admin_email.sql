-- Remove hardcoded admin email from handle_new_user trigger.
-- Admin role should be assigned via the Supabase dashboard or a separate admin script.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
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
$function$;
