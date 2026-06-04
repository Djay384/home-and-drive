import { describe, it, expect } from "vitest";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * SSR / server-side regression test: garantit que les deux logements
 * actifs (Bungalow Petit-Bourg et Villa Petit-Bourg) sont correctement
 * chargés depuis la base avec leurs chambres / lits / salles de bain.
 *
 * Si SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY ne sont pas définis (ex. CI
 * sans secrets), le test est ignoré plutôt que d'échouer.
 */
const hasEnv =
  Boolean(process.env.SUPABASE_URL) && Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);

const d = hasEnv ? describe : describe.skip;

function countBeds(amenities: string[] | null | undefined): number | null {
  if (!amenities) return null;
  for (const a of amenities) {
    const m = a.match(/(\d+)\s*lits?/i);
    if (m) return Number(m[1]);
  }
  return null;
}

function countBathrooms(amenities: string[] | null | undefined): number | null {
  if (!amenities) return null;
  for (const a of amenities) {
    const m = a.match(/(\d+)\s*salles?\s+de\s+bain/i);
    if (m) return Number(m[1]);
  }
  return null;
}

d("properties catalog (SSR data load)", () => {
  it("charge Bungalow Petit-Bourg avec 1 chambre, 2 lits, 1 salle de bain privée", async () => {
    const { data, error } = await supabaseAdmin
      .from("properties")
      .select("name, bedrooms, capacity, amenities, is_active, description")
      .eq("name", "Bungalow Petit-Bourg")
      .single();

    expect(error).toBeNull();
    expect(data).not.toBeNull();
    expect(data!.is_active).toBe(true);
    expect(data!.bedrooms).toBe(1);
    expect(countBeds(data!.amenities)).toBe(2);
    expect(countBathrooms(data!.amenities)).toBe(1);
    expect(data!.amenities.some((a: string) => /salle de bain privée/i.test(a))).toBe(true);
  });

  it("charge Villa Petit-Bourg avec 3 chambres, 4 lits, 2 salles de bain privées", async () => {
    const { data, error } = await supabaseAdmin
      .from("properties")
      .select("name, bedrooms, capacity, amenities, is_active, description")
      .eq("name", "Villa Petit-Bourg")
      .single();

    expect(error).toBeNull();
    expect(data).not.toBeNull();
    expect(data!.is_active).toBe(true);
    expect(data!.bedrooms).toBe(3);
    expect(countBeds(data!.amenities)).toBe(4);
    expect(countBathrooms(data!.amenities)).toBe(2);
    expect(data!.amenities.some((a: string) => /salles? de bain privées?/i.test(a))).toBe(true);
  });

  it("ne retourne que les logements actifs dans le catalogue public", async () => {
    const { data, error } = await supabaseAdmin
      .from("properties")
      .select("name")
      .eq("is_active", true);
    expect(error).toBeNull();
    const names = (data ?? []).map((p) => p.name).sort();
    expect(names).toEqual(["Bungalow Petit-Bourg", "Villa Petit-Bourg"]);
  });
});
