// Types et constantes partagés du formulaire appartement
export const KITCHEN_OPTIONS = [
  { value: "non_equipee", label: "Non équipée" },
  { value: "semi_equipee", label: "Semi-équipée" },
  { value: "equipee", label: "Équipée" },
  { value: "hyper_equipee", label: "Hyper-équipée" },
] as const;

export const BUILDING_STATE_OPTIONS = [
  { value: "neuf", label: "Neuf" },
  { value: "bon_etat", label: "Bon état" },
  { value: "a_renover", label: "À rénover" },
  { value: "a_restaurer", label: "À restaurer" },
] as const;

export const FLOORING_OPTIONS = [
  { value: "parquet", label: "Parquet" },
  { value: "carrelage", label: "Carrelage" },
  { value: "moquette", label: "Moquette" },
  { value: "beton", label: "Béton" },
  { value: "mixte", label: "Mixte" },
] as const;

export const ORIENTATION_OPTIONS = [
  { value: "nord", label: "Nord" },
  { value: "sud", label: "Sud" },
  { value: "est", label: "Est" },
  { value: "ouest", label: "Ouest" },
  { value: "sud_est", label: "Sud-Est" },
  { value: "sud_ouest", label: "Sud-Ouest" },
  { value: "nord_est", label: "Nord-Est" },
  { value: "nord_ouest", label: "Nord-Ouest" },
] as const;

export const PARKING_TYPE_OPTIONS = [
  { value: "interieur", label: "Intérieur" },
  { value: "exterieur", label: "Extérieur" },
  { value: "garage", label: "Garage" },
  { value: "box", label: "Box" },
] as const;

export const HEATING_OPTIONS = [
  { value: "gaz", label: "Gaz" },
  { value: "electrique", label: "Électrique" },
  { value: "mazout", label: "Mazout" },
  { value: "pompe_chaleur", label: "Pompe à chaleur" },
  { value: "geothermique", label: "Géothermique" },
  { value: "pellets", label: "Pellets" },
] as const;

export const HOT_WATER_OPTIONS = [
  { value: "gaz", label: "Gaz" },
  { value: "electrique", label: "Électrique" },
  { value: "solaire", label: "Solaire" },
  { value: "pompe_chaleur", label: "Pompe à chaleur" },
] as const;

export const INTERNET_OPTIONS = [
  { value: "fibre", label: "Fibre optique" },
  { value: "adsl", label: "ADSL" },
  { value: "cable", label: "Câble" },
] as const;

export const ENERGY_CLASS_OPTIONS = [
  "A++", "A+", "A", "B", "C", "D", "E", "F", "G",
] as const;

export const APT_BOOL_FIELDS = [
  ["parking", "Parking"],
  ["cave", "Cave"],
  ["terrace", "Terrasse"],
  ["garden", "Jardin"],
  ["furnished", "Meublé"],
  ["kitchen_equipped", "Cuisine équipée"],
  ["elevator", "Ascenseur"],
  ["wheelchair_accessible", "Accessible PMR"],
] as const;

export type AptBoolField = (typeof APT_BOOL_FIELDS)[number][0];

export type ApartmentFormState = {
  // Identification
  title_fr: string;
  type: string;
  status: "available" | "reserved" | "unavailable";
  available_from: string;
  surface_m2: string;
  floor: string;
  address_complement: string;
  // Transaction
  transaction_type: "rent" | "sale" | "both" | "";
  rent_price: string;
  charges_monthly: string;
  charges_description: string;
  sale_price: string;
  description_fr: string;
  // Général
  bedrooms: string;
  bathrooms: string;
  toilets: string;
  living_room_m2: string;
  kitchen_type: string;
  build_year: string;
  building_floors: string;
  building_state: string;
  // Intérieur
  flooring: string;
  storage_m2: string;
  has_storage: boolean;
  has_laundry: boolean;
  has_dressing: boolean;
  has_office: boolean;
  // Extérieur
  terrace_m2: string;
  garden_m2: string;
  has_balcony: boolean;
  balcony_m2: string;
  orientation: string;
  parking_type: string;
  parking_count: string;
  // Installations
  has_interphone: boolean;
  has_videophone: boolean;
  has_alarm: boolean;
  has_digicode: boolean;
  heating_type: string;
  hot_water: string;
  internet: string;
  // Énergie
  energy_class: string;
  primary_energy: string;
  double_glazing: boolean;
  co2_emission: string;
  // Finances étendues
  agency_fee: string;
  property_tax: string;
  co_ownership_fee: string;
} & Record<AptBoolField, boolean>;

export const emptyForm: ApartmentFormState = {
  title_fr: "", type: "", status: "available", available_from: "",
  surface_m2: "", floor: "", address_complement: "",
  transaction_type: "", rent_price: "", charges_monthly: "", sale_price: "",
  description_fr: "",
  bedrooms: "", bathrooms: "", toilets: "", living_room_m2: "",
  kitchen_type: "", build_year: "", building_floors: "", building_state: "",
  flooring: "", storage_m2: "",
  has_storage: false, has_laundry: false, has_dressing: false, has_office: false,
  terrace_m2: "", garden_m2: "", has_balcony: false, balcony_m2: "",
  orientation: "", parking_type: "", parking_count: "",
  has_interphone: false, has_videophone: false, has_alarm: false, has_digicode: false,
  heating_type: "", hot_water: "", internet: "",
  energy_class: "", primary_energy: "", double_glazing: false, co2_emission: "",
  agency_fee: "", property_tax: "", co_ownership_fee: "",
  parking: false, cave: false, terrace: false, garden: false,
  furnished: false, kitchen_equipped: false, elevator: false, wheelchair_accessible: false,
};

export type ApartmentRow = {
  [K in keyof ApartmentFormState]?: unknown;
} & Record<string, unknown>;

