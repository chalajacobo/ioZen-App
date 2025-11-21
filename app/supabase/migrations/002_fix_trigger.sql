-- ============================================================================
-- FIXED USER SIGNUP TRIGGER
-- Run this to replace the previous trigger
-- ============================================================================

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create fixed function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  new_workspace_id TEXT;
  new_member_id TEXT;
BEGIN
  -- Generate IDs (CUID-like)
  new_workspace_id := 'c' || encode(gen_random_bytes(12), 'hex');
  new_member_id := 'c' || encode(gen_random_bytes(12), 'hex');

  -- 1. Create profile from auth.users
  -- Note: updated_at uses NOW() since Prisma @updatedAt is application-level
  INSERT INTO public.profiles (id, email, name, avatar_url, created_at, updated_at)
  VALUES (
    NEW.id::TEXT,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'name', SPLIT_PART(NEW.email, '@', 1)),
    NEW.raw_user_meta_data ->> 'avatar_url',
    NOW(),
    NOW()
  );

  -- 2. Create default workspace
  INSERT INTO public.workspaces (id, name, slug, created_at, updated_at)
  VALUES (
    new_workspace_id,
    'My Workspace',
    'ws-' || SUBSTR(REPLACE(NEW.id::TEXT, '-', ''), 1, 8),
    NOW(),
    NOW()
  );

  -- 3. Create membership as OWNER
  INSERT INTO public.workspace_members (id, profile_id, workspace_id, role, created_at)
  VALUES (
    new_member_id,
    NEW.id::TEXT,
    new_workspace_id,
    'OWNER',
    NOW()
  );

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't block signup
    RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Recreate trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.handle_new_user TO supabase_auth_admin;
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
