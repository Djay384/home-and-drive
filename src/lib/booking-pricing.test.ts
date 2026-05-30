import { describe, it, expect } from "vitest";
import { computeBookingPlan, diffDays, diffNights } from "@/lib/booking-pricing";
import type { CreateBookingInput } from "@/lib/booking-schemas";

const VEHICLE_ID = "11111111-1111-1111-1111-111111111111";
const PROPERTY_ID = "22222222-2222-2222-2222-222222222222";
const PICKUP_ID = "33333333-3333-3333-3333-333333333333";

const baseCustomer = {
  name: "Jean Test",
  email: "jean@test.com",
  phone: "+590690000000",
  flight: null,
};

function vehicleOnlyInput(overrides: Partial<CreateBookingInput> = {}): CreateBookingInput {
  return {
    bookingType: "vehicle",
    vehicleId: VEHICLE_ID,
    vehicleDates: {
      pickupLocationId: PICKUP_ID,
      dropoffLocationId: PICKUP_ID,
      startISO: "2026-07-01T10:00:00.000Z",
      endISO: "2026-07-04T10:00:00.000Z", // 3 days
    },
    propertyId: null,
    propertyDates: null,
    customer: baseCustomer,
    paymentMode: "full",
    ...overrides,
  };
}

function propertyOnlyInput(overrides: Partial<CreateBookingInput> = {}): CreateBookingInput {
  return {
    bookingType: "property",
    vehicleId: null,
    vehicleDates: null,
    propertyId: PROPERTY_ID,
    propertyDates: {
      checkin: "2026-07-01",
      checkout: "2026-07-06", // 5 nights
      guests: 2,
    },
    customer: baseCustomer,
    paymentMode: "full",
    ...overrides,
  };
}

function bothInput(overrides: Partial<CreateBookingInput> = {}): CreateBookingInput {
  return {
    ...vehicleOnlyInput(),
    bookingType: "both",
    propertyId: PROPERTY_ID,
    propertyDates: {
      checkin: "2026-07-01",
      checkout: "2026-07-04", // 3 nights
      guests: 2,
    },
    ...overrides,
  };
}

const vehicleRow = (price: number, active = true) => ({
  id: VEHICLE_ID,
  price_per_day: price,
  is_active: active,
});

const propertyRow = (price: number, capacity = 4, active = true) => ({
  id: PROPERTY_ID,
  price_per_night: price,
  is_active: active,
  capacity,
});

describe("date helpers", () => {
  it("counts whole days for vehicle", () => {
    expect(diffDays("2026-07-01T10:00:00Z", "2026-07-04T10:00:00Z")).toBe(3);
  });
  it("rounds partial days up", () => {
    expect(diffDays("2026-07-01T10:00:00Z", "2026-07-02T11:00:00Z")).toBe(2);
  });
  it("counts nights for property", () => {
    expect(diffNights("2026-07-01", "2026-07-06")).toBe(5);
  });
  it("rejects same-day or inverted ranges", () => {
    expect(() => diffNights("2026-07-01", "2026-07-01")).toThrow();
    expect(() => diffDays("2026-07-02T10:00:00Z", "2026-07-01T10:00:00Z")).toThrow();
  });
});

