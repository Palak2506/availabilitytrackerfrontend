import { api, get, post } from "./client.js";

export async function register(data) {
  // Don't redirect on 401 during registration - that's auth failure, not session expiry
  return api("POST", "/api/auth/register", data, { skipAuthRedirect: true });
}

export async function login(data) {
  // Don't redirect on 401 during login - that's invalid credentials, not session expiry
  // This prevents infinite redirects when credentials are wrong
  return api("POST", "/api/auth/login", data, { skipAuthRedirect: true });
}

export async function me() {
  return api("GET", `/api/auth/me?_=${Date.now()}`, null, { skipAuthRedirect: true });
}

export async function getGoogleAuthUrl() {
  const { url } = await get("/api/auth/google");
  return url;
}

export async function disconnectGoogle() {
  return post("/api/auth/google/disconnect");
}
