import { useState, useEffect } from "react";
import { FileText, Globe, Target, Inbox, Video } from "lucide-react";
import * as requestsApi from "../api/requests";
import * as adminApi from "../api/admin";
import * as meetingsApi from "../api/meetings";
import { TagBadge, Avatar, LoadingState, EmptyState, MatchScore } from "../components/ui";
import "../styles/design-system.css";

const CALL_TYPES = [
  { value: "RESUME_REVAMP", label: "Resume Revamp", icon: <FileText size={20} />, idealMentor: "Big-tech reviewers" },
  { value: "JOB_MARKET_GUIDANCE", label: "Job Market Guidance", icon: <Globe size={20} />, idealMentor: "Career coaches" },
  { value: "MOCK_INTERVIEW", label: "Mock Interview", icon: <Target size={20} />, idealMentor: "Domain experts" },
];

const STATUS_CONFIG = {
  PENDING: { label: "Pending", color: "var(--color-warning)", bg: "var(--color-warning-bg)" },
  MATCHED: { label: "Matched", color: "var(--color-accent)", bg: "var(--color-accent-dim)" },
  SCHEDULED: { label: "Scheduled", color: "var(--color-success)", bg: "var(--color-success-bg)" },
  COMPLETED: { label: "Completed", color: "var(--color-text-secondary)", bg: "var(--color-border-light)" },
  CANCELLED: { label: "Cancelled", color: "var(--color-text-tertiary)", bg: "var(--color-border-light)" },
};

