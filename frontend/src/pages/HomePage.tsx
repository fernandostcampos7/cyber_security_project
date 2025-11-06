import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api } from "../lib/api";

const HomePage = () => {
  const { data } = useQuery({ queryKey: ["products"], queryFn: async () => (await api.get("/products")).data });
  const products = data?.items ?? [];
  return (
    <section>
      <header className="mb-6 flex flex-col gap-2">
        <h1 className="text-4xl font-semibold text-gold">New Season, New Luminosity</h1>
        <p className="text-sm text-silver/70 max-w-2xl">
          Discover LePax signature pieces curated for the discerning wardrobe. Search, filter and fall in love with
          contemporary luxury.
        </p>
      </header>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product: any) => (
          <Link key={product.id} to={`/products/${product.id}`} className="bg-black/20 rounded-lg p-4 shadow-lg">
            <img src={product.hero_image_url || "/placeholder.png"} alt={product.name} className="aspect-square object-cover rounded" />
            <div className="mt-4">
              <h2 className="text-lg font-semibold text-silver">{product.name}</h2>
              <p className="text-sm text-silver/60">{product.brand}</p>
              <p className="mt-2 text-gold">€ {(product.price_cents / 100).toFixed(2)}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default HomePage;
