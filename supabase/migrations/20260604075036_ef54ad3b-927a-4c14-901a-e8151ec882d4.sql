
-- 1. audit_log: explicit restrictive deny for client writes (SECURITY DEFINER triggers bypass RLS)
DROP POLICY IF EXISTS "audit_log_block_client_insert" ON public.audit_log;
DROP POLICY IF EXISTS "audit_log_block_client_update" ON public.audit_log;
DROP POLICY IF EXISTS "audit_log_block_client_delete" ON public.audit_log;
CREATE POLICY "audit_log_block_client_insert" ON public.audit_log
  AS RESTRICTIVE FOR INSERT TO anon, authenticated WITH CHECK (false);
CREATE POLICY "audit_log_block_client_update" ON public.audit_log
  AS RESTRICTIVE FOR UPDATE TO anon, authenticated USING (false) WITH CHECK (false);
CREATE POLICY "audit_log_block_client_delete" ON public.audit_log
  AS RESTRICTIVE FOR DELETE TO anon, authenticated USING (false);

-- 2. residence_versions: same treatment
DROP POLICY IF EXISTS "residence_versions_block_client_insert" ON public.residence_versions;
DROP POLICY IF EXISTS "residence_versions_block_client_update" ON public.residence_versions;
DROP POLICY IF EXISTS "residence_versions_block_client_delete" ON public.residence_versions;
CREATE POLICY "residence_versions_block_client_insert" ON public.residence_versions
  AS RESTRICTIVE FOR INSERT TO anon, authenticated WITH CHECK (false);
CREATE POLICY "residence_versions_block_client_update" ON public.residence_versions
  AS RESTRICTIVE FOR UPDATE TO anon, authenticated USING (false) WITH CHECK (false);
CREATE POLICY "residence_versions_block_client_delete" ON public.residence_versions
  AS RESTRICTIVE FOR DELETE TO anon, authenticated USING (false);

-- 3. Storage: remove broad listing policy on peb-certificates bucket.
-- Direct public URLs continue to work because the bucket's public flag is enabled.
DROP POLICY IF EXISTS "peb_public_read" ON storage.objects;
