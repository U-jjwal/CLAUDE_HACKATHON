import type { CarryOver } from '../../core/insights';
import { useLanguage } from '../i18n';

interface CarryOverNoticeProps {
  carryOverDO: CarryOver;
  carryOverBOD: CarryOver;
}

export function CarryOverNotice({ carryOverDO, carryOverBOD }: CarryOverNoticeProps) {
  const { t } = useLanguage();

  return (
    <aside className="carryover-banner" role="region" aria-label={t('carryover.title')}>
      <div className="banner-icon" aria-hidden="true">⚠️</div>
      <div className="banner-body">
        <strong>{t('carryover.title')}</strong>
        <p>
          {t('carryover.text', {
            doWorse: carryOverDO.durgaWorse,
            doN: carryOverDO.n,
            meanGaneshDO: carryOverDO.meanGaneshPre.toFixed(1),
            meanDurgaDO: carryOverDO.meanDurgaPre.toFixed(1),
            bodWorse: carryOverBOD.durgaWorse,
            bodN: carryOverBOD.n,
            meanGaneshBOD: carryOverBOD.meanGaneshPre.toFixed(1),
            meanDurgaBOD: carryOverBOD.meanDurgaPre.toFixed(1),
          })}
        </p>
      </div>
    </aside>
  );
}
