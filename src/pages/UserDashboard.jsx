import { useState, useEffect, useCallback } from "react";
import { FileText, Globe, Target, Bell, Calendar, Video, CheckCircle, Check, X, Inbox } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import * as requestsApi from "../api/requests";
import * as meetingsApi from "../api/meetings";
import { TagBadge, Avatar, LoadingState, EmptyState } from "../components/ui";
import AvailabilityDashboard from "../components/AvailabilityDashboard";
import MyMeetingsTab from "../components/MyMeetingsTab";
import "../styles/design-system.css";

const CALL_TYPES = [
  {
    value: "RESUME_REVAMP",
    label: "Resume Revamp",
    description: "Get your resume reviewed by big tech mentors",
    icon: <FileText size={20} />,
    color: "blue",
  },
  {
    value: "JOB_MARKET_GUIDANCE",
    label: "Job Market Guidance",
    description: "Understand the job market and get career advice",
    icon: <Globe size={20} />,
    color: "green",
  },
  {
    value: "MOCK_INTERVIEW",
    label: "Mock Interview",
    description: "Practice interviews with domain experts",
    icon: <Target size={20} />,
    color: "purple",
  },
];

const STATUS_CONFIG = {
  PENDING: { label: "Pending", color: "var(--color-warning)", bg: "var(--color-warning-bg)" },
  MATCHED: { label: "Matched", color: "var(--color-accent)", bg: "var(--color-accent-dim)" },
  SCHEDULED: { label: "Scheduled", color: "var(--color-success)", bg: "var(--color-success-bg)" },
  COMPLETED: { label: "Completed", color: "var(--color-text-secondary)", bg: "var(--color-border-light)" },
  CANCELLED: { label: "Cancelled", color: "var(--color-text-tertiary)", bg: "var(--color-border-light)" },
};

