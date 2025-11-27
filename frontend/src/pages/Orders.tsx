import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Link } from 'react-router-dom';
import ProductReviewForm from '../components/ProductReviewForm';
import { formatMoney } from '../lib/formatMoney';

type OrderItemSummary = {
	product_id: number;
	product_name: string;
	product_brand: string;
	product_image_url: string;
	qty: number;
	unit_price_cents: number;
	currency: string;
};

type OrderSummary = {
	id: number;
	created_at: string | null;
	status: string;
	total_cents: number;
	currency: string;
	items: OrderItemSummary[];
};

export default function OrdersPage() {
	const [orders, setOrders] = useState<OrderSummary[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const [returnMessage, setReturnMessage] = useState('');
	const [returningOrderId, setReturningOrderId] = useState<number | null>(null);

	function handleRequestReturn(orderId: number) {
		setReturningOrderId(orderId);
		setReturnMessage(
			`Return request recorded for order #${orderId}. In a real system this would be sent to customer service and fulfilment systems.`
		);
	}

	useEffect(() => {
		async function load() {
			try {
				setLoading(true);
				setError('');
				const res = await api.get('/api/orders/my');
				setOrders(res.data.orders ?? []);
			} catch (err: any) {
				const status = err?.response?.status;

				// Friendlier messages for auth/role errors
				if (status === 401) {
					setError(
						'You need to be signed in as a customer to view order history.'
					);
				} else if (status === 403) {
					setError(
						'This account type cannot view personal orders. Only customer accounts can place orders in this prototype.'
					);
				} else {
					setError(err?.response?.data?.error || 'Failed to load orders');
				}
			} finally {
				setLoading(false);
			}
		}

		load();
	}, []);

	if (loading) {
		return (
			<main className='mx-auto max-w-4xl px-4 py-10 text-slate-100'>
				<p className='text-sm text-lepax-silver/80'>Loading your orders…</p>
			</main>
		);
	}

	if (error) {
		return (
			<main className='mx-auto max-w-4xl px-4 py-10 text-slate-100'>
				<h1 className='text-2xl font-semibold mb-3'>Your orders</h1>
				<p className='text-sm text-red-400'>{error}</p>
			</main>
		);
	}

	if (!orders.length) {
		return (
			<main className='mx-auto max-w-4xl px-4 py-10 text-slate-100 space-y-3'>
				<h1 className='text-2xl font-semibold'>Your orders</h1>
				<p className='text-sm text-lepax-silver/70'>
					You have not placed any orders yet.
				</p>
			</main>
		);
	}

	return (
		<main className='mx-auto max-w-4xl px-4 py-10 text-slate-100 space-y-6'>
			<header>
				<p className='text-xs tracking-[0.3em] text-lepax-silver/60 uppercase'>
					Account
				</p>
				<h1 className='text-3xl font-semibold tracking-tight'>Your orders</h1>
			</header>

			<div className='space-y-5'>
				{orders.map((order) => {
					const dateLabel = order.created_at
						? new Date(order.created_at).toLocaleString('en-GB')
						: 'Unknown date';

					return (
						<section
							key={order.id}
							className='space-y-3 rounded-2xl border border-slate-800 bg-lepax-charcoalSoft/80 p-5'
						>
							<header className='flex flex-wrap items-baseline justify-between gap-2'>
								<div>
									<p className='text-xs text-lepax-silver/60'>
										Order #{order.id}
									</p>
									<p className='text-xs text-lepax-silver/70'>{dateLabel}</p>
								</div>
								<div className='text-right'>
									<p className='text-xs uppercase tracking-[0.18em] text-lepax-silver/60'>
										Status
									</p>
									<p className='text-sm font-semibold text-lepax-gold'>
										{order.status}
									</p>
									<p className='text-sm font-semibold text-lepax-gold mt-1'>
										{/* Use formatMoney only; do not double-print currency */}
										{formatMoney(order.total_cents, order.currency)}
									</p>
								</div>
							</header>

							{/* RETURN BUTTON BLOCK */}
							<div className='mt-2 flex items-center justify-between gap-2'>
								<p className='text-[0.7rem] text-lepax-silver/70'>
									Need to return this order? Use the simulated request below.
								</p>
								<button
									type='button'
									onClick={() => handleRequestReturn(order.id)}
									className='rounded-full border border-lepax-gold px-3 py-1 text-[0.7rem] text-lepax-gold hover:bg-lepax-gold hover:text-lepax-charcoal transition'
								>
									Request return (simulated)
								</button>
							</div>
							{/* END RETURN BUTTON BLOCK */}

							<ul className='space-y-2'>
								{order.items.map((item) => (
									<li
										key={item.product_id}
										className='rounded-xl border border-slate-800 bg-lepax-charcoal/70 px-3 py-2 text-sm'
									>
										<div className='flex items-start gap-3'>
											<div className='h-16 w-16 overflow-hidden rounded-lg bg-slate-900'>
												{item.product_image_url && (
													<img
														src={item.product_image_url}
														alt={item.product_name}
														className='h-full w-full object-cover'
													/>
												)}
											</div>

											<div className='flex-1'>
												<p className='font-medium text-slate-100'>
													{item.product_name}
												</p>
												<p className='text-xs text-lepax-silver/70'>
													{item.product_brand}
												</p>
												<p className='mt-1 text-xs text-lepax-silver/70'>
													Qty {item.qty} •{' '}
													{(item.unit_price_cents / 100).toFixed(2)}{' '}
													{item.currency} each
												</p>

												<Link
													to={`/products/${item.product_id}`}
													className='mt-1 inline-flex text-[0.7rem] text-lepax-gold hover:text-lepax-rose underline-offset-2 hover:underline'
												>
													View product details
												</Link>
											</div>
										</div>

										<ProductReviewForm
											productId={item.product_id}
											productName={item.product_name}
										/>
									</li>
								))}
							</ul>
						</section>
					);
				})}
			</div>

			{returnMessage && (
				<p className='mt-3 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/40 rounded-lg px-3 py-2'>
					{returnMessage}
				</p>
			)}

			<section className='mb-6 rounded-2xl border border-slate-800 bg-lepax-charcoalSoft/80 p-4 text-xs text-lepax-silver/80'>
				<h2 className='text-sm font-semibold text-slate-100 mb-1'>
					Support and returns (prototype)
				</h2>
				<p>
					LePax simulates a standard 14 day return policy. In this coursework
					build, return requests are logged in the UI only and do not trigger
					real logistics workflows. For real deployments, this step would
					integrate with customer service tooling and warehouse systems.
				</p>
				<p className='mt-2'>
					For customer support in this prototype, customers are advised to
					contact
					<span className='font-medium'> support@lepax.shop</span>.
				</p>
			</section>
		</main>
	);
}
