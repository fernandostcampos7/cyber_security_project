import { useState } from "react";
import { useDebounce } from "../hooks/useDebounce";
import { useProductSearch } from "../features/search/useProductSearch";
import ProductCard from "../components/ProductCard";

export default function SearchPage() {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const debounced = useDebounce(q, 350);
  const { data, isFetching, isError, error } = useProductSearch({
		q: debounced,
		page,
		limit: 12,
		// brand, category, sort can be added here when you wire filters
	});

  const total = data?.total ?? 0;
  const items = data?.items ?? [];
  const pages = Math.max(1, Math.ceil(total / 12));

  const hasQuery = debounced.trim().length > 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <header className="space-y-3">
        <p className="text-xs tracking-[0.3em] text-lepax-silver/60 uppercase">
          Search
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">
          Find a product
        </h1>
        <p className="text-xs text-lepax-silver/70 max-w-xl">
          Search by name, brand, category or description. This uses the FTS5 backed
          search in the LePax API.
        </p>

        <div className="flex flex-wrap gap-2 text-xs">
          <input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            placeholder="Type to search, for example bag or coat"
            className="w-full max-w-md rounded-full border border-slate-700 bg-lepax-charcoalSoft px-4 py-2 text-sm outline-none focus:border-lepax-gold"
          />
        </div>
      </header>

      {/* Status messages */}
      {isFetching && (
        <p className="text-sm text-lepax-silver/70">Searching…</p>
      )}

      {isError && (
        <p className="text-sm text-red-400">
          Error: {(error as any)?.message ?? "Search failed"}
        </p>
      )}

      {!isFetching && !isError && hasQuery && total === 0 && (
        <p className="text-sm text-lepax-silver/70">
          No products found for{" "}
          <span className="font-semibold">"{debounced}"</span>.
        </p>
      )}

      {!hasQuery && (
        <p className="text-sm text-lepax-silver/60">
          Start typing to search the catalogue.
        </p>
      )}

      {/* Results grid */}
      <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((p: any) => (
          <ProductCard key={p.id} {...p} />
        ))}
      </section>

      {/* Pagination */}
      {hasQuery && pages > 1 && (
        <div className="flex items-center gap-3 text-xs">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded-full border border-slate-700 px-4 py-1 disabled:opacity-40"
          >
            Prev
          </button>
          <span className="text-lepax-silver/80">
            Page {page} of {pages} • {total} result{total === 1 ? "" : "s"}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(pages, p + 1))}
            disabled={page === pages}
            className="rounded-full border border-slate-700 px-4 py-1 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
