/**
 * Wrapper around fetch that adds Bearer token and handles 401 redirects
 * @param {string} url - API URL
 * @param {object} [options] - Fetch options
 * @returns {Promise<Response>}
 */
export default async function fetchWithAuth(url, options = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const headers = {
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Add Content-Type for JSON bodies if not already set
  if (options.body && typeof options.body === 'string' && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(url, { ...options, headers });

  if (res.status === 401 && typeof window !== 'undefined') {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
    return res;
  }

  return res;
}
