import { get, post, del } from "./client.js";

/**
 * Book a new call with participants
 * POST /api/calls/book
 */
export async function bookCall(data) {
  return post("/api/calls/book", data);
}

/**
 * List all calls
 * GET /api/calls
 */
export async function listCalls(params = {}) {
  const q = new URLSearchParams(params).toString();
  return get(`/api/calls${q ? `?${q}` : ""}`);
}

/**
 * Delete a call
 * DELETE /api/calls/:callId
 */
export async function deleteCall(callId) {
  return del(`/api/calls/${callId}`);
}
