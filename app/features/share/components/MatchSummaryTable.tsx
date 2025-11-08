import styles from './MatchSummaryTable.module.css';

export function MatchSummaryTable() {
  return (
    <div className={styles.MatchSummaryTable}>
      <div className={styles.Row}>
        <div className={styles.Cell}>Us</div>
        <div className={styles.Cell}>25</div>
        <div className={styles.Cell}>21</div>
        <div className={styles.Cell}>25</div>
      </div>

      <div className={styles.Row}>
        <div className={styles.Cell}>Them</div>
        <div className={styles.Cell}>23</div>
        <div className={styles.Cell}>25</div>
        <div className={styles.Cell}>19</div>
      </div>
    </div>
  );
}
