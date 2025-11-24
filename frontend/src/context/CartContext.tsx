import { createContext, useContext, useState, ReactNode } from 'react';
import { api } from '../lib/api';

export type CartItem = {
	product_id: number;
	name: string;
	brand: string;
	category: string;
	price_cents: number;
	currency: string;
	qty: number;
};

type CartContextType = {
	items: CartItem[];
	addItem: (item: Omit<CartItem, 'qty'>, qty?: number) => void;
	removeItem: (product_id: number) => void;
	clear: () => void;
	totalCents: number;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
	const [items, setItems] = useState<CartItem[]>([]);

	function addItem(item: Omit<CartItem, 'qty'>, qty = 1) {
		setItems((prev) => {
			const existing = prev.find((p) => p.product_id === item.product_id);
			if (existing) {
				return prev.map((p) =>
					p.product_id === item.product_id ? { ...p, qty: p.qty + qty } : p
				);
			}
			return [...prev, { ...item, qty }];
		});

		// Fire and forget analytics for "add_to_cart"
		api
			.post('/api/analytics/interaction', {
				action: 'add_to_cart',
				metadata: `product_id=${item.product_id}`,
			})
			.catch((err) => {
				// Optional log, but do not break cart on analytics failure
				console.error('Failed to log add_to_cart analytics', err);
			});
	}

	function removeItem(product_id: number) {
		setItems((prev) => prev.filter((p) => p.product_id !== product_id));
	}

	function clear() {
		setItems([]);
	}

	const totalCents = items.reduce(
		(sum, it) => sum + it.price_cents * it.qty,
		0
	);

	return (
		<CartContext.Provider
			value={{ items, addItem, removeItem, clear, totalCents }}
		>
			{children}
		</CartContext.Provider>
	);
}

export function useCart() {
	const ctx = useContext(CartContext);
	if (!ctx) throw new Error('useCart must be used within CartProvider');
	return ctx;
}
