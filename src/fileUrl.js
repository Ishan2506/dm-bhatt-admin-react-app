// Single source of truth for turning a stored file path into a loadable URL.
//
// The API stores multer paths relative to its own root (e.g. "uploads/materials/x.pdf"),
// and Cloudinary uploads as absolute https URLs. SERVER_ROOT must never be an http://
// origin while the admin panel is served over https, or the browser blocks the request
// as mixed content. Leaving API_BASE relative ("/api") keeps everything same-origin.
const SERVER_ROOT = (import.meta.env?.API_BASE || '').trim().replace(/\/api\/?$/, '');

export const getFileUrl = (path) => {
    if (!path) return '';
    if (/^https?:\/\//i.test(path)) return path;
    const clean = path.replace(/\\/g, '/').replace(/^\/+/, '');
    return `${SERVER_ROOT}/${clean}`;
};

export const getFileName = (path) => (path ? path.split('/').pop() : '');

export const isImage = (path) =>
    !!path && /\.(png|jpe?g|gif|webp|svg)$/i.test(path);
