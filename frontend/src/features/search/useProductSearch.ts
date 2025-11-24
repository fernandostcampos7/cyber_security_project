import { useQuery } from '@tanstack/react-query';
import { getJson } from '../../lib/api';

type ProductsResponse = {
	items: any[];
	total: number;
	page: number;
	limit: number;
};

type ProductSearchOptions = {
	q?: string;
	brand?: string;
	category?: string;
	page?: number;
	limit?: number;
	sort?: string;
};

export function useProductSearch({
	q = '',
	brand = '',
	category = '',
	page = 1,
	limit = 12,
	sort = 'newest',
}: ProductSearchOptions) {
	const trimmedQ = q.trim();
	const trimmedBrand = brand.trim();
	const trimmedCategory = category.trim();

	return useQuery<ProductsResponse>({
		queryKey: [
			'catalogue',
			{ trimmedQ, trimmedBrand, trimmedCategory, page, limit, sort },
		],
		placeholderData: (prev) => prev,
		queryFn: async (): Promise<ProductsResponse> => {
			const params: Record<string, string | number> = { page, limit, sort };

			if (trimmedQ) params.q = trimmedQ;
			if (trimmedBrand && trimmedBrand !== 'Brand') params.brand = trimmedBrand;
			if (trimmedCategory && trimmedCategory !== 'Category')
				params.category = trimmedCategory;

			return getJson<ProductsResponse>('/api/products', params);
		},
	});
}
