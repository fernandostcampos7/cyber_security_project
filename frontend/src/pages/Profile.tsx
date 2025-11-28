import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';

export default function Profile() {
	const { user, setUser } = useAuth();
	const [loading, setLoading] = useState(false);
	const [feedback, setFeedback] = useState<string | null>(null);
	const navigate = useNavigate();

	if (!user) {
		return (
			<p className='text-sm text-lepax-silver/70'>
				You must be signed in to view your profile.
			</p>
		);
	}

	async function handleRequestSeller() {
		const ok = window.confirm(
			'Request seller access? An admin will review your account before granting seller permissions.'
		);
		if (!ok) return;

		try {
			setLoading(true);
			setFeedback(null);
			const res = await api.post('/api/account/upgrade-seller');
			setFeedback(
				res.data.message || 'Your seller request has been sent to the admin.'
			);
		} catch (err: any) {
			setFeedback(
				err.response?.data?.message ||
					'Could not send seller request. Please try again later.'
			);
		} finally {
			setLoading(false);
		}
	}

	async function handleDeleteAccount() {
		const ok = window.confirm(
			'This will delete your account and anonymise your data. This action cannot be undone. Do you want to continue?'
		);
		if (!ok) return;

		try {
			setLoading(true);
			setFeedback(null);

			const res = await api.delete('/api/account/me');

			setFeedback(
				res.data?.message ||
					'Your account has been deleted and personal data anonymised.'
			);

			// Clear auth state and send user away
			setUser(null);
			navigate('/');
		} catch (err: any) {
			setFeedback(
				err.response?.data?.error ||
					err.response?.data?.message ||
					'Could not delete your account. Please try again later.'
			);
		} finally {
			setLoading(false);
		}
	}

	return (
		<div className='space-y-6'>
			<header className='space-y-2'>
				<p className='text-xs tracking-[0.3em] text-lepax-silver/60 uppercase'>
					Account
				</p>
				<h1 className='text-3xl font-semibold tracking-tight'>Your profile</h1>
				<p className='text-sm text-lepax-silver/70'>
					Email and role information are stored on the backend. Role based
					access control is enforced server side.
				</p>
			</header>

			<section className='space-y-2 rounded-2xl border border-slate-800 bg-lepax-charcoalSoft/80 p-5'>
				<p className='text-sm'>
					<span className='text-lepax-silver/60'>User ID:</span>{' '}
					<span className='font-mono text-lepax-silver'>{user.id}</span>
				</p>

				<p className='text-sm'>
					<span className='text-lepax-silver/60'>Email:</span>{' '}
					<span className='text-lepax-silver'>{user.email}</span>
				</p>

				<p className='text-sm'>
					<span className='text-lepax-silver/60'>Role:</span>{' '}
					<span className='uppercase tracking-[0.18em] text-lepax-gold'>
						{user.role}
					</span>
				</p>

				{user.role === 'customer' && (
					<div className='mt-4 space-y-2'>
						<button
							onClick={handleRequestSeller}
							disabled={loading}
							className='rounded-full border border-lepax-gold/70 px-4 py-2 text-sm font-medium text-lepax-gold hover:bg-lepax-gold hover:text-lepax-charcoal transition disabled:opacity-60'
						>
							{loading ? 'Sending request…' : 'Request seller access'}
						</button>
						<p className='text-xs text-lepax-silver/70'>
							Your request will be reviewed by an admin. You will be upgraded to
							seller only after approval.
						</p>
					</div>
				)}

				{user.role === 'seller' && (
					<p className='mt-4 text-sm text-lepax-silver/80'>
						You are a seller. You can manage products in the Seller dashboard.
					</p>
				)}

				{user.role === 'admin' && (
					<p className='mt-4 text-sm text-lepax-silver/80'>
						You are an admin and already have seller-level permissions.
					</p>
				)}

				{feedback && (
					<p className='mt-3 text-xs text-lepax-silver/80'>{feedback}</p>
				)}
			</section>

			{user.role === 'seller' && (
				<section className='space-y-2 rounded-2xl border border-slate-800 bg-lepax-charcoalSoft/80 p-5'>
					<h2 className='text-lg font-semibold'>Seller tools</h2>
					<p className='mt-4 text-sm text-lepax-silver/80'>
						You are a seller. Use the Seller dashboard to create, edit and
						delete products that appear in the LePax catalogue.
					</p>
				</section>
			)}

			{/* Danger zone */}
			<section className='space-y-2 rounded-2xl border border-red-900 bg-lepax-charcoalSoft/80 p-5'>
				<h2 className='text-lg font-semibold text-red-400'>Danger zone</h2>
				<p className='text-xs text-lepax-silver/70'>
					Deleting your account will anonymise your personal data and log you
					out. Orders and reviews may remain for integrity but will no longer be
					tied to your identity.
				</p>
				<button
					onClick={handleDeleteAccount}
					disabled={loading}
					className='mt-2 rounded-full border border-red-500 px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-500 hover:text-lepax-charcoal transition disabled:opacity-60'
				>
					{loading ? 'Processing…' : 'Delete my account'}
				</button>
			</section>
		</div>
	);
}
