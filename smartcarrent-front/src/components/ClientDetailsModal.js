function formatDate(value) {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch (error) {
    return String(value);
  }
}

function diffInDays(start, end) {
  if (!start || !end) return 0;
  const a = new Date(start);
  const b = new Date(end);
  const diff = Math.ceil((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(diff + 1, 1);
}

function statutLabel(statut) {
  if (statut === 'en_attente_paiement') return 'En attente paiement';
  if (statut === 'confirmee') return 'Confirmee';
  if (statut === 'annulee') return 'Annulee';
  if (statut === 'terminee') return 'Terminee';
  return statut || '—';
}

function statutBadgeClass(statut) {
  if (statut === 'en_attente_paiement') return 'badge badge-warn';
  if (statut === 'confirmee') return 'badge badge-ok';
  if (statut === 'annulee') return 'badge badge-danger';
  if (statut === 'terminee') return 'badge badge-info';
  return 'badge';
}

function getInitials(name) {
  if (!name) return '?';
  const parts = String(name).trim().split(/\s+/);
  return parts.slice(0, 2).map((p) => p[0]).join('').toUpperCase() || '?';
}

function computeReservationTotal(reservation) {
  const paid = reservation.paiement?.montant;
  if (paid !== null && paid !== undefined && paid !== '') {
    return Number(paid);
  }
  const days = diffInDays(reservation.date_debut, reservation.date_fin);
  const daily = Number(reservation.voiture?.prix_par_jour || 0);
  return days * daily;
}

function buildStats(reservations) {
  const stats = {
    total: reservations.length,
    en_attente_paiement: 0,
    confirmee: 0,
    annulee: 0,
    terminee: 0,
    totalDepense: 0,
  };

  reservations.forEach((r) => {
    if (stats[r.statut] !== undefined) {
      stats[r.statut] += 1;
    }
    // Ne compter que les reservations confirmees ou terminees pour le total depense
    if (r.statut === 'confirmee' || r.statut === 'terminee') {
      stats.totalDepense += computeReservationTotal(r);
    }
  });

  return stats;
}

export default function ClientDetailsModal({ client, loading, onClose }) {
  if (!client && !loading) return null;

  const utilisateur = client?.utilisateur || {};
  const reservations = client?.reservations || [];
  const stats = buildStats(reservations);
  const name = utilisateur.name || 'Client';

  return (
    <div className="admin-modal-backdrop" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="admin-modal admin-modal-wide" onClick={(event) => event.stopPropagation()}>
        <header className="admin-modal-head">
          <div className="admin-client-cell">
            <span className="admin-client-avatar">{getInitials(name)}</span>
            <div>
              <h3 style={{ margin: 0 }}>{name}</h3>
              <p className="muted-row" style={{ margin: '4px 0 0', fontSize: '0.85rem' }}>
                {utilisateur.email || '—'}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="admin-modal-close"
            onClick={onClose}
            aria-label="Fermer"
          >
            ×
          </button>
        </header>

        {loading ? (
          <div className="admin-loading-row">
            <span className="admin-spinner" aria-hidden="true" />
            <span>Chargement des details du client...</span>
          </div>
        ) : (
          <div className="admin-detail-body">
            {/* PROFIL */}
            <section className="admin-detail-section">
              <h4>Profil</h4>
              <div className="admin-detail-grid">
                <div>
                  <span>Telephone</span>
                  <strong>{client.telephone || '—'}</strong>
                </div>
                <div>
                  <span>Permis de conduire</span>
                  <strong>{client.permis_conduire || '—'}</strong>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <span>Adresse</span>
                  <strong>{client.adresse || '—'}</strong>
                </div>
                <div>
                  <span>Inscrit le</span>
                  <strong>{formatDate(client.created_at)}</strong>
                </div>
              </div>
            </section>

            {/* STATS */}
            <section className="admin-detail-section">
              <h4>Statistiques</h4>
              <div className="admin-stats-mini">
                <article className="admin-stats-mini-card tone-teal">
                  <span className="admin-stats-mini-label">Total reservations</span>
                  <strong className="admin-stats-mini-value">{stats.total}</strong>
                </article>
                <article className="admin-stats-mini-card tone-amber">
                  <span className="admin-stats-mini-label">En attente paiement</span>
                  <strong className="admin-stats-mini-value">{stats.en_attente_paiement}</strong>
                </article>
                <article className="admin-stats-mini-card tone-ok">
                  <span className="admin-stats-mini-label">Confirmees</span>
                  <strong className="admin-stats-mini-value">{stats.confirmee}</strong>
                </article>
                <article className="admin-stats-mini-card tone-info">
                  <span className="admin-stats-mini-label">Terminees</span>
                  <strong className="admin-stats-mini-value">{stats.terminee}</strong>
                </article>
                <article className="admin-stats-mini-card tone-danger">
                  <span className="admin-stats-mini-label">Annulees</span>
                  <strong className="admin-stats-mini-value">{stats.annulee}</strong>
                </article>
                <article className="admin-stats-mini-card tone-spent">
                  <span className="admin-stats-mini-label">Total depense</span>
                  <strong className="admin-stats-mini-value">{stats.totalDepense.toFixed(2)} DT</strong>
                </article>
              </div>
            </section>

            {/* HISTORIQUE */}
            <section className="admin-detail-section">
              <h4>Historique des reservations</h4>
              {reservations.length === 0 ? (
                <p className="muted-row" style={{ padding: '12px 0' }}>
                  Aucune reservation pour ce client.
                </p>
              ) : (
                <div className="admin-table-wrap">
                  <table className="admin-history-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Vehicule</th>
                        <th>Du</th>
                        <th>Au</th>
                        <th>Prix</th>
                        <th>Statut</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reservations.map((r) => (
                        <tr key={r.id}>
                          <td>#{r.id}</td>
                          <td>
                            <strong>{r.voiture?.marque?.nom || 'Sans marque'}</strong>
                            <div className="muted-row" style={{ fontSize: '0.78rem' }}>
                              {r.voiture?.modele || '—'} · {r.voiture?.immatriculation || '—'}
                            </div>
                          </td>
                          <td>{formatDate(r.date_debut)}</td>
                          <td>{formatDate(r.date_fin)}</td>
                          <td>
                            <strong>{computeReservationTotal(r).toFixed(2)} DT</strong>
                          </td>
                          <td>
                            <span className={statutBadgeClass(r.statut)}>{statutLabel(r.statut)}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        )}

        <footer className="admin-form-footer" style={{ padding: '14px 22px' }}>
          <button type="button" className="admin-secondary-btn" onClick={onClose}>
            Fermer
          </button>
        </footer>
      </div>
    </div>
  );
}
