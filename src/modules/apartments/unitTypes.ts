export const UNIT_TYPES = [
  { value: "studio", label: "Studio" },
  { value: "appartement", label: "Appartement" },
  { value: "chambre", label: "Chambre" },
  { value: "duplex", label: "Duplex" },
  { value: "triplex", label: "Triplex" },
  { value: "penthouse", label: "Penthouse" },
  { value: "loft", label: "Loft" },
  { value: "villa", label: "Villa" },
  { value: "bungalow", label: "Bungalow" },
  { value: "suite", label: "Suite senior" },
] as const;

export type UnitTypeValue = (typeof UNIT_TYPES)[number]["value"];
