import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';

type Product = {
	id: number;
	name: string;
	brand: string;
	category: string;
	price_cents: number;
	currency: string;
};

export default function Products() {
	const [products, setProducts] = useState<Product[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');

	useEffect(() => {
		async function load() {
			try {
				const res = await api.get('/api/products', {
					params: { limit: 20, page: 1 },
				});
				setProducts(res.data.items ?? []);
			} catch (err: any) {
				setError(err.response?.data?.error || 'Failed to load products');
			} finally {
				setLoading(false);
			}
		}

		load();
	}, []);

	if (loading) return <p style={{ padding: 20 }}>Loading products…</p>;
	if (error) return <p style={{ padding: 20, color: 'red' }}>{error}</p>;

	if (!products.length) {
		return (
			<p style={{ padding: 20 }}>No products yet. Seed one in the database.</p>
		);
	}

	return (
		<div style={{ padding: 20 }}>
			<h1>Products</h1>
			<ul>
				{products.map((p) => (
					<li key={p.id} style={{ marginBottom: 8 }}>
						<Link to={`/products/${p.id}`}>
							{p.name}{' '}
							<span style={{ color: '#555' }}>
								({p.brand}) – {p.price_cents / 100} {p.currency}
							</span>
						</Link>
					</li>
				))}
			</ul>
		</div>
	);
}
