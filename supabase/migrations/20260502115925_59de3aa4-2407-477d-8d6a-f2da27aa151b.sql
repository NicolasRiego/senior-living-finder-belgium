CREATE OR REPLACE FUNCTION public.seed_demo_data()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  uid uuid := auth.uid();
  oid uuid;
  rid uuid;
  utid uuid;
  i int;
  j int;
  names text[] := ARRAY[
    'Résidence Les Tilleuls','Résidence Le Bois Sacré','Résidence Saint-Michel','Résidence Le Parc Royal','Résidence Belle Vue',
    'Résidence Les Cerisiers','Résidence Le Lac','Résidence Notre Refuge','Résidence Les Ormes','Résidence Du Soleil',
    'Résidence Les Jardins','Résidence La Cambre','Résidence Le Châtelain','Résidence Les Acacias','Résidence Saint-Job',
    'Résidence Les Roses','Résidence Boitsfort','Résidence Le Sablon','Résidence Les Marronniers','Résidence Forest Domain',
    'Résidence Le Bocage','Résidence Place Jourdan','Résidence Stockel Garden','Résidence Auderghem Park','Résidence Wolu Vert'
  ];
  cities text[] := ARRAY[
    'Bruxelles','Ixelles','Schaerbeek','Uccle','Etterbeek','Anderlecht','Forest','Saint-Gilles',
    'Woluwe-Saint-Lambert','Woluwe-Saint-Pierre','Auderghem','Watermael-Boitsfort','Jette','Evere','Ganshoren',
    'Berchem-Sainte-Agathe','Koekelberg','Molenbeek','Saint-Josse','Bruxelles','Ixelles','Uccle','Schaerbeek','Etterbeek','Forest'
  ];
  postcodes text[] := ARRAY[
    '1000','1050','1030','1180','1040','1070','1190','1060',
    '1200','1150','1160','1170','1090','1140','1083',
    '1082','1081','1080','1210','1000','1050','1180','1030','1040','1190'
  ];
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

  FOR i IN 1..25 LOOP
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
      'Cadre verdoyant et services personnalisés',
      'Groene omgeving en persoonlijke service',
      'Résidence fictive créée pour la démo. Cadre de vie agréable au cœur de Bruxelles, équipe dévouée et prestations sur-mesure pour seniors autonomes ou semi-autonomes.',
      'Fictieve residentie aangemaakt voor demo.',
      (type_codes[1 + (i % 4)])::public.establishment_type,
      (10 + i) || ' Avenue de la Démo',
      postcodes[i],
      cities[i],
      'Bruxelles',
      'Bruxelles-Capitale',
      'BE',
      40 + (i * 3) % 60,
      'contact@demo-' || i || '.be',
      '+32 2 ' || lpad((100 + i)::text, 3, '0') || ' ' || lpad((10 + i)::text, 2, '0') || ' ' || lpad((20 + i)::text, 2, '0'),
      'https://example.be/demo-' || i,
      'published'::public.publication_status,
      now(),
      true
    ) RETURNING id INTO rid;

    FOR j IN 1..(2 + (i % 3)) LOOP
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

      rent_min := 1400 + (i * 30) + (j * 200);
      rent_max := rent_min + 400 + (j * 100);
      charges := 150 + (i % 6) * 50;
      pack := 100 + (i % 4) * 50;

      INSERT INTO public.pricing(
        unit_type_id, occupation_mode, rent_min, rent_max,
        fixed_charges, mandatory_pack, common_options,
        estimated_monthly_min, estimated_monthly_max
      ) VALUES (
        utid, 'rent'::public.occupation_mode, rent_min, rent_max,
        charges, pack, '[]'::jsonb,
        rent_min + charges + pack, rent_max + charges + pack
      );
    END LOOP;

    n_svc := LEAST(svc_count, 10 + (i % 6));
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

    n_act := LEAST(act_count, 6 + (i % 7));
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

    FOR j IN 1..(7 + (i % 5)) LOOP
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
  VALUES (uid, 'DEMO_SEED', 'residences', NULL, jsonb_build_object('count', 25));

  RETURN jsonb_build_object('residences_created', 25);
END $$;