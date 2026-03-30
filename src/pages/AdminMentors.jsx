import { useState, useEffect, useCallback } from "react";
import { Check, X } from "lucide-react";
import * as adminApi from "../api/admin";

const TAG_OPTIONS = [
  { value: "big-tech", label: "Big Tech" },
  { value: "public-company", label: "Public Company" },
  { value: "india", label: "India" },
  { value: "ireland", label: "Ireland" },
  { value: "senior-dev", label: "Senior Developer" },
  { value: "good-communication", label: "Good Communication" },
  { value: "tech", label: "Tech" },
  { value: "non-tech", label: "Non-Tech" },
  { value: "career-coach", label: "Career Coach" },
  { value: "mock-interview", label: "Mock Interview" },
  { value: "startup", label: "Startup" },
  { value: "manager", label: "Manager" },
  { value: "tech-lead", label: "Tech Lead" },
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

export default function AdminMentors() {
  const [mentors, setMentors] = useState([]);
  const [selectedMentor, setSelectedMentor] = useState(null);
  const [editTags, setEditTags] = useState([]);
  const [editDescription, setEditDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const loadMentors = useCallback(async () => {
    try {
      const data = await adminApi.listMentors();
      setMentors(data);
    } catch (e) {
      setError(e.message || "Failed to load mentors");
    }
  }, []);

  useEffect(() => { loadMentors(); }, [loadMentors]);

  const handleSelectMentor = useCallback((mentor) => {
    setSelectedMentor(mentor);
    setEditTags(mentor.tags || []);
    setEditDescription(mentor.description || "");
    setError("");
    setSuccess("");
  }, []);

  const handleSaveMentor = async () => {
    if (!selectedMentor) return;
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const updated = await adminApi.updateMentorMetadata(selectedMentor.id, {
        tags: editTags,
        description: editDescription,
      });
      setSuccess("Mentor updated successfully!");
      setMentors(mentors.map(m => m.id === updated.mentor.id ? updated.mentor : m));
      setSelectedMentor(updated.mentor);
    } catch (e) {
      setError(e.message || "Failed to update mentor");
    } finally {
      setLoading(false);
    }
  };

  const handleSyncEmbeddings = async () => {
    setSyncing(true);
    setError("");
    setSuccess("");
    try {
      await adminApi.syncEmbeddings();
      setSuccess("All mentor embeddings synced!");
    } catch (e) {
      setError(e.message || "Failed to sync embeddings");
    } finally {
      setSyncing(false);
    }
  };

  const toggleTag = useCallback((tagValue) => {
    setEditTags(prev =>
      prev.includes(tagValue) ? prev.filter(t => t !== tagValue) : [...prev, tagValue]
    );
  }, []);

  // Filter mentors based on search
  const filteredMentors = mentors.filter(m => {
    if (!searchQuery) return true;
    const search = searchQuery.toLowerCase();
    return (
      m.name.toLowerCase().includes(search) ||
      m.email.toLowerCase().includes(search) ||
      (m.tags && m.tags.some(t => t.toLowerCase().includes(search)))
    );
  });

  return (
    <div className="max-w-6xl mx-auto">
      {/* Page header */}
      <div className="mb-5">
        <div className="text-heading mb-1" style={{ color: 'var(--color-text-primary)' }}>
          Manage Mentors
        </div>
        <div className="text-body" style={{ color: 'var(--color-text-secondary)' }}>
          Edit mentor tags and descriptions for better AI matching.
        </div>
      </div>

      {/* Actions bar */}
      <div className="flex justify-end mb-4">
        <button
          onClick={handleSyncEmbeddings}
          disabled={syncing}
          className="btn btn-primary"
          style={{ fontSize: '13px', padding: '7px 16px' }}
        >
          {syncing ? "Syncing…" : "Sync All Embeddings"}
        </button>
      </div>

      {/* Feedback banners */}
      {error && (
        <div className="mb-4 p-3 rounded-lg" style={{
          background: 'var(--color-danger-bg)',
          border: '0.5px solid var(--color-danger)',
          color: 'var(--color-danger-dark)',
        }}>
          <X size={14} className="inline mr-1" /> {error}
        </div>
      )}
      {success && (
        <div className="mb-4 p-3 rounded-lg" style={{
          background: 'var(--color-success-bg)',
          border: '0.5px solid var(--color-success)',
          color: 'var(--color-success-dark)',
        }}>
          <Check size={14} className="inline mr-1" /> {success}
        </div>
      )}

      {/* Two-column layout */}
      <div className="grid" style={{ gridTemplateColumns: '400px 1fr', gap: '16px', alignItems: 'start' }}>

        {/* Mentor list */}
        <div className="rounded-xl overflow-hidden" style={{
          background: 'var(--color-card)',
          border: '0.5px solid var(--color-border)',
        }}>
          <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--color-border)' }}>
            <div className="text-label" style={{ fontWeight: 500, color: 'var(--color-text-primary)' }}>
              Mentors
            </div>
            <div className="text-mono" style={{ color: 'var(--color-text-tertiary)', fontSize: '11px' }}>
              {filteredMentors.length} total
            </div>
          </div>
          <div className="max-h-[500px] overflow-y-auto">
            {filteredMentors.map((mentor, i) => {
              const av = AV_COLORS[i % AV_COLORS.length];
              const isSelected = selectedMentor?.id === mentor.id;
              return (
                <button
                  key={mentor.id}
                  onClick={() => handleSelectMentor(mentor)}
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
                      {getInitials(mentor.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-label" style={{ fontWeight: 500, color: 'var(--color-text-primary)' }}>
                        {mentor.name}
                      </div>
                      <div className="text-mono" style={{ color: 'var(--color-text-tertiary)', fontSize: '10px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {mentor.email}
                      </div>
                      {mentor.tags?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {mentor.tags.slice(0, 4).map((tag) => (
                            <span key={tag} className="text-mono px-1.5 py-0.5 rounded-full" style={{ fontSize: '9px', background: 'var(--tag-tech-bg)', color: 'var(--tag-tech-text)' }}>
                              {tag}
                            </span>
                          ))}
                          {mentor.tags.length > 4 && (
                            <span className="text-mono px-1.5 py-0.5 rounded-full" style={{ fontSize: '9px', background: 'var(--tag-neutral-bg)', color: 'var(--tag-neutral-text)' }}>
                              +{mentor.tags.length - 4}
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
        <div className="rounded-xl p-5" style={{
          background: 'var(--color-card)',
          border: '0.5px solid var(--color-border)',
        }}>
          {selectedMentor ? (
            <>
              <div className="flex items-center gap-3 mb-5">
                <div style={{
                  width: '44px', height: '44px', borderRadius: '50%',
                  background: AV_COLORS[mentors.indexOf(selectedMentor) % AV_COLORS.length].bg,
                  color: AV_COLORS[mentors.indexOf(selectedMentor) % AV_COLORS.length].color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '16px', fontWeight: 500,
                }}>
                  {getInitials(selectedMentor.name)}
                </div>
                <div>
                  <div className="text-heading" style={{ color: 'var(--color-text-primary)', marginBottom: '2px' }}>
                    {selectedMentor.name}
                  </div>
                  <div className="text-mono" style={{ color: 'var(--color-text-tertiary)', fontSize: '11px' }}>
                    {selectedMentor.email}
                  </div>
                </div>
              </div>

              {/* Tags */}
              <div className="mb-5">
                <div className="text-caption mb-3">Tags</div>
                <div className="flex flex-wrap gap-2">
                  {TAG_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => toggleTag(option.value)}
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
                  placeholder="Describe the mentor's background, expertise, and what they can help with…"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={handleSaveMentor}
                  disabled={loading}
                  className="btn btn-primary"
                  style={{ padding: '8px 20px' }}
                >
                  {loading ? "Saving…" : "Save changes"}
                </button>
                {success && (
                  <span className="text-label" style={{ color: 'var(--color-success)', display: 'flex', alignItems: 'center' }}>
                    <span className="flex items-center gap-1"><Check size={14} /> {success}</span>
                  </span>
                )}
              </div>
            </>
          ) : (
            <div className="h-full min-h-[400px] flex items-center justify-center">
              <div className="text-center">
                <div style={{
                  width: '48px', height: '48px', borderRadius: '50%',
                  background: 'var(--color-border-light)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 16px',
                }}>
                  <svg width="20" height="20" viewBox="0 0 16 16" fill="none" stroke="var(--color-text-tertiary)" strokeWidth="1.5">
                    <path d="M12 7a3 3 0 11-6 0 3 3 0 016 0z"/>
                    <path d="M4 14a5 5 0 0110 0"/>
                    <path d="M14 12a3 3 0 00-3-3"/>
                  </svg>
                </div>
                <div className="text-heading mb-1" style={{ color: 'var(--color-text-primary)' }}>
                  Select a mentor
                </div>
                <div className="text-body" style={{ color: 'var(--color-text-secondary)' }}>
                  Click a mentor on the left to edit their profile
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
