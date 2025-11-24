// frontend/src/lib/formatMoney.ts
export function formatMoney(cents: number, currency: string = 'EUR'): string {
	const value = cents / 100;

	return value.toLocaleString('en-GB', {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
		style: 'currency',
		currency,
	});
}
