import { useCallback, useEffect, useMemo, useState } from 'react';
import { getApiErrorMessage } from '../api/errorUtils';
import {
  confirmPaiement,
  listPaiements,
  refundPaiement,
  rejectPaiement,
} from '../services/paiementService';

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

  const reject = useCallback(
    async (paiementId) => {
      const updated = await rejectPaiement(paiementId);
      await loadPaiements();
      return updated;
    },
    [loadPaiements]
  );

  const confirmCash = useCallback(
    async (paiementId) => {
      const updated = await confirmPaiement(paiementId);
      await loadPaiements();
      return updated;
    },
    [loadPaiements]
  );

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
    const enAttente = paiements.filter((p) => p.statut === 'en_attente').length;
    const payes = paiements.filter((p) => p.statut === 'paye');
    const aujourdhui = paiements.filter((p) => isToday(p.date_paiement)).length;
    const revenus = payes.reduce((sum, p) => sum + Number(p.montant || 0), 0);

    return {
      total,
      enAttente,
      aujourdhui,
      revenus,
    };
  }, [paiements]);

  return {
    paiements,
    loading,
    error,
    stats,
    reload: loadPaiements,
    reject,
    refund,
    confirmCash,
  };
}
