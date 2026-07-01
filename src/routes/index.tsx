import { createFileRoute, useSearch } from "@tanstack/react-router";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Bath, BedDouble, DoorClosed } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { getCatalog, createBooking } from "@/lib/booking.functions";
import { createPaymentIntent, confirmPayment } from "@/lib/payment.functions";
import { resolveImage, heroGuadeloupe } from "@/assets";
import routhLogo from "@/assets/routh-logo.asset.json";
import {
  BookingProvider,
  useBooking,
  nextStep,
  prevStep,
  type StepId,
} from "@/features/booking/booking-context";
import { ProgressBar } from "@/features/booking/progress-bar";
import { StepShell } from "@/features/booking/step-shell";
import { DEPOSIT_RATIO } from "@/lib/booking-schemas";
import { StripePaymentForm, StripeWrapper } from "@/components/StripePaymentForm";
import { generateReceiptPdf } from "@/lib/pdf-receipt";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Routh Location — Voiture & Hébergement en Guadeloupe" },
      {
        name: "description",
        content:
          "Réservez votre voiture de location et votre hébergement en Guadeloupe. Catalogue premium, disponibilité en temps réel, paiement sécurisé.",
      },
      { property: "og:title", content: "Routh Location — Guadeloupe" },
      {
        property: "og:description",
        content: "Location voiture & logement en Guadeloupe — réservation et paiement en ligne.",
      },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <BookingProvider>
      <ProgressBar />
      <main className="relative bg-surface">
        <Stepper />
      </main>
      <Footer />
    </BookingProvider>
  );
}

function Stepper() {
  const { state } = useBooking();
  return (
    <AnimatePresence mode="wait">
      <motion.div key={state.step}>
        {state.step === "intent" && <IntentStep />}
        {state.step === "vehicle-locations" && <VehicleLocationsStep />}
        {state.step === "vehicle-dates" && <VehicleDatesStep />}
        {state.step === "vehicle-pick" && <VehiclePickStep />}
        {state.step === "property-dates" && <PropertyDatesStep />}
        {state.step === "property-pick" && <PropertyPickStep />}
        {state.step === "customer" && <CustomerStep />}
        {state.step === "recap" && <RecapStep />}
        {state.step === "confirmation" && <ConfirmationStep />}
      </motion.div>
    </AnimatePresence>
  );
}

/* =========================================================================
   STEP 1 — Intent
   ======================================================================= */

function IntentStep() {
  const { dispatch } = useBooking();
  const choose = (value: "vehicle" | "property" | "both") => {
    dispatch({ type: "SET_INTENT", value });
    const next: StepId = value === "property" ? "property-dates" : "vehicle-locations";
    dispatch({ type: "GO", step: next });
  };
  return (
    <section className="relative min-h-screen flex flex-col justify-center py-20 px-6 sm:px-12 overflow-hidden">
      <div
        aria-hidden
        className="absolute inset-0 -z-10 opacity-20"
        style={{
          backgroundImage: `url(${heroGuadeloupe})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-surface via-surface/70 to-surface" />
      <div className="max-w-screen-xl mx-auto w-full">
        <div className="max-w-[44ch] space-y-6">
          <img
            src={routhLogo.url}
            alt="Routh Location"
            width={240}
            height={200}
            className="w-40 sm:w-52 h-auto -ml-2 mb-2 drop-shadow-xl"
          />
          <span className="text-xs uppercase tracking-[0.3em] text-brand font-medium">
            Routh Location · Guadeloupe
          </span>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-medium font-serif leading-tight text-balance text-neutral-900">
            Bienvenue en Guadeloupe. Que recherchez-vous pour votre séjour dans l'île papillon ?
          </h1>
          <p className="text-lg text-neutral-600 text-pretty max-w-[48ch]">
            Sélectionnez l'option qui correspond à votre projet d'évasion dans l'archipel.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <IntentCard
            label="Une voiture"
            sub="Liberté totale sur les routes de l'île."
            onClick={() => choose("vehicle")}
            icon={
              <svg
                className="size-5 text-brand"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8.25 18.75a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM19.5 18.75a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.25 12.75h19.5M5.25 7.5h13.5l1.5 5.25v5.25h-2.25M5.25 7.5L3.75 12.75v5.25h2.25"
                />
              </svg>
            }
          />
          <IntentCard
            label="Un logement"
            sub="Villas de caractère et havres de paix."
            onClick={() => choose("property")}
            icon={
              <svg
                className="size-5 text-brand"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.25 12 12 3l9.75 9M4.5 10.5V21h15V10.5"
                />
              </svg>
            }
          />
          <IntentCard
            label="Les deux"
            dark
            sub="Le pack complet pour une sérénité maximale."
            onClick={() => choose("both")}
            icon={
              <svg
                className="size-5 text-white"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
                />
              </svg>
            }
          />
        </div>
      </div>
    </section>
  );
}

function IntentCard({
  label,
  sub,
  icon,
  onClick,
  dark,
}: {
  label: string;
  sub: string;
  icon: React.ReactNode;
  onClick: () => void;
  dark?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative p-8 text-left rounded-2xl ring-1 transition-all duration-300 hover:-translate-y-1 ${
        dark
          ? "bg-accent text-white ring-black/5 hover:ring-brand/40"
          : "bg-white ring-black/5 hover:ring-brand/40"
      }`}
    >
      <div
        className={`size-10 mb-6 flex items-center justify-center rounded-full ${dark ? "bg-white/10" : "bg-brand/10"}`}
      >
        {icon}
      </div>
      <h3 className={`text-xl font-medium mb-2 ${dark ? "text-white" : ""}`}>{label}</h3>
      <p className={`text-sm ${dark ? "text-white/70" : "text-neutral-500"}`}>{sub}</p>
    </button>
  );
}

/* =========================================================================
   STEP 2 — Vehicle locations
   ======================================================================= */

function useCatalog() {
  const fn = useServerFn(getCatalog);
  const { state } = useBooking();
  return useQuery({
    queryKey: [
      "catalog",
      state.vehicle.startISO,
      state.vehicle.endISO,
      state.property.checkin,
      state.property.checkout,
    ],
    queryFn: () =>
      fn({
        data: {
          vehicleStartISO: state.vehicle.startISO,
          vehicleEndISO: state.vehicle.endISO,
          propertyCheckin: state.property.checkin,
          propertyCheckout: state.property.checkout,
        },
      }),
  });
}

function VehicleLocationsStep() {
  const { state, dispatch } = useBooking();
  const { data, isLoading } = useCatalog();
  const [pickup, setPickup] = useState<string | null>(state.vehicle.pickupLocationId);
  const [dropoff, setDropoff] = useState<string | null>(state.vehicle.dropoffLocationId);
  const [same, setSame] = useState(true);

  useEffect(() => {
    if (same && pickup) setDropoff(pickup);
  }, [pickup, same]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!pickup || !dropoff) return;
    dispatch({ type: "SET_VEHICLE_LOCATIONS", pickup, dropoff });
    dispatch({ type: "GO", step: "vehicle-dates" });
  };

  return (
    <StepShell
      eyebrow="Étape voiture · Lieux"
      title="Où prenez-vous, puis rendez-vous le véhicule ?"
      description="Nous desservons trois points de retrait sur la partie centre de l'île."
      onBack={() => dispatch({ type: "GO", step: "intent" })}
    >
      {isLoading ? (
        <p className="text-sm text-neutral-500">Chargement…</p>
      ) : (
        <form onSubmit={submit} className="space-y-8">
          <fieldset className="space-y-3">
            <legend className="text-xs uppercase tracking-widest text-neutral-500 mb-2">
              Lieu de prise en charge
            </legend>
            <div className="grid sm:grid-cols-3 gap-3">
              {data?.locations.map((loc) => (
                <button
                  key={loc.id}
                  type="button"
                  onClick={() => setPickup(loc.id)}
                  className={`px-5 py-4 rounded-xl text-left ring-1 transition-all ${
                    pickup === loc.id
                      ? "bg-accent text-white ring-accent"
                      : "bg-white ring-black/5 hover:ring-brand/40"
                  }`}
                >
                  <span className="block text-sm font-medium">{loc.name}</span>
                </button>
              ))}
            </div>
          </fieldset>

          <label className="flex items-center gap-3 text-sm text-neutral-600 cursor-pointer">
            <input
              type="checkbox"
              checked={same}
              onChange={(e) => setSame(e.target.checked)}
              className="rounded border-neutral-300 text-brand focus:ring-brand"
            />
            Restitution au même endroit
          </label>

          {!same && (
            <fieldset className="space-y-3">
              <legend className="text-xs uppercase tracking-widest text-neutral-500 mb-2">
                Lieu de restitution
              </legend>
              <div className="grid sm:grid-cols-3 gap-3">
                {data?.locations.map((loc) => (
                  <button
                    key={loc.id}
                    type="button"
                    onClick={() => setDropoff(loc.id)}
                    className={`px-5 py-4 rounded-xl text-left ring-1 transition-all ${
                      dropoff === loc.id
                        ? "bg-accent text-white ring-accent"
                        : "bg-white ring-black/5 hover:ring-brand/40"
                    }`}
                  >
                    <span className="block text-sm font-medium">{loc.name}</span>
                  </button>
                ))}
              </div>
            </fieldset>
          )}

          <PrimaryButton disabled={!pickup || !dropoff}>Continuer</PrimaryButton>
        </form>
      )}
    </StepShell>
  );
}

