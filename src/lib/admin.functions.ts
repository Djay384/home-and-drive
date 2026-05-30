import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

async function assertAdmin(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Accès refusé");
}

export const adminListVehicles = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const { data, error } = await supabaseAdmin
      .from("vehicles")
      .select("id, name, description, price_per_day, category, is_active")
      .order("name", { ascending: true });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

const updateVehicleSchema = z.object({
  id: z.string().uuid(),
  price_per_day: z.number().min(0).max(10000),
  description: z.string().max(500).nullable(),
});

export const adminUpdateVehicle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => updateVehicleSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);

    // Read current values to build audit diff
    const { data: current, error: readErr } = await supabaseAdmin
      .from("vehicles")
      .select("price_per_day, description")
      .eq("id", data.id)
      .single();
    if (readErr || !current) throw new Error(readErr?.message ?? "Véhicule introuvable");

    const { error: updErr } = await supabaseAdmin
      .from("vehicles")
      .update({
        price_per_day: data.price_per_day,
        description: data.description,
        updated_at: new Date().toISOString(),
      })
      .eq("id", data.id);
    if (updErr) throw new Error(updErr.message);

    const audits: Array<{
      vehicle_id: string;
      changed_by: string;
      changed_by_email: string | null;
      field: string;
      old_value: string | null;
      new_value: string | null;
    }> = [];
    const email = (context.claims?.email as string | undefined) ?? null;

    const oldPrice = Number(current.price_per_day);
    if (oldPrice !== data.price_per_day) {
      audits.push({
        vehicle_id: data.id,
        changed_by: context.userId,
        changed_by_email: email,
        field: "price_per_day",
        old_value: String(oldPrice),
        new_value: String(data.price_per_day),
      });
    }
    const oldDesc = current.description ?? null;
    const newDesc = data.description ?? null;
    if (oldDesc !== newDesc) {
      audits.push({
        vehicle_id: data.id,
        changed_by: context.userId,
        changed_by_email: email,
        field: "description",
        old_value: oldDesc,
        new_value: newDesc,
      });
    }

    if (audits.length > 0) {
      const { error: auditErr } = await supabaseAdmin.from("vehicle_audit").insert(audits);
      if (auditErr) console.error("vehicle_audit insert failed", auditErr);
    }

    return { ok: true, changes: audits.length };
  });

export const adminVehicleHistory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ vehicleId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { data: rows, error } = await supabaseAdmin
      .from("vehicle_audit")
      .select("id, field, old_value, new_value, changed_by_email, created_at")
      .eq("vehicle_id", data.vehicleId)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    return rows ?? [];
  });
