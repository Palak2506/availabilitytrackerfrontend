import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * Layout - Shared layout wrapper for authenticated pages
 * 
 * @param {ReactNode} children - Page content to render
 */
export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");
  const isMentorRoute = location.pathname.startsWith("/mentor");
  const email = user?.email ?? "";

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-navy-950 flex flex-col">
      <header className="border-b border-navy-700 bg-navy-900/80 backdrop-blur sticky top-0 z-40">
        <div className="w-full px-6 h-16 flex items-center justify-between max-w-7xl mx-auto">
          {/* Admin Header */}
          {isAdminRoute && user?.role === "ADMIN" ? (
            <>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <img
                    src="/mentorque-logo.png.jpeg"
                    alt="MentorQue"
                    className="h-8 w-8 object-contain rounded-lg"
                  />
                  <span className="text-white font-semibold text-sm">
                    Mentorque Availability
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs px-2.5 py-1 rounded-full bg-blue-700 text-slate-100 font-semibold">ADMIN</span>
                {email && (
                  <span className="text-slate-400 text-xs font-medium hidden sm:inline">
                    {email}
                  </span>
                )}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="text-sm text-slate-400 hover:text-slate-200 transition-smooth px-3 py-1.5 rounded-lg hover:bg-slate-800/50"
                >
                  Logout
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-4">
                <img
                  src="/mentorque-logo.png.jpeg"
                  alt="MentorQue"
                  className="h-8 w-8 object-contain rounded-lg"
                />
                <nav className="flex items-center gap-1">
                  {/* User Links */}
                  {(user?.role === "USER" || user?.role === "ADMIN") && (
                    <>
                      <NavLink
                        to="/user"
                        className={({ isActive }) =>
                          `text-sm font-medium transition-smooth px-3 py-2 rounded-lg ${
                            isActive ? "text-blue-400 bg-blue-600/20" : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                          }`
                        }
                      >
                        My Availability
                      </NavLink>
                      <NavLink
                        to="/user/calls"
                        className={({ isActive }) =>
                          `text-sm font-medium transition-smooth px-3 py-2 rounded-lg ${
                            isActive ? "text-blue-400 bg-blue-600/20" : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                          }`
                        }
                      >
                        My Calls
                      </NavLink>
                    </>
                  )}
                  
                  {/* Mentor Links */}
                  {user?.role === "MENTOR" && (
                    <>
                      <NavLink
                        to="/mentor"
                        className={({ isActive }) =>
                          `text-sm font-medium transition-smooth px-3 py-2 rounded-lg ${
                            isActive ? "text-blue-400 bg-blue-600/20" : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                          }`
                        }
                      >
                        My Availability
                      </NavLink>
                      <NavLink
                        to="/mentor/calls"
                        className={({ isActive }) =>
                          `text-sm font-medium transition-smooth px-3 py-2 rounded-lg ${
                            isActive ? "text-blue-400 bg-blue-600/20" : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                          }`
                        }
                      >
                        My Calls
                      </NavLink>
                    </>
                  )}
                  
                  {/* Admin Links */}
                  {user?.role === "ADMIN" && (
                    <>
                      <NavLink
                        to="/admin"
                        className={({ isActive }) =>
                          `text-sm font-medium transition-smooth px-3 py-2 rounded-lg ${
                            isActive ? "text-blue-400 bg-blue-600/20" : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                          }`
                        }
                      >
                        Admin
                      </NavLink>
                      <NavLink
                        to="/admin/calls"
                        className={({ isActive }) =>
                          `text-sm font-medium transition-smooth px-3 py-2 rounded-lg ${
                            isActive ? "text-blue-400 bg-blue-600/20" : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                          }`
                        }
                      >
                        All Calls
                      </NavLink>
                    </>
                  )}
                </nav>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300 font-semibold">
                  {user?.role}
                </span>
                {email && (
                  <span className="text-slate-400 text-xs font-medium hidden sm:inline">
                    {email}
                  </span>
                )}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="text-sm text-slate-400 hover:text-slate-200 transition-smooth px-3 py-1.5 rounded-lg hover:bg-slate-800/50"
                >
                  Logout
                </button>
              </div>
            </>
          )}
        </div>
      </header>
      
      <main className="flex-1 w-full max-w-7xl mx-auto px-6 py-8">
        {children}
      </main>

      <footer className="border-t border-navy-700 bg-navy-900/50 mt-auto">
        <div className="w-full max-w-7xl mx-auto px-6 py-4 text-center text-xs text-slate-500">
          © 2026 Mentorque. All rights reserved.
        </div>
      </footer>
    </div>
  );
}