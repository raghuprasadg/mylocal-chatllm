import { useState } from 'react';
import { RouteBadge, RouteDecision, AgentSteps, TypingDots } from './RouteUI';
import { renderMarkdown, copyToClipboard } from '../utils';

export default function Message({ message, onRegen, agentEmoji, agentName }) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';
  const isError = message.isError;

  const handleCopy = async () => {
    await copyToClipboard(message.content || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div style={styles.row}>
      {/* Avatar */}
      <div style={{ ...styles.avatar, ...(isUser ? styles.avatarUser : styles.avatarAI) }}>
        {isUser ? 'U' : agentEmoji || '🧠'}
      </div>

      {/* Content */}
      <div style={styles.content}>
        {/* Meta row */}
        <div style={styles.meta}>
          <span style={styles.role}>{isUser ? 'You' : agentName || 'Claude'}</span>
          {!isUser && message.modelKey && (
            <RouteBadge
              modelKey={message.modelKey}
              modelLabel={message.modelLabel}
              score={message.score}
              showBar={true}
            />
          )}
          {message.isStreaming && (
            <span style={styles.streamingTag}>● streaming</span>
          )}
        </div>

        {/* Agent steps (shown during streaming) */}
        {!isUser && message.steps?.length > 0 && (
          <div style={styles.thinkingWrap}>
            <div style={styles.thinkingLabel}>
              <div style={styles.spinner} />
              {message.isStreaming ? 'Agent reasoning…' : 'RouteLLM trace'}
            </div>
            <AgentSteps steps={message.steps} />
          </div>
        )}

        {/* Route decision (chat mode, shown after completion) */}
        {!isUser && message.routeDecision && !message.steps && (
          <RouteDecision
            score={message.score}
            modelKey={message.modelKey}
            modelLabel={message.modelLabel}
            reason={message.routeDecision}
          />
        )}

        {/* Body */}
        {message.isStreaming && !message.content ? (
          <TypingDots />
        ) : isError ? (
          <div style={styles.errorBody}>⚠️ {message.content}</div>
        ) : isUser ? (
          <div style={styles.userBody}>{message.content}</div>
        ) : (
          <div
            className="md-body"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(message.content || '') }}
          />
        )}

        {/* Actions */}
        {!message.isStreaming && (
          <div style={styles.actions}>
            <button style={styles.actionBtn} onClick={handleCopy}>
              {copied ? '✓ Copied' : '📋 Copy'}
            </button>
            {!isUser && onRegen && (
              <button style={styles.actionBtn} onClick={onRegen}>↺ Regen</button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  row: { display: 'flex', padding: '5px 16px', gap: 10, maxWidth: 860, margin: '0 auto', width: '100%', animation: 'fadeUp 0.22s ease both' },
  avatar: { width: 29, height: 29, borderRadius: 8, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, marginTop: 2 },
  avatarUser: { background: 'linear-gradient(135deg,#2d4aaa,var(--accent))', fontSize: 11, fontWeight: 700 },
  avatarAI: { background: 'linear-gradient(135deg,#1a1448,var(--accent-2))', fontSize: 15 },
  content: { flex: 1, minWidth: 0, paddingTop: 2 },
  meta: { display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5, flexWrap: 'wrap' },
  role: { fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.05em', textTransform: 'uppercase' },
  streamingTag: { fontSize: 9.5, color: 'var(--green)', fontFamily: 'var(--mono)', animation: 'pulse 1.5s infinite' },
  thinkingWrap: { background: 'var(--bg-700)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '9px 12px', marginBottom: 9 },
  thinkingLabel: { fontSize: 9.5, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 5, display: 'flex', alignItems: 'center', gap: 5 },
  spinner: { width: 7, height: 7, border: '1.5px solid var(--accent)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' },
  errorBody: { color: 'var(--red)', fontSize: 14, lineHeight: 1.6 },
  userBody: { fontSize: 14, lineHeight: 1.72, color: 'var(--text-primary)', whiteSpace: 'pre-wrap', wordBreak: 'break-word' },
  actions: { display: 'flex', gap: 4, marginTop: 7, opacity: 0 },
  actionBtn: { background: 'none', border: '1px solid var(--border)', color: 'var(--text-muted)', padding: '2px 8px', borderRadius: 'var(--radius-xs)', fontSize: 10.5, cursor: 'pointer', fontFamily: 'var(--font)', display: 'flex', alignItems: 'center', gap: 3 },
};

// Make action buttons visible on row hover via CSS trick
const hoverStyle = document.createElement('style');
hoverStyle.textContent = `
  div:hover > div > div[style*="opacity: 0"] { opacity: 1 !important; }
  .md-body a { color: var(--accent); }
`;
document.head.appendChild(hoverStyle);
