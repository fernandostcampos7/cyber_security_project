import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { useState, useMemo } from 'react';
import {
	ResponsiveContainer,
	LineChart,
	Line,
	XAxis,
	YAxis,
	Tooltip,
	CartesianGrid,
} from 'recharts';

type ViewEvent = {
	id: number;
	user_id: number | null;
	session_id?: string | null;
	path: string;
	product_id?: number | null;
	referrer?: string | null;
	user_agent?: string | null;
	occurred_at: string | null;
};

type InteractionEvent = {
	id: number;
	user_id: number | null;
	session_id?: string | null;
	action: string | null;
	metadata?: string | null;
	occurred_at: string | null;
};

type AnalyticsResponse = {
	views: ViewEvent[];
	interactions: InteractionEvent[];
};

function isWithinRange(
	iso: string | null,
	startDate: string,
	endDate: string
): boolean {
	if (!iso) return false;
	const dateOnly = iso.slice(0, 10); // YYYY-MM-DD
	if (startDate && dateOnly < startDate) return false;
	if (endDate && dateOnly > endDate) return false;
	return true;
}

function getWeekKey(date: Date): string {
	const year = date.getUTCFullYear();
	const startOfYear = new Date(Date.UTC(year, 0, 1));
	const diffMs = date.getTime() - startOfYear.getTime();
	const dayIndex = Math.floor(diffMs / 86400000);
	const week = Math.floor(dayIndex / 7) + 1;
	return `${year}-W${String(week).padStart(2, '0')}`;
}

const tooltipStyles = {
	contentStyle: {
		backgroundColor: '#020617',
		borderColor: '#334155',
		color: '#e5e7eb',
	},
	labelStyle: { color: '#e5e7eb' },
	cursor: { stroke: '#475569', strokeWidth: 1 },
} as const;

