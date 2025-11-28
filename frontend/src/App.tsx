import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Catalogue from './pages/Catalogue';
import ProductDetail from './pages/ProductDetail';
import Login from './pages/Login';
import AdminUsers from './pages/AdminUsers';
import NotFound from './pages/NotFound';
import SearchPage from './pages/SearchPage';
import Profile from './pages/Profile';
import CartPage from './pages/Cart';
import OrdersPage from './pages/Orders';
import AdminAnalytics from './pages/AdminAnalytics';
import SellerDashboard from './pages/SellerDashboard';
import ForgotPassword from './pages/ForgotPassword';

import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

// Stripe publishable key from Vite env
const stripePromise = loadStripe(
	import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string
);

export default function App() {
	return (
		<div className='min-h-screen flex flex-col bg-[#0b0c10] text-slate-50'>
			<Routes>
				<Route element={<Layout />}>
					<Route path='/' element={<Home />} />
					<Route path='/catalogue' element={<Catalogue />} />
					<Route path='/products/:id' element={<ProductDetail />} />
					<Route path='/login' element={<Login />} />
					<Route path='/forgot-password' element={<ForgotPassword />} />
					<Route path='/admin' element={<AdminUsers />} />
					<Route path='/search' element={<SearchPage />} />
					<Route path='/profile' element={<Profile />} />
					<Route path='/admin/users' element={<AdminUsers />} />

					{/* Cart / checkout wrapped in Stripe Elements */}
					<Route
						path='/cart'
						element={
							<Elements stripe={stripePromise}>
								<CartPage />
							</Elements>
						}
					/>

					<Route path='/orders' element={<OrdersPage />} />
					<Route path='/admin/analytics' element={<AdminAnalytics />} />
					<Route path='/seller' element={<SellerDashboard />} />
					<Route path='*' element={<NotFound />} />
				</Route>
			</Routes>
		</div>
	);
}
