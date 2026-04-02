import { get, post } from "./client.js";

/**
 * Fetch weekly availability. Supports unified schema by accepting
 * entity_id and entity_type in params (optional for backward compatibility).
 * params may include: { weekStart, entity_id, entity_type }
 */
export async function getWeekly(params = {}) {
  const q = new URLSearchParams(params).toString();
  return get(`/api/availability/weekly${q ? `?${q}` : ""}`);
}

/**
 * Save a batch of slots for an entity. Include entity metadata to target
 * the correct owner on the server. Payload shape:
 * { slots: [...], entity_id?: string, entity_type?: string }
 * For backward compatibility, entity fields are optional.
 */
export async function saveBatch(slots, entity = {}) {
  const body = { slots };
  if (entity && entity.entity_id) body.entity_id = entity.entity_id;
  if (entity && entity.entity_type) body.entity_type = entity.entity_type;
  return post("/api/availability/batch", body);
}
