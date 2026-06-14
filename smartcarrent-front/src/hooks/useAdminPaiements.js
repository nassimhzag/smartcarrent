import { useCallback, useEffect, useMemo, useState } from 'react';
import { getApiErrorMessage } from '../api/errorUtils';
import { listPaiements, refundPaiement } from '../services/paiementService';

function isToday(value) {
  if (!value) return false;
  try {
    const d = new Date(value);
    const now = new Date();
    return (
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate()
    );
  } catch (e) {
    return false;
  }
}

/**
 * Hook admin pour la page Suivi des paiements.
 *
 * Logique metier actuelle : un paiement reussi confirme automatiquement la
 * reservation. L'admin n'a donc plus besoin de valider/refuser manuellement
 * un paiement. La seule action restante est le remboursement d'un paiement
 * deja encaisse, qui annule la reservation associee (la voiture redevient
 * disponible automatiquement via l'accessor effective_statut).
 */
export default function useAdminPaiements() {
  const [paiements, setPaiements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadPaiements = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await listPaiements({ per_page: 200 });
      setPaiements(response?.data || []);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Impossible de charger les paiements.'));
      setPaiements([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPaiements();
  }, [loadPaiements]);

  const refund = useCallback(
    async (paiementId) => {
      const updated = await refundPaiement(paiementId);
      await loadPaiements();
      return updated;
    },
    [loadPaiements]
  );

  const stats = useMemo(() => {
    const total = paiements.length;
    const payes = paiements.filter((p) => p.statut === 'paye');
    const rembourses = paiements.filter((p) => p.statut === 'rembourse');
    const aujourdhui = paiements.filter((p) => isToday(p.date_paiement)).length;
    const revenus = payes.reduce((sum, p) => sum + Number(p.montant || 0), 0);
    const montantRembourse = rembourses.reduce(
      (sum, p) => sum + Number(p.montant || 0),
      0
    );

    return {
      total,
      aujourdhui,
      revenus,
      montantRembourse,
    };
  }, [paiements]);

  return {
    paiements,
    loading,
    error,
    stats,
    reload: loadPaiements,
    refund,
  };
}
