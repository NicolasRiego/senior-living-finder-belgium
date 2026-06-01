import type { ApartmentFormState } from "./types";

export type StepKey =
  | "identification"
  | "location"
  | "transaction"
  | "general"
  | "interior"
  | "exterior"
  | "installations"
  | "energy"
  | "finances"
  | "equipments"
  | "description"
  | "photos";

export type StepDef = {
  key: StepKey;
  label: string;
  fields: ReadonlyArray<keyof ApartmentFormState>;
};

export const APT_STEPS: StepDef[] = [
  {
    key: "identification",
    label: "Identification",
    fields: ["title_fr", "type", "status", "available_from"],
  },
  {
    key: "location",
    label: "Superficie & localisation",
    fields: ["surface_m2", "floor", "address_complement"],
  },
  {
    key: "transaction",
    label: "Transaction & prix",
    fields: ["transaction_type", "rent_price", "charges_monthly", "charges_description", "sale_price"],
  },
  {
    key: "general",
    label: "Général",
    fields: [
      "bedrooms", "bathrooms", "toilets", "living_room_m2",
      "kitchen_type", "build_year", "building_floors", "building_state",
    ],
  },
  {
    key: "interior",
    label: "Intérieur",
    fields: [
      "flooring", "has_storage", "storage_m2",
      "has_laundry", "has_dressing", "has_office",
    ],
  },
  {
    key: "exterior",
    label: "Extérieur",
    fields: [
      "terrace", "terrace_m2", "garden", "garden_m2",
      "has_balcony", "balcony_m2", "orientation",
      "parking", "parking_type", "parking_count",
    ],
  },
  {
    key: "installations",
    label: "Installations",
    fields: [
      "elevator", "has_interphone", "has_videophone",
      "has_alarm", "has_digicode",
      "heating_type", "hot_water", "internet",
    ],
  },
  {
    key: "energy",
    label: "Énergie",
    fields: ["energy_class", "primary_energy", "double_glazing", "co2_emission"],
  },
  {
    key: "finances",
    label: "Finances complémentaires",
    fields: ["agency_fee", "property_tax", "co_ownership_fee", "co_ownership_included", "co_ownership_description", "additional_charges"],
  },
  {
    key: "equipments",
    label: "Équipements",
    fields: ["cave", "furnished", "kitchen_equipped", "wheelchair_accessible"],
  },
  {
    key: "description",
    label: "Description",
    fields: ["description_fr"],
  },
  {
    key: "photos",
    label: "Photos",
    fields: [],
  },
];
