import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import * as adminApi from "../api/admin";
import * as availabilityApi from "../api/availability";
import * as meetingsApi from "../api/meetings";

const CALL_TYPES = [
  {
    value: "RESUME_REVAMP",
    label: "Resume Revamp",
    description: "Get your resume reviewed by a mentor from big tech",
    idealMentor: "Someone from big tech companies (Google, Amazon, Meta, etc.)",
  },
  {
    value: "JOB_MARKET_GUIDANCE",
    label: "Job Market Guidance",
    description: "Understand the job market and get career advice",
    idealMentor: "A mentor with good communication skills and industry insights",
  },
  {
    value: "MOCK_INTERVIEW",
    label: "Mock Interviews",
    description: "Practice interviews with domain experts",
    idealMentor: "Someone from the same domain/field as you",
  },
];

const TIME_SLOTS = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
  "15:00", "15:30", "16:00", "16:30", "17:00", "17:30",
];

export default function AdminDashboard() {
  const { user } = useAuth();
  
  // Step tracking
  const [currentStep, setCurrentStep] = useState(1);
  
  // Step 1: User selection
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  
  // Step 2: Call type
  const [selectedCallType, setSelectedCallType] = useState("");
  
  // Step 3: Recommendations
  const [recommendations, setRecommendations] = useState([]);
  const [selectedMentor, setSelectedMentor] = useState(null);
  const [loadingRecs, setLoadingRecs] = useState(false);
  
  // Step 4: Overlap & booking
  const [overlapSlots, setOverlapSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [loadingOverlap, setLoadingOverlap] = useState(false);
  const [booking, setBooking] = useState(false);
  
  // General
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Load users on mount
  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await adminApi.listUsers();
        setUsers(data);
      } catch (e) {
        setError(e.message || "Failed to load users");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Load recommendations when user + call type selected
  useEffect(() => {
    if (selectedUser && selectedCallType) {
      loadRecommendations();
    }
  }, [selectedUser, selectedCallType]);

  // Load overlap when user + mentor selected
  useEffect(() => {
    if (selectedUser && selectedMentor) {
      loadOverlap();
    }
  }, [selectedUser, selectedMentor]);

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
    if (!selectedMentor) return;
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
      setError(e.message || "Failed to load availability overlap");
      setOverlapSlots([]);
    } finally {
      setLoadingOverlap(false);
    }
  }

  async function handleBookCall() {
    if (!selectedSlot || !selectedMentor) return;
    
    setBooking(true);
    setError("");
    setSuccess("");
    
    try {
      const callTypeData = CALL_TYPES.find(ct => ct.value === selectedCallType);
      const slotDate = new Date(selectedSlot.date);
      const startTime = new Date(selectedSlot.startTime);
      const endTime = new Date(selectedSlot.endTime);
      
      await meetingsApi.scheduleMeeting({
        title: `${callTypeData?.label || "Mentoring Call"} - ${selectedUser.name}`,
        callType: selectedCallType,
        userId: selectedUser.id,
        mentorId: selectedMentor.id,
        date: slotDate.toISOString().slice(0, 10),
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        timezone: "UTC",
      });
      
      setSuccess("Call booked successfully!");
      
      // Reset after success
      setTimeout(() => {
        setSelectedUser(null);
        setSelectedCallType("");
        setSelectedMentor(null);
        setSelectedSlot(null);
        setCurrentStep(1);
        setSuccess("");
      }, 2000);
    } catch (e) {
      setError(e.message || "Failed to book call");
    } finally {
      setBooking(false);
    }
  }

  function formatTime(isoString) {
    const date = new Date(isoString);
    return date.toLocaleTimeString("en-US", { 
      hour: "numeric", 
      minute: "2-digit",
      hour12: true 
    });
  }

  function formatDate(isoString) {
    const date = new Date(isoString);
    return date.toLocaleDateString("en-US", { 
      weekday: "short", 
      month: "short", 
      day: "numeric" 
    });
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-white mb-2">Book a Mentoring Call</h1>
        <p className="text-slate-400">Select a user, choose call type, get AI recommendations, and book.</p>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {[1, 2, 3, 4].map((step) => (
            <div key={step} className="flex items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-medium transition ${
                  step <= currentStep
                    ? "bg-primary-600 text-white"
                    : "bg-navy-800 text-slate-500"
                }`}
              >
                {step < currentStep ? "✓" : step}
              </div>
              {step < 4 && (
                <div
                  className={`w-16 sm:w-24 h-1 mx-2 rounded ${
                    step < currentStep ? "bg-primary-600" : "bg-navy-800"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2 text-xs text-slate-500">
          <span>Select User</span>
          <span>Call Type</span>
          <span>Recommendations</span>
          <span>Book</span>
        </div>
      </div>

      {/* Error/Success */}
      {error && (
        <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 p-4 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400">
          {success}
        </div>
      )}

      {/* Step 1: Select User */}
      {currentStep === 1 && (
        <div className="bg-navy-900 border border-navy-700 rounded-xl p-6">
          <h2 className="text-lg font-medium text-white mb-4">Step 1: Select User</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {users.map((u) => (
              <button
                key={u.id}
                onClick={() => {
                  setSelectedUser(u);
                  setCurrentStep(2);
                }}
                className="text-left p-4 rounded-lg bg-navy-800 border border-navy-700 hover:border-primary-500 transition"
              >
                <div className="font-medium text-white">{u.name}</div>
                <div className="text-sm text-slate-400">{u.email}</div>
                {u.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {u.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="text-xs px-2 py-0.5 bg-navy-700 rounded-full text-slate-300">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Select Call Type */}
      {currentStep === 2 && selectedUser && (
        <div className="bg-navy-900 border border-navy-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-white">Step 2: Select Call Type</h2>
            <button
              onClick={() => setCurrentStep(1)}
              className="text-sm text-slate-400 hover:text-white"
            >
              ← Back
            </button>
          </div>
          
          <div className="mb-4 p-4 bg-navy-800 rounded-lg">
            <div className="text-sm text-slate-400 mb-1">Selected User</div>
            <div className="font-medium text-white">{selectedUser.name}</div>
            {selectedUser.description && (
              <div className="text-sm text-slate-400 mt-2">{selectedUser.description}</div>
            )}
          </div>

          <div className="space-y-3">
            {CALL_TYPES.map((ct) => (
              <button
                key={ct.value}
                onClick={() => {
                  setSelectedCallType(ct.value);
                  setCurrentStep(3);
                }}
                className={`w-full text-left p-4 rounded-lg border transition ${
                  selectedCallType === ct.value
                    ? "bg-primary-600/20 border-primary-500"
                    : "bg-navy-800 border-navy-700 hover:border-navy-600"
                }`}
              >
                <div className="font-medium text-white mb-1">{ct.label}</div>
                <div className="text-sm text-slate-400 mb-2">{ct.description}</div>
                <div className="text-xs text-slate-500">
                  <span className="font-medium">Ideal mentor:</span> {ct.idealMentor}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 3: Recommendations */}
      {currentStep === 3 && selectedUser && selectedCallType && (
        <div className="bg-navy-900 border border-navy-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-white">Step 3: Recommended Mentors</h2>
            <button
              onClick={() => setCurrentStep(2)}
              className="text-sm text-slate-400 hover:text-white"
            >
              ← Back
            </button>
          </div>

          {loadingRecs ? (
            <div className="text-center py-8 text-slate-400">Loading recommendations...</div>
          ) : recommendations.length === 0 ? (
            <div className="text-center py-8 text-slate-400">No recommendations found</div>
          ) : (
            <div className="space-y-3">
              {recommendations.map((mentor, idx) => (
                <button
                  key={mentor.id}
                  onClick={() => {
                    setSelectedMentor(mentor);
                    setCurrentStep(4);
                  }}
                  className={`w-full text-left p-4 rounded-lg border transition ${
                    selectedMentor?.id === mentor.id
                      ? "bg-primary-600/20 border-primary-500"
                      : "bg-navy-800 border-navy-700 hover:border-navy-600"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-white flex items-center gap-2">
                        {mentor.name}
                        {idx === 0 && (
                          <span className="text-xs px-2 py-0.5 bg-green-600 rounded-full text-white">
                            Best Match
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-slate-400">{mentor.email}</div>
                      {mentor.description && (
                        <div className="text-sm text-slate-400 mt-2 line-clamp-2">
                          {mentor.description}
                        </div>
                      )}
                      {mentor.tags?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {mentor.tags.map((tag) => (
                            <span key={tag} className="text-xs px-2 py-0.5 bg-navy-700 rounded-full text-slate-300">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    {mentor.similarityScore && (
                      <div className="text-right">
                        <div className="text-2xl font-bold text-primary-400">
                          {Math.round(mentor.similarityScore * 100)}%
                        </div>
                        <div className="text-xs text-slate-500">Match</div>
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Step 4: Book */}
      {currentStep === 4 && selectedUser && selectedMentor && (
        <div className="bg-navy-900 border border-navy-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-white">Step 4: Check & Book</h2>
            <button
              onClick={() => setCurrentStep(3)}
              className="text-sm text-slate-400 hover:text-white"
            >
              ← Back
            </button>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="p-4 bg-navy-800 rounded-lg">
              <div className="text-sm text-slate-400 mb-1">User</div>
              <div className="font-medium text-white">{selectedUser.name}</div>
            </div>
            <div className="p-4 bg-navy-800 rounded-lg">
              <div className="text-sm text-slate-400 mb-1">Mentor</div>
              <div className="font-medium text-white">{selectedMentor.name}</div>
            </div>
          </div>

          {/* Available Slots */}
          <div className="mb-6">
            <h3 className="text-md font-medium text-white mb-3">Available Time Slots</h3>
            {loadingOverlap ? (
              <div className="text-center py-4 text-slate-400">Loading availability...</div>
            ) : overlapSlots.length === 0 ? (
              <div className="text-center py-4 text-slate-400">
                No overlapping availability found. Please ask the user or mentor to add more availability.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {overlapSlots.map((slot, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedSlot(slot)}
                    className={`p-3 rounded-lg border text-center transition ${
                      selectedSlot === slot
                        ? "bg-primary-600/20 border-primary-500"
                        : "bg-navy-800 border-navy-700 hover:border-navy-600"
                    }`}
                  >
                    <div className="text-xs text-slate-400">{formatDate(slot.date)}</div>
                    <div className="font-medium text-white">{formatTime(slot.startTime)}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Book Button */}
          {selectedSlot && (
            <div className="p-4 bg-navy-800 rounded-lg mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-slate-400">Selected Time</div>
                  <div className="font-medium text-white">
                    {formatDate(selectedSlot.date)} at {formatTime(selectedSlot.startTime)} - {formatTime(selectedSlot.endTime)}
                  </div>
                </div>
                <button
                  onClick={handleBookCall}
                  disabled={booking}
                  className="px-6 py-2.5 rounded-lg bg-primary-600 hover:bg-primary-500 text-white font-medium transition disabled:opacity-50"
                >
                  {booking ? "Booking..." : "Book Call"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
