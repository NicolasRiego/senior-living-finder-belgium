CREATE OR REPLACE FUNCTION public.seed_demo_data()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  uid uuid := auth.uid();
  oid uuid;
  rid uuid;
  utid uuid;
  i int;
  j int;
  total_count int := 50;
  names text[] := ARRAY[
    'Résidence Les Tilleuls','Seigneurie du Lac','Clairvallon','Résidence Le Parc Royal','Résidence Belle Vue',
    'Les Jardins de Spa','Domaine du Bois Sacré','Résidence Saint-Michel','Résidence Le Châtelain','Résidence Du Soleil',
    'Manoir des Cerisiers','Résidence La Cambre','Domaine Saint-Job','Les Acacias de Namur','Résidence Forest Domain',
    'Les Roses de Liège','Résidence Boitsfort','Le Sablon Royal','Les Marronniers','Résidence Place Jourdan',
    'Stockel Garden','Auderghem Park','Wolu Vert','Domaine de Genval','Résidence Mont-Saint-Jean',
    'Les Jardins de Tournai','Résidence La Hulpe','Castel de Mons','Résidence Brugge Centrum','Domaine de Knokke',
    'Résidence Antwerp Plaza','Les Quais de Gand','Résidence Leuven Hof','Domaine de Hasselt','Résidence Mechelen',
    'Manoir d''Ottignies','Les Terrasses de Wavre','Résidence Nivelles','Domaine de Charleroi','Castel Verviers',
    'Résidence Eupen','Les Ardennes','Domaine de Bouillon','Résidence Arlon','Castel d''Habay',
    'Manoir de Durbuy','Les Lacs de l''Eau d''Heure','Résidence Dinant','Domaine de Rochefort','Castel des Fagnes'
  ];
  taglines text[] := ARRAY[
    'Cadre verdoyant et services personnalisés',
    'Demeure de caractère face au lac, ambiance familiale',
    'Maison de repos et de soins moderne, équipe pluridisciplinaire',
    'Appartements lumineux dans un parc arboré',
    'Vue panoramique et confort haut de gamme',
    'Au cœur d''un quartier résidentiel calme',
    'Architecture contemporaine, jardin paysager',
    'Tradition d''accueil et soins attentifs',
    'Proximité commerces et transports',
    'Espaces de vie chaleureux et conviviaux'
  ];
  descriptions text[] := ARRAY[
    'Résidence-services nichée dans un parc centenaire, alliant le charme d''une bâtisse historique au confort moderne. Studios et appartements lumineux, restaurant gastronomique et programme d''activités riche.',
    'Maison de repos et de soins offrant une prise en charge médicale complète 24h/24. Unité Alzheimer sécurisée, kinésithérapie sur place et équipe paramédicale dévouée.',
    'Seigneurie de prestige aménagée dans une ancienne demeure de maître. Cuisine maison de qualité, salons cosy avec cheminée et grands espaces verts privatifs.',
    'Résidence moderne au cœur de la ville, idéale pour seniors actifs. Tous les services à portée de main : commerces, transports en commun, parcs et activités culturelles.',
    'Cadre exceptionnel en bord de campagne pour profiter d''une retraite paisible. Logements adaptés PMR, jardin thérapeutique et accompagnement personnalisé selon les besoins.'
  ];
  cities_bxl text[] := ARRAY['Bruxelles','Ixelles','Schaerbeek','Uccle','Etterbeek','Anderlecht','Forest','Saint-Gilles','Woluwe-Saint-Lambert','Woluwe-Saint-Pierre','Auderghem','Watermael-Boitsfort'];
  pc_bxl text[] := ARRAY['1000','1050','1030','1180','1040','1070','1190','1060','1200','1150','1160','1170'];
  cities_wal text[] := ARRAY['Namur','Liège','Charleroi','Mons','Tournai','Wavre','Nivelles','Genval','La Hulpe','Verviers','Eupen','Spa','Bouillon','Arlon','Habay','Durbuy','Dinant','Rochefort'];
  pc_wal text[] := ARRAY['5000','4000','6000','7000','7500','1300','1400','1332','1310','4800','4700','4900','6830','6700','6720','6940','5500','5580'];
  cities_fla text[] := ARRAY['Anvers','Gand','Bruges','Louvain','Hasselt','Malines','Knokke','Ostende','Courtrai','Genk'];
  pc_fla text[] := ARRAY['2000','9000','8000','3000','3500','2800','8300','8400','8500','3600'];
  type_codes text[] := ARRAY['residence_services','seigneurie','maison_repos','maison_repos_soins'];
  unit_kinds text[] := ARRAY['studio','t1','t2','t3','chambre'];
  photo_cats text[] := ARRAY['exterior','interior','room','common','garden','restaurant','other'];
  freqs text[] := ARRAY['daily','weekly','biweekly','monthly','occasional'];
  managers text[] := ARRAY['staff','external','volunteers','residents'];
  svc_ids uuid[];
  act_ids uuid[];
  svc_count int;
  act_count int;
  rent_min numeric;
  rent_max numeric;
  charges numeric;
  pack numeric;
  n_svc int;
  n_act int;
  region_choice int;
  city_name text;
  pc text;
  province_name text;
  region_name text;
  n_units int;
