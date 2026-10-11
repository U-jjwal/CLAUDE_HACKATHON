import type { CarryOver } from '../../core/insights';

interface CarryOverNoticeProps {
  carryOverDO: CarryOver;
  carryOverBOD: CarryOver;
}

export function CarryOverNotice({ carryOverDO, carryOverBOD }: CarryOverNoticeProps) {
  return (
    <aside className="carryover-banner" role="region" aria-label="Ganesh to Durga Carry-over Notice">
      <div className="banner-icon" aria-hidden="true">⚠️</div>
      <div className="banner-body">
        <strong>Seasonal Carry-Over Notice (Ganesh to Durga Immersion Gap):</strong>
        <p>
          Historical paired data shows that water quality starts Durga visarjan in worse condition than Ganesh visarjan in{' '}
          <strong>{carryOverDO.durgaWorse} of {carryOverDO.n}</strong> paired ghat-years for Dissolved Oxygen (mean Ganesh pre: {carryOverDO.meanGaneshPre.toFixed(1)} mg/L vs Durga pre: {carryOverDO.meanDurgaPre.toFixed(1)} mg/L),
          and in <strong>{carryOverBOD.durgaWorse} of {carryOverBOD.n}</strong> paired ghat-years for BOD (mean Ganesh pre: {carryOverBOD.meanGaneshPre.toFixed(1)} mg/L vs Durga pre: {carryOverBOD.meanDurgaPre.toFixed(1)} mg/L).
          <em> Small multi-year sample; treat as a strong operational warning, not statistical proof.</em>
        </p>
      </div>
    </aside>
  );
}
