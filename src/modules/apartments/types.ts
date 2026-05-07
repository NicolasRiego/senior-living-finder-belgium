export type ApartmentType = "appartement" | "chambre" | "studio";
export type TransactionType = "sale" | "rent" | "both";
export type ApartmentStatus = "available" | "reserved" | "unavailable";

export type ApartmentSearchRow = {
  id: string;
  residence_id: string;
  residence_slug: string;
  residence_nom_fr: string;
  residence_nom_nl: string | null;
  ville: string | null;
  region: string | null;
  province: string | null;
  code_postal: string | null;
  type: ApartmentType | null;
  surface_m2: number | null;
  floor: number | null;
  sale_price: number | null;
  rent_price: number | null;
  transaction_type: TransactionType | null;
  parking: boolean;
  cave: boolean;
  terrace: boolean;
  garden: boolean;
  furnished: boolean;
  kitchen_equipped: boolean;
  elevator: boolean;
  wheelchair_accessible: boolean;
  available_from: string | null;
  status: ApartmentStatus;
  description_fr: string | null;
  description_nl: string | null;
  cover_path: string | null;
};

export type TxFilter = "sale" | "rent" | "all";

export type ApartmentFilters = {
  tx: TxFilter;
  country: "BE" | "FR";
  code_postal?: string;
  type?: ApartmentType;
  surface_min?: number;
  sale_max?: number;
  rent_max?: number;
  parking?: boolean;
  cave?: boolean;
  terrace?: boolean;
  garden?: boolean;
  furnished?: boolean;
  kitchen_equipped?: boolean;
  elevator?: boolean;
  wheelchair_accessible?: boolean;
  page?: number;
  pageSize?: number;
};

export const APT_BOOL_FIELDS = [
  "parking",
  "cave",
  "terrace",
  "garden",
  "furnished",
  "kitchen_equipped",
  "elevator",
  "wheelchair_accessible",
] as const satisfies readonly (keyof ApartmentFilters)[];

export const APT_BOOL_LABELS: Record<(typeof APT_BOOL_FIELDS)[number], string> = {
  parking: "Parking",
  cave: "Cave",
  terrace: "Terrasse",
  garden: "Jardin",
  furnished: "Meublé",
  kitchen_equipped: "Cuisine équipée",
  elevator: "Ascenseur",
  wheelchair_accessible: "Accessible PMR",
};
