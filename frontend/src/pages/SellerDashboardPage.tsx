import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";

const SellerDashboardPage = () => {
  const { data: transactions } = useQuery({ queryKey: ["seller-transactions"], queryFn: async () => (await api.get("/seller/transactions")).data });
  return (
    <section className="space-y-4">
      <header>
        <h1 className="text-3xl font-semibold text-gold">Seller studio</h1>
        <p className="text-silver/60">Create, curate and monitor your LePax listings.</p>
      </header>
      <div className="bg-black/30 p-4 rounded">
        <h2 className="text-sm uppercase tracking-widest text-silver/60">Recent transactions</h2>
        <ul className="mt-2 space-y-2">
          {transactions?.transactions?.map((tx: any) => (
            <li key={tx.id} className="text-sm text-silver/70">
              Variant {tx.variant_id} · Qty {tx.qty} · € {(tx.unit_price_cents / 100).toFixed(2)}
            </li>
          ))}
          {transactions?.transactions?.length === 0 && <li>No transactions yet.</li>}
        </ul>
      </div>
      <section className="bg-black/30 p-4 rounded text-sm text-silver/70">
        <p>Product management and image uploads are available via the admin portal in this scaffold.</p>
      </section>
    </section>
  );
};

export default SellerDashboardPage;
