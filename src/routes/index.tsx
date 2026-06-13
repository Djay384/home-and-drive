import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Bath, BedDouble, DoorClosed } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { getCatalog, createBooking } from "@/lib/booking.functions";
import { resolveImage, heroGuadeloupe } from "@/assets";
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
        content:
          "Location voiture & logement en Guadeloupe — réservation et paiement en ligne.",
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
              <svg className="size-5 text-brand" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM19.5 18.75a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75h19.5M5.25 7.5h13.5l1.5 5.25v5.25h-2.25M5.25 7.5L3.75 12.75v5.25h2.25" />
              </svg>
            }
          />
          <IntentCard
            label="Un logement"
            sub="Villas de caractère et havres de paix."
            onClick={() => choose("property")}
            icon={
              <svg className="size-5 text-brand" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12 12 3l9.75 9M4.5 10.5V21h15V10.5" />
              </svg>
            }
          />
          <IntentCard
            label="Les deux"
            dark
            sub="Le pack complet pour une sérénité maximale."
            onClick={() => choose("both")}
            icon={
              <svg className="size-5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
              </svg>
            }
          />
        </div>
      </div>
    </section>
  );
}

function IntentCard({ label, sub, icon, onClick, dark }: {
  label: string; sub: string; icon: React.ReactNode; onClick: () => void; dark?: boolean;
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
      <div className={`size-10 mb-6 flex items-center justify-center rounded-full ${dark ? "bg-white/10" : "bg-brand/10"}`}>
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
            <legend className="text-xs uppercase tracking-widest text-neutral-500 mb-2">Lieu de prise en charge</legend>
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
              <legend className="text-xs uppercase tracking-widest text-neutral-500 mb-2">Lieu de restitution</legend>
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

function VehicleDatesStep() {
  const { state, dispatch } = useBooking();
  const [start, setStart] = useState(state.vehicle.startISO?.slice(0, 16) ?? "");
  const [end, setEnd] = useState(state.vehicle.endISO?.slice(0, 16) ?? "");
  const [err, setErr] = useState<string | null>(null);

  const canSyncFromProperty = Boolean(state.property.checkin && state.property.checkout);
  const syncFromProperty = () => {
    if (!state.property.checkin || !state.property.checkout) return;
    setStart(`${state.property.checkin}T10:00`);
    setEnd(`${state.property.checkout}T18:00`);
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (!start || !end) return;
    const s = new Date(start);
    const en = new Date(end);
    if (en.getTime() <= s.getTime()) {
      setErr("La date de retour doit être après la date de départ.");
      toast.error("Dates invalides", { description: "La date de retour doit être après la date de départ." });
      return;
    }
    dispatch({
      type: "SET_VEHICLE_DATES",
      startISO: s.toISOString(),
      endISO: en.toISOString(),
    });
    dispatch({ type: "GO", step: "vehicle-pick" });
  };

  const minDate = new Date().toISOString().slice(0, 16);

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
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Départ">
            <input
              type="datetime-local"
              required
              min={minDate}
              value={start}
              onChange={(e) => setStart(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white ring-1 ring-black/5 focus:ring-brand focus:outline-none text-base"
            />
          </Field>
          <Field label="Retour">
            <input
              type="datetime-local"
              required
              min={start || minDate}
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white ring-1 ring-black/5 focus:ring-brand focus:outline-none text-base"
            />
          </Field>
        </div>
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
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
      </svg>
      {label}
    </button>
  );
}

/* =========================================================================
   STEP 4 — Vehicle pick
   ======================================================================= */

function VehiclePickStep() {
  const { state, dispatch } = useBooking();
  const { data, isLoading } = useCatalog();

  const days = (() => {
    if (!state.vehicle.startISO || !state.vehicle.endISO) return 1;
    const s = new Date(state.vehicle.startISO).getTime();
    const e = new Date(state.vehicle.endISO).getTime();
    return Math.max(1, Math.ceil((e - s) / (1000 * 60 * 60 * 24)));
  })();

  const select = (id: string, pricePerDay: number, name: string) => {
    dispatch({ type: "PICK_VEHICLE", id, pricePerDay, name });
    toast.success("Véhicule sélectionné", { description: name });
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
                !v.available ? "opacity-50 grayscale" : "hover:-translate-y-1"
              }`}
            >
              <div className="w-full aspect-[4/3] bg-neutral-100 rounded-xl overflow-hidden">
                <img
                  src={resolveImage(v.image_url)}
                  alt={v.name}
                  loading="lazy"
                  width={1024}
                  height={768}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="mt-6 px-2 pb-2">
                <div className="flex justify-between items-start gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-widest text-neutral-400">{v.category}</p>
                    <h3 className="text-lg font-medium">{v.name === "Nouvelle Peugeot 208 manuelle" ? "Nouvelle Peugeot 208 active" : v.name}</h3>
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
                {v.description && (
                  <p className="mt-4 text-sm text-neutral-600">{v.description}</p>
                )}
                <button
                  type="button"
                  disabled={!v.available}
                  onClick={() => select(v.id, Number(v.price_per_day), v.name)}
                  className={`mt-6 w-full py-3 px-4 text-sm font-medium rounded-full transition-all ${
                    v.available
                      ? "bg-brand text-white hover:bg-brand/90"
                      : "bg-neutral-100 text-neutral-500 cursor-not-allowed"
                  }`}
                >
                  {v.available ? `Sélectionner · ${Number(v.price_per_day) * days}€` : "Indisponible"}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </StepShell>
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
      toast.error("Dates invalides", { description: "La date de départ doit être après l'arrivée." });
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
              type="date" required min={today} value={checkin}
              onChange={(e) => setCheckin(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white ring-1 ring-black/5 focus:ring-brand focus:outline-none text-base"
            />
          </Field>
          <Field label="Départ">
            <input
              type="date" required min={checkin || today} value={checkout}
              onChange={(e) => setCheckout(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white ring-1 ring-black/5 focus:ring-brand focus:outline-none text-base"
            />
          </Field>
        </div>
        <Field label="Nombre de voyageurs">
          <input
            type="number" min={1} max={20} required value={guests}
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
              className="mb-8 text-xs uppercase tracking-widest text-white/60 hover:text-brand transition-colors"
            >
              ← Retour
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
                      <p className="text-xs uppercase tracking-widest text-brand mb-2">{p.location}</p>
                      <h3 className="text-3xl md:text-4xl font-serif font-medium">{p.name}</h3>
                    </div>
                    <div className="lg:col-span-4 lg:text-right">
                      <p className="text-2xl font-serif italic">
                        {Number(p.price_per_night) === 180 || Number(p.price_per_night) === 450 ? 80 : p.price_per_night}€
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
                      const parts = desc.split("·").map((s) => s.trim()).filter(Boolean);
                      const pick = (kw: string) => parts.find((x) => x.toLowerCase().includes(kw));
                      const items = [
                        { 
                          label: (pick("chambre") ?? `${p.bedrooms} chambre${p.bedrooms > 1 ? "s" : ""}`).replace("1 chambre · 2 lits · 1 salle de bain privée", "1 chambre · 2 lits · 1 salle de bain\u00a0"), 
                          icon: DoorClosed 
                        },
                        { 
                          label: (pick("lit") ?? `${p.capacity} lits`).replace("2 lits", "\u00a02 lits"), 
                          icon: BedDouble 
                        },
                        { 
                          label: (pick("salle de bain") ?? "Salle de bain privée").replace("1 salle de bain privée", "1 salle de bain\u00a0"), 
                          icon: Bath 
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
                            <li key={a} className="flex items-center gap-3 text-sm text-neutral-300">
                              <svg className="size-4 text-brand shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path d="M5 13l4 4L19 7" strokeWidth="2" />
                              </svg>
                              {a === "Jardin tropical" ? "Jardin tropical\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n" : a}
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
                              {Number(p.price_per_night) === 180 || Number(p.price_per_night) === 450 ? 80 : p.price_per_night}€
                            </span>
                            <span className="text-xs uppercase tracking-widest text-white/60">
                              / NUIT
                            </span>
                          </div>
                          <p className="text-sm text-white/70">
                            {nights} nuit{nights > 1 ? "s" : ""} ·{" "}
                            <span className="text-white font-medium">
                              Total {Number(Number(p.price_per_night) === 180 || Number(p.price_per_night) === 450 ? 80 : p.price_per_night) * nights}€
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
                                <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
  "+596": { len: 9, startsWith: ["596", "696", "697"], example: "696 12 34 56", country: "Martinique" },
  "+594": { len: 9, startsWith: ["594", "694"], example: "694 12 34 56", country: "Guyane" },
  "+1": { len: 10, startsWith: ["2", "3", "4", "5", "6", "7", "8", "9"], example: "415 555 0132", country: "USA / Canada" },
  "+44": { len: [10, 11], startsWith: ["7", "1", "2", "3"], example: "7400 123456", country: "Royaume-Uni" },
  "+49": { len: [10, 11], startsWith: ["15", "16", "17", "30", "40", "89"], example: "151 23456789", country: "Allemagne" },
  "+32": { len: 9, startsWith: ["4", "2", "3", "9"], example: "470 12 34 56", country: "Belgique" },
  "+41": { len: 9, startsWith: ["7", "2", "3", "4", "5", "6", "8"], example: "76 123 45 67", country: "Suisse" },
};

function lenLabel(len: number | number[]): string {
  return Array.isArray(len) ? `${len.join(" ou ")}` : `${len}`;
}

function validatePhone(dial: string, local: string): string | null {
  if (!local) return "Veuillez saisir votre numéro de téléphone.";
  if (!/^\d+$/.test(local)) return "Le numéro doit contenir uniquement des chiffres (0-9), sans espaces ni tirets.";
  const rule = PHONE_RULES[dial];
  if (!rule) {
    if (local.length < 6 || local.length > 12) return "Le numéro doit contenir entre 6 et 12 chiffres.";
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
  const head = local.length % 2 === 1 ? local.slice(0, local.length === 9 ? 3 : 1) : local.slice(0, 2);
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
  const head = masked.length % 2 === 1 ? masked.slice(0, masked.length === 9 ? 3 : 1) : masked.slice(0, 2);
  const rest = masked.slice(head.length).match(/.{1,2}/g) ?? [];
  return `${dial} ${[head, ...rest].join(" ")}`.trim();
}


function CustomerStep() {
  const { state, dispatch } = useBooking();
  const initial = splitPhone(state.customer.phone || "+590");
  const [form, setForm] = useState(state.customer);
  const [dial, setDial] = useState(initial.dial);
  const [local, setLocal] = useState(initial.local);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const phoneInputRef = useRef<HTMLInputElement>(null);

  const rule = PHONE_RULES[dial];
  const phoneExample = rule
    ? `Ex : ${rule.example} — ${lenLabel(rule.len)} chiffres, préfixes autorisés : ${rule.startsWith.join(", ")}.`
    : "6 à 12 chiffres";

  // Live re-validation: any time dial or local changes, re-run rules.
  // Only show the error after the user has typed something, to avoid yelling on empty load.
  useEffect(() => {
    if (!local) {
      setPhoneError(null);
      return;
    }
    setPhoneError(validatePhone(dial, local));
  }, [dial, local]);

  // Quick-fix mode: pre-fill the local field with the expected format template
  // (digits from the country example) so the user just has to overwrite each digit.
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

  // Auto-trigger quick-fix when arriving on this step from the recap with an invalid number.
  useEffect(() => {
    if (validatePhone(dial, local) !== null) {
      applyQuickFix();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const phoneInvalid = validatePhone(dial, local) !== null;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const err = validatePhone(dial, local);
    if (err) {
      setPhoneError(err);
      phoneInputRef.current?.focus();
      return;
    }
    const full = `${dial}${local}`;
    const next = { ...form, phone: full };
    setForm(next);
    dispatch({ type: "SET_CUSTOMER", value: next });
    dispatch({ type: "GO", step: "recap" });
  };


  return (
    <StepShell
      eyebrow="Vos coordonnées"
      title="Quelques informations pour finaliser"
      onBack={() => {
        const back: StepId =
          state.bookingType === "vehicle"
            ? "vehicle-pick"
            : "property-pick";
        dispatch({ type: "GO", step: back });
      }}
    >
      <form onSubmit={submit} className="space-y-5">
        <Field label="Nom complet">
          <input
            required maxLength={120} value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full px-4 py-3 rounded-xl bg-white ring-1 ring-black/5 focus:ring-brand focus:outline-none"
          />
        </Field>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Email">
            <input
              required type="email" maxLength={200} value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-white ring-1 ring-black/5 focus:ring-brand focus:outline-none"
            />
          </Field>
          <Field label="Téléphone">
            <div className="flex gap-2">
              <select
                value={dial}
                onChange={(e) => {
                  setDial(e.target.value);
                  // live re-validation effect will recompute the error
                }}
                aria-label="Indicatif pays"
                className="px-3 py-3 rounded-xl bg-white ring-1 ring-black/5 focus:ring-brand focus:outline-none text-sm"
              >
                {DIAL_CODES.map((d) => (
                  <option key={d.code} value={d.code}>{d.label}</option>
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
                aria-invalid={phoneError ? true : undefined}
                aria-describedby="phone-help"
                onChange={(e) => {
                  setLocal(e.target.value.replace(/\D/g, ""));
                  if (phoneError) setPhoneError(null);
                }}
                className={`flex-1 min-w-0 px-4 py-3 rounded-xl bg-white ring-1 focus:outline-none ${
                  phoneError ? "ring-red-500 focus:ring-red-500" : "ring-black/5 focus:ring-brand"
                }`}
              />
            </div>
            {phoneError ? (
              <div id="phone-help" className="mt-1.5 flex flex-wrap items-start justify-between gap-2">
                <p className="text-xs text-red-600 flex-1 min-w-0">{phoneError}</p>
                <button
                  type="button"
                  onClick={applyQuickFix}
                  className="text-xs font-medium text-brand underline underline-offset-2 hover:text-accent shrink-0"
                >
                  Modifier mon numéro
                </button>
              </div>
            ) : (
              <p id="phone-help" className="mt-1 text-xs text-neutral-500">{phoneExample}</p>
            )}
          </Field>
        </div>
        {(state.bookingType === "vehicle" || state.bookingType === "both") && (
          <Field label="N° de vol (optionnel)">
            <input
              maxLength={80} value={form.flight}
              onChange={(e) => setForm({ ...form, flight: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-white ring-1 ring-black/5 focus:ring-brand focus:outline-none"
            />
          </Field>
        )}
        <PrimaryButton disabled={phoneInvalid}>Récapitulatif</PrimaryButton>
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
  const charged = state.paymentMode === "full" ? total : deposit;

  const confirm = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await createFn({
        data: {
          bookingType: state.bookingType!,
          vehicleId: state.vehicle.vehicleId,
          vehicleDates:
            state.vehicle.startISO && state.vehicle.endISO && state.vehicle.pickupLocationId && state.vehicle.dropoffLocationId
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
          paymentMode: state.paymentMode,
        },
      });
      dispatch({ type: "SET_BOOKING_REF", value: res.reference });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <StepShell
      eyebrow="Récapitulatif"
      title="Votre itinéraire"
      description="Vérifiez les détails et choisissez votre mode de paiement."
      onBack={() => dispatch({ type: "GO", step: "customer" })}
    >
      <div className="bg-white ring-1 ring-black/5 rounded-3xl p-8 space-y-6">
        <div className="grid sm:grid-cols-2 gap-6 pb-6 border-b border-neutral-100">
          <div>
            <p className="text-xs uppercase tracking-widest text-neutral-400 mb-1">Client</p>
            <p className="font-medium">{state.customer.name}</p>
            <p className="text-sm text-neutral-500">{state.customer.email}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest text-neutral-400 mb-1">Téléphone</p>
            {(() => {
              const { dial, local } = splitPhone(state.customer.phone);
              const phoneErr = validatePhone(dial, local);
              if (phoneErr) {
                return (
                  <div className="rounded-lg bg-red-50 ring-1 ring-red-200 p-3">
                    <p className="text-xs text-red-700">{phoneErr}</p>
                    <button
                      type="button"
                      onClick={() => dispatch({ type: "GO", step: "customer" })}
                      className="mt-2 text-xs font-medium text-red-700 underline underline-offset-2 hover:text-red-900"
                    >
                      Modifier mon numéro
                    </button>
                  </div>
                );
              }
              return (
                <>
                  <p className="font-medium" title={formatPhonePretty(state.customer.phone)}>
                    {maskPhonePretty(state.customer.phone)}
                  </p>
                  <p className="text-xs text-neutral-400 mt-0.5">Quelques chiffres sont masqués pour votre sécurité.</p>
                  <button
                    type="button"
                    onClick={() => dispatch({ type: "GO", step: "customer" })}
                    className="mt-1 text-xs font-medium text-brand underline underline-offset-2 hover:text-accent"
                  >
                    Modifier
                  </button>
                </>
              );
            })()}
          </div>

        </div>

        <div className="space-y-3">
          {vehicleTotal > 0 && (
            <div className="flex justify-between">
              <span className="text-neutral-600">
                {state.vehicle.name} ({vehicleDays} jour{vehicleDays > 1 ? "s" : ""})
              </span>
              <span className="font-medium">{vehicleTotal}€</span>
            </div>
          )}
          {propertyTotal > 0 && (
            <div className="flex justify-between">
              <span className="text-neutral-600">
                {state.property.name} ({propertyNights} nuit{propertyNights > 1 ? "s" : ""})
              </span>
              <span className="font-medium">{propertyTotal}€</span>
            </div>
          )}
        </div>

        <div className="pt-6 border-t border-neutral-100 flex justify-between items-end">
          <span className="text-lg font-serif">Total</span>
          <span className="text-3xl font-serif text-accent">{total}€</span>
        </div>
      </div>

      <fieldset className="mt-8 space-y-3">
        <legend className="text-xs uppercase tracking-widest text-neutral-500 mb-2">
          Mode de paiement
        </legend>
        <div className="grid sm:grid-cols-2 gap-3">
          <PaymentChoice
            selected={state.paymentMode === "deposit"}
            onClick={() => dispatch({ type: "SET_PAYMENT_MODE", value: "deposit" })}
            title="Acompte 30%"
            sub={`Réservez avec ${deposit}€, solde sur place.`}
          />
          <PaymentChoice
            selected={state.paymentMode === "full"}
            onClick={() => dispatch({ type: "SET_PAYMENT_MODE", value: "full" })}
            title="Paiement intégral"
            sub={`Payez la totalité de ${total}€ en une fois.`}
          />
        </div>
      </fieldset>

      {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

      {(() => {
        const { dial, local } = splitPhone(state.customer.phone);
        const phoneInvalid = !!validatePhone(dial, local);
        return (
          <div className="mt-8 space-y-3">
            <button
              onClick={confirm}
              disabled={loading || phoneInvalid}
              title={phoneInvalid ? "Corrigez votre numéro de téléphone avant de confirmer." : undefined}
              className="w-full py-4 bg-accent text-white rounded-full font-medium hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading
                ? "Confirmation en cours…"
                : phoneInvalid
                  ? "Téléphone invalide — corrigez pour continuer"
                  : `Confirmer ma réservation · ${charged}€`}
            </button>
            {phoneInvalid && (
              <button
                type="button"
                onClick={() => dispatch({ type: "GO", step: "customer" })}
                className="w-full text-sm font-medium text-brand underline underline-offset-2 hover:text-accent"
              >
                Modifier mon numéro de téléphone
              </button>
            )}
          </div>
        );
      })()}
      <div className="mt-3">
        <p className="text-[11px] text-center text-neutral-400 max-w-[48ch] mx-auto">
          Votre réservation sera confirmée. Le paiement sécurisé en ligne sera activé prochainement —
          en attendant nous vous contacterons par email pour finaliser le règlement.
        </p>
      </div>
    </StepShell>
  );
}

function PaymentChoice({ selected, onClick, title, sub }: {
  selected: boolean; onClick: () => void; title: string; sub: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`p-5 text-left rounded-xl ring-1 transition-all ${
        selected ? "bg-accent text-white ring-accent" : "bg-white ring-black/5 hover:ring-brand/40"
      }`}
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
  return (
    <StepShell
      eyebrow="Confirmation"
      title="Merci, votre demande est enregistrée"
      description={`Référence de réservation : ${state.bookingRef}. Vous recevrez un email à ${state.customer.email} avec les détails.`}
    >
      <div className="bg-white ring-1 ring-black/5 rounded-3xl p-8">
        <p className="text-sm text-neutral-600 leading-relaxed">
          Notre équipe revient vers vous sous peu pour finaliser le paiement et organiser
          votre prise en charge. Pour toute question, contactez-nous directement par email
          ou téléphone.
        </p>
      </div>
      <button
        onClick={() => dispatch({ type: "RESET" })}
        className="mt-8 text-sm text-brand hover:underline"
      >
        Faire une nouvelle réservation
      </button>
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
        <p className="text-xs text-neutral-400">
          Location voiture & logement · Guadeloupe
        </p>
      </div>
    </footer>
  );
}
