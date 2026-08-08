import { apiCall } from "./client";

export function joinQueue() {
  return apiCall("/races/queue", { method: "POST" });
}

export function leaveQueue() {
  return apiCall("/races/queue", { method: "DELETE" });
}

export function getRace(raceId) {
  return apiCall(`/races/${raceId}`);
}

export function checkRaceStatus(raceId) {
  return apiCall(`/races/${raceId}/check`, { method: "POST" });
}

export function getProblem(raceId) {
  return apiCall(`/races/${raceId}/problem`);
}