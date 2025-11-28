import { useState } from 'react';
import { api } from '../lib/api';
import { useNavigate } from 'react-router-dom';

export default function ForgotPassword() {
	const [email, setEmail] = useState('');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [done, setDone] = useState(false);
	const navigate = useNavigate();

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setError(null);
		setLoading(true);

		try {
			await api.post('/api/auth/forgot-password', { email });
			setDone(true);
		} catch (err: any) {
			// Still show generic success to avoid email enumeration,
			// but log locally for debugging.
			console.error(err);
			setDone(true);
		} finally {
			setLoading(false);
		}
	}

	return (
		<div className='min-h-[60vh] flex items-centre justify-centre'>
			<div className='w-full max-w-md space-y-6'>
				<h1 className='text-2xl font-semibold tracking-tight'>
					Reset your password
				</h1>
				<p className='text-sm text-lepax-silver/70'>
					Enter the email associated with your account and, if it exists, we
					will send you a link to choose a new password.
				</p>

				<form onSubmit={handleSubmit} className='space-y-4'>
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

					<button
						type='submit'
						disabled={loading}
						className='w-full rounded-full bg-lepax-gold px-4 py-2 text-sm font-medium text-lepax-charcoal hover:bg-lepax-rose disabled:opacity-60 transition'
					>
						{loading ? 'Sending instructions…' : 'Send reset link'}
					</button>

					{error && <p className='text-sm text-red-400 mt-2'>{error}</p>}

					{done && (
						<p className='text-xs text-lepax-silver/70 mt-2'>
							If an account exists with that email, password reset instructions
							have been sent.
						</p>
					)}
				</form>

				<button
					type='button'
					onClick={() => navigate('/login')}
					className='text-xs text-lepax-silver/70 hover:text-lepax-gold underline-offset-2 hover:underline'
				>
					Back to sign in
				</button>
			</div>
		</div>
	);
}
