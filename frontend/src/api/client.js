const BASE_URL = import.meta.env.VITE_API_URL || "/api";


export async function apiCall(endpoint, options = {}) {
  const token = localStorage.getItem("token");
  let res;
  try {
    res = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });
  } catch (err) {
    throw new Error("Unable to reach CodeClash server. Retrying connection...");
  }

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const err = await res.json();
      if (typeof err.detail === "string") {
        message = err.detail;
      } else if (Array.isArray(err.detail)) {
        message = err.detail.map((e) => e.msg || e.detail || JSON.stringify(e)).join("; ");
      } else if (err.message && typeof err.message === "string") {
        message = err.message;
      } else if (err.detail) {
        message = JSON.stringify(err.detail);
      }
    } catch (e) {
      const text = await res.text().catch(() => "");
      if (text) message = text;
    }
    throw new Error(message);
  }

  return res.json();
}