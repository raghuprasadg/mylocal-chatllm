const CHAT_SUGGESTIONS = [
  { icon: '🌍', title: 'Simple fact lookup', sub: 'Quick geographic or factual question', prompt: 'What is the capital of Japan?', tier: '⚡ Haiku', tierKey: 'haiku' },
  { icon: '💻', title: 'Code + explanation', sub: 'Implementation with complexity analysis', prompt: 'Write a Python function implementing binary search and explain its time complexity', tier: '⚖️ Sonnet', tierKey: 'sonnet' },
  { icon: '🏗️', title: 'Deep architecture analysis', sub: 'Complex multi-factor reasoning', prompt: 'Analyze trade-offs between microservices and monoliths for a startup scaling from 10 to 100 engineers', tier: '💎 Opus', tierKey: 'opus' },
  { icon: '⚖️', title: 'Technical comparison', sub: 'Pros/cons with recommendation', prompt: 'Compare REST vs GraphQL for a mobile app backend. Include when to use each.', tier: '⚖️ Sonnet', tierKey: 'sonnet' },
];

const AGENT_INTROS = {
  researcher: { prompt: 'Summarize the latest developments in large language model research and their implications for AI safety' },
  coder: { prompt: 'Write a TypeScript utility function that deep-merges two objects, handling arrays and circular references' },
  writer: { prompt: 'Write a compelling product launch email for an AI-powered coding assistant aimed at senior engineers' },
  analyst: { prompt: 'Explain how to interpret a confusion matrix and what metrics to focus on for an imbalanced classification dataset' },
  planner: { prompt: 'Create a 90-day onboarding plan for a new senior software engineer joining a fast-growing startup' },
};

export default function EmptyState({ mode, activeAgent, onSuggest }) {
  const agentSuggestion = activeAgent ? AGENT_INTROS[activeAgent.id] : null;

  if (mode === 'agents' && activeAgent) {
    return (
      <div style={styles.wrap}>
        <div style={styles.agentOrb}>{activeAgent.emoji}</div>
        <div style={styles.title}>{activeAgent.name}</div>
        <div style={styles.sub}>{activeAgent.description}</div>
        <div style={styles.subNote}>RouteLLM will automatically select the optimal model for each request.</div>
        {agentSuggestion && (
          <button style={styles.agentPromptBtn} onClick={() => onSuggest(agentSuggestion.prompt)}>
            <span style={styles.agentPromptIcon}>💡</span>
            <span style={styles.agentPromptText}>Try: {agentSuggestion.prompt.slice(0, 70)}…</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div style={styles.wrap}>
      <div style={styles.orb}>🧠</div>
      <div style={styles.title}>What can I help you with?</div>
      <div style={styles.sub}>
        RouteLLM intelligently routes each query to the right model — fast for simple tasks, powerful for complex ones.
      </div>
      <div style={styles.grid}>
        {CHAT_SUGGESTIONS.map((s) => (
          <button key={s.title} style={styles.card} onClick={() => onSuggest(s.prompt)}>
            <div style={styles.cardIcon}>{s.icon}</div>
            <div style={styles.cardTitle}>{s.title}</div>
            <div style={styles.cardSub}>{s.sub}</div>
            <div style={{
              ...styles.tierBadge,
              color: s.tierKey === 'haiku' ? 'var(--haiku-c)' : s.tierKey === 'opus' ? 'var(--opus-c)' : 'var(--sonnet-c)',
              background: s.tierKey === 'haiku' ? 'var(--haiku-bg)' : s.tierKey === 'opus' ? 'var(--opus-bg)' : 'var(--sonnet-bg)',
            }}>
              → {s.tier}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export { AGENT_INTROS };

const styles = {
  wrap: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: 20, textAlign: 'center' },
  orb: { width: 56, height: 56, background: 'linear-gradient(135deg,var(--accent),var(--accent-2))', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, marginBottom: 16, boxShadow: '0 0 42px var(--accent-glow)' },
  agentOrb: { fontSize: 52, marginBottom: 14 },
  title: { fontSize: 21, fontWeight: 700, marginBottom: 7, background: 'linear-gradient(135deg,#e2e5f4,#7a85a8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' },
  sub: { fontSize: 13, color: 'var(--text-muted)', maxWidth: 400, lineHeight: 1.6, marginBottom: 8 },
  subNote: { fontSize: 11.5, color: 'var(--text-muted)', marginBottom: 20, opacity: 0.7 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 8, width: '100%', maxWidth: 570, marginTop: 16 },
  card: { background: 'var(--bg-800)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '11px 13px', cursor: 'pointer', textAlign: 'left', fontFamily: 'var(--font)' },
  cardIcon: { fontSize: 16, marginBottom: 5 },
  cardTitle: { fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 },
  cardSub: { fontSize: 10.5, color: 'var(--text-muted)', lineHeight: 1.4 },
  tierBadge: { fontSize: 9, fontFamily: 'var(--mono)', padding: '1px 5px', borderRadius: 3, fontWeight: 700, marginTop: 4, display: 'inline-block' },
  agentPromptBtn: { background: 'var(--bg-700)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '10px 16px', cursor: 'pointer', display: 'flex', alignItems: 'flex-start', gap: 8, maxWidth: 440, textAlign: 'left', fontFamily: 'var(--font)' },
  agentPromptIcon: { fontSize: 14, flexShrink: 0 },
  agentPromptText: { fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 },
};
