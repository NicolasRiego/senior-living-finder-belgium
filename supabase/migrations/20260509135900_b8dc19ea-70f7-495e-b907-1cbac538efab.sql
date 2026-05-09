UPDATE public.be_postal_codes
SET ville_fr = 'Bruxelles'
WHERE region = 'Bruxelles'
  AND code_postal IN (
    '1000','1020','1030','1040','1050','1060',
    '1070','1080','1081','1082','1083','1090',
    '1120','1130','1140','1150','1160','1170',
    '1180','1190','1200','1210'
  );

UPDATE public.be_postal_codes
SET ville_fr = 'Liège'
WHERE code_postal IN (
  '4020','4030','4031','4032','4040','4041','4042',
  '4050','4051','4052','4053','4100','4101','4102'
);

UPDATE public.be_postal_codes
SET ville_fr = 'Charleroi'
WHERE code_postal IN (
  '6001','6010','6020','6030','6031','6032',
  '6040','6041','6042','6060','6061'
);

UPDATE public.be_postal_codes
SET ville_fr = 'Gand'
WHERE code_postal IN (
  '9030','9031','9032','9040','9041','9042',
  '9050','9051','9052'
);

UPDATE public.be_postal_codes
SET ville_fr = 'Anvers'
WHERE code_postal IN (
  '2020','2030','2040','2050','2060',
  '2100','2140','2170','2180',
  '2600','2610','2660'
);

UPDATE public.be_postal_codes
SET ville_fr = 'Mons'
WHERE code_postal IN (
  '7010','7011','7012','7020','7021',
  '7022','7030','7033','7034'
);