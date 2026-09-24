import { io } from 'socket.io-client';

// Socket.IO lives on the API server's origin (API_BASE is ".../api").
const API_BASE = (import.meta.env.API_BASE || '').trim();

const socketOrigin = () => {
    try {
        return API_BASE ? new URL(API_BASE, window.location.origin).origin : window.location.origin;
    } catch {
        return window.location.origin;
    }
};

let socket = null;

/** Shared Live Arena socket, authenticated with the admin's login token. */
export function getLiveSocket() {
    if (socket) return socket;
    socket = io(socketOrigin(), {
        // Read on every (re)connect so a fresh login is picked up.
        auth: (cb) => cb({ token: localStorage.getItem('token') }),
        transports: ['websocket', 'polling'],
    });
    return socket;
}
