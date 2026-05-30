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
    // Compute durations and totals authoritatively (never trust client)
    let vehicleTotal = 0;
    let vehicleStart: string | null = null;
    let vehicleEnd: string | null = null;
    let vehicleId: string | null = null;

    if (
      (data.bookingType === "vehicle" || data.bookingType === "both") &&
      data.vehicleId &&
      data.vehicleDates
    ) {
      const { data: vehicle, error } = await supabaseAdmin
        .from("vehicles")
        .select("id, price_per_day, is_active")
        .eq("id", data.vehicleId)
        .single();
      if (error || !vehicle || !vehicle.is_active) {
        throw new Error("Véhicule indisponible");
      }
      const s = new Date(data.vehicleDates.startISO);
      const e = new Date(data.vehicleDates.endISO);
      if (e.getTime() <= s.getTime()) {
        throw new Error("Dates de location véhicule invalides");
      }
      const days = Math.max(
        1,
        Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)),
      );
      vehicleTotal = Number(vehicle.price_per_day) * days;
      vehicleStart = data.vehicleDates.startISO;
      vehicleEnd = data.vehicleDates.endISO;
      vehicleId = vehicle.id;
    }

    let propertyTotal = 0;
    let propertyCheckin: string | null = null;
    let propertyCheckout: string | null = null;
    let propertyId: string | null = null;
    let propertyGuests: number | null = null;

    if (
      (data.bookingType === "property" || data.bookingType === "both") &&
      data.propertyId &&
      data.propertyDates
    ) {
      const { data: property, error } = await supabaseAdmin
        .from("properties")
        .select("id, price_per_night, is_active, capacity")
        .eq("id", data.propertyId)
        .single();
      if (error || !property || !property.is_active) {
        throw new Error("Logement indisponible");
      }
      if (data.propertyDates.guests > property.capacity) {
        throw new Error(`Capacité maximale dépassée (${property.capacity} voyageurs)`);
      }
      const s = new Date(data.propertyDates.checkin + "T00:00:00Z");
      const e = new Date(data.propertyDates.checkout + "T00:00:00Z");
      if (e.getTime() <= s.getTime()) {
        throw new Error("Dates de séjour invalides");
      }
      const nights = Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24));
      propertyTotal = Number(property.price_per_night) * nights;
      propertyCheckin = data.propertyDates.checkin;
      propertyCheckout = data.propertyDates.checkout;
      propertyId = property.id;
      propertyGuests = data.propertyDates.guests;
    }

    if (vehicleTotal === 0 && propertyTotal === 0) {
      throw new Error("Sélection vide");
    }

    // Re-check availability one more time
    const conflictChecks = await Promise.all([
      vehicleId && vehicleStart && vehicleEnd
        ? supabaseAdmin
            .from("bookings")
            .select("id", { count: "exact", head: true })
            .eq("vehicle_id", vehicleId)
            .or("payment_status.eq.paid,payment_status.eq.pending")
            .gt("expires_at", new Date().toISOString())
            .lt("vehicle_start", vehicleEnd)
            .gt("vehicle_end", vehicleStart)
        : Promise.resolve({ count: 0, error: null } as const),
      propertyId && propertyCheckin && propertyCheckout
        ? supabaseAdmin
            .from("bookings")
            .select("id", { count: "exact", head: true })
            .eq("property_id", propertyId)
            .or("payment_status.eq.paid,payment_status.eq.pending")
            .gt("expires_at", new Date().toISOString())
            .lt("property_checkin", propertyCheckout)
            .gt("property_checkout", propertyCheckin)
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

    const totalAmount = vehicleTotal + propertyTotal;
    const depositAmount = Math.round(totalAmount * DEPOSIT_RATIO * 100) / 100;
    const amountCharged =
      data.paymentMode === "full" ? totalAmount : depositAmount;

    const { data: booking, error: insertError } = await supabaseAdmin
      .from("bookings")
      .insert({
        booking_type: data.bookingType,
        customer_name: data.customer.name,
        customer_email: data.customer.email,
        customer_phone: data.customer.phone,
        flight_info: data.customer.flight ?? null,
        vehicle_id: vehicleId,
        pickup_location_id: data.vehicleDates?.pickupLocationId ?? null,
        dropoff_location_id: data.vehicleDates?.dropoffLocationId ?? null,
        vehicle_start: vehicleStart,
        vehicle_end: vehicleEnd,
        vehicle_total: vehicleTotal,
        property_id: propertyId,
        property_checkin: propertyCheckin,
        property_checkout: propertyCheckout,
        property_guests: propertyGuests,
        property_total: propertyTotal,
        total_amount: totalAmount,
        deposit_amount: depositAmount,
        payment_mode: data.paymentMode,
        amount_charged: amountCharged,
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
