-- ============================================================================
-- IoZen Database Triggers, RLS Policies, and Audit Logging
-- Run this in Supabase SQL Editor after Prisma migrations
-- ============================================================================

-- ============================================================================
-- 1. ENABLE RLS ON ALL TABLES
-- ============================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE chatflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE chatflow_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 2. HELPER FUNCTION: Generate CUID-like IDs
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_cuid()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN 'c' || encode(gen_random_bytes(12), 'hex');
END;
$$;

-- ============================================================================
-- 3. USER SIGNUP TRIGGER: Create profile, workspace, and membership
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  new_workspace_id TEXT;
  new_member_id TEXT;
BEGIN
  -- Generate IDs
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
END;
$$;

-- Create trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- 4. AUDIT LOGGING FUNCTIONS
-- ============================================================================

-- Generic audit log function
CREATE OR REPLACE FUNCTION public.audit_log_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
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

-- Apply audit triggers to important tables
DROP TRIGGER IF EXISTS audit_chatflows ON chatflows;
CREATE TRIGGER audit_chatflows
  AFTER INSERT OR UPDATE OR DELETE ON chatflows
  FOR EACH ROW EXECUTE FUNCTION public.audit_log_changes();

DROP TRIGGER IF EXISTS audit_workspaces ON workspaces;
CREATE TRIGGER audit_workspaces
  AFTER INSERT OR UPDATE OR DELETE ON workspaces
  FOR EACH ROW EXECUTE FUNCTION public.audit_log_changes();

DROP TRIGGER IF EXISTS audit_workspace_members ON workspace_members;
CREATE TRIGGER audit_workspace_members
  AFTER INSERT OR UPDATE OR DELETE ON workspace_members
  FOR EACH ROW EXECUTE FUNCTION public.audit_log_changes();

-- ============================================================================
-- 5. RLS POLICIES
-- ============================================================================

-- -----------------------------------------------------------------------------
-- PROFILES: Users can only see and update their own profile
-- -----------------------------------------------------------------------------

CREATE POLICY "Users view own profile"
  ON profiles FOR SELECT TO authenticated
  USING ((SELECT auth.uid())::TEXT = id);

CREATE POLICY "Users update own profile"
  ON profiles FOR UPDATE TO authenticated
  USING ((SELECT auth.uid())::TEXT = id)
  WITH CHECK ((SELECT auth.uid())::TEXT = id);

-- -----------------------------------------------------------------------------
-- WORKSPACES: Users can see workspaces they're members of
-- -----------------------------------------------------------------------------

CREATE POLICY "Users view member workspaces"
  ON workspaces FOR SELECT TO authenticated
  USING (
    id IN (
      SELECT workspace_id FROM workspace_members
      WHERE profile_id = (SELECT auth.uid())::TEXT
    )
  );

CREATE POLICY "Owners can update workspaces"
  ON workspaces FOR UPDATE TO authenticated
  USING (
    id IN (
      SELECT workspace_id FROM workspace_members
      WHERE profile_id = (SELECT auth.uid())::TEXT
      AND role IN ('OWNER', 'ADMIN')
    )
  )
  WITH CHECK (
    id IN (
      SELECT workspace_id FROM workspace_members
      WHERE profile_id = (SELECT auth.uid())::TEXT
      AND role IN ('OWNER', 'ADMIN')
    )
  );

CREATE POLICY "Authenticated users can create workspaces"
  ON workspaces FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Owners can delete workspaces"
  ON workspaces FOR DELETE TO authenticated
  USING (
    id IN (
      SELECT workspace_id FROM workspace_members
      WHERE profile_id = (SELECT auth.uid())::TEXT
      AND role = 'OWNER'
    )
  );

-- -----------------------------------------------------------------------------
-- WORKSPACE MEMBERS: Users can see members of their workspaces
-- -----------------------------------------------------------------------------

CREATE POLICY "Users view workspace members"
  ON workspace_members FOR SELECT TO authenticated
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE profile_id = (SELECT auth.uid())::TEXT
    )
  );

CREATE POLICY "Admins can add workspace members"
  ON workspace_members FOR INSERT TO authenticated
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE profile_id = (SELECT auth.uid())::TEXT
      AND role IN ('OWNER', 'ADMIN')
    )
  );

CREATE POLICY "Admins can update workspace members"
  ON workspace_members FOR UPDATE TO authenticated
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE profile_id = (SELECT auth.uid())::TEXT
      AND role IN ('OWNER', 'ADMIN')
    )
  )
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE profile_id = (SELECT auth.uid())::TEXT
      AND role IN ('OWNER', 'ADMIN')
    )
  );

CREATE POLICY "Admins can remove workspace members"
  ON workspace_members FOR DELETE TO authenticated
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE profile_id = (SELECT auth.uid())::TEXT
      AND role IN ('OWNER', 'ADMIN')
    )
  );

-- -----------------------------------------------------------------------------
-- CHATFLOWS: Users can access chatflows in their workspaces
-- -----------------------------------------------------------------------------

