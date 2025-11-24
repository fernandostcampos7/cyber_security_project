import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import LogoutButton from '../components/LogoutButton';

const navLinkClass =
	'px-3 py-1 text-sm font-medium border-b-2 border-transparent hover:border-lepax-gold transition';

export default function Navbar() {
	const { user } = useAuth();
	const { items } = useCart();
	const cartCount = items.reduce((sum, it) => sum + it.qty, 0);

	return (
		<header className='sticky top-0 z-30 border-b border-slate-800 bg-lepax-charcoal/90 backdrop-blur'>
			<div className='mx-auto flex h-14 max-w-6xl items-center justify-between px-4'>
				<Link to='/' className='flex items-baseline gap-2'>
					<span className='text-lg font-semibold tracking-[0.18em] text-lepax-gold'>
						LePax
					</span>
					<span className='text-[0.7rem] uppercase tracking-[0.25em] text-lepax-silver/60'>
						Secure Shop
					</span>
				</Link>

				<nav className='flex items-center gap-4 text-slate-100'>
					<NavLink
						to='/catalogue'
						className={({ isActive }) =>
							`${navLinkClass} ${
								isActive ? 'border-lepax-gold text-lepax-gold' : ''
							}`
						}
					>
						Catalogue
					</NavLink>

					<NavLink
						to='/search'
						className={({ isActive }) =>
							`${navLinkClass} ${
								isActive ? 'border-lepax-gold text-lepax-gold' : ''
							}`
						}
					>
						Search
					</NavLink>

					{/* Orders only for customers */}
					{user?.role === 'customer' && (
						<NavLink
							to='/orders'
							className={({ isActive }) =>
								`${navLinkClass} ${
									isActive ? 'border-lepax-gold text-lepax-gold' : ''
								}`
							}
						>
							Orders
						</NavLink>
					)}

					{user && (
						<NavLink
							to='/profile'
							className={({ isActive }) =>
								`${navLinkClass} ${
									isActive ? 'border-lepax-gold text-lepax-gold' : ''
								}`
							}
						>
							Profile
						</NavLink>
					)}

					{user && (user.role === 'seller' || user.role === 'admin') && (
						<NavLink
							to='/seller'
							className='text-xs text-lepax-silver/70 hover:text-lepax-gold'
						>
							Seller
						</NavLink>
					)}

					{user?.role === 'admin' && (
						<NavLink
							to='/admin'
							className={({ isActive }) =>
								`${navLinkClass} ${
									isActive ? 'border-lepax-gold text-lepax-gold' : ''
								}`
							}
						>
							Admin
						</NavLink>
					)}

					{user?.role === 'admin' && (
						<NavLink
							to='/admin/analytics'
							className='text-xs text-lepax-silver/70 hover:text-lepax-gold'
						>
							Analytics
						</NavLink>
					)}
				</nav>

				<div className='flex items-center gap-3'>
					{user?.role === 'customer' && (
						<Link
							to='/cart'
							className='relative rounded-full border border-lepax-silver/40 px-3 py-1 text-xs text-lepax-silver hover:border-lepax-gold hover:text-lepax-gold transition'
						>
							Cart
							{cartCount > 0 && (
								<span className='ml-2 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-lepax-gold px-1 text-[0.65rem] font-semibold text-lepax-charcoal'>
									{cartCount}
								</span>
							)}
						</Link>
					)}

					{user ? (
						<>
							<span className='hidden text-xs text-lepax-silver/70 sm:inline'>
								Signed in as{' '}
								<span className='text-lepax-gold'>{user.role}</span>
							</span>

							<LogoutButton />
						</>
					) : (
						<Link
							to='/login'
							className='rounded-full bg-lepax-gold px-3 py-1 text-xs font-medium text-lepax-charcoal hover:bg-lepax-rose transition'
						>
							Sign in / Sign up
						</Link>
					)}
				</div>
			</div>
		</header>
	);
}
