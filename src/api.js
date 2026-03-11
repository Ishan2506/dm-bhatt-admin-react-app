const BASE_URL = (import.meta.env.API_BASE || '').trim() + '/superadmin';

async function request(method, path, body) {
    const token = localStorage.getItem('token');
    
    const opts = {
        method,
        headers: { 
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
    };
    if (body) opts.body = JSON.stringify(body);

    const res = await fetch(`${BASE_URL}${path}`, opts);
    
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
    get: (path) => request('GET', path),
    post: (path, body) => request('POST', path, body),
    put: (path, body) => request('PUT', path, body),
    del: (path) => request('DELETE', path),
};
