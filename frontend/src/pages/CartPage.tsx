import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api } from "../lib/api";

const CartPage = () => {
  const { data } = useQuery({ queryKey: ["cart"], queryFn: async () => (await api.get("/cart")).data });
  const items = data?.items ?? [];
  return (
    <section className="space-y-4">
      <header>
        <h1 className="text-3xl font-semibold text-gold">Your curated selection</h1>
        <p className="text-silver/60">Refine before you complete the look.</p>
      </header>
      <ul className="space-y-3">
        {items.map((item: any, index: number) => (
          <li key={`${item.product_id}-${index}`} className="bg-black/30 rounded p-4">
            <div className="flex items-center justify-between">
              <div>
                <p>Product: {item.product}</p>
                <p className="text-xs text-silver/60">Variant: {item.variant ?? "Standard"}</p>
              </div>
              <span className="text-gold">Qty {item.quantity}</span>
            </div>
          </li>
        ))}
        {items.length === 0 && <li>Your cart is waiting for inspiration.</li>}
      </ul>
      <Link to="/checkout" className="inline-flex items-center gap-2 bg-gold text-charcoal px-4 py-2 rounded">
        Proceed to checkout
      </Link>
    </section>
  );
};

export default CartPage;
