const BASE = import.meta.env.VITE_API_URL || '/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw Object.assign(new Error(err.error || 'Request failed'), { status: res.status });
  }
  return res.json();
}

export const api = {
  getNovels: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/novels${qs ? `?${qs}` : ''}`);
  },
  getNovel: (slug) => request(`/novels/${slug}`),
  createNovel: (data) => request('/novels', { method: 'POST', body: data }),
  updateNovel: (id, data) => request(`/novels/${id}`, { method: 'PATCH', body: data }),

  getChapters: (novelSlug, params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/chapters/${novelSlug}${qs ? `?${qs}` : ''}`);
  },
  getChapter: (novelSlug, chapterSlug) => request(`/chapters/${novelSlug}/${chapterSlug}`),

  search: (q) => request(`/search?q=${encodeURIComponent(q)}`),

  getQueueStatus: () => request('/queue/status'),
  addToQueue: (data) => request('/queue', { method: 'POST', body: data }),

  getAnalyticsOverview: () => request('/analytics/overview'),
  getTopNovels: () => request('/analytics/top-novels'),
};