describe("computeBookingPlan — vehicle only", () => {
  it("uses price_per_day from the database (not the client)", () => {
    const plan = computeBookingPlan(vehicleOnlyInput(), vehicleRow(80), null);
    expect(plan.vehicleDays).toBe(3);
    expect(plan.vehicleTotal).toBe(240); // 80 * 3
    expect(plan.propertyTotal).toBe(0);
    expect(plan.totalAmount).toBe(240);
    expect(plan.amountCharged).toBe(240); // full
  });

  it.each([
    [25, 75],
    [45, 135],
    [55, 165],
    [60, 180],
    [80, 240],
  ])("vehicle at %i€/jour over 3 days → total %i€", (price, expected) => {
    const plan = computeBookingPlan(vehicleOnlyInput(), vehicleRow(price), null);
    expect(plan.vehicleTotal).toBe(expected);
    expect(plan.totalAmount).toBe(expected);
  });

  it("applies the deposit ratio when paymentMode=deposit", () => {
    const plan = computeBookingPlan(
      vehicleOnlyInput({ paymentMode: "deposit" }),
      vehicleRow(100),
      null,
    );
    expect(plan.totalAmount).toBe(300);
    expect(plan.depositAmount).toBe(90); // 30%
    expect(plan.amountCharged).toBe(90);
  });

  it("throws when the vehicle is inactive", () => {
    expect(() => computeBookingPlan(vehicleOnlyInput(), vehicleRow(80, false), null)).toThrow(
      /indisponible/i,
    );
  });

  it("throws when the vehicle lookup is missing", () => {
    expect(() => computeBookingPlan(vehicleOnlyInput(), null, null)).toThrow(/indisponible/i);
  });
});

describe("computeBookingPlan — property only", () => {
  it("uses price_per_night from the database", () => {
    const plan = computeBookingPlan(propertyOnlyInput(), null, propertyRow(120));
    expect(plan.propertyNights).toBe(5);
    expect(plan.propertyTotal).toBe(600); // 120 * 5
    expect(plan.vehicleTotal).toBe(0);
    expect(plan.totalAmount).toBe(600);
  });

  it.each([
    [80, 400],
    [120, 600],
    [200, 1000],
    [350, 1750],
  ])("property at %i€/nuit over 5 nights → total %i€", (price, expected) => {
    const plan = computeBookingPlan(propertyOnlyInput(), null, propertyRow(price));
    expect(plan.propertyTotal).toBe(expected);
  });

  it("rejects bookings over capacity", () => {
    expect(() =>
      computeBookingPlan(
        propertyOnlyInput({
          propertyDates: { checkin: "2026-07-01", checkout: "2026-07-03", guests: 8 },
        }),
        null,
        propertyRow(120, 4),
      ),
    ).toThrow(/Capacité/);
  });
});

describe("computeBookingPlan — vehicle + property", () => {
  it("adds vehicle and property subtotals using DB prices", () => {
    const plan = computeBookingPlan(bothInput(), vehicleRow(60), propertyRow(150));
    expect(plan.vehicleTotal).toBe(180); // 60 * 3
    expect(plan.propertyTotal).toBe(450); // 150 * 3
    expect(plan.totalAmount).toBe(630);
  });

  it("computes 30% deposit on the combined total", () => {
    const plan = computeBookingPlan(
      bothInput({ paymentMode: "deposit" }),
      vehicleRow(60),
      propertyRow(150),
    );
    expect(plan.totalAmount).toBe(630);
    expect(plan.depositAmount).toBe(189); // 30%
    expect(plan.amountCharged).toBe(189);
  });

  it("never uses the bookingType=both path when only one side has data", () => {
    expect(() =>
      computeBookingPlan(
        { ...vehicleOnlyInput(), bookingType: "both" },
        vehicleRow(80),
        null,
      ),
    ).not.toThrow(); // property side simply contributes 0
  });

  it("throws when the entire selection is empty", () => {
    const empty: CreateBookingInput = {
      bookingType: "vehicle",
      vehicleId: null,
      vehicleDates: null,
      propertyId: null,
      propertyDates: null,
      customer: baseCustomer,
      paymentMode: "full",
    };
    expect(() => computeBookingPlan(empty, null, null)).toThrow(/Sélection vide/);
  });
});

describe("computeBookingPlan — client price tampering", () => {
  it("ignores any client-supplied prices and trusts only the DB lookup", () => {
    // The schema does not even expose a price field on the client input, but we assert
    // explicitly here that two identical bookings with different DB prices produce
    // totals derived solely from the DB row.
    const cheap = computeBookingPlan(vehicleOnlyInput(), vehicleRow(10), null);
    const pricey = computeBookingPlan(vehicleOnlyInput(), vehicleRow(1000), null);
    expect(cheap.totalAmount).toBe(30);
    expect(pricey.totalAmount).toBe(3000);
  });
});
