import { useCallback, useEffect, useState } from 'react';
import { getApiErrorMessage } from '../api/errorUtils';
import { listPaiements } from '../services/paiementService';
import { listReservations } from '../services/reservationService';
import { listUsers } from '../services/userService';
import { listVoitures } from '../services/voitureService';

const INITIAL_STATS = {
  users: 0,
  voitures: 0,
  reservations: 0,
  reservationsEnAttente: 0,
  reservationsConfirmees: 0,
  reservationsTerminees: 0,
  reservationsAnnulees: 0,
  paiements: 0,
  paiementsEnAttente: 0,
  paiementsValides: 0,
  revenus: 0,
};

export default function useAdminStats() {
  const [stats, setStats] = useState(INITIAL_STATS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadStats = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const [usersResponse, voituresResponse, reservationsResponse, paiementsResponse] =
        await Promise.all([
          listUsers({ per_page: 1 }),
          listVoitures({ per_page: 1 }),
          listReservations({ per_page: 200 }),
          listPaiements({ per_page: 200 }),
        ]);

      const reservations = reservationsResponse?.data || [];
      const paiements = paiementsResponse?.data || [];

      // Statuts simplifies : en_cours, terminee, annulee.
      // En attente / Confirmees sont desormais derives du PAIEMENT, pas du statut resa.
      const reservationsEnCours = reservations.filter((r) => r.statut === 'en_cours').length;
      const reservationsEnAttente = reservations.filter(
        (r) => r.statut === 'en_cours' && r.paiement?.statut === 'en_attente'
      ).length;
      const reservationsConfirmees = reservations.filter(
        (r) => r.statut === 'en_cours' && r.paiement?.statut === 'paye'
      ).length;
      const reservationsTerminees = reservations.filter((r) => r.statut === 'terminee').length;
      const reservationsAnnulees = reservations.filter((r) => r.statut === 'annulee').length;

      const paiementsEnAttente = paiements.filter((p) => p.statut === 'en_attente').length;
      const paiementsValides = paiements.filter((p) => p.statut === 'paye').length;

      const revenus = paiements
        .filter((p) => p.statut === 'paye')
        .reduce((sum, p) => sum + Number(p.montant || 0), 0);

      setStats({
        users: usersResponse?.total || 0,
        voitures: voituresResponse?.total || 0,
        reservations: reservationsResponse?.total || reservations.length,
        reservationsEnAttente,
        reservationsConfirmees,
        reservationsTerminees,
        reservationsAnnulees,
        paiements: paiementsResponse?.total || paiements.length,
        paiementsEnAttente,
        paiementsValides,
        revenus,
      });
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Impossible de charger les statistiques admin.'));
      setStats(INITIAL_STATS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  return {
    stats,
    loading,
    error,
    loadStats,
  };
}
