import React, { useState } from 'react';
import { CardElement, useElements, useStripe } from '@stripe/react-stripe-js';

type StripeCardFormProps = {
	clientSecret: string;
	onSuccess: (paymentIntentId: string) => Promise<void>;
};

export function StripeCardForm({
	clientSecret,
	onSuccess,
}: StripeCardFormProps) {
	const stripe = useStripe();
	const elements = useElements();

	const [submitting, setSubmitting] = useState(false);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	async function handleSubmit(event: React.FormEvent) {
		event.preventDefault();

		if (!stripe || !elements) {
			setErrorMessage('Stripe is not ready yet, please try again.');
			return;
		}

		const cardElement = elements.getElement(CardElement);
		if (!cardElement) {
			setErrorMessage('Card input is not available.');
			return;
		}

		setSubmitting(true);
		setErrorMessage(null);

		try {
			const result = await stripe.confirmCardPayment(clientSecret, {
				payment_method: {
					card: cardElement,
				},
			});

			if (result.error) {
				setErrorMessage(result.error.message || 'Payment failed.');
				return;
			}

			if (!result.paymentIntent) {
				setErrorMessage('No payment intent returned from Stripe.');
				return;
			}

			if (result.paymentIntent.status === 'succeeded') {
				await onSuccess(result.paymentIntent.id);
			} else {
				setErrorMessage(`Unexpected status: ${result.paymentIntent.status}`);
			}
		} catch (err) {
			console.error(err);
			setErrorMessage('Unexpected error during Stripe payment.');
		} finally {
			setSubmitting(false);
		}
	}

	return (
		<form onSubmit={handleSubmit} className='space-y-3'>
			<div className='rounded-lg border border-slate-700 bg-lepax-charcoal px-3 py-2'>
				<CardElement
					options={{
						hidePostalCode: true,
					}}
				/>
			</div>

			{errorMessage && <p className='text-xs text-red-400'>{errorMessage}</p>}

			<button
				type='submit'
				disabled={submitting || !stripe || !elements}
				className='w-full rounded-full bg-lepax-gold px-5 py-2 text-sm font-medium text-lepax-charcoal hover:bg-lepax-rose disabled:opacity-60 transition'
			>
				{submitting ? 'Processing…' : 'Pay with card'}
			</button>

			<p className='text-[0.7rem] text-lepax-silver/60'>
				Use Stripe test cards for this prototype, for example 4242 4242 4242
				4242 with any future expiry and CVC.
			</p>
		</form>
	);
}
