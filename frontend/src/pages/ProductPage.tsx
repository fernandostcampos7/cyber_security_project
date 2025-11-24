import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { api } from "../lib/api";

const ProductPage = () => {
  const { id } = useParams();
  const { data } = useQuery({
    queryKey: ["product", id],
    queryFn: async () => (await api.get(`/products/${id}`)).data,
    enabled: !!id
  });
  const product = data?.product;
  const reviews = data?.reviews ?? [];
  if (!product) {
    return <p>Loading product...</p>;
  }
  return (
    <article className="grid gap-8 md:grid-cols-2">
      <div>
        <img src={product.hero_image_url || "/placeholder.png"} alt={product.name} className="rounded-lg" />
        <div className="grid grid-cols-4 gap-2 mt-4">
          {product.images?.map((image: any) => (
            <img key={image.id} src={image.url} className="rounded" />
          ))}
        </div>
      </div>
      <div className="space-y-4">
        <header>
          <p className="text-sm uppercase tracking-widest text-silver/60">{product.brand}</p>
          <h1 className="text-4xl font-semibold text-gold">{product.name}</h1>
        </header>
        <p className="text-lg text-gold">€ {(product.price_cents / 100).toFixed(2)}</p>
        <section>
          <h2 className="text-sm uppercase tracking-widest text-silver/60 mb-2">Variants</h2>
          <div className="flex flex-wrap gap-2">
            {product.variants?.map((variant: any) => (
              <span key={variant.id} className="px-3 py-1 bg-black/30 rounded-full text-xs">
                {variant.size || variant.colour} · stock {variant.stock}
              </span>
            ))}
          </div>
        </section>
        <section>
          <h2 className="text-sm uppercase tracking-widest text-silver/60 mb-2">Reviews</h2>
          <div className="space-y-3">
            {reviews.map((review: any) => (
              <div key={review.id} className="bg-black/20 rounded p-4">
                <p className="text-gold">Rating {review.rating}/5</p>
                <div dangerouslySetInnerHTML={{ __html: review.body_html_sanitised }} />
              </div>
            ))}
            {reviews.length === 0 && <p>No reviews yet. Be the first to share your story.</p>}
          </div>
        </section>
      </div>
    </article>
  );
};

export default ProductPage;
