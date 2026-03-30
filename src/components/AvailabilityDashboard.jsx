import { useState, useEffect, useCallback, useMemo } from "react";
import { Bell } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import * as availabilityApi from "../api/availability";
import * as usersApi from "../api/users";
import * as meetingsApi from "../api/meetings";
import {
  getWeekStartStr,
  formatDateLocal,
  formatTimeLocal,
  formatTimeRange,
  slotToUTC,
  isPastDate,
  isPastDateTime,
  formatSlotLabel,
} from "../utils/time";

const HOURS = Array.from({ length: 24 }, (_, i) => i);

const TIMEZONE_OPTIONS = [
  { value: "UTC", label: "GMT (UTC+0)" },
  { value: "IST", label: "IST (UTC+5:30)" },
];

const USER_TAGS = [
  { value: "tech", label: "Tech" },
  { value: "non-tech", label: "Non-Tech" },
  { value: "good-communication", label: "Good Communication" },
  { value: "asks-a-lot-of-questions", label: "Asks Questions" },
];

const DAY_NAMES = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

function formatHourLabel(utcHourIndex, displayTimezone) {
  const startISO = new Date(Date.UTC(2000, 0, 1, utcHourIndex, 0)).toISOString();
  const start = formatTimeLocal(startISO, displayTimezone);
  return formatTimeRange(start);
}

function getUTCToday() {
  const today = new Date();
  return new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
}

