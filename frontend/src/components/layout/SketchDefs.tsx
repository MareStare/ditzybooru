/**
 * SVG filters for the crayon look. CSS reaches them with `filter: url(#id)`.
 *
 * - `sk-wobble` bends straight edges into a shaky hand line.
 * - `sk-crayon` bends edges and eats small holes into the stroke, like wax
 *   crayon on rough paper.
 * - `sk-pencil` is a lighter grain for hatched fills.
 */
export function SketchDefs() {
  return (
    <svg className="sketch-defs" width="0" height="0" aria-hidden="true" focusable="false">
      <filter id="sk-wobble" x="-10%" y="-10%" width="120%" height="120%">
        <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="1" seed="4" result="warp" />
        <feDisplacementMap in="SourceGraphic" in2="warp" scale="3" xChannelSelector="R" yChannelSelector="G" />
      </filter>

      <filter id="sk-crayon" x="-10%" y="-10%" width="120%" height="120%">
        <feTurbulence type="fractalNoise" baseFrequency="0.009" numOctaves="1" seed="7" result="warp" />
        <feDisplacementMap
          in="SourceGraphic"
          in2="warp"
          scale="7"
          xChannelSelector="R"
          yChannelSelector="G"
          result="bent"
        />
        <feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves="2" seed="2" result="grain" />
        <feColorMatrix
          in="grain"
          type="matrix"
          values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -2.4 0 0 0 1.95"
          result="holes"
        />
        <feComposite in="bent" in2="holes" operator="in" />
      </filter>

      <filter id="sk-pencil" x="-10%" y="-10%" width="120%" height="120%">
        <feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves="1" seed="11" result="warp" />
        <feDisplacementMap
          in="SourceGraphic"
          in2="warp"
          scale="4"
          xChannelSelector="R"
          yChannelSelector="G"
          result="bent"
        />
        <feTurbulence type="fractalNoise" baseFrequency="1.2 0.4" numOctaves="2" seed="5" result="grain" />
        <feColorMatrix
          in="grain"
          type="matrix"
          values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -2.6 0 0 0 1.55"
          result="holes"
        />
        <feComposite in="bent" in2="holes" operator="in" />
      </filter>
    </svg>
  );
}
