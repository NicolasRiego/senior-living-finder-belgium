import type { ResidenceType } from "./types";

export interface Residence {
  id: string;
  slug: string;
  name: string;
  type: ResidenceType;
  city: string;
  region: "Bruxelles" | "Wallonie" | "Flandre";
  shortDescription: string;
  description: string;
  image: string;
  priceFrom: number; // EUR / month
  capacity: number;
  services: string[];
  rating: number;
  featured?: boolean;
}

export const residences: Residence[] = [
  {
    id: "r1",
    slug: "residence-les-tilleuls-uccle",
    name: "Résidence Les Tilleuls",
    type: "services",
    city: "Uccle",
    region: "Bruxelles",
    shortDescription: "Appartements lumineux dans un parc arboré au sud de Bruxelles.",
    description:
      "Nichée dans un écrin de verdure à Uccle, la Résidence Les Tilleuls propose 84 appartements service spacieux, alliant confort et autonomie. Restaurant, espace bien-être et programme d'activités quotidien.",
    image: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1200&q=80",
    priceFrom: 1850,
    capacity: 84,
    services: ["Restaurant", "Bien-être", "Activités", "Conciergerie", "Jardin", "Soins infirmiers"],
    rating: 4.7,
    featured: true,
  },
  {
    id: "r2",
    slug: "seigneurie-du-lac-genval",
    name: "Seigneurie du Lac",
    type: "seigneurie",
    city: "Genval",
    region: "Wallonie",
    shortDescription: "Demeure de caractère face au lac, ambiance familiale.",
    description:
      "Ancienne demeure rénovée avec soin, la Seigneurie du Lac offre 42 chambres avec vue sur l'eau, une cuisine de saison et une équipe attentionnée disponible 24h/24.",
    image: "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=1200&q=80",
    priceFrom: 2250,
    capacity: 42,
    services: ["Vue lac", "Cuisine maison", "24h/24", "Kinésithérapie", "Coiffeur", "Chapelle"],
    rating: 4.9,
    featured: true,
  },
  {
    id: "r3",
    slug: "maison-de-repos-clairvallon-namur",
    name: "Clairvallon",
    type: "repos_soins",
    city: "Namur",
    region: "Wallonie",
    shortDescription: "Maison de repos et de soins moderne, équipe pluridisciplinaire.",
    description:
      "Établissement récent au cœur de Namur, accueillant 120 résidents avec un accompagnement médical complet. Unité spécialisée pour personnes désorientées.",
    image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200&q=80",
    priceFrom: 1980,
    capacity: 120,
    services: ["Médical 24h", "Unité Alzheimer", "Kiné", "Ergothérapie", "Restaurant", "Jardin sensoriel"],
    rating: 4.5,
    featured: true,
  },
  {
    id: "r4",
    slug: "residence-saint-jean-liege",
    name: "Résidence Saint-Jean",
    type: "repos",
    city: "Liège",
    region: "Wallonie",
    shortDescription: "Au cœur de Liège, ambiance chaleureuse et soins attentifs.",
    description:
      "Maison de repos historique entièrement rénovée, à deux pas du centre de Liège. 68 chambres individuelles avec salle de bain privative.",
    image: "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=1200&q=80",
    priceFrom: 1720,
    capacity: 68,
    services: ["Centre-ville", "Chambres privées", "Animations", "Restaurant", "Terrasse"],
    rating: 4.4,
  },
  {
    id: "r5",
    slug: "park-residentie-antwerpen",
    name: "Park Residentie Antwerpen",
    type: "services",
    city: "Antwerpen",
    region: "Flandre",
    shortDescription: "Service-residentie modern, in een rustig stadspark.",
    description:
      "Résidence-services contemporaine située dans un quartier paisible d'Anvers, avec 96 appartements modernes et une vue dégagée sur le parc municipal.",
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80",
    priceFrom: 1990,
    capacity: 96,
    services: ["Parc", "Piscine", "Restaurant", "Salle de sport", "Conciergerie", "Soins"],
    rating: 4.6,
    featured: true,
  },
  {
    id: "r6",
    slug: "domaine-des-roses-mons",
    name: "Domaine des Roses",
    type: "seigneurie",
    city: "Mons",
    region: "Wallonie",
    shortDescription: "Cadre champêtre avec roseraie et activités jardinage.",
    description:
      "Petit domaine intimiste de 36 chambres dans un parc fleuri à proximité de Mons. Ateliers jardinage, cuisine et lecture chaque semaine.",
    image: "https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=1200&q=80",
    priceFrom: 2100,
    capacity: 36,
    services: ["Roseraie", "Ateliers", "Cuisine maison", "Bibliothèque", "Soins"],
    rating: 4.8,
  },
  {
    id: "r7",
    slug: "residence-bel-air-gent",
    name: "Bel Air Gent",
    type: "services",
    city: "Gent",
    region: "Flandre",
    shortDescription: "Vie autonome avec services à la carte au cœur de Gand.",
    description:
      "62 appartements lumineux avec terrasse, à proximité immédiate du centre de Gand. Tous les services hôteliers à la demande.",
    image: "https://images.unsplash.com/photo-1571055107559-3e67626fa8be?w=1200&q=80",
    priceFrom: 1880,
    capacity: 62,
    services: ["Terrasses", "Hôtelier à la carte", "Restaurant", "Bien-être", "Jardin"],
    rating: 4.6,
  },
  {
    id: "r8",
    slug: "maison-soleil-charleroi",
    name: "Maison du Soleil",
    type: "repos",
    city: "Charleroi",
    region: "Wallonie",
    shortDescription: "Tarifs accessibles et accompagnement humain.",
    description:
      "Maison de repos accessible avec une équipe stable et bienveillante. 54 chambres confortables, ateliers et sorties hebdomadaires.",
    image: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=1200&q=80",
    priceFrom: 1480,
    capacity: 54,
    services: ["Tarifs sociaux", "Ateliers", "Sorties", "Restaurant", "Jardin"],
    rating: 4.3,
  },
];

export function getResidenceBySlug(slug: string): Residence | undefined {
  return residences.find((r) => r.slug === slug);
}
