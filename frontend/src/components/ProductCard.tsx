import { Link } from 'react-router-dom';
import { formatMoney } from '../lib/formatMoney';

type Props = {
	id: number;
	name: string;
	brand: string;
	category: string;
	price_cents: number;
	currency: string;
	hero_image_url?: string | null;
};

export default function ProductCard({
	id,
	name,
	brand,
	category,
	price_cents,
	currency,
	hero_image_url,
}: Props) {
	return (
		<Link
			to={`/products/${id}`}
			className='group flex flex-col overflow-hidden rounded-2xl border border-slate-800 bg-lepax-charcoalSoft/80 shadow-card hover:-translate-y-1 hover:border-lepax-gold/60 hover:shadow-[0_24px_60px_rgba(0,0,0,0.6)] transition'
		>
			<div className='h-56 w-full overflow-hidden'>
				{hero_image_url ? (
					<img
						src={hero_image_url}
						alt={name}
						className='h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]'
					/>
				) : (
					<div className='h-full w-full bg-gradient-to-br from-lepax-silver/5 via-lepax-rose/10 to-lepax-charcoalSoft' />
				)}
			</div>

			<div className='flex flex-1 flex-col gap-2 px-4 py-3'>
				<p className='text-xs uppercase tracking-[0.24em] text-lepax-silver/60'>
					{brand}
				</p>
				<p className='text-sm font-medium group-hover:text-lepax-gold'>
					{name}
				</p>
				<p className='text-xs text-lepax-silver/70'>{category}</p>
				<div className='mt-auto flex items-center justify-between pt-3'>
					<p className='text-sm font-semibold text-lepax-gold'>
						{formatMoney(price_cents, currency)}
					</p>
					<span className='rounded-full border border-lepax-silver/40 px-3 py-1 text-[0.65rem] uppercase tracking-[0.18em] text-lepax-silver/70'>
						View
					</span>
				</div>
			</div>
		</Link>
	);
}

