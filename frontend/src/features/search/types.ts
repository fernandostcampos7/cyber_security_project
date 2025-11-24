export interface SearchItem {
	id: number;
	name: string;
	brand: string;
	category: string;
	rank: number;
}

export interface SearchResponse {
	items: SearchItem[];
	total: number;
	page: number;
	limit: number;
}
