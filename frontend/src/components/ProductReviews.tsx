import { useEffect, useState } from 'react';
import { api } from '../lib/api';

type ProductReview = {
	id: number;
	rating: number;
	comment: string;
	author_name: string;
	created_at: string;
};

export default function ProductReviews({ productId }: { productId: number }) {
	const [reviews, setReviews] = useState<ProductReview[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');

	useEffect(() => {
		async function load() {
			try {
				setLoading(true);
				setError('');
				const res = await api.get(`/api/products/${productId}/reviews`);
				setReviews(res.data.reviews ?? []);
			} catch (err: any) {
				setError(err?.response?.data?.error || 'Failed to load reviews');
			} finally {
				setLoading(false);
			}
		}
		load();
	}, [productId]);

	if (loading) {
		return <p className='text-xs text-lepax-silver/70'>Loading reviews…</p>;
	}

	if (error) {
		return <p className='text-xs text-red-400'>{error}</p>;
	}

	if (!reviews.length) {
		return (
			<p className='text-xs text-lepax-silver/70'>
				No reviews yet. Be the first to review this product.
			</p>
		);
	}

	return (
		<ul className='mt-3 space-y-3'>
			{reviews.map((rev) => (
				<li
					key={rev.id}
					className='rounded-xl border border-slate-800 bg-lepax-charcoalSoft/80 p-3 text-sm'
				>
					<div className='flex justify-between items-baseline gap-3'>
						<p className='font-medium text-slate-100'>{rev.author_name}</p>
						<p className='text-xs text-lepax-silver/70'>
							{new Date(rev.created_at).toLocaleDateString('en-GB')}
						</p>
					</div>
					<p className='text-xs text-lepax-gold mt-1'>
						{'★'.repeat(rev.rating)}
						{'☆'.repeat(5 - rev.rating)}
					</p>
					<p className='mt-2 text-xs text-lepax-silver/80'>{rev.comment}</p>
				</li>
			))}
		</ul>
	);
}
