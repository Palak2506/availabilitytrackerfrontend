import { post } from "./client.js";

export async function login(data) {
  return post("/api/auth/login", data);
}

export async function me() {
  return fetch("/api/auth/me", {
    headers: {
      "Authorization": `Bearer ${localStorage.getItem("token") || sessionStorage.getItem("token")}`,
    },
  }).then(res => {
    if (!res.ok) throw new Error("Not authenticated");
    return res.json();
  });
}
