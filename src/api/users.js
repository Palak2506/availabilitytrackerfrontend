import { get, patch } from "./client.js";

export async function getProfile() {
  return get("/api/users/me");
}

export async function updateProfile(data) {
  return patch("/api/users/me/profile", data);
}
