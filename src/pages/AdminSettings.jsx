import { useState, useEffect } from "react";
import { Check, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function AdminSettings() {
  const { user, refreshUser } = useAuth();
  const [status, setStatus] = useState("");
  const [statusType, setStatusType] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const google = params.get("google");
    const err = params.get("error");
    if (google === "connected") {
      setStatus("Google Calendar connected successfully.");
      setStatusType("success");
      refreshUser();
      window.history.replaceState({}, "", "/admin/settings");
    } else if (err) {
      setStatus(`Error: ${err}`);
      setStatusType("error");
      window.history.replaceState({}, "", "/admin/settings");
    }
  }, [refreshUser]);

  return (
    <div className="max-w-3xl">
      <div className="mb-5">
        <div className="text-heading mb-1" style={{ color: 'var(--color-text-primary)' }}>
          Settings
        </div>
        <div className="text-body" style={{ color: 'var(--color-text-secondary)' }}>
          Manage your admin preferences and integrations.
        </div>
      </div>

      {/* Feedback banners */}
      {status && (
        <div className="mb-4 p-3 rounded-lg" style={{
          background: statusType === 'success' ? 'var(--color-success-bg)' : 'var(--color-danger-bg)',
          border: statusType === 'success' ? '0.5px solid var(--color-success)' : '0.5px solid var(--color-danger)',
          color: statusType === 'success' ? 'var(--color-success-dark)' : 'var(--color-danger-dark)',
        }}>
          {statusType === 'success' ? <Check size={14} className="inline mb-0.5" /> : <X size={14} className="inline mb-0.5" />} {status}
        </div>
      )}

      {/* Google Calendar Card */}
      <div className="rounded-xl p-5 mb-4" style={{
        background: 'var(--color-card)',
        border: '0.5px solid var(--color-border)',
      }}>
        <div className="flex items-center gap-3 mb-3">
          <div style={{
            width: '40px', height: '40px', borderRadius: '10px',
            background: 'linear-gradient(135deg, #4285F4 0%, #34A853 50%, #FBBC05 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
              <path d="M20 4h-3V2h-2v2H9V2H7v2H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H4V10h16v10zm0-12H4V6h16v2z"/>
            </svg>
          </div>
          <div>
            <div className="text-heading" style={{ color: 'var(--color-text-primary)', marginBottom: '2px' }}>
              Google Calendar
            </div>
            <div className="text-mono" style={{ color: 'var(--color-text-tertiary)', fontSize: '11px' }}>
              Calendar integration for meetings
            </div>
          </div>
        </div>

        <p className="text-body mb-4" style={{ color: 'var(--color-text-secondary)', fontSize: '13px', lineHeight: '1.6' }}>
          Connect your Google account to create calendar events and generate Meet links when scheduling meetings.
        </p>

        {user?.hasGoogleConnected ? (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: 'var(--color-success-bg)', border: '0.5px solid var(--color-success)' }}>
              <div className="w-2 h-2 rounded-full" style={{ background: 'var(--color-success)' }}></div>
              <span className="text-label" style={{ color: 'var(--color-success-dark)', fontSize: '12px' }}>
                Connected
              </span>
            </div>
            <button
              type="button"
              disabled
              className="btn btn-secondary"
              style={{ fontSize: '13px', padding: '7px 16px', opacity: 0.5 }}
            >
              Disconnect Google
            </button>
          </div>
        ) : (
          <button
            type="button"
            disabled
            className="btn btn-primary"
            style={{ fontSize: '13px', padding: '7px 16px', opacity: 0.5 }}
          >
            Connect Google Calendar
          </button>
        )}
        
        <p className="text-mono mt-3" style={{ color: 'var(--color-text-tertiary)', fontSize: '11px' }}>
          This feature is coming soon. Check back later!
        </p>
      </div>

      {/* User Info Card */}
      <div className="rounded-xl p-5" style={{
        background: 'var(--color-card)',
        border: '0.5px solid var(--color-border)',
      }}>
        <div className="text-heading mb-3" style={{ color: 'var(--color-text-primary)', fontSize: '14px' }}>
          Current User
        </div>
        <div className="flex items-center gap-3">
          <div style={{
            width: '40px', height: '40px', borderRadius: '50%',
            background: 'var(--tag-tech-bg)', color: 'var(--tag-tech-text)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '14px', fontWeight: 500,
          }}>
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div>
            <div className="text-label" style={{ color: 'var(--color-text-primary)' }}>
              {user?.name || 'Unknown'}
            </div>
            <div className="text-mono" style={{ color: 'var(--color-text-tertiary)', fontSize: '11px' }}>
              {user?.email || 'No email'}
            </div>
          </div>
          <div className="ml-auto">
            <span className="text-mono px-2.5 py-1 rounded-full" style={{ 
              fontSize: '10px', 
              background: user?.role === 'ADMIN' ? 'var(--tag-tech-bg)' : 'var(--tag-neutral-bg)',
              color: user?.role === 'ADMIN' ? 'var(--tag-tech-text)' : 'var(--tag-neutral-text)',
            }}>
              {user?.role || 'USER'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
