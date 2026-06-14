import { Fragment } from 'react';

/**
 * Barre d'etapes (stepper) premium, inspiree des stylings Lucide.
 *
 * Props :
 *  - steps   : tableau de { label, description?, icon? }
 *              icon ∈ 'car' | 'calendar' | 'sparkles' (sinon : numero)
 *  - current : index (0-based) de l'etape active
 *
 * Etats par etape :
 *  - done   : index < current  -> marqueur teal plein + icone check
 *  - active : index === current -> marqueur teal gradient + glow pulse
 *  - todo   : index > current   -> marqueur blanc bordure neutre
 *
 * Entre deux etapes, un connecteur dont la barre interieure s'anime :
 *  - is-full  : etape precedente terminee
 *  - is-half  : etape precedente active (progression en cours)
 *  - (vide)   : etape precedente a venir
 */

/* ===== Icones — paths Lucide (MIT) recopies en SVG inline ===== */

function IconCar() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
      <circle cx="7" cy="17" r="2" />
      <path d="M9 17h6" />
      <circle cx="17" cy="17" r="2" />
    </svg>
  );
}

function IconCalendar() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
      <line x1="16" x2="16" y1="2" y2="6" />
      <line x1="8" x2="8" y1="2" y2="6" />
      <line x1="3" x2="21" y1="10" y2="10" />
    </svg>
  );
}

function IconSparkles() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
      <path d="M20 3v4" />
      <path d="M22 5h-4" />
      <path d="M4 17v2" />
      <path d="M5 18H3" />
    </svg>
  );
}

function IconCheck() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function renderStepIcon(name) {
  if (name === 'car') return <IconCar />;
  if (name === 'calendar') return <IconCalendar />;
  if (name === 'sparkles') return <IconSparkles />;
  return null;
}

export default function StepBar({ steps = [], current = 0 }) {
  if (!Array.isArray(steps) || steps.length === 0) return null;

  return (
    <div className="stepbar" role="list" aria-label="Progression de la reservation">
      {steps.map((step, index) => {
        const state = index < current ? 'done' : index === current ? 'active' : 'todo';
        const isLast = index === steps.length - 1;
        const connectorState =
          index < current ? 'is-full' : index === current ? 'is-half' : '';
        const customIcon = renderStepIcon(step.icon);

        return (
          <Fragment key={step.label || index}>
            <div
              className={`stepbar-step is-${state}`}
              role="listitem"
              aria-current={state === 'active' ? 'step' : undefined}
            >
              <div className="stepbar-marker">
                {state === 'done' ? (
                  <IconCheck />
                ) : customIcon ? (
                  customIcon
                ) : (
                  <span className="stepbar-marker-num">{index + 1}</span>
                )}
              </div>
              <div className="stepbar-text">
                <span className="stepbar-label">{step.label}</span>
                {step.description && (
                  <span className="stepbar-desc">{step.description}</span>
                )}
              </div>
            </div>

            {!isLast && (
              <div
                className={`stepbar-connector ${connectorState}`.trim()}
                aria-hidden="true"
              >
                <span className="stepbar-connector-fill" />
              </div>
            )}
          </Fragment>
        );
      })}
    </div>
  );
}
