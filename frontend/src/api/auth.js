import { apiCall } from "./client";

export function signup(email, password) {
  return apiCall("/auth/signup", { method: "POST", body: JSON.stringify({ email, password }) });
}

export function login(email, password) {
  return apiCall("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
}

export function getMe() {
  return apiCall("/me");
}

export function updateProfile(data) {
  return apiCall("/me", { method: "PATCH", body: JSON.stringify(data) });
}

export function startCfVerification(handle) {
  return apiCall("/cf/start-verification", {
    method: "POST",
    body: JSON.stringify({ handle }),
  });
}

export function confirmCfVerification() {
  return apiCall("/cf/confirm-verification", { method: "POST" });
}

export function getRatingHistory(userId) {
  return apiCall(`/users/${userId}/rating-history`);
}

export function getRaceHistory() {
  return apiCall("/races/history");
}