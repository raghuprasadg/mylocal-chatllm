import { tierColor, tierBg, modelIcon } from '../utils';

export function RouteBadge({ modelKey, modelLabel, score, showBar = true }) {
  if (!modelKey || !modelLabel) return null;
  const cls = { haiku: 'h', sonnet: 's', opus: 'o' }[modelKey] || 's';
  const color = tierColor(cls);
  const bg = tierBg(cls);

  return (
    <div style={styles.wrap}>
      <span
        style={{ ...styles.badge, color, background: bg, border: `1px solid ${color}40` }}
        title={`Routed to ${modelLabel} · complexity ${score}/100`}
      >
        <span style={{ ...styles.dot, background: color }} />
        {modelLabel}
      </span>
      {showBar && score !== undefined && (
        <div style={styles.barWrap} title={`Complexity: ${score}/100`}>
          <div style={styles.bar}>
            <div style={{ ...styles.barFill, width: `${score}%`, background: color }} />
          </div>
          <span style={styles.score}>{score}</span>
        </div>
      )}
    </div>
  );
}

export function RouteDecision({ score, modelKey, modelLabel, reason }) {
  if (!modelKey) return null;
  const color = tierColor(modelKey);
  const bg = tierBg(modelKey);

  return (
    <div style={styles.decision}>
      <div style={styles.decisionTitle}>⚡ RouteLLM Decision</div>
      <div style={styles.decisionRow}>
        <span style={styles.decisionScore}>Score {score}/100</span>
        <span style={styles.arrow}>→</span>
        <span style={{ ...styles.badge, color, background: bg, border: `1px solid ${color}40` }}>
          <span style={{ ...styles.dot, background: color }} />
          {modelLabel}
        </span>
        <span style={styles.decisionReason}>{reason}</span>
      </div>
    </div>
  );
}

export function AgentSteps({ steps }) {
  if (!steps?.length) return null;
  const icons = { analyze: '🔍', route: '⚡', invoke: '🤖' };
  return (
    <div style={styles.stepsWrap}>
      {steps.map((s, i) => (
        <div key={i} style={styles.step}>
          <span style={styles.stepIcon}>{icons[s.step] || '•'}</span>
          <div style={styles.stepText}>
            <strong>{s.label}</strong> — {s.detail}
          </div>
        </div>
      ))}
    </div>
  );
}

export function TypingDots() {
  return (
    <div style={styles.typing}>
      {[0, 1, 2].map((i) => (
        <span key={i} style={{ ...styles.typingDot, animationDelay: `${i * 0.2}s` }} />
      ))}
    </div>
  );
}

export function Spinner() {
  return <div style={styles.spinner} />;
}

const styles = {
  wrap: { display: 'flex', alignItems: 'center', gap: 5 },
  badge: { display: 'inline-flex', alignItems: 'center', gap: 3, padding: '1px 6px', borderRadius: 20, fontSize: 9.5, fontWeight: 700, fontFamily: 'var(--mono)', cursor: 'default' },
  dot: { width: 5, height: 5, borderRadius: '50%' },
  barWrap: { display: 'flex', alignItems: 'center', gap: 4 },
  bar: { width: 42, height: 3, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 2, transition: 'width 0.4s ease' },
  score: { fontSize: 9.5, fontFamily: 'var(--mono)', color: 'var(--text-muted)' },
  decision: { background: 'var(--bg-700)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '8px 11px', marginBottom: 9 },
  decisionTitle: { fontSize: 9.5, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 5 },
  decisionRow: { display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' },
  decisionScore: { fontFamily: 'var(--mono)', fontSize: 11.5, color: 'var(--text-secondary)' },
  arrow: { color: 'var(--text-muted)' },
  decisionReason: { fontSize: 11, color: 'var(--text-secondary)', flex: 1 },
  stepsWrap: { display: 'flex', flexDirection: 'column' },
  step: { display: 'flex', alignItems: 'flex-start', gap: 7, padding: '4px 0', borderBottom: '1px solid var(--border)' },
  stepIcon: { fontSize: 12, flexShrink: 0, marginTop: 1 },
  stepText: { fontSize: 11.5, color: 'var(--text-secondary)', lineHeight: 1.4 },
  typing: { display: 'flex', alignItems: 'center', gap: 4, padding: '5px 0' },
  typingDot: { width: 5, height: 5, background: 'var(--accent)', borderRadius: '50%', animation: 'blink 1.2s infinite', opacity: 0.3, display: 'inline-block' },
  spinner: { width: 8, height: 8, border: '1.5px solid var(--accent)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' },
};