export default function UserDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("requests");
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Request form state
  const [selectedCallType, setSelectedCallType] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleLogout = useCallback(() => {
    logout();
    navigate("/login");
  }, [logout, navigate]);

  // Load requests
  useEffect(() => {
    loadRequests();
  }, []);

  async function loadRequests() {
    setLoading(true);
    setError("");
    try {
      const data = await requestsApi.getMyRequests();
      setRequests(data || []);
    } catch (e) {
      setError(e.message || "Failed to load requests");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmitRequest() {
    if (!selectedCallType) {
      setError("Please select a call type");
      return;
    }

    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      await requestsApi.createRequest(selectedCallType, notes);
      setSuccess("Request submitted successfully! Admin will review and match you with a mentor.");
      setSelectedCallType("");
      setNotes("");
      await loadRequests();

      setTimeout(() => setSuccess(""), 3000);
    } catch (e) {
      setError(e.message || "Failed to submit request");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCancelRequest(requestId) {
    if (!confirm("Are you sure you want to cancel this request?")) return;

    try {
      await requestsApi.cancelRequest(requestId);
      setSuccess("Request cancelled");
      await loadRequests();
      setTimeout(() => setSuccess(""), 3000);
    } catch (e) {
      setError(e.message || "Failed to cancel request");
    }
  }

  return (
    <div className="h-screen flex overflow-hidden w-full" style={{ background: 'var(--color-surface)' }}>
      {/* Sidebar */}
      <aside
        className="flex-shrink-0 flex flex-col"
        style={{
          width: 'var(--sidebar-width)',
          background: 'var(--color-primary)',
          height: '100vh',
          position: 'sticky',
          top: 0,
          overflow: 'hidden',
        }}
      >
        {/* Logo */}
        <div className="p-5 pb-4 flex-shrink-0" style={{ borderBottom: '0.5px solid rgba(255,255,255,0.08)' }}>
          <div className="text-heading" style={{ color: '#fff', fontWeight: 500, letterSpacing: '-0.02em' }}>
            MentorQue
          </div>
          <div className="text-mono" style={{ color: 'rgba(255,255,255,0.35)', fontSize: '10px', marginTop: '2px' }}>
            User portal
          </div>
        </div>

        {/* Nav links — scrollable if content grows */}
        <nav className="p-3 flex-1 overflow-y-auto">
          <div className="text-caption px-4 py-4" style={{ color: 'rgba(255,255,255,0.2)' }}>
            Menu
          </div>
          <button
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-label transition rounded-none"
            style={{
              background: activeTab === "meetings" ? 'rgba(99,102,241,0.25)' : 'transparent',
              color: activeTab === "meetings" ? '#A5B4FC' : 'rgba(255,255,255,0.5)',
            }}
            onClick={() => setActiveTab("meetings")}
          >
            <svg className="w-4 h-4 opacity-70" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="8" cy="8" r="6"/>
              <path d="M8 5v3l2 2"/>
            </svg>
            My Meetings
          </button>
          <button
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-label transition rounded-none"
            style={{
              background: activeTab === "requests" ? 'rgba(99,102,241,0.25)' : 'transparent',
              color: activeTab === "requests" ? '#A5B4FC' : 'rgba(255,255,255,0.5)',
            }}
            onClick={() => setActiveTab("requests")}
          >
            <svg className="w-4 h-4 opacity-70" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
              <rect x="2" y="2" width="6" height="6" rx="1" />
            </svg>
            My Requests
          </button>
          <button
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-label transition rounded-none"
            style={{
              background: activeTab === "availability" ? 'rgba(99,102,241,0.25)' : 'transparent',
              color: activeTab === "availability" ? '#A5B4FC' : 'rgba(255,255,255,0.5)',
            }}
            onClick={() => setActiveTab("availability")}
          >
            <svg className="w-4 h-4 opacity-70" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="2" y="3" width="12" height="11" rx="2" />
              <path d="M5 2v2M11 2v2M2 7h12" />
            </svg>
            Availability
          </button>
        </nav>

        {/* User profile & Logout — always pinned at the bottom */}
        <div
          className="flex-shrink-0 p-3"
          style={{ borderTop: '0.5px solid rgba(255,255,255,0.08)' }}
        >
          <div 
            className="flex items-center gap-2.5 mb-2 cursor-pointer p-2 -mx-2 -mt-2 rounded-lg hover:bg-white/5 transition" 
            style={{ minWidth: 0 }}
            onClick={() => setActiveTab("profile")}
          >
            <Avatar name={user?.name} email={user?.email} size="sm" color="gray" />
            <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
              <div
                className="text-label"
                style={{
                  color: 'rgba(255,255,255,0.8)',
                  fontSize: '12px',
                  fontWeight: 500,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {user?.name}
              </div>
              <div
                className="text-mono"
                style={{ color: 'rgba(255,255,255,0.35)', fontSize: '10px', marginTop: '1px' }}
              >
                {user?.email}
              </div>
            </div>
          </div>
          <button
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-label rounded-lg transition"
            style={{
              background: 'rgba(255,255,255,0.06)',
              color: 'rgba(255,255,255,0.6)',
              border: '0.5px solid rgba(255,255,255,0.12)',
              fontSize: '12px',
            }}
            onClick={handleLogout}
          >
            <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M6 2H3a1 1 0 00-1 1v10a1 1 0 001 1h3" />
              <path d="M11 11l3-3-3-3" />
              <path d="M14 8H6" />
            </svg>
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        {(activeTab === "requests" || activeTab === "meetings") && (
          <header className="h-[52px] flex items-center justify-between px-5 shrink-0" style={{
            background: 'var(--color-card)',
            borderBottom: '0.5px solid var(--color-border)'
          }}>
            <div className="text-label" style={{ fontWeight: 500, color: 'var(--color-text-primary)' }}>
              {activeTab === "requests" ? "My Mentoring Requests" : "My Meetings"}
            </div>
            <div className="flex items-center gap-2.5">
              <button className="w-8 h-8 rounded-lg flex items-center justify-center text-[14px]" style={{ background: 'var(--color-border-light)' }}>
                <Bell size={16} />
              </button>
            </div>
          </header>
        )}

        {/* Content area */}
        <div className={`flex-1 ${activeTab === "requests" ? "overflow-y-auto p-4" : "flex flex-col overflow-hidden"}`}>
          {activeTab === "requests" ? (
            <div className="max-w-4xl mx-auto w-full">
              {/* Request Form */}
              <div className="card mb-4" style={{ padding: '16px' }}>
                <div className="text-heading mb-3" style={{ color: 'var(--color-text-primary)' }}>
                  Request a Mentoring Call
                </div>
                <div className="text-body mb-4" style={{ color: 'var(--color-text-secondary)' }}>
                  Select the type of call you need and we'll match you with the best mentor.
                </div>

                {/* Call Type Selection */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                  {CALL_TYPES.map((ct) => (
                    <div
                      key={ct.value}
                      className="card cursor-pointer"
                      onClick={() => setSelectedCallType(ct.value)}
                      style={{
                        padding: '12px',
                        borderColor: selectedCallType === ct.value ? 'var(--color-accent)' : 'var(--color-border)',
                        background: selectedCallType === ct.value ? 'var(--color-accent-dim)' : 'var(--color-card)',
                      }}
                    >
                      <div style={{ fontSize: '20px', marginBottom: '6px' }}>{ct.icon}</div>
                      <div
                        className="text-label"
                        style={{
                          color: selectedCallType === ct.value ? 'var(--tag-tech-text)' : 'var(--color-text-primary)',
                          fontWeight: 500,
                          marginBottom: '4px',
                        }}
                      >
                        {ct.label}
                      </div>
                      <div
                        className="text-mono"
                        style={{
                          color: selectedCallType === ct.value ? 'var(--tag-tech-text)' : 'var(--color-text-secondary)',
                          fontSize: '11px',
                        }}
                      >
                        {ct.description}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Notes */}
                <div className="mb-4">
                  <label className="text-label mb-2 block" style={{ color: 'var(--color-text-primary)' }}>
                    Additional Notes (optional)
                  </label>
                  <textarea
                    className="input w-full"
                    placeholder="Tell us what specific help you need..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    style={{ resize: 'vertical' }}
                  />
                </div>

                {/* Submit Button */}
                <button
                  className="btn btn-primary w-full"
                  onClick={handleSubmitRequest}
                  disabled={submitting || !selectedCallType}
                  style={{ padding: '10px' }}
                >
                  {submitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>

              {/* My Requests List */}
              <div className="card" style={{ padding: '16px' }}>
                <div className="text-heading mb-4" style={{ color: 'var(--color-text-primary)' }}>
                  My Requests
                </div>

                {loading ? (
                  <LoadingState message="Loading your requests..." />
                ) : requests.length === 0 ? (
                  <EmptyState
                    icon={<Inbox size={48} />}
                    title="No requests yet"
                    description="Submit your first mentoring call request above"
                  />
                ) : (
                  <div className="space-y-2">
                    {requests.map((request) => {
                      const callTypeData = CALL_TYPES.find(ct => ct.value === request.callType);
                      const statusConfig = STATUS_CONFIG[request.status];

                      return (
                        <div
                          key={request.id}
                          className="card"
                          style={{ padding: '14px' }}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex gap-3">
                              <div className="flex items-center justify-center p-1">{callTypeData?.icon || <Calendar size={20} />}</div>
                              <div>
                                <div
                                  className="text-label"
                                  style={{ fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: '4px' }}
                                >
                                  {callTypeData?.label || request.callType}
                                </div>
                                <div
                                  className="text-mono"
                                  style={{ color: 'var(--color-text-secondary)', fontSize: '11px', marginBottom: '6px' }}
                                >
                                  Requested on {new Date(request.createdAt).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                  })}
                                </div>

                                {/* Status Badge */}
                                <span
                                  className="text-mono px-2.5 py-1 rounded-full"
                                  style={{
                                    background: statusConfig?.bg || 'var(--color-border-light)',
                                    color: statusConfig?.color || 'var(--color-text-secondary)',
                                    fontSize: '11px',
                                    fontWeight: 500,
                                  }}
                                >
                                  {statusConfig?.label || request.status}
                                </span>

                                {/* Notes */}
                                {request.notes && (
                                  <div
                                    className="text-mono mt-3 p-2 rounded"
                                    style={{
                                      background: 'var(--color-surface)',
                                      fontSize: '11px',
                                      color: 'var(--color-text-secondary)',
                                    }}
                                  >
                                    <strong>Notes:</strong> {request.notes}
                                  </div>
                                )}

                                {/* Meeting Info */}
                                {request.meeting && (
                                  <div
                                    className="mt-3 p-3 rounded"
                                    style={{
                                      background: 'var(--color-success-bg)',
                                      border: '1px solid var(--color-success)',
                                    }}
                                  >
                                    <div className="text-label" style={{ color: 'var(--color-success-dark)', marginBottom: '4px' }}>
                                      <div className="flex items-center gap-1"><CheckCircle size={14} /> Meeting Scheduled</div>
                                    </div>
                                    <div className="text-mono" style={{ fontSize: '11px', color: 'var(--color-success-dark)' }}>
                                      {new Date(request.meeting.startTime).toLocaleString('en-US', {
                                        weekday: 'short',
                                        month: 'short',
                                        day: 'numeric',
                                        hour: 'numeric',
                                        minute: '2-digit',
                                      })}
                                    </div>
                                    {request.meeting.meetLink && (
                                      <a
                                        href={request.meeting.meetLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="btn btn-secondary mt-2"
                                        style={{ fontSize: '11px', padding: '4px 8px' }}
                                      >
                                        <Video size={14} className="inline mr-1" /> Join Meeting
                                      </a>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Cancel Button */}
                            {request.status === 'PENDING' && (
                              <button
                                className="btn btn-ghost"
                                onClick={() => handleCancelRequest(request.id)}
                                style={{ fontSize: '12px', color: 'var(--color-text-tertiary)' }}
                              >
                                Cancel
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : activeTab === "meetings" ? (
            <MyMeetingsTab role="USER" />
          ) : (
            /* Availability & Profile Tabs - Reuse existing component */
            <div className="flex-1 flex flex-col overflow-hidden">
              <AvailabilityDashboard role="USER" forcedTab={activeTab === "profile" ? "profile" : "availability"} />
            </div>
          )}
        </div>

        {/* Success/Error toasts */}
        {(success || error) && (
          <div className="fixed bottom-4 right-4 z-50">
            {success && (
              <div className="p-3 rounded-lg mb-2" style={{
                background: 'var(--color-success-bg)',
                border: '1px solid var(--color-success)',
                color: 'var(--color-success-dark)',
              }}>
                <div className="text-label"><Check size={14} className="inline mr-1" /> {success}</div>
              </div>
            )}
            {error && (
              <div className="p-3 rounded-lg" style={{
                background: 'var(--color-danger-bg)',
                border: '1px solid var(--color-danger)',
                color: 'var(--color-danger-dark)',
              }}>
                <div className="text-label"><X size={14} className="inline mr-1" /> {error}</div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
