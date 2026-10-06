const apiBaseUrl = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1").replace(/\/$/, "");

export async function requestPublicApi(path: string, init?: RequestInit): Promise<Response> {
  const normalizedPath = path.replace(/^\/+/, "");
  const response = await fetch(`${apiBaseUrl}/${normalizedPath}`, {
    ...init,
    headers: {
      Accept: "application/json",
      ...init?.headers
    }
  });

  if (!response.ok) {
    throw new Error(`Public API request failed with status ${response.status}.`);
  }

  return response;
}
