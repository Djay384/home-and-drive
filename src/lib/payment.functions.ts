import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { createPaymentIntentSchema } from "./booking-schemas";

let _stripe: unknown = null;
async function getStripe() {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY non configurée");
    const Stripe = await import("stripe");
    _stripe = new Stripe.default(key, { apiVersion: "2025-03-31.final" as never });
  }
  return _stripe as {
    paymentIntents: { create: Function; retrieve: Function };
    checkout: { sessions: { create: Function } };
  };
}

export const createPaymentIntent = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => createPaymentIntentSchema.parse(input))
  .handler(async ({ data }) => {
    const { data: booking, error } = await supabaseAdmin
      .from("bookings")
      .select("id, reference, amount_charged, customer_email, customer_name, booking_type")
      .eq("id", data.bookingId)
      .single();

    if (error || !booking) throw new Error("Réservation introuvable");
    if (booking.amount_charged <= 0) throw new Error("Montant invalide");

    const stripe = await getStripe();
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(Number(booking.amount_charged) * 100),
      currency: "eur",
      metadata: {
        booking_id: booking.id,
        reference: booking.reference,
      },
      description: `Réservation ${booking.reference} — ${booking.customer_name}`,
      receipt_email: booking.customer_email,
      automatic_payment_methods: { enabled: true },
    });

    await supabaseAdmin
      .from("bookings")
      .update({ stripe_payment_intent: paymentIntent.id })
      .eq("id", data.bookingId);

    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: booking.amount_charged,
    };
  });

export const confirmPayment = createServerFn({ method: "POST" }).handler(
  async ({ data }: { data: { bookingId: string; paymentIntentId: string } }) => {
    const { data: booking, error } = await supabaseAdmin
      .from("bookings")
      .select("id, stripe_payment_intent, amount_charged, payment_status")
      .eq("id", data.bookingId)
      .single();

    if (error || !booking) throw new Error("Réservation introuvable");
    if (booking.stripe_payment_intent !== data.paymentIntentId) {
      throw new Error("Incohérence du paiement");
    }

    const stripe = await getStripe();
    const intent = await stripe.paymentIntents.retrieve(data.paymentIntentId);

    if (intent.status !== "succeeded") {
      throw new Error("Paiement non confirmé par Stripe");
    }

    await supabaseAdmin
      .from("bookings")
      .update({
        payment_status: "paid",
        paid_at: new Date().toISOString(),
      })
      .eq("id", data.bookingId);

    return { success: true };
  },
);

export const createCheckoutSession = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => createPaymentIntentSchema.parse(input))
  .handler(async ({ data }) => {
    const { data: booking, error } = await supabaseAdmin
      .from("bookings")
      .select("id, reference, amount_charged, customer_email, customer_name")
      .eq("id", data.bookingId)
      .single();

    if (error || !booking) throw new Error("Réservation introuvable");

    const baseUrl = process.env.PUBLIC_URL || "http://localhost:3000";
    const stripe = await getStripe();

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: `Réservation ${booking.reference}`,
              description: `Location ${booking.customer_name}`,
            },
            unit_amount: Math.round(Number(booking.amount_charged) * 100),
          },
          quantity: 1,
        },
      ],
      metadata: { booking_id: booking.id, reference: booking.reference },
      customer_email: booking.customer_email,
      success_url: `${baseUrl}/home-and-drive/?payment=success&booking_id=${booking.id}`,
      cancel_url: `${baseUrl}/home-and-drive/?payment=cancelled&booking_id=${booking.id}`,
    });

    await supabaseAdmin
      .from("bookings")
      .update({ stripe_session_id: session.id })
      .eq("id", data.bookingId);

    return { sessionUrl: session.url, sessionId: session.id };
  });