export default function AdminAnalytics() {
	const { user } = useAuth();

	if (!user || user.role !== 'admin') {
		return <Navigate to='/' replace />;
	}

	const [startDate, setStartDate] = useState('');
	const [endDate, setEndDate] = useState('');

	const analyticsQuery = useQuery<AnalyticsResponse>({
		queryKey: ['admin-analytics'],
		queryFn: async () => {
			const res = await api.get('/api/admin/analytics');
			return res.data;
		},
	});

	const views = analyticsQuery.data?.views ?? [];
	const interactions = analyticsQuery.data?.interactions ?? [];

	const filteredViews = useMemo(
		() => views.filter((v) => isWithinRange(v.occurred_at, startDate, endDate)),
		[views, startDate, endDate]
	);

	const filteredInteractions = useMemo(
		() =>
			interactions.filter((e) =>
				isWithinRange(e.occurred_at, startDate, endDate)
			),
		[interactions, startDate, endDate]
	);

	// Daily chart data
	const dailyData = useMemo(() => {
		const counts: Record<string, number> = {};
		for (const v of filteredViews) {
			if (!v.occurred_at) continue;
			const d = v.occurred_at.slice(0, 10); // YYYY-MM-DD
			counts[d] = (counts[d] || 0) + 1;
		}
		return Object.entries(counts)
			.map(([date, views]) => ({ label: date, views }))
			.sort((a, b) => a.label.localeCompare(b.label));
	}, [filteredViews]);

	// Weekly chart data
	const weeklyData = useMemo(() => {
		const counts: Record<string, number> = {};
		for (const v of filteredViews) {
			if (!v.occurred_at) continue;
			const d = new Date(v.occurred_at);
			if (Number.isNaN(d.getTime())) continue;
			const key = getWeekKey(d);
			counts[key] = (counts[key] || 0) + 1;
		}
		return Object.entries(counts)
			.map(([label, views]) => ({ label, views }))
			.sort((a, b) => a.label.localeCompare(b.label));
	}, [filteredViews]);

	// Monthly chart data
	const monthlyData = useMemo(() => {
		const counts: Record<string, number> = {};
		for (const v of filteredViews) {
			if (!v.occurred_at) continue;
			const d = new Date(v.occurred_at);
			if (Number.isNaN(d.getTime())) continue;
			const year = d.getUTCFullYear();
			const month = d.getUTCMonth() + 1;
			const key = `${year}-${String(month).padStart(2, '0')}`;
			counts[key] = (counts[key] || 0) + 1;
		}
		return Object.entries(counts)
			.map(([label, views]) => ({ label, views }))
			.sort((a, b) => a.label.localeCompare(b.label));
	}, [filteredViews]);

	// Annual chart data
	const yearlyData = useMemo(() => {
		const counts: Record<string, number> = {};
		for (const v of filteredViews) {
			if (!v.occurred_at) continue;
			const d = new Date(v.occurred_at);
			if (Number.isNaN(d.getTime())) continue;
			const year = d.getUTCFullYear().toString();
			counts[year] = (counts[year] || 0) + 1;
		}
		return Object.entries(counts)
			.map(([label, views]) => ({ label, views }))
			.sort((a, b) => a.label.localeCompare(b.label));
	}, [filteredViews]);

	return (
		<main className='mx-auto max-w-6xl px-4 py-10 text-slate-100 space-y-8'>
			<header className='flex flex-col gap-1'>
				<p className='text-xs tracking-[0.3em] text-lepax-silver/60 uppercase'>
					Admin
				</p>
				<h1 className='text-3xl font-semibold tracking-tight'>
					Analytics overview
				</h1>
				<p className='text-sm text-lepax-silver/70 max-w-2xl'>
					High level view of page views and key interactions. Data is stored
					server side and linked to logged in users only where needed for
					security and fraud monitoring.
				</p>
			</header>

			{/* Date filters */}
			<section className='flex flex-wrap gap-4 items-end'>
				<div>
					<label className='block text-xs text-lepax-silver/70 mb-1'>
						Start date
					</label>
					<input
						type='date'
						value={startDate}
						onChange={(e) => setStartDate(e.target.value)}
						className='rounded-md border border-slate-700 bg-lepax-charcoalSoft px-2 py-1 text-sm text-slate-100'
					/>
				</div>
				<div>
					<label className='block text-xs text-lepax-silver/70 mb-1'>
						End date
					</label>
					<input
						type='date'
						value={endDate}
						onChange={(e) => setEndDate(e.target.value)}
						className='rounded-md border border-slate-700 bg-lepax-charcoalSoft px-2 py-1 text-sm text-slate-100'
					/>
				</div>
				<p className='text-xs text-lepax-silver/70'>
					Filtering {filteredViews.length} views and{' '}
					{filteredInteractions.length} interactions for the selected period.
				</p>
			</section>

			{/* Summary cards */}
			<section className='grid gap-4 md:grid-cols-3'>
				<div className='rounded-2xl border border-slate-800 bg-lepax-charcoalSoft/80 p-4'>
					<p className='text-xs text-lepax-silver/60 uppercase tracking-[0.18em]'>
						Page views
					</p>
					<p className='mt-1 text-2xl font-semibold'>
						{analyticsQuery.isLoading ? '…' : filteredViews.length}
					</p>
					<p className='mt-1 text-xs text-lepax-silver/70'>
						All recorded page views in the selected period.
					</p>
				</div>

				<div className='rounded-2xl border border-slate-800 bg-lepax-charcoalSoft/80 p-4'>
					<p className='text-xs text-lepax-silver/60 uppercase tracking-[0.18em]'>
						Interactions
					</p>
					<p className='mt-1 text-2xl font-semibold'>
						{analyticsQuery.isLoading ? '…' : filteredInteractions.length}
					</p>
					<p className='mt-1 text-xs text-lepax-silver/70'>
						Includes add to cart, checkout, reviews and similar events.
					</p>
				</div>

				<div className='rounded-2xl border border-slate-800 bg-lepax-charcoalSoft/80 p-4'>
					<p className='text-xs text-lepax-silver/60 uppercase tracking-[0.18em]'>
						Security focus
					</p>
					<p className='mt-1 text-sm text-lepax-silver/80'>
						Logs support anomaly detection and audit trails without storing IP
						addresses or unnecessary personal data.
					</p>
				</div>
			</section>

			{/* Charts */}
			<section className='space-y-6'>
				{/* Daily */}
				<div className='rounded-2xl border border-slate-800 bg-lepax-charcoalSoft/80 p-4'>
					<h2 className='text-sm font-semibold text-slate-100 mb-2'>
						Page views per day
					</h2>
					{analyticsQuery.isLoading ? (
						<p className='text-xs text-lepax-silver/70'>Loading chart…</p>
					) : dailyData.length === 0 ? (
						<p className='text-xs text-lepax-silver/70'>
							No page views in the selected period.
						</p>
					) : (
						<div className='h-64'>
							<ResponsiveContainer width='100%' height='100%'>
								<LineChart data={dailyData}>
									<CartesianGrid strokeDasharray='3 3' opacity={0.2} />
									<XAxis dataKey='label' tick={{ fontSize: 10 }} />
									<YAxis tick={{ fontSize: 10 }} />
									<Tooltip
										contentStyle={tooltipStyles.contentStyle}
										labelStyle={tooltipStyles.labelStyle}
										cursor={tooltipStyles.cursor}
									/>
									<Line
										type='monotone'
										dataKey='views'
										stroke='#facc15'
										dot={false}
										activeDot={{ r: 5 }}
									/>
								</LineChart>
							</ResponsiveContainer>
						</div>
					)}
				</div>

				{/* Weekly */}
				<div className='rounded-2xl border border-slate-800 bg-lepax-charcoalSoft/80 p-4'>
					<h2 className='text-sm font-semibold text-slate-100 mb-2'>
						Page views per week
					</h2>
					{analyticsQuery.isLoading ? (
						<p className='text-xs text-lepax-silver/70'>Loading chart…</p>
					) : weeklyData.length === 0 ? (
						<p className='text-xs text-lepax-silver/70'>
							No page views in the selected period.
						</p>
					) : (
						<div className='h-64'>
							<ResponsiveContainer width='100%' height='100%'>
								<LineChart data={weeklyData}>
									<CartesianGrid strokeDasharray='3 3' opacity={0.2} />
									<XAxis dataKey='label' tick={{ fontSize: 10 }} />
									<YAxis tick={{ fontSize: 10 }} />
									<Tooltip
										contentStyle={tooltipStyles.contentStyle}
										labelStyle={tooltipStyles.labelStyle}
										cursor={tooltipStyles.cursor}
									/>
									<Line
										type='monotone'
										dataKey='views'
										stroke='#f97316'
										dot={false}
										activeDot={{ r: 5 }}
									/>
								</LineChart>
							</ResponsiveContainer>
						</div>
					)}
				</div>

				{/* Monthly */}
				<div className='rounded-2xl border border-slate-800 bg-lepax-charcoalSoft/80 p-4'>
					<h2 className='text-sm font-semibold text-slate-100 mb-2'>
						Page views per month
					</h2>
					{analyticsQuery.isLoading ? (
						<p className='text-xs text-lepax-silver/70'>Loading chart…</p>
					) : monthlyData.length === 0 ? (
						<p className='text-xs text-lepax-silver/70'>
							No page views in the selected period.
						</p>
					) : (
						<div className='h-64'>
							<ResponsiveContainer width='100%' height='100%'>
								<LineChart data={monthlyData}>
									<CartesianGrid strokeDasharray='3 3' opacity={0.2} />
									<XAxis dataKey='label' tick={{ fontSize: 10 }} />
									<YAxis tick={{ fontSize: 10 }} />
									<Tooltip
										contentStyle={tooltipStyles.contentStyle}
										labelStyle={tooltipStyles.labelStyle}
										cursor={tooltipStyles.cursor}
									/>
									<Line
										type='monotone'
										dataKey='views'
										stroke='#22c55e'
										dot={false}
										activeDot={{ r: 5 }}
									/>
								</LineChart>
							</ResponsiveContainer>
						</div>
					)}
				</div>

				{/* Yearly */}
				<div className='rounded-2xl border border-slate-800 bg-lepax-charcoalSoft/80 p-4'>
					<h2 className='text-sm font-semibold text-slate-100 mb-2'>
						Page views per year
					</h2>
					{analyticsQuery.isLoading ? (
						<p className='text-xs text-lepax-silver/70'>Loading chart…</p>
					) : yearlyData.length === 0 ? (
						<p className='text-xs text-lepax-silver/70'>
							No page views in the selected period.
						</p>
					) : (
						<div className='h-64'>
							<ResponsiveContainer width='100%' height='100%'>
								<LineChart data={yearlyData}>
									<CartesianGrid strokeDasharray='3 3' opacity={0.2} />
									<XAxis dataKey='label' tick={{ fontSize: 10 }} />
									<YAxis tick={{ fontSize: 10 }} />
									<Tooltip
										contentStyle={tooltipStyles.contentStyle}
										labelStyle={tooltipStyles.labelStyle}
										cursor={tooltipStyles.cursor}
									/>
									<Line
										type='monotone'
										dataKey='views'
										stroke='#38bdf8'
										dot={false}
										activeDot={{ r: 5 }}
									/>
								</LineChart>
							</ResponsiveContainer>
						</div>
					)}
				</div>
			</section>

			{/* Tables */}
			<section className='grid gap-6 lg:grid-cols-2'>
				{/* Views table */}
				<div className='rounded-2xl border border-slate-800 bg-lepax-charcoalSoft/80 p-4'>
					<h2 className='text-sm font-semibold text-slate-100 mb-2'>
						Page views in period
					</h2>
					{analyticsQuery.isLoading ? (
						<p className='text-xs text-lepax-silver/70'>Loading views…</p>
					) : analyticsQuery.isError ? (
						<p className='text-xs text-red-400'>Failed to load views.</p>
					) : filteredViews.length > 0 ? (
						<div className='max-h-80 overflow-auto text-xs'>
							<table className='w-full border-collapse'>
								<thead className='text-lepax-silver/60'>
									<tr>
										<th className='border-b border-slate-800 py-1 pr-2 text-left'>
											When
										</th>
										<th className='border-b border-slate-800 py-1 pr-2 text-left'>
											Path
										</th>
										<th className='border-b border-slate-800 py-1 pr-2 text-left'>
											User
										</th>
									</tr>
								</thead>
								<tbody>
									{filteredViews.map((v) => (
										<tr key={v.id} className='align-top'>
											<td className='border-b border-slate-900 py-1 pr-2'>
												{v.occurred_at
													? new Date(v.occurred_at).toLocaleString('en-GB')
													: '-'}
											</td>
											<td className='border-b border-slate-900 py-1 pr-2'>
												{v.path}
											</td>
											<td className='border-b border-slate-900 py-1 pr-2'>
												{v.user_id ?? 'guest'}
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					) : (
						<p className='text-xs text-lepax-silver/70'>
							No view data in this period.
						</p>
					)}
				</div>

				{/* Interactions table */}
				<div className='rounded-2xl border border-slate-800 bg-lepax-charcoalSoft/80 p-4'>
					<h2 className='text-sm font-semibold text-slate-100 mb-2'>
						Interactions in period
					</h2>
					{analyticsQuery.isLoading ? (
						<p className='text-xs text-lepax-silver/70'>
							Loading interactions…
						</p>
					) : analyticsQuery.isError ? (
						<p className='text-xs text-red-400'>Failed to load interactions.</p>
					) : filteredInteractions.length > 0 ? (
						<div className='max-h-80 overflow-auto text-xs'>
							<table className='w-full border-collapse'>
								<thead className='text-lepax-silver/60'>
									<tr>
										<th className='border-b border-slate-800 py-1 pr-2 text-left'>
											When
										</th>
										<th className='border-b border-slate-800 py-1 pr-2 text-left'>
											Action
										</th>
										<th className='border-b border-slate-800 py-1 pr-2 text-left'>
											User
										</th>
										<th className='border-b border-slate-800 py-1 pr-2 text-left'>
											Details
										</th>
									</tr>
								</thead>
								<tbody>
									{filteredInteractions.map((e) => (
										<tr key={e.id} className='align-top'>
											<td className='border-b border-slate-900 py-1 pr-2'>
												{e.occurred_at
													? new Date(e.occurred_at).toLocaleString('en-GB')
													: '-'}
											</td>
											<td className='border-b border-slate-900 py-1 pr-2'>
												{e.action}
											</td>
											<td className='border-b border-slate-900 py-1 pr-2'>
												{e.user_id ?? 'guest'}
											</td>
											<td className='border-b border-slate-900 py-1 pr-2'>
												{e.metadata || '-'}
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					) : (
						<p className='text-xs text-lepax-silver/70'>
							No interaction data in this period.
						</p>
					)}
				</div>
			</section>
		</main>
	);
}
