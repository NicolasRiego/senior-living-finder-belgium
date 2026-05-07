ALTER TABLE public.apartments ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.seed_demo_apartments()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  res RECORD;
  apt_count int := 0;
  region_code int;
  -- price tables: [bxl, wal, fla]
  rent_chambre numeric[] := ARRAY[1500, 1150, 1350];
  rent_studio numeric[] := ARRAY[1750, 1350, 1550];
  rent_appt numeric[] := ARRAY[2050, 1600, 1800];
  rent_grand numeric[] := ARRAY[2800, 2200, 2500];
  inc_chambre numeric[] := ARRAY[45, 40, 42];
  inc_studio numeric[] := ARRAY[55, 45, 50];
  inc_appt numeric[] := ARRAY[75, 65, 70];
  inc_grand numeric[] := ARRAY[90, 80, 85];
  sale_studio numeric[] := ARRAY[145000, 92000, 118000];
  sale_1ch numeric[] := ARRAY[195000, 130000, 162000];
  sale_2ch numeric[] := ARRAY[275000, 185000, 228000];
  sale_3ch numeric[] := ARRAY[370000, 245000, 305000];
  sinc_studio numeric[] := ARRAY[6000, 5000, 5500];
  sinc_1ch numeric[] := ARRAY[9000, 7000, 8000];
  sinc_2ch numeric[] := ARRAY[12000, 9000, 10000];
  sinc_3ch numeric[] := ARRAY[15000, 11000, 13000];
  rc int; -- 1-based for arrays
  med_suffix text;
  seig_suffix text;
  desc_med text;
  desc_seig text;
  is_med boolean;
  is_seig boolean;
  d1 text; d2 text; d3 text; d4 text; d5 text; d6 text; d7 text; d8 text; d9 text; d10 text;
  t1 text; t2 text; t3 text; t4 text; t5 text; t6 text; t7 text; t8 text; t9 text; t10 text;
