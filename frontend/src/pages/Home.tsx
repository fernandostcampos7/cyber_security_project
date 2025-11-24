import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';

type ProductSummary = {
	id: number;
	name: string;
	brand: string;
	category: string;
	price_cents: number;
	currency: string;
	hero_image_url?: string | null;
};

function formatMoney(price_cents: number, currency: string) {
	return new Intl.NumberFormat('en-GB', {
		style: 'currency',
		currency,
		minimumFractionDigits: 2,
	}).format(price_cents / 100);
}

function HomeCarousel() {
	const [items, setItems] = useState<ProductSummary[]>([]);
	const [index, setIndex] = useState(0);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		async function load() {
			try {
				const res = await api.get('/api/products', {
					params: { limit: 20 },
				});

				// Adjust depending on your backend shape
				const data = Array.isArray(res.data) ? res.data : res.data.items;
				setItems(data || []);
			} catch (err) {
				console.error('Failed to load featured products', err);
			} finally {
				setLoading(false);
			}
		}

		load();
	}, []);

	useEffect(() => {
		if (!items.length) return;

		const id = setInterval(() => {
			setIndex((prev) => (prev + 1) % items.length);
		}, 4000);

		return () => clearInterval(id);
	}, [items]);

	if (loading) {
		return (
			<div className='flex h-80 w-64 items-center justify-center rounded-3xl bg-lepax-charcoalSoft shadow-card text-xs text-lepax-silver/70'>
				Loading picks...
			</div>
		);
	}

	if (!items.length) {
		return (
			<div className='flex h-80 w-64 items-center justify-center rounded-3xl bg-lepax-charcoalSoft shadow-card text-xs text-lepax-silver/70'>
				No products available yet.
			</div>
		);
	}

	const p = items[index];

	return (
		<Link
			to={`/products/${p.id}`}
			className='relative h-80 w-64 rounded-3xl bg-gradient-to-b from-lepax-silver/10 via-lepax-rose/20 to-lepax-charcoalSoft shadow-card overflow-hidden'
		>
			{p.hero_image_url && (
				<img
					src={p.hero_image_url}
					alt={p.name}
					className='absolute inset-0 h-full w-full object-cover opacity-60'
				/>
			)}

			<div className='absolute inset-0 rounded-3xl border border-lepax-gold/40 bg-lepax-charcoalSoft/80 p-4 flex flex-col justify-between'>
				<div className='space-y-3'>
					<p className='text-[0.6rem] tracking-[0.25em] text-lepax-silver/70 uppercase'>
						FEATURED FROM CATALOGUE
					</p>
					<p className='text-lg font-semibold line-clamp-2'>{p.name}</p>
					<p className='text-xs text-lepax-silver/70'>
						{p.brand} • {p.category}
					</p>
				</div>

				<div className='space-y-2'>
					<p className='text-2xl font-semibold text-lepax-gold'>
						{formatMoney(p.price_cents, p.currency)}
					</p>
					<p className='text-[0.7rem] text-lepax-silver/70'>
						Tap to view details and reviews. This is a live product from your
						secure catalogue.
					</p>

					<div className='mt-2 flex items-center justify-between text-[0.65rem] text-lepax-silver/60'>
						<span>
							{index + 1} / {items.length}
						</span>
						<div className='flex gap-1'>
							{items.map((_, i) => (
								<span
									key={i}
									className={
										'h-1.5 w-1.5 rounded-full ' +
										(i === index ? 'bg-lepax-gold' : 'bg-lepax-silver/40')
									}
								/>
							))}
						</div>
					</div>
				</div>
			</div>
		</Link>
	);
}

export default function Home() {
	return (
		<section className='min-h-[calc(100vh-120px)] flex items-center'>
			<div className='w-full max-w-6xl mx-auto px-6'>
				<div className='grid gap-10 lg:grid-cols-[3fr,2fr]'>
					<section className='space-y-6'>
						<p className='text-xs tracking-[0.35em] text-lepax-silver/60 uppercase'>
							LUXURY • DESIGNER • SECURE
						</p>
						<h1 className='text-4xl font-semibold tracking-tight sm:text-5xl'>
							Curated luxury fashion with{' '}
							<span className='text-lepax-gold'>security by design</span>.
						</h1>
						<p className='max-w-xl text-sm text-lepax-silver/80'>
							LePax is a boutique prototype store for high end fashion, built to
							showcase secure engineering. Every login, review and upload is
							handled with modern best practices in authentication, RBAC and
							data protection.
						</p>

						<div className='flex flex-wrap gap-4'>
							<Link
								to='/catalogue'
								className='rounded-full bg-lepax-gold px-6 py-2 text-sm font-medium text-lepax-charcoal shadow-card hover:bg-lepax-rose transition'
							>
								Browse catalogue
							</Link>
							<Link
								to='/login'
								className='rounded-full border border-lepax-silver/50 px-6 py-2 text-sm text-lepax-silver hover:border-lepax-gold hover:text-lepax-gold transition'
							>
								Sign in securely
							</Link>
						</div>

						<div className='mt-6 grid gap-4 text-xs text-lepax-silver/70 sm:grid-cols-3'>
							<div>
								<p className='font-semibold text-lepax-gold'>Secure sessions</p>
								<p>Argon2 passwords, hardened cookies and role based access.</p>
							</div>
							<div>
								<p className='font-semibold text-lepax-gold'>Clean reviews</p>
								<p>Markdown with server side sanitisation against XSS.</p>
							</div>
							<div>
								<p className='font-semibold text-lepax-gold'>Logged actions</p>
								<p>Room for audit logs, view events and fraud detection.</p>
							</div>
						</div>
					</section>

					<section className='relative hidden items-center justify-center lg:flex'>
						<HomeCarousel />
					</section>
				</div>
			</div>
		</section>
	);
}
