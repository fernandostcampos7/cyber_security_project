import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function LogoutButton() {
	const { setUser } = useAuth();
	const navigate = useNavigate();

	async function handleLogout() {
		try {
			await api.post('/api/auth/logout');
		} catch (err) {
			console.error('Logout failed', err);
		} finally {
			setUser(null);
			navigate('/');
		}
	}

	return (
		<button type='button' onClick={handleLogout}>
			Logout
		</button>
	);
}
