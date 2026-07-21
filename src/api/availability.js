import { get, post } from "./client.js";

export async function getWeekly(params = {}, options = {}) {
  const q = new URLSearchParams(params).toString();
  return get(`/api/availability/weekly${q ? `?${q}` : ""}`, options);
}

export async function saveBatch(body) {
  return post("/api/availability/batch", body);
}
