import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';

type Mode = 'login' | 'register';

export default function Login() {
	const [mode, setMode] = useState<Mode>('login');
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const { setUser } = useAuth();
	const navigate = useNavigate();

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setError(null);
		setLoading(true);

		try {
			if (mode === 'register') {
				// 1. Create account
				await api.post('/api/auth/register', { email, password });
				// 2. Immediately sign in
			}

			const res = await api.post('/api/auth/login', { email, password });

			if (!res.data?.ok || !res.data.user) {
				throw new Error('Invalid server response');
			}

			setUser(res.data.user);
			// Go home or to profile
			navigate('/');
		} catch (err: any) {
			setError(
				err.response?.data?.error ||
					err.message ||
					(mode === 'login' ? 'Failed to sign in' : 'Failed to create account')
			);
		} finally {
			setLoading(false);
		}
	}

	return (
		<div className='grid min-h-[60vh] items-centre gap-10 lg:grid-cols-[3fr,2fr]'>
			{/* Left: form */}
			<section className='space-y-6'>
				<p className='text-xs tracking-[0.3em] text-lepax-silver/60 uppercase'>
					{mode === 'login' ? 'Sign in' : 'Create account'}
				</p>
				<h1 className='text-3xl font-semibold tracking-tight'>
					{mode === 'login'
						? 'Welcome back to LePax.'
						: 'Create your secure LePax account.'}
				</h1>
				<p className='text-sm text-lepax-silver/70 max-w-md'>
					Accounts are required to purchase items and leave reviews. Passwords
					are stored with strong hashing on the server.
				</p>

				<div className='inline-flex rounded-full border border-slate-700 bg-lepax-charcoalSoft p-1 text-xs'>
					<button
						type='button'
						className={`rounded-full px-4 py-1 ${
							mode === 'login'
								? 'bg-lepax-gold text-lepax-charcoal'
								: 'text-lepax-silver'
						}`}
						onClick={() => setMode('login')}
					>
						Sign in
					</button>
					<button
						type='button'
						className={`rounded-full px-4 py-1 ${
							mode === 'register'
								? 'bg-lepax-gold text-lepax-charcoal'
								: 'text-lepax-silver'
						}`}
						onClick={() => setMode('register')}
					>
						Create account
					</button>
				</div>

				<form onSubmit={handleSubmit} className='space-y-4 max-w-md'>
					<div className='space-y-1'>
						<label className='text-xs text-lepax-silver/70'>Email</label>
						<input
							type='email'
							required
							className='w-full rounded-full border border-slate-700 bg-lepax-charcoalSoft px-4 py-2 text-sm outline-none focus:border-lepax-gold'
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							autoComplete='email'
						/>
					</div>

					<div className='space-y-1'>
						<label className='text-xs text-lepax-silver/70'>Password</label>
						<input
							type='password'
							required
							minLength={6}
							className='w-full rounded-full border border-slate-700 bg-lepax-charcoalSoft px-4 py-2 text-sm outline-none focus:border-lepax-gold'
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							autoComplete={
								mode === 'login' ? 'current-password' : 'new-password'
							}
						/>
					</div>

					<button
						type='submit'
						disabled={loading}
						className='mt-2 w-full rounded-full bg-lepax-gold px-4 py-2 text-sm font-medium text-lepax-charcoal hover:bg-lepax-rose disabled:opacity-60 transition'
					>
						{loading
							? mode === 'login'
								? 'Signing in…'
								: 'Creating account…'
							: mode === 'login'
							? 'Sign in securely'
							: 'Create account'}
					</button>

					{error && <p className='text-sm text-red-400 mt-2'>{error}</p>}

					{mode === 'register' && (
						<p className='text-[0.7rem] text-lepax-silver/60 mt-2'>
							By creating an account you agree that basic usage data may be
							logged for security and analytics in line with the coursework
							brief.
						</p>
					)}
				</form>
			</section>

			{/* Right: visual panel */}
			<section className='hidden lg:flex items-centre justify-centre'>
				<div className='relative h-80 w-64 rounded-3xl bg-gradient-to-b from-lepax-silver/10 via-lepax-rose/20 to-lepax-charcoalSoft shadow-card'>
					<div className='absolute inset-6 rounded-3xl border border-lepax-gold/40 bg-lepax-charcoalSoft/80 p-4 flex flex-col justify-between'>
						<div className='space-y-2'>
							<p className='text-xs tracking-[0.25em] text-lepax-silver/70 uppercase'>
								SECURE ACCESS
							</p>
							<p className='text-sm text-lepax-silver/70'>
								Accounts are required before you can purchase products or leave
								reviews.
							</p>
						</div>
						<div className='space-y-1 text-[0.7rem] text-lepax-silver/70'>
							<p>• Passwords hashed server side</p>
							<p>• Session cookies with HttpOnly and Secure flags</p>
							<p>• Role based access for admin and sellers</p>
						</div>
					</div>
				</div>
			</section>
		</div>
	);
}
