export const API_BASE =
  (process.env.NEXT_PUBLIC_API_BASE || "/php-api").replace(/\/+$/, "");

export function apiUrl(endpoint: string): string {
  const clean = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  return `${API_BASE}${clean}`;
}

export async function apiFetch(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const headers = new Headers(options.headers || {});
  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  return fetch(apiUrl(endpoint), {
    ...options,
    headers,
    credentials: "include",
  });
}
