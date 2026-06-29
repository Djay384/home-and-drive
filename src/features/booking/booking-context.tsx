import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type ReactNode,
} from "react";
import type { BookingType, DriverInfo, PaymentMode } from "@/lib/booking-schemas";

export type StepId =
  | "intent"
  | "vehicle-locations"
  | "vehicle-dates"
  | "vehicle-pick"
  | "property-dates"
  | "property-pick"
  | "customer"
  | "recap"
  | "confirmation";

export interface BookingState {
  step: StepId;
  bookingType: BookingType | null;
  vehicle: {
    pickupLocationId: string | null;
    dropoffLocationId: string | null;
    startISO: string | null;
    endISO: string | null;
    vehicleId: string | null;
    pricePerDay: number | null;
    name: string | null;
  };
  property: {
    checkin: string | null;
    checkout: string | null;
    guests: number;
    propertyId: string | null;
    pricePerNight: number | null;
    name: string | null;
  };
  customer: {
    name: string;
    email: string;
    phone: string;
    flight: string;
  };
  driver: DriverInfo;
  paymentMode: PaymentMode;
  // Results after booking creation
  bookingRef: string | null;
  bookingId: string | null;
  paymentIntentId: string | null;
  paymentStatus: "pending" | "paid" | null;
}

const initial: BookingState = {
  step: "intent",
  bookingType: null,
  vehicle: {
    pickupLocationId: null,
    dropoffLocationId: null,
    startISO: null,
    endISO: null,
    vehicleId: null,
    pricePerDay: null,
    name: null,
  },
  property: {
    checkin: null,
    checkout: null,
    guests: 2,
    propertyId: null,
    pricePerNight: null,
    name: null,
  },
  customer: { name: "", email: "", phone: "", flight: "" },
  driver: {
    licenseNumber: "",
    birthDate: "",
    address: "",
    city: "",
    postalCode: "",
    country: "Guadeloupe",
  },
  paymentMode: "deposit",
  bookingRef: null,
  bookingId: null,
  paymentIntentId: null,
  paymentStatus: null,
};

type Action =
  | { type: "GO"; step: StepId }
  | { type: "SET_INTENT"; value: BookingType }
  | { type: "SET_VEHICLE_LOCATIONS"; pickup: string; dropoff: string }
  | { type: "SET_VEHICLE_DATES"; startISO: string; endISO: string }
  | { type: "PICK_VEHICLE"; id: string; pricePerDay: number; name: string }
  | { type: "SET_PROPERTY_DATES"; checkin: string; checkout: string; guests: number }
  | { type: "PICK_PROPERTY"; id: string; pricePerNight: number; name: string }
  | { type: "SET_CUSTOMER"; value: BookingState["customer"] }
  | { type: "SET_DRIVER"; value: BookingState["driver"] }
  | { type: "SET_PAYMENT_MODE"; value: PaymentMode }
  | { type: "SET_BOOKING_RESULT"; bookingRef: string; bookingId: string }
  | { type: "SET_PAYMENT_INTENT"; value: string }
  | { type: "SET_PAYMENT_STATUS"; value: "pending" | "paid" }
  | { type: "RESET" };

function reducer(state: BookingState, action: Action): BookingState {
  switch (action.type) {
    case "GO":
      return { ...state, step: action.step };
    case "SET_INTENT":
      return { ...state, bookingType: action.value };
    case "SET_VEHICLE_LOCATIONS":
      return {
        ...state,
        vehicle: {
          ...state.vehicle,
          pickupLocationId: action.pickup,
          dropoffLocationId: action.dropoff,
        },
      };
    case "SET_VEHICLE_DATES":
      return {
        ...state,
        vehicle: {
          ...state.vehicle,
          startISO: action.startISO,
          endISO: action.endISO,
        },
      };
    case "PICK_VEHICLE":
      return {
        ...state,
        vehicle: {
          ...state.vehicle,
          vehicleId: action.id,
          pricePerDay: action.pricePerDay,
          name: action.name,
        },
      };
    case "SET_PROPERTY_DATES":
      return {
        ...state,
        property: {
          ...state.property,
          checkin: action.checkin,
          checkout: action.checkout,
          guests: action.guests,
        },
      };
    case "PICK_PROPERTY":
      return {
        ...state,
        property: {
          ...state.property,
          propertyId: action.id,
          pricePerNight: action.pricePerNight,
          name: action.name,
        },
      };
    case "SET_CUSTOMER":
      return { ...state, customer: action.value };
    case "SET_DRIVER":
      return { ...state, driver: action.value };
    case "SET_PAYMENT_MODE":
      return { ...state, paymentMode: action.value };
    case "SET_BOOKING_RESULT":
      return {
        ...state,
        bookingRef: action.bookingRef,
        bookingId: action.bookingId,
        step: "confirmation",
      };
    case "SET_PAYMENT_INTENT":
      return { ...state, paymentIntentId: action.value };
    case "SET_PAYMENT_STATUS":
      return { ...state, paymentStatus: action.value };
    case "RESET":
      return initial;
    default:
      return state;
  }
}

