import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';
import { formatMoney } from '../lib/formatMoney';

type Phase = 'review' | 'payment';
type PaymentMethod = 'card' | 'paypal';

export default function CartPage() {
	const { items, totalCents, removeItem, clear } = useCart();
	const { user } = useAuth();
	const navigate = useNavigate();

	const [error, setError] = useState('');
	const [loading, setLoading] = useState(false);

	// Checkout flow state
	const [phase, setPhase] = useState<Phase>('review');
	const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');

	// Fake 2FA state
	const [generatedCode, setGeneratedCode] = useState('');
	const [codeInput, setCodeInput] = useState('');
	const [codeSent, setCodeSent] = useState(false);

	// Use the currency of the first item, fallback just in case
	const currency = items[0]?.currency ?? 'EUR';

	function handleStartCheckout() {
		if (!user) {
			setError('You must sign in before checking out.');
			return;
		}
		if (!items.length) return;

		setError('');
		setPhase('payment');
	}

	function handleSendCode() {
		// Generate a 6 digit code as string, including leading zeros
		const code = String(Math.floor(Math.random() * 1_000_000)).padStart(6, '0');
		setGeneratedCode(code);
		setCodeSent(true);
		setCodeInput('');
		setError('');
	}

	async function handleConfirmPayment() {
		if (!codeSent) {
			setError('Please request the security code first.');
			return;
		}

		if (codeInput.trim() !== generatedCode) {
			setError('Incorrect security code. Please check and try again.');
			return;
		}

		if (!items.length) {
			setError('Your bag is empty.');
			return;
		}

		try {
			setLoading(true);
			setError('');

			const payload = {
				items: items.map((it) => ({
					product_id: it.product_id,
					qty: it.qty,
				})),
				// purely for audit / coursework flavour
				payment_method: paymentMethod,
				two_factor_used: true,
			};

			const res = await api.post('/api/checkout', payload);

			if (res.data?.ok) {
				clear();
				// Optional: if backend returns order_id you could pass it via state
				// navigate('/orders', { state: { highlightOrderId: res.data.order_id } });
				navigate('/orders');
			} else {
				setError(res.data?.error || 'Checkout failed.');
			}
		} catch (err: any) {
			setError(err.response?.data?.error || 'Checkout failed.');
		} finally {
			setLoading(false);
		}
	}

	function handleBackToBag() {
		setPhase('review');
		setError('');
		setCodeSent(false);
		setGeneratedCode('');
		setCodeInput('');
	}

	if (!items.length) {
		return (
			<div className='space-y-3'>
				<h1 className='text-2xl font-semibold'>Your bag is empty</h1>
				<p className='text-sm text-lepax-silver/70'>
					Browse the catalogue and add items to your bag before checking out.
				</p>
			</div>
		);
	}

	return (
		<div className='space-y-6'>
			<header>
				<p className='text-xs tracking-[0.3em] text-lepax-silver/60 uppercase'>
					Cart
				</p>
				<h1 className='text-3xl font-semibold tracking-tight'>Your bag</h1>
			</header>

			<div className='grid gap-8 lg:grid-cols-[3fr,2fr]'>
				<ul className='space-y-3'>
					{items.map((it) => (
						<li
							key={it.product_id}
							className='flex items-center justify-between rounded-2xl border border-slate-800 bg-lepax-charcoalSoft/80 px-4 py-3 text-sm'
						>
							<div>
								<p className='font-medium'>{it.name}</p>
								<p className='text-xs text-lepax-silver/70'>
									Qty {it.qty} • {formatMoney(it.price_cents, it.currency)} each
								</p>
							</div>
							<button
								onClick={() => removeItem(it.product_id)}
								className='text-xs text-lepax-silver/60 hover:text-red-400'
							>
								Remove
							</button>
						</li>
					))}
				</ul>

				<aside className='space-y-4 rounded-2xl border border-slate-800 bg-lepax-charcoalSoft/80 p-5'>
					<p className='text-sm text-lepax-silver/70'>
						This checkout simulates a real payment flow for coursework purposes.
						Payment providers such as Stripe or PayPal are not connected, but
						the steps (payment method, 2FA, order creation) are modelled
						realistically.
					</p>

					<p className='text-lg font-semibold text-lepax-gold'>
						Total: {formatMoney(totalCents, currency)}
					</p>

					{/* Phase switch */}
					{phase === 'review' && (
						<div className='space-y-3'>
							<button
								onClick={handleStartCheckout}
								className='w-full rounded-full bg-lepax-gold px-5 py-2 text-sm font-medium text-lepax-charcoal hover:bg-lepax-rose transition'
							>
								Checkout securely
							</button>
							<p className='text-[0.7rem] text-lepax-silver/60'>
								Next step: choose a payment method and confirm with a one time
								security code.
							</p>
						</div>
					)}

					{phase === 'payment' && (
						<div className='space-y-4'>
							<div className='flex items-centre justify-between'>
								<h2 className='text-sm font-semibold text-slate-100'>
									Payment details
								</h2>
								<button
									type='button'
									onClick={handleBackToBag}
									className='text-[0.7rem] text-lepax-silver/70 hover:text-lepax-gold'
								>
									Back to bag
								</button>
							</div>

							{/* Fake payment method selector */}
							<div className='space-y-2'>
								<p className='text-xs font-medium text-lepax-silver/80'>
									Payment method (simulated)
								</p>
								<div className='space-y-1 text-xs text-lepax-silver/80'>
									<label className='flex items-center gap-2'>
										<input
											type='radio'
											name='payment-method'
											value='card'
											checked={paymentMethod === 'card'}
											onChange={() => setPaymentMethod('card')}
											className='h-3 w-3'
										/>
										<span>Debit or credit card (Visa, Mastercard)</span>
									</label>
									<label className='flex items-center gap-2'>
										<input
											type='radio'
											name='payment-method'
											value='paypal'
											checked={paymentMethod === 'paypal'}
											onChange={() => setPaymentMethod('paypal')}
											className='h-3 w-3'
										/>
										<span>PayPal (simulated)</span>
									</label>
								</div>
							</div>

							{/* 2FA step */}
							<div className='space-y-2'>
								<p className='text-xs font-medium text-lepax-silver/80'>
									Security check (2FA)
								</p>
								<p className='text-[0.75rem] text-lepax-silver/70'>
									For this prototype, a six digit one time code is generated
									inside the system instead of sending an actual SMS or email.
								</p>

								<div className='flex gap-2'>
									<button
										type='button'
										onClick={handleSendCode}
										className='rounded-full border border-lepax-gold px-3 py-1.5 text-xs font-medium text-lepax-gold hover:bg-lepax-gold hover:text-lepax-charcoal transition'
									>
										Generate security code
									</button>
								</div>

								{codeSent && (
									<div className='space-y-2'>
										<p className='text-[0.75rem] text-lepax-silver/70'>
											Code generated. In a real system this would be delivered
											via SMS or email. For marking, the current code is shown
											below.
										</p>
										<div className='rounded-lg border border-slate-700 bg-lepax-charcoal px-3 py-2 text-center text-sm font-mono tracking-[0.4em]'>
											{generatedCode}
										</div>
									</div>
								)}

								<div className='space-y-1 pt-2'>
									<label className='block text-xs font-medium text-lepax-silver/80'>
										Enter security code
									</label>
									<input
										type='text'
										value={codeInput}
										onChange={(e) => setCodeInput(e.target.value)}
										maxLength={6}
										className='w-32 rounded border border-slate-700 bg-lepax-charcoal px-3 py-2 text-sm text-lepax-silver tracking-[0.4em] focus:border-lepax-gold focus:outline-none'
										placeholder='••••••'
									/>
								</div>
							</div>

							<button
								onClick={handleConfirmPayment}
								disabled={loading}
								className='w-full rounded-full bg-lepax-gold px-5 py-2 text-sm font-medium text-lepax-charcoal hover:bg-lepax-rose disabled:opacity-60 transition'
							>
								{loading ? 'Processing…' : 'Confirm and place order'}
							</button>
						</div>
					)}

					{error && <p className='text-sm text-red-400'>{error}</p>}

					<p className='text-[0.7rem] text-lepax-silver/60 pt-1'>
						For customer support in this prototype, customers are instructed to
						contact the retailer directly. Service workflows are documented in
						the coursework report rather than implemented here.
					</p>
				</aside>
			</div>
		</div>
	);
}
