const API_BASE = (import.meta.env.API_BASE || '').trim();
const BASE_URL = API_BASE + '/superadmin';

async function request(method, path, body, options = {}) {
    const token = localStorage.getItem('token');
    const url = options.noPrefix ? `${API_BASE}${path}` : `${BASE_URL}${path}`;

    const isFormData = body instanceof FormData;

    const opts = {
        method,
        headers: { 
            ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
    };
    
    if (body) {
        opts.body = isFormData ? body : JSON.stringify(body);
    }

    const res = await fetch(url, opts);
        
    // Handle unauthorized response
        if (res.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/';
            throw new Error('Unauthorized. Please login again.');
        }

        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Request failed');
        return data;
}

export const api = {
    get: (path, opts) => request('GET', path, null, opts),
    post: (path, body, opts) => request('POST', path, body, opts),
    put: (path, body, opts) => request('PUT', path, body, opts),
    del: (path, opts) => request('DELETE', path, null, opts),
};
