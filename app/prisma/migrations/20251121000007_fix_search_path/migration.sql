-- Fix handle_new_user to use search_path = public, extensions
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public, extensions
AS $$
DECLARE
  new_workspace_id TEXT;
  new_member_id TEXT;
BEGIN
  -- Generate IDs (CUID-like)
  new_workspace_id := 'c' || encode(gen_random_bytes(12), 'hex');
  new_member_id := 'c' || encode(gen_random_bytes(12), 'hex');

  -- 1. Create profile from auth.users
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
    'OWNER'::public."WorkspaceRole",
    NOW()
  );

  -- 4. Log the signup event
  INSERT INTO public.audit_logs (id, user_id, action, table_name, record_id, new_data, created_at)
  VALUES (
    'c' || encode(gen_random_bytes(12), 'hex'),
    NEW.id::TEXT,
    'SIGNUP',
    'profiles',
    NEW.id::TEXT,
    jsonb_build_object('email', NEW.email, 'workspace_id', new_workspace_id),
    NOW()
  );

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error
    RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Fix audit_log_changes to use search_path = public, extensions
CREATE OR REPLACE FUNCTION public.audit_log_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public, extensions
AS $$
DECLARE
  audit_user_id TEXT;
  audit_action TEXT;
  audit_old_data JSONB;
  audit_new_data JSONB;
  record_id TEXT;
BEGIN
  -- Get user ID from auth context
  audit_user_id := (SELECT auth.uid())::TEXT;

  -- Determine action
  IF TG_OP = 'INSERT' THEN
    audit_action := 'INSERT';
    audit_old_data := NULL;
    audit_new_data := to_jsonb(NEW);
    record_id := NEW.id;
  ELSIF TG_OP = 'UPDATE' THEN
    audit_action := 'UPDATE';
    audit_old_data := to_jsonb(OLD);
    audit_new_data := to_jsonb(NEW);
    record_id := NEW.id;
  ELSIF TG_OP = 'DELETE' THEN
    audit_action := 'DELETE';
    audit_old_data := to_jsonb(OLD);
    audit_new_data := NULL;
    record_id := OLD.id;
  END IF;

  -- Insert audit log
  INSERT INTO public.audit_logs (
    id, user_id, action, table_name, record_id, old_data, new_data, created_at
  ) VALUES (
    'c' || encode(gen_random_bytes(12), 'hex'),
    audit_user_id,
    audit_action,
    TG_TABLE_NAME,
    record_id,
    audit_old_data,
    audit_new_data,
    NOW()
  );

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

-- Fix generate_cuid to use search_path = public, extensions (just in case)
CREATE OR REPLACE FUNCTION public.generate_cuid()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN 'c' || encode(extensions.gen_random_bytes(12), 'hex');
EXCEPTION WHEN OTHERS THEN
  RETURN 'c' || encode(public.gen_random_bytes(12), 'hex');
END;
$$;
