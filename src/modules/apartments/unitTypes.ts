export const UNIT_TYPES = [
  { value: "chambre", label: "Chambre" },
  { value: "studio", label: "Studio" },
  { value: "appartement", label: "Appartement" },
] as const;

export type UnitTypeValue = (typeof UNIT_TYPES)[number]["value"];
