import { get, post, put } from "./client.js";

export async function listUsers() {
  return get("/api/admin/users");
}

export async function listMentors() {
  return get("/api/admin/mentors");
}

export async function createUser(data) {
  return post("/api/admin/create-user", data);
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

export async function updateAdminUser(id, data) {
  return put(`/api/admin/users/${id}`, data);
}

export async function updateAdminMentor(id, data) {
  return put(`/api/admin/mentors/${id}`, data);
}

export async function getRecommendations(userId) {
  return get(`/api/admin/recommendations?userId=${userId}`);
}

export async function getAiRecommendations(userId) {
  return post("/api/admin/recommend", { userId });
}
