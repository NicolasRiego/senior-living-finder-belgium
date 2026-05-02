
-- Index for faster version history queries
CREATE INDEX IF NOT EXISTS idx_residence_versions_residence_created
  ON public.residence_versions (residence_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON public.audit_log (entity, entity_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_actor ON public.audit_log (actor_id, created_at DESC);

-- Restore a snapshot (admin only)
CREATE OR REPLACE FUNCTION public.restore_residence_version(_version_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  v public.residence_versions%ROWTYPE;
  snap jsonb;
  rid uuid;
  r jsonb;
  item jsonb;
BEGIN
  IF NOT public.is_admin(uid) THEN RAISE EXCEPTION 'forbidden'; END IF;

  SELECT * INTO v FROM public.residence_versions WHERE id = _version_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'version_not_found'; END IF;

  rid := v.residence_id;
  snap := v.snapshot_json;

  -- Restore residence main fields (preserve id, org_id, slug, status, created_at)
  UPDATE public.residences SET
    nom_fr = snap->>'nom_fr',
    nom_nl = snap->>'nom_nl',
    tagline_fr = snap->>'tagline_fr',
    tagline_nl = snap->>'tagline_nl',
    description_fr = snap->>'description_fr',
    description_nl = snap->>'description_nl',
    type_etablissement = (snap->>'type_etablissement')::residence_type,
    adresse = snap->>'adresse',
    code_postal = snap->>'code_postal',
    ville = snap->>'ville',
    province = snap->>'province',
    region = snap->>'region',
    pays = COALESCE(snap->>'pays', 'BE'),
    latitude = NULLIF(snap->>'latitude','')::numeric,
    longitude = NULLIF(snap->>'longitude','')::numeric,
    proximity = COALESCE(snap->'proximity', '{}'::jsonb),
    capacity = NULLIF(snap->>'capacity','')::int,
    contact_email = snap->>'contact_email',
    contact_phone = snap->>'contact_phone',
    website = snap->>'website',
    updated_at = now()
  WHERE id = rid;

  -- Wipe & restore unit_types (cascade pricing via app — we delete pricing first)
  DELETE FROM public.pricing
    WHERE unit_type_id IN (SELECT id FROM public.unit_types WHERE residence_id = rid);
  DELETE FROM public.unit_types WHERE residence_id = rid;

  IF snap ? 'unit_types' AND jsonb_typeof(snap->'unit_types') = 'array' THEN
    FOR item IN SELECT * FROM jsonb_array_elements(snap->'unit_types') LOOP
      INSERT INTO public.unit_types (id, residence_id, type, surface_min, surface_max,
        count_total, available_count, available_now, waiting_list, waiting_delay_days, created_at, updated_at)
      VALUES (
        COALESCE(NULLIF(item->>'id','')::uuid, gen_random_uuid()),
        rid,
        item->>'type',
        NULLIF(item->>'surface_min','')::numeric,
        NULLIF(item->>'surface_max','')::numeric,
        COALESCE(NULLIF(item->>'count_total','')::int, 0),
        COALESCE(NULLIF(item->>'available_count','')::int, 0),
        COALESCE((item->>'available_now')::boolean, false),
        COALESCE((item->>'waiting_list')::boolean, false),
        NULLIF(item->>'waiting_delay_days','')::int,
        now(), now()
      );
    END LOOP;
  END IF;

  -- Restore pricing (linked by unit_type_id from snapshot — only insert if matching unit_type exists)
  IF snap ? 'pricing' AND jsonb_typeof(snap->'pricing') = 'array' THEN
    FOR item IN SELECT * FROM jsonb_array_elements(snap->'pricing') LOOP
      IF EXISTS (SELECT 1 FROM public.unit_types WHERE id = (item->>'unit_type_id')::uuid) THEN
        INSERT INTO public.pricing (unit_type_id, occupation_mode, rent_min, rent_max,
          buy_min, buy_max, fixed_charges, mandatory_pack, common_options,
          estimated_monthly_min, estimated_monthly_max, created_at, updated_at)
        VALUES (
          (item->>'unit_type_id')::uuid,
          (item->>'occupation_mode')::occupation_mode,
          NULLIF(item->>'rent_min','')::numeric,
          NULLIF(item->>'rent_max','')::numeric,
          NULLIF(item->>'buy_min','')::numeric,
          NULLIF(item->>'buy_max','')::numeric,
          NULLIF(item->>'fixed_charges','')::numeric,
          NULLIF(item->>'mandatory_pack','')::numeric,
          COALESCE(item->'common_options', '[]'::jsonb),
          NULLIF(item->>'estimated_monthly_min','')::numeric,
          NULLIF(item->>'estimated_monthly_max','')::numeric,
          now(), now()
        );
      END IF;
    END LOOP;
  END IF;

  -- Restore services
  DELETE FROM public.residence_services WHERE residence_id = rid;
  IF snap ? 'services' AND jsonb_typeof(snap->'services') = 'array' THEN
    FOR item IN SELECT * FROM jsonb_array_elements(snap->'services') LOOP
      INSERT INTO public.residence_services (residence_id, service_id, included, optional, price, comment_fr, comment_nl, created_at, updated_at)
      VALUES (
        rid,
        (item->>'service_id')::uuid,
        COALESCE((item->>'included')::boolean, false),
        COALESCE((item->>'optional')::boolean, false),
        NULLIF(item->>'price','')::numeric,
        item->>'comment_fr',
        item->>'comment_nl',
        now(), now()
      );
    END LOOP;
  END IF;

  -- Restore photos (storage_path remains the same — files in bucket are unchanged)
  DELETE FROM public.photos WHERE residence_id = rid;
  IF snap ? 'photos' AND jsonb_typeof(snap->'photos') = 'array' THEN
    FOR item IN SELECT * FROM jsonb_array_elements(snap->'photos') LOOP
      INSERT INTO public.photos (residence_id, storage_path, category, title, alt_text, display_order, created_at)
      VALUES (
        rid,
        item->>'storage_path',
        COALESCE((item->>'category')::photo_category, 'other'::photo_category),
        item->>'title',
        item->>'alt_text',
        COALESCE(NULLIF(item->>'display_order','')::int, 0),
        now()
      );
    END LOOP;
  END IF;

  -- Snapshot the new state as a "restore" version
  PERFORM public.snapshot_residence(rid, 'RESTORE from version ' || v.version_number, uid);

  INSERT INTO public.audit_log(actor_id, action, entity, entity_id, metadata_json)
  VALUES (uid, 'RESTORE', 'residences', rid,
    jsonb_build_object('from_version_id', _version_id, 'from_version_number', v.version_number));
END $$;

-- Archive (admin only)
CREATE OR REPLACE FUNCTION public.archive_residence(_residence_id uuid, _reason text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE uid uuid := auth.uid();
BEGIN
  IF NOT public.is_admin(uid) THEN RAISE EXCEPTION 'forbidden'; END IF;
  UPDATE public.residences SET status = 'archived' WHERE id = _residence_id;
  INSERT INTO public.audit_log(actor_id, action, entity, entity_id, metadata_json)
  VALUES (uid, 'ARCHIVE', 'residences', _residence_id, jsonb_build_object('reason', _reason));
END $$;

CREATE OR REPLACE FUNCTION public.unarchive_residence(_residence_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE uid uuid := auth.uid();
BEGIN
  IF NOT public.is_admin(uid) THEN RAISE EXCEPTION 'forbidden'; END IF;
  UPDATE public.residences SET status = 'draft' WHERE id = _residence_id;
  INSERT INTO public.audit_log(actor_id, action, entity, entity_id, metadata_json)
  VALUES (uid, 'UNARCHIVE', 'residences', _residence_id, '{}'::jsonb);
END $$;
