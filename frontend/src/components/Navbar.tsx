import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const Navbar = () => {
  const { user, logout } = useAuth();
  return (
    <header className="bg-charcoal border-b border-roseGold/40">
      <div className="container mx-auto flex items-center justify-between px-4 py-4">
        <Link to="/" className="text-2xl font-semibold text-gold">
          LePax
        </Link>
        <nav className="flex items-center gap-4 text-sm uppercase tracking-wide">
          <Link to="/cart">Cart</Link>
          {user ? (
            <>
              <Link to="/orders">Orders</Link>
              <Link to="/account">Account</Link>
              {user.role === "seller" && <Link to="/seller">Seller</Link>}
              {user.role === "admin" && <Link to="/admin">Admin</Link>}
              <button onClick={logout} className="text-roseGold">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/signin">Sign In</Link>
              <Link to="/signup">Join</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
