import axios from 'axios';

export const api = axios.create({
	baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
	withCredentials: true,
});

export async function getJson<T>(
	url: string,
	params?: Record<string, unknown>
): Promise<T> {
	const { data } = await api.get<T>(url, { params });
	return data;
}
