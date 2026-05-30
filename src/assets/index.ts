// Map slug → imported asset URL.
// Catalogue images are bundled at build time so we keep a single source of truth here.
import vehicleCitadine from "./vehicle-citadine.jpg";
import vehicleSuv from "./vehicle-suv.jpg";
import vehicleCabriolet from "./vehicle-cabriolet.jpg";
import vehicle4x4 from "./vehicle-4x4.jpg";
import propertyVillaAnse from "./property-villa-anse.jpg";
import propertyBungalow from "./property-bungalow.jpg";
import propertyVillaCreole from "./property-villa-creole.jpg";
import heroGuadeloupe from "./hero-guadeloupe.jpg";

const IMAGE_MAP: Record<string, string> = {
  "vehicle-citadine": vehicleCitadine,
  "vehicle-suv": vehicleSuv,
  "vehicle-cabriolet": vehicleCabriolet,
  "vehicle-4x4": vehicle4x4,
  "property-villa-anse": propertyVillaAnse,
  "property-bungalow": propertyBungalow,
  "property-villa-creole": propertyVillaCreole,
  "hero-guadeloupe": heroGuadeloupe,
};

export function resolveImage(slug: string | null | undefined): string {
  if (!slug) return heroGuadeloupe;
  return IMAGE_MAP[slug] ?? heroGuadeloupe;
}

export { heroGuadeloupe };