BEGIN
  IF NOT public.is_admin(uid) THEN RAISE EXCEPTION 'forbidden'; END IF;

  oid := public.ensure_demo_org();

  IF (SELECT count(*) FROM public.services_catalog) < 5 THEN
    INSERT INTO public.services_catalog(code, label_fr, label_nl, category) VALUES
      ('repas','Repas','Maaltijden','restauration'),
      ('menage','Ménage','Schoonmaak','quotidien'),
      ('linge','Blanchisserie','Wasserij','quotidien'),
      ('infirmier','Soins infirmiers','Verpleegkundige zorg','soins'),
      ('kine','Kinésithérapie','Kinesitherapie','soins'),
      ('coiffeur','Coiffeur','Kapper','bien-etre'),
      ('pedicure','Pédicure','Pedicure','bien-etre'),
      ('navette','Navette','Shuttle','mobilite'),
      ('securite','Sécurité 24/7','Beveiliging 24/7','securite'),
      ('reception','Réception','Receptie','accueil'),
      ('wifi','Wi-Fi','Wi-Fi','confort'),
      ('parking','Parking','Parking','confort'),
      ('jardin','Jardin','Tuin','confort'),
      ('restaurant','Restaurant','Restaurant','restauration'),
      ('animaux','Animaux acceptés','Huisdieren toegestaan','confort')
    ON CONFLICT (code) DO NOTHING;
  END IF;

  IF (SELECT count(*) FROM public.activities_catalog) < 5 THEN
    INSERT INTO public.activities_catalog(code, label_fr, label_nl, category) VALUES
      ('gym','Gymnastique douce','Zachte gymnastiek','sport'),
      ('yoga','Yoga','Yoga','sport'),
      ('chant','Chorale','Koor','culture'),
      ('jeux','Jeux de société','Gezelschapsspellen','social'),
      ('cinema','Cinéma','Bioscoop','culture'),
      ('cuisine','Atelier cuisine','Kookworkshop','atelier'),
      ('jardinage','Jardinage','Tuinieren','atelier'),
      ('sortie','Sorties culturelles','Culturele uitstapjes','sortie'),
      ('lecture','Club de lecture','Leesclub','culture'),
      ('memoire','Atelier mémoire','Geheugentraining','sante'),
      ('peinture','Peinture','Schilderen','atelier'),
      ('danse','Danse','Dans','sport')
    ON CONFLICT (code) DO NOTHING;
  END IF;

  SELECT array_agg(id) INTO svc_ids FROM public.services_catalog;
  SELECT array_agg(id) INTO act_ids FROM public.activities_catalog;
  svc_count := array_length(svc_ids, 1);
  act_count := array_length(act_ids, 1);

  FOR i IN 1..total_count LOOP
    region_choice := i % 3;
    IF region_choice = 0 THEN
      city_name := cities_bxl[1 + (i % array_length(cities_bxl,1))];
      pc := pc_bxl[1 + (i % array_length(pc_bxl,1))];
      province_name := 'Bruxelles-Capitale';
      region_name := 'Bruxelles';
    ELSIF region_choice = 1 THEN
      city_name := cities_wal[1 + (i % array_length(cities_wal,1))];
      pc := pc_wal[1 + (i % array_length(pc_wal,1))];
      province_name := CASE
        WHEN city_name IN ('Liège','Verviers','Eupen','Spa') THEN 'Liège'
        WHEN city_name IN ('Namur','Dinant','Rochefort') THEN 'Namur'
        WHEN city_name IN ('Charleroi') THEN 'Hainaut'
        WHEN city_name IN ('Mons','Tournai') THEN 'Hainaut'
        WHEN city_name IN ('Wavre','Nivelles','Genval','La Hulpe') THEN 'Brabant wallon'
        WHEN city_name IN ('Bouillon','Arlon','Habay') THEN 'Luxembourg'
        WHEN city_name IN ('Durbuy') THEN 'Luxembourg'
        ELSE 'Wallonie'
      END;
      region_name := 'Wallonie';
    ELSE
      city_name := cities_fla[1 + (i % array_length(cities_fla,1))];
      pc := pc_fla[1 + (i % array_length(pc_fla,1))];
      province_name := CASE
        WHEN city_name IN ('Anvers') THEN 'Anvers'
        WHEN city_name IN ('Gand','Bruges','Knokke','Ostende','Courtrai') THEN 'Flandre-Occidentale'
        WHEN city_name IN ('Louvain','Malines') THEN 'Brabant flamand'
        WHEN city_name IN ('Hasselt','Genk') THEN 'Limbourg'
        ELSE 'Flandre'
      END;
      region_name := 'Flandre';
    END IF;

    INSERT INTO public.residences(
      org_id, slug, nom_fr, nom_nl, tagline_fr, tagline_nl,
      description_fr, description_nl, type_etablissement,
      adresse, code_postal, ville, province, region, pays,
      capacity, contact_email, contact_phone, website, status, published_at, is_demo
    ) VALUES (
      oid,
      'demo-' || i || '-' || lower(regexp_replace(names[i], '[^a-zA-Z0-9]+', '-', 'g')),
      names[i],
      names[i],
      taglines[1 + (i % array_length(taglines,1))],
      taglines[1 + (i % array_length(taglines,1))],
      descriptions[1 + (i % array_length(descriptions,1))],
      'Fictieve residentie aangemaakt voor demo.',
      (type_codes[1 + (i % 4)])::public.establishment_type,
      (10 + i) || ' ' || (CASE i%4 WHEN 0 THEN 'Avenue' WHEN 1 THEN 'Rue' WHEN 2 THEN 'Chaussée' ELSE 'Boulevard' END) || ' des Tilleuls',
      pc,
      city_name,
      province_name,
      region_name,
      'BE',
      30 + (i * 7) % 120,
      'contact@demo-' || i || '.be',
      '+32 ' || (CASE region_choice WHEN 0 THEN '2' WHEN 1 THEN '4' ELSE '3' END) || ' ' || lpad((100 + i)::text, 3, '0') || ' ' || lpad((10 + i)::text, 2, '0') || ' ' || lpad((20 + i)::text, 2, '0'),
      'https://example.be/demo-' || i,
      'published'::public.publication_status,
      now(),
      true
    ) RETURNING id INTO rid;

    n_units := 2 + (i % 4);
    FOR j IN 1..n_units LOOP
      INSERT INTO public.unit_types(
        residence_id, type, surface_min, surface_max,
        count_total, available_count, available_now, waiting_list, waiting_delay_days
      ) VALUES (
        rid,
        unit_kinds[1 + ((i + j) % 5)],
        25 + j * 5,
        35 + j * 10,
        8 + j * 2,
        (j % 3),
        (j % 2 = 0),
        (j % 3 = 0),
        CASE WHEN j % 3 = 0 THEN 60 ELSE NULL END
      ) RETURNING id INTO utid;

      rent_min := 1300 + (i * 25) + (j * 200) + (CASE region_choice WHEN 0 THEN 300 WHEN 2 THEN 150 ELSE 0 END);
      rent_max := rent_min + 400 + (j * 100);
      charges := 130 + (i % 6) * 50;
      pack := 100 + (i % 4) * 50;

      INSERT INTO public.pricing(
        unit_type_id, occupation_mode, rent_min, rent_max,
        fixed_charges, mandatory_pack, common_options
      ) VALUES (
        utid, 'rent'::public.occupation_mode, rent_min, rent_max,
        charges, pack, '[]'::jsonb
      );
    END LOOP;

    n_svc := LEAST(svc_count, 8 + (i % 7));
    FOR j IN 1..n_svc LOOP
      INSERT INTO public.residence_services(residence_id, service_id, included, optional, price)
      VALUES (
        rid,
        svc_ids[1 + ((i * 7 + j) % svc_count)],
        (j % 2 = 0),
        (j % 3 = 0),
        CASE WHEN j % 3 = 0 THEN 25 + (j * 5) ELSE NULL END
      )
      ON CONFLICT DO NOTHING;
    END LOOP;

    n_act := LEAST(act_count, 5 + (i % 8));
    FOR j IN 1..n_act LOOP
      INSERT INTO public.residence_activities(residence_id, activity_id, frequency, managed_by)
      VALUES (
        rid,
        act_ids[1 + ((i * 5 + j) % act_count)],
        freqs[1 + (j % 5)],
        managers[1 + (j % 4)]
      )
      ON CONFLICT DO NOTHING;
    END LOOP;

    INSERT INTO public.photos(residence_id, storage_path, category, title, alt_text, display_order)
    VALUES (rid, 'https://picsum.photos/seed/demo' || i || '-cover/1200/800', 'cover'::public.photo_category,
            names[i] || ' — façade', 'Façade ' || names[i], 0);

    FOR j IN 1..(6 + (i % 6)) LOOP
      INSERT INTO public.photos(residence_id, storage_path, category, title, alt_text, display_order)
      VALUES (
        rid,
        'https://picsum.photos/seed/demo' || i || '-' || j || '/1200/800',
        (photo_cats[1 + (j % 7)])::public.photo_category,
        'Photo ' || j,
        'Vue ' || j || ' de ' || names[i],
        j
      );
    END LOOP;
  END LOOP;

  INSERT INTO public.audit_log(actor_id, action, entity, entity_id, metadata_json)
  VALUES (uid, 'DEMO_SEED', 'residences', NULL, jsonb_build_object('count', total_count));

  RETURN jsonb_build_object('residences_created', total_count);
END $function$;