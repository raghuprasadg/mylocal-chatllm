import { useStore } from '../store';
import { formatSavings } from '../utils';

export default function StatsBar({ routeEnabled }) {
  const stats = useStore((s) => s.stats);
  const avgCx = stats.n ? Math.round(stats.totalCx / stats.n) : null;

  return (
    <div style={styles.bar}>
      <Chip dot="var(--haiku-c)" label="Haiku" value={stats.haiku} valueColor="var(--haiku-c)" />
      <Divider />
      <Chip dot="var(--sonnet-c)" label="Sonnet" value={stats.sonnet} valueColor="var(--sonnet-c)" />
      <Divider />
      <Chip dot="var(--opus-c)" label="Opus" value={stats.opus} valueColor="var(--opus-c)" />
      <Divider />
      <Chip label="Total routed" value={stats.n} />
      <Divider />
      <div style={styles.chip}>
        <span style={styles.chipLabel}>Est. savings vs Opus</span>
        <span style={styles.savingsChip}>{formatSavings(stats.totalSavings)}</span>
      </div>
      <Divider />
      <Chip label="Avg complexity" value={avgCx !== null ? `${avgCx}/100` : '–'} valueColor="var(--text-secondary)" />
      <Divider />
      <div style={styles.chip}>
        <span style={styles.chipLabel}>Mode</span>
        <span style={{ ...styles.chipVal, color: 'var(--accent)', fontSize: 11, fontWeight: 700 }}>
          {routeEnabled ? 'Auto RouteLLM' : 'Manual'}
        </span>
      </div>
    </div>
  );
}

function Chip({ dot, label, value, valueColor }) {
  return (
    <div style={styles.chip}>
      {dot && <div style={{ ...styles.dot, background: dot }} />}
      <span style={styles.chipLabel}>{label}</span>
      <span style={{ ...styles.chipVal, color: valueColor || 'var(--text-primary)' }}>{value}</span>
    </div>
  );
}

function Divider() {
  return <div style={styles.divider} />;
}

const styles = {
  bar: { background: 'var(--bg-800)', borderBottom: '1px solid var(--border)', padding: '5px 16px', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0, overflowX: 'auto', scrollbarWidth: 'none' },
  chip: { display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, whiteSpace: 'nowrap' },
  dot: { width: 6, height: 6, borderRadius: '50%', flexShrink: 0 },
  chipLabel: { color: 'var(--text-muted)' },
  chipVal: { fontWeight: 700, fontFamily: 'var(--mono)' },
  savingsChip: { background: 'var(--green-dim)', border: '1px solid var(--green)', borderRadius: 20, padding: '1px 7px', fontSize: 10.5, fontWeight: 700, color: 'var(--green)', fontFamily: 'var(--mono)' },
  divider: { width: 1, height: 13, background: 'var(--border)', flexShrink: 0 },
};
