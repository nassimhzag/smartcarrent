/**
 * Barre d'etapes (stepper) moderne et reutilisable.
 *
 * Props :
 *  - steps   : tableau de { label, description? }
 *  - current : index (0-based) de l'etape active
 *
 * Etats par etape :
 *  - done   : index < current  -> cercle teal plein + check
 *  - active : index === current -> cercle teal avec halo
 *  - todo   : index > current   -> cercle gris
 */

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12l4 4 10-10" />
    </svg>
  );
}

export default function StepBar({ steps = [], current = 0 }) {
  if (!Array.isArray(steps) || steps.length === 0) return null;

  return (
    <div className="stepbar" role="list" aria-label="Progression de la reservation">
      {steps.map((step, index) => {
        const state = index < current ? 'done' : index === current ? 'active' : 'todo';
        return (
          <div
            key={step.label || index}
            className={`stepbar-step is-${state}`}
            role="listitem"
            aria-current={state === 'active' ? 'step' : undefined}
          >
            <div className="stepbar-marker">
              {state === 'done' ? <CheckIcon /> : <span>{index + 1}</span>}
            </div>
            <div className="stepbar-text">
              <span className="stepbar-label">{step.label}</span>
              {step.description && (
                <span className="stepbar-desc">{step.description}</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
