ALTER TABLE public.residences
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS deleted_reason TEXT DEFAULT NULL;

COMMENT ON COLUMN public.residences.deleted_at IS
  'Date de suppression douce. NULL = résidence active.';
COMMENT ON COLUMN public.residences.deleted_reason IS
  'Raison de suppression : deleted_by_partner, archived_by_admin, duplicate, etc.';

DROP FUNCTION IF EXISTS public.archive_residence(uuid, text);
DROP FUNCTION IF EXISTS public.unarchive_residence(uuid);

CREATE OR REPLACE FUNCTION public.archive_residence(
  _residence_id uuid,
  _reason text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT (
    public.is_admin(auth.uid()) OR
    EXISTS (
      SELECT 1 FROM public.residences r
      JOIN public.org_members m ON m.org_id = r.org_id
      WHERE r.id = _residence_id
        AND m.user_id = auth.uid()
    )
  ) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  UPDATE public.residences
  SET
    status = 'archived',
    deleted_at = now(),
    deleted_by = auth.uid(),
    deleted_reason = _reason
  WHERE id = _residence_id;

  INSERT INTO public.audit_log(actor_id, action, entity, entity_id, metadata_json)
  VALUES (auth.uid(), 'ARCHIVE', 'residences', _residence_id, jsonb_build_object('reason', _reason));

  RETURN jsonb_build_object('success', true);
END;
$function$;

CREATE OR REPLACE FUNCTION public.unarchive_residence(
  _residence_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT (
    public.is_admin(auth.uid()) OR
    EXISTS (
      SELECT 1 FROM public.residences r
      JOIN public.org_members m ON m.org_id = r.org_id
      WHERE r.id = _residence_id
        AND m.user_id = auth.uid()
    )
  ) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  UPDATE public.residences
  SET
    status = 'draft',
    deleted_at = NULL,
    deleted_by = NULL,
    deleted_reason = NULL
  WHERE id = _residence_id;

  INSERT INTO public.audit_log(actor_id, action, entity, entity_id, metadata_json)
  VALUES (auth.uid(), 'UNARCHIVE', 'residences', _residence_id, '{}'::jsonb);

  RETURN jsonb_build_object('success', true, 'message', 'Résidence restaurée en brouillon');
END;
$function$;

CREATE INDEX IF NOT EXISTS idx_residences_deleted_at
  ON public.residences(deleted_at)
  WHERE deleted_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_residences_status_org
  ON public.residences(status, org_id);