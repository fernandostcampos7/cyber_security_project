import { Link } from 'react-router-dom';

export default function NotFound() {
	return (
		<div className='flex flex-col items-center justify-center gap-4 py-16 text-centre'>
			<p className='text-xs tracking-[0.3em] text-lepax-silver/60 uppercase'>
				404
			</p>
			<h1 className='text-2xl font-semibold'>Page not found</h1>
			<p className='max-w-md text-sm text-lepax-silver/70'>
				The page you asked for does not exist in this prototype. Try the
				catalogue or home page instead.
			</p>
			<div className='flex gap-3'>
				<Link
					to='/'
					className='rounded-full bg-lepax-gold px-5 py-2 text-xs font-medium text-lepax-charcoal hover:bg-lepax-rose transition'
				>
					Home
				</Link>
				<Link
					to='/catalogue'
					className='rounded-full border border-lepax-silver/50 px-5 py-2 text-xs text-lepax-silver hover:border-lepax-gold hover:text-lepax-gold transition'
				>
					Catalogue
				</Link>
			</div>
		</div>
	);
}
