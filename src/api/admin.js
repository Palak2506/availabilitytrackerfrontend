import { get, patch, post } from "./client.js";

export async function listUsers() {
  return get("/api/admin/users");
}

export async function listMentors() {
  return get("/api/admin/mentors");
}

export async function createUser(data) {
  return post("/api/admin/create-user", data);
}

export async function updateMentorMetadata(mentorId, data) {
  return patch(`/api/admin/mentors/${mentorId}/metadata`, data);
}

export async function updateUserMetadata(userId, data) {
  return patch(`/api/admin/users/${userId}/metadata`, data);
}

export async function getRecommendations(userId, callType) {
  return get(`/api/admin/recommend?userId=${userId}&callType=${callType}`);
}

export async function syncEmbeddings() {
  return post("/api/admin/embed/sync");
}

export async function getAvailabilityOverlap(userId, mentorId, weekStart) {
  const q = new URLSearchParams({ userId, mentorId, weekStart }).toString();
  return get(`/api/admin/availability/overlap?${q}`);
}

export async function getAvailabilityForUser(userId, weekStart) {
  const q = weekStart ? `?weekStart=${weekStart}` : "";
  return get(`/api/admin/availability/${userId}${q}`);
}

export async function getOverlappingSlots(userId, startTime, endTime) {
  const q = new URLSearchParams({ startTime, endTime }).toString();
  return get(`/api/admin/availability/${userId}/overlap?${q}`);
}

export async function scheduleMeeting(data) {
  return post("/api/admin/meetings", data);
}
