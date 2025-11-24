import { useState, useRef, useEffect, FormEvent, ChangeEvent } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';

type ProductReviewFormProps = {
	productId: number;
	productName: string;
};

type Review = {
	id: number;
	user_id: number;
	rating: number;
	body_html: string;
	created_at: string | null;
};

export default function ProductReviewForm({
	productId,
	productName,
}: ProductReviewFormProps) {
	const { user } = useAuth();

	const [rating, setRating] = useState(5);
	const [body, setBody] = useState('');
	const [posting, setPosting] = useState(false);
	const [error, setError] = useState('');
	const [success, setSuccess] = useState('');
	const [images, setImages] = useState<File[]>([]);

	// new: track whether this product is already reviewed by this user
	const [hasReview, setHasReview] = useState(false);
	const [existingReview, setExistingReview] = useState<Review | null>(null);
	const [checking, setChecking] = useState(true);

	const textareaRef = useRef<HTMLTextAreaElement | null>(null);

	// On mount, check if the current user has already reviewed this product
	useEffect(() => {
		let cancelled = false;

		async function checkReview() {
			if (!user) {
				setChecking(false);
				return;
			}

			try {
				const res = await api.get(`/api/products/${productId}/reviews`);
				const reviews: Review[] = res.data.reviews ?? [];
				const mine = reviews.find((r) => r.user_id === user.id);

				if (!cancelled && mine) {
					setHasReview(true);
					setExistingReview(mine);
				}
			} catch (err) {
				// fail silently for UX; user can still submit
			} finally {
				if (!cancelled) setChecking(false);
			}
		}

		checkReview();
		return () => {
			cancelled = true;
		};
	}, [productId, user]);

	function applyFormatting(type: 'bold' | 'italic' | 'bullet') {
		const textarea = textareaRef.current;
		if (!textarea) return;

		const start = textarea.selectionStart;
		const end = textarea.selectionEnd;
		const selected = body.slice(start, end);

		const before = body.slice(0, start);
		const after = body.slice(end);
		let replacement = selected;

		if (type === 'bold') {
			replacement = `**${selected || 'bold text'}**`;
		} else if (type === 'italic') {
			replacement = `*${selected || 'italic text'}*`;
		} else if (type === 'bullet') {
			const lines = (selected || 'list item').split('\n');
			replacement = lines.map((line) => (line ? `- ${line}` : '- ')).join('\n');
		}

		const newBody = before + replacement + after;
		setBody(newBody);

		const newPos = before.length + replacement.length;
		requestAnimationFrame(() => {
			textarea.focus();
			textarea.selectionStart = textarea.selectionEnd = newPos;
		});
	}

	function handleImageChange(e: ChangeEvent<HTMLInputElement>) {
		if (!e.target.files) return;
		const files = Array.from(e.target.files).slice(0, 4);
		setImages(files);
	}

	function handleRemoveImage(index: number) {
		setImages((prev) => prev.filter((_, i) => i !== index));
	}

	async function handleSubmit(e: FormEvent) {
		e.preventDefault();
		setError('');
		setSuccess('');
		setPosting(true);

		try {
			if (!body.trim() || !rating) {
				setError('Missing rating or body');
				return;
			}

			const res = await api.post(`/api/products/${productId}/reviews`, {
				rating,
				body,
			});

			if (res.data?.ok && res.data.review) {
				setSuccess('Review submitted. Thank you.');
				setBody('');
				setRating(5);
				setImages([]);
				setHasReview(true);
				setExistingReview(res.data.review as Review);
			} else if (res.data?.ok) {
				// ok but no review object: still treat as reviewed
				setSuccess('Review submitted. Thank you.');
				setHasReview(true);
			} else {
				setError(res.data?.error || 'Failed to submit review');
			}
		} catch (err: any) {
			const status = err.response?.status;
			const message = err.response?.data?.error || 'Failed to submit review';

			if (status === 403) {
				setError(
					'You can only review products you have purchased with this account.'
				);
			} else if (status === 409) {
				// one review per product per user
				setError('');
				setSuccess('You have already reviewed this product.');
				setHasReview(true);
			} else {
				setError(message);
			}
		} finally {
			setPosting(false);
		}
	}

	// While we are checking, show nothing fancy to avoid flicker
	if (checking) {
		return null;
	}

	// If user already reviewed: show the existing review and hide the form
	if (hasReview && existingReview) {
		const dateLabel = existingReview.created_at
			? new Date(existingReview.created_at).toLocaleDateString('en-GB')
			: '';

		return (
			<div className='mt-3 space-y-2 rounded-xl border border-slate-800 bg-lepax-charcoal/70 p-3 text-xs'>
				<p className='font-semibold text-slate-100'>
					Your review for <span className='text-lepax-gold'>{productName}</span>
				</p>
				<p className='text-[0.7rem] text-lepax-silver/70'>
					Rating:{' '}
					<span className='font-semibold'>{existingReview.rating}/5</span>{' '}
					{dateLabel && (
						<span className='text-lepax-silver/50'>· {dateLabel}</span>
					)}
				</p>
				<div
					className='prose prose-invert prose-xs max-w-none text-lepax-silver/90'
					dangerouslySetInnerHTML={{ __html: existingReview.body_html }}
				/>
				{success && (
					<p className='text-[0.7rem] text-emerald-400 mt-1'>{success}</p>
				)}
			</div>
		);
	}

	// If user already reviewed but we do not have the body (no review object)
	if (hasReview && !existingReview) {
		return (
			<div className='mt-3 rounded-xl border border-slate-800 bg-lepax-charcoal/70 p-3 text-xs'>
				<p className='font-semibold text-slate-100'>
					You have already reviewed{' '}
					<span className='text-lepax-gold'>{productName}</span>.
				</p>
				{success && (
					<p className='text-[0.7rem] text-emerald-400 mt-1'>{success}</p>
				)}
			</div>
		);
	}

	// Default: show the form (only for items not reviewed yet)
	return (
		<form
			onSubmit={handleSubmit}
			className='mt-3 space-y-3 rounded-xl border border-slate-800 bg-lepax-charcoal/70 p-3 text-xs'
		>
			<p className='font-semibold text-slate-100'>
				Review: <span className='text-lepax-gold'>{productName}</span>
			</p>

			<div className='flex items-center gap-3'>
				<label
					htmlFor={`rating-${productId}`}
					className='text-[0.7rem] text-lepax-silver/80'
				>
					Rating
				</label>
				<input
					id={`rating-${productId}`}
					type='number'
					min={1}
					max={5}
					value={rating}
					onChange={(e) => setRating(Number(e.target.value))}
					className='w-16 rounded border border-slate-700 bg-lepax-charcoal px-2 py-1 text-xs text-lepax-silver focus:border-lepax-gold focus:outline-none'
					required
				/>
				<span className='text-[0.7rem] text-lepax-silver/60'>1–5</span>
			</div>

			<div className='space-y-1'>
				<div className='flex items-center justify-between'>
					<label
						htmlFor={`body-${productId}`}
						className='block text-[0.7rem] font-medium text-lepax-silver/80'
					>
						Review
					</label>
					<div className='flex items-center gap-1 text-[0.7rem]'>
						<span className='text-lepax-silver/60 mr-1'>Formatting</span>
						<button
							type='button'
							onClick={() => applyFormatting('bold')}
							className='rounded border border-slate-700 bg-slate-900/60 px-2 py-1 text-[0.65rem] font-semibold text-slate-100 hover:border-lepax-gold'
						>
							B
						</button>
						<button
							type='button'
							onClick={() => applyFormatting('italic')}
							className='rounded border border-slate-700 bg-slate-900/60 px-2 py-1 text-[0.65rem] italic text-slate-100 hover:border-lepax-gold'
						>
							i
						</button>
						<button
							type='button'
							onClick={() => applyFormatting('bullet')}
							className='rounded border border-slate-700 bg-slate-900/60 px-2 py-1 text-[0.65rem] text-slate-100 hover:border-lepax-gold'
						>
							• List
						</button>
					</div>
				</div>

				<textarea
					id={`body-${productId}`}
					ref={textareaRef}
					value={body}
					onChange={(e) => setBody(e.target.value)}
					rows={4}
					className='w-full rounded border border-slate-700 bg-lepax-charcoal px-3 py-2 text-xs text-lepax-silver placeholder-slate-500 focus:border-lepax-gold focus:outline-none resize-none'
					placeholder='Share your thoughts about this product…'
					required
				/>

				<p className='text-[0.65rem] text-lepax-silver/60'>
					You can use **bold**, *italic* and bullet lists using
					<code className='ml-1 rounded bg-slate-900/60 px-1'>- item</code>.
				</p>
			</div>

			<div className='space-y-1'>
				<label className='block text-[0.7rem] font-medium text-lepax-silver/80'>
					Product photos (optional)
				</label>
				<input
					type='file'
					accept='image/*'
					multiple
					onChange={handleImageChange}
					className='block w-full text-[0.7rem] text-lepax-silver file:mr-3 file:rounded-full file:border-0 file:bg-lepax-gold file:px-3 file:py-1 file:text-[0.7rem] file:font-medium file:text-lepax-charcoal file:hover:bg-lepax-rose'
				/>
				{images.length > 0 && (
					<ul className='mt-1 space-y-1 text-[0.65rem] text-lepax-silver/80'>
						{images.map((file, idx) => (
							<li key={idx} className='flex items-center justify-between gap-2'>
								<span className='truncate'>{file.name}</span>
								<button
									type='button'
									onClick={() => handleRemoveImage(idx)}
									className='text-[0.65rem] text-red-400 hover:text-red-300'
								>
									Remove
								</button>
							</li>
						))}
					</ul>
				)}
				<p className='text-[0.65rem] text-lepax-silver/60'>Max 4 photos.</p>
			</div>

			<button
				type='submit'
				disabled={posting}
				className='w-full rounded-full bg-lepax-gold px-3 py-2 text-xs font-medium text-lepax-charcoal hover:bg-lepax-rose transition disabled:opacity-70'
			>
				{posting ? 'Sending…' : 'Submit review'}
			</button>

			{error && <p className='text-[0.7rem] text-red-400'>{error}</p>}
			{success && <p className='text-[0.7rem] text-emerald-400'>{success}</p>}
		</form>
	);
}
