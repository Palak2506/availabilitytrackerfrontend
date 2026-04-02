/**
 * Enhanced Calls API with Concurrency-Safe Booking
 * 
 * This module provides concurrency-aware booking operations.
 * The backend uses atomic transactions to prevent double-booking.
 * 
 * Key pattern:
 * - POST /api/calls/book with slot IDs
 * - Backend updates availability slots atomically
 * - If any slot already booked, entire transaction fails
 * - Frontend receives 409 Conflict error
 * - User can retry or select different slots
 */

import { get, post, del } from "./client.js";

/**
 * Book a new call with concurrency safety
 * 
 * POST /api/calls/book
 * 
 * Request body:
 * {
 *   user_slot_id: string (UUID of user's availability slot),
 *   mentor_slot_id: string (UUID of mentor's availability slot),
 *   title: string,
 *   participantEmails: string[] (optional)
 * }
 * 
 * Success (200):
 * {
 *   id: "call-123",
 *   title: "1:1 Mentoring",
 *   userId: "user-1",
 *   mentorId: "mentor-1",
 *   startTime: "2026-04-02T09:00:00Z",
 *   endTime: "2026-04-02T10:00:00Z",
 *   status: "booked"
 * }
 * 
 * Conflict Error (409):
 * {
 *   error: "User slot not available (already booked or invalid)",
 *   code: "SLOT_BOOKED",
 *   status: 409,
 *   timestamp: "2026-04-02T10:30:00Z"
 * }
 * 
 * Timeout Error (503):
 * {
 *   error: "Booking service temporarily unavailable. Please retry.",
 *   code: "TIMEOUT",
 *   status: 503
 * }
 * 
 * @param {object} data - Booking data with slot IDs
 * @returns {Promise} Call record if successful
 * @throws {Error} If slots unavailable (status 409) or server error (status 500/503)
 */
export async function bookCall(data) {
  return post("/api/calls/book", data);
}

/**
 * Book a call using classic endpoint (backward compatibility)
 * 
 * This is the old endpoint format - kept for compatibility
 * New code should use bookCall() instead
 * 
 * @deprecated Use bookCall with { user_slot_id, mentor_slot_id } instead
 */
export async function bookCallLegacy(data) {
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
 * Delete a call (cancels booking)
 * 
 * DELETE /api/calls/:callId
 * 
 * Note: Cancellation also marks availability slots as unbooked,
 * making them available for other users.
 * 
 * @param {string} callId - UUID of call to cancel
 * @returns {Promise} Updated call record with status: 'cancelled'
 */
export async function deleteCall(callId) {
  return del(`/api/calls/${callId}`);
}

/**
 * Get available (unbooked) slots for an entity
 * 
 * GET /api/availability/:entityId/available
 * 
 * Only returns slots where is_booked = false,
 * meaning they're available for booking.
 * 
 * @param {string} entityId - UUID of user or mentor
 * @param {object} params - Query parameters
 * @param {string} params.entityType - 'USER' or 'MENTOR'
 * @param {string} params.startDate - ISO date (YYYY-MM-DD)
 * @param {string} params.endDate - ISO date (YYYY-MM-DD)
 * @returns {Promise} Array of available slots
 */
export async function getAvailableSlots(entityId, params = {}) {
  const q = new URLSearchParams(params).toString();
  return get(`/api/availability/${entityId}/available${q ? `?${q}` : ""}`);
}

/**
 * Get booked slots for an entity
 * 
 * GET /api/availability/:entityId/booked
 * 
 * Shows slots already marked as booked.
 * Useful for calendar displays.
 * 
 * @param {string} entityId - UUID of user or mentor
 * @param {object} params - Query parameters
 * @param {string} params.entityType - 'USER' or 'MENTOR'
 * @param {string} params.startDate - ISO date (YYYY-MM-DD)
 * @param {string} params.endDate - ISO date (YYYY-MM-DD)
 * @returns {Promise} Array of booked slots
 */
export async function getBookedSlots(entityId, params = {}) {
  const q = new URLSearchParams(params).toString();
  return get(`/api/availability/${entityId}/booked${q ? `?${q}` : ""}`);
}
