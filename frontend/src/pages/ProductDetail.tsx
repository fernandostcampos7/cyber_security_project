import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { formatMoney } from '../lib/formatMoney';
import ProductReviews from '../components/ProductReviews';


type Product = {
	id: number;
	name: string;
	brand: string;
	category: string;
	description_md: string;
	price_cents: number;
	currency: string;
};

export default function ProductDetail() {
	const { id } = useParams();
	const [product, setProduct] = useState<Product | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');

	const { user } = useAuth();
	console.log('ProductDetail user =', user);
	const { addItem } = useCart();

	useEffect(() => {
		if (!id) return;

		async function load() {
			try {
				setLoading(true);
				setError('');
				const prodRes = await api.get(`/api/products/${id}`);
				setProduct(prodRes.data);
			} catch (err: any) {
				setError(err.response?.data?.error || 'Failed to load product');
			} finally {
				setLoading(false);
			}
		}

		load();
	}, [id]);

	function handleAddToCart() {
		if (!product) return;

		addItem({
			product_id: product.id,
			name: product.name,
			brand: product.brand,
			category: product.category,
			price_cents: product.price_cents,
			currency: product.currency,
		});
	}

	if (loading) {
		return (
			<main className='mx-auto max-w-4xl px-4 py-10 text-slate-100'>
				<p className='text-sm text-lepax-silver/80'>Loading product…</p>
			</main>
		);
	}

	if (error) {
		return (
			<main className='mx-auto max-w-4xl px-4 py-10 text-slate-100'>
				<p className='text-sm text-red-400'>{error}</p>
			</main>
		);
	}

	if (!product) {
		return (
			<main className='mx-auto max-w-4xl px-4 py-10 text-slate-100'>
				<p className='text-sm text-lepax-silver/80'>Product not found.</p>
			</main>
		);
	}

	const priceDisplay = formatMoney(product.price_cents, product.currency);

	return (
		<main className='mx-auto max-w-4xl px-4 py-10 text-slate-100'>
			<section className='space-y-4'>
				{/* Return to catalogue button */}
				<Link
					to='/catalogue'
					className='inline-block rounded-full border border-lepax-silver/40 px-4 py-1 text-xs text-lepax-silver hover:border-lepax-gold hover:text-lepax-gold transition'
				>
					← Back to catalogue
				</Link>

				<h1 className='text-2xl font-semibold text-lepax-gold'>
					{product.name}
				</h1>

				<p className='text-sm text-lepax-silver/80'>
					<span className='font-semibold text-slate-100'>Brand:</span>{' '}
					{product.brand}
					<span className='mx-1 text-lepax-silver/60'>|</span>
					<span className='font-semibold text-slate-100'>Category:</span>{' '}
					{product.category}
				</p>

				<p className='text-sm'>
					<span className='font-semibold text-slate-100'>Price:</span>{' '}
					{priceDisplay}
				</p>

				<button
					onClick={handleAddToCart}
					className='mt-4 rounded-full bg-lepax-gold px-6 py-2 text-sm font-medium text-lepax-charcoal hover:bg-lepax-rose transition'
				>
					Add to bag
				</button>

				<div className='pt-4 space-y-1'>
					<p className='text-xs font-semibold uppercase tracking-[0.18em] text-lepax-silver/60'>
						Description
					</p>
					<p className='text-sm leading-relaxed text-lepax-silver/90 whitespace-pre-line'>
						{product.description_md}
					</p>
				</div>

				<div className='mt-8 space-y-3'>
					<p className='text-xs font-semibold uppercase tracking-[0.18em] text-lepax-silver/60'>
						Customer reviews
					</p>

					<ProductReviews productId={product.id} />

					<div className='mt-3 rounded border border-slate-800 bg-lepax-charcoal/70 px-4 py-3'>
						<p className='text-xs text-lepax-silver/80'>
							To write a review you need to have purchased this item.
						</p>

						{user ? (
							<p className='mt-1 text-xs text-lepax-silver/60'>
								After you buy this item, you will find the review form in your{' '}
								<span className='font-semibold text-lepax-gold'>Orders</span>{' '}
								page.
							</p>
						) : (
							<p className='mt-1 text-xs text-lepax-silver/60'>
								Sign in, place an order, and then you can review the item from
								your order history.
							</p>
						)}
					</div>
				</div>
			</section>
		</main>
	);
}
