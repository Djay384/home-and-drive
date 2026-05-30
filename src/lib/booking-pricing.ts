import { DEPOSIT_RATIO, type CreateBookingInput, type PaymentMode } from "./booking-schemas";

export type VehicleLookup = { id: string; price_per_day: number; is_active: boolean } | null;
export type PropertyLookup = {
  id: string;
  price_per_night: number;
  is_active: boolean;
  capacity: number;
} | null;

export interface ComputedBookingPlan {
  vehicleTotal: number;
  vehicleStart: string | null;
  vehicleEnd: string | null;
  vehicleId: string | null;
  vehicleDays: number;
  propertyTotal: number;
  propertyCheckin: string | null;
  propertyCheckout: string | null;
  propertyId: string | null;
  propertyGuests: number | null;
  propertyNights: number;
  totalAmount: number;
  depositAmount: number;
  amountCharged: number;
  paymentMode: PaymentMode;
}

export function diffDays(startISO: string, endISO: string): number {
  const s = new Date(startISO).getTime();
  const e = new Date(endISO).getTime();
  if (e <= s) throw new Error("Dates invalides");
  return Math.max(1, Math.ceil((e - s) / (1000 * 60 * 60 * 24)));
}

export function diffNights(checkin: string, checkout: string): number {
  const s = new Date(checkin + "T00:00:00Z").getTime();
  const e = new Date(checkout + "T00:00:00Z").getTime();
  if (e <= s) throw new Error("Dates de séjour invalides");
  return Math.ceil((e - s) / (1000 * 60 * 60 * 24));
}

/**
 * Pure pricing computation. All prices MUST come from the database via the
 * lookups passed in. The client-side amounts in `data` are never used.
 */
export function computeBookingPlan(
  data: CreateBookingInput,
  vehicle: VehicleLookup,
  property: PropertyLookup,
): ComputedBookingPlan {
  let vehicleTotal = 0;
  let vehicleDays = 0;
  let vehicleStart: string | null = null;
  let vehicleEnd: string | null = null;
  let vehicleId: string | null = null;

  if (
    (data.bookingType === "vehicle" || data.bookingType === "both") &&
    data.vehicleId &&
    data.vehicleDates
  ) {
    if (!vehicle || !vehicle.is_active) throw new Error("Véhicule indisponible");
    vehicleDays = diffDays(data.vehicleDates.startISO, data.vehicleDates.endISO);
    vehicleTotal = Number(vehicle.price_per_day) * vehicleDays;
    vehicleStart = data.vehicleDates.startISO;
    vehicleEnd = data.vehicleDates.endISO;
    vehicleId = vehicle.id;
  }

  let propertyTotal = 0;
  let propertyNights = 0;
  let propertyCheckin: string | null = null;
  let propertyCheckout: string | null = null;
  let propertyId: string | null = null;
  let propertyGuests: number | null = null;

  if (
    (data.bookingType === "property" || data.bookingType === "both") &&
    data.propertyId &&
    data.propertyDates
  ) {
    if (!property || !property.is_active) throw new Error("Logement indisponible");
    if (data.propertyDates.guests > property.capacity) {
      throw new Error(`Capacité maximale dépassée (${property.capacity} voyageurs)`);
    }
    propertyNights = diffNights(data.propertyDates.checkin, data.propertyDates.checkout);
    propertyTotal = Number(property.price_per_night) * propertyNights;
    propertyCheckin = data.propertyDates.checkin;
    propertyCheckout = data.propertyDates.checkout;
    propertyId = property.id;
    propertyGuests = data.propertyDates.guests;
  }

  if (vehicleTotal === 0 && propertyTotal === 0) {
    throw new Error("Sélection vide");
  }

  const totalAmount = vehicleTotal + propertyTotal;
  const depositAmount = Math.round(totalAmount * DEPOSIT_RATIO * 100) / 100;
  const amountCharged = data.paymentMode === "full" ? totalAmount : depositAmount;

  return {
    vehicleTotal,
    vehicleStart,
    vehicleEnd,
    vehicleId,
    vehicleDays,
    propertyTotal,
    propertyCheckin,
    propertyCheckout,
    propertyId,
    propertyGuests,
    propertyNights,
    totalAmount,
    depositAmount,
    amountCharged,
    paymentMode: data.paymentMode,
  };
}
