import { copyToClipboard } from '../utils';

export default function Topbar({ title, subtitle, onMenuClick, showMenu, onNewChat, onCopyChat }) {
  return (
    <div style={styles.bar}>
      {showMenu && (
        <button style={styles.menuBtn} onClick={onMenuClick} title="Toggle sidebar">☰</button>
      )}

      <div style={styles.title}>
        {title}
        {subtitle && <small style={styles.subtitle}>{subtitle}</small>}
      </div>

      <div style={styles.actions}>
        <button style={styles.btn} onClick={onCopyChat} title="Copy chat">⬆️</button>
        <button style={styles.btn} onClick={onNewChat} title="New chat">✏️</button>
        <div style={styles.avatar} title="Account">U</div>
      </div>
    </div>
  );
}

const styles = {
  bar: { display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderBottom: '1px solid var(--border)', background: 'var(--bg-800)', flexShrink: 0 },
  menuBtn: { background: 'none', border: '1px solid var(--border)', color: 'var(--text-secondary)', width: 30, height: 30, borderRadius: 'var(--radius-sm)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 },
  title: { fontSize: 13.5, fontWeight: 600, flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  subtitle: { fontWeight: 400, color: 'var(--text-muted)', fontSize: 11.5, marginLeft: 5 },
  actions: { display: 'flex', alignItems: 'center', gap: 6 },
  btn: { background: 'none', border: '1px solid var(--border)', color: 'var(--text-secondary)', width: 30, height: 30, borderRadius: 'var(--radius-sm)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 },
  avatar: { width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg,var(--accent),var(--accent-2))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, cursor: 'pointer', flexShrink: 0 },
};
