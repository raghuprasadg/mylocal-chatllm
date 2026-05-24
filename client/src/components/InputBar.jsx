import { useRef, useEffect } from 'react';
import { modelIcon, tierColor, tierBg } from '../utils';

export default function InputBar({
  value,
  onChange,
  onSend,
  disabled,
  routePreview,
  routeEnabled,
  forceModel,
  onToggleRoute,
  onChangeForceModel,
  placeholder = 'Message ChatLLM…',
}) {
  const textareaRef = useRef(null);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 180) + 'px';
  }, [value]);

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!disabled && value.trim()) onSend();
    }
  };

  // Derive preview display
  const preview = routeEnabled ? routePreview : null;
  const manualModel = !routeEnabled ? forceModel : null;
  const previewKey = preview?.modelKey || manualModel;
  const previewLabel = preview?.model?.label || { haiku: 'Haiku 4.5', sonnet: 'Sonnet 4', opus: 'Opus 4' }[manualModel] || 'Sonnet 4';
  const previewScore = preview?.score;

  return (
    <div style={styles.area}>
      <div style={styles.wrap}>
        {/* Textarea + send */}
        <div style={styles.top}>
          <textarea
            ref={textareaRef}
            style={styles.textarea}
            rows={1}
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKey}
            disabled={disabled}
          />
          <button style={{ ...styles.sendBtn, ...(disabled || !value.trim() ? styles.sendBtnDisabled : {}) }} onClick={onSend} disabled={disabled || !value.trim()} title="Send">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 2L11 13" /><path d="M22 2L15 22 11 13 2 9l20-7z" />
            </svg>
          </button>
        </div>

        {/* Bottom toolbar */}
        <div style={styles.bottom}>
          {/* Route preview chip */}
          {previewKey && (
            <div style={{
              ...styles.routeChip,
              color: tierColor(previewKey),
              background: tierBg(previewKey),
              borderColor: tierColor(previewKey) + '66',
            }}>
              {modelIcon(previewKey)} {previewLabel}
              {previewScore !== undefined && (
                <span style={styles.routeScore}>· {previewScore}</span>
              )}
            </div>
          )}

          {/* RouteLLM toggle */}
          <button
            style={{ ...styles.toolBtn, ...(routeEnabled ? styles.toolBtnActive : {}) }}
            onClick={onToggleRoute}
            title={routeEnabled ? 'RouteLLM: Auto (click to switch to manual)' : 'Manual model (click for auto-routing)'}
          >
            <span style={{ ...styles.routeDot, background: routeEnabled ? 'var(--green)' : 'var(--text-muted)' }} />
            RouteLLM
          </button>

          {/* Manual model select */}
          {!routeEnabled && (
            <select
              style={styles.modelSelect}
              value={forceModel || 'sonnet'}
              onChange={(e) => onChangeForceModel(e.target.value)}
            >
              <option value="haiku">⚡ Haiku 4.5</option>
              <option value="sonnet">⚖️ Sonnet 4</option>
              <option value="opus">💎 Opus 4</option>
            </select>
          )}

          <button style={styles.toolBtn} onClick={() => alert('Web search coming soon')}>🔍 Search</button>
          <button style={styles.toolBtn} onClick={() => alert('File attach coming soon')}>📎 Attach</button>

          <span style={styles.hint}>↵ Send · ⇧↵ Newline</span>
        </div>
      </div>
    </div>
  );
}

const styles = {
  area: { padding: '9px 16px 14px', borderTop: '1px solid var(--border)', background: 'var(--bg-800)', flexShrink: 0 },
  wrap: { maxWidth: 830, margin: '0 auto', background: 'var(--bg-700)', border: '1px solid var(--border)', borderRadius: 13, transition: 'border-color var(--t), box-shadow var(--t)' },
  top: { display: 'flex', alignItems: 'flex-end', gap: 7, padding: '9px 10px 5px' },
  textarea: { flex: 1, background: 'none', border: 'none', outline: 'none', resize: 'none', fontFamily: 'var(--font)', fontSize: 13.5, color: 'var(--text-primary)', lineHeight: 1.6, maxHeight: 180, overflowY: 'auto', minHeight: 22, scrollbarWidth: 'thin' },
  sendBtn: { background: 'var(--accent)', border: 'none', borderRadius: 8, width: 31, height: 31, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff', flexShrink: 0, alignSelf: 'flex-end' },
  sendBtnDisabled: { background: 'var(--text-muted)', cursor: 'not-allowed' },
  bottom: { display: 'flex', alignItems: 'center', gap: 5, padding: '0 10px 7px', flexWrap: 'wrap' },
  routeChip: { display: 'flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 20, fontSize: 10.5, fontWeight: 700, fontFamily: 'var(--mono)', border: '1px solid', whiteSpace: 'nowrap' },
  routeScore: { opacity: 0.7 },
  toolBtn: { background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 11.5, padding: '3px 6px', borderRadius: 'var(--radius-xs)', display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'var(--font)' },
  toolBtnActive: { color: 'var(--accent)', background: 'var(--accent-glow)' },
  routeDot: { width: 6, height: 6, borderRadius: '50%', flexShrink: 0 },
  modelSelect: { background: 'var(--bg-600)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xs)', padding: '3px 22px 3px 7px', color: 'var(--text-primary)', fontFamily: 'var(--font)', fontSize: 11.5, cursor: 'pointer', outline: 'none', appearance: 'none' },
  hint: { marginLeft: 'auto', fontSize: 10, color: 'var(--text-muted)' },
};
