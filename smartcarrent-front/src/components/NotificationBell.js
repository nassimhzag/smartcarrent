import { useEffect, useRef, useState } from 'react';
import useNotifications from '../hooks/useNotifications';
import { useAuth } from '../auth/AuthContext';

function IconBell({ hasUnread }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 16v-5a6 6 0 0 0-12 0v5l-2 2v1h16v-1l-2-2z" />
      <path d="M10 21a2 2 0 0 0 4 0" />
      {hasUnread && <circle cx="18.5" cy="6" r="3" fill="#e11d48" stroke="none" />}
    </svg>
  );
}

function timeAgo(value) {
  if (!value) return '';
  try {
    const d = new Date(value);
    const diff = Date.now() - d.getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return "a l'instant";
    if (m < 60) return `il y a ${m} min`;
    const h = Math.floor(m / 60);
    if (h < 24) return `il y a ${h} h`;
    const days = Math.floor(h / 24);
    if (days < 7) return `il y a ${days} j`;
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch (e) {
    return '';
  }
}

function eventDotClass(event) {
  if (event === 'created') return 'notif-dot tone-info';
  if (event === 'status_changed') return 'notif-dot tone-ok';
  if (event === 'cancelled') return 'notif-dot tone-danger';
  if (event === 'new_client') return 'notif-dot tone-info';
  if (event === 'voiture_maintenance') return 'notif-dot tone-warn';
  return 'notif-dot tone-muted';
}

function eventFallbackTitle(event) {
  if (event === 'created') return 'Nouvelle reservation';
  if (event === 'status_changed') return 'Mise a jour reservation';
  if (event === 'cancelled') return 'Reservation annulee';
  if (event === 'new_client') return 'Nouveau client';
  if (event === 'voiture_maintenance') return 'Voiture en maintenance';
  return 'Notification';
}

/**
 * Cloche de notifications + dropdown.
 * S'affiche uniquement si un utilisateur est connecte.
 */
export default function NotificationBell({ align = 'right' }) {
  const { isAuthenticated } = useAuth();
  const { notifications: rawNotifications, loading, unreadCount, markRead, markAllRead } =
    useNotifications();
  // Garde finale : meme si le hook plante, on rend toujours un tableau au render.
  const notifications = Array.isArray(rawNotifications) ? rawNotifications : [];
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  // Fermer si clic en dehors
  useEffect(() => {
    if (!open) return;
    function handleClick(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    function handleKey(event) {
      if (event.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  if (!isAuthenticated) return null;

  function handleItemClick(notification) {
    if (!notification.read_at) {
      markRead(notification.id);
    }
  }

  return (
    <div className="notif-bell-wrap" ref={containerRef}>
      <button
        type="button"
        className={`notif-bell${unreadCount > 0 ? ' has-unread' : ''}`}
        onClick={() => setOpen((prev) => !prev)}
        aria-label={`Notifications (${unreadCount} non lues)`}
        aria-expanded={open}
      >
        <IconBell hasUnread={unreadCount > 0} />
        {unreadCount > 0 && (
          <span className="notif-bell-badge" aria-hidden="true">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className={`notif-dropdown notif-dropdown-${align}`}
          role="dialog"
          aria-label="Notifications"
        >
          <header className="notif-dropdown-head">
            <h4>Notifications</h4>
            {unreadCount > 0 && (
              <button
                type="button"
                className="notif-link-btn"
                onClick={() => markAllRead()}
              >
                Tout marquer lu
              </button>
            )}
          </header>

          {loading ? (
            <div className="notif-empty">
              <span className="admin-spinner" aria-hidden="true" />
              <span>Chargement...</span>
            </div>
          ) : notifications.length === 0 ? (
            <div className="notif-empty">
              <p style={{ margin: 0 }}>Aucune notification pour le moment.</p>
            </div>
          ) : (
            <ul className="notif-list">
              {notifications.map((notification) => {
                if (!notification) return null;
                // notification.data peut etre un objet, un JSON string, ou null/undefined
                let data = notification.data;
                if (typeof data === 'string') {
                  try {
                    data = JSON.parse(data);
                  } catch (e) {
                    data = {};
                  }
                }
                if (!data || typeof data !== 'object') data = {};
                const event = data.event || 'default';
                const title = data.title || eventFallbackTitle(event);
                const message = data.message;
                const isUnread = !notification.read_at;
                return (
                  <li
                    key={notification.id}
                    className={`notif-item${isUnread ? ' is-unread' : ''}`}
                    onClick={() => handleItemClick(notification)}
                  >
                    <span className={eventDotClass(event)} aria-hidden="true" />
                    <div className="notif-item-body">
                      <div className="notif-item-head">
                        <strong>{title}</strong>
                        <span className="notif-item-time">{timeAgo(notification.created_at)}</span>
                      </div>
                      {message && <p className="notif-item-message">{message}</p>}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