interface Ctx {
  state: BookingState;
  dispatch: React.Dispatch<Action>;
  totalSteps: number;
  stepIndex: number;
}

const BookingCtx = createContext<Ctx | null>(null);

const STEP_ORDER: Record<BookingType | "default", StepId[]> = {
  default: ["intent"],
  vehicle: [
    "intent",
    "vehicle-locations",
    "vehicle-dates",
    "vehicle-pick",
    "customer",
    "recap",
    "confirmation",
  ],
  property: ["intent", "property-dates", "property-pick", "customer", "recap", "confirmation"],
  both: [
    "intent",
    "vehicle-locations",
    "vehicle-dates",
    "vehicle-pick",
    "property-dates",
    "property-pick",
    "customer",
    "recap",
    "confirmation",
  ],
};

const STORAGE_KEY = "routh.booking.state.v1";
const VALID_STEPS = new Set<StepId>([
  "intent",
  "vehicle-locations",
  "vehicle-dates",
  "vehicle-pick",
  "property-dates",
  "property-pick",
  "customer",
  "recap",
  "confirmation",
]);

function loadInitial(): BookingState {
  if (typeof window === "undefined") return initial;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return initial;
    const parsed = JSON.parse(raw) as Partial<BookingState>;
    if (!parsed || typeof parsed !== "object") return initial;
    // Never restore on the confirmation step — start fresh after a completed booking.
    if (parsed.step === "confirmation") return initial;
    return { ...initial, ...parsed } as BookingState;
  } catch {
    return initial;
  }
}

export function BookingProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadInitial);
  const skipPushRef = useRef(false);

  // Persist state to sessionStorage so a refresh keeps the user's choices.
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* ignore quota errors */
    }
  }, [state]);

  // Sync state.step with browser history so the back/forward buttons work.
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Initialise the first history entry with the current step.
    if (!window.history.state || (window.history.state as { step?: StepId }).step !== state.step) {
      // On first mount, replace; on subsequent step changes, push.
      const hasEntry = window.history.state && (window.history.state as { step?: StepId }).step;
      if (skipPushRef.current) {
        skipPushRef.current = false;
      } else if (!hasEntry) {
        window.history.replaceState({ step: state.step }, "");
      } else {
        window.history.pushState({ step: state.step }, "");
      }
    }
  }, [state.step]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onPop = (event: PopStateEvent) => {
      const target = (event.state as { step?: StepId } | null)?.step;
      if (target && VALID_STEPS.has(target)) {
        skipPushRef.current = true;
        dispatch({ type: "GO", step: target });
      }
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const value = useMemo(() => {
    const order = STEP_ORDER[state.bookingType ?? "default"];
    const idx = order.indexOf(state.step);
    return {
      state,
      dispatch,
      totalSteps: order.length,
      stepIndex: idx < 0 ? 0 : idx,
    };
  }, [state]);

  return <BookingCtx.Provider value={value}>{children}</BookingCtx.Provider>;
}

export function useBooking() {
  const ctx = useContext(BookingCtx);
  if (!ctx) throw new Error("useBooking must be used inside BookingProvider");
  return ctx;
}

export function nextStep(state: BookingState): StepId | null {
  const order = STEP_ORDER[state.bookingType ?? "default"];
  const idx = order.indexOf(state.step);
  if (idx < 0 || idx >= order.length - 1) return null;
  return order[idx + 1];
}

export function prevStep(state: BookingState): StepId | null {
  const order = STEP_ORDER[state.bookingType ?? "default"];
  const idx = order.indexOf(state.step);
  if (idx <= 0) return null;
  return order[idx - 1];
}
