import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import {
  getUserProfile,
  updateUserProfile,
  getMentorProfile,
  updateMentorProfile,
} from "../api/profile";

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const isMentor = user?.role === "MENTOR";

  useEffect(() => {
    async function loadProfile() {
      try {
        setLoading(true);
        const data = isMentor ? await getMentorProfile() : await getUserProfile();
        setDescription(data.description || "");
        setTags(data.tags || []);
      } catch (err) {
        setError(err.message || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    }
    if (user) {
      loadProfile();
    }
  }, [user, isMentor]);

  const handleAddTag = (e) => {
    e.preventDefault();
    const val = tagInput.trim();
    if (val && !tags.includes(val)) {
      setTags([...tags, val]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError("");
      setSuccess("");
      const payload = { description, tags };
      if (isMentor) {
        await updateMentorProfile(payload);
      } else {
        await updateUserProfile(payload);
      }
      setSuccess("Profile updated successfully!");
      await refreshUser();
    } catch (err) {
      setError(err.message || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-slate-400 animate-pulse">Loading profile data...</div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mq-card p-6 sm:p-8">
        <h1 className="text-2xl font-bold text-ink-50 mb-2">Edit Profile</h1>
        <p className="text-sm text-ink-400 mb-6">
          Update your description and professional tags to help us personalize your experience.
        </p>

        {error && (
          <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 rounded-lg bg-green-500/10 border border-green-500/20 p-3 text-sm text-green-400">
            {success}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          <div>
            <label htmlFor="description" className="mq-label">Description</label>
            <textarea
              id="description"
              className="w-full min-h-[120px] rounded-lg bg-navy-800 border border-white/[0.1] text-sm p-3 focus:outline-none focus:ring-2 focus:ring-white/15 focus:border-white/20 text-ink-50"
              placeholder={
                isMentor
                  ? "Describe your area of expertise, background, and how you can help..."
                  : "Tell mentors about your background and what you are looking to learn..."
              }
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div>
            <label className="mq-label">Tags</label>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                className="mq-input flex-1"
                placeholder="e.g. Frontend, DSA, Resume Review"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddTag(e);
                  }
                }}
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="mq-btn-secondary h-10 px-4 shrink-0"
              >
                Add
              </button>
            </div>

            <div className="flex flex-wrap gap-2 min-h-[40px] p-2 rounded-lg border border-white/[0.05] bg-white/[0.01]">
              {tags.length === 0 ? (
                <span className="text-xs text-ink-600 self-center pl-2">No tags added yet.</span>
              ) : (
                tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.04] pl-3 pr-2 py-1 text-xs text-ink-200"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="inline-flex h-4 w-4 items-center justify-center rounded-full hover:bg-white/10 text-ink-400 hover:text-ink-50"
                      aria-label={`Remove tag ${tag}`}
                    >
                      ✕
                    </button>
                  </span>
                ))
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-white/[0.06]">
            <button
              type="submit"
              disabled={saving}
              className="mq-btn-primary"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