/* =========================================================================
   STEP 3 — Vehicle dates
   ======================================================================= */

const STANDARD_DURATION_HOURS = 24;
const AVAILABLE_HOURS = Array.from({ length: 13 }, (_, i) => i + 8); // 08h → 20h

function pad2(n: number) {
  return n.toString().padStart(2, "0");
}
function toDateInput(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}
function combine(date: string, hour: number) {
  return `${date}T${pad2(hour)}:00`;
}

function VehicleDatesStep() {
  const { state, dispatch } = useBooking();

  const initialStart = state.vehicle.startISO ? new Date(state.vehicle.startISO) : null;
  const initialEnd = state.vehicle.endISO ? new Date(state.vehicle.endISO) : null;

  const today = toDateInput(new Date());
  const [startDate, setStartDate] = useState(initialStart ? toDateInput(initialStart) : today);
  const [startHour, setStartHour] = useState<number>(initialStart ? initialStart.getHours() : 10);

  // Return date/hour are derived from start + standard duration, but user can override
  const computeReturn = (date: string, hour: number) => {
    const s = new Date(combine(date, hour));
    s.setHours(s.getHours() + STANDARD_DURATION_HOURS);
    return { date: toDateInput(s), hour: s.getHours() };
  };

  const [endDate, setEndDate] = useState(
    initialEnd ? toDateInput(initialEnd) : computeReturn(startDate, startHour).date,
  );
  const [endHour, setEndHour] = useState<number>(
    initialEnd ? initialEnd.getHours() : computeReturn(startDate, startHour).hour,
  );
  const [autoReturn, setAutoReturn] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // Auto-sync return when start changes & autoReturn enabled
  useEffect(() => {
    if (!autoReturn) return;
    const r = computeReturn(startDate, startHour);
    setEndDate(r.date);
    setEndHour(r.hour);
  }, [startDate, startHour, autoReturn]);

  const canSyncFromProperty = Boolean(state.property.checkin && state.property.checkout);
  const syncFromProperty = () => {
    if (!state.property.checkin || !state.property.checkout) return;
    setAutoReturn(false);
    setStartDate(state.property.checkin);
    setStartHour(10);
    setEndDate(state.property.checkout);
    setEndHour(18);
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setErr(null);
    const s = new Date(combine(startDate, startHour));
    const en = new Date(combine(endDate, endHour));
    if (en.getTime() <= s.getTime()) {
      setErr("La date de retour doit être après la date de départ.");
      toast.error("Dates invalides", {
        description: "La date de retour doit être après la date de départ.",
      });
      return;
    }
    dispatch({
      type: "SET_VEHICLE_DATES",
      startISO: s.toISOString(),
      endISO: en.toISOString(),
    });
    dispatch({ type: "GO", step: "vehicle-pick" });
  };

  const inputCls =
    "w-full px-4 py-3 rounded-xl bg-white ring-1 ring-black/5 focus:ring-brand focus:outline-none text-base";

  return (
    <StepShell
      eyebrow="Étape voiture · Dates"
      title="Quand souhaitez-vous prendre la route ?"
      onBack={() => dispatch({ type: "GO", step: "vehicle-locations" })}
    >
      <form onSubmit={submit} className="space-y-6">
        {canSyncFromProperty && (
          <SyncDatesButton onClick={syncFromProperty} label="Aligner sur les dates du logement" />
        )}

        <div className="rounded-xl bg-brand/5 ring-1 ring-brand/15 px-4 py-3 text-sm text-neutral-700">
          Durée standard : <strong>{STANDARD_DURATION_HOURS}h</strong>. Le retour est calculé
          automatiquement à partir de l'heure de départ.
        </div>

        <fieldset className="space-y-3">
          <legend className="text-sm font-medium text-neutral-700">Départ</legend>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Date">
              <input
                type="date"
                required
                min={today}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="Heure">
              <select
                required
                value={startHour}
                onChange={(e) => setStartHour(Number(e.target.value))}
                className={inputCls}
              >
                {AVAILABLE_HOURS.map((h) => (
                  <option key={h} value={h}>
                    {pad2(h)}:00
                  </option>
                ))}
              </select>
            </Field>
          </div>
        </fieldset>

        <fieldset className="space-y-3">
          <div className="flex items-center justify-between">
            <legend className="text-sm font-medium text-neutral-700">Retour</legend>
            <label className="flex items-center gap-2 text-xs text-neutral-500">
              <input
                type="checkbox"
                checked={autoReturn}
                onChange={(e) => setAutoReturn(e.target.checked)}
                className="accent-brand"
              />
              Auto (+{STANDARD_DURATION_HOURS}h)
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Date">
              <input
                type="date"
                required
                min={startDate}
                value={endDate}
                onChange={(e) => {
                  setAutoReturn(false);
                  setEndDate(e.target.value);
                }}
                className={inputCls}
              />
            </Field>
            <Field label="Heure">
              <select
                required
                value={endHour}
                onChange={(e) => {
                  setAutoReturn(false);
                  setEndHour(Number(e.target.value));
                }}
                className={inputCls}
              >
                {AVAILABLE_HOURS.map((h) => (
                  <option key={h} value={h}>
                    {pad2(h)}:00
                  </option>
                ))}
              </select>
            </Field>
          </div>
        </fieldset>

        {err && <p className="text-sm text-destructive">{err}</p>}
        <PrimaryButton>Voir les véhicules disponibles</PrimaryButton>
      </form>
    </StepShell>
  );
}

function SyncDatesButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-brand/10 text-brand text-sm font-medium ring-1 ring-brand/20 hover:bg-brand/15 transition-colors"
    >
      <svg className="size-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
        />
      </svg>
      {label}
    </button>
  );
}

/* =========================================================================
   STEP 4 — Vehicle pick
   ======================================================================= */

type CatalogVehicle = NonNullable<ReturnType<typeof useCatalog>["data"]>["vehicles"][number];

function vehicleDisplayName(name: string) {
  return name === "Nouvelle Peugeot 208 manuelle" ? "Nouvelle Peugeot 208 active" : name;
}

