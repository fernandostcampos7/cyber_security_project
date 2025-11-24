import {
	createContext,
	useContext,
	useState,
	useEffect,
	ReactNode,
} from 'react';

export type User = {
	id: number;
	email: string;
	role: 'customer' | 'seller' | 'admin';
};

type AuthContextType = {
	user: User | null;
	setUser: (u: User | null) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = 'lepax_user';

export function AuthProvider({ children }: { children: ReactNode }) {
	const [user, setUserState] = useState<User | null>(null);
	const [initialised, setInitialised] = useState(false);

	// Load user from localStorage on first mount
	useEffect(() => {
		try {
			const stored = localStorage.getItem(STORAGE_KEY);
			if (stored) {
				const parsed = JSON.parse(stored) as User;
				setUserState(parsed);
			}
		} catch (err) {
			console.error('Failed to parse stored user', err);
			localStorage.removeItem(STORAGE_KEY);
		} finally {
			setInitialised(true);
		}
	}, []);

	function setUser(u: User | null) {
		setUserState(u);
		if (u) {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
		} else {
			localStorage.removeItem(STORAGE_KEY);
		}
	}

	if (!initialised) {
		return null;
	}

	return (
		<AuthContext.Provider value={{ user, setUser }}>
			{children}
		</AuthContext.Provider>
	);
}

export function useAuth() {
	const ctx = useContext(AuthContext);
	if (!ctx) throw new Error('useAuth must be inside AuthProvider');
	return ctx;
}
