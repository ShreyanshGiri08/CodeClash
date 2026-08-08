import { apiCall } from "./client";

export function getLeaderboard(page = 1, limit = 20, search = "", minElo = null, maxElo = null) {
  let url = `/leaderboard?page=${page}&limit=${limit}`;
  if (search && search.trim()) url += `&search=${encodeURIComponent(search.trim())}`;
  if (minElo !== null && minElo !== undefined) url += `&min_elo=${minElo}`;
  if (maxElo !== null && maxElo !== undefined) url += `&max_elo=${maxElo}`;
  return apiCall(url);
}