function vehicleOptions(v: CatalogVehicle): string[] {
  const opts: string[] = [];
  const cat = (v.category ?? "").toLowerCase();
  const name = (v.name ?? "").toLowerCase();
  if (v.transmission?.toLowerCase().includes("auto") || name.includes("auto"))
    opts.push("Carplay / Android Auto");
  if (cat.includes("utilitaire")) opts.push("Grand volume de chargement");
  if (cat.includes("eco")) opts.push("Faible consommation");
  opts.push("Climatisation");
  opts.push("Assurance tous risques incluse");
  opts.push("Kilométrage illimité");
  return Array.from(new Set(opts));
}

function VehiclePickStep() {
  const { state, dispatch } = useBooking();
  const { data, isLoading } = useCatalog();
  const [details, setDetails] = useState<CatalogVehicle | null>(null);

  const days = (() => {
    if (!state.vehicle.startISO || !state.vehicle.endISO) return 1;
    const s = new Date(state.vehicle.startISO).getTime();
    const e = new Date(state.vehicle.endISO).getTime();
    return Math.max(1, Math.ceil((e - s) / (1000 * 60 * 60 * 24)));
  })();

  const select = (id: string, pricePerDay: number, name: string) => {
    dispatch({ type: "PICK_VEHICLE", id, pricePerDay, name });
    toast.success("Véhicule sélectionné", { description: name });
    setDetails(null);
    const next = state.bookingType === "both" ? "property-dates" : "customer";
    dispatch({ type: "GO", step: next });
  };

  return (
    <StepShell
      wide
      eyebrow="Étape voiture · Sélection"
      title="Explorez l'île en toute élégance"
      description={`Notre flotte est rigoureusement sélectionnée pour le relief et le climat de la Guadeloupe. Tarifs pour ${days} jour${days > 1 ? "s" : ""}.`}
      onBack={() => dispatch({ type: "GO", step: "vehicle-dates" })}
    >
      {isLoading ? (
        <p className="text-sm text-neutral-500">Vérification des disponibilités…</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data?.vehicles.map((v) => (
            <article
              key={v.id}
              className={`group bg-white rounded-2xl overflow-hidden ring-1 ring-black/5 p-4 transition-all ${
                !v.available ? "opacity-60 grayscale" : "hover:-translate-y-1"
              }`}
            >
              <div className="relative w-full aspect-[4/3] bg-neutral-100 rounded-xl overflow-hidden">
                <img
                  src={resolveImage(v.image_url)}
                  alt={v.name}
                  loading="lazy"
                  width={1024}
                  height={768}
                  className="w-full h-full object-cover"
                />
                {!v.available && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                    <span className="px-3 py-1 text-xs uppercase tracking-widest text-white bg-black/70 rounded-full">
                      Indisponible sur vos dates
                    </span>
                  </div>
                )}
              </div>
              <div className="mt-6 px-2 pb-2">
                <div className="flex justify-between items-start gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-widest text-neutral-400">
                      {v.category}
                    </p>
                    <h3 className="text-lg font-medium">{vehicleDisplayName(v.name)}</h3>
                  </div>
                  <span className="text-brand font-medium whitespace-nowrap">
                    {v.price_per_day}€<span className="text-xs text-neutral-400">/jour</span>
                  </span>
                </div>
                <div className="mt-4 flex flex-wrap gap-4 text-[11px] uppercase tracking-wider text-neutral-400 font-medium">
                  <Pill>{v.transmission}</Pill>
                  <Pill>{v.seats} places</Pill>
                  <Pill>{v.fuel}</Pill>
                </div>
                {v.description && <p className="mt-4 text-sm text-neutral-600">{v.description}</p>}
                <div className="mt-6 flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => setDetails(v)}
                    className="w-full py-3 px-4 text-sm font-medium rounded-full border border-neutral-300 hover:border-brand hover:text-brand transition-colors"
                  >
                    Voir les détails
                  </button>
                  <button
                    type="button"
                    disabled={!v.available}
                    onClick={() => select(v.id, Number(v.price_per_day), v.name)}
                    className={`w-full py-3 px-4 text-sm font-medium rounded-full transition-all ${
                      v.available
                        ? "bg-brand text-white hover:bg-brand/90"
                        : "bg-neutral-100 text-neutral-500 cursor-not-allowed"
                    }`}
                  >
                    {v.available
                      ? `Sélectionner · ${Number(v.price_per_day) * days}€`
                      : "Indisponible"}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <VehicleDetailsDialog
        vehicle={details}
        days={days}
        onClose={() => setDetails(null)}
        onSelect={select}
      />
    </StepShell>
  );
}

function VehicleDetailsDialog({
  vehicle,
  days,
  onClose,
  onSelect,
}: {
  vehicle: CatalogVehicle | null;
  days: number;
  onClose: () => void;
  onSelect: (id: string, pricePerDay: number, name: string) => void;
}) {
  if (!vehicle) return null;
  const options = vehicleOptions(vehicle);
  const total = Number(vehicle.price_per_day) * days;
  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 px-0 sm:px-4 py-0 sm:py-8 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative bg-white w-full sm:max-w-2xl sm:rounded-3xl rounded-t-3xl overflow-hidden shadow-2xl my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer"
          className="absolute top-4 right-4 z-10 size-9 rounded-full bg-white/90 backdrop-blur flex items-center justify-center text-neutral-700 hover:bg-white shadow"
        >
          ✕
        </button>
        <div className="w-full aspect-[16/10] bg-neutral-100">
          <img
            src={resolveImage(vehicle.image_url)}
            alt={vehicle.name}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="p-6 sm:p-8 max-h-[60vh] overflow-y-auto">
          <p className="text-xs uppercase tracking-widest text-neutral-400">{vehicle.category}</p>
          <div className="flex justify-between items-start gap-4 mt-1">
            <h3 className="text-2xl font-medium">{vehicleDisplayName(vehicle.name)}</h3>
            <span className="text-brand font-medium whitespace-nowrap text-lg">
              {vehicle.price_per_day}€<span className="text-xs text-neutral-400">/jour</span>
            </span>
          </div>

          {vehicle.description && (
            <p className="mt-4 text-sm text-neutral-600">{vehicle.description}</p>
          )}

          <section className="mt-6">
            <h4 className="text-xs uppercase tracking-widest text-neutral-400 mb-3">
              Caractéristiques
            </h4>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl bg-neutral-50 p-3">
                <dt className="text-neutral-500 text-xs">Boîte</dt>
                <dd className="font-medium capitalize">{vehicle.transmission}</dd>
              </div>
              <div className="rounded-xl bg-neutral-50 p-3">
                <dt className="text-neutral-500 text-xs">Places</dt>
                <dd className="font-medium">{vehicle.seats}</dd>
              </div>
              <div className="rounded-xl bg-neutral-50 p-3">
                <dt className="text-neutral-500 text-xs">Énergie</dt>
                <dd className="font-medium capitalize">{vehicle.fuel}</dd>
              </div>
              <div className="rounded-xl bg-neutral-50 p-3">
                <dt className="text-neutral-500 text-xs">Catégorie</dt>
                <dd className="font-medium capitalize">{vehicle.category}</dd>
              </div>
            </dl>
          </section>

          <section className="mt-6">
            <h4 className="text-xs uppercase tracking-widest text-neutral-400 mb-3">
              Options incluses
            </h4>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
              {options.map((opt) => (
                <li key={opt} className="flex items-start gap-2">
                  <span className="text-brand mt-0.5">✓</span>
                  <span className="text-neutral-700">{opt}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-6">
            <h4 className="text-xs uppercase tracking-widest text-neutral-400 mb-3">
              Conditions de location
            </h4>
            <ul className="text-sm text-neutral-700 space-y-1.5 list-disc pl-5">
              <li>Conducteur âgé de 21 ans minimum, permis B valide depuis 2 ans</li>
              <li>Caution restituée au retour du véhicule</li>
              <li>Carburant : plein à plein</li>
              <li>Annulation gratuite jusqu'à 48h avant le départ</li>
              <li>Remise des clés à l'aéroport ou au point de retrait choisi</li>
            </ul>
          </section>
        </div>

        <div className="border-t border-neutral-100 p-4 sm:p-6 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between bg-white">
          <div className="text-sm">
            <span className="text-neutral-500">
              Total pour {days} jour{days > 1 ? "s" : ""} :{" "}
            </span>
            <span className="font-medium text-neutral-900">{total}€</span>
          </div>
          <button
            type="button"
            disabled={!vehicle.available}
            onClick={() => onSelect(vehicle.id, Number(vehicle.price_per_day), vehicle.name)}
            className={`w-full sm:w-auto py-3 px-6 text-sm font-medium rounded-full transition-all ${
              vehicle.available
                ? "bg-brand text-white hover:bg-brand/90"
                : "bg-neutral-100 text-neutral-500 cursor-not-allowed"
            }`}
          >
            {vehicle.available ? "Sélectionner ce véhicule" : "Indisponible sur vos dates"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="size-1 bg-neutral-300 rounded-full" /> {children}
    </span>
  );
}

/* =========================================================================
   STEP 5 — Property dates
   ======================================================================= */

function PropertyDatesStep() {
  const { state, dispatch } = useBooking();
  const [checkin, setCheckin] = useState(state.property.checkin ?? "");
  const [checkout, setCheckout] = useState(state.property.checkout ?? "");
  const [guests, setGuests] = useState(state.property.guests);
  const [err, setErr] = useState<string | null>(null);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (!checkin || !checkout) return;
    if (checkout <= checkin) {
      setErr("La date de départ doit être après l'arrivée.");
      toast.error("Dates invalides", {
        description: "La date de départ doit être après l'arrivée.",
      });
      return;
    }
    dispatch({ type: "SET_PROPERTY_DATES", checkin, checkout, guests });
    dispatch({ type: "GO", step: "property-pick" });
  };

  const today = new Date().toISOString().slice(0, 10);
  const backStep: StepId = state.bookingType === "both" ? "vehicle-pick" : "intent";

  return (
    <StepShell
      eyebrow="Étape logement · Dates"
      title="Quand voulez-vous poser vos valises ?"
      onBack={() => dispatch({ type: "GO", step: backStep })}
    >
      <form onSubmit={submit} className="space-y-6">
        {state.vehicle.startISO && state.vehicle.endISO && (
          <SyncDatesButton
            onClick={() => {
              setCheckin(state.vehicle.startISO!.slice(0, 10));
              setCheckout(state.vehicle.endISO!.slice(0, 10));
            }}
            label="Aligner sur les dates de la voiture"
          />
        )}
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Arrivée">
            <input
              type="date"
              required
              min={today}
              value={checkin}
              onChange={(e) => setCheckin(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white ring-1 ring-black/5 focus:ring-brand focus:outline-none text-base"
            />
          </Field>
          <Field label="Départ">
            <input
              type="date"
              required
              min={checkin || today}
              value={checkout}
              onChange={(e) => setCheckout(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white ring-1 ring-black/5 focus:ring-brand focus:outline-none text-base"
            />
          </Field>
        </div>
        <Field label="Nombre de voyageurs">
          <input
            type="number"
            min={1}
            max={20}
            required
            value={guests}
            onChange={(e) => setGuests(Number(e.target.value))}
            className="w-full px-4 py-3 rounded-xl bg-white ring-1 ring-black/5 focus:ring-brand focus:outline-none text-base"
          />
        </Field>
        {err && <p className="text-sm text-destructive">{err}</p>}
        <PrimaryButton>Voir les logements disponibles</PrimaryButton>
      </form>
    </StepShell>
  );
}

/* =========================================================================
   STEP 6 — Property pick
   ======================================================================= */

function PropertyPickStep() {
  const { state, dispatch } = useBooking();
  const { data, isLoading } = useCatalog();

  const nights = (() => {
    if (!state.property.checkin || !state.property.checkout) return 1;
    const s = new Date(state.property.checkin).getTime();
    const e = new Date(state.property.checkout).getTime();
    return Math.max(1, Math.ceil((e - s) / (1000 * 60 * 60 * 24)));
  })();

  const select = (id: string, pricePerNight: number, name: string) => {
    dispatch({ type: "PICK_PROPERTY", id, pricePerNight, name });
    toast.success("Logement sélectionné", { description: name });
    dispatch({ type: "GO", step: "customer" });
  };

  return (
    <div>
      {isLoading ? (
        <StepShell title="Chargement…">
          <p className="text-sm text-neutral-500">Vérification des disponibilités…</p>
        </StepShell>
      ) : (
        <div className="bg-accent text-neutral-50 min-h-screen py-20 px-6">
          <div className="max-w-screen-xl mx-auto">
            <button
              onClick={() => dispatch({ type: "GO", step: "property-dates" })}
              className="mb-8 text-xs uppercase tracking-widest text-neutral-500 hover:text-brand transition-colors inline-flex items-center gap-2"
            >
              <span aria-hidden>←</span> Retour
            </button>
            <div className="mb-12 max-w-[48ch]">
              <span className="text-xs uppercase tracking-[0.2em] text-white/50 mb-4 block">
                Hébergement d'exception
              </span>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-serif leading-none text-balance font-medium">
                Vos logements pour {nights} nuit{nights > 1 ? "s" : ""}
              </h2>
            </div>

            <div className="space-y-16">
              {data?.properties.map((p) => (
                <article key={p.id} className={!p.available ? "opacity-50" : ""}>
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-end mb-8">
                    <div className="lg:col-span-8">
                      <p className="text-xs uppercase tracking-widest text-brand mb-2">
                        {p.location}
                      </p>
                      <h3 className="text-3xl md:text-4xl font-serif font-medium">{p.name}</h3>
                    </div>
                    <div className="lg:col-span-4 lg:text-right">
                      <p className="text-2xl font-serif italic">
                        {Number(p.price_per_night) === 180 || Number(p.price_per_night) === 450
                          ? 80
                          : p.price_per_night}
                        €
                        <span className="text-sm uppercase tracking-widest not-italic opacity-60 ml-2">
                          / NUIT
                        </span>
                      </p>
                      <p className="text-sm text-white/60 mt-1">
                        Total {Number(p.price_per_night) * nights}€
                      </p>
                    </div>
                  </div>

                  <div className="w-full aspect-[16/7] bg-neutral-800 rounded-2xl overflow-hidden">
                    <img
                      src={resolveImage(p.image_urls?.[0])}
                      alt={p.name}
                      loading="lazy"
                      width={1600}
                      height={700}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3 md:gap-6 mt-8">
                    {(() => {
                      const desc = p.description ?? "";
                      const parts = desc
                        .split("·")
                        .map((s) => s.trim())
                        .filter(Boolean);
                      const pick = (kw: string) => parts.find((x) => x.toLowerCase().includes(kw));
                      const items = [
                        {
                          label: (
                            pick("chambre") ?? `${p.bedrooms} chambre${p.bedrooms > 1 ? "s" : ""}`
                          ).replace(
                            "1 chambre · 2 lits · 1 salle de bain privée",
                            "1 chambre · 2 lits · 1 salle de bain\u00a0",
                          ),
                          icon: DoorClosed,
                        },
                        {
                          label: (pick("lit") ?? `${p.capacity} lits`).replace(
                            "2 lits",
                            "\u00a02 lits",
                          ),
                          icon: BedDouble,
                        },
                        {
                          label: (pick("salle de bain") ?? "Salle de bain privée").replace(
                            "1 salle de bain privée",
                            "1 salle de bain\u00a0",
                          ),
                          icon: Bath,
                        },
                      ];
                      return items.map(({ label, icon: Icon }) => (
                        <div
                          key={label}
                          className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-5 text-center"
                        >
                          <Icon className="size-5 text-brand" strokeWidth={1.5} />
                          <span className="text-xs md:text-sm font-medium text-white/90 leading-snug">
                            {label}
                          </span>
                        </div>
                      ));
                    })()}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mt-12">
                    <div className="space-y-4">
                      <h4 className="text-xs uppercase tracking-widest text-brand font-semibold">
                        Équipements
                      </h4>
                      <ul className="space-y-3">
                        {p.amenities
                          ?.filter((a) => {
                            const l = a.toLowerCase();
                            return !l.includes("salle de bain") && !l.includes("lit");
                          })
                          .slice(0, 6)
                          .map((a) => (
                            <li
                              key={a}
                              className="flex items-center gap-3 text-sm text-neutral-300"
                            >
                              <svg
                                className="size-4 text-brand shrink-0"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path d="M5 13l4 4L19 7" strokeWidth="2" />
                              </svg>
                              {a === "Jardin tropical"
                                ? "Jardin tropical\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n"
                                : a}
                            </li>
                          ))}
                      </ul>
                    </div>
                    <div className="md:col-span-2 space-y-6">
                      <p className="text-lg font-serif text-neutral-200 leading-relaxed text-pretty">
                        {p.description}
                      </p>
                      <div className="flex flex-wrap gap-3 text-xs uppercase tracking-widest text-white/60">
                        <span>Jusqu'à {p.capacity} voyageurs</span>
                      </div>

                      <div className="rounded-2xl border border-white/10 bg-white/5 p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-serif font-medium text-white">
                              {Number(p.price_per_night) === 180 ||
                              Number(p.price_per_night) === 450
                                ? 80
                                : p.price_per_night}
                              €
                            </span>
                            <span className="text-xs uppercase tracking-widest text-white/60">
                              / NUIT
                            </span>
                          </div>
                          <p className="text-sm text-white/70">
                            {nights} nuit{nights > 1 ? "s" : ""} ·{" "}
                            <span className="text-white font-medium">
                              Total{" "}
                              {Number(
                                Number(p.price_per_night) === 180 ||
                                  Number(p.price_per_night) === 450
                                  ? 80
                                  : p.price_per_night,
                              ) * nights}
                              €
                            </span>
                          </p>
                        </div>
                        <button
                          type="button"
                          disabled={!p.available}
                          onClick={() => select(p.id, Number(p.price_per_night), p.name)}
                          className={`inline-flex items-center justify-center py-3.5 px-6 text-sm font-semibold rounded-full transition-transform w-full sm:w-auto ${
                            p.available
                              ? "bg-brand text-white hover:scale-[1.02] shadow-lg shadow-brand/30"
                              : "bg-white/10 text-white/60 cursor-not-allowed"
                          }`}
                        >
                          {p.available ? (
                            <>
                              <span className="p-1.5 bg-white/20 rounded-full mr-3">
                                <svg
                                  className="size-4"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path d="M12 4.5v15m7.5-7.5h-15" strokeWidth="2" />
                                </svg>
                              </span>
                              Sélectionner ce logement
                            </>
                          ) : (
                            "Indisponible sur ces dates"
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================================================================
   STEP 7 — Customer
   ======================================================================= */

const DIAL_CODES = [
  { code: "+590", label: "🇬🇵 Guadeloupe (+590)" },
  { code: "+33", label: "🇫🇷 France (+33)" },
  { code: "+596", label: "🇲🇶 Martinique (+596)" },
  { code: "+594", label: "🇬🇫 Guyane (+594)" },
  { code: "+1", label: "🇺🇸 USA / Canada (+1)" },
  { code: "+44", label: "🇬🇧 Royaume-Uni (+44)" },
  { code: "+49", label: "🇩🇪 Allemagne (+49)" },
  { code: "+32", label: "🇧🇪 Belgique (+32)" },
  { code: "+41", label: "🇨🇭 Suisse (+41)" },
];

function splitPhone(full: string): { dial: string; local: string } {
  const match = DIAL_CODES.find((d) => full.startsWith(d.code));
  if (match) return { dial: match.code, local: full.slice(match.code.length).replace(/\D/g, "") };
  return { dial: "+590", local: full.replace(/\D/g, "") };
}

const PHONE_RULES: Record<
  string,
  { len: number | number[]; startsWith: string[]; example: string; country: string }
> = {
  "+590": {
    len: 9,
    startsWith: ["590", "690", "691", "692", "693", "694"],
    example: "690 12 34 56",
    country: "Guadeloupe",
  },
  "+33": {
    len: 9,
    startsWith: ["1", "2", "3", "4", "5", "6", "7", "9"],
    example: "6 12 34 56 78",
    country: "France",
  },
  "+596": {
    len: 9,
    startsWith: ["596", "696", "697"],
    example: "696 12 34 56",
    country: "Martinique",
  },
  "+594": { len: 9, startsWith: ["594", "694"], example: "694 12 34 56", country: "Guyane" },
  "+1": {
    len: 10,
    startsWith: ["2", "3", "4", "5", "6", "7", "8", "9"],
    example: "415 555 0132",
    country: "USA / Canada",
  },
  "+44": {
    len: [10, 11],
    startsWith: ["7", "1", "2", "3"],
    example: "7400 123456",
    country: "Royaume-Uni",
  },
  "+49": {
    len: [10, 11],
    startsWith: ["15", "16", "17", "30", "40", "89"],
    example: "151 23456789",
    country: "Allemagne",
  },
  "+32": { len: 9, startsWith: ["4", "2", "3", "9"], example: "470 12 34 56", country: "Belgique" },
  "+41": {
    len: 9,
    startsWith: ["7", "2", "3", "4", "5", "6", "8"],
    example: "76 123 45 67",
    country: "Suisse",
  },
};

function lenLabel(len: number | number[]): string {
  return Array.isArray(len) ? `${len.join(" ou ")}` : `${len}`;
}

function validatePhone(dial: string, local: string): string | null {
  if (!local) return "Veuillez saisir votre numéro de téléphone.";
  if (!/^\d+$/.test(local))
    return "Le numéro doit contenir uniquement des chiffres (0-9), sans espaces ni tirets.";
  const rule = PHONE_RULES[dial];
  if (!rule) {
    if (local.length < 6 || local.length > 12)
      return "Le numéro doit contenir entre 6 et 12 chiffres.";
    return null;
  }
  const lens = Array.isArray(rule.len) ? rule.len : [rule.len];
  if (!lens.includes(local.length)) {
    return `Numéro ${rule.country} invalide : ${lenLabel(rule.len)} chiffres attendus après ${dial} (vous en avez saisi ${local.length}). Exemple : ${rule.example}.`;
  }
  if (!rule.startsWith.some((p) => local.startsWith(p))) {
    return `Préfixe non reconnu pour ${rule.country}. Préfixes autorisés : ${rule.startsWith.join(", ")}. Exemple : ${rule.example}.`;
  }
  return null;
}

function formatPhonePretty(full: string): string {
  const { dial, local } = splitPhone(full);
  if (!local) return full;
  // Group digits in pairs from the right, first group may be 1-3 digits
  const head =
    local.length % 2 === 1 ? local.slice(0, local.length === 9 ? 3 : 1) : local.slice(0, 2);
  const rest = local.slice(head.length).match(/.{1,2}/g) ?? [];
  return `${dial} ${[head, ...rest].join(" ")}`.trim();
}

function maskPhonePretty(full: string): string {
  const { dial, local } = splitPhone(full);
  if (local.length < 4) return `${dial} ${"•".repeat(local.length)}`;
  const visibleStart = local.slice(0, 3);
  const visibleEnd = local.slice(-2);
  const maskedLen = Math.max(0, local.length - visibleStart.length - visibleEnd.length);
  const masked = visibleStart + "•".repeat(maskedLen) + visibleEnd;
  // re-group like formatPhonePretty
  const head =
    masked.length % 2 === 1 ? masked.slice(0, masked.length === 9 ? 3 : 1) : masked.slice(0, 2);
  const rest = masked.slice(head.length).match(/.{1,2}/g) ?? [];
  return `${dial} ${[head, ...rest].join(" ")}`.trim();
}

function CustomerStep() {
  const { state, dispatch } = useBooking();
  const initial = splitPhone(state.customer.phone || "+590");
  const [form, setForm] = useState(state.customer);
  const [driver, setDriver] = useState(state.driver);
  const [dial, setDial] = useState(initial.dial);
  const [local, setLocal] = useState(initial.local);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const phoneInputRef = useRef<HTMLInputElement>(null);
  const [showDriver, setShowDriver] = useState(
    state.bookingType === "vehicle" || state.bookingType === "both",
  );
  const [secondDriver, setSecondDriver] = useState(false);
  const [secondDriverName, setSecondDriverName] = useState("");
  const [secondDriverLicense, setSecondDriverLicense] = useState("");
  const [consentLicense, setConsentLicense] = useState(false);
  const [consentDeposit, setConsentDeposit] = useState(false);
  const [consentTerms, setConsentTerms] = useState(false);
  const consentsMissing = showDriver && (!consentLicense || !consentDeposit || !consentTerms);


  const rule = PHONE_RULES[dial];
  const phoneExample = rule
    ? `Ex : ${rule.example} — ${lenLabel(rule.len)} chiffres, préfixes autorisés : ${rule.startsWith.join(", ")}.`
    : "6 à 12 chiffres";

  useEffect(() => {
    if (!local) {
      setPhoneError(null);
      return;
    }
    setPhoneError(validatePhone(dial, local));
  }, [dial, local]);

  const applyQuickFix = () => {
    const template = rule ? rule.example.replace(/\D/g, "") : "";
    setLocal(template);
    requestAnimationFrame(() => {
      const input = phoneInputRef.current;
      if (!input) return;
      input.focus();
      input.select();
    });
  };

  useEffect(() => {
    if (validatePhone(dial, local) !== null) {
      applyQuickFix();
    }
  }, []);

  const phoneInvalid = validatePhone(dial, local) !== null;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const err = validatePhone(dial, local);
    if (err) {
      setPhoneError(err);
      toast.error("Numéro de téléphone invalide", { description: err });
      phoneInputRef.current?.focus();
      return;
    }
    if (showDriver) {
      if (
        !driver.licenseNumber ||
        !driver.birthDate ||
        !driver.address ||
        !driver.city ||
        !driver.postalCode
      ) {
        toast.error("Champs conducteur requis", {
          description: "Veuillez remplir tous les champs du conducteur.",
        });
        return;
      }
      if (!consentLicense || !consentDeposit || !consentTerms) {
        toast.error("Consentements requis", {
          description: "Veuillez valider les conditions de location avant de continuer.",
        });
        return;
      }
    }
    const full = `${dial}${local}`;
    const next = { ...form, phone: full };
    setForm(next);
    dispatch({ type: "SET_CUSTOMER", value: next });
    if (showDriver) {
      dispatch({ type: "SET_DRIVER", value: driver });
    }

    dispatch({ type: "GO", step: "recap" });
  };

  const inpCls =
    "w-full px-4 py-3 rounded-xl bg-white ring-1 ring-black/5 focus:ring-brand focus:outline-none text-base";

  return (
    <StepShell
      eyebrow="Vos coordonnées"
      title="Informations client et conducteur"
      description="Remplissez vos coordonnées et celles du conducteur principal."
      onBack={() => {
        const back: StepId = state.bookingType === "vehicle" ? "vehicle-pick" : "property-pick";
        dispatch({ type: "GO", step: back });
      }}
    >
      <form onSubmit={submit} className="space-y-6">
        <div className="bg-brand/5 rounded-2xl p-5 ring-1 ring-brand/15">
          <h3 className="text-sm font-medium text-accent mb-4">Coordonnées</h3>
          <div className="space-y-4">
            <Field label="Nom complet">
              <input
                required
                maxLength={120}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className={inpCls}
              />
            </Field>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Email">
                <input
                  required
                  type="email"
                  maxLength={200}
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className={inpCls}
                />
              </Field>
              <Field label="Téléphone">
                <div className="flex gap-2">
                  <select
                    value={dial}
                    onChange={(e) => setDial(e.target.value)}
                    aria-label="Indicatif pays"
                    className="px-3 py-3 rounded-xl bg-white ring-1 ring-black/5 focus:ring-brand focus:outline-none text-sm"
                  >
                    {DIAL_CODES.map((d) => (
                      <option key={d.code} value={d.code}>
                        {d.label}
                      </option>
                    ))}
                  </select>
                  <input
                    ref={phoneInputRef}
                    required
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={12}
                    value={local}
                    placeholder="690123456"
                    aria-invalid={phoneError || undefined}
                    onChange={(e) => {
                      setLocal(e.target.value.replace(/\D/g, ""));
                      if (phoneError) setPhoneError(null);
                    }}
                    className={`flex-1 min-w-0 px-4 py-3 rounded-xl bg-white ring-1 focus:outline-none ${phoneError ? "ring-red-500 focus:ring-red-500" : "ring-black/5 focus:ring-brand"}`}
                  />
                </div>
                {phoneError ? (
                  <p className="mt-1 text-xs text-red-600">{phoneError}</p>
                ) : (
                  <p className="mt-1 text-xs text-neutral-500">{phoneExample}</p>
                )}
              </Field>
            </div>
            {(state.bookingType === "vehicle" || state.bookingType === "both") && (
              <Field label="N° de vol (optionnel)">
                <input
                  maxLength={80}
                  value={form.flight}
                  onChange={(e) => setForm({ ...form, flight: e.target.value })}
                  className={inpCls}
                />
              </Field>
            )}
          </div>
        </div>

        {showDriver && (
          <div className="bg-accent/5 rounded-2xl p-5 ring-1 ring-accent/15">
            <h3 className="text-sm font-medium text-accent mb-4">Conducteur principal</h3>
            <p className="text-xs text-neutral-500 mb-4">
              Permis de conduire valide obligatoire (21 ans minimum, permis B depuis 2 ans).
            </p>
            <div className="space-y-4">
              <Field label="N° de permis de conduire">
                <input
                  required
                  value={driver.licenseNumber}
                  onChange={(e) => setDriver({ ...driver, licenseNumber: e.target.value })}
                  className={inpCls}
                  placeholder="Ex : 12345678901"
                />
              </Field>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Date de naissance">
                  <input
                    required
                    type="date"
                    value={driver.birthDate}
                    onChange={(e) => setDriver({ ...driver, birthDate: e.target.value })}
                    className={inpCls}
                  />
                </Field>
                <Field label="Code postal">
                  <input
                    required
                    maxLength={20}
                    value={driver.postalCode}
                    onChange={(e) => setDriver({ ...driver, postalCode: e.target.value })}
                    className={inpCls}
                    placeholder="Ex : 97100"
                  />
                </Field>
              </div>
              <Field label="Adresse">
                <input
                  required
                  maxLength={200}
                  value={driver.address}
                  onChange={(e) => setDriver({ ...driver, address: e.target.value })}
                  className={inpCls}
                  placeholder="Numéro et rue"
                />
              </Field>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Ville">
                  <input
                    required
                    maxLength={100}
                    value={driver.city}
                    onChange={(e) => setDriver({ ...driver, city: e.target.value })}
                    className={inpCls}
                    placeholder="Ex : Les Abymes"
                  />
                </Field>
                <Field label="Pays">
                  <input
                    required
                    maxLength={100}
                    value={driver.country}
                    onChange={(e) => setDriver({ ...driver, country: e.target.value })}
                    className={inpCls}
                  />
                </Field>
              </div>
            </div>
          </div>
        )}

        <PrimaryButton disabled={phoneInvalid}>
          {showDriver ? "Continuer vers le récapitulatif" : "Récapitulatif"}
        </PrimaryButton>
      </form>
    </StepShell>
  );
}

/* =========================================================================
   STEP 8 — Recap & payment
   ======================================================================= */

function RecapStep() {
  const { state, dispatch } = useBooking();
  const createFn = useServerFn(createBooking);
  const paymentFn = useServerFn(createPaymentIntent);
  const confirmPaymentFn = useServerFn(confirmPayment);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stage, setStage] = useState<"review" | "paying" | "done">("review");
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [bookingId, setBookingId] = useState<string | null>(null);

  const vehicleDays = (() => {
    if (!state.vehicle.startISO || !state.vehicle.endISO) return 0;
    return Math.max(
      1,
      Math.ceil(
        (new Date(state.vehicle.endISO).getTime() - new Date(state.vehicle.startISO).getTime()) /
          (1000 * 60 * 60 * 24),
      ),
    );
  })();
  const propertyNights = (() => {
    if (!state.property.checkin || !state.property.checkout) return 0;
    return Math.max(
      1,
      Math.ceil(
        (new Date(state.property.checkout).getTime() - new Date(state.property.checkin).getTime()) /
          (1000 * 60 * 60 * 24),
      ),
    );
  })();

  const basePricePerDay = state.vehicle.pricePerDay ?? 0;
  const basePricePerNight = state.property.pricePerNight ?? 0;
  const vehicleTotal = basePricePerDay * vehicleDays;
  const propertyTotal = basePricePerNight * propertyNights;
  const total = vehicleTotal + propertyTotal;
  const deposit = Math.round(total * DEPOSIT_RATIO * 100) / 100;
  const charged = state.paymentMode === "full" ? total : deposit;

  const createBookingAndPay = async () => {
    setLoading(true);
    setError(null);
    const loadingId = toast.loading("Création de votre réservation…");
    try {
      const data = {
        bookingType: state.bookingType!,
        vehicleId: state.vehicle.vehicleId,
        vehicleDates:
          state.vehicle.startISO &&
          state.vehicle.endISO &&
          state.vehicle.pickupLocationId &&
          state.vehicle.dropoffLocationId
            ? {
                pickupLocationId: state.vehicle.pickupLocationId,
                dropoffLocationId: state.vehicle.dropoffLocationId,
                startISO: state.vehicle.startISO,
                endISO: state.vehicle.endISO,
              }
            : null,
        propertyId: state.property.propertyId,
        propertyDates:
          state.property.checkin && state.property.checkout
            ? {
                checkin: state.property.checkin,
                checkout: state.property.checkout,
                guests: state.property.guests,
              }
            : null,
        customer: {
          name: state.customer.name,
          email: state.customer.email,
          phone: state.customer.phone,
          flight: state.customer.flight || null,
        },
        driver: state.driver,
        paymentMode: state.paymentMode,
      };

      const res = await createFn({ data });
      setBookingId(res.bookingId);
      dispatch({ type: "SET_BOOKING_RESULT", bookingRef: res.reference, bookingId: res.bookingId });

      toast.success("Réservation créée !", { id: loadingId, description: `Réf. ${res.reference}` });
      setStage("paying");

      const pi = await paymentFn({ data: { bookingId: res.bookingId } });
      setClientSecret(pi.clientSecret);
      dispatch({ type: "SET_PAYMENT_INTENT", value: pi.paymentIntentId });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erreur inconnue";
      setError(msg);
      toast.error("Échec", { id: loadingId, description: msg });
      setLoading(false);
    }
  };

  const onPaymentSuccess = async (paymentIntentId: string) => {
    try {
      await confirmPaymentFn({ data: { bookingId: bookingId!, paymentIntentId } });
      dispatch({ type: "SET_PAYMENT_STATUS", value: "paid" });
      setStage("done");
      toast.success("Paiement confirmé !");
    } catch (e) {
      setPaymentError("Le paiement a réussi mais la confirmation a échoué. Contactez-nous.");
    }
  };

  const Label = ({ c }: { c: string }) => (
    <span className="text-xs uppercase tracking-widest text-neutral-400">{c}</span>
  );
  const Divider = () => <div className="border-t border-neutral-100" />;

  return (
    <StepShell
      eyebrow="Récapitulatif"
      title="Votre itinéraire"
      description="Vérifiez les détails avant de payer."
      onBack={() => dispatch({ type: "GO", step: "customer" })}
    >
      <div className="bg-white ring-1 ring-black/5 rounded-3xl p-6 sm:p-8 space-y-6">
        <div>
          <Label c="Client" />
          <p className="font-medium mt-1">{state.customer.name}</p>
          <p className="text-sm text-neutral-500">{state.customer.email}</p>
          <p className="text-sm text-neutral-500" title={formatPhonePretty(state.customer.phone)}>
            {maskPhonePretty(state.customer.phone)}
          </p>
        </div>

        {state.driver.licenseNumber && (
          <div>
            <Label c="Conducteur" />
            <p className="text-sm text-neutral-600 mt-1">Permis : {state.driver.licenseNumber}</p>
            <p className="text-sm text-neutral-600">
              {state.driver.address}, {state.driver.postalCode} {state.driver.city}
            </p>
          </div>
        )}

        <Divider />

        <div className="space-y-4">
          {vehicleTotal > 0 && (
            <div>
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium">{state.vehicle.name}</p>
                  <p className="text-xs text-neutral-500">
                    {basePricePerDay}€ × {vehicleDays} jour{vehicleDays > 1 ? "s" : ""}
                  </p>
                </div>
                <span className="font-medium">{vehicleTotal}€</span>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="text-[11px] bg-brand/10 text-brand px-2.5 py-1 rounded-full">
                  Kilométrage illimité
                </span>
                <span className="text-[11px] bg-brand/10 text-brand px-2.5 py-1 rounded-full">
                  Assurance tous risques
                </span>
                <span className="text-[11px] bg-brand/10 text-brand px-2.5 py-1 rounded-full">
                  Climatisation
                </span>
              </div>
            </div>
          )}
          {propertyTotal > 0 && (
            <div>
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium">{state.property.name}</p>
                  <p className="text-xs text-neutral-500">
                    {basePricePerNight}€ × {propertyNights} nuit{propertyNights > 1 ? "s" : ""}
                  </p>
                </div>
                <span className="font-medium">{propertyTotal}€</span>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="text-[11px] bg-brand/10 text-brand px-2.5 py-1 rounded-full">
                  {state.property.guests} voyageurs
                </span>
              </div>
            </div>
          )}
        </div>

        <Divider />

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-neutral-500">Sous-total</span>
            <span>{total}€</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-neutral-500">Acompte (30%)</span>
            <span>{deposit}€</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-neutral-500">Solde à payer sur place</span>
            <span>{Math.round((total - deposit) * 100) / 100}€</span>
          </div>
          <div className="flex justify-between text-lg font-serif pt-2 border-t border-neutral-100">
            <span className="text-accent">
              {state.paymentMode === "full" ? "Total dû" : "Total à payer maintenant"}
            </span>
            <span className="text-accent font-medium">{charged}€</span>
          </div>
        </div>
      </div>

      {stage === "review" && (
        <div className="mt-8 space-y-4">
          <fieldset className="space-y-3">
            <legend className="text-xs uppercase tracking-widest text-neutral-500 mb-2">
              Mode de paiement
            </legend>
            <div className="grid sm:grid-cols-2 gap-3">
              <PaymentChoice
                selected={state.paymentMode === "deposit"}
                onClick={() => dispatch({ type: "SET_PAYMENT_MODE", value: "deposit" })}
                title="Acompte 30%"
                sub={`Payez ${deposit}€ aujourd'hui, solde sur place.`}
              />
              <PaymentChoice
                selected={state.paymentMode === "full"}
                onClick={() => dispatch({ type: "SET_PAYMENT_MODE", value: "full" })}
                title="Paiement intégral"
                sub={`Payez la totalité de ${total}€ en une fois.`}
              />
            </div>
          </fieldset>

          {error && <p className="text-sm text-destructive">{error}</p>}

          {(() => {
            const { dial, local } = splitPhone(state.customer.phone);
            const phoneInvalid = !!validatePhone(dial, local);
            return (
              <button
                onClick={createBookingAndPay}
                disabled={loading || phoneInvalid}
                className="w-full py-4 bg-accent text-white rounded-full font-medium hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Création en cours…" : `Confirmer et payer · ${charged}€`}
              </button>
            );
          })()}
        </div>
      )}

      {stage === "paying" && clientSecret && (
        <div className="mt-8 bg-white ring-1 ring-black/5 rounded-3xl p-6 sm:p-8">
          <h3 className="text-sm font-medium mb-4">Paiement sécurisé</h3>
          <StripeWrapper clientSecret={clientSecret}>
            <StripePaymentForm
              clientSecret={clientSecret}
              onSuccess={onPaymentSuccess}
              onError={(msg) => {
                setPaymentError(msg);
                setLoading(false);
              }}
            />
          </StripeWrapper>
          {paymentError && <p className="mt-3 text-sm text-destructive">{paymentError}</p>}
        </div>
      )}

      {stage === "done" && (
        <div className="mt-8 text-center">
          <div className="size-16 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4">
            <svg
              className="size-8 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <p className="text-lg font-medium text-green-700">Paiement confirmé</p>
        </div>
      )}
    </StepShell>
  );
}

function PaymentChoice({
  selected,
  onClick,
  title,
  sub,
}: {
  selected: boolean;
  onClick: () => void;
  title: string;
  sub: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`p-5 text-left rounded-xl ring-1 transition-all ${selected ? "bg-accent text-white ring-accent" : "bg-white ring-black/5 hover:ring-brand/40"}`}
    >
      <div className="font-medium mb-1">{title}</div>
      <div className={`text-xs ${selected ? "text-white/70" : "text-neutral-500"}`}>{sub}</div>
    </button>
  );
}

/* =========================================================================
   STEP 9 — Confirmation
   ======================================================================= */

function ConfirmationStep() {
  const { state, dispatch } = useBooking();
  const vehicleDays = (() => {
    if (!state.vehicle.startISO || !state.vehicle.endISO) return 0;
    return Math.max(
      1,
      Math.ceil(
        (new Date(state.vehicle.endISO).getTime() - new Date(state.vehicle.startISO).getTime()) /
          (1000 * 60 * 60 * 24),
      ),
    );
  })();
  const propertyNights = (() => {
    if (!state.property.checkin || !state.property.checkout) return 0;
    return Math.max(
      1,
      Math.ceil(
        (new Date(state.property.checkout).getTime() - new Date(state.property.checkin).getTime()) /
          (1000 * 60 * 60 * 24),
      ),
    );
  })();
  const vehicleTotal = (state.vehicle.pricePerDay ?? 0) * vehicleDays;
  const propertyTotal = (state.property.pricePerNight ?? 0) * propertyNights;
  const total = vehicleTotal + propertyTotal;
  const deposit = Math.round(total * DEPOSIT_RATIO * 100) / 100;

  const downloadPdf = () => {
    generateReceiptPdf({
      reference: state.bookingRef ?? "",
      customerName: state.customer.name,
      customerEmail: state.customer.email,
      vehicle:
        vehicleTotal > 0
          ? { name: state.vehicle.name ?? "", days: vehicleDays, total: vehicleTotal }
          : undefined,
      property:
        propertyTotal > 0
          ? { name: state.property.name ?? "", nights: propertyNights, total: propertyTotal }
          : undefined,
      totalAmount: total,
      depositAmount: deposit,
      paymentMode: state.paymentMode,
      amountCharged: state.paymentMode === "full" ? total : deposit,
      paidAt: new Date().toLocaleDateString("fr-FR"),
    });
  };

  return (
    <StepShell
      eyebrow="Confirmation"
      title={state.paymentStatus === "paid" ? "Paiement confirmé !" : "Réservation enregistrée"}
      description={`Référence : ${state.bookingRef}. Un email récapitulatif a été envoyé à ${state.customer.email}.`}
    >
      <div className="bg-white ring-1 ring-black/5 rounded-3xl p-6 sm:p-8 space-y-4">
        {state.paymentStatus === "paid" ? (
          <div className="flex items-start gap-4 p-4 bg-green-50 rounded-2xl ring-1 ring-green-200">
            <div className="size-10 shrink-0 bg-green-100 rounded-full flex items-center justify-center">
              <svg
                className="size-5 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <div>
              <p className="font-medium text-green-800">Paiement accepté</p>
              <p className="text-sm text-green-700">
                Votre réservation est confirmée et votre place est garantie.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-4 p-4 bg-amber-50 rounded-2xl ring-1 ring-amber-200">
            <div className="size-10 shrink-0 bg-amber-100 rounded-full flex items-center justify-center">
              <svg
                className="size-5 text-amber-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                />
              </svg>
            </div>
            <div>
              <p className="font-medium text-amber-800">En attente de paiement</p>
              <p className="text-sm text-amber-700">
                Votre réservation expire sous 15 minutes. Finalisez le paiement pour confirmer.
              </p>
            </div>
          </div>
        )}

        <div className="border-t border-neutral-100 pt-4 space-y-2 text-sm">
          {vehicleTotal > 0 && (
            <div className="flex justify-between">
              <span className="text-neutral-600">
                {state.vehicle.name} · {vehicleDays} jour{vehicleDays > 1 ? "s" : ""}
              </span>
              <span className="font-medium">{vehicleTotal}€</span>
            </div>
          )}
          {propertyTotal > 0 && (
            <div className="flex justify-between">
              <span className="text-neutral-600">
                {state.property.name} · {propertyNights} nuit{propertyNights > 1 ? "s" : ""}
              </span>
              <span className="font-medium">{propertyTotal}€</span>
            </div>
          )}
          <div className="border-t border-neutral-100 pt-2 flex justify-between font-medium">
            <span>Total</span>
            <span>{total}€</span>
          </div>
        </div>
      </div>

      <div className="mt-8 flex flex-col sm:flex-row gap-3">
        <button
          onClick={downloadPdf}
          className="flex-1 py-3.5 px-6 bg-accent text-white rounded-full font-medium hover:bg-accent/90 transition-colors inline-flex items-center justify-center gap-2"
        >
          <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          Télécharger le récapitulatif (PDF)
        </button>
        <button
          onClick={() => dispatch({ type: "RESET" })}
          className="flex-1 py-3.5 px-6 bg-white text-neutral-700 rounded-full font-medium ring-1 ring-black/10 hover:bg-neutral-50 transition-colors"
        >
          Nouvelle réservation
        </button>
      </div>
    </StepShell>
  );
}

/* =========================================================================
   Shared UI
   ======================================================================= */

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-2">
      <span className="text-xs uppercase tracking-widest text-neutral-500">{label}</span>
      {children}
    </label>
  );
}

function PrimaryButton({ children, disabled }: { children: React.ReactNode; disabled?: boolean }) {
  return (
    <button
      type="submit"
      disabled={disabled}
      className="w-full sm:w-auto px-8 py-3.5 bg-accent text-white rounded-full font-medium hover:bg-accent/90 transition-colors disabled:opacity-50"
    >
      {children}
    </button>
  );
}

function Footer() {
  return (
    <footer className="py-12 px-6 border-t border-neutral-100 bg-surface">
      <div className="max-w-screen-xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-2">
          <div className="size-2 bg-brand rounded-full" />
          <span className="text-sm font-serif tracking-wider font-medium uppercase">
            Routh Location
          </span>
        </div>
        <p className="text-xs text-neutral-400">Location voiture & logement · Guadeloupe</p>
      </div>
    </footer>
  );
}
