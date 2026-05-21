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

function formatDateTime(value) {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
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

export default function ReservationDetailsModal({ reservation, onClose }) {
  if (!reservation) return null;

  const client = reservation.client || {};
  const utilisateur = client.utilisateur || {};
  const voiture = reservation.voiture || {};
  const days = diffInDays(reservation.date_debut, reservation.date_fin);
  const dailyPrice = Number(voiture.prix_par_jour || 0);
  const computedTotal = days * dailyPrice;
  const paidAmount = reservation.paiement?.montant ? Number(reservation.paiement.montant) : null;
  const total = paidAmount !== null ? paidAmount : computedTotal;

  return (
    <div className="admin-modal-backdrop" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="admin-modal" onClick={(event) => event.stopPropagation()}>
        <header className="admin-modal-head">
          <div>
            <h3>Detail reservation #{reservation.id}</h3>
            <p className="muted-row" style={{ margin: '4px 0 0', fontSize: '0.85rem' }}>
              Creee le {formatDateTime(reservation.created_at)}
            </p>
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

        <div className="admin-detail-body">
          <section className="admin-detail-section">
            <h4>Client</h4>
            <div className="admin-detail-grid">
              <div>
                <span>Nom</span>
                <strong>{utilisateur.name || '—'}</strong>
              </div>
              <div>
                <span>Email</span>
                <strong>{utilisateur.email || '—'}</strong>
              </div>
              <div>
                <span>Telephone</span>
                <strong>{client.telephone || '—'}</strong>
              </div>
              <div>
                <span>Adresse</span>
                <strong>{client.adresse || '—'}</strong>
              </div>
              <div>
                <span>Permis de conduire</span>
                <strong>{client.permis_conduire || '—'}</strong>
              </div>
            </div>
          </section>

          <section className="admin-detail-section">
            <h4>Vehicule</h4>
            <div className="admin-detail-grid">
              <div>
                <span>Marque / Modele</span>
                <strong>
                  {voiture.marque?.nom || 'Sans marque'} — {voiture.modele || '—'}
                </strong>
              </div>
              <div>
                <span>Immatriculation</span>
                <strong>{voiture.immatriculation || '—'}</strong>
              </div>
              <div>
                <span>Annee</span>
                <strong>{voiture.annee || '—'}</strong>
              </div>
              <div>
                <span>Prix par jour</span>
                <strong>{dailyPrice.toFixed(2)} DT</strong>
              </div>
            </div>
          </section>

          <section className="admin-detail-section">
            <h4>Reservation</h4>
            <div className="admin-detail-grid">
              <div>
                <span>Date debut</span>
                <strong>{formatDate(reservation.date_debut)}</strong>
              </div>
              <div>
                <span>Date fin</span>
                <strong>{formatDate(reservation.date_fin)}</strong>
              </div>
              <div>
                <span>Duree</span>
                <strong>
                  {days} jour{days > 1 ? 's' : ''}
                </strong>
              </div>
              <div>
                <span>Statut</span>
                <span className={statutBadgeClass(reservation.statut)}>
                  {statutLabel(reservation.statut)}
                </span>
              </div>
              <div className="admin-detail-total">
                <span>Prix total</span>
                <strong>{total.toFixed(2)} DT</strong>
                {paidAmount !== null && (
                  <small className="muted-row">Montant paye via paiement #{reservation.paiement?.id}</small>
                )}
              </div>
            </div>
          </section>
        </div>

        <footer className="admin-form-footer" style={{ padding: '14px 22px' }}>
          <button type="button" className="admin-secondary-btn" onClick={onClose}>
            Fermer
          </button>
        </footer>
      </div>
    </div>
  );
}
