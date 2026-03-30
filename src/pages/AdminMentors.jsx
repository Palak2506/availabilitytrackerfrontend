import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
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
];

export default function AdminMentors() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [mentors, setMentors] = useState([]);
  const [selectedMentor, setSelectedMentor] = useState(null);
  const [editTags, setEditTags] = useState([]);
  const [editDescription, setEditDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [syncing, setSyncing] = useState(false);

  const loadMentors = useCallback(async () => {
    try {
      const data = await adminApi.listMentors();
      setMentors(data);
    } catch (e) {
      setError(e.message || "Failed to load mentors");
    }
  }, []);

  useEffect(() => {
    loadMentors();
  }, [loadMentors]);

  const handleSelectMentor = (mentor) => {
    setSelectedMentor(mentor);
    setEditTags(mentor.tags || []);
    setEditDescription(mentor.description || "");
    setError("");
    setSuccess("");
  };

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

  const toggleTag = (tagValue) => {
    if (editTags.includes(tagValue)) {
      setEditTags(editTags.filter(t => t !== tagValue));
    } else {
      setEditTags([...editTags, tagValue]);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-white mb-2">Manage Mentors</h1>
        <p className="text-slate-400">Edit mentor tags and descriptions. Changes automatically sync embeddings.</p>
      </div>

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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Mentor List */}
        <div className="bg-navy-900 border border-navy-700 rounded-xl p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-white">Mentors</h2>
            <button
              onClick={handleSyncEmbeddings}
              disabled={syncing}
              className="px-3 py-1.5 text-sm bg-primary-600 hover:bg-primary-500 rounded-lg text-white transition disabled:opacity-50"
            >
              {syncing ? "Syncing..." : "Sync All Embeddings"}
            </button>
          </div>
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {mentors.map((mentor) => (
              <button
                key={mentor.id}
                onClick={() => handleSelectMentor(mentor)}
                className={`w-full text-left p-3 rounded-lg border transition ${
                  selectedMentor?.id === mentor.id
                    ? "bg-primary-600/20 border-primary-500"
                    : "bg-navy-800 border-navy-700 hover:border-navy-600"
                }`}
              >
                <div className="font-medium text-white">{mentor.name}</div>
                <div className="text-sm text-slate-400">{mentor.email}</div>
                {mentor.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {mentor.tags.slice(0, 4).map((tag) => (
                      <span key={tag} className="text-xs px-2 py-0.5 bg-navy-700 rounded-full text-slate-300">
                        {tag}
                      </span>
                    ))}
                    {mentor.tags.length > 4 && (
                      <span className="text-xs px-2 py-0.5 bg-navy-700 rounded-full text-slate-300">
                        +{mentor.tags.length - 4}
                      </span>
                    )}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Edit Form */}
        <div className="bg-navy-900 border border-navy-700 rounded-xl p-6">
          {selectedMentor ? (
            <>
              <h2 className="text-lg font-medium text-white mb-4">
                Edit: {selectedMentor.name}
              </h2>

              {/* Tags */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Tags
                </label>
                <div className="flex flex-wrap gap-2">
                  {TAG_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => toggleTag(option.value)}
                      className={`px-3 py-1.5 rounded-full text-sm transition ${
                        editTags.includes(option.value)
                          ? "bg-primary-600 text-white"
                          : "bg-navy-800 text-slate-400 hover:bg-navy-700"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Description
                </label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2.5 rounded-lg bg-navy-800 border border-navy-600 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Describe the mentor's background, expertise, and what they can help with..."
                />
              </div>

              <button
                onClick={handleSaveMentor}
                disabled={loading}
                className="w-full py-2.5 rounded-lg bg-primary-600 hover:bg-primary-500 text-white font-medium transition disabled:opacity-50"
              >
                {loading ? "Saving..." : "Save Changes"}
              </button>
            </>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-500">
              Select a mentor to edit their profile
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
