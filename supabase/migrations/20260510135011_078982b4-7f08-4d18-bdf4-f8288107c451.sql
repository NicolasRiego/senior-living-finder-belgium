
CREATE OR REPLACE FUNCTION public.update_demo_photos_unsplash()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  covers TEXT[] := ARRAY[
    'photo-1564013799919-ab600027ffc6','photo-1600596542815-ffad4c1539a9','photo-1568605114967-8130f3a36994',
    'photo-1600585154340-be6161a56a0c','photo-1512917774080-9991f1c4c750','photo-1580587771525-78b9dba3b914',
    'photo-1523217582562-09d0def993a6','photo-1570129477492-45c003edd2be','photo-1449844908441-8829872d2607',
    'photo-1613490493576-7c5c5b853dd2','photo-1605276374104-dee2a0ed3cd6','photo-1599427303058-f04cbcf4756f',
    'photo-1583608205776-bfd35f0d9f83','photo-1592595896551-12b371d546d5','photo-1558036117-15d82a90b9b1',
    'photo-1486325212027-8081e485255e','photo-1576941089067-2de3c901e126','photo-1502005229762-cf1b2da7c5d6',
    'photo-1560185007-c5ca9d2c014d','photo-1574362848149-11496d93a7c7'
  ];
  exteriors TEXT[] := ARRAY[
    'photo-1416879595882-3373a0480b5b','photo-1585320806297-9794b3e4eeae','photo-1416331329987-c1f73b3abdb5',
    'photo-1463936575829-25148e1db1b8','photo-1501854140801-50d01698950b','photo-1441974231531-c6227db76b6e',
    'photo-1506905925346-21bda4d32df4','photo-1470252649378-9c29740c9fa8','photo-1518173946687-a4c8892bbd9f',
    'photo-1469474968028-56623f02e42e','photo-1426604966848-d7adac402bff','photo-1444492156724-6383118f4213',
    'photo-1475924156734-496f6cac6ec1','photo-1500534314209-a25ddb2bd429','photo-1448375240586-882707db888b',
    'photo-1528360983277-13d401cdc186','photo-1507003211169-0a1dd7228f2d','photo-1494548162494-384bba4ab999',
    'photo-1455218873509-8097305ee378','photo-1465226407-11e60d14b7d8'
  ];
  interiors TEXT[] := ARRAY[
    'photo-1567767292278-a4f21aa2d36e','photo-1616594039964-ae9021a400a0','photo-1586023492125-27b2c045efd7',
    'photo-1560448204-e02f11c3d0e2','photo-1555041469-a586c61ea9bc','photo-1497366216548-37526070297c',
    'photo-1529408686214-b48b8532f72c','photo-1484101403633-562f891dc89a','photo-1493809842364-78817add7ffb',
    'photo-1524758631624-e2822e304c36','photo-1600210491369-e753d80a41f3','photo-1505693416388-ac5ce068fe85',
    'photo-1618221195710-dd6b41faaea6','photo-1600607687939-ce8a6c25118c','photo-1600566753190-17f0baa2a6c3',
    'photo-1600573472592-401b489a3cdc','photo-1598928506311-c55ded91a20c','photo-1583847268964-b28dc8f51f92',
    'photo-1572120360610-d971b9d7767c','photo-1556909114-f6e7ad7d3136'
  ];
  rooms TEXT[] := ARRAY[
    'photo-1631049307264-da0ec9d70304','photo-1540518614846-7eded433c457','photo-1618773928121-c32242e63f39',
    'photo-1522771739844-6a9f6d5f14af','photo-1556909114-f6e7ad7d3136','photo-1588046130717-0eb0c9a3ba15',
    'photo-1595526114035-0d45ed16cfbf','photo-1566665797739-1674de7a421a','photo-1505693416388-ac5ce068fe85',
    'photo-1522708323590-d24dbb6b0267','photo-1502672260266-1c1ef2d93688','photo-1536376072261-38c75010e6c9',
    'photo-1484154218962-a197022b5858','photo-1507652313519-d4e9174996dd','photo-1616047006789-b7af5afb8c20',
    'photo-1560185893-a55cbc8c57e8','photo-1598928636135-d146006ff4be','photo-1630699144867-37acec97df5a',
    'photo-1614515791960-13e87b6c1d9c','photo-1578683010236-d716f9a3f461'
  ];
  dinings TEXT[] := ARRAY[
    'photo-1414235077428-338989a2e8c0','photo-1517248135467-4c7edcad34c4','photo-1424847651672-bf20a4b0982b',
    'photo-1466978913421-dad2ebd01d17','photo-1559339352-11d035aa65de','photo-1550966871-3ed3cbe818bb',
    'photo-1537047902294-62a40c20a6ae','photo-1544148103-0773bf10d330','photo-1552566626-52f8b828add9',
    'photo-1521017432531-fbd92d768814','photo-1590846406792-0adc7f938f1d','photo-1574936811293-e1bf8b2fe9b1',
    'photo-1530062845289-9109b2c9c868','photo-1565895405138-6c3a1555da6a','photo-1555396273-367ea4eb4db5',
    'photo-1525610553991-2bede1a236e2','photo-1564758895018-5f4f39dda33c','photo-1582578598774-a5f42ad97dde',
    'photo-1568901346375-23c9450c58cd','photo-1504674900247-0877df9cc836'
  ];
  commons TEXT[] := ARRAY[
    'photo-1497366216548-37526070297c','photo-1529408686214-b48b8532f72c','photo-1497366811353-6870744d04b2',
    'photo-1504384308090-c894fdcc538d','photo-1497366754035-f200968a6e72','photo-1524758631624-e2822e304c36',
    'photo-1486946255434-2466348c2166','photo-1462826303086-329426d1aef5','photo-1497366412874-3415097a27e7',
    'photo-1503387762-592deb58ef4e','photo-1568992687947-868a62a9f521','photo-1497366672149-e5e4b4d34eb3',
    'photo-1497366858526-0766c08e5e86','photo-1497366838519-8ce5f4c0f5b8','photo-1497366893323-6acba5b9f8be',
    'photo-1534438327276-14e5300c3a48','photo-1497366935289-39b3f0a62a0c','photo-1497366089276-0c64a66a5e3c',
    'photo-1497366966494-b47c09ee9c95','photo-1542621334-a254cf47733d'
  ];
  activities TEXT[] := ARRAY[
    'photo-1529156069898-49953e39b3ac','photo-1528715471579-d1bcf0ba5e83','photo-1571019613454-1cb2f99b2d8b',
    'photo-1576678927484-cc907957088c','photo-1552674605-db6ffd4facb5','photo-1517931524326-bdd55a541177',
    'photo-1539794830467-1f1755804d13','photo-1574279606130-09958dc756f7','photo-1594381898411-846e7d193883',
    'photo-1593941707882-a5bba13938c1','photo-1571019614242-c5c5dee9f50b','photo-1541534741688-6078c6bfb5c5',
    'photo-1547592180-85f173990554','photo-1477332552946-cfb384aeaf1c','photo-1598966739654-5e9a252d8c32'
  ];
  pool TEXT[];
  pool_size int;
  rec RECORD;
  pool_idx int;
  sig int;
  new_url text;
  updated_count int := 0;
