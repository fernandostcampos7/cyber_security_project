import { useEffect, useMemo, useState, FormEvent, useRef } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';

type SellerProduct = {
	id: number;
	sku: string;
	name: string;
	brand: string;
	category: string;
	description_md: string;
	price_cents: number;
	currency: string;
	active: boolean;
	hero_image_url?: string | null;
	created_at: string | null;
};

type SellerProductsResponse = {
	ok: boolean;
	items: SellerProduct[];
};

const emptyForm: Omit<SellerProduct, 'id' | 'sku' | 'created_at'> = {
	name: '',
	brand: '',
	category: '',
	description_md: '',
	price_cents: 0,
	currency: '£',
	active: true,
	hero_image_url: '',
};

function formatPrice(cents: number, currency: string) {
	return `${(cents / 100).toLocaleString('en-GB', {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	})} ${currency}`;
}

export default function SellerProductsPage() {
	const { user } = useAuth();
	const isAdmin = user?.role === 'admin';

	const [items, setItems] = useState<SellerProduct[]>([]);
	const [loading, setLoading] = useState(true);
	const [loadError, setLoadError] = useState('');
	const [saving, setSaving] = useState(false);
	const [saveError, setSaveError] = useState('');
	const [deleteError, setDeleteError] = useState('');

	const [editingId, setEditingId] = useState<number | null>(null);
	const [form, setForm] = useState<typeof emptyForm>(emptyForm);

	// New: human friendly price input
	const [priceInput, setPriceInput] = useState('');

	// New: ref so we can scroll to the form when creating or editing
	const formRef = useRef<HTMLDivElement | null>(null);

	if (!user || (user.role !== 'seller' && user.role !== 'admin')) {
		return (
			<main className='mx-auto max-w-5xl px-4 py-10 text-slate-100'>
				<h1 className='text-2xl font-semibold mb-2'>Seller tools</h1>
				<p className='text-sm text-lepax-silver/75'>
					You need a seller or admin account to manage catalogue products.
					Please contact an administrator if you need access.
				</p>
			</main>
		);
	}

	async function loadProducts() {
		try {
			setLoading(true);
			setLoadError('');
			const res = await api.get<SellerProductsResponse>('/api/seller/products');
			setItems(res.data.items || []);
		} catch (err: any) {
			setLoadError(
				err.response?.data?.error || 'Failed to load your products.'
			);
		} finally {
			setLoading(false);
		}
	}

	useEffect(() => {
		loadProducts();
	}, []);

	function scrollToForm() {
		if (formRef.current) {
			formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
		}
	}

	function startCreate() {
		setEditingId(null);
		setForm(emptyForm);
		setPriceInput('');
		setSaveError('');
		scrollToForm();
	}

	function startEdit(p: SellerProduct) {
		setEditingId(p.id);
		setForm({
			name: p.name,
			brand: p.brand,
			category: p.category,
			description_md: p.description_md,
			price_cents: p.price_cents,
			currency: p.currency,
			active: p.active,
			hero_image_url: p.hero_image_url || '',
		});
		// show human friendly price
		setPriceInput((p.price_cents / 100).toFixed(2));
		setSaveError('');
		scrollToForm();
	}

	async function handleSubmit(e: FormEvent) {
		e.preventDefault();
		setSaving(true);
		setSaveError('');

		try {
			const numeric = priceInput.replace(/,/g, '').trim();
			const priceFloat = parseFloat(numeric);

			if (Number.isNaN(priceFloat) || priceFloat < 0) {
				setSaveError('Please enter a valid price, for example 980.00');
				return;
			}

			const price_cents = Math.round(priceFloat * 100);

			const payload = {
				...form,
				price_cents,
			};

			if (editingId === null) {
				// create
				const res = await api.post('/api/seller/products', payload);
				if (res.data?.ok && res.data.item) {
					setItems((prev) => [res.data.item as SellerProduct, ...prev]);
					setForm(emptyForm);
					setPriceInput('');
				} else {
					setSaveError(res.data?.error || 'Failed to create product.');
				}
			} else {
				// update
				const res = await api.patch(
					`/api/seller/products/${editingId}`,
					payload
				);
				if (res.data?.ok && res.data.item) {
					setItems((prev) =>
						prev.map((it) =>
							it.id === editingId ? (res.data.item as SellerProduct) : it
						)
					);
				} else {
					setSaveError(res.data?.error || 'Failed to update product.');
				}
			}
		} catch (err: any) {
			setSaveError(err.response?.data?.error || 'Save failed.');
		} finally {
			setSaving(false);
		}
	}

	async function handleDelete(id: number) {
		if (
			!window.confirm(
				'Delete this product? It will be removed from the catalogue as well.'
			)
		) {
			return;
		}
		setDeleteError('');
		try {
			const res = await api.delete(`/api/seller/products/${id}`);
			if (res.data?.ok) {
				setItems((prev) => prev.filter((p) => p.id !== id));
			} else {
				setDeleteError(res.data?.error || 'Failed to delete product.');
			}
		} catch (err: any) {
			setDeleteError(err.response?.data?.error || 'Failed to delete product.');
		}
	}

	// Brand/category suggestion lists
	const brandOptions = useMemo(
		() => Array.from(new Set(items.map((p) => p.brand))).filter(Boolean),
		[items]
	);

	const categoryOptions = useMemo(
		() => Array.from(new Set(items.map((p) => p.category))).filter(Boolean),
		[items]
	);

	return (
		<main className='mx-auto max-w-6xl px-4 py-10 text-slate-100'>
			<header className='mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between'>
				<div>
					<p className='text-xs tracking-[0.28em] text-lepax-silver/60 uppercase'>
						{isAdmin ? 'Admin' : 'Seller'}
					</p>

					<h1 className='text-2xl sm:text-3xl font-semibold tracking-tight'>
						{isAdmin ? 'Product catalogue' : 'My products'}
					</h1>

					<p className='mt-1 text-xs text-lepax-silver/70 max-w-xl'>
						{isAdmin
							? 'View and manage all products in the LePax catalogue. Admins have access to every seller’s items.'
							: 'Products created here appear in the main LePax catalogue. You can reuse existing brands and categories from the suggestion lists or type new ones.'}
					</p>
				</div>

				<button
					type='button'
					onClick={startCreate}
					className='mt-2 inline-flex items-center justify-center rounded-full border border-lepax-gold px-4 py-1.5 text-xs font-medium text-lepax-gold hover:bg-lepax-gold hover:text-lepax-charcoal transition'
				>
					New product
				</button>
			</header>

			<div className='grid gap-8 lg:grid-cols-[3fr,2fr]'>
				{/* Product list */}
				<section className='space-y-3'>
					<h2 className='text-sm font-semibold text-slate-100'>
						Catalogue entries
					</h2>

					{loading && (
						<p className='text-xs text-lepax-silver/70'>
							Loading your products…
						</p>
					)}
					{loadError && <p className='text-xs text-red-400'>{loadError}</p>}

					{!loading && !items.length && !loadError && (
						<p className='text-xs text-lepax-silver/70'>
							You have not created any products yet. Use the form on the right
							to add one.
						</p>
					)}

					{!!items.length && (
						<ul className='space-y-2'>
							{items.map((p) => (
								<li
									key={p.id}
									className='flex items-start justify-between gap-3 rounded-2xl border border-slate-800 bg-lepax-charcoalSoft/80 px-4 py-3 text-xs sm:text-sm'
								>
									<div className='space-y-1'>
										<div className='flex items-center gap-2'>
											<span className='font-medium'>{p.name}</span>
											{!p.active && (
												<span className='rounded-full border border-slate-600 px-2 py-[1px] text-[0.65rem] uppercase tracking-wide text-slate-300'>
													Inactive
												</span>
											)}
										</div>
										<p className='text-lepax-silver/70'>
											{p.brand} · {p.category}
										</p>
										<p className='text-lepax-silver/70'>
											{formatPrice(p.price_cents, p.currency)}
										</p>
										{p.created_at && (
											<p className='text-[0.65rem] text-lepax-silver/60'>
												Created {new Date(p.created_at).toLocaleString('en-GB')}
											</p>
										)}
									</div>
									<div className='flex flex-col gap-2'>
										<button
											type='button'
											onClick={() => startEdit(p)}
											className='rounded-full border border-lepax-silver/50 px-3 py-1 text-[0.7rem] text-lepax-silver hover:border-lepax-gold hover:text-lepax-gold transition'
										>
											Edit
										</button>
										<button
											type='button'
											onClick={() => handleDelete(p.id)}
											className='rounded-full border border-red-500/60 px-3 py-1 text-[0.7rem] text-red-400 hover:bg-red-500/10 transition'
										>
											Delete
										</button>
									</div>
								</li>
							))}
						</ul>
					)}

					{deleteError && (
						<p className='text-xs text-red-400 pt-1'>{deleteError}</p>
					)}
				</section>

				{/* Form */}
				<section
					ref={formRef}
					className='rounded-2xl border border-slate-800 bg-lepax-charcoalSoft/80 p-4 sm:p-5 space-y-4'
				>
					<h2 className='text-sm font-semibold text-slate-100'>
						{editingId === null ? 'Create product' : 'Edit product'}
					</h2>

					<form onSubmit={handleSubmit} className='space-y-3'>
						<div className='space-y-1'>
							<label className='block text-xs font-medium text-lepax-silver/80'>
								Name
							</label>
							<input
								type='text'
								value={form.name}
								onChange={(e) =>
									setForm((f) => ({
										...f,
										name: e.target.value,
									}))
								}
								className='w-full rounded border border-slate-700 bg-lepax-charcoal px-3 py-2 text-sm text-lepax-silver focus:border-lepax-gold focus:outline-none'
								required
							/>
						</div>

						<div className='space-y-1'>
							<label className='block text-xs font-medium text-lepax-silver/80'>
								Brand
							</label>
							<input
								type='text'
								list='seller-brand-options'
								value={form.brand}
								onChange={(e) =>
									setForm((f) => ({
										...f,
										brand: e.target.value,
									}))
								}
								className='w-full rounded border border-slate-700 bg-lepax-charcoal px-3 py-2 text-sm text-lepax-silver focus:border-lepax-gold focus:outline-none'
								required
							/>
							<datalist id='seller-brand-options'>
								{brandOptions.map((b) => (
									<option key={b} value={b} />
								))}
							</datalist>
						</div>

						<div className='space-y-1'>
							<label className='block text-xs font-medium text-lepax-silver/80'>
								Category
							</label>
							<input
								type='text'
								list='seller-category-options'
								value={form.category}
								onChange={(e) =>
									setForm((f) => ({
										...f,
										category: e.target.value,
									}))
								}
								className='w-full rounded border border-slate-700 bg-lepax-charcoal px-3 py-2 text-sm text-lepax-silver focus:border-lepax-gold focus:outline-none'
								required
							/>
							<datalist id='seller-category-options'>
								{categoryOptions.map((c) => (
									<option key={c} value={c} />
								))}
							</datalist>
						</div>

						{/* New price input */}
						<div className='space-y-1'>
							<label className='block text-xs font-medium text-lepax-silver/80'>
								Price
							</label>
							<input
								type='text'
								value={priceInput}
								onChange={(e) => setPriceInput(e.target.value)}
								placeholder='For example 980.00 or 9,800.50'
								className='w-40 rounded border border-slate-700 bg-lepax-charcoal px-3 py-2 text-sm text-lepax-silver focus:border-lepax-gold focus:outline-none'
								required
							/>
							<p className='text-[0.7rem] text-lepax-silver/60'>
								Treat the value as major units. Two decimals for cents, commas
								for thousands are allowed.
							</p>
						</div>

						<div className='space-y-1'>
							<label className='block text-xs font-medium text-lepax-silver/80'>
								Currency
							</label>
							<input
								type='text'
								value={form.currency}
								onChange={(e) =>
									setForm((f) => ({
										...f,
										currency: e.target.value.toUpperCase(),
									}))
								}
								className='w-24 rounded border border-slate-700 bg-lepax-charcoal px-3 py-2 text-sm text-lepax-silver focus:border-lepax-gold focus:outline-none'
								required
							/>
						</div>

						<div className='space-y-1'>
							<label className='block text-xs font-medium text-lepax-silver/80'>
								Hero image URL (optional)
							</label>
							<input
								type='url'
								value={form.hero_image_url ?? ''}
								onChange={(e) =>
									setForm((f) => ({
										...f,
										hero_image_url: e.target.value,
									}))
								}
								className='w-full rounded border border-slate-700 bg-lepax-charcoal px-3 py-2 text-sm text-lepax-silver focus:border-lepax-gold focus:outline-none'
							/>
						</div>

						<div className='space-y-1'>
							<label className='block text-xs font-medium text-lepax-silver/80'>
								Description (Markdown)
							</label>
							<textarea
								rows={4}
								value={form.description_md}
								onChange={(e) =>
									setForm((f) => ({
										...f,
										description_md: e.target.value,
									}))
								}
								className='w-full rounded border border-slate-700 bg-lepax-charcoal px-3 py-2 text-sm text-lepax-silver focus:border-lepax-gold focus:outline-none resize-y'
							/>
						</div>

						<div className='flex items-center gap-2 pt-1'>
							<input
								id='seller-active'
								type='checkbox'
								checked={form.active}
								onChange={(e) =>
									setForm((f) => ({
										...f,
										active: e.target.checked,
									}))
								}
								className='h-4 w-4 rounded border-slate-700 bg-lepax-charcoal'
							/>
							<label
								htmlFor='seller-active'
								className='text-xs text-lepax-silver/80'
							>
								Active in catalogue
							</label>
						</div>

						<button
							type='submit'
							disabled={saving}
							className='mt-2 w-full rounded-full bg-lepax-gold px-4 py-2 text-sm font-medium text-lepax-charcoal hover:bg-lepax-rose transition disabled:opacity-70'
						>
							{saving
								? 'Saving…'
								: editingId === null
								? 'Create product'
								: 'Save changes'}
						</button>

						{saveError && (
							<p className='text-xs text-red-400 pt-1'>{saveError}</p>
						)}
					</form>
				</section>
			</div>
		</main>
	);
}
