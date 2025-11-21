-- Fix audit_log_changes to use public.gen_random_bytes
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
    'c' || encode(public.gen_random_bytes(12), 'hex'),
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

-- Fix generate_cuid to use public.gen_random_bytes
CREATE OR REPLACE FUNCTION public.generate_cuid()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN 'c' || encode(public.gen_random_bytes(12), 'hex');
END;
$$;
