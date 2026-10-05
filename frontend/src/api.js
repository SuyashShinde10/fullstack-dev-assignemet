const API_BASE = '/api';

export async function fetchTasks({ query = '', status = '', page = 1, pageSize = 10 }, signal) {
  const params = new URLSearchParams();
  if (query) params.set('q', query);
  if (status) params.set('status', status);
  params.set('page', String(page));
  params.set('pageSize', String(pageSize));

  const url = `${API_BASE}/tasks?${params.toString()}`;
  console.log('[api] fetching:', url);

  const response = await fetch(url, { signal });

  if (!response.ok) {
    let errorDetail = `Request failed: ${response.status}`;
    try {
      const errorJson = await response.json();
      if (errorJson?.error) {
        errorDetail = errorJson.error;
      }
    } catch {
      // Fallback to default message
    }
    throw new Error(errorDetail);
  }

  return response.json();
}
