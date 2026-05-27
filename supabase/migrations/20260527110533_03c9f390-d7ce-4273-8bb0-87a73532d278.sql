DO $$
DECLARE
  covers TEXT[] := ARRAY[
    'https://images.pexels.com/photos/1396122/pexels-photo-1396122.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'https://images.pexels.com/photos/1029599/pexels-photo-1029599.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'https://images.pexels.com/photos/1438832/pexels-photo-1438832.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'https://images.pexels.com/photos/2102587/pexels-photo-2102587.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'https://images.pexels.com/photos/1643383/pexels-photo-1643383.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'https://images.pexels.com/photos/1370704/pexels-photo-1370704.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'https://images.pexels.com/photos/2251247/pexels-photo-2251247.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'https://images.pexels.com/photos/1732414/pexels-photo-1732414.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'https://images.pexels.com/photos/1115804/pexels-photo-1115804.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'https://images.pexels.com/photos/1974596/pexels-photo-1974596.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'https://images.pexels.com/photos/2029667/pexels-photo-2029667.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'https://images.pexels.com/photos/1876045/pexels-photo-1876045.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'https://images.pexels.com/photos/2581922/pexels-photo-2581922.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'https://images.pexels.com/photos/1697521/pexels-photo-1697521.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'https://images.pexels.com/photos/2102587/pexels-photo-2102587.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'https://images.pexels.com/photos/1564836/pexels-photo-1564836.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'https://images.pexels.com/photos/1643384/pexels-photo-1643384.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'https://images.pexels.com/photos/2724749/pexels-photo-2724749.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'https://images.pexels.com/photos/3288103/pexels-photo-3288103.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'https://images.pexels.com/photos/2119714/pexels-photo-2119714.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'https://images.pexels.com/photos/2736388/pexels-photo-2736388.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'https://images.pexels.com/photos/1475938/pexels-photo-1475938.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'https://images.pexels.com/photos/2873951/pexels-photo-2873951.jpeg?auto=compress&cs=tinysrgb&w=1200'
  ];
  interiors TEXT[] := ARRAY[
    'https://images.pexels.com/photos/1571453/pexels-photo-1571453.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'https://images.pexels.com/photos/1643383/pexels-photo-1643383.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'https://images.pexels.com/photos/1668928/pexels-photo-1668928.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'https://images.pexels.com/photos/2062426/pexels-photo-2062426.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'https://images.pexels.com/photos/1571471/pexels-photo-1571471.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'https://images.pexels.com/photos/3773571/pexels-photo-3773571.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'https://images.pexels.com/photos/3975590/pexels-photo-3975590.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'https://images.pexels.com/photos/4352247/pexels-photo-4352247.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'https://images.pexels.com/photos/1648776/pexels-photo-1648776.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'https://images.pexels.com/photos/2635038/pexels-photo-2635038.jpeg?auto=compress&cs=tinysrgb&w=1200'
  ];
  rooms TEXT[] := ARRAY[
    'https://images.pexels.com/photos/164595/pexels-photo-164595.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'https://images.pexels.com/photos/271624/pexels-photo-271624.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'https://images.pexels.com/photos/1743229/pexels-photo-1743229.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'https://images.pexels.com/photos/2029731/pexels-photo-2029731.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'https://images.pexels.com/photos/3144580/pexels-photo-3144580.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'https://images.pexels.com/photos/1454806/pexels-photo-1454806.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'https://images.pexels.com/photos/2082087/pexels-photo-2082087.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'https://images.pexels.com/photos/3097112/pexels-photo-3097112.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'https://images.pexels.com/photos/1034584/pexels-photo-1034584.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'https://images.pexels.com/photos/2440471/pexels-photo-2440471.jpeg?auto=compress&cs=tinysrgb&w=1200'
  ];
  gardens TEXT[] := ARRAY[
    'https://images.pexels.com/photos/1105019/pexels-photo-1105019.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'https://images.pexels.com/photos/1379636/pexels-photo-1379636.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'https://images.pexels.com/photos/2113566/pexels-photo-2113566.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'https://images.pexels.com/photos/1643416/pexels-photo-1643416.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'https://images.pexels.com/photos/2132227/pexels-photo-2132227.jpeg?auto=compress&cs=tinysrgb&w=1200'
  ];
  dinings TEXT[] := ARRAY[
    'https://images.pexels.com/photos/67468/pexels-photo-67468.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'https://images.pexels.com/photos/1267320/pexels-photo-1267320.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'https://images.pexels.com/photos/941861/pexels-photo-941861.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'https://images.pexels.com/photos/262978/pexels-photo-262978.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'https://images.pexels.com/photos/1581384/pexels-photo-1581384.jpeg?auto=compress&cs=tinysrgb&w=1200'
  ];
  activities TEXT[] := ARRAY[
    'https://images.pexels.com/photos/3768131/pexels-photo-3768131.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'https://images.pexels.com/photos/3822864/pexels-photo-3822864.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'https://images.pexels.com/photos/3768614/pexels-photo-3768614.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'https://images.pexels.com/photos/4058219/pexels-photo-4058219.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'https://images.pexels.com/photos/3768912/pexels-photo-3768912.jpeg?auto=compress&cs=tinysrgb&w=1200'
  ];
  r RECORD;
  p RECORD;
  r_idx INT := 0;
  p_idx INT := 0;
  pool TEXT[];
  new_url TEXT;
BEGIN
  FOR r IN
    SELECT id FROM public.residences
    WHERE is_demo = true
    ORDER BY created_at
  LOOP
    p_idx := 0;
    FOR p IN
      SELECT id, category::text AS cat
      FROM public.photos
      WHERE residence_id = r.id
      ORDER BY display_order, id
    LOOP
      pool := CASE p.cat
        WHEN 'cover'       THEN covers
        WHEN 'exterior'    THEN gardens
        WHEN 'interior'    THEN interiors
        WHEN 'room'        THEN rooms
        WHEN 'dining'      THEN dinings
        WHEN 'common_area' THEN interiors
        WHEN 'garden'      THEN gardens
        WHEN 'activity'    THEN activities
        WHEN 'medical'     THEN interiors
        ELSE covers
      END;
      new_url := pool[((r_idx * 7 + p_idx) % array_length(pool, 1)) + 1];
      UPDATE public.photos SET storage_path = new_url WHERE id = p.id;
      p_idx := p_idx + 1;
    END LOOP;
    r_idx := r_idx + 1;
  END LOOP;
END $$;