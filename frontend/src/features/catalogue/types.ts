export interface ProductListItem {
	id: number;
	name: string;
	brand: string;
	category: string;
	price_cents: number;
}

export interface ProductListResponse {
	items: ProductListItem[];
	total: number;
	page: number;
	limit: number;
}
