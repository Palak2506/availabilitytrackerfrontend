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
      <header className="border-b border-navy-700 bg-navy-900/80 backdrop-blur">
        <div className="w-full px-4 h-14 flex items-center justify-between">
          {/* Admin Header */}
          {isAdminRoute && user?.role === "ADMIN" ? (
            <>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <img
                    src="/mentorque-logo.png.jpeg"
                    alt="MentorQue"
                    className="h-8 w-8 object-contain"
                  />
                  <span className="text-white font-medium">
                    Mentorque Availability Tracker
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs px-2 py-0.5 rounded bg-blue-700 text-slate-200 font-semibold">ADMIN</span>
                {email && (
                  <span className="text-slate-400 text-sm">
                    {email}
                  </span>
                )}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="text-sm text-slate-400 hover:text-slate-200 transition"
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
                  className="h-8 w-8 object-contain"
                />
                <nav className="flex items-center gap-6">
                  {/* User Links */}
                  {(user?.role === "USER" || user?.role === "ADMIN") && (
                    <>
                      <NavLink
                        to="/user"
                        className={({ isActive }) =>
                          `text-sm font-medium transition ${
                            isActive ? "text-primary-400" : "text-slate-400 hover:text-slate-200"
                          }`
                        }
                      >
                        My Availability
                      </NavLink>
                      <NavLink
                        to="/user/calls"
                        className={({ isActive }) =>
                          `text-sm font-medium transition ${
                            isActive ? "text-primary-400" : "text-slate-400 hover:text-slate-200"
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
                          `text-sm font-medium transition ${
                            isActive ? "text-primary-400" : "text-slate-400 hover:text-slate-200"
                          }`
                        }
                      >
                        My Availability
                      </NavLink>
                      <NavLink
                        to="/mentor/calls"
                        className={({ isActive }) =>
                          `text-sm font-medium transition ${
                            isActive ? "text-primary-400" : "text-slate-400 hover:text-slate-200"
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
                          `text-sm font-medium transition ${
                            isActive ? "text-primary-400" : "text-slate-400 hover:text-slate-200"
                          }`
                        }
                      >
                        Admin
                      </NavLink>
                      <NavLink
                        to="/admin/calls"
                        className={({ isActive }) =>
                          `text-sm font-medium transition ${
                            isActive ? "text-primary-400" : "text-slate-400 hover:text-slate-200"
                          }`
                        }
                      >
                        All Calls
                      </NavLink>
                    </>
                  )}
                </nav>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs px-2 py-0.5 rounded bg-navy-700 text-slate-300">
                  {user?.role}
                </span>
                {email && (
                  <span className="text-slate-400 text-sm">
                    {email}
                  </span>
                )}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="text-sm text-slate-400 hover:text-slate-200 transition"
                >
                  Logout
                </button>
              </div>
            </>
          )}
        </div>
      </header>
      <main className="flex-1 w-full px-4 py-8">
        {children}
      </main>
    </div>
  );
}