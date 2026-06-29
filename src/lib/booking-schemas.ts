import { z } from "zod";

export const bookingTypeSchema = z.enum(["vehicle", "property", "both"]);
export type BookingType = z.infer<typeof bookingTypeSchema>;

export const paymentModeSchema = z.enum(["deposit", "full"]);
export type PaymentMode = z.infer<typeof paymentModeSchema>;

export const vehicleDatesSchema = z.object({
  pickupLocationId: z.string().uuid(),
  dropoffLocationId: z.string().uuid(),
  startISO: z.string().datetime(),
  endISO: z.string().datetime(),
});

export const propertyDatesSchema = z.object({
  checkin: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  checkout: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  guests: z.number().int().min(1).max(20),
});

export const driverSchema = z.object({
  licenseNumber: z.string().trim().min(3).max(40),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  address: z.string().trim().min(5).max(200),
  city: z.string().trim().min(2).max(100),
  postalCode: z.string().trim().min(3).max(20),
  country: z.string().trim().min(2).max(100).default("Guadeloupe"),
});
export type DriverInfo = z.infer<typeof driverSchema>;

export const customerSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().min(4).max(40),
  flight: z.string().trim().max(80).optional().nullable(),
});

export const createBookingSchema = z.object({
  bookingType: bookingTypeSchema,
  vehicleId: z.string().uuid().nullable(),
  vehicleDates: vehicleDatesSchema.nullable(),
  propertyId: z.string().uuid().nullable(),
  propertyDates: propertyDatesSchema.nullable(),
  customer: customerSchema,
  driver: driverSchema,
  paymentMode: paymentModeSchema,
});

export const createPaymentIntentSchema = z.object({
  bookingId: z.string().uuid(),
});
export type CreatePaymentIntentInput = z.infer<typeof createPaymentIntentSchema>;

export const confirmPaymentSchema = z.object({
  bookingId: z.string().uuid(),
  paymentIntentId: z.string(),
});
export type ConfirmPaymentInput = z.infer<typeof confirmPaymentSchema>;
export type CreateBookingInput = z.infer<typeof createBookingSchema>;

export const checkAvailabilitySchema = z.object({
  vehicleStartISO: z.string().datetime().nullable(),
  vehicleEndISO: z.string().datetime().nullable(),
  propertyCheckin: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable(),
  propertyCheckout: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable(),
});

/** Deposit ratio when client selects "acompte". */
export const DEPOSIT_RATIO = 0.3;
