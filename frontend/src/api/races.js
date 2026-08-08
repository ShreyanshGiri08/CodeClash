import { apiCall } from "./client";

export function joinQueue() {
  return apiCall("/races/queue", { method: "POST" });
}

export function getQueueStatus() {
  return apiCall("/races/queue/status");
}

export function getQueueStats() {
  return apiCall("/races/queue/stats");
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

export function getVerdicts(raceId) {
  return apiCall(`/races/${raceId}/verdicts`);
}

export function forfeitRace(raceId) {
  return apiCall(`/races/${raceId}/forfeit`, { method: "POST" });
}