import {classes} from '~/shared/ui.ts';

import {MatchSummaryTable} from './components/MatchSummaryTable.tsx';
import styles from './MatchSummary.module.css';

export default function MatchSummary() {
  return (
    <div className={styles.MatchSummary}>
      <div className={styles.SummaryScoreContainer}>
        <span
          className={classes(styles.SummaryScore, styles['SummaryScore-us'])}
        >
          2
        </span>
        <span>•</span>
        <span
          className={classes(styles.SummaryScore, styles['SummaryScore-them'])}
        >
          1
        </span>
      </div>

      <div className={styles.MatchOverview}>
        <p className={classes(styles.Text, styles['Text-emphasized'])}>Volleyball</p>
        <p className={styles.Text}>November 2, 2025</p>
        <p className={classes(styles.Text, styles['Text-subdued'])}>5:59–7:05pm</p>
      </div>

      <div className={styles.MatchSummaryTableContainer}>
        <MatchSummaryTable />
      </div>
    </div>
  );
}
