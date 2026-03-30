import { useState, useEffect } from "react";
import { FileText, Globe, Target, Calendar, Video, Inbox } from "lucide-react";
import * as meetingsApi from "../api/meetings";
import { TagBadge, LoadingState, EmptyState } from "./ui";

const CALL_TYPES = [
  {
    value: "RESUME_REVAMP",
    label: "Resume Revamp",
    icon: <FileText size={20} />,
  },
  {
    value: "JOB_MARKET_GUIDANCE",
    label: "Job Market Guidance",
    icon: <Globe size={20} />,
  },
  {
    value: "MOCK_INTERVIEW",
    label: "Mock Interview",
    icon: <Target size={20} />,
  },
];

export default function MyMeetingsTab({ role }) {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      try {
        const data = await meetingsApi.listMeetings();
        setMeetings(data);
      } catch (e) {
        setError(e.message || "Failed to load meetings");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6" style={{ background: '#F8F8F7' }}>
      <div className="max-w-6xl mx-auto w-full">
        <div className="text-heading mb-6" style={{ color: 'var(--color-text-primary)' }}>
          My Meetings
        </div>

        {error && (
          <div className="mb-4 text-red-600 bg-red-50 p-3 rounded-lg border border-red-200 text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <LoadingState message="Loading your meetings..." />
        ) : meetings.length === 0 ? (
          <div style={{ marginTop: '40px' }}>
            <EmptyState
              icon={<Inbox size={48} />}
              title="No meetings yet"
              description="Your scheduled mentoring sessions will appear here."
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {meetings.map((meeting) => {
              const callTypeData = CALL_TYPES.find(ct => ct.value === meeting.callType);
              const startTime = new Date(meeting.startTime);

              return (
                <div key={meeting.id} className="card flex flex-col justify-between" style={{ padding: '16px' }}>
                  <div>
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex gap-3">
                        <div className="flex items-center justify-center p-1">{callTypeData?.icon || <Calendar size={20} />}</div>
                        <div>
                          <div className="text-label" style={{ fontWeight: 600, marginBottom: '2px', color: 'var(--color-text-primary)', lineHeight: '1.4' }}>
                            {meeting.title}
                          </div>
                          <div className="text-mono" style={{ color: 'var(--color-text-secondary)', fontSize: '11px', marginTop: '4px' }}>
                            {startTime.toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit',
                            })}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-4">
                      <TagBadge variant="neutral">{callTypeData?.label || meeting.callType}</TagBadge>
                    </div>

                    <div className="space-y-1 mb-5">
                      <div className="text-mono" style={{ color: 'var(--color-text-tertiary)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                        Participants
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {meeting.participants?.map((p, i) => (
                          <span
                            key={i}
                            title={p.email}
                            className="text-mono px-2 py-1 rounded cursor-help transition-colors"
                            style={{ background: 'var(--color-border-light)', fontSize: '11px', color: 'var(--color-text-secondary)' }}
                          >
                            {p.name || p.email.split('@')[0]}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {meeting.meetLink && (
                    <a
                      href={meeting.meetLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-secondary w-full text-center py-2.5 transition active:scale-95"
                      style={{ fontSize: '13px', fontWeight: 600 }}
                    >
                      <Video size={14} className="inline mr-1" /> Join Meeting Space
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
