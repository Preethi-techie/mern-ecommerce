import { ShoppingCart, UserPlus, LogIn, LogOut, Lock } from "lucide-react";
import { Link } from "react-router-dom";
import { useUserStore } from "../stores/useUserStore";
import { useCartStore } from "../stores/useCartStore";

const Navbar = () => {
  const { user, logout } = useUserStore();

  const isAdmin = user?.role === "admin";
  const cart = useCartStore((state) => state.cart);

  return (
    <header className="fixed top-0 left-0 w-full bg-gray-900 bg-opacity-90 backdrop-blur-md shadow-lg z-40 border-b border-emerald-800">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          <Link to="/" className="text-2xl font-bold text-emerald-400">
            E-Commerce
          </Link>

          <nav className="flex items-center gap-4">
            <Link to="/" className="text-gray-300 hover:text-emerald-400">
              Home
            </Link>

            {/* 🛒 CART */}
            {user && (
              <Link
                to="/cart"
                className="relative text-gray-300 hover:text-emerald-400 flex items-center"
              >
                <ShoppingCart size={20} className="mr-1" />
                <span className="hidden sm:inline">Cart</span>

                {cart.length > 0 && (
                  <span className="absolute -top-2 -left-2 bg-emerald-500 text-white rounded-full px-2 py-0.5 text-xs">
                    {cart.length}
                  </span>
                )}
              </Link>
            )}

            {/* 🔐 ADMIN DASHBOARD */}
            {isAdmin && (
              <Link
                to="/secret-dashboard"
                className="bg-emerald-700 hover:bg-emerald-600 text-white px-3 py-1 rounded-md flex items-center"
              >
                <Lock size={18} className="mr-1" />
                <span className="hidden sm:inline">Dashboard</span>
              </Link>
            )}

            {/* AUTH BUTTONS */}
            {user ? (
              <button
                onClick={logout}
                className="bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-md flex items-center"
              >
                <LogOut size={18} />
                <span className="hidden sm:inline ml-2">Logout</span>
              </button>
            ) : (
              <>
                <Link
                  to="/signup"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-4 rounded-md flex items-center"
                >
                  <UserPlus size={18} className="mr-2" />
                  Sign Up
                </Link>

                <Link
                  to="/login"
                  className="bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-md flex items-center"
                >
                  <LogIn size={18} className="mr-2" />
                  Login
                </Link>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
