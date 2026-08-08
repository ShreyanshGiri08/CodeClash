import { apiCall } from "./client";

export function createChallenge(params = 1200) {
  const payload = typeof params === "object" ? params : { problem_rating: params };
  return apiCall("/challenges/create", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}


export function getChallenge(token) {
  return apiCall(`/challenges/${token}`);
}

export function joinChallenge(token) {
  return apiCall(`/challenges/${token}/join`, { method: "POST" });
}
