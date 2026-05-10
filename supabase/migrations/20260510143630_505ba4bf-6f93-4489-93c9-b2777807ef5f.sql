ALTER TABLE public.apartments
  ADD COLUMN IF NOT EXISTS bedrooms          INTEGER DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS bathrooms         INTEGER DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS toilets           INTEGER DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS living_room_m2    INTEGER DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS kitchen_type      TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS building_floors   INTEGER DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS build_year        INTEGER DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS building_state    TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS has_storage       BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS storage_m2        INTEGER DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS has_laundry       BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_dressing      BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_office        BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS flooring          TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS terrace_m2        INTEGER DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS garden_m2         INTEGER DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS has_balcony       BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS balcony_m2        INTEGER DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS orientation       TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS parking_type      TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS parking_count     INTEGER DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS has_lift          BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_interphone    BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_videophone    BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_alarm         BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_digicode      BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS heating_type      TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS hot_water         TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS internet          TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS energy_class      TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS primary_energy    INTEGER DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS double_glazing    BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS co2_emission      TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS agency_fee        INTEGER DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS property_tax      INTEGER DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS co_ownership_fee  INTEGER DEFAULT NULL;

ALTER TABLE public.apartments
  ADD CONSTRAINT apartments_kitchen_type_check
    CHECK (kitchen_type IS NULL OR kitchen_type IN ('non_equipee','semi_equipee','equipee','hyper_equipee')),
  ADD CONSTRAINT apartments_building_state_check
    CHECK (building_state IS NULL OR building_state IN ('neuf','bon_etat','a_renover','a_restaurer')),
  ADD CONSTRAINT apartments_flooring_check
    CHECK (flooring IS NULL OR flooring IN ('parquet','carrelage','moquette','beton','mixte')),
  ADD CONSTRAINT apartments_orientation_check
    CHECK (orientation IS NULL OR orientation IN ('nord','sud','est','ouest','sud_est','sud_ouest','nord_est','nord_ouest')),
  ADD CONSTRAINT apartments_parking_type_check
    CHECK (parking_type IS NULL OR parking_type IN ('interieur','exterieur','garage','box')),
  ADD CONSTRAINT apartments_heating_type_check
    CHECK (heating_type IS NULL OR heating_type IN ('gaz','electrique','mazout','pompe_chaleur','geothermique','pellets')),
  ADD CONSTRAINT apartments_hot_water_check
    CHECK (hot_water IS NULL OR hot_water IN ('gaz','electrique','solaire','pompe_chaleur')),
  ADD CONSTRAINT apartments_internet_check
    CHECK (internet IS NULL OR internet IN ('fibre','adsl','cable')),
  ADD CONSTRAINT apartments_energy_class_check
    CHECK (energy_class IS NULL OR energy_class IN ('A++','A+','A','B','C','D','E','F','G'));