BEGIN
  IF (SELECT count(*) FROM public.apartments WHERE is_demo = true) > 0 THEN
    RETURN jsonb_build_object('skipped', true, 'message', 'Demo apartments already exist');
  END IF;

  FOR res IN
    SELECT id, slug, nom_fr, ville, region, type_etablissement, code_postal
    FROM public.residences
    WHERE is_demo = true AND status = 'published'
    ORDER BY slug
  LOOP
    region_code := CASE
      WHEN res.region = 'Bruxelles' THEN 0
      WHEN res.region = 'Wallonie' THEN 1
      ELSE 2
    END;
    rc := region_code + 1;

    is_med := res.type_etablissement::text IN ('maison_repos', 'maison_repos_soins');
    is_seig := res.type_etablissement::text = 'seigneurie';

    desc_med := ' Bénéficiez de l''accompagnement médical et paramédical disponible 24h/24 au sein de ' || res.nom_fr || '.';
    desc_seig := ' Dans le cadre préservé et chaleureux de cette demeure de caractère.';

    -- Titles
    t1 := 'Chambre confort — ' || res.nom_fr;
    t2 := 'Chambre avec vue — ' || res.nom_fr;
    t3 := 'Studio lumineux — ' || res.nom_fr;
    t4 := 'Studio de plain-pied avec terrasse — ' || res.nom_fr;
    t5 := 'Appartement 1 chambre — ' || res.nom_fr;
    t6 := 'Appartement vue parc — ' || res.nom_fr;
    t7 := 'Appartement PMR rez-de-chaussée — ' || res.nom_fr;
    t8 := 'Grand appartement 2 chambres — ' || res.nom_fr;
    t9 := 'Appartement prestige 2 chambres — ' || res.nom_fr;
    t10 := 'Penthouse 3 chambres — ' || res.nom_fr;

    -- Descriptions (chambres j=1, j=2 reçoivent suffix médical si applicable)
    d1 := 'Chambre individuelle de 22 m² entièrement meublée au 1er étage de ' || res.nom_fr || ' à ' || res.ville || '. Salle de bain privative, grand placard intégré. Tous les services de la résidence inclus. Idéale pour un senior souhaitant bénéficier d''un accompagnement complet au quotidien.';
    d2 := 'Chambre de 26 m² au 3e étage avec belle vue dégagée sur ' || res.ville || '. Meublée avec goût, salle de bain privative avec douche à l''italienne. Luminosité exceptionnelle toute la journée. Accès direct aux espaces communs et au restaurant de ' || res.nom_fr || '.';
    IF is_med THEN
      d1 := d1 || desc_med;
      d2 := d2 || desc_med;
    END IF;
    IF is_seig THEN
      d1 := d1 || desc_seig;
      d2 := d2 || desc_seig;
    END IF;

    d3 := 'Studio de 32 m² au 2e étage de ' || res.nom_fr || ', entièrement rénové en 2023. Séjour-cuisine ouvert avec coin nuit séparable, salle de bain moderne. Grandes fenêtres apportant une luminosité naturelle optimale. Disponible à la location ou à l''achat. Charges de copropriété raisonnables. Proche de tous les commerces de ' || res.ville || '.';
    d4 := 'Charmant studio de 36 m² en rez-de-chaussée avec terrasse privative de 12 m² donnant sur le jardin de ' || res.nom_fr || '. Entièrement accessible PMR, sans marche. Cuisine équipée, salle de bain adaptée avec siège de douche. Parking privatif inclus. Idéal pour senior à mobilité réduite souhaitant rester autonome à ' || res.ville || '.';
    d5 := 'Bel appartement de 45 m² au 1er étage de ' || res.nom_fr || ' à ' || res.ville || '. Séjour lumineux, chambre séparée, cuisine entièrement équipée et salle de bain avec baignoire. Cave privative au sous-sol. Charges locatives incluant eau chaude, chauffage collectif et entretien des parties communes. Disponible dans 30 jours.';
    d6 := 'Superbe appartement de 52 m² au 2e étage avec vue imprenable sur le parc de ' || res.nom_fr || '. Séjour spacieux avec grandes baies vitrées, chambre calme côté jardin, cuisine équipée haut de gamme, salle de bain avec douche et baignoire. Parking couvert et cave inclus. Disponible à la location ou à l''achat à ' || res.ville || '.';
    d7 := 'Appartement de 55 m² entièrement adapté PMR au rez-de-chaussée de ' || res.nom_fr || '. Portes larges 90 cm, salle de bain spacieuse avec douche à l''italienne et barres d''appui, cuisine ergonomique en hauteur variable. Terrasse privative de 15 m² de plain-pied. Parking PMR réservé. Conçu pour garantir une autonomie maximale à ' || res.ville || '.';
    d8 := 'Spacieux appartement de 72 m² au 3e étage de ' || res.nom_fr || ' avec terrasse de 18 m² et vue panoramique sur ' || res.ville || '. Deux chambres séparées idéales pour un couple, grand séjour, cuisine américaine entièrement équipée, deux salles de bain. Parking couvert double et grande cave. Disponible à la location ou à l''achat dans 2 mois.';
    d9 := 'Appartement de standing de 88 m² au 4e étage de ' || res.nom_fr || ' à ' || res.ville || '. Finitions haut de gamme, parquet chêne massif, cuisine de marque entièrement équipée, deux chambres avec dressing, deux salles de bain dont une en suite. Double terrasse orientée sud-ouest avec vue exceptionnelle. Double parking en sous-sol et grande cave. Le summum du confort senior.';
    d10 := 'Exceptionnel appartement de 105 m² au 2e étage de ' || res.nom_fr || ' à ' || res.ville || '. Trois chambres dont une suite parentale avec salle de bain privative, grand séjour-salle à manger de 35 m², cuisine de chef entièrement équipée, deuxième salle de bain et WC séparé. Grande terrasse de 25 m² accessible PMR. Double parking et deux caves. Actuellement réservé — liste d''attente possible. Contactez ' || res.nom_fr || ' pour plus d''informations.';

    IF is_seig THEN
      d3 := d3 || desc_seig;
      d4 := d4 || desc_seig;
      d5 := d5 || desc_seig;
      d6 := d6 || desc_seig;
      d7 := d7 || desc_seig;
      d8 := d8 || desc_seig;
      d9 := d9 || desc_seig;
      d10 := d10 || desc_seig;
    END IF;

    -- j=1 Chambre confort
    INSERT INTO public.apartments (residence_id, title_fr, title_nl, type, surface_m2, floor, transaction_type, rent_price, sale_price, parking, cave, terrace, garden, furnished, kitchen_equipped, elevator, wheelchair_accessible, available_from, status, description_fr, description_nl, is_demo)
    VALUES (res.id, t1, t1, 'chambre', 22, 1, 'rent', (rent_chambre[rc] + 1 * inc_chambre[rc])::int, NULL, false, false, false, false, true, false, true, false, NULL, 'available', d1, 'Demo appartement — ' || t1, true);

    -- j=2 Chambre avec vue
    INSERT INTO public.apartments (residence_id, title_fr, title_nl, type, surface_m2, floor, transaction_type, rent_price, sale_price, parking, cave, terrace, garden, furnished, kitchen_equipped, elevator, wheelchair_accessible, available_from, status, description_fr, description_nl, is_demo)
    VALUES (res.id, t2, t2, 'chambre', 26, 3, 'rent', (rent_chambre[rc] + 2 * inc_chambre[rc])::int, NULL, false, false, false, false, true, false, true, false, CURRENT_DATE + INTERVAL '45 days', 'available', d2, 'Demo appartement — ' || t2, true);

    -- j=3 Studio lumineux
    INSERT INTO public.apartments (residence_id, title_fr, title_nl, type, surface_m2, floor, transaction_type, rent_price, sale_price, parking, cave, terrace, garden, furnished, kitchen_equipped, elevator, wheelchair_accessible, available_from, status, description_fr, description_nl, is_demo)
    VALUES (res.id, t3, t3, 'studio', 32, 2, 'both', (rent_studio[rc] + 3 * inc_studio[rc])::int, (sale_studio[rc] + 3 * sinc_studio[rc])::int, false, false, false, false, true, true, true, false, NULL, 'available', d3, 'Demo appartement — ' || t3, true);

    -- j=4 Studio terrasse
    INSERT INTO public.apartments (residence_id, title_fr, title_nl, type, surface_m2, floor, transaction_type, rent_price, sale_price, parking, cave, terrace, garden, furnished, kitchen_equipped, elevator, wheelchair_accessible, available_from, status, description_fr, description_nl, is_demo)
    VALUES (res.id, t4, t4, 'studio', 36, 0, 'sale', NULL, (sale_studio[rc] + 4 * sinc_studio[rc])::int, true, false, true, true, false, true, false, true, NULL, 'available', d4, 'Demo appartement — ' || t4, true);

    -- j=5 Appt 1ch entrée gamme
    INSERT INTO public.apartments (residence_id, title_fr, title_nl, type, surface_m2, floor, transaction_type, rent_price, sale_price, parking, cave, terrace, garden, furnished, kitchen_equipped, elevator, wheelchair_accessible, available_from, status, description_fr, description_nl, is_demo)
    VALUES (res.id, t5, t5, 'appartement', 45, 1, 'rent', (rent_appt[rc] + 5 * inc_appt[rc])::int, NULL, false, true, false, false, false, true, true, false, CURRENT_DATE + INTERVAL '30 days', 'available', d5, 'Demo appartement — ' || t5, true);

    -- j=6 Appt vue parc
    INSERT INTO public.apartments (residence_id, title_fr, title_nl, type, surface_m2, floor, transaction_type, rent_price, sale_price, parking, cave, terrace, garden, furnished, kitchen_equipped, elevator, wheelchair_accessible, available_from, status, description_fr, description_nl, is_demo)
    VALUES (res.id, t6, t6, 'appartement', 52, 2, 'both', (rent_appt[rc] + 6 * inc_appt[rc])::int, (sale_1ch[rc] + 6 * sinc_1ch[rc])::int, true, true, false, false, false, true, true, false, NULL, 'available', d6, 'Demo appartement — ' || t6, true);

    -- j=7 Appt PMR
    INSERT INTO public.apartments (residence_id, title_fr, title_nl, type, surface_m2, floor, transaction_type, rent_price, sale_price, parking, cave, terrace, garden, furnished, kitchen_equipped, elevator, wheelchair_accessible, available_from, status, description_fr, description_nl, is_demo)
    VALUES (res.id, t7, t7, 'appartement', 55, 0, 'rent', (rent_appt[rc] + 7 * inc_appt[rc])::int, NULL, true, false, true, false, false, true, false, true, NULL, 'available', d7, 'Demo appartement — ' || t7, true);

    -- j=8 Grand 2ch
    INSERT INTO public.apartments (residence_id, title_fr, title_nl, type, surface_m2, floor, transaction_type, rent_price, sale_price, parking, cave, terrace, garden, furnished, kitchen_equipped, elevator, wheelchair_accessible, available_from, status, description_fr, description_nl, is_demo)
    VALUES (res.id, t8, t8, 'appartement', 72, 3, 'both', (rent_grand[rc] + 8 * inc_grand[rc])::int, (sale_2ch[rc] + 8 * sinc_2ch[rc])::int, true, true, true, false, false, true, true, false, CURRENT_DATE + INTERVAL '60 days', 'available', d8, 'Demo appartement — ' || t8, true);

    -- j=9 Prestige 2ch
    INSERT INTO public.apartments (residence_id, title_fr, title_nl, type, surface_m2, floor, transaction_type, rent_price, sale_price, parking, cave, terrace, garden, furnished, kitchen_equipped, elevator, wheelchair_accessible, available_from, status, description_fr, description_nl, is_demo)
    VALUES (res.id, t9, t9, 'appartement', 88, 4, 'sale', NULL, (sale_2ch[rc] + 9 * sinc_2ch[rc] + 25000)::int, true, true, true, false, false, true, true, false, NULL, 'available', d9, 'Demo appartement — ' || t9, true);

    -- j=10 Penthouse 3ch reserved
    INSERT INTO public.apartments (residence_id, title_fr, title_nl, type, surface_m2, floor, transaction_type, rent_price, sale_price, parking, cave, terrace, garden, furnished, kitchen_equipped, elevator, wheelchair_accessible, available_from, status, description_fr, description_nl, is_demo)
    VALUES (res.id, t10, t10, 'appartement', 105, 2, 'sale', NULL, (sale_3ch[rc] + 10 * sinc_3ch[rc])::int, true, true, true, false, false, true, true, true, NULL, 'reserved', d10, 'Demo appartement — ' || t10, true);

    apt_count := apt_count + 10;
  END LOOP;

  INSERT INTO public.audit_log(actor_id, action, entity, entity_id, metadata_json)
  VALUES (auth.uid(), 'DEMO_SEED', 'apartments', NULL, jsonb_build_object('count', apt_count));

  RETURN jsonb_build_object('apartments_created', apt_count);
END;
$function$;

CREATE OR REPLACE FUNCTION public.purge_demo_apartments()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE deleted_count int;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  DELETE FROM public.apartments WHERE is_demo = true;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  INSERT INTO public.audit_log(actor_id, action, entity, entity_id, metadata_json)
  VALUES (auth.uid(), 'DEMO_PURGE', 'apartments', NULL, jsonb_build_object('deleted', deleted_count));
  RETURN jsonb_build_object('deleted', deleted_count);
END;
$function$;

GRANT EXECUTE ON FUNCTION public.seed_demo_apartments() TO authenticated;
GRANT EXECUTE ON FUNCTION public.purge_demo_apartments() TO authenticated;