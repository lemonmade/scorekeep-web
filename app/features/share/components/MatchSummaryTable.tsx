import {classes} from '~/shared/ui.ts';

import styles from './MatchSummaryTable.module.css';

export function MatchSummaryTable() {
  return (
    <div className={styles.MatchSummaryTable}>
      <div className={styles.Row}>
        <div className={styles.Cell}>
          <div
            className={classes(
              styles.Team,
              styles['Team-us'],
              styles['Team-winner'],
            )}
          >
            <span className={styles.TeamIndicator}></span>
            <span>Us</span>
          </div>
        </div>
        <div className={styles.Cell}>
          <div className={classes(styles.Score, styles['Score-winner'])}>
            25
          </div>
        </div>
        <div className={styles.Cell}>
          <div className={styles.Score}>21</div>
        </div>
        <div className={styles.Cell}>
          <div className={classes(styles.Score, styles['Score-winner'])}>
            25
          </div>
        </div>
      </div>

      <div className={styles.Row}>
        <div className={styles.Cell}>
          <div className={classes(styles.Team, styles['Team-them'])}>
            <span className={styles.TeamIndicator}></span>
            <span>Them</span>
          </div>
        </div>
        <div className={styles.Cell}>
          <div className={styles.Score}>23</div>
        </div>
        <div className={styles.Cell}>
          <div className={classes(styles.Score, styles['Score-winner'])}>25</div>
        </div>
        <div className={styles.Cell}>
          <div className={styles.Score}>19</div>
        </div>
      </div>
    </div>
  );
}
