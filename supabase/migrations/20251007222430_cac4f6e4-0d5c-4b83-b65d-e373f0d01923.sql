-- Add username column with unique constraint
ALTER TABLE profiles 
ADD COLUMN username text UNIQUE;

-- Create index for better query performance
CREATE INDEX idx_profiles_username ON profiles(username);

-- Pre-populate usernames from email prefix for existing users
UPDATE profiles 
SET username = split_part(email, '@', 1)
WHERE username IS NULL AND email IS NOT NULL;

-- Update the handle_new_user trigger to capture username from signup
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
    CASE 
      WHEN NEW.email = 'al@altogetheragile.com' THEN 'admin'
      ELSE 'user'
    END
  );

  -- Mirror role into user_roles
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id,
    CASE 
      WHEN NEW.email = 'al@altogetheragile.com' THEN 'admin'::public.app_role
      ELSE 'user'::public.app_role
    END
  )
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$function$;