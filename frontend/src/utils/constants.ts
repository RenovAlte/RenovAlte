export const RENOVATIONGOALS = [
  "Energy Efficiency",
  "Insulation",
  "Windows & Doors",
  "Heating System",
  "Solar Panels",
  "Bathroom",
  "Kitchen",
  "Roof",
];

export const HEATING_SYSTEM_OPTIONS = [
  { value: "gas", label: "Gas" },
  { value: "oil", label: "Oil" },
  { value: "electric", label: "Electric" },
  { value: "heat-pump", label: "Heat pump" },
  { value: "district-heating", label: "District Heating (Fernwärme)" },
  { value: "wood-pellet", label: "Wood Pellet" },
];

export const INSULATION_OPTIONS = [
  { value: "none", label: "None" },
  { value: "partial", label: "Partial (specify area like roof/attic)" },
  { value: "full-old", label: "Full (but old)" },
  { value: "unknown", label: "Unknown" },
];

export const BUILDING_TYPES = [
  { value: "single-family", label: "Single Family Home" },
  { value: "multi-family", label: "Multi-Family Home" },
  { value: "apartment", label: "Apartment" },
  { value: "commercial", label: "Commercial Building" },
];

export const BUNDESLAND = [
  { value: "baden-wuerttemberg", label: "Baden-Württemberg" },
  { value: "bavaria", label: "Bavaria (Bayern)" },
  { value: "berlin", label: "Berlin" },
  { value: "brandenburg", label: "Brandenburg" },
  { value: "bremen", label: "Bremen" },
  { value: "hamburg", label: "Hamburg" },
  { value: "hesse", label: "Hesse (Hessen)" },
  {
    value: "mecklenburg-vorpommern",
    label: "Mecklenburg-Vorpommern",
  },
  {
    value: "lower-saxony",
    label: "Lower Saxony (Niedersachsen)",
  },
  {
    value: "north-rhine-westphalia",
    label: "North Rhine-Westphalia (Nordrhein-Westfalen)",
  },
  {
    value: "rhineland-palatinate",
    label: "Rhineland-Palatinate (Rheinland-Pfalz)",
  },
  { value: "saarland", label: "Saarland" },
  { value: "saxony", label: "Saxony (Sachsen)" },
  {
    value: "saxony-anhalt",
    label: "Saxony-Anhalt (Sachsen-Anhalt)",
  },
  { value: "schleswig-holstein", label: "Schleswig-Holstein" },
  { value: "thuringia", label: "Thuringia (Thüringen)" },
];

export const WINDOWS_TYPE_OPTIONS = [
  { value: "single-pane", label: "Single-pane" },
  { value: "double-pane", label: "Double-pane (older)" },
  { value: "triple-pane", label: "Triple-pane (modern)" },
];

export const NEIGHBOR_IMPACTS_OPTIONS = [
  { value: "party-wall", label: "Party wall changes" },
  { value: "scaffolding", label: "Scaffolding over neighbor property" },
  { value: "noise-windows", label: "Noise time windows" },
];