export function rowToForm(a: Record<string, unknown>): ApartmentFormState {
  const s = (v: unknown) => (v == null ? "" : String(v));
  const b = (v: unknown) => v === true;
  return {
    title_fr: s(a.title_fr),
    type: s(a.type),
    status: (a.status as ApartmentFormState["status"]) ?? "available",
    available_from: s(a.available_from),
    surface_m2: s(a.surface_m2),
    floor: s(a.floor),
    address_complement: s(a.address_complement),
    transaction_type: (a.transaction_type as ApartmentFormState["transaction_type"]) ?? "",
    rent_price: s(a.rent_price),
    charges_monthly: s(a.charges_monthly),
    sale_price: s(a.sale_price),
    description_fr: s(a.description_fr),
    bedrooms: s(a.bedrooms),
    bathrooms: s(a.bathrooms),
    toilets: s(a.toilets),
    living_room_m2: s(a.living_room_m2),
    kitchen_type: s(a.kitchen_type),
    build_year: s(a.build_year),
    building_floors: s(a.building_floors),
    building_state: s(a.building_state),
    flooring: s(a.flooring),
    storage_m2: s(a.storage_m2),
    has_storage: b(a.has_storage),
    has_laundry: b(a.has_laundry),
    has_dressing: b(a.has_dressing),
    has_office: b(a.has_office),
    terrace_m2: s(a.terrace_m2),
    garden_m2: s(a.garden_m2),
    has_balcony: b(a.has_balcony),
    balcony_m2: s(a.balcony_m2),
    orientation: s(a.orientation),
    parking_type: s(a.parking_type),
    parking_count: s(a.parking_count),
    has_interphone: b(a.has_interphone),
    has_videophone: b(a.has_videophone),
    has_alarm: b(a.has_alarm),
    has_digicode: b(a.has_digicode),
    heating_type: s(a.heating_type),
    hot_water: s(a.hot_water),
    internet: s(a.internet),
    energy_class: s(a.energy_class),
    primary_energy: s(a.primary_energy),
    double_glazing: b(a.double_glazing),
    co2_emission: s(a.co2_emission),
    agency_fee: s(a.agency_fee),
    property_tax: s(a.property_tax),
    co_ownership_fee: s(a.co_ownership_fee),
    parking: b(a.parking),
    cave: b(a.cave),
    terrace: b(a.terrace),
    garden: b(a.garden),
    furnished: b(a.furnished),
    kitchen_equipped: b(a.kitchen_equipped),
    elevator: b(a.elevator),
    wheelchair_accessible: b(a.wheelchair_accessible),
  };
}

export function formToPayload(form: ApartmentFormState, residenceId: string) {
  const numOrNull = (v: string) => (v.trim() === "" ? null : Number(v));
  const strOrNull = (v: string) => (v.trim() === "" ? null : v.trim());
  const tx = form.transaction_type;
  return {
    residence_id: residenceId,
    title_fr: form.title_fr.trim(),
    title_nl: form.title_fr.trim(),
    type: form.type,
    status: form.status,
    available_from: form.available_from || null,
    surface_m2: Number(form.surface_m2),
    floor: Number(form.floor),
    address_complement: strOrNull(form.address_complement),
    transaction_type: tx,
    rent_price: tx !== "sale" && form.rent_price ? Number(form.rent_price) : null,
    charges_monthly: tx !== "sale" && form.charges_monthly ? Number(form.charges_monthly) : null,
    sale_price: tx !== "rent" && form.sale_price ? Number(form.sale_price) : null,
    description_fr: strOrNull(form.description_fr),
    parking: form.parking, cave: form.cave, terrace: form.terrace, garden: form.garden,
    furnished: form.furnished, kitchen_equipped: form.kitchen_equipped,
    elevator: form.elevator, wheelchair_accessible: form.wheelchair_accessible,
    bedrooms: numOrNull(form.bedrooms),
    bathrooms: numOrNull(form.bathrooms),
    toilets: numOrNull(form.toilets),
    living_room_m2: numOrNull(form.living_room_m2),
    kitchen_type: strOrNull(form.kitchen_type),
    build_year: numOrNull(form.build_year),
    building_floors: numOrNull(form.building_floors),
    building_state: strOrNull(form.building_state),
    flooring: strOrNull(form.flooring),
    has_storage: form.has_storage,
    storage_m2: form.has_storage ? numOrNull(form.storage_m2) : null,
    has_laundry: form.has_laundry,
    has_dressing: form.has_dressing,
    has_office: form.has_office,
    terrace_m2: form.terrace ? numOrNull(form.terrace_m2) : null,
    garden_m2: form.garden ? numOrNull(form.garden_m2) : null,
    has_balcony: form.has_balcony,
    balcony_m2: form.has_balcony ? numOrNull(form.balcony_m2) : null,
    orientation: strOrNull(form.orientation),
    parking_type: form.parking ? strOrNull(form.parking_type) : null,
    parking_count: form.parking ? numOrNull(form.parking_count) : null,
    has_lift: form.elevator,
    has_interphone: form.has_interphone,
    has_videophone: form.has_videophone,
    has_alarm: form.has_alarm,
    has_digicode: form.has_digicode,
    heating_type: strOrNull(form.heating_type),
    hot_water: strOrNull(form.hot_water),
    internet: strOrNull(form.internet),
    energy_class: strOrNull(form.energy_class),
    primary_energy: numOrNull(form.primary_energy),
    double_glazing: form.double_glazing,
    co2_emission: strOrNull(form.co2_emission),
    agency_fee: numOrNull(form.agency_fee),
    property_tax: numOrNull(form.property_tax),
    co_ownership_fee: numOrNull(form.co_ownership_fee),
  };
}
