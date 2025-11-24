import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';

type UserSummary = {
	id: number;
	email: string;
	role: 'customer' | 'seller' | 'admin';
};

export default function AdminUsersPage() {
	const { user } = useAuth();
	const [users, setUsers] = useState<UserSummary[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const [savingId, setSavingId] = useState<number | null>(null);

	useEffect(() => {
		async function load() {
			try {
				setLoading(true);
				setError('');
				const res = await api.get('/api/admin/users');

				// backend returns: { items: [...] }
				const items = res.data.items ?? [];
				const mapped: UserSummary[] = items.map((u: any) => ({
					id: u.id,
					email: u.email,
					role: u.role,
				}));

				setUsers(mapped);
			} catch (err: any) {
				setError(err.response?.data?.error || 'Failed to load users');
			} finally {
				setLoading(false);
			}
		}
		load();
	}, []);

	function handleLocalRoleChange(id: number, role: UserSummary['role']) {
		setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, role } : u)));
	}

	async function handleSave(userId: number, role: UserSummary['role']) {
		setSavingId(userId);
		try {
			const res = await api.patch(`/api/admin/users/${userId}`, { role });
			const updated: UserSummary = res.data.user;
			setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
		} catch (err: any) {
			alert(err.response?.data?.error || 'Failed to update user');
		} finally {
			setSavingId(null);
		}
	}

	if (loading) {
		return (
			<main className='mx-auto max-w-5xl px-4 py-10 text-slate-100'>
				<p className='text-sm text-lepax-silver/80'>Loading users…</p>
			</main>
		);
	}

	if (error) {
		return (
			<main className='mx-auto max-w-5xl px-4 py-10 text-slate-100'>
				<p className='text-sm text-red-400'>{error}</p>
			</main>
		);
	}

	return (
		<main className='mx-auto max-w-5xl px-4 py-10 text-slate-100 space-y-6'>
			<header className='space-y-1'>
				<p className='text-xs tracking-[0.3em] uppercase text-lepax-silver/60'>
					Admin
				</p>
				<h1 className='text-3xl font-semibold tracking-tight'>User accounts</h1>
				<p className='text-sm text-lepax-silver/80'>
					View and manage roles for all registered users. Admins can promote or
					demote accounts between customer, seller, and admin.
				</p>
			</header>

			<section className='space-y-3 rounded-2xl border border-slate-800 bg-lepax-charcoalSoft/80 p-5'>
				<table className='w-full text-sm'>
					<thead className='text-xs uppercase tracking-[0.15em] text-lepax-silver/60'>
						<tr className='border-b border-slate-800'>
							<th className='py-2 text-left'>ID</th>
							<th className='py-2 text-left'>Email</th>
							<th className='py-2 text-left'>Role</th>
							<th className='py-2 text-right'>Actions</th>
						</tr>
					</thead>
					<tbody>
						{users.map((u) => (
							<tr key={u.id} className='border-b border-slate-900/60'>
								<td className='py-2 pr-3 align-middle text-xs text-lepax-silver/70'>
									#{u.id}
								</td>
								<td className='py-2 pr-3 align-middle'>{u.email}</td>
								<td className='py-2 pr-3 align-middle'>
									<select
										value={u.role}
										onChange={(e) =>
											handleLocalRoleChange(
												u.id,
												e.target.value as UserSummary['role']
											)
										}
										className='rounded border border-slate-700 bg-lepax-charcoal px-2 py-1 text-xs text-lepax-silver focus:border-lepax-gold focus:outline-none'
									>
										<option value='customer'>customer</option>
										<option value='seller'>seller</option>
										<option value='admin'>admin</option>
									</select>
								</td>
								<td className='py-2 text-right align-middle'>
									<button
										onClick={() => handleSave(u.id, u.role)}
										disabled={savingId === u.id}
										className='rounded-full border border-lepax-gold/70 px-3 py-1 text-xs font-medium text-lepax-gold hover:bg-lepax-gold hover:text-lepax-charcoal transition disabled:opacity-60'
									>
										{savingId === u.id ? 'Saving…' : 'Save'}
									</button>
								</td>
							</tr>
						))}
					</tbody>
				</table>

				{user && (
					<p className='pt-2 text-xs text-lepax-silver/60'>
						You are signed in as{' '}
						<span className='font-medium'>{user.role}</span>.
					</p>
				)}
			</section>
		</main>
	);
}
