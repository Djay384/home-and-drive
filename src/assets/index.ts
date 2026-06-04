// Map slug → imported asset URL.
// Catalogue images are bundled at build time so we keep a single source of truth here.
import vehiclePartner from "./vehicle-partner.jpg";
import vehicle208 from "./vehicle-208.jpg";
import vehicle208Manuelle from "./vehicle-208-manuelle.jpg";
import vehicle208Auto from "./vehicle-208-auto.jpg";
import vehiclePandaAuto from "./vehicle-panda-auto.jpg";
import propertyVillaAnse from "./property-villa-anse.jpg";
import propertyBungalow from "./property-bungalow.jpg";
import heroGuadeloupe from "./hero-guadeloupe.jpg";

const IMAGE_MAP: Record<string, string> = {
  "vehicle-partner": vehiclePartner,
  "vehicle-208": vehicle208,
  "vehicle-208-manuelle": vehicle208Manuelle,
  "vehicle-208-auto": vehicle208Auto,
  "vehicle-panda-auto": vehiclePandaAuto,
  "property-villa-anse": propertyVillaAnse,
  "property-bungalow": propertyBungalow,
  "property-bungalow": propertyBungalow,
  "hero-guadeloupe": heroGuadeloupe,
};

export function resolveImage(slug: string | null | undefined): string {
  if (!slug) return heroGuadeloupe;
  return IMAGE_MAP[slug] ?? heroGuadeloupe;
}

export { heroGuadeloupe };
