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