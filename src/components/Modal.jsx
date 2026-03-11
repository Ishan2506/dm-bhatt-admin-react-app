import { h } from 'preact';

export function Modal({ title, onClose, children, footer }) {
    return (
        <div class="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <div class="modal">
                <div class="modal-header">
                    <h3>{title}</h3>
                    <button class="modal-close" onClick={onClose}>&times;</button>
                </div>
                <div class="modal-body">
                    {children}
                </div>
                {footer && (
                    <div class="modal-footer">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
}
