import { useState, useEffect, useMemo, useCallback } from "react";
import { FileText, Globe, Target, Bell, Calendar, Video, Check, X, Inbox } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import * as adminApi from "../api/admin";
import * as meetingsApi from "../api/meetings";
import { formatTimeWithTimezone } from "../utils/time";
import "../styles/design-system.css";
import {
  TagBadge,
  Avatar,
  MatchScore,
  TimeSlot,
  UserChip,
  CallTypeCard,
  StepWizard,
  MentorCard,
  LoadingState,
  EmptyState,
} from "../components/ui";
import RequestsTab from "../components/RequestsTab";

const CALL_TYPES = [
  {
    value: "RESUME_REVAMP",
    label: "Resume Revamp",
    description: "Get your resume reviewed",
    idealMentor: "Big-tech reviewers",
    icon: <FileText size={20} />,
  },
  {
    value: "JOB_MARKET_GUIDANCE",
    label: "Job Market Guidance",
    description: "Understand the job market",
    idealMentor: "Career coaches",
    icon: <Globe size={20} />,
  },
  {
    value: "MOCK_INTERVIEW",
    label: "Mock Interview",
    description: "Practice interviews",
    idealMentor: "Domain experts",
    icon: <Target size={20} />,
  },
];

const USER_TAG_OPTIONS = [
  { value: "tech", label: "Tech" },
  { value: "non-tech", label: "Non-Tech" },
  { value: "backend", label: "Backend" },
  { value: "frontend", label: "Frontend" },
  { value: "fullstack", label: "Fullstack" },
  { value: "asks-questions", label: "Asks Questions" },
  { value: "proactive", label: "Proactive" },
  { value: "needs-guidance", label: "Needs Guidance" },
];

function getInitials(name) {
  if (!name) return "?";
  return name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
}