BEGIN
  FOR rec IN
    SELECT
      p.id,
      p.category::text AS category,
      DENSE_RANK() OVER (ORDER BY r.created_at, r.id) - 1 AS r_idx,
      ROW_NUMBER() OVER (PARTITION BY p.residence_id ORDER BY p.display_order, p.id) - 1 AS p_idx
    FROM public.photos p
    JOIN public.residences r ON r.id = p.residence_id
    WHERE r.is_demo = true
  LOOP
    pool := CASE rec.category
      WHEN 'cover' THEN covers
      WHEN 'exterior' THEN exteriors
      WHEN 'interior' THEN interiors
      WHEN 'room' THEN rooms
      WHEN 'dining' THEN dinings
      WHEN 'common_area' THEN commons
      WHEN 'garden' THEN exteriors
      WHEN 'activity' THEN activities
      WHEN 'medical' THEN interiors
      ELSE interiors
    END;
    pool_size := array_length(pool, 1);
    sig := (rec.r_idx * 10 + rec.p_idx);
    pool_idx := (sig % pool_size) + 1;
    new_url := 'https://images.unsplash.com/' || pool[pool_idx]
      || '?w=1200&q=85&sig=' || sig::text;

    UPDATE public.photos SET storage_path = new_url WHERE id = rec.id;
    updated_count := updated_count + 1;
  END LOOP;

  RETURN updated_count;
END;
$$;

SELECT public.update_demo_photos_unsplash();
