-- Check current role and try insert with explicit count
DO $$
DECLARE
  v_role text;
  v_count integer;
BEGIN
  SELECT current_user INTO v_role;
  RAISE NOTICE 'Current role: %', v_role;

  -- Try the insert
  INSERT INTO public.blog_posts (title, slug, content, is_published, estimated_reading_time)
  VALUES (
    'How AI Is Changing Software Development: We Have Moved Up a Level of Abstraction',
    'how-ai-is-changing-software-development',
    'placeholder',
    false,
    9
  );

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE 'Rows inserted: %', v_count;

  SELECT count(*) INTO v_count FROM public.blog_posts WHERE slug = 'how-ai-is-changing-software-development';
  RAISE NOTICE 'Rows found after insert: %', v_count;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Insert failed: % %', SQLERRM, SQLSTATE;
END;
$$;
