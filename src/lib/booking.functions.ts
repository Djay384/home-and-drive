import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import {
  checkAvailabilitySchema,
  createBookingSchema,
} from "./booking-schemas";
import { computeBookingPlan } from "./booking-pricing";

/**
 * Returns the full active catalog (vehicles, properties, pickup locations)
 * plus, when dates are provided, an `available` flag per item.
 *
 * Availability rule: an item is unavailable when there is at least one
 * overlapping booking with status `paid`, or `pending` and not yet expired.
 */
export const getCatalog = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => checkAvailabilitySchema.parse(input))
  .handler(async ({ data }) => {
    const [vehiclesRes, propertiesRes, locationsRes, bookingsRes] = await Promise.all([
      supabaseAdmin
        .from("vehicles")
        .select("*")
        .eq("is_active", true)
        .order("price_per_day", { ascending: true }),
      supabaseAdmin
        .from("properties")
        .select("*")
        .eq("is_active", true)
        .order("price_per_night", { ascending: true }),
      supabaseAdmin
        .from("pickup_locations")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true }),
      supabaseAdmin
        .from("bookings")
        .select(
          "vehicle_id, vehicle_start, vehicle_end, property_id, property_checkin, property_checkout, payment_status, expires_at",
        )
        .or("payment_status.eq.paid,payment_status.eq.pending")
        .gt("expires_at", new Date().toISOString()),
    ]);

    if (vehiclesRes.error) throw new Error(vehiclesRes.error.message);
    if (propertiesRes.error) throw new Error(propertiesRes.error.message);
    if (locationsRes.error) throw new Error(locationsRes.error.message);
    if (bookingsRes.error) throw new Error(bookingsRes.error.message);

    const bookings = bookingsRes.data ?? [];

    // Vehicle availability check
    const vehicles = (vehiclesRes.data ?? []).map((v) => {
      let available = true;
      if (data.vehicleStartISO && data.vehicleEndISO) {
        const s = new Date(data.vehicleStartISO).getTime();
        const e = new Date(data.vehicleEndISO).getTime();
        for (const b of bookings) {
          if (b.vehicle_id !== v.id || !b.vehicle_start || !b.vehicle_end) continue;
          const bs = new Date(b.vehicle_start).getTime();
          const be = new Date(b.vehicle_end).getTime();
          if (s < be && e > bs) {
            available = false;
            break;
          }
        }
      }
      return { ...v, available };
    });

    // Property availability check (date-only)
    const properties = (propertiesRes.data ?? []).map((p) => {
      let available = true;
      if (data.propertyCheckin && data.propertyCheckout) {
        for (const b of bookings) {
          if (
            b.property_id !== p.id ||
            !b.property_checkin ||
            !b.property_checkout
          )
            continue;
          if (
            data.propertyCheckin < b.property_checkout &&
            data.propertyCheckout > b.property_checkin
          ) {
            available = false;
            break;
          }
        }
      }
      return { ...p, available };
    });

    return {
      vehicles,
      properties,
      locations: locationsRes.data ?? [],
    };
  });

/**
 * Create a pending booking, double-check availability server-side, compute
 * authoritative totals, return booking id + ref. Payment session is created
 * by `createCheckoutSession` once Stripe is enabled.
 */
