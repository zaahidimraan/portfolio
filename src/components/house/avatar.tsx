/**
 * The voxel avatar (E40, BUILD-SPEC §5): cube head with hair + beard, box
 * torso, sleeves and jeans — his own skin, deliberately not Steve's. Drawn
 * upright in pixel space and billboarded over the iso floor; the pose is a
 * data attribute so CSS drives the walk cycle, sit, sleep, stir and squat
 * without re-rendering React.
 */

const SKIN = "#d9a077";
const HAIR = "#5a3d2b";
const SHIRT = "#a3403a";
const SLEEVE = "#8a3630";
const JEANS = "#3f7fb5";

export function Avatar() {
  return (
    <g className="hv">
      <ellipse className="hv-shadow" cx="0" cy="1.5" rx="7" ry="2.6" fill="rgba(30,25,15,.28)" />
      <g className="hv-up">
        {/* legs */}
        <g className="hv-legs">
          <rect className="hv-leg-a" x="-4" y="-8" width="3.4" height="8" fill={JEANS} stroke="#1a1a1a" strokeWidth="0.7" />
          <rect className="hv-leg-b" x="0.6" y="-8" width="3.4" height="8" fill={JEANS} stroke="#1a1a1a" strokeWidth="0.7" />
        </g>
        {/* torso + arms */}
        <g className="hv-torso">
          <rect className="hv-arm-a" x="-7.4" y="-17" width="2.8" height="8" fill={SLEEVE} stroke="#1a1a1a" strokeWidth="0.7" />
          <rect className="hv-arm-b" x="4.6" y="-17" width="2.8" height="8" fill={SLEEVE} stroke="#1a1a1a" strokeWidth="0.7" />
          <rect x="-4.6" y="-17.5" width="9.2" height="9.8" fill={SHIRT} stroke="#1a1a1a" strokeWidth="0.8" />
        </g>
        {/* head: skin, hair on top, beard below */}
        <g className="hv-head">
          <rect x="-4.4" y="-26.4" width="8.8" height="8.8" fill={SKIN} stroke="#1a1a1a" strokeWidth="0.8" />
          <rect x="-4.4" y="-26.4" width="8.8" height="2.6" fill={HAIR} />
          <rect x="-4.4" y="-26.4" width="1.6" height="5" fill={HAIR} />
          <rect x="-3.2" y="-19.4" width="6.4" height="1.8" fill={HAIR} />
          <rect className="hv-eye" x="1" y="-23" width="1.4" height="1.4" fill="#2b2118" />
        </g>
      </g>
      <text className="hv-zzz" x="7" y="-30" fontSize="7" fill="#3c3626" fontFamily="ui-monospace,monospace">z z</text>
    </g>
  );
}