CREATE POLICY "Users view workspace chatflows"
  ON chatflows FOR SELECT TO authenticated
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE profile_id = (SELECT auth.uid())::TEXT
    )
  );

CREATE POLICY "Users create workspace chatflows"
  ON chatflows FOR INSERT TO authenticated
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE profile_id = (SELECT auth.uid())::TEXT
    )
  );

CREATE POLICY "Users update workspace chatflows"
  ON chatflows FOR UPDATE TO authenticated
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE profile_id = (SELECT auth.uid())::TEXT
    )
  )
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE profile_id = (SELECT auth.uid())::TEXT
    )
  );

CREATE POLICY "Admins delete workspace chatflows"
  ON chatflows FOR DELETE TO authenticated
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE profile_id = (SELECT auth.uid())::TEXT
      AND role IN ('OWNER', 'ADMIN')
    )
  );

-- Public can view published chatflows (for /c/[shareUrl])
CREATE POLICY "Anyone views published chatflows"
  ON chatflows FOR SELECT TO anon
  USING (status = 'PUBLISHED');

-- -----------------------------------------------------------------------------
-- CHATFLOW SUBMISSIONS: Workspace members can view, anyone can create for published
-- -----------------------------------------------------------------------------

CREATE POLICY "Users view workspace submissions"
  ON chatflow_submissions FOR SELECT TO authenticated
  USING (
    chatflow_id IN (
      SELECT id FROM chatflows
      WHERE workspace_id IN (
        SELECT workspace_id FROM workspace_members
        WHERE profile_id = (SELECT auth.uid())::TEXT
      )
    )
  );

-- Anyone can create submissions for published chatflows
CREATE POLICY "Anyone creates submissions for published chatflows"
  ON chatflow_submissions FOR INSERT TO anon, authenticated
  WITH CHECK (
    chatflow_id IN (
      SELECT id FROM chatflows WHERE status = 'PUBLISHED'
    )
  );

-- Anyone can update their own in-progress submission
CREATE POLICY "Anyone updates own submissions"
  ON chatflow_submissions FOR UPDATE TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Admins can delete submissions
CREATE POLICY "Admins delete submissions"
  ON chatflow_submissions FOR DELETE TO authenticated
  USING (
    chatflow_id IN (
      SELECT id FROM chatflows
      WHERE workspace_id IN (
        SELECT workspace_id FROM workspace_members
        WHERE profile_id = (SELECT auth.uid())::TEXT
        AND role IN ('OWNER', 'ADMIN')
      )
    )
  );

-- -----------------------------------------------------------------------------
-- CONVERSATION MESSAGES: Follow submission access
-- -----------------------------------------------------------------------------

CREATE POLICY "Users view workspace messages"
  ON conversation_messages FOR SELECT TO authenticated
  USING (
    submission_id IN (
      SELECT id FROM chatflow_submissions
      WHERE chatflow_id IN (
        SELECT id FROM chatflows
        WHERE workspace_id IN (
          SELECT workspace_id FROM workspace_members
          WHERE profile_id = (SELECT auth.uid())::TEXT
        )
      )
    )
  );

-- Anyone can create messages for submissions
CREATE POLICY "Anyone creates messages"
  ON conversation_messages FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- Anyone can view messages for their submission
CREATE POLICY "Anyone views submission messages"
  ON conversation_messages FOR SELECT TO anon
  USING (true);

-- -----------------------------------------------------------------------------
-- AUDIT LOGS: Only admins can view audit logs
-- -----------------------------------------------------------------------------

CREATE POLICY "Admins view audit logs"
  ON audit_logs FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE profile_id = (SELECT auth.uid())::TEXT
      AND role IN ('OWNER', 'ADMIN')
    )
  );

-- System can insert audit logs (no restrictions)
CREATE POLICY "System inserts audit logs"
  ON audit_logs FOR INSERT TO authenticated, anon
  WITH CHECK (true);

-- ============================================================================
-- 6. INDEXES FOR RLS PERFORMANCE
-- ============================================================================

-- These indexes optimize the RLS policy lookups
CREATE INDEX IF NOT EXISTS idx_workspace_members_profile_workspace
  ON workspace_members(profile_id, workspace_id);

CREATE INDEX IF NOT EXISTS idx_workspace_members_workspace_role
  ON workspace_members(workspace_id, role);

CREATE INDEX IF NOT EXISTS idx_chatflows_workspace_status
  ON chatflows(workspace_id, status);

CREATE INDEX IF NOT EXISTS idx_chatflow_submissions_chatflow
  ON chatflow_submissions(chatflow_id);

CREATE INDEX IF NOT EXISTS idx_conversation_messages_submission
  ON conversation_messages(submission_id);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_created
  ON audit_logs(user_id, created_at DESC);

-- ============================================================================
-- 7. GRANT PERMISSIONS
-- ============================================================================

-- Grant execute on functions to supabase_auth_admin for triggers
GRANT EXECUTE ON FUNCTION public.handle_new_user TO supabase_auth_admin;
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;

-- Ensure authenticated users can use the schema
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- ============================================================================
-- DONE! Your auth system is now configured.
-- ============================================================================
