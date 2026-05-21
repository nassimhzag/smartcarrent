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

function statutLabel(statut) {
  if (statut === 'en_attente') return 'En attente';
  if (statut === 'paye') return 'Paye';
  if (statut === 'echoue') return 'Echoue';
  if (statut === 'rembourse') return 'Rembourse';
  return statut || '—';
}

function statutBadgeClass(statut) {
  if (statut === 'en_attente') return 'badge badge-warn';
  if (statut === 'paye') return 'badge badge-ok';
  if (statut === 'echoue') return 'badge badge-danger';
  if (statut === 'rembourse') return 'badge badge-muted';
  return 'badge';
}

function modeLabel(mode) {
  if (mode === 'carte') return 'Carte bancaire';
  if (mode === 'virement') return 'Virement';
  if (mode === 'especes') return 'Especes';
  if (mode === 'mobile_money') return 'Mobile Money';
  return mode || '—';
}

export default function PaiementDetailsModal({ paiement, onClose }) {
  if (!paiement) return null;

  const reservation = paiement.reservation || {};
  const client = reservation.client || {};
  const utilisateur = client.utilisateur || {};
  const voiture = reservation.voiture || {};

  return (
    <div className="admin-modal-backdrop" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="admin-modal" onClick={(event) => event.stopPropagation()}>
        <header className="admin-modal-head">
          <div>
            <h3>Detail paiement #{paiement.id}</h3>
            <p className="muted-row" style={{ margin: '4px 0 0', fontSize: '0.85rem' }}>
              Cree le {formatDateTime(paiement.created_at)}
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
            </div>
          </section>

          <section className="admin-detail-section">
            <h4>Vehicule</h4>
            <div className="admin-detail-grid">
              <div>
                <span>Modele</span>
                <strong>{voiture.modele || '—'}</strong>
              </div>
              <div>
                <span>Immatriculation</span>
                <strong>{voiture.immatriculation || '—'}</strong>
              </div>
              <div>
                <span>Prix par jour</span>
                <strong>
                  {voiture.prix_par_jour
                    ? `${Number(voiture.prix_par_jour).toFixed(2)} DT`
                    : '—'}
                </strong>
              </div>
            </div>
          </section>

          <section className="admin-detail-section">
            <h4>Reservation liee</h4>
            <div className="admin-detail-grid">
              <div>
                <span>Reference</span>
                <strong>RES-{reservation.id || '—'}</strong>
              </div>
              <div>
                <span>Statut reservation</span>
                <strong>{reservation.statut || '—'}</strong>
              </div>
              <div>
                <span>Date debut</span>
                <strong>{formatDate(reservation.date_debut)}</strong>
              </div>
              <div>
                <span>Date fin</span>
                <strong>{formatDate(reservation.date_fin)}</strong>
              </div>
            </div>
          </section>

          <section className="admin-detail-section">
            <h4>Paiement</h4>
            <div className="admin-detail-grid">
              <div>
                <span>Methode</span>
                <strong>{modeLabel(paiement.mode_paiement)}</strong>
              </div>
              <div>
                <span>Statut</span>
                <span className={statutBadgeClass(paiement.statut)}>
                  {statutLabel(paiement.statut)}
                </span>
              </div>
              <div>
                <span>Date paiement</span>
                <strong>{formatDate(paiement.date_paiement)}</strong>
              </div>
              <div>
                <span>Date validation</span>
                <strong>{formatDateTime(paiement.date_validation)}</strong>
              </div>
              <div>
                <span>Date remboursement</span>
                <strong>{formatDateTime(paiement.date_remboursement)}</strong>
              </div>
              <div className="admin-detail-total">
                <span>Montant</span>
                <strong>{Number(paiement.montant || 0).toFixed(2)} DT</strong>
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
