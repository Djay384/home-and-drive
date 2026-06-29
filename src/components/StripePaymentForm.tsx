import { useState } from "react";
import { PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";

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
      confirmParams: {
        return_url: window.location.href,
      },
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
        {loading ? "Paiement en cours…" : `Payer maintenant`}
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
  const { Elements } = require("@stripe/react-stripe-js");
  const { loadStripe } = require("@stripe/stripe-js");

  const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "");

  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      {children}
    </Elements>
  );
}
