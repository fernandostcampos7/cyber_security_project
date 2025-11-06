import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";

const OrdersPage = () => {
  const { data } = useQuery({ queryKey: ["orders"], queryFn: async () => (await api.get("/orders")).data });
  const orders = data?.orders ?? [];
  return (
    <section className="space-y-4">
      <header>
        <h1 className="text-3xl font-semibold text-gold">Your orders</h1>
        <p className="text-silver/60">Track statuses and re-live past treasures.</p>
      </header>
      <ul className="space-y-3">
        {orders.map((order: any) => (
          <li key={order.id} className="bg-black/20 rounded p-4">
            <div className="flex justify-between">
              <span>Order #{order.id.slice(0, 8)}</span>
              <span className="text-gold">{order.status}</span>
            </div>
            <p className="text-xs text-silver/60">{new Date(order.created_at).toLocaleString()}</p>
          </li>
        ))}
        {orders.length === 0 && <li>No orders yet.</li>}
      </ul>
    </section>
  );
};

export default OrdersPage;
