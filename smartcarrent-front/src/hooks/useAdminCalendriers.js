import { useCallback, useEffect, useState } from 'react';
import { getApiErrorMessage } from '../api/errorUtils';
import {
  createCalendrier,
  deleteCalendrier,
  listCalendriers,
  updateCalendrier,
} from '../services/calendrierService';
import { listReservations } from '../services/reservationService';

/**
 * Construit une entree unifiee a partir d'un calendrier admin.
 * source: 'manual'
 * status: 'disponible' (forced manual avail) | 'indisponible' (manual block)
 */
function calendrierToEntry(calendrier) {
  return {
    id: `calendrier-${calendrier.id}`,
    source: 'manual',
    sourceId: calendrier.id,
    voiture_id: calendrier.voiture_id,
    voiture: calendrier.voiture,
    date_debut: calendrier.date_debut,
    date_fin: calendrier.date_fin,
    status: calendrier.disponible ? 'disponible' : 'indisponible',
    raw: calendrier,
  };
}

/**
 * Construit une entree unifiee a partir d'une reservation (en_attente_paiement ou confirmee).
 * source: 'reservation'
 * status: 'en_attente_paiement' | 'reservee'
 */
function reservationToEntry(reservation) {
  return {
    id: `reservation-${reservation.id}`,
    source: 'reservation',
    sourceId: reservation.id,
    voiture_id: reservation.voiture_id,
    voiture: reservation.voiture,
    date_debut: reservation.date_debut,
    date_fin: reservation.date_fin,
    status: reservation.statut === 'confirmee' ? 'reservee' : 'en_attente_paiement',
    client: reservation.client,
    raw: reservation,
  };
}

export default function useAdminCalendriers() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadEntries = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const [calendriersResponse, reservationsResponse] = await Promise.all([
        listCalendriers({ per_page: 200 }),
        listReservations({ per_page: 200 }),
      ]);

      const calendrierEntries = (calendriersResponse?.data || []).map(calendrierToEntry);

      // Seules les reservations actives (en_attente_paiement, confirmee) bloquent vraiment la voiture
      const reservationEntries = (reservationsResponse?.data || [])
        .filter((r) => r.statut === 'en_attente_paiement' || r.statut === 'confirmee')
        .map(reservationToEntry);

      // Tri : plus recent d'abord (date_debut desc)
      const merged = [...calendrierEntries, ...reservationEntries].sort((a, b) => {
        const aTime = new Date(a.date_debut).getTime();
        const bTime = new Date(b.date_debut).getTime();
        return bTime - aTime;
      });

      setEntries(merged);
    } catch (requestError) {
      setError(
        getApiErrorMessage(requestError, 'Impossible de charger les disponibilites.')
      );
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  // Auto-refresh quand l'utilisateur revient sur l'onglet (apres avoir confirme/annule
  // une reservation depuis une autre page)
  useEffect(() => {
    function handleFocus() {
      loadEntries();
    }
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [loadEntries]);

  const addCalendrier = useCallback(
    async (payload) => {
      const created = await createCalendrier(payload);
      await loadEntries();
      return created;
    },
    [loadEntries]
  );

  const editCalendrier = useCallback(
    async (calendrierId, payload) => {
      const updated = await updateCalendrier(calendrierId, payload);
      await loadEntries();
      return updated;
    },
    [loadEntries]
  );

  const removeCalendrier = useCallback(
    async (calendrierId) => {
      await deleteCalendrier(calendrierId);
      await loadEntries();
    },
    [loadEntries]
  );

  return {
    entries,
    loading,
    error,
    reload: loadEntries,
    addCalendrier,
    editCalendrier,
    removeCalendrier,
  };
}
