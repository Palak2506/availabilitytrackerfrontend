import { useCallback } from "react";
import { Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AvailabilityDashboard from "../components/AvailabilityDashboard";
import { Avatar } from "../components/ui";
import "../styles/design-system.css";

export default function UserAvailability() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = useCallback(() => {
    logout();
    navigate("/login");
  }, [logout, navigate]);

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--color-surface)' }}>
      {/* Sidebar */}
      <aside className="flex-shrink-0 flex flex-col" style={{ width: 'var(--sidebar-width)', background: 'var(--color-primary)' }}>
        <div className="p-5 pb-4" style={{ borderBottom: '0.5px solid rgba(255,255,255,0.08)' }}>
          <div className="text-heading" style={{ color: '#fff', fontWeight: 500, letterSpacing: '-0.02em' }}>
            MentorQue
          </div>
          <div className="text-mono" style={{ color: 'rgba(255,255,255,0.35)', fontSize: '10px', marginTop: '2px' }}>
            User portal
          </div>
        </div>

        <nav className="p-3 flex-1 overflow-y-auto">
          <div className="text-caption px-4 py-4" style={{ color: 'rgba(255,255,255,0.2)' }}>
            Menu
          </div>
          <button
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-label transition rounded-none"
            style={{
              background: 'rgba(99,102,241,0.25)',
              color: '#A5B4FC',
            }}
          >
            <svg className="w-4 h-4 opacity-70" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="2" y="3" width="12" height="11" rx="2"/>
              <path d="M5 2v2M11 2v2M2 7h12"/>
            </svg>
            My Availability
          </button>
        </nav>

        {/* User profile & Logout */}
        <div className="p-3" style={{ borderTop: '0.5px solid rgba(255,255,255,0.08)' }}>
          <div className="flex items-center gap-2.5 mb-2">
            <Avatar name={user?.name} email={user?.email} size="sm" color="gray" />
            <div className="flex-1 min-w-0">
              <div className="text-label" style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px' }}>
                {user?.name}
              </div>
              <div className="text-mono" style={{ color: 'rgba(255,255,255,0.3)', fontSize: '10px' }}>
                Mentee
              </div>
            </div>
          </div>
          <button
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-label rounded-lg transition"
            style={{
              background: 'rgba(255,255,255,0.05)',
              color: 'rgba(255,255,255,0.6)',
              border: '0.5px solid rgba(255,255,255,0.1)',
            }}
            onClick={handleLogout}
          >
            <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M9 2L7 4M7 4L9 6M7 4H12M12 14H4a2 2 0 01-2-2V4a2 2 0 012-2h3"/>
              <path d="M14 8l-3-3M14 8l-3 3M14 8H8"/>
            </svg>
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="h-[52px] flex items-center justify-between px-5" style={{
          background: 'var(--color-card)',
          borderBottom: '0.5px solid var(--color-border)'
        }}>
          <div className="text-label" style={{ fontWeight: 500, color: 'var(--color-text-primary)' }}>
            My Availability
          </div>
          <div className="flex items-center gap-2.5">
            <button className="w-8 h-8 rounded-lg flex items-center justify-center text-[14px]" style={{ background: 'var(--color-border-light)' }}>
              <Bell size={16} />
            </button>
          </div>
        </header>

        {/* Content area */}
        <div className="flex-1 overflow-hidden">
          <AvailabilityDashboard role="USER" />
        </div>
      </main>
    </div>
  );
}