export const createBooking = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => createBookingSchema.parse(input))
  .handler(async ({ data }) => {
    // Always look up authoritative prices from the database — client input is never trusted.
    const needVehicle =
      (data.bookingType === "vehicle" || data.bookingType === "both") &&
      data.vehicleId &&
      data.vehicleDates;
    const needProperty =
      (data.bookingType === "property" || data.bookingType === "both") &&
      data.propertyId &&
      data.propertyDates;

    const [vehicleRes, propertyRes] = await Promise.all([
      needVehicle && data.vehicleId
        ? supabaseAdmin
            .from("vehicles")
            .select("id, price_per_day, is_active")
            .eq("id", data.vehicleId)
            .single()
        : Promise.resolve({ data: null, error: null } as const),
      needProperty && data.propertyId
        ? supabaseAdmin
            .from("properties")
            .select("id, price_per_night, is_active, capacity")
            .eq("id", data.propertyId)
            .single()
        : Promise.resolve({ data: null, error: null } as const),
    ]);

    if (needVehicle && (vehicleRes.error || !vehicleRes.data)) {
      throw new Error("Véhicule indisponible");
    }
    if (needProperty && (propertyRes.error || !propertyRes.data)) {
      throw new Error("Logement indisponible");
    }

    const plan = computeBookingPlan(
      data,
      vehicleRes.data
        ? {
            id: vehicleRes.data.id,
            price_per_day: Number(vehicleRes.data.price_per_day),
            is_active: vehicleRes.data.is_active,
          }
        : null,
      propertyRes.data
        ? {
            id: propertyRes.data.id,
            price_per_night: Number(propertyRes.data.price_per_night),
            is_active: propertyRes.data.is_active,
            capacity: propertyRes.data.capacity,
          }
        : null,
    );

    // Re-check availability one more time
    const conflictChecks = await Promise.all([
      plan.vehicleId && plan.vehicleStart && plan.vehicleEnd
        ? supabaseAdmin
            .from("bookings")
            .select("id", { count: "exact", head: true })
            .eq("vehicle_id", plan.vehicleId)
            .or("payment_status.eq.paid,payment_status.eq.pending")
            .gt("expires_at", new Date().toISOString())
            .lt("vehicle_start", plan.vehicleEnd)
            .gt("vehicle_end", plan.vehicleStart)
        : Promise.resolve({ count: 0, error: null } as const),
      plan.propertyId && plan.propertyCheckin && plan.propertyCheckout
        ? supabaseAdmin
            .from("bookings")
            .select("id", { count: "exact", head: true })
            .eq("property_id", plan.propertyId)
            .or("payment_status.eq.paid,payment_status.eq.pending")
            .gt("expires_at", new Date().toISOString())
            .lt("property_checkin", plan.propertyCheckout)
            .gt("property_checkout", plan.propertyCheckin)
        : Promise.resolve({ count: 0, error: null } as const),
    ]);
    for (const c of conflictChecks) {
      if ("error" in c && c.error) throw new Error(c.error.message);
      if (c.count && c.count > 0) {
        throw new Error(
          "Une réservation vient d'être prise sur ces dates. Veuillez ajuster votre choix.",
        );
      }
    }

    const { data: booking, error: insertError } = await supabaseAdmin
      .from("bookings")
      .insert({
        booking_type: data.bookingType,
        customer_name: data.customer.name,
        customer_email: data.customer.email,
        customer_phone: data.customer.phone,
        flight_info: data.customer.flight ?? null,
        vehicle_id: plan.vehicleId,
        pickup_location_id: data.vehicleDates?.pickupLocationId ?? null,
        dropoff_location_id: data.vehicleDates?.dropoffLocationId ?? null,
        vehicle_start: plan.vehicleStart,
        vehicle_end: plan.vehicleEnd,
        vehicle_total: plan.vehicleTotal,
        property_id: plan.propertyId,
        property_checkin: plan.propertyCheckin,
        property_checkout: plan.propertyCheckout,
        property_guests: plan.propertyGuests,
        property_total: plan.propertyTotal,
        total_amount: plan.totalAmount,
        deposit_amount: plan.depositAmount,
        payment_mode: plan.paymentMode,
        amount_charged: plan.amountCharged,
        payment_status: "pending",
        expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      })
      .select("id, reference, total_amount, amount_charged, payment_mode")
      .single();

    if (insertError || !booking) {
      throw new Error(insertError?.message ?? "Erreur lors de la création de la réservation");
    }

    return {
      bookingId: booking.id,
      reference: booking.reference,
      totalAmount: Number(booking.total_amount),
      amountCharged: Number(booking.amount_charged),
      paymentMode: booking.payment_mode,
    };
  });
