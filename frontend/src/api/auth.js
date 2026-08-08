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

export function startCfVerification(handle) {
  return apiCall(`/cf/start-verification?handle=${encodeURIComponent(handle)}`, { method: "POST" });
}

export function confirmCfVerification() {
  return apiCall("/cf/confirm-verification", { method: "POST" });
}