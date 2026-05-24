import { useState } from 'react';
import { useStore } from '../store';

const AGENTS = [
  { id: 'researcher', emoji: '🔬', name: 'Researcher', desc: 'Deep analysis & citations', category: 'Knowledge' },
  { id: 'coder', emoji: '💻', name: 'Code Assistant', desc: 'Write, debug & review code', category: 'Engineering' },
  { id: 'writer', emoji: '✍️', name: 'Writer', desc: 'Creative & professional writing', category: 'Creative' },
  { id: 'analyst', emoji: '📊', name: 'Data Analyst', desc: 'Data insights & interpretation', category: 'Analytics' },
  { id: 'planner', emoji: '📋', name: 'Task Planner', desc: 'Goals → actionable steps', category: 'Productivity' },
];

export default function Sidebar({ onNewChat, onNewAgent }) {
  const mode = useStore((s) => s.mode);
  const setMode = useStore((s) => s.setMode);
  const conversations = useStore((s) => s.conversations);
  const activeConvId = useStore((s) => s.activeConvId);
  const setActiveConv = useStore((s) => s.setActiveConv);
  const deleteConversation = useStore((s) => s.deleteConversation);
  const activeAgentId = useStore((s) => s.activeAgentId);
  const setActiveAgent = useStore((s) => s.setActiveAgent);
  const agentHistories = useStore((s) => s.agentHistories);

  const [search, setSearch] = useState('');

  const filteredConvs = search
    ? conversations.filter((c) => c.title.toLowerCase().includes(search.toLowerCase()))
    : conversations;

  return (
    <aside style={styles.sidebar}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.logo}>
          <div style={styles.logoMark}>🧠</div>
          <span style={styles.logoName}>Chat<span style={{ color: 'var(--accent)' }}>LLM</span></span>
        </div>
        <div style={styles.modeTabs}>
          <button style={{ ...styles.modeTab, ...(mode === 'chat' ? styles.modeTabActive : {}) }} onClick={() => setMode('chat')}>
            💬 Chat
          </button>
          <button style={{ ...styles.modeTab, ...(mode === 'agents' ? styles.modeTabActive : {}) }} onClick={() => setMode('agents')}>
            🤖 Agents
          </button>
        </div>
      </div>

      {/* Chat mode */}
      {mode === 'chat' && (
        <div style={styles.body}>
          <div style={styles.actions}>
            <button style={styles.newBtn} onClick={onNewChat}>＋ New Chat</button>
          </div>
          <div style={styles.searchWrap}>
            <input
              style={styles.searchInput}
              placeholder="Search chats…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div style={styles.sectionLabel}>Recent</div>
          <div style={styles.list}>
            {filteredConvs.length === 0 && (
              <div style={styles.emptyList}>No conversations yet</div>
            )}
            {filteredConvs.map((c) => (
              <div
                key={c.id}
                style={{ ...styles.listItem, ...(c.id === activeConvId ? styles.listItemActive : {}) }}
                onClick={() => setActiveConv(c.id)}
              >
                {c.id === activeConvId && <div style={styles.activeBar} />}
                <span style={styles.listIcon}>💬</span>
                <span style={styles.listLabel}>{c.title}</span>
                <button
                  style={styles.delBtn}
                  onClick={(e) => { e.stopPropagation(); deleteConversation(c.id); }}
                  title="Delete"
                >✕</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Agents mode */}
      {mode === 'agents' && (
        <div style={styles.body}>
          <div style={styles.actions}>
            <button style={styles.newBtn} onClick={onNewAgent}>🗑️ Clear History</button>
          </div>
          <div style={styles.sectionLabel} className='slbl'>Specialized Agents</div>
          <div style={styles.agentList}>
            {AGENTS.map((a) => {
              const hist = agentHistories[a.id] || [];
              const lastAI = [...hist].reverse().find((m) => m.role === 'assistant');
              const isActive = activeAgentId === a.id && mode === 'agents';
              return (
                <div
                  key={a.id}
                  style={{ ...styles.agentCard, ...(isActive ? styles.agentCardActive : {}) }}
                  onClick={() => setActiveAgent(a.id)}
                >
                  <div style={styles.agentCardHead}>
                    <span style={styles.agentEmoji}>{a.emoji}</span>
                    <span style={styles.agentName}>{a.name}</span>
                    {lastAI?.modelLabel && (
                      <span style={{ ...styles.agentBadge, color: lastAI.tierColor, background: lastAI.tierBg }}>
                        {lastAI.modelLabel}
                      </span>
                    )}
                  </div>
                  <div style={styles.agentDesc}>{a.desc}</div>
                  {hist.length > 0 && (
                    <div style={styles.agentMsgCount}>{hist.length} messages</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Footer */}
      <div style={styles.footer}>
        <div style={styles.footerBtn} onClick={() => alert('Settings coming soon')}>⚙️ Settings</div>
        <div style={styles.footerBtn} onClick={() => alert('Help coming soon')}>❓ Help & Support</div>
      </div>
    </aside>
  );
}

const styles = {
  sidebar: { width: 'var(--sidebar-w)', background: 'var(--bg-800)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', flexShrink: 0, zIndex: 10, overflow: 'hidden' },
  header: { padding: '14px 13px 10px', borderBottom: '1px solid var(--border)', flexShrink: 0 },
  logo: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 11 },
  logoMark: { width: 28, height: 28, background: 'linear-gradient(135deg,var(--accent),var(--accent-2))', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, boxShadow: '0 0 14px var(--accent-glow)' },
  logoName: { fontSize: 15, fontWeight: 700, letterSpacing: -0.3 },
  modeTabs: { display: 'flex', gap: 3, background: 'var(--bg-700)', borderRadius: 'var(--radius-sm)', padding: 3 },
  modeTab: { flex: 1, padding: '5px 4px', border: 'none', background: 'none', borderRadius: 6, fontFamily: 'var(--font)', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', cursor: 'pointer' },
  modeTabActive: { background: 'var(--bg-600)', color: 'var(--text-primary)', boxShadow: '0 1px 4px #0005' },
  body: { display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' },
  actions: { padding: '9px 13px 0' },
  newBtn: { width: '100%', background: 'var(--accent-glow)', border: '1px solid var(--accent)', borderRadius: 'var(--radius-sm)', color: 'var(--accent)', fontFamily: 'var(--font)', fontSize: 12, fontWeight: 700, padding: '7px 10px', cursor: 'pointer' },
  searchWrap: { padding: '7px 13px' },
  searchInput: { width: '100%', background: 'var(--bg-700)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '6px 9px', color: 'var(--text-primary)', fontFamily: 'var(--font)', fontSize: 12, outline: 'none' },
  sectionLabel: { padding: '6px 13px 3px', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)' },
  list: { flex: 1, overflowY: 'auto', padding: '3px 7px', scrollbarWidth: 'thin' },
  emptyList: { padding: '12px 10px', fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' },
  listItem: { padding: '7px 8px', borderRadius: 'var(--radius-sm)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7, position: 'relative', userSelect: 'none' },
  listItemActive: { background: 'var(--accent-glow)' },
  activeBar: { position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', width: 3, height: '55%', background: 'var(--accent)', borderRadius: '0 2px 2px 0' },
  listIcon: { fontSize: 12, opacity: 0.5, flexShrink: 0 },
  listLabel: { flex: 1, fontSize: 12, color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  delBtn: { opacity: 0, background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 12, padding: '2px 4px', borderRadius: 4 },
  agentList: { flex: 1, overflowY: 'auto', padding: '5px 7px', display: 'flex', flexDirection: 'column', gap: 5, scrollbarWidth: 'thin' },
  agentCard: { padding: '9px 10px', borderRadius: 'var(--radius-sm)', cursor: 'pointer', border: '1px solid var(--border)', background: 'var(--bg-700)', position: 'relative' },
  agentCardActive: { borderColor: 'var(--accent)', background: 'var(--accent-glow)' },
  agentCardHead: { display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 },
  agentEmoji: { fontSize: 14 },
  agentName: { fontSize: 12.5, fontWeight: 600, flex: 1 },
  agentBadge: { fontSize: 9.5, padding: '1px 5px', borderRadius: 20, fontWeight: 700, fontFamily: 'var(--mono)' },
  agentDesc: { fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.4 },
  agentMsgCount: { fontSize: 10, color: 'var(--text-muted)', marginTop: 4 },
  footer: { borderTop: '1px solid var(--border)', padding: 7, flexShrink: 0 },
  footerBtn: { display: 'flex', alignItems: 'center', gap: 8, padding: '7px 8px', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: 12, color: 'var(--text-secondary)' },
};
