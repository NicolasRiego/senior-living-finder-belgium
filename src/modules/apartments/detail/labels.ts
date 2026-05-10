// Mapping des codes (DB) vers libellés affichés
export const KITCHEN_LABELS: Record<string, string> = {
  non_equipee: "Non équipée",
  semi_equipee: "Semi-équipée",
  equipee: "Équipée",
  hyper_equipee: "Hyper-équipée",
};

export const BUILDING_STATE_LABELS: Record<string, string> = {
  neuf: "Neuf",
  bon_etat: "Bon état",
  a_renover: "À rénover",
  a_restaurer: "À restaurer",
};

export const FLOORING_LABELS: Record<string, string> = {
  parquet: "Parquet",
  carrelage: "Carrelage",
  moquette: "Moquette",
  beton: "Béton",
  mixte: "Mixte",
};

export const ORIENTATION_LABELS: Record<string, string> = {
  nord: "Nord", sud: "Sud", est: "Est", ouest: "Ouest",
  sud_est: "Sud-Est", sud_ouest: "Sud-Ouest",
  nord_est: "Nord-Est", nord_ouest: "Nord-Ouest",
};

export const PARKING_LABELS: Record<string, string> = {
  interieur: "Intérieur", exterieur: "Extérieur",
  garage: "Garage", box: "Box",
};

export const HEATING_LABELS: Record<string, string> = {
  gaz: "Gaz", electrique: "Électrique", mazout: "Mazout",
  pompe_chaleur: "Pompe à chaleur", geothermique: "Géothermique", pellets: "Pellets",
};

export const HOT_WATER_LABELS: Record<string, string> = {
  gaz: "Gaz", electrique: "Électrique",
  solaire: "Solaire", pompe_chaleur: "Pompe à chaleur",
};

export const INTERNET_LABELS: Record<string, string> = {
  fibre: "Fibre optique", adsl: "ADSL", cable: "Câble",
};

export function energyClassClasses(cls: string | null | undefined): string {
  switch (cls) {
    case "A++": return "bg-green-800 text-white";
    case "A+":  return "bg-green-700 text-white";
    case "A":   return "bg-green-600 text-white";
    case "B":   return "bg-green-400 text-foreground";
    case "C":   return "bg-yellow-400 text-foreground";
    case "D":   return "bg-orange-400 text-foreground";
    case "E":   return "bg-orange-500 text-white";
    case "F":   return "bg-red-500 text-white";
    case "G":   return "bg-red-700 text-white";
    default:    return "bg-muted text-muted-foreground";
  }
}
