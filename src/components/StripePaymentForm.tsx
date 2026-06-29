import { useState, useMemo } from "react";
import { PaymentElement, useStripe, useElements, Elements } from "@stripe/react-stripe-js";
import { loadStripe, type StripeElementsOptions } from "@stripe/stripe-js";

const stripeKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ?? "";
const stripePromise = stripeKey ? loadStripe(stripeKey) : null;

interface Props {
  clientSecret: string;
  onSuccess: (paymentIntentId: string) => void;
  onError: (message: string) => void;
}

export function StripePaymentForm({ clientSecret, onSuccess, onError }: Props) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setLoading(true);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: window.location.href },
      redirect: "if_required",
    });

    if (error) {
      onError(error.message ?? "Erreur de paiement");
      setLoading(false);
      return;
    }

    if (paymentIntent?.status === "succeeded") {
      onSuccess(paymentIntent.id);
    } else {
      onError("Le paiement n'a pas ete confirme");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit}>
      <PaymentElement />
      <button
        type="submit"
        disabled={!stripe || loading}
        className="mt-6 w-full py-4 bg-accent text-white rounded-full font-medium hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Paiement en cours…" : "Payer maintenant"}
      </button>
    </form>
  );
}

export function StripeWrapper({
  clientSecret,
  children,
}: {
  clientSecret: string;
  children: React.ReactNode;
}) {
  const options = useMemo<StripeElementsOptions>(
    () => ({
      clientSecret,
      appearance: { theme: "stripe" as const },
    }),
    [clientSecret],
  );

  if (!stripePromise) {
    return (
      <div className="p-4 bg-amber-50 rounded-xl ring-1 ring-amber-200 text-sm text-amber-800">
        Stripe n'est pas configuré. Définissez VITE_STRIPE_PUBLISHABLE_KEY dans vos variables
        d'environnement.
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise} options={options}>
      {children}
    </Elements>
  );
}