export default function AvailabilityDashboard({ role = "USER", forcedTab }) {
  const { user } = useAuth();
  const [_activeTab, setActiveTab] = useState("availability");
  const activeTab = forcedTab || _activeTab;
  const [displayTimezone, setDisplayTimezone] = useState(user?.timezone || "UTC");
  const [weekOffset, setWeekOffset] = useState(0);
  const [data, setData] = useState({ dates: [], availability: {} });
  const [meetings, setMeetings] = useState([]);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(!user);
  const [saving, setSaving] = useState(false);
  const [toggles, setToggles] = useState({});
  const [error, setError] = useState("");

  // Profile state (for users)
  const [profile, setProfile] = useState({ tags: [], description: "" });
  const [editTags, setEditTags] = useState([]);
  const [editDescription, setEditDescription] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);

  const fetchWeekly = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError("");
    try {
      const today = new Date();
      const base = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
      base.setUTCDate(base.getUTCDate() + weekOffset * 7);
      const weekStartStr = base.toISOString().slice(0, 10);
      
      const endBase = new Date(base);
      endBase.setUTCDate(endBase.getUTCDate() + 7);
      const weekEndStr = endBase.toISOString().slice(0, 10);

      const [res, meetingsRes] = await Promise.all([
        availabilityApi.getWeekly({ weekStart: weekStartStr }),
        meetingsApi.listMeetings({ from: weekStartStr, to: weekEndStr })
      ]);

      console.log('[Availability] Loaded data:', res);
      console.log('[Availability] Dates:', res.dates);
      console.log('[Availability] Availability keys:', Object.keys(res.availability || {}));
      console.log('[Availability] Meetings loaded:', meetingsRes);
      setData(res);
      setMeetings(meetingsRes || []);
    } catch (e) {
      setError(e.message || "Failed to load availability");
    } finally {
      setLoading(false);
    }
  }, [weekOffset, user?.id]);

  useEffect(() => {
    setToggles({});
  }, [weekOffset]);

  useEffect(() => {
    if (user) fetchWeekly();
  }, [fetchWeekly]);

  useEffect(() => {
    if (role === "USER" && user && activeTab === "profile") {
      async function loadProfile() {
        try {
          const data = await usersApi.getProfile();
          setProfile(data.user);
          setEditTags(data.user.tags || []);
          setEditDescription(data.user.description || "");
        } catch (e) {
          console.error("Failed to load profile:", e.message);
        }
      }
      loadProfile();
    }
  }, [role, user, activeTab]);

  const isSavedEnabled = useCallback((dateStr, hour) => {
    const slots = data.availability[dateStr] || [];
    const { startTime } = slotToUTC(dateStr, hour);
    const startHour = startTime.slice(0, 13);
    return slots.some((s) => s.startTime.slice(0, 13) === startHour);
  }, [data.availability]);

  const isSlotEnabled = (dateStr, hour) => {
    const key = `${dateStr}-${hour}`;
    // Check pending toggles first
    if (toggles[key] !== undefined) return toggles[key];
    // Check saved availability
    return isSavedEnabled(dateStr, hour);
  };

  const isSlotDisabled = (dateStr, hour) => {
    if (isPastDate(dateStr)) return true;
    const utcTodayStr = new Date().toISOString().slice(0, 10);
    if (dateStr === utcTodayStr) {
      const { startTime } = slotToUTC(dateStr, hour);
      return isPastDateTime(startTime);
    }
    return false;
  };

  const toggleSlot = (dateStr, hour) => {
    if (isSlotDisabled(dateStr, hour)) return;
    const key = `${dateStr}-${hour}`;
    const currentlyEnabled = isSlotEnabled(dateStr, hour);
    const nextEnabled = !currentlyEnabled;
    const savedEnabled = isSavedEnabled(dateStr, hour);

    setToggles((prev) => {
      const next = { ...prev };
      if (nextEnabled === savedEnabled) {
        delete next[key];
      } else {
        next[key] = nextEnabled;
      }
      return next;
    });
  };

  const saveBatch = async () => {
    setSaving(true);
    setError("");
    const slots = [];
    data.dates.forEach((dateStr) => {
      HOURS.forEach((hour) => {
        const key = `${dateStr}-${hour}`;
        if (toggles[key] === undefined) return;
        const enabled = toggles[key];
        const { startTime, endTime } = slotToUTC(dateStr, hour);
        slots.push({ date: dateStr, startTime, endTime, enabled });
      });
    });
    if (slots.length === 0) { setSaving(false); return; }
    try {
      await availabilityApi.saveBatch(slots);
      await fetchWeekly();
      setToggles({});
    } catch (e) {
      setError(e.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const cancelChanges = () => setToggles({});
  const hasChanges = Object.keys(toggles).length > 0;

  const saveProfile = async () => {
    if (role !== "USER") return;
    setProfileSaving(true);
    setError("");
    try {
      const res = await usersApi.updateProfile({ tags: editTags, description: editDescription });
      setProfile(res.user);
    } catch (e) {
      setError(e.message || "Failed to save profile");
    } finally {
      setProfileSaving(false);
    }
  };

  const toggleProfileTag = (tagValue) => {
    setEditTags((prev) =>
      prev.includes(tagValue) ? prev.filter(t => t !== tagValue) : [...prev, tagValue]
    );
  };

  const buildGridDates = () => {
    const today = new Date();
    const start = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
    start.setUTCDate(start.getUTCDate() + weekOffset * 7);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setUTCDate(start.getUTCDate() + i);
      return d.toISOString().slice(0, 10);
    });
  };

  const gridDates = buildGridDates();
  const gridStart = gridDates[0];
  const gridEnd = gridDates[6];

  const prevWeek = () => { if (weekOffset > 0) setWeekOffset(prev => prev - 1); };
  const nextWeek = () => setWeekOffset(prev => prev + 1);

  const utcTodayStr = new Date().toISOString().slice(0, 10);

  // Format week label
  const startDate = new Date(gridStart + "T00:00:00Z");
  const endDate = new Date(gridEnd + "T00:00:00Z");
  const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const weekLabel = startDate.getUTCMonth() === endDate.getUTCMonth()
    ? `${monthNames[startDate.getUTCMonth()]} ${startDate.getUTCDate()} – ${endDate.getUTCDate()}, ${startDate.getUTCFullYear()}`
    : `${monthNames[startDate.getUTCMonth()]} ${startDate.getUTCDate()} – ${monthNames[endDate.getUTCMonth()]} ${endDate.getUTCDate()}, ${startDate.getUTCFullYear()}`;

  const pendingCount = Object.values(toggles).filter(Boolean).length;
  const removedCount = Object.values(toggles).filter(v => !v).length;

  const todayMeetingCount = meetings.filter(m => new Date(m.startTime).toISOString().slice(0, 10) === utcTodayStr).length;
  const weekMeetingCount = meetings.length;

  const handleScrollToMeetings = () => {
    const meetingEls = Array.from(document.querySelectorAll('.meeting-cell'));
    if (!meetingEls.length) return;
    
    const container = document.getElementById('calendar-scroll-container');
    if (!container) return;
    const containerRect = container.getBoundingClientRect();
    
    // Find next meeting that is below currently visible area
    const nextMeeting = meetingEls.find(el => el.getBoundingClientRect().top > containerRect.bottom - 40);
    
    if (nextMeeting) {
      nextMeeting.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      meetingEls[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <div style={{ height: '100%', minHeight: 0, flex: 1, background: '#F8F8F7', fontFamily: 'var(--font-sans)', display: 'flex', flexDirection: 'column' }}>

      {/* Top bar */}
      <div style={{
        background: '#fff',
        borderBottom: '0.5px solid #E5E5E3',
        padding: '14px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ fontSize: '15px', fontWeight: 500, color: '#1A1A2E' }}>
            {activeTab === "profile" ? "My Profile" : "My Availability"}
          </div>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Timezone selector */}
          <select
            value={displayTimezone}
            onChange={(e) => setDisplayTimezone(e.target.value)}
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              padding: '5px 8px',
              borderRadius: '7px',
              border: '0.5px solid #E5E5E3',
              background: '#F8F8F7',
              color: '#6B7280',
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            {TIMEZONE_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          {/* Week navigation */}
          {(role !== "USER" || activeTab === "availability") && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={prevWeek}
                disabled={weekOffset === 0}
                style={{
                  width: '28px', height: '28px', borderRadius: '7px',
                  border: '0.5px solid #E5E5E3', background: '#fff',
                  cursor: weekOffset === 0 ? 'not-allowed' : 'pointer',
                  opacity: weekOffset === 0 ? 0.4 : 1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '14px', color: '#6B7280',
                  fontFamily: 'var(--font-sans)',
                }}
              >
                ‹
              </button>
              <span style={{ fontSize: '12px', fontWeight: 500, color: '#1A1A2E', whiteSpace: 'nowrap' }}>
                {weekLabel}
              </span>
              <button
                onClick={nextWeek}
                style={{
                  width: '28px', height: '28px', borderRadius: '7px',
                  border: '0.5px solid #E5E5E3', background: '#fff',
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '14px', color: '#6B7280',
                  fontFamily: 'var(--font-sans)',
                }}
              >
                ›
              </button>
            </div>
          )}

          {/* Save/Cancel */}
          {(role !== "USER" || activeTab === "availability") && (
            <>
              {hasChanges && (
                <button
                  onClick={cancelChanges}
                  style={{
                    fontSize: '13px', fontWeight: 500,
                    padding: '7px 14px', borderRadius: '8px',
                    border: '0.5px solid #E5E5E3', background: 'transparent',
                    color: '#6B7280', cursor: 'pointer',
                    fontFamily: 'var(--font-sans)',
                  }}
                >
                  Discard
                </button>
              )}
              <button
                onClick={saveBatch}
                disabled={saving || !hasChanges}
                style={{
                  fontSize: '13px', fontWeight: 500,
                  padding: '7px 16px', borderRadius: '8px',
                  border: 'none',
                  background: hasChanges ? '#1A1A2E' : '#E5E5E3',
                  color: hasChanges ? '#fff' : '#9CA3AF',
                  cursor: saving || !hasChanges ? 'not-allowed' : 'pointer',
                  fontFamily: 'var(--font-sans)',
                  transition: 'background 0.15s',
                }}
              >
                {saving ? "Saving…" : "Save changes"}
              </button>
            </>
          )}
          
          <div style={{ width: '1px', height: '24px', background: '#E5E5E3', margin: '0 4px' }} />
          <button className="w-[32px] h-[32px] rounded-lg flex items-center justify-center text-[14px]" style={{ background: '#F8F8F7', border: '0.5px solid #E5E5E3', cursor: 'pointer' }}>
            <Bell size={16} />
          </button>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div style={{
          background: '#FEE2E2', border: '0.5px solid #FCA5A5',
          padding: '10px 20px', fontSize: '13px', color: '#991B1B',
        }}>
          {error}
        </div>
      )}

      {/* Profile Tab */}
      {role === "USER" && activeTab === "profile" && (
        <div style={{ padding: '20px' }}>
          <div style={{
            background: '#fff', border: '0.5px solid #E5E5E3',
            borderRadius: '12px', padding: '24px', maxWidth: '560px',
          }}>
            <div style={{ fontSize: '14px', fontWeight: 500, color: '#1A1A2E', marginBottom: '20px' }}>
              Profile information
            </div>

            {/* Tags */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{
                fontSize: '10px', fontWeight: 500, letterSpacing: '0.1em',
                textTransform: 'uppercase', color: '#9CA3AF', marginBottom: '10px',
              }}>
                Your tags
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {USER_TAGS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => toggleProfileTag(option.value)}
                    style={{
                      fontSize: '12px', fontWeight: 400,
                      padding: '5px 14px', borderRadius: '100px',
                      border: editTags.includes(option.value) ? '1.5px solid #1A1A2E' : '0.5px solid #E5E5E3',
                      background: editTags.includes(option.value) ? '#1A1A2E' : '#fff',
                      color: editTags.includes(option.value) ? '#fff' : '#6B7280',
                      cursor: 'pointer',
                      transition: 'all 0.12s',
                      fontFamily: 'var(--font-sans)',
                    }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{
                fontSize: '10px', fontWeight: 500, letterSpacing: '0.1em',
                textTransform: 'uppercase', color: '#9CA3AF', marginBottom: '10px',
              }}>
                About you
              </div>
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={4}
                className="input"
                style={{
                  width: '100%', resize: 'vertical',
                  fontSize: '13px', lineHeight: '1.6',
                  padding: '10px 14px',
                }}
                placeholder="Describe your background and what you're looking for in a mentor…"
              />
            </div>

            <button
              onClick={saveProfile}
              disabled={profileSaving}
              style={{
                fontSize: '13px', fontWeight: 500,
                padding: '8px 20px', borderRadius: '8px',
                border: 'none', background: '#1A1A2E', color: '#fff',
                cursor: profileSaving ? 'not-allowed' : 'pointer',
                opacity: profileSaving ? 0.7 : 1,
                fontFamily: 'var(--font-sans)',
              }}
            >
              {profileSaving ? "Saving…" : "Save profile"}
            </button>
          </div>
        </div>
      )}

      {/* Availability Calendar */}
      {(role !== "USER" || activeTab === "availability") && (
        <div style={{ padding: '16px 20px', flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>

          {/* Timezone banner */}
          <div style={{
            background: '#EEF2FF', border: '1px solid #6366F1',
            borderRadius: '8px', padding: '10px 14px',
            display: 'flex', alignItems: 'center', gap: '10px',
            marginBottom: '14px', fontSize: '13px', color: '#3730A3',
            flexShrink: 0,
          }}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="8" cy="8" r="6"/>
              <path d="M8 5v3l2 2"/>
            </svg>
            Showing times in{" "}
            <strong style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: '#312E81' }}>
              {displayTimezone === "IST" ? "IST (UTC+5:30)" : "GMT (UTC+0)"}
            </strong>

            {weekMeetingCount > 0 && (
              <div 
                onClick={handleScrollToMeetings}
                style={{
                  marginLeft: '12px', padding: '4px 10px', background: 'rgba(99,102,241,0.15)',
                  borderRadius: '100px', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                  color: '#4338CA', transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: '6px'
                }}
                onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(99,102,241,0.25)'; }}
                onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(99,102,241,0.15)'; }}
                title="Click to scroll to next meeting"
              >
                <span style={{ fontSize: '14px' }}>↓</span> {todayMeetingCount} today • {weekMeetingCount} this week
              </div>
            )}

            {hasChanges && (
              <span style={{ marginLeft: 'auto', color: '#312E81', fontWeight: 500, fontSize: '12px', fontFamily: 'var(--font-mono)' }}>
                {pendingCount > 0 && `+${pendingCount} marked`}
                {pendingCount > 0 && removedCount > 0 && " · "}
                {removedCount > 0 && `−${removedCount} removed`}
                {" — unsaved changes"}
              </span>
            )}
          </div>

          {/* Calendar grid — scrollable */}
          <div style={{
            background: '#fff', border: '0.5px solid #E5E5E3',
            borderRadius: '12px', overflow: 'hidden', flex: 1, minHeight: 0,
            display: 'flex', flexDirection: 'column',
          }}>
            {loading ? (
              <div style={{ padding: '60px', textAlign: 'center', color: '#9CA3AF', fontSize: '13px' }}>
                <div style={{
                  width: '20px', height: '20px', border: '2px solid #E5E5E3',
                  borderTopColor: '#6366F1', borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite', margin: '0 auto 12px',
                }} />
                Loading schedule…
              </div>
            ) : (
              <div id="calendar-scroll-container" style={{ overflowX: 'auto', overflowY: 'auto', flex: 1, minHeight: 0 }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '72px repeat(7, 1fr)',
                  minWidth: '700px',
                }}>
                  {/* Header row */}
                  <div style={{ borderBottom: '0.5px solid #E5E5E3', background: '#F8F8F7' }} /> {/* empty corner */}
                  {gridDates.map((dateStr) => {
                    const d = new Date(dateStr + "T00:00:00Z");
                    const dayName = DAY_NAMES[d.getUTCDay()];
                    const dayNum = d.getUTCDate();
                    const isToday = dateStr === utcTodayStr;
                    return (
                      <div
                        key={dateStr}
                        style={{
                          padding: '12px 6px', textAlign: 'center',
                          borderBottom: '0.5px solid #E5E5E3',
                          borderLeft: '0.5px solid #E5E5E3',
                          background: isToday ? '#EEF2FF' : '#F8F8F7',
                        }}
                      >
                        <div style={{
                          fontSize: '11px', fontWeight: 700, letterSpacing: '0.05em',
                          textTransform: 'uppercase', color: isToday ? '#4338CA' : '#6B7280',
                        }}>
                          {dayName}
                        </div>
                        <div style={{
                          fontSize: '22px', fontWeight: 400,
                          color: isToday ? '#4338CA' : '#1A1A2E',
                          lineHeight: 1.1, marginTop: '4px',
                        }}>
                          {dayNum}
                        </div>
                      </div>
                    );
                  })}

                  {/* Time rows */}
                  {HOURS.map((hour) => (
                    <CalendarRow
                      key={hour}
                      hour={hour}
                      gridDates={gridDates}
                      utcTodayStr={utcTodayStr}
                      displayTimezone={displayTimezone}
                      isSavedEnabled={isSavedEnabled}
                      isSlotDisabled={isSlotDisabled}
                      toggleSlot={toggleSlot}
                      toggles={toggles}
                      meetings={meetings}
                      role={role}
                      onMeetingClick={(meeting) => {
                        setSelectedMeeting(meeting);
                        setIsSidebarOpen(true);
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Legend — always pinned at the bottom, outside the scroll area */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '24px',
            marginTop: '12px', flexWrap: 'wrap',
            padding: '10px 16px',
            background: '#fff',
            borderRadius: '8px',
            border: '0.5px solid #E5E5E3',
            flexShrink: 0,
          }}>
            <LegendItem color="#10B981" opacity={1} label="Available (confirmed)" bold />
            <LegendItem color="#F59E0B" opacity={1} label="Scheduled Meeting" bold />
            <LegendItem color="#6366F1" opacity={1} label="Adding (pending)" bold />
            <LegendItem color="#EF4444" opacity={1} label="Removing (pending)" bold />
            <div style={{ marginLeft: 'auto', fontSize: '12px', color: '#6B7280', fontFamily: 'var(--font-mono)', fontWeight: 500 }}>
              Click to toggle · Save to confirm
            </div>
          </div>
        </div>
      )}

      {/* Meeting Details Sidebar */}
      <div 
        className={`fixed inset-0 z-50 flex justify-end transition-opacity duration-300 ${
          isSidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      >
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-navy-900/30 backdrop-blur-[2px]"
          onClick={() => setIsSidebarOpen(false)}
        />

        {/* Sidebar Panel */}
        <div 
          className={`relative w-full max-w-sm h-full bg-white shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out z-50 ${
            isSidebarOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          {selectedMeeting && (
            <>
              {/* Header */}
              <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
                <h2 className="text-lg font-semibold text-navy-900 m-0">Meeting Details</h2>
                <button 
                  onClick={() => setIsSidebarOpen(false)}
                  className="text-slate-400 hover:text-slate-600 transition-colors p-2 -mr-2 rounded-full hover:bg-slate-50 flex items-center justify-center leading-none"
                  aria-label="Close details"
                >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar">
              <h3 className="text-xl font-bold text-navy-900 mb-2">
                {selectedMeeting ? (() => {
                  const baseType = selectedMeeting.callType ? selectedMeeting.callType.replace(/_/g, " ") : "Meeting";
                  if (role === "USER" && selectedMeeting.mentor?.name) return `${baseType} with ${selectedMeeting.mentor.name}`;
                  if (role === "MENTOR" && selectedMeeting.user?.name) return `${baseType} with ${selectedMeeting.user.name}`;
                  return selectedMeeting.title || "Scheduled Meeting";
                })() : "Scheduled Meeting"}
              </h3>
              
              <div className="flex items-center gap-2 mb-8 text-sm text-slate-500 bg-slate-50 px-3 py-2 rounded-lg border border-slate-100">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400">
                  <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
                </svg>
                <div className="flex flex-col">
                  <span className="font-semibold text-navy-800">{formatDateLocal(selectedMeeting.startTime, displayTimezone)}</span>
                  <span>{formatSlotLabel(selectedMeeting.startTime, selectedMeeting.endTime, displayTimezone)}</span>
                </div>
              </div>
              
              <div className="mb-8">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Focus Area / Type</div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 text-sm font-medium border border-indigo-100/50">
                  {selectedMeeting.callType ? selectedMeeting.callType.replace(/_/g, " ") : "Priority Meeting"}
                </div>
              </div>

              {selectedMeeting.meetLink && (
                <div className="mb-8 p-4 rounded-xl bg-gradient-to-br from-slate-50 to-white border border-slate-100 shadow-sm relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-primary-500/5 rounded-full -mr-10 -mt-10 transition-transform group-hover:scale-110" />
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3 relative z-10">Live Session</div>
                  
                  <a 
                    href={selectedMeeting.meetLink} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="relative z-10 w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-xl transition-all shadow-sm focus:ring-4 focus:ring-primary-500/20 active:scale-[0.98]"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
                    </svg>
                    Join Google Meet Now
                  </a>
                </div>
              )}
              
              <div className="mb-6">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">Participants</div>
                {selectedMeeting.participants && selectedMeeting.participants.length > 0 ? (
                  <div className="flex flex-col gap-2">
                    {selectedMeeting.participants.map(p => (
                      <div key={p.id || p.email} className="flex items-center gap-3 p-3 rounded-lg bg-white border border-slate-100 shadow-sm hover:border-slate-200 transition-colors">
                        <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 font-bold flex items-center justify-center text-sm border border-slate-200">
                          {(p.email || "?").charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm font-medium text-navy-800">{p.email}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-400 italic">No participants listed.</p>
                )}
              </div>
            </div>
          </>
        )}
        </div>
      </div>
    </div>
  );
}

function CalendarRow({ hour, gridDates, utcTodayStr, displayTimezone, isSavedEnabled, isSlotDisabled, toggleSlot, toggles, meetings = [], onMeetingClick, role }) {
  const label = formatHourLabel(hour, displayTimezone);

  return (
    <>
      {/* Time label */}
      <div style={{
        height: '40px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#6B7280', fontWeight: 500,
        borderBottom: '0.5px solid #E5E5E3',
        borderRight: '0.5px solid #E5E5E3',
        padding: '0 4px', textAlign: 'center',
        background: '#F8F8F7',
      }}>
        {label}
      </div>

      {/* Day cells */}
      {gridDates.map((dateStr, idx) => {
        const savedEnabled = isSavedEnabled(dateStr, hour);
        const disabled = isSlotDisabled(dateStr, hour);
        const key = `${dateStr}-${hour}`;
        const toggleValue = toggles[key];
        const isPending = toggleValue !== undefined;
        const isToday = dateStr === utcTodayStr;

        const dateSlotUTC = slotToUTC(dateStr, hour);
        const slotStartHour = dateSlotUTC.startTime.slice(0, 13);
        const meetingSlot = meetings.find(m => new Date(m.startTime).toISOString().slice(0, 13) === slotStartHour);
        const isMeeting = !!meetingSlot;
        
        let cellTitle = "Meeting";
        if (isMeeting) {
          const baseType = meetingSlot.callType ? meetingSlot.callType.replace(/_/g, " ") : "Meeting";
          if (role === "USER" && meetingSlot.mentor?.name) cellTitle = `${baseType} with ${meetingSlot.mentor.name}`;
          else if (role === "MENTOR" && meetingSlot.user?.name) cellTitle = `${baseType} with ${meetingSlot.user.name}`;
          else cellTitle = meetingSlot.title || "Meeting";
        }

        // Determine background color based on state
        let bg = isToday ? '#F0F0F0' : '#FFFFFF';
        let indicatorColor = null;

        if (isMeeting) {
          bg = 'rgba(245,158,11,0.2)';
          indicatorColor = '#F59E0B'; // Amber for meeting
        } else if (disabled) {
          bg = '#F5F5F5';
        } else if (!isPending && savedEnabled) {
          // Confirmed available - strong green background
          bg = 'rgba(16,185,129,0.3)';
          indicatorColor = '#10B981';
        } else if (isPending && toggleValue === true) {
          // Pending add - strong purple/blue background
          bg = 'rgba(99,102,241,0.3)';
          indicatorColor = '#6366F1';
        } else if (isPending && toggleValue === false) {
          // Pending removal - red background
          bg = 'rgba(239,68,68,0.25)';
          indicatorColor = '#EF4444';
        }

        return (
          <div
            key={dateStr}
            className={isMeeting ? "meeting-cell" : ""}
            onClick={() => {
              if (isMeeting && onMeetingClick) {
                onMeetingClick(meetingSlot);
              } else if (!disabled) {
                toggleSlot(dateStr, hour);
              }
            }}
            style={{
              height: '40px',
              borderBottom: '1px solid #E5E5E3',
              borderLeft: '0.5px solid #E5E5E3',
              background: bg,
              cursor: (disabled && !isMeeting) ? 'not-allowed' : 'pointer',
              opacity: (disabled && !isMeeting) ? 0.5 : 1,
              position: 'relative',
              transition: 'all 0.1s',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {/* Left border indicator for all states */}
            {(!disabled || isMeeting) && indicatorColor && (
              <div style={{
                position: 'absolute', left: '0', top: '0', bottom: '0', width: '4px',
                background: indicatorColor,
              }} />
            )}
            
            {/* Border outline for pending changes */}
            {!disabled && isPending && (
              <div style={{
                position: 'absolute',
                left: '6px', right: '2px', top: '2px', bottom: '2px',
                border: `2px solid ${indicatorColor}`,
                borderRadius: '2px',
                pointerEvents: 'none',
              }} />
            )}

            {/* Meeting specific content */}
            {isMeeting && (
              <div style={{
                marginLeft: '8px',
                fontSize: '11px',
                color: '#92400E',
                fontWeight: 600,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}>
                {cellTitle}
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}

function LegendItem({ color, opacity = 1, border, label, bold = false }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: bold ? '13px' : '12px', color: bold ? '#1A1A2E' : '#6B7280', fontWeight: bold ? 500 : 400 }}>
      <div style={{
        width: '14px', height: '14px', borderRadius: '3px',
        background: color ? `rgba(${hexToRgb(color)},${opacity})` : undefined,
        border: border || undefined,
        boxShadow: color ? `0 0 0 1px ${color}` : 'none',
      }} />
      {label}
    </div>
  );
}

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r},${g},${b}`;
}
