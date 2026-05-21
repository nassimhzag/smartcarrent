import { useCallback, useEffect, useState } from 'react';
import { getApiErrorMessage } from '../api/errorUtils';
import { deleteClient, listClients, updateClient } from '../services/clientService';

export default function useAdminClients() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadClients = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await listClients();
      setClients(response?.data || []);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Impossible de charger les clients.'));
      setClients([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadClients();
  }, [loadClients]);

  const editClient = useCallback(
    async (clientId, payload) => {
      const updated = await updateClient(clientId, payload);
      await loadClients();
      return updated;
    },
    [loadClients]
  );

  const removeClient = useCallback(
    async (clientId) => {
      await deleteClient(clientId);
      await loadClients();
    },
    [loadClients]
  );

  return {
    clients,
    loading,
    error,
    reload: loadClients,
    editClient,
    removeClient,
  };
}
