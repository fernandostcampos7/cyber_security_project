import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import ProductCard from '../components/ProductCard';


type Product = {
	id: number;
	name: string;
	brand: string;
	category: string;
	price_cents: number;
	currency: string;
	hero_image_url: string | null;
};

export default function Catalogue() {
	const [products, setProducts] = useState<Product[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const [search, setSearch] = useState('');
	const [category, setCategory] = useState('');
	const [brand, setBrand] = useState('');

	useEffect(() => {
		load();
	}, []);

	async function load(params: Record<string, string | number> = {}) {
		try {
			setLoading(true);
			const res = await api.get('/api/products', {
				params: { limit: 24, page: 1, ...params },
			});
			setProducts(res.data.items ?? []);
			setError('');
		} catch (err: any) {
			setError(err.response?.data?.error || 'Failed to load products');
		} finally {
			setLoading(false);
		}
	}

	function handleFilterSubmit(e: React.FormEvent) {
		e.preventDefault();
		const params: Record<string, string> = {};
		if (search.trim()) params.q = search.trim();
		if (category.trim()) params.category = category.trim();
		if (brand.trim()) params.brand = brand.trim();
		load(params);
	}

	return (
		<div className='space-y-6'>
			<header className='flex flex-col justify-between gap-4 sm:flex-row sm:items-end'>
				<div>
					<p className='text-xs tracking-[0.3em] text-lepax-silver/60 uppercase'>
						Catalogue
					</p>
					<h1 className='text-3xl font-semibold tracking-tight'>Products</h1>
					<p className='text-xs text-lepax-silver/70'>
						Filter by brand, category and search term. Powered by FTS5 on the
						backend.
					</p>
				</div>

				<form
					onSubmit={handleFilterSubmit}
					className='flex flex-wrap gap-2 text-xs'
				>
					<input
						className='rounded-full border border-slate-700 bg-lepax-charcoalSoft px-3 py-1 text-xs outline-none focus:border-lepax-gold'
						placeholder='Search name or description'
						value={search}
						onChange={(e) => setSearch(e.target.value)}
					/>
					<input
						className='rounded-full border border-slate-700 bg-lepax-charcoalSoft px-3 py-1 text-xs outline-none focus:border-lepax-gold'
						placeholder='Brand'
						value={brand}
						onChange={(e) => setBrand(e.target.value)}
					/>
					<input
						className='rounded-full border border-slate-700 bg-lepax-charcoalSoft px-3 py-1 text-xs outline-none focus:border-lepax-gold'
						placeholder='Category'
						value={category}
						onChange={(e) => setCategory(e.target.value)}
					/>
					<button
						type='submit'
						className='rounded-full bg-lepax-gold px-4 py-1 font-medium text-lepax-charcoal hover:bg-lepax-rose transition'
					>
						Apply
					</button>
				</form>
			</header>

			{loading && <p className='text-sm text-lepax-silver/70'>Loading…</p>}
			{error && (
				<p className='text-sm text-red-400'>Error loading catalogue: {error}</p>
			)}

			{!loading && !products.length && !error && (
				<p className='text-sm text-lepax-silver/70'>
					No products yet. Seed some in the database.
				</p>
			)}

			<section className='grid gap-5 sm:grid-cols-2 lg:grid-cols-3'>
				{products.map((p) => (
					<ProductCard key={p.id} {...p} />
				))}
			</section>
		</div>
	);
}