const AV_COLORS = [
  { bg: "#EEF2FF", color: "#4338CA" },
  { bg: "#ECFDF5", color: "#065F46" },
  { bg: "#FFF7ED", color: "#9A3412" },
];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("schedule");

  // Data
  const [users, setUsers] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [meetings, setMeetings] = useState([]);

  // Selection state
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedCallType, setSelectedCallType] = useState("");
  const [selectedMentor, setSelectedMentor] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedRequestId, setSelectedRequestId] = useState(null);

  // Recommendations & overlap
  const [recommendations, setRecommendations] = useState([]);
  const [overlapSlots, setOverlapSlots] = useState([]);

  // UI state
  const [userSearch, setUserSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingRecs, setLoadingRecs] = useState(false);
  const [loadingOverlap, setLoadingOverlap] = useState(false);
  const [loadingMeetings, setLoadingMeetings] = useState(false);
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // User editing state
  const [selectedUserForEdit, setSelectedUserForEdit] = useState(null);
  const [editTags, setEditTags] = useState([]);
  const [editDescription, setEditDescription] = useState("");
  const [savingUser, setSavingUser] = useState(false);

  const handleLogout = useCallback(() => {
    logout();
    navigate("/login");
  }, [logout, navigate]);

  // Load initial data
  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [usersData, mentorsData] = await Promise.all([
          adminApi.listUsers(),
          adminApi.listMentors(),
        ]);
        setUsers(usersData);
        setMentors(mentorsData);
      } catch (e) {
        setError(e.message || "Failed to load data");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Load meetings when on meetings tab
  useEffect(() => {
    if (activeTab === "meetings") {
      loadMeetings();
    }
  }, [activeTab]);

  // Load recommendations
  useEffect(() => {
    if (selectedUser && selectedCallType) {
      loadRecommendations();
    }
  }, [selectedUser, selectedCallType]);

  // Load overlap - clear previous slots when mentor changes
  useEffect(() => {
    if (selectedUser && selectedMentor) {
      loadOverlap();
    } else {
      setOverlapSlots([]);
      setSelectedSlot(null);
    }
  }, [selectedUser, selectedMentor]);

  async function loadMeetings() {
    setLoadingMeetings(true);
    try {
      const data = await meetingsApi.listMeetings();
      setMeetings(data);
    } catch (e) {
      setError(e.message || "Failed to load meetings");
    } finally {
      setLoadingMeetings(false);
    }
  }

  async function loadRecommendations() {
    setLoadingRecs(true);
    setError("");
    try {
      const data = await adminApi.getRecommendations(selectedUser.id, selectedCallType);
      setRecommendations(data.recommendations || []);
      if (data.recommendations?.length > 0) {
        setSelectedMentor(data.recommendations[0]);
      }
    } catch (e) {
      setError(e.message || "Failed to load recommendations");
      setRecommendations([]);
    } finally {
      setLoadingRecs(false);
    }
  }

  async function loadOverlap() {
    setLoadingOverlap(true);
    setError("");
    try {
      const today = new Date();
      const weekStart = today.toISOString().slice(0, 10);
      const data = await adminApi.getAvailabilityOverlap(
        selectedUser.id,
        selectedMentor.id,
        weekStart
      );
      setOverlapSlots(data.overlappingSlots || []);
      if (data.overlappingSlots?.length > 0) {
        setSelectedSlot(data.overlappingSlots[0]);
      }
    } catch (e) {
      setOverlapSlots([]);
    } finally {
      setLoadingOverlap(false);
    }
  }

  async function handleBookCall() {
    if (!selectedSlot || !selectedMentor || !selectedUser) return;

    setBooking(true);
    setError("");
    setSuccess("");

    try {
      const callTypeData = CALL_TYPES.find(ct => ct.value === selectedCallType);
      const startTime = new Date(selectedSlot.startTime);
      const endTime = new Date(selectedSlot.endTime);

      await meetingsApi.scheduleMeeting({
        title: `${callTypeData?.label || "Mentoring Call"} - ${selectedUser.name}`,
        callType: selectedCallType,
        userId: selectedUser.id,
        mentorId: selectedMentor.id,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        timezone: "UTC",
        requestId: selectedRequestId,
      });

      setSuccess("Call booked successfully! Meeting link will be sent via email.");

      setTimeout(() => {
        setSelectedUser(null);
        setSelectedCallType("");
        setSelectedMentor(null);
        setSelectedSlot(null);
        setSelectedRequestId(null);
        setOverlapSlots([]);
        setRecommendations([]);
        setSuccess("");
      }, 2000);
    } catch (e) {
      setError(e.message || "Failed to book call");
    } finally {
      setBooking(false);
    }
  }

  // User management handlers
  const handleSelectUserForEdit = useCallback((user) => {
    setSelectedUserForEdit(user);
    setEditTags(user.tags || []);
    setEditDescription(user.description || "");
    setError("");
    setSuccess("");
  }, []);

  const handleToggleUserTag = useCallback((tagValue) => {
    setEditTags(prev =>
      prev.includes(tagValue) ? prev.filter(t => t !== tagValue) : [...prev, tagValue]
    );
  }, []);

  const handleSaveUser = useCallback(async () => {
    if (!selectedUserForEdit) return;
    setSavingUser(true);
    setError("");
    setSuccess("");
    try {
      const updated = await adminApi.updateUserMetadata(selectedUserForEdit.id, {
        tags: editTags,
        description: editDescription,
      });
      setSuccess("User updated successfully!");
      setUsers(users.map(u => u.id === updated.user.id ? updated.user : u));
      if (selectedUser?.id === updated.user.id) {
        setSelectedUser(updated.user);
      }
      setSelectedUserForEdit(updated.user);
    } catch (e) {
      setError(e.message || "Failed to update user");
    } finally {
      setSavingUser(false);
    }
  }, [selectedUserForEdit, editTags, editDescription, users, selectedUser]);

  // Filter users
  const filteredUsers = useMemo(() => {
    if (!userSearch) return users;
    const search = userSearch.toLowerCase();
    return users.filter(u =>
      u.name.toLowerCase().includes(search) ||
      u.email.toLowerCase().includes(search)
    );
  }, [users, userSearch]);

  // Filter mentors
  const filteredMentors = useMemo(() => {
    const source = recommendations.length ? recommendations : mentors;
    if (!userSearch) return source;
    const search = userSearch.toLowerCase();
    return source.filter(m =>
      m.name.toLowerCase().includes(search) ||
      m.email.toLowerCase().includes(search) ||
      (m.tags && m.tags.some(t => t.toLowerCase().includes(search)))
    );
  }, [mentors, recommendations, userSearch]);

  // Step wizard configuration
  const steps = [
    {
      id: "user",
      label: "Select user",
      content: selectedUser && (
        <UserChip
          user={selectedUser}
          onRemove={() => {
            setSelectedUser(null);
            setSelectedCallType("");
            setSelectedMentor(null);
            setSelectedRequestId(null);
          }}
        />
      ),
    },
    {
      id: "callType",
      label: "Choose call type",
      content: selectedCallType && (
        <div className="flex items-center gap-2 p-2 rounded-lg border" style={{ borderColor: 'var(--color-accent)', background: 'var(--color-accent-dim)' }}>
          <span style={{ fontSize: '16px' }}>
            {CALL_TYPES.find(ct => ct.value === selectedCallType)?.icon}
          </span>
          <span className="text-label" style={{ color: 'var(--tag-tech-text)', fontWeight: 500 }}>
            {CALL_TYPES.find(ct => ct.value === selectedCallType)?.label}
          </span>
        </div>
      ),
    },
    {
      id: "mentor",
      label: "Pick mentor",
      content: recommendations.length > 0 && (
        <div className="text-mono" style={{ color: 'var(--color-text-tertiary)', fontSize: '11px' }}>
          {recommendations.length} AI matches found
        </div>
      ),
    },
    {
      id: "book",
      label: "Confirm & book",
      content: selectedSlot && (
        <div className="text-mono" style={{ color: 'var(--color-success)', fontSize: '11px' }}>
          Ready to book
        </div>
      ),
    },
  ];

  const currentStep = [
    !selectedUser ? 0 :
    !selectedCallType ? 1 :
    !selectedMentor ? 2 : 3
  ][0];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-surface)' }}>
        <LoadingState message="Loading dashboard..." />
      </div>
    );
  }

  return (
    <div className="flex" style={{ background: 'var(--color-surface)', height: '100vh', overflow: 'hidden' }}>
      {/* Sidebar */}
      <aside className="flex-shrink-0 flex flex-col" style={{ width: 'var(--sidebar-width)', background: 'var(--color-primary)', height: '100vh' }}>
        {/* Logo */}
        <div className="p-5 pb-4" style={{ borderBottom: '0.5px solid rgba(255,255,255,0.08)' }}>
          <div className="text-heading" style={{ color: '#fff', fontWeight: 500, letterSpacing: '-0.02em' }}>
            MentorQue
          </div>
          <div className="text-mono" style={{ color: 'rgba(255,255,255,0.35)', fontSize: '10px', marginTop: '2px' }}>
            Admin console
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-3 flex-1 overflow-y-auto">
          <div className="text-caption px-4 py-4" style={{ color: 'rgba(255,255,255,0.2)' }}>
            Scheduling
          </div>
          <button
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-label transition rounded-none"
            style={{
              background: activeTab === "schedule" ? 'rgba(99,102,241,0.25)' : 'transparent',
              color: activeTab === "schedule" ? '#A5B4FC' : 'rgba(255,255,255,0.5)',
            }}
            onClick={() => setActiveTab("schedule")}
          >
            <svg className="w-4 h-4 opacity-70" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="2" y="3" width="12" height="11" rx="2"/>
              <path d="M5 2v2M11 2v2M2 7h12"/>
            </svg>
            Book session
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
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
              <rect x="2" y="2" width="6" height="6" rx="1"/>
            </svg>
            Requests
          </button>
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
            Meetings
          </button>
          <div className="text-caption px-4 py-4" style={{ color: 'rgba(255,255,255,0.2)' }}>
            People
          </div>
          <button
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-label transition rounded-none"
            style={{
              background: activeTab === "users" ? 'rgba(99,102,241,0.25)' : 'transparent',
              color: activeTab === "users" ? '#A5B4FC' : 'rgba(255,255,255,0.5)',
            }}
            onClick={() => setActiveTab("users")}
          >
            <svg className="w-4 h-4 opacity-70" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M10 7a3 3 0 11-6 0 3 3 0 016 0zM2 14a5 5 0 0110 0"/>
            </svg>
            Users
          </button>
          <button
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-label transition rounded-none"
            style={{
              background: activeTab === "mentors" ? 'rgba(99,102,241,0.25)' : 'transparent',
              color: activeTab === "mentors" ? '#A5B4FC' : 'rgba(255,255,255,0.5)',
            }}
            onClick={() => navigate('/admin/mentors')}
          >
            <svg className="w-4 h-4 opacity-70" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 7a3 3 0 11-6 0 3 3 0 016 0zM4 14a5 5 0 0110 0"/>
              <path d="M14 12a3 3 0 00-3-3"/>
            </svg>
            Mentors
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
                Program manager
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
          <div className="text-label" style={{ fontWeight: 500 }}>
            {activeTab === "schedule" && "Book a session"}
            {activeTab === "requests" && "Mentoring requests"}
            {activeTab === "meetings" && "All meetings"}
            {activeTab === "users" && "Manage users"}
            {activeTab === "mentors" && "Manage mentors"}
          </div>
          <div className="flex items-center gap-2.5">
            {activeTab !== 'mentors' && activeTab !== 'requests' && (
              <input
                className="input"
                placeholder="Search users, mentors…"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                style={{ width: '200px' }}
              />
            )}
            <button className="w-8 h-8 rounded-lg flex items-center justify-center text-[14px]" style={{ background: 'var(--color-border-light)' }}>
              <Bell size={16} />
            </button>
          </div>
        </header>

        {/* Content area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Schedule Tab */}
          {activeTab === "schedule" && (
            <div className="flex-1 flex min-h-0 overflow-hidden">
              {/* Steps panel */}
              <aside className="flex-shrink-0 overflow-y-auto p-5" style={{ width: '320px', background: 'var(--color-card)', borderRight: '0.5px solid var(--color-border)' }}>
                <div className="text-caption mb-5">Booking steps</div>
                <StepWizard steps={steps} currentStep={currentStep} />

                {/* User tags */}
                {selectedUser?.tags && selectedUser.tags.length > 0 && (
                  <div className="pt-4 mt-4" style={{ borderTop: '0.5px solid var(--color-border)' }}>
                    <div className="text-caption mb-2">User tags</div>
                    <div className="flex flex-wrap gap-1">
                      {selectedUser.tags.map((tag, i) => (
                        <TagBadge key={i} variant={i === 0 ? 'tech' : 'neutral'}>
                          {tag}
                        </TagBadge>
                      ))}
                    </div>
                  </div>
                )}
              </aside>

              {/* Main panel */}
              <div className="flex-1 flex flex-col overflow-hidden p-4">
                {/* Step 1: Select User */}
                {!selectedUser && (
                  <div className="animate-fade-in flex-1 flex flex-col min-h-0">
                    <div className="shrink-0">
                      <div className="text-heading mb-3" style={{ color: 'var(--color-text-primary)' }}>
                        Select a user
                      </div>
                      <div className="text-body mb-4" style={{ color: 'var(--color-text-secondary)' }}>
                        Choose a mentee from your program
                      </div>
                    </div>
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 overflow-y-auto flex-1 min-h-0 pr-2 pb-4" style={{ alignContent: 'start' }}>
                      {filteredUsers.map((u) => {
                        const avIndex = users.indexOf(u) % AV_COLORS.length;
                        const av = AV_COLORS[avIndex];
                        return (
                          <div
                            key={u.id}
                            className="card cursor-pointer flex flex-col"
                            onClick={() => setSelectedUser(u)}
                            style={{ padding: '14px' }}
                          >
                            <div className="flex items-start gap-3" style={{ marginBottom: '8px' }}>
                              <div style={{
                                width: '40px', height: '40px', borderRadius: '50%',
                                background: av.bg, color: av.color,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '14px', fontWeight: 500, flexShrink: 0,
                              }}>
                                {getInitials(u.name)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-label" style={{ fontWeight: 500, color: 'var(--color-text-primary)' }}>
                                  {u.name}
                                </div>
                                <div className="text-mono" style={{ color: 'var(--color-text-tertiary)', fontSize: '10px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {u.email}
                                </div>
                              </div>
                            </div>

                            <div className="flex-1" style={{ marginBottom: '8px' }}>
                              {u.description ? (
                                <div className="text-mono" style={{ color: 'var(--color-text-secondary)', fontSize: '11px', lineHeight: '1.5', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                  {u.description}
                                </div>
                              ) : null}
                            </div>

                            <div className="flex flex-wrap gap-1" style={{ marginTop: 'auto', minHeight: '22px' }}>
                              {u.tags && u.tags.length > 0 && u.tags.slice(0, 4).map((tag, i) => (
                                <TagBadge key={i} variant={i === 0 ? 'tech' : 'neutral'}>
                                  {tag}
                                </TagBadge>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Step 2: Select Call Type */}
                {selectedUser && !selectedCallType && (
                  <div className="animate-fade-in">
                    <div className="shrink-0">
                      <div className="text-heading mb-3" style={{ color: 'var(--color-text-primary)' }}>
                        Choose call type
                      </div>
                      <div className="text-body mb-4" style={{ color: 'var(--color-text-secondary)' }}>
                        What does {selectedUser.name.split(' ')[0]} need help with?
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      {CALL_TYPES.map((ct) => (
                        <CallTypeCard
                          key={ct.value}
                          icon={ct.icon}
                          label={ct.label}
                          description={ct.description}
                          idealMentor={ct.idealMentor}
                          selected={false}
                          onClick={() => setSelectedCallType(ct.value)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Step 3: Select Mentor */}
                {selectedCallType && (
                  <div className="animate-fade-in flex-1 flex flex-col min-h-0">
                    <div className="flex items-center justify-between mb-3 shrink-0">
                      <div>
                        <div className="text-heading" style={{ color: 'var(--color-text-primary)' }}>
                          AI Recommendations
                        </div>
                        <div className="text-body" style={{ color: 'var(--color-text-secondary)' }}>
                          Ranked by semantic match for {CALL_TYPES.find(ct => ct.value === selectedCallType)?.label}
                        </div>
                      </div>
                      {loadingRecs ? (
                        <div className="spinner" />
                      ) : (
                        <div className="text-label px-2.5 py-1 rounded-lg" style={{ background: 'var(--color-accent-dim)', color: 'var(--tag-tech-text)' }}>
                          {recommendations.length} matches
                        </div>
                      )}
                    </div>

                    {loadingRecs ? (
                      <LoadingState message="Analyzing profiles..." />
                    ) : (
                      <div className="space-y-2.5 overflow-y-auto flex-1 min-h-0 pr-2 pb-4">
                        {filteredMentors.map((mentor) => (
                          <MentorCard
                            key={mentor.id}
                            mentor={mentor}
                            selected={selectedMentor?.id === mentor.id}
                            onClick={() => setSelectedMentor(mentor)}
                            showSlots={selectedMentor?.id === mentor.id}
                            isLoadingSlots={loadingOverlap && selectedMentor?.id === mentor.id}
                            slots={selectedMentor?.id === mentor.id ? overlapSlots : []}
                            selectedSlot={selectedSlot}
                            onSlotSelect={setSelectedSlot}
                            onBook={handleBookCall}
                            booking={booking}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Requests Tab */}
          {activeTab === "requests" && (
            <div className="flex-1 overflow-hidden">
              <RequestsTab
                onFulfillRequest={(request, mentor) => {
                  // Pre-select user, call type, and mentor for booking
                  setSelectedUser(request.user);
                  setSelectedCallType(request.callType);
                  setSelectedMentor(mentor);
                  setSelectedRequestId(request.id);
                  // Switch to schedule tab
                  setActiveTab("schedule");
                }}
              />
            </div>
          )}

          {/* Meetings Tab */}
          {activeTab === "meetings" && (
            <div className="flex-1 overflow-y-auto p-4">
              <div className="text-heading mb-4" style={{ color: 'var(--color-text-primary)' }}>
                All scheduled meetings
              </div>

              {loadingMeetings ? (
                <LoadingState message="Loading meetings..." />
              ) : meetings.length === 0 ? (
                <EmptyState
                  icon={<Inbox size={48} />}
                  title="No meetings yet"
                  description="Book your first mentoring call to see it here"
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" style={{ alignContent: 'start' }}>
                  {meetings.map((meeting) => {
                    const callTypeData = CALL_TYPES.find(ct => ct.value === meeting.callType);
                    const startTime = new Date(meeting.startTime);

                    return (
                      <div key={meeting.id} className="card flex flex-col justify-between" style={{ padding: '14px' }}>
                        <div>
                          <div className="flex items-start justify-between gap-4 mb-3">
                            <div className="flex gap-3">
                              <div className="flex items-center justify-center p-1">{callTypeData?.icon || <Calendar size={20} />}</div>
                              <div>
                                <div className="text-label" style={{ fontWeight: 500, marginBottom: '2px', color: 'var(--color-text-primary)', lineHeight: '1.4' }}>
                                  {meeting.title}
                                </div>
                                <div className="text-mono" style={{ color: 'var(--color-text-secondary)', fontSize: '10px' }}>
                                  {startTime.toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: 'numeric',
                                    minute: '2-digit',
                                  })}
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-1 mb-3">
                            <TagBadge variant="neutral">{callTypeData?.label || meeting.callType}</TagBadge>
                          </div>

                          <div className="space-y-1 mb-4">
                            <div className="text-mono" style={{ color: 'var(--color-text-tertiary)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                              Participants
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {meeting.participants?.map((p, i) => (
                                <span
                                  key={i}
                                  title={p.email}
                                  className="text-mono px-2 py-0.5 rounded cursor-help"
                                  style={{ background: 'var(--color-border-light)', fontSize: '10px', color: 'var(--color-text-secondary)' }}
                                >
                                  {p.email.split('@')[0]}
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
                            className="btn btn-secondary w-full text-center py-2"
                            style={{ fontSize: '12px' }}
                          >
                            <Video size={14} className="inline mr-1" /> Join Meeting
                          </a>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Users Tab */}
          {activeTab === "users" && (
            <div className="flex-1 flex overflow-hidden">
              {/* User list */}
              <div className="flex-shrink-0 overflow-y-auto h-full" style={{ width: '400px', background: 'var(--color-card)', borderRight: '0.5px solid var(--color-border)' }}>
                <div className="p-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
                  <div className="flex items-center justify-between">
                    <div className="text-label" style={{ fontWeight: 500, color: 'var(--color-text-primary)' }}>
                      Users
                    </div>
                    <div className="text-mono" style={{ color: 'var(--color-text-tertiary)', fontSize: '11px' }}>
                      {filteredUsers.length} total
                    </div>
                  </div>
                </div>
                <div>
                  {filteredUsers.map((u, i) => {
                    const av = AV_COLORS[i % AV_COLORS.length];
                    const isSelected = selectedUserForEdit?.id === u.id;
                    return (
                      <button
                        key={u.id}
                        onClick={() => handleSelectUserForEdit(u)}
                        className="w-full text-left p-4 border-b transition"
                        style={{
                          borderColor: 'var(--color-border)',
                          background: isSelected ? 'var(--color-accent-dim)' : 'var(--color-card)',
                          borderLeft: isSelected ? '3px solid var(--color-accent)' : '3px solid transparent',
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <div style={{
                            width: '36px', height: '36px', borderRadius: '50%',
                            background: av.bg, color: av.color,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '13px', fontWeight: 500, flexShrink: 0,
                          }}>
                            {getInitials(u.name)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-label" style={{ fontWeight: 500, color: 'var(--color-text-primary)' }}>
                              {u.name}
                            </div>
                            <div className="text-mono" style={{ color: 'var(--color-text-tertiary)', fontSize: '10px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {u.email}
                            </div>
                            {u.tags?.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1.5">
                                {u.tags.slice(0, 3).map((tag) => (
                                  <span key={tag} className="text-mono px-1.5 py-0.5 rounded-full" style={{ fontSize: '9px', background: 'var(--tag-tech-bg)', color: 'var(--tag-tech-text)' }}>
                                    {tag}
                                  </span>
                                ))}
                                {u.tags.length > 3 && (
                                  <span className="text-mono px-1.5 py-0.5 rounded-full" style={{ fontSize: '9px', background: 'var(--tag-neutral-bg)', color: 'var(--tag-neutral-text)' }}>
                                    +{u.tags.length - 3}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Edit form */}
              <div className="flex-1 overflow-y-auto p-5" style={{ background: 'var(--color-surface)' }}>
                {selectedUserForEdit ? (
                  <div className="max-w-2xl">
                    <div className="flex items-center gap-3 mb-5">
                      <div style={{
                        width: '44px', height: '44px', borderRadius: '50%',
                        background: AV_COLORS[users.indexOf(selectedUserForEdit) % AV_COLORS.length].bg,
                        color: AV_COLORS[users.indexOf(selectedUserForEdit) % AV_COLORS.length].color,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '16px', fontWeight: 500,
                      }}>
                        {getInitials(selectedUserForEdit.name)}
                      </div>
                      <div>
                        <div className="text-heading" style={{ color: 'var(--color-text-primary)', marginBottom: '2px' }}>
                          {selectedUserForEdit.name}
                        </div>
                        <div className="text-mono" style={{ color: 'var(--color-text-tertiary)', fontSize: '11px' }}>
                          {selectedUserForEdit.email}
                        </div>
                      </div>
                    </div>

                    {/* Tags */}
                    <div className="mb-5">
                      <div className="text-caption mb-3">Tags</div>
                      <div className="flex flex-wrap gap-2">
                        {USER_TAG_OPTIONS.map((option) => (
                          <button
                            key={option.value}
                            onClick={() => handleToggleUserTag(option.value)}
                            className="text-label px-3 py-1.5 rounded-full transition"
                            style={{
                              border: editTags.includes(option.value) ? '1.5px solid var(--color-primary)' : '0.5px solid var(--color-border)',
                              background: editTags.includes(option.value) ? 'var(--color-primary)' : 'var(--color-card)',
                              color: editTags.includes(option.value) ? '#fff' : 'var(--color-text-secondary)',
                            }}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Description */}
                    <div className="mb-5">
                      <div className="text-caption mb-3">Description</div>
                      <textarea
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        rows={5}
                        className="input w-full"
                        style={{ fontSize: '13px', padding: '12px', lineHeight: '1.6', resize: 'vertical' }}
                        placeholder="Describe the user's background, goals, and what they need help with…"
                      />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={handleSaveUser}
                        disabled={savingUser}
                        className="btn btn-primary"
                        style={{ padding: '8px 20px' }}
                      >
                        {savingUser ? "Saving…" : "Save changes"}
                      </button>
                      {success && (
                        <span className="text-label" style={{ color: 'var(--color-success)', display: 'flex', alignItems: 'center' }}>
                          <span className="flex items-center gap-1"><Check size={14} /> {success}</span>
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center">
                      <div style={{
                        width: '48px', height: '48px', borderRadius: '50%',
                        background: 'var(--color-border-light)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 16px',
                      }}>
                        <svg width="20" height="20" viewBox="0 0 16 16" fill="none" stroke="var(--color-text-tertiary)" strokeWidth="1.5">
                          <path d="M10 7a3 3 0 11-6 0 3 3 0 016 0z"/>
                          <path d="M2 14a5 5 0 0110 0"/>
                        </svg>
                      </div>
                      <div className="text-heading mb-1" style={{ color: 'var(--color-text-primary)' }}>
                        Select a user
                      </div>
                      <div className="text-body" style={{ color: 'var(--color-text-secondary)' }}>
                        Click a user on the left to edit their profile
                      </div>
                    </div>
                  </div>
                )}
              </div>
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
