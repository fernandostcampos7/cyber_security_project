import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

export default function Layout() {
	return (
		<div className='min-h-screen flex flex-col bg-lepax-charcoal text-slate-50 font-display'>
			{/* Top navigation */}
			<Navbar />

			{/* Main content grows to fill remaining height */}
			<main className='flex-1'>
				<div className='mx-auto max-w-6xl px-4 py-8'>
					<Outlet />
				</div>
			</main>

			{/* Footer pinned to bottom on short pages */}
			<footer className='border-t border-slate-800 py-6 text-xs text-lepax-silver/60'>
				<div className='mx-auto flex max-w-6xl items-center justify-between px-4'>
					<span>
						© {new Date().getFullYear()} LePax. Prototype for coursework.
					</span>
					<span className='hidden gap-3 sm:flex'>
						<span>GDPR-aware logging</span>
						<span className='h-1 w-1 rounded-full bg-lepax-silver/40' />
						<span>Secure payments (stubbed)</span>
					</span>
				</div>
			</footer>
		</div>
	);
}
