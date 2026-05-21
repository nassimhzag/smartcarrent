import { useCallback, useEffect, useMemo, useState } from 'react';
import { getApiErrorMessage } from '../api/errorUtils';
import {
  listNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from '../services/notificationService';

/**
 * Extrait de maniere defensive un tableau de notifications quel que soit
 * le format renvoye par l'API :
 *   - { notifications: { data: [...], current_page, ... }, unread_count }  (Laravel paginate)
 *   - { notifications: [...] }
 *   - { data: [...] }
 *   - [...]
 *   - null / autre               => tableau vide
 */
function extractNotifications(response) {
  if (!response) return [];

  // Cas 1 : response.notifications est un paginator Laravel { data, ... }
  if (response.notifications && Array.isArray(response.notifications.data)) {
    return response.notifications.data;
  }

  // Cas 2 : response.notifications est deja un tableau
  if (Array.isArray(response.notifications)) {
    return response.notifications;
  }

  // Cas 3 : response.data est un tableau (paginate brut)
  if (Array.isArray(response.data)) {
    return response.data;
  }

  // Cas 4 : response.data.data (paginate sans wrapper)
  if (response.data && Array.isArray(response.data.data)) {
    return response.data.data;
  }

  // Cas 5 : response est deja un tableau
  if (Array.isArray(response)) {
    return response;
  }

  return [];
}

function extractUnreadCount(response, fallbackList) {
  // L'API expose explicitement unread_count, on l'utilise en priorite.
  if (response && typeof response.unread_count === 'number') {
    return response.unread_count;
  }
  // Sinon on calcule depuis la liste.
  if (Array.isArray(fallbackList)) {
    return fallbackList.filter((n) => n && !n.read_at).length;
  }
  return 0;
}

/**
 * Hook pour gerer les notifications du user connecte.
 *  - charge la liste au montage et au focus de la fenetre
 *  - fournit unreadCount, markRead, markAllRead
 *  - tolerant aux erreurs (si l'API tombe, on a un etat vide propre)
 *  - notifications est TOUJOURS un tableau
 */
export default function useNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadFromApi, setUnreadFromApi] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await listNotifications({ per_page: 30 });
      const items = extractNotifications(response);
      setNotifications(items);

      if (response && typeof response.unread_count === 'number') {
        setUnreadFromApi(response.unread_count);
      } else {
        setUnreadFromApi(null);
      }
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Impossible de charger les notifications.'));
      setNotifications([]);
      setUnreadFromApi(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Recharge quand l'utilisateur revient sur l'onglet.
  useEffect(() => {
    function handleFocus() {
      load();
    }
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [load]);

  // Compteur fiable : on prefere la valeur de l'API si elle est presente,
  // sinon on calcule depuis le state local. On garde Array.isArray comme garde
  // ultime pour ne JAMAIS planter sur .filter().
  const unreadCount = useMemo(() => {
    if (typeof unreadFromApi === 'number') return unreadFromApi;
    if (!Array.isArray(notifications)) return 0;
    return notifications.filter((n) => n && !n.read_at).length;
  }, [unreadFromApi, notifications]);

  const markRead = useCallback(
    async (notificationId) => {
      // Optimistic UI : on marque localement immediat, puis on appelle l'API.
      setNotifications((prev) => {
        if (!Array.isArray(prev)) return [];
        return prev.map((n) =>
          n && n.id === notificationId && !n.read_at
            ? { ...n, read_at: new Date().toISOString() }
            : n
        );
      });
      // Decremente le compteur API si on l'utilise
      setUnreadFromApi((prev) =>
        typeof prev === 'number' ? Math.max(0, prev - 1) : prev
      );
      try {
        const response = await markNotificationAsRead(notificationId);
        if (response && typeof response.unread_count === 'number') {
          setUnreadFromApi(response.unread_count);
        }
      } catch (e) {
        // En cas d'echec, on recharge la liste pour reconcilier l'etat.
        load();
      }
    },
    [load]
  );

  const markAllRead = useCallback(async () => {
    const now = new Date().toISOString();
    setNotifications((prev) => {
      if (!Array.isArray(prev)) return [];
      return prev.map((n) => (n && n.read_at ? n : { ...n, read_at: now }));
    });
    setUnreadFromApi(0);
    try {
      const response = await markAllNotificationsAsRead();
      if (response && typeof response.unread_count === 'number') {
        setUnreadFromApi(response.unread_count);
      }
    } catch (e) {
      load();
    }
  }, [load]);

  // Securite finale : `notifications` exposee au composant est TOUJOURS un array.
  const safeNotifications = Array.isArray(notifications) ? notifications : [];

  return {
    notifications: safeNotifications,
    loading,
    error,
    unreadCount,
    reload: load,
    markRead,
    markAllRead,
  };
}
