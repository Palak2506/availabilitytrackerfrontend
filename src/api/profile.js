import { get, put } from "./client.js";

export async function getUserProfile() {
  return get("/api/users/me/profile");
}

export async function updateUserProfile(data) {
  return put("/api/users/me/profile", data);
}

export async function getMentorProfile() {
  return get("/api/mentors/me/profile");
}

export async function updateMentorProfile(data) {
  return put("/api/mentors/me/profile", data);
}
