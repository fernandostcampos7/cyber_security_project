import { FormEvent, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { api } from "../lib/api";

const CheckoutPage = () => {
  const [provider, setProvider] = useState("stripe");
  const mutation = useMutation({
    mutationFn: async (payload: { amount_cents: number; provider: string }) =>
      (await api.post("/checkout/session", payload)).data
  });

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    mutation.mutate({ amount_cents: 10000, provider });
  };

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-3xl font-semibold text-gold">Secure checkout</h1>
        <p className="text-silver/70">We tokenise all payments via Stripe or PayPal. Choose your preferred method.</p>
      </header>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex gap-4">
          <label className={`px-4 py-2 border rounded cursor-pointer ${provider === "stripe" ? "border-gold" : "border-transparent"}`}>
            <input type="radio" name="provider" value="stripe" checked={provider === "stripe"} onChange={() => setProvider("stripe")} className="hidden" />
            Stripe Payment Element
          </label>
          <label className={`px-4 py-2 border rounded cursor-pointer ${provider === "paypal" ? "border-gold" : "border-transparent"}`}>
            <input type="radio" name="provider" value="paypal" checked={provider === "paypal"} onChange={() => setProvider("paypal")} className="hidden" />
            PayPal
          </label>
        </div>
        <button type="submit" className="bg-gold text-charcoal px-4 py-2 rounded">
          Initiate {provider === "stripe" ? "Stripe" : "PayPal"} checkout
        </button>
        {mutation.isSuccess && (
          <div className="bg-black/20 p-4 rounded">
            <p className="text-silver">Session ready.</p>
            <pre className="text-xs text-silver/70 overflow-x-auto mt-2">{JSON.stringify(mutation.data, null, 2)}</pre>
          </div>
        )}
      </form>
      <section className="text-xs text-silver/60">
        <p>Available Stripe methods: Cards, Klarna, MB WAY, Multibanco. Strong Customer Authentication enforced.</p>
      </section>
    </section>
  );
};

export default CheckoutPage;
