import { RotateCcw } from 'lucide-react';

import { useKnobs } from '#/hooks/useKnobs';
import { KNOB_CONTROLS, knobsAreDefault, resetKnobs, setKnob } from '#/lib/knobs';

/**
 * The six appearance sliders, shared by the header's appearance menu and the UI
 * playground's control rail. Both render this; neither owns the state.
 *
 * Labels are plain English rather than the custom property each slider writes —
 * the property names are reference material for whoever is editing the design
 * system, and they belong in the playground's token inspector, not on a control
 * a reader is meant to drag.
 */
export function AppearanceKnobs() {
  const knobs = useKnobs();

  return (
    <div className="knobs">
      {KNOB_CONTROLS.map(control => (
        <label className="knob" key={control.key}>
          <span className="knob__head">
            <span className="knob__label">{control.label}</span>
            <span className="knob__value">{control.format(knobs[control.key])}</span>
          </span>
          <input
            className="knob__slider"
            type="range"
            min={control.min}
            max={control.max}
            step={control.step}
            value={knobs[control.key]}
            onChange={event => {
              setKnob(control.key, Number(event.target.value));
            }}
          />
        </label>
      ))}

      <button type="button" className="knobs__reset" disabled={knobsAreDefault(knobs)} onClick={resetKnobs}>
        <RotateCcw size={13} />
        Reset to defaults
      </button>
    </div>
  );
}
