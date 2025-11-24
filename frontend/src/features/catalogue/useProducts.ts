import { useQuery } from '@tanstack/react-query';
import { getJson } from '../../lib/api';
import type { ProductListResponse } from './types';

export type ProductQuery = Partial<{
	brand: string;
	category: string;
	size: string;
	colour: string;
	min_price: number;
	max_price: number;
	sort: 'newest' | 'price_asc' | 'price_desc';
	page: number;
	limit: number;
}>;

export function useProducts(params: ProductQuery) {
	return useQuery({
		queryKey: ['products', params],
		queryFn: () => getJson<ProductListResponse>('/api/products', params),
		placeholderData: (prev) => prev,
	});
}
