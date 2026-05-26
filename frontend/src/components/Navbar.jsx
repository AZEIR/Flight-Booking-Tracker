import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="bg-slate-900 border-b border-slate-800 p-4 text-white sticky top-0 z-50">
      <div className="container mx-auto flex justify-between items-center max-w-5xl">
        <Link to="/" className="text-2xl font-extrabold tracking-tight">
          Flight Booking <span className="text-blue-500"> Tracker</span>
        </Link>

        <div className="flex gap-6 items-center font-medium">
          {/* Public / Authenticated Route: Always allow browsing the main catalog */}
          <Link
            to="/"
            className="text-slate-300 hover:text-white transition-colors text-sm font-semibold"
          >
            Available Flights
          </Link>

          {user ? (
            <>
              {/* FIXED LINK: Point directly to the new /dashboard route path */}
              <Link
                to="/dashboard"
                className="text-slate-300 hover:text-white transition-colors text-sm font-semibold"
              >
                {user.role === "admin" ? "Admin Ledger" : "My Bookings"}
              </Link>

              <Link
                to="/profile"
                className="text-slate-300 hover:text-white transition-colors text-sm font-semibold"
              >
                Profile
              </Link>

              <button
                onClick={handleLogout}
                className="bg-slate-800 hover:bg-slate-700 text-red-400 hover:text-red-300 px-5 py-2 rounded-2xl transition-all text-sm font-bold shadow-sm"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="text-slate-300 hover:text-white transition-colors text-sm font-semibold"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-2xl transition-all shadow-md text-sm font-bold"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