export default function RequestsTab({ onFulfillRequest }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("PENDING");
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loadingRecs, setLoadingRecs] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadRequests();
  }, [filter]);

  async function loadRequests() {
    setLoading(true);
    setError("");
    try {
      console.log('[RequestsTab] Loading requests with filter:', filter);
      const data = await requestsApi.getAllRequests(filter);
      console.log('[RequestsTab] Loaded requests:', data);
      setRequests(data || []);
    } catch (e) {
      console.error('[RequestsTab] Error loading requests:', e);
      setError(e.message || "Failed to load requests");
    } finally {
      setLoading(false);
    }
  }

  async function handleSelectRequest(request) {
    setSelectedRequest(request);
    
    // Load mentor recommendations for this request
    if (request.user) {
      setLoadingRecs(true);
      try {
        const data = await adminApi.getRecommendations(request.user.id, request.callType);
        setRecommendations(data.recommendations || []);
      } catch (e) {
        setRecommendations([]);
      } finally {
        setLoadingRecs(false);
      }
    }
  }

  return (
    <div className="flex h-full overflow-hidden">
      {/* Requests List */}
      <div className="flex-shrink-0 border-r" style={{ 
        width: '384px', 
        borderColor: 'var(--color-border)', 
        overflowY: 'auto',
        height: '100%',
      }}>
        <div className="p-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
          <div className="text-heading mb-3" style={{ color: 'var(--color-text-primary)' }}>
            Mentoring Requests
          </div>
          
          {/* Filter Tabs */}
          <div className="flex gap-1">
            {["PENDING", "SCHEDULED", "COMPLETED"].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className="flex-1 px-2 py-1.5 rounded text-xs font-medium transition"
                style={{
                  background: filter === status ? 'var(--color-primary)' : 'transparent',
                  color: filter === status ? '#fff' : 'var(--color-text-secondary)',
                }}
              >
                {STATUS_CONFIG[status]?.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <LoadingState message="Loading requests..." />
        ) : requests.length === 0 ? (
          <EmptyState 
            icon={<Inbox size={48} />}
            title="No requests" 
            description={`No ${filter.toLowerCase()} requests`} 
          />
        ) : (
          <div className="p-2 space-y-2">
            {requests.map((request) => {
              const callTypeData = CALL_TYPES.find(ct => ct.value === request.callType);
              const statusConfig = STATUS_CONFIG[request.status];
              
              return (
                <div
                  key={request.id}
                  className="card cursor-pointer"
                  onClick={() => handleSelectRequest(request)}
                  style={{
                    padding: '12px',
                    borderColor: selectedRequest?.id === request.id ? 'var(--color-accent)' : 'var(--color-border)',
                    background: selectedRequest?.id === request.id ? 'var(--color-accent-dim)' : 'var(--color-card)',
                  }}
                >
                  <div className="flex items-start gap-2.5">
                    <Avatar name={request.user?.name} email={request.user?.email} size="sm" color="purple" />
                    <div className="flex-1 min-w-0">
                      <div className="text-label" style={{ fontWeight: 500, color: 'var(--color-text-primary)' }}>
                        {request.user?.name}
                      </div>
                      <div className="text-mono" style={{ color: 'var(--color-text-tertiary)', fontSize: '10px' }}>
                        {callTypeData?.icon} {callTypeData?.label}
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <span 
                          className="text-mono px-2 py-0.5 rounded-full"
                          style={{
                            background: statusConfig?.bg || 'var(--color-border-light)',
                            color: statusConfig?.color || 'var(--color-text-secondary)',
                            fontSize: '10px',
                          }}
                        >
                          {statusConfig?.label}
                        </span>
                        <span className="text-mono" style={{ color: 'var(--color-text-tertiary)', fontSize: '10px' }}>
                          {new Date(request.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Request Details & Fulfillment */}
      <div className="flex-1 overflow-y-auto p-6" style={{ height: '100%' }}>
        {!selectedRequest ? (
          <EmptyState
            icon="👈"
            title="Select a request"
            description="Choose a request from the list to view details and fulfill"
          />
        ) : (
          <div className="max-w-4xl" style={{ paddingBottom: '20px' }}>
            {/* Request Header */}
            <div className="card mb-4" style={{ padding: '16px' }}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex gap-3">
                  <Avatar 
                    name={selectedRequest.user?.name} 
                    email={selectedRequest.user?.email} 
                    size="lg" 
                    color="purple" 
                  />
                  <div>
                    <div className="text-heading" style={{ color: 'var(--color-text-primary)' }}>
                      {selectedRequest.user?.name}
                    </div>
                    <div className="text-mono" style={{ color: 'var(--color-text-secondary)', fontSize: '12px' }}>
                      {selectedRequest.user?.email}
                    </div>
                    <div className="flex gap-2 mt-2">
                      {selectedRequest.user?.tags?.slice(0, 3).map((tag, i) => (
                        <TagBadge key={i} variant={i === 0 ? 'tech' : 'neutral'}>{tag}</TagBadge>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div 
                    className="text-heading mb-1"
                    style={{ color: STATUS_CONFIG[selectedRequest.status]?.color || 'var(--color-text-primary)' }}
                  >
                    {STATUS_CONFIG[selectedRequest.status]?.label}
                  </div>
                  <div className="text-mono" style={{ color: 'var(--color-text-tertiary)', fontSize: '11px' }}>
                    Requested {new Date(selectedRequest.createdAt).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </div>
                </div>
              </div>

              {/* Request Details */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t" style={{ borderColor: 'var(--color-border-light)' }}>
                <div>
                  <div className="text-caption mb-1">Call Type</div>
                  <div className="text-label" style={{ color: 'var(--color-text-primary)' }}>
                    {CALL_TYPES.find(ct => ct.value === selectedRequest.callType)?.icon}{' '}
                    {CALL_TYPES.find(ct => ct.value === selectedRequest.callType)?.label}
                  </div>
                </div>
                {selectedRequest.notes && (
                  <div>
                    <div className="text-caption mb-1">Notes</div>
                    <div className="text-body" style={{ color: 'var(--color-text-secondary)' }}>
                      {selectedRequest.notes}
                    </div>
                  </div>
                )}
              </div>

              {selectedRequest.user?.description && (
                <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--color-border-light)' }}>
                  <div className="text-caption mb-1">User Description</div>
                  <div className="text-body" style={{ color: 'var(--color-text-secondary)' }}>
                    {selectedRequest.user.description}
                  </div>
                </div>
              )}
            </div>

            {/* AI Recommendations - Only show for PENDING or MATCHED requests */}
            {selectedRequest.status !== 'SCHEDULED' && selectedRequest.status !== 'COMPLETED' ? (
              <>
                <div className="text-heading mb-3" style={{ color: 'var(--color-text-primary)' }}>
                  AI Mentor Recommendations
                </div>
                <div className="text-body mb-4" style={{ color: 'var(--color-text-secondary)' }}>
                  Ranked by semantic match for {CALL_TYPES.find(ct => ct.value === selectedRequest.callType)?.label}
                </div>

                <div style={{ maxHeight: '400px', overflowY: 'auto', paddingRight: '8px', marginTop: '12px' }}>
                  {loadingRecs ? (
                    <LoadingState message="Analyzing mentor profiles..." />
                  ) : (
                    <div className="space-y-2">
                      {recommendations.map((mentor) => (
                        <div
                          key={mentor.id}
                          className="card cursor-pointer hover:border-accent transition-colors"
                          style={{ padding: '14px' }}
                          onClick={() => onFulfillRequest(selectedRequest, mentor)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex gap-2.5">
                              <Avatar name={mentor.name} email={mentor.email} size="md" color="green" />
                              <div>
                                <div className="text-label" style={{ fontWeight: 500, color: 'var(--color-text-primary)' }}>
                                  {mentor.name}
                                </div>
                                <div className="text-mono" style={{ color: 'var(--color-text-tertiary)', fontSize: '11px' }}>
                                  {mentor.description?.split('. ')[0] || 'Mentor'}
                                </div>
                                {mentor.tags && (
                                  <div className="flex gap-1 mt-2">
                                    {mentor.tags.slice(0, 3).map((tag, i) => (
                                      <TagBadge key={i} variant="tech">{tag}</TagBadge>
                                    ))}
                                  </div>
                                )}
                                {mentor.matchReason && (
                                  <div className="text-mono mt-2" style={{ color: 'var(--color-text-secondary)', fontSize: '11px' }}>
                                    {mentor.matchReason}
                                  </div>
                                )}
                              </div>
                            </div>
                            <MatchScore score={mentor.similarityScore || 0} />
                          </div>
                          <button
                            className="btn btn-primary mt-3"
                            style={{ fontSize: '12px', padding: '6px 12px' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              onFulfillRequest(selectedRequest, mentor);
                            }}
                          >
                            Select & Book Call
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              /* Show Meeting Details for Scheduled requests */
              <div className="mt-6 pt-6 border-t" style={{ borderColor: 'var(--color-border)' }}>
                <div className="text-heading mb-4" style={{ color: 'var(--color-text-primary)' }}>
                  Meeting Details
                </div>
                {selectedRequest.meeting ? (
                  <div className="card" style={{ padding: '20px', background: 'var(--color-success-bg)', border: '1px solid var(--color-success)' }}>
                    <div className="flex items-start gap-4">
                      <Avatar 
                        name={selectedRequest.meeting.mentor?.name} 
                        email={selectedRequest.meeting.mentor?.email} 
                        size="md" 
                        color="green" 
                      />
                      <div className="flex-1">
                        <div className="text-label" style={{ fontWeight: 500, color: 'var(--color-success-dark)', marginBottom: '4px' }}>
                          Mentor: {selectedRequest.meeting.mentor?.name || 'Assigned Mentor'}
                        </div>
                        <div className="text-mono" style={{ fontSize: '13px', color: 'var(--color-success-dark)', marginBottom: '12px' }}>
                          {new Date(selectedRequest.meeting.startTime).toLocaleString('en-US', {
                            weekday: 'long',
                            month: 'long',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                          })}
                        </div>
                        {selectedRequest.meeting.meetLink && (
                          <a
                            href={selectedRequest.meeting.meetLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-primary"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                          >
                            <Video size={14} className="inline mr-1" /> Join Meeting
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-body" style={{ color: 'var(--color-text-tertiary)' }}>
                    No meeting details found for this request.
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
